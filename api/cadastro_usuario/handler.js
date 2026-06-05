// Dispatcher único do microsserviço cadastro_usuario.
// Consolida as antigas funções serverless (auth/cadastro, auth/login,
// auth/me, auth/me/senha, health) numa só função, para ficar abaixo do
// limite de 12 Serverless Functions do plano Hobby da Vercel.
// As rotas expostas ao front continuam EXATAMENTE as mesmas.
const cadastro = require("./_handlers/cadastro");
const login = require("./_handlers/login");
const me = require("./_handlers/me");
const senha = require("./_handlers/senha");
const health = require("./_handlers/health");
const { sendJson } = require("./_utils");

const BASE = "/api/cadastro_usuario";

// Extrai os segmentos da sub-rota a partir do catch-all da Vercel
// (req.query.path) com fallback robusto para req.url.
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
  const path = getSegments(req).join("/");

  if (path === "auth/cadastro") return cadastro(req, res);
  if (path === "auth/login") return login(req, res);
  if (path === "auth/me") return me(req, res);
  if (path === "auth/me/senha") return senha(req, res);
  if (path === "health" || path === "") return health(req, res);

  return sendJson(res, 404, { error: "Rota nao encontrada" });
};

