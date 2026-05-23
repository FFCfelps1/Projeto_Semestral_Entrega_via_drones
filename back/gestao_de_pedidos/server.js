require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;

// Importa as rotas do arquivo separado
const pedidosRouter = require("./routes/pedidos");

// Registra as rotas no servidor
app.use("/", pedidosRouter);

// Inicia o servidor na porta definida no .env (ou 3005 como padrão)
app.listen(PORT, () => {
  console.log(`✅ gestao_pedidos rodando na porta ${PORT}`);
});