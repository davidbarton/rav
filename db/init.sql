-- DuckDB init: loads raw JSON/CSV into native tables inside db/rav.db.
-- Run from project root: duckdb db/rav.db < db/init.sql
-- Re-run after fetching new data — tables are dropped and rebuilt (full refresh).
--
-- Load paths: read_json_auto / read_csv_auto use cwd, not db/rav.db location. Run from
-- repo root, or set RAV_ROOT=/absolute/path/to/repo before running.

CREATE OR REPLACE MACRO rav_path(rel) AS (
    CASE WHEN NULLIF(getenv('RAV_ROOT'), '') IS NOT NULL
        THEN concat(rtrim(getenv('RAV_ROOT'), '/'), '/', rel)
        ELSE rel
    END
);

-- ──────────────────────────────────────────────
-- Sponsored Content (organic influencer posts)
-- Source: Snapchat Ads Gallery /sponsored_content endpoint
-- Each JSON page has ad_previews[] → sponsored_content_preview
--
-- Two glob roots:
--   data/sponsored_*              — active / in-progress crawls
--   data/partial_snapshots/sponsored_* — archived runs (e.g. cursor expired)
-- Rows from overlapping handle ranges may DUPLICATE across runs; filter by run_id.
-- ──────────────────────────────────────────────

DROP TABLE IF EXISTS sponsored_content;
CREATE TABLE sponsored_content AS
WITH raw AS (
    SELECT
        unnest(ad_previews) AS item,
        filename AS source_file
    FROM read_json_auto(
        rav_path('data_sources/snap_ads/data/sponsored_*/sponsored_content/page_*.json'),
        filename = true
    )
    UNION ALL
    SELECT
        unnest(ad_previews) AS item,
        filename AS source_file
    FROM read_json_auto(
        rav_path('data_sources/snap_ads/data/partial_snapshots/sponsored_*/sponsored_content/page_*.json'),
        filename = true
    )
)
SELECT
    item.sponsored_content_preview.sponsor_name  AS sponsor_name,
    item.sponsored_content_preview.sponsor_url   AS sponsor_url,
    item.sponsored_content_preview.creator_name  AS creator_name,
    item.sponsored_content_preview.creator_url   AS creator_url,
    item.sponsored_content_preview.content_type  AS content_type,
    item.sponsored_content_preview.content_url   AS content_url,
    item.sponsored_content_preview.thumbnail_url AS thumbnail_url,
    regexp_extract(source_file, '.*/(sponsored_[^/]+)/sponsored_content/', 1) AS run_id,
    source_file
FROM raw
WHERE item.sub_request_status = 'SUCCESS';

-- ──────────────────────────────────────────────
-- Brand paid ads (Ads Gallery /ads/search) — fashion crawl
-- Source: download_ads / ads_fashion: one JSON per brand×country (*_de.json)
-- Root: brand, country, fetched_at, ads_count, pagination_complete, ads[]
-- Each ads[] element: sub_request_status, ad_preview { ... }
-- ──────────────────────────────────────────────

DROP TABLE IF EXISTS brand_ads_fashion;
CREATE TABLE brand_ads_fashion AS
WITH files AS (
    SELECT *
    FROM read_json_auto(
        rav_path('data_sources/snap_ads/data/ads_fashion/*_de.json'),
        filename = true,
        union_by_name = true
    )
),
rows AS (
    SELECT
        brand,
        country,
        fetched_at,
        ads_count,
        pagination_complete,
        filename AS source_file,
        unnest(ads) AS ad_row
    FROM files
)
SELECT
    brand,
    country,
    fetched_at,
    ads_count,
    pagination_complete,
    ad_row.sub_request_status AS sub_request_status,
    ad_row.ad_preview.id AS ad_id,
    ad_row.ad_preview.name AS ad_name,
    ad_row.ad_preview.ad_account_name AS ad_account_name,
    ad_row.ad_preview.status AS status,
    ad_row.ad_preview.creative_type AS creative_type,
    ad_row.ad_preview.ad_type AS ad_type,
    ad_row.ad_preview.ad_render_type AS ad_render_type,
    ad_row.ad_preview.headline AS headline,
    ad_row.ad_preview.call_to_action AS call_to_action,
    ad_row.ad_preview.top_snap_media_type AS top_snap_media_type,
    ad_row.ad_preview.top_snap_crop_position AS top_snap_crop_position,
    ad_row.ad_preview.top_snap_media_download_link AS top_snap_media_download_link,
    ad_row.ad_preview.start_date AS start_date,
    ad_row.ad_preview.impressions_total AS impressions_total,
    ad_row.ad_preview.impressions_map AS impressions_map,
    ad_row.ad_preview.targeting_v2 AS targeting_v2,
    ad_row.ad_preview.paying_advertiser_name AS paying_advertiser_name,
    ad_row.ad_preview.brand_name AS brand_name_api,
    ad_row.ad_preview.profile_name AS profile_name,
    ad_row.ad_preview.profile_logo_url AS profile_logo_url,
    ad_row.ad_preview.web_view_properties AS web_view_properties,
    ad_row.ad_preview.deep_link_properties AS deep_link_properties,
    ad_row.ad_preview.composite_preview AS composite_preview,
    ad_row.ad_preview.dpa_preview AS dpa_preview,
    ad_row.ad_preview.review_status AS review_status,
    ad_row.ad_preview.rejection_reasons AS rejection_reasons,
    source_file
