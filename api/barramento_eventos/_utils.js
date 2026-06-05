const mysql = require("mysql2/promise");

let pool;
let sqliteDb;

// Mock em memória para barramento_eventos
const mockInscricoes = [];

function getPool() {
  if (process.env.DB_TYPE === "sqlite") {
    if (!sqliteDb) {
      const sqlite3 = require("sqlite3").verbose();
      const path = require("path");
      const dbPath = process.env.NODE_ENV === "production" 
        ? "/tmp/database.sqlite" 
        : path.join(process.cwd(), "database.sqlite");
      
      sqliteDb = new sqlite3.Database(dbPath);
      
      sqliteDb.serialize(() => {
        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS inscricoes (
            nome TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      });
    }
    return { type: "sqlite", db: sqliteDb };
  }

  if (!pool) {
    const host = process.env.DB_HOST || process.env.HOST;
    if (!host) {
      console.warn("DB_HOST não configurado. Barramento de Eventos usará MOCK.");
      return null;
    }

    const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined;
    pool = mysql.createPool({
      host,
      user: process.env.DB_USER || process.env.USER,
      password: process.env.DB_PASSWORD || process.env.PASSWORD,
      database: process.env.DB_NAME || process.env.DATABASE,
      port: Number(process.env.DB_PORT || 3306),
      ssl,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const dbConnection = getPool();
  if (!dbConnection) {
    const lowerSql = sql.toLowerCase();

    if (lowerSql.includes("select * from inscricoes")) {
      return [...mockInscricoes];
    }

    if (lowerSql.includes("insert into inscricoes")) {
      const [nome, url] = params;
      const idx = mockInscricoes.findIndex(i => i.nome === nome);
      if (idx >= 0) {
        mockInscricoes[idx].url = url;
      } else {
        mockInscricoes.push({ nome, url });
      }
      return { affectedRows: 1 };
    }

    return [];
  }

  if (dbConnection.type === "sqlite") {
    return new Promise((resolve, reject) => {
      // Para o barramento, o INSERT é na verdade um REPLACE ou INSERT ON CONFLICT
      // mas vamos manter o SQL vindo do chamador e apenas adaptar se necessário.
      // O chamador usa INSERT INTO inscricoes (nome, url) VALUES (?, ?) 
      // mas em MySQL isso costuma ter um ON DUPLICATE KEY UPDATE.
      // Vamos tentar um replace básico para SQLite se for o caso.
      let adjustedSql = sql;
      if (sql.toLowerCase().includes("on duplicate key update")) {
        adjustedSql = sql.split("on duplicate key update")[0].replace(/insert into/i, "INSERT OR REPLACE INTO");
      }

      dbConnection.db.all(adjustedSql, params, function(err, rows) {
        if (err) return reject(err);
        if (adjustedSql.toLowerCase().includes("insert") || adjustedSql.toLowerCase().includes("replace")) {
          resolve({ affectedRows: this?.changes || 0 });
        } else {
          resolve(rows);
        }
      });
    });
  }

  const [rows] = await dbConnection.query(sql, params);
  return rows;
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      if (!req.body) return Promise.resolve({});
      try { return Promise.resolve(JSON.parse(req.body)); } 
      catch (error) { return Promise.reject(new Error("Body JSON invalido")); }
    }
    return Promise.resolve(req.body || {});
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (!chunks.length) { resolve({}); return; }
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } 
      catch (error) { reject(new Error("Body JSON invalido")); }
    });
    req.on("error", reject);
  });
}

module.exports = {
  getPool,
  query,
  sendJson,
  readRequestBody,
};
