# Fuentes de datos y licencias

> Generado por `scripts/build-docs.py` desde `data/license-registry.json` (fuente de verdad). No editar a mano; `Dehesa Quality` falla si esta desactualizado.

Regla: **no se asume ninguna licencia**. `PENDING` significa que la licencia es poco clara o no verificable: la fuente solo se sigue usando si ya estaba, y se muestra como pendiente. `RESTRICTED` y `BLOCKED` no se usan. El gate de CI (`scripts/check-licenses.py`) lo hace cumplir.

Resumen: 48 VERIFIED, 11 PENDING, 4 RESTRICTED, 4 BLOCKED; 6699 series en el catalogo unificado.

## VERIFIED (48)

una pagina oficial concede explicitamente la reutilizacion (uso comercial y derivados) con o sin atribucion.

| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |
|---|---|---|---|---|---|---|---|
| `aafc_drought` | Agriculture and Agri-Food Canada — Canadian Drought Monitor | CA | OGL-Canada | si/si | si | 0 | No suggestion of official status or endorsement by the Information Provider; excludes personal information, third-party rights, official sym… |
| `abs` | Australian Bureau of Statistics (Data API) | AU | CC-BY-4.0 | si/si | si | 76 | Excludes the Coat of Arms, ABS logo, trademarks and unit-record microdata; no endorsement claims. The page does not address the Data API spe… |
| `bank_of_canada` | Bank of Canada (Valet API) | CA | CUSTOM | conditional/si | si | 1 | Attribute the Bank of Canada and indicate changes; commercial reuse requires telling buyers the content is available free on the Bank websit… |
| `bis` | Bank for International Settlements (central bank policy rates) | INT | BIS-TERMS | conditional/conditional | si | 1 | Inclusion in a commercial product must not cause an additional charge to users; no implied BIS endorsement; no investment-recommendation fra… |
| `bls` | U.S. Bureau of Labor Statistics | US | US-PD | si/si | si | 0 | El material de dominio público se puede usar sin permiso; BLS pide citarlo como fuente. Excluye material de terceros que BLS marque como pro… |
| `boe_es` | Spain — Agencia Estatal Boletín Oficial del Estado (BOE), legislación consolidada | ES | CUSTOM | si/si | si | 0 | No desnaturalizar el sentido; citar la fuente con enlace a https://www.boe.es; no sugerir carácter oficial ni patrocinio del BOE; en legisla… |
| `cbs_nl` | Statistics Netherlands (CBS StatLine) | NL | CUSTOM | si/si | si | 67 | Cite CBS as the source (mandatory); state when figures are modified or derived. The separate Dutch 'Disclaimer open data' text was not read. |
| `cgc` | Canadian Grain Commission — Grain Statistics Weekly | CA | OGL-Canada | si/si | si | 0 | No suggestion of official status or endorsement by the Information Provider; excludes personal information, third-party rights, official sym… |
| `defra` | UK Defra (gov.uk agricultural statistics) | UK | OGL-UK-3.0 | si/si | si | 698 | Sin respaldo oficial implícito; excluye datos personales, logotipos y derechos de terceros. Verificado dataset a dataset (4 oct 2026): Agric… |
| `destatis` | Destatis (GENESIS-Online) | DE | DL-DE-BY-2.0 | si/si | si | 138 | Modifications must be marked as such. |
| `dst_dk` | Statistics Denmark (StatBank) | DK | CC-BY-4.0 | si/si | si | 47 | Disclose modifications; the Statistics Denmark logo cannot be used. |
| `ecb` | European Central Bank (euro reference rates, ECB Data Portal) | EU | ESCB-REUSE | si/conditional | si | 2 | Statistics must not be modified and must be used in accordance with the ECB disclaimers. Dehesa shows ECB series as published; any computed … |
| `edo_cdi` | European Drought Observatory (EDO) — Combined Drought Indicator (JRC / Copernicus EMS) | EU | CC-BY-4.0 | si/si | si | 0 | Credit the EDO and indicate changes (we aggregate the 5-km grid to country percentages). Do not imply endorsement by the European Commission… |
| `eia` | U.S. Energy Information Administration (Open Data API) | US | US-PD | si/conditional | si | 4 | Do not modify or misrepresent API content while claiming EIA as the source; no implied endorsement; EIA logo needs written permission; API k… |
| `eu_agrifood` | European Commission — Agri-food Data Portal (DG AGRI) | EU | EU-REUSE-2011-833 | si/conditional | si | 3107 | Reuse conditions of Art. 6: acknowledge the source, do not alter the meaning of the documents, Commission disclaimers apply. Derived figures… |
| `eu_oil_bulletin` | European Commission — Weekly Oil Bulletin (DG ENER) | EU | EU-REUSE-2011-833 | si/conditional | si | 1 | Reuse conditions of Art. 6: acknowledge the source, do not alter the meaning of the documents, Commission disclaimers apply. Derived figures… |
| `eu_taric` | European Commission — TARIC / EU customs tariff (DG TAXUD) | EU | EU-REUSE-2011-833 | si/conditional | si | 0 | Reuse conditions of Art. 6: acknowledge the source, do not alter the meaning of the documents, Commission disclaimers apply. Derived figures… |
| `eur_lex` | EUR-Lex (Publications Office of the European Union) — EU legislation | EU | EU-REUSE-2011-833 | si/si | si | 0 | Acknowledge the source and do not distort the meaning (Decision 2011/833/EU, art. 6). Only the Official Journal is authentic; we publish fig… |
| `eurostat` | Eurostat | EU | EU-REUSE-2011-833 | conditional/si | si | 481 | Modified data must be flagged prominently with a note that Eurostat is not responsible for the changes. Logos and trademarks excluded. |
| `eurostat_comext` | Eurostat — Comext international trade in goods | EU | EU-REUSE-2011-833 | conditional/si | si | 513 | Modified data must be flagged. Not commercially redisseminable: EFTA reporters' trade data and Austria trade data at CN 8-digit level (keep … |
| `franceagrimer` | FranceAgriMer (VISIONet) | FR | LO-2.0 | si/si | si | 47 | Citar siempre la fuente (FranceAgriMer) y la fecha; mantener la integridad de los datos; no implica respaldo oficial. La licencia no cubre d… |
| `hmrc_govuk` | HM Revenue & Customs - GOV.UK VAT guidance | GB | OGL-UK-3.0 | si/si | si | 0 | Third-party material and logos excluded. Same licence the registry already applies to GOV.UK content from Defra. |
| `ine_es` | Instituto Nacional de Estadística (España) | ES | CC-BY-4.0 | si/si | si | 0 | Citar la fuente («Fuente: Sitio web del INE: www.ine.es»; con tratamiento de datos: «Elaboración propia con datos extraídos del sitio web de… |
| `ine_pt` | INE — Statistics Portugal | PT | CC-BY-4.0 | si/si | si | 547 | INE's own terms page and API terms could not be read (robots.txt); verified on one INE dataset page on dados.gov.pt. |
| `insee` | Institut national de la statistique et des études économiques (INSEE) | FR | Etalab-2.0 | si/si | si | 0 | Indicar la fecha de la última actualización cuando se conozca; no alterar el sentido de la información. |
| `irs_sales_tax` | U.S. Internal Revenue Service - Optional State Sales Tax Tables | US | US-PD | si/si | no | 0 | Only the state general sales tax rate is used; local rates are not included. Not tax advice. |
| `mapa_es` | Spain — Ministerio de Agricultura, Pesca y Alimentación (MAPA) | ES | CUSTOM | si/si | si | 219 | Keep update-date and reuse-condition metadata; third-party content excluded. The sibling SIAR notice explicitly allows commercial use but th… |
| `mb_agri` | Manitoba Agriculture — Cattle, Sheep and Goat Prices (subastas de Manitoba) | CA | OpenMB-1.0 | si/si | si | 0 | No suggestion of official status or endorsement; excludes official symbols and logos, personal information and third-party rights. |
| `nasa_power` | NASA POWER (Prediction Of Worldwide Energy Resources) | US | CC-BY-4.0 | si/si | si | 0 | Do not imply NASA endorsement. The power.larc.nasa.gov services page states no licence; requests should not be finer than about 0.5 degrees. |
| `ons` | UK Office for National Statistics (consumer price index) | UK | OGL-UK-3.0 | si/si | si | 0 | Sin respaldo oficial implícito; la OGL excluye fotografías, ilustraciones y vídeos de terceros (no se usan). Solo se usa la serie del índice… |
| `rba` | Reserve Bank of Australia (statistical tables) | AU | CC-BY-4.0 | si/si | si | 1 | No implied RBA endorsement; no improper commercial exploitation; excludes the RBA logo and banknote images. |
| `retsinformation` | Retsinformation (Civilstyrelsen) — Danish statutory orders (bekendtgørelser) | DK | CUSTOM | si/si | si | 0 | Retsinformation's own terms page needs JavaScript and could not be read from a runner; the basis is the statutory exclusion of laws and regu… |
| `rvo` | RVO (Rijksdienst voor Ondernemend Nederland) — market statistics (pigs, calves, cattle, milk) | NL | CUSTOM | si/si | si | 0 | No formal licence name (not CC0/CC BY); the open-data page states re-use is allowed and lists the market-ordering statistics for cereals, ca… |
| `statbel` | Statbel (Statistics Belgium) | BE | STATBEL-OPEN | si/si | si | 123 | Automated re-check of the page returned a CAPTCHA on 2026-10-01. |
| `statcan` | Statistics Canada | CA | CUSTOM | si/si | si | 472 | No endorsement claims; no use of the StatCan name or logos; WDS API limits (25 requests/s per IP). |
| `statistik_austria` | Statistik Austria (open.data) | AT | CC-BY-4.0 | si/si | si | 0 | Users are asked (netiquette, not a licence condition) to inform open.data@statistik.gv.at about applications. |
| `tedb` | European Commission - Taxes in Europe Database (TEDB) | EU | EU-REUSE-2011-833 | si/si | si | 0 | Acknowledge the source and do not distort the meaning (Decision 2011/833/EU). TEDB states the information is provided by the Member States; … |
| `us_tariffs` | USITC Harmonized Tariff Schedule, CBP trade remedies, USTR | US | US-PD | si/si | no | 0 | The HTS is legally binding only in its official publication: label derived rates as informational. |
| `usda_ams_mars` | USDA AMS Market News (MARS API) | US | US-PD | si/si | no | 2 | USDA states that most content is public domain and credit is requested, not required. No agency-specific data licence page exists; the grant… |
| `usda_ers` | USDA Economic Research Service (Food Price Outlook, costs and returns, farm income) | US | US-PD | si/si | no | 0 | USDA states that most content is public domain and credit is requested, not required. No agency-specific data licence page exists; the grant… |
| `usda_fas_esr` | USDA FAS — Export Sales Reporting (ESR) | US | US-PD | si/si | no | 0 | USDA states that most content is public domain and credit is requested, not required. No agency-specific data licence page exists; the grant… |
| `usda_fas_gats` | USDA FAS — Global Agricultural Trade System (GATS) | US | CC-BY-4.0 | si/si | si | 0 | The catalogue record dates from 2015 and the GATS site states no terms. No endorsement claims. |
| `usda_fas_psd` | USDA FAS — Production, Supply and Distribution (PSD Online) | US | CC-BY-4.0 | si/si | si | 0 | Licence is declared in dataset metadata, not on the PSD site. No endorsement claims; no USDA logos. |
| `usda_nass` | USDA National Agricultural Statistics Service (Quick Stats) | US | US-PD | si/si | si | 12 | No use of USDA/NASS logos or name to imply endorsement. The Quick Stats API terms page could not be read (robots.txt); API key rules and rat… |
| `usda_oce_wasde` | USDA Office of the Chief Economist / World Agricultural Outlook Board (WASDE release dates) | US | US-PD | si/si | no | 0 | Credit requested ('U.S. Department of Agriculture'). Some USDA pages carry third-party material that is labelled; only the public release da… |
| `usda_rma` | USDA Risk Management Agency (RMA) — Summary of Business (federal crop insurance) | US | US-PD | si/si | no | 0 | USDA states that most content is public domain and credit is requested, not required; no RMA-specific data licence page was found. The Summa… |
| `vigieau` | VigiEau — Ministère de la Transition écologique (restrictions d'usage de l'eau) | FR | LO-2.0 | si/si | si | 0 | LO 2.0 requires citing the source and the date of last update and not suggesting official endorsement. The data are provided 'à titre indica… |
| `world_bank_wdi` | World Bank Open Data (World Development Indicators) | INT | CC-BY-4.0 | si/si | si | 0 | No endorsement; no World Bank names or logos without written consent. |

## PENDING (11)

licencia poco clara, silenciosa o no verificable: se sigue usando solo si ya estaba, y se muestra como pendiente; nunca se inventa un permiso.

| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |
|---|---|---|---|---|---|---|---|
| `abares` | Australia — ABARES | AU | UNKNOWN | unclear/unclear | si | 0 | No automatable source verified. |
| `agroseguro` | Agroseguro (Agrupacion Espanola de Entidades Aseguradoras de los Seguros Agrarios Combinados) | ES | UNKNOWN | unclear/unclear | si | 0 | Agroseguro is the insurers' pool, not a ministry: MAPA's legal notice does not cover it. Four headline figures (2025 financial year) are sho… |
| `alberta_ag` | Alberta Agriculture and Irrigation — Weekly Market Review | CA | OGL-Alberta | si/si | si | 9 | No suggestion of official status; excludes personal information, logos and trademarks. |
| `ble` | BLE — Bundesanstalt für Landwirtschaft und Ernährung (open-data.ble.de) | DE | UNKNOWN | unclear/unclear | si | 129 | open-data.ble.de blocks automated fetching via robots.txt; check each dataset's licence on the portal or GovData, or ask opendata@ble.de. |
| `cbsa_tariff` | Canada Border Services Agency — Customs Tariff | CA | UNKNOWN | unclear/unclear | si | 0 | Under the Canada.ca terms, commercial redistribution of Government of Canada content needs prior written permission; non-commercial reproduc… |
| `defra_rpa_land` | RPA Land Parcels / Land Covers / Hedge Control | UK | CUSTOM | no/no | si | 0 | Defra indica que no están disponibles para «otros usuarios»; agricultores y agentes tienen condiciones propias. No se ingiere como dataset g… |
| `gep_pt` | GEP — Gabinete de Estratégia e Planeamento (MTSSS, Portugal) | PT | UNKNOWN | unclear/unclear | si | 0 | Los «Termos e Condições» del BTE Online (leídos 2026-10-01) solo tratan privacidad y estadísticas de acceso; no dicen nada sobre reutilizaci… |
| `sima_gpp` | Portugal — SIMA (GPP) weekly prices | PT | UNKNOWN | unclear/unclear | si | 0 | Written authorisation from the GPP would be required before use. |
| `snice_mx` | Mexico — Secretaría de Economía (SNICE, LIGIE tariff) | MX | UNKNOWN | unclear/unclear | no | 0 | If Libre Uso MX applied it would allow commercial use and derivatives with attribution; written confirmation from the Secretaría de Economía… |
| `us_drought_monitor` | U.S. Drought Monitor (NDMC, USDA, NOAA) | US | UNKNOWN | unclear/unclear | si | 0 | Footer shows an NDMC (University of Nebraska-Lincoln) copyright notice; no terms for the statistics web service. Written confirmation advisa… |
| `world_bank` | World Bank — Commodity Price Data (Pink Sheet) | INT | CC-BY-4.0 | si/si | si | 2 | No endorsement; no World Bank names or logos without written consent. |

## RESTRICTED (4)

la reutilizacion tiene limites incompatibles con un sitio comercial (no comercial, sin derivados, promocion): no se usa.

| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |
|---|---|---|---|---|---|---|---|
| `cepea` | Brazil — CEPEA/ESALQ | BR | CUSTOM | no/no | si | 0 | Do not automate without permission. |
| `conab` | Brazil — CONAB | BR | CC-BY-ND-3.0 | unclear/no | si | 0 | No derivatives: unit/currency conversion or re-expression is doubtful; ask gesip@conab.gov.br first. |
| `faostat` | FAO — FAOSTAT | INT | CC-BY-4.0 | no/si | si | 0 | Datasets may not be used for or in conjunction with the promotion of a commercial enterprise or its products or services; no FAO sponsorship… |
| `mla` | Australia — Meat & Livestock Australia (MLA) | AU | CUSTOM | unclear/unclear | si | 0 | Ask MLA for access/licence before any use. |

## BLOCKED (4)

los terminos prohiben el acceso automatico o la redistribucion: no se usa.

| sourceId | Fuente | Pais | Licencia | Comercial/derivados | Atribucion | Series | Restricciones adicionales |
|---|---|---|---|---|---|---|---|
| `ahdb` | AHDB (UK Agriculture and Horticulture Development Board) | UK | CUSTOM | no/no | si | 0 | Bans commercial exploitation, spiders/crawlers/scraping and republishing without written permission. |
| `cme` | CME Group (futures market data) | US | CUSTOM | no/no | no | 0 | Personal, non-commercial, revocable website licence; bans redistribution, derivative works, scripts, robots and crawlers. |
| `defra_ncgl_geo` | Defra / Natural England capas geoespaciales (NCGL, CC BY-NC-SA) | UK | NCGL | no/no | si | 0 | Uso comercial prohibido. Incluye Peaty Soils Location, Moorland Deep Peat, capas de riesgo de tritón crestado y la Second Land Utilisation S… |
| `dtn` | DTN / Progressive Farmer (fertilizer prices) | US | CUSTOM | no/no | no | 0 | Use, copying, publication or distribution of DTN materials requires express prior written permission. |

## Como anadir una fuente

1. Leer los terminos y anotar la evidencia en `data/license-registry.json` (`status`, `licenseId`, `attributionText`, `evidence`, `verifiedAt`).
2. Si no se puede verificar: `PENDING`, nunca `VERIFIED`.
3. Anadir el workflow en `sources.yml` (se genera con `scripts/gen-workflows.py`) y el contrato en `schemas/registry.json`.
4. `python3 scripts/check-licenses.py` y `python3 scripts/validate-data.py --all` deben pasar.

## Datasets derivados de una fuente ya registrada

- **`data/us-cash-bids/`** (ofertas locales de grano de EE. UU.): se lee de USDA AMS Market News (MARS API, `usda_ams_mars`). No hay una fuente propia en el registro porque el License Gate estricto no admite fuentes PENDING nuevas en uso; la nota `files["data/us-cash-bids/"]` de `data/license-registry.json` deja constancia de que la licencia especifica del dataset (algunos informes estatales se elaboran en cooperacion con agencias estatales) **no esta verificada**. Revisar antes de cualquier uso comercial ampliado. La clave de la API (`USDA_MMN_API_KEY`, o `MARS_API_KEY` como alternativa) solo existe como GitHub Actions Secret.
