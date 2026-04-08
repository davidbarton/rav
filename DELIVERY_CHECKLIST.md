# Delivery Checklist

Final release checklist for the current Czech-scope-complete state.

## A) Freeze checks

- [ ] `docs/COVERAGE_MATRIX.md` totals are still `done: 14`, `partial: 0`, `missing: 0`.
- [ ] `docs/FUTURE_BACKLOG.md` gate snapshot matches current matrix.
- [ ] `SUBMISSION.md` references only existing files.

## B) Reproducibility checks

- [ ] Run: `python3 prototype_min/build_dataset.py`
- [ ] Confirm output file updated: `prototype_min/data/normalized.json`
- [ ] Run: `python3 -m http.server 8000`
- [ ] Open: `http://localhost:8000/prototype_min/`

## C) UI smoke checks

- [ ] `Dashboard` loads with KPI cards and leaderboard.
- [ ] `Creator / Sponsored Content Snapshot` shows sponsored rows, creator/sponsor counts, top lists.
- [ ] `Ad Campaigns` tab works in both `Table` and `Gallery`.
- [ ] Risk column/cards are visible and non-empty formatting is sane.

## D) Evidence integrity checks

- [ ] Real sample inventory exists: `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/README.md`
- [ ] Limits document exists and is consistent: `0_platform_choice/notes/limits.md`
- [ ] Real vs inferred boundary is explicit: `prototype_min/README.md`

## E) Submission handoff sequence

1. Share `SUBMISSION.md` as entry point.
2. Share `docs/CZECH_TASK_CONTRACT.md` for exact requirement baseline.
3. Share `docs/COVERAGE_MATRIX.md` for clause-by-clause proof.
4. Share local run commands and UI URL.
5. Share residual risks exactly as listed in `SUBMISSION.md`.
