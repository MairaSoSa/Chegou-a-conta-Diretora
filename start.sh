#!/bin/bash
set -e

DB_PATH="${SQLITE_DB_PATH:-/data/dev.db}"
DOWNLOAD_URL="${SQLITE_DB_DOWNLOAD_URL:-}"
PORT="${PORT:-5000}"
FORCE_DOWNLOAD="${FORCE_DOWNLOAD:-false}"

# ── Phase 1: download DB if needed ───────────────────────────────────────────
# Force re-download if FORCE_DOWNLOAD=true (useful when the Drive file was updated)
if [ "$FORCE_DOWNLOAD" = "true" ] && [ -n "$DOWNLOAD_URL" ]; then
  echo "[START] FORCE_DOWNLOAD=true — removendo banco antigo e baixando novamente..."
  rm -f "$DB_PATH"
fi

if [ ! -f "$DB_PATH" ] || [ ! -s "$DB_PATH" ]; then
  if [ -z "$DOWNLOAD_URL" ]; then
    echo "[ERRO] Banco não encontrado em $DB_PATH e SQLITE_DB_DOWNLOAD_URL não definida."
    exit 1
  fi

  echo "[START] Iniciando servidor de espera na porta $PORT..."
  python3 - <<'PYEOF' &
import http.server, socketserver, os, sys

PORT = int(os.environ.get("PORT", 5000))

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = b'{"ok":true,"status":"loading_database"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *args): pass

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
PYEOF
  HEALTH_PID=$!
  echo "[START] Servidor de espera rodando (PID $HEALTH_PID)"

  echo "[START] Baixando banco de dados (~10 GB)..."
  mkdir -p "$(dirname "$DB_PATH")"

  if echo "$DOWNLOAD_URL" | grep -q "drive.google.com"; then
    python3 -m gdown "$DOWNLOAD_URL" -O "$DB_PATH" --fuzzy
  else
    curl -L --retry 3 --retry-delay 5 "$DOWNLOAD_URL" -o "$DB_PATH"
  fi

  echo "[START] Download concluído: $(du -sh "$DB_PATH" | cut -f1)"

  kill "$HEALTH_PID" 2>/dev/null || true
  sleep 1
else
  echo "[START] Banco encontrado: $(du -sh "$DB_PATH" | cut -f1)"
fi

# ── Phase 2: start the real application ──────────────────────────────────────
export SQLITE_DATABASE_URL="file:$DB_PATH"
echo "[START] Iniciando servidor na porta $PORT..."
if [ -f dist/bootstrap.cjs ]; then
  exec node dist/bootstrap.cjs
else
  exec node dist/index.cjs
fi
