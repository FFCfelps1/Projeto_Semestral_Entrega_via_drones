function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { success: false, error: "Metodo nao permitido" });
  }

  return sendJson(res, 200, {
    status: "OK",
    message: "Microsservico contato_email em modo serverless",
  });
};
