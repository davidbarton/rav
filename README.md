# Ravineo x Snapchat Project

Single starting point for this repository.

## Start here (in order)

1. `PROJECT_BRIEF.md`
  Core project contract: scope, expected outcomes, immutable original requirements, working principles.
2. `docs/RAVINEO_INTEL.md`
  Ravineo guide learnings, in-app dashboard observations, and implementation mapping.
3. `docs/INSIGHT_LOG.md`
  Source-tagged insight log and decisions (`adopt now` vs `later`).
4. `docs/TEAM_NOTES.md`
  User-provided team context: user profiles, expectations, and practical delivery implications.
5. `docs/FUTURE_BACKLOG.md`
  Next-stage backlog and `TASK_DEFINITION_V2.md` direction.
6. `SUBMISSION.md`
  Evaluator path from Czech requirement contract to concrete repository evidence.
7. `DELIVERY_CHECKLIST.md`
  Final freeze/repro/UI smoke checklist before handoff.

## Prototype

- UI + local run instructions: `prototype_min/README.md`
- Main UI: `prototype_min/index.html`
- Frontend behavior: `prototype_min/script.js`
- Dataset builder: `prototype_min/build_dataset.py`
- Generated dataset: `prototype_min/data/normalized.json`

## How to evaluate quickly

- Open `prototype_min/` in browser and read the top “Read Me First” panel.
- Verify data provenance in `prototype_min/README.md` (`What Is Real vs Inferred`).
- Cross-check rationale and caveats in `PROJECT_BRIEF.md` and `docs/RAVINEO_INTEL.md`.

## Reproducibility quick path

- Rebuild dataset: `python3 prototype_min/build_dataset.py`
- Start local server: `python3 -m http.server 8000`
- Open UI: `http://localhost:8000/prototype_min/`
- Check limits and acquisition caveats: `0_platform_choice/notes/limits.md`

## Data & Analytics

DuckDB is used as the shared analytical layer across the project. Raw JSON/CSV data stays on disk; DuckDB creates views over it.

- Setup & usage: `db/README.md`
- View definitions: `db/init.sql`
- Exploration queries: `db/queries/`

## Rules for document ownership

- `README.md` (this file): navigation only.
- `PROJECT_BRIEF.md`: stable project contract and high-level scope.
- `docs/*.md`: detailed context that can evolve without bloating the brief.
- `AGENTS.md`: reserved for agent/tool behavior instructions, not project documentation.