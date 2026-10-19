import 'dart:convert';

import 'package:entrega_via_drone_dart/src/rota/osrm_client.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:test/test.dart';

/// Resposta minima no formato do OSRM, com coordenadas em [lng, lat].
final respostaOsrm = jsonEncode({
  'routes': [
    {
      'geometry': {
        'coordinates': [
          [-46.63, -23.55],
          [-46.65, -23.56],
        ],
      },
      'distance': 2000,
      'duration': 100,
    },
  ],
});

void main() {
  const timeout = Duration(seconds: 1);

  test('monta a url do OSRM e inverte as coordenadas para [lat, lng]',
      () async {
    late Uri chamada;
    final cliente = OsrmClient(
      MockClient((requisicao) async {
        chamada = requisicao.url;
        return http.Response(respostaOsrm, 200);
      }),
      ['http://osrm.test/route/v1/driving'],
      timeout,
    );

    final resultado = await cliente.calcular(-23.55, -46.63, -23.56, -46.65);

    expect(chamada.path, '/route/v1/driving/-46.63,-23.55;-46.65,-23.56');
    expect(chamada.queryParameters['geometries'], 'geojson');
    expect(resultado!.rota, [
      [-23.55, -46.63],
      [-23.56, -46.65],
    ]);
    expect(resultado.distancia, 2000);
    expect(resultado.duracao, 100);
    expect(resultado.fallback, isFalse);
  });

  test('tenta o proximo provedor quando o primeiro falha', () async {
    final cliente = OsrmClient(
      MockClient((requisicao) async => requisicao.url.host == 'falho.test'
          ? http.Response('', 503)
          : http.Response(respostaOsrm, 200)),
      ['http://falho.test', 'http://ok.test'],
      timeout,
    );

    final resultado = await cliente.calcular(-23.55, -46.63, -23.56, -46.65);

    expect(resultado!.provedor, 'http://ok.test');
  });

  test('retorna null quando nenhum provedor devolve rota', () async {
    final cliente = OsrmClient(
      MockClient((_) async => http.Response('{"routes":[]}', 200)),
      ['http://vazio.test'],
      timeout,
    );

    expect(await cliente.calcular(0, 0, 1, 1), isNull);
  });

  test('respeita o tempo limite do provedor', () async {
    final cliente = OsrmClient(
      MockClient((_) => Future.delayed(
          const Duration(seconds: 2), () => http.Response(respostaOsrm, 200))),
      ['http://lento.test'],
      const Duration(milliseconds: 50),
    );

    expect(await cliente.calcular(0, 0, 1, 1), isNull);
  });
}
