/**
 * Fetch Snapchat /explore/<keyword> discovery data for fashion & beauty.
 *
 * Technique: HTTP GET to snapchat.com/explore/<keyword> with browser-like headers,
 * then extract the __NEXT_DATA__ JSON payload from <script type="application/json">.
 * Same approach as snap_profiles — no headless browser, no API key.
 *
 * Returns per keyword: Subscribe profiles, Shows/Publishers, Spotlight cards,
 * Lenses, Topics (frontier expansion seeds), Episodes, Places.
 *
 * Usage:
 *   npx tsx src/fetch_explore.ts                    # all keywords
 *   npx tsx src/fetch_explore.ts --limit 5          # first 5 only
 *   npx tsx src/fetch_explore.ts --retry            # retry failed/rate-limited
 *   npx tsx src/fetch_explore.ts --status           # print progress and exit
 *   npx tsx src/fetch_explore.ts --delay 2000       # custom delay (ms)
 *   npx tsx src/fetch_explore.ts --proxy <url>      # use a proxy
 *   npx tsx src/fetch_explore.ts --discovered       # also fetch topic-discovered keywords
 *
 * Writes to: data/explore/<keyword_slug>.json
 * State:     data/explore/state.json
 * Log:       data/explore/download_log.jsonl
 * Topics:    data/explore/discovered_topics.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type ExploreStatus,
  type SectionSummary,
  type ExploreExtract,
  type ExploreResult,
  extractExploreSummary,
  fetchExplore,
} from "../../lib/snap_explore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (let dir = __dirname; dir !== path.dirname(dir); dir = path.dirname(dir)) {
  const envPath = path.join(dir, ".env");
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}

// ---------------------------------------------------------------------------
// ~105 seed keywords: fashion & beauty vertical
// ---------------------------------------------------------------------------

const KEYWORDS: string[] = [
  // --- Fashion core ---
  "fashion",
  "style",
  "outfit",
  "outfitoftheday",
  "ootd",
  "streetwear",
  "runway",
  "fashion_style",
  "fashionblogger",
  "fashion_week",
  "wardrobe",
  "trendy",
  "vintage_fashion",
  "sustainable_fashion",
  "fast_fashion",
  "thrift",
  "thrift_fashion",

  // --- Clothing types ---
  "dresses",
  "jeans",
  "sneakers",
  "heels",
  "boots",
  "jackets",
  "coats",
  "sweaters",
  "activewear",
  "athleisure",
  "lingerie",
  "swimwear",
  "denim",
  "knitwear",
  "handbags",
  "sunglasses",
  "jewelry",
  "watches",

  // --- Beauty core ---
  "beauty",
  "makeup",
  "skincare",
  "cosmetics",
  "beauty_tips",
  "beauty_routine",
  "glam",
  "natural_beauty",
  "beauty_hacks",
  "clean_beauty",
  "beauty_tutorial",
  "makeup_tutorial",
  "makeup_looks",

  // --- Beauty products ---
  "lipstick",
  "mascara",
  "foundation",
  "concealer",
  "eyeshadow",
  "eyeliner",
  "blush",
  "bronzer",
  "highlighter",
  "contour",
  "nail_art",
  "nails",
  "lashes",
  "lip_gloss",
  "perfume",
  "fragrance",
  "cologne",
  "serum",
  "moisturizer",
  "sunscreen",

  // --- Hair ---
  "hairstyle",
  "hair_tutorial",
  "hair_color",
  "curly_hair",
  "braids",
  "hair_care",
  "balayage",
  "blonde_hair",

  // --- Fashion brands ---
  "nike",
  "adidas",
  "zara",
  "shein",
  "gucci",
  "louis_vuitton",
  "dior",
  "chanel",
  "prada",
  "balenciaga",
  "versace",
  "burberry",
  "hermes",

  // --- Beauty brands ---
  "sephora",
  "mac_cosmetics",
  "fenty_beauty",
  "charlotte_tilbury",
  "glossier",
  "rare_beauty",
  "nyx",
  "maybelline",
  "loreal",
  "clinique",

  // --- Lifestyle / shopping ---
  "luxury",
  "designer",
  "shopping",
  "haul",
  "try_on_haul",
  "unboxing",
  "grwm",
  "get_ready_with_me",
  "transformation",
  "glow_up",
  "self_care",
  "wellness",

  // --- Trends / aesthetics ---
  "y2k",
  "cottagecore",
  "dark_academia",
  "minimalist",
  "boho",
  "preppy",
  "grunge",
  "aesthetic",
  "clean_girl",
  "quiet_luxury",
  "old_money",

  // --- Seasonal ---
  "summer_fashion",
  "winter_style",
  "fall_outfits",
  "festival_fashion",
  "prom",
  "wedding",
];

// ---------------------------------------------------------------------------
// Types (ExploreStatus, SectionSummary, ExploreExtract, ExploreResult
// imported from ../../lib/snap_explore.ts)
// ---------------------------------------------------------------------------

interface CellState {
  status: ExploreStatus;
  keyword: string;
  query_echo?: string;
  country?: string;
  sections: SectionSummary[];
  creators_found: number;
  topics_found: string[];
  fetched_at?: string;
  error?: string;
}

interface State {
  cells: Record<string, CellState>;
  total_requests: number;
  total_fetched: number;
  started_at: string;
  last_updated: string;
}

interface LogEntry {
  ts: string;
  keyword: string;
  status: ExploreStatus;
  creators_found: number;
  sections_found: number;
  elapsed_ms: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, "..", "data");
const OUT_DIR = path.join(DATA_DIR, "explore");
const STATE_FILE = path.join(OUT_DIR, "state.json");
const LOG_FILE = path.join(OUT_DIR, "download_log.jsonl");
const TOPICS_FILE = path.join(OUT_DIR, "discovered_topics.json");

const DEFAULT_DELAY_MS = 2000;

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as State;
  }
  return {
    cells: {},
    total_requests: 0,
    total_fetched: 0,
    started_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

function saveState(state: State): void {
  state.last_updated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadDiscoveredTopics(): Set<string> {
  if (fs.existsSync(TOPICS_FILE)) {
    const arr = JSON.parse(fs.readFileSync(TOPICS_FILE, "utf-8")) as string[];
    return new Set(arr);
  }
  return new Set();
}

function saveDiscoveredTopics(topics: Set<string>): void {
  fs.writeFileSync(TOPICS_FILE, JSON.stringify([...topics].sort(), null, 2));
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(level: string, msg: string): void {
  console.log(`[${new Date().toISOString()}] [${level.padEnd(5)}] ${msg}`);
}

function appendLog(entry: LogEntry): void {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
}

function keywordToFilename(keyword: string): string {
  return keyword.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

// extractExploreSummary and fetchExplore imported from shared module

// ---------------------------------------------------------------------------
// Save explore data
// ---------------------------------------------------------------------------

function saveExploreData(keyword: string, pageProps: Record<string, unknown>): void {
  const file = path.join(OUT_DIR, `${keywordToFilename(keyword)}.json`);
  const payload = {
    keyword,
    fetched_at: new Date().toISOString(),
    pageProps,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
}

// ---------------------------------------------------------------------------
// Status display
// ---------------------------------------------------------------------------

function printStatus(keywords: string[], state: State, discoveredTopics: Set<string>): void {
  console.log("\n" + "=".repeat(110));
  console.log("  SNAPCHAT /explore/<keyword> — FASHION & BEAUTY DISCOVERY STATUS");
  console.log("=".repeat(110));
  console.log(`  Legend: ✓ = fetched | ○ = empty | ? = 404 | × = rate limited | ! = error | . = pending\n`);

  const counts = { fetched: 0, empty: 0, not_found: 0, rate_limited: 0, error: 0, pending: 0 };
  let totalCreators = 0;

  for (const kw of keywords) {
    const cell = state.cells[kw];
    let icon: string;
    if (!cell) {
      icon = " .";
      counts.pending++;
    } else if (cell.status === "fetched") {
      const secs = cell.sections.map((s) => `${s.type}:${s.count}`).join(", ");
      icon = ` ✓  creators:${String(cell.creators_found).padStart(3)}  sections: ${secs}`;
      counts.fetched++;
      totalCreators += cell.creators_found;
    } else if (cell.status === "empty") {
      icon = " ○ (200 but no usable data)";
      counts.empty++;
    } else if (cell.status === "not_found") {
      icon = " ? (404)";
      counts.not_found++;
    } else if (cell.status === "rate_limited") {
      icon = " × rate limited";
      counts.rate_limited++;
    } else {
      icon = ` ! ${cell.error ?? "error"}`;
      counts.error++;
    }
    console.log(`  ${kw.padEnd(28)} ${icon}`);
  }

  console.log("\n" + "-".repeat(110));
  const total = keywords.length;
  console.log(`  SEED KEYWORDS (${total}):`);
  console.log(`    Fetched:           ${counts.fetched}`);
  console.log(`    Empty:             ${counts.empty}`);
  console.log(`    Not found (404):   ${counts.not_found}`);
  console.log(`    Rate limited:      ${counts.rate_limited}`);
  console.log(`    Errors:            ${counts.error}`);
  console.log(`    Pending:           ${counts.pending}`);
  console.log(`    Total creators discovered: ${totalCreators}`);
  console.log(`    Total requests:    ${state.total_requests}`);
  console.log(`\n  DISCOVERED TOPICS (frontier): ${discoveredTopics.size} unique`);
  if (discoveredTopics.size > 0) {
    const sample = [...discoveredTopics].slice(0, 20);
    console.log(`    Sample: ${sample.join(", ")}${discoveredTopics.size > 20 ? " ..." : ""}`);
  }
  console.log("");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const showStatus = args.includes("--status");
  const retryOnly = args.includes("--retry");
  const includeDiscovered = args.includes("--discovered");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
  const delayIdx = args.indexOf("--delay");
  const delayMs = delayIdx >= 0 ? parseInt(args[delayIdx + 1], 10) : DEFAULT_DELAY_MS;
  const proxyIdx = args.indexOf("--proxy");
  const proxyUrl = proxyIdx >= 0 ? args[proxyIdx + 1] : (process.env.SNAP_PROXY || undefined);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const state = loadState();
  const discoveredTopics = loadDiscoveredTopics();

  // Build keyword queue: seeds + optionally discovered topics
  let allKeywords = [...KEYWORDS];
  if (includeDiscovered && discoveredTopics.size > 0) {
    const seedSet = new Set(KEYWORDS.map((k) => k.toLowerCase()));
    const extras = [...discoveredTopics].filter((t) => !seedSet.has(t.toLowerCase()));
    allKeywords = [...allKeywords, ...extras];
    log("INFO", `Including ${extras.length} discovered topics (${discoveredTopics.size} total, ${extras.length} new)`);
  }

  if (showStatus) {
    printStatus(allKeywords, state, discoveredTopics);
    process.exit(0);
  }

  let queue: string[];
  if (retryOnly) {
    queue = allKeywords.filter((kw) => {
      const cell = state.cells[kw];
      return cell && (cell.status === "rate_limited" || cell.status === "error");
    });
    log("INFO", `Retry mode: ${queue.length} keywords to retry`);
  } else {
    queue = allKeywords.filter((kw) => !state.cells[kw]);
    log("INFO", `${queue.length} keywords pending out of ${allKeywords.length} total`);
  }

  if (limit < queue.length) {
    queue = queue.slice(0, limit);
    log("INFO", `Limited to first ${limit} keywords`);
  }

  if (queue.length === 0) {
    log("INFO", "Nothing to do. Use --retry to retry failed, or --status to see results.");
    printStatus(allKeywords, state, discoveredTopics);
    return;
  }

  log("INFO", `Starting explore fetch for ${queue.length} keywords (delay: ${delayMs}ms${proxyUrl ? ", proxy: " + proxyUrl.replace(/:[^:@]+@/, ":***@") : ""})`);

  let fetched = 0;
  let errors = 0;
  let rateLimited = false;

  for (let i = 0; i < queue.length; i++) {
    if (rateLimited) break;

    const kw = queue[i];
    const progress = `[${i + 1}/${queue.length}]`;

    log("INFO", `${progress} /explore/${kw}`);

    const t0 = Date.now();
    const result = await fetchExplore(kw, proxyUrl);
    const elapsed = Date.now() - t0;
    state.total_requests++;

    appendLog({
      ts: new Date().toISOString(),
      keyword: kw,
      status: result.status,
      creators_found: result.extract?.creatorsFound ?? 0,
      sections_found: result.extract?.sections.length ?? 0,
      elapsed_ms: elapsed,
      error: result.error,
    });

    if (result.status === "fetched" && result.pageProps) {
      const ext = result.extract!;
      log("OK  ", `${progress} ✓ creators:${ext.creatorsFound} sections:${ext.sections.length} topics:${ext.topicsFound.length} [${elapsed}ms]`);

      saveExploreData(kw, result.pageProps);
      fetched++;
      state.total_fetched++;

      // Collect discovered topics for frontier expansion
      for (const topic of ext.topicsFound) {
        discoveredTopics.add(topic);
      }

      state.cells[kw] = {
        status: "fetched",
        keyword: kw,
        query_echo: ext.query,
        country: ext.country,
        sections: ext.sections,
        creators_found: ext.creatorsFound,
        topics_found: ext.topicsFound,
        fetched_at: new Date().toISOString(),
      };
    } else if (result.status === "rate_limited") {
      log("WARN", `${progress} × RATE LIMITED — ${result.error} [${elapsed}ms]`);
      rateLimited = true;
      state.cells[kw] = {
        status: "rate_limited",
        keyword: kw,
        sections: [],
        creators_found: 0,
        topics_found: [],
        fetched_at: new Date().toISOString(),
        error: result.error,
      };
    } else if (result.status === "empty") {
      log("INFO", `${progress} ○ empty — ${result.error} [${elapsed}ms]`);
      state.cells[kw] = {
        status: "empty",
        keyword: kw,
        sections: result.extract?.sections ?? [],
        creators_found: 0,
        topics_found: [],
        fetched_at: new Date().toISOString(),
        error: result.error,
      };
    } else {
      log("ERR ", `${progress} ! ${result.status}: ${result.error} [${elapsed}ms]`);
      errors++;
      state.cells[kw] = {
        status: result.status,
        keyword: kw,
        sections: [],
        creators_found: 0,
        topics_found: [],
        fetched_at: new Date().toISOString(),
        error: result.error,
      };
    }

    saveState(state);
    saveDiscoveredTopics(discoveredTopics);

    if (!rateLimited && i < queue.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  if (rateLimited) log("WARN", "Rate limited — stopping. Run again with --retry to continue.");
  log("INFO", `Done. Fetched: ${fetched}, Errors: ${errors}, Requests: ${state.total_requests}, Discovered topics: ${discoveredTopics.size}`);
  printStatus(allKeywords, state, discoveredTopics);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
