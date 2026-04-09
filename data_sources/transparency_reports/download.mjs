#!/usr/bin/env node
/**
 * Downloads Snap transparency report data:
 * 1. XLSX files (EU DSA H2 2025)
 * 2. PDF reports (risk assessments, audits)
 * 3. Scrapes tables from global HTML reports into JSON
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");

// ---------------------------------------------------------------------------
// Downloadable files (XLSX + PDF)
// ---------------------------------------------------------------------------

const FILES = [
  // EU DSA Transparency Reports (XLSX) — only H2 2025 has these
  {
    url: "https://assets.ctfassets.net/kw9k15zxztrs/1N9o3L0eQwQwgbUvylARsq/4a760b0dd56176843cf8fa95b145dfce/Snap_DSA_TR_H2_2025_V2.xlsx",
    path: "eu_dsa/Snap_DSA_TR_H2_2025_V2.xlsx",
  },
  {
    url: "https://assets.ctfassets.net/kw9k15zxztrs/5WRb2ihDU5QNtzlR5TPJZ7/4a1e1c58ca00ed43ed157f77ab871223/Snap_DSA_TR_H2_2025.xlsx",
    path: "eu_dsa/Snap_DSA_TR_H2_2025_V1.xlsx",
  },
  // DSA Risk & Mitigation Assessment Reports (PDF)
  {
    url: "https://downloads.ctfassets.net/kw9k15zxztrs/55C3sV2gzevjT1ucl2xEvz/7c12ac42b6c8c19144c21b16524dbf0e/DSA_Risk_and_Mitigation_Assessment_Report_-_Snapchat_-_August_2023.pdf",
    path: "pdf/DSA_Risk_Assessment_2023.pdf",
  },
  {
    url: "https://downloads.ctfassets.net/kw9k15zxztrs/6pcrjCEpTxx3aXIzXCl8iK/7421de1b79fd09892359ff1c069ccffd/CLIENT_COPY___PUBLICATION_WORKING_DRAFT_Snap_DSA_Report_-_Risk_Asssessment_Results_and_Mitigations_2024__1_.pdf",
    path: "pdf/DSA_Risk_Assessment_2024.pdf",
  },
  {
    url: "https://downloads.ctfassets.net/kw9k15zxztrs/2AsrmglaVlYdydFRiWGLnj/0e82ac4bf9e1ba24068f141d97c00581/Redacted_2025_DSA_Risk_Assessment_Redacted.pdf",
    path: "pdf/DSA_Risk_Assessment_2025.pdf",
  },
  // DSA Audit Reports (PDF)
  {
    url: "https://assets.ctfassets.net/kw9k15zxztrs/5CrFmNWQztRkDcvhZ8TwyC/6014cd3df6544a2a68a56dfad1712b56/DSA_Independent_Audit_Report_-_Snapchat_-_August_2024.pdf",
    path: "pdf/DSA_Independent_Audit_2024.pdf",
  },
  {
    url: "https://assets.ctfassets.net/kw9k15zxztrs/4Nm0Cxe56BCTivv67gn4HQ/2f73f67fb6a44416daea8baf166cdf48/DSA_Audit_Implementation_Report_-_Snapchat_-_August_2024.pdf",
    path: "pdf/DSA_Audit_Implementation_2024.pdf",
  },
  {
    url: "https://assets.ctfassets.net/kw9k15zxztrs/3buvR9gb54KpXWXHyL1APY/da5755b2255d7908893d60d639c6e812/DSA_and_Hate_Speech_Code_of_Conduct_Reporting_Package_-_Snapchat_2025_Redacted.pdf",
    path: "pdf/DSA_Independent_Audit_2025.pdf",
  },
  {
    url: "https://assets.ctfassets.net/kw9k15zxztrs/5ej7c2nFHtPSORvOeYhEYm/defe37bdc48530a300e22a682ac66334/Confidential_-_2025_Snap_DSA_and_Hate_Speech_Code_of_Conduct_Audit_Implementation_Report_Draft__1___2_.pdf",
    path: "pdf/DSA_Audit_Implementation_2025.pdf",
  },
  // EU VSP Code of Conduct
  {
    url: "https://assets.ctfassets.net/kw9k15zxztrs/2bquM6z0iT6TEX1Ge2K870/e3379cd1aed33706000df248285064f9/Snap_Code_of_Conduct_English__GB_.pdf",
    path: "pdf/EU_VSP_Code_of_Conduct_2025.pdf",
  },
];

// ---------------------------------------------------------------------------
// Global transparency report URLs (HTML pages with embedded tables)
// ---------------------------------------------------------------------------

const GLOBAL_REPORTS = [
  { period: "H1_2025", url: "https://values.snap.com/privacy/transparency-h1-2025" },
  { period: "H2_2024", url: "https://values.snap.com/privacy/transparency-h2-2024" },
  { period: "H1_2024", url: "https://values.snap.com/privacy/transparency-h1-2024" },
  { period: "H2_2023", url: "https://values.snap.com/privacy/transparency-h2-2023" },
  { period: "H1_2023", url: "https://values.snap.com/privacy/transparency-h1-2023" },
  { period: "H2_2022", url: "https://values.snap.com/privacy/transparency-h2-2022" },
  { period: "H1_2022", url: "https://values.snap.com/privacy/transparency-h1-2022" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function downloadFile(url, dest) {
  const fullPath = path.join(DATA_DIR, dest);
  if (fs.existsSync(fullPath)) {
    console.log(`  SKIP ${dest} (exists)`);
    return;
  }
  ensureDir(path.dirname(fullPath));
  console.log(`  GET  ${dest}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`  FAIL ${dest}: HTTP ${res.status}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(fullPath, buf);
  console.log(`  OK   ${dest} (${(buf.length / 1024).toFixed(0)} KB)`);
}

/**
 * Parse markdown-style tables from a text page.
 * Returns array of { headers: string[], rows: string[][] }
 */
