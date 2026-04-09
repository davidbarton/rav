/**
 * Shared infrastructure for Snap Ads Gallery API fetchers.
 *
 * Base URL: https://adsapi.snapchat.com/v1/ads_library
 * Auth:     NONE — fully public, no OAuth, no API key.
 * Docs:     https://developers.snap.com/api/marketing-api/Ads-Gallery-Api/
 *
 * Endpoints:
 *   POST /ads/search           — paid ads by advertiser name (EU-only, 12 months)
 *   GET  /ads/{ad_id}          — single ad by UUID
 *   GET  /sponsored_content    — browse ALL organic commercial content
 *   POST /sponsored_content/search — organic content by creator name
 *
 * Rate limits:
 *   - E1009 ("Too many requests") — HTTP 200 with error in JSON body, not 429.
 *   - No rate-limit headers. Timing inferred from success/failure patterns.
 *   - /ads/search: per-IP. Rotating proxy effective.
 *   - /sponsored_content: cursor/session-scoped. Steady interval matters, not IP diversity.
 *   - E1008 ("validation error"): transient cursor/IP mismatch from rotating proxy.
 *
 * Optimal proxy interval: 30s constant delay (empirically determined).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { gotScraping } from "got-scraping";

// ── .env loader (walk up from caller to repo root) ─────────────────────────

export function loadEnvFromAncestors(startDir: string): void {
  for (let dir = startDir; dir !== path.dirname(dir); dir = path.dirname(dir)) {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
      break;
    }
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  request_status: "SUCCESS" | "ERROR";
  request_id: string;
  debug_message?: string;
  display_message?: string;
  error_code?: string;
  paging?: { next_link?: string };
  ad_previews?: T[];
  ad_preview?: T;
}

export interface AdPreviewWrapper {
  sub_request_status: "SUCCESS" | "ERROR";
  ad_preview?: AdPreview;
  sponsored_content_preview?: SponsoredContentPreview;
}

export interface AdPreview {
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

export interface SponsoredContentPreview {
  sponsor_name: string;
  sponsor_url: string;
  creator_name: string;
  creator_url: string;
  content_type: string;
  content_url: string;
  thumbnail_url: string;
}

export interface AdsSearchBody {
  paying_advertiser_name: string;
  countries: string[];
  start_date?: string;
  end_date?: string;
  status?: "ACTIVE" | "PAUSED";
}

// ── Constants ──────────────────────────────────────────────────────────────

export const BASE = "https://adsapi.snapchat.com/v1/ads_library";

export const EU_COUNTRIES = [
  "at", "be", "bg", "cy", "cz", "de", "dk", "ee", "el", "es",
  "fi", "fr", "hr", "hu", "ie", "it", "lt", "lu", "lv", "mt",
  "nl", "pl", "pt", "ro", "se", "si", "sk", "tr",
] as const;

const RATE = {
  MIN_INTERVAL_MS: 5 * 60 * 1000,
  MAX_INTERVAL_MS: 30 * 60 * 1000,
  BACKOFF_FACTOR: 2,
  COOLDOWN_FACTOR: 0.8,
  COOLDOWN_THRESHOLD: 3,
};

const PROXY_RATE = {
  INTERVAL_MS: 30_000,
};

// ── Proxy ──────────────────────────────────────────────────────────────────

let activeProxyUrl: string | undefined;
let usingProxy = false;

export function initProxy(proxyUrl: string): void {
  activeProxyUrl = proxyUrl;
  usingProxy = true;
  log("INFO", `Proxy enabled: ${proxyUrl.replace(/:[^:@]+@/, ":***@")}`);
}

// ── Rate-limit state ───────────────────────────────────────────────────────

let currentIntervalMs = RATE.MIN_INTERVAL_MS;
let consecutiveSuccesses = 0;
let consecutiveErrors = 0;
let totalRequests = 0;
let totalSuccesses = 0;
let totalRateLimits = 0;
let lastRequestTime = 0;

// ── Logging ────────────────────────────────────────────────────────────────

export function log(level: "INFO" | "WARN" | "ERR " | "DATA", msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

// ── Throttle / backoff ─────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttle(): Promise<void> {
  const interval = usingProxy ? PROXY_RATE.INTERVAL_MS : currentIntervalMs;
  const elapsed = Date.now() - lastRequestTime;
  const wait = interval - elapsed;
  if (wait > 0) {
    log("INFO", `Throttle: waiting ${(wait / 1000).toFixed(0)}s (interval=${(interval / 1000).toFixed(0)}s)`);
    await sleep(wait);
  }
}

function onSuccess(): void {
  consecutiveSuccesses++;
  consecutiveErrors = 0;
  totalSuccesses++;

  if (!usingProxy) {
    if (consecutiveSuccesses >= RATE.COOLDOWN_THRESHOLD) {
      const prev = currentIntervalMs;
      currentIntervalMs = Math.max(
        RATE.MIN_INTERVAL_MS,
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
    log("WARN", `E1009 rate limit hit (#${totalRateLimits})! Interval ${PROXY_RATE.INTERVAL_MS / 1000}s is TOO SHORT — increase it.`);
  } else {
    const prev = currentIntervalMs;
    currentIntervalMs = Math.min(
      RATE.MAX_INTERVAL_MS,
      Math.floor(currentIntervalMs * RATE.BACKOFF_FACTOR),
    );
    log("WARN", `Rate limit hit (#${totalRateLimits}). Backoff: ${(prev / 1000).toFixed(0)}s → ${(currentIntervalMs / 1000).toFixed(0)}s`);
  }
}

// ── Core API request with retry ────────────────────────────────────────────

export async function apiRequest<T>(
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

    const method = options.method ?? "GET";
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;

    log("INFO", `[${totalRequests}] ${method} ${url} (${options.label}) attempt=${attempt + 1}/${maxRetries + 1}`);

    let statusCode: number;
    let text: string;
    try {
      const resp = await gotScraping({
        url,
        method,
        body: bodyStr,
        headers: { "content-type": "application/json" },
        proxyUrl: activeProxyUrl,
        headerGeneratorOptions: { browsers: ["chrome"], operatingSystems: ["macos"] },
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

    if (data.request_status === "ERROR") {
      if (data.error_code === "E1009") {
        log("WARN", `E1009 rate limit (HTTP ${statusCode}): ${data.debug_message}`);
        onRateLimit();
        if (attempt < maxRetries) continue;
        log("ERR ", `Exhausted retries on rate limit for: ${options.label}`);
        return null;
      }
      if (data.error_code === "E1008") {
        log("WARN", `E1008 validation error (transient, attempt ${attempt + 1}/${maxRetries + 1}): retrying after throttle`);
        if (attempt < maxRetries) { continue; }
        log("ERR ", `Exhausted retries on E1008 for: ${options.label}`);
        return null;
      }
      log("ERR ", `API error ${data.error_code}: ${data.debug_message} — ${data.display_message}`);
      return data;
    }

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

// ── Filesystem helpers ─────────────────────────────────────────────────────

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function pageFile(dir: string, page: number): string {
  return path.join(dir, `page_${String(page).padStart(4, "0")}.json`);
}

export function pageExists(dir: string, page: number): boolean {
  return fs.existsSync(pageFile(dir, page));
}

// ── Run directory management ───────────────────────────────────────────────

export function createRunDir(dataDir: string, prefix: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = path.join(dataDir, `${prefix}_${ts}`);
  ensureDir(dir);
  return dir;
}

export function findLatestRunDir(dataDir: string, prefix: string): string | null {
  if (!fs.existsSync(dataDir)) return null;
  const dirs = fs.readdirSync(dataDir)
    .filter((d) => d.startsWith(prefix + "_"))
    .filter((d) => fs.statSync(path.join(dataDir, d)).isDirectory())
    .sort()
    .reverse();
  return dirs.length > 0 ? path.join(dataDir, dirs[0]!) : null;
}

export function getOrCreateRunDir(dataDir: string, prefix: string): string {
  return findLatestRunDir(dataDir, prefix) ?? createRunDir(dataDir, prefix);
}

export function printStats(): void {
  log("INFO", `--- Stats: ${totalRequests} req, ${totalSuccesses} ok, ${totalRateLimits} rate-limited ---`);
}

// ── CLI arg parsing (shared between entry points) ──────────────────────────

export interface ParsedCli {
  command: string;
  args: string[];
  proxyUrl: string | undefined;
  maxPages: number;
  rawArgs: string[];
}

export function parseCli(): ParsedCli {
  const rawArgs = process.argv.slice(2);
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

  return { command: args[0] ?? "help", args, proxyUrl, maxPages, rawArgs };
}

export function requireProxy(cli: ParsedCli, commandName: string): void {
  if (!cli.proxyUrl) {
    log("WARN", "=".repeat(72));
    log("WARN", "NO PROXY CONFIGURED — this will be extremely slow (~5 min/page).");
    log("WARN", "Set SNAP_PROXY in .env or pass --proxy <url>.");
    log("WARN", "If you really want bare-IP mode, pass --force-no-proxy.");
    log("WARN", "=".repeat(72));
    if (!cli.rawArgs.includes("--force-no-proxy")) {
      process.exit(1);
    }
  }
}

export function getEffectiveInterval(): number {
  return usingProxy ? PROXY_RATE.INTERVAL_MS : currentIntervalMs;
}
