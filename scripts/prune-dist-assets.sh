#!/usr/bin/env bash
set -euo pipefail

# Keeps only active versioned assets used by dist/public/index.html:
# - index-v*.js and index-v*-shared.js
# - Dashboard-v*.js and Dashboard-*.js
#
# By default this is a dry-run. Use --apply to delete files.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="$ROOT_DIR/dist/public/assets"
INDEX_HTML="$ROOT_DIR/dist/public/index.html"

APPLY=false
KEEP_HISTORY=2

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)
      APPLY=true
      ;;
    --keep-history)
      shift
      KEEP_HISTORY="${1:-2}"
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 [--apply] [--keep-history N]"
      exit 1
      ;;
  esac
  shift
done

if [[ ! -f "$INDEX_HTML" ]]; then
  echo "ERROR: index.html not found at $INDEX_HTML"
  exit 1
fi

if [[ ! -d "$ASSETS_DIR" ]]; then
  echo "ERROR: assets directory not found at $ASSETS_DIR"
  exit 1
fi

active_index_from_html="$(grep -oE '/assets/index-[^"?]+' "$INDEX_HTML" | head -n1 | sed 's#^/assets/##')"

if [[ -z "$active_index_from_html" ]]; then
  echo "ERROR: could not detect active index bundle in $INDEX_HTML"
  exit 1
fi

if [[ ! -f "$ASSETS_DIR/$active_index_from_html" ]]; then
  echo "ERROR: active index bundle not found: $ASSETS_DIR/$active_index_from_html"
  exit 1
fi

declare -A KEEP
KEEP["$active_index_from_html"]=1

# Keep a small history of recent index bundles to reduce stale-cache breakage
if [[ "$KEEP_HISTORY" =~ ^[0-9]+$ ]] && [[ "$KEEP_HISTORY" -gt 0 ]]; then
  mapfile -t recent_indexes < <(find "$ASSETS_DIR" -maxdepth 1 -type f -name 'index-v*.js' -printf '%f\n' | sort -V | tail -n "$KEEP_HISTORY")
  for idx in "${recent_indexes[@]}"; do
    [[ -n "$idx" ]] && KEEP["$idx"]=1
  done
fi

# Keep index shared chunk if referenced by active index
while IFS= read -r name; do
  [[ -n "$name" ]] && KEEP["$name"]=1
done < <(grep -oE 'index-[^"'"'"']*-shared\.js' "$ASSETS_DIR/$active_index_from_html" | sort -u)

# Keep all dashboard chunks referenced by active index and shared index chunks
for idx in "${!KEEP[@]}"; do
  [[ "$idx" == index-*.js ]] || continue
  if [[ -f "$ASSETS_DIR/$idx" ]]; then
    while IFS= read -r dash; do
      [[ -n "$dash" ]] && KEEP["$dash"]=1
    done < <(grep -oE 'Dashboard-[^"'"'"']+\.js' "$ASSETS_DIR/$idx" | sort -u)
  fi
done

to_remove=()

while IFS= read -r f; do
  base="$(basename "$f")"
  if [[ -z "${KEEP[$base]:-}" ]]; then
    to_remove+=("$f")
  fi
done < <(find "$ASSETS_DIR" -maxdepth 1 -type f \( -name 'index-v*.js' -o -name 'index-v*-shared.js' -o -name 'Dashboard-v*.js' -o -name 'Dashboard-*.js' \) | sort)

echo "Active index: $active_index_from_html"
echo "Keep history: $KEEP_HISTORY"
echo "Kept bundles:"
for k in "${!KEEP[@]}"; do
  echo "  - $k"
done | sort

echo
echo "Candidates for removal: ${#to_remove[@]}"
for f in "${to_remove[@]}"; do
  echo "  - $(basename "$f")"
done

if [[ "$APPLY" == true ]]; then
  echo
  echo "Applying removal..."
  for f in "${to_remove[@]}"; do
    rm -f "$f"
    rm -f "$f.gz"
  done
  echo "Done."
else
  echo
  echo "Dry-run only. Re-run with --apply to remove files."
fi
