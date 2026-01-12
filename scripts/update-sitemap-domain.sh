#!/usr/bin/env bash
set -euo pipefail

SITEMAP_FILE="${1:-dist/sitemap.xml}"
SITE_URL="${SITE_URL:-}"

if [ -z "$SITE_URL" ]; then
  echo "SITE_URL not set; skipping sitemap update"
  exit 0
fi

if [ ! -f "$SITEMAP_FILE" ]; then
  echo "sitemap file not found at $SITEMAP_FILE; skipping sitemap update"
  exit 0
fi

# Remove trailing slash from SITE_URL to avoid double slashes
SITE_URL="${SITE_URL%/}"

# Use a portable approach instead of sed -i (BSD/macOS vs GNU differences)
tmp_file="${SITEMAP_FILE}.tmp"
sed "s|__SITE_URL__|$SITE_URL|g" "$SITEMAP_FILE" > "$tmp_file"
mv "$tmp_file" "$SITEMAP_FILE"
