const { createRuntime } = require('../shared/runtime');
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3005);
const runtime = createRuntime({ app, name: 'gestao_de_pedidos', port: PORT });

// Importa as rotas do arquivo separado
const pedidosRouter = require("./routes/pedidos");

// Registra as rotas no servidor
app.use("/", pedidosRouter);

// Inicia o servidor na porta definida no .env (ou 3005 como padrão)
runtime.listen();
