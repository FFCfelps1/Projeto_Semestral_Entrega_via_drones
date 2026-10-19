const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

// Sobe o barramento em uma porta livre e informa a porta escolhida no log.
async function startBus() {
  const service = spawn(process.execPath,['-e',`const net=require('node:net'); const original=net.Server.prototype.listen; net.Server.prototype.listen=function(...args){const result=original.apply(this,args); this.once('listening',()=>console.log('TEST_PORT='+this.address().port));return result;};require('./back/barramento_eventos/server.js');`],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  let output=''; service.stdout.on('data',chunk=>output+=chunk); service.stderr.on('data',chunk=>output+=chunk);
  for(let i=0;i<100 && !output.includes('TEST_PORT=');i++) { if(service.exitCode!==null) throw new Error(output); await new Promise(resolve=>setTimeout(resolve,50)); }
  const port=output.match(/TEST_PORT=(\d+)/)?.[1]; assert.ok(port,output);
  return { service, url:`http://127.0.0.1:${port}` };
}

test('ids dos eventos continuam unicos depois do limite do historico',{timeout:60000},async () => {
  const { service, url } = await startBus();
  try {
    // O historico guarda 1000 eventos; o id antigo (tamanho + 1) repetia a partir daqui.
    const ids = [];
    for (let i = 0; i < 1003; i++) {
      const response = await fetch(`${url}/eventos`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tipo:'Teste',dados:{i},origem:'teste'})});
      assert.equal(response.status,200);
      ids.push((await response.json()).evento.id);
    }
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids.slice(-3)) assert.match(id,/^[0-9a-f-]{36}$/);
    const history = await (await fetch(`${url}/eventos?limite=1`)).json();
    assert.equal(history.eventos[0].id, ids.at(-1));
  } finally {
    service.kill('SIGTERM'); await once(service,'exit');
  }
});
