#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
require_cluster
pids=()
cleanup() { for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT
trap 'exit 0' INT TERM
k port-forward --address 127.0.0.1 service/frontend "${APP_PORT:-8080}:8080" &
pids+=("$!")
k port-forward --address 127.0.0.1 service/mailpit "${MAIL_PORT:-8025}:8025" &
pids+=("$!")
echo "Aplicação: http://localhost:${APP_PORT:-8080} | E-mails: http://localhost:${MAIL_PORT:-8025} (Ctrl+C encerra)"
# Compatível com Bash 3.2 do macOS; detecta falha de qualquer encaminhamento.
while kill -0 "${pids[0]}" 2>/dev/null && kill -0 "${pids[1]}" 2>/dev/null; do sleep 1; done
exit 1
