const express = require('express');
const { randomUUID } = require('node:crypto');
const axios = require('axios');
const { pool, formatarPedido, buscarPedido, transaction } = require('../database');
const { validarCamposObrigatorios, responderErro } = require('../middleware/validarPedido');
const router = express.Router();
const BARRAMENTO_URL = process.env.BARRAMENTO_URL || 'http://localhost:3001';
const ORDEM = ['rascunho', 'confirmado', 'em_processamento', 'em_rota', 'entregue'];
const TERMINAIS = ['entregue', 'cancelado'];

async function emitirEvento(tipo, dados) {
  try {
    await axios.post(`${BARRAMENTO_URL}/eventos`, { tipo, dados, origem: 'gestao_de_pedidos' }, { timeout: 5000 });
  } catch (error) {
    // A gravação do pedido não depende da disponibilidade do barramento.
    console.warn(`Evento ${tipo} indisponivel: ${error.message}`);
  }
}
function error(status, message) { return Object.assign(new Error(message), { status }); }
function fail(res, err) {
  if (err.status) return responderErro(res, err.status, err.message);
  console.error('MySQL pedidos:', err.code || err.message);
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return responderErro(res, 400, 'Usuario nao encontrado');
  return responderErro(res, 503, 'Banco de dados indisponivel');
}
const endpoint = action => async (req, res) => { try { await action(req, res); } catch (err) { fail(res, err); } };

// A leitura com bloqueio e a atualização de status/histórico compartilham a transação.
async function mudar(id, mutate) {
  return transaction(async connection => {
    const pedido = await buscarPedido(id, connection, true);
    if (!pedido) throw error(404, 'Pedido não encontrado');
    const changes = mutate(pedido);
    if (!changes) return pedido;
    const historico = [...pedido.statusHistorico, { status: changes.status, momento: new Date().toISOString() }];
    await connection.query('UPDATE pedidos SET status = ?, observacoes = ?, status_historico = ? WHERE id = ?',
      [changes.status, changes.observacoes ?? pedido.observacoes, JSON.stringify(historico), id]);
    return buscarPedido(id, connection);
  });
}

router.get('/health', endpoint(async (_req, res) => {
  await pool.query('SELECT id FROM pedidos LIMIT 1');
  res.json({ status: 'ok', servico: 'gestao_pedidos' });
}));
router.post('/pedidos', validarCamposObrigatorios, endpoint(async (req, res) => {
  const { item, peso, origem, destino, tipo, observacoes, usuarioId } = req.body;
  const multiplicador = { padrao: 1, expressa: 1.35, prioritaria: 1.65 }[tipo];
  const preco = ((10 + Number(peso) * 5) * multiplicador).toFixed(2);
  const tempo = { padrao: 45, expressa: 30, prioritaria: 20 }[tipo];
  const id = randomUUID();
  const historico = [{ status: 'rascunho', momento: new Date().toISOString() }];
  await pool.query(`INSERT INTO pedidos (id,item,peso,origem,destino,tipo,observacoes,usuario_id,status,preco_estimado,tempo_estimado,status_historico)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [id,item,Number(peso),origem,destino,tipo,observacoes || '',usuarioId || null,'rascunho',preco,tempo,JSON.stringify(historico)]);
  const pedido = await buscarPedido(id);
  await emitirEvento('PEDIDO_CRIADO', pedido);
  res.status(201).json(pedido);
}));
router.get('/pedidos', endpoint(async (req, res) => {
  const conditions = [], params = [];
  for (const [parameter, column] of [['usuarioId', 'usuario_id'], ['status', 'status']]) {
    if (req.query[parameter]) { conditions.push(`${column} = ?`); params.push(req.query[parameter]); }
  }
  const [rows] = await pool.query(`SELECT * FROM pedidos${conditions.length ? ' WHERE '+conditions.join(' AND ') : ''} ORDER BY criado_em DESC`, params);
  res.json(rows.map(formatarPedido));
}));
router.get('/pedidos/:id', endpoint(async (req, res) => {
  const pedido = await buscarPedido(req.params.id);
  if (!pedido) throw error(404, 'Pedido não encontrado');
  res.json(pedido);
}));
router.post('/pedidos/:id/confirmar', endpoint(async (req, res) => {
  const pedido = await mudar(req.params.id, current => {
    if (current.status !== 'rascunho') throw error(400, 'Apenas pedidos em rascunho podem ser confirmados');
    return { status: 'confirmado' };
  });
  await emitirEvento('PEDIDO_CONFIRMADO', pedido);
  res.json(pedido);
}));
router.patch('/pedidos/:id', endpoint(async (req, res) => {
  const { status, observacoes } = req.body || {};
  if (![...ORDEM, 'cancelado'].includes(status)) throw error(400, 'Status inválido');
  const pedido = await mudar(req.params.id, current => {
    if (TERMINAIS.includes(current.status)) throw error(400, 'Transição de status inválida');
    if (status === 'cancelado') {
      if (current.status === 'em_rota') throw error(400, 'Não é possível cancelar um pedido que já está em rota ou entregue');
    } else if (ORDEM.indexOf(status) <= ORDEM.indexOf(current.status)) throw error(400, 'Transição de status inválida');
    return { status, observacoes };
  });
  await emitirEvento(status === 'cancelado' ? 'PEDIDO_CANCELADO' : 'PEDIDO_ATUALIZADO', pedido);
  res.json(pedido);
}));
router.delete('/pedidos/:id', endpoint(async (req, res) => {
  const pedido = await mudar(req.params.id, current => {
    if (['em_rota', 'entregue'].includes(current.status)) throw error(400, 'Não é possível cancelar um pedido que já está em rota ou entregue');
    return current.status === 'cancelado' ? null : { status: 'cancelado' };
  });
  await emitirEvento('PEDIDO_CANCELADO', pedido);
  res.json({ mensagem: 'Pedido cancelado com sucesso', pedido });
}));
router.get('/pedidos/:id/historico', endpoint(async (req, res) => {
  const pedido = await buscarPedido(req.params.id);
  if (!pedido) throw error(404, 'Pedido não encontrado');
  res.json({ pedidoId: pedido.id, item: pedido.item, statusAtual: pedido.status, historico: pedido.statusHistorico });
}));
router.post('/eventos/receber', endpoint(async (req, res) => {
  const { tipo } = req.body || {};
  if (!tipo) throw error(400, 'Evento invalido');
  res.json({ recebido: true });
}));
module.exports = router;
