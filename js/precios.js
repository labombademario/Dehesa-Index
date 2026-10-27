/* Dehesa Index — página de Precios (núcleo): cabecera, ticker, buscador,
   ubicación (EE. UU./Europa/Reino Unido) + país UE, favoritos, pestañas de
   categoría, tarjetas de producto con desglose de fuentes, los modales de
   Histórico ampliado, Calculadora de coste y Alerta de precio, y las 3
   pestañas informativas propias (Seguro agrario, Vino a granel, Madera:
   estadísticas oficiales reales comparadas lado a lado, sin tarjeta de
   producto/histórico/calculadora/alertas -- ver INFO_CATS/renderInfoCategoryHtml).
   Vanilla JS / ES5, sin frameworks ni build step. Se apoya en window.DehesaData
   (js/data.js) y window.DehesaPreciosI18n (js/precios-i18n.js). Expone
   window.DehesaPreciosCore al final del archivo para que js/precios-intel.js
   (Market Map, Momentum, Correlación, Volatilidad, Estacionalidad, Local vs.
   Global, Spreads, Margen del productor) reutilice el mismo índice de
   productos y ubicación. */
(function (global) {
  'use strict';
  var D = global.DehesaData;
  var UIALL = global.DehesaPreciosI18n;
  var S = global.DehesaShared;
  var esc = S.esc;

  // ---------------------------------------------------------------------
  // Tema (colores de gráfico) -- mismos hex que css/style.css
  // ---------------------------------------------------------------------
  var THEME = {
    light: { positive: '#276A43', negative: '#B23A34', neutral: '#6B6652', compareLine: '#3B6EA8' },
    dark: { positive: '#4FCB77', negative: '#E8776D', neutral: '#8F8A74', compareLine: '#7FB2E8' }
  };
  function T() { return THEME[S.getTheme()] || THEME.light; }
  function lang() { return S.getLang(); }
  function ui() { return UIALL[lang()] || UIALL.es; }

  // ---------------------------------------------------------------------
  // localStorage helpers
  // ---------------------------------------------------------------------
  function readLS(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function writeLS(key, v) { try { window.localStorage.setItem(key, v); } catch (e) {} }
  function readAlerts() { try { var raw=window.localStorage.getItem('dehesaIndexAlerts'); var v=raw?JSON.parse(raw):[]; return Array.isArray(v)?v:[]; } catch(e){ return []; } }
  function writeAlerts(arr) { try { window.localStorage.setItem('dehesaIndexAlerts',JSON.stringify(arr)); } catch(e) {} }
  function saveLocalAlert(a) {
    var arr=readAlerts().filter(function(x){return !(x.key===a.key&&x.region===a.region);});
    arr.unshift({key:a.key,region:a.region,direction:a.direction,threshold:Number(a.threshold),createdAt:new Date().toISOString()});
    writeAlerts(arr.slice(0,20));
  }
  function readFavorites() {
    try {
      var raw = window.localStorage.getItem('dehesaIndexFavorites');
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeFavorites(arr) { try { window.localStorage.setItem('dehesaIndexFavorites', JSON.stringify(arr)); } catch (e) {} }

  // ---------------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------------
  var CAT_ORDER = ['cereales', 'lacteos', 'ganado', 'porcino', 'ovino', 'avicultura', 'pienso', 'fertilizantes', 'azucar', 'aceite', 'tropicales', 'hortalizas', 'energia', 'seguro', 'vino', 'madera'];
  // Categorías informativas propias: no son "productos" con precio diario/
  // semanal (sin favoritos/histórico/calculadora/alertas) -- estadísticas
  // oficiales reales anuales o de campaña, ver renderInfoCategoryHtml().
  var INFO_CATS = { seguro: true, vino: true, madera: true, hortalizas: true };

  var EU_CC = ['es', 'at', 'be', 'bg', 'cy', 'cz', 'de', 'dk', 'ee', 'el', 'fi', 'fr', 'hr', 'hu', 'ie', 'it', 'lt', 'lv', 'nl', 'pl', 'pt', 'ro', 'se', 'si', 'sk'];
  function ccFlag(c) { var i = c === 'el' ? 'GR' : c.toUpperCase(); return String.fromCodePoint(127397 + i.charCodeAt(0), 127397 + i.charCodeAt(1)); }
  function ccName(c) { try { return new Intl.DisplayNames([lang()], { type: 'region' }).of(c === 'el' ? 'GR' : c.toUpperCase()); } catch (e) { return c.toUpperCase(); } }
  var SA_CC = ['ar', 'cl', 'uy'];   // países de Sudamérica con ficha en Dehesa Index
  var state = {
    saCountry: (function () { var v = readLS('dehesaIndexSaCountry'); return SA_CC.indexOf(v) >= 0 ? v : 'cl'; })(),
    location: (function () { var v = readLS('dehesaIndexLocation'); return (v === 'us' || v === 'eu' || v === 'uk' || v === 'ca' || v === 'sa') ? v : null; })(),
    euCountry: (function () { var v = readLS('dehesaIndexEuCountry'); return EU_CC.indexOf(v) >= 0 ? v : 'es'; })(),
    activeTab: 'cereales', wantTab: 'cereales',
    favorites: readFavorites(),
    searchQuery: '',
    expanded: {},
    history: null, // { key, region, range, compareMode, compareKey, yoy }
    calc: null,    // { key, region, mode }
    alert: null    // { key, region, direction, attempted, confirmed }
  };
  // Sin mercado guardado se deduce de la zona horaria (y si no, del idioma), sin ventana: la barra de ubicacion queda visible para cambiarlo (auditoria 8-oct-2026).
  var showLocationWelcome = false;
  function guessLocation() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton|Whitehorse|Yellowknife|Iqaluit|Glace_Bay|Goose_Bay|Swift_Current|Dawson_Creek|Fort_Nelson|Creston|Rankin_Inlet|Cambridge_Bay|Inuvik|Atikokan|Blanc-Sablon)$/.test(tz)) return 'ca';
    if (/^Europe\/(London|Belfast|Guernsey|Jersey|Isle_of_Man)$/.test(tz)) return 'uk';
    if (/^Europe\//.test(tz) || /^Atlantic\/(Canary|Madeira|Azores)$/.test(tz)) return 'eu';
    if (/^(America|Pacific\/Honolulu)/.test(tz)) return 'us';
    return lang() === 'en' ? 'us' : 'eu';
  }
  if (!state.location) state.location = guessLocation();

  // ---------------------------------------------------------------------
  // Base de productos (RAW + diésel sintético) -----------------------------
  // ---------------------------------------------------------------------
  var DIESEL_PRODUCT = {
    nameKey: 'diesel',
    imperialUnitKey: 'gal', imperialKgPerUnit: D.GAL_KG,
    metricUnitKey: 'litro', metricKgPerUnit: D.LITRO_KG,
    us: D.DIESEL_US_NATIONAL, eu: D.DIESEL_EU_NATIONAL, uk: D.DIESEL_UK_NATIONAL,
    quoteTypes: D.DIESEL_QUOTE_TYPES,
    footnoteKey: 'diesel',
    isEnergy: true
  };

  var PRODUCTS = []; // { catId, nameKey, product }
  var PRODUCT_BY_KEY = {};
  (function buildIndex() {
    for (var i = 0; i < D.RAW.length; i++) {
      var cat = D.RAW[i];
      for (var j = 0; j < cat.products.length; j++) {
        var p = cat.products[j];
        var entry = { catId: cat.id, nameKey: p.nameKey, product: p };
        PRODUCTS.push(entry);
        PRODUCT_BY_KEY[cat.id + ':' + p.nameKey] = entry;
      }
    }
    var energiaEntry = { catId: 'energia', nameKey: 'diesel', product: DIESEL_PRODUCT };
    PRODUCTS.push(energiaEntry);
    PRODUCT_BY_KEY['energia:diesel'] = energiaEntry;
  })();

  // ---------------------------------------------------------------------
  // Datos publicados: la interfaz conserva RAW como respaldo offline, pero
  // sustituye una cotización solamente cuando data/latest.json aporta una
  // observación verificada con la misma fuente, moneda, unidad y frecuencia.
  // Así un fallo de red o una fuente pendiente nunca convierte una muestra en
  // un precio aparentemente real.
  // ---------------------------------------------------------------------
  var LIVE_OBSERVATION_MAP = {
    'maiz:us': { key: 'cereales:maiz', sourceId: 'usda_nass', currency: 'USD', unit: 'bushel', frequency: 'monthly' },
    'trigo:us': { key: 'cereales:trigo', sourceId: 'usda_nass', currency: 'USD', unit: 'bushel', frequency: 'monthly' },
    'arroz:us': { key: 'cereales:arroz', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'cebada:us': { key: 'cereales:cebada', sourceId: 'usda_nass', currency: 'USD', unit: 'bushel', frequency: 'monthly' },
    'trigo_duro:eu': { key: 'cereales:trigo_duro', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'cebada:eu': { key: 'cereales:cebada', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'avena:us': { key: 'cereales:avena', sourceId: 'usda_nass', currency: 'USD', unit: 'bushel', frequency: 'monthly' },
    'avena:eu': { key: 'cereales:avena', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'colza:us': { key: 'cereales:colza', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'colza:eu': { key: 'cereales:colza', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'centeno:eu': { key: 'cereales:centeno', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'mantequilla:eu': { key: 'lacteos:mantequilla', sourceId: 'eu_agrifood', currency: 'EUR', unit: '100kg', frequency: 'weekly' },
    'leche_polvo:us': { key: 'lacteos:leche_polvo', sourceId: 'usda_ams_mars', currency: 'USD', unit: 'lb', frequency: 'weekly' },
    'leche_polvo:eu': { key: 'lacteos:leche_polvo', sourceId: 'eu_agrifood', currency: 'EUR', unit: '100kg', frequency: 'weekly' },
    'sorgo:us': { key: 'cereales:sorgo', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'soja_grano:us': { key: 'cereales:soja_grano', sourceId: 'usda_nass', currency: 'USD', unit: 'bushel', frequency: 'monthly' },
    'lenteja:us': { key: 'cereales:lenteja', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'guisante_seco:us': { key: 'cereales:guisante_seco', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'lino:us': { key: 'cereales:lino', sourceId: 'usda_nass', currency: 'USD', unit: 'bushel', frequency: 'monthly' },
    'cordero:us': { key: 'ovino:cordero', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'azucar:us': { key: 'azucar:azucar', sourceId: 'usda_ers', currency: 'USD', unit: 'lb', frequency: 'monthly' },
    'leche:us': { key: 'lacteos:leche', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'leche:uk': { key: 'lacteos:leche', sourceId: 'defra', currency: 'GBP', unit: '100kg', frequency: 'monthly' },
    'leche:eu': { key: 'lacteos:leche', sourceId: 'european_commission', currency: 'EUR', unit: '100kg', frequency: 'monthly' },
    'urea:eu': { key: 'fertilizantes:urea', sourceId: 'world_bank', currency: 'USD', unit: 'tonelada', frequency: 'monthly' },
    'vaca:eu': { key: 'ganado:vaca', sourceId: 'eu_agrifood', currency: 'EUR', unit: '100kg', frequency: 'weekly' },
    'cordero:eu': { key: 'ovino:cordero', sourceId: 'eu_agrifood', currency: 'EUR', unit: '100kg', frequency: 'weekly' },
    'cerdo:us': { key: 'porcino:cerdo', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'vaca:us': { key: 'ganado:vaca', sourceId: 'usda_nass', currency: 'USD', unit: 'cwt', frequency: 'monthly' },
    'pollo:us': { key: 'avicultura:pollo', sourceId: 'usda_nass', currency: 'USD', unit: 'lb', frequency: 'monthly' },
    'harina_soja:us': { key: 'pienso:harina_soja', sourceId: 'usda_ams_mars', currency: 'USD', unit: 'ton_corta', frequency: 'weekly' },
    'harina_soja:eu': { key: 'pienso:harina_soja', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'huevos:us': { key: 'avicultura:huevos', sourceId: 'usda_nass', currency: 'USD', unit: 'docena', frequency: 'monthly' },
    'huevos:eu': { key: 'avicultura:huevos', sourceId: 'eu_agrifood', currency: 'EUR', unit: '100kg', frequency: 'weekly' },
    'pollo:eu': { key: 'avicultura:pollo', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'kg', frequency: 'weekly' },
    'azucar:eu': { key: 'azucar:azucar', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'monthly' },
    'oliva:eu': { key: 'aceite:oliva', sourceId: 'eu_agrifood', currency: 'EUR', unit: '100kg', frequency: 'weekly' },
    'arroz:eu': { key: 'cereales:arroz', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'maiz:eu': { key: 'cereales:maiz', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'trigo:eu': { key: 'cereales:trigo', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'weekly' },
    'dap:eu': { key: 'fertilizantes:dap', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'monthly' },
    'potasa:eu': { key: 'fertilizantes:potasa', sourceId: 'eu_agrifood', currency: 'EUR', unit: 'tonelada', frequency: 'monthly' },
    'cerdo:eu': { key: 'porcino:cerdo', sourceId: 'eu_agrifood', currency: 'EUR', unit: '100kg', frequency: 'weekly' },
    'trigo:ca': { key: 'cereales:trigo', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'cebada:ca': { key: 'cereales:cebada', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'avena:ca': { key: 'cereales:avena', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'colza:ca': { key: 'cereales:colza', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'maiz:ca': { key: 'cereales:maiz', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'leche:ca': { key: 'lacteos:leche', sourceId: 'statcan', currency: 'CAD', unit: '100kg', frequency: 'monthly' },
    'vaca:ca': { key: 'ganado:vaca', sourceId: 'statcan', currency: 'CAD', unit: 'cwt', frequency: 'monthly' },
    'cerdo:ca': { key: 'porcino:cerdo', sourceId: 'statcan', currency: 'CAD', unit: 'cwt', frequency: 'monthly' },
    'cordero:ca': { key: 'ovino:cordero', sourceId: 'statcan', currency: 'CAD', unit: 'cwt', frequency: 'monthly' },
    'pollo:ca': { key: 'avicultura:pollo', sourceId: 'statcan', currency: 'CAD', unit: 'kg', frequency: 'monthly' },
    'huevos:ca': { key: 'avicultura:huevos', sourceId: 'statcan', currency: 'CAD', unit: 'docena', frequency: 'monthly' },
    'soja_grano:ca': { key: 'cereales:soja_grano', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'lenteja:ca': { key: 'cereales:lenteja', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'guisante_seco:ca': { key: 'cereales:guisante_seco', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'lino:ca': { key: 'cereales:lino', sourceId: 'statcan', currency: 'CAD', unit: 'tonelada', frequency: 'monthly' },
    'canola_elevador:ca': { key: 'cereales:canola_elevador', sourceId: 'alberta_ag', currency: 'CAD', unit: 'tonelada', frequency: 'weekly' },
    'trigo_pienso_ab:ca': { key: 'cereales:trigo_pienso_ab', sourceId: 'alberta_ag', currency: 'CAD', unit: 'tonelada', frequency: 'weekly' },
    'cebada_pienso_ab:ca': { key: 'cereales:cebada_pienso_ab', sourceId: 'alberta_ag', currency: 'CAD', unit: 'tonelada', frequency: 'weekly' },
    'avena_pienso_ab:ca': { key: 'cereales:avena_pienso_ab', sourceId: 'alberta_ag', currency: 'CAD', unit: 'tonelada', frequency: 'weekly' },
    'trigo_cwrs_ab:ca': { key: 'cereales:trigo_cwrs_ab', sourceId: 'alberta_ag', currency: 'CAD', unit: 'tonelada', frequency: 'weekly' },
    'lenteja_laird_ab:ca': { key: 'cereales:lenteja_laird_ab', sourceId: 'alberta_ag', currency: 'CAD', unit: 'tonelada', frequency: 'weekly' },
    'guisante_verde_ab:ca': { key: 'cereales:guisante_verde_ab', sourceId: 'alberta_ag', currency: 'CAD', unit: 'tonelada', frequency: 'weekly' },
    'novillo_ab:ca': { key: 'ganado:novillo_ab', sourceId: 'alberta_ag', currency: 'CAD', unit: 'cwt', frequency: 'weekly' },
    'cerdo_ab:ca': { key: 'porcino:cerdo_ab', sourceId: 'alberta_ag', currency: 'CAD', unit: 'kg', frequency: 'weekly' },
    'gas_natural:us': { key: 'energia:gas_natural', sourceId: 'eia', currency: 'USD', unit: 'mmbtu', frequency: 'weekly' },
    'gas_natural:eu': { key: 'energia:gas_natural', sourceId: 'world_bank', currency: 'USD', unit: 'mmbtu', frequency: 'monthly' },
    'petroleo_wti:us': { key: 'energia:petroleo_wti', sourceId: 'eia', currency: 'USD', unit: 'barril', frequency: 'weekly' },
    'petroleo_brent:eu': { key: 'energia:petroleo_brent', sourceId: 'eia', currency: 'USD', unit: 'barril', frequency: 'weekly' },
    'diesel:us': { key: 'energia:diesel', sourceId: 'eia', currency: 'USD', unit: 'gal', frequency: 'weekly' },
    'diesel:eu': { key: 'energia:diesel', sourceId: 'eu_oil_bulletin', currency: 'EUR', unit: 'litro', frequency: 'weekly' }
  };
  // Canadá (abonos, energía, piensos, precios al por menor): una entrada por fila de DehesaData.CA_PANEL (js/data.js), misma clave que scripts/build-ca-panel-obs.py
  (global.DehesaData && global.DehesaData.CA_PANEL || []).forEach(function (r) { LIVE_OBSERVATION_MAP[r[0] + ':ca'] = { key: r[1] + ':' + r[0], sourceId: r[14], currency: 'CAD', unit: r[6], frequency: 'monthly' }; });

  // Reino Unido (combustible DESNZ, vacuno y cordero en canal de Irlanda del Norte DAERA, huevos Defra): una entrada por fila de DehesaData.UK_PANEL, misma clave que scripts/build-uk-panel-obs.py
  (global.DehesaData && global.DehesaData.UK_PANEL || []).forEach(function (r) { LIVE_OBSERVATION_MAP[r[0] + ':uk'] = { key: r[1] + ':' + r[0], sourceId: r[14], currency: 'GBP', unit: r[6], frequency: r[15] }; });

  // Banco Mundial (Pink Sheet): una entrada por fila de DehesaData.WB_PANEL, región 'eu', USD, mensual; misma clave que scripts/build-wb-panel-obs.py
  (global.DehesaData && global.DehesaData.WB_PANEL || []).forEach(function (r) { LIVE_OBSERVATION_MAP[r[0] + ':eu'] = { key: r[1] + ':' + r[0], sourceId: r[14], currency: 'USD', unit: r[6], frequency: r[15] }; });
  // Colza física de la Comisión Europea (EUP_PANEL): región 'eu', EUR, semanal; misma clave que scripts/build-eu-oilseeds-panel-obs.py
  (global.DehesaData && global.DehesaData.EUP_PANEL || []).forEach(function (r) { LIVE_OBSERVATION_MAP[r[0] + ':eu'] = { key: r[1] + ':' + r[0], sourceId: r[14], currency: 'EUR', unit: r[6], frequency: r[15] }; });

  // EE. UU. (lácteos de AMS, bioenergía de ERS): una entrada por fila de DehesaData.US_PANEL; misma clave que scripts/build-us-panel-obs.py
  (global.DehesaData && global.DehesaData.US_PANEL || []).forEach(function (r) { LIVE_OBSERVATION_MAP[r[0] + ':us'] = { key: r[1] + ':' + r[0], sourceId: r[14], currency: 'USD', unit: r[6], frequency: r[15] }; });

  function numericHistory(observation) {
    // El minigráfico de la tarjeta usa solo los últimos 104 valores (`spark`, ya recortados en data/prices/latest/<region>.json);
    // el histórico completo con fechas (histPts) se descarga aparte, solo cuando se abre el gráfico (loadHistory).
    var values = (Array.isArray(observation.spark) ? observation.spark : []).map(Number).filter(function (value) { return Number.isFinite(value); });
    return values.length >= 2 ? values : null;
  }

  function observationMatchesContract(observation, contract) {
    return observation && contract && observation.status === 'verified' &&
      observation.sourceId === contract.sourceId && observation.currency === contract.currency &&
      observation.unit === contract.unit && observation.frequency === contract.frequency &&
      Number.isFinite(Number(observation.value));
  }

  function applyPublishedObservation(observation) {
    var contract = LIVE_OBSERVATION_MAP[observation.product + ':' + observation.region];
    if (!observationMatchesContract(observation, contract)) return false;
    var entry = PRODUCT_BY_KEY[contract.key];
    if (!entry) return false;
    var region = entry.product[observation.region];
    if (!region) return false;
    var history = numericHistory(observation);
    region.price = Number(observation.value);
    if (history) region.history = history;
    // el histórico con fechas reales (modal, mapa de mercado, estacionalidad) se descarga bajo demanda (loadHistory); aquí solo se anota de dónde
    region.histSrc = { region: observation.region, product: observation.product };
    // hasta que se descargue el historico completo, histPts = ultimos 30 puntos con fecha (suficientes para variaciones a 1-3 meses y el mapa de mercado)
    var recent = datedPoints(observation.recent);
    region.histPts = recent.length >= 2 ? recent : null; region.histFull = false; region.histP = null; region.histDone = false;
    region.histGran = observation.frequency === 'monthly' || observation.frequency === 'quarterly' ? 'month' : 'day';
    if (Number.isFinite(Number(observation.changePct))) region.changePct = Number(observation.changePct);

    var trustKey = contract.key.replace(':', '-') + '-' + observation.region;
    var trust = D.DATA_TRUST && D.DATA_TRUST[trustKey];
    if (trust) {
      trust.value = region.price;
      trust.status = observation.status;
      trust.obsId = observation.id || null; trust.obsSource = observation.sourceId || null; trust.obsUnit = observation.unit || null; trust.obsCcy = observation.currency || null;
      trust.observationDate = observation.observationDate || null;
      trust.publicationDate = observation.publicationDate || null;
      trust.verifiedAt = observation.verifiedAt || null;
      trust.methodology = observation.methodology || trust.methodology;
      trust.comparability = observation.comparability || trust.comparability;
    }
    return true;
  }

  function datedPoints(list) {
    return (Array.isArray(list) ? list : []).map(function (point) {
      return { ts: window.DehesaChart ? window.DehesaChart.histTs(point) : NaN, value: Number(point && point.value) };
    }).filter(function (point) { return Number.isFinite(point.ts) && Number.isFinite(point.value); }).sort(function (a, b) { return a.ts - b.ts; });
  }
  // La serie «Natural gas, Europe» del Banco Mundial es el TTF solo desde abril de 2015; antes es un precio de importación en frontera (no es TTF
  // ni cotiza en euros por MWh). Esos meses no se muestran: la tarjeta se llama TTF y se convierte a €/MWh.
  function usableHistory(region, pts) {
    var src = region && region.histSrc;
    if (src && src.product === 'gas_natural' && src.region === 'eu') { var from = Date.UTC(2015, 3, 1); return pts.filter(function (p) { return p.ts >= from; }); }
    return pts;
  }
  // Histórico completo con fechas de UNA región de producto (data/prices/history/<region>/<producto>.json), solo cuando hace falta.
  function loadHistory(region) {
    if (!region || !region.histSrc) return Promise.resolve();
    if (region.histFull) return Promise.resolve();
    if (region.histP) return region.histP;
    return region.histP = window.DIPrices.history(region.histSrc.region, region.histSrc.product).then(function (doc) {
      var dated = usableHistory(region, datedPoints(doc && doc.history));
      if (dated.length >= 2) { region.histPts = dated; region.histFull = true; }
      region.histDone = true;
    }).catch(function () { region.histDone = true; });
  }
  // Regiones base (us/eu/ca/uk) con dato publicado de un producto o de todos
  function historyRegions(entries) {
    var out = [];
    entries.forEach(function (e) { ['us', 'eu', 'ca', 'uk'].forEach(function (rc) { var r = e.product[rc]; if (r && r.histSrc && out.indexOf(r) < 0) out.push(r); }); });
    return out;
  }
  function ensureHistory(keys) {
    var entries = (keys || []).map(function (k) { return PRODUCT_BY_KEY[k]; }).filter(Boolean);
    return Promise.all(historyRegions(entries).map(loadHistory));
  }
  // Para el mapa de mercado y la inteligencia: todos los productos (concurrencia limitada en DIPrices.histories)
  var ALL_HIST = null, PRICES_DONE = null, pricesDone = function () {};
  PRICES_DONE = new Promise(function (res) { pricesDone = function () { state.pricesSettled = true; res(); }; });  // se cumple cuando ya se aplico (o fallo) la carga de data/prices/latest
  function ensureAllHistory() {
    if (ALL_HIST) return ALL_HIST;
    return ALL_HIST = PRICES_DONE.then(allHistory);
  }
  function allHistory() {
    var regs = historyRegions(PRODUCTS), pending = regs.filter(function (r) { return !r.histFull && !r.histP; });
    var list = pending.map(function (r) { return r.histSrc; });
    return window.DIPrices.histories(list).then(function (docs) {
      docs.forEach(function (doc, i) {
        var region = pending[i]; if (!doc) { region.histP = null; return; }
        var dated = usableHistory(region, datedPoints(doc.history));
        if (dated.length >= 2) { region.histPts = dated; region.histFull = true; region.histP = Promise.resolve(); }
        region.histDone = true;
      });
      return Promise.all(regs.map(loadHistory));  // lo que haya fallado se reintenta una vez de forma individual
    });
  }

  // Gasoleo por pais (DE/FR/ES/IT): valores observados del Boletin Semanal del Petroleo (CE), publicados por scripts/update-ec-diesel-eu.py.
  function loadDieselCountries() {
    if (typeof global.fetch !== 'function') return;
    global.fetch('data/diesel-eu-countries.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.countries) return;
      var changed = false;
      D.DIESEL_EU_COUNTRIES.forEach(function (r) {
        var c = d.countries[r.code];
        if (!c || !c.points || c.points.length < 2) return;
        var pts = c.points.map(function (q) { var t = q[0].split('-'); return { ts: Date.UTC(+t[0], +t[1] - 1, +t[2]), value: Number(q[1]) }; }).filter(function (q) { return Number.isFinite(q.value); });
        if (pts.length < 2) return;
        r.price = pts[pts.length - 1].value; r.changePct = c.changePct; r.history = pts.slice(-7).map(function (q) { return q.value; });
        r.histPts = pts; r.histFull = true; r.histGran = 'day'; r.observed = true; r.observationDate = c.observationDate; changed = true;
      });
      if (changed) renderAll();
    }).catch(function () {});
  }

  function loadPublishedPrices() {
    if (typeof global.fetch !== 'function' || !global.DIPrices) return;
    global.DIPrices.latest()
      .then(function (observations) {
        var changed = false;
        // forEach y no some(): some() se detiene en la primera observación aplicada y el resto nunca se superponía
        observations.forEach(function (o) { if (applyPublishedObservation(o)) changed = true; });
        ukIdxObs = observations.filter(function (o) { return o && o.region === 'uk' && o.currency === 'INDEX' && o.status === 'verified' && UK_IDX[o.product]; });
        if (ukIdxObs.length && state.location === 'uk') changed = true;
        pricesDone();
        if (!changed) return;
        if (D.validateDataTrustRegistry) D.DATA_TRUST_HEALTH = D.validateDataTrustRegistry(D.DATA_TRUST);
        renderAll();
        document.dispatchEvent(new CustomEvent('dehesa:prices-data-ready'));
      })
      .catch(function () {
        // El respaldo integrado mantiene la página utilizable sin red.
        pricesDone();
      });
  }

  // Emoji solo para productos inconfundibles; decorativo (aria-hidden), sin emoji = sin icono
  var PRODUCT_EMOJI = { maiz: '🌽', trigo: '🌾', trigo_duro: '🌾', trigo_pienso_ab: '🌾', trigo_cwrs_ab: '🌾', vaca: '🐄', novillo_ab: '🐄', cerdo: '🐖', cerdo_ab: '🐖', pollo: '🐔', huevos: '🥚', leche: '🥛', mantequilla: '🧈', oliva: '🫒', cordero: '🐑', cabra: '🐐', gas_natural: '🔥', petroleo_brent: '🛢️', petroleo_wti: '🛢️', diesel: '⛽' };
  function productEmoji(nameKey) { return PRODUCT_EMOJI[nameKey] ? '<span class="di-emoji" aria-hidden="true">' + PRODUCT_EMOJI[nameKey] + '</span> ' : ''; }
  // En la UE la Comisión no publica DAP ni MOP sino un precio agregado por nutriente: con ubicación Europa se nombra así
  var EU_FERT = { dap: { es: 'Abonos fosfatados (P), agregado UE', en: 'Phosphate fertilisers (P), EU aggregate', fr: 'Engrais phosphatés (P), agrégat UE', it: 'Fertilizzanti fosfatici (P), aggregato UE' }, potasa: { es: 'Abonos potásicos (K), agregado UE', en: 'Potash fertilisers (K), EU aggregate', fr: 'Engrais potassiques (K), agrégat UE', it: 'Fertilizzanti potassici (K), aggregato UE' } };
  var GAS_NAME = { us: { es: 'Gas natural · Henry Hub (EE. UU.)', en: 'Natural gas · Henry Hub (US)', fr: 'Gaz naturel · Henry Hub (États-Unis)', it: 'Gas naturale · Henry Hub (USA)' }, eu: { es: 'Gas natural · TTF (Europa)', en: 'Natural gas · TTF (Europe)', fr: 'Gaz naturel · TTF (Europe)', it: 'Gas naturale · TTF (Europa)' } };
  function productName(nameKey, reg) { if (nameKey === 'gas_natural') { var g = GAS_NAME[(reg || state.location) === 'eu' ? 'eu' : 'us']; return g[lang()] || g.es; } if (EU_FERT[nameKey] && state.location === 'eu') return EU_FERT[nameKey][lang()] || EU_FERT[nameKey].es; return (D.NAMES[lang()] || D.NAMES.es)[nameKey] || nameKey; }
  function catLabel(catId) { var c = (D.CATS[lang()] || D.CATS.es)[catId]; return c ? c.label : catId; }
  function productsInCat(catId) {
    return PRODUCTS.filter(function (e) { return e.catId === catId; });
  }

  // ---------------------------------------------------------------------
  // Conversión de región según ubicación elegida
  // ---------------------------------------------------------------------
  function dieselCountryRegion(countryCode) {
    var key = D.DIESEL_COUNTRY_TO_KEY[countryCode];
    for (var i = 0; i < D.DIESEL_EU_COUNTRIES.length; i++) {
      if (D.DIESEL_EU_COUNTRIES[i].key === key) return D.DIESEL_EU_COUNTRIES[i];
    }
    return null;
  }

  // Devuelve { region, targetCcy, targetKgPerUnit, targetUnitLabel, quoteType, ukGap }
  // para el producto `entry` en la ubicación `loc` (y país `country` si loc==='eu').
  // Precio REAL de cada país de la UE (13-oct-2026, a petición de Mario): media nacional de la Comisión Europea para ese país
  // (data/app/v1/eu/<CC>.json, scripts/build-app-eu-countries.py). Sustituye a los countryFactors (precio de España × un factor fijo),
  // que mostraban en Alemania, Francia o Italia un dato que en realidad era de España. Si el país no tiene el producto, no se muestra.
  var SPAIN_ONLY = { arroz: 1, cebada: 1, cerdo: 1, colza: 1, cordero: 1, harina_soja: 1, huevos: 1, leche: 1, maiz: 1, oliva: 1, pollo: 1, trigo: 1, trigo_duro: 1, vaca: 1 };
  var CTRY = {}, CTRY_P = {}, CTRY_REG = {};
  function loadCountry(cc) {
    cc = String(cc || '').toUpperCase(); if (!cc || cc === 'ES' || CTRY[cc] || CTRY_P[cc]) return CTRY_P[cc] || Promise.resolve();
    var url = global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath('data/app/v1/eu/' + cc + '.json') : 'data/app/v1/eu/' + cc + '.json';
    return CTRY_P[cc] = fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var m = {}; ((d && d.prices) || []).forEach(function (q) { m[q.product] = q; }); CTRY[cc] = m; if (state.euCountry && state.euCountry.toUpperCase() === cc) renderAll();
    }).catch(function () { CTRY[cc] = {}; });
  }
  // ¿Ya llegó (o falló) la media nacional del país elegido? Hasta entonces una pestaña vacía puede ser solo «todavía no».
  function countrySettled() {
    if (state.location !== 'eu') return true;
    var cc = String(state.euCountry || 'es').toUpperCase();
    return cc === 'ES' || !!CTRY[cc];
  }
  function countryRegion(entry, country) {
    var cc = String(country || '').toUpperCase(), P = CTRY[cc] && CTRY[cc][entry.nameKey]; if (!P) return null;
    var key = entry.catId + '-' + entry.nameKey + '-eu-' + cc.toLowerCase();
    if (CTRY_REG[key]) return CTRY_REG[key];
    var div = entry.nameKey === 'pollo' ? 100 : 1;   // la Comisión da el pollo en EUR/100 kg; la tarjeta de España lo lleva en EUR/kg
    var pts = (P.points || []).map(function (q) { return { ts: Date.parse(q[0] + 'T00:00:00Z'), value: q[1] / div }; }).filter(function (q) { return isFinite(q.ts) && isFinite(q.value); });
    var reg = { price: P.value / div, changePct: P.changePct, history: pts.slice(-12).map(function (q) { return q.value; }), histPts: pts.length >= 2 ? pts : null, histFull: true, histDone: true,
      histGran: P.frequency === 'monthly' ? 'month' : 'day', currency: 'EUR', kgPerUnit: entry.product.eu ? entry.product.eu.kgPerUnit : 1000 };
    var base = D.DATA_TRUST && D.DATA_TRUST[entry.catId + '-' + entry.nameKey + '-eu'];
    if (D.DATA_TRUST && base) {
      var tr = {}; for (var k in base) tr[k] = base[k];
      tr.value = reg.price; tr.status = 'verified'; tr.obsId = P.id; tr.obsSource = P.sourceId || 'eu_agrifood'; tr.obsCcy = 'EUR'; tr.observationDate = P.date; tr.publicationDate = null;
      tr.methodology = P.note && P.note.es || tr.methodology; tr.frequency = P.frequency || tr.frequency; tr.ctyLabel = P.place;
      D.DATA_TRUST[key] = tr;
    }
    var lm = LIVE_OBSERVATION_MAP[entry.nameKey + ':eu']; if (lm) LIVE_OBSERVATION_MAP[entry.nameKey + ':eu-' + cc.toLowerCase()] = lm;
    return CTRY_REG[key] = reg;
  }
  function resolveDisplay(entry, loc, country) {
    var p = entry.product;
    var UL = D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es;
    if (loc === 'us') {
      return { region: p.us, regionCode: 'us', targetCcy: 'USD', targetKgPerUnit: p.imperialKgPerUnit, targetUnitLabel: UL[p.imperialUnitKey], quoteType: p.quoteTypes && p.quoteTypes.us, ukGap: false };
    }
    if (loc === 'eu') {
      var region = p.eu, derived = false, unverified = false;
      if (p.isEnergy) {
        var dr = dieselCountryRegion(country);
        if (dr && dr.observed) region = dr;
        else if (dr) unverified = true;
      } else if (country && country !== 'es' && SPAIN_ONLY[p.nameKey]) {
        var cr = countryRegion(entry, country);
        if (!cr) loadCountry(country);
        return { region: cr, regionCode: cr ? 'eu-' + country : 'eu', cty: cr ? country : null, targetCcy: 'EUR', targetKgPerUnit: p.metricKgPerUnit, targetUnitLabel: UL[p.metricUnitKey], quoteType: p.quoteTypes && p.quoteTypes.eu, ukGap: false, derived: false, unverified: false };
      }
      return { region: region, regionCode: 'eu', targetCcy: 'EUR', targetKgPerUnit: p.metricKgPerUnit, targetUnitLabel: UL[p.metricUnitKey], quoteType: p.quoteTypes && p.quoteTypes.eu, ukGap: false, derived: derived, unverified: unverified };
    }
    if (loc === 'sa') return { region: null, regionCode: 'sa', targetCcy: 'USD', targetKgPerUnit: p.metricKgPerUnit, targetUnitLabel: UL[p.metricUnitKey], quoteType: null, ukGap: true };   // Sudamérica: solo frutas y hortalizas (ODEPA, Chile); el resto de productos aún sin fuente con licencia
    if (loc === 'ca') {
      var caUnit = p.caUnitKey || p.metricUnitKey;
      if (p.ca) return { region: p.ca, regionCode: 'ca', targetCcy: 'CAD', targetKgPerUnit: p.caKgPerUnit || p.metricKgPerUnit, targetUnitLabel: UL[caUnit], quoteType: p.quoteTypes && p.quoteTypes.ca, ukGap: false };
      return { region: p.eu, regionCode: 'eu', targetCcy: 'EUR', targetKgPerUnit: p.metricKgPerUnit, targetUnitLabel: UL[p.metricUnitKey], quoteType: p.quoteTypes && p.quoteTypes.eu, ukGap: true };
    }
    // uk
    if (p.uk) {
      return { region: p.uk, regionCode: 'uk', targetCcy: 'GBP', targetKgPerUnit: p.metricKgPerUnit, targetUnitLabel: UL[p.metricUnitKey], quoteType: p.quoteTypes && p.quoteTypes.uk, ukGap: false };
    }
    return { region: p.eu, regionCode: 'eu', targetCcy: 'EUR', targetKgPerUnit: p.metricKgPerUnit, targetUnitLabel: UL[p.metricUnitKey], quoteType: p.quoteTypes && p.quoteTypes.eu, ukGap: true };
  }

  function availableRegions(entry) {
    var p = entry.product;
    var out = ['us', 'eu'];
    if (p.uk) out.push('uk');
    if (p.ca) out.push('ca');
    return out;
  }
  function defaultRegionFor(entry) {
    var avail = availableRegions(entry);
    return avail.indexOf(state.location) > -1 ? state.location : avail[0];
  }

  // ---------------------------------------------------------------------
  // Buscador
  // ---------------------------------------------------------------------
  function normalizeSearch(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  // ---------------------------------------------------------------------
  // Favoritos
  // ---------------------------------------------------------------------
  function isFavorite(key) { return state.favorites.indexOf(key) > -1; }
  function toggleFavorite(key) {
    var idx = state.favorites.indexOf(key);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
    } else {
      if (state.favorites.length >= 4) state.favorites.shift();
      state.favorites.push(key);
    }
    writeFavorites(state.favorites);
    renderAll();
  }

  // ---------------------------------------------------------------------
  // Render: cabecera
  // ---------------------------------------------------------------------
  function renderHead() {
    var t = ui();
    document.title = t.pageTitle + ' | Dehesa Index';
    document.getElementById('pr-title').textContent = t.pageTitle;
    document.getElementById('pr-badge').textContent = t.badge;
    document.getElementById('pr-subtitle').textContent = t.pageSubtitle;
    document.getElementById('pr-updated').textContent = t.updated;
    document.getElementById('pr-banner').textContent = t.banner;
    var ah = document.getElementById('pr-analysis-h'); if (ah) ah.textContent = ({ es: 'Análisis del mercado', en: 'Market analysis', fr: 'Analyse du marché', it: 'Analisi di mercato' })[lang()] || 'Análisis del mercado';
    var fs = document.getElementById('pr-fold-sum'); if (fs) fs.textContent = ({ es: 'Estado y verificación de los datos', en: 'Data status and verification', fr: 'État et vérification des données', it: 'Stato e verifica dei dati' })[lang()] || 'Estado y verificación de los datos';
  }

  // ---------------------------------------------------------------------
  // Render: ticker
  // ---------------------------------------------------------------------
  function renderTicker() {
    var root = document.getElementById('pr-ticker');
    var items = PRODUCTS.map(function (entry) {
      var disp = resolveDisplay(entry, state.location, state.euCountry);
      if (!disp.region) return ''; // producto sin dato en este mercado (p. ej. sorgo fuera de EE. UU.)
      if (!entryHasData(entry)) return ''; // solo lo verificado en este mercado (regla de cobertura)
      var built = D.buildRegion(disp.region, productName(entry.nameKey), disp.targetCcy, disp.targetKgPerUnit, disp.targetUnitLabel, D.FX, T());
      return (
        '<span class="di-ticker-item">' +
          '<span class="di-ticker-name">' + productEmoji(entry.nameKey) + esc(productName(entry.nameKey)) + '</span>' +
          '<span class="di-ticker-price">' + esc(built.price) + esc(built.unit) + '</span>' +
          '<span style="color:' + built.changeColor + ';font-weight:700;">' + esc(built.changeLabel) + '</span>' +
        '</span>'
      );
    }).join('');
    root.innerHTML = '<div class="di-ticker-track">' + items + items + '</div>';
  }

  // ---------------------------------------------------------------------
  // Render: buscador
  // ---------------------------------------------------------------------
  function renderSearchResults() {
    var resultsRoot = document.getElementById('pr-search-results');
    var clearBtn = document.getElementById('pr-search-clear');
    var q = normalizeSearch(state.searchQuery);
    clearBtn.style.display = state.searchQuery ? '' : 'none';
    if (!q) { resultsRoot.style.display = 'none'; resultsRoot.innerHTML = ''; return; }
    var matches = PRODUCTS.filter(function (entry) {
      return normalizeSearch(productName(entry.nameKey)).indexOf(q) > -1;
    });
    resultsRoot.style.display = '';
    if (!matches.length) {
      resultsRoot.innerHTML = '<div class="di-search-empty">' + esc(ui().searchNoResults) + '</div>';
      return;
    }
    resultsRoot.innerHTML = matches.map(function (entry) {
      var key = entry.catId + ':' + entry.nameKey;
      return '<button type="button" class="di-search-result" data-goto="' + key + '">' +
        esc(productName(entry.nameKey)) + ' <span class="di-search-result-cat">· ' + esc(catLabel(entry.catId)) + '</span></button>';
    }).join('');
  }

  function queryProductKey() {
    var qs = new URLSearchParams(window.location.search);
    var p = qs.get('product');
    if (!p) return null;
    var aliases = { trigo:'cereales:trigo', maiz:'cereales:maiz', arroz:'cereales:arroz', cebada:'cereales:cebada', soja:'cereales:soja', leche:'lacteos:leche', urea:'fertilizantes:urea', diesel:'energia:diesel', fertilizantes:'fertilizantes:urea' };
    return aliases[p] || (PRODUCT_BY_KEY[p] ? p : null);
  }

  function goToProduct(key) {
    var entry = PRODUCT_BY_KEY[key];
    if (!entry) return;
    state.activeTab = state.wantTab = entry.catId;
    state.searchQuery = '';
    var input = document.getElementById('pr-search-input');
    if (input) input.value = '';
    syncPriceUrl({ product: entry.nameKey });
    S.renderContextBar('precios');
    renderAll();
    setTimeout(function () {
      var card = document.querySelector('[data-key="' + key + '"]');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow = '0 0 0 3px ' + (T().positive) + '55';
        setTimeout(function () { card.style.boxShadow = ''; }, 1400);
      }
    }, 30);
  }

  // ---------------------------------------------------------------------
  // Render: barra de ubicación
  // ---------------------------------------------------------------------
  function renderLocationBar() {
    var t = ui();
    var root = document.getElementById('pr-location-bar');
    var html = '<span class="di-location-label">' + esc(t.locationLabel) + '</span>' +
      '<button type="button" class="di-location-btn' + (state.location === 'us' ? ' active' : '') + '" data-loc="us">🇺🇸 ' + esc(t.locationUsLabel) + '</button>' +
      '<button type="button" class="di-location-btn' + (state.location === 'eu' ? ' active' : '') + '" data-loc="eu">🇪🇺 ' + esc(t.locationEuLabel) + '</button>' +
      '<button type="button" class="di-location-btn' + (state.location === 'uk' ? ' active' : '') + '" data-loc="uk">🇬🇧 ' + esc(t.locationUkLabel) + '</button>' +
      '<button type="button" class="di-location-btn' + (state.location === 'ca' ? ' active' : '') + '" data-loc="ca">🇨🇦 ' + esc(t.locationCaLabel) + '</button>' +
      '<button type="button" class="di-location-btn' + (state.location === 'sa' ? ' active' : '') + '" data-loc="sa">🌎 ' + esc(t.locationSaLabel) + '</button>';
    if (state.location === 'eu') {
      // todos los países de la UE con precios propios en la Comisión (antes solo España, Alemania, Francia e Italia)
      var countries = EU_CC.map(function (c) { return { code: c, flag: ccFlag(c), label: ccName(c) }; });
      html += '<select data-cpick="1" class="di-eu-country-select" id="pr-eu-country" aria-label="' + ({ es: 'País de la UE', en: 'EU country', fr: 'Pays de l’UE', it: 'Paese UE' }[lang()] || 'EU country') + '">' + countries.map(function (c) {
        return '<option value="' + c.code + '"' + (c.code === state.euCountry ? ' selected' : '') + '>' + c.flag + ' ' + esc(c.label) + '</option>';
      }).join('') + '</select>';
      html += '<details class="di-eu-country-hint"><summary>' + esc(({ es: 'Cómo se fijan los precios por país', en: 'How country prices are set', fr: 'Comment sont fixés les prix par pays', it: 'Come si fissano i prezzi per paese' })[lang()] || 'Cómo se fijan los precios por país') + '</summary>' + esc(t.euCountryHint) + '</details>';
    }
    if (state.location === 'sa') {
      html += '<select data-cpick="1" class="di-eu-country-select" id="pr-sa-country" aria-label="' + ({ es: 'País de Sudamérica', en: 'South American country', fr: 'Pays d’Amérique du Sud', it: 'Paese del Sud America' }[lang()] || 'Country') + '">' + SA_CC.map(function (c) {
        return '<option value="' + c + '"' + (c === state.saCountry ? ' selected' : '') + '>' + ccFlag(c) + ' ' + esc(ccName(c)) + '</option>';
      }).join('') + '</select>';
    }
    var fxTxt = fxLabelText(t);
    if (fxTxt) html += '<div class="di-fx-label">' + esc(fxTxt) + '</div>';
    root.innerHTML = html;
  }

  // El tipo de cambio se actualiza en vivo (ver scripts/update-fx.mjs), así
  // que la etiqueta se rellena con los valores y la fecha reales de
  // D.FX/D.FX_DATE en lugar de llevar cifras fijas en la traducción.
  function fmtFxRate(v) {
    // 4 decimales, coma como separador en es/fr/it (igual que el resto del
    // sitio), punto en en -- D.fmtNumber no cubre decimales fijos ni coma.
    var fixed = v.toFixed(4);
    return lang() === 'en' ? fixed : fixed.replace('.', ',');
  }
  function fxLabelText(t) {
    // Base de referencia siempre USD: solo se muestra el cambio de la moneda de la región elegida.
    // En EE. UU. no hay cambio que mostrar (ya está en USD).
    var date = D.formatFxDate(D.FX_DATE, lang());
    var note = t.fxMonthNote ? ' ' + t.fxMonthNote : '';
    if (state.location === 'eu') return t.fxLabelEu.replace('{eur}', fmtFxRate(D.FX.EUR)).replace('{date}', date) + note;
    if (state.location === 'uk') return t.fxLabelUk.replace('{gbp}', fmtFxRate(D.FX.GBP)).replace('{date}', date) + note;
    if (state.location === 'ca') return t.fxLabelCa.replace('{cad}', fmtFxRate(D.FX.CAD)).replace('{date}', date) + note;
    return '';
  }

  // ---------------------------------------------------------------------
  // Render: favoritos
  // ---------------------------------------------------------------------
  function renderFavorites() {
    var t = ui();
    var root = document.getElementById('pr-favorites');
    var html = state.favorites.length ? '<h2 class="di-favorites-title">' + esc(t.favoritesTitle) + '</h2>' : '';
    if (!state.favorites.length) {
      html += '<div class="di-favorites-empty di-favorites-hint">' + esc(t.favoritesEmptyHint) + '</div>';   // sin favoritos: una línea, no un bloque con título
    } else {
      html += '<div class="di-favorites-grid">' + state.favorites.map(function (key) {
        var entry = PRODUCT_BY_KEY[key];
        if (!entry) return '';
        return productCardHtml(entry, { compact: true });
      }).join('') + '</div>';
    }
    root.innerHTML = html;
    root.classList.toggle('is-empty', !state.favorites.length); // en movil, sin favoritos no ocupa sitio
    wireCardEvents(root);
  }

  // ---------------------------------------------------------------------
  // Render: pestañas
  // ---------------------------------------------------------------------
  // Cada mercado enseña todo lo que tiene: un producto sin dato verificado en el mercado elegido no se rellena
  // con otro mercado (p. ej. el Reino Unido ya no muestra la referencia europea), va a una lista aparte.
  function trustReady() { return !!(global.DehesaDataTrust && D.DATA_TRUST); }
  function entryHasData(entry) {
    if (!trustReady()) return true;
    var key = entry.catId + ':' + entry.nameKey;
    var disp = resolveDisplay(entry, state.location, state.euCountry);
    if (!disp.region) return !!lonjaList(entry);   // país sin media nacional pero con mercados de la Comisión
    var obs = trustObservationFor(entry, disp), ver = !!obs && obs.status === 'verified';
    if (state.deepLinkProduct === key) return ver;   // un enlace directo tampoco enseña un valor de muestra sin verificar
    if ((state.location === 'uk' || state.location === 'ca') && disp.ukGap) return false;
    return ver;
  }
  var EU_ONLY = { vino: true };   // madera: UE y Reino Unido (Forest Research), EE. UU. (BLS) y Canada (StatCan) desde el 21-oct-2026 // solo hay datos de países europeos: con ubicación EE. UU., Reino Unido o Canadá no se enseñan
  function catHasData(catId) {
    if (state.location === 'sa') return catId === 'hortalizas';   // Sudamérica: solo Chile (ODEPA, frutas y hortalizas)
    if (EU_ONLY[catId]) return state.location === 'eu';
    if (catId === 'hortalizas') return state.location === 'eu' || state.location === 'us' || state.location === 'ca' || state.location === 'uk';   // EE. UU.: USDA NASS y AMS; Canadá: AAFC mayoristas (data/ca/); Reino Unido: Defra mayoristas (data/views/fv-uk.json)
    if (INFO_CATS[catId]) return true;
    if (ukIdxList(catId).length) return true;
    var list = productsInCat(catId);
    return !trustReady() || !list.length || list.some(entryHasData);
  }
  function visibleCats() { var v = CAT_ORDER.filter(function (c) { return catHasData(c) || c === state.activeTab; }); return v; }

  function renderTabs() {
    var root = document.getElementById('pr-tabs');
    root.innerHTML = visibleCats().map(function (catId) {
      return '<button type="button" class="di-tab-btn' + (catId === state.activeTab ? ' active' : '') + '" data-tab="' + catId + '">' + esc(catLabel(catId)) + '</button>';
    }).join('');
  }

  // ---------------------------------------------------------------------
  // Tarjeta de producto
  // ---------------------------------------------------------------------
  function quoteBadgeHtml(quoteType) {
    if (!quoteType) return '';
    var qt = (D.QUOTE_TYPES[lang()] || D.QUOTE_TYPES.es)[quoteType.type];
    if (!qt) return '';
    var title = qt.desc + (quoteType.market ? ' — ' + D.marketText(quoteType.market, lang()) : '');
    return '<span class="di-quote-badge" title="' + esc(title) + '">' + esc(qt.label) + '</span>';
  }

  function isVerified(entry, code) {
    var tr = D.DATA_TRUST && D.DATA_TRUST[entry.catId + '-' + entry.nameKey + '-' + code];
    return !!(tr && tr.status === 'verified');
  }

  function breakdownTableHtml(entry) {
    var t = ui();
    var p = entry.product;
    var UL = D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es;
    var rows = [];
    var specs = [
      { code: 'us', region: p.us, ccy: 'USD', kg: p.imperialKgPerUnit, unit: UL[p.imperialUnitKey], regionLabel: D.REGION[lang()].us },
      { code: 'eu', region: p.eu, ccy: 'EUR', kg: p.metricKgPerUnit, unit: UL[p.metricUnitKey], regionLabel: D.REGION[lang()].eu },
      { code: 'uk', region: p.uk, ccy: 'GBP', kg: p.metricKgPerUnit, unit: UL[p.metricUnitKey], regionLabel: D.REGION[lang()].uk },
      { code: 'ca', region: p.ca, ccy: 'CAD', kg: p.caKgPerUnit || p.metricKgPerUnit, unit: UL[p.caUnitKey || p.metricUnitKey], regionLabel: D.REGION[lang()].ca }
    ];
    for (var i = 0; i < specs.length; i++) {
      var s = specs[i];
      if (!s.region) continue;
      // Solo regiones con observación verificada: nunca un valor de muestra de data.js
      if (!isVerified(entry, s.code)) continue;
      var qt = p.quoteTypes && p.quoteTypes[s.code];
      var qtLabel = qt && (D.QUOTE_TYPES[lang()] || D.QUOTE_TYPES.es)[qt.type] ? (D.QUOTE_TYPES[lang()] || D.QUOTE_TYPES.es)[qt.type].label : '—';
      var sym = D.CCY_SYMBOL[s.ccy] || s.ccy;
      // Canadá: StatCan publica por provincia; se nombra la provincia real (Saskatchewan, Ontario…), no «provincia de referencia»
      var mkl = s.code === 'ca' && global.DehesaShared && global.DehesaShared.marketLabel ? global.DehesaShared.marketLabel({ id: 'di_' + entry.catId + '_' + entry.nameKey + '_ca', sourceId: 'statcan' }, lang()) : '';
      rows.push('<tr><td>' + esc(s.regionLabel) + (mkl ? ' — ' + esc(mkl) : qt && qt.market ? ' — ' + esc(D.marketText(qt.market, lang())) : '') + '</td><td>' + esc(qtLabel) + '</td><td>' + sym + D.fmtNumber(s.region.price) + '/' + esc(s.unit) + '</td></tr>');
    }
    var sourcesHtml = '';
    var cat = (D.CATS[lang()] || D.CATS.es)[entry.catId];
    if (cat) {
      sourcesHtml = D.withSeps(cat.sources).map(function (s) {
        return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + '</a>' + s.sep;
      }).join('');
    }
    return (
      '<table class="di-breakdown-table"><thead><tr><th>' + esc(t.breakdownColMercado) + '</th><th>' + esc(t.breakdownColTipo) + '</th><th>' + esc(t.breakdownColPrecio) + '</th></tr></thead>' +
      '<tbody>' + rows.join('') + '</tbody></table>' +
      (sourcesHtml ? '<div class="di-field-hint">' + esc(t.fuenteLabel) + ' ' + sourcesHtml + '</div>' : '')
    );
  }

  function energyRegionsHtml(entry) {
    if (!entry.product.isEnergy) return '';
    var t = ui();
    var ER = D.ENERGY_REGIONS[lang()] || D.ENERGY_REGIONS.es;
    var rows = [];
    var title = '';
    if (state.location === 'us') {
      title = ER.usTitle;
      rows = D.DIESEL_US_REGIONS.map(function (r) {
        var built = D.buildRegion(r, ER[r.key] || r.key, 'USD', D.GAL_KG, (D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es).gal, D.FX, T());
        return '<div class="di-energy-region-row"><span>' + esc(ER[r.key] || r.key) + '</span><b>' + esc(built.price) + esc(built.unit) + '</b></div>';
      });
    } else if (state.location === 'eu') {
      title = ER.euTitle;
      rows = D.DIESEL_EU_COUNTRIES.map(function (r) {
        if (!r.observed) return '<div class="di-energy-region-row"><span>' + esc(ER[r.key] || r.key) + '</span><b>—</b></div>';
        var built = D.buildRegion(r, ER[r.key] || r.key, 'EUR', D.LITRO_KG, (D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es).litro, D.FX, T());
        return '<div class="di-energy-region-row"><span>' + esc(ER[r.key] || r.key) + '</span><b>' + esc(built.price) + esc(built.unit) + '</b></div>';
      });
      if (D.DIESEL_EU_COUNTRIES.some(function (r) { return !r.observed; })) rows.push('<div class="di-derived-note">' + esc(UNVERIFIED_NOTE[lang()] || UNVERIFIED_NOTE.es) + '</div>');
    } else {
      return '';
    }
    return '<div class="di-energy-regions"><div class="di-energy-regions-title">' + esc(title) + '</div>' + rows.join('') + '</div>';
  }

  function trustObservationFor(entry, disp) {
    if (!global.DehesaDataTrust || !D.DATA_TRUST) return null;
    var region = disp && (disp.regionCode || disp.region);
    var productId = entry.catId + '-' + entry.nameKey;
    return D.DATA_TRUST[productId + '-' + region] || null;
  }

  var DERIVED_NOTE = {
    es: 'Estimación: referencia de la UE multiplicada por un factor fijo de país. No es una cotización observada en ese país.',
    en: 'Estimate: EU reference multiplied by a fixed country factor. Not a price observed in that country.',
    fr: 'Estimation : référence UE multipliée par un facteur fixe par pays. Ce n’est pas un prix observé dans ce pays.',
    it: 'Stima: riferimento UE moltiplicato per un fattore fisso per paese. Non è un prezzo osservato in quel paese.'
  };
  var UNVERIFIED_NOTE = {
    es: 'Sin fuente verificada por país todavía (Boletín Semanal del Petróleo de la CE en preparación).',
    en: 'No verified country-level source yet (EC Weekly Oil Bulletin ingestion in preparation).',
    fr: 'Pas encore de source vérifiée par pays (Bulletin pétrolier hebdomadaire de la CE en préparation).',
    it: 'Nessuna fonte verificata per paese al momento (Bollettino petrolifero settimanale della CE in preparazione).'
  };
  function productDataState(observation, disp) {
    if (disp && disp.unverified) return { key: 'pending', label: { es: 'PENDIENTE', en: 'PENDING', fr: 'EN ATTENTE', it: 'IN ATTESA' } };
    if (disp && disp.derived && observation && observation.status === 'verified') return { key: 'derived', label: { es: 'ESTIMADO', en: 'ESTIMATED', fr: 'ESTIMÉ', it: 'STIMATO' } };
    if (!observation) return { key: 'pending', label: { es: 'PENDIENTE', en: 'PENDING', fr: 'EN ATTENTE', it: 'IN ATTESA' } };
    if (observation.comparability === 'not_comparable') return { key: 'not-comparable', label: { es: 'NO COMPARABLE', en: 'NOT COMPARABLE', fr: 'NON COMPARABLE', it: 'NON COMPARABILE' } };
    if (observation.status === 'verified') return { key: 'real', label: { es: 'DATO OFICIAL', en: 'OFFICIAL DATA', fr: 'DONNÉE OFFICIELLE', it: 'DATO UFFICIALE' } };
    return { key: 'pending', label: { es: 'PENDIENTE', en: 'PENDING', fr: 'EN ATTENTE', it: 'IN ATTESA' } };
  }

  function relatedNewsHtml(entry) {
    var index = global.DehesaNewsIndex || {};
    var key = entry.nameKey;
    var stories = index[key] || [];
    var region = state.location || 'us';
    if (!stories.length) return '<div class="di-related-news di-related-news-pending"><div class="di-related-news-head"><span>' + esc(({ es: 'NOTICIAS', en: 'NEWS', fr: 'ACTUALITÉS', it: 'NOTIZIE' })[lang()] || 'NOTICIAS') + '</span><a href="noticias.html?product=' + encodeURIComponent(key) + '&region=' + encodeURIComponent(region) + '">' + esc(({ es: 'Noticias relacionadas →', en: 'Related news →', fr: 'Actualités liées →', it: 'Notizie correlate →' })[lang()] || 'Noticias relacionadas →') + '</a></div><p>' + esc(({ es: 'No hay cobertura editorial enlazada a este mercado todavía.', en: 'No news coverage linked to this market yet.', fr: 'Aucune actualité liée à ce marché pour l’instant.', it: 'Nessuna notizia collegata a questo mercato per ora.' })[lang()] || '') + '</p></div>';
    var lg = lang();
    var label = lg === 'es' ? 'Noticias relacionadas' : lg === 'fr' ? 'Actualités liées' : lg === 'it' ? 'Notizie correlate' : 'Related news';
    return '<div class="di-related-news"><div class="di-related-news-head"><span>' + esc(({ es: 'NOTICIAS', en: 'NEWS', fr: 'ACTUALITÉS', it: 'NOTIZIE' })[lang()] || 'NOTICIAS') + '</span><a href="noticias.html?product=' + encodeURIComponent(key) + '&region=' + encodeURIComponent(region) + '">' + esc(({ es: 'Ver todas', en: 'See all', fr: 'Tout voir', it: 'Vedi tutte' })[lang()] || 'Ver todas') + ' →</a></div>' +
      '<div class="di-related-news-title">' + esc(label) + '</div>' +
      stories.slice(0,2).map(function(n) {
        var h = n.headline[lg] || n.headline.es;
        return '<a class="di-related-news-item" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer"><span class="di-related-news-meta">' + esc(n.source) + ' · ' + esc(n.date) + '</span><strong>' + esc(h) + '</strong></a>';
      }).join('') + '</div>';
  }

  function noValueText() {
    var lg = lang();
    return lg === 'en' ? 'No verified observation yet: no sample value is shown.' :
      lg === 'fr' ? 'Pas encore d’observation vérifiée : aucune valeur d’exemple n’est affichée.' :
      lg === 'it' ? 'Nessuna osservazione verificata: non viene mostrato alcun valore di esempio.' :
      'Aún sin observación verificada: no se muestra ningún valor de muestra.';
  }

  function productCiteHtml(entry, disp, observation) {
    var Q = global.DICite; if (!Q) return '';
    var region = disp && (disp.regionCode || disp.region), c = LIVE_OBSERVATION_MAP[entry.nameKey + ':' + region];
    if (!c || !c.sourceId) return '';
    return Q.html(c.sourceId, { period: observation && observation.observationDate, pub: observation && observation.publicationDate });
  }

  // ---------------------------------------------------------------------
  // Lonjas de España (maíz, trigo y cebada): la tarjeta muestra por defecto la lonja de referencia (Zaragoza; Lleida en cebada)
  // y deja elegir otra de las que publica el Agri-food Data Portal (data/views/lonjas.json, salida de silo, EUR/t).
  // ---------------------------------------------------------------------
  // Mercados de cereales de cada país de la UE (data/views/lonjas.json; Comisión Europea). Desde 2026/27 la Comisión ya no publica la
  // media nacional de cereales, solo mercados concretos: la tarjeta deja elegir cualquiera de ellos, cada uno con su nombre, su variedad y su
  // fase comercial, sin promediar ni mezclar. España: por defecto su lonja de referencia (Zaragoza; Lleida en cebada). Otro país: su media
  // nacional mientras esté al día; si está parada o no existe, su primer mercado activo.
  var LONJAS = null, LONJA_DEF = { maiz: 'Zaragoza', trigo: 'Zaragoza', cebada: 'Lleida' };
  var LONJA_VAR = { trigo: 'pan', maiz: 'pienso', cebada: 'pienso', avena: 'pienso', centeno: 'pan' };
  var LONJA_T = { es: ['Mercado', 'por defecto', 'España', 'lonja', 'salida de silo', 'Media nacional', 'hasta'], en: ['Market', 'default', 'Spain', 'market', 'ex-silo', 'National average', 'until'], fr: ['Marché', 'par défaut', 'Espagne', 'marché', 'départ silo', 'Moyenne nationale', 'jusqu’au'], it: ['Mercato', 'predefinito', 'Spagna', 'borsa', 'franco silo', 'Media nazionale', 'fino al'] };
  var lonjaSel = (function () { try { return JSON.parse(readLS('dehesaLonja') || '{}') || {}; } catch (e) { return {}; } })();
  function loadLonjas() {
    if (LONJAS || typeof global.fetch !== 'function') return;
    LONJAS = {};
    global.fetch('data/views/lonjas.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.countries) { LONJAS = d; applyPlMode(); if (state.location === 'eu') renderAll(); } }).catch(function () {});
  }
  function lonjaCC() { return String(state.euCountry || 'es').toUpperCase(); }
  function lonjaKey(x) { return x.m + '|' + (x['var'] || '') + '|' + (x.st || ''); }
  function lonjaList(entry) {
    if (state.location !== 'eu' || !LONJA_VAR[entry.nameKey]) return null;
    var cc = lonjaCC(), L = LONJAS && LONJAS.countries && LONJAS.countries[cc] && LONJAS.countries[cc][entry.nameKey];
    if (!L || !L.length) return null;
    return cc === 'ES' ? (L.length > 1 ? L : null) : L;
  }
  function lonjaLabel(x) {
    var li = { es: 0, en: 1, fr: 2, it: 3 }[lang()] || 0, LB = (LONJAS && LONJAS.labels) || { 'var': {}, st: {} };
    var v = LB['var'][x['var']] ? LB['var'][x['var']][li] : '', st = LB.st[x.st] ? LB.st[x.st][li] : '';
    return [x.m, v, st].filter(Boolean).join(' · ');
  }
  // media nacional del país elegido, si existe y está al día
  function nationalFresh(entry) {
    var cc = lonjaCC(); if (cc === 'ES') return true;
    var P = CTRY[cc] && CTRY[cc][entry.nameKey]; return !!(P && !P.stale);
  }
  function lonjaDefault(entry, L) {
    var cc = lonjaCC();
    if (cc === 'ES') { var d = LONJA_DEF[entry.nameKey]; for (var i = 0; i < L.length; i++) if (L[i].m === d && L[i]['var'] === LONJA_VAR[entry.nameKey] && L[i].st === 'silo') return L[i]; return null; }
    if (nationalFresh(entry)) return null;   // la media nacional sigue publicándose: va primero
    var pref = L.filter(function (x) { return x['var'] === LONJA_VAR[entry.nameKey]; }); if (!pref.length) pref = L;
    var top = pref.reduce(function (m, x) { return x.p[x.p.length - 1][0] > m ? x.p[x.p.length - 1][0] : m; }, '');
    return pref.filter(function (x) { return x.p[x.p.length - 1][0] >= top; })[0] || pref[0];
  }
  // mercado que enseña la tarjeta (null = el dato de siempre: lonja por defecto en España o media nacional del país)
  function lonjaPick(entry) {
    var L = lonjaList(entry); if (!L) return null;
    var cc = lonjaCC(), sel = lonjaSel[cc === 'ES' ? entry.nameKey : cc + ':' + entry.nameKey];
    if (sel === 'nat' && cc !== 'ES' && CTRY[cc] && CTRY[cc][entry.nameKey]) return null;
    if (sel) for (var i = 0; i < L.length; i++) if (lonjaKey(L[i]) === sel || (sel.indexOf('|') < 0 && L[i].m === sel && L[i]['var'] === LONJA_VAR[entry.nameKey])) return cc === 'ES' && L[i] === lonjaDefault(entry, L) ? null : L[i];
    var d = lonjaDefault(entry, L);
    return cc === 'ES' ? null : d;
  }
  function monthTxt(d) { try { return new Date(d + 'T12:00:00Z').toLocaleDateString({ es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }[lang()] || 'es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d.slice(0, 7); } }
  // Polonia: GUS publica en zlotys; se guarda la serie en EUR (media mensual del BCE) y la original en PLN, y el lector elige (se recuerda).
  function plMode() { return readLS('dehesaIndexPlCcy') === 'PLN' ? 'PLN' : 'EUR'; }
  function applyPlMode() {
    var m = plMode(), C = LONJAS && LONJAS.countries || {};
    Object.keys(C).forEach(function (cc) { Object.keys(C[cc]).forEach(function (pr) { C[cc][pr].forEach(function (x) {
      if (!x.po) return; if (!x.pe) x.pe = x.p; x.p = m === 'PLN' ? x.po : x.pe; x.c = m === 'PLN' ? 'PLN' : 'EUR';
    }); }); });
  }
  function lonjaCcyHtml(entry) {
    var L = lonjaList(entry), cur = lonjaPick(entry); if (!L || !cur || !cur.po) return '';
    var m = plMode(), X = { es: ['Moneda', 'Zloty (PLN)', 'Euro'], en: ['Currency', 'Zloty (PLN)', 'Euro'], fr: ['Monnaie', 'Zloty (PLN)', 'Euro'], it: ['Valuta', 'Złoty (PLN)', 'Euro'] }[lang()];
    return '<label class="di-lonja" style="display:inline-flex;gap:6px;align-items:center;font-size:12.5px;margin:2px 0;color:var(--text-muted)">' + esc(X[0]) + ' <select class="di-lonja-ccy di-compare-select" style="padding:2px 6px;font-size:12.5px;width:auto"><option value="EUR"' + (m === 'EUR' ? ' selected' : '') + '>' + esc(X[2]) + '</option><option value="PLN"' + (m === 'PLN' ? ' selected' : '') + '>' + esc(X[1]) + '</option></select></label>';
  }
  if (global.document) global.document.addEventListener('change', function (ev) {
    var el = ev.target; if (!el || !el.classList || !el.classList.contains('di-lonja-ccy')) return;
    writeLS('dehesaIndexPlCcy', el.value); applyPlMode(); renderAll();
  });
  // Canadá: StatCan publica el precio al productor por provincia (data/canada-farm-prices-prov.json); la tarjeta enseña la provincia de referencia y se puede cambiar, como las lonjas en España.
  var PROVS = null;
  var provSel = (function () { try { return JSON.parse(readLS('dehesaCaProv') || '{}') || {}; } catch (e) { return {}; } })();
  var PROV_N = { es: { Alberta: 'Alberta', Manitoba: 'Manitoba', Saskatchewan: 'Saskatchewan', Ontario: 'Ontario', Quebec: 'Quebec' }, en: { Alberta: 'Alberta', Manitoba: 'Manitoba', Saskatchewan: 'Saskatchewan', Ontario: 'Ontario', Quebec: 'Quebec' }, fr: { Alberta: 'Alberta', Manitoba: 'Manitoba', Saskatchewan: 'Saskatchewan', Ontario: 'Ontario', Quebec: 'Québec' }, it: { Alberta: 'Alberta', Manitoba: 'Manitoba', Saskatchewan: 'Saskatchewan', Ontario: 'Ontario', Quebec: 'Quebec' } };
  var PROV_T = { es: ['Provincia', 'por defecto', 'precio pagado al productor', 'Serie mensual publicada por Statistics Canada (tabla 32-10-0077-01), en dólares canadienses, sin convertir.'], en: ['Province', 'default', 'price paid to producers', 'Monthly series published by Statistics Canada (table 32-10-0077-01), in Canadian dollars, not converted.'], fr: ['Province', 'par défaut', 'prix payé aux producteurs', 'Série mensuelle publiée par Statistique Canada (tableau 32-10-0077-01), en dollars canadiens, sans conversion.'], it: ['Provincia', 'predefinita', 'prezzo pagato ai produttori', 'Serie mensile pubblicata da Statistics Canada (tabella 32-10-0077-01), in dollari canadesi, senza conversione.'] };
  function loadProvs() {
    if (PROVS || typeof global.fetch !== 'function') return;
    PROVS = {};
    global.fetch('data/canada-farm-prices-prov.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.products) { PROVS = d; if (state.location === 'ca') renderAll(); } }).catch(function () {});
  }
  function provName(n) { return (PROV_N[lang()] || PROV_N.es)[n] || n; }
  function provList(entry) {
    if (state.location !== 'ca') return null;
    var P = PROVS && PROVS.products && PROVS.products[entry.nameKey];
    return P && P.provinces && P.provinces.length > 1 ? P : null;
  }
  // provincia elegida distinta de la de referencia (null = el dato de siempre)
  function provPick(entry) {
    var P = provList(entry); if (!P) return null;
    var sel = provSel[entry.nameKey] || P.default; if (sel === P.default) return null;
    for (var i = 0; i < P.provinces.length; i++) if (P.provinces[i].province === sel) return P.provinces[i];
    return null;
  }
  function provRegion(x, base) { var pt = x.points; return { price: x.value, changePct: x.changePct || 0, history: pt.slice(-12).map(function (q) { return q[1]; }), currency: 'CAD', kgPerUnit: base && base.kgPerUnit }; }
  function provSelectHtml(entry) {
    var P = provList(entry); if (!P) return '';
    var X = PROV_T[lang()] || PROV_T.es, cur = provPick(entry), curName = cur ? cur.province : P.default;
    var opts = P.provinces.map(function (x) { return '<option value="' + esc(x.province) + '"' + (x.province === curName ? ' selected' : '') + '>' + esc(provName(x.province)) + (x.province === P.default ? ' (' + esc(X[1]) + ')' : '') + '</option>'; }).join('');
    return '<label class="di-lonja" style="display:inline-flex;gap:6px;align-items:center;font-size:12.5px;margin:4px 0 2px;color:var(--text-muted);max-width:100%">' + esc(X[0]) + ' <select class="di-prov-sel di-compare-select" data-prov="' + esc(entry.nameKey) + '" style="padding:2px 6px;font-size:12.5px;width:auto;max-width:100%">' + opts + '</select></label>';
  }
  if (global.document) global.document.addEventListener('change', function (ev) {
    var el = ev.target; if (!el || !el.classList || !el.classList.contains('di-prov-sel')) return;
    provSel[el.getAttribute('data-prov')] = el.value; writeLS('dehesaCaProv', JSON.stringify(provSel)); renderAll();
  });
  function openProvHistory(key) {
    var entry = PRODUCT_BY_KEY[key]; if (!entry) return;
    var x = provPick(entry); if (!x || !x.points || x.points.length < 2 || !window.DehesaChart) return;
    var X = PROV_T[lang()] || PROV_T.es, pts = x.points.map(function (q) { return { x: Date.parse(q[0] + '-01T00:00:00Z'), y: q[1], l: monthTxt(q[0] + '-01') }; });
    var vals = x.points.map(function (q) { return q[1]; }), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), last = x.points[x.points.length - 1];
    var f = function (v) { return D.fmtNumber(v) + ' CAD'; }, nm = productName(entry.nameKey) + ' · ' + provName(x.province);
    lockProductModal();
    var chart = window.DehesaChart.render({ series: [{ name: productName(entry.nameKey), color: '#2f6b4a', pts: pts }], xMode: 'time', yTitle: 'CAD', aria: nm, noLegend: true, vFmt: function (v) { return D.fmtNumber(v); } });
    var LH = LH_T[lang()] || LH_T.es;
    document.getElementById('pr-modal-root').innerHTML = '<div class="di-modal-overlay" id="di-history-overlay"><div class="di-big-modal-card"><div class="di-modal-head"><h2 class="di-modal-title">' + esc(nm) + ' · ' + esc(LH[0]) + '</h2><button type="button" class="di-modal-close" id="di-history-close" aria-label="' + esc(LH[4]) + '">×</button></div>' + chart +
      '<p class="di-field-hint" style="margin:10px 0 2px">' + esc(LH[1]) + ': <strong>' + esc(f(last[1])) + '</strong> (' + esc(monthTxt(last[0] + '-01')) + ') · ' + esc(LH[2]) + ': ' + esc(f(mn)) + ' · ' + esc(LH[3]) + ': ' + esc(f(mx)) + '</p><p class="di-field-hint">' + esc(X[3]) + '</p></div></div>';
    var ov = document.getElementById('di-history-overlay'); ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeLonjaHistory(); });
    document.getElementById('di-history-close').addEventListener('click', closeLonjaHistory); bindModalKeyboard(closeLonjaHistory);
  }
  function lonjaRegion(x) {
    var p = x.p, last = p[p.length - 1][1], prev = p.length > 1 ? p[p.length - 2][1] : null;
    return { price: last, changePct: prev ? Math.round((last / prev - 1) * 1e6) / 1e4 : 0, history: p.slice(-12).map(function (q) { return q[1]; }), currency: x.c || 'EUR', kgPerUnit: 1000 };
  }
  function lonjaSelectHtml(entry) {
    var L = lonjaList(entry); if (!L) return '';
    var X = LONJA_T[lang()] || LONJA_T.es, cc = lonjaCC(), cur = lonjaPick(entry), opts = '';
    if (cc === 'ES') {
      var def = lonjaDefault(entry, L);
      opts = (def ? '<option value="' + esc(lonjaKey(def)) + '"' + (!cur ? ' selected' : '') + '>' + esc(lonjaLabel(def)) + ' (' + esc(X[1]) + ')</option>' : '') +
        L.filter(function (x) { return x !== def; }).map(function (x) { return '<option value="' + esc(lonjaKey(x)) + '"' + (cur === x ? ' selected' : '') + '>' + esc(lonjaLabel(x)) + '</option>'; }).join('');
    } else {
      var P = CTRY[cc] && CTRY[cc][entry.nameKey];
      if (P) opts += '<option value="nat"' + (!cur ? ' selected' : '') + '>' + esc(X[5]) + (P.stale ? ' (' + esc(X[6]) + ' ' + esc(S.fmtDate(P.date, lang())) + ')' : '') + '</option>';
      opts += L.map(function (x) { return '<option value="' + esc(lonjaKey(x)) + '"' + (cur === x ? ' selected' : '') + '>' + esc(lonjaLabel(x)) + '</option>'; }).join('');
    }
    return '<label class="di-lonja" style="display:inline-flex;gap:6px;align-items:center;font-size:12.5px;margin:4px 0 2px;color:var(--text-muted);max-width:100%">' + esc(X[0]) +
      ' <select class="di-lonja-sel di-compare-select" data-lonja="' + esc(cc === 'ES' ? entry.nameKey : cc + ':' + entry.nameKey) + '" style="padding:2px 6px;font-size:12.5px;width:auto;max-width:100%">' + opts + '</select></label>';
  }
  if (global.document) global.document.addEventListener('change', function (ev) {
    var el = ev.target; if (!el || !el.classList || !el.classList.contains('di-lonja-sel')) return;
    lonjaSel[el.getAttribute('data-lonja')] = el.value; writeLS('dehesaLonja', JSON.stringify(lonjaSel)); renderAll();
  });

  function productCardHtml(entry, opts) {
    opts = opts || {};
    var t = ui();
    var key = entry.catId + ':' + entry.nameKey;
    var disp = resolveDisplay(entry, state.location, state.euCountry);
    var lonja = lonjaPick(entry), observation0 = disp.ukGap ? null : trustObservationFor(entry, disp);
    var disp0 = disp;
    if (lonja) {
      var d2 = {}; for (var kk in disp) d2[kk] = disp[kk]; d2.region = lonjaRegion(lonja); d2.derived = false; if (lonja.c === 'PLN') d2.targetCcy = 'PLN'; disp = d2;
      // país sin media nacional (o parada): el mercado es una observación oficial de la Comisión, con su propia fecha
      { var b0 = D.DATA_TRUST && D.DATA_TRUST[entry.catId + '-' + entry.nameKey + '-eu']; observation0 = {}; if (b0) for (var k0 in b0) observation0[k0] = b0[k0]; observation0.status = 'verified'; observation0.value = lonja.p[lonja.p.length - 1][1]; observation0.observationDate = lonja.p[lonja.p.length - 1][0]; }
    }
    var prv = lonja ? null : provPick(entry);
    if (prv && disp.region) {
      var d3 = {}; for (var k3 in disp) d3[k3] = disp[k3]; d3.region = provRegion(prv, disp.region); disp = d3;
      { var b3 = observation0 || {}, o3 = {}; for (var k4 in b3) o3[k4] = b3[k4]; o3.status = 'verified'; o3.value = prv.value; o3.observationDate = prv.last; observation0 = o3; }
    }
    var built = disp.region ? D.buildRegion(disp.region, productName(entry.nameKey), disp.targetCcy, disp.targetKgPerUnit, disp.targetUnitLabel, D.FX, T()) : { price: '—', unit: '', changeLabel: '', changeColor: 'var(--text-faint)', sparkPath: '', sparkColor: 'var(--text-faint)' };
    var observation = disp.region ? observation0 : null;
    var dataState = productDataState(observation, disp);
    var stateLabel = (dataState.label[lang()] || dataState.label.es);
    var fav = isFavorite(key);
    var expanded = !!state.expanded[key];
    var foot = entry.product.footnoteKey ? (D.FOOT[lang()] || D.FOOT.es)[entry.product.footnoteKey] : '';
    // Se muestra el valor de toda observación verificada (REAL y NO COMPARABLE); el estado va en la etiqueta.
    // Solo lo pendiente (sin observación verificada) se oculta: nunca se enseña un valor de muestra.
    // Reino Unido / Canada sin cotizacion propia: nunca se ensena el valor europeo en su lugar (regla de cobertura).
    var showValue = !disp.ukGap && !disp.unverified && !!observation && observation.status === 'verified';
    var price = showValue ? built.price : '—';
    var unit = showValue ? built.unit : '';
    var change = showValue ? built.changeLabel : '';
    // Conversion de moneda o unidad: el valor original siempre a la vista (idea 7, 8-oct-2026)
    var rg = disp.region, conv = showValue && rg && (rg.currency !== disp.targetCcy || Math.abs((rg.kgPerUnit || 0) - (disp.targetKgPerUnit || 0)) > 1e-9);
    var origTxt = '';
    if (conv && observation && typeof observation.value === 'number') {
      var ULo = D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es, ou = ULo[observation.obsUnit] || observation.obsUnit || '';
      origTxt = ({ es: 'Valor original: ', en: 'Original value: ', fr: 'Valeur d’origine : ', it: 'Valore originale: ' })[lang()] + D.fmtNumber(observation.value) + ' ' + (observation.obsCcy || rg.currency) + (ou ? '/' + ou : '') + ' · ' + ({ es: 'convertido con el tipo de cambio del día', en: 'converted at the day’s exchange rate', fr: 'converti au taux de change du jour', it: 'convertito al cambio del giorno' })[lang()];
    }
    // Trazabilidad visible sin abrir el detalle: mercado exacto y fecha de observacion en formato local (auditoria 8-oct-2026)
    var mk = showValue && observation ? S.marketLabel({ id: observation.obsId, sourceId: observation.obsSource }, lang()) : '';
    var od = showValue && observation && observation.observationDate ? S.fmtDate(observation.observationDate, lang()) : '';
    if (disp.cty && showValue && observation && observation.ctyLabel) mk = (observation.ctyLabel[lang()] || observation.ctyLabel.es) + ' · ' + (({ es: 'media nacional', en: 'national average', fr: 'moyenne nationale', it: 'media nazionale' })[lang()]);
    if (prv && showValue) { mk = provName(prv.province) + ' · ' + (PROV_T[lang()] || PROV_T.es)[2]; od = S.fmtDate(prv.last, lang()); origTxt = ''; }
    if (lonja && showValue) { mk = (lonjaCC() === 'ES' ? (LONJA_T[lang()] || LONJA_T.es)[2] : (ccName(lonjaCC().toLowerCase()) || lonjaCC())) + ' · ' + lonjaLabel(lonja); od = lonja.f === 'm' ? monthTxt(lonja.p[lonja.p.length - 1][0]) : S.fmtDate(lonja.p[lonja.p.length - 1][0], lang()); if (lonja.o && lonja.c !== 'PLN') origTxt = ({ es: 'Precio original en ', en: 'Original price in ', fr: 'Prix d’origine en ', it: 'Prezzo originale in ' })[lang()] + lonja.o + ({ es: ', convertido con la media mensual del BCE de cada mes', en: ', converted with the ECB monthly average of each month', fr: ', converti avec la moyenne mensuelle de la BCE de chaque mois', it: ', convertito con la media mensile della BCE di ogni mese' })[lang()]; }
    var est = disp.derived ? ({ es: 'Estimación', en: 'Estimate', fr: 'Estimation', it: 'Stima' })[lang()] : '';
    var meta = [est, mk, od ? (/^\d/.test(od) ? (({ es: 'dato del ', en: 'as of ', fr: 'donnée du ', it: 'dato del ' })[lang()] || '') : (({ es: 'dato de ', en: 'as of ', fr: 'donnée de ', it: 'dato di ' })[lang()] || '')) + od : ''].filter(Boolean).join(' · ');
    var IBL = ({ es: ['Calcular', 'Gráfico', 'Aviso'], en: ['Calculate', 'Chart', 'Alert'], fr: ['Calculer', 'Graphique', 'Alerte'], it: ['Calcola', 'Grafico', 'Avviso'] })[lang()] || ['Calcular', 'Gráfico', 'Aviso'];
    return (
      '<div class="di-card di-product-card di-product-state-' + dataState.key + '" data-key="' + key + '">' +
        '<div class="di-product-head">' +
          '<div><h3 class="di-product-name">' + productEmoji(entry.nameKey) + esc(productName(entry.nameKey)) + '</h3><span class="di-product-state di-product-state-badge ' + dataState.key + '">' + esc(stateLabel) + '</span>' + (meta ? '<div class="di-product-meta">' + esc(meta) + '</div>' : '') + (showValue ? lonjaSelectHtml(entry) + lonjaCcyHtml(entry) + provSelectHtml(entry) : '') + '</div>' +
          '<div class="di-product-icons">' +
            '<button type="button" class="di-row-exp" data-action="rowexp" aria-expanded="false">' + esc((VW[lang()] || VW.es)[3]) + '</button>' +
            (showValue ? '<button type="button" class="di-icon-btn" data-action="calc" data-key="' + key + '" title="' + esc(t.calcButtonTitle) + '">🧮 <span class="di-ib-l">' + esc(IBL[0]) + '</span></button>' : '') +
            (showValue ? '<button type="button" class="di-icon-btn" data-action="history" data-key="' + key + '" title="' + esc(t.historyButtonTitle) + '">📈 <span class="di-ib-l">' + esc(IBL[1]) + '</span></button>' : '') +
            (showValue ? '<button type="button" class="di-icon-btn" data-action="alert" data-key="' + key + '" title="' + esc(t.alertButtonTitle) + '">🔔 <span class="di-ib-l">' + esc(IBL[2]) + '</span></button>' : '') +
            '<button type="button" class="di-fav-star' + (fav ? ' active' : '') + '" data-action="fav" data-key="' + key + '" title="' + esc(fav ? t.favRemoveTitle : t.favAddTitle) + '">★</button>' +
          '</div>' +
        '</div>' +
        (showValue ? quoteBadgeHtml(disp.quoteType) : '') +
        (global.DehesaDataTrust && !disp.ukGap && !lonja ? global.DehesaDataTrust.render(entry, disp0) : '') + (lonja ? '<div class="di-product-meta" style="margin-top:6px">' + esc(({ es: 'Fuente: Comisión Europea, Agri-food Data Portal, precio semanal de la lonja de ', en: 'Source: European Commission, Agri-food Data Portal, weekly price at the market of ', fr: 'Source : Commission européenne, Agri-food Data Portal, prix hebdomadaire du marché de ', it: 'Fonte: Commissione europea, Agri-food Data Portal, prezzo settimanale della borsa di ' })[lang()] + lonja.m + ' (EUR/t, ' + (LONJA_T[lang()] || LONJA_T.es)[4] + ').') + '</div>' : '') +
        (disp.unverified ? '<div class="di-derived-note">' + esc(UNVERIFIED_NOTE[lang()] || UNVERIFIED_NOTE.es) + '</div>' : '') +
        (disp.derived ? '<div class="di-derived-note">' + esc(DERIVED_NOTE[lang()] || DERIVED_NOTE.es) + '</div>' : '') +
        (showValue ? productCiteHtml(entry, disp, observation) : '') +
        (showValue && observation ? '<div class="di-product-report" style="margin:2px 0 4px">' + S.reportLink({ id: observation.obsId, label: productName(entry.nameKey) + (meta ? ' · ' + meta : ''), period: observation.observationDate, value: price + ' ' + unit }) + '</div>' : '') +
        '<div class="di-product-price-row">' +
          '<span class="di-product-price">' + esc(price) + '</span>' +
          '<span class="di-product-unit">' + esc(unit) + '</span>' +
          '<span class="di-product-change" style="color:' + (showValue ? built.changeColor : 'var(--text-faint)') + ';">' + esc(change) + '</span>' +
        '</div>' + (origTxt ? '<div class="di-product-meta">' + esc(origTxt) + '</div>' : '') +
        (showValue && lonja ? '<svg class="di-product-spark di-spark-link" data-action="spark-history" data-key="' + key + '" role="button" tabindex="0" aria-label="' + esc(t.historyButtonTitle) + '" viewBox="0 0 120 36" preserveAspectRatio="none"><title>' + esc(t.historyButtonTitle) + '</title><path d="' + built.sparkPath + '" stroke="' + built.sparkColor + '" fill="none" stroke-width="2"/></svg>' : '') + (showValue && !lonja ? '<svg class="di-product-spark di-spark-link" data-action="spark-history" data-key="' + key + '" role="button" tabindex="0" aria-label="' + esc(t.historyButtonTitle) + '" viewBox="0 0 120 36" preserveAspectRatio="none"><title>' + esc(t.historyButtonTitle) + '</title><path d="' + built.sparkPath + '" stroke="' + built.sparkColor + '" fill="none" stroke-width="2"/></svg>' : (showValue ? '' : '<div class="di-product-no-value">' + esc(noValueText()) + '</div>')) +
        (disp.ukGap ? '<div class="di-uk-gap-note">' + esc(state.location === 'ca' ? t.caGapNote : t.ukGapNote) + ' <a href="precios.html?region=eu&amp;product=' + encodeURIComponent(key) + '">' + esc(({ es: 'Ver en la vista de la UE', en: 'See it in the EU view', fr: 'Voir dans la vue UE', it: 'Vedi nella vista UE' })[lang()] || 'Ver en la vista de la UE') + '</a></div>' : '') +
        relatedNewsHtml(entry) +
        (foot ? '<div class="di-product-footnote">' + esc(foot) + '</div>' : '') +
        (opts.compact ? '' :
          '<button type="button" class="di-breakdown-toggle" data-action="breakdown" data-key="' + key + '">' + esc(expanded ? t.breakdownHideLabel : t.breakdownShowLabel) + '</button>' +
          (expanded ? breakdownTableHtml(entry) : '') +
          energyRegionsHtml(entry)
        ) +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // Seguro agrario / Vino a granel / Madera: bloques informativos propios
  // con estadísticas oficiales reales (no un precio de mercado diario/
  // semanal que convertir de moneda/unidad), comparadas lado a lado -- sin
  // favoritos, histórico, calculadora ni alertas. Ver js/seguro.js (seguro), D.WINE/
  // D.WOOD en js/data.js.
  // ---------------------------------------------------------------------
  function infoStatsCardHtml(title, stats, trustId) {
    var rows = stats.map(function (s) {
      return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(s.label) + '</span><span class="di-info-stat-value">' + esc(s.value) + '</span></div>';
    }).join('');
    return '<div class="di-card di-info-card"><div class="di-info-card-title">' + esc(title) + '</div><div class="di-info-stat-list">' + rows + '</div>' + (trustId && global.DehesaDataTrust && global.DehesaDataTrust.info ? global.DehesaDataTrust.info(trustId, lang()) : '') + '</div>';
  }

  function infoSourcesHtml(catId, only) {
    var t = ui();
    var cat = (D.CATS[lang()] || D.CATS.es)[catId];
    if (!cat) return '';
    var srcs = only ? cat.sources.filter(function (s) { return only.indexOf(s.name) > -1; }) : cat.sources;
    if (!srcs.length) return '';
    var links = D.withSeps(srcs).map(function (s) {
      return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + '</a>' + s.sep;
    }).join('');
    return '<div class="di-field-hint di-info-sources">' + esc(t.fuenteLabel) + ' ' + links + '</div>';
  }

  // Madera del Reino Unido: cifras de data/uk-timber-prices.json (scripts/update-uk-timber.py); si no carga, quedan las de js/data.js.
  (function () {
    var MN = { '03': ['marzo', 'March', 'mars', 'marzo'], '09': ['septiembre', 'September', 'septembre', 'settembre'] };
    fetch('data/uk-timber-prices.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var s = d && d.series && d.series.filter(function (x) { return x.id === 'uk-standing-conifer'; })[0];
      if (!s || s.periods.length < 3 || !D.WOOD) return;
      var n = s.periods.length, v = s.values[n - 1], a = s.values[n - 3], ch = a ? (v / a - 1) * 100 : null, mo = MN[s.periods[n - 1].slice(5)], y = s.periods[n - 1].slice(0, 4);
      ['es', 'en', 'fr', 'it'].forEach(function (lg, i) {
        var w = D.WOOD[lg], loc = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }[lg];
        var vs = v.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), cs = ch == null ? '—' : ch.toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' }) + (lg === 'fr' || lg === 'es' ? ' %' : '%');
        w.ukTitle = { es: 'Reino Unido — Forest Research (doce meses hasta ' + mo[i] + ' de ' + y + ')', en: 'United Kingdom — Forest Research (twelve months to ' + mo[i] + ' ' + y + ')', fr: 'Royaume-Uni — Forest Research (douze mois à ' + mo[i] + ' ' + y + ')', it: 'Regno Unito — Forest Research (dodici mesi a ' + mo[i] + ' ' + y + ')' }[lg];
        w.ukStats[0].value = (lg === 'en' ? '£' + vs : vs + ' £') + '/m³';
        w.ukStats[1].value = cs;
      });
    }).catch(function () {});
  })();
  function renderInfoCategoryHtml(catId) {
    if (catId === 'vino') {
      // Sin cifras fijas: las tarjetas las pinta js/wine-prices.js con data/wine-prices.json (MAPA y FranceAgriMer, actualizado por el pipeline).
      return '<div class="di-info-scope-note" data-wp-loading="1">' + esc(({ es: 'Cargando los precios del vino…', en: 'Loading wine prices…', fr: 'Chargement des prix du vin…', it: 'Caricamento dei prezzi del vino…' })[lang()] || '') + '</div>' + infoSourcesHtml('vino');
    }
    // madera: primero el mercado mas cercano a la ubicacion del usuario; si su pais no tiene precio nacional se avisa arriba
    var mad = D.WOOD[lang()] || D.WOOD.es;
    var loc = state.location || 'us', cn = state.euCountry || 'es';
    // Solo Reino Unido (Forest Research, OGL v3). EE. UU. (futuro del CME) tiene licencia que prohíbe redistribuir; Francia (France Bois
    // Forêt/ONF) no tiene licencia de reutilización verificada y el License Gate no deja publicarla. Ver data/license-registry.json.
    var own = loc === 'uk', na = loc === 'us' || loc === 'ca';
    var cards = { uk: infoStatsCardHtml(mad.ukTitle, mad.ukStats, 'madera-uk') };
    var order = own ? ['uk'] : [];   // la tarjeta del Reino Unido solo sale en el Reino Unido
    var isDe = loc === 'eu' && cn === 'de';
    var PL = { us: ['EE. UU.', 'The US', 'les États-Unis', 'gli Stati Uniti'], ca: ['Canadá', 'Canada', 'le Canada', 'il Canada'], es: ['España', 'Spain', 'l’Espagne', 'la Spagna'], de: ['Alemania', 'Germany', 'l’Allemagne', 'la Germania'], it: ['Italia', 'Italy', 'l’Italie', 'l’Italia'], fr: ['Francia', 'France', 'la France', 'la Francia'] }[loc === 'eu' ? cn : loc] || ['Tu país', 'Your country', 'votre pays', 'il tuo paese'];
    var place = { es: PL[0], en: PL[1], fr: PL[2], it: PL[3] };
    var NT = {
      es: function (p) { return p.es + ' no tiene un precio nacional de madera que podamos publicar (no tenemos una fuente oficial con licencia abierta).'; },
      en: function (p) { return p.en + ' has no national timber price we can publish (no official open-licence source).'; },
      fr: function (p) { return 'Il n’existe pas pour ' + p.fr + ' de prix national du bois que nous puissions publier (pas de source officielle sous licence ouverte).'; },
      it: function (p) { return 'Per ' + p.it + ' non c’è un prezzo nazionale del legno pubblicabile (nessuna fonte ufficiale a licenza aperta).'; }
    };
    var NL = { es: 'Ver por qué faltan otros países', en: 'See why other countries are missing', fr: 'Voir pourquoi d’autres pays manquent', it: 'Perché mancano altri paesi' };
    var notice = '';
    if (!own && !isDe) { notice = '<div class="di-info-scope-note" id="pr-wood-gap" style="margin-bottom:10px"' + (na ? ' hidden' : '') + '>' + esc(NT[lang()](place)) + ' <a href="#pr-madera-note">' + esc(NL[lang()]) + '</a></div>'; }
    return (
      (na ? '<div id="pr-wood-na" class="wr-wrap" data-cc="' + loc.toUpperCase() + '"></div>' : '') +
      '<div class="di-badge di-badge-green di-info-badge">' + esc(mad.badge) + '</div>' + notice +
      '<div class="di-info-grid">' + order.map(function (k) { return cards[k]; }).join('') + '</div>' +
      (isDe ? '<div id="pr-wood-de" class="wr-wrap"></div>' : '') +
      '<div id="pr-wood" class="wr-wrap"></div>' +
      '<div class="di-info-scope-note" id="pr-wood-forest"><a href="bosque.html?s=prices">' + esc(({ es: 'Bosque y madera: precios oficiales por tipo de madera, incendios, daños y pellets →', en: 'Forests and timber: official prices by timber type, fires, damage and pellets →', fr: 'Forêts et bois : prix officiels par type de bois, incendies, dégâts et granulés →', it: 'Foreste e legno: prezzi ufficiali per tipo di legname, incendi, danni e pellet →' })[lang()] || '') + '</a></div>' +
      '<div class="di-info-scope-note" id="pr-madera-note">' + esc(mad.scopeNote) + '</div>' +
      infoSourcesHtml('madera')
    );
  }

  function newsImpactLabels() {
    return {
      es:{input_cost:'COSTE DE INSUMOS',trade:'COMERCIO',weather:'CLIMA',supply:'OFERTA',energy:'ENERGÍA',policy:'POLÍTICA',market_impact:'IMPACTO EN EL MERCADO'},
      en:{input_cost:'INPUT COST',trade:'TRADE',weather:'WEATHER',supply:'SUPPLY',energy:'ENERGY',policy:'POLICY',market_impact:'MARKET IMPACT'},
      fr:{input_cost:'COÛTS DES INTRANTS',trade:'COMMERCE',weather:'CLIMAT',supply:'OFFRE',energy:'ÉNERGIE',policy:'POLITIQUE',market_impact:'IMPACT MARCHÉ'},
      it:{input_cost:'COSTI INPUT',trade:'COMMERCIO',weather:'METEO',supply:'OFFERTA',energy:'ENERGIA',policy:'POLITICA',market_impact:'IMPATTO MERCATO'}
    };
  }
  function newsMarketLabel(key) {
    var aliases={maiz:'maiz',trigo:'trigo',soja:'soja',arroz:'arroz',cebada:'cebada',azucar:'azucar',leche:'leche',fertilizantes:'fertilizantes',diesel:'diesel',energia:'energia'};
    return productName(aliases[key] || key);
  }
  function newsImpactHtml(n) {
    var lg=lang(), labels=newsImpactLabels()[lg]||newsImpactLabels().es;
    var links=n.marketLinks||[];
    var primary=n.impactChannel || (links[0]&&links[0].channel);
    if(!primary || primary==='market_impact') return '';   // una simple mención no demuestra efecto de mercado: sin etiqueta de impacto
    var badge='<span class="di-news-impact-badge di-news-impact-'+esc(primary)+'">'+esc(labels[primary]||labels.market_impact)+'</span>';
    var markets=[];
    links.forEach(function(l){ if(markets.indexOf(l.market)<0) markets.push(l.market); });
    var marketText=markets.slice(0,4).map(newsMarketLabel).join(' · ');
    var relationMap=(global.DehesaPreciosIntel&&global.DehesaPreciosIntel.getRelationships)?global.DehesaPreciosIntel.getRelationships():{};
    var alertMap=(global.DehesaPreciosIntel&&global.DehesaPreciosIntel.getTransmissionAlerts)?global.DehesaPreciosIntel.getTransmissionAlerts():{};
    var relLinks=links.filter(function(l){return l.relation && relationMap[l.relation] && relationMap[l.relation].status==='ready';});
    var activeAlerts=links.filter(function(l){return l.relation && Object.keys(alertMap).some(function(k){return alertMap[k].relationship && alertMap[k].relationship.id===l.relation;});});
    var relHtml=relLinks.slice(0,1).map(function(l){
      var r=relationMap[l.relation];
      var conf=(r.confidence||'').toUpperCase();
      var unit=r.frequency==='quarterly'?(r.lagPeriods===1?'trimestre':'trimestres'):(r.lagPeriods===1?'mes':'meses');
      return '<span class="di-news-impact-relation">'+esc(r.label)+' · lag '+esc(String(r.lagPeriods)+' '+unit)+' · '+esc(conf)+'</span>';
    }).join('');
    var alertHtml=activeAlerts.length ? '<span class="di-news-impact-alert">⚠ TRANSMISSION WATCH</span>' : '';
    return '<div class="di-news-impact">'+badge+(marketText?'<span class="di-news-impact-markets">'+esc(marketText)+'</span>':'')+relHtml+alertHtml+'</div>';
  }

  function renderMarketNewsIntel() {
    var root = document.getElementById('pr-news-intel');
    if (!root || !global.DehesaNewsIndex) return;

    // Build a cross-market feed from the compact verified news index.
    // Category-specific stories are preferred; if none exist for the selected
    // market/region, fall back to the most recent global/compatible stories so
    // this module never renders an empty news bar.
    var stories = [];
    var seen = {};
    var preferred = productsInCat(state.activeTab);

    preferred.forEach(function(entry) {
      (global.DehesaNewsIndex[entry.nameKey] || []).forEach(function(n) {
        if (!seen[n.id]) { seen[n.id] = true; stories.push(n); }
      });
    });

    stories.sort(function(a,b){ return a.date < b.date ? 1 : -1; });

    var region = state.location || 'us';
    // Primero lo de la región elegida; las noticias «globales» solo rellenan si de esa región no hay ninguna (así EE. UU. no enseña titulares de otros países).
    var compatible = stories.filter(function(n) { return n.region === region; }), usedGlobal = false;
    if (!compatible.length) { compatible = stories.filter(function(n) { return n.region === 'global'; }); usedGlobal = compatible.length > 0; }

    // If the selected category has no regional match, use the latest
    // global/compatible market stories across the entire news index.
    if (!compatible.length) {
      compatible = [];
      [region, 'global'].forEach(function(want) {
        if (compatible.length) return;
        Object.keys(global.DehesaNewsIndex).forEach(function(key) {
          (global.DehesaNewsIndex[key] || []).forEach(function(n) {
            if (!seen['fallback-' + n.id] && n.region === want) {
              seen['fallback-' + n.id] = true;
              compatible.push(n);
            }
          });
        });
        usedGlobal = want === 'global' && compatible.length > 0;
      });
      compatible.sort(function(a,b){ return a.date < b.date ? 1 : -1; });
    }

    var selected = compatible.slice(0, 4);
    var lg = lang();
    var title = lg === 'es' ? 'Noticias del mercado' :
      lg === 'fr' ? 'Actualités du marché' :
      lg === 'it' ? 'Notizie di mercato' : 'Market news';
    var linkLabel = lg === 'es' ? 'News Intelligence →' :
      lg === 'fr' ? 'News Intelligence →' :
      lg === 'it' ? 'News Intelligence →' : 'News Intelligence →';
    var RL = { us: { es: 'EE. UU.', en: 'US', fr: 'États-Unis', it: 'USA' }, eu: { es: 'Europa', en: 'Europe', fr: 'Europe', it: 'Europa' }, uk: { es: 'Reino Unido', en: 'UK', fr: 'Royaume-Uni', it: 'Regno Unito' }, ca: { es: 'Canadá', en: 'Canada', fr: 'Canada', it: 'Canada' }, gl: { es: 'Global', en: 'Global', fr: 'Mondial', it: 'Globale' } };
    var regionLabel = (RL[usedGlobal ? 'gl' : region] || RL.gl)[lg] || RL.gl.es;

    if (!selected.length) {
      root.innerHTML =
        '<div class="di-market-news-intel di-market-news-empty">' +
          '<div class="di-market-news-copy"><span class="di-section-kicker">' + esc(({ es: 'NOTICIAS', en: 'NEWS', fr: 'ACTUALITÉS', it: 'NOTIZIE' })[lang()] || 'NOTICIAS') + '</span>' +
          '<h2>' + esc(title) + '</h2>' +
          '<p>' + esc(lg === 'es' ? 'La cobertura editorial verificada se está actualizando.' : lg === 'fr' ? 'La couverture éditoriale vérifiée est en cours de mise à jour.' : lg === 'it' ? 'La copertura editoriale verificata è in aggiornamento.' : 'Verified editorial coverage is being updated.') + '</p></div>' +
          '<a class="di-market-news-link" href="noticias.html">' + esc(linkLabel) + '</a>' +
        '</div>';
      return;
    }

    root.innerHTML =
      '<div class="di-market-news-intel">' +
        '<div class="di-market-news-copy">' +
          '<span class="di-section-kicker">' + esc(({ es: 'NOTICIAS', en: 'NEWS', fr: 'ACTUALITÉS', it: 'NOTIZIE' })[lang()] || 'NOTICIAS') + ' · ' + esc(regionLabel) + '</span>' +
          '<h2>' + esc(title) + '</h2>' +
          '<p>' + (lg === 'es' ? 'Titulares recientes vinculados a este mercado y, cuando no hay cobertura local, a factores globales que pueden afectarlo.' :
                     lg === 'fr' ? 'Titres récents liés à ce marché et, en l’absence de couverture locale, aux facteurs mondiaux susceptibles de l’affecter.' :
                     lg === 'it' ? 'Titoli recenti collegati a questo mercato e, quando manca copertura locale, ai fattori globali che possono influenzarlo.' :
                     'Recent headlines linked to this market and, when local coverage is unavailable, to global factors that may affect it.') + '</p>' +
        '</div>' +
        '<a class="di-market-news-link" href="noticias.html">' + esc(linkLabel) + '</a>' +
        '<div class="di-market-news-stories">' +
          selected.map(function(n) {
            var h = n.headline[lg] || n.headline.es;
            return '<a class="di-market-news-story" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer">' +
              '<span>' + esc(n.source) + ' · ' + esc(n.date) + '</span>' +
              '<strong>' + esc(h) + '</strong>' + newsImpactHtml(n) +
            '</a>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------------
  // Reino Unido: índices de precios agrarios de Defra (OGL v3.0), base 2020=100.
  // Defra no publica £/tonelada ni £/cabeza (eso es AHDB, bloqueado por licencia), así que
  // las pestañas del Reino Unido muestran el índice, con la etiqueta de que NO es un precio.
  // ---------------------------------------------------------------------
  var UK_IDX = {
    defra_wheat_output_index: ['cereales', 'out', { es: 'Trigo', en: 'Wheat', fr: 'Blé', it: 'Frumento' }],
    defra_barley_output_index: ['cereales', 'out', { es: 'Cebada', en: 'Barley', fr: 'Orge', it: 'Orzo' }],
    defra_oilseed_rape_output_index: ['cereales', 'out', { es: 'Colza', en: 'Oilseed rape', fr: 'Colza', it: 'Colza' }],
    defra_milk_output_index: ['lacteos', 'out', { es: 'Leche', en: 'Milk', fr: 'Lait', it: 'Latte' }],
    defra_cattle_output_index: ['ganado', 'out', { es: 'Vacuno y terneros', en: 'Cattle and calves', fr: 'Bovins et veaux', it: 'Bovini e vitelli' }],
    defra_pigs_output_index: ['porcino', 'out', { es: 'Cerdos', en: 'Pigs', fr: 'Porcs', it: 'Suini' }],
    defra_sheep_output_index: ['ovino', 'out', { es: 'Ovino y corderos', en: 'Sheep and lambs', fr: 'Ovins et agneaux', it: 'Ovini e agnelli' }],
    defra_eggs_output_index: ['avicultura', 'out', { es: 'Huevos', en: 'Eggs', fr: 'Œufs', it: 'Uova' }],
    defra_feed_input_index: ['pienso', 'in', { es: 'Piensos', en: 'Feed', fr: 'Aliments du bétail', it: 'Mangimi' }],
    defra_fertiliser_input_index: ['fertilizantes', 'in', { es: 'Fertilizantes y enmiendas', en: 'Fertilisers and soil improvers', fr: 'Engrais et amendements', it: 'Fertilizzanti e ammendanti' }],
    defra_energy_input_index: ['energia', 'in', { es: 'Energía y lubricantes', en: 'Energy and lubricants', fr: 'Énergie et lubrifiants', it: 'Energia e lubrificanti' }]
  };
  var UK_IDX_TXT = {
    es: { tag: 'Índice de precios agrarios, 2020=100, no es £/tonelada', out: 'precios percibidos por el agricultor', inn: 'precios pagados por el agricultor', idx: 'índice', asof: 'dato de ', badge: 'ÍNDICE',
          note: '<strong>Reino Unido: aquí hay índices, no precios.</strong> Los precios de mercado en libras (cereales, vacuno, cerdo, cordero…) los publica AHDB, cuyas condiciones prohíben usarlos sin licencia, así que no los mostramos. Defra sí publica índices de precios agrarios (base 2020=100) y esos son los que ves marcados como «ÍNDICE». El resto de datos del Reino Unido (sacrificio, huevos, leche, rentas de las explotaciones) está en su perfil.',
          link: 'Ver el perfil del Reino Unido' },
    en: { tag: 'Agricultural price index, 2020=100, not £/tonne', out: 'prices received by farmers', inn: 'prices paid by farmers', idx: 'index', asof: 'as of ', badge: 'INDEX',
          note: '<strong>United Kingdom: these are indices, not prices.</strong> Market prices in pounds (cereals, beef, pork, lamb…) are published by AHDB, whose terms prohibit use without a licence, so we do not show them. Defra does publish agricultural price indices (2020=100) and those are the cards marked “INDEX”. The rest of the UK data (slaughter, eggs, milk, farm incomes) is in its profile.',
          link: 'See the United Kingdom profile' },
    fr: { tag: 'Indice des prix agricoles, 2020=100, pas des £/tonne', out: 'prix reçus par les agriculteurs', inn: 'prix payés par les agriculteurs', idx: 'indice', asof: 'donnée de ', badge: 'INDICE',
          note: '<strong>Royaume-Uni : ce sont des indices, pas des prix.</strong> Les prix de marché en livres (céréales, bœuf, porc, agneau…) sont publiés par l’AHDB, dont les conditions interdisent l’usage sans licence ; nous ne les affichons donc pas. Defra publie bien des indices de prix agricoles (base 2020=100) : ce sont les cartes marquées « INDICE ». Le reste des données britanniques (abattages, œufs, lait, revenus agricoles) figure dans son profil.',
          link: 'Voir le profil du Royaume-Uni' },
    it: { tag: 'Indice dei prezzi agricoli, 2020=100, non è £/tonnellata', out: 'prezzi ricevuti dagli agricoltori', inn: 'prezzi pagati dagli agricoltori', idx: 'indice', asof: 'dato di ', badge: 'INDICE',
          note: '<strong>Regno Unito: qui ci sono indici, non prezzi.</strong> I prezzi di mercato in sterline (cereali, bovino, suino, agnello…) li pubblica AHDB, le cui condizioni vietano l’uso senza licenza, quindi non li mostriamo. Defra pubblica invece indici dei prezzi agricoli (base 2020=100): sono le schede contrassegnate «INDICE». Il resto dei dati britannici (macellazione, uova, latte, redditi agricoli) è nel suo profilo.',
          link: 'Vedi il profilo del Regno Unito' }
  };
  var ukIdxObs = [];
  function ukIdxList(catId) {
    if (state.location !== 'uk') return [];
    return ukIdxObs.filter(function (o) { return UK_IDX[o.product] && UK_IDX[o.product][0] === catId; });
  }
  function ukIdxCardHtml(o) {
    var lg = lang(), X = UK_IDX_TXT[lg] || UK_IDX_TXT.es, d = UK_IDX[o.product];
    var nf = function (v, n) { try { return Number(v).toLocaleString(({ es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' })[lg] || 'es-ES', { minimumFractionDigits: n, maximumFractionDigits: n }); } catch (e) { return String(v); } };
    var pct = typeof o.changePct === 'number' ? (o.changePct > 0 ? '+' : o.changePct < 0 ? '−' : '') + nf(Math.abs(o.changePct), 1) + ' %' : '';
    var col = typeof o.changePct === 'number' && o.changePct !== 0 ? (o.changePct > 0 ? 'var(--positive, #1b6b3a)' : 'var(--negative, #b3261e)') : 'var(--text-faint)';
    var sp = (o.spark || []).filter(function (v) { return typeof v === 'number'; });
    var svg = sp.length > 1 ? '<svg class="di-product-spark" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true"><path d="' + D.spark(sp) + '" stroke="' + col + '" fill="none" stroke-width="2"/></svg>' : '';
    var od = o.observationDate ? S.fmtDate(o.observationDate, lg) : '';
    var meta = [({ es: 'Reino Unido', en: 'United Kingdom', fr: 'Royaume-Uni', it: 'Regno Unito' })[lg], 'Defra', d[1] === 'out' ? X.out : X.inn, od ? X.asof + od : ''].filter(Boolean).join(' · ');
    return '<div class="di-card di-product-card di-product-state-index" data-key="uk-idx:' + esc(o.product) + '">' +
      '<div class="di-product-head"><div><h3 class="di-product-name">' + esc(d[2][lg] || d[2].es) + ' · ' + esc(X.idx) + '</h3>' +
      '<span class="di-product-state di-product-state-badge verified" title="' + esc(X.tag) + '">' + esc(X.badge) + '</span>' +
      '<div class="di-product-meta">' + esc(meta) + '</div></div></div>' +
      '<div class="di-product-price-row"><span class="di-product-price">' + esc(nf(o.value, 1)) + '</span>' +
      '<span class="di-product-unit">' + esc(({ es: 'índice 2020=100', en: 'index 2020=100', fr: 'indice 2020=100', it: 'indice 2020=100' })[lg]) + '</span>' +
      '<span class="di-product-change" style="color:' + col + ';">' + esc(pct) + '</span></div>' +
      svg + '<div class="di-product-footnote">' + esc(X.tag) + '</div></div>';
  }
  function ukNoticeHtml() {
    if (state.location !== 'uk') return '';
    var X = UK_IDX_TXT[lang()] || UK_IDX_TXT.es;
    return '<div class="di-derived-note di-uk-notice" role="note" style="margin:0 0 14px">' + X.note + ' <a href="paises.html?c=UK">' + esc(X.link) + '</a></div>';
  }

  function renderCategory() {
    renderMarketNewsIntel();
    var root = document.getElementById('pr-category');
    if (INFO_CATS[state.activeTab]) {
      if (state.activeTab === 'seguro' && global.DehesaSeguro) {
        // Seguro agrario: cifras de data/crop-insurance.json (USDA RMA) y data/enesa-contratacion.json (ENESA); ver js/seguro.js
        // cada ubicacion solo ve el seguro de su zona; la linea de fuentes, igual (Canada cita StatCan en sus tarjetas)
        root.innerHTML = '<div id="pr-seguro"></div>' + infoSourcesHtml('seguro', ({ us: ['USDA RMA'], eu: ['ENESA (MAPA)'] })[state.location || 'us'] || []);
        global.DehesaSeguro.render(document.getElementById('pr-seguro'), { region: state.location || 'us', euCountry: state.euCountry, euCountryName: ccName(state.euCountry || 'es') });
        return;
      }
      if (state.activeTab === 'hortalizas') {
        // Frutas, hortalizas y frutos secos: precio semanal por país (Comisión Europea) y precio percibido (MAPA); ver js/precios-fv.js y data/fv-products.json
        root.innerHTML = '<div id="pr-fv"></div>';
        var fvGo = function () { global.DehesaFV.render(document.getElementById('pr-fv'), { location: state.location, euCountry: state.euCountry, saCountry: state.saCountry, lang: lang() }); };
        if (global.DehesaFV) fvGo(); else { var fs = document.createElement('script'); fs.src = 'js/precios-fv.js?v=0'; fs.onload = fvGo; document.head.appendChild(fs); }
        return;
      }
      root.innerHTML = renderInfoCategoryHtml(state.activeTab);
      if (state.activeTab === 'madera' && global.DehesaWoodNA) { var wn = document.getElementById('pr-wood-na'); if (wn) { var wcc = wn.getAttribute('data-cc'); global.DehesaWoodNA.render(wn, wcc); global.DehesaWoodNA.has(wcc).then(function (ok) { var g = document.getElementById('pr-wood-gap'); if (g) g.hidden = ok; }); } }
      if (state.activeTab === 'madera' && global.DehesaWoodDE && document.getElementById('pr-wood-de')) global.DehesaWoodDE.render(document.getElementById('pr-wood-de'));
      if (state.activeTab === 'madera' && global.DehesaWood) global.DehesaWood.render(document.getElementById('pr-wood'));
      if (state.activeTab === 'vino' && global.DehesaWine) { root.innerHTML = '<div id="pr-vino">' + root.innerHTML + '</div>'; global.DehesaWine.render(document.getElementById('pr-vino')); }
      return;
    }
    var all = productsInCat(state.activeTab), t = ui();
    var entries = all.filter(entryHasData), missing = all.filter(function (e) { return entries.indexOf(e) < 0 && !!resolveDisplay(e, state.location, state.euCountry).region; }); // un producto que no existe en este mercado (p. ej. novillos de Alberta en la UE) no cuenta como "sin datos"
    var idxCards = ukIdxList(state.activeTab).map(ukIdxCardHtml);
    root.innerHTML = ukNoticeHtml() + (entries.length || idxCards.length ? viewBar() + '<div class="di-product-grid' + (viewMode() === 'rows' ? ' di-rows' : '') + '">' + entries.map(function (e) { return productCardHtml(e, {}); }).join('') + idxCards.join('') + '</div>' : '<p class="di-movers-hint">' + esc(t.noDataHereAll) + '</p>') +
      (missing.length ? '<details class="di-nodata-list" style="margin-top:14px"><summary style="cursor:pointer;font-size:13px;color:var(--text-faint)">' + esc(t.noDataHere) + ' (' + missing.length + ')</summary><p class="di-movers-hint" style="margin-top:6px">' + missing.map(function (e) { return esc(productName(e.nameKey)); }).join(' · ') + '</p></details>' : '');
    wireCardEvents(root);
    if (state.activeTab === 'tropicales' && global.DehesaSofts) { var sf = document.createElement('div'); sf.id = 'pr-softs'; root.appendChild(sf); global.DehesaSofts.render(sf); }
  }

  /* Vista de la lista de productos: filas compactas (por defecto) o tarjetas. Se guarda por navegador. */
  var VW = { es: ['Filas', 'Tarjetas', 'Vista', 'Detalle'], en: ['Rows', 'Cards', 'View', 'Details'], fr: ['Lignes', 'Cartes', 'Vue', 'Détail'], it: ['Righe', 'Schede', 'Vista', 'Dettaglio'] };
  function viewMode() { try { return window.localStorage.getItem('dehesaIndexPrView') === 'cards' ? 'cards' : 'rows'; } catch (e) { return 'rows'; } }
  function viewBar() { var v = VW[lang()] || VW.es, m = viewMode(); return '<div class="di-view-bar" role="group" aria-label="' + esc(v[2]) + '"><span>' + esc(v[2]) + ':</span><button type="button" data-view="rows" aria-pressed="' + (m === 'rows') + '">' + esc(v[0]) + '</button><button type="button" data-view="cards" aria-pressed="' + (m === 'cards') + '">' + esc(v[1]) + '</button></div>'; }

  function wireCardEvents(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-view]'), function (b) { b.onclick = function () { try { window.localStorage.setItem('dehesaIndexPrView', b.getAttribute('data-view')); } catch (e) {} var g = root.querySelector('.di-product-grid'); if (g) g.classList.toggle('di-rows', b.getAttribute('data-view') === 'rows'); Array.prototype.forEach.call(root.querySelectorAll('[data-view]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }; });
    Array.prototype.forEach.call(root.querySelectorAll('.di-rows [data-action="rowexp"], .di-product-grid [data-action="rowexp"]'), function (b) { b.onclick = function () { var c = b.closest('.di-product-card'); var o = c.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); }; });
    var favBtns = root.querySelectorAll('[data-action="fav"]');
    Array.prototype.forEach.call(favBtns, function (btn) {
      btn.addEventListener('click', function () { toggleFavorite(btn.getAttribute('data-key')); });
    });
    var breakdownBtns = root.querySelectorAll('[data-action="breakdown"]');
    Array.prototype.forEach.call(breakdownBtns, function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-key');
        state.expanded[key] = !state.expanded[key];
        renderCategory();
        renderFavorites();
      });
    });
    var calcBtns = root.querySelectorAll('[data-action="calc"]');
    Array.prototype.forEach.call(calcBtns, function (btn) {
      btn.addEventListener('click', function () { openCalc(btn.getAttribute('data-key')); });
    });
    var historyBtns = root.querySelectorAll('[data-action="history"]');
    Array.prototype.forEach.call(historyBtns, function (btn) {
      btn.addEventListener('click', function () { var k = btn.getAttribute('data-key'); if (lonjaPick(PRODUCT_BY_KEY[k] || {})) openLonjaHistory(k); else if (provPick(PRODUCT_BY_KEY[k] || {})) openProvHistory(k); else openHistory(k); });
    });
    // El minigrafico de la tarjeta tambien abre el historico ampliado (como el boton 📈): raton, teclado (Intro/Espacio) y tactil
    var sparks = root.querySelectorAll('[data-action="spark-history"]');
    Array.prototype.forEach.call(sparks, function (sp) {
      sp.addEventListener('click', function (ev) { ev.stopPropagation(); var k = sp.getAttribute('data-key'); if (lonjaPick(PRODUCT_BY_KEY[k] || {})) openLonjaHistory(k); else if (provPick(PRODUCT_BY_KEY[k] || {})) openProvHistory(k); else openHistory(k); });
      sp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); var k = sp.getAttribute('data-key'); if (lonjaPick(PRODUCT_BY_KEY[k] || {})) openLonjaHistory(k); else if (provPick(PRODUCT_BY_KEY[k] || {})) openProvHistory(k); else openHistory(k); } });
    });
    var alertBtns = root.querySelectorAll('[data-action="alert"]');
    Array.prototype.forEach.call(alertBtns, function (btn) {
      btn.addEventListener('click', function () { openAlert(btn.getAttribute('data-key')); });
    });
  }

  var modalScrollY = 0;
  var modalFocusEl = null;
  function lockProductModal() {
    if (modalScrollY === null) return;
    modalScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    modalFocusEl = document.activeElement;
    document.body.classList.add('di-modal-open');
    document.body.style.top = '-' + modalScrollY + 'px';
  }
  function unlockProductModal() {
    document.body.classList.remove('di-modal-open');
    document.body.style.top = '';
    var y = modalScrollY || 0;
    window.scrollTo(0, y);
    if (modalFocusEl && typeof modalFocusEl.focus === 'function') {
      try { modalFocusEl.focus({ preventScroll: true }); } catch (e) { modalFocusEl.focus(); }
    }
    modalFocusEl = null;
    modalScrollY = 0;
  }
  function bindModalKeyboard(closeFn) {
    var root = document.getElementById('pr-modal-root');
    if (!root) return;
    root.onkeydown = function(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeFn(); }
    };
    var first = root.querySelector('button, input, select, [tabindex="0"]');
    if (first) setTimeout(function(){ try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 0);
  }

  // ---------------------------------------------------------------------
  // Modal: Histórico ampliado
  // ---------------------------------------------------------------------
  function seedKeyFor(entry, regionCode) { return entry.catId + ':' + entry.nameKey + ':' + regionCode; }

  function openHistory(key) {
    var entry = PRODUCT_BY_KEY[key];
    if (!entry) return;
    state.history = { key: key, region: defaultRegionFor(entry), range: '1y', compareMode: false, compareKey: '', yoy: false };
    lockProductModal();
    renderHistoryModal();
  }

  // Historico de un mercado local de la UE (lonja): la serie semanal publicada por la Comision, sin conversion.
  var LH_T = { es: ['Histórico del mercado', 'Último', 'Mínimo', 'Máximo', 'Cerrar', 'Serie semanal publicada por la Comisión Europea (Agri-food Data Portal), EUR/t, sin convertir.'], en: ['Market history', 'Latest', 'Low', 'High', 'Close', 'Weekly series published by the European Commission (Agri-food Data Portal), EUR/t, not converted.'], fr: ['Historique du marché', 'Dernier', 'Plus bas', 'Plus haut', 'Fermer', 'Série hebdomadaire publiée par la Commission européenne (Agri-food Data Portal), EUR/t, sans conversion.'], it: ['Storico del mercato', 'Ultimo', 'Minimo', 'Massimo', 'Chiudi', 'Serie settimanale pubblicata dalla Commissione europea (Agri-food Data Portal), EUR/t, senza conversione.'] };
  function closeLonjaHistory() { var r = document.getElementById('pr-modal-root'); if (r) r.innerHTML = ''; unlockProductModal(); }
  function openLonjaHistory(key) {
    var entry = PRODUCT_BY_KEY[key]; if (!entry) return;
    var l = lonjaPick(entry); if (!l || !l.p || l.p.length < 2 || !window.DehesaChart) return;
    var X = LH_T[lang()] || LH_T.es, pts = l.p.map(function (q) { return { x: Date.parse(q[0] + 'T00:00:00Z'), y: q[1], l: l.f === 'm' ? monthTxt(q[0]) : S.fmtDate(q[0], lang()) }; });
    var vals = l.p.map(function (q) { return q[1]; }), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), last = l.p[l.p.length - 1];
    var cu = l.c || 'EUR', f = function (v) { return D.fmtNumber(v) + ' ' + cu + '/t'; };
    lockProductModal();
    var chart = window.DehesaChart.render({ series: [{ name: productName(entry.nameKey), color: '#2f6b4a', pts: pts }], xMode: 'time', yTitle: (l.c || 'EUR') + '/t', aria: productName(entry.nameKey) + ' · ' + lonjaLabel(l), noLegend: true, vFmt: function (v) { return D.fmtNumber(v); } });
    document.getElementById('pr-modal-root').innerHTML = '<div class="di-modal-overlay" id="di-history-overlay"><div class="di-big-modal-card"><div class="di-modal-head"><h2 class="di-modal-title">' + esc(productName(entry.nameKey, h.region)) + ' · ' + esc(lonjaLabel(l)) + ' · ' + esc(X[0]) + '</h2><button type="button" class="di-modal-close" id="di-history-close" aria-label="' + esc(X[4]) + '">✕</button></div>' + chart +
      '<p class="di-field-hint" style="margin:10px 0 2px">' + esc(X[1]) + ': <strong>' + esc(f(last[1])) + '</strong> (' + esc(l.f === 'm' ? monthTxt(last[0]) : S.fmtDate(last[0], lang())) + ') · ' + esc(X[2]) + ': ' + esc(f(mn)) + ' · ' + esc(X[3]) + ': ' + esc(f(mx)) + '</p><p class="di-field-hint" style="margin:2px 0 0">' + esc(l.o && l.c === 'PLN' ? ({ es: 'Serie mensual de GUS (Statistics Poland, BDL) en zlotys, tal como la publica la fuente.', en: 'Monthly series from GUS (Statistics Poland, BDL) in zlotys, as published by the source.', fr: 'Série mensuelle de GUS (Statistics Poland, BDL) en zlotys, telle que publiée par la source.', it: 'Serie mensile di GUS (Statistics Poland, BDL) in złoty, come pubblicata dalla fonte.' })[lang()] : l.o ? ({ es: 'Serie mensual de GUS (Statistics Poland, BDL) en ' + l.o + ', convertida a euros con la media mensual del BCE de cada mes.', en: 'Monthly series from GUS (Statistics Poland, BDL) in ' + l.o + ', converted to euros with the ECB monthly average of each month.', fr: 'Série mensuelle de GUS (Statistics Poland, BDL) en ' + l.o + ', convertie en euros avec la moyenne mensuelle de la BCE de chaque mois.', it: 'Serie mensile di GUS (Statistics Poland, BDL) in ' + l.o + ', convertita in euro con la media mensile della BCE di ogni mese.' })[lang()] : X[5]) + '</p></div></div>';
    var ov = document.getElementById('di-history-overlay'); ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeLonjaHistory(); });
    document.getElementById('di-history-close').addEventListener('click', closeLonjaHistory); bindModalKeyboard(closeLonjaHistory);
  }
  function closeHistory() { state.history = null; renderModalRoot(); unlockProductModal(); }

  function regionObjFor(entry, regionCode, country) {
    var UL = D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es;
    if (regionCode === 'lonja') { var lj = lonjaPick(entry); if (lj) return { region: lonjaRegion(lj), ccy: lj.c || 'EUR', kg: 1000, unit: UL[entry.product.metricUnitKey] }; }
    if (regionCode === 'prov') { var pv = provPick(entry); if (pv && entry.product.ca) return { region: provRegion(pv, entry.product.ca), ccy: 'CAD', kg: entry.product.caKgPerUnit || entry.product.metricKgPerUnit, unit: UL[entry.product.caUnitKey || entry.product.metricUnitKey] }; }
    if (regionCode === 'us') return { region: entry.product.us, ccy: 'USD', kg: entry.product.imperialKgPerUnit, unit: UL[entry.product.imperialUnitKey] };
    if (regionCode === 'eu') {
      var disp = resolveDisplay(entry, 'eu', country || state.euCountry);
      return { region: disp.region, ccy: 'EUR', kg: entry.product.metricKgPerUnit, unit: UL[entry.product.metricUnitKey] };
    }
    if (regionCode === 'ca' && entry.product.ca) return { region: entry.product.ca, ccy: 'CAD', kg: entry.product.caKgPerUnit || entry.product.metricKgPerUnit, unit: UL[entry.product.caUnitKey || entry.product.metricUnitKey] };
    return { region: entry.product.uk || entry.product.eu, ccy: entry.product.uk ? 'GBP' : 'EUR', kg: entry.product.metricKgPerUnit, unit: UL[entry.product.metricUnitKey] };
  }

  function renderHistoryModal() {
    var h = state.history;
    if (!h) return;
    var t = ui();
    var entry = PRODUCT_BY_KEY[h.key];
    // el histórico completo de este producto (y del de comparación) se descarga ahora, no al cargar la página
    var needHist = historyRegions([entry, PRODUCT_BY_KEY[h.compareKey]].filter(Boolean)).filter(function (r) { return !r.histDone; });
    if (needHist.length) {
      document.getElementById('pr-modal-root').innerHTML = '<div class="di-modal-overlay" id="di-history-overlay"><div class="di-big-modal-card"><div class="di-modal-head"><h2 class="di-modal-title">' + esc(productName(entry.nameKey, h.region)) + ' · ' + esc(t.historyButtonTitle) + '</h2><button type="button" class="di-modal-close" id="di-history-close">✕</button></div><div class="di-field-hint" style="padding:40px 12px;text-align:center" role="status">…</div></div></div>';
      var ov = document.getElementById('di-history-overlay'); ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeHistory(); }); document.getElementById('di-history-close').addEventListener('click', closeHistory); bindModalKeyboard(closeHistory);
      Promise.all(needHist.map(loadHistory)).then(function () { if (state.history === h) renderHistoryModal(); });
      return;
    }
    var avail = availableRegions(entry);
    var ro = regionObjFor(entry, h.region);
    var DAY = 86400000, RANGES = [['3m', 92], ['6m', 183], ['1y', 366], ['2y', 731], ['5y', 1827], ['10y', 3653], ['max', 0]];
    var CH = window.DehesaChart, sym = (D.CCY_SYMBOL && D.CCY_SYMBOL[ro.ccy]) || (ro.ccy + ' ');
    function win(pts, days) { if (!days || !pts.length) return pts; var last = pts[pts.length - 1].ts; return pts.filter(function (p) { return p.ts >= last - days * DAY; }); }
    function daysOf(r) { for (var i = 0; i < RANGES.length; i++) if (RANGES[i][0] === r) return RANGES[i][1]; return 0; }
    function dlabel(ts, gran) { return gran === 'month' ? CH.fmtMonth(ts) : CH.fmtDateFull(ts); }
    function xfmt(gran) { return gran === 'month' ? function (ts) { return CH.fmtMonth(ts); } : undefined; }
    function money(v) { var d = Math.abs(v) < 1 ? 3 : 2; try { return sym + v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return sym + v.toFixed(d); } }
    function pctSer(pts, gran) { var base = pts[0].y || 1; return pts.map(function (p) { return { x: p.ts, y: (p.y - base) / base * 100, l: dlabel(p.ts, gran) }; }); }
    function pctFmt(v) { return D.fmtChange(v); }
    var real = D.realHistory(ro.region, ro.ccy, ro.kg, D.FX);
    var opts = [];
    if (real) { var prevN = 0; RANGES.forEach(function (r) { var n = win(real.pts, r[1]).length; if (n >= 2 && n > prevN) { opts.push(r[0]); prevN = n; } }); }
    if (opts.length && opts.indexOf(h.range) < 0) h.range = opts[opts.length - 1];
    var days = daysOf(h.range);
    h.exp = null;

    var regionBtns = avail.map(function (r) {
      return '<button type="button" class="di-region-btn' + (r === h.region ? ' active' : '') + '" data-hregion="' + r + '">' + esc(D.REGION[lang()][r]) + '</button>';
    }).join('');
    var rangeBtns = opts.map(function (r) {
      return '<button type="button" class="di-range-btn' + (r === h.range ? ' active' : '') + '" data-hrange="' + r + '">' + r.toUpperCase() + '</button>';
    }).join('');

    var none = function (msg) { return '<div class="di-field-hint" style="padding:26px 12px;text-align:center">' + esc(msg) + '</div>'; };
    var chartHtml = '';
    if (!real) {
      chartHtml = none(t.historyNone);
    } else if (h.compareMode && h.compareKey && PRODUCT_BY_KEY[h.compareKey]) {
      var cEntry = PRODUCT_BY_KEY[h.compareKey];
      var cRo = regionObjFor(cEntry, defaultRegionFor(cEntry));
      var cReal = D.realHistory(cRo.region, cRo.ccy, cRo.kg, D.FX);
      if (!cReal) chartHtml = none(t.historyNone + ' (' + productName(cEntry.nameKey) + ')');
      else {
        var aW = win(real.pts, days), bW = win(cReal.pts, days);
        if (aW.length < 2 || bW.length < 2) chartHtml = none(t.historyNone);
        else {
          var aS = pctSer(aW, real.gran), bS = pctSer(bW, cReal.gran);
          chartHtml = CH.render({ measurePp: true, xMode: 'time', xTitle: t.csvHeaderDate, yTitle: t.historyAxisPct, aria: productName(entry.nameKey) + ' / ' + productName(cEntry.nameKey), zero: true, noLegend: true, yFmt: function (v) { return v.toLocaleString(lang(), { maximumFractionDigits: 1 }) + ' %'; }, vFmt: pctFmt, xFmt: xfmt(real.gran),
            series: [{ name: productName(cEntry.nameKey), color: T().compareLine, pts: bS }, { name: productName(entry.nameKey), color: T().positive, pts: aS }] }) +
            '<div class="di-history-legend">' +
              '<span><i style="background:' + T().positive + ';"></i>' + esc(productName(entry.nameKey)) + ' <b style="color:' + D.changeColor(aS[aS.length - 1].y, T()) + ';">' + esc(pctFmt(aS[aS.length - 1].y)) + '</b></span>' +
              '<span><i style="background:' + T().compareLine + ';"></i>' + esc(productName(cEntry.nameKey)) + ' <b style="color:' + D.changeColor(bS[bS.length - 1].y, T()) + ';">' + esc(pctFmt(bS[bS.length - 1].y)) + '</b></span>' +
            '</div>' +
            '<div class="di-compare-active-row"><span>' + esc(t.compareActiveLabel) + ' ' + esc(productName(cEntry.nameKey)) + '</span><button type="button" class="di-compare-clear" id="di-compare-clear">' + esc(t.compareClearLabel) + '</button></div>' +
            '<div class="di-field-hint">' + esc(t.compareHint) + '</div>';
        }
      }
    } else if (h.yoy) {
      var tol = real.gran === 'month' ? 16 * DAY : 5 * DAY, cur = win(real.pts, 366), ly = [], curM = [];
      cur.forEach(function (p) {
        var tgt = p.ts - 365 * DAY, best = null, bd = Infinity;
        real.pts.forEach(function (q) { var d = Math.abs(q.ts - tgt); if (d < bd) { bd = d; best = q; } });
        if (best && bd <= tol) { curM.push(p); ly.push({ ts: p.ts, y: best.y, own: best.ts }); }
      });
      if (curM.length < 2) chartHtml = none(t.historyYoyNone);
      else {
        var tS = pctSer(curM, real.gran), base = ly[0].y || 1;
        var lS = ly.map(function (p) { return { x: p.ts, y: (p.y - base) / base * 100, l: dlabel(p.own, real.gran) }; });
        chartHtml = CH.render({ xMode: 'time', xTitle: t.csvHeaderDate, yTitle: t.historyAxisPct, aria: t.historyYoyThisYear + ' / ' + t.historyYoyLastYear, zero: true, noLegend: true, yFmt: function (v) { return v.toLocaleString(lang(), { maximumFractionDigits: 1 }) + ' %'; }, vFmt: pctFmt, xFmt: xfmt(real.gran),
          series: [{ name: t.historyYoyLastYear, color: T().compareLine, pts: lS }, { name: t.historyYoyThisYear, color: T().positive, pts: tS }] }) +
          '<div class="di-history-legend">' +
            '<span><i style="background:' + T().positive + ';"></i>' + esc(t.historyYoyThisYear) + ' <b style="color:' + D.changeColor(tS[tS.length - 1].y, T()) + ';">' + esc(pctFmt(tS[tS.length - 1].y)) + '</b></span>' +
            '<span><i style="background:' + T().compareLine + ';"></i>' + esc(t.historyYoyLastYear) + ' <b style="color:' + D.changeColor(lS[lS.length - 1].y, T()) + ';">' + esc(pctFmt(lS[lS.length - 1].y)) + '</b></span>' +
          '</div>' +
          '<div class="di-field-hint">' + esc(t.compareHint) + '</div>';
      }
    } else {
      var W2 = win(real.pts, days), vals = W2.map(function (p) { return p.y; });
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), av = vals.reduce(function (s, v) { return s + v; }, 0) / vals.length;
      var chg = vals[0] ? (vals[vals.length - 1] - vals[0]) / vals[0] * 100 : 0, unitTxt = ro.ccy + '/' + ro.unit;
      h.exp = { pts: W2, gran: real.gran };
      chartHtml = CH.render({ xMode: 'time', xTitle: t.csvHeaderDate, yTitle: unitTxt, aria: productName(entry.nameKey), xFmt: xfmt(real.gran), vFmt: function (v) { return money(v) + ' /' + ro.unit; },
        series: [{ name: productName(entry.nameKey), color: D.trendColor(vals, T()), pts: W2.map(function (p) { return { x: p.ts, y: p.y, l: dlabel(p.ts, real.gran) }; }) }] }) +
        '<div class="di-history-stats">' +
          '<span>' + esc(t.historyMin) + ' <b>' + esc(money(mn)) + '</b></span>' +
          '<span>' + esc(t.historyAvg) + ' <b>' + esc(money(av)) + '</b></span>' +
          '<span>' + esc(t.historyMax) + ' <b>' + esc(money(mx)) + '</b></span>' +
          '<span style="margin-left:auto;color:' + D.changeColor(chg, T()) + ';font-weight:700;">' + esc(D.fmtChange(chg)) + ' <small style="font-weight:400;color:var(--text-faint);">' + esc(t.historyChangeOver || '') + '</small></span>' +
        '</div>';
    }

    var presetsHtml = D.HISTORY_COMPARE_PRESETS.map(function (pair) {
      var kA = pair[0].replace('-', ':'), kB = pair[1].replace('-', ':');
      var pick = (kA === h.key) ? kB : (kB === h.key) ? kA : kB;
      var pEntry = PRODUCT_BY_KEY[pick];
      if (!pEntry) return '';
      return '<button type="button" class="di-compare-preset-btn" data-preset="' + pick + '">' + esc(productName(pEntry.nameKey)) + '</button>';
    }).join('');

    var otherProducts = PRODUCTS.filter(function (e) { return e.catId + ':' + e.nameKey !== h.key; });
    var selectOptions = '<option value="">' + esc(t.compareNoneOption) + '</option>' + otherProducts.map(function (e) {
      var k = e.catId + ':' + e.nameKey;
      return '<option value="' + k + '"' + (k === h.compareKey ? ' selected' : '') + '>' + esc(productName(e.nameKey)) + '</option>';
    }).join('');

    var comparePanel = !h.compareMode ? '' :
      '<div class="di-compare-panel">' +
        '<div class="di-field-label">' + esc(t.comparePresetsLabel) + '</div>' + presetsHtml +
        '<div class="di-field-label" style="margin-top:10px;">' + esc(t.compareFreeLabel) + '</div>' +
        '<select class="di-compare-select" id="di-compare-select">' + selectOptions + '</select>' +
      '</div>';

    var html =
      '<div class="di-modal-overlay" id="di-history-overlay">' +
        '<div class="di-big-modal-card">' +
          '<div class="di-modal-head"><h2 class="di-modal-title">' + esc(productName(entry.nameKey, h.region)) + ' · ' + esc(t.historyButtonTitle) + '</h2>' +
            '<button type="button" class="di-modal-close" id="di-history-close">✕</button></div>' +
          '<div class="di-region-btns">' + regionBtns + '</div>' +
          '<div class="di-range-btns">' + rangeBtns + '</div>' +
          chartHtml +
          '<div class="di-compare-toggle-row">' +
            '<label><input type="checkbox" id="di-compare-mode"' + (h.compareMode ? ' checked' : '') + '> ' + esc(t.historyCompareToggle) + '</label>' +
            '<label><input type="checkbox" id="di-yoy-mode"' + (h.yoy ? ' checked' : '') + '> ' + esc(t.compareYoyLabel) + '</label>' +
          '</div>' +
          comparePanel +
          '<button type="button" class="di-export-btn" id="di-history-export">' + esc(t.historyExportButton) + '</button>' +
          '<div class="di-history-disclaimer">' + esc(t.historyDisclaimer) + '</div>' +
        '</div>' +
      '</div>';
    document.getElementById('pr-modal-root').innerHTML = html;
    wireHistoryEvents();
    bindModalKeyboard(closeHistory);
  }

  function wireHistoryEvents() {
    var overlay = document.getElementById('di-history-overlay');
    if (!overlay) return;
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeHistory(); });
    document.getElementById('di-history-close').addEventListener('click', closeHistory);
    Array.prototype.forEach.call(document.querySelectorAll('[data-hregion]'), function (btn) {
      btn.addEventListener('click', function () { state.history.region = btn.getAttribute('data-hregion'); renderHistoryModal(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-hrange]'), function (btn) {
      btn.addEventListener('click', function () { state.history.range = btn.getAttribute('data-hrange'); renderHistoryModal(); });
    });
    document.getElementById('di-compare-mode').addEventListener('change', function (e) {
      state.history.compareMode = e.target.checked;
      if (state.history.compareMode) state.history.yoy = false;
      renderHistoryModal();
    });
    document.getElementById('di-yoy-mode').addEventListener('change', function (e) {
      state.history.yoy = e.target.checked;
      if (state.history.yoy) state.history.compareMode = false;
      renderHistoryModal();
    });
    var presetBtns = document.querySelectorAll('[data-preset]');
    Array.prototype.forEach.call(presetBtns, function (btn) {
      btn.addEventListener('click', function () { state.history.compareKey = btn.getAttribute('data-preset'); renderHistoryModal(); });
    });
    var sel = document.getElementById('di-compare-select');
    if (sel) sel.addEventListener('change', function (e) { state.history.compareKey = e.target.value; renderHistoryModal(); });
    var clearBtn = document.getElementById('di-compare-clear');
    if (clearBtn) clearBtn.addEventListener('click', function () { state.history.compareKey = ''; renderHistoryModal(); });
    document.getElementById('di-history-export').addEventListener('click', function () {
      var h = state.history, entry = PRODUCT_BY_KEY[h.key];
      if (!h.exp || !h.exp.pts.length) return;
      var ro = regionObjFor(entry, h.region), t = ui();
      D.exportRealCsv(t.csvHeaderDate, t.csvHeaderPrice, entry.catId + '-' + entry.nameKey, h.region, h.exp.pts.map(function (p) { return { ts: p.ts, y: p.y }; }), h.exp.gran, ro.ccy, ro.unit);
    });
  }

  // ---------------------------------------------------------------------
  // Modal: Calculadora de coste
  // ---------------------------------------------------------------------
  function openCalc(key) {
    var entry = PRODUCT_BY_KEY[key];
    if (!entry) return;
    var lj = lonjaPick(entry), pj = provPick(entry);
    state.calc = { key: key, region: lj ? 'lonja' : pj ? 'prov' : defaultRegionFor(entry), mode: 'directa' };
    lockProductModal();
    renderCalcModal();
  }
  function closeCalc() { state.calc = null; renderModalRoot(); unlockProductModal(); }

  function calcUnitPrice(entry, regionCode) {
    var ro = regionObjFor(entry, regionCode);
    var built = D.buildRegion(ro.region, '', ro.ccy, ro.kg, ro.unit, D.FX, T());
    return { priceValue: built.priceValue, priceLabel: built.price, unit: built.unit };
  }

  function renderCalcModal() {
    var c = state.calc;
    if (!c) return;
    var t = ui();
    var entry = PRODUCT_BY_KEY[c.key];
    var avail = availableRegions(entry);
    var up = calcUnitPrice(entry, c.region);
    var regionBtns = c.region === 'lonja' || c.region === 'prov' ? '' : avail.map(function (r) {
      return '<button type="button" class="di-region-btn' + (r === c.region ? ' active' : '') + '" data-cregion="' + r + '">' + esc(D.REGION[lang()][r]) + '</button>';
    }).join('');
    var html =
      '<div class="di-modal-overlay" id="di-calc-overlay">' +
        '<div class="di-big-modal-card" style="max-width:440px;">' +
          '<div class="di-modal-head"><h2 class="di-modal-title">' + esc(productName(entry.nameKey, h.region)) + ' · ' + esc(t.calcButtonTitle) + '</h2>' +
            '<button type="button" class="di-modal-close" id="di-calc-close">✕</button></div>' +
          '<div class="di-region-btns">' + regionBtns + '</div>' +
          '<div class="di-field-hint" style="margin-bottom:12px;">' + esc(t.calcTodayPriceLabel) + ' <b>' + esc(up.priceLabel) + esc(up.unit) + '</b></div>' +
          '<div class="di-region-btns">' +
            '<button type="button" class="di-mode-btn' + (c.mode === 'directa' ? ' active' : '') + '" data-cmode="directa">' + esc(t.calcModeDirecta) + '</button>' +
            '<button type="button" class="di-mode-btn' + (c.mode === 'hectareas' ? ' active' : '') + '" data-cmode="hectareas">' + esc(t.calcModeHectareas) + '</button>' +
          '</div>' +
          (c.mode === 'directa' ?
            '<label class="di-field-label">' + esc(t.calcQuantityLabel) + '</label><input type="number" min="0" step="any" class="di-field-input" id="di-calc-qty" value="1">' :
            '<label class="di-field-label">' + esc(t.calcHectaresLabel) + '</label><input type="number" min="0" step="any" class="di-field-input" id="di-calc-ha" value="1" style="margin-bottom:10px;">' +
            '<label class="di-field-label">' + esc(t.calcRateLabel) + '</label><input type="number" min="0" step="any" class="di-field-input" id="di-calc-rate" value="1">' +
            '<div class="di-field-hint">' + esc(t.calcRateHint) + '</div>'
          ) +
          '<div class="di-calc-total-row"><span>' + esc(t.calcTotalLabel) + '</span><span class="di-calc-total-value" id="di-calc-total">—</span></div>' +
        '</div>' +
      '</div>';
    document.getElementById('pr-modal-root').innerHTML = html;
    wireCalcEvents(up);
  }

  function wireCalcEvents(up) {
    var overlay = document.getElementById('di-calc-overlay');
    if (!overlay) return;
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeCalc(); });
    document.getElementById('di-calc-close').addEventListener('click', closeCalc);
    Array.prototype.forEach.call(document.querySelectorAll('[data-cregion]'), function (btn) {
      btn.addEventListener('click', function () { state.calc.region = btn.getAttribute('data-cregion'); renderCalcModal(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-cmode]'), function (btn) {
      btn.addEventListener('click', function () { state.calc.mode = btn.getAttribute('data-cmode'); renderCalcModal(); });
    });
    function recompute() {
      var total = 0;
      if (state.calc.mode === 'directa') {
        var qtyEl = document.getElementById('di-calc-qty');
        var qty = qtyEl ? parseFloat(qtyEl.value) || 0 : 0;
        total = qty * up.priceValue;
      } else {
        var haEl = document.getElementById('di-calc-ha');
        var rateEl = document.getElementById('di-calc-rate');
        var ha = haEl ? parseFloat(haEl.value) || 0 : 0;
        var rate = rateEl ? parseFloat(rateEl.value) || 0 : 0;
        total = ha * rate * up.priceValue;
      }
      var ccy = regionObjFor(PRODUCT_BY_KEY[state.calc.key], state.calc.region).ccy;
      var totalEl = document.getElementById('di-calc-total');
      if (totalEl) totalEl.textContent = (D.CCY_SYMBOL[ccy] || '') + D.fmtTotal(total);
    }
    var qtyEl = document.getElementById('di-calc-qty');
    if (qtyEl) qtyEl.addEventListener('input', recompute);
    var haEl = document.getElementById('di-calc-ha');
    if (haEl) haEl.addEventListener('input', recompute);
    var rateEl = document.getElementById('di-calc-rate');
    if (rateEl) rateEl.addEventListener('input', recompute);
    recompute();
  }

  // ---------------------------------------------------------------------
  // Modal: Alerta de precio
  // ---------------------------------------------------------------------
  function openAlert(key) {
    var entry = PRODUCT_BY_KEY[key];
    if (!entry) return;
    var lj = lonjaPick(entry), pj = provPick(entry);
    state.alert = { key: key, region: lj ? 'lonja' : pj ? 'prov' : defaultRegionFor(entry), direction: 'up', attempted: false, confirmed: false };
    lockProductModal();
    renderAlertModal();
  }
  function closeAlert() { state.alert = null; renderModalRoot(); unlockProductModal(); }

  function renderAlertModal() {
    var a = state.alert;
    if (!a) return;
    var t = ui();
    var entry = PRODUCT_BY_KEY[a.key];
    var avail = availableRegions(entry);
    var regionBtns = a.region === 'lonja' || a.region === 'prov' ? '' : avail.map(function (r) {
      return '<button type="button" class="di-region-btn' + (r === a.region ? ' active' : '') + '" data-aregion="' + r + '">' + esc(D.REGION[lang()][r]) + '</button>';
    }).join('');

    var bodyHtml;
    if (a.confirmed) {
      var dirLabel = a.direction === 'up' ? t.alertDirectionUp : t.alertDirectionDown;
      bodyHtml =
        '<h3 class="di-alert-confirm-title">' + esc(t.alertConfirmedTitle) + '</h3>' +
        '<div class="di-alert-summary-row"><span>' + esc(t.alertSummaryProduct) + '</span><b>' + esc(productName(entry.nameKey)) + '</b></div>' +
        '<div class="di-alert-summary-row"><span>' + esc(t.alertSummaryCondition) + '</span><b>' + esc(dirLabel) + ' ' + esc(a.threshold || '') + '</b></div>' +
        '<div class="di-alert-summary-row"><span>' + esc(t.alertSummaryEmail) + '</span><b>' + esc(a.email || '') + '</b></div>' +
        (a.whatsapp ? '<div class="di-alert-summary-row"><span>' + esc(t.alertSummaryWhatsapp) + '</span><b>' + esc(a.whatsapp) + '</b></div>' : '') +
        '<div class="di-alert-preview-note">' + esc(t.alertConfirmedNote) + '</div>' +
        '<button type="button" class="di-modal-primary-btn" id="di-alert-done">' + esc(t.closeModal) + '</button>';
    } else {
      var emailErr = a.attempted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email || '');
      var thresholdErr = a.attempted && !(parseFloat(a.threshold) > 0);
      bodyHtml =
        '<div class="di-region-btns">' + regionBtns + '</div>' +
        '<div class="di-direction-btns">' +
          '<button type="button" class="di-direction-btn' + (a.direction === 'up' ? ' active' : '') + '" data-adir="up">' + esc(t.alertDirectionUp) + '</button>' +
          '<button type="button" class="di-direction-btn' + (a.direction === 'down' ? ' active' : '') + '" data-adir="down">' + esc(t.alertDirectionDown) + '</button>' +
        '</div>' +
        '<label class="di-field-label">' + esc(t.alertThresholdLabel) + '</label>' +
        '<input type="number" min="0" step="any" class="di-field-input" id="di-alert-threshold" value="' + esc(a.threshold || '') + '">' +
        (thresholdErr ? '<div class="di-alert-error">' + esc(t.alertErrorThreshold) + '</div>' : '') +
        '<label class="di-field-label" style="margin-top:10px;">' + esc(t.alertEmailLabel) + '</label>' +
        '<input type="email" class="di-field-input" id="di-alert-email" placeholder="' + esc(t.alertEmailPlaceholder) + '" value="' + esc(a.email || '') + '">' +
        (emailErr ? '<div class="di-alert-error">' + esc(t.alertErrorEmail) + '</div>' : '') +
        '<label class="di-field-label" style="margin-top:10px;">' + esc(t.alertWhatsappLabel) + '</label>' +
        '<input type="text" class="di-field-input" id="di-alert-whatsapp" placeholder="' + esc(t.alertWhatsappPlaceholder) + '" value="' + esc(a.whatsapp || '') + '">' +
        '<button type="button" class="di-alert-submit" id="di-alert-submit">' + esc(t.alertSubmitButton) + '</button>' +
        '<div class="di-alert-preview-note">' + esc(t.alertPreviewNote) + '</div>';
    }

    var html =
      '<div class="di-modal-overlay" id="di-alert-overlay">' +
        '<div class="di-big-modal-card" style="max-width:440px;">' +
          '<div class="di-modal-head"><h2 class="di-modal-title">' + esc(productName(entry.nameKey, h.region)) + ' · ' + esc(t.alertButtonTitle) + '</h2>' +
            '<button type="button" class="di-modal-close" id="di-alert-close">✕</button></div>' +
          bodyHtml +
        '</div>' +
      '</div>';
    document.getElementById('pr-modal-root').innerHTML = html;
    wireAlertEvents();
    bindModalKeyboard(closeAlert);
  }

  function wireAlertEvents() {
    var overlay = document.getElementById('di-alert-overlay');
    if (!overlay) return;
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeAlert(); });
    document.getElementById('di-alert-close').addEventListener('click', closeAlert);
    var doneBtn = document.getElementById('di-alert-done');
    if (doneBtn) doneBtn.addEventListener('click', closeAlert);
    Array.prototype.forEach.call(document.querySelectorAll('[data-aregion]'), function (btn) {
      btn.addEventListener('click', function () { state.alert.region = btn.getAttribute('data-aregion'); renderAlertModal(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-adir]'), function (btn) {
      btn.addEventListener('click', function () { state.alert.direction = btn.getAttribute('data-adir'); renderAlertModal(); });
    });
    var submitBtn = document.getElementById('di-alert-submit');
    if (submitBtn) submitBtn.addEventListener('click', function () {
      var thresholdEl = document.getElementById('di-alert-threshold');
      var emailEl = document.getElementById('di-alert-email');
      var whatsappEl = document.getElementById('di-alert-whatsapp');
      state.alert.threshold = thresholdEl ? thresholdEl.value : '';
      state.alert.email = emailEl ? emailEl.value : '';
      state.alert.whatsapp = whatsappEl ? whatsappEl.value : '';
      state.alert.attempted = true;
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.alert.email || '');
      var thresholdOk = parseFloat(state.alert.threshold) > 0;
      if (emailOk && thresholdOk) { state.alert.confirmed = true; saveLocalAlert(state.alert); }
      renderAlertModal();
    });
  }

  function renderModalRoot() {
    if (state.history) { renderHistoryModal(); return; }
    if (state.calc) { renderCalcModal(); return; }
    if (state.alert) { renderAlertModal(); return; }
    document.getElementById('pr-modal-root').innerHTML = '';
  }

  // ---------------------------------------------------------------------
  // Modal: bienvenida de ubicación (solo primera visita)
  // ---------------------------------------------------------------------
  function maybeShowLocationWelcomeWhenFree() {
    if (!showLocationWelcome) return;
    var overlayRoot = document.getElementById('di-overlay-root');
    if (!overlayRoot) return;
    if (!overlayRoot.innerHTML) { renderLocationWelcome(); return; }
    // El shell ya está mostrando su propio modal (bienvenida de idioma o tour
    // guiado) -- esperamos a que se cierre antes de pintar el nuestro encima.
    var obs = new MutationObserver(function () {
      if (showLocationWelcome && !overlayRoot.innerHTML) {
        obs.disconnect();
        renderLocationWelcome();
      }
    });
    obs.observe(overlayRoot, { childList: true });
  }

  function renderLocationWelcome() {
    if (!showLocationWelcome) return;
    var t = ui();
    var overlayRoot = document.getElementById('di-overlay-root');
    if (!overlayRoot) return;
    var html =
      '<div class="di-modal-overlay" id="di-loc-welcome">' +
        '<div class="di-modal-card">' +
          '<h2>' + esc(t.welcomeTitle) + '</h2>' +
          '<p style="font-size:13px;color:var(--welcome-text);opacity:0.85;margin:-14px 0 18px;">' + esc(t.welcomeSubtitle) + '</p>' +
          '<div class="di-lang-grid" style="grid-template-columns:1fr;">' +
            '<button data-wloc="us">🇺🇸 ' + esc(t.locationUsLabel) + '</button>' +
            '<button data-wloc="eu">🇪🇺 ' + esc(t.locationEuLabel) + '</button>' +
            '<button data-wloc="uk">🇬🇧 ' + esc(t.locationUkLabel) + '</button>' +
            '<button data-wloc="ca">🇨🇦 ' + esc(t.locationCaLabel) + '</button>' +
            '<button data-wloc="sa">🌎 ' + esc(t.locationSaLabel) + '</button>' +
          '</div>' +
          '<p style="font-size:11.5px;color:var(--welcome-text);opacity:0.7;margin:16px 0 0;">' + esc(t.welcomeHint) + '</p>' +
        '</div>' +
      '</div>';
    overlayRoot.innerHTML = html;
    Array.prototype.forEach.call(overlayRoot.querySelectorAll('[data-wloc]'), function (btn) {
      btn.addEventListener('click', function () {
        setLocation(btn.getAttribute('data-wloc'));
      });
    });
  }

  // ---------------------------------------------------------------------
  // Orquestación
  // ---------------------------------------------------------------------
  function syncPriceUrl(opts) {
    opts = opts || {};
    var p = [];
    if (state.activeTab) p.push('tab=' + encodeURIComponent(state.activeTab));
    if (state.location) p.push('region=' + encodeURIComponent(state.location));
    if (opts.product) p.push('product=' + encodeURIComponent(opts.product));
    var next = window.location.pathname + (p.length ? '?' + p.join('&') : '');
    if (!window.history) return;
    if (opts.replace) window.history.replaceState({ dehesa:'prices' }, '', next);
    else window.history.pushState({ dehesa:'prices' }, '', next);
  }

  // Un producto sin dato en el mercado elegido (p. ej. el sorgo, solo EE. UU.) abre en el mercado que sí lo tiene
  function fixDeepLinkLocation(explicitRegion) {
    var e = state.deepLinkProduct && PRODUCT_BY_KEY[state.deepLinkProduct];
    if (!e || explicitRegion) return;
    var p = e.product;
    if (state.location === 'eu' && !p.eu && !p.uk) state.location = p.us ? 'us' : state.location;
    else if (state.location === 'uk' && !p.uk && !p.eu) state.location = p.us ? 'us' : state.location;
    else if (state.location === 'sa') state.location = p.us ? 'us' : (p.eu ? 'eu' : state.location);
    else if (state.location === 'ca' && !p.ca) state.location = p.us ? 'us' : (p.eu ? 'eu' : state.location);
  }

  function restorePriceUrl() {
    var qs = new URLSearchParams(window.location.search);
    var validTabs = ['cereales','lacteos','ganado','porcino','ovino','avicultura','pienso','fertilizantes','azucar','aceite','tropicales','hortalizas','energia','seguro','vino','madera'];
    var tab = qs.get('tab');
    var productKey = queryProductKey();
    var region = qs.get('region');
    if (validTabs.indexOf(tab) !== -1) state.activeTab = state.wantTab = tab;
    if (productKey && PRODUCT_BY_KEY[productKey]) {
      state.activeTab = state.wantTab = PRODUCT_BY_KEY[productKey].catId;
      state.deepLinkProduct = productKey;
    } else {
      state.deepLinkProduct = null;
    }
    if (region === 'us' || region === 'eu' || region === 'uk' || region === 'ca' || region === 'sa') {
      state.location = region;
      writeLS('dehesaIndexLocation', region);
    }
    fixDeepLinkLocation(region);
    S.renderContextBar('precios');
    renderAll();
  }

  function setLocation(nextLocation, opts) {
    if (['us', 'eu', 'uk', 'ca', 'sa'].indexOf(nextLocation) === -1) return;
    state.location = nextLocation;
    showLocationWelcome = false;
    writeLS('dehesaIndexLocation', nextLocation);
    var overlayRoot = document.getElementById('di-overlay-root');
    var locationWelcome = document.getElementById('di-loc-welcome');
    if (locationWelcome && overlayRoot) overlayRoot.innerHTML = '';
    syncPriceUrl({ replace: !!(opts && opts.replace) });
    S.renderContextBar('precios');
    renderAll();
  }

  function wireLocationButtons() {
    var root = document.getElementById('pr-location-bar');
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('[data-loc]'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setLocation(btn.getAttribute('data-loc'));
      });
    });
  }

  function wireGlobalControls() {
    var searchInput = document.getElementById('pr-search-input');
    searchInput.placeholder = ui().searchPlaceholder;
    searchInput.addEventListener('input', function (e) {
      state.searchQuery = e.target.value;
      renderSearchResults();
    });
    document.getElementById('pr-search-clear').addEventListener('click', function () {
      state.searchQuery = '';
      searchInput.value = '';
      renderSearchResults();
      searchInput.focus();
    });
    document.getElementById('pr-search-results').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-goto]') : null;
      if (!btn) return;
      goToProduct(btn.getAttribute('data-goto'));
    });
    document.getElementById('pr-tabs').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-tab]') : null;
      if (!btn) return;
      state.activeTab = state.wantTab = btn.getAttribute('data-tab');
      syncPriceUrl();
      S.renderContextBar('precios');
      renderTabsAndCategory();
      // Si las pestanas van pegadas arriba (movil), la categoria nueva empieza justo debajo de ellas, no a media pagina.
      var bar = document.getElementById('pr-tabs'), cat = document.getElementById('pr-category');
      if (bar && cat && window.getComputedStyle(bar).position === 'sticky') {
        var under = bar.getBoundingClientRect().bottom, top = cat.getBoundingClientRect().top;
        if (top < under) window.scrollTo(0, window.pageYOffset + top - under - 4);
      }
    });
  }

  function wireSaCountrySelect() {
    var sel = document.getElementById('pr-sa-country');
    if (!sel) return;
    sel.addEventListener('change', function (e) {
      state.saCountry = e.target.value;
      writeLS('dehesaIndexSaCountry', state.saCountry);
      renderAll();
    });
  }

  function wireEuCountrySelect() {
    var sel = document.getElementById('pr-eu-country');
    if (!sel) return;
    sel.addEventListener('change', function (e) {
      state.euCountry = e.target.value;
      writeLS('dehesaIndexEuCountry', state.euCountry);
      loadCountry(state.euCountry);
      renderAll();
    });
  }

  function renderTabsAndCategory() {
    // state.wantTab es la pestaña que pidió la persona (URL, clic o producto). Mientras llegan los datos (precios publicados,
    // media nacional del país) puede no tener todavía datos: se enseña otra provisionalmente, pero sin olvidar la pedida,
    // y en cuanto tiene datos se vuelve a ella. El respaldo prefiere una pestaña de precios antes que seguro/vino/madera.
    var want = state.wantTab || state.activeTab;
    if (state.deepLinkProduct || catHasData(want)) state.activeTab = want;
    else {
      var vc = visibleCats().filter(function (c) { return c !== want && catHasData(c); });
      var fb = vc.filter(function (c) { return !INFO_CATS[c]; })[0] || vc[0];
      if (fb) state.activeTab = fb;
    }
    var shown = new URLSearchParams(window.location.search).get('tab');
    if (shown && shown !== state.activeTab && trustReady() && state.pricesSettled && countrySettled()) syncPriceUrl({ replace: true });
    renderTabs();
    renderCategory();
  }

  function renderAll() {
    if (state.location === 'eu') loadLonjas();
    if (state.location === 'ca') loadProvs();
    renderHead();
    var healthEl = document.getElementById('pr-data-health');
    if (healthEl && global.DehesaDataTrust) healthEl.innerHTML = global.DehesaDataTrust.renderHealth();
    renderTicker();
    renderSearchResults();
    renderLocationBar();
    wireLocationButtons();
    wireEuCountrySelect();
    wireSaCountrySelect();
    renderFavorites();
    if (global.DehesaPreciosIntel) global.DehesaPreciosIntel.render();
    renderTabsAndCategory();
    if (state.deepLinkProduct) {
      var key = state.deepLinkProduct;
      state.deepLinkProduct = null;
      setTimeout(function () {
        var card = document.querySelector('[data-key="' + key + '"]');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.boxShadow = '0 0 0 3px ' + (T().positive) + '55';
          setTimeout(function () { card.style.boxShadow = ''; }, 1400);
        }
      }, 40);
    }
  }

  function init() {
    S.init('precios');
    var deepKey = queryProductKey();
    var qs = new URLSearchParams(window.location.search);
    var requestedTab = qs.get('tab');
    var requestedRegion = qs.get('region');
    var validTabs = ['cereales','lacteos','ganado','porcino','ovino','avicultura','pienso','fertilizantes','azucar','aceite','tropicales','hortalizas','energia','seguro','vino','madera'];
    if (validTabs.indexOf(requestedTab) !== -1) state.activeTab = state.wantTab = requestedTab;
    if (deepKey && PRODUCT_BY_KEY[deepKey]) {
      state.activeTab = state.wantTab = PRODUCT_BY_KEY[deepKey].catId;
      state.deepLinkProduct = deepKey;
    }
    if (requestedRegion === 'us' || requestedRegion === 'eu' || requestedRegion === 'uk' || requestedRegion === 'ca' || requestedRegion === 'sa') {
      state.location = requestedRegion;
      writeLS('dehesaIndexLocation', requestedRegion);
    }
    fixDeepLinkLocation(requestedRegion);
    wireGlobalControls();
    document.addEventListener('dehesa:intel-ready', function () { renderMarketNewsIntel(); });
    window.addEventListener('popstate', restorePriceUrl);
    renderAll();
    if (global.DICite) global.DICite.load().then(function (r) { if (r) renderAll(); });
    if (S.loadMarkets) S.loadMarkets().then(function (m) { if (m) renderAll(); });
    loadPublishedPrices();
    loadDieselCountries();
    // Noticias (67 KB comprimidos): después de los precios, cuando el navegador esté libre. Antes competían con los datos de la primera pantalla.
    var loadNews = function () {
      if (global.DINews) global.DINews.index().then(function (idx) {
        if (!idx || !Object.keys(idx).length) return;
        renderAll();
        document.dispatchEvent(new CustomEvent('dehesa:news-ready'));
      });
    };
    PRICES_DONE.then(function () { if (global.requestIdleCallback) global.requestIdleCallback(loadNews, { timeout: 2500 }); else setTimeout(loadNews, 600); });
    S.onLangChange = function () { renderAll(); };
    maybeShowLocationWelcomeWhenFree();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---------------------------------------------------------------------
  // Núcleo compartido con js/precios-intel.js (Market Map, Momentum,
  // Correlación, Volatilidad, Estacionalidad, Spreads, Margen): esos widgets
  // reutilizan el mismo índice de productos y la misma resolución de
  // ubicación/país que ya usa esta página, en vez de reconstruirlos aparte.
  // ---------------------------------------------------------------------
  global.DehesaPreciosCore = {
    PRODUCTS: PRODUCTS,
    PRODUCT_BY_KEY: PRODUCT_BY_KEY,
    resolveDisplay: resolveDisplay,
    defaultRegionFor: defaultRegionFor,
    availableRegions: availableRegions,
    seedKeyFor: seedKeyFor,
    productName: productName,
    catLabel: catLabel,
    T: T,
    lang: lang,
    ui: ui,
    esc: esc,
    getLocation: function () { return state.location; },
    getEuCountry: function () { return state.euCountry; },
    getActiveTab: function () { return state.activeTab; },
    // Datos de una tarjeta para el Market Map: solo observaciones verificadas del mercado elegido
    mapInfo: function (entry, loc) {
      loc = loc || state.location;
      var disp = resolveDisplay(entry, loc, state.euCountry);
      if (disp.ukGap || !disp.region || String(disp.regionCode).split('-')[0] !== loc) return null;
      var obs = trustObservationFor(entry, disp);
      if (!obs || obs.status !== 'verified' || disp.derived || disp.unverified) return null;
      var built = D.buildRegion(disp.region, productName(entry.nameKey), disp.targetCcy, disp.targetKgPerUnit, disp.targetUnitLabel, D.FX, T());
      var base = disp.cty ? disp.region : entry.product[disp.regionCode];
      return { price: built.price, unit: built.unit, kg: disp.targetKgPerUnit, ccy: disp.targetCcy, date: obs.observationDate || null, pts: base && base.histPts ? base.histPts : null, full: !!(base && base.histFull) };
    },
    getLocation: function () { return state.location; },
    openHistory: function (key) { openHistory(key); },
    ensureHistory: ensureHistory,
    ensureAllHistory: ensureAllHistory,
    countryRegion: countryRegion, loadCountry: loadCountry,
    pricesReady: PRICES_DONE
  };
})(window);
