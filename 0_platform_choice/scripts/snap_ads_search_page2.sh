#!/usr/bin/env bash
# Page 2+ of Snap Ads Library brand search: POST same JSON body to paging.next_link URL.
# Docs: cursor is a query parameter on POST .../ads/search
set -euo pipefail
if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <next_link_url_from_previous_response> <path_to_body.json>" >&2
  exit 1
fi
NEXT="$1"
BODY="$2"
exec curl -sS -X POST "$NEXT" \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: rav-platform-experiment/1.0' \
  --data-binary "@${BODY}"