FROM rows
WHERE ad_row.sub_request_status = 'SUCCESS';

-- ──────────────────────────────────────────────
-- Political Ads (bulk CSV, 2018–2026)
-- Source: https://storage.googleapis.com/ad-manager-political-ads-dump/political/{year}/PoliticalAds.zip
-- Actual spend data, full targeting, committee transparency.
-- The glob reads all years in one shot; filename gives us the year.
-- ──────────────────────────────────────────────

DROP TABLE IF EXISTS political_ads;
CREATE TABLE political_ads AS
SELECT
    ADID                                          AS ad_id,
    CreativeUrl                                   AS creative_url,
    "Currency Code"                               AS currency,
    TRY_CAST(Spend AS DOUBLE)                     AS spend,
    TRY_CAST(Impressions AS BIGINT)               AS impressions,
    TRY_CAST(StartDate AS TIMESTAMP)              AS start_date,
    TRY_CAST(EndDate AS TIMESTAMP)                AS end_date,
    OrganizationName                              AS org_name,
    BillingAddress                                AS billing_address,
    CandidateBallotInformation                    AS candidate_info,
    PayingAdvertiserName                          AS paying_advertiser,
    CommitteeName                                 AS committee_name,
    CommitteeIdentificationNumber                 AS committee_id,
    DisclosureNameOfCommittee                     AS disclosure_committee,
    AdvertisingJurisdiction                       AS jurisdiction,
    Gender                                        AS target_gender,
    AgeBracket                                    AS target_age,
    LOWER(TRIM(CountryCode))                      AS country,
    "Regions (Included)"                          AS regions_included,
    "Regions (Excluded)"                          AS regions_excluded,
    "Electoral Districts (Included)"              AS districts_included,
    "Electoral Districts (Excluded)"              AS districts_excluded,
    "Radius Targeting (Included)"                 AS radius_included,
    "Radius Targeting (Excluded)"                 AS radius_excluded,
    "Metros (Included)"                           AS metros_included,
    "Metros (Excluded)"                           AS metros_excluded,
    "Postal Codes (Included)"                     AS postcodes_included,
    "Postal Codes (Excluded)"                     AS postcodes_excluded,
    "Location Categories (Included)"              AS loc_categories_included,
    "Location Categories (Excluded)"              AS loc_categories_excluded,
    Interests                                     AS interests,
    OsType                                        AS os_type,
    Segments                                      AS segments,
    Language                                      AS language,
    AdvancedDemographics                          AS advanced_demographics,
    "Targeting Connection Type"                   AS connection_type,
    "Targeting Carrier (ISP)"                     AS carrier,
    CreativeProperties                            AS creative_properties,
    CAST(regexp_extract(filename, '/(\d{4})/', 1) AS INT) AS data_year,
    filename                                      AS source_file
FROM read_csv_auto(
    rav_path('data_sources/snap_ads/data/political_ads/csv/*/PoliticalAds.csv'),
    filename = true,
    header = true,
    all_varchar = true
);

