# gestao_pedidos

Microsserviço responsável pelo gerenciamento de pedidos de entrega via drone, seguindo a lógica de carrinho de pedidos.

---

## 🚀 Como rodar

```bash
cd back/gestao_de_pedidos
cp .env.example .env
npm install
npm run dev
```

Acesse: `http://localhost:3005/health`

---

## ⚙️ Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `3005` |
| `BARRAMENTO_URL` | URL do barramento de eventos | `http://localhost:3001` |
| `SERVICE_URL` | URL deste serviço | `http://localhost:3005` |

---

## 📦 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| POST | `/pedidos` | Criar pedido |
| POST | `/pedidos/:id/confirmar` | Confirmar pedido |
| GET | `/pedidos` | Listar pedidos |
| GET | `/pedidos?usuarioId=x` | Filtrar por usuário |
| GET | `/pedidos?status=x` | Filtrar por status |
| GET | `/pedidos/:id` | Buscar por ID |
| PATCH | `/pedidos/:id` | Atualizar status |
| DELETE | `/pedidos/:id` | Cancelar pedido |
| GET | `/pedidos/:id/historico` | Histórico de status |
| POST | `/eventos/receber` | Receber eventos do barramento |

---

## 🔄 Fluxo de status

\```
rascunho → confirmado → em_processamento → em_rota → entregue
                                          ↘ cancelado
\```

---
## 💰 Cálculo de preço

Fórmula: `(precoBase + peso * taxaPorKg) * multiplicador`

| Tipo | Multiplicador |
|------|--------------|
| expressa | 2.0x |
| padrao | 1.0x |
| economica | 0.5x |

---

## ⏱️ Tempo estimado

| Tipo | Tempo |
|------|-------|
| expressa | 15 min |
| padrao | 45 min |
| economica | 90 min |