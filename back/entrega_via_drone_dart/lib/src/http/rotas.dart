/// Endpoints HTTP do microsservico de rotas.
///
/// Os caminhos, parametros e corpos das respostas espelham a versao Node,
/// para que o front, o proxy nginx e o servico de pedidos nao mudem.
library;

import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../config.dart';
import 'respostas.dart';

/// Agrupa os endpoints e o estado compartilhado entre eles.
class ServicoRota {
  /// Roteador com todos os endpoints registrados.
  late final Handler handler = _montarRotas().call;

  Router _montarRotas() =>
      Router(notFoundHandler: _naoEncontrado)..get('/health', _health);

  /// Verificacao simples de que o processo responde.
  Response _health(Request _) =>
      respostaJson({'status': 'OK', 'message': 'Backend rodando'});

  /// Caminhos desconhecidos respondem JSON, como o restante da API.
  Response _naoEncontrado(Request requisicao) => respostaJson(
        {'erro': 'Rota nao encontrada', 'servico': Config.nomeServico},
        status: 404,
      );
}
