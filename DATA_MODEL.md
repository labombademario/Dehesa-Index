# Modelo de datos

Los contratos viven en `schemas/*.schema.json` (subconjunto de JSON Schema: `type, enum, items, min/maxItems, min/maxLength, minimum, maximum, minProperties, pattern, properties, required, additionalSchema`; `validate-data.py` rechaza esquemas con otras palabras clave para que no se ignoren en silencio) y `schemas/registry.json` los asigna a ficheros, globs y tests semanticos (`scripts/contract_tests.py`).

## Observacion de precio (`data/latest.json`, `data/history.json`, `data/prices/**`)
`id` (`di_<categoria>_<producto>_<region>:<fecha>`), `product`, `region` (`us|eu|ca|uk`), `sourceId`, `observationDate`, `publicationDate`, `snapshotDate`, `value`, `currency` (`INDEX` para indices), `unit`, `frequency`, `status` (`verified|pending`), `comparability` (`exact|directional|not_comparable`), `changePct`, `methodology`. Un indice nunca se trata como precio; la cotizacion nunca se convierte sin base de cotizacion y tipo de cambio.

## Serie del catalogo (`data/catalog/<CC>.json`)
`id, label, unit, freq, group, latestPeriod, latest, n, tier (1-4), file, source, sourceId, licenseId, fs`. Los puntos estan en `data/series/<CC>/<grupo>.json`. `fs` es el estado de frescura (`LIVE…PENDING`) calculado por el Freshness Engine.

`catalog/manifest.json` aporta `entities` y `entityType` (`country | aggregate | region`: 31 paises, 7 agregados, 3 regiones — no se llama "pais" a un agregado), `provenance` (nombre, URL oficial, licencia y atribucion por fuente; transformacion y agregacion por tipo de dato), `seriesTotal` y `tiers`. `publicationDate` se omite cuando la fuente no la publica: no se inventa.

## Frescura
Politica en `data/freshness-policy.json`: periodo y rezago por frecuencia y fuente, con `evidence` obligatoria (rezago sin evidencia = error). Estado = f(fecha del ultimo dato, frecuencia, fuente, hoy). `STALE` real ≠ `EXPECTED_DELAY` (publicacion oficial con retraso conocido).

## Anomalias (`data/data-anomalies.json`)
`KNOWN_VERIFIED_ANOMALY` exige `evidence`, `verifiedAt`, `sourceUrl`; `UNEXPLAINED_ANOMALY` exige `hypothesis` y `nextAction` y sigue contando como aviso. Un salto sin registrar es un aviso; una anomalia registrada que ya no se detecta tambien.

## Licencias (`data/license-registry.json`)
Por fuente: `status` (`VERIFIED|PENDING|RESTRICTED|BLOCKED`), `licenseId`, `commercialUse`, `derivatives`, `attributionRequired/Text`, `verifiedAt`, `evidence`, `used`. Ver `DATA_SOURCES.md`.

## Comparador (`data/product-compare.json`)
Por producto y pais: unidad y moneda ORIGINALES, `kg` por unidad de precio, puntos mensuales (`aggregation`: media del mes de la frecuencia original), `latest`, `comp` (comparabilidad), `sourceId`, `fs`. La normalizacion (€/t, USD/t, indice 100) se calcula en el navegador con el Unit Engine. Los productos y series configuradas estan en `data/product-metadata.json`.
