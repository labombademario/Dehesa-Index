# Contribuir

## Entorno
Sin build. Servidor local: `python3 -m http.server 8123`. Python 3.11+ (`pip install pyyaml pandas`), Node 20. Para E2E: `npm i playwright axe-core && npx playwright install chromium`.

## Antes de cada commit
```
node --check js/<fichero>.js                    # ES5: sin let/const/flechas en js/
node scripts/stamp-sw.mjs                       # si tocaste js/, css/ o html
python3 scripts/gen-workflows.py --check        # si tocaste sources.yml (sin --check regenera)
python3 scripts/check-workflows.py
python3 scripts/validate-data.py --all --no-report
python3 scripts/test-contracts.py
python3 scripts/check-catalog.py --strict && python3 scripts/check-licenses.py
node scripts/qa-site.mjs && node scripts/qa-navigation.mjs && node scripts/qa-seo.mjs
node scripts/check-performance-budget.mjs && python3 scripts/check-repo-growth.py
node scripts/e2e.mjs                            # navegador real + axe (necesita el servidor en :8123)
python3 scripts/build-docs.py --check           # DATA_SOURCES.md
```
CI ejecuta lo mismo (`Dehesa Quality`). Commits pequenos, un bloque por commit, mensaje en espanol que diga que y por que.

## Reglas
1. **No inventar datos ni rellenar huecos.** Un dato ausente se muestra como ausente.
2. **No asumir licencias.** Fuente nueva = entrada en `data/license-registry.json` con evidencia; si no se puede verificar, `PENDING`.
3. **Correlacion no es prediccion.** Los textos de relaciones son descriptivos.
4. **Trazabilidad**: todo valor mostrado lleva fuente, fecha y frescura; conversiones siempre con el valor original al lado.
5. **Fallar cerrado**: no silencies un error para que el test salga en verde (`|| true`, `continue-on-error` sin cierre).
6. **Un cambio de JS/CSS visible**: restamp del service worker; un nuevo fichero de datos: esquema en `schemas/` + `schemas/registry.json` + test negativo en `scripts/test-contracts.py` + entrada de licencia si procede.
7. Un pipeline nuevo: añadirlo a `sources.yml` (o workflow manual con las acciones de `.github/actions/`), clasificarlo en `scripts/lib_index.py` (`WORKFLOW_KINDS`) y espaciar su cron.

## Accesibilidad
WCAG 2 A/AA: contraste ≥ 4,5:1 (usa los tokens `--text-faint`, `--positive`… no colores literales claros), `select` e inputs con etiqueta, SVG decorativos `aria-hidden`, regiones con scroll accesibles por teclado, `lang` sincronizado con el selector de idioma. `scripts/e2e.mjs` falla con `critical|serious`.
