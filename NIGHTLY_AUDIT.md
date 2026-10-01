# NIGHTLY_AUDIT — fases 1 a 10 (1-oct-2026)

Auditoria de cierre del plan nocturno. Reglas que han regido todo el trabajo: no inventar datos, no rellenar huecos, no asumir licencias, no convertir correlaciones en predicciones y no sacrificar trazabilidad. Nada de lo que sigue esconde un error para dejar un test en verde.

## 1. Estado
- **HEAD**: `1aed3e8` en `main`, arbol limpio. Los workflows refactorizados no se han podido ejecutar desde aqui (no hay `gh`/CI accesible): su resultado en GitHub Actions **no esta verificado**.
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

## 5. Payload antes / despues (carga inicial real, gzip)
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
Paginas nuevas: `mi-seguimiento` 660 KB / 158 KB, `relaciones` 331 KB / 93 KB, `observatorio` 284 KB / 89 KB, `calculadora` 239 KB / 89 KB. El resto sube ~12–25 KB raw (CSS y menu de herramientas). **`/producto.html?p=pollo` sigue en 4,4 MB / 965 KB gz**: los productos sin ficha 3.0 siguen cargando `ers.json` y `supply-demand.json`.

## 6. Resultados de QA (todos con salida 0)
| Comprobacion | Resultado |
|---|---|
| Esquemas y contratos (`validate-data.py --all`) | 343 ficheros, 0 errores, 4 con avisos |
| Pruebas negativas de contratos | 93 casos, 0 fallos |
| License Gate (`check-licenses.py`) | 45 fuentes (18 VERIFIED, 20 PENDING, 4 RESTRICTED, 3 BLOCKED), 5.818 series revisadas, 0 errores |
| Integridad del catalogo (`check-catalog.py --strict`) | 5.818 series, 41 entidades (31 paises, 7 agregados, 3 regiones) |
| Paridad de cobertura / frescura | 12 paises 0 discrepancias; 8.622 evaluaciones 0 diferencias |
| Unit Engine | 38 comprobaciones; 17.630 puntos reales convertidos, 0 omitidos, 0 con FX del mes previo |
| Watchlist | 37 comprobaciones |
| Contratos del sitio (`qa-site`) | 410/410 |
| Navegacion y enlaces profundos (`qa-navigation`) | 329/329 |
| SEO (`qa-seo`) | 2.443 comprobaciones, 229 URLs |
| E2E con navegador real, escritorio 1280 y movil 390, con axe | OK: sin errores de consola/pagina, sin 4xx/5xx propios, sin criticos ni serios de accesibilidad |
| PWA | `stamp-sw --check` OK + flujo offline/404 en el E2E |
| Presupuestos de payload y rendimiento | `measure-pages --check` y `check-performance-budget` OK |
| UX responsive (`ux-audit`, 9 paginas x 375/390/430/768/1280) | 45 combinaciones, 0 avisos (sin desbordes horizontales; objetivos tactiles con la excepcion de espaciado de WCAG 2.2; foco visible) |
| Workflows (`check-workflows`) | 46 revisados, 0 incumplimientos |

### Comprobaciones de datos pedidas
- **Provenance**: catalogo con 0 series sin `sourceId`/`licenseId`; capa de precios: 77 de 81 observaciones con `publicationDate` (4 sin ella: no se inventa; se omite).
- **Frescura inesperada**: capa de precios 46 LIVE, 32 FRESH, 1 EXPECTED_DELAY, **2 STALE**; catalogo 3.219 LIVE, 519 FRESH, 399 EXPECTED_DELAY, 123 DELAYED, **1.558 STALE** (1.459 son `eu_agrifood`: precios semanales de cereales de la UE parados desde ago-2026 en 14 paises).
- **Series duplicadas**: 0 `id` repetidos; el registro de series informa 0 candidatas a duplicado. Ver 7 (colisiones de clave canonica).
- **No comparable mostrado como comparable**: las 6 observaciones `not_comparable` (cerdo/pollo/vaca de EE. UU.; DAP/potasa/urea de la UE) no entran en el comparador; sus 129 series son todas `directional` (ninguna `exact`: lo que se muestra es tendencia y orden de magnitud, no precios restables).
- **Conversiones**: bushel→kg con factores estandar (trigo y soja 27,2155; maiz 25,4012; cebada 21,7724; avena 14,5149) comprobados por el Unit Engine y por el E2E de la calculadora; FX mensual del BCE (mes exacto o anterior, maximo 2 meses; si no, no se convierte y se dice).

