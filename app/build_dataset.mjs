#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SAMPLE_DIR = path.join(ROOT, "platform_choice", "data", "samples", "2026-04-07-snap-sponsored-content");
const OUT_DIR = path.join(__dirname, "data");
const OUT_FILE = path.join(OUT_DIR, "normalized.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function classifyText(text) {
  const t = (text || "").toLowerCase();
  if (["podcast", "playlist", "music", "spotify", "hörbuch", "audio"].some((k) => t.includes(k))) {
    return ["Audio", "Streaming"];
  }
  if (["crypto", "trading", "investment", "invest"].some((k) => t.includes(k))) {
    return ["Finance", "Investment"];
  }
  if (["tv", "show", "movie", "serie"].some((k) => t.includes(k))) {
    return ["Entertainment", "Video"];
  }
  return ["Unknown", "Unknown"];
}

function detectRisk(text, url) {
  const blob = `${text || ""} ${url || ""}`.toLowerCase();
  const flags = [];
  for (const term of ["crypto", "trading", "investment", "free money", "giveaway", "urgent", "scam"]) {
    if (blob.includes(term)) flags.push(term);
  }
  return flags;
}

function safeInt(v, defaultVal = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultVal;
}

function loadAdsFromFiles() {
  const candidates = [
    "ads_search_spotify_de_retry.json",
    "ads_search_nike_de_local.json",
    "ads_search_nike_de.json",
  ];
  const merged = { ad_previews: [] };
  const used = [];
  for (const name of candidates) {
    const filePath = path.join(SAMPLE_DIR, name);
    if (!fs.existsSync(filePath)) continue;
    const payload = readJson(filePath);
    if (payload.request_status === "SUCCESS") {
      merged.ad_previews.push(...(payload.ad_previews || []));
      used.push(name);
    }
  }
  return [merged, used];
}

function main() {
  const [ads, adsSourceFiles] = loadAdsFromFiles();
  const sponsored = readJson(path.join(SAMPLE_DIR, "sponsored_content_pages_1_2.json"));

  const now = new Date();
  const adsRows = [];
  const sponsoredRows = [];

  for (const item of ads.ad_previews || []) {
    const ad = item.ad_preview;
    if (!ad) continue;
    const startDate = ad.start_date;
    let dt = null;
    if (startDate) {
      const parsed = new Date(startDate.replace("Z", "+00:00"));
      dt = Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const runningDays = dt != null ? Math.floor((now - dt) / 86400000) : null;
    const impressionsTotal = safeInt(ad.impressions_total);
    const cpmLow = 4.0;
    const cpmHigh = 9.0;
    const estSpendLow = Math.round((impressionsTotal / 1000) * cpmLow * 100) / 100;
    const estSpendHigh = Math.round((impressionsTotal / 1000) * cpmHigh * 100) / 100;
    const headline = ad.headline || "";
    const url = (ad.web_view_properties || {}).url || "";
    const [category, subCategory] = classifyText(`${headline} ${url}`);
    const riskFlags = detectRisk(headline, url);

    adsRows.push({
      id: ad.id,
      platform: "Snapchat",
      advertiser: ad.paying_advertiser_name || "Unknown",
      brand: ad.brand_name || ad.profile_name || "Unknown",
      headline,
      cta: ad.call_to_action,
      start_date: startDate,
      running_days: runningDays,
      impressions_total: impressionsTotal,
      impressions_primary_country: safeInt((ad.impressions_map || {}).de),
      est_spend_low_eur: estSpendLow,
      est_spend_high_eur: estSpendHigh,
      performance_per_spend_proxy: Math.round(
        (impressionsTotal / Math.max((estSpendLow + estSpendHigh) / 2, 1)) * 100
      ) / 100,
      category,
      sub_category: subCategory,
      unknown_category: category === "Unknown",
      risk_flags: riskFlags,
      risk_score: Math.min(riskFlags.length * 2, 10),
      media_type: ad.top_snap_media_type || "Unknown",
      creative_url: ad.top_snap_media_download_link,
      landing_url: url,
      review_status: ad.review_status,
    });
  }

  let sponsoredPayload = sponsored;
  if (sponsored && typeof sponsored === "object" && !Array.isArray(sponsored)) {
    sponsoredPayload = [sponsored];
  }

  for (const page of sponsoredPayload || []) {
    for (const item of page.ad_previews || []) {
      const sc = item.sponsored_content_preview;
      if (!sc) continue;
      const creator = sc.creator_name || "Unknown";
      const sponsor = sc.sponsor_name || "Unknown";
      const [cat, sub] = classifyText(`${creator} ${sponsor}`);
      sponsoredRows.push({
        creator_name: creator,
        sponsor_name: sponsor,
        content_type: sc.content_type,
        content_url: sc.content_url,
        thumbnail_url: sc.thumbnail_url,
        category: cat,
        sub_category: sub,
      });
    }
  }

  const sponsorCounts = {};
  const creatorCounts = {};
  for (const row of sponsoredRows) {
    const sponsor = row.sponsor_name || "Unknown";
    const creator = row.creator_name || "Unknown";
    sponsorCounts[sponsor] = (sponsorCounts[sponsor] || 0) + 1;
    creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
  }

  const topSponsors = Object.entries(sponsorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sponsor_name, count]) => ({ sponsor_name, count }));

  const topCreators = Object.entries(creatorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([creator_name, count]) => ({ creator_name, count }));

  const advertisers = {};
  for (const r of adsRows) {
    const key = r.advertiser;
    if (!advertisers[key]) {
      advertisers[key] = { impressions: 0, est_low: 0, est_high: 0, ads: 0 };
    }
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

  const output = {
    generated_at_utc: now.toISOString(),
    notes: {
      spend_model: "Very rough proxy from impressions using fixed CPM range 4-9 EUR.",
      performance_model: "Impressions per estimated euro midpoint.",
      warning: "Prototype only. Do not treat spend as exact.",
      ads_source_files_used: adsSourceFiles,
    },
    kpis: {
      ads_count: adsRows.length,
      sponsored_content_count: sponsoredRows.length,
      total_impressions: adsRows.reduce((s, x) => s + x.impressions_total, 0),
      est_spend_low_total_eur: Math.round(adsRows.reduce((s, x) => s + x.est_spend_low_eur, 0) * 100) / 100,
      est_spend_high_total_eur: Math.round(adsRows.reduce((s, x) => s + x.est_spend_high_eur, 0) * 100) / 100,
      unknown_category_ratio: Math.round(
        ((adsRows.filter((x) => x.unknown_category).length / Math.max(adsRows.length, 1)) * 100) * 10
      ) / 10,
    },
    sponsored_kpis: {
      sponsored_rows: sponsoredRows.length,
      unique_creators: Object.keys(creatorCounts).length,
      unique_sponsors: Object.keys(sponsorCounts).length,
      top_sponsors: topSponsors,
      top_creators: topCreators,
      scope_note:
        "Represents sponsored/commercial content endpoint coverage, not full organic platform feed.",
    },
    leaderboard,
    ads: adsRows,
    sponsored_content: sponsoredRows,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), "utf8");
  console.log(`Wrote ${OUT_FILE}`);
}

main();
