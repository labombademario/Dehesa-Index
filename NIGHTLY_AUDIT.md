# NIGHTLY_AUDIT — fases 1 a 10 y fase de correccion (1-oct-2026)

Auditoria de cierre del plan nocturno **y de la fase de correccion/reduccion de deuda posterior**. Reglas que han regido todo el trabajo: no inventar datos, no rellenar huecos, no asumir licencias, no convertir correlaciones en predicciones y no sacrificar trazabilidad. Nada de lo que sigue esconde un error para dejar un test en verde.

## 0. Estado actual tras la fase de correccion (lo que cambia respecto al informe nocturno)
| Tema | Antes | Ahora |
|---|---|---|
| License Gate | `check-licenses.py` sin `--strict`; 18 fuentes PENDING en uso | `--strict` activo en Quality y en el pipeline; **10 PENDING en uso** (8 resueltas con evidencia), declaradas en `pendingBaseline` con `nextAction`; ninguna nueva puede publicarse. 26 VERIFIED, 12 PENDING, 4 RESTRICTED, 3 BLOCKED |
| Frescura | 1.558 STALE | **575 STALE (deberian seguir publicandose) + 983 HISTORICAL**, 0 DISCONTINUED declaradas; `HISTORICAL`/`DISCONTINUED` propagados a motor (JS = Python), Coverage Score, Observatorio, Watchlist, Comparador, Catalogo y Data Health |
| `canonicalSeriesId` | 23 colisiones | **0** (v2: pais, grupo, frecuencia, unidad, conceptos + numeros ordenados + calificadores); test de unicidad salvo equivalencias declaradas (0 declaradas); migracion v1 -> v2 para no romper watchlists |
| Ficha 3.0 | trigo y 13 mas; pollo 4.364 KB, azucar 4.309 KB | **17 de 17 productos en 3.0**; pollo 870 KB / 250 KB gz, azucar 695 KB / 222 KB gz |
| Identidad del instrumento | etiqueta generica ("Soja") | producto/forma/calidad/etapa/mercado visibles en ficha, comparador y Observatorio; grano y harina nunca se restan; `unspecified` cuando la fuente no lo dice (`data/instrument-identity.json`, 55 instrumentos) |
| Catalogo | 2.890 KB / 330 KB gz / **80 ficheros** al buscar | **1.155 KB / 208 KB gz / 2 ficheros** (manifiesto + `catalog/series-index.json`); el catalogo del pais y el shard solo se bajan al abrir una serie; presupuesto: sin `catalog/<CC>.json`, `catalog/eu/` ni `series/` en la carga |
| Observatorio movil | ~47 tarjetas, pagina de ~19.000 px | 20 iniciales + "Mostrar 20 mas" por seccion; los filtros se aplican a todo el conjunto antes de paginar |
| Coverage Gap | 2.423 MISSING tratados como huecos | `confidence` por celda; **34 MISSING con confianza alta**, 1.424 media, 954 baja; solo los de confianza alta priorizan fuentes; +5 celdas `AVAILABLE_OUTSIDE_CATALOG` (NASS cultivos/ganado/precios pagados y AMS granos, leidos de los ficheros reales) |
| Anomalias | 3 UNEXPLAINED | **3 UNEXPLAINED, pendientes de contraste con la fuente primaria** (ver 7.1): no se han promovido sin evidencia |
| E2E | solo producto/regla/unidad por defecto | `scripts/e2e-variants.mjs`: smoke en cada push y suite completa semanal (47 casos) |
| Pipelines | 43 con 1 en error (Canada) | **43 OK** (`pipeline-status.json`); Canada resuelto |

Commits de la fase: `f7ea719` (P0 License Gate), `4d45d1c` (frescura HISTORICAL + canonicalSeriesId v2), `50cecc4` (3.0 pollo/azucar + identidad), `ffc8b49` (catalogo lazy), `25af219` (verificador de anomalias), `7227808` (Observatorio), `93d0cb9` (Coverage Gap + fix `build-freshness`), `ed3e72b` (E2E de variantes).

