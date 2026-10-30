import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:timezone/timezone.dart' as tz;

import '../models/relatorio.dart';
import '../services/skyswift_api.dart';

final moeda = NumberFormat.currency(locale: 'pt_BR', symbol: r'R$');
final _numero = NumberFormat.decimalPattern('pt_BR');

/// Datas do backend chegam em UTC e são exibidas no horário de São Paulo.
String dataHora(DateTime? valor) => valor == null
    ? '—'
    : DateFormat('dd/MM/yyyy HH:mm')
          .format(tz.TZDateTime.from(valor, fusoSaoPaulo));

String peso(double kg) => '${_numero.format(kg)} kg';

String distancia(double metros) => metros >= 1000
    ? '${NumberFormat('#,##0.0', 'pt_BR').format(metros / 1000)} km'
    : '${metros.round()} m';

String duracao(double segundos) {
  final minutos = (segundos / 60).ceil();
  if (minutos < 60) return '$minutos min';
  return '${minutos ~/ 60} h ${minutos % 60} min';
}

/// Cartão com borda usado em todas as telas autenticadas.
class Painel extends StatelessWidget {
  const Painel({super.key, required this.child, this.padding = 20});
  final Widget child;
  final double padding;
  @override
  Widget build(BuildContext context) => Card(
    margin: EdgeInsets.zero,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
    ),
    child: Padding(padding: EdgeInsets.all(padding), child: child),
  );
}

/// Limita a largura em telas grandes e mantém rolagem em telas pequenas.
class ConteudoPagina extends StatelessWidget {
  const ConteudoPagina({
    super.key,
    required this.children,
    this.maxWidth = 960,
    this.onRefresh,
  });
  final List<Widget> children;
  final double maxWidth;
  final Future<void> Function()? onRefresh;
  @override
  Widget build(BuildContext context) {
    final lista = ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: children,
            ),
          ),
        ),
      ],
    );
    return SafeArea(
      child: onRefresh == null
          ? lista
          : RefreshIndicator(onRefresh: onRefresh!, child: lista),
    );
  }
}

class Titulo extends StatelessWidget {
  const Titulo(this.texto, {super.key, this.subtitulo, this.nivel = 1});
  final String texto;
  final String? subtitulo;
  final int nivel;
  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          headingLevel: nivel,
          child: Text(
            texto,
            style: nivel == 1
                ? tema.textTheme.headlineMedium
                : tema.textTheme.titleLarge,
          ),
        ),
        if (subtitulo != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitulo!,
            style: TextStyle(color: tema.colorScheme.onSurfaceVariant),
          ),
        ],
      ],
    );
  }
}

class Carregando extends StatelessWidget {
  const Carregando({super.key, this.mensagem = 'Carregando...'});
  final String mensagem;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(32),
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(mensagem, textAlign: TextAlign.center),
        ],
      ),
    ),
  );
}

class MensagemErro extends StatelessWidget {
  const MensagemErro(this.mensagem, {super.key, this.onTentarNovamente});
  final String mensagem;
  final VoidCallback? onTentarNovamente;
  @override
  Widget build(BuildContext context) {
    final cores = Theme.of(context).colorScheme;
    return Painel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.error_outline, color: cores.error),
              const SizedBox(width: 12),
              Expanded(
                child: Semantics(
                  liveRegion: true,
                  child: Text(mensagem, style: TextStyle(color: cores.error)),
                ),
              ),
            ],
          ),
          if (onTentarNovamente != null) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onTentarNovamente,
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar novamente'),
            ),
          ],
        ],
      ),
    );
  }
}

class EstadoVazio extends StatelessWidget {
  const EstadoVazio({
    super.key,
    required this.icone,
    required this.titulo,
    required this.mensagem,
    this.acao,
  });
  final IconData icone;
  final String titulo;
  final String mensagem;
  final Widget? acao;
  @override
  Widget build(BuildContext context) => Painel(
    padding: 32,
    child: Column(
      children: [
        Icon(icone, size: 48, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 16),
        Text(
          titulo,
          style: Theme.of(context).textTheme.titleMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(mensagem, textAlign: TextAlign.center),
        if (acao != null) ...[const SizedBox(height: 16), acao!],
      ],
    ),
  );
}

/// Cores por etapa; o texto sempre acompanha a cor para não depender dela.
({Color fundo, Color texto, IconData icone}) estiloStatus(
  BuildContext context,
  String status,
) {
  final escuro = Theme.of(context).brightness == Brightness.dark;
  Color base;
  IconData icone;
  switch (status) {
    case 'rascunho':
      base = const Color(0xff64748b);
      icone = Icons.edit_note;
    case 'confirmado':
      base = const Color(0xff2563eb);
      icone = Icons.verified_outlined;
    case 'em_processamento':
      base = const Color(0xffb45309);
      icone = Icons.inventory_2_outlined;
    case 'em_rota':
      base = const Color(0xff7c3aed);
      icone = Icons.flight_takeoff;
    case 'entregue':
      base = const Color(0xff15803d);
      icone = Icons.task_alt;
    case 'cancelado':
      base = const Color(0xffb91c1c);
      icone = Icons.cancel_outlined;
    default:
      base = const Color(0xff64748b);
      icone = Icons.help_outline;
  }
  return (
    fundo: base.withValues(alpha: escuro ? 0.28 : 0.12),
    texto: escuro ? Color.lerp(base, Colors.white, 0.65)! : base,
    icone: icone,
  );
}

class StatusChip extends StatelessWidget {
  const StatusChip(this.status, {super.key});
  final String status;
  @override
  Widget build(BuildContext context) {
    final estilo = estiloStatus(context, status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: estilo.fundo,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(estilo.icone, size: 16, color: estilo.texto),
          const SizedBox(width: 6),
          Text(
            nomesStatus[status] ?? status,
            style: TextStyle(
              color: estilo.texto,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

/// Ações de tema e saída repetidas na barra de cada seção.
List<Widget> acoesSessao(
  BuildContext context, {
  required VoidCallback onToggleTheme,
  required VoidCallback onLogout,
}) {
  final escuro = Theme.of(context).brightness == Brightness.dark;
  return [
    IconButton(
      tooltip: escuro
          ? 'Alternar para modo claro'
          : 'Alternar para modo escuro',
      onPressed: onToggleTheme,
      icon: Icon(escuro ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
    ),
    IconButton(
      tooltip: 'Sair',
      onPressed: onLogout,
      icon: const Icon(Icons.logout),
    ),
    const SizedBox(width: 4),
  ];
}

Future<bool> confirmar(
  BuildContext context, {
  required String titulo,
  required String mensagem,
  required String acao,
  bool destrutiva = false,
}) async {
  final resposta = await showDialog<bool>(
    context: context,
    builder: (context) {
      final cores = Theme.of(context).colorScheme;
      return AlertDialog(
        title: Text(titulo),
        content: Text(mensagem),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Voltar'),
          ),
          FilledButton(
            style: destrutiva
                ? FilledButton.styleFrom(
                    backgroundColor: cores.error,
                    foregroundColor: cores.onError,
                  )
                : null,
            onPressed: () => Navigator.pop(context, true),
            child: Text(acao),
          ),
        ],
      );
    },
  );
  return resposta ?? false;
}

void avisar(BuildContext context, String mensagem) {
  ScaffoldMessenger.of(context)
    ..clearSnackBars()
    ..showSnackBar(SnackBar(content: Text(mensagem)));
}

String mensagemDe(Object erro, String padrao) =>
    erro is ApiException ? erro.mensagem : padrao;
