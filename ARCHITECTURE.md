# Arquitectura

Dehesa Index es un sitio **estatico** (HTML + CSS + JavaScript ES5 sin paso de build) alimentado por pipelines programados de GitHub Actions que escriben JSON en `data/` y hacen commit a `main`. No hay servidor ni base de datos: el navegador lee JSON estatico.

```
fuentes oficiales ──► scripts/update-*.py|mjs ──► data/<fuente>.json ──┐
                                                                        ▼
                    validacion (schemas/ + contract_tests.py) ──► derivados (catalogo, precios ligeros, vistas, frescura, brief, comparador)
                                                                        ▼
                                               data/**  ──► js/*.js (clientes) ──► *.html
```

## Capas de datos
| Capa | Ficheros | Quien la escribe | Quien la lee |
|---|---|---|---|
| Fuentes crudas normalizadas | `data/*-stats.json`, `data/eu/**`, `data/ams/**`, `data/ers.json`... | `scripts/update-*` (un workflow por fuente) | scripts de derivados; paginas concretas |
| **Capa unificada de series** | `data/catalog/manifest.json`, `catalog/<CC>.json` (metadatos + `sourceId`, `licenseId`, `fs`), `series/<CC>/<grupo>.json` (puntos) | `scripts/build-data-catalog.py` | `js/series-store.js` (`DISeries`), `js/country-data.js`, `js/perfil-pais.js` |
| **Capa ligera de precios** | `data/prices/manifest.json`, `latest/<region>.json`, `history/<region>/<producto>.json` (perezoso), `intelligence/<region>.json` | `scripts/build-price-views.py` (accion `price-engine`) | `js/prices-store.js` (`DIPrices`) |
| Vistas de entrada | `data/views/{home-summary,eu-preview,news-index,news-feed}.json` | `scripts/build-views.py`, `scripts/update_news.py` | Home, Precios, Noticias |
| Frescura | `data/freshness-policy.json`, `data/freshness.json` | `scripts/build-freshness.py` (motor `scripts/freshness.py`) | `js/freshness.js` (mismo motor, test de paridad) |
| Derivados de producto | `data/product-compare.json`, `data/daily-brief.json`, `data/watch-index.json`, `data/series-registry.json`, `data/revisions.json` | `build-product-compare.py`, `build-daily-brief.py`, `build-watch-index.py`, `build-series-registry.py`, `detect-revisions.py` | comparador, brief, lista de seguimiento |
| Fichas de producto | `data/products/<id>.json` | `scripts/build-product-profiles.py` (en `update-pipeline-status.yml`) | `js/producto-terminal.js` (bloques perezosos) |
| Gobierno | `data/license-registry.json`, `data/data-anomalies.json`, `data/product-metadata.json`, `data/pipeline-status.json`, `data/data-quality.json` | curados a mano / `build-pipeline-status.py` | CI y paginas de estado |

La **Home y Precios no descargan ficheros pesados** (`latest.json`, `history.json`, `news-index.js`): usan `data/views/*` y `data/prices/*`. Lo vigila `scripts/page-budget.json` con navegador real.

## Pipelines
- Los workflows `update-*.yml` se generan desde `sources.yml` con `scripts/gen-workflows.py` (CI comprueba que estan sincronizados) o son manuales con acciones compuestas compartidas en `.github/actions/` (`publish`, `validate-files`, `finish`, `price-engine`).
- **Un solo escritor a la vez**: todos comparten el grupo de concurrencia `dehesa-data-writes` (`cancel-in-progress: false`). Consecuencia conocida: GitHub conserva como mucho una ejecucion en cola por grupo; si varias se disparan a la vez, las intermedias se cancelan. Por eso los cron estan espaciados.
- **Falla cerrado**: nada de `|| true`; los datos invalidos se descartan y la ejecucion queda en rojo (`finish`); los derivados (`update-pipeline-status.yml`) solo se publican si todo se construye y valida (`validate-data.py --derived`, `check-catalog.py --strict`, `check-licenses.py`). `scripts/check-workflows.py` lo hace cumplir.
- Tras cualquier cambio en `js/`, `css/` o `*.html`: `node scripts/stamp-sw.mjs` (version del service worker por hash; CI lo comprueba).

## Calidad (todo en `.github/workflows/quality.yml`)
Sintaxis JS · workflows sincronizados e higienicos · contratos de datos (`validate-data.py --all`, 50 esquemas) y tests semanticos · tests negativos (`test-contracts.py`: los datos corrompidos DEBEN rechazarse) · integridad del catalogo · gate de licencias · SEO · Unit Engine y Freshness Engine (paridad JS/Python) · presupuesto de rendimiento y de crecimiento del repo · **E2E con navegador real + axe-core (escritorio y movil)**.

## Motores compartidos
- **Freshness Engine** (`js/freshness.js` + `scripts/freshness.py` + `data/freshness-policy.json`): estados `LIVE, FRESH, EXPECTED_DELAY, DELAYED, STALE, PENDING` segun la frecuencia y el rezago *documentado* de cada fuente.
- **Unit Engine** (`js/unit-engine.js`): conversiones de moneda (BCE mensual, exacto → mes previo ≤ 2 meses → `null`, nunca silencioso) y de unidad (bushel solo con cultivo, ha↔acre). Siempre se muestra el valor original.
- **Daily Brief** (`scripts/lib_index.py`): clasifica cada workflow (`WORKFLOW_KINDS`) y falla si hay uno sin clasificar.

## Convenciones que no se negocian
No inventar datos ni rellenar huecos · no asumir licencias (`PENDING` antes que certeza inventada) · correlacion ≠ prediccion · cada dato lleva fuente, fecha y frescura · el JS es ES5 (sin transpilar) · cambios reversibles y commits pequenos.
