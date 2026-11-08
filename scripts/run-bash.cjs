const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

// No Windows, bash no PATH pode ser o inicializador do WSL sem distribuicao.
function findBash(env = process.env, platform = process.platform) {
  if (env.SKYSWIFT_BASH) return env.SKYSWIFT_BASH;
  if (platform !== 'win32') return 'bash';
  const roots = [env.ProgramFiles, env.ProgramW6432, env['ProgramFiles(x86)'],
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs')].filter(Boolean);
  const candidates = roots.map(root => path.join(root, 'Git', 'bin', 'bash.exe'));
  for (const entry of (env.PATH || env.Path || '').split(path.delimiter)) {
    if (entry) candidates.push(path.resolve(entry, '..', 'bin', 'bash.exe'));
  }
  const bash = candidates.find(existsSync);
  if (!bash) throw new Error('Instale Git for Windows com Git Bash ou defina SKYSWIFT_BASH com o caminho de bash.exe.');
  return bash;
}

if (require.main === module) {
  try {
    const bash = findBash();
    const env = { ...process.env };
    if (process.platform === 'win32') {
      // Os scripts e testes que iniciam outro bash tambem devem usar Git Bash.
      const key = Object.keys(env).find(key => key.toLowerCase() === 'path') || 'PATH';
      env[key] = `${path.dirname(bash)}${path.delimiter}${env[key] || ''}`;
    }
    const child = spawn(bash, process.argv.slice(2), { stdio: 'inherit', env });
    child.on('error', error => { console.error(error.message); process.exitCode = 1; });
    child.on('exit', code => { process.exitCode = code ?? 1; });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { findBash };
