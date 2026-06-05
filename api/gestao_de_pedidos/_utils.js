// ─────────────────────────────────────────────────────────────
// Utilitários compartilhados das funções serverless de gestao_de_pedidos
// Segue o mesmo padrão de api/cadastro_usuario/_utils.js:
//   - pool MySQL reutilizado entre invocações (cache do módulo)
//   - helpers de resposta JSON e leitura de body
// Aqui também ficam as regras de negócio (preço, tempo, status) que
// antes viviam no micro em memória (back/gestao_de_pedidos).
// ─────────────────────────────────────────────────────────────
const mysql = require("mysql2/promise");

let pool;
let sqliteDb;

// Mock em memória para gestao_de_pedidos (transiente por instância serverless)
const mockPedidos = [];

// Reaproveita o pool entre invocações da mesma instância serverless.
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
          CREATE TABLE IF NOT EXISTS pedidos (
            id TEXT PRIMARY KEY,
            item TEXT NOT NULL,
            peso REAL NOT NULL,
            origem TEXT NOT NULL,
            destino TEXT NOT NULL,
            tipo TEXT NOT NULL,
            observacoes TEXT,
            usuario_id INTEGER,
            status TEXT NOT NULL DEFAULT 'rascunho',
            preco_estimado REAL NOT NULL,
            tempo_estimado INTEGER NOT NULL,
            status_historico TEXT NOT NULL,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      console.warn("DB_HOST não configurado. Gestão de Pedidos usará MOCK DATABASE.");
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
    // Lógica simples de Mock
    const lowerSql = sql.toLowerCase();

    // SELECT por ID
    if (lowerSql.includes("select * from pedidos") && lowerSql.includes("where id = ?")) {
      const id = params[0];
      const p = mockPedidos.find((item) => item.id === id);
      return p ? [p] : [];
    }

    // SELECT Geral ou por Usuario
    if (lowerSql.includes("select * from pedidos")) {
      let result = [...mockPedidos];
      // Filtro básico de usuario_id se presente
      if (lowerSql.includes("usuario_id = ?")) {
        const uId = params[params.length - 1]; // Assume que uId é o último parâmetro se houver WHERE
        result = result.filter(p => p.usuario_id == uId);
      }
      return result.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    }

    // INSERT
    if (lowerSql.includes("insert into pedidos")) {
      const [id, item, peso, origem, destino, tipo, obs, uId, status, preco, tempo, hist] = params;
      const novo = {
        id, item, peso, origem, destino, tipo,
        observacoes: obs,
        usuario_id: uId,
        status,
        preco_estimado: preco,
        tempo_estimado: tempo,
        status_historico: JSON.parse(hist),
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      };
      mockPedidos.push(novo);
      return { affectedRows: 1 };
    }

    // UPDATE Status
    if (lowerSql.includes("update pedidos set status")) {
      const [status, hist, id] = params;
      const p = mockPedidos.find(item => item.id === id);
      if (p) {
        p.status = status;
        p.status_historico = JSON.parse(hist);
        p.atualizado_em = new Date().toISOString();
      }
      return { affectedRows: 1 };
    }

    return [];
  }

  if (dbConnection.type === "sqlite") {
    return new Promise((resolve, reject) => {
      // Pequeno ajuste para COALESCE ou outras funções MySQL se necessário
      const adjustedSql = sql.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");
      
      dbConnection.db.all(adjustedSql, params, function(err, rows) {
        if (err) return reject(err);
        if (adjustedSql.toLowerCase().includes("insert") || adjustedSql.toLowerCase().includes("update")) {
          resolve({ affectedRows: this?.changes || 0, insertId: this?.lastID });
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

// Padroniza respostas de erro (mesmo formato do micro original).
function responderErro(res, status, mensagem) {
  return sendJson(res, status, {
    erro: mensagem,
    status,
    timestamp: new Date().toISOString(),
  });
}

// Lê o body JSON da requisição, lidando com os formatos que a Vercel pode
// entregar (objeto já parseado, string, ou stream).
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
    req.on("data", (chunk) => chunks.push(chunk));
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

function handleError(res, error, fallbackMessage) {
  if (error.message === "Body JSON invalido") {
    return responderErro(res, 400, error.message);
  }
  if (error.statusCode) {
    return responderErro(res, error.statusCode, error.message);
  }
  console.error(fallbackMessage, error.message);
  return responderErro(res, 500, fallbackMessage);
}

// ─────────────────────────────────────────
// Regras de negócio (idênticas ao micro original, já corrigidas
// para os tipos padrao/expressa/prioritaria)
// ─────────────────────────────────────────
const STATUS = {
  RASCUNHO: "rascunho",
  CONFIRMADO: "confirmado",
  EM_PROCESSAMENTO: "em_processamento",
  EM_ROTA: "em_rota",
  ENTREGUE: "entregue",
  CANCELADO: "cancelado",
};

// Ordem válida de transição de status (cancelado é exceção à parte).
const ORDEM_STATUS = [
  STATUS.RASCUNHO,
  STATUS.CONFIRMADO,
  STATUS.EM_PROCESSAMENTO,
  STATUS.EM_ROTA,
  STATUS.ENTREGUE,
];

function calcularPreco(peso, tipo) {
  const precoBase = 10.0;
  const taxaPorKg = 5.0;
  const taxaTipo = { padrao: 1.0, expressa: 1.35, prioritaria: 1.65 };
  const multiplicador = taxaTipo[tipo] || 1.0;
  return ((precoBase + peso * taxaPorKg) * multiplicador).toFixed(2);
}

function calcularTempo(tipo) {
  const tempoPorTipo = { padrao: 45, expressa: 30, prioritaria: 20 };
  return tempoPorTipo[tipo] || 45;
}

// Emite evento no barramento (best-effort; não derruba a requisição).
async function emitirEvento(tipo, dados) {
  const barramentoUrl = process.env.BARRAMENTO_URL;
  if (!barramentoUrl) return;

  try {
    await fetch(`${barramentoUrl}/eventos`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tipo, dados, origem: "gestao_de_pedidos" }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    console.warn(`Erro ao emitir evento ${tipo}:`, error.message);
  }
}

// Converte a linha do banco (snake_case) para o formato camelCase que o
// front já espera — mantém compatibilidade total com o micro em memória.
function formatarPedido(row) {
  if (!row) return null;

  return {
    id: row.id,
    item: row.item,
    peso: Number(row.peso),
    origem: row.origem,
    destino: row.destino,
    tipo: row.tipo,
    observacoes: row.observacoes || "",
    usuarioId: row.usuario_id ?? null,
    status: row.status,
    precoEstimado: row.preco_estimado, // DECIMAL vem como string, igual ao original
    tempoEstimado: row.tempo_estimado,
    statusHistorico:
      typeof row.status_historico === "string"
        ? JSON.parse(row.status_historico)
        : row.status_historico,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

// Busca um pedido por id já formatado (ou null se não existir).
async function buscarPedidoPorId(id) {
  const rows = await query("SELECT * FROM pedidos WHERE id = ? LIMIT 1", [id]);
  return formatarPedido(rows[0]);
}

module.exports = {
  STATUS,
  ORDEM_STATUS,
  calcularPreco,
  calcularTempo,
  emitirEvento,
  formatarPedido,
  buscarPedidoPorId,
  query,
  sendJson,
  responderErro,
  readRequestBody,
  handleError,
};
