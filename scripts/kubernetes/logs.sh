#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
name="${1:-barramento-eventos}"
case "$name" in mysql) k logs statefulset/mysql --tail=100 -f;;
  barramento-eventos|entrega-via-drone|contato-email|cadastro-usuario|gestao-de-pedidos|notificacoes|frontend|mailpit) k logs "deployment/$name" --tail=100 -f;;
  *) echo 'Nome de serviço inválido.' >&2; exit 1;; esac
