#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if (( $# > 0 )); then
  echo "The separate deploy repo is retired. Run this script without arguments." >&2
  exit 1
fi
cd "$REPO_ROOT"
npm ci --include=dev
npm run build
npm test
echo "Reports built and checked. Push this repository's connected branch to trigger Railway."
