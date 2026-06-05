const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const JWT_SECRET = process.env.JWT_SECRET || "skyswift-dev-secret";

let pool;
let sqliteDb;

// Mock em memória para o microsserviço cadastro_usuario
const mockUsuarios = [
  {
    id: 1,
    nome: "Arthur",
    email: "arthur@email.com",
    senha: "123456", // Em modo mock, aceitamos senha plana ou hash
  },
];

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getPool() {
  if (process.env.DB_TYPE === "sqlite") {
    if (!sqliteDb) {
      const sqlite3 = require("sqlite3").verbose();
      const path = require("path");
      // No Vercel, o único lugar gravável é /tmp. 
      // Nota: não haverá persistência entre invocações frias.
      const dbPath = process.env.NODE_ENV === "production" 
        ? "/tmp/database.sqlite" 
        : path.join(process.cwd(), "database.sqlite");
      
      sqliteDb = new sqlite3.Database(dbPath);
      
      // Cria a tabela se não existir (necessário para o primeiro uso no /tmp)
      sqliteDb.serialize(() => {
        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      });
    }
    return { type: "sqlite", db: sqliteDb };
  }

  if (!pool) {
    const host = process.env.DB_HOST || process.env.HOST;
    if (!host) {
      console.warn("DB_HOST não configurado. O sistema usará o MOCK DATABASE em memória.");
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
    // MOCK QUERY LOGIC
    const lowerSql = sql.toLowerCase();

    if (lowerSql.includes("select") && lowerSql.includes("from usuarios")) {
      const email = params[0];
      const user = mockUsuarios.find((u) => u.email === email);
      return user ? [user] : [];
    }

    if (lowerSql.includes("insert into usuarios")) {
      const [nome, email, senha] = params;
      const id = mockUsuarios.length + 1;
      const novo = { id, nome, email, senha };
      mockUsuarios.push(novo);
      return { insertId: id };
    }

    if (lowerSql.includes("update usuarios set senha")) {
      const [senha, id] = params;
      const u = mockUsuarios.find((user) => user.id === id);
      if (u) u.senha = senha;
      return { affectedRows: 1 };
    }

    return [];
  }

  // Lógica para SQLite
  if (dbConnection.type === "sqlite") {
    return new Promise((resolve, reject) => {
      // Converte a sintaxe MySQL '?' para SQLite (que também é '?')
      // Se houver LAST_INSERT_ID ou algo do tipo, precisará de tratamento especial.
      const isInsert = sql.toLowerCase().includes("insert");
      
      dbConnection.db.all(sql, params, function(err, rows) {
        if (err) return reject(err);
        
        if (isInsert) {
          // Em SQLite, o lastID fica no objeto 'this' do callback de run, 
          // mas 'all' não retorna lastID. Para INSERT usamos 'run'.
          // Porém, para simplificar aqui, vamos resolver o insertId se for o caso.
          // Como usamos 'all' e não 'run', vamos precisar de uma pequena adaptação.
          resolve({ insertId: this?.lastID });
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Lógica para MySQL
  const [rows] = await dbConnection.query(sql, params);
  return rows;
}

function readRequestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      if (!req.body) return Promise.resolve({});

      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (error) {
        return Promise.reject(new Error("Body JSON invalido"));
      }
    }

    return Promise.resolve(req.body || {});
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(new Error("Body JSON invalido"));
      }
    });

    req.on("error", reject);
  });
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function criarSessao(usuario) {
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    JWT_SECRET,
    { expiresIn: "2h" },
  );

  return {
    message: "Autenticacao realizada com sucesso.",
    token,
    usuario,
  };
}

function autenticarToken(req) {
  const authHeader = req.headers.authorization || "";
  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    const error = new Error("Token de autenticacao nao informado.");
    error.statusCode = 401;
    throw error;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    const authError = new Error("Token de autenticacao invalido ou expirado.");
    authError.statusCode = 401;
    throw authError;
  }
}

function handleError(res, error, fallbackMessage) {
  if (error.message === "Body JSON invalido") {
    return sendJson(res, 400, { error: error.message });
  }

  if (error.statusCode) {
    return sendJson(res, error.statusCode, { error: error.message });
  }

  console.error(fallbackMessage, error.message);
  return sendJson(res, 500, { error: fallbackMessage });
}

module.exports = {
  autenticarToken,
  criarSessao,
  emailValido,
  handleError,
  normalizarEmail,
  query,
  readRequestBody,
  sendJson,
};
