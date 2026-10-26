import 'dart:math' as math;
import 'dart:typed_data';

import '../services/download.dart';

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
    this.onDownload,
  });
  final Future<void> Function(Uint8List bytes, String nome)? onDownload;
  final SkySwiftApi api;
  final Sessao sessao;
  final VoidCallback onLogout;
  final VoidCallback onToggleTheme;
  @override
  State<RelatoriosPage> createState() => _RelatoriosPageState();
}

class _RelatoriosPageState extends State<RelatoriosPage> {
  FiltrosRelatorio _filtros = FiltrosRelatorio.padrao();
  ResumoRelatorio? _resumo;
  bool _carregando = true;
  String? _erro;
  int _geracao = 0;
  late final TextEditingController _inicio;
  late final TextEditingController _fim;
  String? _status;
  String? _tipo;
  bool _exportando = false;
  String? _mensagemExportacao;
  final _moeda = NumberFormat.currency(locale: 'pt_BR', symbol: r'R$');
  @override
  void initState() {
    super.initState();
    _inicio = TextEditingController(text: _data(_filtros.inicio));
    _fim = TextEditingController(text: _data(_filtros.fim));
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
                    _painel(child: _formulario()),
                    if (_mensagemExportacao != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: Semantics(
                          liveRegion: true,
                          child: Text(_mensagemExportacao!),
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

  @override
  void dispose() {
    _inicio.dispose();
    _fim.dispose();
    super.dispose();
  }

  Future<void> _escolherData(TextEditingController controller) async {
    DateTime atual;
    try {
      atual = DateFormat('dd/MM/yyyy').parseStrict(controller.text);
    } catch (_) {
      atual = DateTime.now();
    }
    final data = await showDatePicker(
      context: context,
      initialDate: atual,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (data != null && mounted) {
      setState(() => controller.text = DateFormat('dd/MM/yyyy').format(data));
    }
  }

  void _aplicar() {
    try {
      final inicio = DateFormat('dd/MM/yyyy').parseStrict(_inicio.text);
      final fim = DateFormat('dd/MM/yyyy').parseStrict(_fim.text);
      if (inicio.isAfter(fim)) throw const FormatException();
      if (fim.difference(inicio).inDays >= 366) {
        setState(() => _erro = 'Selecione um período de até 366 dias.');
        return;
      }
      _filtros = FiltrosRelatorio(
        inicio: DateFormat('yyyy-MM-dd').format(inicio),
        fim: DateFormat('yyyy-MM-dd').format(fim),
        status: _status,
        tipo: _tipo,
      );
      _carregar();
    } on FormatException {
      setState(
        () => _erro = 'Informe datas válidas em DD/MM/AAAA, com a inicial anterior ou igual à final.',
      );
    }
  }

  void _limpar() {
    _filtros = FiltrosRelatorio.padrao();
    _inicio.text = _data(_filtros.inicio);
    _fim.text = _data(_filtros.fim);
    _status = null;
    _tipo = null;
    _carregar();
  }

  Future<void> _exportar() async {
    final filtros = _resumo?.filtros;
    if (filtros == null || _exportando) return;
    setState(() {
      _exportando = true;
      _mensagemExportacao = null;
    });
    try {
      final arquivo = await widget.api.exportar(widget.sessao.token, filtros);
      if (!mounted) return;
      await (widget.onDownload ?? salvarCsv)(arquivo.bytes, arquivo.nome);
      if (mounted) {
        setState(
          () => _mensagemExportacao =
              'Relatório gerado. Confira os downloads do navegador.',
        );
      }
    } catch (erro) {
      if (!mounted) return;
      if (erro is ApiException && erro.status == 401) {
        widget.onLogout();
        return;
      }
      setState(
        () => _mensagemExportacao = erro is ApiException
            ? erro.mensagem
            : 'Não foi possível baixar o relatório. Tente novamente.',
      );
    } finally {
      if (mounted) setState(() => _exportando = false);
    }
  }

  Widget _formulario() {
    final bloqueado = _carregando || _exportando;
    final pendente =
        _resumo != null &&
        (_inicio.text != _data(_resumo!.filtros.inicio) ||
            _fim.text != _data(_resumo!.filtros.fim) ||
            _status != _resumo!.filtros.status ||
            _tipo != _resumo!.filtros.tipo);
    Widget campoData(
      String rotulo,
      TextEditingController controller,
      String chave,
    ) => SizedBox(
      width: 205,
      child: TextField(
        key: ValueKey(chave),
        controller: controller,
        enabled: !bloqueado,
        keyboardType: TextInputType.datetime,
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          labelText: rotulo,
          hintText: 'DD/MM/AAAA',
          suffixIcon: IconButton(
            tooltip: 'Escolher $rotulo',
            onPressed: bloqueado ? null : () => _escolherData(controller),
            icon: const Icon(Icons.calendar_month_outlined),
          ),
        ),
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Filtros do relatório',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        const Text('Datas no fuso de São Paulo · Até 366 dias por consulta'),
        const SizedBox(height: 20),
        Wrap(
          spacing: 16,
          runSpacing: 20,
          children: [
            campoData('Data inicial', _inicio, 'inicio'),
            campoData('Data final', _fim, 'fim'),
            SizedBox(
              width: 205,
              child: DropdownButtonFormField<String>(
                key: ValueKey('status-${_status ?? "todos"}'),
                initialValue: _status ?? '',
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Status'),
                items: [
                  const DropdownMenuItem(
                    value: '',
                    child: Text('Todos os status'),
                  ),
                  ...nomesStatus.entries.map(
                    (item) => DropdownMenuItem(
                      value: item.key,
                      child: Text(item.value),
                    ),
                  ),
                ],
                onChanged: bloqueado
                    ? null
                    : (valor) =>
                          setState(() => _status = valor == '' ? null : valor),
              ),
            ),
            SizedBox(
              width: 205,
              child: DropdownButtonFormField<String>(
                key: ValueKey('tipo-${_tipo ?? "todos"}'),
                initialValue: _tipo ?? '',
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Modalidade'),
                items: [
                  const DropdownMenuItem(
                    value: '',
                    child: Text('Todas as modalidades'),
                  ),
                  ...nomesModalidades.entries.map(
                    (item) => DropdownMenuItem(
                      value: item.key,
                      child: Text(item.value),
                    ),
                  ),
                ],
                onChanged: bloqueado
                    ? null
                    : (valor) =>
                          setState(() => _tipo = valor == '' ? null : valor),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            ElevatedButton.icon(
              key: const ValueKey('aplicar'),
              onPressed: bloqueado ? null : _aplicar,
              icon: const Icon(Icons.filter_alt_outlined),
              label: const Text('Aplicar filtros'),
            ),
            OutlinedButton.icon(
              onPressed: bloqueado ? null : _limpar,
              icon: const Icon(Icons.restart_alt),
              label: const Text('Limpar'),
            ),
            OutlinedButton.icon(
              key: const ValueKey('exportar'),
              onPressed: bloqueado || _erro != null || _resumo == null
                  ? null
                  : _exportar,
              icon: const Icon(Icons.download_outlined),
              label: Text(_exportando ? 'Exportando...' : 'Exportar CSV'),
            ),
          ],
        ),
        if (pendente)
          const Padding(
            padding: EdgeInsets.only(top: 16),
            child: Text(
              'Há filtros não aplicados. Os indicadores e o CSV usam a última consulta realizada.',
            ),
          ),
      ],
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
                semanticsLabel:
                    '${entrada.value}: ${quantidades[entrada.key] ?? 0} de $total pedidos',
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
