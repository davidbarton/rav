# Experiments

Reproducible SQL experiments validating claims in **[BUSINESS_ANALYSIS.md](../BUSINESS_ANALYSIS.md)**.

Run all: `bash experiments/run_all.sh` (from repo root). Requires `db/rav.db` to be built first (`duckdb db/rav.db < db/init.sql`).

Results: **[results.md](./results.md)**

## Experiments and key findings

### 01 — Stratified Spend Model

Compares the flat €4-9 CPM model against a format-aware model (Standard €4-12, Premium €7-15, AR/Lens €15-40, Dynamic €6-14).

**Finding:** The stratified model surfaces real strategic differences. Cartier goes from €433K-€974K (flat) to **€1.1M-€3.0M** (stratified) because 56% of their impressions come from AR Lens formats. Nike's dominant format is "dynamic" (retargeting, 92% of impressions) which pushes their estimate up 1.5x. Gucci (7 ads, 1 country, 63% from a single ad) shows AR/Lens dominance but on a thin sample. The model makes format-driven strategy differences visible in the numbers.

**Important nuance:** The `dominant_format` column reports the most common format by ad count (MODE), not by impression share. Cartier shows "standard" as dominant by count but 56% of impressions come from Lens formats. Always check impression-weighted format mix for spend analysis.

### 02 — Political Ads CPM Validation

Ground-truth CPM from 72,979 ads with real disclosed spend ($117.5M total).

**Finding:** 72.1% of EUR political ads have CPM **below** €4 (our assumed commercial floor). Only 22.6% fall within our €4-9 band; 5.3% are above. This means our commercial band is intentionally conservative — political ads are cheaper due to broad targeting and simpler creatives. USD political ads are more expensive (median $8.21 CPM), closer to published commercial benchmarks. Our €4-9 band for commercial fashion/luxury is defensible as a moderate-to-conservative estimate.

### 03 — Share of Voice Stability

Tests whether rate-limited samples (~10 ads/brand/country) produce stable rankings, and whether per-country rankings diverge.

**Finding:** Rankings shift dramatically by country. HUGO BOSS is #3 overall but **#1 in Germany** (73% of their budget) and #12 in France. boohooMAN is #6 overall but **#2 in France**. Gucci is #13 overall but **#5 in France** and absent from Germany entirely. This proves geographic analysis is essential — overall ranking masks local competitive dynamics. Some brands also show high single-ad concentration (SHEIN: 67% from one ad; Gucci: 63%), while others are distributed (HUGO BOSS: 8.9% from top ad across 512 total ads).

### 04 — Sponsor-Advertiser Overlap

Tests whether brands in paid ads also appear as sponsors in creator content.

**Finding:** Almost zero genuine overlap. All top-15 paid advertisers (Nike, Birkenstock, HUGO BOSS, Cartier, Zalando...) appear exclusively in paid ads with no sponsored content matches. The only real matches were Givenchy Beauty (2 pieces) and Temu Europe (multiple regional accounts). This reveals that **paid ads and sponsored creator content are distinct investment channels on Snapchat** — brands investing in paid ads don't necessarily invest in creator partnerships. This makes cross-dataset enrichment more valuable, not less: each dataset reveals a different dimension of competitor activity.

### 05 — Geographic Impressions Map

Validates the `impressions_map` field for geographic allocation analysis.

**Finding:** 28 distinct countries in the map (27 EU + Turkey). Sum of per-country values matches `impressions_total` exactly (0% deviation across 100 ads tested). The geographic data is perfectly consistent and fully usable for allocation analysis.

### 06 — Influencer Network Analysis

Maps creator-sponsor relationships and identifies competitive patterns in the `sponsored_content` dataset.

**Finding:** 3,415 creators linked to 2,987 sponsors via 3,897 unique pairings. **91.9% of creators work with exactly one brand** — near-total exclusivity, strikingly different from Instagram/TikTok norms. Only 10 creators (0.3%) work with 6+ brands. Content volume follows a power-law: 84 creators produce 50+ pieces each, accounting for 37.6% of all sponsored content. The top multi-brand creator (shadw_2) works with 14 brands across 147 content pieces.

### 07 — Creator Discovery & Reach

Verifies what creator metrics are accessible for influencer intelligence and tests cross-table enrichment.

