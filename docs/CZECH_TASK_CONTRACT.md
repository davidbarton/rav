# Czech Task Contract

This file is the canonical acceptance contract for the original assignment text in Czech.

## Contract rules (non-negotiable)

- Original Czech clauses are copied verbatim and must not be rewritten.
- English text in this file is a working translation only; Czech wording is the source of truth.
- Completion can only be claimed with artifact evidence in repository files.
- Proxy metrics must always be labeled as proxies.
- No scope expansion is allowed before all `CZ-*` clauses are marked satisfied in the coverage matrix.

## Verbatim original assignment block (locked)

```text
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

## Clause registry with working translation and checkpoints

### CZ-1
- **Czech (verbatim):** `Pinterest nebo Snapchat — vyber jedno podle vlastního uvážení.`
- **English (working translation):** Choose either Pinterest or Snapchat based on your own judgment.
- **Pass/fail checkpoints:**
  - `insight_proof`: clear platform choice statement exists in project docs.

### CZ-2
- **Czech (verbatim):** `Vysvětli proč sis vybral co sis vybral.`
- **English (working translation):** Explain why you chose the platform you chose.
- **Pass/fail checkpoints:**
  - `insight_proof`: explicit rationale with tradeoffs and alternatives is documented.

### CZ-3
- **Czech (verbatim):** `Průzkum datových zdrojů — Zmapuj, jaká data jsou na platformě dostupná.`
- **English (working translation):** Explore data sources and map what data is available on the platform.
- **Pass/fail checkpoints:**
  - `data_source_proof`: documented source map exists and is scoped to selected platform.

### CZ-4
- **Czech (verbatim):** `Reklamní data (ad libraries, transparency tools, API)`
- **English (working translation):** Advertising data (ad libraries, transparency tools, API).
- **Pass/fail checkpoints:**
  - `data_source_proof`: at least one ad/transparency source is documented.
  - `sample_data_proof`: real ad-related sample artifact exists.

### CZ-5
- **Czech (verbatim):** `Influencer / creator aktivita`
- **English (working translation):** Influencer / creator activity.
- **Pass/fail checkpoints:**
  - `data_source_proof`: source path for creator/influencer signals is documented.
  - `sample_data_proof`: creator-related sample artifact exists, or explicit unsupported-state proof is documented with evidence.

### CZ-6
- **Czech (verbatim):** `Organický obsah (je stažitelný? jak?)`
- **English (working translation):** Organic content (is it downloadable? how?).
- **Pass/fail checkpoints:**
  - `data_source_proof`: retrieval path investigation is documented.
  - `limits_proof`: feasibility and constraints are explicitly stated.

### CZ-7
- **Czech (verbatim):** `Jakákoli data relevantní pro detekci ovlivňování veřejného mínění nebo finančního fraudu ("social charity")`
- **English (working translation):** Any data relevant for detecting public-opinion manipulation or financial fraud ("social charity").
- **Pass/fail checkpoints:**
  - `data_source_proof`: candidate fraud/manipulation signal fields are identified.
  - `insight_proof`: at least one fraud-risk heuristic is documented.

### CZ-8
- **Czech (verbatim):** `Stáhni vzorek dat — Reálná data, ne mockupy. Může to být přes oficiální API, DSA transparency repozitář, web scraping, third-party providery — cokoliv, co funguje. Zdokumentuj jak jsi k datům došel a jaké jsou limity (rate limits, coverage, granularita).`
- **English (working translation):** Download a sample of real data (not mockups) by any working method; document how data was obtained and what limitations exist (rate limits, coverage, granularity).
- **Pass/fail checkpoints:**
  - `sample_data_proof`: real sample files exist in repository.
  - `limits_proof`: acquisition method and limits are documented and traceable to artifacts.

### CZ-9
- **Czech (verbatim):** `Navrhni, co z toho půjde vytřískat — Na základě vzorku dat navrhni, jaké analytické pohledy a insighty by Ravineo mohlo klientům nabídnout.`
- **English (working translation):** Propose what insights can be extracted from the sample data and what analytics views Ravineo could offer clients.
- **Pass/fail checkpoints:**
  - `insight_proof`: proposed analytics views and insight list are documented and tied to sample fields.

### CZ-10
- **Czech (verbatim):** `Kolik konkurence utrácí za reklamu`
- **English (working translation):** How much competitors spend on advertising.
- **Pass/fail checkpoints:**
  - `insight_proof`: spend-oriented insight exists.
  - `limits_proof`: confidence/proxy caveat is explicit when exact spend is unavailable.

### CZ-11
- **Czech (verbatim):** `S kým spolupracují (influenceři)`
- **English (working translation):** Who they collaborate with (influencers).
- **Pass/fail checkpoints:**
  - `insight_proof`: collaboration/influencer insight path is documented.

### CZ-12
- **Czech (verbatim):** `Jak vypadá jejich organická přítomnost na platformě`
- **English (working translation):** What their organic presence on the platform looks like.
- **Pass/fail checkpoints:**
  - `insight_proof`: organic-presence insight path is documented from available evidence.

### CZ-13
- **Czech (verbatim):** `Potenciální zneužití (dezinformace, scam reklamy, fake influenceři)`
- **English (working translation):** Potential misuse (disinformation, scam ads, fake influencers).
- **Pass/fail checkpoints:**
  - `insight_proof`: at least one misuse-risk lens exists.
  - `ui_proof`: risk indicators are visible in prototype outputs.

### CZ-14
- **Czech (verbatim):** `Vykopni nad tím UI pro vizualizaci — Prototyp, dashboard, cokoliv co ukáže data v použitelné formě. Neřešíme produkční kvalitu — jde o to ukázat, co data umí říct a jak by to šlo prezentovat.`
- **English (working translation):** Build a visualization UI (prototype/dashboard/anything usable). Production quality is not required; the goal is to show what data can say and how it can be presented.
- **Pass/fail checkpoints:**
  - `ui_proof`: runnable prototype UI exists and renders real sample rows.
  - `insight_proof`: UI demonstrates at least core analytics interpretation, not raw dump only.

## Sign-off baseline

From this point forward, this file is the authoritative contract baseline for scope completion tracking.
Any future completion claim must reference `CZ-*` IDs and repository evidence artifacts.
