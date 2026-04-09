# Insight Log

Use this format for every new learning:

- `Insight`
- `Source URL`
- `Evidence type` (Guide / live dashboard / table view / gallery view / empty-state)
- `Impact on Snapchat prototype` (UI, data model, metric, filter, risk logic)
- `Decision` (adopt now / adopt later / discard)

## Latest captured insights

- **Insight:** Short-video dashboards need explicit metric-unavailable and no-data states, not silent blanks.
  - **Confidence label:** hypothesis (pattern transfer from Ravineo dashboards, not directly measured on broad Snap production dataset)
  - **Source URL:** `https://app.ravineo.com/dashboard/cXDCMY55oNPQ?country=AT&source=TikTok&start=2026-01-06&end=2026-04-06`
  - **Evidence type:** live dashboard + ad-campaigns empty-state
  - **Impact on Snapchat prototype:** add standardized empty/error/unsupported cards for each widget and KPI.
  - **Decision:** adopt now

- **Insight:** Ad-campaigns view should expose both table and gallery even with low/zero volume.
  - **Confidence label:** proxy (supported by observed Ravineo behavior; implemented as UX policy)
  - **Source URL:** `https://app.ravineo.com/dashboard/cXDCMY55oNPQ?country=AT&source=TikTok&start=2026-01-06&end=2026-04-06&view=ads`
  - **Evidence type:** live ad-campaigns view
  - **Impact on Snapchat prototype:** keep dual-mode UI stable; prevent conditional removal of gallery mode.
  - **Decision:** adopt now

- **Insight:** Multi-level taxonomy is core to analysis UX (`Category` -> `Sub-Category` -> optional third level).
  - **Confidence label:** proxy (UX structure measured in Ravineo, categories in prototype are heuristic-derived)
  - **Source URL:** `https://app.ravineo.com/dashboard/sKE79EtFRD1S?country=CZ&source=Central&start=2026-01-06&end=2026-04-06`
  - **Evidence type:** live dashboard dimensions + filter builder
  - **Impact on Snapchat prototype:** data model must support hierarchical labels and unknown-bucket controls.
  - **Decision:** adopt now

- **Insight:** Filter builder breadth is a product differentiator; include text search alongside structured filters.
  - **Confidence label:** proxy
  - **Source URL:** `https://app.ravineo.com/dashboard/sKE79EtFRD1S?country=CZ&source=Central&start=2026-01-06&end=2026-04-06`
  - **Evidence type:** `Add Filter` options list
  - **Impact on Snapchat prototype:** implement minimum set: `Brand`, `Category`, `Sub-Category`, `Media Type`, `Payer`, `Search text`.
  - **Decision:** adopt now

- **Insight:** Row-level temporal context (`Running`: last seen + duration) is consistently shown and useful.
  - **Confidence label:** measured (directly represented in current ad rows as `running_days`)
  - **Source URL:** `https://app.ravineo.com/dashboard/sKE79EtFRD1S?country=CZ&source=Central&start=2026-01-06&end=2026-04-06&view=ads`
  - **Evidence type:** live ad table
  - **Impact on Snapchat prototype:** include active window / seen-at metadata columns for trust and auditability.
  - **Decision:** adopt now

- **Insight:** Spend is displayed as ranges/proxies; exactness is not required when uncertainty is transparent.
  - **Confidence label:** proxy
  - **Source URL:** `https://www.ravineo.com/guide/platforms-metrics`
  - **Evidence type:** Guide methodology + live estimated-spend ranges
  - **Impact on Snapchat prototype:** keep spend/pressure as proxy ranges with clear assumptions.
  - **Decision:** adopt now

- **Insight:** Ravineo's public report style shows executives prefer ranked, country/time-bounded "snapshot intelligence" over dense exploratory UI.
  - **Confidence label:** hypothesis (inferred from one public report artifact)
  - **Source URL:** `https://www.ravineo.com/reports`
  - **Source URL:** `https://storage.googleapis.com/ravineo-web-assets/Ravineo%20Report_Top%20Advertisers%20on%20Meta%20and%20YouTube%20in%20France.pdf`
  - **Evidence type:** report landing page + PDF artifact
  - **Impact on Snapchat prototype:** add report-friendly output mode (Top advertisers, Top by vertical, compact methodology/caveat panel).
  - **Decision:** adopt now

