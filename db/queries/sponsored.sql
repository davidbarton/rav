-- Sponsored content exploration queries.
-- Run: duckdb rav.db < db/queries/sponsored.sql

-- ── Overview ──
SELECT count(*) AS total_posts FROM sponsored_content;

-- ── Sponsors with most posts ──
SELECT
    sponsor_name,
    count(*) AS posts,
    count(DISTINCT creator_name) AS creators
FROM sponsored_content
WHERE sponsor_name != ''
GROUP BY sponsor_name
ORDER BY posts DESC
LIMIT 30;

-- ── Top creators by post count ──
SELECT
    creator_name,
    count(*) AS posts,
    count(DISTINCT sponsor_name) AS sponsors
FROM sponsored_content
GROUP BY creator_name
ORDER BY posts DESC
LIMIT 30;

-- ── Sponsor ↔ Creator pairs ──
SELECT
    sponsor_name,
    creator_name,
    count(*) AS collabs
FROM sponsored_content
WHERE sponsor_name != ''
GROUP BY sponsor_name, creator_name
ORDER BY collabs DESC
LIMIT 30;

-- ── Content type distribution ──
SELECT
    content_type,
    count(*) AS posts,
    round(count(*) * 100.0 / sum(count(*)) OVER (), 1) AS pct
FROM sponsored_content
GROUP BY content_type
ORDER BY posts DESC;

-- ── Posts without a sponsor (organic/unbranded) ──
SELECT
    count(*) AS unbranded_posts,
    round(count(*) * 100.0 / (SELECT count(*) FROM sponsored_content), 1) AS pct
FROM sponsored_content
WHERE sponsor_name = '' OR sponsor_name IS NULL;

-- ── Unique sponsors list (for Ads Search advertiser enumeration) ──
SELECT DISTINCT sponsor_name
FROM sponsored_content
WHERE sponsor_name != '' AND sponsor_name IS NOT NULL
ORDER BY sponsor_name;
