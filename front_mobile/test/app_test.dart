import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:front_mobile/main.dart';
import 'package:front_mobile/src/pages/contato_page.dart';
import 'package:front_mobile/src/pages/sistema_page.dart';
import 'package:front_mobile/src/services/skyswift_api.dart';
import 'package:front_mobile/src/theme/app_theme.dart';

import 'support/backend_falso.dart';

Future<void> entrar(WidgetTester tester, BackendFalso backend) async {
  final api = backend.api();
  addTearDown(api.close);
  await tester.pumpWidget(SkySwiftApp(api: api));
  await tester.enterText(find.byType(TextFormField).first, 'ana@exemplo.com');
  await tester.enterText(find.byType(TextFormField).last, backend.senha);
  await tester.ensureVisible(find.widgetWithText(ElevatedButton, 'Entrar'));
  await tester.tap(find.widgetWithText(ElevatedButton, 'Entrar'));
  await tester.pumpAndSettle();
}

Future<void> tocar(WidgetTester tester, Finder alvo) async {
  await tester.ensureVisible(alvo);
  await tester.pumpAndSettle();
  await tester.tap(alvo);
  await tester.pumpAndSettle();
}

Future<void> abrirAba(WidgetTester tester, String nome) => tocar(
  tester,
  find.descendant(of: find.byType(NavigationBar), matching: find.text(nome)),
);

Finder noDialogo(String texto) =>
    find.descendant(of: find.byType(AlertDialog), matching: find.text(texto));

Widget pagina(Widget filho) => MaterialApp(theme: AppTheme.light, home: filho);

