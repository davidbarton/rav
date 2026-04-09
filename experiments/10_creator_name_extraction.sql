-- Experiment 10: Creator Name Extraction from Ad Naming Conventions
-- Extracts specific creator identities embedded in paid ad names.
-- Different brands use different patterns:
--   HUGO BOSS: BLACK/COLLAB/SPTL/30_SEC/9X16/SOCI/INFL/JAYDE_PIERCE
--   CAIAcosmetics: s:creator | c:biancaingrosso | p:liquid_blush
--   Wild Cosmetics: UGCPOD_GRETA
--   Birkenstock: AldaraReel_PartnershipAd
--   Givenchy: SULIVAN-PARTNERSHIPAD

.mode markdown
.headers on

SELECT '=== Experiment 10: Creator Name Extraction ===' AS report;

-- All identifiable brand-creator pairs
SELECT '--- Identified brand-creator pairs from ad naming conventions ---' AS report;

SELECT
    ANY_VALUE(paying_advertiser_name) AS brand,
    CASE
        WHEN ad_name LIKE '%JAYDE_PIERCE%' THEN 'Jayde Pierce'
        WHEN ad_name LIKE '%JULIEN_BROWN%' THEN 'Julien Brown'
        WHEN ad_name LIKE '%biancaingrosso%' THEN 'Bianca Ingrosso'
        WHEN ad_name LIKE '%basma_bada%' THEN 'Basma Bada'
        WHEN ad_name LIKE '%sabinasarkka%' THEN 'Sabina Sarkka'
        WHEN ad_name LIKE '%Iamangejose%' THEN 'Ange Jose'
        WHEN ad_name LIKE '%UGCPOD_GRETA%' THEN 'Greta'
        WHEN ad_name LIKE '%UGCPOD_CLARA%' THEN 'Clara'
        WHEN ad_name LIKE '%UGCPOD_LAUREN%' THEN 'Lauren'
        WHEN ad_name LIKE '%UGCPOD_LEWIS%' THEN 'Lewis'
        WHEN ad_name LIKE '%AldaraReel%' THEN 'Aldara'
        WHEN ad_name LIKE '%SULIVAN%' THEN 'Sullivan'
        WHEN ad_name LIKE '%LARAGCV%' THEN 'Lara GCV'
    END AS creator_identified,
    count(DISTINCT ad_id) AS unique_ads,
    sum(impressions_total) AS total_impressions,
    round(sum(impressions_total) * 4.0 / 1000, 0) AS est_spend_low_eur,
    round(sum(impressions_total) * 9.0 / 1000, 0) AS est_spend_high_eur
FROM brand_ads_fashion
WHERE ad_name LIKE '%JAYDE_PIERCE%' OR ad_name LIKE '%JULIEN_BROWN%'
   OR ad_name LIKE '%biancaingrosso%' OR ad_name LIKE '%basma_bada%'
   OR ad_name LIKE '%sabinasarkka%' OR ad_name LIKE '%Iamangejose%'
   OR ad_name LIKE '%UGCPOD_GRETA%' OR ad_name LIKE '%UGCPOD_CLARA%'
   OR ad_name LIKE '%UGCPOD_LAUREN%' OR ad_name LIKE '%UGCPOD_LEWIS%'
   OR ad_name LIKE '%AldaraReel%' OR ad_name LIKE '%SULIVAN%'
   OR ad_name LIKE '%LARAGCV%'
GROUP BY creator_identified
ORDER BY total_impressions DESC;

-- Unsponsored creator database: activity distribution
SELECT '--- Unsponsored creator activity levels ---' AS report;

WITH creator_activity AS (
    SELECT creator_name,
           count(*) AS pieces,
           count(DISTINCT content_type) AS format_types
    FROM sponsored_content
    WHERE sponsor_name = '' OR sponsor_name IS NULL
    GROUP BY creator_name
)
SELECT
    CASE
        WHEN pieces = 1 THEN '1 piece'
        WHEN pieces BETWEEN 2 AND 5 THEN '2-5 pieces'
        WHEN pieces BETWEEN 6 AND 20 THEN '6-20 pieces'
        WHEN pieces BETWEEN 21 AND 50 THEN '21-50 pieces'
        WHEN pieces > 50 THEN '50+ pieces'
    END AS activity_level,
    count(*) AS creators,
    sum(pieces) AS total_content,
    count(CASE WHEN format_types > 1 THEN 1 END) AS uses_both_formats
FROM creator_activity
GROUP BY activity_level
ORDER BY min(pieces);

-- Overlap: creators with both sponsored and unsponsored content
SELECT '--- Creators with both sponsored and unsponsored content ---' AS report;

SELECT
    count(DISTINCT s.creator_name) AS creators_with_both,
    round(avg(s.sponsored_pieces), 1) AS avg_sponsored_pieces,
    round(avg(u.unsponsored_pieces), 1) AS avg_unsponsored_pieces
FROM (
    SELECT creator_name, count(*) AS sponsored_pieces
    FROM sponsored_content
    WHERE sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2
    GROUP BY creator_name
) s
JOIN (
    SELECT creator_name, count(*) AS unsponsored_pieces
    FROM sponsored_content
    WHERE sponsor_name = '' OR sponsor_name IS NULL
    GROUP BY creator_name
) u ON s.creator_name = u.creator_name;

-- Targeting analysis: do creator ads target differently?
SELECT '--- Targeting on Birkenstock creator vs brand ads ---' AS report;

WITH typed AS (
    SELECT
        CASE WHEN lower(ad_name) LIKE '%creator%' OR lower(ad_name) LIKE '%partnership%'
             THEN 'creator' ELSE 'brand' END AS ad_type,
        impressions_total,
        targeting_v2.demographics[1].min_age AS min_age,
        targeting_v2.demographics[1].max_age AS max_age
    FROM brand_ads_fashion
    WHERE paying_advertiser_name = 'Birkenstock Digital GmbH'
)
SELECT
    ad_type,
    count(*) AS ads,
    round(avg(impressions_total), 0) AS avg_impressions,
    list(DISTINCT min_age) AS min_ages,
    list(DISTINCT max_age) AS max_ages
FROM typed
GROUP BY ad_type;
