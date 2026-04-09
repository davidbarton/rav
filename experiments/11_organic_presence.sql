-- Experiment 11: Organic Presence Analysis
-- Analyzes brand profile maturity, content strategy, engagement efficiency,
-- username squatting, and paid-organic alignment.

.mode markdown
.headers on

SELECT '=== Experiment 11: Organic Presence Analysis ===' AS report;

-- 1. Brand classification: 5-tier maturity model
SELECT '--- Brand maturity classification ---' AS report;

WITH classified AS (
    SELECT brand, username, title, subscriber_count, spotlight_count,
        CASE
            WHEN subscriber_count > 0 AND spotlight_count > 0 THEN 'A: active (subs + content)'
            WHEN subscriber_count > 0 THEN 'B: audience only'
            WHEN spotlight_count > 0 AND (
                lower(title) LIKE '%' || lower(brand) || '%'
                OR lower(brand) LIKE '%' || lower(title) || '%'
            ) THEN 'C: content producer'
            WHEN lower(title) NOT LIKE '%' || lower(brand) || '%'
                 AND lower(brand) NOT LIKE '%' || lower(title) || '%'
                 THEN 'E: username squatted'
            WHEN spotlight_count = 0 AND subscriber_count = 0 THEN 'D: dormant'
            ELSE 'F: other'
        END AS tier
    FROM brand_profiles
)
SELECT tier, count(*) AS brands
FROM classified
GROUP BY tier
ORDER BY tier;

-- 2. Username squatting: brand usernames held by personal accounts
SELECT '--- Username squatting detection ---' AS report;

SELECT brand, username, title
FROM brand_profiles
WHERE subscriber_count = 0
AND lower(title) NOT LIKE '%' || lower(brand) || '%'
AND lower(brand) NOT LIKE '%' || lower(title) || '%'
ORDER BY brand;

-- 3. Profile completeness scoring
SELECT '--- Profile completeness scoring (top 20) ---' AS report;

SELECT
    brand, subscriber_count,
    (CASE WHEN bio IS NOT NULL AND bio != '' THEN 1 ELSE 0 END +
     CASE WHEN category IS NOT NULL AND category != '' THEN 1 ELSE 0 END +
     CASE WHEN website_url IS NOT NULL AND website_url != '' THEN 1 ELSE 0 END +
     CASE WHEN hero_image_url IS NOT NULL AND hero_image_url != '' THEN 1 ELSE 0 END +
     CASE WHEN has_story = true THEN 1 ELSE 0 END +
     CASE WHEN has_curated_highlights = true THEN 1 ELSE 0 END +
     CASE WHEN has_spotlight_highlights = true THEN 1 ELSE 0 END +
     CASE WHEN spotlight_count > 0 THEN 1 ELSE 0 END) AS score_of_8,
    spotlight_count
FROM brand_profiles
ORDER BY score_of_8 DESC, subscriber_count DESC
LIMIT 20;

-- 4. Engagement efficiency: rates per brand
SELECT '--- Engagement rates (brands with views > 0) ---' AS report;

SELECT brand,
    count(*) AS videos,
    sum(view_count) AS views,
    round(100.0 * sum(share_count) / sum(view_count), 2) AS share_rate_pct,
    round(100.0 * sum(boost_count) / sum(view_count), 2) AS boost_rate_pct,
    round(100.0 * sum(comment_count) / sum(view_count), 3) AS comment_rate_pct,
    round(avg(duration_ms / 1000.0), 1) AS avg_duration_s
FROM brand_profile_spotlights
WHERE view_count > 0
GROUP BY brand
ORDER BY views DESC;

-- 5. Duration sweet spot
SELECT '--- Duration vs performance ---' AS report;

WITH dur AS (
    SELECT
        CASE
            WHEN duration_ms < 10000 THEN '1: <10s'
            WHEN duration_ms < 20000 THEN '2: 10-20s'
            WHEN duration_ms < 30000 THEN '3: 20-30s'
            WHEN duration_ms < 60000 THEN '4: 30-60s'
            ELSE '5: 60s+'
        END AS bucket,
        view_count, share_count, boost_count
    FROM brand_profile_spotlights
    WHERE view_count > 0
)
SELECT bucket,
    count(*) AS videos,
    round(avg(view_count), 0) AS avg_views,
    round(avg(share_count), 0) AS avg_shares,
    round(avg(boost_count), 0) AS avg_boosts
