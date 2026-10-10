#!/usr/bin/env bash
# Regenera los ficheros derivados del motor de precios (misma cadena que .github/actions/price-engine, sin validar).
# Lo usa scripts/publish-data.sh cuando una publicacion choca con otra en esos ficheros: se toma lo ultimo de origin/main y se recalcula.
set -e
node scripts/build-data-index.mjs
python3 scripts/detect-revisions.py data/history.json || true
node scripts/build-csv.mjs
node scripts/build-data-quality.mjs
node scripts/build-intelligence.mjs
node scripts/build-normalized-data.mjs
node scripts/build-cross-market.mjs && node scripts/build-dehesa-index.mjs
node scripts/build-alert-signals.mjs
python3 scripts/build-price-views.py
