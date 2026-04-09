# Research

Human-readable descriptions of **what this repository produces** and **what we learned per research track**: datasets, methods, limits, and paths to artifacts. Keep file paths **copy-paste exact**.

## Categories (one directory each)

Each folder matches one **research category** from the assignment. Add markdown files inside the category; keep a short row in that folder’s index table.

| Directory | Focus |
|-----------|--------|
| [`ads/`](ads/) | Ad libraries, transparency tools, documented APIs |
| [`creators/`](creators/) | Creators — sponsored surfaces, creator search |
| [`organic/`](organic/) | Organic content — is it downloadable, and how |
| [`malicious/`](malicious/) | **Malicious** — opinion manipulation, financial fraud, “social charity” scams, and similar abuse signals |

## Layout (repo)

| Path | Role |
|------|------|
| `research/**` | Narrative docs only — no generated binaries |
| `data_sources/` | Fetch pipelines and on-disk JSON/CSV outputs |
| `platform_choice/data/samples/` | Curated API samples (experiments + prototype) |
| `app/data/` | UI bundle input (`normalized.json`, etc.) |
| `db/` | DuckDB layer over raw files |

## Conventions

- **Per doc:** *Summary*, *Source & method*, *Location in repo*, *Schema / fields*, *Known limits*, *Downstream use* (what reads this).
- **Dates:** ISO `YYYY-MM-DD` in prose.
- **Cross-links:** Point to the right **category** from the hub above; link sibling categories when scope overlaps.

## Related entry points

- Project navigation: [`README.md`](../README.md) (repo root)
- Snap sample inventory: [`platform_choice/data/samples/2026-04-07-snap-sponsored-content/README.md`](../platform_choice/data/samples/2026-04-07-snap-sponsored-content/README.md)
- Prototype build: [`app/README.md`](../app/README.md)










# ADS DATA OVERVOEW

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

Every source was investigated, tested, or attempted. Four are accessible and actively used. Two are blocked but achievable with outreach. One is a dead end.

### Final Scorecard


| #   | Source                    | Status               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Ads Gallery API**       | **ACTIVE — ongoing** | Working but rate-limit constrained. ~3.7% per-request success via Webshare DC rotating proxy, accumulating over multi-pass retries. 98 brands across 22 countries (13,116 ads from ~39k requests so far). GCP IPs show subnet/ASN-level throttling. |
| 2   | **Sponsored Content API** | **ACTIVE — ongoing** | Prior partial snapshot: 882 pages, ~176k items. New crawl in progress (106 pages / 53k items so far). Creator ↔ sponsor relationships captured. ~92% have empty sponsor_name (Snap's own monetization). ~8% are real brand partnerships — high-signal data. |
| 3   | **Political Ads Library** | **COMPLETE**         | All 9 years (2018–2026) downloaded as bulk CSVs. 74,609 ads, $117.5M spend (mixed currencies), 19.6B impressions, 2,773 unique advertisers across 54 countries. Loaded in DuckDB as `political_ads` table. Re-download script for future updates.                                                                                                                                                                                                                  |
| 4   | **Marketing API**         | **BLOCKED — achievable** | Requires customer OAuth access to their ad accounts. Exposes real spend, engagement, and performance data for validation. Achievable if customers grant access. |
| 5   | **Public Profile API**    | **BLOCKED — achievable** | Requires an allowlisted OAuth app. Allowlisting requires a Snap partnership contact ("send your client ID to your Snap contact"). No self-serve access, but establishing a partnership is realistic for a business like Ravineo — expect a few weeks of outreach. |
| 6   | **DSA Transparency Reports** | **COMPLETE** | 21+ semi-annual reports (since 2015), EU DSA XLSX, enforcement data by policy reason, ads moderation stats. Downloaded and loaded into DuckDB (17 tables). No auth needed. |
| 7   | **DSA Researcher Access** | **DEAD END** | Requires non-commercial research purpose. Ravineo is commercial — disqualified. Even academics rejected (Dutch university: 5/7 criteria failed after 80 days). |


### What We Have

**4 accessible data sources (3 active + 1 complete), all free and unauthenticated:**

1. **Ads Gallery API** (`src/fetch.ts`)
  - EU paid ads with impressions, targeting, creative assets, landing page URLs
  - Rate-limit constrained (~3.7% per-request success via Webshare DC proxy), no authenticated tier
  - 215 Fashion & Beauty brands across 28 EU countries; 98 brands / 22 countries / 13,116 ads fetched so far from ~39k requests
  - Pagination requires cursor persistence across retries
  - See "Rate Limits — THE REAL PROBLEM" section above for full details
2. **Sponsored Content API** (`src/fetch.ts` → `sponsored` command)
  - Snapshots of all live organic branded content on Snap
  - Creator ↔ sponsor mapping, content types, direct content links
  - Prior snapshot: 882 pages / ~176k items. New crawl in progress
3. **Political Ads Library** (`src/fetch_political.ts`)
  - Only Snap source with actual spend data (not just impressions)
  - Full targeting breakdown, committee/org transparency chain
  - 2018–2026 historical coverage
  - In DuckDB as `political_ads` table
4. **DSA Transparency Reports** (`data_sources/transparency_reports/`)
  - 21+ semi-annual reports, enforcement data, ads moderation stats
  - EU DSA XLSX + global report data downloaded and converted
  - 17 tables loaded in DuckDB

### What We Don't Have (and Can't Get)

- **Engagement metrics** (views, swipes, completions) — locked behind Marketing API (source 4) or DSA researcher access (source 7)
- **Creator profile data** (subscriber counts, categories, content analytics) — locked behind Public Profile API (source 5)
- **Non-EU commercial ads** — Ads Gallery is EU-only by DSA mandate
- **Historical commercial ads** — 12-month rolling window, older ads disappear
- **Spend data for commercial ads** — only political ads have spend; commercial ads only have impressions

### Remaining Open Questions

1. **Ads Gallery scaling**: Webshare DC rotating proxy achieves ~3.7% per-request success, accumulating via multi-pass retries. Apify (~$2/1000 ads) is the proven high-throughput alternative. Early Evomi residential test (60 requests, 0%) was never tested at scale. Cooldown duration is unknown. GCP's own IPs show subnet-level throttling.
2. **Sponsored content staleness**: The API only shows "currently live" content. No archive exists. Periodic re-scraping captures new content but misses deletions. Each crawl is a point-in-time snapshot.
3. **Political ads refresh cadence**: The 2026 ZIP was last modified 2026-04-08. Snap appears to update the current year's file regularly. Re-running `fetch_political.ts` periodically will capture updates.
4. **Creative asset persistence**: CDN URLs (`top_snap_media_download_link` in ads, `CreativeUrl` in political ads) have unknown TTL. Should download media assets if archival matters.

