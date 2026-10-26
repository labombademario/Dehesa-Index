# Inventario de workflows

Generado por `scripts/workflow-inventory.py` (no editar a mano). El ultimo estado, la duracion y la proxima ejecucion de cada uno estan en `data/pipeline-status.json`.

300 workflows (250 generados desde `sources.yml`, 50 escritos a mano). Acciones compuestas: finish, price-engine, publish, validate-files.

## Hallazgos a revisar (no son fallos: un script o una salida compartida puede ser intencionado)

- script scripts/update-ams.mjs usado por varios workflows: update-ams-auctions.yml, update-ams.yml (duplicado o fan-out intencionado: revisar)
- script scripts/update-cap-nat.py usado por varios workflows: update-cap-de.yml, update-cap-el.yml, update-cap-fr.yml, update-cap-it.yml, update-cap-nl.yml, update-cap-pl.yml, update-cap-pt.yml (duplicado o fan-out intencionado: revisar)
- script scripts/update-eu-ghg-agri.py usado por varios workflows: update-at-ghg-agri.yml, update-be-ghg-agri.yml, update-de-ghg-agri.yml, update-el-ghg-agri.yml, update-eu-more-ghg-agri.yml, update-fr-ghg-agri.yml, update-hr-ghg-agri.yml, update-ie-ghg-agri.yml, update-it-ghg-agri.yml, update-nl-ghg-agri.yml, update-pl-ghg-agri.yml, update-pt-ghg-agri.yml (duplicado o fan-out intencionado: revisar)
- script scripts/update-eurostat-structure.py usado por varios workflows: update-eurostat-structure.yml, update-eurostat-structure2.yml (duplicado o fan-out intencionado: revisar)
- script scripts/update-nass-us.mjs usado por varios workflows: quality.yml, update-nass-data.yml (duplicado o fan-out intencionado: revisar)
- salida data/country-macro.json publicada por varios workflows: update-country-macro.yml, update-cpi.yml
- salida data/search-index.json publicada por varios workflows: update-ams-auctions.yml, update-ams.yml
- script scripts/update-ro-anm.py no lo usa ningun workflow ni otro script (huerfano)

## AR

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-argentina-provinces.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-argentina-provinces.py | ar-provinces.json | finish, validate-files |
| update-argentina.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-argentina.py | argentina-stats.json | finish, validate-files |

## AT

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-at-diesel.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-at-diesel.py | at-diesel.json | finish, validate-files |
| update-at-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-at-drought.py | at-drought.json | finish, validate-files |
| update-at-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | at-ghg-agri.json | finish, validate-files |

## AU

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-au-prices.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-au-prices.py | australia-prices-stats.json | finish, validate-files |
| update-au-states-macro.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-au-states-macro.py | australia-states-macro.json | finish, validate-files |
| update-au-states.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-au-states.py | au-states.json | finish, validate-files |
| update-au-trade.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-au-trade.py | au-trade-products.json, australia-trade-stats.json | finish, validate-files |
| update-austria-balances.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-austria-balances.py | austria-balances-stats.json | finish, validate-files |
| update-austria.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-austria.py | austria-stats.json | finish, validate-files |

## BE

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-be-diesel.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-be-diesel.py | be-diesel.json | finish, validate-files |
| update-be-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-be-drought.py | be-drought.json | finish, validate-files |
| update-be-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | be-ghg-agri.json | finish, validate-files |
| update-be-nitrates.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-be-nitrates.py | be-nitrates.json | finish, validate-files |
| update-be-statbel-more.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-belgium-more.py | belgium-more-stats.json, belgium-more/index.json | finish, validate-files |

