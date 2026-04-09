-- Experiment 2: Political Ads CPM Validation
-- Ground-truth CPM from ads with real disclosed spend.
-- Goal: confirm our commercial CPM assumptions are defensible.

.mode markdown
.headers on

SELECT '=== Experiment 2: Political Ads CPM Validation ===' AS report;

-- Overall distribution
SELECT
    'all_currencies' AS segment,
    count(*) AS ads,
    round(sum(spend), 0) AS total_spend,
    round(percentile_cont(0.10) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2) AS p10_cpm,
    round(percentile_cont(0.25) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2) AS p25_cpm,
    round(median((spend / impressions) * 1000), 2) AS median_cpm,
    round(percentile_cont(0.75) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2) AS p75_cpm,
    round(percentile_cont(0.90) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2) AS p90_cpm
FROM political_ads
WHERE spend > 0 AND impressions > 0

UNION ALL

SELECT
    'EUR_only' AS segment,
    count(*),
    round(sum(spend), 0),
    round(percentile_cont(0.10) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(percentile_cont(0.25) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(median((spend / impressions) * 1000), 2),
    round(percentile_cont(0.75) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(percentile_cont(0.90) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2)
FROM political_ads
WHERE spend > 0 AND impressions > 0 AND currency = 'EUR'

UNION ALL

SELECT
    'USD_only' AS segment,
    count(*),
    round(sum(spend), 0),
    round(percentile_cont(0.10) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(percentile_cont(0.25) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(median((spend / impressions) * 1000), 2),
    round(percentile_cont(0.75) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(percentile_cont(0.90) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2)
FROM political_ads
WHERE spend > 0 AND impressions > 0 AND currency = 'USD'

UNION ALL

SELECT
    'GBP_only' AS segment,
    count(*),
    round(sum(spend), 0),
    round(percentile_cont(0.10) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(percentile_cont(0.25) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(median((spend / impressions) * 1000), 2),
    round(percentile_cont(0.75) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2),
    round(percentile_cont(0.90) WITHIN GROUP (ORDER BY (spend / impressions) * 1000), 2)
FROM political_ads
WHERE spend > 0 AND impressions > 0 AND currency = 'GBP';

-- What % of political ads fall within our assumed €4-9 CPM band?
SELECT '--- What fraction of political ads have CPM in our 4-9 EUR band? ---' AS report;

SELECT
    count(*) AS total,
    count(CASE WHEN cpm >= 4 AND cpm <= 9 THEN 1 END) AS in_band,
    round(100.0 * count(CASE WHEN cpm >= 4 AND cpm <= 9 THEN 1 END) / count(*), 1) AS pct_in_band,
    count(CASE WHEN cpm < 4 THEN 1 END) AS below_band,
    round(100.0 * count(CASE WHEN cpm < 4 THEN 1 END) / count(*), 1) AS pct_below,
    count(CASE WHEN cpm > 9 THEN 1 END) AS above_band,
    round(100.0 * count(CASE WHEN cpm > 9 THEN 1 END) / count(*), 1) AS pct_above
FROM (
    SELECT (spend / impressions) * 1000 AS cpm
    FROM political_ads
    WHERE spend > 0 AND impressions > 0 AND currency = 'EUR'
) t;