void main() {
  testWidgets('Login abre a navegacao com as cinco areas do aplicativo', (
    tester,
  ) async {
    final backend = BackendFalso();
    await entrar(tester, backend);
    expect(find.text('Olá, Ana'), findsOneWidget);
    for (final area in [
      'Pedidos',
      'Rotas',
      'Notificações',
      'Relatórios',
      'Conta',
    ]) {
      expect(
        find.descendant(
          of: find.byType(NavigationBar),
          matching: find.text(area),
        ),
        findsOneWidget,
      );
    }
    expect(find.text('Você ainda não tem pedidos'), findsOneWidget);
    expect(
      backend.chamadas,
      containsAll([
        'POST /api/cadastro_usuario/auth/login',
        'GET /api/cadastro_usuario/auth/me',
        'GET /api/gestao_de_pedidos/pedidos',
        'GET /api/notificacoes/notificacoes/nao-lidas/contagem',
      ]),
    );
  });

  testWidgets(
    'Fluxo completo do pedido: criar, confirmar, despachar e entregar',
    (tester) async {
      tester.view.physicalSize = const Size(430, 1400);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final backend = BackendFalso();
      await entrar(tester, backend);

      await tocar(tester, find.text('Novo pedido'));
      await tocar(tester, find.text('Criar pedido'));
      expect(find.text('Informe o item.'), findsOneWidget);
      expect(find.text('Informe o peso em kg.'), findsOneWidget);

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Item'),
        'Vacinas',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Peso (kg)'),
        '2,5',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Endereço de coleta'),
        'Rua A, 10, São Paulo',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Endereço de entrega'),
        'Rua B, 20, São Paulo',
      );
      await tocar(tester, find.text('Expressa'));
      await tester.pumpAndSettle();
      // (10 + 2,5 × 5) × 1,35 = 30,375
      expect(find.textContaining(RegExp(r'R\$\s30,38')), findsOneWidget);
      await tocar(tester, find.text('Criar pedido'));

      final criado =
          backend.corpos['POST /api/gestao_de_pedidos/pedidos']
              as Map<String, dynamic>;
      expect(criado, {
        'item': 'Vacinas',
        'peso': 2.5,
        'origem': 'Rua A, 10, São Paulo',
        'destino': 'Rua B, 20, São Paulo',
        'tipo': 'expressa',
        'observacoes': '',
        'usuarioId': 7,
      });
      expect(find.text('Vacinas'), findsOneWidget);
      expect(find.text('Rascunho'), findsWidgets);

      await tocar(tester, find.text('Confirmar pedido'));
      expect(find.textContaining('Pedido confirmado'), findsOneWidget);

      await tocar(tester, find.text('Calcular rota e despachar'));
      expect(
        find.text('Drone despachado. O pedido está em rota.'),
        findsOneWidget,
      );
      expect(find.text('Em rota'), findsWidgets);
      expect(find.text('Rota do drone'), findsOneWidget);
      expect(find.textContaining('2,5 km'), findsOneWidget);
      final rota = backend.chamadas.lastWhere((c) => c.contains('/rota'));
      expect(rota, 'GET /api/entrega_via_drone/rota');

      await tocar(tester, find.text('Marcar como entregue'));
      await tocar(tester, noDialogo('Marcar como entregue'));
      expect(find.text('Entrega concluída.'), findsOneWidget);
      expect(find.text('Entregue'), findsWidgets);
      expect(backend.pedidos.single['status'], 'entregue');
      expect(
        (backend.pedidos.single['statusHistorico'] as List).map(
          (e) => (e as Map)['status'],
        ),
        ['rascunho', 'confirmado', 'em_rota', 'entregue'],
      );

      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('1 pedido'), findsOneWidget);
    },
  );

  testWidgets('Filtra por status no backend e cancela com confirmacao', (
    tester,
  ) async {
    final backend = BackendFalso()
      ..adicionarPedido(item: 'Documentos', status: 'confirmado')
      ..adicionarPedido(item: 'Peças', status: 'entregue');
    await entrar(tester, backend);
    expect(find.text('2 pedidos'), findsOneWidget);

    await tocar(tester, find.widgetWithText(ChoiceChip, 'Confirmado'));
    expect(find.text('1 pedido'), findsOneWidget);
    expect(find.text('Peças'), findsNothing);
    expect(backend.chamadas.last, 'GET /api/gestao_de_pedidos/pedidos');

    await tocar(tester, find.text('Documentos'));
    await tocar(tester, find.text('Cancelar pedido'));
    expect(find.text('Cancelar pedido?'), findsOneWidget);
    await tocar(tester, find.text('Voltar'));
    expect(backend.chamadas, isNot(contains(startsWith('DELETE'))));

    await tocar(tester, find.text('Cancelar pedido'));
    await tocar(tester, noDialogo('Cancelar pedido'));
    expect(find.text('Pedido cancelado.'), findsOneWidget);
    expect(find.text('Cancelar pedido'), findsNothing);
    expect(backend.pedidos.last['status'], 'cancelado');
  });

  testWidgets('Notificacoes mostram contador, marcam uma e todas como lidas', (
    tester,
  ) async {
    final backend = BackendFalso();
    for (var i = 1; i <= 3; i++) {
      backend.notificacoes.add({
        'id': i,
        'titulo': 'Pedido criado',
        'mensagem': 'Pedido $i criado com sucesso.',
        'pedidoId': null,
        'eventoTipo': 'PEDIDO_CRIADO',
        'lida': false,
        'criadoEm': '2026-10-28T12:00:00.000Z',
        'lidaEm': null,
      });
    }
    await entrar(tester, backend);
    expect(find.text('3'), findsOneWidget);

    await abrirAba(tester, 'Notificações');
    expect(find.text('3 notificações não lidas.'), findsOneWidget);
    await tocar(tester, find.text('Marcar como lida').first);
    expect(find.text('2 notificações não lidas.'), findsOneWidget);
    expect(
      backend.chamadas,
      contains('PATCH /api/notificacoes/notificacoes/1/ler'),
    );

    await tocar(tester, find.text('Marcar todas como lidas'));
    expect(find.text('2 notificações marcadas como lidas.'), findsOneWidget);
    expect(
      find.text('Tudo em dia: nenhuma notificação não lida.'),
      findsOneWidget,
    );
    expect(find.byType(Badge), findsNothing);
  });

  testWidgets('Simula rota a partir do centro logistico', (tester) async {
    final backend = BackendFalso();
    await entrar(tester, backend);
    await abrirAba(tester, 'Rotas');

    await tocar(tester, find.text('Calcular rota'));
    expect(find.text('Informe o endereço de destino.'), findsOneWidget);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Endereço de destino'),
      'Endereço inexistente',
    );
    await tocar(tester, find.text('Calcular rota'));
    expect(find.textContaining('Endereço não encontrado'), findsOneWidget);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Endereço de destino'),
      'Av. Brasil, 100',
    );
    await tocar(tester, find.text('Calcular rota'));
    expect(find.text('Resultado'), findsOneWidget);
    expect(find.textContaining('7 min'), findsOneWidget);
    expect(find.text('Abrir no OpenStreetMap'), findsOneWidget);
  });

  testWidgets('Conta atualiza perfil, valida senha atual e exclui a conta', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(430, 1800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final backend = BackendFalso();
    await entrar(tester, backend);
    await abrirAba(tester, 'Conta');

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Nome'),
      'Ana Lima',
    );
    await tocar(tester, find.text('Salvar dados'));
    expect(backend.corpos['PATCH /api/cadastro_usuario/auth/me'], {
      'nome': 'Ana Lima',
    });
    expect(find.text('Ana Lima'), findsWidgets);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Senha atual'),
      'errada',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Nova senha'),
      'nova-senha',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirmar nova senha'),
      'outra',
    );
    await tocar(tester, find.widgetWithText(ElevatedButton, 'Alterar senha'));
    expect(find.text('As senhas não coincidem.'), findsOneWidget);
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirmar nova senha'),
      'nova-senha',
    );
    await tocar(tester, find.widgetWithText(ElevatedButton, 'Alterar senha'));
    expect(find.text('Senha atual incorreta.'), findsOneWidget);
    expect(find.text('Entre na sua conta'), findsNothing);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Senha atual'),
      'segredo1',
    );
    await tocar(tester, find.widgetWithText(ElevatedButton, 'Alterar senha'));
    expect(backend.senha, 'nova-senha');

    await tocar(tester, find.byIcon(Icons.delete_outline));
    await tocar(tester, noDialogo('Excluir conta'));
    expect(backend.chamadas, contains('DELETE /api/cadastro_usuario/auth/me'));
    expect(find.text('Entre na sua conta'), findsOneWidget);
  });

  testWidgets('Cadastro cria a conta no backend e inicia a sessao', (
    tester,
  ) async {
    final backend = BackendFalso();
    final api = backend.api();
    addTearDown(api.close);
    await tester.pumpWidget(SkySwiftApp(api: api));
    await tocar(tester, find.text('Criar conta'));
    expect(find.text('Crie sua conta SkySwift'), findsOneWidget);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Nome completo'),
      'Bruno Costa',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'E-mail'),
      'existente@exemplo.com',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Senha'),
      '123456',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirmar senha'),
      '123456',
    );
    await tocar(tester, find.widgetWithText(ElevatedButton, 'Criar conta'));
    expect(find.text('Este email ja esta cadastrado.'), findsOneWidget);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'E-mail'),
      'bruno@exemplo.com',
    );
    await tocar(tester, find.widgetWithText(ElevatedButton, 'Criar conta'));
    expect(backend.corpos['POST /api/cadastro_usuario/auth/cadastro'], {
      'nome': 'Bruno Costa',
      'email': 'bruno@exemplo.com',
      'senha': '123456',
    });
    expect(find.text('Olá, Bruno'), findsOneWidget);
    expect(find.text('Crie sua conta SkySwift'), findsNothing);
  });

  testWidgets('Sair encerra a sessao e volta ao login', (tester) async {
    final backend = BackendFalso()..adicionarPedido();
    await entrar(tester, backend);
    await tocar(tester, find.text('Medicamentos'));
    expect(find.text('Detalhes'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tocar(tester, find.byTooltip('Sair'));
    expect(find.text('Entre na sua conta'), findsOneWidget);
  });

  testWidgets('Telas largas usam navegacao lateral', (tester) async {
    tester.view.physicalSize = const Size(1280, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final backend = BackendFalso();
    await entrar(tester, backend);
    expect(find.byType(NavigationRail), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);
    await tocar(tester, find.text('Relatórios'));
    expect(find.text('Relatórios de Entregas'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Contato envia pelo servico e oferece o e-mail sem SMTP', (
    tester,
  ) async {
    final backend = BackendFalso(smtpConfigurado: false);
    final api = backend.api();
    addTearDown(api.close);
    Uri? aberto;
    await tester.pumpWidget(
      pagina(
        ContatoPage(
          api: api,
          usuario: const Usuario(id: 7, nome: 'Ana', email: 'ana@exemplo.com'),
          abrirLink: (uri) async {
            aberto = uri;
            return true;
          },
        ),
      ),
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Mensagem'),
      'Atendem Jundiaí?',
    );
    await tocar(tester, find.text('Enviar mensagem'));
    expect(backend.corpos['POST /api/contato_email/email/enviar'], {
      'nome': 'Ana',
      'email': 'ana@exemplo.com',
      'mensagem': 'Atendem Jundiaí?',
    });
    expect(find.textContaining('não está configurado'), findsOneWidget);
    await tocar(tester, find.text('Escrever pelo aplicativo de e-mail'));
    expect(aberto?.scheme, 'mailto');

    backend.smtpConfigurado = true;
    await tocar(tester, find.text('Enviar mensagem'));
    expect(
      find.textContaining('Mensagem enviada com sucesso.'),
      findsOneWidget,
    );
  });

  testWidgets('Estado do sistema consulta saude, inscricoes e eventos', (
    tester,
  ) async {
    final backend = BackendFalso()..servicosForaDoAr.add('contato_email');
    backend.eventos.add({
      'id': 'e1',
      'tipo': 'RotaCalculada',
      'origem': 'entrega_via_drone',
      'timestamp': '2026-10-28T12:00:00.000Z',
    });
    final api = backend.api();
    addTearDown(api.close);
    await tester.pumpWidget(pagina(SistemaPage(api: api)));
    await tester.pumpAndSettle();
    expect(find.text('5 de 6 serviços respondendo.'), findsOneWidget);
    expect(find.textContaining('Indisponível'), findsOneWidget);
    expect(find.text('gestao_de_pedidos'), findsOneWidget);
    expect(find.text('RotaCalculada'), findsOneWidget);
  });
}
