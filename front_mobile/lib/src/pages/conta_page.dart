import 'package:flutter/material.dart';

import '../services/skyswift_api.dart';
import '../widgets/comum.dart';
import 'contato_page.dart';
import 'sistema_page.dart';

final _emailValido = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Perfil, senha e exclusão da conta, além de suporte e estado do sistema.
class ContaPage extends StatefulWidget {
  const ContaPage({
    super.key,
    required this.api,
    required this.sessao,
    required this.onToggleTheme,
    required this.onLogout,
    required this.onUsuarioAtualizado,
  });
  final SkySwiftApi api;
  final Sessao sessao;
  final VoidCallback onToggleTheme;
  final VoidCallback onLogout;
  final ValueChanged<Usuario> onUsuarioAtualizado;
  @override
  State<ContaPage> createState() => _ContaPageState();
}

class _ContaPageState extends State<ContaPage> {
  final _perfil = GlobalKey<FormState>();
  final _senha = GlobalKey<FormState>();
  late final _nome = TextEditingController(text: widget.sessao.usuario.nome);
  late final _email = TextEditingController(text: widget.sessao.usuario.email);
  final _senhaAtual = TextEditingController();
  final _novaSenha = TextEditingController();
  final _confirmacao = TextEditingController();
  bool _salvandoPerfil = false;
  bool _salvandoSenha = false;
  bool _excluindo = false;
  String? _erroPerfil;
  String? _erroSenha;

  @override
  void dispose() {
    for (final c in [_nome, _email, _senhaAtual, _novaSenha, _confirmacao]) {
      c.dispose();
    }
    super.dispose();
  }

  /// O token expirado encerra a sessão em vez de exibir erro na conta.
  bool _sessaoExpirada(Object erro) {
    if (erro is ApiException && erro.status == 401 && mounted) {
      widget.onLogout();
      return true;
    }
    return false;
  }

  Future<void> _salvarPerfil() async {
    if (!_perfil.currentState!.validate()) return;
    final atual = widget.sessao.usuario;
    final nome = _nome.text.trim();
    final email = _email.text.trim().toLowerCase();
    if (nome == atual.nome && email == atual.email) {
      avisar(context, 'Nenhuma alteração para salvar.');
      return;
    }
    setState(() {
      _salvandoPerfil = true;
      _erroPerfil = null;
    });
    try {
      final usuario = await widget.api.atualizarPerfil(
        widget.sessao.token,
        nome: nome == atual.nome ? null : nome,
        email: email == atual.email ? null : email,
      );
      widget.onUsuarioAtualizado(usuario);
      if (mounted) avisar(context, 'Perfil atualizado.');
    } catch (erro) {
      if (_sessaoExpirada(erro) || !mounted) return;
      setState(
        () => _erroPerfil = mensagemDe(
          erro,
          'Não foi possível atualizar o perfil.',
        ),
      );
    } finally {
      if (mounted) setState(() => _salvandoPerfil = false);
    }
  }

  Future<void> _salvarSenha() async {
    if (!_senha.currentState!.validate()) return;
    setState(() {
      _salvandoSenha = true;
      _erroSenha = null;
    });
    try {
      await widget.api.alterarSenha(
        widget.sessao.token,
        _senhaAtual.text,
        _novaSenha.text,
      );
      if (!mounted) return;
      for (final c in [_senhaAtual, _novaSenha, _confirmacao]) {
        c.clear();
      }
      avisar(context, 'Senha alterada com sucesso.');
    } catch (erro) {
      // 401 aqui significa senha atual incorreta, não sessão expirada.
      final senhaIncorreta =
          erro is ApiException && erro.mensagem == 'Senha atual invalida.';
      if (!senhaIncorreta && _sessaoExpirada(erro)) return;
      if (!mounted) return;
      setState(
        () => _erroSenha = senhaIncorreta
            ? 'Senha atual incorreta.'
            : mensagemDe(erro, 'Não foi possível alterar a senha.'),
      );
    } finally {
      if (mounted) setState(() => _salvandoSenha = false);
    }
  }

  Future<void> _excluir() async {
    final ok = await confirmar(
      context,
      titulo: 'Excluir conta?',
      mensagem: 'Sua conta será removida e você sairá do aplicativo. Os pedidos já criados continuam registrados para a operação.',
      acao: 'Excluir conta',
      destrutiva: true,
    );
    if (!ok || !mounted) return;
    setState(() => _excluindo = true);
    try {
      await widget.api.excluirConta(widget.sessao.token);
      widget.onLogout();
    } catch (erro) {
      if (_sessaoExpirada(erro) || !mounted) return;
      avisar(context, mensagemDe(erro, 'Não foi possível excluir a conta.'));
      setState(() => _excluindo = false);
    }
  }

