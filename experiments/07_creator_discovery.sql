-- Experiment 7: Creator Discovery & Reach
-- Verify what creator metrics we can actually access for influencer intelligence.

.mode markdown
.headers on

SELECT '=== Experiment 7: Creator Discovery & Reach ===' AS report;

-- Cross-table creator enrichment: can we link sponsored creators to profile data?
SELECT '--- Sponsored creators with profile data ---' AS report;

SELECT
    count(DISTINCT s.creator_name) AS sponsored_creators_total,
    count(DISTINCT CASE WHEN e.username IS NOT NULL THEN s.creator_name END) AS also_in_explore,
    count(DISTINCT CASE WHEN b.username IS NOT NULL THEN s.creator_name END) AS also_in_brand_profiles
FROM (SELECT DISTINCT creator_name FROM sponsored_content) s
LEFT JOIN explore_subscribe_profiles e ON lower(s.creator_name) = lower(e.username)
LEFT JOIN brand_profiles b ON lower(s.creator_name) = lower(b.username);

-- Explore creators: subscriber tiers
SELECT '--- Creator subscriber tiers (explore discovery) ---' AS report;

WITH tiered AS (
    SELECT
        CASE
            WHEN subscriber_count > 1000000 THEN 'mega (1M+)'
            WHEN subscriber_count > 100000 THEN 'macro (100K-1M)'
            WHEN subscriber_count > 10000 THEN 'mid (10K-100K)'
            WHEN subscriber_count > 1000 THEN 'micro (1K-10K)'
            ELSE 'nano (<1K)'
        END AS tier,
        subscriber_count
    FROM explore_subscribe_profiles
)
SELECT
    tier,
    count(*) AS creators,
    round(avg(subscriber_count), 0) AS avg_subscribers,
    max(subscriber_count) AS max_subscribers
FROM tiered
GROUP BY tier
ORDER BY max_subscribers DESC;

-- Spotlight engagement by keyword/topic
SELECT '--- Spotlight engagement by topic ---' AS report;

SELECT
    keyword,
    count(*) AS videos,
    count(DISTINCT creator_username) AS creators,
    sum(view_count) AS total_views,
    round(avg(view_count), 0) AS avg_views,
    sum(share_count) AS total_shares
FROM explore_spotlight_creators
WHERE view_count > 0
GROUP BY keyword
ORDER BY total_views DESC;

-- Brand Spotlight content: which brands create their own Spotlight content?
SELECT '--- Brands with Spotlight content ---' AS report;

SELECT
    brand, username, spotlight_count, subscriber_count
FROM brand_profiles
WHERE spotlight_count > 0
ORDER BY spotlight_count DESC
LIMIT 20;
