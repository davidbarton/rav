-- Experiment 1: Format-Stratified Spend Model
-- Compare flat €4-9 CPM vs format-aware CPM bands.
-- Goal: show the stratified model produces meaningfully different (tighter) estimates.

.mode markdown
.headers on

SELECT '=== Experiment 1: Stratified Spend Model ===' AS report;

-- Step 1: Define format tiers and apply to each ad
WITH format_tiers AS (
    SELECT *,
        CASE
            WHEN creative_type IN ('LENS', 'LENS_WEB_VIEW', 'LENS_APP_INSTALL', 'AD_TO_LENS')
                THEN 'ar_lens'
            WHEN creative_type = 'COMPOSITE'
                THEN 'premium'
            WHEN creative_type = 'COLLECTION'
                THEN 'collection'
            WHEN ad_render_type = 'DYNAMIC'
                THEN 'dynamic'
            ELSE 'standard'
        END AS format_tier
    FROM brand_ads_fashion
    WHERE impressions_total > 0
),

-- Step 2: Apply tier-specific CPM bands
spend_estimates AS (
    SELECT *,
        CASE format_tier
            WHEN 'ar_lens'   THEN 15.0
            WHEN 'premium'   THEN 7.0
            WHEN 'collection' THEN 5.0
            WHEN 'dynamic'   THEN 6.0
            ELSE                   4.0
        END AS cpm_low,
        CASE format_tier
            WHEN 'ar_lens'   THEN 40.0
            WHEN 'premium'   THEN 15.0
            WHEN 'collection' THEN 13.0
            WHEN 'dynamic'   THEN 14.0
            ELSE                   12.0
        END AS cpm_high,
        -- flat model for comparison
        4.0 AS flat_cpm_low,
        9.0 AS flat_cpm_high
    FROM format_tiers
)

-- Step 3: Aggregate by brand — compare models
SELECT
    paying_advertiser_name AS brand,
    count(*) AS ads,
    sum(impressions_total) AS impressions,
    -- Flat model
    round(sum(impressions_total / 1000.0 * flat_cpm_low)) AS flat_low_eur,
    round(sum(impressions_total / 1000.0 * flat_cpm_high)) AS flat_high_eur,
    -- Stratified model
    round(sum(impressions_total / 1000.0 * cpm_low)) AS strat_low_eur,
    round(sum(impressions_total / 1000.0 * cpm_high)) AS strat_high_eur,
    -- Range width (lower = tighter estimate)
    round(sum(impressions_total / 1000.0 * flat_cpm_high) - sum(impressions_total / 1000.0 * flat_cpm_low)) AS flat_range_width,
    round(sum(impressions_total / 1000.0 * cpm_high) - sum(impressions_total / 1000.0 * cpm_low)) AS strat_range_width,
    -- Dominant format
    mode(format_tier) AS dominant_format
FROM spend_estimates
GROUP BY paying_advertiser_name
ORDER BY impressions DESC
LIMIT 20;
