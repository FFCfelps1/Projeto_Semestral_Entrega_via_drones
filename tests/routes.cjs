const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

async function exercise(providerWorks) {
  let received;
  const bus = http.createServer(async (req,res) => {
    let raw=''; for await(const chunk of req) raw+=chunk;
    if(req.url === '/eventos') received=JSON.parse(raw);
    res.setHeader('content-type','application/json'); res.end('{"success":true}');
  });
  bus.listen(0,'127.0.0.1'); await once(bus,'listening');
  const provider = http.createServer((_req,res) => {
    if(!providerWorks) {res.writeHead(503);res.end();return;}
    res.setHeader('content-type','application/json');
    res.end(JSON.stringify({routes:[{geometry:{coordinates:[[-46.63,-23.55],[-46.65,-23.56]]},distance:2000,duration:100}]}));
  });
  provider.listen(0,'127.0.0.1'); await once(provider,'listening');
  const env={...process.env,PORT:'0',BARRAMENTO_URL:`http://127.0.0.1:${bus.address().port}`,ROUTING_PROVIDERS:`http://127.0.0.1:${provider.address().port}`};
  const service = spawn(process.execPath,['-e',`const net=require('node:net'); const original=net.Server.prototype.listen; net.Server.prototype.listen=function(...args){const result=original.apply(this,args); this.once('listening',()=>console.log('TEST_PORT='+this.address().port));return result;};require('./back/entrega_via_drone/server.js');`],{env,stdio:['ignore','pipe','pipe']});
  let output=''; service.stdout.on('data',chunk=>output+=chunk); service.stderr.on('data',chunk=>output+=chunk);
  try {
    for(let i=0;i<100 && !output.includes('TEST_PORT=');i++) { if(service.exitCode!==null) throw new Error(output); await new Promise(resolve=>setTimeout(resolve,50)); }
    const port=output.match(/TEST_PORT=(\d+)/)?.[1]; assert.ok(port,output);
    const response=await fetch(`http://127.0.0.1:${port}/rota?origemLat=-23.55&origemLng=-46.63&destinoLat=-23.56&destinoLng=-46.65&pedidoId=pedido-teste`);
    const route=await response.json(); assert.equal(response.status,200); assert.equal(route.fallback,!providerWorks);
    assert.ok(route.rota.length>=2);
    for(let i=0;i<100 && !received;i++) await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(received.tipo,'RotaCalculada'); assert.equal(received.dados.pedidoId,'pedido-teste'); assert.equal(received.dados.fallback,!providerWorks);
    const live=await fetch(`http://127.0.0.1:${port}/live`); assert.equal(live.status,200);
  } finally {
    if(service.exitCode === null) { service.kill('SIGTERM'); await once(service,'exit'); }
    await Promise.all([new Promise(resolve=>bus.close(resolve)),new Promise(resolve=>provider.close(resolve))]);
  }
}
test('rota com provedor HTTP e evento com pedidoId',()=>exercise(true));
test('rota alternativa quando provedor responde 503',()=>exercise(false));
