# DuckDB — Project Analytics Layer

Shared analytical database for all data explorations in this project.
Raw JSON/CSV on disk is **copied into** `db/rav.db` as native tables when you run `db/init.sql`.

## Setup

```bash
brew install duckdb
```

## Initialize / refresh

From the project root:

```bash
duckdb db/rav.db < db/init.sql
```

This **drops and rebuilds** all tables from the current files under `data_sources/...`. Run again any time new data is fetched.

## What gets loaded

27 tables across 9 source groups. Full inventory with row counts and RESEARCH.md cross-references: **[DATA_SAMPLES.md](../DATA_SAMPLES.md)**.

| Group | Tables | Source |
| --- | --- | --- |
| Sponsored Content | `sponsored_content` | `/sponsored_content` pages JSON |
| Brand Ads (fashion) | `brand_ads_fashion` | Ads Gallery `ads_fashion/*.json` (all EU countries) |
| Political Ads | `political_ads` | Bulk CSV 2018–2026 |
| Brand Profiles | `brand_profiles`, `brand_profile_spotlights` | Profile web scrape JSON |
| Spotlight Pages | `spotlight_pages` | Individual spotlight page JSON |
| Explore Discovery | `explore_keywords`, `explore_subscribe_profiles`, `explore_spotlight_creators` | `/explore/<keyword>` scrape JSON |
| EU DSA Transparency | `eu_dsa_member_state_orders`, `eu_dsa_notices`, `eu_dsa_own_initiative_illegal`, `eu_dsa_own_initiative_tc`, `eu_dsa_appeals`, `eu_dsa_automated_means`, `eu_dsa_human_resources`, `eu_dsa_amar`, `eu_dsa_categories` | EU DSA XLSX → CSV |
| Global Transparency | `global_enforcements_by_policy`, `global_user_reports_by_policy`, `global_proactive_detection`, `global_appeals_by_policy`, `global_regional_enforcements`, `global_ads_moderation`, `global_csea`, `eu_csea_2025` | H1 2025 report → CSV |
| EC DSA SOR (Snapchat) | `ec_dsa_sor` | `dsa_transparency/data/daily/snapchat-*.csv` |

## Explore

```bash
duckdb db/rav.db
```

Then run any query:

```sql
SELECT sponsor_name, count(*) as posts
FROM sponsored_content
WHERE sponsor_name != ''
GROUP BY sponsor_name
ORDER BY posts DESC
LIMIT 20;
```

Or run a saved query file:

```bash
duckdb db/rav.db < db/queries/sponsored.sql
```

## How it works

- `db/init.sql` — `CREATE TABLE ... AS SELECT` from `read_json_auto()` / `read_csv_auto()` (loads once; data lives in `db/rav.db`)
- `db/queries/` — saved exploration queries, run them with `duckdb db/rav.db < db/queries/<file>.sql`
- `db/rav.db` — the database file (gitignored, derived from raw data, fully reproducible)

Close other apps that have `db/rav.db` open (e.g. Beekeeper Studio) before running `duckdb db/rav.db < db/init.sql`, or DuckDB will error with a file lock.

## Adding new data sources

1. Fetch raw data into `data_sources/<source>/data/`
2. Add a new `CREATE TABLE` block in `db/init.sql` (or extend an existing load)
3. Add exploration queries in `db/queries/`
4. Re-run `duckdb db/rav.db < db/init.sql`