-- ──────────────────────────────────────────────
-- Brand Public Profiles (Snapchat web scrape)
-- Source: fetch_profiles.ts → data/profiles/{Brand}.json
-- Each file: { brand, username, fetched_at, pageProps: { userProfile, spotlightStoryMetadata, ... } }
-- Two tables: brand_profiles (one row per brand) and brand_profile_spotlights (one row per video).
-- ──────────────────────────────────────────────

DROP TABLE IF EXISTS brand_profile_spotlights;
DROP TABLE IF EXISTS brand_profiles;

CREATE TABLE brand_profiles AS
WITH raw AS (
    SELECT *
    FROM read_json_auto(
        rav_path('data_sources/snap_profiles/data/profiles/*.json'),
        filename = true,
        union_by_name = true
    )
    WHERE brand IS NOT NULL
)
SELECT
    brand,
    username,
    fetched_at,
    pageProps.userProfile.publicProfileInfo.title                   AS title,
    TRY_CAST(pageProps.userProfile.publicProfileInfo.subscriberCount AS BIGINT) AS subscriber_count,
    pageProps.userProfile.publicProfileInfo.bio                     AS bio,
    pageProps.userProfile.publicProfileInfo.websiteUrl              AS website_url,
    pageProps.userProfile.publicProfileInfo.address                 AS address,
    pageProps.userProfile.publicProfileInfo.badge                   AS badge,
    pageProps.userProfile.publicProfileInfo.categoryStringId        AS category,
    pageProps.userProfile.publicProfileInfo.subcategoryStringId     AS subcategory,
    pageProps.userProfile.publicProfileInfo.businessProfileId       AS business_profile_id,
    pageProps.userProfile.publicProfileInfo.profilePictureUrl       AS profile_picture_url,
    pageProps.userProfile.publicProfileInfo.snapcodeImageUrl        AS snapcode_url,
    pageProps.userProfile.publicProfileInfo.squareHeroImageUrl      AS hero_image_url,
    pageProps.userProfile.publicProfileInfo.hasStory                AS has_story,
    pageProps.userProfile.publicProfileInfo.hasCuratedHighlights    AS has_curated_highlights,
    pageProps.userProfile.publicProfileInfo.hasSpotlightHighlights  AS has_spotlight_highlights,
    CASE WHEN pageProps.userProfile.publicProfileInfo.creationTimestampMs.value IS NOT NULL
         THEN epoch_ms(TRY_CAST(pageProps.userProfile.publicProfileInfo.creationTimestampMs.value AS BIGINT))
    END AS profile_created_at,
    CASE WHEN pageProps.userProfile.publicProfileInfo.lastUpdateTimestampMs.value IS NOT NULL
         THEN epoch_ms(TRY_CAST(pageProps.userProfile.publicProfileInfo.lastUpdateTimestampMs.value AS BIGINT))
    END AS profile_updated_at,
    len(pageProps.spotlightStoryMetadata)                          AS spotlight_count,
    filename                                                       AS source_file
FROM raw;

CREATE TABLE brand_profile_spotlights AS
WITH raw AS (
    SELECT *
    FROM read_json_auto(
        rav_path('data_sources/snap_profiles/data/profiles/*.json'),
        filename = true,
        union_by_name = true
    )
    WHERE brand IS NOT NULL
      AND len(pageProps.spotlightStoryMetadata) > 0
)
SELECT
    brand,
    username,
    s.videoMetadata.thumbnailUrl                                   AS thumbnail_url,
    s.videoMetadata.contentUrl                                     AS content_url,
    CASE WHEN s.videoMetadata.uploadDateMs IS NOT NULL
         THEN epoch_ms(TRY_CAST(s.videoMetadata.uploadDateMs AS BIGINT))
    END                                                            AS uploaded_at,
    TRY_CAST(s.videoMetadata.durationMs AS INT)                    AS duration_ms,
    s.videoMetadata.width                                          AS width,
    s.videoMetadata.height                                         AS height,
    TRY_CAST(s.engagementStats.viewCount AS BIGINT)                AS view_count,
    TRY_CAST(s.engagementStats.shareCount AS BIGINT)               AS share_count,
    TRY_CAST(s.engagementStats.commentCount AS BIGINT)             AS comment_count,
    TRY_CAST(s.engagementStats.boostCount AS BIGINT)               AS boost_count,
    TRY_CAST(s.engagementStats.recommendCount AS BIGINT)           AS recommend_count,
    s.llmTitle                                                     AS llm_title,
    s.llmDescription                                               AS llm_description,
    s.llmKeywords                                                  AS llm_keywords,
    s.hashtags                                                     AS hashtags,
    s.description                                                  AS description,
    s.deeplink                                                     AS deeplink,
    fetched_at,
    filename                                                       AS source_file
