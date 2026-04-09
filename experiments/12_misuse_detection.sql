-- Experiment 12: Misuse Detection & Brand Safety Analysis
-- Analyzes platform moderation data, scam patterns, impersonation risks,
-- fake influencer signals, and brand safety metrics from DSA transparency data.

.mode markdown
.headers on

SELECT '=== Experiment 12: Misuse Detection & Brand Safety ===' AS report;

-- 1. Platform risk landscape: content moderation by category
SELECT '--- Content moderation by category ---' AS report;

SELECT category, count(*) AS decisions,
    round(100.0 * count(*) / (SELECT count(*) FROM ec_dsa_sor), 1) AS pct_of_total
FROM ec_dsa_sor
GROUP BY category
ORDER BY decisions DESC;

-- 2. Scams & fraud: breakdown by content type
SELECT '--- Scam content by type ---' AS report;

SELECT content_type, count(*) AS n,
    round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct
FROM ec_dsa_sor
WHERE category = 'STATEMENT_CATEGORY_SCAMS_AND_FRAUD'
GROUP BY content_type
ORDER BY n DESC;

-- 3. Automation in moderation: how much is AI vs human?
SELECT '--- Moderation automation rates ---' AS report;

SELECT automated_detection, automated_decision,
    count(*) AS decisions,
    round(100.0 * count(*) / (SELECT count(*) FROM ec_dsa_sor), 1) AS pct
FROM ec_dsa_sor
GROUP BY automated_detection, automated_decision
ORDER BY decisions DESC;

-- 4. Temporal trends: monthly moderation activity
SELECT '--- Monthly moderation trends (key categories) ---' AS report;

SELECT date_trunc('quarter', application_date) AS quarter,
    count(*) AS total,
    sum(CASE WHEN category = 'STATEMENT_CATEGORY_SCAMS_AND_FRAUD' THEN 1 ELSE 0 END) AS scams,
    sum(CASE WHEN category = 'STATEMENT_CATEGORY_UNSAFE_AND_ILLEGAL_PRODUCTS' THEN 1 ELSE 0 END) AS unsafe_products,
    sum(CASE WHEN category = 'STATEMENT_CATEGORY_INTELLECTUAL_PROPERTY_INFRINGEMENTS' THEN 1 ELSE 0 END) AS ip_violations,
    sum(CASE WHEN category = 'STATEMENT_CATEGORY_NEGATIVE_EFFECTS_ON_CIVIC_DISCOURSE_OR_ELECTIONS' THEN 1 ELSE 0 END) AS disinfo
FROM ec_dsa_sor
WHERE application_date IS NOT NULL AND application_date >= '2024-01-01'
GROUP BY quarter
ORDER BY quarter;

-- 5. Decision types: what enforcement actions are taken?
SELECT '--- Enforcement action types ---' AS report;

SELECT decision_visibility, count(*) AS n,
    round(100.0 * count(*) / (SELECT count(*) FROM ec_dsa_sor), 1) AS pct
FROM ec_dsa_sor
GROUP BY decision_visibility
ORDER BY n DESC;

-- 6. Report sources: who triggers moderation?
SELECT '--- Report source breakdown ---' AS report;

SELECT source_type, count(*) AS n,
    round(100.0 * count(*) / (SELECT count(*) FROM ec_dsa_sor), 1) AS pct
FROM ec_dsa_sor
GROUP BY source_type
ORDER BY n DESC;

-- 7. User report enforcement rates by policy
SELECT '--- User reports vs enforcement by policy ---' AS report;

SELECT policy, reports, enforcements,
    round(100.0 * enforcements / NULLIF(reports, 0), 1) AS enforcement_rate_pct,
    unique_accounts,
    median_turnaround_min
FROM global_user_reports_by_policy
ORDER BY reports DESC;

-- 8. Ad moderation stats
SELECT '--- Ad moderation ---' AS report;

SELECT * FROM global_ads_moderation;

-- 9. Brand name misuse: third-party advertisers using brand names in ad names
SELECT '--- Potential brand name misuse in ads ---' AS report;

SELECT a.paying_advertiser_name, a.ad_name, a.impressions_total, a.country, a.creative_type
FROM brand_ads_fashion a
WHERE lower(a.paying_advertiser_name) LIKE '%coco%'
ORDER BY impressions_total DESC;

-- 10. Multi-sponsor creators: potential professional promotion accounts
SELECT '--- High-volume multi-sponsor creators ---' AS report;

SELECT creator_name,
    count(DISTINCT sponsor_name) AS sponsors,
    count(*) AS total_content,
    count(CASE WHEN content_type = 'SPOTLIGHT' THEN 1 END) AS spotlights,
    count(CASE WHEN content_type = 'STORY' THEN 1 END) AS stories
FROM sponsored_content
WHERE sponsor_name IS NOT NULL AND sponsor_name != ''
GROUP BY creator_name
HAVING count(DISTINCT sponsor_name) >= 5
ORDER BY sponsors DESC
LIMIT 15;

-- 11. Impersonation: global enforcement stats
SELECT '--- Impersonation enforcement ---' AS report;

SELECT policy, enforcements, unique_accounts, median_turnaround_min
FROM global_enforcements_by_policy
WHERE policy = 'Impersonation';

-- 12. False information enforcement
SELECT '--- False information enforcement ---' AS report;

SELECT policy, reports, enforcements,
    round(100.0 * enforcements / NULLIF(reports, 0), 2) AS enforcement_rate_pct,
    median_turnaround_min
FROM global_user_reports_by_policy
WHERE policy IN ('False Information', 'Impersonation', 'Spam');

-- 13. EU per-country user base (market sizing)
SELECT '--- EU per-country Snapchat users ---' AS report;

SELECT scope AS country, value AS monthly_users
FROM eu_dsa_amar
WHERE scope != 'TOTAL'
ORDER BY value DESC;

-- 14. Appeal/overturn rates
SELECT '--- Appeal statistics ---' AS report;

SELECT section, indicator, scope, value
FROM eu_dsa_appeals
WHERE scope IN ('Total number', 'Decisions upheld', 'Decisions reversed', 'Median time')
ORDER BY section, indicator;
