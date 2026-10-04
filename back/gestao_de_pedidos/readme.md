# Gestão de pedidos

Serviço Node.js 24 na porta 3005. Persiste pedidos, preços, tempos e histórico em MySQL. Para executar a solução completa, consulte o [guia Kubernetes](../../docs/infra/kubernetes.md).

Para executar diretamente, crie o banco e aplique `deploy_cloud.sql`, configure as variáveis e execute:

```bash
cd back/gestao_de_pedidos
cp .env.example .env
npm ci
npm run dev
```

| Variável | Padrão |
| --- | --- |
| `PORT` | `3005` |
| `SERVICE_URL` | `http://localhost:3005` |
| `BARRAMENTO_URL` | `http://localhost:3001` |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` |
| `DB_USER` / `DB_NAME` | `root` / `skyswift` (Kubernetes usa usuário próprio) |
| `DB_PASSWORD` | Defina para o seu banco |
| `DB_CONNECTION_LIMIT` | `10` |

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/health`, `/live`, `/ready` | Saúde, processo vivo e dependências prontas |
| POST | `/pedidos` | Cria um pedido rascunho |
| POST | `/pedidos/:id/confirmar` | Confirma um rascunho |
| GET | `/pedidos` | Lista; aceita filtros `usuarioId` e `status` |
| GET | `/pedidos/:id` | Busca um pedido |
| PATCH | `/pedidos/:id` | Atualiza status/observações |
| DELETE | `/pedidos/:id` | Cancela; não apaga o registro |
| GET | `/pedidos/:id/historico` | Retorna histórico de status |
| POST | `/eventos/receber` | Consome eventos, incluindo `RotaCalculada` com `pedidoId` |

O preço é `(10 + peso × 5) × multiplicador`. Para 2 kg:

| Tipo | Multiplicador | Preço | Tempo |
| --- | --- | --- | --- |
| `padrao` | 1 | R$ 20,00 | 45 min |
| `expressa` | 1,35 | R$ 27,00 | 30 min |
| `prioritaria` | 1,65 | R$ 33,00 | 20 min |

Status: `rascunho → confirmado → em_processamento → em_rota → entregue`. Cancelamento é permitido antes de `em_rota`. Transações protegem status/histórico; cancelados/entregues não são reativados e eventos de rota repetidos são ignorados. Inscrições no barramento se renovam a cada cinco segundos. O pedido é persistido mesmo se a publicação do evento falhar; não existe fila durável para reenviá-lo.
