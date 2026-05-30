const {
  STATUS,
  ORDEM_STATUS,
  emitirEvento,
  formatarPedido,
  buscarPedidoPorId,
  query,
  sendJson,
  responderErro,
  readRequestBody,
  handleError,
} = require("../_utils");

// GET /api/gestao_de_pedidos/pedidos/:id  → busca um pedido
async function buscar(res, id) {
  const pedido = await buscarPedidoPorId(id);
  if (!pedido) return responderErro(res, 404, "Pedido não encontrado");
  return sendJson(res, 200, pedido);
}

// PATCH /api/gestao_de_pedidos/pedidos/:id  → atualiza status (com observacoes)
async function atualizar(req, res, id) {
  const pedido = await buscarPedidoPorId(id);
  if (!pedido) return responderErro(res, 404, "Pedido não encontrado");

  const body = await readRequestBody(req);
  const { status, observacoes } = body;

  const statusPermitidos = Object.values(STATUS);
  if (!statusPermitidos.includes(status)) {
    return responderErro(
      res,
      400,
      `Status inválido. Use: ${statusPermitidos.join(", ")}`,
    );
  }

  // Não permite voltar o status nem pular etapas.
  // Exceção: cancelado pode ser aplicado de qualquer status.
  const indexAtual = ORDEM_STATUS.indexOf(pedido.status);
  const indexNovo = ORDEM_STATUS.indexOf(status);
  if (indexNovo <= indexAtual && status !== STATUS.CANCELADO) {
    return responderErro(res, 400, "Transição de status inválida");
  }

  const novasObservacoes =
    observacoes !== undefined ? observacoes : pedido.observacoes;
  const novoHistorico = [
    ...pedido.statusHistorico,
    { status, momento: new Date().toISOString() },
  ];

  await query(
    `UPDATE pedidos
       SET status = ?, observacoes = ?, status_historico = ?
     WHERE id = ?`,
    [status, novasObservacoes, JSON.stringify(novoHistorico), id],
  );

  const atualizado = await buscarPedidoPorId(id);
  emitirEvento("PEDIDO_ATUALIZADO", atualizado);
  return sendJson(res, 200, atualizado);
}

// DELETE /api/gestao_de_pedidos/pedidos/:id  → cancela um pedido
async function cancelar(res, id) {
  const pedido = await buscarPedidoPorId(id);
  if (!pedido) return responderErro(res, 404, "Pedido não encontrado");

  // Não permite cancelar pedido que já está em rota ou entregue.
  if (pedido.status === STATUS.EM_ROTA || pedido.status === STATUS.ENTREGUE) {
    return responderErro(
      res,
      400,
      "Não é possível cancelar um pedido que já está em rota ou entregue",
    );
  }

  const novoHistorico = [
    ...pedido.statusHistorico,
    { status: STATUS.CANCELADO, momento: new Date().toISOString() },
  ];

  await query(
    "UPDATE pedidos SET status = ?, status_historico = ? WHERE id = ?",
    [STATUS.CANCELADO, JSON.stringify(novoHistorico), id],
  );

  const cancelado = await buscarPedidoPorId(id);
  emitirEvento("PEDIDO_CANCELADO", cancelado);
  return sendJson(res, 200, {
    mensagem: "Pedido cancelado com sucesso",
    pedido: cancelado,
  });
}

module.exports = async function handler(req, res) {
  // Em rotas dinâmicas da Vercel, o segmento [id] chega em req.query.id
  const { id } = req.query || {};
  if (!id) return responderErro(res, 400, "ID do pedido ausente");

  try {
    if (req.method === "GET") return await buscar(res, id);
    if (req.method === "PATCH") return await atualizar(req, res, id);
    if (req.method === "DELETE") return await cancelar(res, id);
    return sendJson(res, 405, { erro: "Metodo nao permitido" });
  } catch (error) {
    return handleError(res, error, "Erro ao processar pedido.");
  }
};
