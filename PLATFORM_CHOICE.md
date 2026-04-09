# Platform choice: Snapchat vs Pinterest

**Task:** Map transparency/ad sources, pull **real** samples, document limits, ship in **2–3 days**.

**Choice:** **Snapchat.** Pinterest has no **official-documented** public HTTP API comparable to Snap’s Ads Gallery for competitor-scale EU ad-library search; the Ads Repository is **web/SPA**. Meeting the same bar on Pinterest means **DevTools-captured** or **third-party** ingestion, which we avoided for this window.

---

## How we decided

1. **Gates** — Real EU-scoped rows, advertiser + time + creative ref, reproducible steps, defensible path, limits written down; time-boxed probes.
2. **Docs** — [Pinterest v5 OpenAPI](https://github.com/pinterest/api-description) vs [Snap Ads Gallery API](https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/Introduction): Pinterest v5 is **advertiser-scoped** (`/ad_accounts/...`); Snap exposes **`POST .../ads_library/ads/search`** without OAuth.
3. **Probe** — Snap returned usable JSON immediately (`sponsored_content`, `ads/search`). Pinterest: no in-repo competitor sample without browser or third-party capture.
4. **Pivot** — Pinterest failed the “official API only” bar; Snap became the evidence base.

| | Pinterest | Snapchat |
| --- | --- | --- |
| Public documented ad-library-style API | No v5 equivalent to Snap’s open `ads_library` | Yes — `POST /v1/ads_library/ads/search` |
| Repro without browser scrape | Weak | `curl` + scripts; paginate with **POST** + same body + `cursor` (raw `GET` on `next_link` may **400**) |
