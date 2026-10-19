import 'dart:async';
import 'dart:convert';

import 'package:entrega_via_drone_dart/src/barramento/barramento_client.dart';
import 'package:entrega_via_drone_dart/src/http/aplicacao.dart';
import 'package:entrega_via_drone_dart/src/http/rotas.dart';
import 'package:entrega_via_drone_dart/src/rota/osrm_client.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shelf/shelf.dart';
import 'package:test/test.dart';

/// Monta o servico com OSRM e barramento simulados.
///
/// [osrmOk] define se o provedor responde com rota ou com HTTP 503.
/// Os eventos publicados no barramento sao enviados para [eventos].
({
  ServicoRota servico,
  Handler app,
  StreamController<Map<String, dynamic>> eventos
}) montar({bool osrmOk = true, bool barramentoOk = true}) {
  final eventos = StreamController<Map<String, dynamic>>.broadcast();

  final cliente = MockClient((requisicao) async {
    switch (requisicao.url.host) {
      case 'osrm.test':
        if (!osrmOk) return http.Response('', 503);
        return http.Response(
          jsonEncode({
            'routes': [
              {
                'geometry': {
                  'coordinates': [
                    [-46.63, -23.55],
                    [-46.64, -23.555],
                    [-46.65, -23.56],
                  ],
                },
                'distance': 2000,
                'duration': 100,
              },
            ],
          }),
          200,
        );
      case 'barramento.test':
        if (!barramentoOk) return http.Response('', 503);
        if (requisicao.url.path == '/eventos') {
          eventos.add(jsonDecode(requisicao.body) as Map<String, dynamic>);
        }
        return http.Response('{"success":true}', 200);
    }
    return http.Response('', 404);
  });

  final barramento = BarramentoClient(
    cliente,
    'http://barramento.test',
    'entrega_via_drone',
    'http://rota.test',
  );
  addTearDown(barramento.parar);
  addTearDown(eventos.close);

  final servico = ServicoRota(
    OsrmClient(cliente, ['http://osrm.test/route/v1/driving'],
        const Duration(seconds: 1)),
    barramento,
  );
  return (servico: servico, app: criarAplicacao(servico), eventos: eventos);
}

Future<(int, Map<String, dynamic>)> chamar(
  Handler app,
  String metodo,
  String caminho, {
  String? corpo,
}) async {
  final resposta = await app(
    Request(metodo, Uri.parse('http://localhost$caminho'), body: corpo),
  );
  final texto = await resposta.readAsString();
  return (
    resposta.statusCode,
    texto.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(texto) as Map<String, dynamic>,
  );
}

const consultaRota =
    '/rota?origemLat=-23.55&origemLng=-46.63&destinoLat=-23.56&destinoLng=-46.65';

