import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

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
}

class SkySwiftApi {
  SkySwiftApi({http.Client? client, String? baseUrl})
    : _client = client ?? http.Client(),
      base = Uri.parse(baseUrl ?? _origemPadrao());
  final http.Client _client;
  final Uri base;
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
  }) async {
    final uri = base.resolve(caminho).replace(queryParameters: query);
    final headers = <String, String>{
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
    try {
      final response =
          await (body == null
                  ? _client.get(uri, headers: headers)
                  : _client.post(
                      uri,
                      headers: {...headers, 'Content-Type': 'application/json'},
                      body: jsonEncode(body),
                    ))
              .timeout(const Duration(seconds: 20));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response;
      }
      String mensagem =
          'Não foi possível concluir a solicitação. Tente novamente.';
      try {
        final erro =
            jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        mensagem = (erro['erro'] ?? erro['error'] ?? mensagem).toString();
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

  Map<String, dynamic> objeto(http.Response response) =>
      jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
  Future<Sessao> login(String email, String senha) async {
    final dados = objeto(
      await requisicao(
        '/api/cadastro_usuario/auth/login',
        body: {'email': email.trim().toLowerCase(), 'senha': senha},
      ),
    );
    return Sessao(
      dados['token'] as String,
      Usuario.fromJson(dados['usuario'] as Map<String, dynamic>),
    );
  }

  Future<Usuario> perfil(String token) async => Usuario.fromJson(
    objeto(
          await requisicao('/api/cadastro_usuario/auth/me', token: token),
        )['usuario']
        as Map<String, dynamic>,
  );
  void close() => _client.close();

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
