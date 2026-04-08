# Data access — limits and reproduction (Snap / Pinterest)

## Snapchat — Ads Gallery API

**Base:** `https://adsapi.snapchat.com`  
**Auth:** None (public Ads Library endpoints per [Snap docs](https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/using-the-api)).

### `GET /v1/ads_library/ads/{ad_id}`

- **Use:** Full **single-ad** payload by UUID from search results.
- **Observed:** `SUCCESS` for ad id from `ads_search_spotify_de_retry.json` → `ad_detail_by_id.json`.

### `POST /v1/ads_library/sponsored_content/search`

- **Use:** Filter commercial content by **`creator_name`** string.
- **Observed:** `SUCCESS` for `a-000ah` → `sponsored_content_search_creator.json` (1 preview).

### `GET /v1/ads_library/sponsored_content`

- **Use:** Paginated list of **organic commercial content** currently live (Spotlight, etc.).
- **Observed:** Single request returned **200** `ad_previews` and a `paging.next_link` cursor.
- **Limits:** No per-field EU geo in the payload we inspected; this is **not** a substitute for EU **paid ad** rows when the brief requires jurisdiction-scoped ads.
- **Rate limiting:** Low; suitable for building a first pipeline.

### `POST /v1/ads_library/ads/search`

- **Use:** **Paid ads** with EU country filters via `countries` (ISO codes from docs, e.g. `de`, `fr`).
- **Required body:** `paying_advertiser_name` (non-empty). Optional: `start_date`, `end_date`, `status`.
- **Observed (2026-04-07):**
  - **Success:** One call returned **`request_status: SUCCESS`** with **10** `ad_previews` for `paying_advertiser_name: "spotify"`, `countries: ["de"]`, including **`impressions_map.de`**, **`start_date`**, **`paying_advertiser_name`**, creative URLs — saved as `data/samples/2026-04-07-snap-sponsored-content/ads_search_spotify_de_retry.json`.
  - **Rate limits:** The same environment later returned JSON **`E1009`** or HTTP **`429`** on repeated POSTs (and **400** on a raw `GET` to `paging.next_link` — prefer re-POSTing with cursor per current docs if you paginate). Treat as **IP / burst** limits.
- **Pagination:** Response includes `paging.next_link` like `https://adsapi.snapchat.com/v1/ads_library/ads/search?cursor=...`. Per docs, issue **`POST`** to that URL with the **same JSON body** as the first request (see [`scripts/snap_ads_search_page2.sh`](../scripts/snap_ads_search_page2.sh)). Raw **GET** on `next_link` may **400**.
- **Pagination rate limit:** After **120s** cooldown, `POST` to `next_link` still returned **`E1009`** from shared infrastructure — use **your IP**, **proxies**, or **different times of day** for page 2+.
- **Mitigation:** **Sparse** calls, **cache** responses, **long gaps** between brand queries, **paid proxies / residential IP** if you need many rows in one session, **DNS allowlist** for `adsapi.snapchat.com`.

---

## Pinterest — Ads Repository

**Human UI:** `https://www.pinterest.com/ads-repository/` (also reachable via `ads.pinterest.com` → `www`).

- **Official developer API:** Geared to **advertisers** (manage **your** ads, catalogs, analytics), not a documented **public competitor** Ads Repository JSON API in the same way as Snap’s open library endpoints.
- **Third-party:** Apify actors and similar can expose JSON from the Ad Library (paid, separate ToS). Document if used.
- **DNS:** Allowlist **`ads.pinterest.com`** and **`www.pinterest.com`** if filters block `ads.*`.

---

## Checklist before debugging “API broken”

1. `nslookup adsapi.snapchat.com` / `ads.pinterest.com` — NXDOMAIN → DNS filter or resolver issue.
2. Snap `E1009` — backoff / different network / fewer calls.
3. Snap validation error on `ads/search` — include **`paying_advertiser_name`**.
