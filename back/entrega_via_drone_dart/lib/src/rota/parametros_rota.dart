/// Leitura e validacao dos parametros de GET /rota.
library;

/// Erro de validacao com a mensagem devolvida ao cliente (HTTP 400).
class ParametrosInvalidos implements Exception {
  final String mensagem;
  const ParametrosInvalidos(this.mensagem);

  @override
  String toString() => mensagem;
}

/// Coordenadas de origem e destino ja convertidas, e o pedido opcional.
class ParametrosRota {
  final double origemLat;
  final double origemLng;
  final double destinoLat;
  final double destinoLng;

  /// Pedido que originou o calculo; repassado no evento RotaCalculada para
  /// o servico de pedidos mover o pedido para `em_rota`.
  final String? pedidoId;

  const ParametrosRota({
    required this.origemLat,
    required this.origemLng,
    required this.destinoLat,
    required this.destinoLng,
    this.pedidoId,
  });

  /// Valida a query string com as mesmas regras e mensagens da versao Node.
  ///
  /// Lanca [ParametrosInvalidos] quando falta alguma coordenada ou quando
  /// alguma delas nao e um numero finito.
  factory ParametrosRota.daQuery(Map<String, String> query) {
    const nomes = ['origemLat', 'origemLng', 'destinoLat', 'destinoLng'];

    if (nomes.any((nome) => (query[nome] ?? '').isEmpty)) {
      throw const ParametrosInvalidos('Coordenadas ausentes');
    }

    final valores = [for (final nome in nomes) double.tryParse(query[nome]!)];
    if (valores.any((valor) => valor == null || !valor.isFinite)) {
      throw const ParametrosInvalidos('Coordenadas inválidas');
    }

    final pedidoId = query['pedidoId'];
    return ParametrosRota(
      origemLat: valores[0]!,
      origemLng: valores[1]!,
      destinoLat: valores[2]!,
      destinoLng: valores[3]!,
      pedidoId: pedidoId == null || pedidoId.isEmpty ? null : pedidoId,
    );
  }
}
