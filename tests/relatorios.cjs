const { test } = require('node:test');
const assert = require('node:assert/strict');
const { filtrosRelatorio, selecionarPedidos, resumoPedidos, gerarCsv } = require('../back/gestao_de_pedidos/relatorios');
const agora = new Date('2026-10-25T12:00:00Z');

test('período padrão contém os últimos 30 dias no calendário de São Paulo', () => {
  const filtros = filtrosRelatorio({}, agora);
  assert.equal(filtros.inicio, '2026-09-26');
  assert.equal(filtros.fim, '2026-10-25');
  assert.equal(filtrosRelatorio({}, new Date('2026-10-25T01:00:00Z')).fim, '2026-10-24');
});
test('rejeita datas inexistentes, período invertido, excessivo e opções inválidas', () => {
  for (const query of [{inicio:'2026-02-30'}, {inicio:['2026-10-01']},
    {inicio:'2026-10-26',fim:'2026-10-25'}, {inicio:'2025-01-01'},
    {status:"entregue' OR 1=1"}, {tipo:'desconhecido'}]) {
    assert.throws(() => filtrosRelatorio(query, agora), {status:400});
  }
});
test('consulta parametrizada inclui limites UTC e filtros opcionais', async () => {
  const filtros = filtrosRelatorio({inicio:'2026-10-24',fim:'2026-10-25',status:'entregue',tipo:'padrao'}, agora);
  let chamada;
  const database = {execute:async (...args) => {chamada=args;return [[]];}};
  await selecionarPedidos(database,filtros);
  assert.deepEqual(chamada[1], [Date.parse('2026-10-24T03:00:00Z')/1000,Date.parse('2026-10-26T03:00:00Z')/1000,'entregue','padrao']);
  assert.match(chamada[0],/status = \? AND tipo = \?/);
});
test('resumo usa status atual, centavos exatos e dias sem movimento', () => {
  const filtros = filtrosRelatorio({inicio:'2026-10-23',fim:'2026-10-25'},agora);
  const rows = [
    {status:'entregue',tipo:'padrao',preco_estimado:'0.10',criado_epoch:Date.parse('2026-10-25T02:59:59Z')/1000},
    {status:'cancelado',tipo:'expressa',preco_estimado:'0.20',criado_epoch:Date.parse('2026-10-25T03:00:00Z')/1000},
    {status:'confirmado',tipo:'padrao',preco_estimado:'20.01',criado_epoch:Date.parse('2026-10-25T12:00:00Z')/1000},
  ];
  const resumo = resumoPedidos(rows,filtros,agora);
  assert.equal(resumo.totalPedidos,3);
  assert.equal(resumo.valorEstimadoTotal,'20.31');
  assert.equal(resumo.ticketMedioEstimado,'6.77');
  assert.equal(resumo.porStatus.entregue,1);
  assert.equal(resumo.porStatus.rascunho,0);
  assert.equal(resumo.porModalidade.padrao,2);
  assert.deepEqual(resumo.pedidosPorDia,[{data:'2026-10-23',quantidade:0},{data:'2026-10-24',quantidade:1},{data:'2026-10-25',quantidade:2}]);
  assert.equal(resumoPedidos([],filtros,agora).ticketMedioEstimado,'0.00');
});
test('CSV preserva acentos, aspas e quebras, neutraliza fórmulas e inclui BOM', () => {
  const csv = gerarCsv([{id:'id',item:'  =SOMA(1;2)',tipo:'padrao',status:'entregue',peso:'1.50',
    origem:'São Paulo; "Centro"\nBloco B',destino:'@comando',preco_estimado:'0.10',
    criado_epoch:Date.parse('2026-10-25T03:00:00Z')/1000,atualizado_epoch:Date.parse('2026-10-25T04:00:00Z')/1000}]);
  assert.equal(csv.charCodeAt(0),0xfeff);
  assert.ok(csv.includes('"\'  =SOMA(1;2)"'));
  assert.ok(csv.includes('"São Paulo; ""Centro""\nBloco B"'));
  assert.ok(csv.includes('"\'@comando"'));
  assert.ok(csv.includes('"0,10"'));
  assert.ok(csv.includes('2026-10-25T00:00:00-03:00'));
  assert.equal(gerarCsv([]).split('\r\n').length,2);
});
test('limites respeitam o dia de 23 horas na mudança histórica de horário de verão', async () => {
  let params;
  await selecionarPedidos({execute:async (_sql, valores) => {params=valores;return [[]];}},
    filtrosRelatorio({inicio:'2018-11-04',fim:'2018-11-04'},agora));
  assert.deepEqual(params,[Date.parse('2018-11-04T03:00:00Z')/1000,Date.parse('2018-11-05T02:00:00Z')/1000]);
});
test('média arredonda meio centavo para cima sem ponto flutuante', () => {
  const filtros = filtrosRelatorio({},agora);
  const rows = ['0.10','0.11'].map(preco_estimado => ({preco_estimado,status:'rascunho',tipo:'padrao',criado_epoch:agora.getTime()/1000}));
  assert.equal(resumoPedidos(rows,filtros,agora).ticketMedioEstimado,'0.11');
});
test('contratos HTTP: JWT, erros, resumo e download autenticado', async t => {
  const express = require('../back/gestao_de_pedidos/node_modules/express');
  const jwt = require('../back/gestao_de_pedidos/node_modules/jsonwebtoken');
  const { criarRelatoriosRouter } = require('../back/gestao_de_pedidos/routes/relatorios');
  const secret = 'segredo-exclusivo-dos-testes-unitarios';
  let indisponivel = false;
  const app = express();
  app.use('/relatorios',criarRelatoriosRouter({secret,agora:()=>agora,
    database:{execute:async()=>{if(indisponivel) throw Object.assign(new Error('offline'),{code:'TEST_OFFLINE'}); return [[]];}}}));
  app.use('/sem-configuracao',criarRelatoriosRouter({secret:''}));
  const server = await new Promise((resolve,reject) => {const s=app.listen(0,'127.0.0.1',erro=>erro?reject(erro):resolve(s));s.once('error',reject);});
  t.after(()=>{server.closeAllConnections();server.close();});
  const base = `http://127.0.0.1:${server.address().port}`;
  const valid = jwt.sign({id:1},secret,{expiresIn:'1h'});
  for(const path of ['/resumo','/exportar']) {
    for(const token of [undefined,'invalido',jwt.sign({id:1},secret,{expiresIn:-1}),jwt.sign({id:1},'outro-segredo')]) {
      const r = await fetch(`${base}/relatorios${path}`,{headers:token?{authorization:`Bearer ${token}`}:{}});
      assert.equal(r.status,401);
    }
    const r = await fetch(`${base}/relatorios${path}`,{headers:{authorization:`Bearer ${valid}`}});
    assert.equal(r.status,200); assert.equal(r.headers.get('cache-control'),'no-store');
    if(path==='/resumo') assert.equal((await r.json()).totalPedidos,0);
    else {assert.match(r.headers.get('content-type'),/text\/csv/);assert.match(r.headers.get('content-disposition'),/2026-09-26-2026-10-25\.csv/);assert.deepEqual([...new Uint8Array(await r.arrayBuffer()).slice(0,3)],[239,187,191]);}
    const bad = await fetch(`${base}/relatorios${path}?inicio=2026-02-30`,{headers:{authorization:`Bearer ${valid}`}});
    assert.equal(bad.status,400);
  }
  assert.equal((await fetch(`${base}/sem-configuracao/resumo`)).status,503);
  indisponivel = true;
  assert.equal((await fetch(`${base}/relatorios/resumo`,{headers:{authorization:`Bearer ${valid}`}})).status,503);
});