## CA

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-alberta-weekly.yml | a mano | semanal (5,6) | update-alberta-weekly.py | - | price-engine, publish |
| update-ca-aafc-slaughter.yml | generado | semanal (3,4,5) | detect-revisions.py, gen-workflows.py, update-ca-aafc-slaughter.py | ca-aafc-slaughter-stats.json | finish, validate-files |
| update-ca-alberta-inputs.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-ca-alberta-inputs.py | ca-alberta-inputs-stats.json | finish, validate-files |
| update-ca-boc-bcpi.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-ca-boc-bcpi.py | ca-boc-bcpi-stats.json | finish, validate-files |
| update-ca-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-ca-ghg-agri.py | ca-ghg-agri.json | finish, validate-files |
| update-ca-panel-prices.yml | a mano | semanal (2,5) | build-ca-panel-obs.py | - | price-engine, publish |
| update-ca-statcan-more.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-ca-statcan-more.py | ca-statcan-more-stats.json | finish, validate-files |
| update-canada-drought.yml | generado | semanal (2,4) | detect-revisions.py, gen-workflows.py, update-canada-drought.py | canada-drought.json | finish, validate-files |
| update-canada-grain.yml | generado | semanal (3,4,5) | detect-revisions.py, gen-workflows.py, update-canada-grain.py | canada-grain.json | finish, validate-files |
| update-canada-provinces-macro.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-canada-provinces-macro.py | canada-provinces-macro.json | finish, validate-files |
| update-canada-provinces.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-canada-provinces.py | canada-provinces.json | finish, validate-files |
| update-canada-stats.yml | generado | semanal (1,4) | detect-revisions.py, gen-workflows.py, update-canada-stats.py | canada-stats.json, supply-balances/ca.json | finish, validate-files |
| update-canada-wholesale.yml | a mano | semanal (1-5) | update-canada-wholesale.py | - | publish |
| update-canada.yml | a mano | semanal (1,4) | update-statcan-canada.py | - | price-engine, publish |
| update-cap-de.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-nat.py | cap/de/watch.json | finish, validate-files |
| update-cap-dk.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-dk.py | cap/dk/amounts.json, cap/dk/watch.json | finish, validate-files |
| update-cap-el.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-nat.py | cap/el/watch.json | finish, validate-files |
| update-cap-es.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-es.py | cap/es/amounts.json, cap/es/watch.json | finish, validate-files |
| update-cap-fr.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-nat.py | cap/fr/watch.json | finish, validate-files |
| update-cap-it.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-nat.py | cap/it/watch.json | finish, validate-files |
| update-cap-nl.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-nat.py | cap/nl/watch.json | finish, validate-files |
| update-cap-pl.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-nat.py | cap/pl/watch.json | finish, validate-files |
| update-cap-pt.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-cap-nat.py | cap/pt/watch.json | finish, validate-files |
| update-cattle-on-feed.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-cattle-on-feed.py | cattle-on-feed.json | finish, validate-files |

## CL

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-chile-fv.yml | a mano | semanal (2-6) | update-chile-fv.py | - | publish |
| update-chile.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-chile.py | chile-stats.json | finish, validate-files |

## Calidad

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| qa-navigation.yml | a mano | manual / por evento | qa-navigation.mjs | - | - |
| qa-site.yml | a mano | manual / por evento | qa-site.mjs, validate-snapshots.mjs | - | - |
| quality.yml | a mano | diaria | build-api.py, build-baskets.py, build-blog-posts.mjs | - | - |
| verify-anomalies.yml | a mano | semanal (1) | test-verify-anomalies.py, verify-anomalies.py | data-anomalies.json | finish, validate-files |

## DE

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-de-diesel.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-de-diesel.py | de-diesel.json | finish, validate-files |
| update-de-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | de-ghg-agri.json | finish, validate-files |
| update-de-rivers.yml | generado | varias veces al dia | detect-revisions.py, gen-workflows.py, update-de-rivers.py | de-rivers.json | finish, validate-files |
| update-de-soil-moisture.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-de-soil-moisture.py | de-soil-moisture.json | finish, validate-files |

## Derivados y estado

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-pipeline-status.yml | a mano | varias veces al dia | alert-issue.py, build-api.py, build-app-env.py | api, app, blog/posts.json … | - |
| update-seo-pages.yml | generado | diaria | build-seo-pages.mjs, gen-workflows.py, qa-seo.mjs | - | finish |

## ES

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-es-avances.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-es-avances.py | spain-avances/avances.json | finish, validate-files |
| update-es-climate-provinces.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-es-climate.mjs | es-climate-provinces.json | finish, validate-files |
| update-es-cork.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-es-cork.py | es-cork.json | finish, validate-files |
| update-es-drought-ute.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-es-drought-ute.py | es-drought-ute.json | finish, validate-files |
| update-es-esyrce-extra.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-es-esyrce-extra.py | spain-esyrce/extra-index.json | finish, validate-files |
| update-es-esyrce.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-es-esyrce.py | spain-esyrce/index.json | finish, validate-files |
| update-es-ganaderia.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-es-ganaderia.py | spain-ganaderia/dairy.json, spain-ganaderia/eggs.json, spain-ganaderia/forecasts.json | finish, validate-files |
| update-es-gasoleo-b.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-es-gasoleo-b.py | es-gasoleo-b.json | finish, validate-files |
| update-es-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-es-ghg-agri.py | es-ghg-agri.json | finish, validate-files |
| update-es-health.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-es-rasve.py | spain-health/focos.json | finish, validate-files |
| update-es-income.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-es-cea.py | spain-income/cea.json | finish, validate-files |
| update-es-inputs.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-es-inputs.py | spain-inputs/fertilizers.json, spain-inputs/pesticides.json | finish, validate-files |
| update-es-jcyl-prices.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-jcyl-prices.py | es-jcyl-prices.json | finish, validate-files |
| update-es-prices.yml | generado | semanal (2,4) | detect-revisions.py, gen-workflows.py, update-es-pmn.py | spain-prices/obs.json, spain-prices/pmn.json | finish, validate-files |

