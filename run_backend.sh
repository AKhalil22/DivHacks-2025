#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# Activate venv if present
if [[ -f .venv/bin/activate ]]; then
  source .venv/bin/activate
fi

# Ensure email-validator installed (for EmailStr) if someone forgot pip install
if ! python -c "import email_validator" >/dev/null 2>&1; then
  echo "[setup] Installing backend requirements..."
  pip install -q -r backend/requirements.txt
fi

export PYTHONPATH="$PROJECT_ROOT"

# Load backend/.env if exists
if [[ -f backend/.env ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' backend/.env | xargs)
fi

PORT="${PORT:-${1:-8000}}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[error] Port $PORT is already in use. Stop the other process or choose a different port (set PORT env var)." >&2
  exit 1
fi

echo "[info] Starting backend + static frontend (if built) on http://127.0.0.1:$PORT"
exec uvicorn backend.main:create_app --factory --reload --port "$PORT"