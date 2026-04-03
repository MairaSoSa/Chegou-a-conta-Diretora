#!/bin/bash
# Checklist para mudanças seguras no projeto

set -e

PASS=0
FAIL=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  PRÉ-COMMIT CHECKLIST - Chegou a Conta, Diretora"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Build válido
echo "1️⃣  Validando build..."
if node /workspaces/Chegou-a-conta-Diretora/scripts/validate-build.mjs > /dev/null 2>&1; then
  echo "   ✅ Build está saudável"
  ((PASS++))
else
  echo "   ❌ Build tem problemas - rode: npm run preflight"
  ((FAIL++))
fi

# 2. Nenhum arquivo .bak em staging
echo ""
echo "2️⃣  Verificando files de backup..."
if ! git diff --cached --name-only | grep -E '\.(bak|backup)$' > /dev/null 2>&1; then
  echo "   ✅ Sem arquivos .bak no commit"
  ((PASS++))
else
  echo "   ❌ Encontrados arquivos .bak em staging!"
  ((FAIL++))
fi

# 3. .env não foi commited
echo ""
echo "3️⃣  Verificando segredos..."
if ! git diff --cached --name-only | grep -E '^\.env$' > /dev/null 2>&1; then
  echo "   ✅ .env não está em staging (correto!)"
  ((PASS++))
else
  echo "   ❌ PERIGO: .env será commitado com senhas!"
  echo "   ️    Rode: git reset HEAD .env"
  ((FAIL++))
fi

# 4. Código tem comentários úteis
echo ""
echo "4️⃣  Analisando mudanças..."
CHANGED_LINES=$(git diff --cached | wc -l)
echo "   📝 Linhas adicionadas/modificadas: $CHANGED_LINES"
if [ "$CHANGED_LINES" -gt 50 ]; then
  echo "   ⚠️  Mudança é grande - considere quebrar em PRs menores"
fi

# 5. Message do commit
echo ""
echo "5️⃣  Testando commit message..."
echo "   💡 Lembre-se de usar format: 'verb: description'"
echo "      Exemplos: 'fix: corrigir erro de validação'"
echo "              'feat: adicionar endpoint de relatórios'"
echo "              'docs: atualizar README'"

# 6. Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAIL" -eq 0 ]; then
  echo "✅ Todos os checks passaram! Está seguro fazer commit."
  echo ""
  echo "📋 Próximo passo:"
  echo "   git commit -m \"tipo: descrição\""
  echo "   git push origin main"
  echo ""
  exit 0
else
  echo "❌ $FAIL check(s) falharam. Corrija antes de commitar."
  echo ""
  echo "📖 Referência rápida:"
  echo "   - Guia completo em: STABILITY.md"
  echo "   - Validação: npm run preflight"
  echo "   - Assets legados: rm dist/public/assets/*-v[0-9].js"
  echo ""
  exit 1
fi
