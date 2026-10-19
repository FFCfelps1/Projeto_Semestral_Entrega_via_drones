/// Atalhos para respostas HTTP em JSON.
library;

import 'dart:convert';

import 'package:shelf/shelf.dart';

const _cabecalhoJson = {'content-type': 'application/json; charset=utf-8'};

/// Responde com [corpo] serializado em JSON e o [status] informado.
Response respostaJson(Object? corpo, {int status = 200}) =>
    Response(status, body: jsonEncode(corpo), headers: _cabecalhoJson);
