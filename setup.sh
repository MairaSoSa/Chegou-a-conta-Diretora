#!/bin/bash
set -e

echo "============================================"
echo "  Chegou a Conta, Diretora! - Setup"
echo "============================================"
echo ""

if ! command -v node &> /dev/null; then
  echo "Node.js nao encontrado. Instale Node.js 20+ antes de continuar."
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Node.js 18+ necessario. Versao atual: $(node -v)"
  exit 1
fi

echo "[1/4] Instalando dependencias..."
npm install

if [ ! -f .env ]; then
  echo "[2/4] Criando arquivo .env a partir do .env.example..."
  cp .env.example .env
  echo "  -> Edite o arquivo .env com suas configuracoes (especialmente OPENAI_API_KEY)"
else
  echo "[2/4] Arquivo .env ja existe, pulando..."
fi

echo "[3/4] Inicializando banco de dados SQLite..."
npx drizzle-kit push 2>/dev/null || echo "  -> Tabelas ja existem ou foram criadas."

echo "[4/4] Pronto!"
echo ""
echo "============================================"
echo "  Para iniciar o servidor de desenvolvimento:"
echo "    npm run dev"
echo ""
echo "  Para build de producao:"
echo "    npm run build"
echo "    npm start"
echo ""
echo "  O app roda em http://localhost:5000"
echo "============================================"
