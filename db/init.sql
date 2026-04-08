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
