#!/usr/bin/env bash
# Deployment build script — keeps the deployed container tiny.
#
# Strategy:
#   1.  Build the app (esbuild bundles all pure-JS server deps → dist/index.cjs)
#   2.  Pre-gzip JS/CSS assets in dist/public/ so Express serves .gz files
#   3.  Gzip dist/index.cjs → dist/index.cjs.gz; create a tiny bootstrap that
#       decompresses it at startup into /tmp (writable RAM disk in Cloud Run)
#   4.  Preserve only better-sqlite3 native packages; wipe everything else from
#       node_modules; strip better-sqlite3's C source dirs (deps/ src/)
#
# Size targets:
#   dist/index.cjs.gz :  ~1.9 MB  (was 6.1 MB)
#   dist/public/      :  ~0.7 MB  (was 2.3 MB — assets gzipped in-place)
#   node_modules/     :  ~2.2 MB  (only better-sqlite3 runtime files)
#   TOTAL             :  ~4.8 MB  (down from 22.4 MB)
set -euo pipefail

echo "=== [deploy-build] Step 1: Building application ==="
npm run build

echo "=== [deploy-build] Step 2: Gzipping static assets in dist/public/assets/ ==="
for f in dist/public/assets/*.js dist/public/assets/*.mjs dist/public/assets/*.css; do
  [ -f "$f" ] || continue
  gzip -9 "$f"          # creates $f.gz, removes original
  echo "  gzipped: $(basename "$f") → $(du -sh "${f}.gz" | cut -f1)"
done

echo "=== [deploy-build] Step 3: Gzipping server bundle dist/index.cjs ==="
gzip -9 dist/index.cjs  # creates dist/index.cjs.gz, removes original
echo "  dist/index.cjs.gz: $(du -sh dist/index.cjs.gz | cut -f1)"

echo "=== [deploy-build] Step 4: Creating bootstrap launcher dist/bootstrap.cjs ==="
# The bootstrap decompresses index.cjs.gz to /tmp at startup and executes it.
# We use Module._compile with the ORIGINAL filename so that __dirname inside
# the bundle still resolves to the dist/ directory (where dist/public lives).
cat > dist/bootstrap.cjs << 'BOOTSTRAP'
'use strict';
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const Module = require('module');

const distDir = __dirname;
const gzPath = path.join(distDir, 'index.cjs.gz');
const tmpPath = path.join(require('os').tmpdir(), '_bundle.cjs');

const compressed = fs.readFileSync(gzPath);
const source = zlib.gunzipSync(compressed).toString('utf8');

const m = new Module(path.join(distDir, 'index.cjs'));
m.filename = path.join(distDir, 'index.cjs');
m.paths = Module._nodeModulePaths(distDir);
m._compile(source, path.join(distDir, 'index.cjs'));
module.exports = m.exports;
BOOTSTRAP
echo "  dist/bootstrap.cjs: $(du -sh dist/bootstrap.cjs | cut -f1)"

echo "=== [deploy-build] Step 5: Removing dev dependencies ==="
npm prune --production

echo "=== [deploy-build] Step 6: Preserving native runtime packages ==="
KEEP=(
  better-sqlite3
  bindings
  file-uri-to-path
  prebuild-install
)

TMPDIR_NM=$(mktemp -d)
for pkg in "${KEEP[@]}"; do
  if [ -d "node_modules/$pkg" ]; then
    cp -r "node_modules/$pkg" "$TMPDIR_NM/$pkg"
    echo "  preserved: $pkg ($(du -sh "node_modules/$pkg" | cut -f1))"
  fi
done

echo "=== [deploy-build] Step 7: Wiping node_modules ==="
rm -rf node_modules

echo "=== [deploy-build] Step 8: Restoring native packages ==="
mkdir -p node_modules
for pkg in "${KEEP[@]}"; do
  [ -d "$TMPDIR_NM/$pkg" ] && mv "$TMPDIR_NM/$pkg" "node_modules/$pkg"
done
rm -rf "$TMPDIR_NM"

echo "=== [deploy-build] Step 9: Stripping better-sqlite3 build-time dirs ==="
for dir in deps src; do
  if [ -d "node_modules/better-sqlite3/$dir" ]; then
    SIZE=$(du -sh "node_modules/better-sqlite3/$dir" | cut -f1)
    rm -rf "node_modules/better-sqlite3/$dir"
    echo "  removed better-sqlite3/$dir ($SIZE)"
  fi
done

echo "=== [deploy-build] Done ==="
echo "  dist/        : $(du -sh dist/ | cut -f1)"
echo "  node_modules/: $(du -sh node_modules/ | cut -f1)"
TOTAL=$(du -sb dist/ node_modules/ | awk '{s+=$1}END{printf "%.1fM", s/1048576}')
echo "  TOTAL        : ${TOTAL}  (limit ~10 MB)"
