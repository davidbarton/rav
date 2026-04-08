# Initial research — complete (Pinterest vs Snapchat for Ravineo task)

**Date:** 2026-04-07  
**Scope:** Map data sources, obtain real samples, document limits, align with hiring brief ([`PLATFORM_CHATGPT.md`](../PLATFORM_CHATGPT.md)), recommend platform for 2–3 day delivery.

**Status:** **Research round closed.** Open work is **execution** (UI, more rows on your network), not unknowns about API surfaces.

### Master checklist — every research question answered

| # | Question | Answer (where) |
| --- | --- | --- |
| 1 | Pinterest or Snapchat for 2–3 day delivery? | **Snapchat** — §1 |
| 2 | Map ad libraries / transparency APIs? | §3 (Snap), §4 (Pinterest) |
| 3 | Influencer / creator data path? | §2–3 — `sponsored_content`, `sponsored_content/search` (sample: `sponsored_content_search_creator.json`) |
| 4 | Organic content — downloadable? | §2–3 — `GET sponsored_content` (not full UGC feed) |
| 5 | Fraud / opinion / manipulation signals? | §2, §5 — ad fields + heuristics |
| 6 | Real sample (not mock)? | §2, §8 — JSON under `data/samples/` |
| 7 | Limits (rate, coverage, granularity)? | [`notes/limits.md`](../notes/limits.md) |
| 8 | Insights for Siemens-class B2C brands? | §5 |
| 9 | UI direction? | §6 |
| 10 | Pinterest Phase A pass/fail? | **FAIL** official-only path — §4, [`pinterest-phase-a.md`](pinterest-phase-a.md) |
| 11 | `GET /ads/{id}` works? | **Yes** — `ad_detail_by_id.json` |
| 12 | Submission “why Snapchat” text? | §9 |

---

## 1. Recommendation: choose **Snapchat**

| Criterion | Weight | Pinterest | Snapchat |
| --------- | ------ | --------- | -------- |
| **Documented public HTTP API for EU ad library** | High | **No** equivalent in official Pinterest v5 OpenAPI (only `/ad_accounts/{id}/...` — **your** ads) | **Yes** — `POST /v1/ads_library/ads/search`, no OAuth ([docs](https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/using-the-api)) |
| **Real sample in repo** | High | None without DevTools capture or third-party | **Yes** — paid EU (DE) + commercial content JSON under `data/samples/` |
| **Reproducibility for submission** | High | Depends on copied browser request or paid actor | **curl + scripts** documented |
| **B2C brand “shopping” story** | Medium | Strong discovery/commerce narrative | Weaker; youth/social lens |
| **Rate limits** | Medium | N/A for public API path | **429 / E1009** on bursts — **sparse calls**, **proxies** OK |

**Verdict:** For the **assignment as written** (real data + documented limits + fast demo), **Snapchat** is the defensible choice. Pinterest remains valid **only** if you invest in **Track 1** (Network capture) or **Track 2** (Apify) and accept more moving parts.

---

## 2. Hiring brief — all boxes answered

Original asks (translated): map sources; **real** sample; limits; proposed insights; UI prototype.

| Requirement | Answer |
| ------------- | ------ |
| **Ad libraries / transparency** | Snap: Ads Gallery API. Pinterest: web Ads Repository + DSA context; **no** public competitor API in official OpenAPI reviewed. |
| **Influencer / creator** | Snap: `GET/POST .../sponsored_content`, `POST .../sponsored_content/search` by `creator_name`. Pinterest: creator/idea ads via **web** or third-party. |
| **Organic content** | Snap: `GET .../sponsored_content` = live **organic commercial** content. Pinterest: Pins/boards are **owner APIs** for analytics; competitor organic = scrape/UI — harder. |
| **Fraud / opinion / “social charity”** | Both: ad transparency + anomaly patterns (suspicious advertisers, coordinated creatives). Snap: DSA/researcher narrative + **ad-level** fields (`review_status`, `paying_advertiser_name`). Needs **product story**, not only raw rows. |
| **Real sample** | **Snap:** `ads_search_spotify_de_retry.json` (10 DE paid ads), `sponsored_content_pages_1_2.json` (400 commercial rows). **Pinterest:** none in-repo. |
| **Limits documented** | [`notes/limits.md`](../notes/limits.md) — DNS, **429/E1009**, pagination (**POST** + `cursor` + same body). |

---

## 3. Data source map — Snapchat (primary)

| Source | Endpoint (base `https://adsapi.snapchat.com`) | Auth | In-repo sample |
| ------ | --------------------------------------------- | ---- | -------------- |
| **EU paid ads (by advertiser)** | `POST /v1/ads_library/ads/search` — body: `paying_advertiser_name`, `countries`, dates, `status` | None | `ads_search_spotify_de_retry.json` |
| **Pagination** | `POST` to `paging.next_link` with **same JSON body** as page 1 | None | Page 2 often **E1009/429** from shared IP; use delays/proxies |
| **Ad detail** | `GET /v1/ads_library/ads/{ad_id}` | None | `ad_detail_by_id.json` (UUID from paid-ad sample) |
| **Organic commercial** | `GET /v1/ads_library/sponsored_content` (+ `cursor`) | None | `sponsored_content_pages_1_2.json` |
| **Creator search** | `POST /v1/ads_library/sponsored_content/search` — `creator_name` | None | `sponsored_content_search_creator.json` |

