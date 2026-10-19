import 'package:flutter/material.dart';

import 'src/pages/login_page.dart';

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
  bool _temaEscuro = false;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SkySwift',
      theme: _temaEscuro
          ? ThemeData(
              brightness: Brightness.dark,
              scaffoldBackgroundColor: const Color(0xff101622),
              appBarTheme: const AppBarTheme(
                backgroundColor: Color(0xff101622),
              ),
            )
          : ThemeData.light(),
      home: LoginPage(
        onToggleTheme: () => setState(() => _temaEscuro = !_temaEscuro),
      ),
    );
  }
}
