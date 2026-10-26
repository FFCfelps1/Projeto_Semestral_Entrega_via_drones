const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { homedir } = require('node:os');
const mysql = require('mysql2');
const kubectlArgs = ['--kubeconfig', process.env.SKYSWIFT_KUBECONFIG || `${homedir()}/.kube/config`, '--context','docker-desktop','-n','skyswift'];
const k = args => execFileSync('kubectl',[...kubectlArgs,...args],{encoding:'utf8'});
const sql = statement => k(['exec','mysql-0','--','sh','-c',
  'MYSQL_PWD="$MYSQL_PASSWORD" mysql -N -B -h 127.0.0.1 -u "$MYSQL_USER" -D "$MYSQL_DATABASE" -e "$1"','sh',statement]).trim();

async function criarFixture(base) {
  const id = randomUUID();
  const email = `relatorios-${id}@example.test`;
  const senha = 'Relatorio123!';
  const orders = [];
  let user;
  const call = async (path, method='GET', body, token, expected=200) => {
    const response = await fetch(`${base}/api/${path}`,{method,
      headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},
      ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
    const data = await response.json();
    assert.equal(response.status,expected,`${method} ${path}: ${JSON.stringify(data)}`);
    return data;
  };
  const cleanup = () => {
    if(orders.length) {
      const ids = orders.map(order=>mysql.escape(order.id)).join(',');
      sql(`DELETE FROM notificacoes WHERE pedido_id IN (${ids}); DELETE FROM pedidos WHERE id IN (${ids});`);
    }
    if(user) sql(`DELETE FROM usuarios WHERE id=${Number(user.id)};`);
  };
  try {
    const session = await call('cadastro_usuario/auth/cadastro','POST',{nome:'Operador de Testes',email,senha},undefined,201);
    user = session.usuario;
    for(const [tipo,item] of [['padrao','Medicamentos; "frágeis"\nBloco B'],['expressa','=SOMA(1;2)'],['prioritaria','Documentos'],['padrao','Amostras']]) {
      orders.push(await call('gestao_de_pedidos/pedidos','POST',{
        item, peso:2, origem:'Instituto Mauá, São Caetano do Sul',destino:'Avenida Paulista, São Paulo',tipo,usuarioId:user.id,
      },undefined,201));
    }
    await call(`gestao_de_pedidos/pedidos/${orders[0].id}/confirmar`,'POST');
    await call(`gestao_de_pedidos/pedidos/${orders[0].id}`,'PATCH',{status:'em_rota'});
    await call(`gestao_de_pedidos/pedidos/${orders[0].id}`,'PATCH',{status:'entregue'});
    await call(`gestao_de_pedidos/pedidos/${orders[1].id}/confirmar`,'POST');
    await call(`gestao_de_pedidos/pedidos/${orders[2].id}`,'DELETE');
    return {id,email,senha,user,orders,token:session.token,call,cleanup};
  } catch(error) {cleanup();throw error;}
}
module.exports = {criarFixture,k,sql,kubectlArgs};
