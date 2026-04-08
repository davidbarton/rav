# Submission Package (Czech Task First)

This file is the evaluator path for verifying fulfillment of the original Czech assignment.

## 1) Contract baseline

- Canonical requirement contract: `docs/CZECH_TASK_CONTRACT.md`
- Rule: completion claims must reference `CZ-*` clause IDs with artifact evidence.

## 2) Requirement coverage status

- Canonical tracker: `docs/COVERAGE_MATRIX.md`
- Current status snapshot:
  - `done`: 14
  - `partial`: 0
  - `missing`: 0

## 3) Reproducible run path

From repo root:

```bash
cd prototype_min && npm run build && npm start
```

Open:

- `http://127.0.0.1:8000/prototype_min/`

Core generated artifact:

- `prototype_min/data/normalized.json`

Pre-flight checks:

- Confirm matrix is fully green in `docs/COVERAGE_MATRIX.md` (`done: 14`, `partial: 0`, `missing: 0`).
- Confirm gate policy snapshot in `docs/FUTURE_BACKLOG.md` is consistent with matrix.

## 4) Where to verify real data and limits

- Real sample inventory:
  - `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/README.md`
- Key sample files:
  - `ads_search_spotify_de_retry.json`
  - `ad_detail_by_id.json`
  - `sponsored_content_pages_1_2.json`
  - `sponsored_content_search_creator.json`
- Limits and acquisition caveats:
  - `0_platform_choice/notes/limits.md`

## 5) Real vs inferred boundary

- Real:
  - sampled Snapchat ad rows and sponsored/commercial content rows from local JSON artifacts.
- Inferred/proxy:
  - spend range estimates,
  - performance-per-spend metric,
  - heuristic categorization,
  - heuristic risk scoring.
- Verification source:
  - `prototype_min/README.md` (`What Is Real vs Inferred`)

## 6) Evidence path by evaluator question

- Why Snapchat and why this choice:
  - `PROJECT_BRIEF.md`
  - `0_platform_choice/docs/INITIAL_RESEARCH.md`
- Data source mapping:
  - `0_platform_choice/docs/INITIAL_RESEARCH.md`
  - `0_platform_choice/docs/platform-data-experiment.md`
- Real sample retrieval + limitations:
  - `0_platform_choice/data/samples/...`
  - `0_platform_choice/notes/limits.md`
- Insights for B2C usage:
  - `docs/INSIGHT_LOG.md`
  - `docs/RAVINEO_INTEL.md`
- Usable prototype visualization:
  - `prototype_min/index.html`
  - `prototype_min/script.js`
  - `prototype_min/README.md`

## 6.1) 10-minute evaluator sequence

1. Open `docs/CZECH_TASK_CONTRACT.md` (what was asked).
2. Open `docs/COVERAGE_MATRIX.md` (where each clause is proven).
3. Run local reproduction commands from section 3.
4. Open `http://localhost:8000/prototype_min/` and verify:
   - Dashboard KPIs + leaderboard,
   - Creator/Sponsored snapshot,
   - Ad Campaigns table/gallery with risk column.
5. Verify limits and caveats:
   - `0_platform_choice/notes/limits.md`
   - `prototype_min/README.md` (`What Is Real vs Inferred`)

## 7) Known residual risks (explicit)

- Paid ad sample breadth is limited by observed rate-limiting behavior in collection runs.
- Influencer/collaboration and organic presence are represented through sponsored/commercial endpoint surfaces; not a full platform-wide organic or partnership graph.
- Spend/performance values are directional proxies, not exact financial truth.

## 8) Scope gate

Non-Czech-scope feature work stays deferred unless `docs/COVERAGE_MATRIX.md` remains fully satisfied (`done` for all `CZ-*`).
