# Snapchat — Complete Map of Available Data Sources

> **14 data sources** for Snapchat advertising and creator intelligence — all tested hands-on. Snap Star / Collab Studio evaluated and dismissed (agency-gated, zero public data). Verified 2026-04-09.

---

## TL;DR — 14 Data Sources

### Advertising Data (Official APIs)

| #   | Source                                               | Auth                      | Scope                                           | Bulk?       | Status (2026-04-08)                                               |
| --- | ---------------------------------------------------- | ------------------------- | ----------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| 1   | **Ads Gallery API** (EU Ad Library)                  | **None**                  | All paid ads in EU, last 12 months              | Per-brand   | **ACTIVE** — working, rate-limit constrained, needs proxy scaling, very hard |
| 2   | **Sponsored Content API** (organic commercial)       | **None**                  | Live organic branded content globally           | Browsable   | **FINAL** — 535 pages, 230k deduplicated rows. Cursor expiry prevents full enumeration. |
| 3   | **Political Ads Library** (bulk ZIP)                 | **None**                  | Political/advocacy ads, 2018–2026               | Bulk CSV    | **COMPLETE** — 74,609 ads, 9 years, $117.5M spend      |
| 4   | **Marketing API** (Ads API)                          | **OAuth 2.0**             | Own campaigns — CRUD + stats                    | Per-account | **BLOCKED** — requires advertiser account with spend             |

### Creator / Influencer Data (Free Scraping)

| #   | Source                                        | Auth                       | Scope                                                                    | Bulk?         | Status (2026-04-08)                                                           |
| --- | --------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------- |
| 5   | **Public Profile Web Pages** (scraping)       | **None (User-Agent only)** | Full profile: subscribers, bio, spotlights, engagement, related creators | Per-username  | **VERIFIED WORKING** — simple HTTP GET, rich data, no headless browser needed |
| 6   | **`/explore/<keyword>` Discovery** (scraping) | **None (User-Agent only)** | Creator discovery — profiles, spotlights, publishers                     | Per-keyword   | **VERIFIED WORKING** — 246 creators + 39M views from 13 keywords, scraper built, 3 tables in DB |
| 7   | **Spotlight Web Pages** (scraping)            | **None**                   | Public Spotlight videos with views, **transcripts**, comments            | Per-video     | **VERIFIED WORKING** — transcripts unique here, engagement also on profiles   |
| 8   | **Story.snapchat.com** (public stories)       | **None**                   | Public stories from verified/public accounts                             | Per-username  | **SKIP** — media-only, zero engagement metrics, ephemeral, verified-only      |

### Partner-Gated APIs (Achievable with Outreach)

| #   | Source                                               | Auth                      | Scope                                           | Bulk?       | Status (2026-04-08)                                               |
| --- | ---------------------------------------------------- | ------------------------- | ----------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| 9   | **Public Profile API**                               | **OAuth 2.0** (allowlist) | Creator discovery + profile metrics             | Per-request | **BLOCKED** — requires Snap partnership for allowlisting; achievable but needs weeks of outreach |
| 10  | **Story Kit API** (official GraphQL)                 | **Partner JWT**           | Public stories search by location, time, caption | GraphQL     | **BLOCKED** — requires Snap advocate; achievable with outreach, low priority  |

### Transparency & Compliance

| #   | Source                                               | Auth                      | Scope                                           | Bulk?       | Status (2026-04-08)                                               |
| --- | ---------------------------------------------------- | ------------------------- | ----------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| 11  | **DSA Transparency Reports**                         | **None**                  | Moderation stats, enforcement data, ads moderation | Bulk XLSX/CSV | **COMPLETE** — 21+ reports (since 2015), XLSX + CSV, 17 tables in DuckDB |
| 12  | **EC DSA Transparency Database** (statements of reasons) | **None** (bulk) / **EU Login** (API) | Per-action moderation metadata across all VLOPs  | Daily CSV/Parquet ZIPs | **ACTIVE** — per-platform S3 ZIPs verified; full Snapchat history downloadable; pipeline `data_sources/dsa_transparency/` |
| 13  | **DSA Researcher Access**                            | **Application**           | Content data under DSA Art.40                   | Unknown     | **DEAD END** — non-commercial only, painful process, even academics rejected |

### Reference

| #   | Source                                        | Auth                       | Scope                                                                    | Bulk?         | Status (2026-04-08)                                                           |
| --- | --------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------- |
| 14  | **Third-Party Scrapers + OSINT Tools**        | **API key / paid / free**  | Same data as §5–§7 — packaged as APIs or open-source scripts             | Per-request   | **REVERSE-ENGINEERED** — we can replicate everything for free                 |

**§12 is not Snap-only:** The EC Transparency Database (row 12) is an **EU-wide, multi-provider** dataset (every designated VLOP submits statements of reasons). For Snapchat-only analysis, use per-platform bulk downloads or filter on `platform_name`. It is **moderation decision metadata**, not first-party Snap ad or product analytics — pair it with §11 for governance context.

**Still blocked (no free path):** audience demographics (age/gender/country), detailed analytics (daily views, growth trends), private engagement metrics (DMs, close friends), historical creator activity (must build via periodic re-scraping).

### Deliberately out of scope

The following surfaces were **not** pursued as primary sources: no credible unauthenticated bulk path, **redundant** with §1–§14, or **outside** ads / public creators / compliance. Listed so “did you check everything on Snap?” has a written answer.

| Surface | Rationale |
| --- | --- |
| **Snap Star / Collab Studio** | **Partner- or agency-gated**; no public API useful for our goals (see opening note). |
| **Story.snapchat.com** | **SKIP** — §8: web Stories are media-heavy, metrics-poor, ephemeral. |
| **Lens Studio / Lenses / Snap AR** | **In-app distribution**; no EU Ad Library–style bulk export for third-party research comparable to §1. |
| **Snap Map** | **App-embedded** social map; no stable public research feed at the scale we need. |
| **Chat, Memories, friend-only / private Stories** | **No public access** (and not appropriate targets). |
| **Games, Minis, Bitmoji, generic consumer product UIs** | **Out of scope** for advertising and creator-intelligence mapping. |
| **Snap Pixel / Conversions API** | **Advertiser credentials only** — same access class as Marketing API (§4). |
| **Snap Kit** (Login, Creative Kit, etc.) | **Per-app, user-consent-gated**; not a platform-wide open dataset. |

---

## 1. Ads Gallery API (EU Ad Library) — `PRIMARY SOURCE`

### What it is

