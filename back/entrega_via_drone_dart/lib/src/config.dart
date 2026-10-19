/// Configuracao do microsservico lida das variaveis de ambiente.
///
/// Os nomes e valores padrao sao os mesmos da versao Node, para que os
/// manifests do Kubernetes e os scripts funcionem com as duas implementacoes.
library;

/// Provedores OSRM usados quando ROUTING_PROVIDERS nao e informado.
const provedoresPadrao = [
  'https://router.project-osrm.org/route/v1/driving',
  'http://router.project-osrm.org/route/v1/driving',
];

/// Valores imutaveis necessarios para iniciar o servico.
class Config {
  /// Nome usado na inscricao e como origem dos eventos no barramento.
  static const nomeServico = 'entrega_via_drone';

  /// Porta HTTP do servico; 0 escolhe uma porta livre (util em testes).
  final int porta;

  /// Endereco base do barramento de eventos.
  final String barramentoUrl;

  /// Endereco pelo qual o barramento alcanca este servico.
  final String servicoUrl;

  /// Lista ordenada de provedores OSRM tentados no calculo da rota.
  final List<String> provedoresRota;

  /// Tempo maximo de espera por cada provedor de rota.
  final Duration timeoutRoteamento;

  const Config({
    required this.porta,
    required this.barramentoUrl,
    required this.servicoUrl,
    required this.provedoresRota,
    this.timeoutRoteamento = const Duration(seconds: 5),
  });

  /// Monta a configuracao a partir de um mapa de ambiente
  /// (normalmente `Platform.environment`).
  factory Config.doAmbiente(Map<String, String> ambiente) {
    final porta = int.tryParse(ambiente['PORT'] ?? '') ?? 3002;
    final provedores = ambiente['ROUTING_PROVIDERS']
        ?.split(',')
        .map((provedor) => provedor.trim())
        .where((provedor) => provedor.isNotEmpty)
        .toList();

    return Config(
      porta: porta,
      barramentoUrl: ambiente['BARRAMENTO_URL'] ?? 'http://localhost:3001',
      servicoUrl: ambiente['SERVICE_URL'] ?? 'http://localhost:$porta',
      provedoresRota: provedores == null || provedores.isEmpty
          ? provedoresPadrao
          : provedores,
    );
  }
}