FROM dur
GROUP BY bucket
ORDER BY bucket;

-- 6. Posting cadence and recency
SELECT '--- Posting cadence (active brands) ---' AS report;

SELECT brand,
    count(*) AS videos,
    min(uploaded_at)::date AS first_post,
    max(uploaded_at)::date AS last_post,
    round(extract(epoch FROM max(uploaded_at) - min(uploaded_at)) / 86400.0, 0) AS span_days,
    CASE WHEN count(*) > 1
         THEN round(extract(epoch FROM max(uploaded_at) - min(uploaded_at)) / 86400.0 / (count(*) - 1), 1)
         ELSE NULL END AS avg_days_between_posts
FROM brand_profile_spotlights
WHERE uploaded_at IS NOT NULL
GROUP BY brand
ORDER BY last_post DESC;

-- 7. Paid-organic alignment: top advertisers vs organic presence
SELECT '--- Paid vs organic alignment (top 15 advertisers) ---' AS report;

WITH top_advertisers AS (
    SELECT paying_advertiser_name AS advertiser,
           sum(impressions_total) AS paid_impressions,
           count(DISTINCT ad_id) AS ad_count
    FROM brand_ads_fashion
    GROUP BY paying_advertiser_name
    ORDER BY paid_impressions DESC
    LIMIT 15
)
SELECT
    ta.advertiser,
    ta.paid_impressions,
    bp.subscriber_count,
    bp.spotlight_count,
    CASE
        WHEN bp.username IS NULL THEN 'NO PROFILE SCRAPED'
        WHEN bp.subscriber_count > 0 AND bp.spotlight_count > 0 THEN 'ACTIVE'
        WHEN bp.spotlight_count > 0 THEN 'CONTENT ONLY'
        WHEN bp.subscriber_count > 0 THEN 'AUDIENCE ONLY'
        ELSE 'DORMANT'
    END AS organic_status
FROM top_advertisers ta
LEFT JOIN brand_profiles bp ON lower(ta.advertiser) LIKE '%' || lower(bp.brand) || '%'
    OR lower(bp.brand) LIKE '%' || lower(ta.advertiser) || '%'
ORDER BY ta.paid_impressions DESC;

-- 8. Content themes from LLM-generated titles
SELECT '--- Content themes (top viewed LLM-titled content) ---' AS report;

SELECT brand, llm_title, view_count
FROM brand_profile_spotlights
WHERE llm_title IS NOT NULL AND llm_title != '' AND view_count > 0
ORDER BY view_count DESC
LIMIT 15;

-- 9. Profile creation timeline (adoption waves)
SELECT '--- Platform adoption timeline ---' AS report;

SELECT
    CASE
        WHEN profile_created_at < '2020-01-01' THEN '2019 (early adopters)'
        WHEN profile_created_at < '2021-01-01' THEN '2020'
        WHEN profile_created_at < '2022-01-01' THEN '2021'
        WHEN profile_created_at < '2023-01-01' THEN '2022'
        WHEN profile_created_at < '2024-01-01' THEN '2023'
        WHEN profile_created_at < '2025-01-01' THEN '2024'
        ELSE '2025-2026'
    END AS year_group,
    count(*) AS brands,
    round(avg(subscriber_count), 0) AS avg_subscribers,
    count(CASE WHEN spotlight_count > 0 THEN 1 END) AS with_spotlights
FROM brand_profiles
WHERE profile_created_at IS NOT NULL
GROUP BY year_group
ORDER BY year_group;

-- 10. Verification status (badge field) vs performance
SELECT '--- Verification status vs performance ---' AS report;

SELECT badge AS verified,
    count(*) AS brands,
    round(avg(subscriber_count), 0) AS avg_subs,
    round(avg(spotlight_count), 0) AS avg_spotlights,
    sum(CASE WHEN subscriber_count > 0 THEN 1 ELSE 0 END) AS have_subscribers,
    sum(CASE WHEN spotlight_count > 0 THEN 1 ELSE 0 END) AS have_spotlights,
    sum(CASE WHEN website_url IS NOT NULL AND website_url != '' THEN 1 ELSE 0 END) AS have_website
FROM brand_profiles
GROUP BY badge;

-- 11. Profile completeness rates
SELECT '--- Profile completeness rates ---' AS report;

