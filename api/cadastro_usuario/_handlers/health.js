const { query, sendJson } = require("../_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { success: false, error: "Metodo nao permitido" });
  }

  try {
    // Tenta uma consulta simples para validar a conexão com o banco
    await query("SELECT 1");

    return sendJson(res, 200, {
      status: "OK",
      database: "Conectado",
      message: "Microsservico cadastro_usuario em modo serverless",
    });
  } catch (error) {
    return sendJson(res, 500, {
      status: "ERRO",
      database: "Desconectado",
      error: error.message,
      message: "Falha na conexao com o banco de dados. Verifique as variaveis de ambiente.",
    });
  }
};
