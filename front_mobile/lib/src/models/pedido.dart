import 'relatorio.dart';

export 'relatorio.dart' show nomesStatus, nomesModalidades;

/// Etapas na ordem aceita pelo serviço de pedidos; `cancelado` fica fora.
const ordemStatus = [
  'rascunho',
  'confirmado',
  'em_processamento',
  'em_rota',
  'entregue',
];

/// Mesmas regras do backend, usadas apenas para pré-visualizar valores.
const multiplicadoresModalidade = <String, double>{
  'padrao': 1,
  'expressa': 1.35,
  'prioritaria': 1.65,
};
const minutosModalidade = <String, int>{
  'padrao': 45,
  'expressa': 30,
  'prioritaria': 20,
};

double precoEstimado(double peso, String tipo) =>
    (10 + peso * 5) * (multiplicadoresModalidade[tipo] ?? 1);

class EtapaHistorico {
  const EtapaHistorico(this.status, this.momento);
  factory EtapaHistorico.fromJson(Map<String, dynamic> json) =>
      EtapaHistorico(json['status'] as String, _data(json['momento'])!);
  final String status;
  final DateTime momento;
}

DateTime? _data(Object? valor) =>
    valor is String && valor.isNotEmpty ? DateTime.tryParse(valor) : null;

class Pedido {
  const Pedido({
    required this.id,
    required this.item,
    required this.peso,
    required this.origem,
    required this.destino,
    required this.tipo,
    required this.status,
    required this.precoEstimado,
    required this.tempoEstimado,
    this.observacoes = '',
    this.usuarioId,
    this.historico = const [],
    this.criadoEm,
    this.atualizadoEm,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) => Pedido(
    id: json['id'] as String,
    item: json['item'] as String,
    peso: (json['peso'] as num).toDouble(),
    origem: json['origem'] as String,
    destino: json['destino'] as String,
    tipo: json['tipo'] as String,
    status: json['status'] as String,
    precoEstimado: double.parse('${json['precoEstimado']}'),
    tempoEstimado: (json['tempoEstimado'] as num).toInt(),
    observacoes: (json['observacoes'] ?? '') as String,
    usuarioId: (json['usuarioId'] as num?)?.toInt(),
    historico: ((json['statusHistorico'] as List<dynamic>?) ?? const [])
        .map((e) => EtapaHistorico.fromJson(e as Map<String, dynamic>))
        .toList(),
    criadoEm: _data(json['criadoEm']),
    atualizadoEm: _data(json['atualizadoEm']),
  );

  final String id;
  final String item;
  final double peso;
  final String origem;
  final String destino;
  final String tipo;
  final String status;
  final double precoEstimado;
  final int tempoEstimado;
  final String observacoes;
  final int? usuarioId;
  final List<EtapaHistorico> historico;
  final DateTime? criadoEm;
  final DateTime? atualizadoEm;

  String get codigo => id.length > 8 ? id.substring(0, 8).toUpperCase() : id;
  String get nomeStatus => nomesStatus[status] ?? status;
  String get nomeModalidade => nomesModalidades[tipo] ?? tipo;
  bool get podeConfirmar => status == 'rascunho';
  bool get podeCancelar =>
      const ['rascunho', 'confirmado', 'em_processamento'].contains(status);

  /// O despacho calcula a rota e o barramento move o pedido para `em_rota`.
  bool get podeDespachar =>
      status == 'confirmado' || status == 'em_processamento';
  bool get podeIniciarProcessamento => status == 'confirmado';
  bool get podeConcluirEntrega => status == 'em_rota';
  bool get finalizado => status == 'entregue' || status == 'cancelado';
}

class NovoPedido {
  const NovoPedido({
    required this.item,
    required this.peso,
    required this.origem,
    required this.destino,
    required this.tipo,
    this.observacoes = '',
  });
  final String item;
  final double peso;
  final String origem;
  final String destino;
  final String tipo;
  final String observacoes;

  Map<String, Object?> toJson(int usuarioId) => {
    'item': item.trim(),
    'peso': peso,
    'origem': origem.trim(),
    'destino': destino.trim(),
    'tipo': tipo,
    'observacoes': observacoes.trim(),
    'usuarioId': usuarioId,
  };
}
