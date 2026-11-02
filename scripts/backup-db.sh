#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

OUTPUT_DIR="${1:-./backups}"
mkdir -p "$OUTPUT_DIR"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="$OUTPUT_DIR/makemyhome-$TIMESTAMP.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$OUTPUT_FILE"
echo "Backup written to $OUTPUT_FILE"