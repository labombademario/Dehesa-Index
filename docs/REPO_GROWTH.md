# Crecimiento del repositorio (auditoria y politica)

Medido el 2026-10-01 con `python3 scripts/check-repo-growth.py --report` y `git gc`.

## Estado
| Medida | Valor |
|---|---|
| Ficheros versionados | 1.924 |
| Arbol `data/` | 104 MB (de ellos `data/ams` 29 MB, `normalized.json` 13,5 MB, `data/eu` 10 MB, `history.json` 9,7 MB) |
| Historial git (pack tras `git gc`) | 22 MB en 1.103 commits (3 dias de historia: 29-sep a 1-oct) |
| Versiones acumuladas sin comprimir | `normalized.json` 47 versiones = 195 MB; `history.json` 51 = 142 MB; `latest.json` 51 = 60 MB; `history.csv` 49 = 38 MB |

La compresion por deltas de git hace que 512 MB de blobs de `data/` ocupen ~22 MB. El riesgo no es el tamano de hoy sino el ritmo: los
datos regeneran los mismos ficheros grandes en cada ejecucion (≈350 commits/dia en el periodo medido, que incluye la actividad de desarrollo).
No hay historia suficiente para extrapolar una tasa estable; por eso la medicion es continua (`check-repo-growth.py` en CI) en vez de una cifra fija.

## Politica
1. **Limite por fichero**: 25 MB falla CI, 10 MB avisa (`scripts/repo-budget.json`). GitHub bloquea a 100 MB.
2. **Limite del arbol `data/`**: 160 MB falla, 120 MB avisa.
3. **Historial git**: 400 MB falla, 250 MB avisa. Si se acerca, el plan es archivar el historico antiguo en una rama/repo `dehesa-index-data-archive` y reiniciar con `git clone --depth`/rama huerfana para `main`, sin perder los datos (siguen en el archivo).
4. **El navegador nunca descarga ficheros de historico completos**: usa `data/prices/*` (ligera, lazy) y `data/views/*`. Los ficheros grandes de la raiz (`history.json`, `latest.json`, `normalized.json`, `history.csv`) son fuentes de verdad / descargas, no cargas de pagina (comprobado por `scripts/page-budget.json`).

## Candidatos a reducir (no ejecutado: cambiaria el formato publicado; decision de producto/ingenieria)
- `data/normalized.json` (13,5 MB, JSON con sangria de 2): compactar baja ~26 % del tamano en disco (13,5 MB a 10,0 MB, medido). Es derivado de `history.json`. Riesgo: diffs menos legibles; el delta de git sigue funcionando. Recomendado cuando `check-repo-growth.py` avise del pack.
- `data/history.csv` y `data/history.json` contienen lo mismo: valorar generar el CSV solo en el release/descarga y no versionarlo.
- `data/snapshots/<fecha>.json` (≈3,6 MB/dia): politica sugerida, conservar 30 dias diarios y despues uno por mes. No se borra nada ahora: el historial completo ya vive en `history.json`.
- `data/ams/*.json` (29 MB, informes AMS): mantener, pero particionar por ano si siguen creciendo.

## Que NO se ha hecho a proposito
No se ha borrado ni reescrito historia ni datos historicos. Todo lo anterior es reversible y esta documentado como recomendacion.
