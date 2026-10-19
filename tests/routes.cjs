const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');

// O mesmo contrato vale para as duas implementações do serviço de rotas.
// Cada uma informa a porta escolhida (PORT=0) em uma linha do log.
const implementations = {
  node: {
    command: process.execPath,
    args: ['-e',`const net=require('node:net'); const original=net.Server.prototype.listen; net.Server.prototype.listen=function(...args){const result=original.apply(this,args); this.once('listening',()=>console.log('TEST_PORT='+this.address().port));return result;};require('./back/entrega_via_drone/server.js');`],
    cwd: undefined, port: /TEST_PORT=(\d+)/,
  },
  dart: {
    command: 'dart', args: ['bin/server.dart'],
    cwd: path.join(__dirname, '..', 'back', 'entrega_via_drone_dart'), port: /rodando na porta (\d+)/,
  },
};
// Sem o SDK Dart instalado, os testes da versão Dart são ignorados.
const dartAvailable = spawnSync('dart', ['--version']).status === 0;

async function exercise(implementation, providerWorks) {
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
  const { command, args, cwd, port: portPattern } = implementations[implementation];
  const service = spawn(command,args,{cwd,env,stdio:['ignore','pipe','pipe']});
  let output=''; service.stdout.on('data',chunk=>output+=chunk); service.stderr.on('data',chunk=>output+=chunk);
  try {
    // A versão Dart compila na primeira execução; por isso a espera vai até 30 s.
    for(let i=0;i<600 && !portPattern.test(output);i++) { if(service.exitCode!==null) throw new Error(output); await new Promise(resolve=>setTimeout(resolve,50)); }
    const port=output.match(portPattern)?.[1]; assert.ok(port,output);
    const response=await fetch(`http://127.0.0.1:${port}/rota?origemLat=-23.55&origemLng=-46.63&destinoLat=-23.56&destinoLng=-46.65&pedidoId=pedido-teste`);
    const route=await response.json(); assert.equal(response.status,200); assert.equal(route.fallback,!providerWorks);
    assert.ok(route.rota.length>=2);
    for(let i=0;i<100 && !received;i++) await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(received.tipo,'RotaCalculada'); assert.equal(received.origem,'entrega_via_drone');
    assert.equal(received.dados.pedidoId,'pedido-teste'); assert.equal(received.dados.fallback,!providerWorks);
    const invalid=await fetch(`http://127.0.0.1:${port}/rota?origemLat=x&origemLng=1&destinoLat=1&destinoLng=1`);
    assert.equal(invalid.status,400); assert.deepEqual(await invalid.json(),{erro:'Coordenadas inválidas'});
    const live=await fetch(`http://127.0.0.1:${port}/live`); assert.equal(live.status,200);
  } finally {
    if(service.exitCode === null) { service.kill('SIGTERM'); await once(service,'exit'); }
    await Promise.all([new Promise(resolve=>bus.close(resolve)),new Promise(resolve=>provider.close(resolve))]);
  }
}
for (const implementation of Object.keys(implementations)) {
  const skip = implementation === 'dart' && !dartAvailable && 'SDK Dart indisponivel';
  test(`${implementation}: rota com provedor HTTP e evento com pedidoId`,{skip,timeout:60000},()=>exercise(implementation,true));
  test(`${implementation}: rota alternativa quando provedor responde 503`,{skip,timeout:60000},()=>exercise(implementation,false));
}
