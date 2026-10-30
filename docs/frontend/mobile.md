# SkySwift Mobile — aplicativo Flutter completo

A entrega 1.3.0-mobile (01/11) completa o front end Flutter em `front_mobile/`. O aplicativo dá acesso gráfico a todas as funcionalidades dos seis microsserviços, sempre por requisições HTTP ao proxy Nginx (`/api/<serviço>/...`). As telas de login e de relatórios das entregas anteriores foram mantidas e passaram a fazer parte da navegação principal.

## Navegação

Depois do login (ou do cadastro), o aplicativo abre cinco áreas. No celular elas ficam na barra inferior; em telas com 840 px ou mais, num trilho lateral.

| Área | O que o usuário faz |
| --- | --- |
| **Pedidos** | Lista os próprios pedidos, filtra por status, cria pedidos com prévia de preço e prazo, abre o detalhe com histórico e executa as ações de cada etapa |
| **Rotas** | Simula a rota do drone do centro logístico até um endereço, com distância, tempo e desenho do trajeto |
| **Notificações** | Lê os avisos gerados pelo barramento, marca um ou todos como lidos e abre o pedido relacionado; o ícone mostra o total não lido |
| **Relatórios** | Indicadores por período, status e modalidade e exportação CSV (entrega 1.2.0-mobile) |
| **Conta** | Edita nome e e-mail, altera a senha, exclui a conta, fala com a equipe e consulta o estado do sistema |

O ciclo de um pedido segue as regras do serviço `gestao_de_pedidos`:

1. **Rascunho** — criado pelo formulário; pode ser confirmado ou cancelado.
2. **Confirmado** — pode iniciar processamento, ser despachado ou cancelado.
3. **Despacho** — o app converte os endereços em coordenadas (Nominatim/OpenStreetMap, como o site React) e chama `GET /rota?...&pedidoId=` no serviço Dart. O serviço publica `RotaCalculada` no barramento e o serviço de pedidos move o pedido para **Em rota**. O app consulta o pedido até ver a mudança e desenha a rota.
4. **Em rota** — o operador marca como **Entregue** após confirmação.

Cancelar pede confirmação e só aparece nos status em que o backend aceita (`rascunho`, `confirmado`, `em_processamento`).

## Mapa de funcionalidades e endpoints

| Serviço | Endpoint | Tela |
| --- | --- | --- |
| cadastro_usuario | `POST /auth/login` | Login |
| cadastro_usuario | `POST /auth/cadastro` | Criar conta |
| cadastro_usuario | `GET /auth/me` | Validação da sessão |
| cadastro_usuario | `PATCH /auth/me` | Conta › Dados pessoais |
| cadastro_usuario | `PATCH /auth/me/senha` | Conta › Alterar senha |
| cadastro_usuario | `DELETE /auth/me` | Conta › Excluir conta |
| gestao_de_pedidos | `GET /pedidos?usuarioId=&status=` | Pedidos |
| gestao_de_pedidos | `POST /pedidos` | Novo pedido |
| gestao_de_pedidos | `GET /pedidos/:id` | Detalhe do pedido |
| gestao_de_pedidos | `GET /pedidos/:id/historico` | Detalhe › Histórico |
| gestao_de_pedidos | `POST /pedidos/:id/confirmar` | Detalhe › Confirmar |
| gestao_de_pedidos | `PATCH /pedidos/:id` | Detalhe › Iniciar processamento / Marcar como entregue |
| gestao_de_pedidos | `DELETE /pedidos/:id` | Detalhe › Cancelar |
| gestao_de_pedidos | `GET /relatorios/resumo`, `GET /relatorios/exportar` | Relatórios |
| entrega_via_drone (Dart) | `GET /rota` | Rotas e Detalhe › Despachar / Ver rota |
| notificacoes | `GET /notificacoes` | Notificações |
| notificacoes | `GET /notificacoes/nao-lidas/contagem` | Contador na navegação |
| notificacoes | `PATCH /notificacoes/:id/ler`, `PATCH /notificacoes/ler-todas` | Notificações |
| contato_email | `POST /email/enviar` | Conta › Fale com a SkySwift |
| contato_email | `GET /email/contato` | Contato › Escrever pelo aplicativo de e-mail |
| barramento_eventos | `GET /eventos`, `GET /inscricoes` | Conta › Estado do sistema |
| todos | `GET /health` | Conta › Estado do sistema |

Os endpoints internos `POST /eventos` e `POST /eventos/receber` são usados só entre os microsserviços e não são expostos na interface.

## Comportamentos e limites conhecidos

- O JWT continua apenas em memória: recarregar a página ou fechar o app exige novo login. Ao sair, todas as telas abertas são fechadas.
- A lista de pedidos usa `usuarioId` do usuário autenticado. O serviço de pedidos não exige token, então essa separação é feita pelo cliente, como no site React.
- As notificações são globais no backend atual (não têm dono). O app mostra todas, como a página React.
- Sem SMTP configurado, `POST /email/enviar` responde 503. O app avisa e destaca o botão que abre o `mailto` gerado por `GET /email/contato`.
- O desenho da rota é esquemático (linha sobre grade, sem mapa de fundo) para não adicionar dependências; o botão **Abrir no OpenStreetMap** mostra o trajeto real. Rotas aproximadas (`fallback: true`) aparecem tracejadas, com aviso.
- Fora do navegador, a exportação CSV mostra o conteúdo com opção de copiar, já que o download usa `package:web`.

## Executar

No Kubernetes, o app continua publicado em <http://localhost:8080/relatorios/> pela mesma imagem Nginx (o caminho foi mantido para não alterar Dockerfile, Nginx e testes de infraestrutura nesta entrega):

```bash
npm run k8s:up
npm run k8s:access
```

Para desenvolver contra o backend do cluster:

```bash
cd front_mobile
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8080
```

No emulador Android, o host da máquina é `10.0.2.2`:

```bash
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:8080
```

O `AndroidManifest.xml` declara a permissão de internet e libera HTTP sem TLS, necessário para o Nginx local.

## Testes

```bash
cd front_mobile
flutter analyze
flutter test
```

`test/support/backend_falso.dart` implementa em memória os contratos HTTP dos seis serviços. `test/app_test.dart` usa esse backend para percorrer, pela interface, login, cadastro, criação/confirmação/despacho/entrega e cancelamento de pedido, filtros, notificações, simulação de rota, conta, contato e estado do sistema, em telas estreitas e largas. Os testes anteriores de login e relatórios seguem válidos.
