# Ravineo x Snapchat Project

> AI Agents reading this will find lots of context inside the `./agents/` directory.

## Original assignment text

```
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
```

## Research we conducted

Map of Snapchat data sources (APIs, scraping, transparency, governance): **[RESEARCH.md](./RESEARCH.md)**.

It walks through **14** surfaces we actually exercised — what works without auth, what needs a partner or proxy, and concrete request shapes and fields where it matters. Start with the TL;DR table, then drop into any numbered section for the full notes.

## Sample data available

Analytics inventory (tables, volumes, raw paths, limits): **[DATA_SAMPLES.md](./DATA_SAMPLES.md)**.

Quick summary: **27 DuckDB tables** (`db/rav.db`) covering paid ads (4.6k across 23 EU countries), sponsored content (230k deduplicated, final), political ads (74.6k, complete), creator profiles, spotlight videos, explore discovery, DSA transparency reports, and 11M+ EC moderation action records (`ec_dsa_sor`). Plus 8 PDF governance reports on disk. Open DuckDB with [Beekeeper Studio](https://www.beekeeperstudio.io/) for visual exploration.

## Business analysis

What Ravineo can offer B2C brands from Snapchat data: **[BUSINESS_ANALYSIS.md](./BUSINESS_ANALYSIS.md)**.

Concrete use cases for competitive intelligence — competitor ad spend estimation, share of voice, geographic strategy, campaign intensity, creative signals — each verified against real data in this repository and positioned against existing market tools (Pathmatics, AdClarity, Nielsen). Backed by reproducible SQL experiments in **[experiments/](./experiments/README.md)**.

## Development

Runbooks and technical setup: **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

**If you’re building or extending this repo:** everything you need to run fetchers, rebuild **`db/rav.db`**, wire proxies, and ship the prototype lives in **[DEVELOPMENT.md](./DEVELOPMENT.md)** — TypeScript/Node pipelines under `data_sources/`, a single DuckDB loader in `db/init.sql`, and a small static app in `app/`. Clone, `npm install` once at the root, and you can reproduce the full stack from raw pulls to queryable tables.
