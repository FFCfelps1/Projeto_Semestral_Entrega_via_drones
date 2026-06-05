const { query, sendJson } = require("../_utils");

// GET /api/gestao_de_pedidos/health
module.exports = async function handler(req, res) {
  try {
    await query("SELECT 1");
    return sendJson(res, 200, {
      status: "ok",
      database: "Conectado",
      servico: "gestao_pedidos",
    });
  } catch (error) {
    return sendJson(res, 500, {
      status: "erro",
      database: "Desconectado",
      error: error.message,
      message: "Falha na conexao com o banco de dados.",
    });
  }
};
