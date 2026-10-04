// Ciclo de vida comum; as dependências de cada serviço continuam independentes.
function createRuntime({ app, name, port, databaseReady = async () => {}, closeDatabase = async () => {} }) {
  const bus = process.env.BARRAMENTO_URL || 'http://localhost:3001';
  const serviceUrl = process.env.SERVICE_URL || `http://localhost:${port}`;
  let registered = name === 'barramento_eventos';
  let lastRegistration = 0;
  let timer;
  let stopping = false;
  let server;

  async function register() {
    if (stopping) return;
    try {
      const response = await fetch(`${bus}/inscricao`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nome: name, url: serviceUrl }),
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.arrayBuffer();
      if (!registered) console.log(`${name}: inscrito no barramento`);
      registered = true;
      lastRegistration = Date.now();
    } catch (error) {
      registered = false;
      console.warn(`${name}: inscricao indisponivel: ${error.message}`);
    } finally {
      if (!stopping) timer = setTimeout(register, 5000);
    }
  }

  app.get('/live', (_req, res) => res.status(stopping ? 503 : 200).json({ service: name, alive: !stopping }));
  app.get('/ready', async (_req, res) => {
    try {
      if (stopping) throw new Error('Encerrando');
      if (name !== 'barramento_eventos' && (!registered || Date.now() - lastRegistration > 15000)) {
        throw new Error('Inscricao no barramento indisponivel');
      }
      await databaseReady();
      res.json({ service: name, ready: true });
    } catch (error) {
      res.status(503).json({ service: name, ready: false, error: error.message });
    }
  });

  function listen() {
    server = app.listen(port, '0.0.0.0', () => {
      console.log(`${name} rodando na porta ${port}`);
      if (name !== 'barramento_eventos') void register();
    });
    return server;
  }

  async function shutdown() {
    if (stopping) return;
    stopping = true;
    clearTimeout(timer);
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    try {
      if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await closeDatabase();
      clearTimeout(deadline);
      process.exit(0);
    } catch (error) {
      console.error('Falha ao encerrar:', error.message);
      process.exit(1);
    }
  }
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return { listen };
}

module.exports = { createRuntime };
