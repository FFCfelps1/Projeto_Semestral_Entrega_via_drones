import 'package:entrega_via_drone_dart/src/geo/haversine.dart';
import 'package:entrega_via_drone_dart/src/rota/rota_fallback.dart';
import 'package:test/test.dart';

void main() {
  group('construirRotaFallback', () {
    final resultado = construirRotaFallback(-23.55, -46.63, -23.56, -46.65);

    test('liga origem e destino em linha reta', () {
      expect(resultado.rota, [
        [-23.55, -46.63],
        [-23.56, -46.65],
      ]);
    });

    test('usa haversine e a velocidade media do drone', () {
      final esperado = distanciaHaversineMetros(-23.55, -46.63, -23.56, -46.65);
      expect(resultado.distancia, esperado);
      expect(resultado.duracao, esperado / velocidadeMediaDroneMps);
    });

    test('serializa com as mesmas chaves da versao Node', () {
      final json = resultado.toJson();
      expect(json['success'], isTrue);
      expect(json['fallback'], isTrue);
      expect(json['provider'], provedorFallback);
      expect(json['aviso'], isA<String>());
    });
  });
}