## 7. Avisos abiertos (no son P0)
1. **3 anomalias `UNEXPLAINED_ANOMALY`** (AT sacrificio 2013, CA importaciones de trigo 1996, AU importaciones de trigo 2003): Eurostat/StatCan/ABS no son accesibles desde el sandbox; no se han "explicado" sin evidencia.
2. **Precios semanales UE de cereales** parados desde el 2-ago-2026 en 14 paises (`eu_agrifood`).
3. **3.234 series con `licenseId` UNKNOWN** (casi todas `eu_agrifood`, PENDING en el registro) y **18 fuentes PENDING en uso**: se muestran como pendientes, no se asumen permisos.
4. `update-canada.yml` figura en `error` en `pipeline-status.json`; CI de los workflows refactorizados (`update-worldbank-urea`, etc.) sin verificar desde aqui.
5. 4 de 12 relaciones del motor de relaciones del cliente (EE. UU.: fertilizante/energia vs cereales/leche) siguen `pending` por falta de series; soja con partida HS 2304 sin dato de arancel de EE. UU.
6. **23 claves canonicas compartidas** por 2 o mas series del mismo pais (DE/BLE 9, PT 5, NL 3, FR 3, DE/Destatis 2, ES 1), p. ej. abonos binarios 1-1-0 y 0-1-1 de PT con valores distintos: son colisiones de etiqueta, no duplicados reales, pero la clave canonica no distingue.
7. Todos los "nuevos datos" de la primera pasada del observatorio son aproximados (estado con memoria desde la segunda). No hay series diarias en la capa de precios: la ventana de 1–3 dias va vacia.
8. La frescura de series de pais en la watchlist usa el rezago por defecto (aproximada).

## 8. Deuda tecnica
- `data/normalized.json` 13,5 MB y `catalogo.html` ~2,9 MB; `producto.html` de productos sin ficha 3.0 ~4,4 MB.
- Observatorio en movil: 47 tarjetas de "nuevas observaciones" (pagina de ~19.000 px): conviene paginar.
- Matriz de cobertura: 2.423 de 3.200 celdas sin dato, pero el 40 % de las series de varios grupos no llevan etiqueta de producto (p. ej. 227 de `crops`, 245 de `trade`, 230 de `partners`): mejorar el etiquetado reduce falsos huecos. Los ficheros USDA con formato propio (AMS, ERS, crop-progress, sequia) no entran en la matriz.
- La cola de fuentes (31 candidatas curadas) **no se ha re-verificado**: sale de notas del proyecto (`verification = NOT_REVERIFIED`).

## 9. Cobertura y fuentes
- **Huecos** (`data/coverage-gaps.json`, 32 entidades x 100 celdas): AVAILABLE 527, AVAILABLE_OUTSIDE_CATALOG 100 (datos USDA de EE. UU., UE, CA, AU y UK en ficheros propios), STALE 149, LICENSE_PENDING 1, SOURCE_AVAILABLE_NOT_INGESTED 0, MISSING 2.423. Mas cubiertos: PT 58 %, AT 56 %, CA 47 %, UE 46 %, EE. UU. 43 %; menos: LU 0 %, MT 1 %, EE 5 %, FI 6 %. Fuente integrada con mas celdas atrasadas: `eu_agrifood` (282 celdas en 29 entidades).
- **Cola** (`data/source-candidates.json`, 66 fuentes): ACTIVE 35, DISCOVERED 18, LICENSE_REVIEW 3 (SIMA/GPP, ABARES, BLE), READY 2, BLOCKED 8. Solo `au_abs_slaughter_state` puede empezar ya (`canStart`); `de_genesis_api` tiene licencia lista pero exige un token que debe crear Mario. Ninguna fuente RESTRICTED/BLOCKED esta en uso.

## 10. Recomendaciones para el siguiente sprint (propuestas, decision de Mario)
1. Verificar en GitHub Actions los workflows refactorizados y el derivado nuevo (`update-pipeline-status`), y relanzar `update-canada`.
2. Resolver los precios semanales UE de cereales parados (afecta a 14 paises y a casi todo lo STALE).
3. Crear `GENESIS_TOKEN` y `SIAR_API_KEY` (solo Mario); contactar con AMA, GPP y MLA.
4. Ingerir `au_abs_slaughter_state` (unica candidata READY sin bloqueo).
5. Paginar el Observatorio en movil y llevar las fichas 3.0 al resto de productos (quita ~3,6 MB).
6. Pagina publica de huecos de cobertura (hoy solo dato de gestion) y mejorar el etiquetado de producto del catalogo.
7. Dar a la clave canonica un componente que distinga los productos (colisiones de la seccion 7.6).
