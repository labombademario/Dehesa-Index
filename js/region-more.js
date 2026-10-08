/* Dehesa Index — Bloques adicionales del perfil de región (region.html). ES5, sin librerías.
   Cada bloque lee un fichero que ya existe en data/ (los mismos que usan otras páginas) y solo muestra lo que ese fichero publica para la región.
   Lo que no hay se lista como «sin dato» en la propia página; nada se rellena con otra región ni se estima.
   Las sumas por comunidad autónoma de España (provincias del MAPA) y las cuotas sobre el total del país son cálculos de Dehesa Index y se dicen como tales.
   region.js llama a window.DehesaRegionMore(H) con sus utilidades y recibe { T: textos por idioma, mods: bloques por país }. */
(function () {
  'use strict';
  var IX = { es: 0, en: 1, fr: 2, it: 3 };   // los textos «a|b|c|d» de este fichero van en el orden es|en|fr|it
  // Punto de clima (NASA POWER, data/climate.json) que cae dentro de cada región. El Valle del Po (45,0 N 10,5 E) queda en la frontera Lombardía/Emilia-Romaña y no se asigna.
  var CLIM = { US: { IA: 'us-iowa', IL: 'us-illinois', KS: 'us-kansas', ND: 'us-north-dakota', NE: 'us-nebraska', MN: 'us-minnesota', IN: 'us-indiana', OH: 'us-ohio', SD: 'us-south-dakota', MO: 'us-missouri', TX: 'us-texas', OK: 'us-oklahoma', CO: 'us-colorado', MT: 'us-montana', WA: 'us-washington', CA: 'us-california', AR: 'us-arkansas', MS: 'us-mississippi', GA: 'us-georgia', WI: 'us-wisconsin', NC: 'us-north-carolina' }, ES: { AR: 'eu-aragon', CL: 'eu-castilla-leon' }, FR: { CVL: 'eu-beauce' }, DE: { ST: 'eu-saxony-anhalt' },
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
  var FR_CERE = { ARA: 'Auvergne-Rhône-Alpes', BFC: 'Bourgogne-Franche-Comté', BRE: 'Bretagne', CVL: 'Centre-Val de Loire', GES: 'Grand-Est', IDF: 'Ile-de-France', NAQ: 'Nouvelle-Aquitaine', OCC: 'Occitanie', PDL: 'Pays-de-la-Loire' };
  var VIG = { vigilance: 'Vigilancia|Vigilance|Vigilance|Vigilanza', alerte: 'Alerta|Alert|Alerte|Allerta', alerte_renforcee: 'Alerta reforzada|Heightened alert|Alerte renforcée|Allerta rafforzata', crise: 'Crisis|Crisis|Crise|Crisi', none: 'Sin restricción|No restriction|Pas de restriction|Nessuna restrizione' };
  var FR_INSEE = { ARA: '84', BFC: '27', BRE: '53', CVL: '24', COR: '94', GES: '44', HDF: '32', IDF: '11', NOR: '28', NAQ: '75', OCC: '76', PDL: '52', PAC: '93' };
  var FR_CROP = { 'soft-wheat': 'Trigo blando|Common wheat|Blé tendre|Frumento tenero', 'durum-wheat': 'Trigo duro|Durum wheat|Blé dur|Frumento duro', barley: 'Cebada|Barley|Orge|Orzo', 'maize-grain-seed': 'Maíz (grano y semilla)|Maize (grain and seed)|Maïs (grain et semence)|Mais (granella e seme)', oats: 'Avena|Oats|Avoine|Avena', rye: 'Centeno|Rye|Seigle|Segale', triticale: 'Triticale|Triticale|Triticale|Triticale', sorghum: 'Sorgo|Sorghum|Sorgho|Sorgo', rapeseed: 'Colza|Rapeseed|Colza|Colza', sunflower: 'Girasol|Sunflower|Tournesol|Girasole', soybeans: 'Soja|Soybeans|Soja|Soia', linseed: 'Lino oleaginoso|Oilseed flax|Lin oléagineux|Lino oleaginoso', 'protein-peas': 'Guisante proteaginoso|Protein peas|Pois protéagineux|Pisello proteico', 'faba-beans': 'Haba (féverole)|Faba beans|Féveroles|Fave', lentils: 'Lenteja|Lentils|Lentilles|Lenticchie' };
  var DE_CROP = { cereals: 'Cereales (con maíz grano)|Cereals (incl. grain maize)|Céréales (avec maïs grain)|Cereali (con mais da granella)', wheat: 'Trigo|Wheat|Blé|Frumento', rye: 'Centeno|Rye|Seigle|Segale', barley: 'Cebada|Barley|Orge|Orzo', oats: 'Avena|Oats|Avoine|Avena', triticale: 'Triticale|Triticale|Triticale|Triticale',
    maize: 'Maíz grano (con CCM)|Grain maize (incl. CCM)|Maïs grain (avec CCM)|Mais da granella (con CCM)', rapeseed: 'Colza y nabina|Rapeseed|Colza et navette|Colza e ravizzone', sunflower: 'Girasol|Sunflower|Tournesol|Girasole', sugarbeet: 'Remolacha azucarera|Sugar beet|Betterave sucrière|Barbabietola da zucchero', potato: 'Patata|Potatoes|Pommes de terre|Patate', silage: 'Maíz forrajero|Silage maize|Maïs fourrage|Mais da foraggio' };
  var DE_SP = { cattle: 'Vacuno|Cattle|Gros bovins|Bovini', calves: 'Terneros|Calves|Veaux|Vitelli', pigs: 'Porcino|Pigs|Porcins|Suini', sheep: 'Ovino|Sheep|Ovins|Ovini' };
  var NL_PV = { GR: 'PV20', FR: 'PV21', DR: 'PV22', OV: 'PV23', FL: 'PV24', GE: 'PV25', UT: 'PV26', NH: 'PV27', ZH: 'PV28', ZE: 'PV29', NB: 'PV30', LI: 'PV31' };
  var NL_CROP = { A042170: 'Trigo (total)|Wheat (total)|Blé (total)|Frumento (totale)', A042160: 'Cebada (total)|Barley (total)|Orge (total)|Orzo (totale)', A042169: 'Centeno|Rye|Seigle|Segale', A042164: 'Avena|Oats|Avoine|Avena', A042173: 'Triticale|Triticale|Triticale|Triticale',
    A042167: 'Maíz grano|Grain maize|Maïs grain|Mais da granella', A042168: 'Maíz forrajero|Silage maize|Maïs fourrage|Mais da foraggio', A042166: 'Maíz «corn cob mix»|Corn cob mix|Corn cob mix|Corn cob mix', A042180: 'Colza y nabina|Rapeseed|Colza et navette|Colza e ravizzone', A042191: 'Alubias pintas|Brown beans|Haricots bruns|Fagioli bruni',
    A042187: 'Lino textil|Fibre flax|Lin textile|Lino da fibra', A042177: 'Achicoria|Chicory|Chicorée|Cicoria', A042178: 'Cáñamo|Hemp|Chanvre|Canapa', A042355: 'Patata (total)|Potatoes (total)|Pommes de terre (total)|Patate (totale)', A042194: 'Remolacha azucarera|Sugar beet|Betterave sucrière|Barbabietola da zucchero', A042320: 'Cebolla de siembra (total)|Onions, sown (total)|Oignons de semis (total)|Cipolle da semina (totale)' };
  var NL_FM = [['farms', 'Explotaciones|Farms|Exploitations|Aziende'], ['agri_land', 'Superficie agraria (ha)|Agricultural land (ha)|Surface agricole (ha)|Superficie agricola (ha)'], ['arable', 'Tierras de cultivo (ha)|Arable land (ha)|Terres arables (ha)|Seminativi (ha)'], ['grass', 'Pastos y forrajes verdes (ha)|Grass and green fodder (ha)|Herbages et fourrages verts (ha)|Prati e foraggere verdi (ha)'],
    ['horticulture', 'Horticultura al aire libre (ha)|Open-field horticulture (ha)|Horticulture de plein champ (ha)|Orticoltura in pieno campo (ha)'], ['greenhouse', 'Invernaderos (ha)|Greenhouse horticulture (ha)|Serres (ha)|Serre (ha)'], ['cattle', 'Bovino (cabezas)|Cattle (head)|Bovins (têtes)|Bovini (capi)'], ['dairy_cows', 'Vacas lecheras (cabezas)|Dairy cows (head)|Vaches laitières (têtes)|Vacche da latte (capi)'],
    ['pigs', 'Porcino (cabezas)|Pigs (head)|Porcins (têtes)|Suini (capi)'], ['sheep', 'Ovino (cabezas)|Sheep (head)|Ovins (têtes)|Ovini (capi)'], ['goats', 'Caprino (cabezas)|Goats (head)|Caprins (têtes)|Caprini (capi)'], ['chickens', 'Gallinas y pollos (cabezas)|Chickens (head)|Poulets (têtes)|Polli (capi)']];
  var T = {
    es: { usSl: 'Sacrificio comercial', usSlSub: 'Animales sacrificados en mataderos comerciales en el último mes publicado (USDA NASS, informe mensual Livestock Slaughter y Poultry Slaughter). Peso vivo tal como lo publica NASS.', usSp: { cattle: 'Vacuno (500 lb o más)', calves: 'Terneros', hogs: 'Porcino', sheep: 'Ovino (con corderos)', chick: 'Pollos jóvenes', turkey: 'Pavos jóvenes' }, liveW: 'Peso vivo (millones de lb)', headsY: 'Cabezas hace un año', dressW: 'Peso canal medio (lb por cabeza, EE. UU.)',
      usSt: 'Existencias de grano', usStSub: 'Grano almacenado el primer día del trimestre (USDA NASS, Grain Stocks), millones de bushels: total, en la explotación y fuera de ella (almacenes y elevadores).', grain: 'Grano', stTot: 'Total', stOn: 'En la explotación', stOff: 'Fuera de ella', stYa: 'Hace un año', usShare: 'Peso en EE. UU.', usG: { corn: 'Maíz', soy: 'Soja', wheat: 'Trigo' },
      usLand: 'Tierra: valor y arrendamiento', usLandSub: 'Valor medio de la tierra agraria y renta de arrendamiento en efectivo, en dólares por acre (USDA NASS, Land Values y Cash Rents). Un acre son 0,405 ha.', usLk: { lv_all: 'Tierra agraria (con edificios)', lv_crop: 'Tierra de cultivo', lv_crop_irr: 'Cultivo de regadío', lv_crop_dry: 'Cultivo de secano', lv_pasture: 'Pastos' }, rentL: 'Arrendamiento', valueL: 'Valor', usRk: { rt_crop: 'Tierra de cultivo', rt_crop_irr: 'Cultivo de regadío', rt_crop_dry: 'Cultivo de secano', rt_pasture: 'Pastos' }, perAcre: 'USD por acre', countyRents: 'Arrendamiento por condado', county: 'Condado',
      usDa: 'Leche y huevos', usDaSub: 'Producción mensual (USDA NASS, Milk Production y Chickens and Eggs) y precio de la leche recibido por el ganadero.', usDk: { mk_prod: 'Leche producida (millones de lb)', mk_cow: 'Leche por vaca (lb)', mk_cows: 'Vacas de leche (miles)', eg_prod: 'Huevos producidos (millones)', eg_layers: 'Gallinas ponedoras (miles)', pr_milk: 'Precio de la leche (USD por cwt)' },
      usPr: 'Precios recibidos por el agricultor', usPrSub: 'Precio medio que recibe el agricultor del estado en el mes (USDA NASS, Agricultural Prices), frente a la media de EE. UU. del mismo mes. NASS no publica por estado el precio del vacuno ni del porcino.', usPk: { pr_corn: 'Maíz (USD/bu)', pr_soy: 'Soja (USD/bu)', pr_wheat: 'Trigo (USD/bu)', pr_oats: 'Avena (USD/bu)', pr_barley: 'Cebada (USD/bu)', pr_sorghum: 'Sorgo (USD/cwt)', pr_hay: 'Heno, todo (USD/t corta)', pr_alfalfa: 'Heno de alfalfa (USD/t corta)', pr_hay_other: 'Heno sin alfalfa (USD/t corta)', pr_cotton: 'Algodón (USD/lb)', pr_peanuts: 'Cacahuete (USD/lb)', pr_canola: 'Canola (USD/cwt)' }, stateP: 'Estado', usP: 'EE. UU.',
      usCe: 'Censo Agrario 2022', usCeSub: 'Explotaciones, superficie y ventas en el Censo Agrario 2022 (USDA NASS). Es el último censo: el siguiente es el de 2027.', usCk: { ce_farms: 'Explotaciones', ce_acres: 'Superficie de las explotaciones (acres)', ce_avgsize: 'Tamaño medio (acres)', ce_cropland: 'Tierra de cultivo (acres)', ce_irrigated: 'Superficie regada (acres)', ce_sales: 'Ventas agrarias (USD)', ce_crops: 'Ventas de cultivos (USD)', ce_animals: 'Ventas de ganado y productos (USD)', ce_govt: 'Ayudas federales recibidas (USD)', ce_age: 'Edad media del productor (años)' }, countiesL: 'Por condado', 
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
    en: { usSl: 'Commercial slaughter', usSlSub: 'Animals slaughtered at commercial plants in the latest published month (USDA NASS Livestock Slaughter and Poultry Slaughter). Live weight as published by NASS.', usSp: { cattle: 'Cattle (500 lb and over)', calves: 'Calves', hogs: 'Hogs', sheep: 'Sheep and lambs', chick: 'Young chickens', turkey: 'Young turkeys' }, liveW: 'Live weight (million lb)', headsY: 'Head a year earlier', dressW: 'Average dressed weight (lb per head, U.S.)',
      usSt: 'Grain stocks', usStSub: 'Grain stored on the first day of the quarter (USDA NASS Grain Stocks), million bushels: total, on farm and off farm (warehouses and elevators).', grain: 'Grain', stTot: 'Total', stOn: 'On farm', stOff: 'Off farm', stYa: 'A year earlier', usShare: 'Share of U.S.', usG: { corn: 'Corn', soy: 'Soybeans', wheat: 'Wheat' },
      usLand: 'Land: value and rent', usLandSub: 'Average farmland value and cash rent, in dollars per acre (USDA NASS Land Values and Cash Rents). One acre is 0.405 ha.', usLk: { lv_all: 'Farm real estate (incl. buildings)', lv_crop: 'Cropland', lv_crop_irr: 'Irrigated cropland', lv_crop_dry: 'Non-irrigated cropland', lv_pasture: 'Pasture' }, rentL: 'Cash rent', valueL: 'Value', usRk: { rt_crop: 'Cropland', rt_crop_irr: 'Irrigated cropland', rt_crop_dry: 'Non-irrigated cropland', rt_pasture: 'Pasture' }, perAcre: 'USD per acre', countyRents: 'Cash rent by county', county: 'County',
      usDa: 'Milk and eggs', usDaSub: 'Monthly output (USDA NASS Milk Production and Chickens and Eggs) and the milk price received by farmers.', usDk: { mk_prod: 'Milk produced (million lb)', mk_cow: 'Milk per cow (lb)', mk_cows: 'Milk cows (thousand)', eg_prod: 'Eggs produced (million)', eg_layers: 'Laying hens (thousand)', pr_milk: 'Milk price (USD per cwt)' },
      usPr: 'Prices received by farmers', usPrSub: 'Average price received by the state’s farmers in the month (USDA NASS Agricultural Prices), against the U.S. average for the same month. NASS does not publish cattle or hog prices by state.', usPk: { pr_corn: 'Corn (USD/bu)', pr_soy: 'Soybeans (USD/bu)', pr_wheat: 'Wheat (USD/bu)', pr_oats: 'Oats (USD/bu)', pr_barley: 'Barley (USD/bu)', pr_sorghum: 'Sorghum (USD/cwt)', pr_hay: 'Hay, all (USD/short ton)', pr_alfalfa: 'Alfalfa hay (USD/short ton)', pr_hay_other: 'Hay excl. alfalfa (USD/short ton)', pr_cotton: 'Cotton (USD/lb)', pr_peanuts: 'Peanuts (USD/lb)', pr_canola: 'Canola (USD/cwt)' }, stateP: 'State', usP: 'U.S.',
      usCe: '2022 Census of Agriculture', usCeSub: 'Farms, land and sales in the 2022 Census of Agriculture (USDA NASS). It is the latest census; the next one is 2027.', usCk: { ce_farms: 'Farms', ce_acres: 'Land in farms (acres)', ce_avgsize: 'Average size (acres)', ce_cropland: 'Cropland (acres)', ce_irrigated: 'Irrigated land (acres)', ce_sales: 'Agricultural sales (USD)', ce_crops: 'Crop sales (USD)', ce_animals: 'Livestock and product sales (USD)', ce_govt: 'Federal program receipts (USD)', ce_age: 'Average producer age (years)' }, countiesL: 'By county', 
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
    fr: { usSl: 'Abattages commerciaux', usSlSub: 'Animaux abattus dans les abattoirs commerciaux le dernier mois publié (USDA NASS, Livestock Slaughter et Poultry Slaughter). Poids vif tel que publié par NASS.', usSp: { cattle: 'Bovins (500 lb et plus)', calves: 'Veaux', hogs: 'Porcins', sheep: 'Ovins (avec agneaux)', chick: 'Jeunes poulets', turkey: 'Jeunes dindes' }, liveW: 'Poids vif (millions de lb)', headsY: 'Têtes il y a un an', dressW: 'Poids carcasse moyen (lb par tête, États-Unis)',
      usSt: 'Stocks de grains', usStSub: 'Grain stocké le premier jour du trimestre (USDA NASS, Grain Stocks), millions de boisseaux : total, à la ferme et hors ferme (silos et élévateurs).', grain: 'Grain', stTot: 'Total', stOn: 'À la ferme', stOff: 'Hors ferme', stYa: 'Il y a un an', usShare: 'Part des États-Unis', usG: { corn: 'Maïs', soy: 'Soja', wheat: 'Blé' },
      usLand: 'Terres : valeur et fermage', usLandSub: 'Valeur moyenne des terres agricoles et fermage en espèces, en dollars par acre (USDA NASS, Land Values et Cash Rents). Un acre vaut 0,405 ha.', usLk: { lv_all: 'Terres agricoles (avec bâtiments)', lv_crop: 'Terres de culture', lv_crop_irr: 'Cultures irriguées', lv_crop_dry: 'Cultures non irriguées', lv_pasture: 'Pâturages' }, rentL: 'Fermage', valueL: 'Valeur', usRk: { rt_crop: 'Terres de culture', rt_crop_irr: 'Cultures irriguées', rt_crop_dry: 'Cultures non irriguées', rt_pasture: 'Pâturages' }, perAcre: 'USD par acre', countyRents: 'Fermage par comté', county: 'Comté',
      usDa: 'Lait et œufs', usDaSub: 'Production mensuelle (USDA NASS, Milk Production et Chickens and Eggs) et prix du lait reçu par l’éleveur.', usDk: { mk_prod: 'Lait produit (millions de lb)', mk_cow: 'Lait par vache (lb)', mk_cows: 'Vaches laitières (milliers)', eg_prod: 'Œufs produits (millions)', eg_layers: 'Poules pondeuses (milliers)', pr_milk: 'Prix du lait (USD par cwt)' },
      usPr: 'Prix reçus par les agriculteurs', usPrSub: 'Prix moyen reçu par les agriculteurs de l’État dans le mois (USDA NASS, Agricultural Prices), comparé à la moyenne des États-Unis du même mois. NASS ne publie pas les prix des bovins ni des porcins par État.', usPk: { pr_corn: 'Maïs (USD/bu)', pr_soy: 'Soja (USD/bu)', pr_wheat: 'Blé (USD/bu)', pr_oats: 'Avoine (USD/bu)', pr_barley: 'Orge (USD/bu)', pr_sorghum: 'Sorgho (USD/cwt)', pr_hay: 'Foin, total (USD/t courte)', pr_alfalfa: 'Foin de luzerne (USD/t courte)', pr_hay_other: 'Foin hors luzerne (USD/t courte)', pr_cotton: 'Coton (USD/lb)', pr_peanuts: 'Arachide (USD/lb)', pr_canola: 'Canola (USD/cwt)' }, stateP: 'État', usP: 'États-Unis',
      usCe: 'Recensement agricole 2022', usCeSub: 'Exploitations, superficie et ventes au recensement agricole 2022 (USDA NASS). C’est le dernier recensement ; le prochain est celui de 2027.', usCk: { ce_farms: 'Exploitations', ce_acres: 'Superficie des exploitations (acres)', ce_avgsize: 'Taille moyenne (acres)', ce_cropland: 'Terres de culture (acres)', ce_irrigated: 'Superficie irriguée (acres)', ce_sales: 'Ventes agricoles (USD)', ce_crops: 'Ventes de cultures (USD)', ce_animals: 'Ventes d’animaux et produits (USD)', ce_govt: 'Aides fédérales reçues (USD)', ce_age: 'Âge moyen du producteur (ans)' }, countiesL: 'Par comté', 
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
    it: { usSl: 'Macellazioni commerciali', usSlSub: 'Animali macellati nei macelli commerciali nell’ultimo mese pubblicato (USDA NASS, Livestock Slaughter e Poultry Slaughter). Peso vivo come pubblicato da NASS.', usSp: { cattle: 'Bovini (500 lb e oltre)', calves: 'Vitelli', hogs: 'Suini', sheep: 'Ovini (con agnelli)', chick: 'Polli giovani', turkey: 'Tacchini giovani' }, liveW: 'Peso vivo (milioni di lb)', headsY: 'Capi un anno prima', dressW: 'Peso carcassa medio (lb per capo, USA)',
      usSt: 'Scorte di cereali', usStSub: 'Cereali immagazzinati il primo giorno del trimestre (USDA NASS, Grain Stocks), milioni di bushel: totale, in azienda e fuori azienda (magazzini ed elevatori).', grain: 'Cereale', stTot: 'Totale', stOn: 'In azienda', stOff: 'Fuori azienda', stYa: 'Un anno prima', usShare: 'Quota degli USA', usG: { corn: 'Mais', soy: 'Soia', wheat: 'Frumento' },
      usLand: 'Terreni: valore e affitto', usLandSub: 'Valore medio dei terreni agricoli e canone d’affitto in contanti, in dollari per acro (USDA NASS, Land Values e Cash Rents). Un acro è 0,405 ha.', usLk: { lv_all: 'Terreni agricoli (con edifici)', lv_crop: 'Seminativi', lv_crop_irr: 'Seminativi irrigui', lv_crop_dry: 'Seminativi asciutti', lv_pasture: 'Pascoli' }, rentL: 'Affitto', valueL: 'Valore', usRk: { rt_crop: 'Seminativi', rt_crop_irr: 'Seminativi irrigui', rt_crop_dry: 'Seminativi asciutti', rt_pasture: 'Pascoli' }, perAcre: 'USD per acro', countyRents: 'Affitto per contea', county: 'Contea',
      usDa: 'Latte e uova', usDaSub: 'Produzione mensile (USDA NASS, Milk Production e Chickens and Eggs) e prezzo del latte ricevuto dall’allevatore.', usDk: { mk_prod: 'Latte prodotto (milioni di lb)', mk_cow: 'Latte per vacca (lb)', mk_cows: 'Vacche da latte (migliaia)', eg_prod: 'Uova prodotte (milioni)', eg_layers: 'Galline ovaiole (migliaia)', pr_milk: 'Prezzo del latte (USD per cwt)' },
      usPr: 'Prezzi ricevuti dagli agricoltori', usPrSub: 'Prezzo medio ricevuto dagli agricoltori dello Stato nel mese (USDA NASS, Agricultural Prices), rispetto alla media USA dello stesso mese. NASS non pubblica per Stato i prezzi dei bovini né dei suini.', usPk: { pr_corn: 'Mais (USD/bu)', pr_soy: 'Soia (USD/bu)', pr_wheat: 'Frumento (USD/bu)', pr_oats: 'Avena (USD/bu)', pr_barley: 'Orzo (USD/bu)', pr_sorghum: 'Sorgo (USD/cwt)', pr_hay: 'Fieno, totale (USD/t corta)', pr_alfalfa: 'Fieno di erba medica (USD/t corta)', pr_hay_other: 'Fieno senza erba medica (USD/t corta)', pr_cotton: 'Cotone (USD/lb)', pr_peanuts: 'Arachidi (USD/lb)', pr_canola: 'Canola (USD/cwt)' }, stateP: 'Stato', usP: 'USA',
      usCe: 'Censimento agricolo 2022', usCeSub: 'Aziende, superficie e vendite nel censimento agricolo 2022 (USDA NASS). È l’ultimo censimento; il prossimo è quello del 2027.', usCk: { ce_farms: 'Aziende', ce_acres: 'Superficie delle aziende (acri)', ce_avgsize: 'Dimensione media (acri)', ce_cropland: 'Seminativi (acri)', ce_irrigated: 'Superficie irrigata (acri)', ce_sales: 'Vendite agricole (USD)', ce_crops: 'Vendite di colture (USD)', ce_animals: 'Vendite di bestiame e prodotti (USD)', ce_govt: 'Aiuti federali ricevuti (USD)', ce_age: 'Età media del produttore (anni)' }, countiesL: 'Per contea', 
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
  Object.keys(T).forEach(function (l) { var x = T[l]; x.usprices = x.usPr; x.usstocks = x.usSt; x.usslaughter = x.usSl; x.usdairy = x.usDa; x.usland = x.usLand; x.usincome = x.usIn; x.uscensus = x.usCe; });   // títulos de los bloques para el índice
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

    /* ---- clima (todos los países) ---- */
    function clim(x) {
      var ids = CLIM[x.c] && CLIM[x.c][x.r]; if (!ids) return Promise.resolve(null); if (typeof ids === 'string') ids = [ids];
      return get('data/climate.json').then(function (d) {
        var t = tt(), locs = (d && d.locations || []).filter(function (l) { return ids.indexOf(l.id) >= 0 && l.months && l.months.length; }); if (!locs.length) return null;
        var body = locs.map(function (l) {
          var rows = l.months.slice(-6).reverse().map(function (m) { return [esc(mon(m.period)), nf(m.precipMm, 1), (m.precipAnomalyPct > 0 ? '+' : m.precipAnomalyPct < 0 ? '−' : '') + nf(Math.abs(m.precipAnomalyPct), 0) + ' %', nf(m.tempC, 1), (m.tempAnomalyC > 0 ? '+' : m.tempAnomalyC < 0 ? '−' : '') + nf(Math.abs(m.tempAnomalyC), 1) + ' °C']; });
          return '<h3 style="margin:10px 0 4px;font-size:14px">' + esc(t.climPt) + ': ' + esc(l.name) + ' ' + faint(nf(l.lat, 1) + '°, ' + nf(l.lon, 1) + '°') + '</h3>' + table([t.mMonth, t.precip, t.precipA, t.temp, t.tempA], rows, 480);
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
        var t = tt(), rows = [], camp = '', prov = false;
        fs.forEach(function (f, i) { if (!f || !f.campaigns) return; var ck = Object.keys(f.campaigns).sort().pop(), C = f.campaigns[ck], tot = C && C.crops && C.crops[0]; if (!tot || !tot.v) return;
          camp = ck; if (C.status === 'provisional') prov = true; var a = 0, p = 0, na = 0, np = 0;
          pv.forEach(function (k) { var v = tot.v[k]; if (!v) return; if (v[0] != null) { a += v[0]; na++; } if (v[4] != null) { p += v[4]; np++; } });
          if ((!na || !a) && (!np || !p)) return;
          rows.push([esc(L(ES_GROUPS[i][1])), na ? nf(a, 0) : '—', np ? nf(p, 0) : '—', na && a && tot.t && tot.t[0] ? share(a, tot.t[0]) : '—']); });
        if (!rows.length) return null;
        var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.campaign) + ' ' + esc(camp) + (prov ? ' (' + esc(t.provisional) + ')' : '') + '</p>' + table([t.grp, t.areaHa, t.prodT, t.shareEs], rows, 460) + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.calcShare) + '</p>';
        return card(t.escrops, t.escropsSub, body + link('paises.html?c=ES#ps-es', t.openEs), cite('mapa_es', camp));
      });
    }
    function esLive(x) {
      var pv = ES_PROV[x.r]; if (!pv) return Promise.resolve(null);
      var sp = ['bovino', 'ovino', 'caprino', 'porcino'];
      return Promise.all(sp.map(function (s) { return get('data/spain-livestock/livestock-' + s + '.json'); })).then(function (fs) {
        var t = tt(), rows = [], per = '';
        fs.forEach(function (f, i) { if (!f || !f.v || !f.periods) return; var P = f.periods, j = P.length - 1, sum = function (jj) { var s = 0, n = 0; pv.forEach(function (k) { var a = f.v[k] && f.v[k]['01']; if (a && a[jj] != null) { s += a[jj]; n++; } }); return n ? s : null; };
          var v = sum(j), v0 = j >= 2 ? sum(j - 2) : null, tot = f.v.ES && f.v.ES['01'] && f.v.ES['01'][j]; if (v == null) return; per = P[j];
          rows.push([esc(L(SP[sp[i]])), nf(v, 0), v0 != null ? nf(v0, 0) : '—', v0 ? esc(pct((v / v0 - 1) * 100)) : '', share(v, tot)]); });
        if (!rows.length) return null;
        return card(t.eslv, t.eslvSub, '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(mon(per)) + '</p>' + table([t.species, t.heads, t.yoyS, t.vs, t.shareEs], rows, 480), cite('mapa_es', per));
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
        rows.sort(function (a, b) { return b[5] - a[5]; }); rows = rows.map(function (r) { return r.slice(0, 5); });
        if (!rows.length) return null;
        return card(t.frcrops, t.frcropsSub, '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(H.yearWord()) + ' ' + esc(yrAll) + ' (' + esc(t.provW) + ')</p>' + table([t.crop, t.areaHa, t.yieldT, t.prodT, t.shareFr], rows, 520), cite('franceagrimer', yrAll));
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
        var P = d && d.production; if (!P || !P.land) return null; var t = tt(), rows = [], yr = '';
        (d.crops || []).forEach(function (c) { var b = P.land[c.k] && P.land[c.k][x.r]; if (!b) return; var p = lastPt(b.prod); if (!p) return; var a = atY(b.area, p[0]), y = atY(b.yield, p[0]), nat = P.nat[c.k] && atY(P.nat[c.k].prod, p[0]);
          yr = yr > String(p[0]) ? yr : String(p[0]); rows.push([esc(L(DE_CROP[c.k] || c.k)) + (String(p[0]) !== yr ? ' ' + faint(p[0]) : ''), a != null ? nf(a, 0) : '—', y != null ? nf(y, 1) : '—', nf(p[1], 0), nat ? share(p[1], nat) : '—']); });
        if (!rows.length) return null;
        return card(t.deprod, t.deprodSub, '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(H.yearWord()) + ' ' + esc(yr) + '</p>' + table([t.crop, t.areaHa, t.yieldT, t.prodT, t.shareDe], rows, 520) + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.calcShare) + '</p>', cite('destatis', yr));
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
        var C = d.crops && d.crops.data, rows = [];
        Object.keys(NL_CROP).forEach(function (k) { var b = C && C[k] && C[k][pv]; if (!b) return; var a = lastPt(b.area), p = lastPt(b.prod); if (!a && !p) return; if ((a && !a[1]) && (p && !p[1])) return;
          var nat = C[k].NL01, na = a && nat ? atY(nat.area, a[0]) : null;
          rows.push([esc(L(NL_CROP[k])), a ? nf(a[1], 0) + ' ' + faint(a[0]) : '—', p ? nf(p[1], 0) + ' ' + faint(p[0]) : '—', a && na ? share(a[1], na) : '—']); });
        if (rows.length) out += card(t.nlcrops, t.nlcropsSub, table([t.crop, t.areaHa, t.prodT, t.shareNl], rows, 500) + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.calcShare) + '</p>', cite('cbs_nl'));
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
        if (Cn) { var cr = Object.keys(Cn).map(function (f) { var c = Cn[f], g = function (k) { var o = c[k]; if (!o || typeof o !== 'object') return null; var ys = Object.keys(o).sort(); return ys.length ? [ys[ys.length - 1], o[ys[ys.length - 1]]] : null; }, a = g('rt_crop_dry'), b = g('rt_crop_irr'), p2 = g('rt_pasture'); return (a || b || p2) ? [esc(c.name), a ? nf(a[1], 0) + ' ' + faint(a[0]) : '—', b ? nf(b[1], 0) + ' ' + faint(b[0]) : '—', p2 ? nf(p2[1], 0) + ' ' + faint(p2[0]) : '—'] : null; }).filter(Boolean).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
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
        if (Cn) { var cr = Object.keys(Cn).map(function (f) { var c = Cn[f]; return c.ce_farms != null ? [esc(c.name), nf(c.ce_farms, 0), c.ce_acres != null ? nf(c.ce_acres, 0) : '—', c.ce_sales != null ? nf(c.ce_sales / 1e6, 1) + ' M' : '—'] : null; }).filter(Boolean).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
          if (cr.length) body += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13.5px">' + esc(t.countiesL) + ' (' + cr.length + ')</summary>' + table([t.county, t.usCk.ce_farms, t.usCk.ce_acres, t.usCk.ce_sales], cr, 460) + '</details>'; }
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
    var C = function (k, fn) { return [k, fn]; };
    return {
      T: T, us: { usprices: usPrices, usstocks: usStocks, usslaughter: usSlaughter, usdairy: usDairy, usland: usLand, usincome: usIncome, uscensus: usCensus, usarc: usArc, usfuel: usFuel },
      mods: {
        US: [C('usprices', usPrices), C('usstocks', usStocks), C('usslaughter', usSlaughter), C('usdairy', usDairy), C('local', usLocal), C('usland', usLand), C('usarc', usArc), C('usfuel', usFuel), C('usincome', usIncome), C('uscensus', usCensus), C('ins', usIns), C('clim', clim)],
        CA: [C('mb', caMb), C('insca', caIns), C('clim', clim)],
        ES: [C('escrops', esCrops), C('eslv', esLive), C('essl', esSlaughter), C('esmilk', esMilk), C('clim', clim)],
        FR: [C('frcrops', frCrops), C('frqual', frQuality), C('vig', frVig), C('cere', frCere), C('clim', clim)],
        DE: [C('deprod', deProd), C('deland', deLand), C('delive', deLive), C('clim', clim)],
        NL: [C('nlcrops', nlCbs), C('clim', clim)],
        AT: [C('clim', clim)], IT: [C('clim', clim)], AU: [C('clim', clim)], BE: [C('clim', clim)], DK: [C('clim', clim)]
      },
      // bloques que solo existen para algunas regiones del país: si faltan no se listan como «sin dato»
      optional: { clim: 1, mb: 1, local: 1, cere: 1, deland: 0, usslaughter: 1, usdairy: 1, usstocks: 1, usprices: 1, usarc: 1, usfuel: 1 }
    };
  };
})();
