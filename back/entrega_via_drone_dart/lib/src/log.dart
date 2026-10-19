/// Log simples com horario em ISO 8601, no mesmo formato dos servicos Node.
///
/// Escreve em stdout/stderr para que `kubectl logs` e `docker logs`
/// mostrem as mensagens sem configuracao adicional.
library;

import 'dart:io';

String _agora() => DateTime.now().toUtc().toIso8601String();

/// Registra uma mensagem informativa.
void registrar(String mensagem) => stdout.writeln('[${_agora()}] $mensagem');

/// Registra uma falha ou aviso.
void registrarErro(String mensagem) =>
    stderr.writeln('[${_agora()}] $mensagem');
