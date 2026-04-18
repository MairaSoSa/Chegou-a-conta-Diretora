#!/bin/bash
# 📊 Monitor de Saúde do Projeto - Usar semanalmente

PROJECT_ROOT="/workspaces/Chegou-a-conta-Diretora"
REPORT_FILE="$PROJECT_ROOT/.health-report.txt"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" > "$REPORT_FILE"
echo "📊 HEALTH CHECK - $TIMESTAMP" >> "$REPORT_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Tamanho do projeto
echo "📦 TAMANHO DO BUILD" >> "$REPORT_FILE"
DIST_SIZE=$(du -sh "$PROJECT_ROOT/dist" 2>/dev/null | cut -f1)
ASSETS_COUNT=$(find "$PROJECT_ROOT/dist/public/assets" -type f 2>/dev/null | wc -l)
echo "   Tamanho dist/: $DIST_SIZE" >> "$REPORT_FILE"
echo "   Arquivos em assets/: $ASSETS_COUNT" >> "$REPORT_FILE"

if (( ASSETS_COUNT > 30 )); then
  echo "   ⚠️  AVISO: Muitos arquivos em assets (possível acúmulo de versões)" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 2. Detectar problemas
echo "🔍 PROBLEMAS DETECTADOS" >> "$REPORT_FILE"
LEGACY_COUNT=0

# Verificar versões antigas
# Observacao: index-v2.css permanece como asset ativo na build atual.
for pattern in "*-v[0-9].js" "*-final.*" "*-fix-r*" "*.bak"; do
  COUNT=$(find "$PROJECT_ROOT/dist" -name "$pattern" 2>/dev/null | wc -l)
  if [ "$COUNT" -gt 0 ]; then
    echo "   ❌ $pattern: $COUNT arquivo(s)" >> "$REPORT_FILE"
    ((LEGACY_COUNT += COUNT))
  fi
done

if [ "$LEGACY_COUNT" -eq 0 ]; then
  echo "   ✅ Nenhum arquivo legado detectado" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 3. Configuração
echo "⚙️  CONFIGURAÇÃO" >> "$REPORT_FILE"
if [ -f "$PROJECT_ROOT/.env" ]; then
  if grep -q "DATABASE_URL=postgresql" "$PROJECT_ROOT/.env"; then
    echo "   ✅ DATABASE_URL usa PostgreSQL" >> "$REPORT_FILE"
  else
    echo "   ❌ DATABASE_URL não usa PostgreSQL!" >> "$REPORT_FILE"
  fi
  
  if grep -q "NODE_ENV=production" "$PROJECT_ROOT/.env"; then
    echo "   ✅ NODE_ENV=production" >> "$REPORT_FILE"
  elif grep -q "NODE_ENV=development" "$PROJECT_ROOT/.env"; then
    echo "   ⚠️  NODE_ENV=development (verificar se é intentional)" >> "$REPORT_FILE"
  fi
else
  echo "   ❌ .env não encontrado!" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 4. Git Status
echo "📝 GIT STATUS" >> "$REPORT_FILE"
COMMITS_SINCE=$(cd "$PROJECT_ROOT" && git log --oneline -5 2>/dev/null | wc -l)
UNCOMMITTED=$(cd "$PROJECT_ROOT" && git status --short 2>/dev/null | wc -l)
echo "   Últimos commits: $COMMITS_SINCE" >> "$REPORT_FILE"
echo "   Arquivos não commitados: $UNCOMMITTED" >> "$REPORT_FILE"

if [ "$UNCOMMITTED" -gt 10 ]; then
  echo "   ⚠️  Muitos arquivos modificados (possível acúmulo de lixo)" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 5. Checklist de ação
echo "✅ AÇÕES RECOMENDADAS" >> "$REPORT_FILE"
if [ "$LEGACY_COUNT" -gt 0 ]; then
  echo "   • Rodar: bash $PROJECT_ROOT/cleanup-legacy.sh" >> "$REPORT_FILE"
  echo "   • Depois: git add . && git commit -m 'cleanup: remover arquivos legados'" >> "$REPORT_FILE"
fi

echo "   • Validar: npm run preflight" >> "$REPORT_FILE"
echo "   • Testar endpoints críticos (GET /api/censo-escolar/:inep)" >> "$REPORT_FILE"
echo "   • Verificar logs do Railway PostgreSQL" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 6. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$REPORT_FILE"
if [ "$LEGACY_COUNT" -eq 0 ] && grep -q "DATABASE_URL=postgresql" "$PROJECT_ROOT/.env" 2>/dev/null; then
  echo "🟢 PROJETO SAUDÁVEL" >> "$REPORT_FILE"
else
  echo "🟡 PROJETO COM AVISOS - VER ACIMA" >> "$REPORT_FILE"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$REPORT_FILE"

# Output
cat "$REPORT_FILE"

# Opcional: enviar por email ou slack
echo ""
echo "💾 Relatório salvo em: $REPORT_FILE"
echo "📧 Para monitoramento contínuo, automatizie com: cron ou GitHub Actions"