### Payload antes / despues de la fase de correccion (carga inicial real, `measure-pages.mjs`)
| Pagina | Antes (`108d683`) | Ahora |
|---|---|---|
| `/catalogo.html` (busqueda global) | 2.890 KB raw / 330 KB gz, 80 ficheros | **1.155 KB / 208 KB gz, 2 ficheros** (datos 895 KB) |
| `/producto.html?p=pollo` | 4.363 KB / 943 KB gz | **870 KB / 250 KB gz** |
| `/producto.html?p=azucar` | 4.309 KB / 936 KB gz | **695 KB / 222 KB gz** |
| `/producto.html?p=trigo` (referencia) | 812 KB / 243 KB gz | 863 KB / 253 KB gz (identidad visible: +41 KB de `instrument-identity.json`) |
Todas las fichas 3.0 recorridas enteras (con scroll) quedan por debajo de 1 MB crudo (maximo 738 KB).

### Incidencia detectada y corregida en esta fase
El indice global del catalogo (`catalog/series-index.json`) rompia `build-freshness.py` (que recorre `catalog/*.json` esperando la clave `series`): habria puesto en rojo `update-pipeline-status`. Corregido en `93d0cb9`; Quality ahora ejecuta la cadena completa de builders derivados para que un fallo asi no llegue al pipeline.

## 1. Estado
- **HEAD**: ultimo commit de codigo `ed3e72b` (este informe va en el commit siguiente) en `main`, arbol limpio. Los workflows nuevos (`verify-anomalies.yml`, `e2e-full.yml`) y la cadena de builders de Quality **no se han podido ejecutar en GitHub Actions desde aqui** (no hay `gh`): su resultado en CI **no esta verificado**; todo lo demas se ha ejecutado localmente.
- **P0 abiertos: ninguno.** Hay avisos y deuda tecnica (secciones 7 y 8).

## 2. Commits de la noche (tras `422ce18`, informe de endurecimiento)
| Commit | Fase | Contenido |
|---|---|---|
| `1fda569` / `c75c4f1` | 1 | Ficha de producto 3.0: metadatos v2 de 15 productos, bloques precalculados `data/products/<id>.json`, mini-terminal en `producto.html` |
| `052bdfd` | 2 | `calculadora.html`: coste/ha/acre/t/bu, equilibrio, margen, sensibilidad ±5/10/20 % (no prevision), A/B/C |
| `8dff9f9` | 3 | Cross-Market Intelligence 2.0: `data/relationships.json` (34 relaciones), motor estadistico descriptivo, `relaciones.html` |
| `a770334` | 4 | Observatorio: `data/observatory.json`, `observatorio.html` |
| `6edc5dd` | 5 | Smart Watchlist 2.0 + `mi-seguimiento.html` (reglas combinables, exportar/importar JSON validado) |
| `1deaaa1` | 6 | Comparador 2.0 (filtros de frescura y comparabilidad, tabla Pais/Original/Normalizado/Fecha/Frescura/Fuente/Comparabilidad) |
| `9076c7e` | 7 y 8 | `data/coverage-gaps.json` y `data/source-candidates.json` con License Gate calculado desde el registro |
| `1aed3e8` | 9 | UX polish + `scripts/ux-audit.mjs` en CI |

## 3. Funcionalidades anadidas
Producto 3.0, Calculadora, Relaciones entre mercados, Observatorio, Smart Watchlist y Mi seguimiento, Comparador 2.0, matriz de huecos de cobertura, cola de descubrimiento de fuentes y auditoria UX automatica. Todas con esquema, test semantico y casos negativos (ver 6).

