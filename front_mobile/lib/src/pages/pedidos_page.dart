import 'package:flutter/material.dart';

import '../models/pedido.dart';
import '../services/skyswift_api.dart';
import '../widgets/comum.dart';
import 'novo_pedido_page.dart';
import 'pedido_detalhe_page.dart';

/// Lista os pedidos do usuário autenticado, com filtro de status no backend.
class PedidosPage extends StatefulWidget {
  const PedidosPage({
    super.key,
    required this.api,
    required this.sessao,
    required this.onToggleTheme,
    required this.onLogout,
    this.onAlteracao,
  });
  final SkySwiftApi api;
  final Sessao sessao;
  final VoidCallback onToggleTheme;
  final VoidCallback onLogout;

  /// Avisa a navegação para atualizar indicadores, como notificações.
  final VoidCallback? onAlteracao;

  @override
  State<PedidosPage> createState() => _PedidosPageState();
}

class _PedidosPageState extends State<PedidosPage> {
  List<Pedido>? _pedidos;
  String? _status;
  String? _erro;
  bool _carregando = true;
  int _geracao = 0;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final geracao = ++_geracao;
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final pedidos = await widget.api.pedidos(
        usuarioId: widget.sessao.usuario.id,
        status: _status,
      );
      if (mounted && geracao == _geracao) setState(() => _pedidos = pedidos);
    } catch (erro) {
      if (mounted && geracao == _geracao) {
        setState(
          () => _erro = mensagemDe(
            erro,
            'Não foi possível carregar seus pedidos. Tente novamente.',
          ),
        );
      }
    } finally {
      if (mounted && geracao == _geracao) setState(() => _carregando = false);
    }
  }

  void _filtrar(String? status) {
    if (status == _status) return;
    setState(() => _status = status);
    _carregar();
  }

  Future<void> _novoPedido() async {
    final criado = await Navigator.of(context).push<Pedido>(
      MaterialPageRoute(
        builder: (_) => NovoPedidoPage(
          api: widget.api,
          usuarioId: widget.sessao.usuario.id,
        ),
      ),
    );
    if (criado == null || !mounted) return;
    widget.onAlteracao?.call();
    await _abrir(criado);
  }

  Future<void> _abrir(Pedido pedido) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PedidoDetalhePage(
          api: widget.api,
          pedidoInicial: pedido,
          onAlteracao: widget.onAlteracao,
        ),
      ),
    );
    if (mounted) _carregar();
  }

  @override
  Widget build(BuildContext context) {
    final pedidos = _pedidos;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pedidos'),
        actions: [
          IconButton(
            tooltip: 'Atualizar pedidos',
            onPressed: _carregando ? null : _carregar,
            icon: const Icon(Icons.refresh),
          ),
          ...acoesSessao(
            context,
            onToggleTheme: widget.onToggleTheme,
            onLogout: widget.onLogout,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _novoPedido,
        icon: const Icon(Icons.add),
        label: const Text('Novo pedido'),
      ),
      body: ConteudoPagina(
        onRefresh: _carregar,
        children: [
          Titulo(
            'Olá, ${widget.sessao.usuario.nome.split(' ').first}',
            subtitulo: 'Crie entregas por drone, acompanhe cada etapa e despache o drone quando o pedido estiver confirmado.',
          ),
          const SizedBox(height: 20),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final opcao in <String?>[null, ...nomesStatus.keys])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        opcao == null ? 'Todos' : nomesStatus[opcao]!,
                      ),
                      selected: _status == opcao,
                      onSelected: _carregando ? null : (_) => _filtrar(opcao),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_carregando && pedidos == null)
            const Carregando(mensagem: 'Carregando pedidos...')
          else if (_erro != null)
            MensagemErro(_erro!, onTentarNovamente: _carregar)
          else if (pedidos != null && pedidos.isEmpty)
            EstadoVazio(
              icone: Icons.inventory_2_outlined,
              titulo: _status == null
                  ? 'Você ainda não tem pedidos'
                  : 'Nenhum pedido ${nomesStatus[_status]!.toLowerCase()}',
              mensagem: _status == null
                  ? 'Crie o primeiro pedido para calcular preço, prazo e rota do drone.'
                  : 'Escolha outro status para ver os demais pedidos.',
              acao: _status == null
                  ? FilledButton.icon(
                      onPressed: _novoPedido,
                      icon: const Icon(Icons.add),
                      label: const Text('Criar pedido'),
                    )
                  : null,
            )
          else if (pedidos != null) ...[
            if (_carregando) const LinearProgressIndicator(),
            Text(
              pedidos.length == 1 ? '1 pedido' : '${pedidos.length} pedidos',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            for (final pedido in pedidos) ...[
              _CartaoPedido(pedido: pedido, onTap: () => _abrir(pedido)),
              const SizedBox(height: 12),
            ],
          ],
        ],
      ),
    );
  }
}

class _CartaoPedido extends StatelessWidget {
  const _CartaoPedido({required this.pedido, required this.onTap});
  final Pedido pedido;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final cores = Theme.of(context).colorScheme;
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: cores.outlineVariant),
      ),
      child: InkWell(
        onTap: onTap,
        child: Semantics(
          button: true,
          label: 'Abrir pedido ${pedido.item}, ${pedido.nomeStatus}',
          excludeSemantics: true,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            pedido.item,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            '#${pedido.codigo} · ${pedido.nomeModalidade}',
                            style: TextStyle(color: cores.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    StatusChip(pedido.status),
                  ],
                ),
                const SizedBox(height: 12),
                _Trajeto(origem: pedido.origem, destino: pedido.destino),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 16,
                  runSpacing: 4,
                  children: [
                    Text(
                      moeda.format(pedido.precoEstimado),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text('${pedido.tempoEstimado} min'),
                    Text(peso(pedido.peso)),
                    Text(
                      dataHora(pedido.criadoEm),
                      style: TextStyle(color: cores.onSurfaceVariant),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Trajeto extends StatelessWidget {
  const _Trajeto({required this.origem, required this.destino});
  final String origem;
  final String destino;
  @override
  Widget build(BuildContext context) {
    final cores = Theme.of(context).colorScheme;
    Widget linha(IconData icone, Color cor, String texto) => Row(
      children: [
        Icon(icone, size: 18, color: cor),
        const SizedBox(width: 8),
        Expanded(
          child: Text(texto, maxLines: 2, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
    return Column(
      children: [
        linha(Icons.trip_origin, const Color(0xff15803d), origem),
        const SizedBox(height: 4),
        linha(Icons.place_outlined, cores.error, destino),
      ],
    );
  }
}
