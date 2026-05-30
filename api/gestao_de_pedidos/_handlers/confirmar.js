const {
  STATUS,
  emitirEvento,
  buscarPedidoPorId,
  query,
  sendJson,
  responderErro,
  handleError,
} = require("../_utils");

// POST /api/gestao_de_pedidos/pedidos/:id/confirmar
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { erro: "Metodo nao permitido" });
  }

  const { id } = req.query || {};
  if (!id) return responderErro(res, 400, "ID do pedido ausente");

  try {
    const pedido = await buscarPedidoPorId(id);
    if (!pedido) return responderErro(res, 404, "Pedido não encontrado");

    // Só confirma se ainda estiver em rascunho.
    if (pedido.status !== STATUS.RASCUNHO) {
      return responderErro(
        res,
        400,
        "Apenas pedidos em rascunho podem ser confirmados",
      );
    }

    const novoHistorico = [
      ...pedido.statusHistorico,
      { status: STATUS.CONFIRMADO, momento: new Date().toISOString() },
    ];

    await query(
      "UPDATE pedidos SET status = ?, status_historico = ? WHERE id = ?",
      [STATUS.CONFIRMADO, JSON.stringify(novoHistorico), id],
    );

    const confirmado = await buscarPedidoPorId(id);
    emitirEvento("PEDIDO_CONFIRMADO", confirmado);
    return sendJson(res, 200, confirmado);
  } catch (error) {
    return handleError(res, error, "Erro ao confirmar pedido.");
  }
};
