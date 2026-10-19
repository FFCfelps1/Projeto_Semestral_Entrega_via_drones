/// Comunicacao com o barramento de eventos (back/barramento_eventos).
///
/// O contrato e o mesmo usado pelos servicos Node:
/// - `POST /eventos` com `{ tipo, dados, origem }` publica um evento;
/// - `POST /inscricao` com `{ nome, url }` inscreve o servico, que passa a
///   receber eventos em `POST {url}/eventos/receber`.
library;

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../log.dart';

/// Cliente do barramento para um servico.
class BarramentoClient {
  final http.Client _http;
  final String _barramentoUrl;

  /// Nome do servico, usado como origem dos eventos.
  final String nomeServico;

  BarramentoClient(this._http, this._barramentoUrl, this.nomeServico);

  /// Publica um evento sem interromper quem chamou se o barramento falhar:
  /// o calculo da rota nao depende da entrega do evento.
  Future<void> publicar(String tipo, Map<String, Object?> dados) async {
    try {
      final resposta = await _http
          .post(
            Uri.parse('$_barramentoUrl/eventos'),
            headers: {'content-type': 'application/json'},
            body: jsonEncode({
              'tipo': tipo,
              'dados': dados,
              'origem': nomeServico,
            }),
          )
          .timeout(const Duration(seconds: 5));

      if (resposta.statusCode >= 400) {
        throw http.ClientException('HTTP ${resposta.statusCode}');
      }
      registrar('Evento publicado: $tipo');
    } catch (erro) {
      registrarErro('Falha ao publicar evento: $erro');
    }
  }
}
