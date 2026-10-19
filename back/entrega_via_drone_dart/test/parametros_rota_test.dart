import 'package:entrega_via_drone_dart/src/rota/parametros_rota.dart';
import 'package:test/test.dart';

void main() {
  const completos = {
    'origemLat': '-23.55',
    'origemLng': '-46.63',
    'destinoLat': '-23.56',
    'destinoLng': '-46.65',
  };

  test('converte as coordenadas e le o pedido opcional', () {
    final parametros =
        ParametrosRota.daQuery({...completos, 'pedidoId': 'pedido-1'});

    expect(parametros.origemLat, -23.55);
    expect(parametros.destinoLng, -46.65);
    expect(parametros.pedidoId, 'pedido-1');
  });

  test('pedidoId vazio e tratado como ausente', () {
    expect(ParametrosRota.daQuery({...completos, 'pedidoId': ''}).pedidoId,
        isNull);
  });

  test('rejeita coordenada ausente ou vazia', () {
    for (final faltando in completos.keys) {
      final query = {...completos}..remove(faltando);
      expect(
        () => ParametrosRota.daQuery(query),
        throwsA(isA<ParametrosInvalidos>()
            .having((e) => e.mensagem, 'mensagem', 'Coordenadas ausentes')),
      );
      expect(
        () => ParametrosRota.daQuery({...completos, faltando: ''}),
        throwsA(isA<ParametrosInvalidos>()),
      );
    }
  });

  test('rejeita valores que nao sao numeros finitos', () {
    for (final valor in ['abc', 'Infinity', 'NaN']) {
      expect(
        () => ParametrosRota.daQuery({...completos, 'origemLat': valor}),
        throwsA(isA<ParametrosInvalidos>()
            .having((e) => e.mensagem, 'mensagem', 'Coordenadas inválidas')),
      );
    }
  });
}
