const mysql = require('mysql2/promise'); 
let pool; 
let sqliteDb;

function getPool() { 
  if (process.env.DB_TYPE === 'sqlite') {
    if (!sqliteDb) {
      const sqlite3 = require('sqlite3').verbose();
      const path = require('path');
      const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/database.sqlite' : path.join(process.cwd(), 'database.sqlite');
      sqliteDb = new sqlite3.Database(dbPath);
      sqliteDb.serialize(() => {
        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS notificacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            mensagem TEXT NOT NULL,
            pedido_id TEXT,
            evento_tipo TEXT NOT NULL,
            lida BOOLEAN NOT NULL DEFAULT 0,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            lida_em DATETIME
          )
        `);
      });
    }
    return { type: 'sqlite', db: sqliteDb };
  }

  if (!pool) { 
    const host = process.env.DB_HOST || process.env.HOST; 
    if (!host) { console.warn('DB_HOST não configurado. Notificações usará MOCK.'); return null; } 
    const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined; 
    pool = mysql.createPool({ host, user: process.env.DB_USER || process.env.USER, password: process.env.DB_PASSWORD || process.env.PASSWORD, database: process.env.DB_NAME || process.env.DATABASE, port: Number(process.env.DB_PORT || 3306), ssl, waitForConnections: true, connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10) }); 
  } 
  return pool; 
} 

const mockNotificacoes = []; 

async function query(sql, params = []) { 
  const dbConnection = getPool(); 
  if (!dbConnection) { 
    const lowerSql = sql.toLowerCase(); 
    if (lowerSql.includes('select * from notificacoes') && lowerSql.includes('where id = ?')) { const id = params[0]; const n = mockNotificacoes.find(item => item.id == id); return n ? [n] : []; } 
    if (lowerSql.includes('select count(*) as total from notificacoes')) { const total = mockNotificacoes.filter(n => !n.lida).length; return [{ total }]; } 
    if (lowerSql.includes('select * from notificacoes')) { return [...mockNotificacoes].sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)); } 
    if (lowerSql.includes('insert into notificacoes')) { const [titulo, mensagem, pedidoId, eventoTipo] = params; const id = mockNotificacoes.length + 1; const novo = { id, titulo, mensagem, pedido_id: pedidoId, evento_tipo: eventoTipo, lida: false, criado_em: new Date().toISOString(), lida_em: null }; mockNotificacoes.push(novo); return { insertId: id }; } 
    if (lowerSql.includes('update notificacoes set lida = true')) { let count = 0; if (lowerSql.includes('where id = ?')) { const id = params[0]; const n = mockNotificacoes.find(item => item.id == id); if (n) { n.lida = true; n.lida_em = new Date().toISOString(); count = 1; } } else { mockNotificacoes.forEach(n => { if (!n.lida) { n.lida = true; n.lida_em = new Date().toISOString(); count++; } }); } return { affectedRows: count }; } 
    return []; 
  } 

  if (dbConnection.type === 'sqlite') {
    return new Promise((resolve, reject) => {
      let adjustedSql = sql.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");
      if (adjustedSql.toLowerCase().includes('false')) adjustedSql = adjustedSql.replace(/false/gi, '0');
      if (adjustedSql.toLowerCase().includes('true')) adjustedSql = adjustedSql.replace(/true/gi, '1');

      dbConnection.db.all(adjustedSql, params, function(err, rows) {
        if (err) return reject(err);
        if (adjustedSql.toLowerCase().includes('insert') || adjustedSql.toLowerCase().includes('update')) {
          resolve({ affectedRows: this?.changes || 0, insertId: this?.lastID });
        } else {
          resolve(rows);
        }
      });
    });
  }

  const [rows] = await dbConnection.query(sql, params); 
  return rows; 
} 

function sendJson(res, statusCode, payload) { res.statusCode = statusCode; res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(payload)); } 

function readRequestBody(req) { if (req.body !== undefined) { if (typeof req.body === 'string') { if (!req.body) return Promise.resolve({}); return Promise.resolve(JSON.parse(req.body)); } return Promise.resolve(req.body || {}); } return new Promise((resolve, reject) => { const chunks = []; req.on('data', (chunk) => chunks.push(chunk)); req.on('end', () => { if (!chunks.length) { resolve({}); return; } try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (error) { reject(error); } }); req.on('error', reject); }); } 

function formatarNotificacao(row) { return { id: row.id, titulo: row.titulo, mensagem: row.mensagem, pedidoId: row.pedido_id, eventoTipo: row.evento_tipo, lida: Boolean(row.lida), criadoEm: row.criado_em, lidaEm: row.lida_em, }; } 

const BASE = '/api/notificacoes'; 

function getSegments(req) { const p = req.query && req.query.path; if (Array.isArray(p)) return p.filter(Boolean); if (typeof p === 'string' && p) return p.split('/').filter(Boolean); const url = (req.url || '').split('?')[0]; const rest = url.startsWith(BASE) ? url.slice(BASE.length) : url; return rest.split('/').filter(Boolean); } 

async function criarNotificacaoPedidoCriado(dados) { const pedidoId = dados.id || dados.pedidoId; if (!pedidoId) return null; const titulo = 'Pedido criado'; const mensagem = 'Pedido ' + pedidoId + ' criado com sucesso.'; const result = await query('INSERT INTO notificacoes (titulo, mensagem, pedido_id, evento_tipo, lida) VALUES (?, ?, ?, ?, false)', [titulo, mensagem, pedidoId, 'PEDIDO_CRIADO']); const rows = await query('SELECT * FROM notificacoes WHERE id = ? LIMIT 1', [result.insertId]); return formatarNotificacao(rows[0]); } 

async function autoRegistrar(req) {
  const barramentoUrl = process.env.BARRAMENTO_URL;
  if (!barramentoUrl) return;

  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const minhaUrl = `${protocol}://${host}${BASE}`;

  try {
    await fetch(`${barramentoUrl}/inscricao`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nome: "notificacoes", url: minhaUrl }),
      signal: AbortSignal.timeout(2000)
    });
  } catch (e) {
    // Falha silenciosa no auto-registro
  }
}

