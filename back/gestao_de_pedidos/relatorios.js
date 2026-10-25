const { DateTime } = require('luxon');

const FUSO = 'America/Sao_Paulo';
const STATUS = ['rascunho', 'confirmado', 'em_processamento', 'em_rota', 'entregue', 'cancelado'];
const TIPOS = ['padrao', 'expressa', 'prioritaria'];
const invalido = mensagem => Object.assign(new Error(mensagem), { status: 400 });

function filtrosRelatorio(query = {}, agora = new Date()) {
  const hoje = DateTime.fromJSDate(agora, { zone: FUSO }).startOf('day');
  function dia(valor, padrao, nome) {
    if (valor === undefined || valor === '') return padrao;
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw invalido(`${nome}: informe uma data no formato YYYY-MM-DD.`);
    const data = DateTime.fromISO(valor, { zone: FUSO });
    if (!data.isValid || data.toISODate() !== valor) throw invalido(`${nome}: data inválida.`);
    return data.startOf('day');
  }
  const inicio = dia(query.inicio, hoje.minus({ days: 29 }), 'inicio');
  const fim = dia(query.fim, hoje, 'fim');
  if (inicio > fim) throw invalido('A data inicial deve ser anterior ou igual à final.');
  if (fim.diff(inicio, 'days').days >= 366) throw invalido('Selecione um período de até 366 dias.');
  function opcao(valor, permitidos, nome) {
    if (valor === undefined || valor === '') return null;
    if (typeof valor !== 'string' || !permitidos.includes(valor)) throw invalido(`${nome}: opção inválida.`);
    return valor;
  }
  return { inicio: inicio.toISODate(), fim: fim.toISODate(),
    status: opcao(query.status, STATUS, 'status'), tipo: opcao(query.tipo, TIPOS, 'tipo'), fuso: FUSO };
}

async function selecionarPedidos(database, filtros) {
  // FROM_UNIXTIME e UNIX_TIMESTAMP mantêm a seleção independente do fuso da conexão MySQL.
  const inicio = DateTime.fromISO(filtros.inicio, { zone: FUSO });
  const fim = DateTime.fromISO(filtros.fim, { zone: FUSO }).plus({ days: 1 });
  const condicoes = ['criado_em >= FROM_UNIXTIME(?)', 'criado_em < FROM_UNIXTIME(?)'];
  const params = [inicio.toSeconds(), fim.toSeconds()];
  for (const [chave, coluna] of [['status', 'status'], ['tipo', 'tipo']]) {
    if (filtros[chave]) { condicoes.push(`${coluna} = ?`); params.push(filtros[chave]); }
  }
  const [rows] = await database.execute(`SELECT id,item,tipo,status,peso,origem,destino,preco_estimado,
    UNIX_TIMESTAMP(criado_em) AS criado_epoch, UNIX_TIMESTAMP(atualizado_em) AS atualizado_epoch
    FROM pedidos WHERE ${condicoes.join(' AND ')} ORDER BY criado_em DESC,id`, params);
  return rows;
}

function centavos(valor) {
  const [inteiro, fracao = ''] = String(valor).split('.');
  return BigInt(inteiro) * 100n + BigInt(fracao.padEnd(2, '0').slice(0, 2));
}
function dinheiro(valor) { return `${valor / 100n}.${String(valor % 100n).padStart(2, '0')}`; }
function resumoPedidos(rows, filtros, agora = new Date()) {
  const porStatus = Object.fromEntries(STATUS.map(status => [status, 0]));
  const porModalidade = Object.fromEntries(TIPOS.map(tipo => [tipo, 0]));
  const dias = new Map();
  for (let dia = DateTime.fromISO(filtros.inicio, { zone: FUSO }); dia.toISODate() <= filtros.fim; dia = dia.plus({ days: 1 })) dias.set(dia.toISODate(), 0);
  let total = 0n;
  for (const row of rows) {
    if (row.status in porStatus) porStatus[row.status]++;
    if (row.tipo in porModalidade) porModalidade[row.tipo]++;
    total += centavos(row.preco_estimado);
    const dia = DateTime.fromSeconds(Number(row.criado_epoch), { zone: FUSO }).toISODate();
    if (dias.has(dia)) dias.set(dia, dias.get(dia) + 1);
  }
  const quantidade = BigInt(rows.length);
  return { filtros, totalPedidos: rows.length, porStatus, porModalidade,
    valorEstimadoTotal: dinheiro(total), ticketMedioEstimado: dinheiro(quantidade ? (total + quantidade / 2n) / quantidade : 0n),
    pedidosPorDia: [...dias].map(([data, quantidade]) => ({ data, quantidade })), geradoEm: agora.toISOString() };
}

module.exports = { FUSO, STATUS, TIPOS, filtrosRelatorio, selecionarPedidos, resumoPedidos };
