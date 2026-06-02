const mysql = require("mysql2/promise");

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || process.env.HOST,
      user: process.env.DB_USER || process.env.USER,
      password: process.env.DB_PASSWORD || process.env.PASSWORD,
      database: process.env.DB_NAME || process.env.DATABASE,
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    });
  }

  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      if (!req.body) return Promise.resolve({});
      return Promise.resolve(JSON.parse(req.body));
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
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function formatarNotificacao(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    mensagem: row.mensagem,
    pedidoId: row.pedido_id,
    eventoTipo: row.evento_tipo,
    lida: Boolean(row.lida),
    criadoEm: row.criado_em,
    lidaEm: row.lida_em,
  };
}

const BASE = "/api/notificacoes";

function getSegments(req) {
  const p = req.query && req.query.path;
  if (Array.isArray(p)) return p.filter(Boolean);
  if (typeof p === "string" && p) return p.split("/").filter(Boolean);
  const url = (req.url || "").split("?")[0];
  const rest = url.startsWith(BASE) ? url.slice(BASE.length) : url;
  return rest.split("/").filter(Boolean);
}

async function criarNotificacaoPedidoCriado(dados) {
  const pedidoId = dados.id || dados.pedidoId;
  if (!pedidoId) return null;

  const titulo = "Pedido criado";
  const mensagem = `Pedido ${pedidoId} criado com sucesso.`;

  const result = await query(
    `INSERT INTO notificacoes
      (titulo, mensagem, pedido_id, evento_tipo, lida)
     VALUES (?, ?, ?, ?, false)`,
    [titulo, mensagem, pedidoId, "PEDIDO_CRIADO"],
  );

  const rows = await query("SELECT * FROM notificacoes WHERE id = ? LIMIT 1", [result.insertId]);
  return formatarNotificacao(rows[0]);
}

module.exports = async function handler(req, res) {
  req.query = req.query || {};
  const segs = getSegments(req);

  try {
    if (segs.length === 0 || (segs.length === 1 && segs[0] === "health")) {
      await query("SELECT 1");
      return sendJson(res, 200, { status: "ok", servico: "notificacoes" });
    }

    if (segs[0] === "eventos" && segs[1] === "receber") {
      if (req.method !== "POST") return sendJson(res, 405, { erro: "Metodo nao permitido" });

      const { tipo, dados, payload } = await readRequestBody(req);
      const eventoDados = dados || payload || {};

      if (tipo === "PEDIDO_CRIADO") {
        const notificacao = await criarNotificacaoPedidoCriado(eventoDados);
        return sendJson(res, 201, { recebido: true, notificacao });
      }

      return sendJson(res, 200, { recebido: true, ignorado: true });
    }

    if (segs[0] === "notificacoes") {
      if (segs.length === 1 && req.method === "GET") {
        const rows = await query("SELECT * FROM notificacoes ORDER BY criado_em DESC");
        return sendJson(res, 200, rows.map(formatarNotificacao));
      }

      if (segs.length === 3 && segs[1] === "nao-lidas" && segs[2] === "contagem" && req.method === "GET") {
        const rows = await query("SELECT COUNT(*) AS total FROM notificacoes WHERE lida = false");
        return sendJson(res, 200, { total: Number(rows[0].total) });
      }

      if (segs.length === 2 && segs[1] === "ler-todas" && req.method === "PATCH") {
        const result = await query(
          "UPDATE notificacoes SET lida = true, lida_em = COALESCE(lida_em, CURRENT_TIMESTAMP) WHERE lida = false",
        );
        return sendJson(res, 200, {
          mensagem: "Notificacoes marcadas como lidas.",
          atualizadas: result.affectedRows,
        });
      }

      if (segs.length === 3 && segs[2] === "ler" && req.method === "PATCH") {
        const result = await query(
          "UPDATE notificacoes SET lida = true, lida_em = COALESCE(lida_em, CURRENT_TIMESTAMP) WHERE id = ?",
          [segs[1]],
        );

        if (result.affectedRows === 0) {
          return sendJson(res, 404, { erro: "Notificacao nao encontrada." });
        }

        const rows = await query("SELECT * FROM notificacoes WHERE id = ? LIMIT 1", [segs[1]]);
        return sendJson(res, 200, formatarNotificacao(rows[0]));
      }
    }

    return sendJson(res, 404, { erro: "Rota nao encontrada" });
  } catch (error) {
    console.error("Erro no microsservico de notificacoes:", error.message);
    return sendJson(res, 500, { erro: "Erro no microsservico de notificacoes." });
  }
};
