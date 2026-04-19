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

// Endpoint para inscrever um serviço no barramento
// Cada serviço envia seu nome e url para receber eventos
app.post('/inscricao', (req, res) => {
  const { nome, url } = req.body;

  if (!nome || !url) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatorios: nome e url',
    });
  }

  // Verifica se o serviço ja esta inscrito
  const jaInscrito = inscricoes.find((s) => s.nome === nome);

  if (jaInscrito) {
    // Atualiza a url caso tenha mudado
    jaInscrito.url = url;
    console.log(`[${new Date().toISOString()}] Servico atualizado: ${nome} -> ${url}`);

    return res.json({
      success: true,
      message: `Servico ${nome} atualizado com sucesso`,
      inscricoes: inscricoes.length,
    });
  }

  inscricoes.push({ nome, url });
  console.log(`[${new Date().toISOString()}] Novo servico inscrito: ${nome} -> ${url}`);

  return res.json({
    success: true,
    message: `Servico ${nome} inscrito com sucesso`,
    inscricoes: inscricoes.length,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Barramento de eventos rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
