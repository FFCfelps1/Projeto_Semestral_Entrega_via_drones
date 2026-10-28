import 'package:flutter/material.dart';

import '../models/operacao.dart';
import '../services/skyswift_api.dart';
import '../widgets/comum.dart';

/// Consulta `/health` de cada microsserviço e o histórico do barramento.
class SistemaPage extends StatefulWidget {
  const SistemaPage({super.key, required this.api});
  final SkySwiftApi api;
  @override
  State<SistemaPage> createState() => _SistemaPageState();
}

class _SistemaPageState extends State<SistemaPage> {
  List<SaudeServico>? _saude;
  List<Inscricao>? _inscricoes;
  List<EventoBarramento>? _eventos;
  String? _erroBarramento;
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() {
      _carregando = true;
      _erroBarramento = null;
    });
    final saude = Future.wait(servicosBackend.keys.map(widget.api.saude));
    try {
      final resultados = await Future.wait([
        widget.api.inscricoes(),
        widget.api.eventosRecentes(limite: 20),
      ]);
      if (mounted) {
        setState(() {
          _inscricoes = resultados[0] as List<Inscricao>;
          _eventos = resultados[1] as List<EventoBarramento>;
        });
      }
    } catch (erro) {
      if (mounted) {
        setState(
          () => _erroBarramento = mensagemDe(
            erro,
            'Não foi possível consultar o barramento de eventos.',
          ),
        );
      }
    }
    final estados = await saude;
    if (mounted) {
      setState(() {
        _saude = estados;
        _carregando = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cores = Theme.of(context).colorScheme;
    final saude = _saude;
    final online = saude?.where((s) => s.disponivel).length ?? 0;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Estado do sistema'),
        actions: [
          IconButton(
            tooltip: 'Atualizar estado',
            onPressed: _carregando ? null : _carregar,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: ConteudoPagina(
        maxWidth: 820,
        onRefresh: _carregar,
        children: [
          Titulo(
            'Estado do sistema',
            subtitulo: saude == null
                ? 'Verificando os microsserviços...'
                : '$online de ${saude.length} serviços respondendo.',
          ),
          const SizedBox(height: 16),
          if (_carregando) const LinearProgressIndicator(),
          Painel(
            padding: 8,
            child: Column(
              children: [
                for (final servico in servicosBackend.entries)
                  Builder(
                    builder: (context) {
                      final estado = saude
                          ?.where((s) => s.servico == servico.key)
                          .firstOrNull;
                      final ok = estado?.disponivel;
                      return ListTile(
                        leading: Icon(
                          ok == null
                              ? Icons.hourglass_empty
                              : (ok ? Icons.check_circle : Icons.error),
                          color: ok == null
                              ? cores.onSurfaceVariant
                              : (ok ? const Color(0xff15803d) : cores.error),
                        ),
                        title: Text(servico.value),
                        subtitle: Text(
                          ok == null
                              ? 'Verificando...'
                              : (ok
                                    ? 'Disponível${estado?.detalhe == null ? '' : ' · ${estado!.detalhe}'}'
                                    : 'Indisponível · ${estado?.detalhe ?? ''}'),
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_erroBarramento != null)
            MensagemErro(_erroBarramento!, onTentarNovamente: _carregar)
          else ...[
            Painel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Titulo('Inscrições no barramento', nivel: 2),
                  const SizedBox(height: 12),
                  if (_inscricoes == null)
                    const Text('Carregando...')
                  else if (_inscricoes!.isEmpty)
                    const Text('Nenhum serviço inscrito.')
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final i in _inscricoes!)
                          Chip(
                            avatar: const Icon(Icons.hub_outlined, size: 18),
                            label: Text(i.servico),
                          ),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Painel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Titulo('Eventos recentes', nivel: 2),
                  const SizedBox(height: 4),
                  Text(
                    'Últimos eventos publicados pelos microsserviços.',
                    style: TextStyle(color: cores.onSurfaceVariant),
                  ),
                  const SizedBox(height: 12),
                  if (_eventos == null)
                    const Text('Carregando...')
                  else if (_eventos!.isEmpty)
                    const Text(
                      'Nenhum evento registrado desde a inicialização.',
                    )
                  else
                    for (final e in _eventos!)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.bolt_outlined),
                        title: Text(e.tipo),
                        subtitle: Text(
                          '${e.origem ?? 'origem desconhecida'} · ${dataHora(e.momento)}',
                        ),
                      ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
