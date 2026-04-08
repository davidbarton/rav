/**
 * ============================================================================
 * SNAP ADS GALLERY — DATA FETCHER
 * ============================================================================
 *
 * GUIDING RULES FOR THIS DATA-FETCH EXERCISE
 * -------------------------------------------
 * 1. ALL knowledge about the API — its quirks, limits, undocumented behavior,
 *    workarounds — lives HERE in this file as code + comments. No separate
 *    docs that drift out of sync. The code IS the documentation.
 *
 * 2. Every API call saves the RAW response to disk before any processing.
 *    If we crash mid-run, we never lose data we already fetched.
 *
 * 3. Rate limits are the #1 enemy. We NEVER fire-and-forget. Every request
 *    goes through a single throttled queue with exponential backoff on 429/E1009.
 *
 * 4. We always fetch ALL fields. No field filtering, no projection. The API
 *    returns a fixed shape anyway — we store the full JSON.
 *
 * 5. Pagination is followed to exhaustion. We keep following `paging.next_link`
 *    until it disappears, saving each page as a separate file for resumability.
 *
 * 6. Idempotent re-runs. If a page file already exists on disk, skip the fetch.
 *    This lets us resume interrupted crawls without re-fetching.
 *
 * 7. Stdout is a log. Structured, timestamped, grep-friendly.
 *    Never print raw JSON to stdout — it goes to files.
 *
 *
 * ============================================================================
 * API REFERENCE: SNAP ADS GALLERY (https://adsgallery.snap.com)
 * ============================================================================
 *
 * Base URL: https://adsapi.snapchat.com/v1/ads_library
 * Auth:     NONE — all endpoints are fully public, no OAuth, no API key.
 * Docs:     https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/
 *
 *
 * ENDPOINTS (4 total):
 * --------------------
 *
 * 1. POST /ads/search
 *    Search paid ads by advertiser name. EU-only, last 12 months.
 *    Body: { paying_advertiser_name: string (REQUIRED),
 *            countries: string[] (REQUIRED — 27 EU + "tr"),
 *            start_date?: ISO string,
 *            end_date?: ISO string,
 *            status?: "ACTIVE" | "PAUSED" }
 *    Pagination: cursor query param on next POST, same body.
 *    Page size: ~10 ads (not configurable).
 *
 * 2. GET /ads/{ad_id}
 *    Fetch a single ad by UUID. Same response shape as search results.
 *
 * 3. GET /sponsored_content
 *    Browse ALL organic commercial content. No name needed. Paginated.
 *    Query params: cursor, limit (default ~200 per page).
 *
 * 4. POST /sponsored_content/search
 *    Search organic content by creator name.
 *    Body: { creator_name: string }
 *    Query params: cursor, limit
 *
 *
 * ============================================================================
 * OBSERVED RATE LIMITS (empirical, 2026-04-08)
 * ============================================================================
 *
 * - Error shape: { error_code: "E1009", debug_message: "Too many requests" }
 *   HTTP status is still 200 (!) — the error is in the JSON body, not HTTP 429.
 *   Some earlier tests also saw HTTP 429 — behavior may vary.
 *
 * - Limit appears to be PER-IP, not per-endpoint. Hitting /ads/search burns
 *   quota that also blocks /sponsored_content.
 *
 * - Observed cooldown: even 3 minutes between requests was insufficient after
 *   a burst of 4-5 requests. Suggests a sliding window of ~5-10 req/hour.
 *   _ASSUMPTION_: we start conservatively at 1 req / 5 minutes (12/hour) and
 *   adapt based on observed success/failure ratio.
 *
 * - No rate-limit headers (X-RateLimit-*, Retry-After) observed in responses.
 *   We must infer timing purely from success/failure patterns.
 *
 * - The E1009 error uses HTTP 200 with JSON error body. This means naive
 *   HTTP-status-based retry logic won't catch it — we MUST parse the body.
 *
 * - PROXY DOES NOT FULLY BYPASS RATE LIMITS (2026-04-08):
 *   Even with a rotating proxy (Webshare, different IP per request), we hit
 *   E1009 after ~3-4 consecutive successes. This suggests the rate limit is
 *   NOT purely per-IP — likely also keyed on cursor token, session, or some
 *   server-side sliding window tied to the pagination context.
 *   Effective throughput with rotating proxy: ~1 page per 30-60s average
 *   (accounting for backoff cycles), NOT the 3s we hoped for.
 *
 * - Pagination cursors may become invalid if you wait too long between pages.
 *   _ASSUMPTION_: cursors are valid for at least 1 hour.
 *
 *
 * ============================================================================
 * KNOWN QUIRKS
 * ============================================================================
 *
 * - paying_advertiser_name does FUZZY/PREFIX matching. Searching "a" returns
 *   advertisers starting with "a". Single-char queries pass validation.
 *
 * - Empty string "" for paying_advertiser_name → E3024 validation error.
 *   The field is null/empty-checked server-side before fuzzy matching.
 *
 * - countries accepts an array but the docs only list EU countries + Turkey.
 *   Non-EU codes (e.g., "us") are silently accepted but return no results.
 *
 * - impressions_map always contains ALL 27 EU countries + "tr" regardless
 *   of which countries were queried. Most will be 0.
 *
 * - Ads have start_date but NO end_date. You can only infer end from status.
 *
 * - No spend/budget data. Only impressions. Political ads (separate ZIP) have spend.
 *
 * - top_snap_media_download_link CDN URLs appear to be long-lived but
 *   we don't know their TTL. Download media assets if archival matters.
 *
 * - The POST /ads/search pagination is unusual: the next_link URL has a
 *   cursor query param, but you still must POST the same JSON body to it.
 *
 * - web_view_properties.url often contains full UTM parameters revealing
 *   campaign structure, media buying agency, and targeting strategy in
 *   human-readable form. This is unintentional intelligence leakage.
 *
 * ============================================================================
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { gotScraping } from "got-scraping";

// Auto-load .env from repo root (walk up from this file to find it)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (let dir = __dirname; dir !== path.dirname(dir); dir = path.dirname(dir)) {
  const envPath = path.join(dir, ".env");
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}

// ---------------------------------------------------------------------------
// Types — matching observed API response shapes
// ---------------------------------------------------------------------------

interface ApiResponse<T> {
  request_status: "SUCCESS" | "ERROR";
  request_id: string;
  debug_message?: string;
  display_message?: string;
  error_code?: string;
  paging?: { next_link?: string };
  ad_previews?: T[];
  ad_preview?: T; // single-ad endpoint
}

interface AdPreviewWrapper {
  sub_request_status: "SUCCESS" | "ERROR";
  ad_preview?: AdPreview;
  sponsored_content_preview?: SponsoredContentPreview;
}

interface AdPreview {
  id: string;
  name: string;
  ad_account_name: string;
  status: "ACTIVE" | "PAUSED";
  creative_type: string;
  ad_type: string;
  ad_render_type: string;
  languages: string[];
  headline: string;
  call_to_action: string;
  top_snap_media_type?: string;
  top_snap_crop_position?: string;
  top_snap_media_download_link?: string;
  start_date: string;
  impressions_total: number;
  impressions_map: Record<string, number>;
  targeting_v2: {
    regulated_content: boolean;
    demographics: Array<{
      min_age?: string;
      max_age?: string;
      age_groups: string[];
      languages: string[];
      operation?: string;
      advanced_demographics: unknown[];
    }>;
    devices: Array<{
      marketing_name?: string[];
      model?: string[];
      os_type?: string;
      carrier_id?: string[];
      operation?: string;
    }>;
  };
  paying_advertiser_name: string;
  brand_name?: string;
  profile_name?: string;
  profile_logo_url?: string;
  web_view_properties?: { url: string };
  deep_link_properties?: {
    deep_link_uri: string;
    icon_media_url?: string;
    playable_media_properties?: unknown;
  };
  composite_preview?: {
    should_loop?: boolean;
    title_headline?: string;
    preview_creative_render_type?: string;
    ad_snaps: unknown[];
  };
  review_status: string;
  rejection_reasons: string[];
  stickers: unknown[];
}

interface SponsoredContentPreview {
  sponsor_name: string;
  sponsor_url: string;
  creator_name: string;
  creator_url: string;
  content_type: string;
  content_url: string;
  thumbnail_url: string;
}

// Search body for POST /ads/search
interface AdsSearchBody {
  paying_advertiser_name: string;
  countries: string[];
  start_date?: string;
  end_date?: string;
  status?: "ACTIVE" | "PAUSED";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE = "https://adsapi.snapchat.com/v1/ads_library";

/**
 * All valid country codes for the ads/search endpoint.
 * 27 EU member states + Turkey. Taken directly from Snap's API docs.
 * Using non-EU codes silently returns empty results.
 */
