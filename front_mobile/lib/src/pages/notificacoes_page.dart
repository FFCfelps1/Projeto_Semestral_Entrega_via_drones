import 'package:flutter/material.dart';

import '../models/operacao.dart';
import '../services/skyswift_api.dart';
import '../widgets/comum.dart';
import 'pedido_detalhe_page.dart';

/// Central de notificações geradas pelo barramento a partir dos pedidos.
class NotificacoesPage extends StatefulWidget {
  const NotificacoesPage({
    super.key,
    required this.api,
    required this.onToggleTheme,
    required this.onLogout,
    this.onContagem,
  });
  final SkySwiftApi api;
  final VoidCallback onToggleTheme;
  final VoidCallback onLogout;

  /// Informa à navegação quantas notificações seguem não lidas.
  final ValueChanged<int>? onContagem;
  @override
  State<NotificacoesPage> createState() => _NotificacoesPageState();
}

class _NotificacoesPageState extends State<NotificacoesPage> {
  List<Notificacao>? _notificacoes;
  bool _carregando = true;
  bool _somenteNaoLidas = false;
  String? _erro;
  final _marcando = <int>{};
  bool _marcandoTodas = false;

  int get _naoLidas => _notificacoes?.where((n) => !n.lida).length ?? 0;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final lista = await widget.api.notificacoes();
      if (!mounted) return;
      setState(() => _notificacoes = lista);
      widget.onContagem?.call(_naoLidas);
    } catch (erro) {
      if (mounted) {
        setState(
          () => _erro = mensagemDe(
            erro,
            'Não foi possível carregar as notificações.',
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  void _substituir(Notificacao nova) {
    setState(
      () => _notificacoes = [
        for (final n in _notificacoes ?? const <Notificacao>[])
          n.id == nova.id ? nova : n,
      ],
    );
    widget.onContagem?.call(_naoLidas);
  }

  Future<void> _marcar(Notificacao notificacao) async {
    setState(() => _marcando.add(notificacao.id));
    try {
      _substituir(await widget.api.marcarNotificacaoLida(notificacao.id));
    } catch (erro) {
      if (mounted) {
        avisar(
          context,
          mensagemDe(erro, 'Não foi possível marcar a notificação como lida.'),
        );
      }
    } finally {
      if (mounted) setState(() => _marcando.remove(notificacao.id));
    }
  }

  Future<void> _marcarTodas() async {
    setState(() => _marcandoTodas = true);
    try {
      final total = await widget.api.marcarTodasNotificacoesLidas();
      if (!mounted) return;
      avisar(
        context,
        total == 1
            ? '1 notificação marcada como lida.'
            : '$total notificações marcadas como lidas.',
      );
      await _carregar();
    } catch (erro) {
      if (mounted) {
        avisar(
          context,
          mensagemDe(erro, 'Não foi possível marcar as notificações.'),
        );
      }
    } finally {
      if (mounted) setState(() => _marcandoTodas = false);
    }
  }

  Future<void> _abrirPedido(String id) async {
    try {
      final pedido = await widget.api.pedido(id);
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              PedidoDetalhePage(api: widget.api, pedidoInicial: pedido),
        ),
      );
    } catch (erro) {
      if (mounted) {
        avisar(context, mensagemDe(erro, 'Não foi possível abrir o pedido.'));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final todas = _notificacoes;
    final visiveis = todas == null
        ? null
        : (_somenteNaoLidas ? todas.where((n) => !n.lida).toList() : todas);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificações'),
        actions: [
          IconButton(
            tooltip: 'Atualizar notificações',
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
      body: ConteudoPagina(
        onRefresh: _carregar,
        children: [
          Titulo(
            'Central de notificações',
            subtitulo: todas == null
                ? 'Avisos gerados quando pedidos são criados.'
                : (_naoLidas == 0
                      ? 'Tudo em dia: nenhuma notificação não lida.'
                      : (_naoLidas == 1
                            ? '1 notificação não lida.'
                            : '$_naoLidas notificações não lidas.')),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              FilterChip(
                label: const Text('Somente não lidas'),
                selected: _somenteNaoLidas,
                onSelected: (v) => setState(() => _somenteNaoLidas = v),
              ),
              OutlinedButton.icon(
                onPressed: _naoLidas == 0 || _marcandoTodas
                    ? null
                    : _marcarTodas,
                icon: const Icon(Icons.done_all),
                label: Text(
                  _marcandoTodas ? 'Marcando...' : 'Marcar todas como lidas',
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_carregando && todas == null)
            const Carregando(mensagem: 'Carregando notificações...')
          else if (_erro != null)
            MensagemErro(_erro!, onTentarNovamente: _carregar)
          else if (visiveis != null && visiveis.isEmpty)
            EstadoVazio(
              icone: Icons.notifications_none,
              titulo: _somenteNaoLidas
                  ? 'Nenhuma notificação não lida'
                  : 'Nenhuma notificação',
              mensagem: 'Novos pedidos geram avisos automaticamente.',
            )
          else if (visiveis != null)
            for (final n in visiveis) ...[
              _CartaoNotificacao(
                notificacao: n,
                marcando: _marcando.contains(n.id),
                onMarcar: () => _marcar(n),
                onAbrirPedido: n.pedidoId == null
                    ? null
                    : () => _abrirPedido(n.pedidoId!),
              ),
              const SizedBox(height: 12),
            ],
        ],
      ),
    );
  }
}

class _CartaoNotificacao extends StatelessWidget {
  const _CartaoNotificacao({
    required this.notificacao,
    required this.marcando,
    required this.onMarcar,
    this.onAbrirPedido,
  });
  final Notificacao notificacao;
  final bool marcando;
  final VoidCallback onMarcar;
  final VoidCallback? onAbrirPedido;
  @override
  Widget build(BuildContext context) {
    final cores = Theme.of(context).colorScheme;
    final lida = notificacao.lida;
    return Painel(
      padding: 16,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            lida ? Icons.drafts_outlined : Icons.mark_email_unread_outlined,
            color: lida ? cores.onSurfaceVariant : cores.primary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lida ? notificacao.titulo : '${notificacao.titulo} · nova',
                  style: TextStyle(
                    fontWeight: lida ? FontWeight.w500 : FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(notificacao.mensagem),
                const SizedBox(height: 4),
                Text(
                  dataHora(notificacao.criadoEm),
                  style: TextStyle(color: cores.onSurfaceVariant),
                ),
                Wrap(
                  spacing: 8,
                  children: [
                    if (onAbrirPedido != null)
                      TextButton(
                        onPressed: onAbrirPedido,
                        child: const Text('Ver pedido'),
                      ),
                    if (!lida)
                      TextButton(
                        onPressed: marcando ? null : onMarcar,
                        child: Text(
                          marcando ? 'Marcando...' : 'Marcar como lida',
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
