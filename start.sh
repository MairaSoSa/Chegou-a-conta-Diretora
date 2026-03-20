#!/bin/bash
set -e

DB_PATH="${SQLITE_DB_PATH:-/data/dev.db}"
DOWNLOAD_URL="${SQLITE_DB_DOWNLOAD_URL:-}"

if [ ! -f "$DB_PATH" ] || [ ! -s "$DB_PATH" ]; then
  if [ -z "$DOWNLOAD_URL" ]; then
    echo "[ERRO] Banco de dados não encontrado em $DB_PATH e SQLITE_DB_DOWNLOAD_URL não definida."
    echo "[ERRO] Defina a variável SQLITE_DB_DOWNLOAD_URL com o link do Google Drive."
    exit 1
  fi

  echo "[START] Banco de dados não encontrado. Baixando de Google Drive..."
  mkdir -p "$(dirname $DB_PATH)"

  # Extrai o file ID do link do Google Drive (suporta /file/d/ID/view ou ?id=ID)
  if echo "$DOWNLOAD_URL" | grep -q "drive.google.com"; then
    FILE_ID=$(echo "$DOWNLOAD_URL" | grep -oP '(?<=/d/)[^/]+' || echo "$DOWNLOAD_URL" | grep -oP '(?<=id=)[^&]+')
    echo "[START] Google Drive ID: $FILE_ID"
    python3 -m gdown "https://drive.google.com/uc?id=$FILE_ID" -O "$DB_PATH" --fuzzy
  else
    curl -L "$DOWNLOAD_URL" -o "$DB_PATH"
  fi

  echo "[START] Download concluído: $(du -sh $DB_PATH | cut -f1)"
else
  echo "[START] Banco de dados encontrado: $(du -sh $DB_PATH | cut -f1)"
fi

export SQLITE_DATABASE_URL="file:$DB_PATH"

echo "[START] Iniciando servidor..."
exec node dist/index.cjs
