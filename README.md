# Dehesa Index

[dehesaindex.com](https://dehesaindex.com) is a Bloomberg-style, global tracker of agricultural prices and official statistics: livestock, dairy, grains, oilseeds, fertilisers, feed and energy, with prices for the United States, the European Union, the United Kingdom and Canada and official statistics for more than 30 countries (the exact counts of countries, aggregates and regions come from `data/catalog/manifest.json`, `entityType`). It is a static site (vanilla ES5 HTML, CSS and JavaScript, no build step) fed by scheduled GitHub Actions pipelines that commit JSON files to `data/`. Interface in Spanish, English, French and Italian.

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md): data layers, pipelines, quality gates.
- [`DATA_MODEL.md`](DATA_MODEL.md): contracts, freshness, licences, anomalies.
- [`DATA_SOURCES.md`](DATA_SOURCES.md): every source and its licence (generated).
- [`CONTRIBUTING.md`](CONTRIBUTING.md): checks before a commit and the project rules.
- [`docs/REPO_GROWTH.md`](docs/REPO_GROWTH.md): repository size budget and retention policy.

## What it covers

| Area | Pages | Main sources |
|---|---|---|
| Prices | `precios.html`, `producto.html`, `europa.html`, `mercados.html` | USDA AMS, NASS, EU Agri-food Data Portal, national price reports |
| Supply and demand | `oferta-demanda.html`, `cultivos.html`, `rendimientos.html`, `ganaderia.html`, `exportaciones.html` | USDA PSD, NASS, ERS, FAS GATS, export sales |
| Country statistics | `paises.html`, `perfiles.html`, `recan.html` | MAPA, INE, Statbel, Destatis, BLE, FranceAgriMer, Statistics Canada, ABS, CBS, Statistics Denmark, Eurostat |
| Foreign trade | inside `paises.html` | Eurostat Comext (8 European countries, extra/intra-EU, product by partner), Statistics Canada, ABS |
| Tariffs | `aranceles.html` | USITC Harmonized Tariff Schedule (chapters 01-24 and 31) plus a dated layer of recent measures |
| Country profiles | `perfiles.html`, `paises.html?c=XX` | Key indicators, trade partners, macro (World Bank, Eurostat), policy interest rates (Fed, ECB, Bank of Canada, RBA), median wages |
| Costs and inputs | `costes.html`, `insumos.html` | ERS, World Bank, fertiliser and energy series |
| Weather and drought | `clima.html`, `sequia.html`, `mapa.html` | NASA POWER, US Drought Monitor, MARS |
| News and calendar | `noticias.html`, `calendario.html` | RSS pipeline (below), release calendars |

Countries with profiles: Spain, France, Germany, Belgium, Austria, Portugal, Denmark, Netherlands, United States, Canada, Australia and a European Union preview.

## How it works

- `scripts/update-*.py|js` fetch and normalise one source each and write to `data/`; most workflows are generated from `sources.yml`. Figures:
<!-- status:start (generado por scripts/build-readme-status.py; no editar) -->
- 115 data pipelines (`update-*.yml`, 115 source scripts `scripts/update-*`) plus 122 workflows in total in `.github/workflows/`; the pipeline-status report tracks 115 of them.
- 151 JSON schemas in `schemas/`; licence registry: 90 sources, 146 data files.
- Catalogue: 44 entities (34 countries, 7 aggregates, 3 regions) and more than 17500 series.
- Live pipeline state (OK, late, error, not run) and coverage gaps are not copied here: see [`status.html`](https://dehesaindex.com/status.html), built from `data/pipeline-status.json` and `data/coverage-gaps.json`.
<!-- status:end -->
- Data workflows get one concurrency group per written file set (workflows writing the same file share a group; derived-data builders share `dehesa-data-writes`); `scripts/publish-data.sh` rebases and merges the shared registries so parallel commits never lose data, and a watchdog re-runs any workflow cancelled in the queue. Each writes a `*-log.txt` next to its output.
- Country files share one schema: `{ schemaVersion, generatedAt, countries: { XX: { name, source, extend?, series: [{ id, group, label, unit, frequency, latestPeriod, latest, changePct, points }] } } }`. `js/country-data.js` loads and merges them; `js/paises.js` renders the explorer and `js/perfil-pais.js` the profiles.
- Only real series published by each source are shown: nothing is estimated or filled in. Licences and citations are in `legal.html` and `metodologia.html`.
- Tables are sortable site-wide (`initTableSort` in `js/shared.js`).

## Quality checks

```
python3 scripts/validate-data.py --all --no-report   # all schemas + semantic tests + consistency
python3 scripts/test-contracts.py                    # corrupted real data must be rejected
python3 scripts/check-licenses.py && python3 scripts/check-catalog.py --strict
node scripts/qa-site.mjs && node scripts/qa-navigation.mjs && node scripts/qa-seo.mjs
node scripts/check-performance-budget.mjs            # per-page payload budgets
node scripts/e2e.mjs                                 # real browser, desktop + mobile, axe-core
```

All of them run in GitHub Actions (`quality.yml`, `qa-site.yml`, `qa-navigation.yml`); see `CONTRIBUTING.md`.

## Data and licences

Each series keeps its source and licence in the JSON and on the page. Sources include public-domain US government data, CC BY 4.0 open data (Eurostat, World Bank, INE Portugal, ABS, among others) and attribution-only national terms. Items still pending a licence confirmation are flagged in the project notes, not republished silently.

## Automated News Pipeline

Dehesa Index now maintains an automated agricultural market-news pipeline:

RSS/Atom -> normalize -> deduplicate -> classify -> relevance score -> data/news.json -> data/views/news-index.json + data/views/news-feed.json

- Sources currently queried: Reuters, Associated Press, AFP, EFE, Bloomberg, Financial Times, Wall Street Journal, CNBC, POLITICO, Euractiv, Xinhua, DTN, AgWeb, Farm Progress, Successful Farming, World Grain, Feed Strategy, Dairy Herd, Fastmarkets, S&P Global, Argus Media, FoodNavigator, Farmers Weekly, Farmers Guardian, Agriland, AGRA, Agroeuropa, ABC Rural, Grain Central, The Land, USDA, USDA ERS, European Commission Agriculture, FAO, OECD, WTO, EIA, IEA and International Grains Council via Google News RSS search feeds.
- Retention window: 14 days; maximum 120 stories.
- Classification maps stories to maize, wheat, soybeans, rice, barley, sugar, fertilizer, diesel, energy, dairy, feed, farm costs and CAP.
- Topics include weather, trade, supply, energy, costs and policy, with source-region tagging for US, EU and global coverage.
- GitHub Actions refreshes the generated dataset every 3 hours and can also be run manually.
- Generated files should not be edited by hand: data/news.json and data/views/news-*.json are pipeline outputs.
- The market-news UI has a fallback layer so a product without a matching regional story can still show recent compatible global coverage.


### News → Market Intelligence

The automated news pipeline also emits impactChannel and marketLinks metadata for each story.

- MARKET IMPACT, INPUT COST, TRADE, WEATHER, SUPPLY, ENERGY, and POLICY channels are assigned deterministically from the story classification.
- Input-cost stories can link to existing relationship keys such as fertilizer-cereals, energy-cereals, fertilizer-milk, and energy-milk.
- The frontend joins those keys to the live Agricultural Relationship Engine, so lag, correlation, and confidence are calculated from the current verified history rather than copied into the news feed.
- If a compatible Transmission Watch alert is active, the news card can also display TRANSMISSION WATCH.
- The linkage is descriptive: it identifies market context and observed historical relationships; it does not turn a news item into a price forecast.