FROM raw, LATERAL unnest(raw.pageProps.spotlightStoryMetadata) AS t(s);

-- ──────────────────────────────────────────────
-- Spotlight Pages (individual video scrape)
-- Source: fetch_spotlights.ts → data/spotlights/{id}.json
-- Each file: { url, source_brand, source, fetched_at, pageProps }
-- videoMetadata has engagement, transcriptMap has captions.
-- ──────────────────────────────────────────────

DROP TABLE IF EXISTS spotlight_pages;
CREATE TABLE spotlight_pages AS
SELECT
    url,
    source_brand,
    source,
    fetched_at,
    pageProps.videoMetadata.creator.personCreator.username        AS creator_username,
    pageProps.videoMetadata.creator.personCreator.name            AS creator_name,
    TRY_CAST(pageProps.videoMetadata.viewCount AS BIGINT)         AS view_count,
    TRY_CAST(pageProps.videoMetadata.shareCount AS BIGINT)        AS share_count,
    TRY_CAST(pageProps.videoMetadata.durationMs AS INT)           AS duration_ms,
    pageProps.videoMetadata.width                                 AS width,
    pageProps.videoMetadata.height                                AS height,
    CASE WHEN pageProps.videoMetadata.uploadDateMs IS NOT NULL
         THEN epoch_ms(TRY_CAST(pageProps.videoMetadata.uploadDateMs AS BIGINT))
    END                                                          AS uploaded_at,
    pageProps.videoMetadata.thumbnailUrl                          AS thumbnail_url,
    pageProps.videoMetadata.contentUrl                            AS content_url,
    pageProps.videoMetadata.embeddedTextCaption                   AS text_caption,
    pageProps.isAttributed                                        AS is_attributed,
    map_keys(pageProps.transcriptMap) IS NOT NULL
        AND len(map_keys(pageProps.transcriptMap)) > 0           AS has_transcript,
    filename                                                     AS source_file
FROM read_json_auto(
    rav_path('data_sources/snap_spotlights/data/spotlights/*.json'),
    filename = true,
    union_by_name = true
);

-- ──────────────────────────────────────────────
-- Explore Discovery (/explore/<keyword>) — fashion & beauty
-- Source: fetch_explore.ts → data/explore/<keyword>.json
-- Each file: { keyword, fetched_at, pageProps: { encodedSearchResponse (JSON str), encodedSpotlightCardMap (JSON str), query, country } }
-- Three tables: explore_keywords (summary), explore_subscribe_profiles (business profiles), explore_spotlight_creators (from spotlight cards).
-- ──────────────────────────────────────────────

DROP TABLE IF EXISTS explore_spotlight_creators;
DROP TABLE IF EXISTS explore_subscribe_profiles;
DROP TABLE IF EXISTS explore_keywords;

-- 1. Keywords summary: one row per fetched keyword
CREATE TABLE explore_keywords AS
WITH raw AS (
    SELECT keyword, fetched_at,
        pageProps::JSON->>'query'   AS query_echo,
        pageProps::JSON->>'country' AS country,
        pageProps::JSON->>'encodedSearchResponse'  AS sr_str,
        pageProps::JSON->>'encodedSpotlightCardMap' AS scm_str,
        filename AS source_file
    FROM read_json(
        rav_path('data_sources/snap_explore/data/explore/*.json'),
        columns = {keyword: 'VARCHAR', fetched_at: 'VARCHAR', pageProps: 'JSON'},
        format = 'auto', filename = true, maximum_object_size = 10485760,
        ignore_errors = true
    )
    WHERE keyword IS NOT NULL
)
SELECT
    keyword,
    query_echo,
    country,
    fetched_at,
    CAST(json_array_length(sr_str::JSON->'sections') AS INT) AS section_count,
    CASE WHEN scm_str IS NOT NULL AND json_type(scm_str::JSON) = 'OBJECT'
         THEN CAST(len(json_keys(scm_str::JSON)) AS INT)
    ELSE 0 END AS spotlight_card_count,
    source_file
