# Relatório de execução Kubernetes

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
