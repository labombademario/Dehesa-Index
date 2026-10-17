# Dehesa Index

[English](README.md) · **Español** · [Français](README.fr.md)

[dehesaindex.com](https://dehesaindex.com) es un rastreador global, al estilo Bloomberg, de precios agrícolas y estadísticas oficiales: ganado, lácteos, cereales, oleaginosas, fertilizantes, piensos y energía, con precios de Estados Unidos, la Unión Europea, el Reino Unido y Canadá y estadísticas oficiales de más de 30 países (las cifras exactas de países, agregados y regiones salen de `data/catalog/manifest.json`, `entityType`). Es un sitio estático (HTML, CSS y JavaScript ES5 puros, sin paso de compilación) alimentado por pipelines programados de GitHub Actions que suben ficheros JSON a `data/`. Interfaz en español, inglés, francés e italiano.

## Derechos y licencias

© 2026 Dehesa Index. **Todos los derechos reservados.** El código, los scripts, los esquemas, la compilación de datos y el diseño de este repositorio se publican solo con fines de transparencia y no están licenciados para copiarse, redistribuirse ni reutilizarse comercialmente. Para solicitar una licencia, escribe a [dehesaindex@gmail.com](mailto:dehesaindex@gmail.com).

Los datos publicados por fuentes de terceros (Eurostat, USDA, la Comisión Europea y otras) conservan su propia licencia y sus condiciones de atribución, que figuran en [`DATA_SOURCES.md`](DATA_SOURCES.md). Este aviso no las modifica.

## Documentación

Estos documentos están en inglés.

- [`ARCHITECTURE.md`](ARCHITECTURE.md): capas de datos, pipelines, controles de calidad.
- [`DATA_MODEL.md`](DATA_MODEL.md): contratos, frescura, licencias, anomalías.
- [`DATA_SOURCES.md`](DATA_SOURCES.md): cada fuente y su licencia (generado).
- [`CONTRIBUTING.md`](CONTRIBUTING.md): comprobaciones antes de un commit y reglas del proyecto.
- [`docs/REPO_GROWTH.md`](docs/REPO_GROWTH.md): presupuesto de tamaño del repositorio y política de retención.

## Qué cubre

| Área | Páginas | Fuentes principales |
|---|---|---|
| Precios | `precios.html`, `producto.html`, `europa.html`, `mercados.html` | USDA AMS, NASS, Portal de Datos Agroalimentarios de la UE, informes nacionales de precios |
| Oferta y demanda | `oferta-demanda.html`, `cultivos.html`, `rendimientos.html`, `ganaderia.html`, `exportaciones.html` | USDA PSD, NASS, ERS, FAS GATS, ventas de exportación |
| Estadísticas por país | `paises.html`, `perfiles.html`, `recan.html` | MAPA, INE, Statbel, Destatis, BLE, FranceAgriMer, Statistics Canada, ABS, CBS, Statistics Denmark, Eurostat |
| Comercio exterior | dentro de `paises.html` | Eurostat Comext (8 países europeos, extra/intra UE, producto por socio), Statistics Canada, ABS |
| Aranceles | `aranceles.html` | Arancel Armonizado de la USITC (capítulos 01-24 y 31) más una capa fechada de medidas recientes |
| Perfiles de país | `perfiles.html`, `paises.html?c=XX` | Indicadores clave, socios comerciales, macro (Banco Mundial, Eurostat), tipos de interés oficiales (Fed, BCE, Banco de Canadá, RBA), salarios medianos |
| Costes e insumos | `costes.html`, `insumos.html` | ERS, Banco Mundial, series de fertilizantes y energía |
| Clima y sequía | `clima.html`, `sequia.html`, `mapa.html` | NASA POWER, US Drought Monitor, MARS |
| Noticias y calendario | `noticias.html`, `calendario.html` | Pipeline RSS (abajo), calendarios de publicación |

Países con perfil: España, Francia, Alemania, Bélgica, Austria, Portugal, Dinamarca, Países Bajos, Estados Unidos, Canadá, Australia y una vista previa de la Unión Europea.

## Cómo funciona

- `scripts/update-*.py|js` descargan y normalizan una fuente cada uno y escriben en `data/`; la mayoría de los workflows se generan desde `sources.yml`. Las cifras (número de pipelines, esquemas, registro de licencias y catálogo) se generan en el [README en inglés](README.md#how-it-works) para que no se desfasen aquí.
- Los workflows de datos tienen un grupo de concurrencia por conjunto de ficheros escritos (los que escriben el mismo fichero comparten grupo; los constructores de datos derivados comparten `dehesa-data-writes`); `scripts/publish-data.sh` hace rebase y fusiona los registros compartidos para que los commits en paralelo nunca pierdan datos, y un vigilante relanza cualquier workflow cancelado en la cola. Cada uno escribe un `*-log.txt` junto a su salida.
- Los ficheros por país comparten un esquema: `{ schemaVersion, generatedAt, countries: { XX: { name, source, extend?, series: [{ id, group, label, unit, frequency, latestPeriod, latest, changePct, points }] } } }`. `js/country-data.js` los carga y fusiona; `js/paises.js` pinta el explorador y `js/perfil-pais.js` los perfiles.
- Solo se muestran series reales publicadas por cada fuente: no se estima ni se rellena nada. Las licencias y citas están en `legal.html` y `metodologia.html`.
- Las tablas se pueden ordenar en todo el sitio (`initTableSort` en `js/shared.js`).
- El estado vivo de los pipelines y los huecos de cobertura se publican en [`status.html`](https://dehesaindex.com/status.html), construido a partir de `data/pipeline-status.json` y `data/coverage-gaps.json`.

## Controles de calidad

```
python3 scripts/validate-data.py --all --no-report   # todos los esquemas + pruebas semánticas + coherencia
python3 scripts/test-contracts.py                    # los datos reales corruptos deben ser rechazados
python3 scripts/check-licenses.py && python3 scripts/check-catalog.py --strict
node scripts/qa-site.mjs && node scripts/qa-navigation.mjs && node scripts/qa-seo.mjs
node scripts/check-performance-budget.mjs            # presupuestos de peso por página
node scripts/e2e.mjs                                 # navegador real, escritorio y móvil, axe-core
```

Todos se ejecutan en GitHub Actions (`quality.yml`, `qa-site.yml`, `qa-navigation.yml`); consulta `CONTRIBUTING.md`.

## Datos y licencias

Cada serie conserva su fuente y su licencia en el JSON y en la página. Entre las fuentes hay datos del Gobierno de EE. UU. de dominio público, datos abiertos CC BY 4.0 (Eurostat, Banco Mundial, INE Portugal, ABS, entre otros) y condiciones nacionales de solo atribución. Los elementos aún pendientes de confirmar su licencia se señalan en las notas del proyecto y no se republican en silencio.

## Pipeline automático de noticias

Dehesa Index mantiene un pipeline automático de noticias de mercados agrícolas:

RSS/Atom -> normalizar -> deduplicar -> clasificar -> puntuar relevancia -> data/news.json -> data/views/news-index.json + data/views/news-feed.json

- Fuentes consultadas actualmente, mediante feeds de búsqueda RSS de Google News: Reuters, Associated Press, AFP, EFE, Bloomberg, Financial Times, Wall Street Journal, CNBC, POLITICO, Euractiv, Xinhua, DTN, AgWeb, Farm Progress, Successful Farming, World Grain, Feed Strategy, Dairy Herd, Fastmarkets, S&P Global, Argus Media, FoodNavigator, Farmers Weekly, Farmers Guardian, Agriland, AGRA, Agroeuropa, ABC Rural, Grain Central, The Land, USDA, USDA ERS, Comisión Europea (Agricultura), FAO, OCDE, OMC, EIA, AIE y Consejo Internacional de Cereales.
- Ventana de retención: 14 días; máximo 120 noticias.
- La clasificación asigna cada noticia a maíz, trigo, soja, arroz, cebada, azúcar, fertilizantes, gasóleo, energía, lácteos, piensos, costes agrarios y PAC.
- Los temas incluyen clima, comercio, oferta, energía, costes y política, con etiqueta de región de origen para EE. UU., UE y cobertura global.
- GitHub Actions actualiza el conjunto de datos cada 3 horas y también se puede ejecutar a mano.
- Los ficheros generados no deben editarse a mano: `data/news.json` y `data/views/news-*.json` son salidas del pipeline.
- La interfaz de noticias de mercado tiene una capa de reserva para que un producto sin noticia regional equivalente pueda mostrar igualmente cobertura global reciente y compatible.

### Noticias → Inteligencia de mercado

El pipeline de noticias también emite metadatos `impactChannel` y `marketLinks` para cada noticia.

- Los canales MARKET IMPACT, INPUT COST, TRADE, WEATHER, SUPPLY, ENERGY y POLICY se asignan de forma determinista a partir de la clasificación de la noticia.
- Las noticias sobre costes de insumos pueden enlazar con claves de relación existentes, como fertilizer-cereals, energy-cereals, fertilizer-milk y energy-milk.
- El frontend une esas claves con el Motor de Relaciones Agrícolas en vivo, de modo que el desfase, la correlación y la confianza se calculan sobre el histórico verificado actual y no se copian en el feed de noticias.
- Si hay una alerta compatible de Transmission Watch activa, la tarjeta de noticia también puede mostrar TRANSMISSION WATCH.
- El vínculo es descriptivo: identifica el contexto de mercado y las relaciones históricas observadas; no convierte una noticia en una previsión de precios.
