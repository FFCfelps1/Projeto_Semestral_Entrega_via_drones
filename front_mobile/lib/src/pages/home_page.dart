import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../services/skyswift_api.dart';
import 'conta_page.dart';
import 'notificacoes_page.dart';
import 'pedidos_page.dart';
import 'relatorios_page.dart';
import 'rotas_page.dart';

/// Navegação principal: barra inferior no celular e trilho lateral em telas largas.
class HomePage extends StatefulWidget {
  const HomePage({
    super.key,
    required this.api,
    required this.sessao,
    required this.onLogout,
    required this.onToggleTheme,
    required this.onUsuarioAtualizado,
    this.onDownload,
    this.abaInicial = 0,
  });
  final SkySwiftApi api;
  final Sessao sessao;
  final VoidCallback onLogout;
  final VoidCallback onToggleTheme;
  final ValueChanged<Usuario> onUsuarioAtualizado;
  final Future<void> Function(Uint8List bytes, String nome)? onDownload;
  final int abaInicial;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late int _aba = widget.abaInicial;
  int _naoLidas = 0;

  static const _destinos = [
    (Icons.inventory_2_outlined, Icons.inventory_2, 'Pedidos'),
    (Icons.route_outlined, Icons.route, 'Rotas'),
    (Icons.notifications_none, Icons.notifications, 'Notificações'),
    (Icons.insights_outlined, Icons.insights, 'Relatórios'),
    (Icons.person_outline, Icons.person, 'Conta'),
  ];

  @override
  void initState() {
    super.initState();
    _atualizarContagem();
  }

  Future<void> _atualizarContagem() async {
    try {
      final total = await widget.api.notificacoesNaoLidas();
      if (mounted) setState(() => _naoLidas = total);
    } catch (_) {
      // O indicador é auxiliar; a tela de notificações exibe o erro.
    }
  }

  void _selecionar(int indice) {
    setState(() => _aba = indice);
    _atualizarContagem();
  }

  Widget _icone(int i, {required bool selecionado}) {
    final (normal, ativo, _) = _destinos[i];
    final icone = Icon(selecionado ? ativo : normal);
    if (i != 2 || _naoLidas == 0) return icone;
    return Badge(
      label: Text(_naoLidas > 99 ? '99+' : '$_naoLidas'),
      child: icone,
    );
  }

  String _rotulo(int i) {
    final nome = _destinos[i].$3;
    return i == 2 && _naoLidas > 0 ? '$nome, $_naoLidas não lidas' : nome;
  }

  Widget _pagina() {
    return switch (_aba) {
      0 => PedidosPage(
        key: const ValueKey('aba-pedidos'),
        api: widget.api,
        sessao: widget.sessao,
        onToggleTheme: widget.onToggleTheme,
        onLogout: widget.onLogout,
        onAlteracao: _atualizarContagem,
      ),
      1 => RotasPage(
        key: const ValueKey('aba-rotas'),
        api: widget.api,
        onToggleTheme: widget.onToggleTheme,
        onLogout: widget.onLogout,
      ),
      2 => NotificacoesPage(
        key: const ValueKey('aba-notificacoes'),
        api: widget.api,
        onToggleTheme: widget.onToggleTheme,
        onLogout: widget.onLogout,
        onContagem: (total) {
          if (mounted) setState(() => _naoLidas = total);
        },
      ),
      3 => RelatoriosPage(
        key: const ValueKey('aba-relatorios'),
        api: widget.api,
        sessao: widget.sessao,
        onLogout: widget.onLogout,
        onToggleTheme: widget.onToggleTheme,
        onDownload: widget.onDownload,
      ),
      _ => ContaPage(
        key: const ValueKey('aba-conta'),
        api: widget.api,
        sessao: widget.sessao,
        onToggleTheme: widget.onToggleTheme,
        onLogout: widget.onLogout,
        onUsuarioAtualizado: widget.onUsuarioAtualizado,
      ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final largo = MediaQuery.sizeOf(context).width >= 840;
    if (largo) {
      return Scaffold(
        body: Row(
          children: [
            SafeArea(
              child: NavigationRail(
                selectedIndex: _aba,
                onDestinationSelected: _selecionar,
                labelType: NavigationRailLabelType.all,
                destinations: [
                  for (var i = 0; i < _destinos.length; i++)
                    NavigationRailDestination(
                      icon: _icone(i, selecionado: false),
                      selectedIcon: _icone(i, selecionado: true),
                      label: Text(_destinos[i].$3, semanticsLabel: _rotulo(i)),
                    ),
                ],
              ),
            ),
            const VerticalDivider(width: 1),
            Expanded(child: _pagina()),
          ],
        ),
      );
    }
    return Scaffold(
      body: _pagina(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _aba,
        onDestinationSelected: _selecionar,
        destinations: [
          for (var i = 0; i < _destinos.length; i++)
            NavigationDestination(
              icon: _icone(i, selecionado: false),
              selectedIcon: _icone(i, selecionado: true),
              label: _destinos[i].$3,
              tooltip: _rotulo(i),
            ),
        ],
      ),
    );
  }
}
