const bcrypt = require("bcryptjs");
const {
  criarSessao,
  emailValido,
  handleError,
  normalizarEmail,
  query,
  readRequestBody,
  sendJson,
} = require("../_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Metodo nao permitido" });
  }

  try {
    const body = await readRequestBody(req);
    const email = normalizarEmail(body.email);
    const senha = body.senha;

    if (!email || !senha) {
      return sendJson(res, 400, { error: "Email e senha sao obrigatorios." });
    }

    if (!emailValido(email)) {
      return sendJson(res, 400, { error: "Informe um email valido." });
    }

    const usuarios = await query(
      "SELECT id, nome, email, senha FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    if (usuarios.length === 0) {
      return sendJson(res, 401, { error: "Email ou senha invalidos." });
    }

    const usuarioEncontrado = usuarios[0];
    const senhaJaCriptografada = usuarioEncontrado.senha.startsWith("$2");
    const senhaValida = senhaJaCriptografada
      ? await bcrypt.compare(senha, usuarioEncontrado.senha)
      : senha === usuarioEncontrado.senha;

    if (!senhaValida) {
      return sendJson(res, 401, { error: "Email ou senha invalidos." });
    }

    if (!senhaJaCriptografada) {
      const senhaHash = await bcrypt.hash(senha, 10);
      await query("UPDATE usuarios SET senha = ? WHERE id = ?", [
        senhaHash,
        usuarioEncontrado.id,
      ]);
    }

    const usuario = {
      id: usuarioEncontrado.id,
      nome: usuarioEncontrado.nome,
      email: usuarioEncontrado.email,
    };

    return sendJson(res, 200, criarSessao(usuario));
  } catch (error) {
    return handleError(res, error, "Erro ao autenticar usuario.");
  }
};
