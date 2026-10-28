import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/operacao.dart';
import '../models/pedido.dart';
import '../services/skyswift_api.dart';
import '../widgets/comum.dart';
import '../widgets/rota_mapa.dart';

/// Detalhe do pedido com todas as transições aceitas pelo serviço de pedidos.
class PedidoDetalhePage extends StatefulWidget {
  const PedidoDetalhePage({
    super.key,
    required this.api,
    required this.pedidoInicial,
    this.onAlteracao,
    this.intervaloAtualizacao = const Duration(seconds: 1),
  });
  final SkySwiftApi api;
  final Pedido pedidoInicial;
  final VoidCallback? onAlteracao;

  /// Espera entre consultas enquanto o barramento entrega `RotaCalculada`.
  final Duration intervaloAtualizacao;
  @override
  State<PedidoDetalhePage> createState() => _PedidoDetalhePageState();
}

class _PedidoDetalhePageState extends State<PedidoDetalhePage> {
  late Pedido _pedido = widget.pedidoInicial;
  List<EtapaHistorico>? _historico;
  ResultadoRota? _rota;
  String? _erro;
  String? _mensagem;
  String? _acaoEmAndamento;
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _historico = widget.pedidoInicial.historico;
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final resultados = await Future.wait([
        widget.api.pedido(_pedido.id),
        widget.api.historico(_pedido.id),
      ]);
      if (!mounted) return;
      setState(() {
        _pedido = resultados[0] as Pedido;
        _historico = resultados[1] as List<EtapaHistorico>;
      });
    } catch (erro) {
      if (mounted) {
        setState(
          () => _erro = mensagemDe(
            erro,
            'Não foi possível atualizar o pedido. Tente novamente.',
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  Future<void> _executar(
    String acao,
    Future<String> Function() operacao,
  ) async {
    if (_acaoEmAndamento != null) return;
    setState(() {
      _acaoEmAndamento = acao;
      _erro = null;
      _mensagem = null;
    });
    try {
      final mensagem = await operacao();
      widget.onAlteracao?.call();
      if (mounted) setState(() => _mensagem = mensagem);
      final historico = await widget.api.historico(_pedido.id);
      if (mounted) setState(() => _historico = historico);
    } catch (erro) {
      if (mounted) {
        setState(
          () => _erro = mensagemDe(
            erro,
            'Não foi possível concluir a ação. Tente novamente.',
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _acaoEmAndamento = null);
    }
  }

  Future<void> _confirmar() => _executar('confirmar', () async {
    _pedido = await widget.api.confirmarPedido(_pedido.id);
    return 'Pedido confirmado. Agora é possível despachar o drone.';
  });

  Future<void> _processar() => _executar('processar', () async {
    _pedido = await widget.api.atualizarStatus(_pedido.id, 'em_processamento');
    return 'Pedido em processamento no centro logístico.';
  });

  Future<void> _entregar() async {
    final ok = await confirmar(
      context,
      titulo: 'Confirmar entrega',
      mensagem: 'Marque como entregue somente depois que o destinatário receber o item.',
      acao: 'Marcar como entregue',
    );
    if (!ok) return;
    await _executar('entregar', () async {
      _pedido = await widget.api.atualizarStatus(_pedido.id, 'entregue');
      return 'Entrega concluída.';
    });
  }

  Future<void> _cancelar() async {
    final ok = await confirmar(
      context,
      titulo: 'Cancelar pedido?',
      mensagem:
          'O pedido "${_pedido.item}" será cancelado. Essa ação não pode ser desfeita.',
      acao: 'Cancelar pedido',
      destrutiva: true,
    );
    if (!ok) return;
    await _executar('cancelar', () async {
      _pedido = await widget.api.cancelarPedido(_pedido.id);
      return 'Pedido cancelado.';
    });
  }

  Future<(Coordenada, Coordenada)> _coordenadas() async {
    final origem = await widget.api.geocodificar(_pedido.origem);
    if (origem == null) {
      throw const ApiException(
        'Endereço de coleta não encontrado. Revise o pedido ou informe um endereço mais completo.',
      );
    }
    final destino = await widget.api.geocodificar(_pedido.destino);
    if (destino == null) {
      throw const ApiException(
        'Endereço de entrega não encontrado. Revise o pedido ou informe um endereço mais completo.',
      );
    }
    return (origem.coordenada, destino.coordenada);
  }

  /// Calcula a rota com `pedidoId`; o serviço de pedidos reage ao evento.
  Future<void> _despachar() => _executar('despachar', () async {
    final (origem, destino) = await _coordenadas();
    final rota = await widget.api.rota(origem, destino, pedidoId: _pedido.id);
    if (mounted) setState(() => _rota = rota);
    for (var tentativa = 0; tentativa < 5; tentativa++) {
      final atual = await widget.api.pedido(_pedido.id);
      if (mounted) setState(() => _pedido = atual);
      if (atual.status == 'em_rota') {
        return 'Drone despachado. O pedido está em rota.';
      }
      await Future<void>.delayed(widget.intervaloAtualizacao);
    }
    return 'Rota calculada. O status será atualizado assim que o barramento entregar o evento; use Atualizar.';
  });

  Future<void> _verRota() => _executar('rota', () async {
    final (origem, destino) = await _coordenadas();
    final rota = await widget.api.rota(origem, destino);
    if (mounted) setState(() => _rota = rota);
    return 'Rota recalculada.';
  });

  @override
  Widget build(BuildContext context) {
    final pedido = _pedido;
    final ocupado = _acaoEmAndamento != null;
    return Scaffold(
      appBar: AppBar(
        title: Text('Pedido #${pedido.codigo}'),
        actions: [
          IconButton(
            tooltip: 'Copiar código do pedido',
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: pedido.id));
              if (context.mounted) avisar(context, 'Código copiado.');
            },
            icon: const Icon(Icons.copy_outlined),
          ),
          IconButton(
            tooltip: 'Atualizar pedido',
            onPressed: _carregando || ocupado ? null : _carregar,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: ConteudoPagina(
        maxWidth: 820,
        onRefresh: _carregar,
        children: [
          if (_carregando || ocupado) const LinearProgressIndicator(),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Titulo(
                  pedido.item,
                  subtitulo: '${pedido.nomeModalidade} · ${peso(pedido.peso)}',
                ),
              ),
              const SizedBox(width: 12),
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: StatusChip(pedido.status),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_mensagem != null) ...[
            Semantics(
              liveRegion: true,
              child: Painel(
                child: Row(
                  children: [
                    Icon(
                      Icons.check_circle_outline,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Text(_mensagem!)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          if (_erro != null) ...[
            MensagemErro(_erro!),
            const SizedBox(height: 16),
          ],
          _acoes(pedido, ocupado),
          const SizedBox(height: 16),
          if (_rota != null) ...[
            Painel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Titulo('Rota do drone', nivel: 2),
                  const SizedBox(height: 12),
                  RotaMapa(
                    rota: _rota!,
                    origem: pedido.origem,
                    destino: pedido.destino,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          Painel(child: _dados(pedido)),
          const SizedBox(height: 16),
          Painel(child: _linhaDoTempo(pedido)),
        ],
      ),
    );
  }

  Widget _acoes(Pedido pedido, bool ocupado) {
    String rotulo(String acao, String padrao, String andamento) =>
        _acaoEmAndamento == acao ? andamento : padrao;
    final botoes = <Widget>[
      if (pedido.podeConfirmar)
        FilledButton.icon(
          onPressed: ocupado ? null : _confirmar,
          icon: const Icon(Icons.verified_outlined),
          label: Text(
            rotulo('confirmar', 'Confirmar pedido', 'Confirmando...'),
          ),
        ),
      if (pedido.podeDespachar)
        FilledButton.icon(
          onPressed: ocupado ? null : _despachar,
          icon: const Icon(Icons.flight_takeoff),
          label: Text(
            rotulo('despachar', 'Calcular rota e despachar', 'Despachando...'),
          ),
        ),
      if (pedido.podeIniciarProcessamento)
        OutlinedButton.icon(
          onPressed: ocupado ? null : _processar,
          icon: const Icon(Icons.inventory_2_outlined),
          label: Text(
            rotulo('processar', 'Iniciar processamento', 'Atualizando...'),
          ),
        ),
      if (pedido.podeConcluirEntrega)
        FilledButton.icon(
          onPressed: ocupado ? null : _entregar,
          icon: const Icon(Icons.task_alt),
          label: Text(
            rotulo('entregar', 'Marcar como entregue', 'Concluindo...'),
          ),
        ),
      if (!pedido.podeDespachar &&
          pedido.status != 'cancelado' &&
          pedido.status != 'rascunho')
        OutlinedButton.icon(
          onPressed: ocupado ? null : _verRota,
          icon: const Icon(Icons.route),
          label: Text(rotulo('rota', 'Ver rota', 'Calculando...')),
        ),
      if (pedido.podeCancelar)
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            foregroundColor: Theme.of(context).colorScheme.error,
          ),
          onPressed: ocupado ? null : _cancelar,
          icon: const Icon(Icons.cancel_outlined),
          label: Text(rotulo('cancelar', 'Cancelar pedido', 'Cancelando...')),
        ),
    ];
    final dica = switch (pedido.status) {
      'rascunho' => 'Confirme o pedido para liberar o despacho do drone.',
      'confirmado' || 'em_processamento' => 'O despacho calcula a rota no serviço de rotas e move o pedido para "Em rota".',
      'em_rota' =>
        'O drone está a caminho. Conclua quando o item for recebido.',
      'entregue' => 'Entrega concluída. Nenhuma ação pendente.',
      _ => 'Pedido cancelado. Nenhuma ação disponível.',
    };
    return Painel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Titulo('Ações', nivel: 2),
          const SizedBox(height: 6),
          Text(dica),
          if (botoes.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(spacing: 12, runSpacing: 12, children: botoes),
          ],
        ],
      ),
    );
  }

  Widget _dados(Pedido pedido) {
    final cores = Theme.of(context).colorScheme;
    Widget linha(String rotulo, String valor) => Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(rotulo, style: TextStyle(color: cores.onSurfaceVariant)),
          const SizedBox(height: 2),
          SelectableText(valor),
        ],
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Titulo('Detalhes', nivel: 2),
        const SizedBox(height: 16),
        linha('Código', pedido.id),
        linha('Coleta', pedido.origem),
        linha('Entrega', pedido.destino),
        linha('Valor estimado', moeda.format(pedido.precoEstimado)),
        linha('Tempo estimado', '${pedido.tempoEstimado} minutos'),
        if (pedido.observacoes.isNotEmpty)
          linha('Observações', pedido.observacoes),
        linha('Criado em', dataHora(pedido.criadoEm)),
        linha('Atualizado em', dataHora(pedido.atualizadoEm)),
      ],
    );
  }

  Widget _linhaDoTempo(Pedido pedido) {
    final historico = _historico ?? const <EtapaHistorico>[];
    final cores = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Titulo('Histórico de status', nivel: 2),
        const SizedBox(height: 16),
        if (historico.isEmpty)
          const Text('Nenhuma alteração registrada.')
        else
          for (var i = 0; i < historico.length; i++)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Icon(
                      estiloStatus(context, historico[i].status).icone,
                      color: estiloStatus(context, historico[i].status).texto,
                    ),
                    if (i < historico.length - 1)
                      Container(
                        width: 2,
                        height: 28,
                        color: cores.outlineVariant,
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nomesStatus[historico[i].status] ??
                              historico[i].status,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        Text(
                          dataHora(historico[i].momento),
                          style: TextStyle(color: cores.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
      ],
    );
  }
}
