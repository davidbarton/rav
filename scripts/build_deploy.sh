#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="${1:-$REPO_ROOT/../rav-deploy}"

echo "=== Building deploy repo ==="
echo "Source:  $REPO_ROOT"
echo "Target:  $DEPLOY_DIR"
echo ""

# --- Build both apps ---
echo "→ Building fashion report..."
cd "$REPO_ROOT/app" && npm install --silent && npm run build 2>&1
echo ""

echo "→ Building political report..."
cd "$REPO_ROOT/app-political" && npm install --silent && npm run build 2>&1
echo ""

# --- Sync static files ---
echo "→ Syncing built files to $DEPLOY_DIR/public/"
mkdir -p "$DEPLOY_DIR/public/dior" "$DEPLOY_DIR/public/norway"

rsync -a --delete "$REPO_ROOT/app/dist/" "$DEPLOY_DIR/public/dior/"
rsync -a --delete "$REPO_ROOT/app-political/dist/" "$DEPLOY_DIR/public/norway/"

# --- Copy server if changed ---
cp "$DEPLOY_DIR/server.ts" "$DEPLOY_DIR/server.ts.bak" 2>/dev/null || true
cp "$REPO_ROOT/scripts/deploy_server.ts" "$DEPLOY_DIR/server.ts" 2>/dev/null \
  || echo "  (keeping existing server.ts)"
rm -f "$DEPLOY_DIR/server.ts.bak"

# --- Summary ---
echo ""
echo "=== Done ==="
FILE_COUNT=$(find "$DEPLOY_DIR/public" -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$DEPLOY_DIR/public" | cut -f1)
echo "Files: $FILE_COUNT ($TOTAL_SIZE)"
echo ""
echo "Next: cd $DEPLOY_DIR && git add -A && git commit -m 'update reports' && git push"