## EU

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-eu-agrifood.yml | a mano | semanal (4) | qa-site.mjs, update-eu-agrifood.mjs | - | price-engine, publish |
| update-eu-balances.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-eu-balances.py | supply-balances/eu.json | finish, validate-files |
| update-eu-cap.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-eu-cap.py | cap/eu/allocations.json | finish, validate-files |
| update-eu-catalog.yml | a mano | semanal (4) | update-eu-catalog.mjs | eu | - |
| update-eu-climate.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-climate.py | eu-climate.json | finish, validate-files |
| update-eu-crops-map.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-crops-map.py | eu-crops-map.json | finish, validate-files |
| update-eu-diesel-more.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-eu-diesel-more.py | diesel-eu-more.json | finish, validate-files |
| update-eu-drought-ind.yml | generado | semanal (2) | gen-workflows.py, update-eu-drought-indicators.py | - | finish |
| update-eu-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-eu-drought.py | eu-drought.json | finish, validate-files |
| update-eu-fadn.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-fadn.py | eu-fadn.json | finish, validate-files |
| update-eu-farm-economics.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eu-farm-economics.py | eu-farm-economics.json | finish, validate-files |
| update-eu-fish-first-sales.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eu-fish-first-sales.py | eu-fish-first-sales.json | finish, validate-files |
| update-eu-fish-hicp.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-fish-hicp.py | eu-fish-hicp.json | finish, validate-files |
| update-eu-fish-retail-prices.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-fish-retail-prices.py | eu-fish-retail-prices.json | finish, validate-files |
| update-eu-food-monitor.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-food-monitor.py | eu-food-monitor-stats.json, eu-food-monitor/index.json | finish, validate-files |
| update-eu-fv-farm.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eu-fv-farm.py | eu-fv-farm.json | finish, validate-files |
| update-eu-gapfill.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-eu-gapfill.py | eu-gapfill-stats.json | finish, validate-files |
| update-eu-input-prices.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-input-prices.py | eu-input-prices.json | finish, validate-files |
| update-eu-land.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-land.py | eu-land/land.json | finish, validate-files |
| update-eu-more-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | bg-ghg-agri.json, ch-ghg-agri.json, cy-ghg-agri.json … | finish, validate-files |
| update-eu-nitrates.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-nitrates.py | eu-nitrates.json | finish, validate-files |
| update-eu-oilseeds-panel-prices.yml | a mano | semanal (3,5) | build-eu-oilseeds-panel-obs.py | - | price-engine, publish |
| update-eu-organic.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eu-organic.py | eu-organic-stats.json | finish, validate-files |
| update-eu-production.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eu-production.py | eu-production-stats.json | finish, validate-files |
| update-eu-region-climate.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-eu-region-climate.mjs | eu-region-climate.json | finish, validate-files |
| update-eu-regions-macro.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-eurostat-regions-macro.py | eu-regions-macro.json | finish, validate-files |
| update-eu-regions.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-eurostat-regions.py | eu-regions-at.json, eu-regions-be.json, eu-regions-bg.json … | finish, validate-files |
| update-eu-stocks.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eu-stocks.py | eu-stocks-stats.json | finish, validate-files |
| update-eu-sulphur.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-sulphur.py | eu-sulphur.json | finish, validate-files |
| update-eu-trade-extra.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-trade-extra.py | eu-extra-trade-stats.json | finish, validate-files |
| update-eu-trade.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-trade.py | eu-trade-products.json, eu-trade-stats.json | finish, validate-files |
| update-eu-vat.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-vat.py | eu-vat.json | finish, validate-files |
| update-eu-wood-prices.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eu-wood-prices.py | eu-wood-prices.json | finish, validate-files |
| update-eurostat-census.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eurostat-census.py | eurostat-census-stats.json | finish, validate-files |
| update-eurostat-depth.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-eurostat-depth.py | eurostat-depth-stats.json | finish, validate-files |
| update-eurostat-eu.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-eurostat-eu.py | eurostat-eu-stats.json, eurostat-eu2-stats.json, eurostat-eu3-stats.json … | finish, validate-files |
| update-eurostat-fish.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eurostat-fish.py | eurostat-fish-stats.json | finish, validate-files |
| update-eurostat-more.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eurostat-more.py | eurostat-more-stats.json | finish, validate-files |
| update-eurostat-structure.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eurostat-structure.py | eurostat-structure-stats.json | finish, validate-files |
| update-eurostat-structure2.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-eurostat-structure.py | eurostat-structure2-stats.json | finish, validate-files |
| update-eurostat.yml | a mano | mensual | qa-navigation.mjs, update-eurostat-indices.mjs | - | price-engine, publish |

