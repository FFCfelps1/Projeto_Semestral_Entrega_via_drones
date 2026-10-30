import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:front_mobile/main.dart';
import 'package:front_mobile/src/services/skyswift_api.dart';

TextField _campoDeTexto(WidgetTester tester, Finder formulario) {
  return tester.widget<TextField>(
    find.descendant(of: formulario, matching: find.byType(TextField)),
  );
}

void main() {
  WidgetController.hitTestWarningShouldBeFatal = true;
  testWidgets('Identifica titulo, campos e controles para leitores de tela', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    try {
      await tester.pumpWidget(const SkySwiftApp());
      expect(find.byTooltip('Alternar para modo escuro'), findsOneWidget);
      expect(find.byTooltip('Mostrar senha'), findsOneWidget);
      expect(
        tester
            .getSemantics(find.text('Entre na sua conta'))
            .getSemanticsData()
            .headingLevel,
        1,
      );
      expect(
        tester
            .getSemantics(find.byType(TextField).first)
            .getSemanticsData()
            .label,
        contains('E-mail'),
      );
      expect(
        tester
            .getSemantics(find.byType(TextField).last)
            .getSemanticsData()
            .label,
        contains('Senha'),
      );
      await tester.ensureVisible(find.byTooltip('Mostrar senha'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Mostrar senha'));
      await tester.pumpAndSettle();
      expect(find.byTooltip('Ocultar senha'), findsOneWidget);
    } finally {
      semantics.dispose();
    }
  });

  testWidgets('Mantem alvos acessiveis e controles de 56 nos dois temas', (
    tester,
  ) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.windows;
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final semantics = tester.ensureSemantics();
    try {
      await tester.pumpWidget(const SkySwiftApp());
      for (var tema = 0; tema < 2; tema++) {
        await tester.pumpAndSettle();
        expect(
          tester.getSize(find.widgetWithText(ElevatedButton, 'Entrar')).height,
          greaterThanOrEqualTo(56),
        );
        await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(textContrastGuideline));
        if (tema == 0) await tester.tap(find.byIcon(Icons.dark_mode));
      }
    } finally {
      semantics.dispose();
      debugDefaultTargetPlatformOverride = null;
    }
  });

  testWidgets(
    'Entrar envia dados ao backend e apresenta credenciais inválidas',
    (tester) async {
      final api = SkySwiftApi(
        client: MockClient((request) async {
          expect(request.url.path, '/api/cadastro_usuario/auth/login');
          expect(request.body, '{"email":"nome@exemplo.com","senha":"x"}');
          return http.Response(
            '{"error":"Credenciais inválidas."}',
            401,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }),
      );
      addTearDown(api.close);
      await tester.pumpWidget(SkySwiftApp(api: api));
      await tester.enterText(
        find.byType(TextFormField).first,
        'nome@exemplo.com',
      );
      await tester.enterText(find.byType(TextFormField).last, 'x');
      await tester.ensureVisible(find.text('Entrar'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();
      expect(find.text('Credenciais inválidas.'), findsOneWidget);
      expect(find.text('Entre na sua conta'), findsOneWidget);
    },
  );

  testWidgets('Recuperacao informa disponibilidade e cadastro abre no app', (
    tester,
  ) async {
    await tester.pumpWidget(const SkySwiftApp());
    await tester.ensureVisible(find.text('Esqueci minha senha'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Esqueci minha senha'));
    await tester.pumpAndSettle();
    expect(
      find.text(
        'A recuperação de senha ainda não está disponível nesta versão.',
      ),
      findsOneWidget,
    );
    await tester.pump(const Duration(seconds: 5));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Criar conta'));
    await tester.tap(find.text('Criar conta'));
    await tester.pumpAndSettle();
    expect(find.text('Crie sua conta SkySwift'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(4));
    await tester.ensureVisible(find.text('Já tenho conta'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Já tenho conta'));
    await tester.pumpAndSettle();
    expect(find.text('Entre na sua conta'), findsOneWidget);
  });
  testWidgets('Valida campos vazios e foca o primeiro erro', (tester) async {
    await tester.pumpWidget(const SkySwiftApp());
    await tester.ensureVisible(find.text('Entrar'));
    await tester.tap(find.text('Entrar'));
    await tester.pumpAndSettle();
    expect(find.text('Informe seu e-mail.'), findsOneWidget);
    expect(find.text('Informe sua senha.'), findsOneWidget);
    expect(
      _campoDeTexto(
        tester,
        find.byType(TextFormField).first,
      ).focusNode?.hasFocus,
      isTrue,
    );
    await tester.enterText(
      find.byType(TextFormField).first,
      'nome@exemplo.com',
    );
    await tester.ensureVisible(find.text('Entrar'));
    await tester.tap(find.text('Entrar'));
    await tester.pumpAndSettle();
    expect(
      _campoDeTexto(
        tester,
        find.byType(TextFormField).last,
      ).focusNode?.hasFocus,
      isTrue,
    );
  });

  testWidgets('Valida email e atualiza o erro apos a primeira tentativa', (
    tester,
  ) async {
    await tester.pumpWidget(const SkySwiftApp());
    final email = find.byType(TextFormField).first;
    await tester.enterText(email, 'endereco-invalido');
    expect(find.text('Digite um e-mail válido.'), findsNothing);
    await tester.ensureVisible(find.text('Entrar'));
    await tester.tap(find.text('Entrar'));
    await tester.pumpAndSettle();
    expect(find.text('Digite um e-mail válido.'), findsOneWidget);
    await tester.enterText(email, 'nome@exemplo.com');
    await tester.pumpAndSettle();
    expect(find.text('Digite um e-mail válido.'), findsNothing);
  });

  testWidgets('Proximo foca senha e Concluir valida sem impor tamanho minimo', (
    tester,
  ) async {
    await tester.pumpWidget(const SkySwiftApp());
    final email = find.byType(TextFormField).first;
    final senha = find.byType(TextFormField).last;
    await tester.enterText(email, 'nome@exemplo.com');
    await tester.testTextInput.receiveAction(TextInputAction.next);
    await tester.pump();
    expect(_campoDeTexto(tester, senha).focusNode?.hasFocus, isTrue);
    await tester.enterText(senha, ' x ');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(find.text('Informe sua senha.'), findsNothing);
    expect(tester.widget<TextFormField>(senha).controller?.text, ' x ');
    expect(
      _campoDeTexto(tester, email).autofillHints,
      contains(AutofillHints.username),
    );
    expect(
      _campoDeTexto(tester, senha).autofillHints,
      contains(AutofillHints.password),
    );
  });

  testWidgets('Preserva texto, selecao e foco ao alternar senha e tema', (
    tester,
  ) async {
    await tester.pumpWidget(const SkySwiftApp());
    final senha = find.byType(TextFormField).last;
    await tester.enterText(senha, 'minha senha');
    final controller = tester.widget<TextFormField>(senha).controller!;
    controller.selection = const TextSelection(baseOffset: 1, extentOffset: 5);
    await tester.ensureVisible(find.byIcon(Icons.visibility));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.visibility));
    await tester.pumpAndSettle();
    expect(_campoDeTexto(tester, senha).obscureText, isFalse);
    expect(controller.text, 'minha senha');
    expect(
      controller.selection,
      const TextSelection(baseOffset: 1, extentOffset: 5),
    );
    expect(_campoDeTexto(tester, senha).focusNode?.hasFocus, isTrue);
    await tester.ensureVisible(find.byIcon(Icons.dark_mode));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.dark_mode));
    await tester.pumpAndSettle();
    expect(
      Theme.of(tester.element(find.byType(Scaffold))).brightness,
      Brightness.dark,
    );
    expect(
      controller.selection,
      const TextSelection(baseOffset: 1, extentOffset: 5),
    );
    expect(_campoDeTexto(tester, senha).focusNode?.hasFocus, isTrue);
  });

  testWidgets('Tab avanca do email para a senha', (tester) async {
    await tester.pumpWidget(const SkySwiftApp());
    await tester.tap(find.byType(TextFormField).first);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(
      _campoDeTexto(
        tester,
        find.byType(TextFormField).last,
      ).focusNode?.hasFocus,
      isTrue,
    );
  });

  testWidgets('Oculta a ilustracao quando o teclado esta aberto', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetViewInsets);
    await tester.pumpWidget(const SkySwiftApp());
    expect(find.byType(Image), findsOneWidget);

    tester.view.viewInsets = const FakeViewPadding(bottom: 300);
    await tester.pumpAndSettle();
    expect(find.byType(Image), findsNothing);
    await tester.ensureVisible(find.text('Criar conta'));
    expect(tester.takeException(), isNull);
  });

  testWidgets('Permite rolar em telas pequenas e em orientacao horizontal', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    for (final size in const [
      Size(320, 568),
      Size(360, 800),
      Size(390, 844),
      Size(844, 390),
    ]) {
      tester.view.physicalSize = size;
      await tester.pumpWidget(const SkySwiftApp());
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Criar conta'));
      expect(tester.takeException(), isNull, reason: 'Layout em $size');
    }
  });

  testWidgets('Mantem o formulario utilizavel com texto em 200 por cento', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      const MediaQuery(
        data: MediaQueryData(textScaler: TextScaler.linear(2)),
        child: SkySwiftApp(),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      MediaQuery.textScalerOf(tester.element(find.byType(Scaffold))).scale(16),
      32,
    );
    await tester.ensureVisible(find.text('Criar conta'));
    expect(tester.takeException(), isNull);
  });

  testWidgets('Segue o sistema ate a escolha manual do tema', (tester) async {
    final plataforma = tester.binding.platformDispatcher;
    plataforma.platformBrightnessTestValue = Brightness.dark;
    addTearDown(plataforma.clearPlatformBrightnessTestValue);

    await tester.pumpWidget(const SkySwiftApp());
    final scaffold = find.byType(Scaffold);
    expect(Theme.of(tester.element(scaffold)).brightness, Brightness.dark);

    plataforma.platformBrightnessTestValue = Brightness.light;
    await tester.pumpAndSettle();
    expect(Theme.of(tester.element(scaffold)).brightness, Brightness.light);

    await tester.tap(find.byIcon(Icons.dark_mode));
    await tester.pumpAndSettle();
    plataforma.platformBrightnessTestValue = Brightness.dark;
    await tester.pumpAndSettle();
    plataforma.platformBrightnessTestValue = Brightness.light;
    await tester.pumpAndSettle();
    expect(Theme.of(tester.element(scaffold)).brightness, Brightness.dark);
  });

  testWidgets('Exibe os campos e as ações da tela de login', (tester) async {
    await tester.pumpWidget(const SkySwiftApp());

    expect(find.text('E-mail'), findsOneWidget);
    expect(find.text('Senha'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.widgetWithText(ElevatedButton, 'Entrar'), findsOneWidget);
    expect(find.text('Esqueci minha senha'), findsOneWidget);
    expect(find.text('Criar conta'), findsOneWidget);
  });

  testWidgets('Permite mostrar e ocultar a senha', (tester) async {
    await tester.pumpWidget(const SkySwiftApp());
    final senha = find.byType(TextField).last;

    expect(tester.widget<TextField>(senha).obscureText, isTrue);
    await tester.tap(find.byIcon(Icons.visibility));
    await tester.pump();
    expect(tester.widget<TextField>(senha).obscureText, isFalse);

    await tester.tap(find.byIcon(Icons.visibility_off));
    await tester.pump();
    expect(tester.widget<TextField>(senha).obscureText, isTrue);
  });

  testWidgets('Permite alternar o tema claro e escuro', (tester) async {
    await tester.pumpWidget(const SkySwiftApp());
    final scaffold = find.byType(Scaffold);

    expect(Theme.of(tester.element(scaffold)).brightness, Brightness.light);
    await tester.tap(find.byIcon(Icons.dark_mode));
    await tester.pumpAndSettle();
    expect(Theme.of(tester.element(scaffold)).brightness, Brightness.dark);

    await tester.tap(find.byIcon(Icons.light_mode));
    await tester.pumpAndSettle();
    expect(Theme.of(tester.element(scaffold)).brightness, Brightness.light);
  });
}
