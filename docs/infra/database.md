# Banco de dados e eventos

O esquema real está em [`deploy_cloud.sql`](../../deploy_cloud.sql). MySQL persiste os dados tanto em `back/` quanto nas funções `api/` da Vercel. No Kubernetes, o banco é um StatefulSet MySQL 8.4 com PVC de 5 GiB; um Job aplica o esquema antes da aplicação. Detalhes e comandos estão no [guia Kubernetes](kubernetes.md).

| Tabela | Dados |
| --- | --- |
| `usuarios` | ID numérico, nome, e-mail único, hash de senha e data de criação |
| `pedidos` | UUID, pacote, peso, endereços, tipo, usuário opcional, preço, tempo, status, histórico JSON e datas |
| `notificacoes` | Título, mensagem, pedido, evento, leitura e datas |
| `inscricoes` | Nome único do consumidor, URL e atualização; usada pelo barramento serverless |

Os pools usam `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `DB_CONNECTION_LIMIT`. Credenciais Kubernetes são geradas uma vez e fornecidas por Secret. O aplicativo usa um usuário próprio, sem credenciais root.

As alterações de status/histórico em `back/gestao_de_pedidos` usam transações e bloqueio de linha. Ao excluir um usuário, pedidos preservam seus dados e `usuario_id` passa a NULL. A reaplicação do esquema usa `CREATE TABLE IF NOT EXISTS`, preservando registros; mudanças de estrutura posteriores exigem migrações.

O barramento tradicional mantém inscrições e eventos em memória. Inscrições se recuperam por renovação dos consumidores; eventos perdidos durante indisponibilidade não são reenviados. SQLite em `api/_utils.js` é um mock de desenvolvimento e não substitui MySQL externo no deploy da Vercel.