SELECT
    round(100.0 * avg(CASE WHEN badge = 1 THEN 1 ELSE 0 END), 1) AS pct_verified,
    round(100.0 * avg(CASE WHEN bio IS NOT NULL AND bio != '' THEN 1 ELSE 0 END), 1) AS pct_has_bio,
    round(100.0 * avg(CASE WHEN website_url IS NOT NULL AND website_url != '' THEN 1 ELSE 0 END), 1) AS pct_has_website,
    round(100.0 * avg(CASE WHEN address IS NOT NULL AND address != '' THEN 1 ELSE 0 END), 1) AS pct_has_address,
    round(100.0 * avg(CASE WHEN category IS NOT NULL AND category != '' THEN 1 ELSE 0 END), 1) AS pct_has_category,
    round(100.0 * avg(CASE WHEN hero_image_url IS NOT NULL AND hero_image_url != '' THEN 1 ELSE 0 END), 1) AS pct_has_hero
FROM brand_profiles;

-- 12. Squatted brands with active paid ad spend (cross-reference)
SELECT '--- Squatted brands with active paid spend ---' AS report;

SELECT bp.brand, bp.username, bp.title,
    sum(ba.paid_impressions) AS total_impressions,
    round(sum(ba.paid_impressions) * 6.5 / 1000, 0) AS est_spend_eur
FROM brand_profiles bp
JOIN (
    SELECT paying_advertiser_name,
           sum(impressions_total) AS paid_impressions
    FROM brand_ads_fashion
    GROUP BY paying_advertiser_name
) ba ON lower(ba.paying_advertiser_name) LIKE '%' || lower(bp.brand) || '%'
        OR lower(bp.brand) LIKE '%' || lower(ba.paying_advertiser_name) || '%'
WHERE bp.subscriber_count = 0
AND lower(bp.title) NOT LIKE '%' || lower(bp.brand) || '%'
AND lower(bp.brand) NOT LIKE '%' || lower(bp.title) || '%'
GROUP BY bp.brand, bp.username, bp.title
ORDER BY est_spend_eur DESC;

-- 13. Recommend (save) rate: luxury vs viral engagement
SELECT '--- Recommend rate (save signal) ---' AS report;

SELECT brand,
    sum(view_count) AS views,
    sum(recommend_count) AS recommends,
    round(100.0 * sum(recommend_count) / NULLIF(sum(view_count), 0), 3) AS recommend_rate_pct,
    round(100.0 * sum(boost_count) / NULLIF(sum(view_count), 0), 3) AS boost_rate_pct
FROM brand_profile_spotlights
WHERE view_count > 0
GROUP BY brand
HAVING sum(recommend_count) > 0
ORDER BY recommend_rate_pct DESC;

-- 14. Subcategory-based industry segmentation
SELECT '--- Industry segmentation from subcategories ---' AS report;

SELECT
    replace(replace(subcategory, 'public-profile-subcategory-v3-', ''), '-', ' ') AS industry,
    count(*) AS brands,
    round(avg(subscriber_count), 0) AS avg_subs,
    string_agg(brand, ', ' ORDER BY subscriber_count DESC) AS brand_list
FROM brand_profiles
WHERE subcategory IS NOT NULL AND subcategory != ''
GROUP BY subcategory
ORDER BY brands DESC;

-- 15. Organic share of total visibility
SELECT '--- Organic vs paid channel mix ---' AS report;

WITH organic AS (
    SELECT brand, sum(CASE WHEN view_count > 0 THEN view_count ELSE 0 END) AS organic_views
    FROM brand_profile_spotlights
    GROUP BY brand
),
paid AS (
    SELECT paying_advertiser_name AS brand_name, sum(impressions_total) AS paid_impressions
    FROM brand_ads_fashion
    GROUP BY paying_advertiser_name
)
SELECT o.brand, o.organic_views,
    max(COALESCE(p.paid_impressions, 0)) AS paid_impressions,
    round(100.0 * o.organic_views / NULLIF(o.organic_views + max(COALESCE(p.paid_impressions, 0)), 0), 1) AS organic_share_pct
FROM organic o
LEFT JOIN paid p ON lower(p.brand_name) LIKE '%' || lower(o.brand) || '%'
    OR lower(o.brand) LIKE '%' || lower(p.brand_name) || '%'
WHERE o.organic_views > 0
GROUP BY o.brand, o.organic_views
ORDER BY organic_share_pct DESC;
