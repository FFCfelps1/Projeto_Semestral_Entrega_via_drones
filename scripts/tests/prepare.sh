#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
for service in barramento_eventos entrega_via_drone gestao_de_pedidos; do
  npm ci --prefix "$ROOT/back/$service"
done
if command -v dart >/dev/null; then
  cd "$ROOT/back/entrega_via_drone_dart"
  dart pub get --enforce-lockfile
fi