FROM raw;

-- 2. Subscribe profiles: business profiles from snapProEntity sections
CREATE TABLE explore_subscribe_profiles AS
WITH raw AS (
    SELECT keyword, fetched_at,
        pageProps::JSON->>'encodedSearchResponse' AS sr_str
    FROM read_json(
        rav_path('data_sources/snap_explore/data/explore/*.json'),
        columns = {keyword: 'VARCHAR', fetched_at: 'VARCHAR', pageProps: 'JSON'},
        format = 'auto', maximum_object_size = 10485760,
        ignore_errors = true
    )
    WHERE keyword IS NOT NULL
),
sr_parsed AS (
    SELECT keyword, fetched_at, sr_str::JSON AS sr,
        CAST(json_array_length(sr_str::JSON->'sections') AS BIGINT) AS num_secs
    FROM raw
),
sec_exploded AS (
    SELECT keyword, fetched_at, sr,
        unnest(generate_series(0::BIGINT, num_secs - 1::BIGINT)) AS si
    FROM sr_parsed
),
sub_sections AS (
    SELECT keyword, fetched_at,
        sr->'sections'->si->'results' AS results,
        CAST(json_array_length(sr->'sections'->si->'results') AS BIGINT) AS rc
    FROM sec_exploded
    WHERE json_extract_string(sr->'sections'->si->'results'->0->'result', '$."$case"') = 'snapProEntity'
),
items AS (
    SELECT keyword, fetched_at, results,
        unnest(generate_series(0::BIGINT, rc - 1::BIGINT)) AS ri
    FROM sub_sections
)
SELECT
    keyword,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.title') AS title,
    TRY_CAST(json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.subscriberCount') AS BIGINT) AS subscriber_count,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.hostAccountUsername') AS username,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.hostAccountMutableUsername') AS mutable_username,
    TRY_CAST(json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.tier') AS INT) AS tier,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.isBrandProfile') = 'true' AS is_brand,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.isPartnerProfile') = 'true' AS is_partner,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.id') AS business_profile_id,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.accountId') AS account_id,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.websiteUrl') AS website_url,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.businessLogo') AS logo_url,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.heroImageUrl') AS hero_image_url,
    json_extract_string(results->ri->'result'->'snapProEntity'->'profile'->'businessProfile', '$.category') AS category,
    fetched_at
FROM items;

-- 3. Spotlight creators: creator usernames + engagement from spotlight cards
CREATE TABLE explore_spotlight_creators AS
WITH raw AS (
    SELECT keyword, fetched_at,
        pageProps::JSON->>'encodedSpotlightCardMap' AS scm_str
    FROM read_json(
        rav_path('data_sources/snap_explore/data/explore/*.json'),
        columns = {keyword: 'VARCHAR', fetched_at: 'VARCHAR', pageProps: 'JSON'},
        format = 'auto', maximum_object_size = 10485760,
        ignore_errors = true
    )
    WHERE keyword IS NOT NULL
),
card_keys AS (
    SELECT keyword, fetched_at, scm_str::JSON AS scm,
        unnest(json_keys(scm_str::JSON)) AS card_key
    FROM raw
    WHERE scm_str IS NOT NULL AND json_type(scm_str::JSON) = 'OBJECT'
)
SELECT
    keyword,
    json_extract_string(scm->card_key->'snaps'->0->'creatorInfo', '$.userName') AS creator_username,
    json_extract_string(scm->card_key->'snaps'->0->'creatorInfo', '$.displayName') AS creator_display_name,
    TRY_CAST(json_extract_string(scm->card_key->'snaps'->0->'creatorInfo', '$.snapproTier') AS INT) AS creator_tier,
    json_extract_string(scm->card_key->'snaps'->0->'creatorInfo', '$.userId') AS creator_user_id,
    TRY_CAST(json_extract_string(scm->card_key, '$.engagementStats.viewCount') AS BIGINT) AS view_count,
    TRY_CAST(json_extract_string(scm->card_key, '$.engagementStats.shareCount') AS BIGINT) AS share_count,
    json_extract_string(scm->card_key->'singleSnapStoryMetadata', '$.llmTitle') AS llm_title,
    json_extract_string(scm->card_key->'singleSnapStoryMetadata', '$.llmDescription') AS llm_description,
    json_extract_string(scm->card_key->'singleSnapStoryMetadata', '$.llmKeywords') AS llm_keywords,
    card_key AS story_id,
    fetched_at
