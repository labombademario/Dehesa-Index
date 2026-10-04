# Canadá a nivel EE. UU. (3 oct)

**Hecho** (solo con datos ya publicados; ninguna cifra nueva):
- Pestaña «Canadá» en `rendimientos.html`, `ganaderia.html`, `insumos.html` y `costes.html` (`?c=CA`), igual que EE. UU.
- Rendimientos: 15 cultivos, rendimiento/producción/superficie cosechada y sembrada por provincia (StatCan 32-10-0359), mapa, tabla ordenable, variación y peso en Canadá.
- Ganadería: vacuno, porcino y ovino por provincia (miles de cabezas).
- Insumos: índice de precios de insumos (FIIP 18-10-0258, cambio no precio), entregas de fertilizante (32-10-0038, toneladas), combustible (18-10-0001).
- Costes: gastos de explotación (32-10-0049), renta (0045, 0046, 0052), balance y deuda (0050, 0051).
- Código nuevo: `js/ca-explorer.js`, `js/ca-series.js`, `js/*-ca.js`. Traducción de etiquetas ampliada en `js/perfil-claro.js`.
- Test `scripts/test-canada-tabs.mjs` (4 páginas x 4 idiomas x 2 anchos) en `quality.yml`.

**Límites / pendiente**
- Territorios (YT, NT, NU) sin datos en estas tablas.
- Exportaciones: falta integrar datos CGC (`canada-grain.json`) como pestaña.
- Oferta-demanda: comprobar PSD Canadá; balance de granos StatCan 32-10-0013 pendiente como fuente.
- Calendario de publicaciones StatCan: sin fuente aún.
- Nuevas fuentes (32-10-0013, 32-10-0125 sacrificio, 12-10-0175 comercio por socio) requieren rama de investigación y licencia verificada (OGL-Canada); siguen PENDING.
