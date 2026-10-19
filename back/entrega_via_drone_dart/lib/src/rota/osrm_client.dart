/// Cliente dos provedores de roteamento OSRM.
library;

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../log.dart';
import 'resultado_rota.dart';

/// Consulta os provedores OSRM em ordem ate um deles devolver uma rota.
class OsrmClient {
  final http.Client _http;
  final List<String> _provedores;
  final Duration _timeout;

  OsrmClient(this._http, this._provedores, this._timeout);

  /// Calcula a rota entre origem e destino.
  ///
  /// Retorna `null` quando todos os provedores falham, para que quem chama
  /// decida usar a rota alternativa.
  Future<ResultadoRota?> calcular(
    double origemLat,
    double origemLng,
    double destinoLat,
    double destinoLng,
  ) async {
    for (final provedor in _provedores) {
      // O OSRM recebe as coordenadas na ordem longitude,latitude.
      final url = Uri.parse(
        '$provedor/$origemLng,$origemLat;$destinoLng,$destinoLat'
        '?overview=full&geometries=geojson',
      );

      try {
        registrar('Chamando provedor de rota: $url');
        final resposta = await _http.get(url).timeout(_timeout);

        if (resposta.statusCode < 200 || resposta.statusCode >= 300) {
          throw http.ClientException('HTTP ${resposta.statusCode}', url);
        }

        final resultado = _interpretar(resposta.body, provedor);
        if (resultado != null) {
          registrar(
            'Rota calculada com sucesso. Pontos: ${resultado.rota.length}, '
            'Distancia: ${resultado.distancia}m, Duracao: ${resultado.duracao}s',
          );
          return resultado;
        }
      } catch (erro) {
        // Falha de rede, timeout ou JSON inesperado: tenta o proximo provedor.
        registrarErro('Falha no provedor: $provedor $erro');
      }
    }

    return null;
  }

  /// Converte o JSON do OSRM em [ResultadoRota]; `null` se nao houver rota.
  ResultadoRota? _interpretar(String corpo, String provedor) {
    final dados = jsonDecode(corpo) as Map<String, dynamic>;
    final rotas = dados['routes'] as List<dynamic>?;
    if (rotas == null || rotas.isEmpty) return null;

    final primeira = rotas.first as Map<String, dynamic>;
    final geometria = primeira['geometry'] as Map<String, dynamic>;
    final coordenadas = geometria['coordinates'] as List<dynamic>;

    return ResultadoRota(
      // O GeoJSON usa [lng, lat]; o front espera [lat, lng].
      rota: [
        for (final ponto in coordenadas.cast<List<dynamic>>())
          [(ponto[1] as num).toDouble(), (ponto[0] as num).toDouble()],
      ],
      distancia: (primeira['distance'] as num).toDouble(),
      duracao: (primeira['duration'] as num).toDouble(),
      fallback: false,
      provedor: provedor,
    );
  }
}
