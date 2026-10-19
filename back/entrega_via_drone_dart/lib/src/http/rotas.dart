/// Endpoints HTTP do microsservico de rotas.
///
/// Os caminhos, parametros e corpos das respostas espelham a versao Node,
/// para que o front, o proxy nginx e o servico de pedidos nao mudem.
library;

import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../barramento/barramento_client.dart';
import '../config.dart';
import 'respostas.dart';

/// Agrupa os endpoints e o estado compartilhado entre eles.
class ServicoRota {
  final BarramentoClient _barramento;

  /// Marcado no encerramento para o Kubernetes parar de enviar trafego.
  bool encerrando = false;

  ServicoRota(this._barramento);

  /// Roteador com todos os endpoints registrados.
  late final Handler handler = _montarRotas().call;

  Router _montarRotas() => Router(notFoundHandler: _naoEncontrado)
    ..get('/health', _health)
    ..get('/live', _live)
    ..get('/ready', _ready);

  /// Verificacao simples de que o processo responde.
  Response _health(Request _) =>
      respostaJson({'status': 'OK', 'message': 'Backend rodando'});

  /// Sonda de vida (livenessProbe): falha apenas durante o encerramento.
  Response _live(Request _) => respostaJson(
        {'service': Config.nomeServico, 'alive': !encerrando},
        status: encerrando ? 503 : 200,
      );

  /// Sonda de prontidao (readinessProbe): exige inscricao recente no
  /// barramento, senao os eventos publicados por outros servicos se perdem.
  Response _ready(Request _) {
    final erro = encerrando
        ? 'Encerrando'
        : !_barramento.inscricaoValida
            ? 'Inscricao no barramento indisponivel'
            : null;

    if (erro != null) {
      return respostaJson(
        {'service': Config.nomeServico, 'ready': false, 'error': erro},
        status: 503,
      );
    }
    return respostaJson({'service': Config.nomeServico, 'ready': true});
  }

  /// Caminhos desconhecidos respondem JSON, como o restante da API.
  Response _naoEncontrado(Request requisicao) => respostaJson(
        {'erro': 'Rota nao encontrada', 'servico': Config.nomeServico},
        status: 404,
      );
}
