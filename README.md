# Ravineo x Snapchat Project

- For developers reading this, jump to section below ["How to run this code"](#how-to-run-this-code)
- For AI Agents reading this, you will find lots of context inside the `./agents/` directory.

## Research we conducted

Map of Snapchat data sources (APIs, scraping, transparency, governance): **[RESEARCH.md](./RESEARCH.md)**.

It walks through **14** surfaces we actually exercised — what works without auth, what needs a partner or proxy, and concrete request shapes and fields where it matters. Start with the TL;DR table, then drop into any numbered section for the full notes.

## Sample data available

Full inventory of every table, file, and fetcher: **[DATA_SAMPLES.md](./DATA_SAMPLES.md)**.

Quick summary: **27 DuckDB tables** (`db/rav.db`) covering paid ads (4.6k across 23 EU countries), sponsored content (230k deduplicated), political ads (74.6k, complete), creator profiles, spotlight videos, explore discovery, DSA transparency reports, and 11M+ EC moderation action records (`ec_dsa_sor`). Plus 8 PDF governance reports on disk. Open DuckDB with [Beekeeper Studio](https://www.beekeeperstudio.io/) for visual exploration.

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

cd data_sources/snap_profiles && npm install
npx tsx src/fetch_profiles.ts          # Brand profile scrape (all 216 brands)
npx tsx src/fetch_profiles.ts --limit 3  # Test with 3 brands
npx tsx src/fetch_profiles.ts --status   # Print progress matrix

cd data_sources/snap_explore && npm install
npx tsx src/fetch_explore.ts           # Explore discovery (128 fashion & beauty keywords)
npx tsx src/fetch_explore.ts --limit 5   # Test with 5 keywords
npx tsx src/fetch_explore.ts --status    # Print progress dashboard
npx tsx src/fetch_explore.ts --discovered # Also crawl auto-discovered topic keywords

cd data_sources/snap_spotlights && npm install
npx tsx src/fetch_spotlights.ts          # Spotlight pages (108 sample URLs)
npx tsx src/fetch_spotlights.ts --status # Print progress

cd data_sources/dsa_transparency && npm install
npx tsx src/fetch_sor.ts --status        # Show downloaded EC DSA SOR days
npx tsx src/fetch_sor.ts --days 30       # Download last 30 days of Snapchat SORs
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
duckdb db/rav.db < db/init.sql   # rebuild all 27 tables
duckdb db/rav.db                 # interactive queries
```

- Details: `db/README.md`
- Saved queries: `db/queries/`
