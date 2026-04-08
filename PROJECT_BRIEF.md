# Ravineo x Snapchat — Project Brief

## Project status

**Phase 0 is finished and closed.**  
This file stays focused on core scope and execution. Detailed research and logs are split into dedicated docs.

## Basic description

This project builds a practical, evidence-based prototype for Ravineo on top of Snapchat transparency data.  
The goal is to prove what can be extracted fast, what limits exist, what business insights can be generated for large B2C clients, and how those insights can be presented in a usable UI.

The platform choice is Snapchat because it offers a documented public Ads Library API path that enables real sample ingestion with lower delivery risk in a short hiring-task window.

## Expected end outcomes

- Clear source map for Snapchat data relevant to:
  - paid ads / transparency
  - creator and sponsored commercial activity
  - organic commercial visibility
  - fraud / abuse-relevant signal candidates
- Reproducible real-data sample set in repository (`data/samples/...`), not mockups.
- Explicit limitations report (rate limits, coverage, granularity, reproducibility constraints).
- Insight proposal layer for Ravineo customer value:
  - competitor advertising pressure proxies
  - creator/commercial collaboration visibility
  - organic commercial footprint signals
  - suspicious/adverse pattern heuristics
- One usable prototype UI/dashboard that demonstrates the above on real rows.
- Short narrative of why Snapchat was selected over Pinterest for this assignment scope and timeline.

## Immutable original requirements (DO NOT MODIFY)

**WARNING: The following section must stay exactly as originally provided, word for word, unmodified under any circumstances.**

---

Zadání

Pinterest nebo Snapchat — vyber jedno podle vlastního uvážení.
Vysvětli proč sis vybral co sis vybral.
Co od tebe čekáme

Průzkum datových zdrojů — Zmapuj, jaká data jsou na platformě dostupná. Zajímají nás:
Reklamní data (ad libraries, transparency tools, API)
Influencer / creator aktivita
Organický obsah (je stažitelný? jak?)
Jakákoli data relevantní pro detekci ovlivňování veřejného mínění nebo finančního fraudu ("social charity")
Stáhni vzorek dat — Reálná data, ne mockupy. Může to být přes oficiální API, DSA transparency repozitář, web scraping, third-party providery — cokoliv, co funguje. Zdokumentuj jak jsi k datům došel a jaké jsou limity (rate limits, coverage, granularita).
Navrhni, co z toho půjde vytřískat — Na základě vzorku dat navrhni, jaké analytické pohledy a insighty by Ravineo mohlo klientům nabídnout. Mysli na to, že naši klienti jsou velké B2C brandy (Siemens, Philips, Beiersdorf apod.) a zajímá je:
Kolik konkurence utrácí za reklamu
S kým spolupracují (influenceři)
Jak vypadá jejich organická přítomnost na platformě
Potenciální zneužití (dezinformace, scam reklamy, fake influenceři)
Vykopni nad tím UI pro vizualizaci — Prototyp, dashboard, cokoliv co ukáže data v použitelné formě. Neřešíme produkční kvalitu — jde o to ukázat, co data umí říct a jak by to šlo prezentovat.

---

## Working principles

- Use only real and reproducible data retrieval paths.
- Keep all assumptions explicit; avoid pretending exact spend where only proxy signals exist.
- Separate what is proven by sample data from what is roadmap/future enrichment.
- Optimize for shipping: source map + sample + limits + insights + UI in one coherent story.

## Document map

- Czech assignment contract baseline: `docs/CZECH_TASK_CONTRACT.md`
- Czech scope coverage tracker: `docs/COVERAGE_MATRIX.md`
- Ravineo product + dashboard intelligence: `docs/RAVINEO_INTEL.md`
- Source-tagged insight log: `docs/INSIGHT_LOG.md`
- Team conversation notes: `docs/TEAM_NOTES.md`
- Future-stage backlog: `docs/FUTURE_BACKLOG.md`
- Minimal prototype plan and implementation: `prototype_min/PLAN.md`, `prototype_min/README.md`

## Current phase focus

- Original Czech scope is fully covered in `docs/COVERAGE_MATRIX.md` (`done: 14`, `partial: 0`, `missing: 0`).
- Keep reproducibility strict and limits explicit across docs and UI.
- Do not start non-Czech-scope expansion unless explicitly unlocked by user.