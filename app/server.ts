/**
 * Backend API server for live Snapchat data exploration.
 *
 * Endpoints:
 *   GET /api/explore?q=<keyword>     — fetch/cache a keyword explore page
 *   GET /api/explore/cached          — list all cached keywords with summaries
 *   GET /api/explore/trending        — aggregated top creators/profiles across all cached data
 *
 * Runs alongside Vite dev server (proxied via vite.config.ts).
 * In production, serves the built static files + API.
 */

import express from "express";
import cors from "cors";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  fetchExplore,
  extractExploreData,
  extractExploreSummary,
  type ExploreData,
} from "../data_sources/lib/snap_explore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Walk up to find .env
for (let dir = __dirname; dir !== path.dirname(dir); dir = path.dirname(dir)) {
  const envPath = path.join(dir, ".env");
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}

const EXPLORE_DIR = path.resolve(__dirname, "..", "data_sources", "snap_explore", "data", "explore");
const DB_PATH = path.resolve(__dirname, "..", "db", "rav.db");
const DIST_DIR = path.resolve(__dirname, "dist");
const DIST_POLITICAL = path.resolve(__dirname, "..", "app-political", "dist");
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const PORT = parseInt(process.env.PORT ?? process.env.API_PORT ?? "3001", 10);
const REPORT_PASS = process.env.REPORT_PASS ?? "";

if (!REPORT_PASS) {
  console.error("[FATAL] REPORT_PASS environment variable is required. Set it in .env or your environment.");
  process.exit(1);
}

function dbQuery<T = Record<string, unknown>>(sql: string): T[] {
  try {
    const out = execSync(`duckdb -readonly "${DB_PATH}" -json`, {
      input: sql + "\n",
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 15_000,
    });
    return JSON.parse(out || "[]") as T[];
  } catch (err) {
    console.error("[API] DuckDB query error:", (err as Error).message?.slice(0, 200));
    return [];
  }
}

// In-flight dedup: avoid hammering Snapchat with duplicate concurrent requests
const inflight = new Map<string, Promise<ExploreData | null>>();

function keywordToFilename(keyword: string): string {
  return keyword.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function readCachedExplore(keyword: string): ExploreData | null {
  const file = path.join(EXPLORE_DIR, `${keywordToFilename(keyword)}.json`);
  if (!fs.existsSync(file)) return null;

  const stat = fs.statSync(file);
  const age = Date.now() - stat.mtimeMs;
  if (age > CACHE_MAX_AGE_MS) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
    return extractExploreData(keyword, raw.pageProps);
  } catch {
    return null;
  }
}

