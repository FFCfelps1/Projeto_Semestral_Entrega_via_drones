import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/operacao.dart';
import '../models/pedido.dart';
import '../models/relatorio.dart';

class ApiException implements Exception {
  const ApiException(this.mensagem, [this.status]);
  final String mensagem;
  final int? status;
  @override
  String toString() => mensagem;
}

class ArquivoRelatorio {
  const ArquivoRelatorio(this.bytes, this.nome);
  final Uint8List bytes;
  final String nome;
}

class Usuario {
  const Usuario({required this.id, required this.nome, required this.email});
  factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(
    id: (json['id'] as num).toInt(),
    nome: json['nome'] as String,
    email: json['email'] as String,
  );
  final int id;
  final String nome;
  final String email;
}

class Sessao {
  const Sessao(this.token, this.usuario);
  final String token;
  final Usuario usuario;
  DateTime get expiracao {
    final partes = token.split('.');
    final claims = jsonDecode(
      utf8.decode(base64Url.decode(base64Url.normalize(partes[1]))),
    ) as Map<String, dynamic>;
    return DateTime.fromMillisecondsSinceEpoch(
      (claims['exp'] as num).toInt() * 1000,
      isUtc: true,
    );
  }

  Sessao comUsuario(Usuario novo) => Sessao(token, novo);
}

/// Cliente HTTP único para todos os microsserviços, sempre pelo proxy `/api`.
class SkySwiftApi {
  SkySwiftApi({http.Client? client, String? baseUrl, Uri? geocodificador})
    : _client = client ?? http.Client(),
      base = Uri.parse(baseUrl ?? _origemPadrao()),
      geocodificador =
          geocodificador ??
          Uri.parse('https://nominatim.openstreetmap.org/search');
  final http.Client _client;
  final Uri base;

  /// Serviço público já usado pelo site React para converter endereços.
  final Uri geocodificador;
  static String _origemPadrao() {
    const configurada = String.fromEnvironment('API_BASE_URL');
    return configurada.isNotEmpty
        ? configurada
        : (kIsWeb ? Uri.base.origin : 'http://localhost:8080');
  }

