import 'dart:async';

import 'package:flutter/foundation.dart';

import 'skyswift_api.dart';

class SessaoController extends ChangeNotifier {
  SessaoController(this.api);
  final SkySwiftApi api;
  Sessao? sessao;
  Timer? _expiracao;
  bool _descartado = false;
  Future<void> entrar(String email, String senha) async {
    final login = await api.login(email, senha);
    final usuario = await api.perfil(login.token);
    if (_descartado) return;
    final duracao = login.expiracao.difference(DateTime.now().toUtc());
    if (duracao <= Duration.zero) {
      throw const ApiException('A sessão expirou. Entre novamente.', 401);
    }
    sessao = Sessao(login.token, usuario);
    _expiracao?.cancel();
    _expiracao = Timer(duracao, sair);
    notifyListeners();
  }

  void sair() {
    _expiracao?.cancel();
    sessao = null;
    if (!_descartado) notifyListeners();
  }

  @override
  void dispose() {
    _descartado = true;
    _expiracao?.cancel();
    super.dispose();
  }
}