function readCachedExploreAnyAge(keyword: string): ExploreData | null {
  const file = path.join(EXPLORE_DIR, `${keywordToFilename(keyword)}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
    return extractExploreData(keyword, raw.pageProps);
  } catch {
    return null;
  }
}

async function fetchAndCache(keyword: string): Promise<ExploreData | null> {
  const cached = readCachedExplore(keyword);
  if (cached) return cached;

  const existing = inflight.get(keyword);
  if (existing) return existing;

  const promise = (async (): Promise<ExploreData | null> => {
    const result = await fetchExplore(keyword);
    if (result.status === "fetched" && result.pageProps) {
      const file = path.join(EXPLORE_DIR, `${keywordToFilename(keyword)}.json`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(
        file,
        JSON.stringify({ keyword, fetched_at: new Date().toISOString(), pageProps: result.pageProps }, null, 2)
      );
      return extractExploreData(keyword, result.pageProps);
    }
    return null;
  })();

  inflight.set(keyword, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(keyword);
  }
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Ravineo Report"');
    res.status(401).send("Authentication required");
    return;
  }
  const decoded = Buffer.from(auth.slice(6), "base64").toString();
  const pass = decoded.includes(":") ? decoded.split(":").slice(1).join(":") : decoded;
  if (pass !== REPORT_PASS) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Ravineo Report"');
    res.status(401).send("Invalid credentials");
    return;
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use("/political", express.static(DIST_POLITICAL));
app.use(express.static(DIST_DIR));

app.get("/api/explore", async (req, res) => {
  const q = (req.query.q as string ?? "").trim().toLowerCase();
  if (!q || q.length > 100) {
    res.status(400).json({ error: "Missing or invalid 'q' parameter" });
    return;
  }

  // Sanitize: only allow alphanumeric, underscores, spaces
  const sanitized = q.replace(/[^a-z0-9_ ]/g, "").replace(/\s+/g, "_");
  if (!sanitized) {
    res.status(400).json({ error: "Invalid keyword after sanitization" });
    return;
  }

  try {
    const data = await fetchAndCache(sanitized);
    if (!data) {
      // Try stale cache as fallback
      const stale = readCachedExploreAnyAge(sanitized);
      if (stale) {
        res.json({ ...stale, _stale: true });
        return;
      }
      res.status(404).json({ error: "No data found for this keyword" });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error(`[API] Error fetching explore for "${sanitized}":`, err);
    // Fallback to any-age cache
    const stale = readCachedExploreAnyAge(sanitized);
    if (stale) {
      res.json({ ...stale, _stale: true, _error: String(err) });
      return;
    }
    res.status(500).json({ error: "Failed to fetch explore data" });
  }
});

app.get("/api/explore/cached", (_req, res) => {
  if (!fs.existsSync(EXPLORE_DIR)) {
    res.json({ keywords: [] });
    return;
  }

  const files = fs.readdirSync(EXPLORE_DIR).filter((f) => f.endsWith(".json") && f !== "state.json" && f !== "discovered_topics.json");
  const keywords: Array<{
    keyword: string;
    fetchedAt: string;
    creatorsFound: number;
    sectionCount: number;
    country?: string;
  }> = [];

  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(EXPLORE_DIR, file), "utf-8"));
      const summary = extractExploreSummary(raw.pageProps);
      keywords.push({
        keyword: raw.keyword ?? file.replace(".json", ""),
        fetchedAt: raw.fetched_at ?? "",
        creatorsFound: summary.creatorsFound,
        sectionCount: summary.sections.length,
        country: summary.country,
      });
    } catch {
      // skip malformed
    }
  }

  keywords.sort((a, b) => b.creatorsFound - a.creatorsFound);
  res.json({ keywords });
});

app.get("/api/explore/trending", (_req, res) => {
  if (!fs.existsSync(EXPLORE_DIR)) {
    res.json({ creators: [], profiles: [], topics: [] });
    return;
  }

  const files = fs.readdirSync(EXPLORE_DIR).filter((f) => f.endsWith(".json") && f !== "state.json" && f !== "discovered_topics.json");

  const creatorMap = new Map<string, { username: string; displayName: string; totalViews: number; keywords: string[]; thumbnailUrl?: string }>();
  const profileMap = new Map<string, { username: string; title: string; subscriberCount: number; keywords: string[]; logoUrl?: string }>();
  const topicCounts = new Map<string, number>();

  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(EXPLORE_DIR, file), "utf-8"));
      const data = extractExploreData(raw.keyword ?? file.replace(".json", ""), raw.pageProps);

      for (const c of data.spotlightCreators) {
        const existing = creatorMap.get(c.username);
        if (existing) {
          existing.totalViews += c.viewCount;
          if (!existing.keywords.includes(data.keyword)) existing.keywords.push(data.keyword);
        } else {
          creatorMap.set(c.username, {
            username: c.username,
            displayName: c.displayName,
            totalViews: c.viewCount,
            keywords: [data.keyword],
            thumbnailUrl: c.thumbnailUrl,
          });
        }
      }

      for (const p of data.subscribeProfiles) {
        const existing = profileMap.get(p.username);
        if (existing) {
          if (!existing.keywords.includes(data.keyword)) existing.keywords.push(data.keyword);
        } else {
          profileMap.set(p.username, {
            username: p.username,
            title: p.title,
            subscriberCount: p.subscriberCount,
            keywords: [data.keyword],
            logoUrl: p.logoUrl,
          });
        }
      }

      for (const t of data.topics) {
        topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
      }
    } catch {
      // skip
    }
  }

  const creators = [...creatorMap.values()].sort((a, b) => b.totalViews - a.totalViews).slice(0, 50);
  const profiles = [...profileMap.values()].sort((a, b) => b.subscriberCount - a.subscriberCount).slice(0, 50);
  const topics = [...topicCounts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  res.json({ creators, profiles, topics });
});

// ---------------------------------------------------------------------------
// Sponsored content search (DuckDB)
// ---------------------------------------------------------------------------

app.get("/api/sponsored/search", (req, res) => {
  const q = (req.query.q as string ?? "").trim();
  const type = (req.query.type as string ?? "").toUpperCase();
  const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10), 200);

  if (!q || q.length < 2) {
    res.status(400).json({ error: "Query must be at least 2 characters" });
    return;
  }

  const safeQ = q.replace(/'/g, "''");
  const typeFilter = type === "STORY" || type === "SPOTLIGHT" ? `AND content_type = '${type}'` : "";

  const rows = dbQuery<{
    sponsor_name: string;
    creator_name: string;
    content_type: string;
    content_url: string;
    thumbnail_url: string;
  }>(`
    SELECT sponsor_name, creator_name, content_type, content_url, thumbnail_url
    FROM sponsored_content
    WHERE (lower(sponsor_name) LIKE '%${safeQ.toLowerCase()}%'
       OR lower(creator_name) LIKE '%${safeQ.toLowerCase()}%')
    ${typeFilter}
    LIMIT ${limit}
  `);

  const sponsors = new Map<string, number>();
  const creators = new Map<string, number>();
  for (const r of rows) {
    if (r.sponsor_name) sponsors.set(r.sponsor_name, (sponsors.get(r.sponsor_name) ?? 0) + 1);
    if (r.creator_name) creators.set(r.creator_name, (creators.get(r.creator_name) ?? 0) + 1);
  }

  res.json({
    query: q,
    total: rows.length,
    results: rows,
    topSponsors: [...sponsors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    topCreators: [...creators.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
  });
});

app.get("/api/sponsored/stats", (_req, res) => {
  const stats = dbQuery<{
    content_type: string;
    total: number;
    sponsors: number;
    creators: number;
  }>(`
    SELECT content_type,
      COUNT(*) as total,
      COUNT(DISTINCT CASE WHEN sponsor_name != '' THEN sponsor_name END) as sponsors,
      COUNT(DISTINCT CASE WHEN creator_name != '' THEN creator_name END) as creators
    FROM sponsored_content
    GROUP BY content_type
  `);

  res.json({ stats });
});

// ---------------------------------------------------------------------------
// SPA fallback — serve index.html for all non-API routes
// ---------------------------------------------------------------------------

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();

  if (req.path.startsWith("/political")) {
    res.sendFile(path.join(DIST_POLITICAL, "index.html"), (err) => {
      if (err) next(err);
    });
    return;
  }

  res.sendFile(path.join(DIST_DIR, "index.html"), (err) => {
    if (err) next(err);
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(`[API] Fashion report:   ${DIST_DIR}`);
  console.log(`[API] Political report: ${DIST_POLITICAL}`);
  console.log(`[API] Password protection: ENABLED`);
});
