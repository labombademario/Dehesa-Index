# Fuentes de datos y licencias

> Generado por `scripts/build-docs.py` desde `data/license-registry.json` (fuente de verdad). No editar a mano; `Dehesa Quality` falla si esta desactualizado.

Regla: **no se asume ninguna licencia**. `PENDING` significa que la licencia es poco clara o no verificable: la fuente solo se sigue usando si ya estaba, y se muestra como pendiente. `RESTRICTED` y `BLOCKED` no se usan. El gate de CI (`scripts/check-licenses.py`) lo hace cumplir.

Resumen: 18 VERIFIED, 20 PENDING, 4 RESTRICTED, 3 BLOCKED; 5818 series en el catalogo unificado.

## VERIFIED (18)

una pagina oficial concede explicitamente la reutilizacion (uso comercial y derivados) con o sin atribucion.

| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |
|---|---|---|---|---|---|---|---|
| `abs` | Australian Bureau of Statistics (Data API) | AU | CC-BY-4.0 | si/si | si | 76 | Excludes the Coat of Arms, ABS logo, trademarks and unit-record microdata; no endorsement claims. The page does not address the Data API spe… |
| `bis` | Bank for International Settlements (central bank policy rates) | INT | BIS-TERMS | conditional/conditional | si | 1 | Inclusion in a commercial product must not cause an additional charge to users; no implied BIS endorsement; no investment-recommendation fra… |
| `defra` | UK Defra (gov.uk agricultural statistics) | UK | OGL-UK-3.0 | si/si | si | 12 | No implied endorsement; excludes personal data, logos and third-party rights. Only the Agricultural Price Index dataset page was read; milk-… |
| `destatis` | Destatis (GENESIS-Online) | DE | DL-DE-BY-2.0 | si/si | si | 136 | Modifications must be marked as such. |
| `dst_dk` | Statistics Denmark (StatBank) | DK | CC-BY-4.0 | si/si | si | 47 | Disclose modifications; the Statistics Denmark logo cannot be used. |
| `eia` | U.S. Energy Information Administration (Open Data API) | US | US-PD | si/conditional | si | 4 | Do not modify or misrepresent API content while claiming EIA as the source; no implied endorsement; EIA logo needs written permission; API k… |
| `eurostat` | Eurostat | EU | EU-REUSE-2011-833 | conditional/si | si | 471 | Modified data must be flagged prominently with a note that Eurostat is not responsible for the changes. Logos and trademarks excluded. |
| `eurostat_comext` | Eurostat — Comext international trade in goods | EU | EU-REUSE-2011-833 | conditional/si | si | 513 | Modified data must be flagged. Not commercially redisseminable: EFTA reporters' trade data and Austria trade data at CN 8-digit level (keep … |
| `ine_pt` | INE — Statistics Portugal | PT | CC-BY-4.0 | si/si | si | 547 | INE's own terms page and API terms could not be read (robots.txt); verified on one INE dataset page on dados.gov.pt. |
| `nasa_power` | NASA POWER (Prediction Of Worldwide Energy Resources) | US | CC-BY-4.0 | si/si | si | 0 | Do not imply NASA endorsement. The power.larc.nasa.gov services page states no licence; requests should not be finer than about 0.5 degrees. |
| `rba` | Reserve Bank of Australia (statistical tables) | AU | CC-BY-4.0 | si/si | si | 1 | No implied RBA endorsement; no improper commercial exploitation; excludes the RBA logo and banknote images. |
| `statbel` | Statbel (Statistics Belgium) | BE | STATBEL-OPEN | si/si | si | 123 | Automated re-check of the page returned a CAPTCHA on 2026-10-01. |
| `statcan` | Statistics Canada | CA | CUSTOM | si/si | si | 291 | No endorsement claims; no use of the StatCan name or logos; WDS API limits (25 requests/s per IP). |
| `statistik_austria` | Statistik Austria (open.data) | AT | CC-BY-4.0 | si/si | si | 0 | Users are asked (netiquette, not a licence condition) to inform open.data@statistik.gv.at about applications. |
| `usda_fas_gats` | USDA FAS — Global Agricultural Trade System (GATS) | US | CC-BY-4.0 | si/si | si | 0 | The catalogue record dates from 2015 and the GATS site states no terms. No endorsement claims. |
| `usda_fas_psd` | USDA FAS — Production, Supply and Distribution (PSD Online) | US | CC-BY-4.0 | si/si | si | 0 | Licence is declared in dataset metadata, not on the PSD site. No endorsement claims; no USDA logos. |
| `usda_nass` | USDA National Agricultural Statistics Service (Quick Stats) | US | US-PD | si/si | si | 12 | No use of USDA/NASS logos or name to imply endorsement. The Quick Stats API terms page could not be read (robots.txt); API key rules and rat… |
| `world_bank_wdi` | World Bank Open Data (World Development Indicators) | INT | CC-BY-4.0 | si/si | si | 0 | No endorsement; no World Bank names or logos without written consent. |

