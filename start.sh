#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Entrypoint do serviço chegou-a-conta
#
# Fluxo:
#   1. Se /data/dev.db já existe → inicia a aplicação diretamente
#   2. Se não existe:
#      a. Sobe servidor de status HTTP (healthcheck durante o download)
#      b. Instala gdown se necessário
#      c. Baixa o banco SQLite do Google Drive (~10 GB)
#      d. Valida integridade (PRAGMA quick_check + tabela censo_escolar)
#      e. Derruba o servidor de status
#      f. Inicia a aplicação Node.js
# ─────────────────────────────────────────────────────────────────────────────

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Carrega variaveis do .env automaticamente quando presente.
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$PROJECT_ROOT/.env"
  set +a
  echo "[START] Variaveis de ambiente carregadas de .env"
fi

PORT="${PORT:-5000}"
DB_PATH="/data/dev.db"
DOWNLOAD_URL="${SQLITE_DB_DOWNLOAD_URL:-https://drive.google.com/file/d/1Dtp04JGoLqB9kIzgRnXi36BRtdH23BK4/view?usp=drive_link}"

# ── Função: iniciar aplicação Node.js ────────────────────────────────────────
start_app() {
  if [ -f scripts/sync-mec-contatos.mjs ]; then
    echo "[START] Sincronizando bloco MEC (Composição) no painel..."
    node scripts/sync-mec-contatos.mjs || echo "[WARN] Falha na sincronização MEC; iniciando com último cache local."
  fi

  echo "[START] Iniciando servidor Node.js na porta $PORT..."
  if [ -f dist/bootstrap.cjs ]; then
    exec node dist/bootstrap.cjs
  else
    exec node dist/index.cjs
  fi
}

# ── Banco já existe → iniciar direto ─────────────────────────────────────────
if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ]; then
  TAMANHO=$(du -sh "$DB_PATH" 2>/dev/null | cut -f1)
  echo "[START] Banco SQLite encontrado em $DB_PATH ($TAMANHO). Iniciando aplicação..."
  start_app
fi

# ── Banco não existe → download necessário ───────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║      Chegou a Conta, Diretora! — Download do Banco  ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""
echo "  [info] Banco SQLite não encontrado em $DB_PATH"
echo "  [info] Iniciando download do Google Drive..."
echo "  [info] URL: $DOWNLOAD_URL"
echo ""

# ── 1. Servidor de status HTTP (healthcheck durante o download) ───────────────
echo "  [status] Subindo servidor de status na porta $PORT (aguarde o download)..."
node -e "
const http = require('http');
const port = process.env.PORT || 5000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Aguarde: banco de dados sendo baixado (~10 GB). Isso pode levar alguns minutos.\n');
});
server.listen(port, () => {
  console.log('[status] Servidor de status ouvindo na porta ' + port);
});
process.on('SIGTERM', () => server.close());
" &
STATUS_PID=$!
echo "  [status] PID do servidor de status: $STATUS_PID"
echo ""

# ── Função: encerrar servidor de status ──────────────────────────────────────
cleanup_status() {
  if kill -0 "$STATUS_PID" 2>/dev/null; then
    echo "  [status] Encerrando servidor de status (PID $STATUS_PID)..."
    kill "$STATUS_PID" 2>/dev/null || true
    wait "$STATUS_PID" 2>/dev/null || true
  fi
}

# Garantir limpeza em caso de erro
trap 'cleanup_status' EXIT ERR

# ── 2. Garantir que gdown está instalado ─────────────────────────────────────
if ! command -v gdown &>/dev/null; then
  echo "  [info] gdown não encontrado. Instalando via pip..."
  python3 -m pip install --quiet --user gdown
  export PATH="$PATH:$(python3 -m site --user-base)/bin"
fi

if ! command -v gdown &>/dev/null; then
  echo "  [erro] Não foi possível instalar o gdown."
  echo "         Verifique se python3 e pip estão disponíveis."
  exit 1
fi

echo "  [info] gdown: $(gdown --version 2>/dev/null || echo 'instalado')"
echo ""

# ── 3. Criar diretório de destino e baixar o banco ───────────────────────────
mkdir -p "$(dirname "$DB_PATH")"

echo "  [download] Iniciando download... (pode demorar — o banco tem ~10 GB)"
echo "             Não interrompa o processo."
echo ""

if gdown "$DOWNLOAD_URL" -O "$DB_PATH" --fuzzy; then
  echo ""
  echo "  [ok] Download concluído: $(du -sh "$DB_PATH" | cut -f1)"
else
  rm -f "$DB_PATH"
  echo ""
  echo "  [erro] Falha no download do banco SQLite."
  echo ""
  echo "  Verifique:"
  echo "    1. O arquivo está compartilhado como 'Qualquer pessoa com o link pode ver'"
  echo "    2. A variável SQLITE_DB_DOWNLOAD_URL está correta"
  echo "    3. O arquivo não excedeu a cota de downloads do Google Drive"
  echo "       (neste caso, aguarde algumas horas e tente novamente)"
  exit 1
fi

# ── 4. Validar integridade do banco ──────────────────────────────────────────
echo ""
echo "  [validando] Verificando integridade do banco..."

python3 - <<PYEOF
import sqlite3, sys

path = "$DB_PATH"

try:
    con = sqlite3.connect(path)
    cur = con.cursor()

    cur.execute("PRAGMA quick_check")
    result = cur.fetchone()
    if not result or result[0] != "ok":
        print("  [erro] Banco corrompido (PRAGMA quick_check falhou)")
        sys.exit(1)

    cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='censo_escolar'")
    if cur.fetchone()[0] == 0:
        print("  [erro] Tabela censo_escolar não encontrada — banco pode ser incorreto")
        sys.exit(1)

    cur.execute("SELECT COUNT(*) FROM censo_escolar")
    total = cur.fetchone()[0]
    print(f"  [ok] Banco válido — {total:,} registros no censo escolar")
    con.close()
    sys.exit(0)
except Exception as e:
    print(f"  [erro] {e}")
    sys.exit(1)
PYEOF

echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║  Banco pronto! Iniciando a aplicação...             ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""

# ── 5. Encerrar servidor de status e iniciar aplicação ───────────────────────
trap - EXIT ERR
cleanup_status

# Pequena pausa para garantir que a porta foi liberada
sleep 1

start_app

