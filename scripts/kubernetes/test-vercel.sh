#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
require_cluster
pids=()
cleanup() { for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT
trap 'exit 1' INT TERM
port_forward service/mysql 13307:3306 > "$STATE/vercel-mysql.log" 2>&1 &
pids+=("$!")
port_forward service/mailpit 11025:1025 > "$STATE/vercel-smtp.log" 2>&1 &
pids+=("$!")
for attempt in {1..30}; do
  for pid in "${pids[@]}"; do
    kill -0 "$pid" 2>/dev/null || { echo 'Falha ao abrir as portas de teste Vercel; confira 13307/11025.' >&2; exit 1; }
  done
  if node -e 'const net=require("node:net"); const socket=net.connect(13307,"127.0.0.1",()=>{socket.end();process.exit(0)});socket.on("error",()=>process.exit(1));' 2>/dev/null; then break; fi
  sleep 1
done
TEST_DB_PORT=13307 TEST_SMTP_PORT=11025 node --test --test-force-exit "$ROOT/tests/vercel.cjs"