## 4. Errores corregidos durante la noche
- `explain()` de relaciones sin idioma en `num()`.
- Observatorio marcaba como "nuevo" dato antiguo recuperado: ahora `firstSeen` es con estado y exige frescura en la primera pasada.
- Selects desbordando a 390 px (observatorio, relaciones).
- Colision de atributo `data-add` que creaba un elemento basura en la watchlist (detectado por el E2E).
- Texto obsoleto en la nota de la tabla del comparador.
- UX (fase 9): enlaces de pie y de listas de fuentes sin area util, etiquetas de frescura cortadas a <=430 px, tablas-tarjeta con valor y unidad separados, selects de `mi-seguimiento` sin estilo, fuente de 10 px en el enlace de News Intelligence.

## 5. Payload antes / despues de la noche (carga inicial real, gzip) — la medicion actual esta en la seccion 0
Antes = `422ce18`, despues = `1aed3e8`, medido con `scripts/measure-pages.mjs`.
| Pagina | Antes | Despues |
|---|---|---|
| `/producto.html?p=trigo` | 4.452 KB raw / 950 KB gz | **831 KB / 249 KB** |
| `/` | 401 KB / 138 KB | 412 KB / 140 KB |
| `/precios.html` | 1.085 KB / 300 KB | 1.097 KB / 303 KB |
| `/paises.html?c=ES` | 1.544 KB / 442 KB | 1.568 KB / 449 KB |
| `/comparador.html` | 654 KB / 206 KB | 670 KB / 210 KB |
| `/catalogo.html` | 2.948 KB / 336 KB | 2.960 KB / 338 KB |
| `/brief.html` | 591 KB / 149 KB | 615 KB / 155 KB |
Paginas nuevas: `mi-seguimiento` 660 KB / 158 KB, `relaciones` 331 KB / 93 KB, `observatorio` 284 KB / 89 KB, `calculadora` 239 KB / 89 KB. El resto sube ~12–25 KB raw (CSS y menu de herramientas). `/producto.html?p=pollo` seguia entonces en 4,4 MB / 965 KB gz (resuelto en la fase de correccion: 870 KB / 250 KB gz).

## 6. Resultados de QA (estado actual; todos con salida 0)
| Comprobacion | Resultado |
|---|---|
| Esquemas y contratos (`validate-data.py --all`) | 347 ficheros, 0 errores, 4 con avisos (3 anomalias UNEXPLAINED + partida HS 2304 de soja) |
| Pruebas negativas de contratos | 105 casos, 0 fallos |
| License Gate (`check-licenses.py --strict`) + `test-license-gate` | 45 fuentes (26 VERIFIED, 12 PENDING, 4 RESTRICTED, 3 BLOCKED), 5.818 series revisadas, 10 PENDING en uso, 0 errores |
| Integridad del catalogo (`check-catalog.py --strict`) | 5.818 series, 41 entidades (31 paises, 7 agregados, 3 regiones) |
| `canonicalSeriesId` (`test-canonical-ids`) | 0 colisiones, 0 equivalencias declaradas |
| Identidad del instrumento | 17 productos, 0 fallos |
| Paridad de cobertura / frescura | 12 paises 0 discrepancias; 8.622 evaluaciones 0 diferencias |
| Unit Engine | 38 comprobaciones; 17.630 puntos reales convertidos, 0 omitidos |
| Watchlist | 38 comprobaciones |
| Verificador de anomalias (`test-verify-anomalies`, sin red) | 0 fallos |
| Contratos del sitio (`qa-site`) | 410/410 |
| Navegacion y enlaces profundos (`qa-navigation`) | 328/328 |
| SEO (`qa-seo`) | OK |
| E2E con navegador real, escritorio 1280 y movil 390, con axe | OK: sin errores de consola/pagina, sin 4xx/5xx propios, sin criticos ni serios de accesibilidad |
| UX responsive (`ux-audit --strict`, 9 paginas x 375/390/430/768/1280) | 45 combinaciones, 0 avisos |
| E2E de variantes (`e2e-variants --full`) | 47 casos, 0 fallos (smoke: 13) |
| PWA / `stamp-sw --check` | OK |
| Presupuestos de payload y rendimiento | `measure-pages --check` y `check-performance-budget` OK |
| Workflows (`check-workflows`) | 48 revisados, 0 incumplimientos |
| Pipelines (`pipeline-status.json`) | 43 OK, 0 late, 0 error |

