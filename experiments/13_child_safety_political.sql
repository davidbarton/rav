-- Experiment 13: Child Safety & Political Misuse Analysis
-- Validates claims in BUSINESS_ANALYSIS.md §4.9 and §4.10

.mode markdown
.headers on

-- Q1: Child safety moderation — combined view
SELECT category, count(*) AS decisions,
    round(100.0 * count(*) / (SELECT count(*) FROM ec_dsa_sor), 2) AS pct_of_all
FROM ec_dsa_sor
WHERE category IN (
    'STATEMENT_CATEGORY_PORNOGRAPHY_OR_SEXUALIZED_CONTENT',
    'STATEMENT_CATEGORY_PROTECTION_OF_MINORS'
)
GROUP BY category
ORDER BY decisions DESC;

-- Q2: Child safety temporal trends (monthly)
SELECT date_trunc('month', application_date) AS month,
    count(CASE WHEN category = 'STATEMENT_CATEGORY_PORNOGRAPHY_OR_SEXUALIZED_CONTENT' THEN 1 END) AS porn_decisions,
    count(CASE WHEN category = 'STATEMENT_CATEGORY_PROTECTION_OF_MINORS' THEN 1 END) AS minor_decisions
FROM ec_dsa_sor
WHERE category IN (
    'STATEMENT_CATEGORY_PORNOGRAPHY_OR_SEXUALIZED_CONTENT',
    'STATEMENT_CATEGORY_PROTECTION_OF_MINORS'
)
GROUP BY month
ORDER BY month;

-- Q3: Child safety content types
SELECT category, content_type, count(*) AS n,
    round(100.0 * count(*) / sum(count(*)) OVER (PARTITION BY category), 1) AS pct
FROM ec_dsa_sor
WHERE category IN (
    'STATEMENT_CATEGORY_PORNOGRAPHY_OR_SEXUALIZED_CONTENT',
    'STATEMENT_CATEGORY_PROTECTION_OF_MINORS'
)
GROUP BY category, content_type
ORDER BY category, n DESC;

-- Q4: Child safety enforcement actions
SELECT category, decision_visibility, count(*) AS n
FROM ec_dsa_sor
WHERE category IN (
    'STATEMENT_CATEGORY_PORNOGRAPHY_OR_SEXUALIZED_CONTENT',
    'STATEMENT_CATEGORY_PROTECTION_OF_MINORS'
)
GROUP BY category, decision_visibility
ORDER BY category, n DESC;

-- Q5: CSEA user reports and enforcement
SELECT policy, reports, enforcements,
    round(100.0 * enforcements / NULLIF(reports, 0), 2) AS enforcement_pct
FROM global_user_reports_by_policy
WHERE lower(policy) LIKE '%child%' OR lower(policy) LIKE '%sexual%';

-- Q6: CSEA proactive detection
SELECT policy, enforcements, unique_accounts, median_turnaround_min
FROM global_proactive_detection
WHERE lower(policy) LIKE '%child%' OR lower(policy) LIKE '%sexual%';

-- Q7: CSEA global enforcements
SELECT * FROM global_enforcements_by_policy
WHERE lower(policy) LIKE '%child%' OR lower(policy) LIKE '%sexual%';

-- Q8: Legal ground classification (T&C vs illegal)
SELECT decision_ground, count(*) AS n,
    round(100.0 * count(*) / (SELECT count(*) FROM ec_dsa_sor), 3) AS pct
FROM ec_dsa_sor
GROUP BY decision_ground
ORDER BY n DESC;

-- Q9: Political ads overview
SELECT count(*) AS total_political_ads,
    count(DISTINCT paying_advertiser) AS unique_advertisers,
    count(DISTINCT country) AS countries,
    min(start_date)::date AS earliest,
    max(start_date)::date AS latest,
    sum(impressions) AS total_impressions,
    sum(spend) AS total_spend
FROM political_ads;

