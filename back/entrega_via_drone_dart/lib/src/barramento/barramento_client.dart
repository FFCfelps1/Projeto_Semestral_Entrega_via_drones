/// Comunicacao com o barramento de eventos (back/barramento_eventos).
///
/// O contrato e o mesmo usado pelos servicos Node:
/// - `POST /eventos` com `{ tipo, dados, origem }` publica um evento;
/// - `POST /inscricao` com `{ nome, url }` inscreve o servico, que passa a
///   receber eventos em `POST {url}/eventos/receber`.
library;

import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../log.dart';

/// Cliente do barramento para um servico.
class BarramentoClient {
  /// Intervalo entre renovacoes da inscricao. Como o barramento guarda as
  /// inscricoes em memoria, renovar periodicamente recupera o registro
  /// depois que ele reinicia.
  static const intervaloInscricao = Duration(seconds: 5);

  /// Idade maxima da ultima inscricao para o servico ser considerado pronto.
  static const validadeInscricao = Duration(seconds: 15);

  final http.Client _http;
  final String _barramentoUrl;

  /// Nome do servico, usado na inscricao e como origem dos eventos.
  final String nomeServico;

  /// Endereco pelo qual o barramento alcanca este servico.
  final String servicoUrl;

  /// Fonte do horario atual; substituivel nos testes.
  final DateTime Function() _agora;

  Timer? _proximaInscricao;
  DateTime? _ultimaInscricao;
  bool _inscrito = false;
  bool _parado = false;

  BarramentoClient(
    this._http,
    this._barramentoUrl,
    this.nomeServico,
    this.servicoUrl, {
    DateTime Function()? agora,
  }) : _agora = agora ?? DateTime.now;

  /// Indica se a ultima inscricao deu certo e ainda e recente.
  /// Usado pela sonda /ready do Kubernetes.
  bool get inscricaoValida {
    final ultima = _ultimaInscricao;
    return _inscrito &&
        ultima != null &&
        _agora().difference(ultima) <= validadeInscricao;
  }

  /// Faz a primeira inscricao e agenda as renovacoes.
  Future<void> iniciarInscricao() => _inscrever();

  /// Interrompe as renovacoes (usado no encerramento do servico).
  void parar() {
    _parado = true;
    _proximaInscricao?.cancel();
  }

  Future<void> _inscrever() async {
    if (_parado) return;
    try {
      final resposta = await _http
          .post(
            Uri.parse('$_barramentoUrl/inscricao'),
            headers: {'content-type': 'application/json'},
            body: jsonEncode({'nome': nomeServico, 'url': servicoUrl}),
          )
          .timeout(const Duration(seconds: 2));

      if (resposta.statusCode < 200 || resposta.statusCode >= 300) {
        throw http.ClientException('HTTP ${resposta.statusCode}');
      }
      // Registra apenas a transicao para inscrito, evitando log a cada 5s.
      if (!_inscrito) registrar('$nomeServico: inscrito no barramento');
      _inscrito = true;
      _ultimaInscricao = _agora();
    } catch (erro) {
      _inscrito = false;
      registrarErro('$nomeServico: inscricao indisponivel: $erro');
    } finally {
      if (!_parado) {
        _proximaInscricao = Timer(intervaloInscricao, _inscrever);
      }
    }
  }

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
