# Dehesa Index Data API

The public data layer is intentionally static and API-ready.

## Endpoints

- `/data/latest.json` — latest normalized observation per product/region.
- `/data/catalog.json` — machine-readable catalog of products, regions, sources and frequencies.
- `/data/history.json` — normalized historical observations reconstructed from dated snapshots.
- `/data/history.csv` — CSV export generated from the normalized history.
- `/data/api.json` — machine-readable description of the public contract.
- `/data/snapshots/YYYY-MM-DD.json` — dated immutable snapshots when available.

## Contract

Every observation contains:

`product, region, sourceId, observationDate, value, currency, unit, frequency`

Additional provenance is retained in the snapshot.

## Status

`precios.html` reads `/data/latest.json` on load and applies an observation to
the visible price only when its status, source, currency, unit and frequency
match the product's published-source contract. The embedded data remains an
offline fallback.

The current live contracts cover USDA NASS U.S. cereals, the European
Commission raw-milk series, World Bank EU urea, EIA U.S. diesel and the
European Commission Weekly Oil Bulletin diesel series. A source without a
verified observation remains visible only through the fallback dataset and is
marked `PENDIENTE` in Data Trust; it is never promoted automatically.

## B2B direction

These static JSON resources are the first version of the Dehesa Data API contract. The browser Data Explorer supports product/region/date filtering and CSV export. Server-side authentication, rate limits, query parameters and alert feeds can be layered on top without changing the normalized observation schema.
