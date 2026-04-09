# Ravineo Intel

## Ravineo guide learnings (source-tagged)

### Product and metric expectations

- Ravineo emphasizes decision-ready indicators over raw rows, especially `Share of Ads Voice`, `Estimated Spend`, and AI categorization-style layers.
  - **Source:** `https://www.ravineo.com/guide/platforms-metrics`
- Ravineo explicitly documents metric methodology and tradeoffs (for example cumulative reach vs deduplicated reach), which signals they expect transparent assumptions and stated constraints.
  - **Source:** `https://www.ravineo.com/guide/platforms-metrics`
  - **Source:** `https://www.ravineo.com/guide/influencers-metrics`
- Cross-platform comparability is presented as a core strength, even with unavoidable precision limitations.
  - **Source:** `https://www.ravineo.com/guide/platforms-metrics`

### Influencer and risk expectations

- Influencer analytics focus is on detecting brand presence in content (including undeclared/background presence), not only declared partnerships.
  - **Source:** `https://www.ravineo.com/guide/influencers-introduction`
- Key influencer output patterns include metrics, timelines/content views, and explainable exposure-like indicators.
  - **Source:** `https://www.ravineo.com/guide/influencers-metrics`
  - **Source:** `https://www.ravineo.com/guide/timelines-content`
- Brand safety and risk profiling are structured as AI topic/risk taxonomies with graded scores.
  - **Source:** `https://www.ravineo.com/guide/topics-risks`

### Delivery implications for this Snapchat exercise

- Submission should present clear proxy metrics (not exact spend claims) plus transparent limitations and assumptions.
  - **Source basis:** Ravineo methodology framing in `platforms-metrics` and `influencers-metrics`
- UI should be operational and inspection-friendly (overview metrics, timeline/content detail, risk lens, and clear methodology notes).
  - **Source basis:** `timelines-content`, `topics-risks`, `platforms-metrics`

### Evidence quality note

- The above findings come from authenticated Ravineo Guide pages reviewed directly after login in this session.
- They should be treated as product-intent guidance for this exercise, not a legal or contractual product specification.

## Real in-app dashboard observations (source-tagged)

### What was reviewed live

- Ads dashboard: `Telecoms Demo` overview and ad-campaigns views.
  - **Source:** `https://app.ravineo.com/dashboard/UWaACbKa8ShI?country=CZ&category=TV+Services&source=Central&start=2026-01-06&end=2026-04-06`
  - **Source (ad campaigns):** same dashboard URL with `&view=ads`
- Fraud-focused dashboard: `Fraud CZ` overview and ad-campaigns views.
  - **Source:** `https://app.ravineo.com/dashboard/es1DjTWkJzzy?country=CZ&source=Meta&start=2026-01-06&end=2026-04-06`
  - **Source (ad campaigns):** same dashboard URL with `&view=ads`

### Confirmed UI and product patterns

- Dual working modes are explicit and central: `Dashboard` (aggregated insights) and `Ad Campaigns` (record-level inspection).
  - **Source basis:** both live dashboard URLs above (`view` toggling).
- Top-of-screen KPI strip is standard: ad volume + reach/impressions-like metric + estimated spend (+ demographics on relevant datasets).
  - **Source basis:** both live dashboard URLs above.
- Filtering is workflow-critical and first-class: date range, category/source filters, platform tabs, `Add Filter`, and segmentation toggles.
  - **Source basis:** both live dashboard URLs above.
- Comparative analytics are consistently visualized via:
  - share/voice donut or equivalent distribution,
  - time-series bars/lines (day/week/month),
  - composition breakdowns (brand/platform/category/media/payer dimensions).
  - **Source basis:** both live dashboard URLs above.
- Category hygiene controls exist in-product (`Hide unknown`), confirming they expect noisy real-world taxonomy handling rather than perfect classification.
  - **Source basis:** `Telecoms Demo` dashboard URL above.
- Fraud-focused table schema is operational and auditable: ad row + fraud signals + personality/fraud-type/entity tags + runtime metadata.
  - **Source basis:** `Fraud CZ` URL with `&view=ads`.

### Implementation implication for our exercise

- Our prototype should mirror this two-level pattern:
  - **Level 1:** aggregate KPI and trend views for decision making.
  - **Level 2:** ad-level table/gallery for auditability and evidence tracing.