FROM card_keys
WHERE json_extract_string(scm->card_key->'snaps'->0->'creatorInfo', '$.userName') IS NOT NULL;

-- ──────────────────────────────────────────────
-- EC DSA Transparency Database — Snapchat statements of reasons
-- Source: data_sources/dsa_transparency/src/fetch_sor.ts → data/daily/snapchat-<date>-{light,full}.csv
-- Glob loads every merged per-day file. light + full share one table (union_by_name; extra cols NULL where absent).
-- If the directory is empty, this step errors — run: cd data_sources/dsa_transparency && npx tsx src/fetch_sor.ts ...
-- ──────────────────────────────────────────────

DROP TABLE IF EXISTS dsa_snapchat_sor;
CREATE TABLE dsa_snapchat_sor AS
SELECT
    CAST(regexp_extract(f.filename, 'snapchat-([0-9]{4}-[0-9]{2}-[0-9]{2})', 1) AS DATE) AS dump_date,
    regexp_extract(f.filename, '(light|full)\\.csv$', 1) AS csv_variant,
    f.filename AS source_file,
    f.* EXCLUDE (filename)
FROM read_csv_auto(
    rav_path('data_sources/dsa_transparency/data/daily/snapchat-*.csv'),
    filename = true,
    union_by_name = true
) f;

-- ──────────────────────────────────────────────
-- Transparency Reports — EU DSA (H2 2025 V2)
-- Source: XLSX converted to CSV via xlsx_to_csv.py
-- ──────────────────────────────────────────────

CREATE OR REPLACE TABLE eu_dsa_member_state_orders AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/3_member_states_orders.csv'), header=true, all_varchar=true);

CREATE OR REPLACE TABLE eu_dsa_notices AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/4_notices.csv'), header=true, all_varchar=true);

CREATE OR REPLACE TABLE eu_dsa_own_initiative_illegal AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/5_own_initiative_illegal.csv'), header=true, all_varchar=true);

CREATE OR REPLACE TABLE eu_dsa_own_initiative_tc AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/6_own_initiative_TC.csv'), header=true, all_varchar=true);

CREATE OR REPLACE TABLE eu_dsa_appeals AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/7_appeals_and_recidivism.csv'), header=true, all_varchar=true);

CREATE OR REPLACE TABLE eu_dsa_automated_means AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/8_automated_means.csv'), header=true, all_varchar=true);

CREATE OR REPLACE TABLE eu_dsa_human_resources AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/9_human_resources.csv'), header=true, all_varchar=true);

CREATE OR REPLACE TABLE eu_dsa_amar AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/10_AMAR.csv'), header=true, all_varchar=true);

CREATE OR REPLACE TABLE eu_dsa_categories AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/eu_dsa_csv/Snap_DSA_TR_H2_2025_V2/2_categories_names.csv'), header=true, all_varchar=true);

-- ──────────────────────────────────────────────
-- Transparency Reports — Global (H1 2025)
-- Source: manually extracted JSON → flattened CSV
-- ──────────────────────────────────────────────

CREATE OR REPLACE TABLE global_enforcements_by_policy AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/global_csv/enforcements_by_policy.csv'), header=true);

CREATE OR REPLACE TABLE global_user_reports_by_policy AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/global_csv/user_reports_by_policy.csv'), header=true);

CREATE OR REPLACE TABLE global_proactive_detection AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/global_csv/proactive_detection_by_policy.csv'), header=true);

CREATE OR REPLACE TABLE global_appeals_by_policy AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/global_csv/appeals_by_policy.csv'), header=true);

CREATE OR REPLACE TABLE global_regional_enforcements AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/global_csv/regional_enforcements.csv'), header=true);

CREATE OR REPLACE TABLE global_ads_moderation AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/global_csv/ads_moderation.csv'), header=true);

CREATE OR REPLACE TABLE global_csea AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/global_csv/csea.csv'), header=true);

CREATE OR REPLACE TABLE eu_csea_2025 AS
SELECT * FROM read_csv_auto(rav_path('data_sources/transparency_reports/data/global_csv/eu_csea_2025.csv'), header=true);
