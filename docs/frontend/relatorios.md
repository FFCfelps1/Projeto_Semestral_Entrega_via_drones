# Relatórios e Indicadores de Entregas

A entrega 1.2.0-mobile acrescenta uma tela Flutter inédita em <http://localhost:8080/relatorios/>. Ela não substitui as páginas React de pedidos, rastreamento, conta ou notificações. São duas funcionalidades novas no serviço de pedidos: indicadores agregados e exportação CSV. Não foi criado outro microsserviço.

## Acesso e utilização

Cadastre uma conta pelo site React em `/login` e crie pedidos em `/pedido`. Abra **Relatórios** no menu e entre com a mesma conta. O login Flutter chama `/auth/login` e valida o perfil em `/auth/me`. A sessão e o JWT ficam somente em memória: sair, expirar ou recarregar a página exige novo login. Os relatórios têm visão global para qualquer usuário autenticado; não há perfis administrativos ou restrição por proprietário.

O período inicial contém os últimos 30 dias do calendário de São Paulo. Escolha datas em DD/MM/AAAA, status e modalidade e clique **Aplicar filtros**. É permitido consultar até 366 dias por vez. **Limpar** restaura o período padrão e todos os status/modalidades. Digitar ou selecionar filtros não dispara consultas.

Os cartões apresentam total de pedidos, valor estimado total, ticket médio estimado e pedidos entregues. As visualizações mostram o volume por dia e as quantidades por status/modalidade. O período considera a criação do pedido; a classificação usa seu status atual. Todos os preços da seleção entram nos indicadores, inclusive os de pedidos cancelados quando esse status estiver incluído. São estimativas, não receita recebida.

**Exportar CSV** usa os filtros da última consulta bem-sucedida, mesmo que o formulário tenha alterações ainda não aplicadas. O arquivo inclui identificador, item, modalidade, status, peso, endereços, preço estimado e datas. Usa UTF-8 com BOM, separador `;`, valores decimais com vírgula, datas ISO com offset de São Paulo e CRLF. Campos são escapados e células semelhantes a fórmulas recebem apóstrofo de proteção. Sem pedidos, o arquivo contém somente o cabeçalho.

## Contratos HTTP

O proxy Nginx encaminha as rotas abaixo ao serviço Node de pedidos, porta 3005:

| Funcionalidade | Endpoint |
| --- | --- |
| Indicadores JSON | `GET /api/gestao_de_pedidos/relatorios/resumo` |
| Download CSV | `GET /api/gestao_de_pedidos/relatorios/exportar` |

Ambos exigem `Authorization: Bearer <JWT>` e aceitam os mesmos parâmetros:

| Parâmetro | Formato |
| --- | --- |
| `inicio`, `fim` | `YYYY-MM-DD`, dias inclusivos no fuso `America/Sao_Paulo`; omitidos usam os últimos 30 dias |
| `status` | `rascunho`, `confirmado`, `em_processamento`, `em_rota`, `entregue` ou `cancelado`; omitido inclui todos |
| `tipo` | `padrao`, `expressa` ou `prioritaria`; omitido inclui todos |

O resumo retorna `filtros`, `totalPedidos`, `porStatus`, `porModalidade`, `valorEstimadoTotal`, `ticketMedioEstimado`, `pedidosPorDia` e `geradoEm`. Valores monetários são strings decimais com duas casas. Dias sem pedidos e categorias sem movimento aparecem com zero. O backend calcula os valores com centavos inteiros e compartilha a seleção parametrizada do MySQL com a exportação. Não há migração do banco.

Datas e opções inválidas retornam 400; JWT ausente/inválido/expirado retorna 401; banco ou configuração de autenticação indisponível retorna 503. As respostas não são armazenadas em cache. O download inclui `Content-Type: text/csv; charset=utf-8` e `Content-Disposition: attachment`, com o período no nome. O JWT nunca é colocado na URL. Consultas e downloads independentes refletem os dados no momento de cada requisição.

## Compilação e Kubernetes

Além de Node 24, npm, Docker Desktop e kubectl, a compilação exige Flutter compatível com Dart >=3.13.1. Foi utilizado Flutter 3.47.1. Os lockfiles são versionados. Na raiz:

```bash
npm ci
npm ci --prefix front
npm run k8s:check
npm run k8s:up
npm run k8s:access
```

`k8s:build` compila Flutter Web com `--base-href /relatorios/` e recursos do renderizador locais antes de construir as sete imagens. React e Flutter ficam na mesma imagem Nginx. O contexto Docker do frontend passa a ser a raiz, com `.dockerignore` excluindo credenciais e incluindo somente o frontend e os artefatos Flutter necessários. Para compilar manualmente: `npm run build:flutter`, seguido de `docker --context desktop-linux build -f front/Dockerfile .`.

O Deployment de pedidos recebe `JWT_SECRET` do mesmo Secret usado pela autenticação. Os demais contratos, recursos, PVC e Secrets são preservados. `k8s:up -- --no-build` reutiliza imagens prontas sem exigir nova compilação Flutter. Para acesso local ao backend fora do Nginx, configure `API_BASE_URL` como a origem completa do Nginx, por exemplo `http://localhost:8080`, usando `--dart-define` no Flutter. Essa variável não contém credenciais.

Esta entrega publica Flutter **Web** no Kubernetes. O download pelo navegador usa `package:web`; os imports condicionais mantêm o código compilável fora da web, mas a distribuição e a exportação em aplicativos nativos não fazem parte desta entrega. Vercel permanece fora desse fluxo.

## Testes

```bash
npm run test:flutter
npm run test:dart
npm test
npm run lint
npm run build
npm run k8s:test
npm run k8s:test -- --lifecycle
```

Os testes de relatórios no cluster usam a porta local 18081, dados sintéticos e exclusão somente dos registros criados naquela execução. A suíte completa reinicia componentes e exige reabrir `k8s:access` depois. Não execute os testes de navegador simultaneamente com reinícios ou rollouts.

Com Google Chrome instalado e `k8s:access` ativo:

```bash
npm run test:browser
```

Playwright verifica o Flutter realmente servido pelo Nginx: login, filtros explícitos, download e conteúdo do CSV, temas, tela pequena, sessão em memória e cadastro pelo React. Os resultados, capturas e arquivos baixados ficam em `.kubernetes-local`, ignorado pelo Git. `PLAYWRIGHT_CHANNEL` permite selecionar outro canal Chromium instalado. Os resultados efetivamente executados estão no [relatório Kubernetes](../infra/kubernetes-testes.md).
