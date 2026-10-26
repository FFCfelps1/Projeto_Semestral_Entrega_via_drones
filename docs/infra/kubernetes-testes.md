# Relatório de execução Kubernetes

## Entrega 1.2.0-mobile — Relatórios Flutter (25/10/2026)

Foi implementada uma tela inédita em `/relatorios/`, sem substituir as páginas React. Indicadores e CSV são fornecidos por novos endpoints autenticados no serviço de pedidos. Flutter e React utilizam a mesma imagem Nginx: continuam sete imagens, oito Deployments e um StatefulSet, com nove pods de longa duração.

Ambiente: Flutter 3.47.1 / Dart 3.13.1, Node 24.13.1 / npm 11.8.0, Docker Engine 29.9.2, Kubernetes 1.36.1 em kind ARM64, kubectl 1.37.1, Kustomize 5.8.1 e containerd 2.3.1. O navegador de teste foi Google Chrome 155 via Playwright. A data desta seção usa São Paulo; logs e tags de imagens usam UTC e podem indicar 26/10.

| Verificação executada | Resultado |
| --- | --- |
| Análise e testes Flutter | 24 testes aprovados, incluindo login, sessão, erros, filtros, CSV, três tamanhos de tela, dois temas e texto em 200% |
| Serviço Dart | Análise sem problemas e 34 testes aprovados |
| `npm test` | 13 testes aprovados, sem ignorados: relatórios, barramento e contratos de rotas Node/Dart |
| Preparação limpa dos testes | Dependências preparadas pelos scripts e os mesmos 13 testes aprovados |
| React | Lint e build aprovados |
| Chrome sobre o Nginx | Dois cenários aprovados: login, seleção de status, aplicação explícita, download e conteúdo do CSV, tema, tela pequena, período vazio, recarga e cadastro React |
| `npm run k8s:test` | 299 verificações da suíte anterior e 22 dos relatórios aprovadas, totalizando 321 nesta execução |
| `npm run k8s:test -- --lifecycle` | Duas reaplicações e um ciclo parada/subida aprovados, preservando dados, PVC e Secret |
| Imagens Linux ARM64 | Sete imagens construídas e executadas no cluster |
| Imagens Linux AMD64 | Sete imagens construídas; a execução do cluster permaneceu ARM64 |
| Manifests e scripts | Kustomize, validação no servidor com `--dry-run=server`, sintaxe Bash e `git diff --check` aprovados |

A execução principal da suíte Kubernetes foi `c47bf45d-7d61-4a02-92a5-de7a00fe4711`. O número de verificações varia com as tentativas de espera por recuperação; não corresponde ao número de casos de teste.

O teste de MySQL real criou registros em torno da meia-noite de São Paulo, conferindo inclusão/exclusão dos limites, soma `0.21`, média arredondada `0.11`, filtros combinados e CSV com exatamente os mesmos pedidos. A suíte HTTP também verificou JWT ausente, inválido e expirado, configuração ausente, datas inválidas, categorias vazias, precisão monetária e a mudança histórica de horário de verão de 2018.

Foram reiniciados frontend, pedidos e MySQL durante a verificação dos relatórios; indicadores foram preservados. A regressão geral também reiniciou notificações e barramento, verificou as cinco inscrições, o fluxo de pedidos/eventos/rotas Dart, persistência e envio efetivo ao Mailpit.

O Chrome baixou o CSV pelo botão real da interface, verificando nome, BOM, conteúdo, filtros, acentos, aspas e quebra de linha. O token foi enviado em cabeçalho, nunca na URL. Os testes removeram somente seus próprios usuários, pedidos e notificações. Não houve testes ou alterações para publicação Vercel nesta entrega.

Os logs e artefatos estão em `.kubernetes-local/`, ignorado pelo Git: `flutter-final-test.log`, `dart-test.log`, `unit-test-clean.log`, `browser-run.log`, `browser-results.json`, `relatorios-k8s-full.log`, `relatorios-integration.log`, `relatorios-lifecycle.log` e `relatorios-amd64.log`. Os testes de navegador geram capturas e o CSV baixado nesse mesmo diretório. Reproduza pelos comandos do [guia de relatórios](../frontend/relatorios.md).

A identificação desta entrega foi corrigida para a tag `1.2.0-mobile`, com versão Flutter `1.2.0-mobile+2`, sem mudanças funcionais. Após a correção, a análise Flutter, os 24 testes e a compilação Web foram novamente aprovados; o arquivo gerado `version.json` identifica `1.2.0-mobile`, build `2`. Logs: `mobile-version-flutter-test.log` e `mobile-version-flutter-build.log`, no mesmo diretório local ignorado pelo Git.

---

## Histórico das entregas anteriores