module.exports = async function handler(req, res) { 
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.statusCode = 204; return res.end(); } 

  req.query = req.query || {}; 
  const segs = getSegments(req); 

  // Tenta o auto-registro em cada chamada (best-effort para serverless)
  if (req.method === 'GET' && segs[0] === 'notificacoes') {
    await autoRegistrar(req);
  }

  try { 
 if (segs.length === 0 || (segs.length === 1 && segs[0] === 'health')) { await query('SELECT 1'); return sendJson(res, 200, { status: 'ok', servico: 'notificacoes' }); } if (segs[0] === 'eventos' && segs[1] === 'receber') { if (req.method !== 'POST') return sendJson(res, 405, { erro: 'Metodo nao permitido' }); const { tipo, dados, payload } = await readRequestBody(req); const eventoDados = dados || payload || {}; if (tipo === 'PEDIDO_CRIADO') { const notificacao = await criarNotificacaoPedidoCriado(eventoDados); return sendJson(res, 201, { recebido: true, notificacao }); } return sendJson(res, 200, { recebido: true, ignorado: true }); } if (segs[0] === 'notificacoes') { if (segs.length === 1 && req.method === 'GET') { const rows = await query('SELECT * FROM notificacoes ORDER BY criado_em DESC'); return sendJson(res, 200, rows.map(formatarNotificacao)); } if (segs.length === 3 && segs[1] === 'nao-lidas' && segs[2] === 'contagem' && req.method === 'GET') { const rows = await query('SELECT COUNT(*) AS total FROM notificacoes WHERE lida = false'); return sendJson(res, 200, { total: Number(rows[0].total) }); } if (segs.length === 2 && segs[1] === 'ler-todas' && req.method === 'PATCH') { const result = await query('UPDATE notificacoes SET lida = true, lida_em = COALESCE(lida_em, CURRENT_TIMESTAMP) WHERE lida = false'); return sendJson(res, 200, { mensagem: 'Notificacoes marcadas como lidas.', atualizadas: result.affectedRows, }); } if (segs.length === 3 && segs[2] === 'ler' && req.method === 'PATCH') { const result = await query('UPDATE notificacoes SET lida = true, lida_em = COALESCE(lida_em, CURRENT_TIMESTAMP) WHERE id = ?', [segs[1]]); if (result.affectedRows === 0) { return sendJson(res, 404, { erro: 'Notificacao nao encontrada.' }); } const rows = await query('SELECT * FROM notificacoes WHERE id = ? LIMIT 1', [segs[1]]); return sendJson(res, 200, formatarNotificacao(rows[0])); } } return sendJson(res, 404, { erro: 'Rota nao encontrada' }); } catch (error) { console.error('Erro no microsservico de notificacoes:', error.message); return sendJson(res, 500, { erro: 'Erro no microsservico de notificacoes.' }); } };
