# Minimal Prototype

Ultra-minimal rough prototype for early validation.

## What it includes

- `Dashboard` view (KPI strip + advertiser leaderboard + category split)
- `Creator / Sponsored Content Snapshot` (sponsored rows, unique creators/sponsors, top sponsors, top creators)
- `Ad Campaigns` view with `Table/Gallery` toggle
- basic filters: `Search text`, `Category`, `Hide unknown`
- rough proxies:
  - estimated spend range (fixed CPM)
  - performance-per-spend proxy
  - risk score from simple keyword flags

## Build dataset

```bash
python3 prototype_min/build_dataset.py
```

This writes:

- `prototype_min/data/normalized.json`

### Reproducibility checklist (canonical)

1. Keep source samples in `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/`.
2. Run the builder command above from repo root.
3. Confirm output includes:
   - `ads`
   - `sponsored_content`
   - `sponsored_kpis`
4. Serve locally and verify UI loads the generated file:
   - `python3 -m http.server 8000`
   - open `http://localhost:8000/prototype_min/`

## Run locally

```bash
python3 -m http.server 8000
```

Open:

- `http://localhost:8000/prototype_min/`

## Notes

- Prototype only, intentionally rough.
- Spend/performance are transparent proxies, not exact values.

## What Is Real vs Inferred

- **Real (from local Snap sample files):**
  - ad rows and metadata (headline, advertiser/brand, media type, impressions, dates, review status)
  - sponsored commercial content rows (creator/sponsor/content URLs)
- **Inferred (prototype heuristics):**
  - spend range (`est_spend_low_eur` / `est_spend_high_eur`) from fixed CPM assumption
  - performance-per-spend proxy
  - category/sub-category classification from simple keyword rules
  - risk flags/score from keyword matching
- **Known dataset limitation:**
  - paid ad sample currently contains one successful advertiser pull (`Spotify`) in this local dataset; other ad files in sample folder are rate-limit errors (`E1009`).
  - organic coverage here is represented by Snap sponsored/commercial content endpoints, not a full platform-wide organic feed.
