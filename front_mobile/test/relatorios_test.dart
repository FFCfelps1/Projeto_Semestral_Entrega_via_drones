import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:intl/intl.dart';
import 'package:front_mobile/src/models/relatorio.dart';
import 'package:front_mobile/src/pages/relatorios_page.dart';
import 'package:front_mobile/src/services/skyswift_api.dart';
import 'package:front_mobile/src/theme/app_theme.dart';
import 'package:front_mobile/src/services/sessao_controller.dart';

Map<String, dynamic> fixture(Map<String, String> filtros, {int total = 3}) => {
  'filtros': {
    ...filtros,
    'status': filtros['status'],
    'tipo': filtros['tipo'],
    'fuso': 'America/Sao_Paulo',
  },
  'totalPedidos': total,
  'valorEstimadoTotal': total == 0 ? '0.00' : '60.01',
  'ticketMedioEstimado': total == 0 ? '0.00' : '20.00',
  'porStatus': {
    for (final s in nomesStatus.keys) s: s == 'rascunho' ? total : 0,
  },
  'porModalidade': {'padrao': total, 'expressa': 0, 'prioritaria': 0},
  'pedidosPorDia': [
    {'data': filtros['inicio'], 'quantidade': total},
  ],
  'geradoEm': '2026-10-25T12:00:00Z',
};
http.Response jsonResponse(Object data, [int status = 200]) => http.Response(
  jsonEncode(data),
  status,
  headers: {'content-type': 'application/json; charset=utf-8'},
);
const sessao = Sessao(
  'token-teste',
  Usuario(id: 1, nome: 'Operador', email: 'teste@example.test'),
);

