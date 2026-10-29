import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:front_mobile/src/services/skyswift_api.dart';

/// Backend em memória com os mesmos contratos dos microsserviços via Nginx.
class BackendFalso {
  BackendFalso({this.smtpConfigurado = true, this.rotaMoveStatus = true});
  bool smtpConfigurado;

  /// Simula o barramento entregando `RotaCalculada` ao serviço de pedidos.
  bool rotaMoveStatus;
  final chamadas = <String>[];
  final corpos = <String, Object?>{};
  Map<String, Object?> usuario = {
    'id': 7,
    'nome': 'Ana Souza',
    'email': 'ana@exemplo.com',
  };
  String senha = 'segredo1';
  final pedidos = <Map<String, Object?>>[];
  final notificacoes = <Map<String, Object?>>[];
  final eventos = <Map<String, Object?>>[];
  final servicosForaDoAr = <String>{};
  var _sequencia = 0;

  static String tokenValido() {
    final exp =
        DateTime.now().add(const Duration(hours: 2)).millisecondsSinceEpoch ~/
        1000;
    final claims = base64Url.encode(utf8.encode(jsonEncode({'exp': exp})));
    return 'cabecalho.$claims.assinatura';
  }

  final token = tokenValido();

  SkySwiftApi api() => SkySwiftApi(
    client: MockClient(_responder),
    baseUrl: 'http://skyswift.test',
    geocodificador: Uri.parse('http://geo.test/search'),
  );

  Map<String, Object?> adicionarPedido({
    String item = 'Medicamentos',
    String status = 'rascunho',
    String tipo = 'padrao',
    double peso = 2,
    String origem = 'Rua A, 10, São Paulo',
    String destino = 'Rua B, 20, São Paulo',
  }) {
    _sequencia++;
    final agora = DateTime.utc(2026, 10, 28, 12, _sequencia).toIso8601String();
    final pedido = <String, Object?>{
      'id': '0000000$_sequencia-aaaa-4bbb-8ccc-dddddddddddd',
      'item': item,
      'peso': peso,
      'origem': origem,
      'destino': destino,
      'tipo': tipo,
      'observacoes': '',
      'usuarioId': usuario['id'],
      'status': status,
      'precoEstimado': ((10 + peso * 5) * 1).toStringAsFixed(2),
      'tempoEstimado': 45,
      'statusHistorico': [
        {'status': 'rascunho', 'momento': agora},
        if (status != 'rascunho') {'status': status, 'momento': agora},
      ],
      'criadoEm': agora,
      'atualizadoEm': agora,
    };
    pedidos.insert(0, pedido);
    return pedido;
  }

  http.Response _json(Object? dados, [int status = 200]) => http.Response(
    jsonEncode(dados),
    status,
    headers: {'content-type': 'application/json; charset=utf-8'},
  );

  http.Response _erro(int status, String mensagem, {String campo = 'erro'}) =>
      _json({campo: mensagem}, status);

  bool _autenticado(http.Request request) =>
      request.headers['authorization'] == 'Bearer $token';

  void _mudarStatus(Map<String, Object?> pedido, String status) {
    pedido['status'] = status;
    (pedido['statusHistorico'] as List).add({
      'status': status,
      'momento': DateTime.utc(2026, 10, 28, 15).toIso8601String(),
    });
  }

