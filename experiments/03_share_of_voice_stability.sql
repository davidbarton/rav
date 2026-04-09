-- Experiment 3: Share of Voice Stability
-- Our sample is rate-limited (~10 ads/brand/country). Is the ranking stable?
-- Goal: check if impression-based rankings are dominated by a few high-impression ads
-- or spread across many, and whether per-country samples converge to the same ranking.

.mode markdown
.headers on

SELECT '=== Experiment 3: Share of Voice Stability ===' AS report;

-- How many ads does each top brand actually have? Is the sample reasonable?
SELECT
    paying_advertiser_name AS brand,
    count(*) AS total_ads,
    count(DISTINCT country) AS countries,
    round(avg(impressions_total), 0) AS avg_impressions,
    round(median(impressions_total), 0) AS median_impressions,
    max(impressions_total) AS max_impressions,
    min(impressions_total) AS min_impressions,
    -- Concentration: does top ad dominate?
    round(100.0 * max(impressions_total) / sum(impressions_total), 1) AS top_ad_pct,
    sum(impressions_total) AS total_impressions
FROM brand_ads_fashion
WHERE impressions_total > 0
GROUP BY paying_advertiser_name
ORDER BY total_impressions DESC
LIMIT 20;

-- Ranking stability: compare overall rank vs France-only vs Germany-only
SELECT '--- Ranking comparison: Overall vs France vs Germany ---' AS report;

WITH overall AS (
    SELECT paying_advertiser_name AS brand,
        sum(impressions_total) AS impr,
        row_number() OVER (ORDER BY sum(impressions_total) DESC) AS rank_overall
    FROM brand_ads_fashion WHERE impressions_total > 0
    GROUP BY paying_advertiser_name
),
fr AS (
    SELECT paying_advertiser_name AS brand,
        sum(impressions_total) AS impr_fr,
        row_number() OVER (ORDER BY sum(impressions_total) DESC) AS rank_fr
    FROM brand_ads_fashion WHERE impressions_total > 0 AND country = 'fr'
    GROUP BY paying_advertiser_name
),
de AS (
    SELECT paying_advertiser_name AS brand,
        sum(impressions_total) AS impr_de,
        row_number() OVER (ORDER BY sum(impressions_total) DESC) AS rank_de
    FROM brand_ads_fashion WHERE impressions_total > 0 AND country = 'de'
    GROUP BY paying_advertiser_name
)
SELECT
    o.brand,
    o.rank_overall,
    o.impr AS impressions_all,
    fr.rank_fr,
    fr.impr_fr AS impressions_fr,
    de.rank_de,
    de.impr_de AS impressions_de
FROM overall o
LEFT JOIN fr ON o.brand = fr.brand
LEFT JOIN de ON o.brand = de.brand
WHERE o.rank_overall <= 15
ORDER BY o.rank_overall;
