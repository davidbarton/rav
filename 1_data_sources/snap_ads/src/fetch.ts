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
 * WHY ~92% OF SPONSORED CONTENT HAS EMPTY sponsor_name (2026-04-08)
 * ============================================================================
 *
 * Empirical: vast majority of /sponsored_content records have sponsor_name="".
 * Only ~8% name an actual brand. Three likely reasons (useful as UI context):
 *
 * 1. SNAPCHAT'S OWN SPOTLIGHT MONETIZATION (most likely)
 *    Snapchat pays creators directly via Spotlight Rewards / Creator Fund.
 *    Ads placed alongside creator videos with revenue sharing. Content is
 *    commercially monetized → appears in transparency feed, but no external
 *    brand sponsor exists. Snapchat is the sponsor but doesn't tag itself.
 *
 * 2. EU DSA TRANSPARENCY OBLIGATION
 *    Digital Services Act forces disclosure of ALL commercially incentivized
 *    content. Sweeps in every monetized Spotlight video, not just brand deals.
 *    sponsor_name only filled when creator explicitly tags a third-party brand.
 *
 * 3. WEAK CREATOR DISCLOSURE COMPLIANCE
 *    EU Parliament/BEUC research documents "widespread hidden advertising"
 *    on Snapchat. Creators do paid promos without tagging the brand.
 *    Snapchat may flag content as sponsored algorithmically but can't fill
 *    the brand name the creator didn't provide.
 *
 * PRACTICAL: The ~8% with sponsor_name are the high-signal records — real
 * brand↔creator partnerships for influence mapping. The unbranded entries
 * still reveal who the active monetized creators are.
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
 * - No rate-limit headers (X-RateLimit-*, Retry-After) observed in responses.
 *   We must infer timing purely from success/failure patterns.
 *
 * - The E1009 error uses HTTP 200 with JSON error body. This means naive
 *   HTTP-status-based retry logic won't catch it — we MUST parse the body.
 *
 * - PROXY DOES NOT FULLY BYPASS RATE LIMITS (2026-04-08):
 *   Even with a rotating proxy (Webshare, ~5000 IPs across different subnets),
 *   we hit E1009 after ~3-4 consecutive successes at 3s intervals. The rate
 *   limit is NOT purely per-IP — it's keyed on cursor token or session-level
 *   sliding window tied to the pagination context. IP diversity alone doesn't
 *   solve it. A steady ~15s/page interval avoids most E1009s and yields
 *   ~4 pages/min sustained throughput.
 *
 * - Pagination cursors may become invalid if you wait too long between pages.
 *   (See SPONSORED CURSOR HELL below — the old "1 hour" guess was WRONG!!!!!)
 *
 * ============================================================================
 * SPONSORED_CONTENT PAGINATION: CURSOR EXPIRY — READ THIS OR WASTE DAYS!!!!!!
 * ============================================================================
 *
 * EMERGENCY BULLETIN (verified 2026-04-08)!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * If you STOP the /sponsored_content crawl and come back later, EVERY
 * saved `paging.next_link` on disk can be DEAD!!!!!!!!!!!!!!!! Snap returns
 * E1008 ("validation error") for those URLs — NOT just the last page — we
 * tested a cursor from the MIDDLE of the run (hundreds of pages in) with
 * curl and it STILL failed!!!!!!!!!!!!!!!! So you CANNOT "resume" by
 * re-reading page files after a long gap — the entire chain rots!!!!!!!!!!
 *
 * Fresh request with NO cursor: SUCCESS!!!!!!!!!!!!!!!! Stale cursor from
 * JSON you saved last week: E1008 E1008 E1008 forever until you give up!!!!!!
 *
 * IMPLICATIONS (SCREAMING)!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * - Deleting only `page_0882.json` does NOT fix it if 881's next_link is
 *   expired too — you are NOT walking back to a magic good cursor!!!!!!!!!!
 * - More retries / --no-proxy / praying does NOT resurrect dead cursors!!!!!!
 * - Rotating proxy E1008 on resume is REAL but secondary — even direct IP
 *   gets E1008 on stale cursors — do not confuse the two problems!!!!!!!!!!!
 *
 * WHAT TO DO INSTEAD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * - Archive the old `sponsored_*` run dir (keep the JSON as a snapshot!!!!).
 * - Start a NEW crawl in a fresh `sponsored_<timestamp>/` directory — move
 *   the partial run OUT of `data/` so `getOrCreateRunDir("sponsored")` does
 *   not pick it up (e.g. `data/partial_snapshots/...`)!!!!!!!!!!!!!!!!!!!!!!!
 * - Expect to RE-FETCH from page 0 — there is NO API to skip to offset N!!!!
 *
 * THIS IS WHY THE COMMENTS ARE LONG — IF WE DO NOT SHOUT, FUTURE-US FORGETS!!!!
 *
 * - /ads/search HAS AN EXTREMELY AGGRESSIVE RATE LIMIT (2026-04-08):
 *   Budget appears to be ~1-3 successful requests per IP, then locked for
 *   hours (possibly 24h rolling window). This is NOT shared with
 *   /sponsored_content which is far more lenient.
 *
 * - /ads/search NAME FORMAT: lowercase works. The only successful query
 *   ever observed used "spotify" (lowercase), returning real ad data.
 *   "Nike" (capitalized) was never tested without rate limit interference.
 *   The web UI hint says "must be exact spelling" — case sensitivity unknown.
 *
 *
 * ============================================================================
 * AUTHENTICATION: DOES NOT EXIST (tested 2026-04-08)
 * ============================================================================
 *
 * The Ads Gallery API has NO authentication layer. Tested empirically:
 *
 * - Sending `Authorization: Bearer <fake_token>` to /sponsored_content:
 *   → 200 SUCCESS. Token silently ignored, normal data returned.
 *   A real auth system would return 401/403 for an invalid token.
 *
 * - Sending `Authorization: Bearer <fake_token>` to /ads/search:
 *   → 429 (same as without token). Rate limit fires before any auth check.
 *
 * - Sending no Authorization header:
 *   → Identical behavior to above for both endpoints.
 *
 * CONCLUSION: The API ignores the Authorization header entirely. It has no
 * auth wiring. The Marketing API's OAuth tokens (10-20 req/sec) do NOT apply
 * to these /ads_library/* endpoints. Snap built this as a bare-minimum
 * DSA (EU Digital Services Act) compliance API — publicly accessible,
 * intentionally throttled, no way to unlock higher rate limits via auth.
 *
 * The Snap Marketing API (OAuth, Bearer tokens, 10-20 req/sec) is a
 * SEPARATE system for managing your OWN ad campaigns, not for querying
 * the public ads transparency library.
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
 *
 * ============================================================================
 * ADVERTISER NAME FORMAT (learned from Apify scrapers, 2026-04-08)
 * ============================================================================
 *
 * The paying_advertiser_name field is the LEGAL ENTITY name, not the brand:
 *   - Nike      → "Nike, Inc."
 *   - adidas    → "adidas AG"
 *   - Spotify   → worked with lowercase "spotify" (legal name may differ)
 *
 * However, the search INPUT accepts brand names too ("Nike", "Zalando",
 * "Ikea") — the API does fuzzy/prefix matching against the legal name.
 * The RESPONSE then shows the full legal entity in paying_advertiser_name.
 *
 * If you get 0 results, try: full legal name, different casing, or a
 * different country where the brand may have more ad activity.
 *
 * Source: Apify scraper docs (zadexinho/snapchat-ads-scraper) which
 * successfully scrapes thousands of ads using this endpoint.
 *
 *
 * ============================================================================
 * /ads/search RATE LIMIT: SOLVABLE WITH PROXY POOL (2026-04-08)
 * ============================================================================
 *
 * Third-party scrapers (Apify) successfully use /ads/search at scale.
 * The /ads/search rate limit is per-IP — a large rotating proxy pool
 * (Webshare, ~5000 IPs across different subnets) handles it well.
 *
 * /sponsored_content is different: the rate limit is cursor/session-scoped,
 * not purely per-IP. More IPs don't help — a steady interval (~15s/page)
 * is what matters.
 *
 *
 * ============================================================================
 * /ads/search RATE LIMIT: EMPIRICAL FINDINGS (GCP POC, 2026-04-08)
 * ============================================================================
 *
 * Tested via GCP Compute Engine VM and Cloud Run proxy (us-central1).
 * The following was observed with 12 requests across 2 deployment modes:
 *
 * BUDGET PER IP:
 *   - Exactly 1 data-returning request per IP address.
 *   - The very first request from a fresh IP returns full ad data.
 *   - Every subsequent request from the SAME IP returns:
 *       { "request_status": "SUCCESS", "ads": [] }
 *     Note: NOT a 429. It looks like success but with zero results.
 *     This is a SOFT BLOCK — much sneakier than the hard E1009/429
 *     we observed from residential IPs and rotating proxies.
 *
 * SOFT BLOCK vs HARD BLOCK:
 *   - GCP datacenter IPs    → soft block (200 OK, 0 results)
 *   - Residential/proxy IPs → hard block (429, E1009 "Too many requests")
 *   - Both happen after ~1 successful request per IP.
 *   - The soft block is brand-specific on the same IP: querying Nike
 *     returns data, then Nike returns 0, but a DIFFERENT brand on the
 *     same IP also returns 0. So the budget is 1 request per IP total,
 *     not per IP+brand combination.
 *
 * BACKOFF DURATION:
 *   - Unknown, but long. An IP that returned Nike data (138KB) went to
 *     0 results within seconds and never recovered during our ~1 hour
 *     session. Likely 24h+ rolling window based on Apify scraper docs
 *     recommending "batches of 200-500 to avoid rate limits".
 *
 * GCP CLOUD RUN TEST DATA (2026-04-08):
 *
 *   us-west1 (all same /24: 34.34.253.0/24):
 *     34.34.253.161 → Zalando DE → real ads
 *     34.34.253.160 → Nike DE    → 0 ads (soft block)
 *     34.34.253.97  → BMW DE     → 0 ads (soft block)
 *     34.34.253.224 → Amazon DE  → 0 ads (soft block)
 *
 *   us-central1 (different /24s):
 *     136.124.32.165 → IKEA DE   → 0 ads
 *     34.34.233.249  → Lidl DE   → 0 ads
 *
 *   By region:
 *     us-central1:  soft block (200 OK, 0 results)
 *     us-west1:     soft block (200 OK, 0 results)
 *     europe-west1: hard block (E1009, 429)
 *     us-east1:     hard block (E1009, 429)
 *     asia-east1:   hard block (E1009, 429)
 *
 * GCP CLOUD RUN AS PROXY:
 *   - Works. Dummy proxy (forwards request, returns response, exits).
 *   - process.exit(0) after each response forces container death →
 *     next request gets a fresh container with a fresh IP.
 *   - --concurrency=1 ensures no two requests share a container.
 *   - --min-instances=0 so we don't pay when idle.
 *   - x-proxy-ip header on every response (resolved on container startup
 *     via api.ipify.org) for tracking which IP was used.
 *   - Deploy to multiple regions for maximum IP diversity.
 *   - Free tier: 2M requests/month, 360k vCPU-seconds, 180k GiB-seconds.
 *     At ~1 request per brand per IP, this is effectively unlimited for
 *     our use case.
 *
 * VERIFIED WORKING (2026-04-08):
 *   - Nike DE:      138KB, full ads with media URLs, impressions, dates
 *   - Coca-Cola DE: full ads with pagination cursor
 *   - Amazon DE:    full ads with pagination cursor
 *   - Zalando DE:   full ads with pagination cursor
 *   - IKEA DE:      success but 0 ads (possibly no active ads, or blocked)
 *   - Apify (Nike DE, adidas DE, Spotify DE, BMW DE, Samsung DE): all OK
 *
 * ============================================================================
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Impit } from "impit";

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
let impit: Impit | null = null;

function initProxy(proxyUrl: string): void {
  activeProxyUrl = proxyUrl;
  usingProxy = true;
  log("INFO", `Proxy enabled: ${proxyUrl.replace(/:[^:@]+@/, ":***@")}`);
}

function getImpit(): Impit {
  if (!impit) {
    impit = new Impit({
      browser: "chrome",
      proxyUrl: activeProxyUrl,
    });
  }
  return impit;
}

/**
 * Interval overrides when using a rotating proxy.
 *
 * The /sponsored_content rate limit is cursor/session-scoped, NOT per-IP.
 * Rate limit is enforced at the Envoy/API Gateway level (9ms rejection
 * vs 400-700ms for real responses). No rate-limit headers are returned
 * (no X-RateLimit-*, no Retry-After).
 *
 * Optimal strategy: burst-then-wait. Blast BUDGET requests with minimal
 * gap, then sleep until the window resets. Zero wasted retries.
 *
 * E1008 (cursor/IP mismatch) retries also count against the budget.
 */
