# Czech Requirement Coverage Matrix

Canonical progress tracker for original task fulfillment.
Source contract: `docs/CZECH_TASK_CONTRACT.md`.

## Status scale

- `done`: requirement has concrete repository evidence and no blocking gap.
- `partial`: some evidence exists, but coverage is incomplete or caveated.
- `missing`: no acceptable evidence artifact yet.

## Coverage table

| ID | Requirement (short) | Status | Evidence paths | Gap / blocker |
| --- | --- | --- | --- | --- |
| CZ-1 | Choose Pinterest or Snapchat | done | `PROJECT_BRIEF.md`, `0_platform_choice/docs/INITIAL_RESEARCH.md` | None |
| CZ-2 | Explain platform choice | done | `PROJECT_BRIEF.md`, `0_platform_choice/docs/INITIAL_RESEARCH.md`, `0_platform_choice/README.md` | None |
| CZ-3 | Map available platform data sources | done | `0_platform_choice/docs/INITIAL_RESEARCH.md`, `0_platform_choice/docs/platform-data-experiment.md`, `0_platform_choice/notes/limits.md` | None |
| CZ-4 | Ad/transparency data | done | `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/ads_search_spotify_de_retry.json`, `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/ad_detail_by_id.json`, `0_platform_choice/docs/INITIAL_RESEARCH.md` | None |
| CZ-5 | Influencer / creator activity | done | `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/sponsored_content_search_creator.json`, `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/sponsored_content_pages_1_2.json`, `prototype_min/data/normalized.json` (`sponsored_content`, `sponsored_kpis.top_creators`), `prototype_min/index.html` (`Creator / Sponsored Content Snapshot`), `prototype_min/script.js` (`renderSponsoredSnapshot`) | Covered via sponsored/commercial creator activity surface; not claiming full influencer graph. |
| CZ-6 | Organic content downloadable? how? | done | `0_platform_choice/docs/INITIAL_RESEARCH.md`, `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/sponsored_content_pages_1_2.json`, `0_platform_choice/notes/limits.md`, `prototype_min/README.md` (organic coverage caveat), `prototype_min/data/normalized.json` (`sponsored_kpis.scope_note`) | Answered with explicit boundary: downloadable sponsored/commercial organic-like surface is proven; full organic feed is out of scope and documented as a limit. |
| CZ-7 | Data relevant to manipulation/fraud | done | `prototype_min/build_dataset.py` (`detect_risk`), `prototype_min/data/normalized.json` (`risk_flags`, `risk_score`), `prototype_min/script.js` (risk rendering), `docs/RAVINEO_INTEL.md` | None |
| CZ-8 | Download real sample + document method/limits | done | `0_platform_choice/data/samples/2026-04-07-snap-sponsored-content/README.md`, sample JSON files in same folder, `0_platform_choice/notes/limits.md`, `prototype_min/build_dataset.py` | None |
| CZ-9 | Propose analytical views/insights for clients | done | `PROJECT_BRIEF.md`, `docs/INSIGHT_LOG.md`, `docs/RAVINEO_INTEL.md`, `prototype_min/README.md` | None |
| CZ-10 | Competitor ad spend | done | `prototype_min/build_dataset.py` (spend proxy model), `prototype_min/data/normalized.json` (`est_spend_*`), `prototype_min/README.md` (proxy caveat) | None |
| CZ-11 | Collaboration with influencers | done | `prototype_min/data/normalized.json` (`sponsored_content.creator_name`, `sponsor_name`, `sponsored_kpis.top_sponsors`, `sponsored_kpis.top_creators`), `prototype_min/index.html` (`Creator / Sponsored Content Snapshot`), `prototype_min/script.js` (`renderSponsoredSnapshot`) | Collaboration is evidenced as creator-sponsor co-occurrence in sponsored content; not a full partnership contract graph. |
| CZ-12 | Organic presence on platform | done | `prototype_min/data/normalized.json` (`sponsored_content`, `sponsored_kpis.sponsored_rows`, `sponsored_kpis.unique_creators`, `sponsored_kpis.unique_sponsors`, `sponsored_kpis.scope_note`), `prototype_min/index.html`, `prototype_min/README.md`, `0_platform_choice/docs/INITIAL_RESEARCH.md` | Organic presence is represented through sponsored/commercial endpoint visibility with explicit scope caveat. |
| CZ-13 | Potential misuse (disinfo/scam/fake) | done | `prototype_min/build_dataset.py` (`detect_risk`, `risk_score`), `prototype_min/script.js` (risk column/cards), `prototype_min/index.html` | None |
| CZ-14 | Usable UI prototype for visualization | done | `prototype_min/index.html`, `prototype_min/script.js`, `prototype_min/README.md` | None |

## Current totals

- `done`: 14
- `partial`: 0
- `missing`: 0

## Immediate closure priorities (strict Czech-scope)

1. Preserve strict caveat language for influencer and organic boundaries in all docs/UI.
2. Use this matrix as gate before any non-Czech-scope expansion.

## UI-to-requirement proof map (Segment 5 guardrail)

| UI element | File path | Requirement linkage |
| --- | --- | --- |
| Read Me First panel (scope, real vs inferred, limits) | `prototype_min/index.html` | CZ-2, CZ-8, CZ-10 |
| Dashboard KPI strip + leaderboard + category split | `prototype_min/index.html`, `prototype_min/script.js` | CZ-4, CZ-9, CZ-10, CZ-14 |
| Creator / Sponsored Content Snapshot | `prototype_min/index.html`, `prototype_min/script.js`, `prototype_min/data/normalized.json` | CZ-5, CZ-6, CZ-11, CZ-12 |
| Ad Campaigns Table/Gallery | `prototype_min/index.html`, `prototype_min/script.js` | CZ-9, CZ-13, CZ-14 |
| Risk score and flags rendering | `prototype_min/build_dataset.py`, `prototype_min/script.js` | CZ-7, CZ-13 |