const EU_COUNTRIES = [
  "at", "be", "bg", "cy", "cz", "de", "dk", "ee", "el", "es",
  "fi", "fr", "hr", "hu", "ie", "it", "lt", "lu", "lv", "mt",
  "nl", "pl", "pt", "ro", "se", "si", "sk", "tr",
] as const;

/**
 * Rate limiter config.
 * We start very conservatively because the API has no documented rate limits
 * and our empirical testing shows aggressive throttling (~5-10 req/hour).
 *
 * Strategy: start with MIN_INTERVAL, increase on E1009, decrease (slowly)
 * on sustained success streaks.
 */
const RATE = {
  /** Minimum ms between requests. Starting at 5 min based on observed limits. */
  MIN_INTERVAL_MS: 5 * 60 * 1000,
  /** Maximum backoff ceiling. */
  MAX_INTERVAL_MS: 30 * 60 * 1000,
  /** Multiplier on each consecutive E1009. */
  BACKOFF_FACTOR: 2,
  /** After N consecutive successes, reduce interval by this factor. */
  COOLDOWN_FACTOR: 0.8,
  /** Need this many consecutive successes before reducing interval. */
  COOLDOWN_THRESHOLD: 3,
};

const DATA_DIR = path.resolve(import.meta.dirname ?? ".", "..", "data");