## PENDING (20)

licencia poco clara, silenciosa o no verificable: se sigue usando solo si ya estaba, y se muestra como pendiente; nunca se inventa un permiso.

| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |
|---|---|---|---|---|---|---|---|
| `abares` | Australia — ABARES | AU | UNKNOWN | unclear/unclear | si | 0 | No automatable source verified. |
| `alberta_ag` | Alberta Agriculture and Irrigation — Weekly Market Review | CA | OGL-Alberta | si/si | si | 9 | No suggestion of official status; excludes personal information, logos and trademarks. |
| `bank_of_canada` | Bank of Canada (Valet API) | CA | CUSTOM | conditional/conditional | si | 1 | No implied endorsement; if offered through paid services users must be told it is free on the Bank's website; do not circumvent Valet rate l… |
| `ble` | BLE — Bundesanstalt für Landwirtschaft und Ernährung (open-data.ble.de) | DE | UNKNOWN | unclear/unclear | si | 129 | open-data.ble.de blocks automated fetching via robots.txt; check each dataset's licence on the portal or GovData, or ask opendata@ble.de. |
| `cbs_nl` | Statistics Netherlands (CBS StatLine) | NL | CUSTOM | unclear/unclear | si | 67 | The page defers to a separate 'Disclaimer open data' that could not be retrieved; a CC BY 4.0 label was declared in earlier project files bu… |
| `cbsa_tariff` | Canada Border Services Agency — Customs Tariff | CA | UNKNOWN | unclear/unclear | si | 0 | Under the Canada.ca terms, commercial redistribution of Government of Canada content needs prior written permission; non-commercial reproduc… |
| `ecb` | European Central Bank (euro reference rates, ECB Data Portal) | EU | ESCB-REUSE | si/unclear | si | 2 | Statistics and metadata must not be modified (keep raw published rates unaltered in JSON copies). Reference rates are for information only, … |
| `eu_agrifood` | European Commission — Agri-food Data Portal (DG AGRI) | EU | UNKNOWN | unclear/unclear | si | 3105 | API rate limiting (HTTP 429). Keep requests modest. |
| `eu_oil_bulletin` | European Commission — Weekly Oil Bulletin (DG ENER) | EU | EU-REUSE-2011-833 | unclear/unclear | si | 1 |  |
| `eu_taric` | European Commission — TARIC / EU customs tariff (DG TAXUD) | EU | UNKNOWN | unclear/unclear | si | 0 | The GitHub mirror is not an authentic source of tariff law; only its code is MIT-licensed. |
| `franceagrimer` | FranceAgriMer (VISIONet) | FR | LO-2.0 | conditional/conditional | si | 47 | Contradiction: data.gouv.fr copies are LO 2.0 but the VISIONet site says all rights reserved. Treat VISIONet-only series as unlicensed until… |
| `mapa_es` | Spain — Ministerio de Agricultura, Pesca y Alimentación (MAPA) | ES | CUSTOM | unclear/unclear | si | 219 | Keep update-date and reuse-condition metadata; third-party content excluded. The sibling SIAR notice explicitly allows commercial use but th… |
| `sima_gpp` | Portugal — SIMA (GPP) weekly prices | PT | UNKNOWN | unclear/unclear | si | 0 | Written authorisation from the GPP would be required before use. |
| `snice_mx` | Mexico — Secretaría de Economía (SNICE, LIGIE tariff) | MX | UNKNOWN | unclear/unclear | no | 0 | If Libre Uso MX applied it would allow commercial use and derivatives with attribution; written confirmation from the Secretaría de Economía… |
| `us_drought_monitor` | U.S. Drought Monitor (NDMC, USDA, NOAA) | US | UNKNOWN | unclear/unclear | si | 0 | Footer shows an NDMC (University of Nebraska-Lincoln) copyright notice; no terms for the statistics web service. Written confirmation advisa… |
| `us_tariffs` | USITC Harmonized Tariff Schedule, CBP trade remedies, USTR | US | US-PD | si/si | no | 0 | The HTS is legally binding only in its official publication: label derived rates as informational. |
| `usda_ams_mars` | USDA AMS Market News (MARS API) | US | US-PD | si/si | si | 2 | Row limits per request (5,000 unregistered / 100,000 registered). No endorsement claims. No MARS-specific terms found. |
| `usda_ers` | USDA Economic Research Service (Food Price Outlook, costs and returns, farm income) | US | US-PD | si/si | si | 0 | ERS API terms apply only to the website-content API (not endorsed or certified by ERS notice). |
| `usda_fas_esr` | USDA FAS — Export Sales Reporting (ESR) | US | US-PD | si/si | no | 0 | api.data.gov keys: 1,000 requests/hour, key must stay private. No endorsement claims. |
| `world_bank` | World Bank — Commodity Price Data (Pink Sheet) | INT | CC-BY-4.0 | si/si | si | 2 | No endorsement; no World Bank names or logos without written consent. |

