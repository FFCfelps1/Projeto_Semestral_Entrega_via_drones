# Microsserviço de gestão de pedidos

O serviço `back/gestao_de_pedidos` atende na porta 3005 e persiste pedidos em MySQL. Sua documentação de endpoints e configuração está no [README do serviço](../../back/gestao_de_pedidos/readme.md); a execução conjunta está no [guia Kubernetes](../infra/kubernetes.md).

`POST /pedidos` recebe `item`, `peso`, `origem`, `destino`, `tipo`, `observacoes` opcional e `usuarioId` opcional. Cria um UUID com status `rascunho`, preço/tempo estimados e histórico inicial e publica `PEDIDO_CRIADO`. Não despacha um drone físico.

O fluxo é `rascunho → confirmado → em_processamento → em_rota → entregue`. Cancelamento é permitido antes de `em_rota`. Mudanças de status/histórico são transacionais e não reativam estados terminais. `RotaCalculada`, quando inclui `pedidoId`, avança um pedido confirmado/em processamento para `em_rota`; eventos repetidos não duplicam seu histórico.

O frontend guarda referências locais e as revalida pela API ao abrir a página. A listagem da API permite filtros por `usuarioId` e `status`; notificações são globais, mantendo os contratos anteriores.
