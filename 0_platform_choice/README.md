# Step 0 — Platform choice (journey log)

Rough record of how we decided **Snapchat** vs **Pinterest** for the Ravineo hiring task (see `[PLATFORM_CHATGPT.md](PLATFORM_CHATGPT.md)` for the original long-form chat export).

## What we did

1. **Read the brief** (`Zadání` in the chat): map data sources (ads, creators, organic, fraud), download **real** samples, document limits, propose insights, sketch UI — in **2–3 days**.
2. **Ran a structured ChatGPT conversation** — captured in `[PLATFORM_CHATGPT.md](PLATFORM_CHATGPT.md)`: compared Snapchat vs Pinterest, listed pros/cons both ways, and drafted decision criteria before hands-on testing.
3. **Set experiment gates** — `[docs/platform-data-experiment.md](docs/platform-data-experiment.md)`: Pinterest first on paper, Snapchat as fallback; success criteria (real rows, reproducibility, legitimacy).
4. **Probed APIs** — Snap: public Ads Gallery endpoints (`ads/search`, `sponsored_content`, ad by id, creator search) with JSON on disk. Pinterest: official v5 API is **advertiser-scoped**; public Ads Repository is **web/SPA** without a Snap-class documented public library API.
5. **Documented limits** — `[notes/limits.md](notes/limits.md)`: DNS filters, **429 / E1009**, pagination (**POST** + same body + `cursor`).
6. **Wrote synthesis** — `[docs/INITIAL_RESEARCH.md](docs/INITIAL_RESEARCH.md)`: recommendation, brief checklist, submission drafts (EN + CZ).

## Outcome

- **Pinterest Phase A:** **FAIL** for “official documented API only” path — `[docs/pinterest-phase-a.md](docs/pinterest-phase-a.md)`.
- **Snapchat:** primary **evidence base** under `[data/samples/2026-04-07-snap-sponsored-content/](data/samples/2026-04-07-snap-sponsored-content/)`.
- **Next steps (later journey):** UI prototype + final write-up — not part of Step 0.

---

## Five reasons we chose **Snapchat**

1. **Documented public Ads Library HTTP API** — No OAuth for library endpoints; `POST .../ads_library/ads/search` with EU `countries`, plus commercial/creator endpoints in the same family ([Snap Ads Gallery API](https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/Introduction)).
2. **Real, reproducible samples** — We could `curl`/script ingestion and save **real JSON** (paid EU ads, `sponsored_content`, `GET` ad by id, creator search), not mocks — matching the brief.
3. **Lower delivery risk in 2–3 days** — Pinterest’s competitor-scale pull is **web/GraphQL or third-party** unless you invest in DevTools/Apify; that adds schedule risk for a timed task.
4. **Fits Ravineo’s transparency story** — EU ad rows with `impressions_map`, targeting, creatives, and a clear path to “competitive visibility + fraud-ish signals” from metadata (see `INITIAL_RESEARCH.md` §5).
5. **Defensible engineering narrative** — “Official API + documented limits + UI” is easier to defend in review than “we scraped the repo” unless scraping is fully documented and stable.

---

*Step 0 artifacts live entirely under `[0_platform_choice/](.)`.*