const PROXY_RATE = {
  MIN_INTERVAL_MS: 3_000,
  MAX_INTERVAL_MS: 60_000,
};

const BURST = {
  BUDGET: 6,
  WINDOW_MS: 65_000,
  GAP_MS: 2_000,
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

let burstStart = 0;
let burstCount = 0;

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
  if (usingProxy) {
    return burstThrottle();
  }
  const elapsed = Date.now() - lastRequestTime;
  const wait = currentIntervalMs - elapsed;
  if (wait > 0) {
    log("INFO", `Throttle: waiting ${(wait / 1000).toFixed(0)}s (interval=${(currentIntervalMs / 1000).toFixed(0)}s)`);
    await sleep(wait);
  }
}

async function burstThrottle(): Promise<void> {
  const now = Date.now();

  if (burstCount >= BURST.BUDGET) {
    const windowEnd = burstStart + BURST.WINDOW_MS;
    const wait = windowEnd - now;
    if (wait > 0) {
      log("INFO", `Burst: ${burstCount}/${BURST.BUDGET} used, waiting ${(wait / 1000).toFixed(0)}s for window reset`);
      await sleep(wait);
    }
    burstStart = 0;
    burstCount = 0;
    log("INFO", `Burst: window reset, starting new burst`);
  }

  if (lastRequestTime > 0) {
    const elapsed = Date.now() - lastRequestTime;
    const gap = BURST.GAP_MS - elapsed;
    if (gap > 0) {
      await sleep(gap);
    }
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

  if (!usingProxy) {
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
}

function onRateLimit(): void {
  consecutiveErrors++;
  consecutiveSuccesses = 0;
  totalRateLimits++;

  if (usingProxy) {
    burstCount = BURST.BUDGET;
    log("WARN", `Rate limit hit (#${totalRateLimits}). Burst exhausted, will wait for window reset.`);
  } else {
    const r = effectiveRate();
    const prev = currentIntervalMs;
    currentIntervalMs = Math.min(
      r.MAX_INTERVAL_MS,
      Math.floor(currentIntervalMs * RATE.BACKOFF_FACTOR),
    );
    log("WARN", `Rate limit hit (#${totalRateLimits}). Backoff: ${(prev / 1000).toFixed(0)}s → ${(currentIntervalMs / 1000).toFixed(0)}s`);
  }
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
  let skipThrottle = false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (skipThrottle) {
      skipThrottle = false;
    } else {
      await throttle();
    }

    totalRequests++;
    lastRequestTime = Date.now();
    if (usingProxy) {
      if (burstCount === 0) burstStart = lastRequestTime;
      burstCount++;
    }

    const method = options.method ?? "GET";
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;

    log("INFO", `[${totalRequests}] ${method} ${url} (${options.label}) attempt=${attempt + 1}/${maxRetries + 1}`);

    let statusCode: number;
    let text: string;
    try {
      const client = getImpit();
      const resp = await client.fetch(url, {
        method,
        body: bodyStr,
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      statusCode = resp.status;
      text = await resp.text();
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
      // E1008 "validation error" is transient when using a rotating proxy —
      // the cursor was issued to one exit IP but the next request arrives from
      // a different one. Retry with normal throttle interval — instant retries
      // trigger E1009 rate limits because Snap counts every request regardless
      // of success/failure.
      if (data.error_code === "E1008") {
        log("WARN", `E1008 validation error (transient, attempt ${attempt + 1}/${maxRetries + 1}): retrying after throttle`);
        if (attempt < maxRetries) { continue; }
        log("ERR ", `Exhausted retries on E1008 for: ${options.label}`);
        return null;
      }
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
 *
 * RESUME AFTER DAYS OFF — CATASTROPHE WARNING!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * The on-disk resume path replays `next_link` URLs from saved JSON. If those
 * cursors EXPIRED while you were away, EVERY request fails with E1008 — not
 * fixable by deleting the last page file — see file header SPONSORED CURSOR
 * HELL — you need a FRESH run directory, not optimism!!!!!!!!!!!!!!!!!!!!!!!
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
      maxRetries: 30,
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
  const burst = usingProxy ? `, burst=${burstCount}/${BURST.BUDGET}` : "";
  log("INFO", `--- Stats: ${totalRequests} req, ${totalSuccesses} ok, ${totalRateLimits} rate-limited${burst} ---`);
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
    } else if (rawArgs[i] === "--no-proxy" || rawArgs[i] === "--force-no-proxy") {
      proxyUrl = undefined;
    } else if (rawArgs[i] === "--pages" && i + 1 < rawArgs.length) {
      maxPages = parseInt(rawArgs[i + 1]!, 10);
      i++;
    } else {
      args.push(rawArgs[i]!);
    }
  }

  const command = args[0] ?? "help";

  // Proxy is ON by default for high-volume commands. Without it, sponsored
  // crawls at ~0.2 pages/min (5 min throttle). With it, ~1-2 pages/min.
  const highVolumeCommands = new Set(["sponsored", "ads"]);
  if (!proxyUrl && highVolumeCommands.has(command)) {
    log("WARN", "=".repeat(72));
    log("WARN", "NO PROXY CONFIGURED — this will be extremely slow (~5 min/page).");
    log("WARN", "Set SNAP_PROXY in .env or pass --proxy <url>.");
    log("WARN", "If you really want bare-IP mode, pass --force-no-proxy.");
    log("WARN", "=".repeat(72));
    if (!rawArgs.includes("--force-no-proxy")) {
      process.exit(1);
    }
  }

  if (proxyUrl) {
    initProxy(proxyUrl);
    currentIntervalMs = PROXY_RATE.MIN_INTERVAL_MS;
  }

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

Flags:
  --proxy <url>         Override proxy URL (default: SNAP_PROXY from .env)
  --force-no-proxy      Disable proxy (required for bare-IP; --no-proxy also works)
  --pages <n>           Limit to N new pages per run

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