- **Insight:** Cross-platform and vertical segmentation are packaged as executive narrative blocks (Top 25 overall, Top 5 per vertical).
  - **Confidence label:** measured (explicitly present in reviewed PDF artifact)
  - **Source URL:** `https://storage.googleapis.com/ravineo-web-assets/Ravineo%20Report_Top%20Advertisers%20on%20Meta%20and%20YouTube%20in%20France.pdf`
  - **Evidence type:** PDF report pages 1-3
  - **Impact on Snapchat prototype:** design "snapshot deck page" template even if currently single-platform (Snapchat only) to keep expansion path clear.
  - **Decision:** adopt later

- **Insight:** Political ads CPM validation — EUR-denominated political ads on Snapchat show median CPM €2.43, P75 €4.30, P90 €6.88. Our assumed €4-9 band for commercial ads sits comfortably in the P50-P90 range of even the cheaper political inventory, making it conservative and defensible.
  - **Confidence label:** measured (computed from 4,588 EUR political ads with real disclosed spend in `political_ads` table)
  - **Source URL:** N/A (repository data: `db/rav.db` table `political_ads`)
  - **Evidence type:** DuckDB query on real spend data
  - **Impact on Snapchat prototype:** validates current spend proxy model; supports upgrade to format-stratified CPM.
  - **Decision:** adopt now

- **Insight:** Format-stratified CPM improves spend accuracy significantly. AR/Lens formats cost 3-5x standard Snap Ads (€25-40 vs €8-15 CPM). Our data has 18 distinct creative_type × ad_render_type combinations. Applying format-aware CPMs tightens per-ad spend ranges.
  - **Confidence label:** proxy (CPMs from published benchmarks: adcredits.expert, baoliba.uk, agence-anode.fr; format distribution measured in our data)
  - **Source URL:** `https://adcredits.expert/snapchat-ads-pricing/`, `https://baoliba.uk/2025-netherlands-snapchat-full-category-advertising-rate-table-guide-6112/`
  - **Evidence type:** web research + DuckDB query
  - **Impact on Snapchat prototype:** upgrade `build_dataset.ts` spend model from flat 4-9 EUR to format-aware bands.
  - **Decision:** adopt now

- **Insight:** Share of Voice (impression share) is the most robust competitive spend proxy because ratio cancels CPM uncertainty. Nike holds 24.1% of fashion ad impressions on Snapchat EU — this relative ranking is stable regardless of actual CPM.
  - **Confidence label:** measured (computed from `brand_ads_fashion` across 4,625 ads)
  - **Source URL:** N/A (repository data)
  - **Evidence type:** DuckDB query
  - **Impact on Snapchat prototype:** make Share of Voice the primary competitive metric, ahead of absolute spend estimates.
  - **Decision:** adopt now

- **Insight:** Ravineo does NOT currently have Snapchat in their platform. Their dashboards show Meta, YouTube, Google, TikTok — no Snapchat option. This is the product gap our work fills.
  - **Confidence label:** measured (directly observed in live Ravineo dashboards)
  - **Source URL:** `https://app.ravineo.com/dashboard/UWaACbKa8ShI`, `https://app.ravineo.com/dashboard/sKE79EtFRD1S`
  - **Evidence type:** live dashboard (browser exploration, 2026-04-09)
  - **Impact on Snapchat prototype:** positions our work as filling a real product gap, not duplicating existing coverage.
  - **Decision:** adopt now (positioning)

- **Insight:** Geographic concentration reveals strategic intent. HUGO BOSS puts 73% of Snapchat budget into Germany (home market bias); Nike spreads 49% France + 29% Netherlands. Zalando goes pan-European (11 markets, max 28% in any one). These patterns are immediately actionable for market entry and competitive response.
  - **Confidence label:** measured (computed from `brand_ads_fashion.impressions_total` by country)
  - **Source URL:** N/A (repository data)
  - **Evidence type:** DuckDB query
  - **Impact on Snapchat prototype:** add geographic heatmap / allocation chart as a core dashboard widget.
  - **Decision:** adopt now
