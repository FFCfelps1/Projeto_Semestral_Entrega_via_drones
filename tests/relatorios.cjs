const { test } = require('node:test');
const assert = require('node:assert/strict');
const { filtrosRelatorio, selecionarPedidos, resumoPedidos } = require('../back/gestao_de_pedidos/relatorios');
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
