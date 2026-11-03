/* Dehesa Index — Bloques adicionales del perfil de región (region.html). ES5, sin librerías.
   Cada bloque lee un fichero que ya existe en data/ (los mismos que usan otras páginas) y solo muestra lo que ese fichero publica para la región.
   Lo que no hay se lista como «sin dato» en la propia página; nada se rellena con otra región ni se estima.
   Las sumas por comunidad autónoma de España (provincias del MAPA) y las cuotas sobre el total del país son cálculos de Dehesa Index y se dicen como tales.
   region.js llama a window.DehesaRegionMore(H) con sus utilidades y recibe { T: textos por idioma, mods: bloques por país }. */
(function () {
  'use strict';
  function locName(l) { var g = (window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'); return (l && l.names && l.names[g]) || (l && l.name) || ''; }   // nombre del punto de clima en el idioma de la pagina
  var IX = { es: 0, en: 1, fr: 2, it: 3 };   // los textos «a|b|c|d» de este fichero van en el orden es|en|fr|it
  // Punto de clima (NASA POWER, data/climate.json) que cae dentro de cada región. El Valle del Po (45,0 N 10,5 E) queda en la frontera Lombardía/Emilia-Romaña y no se asigna.
  var CLIM = { US: { IA: 'us-iowa', IL: 'us-illinois', KS: 'us-kansas', ND: 'us-north-dakota', NE: 'us-nebraska', MN: 'us-minnesota', IN: 'us-indiana', OH: 'us-ohio', SD: 'us-south-dakota', MO: 'us-missouri', TX: 'us-texas', OK: 'us-oklahoma', CO: 'us-colorado', MT: 'us-montana', WA: 'us-washington', CA: 'us-california', AR: 'us-arkansas', MS: 'us-mississippi', GA: 'us-georgia', WI: 'us-wisconsin', NC: 'us-north-carolina', AL: 'us-alabama', AK: 'us-alaska', AZ: 'us-arizona', CT: 'us-connecticut', DE: 'us-delaware', FL: 'us-florida', ID: 'us-idaho', KY: 'us-kentucky', LA: 'us-louisiana', MA: 'us-massachusetts', MD: 'us-maryland', ME: 'us-maine', MI: 'us-michigan', NH: 'us-new-hampshire', NJ: 'us-new-jersey', NM: 'us-new-mexico', NV: 'us-nevada', NY: 'us-new-york', OR: 'us-oregon', PA: 'us-pennsylvania', RI: 'us-rhode-island', SC: 'us-south-carolina', TN: 'us-tennessee', UT: 'us-utah', VA: 'us-virginia', VT: 'us-vermont', WV: 'us-west-virginia', WY: 'us-wyoming' }, ES: { AR: 'eu-aragon', CL: 'eu-castilla-leon' }, FR: { CVL: 'eu-beauce' }, DE: { ST: 'eu-saxony-anhalt' },
    CA: { SK: ['ca-saskatchewan-south', 'ca-saskatchewan-north'], AB: ['ca-alberta-south', 'ca-alberta-peace'], MB: 'ca-manitoba', ON: 'ca-ontario', QC: 'ca-quebec' },
    BE: { WLG: 'eu-belgium-hesbaye', VWV: 'eu-belgium-flanders' }, DK: { MID: 'eu-denmark-jutland', SJA: 'eu-denmark-zealand' },
    NL: { FL: 'eu-netherlands-flevoland', GR: 'eu-netherlands-groningen', NB: 'eu-netherlands-brabant' }, AT: { NO: 'eu-austria-marchfeld', OO: 'eu-austria-upper' },
    AU: { WA: 'au-wheatbelt-wa', SA: 'au-sa-mallee', VIC: 'au-vic-wimmera', NSW: ['au-nsw-central-west', 'au-nsw-north'], QLD: ['au-qld-darling-downs', 'au-qld-central'] } };
  // Provincias del MAPA (código INE) por comunidad autónoma, tal como las agrupa el propio MAPA en la encuesta de sacrificio (data/spain-slaughter/census.json)
  var ES_PROV = { PV: ['01', '20', '48'], CM: ['02', '13', '16', '19', '45'], VC: ['03', '12', '46'], AN: ['04', '11', '14', '18', '21', '23', '29', '41'], CL: ['05', '09', '24', '34', '37', '40', '42', '47', '49'], EX: ['06', '10'], IB: ['07'], CT: ['08', '17', '25', '43'], GA: ['15', '27', '32', '36'], AR: ['22', '44', '50'], RI: ['26'], MD: ['28'], MC: ['30'], NC: ['31'], AS: ['33'], CN: ['35', '38'], CB: ['39'] };
  var ES_SLUG = { GA: 'galicia', AS: 'asturias', CB: 'cantabria', PV: 'paisvasco', NC: 'navarra', RI: 'larioja', AR: 'aragon', CT: 'cataluna', IB: 'baleares', CL: 'cyl', MD: 'madrid', CM: 'clm', VC: 'valenciana', MC: 'murcia', EX: 'extremadura', AN: 'andalucia', CN: 'canarias' };
  var ES_GROUPS = [['cereales', 'Cereales|Cereals|Céréales|Cereali'], ['leguminosas', 'Leguminosas grano|Grain legumes|Légumineuses à grain|Leguminose da granella'], ['tuberculos', 'Tubérculos de consumo humano|Tubers for human consumption|Tubercules de consommation|Tuberi per consumo umano'],
    ['industriales', 'Cultivos industriales|Industrial crops|Cultures industrielles|Colture industriali'], ['hortalizas', 'Hortalizas|Vegetables|Légumes|Ortaggi'], ['citricos', 'Cítricos|Citrus|Agrumes|Agrumi'], ['frutales', 'Frutales no cítricos|Non-citrus fruit|Fruits non agrumes|Frutta non agrumi'],
    ['vinedo', 'Viñedo|Vineyards|Vignes|Vigneti'], ['olivar', 'Olivar|Olive groves|Oliveraies|Oliveti'], ['otros_lenosos', 'Otros cultivos leñosos|Other woody crops|Autres cultures ligneuses|Altre colture legnose']];
  var SP = { bovino: 'Bovino|Cattle|Bovins|Bovini', ovino: 'Ovino|Sheep|Ovins|Ovini', caprino: 'Caprino|Goats|Caprins|Caprini', porcino: 'Porcino|Pigs|Porcins|Suini', equino: 'Equino|Horses|Équidés|Equini', aves: 'Aves (miles)|Poultry (thousands)|Volailles (milliers)|Pollame (migliaia)', conejos: 'Conejos (miles)|Rabbits (thousands)|Lapins (milliers)|Conigli (migliaia)' };
  (function (o, em) { Object.keys(em).forEach(function (k) { if (o[k]) o[k] = o[k].split('|').map(function (t) { return em[k] + ' ' + t; }).join('|'); }); })(SP, { bovino: '🐄', ovino: '🐑', caprino: '🐐', porcino: '🐖', equino: '🐴', aves: '🐔', conejos: '🐇' });
  var FR_CERE = { ARA: 'Auvergne-Rhône-Alpes', BFC: 'Bourgogne-Franche-Comté', BRE: 'Bretagne', CVL: 'Centre-Val de Loire', GES: 'Grand-Est', IDF: 'Ile-de-France', NAQ: 'Nouvelle-Aquitaine', OCC: 'Occitanie', PDL: 'Pays-de-la-Loire' };
  var VIG = { vigilance: 'Vigilancia|Vigilance|Vigilance|Vigilanza', alerte: 'Alerta|Alert|Alerte|Allerta', alerte_renforcee: 'Alerta reforzada|Heightened alert|Alerte renforcée|Allerta rafforzata', crise: 'Crisis|Crisis|Crise|Crisi', none: 'Sin restricción|No restriction|Pas de restriction|Nessuna restrizione' };
  var FR_INSEE = { ARA: '84', BFC: '27', BRE: '53', CVL: '24', COR: '94', GES: '44', HDF: '32', IDF: '11', NOR: '28', NAQ: '75', OCC: '76', PDL: '52', PAC: '93' };
  var FR_CROP = { 'soft-wheat': 'Trigo blando|Common wheat|Blé tendre|Frumento tenero', 'durum-wheat': 'Trigo duro|Durum wheat|Blé dur|Frumento duro', barley: 'Cebada|Barley|Orge|Orzo', 'maize-grain-seed': 'Maíz (grano y semilla)|Maize (grain and seed)|Maïs (grain et semence)|Mais (granella e seme)', oats: 'Avena|Oats|Avoine|Avena', rye: 'Centeno|Rye|Seigle|Segale', triticale: 'Triticale|Triticale|Triticale|Triticale', sorghum: 'Sorgo|Sorghum|Sorgho|Sorgo', rapeseed: 'Colza|Rapeseed|Colza|Colza', sunflower: 'Girasol|Sunflower|Tournesol|Girasole', soybeans: 'Soja|Soybeans|Soja|Soia', linseed: 'Lino oleaginoso|Oilseed flax|Lin oléagineux|Lino oleaginoso', 'protein-peas': 'Guisante proteaginoso|Protein peas|Pois protéagineux|Pisello proteico', 'faba-beans': 'Haba (féverole)|Faba beans|Féveroles|Fave', lentils: 'Lenteja|Lentils|Lentilles|Lenticchie' };
  var DE_CROP = { cereals: 'Cereales (con maíz grano)|Cereals (incl. grain maize)|Céréales (avec maïs grain)|Cereali (con mais da granella)', wheat: 'Trigo|Wheat|Blé|Frumento', rye: 'Centeno|Rye|Seigle|Segale', barley: 'Cebada|Barley|Orge|Orzo', oats: 'Avena|Oats|Avoine|Avena', triticale: 'Triticale|Triticale|Triticale|Triticale',
    maize: 'Maíz grano (con CCM)|Grain maize (incl. CCM)|Maïs grain (avec CCM)|Mais da granella (con CCM)', rapeseed: 'Colza y nabina|Rapeseed|Colza et navette|Colza e ravizzone', sunflower: 'Girasol|Sunflower|Tournesol|Girasole', sugarbeet: 'Remolacha azucarera|Sugar beet|Betterave sucrière|Barbabietola da zucchero', potato: 'Patata|Potatoes|Pommes de terre|Patate', silage: 'Maíz forrajero|Silage maize|Maïs fourrage|Mais da foraggio' };
  var DE_SP = { cattle: 'Vacuno|Cattle|Gros bovins|Bovini', calves: 'Terneros|Calves|Veaux|Vitelli', pigs: 'Porcino|Pigs|Porcins|Suini', sheep: 'Ovino|Sheep|Ovins|Ovini' };
  (function (o, em) { Object.keys(em).forEach(function (k) { if (o[k]) o[k] = o[k].split('|').map(function (t) { return em[k] + ' ' + t; }).join('|'); }); })(DE_SP, { cattle: '🐄', calves: '🐮', pigs: '🐖', sheep: '🐑' });
  var NL_PV = { GR: 'PV20', FR: 'PV21', DR: 'PV22', OV: 'PV23', FL: 'PV24', GE: 'PV25', UT: 'PV26', NH: 'PV27', ZH: 'PV28', ZE: 'PV29', NB: 'PV30', LI: 'PV31' };
  var NL_CROP = { A042170: 'Trigo (total)|Wheat (total)|Blé (total)|Frumento (totale)', A042160: 'Cebada (total)|Barley (total)|Orge (total)|Orzo (totale)', A042169: 'Centeno|Rye|Seigle|Segale', A042164: 'Avena|Oats|Avoine|Avena', A042173: 'Triticale|Triticale|Triticale|Triticale',
    A042167: 'Maíz grano|Grain maize|Maïs grain|Mais da granella', A042168: 'Maíz forrajero|Silage maize|Maïs fourrage|Mais da foraggio', A042166: 'Maíz «corn cob mix»|Corn cob mix|Corn cob mix|Corn cob mix', A042180: 'Colza y nabina|Rapeseed|Colza et navette|Colza e ravizzone', A042191: 'Alubias pintas|Brown beans|Haricots bruns|Fagioli bruni',
    A042187: 'Lino textil|Fibre flax|Lin textile|Lino da fibra', A042177: 'Achicoria|Chicory|Chicorée|Cicoria', A042178: 'Cáñamo|Hemp|Chanvre|Canapa', A042355: 'Patata (total)|Potatoes (total)|Pommes de terre (total)|Patate (totale)', A042194: 'Remolacha azucarera|Sugar beet|Betterave sucrière|Barbabietola da zucchero', A042320: 'Cebolla de siembra (total)|Onions, sown (total)|Oignons de semis (total)|Cipolle da semina (totale)' };
  var NL_FM = [['farms', 'Explotaciones|Farms|Exploitations|Aziende'], ['agri_land', 'Superficie agraria (ha)|Agricultural land (ha)|Surface agricole (ha)|Superficie agricola (ha)'], ['arable', 'Tierras de cultivo (ha)|Arable land (ha)|Terres arables (ha)|Seminativi (ha)'], ['grass', 'Pastos y forrajes verdes (ha)|Grass and green fodder (ha)|Herbages et fourrages verts (ha)|Prati e foraggere verdi (ha)'],
    ['horticulture', 'Horticultura al aire libre (ha)|Open-field horticulture (ha)|Horticulture de plein champ (ha)|Orticoltura in pieno campo (ha)'], ['greenhouse', 'Invernaderos (ha)|Greenhouse horticulture (ha)|Serres (ha)|Serre (ha)'], ['cattle', 'Bovino (cabezas)|Cattle (head)|Bovins (têtes)|Bovini (capi)'], ['dairy_cows', 'Vacas lecheras (cabezas)|Dairy cows (head)|Vaches laitières (têtes)|Vacche da latte (capi)'],
    ['pigs', 'Porcino (cabezas)|Pigs (head)|Porcins (têtes)|Suini (capi)'], ['sheep', 'Ovino (cabezas)|Sheep (head)|Ovins (têtes)|Ovini (capi)'], ['goats', 'Caprino (cabezas)|Goats (head)|Caprins (têtes)|Caprini (capi)'], ['chickens', 'Gallinas y pollos (cabezas)|Chickens (head)|Poulets (têtes)|Polli (capi)']];
  var T = {
    es: { eslonjas: 'Lonjas y mercados', usSl: 'Sacrificio comercial', usSlSub: 'Animales sacrificados en mataderos comerciales en el último mes publicado (USDA NASS, informe mensual Livestock Slaughter y Poultry Slaughter). Peso vivo tal como lo publica NASS.', usSp: { cattle: 'Vacuno (500 lb o más)', calves: 'Terneros', hogs: 'Porcino', sheep: 'Ovino (con corderos)', chick: 'Pollos jóvenes', turkey: 'Pavos jóvenes' }, liveW: 'Peso vivo (millones de lb)', headsY: 'Cabezas hace un año', dressW: 'Peso canal medio (lb por cabeza, EE. UU.)',
      usSt: 'Existencias de grano', usStSub: 'Grano almacenado el primer día del trimestre (USDA NASS, Grain Stocks), millones de bushels: total, en la explotación y fuera de ella (almacenes y elevadores).', grain: 'Grano', stTot: 'Total', stOn: 'En la explotación', stOff: 'Fuera de ella', stYa: 'Hace un año', usShare: 'Peso en EE. UU.', usG: { corn: 'Maíz', soy: 'Soja', wheat: 'Trigo' },
      usLand: 'Tierra: valor y arrendamiento', usLandSub: 'Valor medio de la tierra agraria y renta de arrendamiento en efectivo, en dólares por acre (USDA NASS, Land Values y Cash Rents). Un acre son 0,405 ha.', usLk: { lv_all: 'Tierra agraria (con edificios)', lv_crop: 'Tierra de cultivo', lv_crop_irr: 'Cultivo de regadío', lv_crop_dry: 'Cultivo de secano', lv_pasture: 'Pastos' }, rentL: 'Arrendamiento', valueL: 'Valor', usRk: { rt_crop: 'Tierra de cultivo', rt_crop_irr: 'Cultivo de regadío', rt_crop_dry: 'Cultivo de secano', rt_pasture: 'Pastos' }, perAcre: 'USD por acre', countyRents: 'Arrendamiento por condado', county: 'Condado',
      usDa: 'Leche y huevos', usDaSub: 'Producción mensual (USDA NASS, Milk Production y Chickens and Eggs) y precio de la leche recibido por el ganadero.', usDk: { mk_prod: 'Leche producida (millones de lb)', mk_cow: 'Leche por vaca (lb)', mk_cows: 'Vacas de leche (miles)', eg_prod: 'Huevos producidos (millones)', eg_layers: 'Gallinas ponedoras (miles)', pr_milk: 'Precio de la leche (USD por cwt)' },
      usPr: 'Precios recibidos por el agricultor', usPrSub: 'Precio medio que recibe el agricultor del estado en el mes (USDA NASS, Agricultural Prices), frente a la media de EE. UU. del mismo mes. NASS no publica por estado el precio del vacuno ni del porcino.', usPk: { pr_corn: 'Maíz (USD/bu)', pr_soy: 'Soja (USD/bu)', pr_wheat: 'Trigo (USD/bu)', pr_oats: 'Avena (USD/bu)', pr_barley: 'Cebada (USD/bu)', pr_sorghum: 'Sorgo (USD/cwt)', pr_hay: 'Heno, todo (USD/t corta)', pr_alfalfa: 'Heno de alfalfa (USD/t corta)', pr_hay_other: 'Heno sin alfalfa (USD/t corta)', pr_cotton: 'Algodón (USD/lb)', pr_peanuts: 'Cacahuete (USD/lb)', pr_canola: 'Canola (USD/cwt)' }, stateP: 'Estado', usP: 'EE. UU.',
      usCe: 'Censo Agrario 2022', usCeSub: 'Explotaciones, superficie y ventas en el Censo Agrario 2022 (USDA NASS). Es el último censo: el siguiente es el de 2027.', usCk: { ce_farms: 'Explotaciones', ce_acres: 'Superficie de las explotaciones (acres)', ce_avgsize: 'Tamaño medio (acres)', ce_cropland: 'Tierra de cultivo (acres)', ce_irrigated: 'Superficie regada (acres)', ce_sales: 'Ventas agrarias (USD)', ce_crops: 'Ventas de cultivos (USD)', ce_animals: 'Ventas de ganado y productos (USD)', ce_govt: 'Ayudas federales recibidas (USD)', ce_cattle: 'Vacuno (cabezas)', ce_cows_beef: 'Vacas de carne (cabezas)', ce_cows_milk: 'Vacas lecheras (cabezas)', ce_hogs: 'Cerdos (cabezas)', ce_sheep: 'Ovino (cabezas)', ce_goats: 'Caprino (cabezas)', ce_layers: 'Gallinas ponedoras (cabezas)', ce_age: 'Edad media del productor (años)' }, countiesL: 'Por condado', 
      usIn: 'Renta agraria del estado', usInSub: 'Cuentas del sector agrario (USDA ERS, Farm Income and Wealth Statistics), millones de dólares corrientes. El último año puede ser una previsión de ERS.', usIk: { ers_cash_receipts: 'Ingresos en efectivo, total', ers_cr_crops: 'Ingresos por cultivos', ers_cr_animals: 'Ingresos por ganado y productos', ers_govt: 'Pagos del Gobierno (total)', ers_gross_income: 'Renta agraria bruta', ers_expenses: 'Gastos de producción', ers_net_cash: 'Renta neta en efectivo', ers_net_income: 'Renta agraria neta' }, toc: 'En esta página', lazy: 'Mostrar', calcShare: 'Cuota sobre el país: cálculo de Dehesa Index con las cifras de la fuente.',
      clim: 'Clima', climSub: 'Precipitación y temperatura mensuales en un punto de referencia de la región frente a su media 2001-2020 del mismo mes (NASA POWER). Es un punto, no una media de toda la región.', climPt: 'Punto', mMonth: 'Mes', precip: 'Lluvia (mm)', precipA: 'frente a la media', temp: 'Temperatura (°C)', tempA: 'Anomalía', climMore: 'Ver el clima con su histórico',
      ins: 'Seguro agrario federal', insSub: 'Pólizas del programa federal de seguros de cosecha en el estado por año de cosecha (USDA RMA, resumen de negocio), en dólares.', yr: 'Año', liab: 'Capital asegurado', prem: 'Prima total', subs: 'Subvención', indem: 'Indemnizaciones', lossR: 'Siniestralidad', acres: 'Acres', provT: 'provisional',
      lossNote: 'Siniestralidad = indemnizaciones / prima total (cálculo de Dehesa Index). Los años en curso son provisionales: la RMA sigue sumando indemnizaciones.',
      local: 'Mercados locales: ganado y heno', localSub: 'Último informe estatal de subastas de ganado y de heno directo (USDA AMS). Los precios por lote están en la página de precios locales.', repDate: 'Informe del', receipts: 'Cabezas esta semana', weekAgo2: 'Semana anterior', yearAgo2: 'Hace un año', quotes: 'cotizaciones publicadas', alfalfa: 'Alfalfa, por tonelada corta: rango publicado', openLocal: 'Ver precios por lote', cattleK: 'Ganado', hayK: 'Heno', myMarket: 'Abrir «Mi mercado» con este estado',
      insca: 'Seguro agrario', inscaSub: 'Indemnizaciones del seguro de cosechas y del granizo, y primas pagadas por las explotaciones (Statistics Canada), miles de dólares canadienses.', indC: 'Indemnizaciones', hailC: 'Granizo', premC: 'Primas',
      mb: 'Subastas de ganado de Manitoba', mbSub: 'Cabezas vendidas en las subastas de la provincia en la última semana publicada (Manitoba Agriculture).', mart: 'Subasta', headW: 'Cabezas', ytd: 'En el año', openMb: 'Ver precios por categoría en la ficha de Canadá',
      escrops: 'Superficie y producción por grupo de cultivo', escropsSub: 'Campaña más reciente del MAPA (superficies y producciones anuales de cultivos). Suma de las provincias de la comunidad: cálculo de Dehesa Index con las cifras provinciales del MAPA.', grp: 'Grupo', areaHa: 'Superficie (ha)', prodT: 'Producción (t)', shareEs: 'Peso en España', campaign: 'Campaña', provisional: 'provisional', openEs: 'Ver el detalle por provincia y cultivo',
      eslv: 'Censo ganadero', eslvSub: 'Animales por especie en la última encuesta semestral del MAPA (mayo y noviembre). Suma de las provincias de la comunidad: cálculo de Dehesa Index.', species: 'Especie', heads: 'Cabezas', yoyS: 'Un año antes',
      essl: 'Sacrificio de ganado', esslSub: 'Animales sacrificados en mataderos de la comunidad en el último mes publicado (MAPA, encuesta mensual de sacrificio).', carcass: 'Peso canal (t)', headsM: 'Cabezas', sameMonth: 'Mismo mes, año anterior',
      esmilk: 'Leche de vaca', esmilkSub: 'Entregas de leche de vaca a la industria en la comunidad (MAPA, INFOLAC), último mes publicado.', milkProd: 'Leche entregada (t)', fatP: 'Grasa (%)', protP: 'Proteína (%)', farmers: 'Ganaderos con entregas',
      vig: 'Restricciones de agua (sequía)', vigSub: 'Nivel de restricción vigente en cada departamento de la región (VigiEau). Es el nivel más alto entre agua superficial, subterránea y potable.', dept: 'Departamento', level: 'Nivel',
      cere: 'Estado del maíz grano', cereSub: 'Seguimiento semanal de FranceAgriMer (Céré’Obs) en la región: % de la superficie cosechada y por clase de estado.', wk: 'Semana', harvestP: 'Cosechado', condGood: 'Bueno o muy bueno', condFair: 'Medio', condPoor: 'Malo o muy malo',
      frcrops: 'Cultivos de la región', frcropsSub: 'Superficie, rendimiento y producción por cultivo en la región. Estadística agraria de Francia metropolitana (SSP/Agreste) difundida por FranceAgriMer. El año más reciente es provisional.', shareFr: 'Peso en Francia', provW: 'provisional',
      deprod: 'Producción agrícola', deprodSub: 'Cosecha del último año publicado (Destatis). La producción de los últimos meses puede ser una estimación provisional de la fuente.', crop: 'Cultivo', yieldT: 'Rendimiento (dt/ha)', shareDe: 'Peso en Alemania',
      deland: 'Tierra agraria: precio y arrendamiento', delandSub: 'Precio medio de venta de tierra agraria por hectárea y renta de arrendamiento por hectárea (Destatis). Euros corrientes.', kindL: 'Tipo', priceHa: 'Precio de venta (EUR/ha)', salesN: 'Ventas', rentHa: 'Arrendamiento (EUR/ha)', lf: 'Superficie agraria', acker: 'Tierra de cultivo', gruen: 'Pastos permanentes', noLandPrice: 'Destatis no publica el precio de venta de este Land.',
      delive: 'Sacrificio y huevos', deliveSub: 'Sacrificio de animales de origen nacional en el Land (toneladas de peso canal) y producción de huevos en explotaciones con 3.000 o más plazas (Destatis), último año.', slT: 'Sacrificio (t)', eggsM: 'Huevos (miles)', hens: 'Gallinas ponedoras',
      nlcrops: 'Cultivos herbáceos', nlcropsSub: 'Superficie y producción por cultivo en la provincia (CBS). La superficie del año en curso puede publicarse antes que la producción.', openDe: 'Ver la ficha de Alemania: tierra, producción y margen por Land', shareNl: 'Peso en los Países Bajos', nlfarms: 'Explotaciones y ganado', nlfarmsSub: 'Censo agrario de la provincia (CBS), último año publicado de cada variable.', varL: 'Variable', valL: 'Valor', yearL2: 'Año' },
    en: { eslonjas: 'Local markets', usSl: 'Commercial slaughter', usSlSub: 'Animals slaughtered at commercial plants in the latest published month (USDA NASS Livestock Slaughter and Poultry Slaughter). Live weight as published by NASS.', usSp: { cattle: 'Cattle (500 lb and over)', calves: 'Calves', hogs: 'Hogs', sheep: 'Sheep and lambs', chick: 'Young chickens', turkey: 'Young turkeys' }, liveW: 'Live weight (million lb)', headsY: 'Head a year earlier', dressW: 'Average dressed weight (lb per head, U.S.)',
      usSt: 'Grain stocks', usStSub: 'Grain stored on the first day of the quarter (USDA NASS Grain Stocks), million bushels: total, on farm and off farm (warehouses and elevators).', grain: 'Grain', stTot: 'Total', stOn: 'On farm', stOff: 'Off farm', stYa: 'A year earlier', usShare: 'Share of U.S.', usG: { corn: 'Corn', soy: 'Soybeans', wheat: 'Wheat' },
      usLand: 'Land: value and rent', usLandSub: 'Average farmland value and cash rent, in dollars per acre (USDA NASS Land Values and Cash Rents). One acre is 0.405 ha.', usLk: { lv_all: 'Farm real estate (incl. buildings)', lv_crop: 'Cropland', lv_crop_irr: 'Irrigated cropland', lv_crop_dry: 'Non-irrigated cropland', lv_pasture: 'Pasture' }, rentL: 'Cash rent', valueL: 'Value', usRk: { rt_crop: 'Cropland', rt_crop_irr: 'Irrigated cropland', rt_crop_dry: 'Non-irrigated cropland', rt_pasture: 'Pasture' }, perAcre: 'USD per acre', countyRents: 'Cash rent by county', county: 'County',
      usDa: 'Milk and eggs', usDaSub: 'Monthly output (USDA NASS Milk Production and Chickens and Eggs) and the milk price received by farmers.', usDk: { mk_prod: 'Milk produced (million lb)', mk_cow: 'Milk per cow (lb)', mk_cows: 'Milk cows (thousand)', eg_prod: 'Eggs produced (million)', eg_layers: 'Laying hens (thousand)', pr_milk: 'Milk price (USD per cwt)' },
      usPr: 'Prices received by farmers', usPrSub: 'Average price received by the state’s farmers in the month (USDA NASS Agricultural Prices), against the U.S. average for the same month. NASS does not publish cattle or hog prices by state.', usPk: { pr_corn: 'Corn (USD/bu)', pr_soy: 'Soybeans (USD/bu)', pr_wheat: 'Wheat (USD/bu)', pr_oats: 'Oats (USD/bu)', pr_barley: 'Barley (USD/bu)', pr_sorghum: 'Sorghum (USD/cwt)', pr_hay: 'Hay, all (USD/short ton)', pr_alfalfa: 'Alfalfa hay (USD/short ton)', pr_hay_other: 'Hay excl. alfalfa (USD/short ton)', pr_cotton: 'Cotton (USD/lb)', pr_peanuts: 'Peanuts (USD/lb)', pr_canola: 'Canola (USD/cwt)' }, stateP: 'State', usP: 'U.S.',
      usCe: '2022 Census of Agriculture', usCeSub: 'Farms, land and sales in the 2022 Census of Agriculture (USDA NASS). It is the latest census; the next one is 2027.', usCk: { ce_farms: 'Farms', ce_acres: 'Land in farms (acres)', ce_avgsize: 'Average size (acres)', ce_cropland: 'Cropland (acres)', ce_irrigated: 'Irrigated land (acres)', ce_sales: 'Agricultural sales (USD)', ce_crops: 'Crop sales (USD)', ce_animals: 'Livestock and product sales (USD)', ce_govt: 'Federal program receipts (USD)', ce_cattle: 'Cattle and calves (head)', ce_cows_beef: 'Beef cows (head)', ce_cows_milk: 'Milk cows (head)', ce_hogs: 'Hogs (head)', ce_sheep: 'Sheep and lambs (head)', ce_goats: 'Goats (head)', ce_layers: 'Laying hens (head)', ce_age: 'Average producer age (years)' }, countiesL: 'By county', 
      usIn: 'State farm income', usInSub: 'Farm sector accounts (USDA ERS Farm Income and Wealth Statistics), million current dollars. The latest year may be an ERS forecast.', usIk: { ers_cash_receipts: 'Cash receipts, total', ers_cr_crops: 'Crop receipts', ers_cr_animals: 'Livestock and product receipts', ers_govt: 'Government payments (total)', ers_gross_income: 'Gross farm income', ers_expenses: 'Production expenses', ers_net_cash: 'Net cash farm income', ers_net_income: 'Net farm income' }, toc: 'On this page', lazy: 'Show', calcShare: 'Share of the country: Dehesa Index calculation with the source’s figures.',
      clim: 'Weather', climSub: 'Monthly rainfall and temperature at a reference point in the region against its 2001-2020 average for the same month (NASA POWER). It is one point, not an average for the whole region.', climPt: 'Point', mMonth: 'Month', precip: 'Rain (mm)', precipA: 'vs. average', temp: 'Temperature (°C)', tempA: 'Anomaly', climMore: 'See the weather with its history',
      ins: 'Federal crop insurance', insSub: 'Policies in the federal crop insurance programme in the state by crop year (USDA RMA, summary of business), in dollars.', yr: 'Year', liab: 'Liability', prem: 'Total premium', subs: 'Subsidy', indem: 'Indemnities', lossR: 'Loss ratio', acres: 'Acres', provT: 'provisional',
      lossNote: 'Loss ratio = indemnities / total premium (Dehesa Index calculation). Current years are provisional: RMA keeps adding indemnities.',
      local: 'Local markets: cattle and hay', localSub: 'Latest state livestock auction and direct hay reports (USDA AMS). Lot-by-lot prices are on the local prices page.', repDate: 'Report of', receipts: 'Head this week', weekAgo2: 'Previous week', yearAgo2: 'A year ago', quotes: 'published quotes', alfalfa: 'Alfalfa, per short ton: published range', openLocal: 'See lot prices', cattleK: 'Cattle', hayK: 'Hay', myMarket: 'Open “My market” with this state',
      insca: 'Crop insurance', inscaSub: 'Crop and hail insurance indemnities and premiums paid by farms (Statistics Canada), thousand Canadian dollars.', indC: 'Indemnities', hailC: 'Hail', premC: 'Premiums',
      mb: 'Manitoba cattle auctions', mbSub: 'Head sold at the province’s auction marts in the latest published week (Manitoba Agriculture).', mart: 'Auction mart', headW: 'Head', ytd: 'Year to date', openMb: 'See prices by class in the Canada profile',
      escrops: 'Area and production by crop group', escropsSub: 'Latest MAPA campaign (annual crop areas and production). Sum of the community’s provinces: Dehesa Index calculation with MAPA’s provincial figures.', grp: 'Group', areaHa: 'Area (ha)', prodT: 'Production (t)', shareEs: 'Share of Spain', campaign: 'Campaign', provisional: 'provisional', openEs: 'See the detail by province and crop',
      eslv: 'Livestock census', eslvSub: 'Animals by species in MAPA’s latest half-yearly survey (May and November). Sum of the community’s provinces: Dehesa Index calculation.', species: 'Species', heads: 'Head', yoyS: 'A year earlier',
      essl: 'Livestock slaughter', esslSub: 'Animals slaughtered in the community’s abattoirs in the latest published month (MAPA, monthly slaughter survey).', carcass: 'Carcass weight (t)', headsM: 'Head', sameMonth: 'Same month, previous year',
      esmilk: 'Cow’s milk', esmilkSub: 'Cow’s milk deliveries to dairies in the community (MAPA, INFOLAC), latest published month.', milkProd: 'Milk delivered (t)', fatP: 'Fat (%)', protP: 'Protein (%)', farmers: 'Farmers delivering',
      vig: 'Water restrictions (drought)', vigSub: 'Restriction level in force in each département of the region (VigiEau): the highest of surface water, groundwater and drinking water.', dept: 'Département', level: 'Level',
      cere: 'Grain maize condition', cereSub: 'FranceAgriMer weekly monitoring (Céré’Obs) in the region: % of area harvested and by condition class.', wk: 'Week', harvestP: 'Harvested', condGood: 'Good or very good', condFair: 'Fair', condPoor: 'Poor or very poor',
      frcrops: 'Crops in the region', frcropsSub: 'Area, yield and production by crop in the region. Metropolitan France agricultural statistics (SSP/Agreste) published by FranceAgriMer. The most recent year is provisional.', shareFr: 'Share of France', provW: 'provisional',
      deprod: 'Crop production', deprodSub: 'Harvest of the latest published year (Destatis). The most recent year may be a provisional estimate from the source.', crop: 'Crop', yieldT: 'Yield (dt/ha)', shareDe: 'Share of Germany',
      deland: 'Farmland: price and rent', delandSub: 'Average sale price of farmland per hectare and rent per hectare (Destatis). Current euros.', kindL: 'Type', priceHa: 'Sale price (EUR/ha)', salesN: 'Sales', rentHa: 'Rent (EUR/ha)', lf: 'Agricultural land', acker: 'Arable land', gruen: 'Permanent grassland', noLandPrice: 'Destatis does not publish the sale price for this Land.',
      delive: 'Slaughter and eggs', deliveSub: 'Slaughter of domestic animals in the Land (tonnes carcass weight) and egg production on farms with 3,000 or more places (Destatis), latest year.', slT: 'Slaughter (t)', eggsM: 'Eggs (thousand)', hens: 'Laying hens',
      nlcrops: 'Arable crops', nlcropsSub: 'Area and production by crop in the province (CBS). The current year’s area may be published before production.', openDe: 'See the Germany profile: land, production and margin by Land', shareNl: 'Share of the Netherlands', nlfarms: 'Farms and livestock', nlfarmsSub: 'Agricultural census of the province (CBS), latest published year of each variable.', varL: 'Variable', valL: 'Value', yearL2: 'Year' },
    fr: { eslonjas: 'Marchés locaux', usSl: 'Abattages commerciaux', usSlSub: 'Animaux abattus dans les abattoirs commerciaux le dernier mois publié (USDA NASS, Livestock Slaughter et Poultry Slaughter). Poids vif tel que publié par NASS.', usSp: { cattle: 'Bovins (500 lb et plus)', calves: 'Veaux', hogs: 'Porcins', sheep: 'Ovins (avec agneaux)', chick: 'Jeunes poulets', turkey: 'Jeunes dindes' }, liveW: 'Poids vif (millions de lb)', headsY: 'Têtes il y a un an', dressW: 'Poids carcasse moyen (lb par tête, États-Unis)',
      usSt: 'Stocks de grains', usStSub: 'Grain stocké le premier jour du trimestre (USDA NASS, Grain Stocks), millions de boisseaux : total, à la ferme et hors ferme (silos et élévateurs).', grain: 'Grain', stTot: 'Total', stOn: 'À la ferme', stOff: 'Hors ferme', stYa: 'Il y a un an', usShare: 'Part des États-Unis', usG: { corn: 'Maïs', soy: 'Soja', wheat: 'Blé' },
      usLand: 'Terres : valeur et fermage', usLandSub: 'Valeur moyenne des terres agricoles et fermage en espèces, en dollars par acre (USDA NASS, Land Values et Cash Rents). Un acre vaut 0,405 ha.', usLk: { lv_all: 'Terres agricoles (avec bâtiments)', lv_crop: 'Terres de culture', lv_crop_irr: 'Cultures irriguées', lv_crop_dry: 'Cultures non irriguées', lv_pasture: 'Pâturages' }, rentL: 'Fermage', valueL: 'Valeur', usRk: { rt_crop: 'Terres de culture', rt_crop_irr: 'Cultures irriguées', rt_crop_dry: 'Cultures non irriguées', rt_pasture: 'Pâturages' }, perAcre: 'USD par acre', countyRents: 'Fermage par comté', county: 'Comté',
      usDa: 'Lait et œufs', usDaSub: 'Production mensuelle (USDA NASS, Milk Production et Chickens and Eggs) et prix du lait reçu par l’éleveur.', usDk: { mk_prod: 'Lait produit (millions de lb)', mk_cow: 'Lait par vache (lb)', mk_cows: 'Vaches laitières (milliers)', eg_prod: 'Œufs produits (millions)', eg_layers: 'Poules pondeuses (milliers)', pr_milk: 'Prix du lait (USD par cwt)' },
      usPr: 'Prix reçus par les agriculteurs', usPrSub: 'Prix moyen reçu par les agriculteurs de l’État dans le mois (USDA NASS, Agricultural Prices), comparé à la moyenne des États-Unis du même mois. NASS ne publie pas les prix des bovins ni des porcins par État.', usPk: { pr_corn: 'Maïs (USD/bu)', pr_soy: 'Soja (USD/bu)', pr_wheat: 'Blé (USD/bu)', pr_oats: 'Avoine (USD/bu)', pr_barley: 'Orge (USD/bu)', pr_sorghum: 'Sorgho (USD/cwt)', pr_hay: 'Foin, total (USD/t courte)', pr_alfalfa: 'Foin de luzerne (USD/t courte)', pr_hay_other: 'Foin hors luzerne (USD/t courte)', pr_cotton: 'Coton (USD/lb)', pr_peanuts: 'Arachide (USD/lb)', pr_canola: 'Canola (USD/cwt)' }, stateP: 'État', usP: 'États-Unis',
      usCe: 'Recensement agricole 2022', usCeSub: 'Exploitations, superficie et ventes au recensement agricole 2022 (USDA NASS). C’est le dernier recensement ; le prochain est celui de 2027.', usCk: { ce_farms: 'Exploitations', ce_acres: 'Superficie des exploitations (acres)', ce_avgsize: 'Taille moyenne (acres)', ce_cropland: 'Terres de culture (acres)', ce_irrigated: 'Superficie irriguée (acres)', ce_sales: 'Ventes agricoles (USD)', ce_crops: 'Ventes de cultures (USD)', ce_animals: 'Ventes d’animaux et produits (USD)', ce_govt: 'Aides fédérales reçues (USD)', ce_cattle: 'Bovins (têtes)', ce_cows_beef: 'Vaches allaitantes (têtes)', ce_cows_milk: 'Vaches laitières (têtes)', ce_hogs: 'Porcs (têtes)', ce_sheep: 'Ovins (têtes)', ce_goats: 'Caprins (têtes)', ce_layers: 'Poules pondeuses (têtes)', ce_age: 'Âge moyen du producteur (ans)' }, countiesL: 'Par comté', 
      usIn: 'Revenu agricole de l’État', usInSub: 'Comptes du secteur agricole (USDA ERS, Farm Income and Wealth Statistics), millions de dollars courants. La dernière année peut être une prévision de l’ERS.', usIk: { ers_cash_receipts: 'Recettes monétaires, total', ers_cr_crops: 'Recettes des cultures', ers_cr_animals: 'Recettes de l’élevage', ers_govt: 'Paiements de l’État fédéral (total)', ers_gross_income: 'Revenu agricole brut', ers_expenses: 'Dépenses de production', ers_net_cash: 'Revenu net monétaire', ers_net_income: 'Revenu agricole net' }, toc: 'Sur cette page', lazy: 'Afficher', calcShare: 'Part du pays : calcul de Dehesa Index avec les chiffres de la source.',
      clim: 'Climat', climSub: 'Pluie et température mensuelles en un point de référence de la région, comparées à la moyenne 2001-2020 du même mois (NASA POWER). C’est un point, pas une moyenne de toute la région.', climPt: 'Point', mMonth: 'Mois', precip: 'Pluie (mm)', precipA: 'par rapport à la moyenne', temp: 'Température (°C)', tempA: 'Anomalie', climMore: 'Voir le climat avec son historique',
      ins: 'Assurance récolte fédérale', insSub: 'Contrats du programme fédéral d’assurance récolte dans l’État par campagne (USDA RMA, résumé d’activité), en dollars.', yr: 'Année', liab: 'Capital assuré', prem: 'Prime totale', subs: 'Subvention', indem: 'Indemnités', lossR: 'Sinistralité', acres: 'Acres', provT: 'provisoire',
      lossNote: 'Sinistralité = indemnités / prime totale (calcul de Dehesa Index). Les années en cours sont provisoires : la RMA continue d’ajouter des indemnités.',
      local: 'Marchés locaux : bétail et foin', localSub: 'Dernier rapport de l’État sur les enchères de bétail et le foin en vente directe (USDA AMS). Les prix par lot sont sur la page des prix locaux.', repDate: 'Rapport du', receipts: 'Têtes cette semaine', weekAgo2: 'Semaine précédente', yearAgo2: 'Il y a un an', quotes: 'cotations publiées', alfalfa: 'Luzerne, par tonne courte : fourchette publiée', openLocal: 'Voir les prix par lot', cattleK: 'Bétail', hayK: 'Foin', myMarket: 'Ouvrir « Mon marché » avec cet État',
      insca: 'Assurance récolte', inscaSub: 'Indemnités de l’assurance récolte et grêle, et primes payées par les exploitations (Statistique Canada), milliers de dollars canadiens.', indC: 'Indemnités', hailC: 'Grêle', premC: 'Primes',
      mb: 'Enchères de bétail du Manitoba', mbSub: 'Têtes vendues dans les marchés aux enchères de la province pendant la dernière semaine publiée (Manitoba Agriculture).', mart: 'Marché', headW: 'Têtes', ytd: 'Depuis le début de l’année', openMb: 'Voir les prix par catégorie dans la fiche Canada',
      escrops: 'Superficie et production par groupe de cultures', escropsSub: 'Dernière campagne du MAPA (superficies et productions annuelles). Somme des provinces de la communauté : calcul de Dehesa Index avec les chiffres provinciaux du MAPA.', grp: 'Groupe', areaHa: 'Superficie (ha)', prodT: 'Production (t)', shareEs: 'Part de l’Espagne', campaign: 'Campagne', provisional: 'provisoire', openEs: 'Voir le détail par province et culture',
      eslv: 'Recensement du cheptel', eslvSub: 'Animaux par espèce dans la dernière enquête semestrielle du MAPA (mai et novembre). Somme des provinces de la communauté : calcul de Dehesa Index.', species: 'Espèce', heads: 'Têtes', yoyS: 'Un an avant',
      essl: 'Abattages', esslSub: 'Animaux abattus dans les abattoirs de la communauté le dernier mois publié (MAPA, enquête mensuelle d’abattage).', carcass: 'Poids carcasse (t)', headsM: 'Têtes', sameMonth: 'Même mois, année précédente',
      esmilk: 'Lait de vache', esmilkSub: 'Livraisons de lait de vache à l’industrie dans la communauté (MAPA, INFOLAC), dernier mois publié.', milkProd: 'Lait livré (t)', fatP: 'Matière grasse (%)', protP: 'Protéines (%)', farmers: 'Éleveurs livrant',
      vig: 'Restrictions d’eau (sécheresse)', vigSub: 'Niveau de restriction en vigueur dans chaque département de la région (VigiEau) : le plus élevé entre eaux superficielles, souterraines et potable.', dept: 'Département', level: 'Niveau',
      cere: 'État du maïs grain', cereSub: 'Suivi hebdomadaire de FranceAgriMer (Céré’Obs) dans la région : % de la surface récoltée et par classe d’état.', wk: 'Semaine', harvestP: 'Récolté', condGood: 'Bon ou très bon', condFair: 'Moyen', condPoor: 'Mauvais ou très mauvais',
      frcrops: 'Cultures de la région', frcropsSub: 'Surface, rendement et production par culture dans la région. Statistique agricole de la France métropolitaine (SSP/Agreste) diffusée par FranceAgriMer. L’année la plus récente est provisoire.', shareFr: 'Part de la France', provW: 'provisoire',
      deprod: 'Production végétale', deprodSub: 'Récolte de la dernière année publiée (Destatis). L’année la plus récente peut être une estimation provisoire de la source.', crop: 'Culture', yieldT: 'Rendement (q/ha)', shareDe: 'Part de l’Allemagne',
      deland: 'Terres agricoles : prix et fermage', delandSub: 'Prix moyen de vente des terres agricoles par hectare et fermage par hectare (Destatis). Euros courants.', kindL: 'Type', priceHa: 'Prix de vente (EUR/ha)', salesN: 'Ventes', rentHa: 'Fermage (EUR/ha)', lf: 'Surface agricole', acker: 'Terres arables', gruen: 'Prairies permanentes', noLandPrice: 'Destatis ne publie pas le prix de vente de ce Land.',
      delive: 'Abattages et œufs', deliveSub: 'Abattages d’animaux d’origine nationale dans le Land (tonnes de poids carcasse) et production d’œufs dans les élevages de 3 000 places ou plus (Destatis), dernière année.', slT: 'Abattages (t)', eggsM: 'Œufs (milliers)', hens: 'Poules pondeuses',
      nlcrops: 'Grandes cultures', nlcropsSub: 'Superficie et production par culture dans la province (CBS). La superficie de l’année en cours peut être publiée avant la production.', openDe: 'Voir la fiche Allemagne : terres, production et marge par Land', shareNl: 'Part des Pays-Bas', nlfarms: 'Exploitations et cheptel', nlfarmsSub: 'Recensement agricole de la province (CBS), dernière année publiée de chaque variable.', varL: 'Variable', valL: 'Valeur', yearL2: 'Année' },
    it: { eslonjas: 'Mercati locali', usSl: 'Macellazioni commerciali', usSlSub: 'Animali macellati nei macelli commerciali nell’ultimo mese pubblicato (USDA NASS, Livestock Slaughter e Poultry Slaughter). Peso vivo come pubblicato da NASS.', usSp: { cattle: 'Bovini (500 lb e oltre)', calves: 'Vitelli', hogs: 'Suini', sheep: 'Ovini (con agnelli)', chick: 'Polli giovani', turkey: 'Tacchini giovani' }, liveW: 'Peso vivo (milioni di lb)', headsY: 'Capi un anno prima', dressW: 'Peso carcassa medio (lb per capo, USA)',
      usSt: 'Scorte di cereali', usStSub: 'Cereali immagazzinati il primo giorno del trimestre (USDA NASS, Grain Stocks), milioni di bushel: totale, in azienda e fuori azienda (magazzini ed elevatori).', grain: 'Cereale', stTot: 'Totale', stOn: 'In azienda', stOff: 'Fuori azienda', stYa: 'Un anno prima', usShare: 'Quota degli USA', usG: { corn: 'Mais', soy: 'Soia', wheat: 'Frumento' },
      usLand: 'Terreni: valore e affitto', usLandSub: 'Valore medio dei terreni agricoli e canone d’affitto in contanti, in dollari per acro (USDA NASS, Land Values e Cash Rents). Un acro è 0,405 ha.', usLk: { lv_all: 'Terreni agricoli (con edifici)', lv_crop: 'Seminativi', lv_crop_irr: 'Seminativi irrigui', lv_crop_dry: 'Seminativi asciutti', lv_pasture: 'Pascoli' }, rentL: 'Affitto', valueL: 'Valore', usRk: { rt_crop: 'Seminativi', rt_crop_irr: 'Seminativi irrigui', rt_crop_dry: 'Seminativi asciutti', rt_pasture: 'Pascoli' }, perAcre: 'USD per acro', countyRents: 'Affitto per contea', county: 'Contea',
      usDa: 'Latte e uova', usDaSub: 'Produzione mensile (USDA NASS, Milk Production e Chickens and Eggs) e prezzo del latte ricevuto dall’allevatore.', usDk: { mk_prod: 'Latte prodotto (milioni di lb)', mk_cow: 'Latte per vacca (lb)', mk_cows: 'Vacche da latte (migliaia)', eg_prod: 'Uova prodotte (milioni)', eg_layers: 'Galline ovaiole (migliaia)', pr_milk: 'Prezzo del latte (USD per cwt)' },
      usPr: 'Prezzi ricevuti dagli agricoltori', usPrSub: 'Prezzo medio ricevuto dagli agricoltori dello Stato nel mese (USDA NASS, Agricultural Prices), rispetto alla media USA dello stesso mese. NASS non pubblica per Stato i prezzi dei bovini né dei suini.', usPk: { pr_corn: 'Mais (USD/bu)', pr_soy: 'Soia (USD/bu)', pr_wheat: 'Frumento (USD/bu)', pr_oats: 'Avena (USD/bu)', pr_barley: 'Orzo (USD/bu)', pr_sorghum: 'Sorgo (USD/cwt)', pr_hay: 'Fieno, totale (USD/t corta)', pr_alfalfa: 'Fieno di erba medica (USD/t corta)', pr_hay_other: 'Fieno senza erba medica (USD/t corta)', pr_cotton: 'Cotone (USD/lb)', pr_peanuts: 'Arachidi (USD/lb)', pr_canola: 'Canola (USD/cwt)' }, stateP: 'Stato', usP: 'USA',
      usCe: 'Censimento agricolo 2022', usCeSub: 'Aziende, superficie e vendite nel censimento agricolo 2022 (USDA NASS). È l’ultimo censimento; il prossimo è quello del 2027.', usCk: { ce_farms: 'Aziende', ce_acres: 'Superficie delle aziende (acri)', ce_avgsize: 'Dimensione media (acri)', ce_cropland: 'Seminativi (acri)', ce_irrigated: 'Superficie irrigata (acri)', ce_sales: 'Vendite agricole (USD)', ce_crops: 'Vendite di colture (USD)', ce_animals: 'Vendite di bestiame e prodotti (USD)', ce_govt: 'Aiuti federali ricevuti (USD)', ce_cattle: 'Bovini (capi)', ce_cows_beef: 'Vacche da carne (capi)', ce_cows_milk: 'Vacche da latte (capi)', ce_hogs: 'Suini (capi)', ce_sheep: 'Ovini (capi)', ce_goats: 'Caprini (capi)', ce_layers: 'Galline ovaiole (capi)', ce_age: 'Età media del produttore (anni)' }, countiesL: 'Per contea', 
      usIn: 'Reddito agricolo dello Stato', usInSub: 'Conti del settore agricolo (USDA ERS, Farm Income and Wealth Statistics), milioni di dollari correnti. L’ultimo anno può essere una previsione dell’ERS.', usIk: { ers_cash_receipts: 'Ricavi in contanti, totale', ers_cr_crops: 'Ricavi delle colture', ers_cr_animals: 'Ricavi di bestiame e prodotti', ers_govt: 'Pagamenti del governo (totale)', ers_gross_income: 'Reddito agricolo lordo', ers_expenses: 'Spese di produzione', ers_net_cash: 'Reddito netto in contanti', ers_net_income: 'Reddito agricolo netto' }, toc: 'In questa pagina', lazy: 'Mostra', calcShare: 'Quota del paese: calcolo di Dehesa Index con le cifre della fonte.',
      clim: 'Clima', climSub: 'Pioggia e temperatura mensili in un punto di riferimento della regione rispetto alla media 2001-2020 dello stesso mese (NASA POWER). È un punto, non una media dell’intera regione.', climPt: 'Punto', mMonth: 'Mese', precip: 'Pioggia (mm)', precipA: 'rispetto alla media', temp: 'Temperatura (°C)', tempA: 'Anomalia', climMore: 'Vedi il clima con il suo storico',
      ins: 'Assicurazione federale sui raccolti', insSub: 'Polizze del programma federale di assicurazione sui raccolti nello Stato per annata (USDA RMA, riepilogo dell’attività), in dollari.', yr: 'Anno', liab: 'Capitale assicurato', prem: 'Premio totale', subs: 'Sussidio', indem: 'Indennizzi', lossR: 'Sinistralità', acres: 'Acri', provT: 'provvisorio',
      lossNote: 'Sinistralità = indennizzi / premio totale (calcolo di Dehesa Index). Gli anni in corso sono provvisori: la RMA continua ad aggiungere indennizzi.',
      local: 'Mercati locali: bestiame e fieno', localSub: 'Ultimo rapporto statale sulle aste di bestiame e sul fieno in vendita diretta (USDA AMS). I prezzi per lotto sono nella pagina dei prezzi locali.', repDate: 'Rapporto del', receipts: 'Capi questa settimana', weekAgo2: 'Settimana precedente', yearAgo2: 'Un anno fa', quotes: 'quotazioni pubblicate', alfalfa: 'Erba medica, per tonnellata corta: intervallo pubblicato', openLocal: 'Vedi i prezzi per lotto', cattleK: 'Bestiame', hayK: 'Fieno', myMarket: 'Apri «Il mio mercato» con questo Stato',
      insca: 'Assicurazione sui raccolti', inscaSub: 'Indennizzi dell’assicurazione sui raccolti e contro la grandine, e premi pagati dalle aziende (Statistics Canada), migliaia di dollari canadesi.', indC: 'Indennizzi', hailC: 'Grandine', premC: 'Premi',
      mb: 'Aste di bestiame del Manitoba', mbSub: 'Capi venduti nelle aste della provincia nell’ultima settimana pubblicata (Manitoba Agriculture).', mart: 'Asta', headW: 'Capi', ytd: 'Da inizio anno', openMb: 'Vedi i prezzi per categoria nella scheda Canada',
      escrops: 'Superficie e produzione per gruppo di colture', escropsSub: 'Ultima campagna del MAPA (superfici e produzioni annuali). Somma delle province della comunità: calcolo di Dehesa Index con le cifre provinciali del MAPA.', grp: 'Gruppo', areaHa: 'Superficie (ha)', prodT: 'Produzione (t)', shareEs: 'Quota della Spagna', campaign: 'Campagna', provisional: 'provvisorio', openEs: 'Vedi il dettaglio per provincia e coltura',
      eslv: 'Censimento del bestiame', eslvSub: 'Animali per specie nell’ultima indagine semestrale del MAPA (maggio e novembre). Somma delle province della comunità: calcolo di Dehesa Index.', species: 'Specie', heads: 'Capi', yoyS: 'Un anno prima',
      essl: 'Macellazioni', esslSub: 'Animali macellati nei macelli della comunità nell’ultimo mese pubblicato (MAPA, indagine mensile sulle macellazioni).', carcass: 'Peso carcassa (t)', headsM: 'Capi', sameMonth: 'Stesso mese, anno precedente',
      esmilk: 'Latte vaccino', esmilkSub: 'Consegne di latte vaccino all’industria nella comunità (MAPA, INFOLAC), ultimo mese pubblicato.', milkProd: 'Latte consegnato (t)', fatP: 'Grasso (%)', protP: 'Proteine (%)', farmers: 'Allevatori con consegne',
      vig: 'Restrizioni idriche (siccità)', vigSub: 'Livello di restrizione in vigore in ogni dipartimento della regione (VigiEau): il più alto tra acque superficiali, sotterranee e potabili.', dept: 'Dipartimento', level: 'Livello',
      cere: 'Stato del mais da granella', cereSub: 'Monitoraggio settimanale di FranceAgriMer (Céré’Obs) nella regione: % della superficie raccolta e per classe di stato.', wk: 'Settimana', harvestP: 'Raccolto', condGood: 'Buono o molto buono', condFair: 'Medio', condPoor: 'Scarso o molto scarso',
      frcrops: 'Colture della regione', frcropsSub: 'Superficie, resa e produzione per coltura nella regione. Statistica agricola della Francia metropolitana (SSP/Agreste) diffusa da FranceAgriMer. L’anno più recente è provvisorio.', shareFr: 'Quota della Francia', provW: 'provvisorio',
      deprod: 'Produzione agricola', deprodSub: 'Raccolto dell’ultimo anno pubblicato (Destatis). L’anno più recente può essere una stima provvisoria della fonte.', crop: 'Coltura', yieldT: 'Resa (q/ha)', shareDe: 'Quota della Germania',
      deland: 'Terreni agricoli: prezzo e affitto', delandSub: 'Prezzo medio di vendita dei terreni agricoli per ettaro e canone d’affitto per ettaro (Destatis). Euro correnti.', kindL: 'Tipo', priceHa: 'Prezzo di vendita (EUR/ha)', salesN: 'Vendite', rentHa: 'Affitto (EUR/ha)', lf: 'Superficie agricola', acker: 'Seminativi', gruen: 'Prati permanenti', noLandPrice: 'Destatis non pubblica il prezzo di vendita di questo Land.',
      delive: 'Macellazioni e uova', deliveSub: 'Macellazioni di animali di origine nazionale nel Land (tonnellate di peso carcassa) e produzione di uova negli allevamenti con 3.000 o più posti (Destatis), ultimo anno.', slT: 'Macellazioni (t)', eggsM: 'Uova (migliaia)', hens: 'Galline ovaiole',
      nlcrops: 'Seminativi', nlcropsSub: 'Superficie e produzione per coltura nella provincia (CBS). La superficie dell’anno in corso può essere pubblicata prima della produzione.', openDe: 'Vedi la scheda Germania: terreni, produzione e margine per Land', shareNl: 'Quota dei Paesi Bassi', nlfarms: 'Aziende e bestiame', nlfarmsSub: 'Censimento agricolo della provincia (CBS), ultimo anno pubblicato di ogni variabile.', varL: 'Variabile', valL: 'Valore', yearL2: 'Anno' }
  };

  var T2 = {
    es: { usfuel: 'Gasóleo y propano', usFuelSub: 'Gasóleo de automoción (precio de venta al público, USD por galón) del estado si la EIA lo publica y de su región PADD; propano residencial y mayorista del estado (solo en temporada de calefacción, de octubre a marzo).',
      usarc: 'ARC/PLC: tasas de pago por condado', usArcSub: 'Tasa de pago ARC-CO de cada condado en dólares por acre base, tal como la publica la FSA (no son los dólares pagados: el pago se aplica al 85 % de los acres base y puede reducirse por el secuestro presupuestario). PLC tiene una tasa nacional por unidad de producto.',
      arcCrop: 'Cultivo', arcN: 'condados', arcPay: 'con pago', arcMax: 'tasa máxima', arcRate: 'Tasa ARC-CO', arcBm: 'Ingreso de referencia', arcAct: 'Ingreso real', arcGuar: 'Ingreso garantizado', perBase: 'USD por acre base', plcT: 'PLC: tasa nacional de pago por unidad', plcRate: 'Tasa PLC', plcRef: 'Precio de referencia efectivo', plcMya: 'Precio medio de campaña', unitL: 'Unidad', flagP: 'proyectado', flagF: 'final', county2: 'Condado', arcType: { Irrigated: 'regadío', Nonirrigated: 'secano', 'Non-Irrigated': 'secano' }, arcNone: 'La FSA aún no ha publicado tasas para esta campaña.' },
    en: { usfuel: 'Diesel and propane', usFuelSub: 'On-highway diesel retail price (USD per gallon) for the state where EIA publishes it and for its PADD region; residential and wholesale propane for the state (heating season only, October to March).',
      usarc: 'ARC/PLC: payment rates by county', usArcSub: 'ARC-CO payment rate for each county in dollars per base acre, as published by FSA (not dollars paid: payments apply to 85% of base acres and may be reduced by sequestration). PLC has one national rate per unit.',
      arcCrop: 'Crop', arcN: 'counties', arcPay: 'with payment', arcMax: 'highest rate', arcRate: 'ARC-CO rate', arcBm: 'Benchmark revenue', arcAct: 'Actual revenue', arcGuar: 'Guarantee revenue', perBase: 'USD per base acre', plcT: 'PLC: national payment rate per unit', plcRate: 'PLC rate', plcRef: 'Effective reference price', plcMya: 'Marketing-year average price', unitL: 'Unit', flagP: 'projected', flagF: 'final', county2: 'County', arcType: { Irrigated: 'irrigated', Nonirrigated: 'non-irrigated', 'Non-Irrigated': 'non-irrigated' }, arcNone: 'FSA has not published rates for this program year yet.' },
    fr: { usfuel: 'Gazole et propane', usFuelSub: 'Gazole routier (prix à la pompe, USD par gallon) de l’État quand l’EIA le publie et de sa région PADD ; propane résidentiel et de gros de l’État (seulement en saison de chauffage, d’octobre à mars).',
      usarc: 'ARC/PLC : taux de paiement par comté', usArcSub: 'Taux de paiement ARC-CO de chaque comté en dollars par acre de base, tel que publié par la FSA (ce ne sont pas les dollars versés : le paiement porte sur 85 % des acres de base et peut être réduit par le séquestre budgétaire). Le PLC a un taux national par unité.',
      arcCrop: 'Culture', arcN: 'comtés', arcPay: 'avec paiement', arcMax: 'taux maximal', arcRate: 'Taux ARC-CO', arcBm: 'Revenu de référence', arcAct: 'Revenu réel', arcGuar: 'Revenu garanti', perBase: 'USD par acre de base', plcT: 'PLC : taux national de paiement par unité', plcRate: 'Taux PLC', plcRef: 'Prix de référence effectif', plcMya: 'Prix moyen de campagne', unitL: 'Unité', flagP: 'projeté', flagF: 'définitif', county2: 'Comté', arcType: { Irrigated: 'irrigué', Nonirrigated: 'non irrigué', 'Non-Irrigated': 'non irrigué' }, arcNone: 'La FSA n’a pas encore publié de taux pour cette campagne.' },
    it: { usfuel: 'Gasolio e propano', usFuelSub: 'Gasolio per autotrazione (prezzo al dettaglio, USD per gallone) dello Stato se l’EIA lo pubblica e della sua regione PADD; propano residenziale e all’ingrosso dello Stato (solo nella stagione di riscaldamento, ottobre-marzo).',
      usarc: 'ARC/PLC: tassi di pagamento per contea', usArcSub: 'Tasso di pagamento ARC-CO di ogni contea in dollari per acro di base, come lo pubblica la FSA (non sono i dollari pagati: il pagamento si applica all’85% degli acri di base e può essere ridotto dal sequestro di bilancio). Il PLC ha un tasso nazionale per unità.',
      arcCrop: 'Coltura', arcN: 'contee', arcPay: 'con pagamento', arcMax: 'tasso massimo', arcRate: 'Tasso ARC-CO', arcBm: 'Ricavo di riferimento', arcAct: 'Ricavo effettivo', arcGuar: 'Ricavo garantito', perBase: 'USD per acro di base', plcT: 'PLC: tasso nazionale di pagamento per unità', plcRate: 'Tasso PLC', plcRef: 'Prezzo di riferimento effettivo', plcMya: 'Prezzo medio di campagna', unitL: 'Unità', flagP: 'previsto', flagF: 'definitivo', county2: 'Contea', arcType: { Irrigated: 'irriguo', Nonirrigated: 'non irriguo', 'Non-Irrigated': 'non irriguo' }, arcNone: 'La FSA non ha ancora pubblicato i tassi per questa campagna.' }
  };
  Object.keys(T2).forEach(function (l) { var x = T[l]; if (!x) return; Object.keys(T2[l]).forEach(function (k) { x[k] = T2[l][k]; }); });
  Object.keys(T).forEach(function (l) { var x = T[l]; x.usprices = x.usPr; x.usstocks = x.usSt; x.usslaughter = x.usSl; x.usdairy = x.usDa; x.usland = x.usLand; x.usincome = x.usIn; x.uscensus = x.usCe; });
  (function () { var N = { es: 'Estado de los cultivos', en: 'Crop condition', fr: 'État des cultures', it: 'Stato delle colture' }, R = { es: 'Ingresos por producto', en: 'Cash receipts by commodity', fr: 'Recettes par produit', it: 'Ricavi per prodotto' }; Object.keys(N).forEach(function (l) { if (T[l]) { T[l].uscprog = N[l]; T[l].usrecv = R[l]; } }); })();   // títulos de los bloques para el índice
  (function () { var N = { es: 'Sequía', en: 'Drought', fr: 'Sécheresse', it: 'Siccità' }; Object.keys(N).forEach(function (l) { if (T[l]) T[l].eudr = N[l]; }); })();
  (function () { var N = { es: 'Empleo y valor añadido agrario', en: 'Farm employment and value added', fr: 'Emploi et valeur ajoutée agricoles', it: 'Occupazione e valore aggiunto agricoli' }; Object.keys(N).forEach(function (l) { if (T[l]) T[l].elagri = N[l]; }); })();
  window.DehesaRegionMore = function (H) {
    var get = H.get, card = H.card, cite = H.cite, table = H.table, nf = H.nf, esc = H.esc, tt = H.tt, day = H.day, pct = H.pct, dec = H.dec;
    function L(s) { var p = String(s).split('|'), i = IX[H.lang()]; return p[i == null ? 0 : i] || p[0]; }
    function lastNN(a) { for (var i = (a || []).length - 1; i >= 0; i--) if (a[i] != null) return i; return -1; }
    function lastPt(a) { for (var i = (a || []).length - 1; i >= 0; i--) if (a[i] && a[i][1] != null) return a[i]; return null; }
    function atY(a, y) { for (var i = 0; i < (a || []).length; i++) if (String(a[i][0]) === String(y)) return a[i][1]; return null; }
    function faint(s) { return '<span style="color:var(--text-faint);font-size:12px">' + esc(s) + '</span>'; }
    function share(v, tot) { return tot ? nf(v / tot * 100, v / tot < 0.1 ? 1 : 0) + ' %' : '—'; }
    function link(href, txt) { return '<p class="di-movers-hint" style="margin:10px 0 0"><a href="' + href + '">' + esc(txt) + ' →</a></p>'; }
    function mon(p) { return H.plabel ? H.plabel(p) : p; }

    /* ---- sequía por región de Bélgica, Austria, Grecia, Italia y Alemania (Observatorio Europeo de la Sequía, JRC; data/eu-drought-regions/<PAIS>.json) ----
       Una región que reúne varias unidades NUTS 2 (Länder alemanes, Trentino-Alto Adigio) muestra una fila por unidad: no se promedian porcentajes de superficie. */
    function eudr(x) {
      if (['BE', 'AT', 'EL', 'IT', 'DE'].indexOf(x.c) < 0) return Promise.resolve(null);
      return Promise.all([get('data/eu-regions-macro.json'), get('data/eu-drought-regions/' + x.c + '.json'), get('data/eu-drought.json')]).then(function (a) {
        var M = a[0] && a[0].regions && a[0].regions[x.c] && a[0].regions[x.c][x.r], R = a[1] && a[1].regions, P = a[2] && a[2].periods;
        if (!M || !M.nuts || !R || !P || !P.length) return null;
        var seen = {}, ids = M.nuts.filter(function (n) { if (seen[n] || !R[n]) return false; seen[n] = 1; return true; });
        var inD = function (r) { return r ? r[0] + r[1] + r[2] : null; }, rows = [];
        ids.forEach(function (n) {
          var v = R[n].v; if (!v || !v.length || v.length !== P.length) return; var l = v[v.length - 1], p = v.length > 36 ? v[v.length - 37] : null; if (!l) return;
          var d = inD(l), dp = p ? inD(p) : null, dd = dp == null ? null : d - dp;
          rows.push([esc(R[n].name.split('/').pop().replace(/^\s*Prov\.\s*/, '').trim()), nf(d, 1) + ' %', dp == null ? '—' : nf(dp, 1) + ' %', dd == null ? '—' : (dd > 0 ? '+' : dd < 0 ? '−' : '') + nf(Math.abs(dd), 1) + ' pp', nf(l[0], 1) + ' · ' + nf(l[1], 1) + ' · ' + nf(l[2], 1)]);
        });
        if (!rows.length) return null;
        return card(L('Sequía|Drought|Sécheresse|Siccità'),
          L('Superficie de la región en sequía agrícola (vigilancia, aviso o alerta) según el Indicador Combinado de Sequía del Observatorio Europeo de la Sequía (JRC), última década frente a la misma década del año pasado. Si la región reúne varias unidades NUTS 2 se muestra una fila por unidad; Dehesa Index no promedia porcentajes de superficie.|Share of the region’s area in agricultural drought (watch, warning or alert) according to the Combined Drought Indicator of the European Drought Observatory (JRC), latest dekad against the same dekad last year. If the region groups several NUTS 2 units, one row per unit is shown; Dehesa Index does not average area percentages.|Part de la superficie de la région en sécheresse agricole (vigilance, avertissement ou alerte) selon l’indicateur combiné de sécheresse de l’Observatoire européen de la sécheresse (JRC), dernière décade comparée à la même décade de l’an dernier. Si la région regroupe plusieurs unités NUTS 2, une ligne par unité est affichée ; Dehesa Index ne fait pas de moyenne de pourcentages de surface.|Quota della superficie della regione in siccità agricola (attenzione, allerta o allarme) secondo l’indicatore combinato di siccità dell’Osservatorio europeo sulla siccità (JRC), ultima decade rispetto alla stessa decade dell’anno scorso. Se la regione riunisce più unità NUTS 2, si mostra una riga per unità; Dehesa Index non fa la media di percentuali di superficie.')
          + ' ' + L('Decena|Dekad|Décade|Decade') + ' ' + day(P[P.length - 1]) + '.',
          table([L('Unidad|Unit|Unité|Unità'), L('En sequía|In drought|En sécheresse|In siccità'), L('Año pasado|Last year|An dernier|Anno scorso'), L('Cambio|Change|Variation|Variazione'), L('Vigilancia · aviso · alerta (%)|Watch · warning · alert (%)|Vigilance · avertissement · alerte (%)|Attenzione · allerta · allarme (%)')], rows, 560)
          + link('sequia.html', L('Ver el monitor de sequía completo|Open the full drought monitor|Ouvrir le moniteur de sécheresse complet|Apri il monitor della siccità completo')), cite('edo_cdi', P[P.length - 1].slice(0, 7)));
      });
    }
    /* clima de las regiones sin punto en data/climate.json: ciudad principal de la región (NASA POWER; data/eu-region-climate.json, scripts/update-eu-region-climate.mjs) */
    function regClim(x) {
      return get('data/eu-region-climate.json').then(function (d) {
        var l = d && d.countries && d.countries[x.c] && d.countries[x.c][x.r]; if (!l || !l.months || !l.months.length) return null;
        var t = tt(), rows = l.months.slice(-6).reverse().map(function (m) { return [esc(mon(m.period)), nf(m.precipMm, 1), (m.precipAnomalyPct > 0 ? '+' : m.precipAnomalyPct < 0 ? '−' : '') + nf(Math.abs(m.precipAnomalyPct), 0) + ' %', nf(m.tempC, 1), (m.tempAnomalyC > 0 ? '+' : m.tempAnomalyC < 0 ? '−' : '') + nf(Math.abs(m.tempAnomalyC), 1) + ' °C']; });
        var body = '<h3 style="margin:10px 0 4px;font-size:14px">' + esc(t.climPt) + ': ' + esc(l.city) + ' ' + faint(nf(l.lat, 1) + '°, ' + nf(l.lon, 1) + '°') + '</h3>' + table([t.mMonth, t.precip, t.precipA, t.temp, t.tempA], rows, 480);
        return card(t.clim, t.climSub, body + link('clima.html', t.climMore), cite('nasa_power', d.lastPeriod || ''));
      });
    }

    /* ---- Francia: lluvia y temperatura del último mes por departamento (estaciones de Météo-France; data/fr-climate-departements.json). Sin dato, el punto de NASA POWER ---- */
    function frClim(x) {
      var FT = { es: ['Lluvia y temperatura por departamento', 'Media de las estaciones de Météo-France de cada departamento en {m}, frente a su normal 1991-2020 (cálculo de Dehesa Index).', 'Departamento', 'Lluvia (mm)', '% de lo normal', 'Temp. media (°C)', 'Diferencia (°C)', 'Ver el mapa de Francia'],
        en: ['Rainfall and temperature by département', 'Average of the Météo-France stations in each département in {m}, compared with their 1991-2020 normal (calculated by Dehesa Index).', 'Département', 'Rainfall (mm)', '% of normal', 'Mean temp. (°C)', 'Difference (°C)', 'See the map of France'],
        fr: ['Pluie et température par département', 'Moyenne des stations Météo-France de chaque département en {m}, comparée à leur normale 1991-2020 (calcul de Dehesa Index).', 'Département', 'Pluie (mm)', '% de la normale', 'Temp. moyenne (°C)', 'Écart (°C)', 'Voir la carte de France'],
        it: ['Pioggia e temperatura per dipartimento', 'Media delle stazioni di Météo-France di ogni dipartimento in {m}, rispetto alla loro normale 1991-2020 (calcolo di Dehesa Index).', 'Dipartimento', 'Pioggia (mm)', '% della norma', 'Temp. media (°C)', 'Scarto (°C)', 'Vedi la mappa della Francia'] };
      return get('data/fr-climate-departements.json').then(function (d) {
        var deps = (d && d.departements || []).filter(function (z) { return z.region === x.r; }); if (!deps.length) return clim(x);
        var f = FT[H.lang()] || FT.es, per = d.lastPeriod, sgn = function (v) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1); };
        var rows = deps.map(function (z) { var m = null; z.months.forEach(function (q) { if (q.period === per) m = q; }); m = m || {};
          return [esc(z.name) + ' ' + faint(z.id), m.precipMm == null ? '—' : nf(m.precipMm, 0), m.precipAnomalyPct == null ? '—' : nf(100 + m.precipAnomalyPct, 0) + ' %', m.tempC == null ? '—' : nf(m.tempC, 1), sgn(m.tempAnomalyC)]; });
        return card(f[0], f[1].replace('{m}', mon(per)), table([f[2], f[3], f[4], f[5], f[6]], rows, 520) + link('paises.html?c=FR#ps-fr-clim', f[7]), cite('meteo_france', per));
      });
    }

    /* ---- Alemania: lluvia y temperatura del Land en los últimos meses (medias de área del DWD; data/de-climate-laender.json). Sin dato, el punto de NASA POWER ---- */
    function deClim(x) {
      var DT = { es: ['Lluvia y temperatura', 'Medias del Land que publica el Deutscher Wetterdienst, frente a la normal 1991-2020 (la normal y la diferencia, cálculo de Dehesa Index).', 'Mes', 'Lluvia (mm)', '% de lo normal', 'Temp. media (°C)', 'Diferencia (°C)', 'Ver el mapa de Alemania', 'Área del DWD'],
        en: ['Rainfall and temperature', 'Area averages for the Land published by the Deutscher Wetterdienst, compared with the 1991-2020 normal (normal and difference calculated by Dehesa Index).', 'Month', 'Rainfall (mm)', '% of normal', 'Mean temp. (°C)', 'Difference (°C)', 'See the map of Germany', 'DWD area'],
        fr: ['Pluie et température', 'Moyennes du Land publiées par le Deutscher Wetterdienst, par rapport à la normale 1991-2020 (normale et écart calculés par Dehesa Index).', 'Mois', 'Pluie (mm)', '% de la normale', 'Temp. moyenne (°C)', 'Écart (°C)', 'Voir la carte de l’Allemagne', 'Zone du DWD'],
        it: ['Pioggia e temperatura', 'Medie del Land pubblicate dal Deutscher Wetterdienst, rispetto alla normale 1991-2020 (normale e scarto calcolati da Dehesa Index).', 'Mese', 'Pioggia (mm)', '% della norma', 'Temp. media (°C)', 'Scarto (°C)', 'Vedi la mappa della Germania', 'Area del DWD'] };
      return get('data/de-climate-laender.json').then(function (d) {
        var u = null; (d && d.units || []).forEach(function (z) { if (z.id === x.r) u = z; }); if (!u || !u.months || !u.months.length) return clim(x);
        var f = DT[H.lang()] || DT.es, sgn = function (v) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1); };
        var rows = u.months.slice(-6).reverse().map(function (m) { return [esc(mon(m.period)), m.precipMm == null ? '—' : nf(m.precipMm, 0), m.precipAnomalyPct == null ? '—' : nf(100 + m.precipAnomalyPct, 0) + ' %', m.tempC == null ? '—' : nf(m.tempC, 1), sgn(m.tempAnomalyC)]; });
        var area = u.dwdArea && u.dwdArea !== u.name ? '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(f[8]) + ': ' + esc(u.dwdArea) + '</p>' : '';
        return card(f[0], f[1], table([f[2], f[3], f[4], f[5], f[6]], rows, 520) + area + link('paises.html?c=DE#ps-de-clim', f[7]), cite('dwd_cdc', d.lastPeriod));
      });
    }

    /* ---- lluvia y temperatura como media de toda la región (rejilla de NASA POWER promediada por región NUTS 2; data/region-grid-climate/<PAIS>.json). Sin dato, el punto de siempre ---- */
    function gridClim(x) {
      return get('data/region-grid-climate/' + x.c + '.json').then(function (d) {
        var u = null; (d && d.units || []).forEach(function (z) { if (z.mapId === x.r || z.id === x.r) u = z; }); if (!u || !u.months || !u.months.length) return clim(x);
        var sgn = function (v) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1); };
        var rows = u.months.slice(-6).reverse().map(function (m) { return [esc(mon(m.period)), m.precipMm == null ? '—' : nf(m.precipMm, 0), m.precipAnomalyPct == null ? '—' : nf(100 + m.precipAnomalyPct, 0) + ' %', m.tempC == null ? '—' : nf(m.tempC, 1), sgn(m.tempAnomalyC)]; });
        return card(L('Lluvia y temperatura|Rainfall and temperature|Pluie et température|Pioggia e temperatura'),
          L('Media de toda la región, no de un punto: rejilla de NASA POWER (reanálisis MERRA-2) promediada dentro de la región ({n} celdas) y comparada con su normal 1991-2020 (cálculo de Dehesa Index). En islas y costas las celdas mezclan tierra y mar.|Average over the whole region, not one point: NASA POWER grid (MERRA-2 reanalysis) averaged within the region ({n} cells) and compared with its 1991-2020 normal (calculated by Dehesa Index). On islands and coasts cells mix land and sea.|Moyenne sur toute la région, pas en un point : grille de NASA POWER (réanalyse MERRA-2) moyennée dans la région ({n} mailles) et comparée à sa normale 1991-2020 (calcul de Dehesa Index). Sur les îles et les côtes, les mailles mêlent terre et mer.|Media dell’intera regione, non di un punto: griglia di NASA POWER (rianalisi MERRA-2) mediata nella regione ({n} celle) e confrontata con la sua normale 1991-2020 (calcolo di Dehesa Index). Su isole e coste le celle mescolano terra e mare.').replace('{n}', u.cells),
          table([L('Mes|Month|Mois|Mese'), L('Lluvia (mm)|Rainfall (mm)|Pluie (mm)|Pioggia (mm)'), L('% de lo normal|% of normal|% de la normale|% della norma'), L('Temp. media (°C)|Mean temp. (°C)|Temp. moyenne (°C)|Temp. media (°C)'), L('Diferencia (°C)|Difference (°C)|Écart (°C)|Scarto (°C)')], rows, 520)
          + (function () { var f = u.months.slice(-6).filter(function (m) { return m.precipFlag; }).map(function (m) { return mon(m.period); }); return f.length ? '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(L('Lluvia de {m} no mostrada: la fuente trae valores imposibles en alguna celda de la región (más de 48 mm al día de media o más del triple del máximo de 1991-2020). La temperatura sí es válida.|Rainfall for {m} not shown: the source has impossible values in some cell of the region (over 48 mm a day on average, or more than three times the 1991-2020 maximum). Temperature is valid.|Pluie de {m} non affichée : la source contient des valeurs impossibles dans une maille de la région (plus de 48 mm par jour en moyenne, ou plus du triple du maximum 1991-2020). La température est valide.|Pioggia di {m} non mostrata: la fonte ha valori impossibili in qualche cella della regione (oltre 48 mm al giorno di media o più del triplo del massimo 1991-2020). La temperatura è valida.').replace('{m}', f.join(', '))) + '</p>' : ''; })()
          + link('paises.html?c=' + x.c + '#ps-' + x.c.toLowerCase() + '-clim', L('Ver el mapa del país|See the country map|Voir la carte du pays|Vedi la mappa del paese')), cite('nasa_power', d.lastPeriod));
      });
    }
    /* ---- EE. UU.: lluvia, temperatura y sequía de todo el estado (NOAA NCEI nClimDiv, con la diferencia con la normal 1991-2020 que calcula NOAA; data/us-climate-states.json). Sin dato, el punto ---- */
    function usClim(x) {
      return get('data/us-climate-states.json').then(function (d) {
        var u = d && d.states && d.states[x.r]; if (!u || !u.months || !u.months.length) return clim(x);
        var c = function (f) { return f == null ? null : (f - 32) * 5 / 9; }, sgn = function (v) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1); };
        var rows = u.months.slice(-6).reverse().map(function (m) { return [esc(mon(m.period)), m.precipIn == null ? '—' : nf(m.precipIn * 25.4, 0), m.precipPctAvg == null ? '—' : nf(m.precipPctAvg, 0) + ' %', m.tempF == null ? '—' : nf(c(m.tempF), 1), sgn(m.tempDepF == null ? null : m.tempDepF * 5 / 9), m.pdsi == null ? '—' : sgn(m.pdsi)]; });
        return card(L('Lluvia, temperatura y sequía|Rainfall, temperature and drought|Pluie, température et sécheresse|Pioggia, temperatura e siccità'),
          L('Media de todo el estado (NOAA, red de divisiones climáticas nClimDiv), frente a la normal 1991-2020 que calcula NOAA. NOAA publica en °F y pulgadas; aquí se muestran en °C y mm. Índice de Palmer: por debajo de −2, sequía moderada; por encima de +2, muy húmedo.|Statewide average (NOAA, nClimDiv climate divisions), compared with the 1991-2020 normal calculated by NOAA. NOAA publishes in °F and inches; shown here in °C and mm. Palmer index: below −2, moderate drought; above +2, very wet.|Moyenne de tout l’État (NOAA, divisions climatiques nClimDiv), comparée à la normale 1991-2020 calculée par la NOAA. La NOAA publie en °F et en pouces ; affichés ici en °C et mm. Indice de Palmer : sous −2, sécheresse modérée ; au-dessus de +2, très humide.|Media dell’intero Stato (NOAA, divisioni climatiche nClimDiv), rispetto alla normale 1991-2020 calcolata dalla NOAA. La NOAA pubblica in °F e pollici; qui in °C e mm. Indice di Palmer: sotto −2, siccità moderata; sopra +2, molto umido.'),
          table([L('Mes|Month|Mois|Mese'), L('Lluvia (mm)|Rainfall (mm)|Pluie (mm)|Pioggia (mm)'), L('% de lo normal|% of normal|% de la normale|% della norma'), L('Temp. media (°C)|Mean temp. (°C)|Temp. moyenne (°C)|Temp. media (°C)'), L('Diferencia (°C)|Difference (°C)|Écart (°C)|Scarto (°C)'), L('Índice de Palmer|Palmer index|Indice de Palmer|Indice di Palmer')], rows, 560), cite('noaa_ncei', d.lastPeriod));
      });
    }
    /* ---- clima (todos los países) ---- */
    function clim(x) {
      var ids = CLIM[x.c] && CLIM[x.c][x.r]; if (!ids) return regClim(x); if (typeof ids === 'string') ids = [ids];
      return get('data/climate.json').then(function (d) {
        var t = tt(), locs = (d && d.locations || []).filter(function (l) { return ids.indexOf(l.id) >= 0 && l.months && l.months.length; }); if (!locs.length) return null;
        var body = locs.map(function (l) {
          var rows = l.months.slice(-6).reverse().map(function (m) { return [esc(mon(m.period)), nf(m.precipMm, 1), (m.precipAnomalyPct > 0 ? '+' : m.precipAnomalyPct < 0 ? '−' : '') + nf(Math.abs(m.precipAnomalyPct), 0) + ' %', nf(m.tempC, 1), (m.tempAnomalyC > 0 ? '+' : m.tempAnomalyC < 0 ? '−' : '') + nf(Math.abs(m.tempAnomalyC), 1) + ' °C']; });
          return '<h3 style="margin:10px 0 4px;font-size:14px">' + esc(t.climPt) + ': ' + esc(locName(l)) + ' ' + faint(nf(l.lat, 1) + '°, ' + nf(l.lon, 1) + '°') + '</h3>' + table([t.mMonth, t.precip, t.precipA, t.temp, t.tempA], rows, 480);
        }).join('');
        return card(t.clim, t.climSub, body + link('clima.html', t.climMore), cite('nasa_power', d.lastPeriod || ''));
      });
    }

    /* ---- EE. UU. ---- */
    function usIns(x) {
      return get('data/crop-insurance.json').then(function (d) {
        var S = d && d.states && d.states[x.r]; if (!S) return null; var t = tt(), F = d.fields, ys = Object.keys(S).sort().slice(-4).reverse();
        var ix = function (k) { return F.indexOf(k); };
        var rows = ys.map(function (y) { var v = S[y]; if (!v) return null; var pr = v[ix('totalPremium')], ind = v[ix('indemnity')];
          return [esc(y) + (d.provisionalFrom && +y >= +d.provisionalFrom ? ' ' + faint(t.provT) : ''), nf(v[ix('liability')] / 1e6, 1) + ' M', nf(pr / 1e6, 1) + ' M', nf(v[ix('subsidy')] / 1e6, 1) + ' M', nf(ind / 1e6, 1) + ' M', pr ? nf(ind / pr * 100, 0) + ' %' : '—', nf(v[ix('acres')], 0)]; }).filter(Boolean);
        if (!rows.length) return null;
        return card(t.ins, t.insSub, table([t.yr, t.liab + ' (USD)', t.prem, t.subs, t.indem, t.lossR, t.acres], rows, 640) + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.lossNote) + '</p>', cite('usda_rma', String(ys[0] || '')));
      });
    }
    function usCountyList(rows, head, w, topN, label) {
      var body = table(head, rows.slice(0, topN), w);
      if (rows.length > topN) body += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13.5px">' + esc(label) + ' (' + rows.length + ')</summary>' + table(head, rows, w) + '</details>';
      return body;
    }
    function usCountyDrought(x) {
      return get('data/us-county/drought/' + x.r + '.json').then(function (d) {
        if (!d || !d.counties || !d.weeks || !d.weeks.length) return null;
        var n = d.weeks.length - 1, k = Math.max(0, n - 4), list = Object.keys(d.counties).map(function (f) { var c = d.counties[f], v = c.v[n]; return v ? { name: c.n, v: v, p: c.v[k] } : null; }).filter(Boolean);
        if (!list.length) return null;
        list.sort(function (a, b) { return b.v[1] - a.v[1] || b.v[0] - a.v[0] || (a.name < b.name ? -1 : 1); });
        var t = tt(), pt = function (v) { return nf(v, v < 10 && v > 0 ? 1 : 0) + ' %'; };
        var rows = list.map(function (c) { var dd = c.p ? c.v[1] - c.p[1] : null; return [esc(String(c.name).replace(/ (County|Parish|Borough|Census Area)$/, '')), pt(c.v[0]), pt(c.v[1]), pt(c.v[2]), pt(c.v[3]), dd == null ? '—' : (dd > 0 ? '+' : '') + nf(dd, 0) + ' ' + L('pts|pts|pts|pt')]; });
        var head = [t.county, 'D0+', 'D1+', 'D2+', 'D3+', L('D1+ vs hace 4 semanas|D1+ vs 4 weeks ago|D1+ vs il y a 4 semaines|D1+ vs 4 settimane fa')];
        var wk = d.weeks[n];
        return card(L('Sequía por condado|Drought by county|Sécheresse par comté|Siccità per contea'), L('Porcentaje de la superficie de cada condado en sequía (semana del |Share of each county in drought (week of |Part de chaque comté en sécheresse (semaine du |Quota di ogni contea in siccità (settimana del ') + wk + L('). D1+ = moderada o peor; D2+ = severa o peor; D3+ = extrema o peor. Ordenado de más a menos afectado.|). D1+ = moderate or worse; D2+ = severe or worse; D3+ = extreme or worse. Sorted from most to least affected.|). D1+ = modérée ou pire ; D2+ = sévère ou pire ; D3+ = extrême ou pire. Du plus au moins touché.|). D1+ = moderata o peggio; D2+ = severa o peggio; D3+ = estrema o peggio. Dal più al meno colpito.'),
          usCountyList(rows, head, 560, 10, L('Todos los condados|All counties|Tous les comtés|Tutte le contee')), cite('us_drought_monitor', wk));
      });
    }
    function usCountyIns(x) {
      return get('data/us-county/insurance/' + x.r + '.json').then(function (d) {
        if (!d || !d.counties) return null; var y = String(d.lastFullYear), t = tt();
        var list = Object.keys(d.counties).map(function (f) { var c = d.counties[f], v = c.y[y]; return v && v[0] > 0 ? { name: c.n, v: v } : null; }).filter(Boolean);
        if (!list.length) return null;
        list.sort(function (a, b) { return b.v[0] - a.v[0]; });
        var rows = list.map(function (c) { var v = c.v; return [esc(c.name), nf(v[0] / 1e6, 1) + ' M', nf(v[1] / 1e6, 1) + ' M', nf(v[3] / 1e6, 1) + ' M', v[1] ? nf(v[3] / v[1] * 100, 0) + ' %' : '—', nf(v[5], 0)]; });
        var head = [t.county, t.liab + ' (USD)', t.prem, t.indem, t.lossR, t.acres];
        return card(L('Seguro de cosechas por condado|Crop insurance by county|Assurance récolte par comté|Assicurazione raccolti per contea'), L('Año agrícola |Crop year |Année agricole |Anno agrario ') + y + L('. Capital asegurado, prima total, indemnizaciones y superficie asegurada por condado. Ordenado por capital asegurado.|. Insured liability, total premium, indemnities and insured acres by county. Sorted by insured liability.|. Capital assuré, prime totale, indemnités et surface assurée par comté. Classé par capital assuré.|. Capitale assicurato, premio totale, indennizzi e superficie assicurata per contea. In ordine di capitale assicurato.'),
          usCountyList(rows, head, 600, 10, L('Todos los condados|All counties|Tous les comtés|Tutte le contee')) + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.lossNote) + '</p>', cite('usda_rma', y));
      });
    }
    function usLocal(x) {
      return get('data/us-local/status.json').then(function (st) {
        var reps = (st && st.reports || []).filter(function (r) { return r.state === x.r && r.status === 'OK'; }); if (!reps.length) return null;
        return Promise.all(reps.map(function (r) { return get('data/us-local/' + r.kind + '-' + r.state + '.json'); })).then(function (fs) {
          var t = tt(), body = '';
          fs.forEach(function (f) { if (!f || !f.latest) return;
            var n = (f.latest.rows || []).length, head = '<h3 style="margin:10px 0 4px;font-size:14px">' + esc(f.kind === 'cattle' ? t.cattleK : t.hayK) + ' · ' + esc(f.source && f.source.reportTitle || '') + '</h3><p class="di-movers-hint" style="margin:0 0 6px">' + esc(t.repDate) + ' ' + esc(day(f.latest.date)) + ' · ' + n + ' ' + esc(t.quotes) + '</p>';
            if (f.kind === 'cattle' && f.latest.receipts) { var rc = f.latest.receipts; body += head + table(['', t.receipts, t.weekAgo2, t.yearAgo2], [[esc(t.headW), rc.week != null ? nf(rc.week, 0) : '—', rc.weekAgo != null ? nf(rc.weekAgo, 0) : '—', rc.yearAgo != null ? nf(rc.yearAgo, 0) : '—']], 420); }
            else if (f.kind === 'hay') { var C = f.cols, ci = function (k) { return C.indexOf(k); }, lo = null, hi = null;
              f.latest.rows.forEach(function (r) { if (/^Alfalfa$/i.test(r[ci('class')]) && /Per Ton/i.test(r[ci('unit')])) { var a = r[ci('pMin')], b = r[ci('pMax')]; if (a != null && (lo == null || a < lo)) lo = a; if (b != null && (hi == null || b > hi)) hi = b; } });
              body += head + (lo != null ? '<p style="margin:0">' + esc(t.alfalfa) + ': <b>' + nf(lo, 0) + ' – ' + nf(hi, 0) + ' USD</b></p>' : ''); }
            body += link('precios-locales.html?t=' + f.kind + '&amp;s=' + x.r, t.openLocal);
          });
          if (!body) return null;
          return card(t.local, t.localSub, body + link('mi-mercado.html?c=US&amp;r=' + x.r, t.myMarket), cite('usda_ams_mars'));
        });
      });
    }

    /* ---- Canadá ---- */
    function caIns(x) {
      return get('data/crop-insurance-ca.json').then(function (d) {
        var P = d && d.data && d.data[x.r]; if (!P || !P.indemnities) return null; var t = tt(), Y = d.years, rows = [];
        for (var i = Y.length - 1; i >= 0 && rows.length < 4; i--) { var a = P.indemnities[i], b = P.hailIndemnities && P.hailIndemnities[i], c = P.farmPremiums && P.farmPremiums[i]; if (a == null && b == null && c == null) continue;
          rows.push([String(Y[i]), a != null ? nf(a, 0) : '—', b != null ? nf(b, 0) : '—', c != null ? nf(c, 0) : '—']); }
        if (!rows.length) return null;
        return card(t.insca, t.inscaSub, table([t.yr, t.indC, t.hailC, t.premC], rows, 420), cite('statcan', String(d.latestYear || '')));
      });
    }
    function caMb(x) {
      if (x.r !== 'MB') return Promise.resolve(null);
      return get('data/mb-markets/cattle.json').then(function (d) {
        var ks = d && d.weeks ? Object.keys(d.weeks).sort() : []; if (!ks.length) return null; var t = tt(), wk = d.weeks[ks[ks.length - 1]], yrs = Object.keys(wk.ytd || {}).sort().reverse();
        var rows = (d.marts || []).filter(function (m) { return wk.head && wk.head[m] != null; }).map(function (m) { return [esc(m), nf(wk.head[m], 0)]; });
        rows.push(['<b>' + esc(t.headW) + '</b>', '<b>' + nf(wk.weekTotal, 0) + '</b>']);
        var body = '<p class="di-movers-hint" style="margin:0 0 6px">' + esc(day(ks[ks.length - 1])) + (yrs.length ? ' · ' + esc(t.ytd) + ' ' + yrs.map(function (y) { return y + ': ' + nf(wk.ytd[y], 0); }).join(' · ') : '') + '</p>' + table([t.mart, t.headW], rows, 300);
        return card(t.mb, t.mbSub, body + link('paises.html?c=CA#ps-mb', t.openMb), cite('mb_agri', ks[ks.length - 1]));
      });
    }

    /* ---- España ---- */
    function esCrops(x) {
      var pv = ES_PROV[x.r]; if (!pv) return Promise.resolve(null);
      return Promise.all(ES_GROUPS.map(function (g) { return get('data/spain-crops/crops-' + g[0] + '.json'); })).then(function (fs) {
        var t = tt(), rows = [], vv = [], camp = '', prov = false;
        fs.forEach(function (f, i) { if (!f || !f.campaigns) return; var ck = Object.keys(f.campaigns).sort().pop(), C = f.campaigns[ck], tot = C && C.crops && C.crops[0]; if (!tot || !tot.v) return;
          camp = ck; if (C.status === 'provisional') prov = true; var a = 0, p = 0, na = 0, np = 0;
          pv.forEach(function (k) { var v = tot.v[k]; if (!v) return; if (v[0] != null) { a += v[0]; na++; } if (v[4] != null) { p += v[4]; np++; } });
          if ((!na || !a) && (!np || !p)) return;
          rows.push([esc(L(ES_GROUPS[i][1])), na ? nf(a, 0) : '—', np ? nf(p, 0) : '—', na && a && tot.t && tot.t[0] ? share(a, tot.t[0]) : '—']); vv.push(na ? a : null); });
        if (!rows.length) return null;
        var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.campaign) + ' ' + esc(camp) + (prov ? ' (' + esc(t.provisional) + ')' : '') + '</p>' + table([t.grp, t.areaHa, t.prodT, t.shareEs], H.rankRows(rows, vv, 'area').rows, 460) + H.rankRows(rows, vv, 'area').note + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.calcShare) + '</p>';
        return card(t.escrops, t.escropsSub, body + link('paises.html?c=ES#ps-es', t.openEs), cite('mapa_es', camp));
      });
    }
    function esLive(x) {
      var pv = ES_PROV[x.r]; if (!pv) return Promise.resolve(null);
      var sp = ['bovino', 'ovino', 'caprino', 'porcino'];
      return Promise.all(sp.map(function (s) { return get('data/spain-livestock/livestock-' + s + '.json'); })).then(function (fs) {
        var t = tt(), rows = [], vv = [], per = '';
        fs.forEach(function (f, i) { if (!f || !f.v || !f.periods) return; var P = f.periods, j = P.length - 1, sum = function (jj) { var s = 0, n = 0; pv.forEach(function (k) { var a = f.v[k] && f.v[k]['01']; if (a && a[jj] != null) { s += a[jj]; n++; } }); return n ? s : null; };
          var v = sum(j), v0 = j >= 2 ? sum(j - 2) : null, tot = f.v.ES && f.v.ES['01'] && f.v.ES['01'][j]; if (v == null) return; per = P[j];
          rows.push([esc(L(SP[sp[i]])), nf(v, 0), v0 != null ? nf(v0, 0) : '—', v0 ? esc(pct((v / v0 - 1) * 100)) : '', share(v, tot)]); vv.push(v); });
        if (!rows.length) return null;
        return card(t.eslv, t.eslvSub, '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(mon(per)) + '</p>' + table([t.species, t.heads, t.yoyS, t.vs, t.shareEs], H.rankRows(rows, vv, 'heads').rows, 480) + H.rankRows(rows, vv, 'heads').note, cite('mapa_es', per));
      });
    }
    function esSlaughter(x) {
      var slug = ES_SLUG[x.r]; if (!slug) return Promise.resolve(null);
      return get('data/spain-slaughter/slaughter.json').then(function (d) {
        var R = d && d.ccaa && d.ccaa[slug]; if (!R) return null; var t = tt(), P = d.periods, rows = [], per = '';
        (d.species || []).forEach(function (s) { var h = R[s] && R[s].heads, c = R[s] && R[s].carcass, j = lastNN(h); if (j < 0) return; per = per > P[j] ? per : P[j];
          var ya = j >= 12 ? h[j - 12] : null; rows.push([esc(L(SP[s] || s)), esc(mon(P[j])), nf(h[j], 0), c && c[j] != null ? nf(c[j], 0) : '—', ya != null ? nf(ya, 0) : '—']); });
        if (!rows.length) return null;
        return card(t.essl, t.esslSub, table([t.species, t.mMonth, t.headsM, t.carcass, t.sameMonth], rows, 520), cite('mapa_es', per));
      });
    }
    function esMilk(x) {
      var slug = ES_SLUG[x.r]; if (!slug) return Promise.resolve(null);
      return get('data/spain-milk/infolac.json').then(function (d) {
        var R = d && d.ccaa && d.ccaa[slug]; if (!R || !R.production) return null; var t = tt(), P = d.periods, j = lastNN(R.production); if (j < 0) return null;
        var ya = j >= 12 ? R.production[j - 12] : null, natv = d.national && d.national.deliveries && d.national.deliveries[j];
        var rows = [[esc(t.milkProd), nf(R.production[j], 0), ya != null ? nf(ya, 0) : '—'], [esc(t.fatP), R.fat && R.fat[j] != null ? nf(R.fat[j], 2) : '—', R.fat && j >= 12 && R.fat[j - 12] != null ? nf(R.fat[j - 12], 2) : '—'], [esc(t.protP), R.protein && R.protein[j] != null ? nf(R.protein[j], 2) : '—', R.protein && j >= 12 && R.protein[j - 12] != null ? nf(R.protein[j - 12], 2) : '—'], [esc(t.farmers), R.farmers && R.farmers[j] != null ? nf(R.farmers[j], 0) : '—', R.farmers && j >= 12 && R.farmers[j - 12] != null ? nf(R.farmers[j - 12], 0) : '—']];
        var anyYa = rows.some(function (r) { return r[2] !== '—'; }); if (!anyYa) rows = rows.map(function (r) { return [r[0], r[1]]; });
        var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(mon(P[j])) + (natv ? ' · ' + esc(t.shareEs) + ': ' + share(R.production[j], natv) : '') + '</p>' + table(anyYa ? ['', mon(P[j]), t.sameMonth] : ['', mon(P[j])], rows, anyYa ? 420 : 300);
        return card(t.esmilk, t.esmilkSub, body, cite('mapa_es', P[j]));
      });
    }

    /* ---- Francia: cultivos por región (SSP/Agreste vía FranceAgriMer) ---- */
    function frCrops(x) {
      var code = FR_INSEE[x.r]; if (!code) return Promise.resolve(null);
      return get('data/france-crops-regions.json').then(function (d) {
        var R = d && d.regions && d.regions[code]; if (!R) return null; var t = tt(), rows = [], yrAll = '';
        Object.keys(FR_CROP).forEach(function (k) {
          var c = R.c[k]; if (!c) return; var ys = Object.keys(c).sort(), y = ys[ys.length - 1], v = c[y]; if (!v || !v[2]) return;
          var tot = 0; Object.keys(d.regions).forEach(function (rc) { var q = d.regions[rc].c[k]; if (q && q[y]) tot += q[y][2]; });
          yrAll = yrAll > y ? yrAll : y;
          rows.push([esc(L(FR_CROP[k])) + (y !== yrAll ? ' ' + faint(y) : ''), nf(v[0], 0), v[1] != null ? nf(v[1], 1) : '—', nf(v[2], 0), tot ? share(v[2], tot) : '—', v[2]]);
        });
        var vFR = rows.map(function (r) { return r[5]; }); rows = rows.map(function (r) { return r.slice(0, 5); }); var rkF = H.rankRows(rows, vFR, 'prod'); rows = rkF.rows;
        if (!rows.length) return null;
        return card(t.frcrops, t.frcropsSub, '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(H.yearWord()) + ' ' + esc(yrAll) + ' (' + esc(t.provW) + ')</p>' + table([t.crop, t.areaHa, t.yieldT, t.prodT, t.shareFr], rows, 520) + rkF.note, cite('franceagrimer', yrAll));
      });
    }


    /* ---- Francia: calidad tecnologica del trigo por region (blando) y cuenca (duro), encuesta de calidad de FranceAgriMer ---- */
    var QCOL = { water: 'Humedad (%)|Moisture (%)|Humidité (%)|Umidità (%)', tw: 'Peso específico (kg/hl)|Test weight (kg/hl)|Poids spécifique (kg/hl)|Peso specifico (kg/hl)', protein: 'Proteína (%)|Protein (%)|Protéines (%)|Proteine (%)', w: 'Fuerza W|Strength W|Force W|Forza W', ie: 'Elasticidad IE|Elasticity IE|Élasticité IE|Elasticità IE', pl: 'P/L|P/L|P/L|P/L', gmf: 'GMF (%)|GMF (%)|GMF (%)|GMF (%)', vitr: 'Vitrosidad (%)|Vitreousness (%)|Vitrosité (%)|Vitrosità (%)' };
    var QYEAR = 'Cosecha|Harvest|Récolte|Raccolto', QAVG = 'Media 2013-2024|Average 2013-2024|Moyenne 2013-2024|Media 2013-2024';
    function qrows(v, fields) {
      var ys = Object.keys(v).sort(), last = ys[ys.length - 1], hist = ys.filter(function (y) { return y < last; });
      function row(lab, get_) { return [lab].concat(fields.map(function (f, i) { var q = get_(i); return q == null ? '—' : nf(q, f === 'pl' ? 2 : f === 'w' || f === 'ie' ? 0 : 1); })); }
      var avg = function (i) { var a = hist.map(function (y) { return v[y][i]; }).filter(function (z) { return z != null; }); return a.length ? a.reduce(function (m, z) { return m + z; }, 0) / a.length : null; };
      var prev = ys.length > 1 ? ys[ys.length - 2] : null;
      var rows = [row(esc(last), function (i) { return v[last][i]; })];
      if (prev) rows.push(row(esc(prev), function (i) { return v[prev][i]; }));
      rows.push(row(esc(L(QAVG)), avg)); return { rows: rows, last: last };
    }
    function frQuality(x) {
      var code = FR_INSEE[x.r]; if (!code) return Promise.resolve(null);
      return get('data/france-quality-regions.json').then(function (d) {
        var R = d && d.softWheat && d.softWheat.regions[code]; if (!R) return null; var f = d.softWheat.fields, q = qrows(R.v, f), hs = f.map(function (k) { return L(QCOL[k]); });
        var out = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(L('Trigo blando, medias de la región a la entrada de los silos|Common wheat, regional averages at silo intake|Blé tendre, moyennes régionales à l’entrée des silos|Frumento tenero, medie regionali all’ingresso dei silos')) + '</p>' + table([L(QYEAR)].concat(hs), q.rows, 640);
        if (['OCC', 'NAQ', 'PAC', 'CVL', 'PDL'].indexOf(x.r) > -1 && d.durum) {
          var fd = d.durum.fields, hd = fd.map(function (k) { return L(QCOL[k]); }), rows = [];
          Object.keys(d.durum.basins).forEach(function (b) { var B = d.durum.basins[b], ys = Object.keys(B.v).sort(), v = B.v[ys[ys.length - 1]]; rows.push([esc(B.name) + ' ' + faint(ys[ys.length - 1])].concat(fd.map(function (k, i) { return v[i] == null ? '—' : nf(v[i], 1); }))); });
          out += '<p class="di-movers-hint" style="margin:14px 0 8px">' + esc(L('Trigo duro por cuenca de producción (las cuencas no coinciden con la región)|Durum wheat by production basin (basins do not match the region)|Blé dur par bassin de production (les bassins ne coïncident pas avec la région)|Grano duro per bacino di produzione (i bacini non coincidono con la regione)')) + '</p>' + table([L('Cuenca|Basin|Bassin|Bacino')].concat(hd), rows, 640);
        }
        return card(L('Calidad del trigo|Wheat quality|Qualité du blé|Qualità del grano'), L('Calidad tecnológica de la cosecha en la entrada de los silos de recogida (humedad, peso específico, proteína, fuerza panadera). Encuesta de FranceAgriMer; medias, no garantía de lote.|Technological quality of the harvest at collection-silo intake (moisture, test weight, protein, baking strength). FranceAgriMer survey; averages, not a batch guarantee.|Qualité technologique de la récolte à l’entrée des silos de collecte (humidité, poids spécifique, protéines, force boulangère). Enquête FranceAgriMer ; moyennes, pas une garantie de lot.|Qualità tecnologica del raccolto all’ingresso dei silos di raccolta (umidità, peso specifico, proteine, forza panificatoria). Indagine FranceAgriMer; medie, non una garanzia di lotto.'), out, cite('franceagrimer', q.last));
      });
    }

    /* ---- Francia ---- */
    function frVig(x) {
      return get('data/france-vigieau.json').then(function (d) {
        var fr = H.nameFr(x.r), deps = (d && d.departments || []).filter(function (z) { return z.region === fr; }); if (!deps.length) return null; var t = tt();
        var order = { crise: 4, alerte_renforcee: 3, alerte: 2, vigilance: 1 };
        deps.sort(function (a, b) { return (order[b.level] || 0) - (order[a.level] || 0) || (a.name < b.name ? -1 : 1); });
        var col = { crise: '#a32d1f', alerte_renforcee: '#d4622d', alerte: '#ef9b4a', vigilance: '#c9a227' };
        var rows = deps.map(function (z) { var lv = z.level || 'none'; return [esc(z.name) + ' ' + faint(z.code), '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;background:' + (col[lv] || '#cfd8cc') + '"></span>' + esc(L(VIG[lv] || VIG.none))]; });
        return card(t.vig, t.vigSub, table([t.dept, t.level], rows, 360), cite('vigieau', d.source && String(d.source.asOf || '').slice(0, 10)));
      });
    }
    function frCere(x) {
      var k = FR_CERE[x.r]; if (!k) return Promise.resolve(null);
      return get('data/france-cereobs.json').then(function (d) {
        var R = d && d.regions && d.regions[k]; if (!R || !R.length) return null; var t = tt(), F = d.fields, ix = function (n) { return F.indexOf(n) + 1; };
        var rows = R.slice(-4).reverse().map(function (r) { var g = (r[ix('c4')] || 0) + (r[ix('c5')] || 0), p = (r[ix('c1')] || 0) + (r[ix('c2')] || 0);
          return [esc(r[0]), r[ix('harvest')] != null ? nf(r[ix('harvest')], 0) + ' %' : '—', nf(g, 0) + ' %', r[ix('c3')] != null ? nf(r[ix('c3')], 0) + ' %' : '—', nf(p, 0) + ' %']; });
        return card(t.cere, t.cereSub, table([t.wk, t.harvestP, t.condGood, t.condFair, t.condPoor], rows, 460), cite('franceagrimer', d.source && d.source.dataUntil));
      });
    }

    /* ---- Alemania ---- */
    function deProd(x) {
      return get('data/germany-agri.json').then(function (d) {
        var P = d && d.production; if (!P || !P.land) return null; var t = tt(), rows = [], vv = [], yr = '';
        (d.crops || []).forEach(function (c) { var b = P.land[c.k] && P.land[c.k][x.r]; if (!b) return; var p = lastPt(b.prod); if (!p) return; var a = atY(b.area, p[0]), y = atY(b.yield, p[0]), nat = P.nat[c.k] && atY(P.nat[c.k].prod, p[0]);
          yr = yr > String(p[0]) ? yr : String(p[0]); rows.push([esc(L(DE_CROP[c.k] || c.k)) + (String(p[0]) !== yr ? ' ' + faint(p[0]) : ''), a != null ? nf(a, 0) : '—', y != null ? nf(y, 1) : '—', nf(p[1], 0), nat ? share(p[1], nat) : '—']); vv.push(p[1]); });
        if (!rows.length) return null;
        var rkD = H.rankRows(rows, vv, 'prod');
        return card(t.deprod, t.deprodSub, '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(H.yearWord()) + ' ' + esc(yr) + '</p>' + table([t.crop, t.areaHa, t.yieldT, t.prodT, t.shareDe], rkD.rows, 520) + rkD.note + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.calcShare) + '</p>', cite('destatis', yr));
      });
    }
    function deLand(x) {
      return get('data/germany-agri.json').then(function (d) {
        var LP = d && d.landPrice && d.landPrice.land && d.landPrice.land[x.r], RT = d && d.rent && d.rent.land && d.rent.land[x.r]; if (!LP && !RT) return null; var t = tt(), rows = [];
        ['lf', 'acker', 'gruen'].forEach(function (k) { var p = LP && LP[k] && lastPt(LP[k].p), n = p && LP[k].n ? atY(LP[k].n, p[0]) : null, r = RT && lastPt(RT[k]);
          if (!p && !r) return; rows.push([esc(t[k]), p ? nf(p[1], 0) + ' ' + faint(p[0]) : '—', n != null ? nf(n, 0) : '—', r ? nf(r[1], 0) + ' ' + faint(r[0]) : '—']); });
        if (!rows.length) return null;
        return card(t.deland, t.delandSub, table([t.kindL, t.priceHa, t.salesN, t.rentHa], rows, 480) + (LP ? '' : '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.noLandPrice) + '</p>') + link('paises.html?c=DE#ps-de', t.openDe), cite('destatis'));
      });
    }
    /* ---- Grecia: ocupados agrarios (EPA) y valor añadido y empleo de la sección A por unidad regional (cuentas regionales); Eurostat, data/greece-more-stats.json ---- */
    function elAgri(x) {
      return Promise.all([get('data/eu-regions-macro.json'), get('data/greece-more-stats.json')]).then(function (a) {
        var M = a[0] && a[0].regions && a[0].regions.EL && a[0].regions.EL[x.r], S = a[1] && a[1].countries && a[1].countries.EL && a[1].countries.EL.series; if (!M || !M.nuts || !S) return null;
        var n2 = M.nuts[0].toLowerCase(), by = {}; S.forEach(function (s) { by[s.id] = s; });
        var at = function (s, y) { return s ? atY(s.points, y) : null; }, chg = function (s, k) { var p = s && lastPt(s.points); if (!p) return null; var b = at(s, +p[0] - k); return b ? (p[1] / b - 1) * 100 : null; };
        var sp = function (v) { if (v == null) return '—'; var r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + nf(Math.abs(r), 0) + ' %'; };
        var lf = by['el-lfs-emp-agr-' + n2], gv = by['el-gva-agr-' + n2], ge = by['el-gva-agr-el'], ae = by['el-acc-emp-agr-' + n2];
        if (!lf && !gv) return null;
        var top = [], lp = lf && lastPt(lf.points), gp = gv && lastPt(gv.points), ap = ae && lastPt(ae.points);
        if (lp) top.push([esc(L('Ocupados agrarios (encuesta de población activa, miles)|Farm employment (labour force survey, thousand)|Emploi agricole (enquête emploi, milliers)|Occupati agricoli (indagine forze lavoro, migliaia)')), esc(lp[0]), nf(lp[1], 1), sp(chg(lf, 5))]);
        if (ap) top.push([esc(L('Personas ocupadas en la agricultura (cuentas regionales, miles)|Persons employed in agriculture (regional accounts, thousand)|Personnes occupées dans l’agriculture (comptes régionaux, milliers)|Persone occupate in agricoltura (conti regionali, migliaia)')), esc(ap[0]), nf(ap[1], 1), sp(chg(ae, 5))]);
        if (gp) top.push([esc(L('Valor añadido agrario (millones de €)|Farm gross value added (EUR million)|Valeur ajoutée agricole (millions d’€)|Valore aggiunto agricolo (milioni di €)')) + (ge ? ' ' + faint(L('peso en Grecia|share of Greece|part de la Grèce|quota della Grecia') + ' ' + share(gp[1], at(ge, gp[0]))) : ''), esc(gp[0]), nf(gp[1], 0), sp(chg(gv, 5))]);
        var units = S.filter(function (s) { return s.id.indexOf('el-gva-agr-' + n2) === 0 && s.id.length === ('el-gva-agr-' + n2).length + 1; }).map(function (s) {
          var p = lastPt(s.points), e = by[s.id.replace('el-gva-agr-', 'el-acc-emp-agr-')], ep = e && lastPt(e.points), nm = s.label.split(': ').pop();
          return { v: p ? p[1] : -1, row: [esc(nm), p ? nf(p[1], 1) + ' ' + faint(p[0]) : '—', sp(chg(s, 5)), ep ? nf(ep[1], 1) : '—'] };
        }).sort(function (p, q) { return q.v - p.v; }).map(function (z) { return z.row; });
        var body = table([L('Indicador|Indicator|Indicateur|Indicatore'), L('Año|Year|Année|Anno'), L('Valor|Value|Valeur|Valore'), L('En 5 años|Over 5 years|Sur 5 ans|In 5 anni')], top, 520);
        if (units.length > 1) body += '<h3 style="margin:14px 0 4px;font-size:14px">' + esc(L('Por unidad regional|By regional unit|Par unité régionale|Per unità regionale')) + '</h3>' + table([L('Unidad regional|Regional unit|Unité régionale|Unità regionale'), L('Valor añadido (M€)|Value added (EUR m)|Valeur ajoutée (M€)|Valore aggiunto (M€)'), L('En 5 años|Over 5 years|Sur 5 ans|In 5 anni'), L('Ocupados (miles)|Employed (thousand)|Actifs occupés (milliers)|Occupati (migliaia)')], units, 520);
        return card(L('Empleo y valor añadido agrario|Farm employment and value added|Emploi et valeur ajoutée agricoles|Occupazione e valore aggiunto agricoli'),
          L('Agricultura, silvicultura y pesca (sección A) de Eurostat, con datos de ELSTAT. La encuesta de población activa y las cuentas regionales miden el empleo de forma distinta: no se comparan entre sí. Valor añadido a precios corrientes; el último año puede revisarse.|Agriculture, forestry and fishing (section A) from Eurostat, based on ELSTAT data. The labour force survey and the regional accounts measure employment differently and should not be compared. Value added at current prices; the latest year may be revised.|Agriculture, sylviculture et pêche (section A) d’Eurostat, à partir des données d’ELSTAT. L’enquête emploi et les comptes régionaux mesurent l’emploi différemment : ne pas les comparer. Valeur ajoutée à prix courants ; la dernière année peut être révisée.|Agricoltura, silvicoltura e pesca (sezione A) di Eurostat, su dati ELSTAT. L’indagine sulle forze di lavoro e i conti regionali misurano l’occupazione in modo diverso: non vanno confrontati. Valore aggiunto a prezzi correnti; l’ultimo anno può essere rivisto.'),
          body, cite('eurostat', gp ? gp[0] : (lp ? lp[0] : '')));
      });
    }
    function deLive(x) {
      return get('data/germany-livestock.json').then(function (d) {
        if (!d) return null; var t = tt(), rows = [], S = d.slaughter && d.slaughter.land, yr = '';
        ['cattle', 'calves', 'pigs', 'sheep'].forEach(function (k) { var b = S && S[k] && S[k][x.r], p = b && b.tonnes && lastPt(b.tonnes.dom); if (!p) return; yr = String(p[0]); rows.push([esc(L(DE_SP[k])), esc(p[0]), nf(p[1], 0)]); });
        var E = d.eggs && d.eggs.land && d.eggs.land[x.r], e = E && lastPt(E.eggs), h = E && lastPt(E.hens), er = [];
        if (e) er.push([esc(t.eggsM), esc(e[0]), nf(e[1], 0)]); if (h) er.push([esc(t.hens), esc(h[0]), nf(h[1], 0)]);
        if (!rows.length && !er.length) return null;
        return card(t.delive, t.deliveSub, (rows.length ? table([t.species, t.yearL2, t.slT], rows, 380) : '') + (er.length ? '<div style="margin-top:10px">' + table([t.varL, t.yearL2, t.valL], er, 380) + '</div>' : ''), cite('destatis', yr));
      });
    }

    /* ---- Países Bajos ---- */
    function nlCbs(x) {
      var pv = NL_PV[x.r]; if (!pv) return Promise.resolve(null);
      return get('data/netherlands-farm.json').then(function (d) {
        if (!d) return null; var t = tt(), out = '';
        var C = d.crops && d.crops.data, rows = [], vv = [];
        Object.keys(NL_CROP).forEach(function (k) { var b = C && C[k] && C[k][pv]; if (!b) return; var a = lastPt(b.area), p = lastPt(b.prod); if (!a && !p) return; if ((a && !a[1]) && (p && !p[1])) return;
          var nat = C[k].NL01, na = a && nat ? atY(nat.area, a[0]) : null;
          rows.push([esc(L(NL_CROP[k])), a ? nf(a[1], 0) + ' ' + faint(a[0]) : '—', p ? nf(p[1], 0) + ' ' + faint(p[0]) : '—', a && na ? share(a[1], na) : '—']); vv.push(a ? a[1] : null); });
        var rkN = H.rankRows(rows, vv, 'area');
        if (rows.length) out += card(t.nlcrops, t.nlcropsSub, table([t.crop, t.areaHa, t.prodT, t.shareNl], rkN.rows, 500) + rkN.note + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.calcShare) + '</p>', cite('cbs_nl'));
        var F = d.farms && d.farms.data, fr = [];
        NL_FM.forEach(function (z) { var b = F && F[z[0]] && F[z[0]][pv], p = lastPt(b); if (p) fr.push([esc(L(z[1])), esc(p[0]), nf(p[1], 0)]); });
        if (fr.length) out += card(t.nlfarms, t.nlfarmsSub, table([t.varL, t.yearL2, t.valL], fr, 380), cite('cbs_nl'));
        return out || null;
      });
    }


    /* ---- EE. UU. por estado (data/us-states/<ESTADO>.json, scripts/update-us-states.py: USDA NASS y ERS) ---- */
    function usData(r) { return get('data/us-states/' + r + '.json'); }
    function serLast(S, k) { var s = S && S[k]; return s && s.points && s.points.length ? s.points[s.points.length - 1] : null; }
    function serAt(S, k, p) { var s = S && S[k]; if (!s) return null; for (var i = s.points.length - 1; i >= 0; i--) if (s.points[i][0] === p) return s.points[i][1]; return null; }
    function yAgo(p) { var m = /^(\d{4})(-\d{2})?$/.exec(p); return m ? (+m[1] - 1) + (m[2] || '') : null; }
    function m1(v, d) { return v == null ? '—' : nf(v / 1e6, d == null ? 1 : d); }
    function k1(v) { return v == null ? '—' : nf(v / 1e3, v >= 1e6 ? 0 : 1); }
    function usSlaughter(x) {
      return Promise.all([usData(x.r), x.r === 'US' ? null : usData('US')]).then(function (a) {
        var D = a[0], N = a[1] || a[0], S = D && D.series; if (!S) return null; var t = tt(), rows = [], per = '';
        ['cattle', 'calves', 'hogs', 'sheep', 'chick', 'turkey'].forEach(function (k) { var h = serLast(S, 'sl_' + k + '_hd'); if (!h) return; var lb = serAt(S, 'sl_' + k + '_lb', h[0]), ya = serAt(S, 'sl_' + k + '_hd', yAgo(h[0])), dw = serLast(N.series, 'dw_' + k);
          per = per > h[0] ? per : h[0]; rows.push([esc(t.usSp[k]), esc(mon(h[0])), nf(h[1], 0), lb != null ? m1(lb) : '—', ya != null ? nf(ya, 0) : '—', dw ? nf(dw[1], 0) : '—']); });
        if (!rows.length) return null;
        return card(t.usSl, t.usSlSub, table([t.species, t.mMonth, t.headsM, t.liveW, t.headsY, t.dressW], rows, 640), cite('usda_nass', per));
      });
    }
    function usStocks(x) {
      return Promise.all([usData(x.r), x.r === 'US' ? null : usData('US')]).then(function (a) {
        var S = a[0] && a[0].series, U = (a[1] || a[0]).series; if (!S) return null; var t = tt(), rows = [], per = '';
        ['corn', 'soy', 'wheat'].forEach(function (g) { var tot = serLast(S, 'st_' + g); if (!tot) return; per = per > tot[0] ? per : tot[0]; var on = serAt(S, 'st_' + g + '_on', tot[0]), off = serAt(S, 'st_' + g + '_off', tot[0]), ya = serAt(S, 'st_' + g, yAgo(tot[0])), us = serAt(U, 'st_' + g, tot[0]);
          var row = [esc(t.usG[g]), m1(tot[1]), m1(on), m1(off), ya != null ? m1(ya) + ' ' + faint(pct((tot[1] / ya - 1) * 100)) : '—']; if (x.r !== 'US') row.push(us ? share(tot[1], us) : '—'); rows.push(row); });
        if (!rows.length) return null;
        return card(t.usSt, t.usStSub, '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(mon(per)) + '</p>' + table([t.grain, t.stTot, t.stOn, t.stOff, t.stYa].concat(x.r !== 'US' ? [t.usShare] : []), rows, 560), cite('usda_nass', per));
      });
    }
    function usLand(x) {
      return usData(x.r).then(function (D) {
        var S = D && D.series; if (!S) return null; var t = tt(), rows = [], yr = '';
        ['lv_all', 'lv_crop', 'lv_crop_irr', 'lv_crop_dry', 'lv_pasture'].forEach(function (k) { var p = serLast(S, k); if (!p) return; yr = yr > p[0] ? yr : p[0]; var pv = serAt(S, k, yAgo(p[0])), rk = { lv_crop: 'rt_crop', lv_crop_irr: 'rt_crop_irr', lv_crop_dry: 'rt_crop_dry', lv_pasture: 'rt_pasture' }[k], r = rk && serLast(S, rk);
          rows.push([esc(t.usLk[k]), nf(p[1], 0) + ' ' + faint(p[0]), pv ? esc(pct((p[1] / pv - 1) * 100)) : '', r ? nf(r[1], r[1] < 100 ? 1 : 0) + ' ' + faint(r[0]) : '—']); });
        if (!rows.length) return null;
        var body = table(['', t.valueL + ' (' + t.perAcre + ')', t.vs, t.rentL + ' (' + t.perAcre + ')'], rows, 520), Cn = D.counties;
        if (Cn) { var lv = ['ce_cattle', 'ce_cows_milk', 'ce_hogs'].filter(function (k) { return Object.keys(Cn).some(function (f) { return Cn[f][k] != null; }); }); var cr = Object.keys(Cn).map(function (f) { var c = Cn[f], g = function (k) { var o = c[k]; if (!o || typeof o !== 'object') return null; var ys = Object.keys(o).sort(); return ys.length ? [ys[ys.length - 1], o[ys[ys.length - 1]]] : null; }, a = g('rt_crop_dry'), b = g('rt_crop_irr'), p2 = g('rt_pasture'); return (a || b || p2) ? [esc(c.name), a ? nf(a[1], 0) + ' ' + faint(a[0]) : '—', b ? nf(b[1], 0) + ' ' + faint(b[0]) : '—', p2 ? nf(p2[1], 0) + ' ' + faint(p2[0]) : '—'] : null; }).filter(Boolean).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
          if (cr.length) body += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13.5px">' + esc(t.countyRents) + ' (' + cr.length + ')</summary>' + table([t.county, t.usRk.rt_crop_dry, t.usRk.rt_crop_irr, t.usRk.rt_pasture], cr, 460) + '</details>'; }
        return card(t.usLand, t.usLandSub, body, cite('usda_nass', yr));
      });
    }
    function usDairy(x) {
      return usData(x.r).then(function (D) {
        var S = D && D.series; if (!S) return null; var t = tt(), rows = [], per = '';
        [['mk_prod', function (v) { return m1(v, 0); }], ['mk_cow', function (v) { return nf(v, 0); }], ['mk_cows', k1], ['pr_milk', function (v) { return nf(v, 2); }], ['eg_prod', function (v) { return m1(v, 1); }], ['eg_layers', k1]].forEach(function (z) {
          var p = serLast(S, z[0]); if (!p) return; per = per > p[0] ? per : p[0]; var ya = serAt(S, z[0], yAgo(p[0]));
          rows.push([esc(t.usDk[z[0]]), esc(mon(p[0])), z[1](p[1]), ya != null ? z[1](ya) : '—', ya ? esc(pct((p[1] / ya - 1) * 100)) : '']); });
        if (!rows.length) return null;
        return card(t.usDa, t.usDaSub, table(['', t.mMonth, t.valL, t.sameMonth, t.vs], rows, 520), cite('usda_nass', per));
      });
    }
    function usPrices(x) {
      if (x.r === 'US') return Promise.resolve(null);
      return Promise.all([usData(x.r), usData('US')]).then(function (a) {
        var S = a[0] && a[0].series, U = a[1] && a[1].series; if (!S) return null; var t = tt(), rows = [], per = '';
        Object.keys(t.usPk).forEach(function (k) { var p = serLast(S, k); if (!p) return; per = per > p[0] ? per : p[0]; var u = serAt(U, k, p[0]), ya = serAt(S, k, yAgo(p[0])), d = p[1] < 1 ? 3 : 2;
          rows.push([esc(t.usPk[k]), esc(mon(p[0])), nf(p[1], d), u != null ? nf(u, d) : '—', u ? esc(pct((p[1] / u - 1) * 100)) : '', ya != null ? nf(ya, d) : '—']); });
        if (!rows.length) return null;
        return card(t.usPr, t.usPrSub, table(['', t.mMonth, t.stateP, t.usP, t.vs, t.yoyS], rows, 600), cite('usda_nass', per));
      });
    }
    function usCensus(x) {
      return Promise.all([usData(x.r), x.r === 'US' ? null : usData('US')]).then(function (a) {
        var D = a[0], U = a[1], C = D && D.census2022; if (!C) return null; var t = tt(), rows = [];
        Object.keys(t.usCk).forEach(function (k) { if (C[k] == null) return; var u = U && U.census2022 && U.census2022[k], isUsd = /sales|crops|animals|govt/.test(k);
          var row = [esc(t.usCk[k]), isUsd ? nf(C[k] / 1e6, 1) + ' M' : nf(C[k], k === 'ce_age' ? 1 : 0)]; if (U) row.push(u && !/avgsize|age/.test(k) ? share(C[k], u) : u ? nf(u, k === 'ce_age' ? 1 : 0) + ' ' + faint(t.usP) : '—'); rows.push(row); });
        if (!rows.length) return null;
        var body = table(['', '2022'].concat(U ? [t.usShare] : []), rows, 420), Cn = D.counties;
        if (Cn) { var cr = Object.keys(Cn).map(function (f) { var c = Cn[f]; return c.ce_farms != null ? [esc(c.name), nf(c.ce_farms, 0), c.ce_acres != null ? nf(c.ce_acres, 0) : '—', c.ce_sales != null ? nf(c.ce_sales / 1e6, 1) + ' M' : '—'].concat(lv.map(function (k) { return c[k] != null ? nf(c[k], 0) : '—'; })) : null; }).filter(Boolean).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
          if (cr.length) body += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13.5px">' + esc(t.countiesL) + ' (' + cr.length + ')</summary>' + table([t.county, t.usCk.ce_farms, t.usCk.ce_acres, t.usCk.ce_sales].concat(lv.map(function (k) { return t.usCk[k]; })), cr, 460 + 90 * lv.length) + '</details>'; }
        return card(t.usCe, t.usCeSub, body, cite('usda_nass', '2022'));
      });
    }
    function usIncome(x) {
      return usData(x.r).then(function (D) {
        var S = D && D.series; if (!S || !S.ers_net_income) return null; var t = tt(), ys = S.ers_net_income.points.map(function (p) { return p[0]; }).slice(-4), rows = [];
        Object.keys(t.usIk).forEach(function (k) { if (!S[k]) return; rows.push([esc(t.usIk[k])].concat(ys.map(function (y) { var v = serAt(S, k, y); return v == null ? '—' : nf(v / 1e3, 0) + ' M'; }))); });
        return card(t.usIn, t.usInSub, table([''].concat(ys), rows, 520), cite('usda_ers', ys[ys.length - 1]));
      });
    }
    /* Ingresos en efectivo por producto y estado (USDA ERS, Farm Income and Wealth Statistics; data/us-cash-receipts.json, scripts/update-us-cash-receipts.py) */
    function usReceipts(x) {
      return get('data/us-cash-receipts.json').then(function (D) {
        var S = D && D.states && D.states[x.r]; if (!S || !S.items || !S.items.length || !D.years) return null;
        var ys = D.years.slice(-4), off = D.years.length - 4, tot = S.total && S.total[S.total.length - 1], rows = [];
        var rk = H.ranks(S.items.map(function (it) { return it[1][it[1].length - 1]; }));   /* oro, plata y bronce por ingresos del último año; el resto lleva su número */
        var ord = S.items.map(function (it, i) { return i; }).sort(function (p, q) { var a = S.items[p][1][S.items[p][1].length - 1], b = S.items[q][1][S.items[q][1].length - 1]; return (b == null ? -Infinity : b) - (a == null ? -Infinity : a) || p - q; }), pos = {};
        ord.forEach(function (i, n) { pos[i] = n + 1; });
        S.items.forEach(function (it, ix) {
          var last = it[1][it[1].length - 1], nm = it[0].charAt(0).toUpperCase() + it[0].slice(1);
          rows.push([(last == null ? '' : rk[ix] >= 0 ? H.medal(rk[ix]) : H.numTag(pos[ix])) + esc(nm)].concat(ys.map(function (y, i) { var v = it[1][off + i]; return v == null ? '—' : nf(v / 1e3, v >= 1e5 ? 0 : 1) + ' M'; }), [tot && last != null ? nf(last / tot * 100, 1) + ' %' : '—']));
        });
        var hd = [L('Producto|Commodity|Produit|Prodotto')].concat(ys.map(function (y) { return String(y); }), [L('Cuota del total|Share of total|Part du total|Quota sul totale')]);
        return card(L('Ingresos por producto|Cash receipts by commodity|Recettes par produit|Ricavi per prodotto'),
          L('Los 12 productos con más ingresos en efectivo en el estado (USDA ERS, Farm Income and Wealth Statistics), millones de dólares corrientes. Los nombres son los de ERS, en inglés. El último año puede ser una previsión de ERS. La cuota es un cálculo de Dehesa Index: ingresos del producto entre los ingresos en efectivo de todos los productos del estado.|The 12 commodities with the highest cash receipts in the state (USDA ERS, Farm Income and Wealth Statistics), million current dollars. Names are ERS’s own. The latest year may be an ERS forecast. The share is a Dehesa Index calculation: commodity receipts divided by the state’s cash receipts for all commodities.|Les 12 produits aux recettes en espèces les plus élevées de l’État (USDA ERS, Farm Income and Wealth Statistics), millions de dollars courants. Les noms sont ceux d’ERS, en anglais. La dernière année peut être une prévision d’ERS. La part est un calcul de Dehesa Index : recettes du produit divisées par les recettes en espèces de tous les produits de l’État.|I 12 prodotti con i maggiori ricavi in contanti nello Stato (USDA ERS, Farm Income and Wealth Statistics), milioni di dollari correnti. I nomi sono quelli di ERS, in inglese. L’ultimo anno può essere una previsione dell’ERS. La quota è un calcolo di Dehesa Index: ricavi del prodotto divisi per i ricavi in contanti di tutti i prodotti dello Stato.'),
          table(hd, rows, 620) + H.medalNote('value'), cite('usda_ers', D.years[D.years.length - 1]));
      });
    }
    /* Gasóleo por región PADD y propano del estado (js/us-market.js se baja solo aquí) */
    function usFuel(x) {
      if (x.r === 'US') return Promise.resolve(null);
      var need = window.DehesaUsMarket ? Promise.resolve() : new Promise(function (ok) { var e = document.createElement('script'); e.src = 'js/us-market.js'; e.onload = ok; e.onerror = ok; document.head.appendChild(e); });
      return need.then(function () { return window.DehesaUsMarket ? window.DehesaUsMarket.stateHtml(x.r) : null; }).then(function (o) { var t = tt(); return o && o.html ? card(t.usfuel, t.usFuelSub, o.html, '') : null; });
    }
    var FSA_CROP = { corn: 'Maíz|Corn|Maïs|Mais', soybeans: 'Soja|Soybeans|Soja|Soia', wheat: 'Trigo|Wheat|Blé|Frumento', barley: 'Cebada|Barley|Orge|Orzo', oats: 'Avena|Oats|Avoine|Avena',
      'grain sorghum': 'Sorgo grano|Grain sorghum|Sorgho grain|Sorgo da granella', peanuts: 'Cacahuete|Peanuts|Arachide|Arachidi', 'seed cotton': 'Algodón en semilla|Seed cotton|Coton graine|Cotone in seme',
      canola: 'Canola|Canola|Canola|Canola', sunflowers: 'Girasol|Sunflowers|Tournesol|Girasole', 'sunflower seed': 'Pipa de girasol|Sunflower seed|Graine de tournesol|Seme di girasole', 'dry peas': 'Guisantes secos|Dry peas|Pois secs|Piselli secchi',
      lentils: 'Lentejas|Lentils|Lentilles|Lenticchie', 'large chickpeas': 'Garbanzo grande|Large chickpeas|Gros pois chiches|Ceci grandi', 'small chickpeas': 'Garbanzo pequeño|Small chickpeas|Petits pois chiches|Ceci piccoli',
      flaxseed: 'Linaza|Flaxseed|Graine de lin|Seme di lino', 'long grain rice': 'Arroz de grano largo|Long grain rice|Riz long|Riso a grana lunga', 'medium grain rice': 'Arroz de grano medio|Medium grain rice|Riz moyen|Riso a grana media',
      'temperate japonica rice': 'Arroz japónica templado|Temperate japonica rice|Riz japonica tempéré|Riso japonica temperato', safflower: 'Cártamo|Safflower|Carthame|Cartamo', 'mustard seed': 'Semilla de mostaza|Mustard seed|Graine de moutarde|Seme di senape',
      rapeseed: 'Colza|Rapeseed|Colza|Colza', 'rice (long grain)': 'Arroz de grano largo|Long grain rice|Riz long|Riso a grana lunga', 'rice (med/short grain)': 'Arroz de grano medio y corto|Medium/short grain rice|Riz moyen et rond|Riso a grana media e corta', 'rice (temperate japonica)': 'Arroz japónica templado|Temperate japonica rice|Riz japonica tempéré|Riso japonica temperato', crambe: 'Crambe|Crambe|Crambe|Crambe', 'sesame seed': 'Sésamo|Sesame seed|Sésame|Sesamo' };
    function fsaCrop(c) { var v = FSA_CROP[String(c).toLowerCase().replace(/\s+\d\/$/, '').trim()]; return v ? L(v) : c; }
    /* ARC-CO por condado (FSA): tasas por acre base tal como se publican; el resumen por cultivo (condados con pago, tasa máxima) se cuenta aquí */
    function usArc(x) {
      if (x.r === 'US') return Promise.resolve(null);
      return Promise.all([get('data/us-arcplc/' + x.r + '.json'), get('data/us-arcplc/national.json')]).then(function (a) {
        var D = a[0], N = a[1], t = tt(); if (!D || !D.counties) return null;
        var crops = {}, years = (D.years || []).slice().sort();
        Object.keys(D.counties).forEach(function (f) { var c = D.counties[f]; Object.keys(c.crops).forEach(function (k) { var e = c.crops[k]; (crops[k] = crops[k] || { e: e, rows: [] }).rows.push({ name: c.name, y: e.years }); }); });
        var Y = null; years.slice().reverse().some(function (y) { var any = Object.keys(crops).some(function (k) { return crops[k].rows.some(function (r) { return r.y[y] && r.y[y].rate != null; }); }); if (any) Y = y; return any; });
        var body = '';
        if (Y) {
          var y0 = String(+Y - 1), list = Object.keys(crops).map(function (k) { var c = crops[k], rs = c.rows.filter(function (r) { return r.y[Y] && r.y[Y].rate != null; }); return { k: k, c: c, rs: rs, paid: rs.filter(function (r) { return r.y[Y].rate > 0; }).length, mx: rs.reduce(function (m, r) { return Math.max(m, r.y[Y].rate); }, 0) }; })
            .filter(function (z) { return z.rs.length; }).sort(function (p, q) { return q.rs.length - p.rs.length; });
          body += '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(H.yearWord()) + ' ' + esc(Y) + ' · ' + esc(t.perBase) + '</p>' + list.map(function (z) {
            var e = z.c.e, lab = fsaCrop(e.crop) + (e.type && e.type !== 'All' ? ' (' + ((t.arcType || {})[e.type] || e.type) + ')' : '') + (e.sub ? ' · ' + e.sub : '');
            var rows = z.rs.slice().sort(function (p, q) { return q.y[Y].rate - p.y[Y].rate || (p.name < q.name ? -1 : 1); }).map(function (r) { var v = r.y[Y], w = r.y[y0]; return [esc(r.name), nf(v.rate, 2), w && w.rate != null ? nf(w.rate, 2) : '—', v.bmRev != null ? nf(v.bmRev, 2) : '—', v.actRev != null ? nf(v.actRev, 2) : '—']; });
            return '<details class="usm-more"><summary>' + esc(lab) + ' — ' + z.rs.length + ' ' + esc(t.arcN) + ', ' + z.paid + ' ' + esc(t.arcPay) + (z.paid ? ', ' + esc(t.arcMax) + ' ' + nf(z.mx, 2) : '') + '</summary>' + table([t.county2, t.arcRate + ' ' + Y, t.arcRate + ' ' + y0, t.arcBm + ' ' + Y, t.arcAct + ' ' + Y], rows, 560) + '</details>';
          }).join('');
        } else body += '<p class="di-movers-hint">' + esc(t.arcNone) + '</p>';
        var P = N && N.plc, py = P ? Object.keys(P).sort().slice(-3) : [];
        if (py.length) {
          var names = {}; py.forEach(function (y) { P[y].forEach(function (r) { names[r.crop] = r.unit; }); });
          var pr = Object.keys(names).map(function (c) { return [esc(fsaCrop(c)), esc(names[c])].concat(py.map(function (y) { var r = P[y].filter(function (q) { return q.crop === c; })[0]; return !r || r.rate == null ? '—' : nf(r.rate, r.rate < 1 ? 4 : 2) + (r.rateFlag === 'P' ? ' <span style="color:var(--text-faint)">(' + esc(t.flagP) + ')</span>' : ''); })); });
          body += '<details class="usm-more"><summary>' + esc(t.plcT) + ' (' + pr.length + ')</summary>' + table([t.arcCrop, t.unitL].concat(py.map(function (y) { return t.plcRate + ' ' + y; })), pr, 560) + '</details>';
        }
        return card(t.usarc, t.usArcSub, body, cite('usda_fsa', Y || ''));
      });
    }

    /* ---- España: mercados (lonjas) por provincia de cada comunidad, del portal agroalimentario de la Comisión (data/eu/cereales.json y aceite.json) ---- */
    var LJ_PROV = { ES: { AN: ['Cadiz', 'Cordoba', 'Granada', 'Jaen', 'Malaga', 'Sevilla'], AR: ['Huesca', 'Zaragoza'], CL: ['Burgos', 'Leon', 'Palencia', 'Segovia', 'Valladolid', 'Zamora'], CM: ['Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara', 'Toledo'], CT: ['Lleida', 'Tarragona'], EX: ['Badajoz'], NC: ['Navarra'] },
      IT: { PUG: ['Bari', 'Brindisi', 'Foggia', 'Lecce', 'Taranto'], CAL: ['Catanzaro', 'Cosenza', 'Gioia Tauro'], SIC: ['Palermo', 'Trapani'], CAM: ['Salerno'], LOM: ['Milano'], EMR: ['Bologna'], VEN: ['Treviso'] },
      DE: { BY: ['Würzburg', 'München'], BW: ['Mannheim'], NW: ['Köln', 'Niederrhein'], HB: ['Bremen'], HH: ['Hamburg'], NI: ['Brake'], RP: ['Mainz'], SN: ['Riesa'] },
      FR: { NAQ: ['Bordeaux'], GES: ['Le Mériot'], NOR: ['Rouen'], BRE: ['Brest', 'Lorient'], PDL: ['Montoir', 'Saint Nazaire'], OCC: ['Sète'] } };
    var LJ_FAM = { ES: ['cereales', 'aceite'], IT: ['aceite', 'oleaginosas'], DE: ['oleaginosas'], FR: ['oleaginosas'] };
    var LJ_NAME = { Cadiz: 'Cádiz', Cordoba: 'Córdoba', Jaen: 'Jaén', Malaga: 'Málaga', Leon: 'León' };
    var LJ_TITLE = { 'feed-barley-departure': 'Cebada pienso|Feed barley|Orge fourragère|Orzo da foraggio', 'feed-wheat-departure': 'Trigo pienso|Feed wheat|Blé fourrager|Frumento da foraggio', 'milling-wheat-departure': 'Trigo blando panificable|Milling wheat|Blé tendre meunier|Frumento tenero panificabile', 'durum-wheat-departure': 'Trigo duro|Durum wheat|Blé dur|Frumento duro', 'feed-maize-departure': 'Maíz pienso|Feed maize|Maïs fourrager|Mais da foraggio', 'malting-barley-departure': 'Cebada cervecera|Malting barley|Orge de brasserie|Orzo da birra',
      'extra-virgin-olive-oil-up-to': 'Aceite de oliva virgen extra|Extra virgin olive oil|Huile d’olive vierge extra|Olio extra vergine di oliva', 'virgin-olive-oil-up-to': 'Aceite de oliva virgen|Virgin olive oil|Huile d’olive vierge|Olio di oliva vergine', 'lampante-olive-oil': 'Aceite de oliva lampante|Lampante olive oil|Huile d’olive lampante|Olio di oliva lampante', 'refined-olive-oil-up-to': 'Aceite de oliva refinado|Refined olive oil|Huile d’olive raffinée|Olio di oliva raffinato', 'refined-olive-pomace': 'Aceite de orujo refinado|Refined olive-pomace oil|Huile de grignons raffinée|Olio di sansa raffinato' };
    var LJ_WORD = { 'Soya beans': 'Soja en grano|Soya beans|Fèves de soja|Semi di soia', 'Soya meal': 'Harina de soja|Soya meal|Tourteau de soja|Farina di soia', 'Rapeseed': 'Colza|Rapeseed|Colza|Colza', 'Rapeseed meal': 'Harina de colza|Rapeseed meal|Tourteau de colza|Farina di colza', 'Sunflower seed': 'Girasol|Sunflower seed|Tournesol|Girasole', 'Sunflower seed meal': 'Harina de girasol|Sunflower seed meal|Tourteau de tournesol|Farina di girasole', 'Crude rape oil': 'Aceite de colza crudo|Crude rape oil|Huile de colza brute|Olio di colza greggio', 'Standard': 'Estándar|Standard|Standard|Standard', 'High-oleic': 'Alto oleico|High-oleic|Oléique|Alto oleico', '40-50% protein content': '40-50 % de proteína|40-50% protein content|40-50 % de protéines|40-50 % di proteine' };
    var LJ_T = { es: ['Lonjas y mercados', 'Último precio semanal en los mercados de esta región, tal como lo publica la Comisión Europea (no se promedia). Solo los que tienen cotización reciente.', 'Producto', 'Mercado', 'Precio', '1 sem.', 'Fecha', 'Ver todos los mercados'],
      en: ['Local markets', 'Latest weekly price in the markets of this region, as published by the European Commission (not averaged). Only those with a recent quote.', 'Product', 'Market', 'Price', '1 wk', 'Date', 'See all markets'],
      fr: ['Marchés locaux', 'Dernier prix hebdomadaire sur les marchés de cette région, tel que publié par la Commission européenne (sans moyenne). Seulement ceux avec une cotation récente.', 'Produit', 'Marché', 'Prix', '1 sem.', 'Date', 'Voir tous les marchés'],
      it: ['Mercati locali', 'Ultimo prezzo settimanale nei mercati di questa regione, come pubblicato dalla Commissione europea (senza media). Solo quelli con quotazione recente.', 'Prodotto', 'Mercato', 'Prezzo', '1 sett.', 'Data', 'Vedi tutti i mercati'] };
    function ljDay(s) { var q = s.split('-'); return Date.UTC(+q[0], +q[1] - 1, +q[2]) / 864e5; }
    function ljTitle(id, parts) { for (var k in LJ_TITLE) if (id.indexOf(k) === 0) return L(LJ_TITLE[k]); return parts.map(function (w) { return LJ_WORD[w] ? L(LJ_WORD[w]) : w; }).join(' · '); }
    function esLonjas(x) {
      var provs = (LJ_PROV[x.c] || {})[x.r], fams = LJ_FAM[x.c]; if (!provs || !fams) return Promise.resolve(null);
      return Promise.all(fams.map(function (f) { return get('data/eu/' + f + '.json'); })).then(function (ds) {
        var rows = [], latest = '', T = LJ_T[H.lang()] || LJ_T.es;
        fams.forEach(function (f, fi) {
          var d = ds[fi]; if (!d || !d.series) return;
          d.series.forEach(function (s) {
            var es = s.regions.filter(function (r) { return r.c === x.c; }), ref = ''; es.forEach(function (r) { if (r.last[0] > ref) ref = r.last[0]; });
            var by = {};
            es.forEach(function (r) { if (!r.m) return; var n = r.m.replace(/\s*\([A-Z]{2}[A-Z0-9]{1,5}\)/, '').replace(/\s+$/, ''); if (n === 'Lerida') n = 'Lleida'; if (provs.indexOf(n) < 0) return; if (!by[n] || r.last[0] > by[n].last[0]) by[n] = r; });
            Object.keys(by).forEach(function (n) {
              var r = by[n]; if (ljDay(ref) - ljDay(r.last[0]) > 28) return;
              var w = r.prev && r.prev[1] && Math.abs(ljDay(r.last[0]) - ljDay(r.prev[0]) - 7) <= 6 ? (r.last[1] / r.prev[1] - 1) * 100 : null; if (r.last[0] > latest) latest = r.last[0];
              rows.push([esc(ljTitle(s.id, s.parts)), esc(LJ_NAME[n] || n), nf(r.last[1], s.unit.indexOf('100') > 0 ? 2 : 1) + ' ' + faint(s.unit), w == null ? '—' : (w > 0.05 ? '+' : w < -0.05 ? '−' : '') + nf(Math.abs(w), 1) + ' %', esc(day(r.last[0]))]);
            });
          });
        });
        if (!rows.length) return null;
        return card(T[0], T[1], table([T[2], T[3], T[4], T[5], T[6]], rows, 560) + link('lonjas.html?c=' + x.c, T[7]), cite('eu_agrifood', latest));
      });
    }
    /* ---- EE. UU.: estado semanal de los cultivos en el estado (NASS Crop Progress, data/us-crop-progress/<ST>.json) ---- */
    var CPN = { corn: 'Maíz|Corn|Maïs|Mais', soybeans: 'Soja|Soybeans|Soja|Soia', wheat_winter: 'Trigo de invierno|Winter wheat|Blé d’hiver|Frumento invernale', wheat_spring: 'Trigo de primavera|Spring wheat|Blé de printemps|Frumento primaverile', cotton: 'Algodón|Cotton|Coton|Cotone', sorghum: 'Sorgo|Sorghum|Sorgho|Sorgo', barley: 'Cebada|Barley|Orge|Orzo', rice: 'Arroz|Rice|Riz|Riso', oats: 'Avena|Oats|Avoine|Avena', peanuts: 'Cacahuete|Peanuts|Arachides|Arachidi' };
    function cpAt(rows, we, tol) { var t = Date.parse(we), best = null, bd = 1e12; (rows || []).forEach(function (r) { var d = Math.abs(Date.parse(r[0]) - t); if (d < bd) { bd = d; best = r; } }); return best && bd <= tol * 864e5 ? best : null; }
    function usCropProg(x) {
      return get('data/us-crop-progress/' + x.r + '.json').then(function (d) {
        if (!d || !d.crops) return null; var rows = [], latest = '', cutoff = new Date(Date.now() - 200 * 864e5).toISOString().slice(0, 10);
        Object.keys(d.crops).forEach(function (k) {
          var c = d.crops[k], ys = Object.keys(c.condition || {}).concat(Object.keys(c.progress || {})).sort(), Y = ys[ys.length - 1]; if (!Y) return;
          var cr = c.condition && c.condition[Y], l = cr && cr[cr.length - 1], pr = cr && cr[cr.length - 2], ly = l && c.condition[String(+Y - 1)] ? cpAt(c.condition[String(+Y - 1)], new Date(Date.parse(l[0]) - 364 * 864e5).toISOString().slice(0, 10), 4) : null;
          var stage = function (name) { var a = c.progress && c.progress[Y] && c.progress[Y][name]; if (!a || !a.length) return null; var q = a[a.length - 1], av = c.avg && c.avg[Y] && c.avg[Y][name], m = av ? cpAt(av, q[0], 0) : null; return { w: q[0], v: q[1], avg: m ? m[1] : null }; };
          var pl = stage('planted'), hv = stage('harvested'), w = l ? l[0] : (hv ? hv.w : pl ? pl.w : ''); if (!w || w < cutoff) return;
          var ge = l ? l[4] + l[5] : null, gp = pr ? pr[4] + pr[5] : null, gl = ly ? ly[4] + ly[5] : null; latest = latest > w ? latest : w;
          var cell = function (o) { return o ? nf(o.v, 0) + ' %' + (o.avg != null ? ' ' + faint('(' + L('media|avg|moy.|media') + ' ' + nf(o.avg, 0) + ')') : '') : '—'; };
          rows.push({ s: ge == null ? -1 : ge, r: [esc(L(CPN[k] || k)), esc(day(w)), ge == null ? '—' : '<b>' + nf(ge, 0) + ' %</b>', ge != null && gp != null ? (ge - gp > 0 ? '+' : ge - gp < 0 ? '−' : '') + nf(Math.abs(ge - gp), 0) + ' ' + L('pp|pp|pts|pp') : '—', gl != null ? nf(gl, 0) + ' %' : '—', cell(pl), cell(hv)] });
        });
        if (!rows.length) return null; rows.sort(function (a, b) { return b.s - a.s; });
        return card(L('Estado de los cultivos|Crop condition|État des cultures|Stato delle colture'), L('Valoración semanal en el estado: % de la superficie en estado bueno o excelente, cambio frente a la semana anterior y mismo momento del año pasado, y avance de siembra y cosecha frente a la media de 5 años (USDA NASS, Crop Progress). Solo aparecen los cultivos que el NASS sigue en este estado.|Weekly state rating: % of acreage rated good or excellent, change from the previous week and from the same time last year, and planting and harvest progress against the 5-year average (USDA NASS, Crop Progress). Only the crops NASS tracks in this state appear.|Évaluation hebdomadaire dans l’État : % de la surface jugée bonne ou excellente, variation sur la semaine précédente et sur la même période l’an dernier, et avancement des semis et récoltes par rapport à la moyenne de 5 ans (USDA NASS, Crop Progress). Seules figurent les cultures suivies par le NASS dans cet État.|Valutazione settimanale nello Stato: % della superficie in condizioni buone o eccellenti, variazione sulla settimana precedente e sullo stesso periodo dell’anno scorso, e avanzamento di semine e raccolta rispetto alla media di 5 anni (USDA NASS, Crop Progress). Compaiono solo le colture seguite dal NASS in questo Stato.'),
          table([L('Cultivo|Crop|Culture|Coltura'), L('Semana|Week ending|Semaine|Settimana'), L('Bueno o excelente|Good or excellent|Bon ou excellent|Buono o eccellente'), L('Frente a la semana anterior|vs previous week|vs semaine précédente|vs settimana precedente'), L('Año pasado|Last year|Année dernière|Anno scorso'), L('Sembrado|Planted|Semé|Seminato'), L('Cosechado|Harvested|Récolté|Raccolto')], rows.map(function (q) { return q.r; }), 720), cite('usda_nass', latest));
      });
    }
    function caSubList(rows, head, w, topN, label) { return usCountyList(rows, head, w, topN, label); }
    function caCensus(x) {
      return get('data/ca-sub/census/' + x.r + '.json').then(function (d) {
        if (!d || !d.areas) return null; var A = d.areas, ks = Object.keys(A).filter(function (k) { var l = A[k].l; return (l === 'CAR' || l === 'CD') && A[k].v.farms; });
        if (!ks.length) return null; var t = tt(), K = function (v) { return v == null ? '—' : nf(v / 1000, 0) + ' k'; };
        var row = function (k) { var a = A[k], v = a.v; return [esc(a.n), nf(v.farms, 0), K(v.c_total), v.l_cattle != null ? nf(v.l_cattle, 0) : '—']; };
        var by = function (lv) { return ks.filter(function (k) { return A[k].l === lv; }).sort(function (a, b) { return A[b].v.farms - A[a].v.farms; }); };
        var car = by('CAR').map(row), cd = by('CD').map(row);
        var head = [L('Zona|Area|Zone|Zona'), L('Explotaciones|Farms|Exploitations|Aziende'), L('Cultivos (acres)|Cropland (acres)|Cultures (acres)|Colture (acri)'), L('Vacuno (cabezas)|Cattle (head)|Bovins (têtes)|Bovini (capi)')];
        var body = caSubList(car.length ? car : cd, head, 560, 12, L('Todas las zonas|All areas|Toutes les zones|Tutte le zone'));
        if (car.length && cd.length) body += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13.5px">' + esc(L('Divisiones censales|Census divisions|Divisions de recensement|Divisioni censuarie')) + ' (' + cd.length + ')</summary>' + table(head, cd, 560) + '</details>';
        return card(L('Censo agrario 2021 por zona|Census of Agriculture 2021 by area|Recensement de l’agriculture 2021 par zone|Censimento agricolo 2021 per zona'), L('Explotaciones, superficie, cultivos y vacuno por región agraria y división censal. Hay más detalle (subdivisiones, cultivos, ingresos) en los ficheros de datos.|Farms, land, cropland and cattle by agricultural region and census division. More detail (subdivisions, crops, revenue) is in the data files.|Exploitations, superficie, cultures et bovins par région agricole et division de recensement. Plus de détail dans les fichiers de données.|Aziende, superficie, colture e bovini per regione agraria e divisione censuaria. Più dettaglio nei file di dati.'), body, cite('statcan', '2021'));
      });
    }
    var CA_YC = [['wheat-all', 'Trigo|Wheat|Blé|Grano'], ['canola', 'Colza (canola)|Canola|Canola|Colza (canola)'], ['barley', 'Cebada|Barley|Orge|Orzo'], ['oats', 'Avena|Oats|Avoine|Avena'], ['corn', 'Maíz grano|Grain corn|Maïs-grain|Mais da granella'], ['soybeans', 'Soja|Soybeans|Soja|Soia']];
    function caYields(x) {
      return Promise.all(CA_YC.map(function (c) { return get('data/ca-sub/yields/' + c[0] + '.json'); })).then(function (fs) {
        var t = tt(), rows = [], more = [], yr = null;
        fs.forEach(function (d, i) {
          if (!d || !d.regions) return; var ys = d.years, n = ys.length - 1, nm = L(CA_YC[i][1]);
          Object.keys(d.regions).forEach(function (k) { var r = d.regions[k]; if (r.p !== x.r) return; var y = r.v.yield, pr = r.v.production; if (!y) return;
            var j = n; while (j >= 0 && y[j] == null) j--; if (j < 0 || j < n - 2) return; yr = yr == null ? ys[j] : Math.max(yr, ys[j]);
            var prev = y.slice(Math.max(0, j - 5), j).filter(function (v) { return v != null; }), av = prev.length ? prev.reduce(function (a, b) { return a + b; }, 0) / prev.length : null;
            var line = [esc(r.l === 'PR' ? nm : esc(r.n) + ' ' + faint(nm)), esc(String(ys[j])), nf(y[j] / 1000, 2), av ? (y[j] >= av ? '+' : '−') + nf(Math.abs(y[j] / av - 1) * 100, 0) + ' %' : '—', pr && pr[j] != null ? (pr[j] >= 1e6 ? nf(pr[j] / 1e6, 1) + ' Mt' : nf(pr[j] / 1e3, 0) + ' kt') : '—'];
            (r.l === 'PR' ? rows : more).push(line); });
        });
        if (!rows.length) return null;
        var head = [L('Cultivo|Crop|Culture|Coltura'), L('Año|Year|Année|Anno'), L('Rendimiento (t/ha)|Yield (t/ha)|Rendement (t/ha)|Resa (t/ha)'), L('Frente a los 5 años previos|vs previous 5 years|vs 5 années précédentes|vs 5 anni precedenti'), L('Producción|Production|Production|Produzione')];
        var body = table(head, rows, 620);
        if (more.length) body += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13.5px">' + esc(L('Por región de datos de área pequeña|By small area data region|Par région de données de petites régions|Per regione di dati di piccola area')) + ' (' + more.length + ')</summary>' + table(head, more, 620) + '</details>';
        return card(L('Rendimientos por región|Yields by region|Rendements par région|Rese per regione'), L('Rendimiento, superficie y producción desde 1976 por región de datos de área pequeña (series completas en los ficheros de datos).|Yield, area and production since 1976 by small area data region (full series in the data files).|Rendement, superficie et production depuis 1976 par région (séries complètes dans les fichiers de données).|Resa, superficie e produzione dal 1976 per regione (serie complete nei file di dati).'), body, cite('statcan', String(yr || '')));
      });
    }
    function caNdvi(x) {
      return get('data/ca-sub/ndvi/' + x.r + '.json').then(function (d) {
        if (!d || !d.areas || !d.years || !d.years.length) return null; var t = tt(), n = d.years.length - 1, A = d.areas;
        var one = function (k) { var a = A[k], pk = a.v.crop_peak || a.v.all_peak; if (!pk || pk[n] == null) return null; var prev = pk.slice(Math.max(0, n - 10), n).filter(function (v) { return v != null; }); if (prev.length < 5) return null;
          var av = prev.reduce(function (p, q) { return p + q; }, 0) / prev.length; return { k: k, v: pk[n], av: av, a: a }; };
        var list = Object.keys(A).map(one).filter(Boolean); if (!list.length) return null;
        var row = function (o) { var dd = o.v - o.av; return [esc(o.a.n) + ' ' + faint(o.a.l), nf(o.v, 2), nf(o.av, 2), (dd >= 0 ? '+' : '−') + nf(Math.abs(dd), 2)]; };
        var head = [L('Zona|Area|Zone|Zona'), L('Máximo de la temporada|Season peak|Maximum de la saison|Massimo stagionale'), L('Media de los 10 años previos|Previous 10-year mean|Moyenne des 10 années précédentes|Media dei 10 anni precedenti'), L('Diferencia|Difference|Écart|Differenza')];
        var car = list.filter(function (o) { return o.a.l === 'CAR'; }).sort(function (a, b) { return a.a.n < b.a.n ? -1 : 1; }).map(row), cd = list.filter(function (o) { return o.a.l === 'CD'; }).sort(function (a, b) { return a.a.n < b.a.n ? -1 : 1; }).map(row);
        var body = caSubList(car.length ? car : cd, head, 560, 12, L('Todas las zonas|All areas|Toutes les zones|Tutte le zone'));
        if (car.length && cd.length) body += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13.5px">' + esc(L('Divisiones censales|Census divisions|Divisions de recensement|Divisioni censuarie')) + ' (' + cd.length + ')</summary>' + table(head, cd, 560) + '</details>';
        return card(L('Vigor de la vegetación (NDVI) por zona|Vegetation vigour (NDVI) by area|Vigueur de la végétation (NDVI) par zone|Vigore della vegetazione (NDVI) per zona'), L('Máximo de la temporada abril–octubre en tierra de cultivo, satélite a 1 km, año |April–October season peak over cropland, 1 km satellite, year |Maximum de la saison avril–octobre sur les terres cultivées, satellite 1 km, année |Massimo stagionale aprile–ottobre su terre coltivate, satellite 1 km, anno ') + d.years[n] + L('. La fuente se detiene en mayo de 2024.|. The source stops in May 2024.|. La source s’arrête en mai 2024.|. La fonte si ferma a maggio 2024.'), body, cite('statcan', String(d.years[n])));
      });
    }
    /* ---- Alemania: censo agrario por Land ---- */
    function deLzRows(d, specs) {
      var Y = d.years, ix = [0, 2, 3, 4], rows = [];
      specs.forEach(function (sp) {
        var c = d.tables[sp[0]] && d.tables[sp[0]][sp[1]], a = c && c[sp[2]]; if (!a || a.every(function (v) { return v == null; })) return;
        var f = null, l = null; a.forEach(function (v, i) { if (v != null) { if (f == null) f = i; l = i; } });
        var ch = f != null && l > f && a[f] ? (a[l] / a[f] - 1) * 100 : null, fm = function (v) { return v == null ? '—' : nf(v, 0); };
        rows.push([esc(L(sp[3])), ix.map(function (i) { return fm(a[i]); }), ch == null ? '—' : (Math.round(Math.abs(ch)) === 0 ? '0' : (ch > 0 ? '+' : '−') + nf(Math.abs(ch), 0)) + ' %']);
      });
      return rows.map(function (r) { return [r[0]].concat(r[1], [r[2]]); });
    }
    function deLzCard(x, kind) {
      return get('data/de-lz/' + x.r + '.json').then(function (d) {
        if (!d || !d.tables) return null; var Y = d.years, S = {
          struct: [['landuse', 'Landwirtschaftlich genutzte Fläche', 'farms', 'Explotaciones|Farms|Exploitations|Aziende'], ['landuse', 'Landwirtschaftlich genutzte Fläche', 'area', 'Superficie agraria (ha)|Farmland (ha)|Surface agricole (ha)|Superficie agricola (ha)'], ['landuse', 'Ackerland', 'area', 'Tierra de cultivo (ha)|Arable land (ha)|Terres arables (ha)|Seminativi (ha)'],
            ['landuse', 'Dauergrünland', 'area', 'Pastos permanentes (ha)|Permanent grassland (ha)|Prairies permanentes (ha)|Prati permanenti (ha)'], ['landuse', 'Dauerkulturen', 'area', 'Cultivos permanentes (ha)|Permanent crops (ha)|Cultures permanentes (ha)|Colture permanenti (ha)'],
            ['organic', 'Insgesamt', 'farms', 'Explotaciones ecológicas|Organic farms|Exploitations bio|Aziende biologiche'], ['organic', 'Insgesamt', 'area', 'Superficie ecológica (ha)|Organic area (ha)|Surface bio (ha)|Superficie biologica (ha)'], ['irrigation', 'Insgesamt', 'area', 'Superficie regada (ha)|Irrigated area (ha)|Surface irriguée (ha)|Superficie irrigata (ha)']],
          crops: [['arable', 'Winterweizen (einschließlich Dinkel und Einkorn)', 'area', 'Trigo de invierno (ha)|Winter wheat (ha)|Blé d’hiver (ha)|Frumento invernale (ha)'], ['arable', 'Wintergerste', 'area', 'Cebada de invierno (ha)|Winter barley (ha)|Orge d’hiver (ha)|Orzo invernale (ha)'], ['arable', 'Sommergerste', 'area', 'Cebada de primavera (ha)|Spring barley (ha)|Orge de printemps (ha)|Orzo primaverile (ha)'],
            ['arable', 'Roggen und Wintermenggetreide', 'area', 'Centeno (ha)|Rye (ha)|Seigle (ha)|Segale (ha)'], ['arable', 'Winterraps', 'area', 'Colza (ha)|Rapeseed (ha)|Colza (ha)|Colza (ha)'], ['arable', 'Silomais/Grünmais einschl. Lieschkolbenschrot', 'area', 'Maíz forrajero (ha)|Silage maize (ha)|Maïs fourrage (ha)|Mais da foraggio (ha)'], ['landuse', 'Kartoffeln', 'area', 'Patata (ha)|Potatoes (ha)|Pommes de terre (ha)|Patate (ha)'], ['landuse', 'Zuckerrüben ohne Saatguterzeugung', 'area', 'Remolacha azucarera (ha)|Sugar beet (ha)|Betterave sucrière (ha)|Barbabietola da zucchero (ha)'], ['permanent', 'Rebflächen', 'area', 'Viñedo (ha)|Vineyards (ha)|Vignes (ha)|Vigneti (ha)']],
          live: [['livestock', 'Rinder', 'head', 'Bovinos (cabezas)|Cattle (head)|Bovins (têtes)|Bovini (capi)'], ['livestock', 'Milchkühe', 'head', 'Vacas de leche (cabezas)|Dairy cows (head)|Vaches laitières (têtes)|Vacche da latte (capi)'], ['livestock', 'Schweine', 'head', 'Porcino (cabezas)|Pigs (head)|Porcins (têtes)|Suini (capi)'], ['livestock', 'Schafe', 'head', 'Ovino (cabezas)|Sheep (head)|Ovins (têtes)|Ovini (capi)'],
            ['livestock', 'Ziegen', 'head', 'Caprino (cabezas)|Goats (head)|Caprins (têtes)|Caprini (capi)'], ['livestock', 'Legehennen', 'head', 'Gallinas ponedoras (cabezas)|Laying hens (head)|Poules pondeuses (têtes)|Galline ovaiole (capi)'], ['livestock', 'Insgesamt', 'farms', 'Explotaciones con ganado|Farms with livestock|Exploitations avec élevage|Aziende con allevamento'], ['livestock', 'Rinder', 'farms', 'Explotaciones con bovino|Farms with cattle|Exploitations bovines|Aziende con bovini'], ['livestock', 'Milchkühe', 'farms', 'Explotaciones con vacas de leche|Farms with dairy cows|Exploitations laitières|Aziende con vacche da latte']] };
        var rows = deLzRows(d, S[kind]); if (!rows.length) return null;
        var head = [L('Indicador|Indicator|Indicateur|Indicatore')].concat([0, 2, 3, 4].map(function (i) { return String(Y[i]); }), [L('Cambio|Change|Var.|Var.')]);
        var T3 = { struct: ['Estructura agraria por Land|Farm structure by Land|Structure agricole par Land|Struttura agricola per Land', 'Recuento y superficie de explotaciones del Censo Agrario (Landwirtschaftszählung) y de las encuestas posteriores. Los valores que Destatis oculta quedan en blanco.|Farm and area counts from the Census of Agriculture (Landwirtschaftszählung) and the later surveys. Values Destatis suppresses are left blank.|Nombre d’exploitations et superficies du recensement agricole et des enquêtes suivantes. Les valeurs masquées par Destatis restent vides.|Numero di aziende e superfici dal censimento agricolo e dalle indagini successive. I valori oscurati da Destatis restano vuoti.'],
          crops: ['Cultivos por Land (superficie)|Crops by Land (area)|Cultures par Land (superficie)|Colture per Land (superficie)', 'Superficie por cultivo según el Censo Agrario y las encuestas de estructura; solo los cultivos que Destatis detalla por Land.|Area by crop from the Census of Agriculture and the structure surveys; only crops Destatis details by Land.|Superficie par culture selon le recensement agricole et les enquêtes de structure ; seules les cultures détaillées par Land.|Superficie per coltura dal censimento agricolo e dalle indagini di struttura; solo le colture dettagliate per Land.'],
          live: ['Ganadería por Land (1 de marzo)|Livestock by Land (1 March)|Élevage par Land (1er mars)|Allevamento per Land (1° marzo)', 'Cabezas y explotaciones con ganado a 1 de marzo según el Censo Agrario y las encuestas de estructura.|Head and holdings with livestock on 1 March from the Census of Agriculture and the structure surveys.|Têtes et exploitations avec élevage au 1er mars selon le recensement agricole et les enquêtes de structure.|Capi e aziende con allevamento al 1° marzo dal censimento agricolo e dalle indagini di struttura.'] };
        return card(L(T3[kind][0]), L(T3[kind][1]) + L(' Cambio: del primer al último dato publicado.| Change: first to last published value.| Var. : de la première à la dernière valeur publiée.| Var.: dal primo all\u2019ultimo dato pubblicato.'), table(head, rows, 560), cite('destatis', String(Y[Y.length - 1])));
      });
    }
    function deLzStruct(x) { return deLzCard(x, 'struct'); }
    function deLzCrops(x) { return deLzCard(x, 'crops'); }
    function deLzLive(x) { return deLzCard(x, 'live'); }
    /* ---- Alemania: censo agrario por distrito (Kreise), Regionaldatenbank ---- */
    function deKrLoad(x, fn) { return get('data/de-kreise/' + x.r + '.json').then(function (d) { return d && d.kreise ? fn(d) : null; }); }
    function deKrV(k, t, c, m, i) { var a = k.t[t] && k.t[t][c] && k.t[t][c][m]; return a && a[i] != null ? a[i] : null; }
    function deKrPct(v) { return v == null ? '—' : nf(v, 1) + ' %'; }
    function deKrList(rows, head, w) { return usCountyList(rows, head, w, 10, L('Todos los distritos|All districts|Tous les districts|Tutti i distretti')); }
    function deKrStruct(x) {
      return deKrLoad(x, function (d) {
        var ks = Object.keys(d.kreise).map(function (a) { var k = d.kreise[a], sau = deKrV(k, 'landuse', '-', 'FLC017', 2), sau0 = deKrV(k, 'landuse', '-', 'FLC017', 0), org = deKrV(k, 'organic', '-', 'FLC047', 2), ar = deKrV(k, 'landuse', 'Ackerland insgesamt', 'FLC004', 2);
          return { n: k.n, f: deKrV(k, 'landuse', '-', 'BTR010', 2), sau: sau, ch: sau && sau0 ? (sau / sau0 - 1) * 100 : null, ar: sau && ar != null ? ar / sau * 100 : null, org: sau && org != null ? org / sau * 100 : null }; }).filter(function (o) { return o.sau != null; });
        if (!ks.length) return null; ks.sort(function (a, b) { return b.sau - a.sau; });
        var pc = function (v) { return v == null ? '—' : (v >= 0 ? '+' : '−') + nf(Math.abs(v), 1) + '\u00a0%'; };
        var rows = ks.map(function (o) { return [esc(o.n), o.f != null ? nf(o.f, 0) : '—', nf(o.sau, 0), pc(o.ch), deKrPct(o.ar), deKrPct(o.org)]; });
        var head = [L('Distrito|District|District|Distretto'), L('Explotaciones|Farms|Exploitations|Aziende'), L('Superficie agraria (ha)|Farmland (ha)|SAU (ha)|SAU (ha)'), L('vs 2010|vs 2010|vs 2010|vs 2010'), L('Tierra de cultivo|Cropland share|Terres arables|Seminativi'), L('Ecológico|Organic|Bio|Biologico')];
        return card(L('Distritos: explotaciones y superficie (2020)|Districts: farms and farmland (2020)|Districts : exploitations et surface (2020)|Distretti: aziende e superficie (2020)'), L('Explotaciones y superficie agraria utilizada de cada distrito (Landkreis y ciudad independiente) en el Censo Agrario 2020. La tierra de cultivo y la superficie ecológica son porcentajes de la superficie agraria. Los datos que la estadística oculta quedan en blanco.|Farms and utilised farmland of each district (Landkreis and independent city) in the 2020 Census of Agriculture. Cropland and organic area are shares of farmland. Values the statistics suppress are left blank.|Exploitations et surface agricole utilisée de chaque district (Landkreis et ville indépendante) au recensement agricole 2020. Terres arables et surface bio en % de la SAU. Les valeurs masquées restent vides.|Aziende e superficie agricola utilizzata di ogni distretto (Landkreis e città indipendente) nel censimento agricolo 2020. Seminativi e biologico in % della SAU. I valori nascosti restano vuoti.'), deKrList(rows, head, 560), cite('destatis', '2020'));
      });
    }
    function deKrLive(x) {
      return deKrLoad(x, function (d) {
        var SP = ['Rinder', 'Milchkühe', 'Schweine', 'Schafe', 'Geflügel'];
        var ks = Object.keys(d.kreise).map(function (a) { var k = d.kreise[a], o = { n: k.n, v: SP.map(function (sp) { return deKrV(k, 'livestock', sp, 'TIE003', 2); }) }; o.gv = deKrV(k, 'livestock', '-', 'VIE003', 2); o.any = o.v.some(function (v) { return v != null; }); return o; }).filter(function (o) { return o.any; });
        if (!ks.length) return null; ks.sort(function (a, b) { return (b.gv != null ? b.gv : (b.v[0] || 0) / 1.2) - (a.gv != null ? a.gv : (a.v[0] || 0) / 1.2); });
        var rows = ks.map(function (o) { return [esc(o.n)].concat(o.v.map(function (v) { return v != null ? nf(v, 0) : '—'; })); });
        var head = [L('Distrito|District|District|Distretto'), L('Bovinos|Cattle|Bovins|Bovini'), L('Vacas de leche|Dairy cows|Vaches laitières|Vacche da latte'), L('Cerdos|Pigs|Porcins|Suini'), L('Ovejas|Sheep|Ovins|Ovini'), L('Aves|Poultry|Volailles|Pollame')];
        return card(L('Distritos: ganado (1 de marzo de 2020)|Districts: livestock (1 March 2020)|Districts : élevage (1er mars 2020)|Distretti: allevamento (1° marzo 2020)'), L('Cabezas por distrito, ordenadas por unidades de ganado mayor. Las cifras que la estadística oculta por confidencialidad quedan en blanco.|Head per district, sorted by livestock units. Figures the statistics suppress for confidentiality are left blank.|Têtes par district, classées par unités de gros bétail. Les chiffres masqués par confidentialité restent vides.|Capi per distretto, ordinati per unità di bestiame adulto. Le cifre nascoste per riservatezza restano vuote.'), deKrList(rows, head, 560), cite('destatis', '2020'));
      });
    }
    function deKrSize(x) {
      return deKrLoad(x, function (d) {
        var ks = Object.keys(d.kreise).map(function (a) { var k = d.kreise[a], sau = deKrV(k, 'landuse', '-', 'FLC017', 2), b1 = deKrV(k, 'size', '100 bis unter 200 ha', 'FLC017', 2), b2 = deKrV(k, 'size', '200 und mehr ha', 'FLC017', 2), tot = deKrV(k, 'succession', 'Insgesamt', 'BTR011', 2), no = deKrV(k, 'succession', 'mit keiner oder ungewisser Hofnachfolge', 'BTR011', 2);
          return { n: k.n, sau: sau, big: sau && b1 != null && b2 != null ? (b1 + b2) / sau * 100 : null, old: tot, no: tot && no != null ? no / tot * 100 : null }; }).filter(function (o) { return o.sau != null && (o.big != null || o.old != null); });
        if (!ks.length) return null; ks.sort(function (a, b) { return b.sau - a.sau; });
        var rows = ks.map(function (o) { return [esc(o.n), nf(o.sau, 0), deKrPct(o.big), o.old != null ? nf(o.old, 0) : '—', deKrPct(o.no)]; });
        var head = [L('Distrito|District|District|Distretto'), L('Superficie agraria (ha)|Farmland (ha)|SAU (ha)|SAU (ha)'), L('En explotaciones de 100 ha o más|On farms of 100 ha or more|Dans des exploitations de 100 ha ou plus|In aziende da 100 ha o più'), L('Titulares de 55 años o más|Owners aged 55+|Exploitants de 55 ans et plus|Titolari di 55 anni e più'), L('Sin relevo asegurado|No secured successor|Sans successeur assuré|Senza successione')];
        return card(L('Distritos: tamaño y relevo generacional (2020)|Districts: farm size and succession (2020)|Districts : taille et relève (2020)|Distretti: dimensione e ricambio (2020)'), L('Porcentaje de la superficie agraria en explotaciones de 100 ha o más, y explotaciones individuales con titular de 55 años o más (cifra) con el porcentaje que no tiene sucesor asegurado o lo tiene incierto.|Share of farmland on farms of 100 ha or more, and sole-proprietor farms whose owner is 55 or older (count) with the share that has no secured successor or an uncertain one.|Part de la SAU dans des exploitations de 100 ha ou plus, et exploitations individuelles dont le chef a 55 ans ou plus (nombre) avec la part sans successeur assuré ou incertain.|Quota della SAU in aziende da 100 ha o più, e aziende individuali con titolare di 55 anni o più (numero) con la quota senza successore sicuro o incerto.'), deKrList(rows, head, 560), cite('destatis', '2020'));
      });
    }
    /* ---- Alemania por distrito: rendimientos, bovinos, empleo agrario e historico 1999-2007 (Regionaldatenbank) ---- */
    function deKmLoad(x, fn) { return get('data/de-kreise-more/' + x.r + '.json').then(function (d) { return d && d.kreise ? fn(d) : null; }); }
    function deKmV(k, t, c, m, i) { var a = k.t[t] && k.t[t][c] && k.t[t][c][m]; return a && i >= 0 && a[i] != null ? a[i] : null; }
    function deKmPc(v) { return v == null ? '—' : (v >= 0 ? '+' : '−') + nf(Math.abs(v), 1) + ' %'; }
    function deKmCh(a, b) { return a != null && b != null && b > 0 ? (a / b - 1) * 100 : null; }
    function deKmYield(x) {
      return deKmLoad(x, function (d) {
        var ys = d.years.yields, n = ys.length, yr = ys[n - 1], CR = ['Winterweizen', 'Wintergerste', 'Winterraps', 'Silomais'];
        var ks = Object.keys(d.kreise).map(function (a) { var k = d.kreise[a]; return { n: k.n, v: CR.map(function (c) { return deKmV(k, 'yields', c, 'ERT001', n - 1); }) }; }).filter(function (o) { return o.v.some(function (v) { return v != null; }); });
        if (!ks.length) return null; ks.sort(function (a, b) { return (b.v[0] || 0) - (a.v[0] || 0); });
        var rows = ks.map(function (o) { return [esc(o.n)].concat(o.v.map(function (v) { return v != null ? nf(v, 1) : '—'; })); });
        var head = [L('Distrito|District|District|Distretto'), L('Trigo de invierno|Winter wheat|Blé d’hiver|Frumento invernale'), L('Cebada de invierno|Winter barley|Orge d’hiver|Orzo invernale'), L('Colza|Winter rapeseed|Colza|Colza'), L('Maíz forrajero|Silage maize|Maïs fourrager|Mais da insilato')];
        return card(L('Distritos: rendimiento por hectárea (' + yr + ')|Districts: yield per hectare (' + yr + ')|Districts : rendement à l’hectare (' + yr + ')|Distretti: resa per ettaro (' + yr + ')'), L('Quintales por hectárea (dt/ha) de los cultivos de campo en cada distrito, ordenados por el rendimiento del trigo. Los ficheros incluyen también avena, centeno, triticale, cebada de primavera, remolacha y patata, de 2010 a ' + yr + '. Los distritos sin cultivo o con el dato oculto quedan en blanco.|Quintals per hectare (dt/ha) of field crops in each district, sorted by wheat yield. The files also hold oats, rye, triticale, spring barley, sugar beet and potatoes, 2010 to ' + yr + '. Districts without the crop or with a suppressed value are left blank.|Quintaux par hectare (dt/ha) des grandes cultures dans chaque district, classés par rendement du blé. Les fichiers contiennent aussi avoine, seigle, triticale, orge de printemps, betterave et pomme de terre, de 2010 à ' + yr + '. Les districts sans la culture ou à valeur masquée restent vides.|Quintali per ettaro (dt/ha) delle colture di pieno campo in ogni distretto, ordinati per resa del frumento. I file contengono anche avena, segale, triticale, orzo primaverile, barbabietola e patata, dal 2010 al ' + yr + '. I distretti senza la coltura o con dato nascosto restano vuoti.'), deKrList(rows, head, 440), cite('destatis', String(yr)));
      });
    }
    function deKmCattle(x) {
      return deKmLoad(x, function (d) {
        var ys = d.years.cattle, n = ys.length, yr = ys[n - 1], i0 = ys.indexOf(2019);
        var ks = Object.keys(d.kreise).map(function (a) { var k = d.kreise[a], g = function (c, i) { return deKmV(k, 'cattle', c, 'TIE003', i); };
          var cf = g('Weibliche Kälber bis einschl. 8 Monate', n - 1), cm = g('Männliche Kälber bis einschl. 8 Monate', n - 1);
          return { n: k.n, t: g('Rinder insgesamt', n - 1), m: g('Milchkühe', n - 1), o: g('sonstige Kühe', n - 1), c: cf != null || cm != null ? (cf || 0) + (cm || 0) : null, ch: deKmCh(g('Rinder insgesamt', n - 1), g('Rinder insgesamt', i0)) }; }).filter(function (o) { return o.t != null; });
        if (!ks.length) return null; ks.sort(function (a, b) { return b.t - a.t; });
        var f = function (v) { return v != null ? nf(v, 0) : '—'; };
        var rows = ks.map(function (o) { return [esc(o.n), f(o.t), f(o.m), f(o.c), deKmPc(o.ch)]; });
        var head = [L('Distrito|District|District|Distretto'), L('Bovinos|Cattle|Bovins|Bovini'), L('Vacas de leche|Dairy cows|Vaches laitières|Vacche da latte'), L('Terneros (≤ 8 meses)|Calves (≤ 8 months)|Veaux (≤ 8 mois)|Vitelli (≤ 8 mesi)'), L('vs 2019|vs 2019|vs 2019|vs 2019')];
        return card(L('Distritos: bovinos (3 de noviembre de ' + yr + ')|Districts: cattle (3 November ' + yr + ')|Districts : bovins (3 novembre ' + yr + ')|Distretti: bovini (3 novembre ' + yr + ')'), L('Censo de bovinos de cada noviembre desde 2010, con vacas de leche y 11 categorías por distrito en el fichero; aquí las principales. Los terneros suman hembras y machos de hasta 8 meses. Cifras ocultas por confidencialidad, en blanco.|November cattle census each year since 2010, with dairy cows and 11 categories per district in the file; the main ones are shown. Calves add females and males up to 8 months. Figures suppressed for confidentiality are left blank.|Recensement des bovins chaque novembre depuis 2010, avec vaches laitières et 11 catégories par district dans le fichier ; les principales sont affichées. Les veaux additionnent femelles et mâles jusqu’à 8 mois. Chiffres masqués par confidentialité, en blanc.|Censimento dei bovini ogni novembre dal 2010, con vacche da latte e 11 categorie per distretto nel file; qui le principali. I vitelli sommano femmine e maschi fino a 8 mesi. Cifre nascoste per riservatezza, vuote.'), deKrList(rows, head, 440), cite('destatis', String(yr)));
      });
    }
    function deKmJobs(x) {
      return deKmLoad(x, function (d) {
        var ys = d.years.jobs, n = ys.length, yr = ys[n - 1], i10 = ys.indexOf(2010), A = 'Land- und Forstwirtschaft, Fischerei (A)';
        var ks = Object.keys(d.kreise).map(function (a) { var k = d.kreise[a], v = deKmV(k, 'jobs', A, 'ERW063', n - 1), t = deKmV(k, 'jobs', 'Insgesamt', 'ERW063', n - 1);
          return { n: k.n, v: v, sh: v != null && t ? v / t * 100 : null, ch: deKmCh(v, deKmV(k, 'jobs', A, 'ERW063', i10)), t: t }; }).filter(function (o) { return o.v != null; });
        if (!ks.length) return null; ks.sort(function (a, b) { return b.v - a.v; });
        var rows = ks.map(function (o) { return [esc(o.n), nf(o.v, 1), o.t != null ? nf(o.t, 1) : '—', deKrPct(o.sh), deKmPc(o.ch)]; });
        var head = [L('Distrito|District|District|Distretto'), L('Agricultura, silvicultura y pesca (miles)|Agriculture, forestry, fishing (thousands)|Agriculture, sylviculture, pêche (milliers)|Agricoltura, silvicoltura, pesca (migliaia)'), L('Total ocupados (miles)|All employed (thousands)|Total actifs (milliers)|Totale occupati (migliaia)'), L('Peso en el empleo|Share of jobs|Part de l’emploi|Quota sull’occupazione'), L('vs 2010|vs 2010|vs 2010|vs 2010')];
        return card(L('Distritos: empleo agrario (' + yr + ')|Districts: agricultural employment (' + yr + ')|Districts : emploi agricole (' + yr + ')|Distretti: occupazione agricola (' + yr + ')'), L('Ocupados de la sección A (agricultura, silvicultura y pesca) en el lugar de trabajo, promedio anual, de cada distrito; la fuente los da en miles con un decimal. Serie 2000-' + yr + ' en el fichero.|Persons employed in section A (agriculture, forestry and fishing) by place of work, annual average, per district; the source gives thousands with one decimal. Series 2000-' + yr + ' in the file.|Personnes occupées de la section A (agriculture, sylviculture et pêche) au lieu de travail, moyenne annuelle, par district ; la source donne des milliers avec une décimale. Série 2000-' + yr + ' dans le fichier.|Occupati della sezione A (agricoltura, silvicoltura e pesca) sul luogo di lavoro, media annua, per distretto; la fonte dà migliaia con un decimale. Serie 2000-' + yr + ' nel file.'), deKrList(rows, head, 440), cite('destatis', String(yr)));
      });
    }
    function deKmHist(x) {
      return deKmLoad(x, function (d) {
        var yf = d.years.histf, yl = d.years.histl, nf_ = yf.length, nl = yl.length, y0 = yf[0], y1 = yf[nf_ - 1];
        var ks = Object.keys(d.kreise).map(function (a) { var k = d.kreise[a], g = function (c, m, i) { return deKmV(k, 'histf', c, m, i); };
          var f1 = g('Insgesamt', 'BETR09', nf_ - 1), f0 = g('Insgesamt', 'BETR09', 0), s1 = g('Insgesamt', 'FLC017', nf_ - 1), s0 = g('Insgesamt', 'FLC017', 0), l1 = deKmV(k, 'histl', '-', 'BETR08', nl - 1), l0 = deKmV(k, 'histl', '-', 'BETR08', 0);
          return { n: k.n, f0: f0, f1: f1, s1: s1, cf: deKmCh(f1, f0), cs: deKmCh(s1, s0), cl: deKmCh(l1, l0) }; }).filter(function (o) { return o.f0 != null && o.f1 != null; });
        if (!ks.length) return null; ks.sort(function (a, b) { return b.f1 - a.f1; });
        var rows = ks.map(function (o) { return [esc(o.n), nf(o.f0, 0), nf(o.f1, 0), deKmPc(o.cf), deKmPc(o.cl)]; });
        var head = [L('Distrito|District|District|Distretto'), L('Explotaciones ' + y0 + '|Farms ' + y0 + '|Exploitations ' + y0 + '|Aziende ' + y0), L('Explotaciones ' + y1 + '|Farms ' + y1 + '|Exploitations ' + y1 + '|Aziende ' + y1), L('Cambio|Change|Variation|Variazione'), L('Con ganado, cambio|With livestock, change|Avec élevage, variation|Con bestiame, variazione')];
        return card(L('Distritos: explotaciones ' + y0 + '-' + y1 + '|Districts: farms ' + y0 + '-' + y1 + '|Districts : exploitations ' + y0 + '-' + y1 + '|Distretti: aziende ' + y0 + '-' + y1), L('Profundidad histórica de las encuestas agrarias de 1999 a 2007 (años impares). Los distritos cambiaron de límites en reformas posteriores: se muestran con la división vigente en la fuente.|Historical depth from the 1999-2007 agricultural surveys (odd years). District boundaries changed in later reforms: figures are shown on the source’s own division.|Profondeur historique des enquêtes agricoles 1999-2007 (années impaires). Les limites des districts ont changé lors de réformes ultérieures : les chiffres suivent le découpage de la source.|Profondità storica delle indagini agricole 1999-2007 (anni dispari). I confini dei distretti sono cambiati in riforme successive: le cifre seguono la suddivisione della fonte.'), deKrList(rows, head, 440), cite('destatis', y0 + '-' + y1));
      });
    }
    /* ---- Polonia por distrito (powiat): Censo Agrario 2020 de GUS (BDL) ---- */
    function plPwLoad(x, fn) { return get('data/pl-powiaty/' + x.r + '.json').then(function (d) { return d && d.powiaty ? fn(d) : null; }); }
    function plPwV(p, id) { var v = p.v[id]; return v != null ? v : null; }
    function plPwF(v, dec) { return v != null ? nf(v, dec || 0) : '—'; }
    function plPwCard(x, o) {
      return plPwLoad(x, function (d) {
        var ks = Object.keys(d.powiaty).map(function (a) { return o.row(d.powiaty[a]); }).filter(function (r) { return r && r.s != null; });
        if (!ks.length) return null; ks.sort(function (a, b) { return b.s - a.s; });
        return card(L(o.title), L(o.intro), deKrList(ks.map(function (r) { return [esc(r.n)].concat(r.c); }), [L('Distrito|District|District|Distretto')].concat(o.head.map(function (h) { return L(h); })), 440), cite('gus_poland', '2020'));
      });
    }
    function plPwStruct(x) {
      return plPwCard(x, { title: 'Distritos (powiat): explotaciones y superficie (2020)|Districts (powiat): farms and farmland (2020)|Districts (powiat) : exploitations et surface (2020)|Distretti (powiat): aziende e superficie (2020)',
        intro: 'Censo Agrario 2020 de GUS: explotaciones agrarias y superficie agraria de cada powiat y ciudad con derechos de powiat. El tamaño medio es la superficie agraria entre las explotaciones (cálculo de Dehesa Index).|GUS Agricultural Census 2020: agricultural holdings and agricultural land of each powiat and city with powiat rights. Average size is farmland divided by holdings (Dehesa Index calculation).|Recensement agricole 2020 du GUS : exploitations et surface agricole de chaque powiat et ville à statut de powiat. La taille moyenne est la surface agricole divisée par les exploitations (calcul de Dehesa Index).|Censimento agricolo 2020 del GUS: aziende e superficie agricola di ogni powiat e città con diritti di powiat. La dimensione media è la superficie agricola divisa per le aziende (calcolo di Dehesa Index).',
        head: ['Explotaciones|Farms|Exploitations|Aziende', 'Superficie agraria (ha)|Farmland (ha)|SAU (ha)|SAU (ha)', 'Tamaño medio (ha)|Average size (ha)|Taille moyenne (ha)|Dimensione media (ha)', 'De 15 ha o más|15 ha or more|15 ha ou plus|15 ha o più'],
        row: function (p) { var f = plPwV(p, '1633320'), s = plPwV(p, '1633345'), big = plPwV(p, '1633325');
          return { n: p.n, s: s, c: [plPwF(f), plPwF(s), f && s != null ? nf(s / f, 1) : '—', f && big != null ? nf(big / f * 100, 1) + ' %' : '—'] }; } });
    }
    function plPwLive(x) {
      return plPwCard(x, { title: 'Distritos (powiat): ganado (2020)|Districts (powiat): livestock (2020)|Districts (powiat) : élevage (2020)|Distretti (powiat): allevamento (2020)',
        intro: 'Cabezas de ganado de las explotaciones agrarias de cada powiat en el Censo Agrario 2020 de GUS, ordenadas por bovinos.|Head of livestock on the agricultural holdings of each powiat in the GUS Agricultural Census 2020, sorted by cattle.|Têtes de bétail des exploitations agricoles de chaque powiat au recensement agricole 2020 du GUS, classées par bovins.|Capi di bestiame delle aziende agricole di ogni powiat nel censimento agricolo 2020 del GUS, ordinati per bovini.',
        head: ['Bovinos|Cattle|Bovins|Bovini', 'Vacas|Cows|Vaches|Vacche', 'Cerdos|Pigs|Porcins|Suini', 'Aves|Poultry|Volailles|Pollame'],
        row: function (p) { var c = plPwV(p, '1645195'); return { n: p.n, s: c != null ? c : (plPwV(p, '1645197') || 0) / 1e6, c: [plPwF(c), plPwF(plPwV(p, '1645196')), plPwF(plPwV(p, '1645197')), plPwF(plPwV(p, '1645199'))] }; } });
    }
    function plPwCrops(x) {
      return plPwCard(x, { title: 'Distritos (powiat): superficie sembrada (2020)|Districts (powiat): sown area (2020)|Districts (powiat) : surface semée (2020)|Distretti (powiat): superficie seminata (2020)',
        intro: 'Superficie sembrada de las explotaciones agrarias de cada powiat en el Censo Agrario 2020 de GUS, con los cultivos principales. GUS no publica rendimientos por powiat, solo por voivodía.|Sown area of the agricultural holdings of each powiat in the GUS Agricultural Census 2020, with the main crops. GUS does not publish yields by powiat, only by voivodeship.|Surface semée des exploitations agricoles de chaque powiat au recensement agricole 2020 du GUS, avec les cultures principales. Le GUS ne publie pas de rendements par powiat, seulement par voïvodie.|Superficie seminata delle aziende agricole di ogni powiat nel censimento agricolo 2020 del GUS, con le colture principali. Il GUS non pubblica rese per powiat, solo per voivodato.',
        head: ['Sembrada (ha)|Sown (ha)|Semée (ha)|Seminata (ha)', 'Cereales (ha)|Cereals (ha)|Céréales (ha)|Cereali (ha)', 'Colza (ha)|Rapeseed (ha)|Colza (ha)|Colza (ha)', 'Patata (ha)|Potatoes (ha)|Pommes de terre (ha)|Patate (ha)', 'Remolacha (ha)|Sugar beet (ha)|Betterave (ha)|Barbabietola (ha)'],
        row: function (p) { var s = plPwV(p, '1633601'); return { n: p.n, s: s, c: [plPwF(s), plPwF(plPwV(p, '1633602')), plPwF(plPwV(p, '1633606')), plPwF(plPwV(p, '1633604')), plPwF(plPwV(p, '1633605'))] }; } });
    }
    function plPwLabour(x) {
      return plPwCard(x, { title: 'Distritos (powiat): mano de obra agraria (2020)|Districts (powiat): farm labour (2020)|Districts (powiat) : main-d’œuvre agricole (2020)|Distretti (powiat): manodopera agricola (2020)',
        intro: 'Trabajo en las explotaciones agrarias de cada powiat en el Censo Agrario 2020 de GUS, en unidades de trabajo anual (AWU): total, mano de obra familiar y asalariados fijos de las explotaciones individuales, y AWU por cada 100 ha de superficie agraria (cálculo de Dehesa Index).|Labour on the agricultural holdings of each powiat in the GUS Agricultural Census 2020, in annual work units (AWU): total, family labour and permanent hired workers on private farms, and AWU per 100 ha of farmland (Dehesa Index calculation).|Travail dans les exploitations agricoles de chaque powiat au recensement agricole 2020 du GUS, en unités de travail annuel (UTA) : total, main-d’œuvre familiale et salariés permanents des exploitations individuelles, et UTA pour 100 ha de surface agricole (calcul de Dehesa Index).|Lavoro nelle aziende agricole di ogni powiat nel censimento agricolo 2020 del GUS, in unità di lavoro annuo (ULA): totale, manodopera familiare e salariati fissi delle aziende individuali, e ULA ogni 100 ha di superficie agricola (calcolo di Dehesa Index).',
        head: ['Total (AWU)|Total (AWU)|Total (UTA)|Totale (ULA)', 'Familiar (AWU)|Family (AWU)|Familiale (UTA)|Familiare (ULA)', 'Asalariados fijos (AWU)|Hired, permanent (AWU)|Salariés permanents (UTA)|Salariati fissi (ULA)', 'AWU por 100 ha|AWU per 100 ha|UTA pour 100 ha|ULA ogni 100 ha'],
        row: function (p) { var t = plPwV(p, '1623469'), s = plPwV(p, '1633345'); return { n: p.n, s: t, c: [plPwF(t), plPwF(plPwV(p, '1623475')), plPwF(plPwV(p, '1623478')), t != null && s ? nf(t / s * 100, 1) : '—'] }; } });
    }
    /* ---- Polonia por municipio (gmina): Censo Agrario 2020 de GUS (BDL) ---- */
    function plGmType(id) { var t = id.charAt(11); return t === '1' ? L('ciudad|city|ville|città') : t === '2' ? L('rural|rural|rurale|rurale') : L('mixta|mixed|mixte|mista'); }
    function plGmCard(x, o) {
      return get('data/pl-gminy/' + x.r + '.json').then(function (d) {
        if (!d || !d.gminy) return null;
        var ks = Object.keys(d.gminy).map(function (id) { var g = d.gminy[id], r = o.row(g); if (r) r.n = g.n + ' (' + plGmType(id) + ')' + (g.p.indexOf(g.n) >= 0 ? '' : ', ' + g.p); return r; }).filter(function (r) { return r && r.s != null; });
        if (!ks.length) return null; ks.sort(function (a, b) { return b.s - a.s; });
        return card(L(o.title), L(o.intro), usCountyList(ks.map(function (r) { return [esc(r.n)].concat(r.c); }), [L('Municipio (gmina)|Municipality (gmina)|Commune (gmina)|Comune (gmina)')].concat(o.head.map(function (h) { return L(h); })), 440, 10, L('Todos los municipios|All municipalities|Toutes les communes|Tutti i comuni')), cite('gus_poland', '2020'));
      });
    }
    var PLGM_NOTE = 'Los municipios con pocas explotaciones tienen cifras ocultas por secreto estadístico y salen en blanco.|Municipalities with few holdings have figures suppressed for statistical confidentiality and are left blank.|Les communes comptant peu d’exploitations ont des chiffres masqués par secret statistique et restent vides.|I comuni con poche aziende hanno cifre nascoste per segreto statistico e restano vuoti.';
    function plGmNote(a) { var p = a.split('|'), q = PLGM_NOTE.split('|'); return p.map(function (t, i) { return t + ' ' + q[i]; }).join('|'); }
    function plGmStruct(x) {
      return plGmCard(x, { title: 'Municipios (gmina): explotaciones y superficie (2020)|Municipalities (gmina): farms and farmland (2020)|Communes (gmina) : exploitations et surface (2020)|Comuni (gmina): aziende e superficie (2020)',
        intro: plGmNote('Censo Agrario 2020 de GUS por municipio. Ordenado por superficie agraria; el tamaño medio es la superficie agraria entre las explotaciones (cálculo de Dehesa Index).|GUS Agricultural Census 2020 by municipality. Sorted by farmland; average size is farmland divided by holdings (Dehesa Index calculation).|Recensement agricole 2020 du GUS par commune. Classées par surface agricole ; la taille moyenne est la surface agricole divisée par les exploitations (calcul de Dehesa Index).|Censimento agricolo 2020 del GUS per comune. Ordinati per superficie agricola; la dimensione media è la superficie agricola divisa per le aziende (calcolo di Dehesa Index).'),
        head: ['Explotaciones|Farms|Exploitations|Aziende', 'Superficie agraria (ha)|Farmland (ha)|SAU (ha)|SAU (ha)', 'Tamaño medio (ha)|Average size (ha)|Taille moyenne (ha)|Dimensione media (ha)', 'De 15 ha o más|15 ha or more|15 ha ou plus|15 ha o più'],
        row: function (g) { var f = plPwV(g, '1633195'), s = plPwV(g, '1645080'), big = plPwV(g, '1633200');
          return { s: s, c: [plPwF(f), plPwF(s), f && s != null ? nf(s / f, 1) : '—', f && big != null ? nf(big / f * 100, 1) + ' %' : '—'] }; } });
    }
    function plGmLive(x) {
      return plGmCard(x, { title: 'Municipios (gmina): ganado (2020)|Municipalities (gmina): livestock (2020)|Communes (gmina) : élevage (2020)|Comuni (gmina): allevamento (2020)',
        intro: plGmNote('Cabezas de ganado de las explotaciones de cada municipio en el Censo Agrario 2020 de GUS, ordenadas por bovinos.|Head of livestock on the holdings of each municipality in the GUS Agricultural Census 2020, sorted by cattle.|Têtes de bétail des exploitations de chaque commune au recensement agricole 2020 du GUS, classées par bovins.|Capi di bestiame delle aziende di ogni comune nel censimento agricolo 2020 del GUS, ordinati per bovini.'),
        head: ['Bovinos|Cattle|Bovins|Bovini', 'Vacas|Cows|Vaches|Vacche', 'Cerdos|Pigs|Porcins|Suini', 'Aves|Poultry|Volailles|Pollame'],
        row: function (g) { var c = plPwV(g, '1645219'); return { s: c, c: [plPwF(c), plPwF(plPwV(g, '1645220')), plPwF(plPwV(g, '1645221')), plPwF(plPwV(g, '1645223'))] }; } });
    }
    function plGmCrops(x) {
      return plGmCard(x, { title: 'Municipios (gmina): superficie sembrada (2020)|Municipalities (gmina): sown area (2020)|Communes (gmina) : surface semée (2020)|Comuni (gmina): superficie seminata (2020)',
        intro: plGmNote('Superficie sembrada de cada municipio en el Censo Agrario 2020 de GUS, con los cultivos principales. GUS no publica rendimientos por municipio.|Sown area of each municipality in the GUS Agricultural Census 2020, with the main crops. GUS does not publish yields by municipality.|Surface semée de chaque commune au recensement agricole 2020 du GUS, avec les cultures principales. Le GUS ne publie pas de rendements par commune.|Superficie seminata di ogni comune nel censimento agricolo 2020 del GUS, con le colture principali. Il GUS non pubblica rese per comune.'),
        head: ['Sembrada (ha)|Sown (ha)|Semée (ha)|Seminata (ha)', 'Cereales (ha)|Cereals (ha)|Céréales (ha)|Cereali (ha)', 'Colza (ha)|Rapeseed (ha)|Colza (ha)|Colza (ha)', 'Patata (ha)|Potatoes (ha)|Pommes de terre (ha)|Patate (ha)', 'Remolacha (ha)|Sugar beet (ha)|Betterave (ha)|Barbabietola (ha)'],
        row: function (g) { var s = plPwV(g, '1645123'); return { s: s, c: [plPwF(s), plPwF(plPwV(g, '1645124')), plPwF(plPwV(g, '1645139')), plPwF(plPwV(g, '1645137')), plPwF(plPwV(g, '1645138'))] }; } });
    }
    function plGmLabour(x) {
      return plGmCard(x, { title: 'Municipios (gmina): mano de obra y venta (2020)|Municipalities (gmina): farm labour and sales (2020)|Communes (gmina) : main-d’œuvre et vente (2020)|Comuni (gmina): manodopera e vendita (2020)',
        intro: plGmNote('Unidades de trabajo anual (AWU) de las explotaciones de cada municipio, AWU por cada 100 ha de superficie agraria (cálculo de Dehesa Index) y porcentaje de explotaciones que venden parte de su producción.|Annual work units (AWU) on the holdings of each municipality, AWU per 100 ha of farmland (Dehesa Index calculation) and the share of holdings selling part of their output.|Unités de travail annuel (UTA) des exploitations de chaque commune, UTA pour 100 ha de surface agricole (calcul de Dehesa Index) et part des exploitations vendant une partie de leur production.|Unità di lavoro annuo (ULA) delle aziende di ogni comune, ULA ogni 100 ha di superficie agricola (calcolo di Dehesa Index) e quota di aziende che vendono parte della produzione.'),
        head: ['Total (AWU)|Total (AWU)|Total (UTA)|Totale (ULA)', 'AWU por 100 ha|AWU per 100 ha|UTA pour 100 ha|ULA ogni 100 ha', 'Explotaciones que venden|Holdings selling|Exploitations vendant|Aziende che vendono'],
        row: function (g) { var t = plPwV(g, '1623463'), s = plPwV(g, '1645080'), f = plPwV(g, '1633195'), sell = plPwV(g, '1633419');
          return { s: t, c: [plPwF(t), t != null && s ? nf(t / s * 100, 1) : '—', f && sell != null ? nf(sell / f * 100, 1) + ' %' : '—'] }; } });
    }
    /* ---- Australia: cultivos por zona estadistica SA2 (ABS) ---- */
    var AU_B = [['Wheat', 'Trigo|Wheat|Blé|Grano'], ['Barley', 'Cebada|Barley|Orge|Orzo'], ['Canola', 'Colza (canola)|Canola|Canola|Colza (canola)'], ['Oats', 'Avena|Oats|Avoine|Avena'], ['Sorghum', 'Sorgo|Sorghum|Sorgho|Sorgo'], ['Cotton', 'Algodón|Cotton|Coton|Cotone'], ['Rice', 'Arroz|Rice|Riz|Riso'], ['Sugarcane', 'Caña de azúcar|Sugarcane|Canne à sucre|Canna da zucchero'], ['Maize', 'Maíz|Maize|Maïs|Mais'], ['Chickpeas', 'Garbanzo|Chickpeas|Pois chiches|Ceci'], ['Lupins', 'Altramuz|Lupins|Lupins|Lupini'], ['Fieldpeas', 'Guisante|Field peas|Pois protéagineux|Pisello proteico'], ['Lentils', 'Lenteja|Lentils|Lentilles|Lenticchie'], ['Fababeans', 'Haba|Faba beans|Féveroles|Fava']];
    var AU_H = [['Winegrape', 'Uva de vino (t)|Winegrapes (t)|Raisin de cuve (t)|Uva da vino (t)', 'HortWinegrape_Crush'], ['Avocados', 'Aguacate (t)|Avocados (t)|Avocats (t)|Avocado (t)', 'HortAvocados_Prod'], ['Bananas', 'Plátano (t)|Bananas (t)|Bananes (t)|Banane (t)', 'HortBananas_Prod'], ['Macadamias', 'Macadamia (t)|Macadamias (t)|Noix de macadamia (t)|Macadamia (t)', 'HortMacadamias_Prod_Inshell']];
    function auSa2Card(x, kind) {
      return get('data/au-sa2/' + x.r + '.json').then(function (d) {
        if (!d || !d.areas) return null; var Y = d.years, rows = [], yl = null;
        var yrs = function (i) { return Y[i] + '–' + String(Y[i] + 1).slice(2); };
        var specs = kind === 'crops' ? AU_B.map(function (b) { return [L(b[1]), 'Broad' + b[0] + '_Area_Total', 'ha']; }) : AU_H.map(function (h) { return [L(h[1]), h[2], 't']; });
        specs.forEach(function (sp) {
          var li = -1, list = [];
          for (var i = Y.length - 1; i >= 0 && li < 0; i--) { list = []; Object.keys(d.areas).forEach(function (g) { var v = d.areas[g].v[sp[1]]; if (v && v[i] != null && v[i] > 0) list.push({ n: d.areas[g].n, v: v[i] }); }); if (list.length) li = i; }
          if (li < 0) return; list.sort(function (a, b) { return b.v - a.v; }); var tot = list.reduce(function (a, b) { return a + b.v; }, 0); if (yl == null || li > yl) yl = li;
          rows.push({ t: tot, r: [esc(sp[0]), esc(yrs(li)), nf(tot, 0), list.slice(0, 2).map(function (o) { return esc(o.n) + ' ' + faint(nf(o.v, 0)); }).join('<br>')] });
        });
        if (!rows.length) return null; rows.sort(function (a, b) { return b.t - a.t; });
        var head = [kind === 'crops' ? L('Cultivo (ha)|Crop (ha)|Culture (ha)|Coltura (ha)') : L('Producto|Product|Produit|Prodotto'), L('Año fiscal|Financial year|Exercice|Anno fiscale'), L('Total publicado|Published total|Total publié|Totale pubblicato'), L('Zonas principales|Top areas|Principales zones|Zone principali')];
        var T = kind === 'crops' ? [L('Cultivos de secano por zona (SA2)|Broadacre crops by area (SA2)|Grandes cultures par zone (SA2)|Seminativi per zona (SA2)'), L('Superficie total de cultivo por zona estadística SA2 (ABS). Las zonas con datos confidenciales no se publican, así que el total puede quedar por debajo del estatal.|Total crop area by statistical area SA2 (ABS). Areas with confidential data are not published, so the total can fall short of the state figure.|Superficie cultivée par zone statistique SA2 (ABS). Les zones aux données confidentielles ne sont pas publiées : le total peut être inférieur à celui de l’État.|Superficie coltivata per area statistica SA2 (ABS). Le aree con dati riservati non sono pubblicate, quindi il totale può restare sotto quello statale.')] : [L('Horticultura por zona (SA2)|Horticulture by area (SA2)|Horticulture par zone (SA2)|Orticoltura per zona (SA2)'), L('Producción de uva de vino, aguacate, plátano y macadamia por zona estadística SA2 (ABS), en toneladas.|Winegrape, avocado, banana and macadamia output by statistical area SA2 (ABS), in tonnes.|Production de raisin de cuve, avocat, banane et macadamia par zone SA2 (ABS), en tonnes.|Produzione di uva da vino, avocado, banane e macadamia per area SA2 (ABS), in tonnellate.')];
        return card(T[0], T[1], table(head, rows.map(function (o) { return o.r; }), 520), cite('abs', yrs(yl)));
      });
    }
    function auSa2Crops(x) { return auSa2Card(x, 'crops'); }
    function auSa2Hort(x) { return auSa2Card(x, 'hort'); }
    /* ---- Australia: sacrificio (ABS), municipios (LGA) y regiones SA4 ---- */
    function auLivestock(x) {
      return get('data/au-livestock/' + x.r + '.json').then(function (d) {
        if (!d || !d.periods) return null; var P = d.periods, rows = [];
        var SP = [['slaughter', 'cattle', 'Bovinos sacrificados (miles)|Cattle slaughtered (k)|Bovins abattus (milliers)|Bovini macellati (migliaia)'], ['slaughter', 'sheep', 'Ovejas sacrificadas (miles)|Sheep slaughtered (k)|Ovins abattus (milliers)|Ovini macellati (migliaia)'], ['slaughter', 'lambs', 'Corderos sacrificados (miles)|Lambs slaughtered (k)|Agneaux abattus (milliers)|Agnelli macellati (migliaia)'],
          ['slaughter', 'pigs', 'Cerdos sacrificados (miles)|Pigs slaughtered (k)|Porcs abattus (milliers)|Suini macellati (migliaia)'], ['slaughter', 'chickens', 'Pollos sacrificados (miles)|Chickens slaughtered (k)|Poulets abattus (milliers)|Polli macellati (migliaia)'],
          ['meat', 'beef', 'Carne de vacuno (t)|Beef (t)|Viande bovine (t)|Carne bovina (t)'], ['meat', 'lamb', 'Carne de cordero (t)|Lamb meat (t)|Viande d’agneau (t)|Carne di agnello (t)'], ['meat', 'mutton', 'Carne de oveja (t)|Mutton (t)|Viande de mouton (t)|Carne di montone (t)'], ['meat', 'pork', 'Carne de cerdo (t)|Pork (t)|Viande de porc (t)|Carne suina (t)'], ['meat', 'chicken', 'Carne de pollo (t)|Chicken meat (t)|Viande de poulet (t)|Carne di pollo (t)']];
        SP.forEach(function (sp) {
          var a = d[sp[0]] && d[sp[0]][sp[1]]; if (!a) return; var n = a.length - 1; while (n >= 0 && a[n] == null) n--; if (n < 4) return;
          var ya = a[n - 4], l4 = a.slice(n - 3, n + 1), p4 = a.slice(n - 7, n - 3), sm = function (z) { return z.some(function (v) { return v == null; }) ? null : z.reduce(function (p, q) { return p + q; }, 0); };
          var t4 = sm(l4), q4 = sm(p4), c1 = ya ? (a[n] / ya - 1) * 100 : null, c4 = t4 != null && q4 ? (t4 / q4 - 1) * 100 : null, pc = function (c) { return c == null ? '—' : (Math.round(Math.abs(c)) === 0 ? '0' : (c > 0 ? '+' : '−') + nf(Math.abs(c), 0)) + ' %'; };
          rows.push([esc(L(sp[2])), nf(a[n], a[n] < 100 ? 1 : 0), pc(c1), t4 != null ? nf(t4, t4 < 100 ? 1 : 0) : '—', pc(c4)]);
        });
        if (!rows.length) return null;
        var head = [L('Indicador|Indicator|Indicateur|Indicatore'), L('Último trim.|Latest qtr|Dernier trim.|Ultimo trim.'), L('vs hace 1 año|vs 1 yr ago|vs 1 an|vs 1 anno'), L('Últimos 4 trim.|Last 4 qtrs|4 derniers trim.|Ultimi 4 trim.'), L('vs 4 previos|vs prev. 4|vs 4 préc.|vs 4 prec.')];
        return card(L('Sacrificio y carne por estado|Slaughter and meat by state|Abattages et viande par État|Macellazione e carne per stato'), L('Sacrificio de ganado y carne producida por trimestre (ABS), serie original sin ajuste estacional.|Livestock slaughtered and meat produced by quarter (ABS), original series without seasonal adjustment.|Abattages et production de viande par trimestre (ABS), série brute.|Macellazioni e carne prodotta per trimestre (ABS), serie originale.'), table(head, rows, 520), cite('abs', d.periods[d.periods.length - 1]));
      });
    }
    function auLga(x) {
      return get('data/au-regional/' + x.r + '.json').then(function (d) {
        if (!d || !d.lga) return null; var Y = '2021', g = function (a, m) { var v = a.v[m]; return v && v[Y] != null ? v[Y] : null; };
        var list = Object.keys(d.lga).map(function (c) { var a = d.lga[c]; return { n: a.n, val: g(a, 'AGRIC_15'), ha: g(a, 'AGRIC_20'), cat: g(a, 'AGRIC_11'), shp: g(a, 'AGRIC_12'), irr: g(a, 'WATER_3') }; }).filter(function (o) { return o.val != null && o.val > 0; });
        if (!list.length) return null; list.sort(function (a, b) { return b.val - a.val; });
        var f = function (v, k) { return v == null ? '—' : nf(v, k || 0); };
        var rows = list.map(function (o) { return [esc(o.n), f(o.val, 0), f(o.ha), f(o.cat), f(o.shp)]; });
        var head = [L('Municipio|Local government area|Zone de gouvernement local|Comune'), L('Valor bruto (M A$)|Gross value (A$ m)|Valeur brute (M A$)|Valore lordo (M A$)'), L('Cultivos de secano (ha)|Broadacre crops (ha)|Grandes cultures (ha)|Seminativi (ha)'), L('Vacuno de carne|Meat cattle|Bovins viande|Bovini da carne'), L('Ovino|Sheep and lambs|Ovins|Ovini')];
        return card(L('Agricultura por municipio (2020-21)|Agriculture by local government area (2020-21)|Agriculture par zone de gouvernement local (2020-21)|Agricoltura per comune (2020-21)'), L('Valor bruto de la producción agraria, superficie, ganado y regadío por municipio (LGA, año a 30 de junio de 2021). Lo que el ABS no publica queda en blanco.|Gross value of agricultural production, area, livestock and irrigation by local government area (year ended 30 June 2021). Values the ABS does not publish are left blank.|Valeur brute de la production agricole, superficie, élevage et irrigation par zone (année au 30 juin 2021). Les valeurs non publiées restent vides.|Valore lordo della produzione agricola, superficie, allevamento e irrigazione per comune (anno al 30 giugno 2021). I valori non pubblicati restano vuoti.'), usCountyList(rows, head, 520, 10, L('Todos los municipios|All areas|Toutes les zones|Tutti i comuni')), cite('abs', '2021'));
      });
    }
    function auSa4(x) {
      return get('data/au-regional/' + x.r + '.json').then(function (d) {
        if (!d || !d.sa4) return null;
        var list = Object.keys(d.sa4).map(function (c) { var a = d.sa4[c].v, v = a.AGRIC_15 || {}, k = a.AGRIC_11 || {}, w = a.WATER_4 || {}; return { n: d.sa4[c].n, v16: v['2016'], v21: v['2021'], k11: k['2011'], k21: k['2021'], w17: w['2017'], w21: w['2021'] }; }).filter(function (o) { return o.v21 != null; });
        if (!list.length) return null; list.sort(function (a, b) { return b.v21 - a.v21; });
        var f = function (v) { return v == null ? '—' : nf(v, 0); }, ch = function (a, b) { return a && b != null ? ((b / a - 1) * 100 >= 0 ? '+' : '−') + nf(Math.abs((b / a - 1) * 100), 0) + ' %' : '—'; };
        var rows = list.map(function (o) { return [esc(o.n), f(o.v21), ch(o.v16, o.v21), f(o.k21), ch(o.k11, o.k21)]; });
        var head = [L('Región SA4|SA4 region|Région SA4|Regione SA4'), L('Valor bruto 2021 (M A$)|Gross value 2021 (A$ m)|Valeur brute 2021 (M A$)|Valore lordo 2021 (M A$)'), L('vs 2016|vs 2016|vs 2016|vs 2016'), L('Vacuno de carne 2021|Meat cattle 2021|Bovins viande 2021|Bovini da carne 2021'), L('vs 2011|vs 2011|vs 2011|vs 2011')];
        return card(L('Evolución por región (SA4)|Change by region (SA4)|Évolution par région (SA4)|Evoluzione per regione (SA4)'), L('Valor bruto de la producción agraria (2016 y 2021, millones de A$ corrientes) y vacuno de carne (2011 y 2021) por región estadística SA4 (ABS).|Gross value of agricultural production (2016 and 2021, current A$ million) and meat cattle (2011 and 2021) by statistical area SA4 (ABS).|Valeur brute de la production agricole (2016 et 2021, millions de A$ courants) et bovins viande (2011 et 2021) par région SA4 (ABS).|Valore lordo della produzione agricola (2016 e 2021, milioni di A$ correnti) e bovini da carne (2011 e 2021) per regione SA4 (ABS).'), usCountyList(rows, head, 520, 8, L('Todas las regiones|All regions|Toutes les régions|Tutte le regioni')), cite('abs', '2021'));
      });
    }
    var C = function (k, fn) { return [k, fn]; };
    return {
      T: T, us: { uscdrought: usCountyDrought, uscins: usCountyIns, usprices: usPrices, usstocks: usStocks, usslaughter: usSlaughter, usdairy: usDairy, usland: usLand, usincome: usIncome, usrecv: usReceipts, uscensus: usCensus, usarc: usArc, usfuel: usFuel },
      mods: {
        US: [C('usprices', usPrices), C('usstocks', usStocks), C('usslaughter', usSlaughter), C('usdairy', usDairy), C('local', usLocal), C('usland', usLand), C('usarc', usArc), C('usfuel', usFuel), C('usincome', usIncome), C('usrecv', usReceipts), C('uscensus', usCensus), C('ins', usIns), C('uscins', usCountyIns), C('uscdrought', usCountyDrought), C('uscprog', usCropProg), C('clim', usClim)],
        CA: [C('mb', caMb), C('insca', caIns), C('cacensus', caCensus), C('cayields', caYields), C('candvi', caNdvi), C('clim', clim)],
        ES: [C('eslonjas', esLonjas), C('escrops', esCrops), C('eslv', esLive), C('essl', esSlaughter), C('esmilk', esMilk), C('clim', gridClim)],
        FR: [C('eslonjas', esLonjas), C('frcrops', frCrops), C('frqual', frQuality), C('vig', frVig), C('cere', frCere), C('clim', frClim)],
        DE: [C('eslonjas', esLonjas), C('deprod', deProd), C('deland', deLand), C('delive', deLive), C('delzs', deLzStruct), C('delzc', deLzCrops), C('delzl', deLzLive), C('dekrs', deKrStruct), C('dekrl', deKrLive), C('dekrz', deKrSize), C('dekmy', deKmYield), C('dekmc', deKmCattle), C('dekmj', deKmJobs), C('dekmh', deKmHist), C('eudr', eudr), C('clim', deClim)],
        PL: [C('plpws', plPwStruct), C('plpwl', plPwLive), C('plpwc', plPwCrops), C('plpwa', plPwLabour), C('plgms', plGmStruct), C('plgml', plGmLive), C('plgmc', plGmCrops), C('plgma', plGmLabour)],
        NL: [C('nlcrops', nlCbs), C('clim', gridClim)],
        AT: [C('eudr', eudr), C('clim', gridClim)], IT: [C('eslonjas', esLonjas), C('eudr', eudr), C('clim', gridClim)], AU: [C('aulv', auLivestock), C('ausa2c', auSa2Crops), C('ausa2h', auSa2Hort), C('aulga', auLga), C('ausa4', auSa4), C('clim', clim)], BE: [C('eudr', eudr), C('clim', gridClim)], DK: [C('clim', gridClim)], RO: [C('clim', gridClim)], HU: [C('clim', gridClim)], SK: [C('clim', gridClim)], EL: [C('elagri', elAgri), C('eudr', eudr), C('clim', gridClim)]
      },
      // bloques que solo existen para algunas regiones del país: si faltan no se listan como «sin dato»
      optional: { eslonjas: 1, eudr: 1, clim: 1, mb: 1, local: 1, cere: 1, deland: 0, usslaughter: 1, usdairy: 1, usstocks: 1, usprices: 1, usarc: 1, usfuel: 1, uscprog: 1 }
    };
  };
})();
