/**
 * Snap Ads Gallery — Paid Ads Fetcher
 *
 * Endpoints:
 *   POST /ads/search    — search paid ads by advertiser name (EU-only, 12 months)
 *   GET  /ads/{ad_id}   — fetch single ad by UUID
 *
 * Rate limits:
 *   /ads/search has an extremely aggressive per-IP rate limit (~1-3 successes
 *   then locked for hours). Rotating proxy (Webshare, ~5000 IPs) handles it.
 *   Budget: ~1 data-returning request per IP. GCP datacenter IPs get a "soft block"
 *   (200 OK, 0 results); residential/proxy IPs get hard E1009/429.
 *
 * Name format:
 *   paying_advertiser_name is the LEGAL ENTITY name (e.g. "Nike, Inc.", "adidas AG").
 *   The search input accepts brand names too — API does fuzzy/prefix matching.
 *
 * Quirks:
 *   - paying_advertiser_name does FUZZY/PREFIX matching ("a" matches "adidas AG")
 *   - Empty string → E3024 validation error
 *   - POST pagination: next_link has cursor, but you must re-POST the same body
 *   - ~10 results per page, NOT configurable
 *   - No spend/budget data. Only impressions.
 *   - impressions_map always has ALL 27 EU + TR regardless of query countries
 *   - web_view_properties.url often leaks UTM campaign structure
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  type AdPreview,
  type AdPreviewWrapper,
  type AdsSearchBody,
  type ApiResponse,
  BASE,
  EU_COUNTRIES,
  apiRequest,
  ensureDir,
  getEffectiveInterval,
  getOrCreateRunDir,
  initProxy,
  loadEnvFromAncestors,
  log,
  pageExists,
  pageFile,
  parseCli,
  printStats,
  requireProxy,
} from "../../lib/snap_api.js";

loadEnvFromAncestors(path.dirname(import.meta.url.startsWith("file:") ? new URL(import.meta.url).pathname : __filename));

const DATA_DIR = path.resolve(import.meta.dirname ?? ".", "..", "data");

// ── Endpoint: POST /ads/search ─────────────────────────────────────────────

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

// ── Endpoint: GET /ads/{ad_id} ─────────────────────────────────────────────

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
  return (resp as unknown as { ad_preview: AdPreview }).ad_preview ?? null;
}

// ── CLI ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cli = parseCli();
  const command = cli.command;

  if (command === "ads") requireProxy(cli, "ads");
  if (cli.proxyUrl) initProxy(cli.proxyUrl);

  const effectiveInterval = getEffectiveInterval();
  log("INFO", `Snap Ads Fetcher starting. Command: ${command}`);
  log("INFO", `Data directory: ${DATA_DIR}`);
  log("INFO", `Request interval: ${(effectiveInterval / 1000).toFixed(0)}s`);

  switch (command) {
    case "ads": {
      const name = cli.args[1];
      const countriesArg = cli.args[2] ?? "de";
      const startDate = cli.args[3];
      const endDate = cli.args[4];

      if (!name) {
        log("ERR ", "Usage: fetch_ads ads <advertiser_name> [countries] [start_date] [end_date]");
        process.exit(1);
      }

      const countries = countriesArg.split(",").map((c) => c.trim().toLowerCase());
      const invalid = countries.filter((c) => !(EU_COUNTRIES as readonly string[]).includes(c));
      if (invalid.length > 0) {
        log("WARN", `Non-EU countries will return no results: ${invalid.join(", ")}`);
      }

      const body: AdsSearchBody = { paying_advertiser_name: name, countries };
      if (startDate) body.start_date = new Date(startDate).toISOString();
      if (endDate) body.end_date = new Date(endDate).toISOString();

      const runDir = getOrCreateRunDir(DATA_DIR, "ads");
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const advertiserDir = path.join(runDir, safeName);
      ensureDir(advertiserDir);
      log("INFO", `Run dir: ${advertiserDir}`);

      fs.writeFileSync(path.join(advertiserDir, "query.json"), JSON.stringify(body, null, 2));
      const result = await fetchAdsByAdvertiser(body, advertiserDir, cli.maxPages);
      printStats();
      log("INFO", `Done. ${result.totalAds} ads in ${result.pages} pages → ${runDir}`);
      break;
    }

    case "ad": {
      const adId = cli.args[1];
      if (!adId) {
        log("ERR ", "Usage: fetch_ads ad <ad_id>");
        process.exit(1);
      }

      const runDir = getOrCreateRunDir(DATA_DIR, "ad_detail");
      const ad = await fetchAdById(adId, runDir);
      printStats();
      if (ad) {
        log("INFO", `Ad: ${ad.paying_advertiser_name} — "${ad.headline}" — ${ad.impressions_total} impressions`);
      }
      break;
    }

    default:
      console.log(`
Snap Ads Gallery — Paid Ads Fetcher

Usage: fetch_ads <command> [args...]

Commands:
  ads <name> [countries] [start] [end]   Search paid ads by advertiser
  ad <ad_id>                             Fetch single ad by UUID

Countries: comma-separated ISO codes (default: de)
           Valid: ${EU_COUNTRIES.join(", ")}

Dates: ISO format (e.g., 2025-06-01)

Flags:
  --proxy <url>         Override proxy URL (default: SNAP_PROXY from .env)
  --force-no-proxy      Disable proxy
  --pages <n>           Limit to N new pages per run
`);
  }
}

main().catch((err) => {
  log("ERR ", `Fatal: ${err}`);
  process.exit(1);
});
