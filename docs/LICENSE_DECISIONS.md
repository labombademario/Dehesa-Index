# Propuesta de decisión: las 10 fuentes PENDING en uso

Preparado el 2026-10-01. **Es una propuesta, no un cambio de estado**: ninguna fuente se ha movido de PENDING. La decisión jurídica es de Mario; esto no es asesoramiento legal.

Base de la tabla: `data/license-registry.json` (evidencia leída el 2026-10-01 por sesiones anteriores) y `pendingBaseline`. «Series» = series en el catálogo unificado. Las fuentes con 0 series se muestran en páginas (aranceles, sequía) pero no están en el catálogo.

## Resumen por prioridad (impacto × riesgo)

| # | Fuente | Series | Riesgo | Propuesta |
|---|---|---|---|---|
| 1 | `ble` (DE) | 129 | **Alto** | Preguntar a BLE y buscar el dataset en GovData; si resulta NC/ND, dejar de publicar |
| 2 | `mapa_es` (ES) | 219 | Medio-bajo | Aceptar con condiciones si se confirma la base legal; pedir confirmación escrita |
| 3 | `franceagrimer` (FR) | 47 | Medio | Migrar a las copias Licence Ouverte 2.0 de data.gouv.fr; si no existen, preguntar |
| 4 | `cbs_nl` (NL) | 67 | Bajo | Cerrar leyendo el «Disclaimer open data»; probable CC BY 4.0 |
| 5 | `cbsa_tariff` (CA) | 0 | Medio-alto | Pedir permiso; mientras tanto, solo enlace a la fuente oficial |
| 6 | `us_drought_monitor` (US) | 0 | Medio | Escribir a NDMC; mantener el crédito exacto |
| 7 | `world_bank` (INT) | 2 | Bajo (poco volumen) | Retirar o sustituir las 2 series del Pink Sheet |
| 8 | `alberta_ag` (CA) | 9 | Bajo | Pedir confirmación; atribución OGL-Alberta mientras tanto |
| 9 | `snice_mx` (MX) | 0 | Bajo-medio | Buscar en datos.gob.mx (Libre Uso MX) o preguntar; solo enlace mientras tanto |
| 10 | `us_tariffs` (US) | 0 | Bajo | Cerrar como VERIFIED por la base legal de obra federal (decisión tuya) |

## Detalle por fuente

### 1. `ble` — Bundesanstalt für Landwirtschaft und Ernährung (129 series)
- **Qué sabemos:** el portal open-data.ble.de bloquea la lectura automática (robots.txt) y no se encontró licencia de datos. El pie de página del sitio dice CC BY-NC-ND 4.0, pero el registro lo atribuye a los textos de la página, no a los datos.
- **Por qué es la más delicada:** si los datos fueran NC-ND, quedarían excluidos el uso comercial y las obras derivadas (normalizamos y recalculamos variaciones).
- **Propuesta:** (a) buscar los datasets en GovData, donde muchas publicaciones de organismos federales alemanes llevan DL-DE-BY-2.0 o DL-DE-Zero-2.0 (no lo he podido confirmar para BLE); (b) escribir a opendata@ble.de; (c) alternativa ya anotada: Destatis (DL-DE-BY).
- **Si la respuesta es NC-ND o no llega:** dejar de publicar esas 129 series y mostrar solo enlace al origen.

### 2. `mapa_es` — Ministerio de Agricultura, Pesca y Alimentación (219 series, incluye RECAN)
- **Qué sabemos:** el aviso legal permite usar la información sin autorización previa citando la fuente y manteniendo fechas de actualización y metadatos de reutilización; excluye derechos de terceros. No dice nada de uso comercial ni obras derivadas. El aviso hermano de SIAR sí permite uso comercial, pero es otro dataset.
- **Propuesta:** aceptar con condiciones (citar fuente, conservar fecha de actualización), siempre que confirmes la base legal general de reutilización de información del sector público en España. Pedir además confirmación escrita al MAPA por la RECAN.
- **Es la de mayor volumen**, así que merece que se cierre bien.

### 3. `franceagrimer` — FranceAgriMer VISIONet (47 series)
- **Qué sabemos:** hay contradicción: el aviso del RNM permite la reutilización, incluso comercial, con fuente e integridad de los datos; el pie de VISIONet dice «todos los derechos reservados».
- **Propuesta:** buscar esas series entre los datasets de data.gouv.fr bajo Licence Ouverte 2.0 y migrar; lo que no esté allí, tratarlo como sin licencia hasta confirmación escrita de FranceAgriMer.

