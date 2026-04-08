# DuckDB — Project Analytics Layer

Shared analytical database for all data explorations in this project.
Raw JSON/CSV on disk is **copied into** `rav.db` as native tables when you run `db/init.sql`.

## Setup

```bash
brew install duckdb
```

## Initialize / refresh

From the project root:

```bash
duckdb rav.db < db/init.sql
```

This **drops and rebuilds** the tables from the current files under `1_data_sources/...`. Run again any time new data is fetched.

## Explore

```bash
duckdb rav.db
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
duckdb rav.db < db/queries/sponsored.sql
```

## How it works

- `db/init.sql` — `CREATE TABLE ... AS SELECT` from `read_json_auto()` / `read_csv_auto()` (loads once; data lives in `rav.db`)
- **Tables:** `sponsored_content` (organic `/sponsored_content` pages), `brand_ads_fashion` (paid ads from `ads_fashion/*_de.json`), `political_ads` (political CSVs)
- `db/queries/` — saved exploration queries, run them with `duckdb rav.db < db/queries/<file>.sql`
- `rav.db` — the database file (gitignored, derived from raw data, fully reproducible)

Close other apps that have `rav.db` open (e.g. Beekeeper Studio) before running `duckdb rav.db < db/init.sql`, or DuckDB will error with a file lock.

## Adding new data sources

1. Fetch raw data into `1_data_sources/<source>/data/`
2. Add a new `CREATE TABLE` block in `db/init.sql` (or extend an existing load)
3. Add exploration queries in `db/queries/`
4. Re-run `duckdb rav.db < db/init.sql`
