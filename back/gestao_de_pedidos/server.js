require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;


// Banco em memória (substituir por DB futuramente)
let pedidos = [];

// Status possíveis de um pedido
const STATUS = {
  RASCUNHO: "rascunho",
  CONFIRMADO: "confirmado",
  EM_PROCESSAMENTO: "em_processamento",
  EM_ROTA: "em_rota",
  ENTREGUE: "entregue",
  CANCELADO: "cancelado",
};

// ─────────────────────────────────────────
// CRIAR PEDIDO
// ─────────────────────────────────────────
app.post("/pedidos", (req, res) => {
  const { item, peso, origem, destino, tipo, observacoes, usuarioId } = req.body;

  const novoPedido = {
    id: uuidv4(),
    item,
    peso,
    origem,
    destino,
    tipo,
    observacoes: observacoes || "",
    usuarioId: usuarioId || null,
    status: STATUS.RASCUNHO,
    /*new Date().toISOString() — gera a data/hora atual
    22:25 O new Date() cria um objeto com a data e hora atual. O .toISOString() converte esse objeto para uma string no formato padrão internacional:
    2026-05-19T22:35:10.123Z*/
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  pedidos.push(novoPedido);

  return res.status(201).json(novoPedido);
});
// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", servico: "gestao_pedidos" });
});

app.listen(PORT, () => {
  console.log(`✅ gestao_pedidos rodando na porta ${PORT}`);
});
