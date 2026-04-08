# Snapchat — Complete Map of Available Advertising Data

> Researched and verified 2026-04-08. Every source was tested hands-on. 3 of 7 are accessible and actively used. 4 are confirmed dead ends. See "Outcome" section at the bottom for the full post-mortem.

---

## TL;DR — 7 Distinct Data Sources


| #   | Source                                               | Auth                      | Scope                                           | Bulk?                  | Status (2026-04-08)                                               |
| --- | ---------------------------------------------------- | ------------------------- | ----------------------------------------------- | ---------------------- | ----------------------------------------------------------------- |
| 1   | **Ads Gallery API** (EU Ad Library)                  | **None**                  | All paid ads in EU, last 12 months              | Paginated, no bulk ZIP | **ACTIVE** — working, rate-limit constrained, needs proxy scaling |
| 2   | **Sponsored Content API** (organic commercial)       | **None**                  | Live organic branded content globally           | Paginated              | **COMPLETE** — 735+ pages, ~147k items, in DuckDB                 |
| 3   | **Political Ads Library** (bulk ZIP)                 | **None**                  | Political/advocacy ads, 2018–2026               | **Yes — CSV ZIP**      | **COMPLETE** — 74,609 ads, 9 years, $117.5M spend, in DuckDB      |
| 4   | **Marketing API** (Ads API)                          | **OAuth 2.0**             | Own campaigns — CRUD + stats                    | N/A                    | **DEAD END** — requires advertiser account with spend             |
| 5   | **Public Profile API**                               | **OAuth 2.0** (allowlist) | Creator discovery + profile metrics             | N/A                    | **DEAD END** — requires Snap partnership for allowlisting         |
| 6   | **Conversions API** (CAPI)                           | **Auth token**            | Server-to-server event tracking                 | N/A                    | **DEAD END** — write-only pipe, no readable data                  |
| 7   | **DSA Transparency Reports** + **Researcher Access** | **Application**           | Moderation stats, content data under DSA Art.40 | Varies                 | **DEAD END** — non-commercial + university affiliation required   |


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

The `/ads/search` endpoint has the most aggressive anti-scraping measures we've encountered on any public API. This section documents every behavior we confirmed through hundreds of real requests across multiple proxy types, cloud providers, and regions.

#### Budget: 1 request per IP address

After extensive testing, we confirmed: **each IP address gets exactly ONE data-returning request**. The very first request from a fresh IP returns full ad data. Every subsequent request from the same IP returns 0 results — regardless of brand, country, or time elapsed.

This is not documented anywhere. Snap's official docs only mention "rate limiting."

#### Soft Block vs Hard Block

Snap uses two distinct blocking mechanisms depending on IP type:

| IP Type | Block Style | Response | Observed On |
| --- | --- | --- | --- |
| **Datacenter** (GCP, AWS, Webshare DC) | Soft block | HTTP 200, `request_status: "SUCCESS"`, `ads: []` | GCP Cloud Run, Webshare rotating DC |
| **Residential** (Evomi, Webshare residential) | Hard block | HTTP 429 or 200, `error_code: "E1009"`, "Too many requests" | Evomi residential, phone browser |

The soft block is insidious: it looks like a successful response with zero results. You think the brand has no ads, but in reality you've been silently blocked. **There is no way to distinguish "brand has no ads in this country" from "you've been soft-blocked" on a single request.** The only signal is: if you already have data for this brand from a previous IP, and a new IP returns 0, it's a soft block.

#### Subnet-Level Tracking

Snap doesn't just track individual IPs — there is strong evidence of `/24` subnet-level throttling:

**Evidence (GCP Cloud Run, us-west1):**
- Request 1: `34.34.253.161` → Zalando DE → **real ads returned**
- Request 2: `34.34.253.160` → Nike DE → **0 ads (soft block)**
- Request 3: `34.34.253.97` → BMW DE → **0 ads (soft block)**
- Request 4: `34.34.253.224` → Amazon DE → **0 ads (soft block)**

All 4 IPs were from different containers (verified via `process.exit` trick + `x-req-count: 1`), genuinely different IPs. All share `34.34.253.0/24`. Only the first request returned data.

#### ASN-Level Awareness

Some cloud provider IP ranges appear pre-blocked entirely:

| GCP Region | Result | Notes |
| --- | --- | --- |
| us-central1 | Soft block | Worked initially, degraded |
| us-west1 | Soft block | Worked initially, degraded |
| europe-west1 | **Hard block** | Never worked — `E1009` on first request |
| us-east1 | **Hard block** | Never worked |
| asia-east1 | **Hard block** | Never worked |

