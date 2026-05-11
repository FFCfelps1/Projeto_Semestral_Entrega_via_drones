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
    const nome = String(body.nome || "").trim();
    const email = normalizarEmail(body.email);
    const senha = body.senha;

    if (!nome || !email || !senha) {
      return sendJson(res, 400, { error: "Nome, email e senha sao obrigatorios." });
    }

    if (!emailValido(email)) {
      return sendJson(res, 400, { error: "Informe um email valido." });
    }

    if (senha.length < 6) {
      return sendJson(res, 400, { error: "A senha deve ter pelo menos 6 caracteres." });
    }

    const usuariosExistentes = await query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email],
    );

    if (usuariosExistentes.length > 0) {
      return sendJson(res, 409, { error: "Este email ja esta cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await query(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, senhaHash],
    );

    const usuario = {
      id: resultado.insertId,
      nome,
      email,
    };

    return sendJson(res, 201, criarSessao(usuario));
  } catch (error) {
    return handleError(res, error, "Erro ao cadastrar usuario.");
  }
};
