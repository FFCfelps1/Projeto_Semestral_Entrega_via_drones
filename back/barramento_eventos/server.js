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

// Endpoint para publicar um evento no barramento
// O evento é registrado no historico e distribuido para todos os inscritos
app.post('/eventos', async (req, res) => {
  const { tipo, dados, origem } = req.body;

  if (!tipo) {
    return res.status(400).json({
      success: false,
      error: 'Campo obrigatorio: tipo do evento',
    });
  }

  // Cria o registro do evento
  const evento = {
    id: historicoEventos.length + 1,
    tipo,
    dados: dados || {},
    origem: origem || 'desconhecido',
    timestamp: new Date().toISOString(),
  };

  // Salva no historico
  historicoEventos.push(evento);
  console.log(`[${evento.timestamp}] Evento recebido: ${tipo} de ${evento.origem}`);

  // Distribui o evento para todos os servicos inscritos
  const resultados = await distribuirEvento(evento);

  return res.json({
    success: true,
    evento,
    distribuicao: resultados,
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
