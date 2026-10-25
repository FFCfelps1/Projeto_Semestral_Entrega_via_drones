import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:timezone/timezone.dart' as tz;

import '../models/relatorio.dart';
import '../services/skyswift_api.dart';

class RelatoriosPage extends StatefulWidget {
  const RelatoriosPage({
    super.key,
    required this.api,
    required this.sessao,
    required this.onLogout,
    required this.onToggleTheme,
  });
  final SkySwiftApi api;
  final Sessao sessao;
  final VoidCallback onLogout;
  final VoidCallback onToggleTheme;
  @override
  State<RelatoriosPage> createState() => _RelatoriosPageState();
}

class _RelatoriosPageState extends State<RelatoriosPage> {
  final FiltrosRelatorio _filtros = FiltrosRelatorio.padrao();
  ResumoRelatorio? _resumo;
  bool _carregando = true;
  String? _erro;
  int _geracao = 0;
  final _moeda = NumberFormat.currency(locale: 'pt_BR', symbol: r'R$');
  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final geracao = ++_geracao;
    final filtros = _filtros;
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final resumo = await widget.api.resumo(widget.sessao.token, filtros);
      if (mounted && geracao == _geracao) setState(() => _resumo = resumo);
    } catch (erro) {
      if (!mounted || geracao != _geracao) return;
      if (erro is ApiException && erro.status == 401) {
        widget.onLogout();
        return;
      }
      setState(
        () => _erro = erro is ApiException
            ? erro.mensagem
            : 'Não foi possível interpretar o relatório. Tente novamente.',
      );
    } finally {
      if (mounted && geracao == _geracao) setState(() => _carregando = false);
    }
  }

  String _data(String valor) =>
      DateFormat('dd/MM/yyyy').format(DateTime.parse(valor));
  @override
  Widget build(BuildContext context) {
    final cores = Theme.of(context).colorScheme;
    final escuro = cores.brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: escuro
          ? const Color(0xff0b1220)
          : const Color(0xfff0f5fb),
      appBar: AppBar(
        title: const Text('SkySwift'),
        actions: [
          IconButton(
            tooltip: 'Alternar tema',
            onPressed: widget.onToggleTheme,
            icon: Icon(
              escuro ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
          ),
          TextButton.icon(
            onPressed: widget.onLogout,
            icon: const Icon(Icons.logout),
            label: const Text('Sair'),
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1280),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'VISÃO DA OPERAÇÃO',
                      style: TextStyle(
                        color: cores.primary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.4,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Semantics(
                      headingLevel: 1,
                      child: Text(
                        'Relatórios de Entregas',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Olá, ${widget.sessao.usuario.nome}. Acompanhe os resultados dos pedidos e gere seus relatórios.',
                    ),
                    const SizedBox(height: 24),
                    _painel(
                      child: Wrap(
                        spacing: 16,
                        runSpacing: 12,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          const Icon(Icons.calendar_month_outlined),
                          Text(
                            '${_data(_filtros.inicio)} a ${_data(_filtros.fim)} · São Paulo',
                          ),
                          OutlinedButton.icon(
                            onPressed: _carregando ? null : _carregar,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Atualizar'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_carregando)
                      const Padding(
                        padding: EdgeInsets.all(36),
                        child: Center(
                          child: Column(
                            children: [
                              CircularProgressIndicator(),
                              SizedBox(height: 16),
                              Text('Carregando indicadores...'),
                            ],
                          ),
                        ),
                      ),
                    if (_erro != null)
                      _painel(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Semantics(
                              liveRegion: true,
                              child: Text(
                                _erro!,
                                style: TextStyle(color: cores.error),
                              ),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: _carregando ? null : _carregar,
                              icon: const Icon(Icons.refresh),
                              label: const Text('Tentar novamente'),
                            ),
                          ],
                        ),
                      ),
                    if (_resumo != null && !_carregando && _erro == null)
                      ..._conteudo(_resumo!),
                    const SizedBox(height: 24),
                    Text(
                      'Período pela criação do pedido · Classificação pelo status atual',
                      style: TextStyle(color: cores.onSurfaceVariant),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Os valores são estimativas dos pedidos selecionados e não representam receita recebida.',
                      style: TextStyle(color: cores.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _painel({required Widget child}) => Card(
    margin: EdgeInsets.zero,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
    ),
    child: Padding(padding: const EdgeInsets.all(24), child: child),
  );
  List<Widget> _conteudo(ResumoRelatorio resumo) {
    final cores = Theme.of(context).colorScheme;
    final valores = [
      (
        'Total de pedidos',
        NumberFormat.decimalPattern('pt_BR').format(resumo.totalPedidos),
        Icons.inventory_2_outlined,
      ),
      (
        'Valor estimado total',
        _moeda.format(num.parse(resumo.valorEstimadoTotal)),
        Icons.payments_outlined,
      ),
      (
        'Ticket médio estimado',
        _moeda.format(num.parse(resumo.ticketMedioEstimado)),
        Icons.receipt_long_outlined,
      ),
      (
        'Pedidos entregues',
        '${resumo.porStatus['entregue'] ?? 0}',
        Icons.task_alt,
      ),
    ];
    return [
      LayoutBuilder(
        builder: (context, constraints) {
          final colunas = constraints.maxWidth >= 1000
              ? 4
              : constraints.maxWidth >= 560
              ? 2
              : 1;
          return Wrap(
            spacing: 16,
            runSpacing: 16,
            children: valores
                .map(
                  (item) => SizedBox(
                    width:
                        (constraints.maxWidth - (colunas - 1) * 16) / colunas,
                    child: _painel(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(item.$3, color: cores.primary),
                          const SizedBox(height: 20),
                          Text(
                            item.$1,
                            style: TextStyle(color: cores.onSurfaceVariant),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            item.$2,
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          );
        },
      ),
      const SizedBox(height: 24),
      if (resumo.totalPedidos == 0) ...[
        _painel(
          child: const Column(
            children: [
              Icon(Icons.query_stats, size: 48),
              SizedBox(height: 16),
              Text('Nenhum pedido neste período'),
              SizedBox(height: 8),
              Text('Experimente outro período ou outros filtros.'),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
      LayoutBuilder(
        builder: (context, constraints) {
          final diario = _painel(child: _volume(resumo));
          final status = _painel(
            child: _distribuicao(
              'Distribuição por status',
              resumo.porStatus,
              nomesStatus,
              resumo.totalPedidos,
            ),
          );
          if (constraints.maxWidth >= 900) {
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 3, child: diario),
                const SizedBox(width: 24),
                Expanded(flex: 2, child: status),
              ],
            );
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [diario, const SizedBox(height: 24), status],
          );
        },
      ),
      const SizedBox(height: 24),
      _painel(
        child: _distribuicao(
          'Modalidades de entrega',
          resumo.porModalidade,
          nomesModalidades,
          resumo.totalPedidos,
        ),
      ),
      const SizedBox(height: 16),
      Text(
        'Atualizado em ${DateFormat('dd/MM/yyyy HH:mm').format(tz.TZDateTime.from(resumo.geradoEm, fusoSaoPaulo))} · São Paulo',
        style: TextStyle(color: cores.onSurfaceVariant),
      ),
    ];
  }

  Widget _distribuicao(
    String titulo,
    Map<String, int> quantidades,
    Map<String, String> nomes,
    int total,
  ) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Semantics(
        headingLevel: 2,
        child: Text(titulo, style: Theme.of(context).textTheme.titleLarge),
      ),
      const SizedBox(height: 20),
      for (final entrada in nomes.entries)
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(child: Text(entrada.value)),
                  Text('${quantidades[entrada.key] ?? 0}'),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: total == 0 ? 0 : (quantidades[entrada.key] ?? 0) / total,
                minHeight: 6,
                borderRadius: BorderRadius.circular(4),
                semanticsLabel: entrada.value,
                semanticsValue:
                    '${quantidades[entrada.key] ?? 0} de $total pedidos',
              ),
            ],
          ),
        ),
    ],
  );
  Widget _volume(ResumoRelatorio resumo) {
    final maximo = resumo.pedidosPorDia.fold(
      1,
      (maior, dia) => math.max(maior, dia.quantidade),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          headingLevel: 2,
          child: Text(
            'Volume diário',
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        const SizedBox(height: 8),
        const Text('Pedidos criados por dia'),
        const SizedBox(height: 24),
        SizedBox(
          height: 170,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (final dia in resumo.pedidosPorDia)
                Expanded(
                  child: Tooltip(
                    message: '${_data(dia.data)}: ${dia.quantidade} pedidos',
                    child: Semantics(
                      label: '${_data(dia.data)}: ${dia.quantidade} pedidos',
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 1),
                        child: Container(
                          height: math.max(2, dia.quantidade / maximo * 170),
                          decoration: BoxDecoration(
                            color: dia.quantidade == 0
                                ? Theme.of(context).colorScheme.outlineVariant
                                : Theme.of(context).colorScheme.primary,
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          spacing: 12,
          children: [
            Text(_data(resumo.filtros.inicio)),
            Text(_data(resumo.filtros.fim)),
          ],
        ),
      ],
    );
  }
}
