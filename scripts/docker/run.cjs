const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const state = path.join(root, '.docker-local');
const credentials = path.join(state, 'secrets.env');
const [action, ...args] = process.argv.slice(2);
const actions = ['check', 'build', 'up', 'status', 'logs', 'test', 'down'];

function run(command, parameters, options = {}) {
  const result = spawnSync(command, parameters, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} terminou com codigo ${result.status}.`);
  return result;
}
function docker(parameters, options) {
  return run('docker', ['--context', 'desktop-linux', ...parameters], options);
}
function compose(parameters, options = {}) {
  return docker(['compose', '--project-name', 'skyswift', '--project-directory', root,
    '--env-file', credentials, '-f', path.join(root, 'compose.yaml'), ...parameters], options);
}
function initialize() {
  if (fs.existsSync(credentials)) return;
  // Nunca inventa outra senha para um volume que ja tem banco inicializado.
  const volumes = docker(['volume', 'ls', '--filter', 'label=com.docker.compose.project=skyswift',
    '--format', '{{.Name}}'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).stdout.trim();
  if (volumes) throw new Error('Volume SkySwift existente sem .docker-local/secrets.env. Restaure esse arquivo antes de subir.');
  fs.mkdirSync(state, { recursive: true, mode: 0o700 });
  const content = ['DB_PASSWORD', 'MYSQL_ROOT_PASSWORD', 'JWT_SECRET']
    .map(key => `${key}=${randomBytes(32).toString('hex')}`).join('\n') + '\n';
  fs.writeFileSync(credentials, content, { flag: 'wx', mode: 0o600 });
}

try {
  if (!actions.includes(action) || (args.length && !(action === 'logs' || (action === 'up' && args.length === 1 && args[0] === '--no-build')))) {
    throw new Error('Use check, build, up [--no-build], status, logs [servico], test ou down.');
  }
  if (action === 'check') {
    // Validacao de YAML/contratos nao precisa do engine nem revela credenciais.
    docker(['compose', '-f', path.join(root, 'compose.yaml'), 'config', '--quiet'], {
      env: { ...process.env, DB_PASSWORD: 'validation', MYSQL_ROOT_PASSWORD: 'validation', JWT_SECRET: 'validation' },
    });
    console.log('Compose validado. Use docker:up para construir e executar.');
  } else if (action === 'test') {
    run(process.execPath, ['tests/deployment-smoke.cjs'], {
      env: { ...process.env, APP_URL: `http://127.0.0.1:${process.env.APP_PORT || 8080}` },
    });
  } else {
    docker(['info', '--format', '{{.ServerVersion}}']);
    if (['up', 'build'].includes(action)) initialize();
    if (!fs.existsSync(credentials)) throw new Error('Execute npm run docker:up primeiro.');
    if (action === 'build') compose(['build']);
    if (action === 'up') {
      if (!args.includes('--no-build')) compose(['build']);
      compose(['up', '-d', '--no-build', '--wait', '--wait-timeout', '360', 'mysql', 'mailpit', 'barramento-eventos']);
      compose(['run', '--rm', '--no-deps', 'schema-init']);
      compose(['up', '-d', '--no-build', '--wait', '--wait-timeout', '180']);
      run(process.execPath, ['tests/deployment-smoke.cjs'], {
        env: { ...process.env, APP_URL: `http://127.0.0.1:${process.env.APP_PORT || 8080}` },
      });
      console.log(`SkySwift: http://localhost:${process.env.APP_PORT || 8080} | Flutter: /relatorios/ | Mailpit: http://localhost:${process.env.MAIL_PORT || 8025}`);
    }
    if (action === 'status') compose(['ps', '--all']);
    if (action === 'logs') compose(['logs', '--tail', '100', '--follow', ...args]);
    if (action === 'down') {
      compose(['down']);
      console.log('Containers parados. Volume MySQL e credenciais preservados.');
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
