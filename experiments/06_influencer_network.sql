-- Experiment 6: Influencer Network Analysis
-- Map creator-sponsor relationships and identify competitive patterns.

.mode markdown
.headers on

SELECT '=== Experiment 6: Influencer Network Analysis ===' AS report;

-- Top sponsors by creator breadth
SELECT '--- Top sponsors by unique creator partnerships ---' AS report;

SELECT
    sponsor_name,
    count(DISTINCT creator_name) AS creators,
    count(*) AS content_pieces,
    count(DISTINCT content_type) AS formats
FROM sponsored_content
WHERE sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2
GROUP BY sponsor_name
ORDER BY creators DESC
LIMIT 15;

-- Multi-brand creators (work with most sponsors)
SELECT '--- Most active multi-brand creators ---' AS report;

SELECT
    creator_name,
    count(DISTINCT sponsor_name) AS brands_worked_with,
    count(*) AS total_pieces,
    list(DISTINCT sponsor_name ORDER BY sponsor_name) AS brand_list
FROM sponsored_content
WHERE sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2
GROUP BY creator_name
HAVING count(DISTINCT sponsor_name) >= 5
ORDER BY brands_worked_with DESC
LIMIT 10;

-- Creator exclusivity: how many creators work with only one sponsor?
SELECT '--- Creator exclusivity distribution ---' AS report;

WITH creator_sponsors AS (
    SELECT creator_name, count(DISTINCT sponsor_name) AS sponsor_count
    FROM sponsored_content
    WHERE sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2
    GROUP BY creator_name
)
SELECT
    CASE
        WHEN sponsor_count = 1 THEN '1 (exclusive)'
        WHEN sponsor_count = 2 THEN '2'
        WHEN sponsor_count BETWEEN 3 AND 5 THEN '3-5'
        WHEN sponsor_count > 5 THEN '6+'
    END AS sponsors_bucket,
    count(*) AS creators,
    round(100.0 * count(*) / (SELECT count(*) FROM creator_sponsors), 1) AS pct
FROM creator_sponsors
GROUP BY sponsors_bucket
ORDER BY min(sponsor_count);

-- Content volume distribution
SELECT '--- Sponsored content volume per creator ---' AS report;

WITH creator_vol AS (
    SELECT creator_name, count(*) AS pieces
    FROM sponsored_content
    WHERE sponsor_name != '' AND sponsor_name IS NOT NULL
    GROUP BY creator_name
)
SELECT
    CASE
        WHEN pieces = 1 THEN '1 piece'
        WHEN pieces BETWEEN 2 AND 5 THEN '2-5 pieces'
        WHEN pieces BETWEEN 6 AND 20 THEN '6-20 pieces'
        WHEN pieces BETWEEN 21 AND 50 THEN '21-50 pieces'
        WHEN pieces > 50 THEN '50+ pieces'
    END AS volume_bucket,
    count(*) AS creators,
    sum(pieces) AS total_content
FROM creator_vol
GROUP BY volume_bucket
ORDER BY min(pieces);
