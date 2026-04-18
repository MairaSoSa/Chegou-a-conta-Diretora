#!/bin/bash
# Cleanup script para remover arquivos legados e versões antigas
# Este script remove versões antigas de componentes que causam confusão

set -e

PROJ_ROOT="/workspaces/Chegou-a-conta-Diretora"
REMOVED=0

echo "🧹 Limpando código legado..."

# 1. Remover backups da raiz dist/
echo "  → Removendo backups em dist/"
rm -f "$PROJ_ROOT/dist/index.cjs.gz.bak2" && echo "    ✓ Removido: index.cjs.gz.bak2" && ((REMOVED+=1))
rm -f "$PROJ_ROOT/dist/public/index.html.bak" && echo "    ✓ Removido: index.html.bak" && ((REMOVED+=1))

# 2. Remover versões antigas de componentes (manter apenas v4 e hash final)
# Padrão: remover tudo exceto versões que NÃO têm sufixos de patch (v2, v3, final, fix)
echo ""
echo "  → Removendo versões antigas de Dashboard"
OLD_DASHBOARDS=(
  "Dashboard-v2r1patch-.js"
  "Dashboard-v2r1patch-.js.gz"
  "Dashboard-v3fixed.js"
  "Dashboard-v3fixed.js.gz"
  "Dashboard-v3-full.js"
  "Dashboard-v3-full.js.gz"
  "Dashboard-final.js"
  "Dashboard-final.js.gz"
  "Dashboard-fix-r1.js"
  "Dashboard-fix-r1.js.gz"
)

for file in "${OLD_DASHBOARDS[@]}"; do
  if [ -f "$PROJ_ROOT/dist/public/assets/$file" ]; then
    rm -f "$PROJ_ROOT/dist/public/assets/$file"
    echo "    ✓ Removido: $file" && ((REMOVED+=1))
  fi
done

echo ""
echo "  → Removendo versões antigas de index"
OLD_INDEX=(
  "index-v2patch-Af.js"
  "index-v2patch-Af.js.gz"
  "index-v3r1.js"
  "index-v3r1.js.gz"
  "index-v3r2.js"
  "index-v3r2.js.gz"
  "index-final.js"
  "index-final.js.gz"
  "index-fix-r1.js"
  "index-fix-r1.js.gz"
  "index-xUS7o_Af.js"
  "index-xUS7o_Af.js.gz"
)

for file in "${OLD_INDEX[@]}"; do
  if [ -f "$PROJ_ROOT/dist/public/assets/$file" ]; then
    rm -f "$PROJ_ROOT/dist/public/assets/$file"
    echo "    ✓ Removido: $file" && ((REMOVED+=1))
  fi
done

echo ""
echo "✅ Limpeza concluída!"
echo "   Total de arquivos removidos: $REMOVED"
echo ""
echo "📁 Arquivos que devem ser mantidos:"
echo "   - dist/bootstrap.cjs"
echo "   - dist/index.cjs / index.cjs.gz"
echo "   - dist/pdde-fields-extension.cjs"
echo "   - dist/public/assets/Dashboard-*.js (apenas v4 e hashes)"
echo "   - dist/public/assets/index-*.js (apenas v4 e hashes)"
echo "   - dist/public/assets/vendor-*.js (bibliotecas essenciais)"
