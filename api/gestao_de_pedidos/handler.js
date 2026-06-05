// Dispatcher único do microsserviço gestao_de_pedidos.
// Consolida pedidos, pedidos/:id, pedidos/:id/confirmar,
// pedidos/:id/historico, eventos/receber e health numa só função serverless,
// para ficar abaixo do limite de 12 funções do plano Hobby da Vercel.
// As rotas expostas ao front continuam EXATAMENTE as mesmas; o segmento
// dinâmico :id é injetado em req.query.id, como os handlers já esperam.
const pedidos = require("./_handlers/pedidos");
const pedido = require("./_handlers/pedido");
const confirmar = require("./_handlers/confirmar");
const historico = require("./_handlers/historico");
const receber = require("./_handlers/receber");
const health = require("./_handlers/health");
const { sendJson } = require("./_utils");

const BASE = "/api/gestao_de_pedidos";

function getSegments(req) {
  const p = req.query && req.query.path;
  if (Array.isArray(p)) return p.filter(Boolean);
  if (typeof p === "string" && p) return p.split("/").filter(Boolean);
  const url = (req.url || "").split("?")[0];
  const rest = url.startsWith(BASE) ? url.slice(BASE.length) : url;
  return rest.split("/").filter(Boolean);
}

module.exports = async function handler(req, res) { if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.statusCode = 204; return res.end(); } 
  req.query = req.query || {};
  const segs = getSegments(req);

  // /health  e  / (base)
  if (segs.length === 0 || (segs.length === 1 && segs[0] === "health")) {
    return health(req, res);
  }

  // /eventos/receber
  if (segs[0] === "eventos" && segs[1] === "receber") {
    return receber(req, res);
  }

  // /pedidos ...
  if (segs[0] === "pedidos") {
    // /pedidos  → listar (GET) ou criar (POST)
    if (segs.length === 1) return pedidos(req, res);

    // a partir daqui há um :id
    req.query.id = segs[1];

    // /pedidos/:id  → buscar / atualizar / cancelar
    if (segs.length === 2) return pedido(req, res);

    // /pedidos/:id/confirmar
    if (segs.length === 3 && segs[2] === "confirmar") return confirmar(req, res);

    // /pedidos/:id/historico
    if (segs.length === 3 && segs[2] === "historico") return historico(req, res);
  }

  return sendJson(res, 404, { erro: "Rota nao encontrada" });
};

