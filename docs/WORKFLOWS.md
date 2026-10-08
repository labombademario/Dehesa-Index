# Inventario de workflows

Generado por `scripts/workflow-inventory.py` (no editar a mano). El ultimo estado, la duracion y la proxima ejecucion de cada uno estan en `data/pipeline-status.json`.

111 workflows (77 generados desde `sources.yml`, 34 escritos a mano). Acciones compuestas: finish, price-engine, publish, validate-files.

## Hallazgos a revisar (no son fallos: un script o una salida compartida puede ser intencionado)

- script scripts/update-ams.mjs usado por varios workflows: update-ams-auctions.yml, update-ams.yml (duplicado o fan-out intencionado: revisar)
- script scripts/update-nass-us.mjs usado por varios workflows: quality.yml, update-nass-data.yml (duplicado o fan-out intencionado: revisar)
- salida data/mb-markets publicada por varios workflows: update-mb-cattle.yml, update-mb-smallstock.yml
- salida data/search-index.json publicada por varios workflows: update-ams-auctions.yml, update-ams.yml
- salida data/spain-balances publicada por varios workflows: update-spain-balances.yml, update-spain-olive.yml
- salida data/spain-slaughter publicada por varios workflows: update-spain-slaughter-census.yml, update-spain-slaughter.yml
- salida data/spain-wine publicada por varios workflows: update-spain-wine-balance-historic.yml, update-spain-wine-monthly.yml, update-spain-wine.yml

## AR

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-argentina.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-argentina.py | argentina-log.txt, argentina-stats.json, revisions.json | finish, validate-files |

## AU

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-au-states.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-au-states.py | au-states-log.txt, au-states.json, revisions.json | finish, validate-files |
| update-au-trade.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-au-trade.py | au-trade-products.json, australia-trade-log.txt, australia-trade-stats.json … | finish, validate-files |
| update-austria.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-austria.py | austria-log.txt, austria-stats.json, revisions.json | finish, validate-files |

## CA

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-alberta-weekly.yml | a mano | semanal (5,6) | update-alberta-weekly.py | - | price-engine, publish |
| update-canada-drought.yml | generado | semanal (2,4) | detect-revisions.py, gen-workflows.py, update-canada-drought.py | canada-drought.json, revisions.json | finish, validate-files |
| update-canada-grain.yml | generado | semanal (3,4,5) | detect-revisions.py, gen-workflows.py, update-canada-grain.py | canada-grain.json, revisions.json | finish, validate-files |
| update-canada-provinces-macro.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-canada-provinces-macro.py | canada-provinces-macro-log.txt, canada-provinces-macro.json, revisions.json | finish, validate-files |
| update-canada-provinces.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-canada-provinces.py | canada-provinces.json, revisions.json | finish, validate-files |
| update-canada-stats.yml | generado | semanal (1,4) | detect-revisions.py, gen-workflows.py, update-canada-stats.py | canada-stats-log.txt, canada-stats.json, revisions.json … | finish, validate-files |
| update-canada.yml | a mano | semanal (1,4) | update-statcan-canada.py | - | price-engine, publish |
| update-cap-dk.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-dk.py | cap/dk/amounts.json, cap/dk/watch.json, revisions.json | finish, validate-files |
| update-cap-es.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-es.py | cap/es/amounts.json, cap/es/watch.json, revisions.json | finish, validate-files |
| update-cattle-on-feed.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-cattle-on-feed.py | cattle-on-feed.json, revisions.json | finish, validate-files |

## CL

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-chile.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-chile.py | chile-log.txt, chile-stats.json, revisions.json | finish, validate-files |

## Calidad

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| qa-navigation.yml | a mano | manual / por evento | qa-navigation.mjs | - | - |
| qa-site.yml | a mano | manual / por evento | qa-site.mjs, validate-snapshots.mjs | - | - |
| quality.yml | a mano | manual / por evento | build-csv.mjs, build-data-index.mjs, build-data-quality.mjs | - | - |
| verify-anomalies.yml | a mano | semanal (1) | test-verify-anomalies.py, verify-anomalies.py | data-anomalies.json | finish, validate-files |

## Derivados y estado

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-pipeline-status.yml | a mano | varias veces al dia | alert-issue.py, build-app-views.mjs, build-cap-index.py | app, cap/index.json, catalog … | - |
| update-seo-pages.yml | generado | diaria | build-seo-pages.mjs, gen-workflows.py, qa-seo.mjs | - | finish |