  Future<http.Response> requisicao(
    String caminho, {
    String? token,
    Map<String, String>? query,
    Map<String, Object?>? body,
    String? metodo,
    Duration tempoLimite = const Duration(seconds: 20),
    Uri? uriCompleta,
  }) async {
    final uri =
        uriCompleta ??
        (query == null || query.isEmpty
            ? base.resolve(caminho)
            : base.resolve(caminho).replace(queryParameters: query));
    final verbo = metodo ?? (body == null ? 'GET' : 'POST');
    final headers = <String, String>{
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      if (body != null) 'Content-Type': 'application/json',
    };
    try {
      final request = http.Request(verbo, uri)..headers.addAll(headers);
      if (body != null) request.body = jsonEncode(body);
      final response = await _client
          .send(request)
          .then(http.Response.fromStream)
          .timeout(tempoLimite);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response;
      }
      String mensagem =
          'Não foi possível concluir a solicitação. Tente novamente.';
      try {
        final erro = jsonDecode(utf8.decode(response.bodyBytes));
        if (erro is Map<String, dynamic>) {
          mensagem = (erro['erro'] ?? erro['error'] ?? mensagem).toString();
        }
      } on FormatException {
        /* Erros do proxy também podem não conter JSON. */
      }
      throw ApiException(mensagem, response.statusCode);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(
        'Não foi possível comunicar com o servidor. Verifique a conexão e tente novamente.',
      );
    }
  }

  Object? _json(http.Response response) =>
      jsonDecode(utf8.decode(response.bodyBytes));
  Map<String, dynamic> objeto(http.Response response) =>
      _json(response) as Map<String, dynamic>;
  List<dynamic> lista(http.Response response) =>
      _json(response) as List<dynamic>;
  void close() => _client.close();

  // ---------------------------------------------------------------- Conta
  static const _auth = '/api/cadastro_usuario/auth';

  Sessao _sessao(Map<String, dynamic> dados) => Sessao(
    dados['token'] as String,
    Usuario.fromJson(dados['usuario'] as Map<String, dynamic>),
  );

  Future<Sessao> login(String email, String senha) async => _sessao(
    objeto(
      await requisicao(
        '$_auth/login',
        body: {'email': email.trim().toLowerCase(), 'senha': senha},
      ),
    ),
  );

  Future<Sessao> cadastrar(String nome, String email, String senha) async =>
      _sessao(
        objeto(
          await requisicao(
            '$_auth/cadastro',
            body: {
              'nome': nome.trim(),
              'email': email.trim().toLowerCase(),
              'senha': senha,
            },
          ),
        ),
      );

  Future<Usuario> perfil(String token) async => Usuario.fromJson(
    objeto(await requisicao('$_auth/me', token: token))['usuario']
        as Map<String, dynamic>,
  );

  Future<Usuario> atualizarPerfil(
    String token, {
    String? nome,
    String? email,
  }) async => Usuario.fromJson(
    objeto(
          await requisicao(
            '$_auth/me',
            token: token,
            metodo: 'PATCH',
            body: {
              if (nome != null) 'nome': nome.trim(),
              if (email != null) 'email': email.trim().toLowerCase(),
            },
          ),
        )['usuario']
        as Map<String, dynamic>,
  );

  Future<void> alterarSenha(
    String token,
    String senhaAtual,
    String novaSenha,
  ) async {
    await requisicao(
      '$_auth/me/senha',
      token: token,
      metodo: 'PATCH',
      body: {'senhaAtual': senhaAtual, 'novaSenha': novaSenha},
    );
  }

  Future<void> excluirConta(String token) async {
    await requisicao('$_auth/me', token: token, metodo: 'DELETE');
  }

  // -------------------------------------------------------------- Pedidos
  static const _pedidos = '/api/gestao_de_pedidos/pedidos';
  String _pedido(String id) => '$_pedidos/${Uri.encodeComponent(id)}';

  Future<List<Pedido>> pedidos({int? usuarioId, String? status}) async => lista(
    await requisicao(
      _pedidos,
      query: {
        if (usuarioId != null) 'usuarioId': '$usuarioId',
        if (status != null) 'status': status,
      },
    ),
  ).map((p) => Pedido.fromJson(p as Map<String, dynamic>)).toList();

  Future<Pedido> pedido(String id) async =>
      Pedido.fromJson(objeto(await requisicao(_pedido(id))));

  Future<Pedido> criarPedido(NovoPedido novo, int usuarioId) async =>
      Pedido.fromJson(
        objeto(await requisicao(_pedidos, body: novo.toJson(usuarioId))),
      );

  Future<Pedido> confirmarPedido(String id) async => Pedido.fromJson(
    objeto(await requisicao('${_pedido(id)}/confirmar', metodo: 'POST')),
  );

  Future<Pedido> atualizarStatus(String id, String status) async =>
      Pedido.fromJson(
        objeto(
          await requisicao(
            _pedido(id),
            metodo: 'PATCH',
            body: {'status': status},
          ),
        ),
      );

  Future<Pedido> cancelarPedido(String id) async => Pedido.fromJson(
    objeto(await requisicao(_pedido(id), metodo: 'DELETE'))['pedido']
        as Map<String, dynamic>,
  );

  Future<List<EtapaHistorico>> historico(String id) async {
    final dados = objeto(await requisicao('${_pedido(id)}/historico'));
    return ((dados['historico'] as List<dynamic>?) ?? const [])
        .map((e) => EtapaHistorico.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // --------------------------------------------------------------- Rotas
  Future<LocalEncontrado?> geocodificar(String endereco) async {
    final resultados = lista(
      await requisicao(
        '',
        uriCompleta: geocodificador.replace(
          queryParameters: {
            'format': 'json',
            'q': endereco.trim(),
            'limit': '1',
            'countrycodes': 'br',
            'accept-language': 'pt-BR',
          },
        ),
      ),
    );
    if (resultados.isEmpty) return null;
    final local = resultados.first as Map<String, dynamic>;
    return LocalEncontrado(
      '${local['display_name'] ?? endereco}',
      Coordenada(
        double.parse('${local['lat']}'),
        double.parse('${local['lon']}'),
      ),
    );
  }

  Future<ResultadoRota> rota(
    Coordenada origem,
    Coordenada destino, {
    String? pedidoId,
  }) async => ResultadoRota.fromJson(
    objeto(
      await requisicao(
        '/api/entrega_via_drone/rota',
        query: {
          'origemLat': '${origem.lat}',
          'origemLng': '${origem.lng}',
          'destinoLat': '${destino.lat}',
          'destinoLng': '${destino.lng}',
          if (pedidoId != null) 'pedidoId': pedidoId,
        },
        tempoLimite: const Duration(seconds: 60),
      ),
    ),
  );

  // -------------------------------------------------------- Notificações
  static const _notificacoes = '/api/notificacoes/notificacoes';

  Future<List<Notificacao>> notificacoes() async =>
      lista(await requisicao(_notificacoes))
          .map((n) => Notificacao.fromJson(n as Map<String, dynamic>))
          .toList();

  Future<int> notificacoesNaoLidas() async {
    final dados = objeto(await requisicao('$_notificacoes/nao-lidas/contagem'));
    return (dados['total'] as num).toInt();
  }

  Future<Notificacao> marcarNotificacaoLida(int id) async =>
      Notificacao.fromJson(
        objeto(await requisicao('$_notificacoes/$id/ler', metodo: 'PATCH')),
      );

  Future<int> marcarTodasNotificacoesLidas() async {
    final dados = objeto(
      await requisicao('$_notificacoes/ler-todas', metodo: 'PATCH'),
    );
    return ((dados['atualizadas'] as num?) ?? 0).toInt();
  }

  // -------------------------------------------------------------- Contato
  Future<LinkContato> linkContato() async {
    final dados = objeto(await requisicao('/api/contato_email/email/contato'));
    return LinkContato(dados['recipient'] as String, dados['link'] as String);
  }

  Future<String> enviarContato(MensagemContato mensagem) async {
    final dados = objeto(
      await requisicao(
        '/api/contato_email/email/enviar',
        body: mensagem.toJson(),
      ),
    );
    return (dados['message'] ?? 'Mensagem enviada com sucesso.').toString();
  }

  // -------------------------------------------------- Estado do sistema
  Future<SaudeServico> saude(String servico) async {
    try {
      final dados = objeto(
        await requisicao(
          '/api/$servico/health',
          tempoLimite: const Duration(seconds: 8),
        ),
      );
      return SaudeServico(
        servico,
        true,
        detalhe: (dados['message'] ?? dados['status'])?.toString(),
      );
    } on ApiException catch (erro) {
      return SaudeServico(servico, false, detalhe: erro.mensagem);
    } on Object {
      return SaudeServico(servico, false, detalhe: 'Resposta inválida.');
    }
  }

  Future<List<EventoBarramento>> eventosRecentes({int limite = 20}) async {
    final dados = objeto(
      await requisicao(
        '/api/barramento_eventos/eventos',
        query: {'limite': '$limite'},
      ),
    );
    return ((dados['eventos'] as List<dynamic>?) ?? const [])
        .map((e) => EventoBarramento.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Inscricao>> inscricoes() async {
    final dados = objeto(
      await requisicao('/api/barramento_eventos/inscricoes'),
    );
    return ((dados['inscricoes'] as List<dynamic>?) ?? const [])
        .map((e) => Inscricao.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ----------------------------------------------------------- Relatórios
  Future<ArquivoRelatorio> exportar(
    String token,
    FiltrosRelatorio filtros,
  ) async {
    final response = await requisicao(
      '/api/gestao_de_pedidos/relatorios/exportar',
      token: token,
      query: filtros.query,
    );
    if (!(response.headers['content-type'] ?? '').startsWith('text/csv')) {
      throw const ApiException(
        'O servidor não retornou um arquivo CSV válido.',
      );
    }
    final nome =
        RegExp(r'filename="([a-zA-Z0-9_.-]+)"')
            .firstMatch(response.headers['content-disposition'] ?? '')
            ?.group(1) ??
        'skyswift-pedidos-${filtros.inicio}-${filtros.fim}.csv';
    return ArquivoRelatorio(response.bodyBytes, nome);
  }

  Future<ResumoRelatorio> resumo(
    String token,
    FiltrosRelatorio filtros,
  ) async => ResumoRelatorio.fromJson(
    objeto(
      await requisicao(
        '/api/gestao_de_pedidos/relatorios/resumo',
        token: token,
        query: filtros.query,
      ),
    ),
  );
}