-- Q10: Top political advertisers by spend
SELECT paying_advertiser, org_name, count(*) AS ads,
    sum(spend) AS total_spend, sum(impressions) AS total_imp,
    count(DISTINCT country) AS countries
FROM political_ads
GROUP BY paying_advertiser, org_name
ORDER BY total_spend DESC
LIMIT 20;

-- Q11: Political ads by country
SELECT country, count(*) AS ads, sum(spend) AS total_spend,
    sum(impressions) AS total_imp,
    count(DISTINCT paying_advertiser) AS advertisers
FROM political_ads
GROUP BY country
ORDER BY total_spend DESC
LIMIT 15;

-- Q12: B2C brands running political ads
SELECT paying_advertiser, org_name, count(*) AS ads,
    sum(spend) AS total_spend, sum(impressions) AS total_imp,
    count(DISTINCT country) AS countries
FROM political_ads
WHERE lower(paying_advertiser) IN (
    'ben & jerry''s', 'unilever', 'general mills', 'patagonia',
    'pepsi', 'dove', 'nike', 'team snapchat'
)
OR lower(org_name) LIKE '%unilever%'
OR lower(org_name) LIKE '%general mills%'
GROUP BY paying_advertiser, org_name
ORDER BY total_spend DESC;

-- Q13: Political ads quarterly trends
SELECT date_trunc('quarter', start_date) AS quarter,
    count(*) AS ads, sum(spend) AS total_spend, sum(impressions) AS total_imp
FROM political_ads
WHERE start_date >= '2022-01-01'
GROUP BY quarter
ORDER BY quarter;

-- Q14: Political targeting — interest segments
SELECT interests, count(*) AS ads, sum(spend) AS total_spend
FROM political_ads
WHERE interests IS NOT NULL AND interests != '' AND interests != '[]'
GROUP BY interests
ORDER BY total_spend DESC
LIMIT 15;

-- Q15: Political targeting — gender
SELECT target_gender, count(*) AS ads, sum(spend) AS total_spend
FROM political_ads
WHERE target_gender IS NOT NULL AND target_gender != ''
GROUP BY target_gender
ORDER BY total_spend DESC;

-- Q16: Civic discourse temporal trends
SELECT date_trunc('month', application_date) AS month, count(*) AS decisions
FROM ec_dsa_sor
WHERE category = 'STATEMENT_CATEGORY_NEGATIVE_EFFECTS_ON_CIVIC_DISCOURSE_OR_ELECTIONS'
GROUP BY month
ORDER BY month;

-- Q17: Suspicious advertiser names with emojis in brand ads
SELECT paying_advertiser_name, count(*) AS ads, sum(impressions_total) AS total_imp
FROM brand_ads_fashion
WHERE paying_advertiser_name LIKE '%✨%' OR paying_advertiser_name LIKE '%💯%'
    OR paying_advertiser_name LIKE '%🔥%' OR paying_advertiser_name LIKE '%🎶%'
    OR paying_advertiser_name LIKE '%💎%' OR paying_advertiser_name LIKE '%🌺%'
GROUP BY paying_advertiser_name
ORDER BY total_imp DESC;

-- Q18: Moderation staffing — internal vs external moderators
SELECT indicator, scope, value
FROM eu_dsa_human_resources
WHERE scope = 'Total number' OR (indicator LIKE '%total moderators%' AND value > 0)
ORDER BY value DESC;

-- Q19: Government (Member State) orders
SELECT "Scope" AS country,
    CAST("Number of orders to act against illegal content received" AS INTEGER) AS content_orders,
    CAST("Number of orders to provide information" AS INTEGER) AS info_orders
FROM eu_dsa_member_state_orders
WHERE "Scope" NOT LIKE 'Total%' AND "Scope" != ''
    AND (CAST("Number of orders to act against illegal content received" AS INTEGER) > 0
        OR CAST("Number of orders to provide information" AS INTEGER) > 0)
ORDER BY info_orders DESC;