**Finding:** Almost zero overlap between sponsored creators and explore/profile datasets — only 2 of 61,761 sponsored creators appear in explore profiles; 0 appear in brand profiles. This means the datasets are complementary, not redundant. Explore profiles cover 102 creator accounts with subscriber counts from nano (<1K) to mega (4.7M). Spotlight engagement varies dramatically by topic: "fashion" content averages 421K views per video vs "outfitoftheday" at 27K. 29 brands have published their own Spotlight content, led by Crocs (21 videos), Clarins (18), and Gymshark (17).

### 08 — Influencer Enrichment Potential

Quantifies how much richer the creator dataset could become by running existing scrapers on sponsored creator usernames and Spotlight URLs.

**Finding:** The `sponsored_content` table has only 7 fields per row — no engagement, no timestamps, no demographics. However, we have 3,415 unique creator usernames that could be enriched via profile scraping (~45 min) to add follower counts, categories, spotlight engagement, and related accounts. We also have 13,876 unique Spotlight URLs from sponsored content that could be scraped (~3 hours) to add view counts, share counts, transcripts, and comments. Current cross-table overlap is near zero (21 creators matched to spotlight pages, 0 to explore), confirming these scrapers would add genuinely new data. The sponsor base is heavily MENA-dominated — the top 30 sponsors are almost entirely Arabic-language brands, Turkish e-commerce (Trendyol), and Temu variants.

### 09 — Paid Creator Content Detection

Mines `ad_name` fields in paid ads for creator/UGC/partnership signals, bridging Section 1 (ad spend) and Section 2 (influencer collaborations).

**Finding:** 145 of 4,694 paid ads (3.1%) contain creator/UGC signals, totaling 49.7M impressions. Dominant signal is "UGC" (81 ads, 40.6M impressions, 10 brands). 15 brands use creator content in paid ads — including Birkenstock (€24K-54K on 7 creator ads), CAUDALIE, boohooMAN, Givenchy Beauty, Pandora, HUGO BOSS, and adidas. CAIAcosmetics embeds actual creator usernames in its ad naming convention (`s:creator | c:biancaingrosso`), enabling extraction of specific brand-creator relationships. Creator share of paid impressions varies from 95.9% (Wild Cosmetics — almost entirely creator-driven) to 0.1% (HUGO BOSS — minimal creator use). This data reveals which Western brands are actively investing in creator content on Snapchat — filling the gap left by the MENA-dominated Sponsored Content API.

### 10 — Creator Name Extraction & Database

Extracts specific creator identities from ad naming conventions across multiple brands, analyzes the 58K "unsponsored" creator database, and compares targeting between creator and brand ads.

**Finding:** 13 specific brand-creator pairs extracted from 7 brands: Givenchy Beauty → Sullivan (2.4M impressions), Pandora → Lara GCV (956K), CAIAcosmetics → Bianca Ingrosso (846K), HUGO BOSS → Jayde Pierce (80K) and Julien Brown (50K), plus Wild Cosmetics' "UGC Pod" creators (Greta, Clara, Lauren, Lewis). Cross-platform verification confirms these are real, high-profile influencers — Bianca Ingrosso is the co-founder of CAIA Cosmetics (1.4M Instagram followers, $50M+ company), and Jayde Pierce is a 1.3M-follower UK beauty influencer whose HUGO BOSS collaboration was **not publicly documented** before this DSA data revealed it. The 58K unsponsored creators are a significant asset: 512 have 50+ content pieces, and 455 appear in both sponsored and unsponsored datasets. Birkenstock targets ages 18-39 for creator ads vs 18+ (no max) for brand ads — confirming brands use creator content for younger demographics.

### 11 — Organic Presence Analysis

Analyzes brand profile maturity, content strategy benchmarking, engagement efficiency (including recommend/save rate), username squatting (with paid spend cross-reference), paid-organic alignment (with organic share %), duration optimization, posting cadence, verification status, profile completeness, and industry segmentation from subcategories.

**Finding:** A five-tier maturity model classifies 100 fashion/luxury brands: only 8 are "active" (subscribers + content), 3 have audience only, 19 produce content without visible subscribers, 42 are dormant, and **28 have their username squatted by personal accounts** (Chanel → "Pauline", Hermes → "mayed", MAC → personal account with 65.8K subs). The most explosive cross-reference: **8 squatted brands are actively paying for Snapchat ads** — Canada Goose (€364K estimated spend while "𝒶𝓎𝒹𝑒𝓃" holds @canadagoose) and Chanel (€321K while "Pauline" holds @chanel). Verification status (badge field) correlates strongly: verified brands average 3x subscribers and 5x content output vs unverified. Profile completeness is poor — only 53% verified, 47% have website, 38% have hero image. Among brands with Spotlight content, Gymshark leads in views (111K avg) with aggressive paid amplification (7.1% boost rate). Under-10s videos have the highest median views (13,539); 30-60s consistently underperforms. Organic share of total visibility: Gymshark is the only brand with meaningful organic reach (28.8%); most luxury brands are below 1%. Profile creation dates span 2019 (Prada, first mover) through 2026, with early adopters (pre-2021) averaging 15x more subscribers than post-2022 entrants.

