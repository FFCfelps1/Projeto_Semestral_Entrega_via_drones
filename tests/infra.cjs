const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const { findBash } = require('../scripts/run-bash.cjs');
const { verifyDeployment } = require('./deployment-smoke.cjs');
const services = ['barramento_eventos', 'entrega_via_drone', 'contato_email',
  'cadastro_usuario', 'gestao_de_pedidos', 'notificacoes'];

test('launcher preserva argumentos e funciona sem WSL', () => {
  const result = spawnSync(process.execPath, ['scripts/run-bash.cjs', '-c', 'printf "%s" "$1"', 'bash', 'argumento com espacos'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'argumento com espacos');
  assert.equal(findBash({ SKYSWIFT_BASH: '/custom/bash' }, 'linux'), '/custom/bash');
  assert.equal(findBash({}, 'linux'), 'bash');
});

async function fixture(t, override = () => false) {
  const server = http.createServer((req, res) => {
    if (override(req, res)) return;
    const json = (data, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)); };
    if (req.url.endsWith('/ready')) return json({ ok: true });
    if (req.url === '/') return res.end('<div id="root"></div>');
    if (req.url === '/relatorios') { res.writeHead(308, { location: '/relatorios/' }); return res.end(); }
    if (req.url === '/relatorios/') return res.end('<base href="/relatorios/">');
    if (req.url === '/relatorios/version.json') return json({ version: '1.3.0-mobile', build_number: '3' });
    if (req.url.endsWith('/inscricoes')) return json({ total: 5, inscricoes: services.slice(1).map(nome => ({ nome, url: `http://${nome.replaceAll('_', '-')}:3000` })) });
    if (req.url.includes('/relatorios/resumo') || req.url.includes('/relatorios/exportar')) return json({ erro: 'Token ausente' }, 401);
    if (req.url.includes('inexistente')) return json({ erro: 'Nao encontrado' }, 404);
    res.writeHead(200, { 'content-type': req.url.endsWith('.wasm') ? 'application/wasm' : 'application/javascript' });
    res.end('asset');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('smoke valida a publicacao completa sem alterar dados', async t => {
  const base = await fixture(t, req => { assert.equal(req.method, 'GET'); return false; });
  assert.ok(await verifyDeployment(base) >= 25);
});
test('smoke rejeita imagem com Flutter antigo', async t => {
  const base = await fixture(t, (req, res) => {
    if (!req.url.endsWith('/version.json')) return false;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ version: '1.2.0-mobile', build_number: '2' }));
    return true;
  });
  await assert.rejects(verifyDeployment(base), /entrega Flutter atual/);
});
test('smoke rejeita API indisponivel', async t => {
  const base = await fixture(t, (req, res) => {
    if (req.url !== '/api/entrega_via_drone/ready') return false;
    res.writeHead(503); res.end('indisponivel'); return true;
  });
  await assert.rejects(verifyDeployment(base, { timeout: 0 }), /entrega_via_drone indisponivel/);
});
test('smoke rejeita fallback HTML no lugar de JavaScript Flutter', async t => {
  const base = await fixture(t, (req, res) => {
    if (!req.url.endsWith('/main.dart.js')) return false;
    res.setHeader('content-type', 'text/html'); res.end('<html>React</html>'); return true;
  });
  await assert.rejects(verifyDeployment(base), /Asset Flutter: main.dart.js/);
});