void main() {
  test('login valida perfil e expiração; sessão é descartada ao sair', () async {
    final exp =
        DateTime.now().add(const Duration(hours: 1)).millisecondsSinceEpoch ~/
        1000;
    final token =
        'cabecalho.${base64Url.encode(utf8.encode(jsonEncode({'exp': exp})))}.assinatura';
    final usuario = {
      'id': 1,
      'nome': 'Operador',
      'email': 'teste@example.test',
    };
    final chamadas = <String>[];
    final api = SkySwiftApi(
      client: MockClient((request) async {
        chamadas.add(request.url.path);
        if (request.url.path.endsWith('/login')) {
          return jsonResponse({'token': token, 'usuario': usuario});
        }
        expect(request.headers['authorization'], 'Bearer $token');
        return jsonResponse({'usuario': usuario});
      }),
    );
    final controller = SessaoController(api);
    addTearDown(controller.dispose);
    addTearDown(api.close);
    await controller.entrar('Teste@example.test', 'senha');
    expect(controller.sessao?.usuario.nome, 'Operador');
    expect(chamadas, [
      '/api/cadastro_usuario/auth/login',
      '/api/cadastro_usuario/auth/me',
    ]);
    controller.sair();
    expect(controller.sessao, isNull);
  });
  test('período padrão usa o calendário de São Paulo e 30 dias', () {
    final filtros = FiltrosRelatorio.padrao(
      agora: DateTime.parse('2026-10-25T01:00:00Z'),
    );
    expect(filtros.inicio, '2026-09-25');
    expect(filtros.fim, '2026-10-24');
    expect(filtros.query.containsKey('status'), isFalse);
  });
  test(
    'exportação preserva BOM, envia Bearer e não põe token na URL',
    () async {
      final filtros = FiltrosRelatorio.padrao();
      final api = SkySwiftApi(
        client: MockClient((request) async {
          expect(request.headers['authorization'], 'Bearer token-teste');
          expect(request.url.toString(), isNot(contains('token-teste')));
          expect(request.url.queryParameters, filtros.query);
          return http.Response.bytes(
            utf8.encode('\uFEFFid;item\r\n'),
            200,
            headers: {
              'content-type': 'text/csv; charset=utf-8',
              'content-disposition': 'attachment; filename="teste.csv"',
            },
          );
        }),
      );
      addTearDown(api.close);
      final arquivo = await api.exportar(sessao.token, filtros);
      expect(arquivo.bytes.take(3), [239, 187, 191]);
      expect(arquivo.nome, 'teste.csv');
    },
  );
  test(
    'HTML no lugar de CSV e falhas de conexão são apresentados como erro',
    () async {
      final api = SkySwiftApi(
        client: MockClient((_) async => http.Response('<html/>', 200)),
      );
      addTearDown(api.close);
      await expectLater(
        api.exportar(sessao.token, FiltrosRelatorio.padrao()),
        throwsA(isA<ApiException>()),
      );
    },
  );
  testWidgets(
    'alterar formulário não consulta e CSV mantém filtros aplicados',
    (tester) async {
      tester.view.physicalSize = const Size(1280, 1100);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final consultas = <Map<String, String>>[];
      Map<String, String>? exportado;
      var downloads = 0;
      final api = SkySwiftApi(
        client: MockClient((request) async {
          if (request.url.path.endsWith('/exportar')) {
            exportado = request.url.queryParameters;
            return http.Response(
              'id;item\r\n',
              200,
              headers: {'content-type': 'text/csv'},
            );
          }
          consultas.add(request.url.queryParameters);
          return jsonResponse(fixture(request.url.queryParameters));
        }),
      );
      addTearDown(api.close);
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          home: RelatoriosPage(
            api: api,
            sessao: sessao,
            onLogout: () {},
            onToggleTheme: () {},
            onDownload: (bytes, nome) async {
              downloads++;
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Relatórios de Entregas'), findsOneWidget);
      expect(consultas.length, 1);
      final anterior = DateTime.parse(consultas.first['inicio']!)
          .subtract(const Duration(days: 1));
      await tester.enterText(
        find.byKey(const ValueKey('inicio')),
        DateFormat('dd/MM/yyyy').format(anterior),
      );
      await tester.pumpAndSettle();
      expect(consultas.length, 1);
      await tester.tap(find.byKey(const ValueKey('exportar')));
      await tester.pumpAndSettle();
      expect(downloads, 1);
      expect(exportado, consultas.first);
      await tester.tap(find.byKey(const ValueKey('aplicar')));
      await tester.pumpAndSettle();
      expect(consultas.length, 2);
      expect(
        consultas.last['inicio'],
        DateFormat('yyyy-MM-dd').format(anterior),
      );
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('exibe vazio e trata 401 encerrando sessão', (tester) async {
    var expirada = false;
    var unauthorized = false;
    final api = SkySwiftApi(
      client: MockClient(
        (request) async => unauthorized
            ? jsonResponse({'erro': 'Sessão expirada'}, 401)
            : jsonResponse(fixture(request.url.queryParameters, total: 0)),
      ),
    );
    addTearDown(api.close);
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        home: RelatoriosPage(
          api: api,
          sessao: sessao,
          onLogout: () {
            expirada = true;
          },
          onToggleTheme: () {},
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Nenhum pedido neste período'), findsOneWidget);
    unauthorized = true;
    await tester.ensureVisible(find.byKey(const ValueKey('aplicar')));
    await tester.tap(find.byKey(const ValueKey('aplicar')));
    await tester.pumpAndSettle();
    expect(expirada, isTrue);
    expect(tester.takeException(), isNull);
  });
  testWidgets(
    'falha de API permite tentar novamente sem inventar indicadores',
    (tester) async {
      var falha = true;
      final api = SkySwiftApi(
        client: MockClient(
          (r) async => falha
              ? jsonResponse({'erro': 'Banco indisponível'}, 503)
              : jsonResponse(fixture(r.url.queryParameters)),
        ),
      );
      addTearDown(api.close);
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          home: RelatoriosPage(
            api: api,
            sessao: sessao,
            onLogout: () {},
            onToggleTheme: () {},
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Banco indisponível'), findsOneWidget);
      expect(find.text('Total de pedidos'), findsNothing);
      falha = false;
      await tester.ensureVisible(find.text('Tentar novamente'));
      await tester.tap(find.text('Tentar novamente'));
      await tester.pumpAndSettle();
      expect(find.text('Total de pedidos'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'painel permanece utilizável em telas pequenas e texto ampliado nos dois temas',
    (tester) async {
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final api = SkySwiftApi(
        client: MockClient(
          (r) async => jsonResponse(fixture(r.url.queryParameters)),
        ),
      );
      addTearDown(api.close);
      for (final tamanho in [
        const Size(390, 844),
        const Size(844, 390),
        const Size(1440, 1000),
      ]) {
        tester.view.physicalSize = tamanho;
        for (final tema in [AppTheme.light, AppTheme.dark]) {
          await tester.pumpWidget(
            MaterialApp(
              theme: tema,
              home: MediaQuery(
                data: MediaQueryData(
                  size: tamanho,
                  textScaler: const TextScaler.linear(2),
                ),
                child: RelatoriosPage(
                  key: UniqueKey(),
                  api: api,
                  sessao: sessao,
                  onLogout: () {},
                  onToggleTheme: () {},
                ),
              ),
            ),
          );
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        }
      }
    },
  );
}
