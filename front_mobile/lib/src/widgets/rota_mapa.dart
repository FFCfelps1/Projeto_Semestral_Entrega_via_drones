import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/operacao.dart';
import 'comum.dart';

/// Desenho esquemático da rota devolvida pelo serviço Dart, sem mapa de fundo.
class RotaMapa extends StatelessWidget {
  const RotaMapa({
    super.key,
    required this.rota,
    required this.origem,
    required this.destino,
    this.altura = 220,
  });
  final ResultadoRota rota;
  final String origem;
  final String destino;
  final double altura;

  Uri get _linkOsm {
    final pontos = rota.pontos;
    final a = pontos.first;
    final b = pontos.last;
    return Uri.https('www.openstreetmap.org', '/directions', {
      'engine': 'fossgis_osrm_car',
      'route': '${a.lat},${a.lng};${b.lat},${b.lng}',
    });
  }

  @override
  Widget build(BuildContext context) {
    final cores = Theme.of(context).colorScheme;
    final resumo =
        'Rota de ${distancia(rota.distanciaMetros)}, cerca de ${duracao(rota.duracaoSegundos)}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          label: '$resumo, de $origem até $destino.',
          image: true,
          child: ExcludeSemantics(
            child: Container(
              height: altura,
              decoration: BoxDecoration(
                color: cores.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: cores.outlineVariant),
              ),
              child: rota.pontos.length < 2
                  ? const Center(child: Text('Rota sem pontos suficientes.'))
                  : CustomPaint(
                      painter: _RotaPainter(
                        pontos: rota.pontos,
                        linha: cores.primary,
                        grade: cores.outlineVariant,
                        origem: const Color(0xff15803d),
                        destino: cores.error,
                        aproximada: rota.aproximada,
                      ),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 16,
          runSpacing: 8,
          children: [
            _Metrica(
              Icons.straighten,
              'Distância',
              distancia(rota.distanciaMetros),
            ),
            _Metrica(
              Icons.timer_outlined,
              'Tempo estimado',
              duracao(rota.duracaoSegundos),
            ),
            _Metrica(Icons.route, 'Pontos da rota', '${rota.pontos.length}'),
          ],
        ),
        if (rota.aproximada) ...[
          const SizedBox(height: 8),
          Text(
            rota.aviso ?? 'Rota aproximada em linha reta: o provedor de mapas não respondeu.',
            style: TextStyle(color: cores.onSurfaceVariant),
          ),
        ],
        if (rota.pontos.length >= 2) ...[
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () => launchUrl(_linkOsm),
              icon: const Icon(Icons.map_outlined),
              label: const Text('Abrir no OpenStreetMap'),
            ),
          ),
        ],
      ],
    );
  }
}

class _Metrica extends StatelessWidget {
  const _Metrica(this.icone, this.rotulo, this.valor);
  final IconData icone;
  final String rotulo;
  final String valor;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icone, size: 20, color: Theme.of(context).colorScheme.primary),
      const SizedBox(width: 6),
            Flexible(
        child: Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: '$rotulo: ',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
              TextSpan(text: valor),
            ],
          ),
        ),
      ),
    ],
  );
}

class _RotaPainter extends CustomPainter {
  _RotaPainter({
    required this.pontos,
    required this.linha,
    required this.grade,
    required this.origem,
    required this.destino,
    required this.aproximada,
  });
  final List<Coordenada> pontos;
  final Color linha;
  final Color grade;
  final Color origem;
  final Color destino;
  final bool aproximada;

  @override
  void paint(Canvas canvas, Size size) {
    final paintGrade = Paint()
      ..color = grade
      ..strokeWidth = 1;
    for (var x = 0.0; x < size.width; x += 32) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paintGrade);
    }
    for (var y = 0.0; y < size.height; y += 32) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paintGrade);
    }

    // Projeção equiretangular corrigida pela latitude média: suficiente na escala urbana.
    final latMedia =
        pontos.map((p) => p.lat).reduce((a, b) => a + b) / pontos.length;
    final fator = math.cos(latMedia * math.pi / 180);
    final xs = pontos.map((p) => p.lng * fator).toList();
    final ys = pontos.map((p) => -p.lat).toList();
    final minX = xs.reduce(math.min), maxX = xs.reduce(math.max);
    final minY = ys.reduce(math.min), maxY = ys.reduce(math.max);
    const margem = 28.0;
    final largura = math.max(maxX - minX, 1e-9);
    final altura = math.max(maxY - minY, 1e-9);
    final escala = math.min(
      (size.width - 2 * margem) / largura,
      (size.height - 2 * margem) / altura,
    );
    final offsetX = (size.width - largura * escala) / 2;
    final offsetY = (size.height - altura * escala) / 2;
    Offset projetar(int i) => Offset(
      offsetX + (xs[i] - minX) * escala,
      offsetY + (ys[i] - minY) * escala,
    );

    final caminho = Path()..moveTo(projetar(0).dx, projetar(0).dy);
    for (var i = 1; i < pontos.length; i++) {
      final p = projetar(i);
      caminho.lineTo(p.dx, p.dy);
    }
    final traco = Paint()
      ..color = linha
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round;
    if (aproximada) {
      for (final metrica in caminho.computeMetrics()) {
        for (var d = 0.0; d < metrica.length; d += 14) {
          canvas.drawPath(metrica.extractPath(d, d + 8), traco);
        }
      }
    } else {
      canvas.drawPath(caminho, traco);
    }
    void marcador(Offset centro, Color cor) {
      canvas.drawCircle(centro, 10, Paint()..color = Colors.white);
      canvas.drawCircle(centro, 7, Paint()..color = cor);
    }

    marcador(projetar(0), origem);
    marcador(projetar(pontos.length - 1), destino);
  }

  @override
  bool shouldRepaint(_RotaPainter old) =>
      old.pontos != pontos ||
      old.linha != linha ||
      old.grade != grade ||
      old.aproximada != aproximada;
}
