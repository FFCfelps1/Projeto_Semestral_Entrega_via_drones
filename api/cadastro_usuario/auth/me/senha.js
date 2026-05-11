const bcrypt = require("bcryptjs");
const {
  autenticarToken,
  handleError,
  query,
  readRequestBody,
  sendJson,
} = require("../../_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "PATCH") {
    return sendJson(res, 405, { error: "Metodo nao permitido" });
  }

  try {
    const auth = autenticarToken(req);
    const body = await readRequestBody(req);
    const { senhaAtual, novaSenha } = body;

    if (!senhaAtual || !novaSenha) {
      return sendJson(res, 400, { error: "Senha atual e nova senha sao obrigatorias." });
    }

    if (novaSenha.length < 6) {
      return sendJson(res, 400, { error: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    const usuarios = await query(
      "SELECT id, senha FROM usuarios WHERE id = ? LIMIT 1",
      [auth.id],
    );

    if (usuarios.length === 0) {
      return sendJson(res, 404, { error: "Usuario nao encontrado." });
    }

    const usuario = usuarios[0];
    const senhaJaCriptografada = usuario.senha.startsWith("$2");
    const senhaAtualValida = senhaJaCriptografada
      ? await bcrypt.compare(senhaAtual, usuario.senha)
      : senhaAtual === usuario.senha;

    if (!senhaAtualValida) {
      return sendJson(res, 401, { error: "Senha atual invalida." });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await query("UPDATE usuarios SET senha = ? WHERE id = ?", [senhaHash, auth.id]);

    return sendJson(res, 200, { message: "Senha atualizada com sucesso." });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar senha autenticada.");
  }
};
