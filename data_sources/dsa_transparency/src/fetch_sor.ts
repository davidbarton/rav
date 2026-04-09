/**
 * Download Snapchat Statements of Reasons (SORs) from the EC DSA Transparency Database.
 *
 * Source: https://transparency.dsa.ec.europa.eu/data-download
 * Per-platform daily ZIPs on S3 (no auth). Snapchat files are ~1-2 MB.
 *
 * Structure: outer ZIP → N inner .csv.zip shards → M CSVs each.
 * We flatten everything into one CSV per day.
 *
 * Usage:
 *   npx tsx src/fetch_sor.ts --test                # download 1 day, show 5 records
 *   npx tsx src/fetch_sor.ts --days 7              # last 7 days
 *   npx tsx src/fetch_sor.ts --from 2026-04-01 --to 2026-04-08
 *   npx tsx src/fetch_sor.ts --status              # show what's been downloaded
 *   npx tsx src/fetch_sor.ts --retry               # retry failed days
 *   npx tsx src/fetch_sor.ts --full                # use full variant (includes free-text fields)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DayStatus = "fetched" | "empty" | "not_found" | "error";

interface DayCellState {
  status: DayStatus;
  date: string;
  rows: number;
  file_size_bytes: number;
  fetched_at?: string;
  error?: string;
}

interface State {
  cells: Record<string, DayCellState>;
  total_rows: number;
  started_at: string;
  last_updated: string;
}

interface LogEntry {
  ts: string;
  date: string;
  status: DayStatus;
  rows: number;
  elapsed_ms: number;
  url: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATA_DIR = path.resolve(__dirname, "..", "data");
const DAILY_DIR = path.join(DATA_DIR, "daily");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const LOG_FILE = path.join(DATA_DIR, "download_log.jsonl");

const S3_BASE = "https://dsa-sor-data-dumps.s3.eu-central-1.amazonaws.com";
const PLATFORM_SLUG = "snapchat";

const buildUrl = (date: string, variant: string) =>
  `${S3_BASE}/sor-${PLATFORM_SLUG}-${date}-${variant}.zip`;

const DEFAULT_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(level: string, msg: string): void {
  const ts = new Date().toISOString();
  const lvl = level.toUpperCase().padEnd(5);
  console.log(`[${ts}] [${lvl}] ${msg}`);
}

function appendLog(entry: LogEntry): void {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
}

function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  }
  return {
    cells: {},
    total_rows: 0,
    started_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

function saveState(state: State): void {
  state.last_updated = new Date().toISOString();
  state.total_rows = Object.values(state.cells).reduce((s, c) => s + c.rows, 0);
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(formatDate(d));
  }
  return dates;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// HTTP — download file to disk (follows redirects)
// ---------------------------------------------------------------------------

function downloadFile(url: string, dest: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const follow = (reqUrl: string) => {
      https.get(reqUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          if (loc) { follow(loc); return; }
        }
        if (res.statusCode === 403 || res.statusCode === 404) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let bytes = 0;
        res.on("data", (chunk: Buffer) => { bytes += chunk.length; });
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(bytes); });
      }).on("error", (err) => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
    };
    follow(url);
  });
}

// ---------------------------------------------------------------------------
// Extract nested ZIPs → single merged CSV
// ---------------------------------------------------------------------------

function extractNestedZips(outerZipPath: string, workDir: string, outputCsvPath: string): number {
  fs.mkdirSync(workDir, { recursive: true });

  // Step 1: extract outer ZIP → inner .csv.zip shards
  execSync(`unzip -o -q "${outerZipPath}" -d "${workDir}"`, { stdio: "pipe" });

  const innerZips = fs.readdirSync(workDir)
    .filter((f) => f.endsWith(".csv.zip"))
    .sort();

  if (innerZips.length === 0) {
    // Maybe it's a flat ZIP with CSVs directly
    const csvFiles = fs.readdirSync(workDir).filter((f) => f.endsWith(".csv"));
    if (csvFiles.length === 0) throw new Error("ZIP contained no .csv.zip shards or .csv files");
    return mergeCSVs(csvFiles.map((f) => path.join(workDir, f)), outputCsvPath);
  }

  // Step 2: extract each inner ZIP
  const allCsvPaths: string[] = [];
  for (const innerZip of innerZips) {
    const innerPath = path.join(workDir, innerZip);
    const shardDir = path.join(workDir, innerZip.replace(".csv.zip", ""));
    fs.mkdirSync(shardDir, { recursive: true });
    execSync(`unzip -o -q "${innerPath}" -d "${shardDir}"`, { stdio: "pipe" });

    const csvFiles = fs.readdirSync(shardDir)
      .filter((f) => f.endsWith(".csv"))
      .sort()
      .map((f) => path.join(shardDir, f));
    allCsvPaths.push(...csvFiles);
  }

  if (allCsvPaths.length === 0) throw new Error("Inner ZIPs contained no CSV files");

  // Step 3: merge all CSVs into one (same header on each, deduplicate header)
  return mergeCSVs(allCsvPaths, outputCsvPath);
}

function mergeCSVs(csvPaths: string[], outputPath: string): number {
  const fd = fs.openSync(outputPath, "w");
  let headerWritten = false;
  let totalRows = 0;

  for (const csvPath of csvPaths) {
    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;

    if (!headerWritten) {
      fs.writeSync(fd, lines[0] + "\n");
      headerWritten = true;
    }

    const startIdx = 1; // always skip header of each shard (first file header already written)
    for (let i = startIdx; i < lines.length; i++) {
      fs.writeSync(fd, lines[i] + "\n");
      totalRows++;
    }
  }

  fs.closeSync(fd);
  return totalRows;
}

// ---------------------------------------------------------------------------
// Download + extract one day
// ---------------------------------------------------------------------------

async function downloadDay(date: string, variant: string): Promise<DayCellState> {
  const url = buildUrl(date, variant);
  const zipName = `sor-${PLATFORM_SLUG}-${date}-${variant}.zip`;
  const zipPath = path.join(DAILY_DIR, zipName);
  const workDir = path.join(DAILY_DIR, `_work_${date}`);
  const finalCsv = path.join(DAILY_DIR, `${PLATFORM_SLUG}-${date}-${variant}.csv`);

  if (fs.existsSync(finalCsv) && fs.statSync(finalCsv).size > 100) {
    const rl = createInterface({ input: createReadStream(finalCsv), crlfDelay: Infinity });
    let rows = 0;
    for await (const _ of rl) rows++;
    rows = Math.max(0, rows - 1);
    const size = fs.statSync(finalCsv).size;
    log("INFO", `  ${date}: already exists (${rows} rows, ${(size / 1024).toFixed(0)} KB), skipping`);
    return { status: "fetched", date, rows, file_size_bytes: size, fetched_at: new Date().toISOString() };
  }

  log("INFO", `  ${date}: downloading ${variant} ...`);
  const t0 = Date.now();

  try {
    const bytes = await downloadFile(url, zipPath);
    log("INFO", `  ${date}: ${(bytes / 1024).toFixed(0)} KB, extracting nested ZIPs...`);

    const rows = extractNestedZips(zipPath, workDir, finalCsv);

    // Cleanup
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });

    const fileSize = fs.statSync(finalCsv).size;
    const elapsed = Date.now() - t0;
    log("INFO", `  ${date}: ${rows.toLocaleString()} rows, ${(fileSize / 1024).toFixed(0)} KB CSV, ${(elapsed / 1000).toFixed(1)}s`);

    appendLog({ ts: new Date().toISOString(), date, status: "fetched", rows, elapsed_ms: elapsed, url });
    return { status: "fetched", date, rows, file_size_bytes: fileSize, fetched_at: new Date().toISOString() };

  } catch (e: any) {
    const elapsed = Date.now() - t0;
    const status: DayStatus = e.message?.includes("403") || e.message?.includes("404") ? "not_found" : "error";
    log("ERROR", `  ${date}: ${e.message}`);
    appendLog({ ts: new Date().toISOString(), date, status, rows: 0, elapsed_ms: elapsed, url, error: e.message });

    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });

    return { status, date, rows: 0, file_size_bytes: 0, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Preview: show first N records
// ---------------------------------------------------------------------------

async function showPreview(csvPath: string, maxRows: number): Promise<void> {
  const rl = createInterface({ input: createReadStream(csvPath), crlfDelay: Infinity });
  let header: string[] = [];
  let count = 0;

  for await (const line of rl) {
    if (!header.length) {
      header = parseCsvLine(line);
      console.log("\n" + "=".repeat(80));
      console.log(`CSV COLUMNS (${header.length}):`);
      header.forEach((h, i) => console.log(`  [${String(i).padStart(2)}] ${h}`));
      console.log("=".repeat(80));
      continue;
    }

    count++;
    if (count > maxRows) break;

    const cols = parseCsvLine(line);
    console.log(`\n--- Record ${count} ---`);
    header.forEach((h, i) => {
      const val = cols[i] ?? "";
      if (val) console.log(`  ${h}: ${val.length > 200 ? val.slice(0, 200) + "..." : val}`);
    });
  }

  console.log(`\n${"=".repeat(80)}`);
  log("INFO", `Showed ${Math.min(count, maxRows)} of ${count}+ records`);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ---------------------------------------------------------------------------
// Status command
// ---------------------------------------------------------------------------

function printStatus(state: State): void {
  const cells = Object.values(state.cells);
  const fetched = cells.filter((c) => c.status === "fetched");
  const errors = cells.filter((c) => c.status === "error" || c.status === "not_found");

  console.log("\n=== DSA Transparency Database — Snapchat SORs ===");
  console.log(`Platform: ${PLATFORM_SLUG}`);
  console.log(`S3 pattern: ${S3_BASE}/sor-${PLATFORM_SLUG}-<date>-<variant>.zip`);
  console.log(`Days downloaded: ${fetched.length}`);
  console.log(`Days failed: ${errors.length}`);
  console.log(`Total Snapchat rows: ${state.total_rows.toLocaleString()}`);

  if (fetched.length > 0) {
    const dates = fetched.map((c) => c.date).sort();
    const totalSize = fetched.reduce((s, c) => s + c.file_size_bytes, 0);
    console.log(`Date range: ${dates[0]} → ${dates[dates.length - 1]}`);
    console.log(`Total size on disk: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);

    console.log("\nPer-day breakdown:");
    for (const c of fetched.sort((a, b) => a.date.localeCompare(b.date))) {
      console.log(
        `  ${c.date}: ${c.rows.toLocaleString().padStart(8)} rows  ${(c.file_size_bytes / 1024).toFixed(0).padStart(6)} KB`,
      );
    }
  }

  if (errors.length > 0) {
    console.log("\nFailed days:");
    for (const c of errors) {
      console.log(`  ${c.date}: ${c.status} — ${c.error ?? ""}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  fs.mkdirSync(DAILY_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const isTest = args.includes("--test");
  const isStatus = args.includes("--status");
  const isRetry = args.includes("--retry");
  const variant = args.includes("--full") ? "full" : "light";

  const daysIdx = args.indexOf("--days");
  const fromIdx = args.indexOf("--from");
  const toIdx = args.indexOf("--to");
  const delayIdx = args.indexOf("--delay");

  const delay = delayIdx >= 0 ? parseInt(args[delayIdx + 1], 10) : DEFAULT_DELAY_MS;

  const state = loadState();

  if (isStatus) {
    printStatus(state);
    return;
  }

  const yesterday = formatDate(new Date(Date.now() - 86_400_000));

  let dates: string[];
  if (isTest) {
    dates = [yesterday];
  } else if (daysIdx >= 0) {
    const n = parseInt(args[daysIdx + 1], 10);
    const from = formatDate(new Date(Date.now() - n * 86_400_000));
    dates = dateRange(from, yesterday);
  } else if (fromIdx >= 0) {
    const from = args[fromIdx + 1];
    const to = toIdx >= 0 ? args[toIdx + 1] : yesterday;
    dates = dateRange(from, to);
  } else {
    dates = [yesterday];
  }

  if (isRetry) {
    dates = dates.filter((d) => {
      const cell = state.cells[d];
      return cell && (cell.status === "error" || cell.status === "not_found");
    });
    if (dates.length === 0) {
      log("INFO", "Nothing to retry");
      return;
    }
    log("INFO", `Retrying ${dates.length} failed days`);
  }

  log("INFO", `DSA Transparency Database — Snapchat SORs`);
  log("INFO", `Dates: ${dates[0]} → ${dates[dates.length - 1]} (${dates.length} day${dates.length > 1 ? "s" : ""}), variant: ${variant}`);

  for (const date of dates) {
    if (!isRetry && state.cells[date]?.status === "fetched") {
      log("INFO", `  ${date}: already fetched (${state.cells[date].rows} rows), skipping`);
      continue;
    }

    const result = await downloadDay(date, variant);
    state.cells[date] = result;
    saveState(state);

    if (isTest && result.status === "fetched") {
      const csvPath = path.join(DAILY_DIR, `${PLATFORM_SLUG}-${date}-${variant}.csv`);
      await showPreview(csvPath, 5);
      return;
    }

    if (dates.indexOf(date) < dates.length - 1) {
      await sleep(delay);
    }
  }

  const fetched = Object.values(state.cells).filter((c) => c.status === "fetched");
  log("INFO", `Done. ${fetched.length} days, ${state.total_rows.toLocaleString()} total rows`);
}

main().catch((e) => {
  log("ERROR", e.message);
  process.exit(1);
});
