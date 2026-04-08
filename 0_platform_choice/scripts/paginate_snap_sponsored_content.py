#!/usr/bin/env python3
"""Fetch one or more pages of Snap Ads Library sponsored commercial content (no OAuth).

Docs: https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/using-the-api
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request

BASE = "https://adsapi.snapchat.com/v1/ads_library/sponsored_content"


def fetch_page(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "rav-platform-experiment/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    p = argparse.ArgumentParser(description="Paginate Snap sponsored_content endpoint.")
    p.add_argument("--max-pages", type=int, default=2, help="Number of pages to fetch (default 2)")
    p.add_argument("--sleep", type=float, default=2.0, help="Delay between requests (seconds)")
    p.add_argument("-o", "--output", required=True, help="Output JSON path (list of page payloads)")
    args = p.parse_args()

    pages: list[dict] = []
    url: str | None = BASE
    for i in range(args.max_pages):
        if not url:
            break
        try:
            data = fetch_page(url)
        except urllib.error.HTTPError as e:
            print(f"HTTP {e.code}: {e.reason}", file=sys.stderr)
            return 1
        pages.append(data)
        status = data.get("request_status")
        n = len(data.get("ad_previews") or [])
        print(f"page {i + 1}: request_status={status} items={n}", file=sys.stderr)
        url = (data.get("paging") or {}).get("next_link")
        if url and i + 1 < args.max_pages:
            time.sleep(args.sleep)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(pages, f, indent=2)

    total = sum(len(pg.get("ad_previews") or []) for pg in pages)
    print(f"wrote {args.output} pages={len(pages)} total_items={total}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
