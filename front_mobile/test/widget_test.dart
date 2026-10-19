import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:front_mobile/main.dart';

TextField _campoDeTexto(WidgetTester tester, Finder formulario) {
  return tester.widget<TextField>(
    find.descendant(of: formulario, matching: find.byType(TextField)),
  );
}

void main() {
  WidgetController.hitTestWarningShouldBeFatal = true;
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