// ---------------------------------------------------------------------------
// Proxy support
// ---------------------------------------------------------------------------

/**
 * PROXY STRATEGY
 *
 * The API rate limit is per-IP. A rotating proxy gives a different exit IP
 * per request, effectively giving each request its own rate-limit window.
 *
 * With a rotating proxy, we can drop the interval dramatically — the main
 * constraint becomes the proxy provider's throughput, not Snap's rate limit.
 *
 * We support:
 *   --proxy <url>        Rotating proxy URL (e.g., http://user:pass@host:port)
 *   SNAP_PROXY env var   Same, via environment
 *
 * When a proxy is active:
 *   - MIN_INTERVAL drops to 3s (just being polite, not dodging rate limits)
 *   - Backoff still applies if we somehow get E1009 (proxy reusing IPs)
 *   - All requests go through undici's ProxyAgent
 */
let activeProxyUrl: string | undefined;
let usingProxy = false;

function initProxy(proxyUrl: string): void {
  activeProxyUrl = proxyUrl;
  usingProxy = true;
  log("INFO", `Proxy enabled: ${proxyUrl.replace(/:[^:@]+@/, ":***@")}`);
}

/**
 * Interval overrides when using a rotating proxy.
 * Initial testing showed 3s worked for burst of 3 requests, but sustained
 * pagination still hits E1009 after ~3-4 pages. The rate limit appears to be
 * partially cursor/session-based, not purely IP-based.
 * Settled on 10s start — gives ~3 successes before a rate-limit cycle,
 * with backoff up to 60s. Effective avg: ~30s/page with retries.
 */
