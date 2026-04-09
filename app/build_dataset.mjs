#!/usr/bin/env node
/**
 * Builds app/data/normalized.json from DuckDB (db/rav.db).
 *
 * Prereqs: DuckDB CLI (`brew install duckdb`) and a populated database
 *          (`duckdb db/rav.db < db/init.sql` from repo root).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "db", "rav.db");
const OUT_DIR = path.join(__dirname, "data");
const OUT_FILE = path.join(OUT_DIR, "normalized.json");

// ── DuckDB helper ──────────────────────────────────────────

function query(sql) {
  const out = execSync(`duckdb "${DB_PATH}" -json`, {
    input: sql + "\n",
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
  });
  return JSON.parse(out || "[]");
}

// ── Enrichment (JS-side) ──────────────────────────────────

const CATEGORY_RULES = [
  [["podcast", "playlist", "music", "spotify", "hörbuch", "audio"], "Audio", "Streaming"],
  [["crypto", "trading", "investment", "invest"], "Finance", "Investment"],
  [["tv", "show", "movie", "serie"], "Entertainment", "Video"],
  [["nike", "adidas", "puma", "jordan", "new balance", "asics", "vans", "salomon", "crocs", "birkenstock", "dr. martens", "converse"], "Fashion", "Footwear"],
  [["shein", "zara", "h&m", "boohoo", "asos", "mango", "cos", "arket", "only", "jack & jones", "kiabi", "prettylittlething", "fila", "champion", "superdry", "g-star", "lacoste", "tommy hilfiger", "calvin klein", "hugo boss", "ralph lauren", "diesel", "guess", "patagonia", "lululemon", "triumph", "under armour", "foot locker", "zalando", "house"], "Fashion", "Apparel"],
  [["sephora", "dior", "chanel", "gucci", "louis vuitton", "givenchy", "prada", "versace", "armani", "fendi", "bottega veneta", "valentino", "celine", "kenzo", "cartier", "tiffany", "rolex", "omega", "pandora", "hermes"], "Fashion", "Luxury"],
  [["mac", "nyx", "clinique", "l'oreal", "charlotte tilbury", "nars", "clarins", "kylie cosmetics", "olay", "dove", "axe", "braun", "ghd", "coty", "essence", "paco rabanne"], "Beauty", "Cosmetics"],
  [["temu", "coach", "oakley", "specsavers", "galeries lafayette", "mammut", "canada goose"], "Retail", "General"],
  [["game", "gaming", "esport"], "Entertainment", "Gaming"],
];

const RISK_TERMS = ["crypto", "trading", "investment", "free money", "giveaway", "urgent", "scam"];

function classifyText(text) {
  const t = (text || "").toLowerCase();
  for (const [keywords, cat, sub] of CATEGORY_RULES) {
    if (keywords.some((k) => t.includes(k))) return [cat, sub];
  }
  return ["Unknown", "Unknown"];
}

function detectRisk(text, url) {
  const blob = `${text || ""} ${url || ""}`.toLowerCase();
  return RISK_TERMS.filter((term) => blob.includes(term));
}

// ── Main ──────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`DuckDB not found at ${DB_PATH}. Run: duckdb db/rav.db < db/init.sql`);
  }

  // 1. Ads from brand_ads_fashion (all 4.5k+ rows, 23 EU countries)
  const rawAds = query(`
    SELECT
      ad_id                         AS id,
      COALESCE(paying_advertiser_name, 'Unknown') AS advertiser,
      COALESCE(NULLIF(brand_name_api,''), NULLIF(profile_name,''), brand, 'Unknown') AS brand,
      COALESCE(headline, '')        AS headline,
      call_to_action                AS cta,
      start_date::VARCHAR           AS start_date,
      CASE WHEN start_date IS NOT NULL
           THEN DATE_DIFF('day', start_date::DATE, CURRENT_DATE)
      END                           AS running_days,
      COALESCE(CAST(impressions_total AS INTEGER), 0) AS impressions_total,
      COALESCE(top_snap_media_type, 'Unknown') AS media_type,
      top_snap_media_download_link  AS creative_url,
      COALESCE(web_view_properties.url, '') AS landing_url,
      review_status,
      country
    FROM brand_ads_fashion
  `);

  const CPM_LOW = 4.0;
  const CPM_HIGH = 9.0;

  const adsRows = rawAds.map((ad) => {
    const impr = ad.impressions_total || 0;
    const estLow = Math.round((impr / 1000) * CPM_LOW * 100) / 100;
    const estHigh = Math.round((impr / 1000) * CPM_HIGH * 100) / 100;
    const blob = `${ad.headline} ${ad.landing_url} ${ad.brand} ${ad.advertiser}`;
    const [category, sub_category] = classifyText(blob);
    const riskFlags = detectRisk(ad.headline, ad.landing_url);
    return {
      id: ad.id,
      platform: "Snapchat",
      advertiser: ad.advertiser,
      brand: ad.brand,
      headline: ad.headline,
      cta: ad.cta,
      start_date: ad.start_date,
      running_days: ad.running_days,
      impressions_total: impr,
      est_spend_low_eur: estLow,
      est_spend_high_eur: estHigh,
      performance_per_spend_proxy:
        Math.round((impr / Math.max((estLow + estHigh) / 2, 1)) * 100) / 100,
      category,
      sub_category,
      unknown_category: category === "Unknown",
      risk_flags: riskFlags,
      risk_score: Math.min(riskFlags.length * 2, 10),
      media_type: ad.media_type,
      creative_url: ad.creative_url,
      landing_url: ad.landing_url,
      review_status: ad.review_status,
      country: ad.country,
    };
  });

  // 2. Sponsored content KPIs (computed in DuckDB over full 230k+ row table)
  const [sponsoredCounts] = query(`
    SELECT
      COUNT(*)                                   AS sponsored_rows,
      COUNT(DISTINCT creator_name)               AS unique_creators,
      COUNT(DISTINCT NULLIF(sponsor_name, ''))   AS unique_sponsors
    FROM sponsored_content
  `);

  const topSponsors = query(`
    SELECT sponsor_name, COUNT(*) AS count
    FROM sponsored_content
    WHERE sponsor_name != ''
    GROUP BY sponsor_name
    ORDER BY count DESC
    LIMIT 10
  `);

  const topCreators = query(`
    SELECT creator_name, COUNT(*) AS count
    FROM sponsored_content
    GROUP BY creator_name
    ORDER BY count DESC
    LIMIT 10
  `);

  const sponsoredSample = query(`
    SELECT creator_name, sponsor_name, content_type, content_url, thumbnail_url
    FROM sponsored_content
    WHERE sponsor_name != ''
    USING SAMPLE 200
  `);

  // 3. Aggregate ad-level KPIs
  const advertisers = {};
  for (const r of adsRows) {
    const key = r.advertiser;
    if (!advertisers[key]) advertisers[key] = { impressions: 0, est_low: 0, est_high: 0, ads: 0 };
    advertisers[key].impressions += r.impressions_total;
    advertisers[key].est_low += r.est_spend_low_eur;
    advertisers[key].est_high += r.est_spend_high_eur;
    advertisers[key].ads += 1;
  }

  const leaderboard = Object.entries(advertisers)
    .map(([advertiser, v]) => ({
      advertiser,
      ads: v.ads,
      impressions: v.impressions,
      est_spend_low_eur: Math.round(v.est_low * 100) / 100,
      est_spend_high_eur: Math.round(v.est_high * 100) / 100,
    }))
    .sort((a, b) => b.impressions - a.impressions);

  const now = new Date();
  const output = {
    generated_at_utc: now.toISOString(),
    notes: {
      spend_model: "Very rough proxy from impressions using fixed CPM range 4-9 EUR.",
      performance_model: "Impressions per estimated euro midpoint.",
      warning: "Prototype only. Do not treat spend as exact.",
      data_source: "DuckDB (db/rav.db) — brand_ads_fashion + sponsored_content tables",
    },
    kpis: {
      ads_count: adsRows.length,
      sponsored_content_count: sponsoredCounts.sponsored_rows,
      total_impressions: adsRows.reduce((s, x) => s + x.impressions_total, 0),
      est_spend_low_total_eur:
        Math.round(adsRows.reduce((s, x) => s + x.est_spend_low_eur, 0) * 100) / 100,
      est_spend_high_total_eur:
        Math.round(adsRows.reduce((s, x) => s + x.est_spend_high_eur, 0) * 100) / 100,
      unique_brands: new Set(adsRows.map((r) => r.brand)).size,
      unique_countries: new Set(adsRows.map((r) => r.country)).size,
      unknown_category_ratio:
        Math.round(
          ((adsRows.filter((x) => x.unknown_category).length / Math.max(adsRows.length, 1)) * 100) * 10
        ) / 10,
    },
    sponsored_kpis: {
      sponsored_rows: sponsoredCounts.sponsored_rows,
      unique_creators: sponsoredCounts.unique_creators,
      unique_sponsors: sponsoredCounts.unique_sponsors,
      top_sponsors: topSponsors,
      top_creators: topCreators,
      scope_note:
        "Represents sponsored/commercial content endpoint coverage, not full organic platform feed.",
    },
    leaderboard,
    ads: adsRows,
    sponsored_content: sponsoredSample,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), "utf8");

  const stats = [
    `${adsRows.length} ads (${new Set(adsRows.map((r) => r.brand)).size} brands, ${new Set(adsRows.map((r) => r.country)).size} countries)`,
    `${sponsoredCounts.sponsored_rows} sponsored rows (${sponsoredCounts.unique_creators} creators)`,
  ].join(", ");
  console.log(`Wrote ${OUT_FILE} — ${stats}`);
}

main();