Public, **unauthenticated** API backing [adsgallery.snap.com](https://adsgallery.snap.com/). Mandated by the EU Digital Services Act. Contains **all paid ads delivered in EU member states in the last 12 months**.

### Endpoints

#### Search Ads by Brand

```
POST https://adsapi.snapchat.com/v1/ads_library/ads/search
Content-Type: application/json
(no auth header needed)
```

**Body parameters:**

For the complete supported `countries` values, refer to the official API documentation on the web.


| Param                    | Type     | Required | Notes                                                        |
| ------------------------ | -------- | -------- | ------------------------------------------------------------ |
| `paying_advertiser_name` | string   | Yes      | Advertiser name (fuzzy match)                                |
| `countries`              | string[] | Yes      | ISO 2-letter, EU only: de, fr, nl, cz, pl, etc. (27 EU + tr) |
| `start_date`             | ISO date | No       | e.g. `2025-09-01T00:00:00.000Z`                              |
| `end_date`               | ISO date | No       |                                                              |
| `status`                 | string   | No       | `ACTIVE` or `PAUSED`                                         |


**Pagination:** response contains `paging.next_link` → append `?cursor=...` to next `POST` with same body.

#### Get Single Ad Detail

```
GET https://adsapi.snapchat.com/v1/ads_library/ads/{ad_id}
(no auth)
```

### Response Fields (verified from real data)

```
ad_preview:
  id                          — UUID
  name                        — internal creative name (often encodes metadata)
  ad_account_name             — e.g. "Spotify-OneVibe-EMEA"
  status                      — ACTIVE | PAUSED
  creative_type               — WEB_VIEW | COMPOSITE | DEEP_LINK | ...
  ad_type                     — REMOTE_WEBPAGE | STORY | DEEP_LINK | SNAP_AD | ...
  ad_render_type              — STATIC | ...
  languages                   — ["de", "en"]
  headline                    — ad copy headline
  call_to_action              — MORE | SIGN UP | LISTEN | ...
  top_snap_media_type         — VIDEO | IMAGE
  top_snap_crop_position      — MIDDLE | ...
  top_snap_media_download_link — CDN URL to actual video/image creative
  start_date                  — ISO timestamp
  impressions_total           — integer (total across all EU)
  impressions_map             — { "de": 169998, "fr": 0, ... } per EU country
  targeting_v2:
    regulated_content          — boolean
    demographics[]:
      min_age                  — string "18"
      max_age                  — string "34" (optional)
      age_groups               — []
      languages                — []
      operation                — INCLUDE
      advanced_demographics    — []
    devices[]:
      os_type                  — iOS | ANDROID
      marketing_name           — []
      model                    — []
      carrier_id               — []
  paying_advertiser_name      — "Spotify USA Inc."
  brand_name                  — "SpotifyDE"
  profile_name                — "Spotify"
  profile_logo_url            — CDN URL
  web_view_properties:
    url                        — landing page URL (contains UTM params!)
  deep_link_properties:
    deep_link_uri              — app deep link
    icon_media_url             — ...
  composite_preview:           — for STORY ads: array of ad_snaps
  review_status               — APPROVED | REJECTED | ...
  rejection_reasons            — []
  stickers                    — []
```

### Rate Limits — THE REAL PROBLEM (Empirical, 2026-04-08)

The `/ads/search` endpoint appears to enforce strong anti-automation controls. This section documents the behaviors we observed through repeated real requests across multiple proxy types, cloud providers, and regions.

Note that we have not even been able to get full records for some companies, those limits are that aggressive. Yet it seems like it is solvable with use of some clever engineering and massive IP pools. Apify seems to be able to download those.

#### What we actually see (final crawl — ~57k logged requests)

Our production fetcher (Webshare datacenter rotating proxy, 216 fashion brand list, 27 EU countries) logged ~57,300 requests across multiple retry passes:

| Status | Cells | Share |
| --- | --- | --- |
| `no_ads` (0 results, confirmed empty) | 5,079 | 87.5% |
| `rate_limited` (E1009, unresolved) | 407 | 7.0% |
| `fetched` (real data) | 319 | 5.5% |

**93% of all brand×country cells resolved** (fetched or confirmed no_ads). The remaining 7% are stuck behind persistent rate limits. The **dominant failure mode is E1009 rate limiting**, not silent zero-result responses. Many brand+country pairs were successfully fetched multiple times across different proxy IPs, which means the rate limit resets — it is not a permanent one-shot-per-IP lock.

Soft blocks are rare — most `no_ads` responses are genuinely empty (small brand in a small market).

#### Rate limit budget and cooldown

Per-IP budget appears to be small (roughly 1–3 successful `/ads/search` responses before E1009 kicks in). The cooldown duration is **unknown** — it could be hours. We have not yet systematically measured it.

This is not documented anywhere. Snap's official docs only mention "rate limiting."

#### Soft block vs hard block

Early GCP Cloud Run experiments showed a "soft block" pattern (HTTP 200, `request_status: "SUCCESS"`, `ads: []` — looks like success but empty). The production Webshare datacenter proxy and Evomi residential proxy both see "hard blocks" instead (HTTP 200, `error_code: "E1009"`, "Too many requests").

| IP Source | Observed response | Seen on |
| --- | --- | --- |
| **GCP Cloud Run** (direct, no proxy) | HTTP 200, `"SUCCESS"`, `ads: []` (soft block) | GCP us-central1, us-west1 |
| **Webshare DC rotating** (production) | HTTP 200, `"E1009"`, "Too many requests" (hard block) | Production fetcher (~57k requests) |
| **Evomi residential rotating** | HTTP 200, `"E1009"`, "Too many requests" (hard block) | Early test (60 requests) |

The soft block pattern appears specific to GCP's own IP ranges, not datacenter IPs in general. The production Webshare DC proxy gets explicit E1009 errors — which are easy to detect and retry.

#### Subnet-level tracking (unconfirmed theory)

During early GCP testing there was some evidence of `/24` subnet-level throttling:

**Evidence (GCP Cloud Run, us-west1):**
- Request 1: `34.34.253.161` → Zalando DE → **real ads returned**
- Request 2: `34.34.253.160` → Nike DE → **0 ads**
- Request 3: `34.34.253.97` → BMW DE → **0 ads**
- Request 4: `34.34.253.224` → Amazon DE → **0 ads**

All 4 IPs were from different containers (verified via `process.exit` trick + `x-req-count: 1`), genuinely different IPs. All share `34.34.253.0/24`. Only the first request returned data. Not confirmed — just a hypothesis from one session.

#### ASN-level awareness (datacenter IPs)

Some cloud provider IP ranges appear pre-blocked entirely:

| GCP Region | Result | Notes |
| --- | --- | --- |
| us-central1 | Soft block | Worked initially, degraded |
| us-west1 | Soft block | Worked initially, degraded |
| europe-west1 | **Hard block** | Never worked — `E1009` on first request |
| us-east1 | **Hard block** | Never worked |
| asia-east1 | **Hard block** | Never worked |

Some GCP regions' IP ranges may be entirely burned — likely abused by other scrapers before us. This is specific to GCP's ASN; the production Webshare DC proxy uses different ASNs and works (with rate limiting).

#### Backoff duration: unknown

An IP that returned data went to E1009 within seconds and did not recover during a ~3 hour session. Could be a 24h+ rolling window (Apify scraper docs recommend "batches of 200-500 to avoid rate limits"), but we have no confirmed measurement yet.

#### Proxy comparison

| Proxy Type | Provider | Sample Size | Success Rate | Block Type | Notes |
| --- | --- | --- | --- | --- | --- |
| **DC rotating** | Webshare | ~57,300 requests | **~9%** | E1009 hard block | Production fetcher; accumulates via multi-pass retry (93% cells resolved) |
| **Residential rotating** | Evomi | 60 requests | **0%** | E1009 hard block | Early test; untested at scale |
| **GCP Cloud Run** (direct) | GCP | ~12 requests | **~17%** | Soft block (0 ads) | Early POC; subnet-level throttling |

The production fetcher uses **Webshare datacenter rotating proxy** at ~9% per-request success (~57,300 total requests). Low per-request, but the multi-pass retry strategy resolves 93% of cells — 100 brands with ads across 23 countries in the final dataset.

#### Pagination compounds the problem

**Page size**: `/ads/search` returns ~10 ads per page (not configurable). Brands with many active ads require multiple pages.

**Cursor mechanics**: Each response includes a `paging.next_link` URL with a unique cursor token. You must POST the same JSON body to this URL to get the next page. Each cursor is a unique server-side reference — it is **not** a simple offset.

**Cursor expiry**: Cursors have an unknown TTL and **do expire**. For `/sponsored_content`, we confirmed that stopping a crawl and resuming hours/days later results in E1008 ("validation error") on every saved cursor — not just the last page, but cursors from the middle of the run too. The entire chain rots. The only fix is a fresh crawl from scratch.

**Cursor-scoped rate limiting**: For `/sponsored_content`, the rate limit is tied to the cursor/session, not purely per-IP. A rotating proxy does not bypass it — a steady ~30s interval between pages is what matters. For `/ads/search`, the rate limit appears per-IP, so a rotating proxy is effective.

**Impact with rotating proxy**: Every page request from `/ads/search` gets a different exit IP. At ~9% per-request success rate, completing multi-page brands in a single pass is unlikely. Our solution: save the cursor to disk and retry across multiple passes, needing only 1 fresh successful request per remaining page.

#### Practical impact on data collection

Final production run (Fashion & Beauty, 216 brands × 27 EU countries):
- **~57,300 HTTP requests** across multiple retry passes
- **100 brands** with data across **23 countries** (720 unique brand×country cells with ads)
- **5,701 ad rows** in DuckDB (4,089 unique ads, 435 distinct advertisers)
- **5,079 cells** confirmed empty (no ads), **407 cells** still rate-limited (7%)
- Multi-pass retry strategy resolved 93% of all brand×country cells

The API is technically "public" and "unauthenticated," but the rate limiting makes bulk data collection require proxy infrastructure. The irony: this is a DSA-mandated transparency tool.

#### Authentication: Confirmed Non-Existent

We tested sending `Authorization: Bearer <token>` headers. The API silently ignores them — no error, no different behavior. There is no authenticated tier, no API key, no way to get a higher rate limit. The rate limit is the same for everyone.

### No Advertiser Discovery — THE OTHER BIG PROBLEM

The API has **no way to list advertisers**. There is no wildcard search, no "list all ads" endpoint, no browse/enumeration capability. You **must** supply a `paying_advertiser_name` string for every search request. If you don't know who's advertising on Snap, this API won't tell you.

#### What we confirmed

- **`paying_advertiser_name` is required.** Omitting it or sending `""` returns E3024 validation error.
- **Fuzzy/prefix matching works.** The field matches against the legal entity name (e.g., "Nike, Inc."), but brand-name inputs ("Nike", "Zalando", "Ikea") also work — the API does fuzzy/prefix matching. Case-insensitive.
- **Single-character queries pass validation** but are useless in practice. Searching `"a"` returns results for some advertiser starting with "a", but combined with rate limits (~9% success), you'd burn thousands of requests to enumerate a single letter.
- **The response reveals the full legal entity name** in `paying_advertiser_name` (e.g., "Nike, Inc.", "adidas AG", "Spotify USA Inc."). So once you find a brand, you learn the legal name — but you need to know the brand first.
- **No cross-referencing possible.** You cannot search by category, industry, spend level, impression count, or any other dimension. The only input is a name string.

#### Why this matters

For research purposes, you need **prior knowledge** of every advertiser you want to study. There is no way to answer "who is advertising on Snap?" using this API alone. You can only answer "is brand X advertising on Snap, and if so, what are they running?"

#### Our workaround

We maintain a **curated brand dictionary** (`brands_fashion.json`) — 216 Fashion & Beauty brands with brand name, parent group, and sub-category. This was compiled manually from Ravineo's target verticals. We search each brand × each country, iterating the full matrix.

This means we have a **known blind spot**: any advertiser not in our list is invisible to us. Expanding coverage requires manually adding brands, which is feasible for targeted verticals but not for "all advertisers on Snap."

Potential discovery channels (untested):
- **Apify scrapers** may have built their own advertiser lists
- **Sponsored Content API** (§2) reveals `sponsor_name` — brands actively sponsoring creators, which could feed back into the ads search list

### What's Missing

- **EU only** — non-EU ads not included (DSA mandate).
- **12-month window** — older ads disappear permanently.
- **No spend data** — only impression counts. Spend is only available for political ads (§3).
- **No engagement metrics** — no swipes, no completions, no video views.

### Workaround Strategy (What We Built)

1. **Brand dictionary**: Curated list of 216 Fashion & Beauty brands from Ravineo's target verticals
2. **Rotating datacenter proxy** (Webshare): ~9% per-request success rate, accumulates over multiple retry passes across 27 EU countries
3. **Cursor persistence**: Pagination state saved to disk; each retry resumes from where it left off
4. **Never-regress policy**: Code refuses to overwrite existing data with fewer results (protects against data loss)
5. **Status matrix**: Per-brand × per-country tracking showing fetched/partial/empty/blocked at a glance

---

## 2. Sponsored Content API (Organic Commercial Content)

### What it is

Lists organic branded/commercial content **currently live on Snap** — creator posts with sponsor relationships, Spotlight content with brand tags, etc. This is NOT paid ads — it's organic commercial content.

### Endpoints

#### List All Sponsored Content (browsable!)

```
GET https://adsapi.snapchat.com/v1/ads_library/sponsored_content
(no auth)
```

Paginate via `paging.next_link`. Supports `limit` query param (default ~200, max 500). Our fetcher uses `limit=500`.

#### Search by Creator Name

```
POST https://adsapi.snapchat.com/v1/ads_library/sponsored_content/search
Content-Type: application/json

{"creator_name": "honeybear"}
```

Optional: `cursor`, `limit` query params.

### Response Fields (verified from real data)

```
sponsored_content_preview:
  sponsor_name        — brand/sponsor display name
  sponsor_url         — snapchat.com/add/... profile link
  creator_name        — creator username
  creator_url         — snapchat.com/add/... profile link
  content_type        — SPOTLIGHT | STORY | ...
  content_url         — snapchat.com/spotlight/... direct link to content
  thumbnail_url       — CDN image URL
```

### Key Properties

- **No authentication required**
- **Browsable without search terms** — you can paginate through ALL content
- Creator ↔ sponsor relationships visible
- Content type classification included
- Direct links to actual content

### Rate Limits and Operational Challenges

Unlike `/ads/search` where the rate limit is per-IP, the `/sponsored_content` rate limit is **cursor/session-scoped**. A rotating proxy does not bypass it — the cursor token encodes session context. What matters is the **interval between requests**.

#### Stable throughput: ~2 pages/min

Empirically determined optimal interval is **30 seconds** between requests. Faster intervals trigger E1009 progressive penalties:

| Interval | Result |
| --- | --- |
| 21s | E1009 every 3rd request |
| 25s | E1009 ~3 per 10 pages |
| 28s | E1009 ~6 per 10 pages |
| **30s** | **Zero errors** — ~2 pages/min sustained |

At 500 items/page and 2 pages/min, a full crawl produces ~60,000 items/hour. Observed production rate across two runs: **~1.4–1.5 pages/min** (~83–89 pages/hr), slightly below theoretical due to retries and E1009 backoff.

#### Page size: configurable up to 500

The `limit` query param controls page size. Default is ~200. Tested: `limit=200` → 200, `limit=500` → 500, `limit=1000` → capped at 500. Our production fetcher uses `limit=500` to minimize total pages needed.

#### Cursor expiry — the biggest operational hazard

Every `paging.next_link` contains a cursor token with an **unknown TTL**. If you stop a crawl and come back later (hours or days), **every saved cursor is dead** — not just the last page. We verified this by testing cursors from the middle of a run (hundreds of pages in) with curl: E1008 ("validation error") every time.

**What does NOT work:**
- Deleting the last page file and retrying — earlier cursors are also expired
- Switching proxy or going direct IP — it's the cursor that's expired, not an IP issue
- Waiting longer — cursors don't come back

**What works:**
- Archive the partial run (move to `partial_snapshots/`)
- Start a completely fresh crawl from page 0 in a new directory
- Run without interruption until complete

#### E1008 vs E1009

| Error | Meaning | Cause | Fix |
| --- | --- | --- | --- |
| **E1008** | "validation error" | Expired cursor, or cursor/IP mismatch from rotating proxy | If expired: start fresh crawl. If proxy mismatch: retry (transient) |
| **E1009** | "Too many requests" | Going too fast, progressive penalty | Slow down; each hit makes the next window more restrictive |

E1008 from a rotating proxy is transient — the cursor was issued to one exit IP but the next request arrived from a different one. Retries with normal throttle interval resolve it. But E1008 from a stale cursor is permanent.

#### Our crawl history

| Run | Status | Pages | Items | Duration | Notes |
| --- | --- | --- | --- | --- | --- |
| **Run 1** (2026-04-08) | Partial — cursor expired | 882 | ~176,400 | ~7h | Stopped, cursors rotted, archived to `partial_snapshots/` |
| **Run 2** (2026-04-09, attempt 1) | Partial — stopped | 539 | ~269,500 | ~4h | Paused, cursors expired again |
| **Run 3** (2026-04-09, attempt 2) | **Final** | 535 | ~267,500 | ~4h | Stopped — cursor expired again. Abandoned further attempts. |

Each restart loses progress and re-fetches from page 0. The total dataset size is unknown — no run completed before cursors expired. **Run 3 is the loaded dataset**: 535 pages → 230,267 deduplicated rows in `sponsored_content` (178k unique content URLs, 62k creators, 3k named sponsors). Earlier runs archived in `partial_snapshots/` (not loaded).

#### Why ~92% have empty `sponsor_name`

The vast majority of records have `sponsor_name=""`. Only ~8% name an actual brand. Three likely reasons:

1. **Snapchat's own Spotlight monetization** — Snap pays creators directly via Spotlight Rewards / Creator Fund. Content is commercially monetized but no external brand sponsor exists.
2. **EU DSA transparency obligation** — the Digital Services Act forces disclosure of ALL commercially incentivized content, sweeping in every monetized Spotlight video, not just brand deals.
3. **Weak creator disclosure compliance** — creators do paid promos without tagging the brand. Snap may flag content as sponsored algorithmically but can't fill the brand name.

The ~8% with `sponsor_name` are the high-signal records — real brand↔creator partnerships for influence mapping. The unbranded entries still reveal who the active monetized creators are.

### What's Missing

- No impression counts or engagement metrics
- No temporal range — only "currently live", no historical archive
- No targeting or demographic data
- Sponsor identification appears self-reported by creators

---

## 3. Political Ads Library (Bulk CSV Download)

### What it is

Snap's voluntary transparency initiative for political and advocacy advertising. **Bulk downloadable** as ZIP files containing CSV data, annually since 2018.

### Download URLs

```
https://storage.googleapis.com/ad-manager-political-ads-dump/political/2018/PoliticalAds.zip
https://storage.googleapis.com/ad-manager-political-ads-dump/political/2019/PoliticalAds.zip
...
https://storage.googleapis.com/ad-manager-political-ads-dump/political/2026/PoliticalAds.zip
```

### CSV Schema (verified)


| Column                                  | Description                    |
| --------------------------------------- | ------------------------------ |
| AD ID                                   | Unique identifier              |
| CreativeURL                             | Link to creative asset         |
| Spend                                   | Actual spend in local currency |
| Impressions                             | Total impression count         |
| Currency Code                           | Currency of spend              |
| Start Date                              | Campaign start                 |
| End Date                                | Campaign end                   |
| Organization Name                       | Org behind the ad              |
| BillingAddress                          | Address of billing entity      |
| PayingAdvertiserName                    | Who paid                       |
| Committee Name                          | Political committee            |
| Committee Identification Number         | Official ID                    |
| Disclosure Name Of Committee            | Disclosure name                |
| CandidateBallotInformation              | Candidate/office/ballot info   |
| Advertising Jurisdiction                | Geographic jurisdiction        |
| Gender                                  | Targeting: gender              |
| AgeBracket                              | Targeting: age range           |
| CountryCode                             | Targeting: country             |
| Regions (Included/Excluded)             | Targeting: regions             |
| Electoral Districts (Included/Excluded) | Targeting: districts           |
| Radius Targeting (Included/Excluded)    | Targeting: radius              |
| Metros (Included/Excluded)              | Targeting: metro areas         |
| Postal Code (Included/Excluded)         | Targeting: postal codes        |
| Location Categories (Included)          | Targeting: location categories |


### Key Properties

- **Trivially easy to acquire** — no auth, no rate limits, no API calls. Just download ZIPs from a public GCS bucket. All 9 years total ~15 MB compressed, ~46 MB uncompressed CSV. The largest single year (2024) is 4.7 MB zipped. Download and parse in seconds.
- **Actual spend data** (not just impressions) — **unique among all Snap sources**. Commercial ads (§1) only expose impression counts, never spend. Political ads have both.
- Full targeting breakdown (geo, demo, device)
- Committee/organization transparency chain
- Available from 2018 onward (9 years of history)
- Web UI at [snap.com/political-ads](https://www.snap.com/political-ads) for browsing

### Strategic Value of Spend Data

The spend + impressions combination in political ads can be used to **estimate cost-per-impression (CPM) on Snapchat** — a metric that is not available from any other Snap data source. Since commercial ads (§1) report impressions but never spend, we can cross-reference political ad CPMs to produce **ballpark spend estimates for commercial ads** based on their impression counts.

This is approximate (political ad pricing likely differs from commercial), but it provides a directional benchmark where none exists otherwise. With 74,600+ political ads across 54 countries and multiple years, we have enough data to compute CPM ranges by country, time period, and targeting profile.

### What's Missing

- Political/advocacy ads only — no commercial
- Creative URLs may expire over time

---

## 4. Marketing API (Ads API) — Authenticated, Advertiser-Only

### What it is

Full programmatic control over advertising lifecycle. **Requires OAuth 2.0 authentication** and an active ad account. This is for advertisers managing their own campaigns.

### Entity Hierarchy

```
Organization
  └── Funding Sources
  └── Ad Accounts
        └── Media (video/image files)
        └── Creatives (media + metadata)
        └── Audience Segments
        └── Campaigns
              └── Ad Squads (targeting, budget, bid)
                    └── Ads (creative → ad squad link)
```

### Key Endpoint Categories


| Category          | Base Pattern                             | Purpose               |
| ----------------- | ---------------------------------------- | --------------------- |
| Organizations     | `/v1/organizations/...`                  | Org management        |
| Ad Accounts       | `/v1/adaccounts/...`                     | Account CRUD          |
| Campaigns         | `/v1/campaigns/...`                      | Campaign management   |
| Ad Squads         | `/v1/adsquads/...`                       | Squad management      |
| Ads               | `/v1/ads/...`                            | Ad CRUD               |
| Creatives         | `/v1/adaccounts/{id}/creatives`          | Creative management   |
| Media             | `/v1/adaccounts/{id}/media`              | Upload video/image    |
| Measurement       | `/v1/{entity}/{id}/stats`                | Performance data      |
| Audience Insights | `/v1/adaccounts/{id}/targeting_insights` | Audience analysis     |
| Customer Lists    | `/v1/adaccounts/{id}/segments`           | First-party audiences |
| Product Catalogs  | `/v1/organizations/{id}/catalogs`        | DPA product feeds     |


### Measurement/Stats Endpoint

```
GET /v1/{campaigns|adsquads|ads|adaccounts}/{id}/stats
  ?granularity=TOTAL|DAY|HOUR
  &start_time=...
  &end_time=...
```

**Available metrics:**

- `impressions`, `swipes`, `spend`
- `quartile_1`, `quartile_2`, `quartile_3`, `view_completion`
- `screen_time_millis`

Stats update ~every 15 minutes.

### Audience Insights

```
POST /v1/adaccounts/{id}/targeting_insights
```

Returns demographic distributions, audience size estimates, and index comparisons across dimensions: demo, geo, device, interest, engagement, aggregated.

### Dynamic Product Ads

Automates ad creation from product catalog feeds. Requires catalog setup, feed URL, and scheduled ingestion.

### Access Requirements

1. Business Manager account
2. OAuth app registration
3. API access application at [businesshelp.snapchat.com](https://businesshelp.snapchat.com/s/article/api-apply)
4. Approved by Snap

### Relevance to Ravineo

**HIGH for validation** — while this API is designed for advertisers managing their own campaigns, it exposes **real spend, engagement, and performance data** (impressions, swipes, spend, video completion rates, screen time) that we cannot get from any public source. If Ravineo's customers grant read access to their ad accounts via OAuth, this becomes a ground-truth dataset to **cross-reference and validate** all the estimates we derive from public impression counts and political ad CPMs. The targeting taxonomy is also valuable reference material. Access requires convincing customers to share — effort, but entirely achievable.

---

## 5. Public Profile Web Pages (Scraping) — `VERIFIED WORKING, RICH DATA`

### What it is

Every Snapchat user with a Public Profile has a web-accessible page. Both URL patterns return **identical data**:

```
https://www.snapchat.com/add/<username>     — "add friend" page
https://story.snapchat.com/s/<username>     — alias (same data)
```

### How to extract data — THE CORE TECHNIQUE

**Simple HTTP GET + parse. No headless browser, no special cookies, no auth.**

This is the exact same technique used by every Apify scraper, ScrapeCreators, SnapIntel, and all other 3rd-party tools (§14). They charge money for what is literally:

```python
import urllib.request, json, re

url = f"https://www.snapchat.com/add/{username}"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req).read().decode("utf-8")
match = re.search(r'<script[^>]*type="application/json"[^>]*>(.*?)</script>', html, re.DOTALL)
data = json.loads(match.group(1))
page_props = data["props"]["pageProps"]
profile = page_props["userProfile"].get("publicProfileInfo", {})
```

**Critical requirement**: Must send a `User-Agent` header mimicking a real browser. Without it, Snap returns minimal data.

### Account type determines data richness

Two profile types exist:


| Account type                         | `userProfile` key   | Full data?                                           | Example                               |
| ------------------------------------ | ------------------- | ---------------------------------------------------- | ------------------------------------- |
| **Public Profile** (set up by user)  | `publicProfileInfo` | YES — subscribers, bio, spotlights, related accounts | `nike`, `kingbach`, `zane`, `garyvee` |
| **Regular user** (no public profile) | `userInfo`          | NO — only username, displayName, snapcode            | `djkhaled`, `charlidamelio`           |


Our initial test used `djkhaled` who has NO Public Profile — that's why data was minimal. **The technique works perfectly for accounts with Public Profiles.**

### Data available (VERIFIED hands-on 2026-04-08)

Tested with `kingbach` (2.7M subs), `garyvee` (767K subs), `nike` (brand), `zane` (1.5M subs):

```
pageProps.userProfile.publicProfileInfo:
  username               — "kingbach"
  title                  — "KingBach" (display name)
  subscriberCount        — "2708400"  (actual number, string)
  bio                    — "Hey what's up I'm King Bach..."
  badge                  — 1 (verified)
  websiteUrl             — external link
  address                — "Beaverton, Oregon, United States" (when set)
  profilePictureUrl      — CDN URL
  squareHeroImageUrl     — CDN hero image
  snapcodeImageUrl       — SVG snapcode
  categoryStringId       — profile category
  subcategoryStringId    — subcategory
  publisherType          — publisher classification
  businessProfileId      — UUID
  hasStory               — boolean
  hasCuratedHighlights   — boolean
  hasSpotlightHighlights — boolean
  creationTimestampMs    — account creation date (!)
  lastUpdateTimestampMs  — last profile update

  relatedAccountsInfo[]: — 0-3 related creators with FULL profile data each
    publicProfileInfo:
      username, title, subscriberCount, badge,
      profilePictureUrl, hasStory, businessProfileId, ...
    subscribeLink:
      deepLinkUrl, iosAppStoreUrl, ...

pageProps.spotlightStoryMetadata[]: — per-spotlight engagement (kingbach: 27 items!)
  engagementStats:
    viewCount            — 47722 (integer)
    shareCount           — 150
    commentCount         — 23
    recommendCount       — 441
    boostCount           — 4501
  videoMetadata:
    name                 — video title
    description          — video description
    durationMs           — 71500
    width, height        — 540x960
    contentUrl           — CDN video URL (direct MP4 link!)
    uploadDateMs         — 1775324672387 (precise timestamp)
    creator              — creator info
    shareCount, viewCount — duplicated here
  llmTitle               — "AI-generated title" (Snap's own AI description!)
  llmDescription         — "AI-generated description" (!)
  llmKeywords            — "police stop prank, traffic stop comedy, ..."
  hashtags[]             — content hashtags
  description            — original creator description
  contextCards, s2iTags, textMetadataKeywords — additional metadata

pageProps.spotlightHighlights[]: — spotlight content cards
  storyId                — unique spotlight ID
  thumbnailUrl           — CDN thumbnail
  videoTrackUrl          — video URL
  snapList[]             — individual snaps with media URLs

pageProps.curatedHighlights[]: — saved story highlights
  storyTitle             — highlight name
  snapList[]:
    snapUrls.mediaUrl    — CDN video/image URL
    timestampInSec       — creation timestamp
    snapMediaType        — 0=image, 1+=video

pageProps.lenses[]: — AR lenses
  lensName, isOfficialSnapLens, lensPreviewVideoUrl
```

### Verified engagement data examples (kingbach — first 3 spotlights)


| Spotlight | Views  | Comments | Recommends | Shares | Boosts |
| --------- | ------ | -------- | ---------- | ------ | ------ |
| #0        | 47,722 | 23       | 441        | 150    | 4,501  |
| #1        | 13,490 | 26       | 219        | 127    | 2,617  |
| #2        | 40,894 | 35       | 655        | 311    | 6,773  |


### Verified subscriber counts across test accounts


| Username        | Subscribers | Related accounts | Spotlights | Has public profile? |
| --------------- | ----------- | ---------------- | ---------- | ------------------- |
| `kingbach`      | 2,708,400   | 3                | 27         | YES                 |
| `zane`          | 1,498,300   | 3                | 0          | YES                 |
| `garyvee`       | 767,400     | 3                | 18         | YES                 |
| `nike`          | 0 (hidden)  | 0                | 9          | YES (brand)         |
| `djkhaled`      | N/A         | 0                | 0          | NO (regular user)   |
| `charlidamelio` | N/A         | 0                | 0          | NO (regular user)   |


### Critical discovery: `relatedAccountsInfo` enables network crawling

Each profile contains an array of **related creators** — full profile objects, not just usernames. Tested from `kingbach`:

```
relatedAccountsInfo[0]: @destormpower — "Destorm Power" (badge=1)
relatedAccountsInfo[1]: @melvingregg  — "Melvin Gregg" (badge=1)
relatedAccountsInfo[2]: @directorwuzgood — "Wuz Good" (badge=1)
```

Each related account includes `publicProfileInfo`, `subscribeLink`, and their own `businessProfileId`. BFS from seed accounts builds the network.

### Rate limits (observed)

- Tested ~15 profiles in rapid succession from a single IP — all succeeded
- No Cloudflare challenge or CAPTCHA encountered
- ~1.5-2.5 seconds per request (network latency, not throttling)
- Heavy systematic scraping likely triggers IP-level blocking (same as Ads Gallery)
- Proxy rotation recommended for bulk operations (1000+ profiles)

### Practical value

**VERY HIGH** — this is the primary data source for creator intelligence. Simple HTTP, no auth, no cost, rich data. Combined with `creator_name` seeds from DuckDB `sponsored_content` (§2):

- Profile enrichment with follower counts, bio, category, verified status
- Full engagement metrics per spotlight (views, comments, shares, recommends, boosts)
- Video content URLs (direct MP4 links) with durations and timestamps
- AI-generated content descriptions and keywords (Snap's own LLM metadata!)
- Creator network graph construction via related accounts
- Account age/freshness tracking via creation/update timestamps

### Implementation: `data_sources/snap_profiles/` (2026-04-09)

We built the Phase 1 scraper described below — TypeScript, `got-scraping`, same patterns as the ads pipeline:

```
data_sources/snap_profiles/
  src/fetch_profiles.ts     — main script
  data/profiles/*.json      — one JSON per brand (full pageProps)
  data/profiles/state.json  — resume state
  data/profiles/download_log.jsonl
```

**Technique**: HTTP GET `snapchat.com/add/<username>` via `got-scraping` with `headerGeneratorOptions: { browsers: ["chrome"], operatingSystems: ["macos"] }`. Regex-extracts `<script type="application/json">`, parses `pageProps`. No proxy needed — no rate limiting at concurrency ≤3 with 800ms delays. Concurrency of 5 occasionally triggers blocks (tiny responses).

**Username guessing**: for each brand in `brands_fashion.json` (216 brands shared with the ads pipeline), tries lowercase-stripped, underscored, dashed, and `_official` suffixes. Stops at first hit with `publicProfileInfo`.

**Final results** (all 216 brands, completed 2026-04-09, 568 requests, ~5 min):
- **100 brands** (46%) have a Public Profile → saved to JSON + loaded into DuckDB
- **90 brands** (42%) exist on Snapchat but have no Public Profile (status `no_public`)
- **26 brands** (12%) not found under any guessed username
- 29 brands have spotlight content (331 spotlight videos total)
- 12 brands show real subscriber counts (Shein 491K, Jordan 204K, Foot Locker 131K, …); most brand profiles report "0"
- subscriber_count = "0" is systematic for brand/business profiles (Nike, adidas, H&M, Gucci, etc. — platform behavior, not scraping issue)

**DuckDB tables** (in `db/init.sql`):
- `brand_profiles` — one row per brand: title, subscriber_count, bio, website, address, badge, category, business_profile_id, timestamps, spotlight_count
- `brand_profile_spotlights` — one row per spotlight video: engagement stats (views, shares, comments, boosts, recommends), video metadata (duration, dimensions, upload date), AI-generated content (llm_title, llm_description, llm_keywords), hashtags, deeplinks

### Keyword-like fields on profiles (vs explore — §6)

Per spotlight, `spotlightStoryMetadata[]` includes **Snap-derived** labels: `llmKeywords`, `textMetadataKeywords`, `s2iTags`, `hashtags`, `videoMetadata.keywords`, and nested `cuSignals[].signal.*`. **`categoryStringId`** / **`subcategoryStringId`** are **internal taxonomy** strings on the profile, not user-typed hashtags.

These are **not** guaranteed to equal an explore query or Topics `topicText` — they are **related semantically** but used for enrichment and clustering. **Where explore Topics and `/topic/` pages fit** is documented in §6 (*Where the same "keywords" show up elsewhere*).

---

## 6. `/explore/<keyword>` Discovery Endpoint — `VERIFIED WORKING, CREATOR DISCOVERY`

### What it is

Snapchat's web explore pages serve as a **keyword-based creator/content discovery mechanism**. This is how the Apify "Popular Accounts Scraper" finds creators — and it's trivially replicable.

### URL pattern

```
https://www.snapchat.com/explore/<keyword>
```

### Are there "official" keywords? Can you put anything?

**There is no published master list of allowed explore slugs.** The path segment is a **search query**, not a fixed enum. Snap does not document "all possible keywords."

**What we verified (2026-04-08):**


| Input                                              | Result                                                                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real words (`fashion`, `crypto`, `news`, `česko`)  | Full sections: Spotlight, Shows, Subscribe, Lenses, Topics, Episodes, Places (counts vary by query and locale).                                                                                 |
| Gibberish (`randomstring12345`, `asdfghjklqwerty`) | Still returns HTTP 200 + **Spotlight** (~24 cards). Other sections may be missing or thin (e.g. only Add Friends + Spotlight).                                                                  |
| **Empty path** `/explore/` or `/explore`           | **Broken for scraping** — `encodedSearchResponse` empty / no usable sections in our test.                                                                                                       |
| **`/explore/categories`**                          | This is **not** a category directory. It is a normal explore page whose `query` is literally the English word `"categories"` (search results about "categories," not a list of all categories). |


So: **you can put almost any string in the path** (URL-encode spaces, unicode, etc.). Quality and section mix depend on how much indexed content matches — nonsense strings still get *some* Spotlight results, but rich Subscribe/Shows/Topics clusters appear when the query matches real topics.

**How to grow the keyword set (no master list needed):**

1. **Seed list** — verticals you care about (`beauty`, `fitness`, `praha`, `crypto`, …) plus brands, regions, languages.
2. **Topics section** — each row includes `onTap.openHashtagTopic.topicText` (e.g. `fashion_style`, `fashionblogger`). Treat those as **new explore queries** and fetch `/explore/<topicText>` recursively (with deduping and depth limits).
3. **Related** — same pattern can be combined with profile `relatedAccountsInfo` (§5) and `sponsored_content` username seeds (§2).

**Practical constraint:** treat this as **open-ended search**, not a finite checklist — design the crawler for deduplication, rate limits, and a bounded frontier (queue + visited set), not "iterate every official keyword once."

### Where the same "keywords" show up elsewhere (cross-links)

Explore queries are **not isolated**. The same *kind* of string (hashtag/topic slug, search query) appears in several other payloads:


| Surface                                    | What you see                                                                                                                                                                                                        | Same string as `/explore/<q>`?                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Explore → Topics rows**                  | `topic.text` and `onTap.action.openHashtagTopic.topicText` (e.g. `fashion_style`, `fashionblogger`)                                                                                                                 | **Yes** — you can re-fetch `/explore/<topicText>` (verified: `/explore/fashion_style` returns `query: "fashion_style"`).                                                                                                                                                                                                                                                                     |
| **Dedicated topic pages**                  | `https://www.snapchat.com/topic/<topicId>` — `pageProps`: `topicId`, `displayName`, `spotlights[]` (e.g. 32 cards for `fashion`), optional `relatedS2ITags`, `s2iTagHierarchy`, `webPageViewSource` (e.g. `dynamo`) | **Partially** — only **some** slugs get a `/topic/` page (e.g. `fashion`, `music`, `comedy` → 200). Others from the Topics list (e.g. `fashion_style`) return **404** on `/topic/` but still work on **`/explore/fashion_style`**. So: explore is the superset on web; `/topic/` is a subset of canonical topic IDs. Prefer **`/explore/<slug>`** for crawling when you care about coverage. |
| **Public profile `__NEXT_DATA__`** (§5)    | Per spotlight: `llmKeywords[]`, `textMetadataKeywords[]`, `s2iTags[]`, `hashtags[]`, `videoMetadata.keywords[]`, and nested `cuSignals[].signal.textMetadata.keywords` / `s2iTags`                                  | **Not identical strings** — these are **Snap-derived labels** (LLM keywords, vision/text tags) for *that video*, not the global hashtag slug. They are **semantically related** to explore/topics (e.g. "fashion", "golf") but you should not expect `topicText === llmKeywords[i]`.                                                                                                         |
| **Profile taxonomy** (§5)                  | `publicProfileInfo.categoryStringId`, `subcategoryStringId` (e.g. `public-profile-category-v3-people`)                                                                                                              | **Different system** — internal category enums, **not** user hashtags or explore query strings.                                                                                                                                                                                                                                                                                              |
| **Profile "Tagged" UI**                    | `taggedTabResponse` (`searchResponse`, `spotlightCardMap`) — often **null** in SSR JSON; i18n still references "Spotlight results for …", "related topics"                                                          | **Planned surface** for tag/topic search on a profile; **not reliably populated** in the static JSON we tested.                                                                                                                                                                                                                                                                              |
| **`sponsored_content` rows (§2)**          | Creator/sponsor/content URLs — **no** generic "topic" field                                                                                                                                                           | **Enrichment** = §5 profile + §6 explore, not the raw row alone.                                                                                                                                                                                                                                                                                                                            |


**Practical takeaway:** treat **explore `query` / Topics `topicText`** as one **hashtag-oriented namespace** for crawling; treat **profile spotlight metadata keywords** as a **second, content-level namespace** (great for tagging/analytics, weaker for exact join keys to explore).

### How to extract data

Same technique as profile pages — HTTP GET with User-Agent, parse `<script type="application/json">`.

```
pageProps.encodedSearchResponse  — raw JSON (NOT base64), ~100-400KB
pageProps.encodedSpotlightCardMap — raw JSON, ~200-400KB
pageProps.query                  — the keyword used
pageProps.country                — detected country (e.g., "CZ")
```

### Data structure (verified hands-on 2026-04-08 with `fashion`)

The `encodedSearchResponse` contains `sections[]`, each with a different result type:


| Section         | Type               | Results | What you get                                                                                                      |
| --------------- | ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------- |
| **Subscribe**   | `snapProEntity`    | 5-8     | Full business profiles: `subscriberCount`, `title`, `hostAccountUsername`, `tier`, `organizationType`, `category` |
| **Shows**       | `publisher`        | 24      | Publishers: `displayName`, `approxSubscriptionCount`, `description`, `businessProfileId`, `deeplinkUrl`           |
| **Spotlight**   | `storyCard`        | 24      | Story IDs linking to spotlight content                                                                            |
| **Lenses**      | `lens`             | 24      | AR lenses by keyword                                                                                              |
| **Topics**      | `topic`            | 3-8     | Related topic categories                                                                                          |
| **Add Friends** | `user`             | 1       | User suggestion                                                                                                   |
| **Episodes**    | `publisherEdition` | 15      | Show episodes                                                                                                     |
| **Places**      | `place`            | 10      | Related locations                                                                                                 |


### Subscribe section — richest creator discovery data

Each `snapProEntity.profile.businessProfile` contains:

```
title                   — "Fashion" (display name)
subscriberCount         — 4427373
hostAccountUsername      — "fashionsshow" (← the username to scrape via /add/)
hostAccountMutableUsername — same
tier                    — 2 or 3 (creator tier level)
organizationType        — 0
isBrandProfile          — false
isPartnerProfile        — false
isCreatorHubCollaborator — false
l90Country              — 0
category / categoryEnum — profile category
businessLogo            — CDN URL
heroImageUrl            — CDN URL
id                      — internal profile ID
accountId               — UUID
createdTimestamp        — account creation date
websiteUrl, emailAddress, phoneNumber — when populated
```

### Spotlight cards — creator extraction from `encodedSpotlightCardMap`

Each spotlight card in the map contains `singleSnapStoryMetadata` and `snaps[]`. The snaps contain:

```
creatorInfo:
  userName         — "@fatima_rose96" (the creator's username)
  displayName      — "Fatima 🌹"
  followerCount    — 0 (not always populated here)
  snapproTier      — 0, 1, 2, or 3 (creator tier)
  userId           — internal user ID
  creatorEligibility:
    isEligibleForAffiliateDeeplink — boolean

singleSnapStoryMetadata:
  displayName      — creator display name
  businessProfileId — UUID
  businessLogoUrl  — CDN URL
  llmTitle         — AI-generated title
  llmDescription   — AI-generated description
  llmKeywords      — AI-generated keyword list

engagementStats:
  viewCount        — 700276 (per spotlight)
  shareCount       — 1585
  commentCount     — (when available)
```

### Verified discovery output (fashion keyword, single request)

From one `/explore/fashion` request:

- **5 Subscribe profiles** with subscriber counts (up to 9.2M)
- **24 Publishers/Shows** with subscription counts
- **22 unique creator usernames** from Spotlight cards with engagement stats
- **24 Lenses** with creator info

Total: ~50+ unique creator/publisher identities from a single HTTP request.

### Tested categories


| Keyword | Subscribe | Shows | Spotlight | Lenses | Topics |
| ------- | --------- | ----- | --------- | ------ | ------ |
| beauty  | 8         | 24    | 24        | 24     | 3      |
| fitness | 6         | 24    | 24        | 24     | 7      |
| comedy  | 4         | 24    | 24        | 24     | 8      |
| gaming  | 4         | 24    | 24        | 24     | 5      |
| music   | 4         | 24    | 24        | 24     | 8      |
| food    | 4         | 24    | 24        | 24     | 8      |
| travel  | 4         | 24    | 24        | 24     | 7      |


### Practical value

**VERY HIGH for creator discovery.** This solves the "how do we find creators we don't already know about" problem. Workflow:

1. Enumerate category keywords (fashion, beauty, fitness, comedy, food, travel, tech, ...)
2. Fetch `/explore/<keyword>` for each
3. Extract all creator usernames from Subscribe + Spotlight + Shows sections
4. Feed those usernames into the profile scraper (§5) for full data + related accounts
5. This seeds the network graph crawler without needing any pre-existing username list

### Implementation: `data_sources/snap_explore/` (2026-04-09)

We built the explore discovery scraper — TypeScript, `got-scraping`, same patterns as the profile and ads pipelines:

```
data_sources/snap_explore/
  src/fetch_explore.ts          — main script
  data/explore/<keyword>.json   — one JSON per keyword (full pageProps)
  data/explore/state.json       — resume state
  data/explore/download_log.jsonl
  data/explore/discovered_topics.json  — frontier expansion seeds
```

**Technique**: HTTP GET `snapchat.com/explore/<keyword>` via `got-scraping` with `headerGeneratorOptions: { browsers: ["chrome"], operatingSystems: ["macos"] }`. Regex-extracts `<script type="application/json">`, parses `pageProps`. Same `__NEXT_DATA__` approach as profiles.

**128 seed keywords** organized into 9 categories for the fashion & beauty vertical: fashion core (17), clothing types (18), beauty core (13), beauty products (20), hair (8), fashion brands (13), beauty brands (10), lifestyle/shopping (12), trends + seasonal (17).

**Data extraction per keyword** — parses `encodedSearchResponse` sections and `encodedSpotlightCardMap`:

| Section type | `$case` | What's extracted |
| --- | --- | --- |
| Subscribe | `snapProEntity` | Business profiles: `subscriberCount`, `title`, `hostAccountUsername`, `tier`, `category` |
| Shows | `publisher` | Publishers: `displayName`, `approxSubscriptionCount`, `businessProfileId` |
| Spotlight | `storyCard` | Story cards → creator usernames from `encodedSpotlightCardMap` snaps: `creatorInfo.userName`, `followerCount`, `snapproTier` |
| Topics | `topic` | `onTap.action.openHashtagTopic.topicText` → frontier expansion keywords |
| Lenses | `lens` | AR lenses: `creatorName`, `creatorUserId` |
| Episodes | `publisherEdition` | Show episodes with publisher info |
| Places | `place` | Related locations |

**Frontier expansion**: Topics discovered from each response are automatically saved. Run with `--discovered` to crawl those as additional keywords — recursive discovery without manual curation.

**Observed results (13-keyword verified run, 2026-04-09):**
- **450 creators** discovered across 13 keywords (fashion: 70, style: 72, trendy: 60, outfit: 35, wardrobe: 34, runway: 32, ootd: 30, ...)
- **246 unique spotlight creators** with per-video engagement data (views, shares)
- **102 unique subscribe profiles** with subscriber counts (top: نوف فاشن 4.7M, Fashion 4.4M, Fashion Fever 1.9M, FashionNova 743K)
- **39.3M total views** and **329K total shares** across 312 spotlight cards
- **35 frontier topics** auto-discovered (e.g. `fashionbrand`, `outfitinspo`, `outfitideas`, `stylefashion`, `ootdtrend`)
- 7–8 sections per keyword with rich data (24 spotlight cards, 24 publishers, 6–24 subscribe profiles per keyword)
- **Zero rate limiting** — ~2.5s per request through Webshare rotating proxy, 0 errors in 13 requests
- Extrapolated: 128 keywords × ~50 creators/keyword = **~6,400 unique creator identities** (before dedup)

**DuckDB tables** (in `db/init.sql`):
- `explore_keywords` — one row per keyword: query echo, country, section count, spotlight card count (13 rows from initial run)
- `explore_subscribe_profiles` — one row per business profile: title, subscriber_count, username, tier, is_brand, is_partner, business_profile_id, account_id, website_url, logo_url, category (102 rows)
- `explore_spotlight_creators` — one row per spotlight card: creator_username, creator_display_name, creator_tier, view_count, share_count, llm_title, llm_description, llm_keywords, story_id (312 rows)

The DuckDB SQL handles the nested-JSON-string-inside-JSON structure (`encodedSearchResponse` and `encodedSpotlightCardMap` are VARCHAR fields containing JSON) using `::JSON` cast, `json_keys()` unnest for spotlight cards, and `generate_series` + `json_extract_string` for section/result array traversal.

**CLI**:
```bash
npm run fetch:explore                       # all 128 keywords
npm run fetch:explore -- --limit 10         # first 10 only
npm run fetch:explore -- --status           # progress dashboard
npm run fetch:explore -- --retry            # retry failed/rate-limited
npm run fetch:explore -- --discovered       # also crawl topic-discovered keywords
npm run fetch:explore -- --delay 3000       # custom delay between requests
```

---

## 7. Spotlight Web Pages — `ACCESSIBLE, VIDEO-LEVEL DATA`

### What it is

Spotlight is Snapchat's TikTok-like short video feed. Individual Spotlight videos have public web URLs.

### URL pattern

```
https://www.snapchat.com/spotlight/<long_base64_id>
```

These IDs appear as `content_url` on `sponsored_content` rows (§2) where `content_type` is `SPOTLIGHT`.

### Data available (VERIFIED hands-on 2026-04-09)

The spotlight page `__NEXT_DATA__` has a **different structure from profile pages** — and contains data **not available** on profiles:

```
pageProps.videoMetadata:
  viewCount              — "26919" (string, cast to int)
  shareCount             — "0"
  durationMs             — "13520"
  width, height          — 540, 960
  uploadDateMs           — "1755173682021"
  thumbnailUrl           — CDN URL
  contentUrl             — direct MP4 CDN URL
  embeddedTextCaption    — on-screen text overlay
  creator:
    personCreator:
      username           — "h_m"
      name               — "H&M"
      followerCount      — "0"
      url                — "https://www.snapchat.com/@h_m"

pageProps.transcriptMap:             ← UNIQUE TO SPOTLIGHT PAGES
  {snapId}:
    url                  — VTT subtitle file CDN URL
    text                 — full transcript as WebVTT with timestamps
                           "00:00:00.620 --> 00:00:03.360\nBackbreaker..."

pageProps.encodedComments:           ← comment data (when available)
pageProps.spotlightFeed:             ← related spotlight feed
  spotlightStories[]     — additional spotlight items in the feed
pageProps.isAttributed:              ← boolean, branded content flag
pageProps.variant:                   ← A/B test variant identifier
```

**The transcript is the killer finding.** Profile pages (§5) give engagement stats and AI metadata per spotlight, but **never** the actual transcript/captions. Individual spotlight pages provide full VTT-format transcripts with precise timestamps. This enables text-based content analysis, language detection, keyword extraction, and sentiment analysis on the actual spoken/captioned content.

### Prerequisite: you need a spotlight URL first

There is no way to enumerate spotlight IDs. Seeds come from:
- **`sponsored_content.content_url`** (§2) — 147,365 unique spotlight URLs from 48,350 creators (biggest source)
- **Profile pages** (§5) — `spotlightHighlights` and `spotlightStoryMetadata[].deeplink` contain embedded spotlight IDs
- **`/explore/<keyword>`** (§6) — spotlight cards in `encodedSpotlightCardMap`

### Implementation: `data_sources/snap_spotlights/` (2026-04-09)

Same `got-scraping` + `__NEXT_DATA__` technique. Sample of 108 spotlight URLs: 79 from 29 fashion/beauty brand profiles (up to 3 per brand) + 29 from TEMU_FR/Shein sponsored content.

**Results** (107/108 fetched, 1 not found):

| Field | Coverage | Note |
| --- | --- | --- |
| View count | 107/107 | 721K total, Gymshark top at 352K |
| Share count | 107/107 | |
| Creator username + name | 107/107 | |
| Video duration/dimensions | 107/107 | |
| Upload date | 107/107 | |
| **Video transcripts (VTT)** | **63/107 (59%)** | **Unique to spotlight pages — not on profiles** |
| Comments data | 56/107 (52%) | |
| Content/thumbnail CDN URLs | 107/107 | Direct MP4 links |

**DuckDB table**: `spotlight_pages` — 107 rows with view_count, share_count, creator info, upload timestamps, has_transcript flag, content URLs.

**CLI**:
```bash
npm run fetch:spotlights                     # fetch all sample URLs
npm run fetch:spotlights -- --limit 5        # test with 5
npm run fetch:spotlights -- --status         # progress
```

### Practical value

**HIGH — upgraded from Medium-High.** The transcript data makes this substantially more valuable than initially assessed:

- **Profile pages** (§5) already give engagement stats per spotlight — for that alone, spotlight pages are redundant
- **Transcripts** are the unique value: full spoken/captioned content with timestamps, enabling NLP analysis
- **Comments** provide audience sentiment data not available elsewhere
- **Scale consideration**: 147K spotlight URLs in `sponsored_content` at 800ms = ~33 hours. Prioritize by brand/creator importance.

---

## 8. Story.snapchat.com — Public Stories — `ACCESSIBLE, EPHEMERAL`

### What it is

Public stories from verified/public accounts viewable on the web at `story.snapchat.com`.

### Key constraints

- **Only verified/public profiles** have web-accessible stories
- **Stories are ephemeral** — 24-hour lifespan by default
- **Saved Stories / Highlights** persist longer but not all creators use them
- Third-party "story viewers" (snapchatstoryviewer.com, etc.) relay public stories

### Data available

```
story:
  snaps[]:
    id                    — snap UUID
    media_url             — CDN URL to video/image
    timestamp             — creation time
    media_type            — VIDEO | IMAGE
    duration              — seconds
    preview_image_url     — thumbnail
```

### Tools

- **PySnapStories** (open-source, GitHub: dvingerh/PySnapStories) — Python script for downloading public stories
- **Apify scrapers**: `easyapi/snapchat-user-stories-scraper` — $2.99/1k results
- **ZenRows Snapchat Scraper** — enterprise API with proxy rotation

### Practical value

**LOW — skip for our vertical.** Stories are a media-only surface with **zero engagement metrics** — no view count, no share count, no comments, no likes, no impressions, no clicks. The payload contains only snap UUID, media URL, timestamp, type, and duration. Compare to Spotlight (§7) which provides per-video `viewCount`, `shareCount`, `commentCount`, `recommendCount`, `boostCount`, and AI-generated metadata.

On top of the missing metrics, stories have two compounding problems:
1. **Ephemeral** — 24-hour lifespan requires continuous polling to capture anything
2. **Verified accounts only** — narrows the discoverable pool significantly

The only viable use case would be real-time monitoring of specific high-profile accounts (e.g., "did Nike post a story today?"). Even then you'd get no engagement signal — just proof the content existed.

For marketing analytics in our fashion & beauty vertical, the data hierarchy is: **Profiles (§5) > Spotlight (§7) > Explore (§6) > Sponsored Content (§2) >> Stories**. Stories sit at the bottom because they give the least signal for the most effort.

---

## 9. Public Profile API — Creator Discovery (Official, Partner-Gated)

### What it is

API for discovering creator profiles, viewing public metrics, and managing content on behalf of creators/brands. **Currently allowlist-only.**

### Endpoint Types

**Public (no profile owner auth needed):**

```
GET /public/v1/public_profiles/change_logs  — profile change logs
GET /public/v1/public_profiles/{id}/stats   — public metrics
```

**Authorized (requires creator opt-in):**

- Content posting on behalf of creators
- Detailed analytics
- Paid media promotion of organic content

### Creator Discovery

- Search for public profiles suitable for brand partnerships
- Access profile metadata and stats
- Content types: Stories, Saved Stories, Spotlights, Lenses

### Access Requirements

1. Business account + OAuth app
2. Send OAuth client ID to Snap contact for allowlisting
3. Allowlist-only — not open to general public

### Relevance to Ravineo

**HIGH** — likely untapped potential. Creator discovery data could reveal patterns of commercial influence that no public API exposes. The change_logs endpoint could track profile creation/modification patterns over time. Combined with Sponsored Content data (§2), this would give a full picture of who is influencing, for whom, and how their profiles evolve. Access requires establishing a Snap partnership (realistic for Ravineo, expect a few weeks of outreach).

---

## 10. Story Kit API (Official, Partner-Only) — `BLOCKED, ACHIEVABLE WITH OUTREACH`

### What it is

A separate, lesser-known official API for accessing public Snapchat Stories. GraphQL-based, maintained in Snap's own GitHub repo ([Snapchat/storykit](https://github.com/Snapchat/storykit)). The schema is fully public — you can read every query and type definition on GitHub, but the endpoint rejects requests without a valid partner JWT.

### Capabilities

- Search public stories by **location, time, caption, media type, official username**
- GraphQL schema defined in `public_story_api.graphql`
- HTTP POST only, partner-signed JWT in `X-Snap-Kit-S2S-Auth` header
- Authentication: ECDSA key pair (ES256), `iss`/`kid` assigned by "your Snap advocate"

### Access path

Not self-serve — requires a "Snap advocate" (dedicated partnership contact) to assign ECDSA credentials. Same gatekeeper pattern as Public Profile API (§9). A company like Ravineo could realistically obtain access through business development outreach, but it takes time (weeks to months) and a compelling use case. Not a technical dead end — an organizational one.

### Why it's low priority even with access

- **Stories have zero engagement metrics** — no view count, no shares, no comments (see §8). Story Kit would give structured *query* capabilities (location, time, caption search) over that same engagement-poor data.
- The unique value would be **location-based story search** (e.g. "all public stories from Paris mentioning fashion") — useful for geo-targeted marketing analysis, but niche.
- Profiles (§5) and Spotlights (§7) already provide the rich engagement data we need. Story Kit would complement, not replace, those sources.

### Bottom line

**Achievable but not urgent.** If Ravineo establishes a Snap partnership for other reasons (e.g. Public Profile API access, §9), Story Kit credentials should be requested in the same conversation — marginal cost to ask. But pursuing a partnership *solely* for Story Kit is not justified given the engagement-metrics gap in story data.

---

## 11. DSA Transparency Reports (bulk download)

### What it is

Snap publishes transparency reports **twice yearly** since H1 2015 at [values.snap.com/privacy/transparency](https://values.snap.com/privacy/transparency). **No auth, no application, no partnership needed.** 21+ reports spanning 10 years. We downloaded everything available and loaded it into DuckDB (17 tables).

### What we downloaded

| Type | Files | Detail |
| --- | --- | --- |
| **EU DSA XLSX** (H2 2025) | 2 files (~538 KB each) | 11 sheets: member state orders, notices, enforcement, appeals, automated means, human resources, AMAR per country |
| **PDF reports** | 8 files (~113 MB) | Risk assessments (2023-2025), audit reports (2024-2025), VSP code of conduct |
| **Global report data** (H1 2025) | Manually extracted | Enforcements, user reports, proactive detection, appeals, ads moderation, regional breakdown, CSEA |

### What's in the data

| Category | Example H1 2025 data |
| --- | --- |
| **Content enforcements** | 9.67M total enforcements across 5.79M unique accounts |
| **Policy breakdown** | Sexual content, CSEA, harassment, threats, drugs, weapons, hate speech, terrorism, false information, spam, impersonation |
| **Per-category stats** | Total enforcements, unique accounts, median turnaround time (detection → action) |
| **Proactive detection** | 3.4M enforcements via automated tools (hash-matching, ML, Google CSAI) |
| **User reports** | 19.8M in-app reports → 6.3M enforcements |
| **Appeals** | 437k appeals, 22k reinstatements, 415k upheld |
| **Ads moderation** | 67,789 ads reported, 16,410 removed |
| **Regional breakdown** | North America, Europe, Rest of World |
| **EU AMAR** | 97.15M monthly active recipients across 27 EU member states (H2 2025) |
| **EU member state orders** | 2,604 legal requests from EU governments (H2 2025) |

### EU-specific DSA reports (separate, even more detailed)

The EU DSA transparency reports are published separately and include additional data required by the Digital Services Act, AVMSD, Dutch Media Act, and TCO regulation. The H2 2025 report is the first to ship as downloadable XLSX (11 structured sheets). Earlier reports (H1 2023 onward) are web-only. Also includes CSEA media scanning reports and terrorist content reports.

### DuckDB tables

All data is loaded in `db/rav.db` (run `duckdb db/rav.db < db/init.sql` from repo root):

| Table | Rows | Source |
| --- | --- | --- |
| `eu_dsa_member_state_orders` | 2,604 | EU DSA XLSX |
| `eu_dsa_automated_means` | 157 | EU DSA XLSX |
| `eu_dsa_own_initiative_tc` | 112 | EU DSA XLSX |
| `eu_dsa_categories` | 100 | EU DSA XLSX |
| `eu_dsa_notices` | 94 | EU DSA XLSX |
| `eu_dsa_own_initiative_illegal` | 90 | EU DSA XLSX |
| `eu_dsa_appeals` | 49 | EU DSA XLSX |
| `eu_dsa_amar` | 28 | EU DSA XLSX |
| `eu_dsa_human_resources` | 27 | EU DSA XLSX |
| `global_enforcements_by_policy` | 13 | H1 2025 report |
| `global_user_reports_by_policy` | 13 | H1 2025 report |
| `global_proactive_detection` | 13 | H1 2025 report |
| `global_appeals_by_policy` | 13 | H1 2025 report |
| `global_regional_enforcements` | 3 | H1 2025 report |
| `global_ads_moderation` | 1 | H1 2025 report |
| `global_csea` | 1 | H1 2025 report |
| `eu_csea_2025` | 1 | EU CSEA report |

### Relevance to Ravineo

**HIGH** — free, public, already downloaded and in DuckDB. 10 years of enforcement data with per-country breakdowns. Directly useful for the "malicious behavior" research vertical and for understanding Snap's ad moderation landscape. The ads moderation data (67k reports, 16k removals) is directly relevant to ad quality analysis.

---

## 12. EC DSA Transparency Database — Statements of Reasons

### What it is

The European Commission's centralized database of **statements of reasons** (SORs) — individual moderation action records that all Very Large Online Platforms (VLOPs) must publish under the DSA. **It is cross-platform by design:** every designated provider (Snap, Meta, Google, etc.) feeds the same schema. For Snapchat-only work, select the Snapchat bulk ZIP or filter on `platform_name` — do not mistake the global dump for Snap-internal telemetry.

Not to be confused with Snap's own transparency reports (§11), which are aggregate **first-party** statistics. This database contains **per-action metadata**: what was restricted, under which legal ground, what detection method was used, and when.

- **Portal:** [DSA Transparency Database](https://transparency.dsa.ec.europa.eu/) — filter by provider "Snapchat"
- **Bulk download:** [data-download](https://transparency.dsa.ec.europa.eu/data-download) — daily CSV/Parquet ZIPs, per-platform or global, no auth
- **Research API:** [documentation](https://transparency.dsa.ec.europa.eu/page/research-api) — OpenSearch-based, requires EU Login + bearer token
- **Python package:** [`dsa-tdb`](https://dsa.pages.code.europa.eu/transparency-database/dsa-tdb/index.html) — official programmatic download + analysis tool
- **Source code:** [GitHub `digital-services-act/transparency-database`](https://github.com/digital-services-act/transparency-database)

### Schema (per statement of reason)

The **Research API** exposes a flattened `statement_index` (field names like `decision_visibility_single`, `content_type_single`, `received_date`). The **bulk CSV** uses a slightly different layout: enums often appear as JSON-in-string arrays (e.g. `decision_visibility` = `["DECISION_VISIBILITY_CONTENT_REMOVED"]`), and the **light** per-platform export has **34 columns** (no long free-text fields, no `territorial_scope`).

Representative **light** bulk columns (verified 2026-04-09 on `sor-snapchat-*-light.zip` merged output):

`uuid`, `decision_visibility`, `decision_visibility_other`, `end_date_visibility_restriction`, `decision_monetary`, `decision_monetary_other`, `end_date_monetary_restriction`, `decision_provision`, `end_date_service_restriction`, `decision_account`, `end_date_account_restriction`, `account_type`, `decision_ground`, `decision_ground_reference_url`, `illegal_content_legal_ground`, `incompatible_content_ground`, `incompatible_content_illegal`, `category`, `category_addition`, `category_specification`, `category_specification_other`, `content_type`, `content_type_other`, `content_language`, `content_date`, `content_id_ean`, `application_date`, `source_type`, `source_identity`, `automated_detection`, `automated_decision`, `platform_name`, `platform_uid`, `created_at`.

| Concept | Bulk CSV (typical) | Research API index |
| --- | --- | --- |
| Visibility action | `decision_visibility` (JSON array string) | `decision_visibility_single` |
| Content kind | `content_type` (JSON array string) | `content_type_single` |
| When received | `created_at` | `received_date` |

**Full** bulk adds at least: `illegal_content_explanation`, `incompatible_content_explanation`, `decision_facts`, `territorial_scope` (and related), per EC documentation.

This is the closest public analog to a **restriction log**. It does **not** contain the actual post text or media — only structured metadata about the moderation decision. Strong **selection bias** toward actioned items (by definition, only restricted content appears).

### Access — Three Paths

#### 1. Bulk CSV/Parquet download (the real path)

**No auth required.** Daily ZIP files on public S3 (`dsa-sor-data-dumps.s3.eu-central-1.amazonaws.com`). The web UI lists the same objects; direct GET works.

**Snapchat-only URL pattern (verified 2026-04-09):** slug must be **lowercase** `snapchat`. `sor-Snapchat-<date>-*.zip` returns **403**; `sor-snapchat-<date>-*.zip` returns **200**.

```
https://dsa-sor-data-dumps.s3.eu-central-1.amazonaws.com/sor-snapchat-2026-04-08-light.zip
https://dsa-sor-data-dumps.s3.eu-central-1.amazonaws.com/sor-snapchat-2026-04-08-full.zip
```

Global (all platforms) for comparison:

```
https://dsa-sor-data-dumps.s3.eu-central-1.amazonaws.com/sor-global-2026-04-08-full.zip
```

**ZIP structure — critical for tooling:** each daily file is **not** a flat “one CSV in a zip”. It is an **outer ZIP** containing **N inner** `*.csv.zip` shards; each inner ZIP expands to **several** small CSV fragments. Every fragment repeats the **same header row**. A correct ingest merges all body rows under a single header (our pipeline concatenates with `fs.writeSync` after the first header).

**Earliest Snapchat day on S3 (probed):** `2023-09-25`. Dates before that return **403** on the `sor-snapchat-*` object (data simply not published yet — not a client bug).

**Scale — global vs Snapchat (empirical, 2026-04-09):**

| Scope | Typical light ZIP | Typical rows/day | Notes |
| --- | --- | --- | --- |
| **Snapchat only** | ~0.5–1.2 MB | ~12k–15k (first day ~6k) | ~1 s download + extract per day on fast network |
| **Global** | ~600 MB–1.3 GB | ~12–22M | Use only if you need all VLOPs |

Full-history **Snapchat light** (2023-09-25 → 2026-04-08, **927** days): on the order of **~0.7 GB** zipped, **~6 GB** merged CSV on disk, **~14M** rows — **tens of minutes** sequential download with a 1 s delay between days; **no rate limiting or CAPTCHA observed** on S3 GETs.

Two variants per day:
- **Full** — all fields including long free-text explanations and `territorial_scope`
- **Light** — compact; omits the longest text fields (and per EC docs, `territorial_scope` in light)

Also available in **Parquet** for the **global** full pipeline (EU `dsa-tdb` tooling). **Retention policy** is **5 years** from submission; actual calendar coverage grows from platform onboarding (~Sept 2023 for Snapchat on this bucket).

#### 2. Research API (OpenSearch, statistical queries)

Requires **EU Login** (free) + email `CNECT-DSA-HELPDESK@ec.europa.eu` for a bearer token. 7 endpoints:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/research/search` | POST | OpenSearch DSL queries |
| `/research/sql` | POST | SQL-like queries (`SELECT ... FROM statement_index`) |
| `/research/count` | POST | Document count for a query |
| `/research/query` | POST | DQL (Dashboards Query Language) |
| `/research/aggregates/{date}[/{fields}]` | GET | Pre-computed daily aggregates |
| `/research/labels` | GET | All category/decision enum values |
| `/research/platforms` | GET | Platform IDs and VLOP status |

**Hard limits:** 1000 rows max per query, **no pagination**, 5MB response, 30s timeout, **last 6 months only**. Designed for statistical/aggregate analysis, NOT bulk download. Use the CSV/Parquet downloads for that.

**Example — Snapchat scams/fraud moderation count:**
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "platform_name": "Snapchat" } },
        { "match": { "category": "STATEMENT_CATEGORY_SCAMS_AND_FRAUD" } }
      ],
      "filter": [
        { "range": { "received_date": { "gte": "2026-01-01", "lte": "2026-04-09" } } }
      ]
    }
  }
}
```

#### 3. `dsa-tdb` Python package

Official EU-published package for programmatic download + analysis. It reads the **same S3 bucket** as manual downloads — not a separate dataset. It shines at **global** scale (documentation cites **~4 TB** for all-platform daily dumps, Spark chunking, monthly aggregates). For **Snapchat-only** daily ZIPs (~1 MB/day), a small script is enough; `dsa-tdb` is optional unless you want Parquet conversion, aggregations, or Superset dashboards on the full multi-platform corpus.

### Rate limits and reliability (bulk path)

- **S3 GET:** no auth header required; **no throttling observed** in production-style sequential fetches (927 days, ~1 s spacing).
- **Failures:** missing days return **403** (treat as “no file” / before go-live). Transient network errors → retry the same date.
- **Research API:** separate limits (1000 rows, 6-month index) — do not use for full history; use bulk ZIPs instead.

### Implementation: `data_sources/dsa_transparency/` (2026-04-09)

TypeScript fetcher aligned with other repo pipelines (`state.json`, `download_log.jsonl`, `--status` / `--retry` / `--from` / `--to` / `--days` / `--full` / `--test`).

```
data_sources/dsa_transparency/
  src/fetch_sor.ts       — download per-day ZIP, nested unzip, merge CSVs
  data/daily/            — one merged file per day: snapchat-<date>-{light|full}.csv
  data/state.json        — per-date row counts + status (resume-safe)
  data/download_log.jsonl
```

**Technique:** HTTPS GET to `sor-snapchat-<YYYY-MM-DD>-<variant>.zip` → `unzip` outer → `unzip` each `*.csv.zip` shard → merge CSV bodies with a single header (sync `fs.writeSync` so the output file exists before stat).

**DuckDB tables** (in `db/init.sql`):

- `ec_dsa_sor` — all rows from `data/daily/snapchat-*.csv` with `dump_date`, `csv_variant` (`light` / `full`), `source_file`, then every CSV column (`union_by_name` if both variants exist). Rebuild with `duckdb db/rav.db < db/init.sql` from repo root (or `RAV_ROOT`).

**CLI:**

```bash
npm run fetch:sor -- --test                    # yesterday, preview 5 rows
npm run fetch:sor -- --from 2023-09-25 --to 2026-04-08   # full Snapchat history (light)
npm run fetch:sor -- --status
npm run fetch:sor -- --retry                   # failed / not_found days only
npm run fetch:sor -- --full                    # full variant (larger, text fields)
npm run db:init                                # rebuild DuckDB tables
```

Requires **`unzip`** on `PATH` (macOS / Linux standard).

### Practical value

**MEDIUM-HIGH for abuse/influence research.** The only source providing granular, per-action moderation data for Snapchat at EU scale. Useful for:

- Tracking moderation volume and patterns over time (complement to §11 aggregate stats)
- Analyzing which content categories Snap acts on most aggressively
- Comparing Snap's moderation posture against other VLOPs in the same database
- Understanding detection method mix (automated vs. manual vs. user reports)
- Cross-referencing with §11 DSA Transparency Reports to validate aggregate numbers against individual records

Not useful for advertising intelligence directly, but directly relevant for the "malicious behavior" research vertical and for understanding platform governance.

---

## 13. DSA Researcher Access — DEAD END

### What it is

Vetted researcher data access under EU Digital Services Act Article 40. Two paths exist:

- **Article 40(4):** via [EU DSA Data Access Portal](https://data-access.dsa.ec.europa.eu/home)
- **Article 40(12):** direct requests to `DSA-Researcher-Access@snapchat.com`

### Why it's a dead end

Both paths require **non-commercial research purpose** — Ravineo is commercial, so disqualified at the front door. Even academic researchers are getting rejected: a March 2026 post by Dutch university professors documents rejection on 5/7 criteria after 80 days. The process requires institutional legal machinery (DPOs, security officers, lawyers).

### Relevance to Ravineo

**DEAD END** — not viable for a commercial entity.

---

## 14. Third-Party Scrapers / Unofficial APIs — `REVERSE-ENGINEERED, WE CAN REPLICATE`

### The core truth: they ALL do the same thing

Every single 3rd-party scraper we investigated uses the **exact same technique**:

1. HTTP GET `snapchat.com/add/<username>` with a browser `User-Agent` header
2. Regex-extract `<script type="application/json">` tag
3. JSON-parse the `props.pageProps` payload
4. Flatten the nested objects into their output format

**No headless browsers. No secret APIs. No special authentication.** The Apify CheerioCrawler-based scrapers do it in ~2 seconds per profile with 256MB memory.

### What each provider actually does (and what they charge for it)


| Provider                               | Technique                                   | What they add                             | Pricing             | Can we replicate?                          |
| -------------------------------------- | ------------------------------------------- | ----------------------------------------- | ------------------- | ------------------------------------------ |
| **Apify Profile Scrapers** (4+ actors) | `__NEXT_DATA__` from `/add/<username>`      | Proxy pool, batch processing, JSON output | $15-25/mo + usage   | **YES** — trivially                        |
| **Apify Popular Accounts**             | `__NEXT_DATA__` from `/explore/<keyword>`   | Category enumeration, profile merging     | $15-25/mo + usage   | **YES** — we verified the endpoint         |
| **Apify Spotlight Scrapers**           | `__NEXT_DATA__` from spotlight URLs         | Video metadata extraction                 | $5-15/mo + usage    | **YES** — data already in profile response |
| **ScrapeCreators**                     | Same `__NEXT_DATA__` behind a REST wrapper  | REST API convenience                      | 100 free, then paid | **YES** — literally the same data          |
| **SnapIntel** (open-source)            | Same technique, Python, config-driven paths | Heatmaps, bitmoji versioning, downloads   | Free                | **YES** — source code verified             |
| **rebac-6/scraper** (open-source)      | Same technique, modular Python              | JSON output, multi-user                   | Free                | **YES**                                    |
| **zone559 gist**                       | Same technique, ~30 lines of Python         | Spotlight thumbnail download              | Free                | **YES** — the simplest reference           |


### Verified: what the scrapers add beyond the raw technique

The paid scrapers charge for exactly three things:

1. **Proxy rotation** — large proxy pools to avoid IP-level rate limiting
2. **Edge case handling** — detecting private profiles, handling redirects, retry logic
3. **API convenience** — REST endpoints, batch input, structured JSON output

We can replicate #2 and #3 trivially. For #1, we only need proxies at scale (1000+ profiles). For initial enrichment of our existing ~1000 creators, a single IP with polite delays is sufficient.

### The Apify "Popular Accounts Scraper" technique (discovery)

Verified by inspecting the input schema and testing ourselves:

1. Takes `keywords[]` array (e.g., `["fashion", "beauty"]`)
2. Fetches `snapchat.com/explore/<keyword>` for each keyword
3. Parses the `encodedSearchResponse` JSON from `__NEXT_DATA__`
4. Extracts profiles from Subscribe + Spotlight sections
5. For each discovered username, optionally fetches full profile via `/add/<username>`
6. Merges and deduplicates across keywords

This is exactly what §6 describes — we can build it in a few dozen lines of TypeScript.

### SnapIntel source code analysis (verified) — most complete open-source tool

GitHub: [Kr0wZ/SnapIntel](https://github.com/Kr0wZ/SnapIntel) (272 stars) — **source code reviewed**

Architecture: `ssd.py` (main scraper) + `config.json` (JSON paths) + `display.py` (output) + `heatmap.py` + `snap_parser.py` (CLI args). Uses a config-driven JSON path system:

```json
{
  "subscriberCount": "props.pageProps.userProfile.publicProfileInfo.subscriberCount",
  "bio": "props.pageProps.userProfile.publicProfileInfo.bio",
  "spotlightEngagementStats": "props.pageProps.spotlightStoryMetadata.{count}.engagementStats.viewCount",
  "spotlightHashtags": "props.pageProps.spotlightStoryMetadata.{count}.hashtags",
  "lenses": "props.pageProps.lenses"
}
```

The entire scraping technique is: `requests.get(url, headers=headers)` → regex for `application/json` → traverse JSON paths. That's it. The `{count}` placeholder iterates over array indices.

**Features worth stealing:**

- **Config-driven JSON path extraction** — resilient to minor schema changes (just update paths)
- **Heatmap generation** from upload timestamps (activity pattern analysis)
- **Bitmoji version enumeration** (historical avatar tracking, niche but unique)
- **Multi-threaded download** of media files (stories, spotlights, lenses)
- **Private vs public profile detection** (`pageType == 18` = public, else private)
- **Profile picture upscaling** — regex-replaces `90` with `640` in CDN URL for higher resolution

**Limitations:** Python-only, no proxy support, no batch/pipeline mode, no discovery (requires known usernames).

### Other open-source tools reviewed

- **rebac-6/snapchat-profile-scraper** — modular Python (`src/extractors/` + `src/config/`), same core technique, adds structured JSON output and multi-username batch support
- **zone559/snapchat-spotlights.py** (gist) — the simplest reference (~30 lines), spotlight thumbnail extraction from `/add/<username>`
- **PySnapStories** ([dvingerh/PySnapStories](https://github.com/dvingerh/PySnapStories)) — Python script for downloading public stories from verified accounts via `story.snapchat.com`
- **yabesh12/snapchat-scraper** — Selenium-based (headless browser), Flask API, MongoDB storage — overkill, same data available via HTTP-only
- **ptrumpis/snap-lens-web-crawler** — JavaScript library for crawling `lens.snapchat.com` (`getTopLenses()`, `searchLenses()`, `getLensesByCreator()`); useful if AR lens data becomes relevant

### ToS considerations

All unofficial. Snapchat's Terms of Service prohibit automated access. Risk profile:

- **Low risk**: small-scale enrichment (hundreds of profiles), polite rate, single IP
- **Medium risk**: systematic bulk scraping (thousands), proxy rotation
- **The data is publicly accessible** — the ToS issue is automation, not the data itself
- Every scraper listed on Apify openly does this commercially

### Bottom line

**There is zero reason to pay for any of these services.** The technique is trivial, verified, and we can build it ourselves in TypeScript using `got-scraping` (already in our codebase) or even stdlib `fetch`. The only thing worth paying for eventually is proxy infrastructure for scale — and even that only matters at 1000+ profiles/day.
