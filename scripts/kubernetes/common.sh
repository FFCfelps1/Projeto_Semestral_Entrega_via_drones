#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTEXT=docker-desktop
NAMESPACE=skyswift
STATE="$ROOT/.kubernetes-local"
mkdir -p "$STATE"
k() { kubectl --context "$CONTEXT" --namespace "$NAMESPACE" "$@"; }
d() { docker --context desktop-linux "$@"; }
require_cluster() {
  command -v docker >/dev/null
  command -v kubectl >/dev/null
  command -v node >/dev/null
  d info --format '{{.Architecture}}' >/dev/null
  if ! kubectl config get-contexts "$CONTEXT" -o name | grep -qx "$CONTEXT"; then
    echo 'Habilite Kubernetes no Docker Desktop (kind, 1 nó, containerd). Contexto docker-desktop ausente.' >&2
    exit 1
  fi
  k get --raw=/readyz --request-timeout=10s >/dev/null
  k wait --for=condition=Ready node --all --timeout=180s
}
