const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const services = ['barramento_eventos', 'entrega_via_drone', 'contato_email',
  'cadastro_usuario', 'gestao_de_pedidos', 'notificacoes'];

// Somente leitura: pode ser usado tanto no Compose quanto no Kubernetes.
async function verifyDeployment(base, { timeout = 60000, interval = 1000 } = {}) {
  let checks = 0;
  const check = (condition, message) => { assert.ok(condition, message); checks++; };
  const request = (route, options = {}) => fetch(`${base}${route}`, {
    ...options, signal: AbortSignal.timeout(5000),
  });
  const until = Date.now() + timeout;
  while (true) {
    try {
      for (const service of services) {
        const response = await request(`/api/${service}/ready`);
        await response.text();
        assert.equal(response.status, 200, `${service} indisponivel`);
      }
      break;
    } catch (error) {
      if (Date.now() >= until) throw error;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  checks += services.length;
  const react = await request('/');
  check(react.ok && (await react.text()).includes('<div id="root">'), 'React publicado');
  const redirect = await request('/relatorios', { redirect: 'manual' });
  await redirect.text();
  check(redirect.status === 308 && new URL(redirect.headers.get('location'), base).pathname === '/relatorios/', 'Redirecionamento Flutter');
  const flutter = await request('/relatorios/');
  check(flutter.ok && (await flutter.text()).includes('<base href="/relatorios/">'), 'Flutter publicado com base correta');
  for (const asset of ['flutter_bootstrap.js', 'main.dart.js', 'canvaskit/canvaskit.wasm']) {
    const response = await request(`/relatorios/${asset}`);
    const bytes = await response.arrayBuffer();
    check(response.ok && bytes.byteLength > 0 && !response.headers.get('content-type')?.includes('text/html'), `Asset Flutter: ${asset}`);
  }
  const versionResponse = await request('/relatorios/version.json');
  check(versionResponse.ok, 'Versao Flutter publicada');
  const version = await versionResponse.json();
  const pubspec = readFileSync(path.join(__dirname, '../front_mobile/pubspec.yaml'), 'utf8');
  const [, expectedVersion, expectedBuild] = pubspec.match(/^version:\s*([^+\s]+)\+(\d+)/m);
  check(version.version === expectedVersion && version.build_number === expectedBuild, 'Imagem contem a entrega Flutter atual');
  const missingAsset = await request('/relatorios/arquivo-inexistente.js');
  await missingAsset.text();
  check(missingAsset.status === 404, 'Asset ausente nao retorna HTML do React');
  const subscriptionsResponse = await request('/api/barramento_eventos/inscricoes');
  check(subscriptionsResponse.ok, 'Barramento acessivel');
  const subscriptions = await subscriptionsResponse.json();
  check(subscriptions.total === 5 && subscriptions.inscricoes.length === 5, 'Cinco consumidores inscritos');
  for (const service of services.slice(1)) {
    const entry = subscriptions.inscricoes.find(entry => entry.nome === service);
    check(entry && new URL(entry.url).hostname === service.replaceAll('_', '-'), `DNS interno: ${service}`);
  }
  for (const endpoint of ['resumo', 'exportar']) {
    const response = await request(`/api/gestao_de_pedidos/relatorios/${endpoint}`);
    await response.text();
    check(response.status === 401, `JWT exigido: ${endpoint}`);
  }
  const missingApi = await request('/api/servico-inexistente');
  check(missingApi.status === 404 && missingApi.headers.get('content-type')?.includes('application/json'), 'API desconhecida retorna JSON 404');
  await missingApi.text();
  return checks;
}

if (require.main === module) {
  verifyDeployment(process.env.APP_URL || 'http://127.0.0.1:8080')
    .then(checks => console.log(`APROVADO: ${checks} verificacoes da implantacao final (React, Flutter, seis APIs, barramento e JWT).`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { verifyDeployment };
