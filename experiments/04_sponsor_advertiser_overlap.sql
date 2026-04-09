-- Experiment 4: Sponsor-Advertiser Overlap
-- Do brands in paid ads also appear in sponsored content? Cross-dataset enrichment test.
-- Goal: identify brands visible in BOTH paid ads and creator partnerships.

.mode markdown
.headers on

SELECT '=== Experiment 4: Sponsor-Advertiser Overlap ===' AS report;

-- Distinct paid advertisers
SELECT count(DISTINCT paying_advertiser_name) AS distinct_paid_advertisers
FROM brand_ads_fashion;

-- Distinct named sponsors
SELECT count(DISTINCT sponsor_name) AS distinct_named_sponsors
FROM sponsored_content
WHERE sponsor_name != '' AND sponsor_name IS NOT NULL;

-- Fuzzy match: check if any paid advertiser names appear as substrings in sponsor names
SELECT '--- Paid advertisers that also appear as sponsors (substring match) ---' AS report;

SELECT DISTINCT
    a.paying_advertiser_name AS paid_brand,
    s.sponsor_name AS sponsor_match,
    a_stats.ads AS paid_ads,
    a_stats.impressions AS paid_impressions,
    s_stats.creators AS sponsored_creators,
    s_stats.content_pieces
FROM brand_ads_fashion a
JOIN sponsored_content s
    ON lower(s.sponsor_name) LIKE '%' || lower(split_part(a.paying_advertiser_name, ' ', 1)) || '%'
    AND length(split_part(a.paying_advertiser_name, ' ', 1)) >= 4
JOIN (
    SELECT paying_advertiser_name, count(*) AS ads, sum(impressions_total) AS impressions
    FROM brand_ads_fashion GROUP BY paying_advertiser_name
) a_stats ON a.paying_advertiser_name = a_stats.paying_advertiser_name
JOIN (
    SELECT sponsor_name, count(DISTINCT creator_name) AS creators, count(*) AS content_pieces
    FROM sponsored_content WHERE sponsor_name != '' GROUP BY sponsor_name
) s_stats ON s.sponsor_name = s_stats.sponsor_name
ORDER BY a_stats.impressions DESC;

-- Brands only in paid ads (no sponsored content detected)
SELECT '--- Top paid brands with NO sponsored content match ---' AS report;

SELECT
    a.paying_advertiser_name AS brand,
    a.ads,
    a.impressions,
    'paid_only' AS presence
FROM (
    SELECT paying_advertiser_name, count(*) AS ads, sum(impressions_total) AS impressions
    FROM brand_ads_fashion GROUP BY paying_advertiser_name
) a
WHERE NOT EXISTS (
    SELECT 1 FROM sponsored_content s
    WHERE lower(s.sponsor_name) LIKE '%' || lower(split_part(a.paying_advertiser_name, ' ', 1)) || '%'
    AND length(split_part(a.paying_advertiser_name, ' ', 1)) >= 4
    AND s.sponsor_name != ''
)
ORDER BY a.impressions DESC
LIMIT 15;
