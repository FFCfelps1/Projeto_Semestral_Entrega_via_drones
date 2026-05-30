// Dispatcher único do microsserviço entrega_via_drone.
// Consolida rota e health numa só função serverless, para ficar abaixo do
// limite de 12 funções do plano Hobby da Vercel.
// As rotas expostas ao front continuam EXATAMENTE as mesmas.
const rota = require("./_handlers/rota");
const health = require("./_handlers/health");

const BASE = "/api/entrega_via_drone";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getSegments(req) {
  const p = req.query && req.query.path;
  if (Array.isArray(p)) return p.filter(Boolean);
  if (typeof p === "string" && p) return p.split("/").filter(Boolean);
  const url = (req.url || "").split("?")[0];
  const rest = url.startsWith(BASE) ? url.slice(BASE.length) : url;
  return rest.split("/").filter(Boolean);
}

module.exports = async function handler(req, res) {
  req.query = req.query || {};
  const path = getSegments(req).join("/");

  if (path === "rota") return rota(req, res);
  if (path === "health" || path === "") return health(req, res);

  return sendJson(res, 404, { success: false, error: "Rota nao encontrada" });
};
