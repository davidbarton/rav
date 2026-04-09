/**
 * Snap Ads Gallery — Sponsored Content Fetcher
 *
 * Endpoints:
 *   GET  /sponsored_content          — browse ALL organic commercial content
 *   POST /sponsored_content/search   — search by creator name
 *
 * CURSOR EXPIRY — READ THIS OR WASTE DAYS:
 *   If you STOP the crawl and come back later, EVERY saved `paging.next_link`
 *   on disk can be DEAD. Snap returns E1008 for those URLs — NOT just the last
 *   page — cursors from the MIDDLE of the run also fail. The entire chain rots.
 *   Fresh request with NO cursor works fine; stale cursors never recover.
 *
 *   FIX: Archive the old `sponsored_*` run dir. Start a NEW crawl in a fresh
 *   `sponsored_<timestamp>/` directory. Expect to re-fetch from page 0.
 *
 * Why ~92% have empty sponsor_name:
 *   1. Snapchat's own Spotlight monetization (Snap pays creators directly)
 *   2. EU DSA transparency obligation sweeps in all monetized content
 *   3. Weak creator disclosure compliance
 *   The ~8% with sponsor_name are real brand-creator partnerships.
 *
 * Rate limits:
 *   /sponsored_content rate limit is cursor/session-scoped, NOT per-IP.
 *   Rotating proxy helps avoid harsh bare-IP limits but doesn't bypass
 *   the session rate limit. Steady ~30s interval yields ~2 pages/min.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  type AdPreviewWrapper,
  type ApiResponse,
  BASE,
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

// ── Endpoint: GET /sponsored_content ───────────────────────────────────────

async function fetchAllSponsoredContent(
  runDir: string,
  maxNewPages = Infinity,
): Promise<{ totalItems: number; pages: number }> {
  const dir = path.join(runDir, "sponsored_content");
  ensureDir(dir);

  let url: string = `${BASE}/sponsored_content?limit=500`;
  let page = 0;
  let totalItems = 0;

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

// ── Endpoint: POST /sponsored_content/search ───────────────────────────────

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

// ── CLI ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cli = parseCli();
  const command = cli.command;

  if (command === "sponsored") requireProxy(cli, "sponsored");
  if (cli.proxyUrl) initProxy(cli.proxyUrl);

  const effectiveInterval = getEffectiveInterval();
  log("INFO", `Snap Sponsored Content Fetcher starting. Command: ${command}`);
  log("INFO", `Data directory: ${DATA_DIR}`);
  log("INFO", `Request interval: ${(effectiveInterval / 1000).toFixed(0)}s`);

  switch (command) {
    case "sponsored": {
      const runDir = getOrCreateRunDir(DATA_DIR, "sponsored");
      log("INFO", `Run dir: ${runDir}`);
      const result = await fetchAllSponsoredContent(runDir, cli.maxPages);
      printStats();
      log("INFO", `Done. ${result.totalItems} items in ${result.pages} pages → ${runDir}`);
      break;
    }

    case "creator": {
      const creatorName = cli.args[1];
      if (!creatorName) {
        log("ERR ", "Usage: fetch_sponsored creator <creator_name>");
        process.exit(1);
      }
      const runDir = getOrCreateRunDir(DATA_DIR, "creators");
      const result = await fetchSponsoredByCreator(creatorName, runDir);
      printStats();
      log("INFO", `Done. ${result.totalItems} items in ${result.pages} pages → ${runDir}`);
      break;
    }

    default:
      console.log(`
Snap Ads Gallery — Sponsored Content Fetcher

Usage: fetch_sponsored <command> [args...]

Commands:
  sponsored                Browse ALL sponsored content
  creator <name>           Search sponsored content by creator

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
