# Data Samples — What We Have and Where It Lives

> Inventory for **analytics and reporting**: queryable tables, volumes, business-facing notes, on-disk layout, and coverage limits. Methodology and API detail: **[RESEARCH.md](./RESEARCH.md)**. To fetch new data, rebuild DuckDB, or change loaders: **[DEVELOPMENT.md](./DEVELOPMENT.md)**. Verified 2026-04-09.

---

## DuckDB — 27 queryable tables

Structured datasets are exposed as tables in **`db/rav.db`**. Use the [Beekeeper Studio](https://www.beekeeperstudio.io/) or any DuckDB-capable tool against that file.

### Advertising

| Table | Rows | Source | Find in RESEARCH.md | Notes |
| --- | ---: | --- | --- | --- |
| `brand_ads_fashion` | 4,625 | Ads Gallery API — per-brand × per-country (23 EU countries) | Search **Ads Gallery API** | Impressions, targeting, creatives. 98 brands across 23 countries. Rate-limit constrained — sample, not exhaustive. |
| `sponsored_content` | 230,267 | Sponsored Content API — paginated browse (deduplicated) | Search **Sponsored Content API** | Creator ↔ sponsor pairs + content URLs. ~8% have named sponsors; rest are platform-monetized. 178k distinct content URLs; rows > URLs because one creator can have multiple sponsors. |
| `political_ads` | 74,609 | Political Ads Library — bulk CSV 2018–2026 | Search **Political Ads Library** | **Complete** — all 9 years, spend + impressions + full targeting. |

### Creator / Influencer

| Table | Rows | Source | Find in RESEARCH.md | Notes |
| --- | ---: | --- | --- | --- |
| `brand_profiles` | 100 | Public profile web scrape | Search **Public profile** | Subscribers, bio, badges, category, website. 102 of 216 target brands found. |
| `brand_profile_spotlights` | 331 | Spotlight metadata from profile pages | Search **Public profile** | Views, shares, AI-generated titles/keywords, hashtags, durations. |
| `spotlight_pages` | 107 | Individual spotlight web pages | Search **Spotlight web pages** | View counts, transcripts (59%), creator info, direct MP4 URLs. |
| `explore_keywords` | 13 | `/explore/<keyword>` scrape | Search **Explore** | One row per keyword — section counts, topic lists. |
| `explore_subscribe_profiles` | 102 | Subscribe section from explore pages | Search **Explore** | Creator discovery — usernames, subscriber counts, bios. |
| `explore_spotlight_creators` | 312 | Spotlight cards from explore pages | Search **Explore** | View/share counts, AI metadata per spotlight. |

### Transparency & Compliance (Snap's own reports)

| Table | Rows | Source | Find in RESEARCH.md | Notes |
| --- | ---: | --- | --- | --- |
| `eu_dsa_member_state_orders` | 2,604 | EU DSA XLSX (H2 2025) | Search **DSA transparency reports** | Legal requests from 27 EU governments. |
| `eu_dsa_automated_means` | 155 | EU DSA XLSX | Search **DSA transparency reports** | Automated detection accuracy, precision, recall. Normalized key-value format. |
| `eu_dsa_own_initiative_tc` | 112 | EU DSA XLSX | Search **DSA transparency reports** | Own-initiative terms-of-service enforcement. |
| `eu_dsa_categories` | 100 | EU DSA XLSX | Search **DSA transparency reports** | Category name mappings. |
| `eu_dsa_notices` | 94 | EU DSA XLSX | Search **DSA transparency reports** | Notice-and-action data. |
| `eu_dsa_own_initiative_illegal` | 90 | EU DSA XLSX | Search **DSA transparency reports** | Own-initiative illegal content enforcement. |
| `eu_dsa_appeals` | 47 | EU DSA XLSX | Search **DSA transparency reports** | Appeals and recidivism. Normalized key-value format. |
| `eu_dsa_amar` | 28 | EU DSA XLSX | Search **DSA transparency reports** | Monthly active recipients per EU country. |
| `eu_dsa_human_resources` | 27 | EU DSA XLSX | Search **DSA transparency reports** | Human moderation resources. |
| `global_enforcements_by_policy` | 13 | Global H1 2025 report → CSV | Search **DSA transparency reports** | 9.67M enforcements across policy categories. |
| `global_user_reports_by_policy` | 13 | Global H1 2025 report → CSV | Search **DSA transparency reports** | 19.8M in-app reports breakdown. |
| `global_proactive_detection` | 13 | Global H1 2025 report → CSV | Search **DSA transparency reports** | 3.4M automated enforcements. |
| `global_appeals_by_policy` | 13 | Global H1 2025 report → CSV | Search **DSA transparency reports** | 437k appeals, 22k reinstatements. |
| `global_regional_enforcements` | 3 | Global H1 2025 report → CSV | Search **DSA transparency reports** | NA / Europe / Rest of World. |
| `global_ads_moderation` | 1 | Global H1 2025 report → CSV | Search **DSA transparency reports** | 67.8k ads reported, 16.4k removed. |
| `global_csea` | 1 | Global H1 2025 report → CSV | Search **DSA transparency reports** | CSEA-specific enforcement totals. |
| `eu_csea_2025` | 1 | EU CSEA report → CSV | Search **DSA transparency reports** | EU CSEA scanning data. |

### EU — DSA Transparency Database (per-action, Snapchat-only)

| Table | Rows | Source | Find in RESEARCH.md | Notes |
| --- | ---: | --- | --- | --- |
| `ec_dsa_sor` | 11,118,841 | EC S3 bulk — merged daily CSVs | Search **EC DSA** | One row per **statement of reason** (moderation action metadata). 927 daily files spanning 2023-09 to 2026-04. |

#### EC DSA — Statements of Reasons (analytics notes)

| Topic | Detail |
| --- | --- |
| **What each row is** | One EU **Transparency Database** **statement of reason**: a moderation decision (visibility, account, monetary, etc.) Snapchat reported under the DSA. **Not** post text or media — metadata only. |
| **Table** | `ec_dsa_sor` |
| **Grain** | One row per statement of reason; 927 daily snapshots merged (2023-09 to 2026-04 in our pull). |
| **Light vs full export** | **Light** has the core structured fields below. **Full** adds long text explanations and `territorial_scope` (see RESEARCH **EC DSA**). |
| **Lineage-friendly columns** | `dump_date` (from file date), `csv_variant` (`light` / `full`), `source_file` (which daily file the row came from). |
| **Light field set (34)** | `uuid`, `decision_visibility`, `decision_visibility_other`, `end_date_visibility_restriction`, `decision_monetary`, `decision_monetary_other`, `end_date_monetary_restriction`, `decision_provision`, `end_date_service_restriction`, `decision_account`, `end_date_account_restriction`, `account_type`, `decision_ground`, `decision_ground_reference_url`, `illegal_content_legal_ground`, `incompatible_content_ground`, `incompatible_content_illegal`, `category`, `category_addition`, `category_specification`, `category_specification_other`, `content_type`, `content_type_other`, `content_language`, `content_date`, `application_date`, `source_type`, `source_identity`, `automated_detection`, `automated_decision`, `platform_name`, `platform_uid`, `created_at`. |
| **Coverage** | Earliest **Snapchat** bulk file we saw: **2023-09-25**; earlier dates return **403** on EC storage. |
| **Access** | Public bulk files — no auth for the dataset we used. EC’s separate Research API (token, 1k rows, 6-month window) is a different product; we did not use it for this table. |

Pipeline location (fetch scripts, raw paths, rebuild): **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

---

## On-disk data (not in DuckDB)

### PDF reports (risk assessments, audits)

| What | Value |
| --- | --- |
| Location | `data_sources/transparency_reports/data/pdf/` |
| Files | 8 PDFs (~110 MB) |
| Contents | DSA Risk Assessments (2023–2025), Independent Audits (2024–2025), Audit Implementation Reports (2024–2025), EU VSP Code of Conduct (2025) |
| Doc | Search **DSA transparency reports** |

Not structured data — useful as reference for governance context and regulatory compliance narrative.

---

## Raw files on disk (backing the DuckDB tables)

These directories hold the JSON/CSV that the analytics tables are built from (see **[DEVELOPMENT.md](./DEVELOPMENT.md)** for rebuild and fetch commands).

| Directory | Files | Size | What |
| --- | --- | --- | --- |
| `snap_ads/data/ads_fashion/` | 559 JSON | 31 MB | One file per brand × country. Includes `state.json` + `download_log.jsonl` for crawl tracking. |
| `snap_sponsored/data/sponsored_*/` | 535 pages | 166 MB | Paginated JSON (200–500 items/page). Final — crawl abandoned due to cursor expiry. |
| `snap_sponsored/data/partial_snapshots/` | 1 archived run | — | Cursor-expired partial crawl, archived (not loaded into DuckDB). |
| `snap_political/data/csv/` | 9 year dirs | 61 MB | Bulk CSVs from GCS, 2018–2026. Complete. |
| `snap_profiles/data/profiles/` | 102 JSON | 9.8 MB | One file per brand profile. |
| `snap_explore/data/explore/` | 16 JSON | 6.7 MB | One file per keyword (13 seed + 3 discovered). |
| `snap_spotlights/data/spotlights/` | 107 JSON | 31 MB | One file per spotlight video (includes transcript data). |
| `transparency_reports/data/eu_dsa_csv/` | 2 report dirs | — | XLSX → CSV conversion of EU DSA H2 2025. |
| `transparency_reports/data/global_csv/` | 8 CSVs | — | Manually extracted from H1 2025 global report. |
| `dsa_transparency/data/daily/` | `snapchat-*-light.csv` (+ optional `*-full.csv`) | grows with fetch (~1 GB+ for full history) | EC DSA SOR merged dailies → **`ec_dsa_sor`**. Same folder: `state.json`, `download_log.jsonl` (not loaded into DuckDB). |

---

## Limits and coverage gaps (summary)

Full write-ups live in **[RESEARCH.md](./RESEARCH.md)** — use your editor search on the **Source** name below. Quick reference:

| Source | Key limitation |
| --- | --- |
| EU Ad Library (Ads Gallery API) | Aggressive rate limiting (~3.7% success rate). EU-only, 12-month window, no spend data. |
| Sponsored Content API | Cursors expire after ~8h — crawl abandoned, 535 pages final. No engagement metrics. ~92% lack sponsor names. |
| Political Ads Library | None — trivially downloadable, complete. |
| Marketing API | **Blocked** — requires advertiser account with ad spend. |
| Public profile pages | Requires known usernames. Brand profiles report subscriber_count=0 (platform behavior). |
| Explore / keyword | Open-ended keyword space — no master list. Results vary by locale. |
| Spotlight web pages | No enumeration — need URL seeds from sponsored content, profiles, or explore. 59% have transcripts. |
| DSA transparency reports | Complete. PDF reports are unstructured. |
| EC DSA (statements of reasons) | Bulk path fills `ec_dsa_sor` once daily files are on disk and the DB is rebuilt (see **[DEVELOPMENT.md](./DEVELOPMENT.md)**). Research API remains capped at 1k rows / 6-month window. |
