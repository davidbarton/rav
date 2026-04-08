-- DuckDB init: creates views over raw JSON data files.
-- Run from project root: duckdb rav.db < db/init.sql
-- Re-run any time new data is fetched. Views are replaced, not appended.

-- ──────────────────────────────────────────────
-- Sponsored Content (organic influencer posts)
-- Source: Snapchat Ads Gallery /sponsored_content endpoint
-- Each JSON page has ad_previews[] → sponsored_content_preview
-- ──────────────────────────────────────────────

CREATE OR REPLACE VIEW sponsored_content AS
WITH raw AS (
    SELECT
        unnest(ad_previews) AS item,
        filename AS source_file
    FROM read_json_auto(
        '1_data_sources/snap_ads/data/sponsored_*/sponsored_content/page_*.json',
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
    source_file
FROM raw
WHERE item.sub_request_status = 'SUCCESS';

-- ──────────────────────────────────────────────
-- Political Ads (bulk CSV, 2018–2026)
-- Source: https://storage.googleapis.com/ad-manager-political-ads-dump/political/{year}/PoliticalAds.zip
-- Actual spend data, full targeting, committee transparency.
-- The glob reads all years in one shot; filename gives us the year.
-- ──────────────────────────────────────────────

CREATE OR REPLACE VIEW political_ads AS
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
    -- Extract year from the directory path for easy filtering
    CAST(regexp_extract(filename, '/(\d{4})/', 1) AS INT) AS data_year,
    filename                                      AS source_file
FROM read_csv_auto(
    '1_data_sources/snap_ads/data/political_ads/csv/*/PoliticalAds.csv',
    filename = true,
    header = true,
    all_varchar = true
);
