-- Experiment 5: Geographic Impressions Map Granularity
-- Verify impressions_map contains per-country breakdowns and test consistency.
-- Goal: confirm impressions_map is usable for geographic allocation analysis.

.mode markdown
.headers on

SELECT '=== Experiment 5: Geographic Impressions Map Check ===' AS report;

-- Sample: one Nike ad's impressions_map keys
SELECT
    ad_id,
    paying_advertiser_name,
    country AS query_country,
    impressions_total,
    json_keys(impressions_map) AS map_countries
FROM brand_ads_fashion
WHERE paying_advertiser_name = 'Nike, Inc.' AND impressions_total > 1000000
LIMIT 3;

-- Consistency check: does SUM of impressions_map values ≈ impressions_total?
SELECT '--- Impressions map sum vs impressions_total consistency ---' AS report;

WITH map_sums AS (
    SELECT
        ad_id,
        impressions_total,
        (SELECT sum(CAST(v AS BIGINT)) FROM (
            SELECT unnest(map_values(CAST(impressions_map AS MAP(VARCHAR, BIGINT)))) AS v
        )) AS map_sum
    FROM brand_ads_fashion
    WHERE impressions_total > 0
    LIMIT 100
)
SELECT
    count(*) AS ads_checked,
    count(CASE WHEN map_sum IS NOT NULL THEN 1 END) AS has_map_data,
    round(avg(CASE WHEN map_sum > 0 THEN 100.0 * abs(impressions_total - map_sum) / impressions_total END), 2) AS avg_pct_diff,
    min(CASE WHEN map_sum > 0 THEN round(100.0 * abs(impressions_total - map_sum) / impressions_total, 2) END) AS min_pct_diff,
    max(CASE WHEN map_sum > 0 THEN round(100.0 * abs(impressions_total - map_sum) / impressions_total, 2) END) AS max_pct_diff
FROM map_sums;

-- How many distinct country codes appear in impressions_map across all ads?
SELECT '--- Distinct countries in impressions_map ---' AS report;

SELECT count(DISTINCT k) AS distinct_countries
FROM (
    SELECT unnest(json_keys(impressions_map)) AS k
    FROM brand_ads_fashion
    WHERE impressions_total > 0
);
