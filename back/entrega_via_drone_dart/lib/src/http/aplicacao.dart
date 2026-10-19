/// Composicao final do handler HTTP: middlewares + endpoints.
library;

import 'package:shelf/shelf.dart';

import 'middlewares.dart';
import 'rotas.dart';

/// Monta o handler usado pelo servidor e pelos testes de endpoint.
///
/// O log fica por fora para registrar o status final, inclusive das
/// respostas de preflight produzidas pelo CORS.
Handler criarAplicacao(ServicoRota servico) => const Pipeline()
    .addMiddleware(logRequisicoes())
    .addMiddleware(cors())
    .addHandler(servico.handler);
