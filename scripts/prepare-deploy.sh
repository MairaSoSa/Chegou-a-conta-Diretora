#!/usr/bin/env bash
# Prepara os artefatos de deployment em dist/ sem apagar nada.
# Execute localmente ANTES de publicar no Replit.
#
# Resultado em dist/:
#   index.cjs.gz       ~1.9 MB  (bundle do servidor)
#   public/assets/     ~0.6 MB  (assets gzipados)
#   better_sqlite3.gz  ~1.0 MB  (binário nativo)
#   bootstrap.cjs      ~1 KB    (launcher de startup)
#   public/index.html  ~3 KB
#   TOTAL              ~3.5 MB
#
# Depois que esse script terminar, basta publicar pelo botão do Replit.
set -euo pipefail

echo "=== [prepare-deploy] Step 1: Compilando aplicação ==="
npm run build

echo "=== [prepare-deploy] Step 2: Gzipando assets estáticos ==="
for f in dist/public/assets/*.js dist/public/assets/*.mjs dist/public/assets/*.css; do
  [ -f "$f" ] || continue
  gzip -9 "$f"
  echo "  $(basename "$f").gz"
done

echo "=== [prepare-deploy] Step 3: Gzipando bundle do servidor ==="
gzip -9 dist/index.cjs
echo "  dist/index.cjs.gz: $(du -sh dist/index.cjs.gz | cut -f1)"

echo "=== [prepare-deploy] Step 4: Embutindo binário nativo ==="
NATIVE_SRC="node_modules/better-sqlite3/build/Release/better_sqlite3.node"
if [ -f "$NATIVE_SRC" ]; then
  gzip -9 -c "$NATIVE_SRC" > dist/better_sqlite3.gz
  echo "  dist/better_sqlite3.gz: $(du -sh dist/better_sqlite3.gz | cut -f1)"
else
  echo "  AVISO: better_sqlite3.node não encontrado em $NATIVE_SRC"
  exit 1
fi

echo "=== [prepare-deploy] Step 5: Gerando bootstrap launcher ==="
cat > dist/bootstrap.cjs << 'BOOTSTRAP'
'use strict';
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const os = require('os');
const Module = require('module');

const distDir = __dirname;
const tmpDir = os.tmpdir();

// ── 1. Extrair binário nativo SQLite ─────────────────────────────────────────
const nativeGz  = path.join(distDir, 'better_sqlite3.gz');
const nativeTmp = path.join(tmpDir, 'better_sqlite3.node');
if (!fs.existsSync(nativeTmp)) {
  fs.writeFileSync(nativeTmp, zlib.gunzipSync(fs.readFileSync(nativeGz)));
}

// ── 2. Patch Module._load para redirecionar .node ao /tmp ────────────────────
// bindings procura o arquivo .node via require(); interceptamos e redirecionamos.
// IMPORTANTE: usar origLoad (não require()) para evitar loop infinito.
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request && request.endsWith('.node') && path.basename(request) === 'better_sqlite3.node') {
    return origLoad.call(this, nativeTmp, parent, isMain);
  }
  return origLoad.apply(this, arguments);
};

process.env.BETTER_SQLITE3_NODE = nativeTmp;

// ── 3. Descomprimir e executar o bundle principal ────────────────────────────
const gzPath = path.join(distDir, 'index.cjs.gz');
const source  = zlib.gunzipSync(fs.readFileSync(gzPath)).toString('utf8');
const m = new Module(path.join(distDir, 'index.cjs'));
m.filename = path.join(distDir, 'index.cjs');
m.paths = Module._nodeModulePaths(distDir);
m._compile(source, path.join(distDir, 'index.cjs'));
module.exports = m.exports;
BOOTSTRAP
echo "  dist/bootstrap.cjs: $(du -sh dist/bootstrap.cjs | cut -f1)"

echo ""
echo "=== [prepare-deploy] Concluído ==="
du -sh dist/
echo ""
echo "Detalhamento:"
printf "  index.cjs.gz:       %s\n" "$(du -sh dist/index.cjs.gz | cut -f1)"
printf "  better_sqlite3.gz:  %s\n" "$(du -sh dist/better_sqlite3.gz | cut -f1)"
printf "  public/assets/:     %s\n" "$(du -sh dist/public/assets/ | cut -f1)"
printf "  bootstrap.cjs:      %s\n" "$(du -sh dist/bootstrap.cjs | cut -f1)"
echo ""
echo "dist/ pronto para deployment. Publique pelo botão do Replit."
