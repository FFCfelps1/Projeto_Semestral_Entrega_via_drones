require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;
// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", servico: "gestao_pedidos" });
});

app.listen(PORT, () => {
  console.log(`✅ gestao_pedidos rodando na porta ${PORT}`);
});
