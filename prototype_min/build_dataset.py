#!/usr/bin/env python3
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAMPLE_DIR = ROOT / "0_platform_choice" / "data" / "samples" / "2026-04-07-snap-sponsored-content"
OUT_DIR = Path(__file__).resolve().parent / "data"
OUT_FILE = OUT_DIR / "normalized.json"


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def classify_text(text: str):
    t = (text or "").lower()
    if any(k in t for k in ["podcast", "playlist", "music", "spotify", "hörbuch", "audio"]):
        return ("Audio", "Streaming")
    if any(k in t for k in ["crypto", "trading", "investment", "invest"]):
        return ("Finance", "Investment")
    if any(k in t for k in ["tv", "show", "movie", "serie"]):
        return ("Entertainment", "Video")
    return ("Unknown", "Unknown")


def detect_risk(text: str, url: str):
    blob = ((text or "") + " " + (url or "")).lower()
    flags = []
    for term in ["crypto", "trading", "investment", "free money", "giveaway", "urgent", "scam"]:
        if term in blob:
            flags.append(term)
    return flags


def safe_int(v, default=0):
    try:
        return int(v)
    except Exception:
        return default


def load_ads_from_files():
    candidates = [
        "ads_search_spotify_de_retry.json",
        "ads_search_nike_de_local.json",
        "ads_search_nike_de.json",
    ]
    merged = {"ad_previews": []}
    used = []
    for name in candidates:
        path = SAMPLE_DIR / name
        if not path.exists():
            continue
        payload = read_json(path)
        if payload.get("request_status") == "SUCCESS":
            merged["ad_previews"].extend(payload.get("ad_previews", []))
            used.append(name)
    return merged, used


def main():
    ads, ads_source_files = load_ads_from_files()
    sponsored = read_json(SAMPLE_DIR / "sponsored_content_pages_1_2.json")

    now = datetime.now(timezone.utc)
    ads_rows = []
    sponsored_rows = []

    for item in ads.get("ad_previews", []):
        ad = item.get("ad_preview")
        if not ad:
            continue
        start_date = ad.get("start_date")
        dt = None
        if start_date:
            try:
                dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            except Exception:
                dt = None
        running_days = (now - dt).days if dt else None
        impressions_total = safe_int(ad.get("impressions_total"))
        cpm_low = 4.0
        cpm_high = 9.0
        est_spend_low = round(impressions_total / 1000 * cpm_low, 2)
        est_spend_high = round(impressions_total / 1000 * cpm_high, 2)
        headline = ad.get("headline", "")
        url = (ad.get("web_view_properties") or {}).get("url", "")
        category, sub_category = classify_text(headline + " " + url)
        risk_flags = detect_risk(headline, url)

        ads_rows.append(
            {
                "id": ad.get("id"),
                "platform": "Snapchat",
                "advertiser": ad.get("paying_advertiser_name") or "Unknown",
                "brand": ad.get("brand_name") or ad.get("profile_name") or "Unknown",
                "headline": headline,
                "cta": ad.get("call_to_action"),
                "start_date": start_date,
                "running_days": running_days,
                "impressions_total": impressions_total,
                "impressions_primary_country": safe_int((ad.get("impressions_map") or {}).get("de")),
                "est_spend_low_eur": est_spend_low,
                "est_spend_high_eur": est_spend_high,
                "performance_per_spend_proxy": round(
                    impressions_total / max((est_spend_low + est_spend_high) / 2, 1), 2
                ),
                "category": category,
                "sub_category": sub_category,
                "unknown_category": category == "Unknown",
                "risk_flags": risk_flags,
                "risk_score": min(len(risk_flags) * 2, 10),
                "media_type": ad.get("top_snap_media_type") or "Unknown",
                "creative_url": ad.get("top_snap_media_download_link"),
                "landing_url": url,
                "review_status": ad.get("review_status"),
            }
        )

    sponsored_payload = sponsored
    if isinstance(sponsored, dict):
        sponsored_payload = [sponsored]

    for page in sponsored_payload:
        for item in page.get("ad_previews", []):
            sc = item.get("sponsored_content_preview")
            if not sc:
                continue
            creator = sc.get("creator_name", "Unknown")
            sponsor = sc.get("sponsor_name", "") or "Unknown"
            category, sub_category = classify_text(f"{creator} {sponsor}")
            sponsored_rows.append(
                {
                    "creator_name": creator,
                    "sponsor_name": sponsor,
                    "content_type": sc.get("content_type"),
                    "content_url": sc.get("content_url"),
                    "thumbnail_url": sc.get("thumbnail_url"),
                    "category": category,
                    "sub_category": sub_category,
                }
            )

    sponsor_counts = {}
    creator_counts = {}
    for row in sponsored_rows:
        sponsor = row.get("sponsor_name") or "Unknown"
        creator = row.get("creator_name") or "Unknown"
        sponsor_counts[sponsor] = sponsor_counts.get(sponsor, 0) + 1
        creator_counts[creator] = creator_counts.get(creator, 0) + 1

    top_sponsors = [
        {"sponsor_name": name, "count": count}
        for name, count in sorted(sponsor_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    top_creators = [
        {"creator_name": name, "count": count}
        for name, count in sorted(creator_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    advertisers = {}
    for r in ads_rows:
        key = r["advertiser"]
        advertisers.setdefault(key, {"impressions": 0, "est_low": 0.0, "est_high": 0.0, "ads": 0})
        advertisers[key]["impressions"] += r["impressions_total"]
        advertisers[key]["est_low"] += r["est_spend_low_eur"]
        advertisers[key]["est_high"] += r["est_spend_high_eur"]
        advertisers[key]["ads"] += 1

    leaderboard = [
        {
            "advertiser": k,
            "ads": v["ads"],
            "impressions": v["impressions"],
            "est_spend_low_eur": round(v["est_low"], 2),
            "est_spend_high_eur": round(v["est_high"], 2),
        }
        for k, v in advertisers.items()
    ]
    leaderboard.sort(key=lambda x: x["impressions"], reverse=True)

    output = {
        "generated_at_utc": now.isoformat(),
        "notes": {
            "spend_model": "Very rough proxy from impressions using fixed CPM range 4-9 EUR.",
            "performance_model": "Impressions per estimated euro midpoint.",
            "warning": "Prototype only. Do not treat spend as exact.",
            "ads_source_files_used": ads_source_files,
        },
        "kpis": {
            "ads_count": len(ads_rows),
            "sponsored_content_count": len(sponsored_rows),
            "total_impressions": sum(x["impressions_total"] for x in ads_rows),
            "est_spend_low_total_eur": round(sum(x["est_spend_low_eur"] for x in ads_rows), 2),
            "est_spend_high_total_eur": round(sum(x["est_spend_high_eur"] for x in ads_rows), 2),
            "unknown_category_ratio": round(
                (sum(1 for x in ads_rows if x["unknown_category"]) / max(len(ads_rows), 1)) * 100, 1
            ),
        },
        "sponsored_kpis": {
            "sponsored_rows": len(sponsored_rows),
            "unique_creators": len(creator_counts),
            "unique_sponsors": len(sponsor_counts),
            "top_sponsors": top_sponsors,
            "top_creators": top_creators,
            "scope_note": "Represents sponsored/commercial content endpoint coverage, not full organic platform feed.",
        },
        "leaderboard": leaderboard,
        "ads": ads_rows,
        "sponsored_content": sponsored_rows,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with OUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