  void _abrir(Widget pagina) =>
      Navigator.of(context)
          .push(MaterialPageRoute<void>(builder: (_) => pagina));

  Widget _campoSenha(
    String rotulo,
    TextEditingController controller,
    String? Function(String?) validator,
    List<String> autofill,
  ) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      controller: controller,
      obscureText: true,
      enabled: !_salvandoSenha,
      autofillHints: autofill,
      validator: validator,
      decoration: InputDecoration(
        labelText: rotulo,
        prefixIcon: const Icon(Icons.lock_outline),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final usuario = widget.sessao.usuario;
    final cores = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Conta'),
        actions: acoesSessao(
          context,
          onToggleTheme: widget.onToggleTheme,
          onLogout: widget.onLogout,
        ),
      ),
      body: ConteudoPagina(
        maxWidth: 720,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: cores.primary,
                foregroundColor: cores.onPrimary,
                child: Text(
                  usuario.nome.trim().isEmpty
                      ? '?'
                      : usuario.nome.trim()[0].toUpperCase(),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(child: Titulo(usuario.nome, subtitulo: usuario.email)),
            ],
          ),
          const SizedBox(height: 24),
          Painel(
            child: Form(
              key: _perfil,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Titulo('Dados pessoais', nivel: 2),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _nome,
                    enabled: !_salvandoPerfil,
                    autofillHints: const [AutofillHints.name],
                    validator: (v) => (v?.trim().isEmpty ?? true)
                        ? 'Informe seu nome.'
                        : null,
                    decoration: const InputDecoration(
                      labelText: 'Nome',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _email,
                    enabled: !_salvandoPerfil,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    validator: (v) => _emailValido.hasMatch(v?.trim() ?? '')
                        ? null
                        : 'Digite um e-mail válido.',
                    decoration: const InputDecoration(
                      labelText: 'E-mail',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                  ),
                  if (_erroPerfil != null) ...[
                    const SizedBox(height: 12),
                    Text(_erroPerfil!, style: TextStyle(color: cores.error)),
                  ],
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _salvandoPerfil ? null : _salvarPerfil,
                    child: Text(
                      _salvandoPerfil ? 'Salvando...' : 'Salvar dados',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Painel(
            child: Form(
              key: _senha,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Titulo('Alterar senha', nivel: 2),
                  const SizedBox(height: 16),
                  _campoSenha(
                    'Senha atual',
                    _senhaAtual,
                    (v) =>
                        (v?.isEmpty ?? true) ? 'Informe a senha atual.' : null,
                    const [AutofillHints.password],
                  ),
                  _campoSenha(
                    'Nova senha',
                    _novaSenha,
                    (v) => (v?.length ?? 0) < 6
                        ? 'Use pelo menos 6 caracteres.'
                        : null,
                    const [AutofillHints.newPassword],
                  ),
                  _campoSenha(
                    'Confirmar nova senha',
                    _confirmacao,
                    (v) => v != _novaSenha.text
                        ? 'As senhas não coincidem.'
                        : null,
                    const [AutofillHints.newPassword],
                  ),
                  if (_erroSenha != null) ...[
                    Text(_erroSenha!, style: TextStyle(color: cores.error)),
                    const SizedBox(height: 12),
                  ],
                  ElevatedButton(
                    onPressed: _salvandoSenha ? null : _salvarSenha,
                    child: Text(
                      _salvandoSenha ? 'Alterando...' : 'Alterar senha',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Painel(
            padding: 8,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.support_agent),
                  title: const Text('Fale com a SkySwift'),
                  subtitle: const Text('Envie uma mensagem para a equipe'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _abrir(
                    ContatoPage(
                      api: widget.api,
                      usuario: widget.sessao.usuario,
                    ),
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.monitor_heart_outlined),
                  title: const Text('Estado do sistema'),
                  subtitle: const Text(
                    'Microsserviços, inscrições e eventos recentes',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _abrir(SistemaPage(api: widget.api)),
                ),
                ListTile(
                  leading: const Icon(Icons.logout),
                  title: const Text('Sair da conta'),
                  onTap: widget.onLogout,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Painel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Titulo('Excluir conta', nivel: 2),
                const SizedBox(height: 8),
                const Text(
                  'Remove seu cadastro permanentemente. Será necessário criar uma nova conta para voltar a usar o aplicativo.',
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: cores.error,
                    side: BorderSide(color: cores.error),
                  ),
                  onPressed: _excluindo ? null : _excluir,
                  icon: const Icon(Icons.delete_outline),
                  label: Text(_excluindo ? 'Excluindo...' : 'Excluir conta'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