## FR

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-fr-agreste-more.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-fr-agreste-more.py | france-agreste-more-stats.json, france-agreste-more/index.json | finish, validate-files |
| update-fr-bulconj.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-fr-bulconj.py | france-bulconj-stats.json, france-bulconj/index.json | finish, validate-files |
| update-fr-cereobs.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-fr-cereobs.py | france-cereobs.json | finish, validate-files |
| update-fr-comex.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-fr-comex.py | france-comex-stats.json, france-comex/index.json | finish, validate-files |
| update-fr-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | fr-ghg-agri.json | finish, validate-files |
| update-fr-gnr.yml | generado | semanal (1,3,5) | detect-revisions.py, gen-workflows.py, update-fr-gnr.py | fr-gnr.json | finish, validate-files |
| update-fr-infosrapides.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-fr-infosrapides.py | france-infosrapides-stats.json, france-infosrapides/index.json | finish, validate-files |
| update-fr-insee.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-fr-insee.py | france-insee-stats.json | finish, validate-files |
| update-fr-nitrates.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-fr-nitrates.py | fr-nitrates.json | finish, validate-files |
| update-fr-onde.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-fr-onde.py | fr-onde.json | finish, validate-files |
| update-fr-rica.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-fr-rica.py | france-rica-stats.json, france-rica/index.json | finish, validate-files |
| update-fr-saa.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-fr-saa.py | france-saa-stats.json, france-saa/index.json | finish, validate-files |
| update-fr-vigieau.yml | generado | semanal (1,3,5) | detect-revisions.py, gen-workflows.py, update-fr-vigieau.py | france-vigieau.json | finish, validate-files |

## IE

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-ie-cso.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-ie-cso.py | ie-cso-stats.json | finish, validate-files |
| update-ie-diesel.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-ie-diesel.py | ie-diesel.json | finish, validate-files |
| update-ie-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-ie-drought.py | ie-drought.json | finish, validate-files |
| update-ie-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | ie-ghg-agri.json | finish, validate-files |
| update-ie-nitrates.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-ie-nitrates.py | ie-nitrates.json | finish, validate-files |

## IT

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-it-fuel.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-it-fuel.py | it-fuel.json | finish, validate-files |
| update-it-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | it-ghg-agri.json | finish, validate-files |
| update-it-istat-2.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-it-istat-2.py | italy-istat/agritourism.json, italy-istat/comuni.json, italy-istat/crops.json … | finish, validate-files |
| update-it-istat.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-it-istat.py | italy-istat/fertilisers.json, italy-istat/herds.json, italy-istat/pesticides.json … | finish, validate-files |
| update-it-water-severity.yml | generado | semanal (1,4) | detect-revisions.py, gen-workflows.py, update-it-severity.py | it-water-severity.json | finish, validate-files |

## NL

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-nl-cbs-more.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-nl-cbs-more.py | netherlands-more-stats.json, netherlands-more/index.json | finish, validate-files |
| update-nl-cbs.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-nl-cbs.py | netherlands-farm.json | finish, validate-files |
| update-nl-diesel.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-nl-diesel.py | nl-diesel.json | finish, validate-files |
| update-nl-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-nl-drought.py | nl-drought.json | finish, validate-files |
| update-nl-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | nl-ghg-agri.json | finish, validate-files |
| update-nl-nitrates.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-nl-nitrates.py | nl-nitrates.json | finish, validate-files |
| update-nl-rvo.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-nl-rvo.py | netherlands-markets.json | finish, validate-files |

