# Phase A — Pinterest (ads repository access)

**Goal (from [platform-data-experiment.md](platform-data-experiment.md)):** Reproduce **real** EU ad-library–style rows with documented steps, or record **FAIL** and pivot.

## Official entry points

| What | URL / note |
| ---- | ---------- |
| Ads Repository (web) | `https://www.pinterest.com/ads-repository/` (also `https://ads.pinterest.com/ads-repository/` → `www`) |
| Developer platform | `https://developers.pinterest.com/` — **ads APIs** target **your** campaigns, catalogs, analytics — not a documented **public competitor** Ads Repository API comparable to Snap’s open `ads_library` endpoints. |

## What we observed (2026-04-07)

- The repository page is a **large client-side app** (~780KB HTML shell). Strings reference **`graphql`**, **`ad_library`**, **`api.pinterest.com`** — typical for Pinterest’s SPA. There is **no** stable, documented **curl-one-liner** in public docs for “search all EU ads by competitor” like Snap’s `POST .../ads_library/ads/search`.
- **DNS:** allowlist **`ads.pinterest.com`**, **`www.pinterest.com`**, **`api.pinterest.com`** if you use filters.

## How to pass Phase A (pick one track)

### Track 1 — Browser (fastest to *see* data)

1. Open the repository URL, run a search (country, advertiser).
2. **DevTools → Network:** filter `fetch` / `xhr` / `graphql`.
3. Copy as **cURL** the request that returns ad rows (watch for **CSRF** / cookies).
4. Document **headers**, **body**, and **ToS** implications in `notes/limits.md` or §8 of the experiment doc.

### Track 2 — Third-party (paid, explicit)

- e.g. Apify actors (“Pinterest Ads Repository”) expose JSON — label as **third-party**, note **cost** and **ToS** in the submission.

### Track 3 — Declared FAIL → pivot

- If you cannot get **50+** rows with **reproducible** steps within the time box, record **FAIL** per the experiment doc and continue on **Snapchat** (already strong evidence there).

## Comparison to Snapchat (same assignment)

| | Pinterest | Snapchat |
| --- | --- | --- |
| Public **documented** ad library HTTP API | Not equivalent to Snap’s open `ads_library` in official docs reviewed here | **Yes** — `POST /v1/ads_library/ads/search` (no OAuth) |

## Conclusion (2026-04-07) — Phase A **FAIL** (for “official API only”)

- **Pinterest v5 OpenAPI** ([`pinterest/api-description`](https://github.com/pinterest/api-description)) exposes **advertiser-authenticated** routes under `/ad_accounts/{ad_account_id}/...` only — **no** public “EU Ads Repository search” path comparable to Snap.
- **Web repository** is a **SPA**; reproducible ingestion requires **DevTools → Copy as cURL** (Track 1) or **Apify** (Track 2), not a one-line official doc.
- **Decision for the hiring task:** treat Pinterest as **researched**; **do not block** on Pinterest if the goal is fastest **evidence-backed** delivery — see [`INITIAL_RESEARCH.md`](INITIAL_RESEARCH.md).

If you later capture a **working cURL** from Track 1, append it here and re-evaluate PASS.
