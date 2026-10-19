#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
platform="${PLATFORM:-linux/arm64}"
if [[ -z "${PLATFORM:-}" ]]; then
  arch="$(d info --format '{{.Architecture}}')"
  [[ "$arch" != x86_64 ]] || platform=linux/amd64
fi
tag="$(git -C "$ROOT" rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)"
for service in barramento_eventos contato_email cadastro_usuario gestao_de_pedidos notificacoes; do
  name="${service//_/-}"
  d buildx build --platform "$platform" --load -t "docker.io/library/skyswift-$name:$tag" -f "$ROOT/back/$service/Dockerfile" "$ROOT/back"
done
# O servico de rotas em Dart tem contexto proprio: nao depende de back/shared.
d buildx build --platform "$platform" --load -t "docker.io/library/skyswift-entrega-via-drone-dart:$tag" "$ROOT/back/entrega_via_drone_dart"
d buildx build --platform "$platform" --load -t "docker.io/library/skyswift-frontend:$tag" "$ROOT/front"
if [[ "${SAVE_TAG:-true}" == true ]]; then printf '%s\n' "$tag" > "$STATE/image-tag"; fi
echo "Imagens construídas: $tag ($platform)"