Validação realizada em **04/10/2026**, no Docker Desktop local, contexto `docker-desktop`, namespace `skyswift`. Os testes utilizaram dados sintéticos, MySQL e SMTP locais. Nenhum deploy da Vercel foi publicado.

## Ambiente e construção

| Item | Ambiente verificado |
| --- | --- |
| Node.js / npm | 24.13.1 / 11.8.0 |
| Docker Engine | 29.8.1 |
| Kubernetes | 1.36.1, kind, um nó ARM64 |
| kubectl / Kustomize | 1.37.1 / 5.8.1 |
| Runtime do nó | containerd 2.3.1 |
| MySQL | 8.4.11, PVC 5 GiB |
| Mailpit | v1.27.4 |
| Imagens em execução | `c76fcb6-20261004220227`, Linux ARM64 |
| Construção AMD64 final | `9d88a0e-20261004220830`, sete imagens, sem substituir a tag ARM64 |

`npm ci` na raiz, instalações limpas nos seis Dockerfiles e no build do frontend, `npm run lint` e `npm run build` concluíram com sucesso. A construção Linux ARM64 das sete imagens e seus rollouts passaram. `PLATFORM=linux/amd64 SAVE_TAG=false npm run k8s:build` também passou para as sete imagens; AMD64 foi validado por construção, e os testes do cluster rodaram em ARM64.

Os manifests de infraestrutura e aplicação foram renderizados por Kustomize e aceitos por `kubectl apply --dry-run=server` no cluster local. Todos os scripts Bash e os 35 arquivos JavaScript de `back/`/`api/` passaram na verificação de sintaxe. Ao fim, oito Deployments e o StatefulSet MySQL apresentaram uma réplica pronta cada.

## Testes automatizados

| Comando | Resultado |
| --- | --- |
| `npm test` | 2 testes aprovados: provedor HTTP funcional e indisponível; rota, fallback, `pedidoId`, evento e processo vivo |
| `npm run k8s:test` | **311 verificações aprovadas** na execução final, incluindo HTTP, proxy, SMTP, persistência e recuperação |
| `npm run test:vercel` | Teste aprovado dos seis handlers reais, com JWT, MySQL, inscrição idempotente, publicação concluída, notificações, rota alternativa e SMTP |
| `npm run k8s:test -- --lifecycle` | Duas reexecuções de subida e um ciclo parada/subida aprovados; dados, Secret e PVC preservados |
| `npm run k8s:check` | Docker disponível, nó pronto e manifests renderizados |

A contagem HTTP inclui verificações durante a espera de recuperação, podendo variar com os tempos do cluster. A execução final foi identificada por `91ba4a76-7803-4b6a-bdf2-1d39ee93b8a5`.

Cobertura HTTP pelo endereço do frontend:

- Páginas por navegação direta, API desconhecida JSON 404 e API indisponível JSON 503 sem afetar a SPA.
- Cadastro, e-mail duplicado, credenciais inválidas, login, JWT ausente/inválido, perfil, senha e exclusão de conta.
- Pedidos nos três tipos; preço/tempo para 2 kg; filtros; ID inexistente; entradas inválidas; confirmação, status, histórico, cancelamento e estados terminais.
- Cinco inscrições usando DNS interno, `PEDIDO_CRIADO → barramento → notificações`, leitura individual/em lote e contagem.
- Rota com `pedidoId`, evento alterando pedido para `em_rota`, repetição sem duplicar histórico e cancelado sem reativação.
- Link mailto, envio SMTP, rejeição de e-mail inválido e mensagem recebida efetivamente no Mailpit.
- Reinícios separados de pedidos, notificações, barramento e MySQL, com usuários/JWT, pedidos e leitura de notificações preservados; novos pedidos/notificações após cada recuperação.
- Reaplicação idempotente do esquema e manutenção das credenciais e do PVC em parada/subida.

Os testes de rotas usam servidores HTTP simulados e exercitam o processo real do microsserviço. Não dependem de disponibilidade do OSRM externo. O teste Vercel carrega os handlers `api/*/handler.js` em um servidor HTTP local; o deploy e os limites da plataforma Vercel não foram testados remotamente.

## Validação no navegador

Foi utilizado Safari pela ferramenta Computer Use, pois o navegador integrado não estava disponível nesta sessão. Foram verificados cadastro, login/logout, sessão autenticada, perfil, criação de pedido, confirmação e histórico, notificações, envio de contato, preços, suporte, rastreamento e navegação direta pelo Nginx.

O pedido de interface permaneceu após parada/subida. Alterar seu status pela API e recarregar a página mostrou `em_processamento`, comprovando a revalidação dos registros locais. Ao parar temporariamente o serviço de pedidos, a lista preservou seus dados e exibiu `Servico temporariamente indisponivel. Tente novamente.`; o serviço foi restaurado após a simulação.

