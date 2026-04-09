/**
 * Bulk download Snapchat ads for a curated list of Fashion & Beauty brands.
 *
 * Usage:
 *   npx tsx src/download_ads.ts                        # all brands, default = API doc country list
 *   npx tsx src/download_ads.ts --countries de,fr      # specific countries
 *   npx tsx src/download_ads.ts --retry                # retry only previously failed brands
 *   npx tsx src/download_ads.ts --limit 50             # first 50 brands only
 *   npx tsx src/download_ads.ts --status               # print status matrix and exit
 *   npx tsx src/download_ads.ts --proxy residential     # use RESIDENTAL_PROXY from .env
 *   npx tsx src/download_ads.ts --loop                  # keep retrying until all brands resolved
 *   npx tsx src/download_ads.ts --loop --cooldown 60    # 60s between passes (default: 30s)
 *   npx tsx src/download_ads.ts --loop --forever       # never stop on "zero progress" (keep retrying)
 *
 * State tracking:
 *   Each brand × country combination has one of these states:
 *     "fetched"      — got real ads data (file saved)
 *     "no_ads"       — API returned success but 0 ads (brand doesn't advertise there)
 *     "rate_limited"  — E1009, needs retry with fresh IP
 *     "error"        — non-retriable error
 *     (missing)      — not attempted yet
 *
 * Reads brands from: data/brands_fashion.json
 * Writes ads to:     data/ads_fashion/{Brand}_{country}.json
 * State file:        data/ads_fashion/state.json
 * Request log:       data/ads_fashion/download_log.jsonl
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { gotScraping } from "got-scraping";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (let dir = __dirname; dir !== path.dirname(dir); dir = path.dirname(dir)) {
  const envPath = path.join(dir, ".env");
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Brand {
  brand: string;
  group: string;
  sub: string;
}

type CellStatus = "fetched" | "no_ads" | "rate_limited" | "error";

/**
 * State tracks every brand × country cell.
 * Key format: "BrandName::cc" (e.g., "Nike::de")
 */
interface CellState {
  status: CellStatus;
  ads_count: number;
  fetched_at?: string;
  error?: string;
  next_link?: string; // pagination cursor to resume from
}

interface State {
  cells: Record<string, CellState>;
  total_requests: number;
  total_ads: number;
  countries: string[];
  started_at: string;
  last_updated: string;
}

interface LogEntry {
  ts: string;
  brand: string;
  country: string;
  status: CellStatus;
  ads_count: number;
  has_more: boolean;
  error_code?: string;
  elapsed_ms: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, "..", "data");
const BRANDS_FILE = path.join(DATA_DIR, "brands_fashion.json");
const OUT_DIR = path.join(DATA_DIR, "ads_fashion");
const LOG_FILE = path.join(OUT_DIR, "download_log.jsonl");
const STATE_FILE = path.join(OUT_DIR, "state.json");

/** Ads Library `/ads/search` — `countries` possible values (Snap docs, Ads Gallery API). */
const PRIORITY_COUNTRIES = [
  "de", "be", "fi", "pt", "bg", "dk", "lt", "lu", "hr", "lv", "fr", "hu", "se", "si", "sk", "ie",
  "ee", "el", "mt", "it", "es", "at", "cy", "cz", "pl", "ro", "nl",
];
const BASE = "https://adsapi.snapchat.com/v1/ads_library";
const DELAY_MS = 2500;
const DELAY_AFTER_E1009_MS = 300;
const CONCURRENCY = 3;
const REQUEST_TIMEOUT = 30_000;
const PAGE_LIMIT = 50;

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

function cellKey(brand: string, country: string): string {
  return `${brand}::${country}`;
}

