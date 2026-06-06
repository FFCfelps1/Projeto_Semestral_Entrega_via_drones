// Importações
const express = require('express'); // Criar o servidor
const axios = require('axios');     // Fazer requisições HTTP para serviços externos e para o barramento
const cors = require('cors');       // Permitir que o frontend acesse esse backend

// Criação do servidor do primeiro microsserviço
const app = express();    // servidor Express
app.use(cors());          // libera chamadas vindas do front
app.use(express.json());  // permite receber JSON no corpo das requisições

const ROUTING_TIMEOUT_MS = 5000;                      // tempo limite para requisições de roteamento (5 segundos)
const BARRAMENTO_URL = 'http://localhost:3001';       // URL do barramento de eventos para publicação e inscrição
const ROUTING_PROVIDERS = [                           // OSRM -> calcular rotas rodoviarias
  "https://router.project-osrm.org/route/v1/driving",
  "http://router.project-osrm.org/route/v1/driving",  
];

//transforma para radianos
function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

// Calcula a distância entre dois pontos usando a fórmula de Haversine
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

// Cria uma rota alternativa caso o OSRM não responda
function buildFallbackRoute(origemLat, origemLng, destinoLat, destinoLng) {
  const distancia = haversineDistanceMeters(origemLat, origemLng, destinoLat, destinoLng);
  const velocidadeMediaDroneMps = 12; // ESTIMATIVA da velocidade média em m/s (43 km/h)
  const duracao = distancia / velocidadeMediaDroneMps;

  return {
    rota: [
      [origemLat, origemLng],
      [destinoLat, destinoLng],
    ],
    distancia,
    duracao,
    success: true,
    fallback: true,
    provider: "fallback-straight-line",
    aviso: "Rota aproximada usada por indisponibilidade do provedor externo.",
  };
}

// Publica um evento no barramento de eventos
async function publicarEvento(tipo, dados) {  // Nome do evento e Informações do evento
  try {
    await axios.post(`${BARRAMENTO_URL}/eventos`, {
      tipo,
      dados,
      origem: 'entrega_via_drone',
    });
    console.log(`[${new Date().toISOString()}] Evento publicado: ${tipo}`);
  } catch (erro) {
    console.error(`[${new Date().toISOString()}] Falha ao publicar evento: ${erro.message}`);
  }
}

// Endpoint para receber eventos do barramento
app.post('/eventos/receber', (req, res) => {
  const evento = req.body;

  if (!evento || !evento.tipo) {
    return res.status(400).json({ success: false, error: 'Evento invalido' });
  }

  console.log(`[${new Date().toISOString()}] Evento recebido do barramento: ${evento.tipo}`);
  res.json({ success: true, message: 'Evento recebido' });
});

// Endpoint de health check -> verificar se o backend está rodando
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend rodando' });
});

// Cria um endpoint para calcular rota
app.get('/rota', async (req, res) => {
  // recebe os dados pela URL
  const { origemLat, origemLng, destinoLat, destinoLng } = req.query;

  // Log da requisição recebida
  console.log(`[${new Date().toISOString()}] Nova requisição de rota:`, {
    origemLat,
    origemLng,
    destinoLat,
    destinoLng,
  });

  // Validação dos parâmetros - verifica se estão presentes
  if (!origemLat || !origemLng || !destinoLat || !destinoLng) {
    console.error("Parâmetros ausentes na requisição");
    return res.status(400).json({ erro: 'Coordenadas ausentes' });
  }

  // Validação dos parâmetros - verifica se são números válidos
  const origemLatNum  = Number(origemLat);
  const origemLngNum  = Number(origemLng);
  const destinoLatNum = Number(destinoLat);
  const destinoLngNum = Number(destinoLng);

  // Evita que o backend tente calcular rota com valores inválidos
  if (
    !Number.isFinite(origemLatNum) ||
    !Number.isFinite(origemLngNum) ||
    !Number.isFinite(destinoLatNum) ||
    !Number.isFinite(destinoLngNum)
  ) {
    return res.status(400).json({ erro: 'Coordenadas inválidas' });
  }

  try {
    // Tenta calcular a rota usando provedores de roteamento OSRM
    for (const providerBase of ROUTING_PROVIDERS) {
      const url = `${providerBase}/${origemLngNum},${origemLatNum};${destinoLngNum},${destinoLatNum}?overview=full&geometries=geojson`;

      try {
        console.log("Chamando provedor de rota:", url);

        const response = await axios.get(url, { timeout: ROUTING_TIMEOUT_MS });

        if (response.data && response.data.routes && response.data.routes[0]) {
          const rota = response.data.routes[0].geometry.coordinates.map((coord) => [coord[1], coord[0]]); // Inverte para [lat, lng] para o front
          const distancia = response.data.routes[0].distance; // distância em metros
          const duracao = response.data.routes[0].duration;   // duração em segundos

          console.log(`Rota calculada com sucesso. Pontos: ${rota.length}, Distância: ${distancia}m, Duração: ${duracao}s`);

          // Publica evento de rota calculada no barramento
          publicarEvento('RotaCalculada', {
            origemLat: origemLatNum,
            origemLng: origemLngNum,
            destinoLat: destinoLatNum,
            destinoLng: destinoLngNum,
            distancia,
            duracao,
            pontos: rota.length,
            fallback: false,
          });

          return res.json({
            rota,
            distancia,
            duracao,
            success: true,
            fallback: false,
            provider: providerBase,
          });
        }
      } catch (providerError) {
        console.error('Falha no provedor:', providerBase, providerError.message);
      }
    }

    // Se todos os provedores falharem, retorna uma rota aproximada (linha reta) e publica evento de fallback
    console.warn('Todos os provedores falharam. Retornando rota aproximada.');
    const rotaFallback = buildFallbackRoute(origemLatNum, origemLngNum, destinoLatNum, destinoLngNum);

    // Publica evento mesmo com rota fallback
    publicarEvento('RotaCalculada', {
      origemLat: origemLatNum,
      origemLng: origemLngNum,
      destinoLat: destinoLatNum,
      destinoLng: destinoLngNum,
      distancia: rotaFallback.distancia,
      duracao: rotaFallback.duracao,
      pontos: rotaFallback.rota.length,
      fallback: true,
    });

    return res.json(rotaFallback);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ erro: 'Erro ao calcular rota' });
  }
});

const PORT = 3002;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Map service rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Auto-inscricao no barramento de eventos -> registra esse microsserviço para receber eventos do barramento
  try {
    await axios.post(`${BARRAMENTO_URL}/inscricao`, {
      nome: 'entrega_via_drone',
      url: `http://localhost:${PORT}`,
    });
    console.log(`[${new Date().toISOString()}] Inscrito no barramento de eventos`);
  } catch (erro) {
    console.error(`[${new Date().toISOString()}] Falha ao se inscrever no barramento: ${erro.message}`);
  }
});