#!/usr/bin/env bash
# Emit sdks/python/sdk-docs.json from Auth docstrings via griffe.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/.venv/bin/python" ]]; then
  PYTHON="$ROOT/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON="$(command -v python3)"
else
  echo "error: need .venv/bin/python or python3 on PATH" >&2
  exit 1
fi

"$PYTHON" docs/generate_sdk_docs.py
