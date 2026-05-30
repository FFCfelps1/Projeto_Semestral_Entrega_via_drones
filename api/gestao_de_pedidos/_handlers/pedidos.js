const { randomUUID } = require("crypto");
const {
  STATUS,
  calcularPreco,
  calcularTempo,
  emitirEvento,
  formatarPedido,
  query,
  sendJson,
  readRequestBody,
  handleError,
} = require("../_utils");

// POST /api/gestao_de_pedidos/pedidos  → cria um pedido
async function criarPedido(req, res) {
  const body = await readRequestBody(req);
  const { item, peso, origem, destino, tipo, observacoes, usuarioId } = body;

  // Mesma validação do middleware original
  if (!item || !peso || !origem || !destino || !tipo) {
    return sendJson(res, 400, {
      erro: "Campos obrigatórios: item, peso, origem, destino, tipo",
    });
  }

  const id = randomUUID(); // UUID nativo do Node (sem dependência externa)
  const agora = new Date().toISOString();
  const precoEstimado = calcularPreco(Number(peso), tipo);
  const tempoEstimado = calcularTempo(tipo);
  const statusHistorico = [{ status: STATUS.RASCUNHO, momento: agora }];

  await query(
    `INSERT INTO pedidos
      (id, item, peso, origem, destino, tipo, observacoes, usuario_id,
       status, preco_estimado, tempo_estimado, status_historico)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      item,
      Number(peso),
      origem,
      destino,
      tipo,
      observacoes || "",
      usuarioId || null,
      STATUS.RASCUNHO,
      precoEstimado,
      tempoEstimado,
      JSON.stringify(statusHistorico),
    ],
  );

  // Lê de volta para devolver o formato completo (com timestamps do banco)
  const rows = await query("SELECT * FROM pedidos WHERE id = ? LIMIT 1", [id]);
  const novoPedido = formatarPedido(rows[0]);

  emitirEvento("PEDIDO_CRIADO", novoPedido);

  return sendJson(res, 201, novoPedido);
}

// GET /api/gestao_de_pedidos/pedidos?usuarioId=&status=  → lista pedidos
async function listarPedidos(req, res) {
  const { usuarioId, status } = req.query || {};

  let sql = "SELECT * FROM pedidos";
  const condicoes = [];
  const params = [];

  if (usuarioId) {
    condicoes.push("usuario_id = ?");
    params.push(usuarioId);
  }
  if (status) {
    condicoes.push("status = ?");
    params.push(status);
  }
  if (condicoes.length) {
    sql += " WHERE " + condicoes.join(" AND ");
  }
  sql += " ORDER BY criado_em DESC";

  const rows = await query(sql, params);
  return sendJson(res, 200, rows.map(formatarPedido));
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "POST") return await criarPedido(req, res);
    if (req.method === "GET") return await listarPedidos(req, res);
    return sendJson(res, 405, { erro: "Metodo nao permitido" });
  } catch (error) {
    return handleError(res, error, "Erro ao processar pedidos.");
  }
};
