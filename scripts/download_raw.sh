#!/usr/bin/env bash
# Downloads 2016–2025 THEFT + MOTOR VEHICLE THEFT rows from the Chicago Data Portal API
# (the portal's "Export" button times out on the full 8M+ row dataset).
# Output: data/raw/thefts_2016_2025.csv (~716k rows, gitignored). Run from the repo root.
set -euo pipefail

URL="https://data.cityofchicago.org/resource/ijzp-q8t2.csv"
OUT="data/raw/thefts_2016_2025.csv"
PAGE=50000
mkdir -p data/raw
rm -f "$OUT"

offset=0
while :; do
  chunk=$(curl -sfG "$URL" \
    --data-urlencode "\$select=date,primary_type,description,location_description,arrest,community_area,year" \
    --data-urlencode "\$where=primary_type in('THEFT','MOTOR VEHICLE THEFT') AND year between 2016 and 2025" \
    --data-urlencode "\$order=:id" \
    --data-urlencode "\$limit=$PAGE" \
    --data-urlencode "\$offset=$offset")
  rows=$(($(printf '%s\n' "$chunk" | wc -l) - 1))
  [ "$rows" -le 0 ] && break
  if [ "$offset" -eq 0 ]; then printf '%s\n' "$chunk" > "$OUT"; else printf '%s\n' "$chunk" | tail -n +2 >> "$OUT"; fi
  offset=$((offset + PAGE))
  echo "downloaded $offset rows..."
  [ "$rows" -lt "$PAGE" ] && break
done
echo "done: $(($(wc -l < "$OUT") - 1)) rows -> $OUT"
