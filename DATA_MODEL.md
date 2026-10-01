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

## Ficha de producto 3.0 (`data/product-metadata.json` v2, `data/products/<id>.json`)
Metadatos (a mano): por producto, nombre en 4 idiomas, grupo, `kind`, `instruments` (region+producto de `prices/latest`), `indices`, `psd`, `hs`, `related` (solo relaciones economicas justificables: `input|feed`, `why`) y `compare`.
Bloques precalculados (`build-product-profiles.py`, esquema `product-profile`): `trade` (exportadores/importadores top 8, cuota sobre el total PSD, `top3Share`, `hhiLowerBound` = cota inferior porque los paises listados no suman 100 %), `supplyDemand` (3 ultimas campanas de EE. UU./UE/mundo; `stockToUse` = existencias finales / consumo, calculado) y `tariffs` (resumen por partida HS en US/EU/CA/MX con la fuente de cada una). Si un producto no tiene PSD o HS, el bloque es `null` y la pagina lo dice.
La pagina (`js/producto-terminal.js`) carga cada bloque al acercarse a la vista y descarga el historico solo de ese producto; el detalle antiguo de EE. UU. (USDA/ERS/NASS, varios MB) solo a peticion.

## Comparador (`data/product-compare.json`)
Por producto y pais: unidad y moneda ORIGINALES, `kg` por unidad de precio, puntos mensuales (`aggregation`: media del mes de la frecuencia original), `latest`, `comp` (comparabilidad), `sourceId`, `fs`. La normalizacion (€/t, USD/t, indice 100) se calcula en el navegador con el Unit Engine. Los productos y series configuradas estan en `data/product-metadata.json`.

## Relaciones entre mercados (`data/relationships.json`, `relaciones.html`)
Cross-Market Intelligence 2.0, generado por `scripts/build-relationships.py` con el motor `scripts/relationships_engine.py` (mismas funciones que usa el test semantico para recalcular desde el historico). **Solo estadistica descriptiva**: nunca predice ni prueba causas.
Catalogo cerrado de familias economicamente justificables (fertilizante→cereal, gas→fertilizante, energia→cereal/ganaderia, pienso→leche/vacuno, indices Eurostat y DEFRA); no se buscan pares al azar. Por relacion: `input`/`market` (clave `P/<producto>/<region>`, fuente, unidad, moneda), `channel`, `stat` (`correlation` de Pearson de cambios periodo a periodo, `direction`, `strength`, `lag` elegido entre `lagProfile` —el de mayor |r| con n≥minimo, **optimista** y declarado—, `n`, `periodStart/End`, `coverage`, `signStability` en ventanas rodantes, `recentCorrelation`, `currencyTreatment` original|EUR via BCE), `status` (OBSERVED_RELATIONSHIP / WEAK_OR_UNSTABLE / INSUFFICIENT_DATA), `confidence` (HIGH/MEDIUM/LOW sobre la estabilidad de la asociacion, no sobre la hipotesis), `last` (ultimo movimiento de entrada y mercado), `freshness` de ambas series y `explanation` determinista en 4 idiomas. La hipotesis economica vive aparte en `families.*.hypothesis` (texto escrito a mano, "no demostrada").
Contrato: `schemas/relationships.schema.json` + test semantico `relationships` (status/strength/direction/confianza siguen las reglas, el rezago elegido esta en `lagProfile` y es el de mayor |r|, la explicacion cita n y r y declara que no es prediccion, y recalcula r/lag/n desde `prices/history`) + 7 casos negativos en `scripts/test-contracts.py`. La ficha de producto muestra un resumen en su bloque «Relaciones observadas» y enlaza a `relaciones.html?id=` / `?p=`.

## Observatorio de datos (`data/observatory.json`, `observatorio.html`)
Generado por `scripts/build-observatory.py` tras el brief diario. Todo se DERIVA de ficheros ya validados (`prices/latest` + `history`, `freshness`, `catalog/manifest`, `revisions`, `data-anomalies`, `data-quality`, `pipeline-status`, `daily-brief`); no inventa nada y las ventanas sin dato comparable quedan vacias y se dicen.
- `observations[]` (capa de precios, 81 series): `type` PRICE|INPUT, `observationDate`, `publicationDate` (`pubKnown`=false si la fuente no la publica: se muestra «recuperada»), `firstSeen` (primer dia en que el pipeline vio esa fecha de observacion; en la primera ejecucion se usa la de publicacion/recuperacion solo si el dato esta al dia) e `isNew` (firstSeen ≤ `newDays`=7), `freshness`/`ageDays`/`expectedNext` (Freshness Engine), `moves` d1/d7/d30 (ultimo punto frente al anterior a 1–3 / 5–10 / 25–40 dias, moneda y unidad originales; hoy ninguna serie de la capa es diaria, d1 queda vacia).
- `revisions`, `freshness` (capa de precios y catalogo completo por fuente), `upcoming` (observaciones ESPERADAS segun la politica de frescura, **no** un calendario oficial) y proximas ejecuciones de pipelines, `coverage` (series, por pais y por fuente, `snapshots` diarios acumulados (max 60) y `changes` entre las dos ultimas), `quality` (anomalias del registro + resumen de validacion) y `pipelines` (resumen y los que requieren atencion).
Contrato: `schemas/observatory.schema.json` + test semantico `observatory` (claves unicas y ordenadas, totales de frescura, resumen de pipelines y anomalias iguales a sus fuentes, `isNew` sigue la regla, ventanas de dias, `coverage.changes` = diferencia real entre instantaneas, y recalculo de movimientos d30 desde `prices/history`) + 7 casos negativos.
