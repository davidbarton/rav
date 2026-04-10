/**
 * Fetch specific explore keywords by name (bypasses seed list ordering).
 * Usage: npx tsx src/fetch_targeted.ts dior chanel gucci luxury beauty
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchExplore, extractExploreSummary } from "../../lib/snap_explore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");
const OUT_DIR = path.join(DATA_DIR, "explore");
const STATE_FILE = path.join(OUT_DIR, "state.json");

fs.mkdirSync(OUT_DIR, { recursive: true });

const keywords = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (keywords.length === 0) {
  console.error("Usage: npx tsx src/fetch_targeted.ts <keyword1> <keyword2> ...");
  process.exit(1);
}

const DELAY_MS = 2500;

interface CellState {
  status: string;
  keyword: string;
  query_echo?: string;
  country?: string;
  sections: { type: string; count: number }[];
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

function keywordToFilename(keyword: string): string {
  return keyword.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

async function main() {
  const state = loadState();
  const proxyUrl = process.env.SNAP_PROXY || undefined;

  const queue = keywords.filter((kw) => {
    const cell = state.cells[kw];
    if (cell?.status === "fetched") {
      console.log(`[SKIP] ${kw} — already fetched`);
      return false;
    }
    return true;
  });

  console.log(`Fetching ${queue.length} keywords: ${queue.join(", ")}\n`);

  for (let i = 0; i < queue.length; i++) {
    const kw = queue[i];
    if (i > 0) {
      console.log(`  waiting ${DELAY_MS}ms...`);
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    const t0 = Date.now();
    console.log(`[${i + 1}/${queue.length}] Fetching "${kw}"...`);

    const result = await fetchExplore(kw, proxyUrl);
    const elapsed = Date.now() - t0;

    state.total_requests++;

    if (result.status === "fetched" && result.pageProps) {
      const file = path.join(OUT_DIR, `${keywordToFilename(kw)}.json`);
      fs.writeFileSync(
        file,
        JSON.stringify({ keyword: kw, fetched_at: new Date().toISOString(), pageProps: result.pageProps }, null, 2)
      );

      const extract = result.extract!;
      state.total_fetched++;
      state.cells[kw] = {
        status: "fetched",
        keyword: kw,
        query_echo: extract.query,
        country: extract.country,
        sections: extract.sections,
        creators_found: extract.creatorsFound,
        topics_found: extract.topicsFound,
        fetched_at: new Date().toISOString(),
      };
      saveState(state);

      const sectionStr = extract.sections.map((s) => `${s.type}:${s.count}`).join(", ");
      console.log(`  ✓ ${kw} — ${extract.creatorsFound} creators, sections: ${sectionStr} (${elapsed}ms)`);
    } else {
      state.cells[kw] = {
        status: result.status,
        keyword: kw,
        sections: result.extract?.sections ?? [],
        creators_found: result.extract?.creatorsFound ?? 0,
        topics_found: result.extract?.topicsFound ?? [],
        fetched_at: new Date().toISOString(),
        error: result.error,
      };
      saveState(state);
      console.log(`  ✗ ${kw} — ${result.status}: ${result.error ?? "unknown"} (${elapsed}ms)`);

      if (result.status === "rate_limited") {
        console.log("  ⚠ Rate limited — stopping.");
        break;
      }
    }
  }

  console.log(`\nDone. Fetched: ${state.total_fetched}, Total requests: ${state.total_requests}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
