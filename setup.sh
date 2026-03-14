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

echo "[1/5] Instalando dependencias..."
npm install

if [ ! -f .env ]; then
  echo "[2/5] Criando arquivo .env a partir do .env.example..."
  cp .env.example .env
  echo "  -> Edite o arquivo .env com suas configuracoes (especialmente OPENAI_API_KEY)"
else
  echo "[2/5] Arquivo .env ja existe, pulando..."
fi

echo "[3/5] Inicializando banco de dados SQLite..."
npx drizzle-kit push 2>/dev/null || echo "  -> Tabelas ja existem ou foram criadas."

echo "[4/5] Inserindo dados de exemplo (3 escolas demo)..."
node scripts/seed-demo.mjs

echo "[5/5] Pronto!"
echo ""
echo "============================================"
echo "  COMO USAR"
echo "  ----------"
echo "  1. Inicie o servidor:"
echo "       npm run dev"
echo ""
echo "  2. Acesse http://localhost:5000"
echo ""
echo "  3. Em 'Dados Educacionais', busque por:"
echo "       35000001  (São Paulo/SP)"
echo "       31000002  (Belo Horizonte/MG)"
echo "       43000003  (Porto Alegre/RS)"
echo ""
echo "  OPCIONAL: dados reais do INEP (~1h):"
echo "    npm run setup:data"
echo ""
echo "  Isso baixa os microdados do Censo Escolar"
echo "  (2020-2024) com ~1 milhao de escolas."
echo "============================================"