  Future<http.Response> _responder(http.Request request) async {
    final caminho = request.url.path;
    chamadas.add('${request.method} $caminho');
    final corpo = request.body.isEmpty ? null : jsonDecode(request.body);
    corpos['${request.method} $caminho'] = corpo;

    if (request.url.host == 'geo.test') {
      final q = request.url.queryParameters['q'] ?? '';
      if (q.contains('inexistente')) return _json([]);
      return _json([
        {
          'display_name': '$q, Brasil',
          'lat': q.contains('B') ? '-23.56' : '-23.55',
          'lon': q.contains('B') ? '-46.65' : '-46.63',
        },
      ]);
    }

    final servico = caminho.split('/').length > 2 ? caminho.split('/')[2] : '';
    if (caminho.endsWith('/health')) {
      return servicosForaDoAr.contains(servico)
          ? _erro(503, 'Servico temporariamente indisponivel. Tente novamente.')
          : _json({'status': 'OK', 'message': '$servico rodando'});
    }

    // ------------------------------------------------- cadastro_usuario
    const auth = '/api/cadastro_usuario/auth';
    if (caminho == '$auth/login') {
      final dados = corpo as Map<String, dynamic>;
      if (dados['email'] != usuario['email'] || dados['senha'] != senha) {
        return _erro(401, 'Email ou senha invalidos.', campo: 'error');
      }
      return _json({'token': token, 'usuario': usuario});
    }
    if (caminho == '$auth/cadastro') {
      final dados = corpo as Map<String, dynamic>;
      if (dados['email'] == 'existente@exemplo.com') {
        return _erro(409, 'Este email ja esta cadastrado.', campo: 'error');
      }
      usuario = {'id': 8, 'nome': dados['nome'], 'email': dados['email']};
      senha = dados['senha'] as String;
      return _json({'token': token, 'usuario': usuario}, 201);
    }
    if (caminho.startsWith(auth)) {
      if (!_autenticado(request)) {
        return _erro(401, 'Token de autenticacao invalido ou expirado.');
      }
      if (caminho == '$auth/me' && request.method == 'GET') {
        return _json({'usuario': usuario});
      }
      if (caminho == '$auth/me' && request.method == 'PATCH') {
        final dados = corpo as Map<String, dynamic>;
        usuario = {...usuario, ...dados};
        return _json({'message': 'Perfil atualizado.', 'usuario': usuario});
      }
      if (caminho == '$auth/me/senha') {
        final dados = corpo as Map<String, dynamic>;
        if (dados['senhaAtual'] != senha) {
          return _erro(401, 'Senha atual invalida.', campo: 'error');
        }
        senha = dados['novaSenha'] as String;
        return _json({'message': 'Senha atualizada com sucesso.'});
      }
      if (caminho == '$auth/me' && request.method == 'DELETE') {
        return _json({'message': 'Conta excluida com sucesso.'});
      }
    }

    // ------------------------------------------------ gestao_de_pedidos
    const base = '/api/gestao_de_pedidos/pedidos';
    if (caminho == base && request.method == 'GET') {
      final usuarioId = request.url.queryParameters['usuarioId'];
      final status = request.url.queryParameters['status'];
      return _json(
        pedidos
            .where((p) => usuarioId == null || '${p['usuarioId']}' == usuarioId)
            .where((p) => status == null || p['status'] == status)
            .toList(),
      );
    }
    if (caminho == base && request.method == 'POST') {
      final dados = corpo as Map<String, dynamic>;
      final pedido = adicionarPedido(
        item: dados['item'] as String,
        tipo: dados['tipo'] as String,
        peso: (dados['peso'] as num).toDouble(),
        origem: dados['origem'] as String,
        destino: dados['destino'] as String,
      );
      notificacoes.insert(0, {
        'id': notificacoes.length + 1,
        'titulo': 'Pedido criado',
        'mensagem': 'Pedido ${pedido['id']} criado com sucesso.',
        'pedidoId': pedido['id'],
        'eventoTipo': 'PEDIDO_CRIADO',
        'lida': false,
        'criadoEm': '2026-10-28T12:00:00.000Z',
        'lidaEm': null,
      });
      return _json(pedido, 201);
    }
    if (caminho.startsWith('$base/')) {
      final partes = caminho.substring(base.length + 1).split('/');
      final pedido = pedidos.where((p) => p['id'] == partes[0]).firstOrNull;
      if (pedido == null) return _erro(404, 'Pedido não encontrado');
      if (partes.length == 1 && request.method == 'GET') return _json(pedido);
      if (partes.length == 2 && partes[1] == 'historico') {
        return _json({
          'pedidoId': pedido['id'],
          'item': pedido['item'],
          'statusAtual': pedido['status'],
          'historico': pedido['statusHistorico'],
        });
      }
      if (partes.length == 2 && partes[1] == 'confirmar') {
        if (pedido['status'] != 'rascunho') {
          return _erro(400, 'Apenas pedidos em rascunho podem ser confirmados');
        }
        _mudarStatus(pedido, 'confirmado');
        return _json(pedido);
      }
      if (request.method == 'PATCH') {
        _mudarStatus(
          pedido,
          (corpo as Map<String, dynamic>)['status'] as String,
        );
        return _json(pedido);
      }
      if (request.method == 'DELETE') {
        if (['em_rota', 'entregue'].contains(pedido['status'])) {
          return _erro(
            400,
            'Não é possível cancelar um pedido que já está em rota ou entregue',
          );
        }
        _mudarStatus(pedido, 'cancelado');
        return _json({
          'mensagem': 'Pedido cancelado com sucesso',
          'pedido': pedido,
        });
      }
    }

    // ------------------------------------------------ entrega_via_drone
    if (caminho == '/api/entrega_via_drone/rota') {
      final q = request.url.queryParameters;
      final pedidoId = q['pedidoId'];
      if (pedidoId != null && rotaMoveStatus) {
        final pedido = pedidos.where((p) => p['id'] == pedidoId).firstOrNull;
        if (pedido != null &&
            ['confirmado', 'em_processamento'].contains(pedido['status'])) {
          _mudarStatus(pedido, 'em_rota');
        }
      }
      final o = [double.parse(q['origemLat']!), double.parse(q['origemLng']!)];
      final d = [
        double.parse(q['destinoLat']!),
        double.parse(q['destinoLng']!),
      ];
      return _json({
        'rota': [
          o,
          [(o[0] + d[0]) / 2, o[1]],
          d,
        ],
        'distancia': 2450.5,
        'duracao': 420.0,
        'success': true,
        'fallback': false,
      });
    }

    // ----------------------------------------------------- notificacoes
    const n = '/api/notificacoes/notificacoes';
    if (caminho == n) return _json(notificacoes);
    if (caminho == '$n/nao-lidas/contagem') {
      return _json({
        'total': notificacoes.where((x) => x['lida'] != true).length,
      });
    }
    if (caminho == '$n/ler-todas') {
      var total = 0;
      for (final x in notificacoes.where((x) => x['lida'] != true)) {
        x['lida'] = true;
        x['lidaEm'] = '2026-10-28T13:00:00.000Z';
        total++;
      }
      return _json({'mensagem': 'ok', 'atualizadas': total});
    }
    final lida = RegExp(r'^/api/notificacoes/notificacoes/(\d+)/ler$')
        .firstMatch(caminho);
    if (lida != null) {
      final x = notificacoes
          .where((x) => '${x['id']}' == lida.group(1))
          .firstOrNull;
      if (x == null) return _erro(404, 'Notificacao nao encontrada.');
      x['lida'] = true;
      x['lidaEm'] = '2026-10-28T13:00:00.000Z';
      return _json(x);
    }

    // ---------------------------------------------------- contato_email
    if (caminho == '/api/contato_email/email/contato') {
      return _json({
        'success': true,
        'recipient': 'entrega.drones@gmail.com',
        'link': 'mailto:entrega.drones@gmail.com?subject=Contato',
      });
    }
    if (caminho == '/api/contato_email/email/enviar') {
      if (!smtpConfigurado) {
        return _json({
          'success': false,
          'error': 'Serviço de envio não configurado no servidor.',
        }, 503);
      }
      return _json({
        'success': true,
        'message': 'Mensagem enviada com sucesso.',
      });
    }

    // ----------------------------------------------- barramento_eventos
    if (caminho == '/api/barramento_eventos/eventos') {
      return _json({
        'success': true,
        'total': eventos.length,
        'eventos': eventos,
      });
    }
    if (caminho == '/api/barramento_eventos/inscricoes') {
      return _json({
        'success': true,
        'total': 2,
        'inscricoes': [
          {'nome': 'gestao_de_pedidos', 'url': 'http://gestao-de-pedidos:3005'},
          {'nome': 'notificacoes', 'url': 'http://notificacoes:3006'},
        ],
      });
    }
    return _erro(404, 'Rota nao encontrada');
  }
}
