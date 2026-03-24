#!/usr/bin/env bash
# Deployment build script — absolute minimum container footprint.
#
# After this script, the container has ONLY:
#   dist/index.cjs.gz      ~1.9 MB  (gzipped server bundle)
#   dist/public/           ~0.6 MB  (gzipped static assets)
#   dist/bootstrap.cjs     ~1 KB    (startup decompressor)
#   dist/better_sqlite3.gz ~1.0 MB  (gzipped native binary)
#   start.sh               ~2 KB
#   TOTAL                  ~3.5 MB
#
# Source files, node_modules, and build scripts are deleted after building.
set -euo pipefail

echo "=== [deploy-build] Step 1: Building application ==="
npm run build

echo "=== [deploy-build] Step 2: Gzipping static assets in dist/public/assets/ ==="
for f in dist/public/assets/*.js dist/public/assets/*.mjs dist/public/assets/*.css; do
  [ -f "$f" ] || continue
  gzip -9 "$f"
  echo "  gzipped: $(basename "$f").gz"
done

echo "=== [deploy-build] Step 3: Gzipping server bundle dist/index.cjs ==="
gzip -9 dist/index.cjs
echo "  dist/index.cjs.gz: $(du -sh dist/index.cjs.gz | cut -f1)"

echo "=== [deploy-build] Step 4: Embedding better_sqlite3.node into dist/ ==="
# Gzip the native binary — bootstrap will extract to /tmp at startup.
# This lets us eliminate node_modules/ entirely.
NATIVE_SRC="node_modules/better-sqlite3/build/Release/better_sqlite3.node"
if [ -f "$NATIVE_SRC" ]; then
  gzip -9 -c "$NATIVE_SRC" > dist/better_sqlite3.gz
  echo "  dist/better_sqlite3.gz: $(du -sh dist/better_sqlite3.gz | cut -f1)"
else
  echo "  WARNING: better_sqlite3.node not found at $NATIVE_SRC"
fi

echo "=== [deploy-build] Step 5: Creating bootstrap launcher dist/bootstrap.cjs ==="
# Bootstrap does three things at startup:
#   1. Extracts better_sqlite3.node from dist/better_sqlite3.gz → /tmp/
#   2. Patches Module._load so better-sqlite3's bindings finds the .node file
#   3. Decompresses and executes dist/index.cjs.gz (with correct __dirname)
cat > dist/bootstrap.cjs << 'BOOTSTRAP'
'use strict';
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const os = require('os');
const Module = require('module');

const distDir = __dirname;
const tmpDir = os.tmpdir();

// ── 1. Extract native SQLite binary ──────────────────────────────────────────
const nativeGz  = path.join(distDir, 'better_sqlite3.gz');
const nativeTmp = path.join(tmpDir, 'better_sqlite3.node');
if (!fs.existsSync(nativeTmp)) {
  fs.writeFileSync(nativeTmp, zlib.gunzipSync(fs.readFileSync(nativeGz)));
}

// ── 2. Patch Module loading so better-sqlite3's `bindings` finds the binary ──
// bindings resolves the .node file via process.dlopen; we intercept _load for
// .node files and redirect them to our /tmp copy.
// IMPORTANT: use origLoad (not require) for the redirect to avoid infinite loop.
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request && request.endsWith('.node') && path.basename(request) === 'better_sqlite3.node') {
    return origLoad.call(this, nativeTmp, parent, isMain);
  }
  return origLoad.apply(this, arguments);
};

// Also expose the path via an env var that some bindings versions check.
process.env.BETTER_SQLITE3_NODE = nativeTmp;

// ── 3. Decompress and execute the main server bundle ─────────────────────────
// Module._compile sets __dirname = distDir so paths resolve correctly.
const gzPath = path.join(distDir, 'index.cjs.gz');
const source  = zlib.gunzipSync(fs.readFileSync(gzPath)).toString('utf8');
const m = new Module(path.join(distDir, 'index.cjs'));
m.filename = path.join(distDir, 'index.cjs');
m.paths = Module._nodeModulePaths(distDir);
m._compile(source, path.join(distDir, 'index.cjs'));
module.exports = m.exports;
BOOTSTRAP
echo "  dist/bootstrap.cjs: $(du -sh dist/bootstrap.cjs | cut -f1)"

echo "=== [deploy-build] Step 5b: Copying runtime JSON data files to app root ==="
cp server/municipio-centroides.json ./
cp server/municipio-microregiao.json ./
echo "  municipio-centroides.json e municipio-microregiao.json copiados"

echo "=== [deploy-build] Step 6: Wiping node_modules (binary now in dist/) ==="
rm -rf node_modules
echo "  node_modules/ removed"

echo "=== [deploy-build] Step 7: Removing source files (not needed at runtime) ==="
# Everything the app needs to RUN is now inside dist/.
# Source code, build scripts, and config files only bloat the container layer.
rm -rf server/ client/ shared/ script/ scripts/
rm -f vite.config.ts tsconfig.json tsconfig.node.json drizzle.config.ts
rm -f package.json package-lock.json
rm -f .gitignore .dockerignore .eslintrc* .prettierrc* postcss.config.*
rm -f replit.md README.md CHANGELOG.md
echo "  source files removed"

echo "=== [deploy-build] Done ==="
du -sh dist/ 2>/dev/null && echo "  (+ start.sh)"
TOTAL=$(du -sb dist/ | awk '{s+=$1}END{printf "%.1fM", s/1048576}')
echo "  TOTAL: ${TOTAL}"
