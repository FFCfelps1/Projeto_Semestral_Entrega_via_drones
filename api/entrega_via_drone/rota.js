const ROUTING_TIMEOUT_MS = 5000;
const ROUTING_PROVIDERS = [
  "https://router.project-osrm.org/route/v1/driving",
  "http://router.project-osrm.org/route/v1/driving",
];

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

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

function buildFallbackRoute(origemLat, origemLng, destinoLat, destinoLng) {
  const distancia = haversineDistanceMeters(origemLat, origemLng, destinoLat, destinoLng);
  const velocidadeMediaDroneMps = 12;
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

async function publishEvent(tipo, dados) {
  const barramentoUrl = process.env.BARRAMENTO_URL;

  if (!barramentoUrl) {
    return;
  }

  try {
    await fetch(`${barramentoUrl}/eventos`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        tipo,
        dados,
        origem: "entrega_via_drone",
      }),
    });
  } catch (error) {
    console.error("Falha ao publicar evento:", error.message);
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { success: false, error: "Metodo nao permitido" });
  }

  const { origemLat, origemLng, destinoLat, destinoLng } = req.query || {};

  if (!origemLat || !origemLng || !destinoLat || !destinoLng) {
    return sendJson(res, 400, { erro: "Coordenadas ausentes" });
  }

  const origemLatNum = Number(origemLat);
  const origemLngNum = Number(origemLng);
  const destinoLatNum = Number(destinoLat);
  const destinoLngNum = Number(destinoLng);

  if (
    !Number.isFinite(origemLatNum) ||
    !Number.isFinite(origemLngNum) ||
    !Number.isFinite(destinoLatNum) ||
    !Number.isFinite(destinoLngNum)
  ) {
    return sendJson(res, 400, { erro: "Coordenadas invalidas" });
  }

  for (const providerBase of ROUTING_PROVIDERS) {
    const url = `${providerBase}/${origemLngNum},${origemLatNum};${destinoLngNum},${destinoLatNum}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ROUTING_TIMEOUT_MS);

    try {
      const providerResponse = await fetch(url, { signal: controller.signal });

      if (!providerResponse.ok) {
        throw new Error(`HTTP ${providerResponse.status}`);
      }

      const providerData = await providerResponse.json();
      const firstRoute = providerData?.routes?.[0];

      if (firstRoute?.geometry?.coordinates?.length > 1) {
        const rota = firstRoute.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
        const distancia = firstRoute.distance;
        const duracao = firstRoute.duration;

        publishEvent("RotaCalculada", {
          origemLat: origemLatNum,
          origemLng: origemLngNum,
          destinoLat: destinoLatNum,
          destinoLng: destinoLngNum,
          distancia,
          duracao,
          pontos: rota.length,
          fallback: false,
        });

        clearTimeout(timeoutId);
        return sendJson(res, 200, {
          rota,
          distancia,
          duracao,
          success: true,
          fallback: false,
          provider: providerBase,
        });
      }
    } catch (error) {
      console.error("Falha no provedor:", providerBase, error.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const rotaFallback = buildFallbackRoute(origemLatNum, origemLngNum, destinoLatNum, destinoLngNum);

  publishEvent("RotaCalculada", {
    origemLat: origemLatNum,
    origemLng: origemLngNum,
    destinoLat: destinoLatNum,
    destinoLng: destinoLngNum,
    distancia: rotaFallback.distancia,
    duracao: rotaFallback.duracao,
    pontos: rotaFallback.rota.length,
    fallback: true,
  });

  return sendJson(res, 200, rotaFallback);
};
