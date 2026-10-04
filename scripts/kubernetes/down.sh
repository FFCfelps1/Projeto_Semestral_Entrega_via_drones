#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
require_cluster
if [[ "${1:-}" == --purge-data ]]; then
  k delete namespace "$NAMESPACE" --ignore-not-found
  rm -f "$STATE/secrets.env" "$STATE/image-tag"
  echo 'Namespace e dados locais do SkySwift removidos.'
else
  [[ $# == 0 ]] || { echo 'Opção inválida; use --purge-data para excluir dados.' >&2; exit 1; }
  k delete deployment barramento-eventos entrega-via-drone contato-email cadastro-usuario gestao-de-pedidos notificacoes frontend mailpit --ignore-not-found
  k delete statefulset mysql --ignore-not-found
  k delete job schema-init --ignore-not-found
  k wait --for=delete pod --all --timeout=180s
  echo 'Workloads parados. Namespace, Services, Secrets e PVC preservados.'
fi
