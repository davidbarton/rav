# Snapchat — Complete Map of Available Advertising Data

> Deep research, 2026-04-08. Focus: What data exists, how to get it, what shape it has, access constraints, and relevance to Ravineo.

---

## TL;DR — 7 Distinct Data Sources


| #   | Source                                               | Auth                      | Scope                                           | Bulk?                  | Relevance                                                                |
| --- | ---------------------------------------------------- | ------------------------- | ----------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| 1   | **Ads Gallery API** (EU Ad Library)                  | **None**                  | All paid ads in EU, last 12 months              | Paginated, no bulk ZIP | **PRIMARY** — free, unauthenticated, per-country impressions + targeting |
| 2   | **Sponsored Content API** (organic commercial)       | **None**                  | Live organic branded content globally           | Paginated              | **HIGH** — creator ↔ sponsor links, content types                        |
| 3   | **Political Ads Library** (bulk ZIP)                 | **None**                  | Political/advocacy ads, 2018–2026               | **Yes — CSV ZIP**      | **HIGH** — full spend, targeting, committee data                         |
| 4   | **Marketing API** (Ads API)                          | **OAuth 2.0**             | Own campaigns — CRUD + stats                    | N/A                    | LOW — requires advertiser account                                        |
| 5   | **Public Profile API**                               | **OAuth 2.0** (allowlist) | Creator discovery + profile metrics             | N/A                    | MEDIUM — creator metadata, requires partnership                          |
| 6   | **Conversions API** (CAPI)                           | **Auth token**            | Server-to-server event tracking                 | N/A                    | NONE — advertiser-side data, not public                                  |
| 7   | **DSA Transparency Reports** + **Researcher Access** | **Application**           | Moderation stats, content data under DSA Art.40 | Varies                 | MEDIUM — for academic/regulatory work                                    |


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

### Rate Limits

- Aggressive. Repeated POSTs → `E1009` or HTTP `429`.
- Space requests by several minutes between pages.
- ~10 results per page observed.

### What's Missing

- **No wildcard search** — you MUST provide `paying_advertiser_name`.
- **No "list all ads" endpoint** — you can't enumerate without knowing brand names.
- **EU only** — non-EU ads not included.
- **12-month window** — older ads disappear.
- No spend data (only impressions).

### Workaround Ideas

- Build a brand name dictionary from other sources, then query each.
- The sponsored content endpoint (below) is browsable without a name.

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

## Priority Matrix for Ravineo

### Immediate (no auth, free, actionable now)

1. **Ads Gallery API** — Build a brand-name crawler, systematically query EU ad data
2. **Sponsored Content API** — Full pagination dump of creator ↔ sponsor relationships
3. **Political Ads ZIP** — Download all years, analyze spend/targeting patterns

### Short-term (requires application/setup)

1. **DSA Researcher Access** — Apply for deep engagement data
2. **Public Profile API** — Request allowlisting for creator discovery

### Reference Only

1. **Marketing API** — Targeting taxonomy, ad format documentation
2. **Conversions API** — Architecture reference only

---

## Open Questions

1. **Brand name enumeration**: How to build exhaustive list of `paying_advertiser_name` values for Ads Gallery search? No wildcard endpoint exists.
2. **Rate limit bypass**: Current limits are tight (~1 req/2min observed). Proxy rotation? Multiple IPs? What's the actual documented limit?
3. **Sponsored content historical data**: Only "currently live" — is there an archive? Can we build one by polling?
4. **Political ads CSV granularity**: Need to download and inspect actual 2026 ZIP — do we get exact spend or ranges?
5. **Ads Gallery completeness**: Does it truly cover ALL EU ads, or just a sample? DSA mandate suggests all.
6. **Creative asset persistence**: How long do `top_snap_media_download_link` CDN URLs remain valid?

