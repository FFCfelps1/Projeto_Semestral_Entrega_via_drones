import 'package:flutter/material.dart';

import '../models/operacao.dart';
import '../services/skyswift_api.dart';
import '../widgets/comum.dart';
import '../widgets/rota_mapa.dart';

/// Mesmo ponto de partida usado pelo rastreamento do site React.
const centroLogistico = Coordenada(-23.5505, -46.6333);
const nomeCentroLogistico = 'Centro Logístico SkySwift, São Paulo';

/// Simulação de rota a partir do centro logístico, sem criar pedido.
class RotasPage extends StatefulWidget {
  const RotasPage({
    super.key,
    required this.api,
    required this.onToggleTheme,
    required this.onLogout,
  });
  final SkySwiftApi api;
  final VoidCallback onToggleTheme;
  final VoidCallback onLogout;
  @override
  State<RotasPage> createState() => _RotasPageState();
}

class _RotasPageState extends State<RotasPage> {
  final _destino = TextEditingController();
  final _form = GlobalKey<FormState>();
  ResultadoRota? _rota;
  String? _destinoEncontrado;
  String? _erro;
  bool _calculando = false;

  @override
  void dispose() {
    _destino.dispose();
    super.dispose();
  }

  Future<void> _calcular() async {
    if (!_form.currentState!.validate() || _calculando) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _calculando = true;
      _erro = null;
    });
    try {
      final local = await widget.api.geocodificar(_destino.text);
      if (local == null) {
        throw const ApiException(
          'Endereço não encontrado. Inclua número, bairro e cidade.',
        );
      }
      final rota = await widget.api.rota(centroLogistico, local.coordenada);
      if (mounted) {
        setState(() {
          _rota = rota;
          _destinoEncontrado = local.nome;
        });
      }
    } catch (erro) {
      if (mounted) {
        setState(
          () => _erro = mensagemDe(
            erro,
            'Não foi possível calcular a rota. Tente novamente.',
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _calculando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rotas'),
        actions: acoesSessao(
          context,
          onToggleTheme: widget.onToggleTheme,
          onLogout: widget.onLogout,
        ),
      ),
      body: ConteudoPagina(
        maxWidth: 820,
        children: [
          const Titulo(
            'Simular rota do drone',
            subtitulo: 'Calcule distância e tempo a partir do centro logístico antes de criar um pedido.',
          ),
          const SizedBox(height: 20),
          Painel(
            child: Form(
              key: _form,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.warehouse_outlined),
                      SizedBox(width: 8),
                      Expanded(child: Text('Saída: $nomeCentroLogistico')),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _destino,
                    enabled: !_calculando,
                    textInputAction: TextInputAction.search,
                    onFieldSubmitted: (_) => _calcular(),
                    validator: (v) => (v?.trim().isEmpty ?? true)
                        ? 'Informe o endereço de destino.'
                        : null,
                    decoration: const InputDecoration(
                      labelText: 'Endereço de destino',
                      hintText: 'Ex.: Av. Paulista, 1000, São Paulo',
                      prefixIcon: Icon(Icons.place_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _calculando ? null : _calcular,
                    icon: const Icon(Icons.route),
                    label: Text(
                      _calculando ? 'Calculando rota...' : 'Calcular rota',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (_erro != null) MensagemErro(_erro!),
          if (_rota != null && _erro == null)
            Painel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Titulo('Resultado', nivel: 2),
                  const SizedBox(height: 4),
                  Text(
                    'Destino: ${_destinoEncontrado ?? _destino.text}',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                  RotaMapa(
                    rota: _rota!,
                    origem: nomeCentroLogistico,
                    destino: _destinoEncontrado ?? _destino.text,
                    altura: 280,
                  ),
                ],
              ),
            ),
          const SizedBox(height: 12),
          Text(
            'Endereços convertidos pelo OpenStreetMap (Nominatim). A rota é calculada pelo microsserviço Dart de entregas.',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
