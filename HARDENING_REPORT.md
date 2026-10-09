# Informe de cierre: fase de endurecimiento (1-oct-2026)

Alcance: P0 1–6, P1 7–18, P2 19–25 del encargo de endurecimiento. Estado: **P0 cerrados. P1/P2 cerrados salvo lo indicado en "No cerrado a proposito".**

## Commits principales (main)
| Bloque | Commit |
|---|---|
| Cierre tecnico P0-3/4/5 (contratos, pipelines que fallan cerrados, presupuesto) | `91c6264`, `c26d09c`, `c71a6b2` |
| SW versionado por hash, QA de SEO, limpieza de `__pycache__` y copy global | `3f23f63`, `8f2c72e`, `c2ecce0` |
| License Registry + License Gate en CI (45 fuentes, `sourceId/licenseId` en 5.818 series) | `14046cc` |
| P0-1 `paises`/`perfiles` sobre la capa unificada; vista `eu-preview` | `5e6fed6` |
| Contratos de precios/vistas, presupuesto por pagina, licencias de la capa de precios | `ac96df7` |
| P0-2 Home/Precios/Noticias sin `latest.json`/`history.json`/`news-index.js` en la entrada | `a0054fd` |
| Freshness Engine 2.0 + registro de anomalias | `3f3b816` |
| Daily Brief sobre los 43 pipelines | `803d67c` |
| Unit Engine central, comparador sin FX silencioso | `63b363d` |
| `entityType` + procedencia por serie | `c68ce33` |
| E2E navegador real + axe (WCAG 2 A/AA), contraste, etiquetas, foco, `lang` | `f070a41` |
| Auditoria de crecimiento del repo | `c5b65ab` |
| SEO: QA antes de publicar + QA de sitemap/robots | `0e4f688` |
| Metadatos de producto, lint de esquemas | `376f788` |
| Workflows: preset `price-engine` | `52d34e7` |
| Docs (ARCHITECTURE, DATA_MODEL, DATA_SOURCES, CONTRIBUTING, README) y copy global | `1dfc0de` |
| Relationship Engine: UK resuelto, region real en la tarjeta | ver `git log` |

## Payload inicial por pagina (navegador real, bytes crudos)
| Pagina | Antes | Despues |
|---|---|---|
| Home | 6,4 MB | 391 KB (135 KB gz) |
| Precios | 23,7 MB | 1.059 KB (293 KB gz) |
| Noticias | 826 KB de JS bloqueante | 443 KB (JSON perezoso, 187 KB gz) |
| Perfiles | ~8 MB | 335 KB (107 KB gz) |
| Pais (`paises?c=ES`) | n/d | 1.508 KB (432 KB gz; carga solo ese pais) |
| Comparador | n/d | 638 KB (201 KB gz) |
| Brief | n/d | 577 KB (145 KB gz) |
| **Catalogo** | n/d | **2.879 KB (328 KB gz, 80 ficheros)** — pendiente |
| **Producto (trigo)** | n/d | **4.348 KB (928 KB gz)** — pendiente (`ers.json` 1,3 MB, `supply-demand.json` 0,5 MB) |

## Contratos
Esquemas de datos: **3 → 49** (`schemas/*.schema.json` + `registry.json`), 307 ficheros validados en 46 familias, 56 casos negativos (los datos corrompidos DEBEN rechazarse), lint de esquemas (una palabra clave no soportada es error: se detectaron y corrigieron 2 esquemas cuyo `additionalProperties` se ignoraba en silencio).

## Avisos de calidad (estado actual)
- 3 anomalias de salto `UNEXPLAINED_ANOMALY` (AT sacrificio 2013, CA importaciones de trigo 1996, AU importaciones de trigo 2003): no verificables desde el entorno (Eurostat/StatCan/ABS inaccesibles); **se dejan como aviso, no se declaran verificadas**.
- 4 de 12 relaciones del Relationship Engine sin series: las de EE. UU. (no existen indices de insumos/produccion de EE. UU. en `data/prices/intelligence/us.json`; brecha real de datos). Las del Reino Unido ya resuelven (antes 8/12).
- 18 fuentes `PENDING` en uso (licencia no verificable; se muestran como pendientes), 4 `RESTRICTED` y 3 `BLOCKED` no usadas.

## Pipelines
42 ok / 0 con retraso / 1 error en el ultimo informe (`update-canada`: fallo transitorio en la llamada externa a StatCan; reintentada en CI con exito). Refactores verificados en CI: `update-defra-milk`, `update-canada`, `update-energy`, `update-worldbank-urea` (en curso), SEO con QA previo.

## Resultados de QA
`validate-data --all` 0 errores · `test-contracts` 56/56 · `check-licenses` 0 errores · `check-catalog --strict` OK · `qa-site` 410/410 · `qa-navigation` 299/299 · `qa-seo` 2.356 comprobaciones / 216 URLs · Freshness/Unit parity OK · presupuesto de pagina OK · crecimiento del repo OK (1 aviso: `normalized.json` 13,5 MB) · **E2E 17 paginas × 2 viewports + 12 flujos + axe: 0 incumplimientos critical/serious** (CI: job `e2e`).

## No cerrado a proposito (y por que)
1. **Anomalias sin verificar (3)**: sin acceso a la fuente; inventar una explicacion seria peor que el aviso.
2. **Precios semanales UE de cereales** (`breadmaking-common-wheat-national-average`): 14 paises terminan en agosto-2026 y Espana en sep-2025, aunque la familia llega a 20-sep. Causa aguas arriba no verificada (probable cambio de campana/definicion). Frescura lo marca; no se rellena.
3. **Catalogo y Producto aun pesados** (2,9 y 4,3 MB): se abordan en la ficha de producto 3.0 (carga perezosa) en la fase siguiente.
4. **`normalized.json` (13,5 MB)** y duplicidad `history.csv`/`history.json`: recomendacion en `docs/REPO_GROWTH.md` (no se cambia el formato publicado sin decision).
5. **Concurrencia** (resuelto 9 oct): grupos por conjunto de ficheros escritos + publicador con mezcla de registros comunes + vigilante que relanza lo cancelado en cola (ver ARCHITECTURE.md).
6. **`detect-revisions` nunca falla** por diseno (informativo).
7. **20 fuentes PENDING**: requieren confirmacion escrita de las instituciones (decision de Mario).
8. **Tarjeta del indice de la Home**: comprobada visualmente tras los cambios (UE, 103,0; desplegable UE/EE. UU.); sin incidencias.
