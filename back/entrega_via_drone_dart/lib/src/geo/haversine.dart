/// Calculos geograficos usados na estimativa de rotas.
library;

import 'dart:math' as math;

/// Raio medio da Terra em metros.
const raioTerraMetros = 6371000.0;

/// Converte um angulo de graus para radianos.
double paraRadianos(double graus) => graus * math.pi / 180;

/// Distancia em metros entre dois pontos pela formula de Haversine,
/// que considera a curvatura da Terra (aproximada como uma esfera).
double distanciaHaversineMetros(
  double lat1,
  double lon1,
  double lat2,
  double lon2,
) {
  final dLat = paraRadianos(lat2 - lat1);
  final dLon = paraRadianos(lon2 - lon1);

  final a = math.pow(math.sin(dLat / 2), 2) +
      math.cos(paraRadianos(lat1)) *
          math.cos(paraRadianos(lat2)) *
          math.pow(math.sin(dLon / 2), 2);
  final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));

  return raioTerraMetros * c;
}
