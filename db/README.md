# DuckDB — Project Analytics Layer

Shared analytical database for all data explorations in this project.
Raw JSON stays on disk. DuckDB creates views over it. No data duplication.

## Setup

```bash
brew install duckdb
```

## Initialize

From the project root:

```bash
duckdb rav.db < db/init.sql
```

This creates views over the raw JSON page files fetched by the data scripts.
Re-run any time new data is fetched — views are replaced, not appended.

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

- `db/init.sql` — creates VIEWs over raw JSON files using `read_json_auto()` with glob patterns
- `db/queries/` — saved exploration queries, run them with `duckdb rav.db < db/queries/<file>.sql`
- `rav.db` — the database file (gitignored, derived from raw data, fully reproducible)

## Adding new data sources

1. Fetch raw data into `1_data_sources/<source>/data/`
2. Add a new VIEW in `db/init.sql` that reads the JSON/CSV files
3. Add exploration queries in `db/queries/`
4. Re-run `duckdb rav.db < db/init.sql`
