# Delivery Checklist

Final release checklist for the current Czech-scope-complete state.

## A) Freeze checks

- [ ] `agents/COVERAGE_MATRIX.md` totals are still `done: 14`, `partial: 0`, `missing: 0`.
- [ ] `agents/FUTURE_BACKLOG.md` gate snapshot matches current matrix.
- [ ] `agents/SUBMISSION.md` references only existing files.

## B) Reproducibility checks

- [ ] Run: `cd app && npm run build`
- [ ] Confirm output file updated: `app/data/normalized.json`
- [ ] Run: `cd app && npm start`
- [ ] Open: `http://127.0.0.1:8000/app/`

## C) UI smoke checks

- [ ] `Dashboard` loads with KPI cards and leaderboard.
- [ ] `Creator / Sponsored Content Snapshot` shows sponsored rows, creator/sponsor counts, top lists.
- [ ] `Ad Campaigns` tab works in both `Table` and `Gallery`.
- [ ] Risk column/cards are visible and non-empty formatting is sane.

## D) Evidence integrity checks

- [ ] Real sample inventory exists: `platform_choice/data/samples/2026-04-07-snap-sponsored-content/README.md`
- [ ] Limits document exists and is consistent: `platform_choice/notes/limits.md`
- [ ] Real vs inferred boundary is explicit: `app/README.md`

## E) Submission handoff sequence

1. Share `agents/SUBMISSION.md` as entry point.
2. Share `agents/CZECH_TASK_CONTRACT.md` for exact requirement baseline.
3. Share `agents/COVERAGE_MATRIX.md` for clause-by-clause proof.
4. Share local run commands and UI URL.
5. Share residual risks exactly as listed in `agents/SUBMISSION.md`.
