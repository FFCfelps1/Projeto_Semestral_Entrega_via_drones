const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'skyswift',
  port: Number(process.env.DB_PORT || 3306),
  connectTimeout: 3000,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
});

function formatarPedido(row) {
  if (!row) return null;
  return {
    id: row.id, item: row.item, peso: Number(row.peso), origem: row.origem,
    destino: row.destino, tipo: row.tipo, observacoes: row.observacoes || '',
    usuarioId: row.usuario_id, status: row.status,
    precoEstimado: String(row.preco_estimado), tempoEstimado: row.tempo_estimado,
    statusHistorico: typeof row.status_historico === 'string' ? JSON.parse(row.status_historico) : row.status_historico,
    criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
  };
}

async function buscarPedido(id, connection = pool, lock = false) {
  const [rows] = await connection.query(`SELECT * FROM pedidos WHERE id = ?${lock ? ' FOR UPDATE' : ''}`, [id]);
  return formatarPedido(rows[0]);
}

async function transaction(action) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await action(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { pool, formatarPedido, buscarPedido, transaction };
