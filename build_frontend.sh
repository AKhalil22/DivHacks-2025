#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT/frontend"

if ! command -v npm >/dev/null 2>&1; then
  echo "[error] npm is required to build the frontend." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "[info] Installing frontend dependencies..."
  npm install --no-audit --no-fund
fi

echo "[info] Building frontend (vite build)..."
npm run build

echo "[info] Build complete. Dist output available at frontend/dist. Run ./run_backend.sh to serve on http://127.0.0.1:8000"