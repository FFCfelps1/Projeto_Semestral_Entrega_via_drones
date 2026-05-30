const {
  STATUS,
  buscarPedidoPorId,
  query,
  sendJson,
  readRequestBody,
  handleError,
} = require("../_utils");

// POST /api/gestao_de_pedidos/eventos/receber
// Recebe eventos do barramento. Quando a rota é calculada, move o
// pedido correspondente para "em_rota".
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { erro: "Metodo nao permitido" });
  }

  try {
    const { tipo, payload } = await readRequestBody(req);
    console.log(`Evento recebido: ${tipo}`);

    if (tipo === "RotaCalculada" && payload && payload.pedidoId) {
      const pedido = await buscarPedidoPorId(payload.pedidoId);

      if (pedido) {
        const novoHistorico = [
          ...pedido.statusHistorico,
          { status: STATUS.EM_ROTA, momento: new Date().toISOString() },
        ];

        await query(
          "UPDATE pedidos SET status = ?, status_historico = ? WHERE id = ?",
          [STATUS.EM_ROTA, JSON.stringify(novoHistorico), payload.pedidoId],
        );

        console.log(`Pedido ${payload.pedidoId} atualizado para em_rota`);
      }
    }

    return sendJson(res, 200, { recebido: true });
  } catch (error) {
    return handleError(res, error, "Erro ao receber evento.");
  }
};
