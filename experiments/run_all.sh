#!/usr/bin/env bash
# Run all experiments against db/rav.db and write results to experiments/results.md
# Usage: bash experiments/run_all.sh (from repo root)

set -euo pipefail
cd "$(dirname "$0")/.."

DB="db/rav.db"
OUT="experiments/results.md"

echo "# Experiment Results" > "$OUT"
echo "" >> "$OUT"
echo "> Generated $(date -u '+%Y-%m-%d %H:%M UTC')" >> "$OUT"
echo "" >> "$OUT"

for sql in experiments/[0-9]*.sql; do
    name=$(basename "$sql" .sql)
    echo "Running $name ..."
    echo "---" >> "$OUT"
    echo "" >> "$OUT"
    echo "## $name" >> "$OUT"
    echo "" >> "$OUT"
    echo '```' >> "$OUT"
    duckdb "$DB" < "$sql" >> "$OUT" 2>&1 || echo "ERROR running $sql" >> "$OUT"
    echo '```' >> "$OUT"
    echo "" >> "$OUT"
done

echo "Done. Results in $OUT"
