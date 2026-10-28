import 'dart:async';

import 'package:flutter/foundation.dart';

import 'skyswift_api.dart';

/// Mantém o JWT apenas em memória e encerra a sessão quando ele expira.
class SessaoController extends ChangeNotifier {
  SessaoController(this.api);
  final SkySwiftApi api;
  Sessao? sessao;
  Timer? _expiracao;
  bool _descartado = false;

  Future<void> entrar(String email, String senha) async {
    final login = await api.login(email, senha);
    await _iniciar(login);
  }

  Future<void> cadastrar(String nome, String email, String senha) async {
    final cadastro = await api.cadastrar(nome, email, senha);
    await _iniciar(cadastro);
  }

  Future<void> _iniciar(Sessao inicial) async {
    final usuario = await api.perfil(inicial.token);
    if (_descartado) return;
    final duracao = inicial.expiracao.difference(DateTime.now().toUtc());
    if (duracao <= Duration.zero) {
      throw const ApiException('A sessão expirou. Entre novamente.', 401);
    }
    sessao = Sessao(inicial.token, usuario);
    _expiracao?.cancel();
    _expiracao = Timer(duracao, sair);
    notifyListeners();
  }

  /// Reflete na sessão os dados de perfil confirmados pelo backend.
  void atualizarUsuario(Usuario usuario) {
    final atual = sessao;
    if (atual == null || _descartado) return;
    sessao = atual.comUsuario(usuario);
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
