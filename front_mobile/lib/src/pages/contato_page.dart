import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/operacao.dart';
import '../services/skyswift_api.dart';
import '../widgets/comum.dart';

final _emailValido = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Envia a mensagem pelo microsserviço de e-mail; sem SMTP, usa o `mailto`.
class ContatoPage extends StatefulWidget {
  const ContatoPage({
    super.key,
    required this.api,
    this.usuario,
    this.abrirLink,
  });
  final SkySwiftApi api;
  final Usuario? usuario;

  /// Permite substituir o `url_launcher` nos testes.
  final Future<bool> Function(Uri uri)? abrirLink;
  @override
  State<ContatoPage> createState() => _ContatoPageState();
}

class _ContatoPageState extends State<ContatoPage> {
  final _form = GlobalKey<FormState>();
  late final _nome = TextEditingController(text: widget.usuario?.nome ?? '');
  late final _email = TextEditingController(text: widget.usuario?.email ?? '');
  final _empresa = TextEditingController();
  final _telefone = TextEditingController();
  final _mensagem = TextEditingController();
  bool _enviando = false;
  bool _abrindo = false;
  String? _erro;
  String? _sucesso;
  bool _semServidor = false;

  @override
  void dispose() {
    for (final c in [_nome, _email, _empresa, _telefone, _mensagem]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _enviar() async {
    if (!_form.currentState!.validate() || _enviando) return;
    setState(() {
      _enviando = true;
      _erro = null;
      _sucesso = null;
      _semServidor = false;
    });
    try {
      final resposta = await widget.api.enviarContato(
        MensagemContato(
          nome: _nome.text,
          email: _email.text,
          empresa: _empresa.text,
          telefone: _telefone.text,
          mensagem: _mensagem.text,
        ),
      );
      if (!mounted) return;
      _mensagem.clear();
      setState(
        () => _sucesso = '$resposta Responderemos pelo e-mail informado.',
      );
    } catch (erro) {
      if (!mounted) return;
      setState(() {
        _semServidor = erro is ApiException && erro.status == 503;
        _erro = _semServidor
            ? 'O envio direto não está configurado no servidor. Use o seu aplicativo de e-mail.'
            : mensagemDe(erro, 'Não foi possível enviar a mensagem.');
      });
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Future<void> _abrirEmail() async {
    setState(() => _abrindo = true);
    try {
      final contato = await widget.api.linkContato();
      final abrir =
          widget.abrirLink ??
          (Uri uri) => launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!await abrir(Uri.parse(contato.link)) && mounted) {
        avisar(
          context,
          'Nenhum aplicativo de e-mail disponível. Escreva para ${contato.destinatario}.',
        );
      }
    } catch (erro) {
      if (mounted) {
        avisar(
          context,
          mensagemDe(erro, 'Não foi possível preparar o e-mail de contato.'),
        );
      }
    } finally {
      if (mounted) setState(() => _abrindo = false);
    }
  }

  Widget _campo(
    String rotulo,
    TextEditingController controller, {
    IconData? icone,
    String? Function(String?)? validator,
    TextInputType? teclado,
    int linhas = 1,
    List<String>? autofill,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      controller: controller,
      enabled: !_enviando,
      validator: validator,
      keyboardType: teclado,
      autofillHints: autofill,
      maxLines: linhas,
      minLines: linhas == 1 ? 1 : 4,
      decoration: InputDecoration(
        labelText: rotulo,
        alignLabelWithHint: linhas > 1,
        prefixIcon: icone == null ? null : Icon(icone),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final cores = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Contato')),
      body: Form(
        key: _form,
        child: ConteudoPagina(
          maxWidth: 640,
          children: [
            const Titulo(
              'Fale com a SkySwift',
              subtitulo: 'Dúvidas sobre áreas atendidas, planos ou integração? A equipe responde por e-mail.',
            ),
            const SizedBox(height: 24),
            _campo(
              'Nome',
              _nome,
              icone: Icons.person_outline,
              autofill: const [AutofillHints.name],
              validator: (v) =>
                  (v?.trim().isEmpty ?? true) ? 'Informe seu nome.' : null,
            ),
            _campo(
              'E-mail',
              _email,
              icone: Icons.email_outlined,
              teclado: TextInputType.emailAddress,
              autofill: const [AutofillHints.email],
              validator: (v) => _emailValido.hasMatch(v?.trim() ?? '')
                  ? null
                  : 'Digite um e-mail válido.',
            ),
            _campo('Empresa (opcional)', _empresa, icone: Icons.business),
            _campo(
              'Telefone (opcional)',
              _telefone,
              icone: Icons.phone_outlined,
              teclado: TextInputType.phone,
              autofill: const [AutofillHints.telephoneNumber],
            ),
            _campo(
              'Mensagem',
              _mensagem,
              linhas: 6,
              validator: (v) =>
                  (v?.trim().isEmpty ?? true) ? 'Escreva sua mensagem.' : null,
            ),
            if (_sucesso != null) ...[
              Semantics(
                liveRegion: true,
                child: Text(_sucesso!, style: TextStyle(color: cores.primary)),
              ),
              const SizedBox(height: 12),
            ],
            if (_erro != null) ...[
              Semantics(
                liveRegion: true,
                child: Text(_erro!, style: TextStyle(color: cores.error)),
              ),
              const SizedBox(height: 12),
            ],
            ElevatedButton.icon(
              onPressed: _enviando ? null : _enviar,
              icon: const Icon(Icons.send_outlined),
              label: Text(_enviando ? 'Enviando...' : 'Enviar mensagem'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              style: _semServidor
                  ? OutlinedButton.styleFrom(
                      side: BorderSide(color: cores.primary, width: 2),
                    )
                  : null,
              onPressed: _abrindo ? null : _abrirEmail,
              icon: const Icon(Icons.open_in_new),
              label: Text(
                _abrindo ? 'Abrindo...' : 'Escrever pelo aplicativo de e-mail',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
