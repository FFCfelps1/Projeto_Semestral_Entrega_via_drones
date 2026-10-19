import 'package:flutter/material.dart';

import 'src/pages/login_page.dart';
import 'src/theme/app_theme.dart';

void main() {
  runApp(const SkySwiftApp());
}

/// A configuração global fica fora da página para acompanhar futuras telas.
class SkySwiftApp extends StatefulWidget {
  const SkySwiftApp({super.key});

  @override
  State<SkySwiftApp> createState() => _SkySwiftAppState();
}

class _SkySwiftAppState extends State<SkySwiftApp> {
  ThemeMode _themeMode = ThemeMode.system;

  void _alternarTema() {
    // A primeira escolha parte do tema efetivo, inclusive o definido pelo sistema.
    final escuro =
        _themeMode == ThemeMode.dark ||
        (_themeMode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);
    setState(() => _themeMode = escuro ? ThemeMode.light : ThemeMode.dark);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SkySwift',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: _themeMode,
      home: LoginPage(onToggleTheme: _alternarTema),
    );
  }
}
