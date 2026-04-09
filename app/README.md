# Minimal Prototype

Ultra-minimal rough prototype for early validation.

## What it includes

- `Dashboard` view (KPI strip + advertiser leaderboard + category split)
- `Creator / Sponsored Content Snapshot` (sponsored rows, unique creators/sponsors, top sponsors, top creators)
- `Ad Campaigns` view with `Table/Gallery` toggle
- basic filters: `Search text`, `Category`, `Hide unknown`
- rough proxies:
  - estimated spend range (fixed CPM)
  - performance-per-spend proxy
  - risk score from simple keyword flags

## Build dataset

Requires [Node.js](https://nodejs.org/) 18+ and [DuckDB CLI](https://duckdb.org/docs/installation/) (`brew install duckdb`).

```bash
npm run app:build        # from repo root
```

This queries `db/rav.db` (`brand_ads_fashion` + `sponsored_content` tables) and writes:

- `app/data/normalized.json`

If the DB doesn't exist yet, build it first: `npm run db:init` (from repo root).

### Reproducibility checklist (canonical)

1. Populate DuckDB: `npm run db:init` (loads raw crawl JSON/CSV from `data_sources/`).
2. Run builder: `npm run app:build`.
3. Confirm output includes `ads` (4.6k+), `sponsored_kpis` (230k rows summarized), and `leaderboard`.
4. Serve locally and verify UI loads the generated file:
   - `npm run app:start`
   - open `http://127.0.0.1:8000/app/`

## Run locally

```bash
npm run app:start        # from repo root
```

Open:

- `http://127.0.0.1:8000/app/`

## Notes

- Prototype only, intentionally rough.
- Spend/performance are transparent proxies, not exact values.

## What Is Real vs Inferred

- **Real (from DuckDB / Snap API crawls):**
  - 4,625 ad rows across 98 brands and 23 EU countries (headline, advertiser/brand, media type, impressions, dates, review status)
  - 230,267 sponsored commercial content rows (creator/sponsor/content URLs), 62k creators, 3k named sponsors — final dataset, crawl abandoned due to cursor expiry
- **Inferred (prototype heuristics):**
  - spend range (`est_spend_low_eur` / `est_spend_high_eur`) from fixed CPM assumption
  - performance-per-spend proxy
  - category/sub-category classification from brand/keyword rules
  - risk flags/score from keyword matching
- **Known dataset limitation:**
  - ad coverage is rate-limit constrained (10 ads per brand×country query); sample, not exhaustive.
  - organic coverage is represented by Snap sponsored/commercial content endpoints, not a full platform-wide organic feed.
