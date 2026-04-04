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

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SkySwift-Routing/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ erro: "Metodo nao permitido" });
  }

  const origemLat = Number(req.query.origemLat);
  const origemLng = Number(req.query.origemLng);
  const destinoLat = Number(req.query.destinoLat);
  const destinoLng = Number(req.query.destinoLng);

  if (
    !Number.isFinite(origemLat) ||
    !Number.isFinite(origemLng) ||
    !Number.isFinite(destinoLat) ||
    !Number.isFinite(destinoLng)
  ) {
    return res.status(400).json({ erro: "Coordenadas invalidas" });
  }

  for (const providerBase of ROUTING_PROVIDERS) {
    const url = `${providerBase}/${origemLng},${origemLat};${destinoLng},${destinoLat}?overview=full&geometries=geojson`;

    try {
      const data = await fetchWithTimeout(url, ROUTING_TIMEOUT_MS);
      const route = data?.routes?.[0];

      if (route?.geometry?.coordinates?.length) {
        const rota = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

        return res.status(200).json({
          rota,
          distancia: route.distance,
          duracao: route.duration,
          success: true,
          fallback: false,
          provider: providerBase,
        });
      }
    } catch (error) {
      console.error("Falha no provedor de rota", providerBase, error.message);
    }
  }

  return res.status(200).json(buildFallbackRoute(origemLat, origemLng, destinoLat, destinoLng));
}
