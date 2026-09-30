/* Dehesa Index — capa de datos y funciones puras compartidas por Precios
   (y, más adelante, por el resto de páginas de mercado). Extraído 1:1 del
   artefacto Design original (Main.dc.html): mismos precios, mismas fuentes,
   mismos comentarios de investigación -- solo se ha adaptado la sintaxis
   `this.props`/`this.state` a funciones planas. ES5 a propósito, sin build
   step (var, function(){}, sin arrow functions). */
(function (global) {
  'use strict';

  // --- Tipos de cambio (Banco Central Europeo, referencia del 30 sep 2026) -
  var EURUSD = 1.1355;
  var GBPUSD = 1.3286;
  var FX_DATE = '2026-09-30'; // fecha ISO de la cotización, la actualiza scripts/update-fx.mjs
  var CADUSD = 0.7051;
  var DKKUSD = 0.1522; // corona danesa (ERM II, ~7,46 por EUR); la actualiza scripts/update-fx.mjs
  var FX = { USD: 1, EUR: EURUSD, GBP: GBPUSD, CAD: CADUSD, DKK: DKKUSD };
  var CCY_SYMBOL = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', DKK: 'kr ' };

  // Nombres de mes abreviados por idioma, para mostrar FX_DATE en el panel
  // sin depender de Intl (coherencia con el resto del sitio, que es ES5
  // puro y sin build step).
  var MONTH_ABBR = {
    es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  };
  function formatFxDate(isoDate, lang) {
    var parts = String(isoDate).split('-');
    var y = parts[0], m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    var months = MONTH_ABBR[lang] || MONTH_ABBR.es;
    if (lang === 'en') return months[m - 1] + ' ' + d + ', ' + y;
    return d + ' ' + months[m - 1] + ' ' + y;
  }

  var UNIT_LABELS = {
    es: { bushel: 'bushel', mmbtu: 'MMBtu', barril: 'barril', cwt: 'cwt', lb: 'lb', ton_corta: 'ton corta', tonelada: 'tonelada', kg: 'kg', '100kg': '100 kg', gal: 'galón', docena: 'docena', litro: 'litro' },
    en: { bushel: 'bushel', mmbtu: 'MMBtu', barril: 'barrel', cwt: 'cwt', lb: 'lb', ton_corta: 'short ton', tonelada: 'tonne', kg: 'kg', '100kg': '100 kg', gal: 'gallon', docena: 'dozen', litro: 'liter' },
    fr: { bushel: 'bushel', mmbtu: 'MMBtu', barril: 'baril', cwt: 'cwt', lb: 'lb', ton_corta: 'tonne courte', tonelada: 'tonne', kg: 'kg', '100kg': '100 kg', gal: 'gallon', docena: 'douzaine', litro: 'litre' },
    it: { bushel: 'bushel', mmbtu: 'MMBtu', barril: 'barile', cwt: 'cwt', lb: 'lb', ton_corta: 'tonnellata corta', tonelada: 'tonnellata', kg: 'kg', '100kg': '100 kg', gal: 'gallone', docena: 'dozzina', litro: 'litro' }
  };

  var REGION = {
    es: { us: 'EE. UU.', eu: 'Europa', uk: 'Reino Unido', ca: 'Canadá', dk: 'Dinamarca' },
    en: { us: 'U.S.', eu: 'Europe', uk: 'U.K.', ca: 'Canada', dk: 'Denmark' },
    fr: { us: 'États-Unis', eu: 'Europe', uk: 'Royaume-Uni', ca: 'Canada', dk: 'Danemark' },
    it: { us: 'Stati Uniti', eu: 'Europa', uk: 'Regno Unito', ca: 'Canada', dk: 'Danimarca' }
  };

  var ENERGY_REGIONS = {
    es: { usNacional: 'EE. UU. (nacional)', usMidwest: 'Medio Oeste (Midwest)', usSur: 'Sur (Costa del Golfo)', usOeste: 'Oeste (Costa Oeste)', usEste: 'Este (Costa Este)', euPromedio: 'Media UE-27', euAlemania: 'Alemania', euFrancia: 'Francia', euEspana: 'España', euItalia: 'Italia', usTitle: 'EE. UU. por regiones', euTitle: 'Europa por país', regionalTitle: 'Desglose regional' },
    en: { usNacional: 'U.S. (national)', usMidwest: 'Midwest', usSur: 'South (Gulf Coast)', usOeste: 'West (West Coast)', usEste: 'East (East Coast)', euPromedio: 'EU-27 average', euAlemania: 'Germany', euFrancia: 'France', euEspana: 'Spain', euItalia: 'Italy', usTitle: 'U.S. by region', euTitle: 'Europe by country', regionalTitle: 'Regional breakdown' },
    fr: { usNacional: 'États-Unis (national)', usMidwest: 'Midwest', usSur: 'Sud (côte du Golfe)', usOeste: 'Ouest (côte Pacifique)', usEste: 'Est (côte Est)', euPromedio: 'Moyenne UE-27', euAlemania: 'Allemagne', euFrancia: 'France', euEspana: 'Espagne', euItalia: 'Italie', usTitle: 'États-Unis par région', euTitle: 'Europe par pays', regionalTitle: 'Répartition régionale' },
    it: { usNacional: 'Stati Uniti (nazionale)', usMidwest: 'Midwest', usSur: 'Sud (costa del Golfo)', usOeste: 'Ovest (costa Pacifica)', usEste: 'Est (costa Orientale)', euPromedio: 'Media UE-27', euAlemania: 'Germania', euFrancia: 'Francia', euEspana: 'Spagna', euItalia: 'Italia', usTitle: 'Stati Uniti per regione', euTitle: 'Europa per paese', regionalTitle: 'Ripartizione regionale' }
  };
  var COUNTRY_ER_KEY = { de: 'euAlemania', fr: 'euFrancia', es: 'euEspana', it: 'euItalia' };
  var COUNTRY_FLAG = { de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹' };

  var QUOTE_TYPES = {
    es: {
      futuro: { label: 'Futuro', desc: 'Precio de un contrato de futuros negociado en un mercado organizado (p. ej. CBOT, Euronext).' },
      referencia: { label: 'Referencia oficial', desc: 'Precio o índice de referencia publicado por un organismo público (p. ej. USDA), no un contrato negociado.' },
      lonja: { label: 'Lonja', desc: 'Precio de contratación en una lonja o mercado físico regional.' },
      indice: { label: 'Índice', desc: 'Índice compuesto a partir de varias fuentes, no un precio de una única transacción.' },
      spot: { label: 'Spot', desc: 'Precio al contado para entrega inmediata.' }
    },
    en: {
      futuro: { label: 'Futures', desc: 'Price of a futures contract traded on an organized exchange (e.g. CBOT, Euronext).' },
      referencia: { label: 'Official reference', desc: 'Reference price or index published by a public body (e.g. USDA), not a traded contract.' },
      lonja: { label: 'Regional market', desc: 'Price set at a regional physical trading market (lonja).' },
      indice: { label: 'Index', desc: 'Composite index built from several sources, not a single-transaction price.' },
      spot: { label: 'Spot', desc: 'Cash price for immediate delivery.' }
    },
    fr: {
      futuro: { label: 'Futur', desc: 'Prix d’un contrat à terme négocié sur un marché organisé (p. ex. CBOT, Euronext).' },
      referencia: { label: 'Référence officielle', desc: 'Prix ou indice de référence publié par un organisme public (p. ex. USDA), pas un contrat négocié.' },
      lonja: { label: 'Marché régional', desc: 'Prix constaté sur un marché physique régional (lonja).' },
      indice: { label: 'Indice', desc: 'Indice composite construit à partir de plusieurs sources, pas le prix d’une seule transaction.' },
      spot: { label: 'Spot', desc: 'Prix au comptant pour livraison immédiate.' }
    },
    it: {
      futuro: { label: 'Futuro', desc: 'Prezzo di un contratto future negoziato su un mercato organizzato (es. CBOT, Euronext).' },
      referencia: { label: 'Riferimento ufficiale', desc: 'Prezzo o indice di riferimento pubblicato da un ente pubblico (es. USDA), non un contratto negoziato.' },
      lonja: { label: 'Mercato regionale', desc: 'Prezzo rilevato in un mercato fisico regionale (lonja).' },
      indice: { label: 'Indice', desc: 'Indice composito costruito da più fonti, non il prezzo di una singola transazione.' },
      spot: { label: 'Spot', desc: 'Prezzo a pronti per consegna immediata.' }
    }
  };

  var NAMES = {
    es: { canola_elevador: 'Canola, oferta de elevador (Alberta)', trigo_pienso_ab: 'Trigo forrajero, oferta de elevador (Alberta)', cebada_pienso_ab: 'Cebada forrajera, oferta de elevador (Alberta)', avena_pienso_ab: 'Avena forrajera, oferta de elevador (Alberta)', trigo_cwrs_ab: 'Trigo CWRS, oferta de elevador (Alberta)', lenteja_laird_ab: 'Lenteja Laird n.º 1, oferta al contado (Alberta)', guisante_verde_ab: 'Guisante verde n.º 2, oferta al contado (Alberta)', novillo_ab: 'Novillos, ventas directas (Alberta)', cerdo_ab: 'Cerdo en canal, precio al contado (Alberta)', soja_grano: 'Soja en grano', lenteja: 'Lentejas', guisante_seco: 'Guisantes secos', lino: 'Lino (linaza)', gas_natural: 'Gas natural (Henry Hub / TTF)', petroleo_wti: 'Petróleo WTI (Texas)', petroleo_brent: 'Petróleo Brent', mantequilla: 'Mantequilla', leche_polvo: 'Leche desnatada en polvo', colza: 'Colza', centeno: 'Centeno', cebada: 'Cebada', avena: 'Avena', sorgo: 'Sorgo', maiz: 'Maíz', trigo: 'Trigo', arroz: 'Arroz', leche: 'Leche', vaca: 'Vaca (vacuno)', cabra: 'Cabra', pienso: 'Pienso compuesto', harina_soja: 'Harina de soja', urea: 'Urea', dap: 'DAP (fosfato diamónico)', potasa: 'Potasa (MOP)', cerdo: 'Cerdo', cordero: 'Cordero', huevos: 'Huevos', pollo: 'Pollo', azucar: 'Azúcar', oliva: 'Aceite de oliva', diesel: 'Diésel agrícola' },
    en: { canola_elevador: 'Canola, elevator bid (Alberta)', trigo_pienso_ab: 'Feed wheat, elevator bid (Alberta)', cebada_pienso_ab: 'Feed barley, elevator bid (Alberta)', avena_pienso_ab: 'Feed oats, elevator bid (Alberta)', trigo_cwrs_ab: 'CWRS wheat, elevator bid (Alberta)', lenteja_laird_ab: 'Laird lentils no. 1, cash bid (Alberta)', guisante_verde_ab: 'Green peas no. 2, cash bid (Alberta)', novillo_ab: 'Steers, direct sales (Alberta)', cerdo_ab: 'Hogs (carcass), cash price (Alberta)', soja_grano: 'Soybeans', lenteja: 'Lentils', guisante_seco: 'Dry peas', lino: 'Flaxseed', gas_natural: 'Natural gas (Henry Hub / TTF)', petroleo_wti: 'WTI crude oil (Texas)', petroleo_brent: 'Brent crude oil', mantequilla: 'Butter', leche_polvo: 'Skim milk powder', colza: 'Rapeseed', centeno: 'Rye', cebada: 'Barley', avena: 'Oats', sorgo: 'Sorghum', maiz: 'Corn', trigo: 'Wheat', arroz: 'Rice', leche: 'Milk', vaca: 'Cattle', cabra: 'Goat', pienso: 'Compound feed', harina_soja: 'Soybean meal', urea: 'Urea', dap: 'DAP (diammonium phosphate)', potasa: 'Potash (MOP)', cerdo: 'Pork', cordero: 'Lamb', huevos: 'Eggs', pollo: 'Chicken', azucar: 'Sugar', oliva: 'Olive oil', diesel: 'Agricultural diesel' },
    fr: { canola_elevador: 'Canola, offre d\'élévateur (Alberta)', trigo_pienso_ab: 'Blé fourrager, offre d\'élévateur (Alberta)', cebada_pienso_ab: 'Orge fourragère, offre d\'élévateur (Alberta)', avena_pienso_ab: 'Avoine fourragère, offre d\'élévateur (Alberta)', trigo_cwrs_ab: 'Blé CWRS, offre d\'élévateur (Alberta)', lenteja_laird_ab: 'Lentilles Laird n° 1, offre au comptant (Alberta)', guisante_verde_ab: 'Pois verts n° 2, offre au comptant (Alberta)', novillo_ab: 'Bouvillons, ventes directes (Alberta)', cerdo_ab: 'Porc (carcasse), prix comptant (Alberta)', soja_grano: 'Soja (grain)', lenteja: 'Lentilles', guisante_seco: 'Pois secs', lino: 'Lin (graines)', gas_natural: 'Gaz naturel (Henry Hub / TTF)', petroleo_wti: 'Pétrole WTI (Texas)', petroleo_brent: 'Pétrole Brent', mantequilla: 'Beurre', leche_polvo: 'Lait écrémé en poudre', colza: 'Colza', centeno: 'Seigle', cebada: 'Orge', avena: 'Avoine', sorgo: 'Sorgho', maiz: 'Maïs', trigo: 'Blé', arroz: 'Riz', leche: 'Lait', vaca: 'Bovins', cabra: 'Chèvre', pienso: 'Aliment composé', harina_soja: 'Tourteau de soja', urea: 'Urée', dap: 'DAP (phosphate diammonique)', potasa: 'Potasse (MOP)', cerdo: 'Porc', cordero: 'Agneau', huevos: 'Œufs', pollo: 'Poulet', azucar: 'Sucre', oliva: "Huile d'olive", diesel: 'Gazole agricole' },
    it: { canola_elevador: 'Canola, offerta elevatore (Alberta)', trigo_pienso_ab: 'Grano da foraggio, offerta elevatore (Alberta)', cebada_pienso_ab: 'Orzo da foraggio, offerta elevatore (Alberta)', avena_pienso_ab: 'Avena da foraggio, offerta elevatore (Alberta)', trigo_cwrs_ab: 'Grano CWRS, offerta elevatore (Alberta)', lenteja_laird_ab: 'Lenticchie Laird n. 1, offerta a pronti (Alberta)', guisante_verde_ab: 'Piselli verdi n. 2, offerta a pronti (Alberta)', novillo_ab: 'Manzi, vendite dirette (Alberta)', cerdo_ab: 'Suini (carcassa), prezzo a pronti (Alberta)', soja_grano: 'Soia in grani', lenteja: 'Lenticchie', guisante_seco: 'Piselli secchi', lino: 'Lino (semi)', gas_natural: 'Gas naturale (Henry Hub / TTF)', petroleo_wti: 'Petrolio WTI (Texas)', petroleo_brent: 'Petrolio Brent', mantequilla: 'Burro', leche_polvo: 'Latte scremato in polvere', colza: 'Colza', centeno: 'Segale', cebada: 'Orzo', avena: 'Avena', sorgo: 'Sorgo', maiz: 'Mais', trigo: 'Grano', arroz: 'Riso', leche: 'Latte', vaca: 'Bovini', cabra: 'Capra', pienso: 'Mangime composto', harina_soja: 'Farina di soia', urea: 'Urea', dap: 'DAP (fosfato diammonico)', potasa: 'Potassa (MOP)', cerdo: 'Maiale', cordero: 'Agnello', huevos: 'Uova', pollo: 'Pollo', azucar: 'Zucchero', oliva: "Olio d'oliva", diesel: 'Gasolio agricolo' }
  };

  var SRC_URL = {
    nass: 'https://www.nass.usda.gov/Charts_and_Maps/Agricultural_Prices/index.php',
    amsDairy: 'https://www.ams.usda.gov/market-news/dairy',
    amsMars: 'https://mymarketnews.ams.usda.gov/',
    ecPrices: 'https://agridata.ec.europa.eu/extensions/DataPortal/prices.html',
    cmeLiveCattle: 'https://www.cmegroup.com/markets/agriculture/livestock/live-cattle.html',
    euronext: 'https://www.euronext.com/en/products/commodities',
    euronextColza: 'https://live.euronext.com/en/product/commodities-futures/ECO-DPAR',
    defraMilk: 'https://www.gov.uk/government/statistics/uk-milk-prices-and-composition-of-milk',
    statcan: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701',
    cmeSoybeanMeal: 'https://www.cmegroup.com/markets/agriculture/oilseeds/soybean-meal',
    dtnFertilizer: 'https://www.dtnpf.com/agriculture/web/ag/crops/article/2026/09/23/fertilizer-prices-rise-six-eight',
    worldBank: 'https://www.worldbank.org/en/research/commodity-markets',
    usdaPork: 'https://www.ams.usda.gov/market-news/daily-pork-reports',
    ecPigmeat: 'https://agridata.ec.europa.eu/extensions/DashboardPigmeat/PigmeatPricesCarcases.html',
    mercolleida: 'https://www.mercolleida.com/es',
    usdaLamb: 'https://www.ams.usda.gov/mnreports/lswlamb.pdf',
    ecSheep: 'https://agridata.ec.europa.eu/extensions/Dataportal/sheep-and-goat-meat.html',
    usdaEggs: 'https://www.ams.usda.gov/market-news/egg-market-news-reports',
    usdaPoultry: 'https://www.ams.usda.gov/market-news/livestock-poultry-grain',
    ecPoultry: 'https://agridata.ec.europa.eu/extensions/DashboardPoultry/PoultryPrices.html',
    ecEggs: 'https://agridata.ec.europa.eu/extensions/DashboardEggs/EggsPrice.html',
    usdaSugar: 'https://www.ers.usda.gov/topics/crops/sugar-and-sweeteners/data',
    ecSugar: 'https://agridata.ec.europa.eu/extensions/DashboardSugar/SugarPrice.html',
    ecOliveOil: 'https://agridata.ec.europa.eu/extensions/DashboardOliveOil/OliveOilPrices.html',
    eia: 'https://www.eia.gov/petroleum/gasdiesel/',
    usdaAgTransportFuel: 'https://agtransport.usda.gov/Fuel/Weekly-On-Highway-Diesel-Fuel-Prices/x88w-atzp',
    euOilBulletin: 'https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en',
    agroseguro: 'https://agroseguro.es/',
    rma: 'https://www.rma.usda.gov/',
    ersCropInsurance: 'https://www.ers.usda.gov/topics/farm-practices-management/risk-management/crop-insurance-at-a-glance',
    mapaCoyuntura: 'https://www.mapa.gob.es/es/estadistica/temas/publicaciones/informe-semanal-coyuntura',
    franceAgriMerVin: 'https://www.franceagrimer.fr/chiffre-et-analyses-economiques/les-marches-la-production-de-vin',
    oemv: 'https://www.oemv.es/informes',
    cmeLumber: 'https://www.cmegroup.com/markets/agriculture/lumber-and-softs/lumber/quotes.html',
    forestResearchTimber: 'https://www.forestresearch.gov.uk/tools-and-resources/statistics/statistics-by-topic/timber-statistics/timber-price-indices/',
    franceBoisForetBois: 'https://franceboisforet.fr/2026/05/26/prix-de-vente-des-bois-sur-pied-en-foret-privee-indicateur-2026/'
  };

  function withSeps(list) {
    return list.map(function (s, i) { return { name: s.name, url: s.url, sep: i < list.length - 1 ? ' · ' : '' }; });
  }

  // Las 11 categorías "de producto" (con precio diario/semanal) más
  // Seguro agrario, Vino a granel y Madera, que son bloques informativos
  // propios (estadísticas oficiales anuales/de campaña reales, sin tarjeta
  // de producto/histórico/calculadora/alertas -- ver isInsurance/isWine/
  // isWood en precios.js).
  var CATS = {
    es: {
      cereales: { label: 'Cereales', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      lacteos: { label: 'Lácteos', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea', url: SRC_URL.ecPrices }, { name: 'Defra (UK)', url: SRC_URL.defraMilk }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      ganado: { label: 'Ganado', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      porcino: { label: 'Porcino', sources: [{ name: 'USDA NASS (cerdo)', url: SRC_URL.nass }, { name: 'Comisión Europea (porcino)', url: SRC_URL.ecPigmeat }, { name: 'Mercolleida', url: SRC_URL.mercolleida }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      ovino: { label: 'Ovino', sources: [{ name: 'USDA AMS (cordero)', url: SRC_URL.usdaLamb }, { name: 'Comisión Europea (ovino)', url: SRC_URL.ecSheep }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      avicultura: { label: 'Avicultura', sources: [{ name: 'USDA NASS (huevo)', url: SRC_URL.nass }, { name: 'USDA NASS (aves)', url: SRC_URL.nass }, { name: 'Comisión Europea (pollo)', url: SRC_URL.ecPoultry }, { name: 'Comisión Europea (huevo)', url: SRC_URL.ecEggs }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      pienso: { label: 'Pienso', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'índices regionales UE', url: SRC_URL.ecPrices }, { name: 'Comisión Europea (oleaginosas)', url: SRC_URL.ecPrices }] },
      fertilizantes: { label: 'Fertilizantes', sources: [{ name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer }, { name: 'referencia internacional (Banco Mundial)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Azúcar', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'Comisión Europea', url: SRC_URL.ecSugar }] },
      aceite: { label: 'Aceite de oliva', sources: [{ name: 'Comisión Europea', url: SRC_URL.ecOliveOil }] },
      energia: { label: 'Energía', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Boletín Semanal del Petróleo (CE)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Seguro agrario', sources: [{ name: 'Agroseguro', url: SRC_URL.agroseguro }, { name: 'USDA RMA', url: SRC_URL.rma }, { name: 'USDA ERS', url: SRC_URL.ersCropInsurance }] },
      vino: { label: 'Vino a granel', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }, { name: 'OeMv', url: SRC_URL.oemv }] },
      madera: { label: 'Madera', sources: [{ name: 'CME Group', url: SRC_URL.cmeLumber }, { name: 'Forest Research (RU)', url: SRC_URL.forestResearchTimber }, { name: 'France Bois Forêt / ONF', url: SRC_URL.franceBoisForetBois }] }
    },
    en: {
      cereales: { label: 'Grains', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      lacteos: { label: 'Dairy', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'European Commission', url: SRC_URL.ecPrices }, { name: 'Defra (UK)', url: SRC_URL.defraMilk }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      ganado: { label: 'Livestock', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'European Commission', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      porcino: { label: 'Pork', sources: [{ name: 'USDA NASS (pork)', url: SRC_URL.nass }, { name: 'European Commission (pigmeat)', url: SRC_URL.ecPigmeat }, { name: 'Mercolleida', url: SRC_URL.mercolleida }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      ovino: { label: 'Sheep & Lamb', sources: [{ name: 'USDA AMS (lamb)', url: SRC_URL.usdaLamb }, { name: 'European Commission (sheep)', url: SRC_URL.ecSheep }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      avicultura: { label: 'Poultry & Eggs', sources: [{ name: 'USDA NASS (eggs)', url: SRC_URL.nass }, { name: 'USDA NASS (poultry)', url: SRC_URL.nass }, { name: 'European Commission (poultry)', url: SRC_URL.ecPoultry }, { name: 'European Commission (eggs)', url: SRC_URL.ecEggs }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      pienso: { label: 'Feed', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'EU regional indices', url: SRC_URL.ecPrices }, { name: 'European Commission (oilseeds)', url: SRC_URL.ecPrices }] },
      fertilizantes: { label: 'Fertilizer', sources: [{ name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer }, { name: 'international reference (World Bank)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Sugar', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'European Commission', url: SRC_URL.ecSugar }] },
      aceite: { label: 'Olive Oil', sources: [{ name: 'European Commission', url: SRC_URL.ecOliveOil }] },
      energia: { label: 'Energy', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Weekly Oil Bulletin (EC)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Crop insurance', sources: [{ name: 'Agroseguro', url: SRC_URL.agroseguro }, { name: 'USDA RMA', url: SRC_URL.rma }, { name: 'USDA ERS', url: SRC_URL.ersCropInsurance }] },
      vino: { label: 'Bulk wine', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }, { name: 'OeMv', url: SRC_URL.oemv }] },
      madera: { label: 'Timber', sources: [{ name: 'CME Group', url: SRC_URL.cmeLumber }, { name: 'Forest Research (UK)', url: SRC_URL.forestResearchTimber }, { name: 'France Bois Forêt / ONF', url: SRC_URL.franceBoisForetBois }] }
    },
    fr: {
      cereales: { label: 'Céréales', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      lacteos: { label: 'Produits laitiers', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Commission européenne', url: SRC_URL.ecPrices }, { name: 'Defra (UK)', url: SRC_URL.defraMilk }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      ganado: { label: 'Bétail', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Commission européenne', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      porcino: { label: 'Porc', sources: [{ name: 'USDA NASS (porc)', url: SRC_URL.nass }, { name: 'Commission européenne (porcin)', url: SRC_URL.ecPigmeat }, { name: 'Mercolleida', url: SRC_URL.mercolleida }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      ovino: { label: 'Ovins', sources: [{ name: 'USDA AMS (agneau)', url: SRC_URL.usdaLamb }, { name: 'Commission européenne (ovins)', url: SRC_URL.ecSheep }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      avicultura: { label: 'Volaille et œufs', sources: [{ name: 'USDA NASS (œufs)', url: SRC_URL.nass }, { name: 'USDA NASS (volaille)', url: SRC_URL.nass }, { name: 'Commission européenne (volaille)', url: SRC_URL.ecPoultry }, { name: 'Commission européenne (œufs)', url: SRC_URL.ecEggs }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      pienso: { label: 'Aliments', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'indices régionaux UE', url: SRC_URL.ecPrices }, { name: 'Commission européenne (oléagineux)', url: SRC_URL.ecPrices }] },
      fertilizantes: { label: 'Engrais', sources: [{ name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer }, { name: 'référence internationale (Banque mondiale)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Sucre', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'Commission européenne', url: SRC_URL.ecSugar }] },
      aceite: { label: "Huile d'olive", sources: [{ name: 'Commission européenne', url: SRC_URL.ecOliveOil }] },
      energia: { label: 'Énergie', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Bulletin pétrolier hebdomadaire (CE)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Assurance agricole', sources: [{ name: 'Agroseguro', url: SRC_URL.agroseguro }, { name: 'USDA RMA', url: SRC_URL.rma }, { name: 'USDA ERS', url: SRC_URL.ersCropInsurance }] },
      vino: { label: 'Vin en vrac', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }, { name: 'OeMv', url: SRC_URL.oemv }] },
      madera: { label: 'Bois', sources: [{ name: 'CME Group', url: SRC_URL.cmeLumber }, { name: 'Forest Research (RU)', url: SRC_URL.forestResearchTimber }, { name: 'France Bois Forêt / ONF', url: SRC_URL.franceBoisForetBois }] }
    },
    it: {
      cereales: { label: 'Cereali', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Comisión Europea (Agri-food)', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      lacteos: { label: 'Lattiero-caseario', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Commissione europea', url: SRC_URL.ecPrices }, { name: 'Defra (UK)', url: SRC_URL.defraMilk }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      ganado: { label: 'Bestiame', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Commissione europea', url: SRC_URL.ecPrices }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      porcino: { label: 'Suini', sources: [{ name: 'USDA NASS (suino)', url: SRC_URL.nass }, { name: 'Commissione europea (suino)', url: SRC_URL.ecPigmeat }, { name: 'Mercolleida', url: SRC_URL.mercolleida }, { name: 'Statistics Canada', url: SRC_URL.statcan }, { name: 'Alberta Agriculture', url: 'https://open.alberta.ca/publications/3479492' }] },
      ovino: { label: 'Ovini', sources: [{ name: 'USDA AMS (agnello)', url: SRC_URL.usdaLamb }, { name: 'Commissione europea (ovini)', url: SRC_URL.ecSheep }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      avicultura: { label: 'Avicoltura', sources: [{ name: 'USDA NASS (uova)', url: SRC_URL.nass }, { name: 'USDA NASS (pollame)', url: SRC_URL.nass }, { name: 'Commissione europea (pollame)', url: SRC_URL.ecPoultry }, { name: 'Commissione europea (uova)', url: SRC_URL.ecEggs }, { name: 'Statistics Canada', url: SRC_URL.statcan }] },
      pienso: { label: 'Mangimi', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'indici regionali UE', url: SRC_URL.ecPrices }, { name: 'Commissione europea (semi oleosi)', url: SRC_URL.ecPrices }] },
      fertilizantes: { label: 'Fertilizzanti', sources: [{ name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer }, { name: 'riferimento internazionale (Banca Mondiale)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Zucchero', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'Commissione europea', url: SRC_URL.ecSugar }] },
      aceite: { label: "Olio d'oliva", sources: [{ name: 'Commissione europea', url: SRC_URL.ecOliveOil }] },
      energia: { label: 'Energia', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Bollettino Petrolifero Settimanale (CE)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Assicurazione agricola', sources: [{ name: 'Agroseguro', url: SRC_URL.agroseguro }, { name: 'USDA RMA', url: SRC_URL.rma }, { name: 'USDA ERS', url: SRC_URL.ersCropInsurance }] },
      vino: { label: 'Vino sfuso', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }, { name: 'OeMv', url: SRC_URL.oemv }] },
      madera: { label: 'Legname', sources: [{ name: 'CME Group', url: SRC_URL.cmeLumber }, { name: 'Forest Research (RU)', url: SRC_URL.forestResearchTimber }, { name: 'France Bois Forêt / ONF', url: SRC_URL.franceBoisForetBois }] }
    }
  };

  var FOOT = {
    es: {
      vaca: 'EE. UU. cotiza en pie; Europa y Reino Unido, en canal (deadweight) — misma unidad de peso, pero no la misma base de medición.',
      cabra: 'Mercado con menor liquidez y bases distintas (en pie vs. canal) — cotización de referencia. La UE no publica precio de caprino por país, así que el selector de país no se aplica a este producto.',
      pienso: 'El precio del pienso varía mucho por lonja local — este es un índice de referencia, no un precio único.',
      harina_soja: 'La cifra europea es la harina de soja en España (media nacional, salida de fábrica, Comisión Europea); la de EE. UU. es la de Iowa (FOB, 46,5-48 % de proteína, USDA AMS) en tonelada corta. No es exactamente el mismo producto ni el mismo punto de venta, así que la comparación es orientativa.',
      cerdo: 'Esta es la referencia de mercado del porcino blanco (comodity) — el cerdo ibérico de bellota de la dehesa cotiza muy por encima y no tiene un índice público propio.',
      cordero: 'EE. UU. cotiza en vivo y Europa en canal — misma unidad de peso, pero no la misma base de medición.',
      azucar: 'El precio de EE. UU. es estructuralmente más alto por su sistema de cuotas de importación, no por una anomalía puntual del mercado.',
      aceite: 'La oferta de EE. UU. (California) es mucho menor y no existe un índice público tan frecuente como en la UE — cifra orientativa. Los precios europeos han sido muy volátiles tras la sequía de 2023-2024. Alemania y Francia no tienen cotización nacional de aceite de oliva (no son países productores): al elegirlos se muestra la referencia europea.',
      diesel: 'El precio mostrado es el del diésel de carretera (on-highway), la referencia pública más completa y frecuente. El gasóleo agrícola sin impuestos ("gasóleo B") suele ser más barato, pero no se publica de forma tan sistemática por región.'
    },
    en: {
      vaca: 'The U.S. quotes live weight, while Europe and the U.K. quote carcass (deadweight) — same unit of weight, but not the same measurement basis.',
      cabra: 'A less liquid market with different bases (live weight vs. carcass) — a reference quote. The EU publishes no goat price by country, so the country selector does not apply to this product.',
      pienso: 'Feed prices vary widely by local market — this is a reference index, not a single price.',
      harina_soja: 'The European figure is Spanish soybean meal (national average, ex-factory, European Commission); the US one is Iowa (FOB, 46.5-48% protein, USDA AMS) per short ton. It is not exactly the same product or delivery point, so the comparison is indicative.',
      cerdo: 'This is the standard (commodity) pork market reference — dehesa-raised, acorn-fed Iberian pork trades well above it and has no public index of its own.',
      cordero: 'The U.S. quotes live weight while Europe quotes carcass weight — same unit of weight, but not the same measurement basis.',
      azucar: 'The U.S. price is structurally higher due to its import quota system, not a one-off market anomaly.',
      aceite: "U.S. supply (California) is much smaller and lacks a public index as frequent as the EU's — an indicative figure only. European prices have been highly volatile since the 2023–2024 drought. Germany and France have no national olive oil quotation (they are not producing countries): selecting them shows the European reference instead.",
      diesel: 'The price shown is on-highway (retail) diesel, the most complete and frequent public benchmark. Untaxed farm/dyed diesel is typically cheaper, but is not published as consistently by region.'
    },
    fr: {
      vaca: "Les États-Unis cotent en poids vif ; l'Europe et le Royaume-Uni, en poids carcasse — même unité de poids, mais pas la même base de mesure.",
      cabra: "Marché moins liquide avec des bases différentes (poids vif vs. carcasse) — cotation de référence. L'UE ne publie pas de prix caprin par pays, le sélecteur de pays ne s'applique donc pas à ce produit.",
      pienso: "Le prix des aliments pour animaux varie fortement selon le marché local — il s'agit d'un indice de référence, pas d'un prix unique.",
      harina_soja: "Le chiffre européen est le tourteau de soja en Espagne (moyenne nationale, départ usine, Commission européenne) ; celui des États-Unis est celui de l'Iowa (FOB, 46,5-48 % de protéines, USDA AMS) en tonne courte. Ce n'est pas exactement le même produit ni le même point de vente : la comparaison est indicative.",
      cerdo: "Il s'agit de la référence de marché du porc blanc (matière première) — le porc ibérique élevé en dehesa et nourri au gland se négocie bien au-dessus et n'a pas d'indice public propre.",
      cordero: "Les États-Unis cotent en poids vif et l'Europe en poids carcasse — même unité de poids, mais pas la même base de mesure.",
      azucar: "Le prix américain est structurellement plus élevé en raison de son système de quotas d'importation, et non d'une anomalie ponctuelle du marché.",
      aceite: "L'offre américaine (Californie) est bien plus faible et il n'existe pas d'indice public aussi fréquent qu'en UE — chiffre indicatif. Les prix européens ont été très volatils depuis la sécheresse de 2023-2024. L'Allemagne et la France n'ont pas de cotation nationale pour l'huile d'olive (ce ne sont pas des pays producteurs) : en les sélectionnant, c'est la référence européenne qui s'affiche.",
      diesel: "Le prix indiqué est celui du gazole routier (à la pompe), la référence publique la plus complète et la plus fréquente. Le gazole agricole détaxé est généralement moins cher, mais n'est pas publié aussi systématiquement par région."
    },
    it: {
      vaca: 'Gli Stati Uniti quotano a peso vivo, mentre l\'Europa e il Regno Unito quotano a peso morto — stessa unità di peso, ma non la stessa base di misurazione.',
      cabra: 'Mercato con minore liquidità e basi diverse (peso vivo vs. peso morto) — quotazione di riferimento. L\'UE non pubblica un prezzo caprino per paese, quindi il selettore di paese non si applica a questo prodotto.',
      pienso: 'Il prezzo del mangime varia molto per mercato locale — questo è un indice di riferimento, non un prezzo unico.',
      harina_soja: 'La cifra europea è la farina di soia in Spagna (media nazionale, franco fabbrica, Commissione europea); quella degli Stati Uniti è quella dell\'Iowa (FOB, 46,5-48 % di proteine, USDA AMS) per tonnellata corta. Non è esattamente lo stesso prodotto né lo stesso punto di vendita: il confronto è indicativo.',
      cerdo: 'Questo è il riferimento di mercato del suino bianco (commodity) — il maiale iberico allevato allo stato brado e nutrito con ghiande quota molto al di sopra e non ha un indice pubblico proprio.',
      cordero: 'Gli Stati Uniti quotano a peso vivo mentre l\'Europa quota a peso morto — stessa unità di peso, ma non la stessa base di misurazione.',
      azucar: 'Il prezzo statunitense è strutturalmente più alto a causa del suo sistema di quote di importazione, non per un\'anomalia puntuale del mercato.',
      aceite: 'L\'offerta statunitense (California) è molto minore e non esiste un indice pubblico frequente come nell\'UE — cifra indicativa. I prezzi europei sono stati molto volatili dopo la siccità del 2023-2024. Germania e Francia non hanno una quotazione nazionale dell\'olio d\'oliva (non sono paesi produttori): selezionandole viene mostrato il riferimento europeo.',
      diesel: 'Il prezzo mostrato è quello del gasolio stradale (alla pompa), il riferimento pubblico più completo e frequente. Il gasolio agricolo agevolato è generalmente più economico, ma non viene pubblicato in modo altrettanto sistematico per regione.'
    }
  };

  // --- Seguro agrario, Vino a granel y Madera: bloques informativos propios
  // con estadísticas oficiales reales (no precios de mercado diarios/
  // semanales que convertir de moneda/unidad), verbatim del artefacto
  // original -- ver isInsurance/isWine/isWood en precios.js. ------------
  var INSURANCE = {
    es: {
      badge: 'DATOS OFICIALES REALES',
      esTitle: 'España — Agroseguro (ejercicio 2025)',
      usTitle: 'EE. UU. — USDA RMA (año agrícola 2024)',
      esStats: [
        { label: 'Primas totales', value: '1.029 M€' },
        { label: 'Superficie asegurada', value: '6,2 M ha' },
        { label: 'Indemnizaciones pagadas', value: '804 M€' },
        { label: 'Subvención pública', value: '≈50% de la prima' }
      ],
      usStats: [
        { label: 'Superficie asegurada (net acres)', value: '543 M acres' },
        { label: 'Capital asegurado (liability)', value: '>192.000 M$' },
        { label: 'Subvención pública', value: '10.400 M$' },
        { label: 'Participación (8 cultivos principales)', value: '≈89%' }
      ],
      scopeNote: 'Cifras oficiales de cada organismo, no datos de muestra — pero los dos sistemas no cubren exactamente lo mismo: las de España incluyen todas las líneas de Agroseguro (agrícola, ganadero y forestal) del ejercicio 2025; las de EE. UU. son específicas del seguro de cosechas (crop insurance) de la USDA RMA, año agrícola 2024. Sirven como referencia de magnitud, no como comparación exacta.'
    },
    en: {
      badge: 'REAL OFFICIAL DATA',
      esTitle: 'Spain — Agroseguro (2025)',
      usTitle: 'U.S. — USDA RMA (2024 crop year)',
      esStats: [
        { label: 'Total premiums', value: '€1,029 M' },
        { label: 'Insured area', value: '6.2 M ha' },
        { label: 'Indemnities paid', value: '€804 M' },
        { label: 'Public subsidy', value: '≈50% of premium' }
      ],
      usStats: [
        { label: 'Insured area (net acres)', value: '543 M acres' },
        { label: 'Insured liability', value: '>$192,000 M' },
        { label: 'Public subsidy', value: '$10,400 M' },
        { label: 'Participation (8 major crops)', value: '≈89%' }
      ],
      scopeNote: "Official figures from each agency, not sample data — but the two systems don't cover exactly the same scope: Spain's figures include all Agroseguro lines (crop, livestock and forestry) for 2025, while the U.S. figures are specific to USDA RMA's federal crop insurance, 2024 crop year. Treat this as a rough sense of scale, not an exact comparison."
    },
    fr: {
      badge: 'DONNÉES OFFICIELLES RÉELLES',
      esTitle: 'Espagne — Agroseguro (exercice 2025)',
      usTitle: 'États-Unis — USDA RMA (campagne 2024)',
      esStats: [
        { label: 'Primes totales', value: '1 029 M€' },
        { label: 'Surface assurée', value: '6,2 M ha' },
        { label: 'Indemnités versées', value: '804 M€' },
        { label: 'Subvention publique', value: '≈50 % de la prime' }
      ],
      usStats: [
        { label: 'Surface assurée (net acres)', value: '543 M acres' },
        { label: 'Capital assuré (liability)', value: '>192 000 M$' },
        { label: 'Subvention publique', value: '10 400 M$' },
        { label: 'Participation (8 cultures principales)', value: '≈89 %' }
      ],
      scopeNote: "Chiffres officiels de chaque organisme, pas des données fictives — mais les deux systèmes ne couvrent pas exactement le même périmètre : ceux de l'Espagne incluent toutes les lignes d'Agroseguro (agricole, élevage et forêt) pour 2025, tandis que ceux des États-Unis concernent spécifiquement l'assurance récolte (crop insurance) de l'USDA RMA, campagne 2024. À prendre comme un ordre de grandeur, pas une comparaison exacte."
    },
    it: {
      badge: 'DATI UFFICIALI REALI',
      esTitle: 'Spagna — Agroseguro (esercizio 2025)',
      usTitle: 'Stati Uniti — USDA RMA (anno agricolo 2024)',
      esStats: [
        { label: 'Premi totali', value: '1.029 M€' },
        { label: 'Superficie assicurata', value: '6,2 M ha' },
        { label: 'Indennizzi pagati', value: '804 M€' },
        { label: 'Sovvenzione pubblica', value: '≈50% del premio' }
      ],
      usStats: [
        { label: 'Superficie assicurata (net acres)', value: '543 M acri' },
        { label: 'Capitale assicurato (liability)', value: '>192.000 M$' },
        { label: 'Sovvenzione pubblica', value: '10.400 M$' },
        { label: 'Partecipazione (8 colture principali)', value: '≈89%' }
      ],
      scopeNote: 'Cifre ufficiali di ciascun ente, non dati campione — ma i due sistemi non coprono esattamente lo stesso ambito: quelle della Spagna includono tutte le linee di Agroseguro (agricola, zootecnica e forestale) per l\'esercizio 2025, mentre quelle statunitensi riguardano specificamente l\'assicurazione raccolto (crop insurance) dell\'USDA RMA, anno agricolo 2024. Da considerare come un ordine di grandezza, non un confronto esatto.'
    }
  };

  var WINE = {
    es: {
      badge: 'DATOS OFICIALES REALES',
      esTitle: 'España — MAPA (semana 37, 7–13 sept. 2026)',
      frTitle: 'Francia — FranceAgriMer (semana 31, campaña 2025/26)',
      esStats: [
        { label: 'Blanco sin DOP/IGP', value: '42,45 €/hl' },
        { label: 'Tinto sin DOP/IGP (12° color)', value: '47,86 €/hl' },
        { label: 'Variación semanal (blanco)', value: '−1,96%' },
        { label: 'Variación semanal (tinto)', value: '−0,33%' }
      ],
      frStats: [
        { label: 'Blanc (Vin de France)', value: '98,00 €/hl' },
        { label: 'Rouge (Vin de France)', value: '97,92 €/hl' },
        { label: 'Variación interanual (blanco)', value: '−2,8%' },
        { label: 'Variación interanual (tinto)', value: '+0,9%' }
      ],
      scopeNote: 'Cifras oficiales de cada organismo, no datos de muestra — pero no son directamente comparables en cadencia: las de España son el precio medio semanal del MAPA para vino sin DOP/IGP; las de Francia son el precio medio de la campaña 2025/26 hasta la semana 31 para "Vin de France" con mención de variedad (FranceAgriMer), frente a la campaña 2024/25. Aun así, la diferencia de nivel es real y llamativa: el vino francés se paga en torno al doble que el español en estos mercados. El Observatorio Español del Mercado del Vino (OeMv) publica análisis más detallados de este mercado en España, y no existe un mercado de vino a granel centralizado y comparable en EE. UU. — por eso esta categoría compara España y Francia en vez del habitual EE. UU./Europa del resto del panel.'
    },
    en: {
      badge: 'REAL OFFICIAL DATA',
      esTitle: 'Spain — MAPA (week 37, Sep 7–13, 2026)',
      frTitle: 'France — FranceAgriMer (week 31, 2025/26 campaign)',
      esStats: [
        { label: 'White, no PDO/PGI', value: '€42.45/hL' },
        { label: 'Red, no PDO/PGI (12° color)', value: '€47.86/hL' },
        { label: 'Week-over-week (white)', value: '−1.96%' },
        { label: 'Week-over-week (red)', value: '−0.33%' }
      ],
      frStats: [
        { label: 'White (Vin de France)', value: '€98.00/hL' },
        { label: 'Red (Vin de France)', value: '€97.92/hL' },
        { label: 'Year-over-year (white)', value: '−2.8%' },
        { label: 'Year-over-year (red)', value: '+0.9%' }
      ],
      scopeNote: "Official figures from each agency, not sample data — but not directly comparable in cadence: Spain's is MAPA's weekly average price for wine without a PDO/PGI designation; France's is the 2025/26 campaign-to-date average (through week 31) for 'Vin de France' with a stated grape variety (FranceAgriMer), versus the 2024/25 campaign. Even so, the gap in level is real and striking: French bulk wine trades at roughly double the Spanish price in these markets. Spain's own Observatorio Español del Mercado del Vino (OeMv) publishes more detailed analysis of this market, and there's no centralized, comparable bulk-wine market in the U.S. — which is why this category compares Spain and France instead of the usual U.S./Europe split used elsewhere on this dashboard."
    },
    fr: {
      badge: 'DONNÉES OFFICIELLES RÉELLES',
      esTitle: 'Espagne — MAPA (semaine 37, 7–13 sept. 2026)',
      frTitle: 'France — FranceAgriMer (semaine 31, campagne 2025/26)',
      esStats: [
        { label: 'Blanc sans AOP/IGP', value: '42,45 €/hl' },
        { label: 'Rouge sans AOP/IGP (12° couleur)', value: '47,86 €/hl' },
        { label: 'Variation hebdomadaire (blanc)', value: '−1,96 %' },
        { label: 'Variation hebdomadaire (rouge)', value: '−0,33 %' }
      ],
      frStats: [
        { label: 'Blanc (Vin de France)', value: '98,00 €/hl' },
        { label: 'Rouge (Vin de France)', value: '97,92 €/hl' },
        { label: 'Variation sur un an (blanc)', value: '−2,8 %' },
        { label: 'Variation sur un an (rouge)', value: '+0,9 %' }
      ],
      scopeNote: "Chiffres officiels de chaque organisme, pas des données fictives — mais pas directement comparables en fréquence : ceux de l'Espagne sont le prix moyen hebdomadaire du MAPA pour un vin sans AOP/IGP ; ceux de la France sont le prix moyen de la campagne 2025/26 à la semaine 31 pour un « Vin de France » avec mention de cépage (FranceAgriMer), comparé à la campagne 2024/25. L'écart de niveau reste réel et frappant : le vin français en vrac se négocie à environ le double du prix espagnol sur ces marchés. L'Observatoire espagnol du marché du vin (OeMv) publie des analyses plus détaillées de ce marché en Espagne, et il n'existe pas de marché du vrac centralisé et comparable aux États-Unis, d'où cette comparaison Espagne/France plutôt que le duo habituel États-Unis/Europe du reste du tableau de bord."
    },
    it: {
      badge: 'DATI UFFICIALI REALI',
      esTitle: 'Spagna — MAPA (settimana 37, 7–13 sett. 2026)',
      frTitle: 'Francia — FranceAgriMer (settimana 31, campagna 2025/26)',
      esStats: [
        { label: 'Bianco senza DOP/IGP', value: '42,45 €/hl' },
        { label: 'Rosso senza DOP/IGP (12° colore)', value: '47,86 €/hl' },
        { label: 'Variazione settimanale (bianco)', value: '−1,96%' },
        { label: 'Variazione settimanale (rosso)', value: '−0,33%' }
      ],
      frStats: [
        { label: 'Bianco (Vin de France)', value: '98,00 €/hl' },
        { label: 'Rosso (Vin de France)', value: '97,92 €/hl' },
        { label: 'Variazione annua (bianco)', value: '−2,8%' },
        { label: 'Variazione annua (rosso)', value: '+0,9%' }
      ],
      scopeNote: "Cifre ufficiali di ciascun ente, non dati campione — ma non direttamente comparabili per cadenza: quelle della Spagna sono il prezzo medio settimanale del MAPA per il vino senza DOP/IGP; quelle della Francia sono il prezzo medio della campagna 2025/26 alla settimana 31 per il \"Vin de France\" con menzione del vitigno (FranceAgriMer), rispetto alla campagna 2024/25. Il divario di livello resta comunque reale e marcato: il vino sfuso francese si scambia a circa il doppio del prezzo spagnolo su questi mercati. L'Osservatorio spagnolo del mercato del vino (OeMv) pubblica analisi più dettagliate di questo mercato in Spagna, e non esiste un mercato del vino sfuso centralizzato e comparabile negli USA — per questo la categoria confronta Spagna e Francia invece della consueta coppia USA/Europa usata nel resto del pannello."
    }
  };

  var WOOD = {
    es: {
      badge: 'DATOS OFICIALES REALES',
      usTitle: 'EE. UU. — CME Group (25 sep 2026)',
      ukTitle: 'Reino Unido — Forest Research (dato trimestral, marzo 2026)',
      frTitle: 'Francia — France Bois Forêt / ONF (campaña 2025)',
      usStats: [
        { label: 'Futuro de madera de construcción (framing lumber)', value: '538,00 $/1.000 pies tabla' },
        { label: 'Variación diaria', value: '+0,19%' },
        { label: 'Mercado', value: 'CME Group, contrato de vencimiento más próximo' }
      ],
      ukStats: [
        { label: 'Índice de venta en pie, coníferas', value: '35,17 £/m³' },
        { label: 'Variación interanual', value: '+12,9%' },
        { label: 'Qué mide', value: 'Madera en pie sin talar, no aserrada' }
      ],
      frStats: [
        { label: 'Media todas las especies', value: '86 €/m³' },
        { label: 'Coníferas — Épicéa commun', value: '69 €/m³' },
        { label: 'Frondosas — Roble (Chêne)', value: '190 €/m³' },
        { label: 'Variación (media todas las especies)', value: '−4% vs. 2024' }
      ],
      scopeNote: 'Tres mercados nacionales reales, no una única referencia global como con otros productos — la madera no tiene un mercado internacional centralizado y líquido como el trigo o el maíz. Los tres datos son oficiales, pero no son comparables entre sí en cadencia ni en la fase del producto: el de EE. UU. es el precio diario del futuro de madera aserrada de construcción (framing lumber) del CME Group; el de Reino Unido es el índice trimestral de venta en pie de coníferas de Forest Research (madera sin aserrar, todavía en el bosque); y el de Francia es la media anual de venta en pie por especie de France Bois Forêt/ONF (campaña 2025, la más reciente publicada). Alemania, España e Italia quedan fuera de este primer núcleo: Alemania solo publica un índice oficial (Destatis), sin cifra en euros; España solo tiene datos regionales desactualizados (Castilla y León, 2020); e Italia no tiene una fuente nacional citable. Se añadirán si aparece una fuente mejor, siguiendo la misma convención de huecos honestos que el resto del panel.'
    },
    en: {
      badge: 'REAL OFFICIAL DATA',
      usTitle: 'U.S. — CME Group (Sep 25, 2026)',
      ukTitle: 'United Kingdom — Forest Research (quarterly data, March 2026)',
      frTitle: 'France — France Bois Forêt / ONF (2025 season)',
      usStats: [
        { label: 'Framing lumber futures', value: '$538.00/1,000 board feet' },
        { label: 'Daily change', value: '+0.19%' },
        { label: 'Market', value: 'CME Group, nearest-expiry contract' }
      ],
      ukStats: [
        { label: 'Coniferous standing sales price index', value: '£35.17/m³' },
        { label: 'Year-over-year change', value: '+12.9%' },
        { label: 'What it measures', value: 'Standing (unfelled) timber, not sawn' }
      ],
      frStats: [
        { label: 'All-species average', value: '€86/m³' },
        { label: 'Conifers — Common spruce', value: '€69/m³' },
        { label: 'Broadleaves — Oak', value: '€190/m³' },
        { label: 'Change (all-species average)', value: '−4% vs. 2024' }
      ],
      scopeNote: "Three real national markets, not a single global reference like other products — timber has no centralized, liquid international market the way wheat or corn does. All three figures are official, but they aren't directly comparable in cadence or product stage: the U.S. figure is CME Group's daily framing-lumber futures price; the U.K. figure is Forest Research's quarterly coniferous standing-sales price index (unfelled timber, still in the forest); and the France figure is France Bois Forêt/ONF's annual average standing-sale price by species (2025 season, the latest published). Germany, Spain and Italy are left out of this first core: Germany only publishes an official index (Destatis), with no euro figure; Spain only has outdated regional data (Castilla y León, 2020); and Italy has no citable national source. They'll be added if a better source turns up, following the same honest-gap convention used elsewhere on this dashboard."
    },
    fr: {
      badge: 'DONNÉES OFFICIELLES RÉELLES',
      usTitle: 'États-Unis — CME Group (25 sept. 2026)',
      ukTitle: 'Royaume-Uni — Forest Research (donnée trimestrielle, mars 2026)',
      frTitle: 'France — France Bois Forêt / ONF (campagne 2025)',
      usStats: [
        { label: 'Contrat à terme bois de construction (framing lumber)', value: '538,00 $/1 000 board feet' },
        { label: 'Variation journalière', value: '+0,19 %' },
        { label: 'Marché', value: 'CME Group, contrat à échéance la plus proche' }
      ],
      ukStats: [
        { label: 'Indice de prix de vente sur pied, résineux', value: '35,17 £/m³' },
        { label: 'Variation sur un an', value: '+12,9 %' },
        { label: 'Ce que ça mesure', value: 'Bois sur pied, non abattu, non scié' }
      ],
      frStats: [
        { label: 'Moyenne toutes essences', value: '86 €/m³' },
        { label: 'Résineux — Épicéa commun', value: '69 €/m³' },
        { label: 'Feuillus — Chêne', value: '190 €/m³' },
        { label: 'Variation (moyenne toutes essences)', value: '−4 % vs. 2024' }
      ],
      scopeNote: "Trois marchés nationaux réels, pas une référence mondiale unique comme pour d'autres produits — le bois n'a pas de marché international centralisé et liquide comme le blé ou le maïs. Les trois chiffres sont officiels, mais pas directement comparables en fréquence ni en stade du produit : celui des États-Unis est le prix quotidien du contrat à terme sur le bois de construction (framing lumber) du CME Group ; celui du Royaume-Uni est l'indice trimestriel de prix de vente sur pied des résineux de Forest Research (bois non abattu, encore en forêt) ; et celui de la France est le prix moyen annuel de vente sur pied par essence de France Bois Forêt/ONF (campagne 2025, la plus récente publiée). L'Allemagne, l'Espagne et l'Italie restent hors de ce premier socle : l'Allemagne ne publie qu'un indice officiel (Destatis), sans chiffre en euros ; l'Espagne n'a que des données régionales obsolètes (Castille-et-León, 2020) ; et l'Italie n'a pas de source nationale citable. Elles seront ajoutées si une meilleure source apparaît, selon la même convention de lacunes honnêtes que le reste du tableau de bord."
    },
    it: {
      badge: 'DATI UFFICIALI REALI',
      usTitle: 'Stati Uniti — CME Group (25 sett. 2026)',
      ukTitle: 'Regno Unito — Forest Research (dato trimestrale, marzo 2026)',
      frTitle: 'Francia — France Bois Forêt / ONF (campagna 2025)',
      usStats: [
        { label: 'Futures sul legname da costruzione (framing lumber)', value: '538,00 $/1.000 board feet' },
        { label: 'Variazione giornaliera', value: '+0,19%' },
        { label: 'Mercato', value: 'CME Group, contratto con scadenza più vicina' }
      ],
      ukStats: [
        { label: 'Indice prezzo vendita in piedi, conifere', value: '35,17 £/m³' },
        { label: 'Variazione annua', value: '+12,9%' },
        { label: 'Cosa misura', value: 'Legname in piedi, non abbattuto né segato' }
      ],
      frStats: [
        { label: 'Media tutte le specie', value: '86 €/m³' },
        { label: 'Conifere — Abete rosso comune', value: '69 €/m³' },
        { label: 'Latifoglie — Quercia', value: '190 €/m³' },
        { label: 'Variazione (media tutte le specie)', value: '−4% vs. 2024' }
      ],
      scopeNote: "Tre mercati nazionali reali, non un unico riferimento globale come per altri prodotti — il legname non ha un mercato internazionale centralizzato e liquido come il grano o il mais. Le tre cifre sono ufficiali, ma non direttamente comparabili per cadenza né per fase del prodotto: quella statunitense è il prezzo giornaliero del future sul legname da costruzione (framing lumber) del CME Group; quella britannica è l'indice trimestrale del prezzo di vendita in piedi delle conifere di Forest Research (legname non abbattuto, ancora nel bosco); quella francese è il prezzo medio annuo di vendita in piedi per specie di France Bois Forêt/ONF (campagna 2025, l'ultima pubblicata). Germania, Spagna e Italia restano fuori da questo primo nucleo: la Germania pubblica solo un indice ufficiale (Destatis), senza cifra in euro; la Spagna ha solo dati regionali non aggiornati (Castiglia e León, 2020); e l'Italia non ha una fonte nazionale citabile. Verranno aggiunte se emergerà una fonte migliore, seguendo la stessa convenzione di lacune oneste usata nel resto del pannello."
    }
  };

  // --- Base de datos de productos (RAW), verbatim del artefacto original ---
  var RAW = [
    {
      id: 'cereales', nameKey: 'cereales',
      products: [
        { nameKey: 'maiz', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 25.401, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 4.45, changePct: 4.46, history: [4.12, 4.27, 4.31, 4.48, 4.28, 4.26, 4.45], currency: 'USD', kgPerUnit: 25.401 },
          eu: { price: 259, changePct: -0.3846, history: [235, 237, 247, 254, 254, 244, 244, 248, 250, 263, 260, 259], currency: 'EUR', kgPerUnit: 1000 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (maíz pienso, mercado de Zaragoza, salida de silo)' } } },
        { nameKey: 'trigo', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 27.2155, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 6.23, changePct: 2.81, history: [5.15, 5.52, 5.7, 5.88, 5.7, 6.06, 6.23], currency: 'USD', kgPerUnit: 27.2155 },
          eu: { price: 262.7, changePct: 0.1525, history: [230.6, 231.75, 240.65, 254.3, 258.67, 246, 245.6, 247.2, 254.89, 258, 262.3, 262.7], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 215.00, changePct: -0.3, history: [217.80, 217.20, 216.60, 216.10, 215.90, 215.65, 215.00], currency: 'GBP', kgPerUnit: 1000 },
          countryFactors: { es: 1, fr: 0.908, de: 0.917, it: 0.967 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (trigo panificable, mercado de Zaragoza, salida de silo)' }, uk: { type: 'futuro', market: 'AHDB (trigo pienso, entrega nov. 2026)' } } },
        { nameKey: 'arroz', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 12.8, changePct: 8.47, history: [12.3, 11.7, 11.3, 11.4, 11.8, 11.8, 12.8], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 451.68, changePct: 0, history: [451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 451.68, 451.68], currency: 'EUR', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (arroz cáscara japónica, España)' } } },
        // Cebada y avena: EE. UU. (USDA NASS, precio recibido) y Europa (Comisión Europea). Las cifras de muestra las sustituyen los scripts con datos reales
        { nameKey: 'cebada', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 21.7724, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 5.55, changePct: 0.73, history: [5.47, 5.5, 5.58, 5.35, 5.47, 5.51, 5.55], currency: 'USD', kgPerUnit: 21.7724 },
          eu: { price: 235, changePct: 0.8584, history: [205, 207, 215, 227, 225, 225, 222, 225, 228, 228, 233, 235], currency: 'EUR', kgPerUnit: 1000 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (cebada pienso, mercado de Lleida, salida de silo)' } } },
        { nameKey: 'avena', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'bushel', imperialKgPerUnit: 14.515, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 3.02, changePct: -2.58, history: [3.08, 3.18, 3.17, 3.21, 3.25, 3.1, 3.02], currency: 'USD', kgPerUnit: 14.515 },
          eu: { price: 149.57, changePct: 3.1588, history: [162.42, 154.77, 164.44, 153.01, 152.25, 148.03, 141.28, 144.51, 142.03, 163.35, 144.99, 149.57], currency: 'EUR', kgPerUnit: 1000 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'referencia', market: 'Comisión Europea (avena pienso, agregado UE)' } } },
        // Colza: EE. UU. (USDA NASS, canola) y Europa; centeno: solo Europa (NASS dejó de publicarlo en 1976) (Comisión Europea)
        { nameKey: 'colza', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 25.7, changePct: -3.38, history: [20.9, 22.5, 22.6, 27.5, 27.7, 26.6, 25.7], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 476.36, changePct: 0.0693, history: [444.78, 440.1, 441.8, 442.09, 443.13, 442.19, 443.48, 443.14, 443.98, 437.35, 476.03, 476.36], currency: 'EUR', kgPerUnit: 1000 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (canola)' }, eu: { type: 'referencia', market: 'Comisión Europea (colza, España, media nacional)' } } },
        { nameKey: 'centeno', imperialUnitKey: 'bushel', imperialKgPerUnit: 25.401, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          eu: { price: 170.89, changePct: -6.0683, history: [174.26, 177.97, 173.61, 166.62, 176.37, 173.91, 174.33, 182.62, 177.24, 182.95, 181.93, 170.89], currency: 'EUR', kgPerUnit: 1000 },
          quoteTypes: { eu: { type: 'referencia', market: 'Comisión Europea (centeno panificable, agregado UE)' } } },
        { nameKey: 'soja_grano', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' } } },
        { nameKey: 'lenteja', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' } } },
        { nameKey: 'guisante_seco', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' } } },
        { nameKey: 'lino', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' } } },
        // Sorgo: solo hay dato en EE. UU. (USDA NASS). El portal de la Comisión Europea no publica precio de sorgo, así que no hay región `eu`
        { nameKey: 'sorgo', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 7.7, changePct: -3.99, history: [6.46, 6.94, 6.73, 7.5, 7.95, 8.02, 7.7], currency: 'USD', kgPerUnit: 45.359 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS' } } },
        { nameKey: 'canola_elevador', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'trigo_pienso_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'cebada_pienso_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'avena_pienso_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'trigo_cwrs_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'lenteja_laird_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } },
        { nameKey: 'guisante_verde_ab', caUnitKey: 'tonelada', caKgPerUnit: 1000, imperialUnitKey: 'tonelada', imperialKgPerUnit: 1000, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1000 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } }
      ]
    },
    {
      id: 'lacteos', nameKey: 'lacteos',
      products: [
        { nameKey: 'leche', caUnitKey: '100kg', caKgPerUnit: 100, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 19.8, changePct: -2.46, history: [18.3, 19.7, 20.8, 21.3, 21.1, 20.3, 19.8], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 45.53, changePct: 1.0655, history: [51.36, 51.94, 52.62, 52.62, 52.52, 52.23, 51.84, 47.48, 46.31, 45.53, 45.05, 45.53], currency: 'EUR', kgPerUnit: 100 },
          countryFactors: { es: 1, de: 0.904, fr: 0.979, it: 1.016 },
          uk: { price: 35.82, changePct: 4.02, history: [34.20, 34.50, 34.80, 35.10, 35.35, 35.60, 35.82], currency: 'GBP', kgPerUnit: 100 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 100 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, leche total)' }, eu: { type: 'referencia', market: 'Comisión Europea (leche cruda de vaca, España)' }, uk: { type: 'referencia', market: 'Defra (precio medio en granja del Reino Unido)' } } },
        // Mantequilla y leche desnatada en polvo: solo dato de Europa (agregado UE de la Comisión). Las cifras de muestra las sustituye el script con datos reales
        { nameKey: 'mantequilla', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: '100kg', metricKgPerUnit: 100,
          eu: { price: 416.42, changePct: -0.8665, history: [383.31, 386.98, 396.1, 399.52, 409.9, 394.24, 397.79, 403.61, 413.82, 410.77, 420.06, 416.42], currency: 'EUR', kgPerUnit: 100 },
          quoteTypes: { eu: { type: 'referencia', market: 'Comisión Europea (mantequilla, agregado UE)' } } },
        { nameKey: 'leche_polvo', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 2.03, changePct: 6.56, history: [1.7, 1.635, 1.585, 1.51, 1.53, 1.575, 1.75, 1.76, 1.84, 1.87, 1.905, 2.03], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 308.73, changePct: 0.1752, history: [268.92, 270.22, 273.78, 277.62, 280.68, 280.74, 289, 291.39, 301.62, 306.09, 308.19, 308.73], currency: 'EUR', kgPerUnit: 100 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (leche desnatada en polvo, Este y Centro, calor bajo/medio, punto medio del rango)' }, eu: { type: 'referencia', market: 'Comisión Europea (leche desnatada en polvo, agregado UE)' } } }
      ]
    },
    {
      id: 'ganado', nameKey: 'ganado',
      products: [
        { nameKey: 'vaca', caUnitKey: 'cwt', caKgPerUnit: 45.359, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 234, changePct: -6.02, history: [243, 240, 245, 256, 258, 249, 234], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 614.67, changePct: 0.7309, history: [624.07, 614.52, 608.54, 600.3, 592.41, 616.07, 611.57, 612.58, 612.58, 605.95, 610.21, 614.67], currency: 'EUR', kgPerUnit: 100 },
          footnoteKey: 'vaca',
          countryFactors: { es: 1, de: 1.062, fr: 1.015, it: 1.087 },
          uk: { price: 620.00, changePct: 0.4, history: [610, 612, 614, 616, 618, 619, 620], currency: 'GBP', kgPerUnit: 100 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 45.359 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, novillos y novillas, peso vivo)' }, eu: { type: 'referencia', market: 'Comisión Europea (vacuno, España, machos jóvenes A-R3)' }, uk: { type: 'referencia', market: 'AHDB (GB deadweight, todas las categorías prime)' } } },
        { nameKey: 'cabra', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'kg', metricKgPerUnit: 1,
          us: { price: 2.15, changePct: 0.5, history: [2.05, 2.08, 2.10, 2.09, 2.12, 2.14, 2.15], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 6.85, changePct: 0.4, history: [6.60, 6.65, 6.70, 6.75, 6.78, 6.82, 6.85], currency: 'EUR', kgPerUnit: 1 },
          footnoteKey: 'cabra' },
        { nameKey: 'novillo_ab', caUnitKey: 'cwt', caKgPerUnit: 45.359, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'cwt', metricKgPerUnit: 45.359,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 45.359 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } }
      ]
    },
    {
      id: 'porcino', nameKey: 'porcino',
      products: [
        { nameKey: 'cerdo', caUnitKey: 'cwt', caKgPerUnit: 45.359, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 70.5, changePct: -0.7, history: [65.9, 68.7, 67.8, 68.5, 69.4, 71, 70.5], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 178.56, changePct: 0.5179, history: [172.71, 171.67, 170.59, 173.62, 168.63, 166.33, 169.1, 172.57, 175.96, 178.08, 177.64, 178.56], currency: 'EUR', kgPerUnit: 100 },
          uk: { price: 180.84, changePct: 0.2, history: [179.20, 179.50, 179.80, 180.10, 180.30, 180.40, 180.84], currency: 'GBP', kgPerUnit: 100 },
          footnoteKey: 'cerdo',
          countryFactors: { es: 1, de: 0.911, fr: 1.193, it: 1.353 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 45.359 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, cerdos vivos)' }, eu: { type: 'referencia', market: 'Comisión Europea (porcino, España, clase S)' }, uk: { type: 'referencia', market: 'AHDB (SPP, especificación UE, GB)' } } },
        { nameKey: 'cerdo_ab', caUnitKey: 'kg', caKgPerUnit: 1, imperialUnitKey: 'kg', imperialKgPerUnit: 1, metricUnitKey: 'kg', metricKgPerUnit: 1,
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1 },
          quoteTypes: { ca: { type: 'referencia', market: 'Alberta Agriculture and Irrigation (Weekly Market Review)' } } }
      ]
    },
    {
      id: 'ovino', nameKey: 'ovino',
      products: [
        { nameKey: 'cordero', caUnitKey: 'cwt', caKgPerUnit: 45.359, imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 232, changePct: 0.5, history: [218, 222, 225, 228, 230, 231, 232], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 1011.8, changePct: 0.8673, history: [1003, 973.4, 944.2, 932.7, 933, 951.2, 956.8, 970.5, 1007.3, 1008, 1003.1, 1011.8], currency: 'EUR', kgPerUnit: 100 },
          uk: { price: 724.00, changePct: 1.5, history: [705, 710, 714, 717, 719, 721, 724], currency: 'GBP', kgPerUnit: 100 },
          footnoteKey: 'cordero',
          countryFactors: { es: 1, de: 0.965, fr: 0.9, it: 0.815 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 45.359 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA AMS (cordero)' }, eu: { type: 'referencia', market: 'Comisión Europea (ovino, España, cordero pesado)' }, uk: { type: 'referencia', market: 'AHDB (GB deadweight, cordero NSL)' } } }
      ]
    },
    {
      id: 'avicultura', nameKey: 'avicultura',
      products: [
        // huevos: docena EE. UU. = 0,6804 kg (huevo grande, mínimo USDA de 24 oz/docena) para comparar con la UE en €/100 kg; es una aproximación por tamaño, no un peso medio real
        { nameKey: 'huevos', caUnitKey: 'docena', caKgPerUnit: 0.6804, imperialUnitKey: 'docena', imperialKgPerUnit: 0.6804, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 0.77, changePct: -1.79, history: [0.98, 1.26, 0.56, 0.56, 0.53, 0.78, 0.77], currency: 'USD', kgPerUnit: 0.6804 },
          eu: { price: 242.27, changePct: 1.3173, history: [218.69, 218.69, 218.43, 205.63, 205.91, 205.91, 205.91, 207.22, 209.55, 230.04, 239.12, 242.27], currency: 'EUR', kgPerUnit: 100 },
          countryFactors: { es: 1, de: 0.907, fr: 1.088, it: 1.243 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 0.6804 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, huevos de mesa)' }, eu: { type: 'referencia', market: 'Comisión Europea (huevos, España, gallinas en jaula)' } } },
        { nameKey: 'pollo', caUnitKey: 'kg', caKgPerUnit: 1, imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'kg', metricKgPerUnit: 1,
          us: { price: 0.65, changePct: -1.36, history: [0.66, 0.67, 0.68, 0.71, 0.7, 0.66, 0.65], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 2.3507, changePct: 0.034, history: [2.274, 2.2764, 2.2357, 2.2321, 2.2321, 2.2263, 2.239, 2.2644, 2.2764, 2.3051, 2.3499, 2.3507], currency: 'EUR', kgPerUnit: 1 },
          countryFactors: { es: 1, de: 1.961, fr: 1.574, it: 1.574 },
          ca: { price: 0, changePct: 0, history: [0, 0], currency: 'CAD', kgPerUnit: 1 },
          quoteTypes: { ca: { type: 'referencia', market: 'Statistics Canada (precio pagado al productor, provincia de referencia)' }, us: { type: 'referencia', market: 'USDA NASS (precio recibido, broilers, peso vivo)' }, eu: { type: 'referencia', market: 'Comisión Europea (pollo, España, broiler entero 65 %)' } } }
      ]
    },
    {
      id: 'pienso', nameKey: 'pienso',
      products: [
        { nameKey: 'pienso', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 318, changePct: 0.3, history: [310, 312, 315, 313, 316, 317, 318], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 312, changePct: 0.3, history: [305, 307, 309, 308, 310, 311, 312], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'pienso',
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS (precio recibido, broilers, peso vivo)' }, eu: { type: 'indice', market: 'Comisión Europea (índices regionales)' } } },
        { nameKey: 'harina_soja', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 384.14, changePct: 1.33, history: [318.41, 323.9, 334.5, 318.9, 317.9, 313.7, 324, 344, 351.96, 351.8, 379.08, 384.14], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 409.67, changePct: 2.0501, history: [359.51, 364.81, 372.43, 384.13, 382.56, 374.51, 358.63, 375.86, 394.93, 399.88, 401.44, 409.67], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'harina_soja',
          uk: { price: 355.00, changePct: 5.65, history: [340, 343, 346, 349, 351, 353, 355], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (harina de soja, Iowa, FOB, 46,5-48 % de proteína)' }, eu: { type: 'referencia', market: 'Comisión Europea (harina de soja, España, media nacional)' }, uk: { type: 'indice', market: 'Farmers Weekly (mercado del Reino Unido)' } } }
      ]
    },
    {
      id: 'fertilizantes', nameKey: 'fertilizantes',
      products: [
        { nameKey: 'urea', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 489, changePct: 0.6, history: [470, 475, 480, 478, 482, 486, 489], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 390, changePct: -2.5, history: [461.1,394.4,409.3,392.5,415.4,472.0,725.6,856.9,770.5,453.1,400.0,390.0], currency: 'USD', kgPerUnit: 1000},
          uk: { price: 476.00, changePct: 0.5, history: [465, 468, 470, 472, 474, 475, 476], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'DTN Fertilizer Index' }, eu: { type: 'referencia', market: 'Banco Mundial' }, uk: { type: 'indice', market: 'AHDB (urea granulada 46% N, cotización media GB)' } } },
        { nameKey: 'dap', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 735, changePct: 0.7, history: [710, 715, 720, 722, 725, 730, 735], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 739, changePct: 0.4076, history: [626, 611, 606, 607, 604, 606, 663, 700, 717, 729, 736, 739], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 794.00, changePct: 0.4, history: [780, 783, 786, 789, 791, 792, 794], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'DTN Fertilizer Index' }, eu: { type: 'indice', market: 'Comisión Europea (fósforo, precio agregado por nutriente)' }, uk: { type: 'indice', market: 'AHDB (DAP, cotización media GB)' } } },
        { nameKey: 'potasa', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 480, changePct: 0.4, history: [460, 465, 470, 472, 475, 478, 480], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 364, changePct: -0.5464, history: [369, 366, 363, 360, 360, 357, 359, 368, 370, 368, 366, 364], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 367.00, changePct: 0.3, history: [358, 360, 362, 363, 364, 366, 367], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'DTN Fertilizer Index' }, eu: { type: 'indice', market: 'Comisión Europea (potasio, precio agregado por nutriente)' }, uk: { type: 'indice', market: 'AHDB (MOP/potasa, cotización media GB)' } } }
      ]
    },
    {
      id: 'azucar', nameKey: 'azucar',
      products: [
        { nameKey: 'azucar', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 0.41, changePct: 0.2, history: [0.39, 0.395, 0.40, 0.405, 0.408, 0.41, 0.41], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 501.4009, changePct: -0.687, history: [537.8029, 535.8926, 528.9824, 531.6697, 525.4319, 518.3146, 516.2968, 512.9793, 510.1677, 502.1113, 504.8693, 501.4009], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'azucar',
          quoteTypes: { us: { type: 'referencia', market: 'USDA ERS' }, eu: { type: 'referencia', market: 'Comisión Europea (azúcar blanco, media UE)' } } }
      ]
    },
    {
      id: 'aceite', nameKey: 'aceite',
      products: [
        { nameKey: 'oliva', imperialUnitKey: 'gal', imperialKgPerUnit: 3.41, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 27.50, changePct: 0.4, history: [26.20, 26.60, 26.90, 27.10, 27.25, 27.40, 27.50], currency: 'USD', kgPerUnit: 3.41 },
          eu: { price: 346.89, changePct: -0.0403, history: [387.26, 385.55, 361.64, 359.66, 357.58, 355.84, 351.69, 349.77, 345.9, 348.74, 347.03, 346.89], currency: 'EUR', kgPerUnit: 100 },
          footnoteKey: 'aceite',
          countryFactors: { es: 1, it: 1.389 } }
      ]
    },
    {
      id: 'energia', nameKey: 'energia',
      // Las cifras de abajo son solo marcador de posición: la ficha permanece oculta hasta que
      // data/latest.json aporta una observación verificada (EIA / Banco Mundial). kgPerUnit=1:
      // MMBtu y barril no son unidades de masa, así que no se aplica conversión de unidad.
      products: [
        { nameKey: 'gas_natural', imperialUnitKey: 'mmbtu', imperialKgPerUnit: 1, metricUnitKey: 'mmbtu', metricKgPerUnit: 1,
          us: { price: 0, changePct: 0, history: [0, 0], currency: 'USD', kgPerUnit: 1 },
          eu: { price: 0, changePct: 0, history: [0, 0], currency: 'USD', kgPerUnit: 1 },
          quoteTypes: { us: { type: 'referencia', market: 'EIA (Henry Hub, spot)' }, eu: { type: 'referencia', market: 'Banco Mundial (gas natural, Europa / TTF)' } } },
        { nameKey: 'petroleo_wti', imperialUnitKey: 'barril', imperialKgPerUnit: 1, metricUnitKey: 'barril', metricKgPerUnit: 1,
          us: { price: 0, changePct: 0, history: [0, 0], currency: 'USD', kgPerUnit: 1 },
          quoteTypes: { us: { type: 'referencia', market: 'EIA (WTI Cushing, spot)' } } },
        { nameKey: 'petroleo_brent', imperialUnitKey: 'barril', imperialKgPerUnit: 1, metricUnitKey: 'barril', metricKgPerUnit: 1,
          eu: { price: 0, changePct: 0, history: [0, 0], currency: 'USD', kgPerUnit: 1 },
          quoteTypes: { eu: { type: 'referencia', market: 'EIA (Brent Europa, spot FOB)' } } }
      ]
    }
  ];

  // --- Gasóleo agrícola / diésel (Energía) ---------------------------------
  var LITRO_KG = 0.835;
  var GAL_KG = LITRO_KG * 3.78541;
  var DIESEL_US_NATIONAL = { price: 6.382, changePct: -2.2515, history: [5.454, 5.652, 5.599, 5.967, 6.285, 6.529, 6.382], currency: 'USD', kgPerUnit: GAL_KG };
  var DIESEL_EU_NATIONAL = { price: 2.237184154724178, changePct: 0.4824, history: [2.0633660614777103, 2.0391469620832607, 2.1084127823327123, 2.1587361941679264, 2.2264435149088713, 2.237184154724178], currency: 'EUR', kgPerUnit: LITRO_KG };
  var DIESEL_UK_NATIONAL = { price: 1.9918, changePct: 0.4, history: [1.9300, 1.9450, 1.9580, 1.9690, 1.9760, 1.9840, 1.9918], currency: 'GBP', kgPerUnit: LITRO_KG };
  var DIESEL_US_REGIONS = [
    { key: 'usMidwest', price: 6.680, changePct: 0.9, history: [6.55, 6.58, 6.61, 6.60, 6.64, 6.67, 6.680], currency: 'USD', kgPerUnit: GAL_KG },
    { key: 'usSur', price: 6.177, changePct: 0.8, history: [6.05, 6.08, 6.10, 6.09, 6.13, 6.16, 6.177], currency: 'USD', kgPerUnit: GAL_KG },
    { key: 'usOeste', price: 7.456, changePct: 1.0, history: [7.30, 7.34, 7.38, 7.36, 7.40, 7.44, 7.456], currency: 'USD', kgPerUnit: GAL_KG },
    { key: 'usEste', price: 6.268, changePct: 0.7, history: [6.15, 6.17, 6.20, 6.19, 6.22, 6.25, 6.268], currency: 'USD', kgPerUnit: GAL_KG }
  ];
  var DIESEL_EU_COUNTRIES = [
    { key: 'euAlemania', price: 2.13, changePct: 0.6, history: [2.07, 2.08, 2.09, 2.10, 2.11, 2.12, 2.13], currency: 'EUR', kgPerUnit: LITRO_KG },
    { key: 'euFrancia', price: 2.01, changePct: 0.5, history: [1.96, 1.97, 1.98, 1.99, 2.00, 2.00, 2.01], currency: 'EUR', kgPerUnit: LITRO_KG },
    { key: 'euEspana', price: 2.30, changePct: 0.8, history: [2.24, 2.25, 2.27, 2.27, 2.28, 2.29, 2.30], currency: 'EUR', kgPerUnit: LITRO_KG },
    { key: 'euItalia', price: 2.11, changePct: 0.5, history: [2.06, 2.07, 2.08, 2.09, 2.09, 2.10, 2.11], currency: 'EUR', kgPerUnit: LITRO_KG }
  ];
  var DIESEL_COUNTRY_TO_KEY = { de: 'euAlemania', fr: 'euFrancia', es: 'euEspana', it: 'euItalia' };
  var DIESEL_QUOTE_TYPES = { us: { type: 'indice', market: 'EIA' }, eu: { type: 'indice', market: 'Boletín Semanal del Petróleo (CE)' }, uk: { type: 'indice', market: 'RAC Fuel Watch' } };

  // --- Funciones puras de formato / conversión (mismo comportamiento que el
  // artefacto original, sin `this`) -----------------------------------------
  function spark(history, w, h, pad) {
    w = w || 120; h = h || 36; pad = (pad == null) ? 4 : pad;
    var min = Math.min.apply(null, history);
    var max = Math.max.apply(null, history);
    var range = (max - min) || 1;
    var step = (w - pad * 2) / (history.length - 1);
    return history.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - ((v - min) / range) * (h - pad * 2);
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }
  function sparkShared(history, min, max, w, h, pad) {
    w = w || 120; h = h || 36; pad = (pad == null) ? 4 : pad;
    var range = (max - min) || 1;
    var step = (w - pad * 2) / (history.length - 1);
    return history.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - ((v - min) / range) * (h - pad * 2);
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }
  function trendColor(history, T) {
    var first = history[0];
    var last = history[history.length - 1];
    if (last > first) return T.positive;
    if (last < first) return T.negative;
    return T.neutral;
  }
  function fmtChange(pct) {
    var sign = pct > 0 ? '+' : (pct < 0 ? '−' : '');
    var val = Math.abs(pct).toFixed(1);
    return sign + val + '%';
  }
  function changeColor(pct, T) {
    if (pct > 0) return T.positive;
    if (pct < 0) return T.negative;
    return T.neutral;
  }
  function fmtNumber(v) {
    var decimals = Math.abs(v) >= 100 ? 1 : (Math.abs(v) >= 10 ? 2 : 3);
    return v.toFixed(decimals);
  }
  function fmtTotal(v) {
    var fixed = Math.abs(v).toFixed(2);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (v < 0 ? '-' : '') + parts.join('.');
  }
  function computeFactor(region, targetCcy, targetKgPerUnit, fx) {
    var ccyFactor = region.currency === targetCcy ? 1 : (fx[region.currency] / fx[targetCcy]);
    return (targetKgPerUnit / region.kgPerUnit) * ccyFactor;
  }
  function buildRegion(region, labelText, targetCcy, targetKgPerUnit, targetUnitLabel, fx, T) {
    var factor = computeFactor(region, targetCcy, targetKgPerUnit, fx);
    var convertedPrice = region.price * factor;
    var convertedHistory = region.history.map(function (v) { return v * factor; });
    var symbol = CCY_SYMBOL[targetCcy] || targetCcy;
    return {
      label: labelText,
      price: symbol + fmtNumber(convertedPrice),
      priceValue: convertedPrice,
      unit: '/' + targetUnitLabel,
      changeLabel: fmtChange(region.changePct),
      changeColor: changeColor(region.changePct, T),
      sparkPath: spark(convertedHistory),
      sparkColor: trendColor(convertedHistory, T)
    };
  }
  function deriveCountryRaw(rawEu, factor) {
    if (!factor || factor === 1) return rawEu;
    return {
      price: rawEu.price * factor,
      changePct: rawEu.changePct,
      history: rawEu.history.map(function (v) { return v * factor; }),
      histPts: rawEu.histPts ? rawEu.histPts.map(function (q) { return { ts: q.ts, value: q.value * factor }; }) : null,
      histGran: rawEu.histGran,
      currency: rawEu.currency,
      kgPerUnit: rawEu.kgPerUnit
    };
  }

  // --- Histórico ampliado: solo datos reales -------------------------------
  // Cada región con observación verificada guarda region.histPts = [{ ts, value }]
  // (fecha UTC en milisegundos y valor en la moneda y unidad de origen) y
  // region.histGran ('day' o 'month'). No se genera, interpola ni rellena nada:
  // sin histPts no hay histórico y la interfaz lo dice.
  function realHistory(region, targetCcy, targetKgPerUnit, fx) {
    if (!region || !region.histPts || region.histPts.length < 2) return null;
    var factor = computeFactor(region, targetCcy, targetKgPerUnit, fx);
    return { gran: region.histGran || 'day', pts: region.histPts.map(function (p) { return { ts: p.ts, y: p.value * factor }; }) };
  }
  function isoDate(ts, gran) { var s = new Date(ts).toISOString(); return gran === 'month' ? s.slice(0, 7) : s.slice(0, 10); }
  function exportRealCsv(csvHeaderDate, csvHeaderPrice, productKey, regionCode, pts, gran, targetCcy, targetUnitLabel) {
    try {
      if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !pts || !pts.length) return;
      var lines = [csvHeaderDate + ',' + csvHeaderPrice + ' (' + targetCcy + '/' + targetUnitLabel + ')'];
      pts.forEach(function (p) { lines.push(isoDate(p.ts, gran) + ',' + p.y.toFixed(4)); });
      var blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'dehesa-index-' + productKey + '-' + regionCode + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1000);
    } catch (e) {}
  }
  var HISTORY_COMPARE_PRESETS = [
    ['cereales-trigo', 'cereales-maiz'],
    ['lacteos-leche', 'pienso-pienso'],
    ['cereales-trigo', 'fertilizantes-urea']
  ];


  // --- Data Trust v2: esquema normalizado de observaciones -----------------
  // RAW sigue siendo la fuente de compatibilidad con la UI existente. Este
  // registro convierte cada cotización piloto en una observación trazable:
  // identidad + valor + unidad + mercado + fuente + frecuencia + fechas +
  // metodología + comparabilidad + estado de verificación.
  var DATA_TRUST_SCHEMA_VERSION = '2.0';

  var DATA_TRUST_SOURCES = {
    usda_nass: { name: 'USDA NASS', url: SRC_URL.nass, authority: 'official' },
    usda_ams_dairy: { name: 'USDA AMS (Class III)', url: SRC_URL.amsDairy, authority: 'official' },
    european_commission: { name: 'Comisión Europea — Milk Market Observatory', url: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/price-data/price-monitoring-sector/milk-and-dairy-products_en', authority: 'official' },
    euronext: { name: 'Euronext (MATIF)', url: SRC_URL.euronext, authority: 'official' },
    dtn_fertilizer: { name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer, authority: 'commercial' },
    world_bank: { name: 'Banco Mundial', url: SRC_URL.worldBank, authority: 'official' },
    eurostat: { name: 'Eurostat', url: 'https://ec.europa.eu/eurostat/web/agriculture/information-data', authority: 'official' },
    eia: { name: 'EIA', url: SRC_URL.eia, authority: 'official' },
    alberta_ag: { name: 'Alberta Agriculture and Irrigation', url: 'https://open.alberta.ca/publications/3479492', authority: 'official' },
    statcan: { name: 'Statistics Canada', url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701', authority: 'official' },
    defra: { name: 'Defra (Reino Unido)', url: SRC_URL.defraMilk, authority: 'official' },
    eu_agrifood: { name: 'Comisión Europea — Agri-food Data Portal', url: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/price-data_en', authority: 'official' },
    eu_oil_bulletin: { name: 'Boletín Semanal del Petróleo (CE)', url: SRC_URL.euOilBulletin, authority: 'official' },
    usda_ams_mars: { name: 'USDA AMS Market News (MARS)', url: SRC_URL.amsMars, authority: 'official' }
  };

  var DATA_TRUST_PILOT = {
    'cereales-trigo-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:32:56.483Z'
    },
    'cereales-trigo-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del trigo blando panificable (milling wheat) en el mercado de Zaragoza (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional ni un futuro de Euronext. Los coeficientes de Francia, Alemania e Italia comparan un mercado de referencia de cada país (Rouen, Hamburgo, Bolonia) con Zaragoza la misma semana; las etapas de comercialización no son idénticas. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:31.292Z'
    },
    'cereales-maiz-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:32:57.293Z'
    },
    'cereales-arroz-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:32:58.121Z'
    },
    'cereales-cebada-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:32:59.018Z'
    },
    'cereales-avena-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED observation; USD/bushel. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:32:59.771Z'
    },
    'cereales-colza-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for canola; USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:33:00.689Z'
    },
    'cereales-sorgo-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for grain sorghum; USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:33:01.562Z'
    },
    'cereales-maiz-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del maíz pienso en el mercado de Zaragoza (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional (la media nacional del portal está desactualizada) ni un futuro de Euronext. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:29.020Z'
    },
    'lacteos-leche-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for all milk sold to plants (not Class III); USD/cwt. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:33:02.461Z'
    },
    'lacteos-leche-uk': {
      sourceId: 'defra', frequency: 'monthly',
      methodology: 'Defra (Open Government Licence v3.0): precio medio en granja de la leche en el Reino Unido, en GBP/100 kg. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null,
      status: 'pending', verifiedAt: null
    },
    'lacteos-leche-eu': {
      sourceId: 'european_commission', frequency: 'monthly',
      methodology: 'Comisión Europea, Milk Market Observatory (Agri-food Data Portal): precio mensual de la leche cruda de vaca pagada al productor en España, EUR/100 kg, último mes completo. Las cifras del último mes pueden ser provisionales. Es la referencia española; no es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-08-31', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:48.066Z'
    },
    'fertilizantes-urea-us': {
      sourceId: 'dtn_fertilizer', frequency: 'weekly',
      methodology: 'PENDIENTE: la ficha muestra 489 USD/ton corta, pero DTN publicó el 23/09/2026 un promedio de 659 USD/ton para urea, observado el 14–18/09/2026. DTN no define “ton” en ese registro; no equipararlo a tonelada métrica ni al valor visible sin reconciliar la unidad y el período.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'fertilizantes-urea-eu': {
      sourceId: 'world_bank', frequency: 'monthly',
      methodology: 'World Bank Urea, E. Europe international commodity reference; USD/metric ton.',
      comparability: 'not_comparable', observationDate: '2026-08-01', publicationDate: '2026-09-02',
      status: 'verified', verifiedAt: '2026-09-30T17:35:54Z'
    },
    'energia-gas_natural-us': {
      sourceId: 'eia', frequency: 'weekly',
      methodology: 'Henry Hub natural gas spot price (EIA); USD/MMBtu. Wholesale benchmark, not a farm-gate price.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'energia-gas_natural-eu': {
      sourceId: 'world_bank', frequency: 'monthly',
      methodology: 'World Bank Pink Sheet, Natural gas, Europe (TTF); USD/MMBtu, monthly average. Wholesale benchmark, not a farm-gate price.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'energia-petroleo_wti-us': {
      sourceId: 'eia', frequency: 'weekly',
      methodology: 'WTI crude oil spot price, Cushing, Oklahoma (EIA); USD/barrel. Global benchmark for US crude.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'energia-petroleo_brent-eu': {
      sourceId: 'eia', frequency: 'weekly',
      methodology: 'Brent crude oil spot price, Europe, FOB (EIA); USD/barrel. Global benchmark for European crude.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-trigo-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-cebada-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-avena-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-colza-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-maiz-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'lacteos-leche-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'ganado-vaca-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'porcino-cerdo-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'ovino-cordero-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'avicultura-pollo-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'avicultura-huevos-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-soja_grano-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-lenteja-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-guisante_seco-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-lino-ca': {
      sourceId: 'statcan', frequency: 'monthly',
      methodology: 'Statistics Canada, tabla 32-10-0077-01 (Farm product prices, crops and livestock; Open Government Licence - Canada): precio mensual pagado al productor en una provincia de referencia. Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-canola_elevador-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-trigo_pienso_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-cebada_pienso_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-avena_pienso_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-trigo_cwrs_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-lenteja_laird_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'cereales-guisante_verde_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'ganado-novillo_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'porcino-cerdo_ab-ca': {
      sourceId: 'alberta_ag', frequency: 'weekly',
      methodology: 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta). Pendiente de la primera ejecución automática.',
      comparability: 'directional', observationDate: null, publicationDate: null, status: 'pending', verifiedAt: null
    },
    'energia-diesel-us': {
      sourceId: 'eia', frequency: 'weekly',
      methodology: 'US national diesel fuel reference; USD/gallon. Observation dated 2026-09-28; EIA release dated 2026-09-28.',
      comparability: 'directional', observationDate: '2026-09-28', publicationDate: '2026-09-28', status: 'verified', verifiedAt: '2026-09-30T17:35:16.952Z'
    },
    'energia-diesel-eu': {
      sourceId: 'eu_oil_bulletin', frequency: 'weekly',
      methodology: 'Media ponderada de la UE de gasóleo de automoción, con impuestos, publicada en EUR/1.000 litros y almacenada sin convertir su precisión de origen. Es un precio semanal al consumidor; no equivale a una cotización agrícola en finca.',
      comparability: 'directional', observationDate: '2026-09-28', publicationDate: '2026-09-30', status: 'verified', verifiedAt: '2026-09-30T17:35:21.379660Z'
    },
    'porcino-cerdo-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for all hogs, live weight; USD/cwt. Not comparable with the EU carcass price (class S). Published in the August 2026 Agricultural Prices release.',
      comparability: 'not_comparable', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:33:04.023Z'
    },
    'porcino-cerdo-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de cerdo clasificada S (≥60 % magro) en España, EUR/100 kg de canal. Es la referencia española; no es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:20.783Z'
    },
    'ganado-vaca-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for steers and heifers of 500 lb or more, live weight; USD/cwt. Not comparable with the EU carcass price (young bulls A-R3). Published in the August 2026 Agricultural Prices release.',
      comparability: 'not_comparable', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:33:05.115Z'
    },
    'ganado-vaca-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de macho joven (categoría A, conformación R3, la referencia UE) en España, EUR/100 kg de canal. No es vaca de desecho ni la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:23.705Z'
    },
    'ovino-cordero-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de cordero pesado en España, EUR/100 kg de canal. No es la media de la UE ni cordero ligero. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:24.242Z'
    },
    'avicultura-pollo-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for broilers, live weight; USD/lb. Not comparable with the EU whole-carcass price (65 % yield). Published in the August 2026 Agricultural Prices release.',
      comparability: 'not_comparable', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:33:05.754Z'
    },
    'avicultura-pollo-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio de venta semanal del pollo broiler entero (65 % de rendimiento) en España; el portal lo da en moneda nacional (EUR) por 100 kg y se divide entre 100 para expresarlo en EUR/kg. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:24.825Z'
    },
    'azucar-azucar-eu': {
      sourceId: 'eu_agrifood', frequency: 'monthly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual medio del azúcar en la UE (contratos mensuales), EUR/tonelada. Es la media de la UE, no un precio de España. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-06', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:25.847Z'
    },
    'aceite-oliva-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal medio nacional del aceite de oliva virgen extra (hasta 0,8 %) en España, EUR/100 kg. No es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:27.288Z'
    },
    'cereales-arroz-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal medio del arroz cáscara (paddy) tipo japónica en España, EUR/tonelada. No es la media de la UE ni arroz índica. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:28.011Z'
    },
    'avicultura-huevos-us': {
      sourceId: 'usda_nass', frequency: 'monthly',
      methodology: 'National USDA NASS PRICE RECEIVED for table eggs (producer price, not retail); USD/dozen. Published in the August 2026 Agricultural Prices release.',
      comparability: 'directional', observationDate: '2026-08', publicationDate: '2026-08-31', status: 'verified', verifiedAt: '2026-09-30T17:33:03.122Z'
    },
    'avicultura-huevos-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de los huevos de gallinas en jaula (Cage) en España, EUR/100 kg de huevos (el portal no lo da por docena). No es la media de la UE. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:25.429Z'
    },
    'fertilizantes-dap-eu': {
      sourceId: 'eu_agrifood', frequency: 'monthly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual agregado de los fertilizantes fosfatados (P) en varios mercados de la UE, EUR/tonelada, a partir de servicios de inteligencia de mercado. NO es DAP: la Comisión no especifica el producto, así que no es comparable con DAP ni con el índice DTN. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'not_comparable', observationDate: '2026-08', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:47.205Z'
    },
    'fertilizantes-potasa-eu': {
      sourceId: 'eu_agrifood', frequency: 'monthly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual agregado de los fertilizantes potásicos (K) en varios mercados de la UE, EUR/tonelada, a partir de servicios de inteligencia de mercado. NO es MOP: la Comisión no especifica el producto, así que no es comparable con MOP ni con el índice DTN. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'not_comparable', observationDate: '2026-08', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:47.616Z'
    },
    'pienso-harina_soja-us': {
      sourceId: 'usda_ams_mars', frequency: 'weekly',
      methodology: 'USDA AMS Market News (API MARS, informe 3511 «National Grain and Oilseed Processor Feedstuff Report», semanal): precio medio semanal de la harina de soja de 46,5-48 % de proteína en Iowa, FOB, cotización de venta (ask), en USD por tonelada. El informe solo indica «$ Per Ton»; se trata como tonelada corta (2.000 lb) porque el precio se expresa como base sobre el futuro de harina de soja de CBOT, que cotiza en toneladas cortas. Es un mercado regional, no un futuro ni la media nacional, y no es exactamente el mismo producto que la referencia europea (España, 40-50 % de proteína, salida de fábrica, EUR/t).',
      comparability: 'directional', observationDate: '2026-09-25', publicationDate: '2026-09-25', status: 'verified', verifiedAt: '2026-09-30T14:51:46.500Z'
    },
    'pienso-harina_soja-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la harina de soja de 40-50 % de proteína en España (media, salida de fábrica), EUR/tonelada. Sustituye a la referencia anterior de colza en Euronext. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:48.631Z'
    },
    'cereales-cebada-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la cebada pienso en el mercado de Lleida (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional ni un futuro de Euronext. El portal no publica cebada pienso en Zaragoza. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:32.361Z'
    },
    'cereales-avena-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del agregado de la UE de avena pienso (media nacional de los Estados miembros que la publican), EUR/tonelada. España no publica avena en el portal. Es el agregado de la Comisión, no una media calculada por Dehesa Index. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-08-02', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:37.671Z'
    },
    'cereales-centeno-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del agregado de la UE de centeno panificable (media nacional de los Estados miembros que lo publican), EUR/tonelada. España no publica centeno en el portal. Es el agregado de la Comisión, no una media calculada por Dehesa Index. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-08-02', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:43.114Z'
    },
    'lacteos-mantequilla-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la mantequilla, agregado de la UE calculado por la Comisión, EUR/100 kg. No es un futuro ni una media calculada por Dehesa Index. La serie de España tiene huecos de varias semanas. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:44.919Z'
    },
    'lacteos-leche_polvo-us': {
      sourceId: 'usda_ams_mars', frequency: 'weekly',
      methodology: 'USDA AMS Market News (API MARS, informe 1049 «Nonfat Dry Milk - East and Central U.S.», semanal): leche desnatada en polvo de calor bajo y medio, en USD por libra. El informe publica un rango semanal (mínimo y máximo) y el valor mostrado es el punto medio de ese rango, calculado por Dehesa Index. Es un mercado regional (Este y Centro de EE. UU.), no un futuro; el producto es equivalente en tipo al SMP europeo, pero no es idéntico.',
      comparability: 'directional', observationDate: '2026-09-25', publicationDate: '2026-09-25', status: 'verified', verifiedAt: '2026-09-30T14:51:46.571Z'
    },
    'lacteos-leche_polvo-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la leche desnatada en polvo (SMP), agregado de la UE calculado por la Comisión, EUR/100 kg. No es un futuro ni una media calculada por Dehesa Index. La serie de España tiene huecos de varias semanas. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:46.778Z'
    },
    'cereales-colza-eu': {
      sourceId: 'eu_agrifood', frequency: 'weekly',
      methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la colza en España (media nacional, salida de silo del agricultor), EUR/tonelada. No es la media de la UE ni el futuro de Euronext. La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.',
      comparability: 'directional', observationDate: '2026-09-20', publicationDate: '2026-09-30',
      status: 'verified', verifiedAt: '2026-09-30T14:38:38.205Z'
    }
  };

  function buildTrustObservation(productId, region, raw, quote, meta) {
    var source = DATA_TRUST_SOURCES[meta.sourceId] || {};
    var isUS = region === 'us';
    var unit = isUS ? (raw.imperialUnitKey || null) : (raw.metricUnitKey || null);
    var kgPerUnit = raw.kgPerUnit || (isUS ? raw.imperialKgPerUnit : raw.metricKgPerUnit) || null;
    return {
      schemaVersion: DATA_TRUST_SCHEMA_VERSION,
      id: 'di_' + productId.replace(/[^a-z0-9]+/gi, '_') + '_' + region,
      productId: productId,
      region: region,
      value: raw.price,
      currency: raw.currency,
      unit: unit,
      kgPerUnit: kgPerUnit,
      quoteType: quote && quote.type ? quote.type : null,
      market: quote && quote.market ? quote.market : null,
      sourceId: meta.sourceId,
      source: source.name || null,
      sourceUrl: source.url || null,
      sourceAuthority: source.authority || 'unknown',
      frequency: meta.frequency || 'unknown',
      observationDate: meta.observationDate || null,
      publicationDate: meta.publicationDate || null,
      methodology: meta.methodology || null,
      comparability: meta.comparability || 'review',
      status: meta.status || 'sample',
      verifiedAt: meta.verifiedAt || null,
      validation: {
        value: true,
        source: !!source.url,
        observationDate: !!meta.observationDate,
        publicationDate: !!meta.publicationDate,
        frequency: meta.frequency !== 'unknown',
        methodology: !!meta.methodology
      }
    };
  }

  function buildPilotTrustRegistry() {
    var out = {};
    for (var catIndex = 0; catIndex < RAW.length; catIndex++) {
      var category = RAW[catIndex];
      for (var productIndex = 0; productIndex < category.products.length; productIndex++) {
        var product = category.products[productIndex];
        var productId = category.id + '-' + product.nameKey;
        ['us', 'eu', 'uk', 'ca'].forEach(function (region) {
          var raw = product[region];
          if (!raw) return;
          var key = productId + '-' + region;
          var meta = DATA_TRUST_PILOT[key];
          if (!meta) return;
          var quote = product.quoteTypes && product.quoteTypes[region];
          out[key] = buildTrustObservation(productId, region, {
            price: raw.price,
            currency: raw.currency,
            kgPerUnit: raw.kgPerUnit,
            imperialUnitKey: region === 'ca' ? null : product.imperialUnitKey,
            metricUnitKey: region === 'ca' ? product.caUnitKey : product.metricUnitKey,
            imperialKgPerUnit: product.imperialKgPerUnit,
            metricKgPerUnit: product.metricKgPerUnit
          }, quote, meta);
        });
      }
    }

    var diesel = [
      { region: 'us', raw: DIESEL_US_NATIONAL, quote: DIESEL_QUOTE_TYPES.us, key: 'energia-diesel-us' },
      { region: 'eu', raw: DIESEL_EU_NATIONAL, quote: DIESEL_QUOTE_TYPES.eu, key: 'energia-diesel-eu' }
    ];
    for (var i = 0; i < diesel.length; i++) {
      var d = diesel[i], meta = DATA_TRUST_PILOT[d.key];
      out[d.key] = buildTrustObservation('energia-diesel', d.region, {
        price: d.raw.price, currency: d.raw.currency, kgPerUnit: d.raw.kgPerUnit,
        imperialUnitKey: d.region === 'us' ? 'gal' : null,
        metricUnitKey: d.region === 'eu' ? 'litro' : null
      }, d.quote, meta);
    }
    return out;
  }

  var DATA_TRUST = buildPilotTrustRegistry();

  function validateDataTrustRegistry(registry) {
    var required = ['schemaVersion','id','productId','region','value','currency','unit','kgPerUnit','quoteType','market','sourceId','source','sourceUrl','frequency','methodology','comparability','status'];
    var errors = [], warnings = [], ids = Object.keys(registry);
    for (var i = 0; i < ids.length; i++) {
      var key = ids[i], o = registry[key];
      for (var j = 0; j < required.length; j++) {
        var field = required[j];
        if (o[field] === null || o[field] === undefined || o[field] === '') {
          errors.push(key + ': missing ' + field);
        }
      }
      if (o.status === 'verified' && (!o.observationDate || !o.publicationDate || !o.verifiedAt)) {
        errors.push(key + ': verified observations require observationDate, publicationDate and verifiedAt');
      }
      if (!o.observationDate) warnings.push(key + ': observationDate pending');
      if (!o.publicationDate) warnings.push(key + ': publicationDate pending');
      if (!o.sourceUrl) warnings.push(key + ': sourceUrl pending');
    }
    return {
      schemaVersion: DATA_TRUST_SCHEMA_VERSION,
      observations: ids.length,
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      pendingDates: ids.filter(function (id) { return !registry[id].observationDate || !registry[id].publicationDate; }).length
    };
  }

  var DATA_TRUST_HEALTH = validateDataTrustRegistry(DATA_TRUST);

  global.DehesaData = {
    FX: FX, FX_DATE: FX_DATE, formatFxDate: formatFxDate, CCY_SYMBOL: CCY_SYMBOL, UNIT_LABELS: UNIT_LABELS, REGION: REGION,
    DATA_TRUST_SCHEMA_VERSION: DATA_TRUST_SCHEMA_VERSION, DATA_TRUST: DATA_TRUST, DATA_TRUST_SOURCES: DATA_TRUST_SOURCES, DATA_TRUST_HEALTH: DATA_TRUST_HEALTH, validateDataTrustRegistry: validateDataTrustRegistry,
    ENERGY_REGIONS: ENERGY_REGIONS, COUNTRY_ER_KEY: COUNTRY_ER_KEY, COUNTRY_FLAG: COUNTRY_FLAG,
    QUOTE_TYPES: QUOTE_TYPES, NAMES: NAMES, CATS: CATS, FOOT: FOOT, RAW: RAW,
    INSURANCE: INSURANCE, WINE: WINE, WOOD: WOOD,
    LITRO_KG: LITRO_KG, GAL_KG: GAL_KG,
    DIESEL_US_NATIONAL: DIESEL_US_NATIONAL, DIESEL_EU_NATIONAL: DIESEL_EU_NATIONAL, DIESEL_UK_NATIONAL: DIESEL_UK_NATIONAL,
    DIESEL_US_REGIONS: DIESEL_US_REGIONS, DIESEL_EU_COUNTRIES: DIESEL_EU_COUNTRIES,
    DIESEL_COUNTRY_TO_KEY: DIESEL_COUNTRY_TO_KEY, DIESEL_QUOTE_TYPES: DIESEL_QUOTE_TYPES,
    withSeps: withSeps,
    spark: spark, sparkShared: sparkShared, trendColor: trendColor, fmtChange: fmtChange, changeColor: changeColor,
    fmtNumber: fmtNumber, fmtTotal: fmtTotal, computeFactor: computeFactor, buildRegion: buildRegion,
    deriveCountryRaw: deriveCountryRaw,
    realHistory: realHistory, exportRealCsv: exportRealCsv, isoDate: isoDate,
    HISTORY_COMPARE_PRESETS: HISTORY_COMPARE_PRESETS
  };
})(window);
