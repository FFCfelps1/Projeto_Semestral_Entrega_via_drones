// Microsserviço de Barramento de Eventos
// Responsável por receber e distribuir eventos entre os microsserviços

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Lista de serviços inscritos no barramento
// Cada inscricao: { nome, url }
const inscricoes = [];

// Histórico de eventos publicados
const historicoEventos = [];

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Barramento de eventos rodando',
    inscricoes: inscricoes.length,
    eventosRegistrados: historicoEventos.length,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Barramento de eventos rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
