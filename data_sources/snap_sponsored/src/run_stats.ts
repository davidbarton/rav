/**
 * Summarize a /sponsored_content crawl directory (page_*.json files).
 *
 * Usage (from repo root):
 *   npm run stats:sponsored
 *   npm run stats:sponsored -- --path data/sponsored_2026-04-08T17-21-33
 *   npm run stats:sponsored -- --json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const DATA_DIR = path.resolve(import.meta.dirname ?? ".", "..", "data");

interface PageJson {
  paging?: { next_link?: string };
  ad_previews?: Array<{
    sponsored_content_preview?: { creator_name?: string };
  }>;
}

function parseArgs(): { pathArg: string | null; json: boolean } {
  const raw = process.argv.slice(2);
  let pathArg: string | null = null;
  let json = false;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "--path" && i + 1 < raw.length) {
      pathArg = raw[i + 1]!;
      i++;
    } else if (raw[i] === "--json") {
      json = true;
    } else if (raw[i] === "--help" || raw[i] === "-h") {
      console.log(`Usage: npm run stats:sponsored [-- --path <sponsored_run_dir>] [-- --json]

  --path   Directory that contains sponsored_content/page_*.json (default: latest sponsored_* under data/)
  --json   Print one JSON object to stdout
`);
      process.exit(0);
    }
  }
  return { pathArg, json };
}

function findLatestSponsoredRunDir(): string | null {
  if (!fs.existsSync(DATA_DIR)) return null;
  const dirs = fs
    .readdirSync(DATA_DIR)
    .filter((d) => d.startsWith("sponsored_"))
    .filter((d) => fs.statSync(path.join(DATA_DIR, d)).isDirectory())
    .sort()
    .reverse();
  return dirs.length > 0 ? path.join(DATA_DIR, dirs[0]!) : null;
}

function pageFiles(sponsoredContentDir: string): string[] {
  if (!fs.existsSync(sponsoredContentDir)) return [];
  return fs
    .readdirSync(sponsoredContentDir)
    .filter((f) => /^page_\d+\.json$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.replace(/^page_(\d+)\.json$/, "$1"), 10);
      const nb = parseInt(b.replace(/^page_(\d+)\.json$/, "$1"), 10);
      return na - nb;
    })
    .map((f) => path.join(sponsoredContentDir, f));
}

function creatorName(row: PageJson["ad_previews"] extends (infer U)[] | undefined ? U : never): string {
  const sc = row && typeof row === "object" && "sponsored_content_preview" in row
    ? (row as { sponsored_content_preview?: { creator_name?: string } }).sponsored_content_preview
    : undefined;
  return sc?.creator_name ?? "";
}

function firstLetterBucket(name: string): string {
  if (!name) return "<empty>";
  return name[0]!.toLowerCase();
}

function dirSizeBytes(dir: string): number {
  let total = 0;
  const walk = (p: string) => {
    const st = fs.statSync(p);
    if (st.isFile()) total += st.size;
    else if (st.isDirectory()) {
      for (const name of fs.readdirSync(p)) walk(path.join(p, name));
    }
  };
  try {
    walk(dir);
  } catch {
    return 0;
  }
  return total;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type RunStatus = "RUNNING" | "PAUSED" | "FINISHED";

/** Command line looks like our sponsored crawl (npm script or node/tsx). */
function isSponsoredFetchCommandLine(cmd: string): boolean {
  const s = cmd.trim();
  if (!s.includes("sponsored")) return false;
  // npm run fetch:sponsored (parent may stay alive on some setups)
  if (/\bfetch:sponsored\b/.test(s)) return true;
  // tsc && node dist/fetch.js sponsored → running worker
  if (/\bfetch\.(js|mjs|cjs)\b/.test(s) && /\bnode\b/.test(s)) return true;
  // npx tsx .../fetch_sponsored.ts sponsored
  if (/\bfetch_sponsored\.ts\b/.test(s) && /\b(tsx|node)\b/.test(s)) return true;
  return false;
}

/** True if a sponsored fetch process appears active (best-effort; uses ps). */
function isSponsoredFetchRunning(): boolean {
  try {
    const out = execSync("ps ax -o args=", {
      encoding: "utf-8",
      maxBuffer: 512 * 1024,
    });
    return out.split("\n").some((l) => isSponsoredFetchCommandLine(l));
  } catch {
    return false;
  }
}

function deriveStatus(running: boolean, lastPageHasNextLink: boolean): RunStatus {
  if (running) return "RUNNING";
  if (!lastPageHasNextLink) return "FINISHED";
  return "PAUSED";
}

function tryFetchProcessHint(): string {
  try {
    const out = execSync("ps ax -o args=", {
      encoding: "utf-8",
      maxBuffer: 512 * 1024,
    });
    const lines = out.split("\n").filter((l) => isSponsoredFetchCommandLine(l));
    if (lines.length === 0) return "no matching process found (ps)";
    return lines.slice(0, 3).join("\n");
  } catch {
    return "could not run ps (optional)";
  }
}

