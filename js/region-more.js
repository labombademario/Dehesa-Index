/* Dehesa Index — Bloques adicionales del perfil de región (region.html). ES5, sin librerías.
   Cada bloque lee un fichero que ya existe en data/ (los mismos que usan otras páginas) y solo muestra lo que ese fichero publica para la región.
   Lo que no hay se lista como «sin dato» en la propia página; nada se rellena con otra región ni se estima.
   Las sumas por comunidad autónoma de España (provincias del MAPA) y las cuotas sobre el total del país son cálculos de Dehesa Index y se dicen como tales.
   region.js llama a window.DehesaRegionMore(H) con sus utilidades y recibe { T: textos por idioma, mods: bloques por país }. */
(function () {
  'use strict';
  var IX = { es: 0, en: 1, fr: 2, it: 3 };   // los textos «a|b|c|d» de este fichero van en el orden es|en|fr|it
  // Punto de clima (NASA POWER, data/climate.json) que cae dentro de cada región. El Valle del Po (45,0 N 10,5 E) queda en la frontera Lombardía/Emilia-Romaña y no se asigna.
  var CLIM = { US: { IA: 'us-iowa', IL: 'us-illinois', KS: 'us-kansas', ND: 'us-north-dakota' }, ES: { AR: 'eu-aragon', CL: 'eu-castilla-leon' }, FR: { CVL: 'eu-beauce' }, DE: { ST: 'eu-saxony-anhalt' },
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
    es: { toc: 'En esta página', lazy: 'Mostrar', calcShare: 'Cuota sobre el país: cálculo de Dehesa Index con las cifras de la fuente.',
      clim: 'Clima', climSub: 'Precipitación y temperatura mensuales en un punto de referencia de la región frente a su media 1991-2020 (NASA POWER). Es un punto, no una media de toda la región.', climPt: 'Punto', mMonth: 'Mes', precip: 'Lluvia (mm)', precipA: 'frente a la media', temp: 'Temperatura (°C)', tempA: 'Anomalía', climMore: 'Ver el clima con su histórico',
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
      deprod: 'Producción agrícola', deprodSub: 'Cosecha del último año publicado (Destatis). La producción de los últimos meses puede ser una estimación provisional de la fuente.', crop: 'Cultivo', yieldT: 'Rendimiento (dt/ha)', shareDe: 'Peso en Alemania',
      deland: 'Tierra agraria: precio y arrendamiento', delandSub: 'Precio medio de venta de tierra agraria por hectárea y renta de arrendamiento por hectárea (Destatis). Euros corrientes.', kindL: 'Tipo', priceHa: 'Precio de venta (EUR/ha)', salesN: 'Ventas', rentHa: 'Arrendamiento (EUR/ha)', lf: 'Superficie agraria', acker: 'Tierra de cultivo', gruen: 'Pastos permanentes', noLandPrice: 'Destatis no publica el precio de venta de este Land.',
      delive: 'Sacrificio y huevos', deliveSub: 'Sacrificio de animales de origen nacional en el Land (toneladas de peso canal) y producción de huevos en explotaciones con 3.000 o más plazas (Destatis), último año.', slT: 'Sacrificio (t)', eggsM: 'Huevos (miles)', hens: 'Gallinas ponedoras',
      nlcrops: 'Cultivos herbáceos', nlcropsSub: 'Superficie y producción por cultivo en la provincia (CBS). La superficie del año en curso puede publicarse antes que la producción.', openDe: 'Ver la ficha de Alemania: tierra, producción y margen por Land', shareNl: 'Peso en los Países Bajos', nlfarms: 'Explotaciones y ganado', nlfarmsSub: 'Censo agrario de la provincia (CBS), último año publicado de cada variable.', varL: 'Variable', valL: 'Valor', yearL2: 'Año' },
    en: { toc: 'On this page', lazy: 'Show', calcShare: 'Share of the country: Dehesa Index calculation with the source’s figures.',
      clim: 'Weather', climSub: 'Monthly rainfall and temperature at a reference point in the region against its 1991-2020 average (NASA POWER). It is one point, not an average for the whole region.', climPt: 'Point', mMonth: 'Month', precip: 'Rain (mm)', precipA: 'vs. average', temp: 'Temperature (°C)', tempA: 'Anomaly', climMore: 'See the weather with its history',
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
      deprod: 'Crop production', deprodSub: 'Harvest of the latest published year (Destatis). The most recent year may be a provisional estimate from the source.', crop: 'Crop', yieldT: 'Yield (dt/ha)', shareDe: 'Share of Germany',
      deland: 'Farmland: price and rent', delandSub: 'Average sale price of farmland per hectare and rent per hectare (Destatis). Current euros.', kindL: 'Type', priceHa: 'Sale price (EUR/ha)', salesN: 'Sales', rentHa: 'Rent (EUR/ha)', lf: 'Agricultural land', acker: 'Arable land', gruen: 'Permanent grassland', noLandPrice: 'Destatis does not publish the sale price for this Land.',
      delive: 'Slaughter and eggs', deliveSub: 'Slaughter of domestic animals in the Land (tonnes carcass weight) and egg production on farms with 3,000 or more places (Destatis), latest year.', slT: 'Slaughter (t)', eggsM: 'Eggs (thousand)', hens: 'Laying hens',
      nlcrops: 'Arable crops', nlcropsSub: 'Area and production by crop in the province (CBS). The current year’s area may be published before production.', openDe: 'See the Germany profile: land, production and margin by Land', shareNl: 'Share of the Netherlands', nlfarms: 'Farms and livestock', nlfarmsSub: 'Agricultural census of the province (CBS), latest published year of each variable.', varL: 'Variable', valL: 'Value', yearL2: 'Year' },
    fr: { toc: 'Sur cette page', lazy: 'Afficher', calcShare: 'Part du pays : calcul de Dehesa Index avec les chiffres de la source.',
      clim: 'Climat', climSub: 'Pluie et température mensuelles en un point de référence de la région, comparées à la moyenne 1991-2020 (NASA POWER). C’est un point, pas une moyenne de toute la région.', climPt: 'Point', mMonth: 'Mois', precip: 'Pluie (mm)', precipA: 'par rapport à la moyenne', temp: 'Température (°C)', tempA: 'Anomalie', climMore: 'Voir le climat avec son historique',
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
      deprod: 'Production végétale', deprodSub: 'Récolte de la dernière année publiée (Destatis). L’année la plus récente peut être une estimation provisoire de la source.', crop: 'Culture', yieldT: 'Rendement (q/ha)', shareDe: 'Part de l’Allemagne',
      deland: 'Terres agricoles : prix et fermage', delandSub: 'Prix moyen de vente des terres agricoles par hectare et fermage par hectare (Destatis). Euros courants.', kindL: 'Type', priceHa: 'Prix de vente (EUR/ha)', salesN: 'Ventes', rentHa: 'Fermage (EUR/ha)', lf: 'Surface agricole', acker: 'Terres arables', gruen: 'Prairies permanentes', noLandPrice: 'Destatis ne publie pas le prix de vente de ce Land.',
      delive: 'Abattages et œufs', deliveSub: 'Abattages d’animaux d’origine nationale dans le Land (tonnes de poids carcasse) et production d’œufs dans les élevages de 3 000 places ou plus (Destatis), dernière année.', slT: 'Abattages (t)', eggsM: 'Œufs (milliers)', hens: 'Poules pondeuses',
      nlcrops: 'Grandes cultures', nlcropsSub: 'Superficie et production par culture dans la province (CBS). La superficie de l’année en cours peut être publiée avant la production.', openDe: 'Voir la fiche Allemagne : terres, production et marge par Land', shareNl: 'Part des Pays-Bas', nlfarms: 'Exploitations et cheptel', nlfarmsSub: 'Recensement agricole de la province (CBS), dernière année publiée de chaque variable.', varL: 'Variable', valL: 'Valeur', yearL2: 'Année' },
    it: { toc: 'In questa pagina', lazy: 'Mostra', calcShare: 'Quota del paese: calcolo di Dehesa Index con le cifre della fonte.',
      clim: 'Clima', climSub: 'Pioggia e temperatura mensili in un punto di riferimento della regione rispetto alla media 1991-2020 (NASA POWER). È un punto, non una media dell’intera regione.', climPt: 'Punto', mMonth: 'Mese', precip: 'Pioggia (mm)', precipA: 'rispetto alla media', temp: 'Temperatura (°C)', tempA: 'Anomalia', climMore: 'Vedi il clima con il suo storico',
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
      deprod: 'Produzione agricola', deprodSub: 'Raccolto dell’ultimo anno pubblicato (Destatis). L’anno più recente può essere una stima provvisoria della fonte.', crop: 'Coltura', yieldT: 'Resa (q/ha)', shareDe: 'Quota della Germania',
      deland: 'Terreni agricoli: prezzo e affitto', delandSub: 'Prezzo medio di vendita dei terreni agricoli per ettaro e canone d’affitto per ettaro (Destatis). Euro correnti.', kindL: 'Tipo', priceHa: 'Prezzo di vendita (EUR/ha)', salesN: 'Vendite', rentHa: 'Affitto (EUR/ha)', lf: 'Superficie agricola', acker: 'Seminativi', gruen: 'Prati permanenti', noLandPrice: 'Destatis non pubblica il prezzo di vendita di questo Land.',
      delive: 'Macellazioni e uova', deliveSub: 'Macellazioni di animali di origine nazionale nel Land (tonnellate di peso carcassa) e produzione di uova negli allevamenti con 3.000 o più posti (Destatis), ultimo anno.', slT: 'Macellazioni (t)', eggsM: 'Uova (migliaia)', hens: 'Galline ovaiole',
      nlcrops: 'Seminativi', nlcropsSub: 'Superficie e produzione per coltura nella provincia (CBS). La superficie dell’anno in corso può essere pubblicata prima della produzione.', openDe: 'Vedi la scheda Germania: terreni, produzione e margine per Land', shareNl: 'Quota dei Paesi Bassi', nlfarms: 'Aziende e bestiame', nlfarmsSub: 'Censimento agricolo della provincia (CBS), ultimo anno pubblicato di ogni variabile.', varL: 'Variabile', valL: 'Valore', yearL2: 'Anno' }
  };

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

    var C = function (k, fn) { return [k, fn]; };
    return {
      T: T,
      mods: {
        US: [C('local', usLocal), C('ins', usIns), C('clim', clim)],
        CA: [C('mb', caMb), C('insca', caIns), C('clim', clim)],
        ES: [C('escrops', esCrops), C('eslv', esLive), C('essl', esSlaughter), C('esmilk', esMilk), C('clim', clim)],
        FR: [C('vig', frVig), C('cere', frCere), C('clim', clim)],
        DE: [C('deprod', deProd), C('deland', deLand), C('delive', deLive), C('clim', clim)],
        NL: [C('nlcrops', nlCbs), C('clim', clim)],
        AT: [C('clim', clim)], IT: [C('clim', clim)], AU: [C('clim', clim)], BE: [C('clim', clim)], DK: [C('clim', clim)]
      },
      // bloques que solo existen para algunas regiones del país: si faltan no se listan como «sin dato»
      optional: { clim: 1, mb: 1, local: 1, cere: 1, deland: 0 }
    };
  };
})();
