-- Experiment 9: Paid Creator Content Detection
-- Mine ad_name fields in brand_ads_fashion for creator/UGC/partnership signals.
-- This bridges paid ads (Section 1) and influencer intelligence (Section 2).

.mode markdown
.headers on

SELECT '=== Experiment 9: Paid Creator Content Detection ===' AS report;

-- Overall prevalence
SELECT '--- Creator/UGC signal prevalence in paid ads ---' AS report;

SELECT
    count(*) AS total_ads,
    count(CASE WHEN lower(ad_name) LIKE '%creator%' OR lower(ad_name) LIKE '%partnership%'
               OR lower(ad_name) LIKE '%ugc%' OR lower(ad_name) LIKE '%influenc%'
               OR lower(ad_name) LIKE '%collab%' THEN 1 END) AS creator_signal_ads,
    round(100.0 * count(CASE WHEN lower(ad_name) LIKE '%creator%' OR lower(ad_name) LIKE '%partnership%'
               OR lower(ad_name) LIKE '%ugc%' OR lower(ad_name) LIKE '%influenc%'
               OR lower(ad_name) LIKE '%collab%' THEN 1 END) / count(*), 1) AS pct
FROM brand_ads_fashion;

-- By signal type
SELECT '--- Breakdown by signal type ---' AS report;

SELECT
    CASE
        WHEN lower(ad_name) LIKE '%partnershipad%' THEN 'Partnership Ad'
        WHEN lower(ad_name) LIKE '%partnership%' THEN 'Partnership (other)'
        WHEN lower(ad_name) LIKE '%creator%' THEN 'Creator'
        WHEN lower(ad_name) LIKE '%ugc%' THEN 'UGC'
        WHEN lower(ad_name) LIKE '%influenc%' THEN 'Influencer'
        WHEN lower(ad_name) LIKE '%collab%' THEN 'Collab'
    END AS signal_type,
    count(DISTINCT ad_id) AS unique_ads,
    count(DISTINCT paying_advertiser_name) AS brands,
    sum(impressions_total) AS total_impressions,
    round(sum(impressions_total) / 1000000.0, 2) AS impressions_M
FROM brand_ads_fashion
WHERE lower(ad_name) LIKE '%creator%' OR lower(ad_name) LIKE '%partnership%'
   OR lower(ad_name) LIKE '%ugc%' OR lower(ad_name) LIKE '%influenc%'
   OR lower(ad_name) LIKE '%collab%'
GROUP BY signal_type
ORDER BY total_impressions DESC;

-- Brands spending on creator/UGC content as paid ads
SELECT '--- Brands using creator content in paid ads ---' AS report;

SELECT
    paying_advertiser_name,
    count(DISTINCT ad_id) AS creator_ads,
    sum(impressions_total) AS total_impressions,
    round(sum(impressions_total) * 4.0 / 1000, 0) AS est_spend_low_eur,
    round(sum(impressions_total) * 9.0 / 1000, 0) AS est_spend_high_eur,
    count(DISTINCT country) AS markets
FROM brand_ads_fashion
WHERE (lower(ad_name) LIKE '%creator%' OR lower(ad_name) LIKE '%partnership%'
   OR lower(ad_name) LIKE '%ugc%' OR lower(ad_name) LIKE '%influenc%'
   OR lower(ad_name) LIKE '%collab%')
AND paying_advertiser_name IS NOT NULL
AND paying_advertiser_name NOT LIKE '%Stillfront%'
GROUP BY paying_advertiser_name
ORDER BY total_impressions DESC;

-- CAIA Cosmetics: extract actual creator names from structured ad naming
SELECT '--- Creator names extractable from ad naming conventions ---' AS report;

SELECT DISTINCT
    paying_advertiser_name,
    regexp_extract(ad_name, 'c:([a-zA-Z0-9_]+)', 1) AS creator_name,
    count(*) AS ads,
    sum(impressions_total) AS impressions
FROM brand_ads_fashion
WHERE paying_advertiser_name = 'CAIAcosmetics'
AND ad_name LIKE '%s:creator%' OR ad_name LIKE '%s:partnership%' OR ad_name LIKE '%s:ugc%'
GROUP BY paying_advertiser_name, creator_name
HAVING creator_name != ''
ORDER BY impressions DESC;

-- Comparison: creator/UGC ads vs all ads for the same brands
SELECT '--- Creator vs non-creator ad mix for brands that use both ---' AS report;

WITH brand_totals AS (
    SELECT
        paying_advertiser_name,
        sum(impressions_total) AS all_impressions,
        sum(CASE WHEN lower(ad_name) LIKE '%creator%' OR lower(ad_name) LIKE '%partnership%'
                   OR lower(ad_name) LIKE '%ugc%' OR lower(ad_name) LIKE '%influenc%'
                   OR lower(ad_name) LIKE '%collab%' THEN impressions_total ELSE 0 END) AS creator_impressions
    FROM brand_ads_fashion
    WHERE paying_advertiser_name IS NOT NULL
    AND paying_advertiser_name NOT LIKE '%Stillfront%'
    GROUP BY paying_advertiser_name
    HAVING creator_impressions > 0
)
SELECT
    paying_advertiser_name,
    all_impressions,
    creator_impressions,
    round(100.0 * creator_impressions / all_impressions, 1) AS creator_pct
FROM brand_totals
ORDER BY creator_pct DESC;
