#!/bin/bash
set -e

PORT="${PORT:-5000}"

echo "[START] Iniciando servidor na porta $PORT (Railway PostgreSQL)..."

if [ -f dist/bootstrap.cjs ]; then
  exec node dist/bootstrap.cjs
else
  exec node dist/index.cjs
fi
