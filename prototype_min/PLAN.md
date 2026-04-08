# Minimal v1 Plan (Triple-Checked)

## Goal

Ship a minimal, reproducible local prototype for Snapchat data that supports:
- fast validation of approach,
- clear table-first analysis,
- lightweight visual summaries,
- no auth/users/settings complexity.

## Scope (v1)

1. Reproducible local data pipeline (file-based)
   - Single script to normalize local sample JSON into one canonical dataset file.
   - Output stored locally in `prototype_min/data/normalized.json`.
   - Add metadata and assumptions directly in dataset output.

2. Minimal UI (Tailwind CDN)
   - No framework setup, no backend runtime needed.
   - Two views only: `Dashboard` and `Ad Campaigns`.
   - Table first, with tiny visual blocks (bars, split cards), no heavy chart libs.

3. Required analysis slices
   - KPIs: ads count, impressions, spend proxy range, unknown-category ratio.
   - Leaderboard by advertiser (impressions + spend proxy).
   - Category split with unknown handling.
   - Risk table fields (flags + score).
   - Table/Gallery switch in campaign mode.

4. Filtering
   - Search text.
   - Category filter.
   - Hide unknown toggle.
   - Sorting by impressions/spend/risk.

5. Documentation
   - Clear run instructions.
   - Explicit warning that spend/performance are proxies.
   - "What is real vs inferred" summary in README.

## Out of Scope (v1)

- Auth, users, settings, role management.
- Full shadcn setup + React build system.
- Advanced model-based spend inference.
- Production quality styling/testing.

---

## Critical Review #1 (feasibility / speed)

### Risks found
- Using shadcn now adds setup overhead and delays learning.
- Complex visualizations can waste time before validation.
- Over-modeling data early can lock wrong assumptions.

### Corrections
- Use Tailwind CDN + vanilla JS.
- Use tiny visualizations only (progress bars / micro summaries).
- Keep pipeline as deterministic script with simple heuristics.

### Decision
- Plan remains feasible in one focused pass.

---

## Critical Review #2 (alignment / usefulness)

### Risks found
- Prototype may look "too toy" if not structured like Ravineo workflows.
- Missing explicit limitations can create false confidence.
- If filters are weak, validation conversations will stall.

### Corrections
- Keep Ravineo-like flow: Dashboard + Ad Campaigns, table + gallery.
- Put assumptions and caveats into both dataset and UI footer.
- Add basic sorting + filtering in ad table for practical exploration.

### Decision
- Plan is solid for minimal v1 validation and supports immediate iteration.

---

## Final Implementation Checklist

- [x] Data script produces deterministic local JSON
- [x] Tailwind minimal UI wired to local JSON
- [x] Dashboard KPIs + leaderboard + category/risk summaries
- [x] Ad Campaigns table + gallery
- [x] Search/category/hide-unknown/sort interactions
- [x] README includes run flow + assumptions + caveats