Some GCP regions' IP ranges are entirely burned — likely abused by other scrapers before us.

#### Backoff Duration: Unknown, Very Long

An IP that returned Nike data (138KB) went to 0 results within seconds and never recovered during our ~3 hour session. Likely 24h+ rolling window based on Apify scraper docs recommending "batches of 200-500 to avoid rate limits."

#### Residential Proxies Are Worse, Not Better

Counter-intuitively, residential IPs perform worse than datacenter:

| Proxy Type | Provider | Sample Size | Success Rate | Block Type |
| --- | --- | --- | --- | --- |
| **Datacenter rotating** | Webshare | 500+ requests | **~17%** | Soft block (0 ads) |
| **Residential rotating** | Evomi | 60 requests | **0%** | Hard block (E1009) |

This is the opposite of typical anti-bot behavior. Snap appears to specifically detect and hard-block residential proxy ranges, while datacenter IPs at least get one shot before soft-blocking.

#### Pagination Compounds the Problem

With a rotating proxy, every page request gets a different IP. For a brand with N pages:
- Page 1: ~17% chance of getting data on a fresh IP
- Page 2: needs ANOTHER fresh IP → 17% chance
- Probability of completing N pages: `0.17^(N-1)`

For a brand with 5 pages: `0.17^4 ≈ 0.08%` — effectively impossible without cursor persistence across retry passes.

Our solution: save the pagination cursor (`next_link`) in state. Each retry pass picks up where the last one left off, needing only 1 fresh IP per remaining page.

#### What Actually Works at Scale

Based on our testing and Apify's demonstrated success:

| Method | Scale | Cost | Why It Works |
| --- | --- | --- | --- |
| **Apify scrapers** | Unlimited | ~$2/1000 ads | Millions of IPs across many ASNs |
| **Webshare DC rotating** | Slow but steady | ~$6/mo (10 IPs) | Each pass clears ~15-20% of remaining brands |
| **GCP Cloud Run multi-region** | ~5-10 brands | Free tier | 1 fresh subnet per region, exhausts fast |
| **Bright Data** | Unlimited | ~$0.90/IP | 1.3M+ DC IPs, per-GB billing |

#### Practical Impact on Data Collection

For our Fashion & Beauty dataset (216 brands × 1 country):
- **7 retry passes** needed over ~2 hours to reach ~65% completion
- ~50% of brands genuinely have no Snap ads in DE (legitimate zeros)
- ~27 brands fetched with real data (185 total ads)
- ~70 brands still rate-limited after all passes
- Estimated **~1000 total HTTP requests** to reach this point

The API is technically "public" and "unauthenticated," but the rate limiting makes bulk data collection require infrastructure that costs more than many paid APIs. The irony: this is a DSA-mandated transparency tool.

#### Authentication: Confirmed Non-Existent

We tested sending `Authorization: Bearer <token>` headers. The API silently ignores them — no error, no different behavior. There is no authenticated tier, no API key, no way to get a higher rate limit. The rate limit is the same for everyone.

### What's Missing

- **No wildcard search** — you MUST provide `paying_advertiser_name`. No way to list all advertisers.
- **No "list all ads" endpoint** — you cannot enumerate without knowing brand names in advance.
- **EU only** — non-EU ads not included (DSA mandate).
- **12-month window** — older ads disappear permanently.
- **No spend data** — only impression counts. Spend is only available for political ads (source 3).
- **No engagement metrics** — no swipes, no completions, no video views.
- **Fuzzy matching only** — `paying_advertiser_name` uses legal entity names (e.g., "Nike, Inc.") but fuzzy/prefix matching works with brand names ("Nike"). Case-insensitive. Single-character searches ("a") pass validation but are useless due to rate limits.

### Workaround Strategy (What We Built)

1. **Brand dictionary**: Curated list of 216 Fashion & Beauty brands from Ravineo's target verticals
2. **Rotating datacenter proxy** (Webshare): ~17% per-request success rate, accumulates over multiple passes
3. **Cursor persistence**: Pagination state saved to disk; each retry resumes from where it left off
4. **Never-regress policy**: Code refuses to overwrite existing data with fewer results (protects against soft-block data loss)
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

Paginate via `paging.next_link`. ~200 items per page.

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

### What's Missing

- No impression counts or engagement metrics
- No temporal range — only "currently live"
- No targeting or demographic data
- Sponsor identification seems self-reported

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

