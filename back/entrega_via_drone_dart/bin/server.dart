/// Ponto de entrada do microsservico de rotas em Dart.
///
/// Le a configuracao do ambiente, liga as dependencias, abre o servidor
/// HTTP e inicia a inscricao no barramento de eventos.
library;

import 'dart:async';
import 'dart:io';

import 'package:entrega_via_drone_dart/src/barramento/barramento_client.dart';
import 'package:entrega_via_drone_dart/src/config.dart';
import 'package:entrega_via_drone_dart/src/http/aplicacao.dart';
import 'package:entrega_via_drone_dart/src/http/rotas.dart';
import 'package:entrega_via_drone_dart/src/log.dart';
import 'package:entrega_via_drone_dart/src/rota/osrm_client.dart';
import 'package:http/http.dart' as http;
import 'package:shelf/shelf_io.dart' as shelf_io;

Future<void> main() async {
  final config = Config.doAmbiente(Platform.environment);

  // Um unico cliente HTTP reaproveita conexoes com o OSRM e o barramento.
  final clienteHttp = http.Client();
  final barramento = BarramentoClient(
    clienteHttp,
    config.barramentoUrl,
    Config.nomeServico,
    config.servicoUrl,
  );
  final servico = ServicoRota(
    OsrmClient(clienteHttp, config.provedoresRota, config.timeoutRoteamento),
    barramento,
  );

  // 0.0.0.0 permite que o Service do Kubernetes alcance o container.
  final servidor = await shelf_io.serve(
    criarAplicacao(servico),
    InternetAddress.anyIPv4,
    config.porta,
  );
  registrar('${Config.nomeServico} (Dart) rodando na porta ${servidor.port}');

  unawaited(barramento.iniciarInscricao());
}
