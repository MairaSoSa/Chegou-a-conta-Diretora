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
echo "  IMPORTANTE: Para ter dados no painel,"
echo "  execute a importacao dos dados do INEP:"
echo ""
echo "    npm run setup:data"
echo ""
echo "  Isso baixa os microdados do Censo Escolar"
echo "  (2020-2024) e indicadores educacionais."
echo "  Leva cerca de 1 hora dependendo da internet."
echo ""
echo "  Para iniciar o servidor (mesmo sem dados):"
echo "    npm run dev"
echo ""
echo "  O app roda em http://localhost:5000"
echo "============================================"
