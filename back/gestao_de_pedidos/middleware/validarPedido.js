// ─────────────────────────────────────────
// MIDDLEWARE — VALIDAÇÃO DE PEDIDO
// ─────────────────────────────────────────

// Valida se todos os campos obrigatórios foram enviados no body
const validarCamposObrigatorios = (req, res, next) => {
  const { item, peso, origem, destino, tipo } = req.body;

  // Se algum campo estiver faltando, retorna 400
  if (!item || !peso || !origem || !destino || !tipo) {
    return res.status(400).json({
      erro: "Campos obrigatórios: item, peso, origem, destino, tipo",
    });
  }

  // Se tudo estiver ok, passa para a próxima função (a rota)
  next();
};

module.exports = { validarCamposObrigatorios };