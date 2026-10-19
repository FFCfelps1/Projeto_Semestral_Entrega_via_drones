/// Modelo da rota devolvida ao front e usada no evento RotaCalculada.
library;

/// Ponto geografico no formato [latitude, longitude], o mesmo usado pelo
/// mapa do front.
typedef Coordenada = List<double>;

/// Resultado de um calculo de rota, seja do OSRM ou da estimativa local.
class ResultadoRota {
  /// Pontos da rota em ordem, cada um como [lat, lng].
  final List<Coordenada> rota;

  /// Distancia total em metros.
  final double distancia;

  /// Duracao estimada em segundos.
  final double duracao;

  /// Indica se a rota e a estimativa em linha reta (provedores indisponiveis).
  final bool fallback;

  /// Provedor que produziu a rota (URL do OSRM ou identificador do fallback).
  final String provedor;

  /// Mensagem opcional exibida ao usuario quando a rota e aproximada.
  final String? aviso;

  const ResultadoRota({
    required this.rota,
    required this.distancia,
    required this.duracao,
    required this.fallback,
    required this.provedor,
    this.aviso,
  });

  /// Corpo JSON da resposta de GET /rota, com as mesmas chaves da versao Node.
  Map<String, Object?> toJson() => {
        'rota': rota,
        'distancia': distancia,
        'duracao': duracao,
        'success': true,
        'fallback': fallback,
        'provider': provedor,
        if (aviso != null) 'aviso': aviso,
      };
}
