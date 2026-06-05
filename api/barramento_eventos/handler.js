const { query, sendJson, readRequestBody } = require("./_utils");

const BASE = "/api/barramento_eventos";

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

  try {
    if (segs.length === 0 || (segs.length === 1 && segs[0] === "health")) {
      return sendJson(res, 200, { status: "OK", servico: "barramento_eventos_serverless" });
    }

    if (segs[0] === "inscricoes" && req.method === "GET") {
      const rows = await query("SELECT * FROM inscricoes");
      return sendJson(res, 200, { success: true, total: rows.length, inscricoes: rows });
    }

    if (segs[0] === "inscricao" && req.method === "POST") {
      const { nome, url } = await readRequestBody(req);
      if (!nome || !url) return sendJson(res, 400, { error: "Nome e URL obrigatorios" });

      // Ajuste para SQLite (INSERT OR REPLACE)
      await query(
        "INSERT OR REPLACE INTO inscricoes (nome, url) VALUES (?, ?)",
        [nome, url]
      );
      return sendJson(res, 200, { success: true, message: `Servico ${nome} inscrito` });
    }
    if (segs[0] === "eventos" && req.method === "POST") {
      const { tipo, dados, origem } = await readRequestBody(req);
      if (!tipo) return sendJson(res, 400, { error: "Tipo do evento obrigatorio" });

      const evento = { 
        tipo, 
        dados: dados || {}, 
        origem: origem || "desconhecido", 
        timestamp: new Date().toISOString() 
      };
      
      const inscritos = await query("SELECT nome, url FROM inscricoes");
      
      const resultados = [];
      for (const s of inscritos) {
        if (s.nome === origem) continue;
        try {
          await fetch(`${s.url}/eventos/receber`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(evento),
            signal: AbortSignal.timeout(5000)
          });
          resultados.push({ servico: s.nome, status: "entregue" });
        } catch (err) {
          resultados.push({ servico: s.nome, status: "falha", erro: err.message });
        }
      }
      return sendJson(res, 200, { success: true, evento, distribuicao: resultados });
    }

    return sendJson(res, 404, { error: "Rota nao encontrada" });
  } catch (error) {
    console.error("Erro no barramento:", error.message);
    return sendJson(res, 500, { error: "Erro interno no barramento" });
  }
};