**Fields you can demo (from paid ad sample):** `impressions_map` (per country), `start_date`, `targeting_v2`, `paying_advertiser_name`, `headline`, `top_snap_media_download_link`, `web_view_properties.url`, UTM-heavy landing URLs for **campaign taxonomy**.

---

## 4. Data source map — Pinterest (secondary / Phase A conclusion)

| Source | Access | Finding |
| ------ | ------ | ------- |
| **Official v5 API** ([OpenAPI](https://github.com/pinterest/api-description)) | OAuth + **your** `ad_account_id` | **No** public “search competitor EU ads” route in paths reviewed — all under `/ad_accounts/...`. |
| **Ads Repository web** | `https://www.pinterest.com/ads-repository/` | SPA; **GraphQL**-style traffic — reproducible only via **DevTools** export or automation. |
| **Third-party** | e.g. Apify “Pinterest Ads Repository” | JSON + filters; paid; disclose in writeup. |

**Phase A (experiment) conclusion:** **FAIL** for “automated, fully documented **official** API” in the same class as Snap **without** browser capture or third-party. Documented in [`pinterest-phase-a.md`](pinterest-phase-a.md).

---

## 5. What analytics / insights to pitch (for big B2C brands)

Use **only** what the sample actually contains (no fake “exact spend”):

| Client ask (from brief) | Snap-backed angle |
| ----------------------- | ----------------- |
| **How much competition spends** | Not exact; use **`impressions_map`** + EU country split as **pressure proxy**; compare brands/campaigns over time windows. |
| **Who works with influencers** | **Commercial:** `sponsored_content` creators + **search** by creator; **paid:** UTMs and `ad_account_name` / naming patterns. |
| **Organic presence** | **Commercial** Spotlight-style entries + frequency in sample; not full organic feed. |
| **Abuse / scams** | Flag **review_status**, odd **paying_advertiser_name** vs **brand_name**, duplicate landers, **regulated_content** in `targeting_v2`. |

---

## 6. UI prototype (next build step)

Minimal credible dashboard:

1. **Table:** advertiser, countries (from `impressions_map`), `start_date`, headline, thumbnail link.
2. **Filter:** country = DE/FR/…, date range (from API params).
3. **Chart:** impressions proxy by week (bucket `start_date`) for one brand query.
4. **Optional:** second tab “Commercial / creators” from `sponsored_content`.

---

## 7. Experiment gates — final scores

| Gate | Pinterest Phase A | Snapchat Phase B |
| ---- | ----------------- | ------------------ |
| §4 **50+ real rows** (EU paid where required) | **Not met** in-repo | **Met** for commercial (400+); **10** paid DE ads proven; **50+ paid** = repeat queries on **your** IP |
| **Reproducibility** | Only via Tracks 1–2 | **Yes** — scripts + JSON body |
| **Limits documented** | [`pinterest-phase-a.md`](pinterest-phase-a.md) | [`notes/limits.md`](../notes/limits.md) |

---

## 8. Files index

| Path | Purpose |
| ---- | ------- |
| [`docs/platform-data-experiment.md`](platform-data-experiment.md) | Gates, appendix, pivot rules |
| [`notes/limits.md`](../notes/limits.md) | DNS, rate limits, all endpoints touched |
| [`docs/pinterest-phase-a.md`](pinterest-phase-a.md) | Pinterest tracks + FAIL rationale |
| [`data/samples/2026-04-07-snap-sponsored-content/README.md`](../data/samples/2026-04-07-snap-sponsored-content/README.md) | Inventory of JSON samples |
| Key JSON | `ads_search_spotify_de_retry.json`, `sponsored_content_pages_1_2.json`, `ad_detail_by_id.json`, `sponsored_content_search_creator.json`, `ads_search_spotify_de_page2.json` (E1009) |
| [`scripts/`](../scripts/) | `fetch_snap_*`, `paginate_snap_*`, `snap_ads_search_page2.sh` |

---

## 9. What you should write in the submission (“why Snapchat”)

**English**

> I chose **Snapchat** because the **Ads Gallery API** provides **documented, unauthenticated** access to **EU ad-library** rows and **commercial creator** content, which let me download **real JSON**, document **rate limits**, and scope a **dashboard** within 2–3 days. **Pinterest’s** EU Ads Repository is important for brands strategically, but **public competitor-scale extraction** is not exposed like Snap’s in the official developer API; it would require **browser-derived** or **third-party** access, adding delivery risk for this task.

**Czech (draft for “Vysvětli proč…”)**

> Vybral jsem **Snapchat**, protože **Ads Gallery API** má ve veřejné dokumentaci **neautentizované** endpointy na **reklamy v EU** a **komerční/tvůrčí obsah**, takže šlo stáhnout **reálná JSON data**, popsat **limity** a navrhnout **dashboard** v horizontu 2–3 dnů. U **Pinterestu** je Ads Repository pro značky strategicky zajímavé, ale **oficiální veřejné API** v tom samém smyslu (jako u Snapu) v dokumentaci **není**; konkurenční data by šla spíš přes **prohlížeč** nebo **třetí stranu**, což zvyšuje riziko nestihnutí úkolu.

---

_This document closes the **initial research** phase; next is implementation (UI + optional more rows)._
