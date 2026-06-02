require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3006);
const SERVICE_URL = process.env.SERVICE_URL || `http://localhost:${PORT}`;
const BARRAMENTO_URL = process.env.BARRAMENTO_URL || "http://localhost:3001";
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS || 5000);

let pool;
let conectandoBanco = false;

async function conectarBanco() {
  if (pool || conectandoBanco) return pool;

  conectandoBanco = true;

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || process.env.HOST,
      user: process.env.DB_USER || process.env.USER,
      password: process.env.DB_PASSWORD || process.env.PASSWORD,
      database: process.env.DB_NAME || process.env.DATABASE,
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    });
    await pool.query("SELECT 1");
    console.log("Conectado ao MySQL");
  } catch (error) {
    pool = null;
    console.log(`Erro ao conectar com o banco: ${error.message}`);
    setTimeout(conectarBanco, DB_RETRY_MS);
  } finally {
    conectandoBanco = false;
  }

  return pool;
}

async function obterBanco() {
  if (!pool) {
    await conectarBanco();
  }

  return pool;
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

async function criarNotificacaoPedidoCriado(dados) {
  const pedidoId = dados.id || dados.pedidoId;
  if (!pedidoId) return null;

  const titulo = "Pedido criado";
  const mensagem = `Pedido ${pedidoId} criado com sucesso.`;
  const banco = await obterBanco();

  if (!banco) {
    throw new Error("Banco de dados indisponivel.");
  }

  const [resultado] = await banco.query(
    `INSERT INTO notificacoes
      (titulo, mensagem, pedido_id, evento_tipo, lida)
     VALUES (?, ?, ?, ?, false)`,
    [titulo, mensagem, pedidoId, "PEDIDO_CRIADO"],
  );

  const [rows] = await banco.query("SELECT * FROM notificacoes WHERE id = ? LIMIT 1", [resultado.insertId]);
  return formatarNotificacao(rows[0]);
}

app.get("/health", async (req, res) => {
  try {
    const banco = await obterBanco();

    if (!banco) {
      throw new Error("Banco de dados indisponivel.");
    }

    await banco.query("SELECT 1");
    res.json({ status: "ok", servico: "notificacoes" });
  } catch (error) {
    res.status(503).json({
      status: "erro",
      servico: "notificacoes",
      error: "Banco de dados indisponivel.",
    });
  }
});

app.use(async (req, res, next) => {
  const banco = await obterBanco();

  if (!banco) {
    return res.status(503).json({ erro: "Banco de dados indisponivel." });
  }

  next();
});

app.get("/notificacoes", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notificacoes ORDER BY criado_em DESC");
    res.json(rows.map(formatarNotificacao));
  } catch (error) {
    console.log("Erro ao listar notificacoes:", error.message);
    res.status(500).json({ erro: "Erro ao listar notificacoes." });
  }
});

app.get("/notificacoes/nao-lidas/contagem", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM notificacoes WHERE lida = false");
    res.json({ total: Number(rows[0].total) });
  } catch (error) {
    console.log("Erro ao contar notificacoes:", error.message);
    res.status(500).json({ erro: "Erro ao contar notificacoes." });
  }
});

app.patch("/notificacoes/:id/ler", async (req, res) => {
  try {
    const [resultado] = await pool.query(
      "UPDATE notificacoes SET lida = true, lida_em = COALESCE(lida_em, CURRENT_TIMESTAMP) WHERE id = ?",
      [req.params.id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: "Notificacao nao encontrada." });
    }

    const [rows] = await pool.query("SELECT * FROM notificacoes WHERE id = ? LIMIT 1", [req.params.id]);
    res.json(formatarNotificacao(rows[0]));
  } catch (error) {
    console.log("Erro ao marcar notificacao como lida:", error.message);
    res.status(500).json({ erro: "Erro ao marcar notificacao como lida." });
  }
});

app.patch("/notificacoes/ler-todas", async (req, res) => {
  try {
    const [resultado] = await pool.query(
      "UPDATE notificacoes SET lida = true, lida_em = COALESCE(lida_em, CURRENT_TIMESTAMP) WHERE lida = false",
    );

    res.json({
      mensagem: "Notificacoes marcadas como lidas.",
      atualizadas: resultado.affectedRows,
    });
  } catch (error) {
    console.log("Erro ao marcar todas as notificacoes como lidas:", error.message);
    res.status(500).json({ erro: "Erro ao marcar todas as notificacoes como lidas." });
  }
});

app.post("/eventos/receber", async (req, res) => {
  const { tipo, dados, payload } = req.body || {};
  const eventoDados = dados || payload || {};

  try {
    if (tipo === "PEDIDO_CRIADO") {
      const notificacao = await criarNotificacaoPedidoCriado(eventoDados);
      return res.status(201).json({ recebido: true, notificacao });
    }

    return res.json({ recebido: true, ignorado: true });
  } catch (error) {
    console.log("Erro ao receber evento:", error.message);
    return res.status(500).json({ erro: "Erro ao receber evento." });
  }
});

async function inscreverNoBarramento() {
  try {
    await axios.post(`${BARRAMENTO_URL}/inscricao`, {
      nome: "notificacoes",
      url: SERVICE_URL,
    });
    console.log("Inscrito no barramento de eventos");
  } catch (error) {
    console.log("Erro ao inscrever no barramento:", error.message);
  }
}

conectarBanco();

app.listen(PORT, () => {
  console.log(`notificacoes rodando na porta ${PORT}`);
  inscreverNoBarramento();
});
