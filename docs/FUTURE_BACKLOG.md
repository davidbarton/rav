# Future Backlog

## Active Next Tasks (Expected vs Assumed)

Use this as the single canonical queue for near-term execution.

### Expected (explicitly requested)

- [ ] Build an exec-facing snapshot artifact:
  - add `prototype_min/REPORT_TEMPLATE.md`
  - generate one snapshot draft from current dataset (top advertisers, top categories, methodology/caveat block).
- [x] Add a requirements coverage matrix artifact:
  - create `docs/COVERAGE_MATRIX.md`
  - map original requirements to concrete evidence paths in repo.
- [x] Prepare evaluator-friendly submission packaging:
  - create root `SUBMISSION.md` with run steps, real-vs-inferred framing, limitations, and next-phase plan.

### Assumed (_ASSUMPTION_: useful unless reprioritized)

- [ ] Add metric confidence labels in data + UI:
  - add `confidence_level` metadata for proxy metrics in `prototype_min/data/normalized.json` build flow,
  - surface confidence badges in `prototype_min/index.html`.
- [ ] Improve minimal UI trust and operability:
  - standardized empty/error/unsupported states,
  - add export for current filtered table view (CSV/JSON).

### Blocked

- [ ] Scope gate active: all non-Czech-scope tasks remain blocked unless explicitly unlocked by user.
- [ ] Exec report expansion (`prototype_min/REPORT_TEMPLATE.md`) deferred by Czech-first priority rule.
- [ ] `TASK_DEFINITION_V2.md` drafting deferred until user unlocks post-scope work.

### Done (recent)

- [x] Refactored oversized brief into focused docs (`docs/RAVINEO_INTEL.md`, `docs/INSIGHT_LOG.md`, `docs/TEAM_NOTES.md`, `docs/FUTURE_BACKLOG.md`) and slimmed `PROJECT_BRIEF.md`.
- [x] Added root `README.md` as repository start point and document map.
- [x] Added collapsible evaluator-focused "Read Me First" section to prototype UI.
- [x] Captured lessons from Ravineo public report artifact in intel + insight log.
- [x] Locked Czech contract baseline (`docs/CZECH_TASK_CONTRACT.md`) with `CZ-*` clause IDs.
- [x] Closed Czech coverage matrix to full pass (`docs/COVERAGE_MATRIX.md`: `done` 14/14).
- [x] Added strict evaluator package (`SUBMISSION.md`) with reproducible run path and residual-risk disclosure.
- [x] Added creator/sponsored snapshot in prototype to evidence collaboration and organic-presence boundaries.

## Scope gate policy (must follow)

1. Canonical gate source is `docs/COVERAGE_MATRIX.md`.
2. If any `CZ-*` clause is not `done`, only Czech-scope closure work is allowed.
3. Even when all `CZ-*` are `done`, non-Czech-scope execution requires explicit user unlock in chat.
4. Backlog items in this file do not auto-start; they require explicit user instruction.

## Gate audit snapshot

- **Last gate check date:** 2026-04-08
- **Gate source state:** `docs/COVERAGE_MATRIX.md` shows `done: 14`, `partial: 0`, `missing: 0`
- **Operational mode:** Czech scope complete; non-Czech-scope work remains blocked until explicit user unlock.

## Backlog item: Write improved task definition (go one step ahead)

- **Status:** queued for later stage
- **Priority:** high (strategic differentiation)
- **Owner:** project lead (with AI support)
- **Why:** current assignment is good for baseline execution, but likely under-specifies some product-reality requirements seen in Ravineo docs and real dashboards.
- **Outcome target:** produce a sharper, engineering+sales-aware task definition that:
  - preserves original assignment intent,
  - adds missing acceptance criteria,
  - clarifies metric confidence/limitations,
  - better reflects report-consumer workflows (email/report outputs),
  - improves comparability and risk-analysis expectations.

## Candidate gaps to evaluate when writing improved definition

- Missing explicit distinction between **real data** vs **inferred/proxy metrics**.
- Missing required confidence labeling for spend/performance estimates.
- Missing minimum UX expectations for review workflows (`Dashboard` + `Ad Campaigns` style duality).
- Missing acceptance criteria for taxonomy quality (`unknown` handling, category hierarchy depth).
- Missing requirement for reproducibility guarantees (scripted data build + local artifacts).
- Missing guidance for report-ready deliverables for non-technical users (marketing managers).

## Deliverable shape (later)

- `TASK_DEFINITION_V2.md` with:
  - revised objective,
  - explicit success criteria,
  - required evidence matrix,
  - scoring rubric (technical execution + insight quality + communication quality),
  - optional stretch goals.
