#!/bin/bash
set -e

DB_PATH="${SQLITE_DB_PATH:-/data/dev.db}"
DOWNLOAD_URL="${SQLITE_DB_DOWNLOAD_URL:-}"
PORT="${PORT:-5000}"

# ── Phase 1: if the DB doesn't exist yet, serve a minimal health-check HTTP
#    server so Replit's startup probe doesn't time out while we download the
#    2.7 GB SQLite file.  The real app starts once the download is done. ──────
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

  echo "[START] Baixando banco de dados (~2.7 GB)..."
  mkdir -p "$(dirname "$DB_PATH")"

  if echo "$DOWNLOAD_URL" | grep -q "drive.google.com"; then
    python3 -m gdown "$DOWNLOAD_URL" -O "$DB_PATH" --fuzzy
  else
    curl -L --retry 3 --retry-delay 5 "$DOWNLOAD_URL" -o "$DB_PATH"
  fi

  echo "[START] Download concluído: $(du -sh "$DB_PATH" | cut -f1)"

  # Shut down the temporary health-check server
  kill "$HEALTH_PID" 2>/dev/null || true
  sleep 1
else
  echo "[START] Banco encontrado: $(du -sh "$DB_PATH" | cut -f1)"
fi

# ── Phase 2: start the real application ──────────────────────────────────────
export SQLITE_DATABASE_URL="file:$DB_PATH"
echo "[START] Iniciando servidor na porta $PORT..."
exec node dist/index.cjs
