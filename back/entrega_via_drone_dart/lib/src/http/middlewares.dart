/// Middlewares aplicados a todas as requisicoes do servico.
library;

import 'package:shelf/shelf.dart';

import '../log.dart';

/// Caminhos consultados pelo Kubernetes a cada poucos segundos; ficam fora do
/// log para nao esconder as requisicoes reais.
const _caminhosSilenciosos = {'live', 'ready'};

/// Registra metodo, caminho, status e duracao de cada requisicao.
Middleware logRequisicoes() => (Handler proximo) => (Request requisicao) async {
      final inicio = DateTime.now();
      final resposta = await proximo(requisicao);

      if (!_caminhosSilenciosos.contains(requisicao.url.path)) {
        final ms = DateTime.now().difference(inicio).inMilliseconds;
        registrar('${requisicao.method} /${requisicao.url} '
            '${resposta.statusCode} ${ms}ms');
      }
      return resposta;
    };

/// Cabecalhos CORS equivalentes ao `cors()` padrao usado nos servicos Node:
/// libera qualquer origem para que o front web e o app mobile chamem a API.
const _cabecalhosCors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

/// Responde ao preflight (OPTIONS) e acrescenta CORS nas demais respostas.
Middleware cors() => (Handler proximo) => (Request requisicao) async {
      if (requisicao.method == 'OPTIONS') {
        // Repete os cabecalhos pedidos pelo navegador, como faz o pacote cors.
        final pedidos = requisicao.headers['access-control-request-headers'];
        return Response(204, headers: {
          ..._cabecalhosCors,
          if (pedidos != null) 'access-control-allow-headers': pedidos,
        });
      }

      final resposta = await proximo(requisicao);
      return resposta.change(headers: _cabecalhosCors);
    };
