const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');
const { filtrosRelatorio, selecionarPedidos, resumoPedidos, gerarCsv } = require('../relatorios');

function criarRelatoriosRouter({ database = pool, secret = process.env.JWT_SECRET,
  agora = () => new Date() } = {}) {
  const router = express.Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!secret) return res.status(503).json({ erro: 'Autenticação dos relatórios não configurada.' });
    const token = /^Bearer ([^\s]+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({ erro: 'Token de autenticação não informado.' });
    try { req.auth = jwt.verify(token, secret, { algorithms: ['HS256'] }); next(); }
    catch { res.status(401).json({ erro: 'Token de autenticação inválido ou expirado.' }); }
  });
  const endpoint = action => async (req, res) => {
    try {
      const filtros = filtrosRelatorio(req.query, agora());
      const rows = await selecionarPedidos(database, filtros);
      await action(res, rows, filtros);
    } catch (erro) {
      if (!erro.status) console.error('MySQL relatórios:', erro.code || erro.message);
      res.status(erro.status || 503).json({ erro: erro.status ? erro.message : 'Não foi possível consultar os relatórios. Tente novamente.' });
    }
  };
  router.get('/resumo', endpoint((res, rows, filtros) => res.json(resumoPedidos(rows, filtros, agora()))));
  router.get('/exportar', endpoint((res, rows, filtros) => {
    res.set('Content-Disposition', `attachment; filename="skyswift-pedidos-${filtros.inicio}-${filtros.fim}.csv"`);
    res.type('text/csv').send(gerarCsv(rows));
  }));
  return router;
}
module.exports = { criarRelatoriosRouter };