Ao concluir, a conta, o pedido e a notificação sintéticos da interface foram removidos. Reabrir a página removeu a referência local cujo ID retornava 404, exibindo zero pedidos. A mensagem de demonstração foi preservada no Mailpit.

O formulário de contato exibiu `Mensagem enviada com sucesso.`. A caixa Mailpit mostrou remetente, destinatário, Reply-To e conteúdo integral da mensagem sintética `Validacao Kubernetes UI 2026-10-04: envio pelo Nginx e recebimento no Mailpit.`. O conteúdo também foi conferido pela API do Mailpit. Na página de rastreamento, o endereço público de exemplo Avenida Paulista foi geocodificado e a rota alternativa foi exibida após falha dos dois provedores externos de rota. Geocodificação e imagens do mapa continuam dependentes de serviços externos; os testes de rota normal/fallback foram controlados pelos provedores simulados.

## Problemas encontrados e corrigidos

1. `KUBECONFIG` apontava somente para configurações externas. Os scripts passaram a usar explicitamente o arquivo local do Docker Desktop e o contexto `docker-desktop`.
2. Após rollout, conexões podiam ser recusadas brevemente durante a propagação dos endpoints. O barramento ganhou tentativas curtas para recusa de conexão; os testes aguardam estabilidade antes de verificar novos fluxos.
3. Falhas de upstream do Nginx retornavam HTML. Agora conexão/timeout no proxy retorna JSON 503, verificado parando temporariamente o serviço de rota.
4. Reutilização de sockets acumulava listeners durante a distribuição. O cliente de entrega passou a usar conexões sem keep-alive; respostas de inscrição são consumidas e pools que falham na inicialização são fechados antes de tentar novamente.
5. Os scripts capturavam o PID de um subshell de função, deixando `kubectl port-forward` órfão. Agora o subshell usa `exec`, a limpeza encerra o PID correto e testes falham claramente se suas portas estiverem ocupadas. A ausência de encaminhamentos residuais foi conferida depois dos testes e da parada/subida.

Essas correções ficaram em quatro commits adicionais às 13 etapas planejadas. A branch é `feat/kubernetes-local`; mensagens seguem Conventional Commits em português. A sequência principal implementou Docker, configuração, inscrições/saúde, persistência, vínculo de eventos, frontend, Nginx, infraestrutura, workloads, scripts, Vercel, testes e documentação.

Saídas detalhadas da sessão ficam em `.kubernetes-local/` (ignorado pelo Git): `rollout.log`, `build-amd64.log`, `integration.log`, `lifecycle.log`, `vercel.log`, `routes.log`, `lint.log` e `frontend-build.log`. Para reproduzir, siga o [guia Kubernetes](kubernetes.md).

## Revalidação com o serviço de rotas em Dart (18/10/2026)

Após a troca do Deployment `entrega-via-drone` para a imagem Dart, a solução completa foi reconstruída e testada novamente no Docker Desktop local.

| Item | Ambiente verificado |
| --- | --- |
| Dart SDK (build local) / imagem base | 3.13.1 / `dart:3.13` |
| Docker Engine | 29.5.2 |
| Kubernetes / kubectl | 1.34.3, kind, um nó AMD64 / 1.34.1 |
| Runtime do nó | containerd 2.2.0 |
| Imagens em execução | `050d775-20261019013246`, Linux AMD64 |
| Imagem Dart | `scratch` com executável AOT, 17,3 MB, cerca de 6 MiB de memória em repouso |

| Comando | Resultado |
| --- | --- |
| `npm run test:dart` | `dart analyze` sem apontamentos e 34 testes aprovados |
| `npm test` | 5 testes aprovados: contrato da rota (provedor funcional e indisponível) nas versões Node e Dart, e ids únicos no barramento após 1003 eventos |
| `npm run k8s:up` | sete imagens construídas e oito Deployments com rollout concluído; pod Dart inscrito no barramento em cerca de 1 s |
| `npm run k8s:test` | **304 verificações aprovadas**, incluindo cinco inscrições, rota com `pedidoId` movendo o pedido para `em_rota`, 400 para coordenadas inválidas, JSON 503 com o serviço escalado para zero e recuperação após reinícios |

Também foram verificados manualmente, com o container Dart isolado: rota real pelo OSRM via HTTPS (158 pontos, `fallback: false`) e encerramento por `docker stop` em cerca de 1 s com código de saída 0. O total de verificações varia entre execuções (311 em 04/10) porque as esperas de `eventually` contam também as requisições bem-sucedidas feitas em tentativas repetidas; a execução terminou com `APROVADO`.
