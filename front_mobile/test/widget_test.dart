import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:front_mobile/src/pages/login_page.dart';

void main() {
  testWidgets('Exibe os campos e as ações da tela de login', (tester) async {
    await tester.pumpWidget(const LoginPage());

    expect(find.widgetWithText(TextFormField, 'Email'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Senha'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Entrar'), findsOneWidget);
    expect(find.text('Esqueci minha senha'), findsOneWidget);
    expect(find.text('Criar conta'), findsOneWidget);
  });

  testWidgets('Permite mostrar e ocultar a senha', (tester) async {
    await tester.pumpWidget(const LoginPage());
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
    await tester.pumpWidget(const LoginPage());
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