## Noticias y blog

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-news-translations.yml | a mano | varias veces al dia | translate_news.py | - | - |
| update-news.yml | a mano | varias veces al dia | update_news.py | news-status.json, news.json, views/news-feed.json … | finish, validate-files |
| update-weekly-blog.yml | a mano | 2 veces al dia | build-blog-editions.py, build-country-weeks.py, update-weekly-blog.py | blog, blog/countries/*/20*.json, blog/countries/index.json … | finish, validate-files |

## Otros

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| deploy-cloudflare.yml | a mano | varias veces al dia | - | - | - |
| e2e-full.yml | a mano | semanal (1) | e2e-variants.mjs | - | - |
| fetch-fao-areas.yml | a mano | manual / por evento | - | - | - |
| refresh-observatory.yml | a mano | manual / por evento | build-observatory.py, build-pipeline-status.py, build-readme-status.py | - | - |
| release-dispatch.yml | a mano | 2 veces al dia | release-dispatch.py | - | - |
| send-digest.yml | a mano | semanal (1) | build-digest.py, send-digest.py | - | - |
| sync-readme.yml | a mano | manual / por evento | build-docs.py, build-readme-status.py | - | - |
| update-baltics-national.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-np-baltic.py | baltics-national-stats.json | finish, validate-files |
| update-belgium.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-belgium.py | belgium-stats.json | finish, validate-files |
| update-climate.yml | a mano | semanal (2) | update-climate.mjs | climate-history.json, climate.json | finish, validate-files |
| update-country-macro.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-country-macro.py | country-macro.json | finish, validate-files |
| update-country-stats.yml | a mano | semanal (3) | detect-revisions.py, update-country-stats.py | country-stats.json | finish, publish, validate-files |
| update-cpi.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-cpi.py | country-macro.json, cpi.json | finish, validate-files |
| update-crop-insurance-ca.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-crop-insurance-ca.py | crop-insurance-ca.json | finish, validate-files |
| update-crop-insurance.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-crop-insurance.py | crop-insurance.json | finish, validate-files |
| update-crop-progress.yml | a mano | 2 veces/semana | update-crop-progress.mjs | crop-progress.json | finish, validate-files |
| update-czechia-csu.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-cz-csu.py | czechia-csu-stats.json | finish, validate-files |
| update-defra-milk.yml | a mano | semanal (5) | qa-site.mjs, update-defra-api-uk.py, update-defra-milk-uk.py | - | price-engine, publish |
| update-denmark-depth.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-denmark-depth.py | denmark-depth.json | finish, validate-files |
| update-denmark.yml | a mano | semanal (2,5) | update-dst-denmark.py | denmark-prices.json | finish, validate-files |
| update-drought.yml | a mano | 2 veces/semana | update-drought.mjs | drought.json | finish, validate-files |
| update-eambrosia.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-eambrosia.py | gi/index.json | finish, validate-files |
| update-el-elstat.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-el-elstat.py | el-elstat/accounts.json, el-elstat/prices.json | finish, validate-files |
| update-el-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | el-ghg-agri.json | finish, validate-files |
| update-embalses.yml | generado | semanal (3,4) | detect-revisions.py, gen-workflows.py, update-embalses.py | spain-reservoirs-points.json, spain-reservoirs.json | finish, validate-files |
| update-energy-markets.yml | a mano | semanal (3,5) | update-eia-energy-markets.mjs, update-worldbank-gas-eu.py | - | finish, price-engine, publish |
| update-energy.yml | a mano | semanal (5) | sync-diesel-trust.mjs, update-ec-diesel-eu.py, update-eia-diesel-us.mjs | - | price-engine, publish |
| update-export-sales.yml | a mano | 2 veces/semana | update-export-sales.mjs | export-sales.json | finish, validate-files |
| update-finland-fmi.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-fi-fmi.py | finland-fmi-stats.json | finish, validate-files |
| update-finland-luke.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-fi-luke.py | finland-luke-stats.json | finish, validate-files |
| update-finland-statfin.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-fi-statfin.py | finland-statfin-stats.json | finish, validate-files |
| update-france-hicp.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-france-hicp.py | france-hicp-stats.json | finish, validate-files |
| update-france-organic.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-france-organic.py | france-organic-stats.json | finish, validate-files |
| update-france-rnm-potato.yml | generado | semanal (4,5) | detect-revisions.py, gen-workflows.py, update-france-rnm-potato.py | france-rnm-stats.json | finish, validate-files |
| update-france.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-france.py | france-stats.json | finish, validate-files |
| update-fx-history.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-fx-history.py | fx-history.json | finish, validate-files |
| update-fx.yml | a mano | semanal (1-5) | update-fx.mjs | - | - |
| update-gats.yml | a mano | diaria | update-gats.mjs | gats-log.txt, gats.json | validate-files |
| update-germany-extra.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-germany-destatis-extra.py | germany-extra-stats.json | finish, validate-files |
| update-germany-livestock.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-germany-livestock.py | germany-livestock.json | finish, validate-files |
| update-germany.yml | generado | semanal (1,4) | detect-revisions.py, gen-workflows.py, update-germany.py | germany-agri.json, germany-stats.json | finish, validate-files |
| update-hr-diesel.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-hr-diesel.py | hr-diesel.json | finish, validate-files |
| update-hr-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-hr-drought.py | hr-drought.json | finish, validate-files |
| update-hr-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | hr-ghg-agri.json | finish, validate-files |
| update-hu-ksh.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-hu-ksh.py | hu-ksh-stats.json | finish, validate-files |
| update-inao-geo.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-inao-geo.py | gi/FR-geo.json, gi/FR-inao.json | finish, validate-files |
| update-interest-rates.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-interest-rates.py | interest-rates-stats.json | finish, validate-files |
| update-italy-eurostat.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-italy-eurostat.py | italy-eurostat-stats.json | finish, validate-files |
| update-land-fr-it.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-land-fr-it.py | france-land/land.json, italy-land/land.json | finish, validate-files |
| update-land-pl.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-land-pl.py | poland-land/land.json | finish, validate-files |
| update-mars-us.yml | a mano | 2 veces/semana | update-ams-nfdm.mjs, update-mars-us.mjs | - | price-engine, publish |
| update-mb-cattle.yml | generado | 2 veces/semana | detect-revisions.py, gen-workflows.py, update-mb-cattle.py | mb-markets/cattle.json | finish, validate-files |
| update-mb-smallstock.yml | generado | 3 veces/semana | detect-revisions.py, gen-workflows.py, update-mb-smallstock.py | mb-markets/hogs.json, mb-markets/sheep-goat.json | finish, validate-files |
| update-partner-tariffs.yml | a mano | mensual | detect-revisions.py, update-partner-tariffs.py | tariffs-ca.json, tariffs-eu.json, tariffs-mx.json | finish, publish, validate-files |
| update-poland-eurostat.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-poland-eurostat.py | poland-eurostat-stats.json | finish, validate-files |
| update-poland.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-poland.py | poland-farm-shop.json, poland-stats.json | finish, validate-files |
| update-portugal-eurostat.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-portugal-eurostat.py | portugal-eurostat-stats.json | finish, validate-files |
| update-portugal.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-portugal.py | portugal-stats.json | finish, validate-files |
| update-recan.yml | a mano | semanal (4) | update-recan.py | recan.json | finish, validate-files |
| update-regions-pl.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-poland-regions.py | poland-regions/regions.json | finish, validate-files |
| update-rivers.yml | generado | varias veces al dia | detect-revisions.py, gen-workflows.py, update-rivers.py | rivers-be.json, rivers-ca.json, rivers-fr.json … | finish, validate-files |
| update-spain-balances.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-balances.py | spain-balances/cereals.json | finish, validate-files |
| update-spain-crops.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-crops.py | spain-crops/index.json | finish, validate-files |
| update-spain-hicp.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-spain-hicp.py | spain-hicp-stats.json | finish, validate-files |
| update-spain-land.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-spain-land.py | spain-land/land.json | finish, validate-files |
| update-spain-livestock.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-livestock.py | spain-livestock/index.json | finish, validate-files |
| update-spain-milk.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-milk.py | spain-milk/infolac.json | finish, validate-files |
| update-spain-oilseeds.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-oilseeds.py | spain-oilseeds-stats.json | finish, validate-files |
| update-spain-olive.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-olive.py | spain-balances/olive.json | finish, validate-files |
| update-spain-siega.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-spain-siega.py | spain-siega-stats.json | finish, validate-files |
| update-spain-slaughter-census.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-slaughter-census.py | spain-slaughter/census.json | finish, validate-files |
| update-spain-slaughter.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-slaughter.py | spain-slaughter/slaughter.json | finish, validate-files |
| update-spain-wine-balance-historic.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-wine-balance-historic.py | spain-wine/balance-historic.json | finish, validate-files |
| update-spain-wine-monthly.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-wine-monthly.py | spain-wine/monthly.json | finish, validate-files |
| update-spain-wine.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-spain-wine.py | spain-wine/infovi.json | finish, validate-files |
| update-spain.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-mapa-spain.py | spain-stats.json | finish, validate-files |
| update-sweden-scb.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-se-scb.py | sweden-scb-stats.json | finish, validate-files |
| update-sweden-sjv.yml | generado | semanal (1,4) | detect-revisions.py, gen-workflows.py, update-se-sjv.py | sweden-sjv-stats.json | finish, validate-files |
| update-switzerland-bfs.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-ch-bfs.py | switzerland-bfs-stats.json | finish, validate-files |
| update-switzerland-foag.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-ch-foag.py | ch-chain.json, switzerland-foag-stats.json | finish, validate-files |
| update-switzerland-meteo.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-ch-meteo.py | switzerland-meteo-stats.json | finish, validate-files |
| update-trade-partners.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-trade-partners.py | ca-trade-products.json, cl-trade-products.json, uk-trade-products.json | finish, validate-files |
| update-uruguay.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-uruguay.py | uruguay-departments.json, uruguay-stats.json, uy-ghg-agri.json | finish, validate-files |
| update-usda-calendar.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-usda-calendar.py | usda-calendar.json | finish, validate-files |
| update-usda-psd.yml | a mano | mensual | update-usda-psd.mjs | supply-demand-map.json, supply-demand.json, world-production.json | finish, validate-files |
| update-wb-panel-prices.yml | a mano | mensual | build-wb-panel-obs.py | - | price-engine, publish |
| update-wine-prices.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-wine-prices.py | wine-prices.json | finish, validate-files |
| update-wood-prices-de.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-wood-prices-de.py | wood-prices-de.json | finish, validate-files |
| update-wood-prices-na.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-wood-prices-na.py | wood-prices-na.json | finish, validate-files |
| update-wood-removals.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-wood-removals.py | wood-removals.json | finish, validate-files |
| update-worldbank-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-worldbank-agri.py | worldbank-agri.json | finish, validate-files |
| update-worldbank-fertilizers.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-worldbank-fertilizers.py | worldbank-fertilizers.json | finish, validate-files |
| update-worldbank-urea.yml | a mano | diaria | qa-navigation.mjs, update-worldbank-urea-eu.py | - | price-engine, publish |
| watchdog-cancelled-runs.yml | a mano | varias veces al dia | rerun-cancelled.py | - | - |

## PL

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-pl-diesel.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-pl-diesel.py | pl-diesel.json | finish, validate-files |
| update-pl-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | pl-ghg-agri.json | finish, validate-files |
| update-pl-hydro-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-pl-hydro-drought.py | pl-hydro-drought.json | finish, validate-files |
| update-pl-zsrir.yml | generado | semanal (4,5) | detect-revisions.py, gen-workflows.py, update-pl-zsrir.py | poland-zsrir-stats.json, poland-zsrir/index.json | finish, validate-files |

## PT

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-pt-diesel.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-pt-diesel.py | pt-diesel.json | finish, validate-files |
| update-pt-drought.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-pt-drought.py | pt-drought.json | finish, validate-files |
| update-pt-ghg-agri.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-eu-ghg-agri.py | pt-ghg-agri.json | finish, validate-files |
| update-pt-ine-more.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-portugal-more.py | portugal-more-stats.json, portugal-more/index.json | finish, validate-files |
| update-pt-nitrates.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-pt-nitrates.py | pt-nitrates.json | finish, validate-files |

## UK

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-uk-climate.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-uk-climate.py | uk-climate.json | finish, validate-files |
| update-uk-defra.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-uk-defra.py | uk-stats.json | finish, validate-files |
| update-uk-farm-accounts.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-uk-farm-accounts.py | uk-farm-accounts.json | finish, validate-files |
| update-uk-farmers-age.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-uk-farmers-age.py | uk-farmers-age.json | finish, validate-files |
| update-uk-fuel.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-uk-fuel.py | uk-fuel-stats.json | finish, validate-files |
| update-uk-fv-wholesale.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-uk-fv-wholesale.py | uk-fv-stats.json | finish, validate-files |
| update-uk-ni-market.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-uk-ni-market.py | uk-ni-market-stats.json | finish, validate-files |
| update-uk-panel-prices.yml | a mano | semanal (2,5) | build-uk-panel-obs.py | - | price-engine, publish |
| update-uk-regions-macro.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-uk-regions-macro.py | uk-regions-macro.json | finish, validate-files |
| update-uk-scotland.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-uk-scotland.py | uk-scotland-stats.json | finish, validate-files |
| update-uk-structure.yml | generado | semanal (1) | detect-revisions.py, gen-workflows.py, update-uk-structure.py | uk-structure.json | finish, validate-files |
| update-uk-tiff-regions.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-uk-tiff-regions.py | uk-tiff-regions.json | finish, validate-files |
| update-uk-trade.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-uk-trade.py | uk-trade-stats.json | finish, validate-files |

## US

| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |
|---|---|---|---|---|---|
| update-ams-auctions.yml | a mano | semanal (6) | build-search-index.mjs, update-ams.mjs | search-index.json | finish, validate-files |
| update-ams.yml | a mano | 2 veces/semana | build-ams-daily.py, build-search-index.mjs, build-us-fertilizers.py | ams-grain-daily.json, search-index.json, us-fertilizers.json | finish, publish, validate-files |
| update-ers-baseline.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-ers-baseline.py | us-markets/baseline-tables.json, us-markets/baseline.json | finish, validate-files |
| update-ers.yml | a mano | semanal (1) | update-ers.mjs | ers.json | finish, validate-files |
| update-nass-data.yml | a mano | semanal (1) | bridge-panel-stats.py, update-nass-us.mjs | - | price-engine, publish |
| update-nass.yml | a mano | semanal (1) | update-nass.mjs | nass-crops.json, nass-livestock.json, nass-prices.json … | finish, validate-files |
| update-us-arcplc.yml | generado | mensual | detect-revisions.py, gen-workflows.py, source-status.py | us-arcplc/index.json, us-arcplc/national.json | finish, publish, validate-files |
| update-us-cash-bids.yml | generado | 2 veces/semana | detect-revisions.py, gen-workflows.py, update-us-cash-bids.py | us-cash-bids/ingestion-status.json, us-cash-bids/manifest.json, us-cash-bids/reports.json … | finish, validate-files |
| update-us-cash-receipts.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-us-cash-receipts.py | us-cash-receipts.json | finish, validate-files |
| update-us-climate.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-climate.py | us-climate-stats.json | finish, validate-files |
| update-us-county-yields.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-county-yields.py | us-county/status.json | finish, validate-files |
| update-us-crop-progress-states.yml | a mano | 2 veces/semana | update-us-crop-progress-states.mjs | us-crop-progress/*.json | finish, validate-files |
| update-us-dairy.yml | generado | 2 veces/semana | detect-revisions.py, gen-workflows.py, update-us-dairy.py | us-dairy.json | finish, validate-files |
| update-us-ers-bioenergy.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-us-ers-bioenergy.py | us-ers-bioenergy-stats.json | finish, validate-files |
| update-us-ers-fertilizer.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-us-ers-fertilizer.py | us-ers-fertilizer-stats.json | finish, validate-files |
| update-us-ers-food.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-us-ers-food.py | us-ers-food-stats.json | finish, validate-files |
| update-us-ers-livestock.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-us-ers-livestock.py | us-ers-livestock-stats.json | finish, validate-files |
| update-us-ers-productivity.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-us-ers-productivity.py | us-ers-productivity-stats.json | finish, validate-files |
| update-us-ers.yml | generado | semanal (3) | detect-revisions.py, gen-workflows.py, update-us-ers.py | us-ers-stats.json, us-ttb-stats.json | finish, validate-files |
| update-us-fed.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-fed.py | us-fed-stats.json | finish, validate-files |
| update-us-fertilizer-imports.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-fertilizer-imports.py | us-fertilizer-imports.json | finish, validate-files |
| update-us-fmmo.yml | generado | semanal (2) | detect-revisions.py, gen-workflows.py, update-us-fmmo.py | us-fmmo-stats.json | finish, validate-files |
| update-us-fsa-rates.yml | generado | manual / por evento | detect-revisions.py, gen-workflows.py, update-us-fsa-rates.py | us-fsa-rates-stats.json | finish, validate-files |
| update-us-kcfed.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-kc-fed-ag-credit.py | us-kcfed-stats.json | finish, validate-files |
| update-us-lamb.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-us-lamb.py | us-lamb.json | finish, validate-files |
| update-us-local-markets.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-us-local-markets.py | us-local/status.json | finish, validate-files |
| update-us-markets.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-us-markets.py | us-markets/cot.json, us-markets/ethanol.json, us-markets/fuel.json … | finish, validate-files |
| update-us-nass-cdl.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-us-nass-cdl.py | us-nass-cdl-cache.json, us-nass-cdl-stats.json | finish, validate-files |
| update-us-nass-extra.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-nass-extra.py | us-nass-extra-stats.json | finish, validate-files |
| update-us-nass-processing.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-nass-processing.py | us-nass-processing-ledger.json, us-nass-processing-stats.json | finish, validate-files |
| update-us-noaa-fish.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-noaa-fish.py | us-noaa-fish-stats.json | finish, validate-files |
| update-us-panel-prices.yml | a mano | semanal (1-5) | build-us-index-obs.py, build-us-panel-obs.py | - | price-engine, publish |
| update-us-ppi.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-us-ppi.py | us-ppi.json | finish, validate-files |
| update-us-reservoirs.yml | generado | semanal (1,4) | detect-revisions.py, gen-workflows.py, update-us-reservoirs.py | us-reservoirs-normals.json, us-reservoirs.json | finish, validate-files |
| update-us-rivers.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-us-rivers.py | us-markets/rivers.json | finish, validate-files |
| update-us-sap.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-us-sap.py | us-markets/sap-forecasts.json | finish, validate-files |
| update-us-slaughter.yml | generado | semanal (1-5) | detect-revisions.py, gen-workflows.py, update-us-slaughter.py | us-markets/slaughter.json | finish, validate-files |
| update-us-snotel.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-snotel.py | us-snotel-stats.json | finish, validate-files |
| update-us-states-macro.yml | generado | semanal (4) | detect-revisions.py, gen-workflows.py, update-us-states-macro.py | us-states-macro.json | finish, validate-files |
| update-us-states.yml | generado | semanal (5) | detect-revisions.py, gen-workflows.py, update-us-states.py | us-states/index.json | finish, validate-files |
| update-us-stats.yml | generado | diaria | detect-revisions.py, gen-workflows.py, update-us-stats.py | us-stats.json | finish, validate-files |
| update-us-sulphur.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-sulphur.py | us-sulphur.json | finish, validate-files |
| update-us-tariffs.yml | generado | semanal (2,5) | detect-revisions.py, gen-workflows.py, update-us-tariffs.py | us-tariffs.json | finish, validate-files |
| update-us-wasde.yml | generado | mensual | detect-revisions.py, gen-workflows.py, update-us-wasde.py | us-markets/wasde-ledger.json, us-markets/wasde.json | finish, validate-files |