const PROXY_RATE = {
  MIN_INTERVAL_MS: 10_000,   // 10s — empirical sweet spot with rotating proxy
  MAX_INTERVAL_MS: 60_000,   // 1 min ceiling
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentIntervalMs = RATE.MIN_INTERVAL_MS;
let consecutiveSuccesses = 0;
let consecutiveErrors = 0;
let totalRequests = 0;
let totalSuccesses = 0;
let totalRateLimits = 0;
let lastRequestTime = 0;

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(level: "INFO" | "WARN" | "ERR " | "DATA", msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

// ---------------------------------------------------------------------------
// Core HTTP with rate limiting
// ---------------------------------------------------------------------------

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestTime;
  const wait = currentIntervalMs - elapsed;
  if (wait > 0) {
    log("INFO", `Throttle: waiting ${(wait / 1000).toFixed(0)}s (interval=${(currentIntervalMs / 1000).toFixed(0)}s)`);
    await sleep(wait);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function effectiveRate() {
  return usingProxy ? PROXY_RATE : RATE;
}

function onSuccess(): void {
  consecutiveSuccesses++;
  consecutiveErrors = 0;
  totalSuccesses++;
  const r = effectiveRate();
  if (consecutiveSuccesses >= RATE.COOLDOWN_THRESHOLD) {
    const prev = currentIntervalMs;
    currentIntervalMs = Math.max(
      r.MIN_INTERVAL_MS,
      Math.floor(currentIntervalMs * RATE.COOLDOWN_FACTOR),
    );
    if (currentIntervalMs < prev) {
      log("INFO", `Rate: ${RATE.COOLDOWN_THRESHOLD} consecutive OK → interval reduced to ${(currentIntervalMs / 1000).toFixed(0)}s`);
    }
    consecutiveSuccesses = 0;
  }
}

function onRateLimit(): void {
  consecutiveErrors++;
  consecutiveSuccesses = 0;
  totalRateLimits++;
  const r = effectiveRate();
  const prev = currentIntervalMs;
  currentIntervalMs = Math.min(
    r.MAX_INTERVAL_MS,
    Math.floor(currentIntervalMs * RATE.BACKOFF_FACTOR),
  );
  log("WARN", `Rate limit hit (#${totalRateLimits}). Backoff: ${(prev / 1000).toFixed(0)}s → ${(currentIntervalMs / 1000).toFixed(0)}s`);
}

/**
 * Make a request to the Snap Ads Gallery API.
 * Handles throttling, retries on rate limit, and raw response saving.
 *
 * Returns parsed JSON or null if the request ultimately failed.
 * Retries up to `maxRetries` times on E1009 with exponential backoff.
 */
async function apiRequest<T>(
  url: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    label: string;
    saveTo?: string;
    maxRetries?: number;
  },
): Promise<ApiResponse<T> | null> {
  const maxRetries = options.maxRetries ?? 5;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttle();

    totalRequests++;
    lastRequestTime = Date.now();

    const method = options.method ?? "GET";
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;

    log("INFO", `[${totalRequests}] ${method} ${url} (${options.label}) attempt=${attempt + 1}/${maxRetries + 1}`);

    let statusCode: number;
    let text: string;
    try {
      // got-scraping handles TLS fingerprinting (browser-like JA3/JA4),
      // realistic header generation (User-Agent, Accept, sec-ch-ua, etc.),
      // and proxy routing — all automatically.
      const resp = await gotScraping({
        url,
        method,
        body: bodyStr,
        headers: { "content-type": "application/json" },
        proxyUrl: activeProxyUrl,
        headerGeneratorOptions: {
          browsers: ["chrome"],
          operatingSystems: ["macos"],
        },
        responseType: "text",
        throwHttpErrors: false,
        timeout: { request: 30_000 },
      });
      statusCode = resp.statusCode;
      text = resp.body as string;
    } catch (err) {
      log("ERR ", `Network error: ${err}`);
      if (attempt < maxRetries) {
        onRateLimit();
        continue;
      }
      return null;
    }

    let data: ApiResponse<T>;
    try {
      data = JSON.parse(text) as ApiResponse<T>;
    } catch {
      log("ERR ", `JSON parse failed (HTTP ${statusCode}): ${text.slice(0, 200)}`);
      return null;
    }

    // The API often returns HTTP 200 even for errors — must check body
    if (data.request_status === "ERROR") {
      if (data.error_code === "E1009") {
        log("WARN", `E1009 rate limit (HTTP ${statusCode}): ${data.debug_message}`);
        onRateLimit();
        if (attempt < maxRetries) continue;
        log("ERR ", `Exhausted retries on rate limit for: ${options.label}`);
        return null;
      }
      // Non-rate-limit errors are not retryable
      log("ERR ", `API error ${data.error_code}: ${data.debug_message} — ${data.display_message}`);
      return data;
    }

    // Success
    onSuccess();

    if (options.saveTo) {
      ensureDir(path.dirname(options.saveTo));
      fs.writeFileSync(options.saveTo, JSON.stringify(data, null, 2));
      log("DATA", `Saved: ${options.saveTo} (${text.length} bytes)`);
    }

    return data;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function pageFile(dir: string, page: number): string {
  return path.join(dir, `page_${String(page).padStart(4, "0")}.json`);
}

function pageExists(dir: string, page: number): boolean {
  return fs.existsSync(pageFile(dir, page));
}

// ---------------------------------------------------------------------------
// Endpoint 1: POST /ads/search — Paid ads by advertiser name
// ---------------------------------------------------------------------------

/**
 * Fetch all paid ads for a given advertiser in given countries.
 * Paginates to exhaustion, saving each page to disk.
 * Returns total number of ads fetched.
 *
 * IMPORTANT QUIRKS:
 * - Pagination uses cursor in URL but you must re-POST the same body.
 * - ~10 results per page, NOT configurable.
 * - Fuzzy/prefix match on paying_advertiser_name. "spotify" matches "Spotify USA Inc."
 * - If no results, returns SUCCESS with empty ad_previews array (not an error).
 */
async function fetchAdsByAdvertiser(
  searchBody: AdsSearchBody,
  runDir: string,
  maxNewPages = Infinity,
): Promise<{ totalAds: number; pages: number }> {
  const dir = path.join(runDir, "ads_search");
  ensureDir(dir);

  let url: string = `${BASE}/ads/search`;
  let page = 0;
  let totalAds = 0;

  // Resume: scan existing pages on disk, advance cursor to where we left off
  while (pageExists(dir, page)) {
    const existing = JSON.parse(fs.readFileSync(pageFile(dir, page), "utf-8")) as ApiResponse<AdPreviewWrapper>;
    totalAds += existing.ad_previews?.length ?? 0;
    if (!existing.paging?.next_link) {
      log("INFO", `Ads search: already complete (${page + 1} pages, ${totalAds} ads). Skipping.`);
      return { totalAds, pages: page + 1 };
    }
    url = existing.paging.next_link;
    page++;
  }
  if (page > 0) {
    log("INFO", `Ads search: resuming from page ${page} (${totalAds} ads on disk)`);
  }

  let newPages = 0;
  while (true) {
    const resp = await apiRequest<AdPreviewWrapper>(url, {
      method: "POST",
      body: searchBody,
      label: `ads_search p${page} [${searchBody.paying_advertiser_name}]`,
      saveTo: pageFile(dir, page),
    });

    if (!resp || resp.request_status !== "SUCCESS") break;

    const count = resp.ad_previews?.length ?? 0;
    totalAds += count;
    newPages++;
    log("DATA", `Page ${page}: ${count} ads (total: ${totalAds}, new this run: ${newPages})`);

    if (!resp.paging?.next_link) {
      log("INFO", `Ads search complete: ${totalAds} ads in ${page + 1} pages`);
      break;
    }

    url = resp.paging.next_link;
    page++;

    if (newPages >= maxNewPages) {
      log("INFO", `Ads search: fetched ${maxNewPages} new pages this run. Stopping. ${totalAds} ads total. Re-run to continue.`);
      break;
    }
  }

  return { totalAds, pages: page + 1 };
}

// ---------------------------------------------------------------------------
// Endpoint 2: GET /ads/{ad_id} — Single ad detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single ad by ID.
 * Returns the same shape as ads/search results but for one ad.
 * Useful for refreshing impression counts or re-fetching after cursor expiry.
 */
async function fetchAdById(
  adId: string,
  runDir: string,
): Promise<AdPreview | null> {
  const file = path.join(runDir, "ads_by_id", `${adId}.json`);
  if (fs.existsSync(file)) {
    log("INFO", `Ad ${adId}: already on disk, skipping`);
    return JSON.parse(fs.readFileSync(file, "utf-8")).ad_preview ?? null;
  }

  const resp = await apiRequest<AdPreview>(`${BASE}/ads/${adId}`, {
    label: `ad_detail ${adId}`,
    saveTo: file,
  });

  if (!resp || resp.request_status !== "SUCCESS") return null;

  // Single-ad endpoint uses ad_preview (not ad_previews array)
  return (resp as unknown as { ad_preview: AdPreview }).ad_preview ?? null;
}

// ---------------------------------------------------------------------------
// Endpoint 3: GET /sponsored_content — Browse all organic content
// ---------------------------------------------------------------------------

/**
 * Paginate through ALL sponsored/organic commercial content.
 * This is the only "browse everything" endpoint — no name required.
 *
 * QUIRKS:
 * - Default page size ~200 items. `limit` param controls page size.
 * - Max effective limit is 500. Requesting >500 still returns 500.
 *   Tested: limit=200→200, limit=500→500, limit=1000→500.
 * - Same rate limits as paid ads — shared per-IP quota.
 * - Content is "currently live" only — no historical archive.
 * - Items are sponsored_content_preview (not ad_preview).
 */
async function fetchAllSponsoredContent(
  runDir: string,
  maxNewPages = Infinity,
): Promise<{ totalItems: number; pages: number }> {
  const dir = path.join(runDir, "sponsored_content");
  ensureDir(dir);

  let url: string = `${BASE}/sponsored_content?limit=500`;
  let page = 0;
  let totalItems = 0;

  // Resume: scan existing pages, advance to where we left off
  while (pageExists(dir, page)) {
    const existing = JSON.parse(fs.readFileSync(pageFile(dir, page), "utf-8")) as ApiResponse<AdPreviewWrapper>;
    totalItems += existing.ad_previews?.length ?? 0;
    if (!existing.paging?.next_link) {
      log("INFO", `Sponsored content: already complete (${page + 1} pages, ${totalItems} items). Skipping.`);
      return { totalItems, pages: page + 1 };
    }
    url = existing.paging.next_link;
    page++;
  }
  if (page > 0) {
    log("INFO", `Sponsored content: resuming from page ${page} (${totalItems} items on disk)`);
  }

  let newPages = 0;
  while (true) {
    const resp = await apiRequest<AdPreviewWrapper>(url, {
      label: `sponsored_content p${page}`,
      saveTo: pageFile(dir, page),
    });

    if (!resp || resp.request_status !== "SUCCESS") break;

    const count = resp.ad_previews?.length ?? 0;
    totalItems += count;
    newPages++;
    log("DATA", `Page ${page}: ${count} items (total: ${totalItems}, new this run: ${newPages})`);

    if (!resp.paging?.next_link || count === 0) {
      log("INFO", `Sponsored content complete: ${totalItems} items in ${page + 1} pages`);
      break;
    }

    url = resp.paging.next_link;
    page++;

    if (newPages >= maxNewPages) {
      log("INFO", `Sponsored content: fetched ${maxNewPages} new pages this run. Stopping. ${totalItems} items total. Re-run to continue.`);
      break;
    }
  }

  return { totalItems, pages: page + 1 };
}

// ---------------------------------------------------------------------------
// Endpoint 4: POST /sponsored_content/search — By creator name
// ---------------------------------------------------------------------------

/**
 * Search sponsored content by creator name.
 * Same shape as /sponsored_content but filtered.
 */
async function fetchSponsoredByCreator(
  creatorName: string,
  runDir: string,
): Promise<{ totalItems: number; pages: number }> {
  const safeCreator = creatorName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = path.join(runDir, "sponsored_by_creator", safeCreator);
  ensureDir(dir);

  let url: string = `${BASE}/sponsored_content/search`;
  let page = 0;
  let totalItems = 0;

  while (pageExists(dir, page)) {
    const existing = JSON.parse(fs.readFileSync(pageFile(dir, page), "utf-8")) as ApiResponse<AdPreviewWrapper>;
    totalItems += existing.ad_previews?.length ?? 0;
    if (!existing.paging?.next_link) {
      log("INFO", `Creator search [${creatorName}]: already complete. Skipping.`);
      return { totalItems, pages: page + 1 };
    }
    url = existing.paging.next_link;
    page++;
  }

  const body = { creator_name: creatorName };

  while (true) {
    const resp = await apiRequest<AdPreviewWrapper>(url, {
      method: "POST",
      body,
      label: `sponsored_creator [${creatorName}] p${page}`,
      saveTo: pageFile(dir, page),
    });

    if (!resp || resp.request_status !== "SUCCESS") break;

    const count = resp.ad_previews?.length ?? 0;
    totalItems += count;
    log("DATA", `Page ${page}: ${count} items (total: ${totalItems})`);

    if (!resp.paging?.next_link || count === 0) {
      log("INFO", `Creator search [${creatorName}] complete: ${totalItems} items in ${page + 1} pages`);
      break;
    }

    url = resp.paging.next_link;
    page++;
  }

  return { totalItems, pages: page + 1 };
}

// ---------------------------------------------------------------------------
// Run helpers
// ---------------------------------------------------------------------------

/**
 * DIRECTORY CONVENTION — one shared parent per endpoint type:
 *
 *   data/
 *     ads_<ts>/              ← paid ad searches (all advertisers)
 *       <advertiser>/ads_search/page_*.json
 *       <advertiser>/query.json
 *     sponsored_<ts>/        ← browse-all sponsored content
 *       sponsored_content/page_*.json
 *     creators_<ts>/         ← creator searches (all creators)
 *       sponsored_by_creator/<name>/page_*.json
 *     ad_detail_<ts>/        ← individual ad lookups
 *       ads_by_id/<uuid>.json
 *
 * Each endpoint type uses a SINGLE prefix ("ads", "sponsored", etc.).
 * getOrCreateRunDir() finds or creates the timestamped parent.
 * Per-entity subdirectories go INSIDE the parent, not as separate roots.
 *
 * Follow this pattern for any new endpoint — never create per-entity
 * top-level directories (e.g. ads_nike_de, ads_spotify_de).
 */

function createRunDir(prefix: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = path.join(DATA_DIR, `${prefix}_${ts}`);
  ensureDir(dir);
  return dir;
}

function findLatestRunDir(prefix: string): string | null {
  if (!fs.existsSync(DATA_DIR)) return null;
  const dirs = fs.readdirSync(DATA_DIR)
    .filter((d) => d.startsWith(prefix + "_"))
    .sort()
    .reverse();
  return dirs.length > 0 ? path.join(DATA_DIR, dirs[0]!) : null;
}

function getOrCreateRunDir(prefix: string): string {
  return findLatestRunDir(prefix) ?? createRunDir(prefix);
}

function printStats(): void {
  log("INFO", `--- Stats: ${totalRequests} requests, ${totalSuccesses} ok, ${totalRateLimits} rate-limited, interval=${(currentIntervalMs / 1000).toFixed(0)}s ---`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);

  // Extract flags from anywhere in args
  // Proxy URL from env or --proxy flag (no hardcoded default — keep creds in .env)
  let proxyUrl: string | undefined = process.env["SNAP_PROXY"];
  let maxPages = Infinity;
  const args: string[] = [];
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--proxy" && i + 1 < rawArgs.length) {
      proxyUrl = rawArgs[i + 1];
      i++;
    } else if (rawArgs[i] === "--no-proxy") {
      proxyUrl = undefined;
    } else if (rawArgs[i] === "--pages" && i + 1 < rawArgs.length) {
      maxPages = parseInt(rawArgs[i + 1]!, 10);
      i++;
    } else {
      args.push(rawArgs[i]!);
    }
  }

  if (proxyUrl) {
    initProxy(proxyUrl);
    currentIntervalMs = PROXY_RATE.MIN_INTERVAL_MS;
  }

  const command = args[0] ?? "help";

  log("INFO", `Snap Ads Gallery Fetcher starting. Command: ${command}`);
  log("INFO", `Data directory: ${DATA_DIR}`);
  log("INFO", `Initial request interval: ${(currentIntervalMs / 1000).toFixed(0)}s${usingProxy ? " (proxy mode)" : ""}`);

  switch (command) {
    /**
     * Fetch paid ads for a specific advertiser.
     * Usage: node fetch.js ads <advertiser_name> [country1,country2,...] [start_date] [end_date]
     *
     * Examples:
     *   node fetch.js ads spotify de                          # Spotify in Germany
     *   node fetch.js ads nike de,fr,cz 2025-06-01 2026-04-01 # Nike in DE+FR+CZ with dates
     *   node fetch.js ads a de                                # All advertisers starting with "a" in DE
     */
    case "ads": {
      const name = args[1];
      const countriesArg = args[2] ?? "de";
      const startDate = args[3];
      const endDate = args[4];

      if (!name) {
        log("ERR ", "Usage: fetch ads <advertiser_name> [countries] [start_date] [end_date]");
        process.exit(1);
      }

      const countries = countriesArg.split(",").map((c) => c.trim().toLowerCase());
      const invalid = countries.filter((c) => !(EU_COUNTRIES as readonly string[]).includes(c));
      if (invalid.length > 0) {
        log("WARN", `Non-EU countries will return no results: ${invalid.join(", ")}`);
      }

      const body: AdsSearchBody = {
        paying_advertiser_name: name,
        countries,
      };
      if (startDate) body.start_date = new Date(startDate).toISOString();
      if (endDate) body.end_date = new Date(endDate).toISOString();

      const runDir = getOrCreateRunDir("ads");
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const advertiserDir = path.join(runDir, safeName);
      ensureDir(advertiserDir);
      log("INFO", `Run dir: ${advertiserDir}`);

      // Save the query for reproducibility
      fs.writeFileSync(path.join(advertiserDir, "query.json"), JSON.stringify(body, null, 2));

      const result = await fetchAdsByAdvertiser(body, advertiserDir, maxPages);
      printStats();
      log("INFO", `Done. ${result.totalAds} ads in ${result.pages} pages → ${runDir}`);
      break;
    }

    /**
     * Browse/download all sponsored (organic commercial) content.
     * Usage: node fetch.js sponsored
     *
     * No parameters needed — this endpoint is fully browsable.
     * Will paginate to exhaustion and save everything.
     */
    case "sponsored": {
      const runDir = getOrCreateRunDir("sponsored");
      log("INFO", `Run dir: ${runDir}`);

      const result = await fetchAllSponsoredContent(runDir, maxPages);
      printStats();
      log("INFO", `Done. ${result.totalItems} items in ${result.pages} pages → ${runDir}`);
      break;
    }

    /**
     * Fetch a single ad by ID.
     * Usage: node fetch.js ad <ad_id>
     *
     * Useful for spot-checking or refreshing specific ads found in earlier crawls.
     */
    case "ad": {
      const adId = args[1];
      if (!adId) {
        log("ERR ", "Usage: fetch ad <ad_id>");
        process.exit(1);
      }

      const runDir = getOrCreateRunDir("ad_detail");
      const ad = await fetchAdById(adId, runDir);
      printStats();
      if (ad) {
        log("INFO", `Ad: ${ad.paying_advertiser_name} — "${ad.headline}" — ${ad.impressions_total} impressions`);
      }
      break;
    }

    /**
     * Search sponsored content by creator name.
     * Usage: node fetch.js creator <creator_name>
     */
    case "creator": {
      const creatorName = args[1];
      if (!creatorName) {
        log("ERR ", "Usage: fetch creator <creator_name>");
        process.exit(1);
      }

      const runDir = getOrCreateRunDir("creators");
      const result = await fetchSponsoredByCreator(creatorName, runDir);
      printStats();
      log("INFO", `Done. ${result.totalItems} items in ${result.pages} pages → ${runDir}`);
      break;
    }

    default:
      console.log(`
Snap Ads Gallery Fetcher
========================

Usage: node fetch.js <command> [args...]

Commands:
  ads <name> [countries] [start] [end]   Search paid ads by advertiser
  sponsored                              Browse ALL sponsored content
  ad <ad_id>                             Fetch single ad by UUID
  creator <name>                         Search sponsored content by creator

Countries: comma-separated ISO codes (default: de)
           Valid: ${EU_COUNTRIES.join(", ")}

Dates: ISO format (e.g., 2025-06-01)

Examples:
  node fetch.js ads spotify de
  node fetch.js ads nike de,fr,cz 2025-06-01 2026-04-01
  node fetch.js sponsored
  node fetch.js ad 20b006cd-0381-41df-85fc-5ff5d7d367c1
  node fetch.js creator honeybear
`);
  }
}

main().catch((err) => {
  log("ERR ", `Fatal: ${err}`);
  process.exit(1);
});
