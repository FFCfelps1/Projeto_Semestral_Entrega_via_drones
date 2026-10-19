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

  // Encerramento controlado: o Kubernetes envia SIGTERM antes de remover o
  // pod; o Ctrl+C local envia SIGINT. O Windows nao suporta ouvir SIGTERM.
  var encerrando = false;
  Future<void> encerrar(ProcessSignal sinal) async {
    if (encerrando) return;
    encerrando = true;
    registrar('${Config.nomeServico}: recebido $sinal, encerrando');

    // As sondas passam a falhar e a inscricao deixa de ser renovada.
    servico.encerrando = true;
    barramento.parar();

    // Mesmo prazo da versao Node: apos 10 s o processo sai com erro.
    final prazo = Timer(const Duration(seconds: 10), () => exit(1));
    try {
      await servidor.close(); // aguarda as requisicoes em andamento
      clienteHttp.close();
      prazo.cancel();
      exit(0);
    } catch (erro) {
      registrarErro('Falha ao encerrar: $erro');
      exit(1);
    }
  }

  ProcessSignal.sigint.watch().listen(encerrar);
  if (!Platform.isWindows) ProcessSignal.sigterm.watch().listen(encerrar);
}
