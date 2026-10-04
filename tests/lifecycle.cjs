const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomUUID, createHash } = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const id = randomUUID();
const k = args => execFileSync('kubectl', ['--context', 'docker-desktop', '-n', 'skyswift', ...args], { encoding: 'utf8' });
const sql = statement => k(['exec', 'mysql-0', '--', 'sh', '-c',
  'MYSQL_PWD="$MYSQL_PASSWORD" mysql -N -B -h 127.0.0.1 -u "$MYSQL_USER" -D "$MYSQL_DATABASE" -e "$1"', 'sh', statement]).trim();
function snapshot() {
  return {
    secret: createHash('sha256').update(k(['get', 'secret', 'skyswift-secrets', '-o', 'jsonpath={.data}'])).digest('hex'),
    pvc: k(['get', 'pvc', 'data-mysql-0', '-o', 'jsonpath={.metadata.uid}']),
    data: sql(`SELECT item,status,status_historico FROM pedidos WHERE id='${id}'; SELECT titulo,lida FROM notificacoes WHERE pedido_id='${id}'; SELECT nome,email FROM usuarios WHERE email='lifecycle-${id}@example.test';`),
  };
}
function up() {
  execFileSync('bash', [path.join(root, 'scripts/kubernetes/up.sh'), '--no-build'], { stdio: 'inherit' });
}
let created = false;
try {
  sql(`INSERT INTO usuarios(nome,email,senha) VALUES ('Lifecycle','lifecycle-${id}@example.test','fixture');
    INSERT INTO pedidos(id,item,peso,origem,destino,tipo,usuario_id,status,preco_estimado,tempo_estimado,status_historico)
    VALUES ('${id}','Lifecycle',2,'Origem','Destino','padrao',LAST_INSERT_ID(),'confirmado',20,45,JSON_ARRAY(JSON_OBJECT('status','confirmado','momento','2026-10-04T00:00:00.000Z')));
    INSERT INTO notificacoes(titulo,mensagem,pedido_id,evento_tipo,lida) VALUES ('Lifecycle','Persistencia','${id}','PEDIDO_CRIADO',true);`);
  created = true;
  const before = snapshot();
  for (let round = 1; round <= 2; round++) {
    console.log(`Reexecucao de k8s:up: ${round}`);
    up();
    assert.deepEqual(snapshot(), before, 'Dados, PVC e credenciais preservados ao reaplicar');
  }
  execFileSync('bash', [path.join(root, 'scripts/kubernetes/down.sh')], { stdio: 'inherit' });
  assert.equal(k(['get', 'pvc', 'data-mysql-0', '-o', 'jsonpath={.metadata.uid}']), before.pvc);
  up();
  assert.deepEqual(snapshot(), before, 'Dados, PVC e credenciais preservados no ciclo de parada/subida');
  console.log('APROVADO: duas reexecucoes e um ciclo de parada/subida, preservando usuarios, pedidos, notificacoes, PVC e credenciais.');
} finally {
  if (created) sql(`DELETE FROM notificacoes WHERE pedido_id='${id}'; DELETE FROM pedidos WHERE id='${id}'; DELETE FROM usuarios WHERE email='lifecycle-${id}@example.test';`);
}