### Comprobaciones de datos pedidas (cifras de la noche; las actuales de frescura y licencias estan en la seccion 0)
- **Provenance**: catalogo con 0 series sin `sourceId`/`licenseId`; capa de precios: 77 de 81 observaciones con `publicationDate` (4 sin ella: no se inventa; se omite).
- **Frescura inesperada**: capa de precios 46 LIVE, 32 FRESH, 1 EXPECTED_DELAY, **2 STALE**; catalogo 3.219 LIVE, 519 FRESH, 399 EXPECTED_DELAY, 123 DELAYED, **1.558 STALE** (1.459 son `eu_agrifood`: precios semanales de cereales de la UE parados desde ago-2026 en 14 paises).
- **Series duplicadas**: 0 `id` repetidos; el registro de series informa 0 candidatas a duplicado. Ver 7 (colisiones de clave canonica).
- **No comparable mostrado como comparable**: las 6 observaciones `not_comparable` (cerdo/pollo/vaca de EE. UU.; DAP/potasa/urea de la UE) no entran en el comparador; sus 129 series son todas `directional` (ninguna `exact`: lo que se muestra es tendencia y orden de magnitud, no precios restables).
- **Conversiones**: bushel→kg con factores estandar (trigo y soja 27,2155; maiz 25,4012; cebada 21,7724; avena 14,5149) comprobados por el Unit Engine y por el E2E de la calculadora; FX mensual del BCE (mes exacto o anterior, maximo 2 meses; si no, no se convierte y se dice).

## 7. Avisos abiertos (no son P0)
1. **3 anomalias `UNEXPLAINED_ANOMALY`** (AT sacrificio de cordero 2013, CA importaciones de trigo 1996, AU importaciones de trigo 2003/2019): **no se han podido contrastar con la fuente primaria** porque el entorno no tiene salida a Eurostat, Statistics Canada ni ABS (politica de red; no se han intentado rodeos). En su lugar se ha construido `scripts/verify-anomalies.py` + `.github/workflows/verify-anomalies.yml` (semanal y manual): descarga la fuente, compara los periodos y solo promueve a `KNOWN_VERIFIED_ANOMALY` si coinciden; una diferencia (`MISMATCH`) o una marca de Eurostat "no aplicable/confidencial" (`FLAGGED`) **no se promueve ni se silencia**. Ademas, `update-austria.py` ya no publica como 0 los valores con marca `z`/`c`. Accion: lanzar el workflow y revisar `lastCheck`. Objetivo de 0 UNEXPLAINED: **no alcanzado todavia, a la espera de esa ejecucion**.
2. **Precios semanales UE de cereales** parados desde el 2-ago-2026 en 14 paises (`eu_agrifood`): 509 STALE + 83 DELAYED de las 575 STALE / 123 DELAYED del catalogo.
3. **10 fuentes PENDING todavia en uso** (`mapa_es`, `franceagrimer`, `ble`, `cbs_nl`, `alberta_ag`, `world_bank`, `us_drought_monitor`, `us_tariffs`, `cbsa_tariff`, `snice_mx`), con `nextAction` en `pendingBaseline`; 473 series del catalogo vienen de las 6 que alimentan catalogo (`mapa_es` 219, `ble` 129, `cbs_nl` 67, `franceagrimer` 47, `alberta_ag` 9, `world_bank` 2). 129 series con `licenseId` UNKNOWN (BLE). Por eso `--strict-all` sigue fallando a proposito.
4. CI de los workflows refactorizados y de los nuevos sin verificar desde aqui (ver 1).
5. 4 de 12 relaciones del motor de relaciones del cliente (EE. UU.: fertilizante/energia vs cereales/leche) siguen `pending` por falta de series; soja con partida HS 2304 sin dato de arancel de EE. UU.
6. Todos los "nuevos datos" de la primera pasada del observatorio son aproximados (estado con memoria desde la segunda). No hay series diarias en la capa de precios.
7. La frescura de series de pais en la watchlist usa el rezago por defecto (aproximada).
8. Comparacion de instrumentos: soja, vacuno, cerdo, pollo y fertilizantes tienen instrumentos materialmente distintos entre regiones (se marcan "distinto": no hay diferencia calculada); el resto es "orientativo".

