#!/bin/bash
set -e

DB_PATH="${SQLITE_DB_PATH:-/data/dev.db}"
DOWNLOAD_URL="${SQLITE_DB_DOWNLOAD_URL:-}"

if [ ! -f "$DB_PATH" ] || [ ! -s "$DB_PATH" ]; then
  if [ -z "$DOWNLOAD_URL" ]; then
    echo "[ERRO] Banco não encontrado em $DB_PATH e SQLITE_DB_DOWNLOAD_URL não definida."
    exit 1
  fi

  echo "[START] Baixando banco de dados (~2.7 GB)..."
  mkdir -p "$(dirname "$DB_PATH")"

  if echo "$DOWNLOAD_URL" | grep -q "drive.google.com"; then
    python3 -m gdown "$DOWNLOAD_URL" -O "$DB_PATH" --fuzzy
  else
    curl -L --retry 3 --retry-delay 5 "$DOWNLOAD_URL" -o "$DB_PATH"
  fi

  echo "[START] Download concluído: $(du -sh "$DB_PATH" | cut -f1)"
else
  echo "[START] Banco encontrado: $(du -sh "$DB_PATH" | cut -f1)"
fi

export SQLITE_DATABASE_URL="file:$DB_PATH"

echo "[START] Iniciando servidor na porta ${PORT:-5000}..."
exec node dist/index.cjs
