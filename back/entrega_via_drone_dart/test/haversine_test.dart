import 'package:entrega_via_drone_dart/src/geo/haversine.dart';
import 'package:test/test.dart';

void main() {
  group('distanciaHaversineMetros', () {
    test('retorna zero para o mesmo ponto', () {
      expect(distanciaHaversineMetros(-23.55, -46.63, -23.55, -46.63), 0);
    });

    test('um grau de latitude mede cerca de 111 km', () {
      expect(
        distanciaHaversineMetros(0, 0, 1, 0),
        closeTo(111195, 1),
      );
    });

    test('distancia entre Se e MASP fica perto de 2,6 km', () {
      final distancia = distanciaHaversineMetros(
        -23.5505, -46.6333, // Praca da Se
        -23.5614, -46.6559, // MASP, Av. Paulista
      );
      expect(distancia, closeTo(2603, 5));
    });

    test('e simetrica em relacao a origem e destino', () {
      final ida = distanciaHaversineMetros(-23.55, -46.63, -22.90, -43.17);
      final volta = distanciaHaversineMetros(-22.90, -43.17, -23.55, -46.63);
      expect(ida, closeTo(volta, 1e-6));
    });
  });
}
