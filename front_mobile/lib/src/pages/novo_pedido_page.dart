import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/pedido.dart';
import '../services/skyswift_api.dart';
import '../widgets/comum.dart';

/// Formulário de criação: o backend recalcula preço e prazo ao gravar.
class NovoPedidoPage extends StatefulWidget {
  const NovoPedidoPage({super.key, required this.api, required this.usuarioId});
  final SkySwiftApi api;
  final int usuarioId;
  @override
  State<NovoPedidoPage> createState() => _NovoPedidoPageState();
}

class _NovoPedidoPageState extends State<NovoPedidoPage> {
  final _form = GlobalKey<FormState>();
  final _item = TextEditingController();
  final _peso = TextEditingController();
  final _origem = TextEditingController();
  final _destino = TextEditingController();
  final _observacoes = TextEditingController();
  String _tipo = 'padrao';
  bool _enviando = false;
  bool _tentou = false;
  String? _erro;

  double? get _pesoValor =>
      double.tryParse(_peso.text.trim().replaceAll(',', '.'));

  @override
  void dispose() {
    for (final c in [_item, _peso, _origem, _destino, _observacoes]) {
      c.dispose();
    }
    super.dispose();
  }

  String? _obrigatorio(String? valor, String campo) {
    final texto = valor?.trim() ?? '';
    if (texto.isEmpty) return 'Informe $campo.';
    if (texto.length > 255) return 'Use no máximo 255 caracteres.';
    return null;
  }

  String? _validarPeso(String? _) {
    final peso = _pesoValor;
    if (_peso.text.trim().isEmpty) return 'Informe o peso em kg.';
    if (peso == null || !peso.isFinite) return 'Digite um número, como 2,5.';
    if (peso <= 0) return 'O peso deve ser maior que zero.';
    if (peso > 99999999.99) return 'Peso acima do limite aceito.';
    return null;
  }

  Future<void> _enviar() async {
    setState(() => _tentou = true);
    if (!_form.currentState!.validate() || _enviando) return;
    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      final pedido = await widget.api.criarPedido(
        NovoPedido(
          item: _item.text,
          peso: _pesoValor!,
          origem: _origem.text,
          destino: _destino.text,
          tipo: _tipo,
          observacoes: _observacoes.text,
        ),
        widget.usuarioId,
      );
      if (mounted) Navigator.of(context).pop(pedido);
    } catch (erro) {
      if (mounted) {
        setState(
          () => _erro = mensagemDe(
            erro,
            'Não foi possível criar o pedido. Tente novamente.',
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Widget _campo(
    String rotulo,
    TextEditingController controller, {
    String? dica,
    IconData? icone,
    String? Function(String?)? validator,
    TextInputType? teclado,
    int linhas = 1,
    List<TextInputFormatter>? formatadores,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      controller: controller,
      enabled: !_enviando,
      validator: validator,
      keyboardType: teclado,
      inputFormatters: formatadores,
      maxLines: linhas,
      minLines: linhas == 1 ? 1 : 2,
      textInputAction: linhas == 1
          ? TextInputAction.next
          : TextInputAction.newline,
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(
        labelText: rotulo,
        hintText: dica,
        prefixIcon: icone == null ? null : Icon(icone),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final peso = _pesoValor;
    final estimativa = peso != null && peso > 0
        ? precoEstimado(peso, _tipo)
        : null;
    return Scaffold(
      appBar: AppBar(title: const Text('Novo pedido')),
      body: Form(
        key: _form,
        autovalidateMode: _tentou
            ? AutovalidateMode.onUserInteraction
            : AutovalidateMode.disabled,
        child: ConteudoPagina(
          maxWidth: 640,
          children: [
            const Titulo(
              'Nova entrega por drone',
              subtitulo: 'Informe o que será transportado e os endereços completos de coleta e entrega.',
            ),
            const SizedBox(height: 24),
            _campo(
              'Item',
              _item,
              dica: 'Ex.: medicamentos, documentos',
              icone: Icons.inventory_2_outlined,
              validator: (v) => _obrigatorio(v, 'o item'),
            ),
            _campo(
              'Peso (kg)',
              _peso,
              dica: 'Ex.: 2,5',
              icone: Icons.scale_outlined,
              validator: _validarPeso,
              teclado: const TextInputType.numberWithOptions(decimal: true),
              formatadores: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
              ],
            ),
            _campo(
              'Endereço de coleta',
              _origem,
              dica: 'Rua, número, bairro e cidade',
              icone: Icons.trip_origin,
              validator: (v) => _obrigatorio(v, 'o endereço de coleta'),
            ),
            _campo(
              'Endereço de entrega',
              _destino,
              dica: 'Rua, número, bairro e cidade',
              icone: Icons.place_outlined,
              validator: (v) => _obrigatorio(v, 'o endereço de entrega'),
            ),
            Text('Modalidade', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: [
                for (final tipo in nomesModalidades.entries)
                  ButtonSegment(
                    value: tipo.key,
                    label: Text(tipo.value),
                    tooltip:
                        '${tipo.value}: cerca de ${minutosModalidade[tipo.key]} minutos',
                  ),
              ],
              selected: {_tipo},
              showSelectedIcon: false,
              onSelectionChanged: _enviando
                  ? null
                  : (valor) => setState(() => _tipo = valor.first),
            ),
            const SizedBox(height: 16),
            _campo(
              'Observações (opcional)',
              _observacoes,
              dica: 'Instruções para coleta ou entrega',
              linhas: 3,
            ),
            Painel(
              child: Semantics(
                liveRegion: true,
                child: Row(
                  children: [
                    Icon(
                      Icons.payments_outlined,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        estimativa == null
                            ? 'Informe o peso para estimar o valor.'
                            : 'Estimativa: ${moeda.format(estimativa)} · cerca de ${minutosModalidade[_tipo]} min',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_erro != null) ...[
              Semantics(
                liveRegion: true,
                child: Text(
                  _erro!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
              const SizedBox(height: 12),
            ],
            ElevatedButton.icon(
              onPressed: _enviando ? null : _enviar,
              icon: const Icon(Icons.send_outlined),
              label: Text(_enviando ? 'Criando pedido...' : 'Criar pedido'),
            ),
            const SizedBox(height: 8),
            Text(
              'O pedido é criado como rascunho. Confirme-o para liberar o despacho do drone.',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
