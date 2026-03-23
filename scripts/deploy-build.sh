#!/usr/bin/env bash
# Deployment build script — keeps the deployed container tiny.
#
# Strategy:
#   1. Build the app (esbuild bundles all pure-JS server deps into dist/index.cjs)
#   2. Preserve only the packages that have native .node bindings (better-sqlite3
#      and its runtime helpers) plus their required deps
#   3. Wipe everything else from node_modules — all other code is now in the bundle
#
# Result: node_modules shrinks from ~700 MB → ~13 MB; total layer < 25 MB.
set -euo pipefail

echo "=== [deploy-build] Step 1: Building application ==="
npm run build

echo "=== [deploy-build] Step 2: Removing dev dependencies ==="
npm prune --production

echo "=== [deploy-build] Step 3: Preserving native runtime packages ==="
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

echo "=== [deploy-build] Step 4: Wiping node_modules ==="
rm -rf node_modules

echo "=== [deploy-build] Step 5: Restoring native packages ==="
mkdir -p node_modules
for pkg in "${KEEP[@]}"; do
  if [ -d "$TMPDIR_NM/$pkg" ]; then
    mv "$TMPDIR_NM/$pkg" "node_modules/$pkg"
  fi
done
rm -rf "$TMPDIR_NM"

echo "=== [deploy-build] Done ==="
echo "  dist/        : $(du -sh dist/ | cut -f1)"
echo "  node_modules/: $(du -sh node_modules/ | cut -f1)"
