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

The current pilot is limited to automated USDA NASS U.S. cereal observations. Other Data Trust v2 observations remain explicitly marked as sample/pending until their source-specific automation is implemented.

## B2B direction

These static JSON resources are the first version of the Dehesa Data API contract. The browser Data Explorer supports product/region/date filtering and CSV export. Server-side authentication, rate limits, query parameters and alert feeds can be layered on top without changing the normalized observation schema.
