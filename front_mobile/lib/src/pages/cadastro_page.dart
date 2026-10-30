import 'package:flutter/material.dart';

final _emailValido = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Cadastro no serviço de usuários; o sucesso já inicia a sessão.
class CadastroPage extends StatefulWidget {
  const CadastroPage({super.key, required this.onCadastrar});
  final Future<void> Function(String nome, String email, String senha)
  onCadastrar;
  @override
  State<CadastroPage> createState() => _CadastroPageState();
}

class _CadastroPageState extends State<CadastroPage> {
  final _form = GlobalKey<FormState>();
  final _nome = TextEditingController();
  final _email = TextEditingController();
  final _senha = TextEditingController();
  final _confirmacao = TextEditingController();
  bool _enviando = false;
  bool _tentou = false;
  bool _senhaVisivel = false;
  String? _erro;

  @override
  void dispose() {
    for (final c in [_nome, _email, _senha, _confirmacao]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _enviar() async {
    setState(() => _tentou = true);
    if (!_form.currentState!.validate() || _enviando) return;
    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      // Com a sessão iniciada, a aplicação fecha esta rota e abre o início.
      await widget.onCadastrar(_nome.text, _email.text, _senha.text);
    } catch (erro) {
      if (mounted) setState(() => _erro = erro.toString());
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Widget _campo(
    String rotulo,
    TextEditingController controller,
    String? Function(String?) validator, {
    IconData? icone,
    bool senha = false,
    TextInputType? teclado,
    List<String>? autofill,
    bool ultimo = false,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      controller: controller,
      enabled: !_enviando,
      validator: validator,
      obscureText: senha && !_senhaVisivel,
      keyboardType: teclado,
      autofillHints: autofill,
      autocorrect: !senha,
      enableSuggestions: !senha,
      textInputAction: ultimo ? TextInputAction.done : TextInputAction.next,
      onFieldSubmitted: ultimo ? (_) => _enviar() : null,
      decoration: InputDecoration(
        labelText: rotulo,
        prefixIcon: icone == null ? null : Icon(icone),
        suffixIcon: senha
            ? IconButton(
                tooltip: _senhaVisivel ? 'Ocultar senhas' : 'Mostrar senhas',
                onPressed: () => setState(() => _senhaVisivel = !_senhaVisivel),
                icon: Icon(
                  _senhaVisivel ? Icons.visibility_off : Icons.visibility,
                ),
              )
            : null,
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Criar conta')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: AutofillGroup(
                child: Form(
                  key: _form,
                  autovalidateMode: _tentou
                      ? AutovalidateMode.onUserInteraction
                      : AutovalidateMode.disabled,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Semantics(
                        headingLevel: 1,
                        child: Text(
                          'Crie sua conta SkySwift',
                          style: tema.textTheme.headlineMedium,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Peça entregas por drone e acompanhe cada etapa pelo celular.',
                        style: TextStyle(
                          color: tema.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 24),
                      _campo(
                        'Nome completo',
                        _nome,
                        (v) => (v?.trim().isEmpty ?? true)
                            ? 'Informe seu nome.'
                            : null,
                        icone: Icons.person_outline,
                        autofill: const [AutofillHints.name],
                      ),
                      _campo(
                        'E-mail',
                        _email,
                        (v) => (v?.trim().isEmpty ?? true)
                            ? 'Informe seu e-mail.'
                            : (_emailValido.hasMatch(v!.trim())
                                  ? null
                                  : 'Digite um e-mail válido.'),
                        icone: Icons.email_outlined,
                        teclado: TextInputType.emailAddress,
                        autofill: const [AutofillHints.email],
                      ),
                      _campo(
                        'Senha',
                        _senha,
                        (v) => (v?.length ?? 0) < 6
                            ? 'Use pelo menos 6 caracteres.'
                            : null,
                        icone: Icons.lock_outline,
                        senha: true,
                        autofill: const [AutofillHints.newPassword],
                      ),
                      _campo(
                        'Confirmar senha',
                        _confirmacao,
                        (v) => v != _senha.text
                            ? 'As senhas não coincidem.'
                            : null,
                        icone: Icons.lock_outline,
                        senha: true,
                        autofill: const [AutofillHints.newPassword],
                        ultimo: true,
                      ),
                      if (_erro != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Semantics(
                            liveRegion: true,
                            child: Text(
                              _erro!,
                              style: TextStyle(color: tema.colorScheme.error),
                            ),
                          ),
                        ),
                      ElevatedButton(
                        onPressed: _enviando ? null : _enviar,
                        child: Text(
                          _enviando ? 'Criando conta...' : 'Criar conta',
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: _enviando
                            ? null
                            : () => Navigator.of(context).pop(),
                        child: const Text('Já tenho conta'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
