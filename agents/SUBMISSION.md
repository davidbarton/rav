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

- Platform choice (why Snapchat vs Pinterest):
  - `PLATFORM_CHOICE.md`
- Acquisition limits and caveats (rate limits, what is real vs inferred):
  - `app/README.md`, `RESEARCH.md` as applicable
- Raw API/crawl JSON (see also `DATA_SAMPLES.md` for the full inventory):
  - `data_sources/snap_ads/data/ads_fashion/*.json` — per-brand EU ad-library pulls
  - `data_sources/snap_ads/data/sponsored_2026-04-09T07-51-44/sponsored_content/page_*.json` — sponsored/commercial browse pages (timestamps in folder names change per crawl)
  - `data_sources/snap_ads/data/creators_2026-04-08T09-21-35/sponsored_by_creator/*/page_*.json` — creator-scoped sponsored content
  - `data_sources/snap_ads/data/ad_detail_2026-04-08T08-44-29/ads_by_id/*.json` — single-ad detail fetches

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
  - `PLATFORM_CHOICE.md`
  - `agents/PROJECT_BRIEF.md` (task framing)
- Data source mapping (endpoints, fields, limits in depth):
  - `RESEARCH.md`
- Real sample retrieval:
  - `data_sources/snap_ads/data/**` (raw pulls; `app/build_dataset.mjs` pins specific inputs), `DATA_SAMPLES.md`
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
5. Verify rationale, API detail, and caveats:
   - `PLATFORM_CHOICE.md` (why Snap vs Pinterest)
   - `RESEARCH.md` (endpoints, limits, coverage)
   - `app/README.md` (`What Is Real vs Inferred`)

## 7) Known residual risks (explicit)

- Paid ad sample breadth is limited by observed rate-limiting behavior in collection runs.
- Influencer/collaboration and organic presence are represented through sponsored/commercial endpoint surfaces; not a full platform-wide organic or partnership graph.
- Spend/performance values are directional proxies, not exact financial truth.

## 8) Scope gate

Non-Czech-scope feature work stays deferred unless `agents/COVERAGE_MATRIX.md` remains fully satisfied (`done` for all `CZ-*`).