## EU

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-eu-agrifood.yml | a mano | semanal (4) | qa-site.mjs, update-eu-agrifood.mjs | - | price-engine, publish |
| update-eu-balances.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-eu-balances.py | revisions.json, supply-balances/eu.json | finish, validate-files |
| update-eu-cap.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-eu-cap.py | cap/eu/allocations-log.txt, cap/eu/allocations.json, revisions.json | finish, validate-files |
| update-eu-catalog.yml | a mano | semanal (4) | update-eu-catalog.mjs | eu | - |
| update-eu-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-eu-drought.py | eu-drought.json, revisions.json | finish, validate-files |
| update-eu-farm-economics.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eu-farm-economics.py | eu-farm-economics.json, revisions.json | finish, validate-files |
| update-eu-gapfill.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-eu-gapfill.py | eu-gapfill-log.txt, eu-gapfill-stats.json, revisions.json | finish, validate-files |
| update-eu-regions-macro.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-eurostat-regions-macro.py | eu-regions-macro-log.txt, eu-regions-macro.json, revisions.json | finish, validate-files |
| update-eu-regions.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-eurostat-regions.py | eu-regions-at.json, eu-regions-be.json, eu-regions-de.json … | finish, validate-files |
| update-eu-trade.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-trade.py | eu-trade-log.txt, eu-trade-products.json, eu-trade-stats.json … | finish, validate-files |
| update-eu-vat.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-vat.py | eu-vat.json, revisions.json | finish, validate-files |
| update-eurostat-depth.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-eurostat-depth.py | eurostat-depth-log.txt, eurostat-depth-stats.json, revisions.json | finish, validate-files |
| update-eurostat-eu.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-eurostat-eu.py | eurostat-eu-log.txt, eurostat-eu-stats.json, eurostat-euw-stats.json … | finish, validate-files |
| update-eurostat.yml | a mano | mensual | qa-navigation.mjs, update-eurostat-indices.mjs | - | price-engine, publish |

## FR

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-fr-cereobs.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-fr-cereobs.py | france-cereobs.json, revisions.json | finish, validate-files |
| update-fr-vigieau.yml | generado | semanal (1,3,5) | detect-revisions.py, gen-workflows.py, update-fr-vigieau.py | france-vigieau.json, revisions.json | finish, validate-files |

## NL

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-nl-cbs.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-nl-cbs.py | netherlands-farm-log.txt, netherlands-farm.json, revisions.json | finish, validate-files |
| update-nl-rvo.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-nl-rvo.py | netherlands-markets-log.txt, netherlands-markets.json, revisions.json | finish, validate-files |

