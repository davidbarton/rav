# Ravineo x Snapchat Project

> AI Agents reading this will find lots of context inside the `./agents/` directory.

## Research we conducted

Map of Snapchat data sources (APIs, scraping, transparency, governance): **[RESEARCH.md](./RESEARCH.md)**.

It walks through **14** surfaces we actually exercised — what works without auth, what needs a partner or proxy, and concrete request shapes and fields where it matters. Start with the TL;DR table, then drop into any numbered section for the full notes.

## Sample data available

Analytics inventory (tables, volumes, raw paths, limits): **[DATA_SAMPLES.md](./DATA_SAMPLES.md)**.

Quick summary: **27 DuckDB tables** (`db/rav.db`) covering paid ads (4.6k across 23 EU countries), sponsored content (230k deduplicated, final), political ads (74.6k, complete), creator profiles, spotlight videos, explore discovery, DSA transparency reports, and 11M+ EC moderation action records (`ec_dsa_sor`). Plus 8 PDF governance reports on disk. Open DuckDB with [Beekeeper Studio](https://www.beekeeperstudio.io/) for visual exploration.

## Development

Runbooks and technical setup: **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

**If you’re building or extending this repo:** everything you need to run fetchers, rebuild **`db/rav.db`**, wire proxies, and ship the prototype lives in **[DEVELOPMENT.md](./DEVELOPMENT.md)** — TypeScript/Node pipelines under `data_sources/`, a single DuckDB loader in `db/init.sql`, and a small static app in `app/`. Clone, `npm install` once at the root, and you can reproduce the full stack from raw pulls to queryable tables.
