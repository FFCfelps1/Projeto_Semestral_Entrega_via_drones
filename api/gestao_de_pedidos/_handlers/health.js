const { sendJson } = require("../_utils");

// GET /api/gestao_de_pedidos/health
module.exports = async function handler(req, res) {
  return sendJson(res, 200, { status: "ok", servico: "gestao_pedidos" });
};