- **Actual spend data** (not just impressions) — unique among Snap sources
- Full targeting breakdown
- Committee/organization transparency
- Bulk downloadable, no API needed
- Available from 2018 onward
- Web UI at [snap.com/political-ads](https://www.snap.com/political-ads) for browsing

### What's Missing

- Political/advocacy ads only — no commercial
- Spend in ranges on the web UI, but CSV may have exact figures
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

**LOW for data collection** — this is for managing your own ads, not observing others'. However, if we ever run verification campaigns or need to understand what targeting options exist, the targeting taxonomy is valuable reference material.

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

**MEDIUM** — if we get access, creator discovery data could reveal patterns of commercial influence. The change_logs endpoint could track profile creation/modification patterns. But access is gated.

---

## 6. Conversions API (CAPI) — Server-to-Server Events

### What it is

Allows advertisers to send web, app, and offline conversion events to Snap server-to-server. Used for attribution, optimization, and measurement.

### Key Details

- Current version: v3
- Events can be up to 37 days old
- Supports deduplication
- Handles offline events (in-store purchases, phone orders)
- Requires Pixel ID + auth token

### Relevance to Ravineo

**NONE** — this is purely advertiser-side infrastructure for tracking conversions. No public data accessible.

---

## 7. DSA Transparency Reports + Researcher Access

### What it is

Snap's compliance with EU Digital Services Act, including transparency reports and vetted researcher data access.

### Transparency Reports

Published twice yearly at [values.snap.com/privacy/transparency](https://values.snap.com/privacy/transparency).
Cover: content moderation, legal requests, safety enforcement, advertising policies.

Most recent: H1 2025 (published), H2 2024 (EU-specific).

### Researcher Access (DSA Article 40)

**Article 40(4):** Non-commercial research access via [EU DSA Data Access Portal](https://data-access.dsa.ec.europa.eu/home).

**Article 40(12):** Direct requests to `DSA-Researcher-Access@snapchat.com`.

**Available data categories:**

- Spotlight content and comments
- Public Story content and Map Story content
- Public profile data
- Engagement metrics
- Country information and user identifiers

Data delivered via protected cloud storage links.

### Advertising Policy Reports

Annual reports covering age-restricted product policies, gating technology, age assurance, parental controls.

### Relevance to Ravineo

**MEDIUM** — the researcher access channel could provide deep engagement data not available through public APIs. Requires formal application and non-commercial use justification. Timeline: weeks to months.

---

## Snap Pixel (Context — Not a Data Source for Us)

JavaScript tag for advertiser websites. Tracks user actions (page views, sign-ups, purchases) after ad exposure. Supports retargeting audience creation. Not relevant as a data source for Ravineo — mentioned for completeness.

---

## Third-Party / Unofficial Sources


| Provider                         | Type           | Data                                | Cost           |
| -------------------------------- | -------------- | ----------------------------------- | -------------- |
| **Apify** — Snapchat Ads Scraper | Scraper        | Ads Gallery data                    | $30/mo + usage |
| **ScrapeCreators**               | Unofficial API | Profiles, posts, metrics            | Paid           |
| **EnsembleData**                 | Unofficial API | Users, posts, followers, engagement | Paid           |
| **Airbyte**                      | Data connector | Marketing API sync to warehouse     | OSS/Cloud      |
| **Stitch**                       | ETL            | Marketing API replication           | Paid           |
| **dltHub**                       | Python ETL     | Marketing API pipeline              | OSS            |


### Notes on Unofficial APIs

- **Not sanctioned by Snap** — ToS risk
- Useful for validation/comparison against official data
- Generally scrape the same public endpoints we can hit directly

---

## Outcome — Real State After Attempting All 7 Sources (2026-04-08)

Every source was investigated, tested, or attempted. Three are working. Four are dead ends.

### Final Scorecard


| #   | Source                    | Status               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Ads Gallery API**       | **ACTIVE — ongoing** | Working but rate-limit constrained. ~1 data-returning request per IP, then soft block (200 OK, 0 results). Subnet-level and possibly ASN-level throttling observed. Scaling requires large proxy pools (Apify, Cloudflare Workers, multi-cloud). Fashion brands partially fetched via rotating proxy.                                                                                                                                                             |
| 2   | **Sponsored Content API** | **COMPLETE**         | 735+ pages fully paginated. ~147,000+ items downloaded. All creator ↔ sponsor relationships captured. ~92% have empty sponsor_name (Snap's own monetization). ~8% are real brand partnerships — high-signal data. Loaded in DuckDB.                                                                                                                                                                                                                               |
| 3   | **Political Ads Library** | **COMPLETE**         | All 9 years (2018–2026) downloaded as bulk CSVs. 74,609 ads, $117.5M spend (mixed currencies), 19.6B impressions, 2,773 unique advertisers across 54 countries. Loaded in DuckDB as `political_ads` view. Re-download script for future updates.                                                                                                                                                                                                                  |
| 4   | **Marketing API**         | **DEAD END**         | Requires active advertiser account with ad spend. Only exposes your own campaign data, not competitors'. No path without becoming a Snap advertiser.                                                                                                                                                                                                                                                                                                              |
| 5   | **Public Profile API**    | **DEAD END**         | Tested endpoints directly — `businessapi.snapchat.com` returns `"unauthorized"`. Even "public" endpoints require an allowlisted OAuth app. Allowlisting requires an existing Snap partnership contact ("send your client ID to your Snap contact"). No self-serve access, no application form.                                                                                                                                                                    |
| 6   | **Conversions API**       | **DEAD END**         | Write-only pipe. Advertisers send conversion events TO Snap, not the other way around. Requires Pixel ID + auth token tied to an ad account. No readable data surface whatsoever.                                                                                                                                                                                                                                                                                 |
| 7   | **DSA Researcher Access** | **DEAD END**         | Two paths exist: Article 40(4) via EU Data Access Portal, or Article 40(12) via direct email to Snap. Both require non-commercial research purpose — Ravineo is commercial, so disqualified at the front door. Even academic researchers are getting rejected: a March 2026 post by Dutch university professors documents rejection on 5/7 criteria after 80 days. Process requires institutional legal machinery (DPOs, security officers, lawyers). Not viable. |


### What We Have

**3 active data sources, all free and unauthenticated:**

1. **Ads Gallery API** (`src/fetch.ts`, `src/download_ads.ts`)
  - EU paid ads with impressions, targeting, creative assets, landing page URLs
  - **Most hostile rate limiting of any public API we've tested** — 1 request per IP, subnet-level tracking, residential IPs hard-blocked, no authenticated tier
  - 216 Fashion & Beauty brands targeted for DE; ~65% resolved after 7 retry passes (~2 hours, ~1000 requests through rotating datacenter proxy)
  - Pagination requires cursor persistence across retries due to IP-per-page limitation
  - See "Rate Limits — THE REAL PROBLEM" section above for full post-mortem
2. **Sponsored Content API** (`src/fetch.ts` → `sponsored` command)
  - Complete snapshot of all live organic branded content on Snap
  - Creator ↔ sponsor mapping, content types, direct content links
  - In DuckDB as `sponsored_content` view
3. **Political Ads Library** (`src/fetch_political.ts`)
  - Only Snap source with actual spend data (not just impressions)
  - Full targeting breakdown, committee/org transparency chain
  - 2018–2026 historical coverage
  - In DuckDB as `political_ads` view

### What We Don't Have (and Can't Get)

- **Engagement metrics** (views, swipes, completions) — locked behind Marketing API (source 4) or DSA researcher access (source 7)
- **Creator profile data** (subscriber counts, categories, content analytics) — locked behind Public Profile API (source 5)
- **Non-EU commercial ads** — Ads Gallery is EU-only by DSA mandate
- **Historical commercial ads** — 12-month rolling window, older ads disappear
- **Spend data for commercial ads** — only political ads have spend; commercial ads only have impressions

### Remaining Open Questions

1. **Ads Gallery scaling**: Webshare datacenter proxy works but slowly (~17% hit rate). Apify (~$2/1000 ads) is the only proven high-throughput option. Residential proxies are counterproductively worse (0% hit rate, hard-blocked). Cloudflare Workers untested but theoretically viable for IP diversity. The fundamental constraint is 1 data-returning request per IP with 24h+ cooldown and subnet-level tracking.
2. **Sponsored content staleness**: The API only shows "currently live" content. No archive exists. Periodic re-scraping would capture new content but miss deletions. Our current dump is a point-in-time snapshot.
3. **Political ads refresh cadence**: The 2026 ZIP was last modified 2026-04-08 (today). Snap appears to update the current year's file regularly. Re-running `fetch_political.ts` periodically will capture updates.
4. **Creative asset persistence**: CDN URLs (`top_snap_media_download_link` in ads, `CreativeUrl` in political ads) have unknown TTL. Should download media assets if archival matters.

