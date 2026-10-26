import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:url_launcher/url_launcher.dart';

import 'src/pages/login_page.dart';
import 'src/pages/relatorios_page.dart';
import 'src/theme/app_theme.dart';
import 'src/services/skyswift_api.dart';
import 'src/services/sessao_controller.dart';

void main() {
  runApp(const SkySwiftApp());
}

/// A configuração global fica fora da página para acompanhar futuras telas.
class SkySwiftApp extends StatefulWidget {
  const SkySwiftApp({super.key, this.api, this.onOpenRegistration});
  final SkySwiftApi? api;
  final Future<void> Function()? onOpenRegistration;

  @override
  State<SkySwiftApp> createState() => _SkySwiftAppState();
}

class _SkySwiftAppState extends State<SkySwiftApp> {
  ThemeMode _themeMode = ThemeMode.system;
  late final SkySwiftApi _api;
  late final SessaoController _sessao;
  @override
  void initState() {
    super.initState();
    _api = widget.api ?? SkySwiftApi();
    _sessao = SessaoController(_api)..addListener(_atualizar);
  }

  void _atualizar() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _sessao.dispose();
    if (widget.api == null) _api.close();
    super.dispose();
  }

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
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: _themeMode,
      home: _sessao.sessao == null
          ? LoginPage(
              onToggleTheme: _alternarTema,
              onLogin: _sessao.entrar,
              onCreateAccount:
                  widget.onOpenRegistration ??
                  () async {
                    if (!await launchUrl(
                      _api.base.resolve('/login'),
                      webOnlyWindowName: '_self',
                    )) {
                      throw const ApiException(
                        'Não foi possível abrir o cadastro.',
                      );
                    }
                  },
            )
          : RelatoriosPage(
              api: _api,
              sessao: _sessao.sessao!,
              onLogout: _sessao.sair,
              onToggleTheme: _alternarTema,
            ),
    );
  }
}
