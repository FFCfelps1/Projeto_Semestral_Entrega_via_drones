/// Endpoints HTTP do microsservico de rotas.
///
/// Os caminhos, parametros e corpos das respostas espelham a versao Node,
/// para que o front, o proxy nginx e o servico de pedidos nao mudem.
library;

import 'dart:async';

import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../barramento/barramento_client.dart';
import '../config.dart';
import '../log.dart';
import '../rota/osrm_client.dart';
import '../rota/parametros_rota.dart';
import '../rota/resultado_rota.dart';
import '../rota/rota_fallback.dart';
import 'respostas.dart';

/// Agrupa os endpoints e o estado compartilhado entre eles.
class ServicoRota {
  final OsrmClient _osrm;
  final BarramentoClient _barramento;

  /// Marcado no encerramento para o Kubernetes parar de enviar trafego.
  bool encerrando = false;

  ServicoRota(this._osrm, this._barramento);

  /// Roteador com todos os endpoints registrados.
  late final Handler handler = _montarRotas().call;

  Router _montarRotas() => Router(notFoundHandler: _naoEncontrado)
    ..get('/health', _health)
    ..get('/live', _live)
    ..get('/ready', _ready)
    ..get('/rota', _rota);

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

  /// Calcula a rota entre origem e destino.
  ///
  /// Tenta os provedores OSRM em ordem e, se todos falharem, devolve a rota
  /// aproximada em linha reta em vez de um erro, para o mapa sempre ter o
  /// que exibir.
  Future<Response> _rota(Request requisicao) async {
    final ParametrosRota parametros;
    try {
      parametros = ParametrosRota.daQuery(requisicao.url.queryParameters);
    } on ParametrosInvalidos catch (erro) {
      registrarErro('Parametros de rota invalidos: ${erro.mensagem}');
      return respostaJson({'erro': erro.mensagem}, status: 400);
    }

    try {
      final resultado = await _osrm.calcular(
            parametros.origemLat,
            parametros.origemLng,
            parametros.destinoLat,
            parametros.destinoLng,
          ) ??
          _fallback(parametros);

      // Nao aguarda o barramento: a resposta ao usuario nao depende dele.
      unawaited(_publicarRotaCalculada(parametros, resultado));
      return respostaJson(resultado.toJson());
    } catch (erro) {
      registrarErro('Erro ao calcular rota: $erro');
      return respostaJson({'erro': 'Erro ao calcular rota'}, status: 500);
    }
  }

  /// Rota aproximada usada quando nenhum provedor respondeu.
  ResultadoRota _fallback(ParametrosRota parametros) {
    registrarErro('Todos os provedores falharam. Retornando rota aproximada.');
    return construirRotaFallback(
      parametros.origemLat,
      parametros.origemLng,
      parametros.destinoLat,
      parametros.destinoLng,
    );
  }

  /// Publica RotaCalculada com o mesmo formato de dados da versao Node.
  /// O servico de pedidos usa o `pedidoId` para mover o pedido para em_rota.
  Future<void> _publicarRotaCalculada(
    ParametrosRota parametros,
    ResultadoRota resultado,
  ) =>
      _barramento.publicar('RotaCalculada', {
        if (parametros.pedidoId != null) 'pedidoId': parametros.pedidoId,
        'origemLat': parametros.origemLat,
        'origemLng': parametros.origemLng,
        'destinoLat': parametros.destinoLat,
        'destinoLng': parametros.destinoLng,
        'distancia': resultado.distancia,
        'duracao': resultado.duracao,
        'pontos': resultado.rota.length,
        'fallback': resultado.fallback,
      });

  /// Caminhos desconhecidos respondem JSON, como o restante da API.
  Response _naoEncontrado(Request requisicao) => respostaJson(
        {'erro': 'Rota nao encontrada', 'servico': Config.nomeServico},
        status: 404,
      );
}