function parseMarkdownTables(text) {
  const lines = text.split("\n");
  const tables = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    // Detect table header row (contains |)
    if (line.startsWith("|") && line.endsWith("|")) {
      // Check if next line is a separator (|---|---|)
      const nextLine = (lines[i + 1] || "").trim();
      if (nextLine.match(/^\|[\s-:|]+\|$/)) {
        const headers = line.split("|").filter(Boolean).map((s) => s.trim());
        const rows = [];
        let j = i + 2;
        while (j < lines.length) {
          const rowLine = lines[j].trim();
          if (!rowLine.startsWith("|") || !rowLine.endsWith("|")) break;
          const cells = rowLine.split("|").filter(Boolean).map((s) => s.trim());
          rows.push(cells);
          j++;
        }
        if (rows.length > 0) {
          tables.push({ headers, rows });
        }
        i = j;
        continue;
      }
    }

    // Also detect "headerless" tables (consecutive lines with values)
    // where headers and data are separated by blank lines
    // Pattern: "Header1\nValue1\nHeader2\nValue2\n..."
    i++;
  }

  return tables;
}

/**
 * Fetch a global report page, extract tables, save as JSON.
 */
async function scrapeGlobalReport(period, url) {
  const dest = `global/${period}.json`;
  const fullPath = path.join(DATA_DIR, dest);
  if (fs.existsSync(fullPath)) {
    console.log(`  SKIP ${dest} (exists)`);
    return;
  }
  ensureDir(path.dirname(fullPath));
  console.log(`  GET  ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    console.log(`  FAIL ${dest}: HTTP ${res.status}`);
    return;
  }

  const html = await res.text();

  // Extract tables from HTML using regex (simple approach for Snap's pages)
  const tableData = [];

  // Match HTML tables
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match;
  while ((match = tableRegex.exec(html)) !== null) {
    const tableHtml = match[1];
    const headerCells = [];
    const rows = [];

    // Extract thead cells
    const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    let thMatch;
    while ((thMatch = thRegex.exec(tableHtml)) !== null) {
      headerCells.push(thMatch[1].replace(/<[^>]+>/g, "").trim());
    }

    // Extract tbody rows
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    let isFirstRow = true;
    while ((trMatch = trRegex.exec(tableHtml)) !== null) {
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, "").trim());
      }
      if (cells.length > 0) {
        // If we have no headers yet, first row with th might be in-row
        if (headerCells.length === 0 && isFirstRow) {
          const inRowTh = [];
          const thInRow = /<th[^>]*>([\s\S]*?)<\/th>/gi;
          let m2;
          while ((m2 = thInRow.exec(trMatch[1])) !== null) {
            inRowTh.push(m2[1].replace(/<[^>]+>/g, "").trim());
          }
          if (inRowTh.length > 0) {
            headerCells.push(...inRowTh);
            isFirstRow = false;
            continue;
          }
        }
        rows.push(cells);
        isFirstRow = false;
      }
    }

    if (rows.length > 0 || headerCells.length > 0) {
      tableData.push({
        headers: headerCells,
        rows: rows.map((r) => {
          const obj = {};
          headerCells.forEach((h, idx) => {
            obj[h] = r[idx] ?? "";
          });
          return obj;
        }),
      });
    }
  }

  const result = { period, url, scraped_at: new Date().toISOString(), tables: tableData };
  fs.writeFileSync(fullPath, JSON.stringify(result, null, 2));
  console.log(`  OK   ${dest} (${tableData.length} tables)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Downloading Snap Transparency Report Data ===\n");

  console.log("1. Downloading files (XLSX + PDF)...");
  for (const file of FILES) {
    await downloadFile(file.url, file.path);
  }

  console.log("\n2. Scraping global transparency reports (HTML → JSON)...");
  for (const report of GLOBAL_REPORTS) {
    await scrapeGlobalReport(report.period, report.url);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
