#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
require_cluster
printf 'Docker: '
d version --format '{{.Server.Version}}'
k version --client
k get nodes -o wide
kubectl kustomize "$ROOT/infra/kubernetes/infrastructure" >/dev/null
kubectl kustomize "$ROOT/infra/kubernetes/application" >/dev/null
echo 'Ambiente local e manifests verificados.'