- We should include:
  - dimension toggles,
  - unknown-category handling,
  - explicit risk/signal columns for suspicious content patterns.

### Access caveat observed

- The influencers web app root (`https://influencers.ravineo.com/`) was reachable but returned an in-app error state (`Something went wrong`) during this pass, so no reliable influencer dashboard content was captured from the live app UI in this step.

## Additional surface sweep (in-app + product shell)

Explored beyond the two dashboards already documented, to see if anything else was worth mirroring in our prototype. **Sources are URLs observed in the browser during this sweep.**

### TikTok Extreme (TikTok-only slice)

- **URL:** `https://app.ravineo.com/dashboard/cXDCMY55oNPQ?country=AT&source=TikTok&start=2026-01-06&end=2026-04-06`
- **Worth exploring:** yes for **layout parity** with short-video ad analytics (video-specific widgets).
- **What we saw:** same shell as other Ads dashboards (`Dashboard` / `Ad Campaigns`, date range, `Add Filter`, “Show by” **Brand**, chart metric toggles such as cumulative unique reach vs ads vs est. spend). Widget slots included **Share of Ads Voice**, **Cumulative Unique Reach**, **Video Length**, **Media Type**, and dimension tabs (**Country** / **Display Format** / **Payer**).
- **Data caveat:** for this country/date/source combination the charts showed **no data** in-session — still useful as a **negative test**: our UI should handle empty states gracefully.

### Loreal Categorization Test (AI category dimensions in production UI)

- **URL (overview):** `https://app.ravineo.com/dashboard/sKE79EtFRD1S?country=CZ&source=Central&start=2026-01-06&end=2026-04-06`
- **URL (ad table):** same with `&view=ads`
- **Worth exploring:** yes — strongest match to **Guide** language on AI categorization and client “product line” views.
- **What we saw:**
  - **Me vs Others** mode (share split and stacked trends) with explanatory UI — benchmark framing, not only competitor listing.
  - Multi-level category dimensions in breakdowns and in the ad table: **Categories**, **Sub-Categories**, **Second Level Test** (hierarchical taxonomy).
  - Multiple **Hide unknown** controls with different percentages — reinforces “unknown bucket is normal.”
  - In **Ad Campaigns** / **Table**: row-level **Est. Spend** ranges, **Running** recency/duration, creative + brand — same inspection pattern as other dashboards.

### My Analytics (connected owned properties)

- **URL:** `https://app.ravineo.com/my`
- **Worth exploring:** medium — different problem (owned analytics) than transparency libraries; less central to the hiring brief unless we pitch “bridge to first-party.”
- **What we saw:** search, **Connect New**, and tiles to open linked **Facebook**-backed dashboards (e.g. named org pages). Not expanded further in this sweep.

### Reports (document delivery, not interactive dashboard)

- **URL:** `https://www.ravineo.com/reports`
- **Worth exploring:** low for the prototype, high for **narrative**: Ravineo also ships **downloadable transparency reports**; **Custom Reports** marked **Soon** with contact path for bespoke output.

## Report artifact review (exec-facing signal)

### Reviewed artifact

- **Landing page:** `https://www.ravineo.com/reports`
- **PDF report:** `https://storage.googleapis.com/ravineo-web-assets/Ravineo%20Report_Top%20Advertisers%20on%20Meta%20and%20YouTube%20in%20France.pdf`
- **Frame statement in report:** Q3 2024 snapshot of transparent data, processed by Ravineo.

### What this signals about Ravineo's "exec cream"

- Ravineo packages transparency data into **board-friendly ranked outputs** (Top 25 + Top 5 by vertical), not just analyst dashboards.
- The report is **country-specific and time-bounded** (France, Q3 snapshot), which suggests executives value constrained and comparable market windows.
- It combines **cross-platform comparability** (Meta vs YouTube) with **category-level breakdowns** (Retail, Food, Entertainment, Fashion/Beauty).
- It includes **simple media and audience slices** (format split, demographic reach distribution) that are easy to consume in email/PDF contexts.
- Language is lightweight and confidence-safe: "based on snapshot of transparent data" instead of overclaiming precision.

### Implementation implications for Snapchat project

- Add a report-mode deliverable path from day one:
  - `Top advertisers` leaderboard,
  - `Top vertical` cuts,
  - short methodology/caveat block.
- Keep output "exec consumable" first:
  - one-page summary cards + ranked lists + 1-2 composition charts.