function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    if (raw.cells) return raw as State;
    // Migrate old format
    return migrateOldState(raw);
  }
  return {
    cells: {},
    total_requests: 0,
    total_ads: 0,
    countries: PRIORITY_COUNTRIES,
    started_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

function migrateOldState(old: Record<string, unknown>): State {
  const cells: State["cells"] = {};
  const completed = (old.completed ?? {}) as Record<string, string[]>;
  const failed = (old.failed ?? {}) as Record<string, string[]>;
  const empty = (old.empty ?? {}) as Record<string, string[]>;

  for (const [brand, countries] of Object.entries(completed)) {
    for (const c of countries) {
      const isEmpty = empty[brand]?.includes(c);
      const adsFile = path.join(OUT_DIR, `${brand.replace(/[^a-zA-Z0-9]/g, "_")}_${c}.json`);
      let adsCount = 0;
      if (!isEmpty && fs.existsSync(adsFile)) {
        try {
          const d = JSON.parse(fs.readFileSync(adsFile, "utf-8"));
          adsCount = d.ads?.length ?? 0;
        } catch { /* ignore */ }
      }
      cells[cellKey(brand, c)] = {
        status: adsCount > 0 ? "fetched" : "no_ads",
        ads_count: adsCount,
      };
    }
  }
  for (const [brand, countries] of Object.entries(failed)) {
    for (const c of countries) {
      if (!cells[cellKey(brand, c)]) {
        cells[cellKey(brand, c)] = { status: "rate_limited", ads_count: 0 };
      }
    }
  }

  return {
    cells,
    total_requests: (old.total_requests as number) ?? 0,
    total_ads: (old.total_ads as number) ?? 0,
    countries: PRIORITY_COUNTRIES,
    started_at: (old.started_at as string) ?? new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

function saveState(state: State): void {
  state.last_updated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ---------------------------------------------------------------------------
// Status display
// ---------------------------------------------------------------------------

function printStatus(brands: Brand[], state: State, countries: string[]): void {
  const counts = { fetched: 0, no_ads: 0, rate_limited: 0, error: 0, pending: 0 };
  const byCountry: Record<string, { fetched: number; no_ads: number; rate_limited: number; pending: number }> = {};
  for (const c of countries) {
    byCountry[c] = { fetched: 0, no_ads: 0, rate_limited: 0, pending: 0 };
  }

  const rows: string[] = [];
  for (const { brand, sub } of brands) {
    const cells: string[] = [];
    let brandDone = true;
    for (const c of countries) {
      const cell = state.cells[cellKey(brand, c)];
      if (!cell) {
        cells.push("  .  ");
        counts.pending++;
        byCountry[c].pending++;
        brandDone = false;
      } else if (cell.status === "fetched") {
        cells.push(` ${String(cell.ads_count).padStart(3, " ")}✓`);
        counts.fetched++;
        byCountry[c].fetched++;
      } else if (cell.status === "no_ads") {
        cells.push("  0  ");
        counts.no_ads++;
        byCountry[c].no_ads++;
      } else if (cell.status === "rate_limited") {
        if (cell.ads_count > 0) {
          cells.push(`${String(cell.ads_count).padStart(3, " ")}…`);
        } else {
          cells.push("  ×  ");
        }
        counts.rate_limited++;
        byCountry[c].rate_limited++;
        brandDone = false;
      } else {
        cells.push("  !  ");
        counts.error++;
        brandDone = false;
      }
    }
    const status = brandDone ? "DONE" : "    ";
    rows.push(`  ${status} ${brand.padEnd(28)} ${sub.padEnd(14)} ${cells.join(" ")}`);
  }

  const header = `       ${"Brand".padEnd(28)} ${"Sub".padEnd(14)} ${countries.map((c) => ` ${c.toUpperCase().padStart(3, " ")} `).join(" ")}`;
  console.log("\n" + "=".repeat(header.length));
  console.log("  FASHION & BEAUTY ADS — STATUS MATRIX");
  console.log("=".repeat(header.length));
  console.log(`  Legend: ###✓ = complete | ###… = partial (needs more pages) | 0 = no ads | × = rate limited | . = pending | ! = error`);
  console.log(header);
  console.log("-".repeat(header.length));
  for (const row of rows) console.log(row);
  console.log("-".repeat(header.length));

  const total = brands.length * countries.length;
  console.log(`\n  TOTALS (${total} cells = ${brands.length} brands × ${countries.length} countries):`);
  console.log(`    Fetched (real ads):  ${counts.fetched}`);
  console.log(`    No ads:             ${counts.no_ads}`);
  console.log(`    Rate limited:       ${counts.rate_limited}`);
  console.log(`    Pending:            ${counts.pending}`);
  console.log(`    Errors:             ${counts.error}`);
  console.log(`    Total ads:          ${state.total_ads}`);

  console.log(`\n  BY COUNTRY:`);
  for (const c of countries) {
    const b = byCountry[c];
    console.log(`    ${c.toUpperCase()}: ${b.fetched} fetched, ${b.no_ads} empty, ${b.rate_limited} rate-limited, ${b.pending} pending`);
  }
  console.log("");
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(level: string, msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

function appendLog(entry: LogEntry): void {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function pickProxy(): string | undefined {
  const args = process.argv.slice(2);
  const proxyIdx = args.indexOf("--proxy");
  if (proxyIdx >= 0) {
    const choice = args[proxyIdx + 1];
    if (choice === "residential" || choice === "res") return process.env.RESIDENTAL_PROXY;
    if (choice === "datacenter" || choice === "dc") return process.env.SNAP_PROXY;
    return choice; // treat as raw URL
  }
  return process.env.SNAP_PROXY;
}

const proxyUrl = pickProxy();

async function fetchAds(
  brand: string,
  country: string,
): Promise<{ status: CellStatus; ads: unknown[]; nextLink?: string; errorCode?: string }> {
  const url = `${BASE}/ads/search?limit=${PAGE_LIMIT}`;
  const body = JSON.stringify({ paying_advertiser_name: brand, countries: [country] });

  let statusCode: number;
  let text: string;
  try {
    const resp = await gotScraping({
      url,
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      proxyUrl,
      headerGeneratorOptions: { browsers: ["chrome"], operatingSystems: ["macos"] },
      responseType: "text",
      throwHttpErrors: false,
      timeout: { request: REQUEST_TIMEOUT },
    });
    statusCode = resp.statusCode;
    text = resp.body as string;
  } catch (err) {
    return { status: "error", ads: [], errorCode: `NETWORK: ${err}` };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    return { status: "error", ads: [], errorCode: `PARSE: HTTP ${statusCode}` };
  }

  if (data.request_status === "ERROR") {
    const code = data.error_code as string;
    if (code === "E1009") return { status: "rate_limited", ads: [], errorCode: code };
    return { status: "error", ads: [], errorCode: `${code}: ${data.debug_message}` };
  }

  const ads = (data.ads ?? data.ad_previews ?? []) as unknown[];
  const paging = data.paging as { next_link?: string } | undefined;
  const nextLink = (paging?.next_link && ads.length > 0) ? paging.next_link : undefined;

  if (ads.length === 0) return { status: "no_ads", ads: [], nextLink: undefined };
  return { status: "fetched", ads, nextLink };
}

async function fetchRemainingPages(
  brand: string,
  country: string,
  startCursor: string,
): Promise<{ ads: unknown[]; pages: number; complete: boolean; lastCursor?: string }> {
  const allAds: unknown[] = [];
  let cursor: string | undefined = startCursor;
  let page = 0;

  while (cursor) {
    await sleep(DELAY_MS);

    let resp;
    try {
      resp = await gotScraping({
        url: cursor, method: "POST",
        body: JSON.stringify({ paying_advertiser_name: brand, countries: [country] }),
        headers: { "content-type": "application/json" },
        proxyUrl,
        headerGeneratorOptions: { browsers: ["chrome"], operatingSystems: ["macos"] },
        responseType: "text", throwHttpErrors: false,
        timeout: { request: REQUEST_TIMEOUT },
      });
    } catch { return { ads: allAds, pages: page, complete: false, lastCursor: cursor }; }

    let data: Record<string, unknown>;
    try { data = JSON.parse(resp.body as string); } catch { return { ads: allAds, pages: page, complete: false, lastCursor: cursor }; }

    if (data.request_status !== "SUCCESS") {
      log("WARN", `  Pagination interrupted on page ${page + 1}: ${data.error_code ?? data.request_status}`);
      return { ads: allAds, pages: page, complete: false, lastCursor: cursor };
    }

    const ads = (data.ads ?? data.ad_previews ?? []) as unknown[];
    allAds.push(...ads);
    page++;

    const paging = data.paging as { next_link?: string } | undefined;
    if (!paging?.next_link || ads.length === 0) {
      return { ads: allAds, pages: page, complete: true };
    }
    cursor = paging.next_link;
  }

  return { ads: allAds, pages: page, complete: true };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const showStatus = args.includes("--status");
  const retryOnly = args.includes("--retry");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
  const countriesIdx = args.indexOf("--countries");
  const countries = countriesIdx >= 0 ? args[countriesIdx + 1].split(",") : PRIORITY_COUNTRIES;

  const brands: Brand[] = JSON.parse(fs.readFileSync(BRANDS_FILE, "utf-8"));
  const state = loadState();
  state.countries = countries;

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  if (showStatus) {
    printStatus(brands, state, countries);
    return;
  }

  if (!proxyUrl) {
    log("ERR", "SNAP_PROXY not set in .env");
    process.exit(1);
  }

  const loopMode = args.includes("--loop");
  const foreverMode = args.includes("--forever");
  const cooldownIdx = args.indexOf("--cooldown");
  const cooldownSec = cooldownIdx >= 0 ? parseInt(args[cooldownIdx + 1], 10) : 30;

  log("INFO", `Brands: ${brands.length} | Countries: ${countries.join(",")} | Retry: ${retryOnly || loopMode} | Loop: ${loopMode} | Forever: ${foreverMode} | Limit: ${limit}`);
  log("INFO", `Proxy: ${proxyUrl.replace(/:[^:@]+@/, ":***@")}`);

  let passNum = 0;

  let nextCooldown = cooldownSec;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    passNum++;
    let processed = 0;
    let passStats = { fetched: 0, no_ads: 0, rate_limited: 0, error: 0 };

    if (passNum > 1) {
      log("INFO", "");
      log("INFO", `=== PASS ${passNum} — cooling down ${nextCooldown}s ===`);
      await sleep(nextCooldown * 1000);
    }

    const shuffled = [...brands].sort(() => Math.random() - 0.5);

    // Collect eligible brand+country pairs for this pass
    type Job = { brand: string; country: string; key: string; outFile: string };
    const jobs: Job[] = [];
    for (const { brand } of shuffled) {
      if (jobs.length >= limit) break;
      for (const country of countries) {
        if (jobs.length >= limit) break;
        const key = cellKey(brand, country);
        const existing = state.cells[key];
        if (existing?.status === "fetched" || existing?.status === "no_ads") continue;
        if ((retryOnly || loopMode) && passNum > 1 && existing?.status !== "rate_limited" && existing?.status !== "error") continue;
        jobs.push({ brand, country, key, outFile: path.join(OUT_DIR, `${brand.replace(/[^a-zA-Z0-9]/g, "_")}_${country}.json`) });
      }
    }

    // Process jobs in parallel batches
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const batch = jobs.slice(i, i + CONCURRENCY);
      const labels = batch.map((j) => j.brand).join(", ");
      log("INFO", `[${i + 1}-${i + batch.length}/${jobs.length}] ${labels}`);

      const results = await Promise.all(batch.map(async (job) => {
        const { brand, country, key } = job;
        const existing = state.cells[key];
        const savedCursor = existing?.next_link;
        const start = Date.now();

        // --- RESUME PATH ---
        if (savedCursor && existing?.ads_count && existing.ads_count > 0) {
          const rest = await fetchRemainingPages(brand, country, savedCursor);
          return { job, type: "resume" as const, rest, elapsed: Date.now() - start, existing };
        }

        // --- FRESH FETCH ---
        const result = await fetchAds(brand, country);
        return { job, type: "fresh" as const, result, elapsed: Date.now() - start, existing };
      }));

      // Process results sequentially (shared state)
      let batchHadSuccess = false;
      for (const r of results) {
        const { job, elapsed, existing } = r;
        const { brand, country, key, outFile } = job;
        const previousCount = existing?.ads_count ?? 0;
        processed++;
        state.total_requests++;

        if (r.type === "resume") {
          const { rest } = r;
          appendLog({
            ts: new Date().toISOString(), brand, country,
            status: rest.complete ? "fetched" : "rate_limited",
            ads_count: rest.ads.length, has_more: !rest.complete,
            error_code: rest.complete ? undefined : "RESUME_INTERRUPTED", elapsed_ms: elapsed,
          });

          if (rest.ads.length > 0 || rest.complete) {
            let previousAds: unknown[] = [];
            if (fs.existsSync(outFile)) {
              try { previousAds = JSON.parse(fs.readFileSync(outFile, "utf-8")).ads ?? []; } catch { /* */ }
            }
            const allAds = [...previousAds, ...rest.ads];
            const paginationComplete = rest.complete;
            fs.writeFileSync(outFile, JSON.stringify({
              brand, country, fetched_at: new Date().toISOString(),
              ads_count: allAds.length, pagination_complete: paginationComplete, ads: allAds,
            }, null, 2));
            const newAds = allAds.length - previousAds.length;
            state.total_ads += newAds;
            state.cells[key] = {
              status: paginationComplete ? "fetched" : "rate_limited",
              ads_count: allAds.length, fetched_at: new Date().toISOString(),
              ...(paginationComplete ? {} : { next_link: rest.lastCursor, error: "PARTIAL" }),
            };
            passStats.fetched++;
            batchHadSuccess = true;
            log("DATA", `  ${brand}: +${newAds} → ${allAds.length} total (${rest.pages} pg, ${paginationComplete ? "complete" : "PARTIAL"}) (${elapsed}ms)`);
          } else {
            state.cells[key] = { ...existing!, next_link: undefined, error: "PARTIAL: cursor expired, will retry from page 1" };
            passStats.rate_limited++;
            log("WARN", `  ${brand}: resume failed — cursor dead (${elapsed}ms)`);
          }
        } else {
          const { result } = r;
          appendLog({
            ts: new Date().toISOString(), brand, country,
            status: result.status, ads_count: result.ads.length,
            has_more: Boolean(result.nextLink), error_code: result.errorCode, elapsed_ms: elapsed,
          });

          if (result.status === "fetched") {
            let ads = result.ads;
            let pages = 1;
            let paginationComplete = !result.nextLink;
            let lastCursor: string | undefined;

            if (result.nextLink) {
              const rest = await fetchRemainingPages(brand, country, result.nextLink);
              ads = [...result.ads, ...rest.ads];
              pages = 1 + rest.pages;
              paginationComplete = rest.complete;
              lastCursor = rest.lastCursor;
            }

            if (ads.length >= previousCount) {
              fs.writeFileSync(outFile, JSON.stringify({
                brand, country, fetched_at: new Date().toISOString(),
                ads_count: ads.length, pagination_complete: paginationComplete, ads,
              }, null, 2));
              state.cells[key] = {
                status: paginationComplete ? "fetched" : "rate_limited",
                ads_count: ads.length, fetched_at: new Date().toISOString(),
                ...(paginationComplete ? {} : { next_link: lastCursor, error: "PARTIAL" }),
              };
              state.total_ads += ads.length - previousCount;
            } else {
              state.cells[key] = {
                status: paginationComplete ? "fetched" : "rate_limited",
                ads_count: previousCount, fetched_at: existing?.fetched_at,
                ...(paginationComplete ? {} : { next_link: lastCursor, error: "PARTIAL" }),
              };
            }
            passStats.fetched++;
            batchHadSuccess = true;
            log("DATA", `  ${brand}: ${ads.length} ads (${pages} pg, ${paginationComplete ? "complete" : "PARTIAL"}) (${elapsed}ms)`);
          } else if (result.status === "no_ads") {
            if (previousCount > 0) {
              state.cells[key] = { status: "rate_limited", ads_count: previousCount, error: "SOFT_BLOCK" };
              passStats.rate_limited++;
              log("WARN", `  ${brand}: 0 ads but have ${previousCount} — soft block (${elapsed}ms)`);
            } else {
              state.cells[key] = { status: "no_ads", ads_count: 0 };
              passStats.no_ads++;
              log("INFO", `  ${brand}: 0 ads (${elapsed}ms)`);
            }
            batchHadSuccess = true;
          } else if (result.status === "rate_limited") {
            state.cells[key] = { status: "rate_limited", ads_count: previousCount, error: result.errorCode };
            passStats.rate_limited++;
            log("WARN", `  ${brand}: E1009 (${elapsed}ms)`);
          } else {
            state.cells[key] = { status: "error", ads_count: previousCount, error: result.errorCode };
            passStats.error++;
            log("ERR", `  ${brand}: ${result.errorCode} (${elapsed}ms)`);
          }
        }
      }

      saveState(state);
      await sleep(batchHadSuccess ? DELAY_MS : DELAY_AFTER_E1009_MS);
    }

    log("INFO", "");
    log("INFO", `=== PASS ${passNum} COMPLETE ===`);
    log("INFO", `Processed:      ${processed}`);
    log("INFO", `Fetched:        ${passStats.fetched}`);
    log("INFO", `No ads:         ${passStats.no_ads}`);
    log("INFO", `Rate limited:   ${passStats.rate_limited}`);
    log("INFO", `Errors:         ${passStats.error}`);
    log("INFO", `Hit rate:       ${processed > 0 ? (((passStats.fetched + passStats.no_ads) / processed) * 100).toFixed(1) : 0}%`);
    log("INFO", `Total ads all-time: ${state.total_ads}`);

    saveState(state);
    printStatus(brands, state, countries);

    if (!loopMode) break;

    const remaining = Object.values(state.cells).filter((c) => c.status === "rate_limited" || c.status === "error").length;
    if (remaining === 0) {
      log("INFO", "ALL BRANDS RESOLVED — stopping loop.");
      break;
    }

    const zeroProgress = passStats.fetched === 0 && passStats.no_ads === 0;
    if (!foreverMode && zeroProgress) {
      log("WARN", `Pass ${passNum} made ZERO progress (${remaining} still blocked). IPs may be exhausted — stopping. Use --forever to keep retrying.`);
      break;
    }

    nextCooldown = zeroProgress ? cooldownSec * 3 : cooldownSec;
    if (zeroProgress) {
      log("WARN", `Pass ${passNum} made ZERO progress — tripling cooldown to ${nextCooldown}s`);
    }

    log("INFO", `${remaining} brands still rate-limited — looping (${nextCooldown}s cooldown)...`);
  }
}

main().catch((err) => {
  log("ERR", `Fatal: ${err}`);
  process.exit(1);
});
