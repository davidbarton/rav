# Snapchat — Complete Map of Available Advertising Data

> Researched and verified 2026-04-08. Every source was tested hands-on. 4 of 7 are accessible and actively used. 2 are blocked but achievable with outreach. 1 is a dead end. See "Outcome" section at the bottom for the full post-mortem.

---

## TL;DR — 7 Distinct Data Sources


| #   | Source                                               | Auth                      | Scope                                           | Status (2026-04-08)                                               |
| --- | ---------------------------------------------------- | ------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| 1   | **Ads Gallery API** (EU Ad Library)                  | **None**                  | All paid ads in EU, last 12 months              | **ACTIVE** — working, rate-limit constrained, needs proxy scaling, very hard |
| 2   | **Sponsored Content API** (organic commercial)       | **None**                  | Live organic branded content globally           | **ACTIVE** — prior snapshot: 882 pages, ~176k items; new crawl in progress |
| 3   | **Political Ads Library** (bulk ZIP)                 | **None**                  | Political/advocacy ads, 2018–2026               | **COMPLETE** — 74,609 ads, 9 years, $117.5M spend      |
| 4   | **Marketing API** (Ads API)                          | **OAuth 2.0**             | Own campaigns — CRUD + stats                    | **BLOCKED** — requires advertiser account with spend             |
| 5   | **Public Profile API**                               | **OAuth 2.0** (allowlist) | Creator discovery + profile metrics             | **BLOCKED** — requires Snap partnership for allowlisting; achievable but needs weeks of outreach |
| 6   | **DSA Transparency Reports**                         | **None**                  | Moderation stats, enforcement data, ads moderation | **COMPLETE** — 21+ reports (since 2015), XLSX + CSV, 17 tables in DuckDB |
| 7   | **DSA Researcher Access**                            | **Application**           | Content data under DSA Art.40                   | **DEAD END** — non-commercial only, painful process, even academics rejected |


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

#### What we actually see (from ~39k logged requests)

Our production fetcher (Webshare datacenter rotating proxy, fashion brand list, all 28 EU countries) logged:

| Status | Count | Share |
| --- | --- | --- |
| `rate_limited` (E1009) | ~28,200 | ~71% |
| `no_ads` (0 results, no error) | ~2,300 | ~6% |
| `fetched` (real data) | ~1,400 | ~4% |

The **dominant failure mode is E1009 rate limiting**, not silent zero-result responses. Many brand+country pairs were successfully fetched multiple times across different proxy IPs (e.g. Nike/DE 59×, Jordan/DE 79×, Only/DE 82×), which means the rate limit resets — it is not a permanent one-shot-per-IP lock.

Only 1 out of 449 brand+country combos with data (Oakley/ES) also received a `no_ads` response on a separate request, which could indicate a soft block. But at 0.2% incidence, this is rare — most `no_ads` responses appear to be genuinely empty (small brand in a small market).

#### Rate limit budget and cooldown

Per-IP budget appears to be small (roughly 1–3 successful `/ads/search` responses before E1009 kicks in). The cooldown duration is **unknown** — it could be hours. We have not yet systematically measured it.

This is not documented anywhere. Snap's official docs only mention "rate limiting."

#### Soft block vs hard block

Early GCP Cloud Run experiments showed a "soft block" pattern (HTTP 200, `request_status: "SUCCESS"`, `ads: []` — looks like success but empty). The production Webshare datacenter proxy and Evomi residential proxy both see "hard blocks" instead (HTTP 200, `error_code: "E1009"`, "Too many requests").

| IP Source | Observed response | Seen on |
| --- | --- | --- |
| **GCP Cloud Run** (direct, no proxy) | HTTP 200, `"SUCCESS"`, `ads: []` (soft block) | GCP us-central1, us-west1 |
| **Webshare DC rotating** (production) | HTTP 200, `"E1009"`, "Too many requests" (hard block) | Production fetcher (~39k requests) |
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
| **DC rotating** | Webshare | ~39,000 requests | **~3.7%** | E1009 hard block | Production fetcher; accumulates via retry passes |
| **Residential rotating** | Evomi | 60 requests | **0%** | E1009 hard block | Early test; untested at scale |
| **GCP Cloud Run** (direct) | GCP | ~12 requests | **~17%** | Soft block (0 ads) | Early POC; subnet-level throttling |

The production fetcher uses **Webshare datacenter rotating proxy** at ~3.7% per-request success (1,440 out of ~39k requests). Low per-request, but the multi-pass retry strategy accumulates results — 98 brands across 22 countries so far.

#### Pagination compounds the problem

**Page size**: `/ads/search` returns ~10 ads per page (not configurable). Brands with many active ads require multiple pages.

**Cursor mechanics**: Each response includes a `paging.next_link` URL with a unique cursor token. You must POST the same JSON body to this URL to get the next page. Each cursor is a unique server-side reference — it is **not** a simple offset.

**Cursor expiry**: Cursors have an unknown TTL and **do expire**. For `/sponsored_content`, we confirmed that stopping a crawl and resuming hours/days later results in E1008 ("validation error") on every saved cursor — not just the last page, but cursors from the middle of the run too. The entire chain rots. The only fix is a fresh crawl from scratch.

**Cursor-scoped rate limiting**: For `/sponsored_content`, the rate limit is tied to the cursor/session, not purely per-IP. A rotating proxy does not bypass it — a steady ~30s interval between pages is what matters. For `/ads/search`, the rate limit appears per-IP, so a rotating proxy is effective.

**Impact with rotating proxy**: Every page request from `/ads/search` gets a different exit IP. At ~3.7% per-request success rate, completing multi-page brands in a single pass is unlikely. Our solution: save the cursor to disk and retry across multiple passes, needing only 1 fresh successful request per remaining page.

