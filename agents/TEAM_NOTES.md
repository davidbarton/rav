# Ravineo Team Notes (User-Provided)

**Last synced with repo:** 2026-04-09 (layout, data paths, and shipped prototype).

## Source and confidence

- **Source:** direct user notes from personal conversation with Ravineo team.
- **Confidence:** high for intent/alignment, medium for implementation specifics until validated in build/runtime.

## Users and usage model

- Typical users are marketing personnel and managers.
- Most users mainly consume email reports rather than spending long time in dashboards.
- Competitive comparison is a top priority.
- Spend is very important, and performance per spend is even more important.

## Team expectations for this task

- Work style preference: avoid old/boring output.
- Estimated effort expectation: roughly 2 days.
- Cover everything in scope; go deep where there is something interesting.
- Do not trade away broad coverage for depth.
- Emphasis is more on technical insight and practical ways to achieve outcomes than speculative business opportunity hunting.
- Team is open to frequent check-ins and nuance support (including operational workarounds, e.g. proxy options when IP gets blocked/rate-limited).

## Implementation ideas (later-phase)

- Reuse Ravineo design language/system where practical.
- High-impact stretch goal: estimate ad spend in dollar values.
- Create company leaderboards by vertical/category.

## What this changes in our project plan

- Prioritize delivery artifacts for report consumers:
  - concise KPI summaries,
  - leaderboard blocks,
  - exportable/report-friendly outputs.
- Keep both:
  - broad requirement coverage (ads, creators, organic/commercial, fraud-relevant),
  - selective deep dives where signals are strong.
- Treat spend estimation as:
  - core proxy output in Phase 1,
  - dollar-normalized model as stretch/Phase 2.
- Add an explicit "performance per spend proxy" metric track to the UI spec.

## Current repo alignment (engineering snapshot)

This section is not new stakeholder guidance; it maps the notes above to what exists in the tree **as of the sync date** so expectations stay honest.

- **Email/report-first consumers:** `app/index.html` + `app/script.js` emphasize scannable KPIs, leaderboard blocks, and a creator/sponsored snapshot; methodology and real-vs-inferred boundaries are spelled out in `app/README.md` and the in-app “Read Me First” panel.
- **Spend and performance per spend:** `app/build_dataset.mjs` emits impression-based spend *bands* and a performance-per-spend proxy into `app/data/normalized.json`, with warnings that these are directional only.
- **Competitive / brand-oriented views:** ad campaigns table + gallery, filters, and risk flags in the same prototype; deeper competitive scale lives in DuckDB and raw pulls (see `DATA_SAMPLES.md`, `RESEARCH.md`, `data_sources/snap_ads/`).
- **Proxies when blocked:** optional `SNAP_PROXY` / related env vars are documented in root `README.md` and `.env.example`; the main Snap fetcher is `data_sources/snap_ads` (`npm run fetch` scripts there).
- **Czech deliverable packaging:** requirement traceability and evaluator run path are in `agents/COVERAGE_MATRIX.md` and `agents/SUBMISSION.md`.

**Still open vs these notes (see `agents/FUTURE_BACKLOG.md`):** exec-facing `app/REPORT_TEMPLATE.md`, table export, explicit confidence labels on proxy metrics in UI, and dollar-normalized spend (stretch).
