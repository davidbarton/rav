#!/usr/bin/env tsx
/**
 * Convert Snap DSA XLSX reports to CSV files for DuckDB ingestion.
 *
 * Replaces the former Python (openpyxl) script with a pure TypeScript version
 * using SheetJS (xlsx). No Python runtime needed.
 *
 * Usage:
 *   npx tsx data_sources/transparency_reports/xlsx_to_csv.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");

function escapeCSVCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function xlsxToCsvs(xlsxPath: string, outputDir: string): void {
  const buf = fs.readFileSync(xlsxPath);
  const workbook = XLSX.read(buf);
  fs.mkdirSync(outputDir, { recursive: true });

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const csvPath = path.join(outputDir, `${sheetName}.csv`);
    let rowsWritten = 0;

    const lines: string[] = [];
    for (const row of rows) {
      const cells = (row as unknown[]).map(escapeCSVCell);
      if (cells.every((c) => c === "")) continue;
      lines.push(cells.join(","));
      rowsWritten++;
    }

    fs.writeFileSync(csvPath, lines.join("\n") + "\n");
    console.log(`  ${sheetName}: ${rowsWritten} rows -> ${path.basename(csvPath)}`);
  }
}

function main(): void {
  const euDsaDir = path.join(DATA_DIR, "eu_dsa");
  if (!fs.existsSync(euDsaDir)) {
    console.log("No data/eu_dsa/ directory found.");
    return;
  }

  const xlsxFiles = fs.readdirSync(euDsaDir)
    .filter((f) => f.endsWith(".xlsx"))
    .sort()
    .map((f) => path.join(euDsaDir, f));

  if (xlsxFiles.length === 0) {
    console.log("No XLSX files found in data/eu_dsa/");
    return;
  }

  for (const xlsxPath of xlsxFiles) {
    const stem = path.basename(xlsxPath, ".xlsx");
    const outDir = path.join(DATA_DIR, "eu_dsa_csv", stem);
    console.log(`\nConverting ${path.basename(xlsxPath)}:`);
    xlsxToCsvs(xlsxPath, outDir);
  }
}

main();
