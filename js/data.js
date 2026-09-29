/* Dehesa Index — capa de datos y funciones puras compartidas por Precios
   (y, más adelante, por el resto de páginas de mercado). Extraído 1:1 del
   artefacto Design original (Main.dc.html): mismos precios, mismas fuentes,
   mismos comentarios de investigación -- solo se ha adaptado la sintaxis
   `this.props`/`this.state` a funciones planas. ES5 a propósito, sin build
   step (var, function(){}, sin arrow functions). */
(function (global) {
  'use strict';

  // --- Tipos de cambio (Banco Central Europeo, referencia del 28 sep 2026) -
  var EURUSD = 1.1378;
  var GBPUSD = 1.3263;
  var FX_DATE = '2026-09-28'; // fecha ISO de la cotización, la actualiza scripts/update-fx.mjs
  var FX = { USD: 1, EUR: EURUSD, GBP: GBPUSD };
  var CCY_SYMBOL = { USD: '$', EUR: '€', GBP: '£' };

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
    es: { bushel: 'bushel', cwt: 'cwt', lb: 'lb', ton_corta: 'ton corta', tonelada: 'tonelada', kg: 'kg', '100kg': '100 kg', gal: 'galón', docena: 'docena', litro: 'litro' },
    en: { bushel: 'bushel', cwt: 'cwt', lb: 'lb', ton_corta: 'short ton', tonelada: 'tonne', kg: 'kg', '100kg': '100 kg', gal: 'gallon', docena: 'dozen', litro: 'liter' },
    fr: { bushel: 'bushel', cwt: 'cwt', lb: 'lb', ton_corta: 'tonne courte', tonelada: 'tonne', kg: 'kg', '100kg': '100 kg', gal: 'gallon', docena: 'douzaine', litro: 'litre' },
    it: { bushel: 'bushel', cwt: 'cwt', lb: 'lb', ton_corta: 'tonnellata corta', tonelada: 'tonnellata', kg: 'kg', '100kg': '100 kg', gal: 'gallone', docena: 'dozzina', litro: 'litro' }
  };

  var REGION = {
    es: { us: 'EE. UU.', eu: 'Europa', uk: 'Reino Unido' },
    en: { us: 'U.S.', eu: 'Europe', uk: 'U.K.' },
    fr: { us: 'États-Unis', eu: 'Europe', uk: 'Royaume-Uni' },
    it: { us: 'Stati Uniti', eu: 'Europa', uk: 'Regno Unito' }
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
    es: { maiz: 'Maíz', trigo: 'Trigo', arroz: 'Arroz', leche: 'Leche', vaca: 'Vaca (vacuno)', cabra: 'Cabra', pienso: 'Pienso compuesto', harina_soja: 'Harina de soja', urea: 'Urea', dap: 'DAP (fosfato diamónico)', potasa: 'Potasa (MOP)', cerdo: 'Cerdo', cordero: 'Cordero', huevos: 'Huevos', pollo: 'Pollo', azucar: 'Azúcar', oliva: 'Aceite de oliva', diesel: 'Diésel agrícola' },
    en: { maiz: 'Corn', trigo: 'Wheat', arroz: 'Rice', leche: 'Milk', vaca: 'Cattle', cabra: 'Goat', pienso: 'Compound feed', harina_soja: 'Soybean meal', urea: 'Urea', dap: 'DAP (diammonium phosphate)', potasa: 'Potash (MOP)', cerdo: 'Pork', cordero: 'Lamb', huevos: 'Eggs', pollo: 'Chicken', azucar: 'Sugar', oliva: 'Olive oil', diesel: 'Agricultural diesel' },
    fr: { maiz: 'Maïs', trigo: 'Blé', arroz: 'Riz', leche: 'Lait', vaca: 'Bovins', cabra: 'Chèvre', pienso: 'Aliment composé', harina_soja: 'Tourteau de soja', urea: 'Urée', dap: 'DAP (phosphate diammonique)', potasa: 'Potasse (MOP)', cerdo: 'Porc', cordero: 'Agneau', huevos: 'Œufs', pollo: 'Poulet', azucar: 'Sucre', oliva: "Huile d'olive", diesel: 'Gazole agricole' },
    it: { maiz: 'Mais', trigo: 'Grano', arroz: 'Riso', leche: 'Latte', vaca: 'Bovini', cabra: 'Capra', pienso: 'Mangime composto', harina_soja: 'Farina di soia', urea: 'Urea', dap: 'DAP (fosfato diammonico)', potasa: 'Potassa (MOP)', cerdo: 'Maiale', cordero: 'Agnello', huevos: 'Uova', pollo: 'Pollo', azucar: 'Zucchero', oliva: "Olio d'oliva", diesel: 'Gasolio agricolo' }
  };

  var SRC_URL = {
    nass: 'https://www.nass.usda.gov/Charts_and_Maps/Agricultural_Prices/index.php',
    amsDairy: 'https://www.ams.usda.gov/market-news/dairy',
    ecPrices: 'https://agridata.ec.europa.eu/extensions/DataPortal/prices.html',
    cmeLiveCattle: 'https://www.cmegroup.com/markets/agriculture/livestock/live-cattle.html',
    euronext: 'https://www.euronext.com/en/products/commodities',
    euronextColza: 'https://live.euronext.com/en/product/commodities-futures/ECO-DPAR',
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
      cereales: { label: 'Cereales', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Euronext (MATIF)', url: SRC_URL.euronext }] },
      lacteos: { label: 'Lácteos', sources: [{ name: 'USDA AMS (Class III)', url: SRC_URL.amsDairy }, { name: 'Comisión Europea', url: SRC_URL.ecPrices }] },
      ganado: { label: 'Ganado', sources: [{ name: 'CME Group (Live Cattle)', url: SRC_URL.cmeLiveCattle }, { name: 'Comisión Europea', url: SRC_URL.ecPrices }] },
      porcino: { label: 'Porcino', sources: [{ name: 'USDA AMS (cerdo)', url: SRC_URL.usdaPork }, { name: 'Comisión Europea (porcino)', url: SRC_URL.ecPigmeat }, { name: 'Mercolleida', url: SRC_URL.mercolleida }] },
      ovino: { label: 'Ovino', sources: [{ name: 'USDA AMS (cordero)', url: SRC_URL.usdaLamb }, { name: 'Comisión Europea (ovino)', url: SRC_URL.ecSheep }] },
      avicultura: { label: 'Avicultura', sources: [{ name: 'USDA AMS (huevo)', url: SRC_URL.usdaEggs }, { name: 'USDA AMS (aves)', url: SRC_URL.usdaPoultry }, { name: 'Comisión Europea (pollo)', url: SRC_URL.ecPoultry }, { name: 'Comisión Europea (huevo)', url: SRC_URL.ecEggs }] },
      pienso: { label: 'Pienso', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'índices regionales UE', url: SRC_URL.ecPrices }, { name: 'CME (harina de soja)', url: SRC_URL.cmeSoybeanMeal }, { name: 'Euronext (colza)', url: SRC_URL.euronextColza }] },
      fertilizantes: { label: 'Fertilizantes', sources: [{ name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer }, { name: 'referencia internacional (Banco Mundial)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Azúcar', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'Comisión Europea', url: SRC_URL.ecSugar }] },
      aceite: { label: 'Aceite de oliva', sources: [{ name: 'Comisión Europea', url: SRC_URL.ecOliveOil }] },
      energia: { label: 'Energía', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Boletín Semanal del Petróleo (CE)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Seguro agrario', sources: [{ name: 'Agroseguro', url: SRC_URL.agroseguro }, { name: 'USDA RMA', url: SRC_URL.rma }, { name: 'USDA ERS', url: SRC_URL.ersCropInsurance }] },
      vino: { label: 'Vino a granel', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }, { name: 'OeMv', url: SRC_URL.oemv }] },
      madera: { label: 'Madera', sources: [{ name: 'CME Group', url: SRC_URL.cmeLumber }, { name: 'Forest Research (RU)', url: SRC_URL.forestResearchTimber }, { name: 'France Bois Forêt / ONF', url: SRC_URL.franceBoisForetBois }] }
    },
    en: {
      cereales: { label: 'Grains', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Euronext (MATIF)', url: SRC_URL.euronext }] },
      lacteos: { label: 'Dairy', sources: [{ name: 'USDA AMS (Class III)', url: SRC_URL.amsDairy }, { name: 'European Commission', url: SRC_URL.ecPrices }] },
      ganado: { label: 'Livestock', sources: [{ name: 'CME Group (Live Cattle)', url: SRC_URL.cmeLiveCattle }, { name: 'European Commission', url: SRC_URL.ecPrices }] },
      porcino: { label: 'Pork', sources: [{ name: 'USDA AMS (pork)', url: SRC_URL.usdaPork }, { name: 'European Commission (pigmeat)', url: SRC_URL.ecPigmeat }, { name: 'Mercolleida', url: SRC_URL.mercolleida }] },
      ovino: { label: 'Sheep & Lamb', sources: [{ name: 'USDA AMS (lamb)', url: SRC_URL.usdaLamb }, { name: 'European Commission (sheep)', url: SRC_URL.ecSheep }] },
      avicultura: { label: 'Poultry & Eggs', sources: [{ name: 'USDA AMS (eggs)', url: SRC_URL.usdaEggs }, { name: 'USDA AMS (poultry)', url: SRC_URL.usdaPoultry }, { name: 'European Commission (poultry)', url: SRC_URL.ecPoultry }, { name: 'European Commission (eggs)', url: SRC_URL.ecEggs }] },
      pienso: { label: 'Feed', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'EU regional indices', url: SRC_URL.ecPrices }, { name: 'CME (soybean meal)', url: SRC_URL.cmeSoybeanMeal }, { name: 'Euronext (rapeseed)', url: SRC_URL.euronextColza }] },
      fertilizantes: { label: 'Fertilizer', sources: [{ name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer }, { name: 'international reference (World Bank)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Sugar', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'European Commission', url: SRC_URL.ecSugar }] },
      aceite: { label: 'Olive Oil', sources: [{ name: 'European Commission', url: SRC_URL.ecOliveOil }] },
      energia: { label: 'Energy', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Weekly Oil Bulletin (EC)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Crop insurance', sources: [{ name: 'Agroseguro', url: SRC_URL.agroseguro }, { name: 'USDA RMA', url: SRC_URL.rma }, { name: 'USDA ERS', url: SRC_URL.ersCropInsurance }] },
      vino: { label: 'Bulk wine', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }, { name: 'OeMv', url: SRC_URL.oemv }] },
      madera: { label: 'Timber', sources: [{ name: 'CME Group', url: SRC_URL.cmeLumber }, { name: 'Forest Research (UK)', url: SRC_URL.forestResearchTimber }, { name: 'France Bois Forêt / ONF', url: SRC_URL.franceBoisForetBois }] }
    },
    fr: {
      cereales: { label: 'Céréales', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Euronext (MATIF)', url: SRC_URL.euronext }] },
      lacteos: { label: 'Produits laitiers', sources: [{ name: 'USDA AMS (Classe III)', url: SRC_URL.amsDairy }, { name: 'Commission européenne', url: SRC_URL.ecPrices }] },
      ganado: { label: 'Bétail', sources: [{ name: 'CME Group (Live Cattle)', url: SRC_URL.cmeLiveCattle }, { name: 'Commission européenne', url: SRC_URL.ecPrices }] },
      porcino: { label: 'Porc', sources: [{ name: 'USDA AMS (porc)', url: SRC_URL.usdaPork }, { name: 'Commission européenne (porcin)', url: SRC_URL.ecPigmeat }, { name: 'Mercolleida', url: SRC_URL.mercolleida }] },
      ovino: { label: 'Ovins', sources: [{ name: 'USDA AMS (agneau)', url: SRC_URL.usdaLamb }, { name: 'Commission européenne (ovins)', url: SRC_URL.ecSheep }] },
      avicultura: { label: 'Volaille et œufs', sources: [{ name: 'USDA AMS (œufs)', url: SRC_URL.usdaEggs }, { name: 'USDA AMS (volaille)', url: SRC_URL.usdaPoultry }, { name: 'Commission européenne (volaille)', url: SRC_URL.ecPoultry }, { name: 'Commission européenne (œufs)', url: SRC_URL.ecEggs }] },
      pienso: { label: 'Aliments', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'indices régionaux UE', url: SRC_URL.ecPrices }, { name: 'CME (tourteau de soja)', url: SRC_URL.cmeSoybeanMeal }, { name: 'Euronext (colza)', url: SRC_URL.euronextColza }] },
      fertilizantes: { label: 'Engrais', sources: [{ name: 'DTN Fertilizer Index', url: SRC_URL.dtnFertilizer }, { name: 'référence internationale (Banque mondiale)', url: SRC_URL.worldBank }] },
      azucar: { label: 'Sucre', sources: [{ name: 'USDA ERS', url: SRC_URL.usdaSugar }, { name: 'Commission européenne', url: SRC_URL.ecSugar }] },
      aceite: { label: "Huile d'olive", sources: [{ name: 'Commission européenne', url: SRC_URL.ecOliveOil }] },
      energia: { label: 'Énergie', sources: [{ name: 'EIA', url: SRC_URL.eia }, { name: 'USDA AgTransport', url: SRC_URL.usdaAgTransportFuel }, { name: 'Bulletin pétrolier hebdomadaire (CE)', url: SRC_URL.euOilBulletin }] },
      seguro: { label: 'Assurance agricole', sources: [{ name: 'Agroseguro', url: SRC_URL.agroseguro }, { name: 'USDA RMA', url: SRC_URL.rma }, { name: 'USDA ERS', url: SRC_URL.ersCropInsurance }] },
      vino: { label: 'Vin en vrac', sources: [{ name: 'MAPA', url: SRC_URL.mapaCoyuntura }, { name: 'FranceAgriMer', url: SRC_URL.franceAgriMerVin }, { name: 'OeMv', url: SRC_URL.oemv }] },
      madera: { label: 'Bois', sources: [{ name: 'CME Group', url: SRC_URL.cmeLumber }, { name: 'Forest Research (RU)', url: SRC_URL.forestResearchTimber }, { name: 'France Bois Forêt / ONF', url: SRC_URL.franceBoisForetBois }] }
    },
    it: {
      cereales: { label: 'Cereali', sources: [{ name: 'USDA NASS', url: SRC_URL.nass }, { name: 'Euronext (MATIF)', url: SRC_URL.euronext }] },
      lacteos: { label: 'Lattiero-caseario', sources: [{ name: 'USDA AMS (Classe III)', url: SRC_URL.amsDairy }, { name: 'Commissione europea', url: SRC_URL.ecPrices }] },
      ganado: { label: 'Bestiame', sources: [{ name: 'CME Group (Live Cattle)', url: SRC_URL.cmeLiveCattle }, { name: 'Commissione europea', url: SRC_URL.ecPrices }] },
      porcino: { label: 'Suini', sources: [{ name: 'USDA AMS (suino)', url: SRC_URL.usdaPork }, { name: 'Commissione europea (suino)', url: SRC_URL.ecPigmeat }, { name: 'Mercolleida', url: SRC_URL.mercolleida }] },
      ovino: { label: 'Ovini', sources: [{ name: 'USDA AMS (agnello)', url: SRC_URL.usdaLamb }, { name: 'Commissione europea (ovini)', url: SRC_URL.ecSheep }] },
      avicultura: { label: 'Avicoltura', sources: [{ name: 'USDA AMS (uova)', url: SRC_URL.usdaEggs }, { name: 'USDA AMS (pollame)', url: SRC_URL.usdaPoultry }, { name: 'Commissione europea (pollame)', url: SRC_URL.ecPoultry }, { name: 'Commissione europea (uova)', url: SRC_URL.ecEggs }] },
      pienso: { label: 'Mangimi', sources: [{ name: 'USDA', url: SRC_URL.nass }, { name: 'indici regionali UE', url: SRC_URL.ecPrices }, { name: 'CME (farina di soia)', url: SRC_URL.cmeSoybeanMeal }, { name: 'Euronext (colza)', url: SRC_URL.euronextColza }] },
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
      harina_soja: 'Europa apenas cultiva soja: la cifra europea usa la colza como referencia de oleaginosa más líquida, no el mismo cultivo — comparación de coste de la proteína vegetal, no del mismo grano.',
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
      harina_soja: 'Europe grows almost no soy: the European figure uses rapeseed as the most liquid oilseed benchmark, not the same crop — a comparison of vegetable-protein cost, not the same grain.',
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
      harina_soja: "L'Europe cultive très peu de soja : le chiffre européen utilise le colza comme référence oléagineuse la plus liquide, pas la même culture — une comparaison du coût de la protéine végétale, pas de la même graine.",
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
      harina_soja: 'L\'Europa coltiva pochissima soia: la cifra europea usa la colza come riferimento oleaginoso più liquido, non la stessa coltura — un confronto del costo della proteina vegetale, non dello stesso cereale.',
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
        { nameKey: 'maiz', imperialUnitKey: 'bushel', imperialKgPerUnit: 25.401, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 4.26, changePct: -0.47, history: [4.1, 4.11, 4.27, 4.31, 4.48, 4.28, 4.26], currency: 'USD', kgPerUnit: 25.401 },
          eu: { price: 198, changePct: 1.0, history: [205, 202, 200, 199, 197, 196, 198], currency: 'EUR', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'futuro', market: 'Euronext (MATIF)' } } },
        { nameKey: 'trigo', imperialUnitKey: 'bushel', imperialKgPerUnit: 27.2155, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 6.06, changePct: 6.32, history: [5.07, 5.15, 5.52, 5.7, 5.88, 5.7, 6.06], currency: 'USD', kgPerUnit: 27.2155 },
          eu: { price: 221, changePct: 0.5, history: [215, 217, 219, 220, 222, 220, 221], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 215.00, changePct: -0.3, history: [217.80, 217.20, 216.60, 216.10, 215.90, 215.65, 215.00], currency: 'GBP', kgPerUnit: 1000 },
          countryFactors: { es: 1, fr: 0.842, de: 1.016, it: 0.861 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'futuro', market: 'Euronext (MATIF)' }, uk: { type: 'futuro', market: 'AHDB (trigo pienso, entrega nov. 2026)' } } },
        { nameKey: 'arroz', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 11.8, changePct: 0, history: [13.6, 12.3, 11.7, 11.3, 11.4, 11.8, 11.8], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 385, changePct: 0.3, history: [390, 388, 386, 384, 383, 384, 385], currency: 'EUR', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA NASS' }, eu: { type: 'futuro', market: 'Euronext (MATIF)' } } }
      ]
    },
    {
      id: 'lacteos', nameKey: 'lacteos',
      products: [
        { nameKey: 'leche', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 18.45, changePct: 0.5, history: [17.80, 17.95, 18.10, 18.05, 18.20, 18.35, 18.45], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 46.20, changePct: 0.2, history: [45.00, 45.30, 45.60, 45.80, 46.00, 46.10, 46.20], currency: 'EUR', kgPerUnit: 100 },
          countryFactors: { es: 1, de: 0.904, fr: 0.975, it: 1.016 },
          uk: { price: 35.82, changePct: 4.02, history: [34.20, 34.50, 34.80, 35.10, 35.35, 35.60, 35.82], currency: 'GBP', kgPerUnit: 100 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (Class III)' }, eu: { type: 'referencia', market: 'Comisión Europea' }, uk: { type: 'referencia', market: 'AHDB (precio medio en granja del Reino Unido)' } } }
      ]
    },
    {
      id: 'ganado', nameKey: 'ganado',
      products: [
        { nameKey: 'vaca', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 186.50, changePct: 0.3, history: [180, 182, 184, 183, 185, 186, 186.5], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 522, changePct: 0.2, history: [510, 513, 516, 518, 520, 521, 522], currency: 'EUR', kgPerUnit: 100 },
          footnoteKey: 'vaca',
          countryFactors: { es: 1, de: 1.062, fr: 1.015, it: 1.087 },
          uk: { price: 620.00, changePct: 0.4, history: [610, 612, 614, 616, 618, 619, 620], currency: 'GBP', kgPerUnit: 100 },
          quoteTypes: { us: { type: 'futuro', market: 'CME Group (Live Cattle)' }, eu: { type: 'referencia', market: 'Comisión Europea' }, uk: { type: 'referencia', market: 'AHDB (GB deadweight, todas las categorías prime)' } } },
        { nameKey: 'cabra', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'kg', metricKgPerUnit: 1,
          us: { price: 2.15, changePct: 0.5, history: [2.05, 2.08, 2.10, 2.09, 2.12, 2.14, 2.15], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 6.85, changePct: 0.4, history: [6.60, 6.65, 6.70, 6.75, 6.78, 6.82, 6.85], currency: 'EUR', kgPerUnit: 1 },
          footnoteKey: 'cabra' }
      ]
    },
    {
      id: 'porcino', nameKey: 'porcino',
      products: [
        { nameKey: 'cerdo', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 96.50, changePct: 0.4, history: [92.0, 93.5, 94.0, 95.0, 95.8, 96.2, 96.5], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 192, changePct: 0.3, history: [186, 188, 189, 190, 191, 191.5, 192], currency: 'EUR', kgPerUnit: 100 },
          uk: { price: 180.84, changePct: 0.2, history: [179.20, 179.50, 179.80, 180.10, 180.30, 180.40, 180.84], currency: 'GBP', kgPerUnit: 100 },
          footnoteKey: 'cerdo',
          countryFactors: { es: 1, de: 0.911, fr: 1.193, it: 1.353 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (cerdo)' }, eu: { type: 'referencia', market: 'Comisión Europea (porcino)' }, uk: { type: 'referencia', market: 'AHDB (SPP, especificación UE, GB)' } } }
      ]
    },
    {
      id: 'ovino', nameKey: 'ovino',
      products: [
        { nameKey: 'cordero', imperialUnitKey: 'cwt', imperialKgPerUnit: 45.359, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 232, changePct: 0.5, history: [218, 222, 225, 228, 230, 231, 232], currency: 'USD', kgPerUnit: 45.359 },
          eu: { price: 705, changePct: 0.4, history: [680, 688, 692, 696, 700, 703, 705], currency: 'EUR', kgPerUnit: 100 },
          uk: { price: 724.00, changePct: 1.5, history: [705, 710, 714, 717, 719, 721, 724], currency: 'GBP', kgPerUnit: 100 },
          footnoteKey: 'cordero',
          countryFactors: { es: 1, de: 0.965, fr: 0.900, it: 0.815 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (cordero)' }, eu: { type: 'referencia', market: 'Comisión Europea (ovino)' }, uk: { type: 'referencia', market: 'AHDB (GB deadweight, cordero NSL)' } } }
      ]
    },
    {
      id: 'avicultura', nameKey: 'avicultura',
      products: [
        { nameKey: 'huevos', imperialUnitKey: 'docena', imperialKgPerUnit: 1, metricUnitKey: 'docena', metricKgPerUnit: 1,
          us: { price: 2.35, changePct: 0.6, history: [2.05, 2.15, 2.20, 2.28, 2.30, 2.33, 2.35], currency: 'USD', kgPerUnit: 1 },
          eu: { price: 1.55, changePct: 0.4, history: [1.42, 1.46, 1.48, 1.50, 1.52, 1.54, 1.55], currency: 'EUR', kgPerUnit: 1 },
          countryFactors: { es: 1, de: 0.907, fr: 1.088, it: 1.243 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (huevo)' }, eu: { type: 'referencia', market: 'Comisión Europea (huevo)' } } },
        { nameKey: 'pollo', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'kg', metricKgPerUnit: 1,
          us: { price: 1.35, changePct: 0.3, history: [1.28, 1.30, 1.31, 1.33, 1.34, 1.345, 1.35], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 2.05, changePct: 0.3, history: [1.95, 1.98, 2.00, 2.02, 2.03, 2.04, 2.05], currency: 'EUR', kgPerUnit: 1 },
          countryFactors: { es: 1, de: 1.961, fr: 1.574, it: 1.574 },
          quoteTypes: { us: { type: 'referencia', market: 'USDA AMS (aves)' }, eu: { type: 'referencia', market: 'Comisión Europea (pollo)' } } }
      ]
    },
    {
      id: 'pienso', nameKey: 'pienso',
      products: [
        { nameKey: 'pienso', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 318, changePct: 0.3, history: [310, 312, 315, 313, 316, 317, 318], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 312, changePct: 0.3, history: [305, 307, 309, 308, 310, 311, 312], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'pienso',
          quoteTypes: { us: { type: 'indice', market: 'USDA' }, eu: { type: 'indice', market: 'Comisión Europea (índices regionales)' } } },
        { nameKey: 'harina_soja', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 335, changePct: 0.6, history: [325, 328, 330, 332, 331, 333, 335], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 485, changePct: 0.5, history: [470, 475, 478, 480, 482, 484, 485], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'harina_soja',
          uk: { price: 355.00, changePct: 5.65, history: [340, 343, 346, 349, 351, 353, 355], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'futuro', market: 'CME (harina de soja)' }, eu: { type: 'futuro', market: 'Euronext (colza)' }, uk: { type: 'indice', market: 'Farmers Weekly (mercado del Reino Unido)' } } }
      ]
    },
    {
      id: 'fertilizantes', nameKey: 'fertilizantes',
      products: [
        { nameKey: 'urea', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 489, changePct: 0.6, history: [470, 475, 480, 478, 482, 486, 489], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 455, changePct: 0.7, history: [440, 443, 447, 445, 449, 452, 455], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 476.00, changePct: 0.5, history: [465, 468, 470, 472, 474, 475, 476], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'DTN Fertilizer Index' }, eu: { type: 'referencia', market: 'Banco Mundial' }, uk: { type: 'indice', market: 'AHDB (urea granulada 46% N, cotización media GB)' } } },
        { nameKey: 'dap', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 735, changePct: 0.7, history: [710, 715, 720, 722, 725, 730, 735], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 690, changePct: 0.7, history: [660, 665, 670, 675, 680, 685, 690], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 794.00, changePct: 0.4, history: [780, 783, 786, 789, 791, 792, 794], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'DTN Fertilizer Index' }, eu: { type: 'referencia', market: 'Banco Mundial' }, uk: { type: 'indice', market: 'AHDB (DAP, cotización media GB)' } } },
        { nameKey: 'potasa', imperialUnitKey: 'ton_corta', imperialKgPerUnit: 907.185, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 480, changePct: 0.4, history: [460, 465, 470, 472, 475, 478, 480], currency: 'USD', kgPerUnit: 907.185 },
          eu: { price: 445, changePct: 0.5, history: [425, 430, 435, 438, 440, 443, 445], currency: 'EUR', kgPerUnit: 1000 },
          uk: { price: 367.00, changePct: 0.3, history: [358, 360, 362, 363, 364, 366, 367], currency: 'GBP', kgPerUnit: 1000 },
          quoteTypes: { us: { type: 'indice', market: 'DTN Fertilizer Index' }, eu: { type: 'referencia', market: 'Banco Mundial' }, uk: { type: 'indice', market: 'AHDB (MOP/potasa, cotización media GB)' } } }
      ]
    },
    {
      id: 'azucar', nameKey: 'azucar',
      products: [
        { nameKey: 'azucar', imperialUnitKey: 'lb', imperialKgPerUnit: 0.453592, metricUnitKey: 'tonelada', metricKgPerUnit: 1000,
          us: { price: 0.41, changePct: 0.2, history: [0.39, 0.395, 0.40, 0.405, 0.408, 0.41, 0.41], currency: 'USD', kgPerUnit: 0.453592 },
          eu: { price: 490, changePct: 0.4, history: [470, 475, 480, 483, 486, 488, 490], currency: 'EUR', kgPerUnit: 1000 },
          footnoteKey: 'azucar',
          quoteTypes: { us: { type: 'referencia', market: 'USDA ERS' }, eu: { type: 'referencia', market: 'Comisión Europea' } } }
      ]
    },
    {
      id: 'aceite', nameKey: 'aceite',
      products: [
        { nameKey: 'oliva', imperialUnitKey: 'gal', imperialKgPerUnit: 3.41, metricUnitKey: '100kg', metricKgPerUnit: 100,
          us: { price: 27.50, changePct: 0.4, history: [26.20, 26.60, 26.90, 27.10, 27.25, 27.40, 27.50], currency: 'USD', kgPerUnit: 3.41 },
          eu: { price: 430, changePct: -0.6, history: [455, 448, 442, 438, 434, 432, 430], currency: 'EUR', kgPerUnit: 100 },
          footnoteKey: 'aceite',
          countryFactors: { es: 1, it: 1.389 } }
      ]
    }
  ];

  // --- Gasóleo agrícola / diésel (Energía) ---------------------------------
  var LITRO_KG = 0.835;
  var GAL_KG = LITRO_KG * 3.78541;
  var DIESEL_US_NATIONAL = { price: 6.529, changePct: 0.8, history: [6.42, 6.45, 6.48, 6.46, 6.50, 6.51, 6.529], currency: 'USD', kgPerUnit: GAL_KG };
  var DIESEL_EU_NATIONAL = { price: 2.138, changePct: 1.1, history: [2.08, 2.09, 2.11, 2.10, 2.12, 2.13, 2.138], currency: 'EUR', kgPerUnit: LITRO_KG };
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
      currency: rawEu.currency,
      kgPerUnit: rawEu.kgPerUnit
    };
  }

  // --- Histórico ampliado (30/90/365/1825 días) -----------------------------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashSeed(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return h >>> 0;
  }
  function dateForOffset(offsetFromEnd) {
    var d = new Date();
    d.setDate(d.getDate() - offsetFromEnd);
    return d;
  }
  function genLongHistory(region, seedKey) {
    var days = 1825;
    var rand = mulberry32(hashSeed(seedKey));
    var diffs = [];
    for (var i = 1; i < region.history.length; i++) {
      var prevV = region.history[i - 1];
      if (prevV) diffs.push(Math.abs(region.history[i] - prevV) / prevV);
    }
    var vol = diffs.length ? (diffs.reduce(function (a, b) { return a + b; }, 0) / diffs.length) : 0.01;
    vol = Math.max(vol, 0.004);
    var amp = Math.min(vol * 6, 0.12);
    var phase = rand() * Math.PI * 2;
    var base = new Array(days);
    base[days - 1] = 1;
    for (var d = days - 2; d >= 0; d--) {
      var noise = (rand() - 0.5) * 2 * vol;
      base[d] = base[d + 1] * (1 + noise);
    }
    var raw = base.map(function (v, d2) {
      var seasonal = 1 + amp * Math.sin((2 * Math.PI * d2 / 365) + phase);
      return v * seasonal;
    });
    var scale = region.price / raw[days - 1];
    var floor = region.price * 0.15;
    return raw.map(function (v) { return Math.max(v * scale, floor); });
  }
  function buildHistoryView(region, labelText, targetCcy, targetKgPerUnit, targetUnitLabel, fx, seedKey, days, T) {
    var factor = computeFactor(region, targetCcy, targetKgPerUnit, fx);
    var full = genLongHistory(region, seedKey);
    var slice = full.slice(full.length - days);
    var converted = slice.map(function (v) { return v * factor; });
    var symbol = CCY_SYMBOL[targetCcy] || targetCcy;
    var minV = Math.min.apply(null, converted);
    var maxV = Math.max.apply(null, converted);
    var avgV = converted.reduce(function (a, b) { return a + b; }, 0) / converted.length;
    var firstV = converted[0];
    var lastV = converted[converted.length - 1];
    var pctChange = firstV ? ((lastV - firstV) / firstV) * 100 : 0;
    return {
      label: labelText,
      price: symbol + fmtNumber(lastV),
      unit: '/' + targetUnitLabel,
      changeLabel: fmtChange(pctChange),
      changeColor: changeColor(pctChange, T),
      sparkPath: spark(converted, 560, 170, 14),
      sparkColor: trendColor(converted, T),
      minLabel: symbol + fmtNumber(minV),
      maxLabel: symbol + fmtNumber(maxV),
      avgLabel: symbol + fmtNumber(avgV)
    };
  }
  function pctSeries(arr) {
    var base = arr[0] || 1;
    return arr.map(function (v) { return ((v - base) / base) * 100; });
  }
  function rawHistorySlice(region, seedKey, days, offsetFromEnd) {
    var full = genLongHistory(region, seedKey);
    var end = full.length - (offsetFromEnd || 0);
    var start = Math.max(0, end - days);
    return full.slice(start, end);
  }
  function buildComparePair(a, aLabel, b, bLabel, T) {
    var min = Math.min(Math.min.apply(null, a), Math.min.apply(null, b));
    var max = Math.max(Math.max.apply(null, a), Math.max.apply(null, b));
    return {
      primaryPath: sparkShared(a, min, max, 560, 170, 14),
      comparePath: sparkShared(b, min, max, 560, 170, 14),
      primaryLabel: aLabel,
      compareLabel: bLabel,
      primaryChangeLabel: fmtChange(a[a.length - 1]),
      primaryChangeColor: changeColor(a[a.length - 1], T),
      compareChangeLabel: fmtChange(b[b.length - 1]),
      compareChangeColor: changeColor(b[b.length - 1], T)
    };
  }
  function exportHistoryCsv(csvHeaderDate, csvHeaderPrice, productKey, region, regionCode, seedKey, days, targetKgPerUnit, targetUnitLabel, targetCcy, fx) {
    try {
      if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return;
      var factor = computeFactor(region, targetCcy, targetKgPerUnit, fx);
      var full = genLongHistory(region, seedKey);
      var slice = full.slice(full.length - days);
      var lines = [csvHeaderDate + ',' + csvHeaderPrice + ' (' + targetCcy + '/' + targetUnitLabel + ')'];
      for (var i = 0; i < slice.length; i++) {
        var offset = slice.length - 1 - i;
        var iso = dateForOffset(offset).toISOString().slice(0, 10);
        lines.push(iso + ',' + (slice[i] * factor).toFixed(4));
      }
      var csv = '﻿' + lines.join('\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'dehesa-index-' + productKey + '-' + regionCode + '-' + days + 'd.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1000);
    } catch (e) {}
  }

  var HISTORY_RANGE_ORDER = ['1d', '1w', '1m', '3m', 'ytd', '1y', '5y', 'max'];
  var HISTORY_RANGE_DAYS = { '1d': 2, '1w': 7, '1m': 30, '3m': 90, 'ytd': 269, '1y': 365, '5y': 1825, 'max': 1825 };
  var HISTORY_COMPARE_PRESETS = [
    ['cereales-trigo', 'cereales-maiz'],
    ['lacteos-leche', 'pienso-pienso'],
    ['cereales-trigo', 'fertilizantes-urea']
  ];

  global.DehesaData = {
    FX: FX, FX_DATE: FX_DATE, formatFxDate: formatFxDate, CCY_SYMBOL: CCY_SYMBOL, UNIT_LABELS: UNIT_LABELS, REGION: REGION,
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
    mulberry32: mulberry32, hashSeed: hashSeed, dateForOffset: dateForOffset, genLongHistory: genLongHistory,
    buildHistoryView: buildHistoryView, pctSeries: pctSeries, rawHistorySlice: rawHistorySlice,
    buildComparePair: buildComparePair, exportHistoryCsv: exportHistoryCsv,
    HISTORY_RANGE_ORDER: HISTORY_RANGE_ORDER, HISTORY_RANGE_DAYS: HISTORY_RANGE_DAYS, HISTORY_COMPARE_PRESETS: HISTORY_COMPARE_PRESETS
  };
})(window);
