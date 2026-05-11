const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const JWT_SECRET = process.env.JWT_SECRET || "skyswift-dev-secret";

let pool;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || process.env.HOST,
      user: process.env.DB_USER || process.env.USER,
      password: process.env.DB_PASSWORD || process.env.PASSWORD,
      database: process.env.DB_NAME || process.env.DATABASE,
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    });
  }

  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

function readRequestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      if (!req.body) return Promise.resolve({});

      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (error) {
        return Promise.reject(new Error("Body JSON invalido"));
      }
    }

    return Promise.resolve(req.body || {});
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(new Error("Body JSON invalido"));
      }
    });

    req.on("error", reject);
  });
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function criarSessao(usuario) {
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    JWT_SECRET,
    { expiresIn: "2h" },
  );

  return {
    message: "Autenticacao realizada com sucesso.",
    token,
    usuario,
  };
}

function autenticarToken(req) {
  const authHeader = req.headers.authorization || "";
  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    const error = new Error("Token de autenticacao nao informado.");
    error.statusCode = 401;
    throw error;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    const authError = new Error("Token de autenticacao invalido ou expirado.");
    authError.statusCode = 401;
    throw authError;
  }
}

function handleError(res, error, fallbackMessage) {
  if (error.message === "Body JSON invalido") {
    return sendJson(res, 400, { error: error.message });
  }

  if (error.statusCode) {
    return sendJson(res, error.statusCode, { error: error.message });
  }

  console.error(fallbackMessage, error.message);
  return sendJson(res, 500, { error: fallbackMessage });
}

module.exports = {
  autenticarToken,
  criarSessao,
  emailValido,
  handleError,
  normalizarEmail,
  query,
  readRequestBody,
  sendJson,
};
