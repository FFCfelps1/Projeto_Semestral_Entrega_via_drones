// Dispatcher único do microsserviço contato_email.
// Consolida email/contato, email/enviar e health numa só função serverless,
// para ficar abaixo do limite de 12 funções do plano Hobby da Vercel.
// As rotas expostas ao front continuam EXATAMENTE as mesmas.
const contato = require("./_handlers/contato");
const enviar = require("./_handlers/enviar");
const health = require("./_handlers/health");

const BASE = "/api/contato_email";

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

  if (path === "email/contato") return contato(req, res);
  if (path === "email/enviar") return enviar(req, res);
  if (path === "health" || path === "") return health(req, res);

  return sendJson(res, 404, { success: false, error: "Rota nao encontrada" });
};
