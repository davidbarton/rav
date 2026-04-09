/**
 * ============================================================================
 * SNAP POLITICAL ADS — BULK DOWNLOADER
 * ============================================================================
 *
 * Downloads Snapchat's Political Ads Library — bulk CSV ZIPs published on
 * Google Cloud Storage, one per year from 2018 onward.
 *
 * Unlike the Ads Gallery API (source 1) and Sponsored Content API (source 2),
 * this requires NO authentication, NO API calls, NO rate limit gymnastics.
 * It's static files on GCS. Just download, unzip, parse.
 *
 * Usage (from repo root):
 *   npm run fetch:political                       # download all years + summarize
 *   npm run fetch:political:summary               # skip download, just summarize
 *   npm run fetch:political -- --year 2024        # single year only
 *
 * Data source:
 *   https://storage.googleapis.com/ad-manager-political-ads-dump/political/{year}/PoliticalAds.zip
 *   Web UI: https://www.snap.com/political-ads
 *
 * CSV schema (38 columns):
 *   ADID, CreativeUrl, Currency Code, Spend, Impressions, StartDate, EndDate,
 *   OrganizationName, BillingAddress, CandidateBallotInformation,
 *   PayingAdvertiserName, CommitteeName, CommitteeIdentificationNumber,
 *   DisclosureNameOfCommittee, AdvertisingJurisdiction, Gender, AgeBracket,
 *   CountryCode, Regions (Included/Excluded), Electoral Districts (In/Ex),
 *   Radius Targeting (In/Ex), Metros (In/Ex), Postal Codes (In/Ex),
 *   Location Categories (In/Ex), Interests, OsType, Segments, Language,
 *   AdvancedDemographics, Targeting Connection Type, Targeting Carrier (ISP),
 *   CreativeProperties
 *
 * Key advantages over other Snap data sources:
 *   - ACTUAL SPEND DATA (not just impressions)
 *   - Full targeting breakdown (geo, demo, interest, device)
 *   - Committee/organization transparency chain
 *   - Historical data back to 2018
 *   - Bulk downloadable, no API needed
 *   - Creative asset URLs included
 *
 * ============================================================================
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const __dirname = import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname);
const DATA_DIR = path.resolve(__dirname, "..", "data");
const ZIPS_DIR = path.join(DATA_DIR, "zips");
const CSV_DIR = path.join(DATA_DIR, "csv");

const GCS_BASE = "https://storage.googleapis.com/ad-manager-political-ads-dump/political";

const FIRST_YEAR = 2018;
const CURRENT_YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(level: "INFO" | "WARN" | "ERR " | "DATA", msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

// ---------------------------------------------------------------------------
// Filesystem
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Download + Extract
// ---------------------------------------------------------------------------

interface DownloadResult {
  year: number;
  zipSize: number;
  csvRows: number;
  csvSize: number;
  skipped: boolean;
}

async function downloadYear(year: number): Promise<DownloadResult | null> {
  const url = `${GCS_BASE}/${year}/PoliticalAds.zip`;
  const zipFile = path.join(ZIPS_DIR, `PoliticalAds_${year}.zip`);
  const csvDir = path.join(CSV_DIR, String(year));
  const csvFile = path.join(csvDir, "PoliticalAds.csv");

  if (fs.existsSync(csvFile)) {
    const stat = fs.statSync(csvFile);
    const lines = countLines(csvFile);
    log("INFO", `${year}: already extracted (${lines} rows, ${fmtBytes(stat.size)}). Skipping.`);
    return {
      year,
      zipSize: fs.existsSync(zipFile) ? fs.statSync(zipFile).size : 0,
      csvRows: lines,
      csvSize: stat.size,
      skipped: true,
    };
  }

  log("INFO", `${year}: downloading ${url}`);
  ensureDir(ZIPS_DIR);
  ensureDir(csvDir);

  try {
    execSync(`curl -sL -o "${zipFile}" "${url}"`, { timeout: 60_000 });
  } catch (err) {
    log("ERR ", `${year}: download failed — ${err}`);
    return null;
  }

  const zipStat = fs.statSync(zipFile);
  log("DATA", `${year}: downloaded ${fmtBytes(zipStat.size)}`);

  try {
    execSync(`unzip -o -q "${zipFile}" -d "${csvDir}/"`, { timeout: 30_000 });
  } catch (err) {
    log("ERR ", `${year}: unzip failed — ${err}`);
    return null;
  }

  if (!fs.existsSync(csvFile)) {
    log("ERR ", `${year}: no PoliticalAds.csv found after extraction`);
    return null;
  }

  const csvStat = fs.statSync(csvFile);
  const lines = countLines(csvFile);
  log("DATA", `${year}: extracted ${lines} rows (${fmtBytes(csvStat.size)})`);

  return {
    year,
    zipSize: zipStat.size,
    csvRows: lines,
    csvSize: csvStat.size,
    skipped: false,
  };
}

function countLines(filePath: string): number {
  const buf = fs.readFileSync(filePath, "utf-8");
  return buf.split("\n").filter((l) => l.trim().length > 0).length - 1; // -1 for header
}

// ---------------------------------------------------------------------------
// CSV Parsing (streaming, low memory)
// ---------------------------------------------------------------------------

interface YearStats {
  year: number;
  ads: number;
  spend: number;
  impressions: number;
  countries: Record<string, number>;
  orgs: Record<string, number>;
  currencies: Record<string, number>;
  payingAdvertisers: Record<string, number>;
}

async function parseYear(year: number): Promise<YearStats | null> {
  const csvFile = path.join(CSV_DIR, String(year), "PoliticalAds.csv");
  if (!fs.existsSync(csvFile)) return null;

  const stats: YearStats = {
    year,
    ads: 0,
    spend: 0,
    impressions: 0,
    countries: {},
    orgs: {},
    currencies: {},
    payingAdvertisers: {},
  };

  const rl = createInterface({ input: createReadStream(csvFile), crlfDelay: Infinity });

  let headers: string[] = [];
  let isFirst = true;

  for await (const line of rl) {
    if (isFirst) {
      headers = parseCSVLine(line);
      isFirst = false;
      continue;
    }

    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] ?? "";
    }

    stats.ads++;
    stats.spend += parseFloat(row["Spend"] || "0") || 0;
    stats.impressions += parseInt(row["Impressions"] || "0", 10) || 0;

    const country = (row["CountryCode"] || "").trim().toLowerCase();
    if (country) stats.countries[country] = (stats.countries[country] ?? 0) + 1;

    const org = (row["OrganizationName"] || "").trim();
    if (org) stats.orgs[org] = (stats.orgs[org] ?? 0) + 1;

    const currency = (row["Currency Code"] || "").trim();
    if (currency) stats.currencies[currency] = (stats.currencies[currency] ?? 0) + 1;

    const payer = (row["PayingAdvertiserName"] || "").trim();
    if (payer) stats.payingAdvertisers[payer] = (stats.payingAdvertisers[payer] ?? 0) + 1;
  }

  return stats;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// ---------------------------------------------------------------------------
// Summary output
// ---------------------------------------------------------------------------

function topN(record: Record<string, number>, n: number): [string, number][] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function printSummary(yearStats: YearStats[]): void {
  const totals = {
    ads: 0,
    spend: 0,
    impressions: 0,
    countries: {} as Record<string, number>,
    orgs: {} as Record<string, number>,
    currencies: {} as Record<string, number>,
    payingAdvertisers: {} as Record<string, number>,
  };

  console.log("\n" + "=".repeat(72));
  console.log("  SNAPCHAT POLITICAL ADS LIBRARY — COMPLETE DATASET");
  console.log("=".repeat(72));

  console.log("\nBY YEAR:");
  console.log("  Year    Ads      Spend (mixed curr)    Impressions");
  console.log("  " + "-".repeat(62));

  for (const ys of yearStats) {
    totals.ads += ys.ads;
    totals.spend += ys.spend;
    totals.impressions += ys.impressions;
    for (const [k, v] of Object.entries(ys.countries)) totals.countries[k] = (totals.countries[k] ?? 0) + v;
    for (const [k, v] of Object.entries(ys.orgs)) totals.orgs[k] = (totals.orgs[k] ?? 0) + v;
    for (const [k, v] of Object.entries(ys.currencies)) totals.currencies[k] = (totals.currencies[k] ?? 0) + v;
    for (const [k, v] of Object.entries(ys.payingAdvertisers)) totals.payingAdvertisers[k] = (totals.payingAdvertisers[k] ?? 0) + v;

    console.log(
      `  ${ys.year}  ${fmtNum(ys.ads).padStart(7)}  $${fmtNum(Math.round(ys.spend)).padStart(14)}  ${fmtNum(ys.impressions).padStart(18)}`,
    );
  }
  console.log("  " + "-".repeat(62));
  console.log(
    `  TOTAL ${fmtNum(totals.ads).padStart(7)}  $${fmtNum(Math.round(totals.spend)).padStart(14)}  ${fmtNum(totals.impressions).padStart(18)}`,
  );

  console.log("\nTOP 15 COUNTRIES:");
  for (const [country, count] of topN(totals.countries, 15)) {
    console.log(`  ${(country || "(empty)").padEnd(30)} ${fmtNum(count).padStart(7)} ads`);
  }

  console.log("\nTOP 15 ORGANIZATIONS:");
  for (const [org, count] of topN(totals.orgs, 15)) {
    console.log(`  ${org.slice(0, 48).padEnd(48)} ${fmtNum(count).padStart(7)} ads`);
  }

  console.log("\nTOP 15 PAYING ADVERTISERS:");
  for (const [adv, count] of topN(totals.payingAdvertisers, 15)) {
    console.log(`  ${adv.slice(0, 48).padEnd(48)} ${fmtNum(count).padStart(7)} ads`);
  }

  console.log("\nCURRENCIES:");
  for (const [curr, count] of topN(totals.currencies, 20)) {
    console.log(`  ${curr.padEnd(6)} ${fmtNum(count).padStart(7)} ads`);
  }

  // Save machine-readable summary
  const summaryFile = path.join(DATA_DIR, "summary.json");
  const summary = {
    generated_at: new Date().toISOString(),
    years: yearStats.map((ys) => ({
      year: ys.year,
      ads: ys.ads,
      spend: Math.round(ys.spend),
      impressions: ys.impressions,
      top_countries: topN(ys.countries, 5),
      top_orgs: topN(ys.orgs, 5),
    })),
    totals: {
      ads: totals.ads,
      spend: Math.round(totals.spend),
      impressions: totals.impressions,
    },
    top_countries: topN(totals.countries, 30),
    top_orgs: topN(totals.orgs, 30),
    top_paying_advertisers: topN(totals.payingAdvertisers, 30),
    currencies: topN(totals.currencies, 20),
  };
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  log("DATA", `Summary saved: ${summaryFile}`);

  console.log("\n" + "=".repeat(72));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const summaryOnly = args.includes("--summary");
  const yearIdx = args.indexOf("--year");
  const singleYear = yearIdx >= 0 ? parseInt(args[yearIdx + 1], 10) : null;

  const years = singleYear
    ? [singleYear]
    : Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

  log("INFO", `Snapchat Political Ads Downloader`);
  log("INFO", `Data dir: ${DATA_DIR}`);
  log("INFO", `Years: ${years[0]}–${years[years.length - 1]} (${years.length} total)`);

  if (!summaryOnly) {
    ensureDir(DATA_DIR);
    const results: DownloadResult[] = [];

    for (const year of years) {
      const result = await downloadYear(year);
      if (result) results.push(result);
    }

    const downloaded = results.filter((r) => !r.skipped);
    const totalZip = results.reduce((s, r) => s + r.zipSize, 0);
    const totalCsv = results.reduce((s, r) => s + r.csvSize, 0);
    const totalRows = results.reduce((s, r) => s + r.csvRows, 0);

    log("INFO", `Download complete: ${results.length} years, ${downloaded.length} new`);
    log("DATA", `ZIP total: ${fmtBytes(totalZip)} | CSV total: ${fmtBytes(totalCsv)} | Rows: ${fmtNum(totalRows)}`);
  }

  log("INFO", "Parsing CSVs for summary...");
  const allStats: YearStats[] = [];
  for (const year of years) {
    const stats = await parseYear(year);
    if (stats) allStats.push(stats);
  }

  printSummary(allStats);
}

main().catch((err) => {
  log("ERR ", `Fatal: ${err}`);
  process.exit(1);
});