- Preserve confidence framing in all outputs:
  - snapshot window,
  - data source scope,
  - proxy assumptions.
- Plan for "dashboard to report" parity:
  - same core metrics should be visible in UI and export-ready summary.

### Sweep conclusion

- **Highest signal for our Snapchat exercise:** replicate **Loreal-style** hierarchy (category / sub-category / optional third level) and **Fraud-style** signal columns — using our real Snap fields and honest proxies — plus **TikTok Extreme-style** video-oriented breakdowns where our data supports it.
- **Skip for now:** deep dive **My Analytics** unless the write-up explicitly needs a “first-party connector” story.

## Deep dive extract — TikTok + Loreal for Snapchat

### TikTok Extreme: reusable patterns for Snapchat short-video context

- **Source (dashboard):** `https://app.ravineo.com/dashboard/cXDCMY55oNPQ?country=AT&source=TikTok&start=2026-01-06&end=2026-04-06`
- **Source (ad campaigns):** same URL with `&view=ads`
- **Observed KPI shell in ad-campaigns mode:** `Ads`, `Reach`, `Est. Spend (BETA)`, and `Demographics` status messaging when unavailable.
- **Observed ad-campaigns table schema (empty-state view):**
  - columns include ad-level fields plus `Running`, `Cumulative reach`, `Avg daily`, and `Est. Spend (BETA)`.
  - `Table` and `Gallery` switch exists even when rows are zero.
- **Observed dashboard widgets:** `Share of Ads Voice`, `Cumulative Unique Reach` (small + large), `Video Length`, `Media Type`, and dimension tabs (`Country`, `Display Format`, `Payer`).
- **Snapchat relevance:** this is the closest in-app template for a short-video-first dashboard where some dimensions may be sparse; we should preserve these placeholders and explicit “metric unavailable” states.

### Loreal Categorization Test: reusable taxonomy and inspection workflows

- **Source (overview):** `https://app.ravineo.com/dashboard/sKE79EtFRD1S?country=CZ&source=Central&start=2026-01-06&end=2026-04-06`
- **Source (ad campaigns):** same URL with `&view=ads`
- **Observed filter builder options (`Add Filter`):**
  - `Brand`, `Category`, `Me vs Others`, `Second Level Test`, `Sub-Category`, `Platform`, `Media Type`, `Payer`, `Search text`.
- **Observed dimension controls on dashboard:**
  - compare dimensions (`Brands` / `Platforms`),
  - category hierarchy (`Categories`, `Sub-Categories`, `Second Level Test`),
  - unknown-bucket controls (`Hide unknown(...)`) across panels.
- **Observed ad-campaigns outputs (table mode):**
  - row-level creative snippet + brand identity,
  - `Sub-Categories`, `Second Level Test`, `Categories`,
  - `Running` (recency + duration),
  - `Est. Spend` range.
- **Observed ad-campaigns outputs (gallery mode):**
  - creative cards with brand, message snippet, CTA button labels, and multi-version indicators.
- **Snapchat relevance:** this is the best blueprint for mapping raw ads into decision dimensions and auditable rows/cards, without pretending exact spend.

### Concrete implementation mapping for our Snapchat project

- **Module A — Overview KPI strip**
  - `Ads`, `Pressure Proxy`, `Est. Spend Proxy`, `Demographics availability`.
  - If a metric is unsupported by a source slice, show explicit unavailable-state text (TikTok pattern).
- **Module B — Trend + distribution**
  - weekly trend chart + share distribution + breakdown tabs (Country / Media Type / Payer-like equivalents).
- **Module C — Taxonomy layer**
  - provide at least two category levels (`Category`, `Sub-Category`) and optional third-level tags when confidence is high.
  - include `Unknown` bucket toggle.
- **Module D — Ad Campaigns dual view**
  - `Table`: creative, brand/payer, taxonomy fields, running window, proxy metrics.
  - `Gallery`: creative-first cards + quick metadata + “multiple versions” marker.
- **Module E — Filter builder**
  - implement subset of Ravineo-like operators: `Brand`, `Category`, `Sub-Category`, `Platform/source`, `Media type`, `Payer`, `Search text`.

### Priority decisions

- **Must copy now:** Loreal taxonomy + Table/Gallery pattern + TikTok empty-state behavior.
- **Nice-to-have later:** full `Me vs Others` benchmarking mode (can be approximated after core snapshot works).