## 8. Deuda tecnica
- `data/normalized.json` 13,5 MB (aviso de `check-repo-growth`). `catalogo.html` ya no es deuda (1,16 MB / 2 ficheros).
- El indice global del catalogo pesa 823 KB crudos (104 KB gz): admite particionar por pais si el catalogo crece.
- Matriz de cobertura: 2.412 de 3.200 celdas MISSING, pero solo 34 son de confianza alta; siguen sin etiqueta de producto 222 de `crops`, 245 de `trade`, 230 de `partners` (series de categoria, no de producto, p. ej. "Exports: cereals" o "agri-food total"). ERS, crop-progress y drought no tienen metrica equivalente en la matriz (`notInMatrix.outsideCatalogNotMapped`).
- La cola de fuentes (31 candidatas curadas) **no se ha re-verificado**: sale de notas del proyecto (`verification = NOT_REVERIFIED`).
- `update-portugal-eurostat.py` tiene su propio `records()` y aun no descarta marcas Eurostat `z`/`c` (solo se corrigio Austria).

## 9. Cobertura y fuentes
- **Huecos** (`data/coverage-gaps.json`, 32 entidades x 100 celdas): AVAILABLE 533, AVAILABLE_OUTSIDE_CATALOG 105, STALE 97, HISTORICAL_ONLY 52, LICENSE_PENDING 1, SOURCE_AVAILABLE_NOT_INGESTED 0, MISSING 2.412 (confianza alta 34, media 1.424, baja 954). Mas cubiertos: PT 59 %, AT 57 %, EE. UU. 49 %, CA 48 %, UE 46 %; menos: LU 0 %, MT 1 %, EE 5 %, FI 6 %.
- **Cola** (`data/source-candidates.json`, 66 fuentes): ACTIVE 35, DISCOVERED 18, LICENSE_REVIEW 3, READY 2, BLOCKED 8. Solo `au_abs_slaughter_state` puede empezar ya (`canStart`); `de_genesis_api` tiene licencia lista pero exige un token que debe crear Mario. Ninguna fuente RESTRICTED/BLOCKED esta en uso.

## 10. Recomendaciones para el siguiente sprint (propuestas, decision de Mario)
1. Lanzar `verify-anomalies` (workflow_dispatch) y `e2e-full`, y comprobar en Actions el primer ciclo de `update-pipeline-status` con el indice del catalogo y los builders de Quality.
2. Resolver los precios semanales UE de cereales parados (afecta a 14 paises y a casi todo lo STALE).
3. Cerrar las 10 PENDING (`pendingBaseline`): confirmaciones por escrito de MAPA, FranceAgriMer, CBS, Alberta, NDMC, USITC/CBP, CBSA y SNICE; BLE via Destatis DL-DE-BY.
4. Crear `GENESIS_TOKEN` y `SIAR_API_KEY` (solo Mario); ingerir `au_abs_slaughter_state` (unica candidata READY sin bloqueo).
5. Usar solo los 34 huecos de confianza alta para priorizar fuentes nuevas; despues, pagina publica de huecos.
6. Aplicar a Portugal (`update-portugal-eurostat.py`) el descarte de marcas Eurostat `z`/`c`.
