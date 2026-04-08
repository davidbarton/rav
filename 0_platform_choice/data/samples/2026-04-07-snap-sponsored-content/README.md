# Snap Ads Library — sample fetch (2026-04-07)

## What this proves

- **`ads_search_spotify_de_retry.json`** — **`POST .../ads_library/ads/search`** with **`countries: ["de"]`** — **`request_status: SUCCESS`**, **10** paid ad rows with **`impressions_map.de`**, **`targeting_v2`**, **`start_date`**, **`top_snap_media_download_link`**, **`paying_advertiser_name`**. This is the **EU ad-library** shape the Ravineo brief cares about.
- **`ads_search_spotify_de_page2.json`** — **`POST`** to `paging.next_link` after **120s** wait — **`E1009`** (rate limit); kept as proof of pagination **attempt** and limit behavior.
- **`sponsored_content_page1.json`** — Live response from Snap’s **official** Ads Library API (`request_status: SUCCESS`, **200** `ad_previews` on first page).
- Data fields include **creator_name**, **content_url**, **thumbnail_url**, **content_type** (e.g. SPOTLIGHT), **sponsor_name** / **sponsor_url** where present.

**Sponsored content** is **organic commercial content** currently live on Snap (per [Ads Gallery API](https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/Introduction)), not the same row shape as **paid ads** from `POST .../ads_library/ads/search`.

## Reproduce

No OAuth. From a shell:

```bash
curl -sS -o sponsored_content_page1.json \
  'https://adsapi.snapchat.com/v1/ads_library/sponsored_content'
```

Paginate with `paging.next_link` from the JSON.

## EU paid ads (repository-style)

Use documented search (requires **paying advertiser name** + EU `countries` + dates):

```bash
curl -sS -X POST 'https://adsapi.snapchat.com/v1/ads_library/ads/search' \
  -H 'Content-Type: application/json' \
  -d '{
    "paying_advertiser_name": "spotify",
    "countries": ["de"],
    "start_date": "2025-09-01T00:00:00.000Z",
    "end_date": "2026-04-07T00:00:00.000Z",
    "status": "ACTIVE"
  }'
```

**Working sample:** `ads_search_spotify_de_retry.json` (10 ads, DE impressions). **Burst limits:** repeated POSTs may return **`E1009`** or **HTTP 429** — space requests, use **proxies** if you need 50+ rows quickly; allowlist **`adsapi.snapchat.com`** if using DNS filters.

## Files

| File | Description |
|------|-------------|
| `sponsored_content_page1.json` | First page of sponsored commercial content (~200 items) |
| `sponsored_content_pages_1_2.json` | Two pages via [`scripts/paginate_snap_sponsored_content.py`](../../scripts/paginate_snap_sponsored_content.py) (~400 items) |
| `ads_search_spotify_de_retry.json` | **SUCCESS** — EU (DE) paid ads from Ads Library search |
| `ads_search_spotify_de_body.json` | Request body for Spotify DE (reuse for pagination) |
| `ads_search_spotify_de_page2.json` | **`E1009`** — page-2 `POST` after 120s (rate limit sample) |
| `ads_search_spotify_de_fr.json` | Earlier error / rate-limit payload |
| `ads_search_nike_de.json` | Rate-limited attempt |
| `ad_detail_by_id.json` | **`GET .../ads/{ad_id}`** — single-ad detail (`SUCCESS`) |
| `sponsored_content_search_creator.json` | **`POST .../sponsored_content/search`** — `creator_name` from sample |

**Pagination (paid ads):** extract `paging.next_link` from a successful `ads/search` response, then:

```bash
# From repository root:
0_platform_choice/scripts/snap_ads_search_page2.sh '<paste next_link URL>' \
  0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/ads_search_spotify_de_body.json
```

Use **POST** with the **same JSON body** as page 1 (per Snap docs). Expect **429** if you burst; wait several minutes between pages.

Limits and DNS notes: [`notes/limits.md`](../../notes/limits.md). Pinterest: [`docs/pinterest-phase-a.md`](../../docs/pinterest-phase-a.md).
