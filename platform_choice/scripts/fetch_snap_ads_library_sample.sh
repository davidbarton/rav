#!/usr/bin/env bash
# Snap Ads Gallery API — minimal reproducible samples (no OAuth).
# Docs: https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/using-the-api
set -euo pipefail
_SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="${1:-${_SCRIPT_DIR}/../data/samples/snap-$(date +%Y-%m-%d)}"
mkdir -p "$OUT_DIR"

echo "Fetching sponsored commercial content (page 1) -> $OUT_DIR/sponsored_content_page1.json"
curl -sS -f -o "$OUT_DIR/sponsored_content_page1.json" \
  'https://adsapi.snapchat.com/v1/ads_library/sponsored_content'

echo "Optional: EU ads for a named advertiser (may rate-limit; use backoff)"
# shellcheck disable=SC2016
curl -sS -o "$OUT_DIR/ads_search_example.json" -X POST \
  'https://adsapi.snapchat.com/v1/ads_library/ads/search' \
  -H 'Content-Type: application/json' \
  -d '{"paying_advertiser_name":"spotify","countries":["de","fr"],"start_date":"2025-06-01T00:00:00.000Z","end_date":"2026-04-07T00:00:00.000Z","status":"ACTIVE"}' \
  || true

echo "Done. Inspect request_status in each JSON."
