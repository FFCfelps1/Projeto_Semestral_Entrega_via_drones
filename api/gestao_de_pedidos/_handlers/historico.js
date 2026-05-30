const {
  buscarPedidoPorId,
  sendJson,
  responderErro,
  handleError,
} = require("../_utils");

// GET /api/gestao_de_pedidos/pedidos/:id/historico
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { erro: "Metodo nao permitido" });
  }

  const { id } = req.query || {};
  if (!id) return responderErro(res, 400, "ID do pedido ausente");

  try {
    const pedido = await buscarPedidoPorId(id);
    if (!pedido) return responderErro(res, 404, "Pedido não encontrado");

    return sendJson(res, 200, {
      pedidoId: pedido.id,
      item: pedido.item,
      statusAtual: pedido.status,
      historico: pedido.statusHistorico,
    });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar histórico do pedido.");
  }
};
