import 'dart:convert';

import 'package:entrega_via_drone_dart/src/barramento/barramento_client.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:test/test.dart';

void main() {
  group('publicar', () {
    test('envia tipo, dados e origem para POST /eventos', () async {
      late http.Request recebida;
      final cliente = BarramentoClient(
        MockClient((requisicao) async {
          recebida = requisicao;
          return http.Response('{"success":true}', 200);
        }),
        'http://barramento.test',
        'entrega_via_drone',
        'http://rota.test',
      );

      await cliente.publicar('RotaCalculada', {'pedidoId': 'p1'});

      expect(recebida.method, 'POST');
      expect(recebida.url.toString(), 'http://barramento.test/eventos');
      expect(jsonDecode(recebida.body), {
        'tipo': 'RotaCalculada',
        'dados': {'pedidoId': 'p1'},
        'origem': 'entrega_via_drone',
      });
    });

    test('nao propaga falha quando o barramento esta fora do ar', () async {
      final cliente = BarramentoClient(
        MockClient((_) async => throw http.ClientException('recusado')),
        'http://barramento.test',
        'entrega_via_drone',
        'http://rota.test',
      );

      await expectLater(cliente.publicar('RotaCalculada', {}), completes);
    });
  });

  group('inscricao', () {
    test('envia nome e url e passa a ser valida', () async {
      late Map<String, dynamic> corpo;
      final cliente = BarramentoClient(
        MockClient((requisicao) async {
          corpo = jsonDecode(requisicao.body) as Map<String, dynamic>;
          return http.Response('{"success":true}', 200);
        }),
        'http://barramento.test',
        'entrega_via_drone',
        'http://rota.test',
      );
      addTearDown(cliente.parar);

      expect(cliente.inscricaoValida, isFalse);
      await cliente.iniciarInscricao();

      expect(corpo, {'nome': 'entrega_via_drone', 'url': 'http://rota.test'});
      expect(cliente.inscricaoValida, isTrue);
    });

    test('expira quando a ultima inscricao tem mais de 15 segundos', () async {
      var agora = DateTime(2026, 10, 18, 12);
      final cliente = BarramentoClient(
        MockClient((_) async => http.Response('{}', 200)),
        'http://barramento.test',
        'entrega_via_drone',
        'http://rota.test',
        agora: () => agora,
      );
      addTearDown(cliente.parar);

      await cliente.iniciarInscricao();
      agora = agora.add(const Duration(seconds: 16));

      expect(cliente.inscricaoValida, isFalse);
    });

    test('fica invalida quando o barramento recusa a inscricao', () async {
      final cliente = BarramentoClient(
        MockClient((_) async => http.Response('', 503)),
        'http://barramento.test',
        'entrega_via_drone',
        'http://rota.test',
      );
      addTearDown(cliente.parar);

      await cliente.iniciarInscricao();

      expect(cliente.inscricaoValida, isFalse);
    });
  });
}