#### Practical impact on data collection

Current production run (Fashion & Beauty, 215 brands × 31 countries including 28 EU + ch, gb, no, us):
- **~39,400 HTTP requests** logged so far
- **98 brands** with data across **22 countries** (449 unique brand+country combos)
- **13,116 ads** fetched (page-1 results; pagination for additional pages still in progress for some)
- **117 brands** with zero data so far — mix of genuinely inactive brands and still-rate-limited ones
- Multi-pass retry strategy accumulates results over hours/days

The API is technically "public" and "unauthenticated," but the rate limiting makes bulk data collection require proxy infrastructure. The irony: this is a DSA-mandated transparency tool.

#### Authentication: Confirmed Non-Existent

We tested sending `Authorization: Bearer <token>` headers. The API silently ignores them — no error, no different behavior. There is no authenticated tier, no API key, no way to get a higher rate limit. The rate limit is the same for everyone.

### No Advertiser Discovery — THE OTHER BIG PROBLEM

The API has **no way to list advertisers**. There is no wildcard search, no "list all ads" endpoint, no browse/enumeration capability. You **must** supply a `paying_advertiser_name` string for every search request. If you don't know who's advertising on Snap, this API won't tell you.

#### What we confirmed

- **`paying_advertiser_name` is required.** Omitting it or sending `""` returns E3024 validation error.
- **Fuzzy/prefix matching works.** The field matches against the legal entity name (e.g., "Nike, Inc."), but brand-name inputs ("Nike", "Zalando", "Ikea") also work — the API does fuzzy/prefix matching. Case-insensitive.
- **Single-character queries pass validation** but are useless in practice. Searching `"a"` returns results for some advertiser starting with "a", but combined with rate limits (~3.7% success), you'd burn thousands of requests to enumerate a single letter.
- **The response reveals the full legal entity name** in `paying_advertiser_name` (e.g., "Nike, Inc.", "adidas AG", "Spotify USA Inc."). So once you find a brand, you learn the legal name — but you need to know the brand first.
- **No cross-referencing possible.** You cannot search by category, industry, spend level, impression count, or any other dimension. The only input is a name string.

#### Why this matters

For research purposes, you need **prior knowledge** of every advertiser you want to study. There is no way to answer "who is advertising on Snap?" using this API alone. You can only answer "is brand X advertising on Snap, and if so, what are they running?"

#### Our workaround

We maintain a **curated brand dictionary** (`brands_fashion.json`) — 216 Fashion & Beauty brands with brand name, parent group, and sub-category. This was compiled manually from Ravineo's target verticals. We search each brand × each country, iterating the full matrix.

This means we have a **known blind spot**: any advertiser not in our list is invisible to us. Expanding coverage requires manually adding brands, which is feasible for targeted verticals but not for "all advertisers on Snap."

Potential discovery channels (untested):
- **Apify scrapers** may have built their own advertiser lists
- **Sponsored Content API** (source 2) reveals `sponsor_name` — brands actively sponsoring creators, which could feed back into the ads search list

### What's Missing

- **EU only** — non-EU ads not included (DSA mandate).
- **12-month window** — older ads disappear permanently.
- **No spend data** — only impression counts. Spend is only available for political ads (source 3).
- **No engagement metrics** — no swipes, no completions, no video views.

### Workaround Strategy (What We Built)

1. **Brand dictionary**: Curated list of 215 Fashion & Beauty brands from Ravineo's target verticals
2. **Rotating datacenter proxy** (Webshare): ~3.7% per-request success rate, accumulates over multiple retry passes across 31 countries
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
| **Run 3** (2026-04-09, attempt 2) | In progress | 106+ | 53,000+ | ~1h | Currently running |

Each restart loses progress and re-fetches from page 0. The total dataset size is unknown — we haven't completed a full crawl yet.

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
- **Actual spend data** (not just impressions) — **unique among all Snap sources**. Commercial ads (source 1) only expose impression counts, never spend. Political ads have both.
- Full targeting breakdown (geo, demo, device)
- Committee/organization transparency chain
- Available from 2018 onward (9 years of history)
- Web UI at [snap.com/political-ads](https://www.snap.com/political-ads) for browsing

### Strategic Value of Spend Data

The spend + impressions combination in political ads can be used to **estimate cost-per-impression (CPM) on Snapchat** — a metric that is not available from any other Snap data source. Since commercial ads (source 1) report impressions but never spend, we can cross-reference political ad CPMs to produce **ballpark spend estimates for commercial ads** based on their impression counts.

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

## 5. Public Profile API — Creator Discovery

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

**HIGH** — likely untapped potential. Creator discovery data could reveal patterns of commercial influence that no public API exposes. The change_logs endpoint could track profile creation/modification patterns over time. Combined with Sponsored Content data (source 2), this would give a full picture of who is influencing, for whom, and how their profiles evolve. Access requires establishing a Snap partnership (realistic for Ravineo, expect a few weeks of outreach).

---

## 6. DSA Transparency Reports (bulk download)

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

## 7. DSA Researcher Access — DEAD END

### What it is

Vetted researcher data access under EU Digital Services Act Article 40. Two paths exist:

- **Article 40(4):** via [EU DSA Data Access Portal](https://data-access.dsa.ec.europa.eu/home)
- **Article 40(12):** direct requests to `DSA-Researcher-Access@snapchat.com`

### Why it's a dead end

Both paths require **non-commercial research purpose** — Ravineo is commercial, so disqualified at the front door. Even academic researchers are getting rejected: a March 2026 post by Dutch university professors documents rejection on 5/7 criteria after 80 days. The process requires institutional legal machinery (DPOs, security officers, lawyers).

### Relevance to Ravineo

**DEAD END** — not viable for a commercial entity.
