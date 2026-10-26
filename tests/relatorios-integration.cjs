const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {criarFixture,k,sql,kubectlArgs} = require('./relatorios-fixture.cjs');
const base = 'http://127.0.0.1:18081';
let forward, fixture, checks=0;
const requestHttp = async (url, options={}) => {
  const response = await globalThis.fetch(url, {...options,
    headers:{...options.headers, connection:'close'}, signal:options.signal || AbortSignal.timeout(15000)});
  // Consome inclusive os assets grandes antes de abrir outro stream no port-forward.
  return new Response(await response.arrayBuffer(), {status:response.status,headers:response.headers});
};
const check = (condition,message)=>{assert.ok(condition,message);checks++;};
async function eventually(action) {
  const until=Date.now()+60000; let last;
  do {try{return await action();}catch(error){last=error;await new Promise(resolve=>setTimeout(resolve,500));}}while(Date.now()<until);
  throw last;
}
async function encaminhar() {
  forward?.kill();
  forward=spawn('kubectl',[...kubectlArgs,'port-forward','--address=127.0.0.1','service/frontend','18081:8080'],{stdio:'ignore'});
  await eventually(async()=>check((await requestHttp(`${base}/live`,{signal:AbortSignal.timeout(3000)})).ok,'Nginx acessível'));
}
async function main() {
  await encaminhar();
  const page=await requestHttp(`${base}/relatorios/`);
  check(page.ok && (await page.text()).includes('<base href="/relatorios/">'),'Flutter servido no subdiretório');
  check((await requestHttp(`${base}/relatorios/main.dart.js`)).headers.get('content-type').includes('javascript'),'JavaScript Flutter com MIME correto');
  check((await requestHttp(`${base}/relatorios/arquivo-inexistente.js`)).status===404,'Arquivo Flutter ausente não retorna HTML da SPA');
  check((await requestHttp(`${base}/relatorios`,{redirect:'manual'})).status===308,'Redirecionamento para barra final');
  fixture=await criarFixture(base);
  const [a,b,c,d]=fixture.orders;
  // Um dia isolado e limites exatos: 02:59:59Z pertence ao dia anterior em São Paulo.
  const datas=['2020-02-29 02:59:59','2020-02-29 03:00:00','2020-03-01 02:59:59','2020-03-01 03:00:00'];
  for(const [i,order] of fixture.orders.entries()) sql(`SET time_zone='+00:00'; UPDATE pedidos SET criado_em='${datas[i]}',preco_estimado=${i===1?'0.10':i===2?'0.11':'20.00'} WHERE id='${order.id}';`);
  const query='inicio=2020-02-29&fim=2020-02-29';
  const request = async (suffix='',token=fixture.token) => {
    const response=await requestHttp(`${base}/api/gestao_de_pedidos/relatorios/resumo?${query}${suffix}`,{headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
    assert.equal(response.status,200);return response.json();
  };
  const original=await request();
  check(original.totalPedidos===2,'Limites de datas incluem exatamente dois pedidos');
  check(original.valorEstimadoTotal==='0.21' && original.ticketMedioEstimado==='0.11','Valores e média exatos no MySQL real');
  check(original.porStatus.confirmado===1 && original.porStatus.cancelado===1,'Classificação pelo status atual');
  check((await request('&status=confirmado&tipo=expressa')).totalPedidos===1,'Filtros combinados');
  check((await request('&status=entregue')).totalPedidos===0,'Seleção vazia');
  const response=await requestHttp(`${base}/api/gestao_de_pedidos/relatorios/exportar?${query}`,{headers:{authorization:`Bearer ${fixture.token}`}});
  const bytes=new Uint8Array(await response.arrayBuffer());
  check(response.ok && response.headers.get('content-type').includes('text/csv'),'CSV autenticado pelo Nginx');
  check(bytes[0]===239 && bytes[1]===187 && bytes[2]===191,'BOM preservado no proxy');
  const csv=Buffer.from(bytes).toString('utf8');
  check(csv.includes(b.id)&&csv.includes(c.id)&&!csv.includes(a.id)&&!csv.includes(d.id),'CSV respeita exatamente os mesmos filtros');
  check(csv.includes("'=SOMA")&&csv.includes('"0,10"'),'Fórmulas neutralizadas e valores preservados');
  for(const path of ['resumo','exportar']) {
    check((await requestHttp(`${base}/api/gestao_de_pedidos/relatorios/${path}`)).status===401,'API protegida sem token');
    check((await requestHttp(`${base}/api/gestao_de_pedidos/relatorios/${path}`,{headers:{authorization:'Bearer invalido'}})).status===401,'API protegida com token inválido');
  }
  if(!process.argv.includes('--skip-recovery')) {
    for(const name of ['frontend','gestao-de-pedidos','mysql']) {
      console.log(`Recuperação dos relatórios: ${name}`);
      if(name==='frontend'){forward.kill();await new Promise(resolve=>setTimeout(resolve,500));}
      if(name==='mysql'){k(['delete','pod','mysql-0']);k(['wait','--for=condition=Ready','pod/mysql-0','--timeout=180s']);}
      else {k(['rollout','restart',`deployment/${name}`]);k(['rollout','status',`deployment/${name}`,'--timeout=180s']);}
      if(name==='frontend') await encaminhar();
      await eventually(async()=>{
        const atual=await request();
        check(atual.totalPedidos===original.totalPedidos && atual.valorEstimadoTotal===original.valorEstimadoTotal,'Indicadores preservados após reinício');
      });
    }
  }
  console.log(`APROVADO relatórios: ${checks} verificações`);
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{
  try{fixture?.cleanup();}finally{forward?.kill();}
});
