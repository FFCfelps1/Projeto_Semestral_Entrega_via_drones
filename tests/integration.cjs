const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const app = process.env.APP_URL || 'http://127.0.0.1:18080';
const mail = process.env.MAIL_URL || 'http://127.0.0.1:18025';
const roots = '/api/';
const run = randomUUID();
const users = [], orders = [];
let assertions = 0;
const k = args => execFileSync('kubectl', ['--context','docker-desktop','-n','skyswift',...args], {encoding:'utf8'});
const check = (condition, message) => { assert.ok(condition, message); assertions++; };
async function request(service, route, method = 'GET', body, token, expected = 200) {
  const response = await fetch(`${app}${roots}${service}${route}`, {
    method, headers: { 'content-type':'application/json', ...(token ? {authorization:`Bearer ${token}`} : {}) },
    ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal: AbortSignal.timeout(45000),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${service}${route}: ${JSON.stringify(data)}`); assertions++;
  return data;
}
async function eventually(action, timeout = 30000) {
  const until = Date.now() + timeout;
  let last;
  do { try { return await action(); } catch (error) { last = error; await new Promise(resolve => setTimeout(resolve, 1000)); } } while(Date.now() < until);
  throw last;
}
async function create(tipo, user) {
  const data = await request('gestao_de_pedidos','/pedidos','POST',{
    item:`Teste ${run}`, peso:2, origem:'Origem de teste', destino:'Destino de teste', tipo, usuarioId:user,
  },null,201);
  orders.push(data.id); return data;
}
async function subscriptions() {
  const data = await request('barramento_eventos','/inscricoes');
  check(data.total === 5, 'Cinco inscricoes');
  for (const entry of data.inscricoes) check(!entry.url.includes('localhost'), 'DNS interno nas inscricoes');
}
async function notification(id) {
  return eventually(async () => {
    const items = await request('notificacoes','/notificacoes');
    const item = items.find(n => n.pedidoId === id);
    check(item, 'Notificacao criada pelo evento do pedido'); return item;
  });
}
async function recovery(id, token, notificationId) {
  for (const name of ['gestao-de-pedidos','notificacoes','barramento-eventos','mysql']) {
    console.log(`Recuperacao: ${name}`);
    if (name === 'mysql') {
      k(['delete','pod','mysql-0']);
      k(['wait','--for=condition=Ready','pod/mysql-0','--timeout=180s']);
    } else {
      k(['rollout','restart',`deployment/${name}`]);
      k(['rollout','status',`deployment/${name}`,'--timeout=180s']);
    }
    // Ready/rollout antecedem a propagação dos EndpointSlices no nó.
    // Verifica a recuperação pela API durante três segundos consecutivos.
    let stable = 0;
    await eventually(async () => {
      check((await request('gestao_de_pedidos',`/pedidos/${id}`)).id === id, 'Pedido persistido');
      check((await request('cadastro_usuario','/auth/me','GET',undefined,token)).usuario.id, 'Usuario/JWT preservado');
      check((await request('notificacoes','/notificacoes')).some(n => n.id === notificationId && n.lida), 'Notificacao/leitura persistida');
      await subscriptions();
      stable++;
      if (stable < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('Aguardando estabilizacao das conexoes');
      }
    }, 60000);
    const novo = await create('padrao');
    await notification(novo.id);
  }
}
async function main() {
  for (const route of ['/', '/pedido', '/login', '/conta', '/notificacoes', '/rastreamento', '/precos', '/suporte']) {
    const response = await fetch(`${app}${route}`); check(response.ok && (await response.text()).includes('<div id="root">'), `SPA ${route}`);
  }
  const missing = await fetch(`${app}/api/desconhecido`); check(missing.status === 404 && missing.headers.get('content-type').includes('application/json'), 'API desconhecida nao retorna HTML');
  for (const service of ['barramento_eventos','entrega_via_drone','contato_email','cadastro_usuario','gestao_de_pedidos','notificacoes']) await request(service,'/ready');
  await subscriptions();
  const email = `k8s-${run}@example.test`;
  const session = await request('cadastro_usuario','/auth/cadastro','POST',{nome:'Teste Kubernetes',email,senha:'Teste123!'},null,201);
  users.push(session.usuario.id);
  check(session.token && session.usuario.id, 'JWT e usuario retornados');
  await request('cadastro_usuario','/auth/cadastro','POST',{nome:'Duplicado',email,senha:'Teste123!'},null,409);
  await request('cadastro_usuario','/auth/login','POST',{email,senha:'errada'},null,401);
  const login = await request('cadastro_usuario','/auth/login','POST',{email,senha:'Teste123!'});
  await request('cadastro_usuario','/auth/me','GET',undefined,null,401);
  await request('cadastro_usuario','/auth/me','GET',undefined,'invalido',401);
  await request('cadastro_usuario','/auth/me','PATCH',{nome:'Nome atualizado'},login.token);
  await request('cadastro_usuario','/auth/me/senha','PATCH',{senhaAtual:'errada',novaSenha:'Teste456!'},login.token,401);
  await request('cadastro_usuario','/auth/me/senha','PATCH',{senhaAtual:'Teste123!',novaSenha:'Teste456!'},login.token);
  await request('cadastro_usuario','/auth/login','POST',{email,senha:'Teste456!'});

  let principal, principalNotificacao;
  for (const [tipo, preco, tempo] of [['padrao','20.00',45],['expressa','27.00',30],['prioritaria','33.00',20]]) {
    const pedido = await create(tipo, session.usuario.id);
    check(pedido.precoEstimado === preco && pedido.tempoEstimado === tempo, `Preco/tempo ${tipo}`);
    const n = await notification(pedido.id);
    await request('notificacoes',`/notificacoes/${n.id}/ler`,'PATCH');
    if (tipo === 'padrao') { principal = pedido; principalNotificacao = n.id; }
  }
  await request('notificacoes','/notificacoes/ler-todas','PATCH');
  check((await request('notificacoes','/notificacoes/nao-lidas/contagem')).total === 0, 'Leitura em lote');
  await request('notificacoes','/notificacoes/999999999/ler','PATCH',undefined,null,404);
  await request('gestao_de_pedidos','/pedidos','POST',{},null,400);
  await request('gestao_de_pedidos','/pedidos','POST',{item:'x',peso:-1,origem:'x',destino:'y',tipo:'padrao'},null,400);
  await request('gestao_de_pedidos',`/pedidos/${randomUUID()}`,'GET',undefined,null,404);
  const filtered = await request('gestao_de_pedidos',`/pedidos?usuarioId=${session.usuario.id}&status=rascunho`);
  check(filtered.length === 3, 'Filtros por usuario e status');
  await request('gestao_de_pedidos',`/pedidos/${principal.id}/confirmar`,'POST');
  await request('gestao_de_pedidos',`/pedidos/${principal.id}/confirmar`,'POST',{},null,400);
  await request('gestao_de_pedidos',`/pedidos/${principal.id}`,'PATCH',{status:'em_processamento'});
  const route = await request('entrega_via_drone',`/rota?origemLat=-23.5505&origemLng=-46.6333&destinoLat=-23.56&destinoLng=-46.65&pedidoId=${principal.id}`);
  check(route.success && route.rota.length >= 2 && route.distancia > 0, 'Rota valida');
  await eventually(async () => check((await request('gestao_de_pedidos',`/pedidos/${principal.id}`)).status === 'em_rota', 'Evento RotaCalculada consumido'));
  const before = await request('gestao_de_pedidos',`/pedidos/${principal.id}/historico`);
  await request('barramento_eventos','/eventos','POST',{tipo:'RotaCalculada',dados:{pedidoId:principal.id},origem:'entrega_via_drone'});
  check((await request('gestao_de_pedidos',`/pedidos/${principal.id}/historico`)).historico.length === before.historico.length, 'Evento repetido nao duplica historico');
  await request('gestao_de_pedidos',`/pedidos/${principal.id}`,'DELETE',undefined,null,400);
  await request('gestao_de_pedidos',`/pedidos/${principal.id}`,'PATCH',{status:'confirmado'},null,400);
  await request('gestao_de_pedidos',`/pedidos/${principal.id}`,'PATCH',{status:'entregue'});
  await request('gestao_de_pedidos',`/pedidos/${principal.id}`,'PATCH',{status:'cancelado'},null,400);
  const cancelado = await create('padrao');
  await request('gestao_de_pedidos',`/pedidos/${cancelado.id}`,'DELETE');
  await request('barramento_eventos','/eventos','POST',{tipo:'RotaCalculada',dados:{pedidoId:cancelado.id}});
  check((await request('gestao_de_pedidos',`/pedidos/${cancelado.id}`)).status === 'cancelado', 'Cancelamento terminal');
  await request('entrega_via_drone','/rota','GET',undefined,null,400);
  await request('entrega_via_drone','/rota?origemLat=x&origemLng=2&destinoLat=3&destinoLng=4','GET',undefined,null,400);
  check((await request('contato_email','/email/contato')).link.startsWith('mailto:'), 'Contato mailto');
  const mailData = await request('contato_email','/email/enviar','POST',{nome:'Teste Kubernetes',email,mensagem:`Mensagem ${run}`});
  check(mailData.messageId, 'Envio SMTP confirmado');
  await eventually(async () => {
    const messages = await (await fetch(`${mail}/api/v1/messages`)).json();
    check(messages.messages.some(m => m.Snippet.includes(run)), 'Mensagem recebida no Mailpit');
  });
  await request('contato_email','/email/enviar','POST',{nome:'Teste',email:'invalido',mensagem:'x'},null,400);
  if (!process.argv.includes('--skip-recovery')) await recovery(principal.id,login.token,principalNotificacao);
  await request('cadastro_usuario','/auth/me','DELETE',undefined,login.token);
  await request('cadastro_usuario','/auth/me','GET',undefined,login.token,404);
  console.log(`APROVADO: ${assertions} verificacoes (${run})`);
}
// Limpa somente IDs criados nesta execução, diretamente no MySQL do namespace local.
async function cleanup() {
  const ids = orders.map(id => `'${id}'`).join(',');
  const userIds = users.join(',');
  const sql = `${ids ? `DELETE FROM notificacoes WHERE pedido_id IN (${ids}); DELETE FROM pedidos WHERE id IN (${ids});` : ''}${userIds ? `DELETE FROM usuarios WHERE id IN (${userIds});` : ''}`;
  if (sql) k(['exec','-i','mysql-0','--','sh','-c','MYSQL_PWD="$MYSQL_PASSWORD" mysql -h 127.0.0.1 -u "$MYSQL_USER" -D "$MYSQL_DATABASE" -e "$1"','sh',sql]);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => cleanup().catch(error => { console.error('Limpeza dos testes:',error.message); process.exitCode = 1; }));
