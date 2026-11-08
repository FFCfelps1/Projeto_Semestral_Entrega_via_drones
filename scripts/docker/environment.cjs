// As credenciais persistidas devem continuar valendo mesmo em um terminal
// que tenha variaveis de outro projeto. Compose prioriza o ambiente do shell.
function composeEnvironment(environment = process.env) {
  const secrets = new Set(['DB_PASSWORD', 'MYSQL_ROOT_PASSWORD', 'JWT_SECRET']);
  return Object.fromEntries(Object.entries(environment)
    .filter(([key]) => !secrets.has(key.toUpperCase())));
}

module.exports = { composeEnvironment };
