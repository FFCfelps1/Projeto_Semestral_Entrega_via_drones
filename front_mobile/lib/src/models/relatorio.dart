import 'package:timezone/data/latest.dart' as dados_fusos;
import 'package:timezone/timezone.dart' as tz;

tz.Location? _fuso;
tz.Location get fusoSaoPaulo {
  if (_fuso == null) {
    dados_fusos.initializeTimeZones();
    _fuso = tz.getLocation('America/Sao_Paulo');
  }
  return _fuso!;
}

const nomesStatus = <String, String>{
  'rascunho': 'Rascunho',
  'confirmado': 'Confirmado',
  'em_processamento': 'Em processamento',
  'em_rota': 'Em rota',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado',
};
const nomesModalidades = <String, String>{
  'padrao': 'Padrão',
  'expressa': 'Expressa',
  'prioritaria': 'Prioritária',
};

class FiltrosRelatorio {
  const FiltrosRelatorio({
    required this.inicio,
    required this.fim,
    this.status,
    this.tipo,
  });
  factory FiltrosRelatorio.padrao({DateTime? agora}) {
    final hoje = tz.TZDateTime.from(agora ?? DateTime.now(), fusoSaoPaulo);
    final inicio = tz.TZDateTime(
      fusoSaoPaulo,
      hoje.year,
      hoje.month,
      hoje.day - 29,
    );
    return FiltrosRelatorio(
      inicio: inicio.toIso8601String().substring(0, 10),
      fim: hoje.toIso8601String().substring(0, 10),
    );
  }
  factory FiltrosRelatorio.fromJson(Map<String, dynamic> json) =>
      FiltrosRelatorio(
        inicio: json['inicio'] as String,
        fim: json['fim'] as String,
        status: json['status'] as String?,
        tipo: json['tipo'] as String?,
      );
  final String inicio;
  final String fim;
  final String? status;
  final String? tipo;
  Map<String, String> get query => {
    'inicio': inicio,
    'fim': fim,
    'status': ?status,
    'tipo': ?tipo,
  };
  bool mesmosFiltros(FiltrosRelatorio outro) =>
      inicio == outro.inicio &&
      fim == outro.fim &&
      status == outro.status &&
      tipo == outro.tipo;
}

class VolumeDiario {
  const VolumeDiario(this.data, this.quantidade);
  final String data;
  final int quantidade;
}

class ResumoRelatorio {
  ResumoRelatorio.fromJson(Map<String, dynamic> json)
    : filtros = FiltrosRelatorio.fromJson(
        json['filtros'] as Map<String, dynamic>,
      ),
      totalPedidos = (json['totalPedidos'] as num).toInt(),
      valorEstimadoTotal = json['valorEstimadoTotal'] as String,
      ticketMedioEstimado = json['ticketMedioEstimado'] as String,
      porStatus = (json['porStatus'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, (value as num).toInt()),
      ),
      porModalidade = (json['porModalidade'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, (value as num).toInt()),
      ),
      pedidosPorDia = (json['pedidosPorDia'] as List<dynamic>)
          .map(
            (dia) => VolumeDiario(
              dia['data'] as String,
              (dia['quantidade'] as num).toInt(),
            ),
          )
          .toList(),
      geradoEm = DateTime.parse(json['geradoEm'] as String);
  final FiltrosRelatorio filtros;
  final int totalPedidos;
  final String valorEstimadoTotal;
  final String ticketMedioEstimado;
  final Map<String, int> porStatus;
  final Map<String, int> porModalidade;
  final List<VolumeDiario> pedidosPorDia;
  final DateTime geradoEm;
}
