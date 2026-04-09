# Ravineo x Snapchat Project

- For developers reading this, jump to section bellow ["How to run this code"](#how-to-run-this-code)
- For AI Agents reading this, you will find lots of context inside the `./agents/` directory.

## Research we conducted

- Ads data related research is available inside [research/ads_data_overview.md](./research/ads_data_overview.md)
  - 7 distinct Snapchat data sources mapped and tested hands-on, each with auth requirements, scope, and current status
  - Paid ads: what's available via EU Ad Library (impressions, targeting, creatives, landing pages) and the rate-limit/proxy challenges to get it
  - Organic commercial content: creator ↔ sponsor relationships, content types, how to crawl it, pagination and expiry gotchas
  - Political ads: bulk download with real spend data, targeting breakdowns, and advertiser transparency chains
  - Platform moderation data: enforcement volumes by policy, EU member state breakdowns, ads moderation, plus PDF risk assessments and audits

## Sample data available

All data lives in a single DuckDB database at `db/rav.db` (rebuild: `duckdb db/rav.db < db/init.sql`). Open it with [Beekeeper Studio](https://www.beekeeperstudio.io/) for easy visual exploration. 20 tables total:

| Source | Key tables | Rows | What |
| --- | --- | --- | --- |
| 1. Ads Gallery API | `brand_ads_fashion` | 917 | Paid EU ads — impressions, targeting, creatives |
| 2. Sponsored Content API | `sponsored_content` | 234k | Creator ↔ sponsor mappings, content URLs |
| 3. Political Ads Library | `political_ads` | 74.6k | Spend, impressions, targeting across 54 countries (2018–2026) |
| 6. DSA Transparency — EU | `eu_dsa_*` (9 tables) | 3.3k | Member state orders, notices, enforcement, appeals, AMAR |
| 6. DSA Transparency — Global | `global_*` (8 tables) | 72 | Enforcements, user reports, proactive detection, ads moderation |

PDF reports (risk assessments, audits): [`data_sources/transparency_reports/data/pdf/`](data_sources/transparency_reports/data/pdf/)

## How to run this code

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [DuckDB CLI](https://duckdb.org/docs/installation/) (`brew install duckdb`)

### The `.env` variables

Create a `.env` file in repo root:

| Variable | Purpose |
| --- | --- |
| `SNAP_PROXY` | HTTP proxy URL for Snap API requests (Webshare rotating DC proxy) |
| `RESIDENTAL_PROXY` | Residential proxy URL (Evomi, used in experiments) |
| `APIFY_TOKEN` | Apify API token for scraper-based ad fetching |

All three are optional — scripts degrade gracefully or use direct connections when unset.

### Data fetching (the main pipeline)

```bash
cd data_sources/snap_ads && npm install
npm run fetch:ads          # Ads Gallery crawl (paid EU ads)
npm run fetch:sponsored    # Sponsored content crawl (organic branded)
npm run fetch:political    # Political ads bulk download
npm run stats:sponsored    # Print sponsored crawl progress stats
```

### Prototype UI

```bash
cd app && npm run build    # rebuild dataset from raw samples
cd app && npm start        # start local server
# open http://localhost:8000/app/
```

### DuckDB (analytics layer)

Raw JSON/CSV stays on disk; DuckDB loads it into native tables in a single database.

```bash
duckdb db/rav.db < db/init.sql   # rebuild all 20 tables
duckdb db/rav.db                 # interactive queries
```

- Details: `db/README.md`
- Saved queries: `db/queries/`
