#!/usr/bin/env tsx
/**
 * Builds app/data/dior-report.json from DuckDB (db/rav.db).
 *
 * Run: npx tsx app/build_dataset.ts   (from repo root)
 * Or:  npm run app:data               (via root package.json)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractExploreData, type ExploreData } from "../data_sources/lib/snap_explore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "db", "rav.db");
const OUT_DIR = path.join(__dirname, "data");
const OUT_FILE = path.join(OUT_DIR, "dior-report.json");

const BRAND = "Dior";
const COMPETITORS = [
  "Cartier",
  "Gucci",
  "Chanel",
  "Prada",
  "Celine",
  "Burberry",
  "Givenchy",
  "Louis Vuitton",
  "Valentino",
  "Balenciaga",
  "Tiffany",
];
const ALL_BRANDS = [BRAND, ...COMPETITORS];

const CPM_LOW = 4.0;
const CPM_HIGH = 9.0;

function query<T = Record<string, unknown>>(sql: string): T[] {
  const out = execSync(`duckdb -readonly "${DB_PATH}" -json`, {
    input: sql + "\n",
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
    timeout: 15_000,
  });
  return JSON.parse(out || "[]") as T[];
}

function inList(brands: string[]): string {
  return brands.map((b) => `'${b.replace(/'/g, "''")}'`).join(",");
}

function estimateSpend(impressions: number): { low: number; high: number } {
  return {
    low: Math.round((impressions / 1000) * CPM_LOW),
    high: Math.round((impressions / 1000) * CPM_HIGH),
  };
}

function main(): void {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `DuckDB not found at ${DB_PATH}. Run: duckdb db/rav.db < db/init.sql`,
    );
  }

  // ── Section 1: Landscape ──────────────────────────────────
  // Full market overview (all brands in DB)
  const marketWide = query<{
    total_ads: number;
    total_impressions: string;
    brand_count: number;
    country_count: number;
  }>(`
    SELECT
      COUNT(*) as total_ads,
      SUM(impressions_total) as total_impressions,
      COUNT(DISTINCT brand) as brand_count,
      COUNT(DISTINCT country) as country_count
    FROM brand_ads_fashion
  `)[0];

  // Luxury subset (our competitive set)
  const landscape = query<{
    total_ads: number;
    total_impressions: string;
    brand_count: number;
    country_count: number;
  }>(`
    SELECT
      COUNT(*) as total_ads,
      SUM(impressions_total) as total_impressions,
      COUNT(DISTINCT brand) as brand_count,
      COUNT(DISTINCT country) as country_count
    FROM brand_ads_fashion
    WHERE brand IN (${inList(ALL_BRANDS)})
  `)[0];

  const totalImpressions = Number(landscape.total_impressions);
  const spend = estimateSpend(totalImpressions);
  const marketImpressions = Number(marketWide.total_impressions);
  const marketSpend = estimateSpend(marketImpressions);

  // ── Section 2: Position (share of voice) ──────────────────
  const shareOfVoice = query<{
    brand: string;
    ads: number;
    countries: number;
    impressions: string;
  }>(`
    SELECT brand, COUNT(*) as ads, COUNT(DISTINCT country) as countries,
      SUM(impressions_total) as impressions
    FROM brand_ads_fashion
    WHERE brand IN (${inList(ALL_BRANDS)})
    GROUP BY brand ORDER BY impressions DESC
  `).map((r) => {
    const impr = Number(r.impressions);
    const s = estimateSpend(impr);
    return {
      brand: r.brand,
      ads: r.ads,
      countries: r.countries,
      impressions: impr,
      share_pct: Math.round((impr / totalImpressions) * 1000) / 10,
      per_ad_avg: Math.round(impr / r.ads),
      est_spend_low: s.low,
      est_spend_high: s.high,
    };
  });

  // ── Section 3: Geography ──────────────────────────────────
  const geoAll = query<{
    brand: string;
    country: string;
    ads: number;
    impressions: string;
  }>(`
    SELECT brand, country, COUNT(*) as ads, SUM(impressions_total) as impressions
    FROM brand_ads_fashion
    WHERE brand IN (${inList(ALL_BRANDS)})
    GROUP BY brand, country ORDER BY brand, impressions DESC
  `);

  const diorGeo = geoAll
    .filter((r) => r.brand === BRAND)
    .map((r) => ({
      country: r.country,
      ads: r.ads,
      impressions: Number(r.impressions),
    }));

  const diorCountries = new Set(diorGeo.map((r) => r.country));

  // Only flag a market as "missing" if there's deliberate competitor presence,
  // not just pan-EU spray (e.g. Givenchy's single 33K-impression ad in 20 countries).
  // Threshold: >=2 brands OR >=100K total impressions from competitors.
  const competitorByCountry = new Map<string, { brands: Set<string>; impressions: number }>();
  for (const r of geoAll.filter((r) => r.brand !== BRAND)) {
    const entry = competitorByCountry.get(r.country) ?? { brands: new Set(), impressions: 0 };
    entry.brands.add(r.brand);
    entry.impressions += Number(r.impressions);
    competitorByCountry.set(r.country, entry);
  }

  const missingCountries = [...competitorByCountry.entries()]
    .filter(([c, info]) =>
      !diorCountries.has(c) && info.brands.size >= 2 && info.impressions >= 100_000,
    )
    .sort((a, b) => b[1].impressions - a[1].impressions)
    .map(([c]) => c);

  const competitorGeoSummary = COMPETITORS.map((brand) => {
    const rows = geoAll.filter((r) => r.brand === brand);
    return {
      brand,
      countries: rows.map((r) => r.country),
      top_country: rows[0]?.country ?? null,
      top_country_impressions: Number(rows[0]?.impressions ?? 0),
    };
  });

  // ── Section 4: Creative strategy (format mix) ─────────────
  const formatMix = query<{
    brand: string;
    format: string;
    cnt: number;
    impressions: string;
  }>(`
    SELECT brand,
      COALESCE(top_snap_media_type, 'COLLECTION') as format,
      COUNT(*) as cnt,
      SUM(impressions_total) as impressions
    FROM brand_ads_fashion
    WHERE brand IN (${inList(ALL_BRANDS)})
    GROUP BY brand, format ORDER BY brand, impressions DESC
  `);

  const formatByBrand: Record<
    string,
    { format: string; ads: number; impressions: number; pct: number }[]
  > = {};
  for (const b of ALL_BRANDS) {
    const rows = formatMix.filter((r) => r.brand === b);
    const total = rows.reduce((s, r) => s + Number(r.impressions), 0);
    formatByBrand[b] = rows.map((r) => ({
      format: r.format,
      ads: r.cnt,
      impressions: Number(r.impressions),
      pct: total > 0 ? Math.round((Number(r.impressions) / total) * 1000) / 10 : 0,
    }));
  }

  // Top creatives — fall back to first snap image for Collection Ads, dedupe by URL
  const topCreativesRaw = query<{
    headline: string;
    impressions_total: number;
    country: string;
    format: string;
    creative_url: string | null;
    start_date: string;
  }>(`
    SELECT headline, impressions_total, country,
      COALESCE(top_snap_media_type, 'COLLECTION') as format,
      COALESCE(
        top_snap_media_download_link,
        composite_preview.ad_snaps[1].top_snap_media_download_link
      ) as creative_url,
      start_date::VARCHAR as start_date
    FROM brand_ads_fashion
    WHERE brand = '${BRAND}'
    ORDER BY impressions_total DESC
    LIMIT 30
  `).map((r) => ({
    ...r,
    impressions_total: Number(r.impressions_total),
  }));

  const seenUrls = new Set<string>();
  const topCreatives = topCreativesRaw.filter((r) => {
    if (!r.creative_url) return false;
    if (seenUrls.has(r.creative_url)) return false;
    seenUrls.add(r.creative_url);
    return true;
  }).slice(0, 10);

  // ── Section 5: Campaign Cadence ───────────────────────────
  const cadenceAll = query<{
    brand: string;
    month: string;
    ads: number;
    impressions: string;
  }>(`
    SELECT brand,
      STRFTIME(start_date::DATE, '%Y-%m') as month,
      COUNT(*) as ads,
      SUM(impressions_total) as impressions
    FROM brand_ads_fashion
    WHERE brand IN (${inList(ALL_BRANDS)}) AND start_date IS NOT NULL
    GROUP BY brand, month ORDER BY brand, month
  `);

  const cadenceByBrand: Record<
    string,
    { month: string; ads: number; impressions: number }[]
  > = {};
  for (const b of ALL_BRANDS) {
    cadenceByBrand[b] = cadenceAll
      .filter((r) => r.brand === b)
      .map((r) => ({
        month: r.month,
        ads: r.ads,
        impressions: Number(r.impressions),
      }));
  }

  // ── Section 6: Content that works ─────────────────────────
  const spotlights = query<{
    llm_title: string | null;
    description: string;
    view_count: number;
    share_count: number;
    boost_count: number;
    thumbnail_url: string;
    content_url: string;
    duration_ms: number;
    uploaded_at: string;
    hashtags: string[];
  }>(`
    SELECT llm_title, description, view_count, share_count, boost_count,
      thumbnail_url, content_url, duration_ms, uploaded_at::VARCHAR as uploaded_at, hashtags
    FROM brand_profile_spotlights
    WHERE brand = '${BRAND}' AND view_count > 0
    ORDER BY view_count DESC
  `).map((r) => ({ ...r, view_count: Number(r.view_count) }));

  const spotlightTotals = {
    count: spotlights.length,
    total_views: spotlights.reduce((s, r) => s + r.view_count, 0),
    total_boosts: spotlights.reduce((s, r) => s + r.boost_count, 0),
    total_shares: spotlights.reduce((s, r) => s + r.share_count, 0),
  };

  // ── Section 7: Takeaways ──────────────────────────────────
  const diorSov = shareOfVoice.find((r) => r.brand === BRAND)!;
  const diorRank =
    shareOfVoice.findIndex((r) => r.brand === BRAND) + 1;
  const topBrand = shareOfVoice[0];

  const diorLens = formatByBrand[BRAND]?.find(
    (r) => r.format === "LENS_PACKAGE",
  );
  const cartierLens = formatByBrand["Cartier"]?.find(
    (r) => r.format === "LENS_PACKAGE",
  );
  const chanelLens = formatByBrand["Chanel"]?.find(
    (r) => r.format === "LENS_PACKAGE",
  );

  const gucci = shareOfVoice.find((r) => r.brand === "Gucci");

  const allCadenceMonths = new Set<string>();
  for (const entries of Object.values(cadenceByBrand)) {
    for (const e of entries) allCadenceMonths.add(e.month);
  }
  const diorActiveMonths = new Set((cadenceByBrand[BRAND] ?? []).map((e) => e.month));
  const silentMonths = [...allCadenceMonths].filter((m) => !diorActiveMonths.has(m)).sort();
  const competitorsInSilent = silentMonths.flatMap((m) =>
    ALL_BRANDS.filter((b) => b !== BRAND && (cadenceByBrand[b] ?? []).some((e) => e.month === m)),
  );
  const uniqueCompetitorsInSilent = new Set(competitorsInSilent).size;

  const takeaways = [
    {
      id: "ar-gap",
      title: "The AR Lens Gap",
      body: `Cartier puts ${cartierLens?.pct ?? 0}% of impressions into AR Lenses. ${chanelLens ? `Chanel: ${chanelLens.pct}%.` : ""} Dior: ${diorLens?.pct ?? 0}%. Premium format, premium CPMs, and your competitors are all-in.`,
    },
    {
      id: "silent-months",
      title: "The Silent Months",
      body: silentMonths.length > 0
        ? `Dior is dark ${silentMonths.length} of ${allCadenceMonths.size} months. During those gaps, ${uniqueCompetitorsInSilent} competitors are still running — capturing attention unchallenged. Always-on presence doesn't mean always-heavy; even low-spend maintenance keeps you in the feed.`
        : `Dior is active every month — good. But consistency matters as much as volume: ensure spend doesn't drop to near-zero in off-peak months.`,
    },
    {
      id: "efficiency",
      title: "The Efficiency Question",
      body: `${diorSov.ads} ads for ${(diorSov.impressions / 1e6).toFixed(0)}M impressions (${(diorSov.per_ad_avg / 1e6).toFixed(1)}M/ad). Gucci gets ${gucci ? `${(gucci.impressions / 1e6).toFixed(0)}M from just ${gucci.ads} ads (${(gucci.per_ad_avg / 1e6).toFixed(1)}M/ad)` : "comparable reach from far fewer ads"}.`,
    },
    {
      id: "content-opportunity",
      title: "The Content Opportunity",
      body: `${spotlightTotals.count} spotlight videos earned ${(spotlightTotals.total_views / 1000).toFixed(0)}K organic views and ${(spotlightTotals.total_boosts / 1000).toFixed(0)}K boosts. Fashion show behind-the-scenes content leads. This is a channel worth investing in.`,
    },
  ];

  // ── Discovery (explore data) ─────────────────────────────
  const EXPLORE_DIR = path.join(ROOT, "data_sources", "snap_explore", "data", "explore");
  const brandKeywords = ["dior", "chanel", "gucci", "cartier", "prada", "burberry", "louis_vuitton", "valentino", "balenciaga", "tiffany"];
  const discoveryByBrand: Record<string, {
    keyword: string;
    sections: { type: string; count: number }[];
    totalCreators: number;
    profileCount: number;
    topicCount: number;
    topics: string[];
    topCreators: { username: string; displayName: string; viewCount: number; thumbnailUrl?: string }[];
  }> = {};

  for (const kw of brandKeywords) {
    const file = path.join(EXPLORE_DIR, `${kw}.json`);
    if (!fs.existsSync(file)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
      const data = extractExploreData(kw, raw.pageProps);
      discoveryByBrand[kw] = {
        keyword: kw,
        sections: data.sections,
        totalCreators: data.totalCreators,
        profileCount: data.subscribeProfiles.length,
        topicCount: data.topics.length,
        topics: data.topics,
        topCreators: data.spotlightCreators
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, 5)
          .map((c) => ({
            username: c.username,
            displayName: c.displayName,
            viewCount: c.viewCount,
            thumbnailUrl: c.thumbnailUrl,
          })),
      };
    } catch {
      // skip
    }
  }

  // ── Profile ───────────────────────────────────────────────
  const profileRow = query<{
    bio: string;
    website_url: string;
    profile_picture_url: string;
    hero_image_url: string;
    spotlight_count: number;
    category: string;
  }>(`
    SELECT bio, website_url, profile_picture_url, hero_image_url,
      spotlight_count, category
    FROM brand_profiles WHERE brand = '${BRAND}'
  `)[0];

  // ── Assemble ──────────────────────────────────────────────
  const report = {
    generated_at: new Date().toISOString(),
    brand: BRAND,
    meta: {
      cpm_range: { low: CPM_LOW, high: CPM_HIGH },
      currency: "EUR",
      disclaimer:
        "Impression data is real (DSA-mandated). Spend estimates use published CPM benchmarks and are approximate.",
    },
    profile: profileRow
      ? {
          bio: profileRow.bio,
          website: profileRow.website_url,
          avatar_url: profileRow.profile_picture_url,
          hero_url: profileRow.hero_image_url,
          spotlight_count: profileRow.spotlight_count,
        }
      : null,
    landscape: {
      total_ads: landscape.total_ads,
      total_impressions: totalImpressions,
      est_spend_low: spend.low,
      est_spend_high: spend.high,
      brand_count: landscape.brand_count,
      country_count: landscape.country_count,
      market: {
        total_ads: marketWide.total_ads,
        total_impressions: marketImpressions,
        est_spend_low: marketSpend.low,
        est_spend_high: marketSpend.high,
        brand_count: marketWide.brand_count,
        country_count: marketWide.country_count,
      },
    },
    position: {
      dior_rank: diorRank,
      brands: shareOfVoice,
    },
    geography: {
      dior: diorGeo,
      missing_countries: missingCountries,
      competitors: competitorGeoSummary,
    },
    creative: {
      format_by_brand: formatByBrand,
      top_creatives: topCreatives,
    },
    cadence: cadenceByBrand,
    discovery: discoveryByBrand,
    content: {
      spotlights,
      totals: spotlightTotals,
    },
    takeaways,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2), "utf8");

  console.log(`Wrote ${OUT_FILE}`);
  console.log(
    `  ${landscape.total_ads} ads across ${landscape.brand_count} brands, ${landscape.country_count} countries`,
  );
  console.log(
    `  ${totalImpressions.toLocaleString()} total impressions (€${spend.low.toLocaleString()}–€${spend.high.toLocaleString()} est.)`,
  );
  console.log(`  Dior rank: #${diorRank} of ${shareOfVoice.length}`);
}

main();
