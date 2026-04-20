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

// Distribui um evento para todos os servicos inscritos
// Pula o servico que originou o evento para evitar loop
async function distribuirEvento(evento) {
  const resultados = [];

  for (const servico of inscricoes) {
    // Nao envia o evento de volta para o servico que o publicou
    if (servico.nome === evento.origem) {
      continue;
    }

    try {
      await axios.post(`${servico.url}/eventos/receber`, evento, {
        timeout: 5000,
      });

      console.log(`[${new Date().toISOString()}] Evento ${evento.tipo} entregue para ${servico.nome}`);
      resultados.push({ servico: servico.nome, status: 'entregue' });
    } catch (erro) {
      console.error(`[${new Date().toISOString()}] Falha ao entregar evento para ${servico.nome}: ${erro.message}`);
      resultados.push({ servico: servico.nome, status: 'falha', erro: erro.message });
    }
  }

  return resultados;
}

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

// Endpoint para consultar historico de eventos
// Permite filtrar por tipo e limitar quantidade
app.get('/eventos', (req, res) => {
  const { tipo, limite } = req.query;

  let eventos = [...historicoEventos];

  // Filtra por tipo se informado
  if (tipo) {
    eventos = eventos.filter((e) => e.tipo === tipo);
  }

  // Ordena do mais recente para o mais antigo
  eventos.reverse();

  // Limita quantidade se informado
  if (limite) {
    const limiteNum = Number(limite);
    if (Number.isFinite(limiteNum) && limiteNum > 0) {
      eventos = eventos.slice(0, limiteNum);
    }
  }

  return res.json({
    success: true,
    total: eventos.length,
    eventos,
  });
});

// Endpoint para listar servicos inscritos
app.get('/inscricoes', (req, res) => {
  return res.json({
    success: true,
    total: inscricoes.length,
    inscricoes,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Barramento de eventos rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
