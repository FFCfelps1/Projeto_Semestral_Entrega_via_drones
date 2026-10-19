/// Estimativa local usada quando nenhum provedor OSRM responde.
library;

import '../geo/haversine.dart';
import 'resultado_rota.dart';

/// Velocidade media estimada do drone em m/s (cerca de 43 km/h).
const velocidadeMediaDroneMps = 12.0;

/// Identificador do provedor informado na resposta de fallback.
const provedorFallback = 'fallback-straight-line';

/// Monta uma rota em linha reta entre origem e destino.
///
/// O drone voa sem seguir ruas, entao a linha reta e uma aproximacao
/// aceitavel enquanto o provedor externo esta indisponivel.
ResultadoRota construirRotaFallback(
  double origemLat,
  double origemLng,
  double destinoLat,
  double destinoLng,
) {
  final distancia =
      distanciaHaversineMetros(origemLat, origemLng, destinoLat, destinoLng);

  return ResultadoRota(
    rota: [
      [origemLat, origemLng],
      [destinoLat, destinoLng],
    ],
    distancia: distancia,
    duracao: distancia / velocidadeMediaDroneMps,
    fallback: true,
    provedor: provedorFallback,
    aviso: 'Rota aproximada usada por indisponibilidade do provedor externo.',
  );
}