void main() {
  group('GET /health', () {
    test('informa que o servico esta rodando', () async {
      final (status, corpo) = await chamar(montar().app, 'GET', '/health');
      expect(status, 200);
      expect(corpo, {'status': 'OK', 'message': 'Backend rodando'});
    });
  });

  group('sondas', () {
    test('/live e /ready respondem 503 no encerramento', () async {
      final m = montar();
      expect((await chamar(m.app, 'GET', '/live')).$1, 200);

      m.servico.encerrando = true;
      expect((await chamar(m.app, 'GET', '/live')).$1, 503);
      expect((await chamar(m.app, 'GET', '/ready')).$2['error'], 'Encerrando');
    });

    test('/ready so fica pronto depois da inscricao no barramento', () async {
      final barramento = BarramentoClient(
        MockClient((_) async => http.Response('{}', 200)),
        'http://barramento.test',
        'entrega_via_drone',
        'http://rota.test',
      );
      addTearDown(barramento.parar);
      final app = criarAplicacao(ServicoRota(
        OsrmClient(MockClient((_) async => http.Response('', 503)), [],
            const Duration(seconds: 1)),
        barramento,
      ));

      final (antes, erro) = await chamar(app, 'GET', '/ready');
      expect(antes, 503);
      expect(erro['error'], 'Inscricao no barramento indisponivel');

      await barramento.iniciarInscricao();
      final (status, corpo) = await chamar(app, 'GET', '/ready');
      expect(status, 200);
      expect(corpo, {'service': 'entrega_via_drone', 'ready': true});
    });
  });

  group('GET /rota', () {
    test('devolve a rota do OSRM e publica RotaCalculada com pedidoId',
        () async {
      final m = montar();
      final evento = m.eventos.stream.first;

      final (status, corpo) =
          await chamar(m.app, 'GET', '$consultaRota&pedidoId=pedido-teste');

      expect(status, 200);
      expect(corpo['fallback'], isFalse);
      expect(corpo['success'], isTrue);
      expect(corpo['rota'], hasLength(3));
      expect(corpo['distancia'], 2000);

      final publicado = await evento;
      expect(publicado['tipo'], 'RotaCalculada');
      expect(publicado['origem'], 'entrega_via_drone');
      expect(publicado['dados']['pedidoId'], 'pedido-teste');
      expect(publicado['dados']['pontos'], 3);
      expect(publicado['dados']['fallback'], isFalse);
    });

    test('usa a rota alternativa quando o OSRM falha', () async {
      final m = montar(osrmOk: false);
      final evento = m.eventos.stream.first;

      final (status, corpo) = await chamar(m.app, 'GET', consultaRota);

      expect(status, 200);
      expect(corpo['fallback'], isTrue);
      expect(corpo['provider'], 'fallback-straight-line');
      expect(corpo['rota'], hasLength(2));

      final publicado = await evento;
      expect(publicado['dados']['fallback'], isTrue);
      expect(publicado['dados'], isNot(contains('pedidoId')));
    });

    test('responde mesmo com o barramento fora do ar', () async {
      final (status, _) =
          await chamar(montar(barramentoOk: false).app, 'GET', consultaRota);
      expect(status, 200);
    });

    test('rejeita coordenadas ausentes ou invalidas com 400', () async {
      final app = montar().app;
      final (statusAusente, ausente) =
          await chamar(app, 'GET', '/rota?origemLat=1');
      expect(statusAusente, 400);
      expect(ausente, {'erro': 'Coordenadas ausentes'});

      final (statusInvalida, invalida) = await chamar(app, 'GET',
          '/rota?origemLat=x&origemLng=1&destinoLat=1&destinoLng=1');
      expect(statusInvalida, 400);
      expect(invalida, {'erro': 'Coordenadas inválidas'});
    });
  });

  group('POST /eventos/receber', () {
    test('aceita evento com tipo', () async {
      final (status, corpo) = await chamar(
          montar().app, 'POST', '/eventos/receber',
          corpo: jsonEncode({'tipo': 'PEDIDO_CRIADO', 'dados': {}}));
      expect(status, 200);
      expect(corpo['success'], isTrue);
    });

    test('rejeita corpo sem tipo ou que nao e JSON', () async {
      final app = montar().app;
      expect(
          (await chamar(app, 'POST', '/eventos/receber', corpo: '{}')).$1, 400);
      expect((await chamar(app, 'POST', '/eventos/receber', corpo: 'texto')).$1,
          400);
    });
  });

  group('geral', () {
    test('caminho desconhecido responde 404 em JSON', () async {
      final (status, corpo) = await chamar(montar().app, 'GET', '/inexistente');
      expect(status, 404);
      expect(corpo['erro'], 'Rota nao encontrada');
    });

    test('inclui CORS e responde ao preflight', () async {
      final app = montar().app;
      final resposta = await app(Request(
        'OPTIONS',
        Uri.parse('http://localhost/rota'),
        headers: {'access-control-request-headers': 'content-type'},
      ));
      expect(resposta.statusCode, 204);
      expect(resposta.headers['access-control-allow-origin'], '*');
      expect(resposta.headers['access-control-allow-headers'], 'content-type');

      final normal =
          await app(Request('GET', Uri.parse('http://localhost/health')));
      expect(normal.headers['access-control-allow-origin'], '*');
    });
  });
}
