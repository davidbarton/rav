/**
 * Fetch Snapchat Public Profile data for fashion & beauty brands.
 *
 * Technique: HTTP GET to snapchat.com/add/<username> with browser-like headers,
 * then extract the __NEXT_DATA__ JSON payload from <script type="application/json">.
 * No headless browser, no API key, no proxy required.
 *
 * Usage:
 *   npx tsx src/fetch_profiles.ts                    # all brands
 *   npx tsx src/fetch_profiles.ts --limit 3          # first 3 brands only
 *   npx tsx src/fetch_profiles.ts --retry             # retry only failed/not-found brands
 *   npx tsx src/fetch_profiles.ts --status            # print status and exit
 *   npx tsx src/fetch_profiles.ts --delay 5000        # custom delay between requests (ms)
 *   npx tsx src/fetch_profiles.ts --proxy <url>       # use a proxy
 *
 * Reads brands from:  ../snap_ads/data/brands_fashion.json
 * Writes profiles to: data/profiles/{Brand_sanitized}.json
 * State file:         data/profiles/state.json
 * Request log:        data/profiles/download_log.jsonl
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

type ProfileStatus =
  | "fetched"        // got profile with real data
  | "no_public"      // user exists but no public profile
  | "not_found"      // 404 or no user at all
  | "rate_limited"   // got blocked
  | "error";         // network/parse error

interface CellState {
  status: ProfileStatus;
  username: string;
  has_public_profile: boolean;
  subscriber_count: number;
  spotlight_count: number;
  fetched_at?: string;
  error?: string;
}

interface State {
  cells: Record<string, CellState>;
  total_requests: number;
  total_fetched: number;
  total_no_public: number;
  started_at: string;
  last_updated: string;
}

interface LogEntry {
  ts: string;
  brand: string;
  username: string;
  status: ProfileStatus;
  subscriber_count: number;
  spotlight_count: number;
  elapsed_ms: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, "..", "data");
const BRANDS_FILE = path.resolve(__dirname, "..", "..", "snap_ads", "data", "brands_fashion.json");
const OUT_DIR = path.join(DATA_DIR, "profiles");
const STATE_FILE = path.join(OUT_DIR, "state.json");
const LOG_FILE = path.join(OUT_DIR, "download_log.jsonl");

const SNAPCHAT_BASE = "https://www.snapchat.com/add";
const DEFAULT_DELAY_MS = 800;
const REQUEST_TIMEOUT = 20_000;
const DEFAULT_CONCURRENCY = 5;

const NEXT_DATA_RE = /<script[^>]*type="application\/json"[^>]*>(.*?)<\/script>/s;

// ---------------------------------------------------------------------------
// Brand → Snapchat username mapping
// ---------------------------------------------------------------------------

/**
 * Maps a brand name to a likely Snapchat username.
 * Snapchat usernames are lowercase, no spaces, no special chars.
 * We try: lowercased brand, lowercased+stripped, common patterns.
 */
function brandToUsernames(brand: string): string[] {
  const candidates: string[] = [];
  const lower = brand.toLowerCase();
  const stripped = lower.replace(/[^a-z0-9]/g, "");
  const underscored = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const dashed = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  candidates.push(stripped);
  if (underscored !== stripped) candidates.push(underscored);
  if (dashed !== stripped) candidates.push(dashed);

  const suffixed = [`${stripped}official`, `${stripped}_official`];
  candidates.push(...suffixed);

  return [...new Set(candidates)];
}

// ---------------------------------------------------------------------------
// State management (inspired by download_ads.ts)
// ---------------------------------------------------------------------------

