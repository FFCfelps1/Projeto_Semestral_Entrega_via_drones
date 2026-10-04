// ─────────────────────────────────────────
// MIDDLEWARE — VALIDAÇÃO DE PEDIDO
// ─────────────────────────────────────────

// Padroniza as respostas de erro em todos os endpoints
const responderErro = (res, status, mensagem) => {
  return res.status(status).json({
    erro: mensagem,
    status,
    timestamp: new Date().toISOString(),
  });
};

// Valida se todos os campos obrigatórios foram enviados no body
const validarCamposObrigatorios = (req, res, next) => {
  const { item, peso, origem, destino, tipo } = req.body || {};

  // Se algum campo estiver faltando, retorna 400
  if (!item || !peso || !origem || !destino || !tipo) {
    return res.status(400).json({
      erro: "Campos obrigatórios: item, peso, origem, destino, tipo",
    });
  }

  if (typeof item !== 'string' || typeof origem !== 'string' || typeof destino !== 'string' ||
      !item.trim() || !origem.trim() || !destino.trim() ||
      !Number.isFinite(Number(peso)) || Number(peso) <= 0 || Number(peso) > 99999999.99 ||
      !['padrao', 'expressa', 'prioritaria'].includes(tipo) ||
      [item, origem, destino].some(value => value.length > 255)) {
    return responderErro(res, 400, 'Dados do pedido invalidos');
  }
  // Se tudo estiver ok, passa para a próxima função (a rota)
  next();
};

module.exports = { validarCamposObrigatorios, responderErro };