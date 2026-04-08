-- DuckDB init: loads raw JSON/CSV into native tables inside rav.db.
-- Run from project root: duckdb rav.db < db/init.sql
-- Re-run after fetching new data — tables are dropped and rebuilt (full refresh).
--
-- Load paths: read_json_auto / read_csv_auto use cwd, not rav.db location. Run from
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

DROP VIEW IF EXISTS sponsored_content;
DROP TABLE IF EXISTS sponsored_content;
CREATE TABLE sponsored_content AS
WITH raw AS (
    SELECT
        unnest(ad_previews) AS item,
        filename AS source_file
    FROM read_json_auto(
        rav_path('1_data_sources/snap_ads/data/sponsored_*/sponsored_content/page_*.json'),
        filename = true
    )
    UNION ALL
    SELECT
        unnest(ad_previews) AS item,
        filename AS source_file
    FROM read_json_auto(
        rav_path('1_data_sources/snap_ads/data/partial_snapshots/sponsored_*/sponsored_content/page_*.json'),
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

DROP VIEW IF EXISTS brand_ads_fashion;
DROP TABLE IF EXISTS brand_ads_fashion;
CREATE TABLE brand_ads_fashion AS
WITH files AS (
    SELECT *
    FROM read_json_auto(
        rav_path('1_data_sources/snap_ads/data/ads_fashion/*_de.json'),
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

DROP VIEW IF EXISTS political_ads;
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
    rav_path('1_data_sources/snap_ads/data/political_ads/csv/*/PoliticalAds.csv'),
    filename = true,
    header = true,
    all_varchar = true
);
