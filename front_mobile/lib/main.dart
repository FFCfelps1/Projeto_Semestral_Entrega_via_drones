import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'src/pages/cadastro_page.dart';
import 'src/pages/home_page.dart';
import 'src/pages/login_page.dart';
import 'src/theme/app_theme.dart';
import 'src/services/skyswift_api.dart';
import 'src/services/sessao_controller.dart';

void main() {
  runApp(const SkySwiftApp());
}

/// A configuração global fica fora das páginas e acompanha a sessão.
class SkySwiftApp extends StatefulWidget {
  const SkySwiftApp({super.key, this.api});
  final SkySwiftApi? api;

  @override
  State<SkySwiftApp> createState() => _SkySwiftAppState();
}

class _SkySwiftAppState extends State<SkySwiftApp> {
  ThemeMode _themeMode = ThemeMode.system;
  late final SkySwiftApi _api;
  late final SessaoController _sessao;
  final _navegador = GlobalKey<NavigatorState>();
  SemanticsHandle? _semantica;
  @override
  void initState() {
    super.initState();
    if (kIsWeb) _semantica = SemanticsBinding.instance.ensureSemantics();
    _api = widget.api ?? SkySwiftApi();
    _sessao = SessaoController(_api)..addListener(_atualizar);
  }

  String? _tokenAtual;

  void _atualizar() {
    // Entrar, cadastrar ou sair troca a tela inicial; rotas abertas são fechadas.
    final token = _sessao.sessao?.token;
    if (token != _tokenAtual) {
      _tokenAtual = token;
      _navegador.currentState?.popUntil((rota) => rota.isFirst);
    }
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _semantica?.dispose();
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

  Future<void> _abrirCadastro() async {
    await _navegador.currentState?.push(
      MaterialPageRoute<void>(
        builder: (_) => CadastroPage(onCadastrar: _sessao.cadastrar),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sessao = _sessao.sessao;
    return MaterialApp(
      title: 'SkySwift',
      navigatorKey: _navegador,
      debugShowCheckedModeBanner: false,
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: _themeMode,
      home: sessao == null
          ? LoginPage(
              onToggleTheme: _alternarTema,
              onLogin: _sessao.entrar,
              onCreateAccount: _abrirCadastro,
            )
          : HomePage(
              key: ValueKey('sessao-${sessao.usuario.id}'),
              api: _api,
              sessao: sessao,
              onLogout: _sessao.sair,
              onToggleTheme: _alternarTema,
              onUsuarioAtualizado: _sessao.atualizarUsuario,
            ),
    );
  }
}
