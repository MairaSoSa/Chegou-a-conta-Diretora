#!/bin/bash
set -e

DB_PATH="${SQLITE_DB_PATH:-/data/dev.db}"
DOWNLOAD_URL="${SQLITE_DB_DOWNLOAD_URL:-https://drive.google.com/file/d/120kC7oUyZe9WsjGbinMDrAIW2ozcwc99/view?usp=sharing}"
PORT="${PORT:-5000}"
FORCE_DOWNLOAD="${FORCE_DOWNLOAD:-false}"

export DB_PATH

ensure_parent_dir() {
  mkdir -p "$(dirname "$DB_PATH")"
}

start_status_server() {
  local status="$1"
  local message="$2"

  START_STATUS="$status" START_MESSAGE="$message" PORT="$PORT" exec python3 - <<'PYEOF'
import http.server
import json
import os
import socketserver

PORT = int(os.environ.get("PORT", "5000"))
STATUS = os.environ.get("START_STATUS", "starting")
MESSAGE = os.environ.get("START_MESSAGE", "")

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({"ok": True, "status": STATUS, "message": MESSAGE}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
PYEOF
}

fail_with_status() {
  local status="$1"
  local message="$2"

  if [ -n "${HEALTH_PID:-}" ]; then
    kill "$HEALTH_PID" 2>/dev/null || true
    wait "$HEALTH_PID" 2>/dev/null || true
    unset HEALTH_PID
  fi

  echo "[ERRO] $message"
  start_status_server "$status" "$message"
}

copy_bundled_db_if_available() {
  if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ]; then
    return 0
  fi

  local bundled=""
  if [ -n "${SQLITE_DB_BUNDLED_PATH:-}" ] && [ -f "$SQLITE_DB_BUNDLED_PATH" ] && [ -s "$SQLITE_DB_BUNDLED_PATH" ]; then
    bundled="$SQLITE_DB_BUNDLED_PATH"
  elif [ -f "/app/dev.db" ] && [ -s "/app/dev.db" ]; then
    bundled="/app/dev.db"
  else
    # Fallback para backup com nome versionado presente no repositório.
    bundled=$(ls -1 /app/dev.db.backup-* 2>/dev/null | head -n 1 || true)
  fi

  if [ -n "$bundled" ] && [ -f "$bundled" ] && [ -s "$bundled" ]; then
    echo "[START] Banco embarcado encontrado em $bundled; copiando para $DB_PATH..."
    ensure_parent_dir
    cp "$bundled" "$DB_PATH"
  fi
}

validate_db() {
  python3 - <<'PYEOF'
import os
import sqlite3
import sys

db_path = os.environ.get("DB_PATH")
if not db_path or not os.path.exists(db_path) or os.path.getsize(db_path) == 0:
    sys.exit(1)

try:
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    cur.execute("PRAGMA quick_check")
    if cur.fetchone()[0] != "ok":
        sys.exit(2)

    cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='censo_escolar'")
    if cur.fetchone()[0] == 0:
        sys.exit(3)

    cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='indicadores_educacionais'")
    if cur.fetchone()[0] == 0:
        sys.exit(4)

    cur.execute("SELECT COUNT(*) FROM censo_escolar")
    if cur.fetchone()[0] == 0:
        sys.exit(5)

    sys.exit(0)
except Exception:
    sys.exit(9)
finally:
    try:
        con.close()
    except Exception:
        pass
PYEOF
}

# ── Phase 1: download DB if needed ───────────────────────────────────────────
# Force re-download if FORCE_DOWNLOAD=true (useful when the Drive file was updated)
if [ "$FORCE_DOWNLOAD" = "true" ] && [ -n "$DOWNLOAD_URL" ]; then
  echo "[START] FORCE_DOWNLOAD=true — removendo banco antigo e baixando novamente..."
  rm -f "$DB_PATH"
fi

copy_bundled_db_if_available

if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ]; then
  if validate_db; then
    echo "[START] Banco válido encontrado em $DB_PATH: $(du -sh "$DB_PATH" | cut -f1)"
  else
    echo "[START] Banco em $DB_PATH está inválido/incompleto; removendo para reprocessar..."
    rm -f "$DB_PATH"
  fi
fi

if [ ! -f "$DB_PATH" ] || [ ! -s "$DB_PATH" ]; then
  if [ -z "$DOWNLOAD_URL" ]; then
    echo "[WARN] Banco não encontrado/validado em $DB_PATH."
    echo "[WARN] SQLITE_DB_DOWNLOAD_URL/SQLITE_DB_BUNDLED_PATH ausente; mantendo serviço de status para healthcheck."
    start_status_server "database_not_configured" "Defina SQLITE_DB_DOWNLOAD_URL ou SQLITE_DB_BUNDLED_PATH"
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
  ensure_parent_dir

  if echo "$DOWNLOAD_URL" | grep -q "drive.google.com"; then
    if ! python3 -m gdown "$DOWNLOAD_URL" -O "$DB_PATH" --fuzzy; then
      rm -f "$DB_PATH"
      fail_with_status "database_download_failed" "Falha ao baixar banco do Google Drive. O arquivo pode ter excedido a cota de downloads."
    fi
  else
    if ! curl -L --retry 3 --retry-delay 5 "$DOWNLOAD_URL" -o "$DB_PATH"; then
      rm -f "$DB_PATH"
      fail_with_status "database_download_failed" "Falha ao baixar banco de dados pela URL configurada."
    fi
  fi

  if validate_db; then
    echo "[START] Download concluído e validado: $(du -sh "$DB_PATH" | cut -f1)"
  else
    kill "$HEALTH_PID" 2>/dev/null || true
    rm -f "$DB_PATH"
    fail_with_status "database_invalid" "Download concluído, mas o arquivo não é um banco SQLite válido com dados do censo."
  fi

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
