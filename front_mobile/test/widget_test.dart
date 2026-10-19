import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:front_mobile/main.dart';

void main() {
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

    expect(find.widgetWithText(TextFormField, 'Email'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Senha'), findsOneWidget);
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