### 12 — Misuse Detection & Brand Safety

Analyzes platform moderation data (11.1M DSA decisions), scam/fraud trends, impersonation enforcement gaps, fake influencer patterns, ad moderation statistics, disinformation risk, automation rates, per-country user base, and appeal/overturn rates.

**Finding:** Snapchat's DSA transparency data reveals a platform processing 350K-470K moderation decisions per month across 16 violation categories. **Scams/fraud account for 11.3%** (1.26M decisions) — the single largest brand-relevant risk. Scam activity peaked mid-2024 at 80K/month, declining to ~25K by 2026. **Impersonation has a 0.1% enforcement rate** (7,138 actions on 745,874 reports) — the second-lowest on the platform. **False information is even worse at 0.03%** (2,088 actions on 606,979 reports). Proactive detection is almost non-existent for these categories: only 52 impersonation and 61 false information cases were proactively caught (vs thousands from user reports). Ad moderation: 67,789 ads reported, 16,410 removed (24.2% removal rate). **Content removal appeals are overturned 42.7% of the time** — a significant false-positive problem. EU per-country user base data enables market-specific risk assessment (France 28.6M, Germany 19.8M, Netherlands 6.8M). The cross-section synthesis connects ad spend monitoring, influencer verification, organic presence, and platform safety into a unified brand risk profile.

### 13 — Child Safety & Political Misuse

Analyzes child safety moderation (2.71M decisions), sexual content temporal anomalies, CSEA enforcement, political ad transparency ($117.5M actual spend), B2C brands in political advertising, election cycle patterns, targeting intelligence, and civic discourse moderation.

**Finding:** Child safety is Snapchat's #1 moderation challenge: **2.71M decisions (24.4% of all moderation)** for pornography/sexual content and protection of minors combined. CSEA user reports: 1.63M filed, 695K enforced. **Critical anomaly:** sexual content decisions dropped from 118K/month to literally zero from July 2025 — a taxonomy reclassification, not a real decline. **Moderation staffing**: only 1,430 moderators (56 internal + 1,374 external), with **zero moderators** for Czech, Greek, Hungarian, Croatian, Slovak, and Slovenian — brands in these markets are effectively unmoderated. **Government orders**: 54,393 information requests from EU governments in H2 2025 (France dominates with 17,277), but only 6 content removal orders ever. **Zero proactive illegal content actions** — Snapchat classifies all own-initiative measures as T&C violations. **Political ads** provide $117.5M in actual disclosed spend across 74,609 ads, 2,773 advertisers, and 54 countries. Norway spends $4.34 per Snapchat user on political ads (Høyre: $1.82M and Arbeiderpartiet: $1.80M in Q3 2025 alone). B2C brands are significant political advertisers: Patagonia ($834K, 19 countries), Ben & Jerry's ($1.3M), General Mills ($1.7M), Unilever ($997K). US presidential election (Q3-Q4 2024) drove $26.2M. **99.97% of all moderation decisions** are classified as T&C violations rather than illegal content.

**Additional deep-dive findings (Q23-Q28):** Report source analysis reveals 59.4% of decisions triggered by Article 16 user reports, 40.5% voluntary (Snapchat detection), but only 0.033% from Trusted Flaggers (3,642 out of 11.1M). IP infringement is 76% user-reported — brands must proactively file. Account enforcement: 1.78M suspensions, 19.8K terminations, zero monetary penalties. IP infringers get only 3.3% account suspension rate; civic discourse offenders: 0.0%. Violating Views Rate (VVR) quantifies brand exposure: sexual content VVR = 0.482% (1 in 207 views), CSEA = 0.096%, impersonation = 0.009%. DSA notice response times: IP infringement takes 118 hours (5 days); Trusted Flaggers get 4-7 hours (16-29x speedup). Political CPM ground truth: Norway $22.23 (highest), US $5.72, Germany $2.47 — validates Nordic premium. Cross-platform comparison: TikTok removes 20x more content with 7x higher automation (93.8% vs Snapchat's 13.2%).
