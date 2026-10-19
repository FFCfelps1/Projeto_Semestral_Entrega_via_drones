import 'package:entrega_via_drone_dart/src/config.dart';
import 'package:test/test.dart';

void main() {
  group('Config.doAmbiente', () {
    test('usa os mesmos padroes da versao Node quando o ambiente esta vazio',
        () {
      final config = Config.doAmbiente({});

      expect(config.porta, 3002);
      expect(config.barramentoUrl, 'http://localhost:3001');
      expect(config.servicoUrl, 'http://localhost:3002');
      expect(config.provedoresRota, provedoresPadrao);
    });

    test('le porta, urls e provedores informados', () {
      final config = Config.doAmbiente({
        'PORT': '4000',
        'BARRAMENTO_URL': 'http://barramento-eventos:3001',
        'SERVICE_URL': 'http://entrega-via-drone:3002',
        'ROUTING_PROVIDERS': 'http://a.test, http://b.test ,',
      });

      expect(config.porta, 4000);
      expect(config.barramentoUrl, 'http://barramento-eventos:3001');
      expect(config.servicoUrl, 'http://entrega-via-drone:3002');
      expect(config.provedoresRota, ['http://a.test', 'http://b.test']);
    });

    test('ignora porta invalida', () {
      expect(Config.doAmbiente({'PORT': 'abc'}).porta, 3002);
    });
  });
}
