const { createRuntime } = require('../shared/runtime');
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3005);
const { pool } = require('./database');
const runtime = createRuntime({ app, name: 'gestao_de_pedidos', port: PORT,
  databaseReady: async () => { await pool.query('SELECT id FROM pedidos LIMIT 1'); },
  closeDatabase: () => pool.end(),
});

// Importa as rotas do arquivo separado
const pedidosRouter = require("./routes/pedidos");

// Registra as rotas no servidor
app.use("/", pedidosRouter);

// Inicia o servidor na porta definida no .env (ou 3005 como padrão)
runtime.listen();
