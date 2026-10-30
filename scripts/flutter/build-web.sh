#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
command -v flutter >/dev/null || { echo 'Instale Flutter (Dart >= 3.13.1) e adicione flutter ao PATH para compilar relatórios.' >&2; exit 1; }
cd "$ROOT/front_mobile"
flutter pub get --enforce-lockfile
# No Git Bash (Windows), impede que /relatorios/ vire C:/Program Files/Git/relatorios/.
MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' flutter build web --release --base-href /relatorios/ --no-web-resources-cdn \
  --dart-define="API_BASE_URL=${API_BASE_URL:-}"
