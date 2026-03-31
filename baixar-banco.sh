#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# baixar-banco.sh — baixa o dev.db do Google Drive
#
# USO:
#   ./baixar-banco.sh "https://drive.google.com/file/d/SEU_ID_AQUI/view?usp=sharing"
#
#   Ou defina a variável de ambiente antes de rodar:
#   export SQLITE_DB_DOWNLOAD_URL="https://drive.google.com/..."
#   ./baixar-banco.sh
#
# REQUISITO: Python 3 (para instalar gdown automaticamente se não tiver)
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── 1. Pega a URL ─────────────────────────────────────────────────────────────
URL="${1:-${SQLITE_DB_DOWNLOAD_URL:-https://drive.google.com/file/d/1Dtp04JGoLqB9kIzgRnXi36BRtdH23BK4/view?usp=drive_link}}"

if [ -z "$URL" ]; then
  echo ""
  echo "  ERRO: Informe o link do Google Drive."
  echo ""
  echo "  Uso:"
  echo "    ./baixar-banco.sh \"https://drive.google.com/file/d/SEU_ID/view?usp=sharing\""
  echo ""
  echo "  Ou defina a variável de ambiente SQLITE_DB_DOWNLOAD_URL e rode sem argumento."
  echo ""
  exit 1
fi

# ── 2. Destino do arquivo ─────────────────────────────────────────────────────
DESTINO="${SQLITE_DB_PATH:-$(dirname "$0")/dev.db}"

echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║      Chegou a Conta, Diretora! — Baixar Banco       ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""
echo "  URL    : $URL"
echo "  Destino: $DESTINO"
echo ""

# ── 3. Garante que gdown está instalado ──────────────────────────────────────
if ! command -v gdown &>/dev/null; then
  echo "  [info] gdown não encontrado. Instalando via pip..."
  python3 -m pip install --quiet --user gdown
  export PATH="$PATH:$(python3 -m site --user-base)/bin"
fi

if ! command -v gdown &>/dev/null; then
  echo "  [erro] Não foi possível instalar o gdown."
  echo "         Rode manualmente: pip install gdown"
  exit 1
fi

echo "  [info] gdown instalado: $(gdown --version 2>/dev/null || echo 'ok')"
echo ""

# ── 4. Aviso se já existe banco ───────────────────────────────────────────────
if [ -f "$DESTINO" ] && [ -s "$DESTINO" ]; then
  TAMANHO=$(du -sh "$DESTINO" 2>/dev/null | cut -f1)
  echo "  [aviso] Já existe um banco em $DESTINO ($TAMANHO)."
  echo ""
  read -rp "  Substituir? (s/N): " CONFIRM
  if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
    echo ""
    echo "  Operação cancelada."
    exit 0
  fi
  echo ""
  rm -f "$DESTINO"
fi

# ── 5. Baixa o arquivo ────────────────────────────────────────────────────────
mkdir -p "$(dirname "$DESTINO")"

echo "  [download] Iniciando... (pode demorar — o banco tem ~10 GB)"
echo "             Não feche este terminal."
echo ""

if gdown "$URL" -O "$DESTINO" --fuzzy; then
  echo ""
  echo "  [ok] Download concluído: $(du -sh "$DESTINO" | cut -f1)"
else
  rm -f "$DESTINO"
  echo ""
  echo "  [erro] Falha no download."
  echo ""
  echo "  Verifique:"
  echo "    1. O arquivo está compartilhado como 'Qualquer pessoa com o link pode ver'"
  echo "    2. O link está correto"
  echo "    3. O arquivo não excedeu a cota de downloads do Google Drive"
  echo "       (neste caso, aguarde algumas horas e tente novamente)"
  exit 1
fi

# ── 6. Valida o banco baixado ─────────────────────────────────────────────────
echo ""
echo "  [validando] Verificando integridade do banco..."

python3 - <<PYEOF
import sqlite3, sys, os

path = os.environ.get("SQLITE_DB_PATH", "$(dirname "$0")/dev.db")
path = "$DESTINO"

try:
    con = sqlite3.connect(path)
    cur = con.cursor()

    cur.execute("PRAGMA quick_check")
    if cur.fetchone()[0] != "ok":
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
echo "  ║  Banco pronto! Reinicie o servidor para usar.       ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""
