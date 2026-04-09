-- Experiment 8: Influencer Enrichment Potential
-- Quantify how much richer the creator dataset could become
-- by running existing scrapers on sponsored creator usernames.

.mode markdown
.headers on

SELECT '=== Experiment 8: Influencer Enrichment Potential ===' AS report;

-- Current state: what do we actually know about sponsored creators?
SELECT '--- Current data per sponsored creator ---' AS report;

SELECT
    'sponsor_name + creator_name + content_url + content_type' AS fields_available,
    'view_count, follower_count, demographics, timestamps, engagement' AS fields_missing,
    count(DISTINCT creator_name) AS creators_affected,
    count(*) AS content_pieces
FROM sponsored_content
WHERE sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2;

-- Cross-table enrichment: current overlap
SELECT '--- Cross-table overlap (current) ---' AS report;

SELECT
    'sponsored_content' AS source_table,
    count(DISTINCT sc.creator_name) AS total_creators,
    count(DISTINCT CASE WHEN ep.username IS NOT NULL THEN sc.creator_name END) AS matched_in_explore_profiles,
    count(DISTINCT CASE WHEN esc.creator_username IS NOT NULL THEN sc.creator_name END) AS matched_in_explore_spotlights,
    count(DISTINCT CASE WHEN sp.creator_username IS NOT NULL THEN sc.creator_name END) AS matched_in_spotlight_pages,
    count(DISTINCT CASE WHEN bp.username IS NOT NULL THEN sc.creator_name END) AS matched_in_brand_profiles
FROM (SELECT DISTINCT creator_name FROM sponsored_content WHERE sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2) sc
LEFT JOIN explore_subscribe_profiles ep ON lower(sc.creator_name) = lower(ep.username)
LEFT JOIN explore_spotlight_creators esc ON lower(sc.creator_name) = lower(esc.creator_username)
LEFT JOIN spotlight_pages sp ON lower(sc.creator_name) = lower(sp.creator_username)
LEFT JOIN brand_profiles bp ON lower(sc.creator_name) = lower(bp.username);

-- Enrichment opportunity: profile scraping
SELECT '--- Enrichment via profile scraping (§5) ---' AS report;

SELECT
    count(DISTINCT creator_name) AS sponsored_creators_total,
    'snapchat.com/add/<username>' AS scrape_method,
    'follower_count, bio, category, spotlight_engagement, related_accounts' AS data_gained,
    '~800ms/request, no auth needed' AS effort,
    round(count(DISTINCT creator_name) * 0.8 / 60.0, 1) AS estimated_minutes
FROM sponsored_content
WHERE sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2;

-- Enrichment opportunity: spotlight page scraping  
SELECT '--- Enrichment via spotlight page scraping (§7) ---' AS report;

SELECT
    count(DISTINCT content_url) AS fetchable_spotlight_urls,
    'snapchat.com/spotlight/<id>' AS scrape_method,
    'view_count, share_count, transcript, comments' AS data_gained,
    '~800ms/request, no auth needed' AS effort,
    round(count(DISTINCT content_url) * 0.8 / 3600.0, 1) AS estimated_hours
FROM sponsored_content
WHERE content_type = 'SPOTLIGHT'
AND sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2;

-- Geographic signal: can we tell what region sponsored content comes from?
SELECT '--- Geographic signals in sponsored content ---' AS report;

SELECT
    'No geographic field exists' AS finding,
    'creator_url domain is always snapchat.com (global)' AS detail,
    'Sponsor names in Arabic → MENA region (inferred)' AS workaround,
    count(DISTINCT sponsor_name) AS total_sponsors,
    count(DISTINCT CASE WHEN sponsor_name ~ '[^\x00-\x7F]' THEN sponsor_name END) AS non_latin_sponsors,
    round(100.0 * count(DISTINCT CASE WHEN sponsor_name ~ '[^\x00-\x7F]' THEN sponsor_name END) / count(DISTINCT sponsor_name), 1) AS non_latin_pct
FROM sponsored_content
WHERE sponsor_name != '' AND sponsor_name IS NOT NULL AND length(sponsor_name) > 2;
