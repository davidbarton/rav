# Ravineo x Snapchat Project

Single starting point for this repository.

## Start here (in order)

1. `agents/PROJECT_BRIEF.md`
  Core project contract: scope, expected outcomes, immutable original requirements, working principles.
2. `agents/RAVINEO_INTEL.md`
  Ravineo guide learnings, in-app dashboard observations, and implementation mapping.
3. `agents/INSIGHT_LOG.md`
  Source-tagged insight log and decisions (`adopt now` vs `later`).
4. `agents/TEAM_NOTES.md`
  User-provided team context: user profiles, expectations, and practical delivery implications.
5. `agents/FUTURE_BACKLOG.md`
  Next-stage backlog and `TASK_DEFINITION_V2.md` direction.
6. `agents/SUBMISSION.md`
  Evaluator path from Czech requirement contract to concrete repository evidence.
7. `agents/DELIVERY_CHECKLIST.md`
  Final freeze/repro/UI smoke checklist before handoff.

## Prototype

- UI + local run instructions: `app/README.md`
- Main UI: `app/index.html`
- Frontend behavior: `app/script.js`
- Dataset builder: `app/build_dataset.mjs` (`npm run build` from `app/`)
- Generated dataset: `app/data/normalized.json`

## How to evaluate quickly

- Open `app/` in browser and read the top “Read Me First” panel.
- Verify data provenance in `app/README.md` (`What Is Real vs Inferred`).
- Cross-check rationale and caveats in `agents/PROJECT_BRIEF.md` and `agents/RAVINEO_INTEL.md`.

## Reproducibility quick path

- Rebuild dataset: `cd app && npm run build`
- Start local server: `cd app && npm start`
- Open UI: `http://localhost:8000/app/`
- Check limits and acquisition caveats: `platform_choice/notes/limits.md`

## Data & Analytics

DuckDB is used as the shared analytical layer across the project. Raw JSON/CSV data stays on disk; DuckDB loads it into native tables.

- Setup & usage: `db/README.md`
- Database: `db/rav.db`
- Table definitions: `db/init.sql`
- Exploration queries: `db/queries/`

## Environment variables

Copy `.env.example` or create `.env` in repo root:

| Variable | Purpose |
| --- | --- |
| `SNAP_PROXY` | HTTP proxy URL for Snap API requests (Webshare rotating DC proxy) |
| `RESIDENTAL_PROXY` | Residential proxy URL (Evomi, used in experiments) |
| `APIFY_TOKEN` | Apify API token for scraper-based ad fetching |

All three are optional — scripts degrade gracefully or use direct connections when unset.

## Rules for document ownership

- `README.md` (this file): navigation only.
- `agents/PROJECT_BRIEF.md`: stable project contract and high-level scope.
- `agents/*.md`: detailed context that can evolve without bloating the brief.
- `AGENTS.md`: reserved for agent/tool behavior instructions, not project documentation.