## RESTRICTED (4)

la reutilizacion tiene limites incompatibles con un sitio comercial (no comercial, sin derivados, promocion): no se usa.

| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |
|---|---|---|---|---|---|---|---|
| `cepea` | Brazil — CEPEA/ESALQ | BR | CUSTOM | no/no | si | 0 | Do not automate without permission. |
| `conab` | Brazil — CONAB | BR | CC-BY-ND-3.0 | unclear/no | si | 0 | No derivatives: unit/currency conversion or re-expression is doubtful; ask gesip@conab.gov.br first. |
| `faostat` | FAO — FAOSTAT | INT | CC-BY-4.0 | no/si | si | 0 | Datasets may not be used for or in conjunction with the promotion of a commercial enterprise or its products or services; no FAO sponsorship… |
| `mla` | Australia — Meat & Livestock Australia (MLA) | AU | CUSTOM | unclear/unclear | si | 0 | Ask MLA for access/licence before any use. |

## BLOCKED (3)

los terminos prohiben el acceso automatico o la redistribucion: no se usa.

| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |
|---|---|---|---|---|---|---|---|
| `ahdb` | AHDB (UK Agriculture and Horticulture Development Board) | UK | CUSTOM | no/no | si | 0 | Bans commercial exploitation, spiders/crawlers/scraping and republishing without written permission. |
| `cme` | CME Group (futures market data) | US | CUSTOM | no/no | no | 0 | Personal, non-commercial, revocable website licence; bans redistribution, derivative works, scripts, robots and crawlers. |
| `dtn` | DTN / Progressive Farmer (fertilizer prices) | US | CUSTOM | no/no | no | 0 | Use, copying, publication or distribution of DTN materials requires express prior written permission. |

## Como anadir una fuente

1. Leer los terminos y anotar la evidencia en `data/license-registry.json` (`status`, `licenseId`, `attributionText`, `evidence`, `verifiedAt`).
2. Si no se puede verificar: `PENDING`, nunca `VERIFIED`.
3. Anadir el workflow en `sources.yml` (se genera con `scripts/gen-workflows.py`) y el contrato en `schemas/registry.json`.
4. `python3 scripts/check-licenses.py` y `python3 scripts/validate-data.py --all` deben pasar.