function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as State;
  }
  return {
    cells: {},
    total_requests: 0,
    total_fetched: 0,
    total_no_public: 0,
    started_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

function saveState(state: State): void {
  state.last_updated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(level: string, msg: string): void {
  console.log(`[${new Date().toISOString()}] [${level}] ${msg}`);
}

function appendLog(entry: LogEntry): void {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
}

// ---------------------------------------------------------------------------
// Core: fetch a single profile
// ---------------------------------------------------------------------------

interface ProfileResult {
  status: ProfileStatus;
  username: string;
  hasPublicProfile: boolean;
  subscriberCount: number;
  spotlightCount: number;
  pageProps?: Record<string, unknown>;
  error?: string;
}

async function fetchProfile(username: string, proxyUrl?: string): Promise<ProfileResult> {
  const url = `${SNAPCHAT_BASE}/${username}`;
  const base: ProfileResult = {
    status: "error",
    username,
    hasPublicProfile: false,
    subscriberCount: 0,
    spotlightCount: 0,
  };

  let statusCode: number;
  let body: string;
  try {
    const opts: Record<string, unknown> = {
      url,
      headerGeneratorOptions: { browsers: ["chrome"], operatingSystems: ["macos"] },
      responseType: "text",
      throwHttpErrors: false,
      timeout: { request: REQUEST_TIMEOUT },
    };
    if (proxyUrl) opts.proxyUrl = proxyUrl;
    const resp = await gotScraping(opts as Parameters<typeof gotScraping>[0]);
    statusCode = resp.statusCode;
    body = resp.body as string;
  } catch (err) {
    return { ...base, error: `NETWORK: ${err}` };
  }

  if (statusCode === 404) return { ...base, status: "not_found" };
  if (statusCode === 429) return { ...base, status: "rate_limited", error: "HTTP 429" };
  if (statusCode !== 200) return { ...base, status: "error", error: `HTTP ${statusCode}` };

  const match = NEXT_DATA_RE.exec(body);
  if (!match) {
    if (body.length < 1000) return { ...base, status: "rate_limited", error: "Tiny response (likely blocked)" };
    return { ...base, status: "error", error: "No __NEXT_DATA__ found" };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return { ...base, status: "error", error: "JSON parse failed on __NEXT_DATA__" };
  }

  const props = data.props as Record<string, unknown> | undefined;
  const pageProps = props?.pageProps as Record<string, unknown> | undefined;
  if (!pageProps) return { ...base, status: "error", error: "No pageProps" };

  const userProfile = pageProps.userProfile as Record<string, unknown> | undefined;
  if (!userProfile) return { ...base, status: "not_found", error: "No userProfile in pageProps" };

  const publicProfileInfo = userProfile.publicProfileInfo as Record<string, unknown> | undefined;
  const userInfo = userProfile.userInfo as Record<string, unknown> | undefined;

  if (!publicProfileInfo && !userInfo) {
    return { ...base, status: "not_found", error: "No profile data in userProfile" };
  }

  const hasPublic = !!publicProfileInfo && Object.keys(publicProfileInfo).length > 0;

  let subscriberCount = 0;
  if (publicProfileInfo?.subscriberCount != null) {
    subscriberCount = parseInt(String(publicProfileInfo.subscriberCount), 10) || 0;
  }

  const spotlightHighlights = pageProps.spotlightHighlights as unknown[] | undefined;
  const spotlightCount = spotlightHighlights?.length ?? 0;

  return {
    status: hasPublic ? "fetched" : "no_public",
    username,
    hasPublicProfile: hasPublic,
    subscriberCount,
    spotlightCount,
    pageProps,
  };
}

// ---------------------------------------------------------------------------
// Save profile data
// ---------------------------------------------------------------------------

function sanitizeBrand(brand: string): string {
  return brand.replace(/[^a-zA-Z0-9]/g, "_");
}

function saveProfile(brand: string, username: string, pageProps: Record<string, unknown>): void {
  const file = path.join(OUT_DIR, `${sanitizeBrand(brand)}.json`);
  const payload = {
    brand,
    username,
    fetched_at: new Date().toISOString(),
    pageProps,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
}

// ---------------------------------------------------------------------------
// Status display
// ---------------------------------------------------------------------------

function printStatus(brands: Brand[], state: State): void {
  console.log("\n" + "=".repeat(100));
  console.log("  SNAPCHAT PUBLIC PROFILES — STATUS");
  console.log("=".repeat(100));
  console.log(`  Legend: ✓ = fetched | ~ = no public profile | ? = not found | × = rate limited | ! = error | . = pending\n`);

  const counts = { fetched: 0, no_public: 0, not_found: 0, rate_limited: 0, error: 0, pending: 0 };

  for (const { brand, sub, group } of brands) {
    const cell = state.cells[brand];
    let icon: string;
    if (!cell) {
      icon = " . ";
      counts.pending++;
    } else if (cell.status === "fetched") {
      icon = ` ✓ ${String(cell.subscriber_count).padStart(10)} subs, ${cell.spotlight_count} spotlights`;
      counts.fetched++;
    } else if (cell.status === "no_public") {
      icon = " ~ (exists, no public profile)";
      counts.no_public++;
    } else if (cell.status === "not_found") {
      icon = ` ? (tried: ${cell.username})`;
      counts.not_found++;
    } else if (cell.status === "rate_limited") {
      icon = " × rate limited";
      counts.rate_limited++;
    } else {
      icon = ` ! ${cell.error ?? "error"}`;
      counts.error++;
    }
    console.log(`  ${brand.padEnd(30)} ${sub.padEnd(16)} ${group.padEnd(22)} ${icon}`);
  }

  console.log("\n" + "-".repeat(100));
  const total = brands.length;
  console.log(`  TOTALS (${total} brands):`);
  console.log(`    Fetched (public profile):  ${counts.fetched}`);
  console.log(`    No public profile:         ${counts.no_public}`);
  console.log(`    Not found on Snapchat:     ${counts.not_found}`);
  console.log(`    Rate limited:              ${counts.rate_limited}`);
  console.log(`    Errors:                    ${counts.error}`);
  console.log(`    Pending:                   ${counts.pending}`);
  console.log(`    Total requests made:       ${state.total_requests}`);
  console.log("");
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
  const delayIdx = args.indexOf("--delay");
  const delayMs = delayIdx >= 0 ? parseInt(args[delayIdx + 1], 10) : DEFAULT_DELAY_MS;
  const concIdx = args.indexOf("--concurrency");
  const concurrency = concIdx >= 0 ? parseInt(args[concIdx + 1], 10) : DEFAULT_CONCURRENCY;
  const proxyIdx = args.indexOf("--proxy");
  const proxyUrl = proxyIdx >= 0 ? args[proxyIdx + 1] : undefined;

  if (!fs.existsSync(BRANDS_FILE)) {
    console.error(`Brand list not found: ${BRANDS_FILE}`);
    console.error("Make sure snap_ads/data/brands_fashion.json exists.");
    process.exit(1);
  }

  const allBrands: Brand[] = JSON.parse(fs.readFileSync(BRANDS_FILE, "utf-8"));
  const state = loadState();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (showStatus) {
    printStatus(allBrands, state);
    process.exit(0);
  }

  let queue: Brand[];
  if (retryOnly) {
    queue = allBrands.filter(({ brand }) => {
      const cell = state.cells[brand];
      return cell && (cell.status === "rate_limited" || cell.status === "error" || cell.status === "not_found");
    });
    log("INFO", `Retry mode: ${queue.length} brands to retry`);
  } else {
    queue = allBrands.filter(({ brand }) => !state.cells[brand]);
    log("INFO", `${queue.length} brands pending out of ${allBrands.length} total`);
  }

  if (limit < queue.length) {
    queue = queue.slice(0, limit);
    log("INFO", `Limited to first ${limit} brands`);
  }

  if (queue.length === 0) {
    log("INFO", "Nothing to do. Use --retry to retry failed brands, or --status to see results.");
    printStatus(allBrands, state);
    return;
  }

  log("INFO", `Starting profile fetch for ${queue.length} brands (delay: ${delayMs}ms, concurrency: ${concurrency}${proxyUrl ? ", proxy: " + proxyUrl.replace(/:[^:@]+@/, ":***@") : ""})`);

  let fetched = 0;
  let errors = 0;
  let rateLimited = false;

  async function processBrand(brand: string, idx: number): Promise<void> {
    if (rateLimited) return;
    const usernames = brandToUsernames(brand);
    const progress = `[${idx + 1}/${queue.length}]`;

    log("INFO", `${progress} ${brand} → ${usernames.join(", ")}`);

    let bestResult: ProfileResult | null = null;

    for (const uname of usernames) {
      if (rateLimited) return;
      if (usernames.indexOf(uname) > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }

      const t0 = Date.now();
      const result = await fetchProfile(uname, proxyUrl);
      const elapsed = Date.now() - t0;
      state.total_requests++;

      appendLog({
        ts: new Date().toISOString(),
        brand,
        username: uname,
        status: result.status,
        subscriber_count: result.subscriberCount,
        spotlight_count: result.spotlightCount,
        elapsed_ms: elapsed,
        error: result.error,
      });

      if (result.status === "fetched") {
        log("OK", `  ${progress} ${uname}: ✓ ${result.subscriberCount} subs, ${result.spotlightCount} spotlights [${elapsed}ms]`);
        bestResult = result;
        break;
      } else if (result.status === "no_public") {
        log("INFO", `  ${progress} ${uname}: no public profile [${elapsed}ms]`);
        if (!bestResult || bestResult.status === "not_found") bestResult = result;
      } else if (result.status === "not_found") {
        if (!bestResult) bestResult = result;
      } else if (result.status === "rate_limited") {
        log("WARN", `  ${progress} ${uname}: RATE LIMITED — ${result.error} [${elapsed}ms]`);
        bestResult = result;
        rateLimited = true;
        break;
      } else {
        log("ERROR", `  ${progress} ${uname}: ${result.error} [${elapsed}ms]`);
        if (!bestResult) bestResult = result;
      }
    }

    if (!bestResult) bestResult = { status: "error", username: usernames[0], hasPublicProfile: false, subscriberCount: 0, spotlightCount: 0, error: "no candidates" };

    if (bestResult.status === "fetched" && bestResult.pageProps) {
      saveProfile(brand, bestResult.username, bestResult.pageProps);
      fetched++;
    } else {
      errors++;
    }

    state.cells[brand] = {
      status: bestResult.status,
      username: bestResult.username,
      has_public_profile: bestResult.hasPublicProfile,
      subscriber_count: bestResult.subscriberCount,
      spotlight_count: bestResult.spotlightCount,
      fetched_at: new Date().toISOString(),
      error: bestResult.error,
    };

    if (bestResult.status === "fetched") state.total_fetched++;
    if (bestResult.status === "no_public") state.total_no_public++;
  }

  for (let i = 0; i < queue.length && !rateLimited; i += concurrency) {
    const batch = queue.slice(i, i + concurrency);
    await Promise.all(batch.map((b, j) => processBrand(b.brand, i + j)));
    saveState(state);
    if (!rateLimited && i + concurrency < queue.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  if (rateLimited) log("WARN", "Rate limited — stopping. Run again with --retry to continue.");
  log("INFO", `Done. Fetched: ${fetched}, Errors/skipped: ${errors}, Total requests: ${state.total_requests}`);
  printStatus(allBrands, state);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
