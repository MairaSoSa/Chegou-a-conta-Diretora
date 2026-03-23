#!/usr/bin/env bash
# Deployment build script — keeps the deployed container tiny.
#
# Strategy:
#   1. Build the app (esbuild bundles all pure-JS server deps into dist/index.cjs)
#   2. Remove the pdf.worker.min.mjs from dist/public (loaded from CDN at runtime)
#   3. Preserve only the packages that have native .node bindings (better-sqlite3
#      and its runtime helpers) plus their required deps
#   4. Wipe everything else from node_modules — all other code is now in the bundle
#   5. Strip better-sqlite3/deps/ (SQLite C source) — only needed to compile, not run
#
# Result: node_modules shrinks from ~700 MB → ~2.5 MB; total layer < 15 MB.
set -euo pipefail

echo "=== [deploy-build] Step 1: Building application ==="
npm run build

echo "=== [deploy-build] Step 2: Removing pdf.worker from dist (loaded via CDN) ==="
find dist/public/assets -name "pdf.worker*" -delete && echo "  removed pdf.worker.min.mjs from dist"

echo "=== [deploy-build] Step 3: Removing dev dependencies ==="
npm prune --production

echo "=== [deploy-build] Step 4: Preserving native runtime packages ==="
# These packages must stay in node_modules because they contain .node binaries
# or are required at runtime by those binaries.
KEEP=(
  better-sqlite3      # native SQLite addon
  bindings            # required by better-sqlite3 to locate the .node file
  file-uri-to-path    # required by bindings
  prebuild-install    # required by better-sqlite3 (checks for prebuilt binary)
)

# Copy keepers to a temp location
TMPDIR_NM=$(mktemp -d)
for pkg in "${KEEP[@]}"; do
  if [ -d "node_modules/$pkg" ]; then
    cp -r "node_modules/$pkg" "$TMPDIR_NM/$pkg"
    echo "  preserved: $pkg ($(du -sh "node_modules/$pkg" | cut -f1))"
  fi
done

echo "=== [deploy-build] Step 5: Wiping node_modules ==="
rm -rf node_modules

echo "=== [deploy-build] Step 6: Restoring native packages ==="
mkdir -p node_modules
for pkg in "${KEEP[@]}"; do
  if [ -d "$TMPDIR_NM/$pkg" ]; then
    mv "$TMPDIR_NM/$pkg" "node_modules/$pkg"
  fi
done
rm -rf "$TMPDIR_NM"

echo "=== [deploy-build] Step 7: Stripping better-sqlite3 build-time only dirs ==="
# deps/ = SQLite C source (9.7 MB) — only needed to compile the .node addon.
# src/  = C++ binding source (156 KB) — same.
# At runtime only lib/ and build/Release/*.node are needed.
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
echo "  TOTAL        : ${TOTAL}"
