# entrega_via_drone_dart

Reimplementação em **Dart** do microsserviço de rotas da SkySwift
(`back/entrega_via_drone`, em Node). O serviço calcula a rota de entrega entre
origem e destino, devolve os pontos para o mapa e publica o evento
`RotaCalculada` no barramento, que o serviço de pedidos usa para mover o
pedido para `em_rota`.

O contrato HTTP e de eventos é **idêntico** ao da versão Node: front, proxy
nginx, serviço de pedidos e manifests do Kubernetes não precisaram mudar.

## Tecnologias

- Dart 3 com [`shelf`](https://pub.dev/packages/shelf) e `shelf_router` para o servidor HTTP
- [`http`](https://pub.dev/packages/http) para o OSRM e o barramento
- `package:test` com `MockClient` para testes sem rede
- Executável nativo (AOT) em imagem `scratch` de cerca de 17 MB

## Estrutura

```
bin/server.dart                  ponto de entrada e encerramento controlado
lib/src/config.dart              variáveis de ambiente
lib/src/log.dart                 log com horário ISO 8601
lib/src/geo/haversine.dart       distância entre coordenadas
lib/src/rota/                    parâmetros, modelo, OSRM e rota alternativa
lib/src/barramento/              publicação e inscrição periódica
lib/src/http/                    endpoints, CORS, log e composição da aplicação
test/                            testes unitários e de endpoint
```

## Endpoints

| Método | Caminho | Descrição |
| --- | --- | --- |
| GET | `/rota?origemLat&origemLng&destinoLat&destinoLng[&pedidoId]` | rota via OSRM; se todos os provedores falharem, linha reta a 12 m/s com `fallback: true` |
| POST | `/eventos/receber` | recebe eventos do barramento (exige `tipo`) |
| GET | `/health` | `{ "status": "OK" }` |
| GET | `/live` | sonda de vida; 503 durante o encerramento |
| GET | `/ready` | sonda de prontidão; exige inscrição no barramento com menos de 15 s |

Coordenadas ausentes respondem `400 {"erro":"Coordenadas ausentes"}` e valores
não numéricos respondem `400 {"erro":"Coordenadas inválidas"}`.

## Configuração

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3002` | porta HTTP (`0` escolhe uma livre) |
| `BARRAMENTO_URL` | `http://localhost:3001` | barramento de eventos |
| `SERVICE_URL` | `http://localhost:<PORT>` | URL informada na inscrição |
| `ROUTING_PROVIDERS` | OSRM público (HTTPS e HTTP) | provedores separados por vírgula |

## Executar e testar

```bash
cd back/entrega_via_drone_dart
dart pub get
dart run bin/server.dart          # servidor local na porta 3002
dart analyze && dart test         # ou, na raiz: npm run test:dart
```

Na raiz, `npm test` executa o mesmo teste de contrato contra as versões Node
e Dart (`tests/routes.cjs`).

## Docker e Kubernetes

```bash
docker build -t skyswift-entrega-via-drone-dart back/entrega_via_drone_dart
```

`npm run k8s:up` constrói essa imagem e a implanta no Deployment
`entrega-via-drone`, mantendo o nome do Service para o DNS interno. A versão
Node permanece no repositório para desenvolvimento local e para a Vercel
(`api/entrega_via_drone`), mas não deve rodar junto com a Dart: as duas se
inscrevem no barramento com o mesmo nome.