function main(): void {
  const { pathArg, json: jsonOut } = parseArgs();

  let runDir: string | null = pathArg ? path.resolve(pathArg) : findLatestSponsoredRunDir();
  if (!runDir || !fs.existsSync(runDir)) {
    console.error(jsonOut ? JSON.stringify({ error: "No sponsored run directory found" }) : "No sponsored run directory found.");
    process.exit(1);
  }

  const scDir = path.join(runDir, "sponsored_content");
  const files = pageFiles(scDir);

  if (files.length === 0) {
    const err = { error: "No page_*.json under sponsored_content", runDir, sponsored_content: scDir };
    console.error(jsonOut ? JSON.stringify(err) : String(err));
    process.exit(1);
  }

  const indices = files.map((f) =>
    parseInt(path.basename(f).replace(/^page_(\d+)\.json$/, "$1"), 10),
  );

  let totalItems = 0;
  let minName: string | null = null;
  let maxName: string | null = null;
  const firstLetters: Record<string, number> = {};

  const firstPage = JSON.parse(fs.readFileSync(files[0]!, "utf-8")) as PageJson;
  const lastPage = JSON.parse(fs.readFileSync(files[files.length - 1]!, "utf-8")) as PageJson;

  const fp = firstPage.ad_previews ?? [];
  const lp = lastPage.ad_previews ?? [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf-8")) as PageJson;
    const rows = data.ad_previews ?? [];
    for (const row of rows) {
      const n = creatorName(row);
      totalItems++;
      if (minName === null || n < minName) minName = n;
      if (maxName === null || n > maxName) maxName = n;
      const b = firstLetterBucket(n);
      firstLetters[b] = (firstLetters[b] ?? 0) + 1;
    }
  }

  const lastHasNext = Boolean(lastPage.paging?.next_link);
  const bytes = dirSizeBytes(runDir);
  const running = isSponsoredFetchRunning();
  const status = deriveStatus(running, lastHasNext);

  const payload = {
    status,
    run_dir: runDir,
    sponsored_content_dir: scDir,
    page_file_count: files.length,
    page_index_min: Math.min(...indices),
    page_index_max: Math.max(...indices),
    total_items: totalItems,
    first_page_file: path.basename(files[0]!),
    first_row_creator_name: fp[0] ? creatorName(fp[0]!) : null,
    last_row_first_page_creator_name: fp.length ? creatorName(fp[fp.length - 1]!) : null,
    last_page_file: path.basename(files[files.length - 1]!),
    first_row_last_page_creator_name: lp[0] ? creatorName(lp[0]!) : null,
    last_row_creator_name: lp.length ? creatorName(lp[lp.length - 1]!) : null,
    lexicographic_min_creator_name: minName,
    lexicographic_max_creator_name: maxName,
    last_page_has_next_link: lastHasNext,
    run_dir_size_bytes: bytes,
    run_dir_size_human: formatBytes(bytes),
    fetch_process_running: running,
    fetch_process_hint: tryFetchProcessHint(),
    first_letter_counts: firstLetters,
  };

  if (jsonOut) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const statusNote =
    payload.status === "RUNNING"
      ? "(fetch process seen in ps)"
      : payload.status === "FINISHED"
        ? "(no next_link on last page — crawl reached end)"
        : "(no fetch process in ps; last page still has next_link — crawler stopped or not detected)";

  console.log(`Status: ${payload.status}  ${statusNote}\n`);
  console.log(`Run directory:\n  ${payload.run_dir}\n`);
  console.log(`Pages: ${payload.page_file_count} files  (page index ${payload.page_index_min} … ${payload.page_index_max})`);
  console.log(`Items: ${payload.total_items}`);
  console.log(`Disk:  ${payload.run_dir_size_human} (${payload.run_dir_size_bytes} bytes)\n`);

  console.log(`First page (${payload.first_page_file})`);
  console.log(`  first creator_name: ${JSON.stringify(payload.first_row_creator_name)}`);
  console.log(`  last creator_name:  ${JSON.stringify(payload.last_row_first_page_creator_name)}\n`);

  console.log(`Last page (${payload.last_page_file})`);
  console.log(`  first creator_name: ${JSON.stringify(payload.first_row_last_page_creator_name)}`);
  console.log(`  last creator_name:  ${JSON.stringify(payload.last_row_creator_name)}\n`);

  console.log(`Global lexicographic range (creator_name):`);
  console.log(`  min: ${JSON.stringify(payload.lexicographic_min_creator_name)}`);
  console.log(`  max: ${JSON.stringify(payload.lexicographic_max_creator_name)}`);
  console.log(`Last page has next_link (more to fetch): ${payload.last_page_has_next_link}\n`);

  const letters = Object.keys(payload.first_letter_counts).filter((k) => k !== "<empty>").sort();
  if (letters.length) {
    console.log("First-character counts (lowercase of 1st char):");
    for (const ch of letters) {
      console.log(`  ${JSON.stringify(ch)}: ${payload.first_letter_counts[ch]}`);
    }
    if (payload.first_letter_counts["<empty>"])
      console.log(`  "<empty>": ${payload.first_letter_counts["<empty>"]}`);
  }

  console.log(`\nFetch process (best-effort):\n${payload.fetch_process_hint}`);
}

main();
