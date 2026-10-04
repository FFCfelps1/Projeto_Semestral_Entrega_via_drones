#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
require_cluster
if [[ "${1:-}" == --lifecycle ]]; then
  node "$ROOT/tests/lifecycle.cjs"
  exit
fi
pids=()
cleanup() { for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT
trap 'exit 1' INT TERM
k port-forward --address 127.0.0.1 service/frontend 18080:8080 > "$STATE/test-frontend.log" 2>&1 &
pids+=("$!")
k port-forward --address 127.0.0.1 service/mailpit 18025:8025 > "$STATE/test-mailpit.log" 2>&1 &
pids+=("$!")
for attempt in {1..30}; do
  if curl -sf http://127.0.0.1:18080/live >/dev/null && curl -sf http://127.0.0.1:18025/livez >/dev/null; then break; fi
  sleep 1
done
APP_URL=http://127.0.0.1:18080 MAIL_URL=http://127.0.0.1:18025 node "$ROOT/tests/integration.cjs" "$@"
