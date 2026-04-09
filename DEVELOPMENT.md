# Development

Prerequisites, fetch pipelines, the prototype UI, and DuckDB build/refresh. Raw data lives under `data_sources/`; analytics tables in **`db/rav.db`**. Table inventory and volumes: **[DATA_SAMPLES.md](./DATA_SAMPLES.md)**.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [DuckDB CLI](https://duckdb.org/docs/installation/) (`brew install duckdb`)

## Environment variables

Create a `.env` file in the repo root:

| Variable | Purpose |
| --- | --- |
| `SNAP_PROXY` | HTTP proxy URL for Snap API requests (Webshare rotating DC proxy) |
| `RESIDENTAL_PROXY` | Residential proxy URL (Evomi, used in experiments) |
| `APIFY_TOKEN` | Apify API token for scraper-based ad fetching |

All three are optional — scripts degrade gracefully or use direct connections when unset.

## Data fetching

Scripts live under `data_sources/`. All fetchers are **idempotent** and resume from saved state. Everything runs from the repo root — one `npm install` installs all dependencies.

### Main pipeline

```bash
npm install                     # one-time setup (from repo root)

npm run fetch:ads               # Ads Gallery crawl (paid EU ads)
npm run fetch:sponsored         # Sponsored content crawl (complete — 535 pages final)
npm run fetch:political         # Political ads bulk download
npm run stats:sponsored         # Print sponsored crawl progress stats
npm run fetch:profiles          # Brand profile scrape (all 216 brands)
npm run fetch:explore           # Explore discovery (128 fashion & beauty keywords)
npm run fetch:spotlights        # Spotlight pages (108 sample URLs)
npm run fetch:sor               # EC DSA Statements of Reasons
```

Pass flags directly after `--`:

```bash
npm run fetch:profiles -- --limit 3    # Test with 3 brands
npm run fetch:profiles -- --status     # Print progress matrix
npm run fetch:explore -- --limit 5     # Test with 5 keywords
npm run fetch:explore -- --status      # Print progress dashboard
npm run fetch:explore -- --discovered  # Also crawl auto-discovered topic keywords
npm run fetch:spotlights -- --status   # Print progress
```

### EC DSA Statements of Reasons (extra flags)

```bash
npm run fetch:sor -- --status              # per-day progress + row counts
npm run fetch:sor -- --test                # one day + print 5 sample rows
npm run fetch:sor -- --days 30             # rolling window
npm run fetch:sor -- --from 2023-09-25 --to 2026-04-08   # full known range
npm run fetch:sor -- --retry               # only failed / not_found days
npm run fetch:sor -- --full                # full CSV variant (extra text columns)
```

After any change to raw files, rebuild analytics tables from the **repository root**:

```bash
duckdb db/rav.db < db/init.sql
```

## Prototype UI

```bash
npm run app:build          # rebuild dataset from raw samples
npm run app:start          # start local server
# open http://localhost:8000/app/
```

## DuckDB

```bash
duckdb db/rav.db < db/init.sql   # rebuild all tables
duckdb db/rav.db                 # interactive shell
```

### Build, load, and extend

Raw JSON/CSV under `data_sources/` is materialized into **`db/rav.db`** by **`db/init.sql`**.

Running `init.sql` **drops and recreates** every table from the current files on disk. Close anything else using the database file (for example Beekeeper Studio) first, or DuckDB may fail with a lock.

`db/init.sql` uses `CREATE TABLE ... AS SELECT` with `read_json_auto()` / `read_csv_auto()`. **`db/rav.db`** is gitignored and reproducible from raw data.

**Add a table for a new source:** write data under `data_sources/<source>/data/`, add or extend a `CREATE TABLE` block in `db/init.sql`, then run `duckdb db/rav.db < db/init.sql` from the repo root.

Example query:

```sql
SELECT sponsor_name, count(*) AS posts
FROM sponsored_content
WHERE sponsor_name != ''
GROUP BY sponsor_name
ORDER BY posts DESC
LIMIT 20;
```
