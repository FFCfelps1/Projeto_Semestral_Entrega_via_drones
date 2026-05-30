const {
  autenticarToken,
  emailValido,
  handleError,
  normalizarEmail,
  query,
  readRequestBody,
  sendJson,
} = require("../_utils");

async function buscarUsuario(auth) {
  const usuarios = await query(
    "SELECT id, nome, email FROM usuarios WHERE id = ? LIMIT 1",
    [auth.id],
  );

  return usuarios[0] || null;
}

async function consultarUsuario(res, auth) {
  const usuario = await buscarUsuario(auth);

  if (!usuario) {
    return sendJson(res, 404, { error: "Usuario nao encontrado." });
  }

  return sendJson(res, 200, { usuario });
}

async function atualizarUsuario(req, res, auth) {
  const body = await readRequestBody(req);
  const nome = body.nome !== undefined ? String(body.nome).trim() : undefined;
  const email = body.email !== undefined ? normalizarEmail(body.email) : undefined;

  if (nome === undefined && email === undefined) {
    return sendJson(res, 400, { error: "Informe nome ou email para atualizar." });
  }

  if (nome !== undefined && !nome) {
    return sendJson(res, 400, { error: "Nome nao pode ficar vazio." });
  }

  if (email !== undefined && !emailValido(email)) {
    return sendJson(res, 400, { error: "Informe um email valido." });
  }

  const usuarioAtual = await buscarUsuario(auth);

  if (!usuarioAtual) {
    return sendJson(res, 404, { error: "Usuario nao encontrado." });
  }

  if (email !== undefined && email !== usuarioAtual.email) {
    const usuariosComEmail = await query(
      "SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1",
      [email, auth.id],
    );

    if (usuariosComEmail.length > 0) {
      return sendJson(res, 409, { error: "Este email ja esta cadastrado." });
    }
  }

  const usuario = {
    id: usuarioAtual.id,
    nome: nome ?? usuarioAtual.nome,
    email: email ?? usuarioAtual.email,
  };

  await query("UPDATE usuarios SET nome = ?, email = ? WHERE id = ?", [
    usuario.nome,
    usuario.email,
    usuario.id,
  ]);

  return sendJson(res, 200, {
    message: "Perfil atualizado com sucesso.",
    usuario,
  });
}

async function excluirUsuario(res, auth) {
  const resultado = await query("DELETE FROM usuarios WHERE id = ?", [auth.id]);

  if (resultado.affectedRows === 0) {
    return sendJson(res, 404, { error: "Usuario nao encontrado." });
  }

  return sendJson(res, 200, { message: "Conta excluida com sucesso." });
}

module.exports = async function handler(req, res) {
  if (!["GET", "PATCH", "DELETE"].includes(req.method)) {
    return sendJson(res, 405, { error: "Metodo nao permitido" });
  }

  try {
    const auth = autenticarToken(req);

    if (req.method === "GET") {
      return consultarUsuario(res, auth);
    }

    if (req.method === "PATCH") {
      return atualizarUsuario(req, res, auth);
    }

    return excluirUsuario(res, auth);
  } catch (error) {
    return handleError(res, error, "Erro ao processar usuario autenticado.");
  }
};
