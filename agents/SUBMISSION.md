# Submission Package (Czech Task First)

This file is the evaluator path for verifying fulfillment of the original Czech assignment.

## 1) Contract baseline

- Canonical requirement contract: `agents/CZECH_TASK_CONTRACT.md`
- Rule: completion claims must reference `CZ-*` clause IDs with artifact evidence.

## 2) Requirement coverage status

- Canonical tracker: `agents/COVERAGE_MATRIX.md`
- Current status snapshot:
  - `done`: 14
  - `partial`: 0
  - `missing`: 0

## 3) Reproducible run path

From repo root:

```bash
cd app && npm run build && npm start
```

Open:

- `http://127.0.0.1:8000/app/`

Core generated artifact:

- `app/data/normalized.json`

Pre-flight checks:

- Confirm matrix is fully green in `agents/COVERAGE_MATRIX.md` (`done: 14`, `partial: 0`, `missing: 0`).
- Confirm gate policy snapshot in `agents/FUTURE_BACKLOG.md` is consistent with matrix.

## 4) Where to verify real data and limits

- Real sample inventory:
  - `platform_choice/data/samples/2026-04-07-snap-sponsored-content/README.md`
- Key sample files:
  - `ads_search_spotify_de_retry.json`
  - `ad_detail_by_id.json`
  - `sponsored_content_pages_1_2.json`
  - `sponsored_content_search_creator.json`
- Limits and acquisition caveats:
  - `platform_choice/notes/limits.md`

## 5) Real vs inferred boundary

- Real:
  - sampled Snapchat ad rows and sponsored/commercial content rows from local JSON artifacts.
- Inferred/proxy:
  - spend range estimates,
  - performance-per-spend metric,
  - heuristic categorization,
  - heuristic risk scoring.
- Verification source:
  - `app/README.md` (`What Is Real vs Inferred`)

## 6) Evidence path by evaluator question

- Why Snapchat and why this choice:
  - `agents/PROJECT_BRIEF.md`
  - `platform_choice/docs/INITIAL_RESEARCH.md`
- Data source mapping:
  - `platform_choice/docs/INITIAL_RESEARCH.md`
  - `platform_choice/docs/platform-data-experiment.md`
- Real sample retrieval + limitations:
  - `platform_choice/data/samples/...`
  - `platform_choice/notes/limits.md`
- Insights for B2C usage:
  - `agents/INSIGHT_LOG.md`
  - `agents/RAVINEO_INTEL.md`
- Usable prototype visualization:
  - `app/index.html`
  - `app/script.js`
  - `app/README.md`

## 6.1) 10-minute evaluator sequence

1. Open `agents/CZECH_TASK_CONTRACT.md` (what was asked).
2. Open `agents/COVERAGE_MATRIX.md` (where each clause is proven).
3. Run local reproduction commands from section 3.
4. Open `http://localhost:8000/app/` and verify:
   - Dashboard KPIs + leaderboard,
   - Creator/Sponsored snapshot,
   - Ad Campaigns table/gallery with risk column.
5. Verify limits and caveats:
   - `platform_choice/notes/limits.md`
   - `app/README.md` (`What Is Real vs Inferred`)

## 7) Known residual risks (explicit)

- Paid ad sample breadth is limited by observed rate-limiting behavior in collection runs.
- Influencer/collaboration and organic presence are represented through sponsored/commercial endpoint surfaces; not a full platform-wide organic or partnership graph.
- Spend/performance values are directional proxies, not exact financial truth.

## 8) Scope gate

Non-Czech-scope feature work stays deferred unless `agents/COVERAGE_MATRIX.md` remains fully satisfied (`done` for all `CZ-*`).
