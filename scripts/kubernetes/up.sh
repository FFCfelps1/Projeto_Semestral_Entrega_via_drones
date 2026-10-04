#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
require_cluster
if [[ "${1:-}" != --no-build ]]; then "$ROOT/scripts/kubernetes/build.sh"; fi
[[ -s "$STATE/image-tag" ]] || { echo 'Execute k8s:build antes de --no-build.' >&2; exit 1; }
tag="$(cat "$STATE/image-tag")"
# Verifica todas as imagens antes de alterar recursos da aplicação.
for name in barramento-eventos entrega-via-drone contato-email cadastro-usuario gestao-de-pedidos notificacoes frontend; do
  d image inspect "docker.io/library/skyswift-$name:$tag" --format '{{.Architecture}}'
done
k apply -f "$ROOT/infra/kubernetes/namespace.yaml"
if ! k get secret skyswift-secrets >/dev/null 2>&1; then
  # Recupera também o mesmo segredo ao reutilizar um PVC após remoção dos workloads.
  if [[ ! -f "$STATE/secrets.env" ]]; then
    (umask 077; node -e 'const c=require("node:crypto"); for(const k of ["DB_PASSWORD","MYSQL_ROOT_PASSWORD","JWT_SECRET"]) console.log(k+"="+c.randomBytes(32).toString("hex"))' > "$STATE/secrets.env")
  fi
  k create secret generic skyswift-secrets --from-env-file="$STATE/secrets.env" --dry-run=client -o yaml | k apply -f -
fi
k create configmap skyswift-schema --from-file="schema.sql=$ROOT/deploy_cloud.sql" --dry-run=client -o yaml | k apply -f -
k apply -k "$ROOT/infra/kubernetes/infrastructure"
k rollout status statefulset/mysql --timeout=360s
# Jobs possuem template imutável. O Job transitório aplica o esquema em cada subida.
k delete job schema-init --ignore-not-found --wait=true
k apply -f "$ROOT/infra/kubernetes/infrastructure/schema-job.yaml"
if ! k wait --for=condition=complete job/schema-init --timeout=180s; then
  k logs job/schema-init >&2
  exit 1
fi
render="$(mktemp -d "$STATE/render.XXXXXX")"
trap 'rm -rf "$render"' EXIT
cp "$ROOT/infra/kubernetes/application/"*.yaml "$render/"
node - "$render/kustomization.yaml" "$tag" <<'JS'
const fs = require('node:fs');
const [file, tag] = process.argv.slice(2);
let content = fs.readFileSync(file, 'utf8') + 'images:\n';
for (const name of ['barramento-eventos','entrega-via-drone','contato-email','cadastro-usuario','gestao-de-pedidos','notificacoes','frontend']) {
  content += `  - name: docker.io/library/skyswift-${name}\n    newTag: ${tag}\n`;
}
fs.writeFileSync(file, content);
JS
k apply -k "$render"
for name in mailpit barramento-eventos entrega-via-drone contato-email cadastro-usuario gestao-de-pedidos notificacoes frontend; do
  if ! k rollout status "deployment/$name" --timeout=180s; then
    k get pods
    k get events --sort-by=.lastTimestamp
    exit 1
  fi
done
echo 'SkySwift pronto. Execute npm run k8s:access para acessar localhost:8080 e localhost:8025.'
