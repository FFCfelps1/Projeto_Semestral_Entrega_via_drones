/// Modelos dos serviços de notificações, rotas, contato e barramento.
library;

DateTime? _data(Object? valor) =>
    valor is String && valor.isNotEmpty ? DateTime.tryParse(valor) : null;

class Notificacao {
  const Notificacao({
    required this.id,
    required this.titulo,
    required this.mensagem,
    required this.lida,
    this.pedidoId,
    this.eventoTipo,
    this.criadoEm,
    this.lidaEm,
  });
  factory Notificacao.fromJson(Map<String, dynamic> json) => Notificacao(
    id: (json['id'] as num).toInt(),
    titulo: json['titulo'] as String,
    mensagem: json['mensagem'] as String,
    lida: json['lida'] == true,
    pedidoId: json['pedidoId'] as String?,
    eventoTipo: json['eventoTipo'] as String?,
    criadoEm: _data(json['criadoEm']),
    lidaEm: _data(json['lidaEm']),
  );
  final int id;
  final String titulo;
  final String mensagem;
  final bool lida;
  final String? pedidoId;
  final String? eventoTipo;
  final DateTime? criadoEm;
  final DateTime? lidaEm;
}

class Coordenada {
  const Coordenada(this.lat, this.lng);
  final double lat;
  final double lng;
}

class LocalEncontrado {
  const LocalEncontrado(this.nome, this.coordenada);
  final String nome;
  final Coordenada coordenada;
}

class ResultadoRota {
  const ResultadoRota({
    required this.pontos,
    required this.distanciaMetros,
    required this.duracaoSegundos,
    required this.aproximada,
    this.aviso,
  });
  factory ResultadoRota.fromJson(Map<String, dynamic> json) => ResultadoRota(
    pontos: ((json['rota'] as List<dynamic>?) ?? const []).map((p) {
      final par = p as List<dynamic>;
      return Coordenada((par[0] as num).toDouble(), (par[1] as num).toDouble());
    }).toList(),
    distanciaMetros: (json['distancia'] as num).toDouble(),
    duracaoSegundos: (json['duracao'] as num).toDouble(),
    aproximada: json['fallback'] == true,
    aviso: json['aviso'] as String?,
  );
  final List<Coordenada> pontos;
  final double distanciaMetros;
  final double duracaoSegundos;
  final bool aproximada;
  final String? aviso;
}

class LinkContato {
  const LinkContato(this.destinatario, this.link);
  final String destinatario;
  final String link;
}

class MensagemContato {
  const MensagemContato({
    required this.nome,
    required this.email,
    required this.mensagem,
    this.empresa = '',
    this.telefone = '',
  });
  final String nome;
  final String email;
  final String mensagem;
  final String empresa;
  final String telefone;
  Map<String, Object?> toJson() => {
    'nome': nome.trim(),
    'email': email.trim(),
    'mensagem': mensagem.trim(),
    if (empresa.trim().isNotEmpty) 'empresa': empresa.trim(),
    if (telefone.trim().isNotEmpty) 'telefone': telefone.trim(),
  };
}

/// Serviços expostos pelo proxy Nginx em `/api/<nome>/`.
const servicosBackend = <String, String>{
  'cadastro_usuario': 'Cadastro e autenticação',
  'gestao_de_pedidos': 'Gestão de pedidos',
  'entrega_via_drone': 'Rotas de entrega (Dart)',
  'notificacoes': 'Notificações',
  'contato_email': 'Contato por e-mail',
  'barramento_eventos': 'Barramento de eventos',
};

class SaudeServico {
  const SaudeServico(this.servico, this.disponivel, {this.detalhe});
  final String servico;
  final bool disponivel;
  final String? detalhe;
  String get nome => servicosBackend[servico] ?? servico;
}

class EventoBarramento {
  const EventoBarramento({
    required this.tipo,
    this.origem,
    this.momento,
    this.id,
  });
  factory EventoBarramento.fromJson(Map<String, dynamic> json) =>
      EventoBarramento(
        tipo: '${json['tipo']}',
        origem: json['origem']?.toString(),
        momento: _data(
          json['timestamp'] ?? json['momento'] ?? json['criadoEm'],
        ),
        id: json['id']?.toString(),
      );
  final String tipo;
  final String? origem;
  final DateTime? momento;
  final String? id;
}

class Inscricao {
  const Inscricao(this.servico, this.url);
  factory Inscricao.fromJson(Map<String, dynamic> json) =>
      Inscricao('${json['nome'] ?? 'serviço'}', '${json['url'] ?? ''}');
  final String servico;
  final String url;
}
