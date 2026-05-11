const {
  autenticarToken,
  handleError,
  query,
  sendJson,
} = require("../_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Metodo nao permitido" });
  }

  try {
    const auth = autenticarToken(req);
    const usuarios = await query(
      "SELECT id, nome, email FROM usuarios WHERE id = ? LIMIT 1",
      [auth.id],
    );

    if (usuarios.length === 0) {
      return sendJson(res, 404, { error: "Usuario nao encontrado." });
    }

    return sendJson(res, 200, { usuario: usuarios[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar usuario autenticado.");
  }
};