## Noticias y blog

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-news.yml | a mano | varias veces al dia | update_news.py | news-status.json, news.json, views/news-feed.json … | finish, validate-files |
| update-weekly-blog.yml | a mano | 2 veces al dia | build-blog-editions.py, update-weekly-blog.py | blog, blog/editions/*.json, blog/weekly/*.json … | finish, validate-files |

## Otros

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| e2e-full.yml | a mano | semanal (1) | e2e-variants.mjs | - | - |
| update-belgium.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-belgium.py | belgium-log.txt, belgium-stats.json, revisions.json | finish, validate-files |
| update-climate.yml | a mano | semanal (2) | update-climate.mjs | climate-history.json, climate.json | finish, validate-files |
| update-country-macro.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-country-macro.py | country-macro-log.txt, country-macro.json, revisions.json | finish, validate-files |
| update-country-stats.yml | a mano | semanal (3) | detect-revisions.py, update-country-stats.py | country-stats.json | finish, publish, validate-files |
| update-cpi.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-cpi.py | cpi-log.txt, cpi.json, revisions.json | finish, validate-files |
| update-crop-insurance-ca.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-crop-insurance-ca.py | crop-insurance-ca-log.txt, crop-insurance-ca.json, revisions.json | finish, validate-files |
| update-crop-insurance.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-crop-insurance.py | crop-insurance-log.txt, crop-insurance.json, revisions.json | finish, validate-files |
| update-crop-progress.yml | a mano | 2 veces/semana | update-crop-progress.mjs | crop-progress.json | finish, validate-files |
| update-defra-milk.yml | a mano | semanal (5) | qa-site.mjs, update-defra-api-uk.py, update-defra-milk-uk.py | - | price-engine, publish |
| update-denmark-depth.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-denmark-depth.py | denmark-depth-log.txt, denmark-depth.json, revisions.json | finish, validate-files |
| update-denmark.yml | a mano | semanal (2,5) | update-dst-denmark.py | denmark-log.txt, denmark-prices.json | finish, validate-files |
| update-drought.yml | a mano | 2 veces/semana | update-drought.mjs | drought-log.txt, drought.json | finish, validate-files |
| update-energy-markets.yml | a mano | semanal (3,5) | update-eia-energy-markets.mjs, update-worldbank-gas-eu.py | - | finish, price-engine, publish |
| update-energy.yml | a mano | semanal (5) | sync-diesel-trust.mjs, update-ec-diesel-eu.py, update-eia-diesel-us.mjs | - | price-engine, publish |
| update-export-sales.yml | a mano | 2 veces/semana | update-export-sales.mjs | export-sales-log.txt, export-sales.json | finish, validate-files |
| update-france.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-france.py | france-log.txt, france-stats.json, revisions.json | finish, validate-files |
| update-fx-history.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-fx-history.py | fx-history-log.txt, fx-history.json, revisions.json | finish, validate-files |
| update-fx.yml | a mano | semanal (1-5) | update-fx.mjs | - | - |
| update-gats.yml | a mano | diaria | update-gats.mjs | gats-log.txt, gats.json | validate-files |
| update-germany-livestock.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-germany-livestock.py | germany-livestock-log.txt, germany-livestock.json, revisions.json | finish, validate-files |
| update-germany.yml | generado | semanal (1,4) | detect-revisions.py, gen-workflows.py, update-germany.py | germany-agri.json, germany-log.txt, germany-stats.json … | finish, validate-files |
| update-interest-rates.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-interest-rates.py | interest-rates-log.txt, interest-rates-stats.json, revisions.json | finish, validate-files |
| update-italy-eurostat.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-italy-eurostat.py | italy-eurostat-log.txt, italy-eurostat-stats.json, revisions.json | finish, validate-files |
| update-mars-us.yml | a mano | 2 veces/semana | update-ams-nfdm.mjs, update-mars-us.mjs | - | price-engine, publish |
| update-mb-cattle.yml | generado | 2 veces/semana | detect-revisions.py, gen-workflows.py, update-mb-cattle.py | mb-markets, mb-markets-log.txt, mb-markets/cattle.json … | finish, validate-files |
| update-mb-smallstock.yml | generado | 3 veces/semana | detect-revisions.py, gen-workflows.py, update-mb-smallstock.py | mb-markets, mb-markets/hogs.json, mb-markets/sheep-goat.json … | finish, validate-files |
| update-partner-tariffs.yml | a mano | mensual | detect-revisions.py, update-partner-tariffs.py | tariffs-ca.json, tariffs-eu.json, tariffs-mx.json | finish, publish, validate-files |
| update-poland-eurostat.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-poland-eurostat.py | poland-eurostat-log.txt, poland-eurostat-stats.json, revisions.json | finish, validate-files |
| update-poland.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-poland.py | poland-log.txt, poland-stats.json, revisions.json | finish, validate-files |
| update-portugal-eurostat.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-portugal-eurostat.py | portugal-eurostat-log.txt, portugal-eurostat-stats.json, revisions.json | finish, validate-files |
| update-portugal.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-portugal.py | portugal-log.txt, portugal-stats.json, revisions.json | finish, validate-files |
| update-recan.yml | a mano | semanal (4) | update-recan.py | recan-log.txt, recan.json | finish, validate-files |
| update-spain-balances.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-balances.py | revisions.json, spain-balances, spain-balances-log.txt … | finish, validate-files |
| update-spain-crops.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-crops.py | revisions.json, spain-crops, spain-crops-log.txt … | finish, validate-files |
| update-spain-livestock.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-livestock.py | revisions.json, spain-livestock, spain-livestock-log.txt … | finish, validate-files |
| update-spain-milk.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-milk.py | revisions.json, spain-milk, spain-milk-log.txt … | finish, validate-files |
| update-spain-olive.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-olive.py | revisions.json, spain-balances, spain-balances/olive.json … | finish, validate-files |
| update-spain-slaughter-census.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-slaughter-census.py | revisions.json, spain-slaughter, spain-slaughter-census-log.txt … | finish, validate-files |
| update-spain-slaughter.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-slaughter.py | revisions.json, spain-slaughter, spain-slaughter-log.txt … | finish, validate-files |
| update-spain-wine-balance-historic.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-wine-balance-historic.py | revisions.json, spain-wine, spain-wine-balance-historic-log.txt … | finish, validate-files |
| update-spain-wine-monthly.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-wine-monthly.py | revisions.json, spain-wine, spain-wine-monthly-log.txt … | finish, validate-files |
| update-spain-wine.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-wine.py | revisions.json, spain-wine, spain-wine-log.txt … | finish, validate-files |
| update-spain.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-mapa-spain.py | revisions.json, spain-log.txt, spain-stats.json | finish, validate-files |
| update-switzerland-foag.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-ch-foag.py | ch-chain.json, revisions.json, switzerland-foag-log.txt … | finish, validate-files |
| update-switzerland-meteo.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-ch-meteo.py | revisions.json, switzerland-meteo-log.txt, switzerland-meteo-stats.json | finish, validate-files |
| update-usda-calendar.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-usda-calendar.py | revisions.json, usda-calendar.json | finish, validate-files |
| update-usda-psd.yml | a mano | mensual | update-usda-psd.mjs | supply-demand-map.json, supply-demand.json | finish, validate-files |
| update-worldbank-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-worldbank-agri.py | revisions.json, worldbank-agri-log.txt, worldbank-agri.json | finish, validate-files |
| update-worldbank-urea.yml | a mano | mensual | qa-navigation.mjs, update-worldbank-urea-eu.py | - | price-engine, publish |

## UK

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-uk-defra.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-uk-defra.py | revisions.json, uk-log.txt, uk-stats.json | finish, validate-files |
| update-uk-trade.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-uk-trade.py | revisions.json, uk-trade-log.txt, uk-trade-stats.json | finish, validate-files |

## US

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-ams-auctions.yml | a mano | semanal (6) | build-search-index.mjs, update-ams.mjs | ams, search-index.json | finish, validate-files |
| update-ams.yml | a mano | 2 veces/semana | build-ams-daily.py, build-search-index.mjs, build-us-fertilizers.py | ams-grain-daily.json, search-index.json, us-fertilizers.json | finish, publish, validate-files |
| update-ers.yml | a mano | semanal (1) | update-ers.mjs | ers-log.txt, ers.json | finish, validate-files |
| update-nass-data.yml | a mano | semanal (1) | update-nass-us.mjs | - | price-engine, publish |
| update-nass.yml | a mano | semanal (1) | update-nass.mjs | nass-*-log.txt, nass-*.json, nass-crops.json … | finish, validate-files |
| update-us-arcplc.yml | generado | mensual | detect-revisions.py, gen-workflows.py, source-status.py | revisions.json, us-arcplc, us-arcplc/index.json … | finish, publish, validate-files |
| update-us-cash-bids.yml | generado | 2 veces/semana | detect-revisions.py, gen-workflows.py, update-us-cash-bids.py | revisions.json, us-cash-bids, us-cash-bids/ingestion-status.json … | finish, validate-files |
| update-us-county-yields.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-county-yields.py | revisions.json, us-county, us-county-yields-log.txt … | finish, validate-files |
| update-us-dairy.yml | generado | 2 veces/semana | detect-revisions.py, gen-workflows.py, update-us-dairy.py | revisions.json, us-dairy.json | finish, validate-files |
| update-us-ers.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-us-ers.py | revisions.json, us-ers-log.txt, us-ers-stats.json … | finish, validate-files |
| update-us-lamb.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-us-lamb.py | revisions.json, us-lamb.json | finish, validate-files |
| update-us-local-markets.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-us-local-markets.py | revisions.json, us-local, us-local/status.json | finish, validate-files |
| update-us-markets.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-us-markets.py | revisions.json, us-markets/cot.json, us-markets/ethanol.json … | finish, validate-files |
| update-us-ppi.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-us-ppi.py | revisions.json, us-ppi-log.txt, us-ppi.json | finish, validate-files |
| update-us-states-macro.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-us-states-macro.py | revisions.json, us-states-macro-log.txt, us-states-macro.json | finish, validate-files |
| update-us-states.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-us-states.py | revisions.json, us-states, us-states/index.json … | finish, validate-files |
| update-us-stats.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-us-stats.py | revisions.json, us-stats-log.txt, us-stats.json | finish, validate-files |
| update-us-tariffs.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-us-tariffs.py | revisions.json, us-tariffs-log.txt, us-tariffs.json | finish, validate-files |
