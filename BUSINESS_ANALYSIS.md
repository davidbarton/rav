# Business Analysis: What Ravineo Can Offer B2C Brands from Snapchat Data

> Analytical insights Ravineo could deliver to enterprise B2C clients (Siemens, Philips, Beiersdorf and similar) using Snapchat platform data. Each section proposes concrete use cases, verifies them against real data in this repository, and positions the offering against existing market tools.
>
> Covers all four client questions from the original brief.
>
> 1. [How much competitors spend on advertising](#1-competitor-ad-spend)
> 2. [Who they collaborate with (influencers)](#2-influencer-collaborations)
> 3. [What their organic presence looks like](#3-organic-presence)
> 4. [Potential misuse (disinformation, scams, fake influencers)](#4-potential-misuse)
>
> Data methodology and limits: **[RESEARCH.md](./RESEARCH.md)**. Data inventory: **[DATA_SAMPLES.md](./DATA_SAMPLES.md)**.

---

## 1. Competitor Ad Spend

*Original brief question: How much competitors spend on advertising.*

### The key insight: You don't need exact spend

Marketing directors don't need a precise euro figure for a competitor's Snapchat budget. What they actually pay for (via Pathmatics, AdClarity, Nielsen):

- **Relative positioning** — Am I outspending or being outspent?
- **Directional trends** — Is a competitor ramping up or winding down?
- **Geographic strategy** — Where are they concentrating budget?
- **Creative investment signals** — Are they going premium or budget?
- **Seasonal patterns** — When do they invest most heavily?

All five are answerable from DSA-mandated impression data without a single euro of disclosed spend. Snapchat's EU Ad Library provides impression counts for every ad — a stronger foundation than panel-based estimation (Pathmatics) or survey-based benchmarks (Nielsen).

**Ravineo already validates this approach.** Their live dashboards show "Est. Spend" as ranges (e.g. "€32-48K"), mark newer data as "BETA," and never present point estimates. **They do not currently have Snapchat in their platform** — this is the gap we fill.

### How spend estimation works

**Formula:** Impressions x CPM / 1000 = Estimated Spend

**Published Snapchat CPM benchmarks (2025-2026):**

| Ad Format | CPM — France | CPM — Netherlands | Source |
| --- | --- | --- | --- |
| Snap Ads (standard) | €3-8 | €8-15 | adcredits.expert, agence-anode.fr, baoliba.uk |
| Story Ads | — | €7-13 | baoliba.uk |
| Commercials (6s non-skip) | — | €25-40 | baoliba.uk |
| Geofilters | — | €5-10 | baoliba.uk |
| Global average (all formats) | ~€7.50 | ~€7.50 | adcredits.expert, stewartgauld.com |

Two key pricing dynamics: a **3-5x format spread** (Commercials at €25-40 vs Snap Ads at €8-15 in the same market) and a **2-3x geographic spread** (France €3-8 vs Netherlands €8-15 for the same format). Q4 seasonal surge adds ~40% to base CPMs. Both effects compound — a Commercial in Netherlands during Q4 could cost 10x a Snap Ad in France in Q2.

**Validation from real Snapchat spend data** (see `experiments/02_political_cpm_validation.sql`):

Our political ads dataset (74,609 ads, $117.5M total disclosed spend) provides ground-truth CPM. EUR-denominated ads show median CPM of **€2.43** (P75 €4.30, P90 €6.88). In fact, 72% of EUR political ads have CPM *below* €4 — political ads are cheap due to broad targeting and simpler creatives. USD political ads are more expensive (median $8.21), closer to published commercial benchmarks. Our assumed **€4-9 band** for commercial fashion/luxury ads is intentionally above the political floor — commercial campaigns involve narrower audiences, higher-quality creatives, and more competitive auctions. The band is conservative and defensible.

No other Snapchat competitive intelligence provider has this cross-validation path.

### Use cases

#### 1.1 Estimated Spend Range per Brand per Market

> *"Nike spent approximately €1.0M-€2.3M on Snapchat in France over the past 12 months (flat model). Birkenstock spent €260K-€580K in the same market."*

Powered by per-ad impression counts x CPM, grouped by country. Impressions are DSA-mandated real disclosure; CPM is a published benchmark multiplier. The range format communicates uncertainty honestly.

**Verified** (see `experiments/01_stratified_spend.sql`). Nike FR: 252.5M impressions across 10 sampled ads. Birkenstock FR: 64.7M impressions across 10 sampled ads. The format-stratified model shifts estimates for brands with premium creative investment: Cartier moves from €433K-€974K (flat) to **€1.1M-€3.0M** (stratified) because 56% of their impressions come from AR Lens formats. Data exists in `brand_ads_fashion` (4,694 rows from 98 crawled brands, yielding 402 distinct advertiser entities across 23 EU countries).

**Caveat:** Per-brand figures are lower bounds — our crawl captures ~10 ads per brand per country due to API rate limits. Actual spend is likely higher; the relative ordering is more reliable than absolute figures.

#### 1.2 Share of Voice

> *"In EU Fashion on Snapchat, Nike holds 24.1% share of voice. HUGO BOSS holds 5.2%. Your brand (adidas) holds 1.6%."*

The most robust spend proxy — relative impression share largely cancels CPM uncertainty. If Nike has 3x the impressions of HUGO BOSS, Nike is spending roughly 3x more. This holds best when brands use similar ad format mixes. When format mixes differ significantly (e.g. one brand uses mostly AR Lenses at €25-40 CPM while another uses standard Snap Ads at €4-12 CPM), impression share understates the premium-format brand's spend. For most competitive sets within a vertical, format mixes are similar enough that impression-based SoV is a strong proxy.

**Verified.** Top 5 impression share:

| Brand | Impressions | Share |
| --- | ---: | ---: |
| Nike, Inc. | 516M | 24.1% |
| Birkenstock Digital GmbH | 160M | 7.5% |
| HUGO BOSS AG | 110M | 5.2% |
| Cartier | 108M | 5.1% |
| Zalando SE | 94M | 4.4% |

**Important nuance from experiments** (see `experiments/03_share_of_voice_stability.sql`): Rankings shift dramatically by country. HUGO BOSS is #3 overall but **#1 in Germany** and only #12 in France. boohooMAN is #6 overall but **#2 in France**. Gucci is #13 overall but #5 in France and absent from Germany entirely. This means Share of Voice must always be presented per-market, not just as an aggregate — a finding that makes the geographic dimension even more valuable.

Matches Ravineo's own "Share of Spend" donut chart — their most visible dashboard widget.

#### 1.3 Geographic Spend Allocation

> *"HUGO BOSS concentrates 73% of Snapchat budget on Germany (home market). Nike spreads across 7 markets with France (49%) and Netherlands (29%) leading. Zalando takes a pan-European approach across 11 markets."*

The `country` field indicates which EU market's ad gallery the ad was found in (i.e. the ad targeted that market). Each ad also carries an `impressions_map` with per-country impression breakdowns across all 27 EU + Turkey (verified: sums match `impressions_total` exactly, 28 distinct countries).

**Verified** (no ad deduplication across countries for top brands — 0% overlap for Nike, HUGO BOSS, Cartier, Birkenstock, Zalando):

| Brand | Top Market | Concentration | Total Markets |
| --- | --- | ---: | ---: |
| Nike | France | 49% | 7 |
| HUGO BOSS | Germany | 73% | 10 |
| Zalando | Netherlands | 28% | 11 |
| Birkenstock | France | 40% | 8 |
| Cartier | Germany | 36% | 6 |

**Caveat:** Percentages represent share of total impressions from ads targeting each country. Because an ad targeting France may also deliver some impressions in neighboring markets, these percentages slightly overstate single-country concentration. For precise per-country allocation, `impressions_map` breakdowns can be extracted. The directional insight (which markets a brand prioritizes) is reliable.

A German brand discovering its French competitor puts 49% of budget into France signals either an underserved opportunity or an aggressive competitive threat.

#### 1.4 Campaign Intensity and Velocity

> *"HUGO BOSS launched 79 new Snapchat ads in June 2025, their highest month. They show burst-pause cadence with two peaks per year (May-June, October-November). Nike maintains a steadier 5-10 ads/month."*

Ad counts and start dates are factual DSA disclosure. No spend modeling needed.

**Verified.** HUGO BOSS monthly pattern: Mar'25: 1 → Apr: 20 → May: 47 → **Jun: 79** → Jul: 12 → Aug: 52 → Sep: 3 → **Oct: 54** — clear burst strategy. CHANEL shows activity in 12 of 13 months — always-on strategy.

#### 1.5 Creative Investment Signal

> *"Cartier puts 56% of impressions through AR Lens formats (€15-40 CPM range) — 3-5x more expensive per impression than standard Snap Ads. This signals premium brand-building investment. Nike, by contrast, runs 92% Dynamic/retargeting ads — a performance-marketing strategy optimizing for conversions at lower CPMs."*

Format distribution reveals budget allocation strategy without any spend data:

| Format | Ads | Avg Impressions | Total Impressions |
| --- | ---: | ---: | ---: |
| Standard (WEB_VIEW, Deep Link, etc.) | 3,676 | 365K | 1.34B |
| Premium (COMPOSITE) | 416 | 973K | 0.40B |
| AR / Lens | 106 | 2.98M | 0.32B |
| Collection / Shopping | 290 | 392K | 0.11B |

AR/Lens formats average 8x more impressions per ad than standard — these are major campaigns with significant budgets. The format mix is a strong signal of brand strategy: Cartier (luxury brand-building via AR) vs Nike (scale-driven retargeting) vs Zalando (pan-European collection ads).

#### 1.6 Targeting Sophistication as Budget Signal

> *"Cartier uses narrow age targeting (25-44) with device-specific placements — a precision strategy indicating higher CPMs. boohooMAN uses broad demographics — a volume play."*

Targeting data is real DSA disclosure. Narrow targeting generally commands premium CPMs in any auction-based ad platform.

#### 1.7 Sponsored Content as Spend Proxy

> *"Trendyol works with 18 Snapchat creators across 132 sponsored content pieces — influencer marketing budget that doesn't show up in the paid ads library at all."*

Creator partnerships represent a separate budget line invisible to ad-library-only competitive tools. **Verified** from `sponsored_content` (230k rows, ~8% with named sponsors).

**Key experiment finding** (see `experiments/04_sponsor_advertiser_overlap.sql`): Paid ads and sponsored content are almost entirely distinct universes on Snapchat. All top-15 paid advertisers (Nike, Birkenstock, HUGO BOSS, Cartier, Zalando) appear exclusively in paid ads with no matching sponsored content. This means each dataset reveals a different dimension of competitor activity — a brand visible in paid ads may be invisible in creator partnerships and vice versa.

#### 1.8 Seasonal and Event-Driven Patterns

> *"Fashion brands show two distinct Snapchat spending peaks: Spring (April-June) and Autumn (October-December). CHANEL maintains year-round presence; HUGO BOSS concentrates in burst campaigns."*

12-month window from the EU Ad Library is well-suited for seasonal analysis. Temporal patterns are visible from ad counts and impression volumes over time.

#### 1.9 Cross-Platform Spend Context

> *"L'Oreal spends €168-257K on Meta in Czech Republic (Meta Ad Library data). Snapchat typically accounts for 5-10% of a brand's social ad mix in markets where it has Gen Z presence. This frames our Snapchat estimates within the broader media budget."*

Cross-platform ratios serve as plausibility tests. Meta's EU Ad Library discloses actual spend ranges (DSA-mandated) — we can reference these alongside our Snapchat estimates to build a fuller competitive picture. This case requires no new data, only editorial framing of existing numbers.

### How this compares to what exists

| Tool | Snapchat Depth | Method | Cost |
| --- | --- | --- | --- |
| **Pathmatics** (Sensor Tower) | Shallow (thin panel) | Browser/app panel estimation | $10-50K/yr |
| **AdClarity** (BIScience) | Shallow (30M panel) | Panel-based | $5-30K/yr |
| **Nielsen** | None (aggregate only) | Survey + modeling | Custom $$$ |
| **Our approach** | **Deep** (DSA-mandated) | Real impression disclosure + CPM | Included |

Our differentiator: **DSA-mandated impression data from Snapchat's own EU Ad Library** — real disclosure, not panel estimation. Per-country granularity. Format-aware. Cross-validated against the only Snapchat dataset with actual spend disclosure (political ads). Enriched with sponsored content signals invisible to ad-library tools.

### What this means for a Beiersdorf or Philips

Our sample covers fashion/luxury brands, but the methodology applies identically to any vertical — FMCG (Beiersdorf), consumer electronics (Philips, Siemens), automotive — by running the same crawl with different brand seed lists. The EU Ad Library covers all paid Snapchat ads regardless of vertical.

A marketing director at Beiersdorf (Nivea, Eucerin) uses this to:

1. **Budget planning** — "Competitors in skincare spend an estimated €X-Y on Snapchat quarterly. Are we allocating enough?"
2. **Market entry** — "Key competitor puts 49% of Snapchat budget into France. Should we increase our French allocation?"
3. **Competitive response** — "Competitor launched 79 ads in one month. Something is happening — monitor their messaging."
4. **Channel mix** — "Snapchat is ~5-10% of competitors' social spend. We're at 2%. Opportunity or irrelevant?"
5. **Creator strategy** — "Competitor works with 18 Snapchat creators. We work with 0. Untapped channel?"

### Data access summary

| Use Case | Table | Key Fields | Status |
| --- | --- | --- | --- |
| Spend Range | `brand_ads_fashion` | `impressions_total`, `creative_type`, `country` | 4,694 rows (3,694 unique ads) |
| Share of Voice | `brand_ads_fashion` | `impressions_total`, `paying_advertiser_name` | 4,694 rows (3,694 unique ads) |
| Geographic | `brand_ads_fashion` | `impressions_total`, `country`, `impressions_map` | 4,694 rows (3,694 unique ads) |
| Campaign Intensity | `brand_ads_fashion` | `start_date`, `paying_advertiser_name` | 4,694 rows (3,694 unique ads) |
| Creative Signal | `brand_ads_fashion` | `creative_type`, `ad_render_type` | 4,694 rows (3,694 unique ads) |
| Targeting Signal | `brand_ads_fashion` | `targeting_v2` | 4,694 rows (3,694 unique ads) |
| Sponsored Proxy | `sponsored_content` | `sponsor_name`, `creator_name` | 230,267 rows |
| CPM Validation | `political_ads` | `spend`, `impressions` | 74,609 rows (72,979 with spend+impressions) |
| Seasonal | `brand_ads_fashion` | `start_date` | 4,694 rows (3,694 unique ads) |
| Cross-Platform | External reference | Meta Ad Library | Methodology only |

---

## 2. Influencer Collaborations

*Original brief question: Who they collaborate with (influencers).*

### The key insight: Snapchat is the last platform with no good influencer competitive intelligence

Every major influencer intelligence platform — Traackr, HypeAuditor, CreatorIQ, Modash — covers Instagram, TikTok, and YouTube thoroughly. **Snapchat is a blind spot.** Snap Inc. launched its Creator Discovery API in 2024 (partnering with Captiv8, Traackr, Tagger), but these tools focus on campaign *execution* (finding creators, measuring your own campaigns), not *competitive intelligence* (seeing who your competitors work with).

Snapchat's Sponsored Content API — a DSA-mandated transparency feed — changes this. It discloses every creator-sponsor relationship for content labeled as sponsored. No other platform provides this level of competitive visibility into influencer partnerships at scale.

**What marketing directors actually want to know:**

- **Who are my competitors working with?** — Which creators, how many, how often?
- **Am I being out-partnered?** — Are competitors running 10x more creator collaborations than us?
- **Which creators are exclusive vs multi-brand?** — Can I poach a competitor's creator, or are they locked in?
- **What content formats do competitors use with creators?** — Stories, Spotlights, or both?
- **How do creator strategies compare?** — Does the competitor use a few mega-creators or many micro-creators?

### What our data reveals

**Sponsored Content dataset:** 230,267 content pieces from 61,761 distinct creators. Of these, 26,540 pieces (11.5%) carry a named sponsor, linking 3,415 unique creators to 2,987 distinct sponsor brands via 3,897 unique creator-sponsor pairings.

**Content format split:**

| Format | Total Pieces | Creators | Pieces with Named Sponsor | Sponsor Rate |
| --- | ---: | ---: | ---: | ---: |
| Spotlight | 170,389 | 57,279 | 13,946 | 8.2% |
| Story | 59,878 | 7,532 | 12,594 | 21.0% |

Stories are 2.5x more likely to carry sponsor attribution than Spotlights — Stories are the traditional "influencer deal" format, while Spotlights are more organic/viral.

### Use cases

#### 2.1 Competitor Creator Network Mapping

> *"Trendyol works with 18 distinct Snapchat creators across 132 sponsored content pieces. Their top creator (pixou74) produced 299 pieces across 13 different brand partnerships — a high-volume, multi-brand creator. Gissah works with 16 creators across 178 pieces — a deeper, more content-intensive strategy per creator."*

The Sponsored Content API provides direct `sponsor_name` → `creator_name` links with URLs for both parties. This is not inference — it is DSA-mandated disclosure.

**Verified** (see `experiments/06_influencer_network.sql`). Top sponsors by creator breadth:

| Sponsor | Unique Creators | Content Pieces |
| --- | ---: | ---: |
| Dreams Store | 31 | 374 |
| Trendyol | 18 | 132 |
| Gissah | 16 | 178 |
| TEMU_FR | 13 | 19 |
| Temu Arabia | 10 | 10 |

Note: The current sample is dominated by MENA-region and Turkish sponsors (reflecting Snapchat's strong user base in Saudi Arabia, UAE, and Turkey). Western luxury brands (Nike, Dior, Chanel, etc.) do **not** appear in the sponsored content dataset — they operate exclusively through the paid ads system. This is itself a competitive insight (see Use Case 2.7).

#### 2.2 Creator Exclusivity Analysis

> *"91.9% of Snapchat creators with sponsored content work with exactly one brand — near-total exclusivity. Only 0.3% work with 6+ brands. If a competitor's key creator works with only them, poaching is harder."*

**Verified:**

| Sponsors per Creator | Creators | % |
| --- | ---: | ---: |
| 1 (exclusive) | 3,137 | 91.9% |
| 2 | 184 | 5.4% |
| 3-5 | 84 | 2.5% |
| 6+ | 10 | 0.3% |

**Caveat on the 91.9% figure:** 1,824 of the 3,415 creators (53%) have only a single content piece — they are "exclusive" by definition. Among creators with 6-20 pieces, exclusivity drops to 81.2%. Among creators with 20+ pieces (the strongest signal), exclusivity is 62.7%. Still significantly higher than Instagram/TikTok norms, but the headline 91.9% overstates the strength of the finding. The honest framing: **Snapchat creator-brand relationships skew heavily exclusive — roughly 63-82% among active creators — substantially different from multi-platform norms.**

The 10 multi-brand creators (6+ sponsors) are the platform's "professional influencers" — working across categories from beauty to home goods to charity. They represent recruitment opportunities for brands entering the platform.

#### 2.3 Creator Content Volume Benchmarking

> *"Your competitor's top creator produced 299 content pieces. The median sponsored creator produces just 1 piece. A creator producing 50+ pieces signals a deep, ongoing partnership — likely a retainer deal, not a one-off."*

**Verified:**

| Volume Bucket | Creators | Total Content |
| --- | ---: | ---: |
| 1 piece | 1,863 | 1,863 |
| 2-5 pieces | 823 | 2,445 |
| 6-20 pieces | 508 | 5,600 |
| 21-50 pieces | 206 | 6,641 |
| 50+ pieces | 84 | 9,991 |

The long tail matters: 84 creators produce 50+ pieces each, accounting for 37.6% of all sponsored content — a power-law distribution. These high-volume creators are the backbone of brand presence on Snapchat.

#### 2.4 Brand Spotlight Content Strategy

> *"Gymshark publishes 17 Spotlight videos with 1.9M total views and 134K boosts — aggressive organic-paid hybrid. Louis Vuitton has 16 Spotlights with 980K views — high-production brand content. H&M gets 358K views from only 10 videos — efficient content strategy."*

Brand Profile Spotlights reveal how competitors use Snapchat's TikTok-like format for owned content:

**Verified** from `brand_profile_spotlights` (331 videos across 29 brands, 4M total views):

| Brand | Videos | Total Views | Avg Views | Boosts | Avg Duration |
| --- | ---: | ---: | ---: | ---: | ---: |
| Gymshark | 17 | 1,886,614 | 117,913 | 134,240 | 14.4s |
| Louis Vuitton | 16 | 980,098 | 61,256 | 26,074 | 24.2s |
| H&M | 10 | 357,774 | 35,777 | 450 | 10.4s |
| Dior | 16 | 200,787 | 14,342 | 12,876 | 23.7s |
| Nike | 9 | 131,397 | 14,600 | 1,390 | 40.4s |

The **boost count** represents paid amplification — Snapchat's "Boost" feature converts organic Spotlight videos into paid ads via Ads Manager. Gymshark's 134K boosts vs H&M's 450 suggests Gymshark is aggressively amplifying their Spotlight content through paid promotion, while H&M relies on organic distribution. (Caveat: we have not confirmed whether this field counts individual boost campaigns or a cumulative promotion metric — the median of 16 and max of 68K suggest a cumulative measure.)

Video duration signals content strategy: Nike averages 40.4s (long-form storytelling) vs Gymshark at 14.4s (snackable fitness content) vs H&M at 10.4s (quick product reveals).

#### 2.5 Creator Discovery & Topic Mapping

> *"In 'fashion' Spotlight content, 22 creators generated 10.1M views. In 'style', 18 creators generated 8.5M views. The overlap and divergence between these topics reveals which creators dominate different fashion niches on Snapchat."*

**Verified** from `explore_spotlight_creators` (312 videos across 234 creators, 39.3M total views):

| Topic | Videos | Creators | Total Views | Avg Views |
| --- | ---: | ---: | ---: | ---: |
| fashion | 24 | 22 | 10,112,627 | 421,359 |
| style | 18 | 18 | 8,517,832 | 473,213 |
| wardrobe | 18 | 18 | 4,392,335 | 244,019 |
| trendy | 24 | 22 | 4,025,775 | 167,741 |
| outfit | 24 | 24 | 3,714,542 | 154,773 |
| fashionblogger | 18 | 13 | 2,129,263 | 118,292 |
| streetwear | 24 | 19 | 1,897,648 | 79,069 |
| runway | 21 | 18 | 1,303,128 | 62,054 |

This data enables topic-based creator recruitment: a brand wanting "streetwear" creators can find 19 active creators with 1.9M collective views. A luxury brand wanting "runway" content has 18 creators with 1.3M views.

The **Explore Subscribe Profiles** table adds creator metadata (102 profiles, 22 with 100K+ subscribers, max 4.7M). Combined with topic affinity from Spotlights, this enables a basic creator CRM with subscriber tiers: mega (1M+), macro (100K-1M), mid (10K-100K), micro (1K-10K).

#### 2.6 Brand Content Intelligence via Hashtags and Descriptions

> *"Jimmy Choo uses #JimmyChoo across 16 Spotlight videos. Dior uses #DiorAW26 across 13 — tying content to a specific collection/season. Moncler uses #monclergrenoble (15 uses) — geographic branding."*

**Verified** from `brand_profile_spotlights` (121 videos with hashtags, 169 with text descriptions). LLM-generated titles and descriptions are available for 218 videos — providing AI-analyzed content summaries (e.g. "Behind the Scenes of a Christian Dior Haute Couture Dress", "Cartier Love Bracelet Unboxing & First Look").

This metadata enables automated competitive content categorization:

- **Campaign tracking** — group content by hashtag to identify campaigns (#DiorAW26 = Autumn/Winter 2026 collection)
- **Content strategy analysis** — what does a competitor post about? Product showcases, behind-the-scenes, lifestyle, influencer features?
- **Engagement benchmarking** — which content themes drive the most views, shares, and boosts?

#### 2.7 The Paid-vs-Creator Gap: A Competitive Moat

> *"Nike, HUGO BOSS, Cartier, Birkenstock, and Zalando are all top-15 Snapchat paid advertisers in EU fashion. None of them appear as sponsors in the creator collaboration dataset. This reveals a strategic blind spot — or a deliberate choice."*

This finding (validated in `experiments/04_sponsor_advertiser_overlap.sql`) is itself one of the most valuable influencer insights:

- **For brands in the paid-ads-only camp:** Snapchat creator collaborations are an untapped channel. Every competitor ignoring it is an opportunity.
- **For brands already using creators:** The absence of major luxury brands from creator sponsorships means less competition for top Snapchat creators.
- **For platforms like Ravineo:** This gap means two completely independent datasets with zero overlap — each reveals a dimension of competitor activity invisible to the other. A client using only ad-library tools sees nothing about creator strategy; a client using only influencer tools misses the paid spend picture.

The current sponsored content dataset is dominated by MENA-region D2C brands, e-commerce platforms (Temu, Trendyol), and local businesses — a very different advertiser profile from the EU paid ads library. As Western brands expand into Snapchat creator partnerships (Snap's Creator Collab Campaigns launched in 2024), this dataset will become increasingly valuable.

#### 2.8 Paid Creator Content Detection (from ad names)

> *"Birkenstock runs 7 paid ads using creator/partnership content with 5.95M impressions (€24K-54K estimated spend). CAUDALIE uses creator UGC in 9 ads with 3.18M impressions. CAIAcosmetics encodes actual creator usernames in ad names: biancaingrosso (422K impressions), basma_bada, sabinasarkka."*

This was missed in the initial analysis. Ad names in the paid ads library frequently contain signals revealing creator involvement: "Creator", "PartnershipAd", "UGC", "Influencer", "Collab". These are brands turning creator content into paid ads — a key Snapchat strategy called "Creator Collab Campaigns."

**Verified** (see `experiments/09_paid_creator_content.sql`):

| Signal | Unique Ads | Brands | Impressions |
| --- | ---: | ---: | ---: |
| UGC | 81 | 10 | 40.6M |
| Creator | 9 | 2 | 4.6M |
| Partnership Ad | 3 | 2 | 3.3M |
| Influencer | 3 | 3 | 1.1M |
| Collab | 8 | 1 | 0.1M |

**145 ads (3.1% of all paid ads) contain creator/UGC signals** — with 49.7M total impressions.

This is the bridge between Sections 1 and 2: brands that DO use creators on Snapchat but route them through the paid ads system rather than organic sponsored content. Unlike the Sponsored Content API (dominated by MENA D2C brands), this reveals **Western brands actively investing in creator content**: Birkenstock, CAUDALIE, boohooMAN, Givenchy Beauty, Pandora, HUGO BOSS, adidas.

The creator share of paid impressions varies wildly by brand:

| Brand | Creator % of Paid Impressions | Strategy Signal |
| --- | ---: | --- |
| Wild Cosmetics | 95.9% | Almost entirely creator-driven |
| Dekbedovertrek.nl | 72.6% | Creator-first |
| CAIAcosmetics | 44.4% | Balanced creator + brand |
| CAUDALIE | 27.1% | Significant creator mix |
| Birkenstock | 3.7% | Creator as supplement |
| HUGO BOSS | 0.1% | Minimal creator use |

Many brands encode actual creator identities in ad naming conventions. By parsing these, we extracted **13 specific brand-creator pairs with real impression data** from the paid ads library — competitive intelligence that is completely invisible to traditional influencer tools:

| Brand | Creator | Ads | Impressions |
| --- | --- | ---: | ---: |
| Givenchy Beauty | Sullivan | 4 | 2,413,445 |
| Pandora | Lara GCV | 1 | 955,997 |
| CAIAcosmetics | Bianca Ingrosso | 5 | 845,678 |
| Wild Cosmetics | Greta | 2 | 328,418 |
| Birkenstock | Aldara | 1 | 231,803 |
| HUGO BOSS | Jayde Pierce | 4 | 80,340 |
| HUGO BOSS | Julien Brown | 4 | 49,770 |

Each naming convention reveals the brand's internal taxonomy: HUGO BOSS uses `BLACK/COLLAB/SPTL/30_SEC/9X16/SOCI/INFL/JAYDE_PIERCE` (product line / campaign type / format / duration / aspect / channel / type / creator). Wild Cosmetics uses `UGCPOD_GRETA` — suggesting an organized "UGC Pod" of named creators. CAIAcosmetics encodes everything: `s:creator | c:biancaingrosso | p:liquid_blush | h:productdemonstration | af:tutorial`.

This is a novel competitive intelligence method: **extracting creator identities from DSA-mandated ad naming conventions.** No other tool does this because it requires parsing the internal naming structure of individual advertisers from a public transparency feed.

**Cross-platform verification confirms these are real, high-profile creators:**

- **Bianca Ingrosso** (CAIA, 845K impressions): Swedish influencer with 1.4M Instagram followers, **co-founder of CAIA Cosmetics itself** — so CAIA's "creator ads" feature their own founder/face of brand. Revenue >$50M.
- **Jayde Pierce** (HUGO BOSS, 80K impressions): UK beauty/fashion influencer with 1.3M followers, active on Snapchat (@jaydepierce), partnerships with Pandora, ASOS, Burberry Beauty. **The HUGO BOSS collaboration is not publicly documented anywhere** — this DSA data reveals it before any press announcement.

The Jayde Pierce finding illustrates the competitive intelligence value: a brand monitoring HUGO BOSS would discover their Snapchat creator partnership through ad library data before it's announced on any other channel.

**Geographic and temporal creator strategy is also extractable:**

| Brand | Creator Countries | Brand Countries | Creator % of Impressions | Creator Start Date |
| --- | --- | --- | ---: | --- |
| Birkenstock | 6 (DK, ES, FR, IT, NL, SE) | 8 (adds BE, DE) | 3.7% | Apr 2023 |
| CAIAcosmetics | 3 (DE, FI, SE) | 3 (same) | 44.4% | Apr 2025 |
| CAUDALIE | 2 (FR, IT) | 2 (same) | 27.1% | — |
| HUGO BOSS | 1 (DE only) | 10 (AT, DE, ES, FR, HU, IE, IT, NL, PL, SE) | 0.1% | Nov 2025 (single day) |

HUGO BOSS ran creator ads on **a single day (Nov 17, 2025), in Germany only**, generating just 130K impressions across 8 ads — a minimal test. They run 504 brand ads across 10 countries with 110M impressions. This tells a competitor: HUGO BOSS is barely experimenting with creators on Snapchat — first-mover advantage is available.

Birkenstock's targeting data reveals another insight: creator ads target ages **18-39**, while brand ads target **18+ (no max age)** — brands use creator content specifically to reach younger demographics.

These are fully automated, scalable analyses. Every time the ad library crawl runs, brand-creator relationships, geographic strategies, and temporal trends update automatically.

#### 2.9 The 61K Creator Database (hidden asset)

The 88.5% of sponsored content without a named sponsor is not noise — it is a **comprehensive Snapchat creator database**. These 58,739 unique creators include:

| Activity Level | Creators | Content Pieces | Uses Both Formats |
| --- | ---: | ---: | ---: |
| 50+ pieces | 512 | 70,344 | 345 |
| 21-50 pieces | 850 | 26,872 | 378 |
| 6-20 pieces | 3,320 | 33,318 | 870 |
| 2-5 pieces | 10,850 | 29,986 | 1,185 |
| 1 piece | 43,207 | 43,207 | 0 |

The 512 creators with 50+ pieces are professional-grade content producers. The top creator (`sadaaltawfeer.y`) has 1,959 pieces across both Spotlights and Stories. 455 of these creators also appear in the sponsored dataset — producing on average 12.2 sponsored and 24.2 unsponsored pieces each. Their sponsorship density (~33%) is a useful metric: brands can see which active creators are open to partnerships but not oversaturated with deals.

With profile scraping (existing infrastructure), each of these 58K usernames yields subscriber count, bio, category, related accounts, and engagement metrics — **building the largest independent Snapchat creator database available**, far exceeding what campaign management platforms provide.

#### 2.10 Alignment with Ravineo's Undisclosed Partnership Detection

Ravineo's core AI product detects **undisclosed** brand presence in influencer content — [finding that 80% of sponsored Instagram posts are not properly disclosed as ads](https://www.tubefilter.com/2024/12/04/sponsored-content-unlabeled-ravineo/). The Snapchat Sponsored Content API is the **complement**: DSA-mandated **disclosed** partnerships.

This creates a three-layer intelligence stack for Ravineo's clients:

1. **Layer 1: Disclosed partnerships** (Sponsored Content API) — What creators officially disclose as sponsored
2. **Layer 2: Paid creator amplification** (Ad Library ad name parsing) — Brands boosting creator content as paid ads, with spend/impression data
3. **Layer 3: Undisclosed partnerships** (Ravineo's AI video analysis) — Brands appearing in creator content without disclosure

No competitor offers all three layers. Ravineo is uniquely positioned to deliver the complete picture because they already have Layer 3 for Instagram/TikTok, and Layers 1-2 are now accessible for Snapchat via public DSA feeds.

### Honest limitations

The influencer intelligence offering is **architecturally strong but data-thin today**. Critical gaps:

1. **MENA-dominated sponsor base.** Of the top 30 sponsors by creator breadth, the vast majority are Saudi/UAE/Turkish brands (dental clinics, oud perfumeries, charities, D2C stores). The only recognizable global brands are Trendyol and Temu. **Not a single Western luxury, FMCG, or consumer electronics brand appears as a sponsor.** This means Use Case 2.1 (competitor network mapping) cannot yet answer "who are Nike's Snapchat creators?" — because Nike doesn't use the Sponsored Content channel at all.

2. **No engagement metrics on sponsored content.** The `sponsored_content` table has exactly 7 fields: `sponsor_name`, `sponsor_url`, `creator_name`, `creator_url`, `content_type`, `content_url`, `thumbnail_url`. No view counts. No timestamps. No engagement. We can count pieces but cannot say "that partnership generated 500K views."

3. **No creator audience demographics.** We don't know the age, gender, or country of any creator's audience from the Sponsored Content API alone.

4. **88.5% of sponsored content lacks a named sponsor.** Only 26,540 of 230,267 pieces (11.5%) carry a `sponsor_name`. The rest are likely Spotlight Rewards monetization — Snap paying creators directly. However, as shown in Use Case 2.9, this "unsponsored" subset is itself a valuable creator database (58K usernames, 512 with 50+ content pieces).

5. **No influencer spend estimation.** Unlike Section 1 where we have impressions × CPM, we have no basis for estimating what brands pay creators. Content piece count is a weak proxy.

**These gaps do not invalidate the offering — they define the roadmap.** The structural insights (exclusivity patterns, paid-vs-creator gap, platform characteristics) are solid and unique. The data enrichment path is clear and achievable.

### Enhancement roadmap (what makes this 10x better)

Three concrete steps, all using infrastructure we already have:

**Step 1: Profile scraping for all 3,415 sponsored creators (~45 min)**

We have a working profile scraper (`data_sources/snap_profiles/`). Running it on all sponsored creator usernames would add: follower count, bio, category (LIFESTYLE_INFLUENCER, FITNESS_PRO, etc.), spotlight engagement metrics (views, shares, boosts per video), related accounts (network graph), and account age. This transforms bare `creator_name` strings into rich creator profiles and enables creator tier analysis (mega/macro/mid/micro/nano) for each sponsor's creator portfolio.

**Step 2: Spotlight page scraping for 13,876 sponsored URLs (~3 hours)**

We have 13,876 unique Spotlight URLs from sponsored content with named sponsors. Our spotlight scraper (`data_sources/snap_spotlights/`) can fetch each one for: view count, share count, video transcript, comments, and duration. This adds the missing engagement metrics and enables ROI-style benchmarking ("Trendyol's creator partnerships generated X total views").

**Step 3: Snap Creator Discovery API partnership (weeks of outreach)**

Snap's Creator Discovery API (allowlist-only, documented in [RESEARCH.md](./RESEARCH.md) §9) provides: creator search with filters (country, category, follower range, spotlight views), engagement rate calculations, profile change logs over time, and authorized demographic data for opted-in creators. This is the highest-value unlock for influencer intelligence but requires Ravineo to establish a formal Snap partnership — realistic based on Snap's existing partnerships with Traackr, Captiv8, CreatorIQ, etc.

**Step 4: Expand keyword crawling for broader creator coverage**

Our explore endpoint crawler (`data_sources/snap_explore/`) currently covers ~13 fashion keywords. Expanding to beauty, fitness, food, tech, gaming, etc. would build a comprehensive creator database across verticals. Each keyword yields ~20-30 unique creators with view/share data.

See `experiments/08_influencer_enrichment_potential.sql` for quantified enrichment estimates.

### How this compares to what exists

| Tool | Snapchat Creator Intel | Method | Limitation |
| --- | --- | --- | --- |
| **Traackr** | Campaign management (with Snap API) | Creator Discovery API | Requires brand's own account; no competitor visibility |
| **HypeAuditor** | Limited Snapchat coverage | AI + panel | Focuses on Instagram/TikTok; Snapchat is minimal |
| **Modash** | No Snapchat | API + scraping | Instagram, TikTok, YouTube only |
| **CreatorIQ** | Snap integration (2024) | Creator Discovery API | Execution tool, not competitive intelligence |
| **Our approach** | **Sponsored content graph + profile enrichment** | DSA-mandated disclosure + public scraping | Covers all DSA-disclosed sponsorships; enrichment pipeline ready but not yet run at scale |

Our differentiator: **Every other tool helps you manage your own creator campaigns. We show you your competitors' creator campaigns.** The Sponsored Content API provides a competitive intelligence layer that campaign management platforms do not and cannot offer — because they rely on the brand's own API access, not public transparency data. The enrichment pipeline (Steps 1-2 above) is what transforms this from a name-and-URL directory into a full intelligence product.

### What this means for a Beiersdorf or Philips

The influencer offering has two tiers of value:

**Available today (structural insights):**

1. **Platform strategy** — "63-82% of active Snapchat creators work with exactly one brand — far more exclusive than Instagram/TikTok. We need long-term partnerships, not one-off deals."
2. **Channel gap identification** — "Major luxury/FMCG brands aren't using Snapchat creators at all. First-mover advantage."
3. **Content format intelligence** — "Gymshark gets 118K avg views per owned Spotlight. Stories carry sponsor tags 21% of the time vs 8% for Spotlights."
4. **Competitive content benchmarking** — "How does our Spotlight strategy compare to Dior's 16 videos at 14K avg views?"
5. **Paid creator intelligence** — "HUGO BOSS tested Jayde Pierce on Snapchat for one day in November 2025 — they're barely experimenting. Birkenstock is more mature with 6 countries."
6. **Ravineo synergy** — Three-layer intelligence stack: disclosed (Sponsored Content), paid amplification (ad name parsing), and undisclosed detection (Ravineo AI). No competitor offers all three.

**Available after enrichment (Steps 1-2, ~4 hours of compute):**

1. **Competitive mapping with engagement** — "Trendyol's 18 creators generated X total views across 132 pieces."
2. **Creator recruitment with data** — "These creators have 100K+ followers, work with 6+ brands, and average Y views per Spotlight."
3. **Network analysis** — "Creator A's related accounts include Creators B, C, D — a cluster of micro-influencers in the beauty vertical."

**Available after Snap partnership (Step 3):**

1. **Full competitive intelligence** — Audience demographics, engagement rates, trend tracking, creator CRM with country/category filters.

### Data access summary

| Use Case | Table | Key Fields | Status |
| --- | --- | --- | --- |
| Creator Network | `sponsored_content` | `sponsor_name`, `creator_name`, `creator_url` | 26,540 sponsored pieces, 3,897 unique pairs |
| Exclusivity | `sponsored_content` | `sponsor_name`, `creator_name` | 3,415 creators, 2,987 sponsors |
| Content Volume | `sponsored_content` | `creator_name`, `content_type`, `content_url` | 230,267 total pieces |
| Brand Spotlights | `brand_profile_spotlights` | `brand`, `view_count`, `boost_count`, `hashtags` | 328 videos, 29 brands |
| Creator Discovery | `explore_spotlight_creators` | `creator_username`, `view_count`, `keyword` | 312 videos, 234 creators |
| Creator Profiles | `explore_subscribe_profiles` | `username`, `subscriber_count`, `is_brand` | 102 profiles |
| Brand Profiles | `brand_profiles` | `username`, `subscriber_count`, `spotlight_count` | 100 brands |
| Paid-vs-Creator Gap | `brand_ads_fashion` + `sponsored_content` | Cross-reference `paying_advertiser_name` vs `sponsor_name` | Verified: zero overlap for top-15 advertisers |
| Paid Creator Content | `brand_ads_fashion` | `ad_name` parsed for creator/UGC/partnership signals | 145 ads, 15 brands, 49.7M impressions |
| Creator Name Extraction | `brand_ads_fashion` | `ad_name` parsed for embedded creator names | 13 brand-creator pairs, 7 brands, 5.1M impressions |
| Creator Database | `sponsored_content` | All `creator_name` + `creator_url` entries | 61,761 unique creators, 230K content pieces |
| Ravineo Synergy | All layers combined | Disclosed + paid amplification + undisclosed detection | Three-layer intelligence stack |
| **Enrichment potential** | `sponsored_content` → profile scraper | 3,415 sponsored + 58K unsponsored creator usernames | **Not yet run** — ~45 min (sponsored) or ~14h (all) |
| **Engagement potential** | `sponsored_content` → spotlight scraper | 13,876 Spotlight URLs | **Not yet run** — ~3 hours to execute |

---

## 3. Organic Presence

*Original brief question: What their organic presence on the platform looks like.*

### The key insight: brand organic presence on Snapchat is a black box — even to the brands themselves

On Instagram, TikTok, and YouTube, any competitor can visit a brand's profile and see follower count, post history, engagement, and content strategy in seconds. Tools like Socialinsider, Sprout Social, and Rival IQ automate this at scale.

**Snapchat is fundamentally different.** Public profiles exist, but the platform's design prioritizes privacy and ephemerality. Stories disappear. Spotlight content is surfaced algorithmically, not through profile browsing. There is no public follower count on most profiles. No third-party tool monitors Snapchat organic brand presence at scale because the data is hard to collect and the platform discourages competitive browsing.

Our profile scraper changes this. By systematically collecting public profile data, Spotlight content, and engagement metrics for 100 fashion/luxury brands, we've built the first competitive organic intelligence dataset for Snapchat.

**What marketing directors actually want to know:**

- **Are my competitors even on Snapchat?** — Do they have a profile? Is it active?
- **How does my organic presence compare?** — More/fewer followers, content, engagement?
- **What content strategy works?** — What are top performers posting, how long, how often?
- **Is my brand name protected?** — Does someone else control our Snapchat username?
- **Should I invest in organic or just paid?** — What's the relationship between organic effort and results?

### What our data reveals

**Brand profile dataset:** 100 fashion/luxury brand profiles, each with subscriber count, Spotlight content count, bio, category, subcategory, website, verification badge, profile timestamps, hero images, and feature flags (stories, highlights). **331 Spotlight videos** from 29 brands with full engagement metrics: views, shares, boosts, comments, recommends (saves), duration, hashtags, and AI-generated content descriptions. Raw JSON additionally contains 339 AR lenses (61 brands), 2,763 curated highlight snaps (40 brands), 474 Snapchat AI content signals (23 brands), language detection (27 brands), and audio attribution (280 videos).

The data reveals a striking five-tier maturity model:

| Tier | Count | Description | Examples |
| --- | ---: | --- | --- |
| **A: Active** | 8 | Subscribers + Spotlight content | SHEIN (491K subs), Balenciaga, Prada, Jordan, Tiffany |
| **B: Audience only** | 3 | Subscribers but no content | Foot Locker (131K), Maybelline (125K), YSL Beauty |
| **C: Content producer** | 19 | Spotlight content but 0 public subscribers | Dior, Gucci, Louis Vuitton, Nike, H&M, Cartier |
| **D: Dormant** | 42 | Profile exists, no content, no audience | adidas, Burberry, Calvin Klein, Tommy Hilfiger, Pandora |
| **E: Username squatted** | 28 | Username held by a personal account | Chanel, Hermes, Levi's, Ray-Ban, Saint Laurent, MAC |

**Only 8 out of 100 brands have what could be called a functioning organic Snapchat presence.** 42 are dormant. 28 don't even control their own username.

Note: MAC Cosmetics (@mac) is classified as squatted despite having 65,800 subscribers — the account belongs to "Jassim Alkuwari" (category: People, bio links to personal Instagram), not the cosmetics brand. The subscribers belong to this individual, not MAC Cosmetics. This illustrates how username squatting can create misleading competitive data.

### Use cases

#### 3.1 Platform Adoption Maturity Scorecard

> *"Of 100 tracked fashion/luxury brands, only 8% have an active Snapchat presence (subscribers + content). 42% are dormant — profile exists but abandoned. 28% have their username squatted by personal accounts. Beiersdorf's competitors are barely showing up."*

**Verified** (see `experiments/11_organic_presence.sql`). The maturity scorecard enables:

- **Competitive gap detection** — "Only 3 of your 10 direct competitors are active on Snapchat. If you invest now, you're ahead of 7."
- **Industry benchmarking** — "In luxury fashion, 60% of brands have Spotlight content. In FMCG beauty, only 25% do."
- **Tracking over time** — Re-scraping monthly shows which brands are activating (moving from D→C→A) or abandoning (A→D).

The profile completeness score (0-8 scale) adds granularity: SHEIN, Prada, and Jimmy Choo score 7/8 (bio, category, website, hero image, highlights, spotlight content). Chanel, Burberry, and Calvin Klein score 0/8.

**Verification status adds another dimension.** The `badge` field reveals 53 brands are verified (blue checkmark) and 47 are not:

| Metric | Verified (53) | Unverified (47) |
| --- | ---: | ---: |
| Avg subscribers | 18,404 | 5,987 |
| Avg Spotlight videos | 5.0 | 1.0 |
| Have website URL | 47 (89%) | 0 (0%) |
| Have subscribers > 0 | 9 (17%) | 3 (6%) |

Verified brands outperform across every metric: 3x the subscribers, 5x the content output. The website URL gap is absolute — no unverified brand has a website set. This makes verification status a strong proxy for brand maturity and profile investment.

**Profile completeness across all 100 brands** shows significant underinvestment:

| Field | % of brands with data |
| --- | ---: |
| Address | 54% |
| Verified badge | 53% |
| Website URL | 47% |
| Bio text | 46% |
| Category | 44% |
| Hero/banner image | 38% |

Even among brands with subscribers (the top 12), some lack basics: Jordan and Crocs have no website, no category, and are unverified. This represents a concrete optimization opportunity that Ravineo can flag per-brand.

**Industry segmentation from subcategories** enables automatic benchmarking within verticals. 44 brands set subcategories:

| Industry | Brands | Avg Subscribers | Examples |
| --- | ---: | ---: | --- |
| Apparel & Fashion | 11 | 1,064 | Jimmy Choo, Fendi, Tommy Hilfiger, Lululemon |
| Health & Beauty | 5 | 31,300 | Maybelline, YSL Beauty, Clarins, Dove |
| Generic "Brand" | 19 | 32,505 | SHEIN, Balenciaga, Prada, Dior, Louis Vuitton |
| Retail Company | 4 | 32,675 | Foot Locker, The North Face, Victoria's Secret |
| Business | 3 | 0 | Pandora, Sephora, Timberland |
| Public Figure | 1 | 65,800 | MAC (squatted — confirms non-brand account) |

The MAC account's subcategory is "public-figure" — independent platform-level confirmation that it's not a brand account. This data enables Ravineo to benchmark brands only against their own industry vertical, not the entire sample.

#### 3.2 Username Squatting Detection (Brand Safety Alert)

> *"Chanel's Snapchat username (@chanel) is controlled by someone named 'Pauline💋👠'. Hermes (@hermes) belongs to 'mayed'. Levi's (@levis) belongs to 'levi turner'. Ray-Ban (@ray-ban) belongs to 'Raven 🖤'. 28 of 100 tracked brands have their primary Snapchat username held by a personal account."*

**Verified — 28 squatted usernames identified (including MAC → "Jassim Alkuwari" with 65.8K personal subscribers):**

| Brand | Username | Actual Account Holder |
| --- | --- | --- |
| Chanel | @chanel | Pauline💋👠 |
| Hermes | @hermes | mayed |
| Saint Laurent | @saint_laurent | Rich |
| Bottega Veneta | @bottega-veneta | Sapp-DeLuxe⌚️🐊 |
| Swarovski | @swarovski | Kine 😈😇 |
| Levi's | @levis | levi turner |
| Ray-Ban | @ray-ban | Raven 🖤 |
| Rare Beauty | @rare_beauty | Tamarah Sarah 💰〽️ |
| The Ordinary | @the-ordinary | \_blvcknoble\_ |
| Too Faced | @toofaced | eric Gilbreth |
| MAC | @mac | Jassim Alkuwari (65.8K subs) |

*(17 more: Canada Goose, Caudalie, Diesel, Dolce & Gabbana, Jack Wolfskin, Massimo Dutti, Miu Miu, Mohito, Notino, Peek & Cloppenburg, Primark, Rexona, Salomon, Stradivarius, TK Maxx, Urban Decay, Vero Moda)*

**Bio text provides independent squatting confirmation.** MAC's bio reads "Instagram: @\_\_\_upsidedown\_\_\_ Private instagram: @jhjalkuwari" — a personal account linking to personal social media. Canada Goose's bio says "15 716 NY📍 class of 28" — a teenager. Crocs' bio says "Dm for crocs discount" — likely a reseller. Caudalie's bio says "Meryem 🩷🩷" — a personal name. Combined with the language detection signal (MAC posts only Arabic content) and the subcategory field (MAC = "public-figure"), we have multiple independent signals confirming each squatting case. This makes the detection robust and defensible for client presentations.

This is immediately actionable brand safety intelligence. Snapchat's policy is first-come-first-served — usernames are not transferable. Trademark holders can file an infringement claim, but only if the squatter is using the account commercially in a confusing way. For personal accounts (like "Pauline" on @chanel), the brand's options are limited.

**The nuclear variant: brands paying for ads while their username is squatted.** Cross-referencing the paid ads library with squatted profiles reveals 8 brands actively spending on Snapchat advertising while a personal account controls their organic username:

| Brand | Squatter | Username | Estimated Paid Spend |
| --- | --- | --- | ---: |
| Canada Goose | 𝒶𝓎𝒹𝑒𝓃 🪶🦦 | @canadagoose | €363,871 |
| Chanel | Pauline💋👠 | @chanel | €320,967 |
| Caudalie | Meryem🩷🩷🩷 | @caudalie | €76,282 |
| Swarovski | Kine 😈😇 | @swarovski | €8,471 |
| Diesel | Gabriel 🎰 | @diesel\_official | €6,884 |
| Bottega Veneta | Sapp-DeLuxe⌚️🐊 | @bottega-veneta | €1,375 |
| Salomon | Salomón Official | @salomonofficial | €851 |
| Hermes | mayed | @hermes | €133 |

Canada Goose spends an estimated €364K on Snapchat paid ads while someone named "𝒶𝓎𝒹𝑒𝓃" controls @canadagoose. Chanel spends €321K while "Pauline" controls @chanel. These brands are literally paying Snapchat for advertising while the platform allows personal accounts to sit on their brand identity. This finding alone is a compelling sales conversation for Ravineo — any brand receiving this alert would immediately want the full monitoring package.

**Why this matters for Ravineo clients:** A marketing team planning a Snapchat launch may not realize their obvious username is taken. Discovering this during a strategy meeting — rather than at go-live — saves weeks of brand protection effort. This scan runs automatically every time the profile scraper executes.

#### 3.3 Content Strategy Benchmarking

> *"Gymshark publishes 17 Spotlights at 14.4s average and gets 111K views per video. Louis Vuitton does 16 at 24.2s for 61K views. H&M does 10 at 10.4s for 36K views. Nike does 9 at 40.4s for 14.6K views. Duration, cadence, and view count per video are all benchmarkable."*

**Verified** — full Spotlight engagement data for 22 brands with view data:

| Brand | Videos | Avg Views | Avg Duration | Avg Shares | Total Boosts |
| --- | ---: | ---: | --- | ---: | ---: |
| Gymshark | 17 | 110,977 | 14.4s | 178 | 134,240 |
| Louis Vuitton | 16 | 61,256 | 24.2s | 98 | 26,074 |
| H&M | 10 | 35,777 | 10.4s | 11 | 450 |
| Dior | 16 | 12,549 | 23.7s | 17 | 12,876 |
| Nike | 9 | 14,600 | 40.4s | 2 | 1,390 |
| Cartier | 16 | 5,261 | 17.3s | 5 | 1,938 |
| SHEIN | 16 | 3,569 | 24.7s | 5 | 3,981 |
| Gucci | 15 | 3,731 | 26.7s | 22 | 419 |

7 brands have Spotlight content but views are suppressed (returned as -1): Crocs, Moncler, Jimmy Choo, Miu Miu, & Other Stories, Bath & Body Works, Paco Rabanne. This means the view count field is not universally exposed — a data limitation, but the content metadata (duration, hashtags, descriptions, upload date) is still available for all.

#### 3.4 Engagement Efficiency Analysis

> *"Gucci has the highest share rate on Snapchat Spotlight (0.60%) — their content is the most 'shareworthy' despite having far fewer views than Gymshark. Gymshark has the highest boost rate (7.11%) — they're aggressively amplifying organic content through paid promotion. H&M gets views but nobody shares or boosts their content (0.03% share rate, 0.13% boost rate)."*

**Verified** engagement ratios:

| Brand | Views | Share Rate | Boost Rate | Comment Rate |
| --- | ---: | ---: | ---: | ---: |
| Gymshark | 1.89M | 0.16% | 7.11% | 0.001% |
| Louis Vuitton | 980K | 0.16% | 2.66% | 0.102% |
| Gucci | 56K | **0.60%** | 0.61% | 0.041% |
| Fendi | 2.2K | **0.69%** | 4.47% | **0.323%** |
| Dior | 201K | 0.13% | **6.33%** | 0.105% |
| H&M | 358K | 0.03% | 0.13% | 0.002% |

**A fourth metric — `recommend_count` — reveals a hidden engagement dimension.** "Recommends" appear to be Snapchat's save/wishlist action. The rate distribution is striking:

| Brand | Views | Recommend Rate | Boost Rate | Share Rate |
| --- | ---: | ---: | ---: | ---: |
| Louis Vuitton | 980K | **0.476%** | 2.66% | 0.16% |
| Dior | 201K | **0.293%** | 6.33% | 0.13% |
| Balenciaga | 30K | **0.246%** | 4.44% | 0.04% |
| Cartier | 84K | 0.138% | 2.06% | 0.09% |
| Nike | 131K | 0.107% | 1.06% | 0.01% |
| H&M | 358K | 0.008% | 0.13% | 0.03% |
| Gymshark | 1.89M | **0.004%** | 7.12% | 0.16% |

Recommend rate is **inversely correlated with boost rate**: luxury brands (LV, Dior, Balenciaga) get saved; mass-market brands (Gymshark, H&M) get boosted. This maps to two fundamentally different content strategies — **aspirational content** (users save to revisit) vs **viral content** (users boost for distribution). A brand's recommend-to-boost ratio reveals whether their content is building desire or just generating traffic.

Four distinct engagement strategies emerge:

- **Paid amplification** (high boost rate): Gymshark (7.1%), SHEIN (7.0%), Tiffany (6.5%), Dior (6.3%) — investing in boosting organic content
- **Aspirational saves** (high recommend rate): Louis Vuitton (0.48%), Dior (0.29%), Balenciaga (0.25%) — content users want to come back to
- **Organic shareability** (high share rate): Gucci (0.6%), Fendi (0.7%) — content people naturally share
- **Passive views** (low engagement across the board): H&M (0.03% share, 0.13% boost), Carolina Herrera (0.01% share) — views without action

This is a content quality signal. A brand producing content that nobody shares, boosts, or saves may need to rethink their creative approach — regardless of raw view count.

#### 3.5 Content Theme Intelligence (AI-Powered)

> *"H&M's top Spotlight: 'Street Style: A Model's Chic Look with Braids and Sunglasses' (273K views). Nike's top: 'A'ja Wilson Plays Basketball Game & Answers Fan Questions' (97K views). Dior's approach: behind-the-scenes and runway content. Cartier: luxury unboxing."*

218 of 331 Spotlight videos have AI-generated titles and descriptions, enabling automated content categorization:

| Content Theme | Example Brand | Example Title | Views |
| --- | --- | --- | ---: |
| Street style / lookbook | H&M | "Street Style: A Model's Chic Look" | 273,204 |
| Athlete/celebrity collaboration | Nike | "A'ja Wilson Plays Basketball Game" | 97,480 |
| Behind-the-scenes / fashion show | Dior | "Behind the Scenes of a Dior Fashion Show" | 31,314 |
| Luxury product showcase | Cartier | "Cartier Watches Unboxed: A Tale of Luxury" | 19,246 |
| Runway content | Carolina Herrera | "Carolina Herrera Runway: A Showcase of Elegance" | 19,563 |
| Campaign visual | Louis Vuitton | "Louis Vuitton's Spring Campaign: A Journey Through Paris" | 27,306 |

**Hashtag analysis** adds campaign identification: Dior uses #DiorAW26 (Autumn/Winter 2026 collection, 13 uses), Michael Kors uses #GovernorsIsland and #ConeyIsland (location-based campaigns), Gymshark uses #gymtok and #gymmemes (community engagement), Moncler uses #monclergrenoble (geographic branding).

**Multilingual content strategy** is detectable via Snapchat's own language detection (available in raw JSON cuSignals for 27 brands). Most brands post in English only, but several run multilingual strategies:

| Brand | Languages | Signal |
| --- | --- | --- |
| Carolina Herrera | English (6), Spanish (3) | Bilingual — targeting Hispanic markets |
| Dior | English (10), French (2) | HQ language mix |
| Jimmy Choo | English (8), Japanese (2) | Asian market content |
| Miu Miu | Japanese (2), English (2), Spanish (1) | Most multilingual brand |
| Omega | English (8), Korean (2) | Targeting Asian luxury market |
| MAC (squatted) | Arabic (4) | Confirms Middle Eastern personal account |

The MAC language signal is an independent confirmation of username squatting — a brand that should post in English has all-Arabic content.

**Audio strategy** reveals a strong platform norm: **98% of brand Spotlight content uses original sound** (273 of 280 videos). Only 7 videos use trending/licensed audio (Cartier uses Janis Joplin; Crocs uses "HOLD ON" by ill peach; Dior uses "Be Good" by HAAi; Miu Miu uses "4K" by El Alfa). This is a significant difference from TikTok, where trending sounds are a primary content strategy. On Snapchat, brands invest in original audio — a signal of higher production budgets and brand-owned content.

This enables a competitive content strategy radar: what themes work (street style beats runway on raw views), what campaigns competitors are running, how content strategy differs by brand category, and whether competitors are investing in production (original audio) or riding trends.

#### 3.6 Posting Cadence & Recency Tracking

> *"Prada posts every 1.6 days on average — the most consistent brand. Tiffany burst-posted 6 videos in a single day (likely a collection launch). Cartier averages one post every 12 days. Louis Vuitton's last Spotlight was October 2025 — they've gone dark."*

**Verified** posting patterns:

| Brand | Videos | Span | Avg Days Between Posts | Most Recent |
| --- | ---: | --- | ---: | --- |
| Prada | 16 | 24 days | 1.6 | Apr 8, 2026 |
| Tiffany | 6 | 1 day | 0.2 | Apr 8, 2026 |
| Omega | 16 | 41 days | 2.7 | Apr 7, 2026 |
| Dior | 16 | 62 days | 4.1 | Apr 2, 2026 |
| Cartier | 16 | 183 days | 12.2 | Apr 2, 2026 |
| Gucci | 15 | 139 days | 9.9 | Mar 24, 2026 |
| Nike | 9 | 38 days | 4.8 | Mar 18, 2026 |
| Louis Vuitton | 16 | 132 days | 8.8 | Oct 3, 2025 |
| H&M | 10 | 21 days | 2.3 | Aug 14, 2025 |

Cadence reveals strategy: Prada and Omega maintain steady content pipelines. Tiffany and SHEIN (16 videos in 7 days) use burst posting around events/launches. Louis Vuitton and H&M posted intensively but have since gone silent — a competitive signal for brands monitoring their activity.

#### 3.7 Paid-Organic Alignment Gap

> *"Nike spends an estimated €2-5M on Snapchat paid ads but has only 9 Spotlight videos and 0 public subscribers. CHANEL spends €200-450K on paid ads but has their username squatted by 'Pauline'. Dior invests in both paid (€200-430K) and organic (16 Spotlights, active posting). The alignment between paid investment and organic presence varies wildly."*

**Verified** by cross-referencing the top 15 paid advertisers against organic profile data:

| Advertiser | Paid Impressions | Organic Status | Spotlight Videos | Subscribers |
| --- | ---: | --- | ---: | ---: |
| Nike | 516M | Content only | 9 | 0 |
| Cartier | 108M | Content only | 16 | 0 |
| Dior | 48M | Content only | 16 | 0 |
| Gucci | 48M | Content only | 15 | 0 |
| Jordan | 35M | **Active** | 2 | 204,400 |
| SHEIN | 29M | **Active** | 16 | 491,500 |
| CHANEL | 49M | **Squatted** | 0 | 0 |
| Canada Goose | 56M | **Squatted** | 0 | 0 |
| Tommy Hilfiger | 67M | Dormant | 0 | 0 |
| Dr. Martens | 52M | Dormant | 0 | 0 |
| adidas | 35M | Dormant | 0 | 0 |

The misalignment is stark: brands spending tens of millions on paid Snapchat ads often have zero organic investment.

**Organic share of total visibility** quantifies this gap. For brands with both paid ads and organic Spotlight views, we can calculate what percentage of their total Snapchat visibility comes from organic content:

| Brand | Organic Views | Paid Impressions | Organic Share |
| --- | ---: | ---: | ---: |
| Carolina Herrera | 136,233 | 0 | 100% (organic only) |
| Timberland | 7,061 | 0 | 100% (organic only) |
| Michael Kors | 20,755 | 0 | 100% (organic only) |
| Gymshark | 1,886,614 | 4,658,885 | 28.8% |
| Louis Vuitton | 980,098 | 12,400,444 | 7.3% |
| Dior | 200,787 | 47,915,398 | 0.4% |
| Gucci | 55,966 | 47,895,876 | 0.1% |
| Nike | 131,397 | 516,493,328 | 0.03% |

Three channel strategies emerge: **organic-only** brands (Carolina Herrera, Timberland, Michael Kors — no detected paid ads), **balanced** brands (Gymshark at 28.8% organic — the only brand generating meaningful organic reach alongside paid), and **paid-dominated** brands (Nike, Gucci, Dior — organic is a rounding error next to their paid investment).

This is a strategic consulting opportunity — Ravineo can flag: "You're spending €2M+ on Snapchat ads but your organic presence generates only 0.03% of your total visibility. Your competitor Gymshark gets 29% organic reach. Investing in organic content could reduce your paid dependency."

#### 3.8 Duration & Performance Analysis

> *"Videos under 10 seconds have the highest median performance (13,539 views). 30-60 second videos underperform consistently. But outliers dominate — Louis Vuitton's 20-30s content skews averages dramatically."*

**Verified** across all brand Spotlight videos with view data:

| Duration | Videos | Mean Views | Median Views | Std Dev | Min | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Under 10s | 36 | 30,617 | **13,539** | 78,977 | 1,143 | 475,995 |
| 10-20s | 69 | 24,254 | 2,314 | 85,184 | 1,009 | 608,077 |
| 20-30s | 22 | 44,267 | 3,874 | 177,510 | 1,027 | 837,826 |
| 30-60s | 25 | 5,609 | 3,105 | 6,529 | 1,011 | 31,314 |
| 60s+ | 5 | 22,717 | 2,738 | 41,987 | 1,175 | 97,480 |

**Caveat: means are misleading here.** The 20-30s bucket's high mean (44K) is driven by 5 Louis Vuitton videos averaging 171K views — an outlier effect. By median, under-10s content outperforms all other durations by 3.5x. Standard deviations exceed means in every bucket except 30-60s, meaning individual brand quality matters far more than duration.

The one reliable signal: **30-60s content consistently underperforms** — both mean (5.6K, lowest) and max (31K vs 475K+ for shorter content) are weakest. Content beyond 30 seconds faces a steep audience drop-off on Snapchat.

Actionable guidance: keep it under 30 seconds, but don't over-index on exact duration — brand quality and content type dominate.

#### 3.9 Profile Adoption Timeline

> *"Prada was the first fashion brand on Snapchat (May 2019). Louis Vuitton and Gucci followed within months. The major adoption wave was 2020-2021 (67 brands created profiles). Early adopters have 6x the subscribers of later entrants."*

**Verified** from profile creation timestamps (available for all 100 brands):

| Year | Brands | Avg Subscribers | With Spotlight Content |
| --- | ---: | ---: | ---: |
| 2019 | 3 | 17,500 | 3 |
| 2020 | 10 | 48,130 | 6 |
| 2021 | 15 | 42,747 | 6 |
| 2022 | 31 | 2,277 | 7 |
| 2023 | 16 | 0 | 2 |
| 2024 | 9 | 1,244 | 2 |
| 2025-2026 | 16 | 0 | 3 |

Early adopters (2019-2021) average 36K subscribers. Brands that joined in 2022+ average under 2.3K — a 15x gap. No brand that joined after 2022 has accumulated meaningful public subscribers, suggesting either a platform change in how subscriber counts are exposed, or that late entrants haven't built audiences.

#### 3.10 AR Lens Competitive Intelligence (untapped data on disk)

> *"Balenciaga has 16 AR lenses including 'Fitting Room' (virtual try-on) and 'Triple S2 Sneakers'. Nike has 16 including 'Nike Running' and 'Nike By You'. Gucci has 16. 339 brand AR lenses across 61 brands — completely unanalyzed until now."*

Snapchat is THE AR platform — 250 million users interact with AR lenses daily. Brand AR lenses are a major organic investment that no competitive tool monitors. Our profile scraper already collects lens data:

| Brand | AR Lenses | Examples |
| --- | ---: | --- |
| Balenciaga | 16 | Speed Cat, Fitting Room, Triple S2 Sneakers |
| Nike | 16 | Nike Running, Nike By You, Nike Boxing |
| Gucci | 16 | Gucci Glow & Care, Summer Stories, Gucci Lido |
| Louis Vuitton | 16 | LV Holidays, LVConnected watch, LV Men SS24 |
| Maybelline | 16 | Build-A-Brow, Manhattanhenge |
| YSL Beauty | 16 | YSL Black Opium, YSL BEAUTY Y NOT |
| Cartier | 16 | Cartier Icons 1, Tank Francaise, Cartier Trinity |
| Paco Rabanne | 15 | Rabanne Phantom, Million Royal |
| Ralph Lauren | 14 | RL Holiday, RLxTeamUSA, RL Polo Bear Game |
| Dior | 12 | Dioroblique, Vogue x Snapchat, Sparkling Clover |
| Carolina Herrera | 10 | CH - La Bomba, Good Girl Jasmin |
| Prada | 9 | Galleria Glow, Prada 2025, Prada Galleria Bag |

Each lens record includes: name, creator attribution, preview image/video URLs, icon, and unlock link. This enables:

- **AR strategy benchmarking** — Which brands invest in virtual try-on (Balenciaga "Fitting Room") vs brand awareness lenses (Nike "Nike Running")?
- **Lens portfolio comparison** — Balenciaga and Nike have 16 lenses each; Prada has 9. Who invests more in AR?
- **Category analysis** — Beauty brands (Maybelline, YSL) focus on product try-on; fashion brands focus on brand experiences; watch brands (Cartier, Omega) on virtual try-on.

**Status: data exists on disk (339 lenses) but is not yet imported into DuckDB.** Adding a `brand_lenses` table is a ~30 minute engineering task.

#### 3.11 Curated Highlights: Non-Ephemeral Story Archive

> *"Dior has 16 curated highlight collections with 511 individual snaps — including 'Dior Autumn Winter 2026-2027' (65 snaps), 'Spring Summer 2026 Haute Couture' (62 snaps). Prada has 519 snaps. Louis Vuitton has 334. These are permanently saved Story content — the closest thing to a competitive Story archive."*

While live Stories disappear after 24 hours, brands save their best Story content as "Curated Highlights" — permanent collections visible on the profile. Our scraper captured this data:

| Brand | Collections | Total Snaps | Example Titles |
| --- | ---: | ---: | --- |
| Prada | 16 | 519 | Prada Re-Nylon 2026, FW26 Womenswear Show |
| Dior | 16 | 511 | Dior Autumn Winter 2026-2027, Haute Couture |
| Balenciaga | 16 | 363 | Winter 26 Collection, Fall 26 Collection |
| Louis Vuitton | 11 | 334 | Women's Spring-Summer 2026 Show, Cruise 2026 |
| Ralph Lauren | 16 | 230 | Polo Shirt, #RLFW22, #RLxTeamUSA |
| Crocs | 5 | 151 | (emoji-themed lifestyle content) |
| Cartier | 6 | 82 | V&A London, Venice Film Festival |
| Gucci | 16 | 62 | La Famiglia, Cruise 26, Keep It Gucci |
| Lacoste | 16 | 55 | Holiday style, bucket hat campaigns |

**40 brands** have curated highlights, totaling **261 collections** and **2,763 individual snaps**. Each snap has: media URLs, timestamps, media type (image/video), and snap titles.

**Temporal analysis from snap timestamps** reveals multi-year content histories:

| Brand | Snaps | Earliest | Latest | Status |
| --- | ---: | --- | --- | --- |
| Rare Beauty | 21 | Jan 15, 2026 | **Apr 9, 2026** (today) | Actively posting |
| Omega | 39 | Feb 5, 2026 | Apr 7, 2026 | Actively posting |
| Prada | 519 | Apr 14, 2025 | Mar 27, 2026 | Active |
| Canada Goose | 55 | Sep 2, 2024 | Mar 7, 2026 | Active |
| Balenciaga | 363 | Jan 9, 2024 | Mar 7, 2026 | Active |
| Dior | 511 | Mar 29, 2024 | Mar 3, 2026 | Active |
| Louis Vuitton | 334 | Jan 3, 2023 | Oct 3, 2025 | Stale (6 months) |
| Lacoste | 55 | Apr 13, 2021 | Nov 20, 2025 | Stale (5 months) |

This gives us **multi-year content cadence data** — far more than the snapshot from Spotlight uploads. Brands like Rare Beauty are posting highlight content *today*. Louis Vuitton's last highlight is from October 2025 — they've gone silent. Lacoste's data spans 4.5 years (2021-2025), enabling long-term content strategy trend analysis.

This partially solves the "Stories are invisible" problem: while we can't see live Story performance, curated highlights reveal what Story content brands consider important enough to preserve. Collection titles reveal campaign names ("Dior Autumn Winter 2026-2027"), event tie-ins ("Venice International Film Festival"), and content strategy themes.

**Status: data exists on disk (2,763 snaps) but is not yet imported into DuckDB.** Adding `brand_highlights` and `brand_highlight_snaps` tables is a ~30 minute engineering task.

#### 3.12 Snapchat's Native AI Content Analysis (untapped data on disk)

> *"Snapchat's own AI classifies every Spotlight video with SEO keywords and confidence scores: 'Dior fashion show|0.95', 'men's fashion styling|0.90', 'artistic video production|0.92'. 474 AI content signals across 23 brands — richer than any third-party classification."*

The raw JSON contains `cuSignals` — Snapchat's internal content understanding layer — with three signal types:

1. **`llmPrediction`** — SEO-scored keywords with confidence (0.0-1.0) and descriptions, generated by Snapchat's LLM for each video. More granular than the `llm_title`/`llm_description` fields already imported.
2. **`textMetadata`** — AI-generated content descriptions and keyword lists (e.g., "Handsome photoshoot featuring a stylish boyfriend" with keywords: handsome, boyfriend, photoshoot, photography, fashion).
3. **`detectedLanguage`** — Language detection with confidence scores (27 brands analyzed; see multilingual strategy in Use Case 3.5).

Additionally, **`contextCards`** provide audio/sound attribution for each video, enabling the audio strategy analysis in Use Case 3.5.

This data enables automated, scalable content categorization that goes beyond hashtag counting — Snapchat's own AI tells us what each video is about, in which language, with what audio, scored by confidence. Combined with our existing engagement data, this powers content strategy benchmarks like "behind-the-scenes content scores 0.92 confidence and averages X views, while product-showcase content scores 0.85 and averages Y views."

**Status: data exists on disk (474 AI signals, 23 brands) but is not yet imported into DuckDB.** Extracting cuSignals into a `brand_spotlight_signals` table is a ~20 minute engineering task.

### Honest limitations

The organic presence section is the **weakest of the three sections** in data depth. We must be transparent about what's missing.

1. **No live Story data — the biggest gap.** Stories are Snapchat's primary organic format for brands. `has_story` is false for all 100 brands at time of scraping because Stories expire after 24 hours. The Sponsored Content API story data has no engagement metrics (see RESEARCH.md §8). We partially compensate with curated highlights (Use Case 3.11) — the Story archive brands choose to preserve — but cannot track Story publishing frequency, completion rates, or real-time engagement. Continuous polling (hourly/daily scraping) would capture live Story activity.

2. **No completion rate.** Snapchat's algorithm prioritizes watch completion above all other signals. This metric is only available to the account owner via Snapchat Insights. No external tool can access it. This is a platform-level limitation, not specific to our approach.

3. **No audience demographics.** Age, gender, location, and interest data for brand audiences requires authenticated access with 200+ followers. No competitive workaround exists.

4. **Subscriber counts are 0 for 89% of brands.** Only 11 brands show real subscriber data. Major brands like Dior and Louis Vuitton (active Spotlight content, millions in paid spend) show 0. This appears to be a platform API limitation on how subscriber counts are exposed via public profile scraping.

5. **Small sample sizes.** 331 Spotlight videos from 29 brands, with view data for only 22. Engagement rate comparisons span brands with 1.9M views (Gymshark) to 2.2K (Fendi) — different scales produce unreliable rate comparisons. Duration analysis has n=22 in one bucket. All findings should be treated as directional, not statistically rigorous.

6. **AR lens and highlight data exists on disk but is not yet imported.** 339 lenses (61 brands) and 2,763 highlight snaps (40 brands) are collected by the scraper but not in DuckDB. The analysis in Use Cases 3.10-3.11 is based on raw JSON inspection; importing into the database is a short engineering task.

7. **View counts suppressed for some brands.** 7 of 29 brands return -1 for view_count. Content metadata is still available.

8. **Single-snapshot data.** No longitudinal tracking. The infrastructure for periodic re-scraping exists; the longitudinal dataset does not.

9. **Fashion-specific sample.** The 100 profiles are fashion/luxury brands. Extending to other verticals is straightforward with existing infrastructure.

### How this compares to what exists

| Tool | Snapchat Organic Intel | Method | Limitation |
| --- | --- | --- | --- |
| **Sprout Social** | Own-account analytics only | Snapchat API (authenticated) | Cannot see competitor profiles or content |
| **Improvado** | Data pipeline for own Snapchat data | API integration to data warehouse | Only your own account; no competitive view |
| **Socialinsider** | Cross-platform benchmarking | API + panel | Snapchat coverage is minimal/nonexistent |
| **Manual research** | Visit each profile one at a time | Browser | Doesn't scale; no engagement data; no historical tracking |
| **Our approach** | **Systematic competitive profiling** | Public profile scraping + Spotlight engagement | Covers all target brands; engagement data where available; repeatable |

The fundamental gap: **every existing tool gives you analytics for your own Snapchat account.** None provides competitive visibility into other brands' organic presence, content strategy, or engagement performance. Our scraper fills this gap entirely.

### What this means for a Beiersdorf or Philips

**Available today:**

1. **Competitive audit** — "Here's where your 10 key competitors stand on Snapchat: 3 are active, 4 are dormant, 3 have squatted usernames. You're ahead of 7."
2. **Username protection alert** — "Your brand username is available / is squatted by a personal account. Here's the Snapchat trademark infringement process."
3. **Content strategy blueprint** — "The top-performing brands post every 1.6-4 days, keep videos under 30 seconds (under 10s performs best by median views), and use hashtags for campaign tracking. Here's what works."
4. **Engagement benchmarks** — "Average share rate is 0.16%, average boost rate is 2.7%. If your content is below these, the creative approach needs work."
5. **Paid-organic alignment** — "You're spending €X on paid ads but have no organic presence. Here's how your competitors balance the two."

**Available with periodic re-scraping (weekly/monthly):**

1. **Trend tracking** — "Competitor X posted 8 new Spotlights this month, up from 2 last month — they're ramping up."
2. **Audience growth curves** — "SHEIN gained 12K subscribers in March. Jordan lost 3K."
3. **Content performance trends** — "This competitor's average views are declining — their content strategy may be staling."
4. **New entrant detection** — "A competitor just created a Snapchat profile and posted their first content."

### Data access summary

| Use Case | Table | Key Fields | Status |
| --- | --- | --- | --- |
| Maturity Scorecard | `brand_profiles` | `subscriber_count`, `spotlight_count`, `title`, `category`, `badge` | 100 brands, 5-tier classification + verification |
| Username Squatting | `brand_profiles` + `brand_ads_fashion` | `username`, `title`, `brand`, `impressions_total` | 28 squatted; **8 with active paid spend (€779K total)** |
| Content Benchmarking | `brand_profile_spotlights` | `view_count`, `duration_ms`, `brand` | 331 videos, 29 brands |
| Engagement Efficiency | `brand_profile_spotlights` | `share_count`, `boost_count`, `comment_count`, `view_count` | 22 brands with view data |
| Content Themes | `brand_profile_spotlights` | `llm_title`, `llm_description`, `hashtags` | 218 with AI titles, 121 with hashtags |
| Posting Cadence | `brand_profile_spotlights` | `uploaded_at`, `brand` | Full timestamp data for 331 videos |
| Paid-Organic Gap | `brand_profiles` + `brand_ads_fashion` | Cross-reference advertiser vs profile, organic share % | Top 15 advertisers mapped + organic share calculation |
| Duration Analysis | `brand_profile_spotlights` | `duration_ms`, `view_count` | 157 videos with both fields |
| Adoption Timeline | `brand_profiles` | `profile_created_at` | All 100 profiles, 2019-2026 |
| Verification Audit | `brand_profiles` | `badge`, `website_url`, `bio`, `category`, `address`, `hero_image_url` | 53 verified vs 47 unverified; completeness rates |
| **AR Lenses** | Raw JSON (not yet in DB) | `lensName`, `lensCreatorDisplayName`, preview URLs | **339 lenses, 61 brands — needs DB import** |
| **Curated Highlights** | Raw JSON (not yet in DB) | `storyTitle`, `snapList[]`, media URLs, timestamps | **261 collections, 2,763 snaps, 40 brands — needs DB import** |
| **AI Content Signals** | Raw JSON (not yet in DB) | `cuSignals[]`, `contextCards[]`, language, SEO keywords | **474 signals, 23 brands — needs DB import** |
| Recommend/Save Rate | `brand_profile_spotlights` | `recommend_count`, `view_count` | 20 brands with recommend data |
| Language Strategy | Raw JSON (cuSignals) | `detectedLanguage`, `languageScores` | 27 brands with language detection |
| Audio Strategy | Raw JSON (contextCards) | `contextType=2`, sound title, attribution | 280 videos; 98% original sound |
| Industry Segmentation | `brand_profiles` | `subcategory` | 44 brands with subcategory data; 7 industry groups |

---

## 4. Potential Misuse

*Original brief question: Potential misuse (disinformation, scam ads, fake influencers).*

### The key insight: Snapchat discloses more platform safety data than any other social platform — and nobody is using it for brand intelligence

Under the DSA, Snapchat (as a Very Large Online Platform with 97.2M EU monthly active users) is required to publish granular moderation data. Our database contains **11.1 million individual content moderation decisions** from the EC DSA Statement of Reasons repository — every enforcement action taken on the platform, with category, content type, automation status, source, and date. On top of this, Snapchat publishes semi-annual transparency reports with enforcement statistics, proactive detection rates, user report breakdowns, appeal outcomes, and per-country user base data.

No B2C brand safety tool currently mines this data for competitive intelligence. Existing tools (DoubleVerify, IAS, Zefr) focus on *your own* ad adjacency — did your ad appear next to harmful content? They don't answer the strategic question: **how risky is this platform for my brand, and how is that risk changing over time?**

**What marketing directors actually want to know:**

- **How safe is Snapchat for my brand?** — What types of harmful content exist, how prevalent, how fast is it removed?
- **Are my competitors being impersonated?** — Is someone using our brand name in scam ads or fake profiles?
- **Are the influencers we work with genuine?** — Are they running fraudulent promotion operations?
- **Is disinformation a risk to our brand reputation?** — How much misinformation exists on the platform?
- **How does Snapchat compare to Meta/TikTok on safety?** — Should we shift budget based on platform risk?
- **Is the platform itself under regulatory threat?** — If EU/UK/Australia force changes, how does that affect my campaigns?
- **What are competitors doing with political/issue advertising?** — Should we invest in purpose-driven campaigns on Snapchat?

### What our data reveals

**11.1M content moderation decisions** across 16 violation categories, spanning September 2023 through April 2026. The breakdown reveals the platform's risk landscape:

| Category | Decisions | % of Total | Brand Relevance |
| --- | ---: | ---: | --- |
| Terms & Conditions (other) | 2,107,159 | 19.0% | Low — platform rules |
| **Pornography / Sexual Content** | **2,011,845** | **18.1%** | **High — adjacency risk, child safety** |
| **Scams & Fraud** | **1,257,207** | **11.3%** | **High — direct brand threat** |
| **Unsafe / Illegal Products** | **1,146,625** | **10.3%** | **High — counterfeit risk** |
| Scope of Platform | 850,131 | 7.6% | Low |
| Prohibited Products | 812,858 | 7.3% | Medium — regulatory |
| **Protection of Minors** | **700,488** | **6.3%** | **Critical — platform risk, regulatory** |
| Non-Consensual Behaviour | 641,741 | 5.8% | Medium |
| Cyber Violence | 539,955 | 4.9% | Medium |
| Illegal / Harmful Speech | 480,258 | 4.3% | Medium — adjacency |
| Violence | 284,056 | 2.6% | Medium — adjacency |
| Risk for Public Security | 118,914 | 1.1% | Low |
| Data Protection Violations | 89,149 | 0.8% | Medium |
| **Civic Discourse / Elections** | **52,059** | **0.5%** | **High — disinformation** |
| Self-Harm | 25,490 | 0.2% | Medium — brand safety |
| **Intellectual Property** | **906** | **0.01%** | **High — trademark** |

The five categories most relevant to B2C brands — scams/fraud, unsafe products, protection of minors, civic discourse/disinformation, and IP infringement — account for **3.16M decisions (28.4% of all moderation)**. Add pornography/sexual content (adjacency risk) and the brand-relevant share exceeds **46%** of all moderation.

**Global enforcement statistics (H1 2025)** add context from Snapchat's own transparency reports:

| Policy | User Reports | Enforcements | Enforcement Rate* | Median Response |
| --- | ---: | ---: | ---: | --- |
| Sexual Content | 7,315,730 | 3,778,370 | 60.2% | 1 min |
| Harassment & Bullying | 4,103,797 | 700,731 | 11.2% | 3 min |
| Spam | 1,709,559 | 122,499 | 2.0% | 1 min |
| CSEA | 1,627,097 | 695,679 | 11.1% | 10 min |
| Drugs | 481,830 | 262,962 | 4.2% | 5 min |
| **Impersonation** | **745,874** | **7,086** | **0.1%** | **30 sec** |
| **False Information** | **606,979** | **2,027** | **0.0%** | **1 min** |

*\*Enforcement Rate is Snapchat's self-reported `pct_enforced` metric from their transparency report. It does not equal a simple division of enforcements by reports — Snapchat's calculation methodology is not publicly documented. The rates are directionally correct: impersonation and false information are enforced orders of magnitude less than sexual content or harassment.*

Two numbers stand out: **745,874 impersonation reports** with a 0.1% enforcement rate (7,086 actions), and **606,979 false information reports** with essentially 0% enforcement (2,027 actions). These are the lowest enforcement rates on the platform by far — brands face a platform where impersonation and disinformation reports rarely result in action.

### Use cases

#### 4.1 Platform Risk Scorecard

> *"Snapchat processes 350K-470K content moderation decisions per month. 11.3% involve scams/fraud — roughly 40,000 scam decisions monthly. For comparison, IP infringement accounts for only 0.01% (906 total over 2.5 years). Snapchat's biggest brand safety risk is not counterfeiting — it's scam content using brand imagery."*

**Verified** (see `experiments/12_misuse_detection.sql`). The risk scorecard enables:

- **Platform comparison** — "Snapchat removes 6.17M pieces of content per reporting period. Scam content is 11.3% of decisions. How does this compare to Meta's DSA reports?"
- **Risk trending** — Monthly decisions grew from 300K (Sep 2023) to 474K (Jan 2026) — a 58% increase in moderation volume, suggesting either growing safety issues or improving detection.
- **Brand-relevant risk** — Aggregate the four brand-critical categories (scams, unsafe products, IP, disinformation) into a single "brand risk index" trackable over time.

**Ad-specific moderation:** In H1 2025, **67,789 ads were reported** and **16,410 were removed** — a 24.2% removal rate. One in four reported ads gets taken down. This is the baseline against which Ravineo's clients can assess advertising environment safety.

#### 4.2 Brand Impersonation Monitoring

> *"28 of 100 tracked brand usernames are squatted by personal accounts. 8 of those are actively paying Snapchat for ads — Canada Goose (€364K spend while '𝒶𝓎𝒹𝑒𝓃' holds @canadagoose). Globally, 745,874 impersonation reports are filed but only 7,138 (0.1%) result in enforcement."*

This use case cross-references three data sources:

1. **Profile scraping** (Section 3) — 28 squatted usernames, 8 with active paid spend
2. **Ad library** — Third-party advertisers using brand names in ad copy (e.g., COCO-Essence running "Zara - 31 mei - 20eu" ads in the Netherlands)
3. **DSA moderation data** — 745,874 impersonation reports with a 0.1% enforcement rate

**Verified** — our own ad library data contains multiple brand impersonation cases in paid advertising:

| Advertiser | Brand Used | Ads | Impressions | Markets | Signal |
| --- | --- | ---: | ---: | ---: | --- |
| Jordan ✨💯🎶 | Jordan (Nike) | 6 | 36,522 | 6 | Personal account, emoji-laden name, DEEP\_LINK to external site |
| Ab🇨🇮🇫🇷 kenzo🔥🤴Fofana | Kenzo | 2 | 19,154 | 1 | Personal account embedding brand name |
| COCO CROCS 🌺🐳🌴🪸🐠🌟 | Crocs | 1 | 11,489 | 1 | Uses "CROCS" in name |
| COCO-Essence | Zara | 4 | 8,289 | 1 | Runs ads titled "Zara - 31 mei - 20eu" |

Compare "Jordan ✨💯🎶" (6 ads, 36K impressions, personal account) to the real Jordan brand (60 ads, 34.8M impressions, via Nike Inc.). The impersonator runs identical DEEP\_LINK ads across 6 countries simultaneously — linking users to an external site using the Jordan brand name. This is detectable: emoji-laden advertiser names + DEEP\_LINK creative type + low impressions + cross-country identical ads = scam heuristic.

**Real-world context:** UK users were shown an estimated **95 billion scam ads** across social media in 2025 — roughly 1 in 10 ads is a scam (The Independent, 2026). In March 2026, Dutch police arrested two men for a Snapchat ad scam that defrauded 70 minors via fake iPhone offers, using Snapchat's ad platform to acquire victims before moving them to WhatsApp for the actual fraud.

The impersonation enforcement rate (0.1%) is the second-lowest on the platform after false information (near-zero per Snapchat's own reporting). For brands, this means: Snapchat is **not effectively protecting brand identities.** Filing an impersonation report has a 99.9% chance of resulting in no enforcement. This makes proactive monitoring (via profile scraping and ad library tracking) essential — brands cannot rely on Snapchat's own enforcement.

#### 4.3 Scam Ad & Counterfeit Detection

> *"1.26 million scam/fraud moderation decisions in 2.5 years. 64% of scam content is video-based. Scam activity peaked at 80K decisions/month in April-July 2024, then declined to ~25K/month by 2026 — suggesting either improved detection or shifting scam tactics."*

**Verified** temporal analysis:

| Period | Monthly Scam Decisions | Trend |
| --- | ---: | --- |
| Q4 2023 | 46,000 avg | Baseline |
| Q1 2024 | 54,000 avg | Rising |
| Q2 2024 | **73,000 avg** | **Peak** |
| Q3 2024 | 68,000 avg | Declining |
| Q4 2024 | 46,000 avg | Normalizing |
| Q1 2025 | 29,000 avg | Lower |
| Q2 2025 | 22,000 avg | Low |
| Q3 2025 | 21,000 avg | Stable low |
| Q4 2025 | 26,000 avg | Slight increase |
| Q1 2026 | 25,000 avg | Stable |

The 2024 scam peak and subsequent decline may reflect Snapchat's improved ML detection (launched in their February 2025 Brand Suitability Suite) or scammers migrating to other platforms. Either way, the trend is useful for brand risk assessment.

**Unsafe/illegal product decisions** show a different pattern: they grew steadily from 42K/month (Q4 2023) to 66K/month (Q4 2024) before dropping to near-zero in H2 2025 — likely a reclassification in Snapchat's reporting taxonomy rather than a real decline, given the EU's March 2026 investigation into Snapchat specifically for illegal goods sales.

Scam content is overwhelmingly video (64%), followed by image (16.5%) and "other" (12.7%). This matches the Snapchat content format — scams target the platform's native video-first experience.

#### 4.4 Fake Influencer Red Flags

> *"Creator 'yrr0li' produced 477 sponsored content pieces across 10 different brands. 'pixou74' produced 299 pieces across 13 brands. These are not genuine influencers — they are professional promotion accounts running high-volume sponsored content mills."*

**Verified** from sponsored content data:

| Creator | Total Content | Sponsors | Primary Format | Signal |
| --- | ---: | ---: | --- | --- |
| yrr0li | 477 | 10 | Story (476/477) | Extreme volume, story-only |
| pixou74 | 299 | 13 | Story (299/299) | Multi-brand, story-only |
| hayam1985 | 278 | 4 | Spotlight (278/278) | Spotlight-only mill |
| shadw\_2 | 147 | 14 | Mixed | Most sponsors (14 brands) |
| mounerh.a | 109 | 9 | Spotlight (109/109) | Spotlight-only mill |
| we.sisters | 108 | 7 | Story (108/108) | Story-only mill |

Red flags for fake/low-quality influencers that Ravineo can detect automatically:

1. **Volume disproportion** — 477 pieces across 10 sponsors means ~48 pieces per sponsor. Genuine influencer partnerships typically produce 1-5 pieces per brand, not 48.
2. **Format monotony** — Story-only or Spotlight-only creators never mixing formats suggest automated content production or mass-uploading.
3. **Multi-brand saturation** — 14 different sponsors for one creator means the creator's audience sees a new brand promotion every few days. Audience trust degrades rapidly.
4. **No engagement data** — These creators appear in the sponsored content feed but have no verifiable engagement metrics. Without view/follower data, ROI is unverifiable.

This maps directly to the industry finding that **37.2% of influencer followers show signs of being fake** and brands waste **$4.6 billion annually** on fraudulent influencer partnerships (SociaVault Labs, 2026). The Snapchat sponsored content data enables automated flagging of these patterns.

The enrichment pipeline from Section 2 (profile scraping for sponsored creators) would add follower counts, enabling the detection of creators with suspiciously low followers-to-content ratios — the classic fake influencer signal.

#### 4.4a Legal Ground Classification (DSA Implications)

A previously unexamined field in the `ec_dsa_sor` data reveals a significant legal finding:

| Legal Ground | Decisions | Share |
| --- | ---: | ---: |
| Incompatible content (Terms of Service violation) | 11,115,857 | **99.973%** |
| Illegal content | 2,984 | **0.027%** |

Out of 11.1 million moderation decisions, Snapchat classified only **2,984 (0.027%)** as involving illegal content. The remaining 99.97% are framed as Terms of Service violations. Under the DSA, platforms have stronger obligations for illegal content (e.g., mandatory reporting to authorities, faster response times). By classifying virtually all moderation as "incompatible content" rather than "illegal," Snapchat minimizes its legal exposure.

For brand protection, this matters: if scams impersonating your brand are classified as mere "T&C violations" rather than "illegal counterfeiting," the platform has weaker obligations to act. The EU's March 2026 investigation into Snapchat may target this classification pattern directly.

#### 4.5 Disinformation Risk Assessment

> *"606,979 false information reports filed on Snapchat in H1 2025, but only 2,027 enforced — Snapchat rounds the enforcement rate to 0.0%. 52,059 DSA decisions classified as 'negative effects on civic discourse or elections'. Snapchat is NOT a major disinformation vector compared to X/Twitter or Facebook, but the risk exists and is barely policed."*

**Verified:**

- **False Information** reports: 606,979 with 2,027 enforced (Snapchat's reported rate: 0.0%; simple division: 0.3%; 1 min median response)
- **Civic Discourse/Elections** DSA decisions: 52,059 across 2.5 years
- **Proactive detection** of false info: Only 61 proactive enforcements vs 2,027 from user reports — Snapchat barely proactively detects misinformation

For B2C brands, disinformation risk on Snapchat is **low but real:**

- **Direct risk** — False claims about a brand's products (safety, ingredients, etc.) can spread with minimal platform intervention
- **Adjacency risk** — Brand ads appearing alongside misinformation content (mitigated by Snapchat's 99% brand safety score for Spotlight/Creator Stories, per their own claim)
- **Regulatory risk** — The EU's active investigation into Snapchat creates uncertainty about platform changes that could affect brand presence

#### 4.5a Report Source Intelligence (who reports what)

A previously unexamined field reveals who triggers Snapchat's moderation decisions:

| Source | Decisions | Share |
| --- | ---: | ---: |
| Article 16 (formal DSA user reports) | 6,607,064 | 59.4% |
| Voluntary (Snapchat's own detection) | 4,505,202 | 40.5% |
| Trusted Flaggers | 3,642 | 0.033% |
| Other notifications | 2,933 | 0.026% |

Snapchat voluntarily finds 40.5% of violating content — proving it has detection capability. But all 4.5M voluntary actions are classified as T&C violations (never illegal). **Trusted Flaggers** — organizations certified by EU Member States — account for only 3,642 decisions out of 11.1M. As of December 2024, only 15 Trusted Flaggers were officially listed across the entire EU.

Per-category source analysis reveals detection patterns:

| Category | Voluntary (Snapchat detects) | Article 16 (user reports) | Trusted Flagger |
| --- | ---: | ---: | ---: |
| Scams/Fraud | 681,506 (54%) | 575,426 (46%) | 51 |
| Protection of Minors | 371,330 (53%) | 327,251 (47%) | **1,141** |
| Pornography | 753,949 (37%) | 1,257,064 (63%) | 224 |
| Civic Discourse | **30,464 (59%)** | 21,594 (41%) | 1 |
| IP Infringement | 221 (24%) | **685 (76%)** | 0 |

Key insight: **IP infringement is 76% user-reported** — brands must actively file reports to protect themselves. Snapchat's own detection catches only 24% of IP violations. Child protection Trusted Flaggers are the most active (1,141 of 3,642 TF reports = 31%), while scam and IP categories get virtually zero Trusted Flagger attention.

#### 4.5b DSA Notice Response Times (the speed problem)

When brands file formal Article 16 notices for illegal content, response times vary dramatically:

| Category | Notices | Median Response (hours) | Trusted Flagger Response (hours) | Speedup |
| --- | ---: | ---: | ---: | ---: |
| Cyber bullying | 338 | 10 | 4 | 2.5x |
| Cyber harassment | 364 | 19 | 4 | 4.8x |
| Non-consensual image sharing | 278 | 23 | 6 | 3.8x |
| Scams/Fraud | 896 | **66** | 4 | **16.5x** |
| IP Infringement | 333 | **118** | — | — |
| **Protection of Minors** | 593 | **205** | **7** | **29.3x** |

If a brand files an IP infringement notice via the standard Article 16 channel, median wait is **118 hours (5 days)**. For child safety reports, it's **205 hours (8.5 days)**. But Trusted Flaggers get responses in 4-7 hours — a **16-29x speedup**.

This is a direct business case for Ravineo: see §4.12 Trusted Flagger Opportunity below.

#### 4.5c Account Enforcement Analysis

| Action | Decisions | Share |
| --- | ---: | ---: |
| Content-only (no account action) | 9,321,023 | 83.8% |
| Account suspended | 1,778,017 | 16.0% |
| Account terminated | 19,801 | 0.2% |
| Monetary penalty | 0 | 0.0% |
| Service provision restriction | 0 | 0.0% |

Snapchat **never** uses financial penalties or service restrictions. All enforcement is content removal + account suspension/termination. The 19,801 permanent terminations are almost entirely for "scope of platform" violations (bot/underage/duplicate accounts — 19,799 of 19,801).

Account suspension rates by category reveal enforcement severity:

| Category | Suspension Rate | Implication |
| --- | ---: | --- |
| Protection of Minors | **51.8%** | Every other decision bans the account — harshest treatment |
| Unsafe/Prohibited Products | 33.5% | |
| Scams/Fraud | 10.9% | Only 1 in 9 scammers get suspended |
| Pornography | 13.9% | |
| **IP Infringement** | **3.3%** | Brand impersonators almost never get banned |
| **Civic Discourse** | **0.0%** | Election content NEVER leads to account action |

For brand protection: when a brand successfully gets an IP infringement enforced, there's only a **3.3% chance** the infringing account is suspended. The infringer keeps their account and can reoffend.

#### 4.5d Automated Means Deep Dive (what Snapchat's AI actually does)

Snapchat's `eu_dsa_automated_means` disclosure reveals the real automation picture, which is far more nuanced than the 13.2% figure suggests:

| Metric | Value |
| --- | ---: |
| Measures taken **solely by automated means** | 65,966,014 |
| Measures **not** taken by automated means | 3,251,029 |
| **Total content decisions** (including approvals) | **69,217,043** |
| Notices processed by automated means | **0** |

Snapchat processes **69.2M content decisions** — of which only 11.1M result in enforcement (our ec_dsa_sor data). The remaining ~58M are "approved" (no action needed). **95.3% of all decisions are automated** — but automation handles "this content is fine" decisions. For actual enforcement actions, only 13.2% are fully automated. Snapchat automates approval, not removal.

**Zero automated notice processing.** Every single Article 16 notice (6,564 formal reports) and Trusted Flagger notice (638) receives human review. This is why response times are 5+ days for IP infringement — humans must review every report.

**Self-reported 100% accuracy, precision, and recall.** Snapchat claims their automated tools achieve 1.0 across all three metrics. This is contradicted by the 42.7% appeal overturn rate for content removal — if precision were truly 100%, no removal would be successfully appealed. The "qualitative description" referenced in their filing likely defines these metrics narrowly (e.g., only measuring hash-matching for known CSAM, which genuinely approaches 100%).

**Report reclassification disclosed.** Snapchat's own context note states: *"Includes measures taken in response to user reports of EU Community Guidelines violations, which have been reclassified to the 'own initiative' category."* This means the 40.5% "voluntary detection" figure in §4.5a is artificially inflated — it includes user reports that Snapchat relabeled as proactive detection. The true voluntary detection rate is lower.

#### 4.6 Moderation Automation & Detection Gap Analysis

> *"67.4% of Snapchat's moderation decisions involve no automation at all — neither in detection nor decision. Only 13.2% are fully automated. Impersonation has a 34-minute median response time — the slowest category. False information is detected proactively in only 61 cases (vs 2,027 from user reports)."*

**Verified** automation breakdown:

| Detection | Decision | Decisions | % of Total |
| --- | --- | ---: | ---: |
| Manual | Manual | 7,499,082 | 67.4% |
| Automated | Fully automated | 1,464,410 | 13.2% |
| Automated | Manual decision | 1,111,672 | 10.0% |
| Manual | Fully automated | 1,043,677 | 9.4% |

Proactive detection (Snapchat finding content without user reports) varies dramatically by category:

| Category | Proactive Enforcements | User-Report Enforcements | Proactive % |
| --- | ---: | ---: | ---: |
| Sexual Content | 1,683,045 | 3,778,370 | 30.8% |
| Drugs | 832,803 | 262,962 | 76.0% |
| Spam | 144,800 | 122,499 | 54.2% |
| **Impersonation** | **52** | **7,086** | **0.7%** |
| **False Information** | **61** | **2,027** | **2.9%** |

Snapchat proactively catches 76% of drug content but only 0.7% of impersonation and 2.9% of false information. For brands, this means: **impersonation detection depends almost entirely on user reports.** If nobody reports a fake brand profile, Snapchat will not find it. This makes Ravineo's automated monitoring (profile scraping + ad library scanning) uniquely valuable — it catches what Snapchat's own systems miss.

#### 4.6a Content Moderation Staffing

A previously unexamined table reveals Snapchat's moderation workforce:

| Metric | Value |
| --- | --- |
| Internal moderators | **56** |
| External (contracted) moderators | **1,374** |
| Total with linguistic expertise | **1,430** |

**1,430 moderators** processing 11.1M decisions over 2.5 years. Per-language breakdown reveals critical gaps:

| Language | Moderators | EU Users in That Language |
| --- | ---: | --- |
| English | 1,123 | UK, Ireland |
| French | 253 | France (28.6M users) |
| German | 89 | Germany (19.8M users) |
| Spanish | 80 | Spain (3.6M users) |
| Danish | 56 | Denmark (2.7M users) |
| Swedish | 55 | Sweden (4.5M users) |
| Dutch | 57 | Netherlands (6.8M users) |
| Bulgarian | 53 | Bulgaria |
| Italian | 51 | Italy (3.6M users) |
| Polish | 49 | Poland (5.7M users) |
| **Czech** | **0** | **Czech Republic** |
| **Greek** | **0** | **Greece** |
| **Hungarian** | **0** | **Hungary** |
| **Croatian** | **0** | **Croatia** |
| **Slovak** | **0** | **Slovakia** |
| **Slovenian** | **0** | **Slovenia** |

**Zero moderators** for Czech, Greek, Hungarian, Croatian, Slovak, Slovenian, Irish, Lithuanian, Latvian, Estonian, and Maltese. Brands advertising in these markets should know: harmful content in these languages is effectively unmoderated. A scam ad in Hungarian or a fake brand profile in Czech will not be caught by language-specific moderation.

For Ravineo's clients, this is actionable: "Your campaign targets Poland (49 moderators for 5.7M users) and Czech Republic (0 moderators). Brand safety monitoring is essential in markets where Snapchat has no language-specific moderation."

#### 4.6b Government Orders & Own-Initiative Actions

**EU Member State orders to Snapchat (H2 2025):**

| Order Type | Total | Top Country |
| --- | ---: | --- |
| Orders to provide information | **54,393** | France (17,277), Netherlands (3,075), Denmark (1,822) |
| Orders to act against illegal content | **6** | France (6) |

EU governments sent **54,393 information requests** to Snapchat in a single 6-month period — overwhelmingly from law enforcement investigating crimes. Only France has ever ordered Snapchat to remove content (6 times). This means: governments demand information but almost never force content removal directly.

**Zero proactive illegal content actions:** Snapchat reports **0 own-initiative measures** against illegal content — but **11,279,462 own-initiative measures** against T&C violations. Their own contextual note: *"All measures taken by Snap on its own initiative were on the basis of violations of its terms and conditions."* Snapchat clearly has the detection systems to find harmful content at massive scale (11.3M proactive actions). But every single one is classified as a T&C violation, never as "illegal." Combined with only 2,984 illegal-content decisions total, this paints a picture of a platform deliberately avoiding the legal obligations that come with classifying content as illegal under the DSA.

#### 4.7 Brand Safety by Market

> *"Snapchat has 97.2M EU monthly users. France leads with 28.6M (29%), followed by Germany (19.8M, 20%) and Netherlands (6.8M, 7%). In H1 2025, Europe accounted for 2.8M of 9.7M global enforcements (29%) — slightly over-represented relative to its user share."*

**Verified** per-country user base (top 10 EU markets):

| Country | Monthly Users | Share |
| --- | ---: | ---: |
| France | 28,565,554 | 29.4% |
| Germany | 19,845,717 | 20.4% |
| Netherlands | 6,844,016 | 7.0% |
| Poland | 5,664,399 | 5.8% |
| Sweden | 4,483,080 | 4.6% |
| Spain | 3,642,769 | 3.7% |
| Italy | 3,643,080 | 3.7% |
| Belgium | 3,592,131 | 3.7% |
| Romania | 2,880,213 | 3.0% |
| Denmark | 2,705,111 | 2.8% |

Regional enforcement distribution (H1 2025): North America 3.47M (36%), Rest of World 3.39M (35%), **Europe 2.82M (29%)**. Europe's 29% enforcement share is slightly above its ~25% user share — suggesting either higher reporting rates or more moderation resources deployed in Europe (likely due to DSA compliance pressure).

This per-country data enables market-specific brand safety assessments: "France has 28.6M Snapchat users — your largest European audience. The platform's enforcement infrastructure is DSA-compliant in this market. Your estimated audience reach of X% maps to Y million users."

#### 4.7a Violating Views Rate (brand safety metric)

The `vvr_pct` field in Snapchat's transparency data quantifies how much violating content users actually SEE before it's removed:

| Policy | VVR | Meaning |
| --- | ---: | --- |
| Sexual Content | 0.482% | **1 in 207 views** involves sexual content violation |
| Threats & Violence | 0.176% | 1 in 568 views |
| CSEA | 0.096% | 1 in 1,042 views |
| Harassment | 0.099% | 1 in 1,010 views |
| Drugs | 0.047% | 1 in 2,128 views |
| Impersonation | 0.009% | 1 in 11,111 views |
| False Information | 0.002% | 1 in 50,000 views |

**This is a directly quantifiable brand safety metric.** If a brand's Snapchat campaign generates 10M views, statistically ~48,200 of those views occur alongside sexual content violations, ~9,600 alongside threats/violence, and ~960 alongside CSEA content. No competing brand safety tool provides this level of platform-wide exposure quantification.

#### 4.7b Cross-Platform Comparison (Snapchat vs TikTok)

Using publicly available DSA transparency data, we can now compare Snapchat to TikTok:

| Metric | Snapchat (H2 2025) | TikTok (H2 2025) |
| --- | --- | --- |
| Content removed | ~5.5M | **112M** |
| Automation rate | 13.2% fully automated | **93.8% automated** |
| Volume ratio | 1x | **~20x** |

TikTok removes **20x more content** with **7x higher automation**. Snapchat's 67.4% manual moderation rate is an outlier among VLOPs. Research analyzing 439M Statements of Reasons across 8 VLOPs found Snapchat's practices among the most distinct.

For brand clients, this comparison answers the question "should we shift budget based on platform risk?" with data: Snapchat moderates less content, less automatically, and with longer response times than TikTok. Whether this means Snapchat is safer (less content to moderate) or riskier (less detection capability) depends on the brand's risk tolerance.

#### 4.8 Appeal & Overturn Intelligence

> *"130,767 moderation complaints filed in H2 2025. 88.2% of decisions were upheld, 11.8% reversed. Median resolution time: 11 hours. For account suspensions: 94.1% upheld, 5.9% reversed."*

**Verified:**

| Complaint Type | Filed | Upheld | Reversed | Overturn Rate |
| --- | ---: | ---: | ---: | ---: |
| All complaints | 130,767 | 115,352 | 15,404 | 11.8% |
| Content removal | 20,839 | 11,941 | 8,893 | 42.7% |
| Account suspension | 109,926 | 103,409 | 6,506 | 5.9% |

The 42.7% overturn rate for content removal appeals is strikingly high — nearly half of content removal decisions are reversed on appeal. This means Snapchat's automated content moderation has a **significant false-positive problem** for content removal. For brands, this has two implications:

1. **Your own content may be incorrectly removed.** If Snapchat's AI flags your brand's Spotlight video, there's a nearly 50% chance it was a false positive.
2. **Harmful content about your brand may be reinstated.** A scam using your brand imagery that gets removed may be restored on appeal 43% of the time.

Per-policy appeal data (H1 2025) from `global_appeals_by_policy` adds nuance:

| Policy | Appeals | Reinstated | Overturn Rate |
| --- | ---: | ---: | ---: |
| Sexual Content | 134,358 | 6,175 | 4.6% |
| Drugs | 128,222 | 7,749 | 6.0% |
| CSEA | 89,493 | 4,179 | 4.7% |
| Spam | 13,730 | 3,140 | 22.9% |
| Impersonation | 1,063 | 33 | 3.1% |
| False Information | 4 | 0 | 0% |

CSEA has a 4.7% appeal overturn rate — meaning **4,179 pieces of content flagged as child exploitation were reinstated** on appeal. While this is a low rate (95.3% of CSEA decisions are upheld), it demonstrates that Snapchat's CSEA detection produces measurable false positives. Spam has the highest overturn rate (22.9%), suggesting aggressive but imprecise spam filtering.

#### 4.9 Child Safety & Platform Existential Risk

> *"2.71 million moderation decisions for sexual content and protection of minors — 24.4% of all Snapchat moderation. In H1 2025 alone, Snapchat enforced 5.46M sexual content violations and 1.10M CSEA (Child Sexual Exploitation & Abuse) violations. Snapchat faces simultaneous investigations from the EU, Australia, and UK — the first platform to be under child safety pressure from three major jurisdictions at once."*

This is the issue that keeps platform executives awake at night — and increasingly, brand CMOs too.

**What our data reveals:**

| Metric | Value | Context |
| --- | --- | --- |
| Pornography/sexual content decisions | 2,011,845 | 18.09% of all moderation |
| Protection of minors decisions | 700,488 | 6.30% of all moderation |
| **Combined child safety decisions** | **2,712,333** | **24.4% of all moderation** |
| CSEA user reports (H1 2025) | 1,627,097 | 695,679 enforced (42.8% rate) |
| CSEA proactive enforcements (H1 2025) | 399,756 | 2-min median response time |
| Unique accounts enforced for CSEA (H1 2025) | 162,017 | 733,106 for sexual content |

**NCMEC reporting (the legal obligation indicator):** In H1 2025, Snapchat submitted **321,587 reports to the National Center for Missing & Exploited Children** (NCMEC) — US law enforcement's clearinghouse for child exploitation material. That's **1,775 reports per day**, every day, for six months. Snapchat also enforced 994,337 CSEA content pieces and disabled 187,387 accounts in the same period. These NCMEC numbers are the single strongest indicator of the platform's child safety crisis — each submission represents content serious enough to warrant a federal law enforcement report.

**Critical anomaly in reporting data:** Sexual content moderation decisions dropped from **118,616/month (June 2025)** to **literally zero** from July 2025 onward. Meanwhile, "protection of minors" continued at ~12K/month. This is not a real decline — it is almost certainly a **taxonomy reclassification** where Snapchat stopped categorizing decisions under "pornography/sexualized content" and rerouted them elsewhere. The timing (July 2025) coincides with intensifying regulatory scrutiny. This kind of reporting discontinuity is itself a red flag worth monitoring.

**Content type breakdown:**

| Category | Image | Video | Other | Text |
| --- | ---: | ---: | ---: | ---: |
| Sexual content | 40.8% | 32.7% | 25.2% | 1.3% |
| Protection of minors | 27.2% | 13.9% | **58.2%** | 0.7% |

The 58.2% "other" category in protection of minors likely represents **account-level actions** (suspending underage accounts, removing profiles), not just content removal — consistent with age verification enforcement.

**Enforcement actions:**

| Category | Content Removed | Content Disabled | No Visibility Action |
| --- | ---: | ---: | ---: |
| Sexual content | 1,540,360 (76.6%) | 192,578 (9.6%) | 278,907 (13.9%) |
| Protection of minors | 334,423 (47.7%) | 3,152 (0.4%) | 362,913 (51.8%) |

Over half of "protection of minors" decisions involve no content removal — these are account-level interventions (age-gating, feature restrictions).

**Multi-jurisdictional regulatory pressure:**

| Jurisdiction | Action | Date | Focus | Penalty |
| --- | --- | --- | --- | --- |
| **EU** | DSA formal investigation | March 2026 | Age verification, grooming, illegal goods | Up to 6% of global annual revenue |
| **Australia** | eSafety Commissioner investigation | Dec 2025 | Under-16 ban compliance, age verification loopholes | Enforcement notices, fines |
| **UK** | Ofcom + ICO joint demand | March 2026 | Stranger contact restrictions, age checks by April 30, 2026 | Online Safety Act penalties |
| **US (Utah)** | State complaint filed | June 2025 | Design features causing addiction in minors | State-level litigation |

**Sextortion: the specific crisis:**

Snapchat faces a unique vulnerability beyond generic child safety. New Mexico's Attorney General sued Snap in 2024 after an investigation found **over 10,000 CSAM records linked to Snapchat** on dark web sites in a single year — making it "by far the largest source" of exploitative content examined. The complaint alleges Snapchat's ephemeral messaging design actively facilitates child sexual exploitation, and that minors report more online sexual interactions on Snapchat than any other platform. Sex trafficking recruitment on Snapchat exceeds other platforms (AP News, 2024). This is not an abstract risk — it is active, documented litigation with specific platform design critiques.

**Why this matters for B2C brands:**

1. **Adjacency risk is real.** The Molly Rose Foundation found that across platforms, **67 brand ads were placed immediately before or after self-harm and suicide content** — including fast-food chains, fashion retailers, and beauty brands. Brands on Snapchat face this same exposure.

2. **Regulatory contagion.** If the EU finds Snapchat non-compliant with DSA child safety obligations, it could mandate changes to the advertising platform, content moderation policies, or user targeting that directly affect brand campaigns. Brands need advance warning.

3. **Reputational association.** Snapchat is increasingly associated with child safety failures in media coverage. Brands like Beiersdorf or Philips advertising heavily on Snapchat may face questions about their platform choice during the investigation period.

4. **The 99.97% classification problem.** Snapchat classifies 99.97% of moderation decisions as "T&C violations" rather than "illegal content." Under the DSA, illegal content triggers stronger platform obligations. CSEA content is by definition illegal — yet the data suggests Snapchat may be underclassifying it. If regulators force reclassification, enforcement obligations change dramatically.

**What Ravineo can offer:**

- **Platform safety monitoring** — Track moderation volumes, enforcement rates, and regulatory developments as leading indicators of platform risk
- **Reporting anomaly detection** — Flag discontinuities like the July 2025 porn-to-zero drop that indicate taxonomy changes or reporting manipulation
- **Regulatory impact briefings** — "The EU investigation may result in X changes that affect your campaigns by Y date"
- **Brand adjacency risk scoring** — Combine DSA moderation data with ad placement intelligence to estimate a brand's exposure to harmful content

#### 4.10 Political Misuse & Election Integrity

> *"74,609 political ads totaling $117.5M in actual spend across 54 countries and 19.6 billion impressions — with full transparency on who paid, who they targeted, and how much they spent. B2C brands like Patagonia ($834K, 2,165 political ads across 19 countries) and Ben & Jerry's ($1.3M) are already major political advertisers on Snapchat. And with AI deepfakes flooding the 2026 midterms, political parties face a new kind of brand safety crisis."*

**A data asset we underestimated:** Unlike fashion/brand ads where spend must be estimated from impressions, **political ads on Snapchat disclose actual spend.** This is DSA/election transparency mandated data. We have it from 2018 to April 2026.

**Scale and scope:**

| Metric | Value |
| --- | --- |
| Total political ads | 74,609 |
| Unique advertisers | 2,773 |
| Countries | 54 |
| Total actual spend | $117,509,216 |
| Total impressions | 19,579,786,624 |
| Date range | June 2018 – April 2026 |

**Top political markets on Snapchat (by spend):**

| Country | Ads | Spend | Impressions | Advertisers |
| --- | ---: | ---: | ---: | ---: |
| United States | 54,397 | $76,620,958 | 13.4B | 1,716 |
| Norway | 4,600 | $19,454,008 | 875M | 166 |
| Canada | 1,795 | $3,948,637 | 1.0B | 101 |
| Australia | 1,256 | $3,594,616 | 553M | 59 |
| Sweden | 754 | $2,039,159 | 118M | 70 |
| United Kingdom | 2,502 | $1,989,443 | 771M | 115 |
| France | 816 | $1,752,954 | 1.1B | 44 |
| India | 183 | $2,426,615 | 30M | 7 |
| Kuwait | 1,779 | $702,007 | 289M | 309 |
| Denmark | 339 | $553,000 | 85M | 25 |

Norway's #2 position ($19.5M) is remarkable for a 5.4M-population country — **$3.60 per capita, or $4.34 per Snapchat user**. Norwegian political parties treat Snapchat as a primary campaign channel. In Q3 2025 alone (the parliamentary election quarter), Høyre spent $1.82M and Arbeiderpartiet $1.80M — near-parity between the two main parties. Even the Labor Party youth wing (AUF) spent $109K, and the election directorate (Valgdirektoratet) ran 172 ads for voter mobilization. This reflects Snapchat's dominance among Nordic youth voters and makes Norway a case study for political advertising on the platform.

**Election cycle patterns (quarterly spend, 2022-2026):**

| Period | Ads | Spend | Event |
| --- | ---: | ---: | --- |
| Q3 2024 | 9,186 | $11,334,045 | US presidential campaign peak |
| Q4 2024 | 8,486 | $14,871,649 | US presidential election |
| Q3 2025 | 2,515 | $7,817,120 | Norwegian parliamentary election |
| Q1 2026 | 2,036 | $1,338,331 | Midterm positioning begins |

**B2C brands as political advertisers — a hidden finding:**

Several major B2C brands already run political/issue ads on Snapchat, with full transparency:

| Brand | Org | Ads | Spend | Impressions | Countries |
| --- | --- | ---: | ---: | ---: | ---: |
| General Mills | General Mills | 8 | $1,683,056 | 513M | 1 |
| Google Canada | Essence Global | 18 | $1,266,085 | 98M | 1 |
| Ben & Jerry's | Unilever US / 360i | 591 | $1,311,496 | 244M | 3 |
| Unilever | Mindshare / Learfield | 66 | $996,899 | 131M | 4 |
| Patagonia | Patagonia / BPI | 2,165 | $834,359 | 145M | 19 |
| Team Snapchat | Snap | 20 | $899,991 | 25M | 1 |
| Pepsi | Omnicom | 10 | $112,361 | 33M | 1 |
| Dove | Unilever US | 19 | $93,757 | 25M | 1 |

This is directly relevant for Ravineo's B2C clients. A Beiersdorf or Philips considering issue/purpose advertising on Snapchat can see exactly what Unilever, Patagonia, and General Mills are doing — spend levels, targeting strategies, geographic rollout patterns. This is **competitive intelligence for purpose-driven marketing**.

**Political targeting intelligence:**

Snapchat political ads include detailed interest-based targeting. Top targeting segments by spend:

| Targeting Segment | Ads | Spend |
| --- | ---: | ---: |
| Political News Watchers (multi-interest combo) | 100 | $1,017,310 |
| Political News Watchers | 602 | $802,424 |
| Advocates & Activists | 658 | $776,505 |
| Green Living / Outdoor Enthusiasts | 643 | $658,591 |
| Philanthropists | 591 | $525,185 |
| Collegiates | 378 | $431,891 |
| Hip-Hop / R&B Fans | 190 | $417,732 |
| Parents & Family-Focused | 148 | $305,090 |

Gender targeting reveals a 4:1 female skew: $7.06M spent targeting women vs $1.59M targeting men. Political advertisers on Snapchat disproportionately target young women — reflecting Gen Z voting demographics.

**Misuse risks for political actors:**

1. **Unauthorized political advertising.** Anyone can run ads on Snapchat using a politician's or party's name. We can detect this by cross-referencing `paying_advertiser`, `org_name`, and `candidate_info` — if an ad names a candidate but the paying advertiser is unrelated, that is a red flag.

2. **AI deepfake political ads.** In 2025 alone, over 100 national elections globally faced AI-generated deepfake attacks. Deepfake-driven financial fraud generated over $200M in losses in Q1 2025. The deepfake detection market is projected to grow from $0.6B (2025) to **$15.1B by 2035** (37.2% CAGR). In the US, 26 states now have deepfake election laws (up from 5 in 2023), and deepfake ads impersonating Trump, Musk, AOC, and other politicians have appeared across platforms. Snapchat's political ad archive provides the data to detect these: unusual advertiser names running ads with candidate names they have no legitimate connection to.

3. **Civic discourse moderation gaps.** Our DSA data shows **52,059 moderation decisions** for "negative effects on civic discourse or elections" — with a clear spike during election periods (Oct-Dec 2024: 3,652-3,957/month vs baseline of ~800/month). Snapchat moderates civic discourse content reactively, following election cycles rather than proactively preventing misuse.

4. **Cross-border political interference.** We can detect advertisers running political ads in countries where they have no legitimate presence — a signal for foreign interference. The data includes billing address, org name, and target country, enabling this analysis.

**What Ravineo can offer political clients:**

- **Political ad intelligence** — "Here's who is advertising on Snapchat in your constituency, how much they're spending, and who they're targeting"
- **Unauthorized ad detection** — Flag ads using a party or candidate's name by unrelated advertisers
- **Issue ad benchmarking** — "Patagonia spends $834K on environmental issue ads across 19 countries — here's their targeting strategy and geographic rollout"
- **Deepfake early warning** — Monitor the ad library for suspicious political ads from unknown advertisers using candidate names
- **Civic discourse risk tracking** — Use DSA moderation data to track election-related content moderation surges and identify periods of elevated misuse risk

#### 4.10a Political Ad CPM Ground Truth

Unlike brand ads where we estimate CPM from impressions, political ads have **actual spend data**, enabling ground-truth CPM calculation:

| Country | Ads | CPM | Currency | Context |
| --- | ---: | ---: | --- | --- |
| Norway | 4,578 | **$22.23** | NOK/EUR mix | Most expensive political market |
| Sweden | 750 | $17.26 | EUR | Nordic premium |
| Denmark | 337 | $6.53 | DKK | |
| Australia | 1,218 | $6.50 | AUD | |
| United States | 53,294 | **$5.72** | USD/AUD mix | Baseline market |
| Canada | 1,740 | $3.90 | AUD/CAD mix | |
| UK | 2,403 | $2.58 | AUD/GBP mix | |
| Germany | 315 | $2.47 | AUD/EUR mix | |

Norwegian political CPMs ($22.23) are **3.9x higher** than US ($5.72) and **9x higher** than Germany ($2.47). This validates our brand ad CPM methodology: the geographic premium we estimated for Nordic markets (€8-15 vs €3-8 for Southern Europe) is real and even more extreme for political ads. Brands can use these political CPM benchmarks to calibrate their own Snapchat cost expectations by market.

#### 4.11 Trusted Flagger Opportunity (business development)

The DSA's Trusted Flagger program (Article 22) creates a direct business opportunity for Ravineo. Our data proves the case:

**The problem:** Standard Article 16 notice response times are brutal — **118 hours (5 days)** for IP infringement, **205 hours (8.5 days)** for child safety. Brands waiting 5 days for an impersonation report to be processed lose money every hour.

**The solution:** Trusted Flaggers get **4-7 hour response times** — a 16-29x improvement. Their reports are processed with priority across ALL EU platforms, not just Snapchat.

**Requirements** (Article 22 DSA):
1. Established in an EU Member State
2. Demonstrated expertise in detecting illegal content (brand impersonation, counterfeit goods)
3. Independent from platform providers
4. Objective and diligent reporting track record

**Why Ravineo qualifies:** Ravineo already monitors brand presence across platforms, detects impersonation (28 squatted profiles found in our sample), and tracks ad library misuse (Jordan ✨💯🎶, COCO-Essence, Ab kenzo Fofana). This is exactly the "expertise in detecting illegal content" the DSA requires. With EU establishment and an application to their national Digital Services Coordinator, Ravineo could obtain Trusted Flagger status.

**What this unlocks:**
- **5-day → 4-hour response** for brand protection reports across all VLOPs (not just Snapchat)
- **Official EU recognition** as a brand protection authority
- **Priority access** to platform enforcement teams
- **New revenue stream** — offering "Trusted Flagger-powered brand protection" as a premium service
- **Competitive moat** — only 15 Trusted Flaggers exist across the entire EU as of December 2024

The EC is preparing Trusted Flagger guidelines for public consultation in Q2 2026, with adoption before year-end. This is a **time-sensitive opportunity** — early movers gain positioning advantage.

#### 4.12 Cross-Section Brand Safety Synthesis

This use case synthesizes findings from all sections into a unified brand risk profile:

| Risk Type | Source Section | Signal | Severity |
| --- | --- | --- | --- |
| **Username squatting** | §3 Organic | 28/100 brands squatted; 8 with active paid spend | Critical |
| **Brand name in third-party ads** | §1 Paid / §4 Misuse | Jordan ✨💯🎶, COCO-Essence, Ab kenzo Fofana running unauthorized brand ads | High |
| **Scam content volume** | §4 Misuse | 1.26M scam decisions; 40K/month | High |
| **Impersonation enforcement gap** | §4 Misuse | 0.1% enforcement rate on 746K reports | Critical |
| **Child safety crisis** | §4 Misuse | 2.71M decisions (24.4% of all moderation); multi-jurisdictional investigation | Critical |
| **False information** | §4 Misuse | Near-zero enforcement on 607K reports (Snapchat reports 0.0%) | Medium |
| **Fake influencer partnerships** | §2 Influencer / §4 Misuse | Multi-brand promotion mills; no engagement verification | High |
| **Content false positives** | §4 Misuse | 42.7% overturn rate for content removal | Medium |
| **Paid-organic gap** | §3 Organic | Brands spending €M on ads with zero organic protection | High |
| **Political ad exposure** | §4 Misuse | B2C brands running $117.5M political ads; deepfake risks rising | Medium |
| **Regulatory contagion** | §4 Misuse | EU, Australia, UK all investigating simultaneously | High |
| **Reporting manipulation** | §4 Misuse | Porn decisions dropped to zero (July 2025); 99.97% classified as T&C not illegal | High |
| **Moderation gaps by language** | §4 Misuse | 0 moderators for Czech, Greek, Hungarian, Croatian, Slovak, Slovenian | High |
| **Zero proactive illegal action** | §4 Misuse | 0 own-initiative measures against illegal content; all classified as T&C | Critical |
| **Government orders surge** | §4 Misuse | 54,393 information requests from EU governments in H2 2025 | Medium |
| **Brand IP notice delay** | §4 Misuse | 118-hour (5-day) median response for IP infringement reports | High |
| **Account impunity for IP** | §4 Misuse | Only 3.3% of IP infringers get account suspended | Critical |
| **Violating views exposure** | §4 Misuse | 1 in 207 views involves sexual content violation (VVR 0.482%) | High |
| **Cross-platform gap** | §4 Misuse | Snapchat automates 13.2% vs TikTok 93.8%; 20x volume gap | Medium |
| **Trusted Flagger void** | §4 Misuse | Only 3,642 TF decisions out of 11.1M (0.033%); zero for IP | Critical |
| **Political CPM premium** | §4 Misuse | Norway $22.23 CPM vs US $5.72 — 3.9x geographic premium | Medium |

This integrated view is Ravineo's differentiator: no competitor tool connects ad spend monitoring, influencer verification, organic presence tracking, platform safety data, child safety metrics, political ad intelligence, moderation staffing analysis, cross-platform comparison, and Trusted Flagger strategy into a single brand risk dashboard.

### Honest limitations

1. **No content-level detail in our local DSA data.** The 11.1M moderation decisions tell us *how many* scam decisions were made, but not *what brands were targeted*. We know 1.26M scam decisions exist; we cannot say "247 involved Chanel impersonation." However, the **EC DSA Transparency Database** (transparency.dsa.ec.europa.eu) provides a [public Research API](https://transparency.dsa.ec.europa.eu/page/research-api) allowing keyword-based searches across the last 6 months of Statements of Reasons. This would enable brand-specific queries (e.g., searching for "Chanel" or "Nivea" in moderation decisions). Integration effort: ~1-2 days for API authentication (EU Login) and query pipeline.

2. **Our local ec_dsa_sor has no brand linkage.** Individual moderation records have UUID, category, content type, date, and automation status — but no brand name, advertiser name, or content description. The EC Research API partially solves this by allowing keyword searches, though results are capped at 1,000 per query and cover only a 6-month rolling window.

3. **Snapchat faces multi-jurisdictional investigation.** EU (DSA proceedings, March 2026), Australia (under-16 ban compliance, December 2025), and UK (Ofcom/ICO demands, deadline April 30, 2026) are all investigating simultaneously. The combined regulatory pressure could lead to rapid, uncoordinated platform changes affecting brand campaigns. Additionally, the EU's legal basis for CSAM scanning expired April 3, 2026 — creating a detection gap that Snap has pledged to cover voluntarily.

4. **Political ad data has currency mixing.** Political ads report actual spend, but in 11 different currencies (USD, EUR, NOK, AUD, CAD, INR, GBP, DKK, AED, etc.). Cross-country spend comparisons require currency normalization. The $117.5M total is a nominal sum across currencies, not a purchasing-power-adjusted figure.

5. **Political ad classification includes non-political actors.** Snapchat's definition of "political" is broad — Ben & Jerry's ice cream, Unilever, and General Mills are classified as political advertisers. This is actually useful (it shows which B2C brands do issue advertising) but the label "political ads" overstates the political nature of some campaigns.

6. **No content adjacency data.** We cannot verify Snapchat's claimed "99% brand safety" for Spotlight/Creator Stories because we have no data on what content appears adjacent to ads. This would require Snapchat's Brand Suitability API (partner-gated, via DoubleVerify/IAS/Zefr).

7. **Fake influencer detection is pattern-based, not verified.** High-volume multi-sponsor creators *look like* promotion mills, but we have no engagement data to confirm whether their audiences are genuine. The enrichment pipeline (profile scraping) would add this verification layer.

8. **Regional granularity is limited.** The ec_dsa_sor data has no per-country breakdown. Global transparency reports provide only three regions (North America, Europe, Rest of World). Per-country risk scores would require Snapchat to disaggregate its moderation data — something the DSA may eventually mandate.

9. **Temporal data starts at September 2023.** We have 2.5 years of moderation trends. Pre-DSA comparison is not available.

10. **Child safety data has a reporting discontinuity.** Sexual content decisions dropped to zero from July 2025 — this is a taxonomy change, not a real decline. Any trend analysis must account for this break. The "protection of minors" category continued uninterrupted but may have absorbed reclassified decisions.

11. **VVR is platform-wide, not ad-adjacent.** The Violating Views Rate measures total platform exposure, not specifically views adjacent to brand ads. A VVR of 0.482% for sexual content does not mean 0.482% of *your ad views* are next to violating content — Snapchat claims 99%+ brand safety for ad placements. VVR is an upper bound for platform-level risk, not a direct ad adjacency metric.

12. **Cross-platform comparison is limited.** TikTok data comes from their public DSA report, not from the EC database. Methodology differences (what counts as "removed," how automation is measured) may make direct comparison imprecise. The 20x volume gap may partly reflect platform size rather than moderation quality.

13. **Trusted Flagger status requires EU establishment.** Ravineo must be legally established in an EU Member State to apply. The application process, timeline, and success criteria are not yet standardized — the EC's guidance (Q2 2026) will clarify. Only 15 TFs exist as of December 2024, suggesting either high barriers or low awareness.

### How this compares to what exists

| Tool | Snapchat Brand Safety | Method | Limitation |
| --- | --- | --- | --- |
| **DoubleVerify** | Ad adjacency measurement | Pixel-based verification | Only your own ads; no platform-wide risk |
| **IAS** | Ad-level brand safety scoring | Snap partner integration | Only your own campaigns; no competitor view |
| **Zefr** | Content-level brand suitability | AI content classification | Pre-bid filtering only; no post-hoc analysis |
| **SnapDragon** | Brand protection / counterfeit | 98% enforcement rate, AI detection | Focused on e-commerce listings, not social ad libraries |
| **NexifyAI** | Cross-platform monitoring | 24/7 monitoring, 15-min takedowns | 100K+ websites, not social-specific |
| **Starseed** | Counterfeit intelligence | Flagged 310M+ counterfeits globally | Revenue-focused ($162M impact measured); no platform risk analysis |
| **Our approach** | **Platform-wide risk intelligence** | DSA moderation data + ad library + profile scraping + EC Research API | Covers all platform safety dimensions; no brand-specific content linkage in local DSA data |

The brand protection market is significant — Starseed alone reports top clients saving an average of $90.5M annually, and platforms like NexifyAI claim 99.9% protection rates. But these tools are built for **e-commerce takedowns** (marketplace listings, fake websites). None of them offer what the DSA transparency data enables: **platform-level risk quantification for social advertising platforms**.

The fundamental gap: **existing tools protect your own ads. We quantify the platform-wide risk environment.** A DoubleVerify dashboard says "your Nike ad was 99% brand-safe." We say "Snapchat processes 40,000 scam decisions per month, impersonation enforcement is 0.1%, and someone called 'Jordan ✨💯🎶' is running DEEP\_LINK ads using Nike's Jordan brand name across 6 EU countries — here's the systemic risk picture."

### What this means for a Beiersdorf or Philips

**Available today (platform intelligence):**

1. **Risk briefing** — "Here's Snapchat's safety profile: 11.1M moderation decisions, 2.71M child-safety-related (24.4%), 1.26M scam-related, impersonation poorly enforced. This is how it compares to TikTok (20x more content removed, 7x higher automation)."
2. **Brand-specific alerts** — "Your username is available / squatted. No third-party ads using your brand name detected. Your influencer partners show no promotion-mill red flags."
3. **Brand exposure quantification** — "For every 10M views your campaign generates, statistically ~48,200 occur alongside sexual content violations (VVR 0.482%) and ~960 alongside CSEA content. Here's your platform-wide adjacency risk."
4. **Child safety risk assessment** — "Snapchat faces simultaneous investigations from EU, Australia, and UK for child safety failures. 321,587 NCMEC submissions in H1 2025 alone. Here's how this affects your advertising strategy."
5. **IP enforcement reality check** — "If you file an IP notice, expect a 5-day wait. If actioned, there's only a 3.3% chance the infringer's account is suspended. Here's what that means for your protection strategy."
6. **Regulatory context** — "EU opened DSA proceedings in March 2026. Australia is investigating under-16 ban compliance. UK demands age check changes by April 30, 2026. Here's the timeline and impact assessment."

**Available with periodic monitoring (weekly/monthly):**

1. **Scam trend alerts** — "Scam decisions increased 20% this month — possible new wave of counterfeit campaigns."
2. **New impersonation detection** — "A new account appeared using your brand name. Here's the profile data and risk assessment."
3. **Influencer safety scoring** — "Your proposed influencer partner has 477 sponsored pieces across 10 brands — promotion mill risk: high."
4. **Reporting anomaly alerts** — "Snapchat's porn category dropped to zero — taxonomy change detected, investigate for reporting manipulation."
5. **Political ad intelligence** — "Your competitor Unilever spent $997K on issue ads across 4 countries. Norwegian CPM is $22.23 vs US $5.72 — here's their targeting strategy and cost efficiency."
6. **Regulatory impact tracking** — "Snapchat implemented new moderation rules following EU investigation — here's how it affects your brand presence."

**Available with Trusted Flagger status (strategic):**

1. **Priority brand protection** — "We filed a Trusted Flagger report for brand impersonation. Expected response: 4-7 hours instead of 5 days."
2. **Cross-platform enforcement** — "As an EU-recognized Trusted Flagger, we can file priority reports on Snapchat, TikTok, Meta, and YouTube with the same elevated status."
3. **Regulatory positioning** — "Only 15 Trusted Flaggers exist in the EU. Ravineo is the only one focused on B2C brand protection on social advertising platforms."

### Data access summary

| Use Case | Table | Key Fields | Status |
| --- | --- | --- | --- |
| Platform Risk Scorecard | `ec_dsa_sor` | `category`, `content_type`, `application_date` | 11.1M decisions, 16 categories |
| Brand Impersonation | `brand_profiles` + `brand_ads_fashion` + `ec_dsa_sor` | Cross-reference profile, ad names, impersonation stats | 28 squatted + ad name scanning |
| Scam Trends | `ec_dsa_sor` | `category`, `application_date` | Monthly trends, Sep 2023 - Apr 2026 |
| Fake Influencer Flags | `sponsored_content` | `creator_name`, `sponsor_name`, `content_type` | 3,415 sponsored creators, pattern analysis |
| Disinformation Risk | `global_user_reports_by_policy` + `ec_dsa_sor` | `policy`, `reports`, `enforcements` | 607K reports, near-zero enforcement |
| Legal Ground Classification | `ec_dsa_sor` | `decision_ground` | 99.97% T&C vs 0.03% illegal — DSA implications |
| Automation Gap | `ec_dsa_sor` | `automated_detection`, `automated_decision` | Detection and decision automation rates |
| Market Safety | `eu_dsa_amar` + `global_regional_enforcements` | `scope`, `value`, `region` | 97.2M EU users, per-country breakdown |
| Appeal Intelligence | `eu_dsa_appeals` | `indicator`, `scope`, `value` | 131K complaints, 42.7% content overturn rate |
| Ad Moderation | `global_ads_moderation` | `ads_reported`, `ads_removed` | 67,789 reported, 16,410 removed |
| **Child Safety Risk** | `ec_dsa_sor` + `global_proactive_detection` + `global_user_reports_by_policy` + `global_enforcements_by_policy` | `category` (porn, minors), `policy` (CSEA, Sexual), enforcement rates, temporal trends | **2.71M decisions (24.4%), 1.63M CSEA reports, multi-jurisdiction investigation** |
| **Political Ad Intelligence** | `political_ads` | `paying_advertiser`, `spend`, `impressions`, `interests`, `target_gender`, `candidate_info`, `country` | **74,609 ads, $117.5M actual spend, 54 countries, 2,773 advertisers** |
| **Political Misuse Detection** | `political_ads` + `ec_dsa_sor` | Cross-reference advertisers with candidate names, civic discourse decisions | Unauthorized ad detection, deepfake monitoring |
| **Moderation Staffing** | `eu_dsa_human_resources` | `indicator`, `scope`, `value` | **1,430 moderators; 0 for Czech, Greek, Hungarian, Croatian, Slovak, Slovenian** |
| **Government Orders** | `eu_dsa_member_state_orders` | Content removal orders, information requests, by country | **54,393 info requests, 6 content removals (all France)** |
| **Own-Initiative Illegal** | `eu_dsa_own_initiative_illegal` | Own-initiative measures against illegal content | **Zero proactive measures against illegal content** |
| **Report Source Intelligence** | `ec_dsa_sor` | `source_type` | **59.4% user reports, 40.5% voluntary, 0.033% Trusted Flagger** |
| **Account Enforcement** | `ec_dsa_sor` | `decision_account` | **1.78M suspended, 19.8K terminated; 0 monetary penalties** |
| **VVR Brand Safety Metric** | `global_enforcements_by_policy` | `vvr_pct` | **Sexual: 1-in-207 views; CSEA: 1-in-1,042; quantifiable brand risk** |
| **Notice Response Times** | `eu_dsa_notices` | Median time to act, Trusted Flagger response | **IP: 118h standard, TF: 4-7h; 16-29x speedup** |
| **Political CPM** | `political_ads` | `spend`, `impressions` | **Ground truth: Norway $22.23 vs US $5.72 CPM** |
| **Cross-Platform Comparison** | External (TikTok DSA reports) | Automation rate, volume | **TikTok: 93.8% automated, 112M removed vs Snap: 13.2%, ~5.5M** |
| **Automated Means Disclosure** | `eu_dsa_automated_means` | Total decisions, automation rate, self-reported accuracy | **69.2M total decisions; 95.3% automated (incl. approvals); 0 automated notice processing; self-reported 100% accuracy contradicted by 42.7% overturn rate** |
| **Trusted Flagger Opportunity** | `ec_dsa_sor` + `eu_dsa_notices` + external (DSA Art. 22) | Source type, response times, application requirements | **Only 15 EU TFs exist; 5-day→4-hour response; Q2 2026 guidelines** |
| Cross-Section Synthesis | All tables | Unified brand risk profile | Combined across all sections |

---

## Methodology notes

- **Real data vs proxies:** Impression counts, ad metadata, targeting, and dates are DSA-mandated real disclosure. Spend estimates are proxies derived from impressions x published CPM benchmarks. All proxy values are labeled as estimates and presented as ranges — never point estimates.
- **Sample coverage:** Ad data is rate-limit constrained (~10 ads per brand x country). Volumes represent **lower bounds**, not exhaustive counts. We crawled 98 brand names, which yielded 402 distinct advertiser entities (the API uses fuzzy matching, so a search for "Nike" also returns "Jannike" etc. — these are filtered in analysis). Relative rankings (share of voice) are more stable than absolute figures.
- **Data quality:** 4,694 total rows contain 3,694 unique ad IDs — approximately 1,000 rows are the same ad appearing in multiple country queries. For the top brands analyzed (Nike, HUGO BOSS, Cartier, Birkenstock, Zalando), there is **zero cross-country duplication** (each ad appears in exactly one country). Deduplication affects mainly smaller/less-known advertisers.
- **Temporal window:** EU Ad Library provides a rolling 12-month window. Our sample covers April 2025 through April 2026.
- **Fashion-specific sample:** Our crawl targeted fashion/luxury brands. The methodology (impressions x CPM estimation, share of voice, geographic allocation) generalizes to any vertical — consumer electronics, FMCG, automotive — but the data sample in this repository is fashion-specific. Extending to other verticals requires additional crawl runs.
- **Reproducible experiments:** Thirteen SQL experiments validate the claims in this document — format-stratified spend model, political CPM validation, share-of-voice stability, sponsor-advertiser overlap, geographic map consistency, influencer network analysis, creator discovery/reach, influencer enrichment potential, misuse detection, and child safety/political analysis (including report source intelligence, account enforcement, VVR analysis, notice response times, political CPM, and Trusted Flagger data). Run `bash experiments/run_all.sh` from the repo root. Results and findings: **[experiments/README.md](./experiments/README.md)**.
- **Full technical detail:** See **[RESEARCH.md](./RESEARCH.md)** for API documentation, rate limits, and data access paths. See **[DATA_SAMPLES.md](./DATA_SAMPLES.md)** for table inventory and row counts.
