#!/usr/bin/env bash
set -euo pipefail

PROXY_URL="${1:?Usage: ./test.sh <proxy-url> [brand] [country]}"
BRAND="${2:-Nike}"
COUNTRY="${3:-de}"

TARGET="https://adsapi.snapchat.com/v1/ads_library/ads/search?limit=10"

echo "[*] Testing proxy: $PROXY_URL"
echo "[*] Brand: $BRAND | Country: $COUNTRY"
echo ""

curl -s -w "\nHTTP_STATUS: %{http_code}\n" \
  -X POST "$PROXY_URL" \
  -H "Content-Type: application/json" \
  -H "x-target-url: $TARGET" \
  -d "{\"paying_advertiser_name\":\"$BRAND\",\"countries\":[\"$COUNTRY\"]}" 2>&1 | head -20