### 4. `cbs_nl` — Statistics Netherlands (67 series)
- **Qué sabemos:** la página dice que los datos abiertos se pueden usar libremente, pero remite a un «Disclaimer open data» que no se pudo leer. Hay una etiqueta CC BY 4.0 declarada en ficheros antiguos del proyecto sin reconfirmar.
- **Propuesta:** es la de mejor relación esfuerzo/resultado. Si pegas aquí la URL del «Disclaimer open data» de CBS (o la del dataset en data.overheid.nl), la leo y, si dice CC BY 4.0, la cierro como VERIFIED con evidencia.

### 5. `cbsa_tariff` — Canada Border Services Agency (0 series)
- **Qué sabemos:** sin aviso de licencia en las páginas del arancel. Los términos de Canada.ca exigen permiso escrito previo para la redistribución comercial de contenido del Gobierno de Canadá.
- **Propuesta:** escribir a CBSA; mientras tanto, mostrar solo un enlace al arancel oficial en lugar de los valores derivados.

### 6. `us_drought_monitor` — NDMC / USDA / NOAA (0 series; página de sequía)
- **Qué sabemos:** la página de permisos solo prescribe la línea de crédito. El pie lleva un aviso de copyright de la Universidad de Nebraska-Lincoln.
- **Propuesta:** escribir a DroughtMonitor@unl.edu preguntando por uso comercial y derivados; mantener el crédito exacto mientras tanto.

### 7. `world_bank` — Pink Sheet (2 series)
- **Qué sabemos:** los datasets del Banco Mundial son CC BY 4.0, pero se excluyen los de terceros y el Pink Sheet es una compilación de fuentes de terceros sin licencia declarada.
- **Propuesta:** solo son 2 series; lo más limpio es retirarlas o sustituirlas por series propias de otra fuente ya verificada.

### 8. `alberta_ag` — Alberta Weekly Market Review (9 series)
- **Qué sabemos:** la OGL-Alberta es muy permisiva, pero el listado del dataset no indica licencia.
- **Propuesta:** pedir confirmación a Alberta Agriculture; mientras tanto, mantener la atribución «Contains information licensed under the Open Government Licence – Alberta» y no insinuar carácter oficial.

### 9. `snice_mx` — Secretaría de Economía, LIGIE (0 series)
- **Qué sabemos:** la página no tiene términos ni licencia. Si fuera de aplicación Libre Uso MX, permitiría uso comercial y derivados con atribución.
- **Propuesta:** comprobar si el dataset está en datos.gob.mx bajo Libre Uso MX; si no, preguntar a la Secretaría de Economía. Solo enlace mientras tanto.

### 10. `us_tariffs` — USITC HTS, CBP, USTR (0 series)
- **Qué sabemos:** no hay página explícita de reutilización; la base es la regla general de que las obras del gobierno federal no tienen copyright (17 U.S.C. 105).
- **Propuesta:** cerrar como VERIFIED (confianza media) por esa base legal, con la etiqueta «informativo» ya prevista (el HTS solo es vinculante en su publicación oficial). Es una decisión tuya.

## Borradores de correo (NO enviados)

Todos en inglés/alemán/francés/español según destinatario; ninguno se ha enviado. Texto base común: *«Somos Dehesa Index (dehesaindex.com), un panel público de precios agrícolas. Usamos [dataset] en [páginas]. ¿Pueden confirmarnos por escrito bajo qué licencia o condiciones podemos reutilizar estos datos, incluido el uso comercial y la elaboración de series derivadas (cambios porcentuales, series normalizadas)? Citamos siempre la fuente y enlazamos al original.»*

Destinatarios sugeridos: opendata@ble.de (BLE), DroughtMonitor@unl.edu (NDMC), el contacto de FranceAgriMer, CBSA y SNICE (buscar contacto), MAPA.

## Lo que necesito de ti
1. ¿Dehesa Index tiene o tendrá uso comercial (suscripciones, publicidad, API de pago)? Cambia el riesgo de varias fuentes.
2. Autorizar la lectura de las páginas de CBS (y, si quieres, otras) pegando sus URLs.
3. Decidir 10 (`us_tariffs`) y 7 (`world_bank`), que son las más rápidas.
4. Confirmar si quieres que prepare los correos con tu firma.

## Qué NO he hecho
- No he cambiado ningún estado en `data/license-registry.json`.
- No he enviado ningún correo.
- No he confirmado licencias nuevas: todo lo anterior sale del registro y de lo leído en sesiones previas.
