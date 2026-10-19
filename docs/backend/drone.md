---
Integrantes:
- Arthur Gama Ruiz (RA: 23.01445-8)
- Enzo Oliveira D’Onofrio (RA: 23.01561-6)
- Felipe Fazio da Costa (RA: 23.00055-4)
- João Vitor Morimoto Sesma (RA: 23.01516-0)
- Leonardo Souza Olivieri (RA: 23.01512-8)
- Pedro Wilian Palumbo Bevilacqua (RA: 23.01307-9)

Data: 04/06/2026
Matérias: 
- ECM516_Arquitetura_de_Computadores
- ECM252_Linguagens_de_Programação_2
---

# Microsserviço: Entrega via Drone
**Pasta:** `/back/entrega_via_drone`
**Contexto de Desenvolvimento:** Este serviço foi concebido para abstrair a complexidade geográfica da operação. Ele permite que o sistema saiba quanto tempo e qual caminho um drone percorrerá, integrando-se com provedores externos de mapas ou utilizando cálculos matemáticos próprios.
**Descrição:** Responsável pelo cálculo de rotas GPS, estimativa de tempo de chegada (ETA) e monitoramento de trajetórias.

---

### Inteligência de Roteamento
O serviço tenta consumir APIs externas (OSRM). Caso falhem, ele utiliza a fórmula de Haversine para calcular a distância em linha reta e estimar o tempo com base na velocidade média do drone:

```javascript
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000; // metros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}
```

### Evento de Rota
Ao finalizar um cálculo, o serviço emite um sinal para que o sistema de monitoramento no frontend possa atualizar o mapa do usuário:

```javascript
publicarEvento('RotaCalculada', {
    origemLat, origemLng,
    destinoLat, destinoLng,
    distancia, duracao,
    fallback: true // Indica se foi usado cálculo manual
});
```

---

## Reimplementação em Dart (entrega de 18/10/2026)

**Pasta:** `/back/entrega_via_drone_dart`

Para a parte 2 do projeto, este microsserviço foi reescrito em Dart com o
pacote `shelf`. A versão Node continua no repositório (desenvolvimento local e
Vercel), mas o Docker/Kubernetes passou a executar a versão Dart, compilada
como executável nativo em uma imagem `scratch` de cerca de 17 MB que usa
aproximadamente 6 MiB de memória em repouso.

### Por que este serviço

- Não guarda estado nem usa banco, então a troca de linguagem não envolve migração de dados.
- Tem contrato pequeno e bem definido (`GET /rota` e o evento `RotaCalculada`).
- Participa do barramento como publicador e como inscrito, demonstrando que a
  comunicação por eventos independe da linguagem.

### Equivalência com a versão Node

| Aspecto | Node | Dart |
| --- | --- | --- |
| Servidor HTTP | Express | `shelf` + `shelf_router` |
| Cliente HTTP | axios | `package:http` |
| Rota principal | OSRM em ordem, timeout de 5 s | igual (`OsrmClient`) |
| Rota alternativa | Haversine a 12 m/s | igual (`construirRotaFallback`) |
| Evento | `RotaCalculada` com `pedidoId` | mesmo nome, origem e campos |
| Ciclo de vida | `back/shared/runtime.js` | `BarramentoClient` + `bin/server.dart` (`/live`, `/ready`, inscrição a cada 5 s, SIGTERM) |

O cálculo de distância ficou assim em Dart:

```dart
double distanciaHaversineMetros(double lat1, double lon1, double lat2, double lon2) {
  final dLat = paraRadianos(lat2 - lat1);
  final dLon = paraRadianos(lon2 - lon1);
  final a = math.pow(math.sin(dLat / 2), 2) +
      math.cos(paraRadianos(lat1)) * math.cos(paraRadianos(lat2)) *
          math.pow(math.sin(dLon / 2), 2);
  return raioTerraMetros * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}
```

### Testes

- `npm run test:dart`: análise estática e 34 testes unitários e de endpoint, sem rede (`MockClient`).
- `npm test`: o teste de contrato `tests/routes.cjs` sobe as duas versões e
  verifica a mesma resposta e o mesmo evento, com o provedor funcionando e com
  ele respondendo 503.
- `npm run k8s:test`: teste de integração do cluster, que exercita a versão Dart
  junto com os demais serviços.

Detalhes de execução e configuração estão no
[README do serviço](../../back/entrega_via_drone_dart/README.md).