-- Q20: Own-initiative illegal content actions (should be zero)
SELECT "Category of illegal content" AS category,
    CAST("Number of measures taken at the provider's own initiative" AS INTEGER) AS own_initiative
FROM eu_dsa_own_initiative_illegal
WHERE "Category of illegal content" = 'TOTAL';

-- Q21: Norway per-capita political spend
SELECT country, sum(spend) AS total_spend,
    round(sum(spend) / 5400000.0, 2) AS per_capita,
    round(sum(spend) / 4483080.0, 2) AS per_snap_user,
    count(*) AS ads
FROM political_ads
WHERE country = 'norway'
GROUP BY country;

-- Q22: Norwegian election Q3 2025 detail
SELECT paying_advertiser, count(*) AS ads, sum(spend) AS total_spend
FROM political_ads
WHERE country = 'norway'
    AND start_date >= '2025-07-01' AND start_date < '2025-10-01'
GROUP BY paying_advertiser
ORDER BY total_spend DESC
LIMIT 10;

-- Q23: Report source analysis — who triggers moderation decisions?
SELECT source_type, count(*) AS n,
    round(100.0 * count(*) / (SELECT count(*) FROM ec_dsa_sor), 1) AS pct
FROM ec_dsa_sor
GROUP BY source_type
ORDER BY n DESC;

-- Q24: Account enforcement by category — who gets banned?
SELECT category,
    count(CASE WHEN decision_account = 'DECISION_ACCOUNT_SUSPENDED' THEN 1 END) AS suspended,
    count(CASE WHEN decision_account = 'DECISION_ACCOUNT_TERMINATED' THEN 1 END) AS terminated,
    count(*) AS total,
    round(100.0 * count(CASE WHEN decision_account = 'DECISION_ACCOUNT_SUSPENDED' THEN 1 END) / count(*), 1) AS suspend_pct
FROM ec_dsa_sor
GROUP BY category
ORDER BY suspend_pct DESC;

-- Q25: Trusted Flagger activity by category
SELECT category, count(*) AS tf_reports
FROM ec_dsa_sor
WHERE source_type = 'SOURCE_TRUSTED_FLAGGER'
GROUP BY category
ORDER BY tf_reports DESC;

-- Q26: VVR (Violating Views Rate) — brand safety exposure metric
SELECT policy, enforcements, vvr_pct,
    round(vvr_pct * 100, 4) AS vvr_pct_readable
FROM global_enforcements_by_policy
ORDER BY vvr_pct DESC;

-- Q27: Political CPM ground truth by country
SELECT country, count(*) AS ads,
    sum(spend) AS total_spend, sum(impressions) AS total_imp,
    round(1000.0 * sum(spend) / NULLIF(sum(impressions), 0), 2) AS cpm,
    min(currency) AS currency
FROM political_ads
WHERE impressions > 0 AND spend > 0
GROUP BY country
HAVING count(*) > 50
ORDER BY cpm DESC
LIMIT 15;

-- Q28: Automated means disclosure — total decisions and self-reported accuracy
SELECT indicator, scope, CAST(value AS VARCHAR) AS val, context
FROM eu_dsa_automated_means
WHERE scope LIKE '%Total%' OR scope LIKE '%Own%' OR scope LIKE '%NAM%'
ORDER BY indicator, scope;

-- Q29: DSA notice response times by category with Trusted Flagger comparison
SELECT "Category of illegal content" AS category,
    CAST("Number of notices received" AS INTEGER) AS notices,
    CAST("Number of notices received from Trusted flaggers" AS INTEGER) AS tf_notices,
    CAST("Median time to take action" AS INTEGER) AS median_hrs,
    CAST("Median time to take action (Trusted Flagger notices)" AS INTEGER) AS tf_median_hrs
FROM eu_dsa_notices
WHERE "Category of illegal content" != 'TOTAL'
    AND CAST("Number of notices received" AS INTEGER) > 0
ORDER BY CAST("Number of notices received" AS INTEGER) DESC
LIMIT 15;
