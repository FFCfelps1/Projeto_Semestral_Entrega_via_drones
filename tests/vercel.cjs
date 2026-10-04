const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');

test('APIs Vercel com MySQL, barramento e SMTP local', {timeout:60000}, async () => {
  const secret = JSON.parse(execFileSync('kubectl',['--context','docker-desktop','-n','skyswift','get','secret','skyswift-secrets','-o','json'],{encoding:'utf8'}));
  const password=Buffer.from(secret.data.DB_PASSWORD,'base64').toString();
  Object.assign(process.env,{DB_HOST:'127.0.0.1',DB_PORT:process.env.TEST_DB_PORT || '13306',DB_USER:'skyswift',DB_NAME:'skyswift',DB_PASSWORD:password,
    JWT_SECRET:Buffer.from(secret.data.JWT_SECRET,'base64').toString(),SMTP_HOST:'127.0.0.1',SMTP_PORT:process.env.TEST_SMTP_PORT || '11025',SMTP_AUTH_REQUIRED:'false',SMTP_FROM:'vercel@example.test',CONTACT_RECIPIENT:'contato@example.test'});
  delete process.env.DB_TYPE;
  const names=['barramento_eventos','cadastro_usuario','gestao_de_pedidos','notificacoes','entrega_via_drone','contato_email'];
  const handlers=Object.fromEntries(names.map(name=>[name,require(`../api/${name}/handler.js`)]));
  const server=http.createServer(async (request,response)=>{
    const url=new URL(request.url,'http://localhost'); const segments=url.pathname.split('/').filter(Boolean);
    const handler=handlers[segments[1]];
    if(!handler){response.writeHead(404);response.end('{}');return;}
    let raw='';for await(const chunk of request) raw+=chunk;
    const req={method:request.method,url:request.url,headers:request.headers,query:{...Object.fromEntries(url.searchParams),path:segments.slice(2)},body:raw ? JSON.parse(raw) : {}};
    try {await handler(req,response);} catch(error){response.statusCode=500;response.end(JSON.stringify({error:error.message}));}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  process.env.BARRAMENTO_URL=base+'/api/barramento_eventos';
  process.env.ROUTING_PROVIDERS='http://127.0.0.1:1';
  // O provedor é configurado antes de carregar a função de rota.
  delete require.cache[require.resolve('../api/entrega_via_drone/_handlers/rota.js')];
  delete require.cache[require.resolve('../api/entrega_via_drone/handler.js')];
  handlers.entrega_via_drone=require('../api/entrega_via_drone/handler.js');
  async function call(name,route,method='GET',body,token,status=200){
    const res=await fetch(`${base}/api/${name}${route}`,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
    const data=await res.json();assert.equal(res.status,status,JSON.stringify(data));return data;
  }
  const connection=await mysql.createConnection({host:'127.0.0.1',port:Number(process.env.DB_PORT),user:'skyswift',password,database:'skyswift'});
  const [previousSubscriptions]=await connection.query('SELECT nome,url FROM inscricoes WHERE nome IN (?,?)',['gestao_de_pedidos','notificacoes']);
  const run=randomUUID();let user,id;
  try {
    for(const name of names) await call(name,'/health');
    for(const name of ['gestao_de_pedidos','notificacoes']) {
      await call('barramento_eventos','/inscricao','POST',{nome:name,url:`${base}/api/${name}`});
      await call('barramento_eventos','/inscricao','POST',{nome:name,url:`${base}/api/${name}`});
    }
    const subscriptions=await call('barramento_eventos','/inscricoes');
    assert.equal(subscriptions.inscricoes.filter(s=>['gestao_de_pedidos','notificacoes'].includes(s.nome)).length,2);
    const email=`vercel-${run}@example.test`;
    const session=await call('cadastro_usuario','/auth/cadastro','POST',{nome:'Teste Vercel',email,senha:'Teste123!'},null,201);user=session.usuario.id;
    await call('cadastro_usuario','/auth/login','POST',{email,senha:'Teste123!'});
    await call('cadastro_usuario','/auth/me','GET',undefined,session.token);
    const pedido=await call('gestao_de_pedidos','/pedidos','POST',{item:run,peso:2,origem:'Origem',destino:'Destino',tipo:'prioritaria',usuarioId:user},null,201);id=pedido.id;
    assert.equal(String(pedido.precoEstimado),'33.00');
    const ns=await call('notificacoes','/notificacoes');const n=ns.find(n=>n.pedidoId===id);assert.ok(n,'Evento enviado antes da resposta serverless');
    await call('notificacoes',`/notificacoes/${n.id}/ler`,'PATCH');
    await call('gestao_de_pedidos',`/pedidos/${id}/confirmar`,'POST');
    const rota=await call('entrega_via_drone',`/rota?origemLat=1&origemLng=2&destinoLat=3&destinoLng=4&pedidoId=${id}`);assert.equal(rota.fallback,true);
    assert.equal((await call('gestao_de_pedidos',`/pedidos/${id}`)).status,'em_rota');
    const history=await call('gestao_de_pedidos',`/pedidos/${id}/historico`);
    await call('barramento_eventos','/eventos','POST',{tipo:'RotaCalculada',dados:{pedidoId:id},origem:'entrega_via_drone'});
    assert.equal((await call('gestao_de_pedidos',`/pedidos/${id}/historico`)).historico.length,history.historico.length);
    assert.ok((await call('contato_email','/email/contato')).link.startsWith('mailto:'));
    assert.ok((await call('contato_email','/email/enviar','POST',{nome:'Vercel',email,mensagem:run})).messageId);
    await call('cadastro_usuario','/auth/me','DELETE',undefined,session.token);
    console.log('Vercel: seis handlers, inscricoes idempotentes, JWT, pedidos, notificacoes, rota e SMTP aprovados.');
  } finally {
    if(id){await connection.query('DELETE FROM notificacoes WHERE pedido_id=?',[id]);await connection.query('DELETE FROM pedidos WHERE id=?',[id]);}
    if(user) await connection.query('DELETE FROM usuarios WHERE id=?',[user]);
    await connection.query('DELETE FROM inscricoes WHERE nome IN (?,?)',['gestao_de_pedidos','notificacoes']);
    for(const entry of previousSubscriptions) await connection.query('INSERT INTO inscricoes(nome,url) VALUES (?,?)',[entry.nome,entry.url]);
    await connection.end();await new Promise(resolve=>server.close(resolve));
  }
});
