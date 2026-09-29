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
    light: { positive: '#2F7D4F', negative: '#B23A34', neutral: '#8A8471', compareLine: '#3B6EA8' },
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
  var CAT_ORDER = ['cereales', 'lacteos', 'ganado', 'porcino', 'ovino', 'avicultura', 'pienso', 'fertilizantes', 'azucar', 'aceite', 'energia', 'seguro', 'vino', 'madera'];
  // Categorías informativas propias: no son "productos" con precio diario/
  // semanal (sin favoritos/histórico/calculadora/alertas) -- estadísticas
  // oficiales reales anuales o de campaña, ver renderInfoCategoryHtml().
  var INFO_CATS = { seguro: true, vino: true, madera: true };

  var state = {
    location: (function () { var v = readLS('dehesaIndexLocation'); return (v === 'us' || v === 'eu' || v === 'uk') ? v : null; })(),
    euCountry: (function () { var v = readLS('dehesaIndexEuCountry'); return (v === 'es' || v === 'de' || v === 'fr' || v === 'it') ? v : 'es'; })(),
    activeTab: 'cereales',
    favorites: readFavorites(),
    searchQuery: '',
    expanded: {},
    history: null, // { key, region, range, compareMode, compareKey, yoy }
    calc: null,    // { key, region, mode }
    alert: null    // { key, region, direction, attempted, confirmed }
  };
  var showLocationWelcome = !state.location;
  if (!state.location) state.location = 'us';

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
    'leche:eu': { key: 'lacteos:leche', sourceId: 'european_commission', currency: 'EUR', unit: '100kg', frequency: 'monthly' },
    'urea:eu': { key: 'fertilizantes:urea', sourceId: 'world_bank', currency: 'USD', unit: 'tonelada', frequency: 'monthly' },
    'diesel:us': { key: 'energia:diesel', sourceId: 'eia', currency: 'USD', unit: 'gal', frequency: 'weekly' },
    'diesel:eu': { key: 'energia:diesel', sourceId: 'eu_oil_bulletin', currency: 'EUR', unit: 'litro', frequency: 'weekly' }
  };

  function numericHistory(observation) {
    var points = Array.isArray(observation.history) ? observation.history : [];
    var values = points.map(function (point) { return Number(point && point.value); })
      .filter(function (value) { return Number.isFinite(value); });
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
    if (Number.isFinite(Number(observation.changePct))) region.changePct = Number(observation.changePct);

    var trustKey = contract.key.replace(':', '-') + '-' + observation.region;
    var trust = D.DATA_TRUST && D.DATA_TRUST[trustKey];
    if (trust) {
      trust.value = region.price;
      trust.status = observation.status;
      trust.observationDate = observation.observationDate || null;
      trust.publicationDate = observation.publicationDate || null;
      trust.verifiedAt = observation.verifiedAt || null;
      trust.methodology = observation.methodology || trust.methodology;
      trust.comparability = observation.comparability || trust.comparability;
    }
    return true;
  }

  function loadPublishedPrices() {
    if (typeof global.fetch !== 'function') return;
    global.fetch('data/latest.json', { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (doc) {
        var observations = doc && Array.isArray(doc.observations) ? doc.observations : [];
        var changed = observations.some(applyPublishedObservation);
        if (!changed) return;
        if (D.validateDataTrustRegistry) D.DATA_TRUST_HEALTH = D.validateDataTrustRegistry(D.DATA_TRUST);
        renderAll();
        document.dispatchEvent(new CustomEvent('dehesa:prices-data-ready'));
      })
      .catch(function () {
        // El respaldo integrado mantiene la página utilizable sin red.
      });
  }

  function productName(nameKey) { return (D.NAMES[lang()] || D.NAMES.es)[nameKey] || nameKey; }
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
  function resolveDisplay(entry, loc, country) {
    var p = entry.product;
    var UL = D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es;
    if (loc === 'us') {
      return { region: p.us, regionCode: 'us', targetCcy: 'USD', targetKgPerUnit: p.imperialKgPerUnit, targetUnitLabel: UL[p.imperialUnitKey], quoteType: p.quoteTypes && p.quoteTypes.us, ukGap: false };
    }
    if (loc === 'eu') {
      var region = p.eu;
      if (p.isEnergy) {
        var dr = dieselCountryRegion(country);
        if (dr) region = dr;
      } else if (p.countryFactors && country !== 'es' && p.countryFactors[country] != null) {
        region = D.deriveCountryRaw(p.eu, p.countryFactors[country]);
      }
      return { region: region, regionCode: 'eu', targetCcy: 'EUR', targetKgPerUnit: p.metricKgPerUnit, targetUnitLabel: UL[p.metricUnitKey], quoteType: p.quoteTypes && p.quoteTypes.eu, ukGap: false };
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
    document.title = 'Dehesa Index — ' + t.pageTitle;
    document.getElementById('pr-title').textContent = t.pageTitle;
    document.getElementById('pr-badge').textContent = t.badge;
    document.getElementById('pr-subtitle').textContent = t.pageSubtitle;
    document.getElementById('pr-updated').textContent = t.updated;
    document.getElementById('pr-banner').textContent = t.banner;
  }

  // ---------------------------------------------------------------------
  // Render: ticker
  // ---------------------------------------------------------------------
  function renderTicker() {
    var root = document.getElementById('pr-ticker');
    var items = PRODUCTS.map(function (entry) {
      var disp = resolveDisplay(entry, state.location, state.euCountry);
      var built = D.buildRegion(disp.region, productName(entry.nameKey), disp.targetCcy, disp.targetKgPerUnit, disp.targetUnitLabel, D.FX, T());
      return (
        '<span class="di-ticker-item">' +
          '<span class="di-ticker-name">' + esc(productName(entry.nameKey)) + '</span>' +
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
    state.activeTab = entry.catId;
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
      '<button type="button" class="di-location-btn' + (state.location === 'uk' ? ' active' : '') + '" data-loc="uk">🇬🇧 ' + esc(t.locationUkLabel) + '</button>';
    if (state.location === 'eu') {
      var countries = [
        { code: 'es', flag: D.COUNTRY_FLAG.es, label: D.REGION[lang()].eu + ' — España' },
        { code: 'de', flag: D.COUNTRY_FLAG.de, label: 'Deutschland' },
        { code: 'fr', flag: D.COUNTRY_FLAG.fr, label: 'France' },
        { code: 'it', flag: D.COUNTRY_FLAG.it, label: 'Italia' }
      ];
      html += '<select class="di-eu-country-select" id="pr-eu-country">' + countries.map(function (c) {
        return '<option value="' + c.code + '"' + (c.code === state.euCountry ? ' selected' : '') + '>' + c.flag + ' ' + esc(c.label) + '</option>';
      }).join('') + '</select>';
      html += '<div class="di-eu-country-hint">' + esc(t.euCountryHint) + '</div>';
    }
    html += '<div class="di-fx-label">' + esc(fxLabelText(t)) + '</div>';
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
    var eur = fmtFxRate(D.FX.EUR);
    var gbp = fmtFxRate(D.FX.GBP);
    var date = D.formatFxDate(D.FX_DATE, lang());
    return t.fxLabel.replace('{eur}', eur).replace('{gbp}', gbp).replace('{date}', date);
  }

  // ---------------------------------------------------------------------
  // Render: favoritos
  // ---------------------------------------------------------------------
  function renderFavorites() {
    var t = ui();
    var root = document.getElementById('pr-favorites');
    var html = '<h2 class="di-favorites-title">' + esc(t.favoritesTitle) + '</h2>';
    if (!state.favorites.length) {
      html += '<div class="di-favorites-empty">' + esc(t.favoritesEmptyHint) + '</div>';
    } else {
      html += '<div class="di-favorites-grid">' + state.favorites.map(function (key) {
        var entry = PRODUCT_BY_KEY[key];
        if (!entry) return '';
        return productCardHtml(entry, { compact: true });
      }).join('') + '</div>';
    }
    root.innerHTML = html;
    wireCardEvents(root);
  }

  // ---------------------------------------------------------------------
  // Render: pestañas
  // ---------------------------------------------------------------------
  function renderTabs() {
    var root = document.getElementById('pr-tabs');
    root.innerHTML = CAT_ORDER.map(function (catId) {
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
    var title = qt.desc + (quoteType.market ? ' — ' + quoteType.market : '');
    return '<span class="di-quote-badge" title="' + esc(title) + '">' + esc(qt.label) + '</span>';
  }

  function breakdownTableHtml(entry) {
    var t = ui();
    var p = entry.product;
    var UL = D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es;
    var rows = [];
    var specs = [
      { code: 'us', region: p.us, ccy: 'USD', kg: p.imperialKgPerUnit, unit: UL[p.imperialUnitKey], regionLabel: D.REGION[lang()].us },
      { code: 'eu', region: p.eu, ccy: 'EUR', kg: p.metricKgPerUnit, unit: UL[p.metricUnitKey], regionLabel: D.REGION[lang()].eu },
      { code: 'uk', region: p.uk, ccy: 'GBP', kg: p.metricKgPerUnit, unit: UL[p.metricUnitKey], regionLabel: D.REGION[lang()].uk }
    ];
    for (var i = 0; i < specs.length; i++) {
      var s = specs[i];
      if (!s.region) continue;
      var qt = p.quoteTypes && p.quoteTypes[s.code];
      var qtLabel = qt && (D.QUOTE_TYPES[lang()] || D.QUOTE_TYPES.es)[qt.type] ? (D.QUOTE_TYPES[lang()] || D.QUOTE_TYPES.es)[qt.type].label : '—';
      var sym = D.CCY_SYMBOL[s.ccy] || s.ccy;
      rows.push('<tr><td>' + esc(s.regionLabel) + (qt && qt.market ? ' — ' + esc(qt.market) : '') + '</td><td>' + esc(qtLabel) + '</td><td>' + sym + D.fmtNumber(s.region.price) + '/' + esc(s.unit) + '</td></tr>');
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
        var built = D.buildRegion(r, ER[r.key] || r.key, 'EUR', D.LITRO_KG, (D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es).litro, D.FX, T());
        return '<div class="di-energy-region-row"><span>' + esc(ER[r.key] || r.key) + '</span><b>' + esc(built.price) + esc(built.unit) + '</b></div>';
      });
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

  function productDataState(observation) {
    if (!observation) return { key: 'pending', label: { es: 'PENDIENTE', en: 'PENDING', fr: 'EN ATTENTE', it: 'IN ATTESA' } };
    if (observation.comparability === 'not_comparable') return { key: 'not-comparable', label: { es: 'NO COMPARABLE', en: 'NOT COMPARABLE', fr: 'NON COMPARABLE', it: 'NON COMPARABILE' } };
    if (observation.status === 'verified') return { key: 'real', label: { es: 'REAL', en: 'REAL', fr: 'RÉEL', it: 'REALE' } };
    return { key: 'pending', label: { es: 'PENDIENTE', en: 'PENDING', fr: 'EN ATTENTE', it: 'IN ATTESA' } };
  }

  function relatedNewsHtml(entry) {
    var index = global.DehesaNewsIndex || {};
    var key = entry.nameKey;
    var stories = index[key] || [];
    var region = state.location || 'us';
    if (!stories.length) return '<div class="di-related-news di-related-news-pending"><div class="di-related-news-head"><span>NEWS INTELLIGENCE</span><a href="noticias.html?product=' + encodeURIComponent(key) + '&region=' + encodeURIComponent(region) + '">Noticias relacionadas →</a></div><p>No hay cobertura editorial enlazada a este mercado todavía.</p></div>';
    var lg = lang();
    var label = lg === 'es' ? 'Noticias relacionadas' : lg === 'fr' ? 'Actualités liées' : lg === 'it' ? 'Notizie correlate' : 'Related news';
    return '<div class="di-related-news"><div class="di-related-news-head"><span>NEWS INTELLIGENCE</span><a href="noticias.html?product=' + encodeURIComponent(key) + '&region=' + encodeURIComponent(region) + '">Ver todas →</a></div>' +
      '<div class="di-related-news-title">' + esc(label) + '</div>' +
      stories.slice(0,2).map(function(n) {
        var h = n.headline[lg] || n.headline.es;
        return '<a class="di-related-news-item" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer"><span class="di-related-news-meta">' + esc(n.source) + ' · ' + esc(n.date) + '</span><strong>' + esc(h) + '</strong></a>';
      }).join('') + '</div>';
  }

  function productCardHtml(entry, opts) {
    opts = opts || {};
    var t = ui();
    var key = entry.catId + ':' + entry.nameKey;
    var disp = resolveDisplay(entry, state.location, state.euCountry);
    var built = D.buildRegion(disp.region, productName(entry.nameKey), disp.targetCcy, disp.targetKgPerUnit, disp.targetUnitLabel, D.FX, T());
    var observation = trustObservationFor(entry, disp);
    var dataState = productDataState(observation);
    var stateLabel = (dataState.label[lang()] || dataState.label.es);
    var fav = isFavorite(key);
    var expanded = !!state.expanded[key];
    var foot = entry.product.footnoteKey ? (D.FOOT[lang()] || D.FOOT.es)[entry.product.footnoteKey] : '';
    var showValue = dataState.key === 'real';
    var price = showValue ? built.price : '—';
    var unit = showValue ? built.unit : '';
    var change = showValue ? built.changeLabel : '';
    return (
      '<div class="di-card di-product-card di-product-state-' + dataState.key + '" data-key="' + key + '">' +
        '<div class="di-product-head">' +
          '<div><h3 class="di-product-name">' + esc(productName(entry.nameKey)) + '</h3><span class="di-product-state di-product-state-badge ' + dataState.key + '">' + esc(stateLabel) + '</span></div>' +
          '<div class="di-product-icons">' +
            (showValue ? '<button type="button" class="di-icon-btn" data-action="calc" data-key="' + key + '" title="' + esc(t.calcButtonTitle) + '">🧮</button>' : '') +
            (showValue ? '<button type="button" class="di-icon-btn" data-action="history" data-key="' + key + '" title="' + esc(t.historyButtonTitle) + '">📈</button>' : '') +
            (showValue ? '<button type="button" class="di-icon-btn" data-action="alert" data-key="' + key + '" title="' + esc(t.alertButtonTitle) + '">🔔</button>' : '') +
            '<button type="button" class="di-fav-star' + (fav ? ' active' : '') + '" data-action="fav" data-key="' + key + '" title="' + esc(fav ? t.favRemoveTitle : t.favAddTitle) + '">★</button>' +
          '</div>' +
        '</div>' +
        quoteBadgeHtml(disp.quoteType) +
        (global.DehesaDataTrust ? global.DehesaDataTrust.render(entry, disp) : '') +
        '<div class="di-product-price-row">' +
          '<span class="di-product-price">' + esc(price) + '</span>' +
          '<span class="di-product-unit">' + esc(unit) + '</span>' +
          '<span class="di-product-change" style="color:' + (showValue ? built.changeColor : 'var(--text-faint)') + ';">' + esc(change) + '</span>' +
        '</div>' +
        (showValue ? '<svg class="di-product-spark" viewBox="0 0 120 36" preserveAspectRatio="none"><path d="' + built.sparkPath + '" stroke="' + built.sparkColor + '" fill="none" stroke-width="2"/></svg>' : '<div class="di-product-no-value">Valor visible cuando la observación esté verificada.</div>') +
        (disp.ukGap ? '<div class="di-uk-gap-note">' + esc(t.ukGapNote) + '</div>' : '') +
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
  // favoritos, histórico, calculadora ni alertas. Ver D.INSURANCE/D.WINE/
  // D.WOOD en js/data.js.
  // ---------------------------------------------------------------------
  function infoStatsCardHtml(title, stats) {
    var rows = stats.map(function (s) {
      return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(s.label) + '</span><span class="di-info-stat-value">' + esc(s.value) + '</span></div>';
    }).join('');
    return '<div class="di-card di-info-card"><div class="di-info-card-title">' + esc(title) + '</div><div class="di-info-stat-list">' + rows + '</div></div>';
  }

  function infoSourcesHtml(catId) {
    var t = ui();
    var cat = (D.CATS[lang()] || D.CATS.es)[catId];
    if (!cat) return '';
    var links = D.withSeps(cat.sources).map(function (s) {
      return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + '</a>' + s.sep;
    }).join('');
    return '<div class="di-field-hint di-info-sources">' + esc(t.fuenteLabel) + ' ' + links + '</div>';
  }

  function renderInfoCategoryHtml(catId) {
    if (catId === 'seguro') {
      var ins = D.INSURANCE[lang()] || D.INSURANCE.es;
      return (
        '<div class="di-badge di-badge-green di-info-badge">' + esc(ins.badge) + '</div>' +
        '<div class="di-info-grid">' +
          infoStatsCardHtml(ins.esTitle, ins.esStats) +
          infoStatsCardHtml(ins.usTitle, ins.usStats) +
        '</div>' +
        '<div class="di-info-scope-note">' + esc(ins.scopeNote) + '</div>' +
        infoSourcesHtml('seguro')
      );
    }
    if (catId === 'vino') {
      var win = D.WINE[lang()] || D.WINE.es;
      return (
        '<div class="di-badge di-badge-green di-info-badge">' + esc(win.badge) + '</div>' +
        '<div class="di-info-grid">' +
          infoStatsCardHtml(win.esTitle, win.esStats) +
          infoStatsCardHtml(win.frTitle, win.frStats) +
        '</div>' +
        '<div class="di-info-scope-note">' + esc(win.scopeNote) + '</div>' +
        infoSourcesHtml('vino')
      );
    }
    // madera
    var mad = D.WOOD[lang()] || D.WOOD.es;
    return (
      '<div class="di-badge di-badge-green di-info-badge">' + esc(mad.badge) + '</div>' +
      '<div class="di-info-grid di-info-grid-3">' +
        infoStatsCardHtml(mad.usTitle, mad.usStats) +
        infoStatsCardHtml(mad.ukTitle, mad.ukStats) +
        infoStatsCardHtml(mad.frTitle, mad.frStats) +
      '</div>' +
      '<div class="di-info-scope-note">' + esc(mad.scopeNote) + '</div>' +
      infoSourcesHtml('madera')
    );
  }

  function newsImpactLabels() {
    return {
      es:{input_cost:'INPUT COST',trade:'TRADE',weather:'WEATHER',supply:'SUPPLY',energy:'ENERGY',policy:'POLICY',market_impact:'MARKET IMPACT'},
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
    var primary=n.impactChannel || (links[0]&&links[0].channel) || 'market_impact';
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
    var compatible = stories.filter(function(n) {
      return n.region === region || n.region === 'global';
    });

    // If the selected category has no regional match, use the latest
    // global/compatible market stories across the entire news index.
    if (!compatible.length) {
      compatible = [];
      Object.keys(global.DehesaNewsIndex).forEach(function(key) {
        (global.DehesaNewsIndex[key] || []).forEach(function(n) {
          if (!seen['fallback-' + n.id] && (n.region === region || n.region === 'global')) {
            seen['fallback-' + n.id] = true;
            compatible.push(n);
          }
        });
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
    var regionLabel = region === 'us' ? 'EE. UU.' : region === 'eu' ? 'Europa' : region === 'uk' ? 'UK' : 'Global';

    if (!selected.length) {
      root.innerHTML =
        '<div class="di-market-news-intel di-market-news-empty">' +
          '<div class="di-market-news-copy"><span class="di-section-kicker">NEWS INTELLIGENCE</span>' +
          '<h2>' + esc(title) + '</h2>' +
          '<p>La cobertura editorial verificada se está actualizando.</p></div>' +
          '<a class="di-market-news-link" href="noticias.html">' + esc(linkLabel) + '</a>' +
        '</div>';
      return;
    }

    root.innerHTML =
      '<div class="di-market-news-intel">' +
        '<div class="di-market-news-copy">' +
          '<span class="di-section-kicker">NEWS INTELLIGENCE · ' + esc(regionLabel) + '</span>' +
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

  function renderCategory() {
    renderMarketNewsIntel();
    var root = document.getElementById('pr-category');
    if (INFO_CATS[state.activeTab]) {
      root.innerHTML = renderInfoCategoryHtml(state.activeTab);
      return;
    }
    var entries = productsInCat(state.activeTab);
    root.innerHTML = '<div class="di-product-grid">' + entries.map(function (e) { return productCardHtml(e, {}); }).join('') + '</div>';
    wireCardEvents(root);
  }

  function wireCardEvents(root) {
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
      btn.addEventListener('click', function () { openHistory(btn.getAttribute('data-key')); });
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
    state.history = { key: key, region: defaultRegionFor(entry), range: '3m', compareMode: false, compareKey: '', yoy: false };
    lockProductModal();
    renderHistoryModal();
  }
  function closeHistory() { state.history = null; renderModalRoot(); unlockProductModal(); }

  function regionObjFor(entry, regionCode, country) {
    var UL = D.UNIT_LABELS[lang()] || D.UNIT_LABELS.es;
    if (regionCode === 'us') return { region: entry.product.us, ccy: 'USD', kg: entry.product.imperialKgPerUnit, unit: UL[entry.product.imperialUnitKey] };
    if (regionCode === 'eu') {
      var disp = resolveDisplay(entry, 'eu', country || state.euCountry);
      return { region: disp.region, ccy: 'EUR', kg: entry.product.metricKgPerUnit, unit: UL[entry.product.metricUnitKey] };
    }
    return { region: entry.product.uk || entry.product.eu, ccy: entry.product.uk ? 'GBP' : 'EUR', kg: entry.product.metricKgPerUnit, unit: UL[entry.product.metricUnitKey] };
  }

  function renderHistoryModal() {
    var h = state.history;
    if (!h) return;
    var t = ui();
    var entry = PRODUCT_BY_KEY[h.key];
    var avail = availableRegions(entry);
    var days = D.HISTORY_RANGE_DAYS[h.range];
    var ro = regionObjFor(entry, h.region);
    var seedKey = seedKeyFor(entry, h.region);
    var view = D.buildHistoryView(ro.region, productName(entry.nameKey), ro.ccy, ro.kg, ro.unit, D.FX, seedKey, days, T());

    var regionBtns = avail.map(function (r) {
      return '<button type="button" class="di-region-btn' + (r === h.region ? ' active' : '') + '" data-hregion="' + r + '">' + esc(D.REGION[lang()][r]) + '</button>';
    }).join('');
    var rangeBtns = D.HISTORY_RANGE_ORDER.map(function (r) {
      return '<button type="button" class="di-range-btn' + (r === h.range ? ' active' : '') + '" data-hrange="' + r + '">' + r.toUpperCase() + '</button>';
    }).join('');

    var chartHtml = '';
    if (h.compareMode && h.compareKey && PRODUCT_BY_KEY[h.compareKey]) {
      var cEntry = PRODUCT_BY_KEY[h.compareKey];
      var cRo = regionObjFor(cEntry, defaultRegionFor(cEntry));
      var aRaw = D.rawHistorySlice(ro.region, seedKey, days, 0);
      var bRaw = D.rawHistorySlice(cRo.region, seedKeyFor(cEntry, defaultRegionFor(cEntry)), days, 0);
      var aPct = D.pctSeries(aRaw), bPct = D.pctSeries(bRaw);
      var cmp = D.buildComparePair(aPct, productName(entry.nameKey), bPct, productName(cEntry.nameKey), T());
      chartHtml =
        '<div class="di-history-chart-wrap"><svg viewBox="0 0 560 170" preserveAspectRatio="none">' +
          '<path d="' + cmp.comparePath + '" stroke="' + T().compareLine + '" fill="none" stroke-width="2"/>' +
          '<path d="' + cmp.primaryPath + '" stroke="' + T().positive + '" fill="none" stroke-width="2"/>' +
        '</svg></div>' +
        '<div class="di-history-legend">' +
          '<span><i style="background:' + T().positive + ';"></i>' + esc(cmp.primaryLabel) + ' <b style="color:' + cmp.primaryChangeColor + ';">' + esc(cmp.primaryChangeLabel) + '</b></span>' +
          '<span><i style="background:' + T().compareLine + ';"></i>' + esc(cmp.compareLabel) + ' <b style="color:' + cmp.compareChangeColor + ';">' + esc(cmp.compareChangeLabel) + '</b></span>' +
        '</div>' +
        '<div class="di-compare-active-row"><span>' + esc(t.compareActiveLabel) + ' ' + esc(cmp.compareLabel) + '</span><button type="button" class="di-compare-clear" id="di-compare-clear">' + esc(t.compareClearLabel) + '</button></div>' +
        '<div class="di-field-hint">' + esc(t.compareHint) + '</div>';
    } else if (h.yoy) {
      var thisYearRaw = D.rawHistorySlice(ro.region, seedKey, 365, 0);
      var lastYearRaw = D.rawHistorySlice(ro.region, seedKey, 365, 365);
      var tPct = D.pctSeries(thisYearRaw), lPct = D.pctSeries(lastYearRaw);
      var cmp2 = D.buildComparePair(tPct, t.historyYoyThisYear, lPct, t.historyYoyLastYear, T());
      chartHtml =
        '<div class="di-history-chart-wrap"><svg viewBox="0 0 560 170" preserveAspectRatio="none">' +
          '<path d="' + cmp2.comparePath + '" stroke="' + T().compareLine + '" fill="none" stroke-width="2"/>' +
          '<path d="' + cmp2.primaryPath + '" stroke="' + T().positive + '" fill="none" stroke-width="2"/>' +
        '</svg></div>' +
        '<div class="di-history-legend">' +
          '<span><i style="background:' + T().positive + ';"></i>' + esc(cmp2.primaryLabel) + ' <b style="color:' + cmp2.primaryChangeColor + ';">' + esc(cmp2.primaryChangeLabel) + '</b></span>' +
          '<span><i style="background:' + T().compareLine + ';"></i>' + esc(cmp2.compareLabel) + ' <b style="color:' + cmp2.compareChangeColor + ';">' + esc(cmp2.compareChangeLabel) + '</b></span>' +
        '</div>' +
        '<div class="di-field-hint">' + esc(t.compareHint) + '</div>';
    } else {
      chartHtml =
        '<div class="di-history-chart-wrap"><svg viewBox="0 0 560 170" preserveAspectRatio="none"><path d="' + view.sparkPath + '" stroke="' + view.sparkColor + '" fill="none" stroke-width="2"/></svg></div>' +
        '<div class="di-history-stats">' +
          '<span>' + esc(t.historyMin) + ' <b>' + esc(view.minLabel) + '</b></span>' +
          '<span>' + esc(t.historyAvg) + ' <b>' + esc(view.avgLabel) + '</b></span>' +
          '<span>' + esc(t.historyMax) + ' <b>' + esc(view.maxLabel) + '</b></span>' +
          '<span style="margin-left:auto;color:' + view.changeColor + ';font-weight:700;">' + esc(view.changeLabel) + '</span>' +
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
          '<div class="di-modal-head"><h2 class="di-modal-title">' + esc(productName(entry.nameKey)) + ' · ' + esc(t.historyButtonTitle) + '</h2>' +
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
      var ro = regionObjFor(entry, h.region);
      var days = D.HISTORY_RANGE_DAYS[h.range];
      var t = ui();
      D.exportHistoryCsv(t.csvHeaderDate, t.csvHeaderPrice, entry.catId + '-' + entry.nameKey, ro.region, h.region, seedKeyFor(entry, h.region), days, ro.kg, ro.unit, ro.ccy, D.FX);
    });
  }

  // ---------------------------------------------------------------------
  // Modal: Calculadora de coste
  // ---------------------------------------------------------------------
  function openCalc(key) {
    var entry = PRODUCT_BY_KEY[key];
    if (!entry) return;
    state.calc = { key: key, region: defaultRegionFor(entry), mode: 'directa' };
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
    var regionBtns = avail.map(function (r) {
      return '<button type="button" class="di-region-btn' + (r === c.region ? ' active' : '') + '" data-cregion="' + r + '">' + esc(D.REGION[lang()][r]) + '</button>';
    }).join('');
    var html =
      '<div class="di-modal-overlay" id="di-calc-overlay">' +
        '<div class="di-big-modal-card" style="max-width:440px;">' +
          '<div class="di-modal-head"><h2 class="di-modal-title">' + esc(productName(entry.nameKey)) + ' · ' + esc(t.calcButtonTitle) + '</h2>' +
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
    state.alert = { key: key, region: defaultRegionFor(entry), direction: 'up', attempted: false, confirmed: false };
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
    var regionBtns = avail.map(function (r) {
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
          '<div class="di-modal-head"><h2 class="di-modal-title">' + esc(productName(entry.nameKey)) + ' · ' + esc(t.alertButtonTitle) + '</h2>' +
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

  function restorePriceUrl() {
    var qs = new URLSearchParams(window.location.search);
    var validTabs = ['cereales','lacteos','fertilizantes','energia','seguro','vino','madera'];
    var tab = qs.get('tab');
    var productKey = queryProductKey();
    var region = qs.get('region');
    if (validTabs.indexOf(tab) !== -1) state.activeTab = tab;
    if (productKey && PRODUCT_BY_KEY[productKey]) {
      state.activeTab = PRODUCT_BY_KEY[productKey].catId;
      state.deepLinkProduct = productKey;
    } else {
      state.deepLinkProduct = null;
    }
    if (region === 'us' || region === 'eu' || region === 'uk') {
      state.location = region;
      writeLS('dehesaIndexLocation', region);
    }
    S.renderContextBar('precios');
    renderAll();
  }

  function setLocation(nextLocation, opts) {
    if (['us', 'eu', 'uk'].indexOf(nextLocation) === -1) return;
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
      state.activeTab = btn.getAttribute('data-tab');
      syncPriceUrl();
      S.renderContextBar('precios');
      renderTabsAndCategory();
    });
  }

  function wireEuCountrySelect() {
    var sel = document.getElementById('pr-eu-country');
    if (!sel) return;
    sel.addEventListener('change', function (e) {
      state.euCountry = e.target.value;
      writeLS('dehesaIndexEuCountry', state.euCountry);
      renderAll();
    });
  }

  function renderTabsAndCategory() {
    renderTabs();
    renderCategory();
  }

  function renderAll() {
    renderHead();
    var healthEl = document.getElementById('pr-data-health');
    if (healthEl && global.DehesaDataTrust) healthEl.innerHTML = global.DehesaDataTrust.renderHealth();
    renderTicker();
    renderSearchResults();
    renderLocationBar();
    wireLocationButtons();
    wireEuCountrySelect();
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
    var validTabs = ['cereales','lacteos','fertilizantes','energia','seguro','vino','madera'];
    if (validTabs.indexOf(requestedTab) !== -1) state.activeTab = requestedTab;
    if (deepKey && PRODUCT_BY_KEY[deepKey]) {
      state.activeTab = PRODUCT_BY_KEY[deepKey].catId;
      state.deepLinkProduct = deepKey;
    }
    if (requestedRegion === 'us' || requestedRegion === 'eu' || requestedRegion === 'uk') {
      state.location = requestedRegion;
      writeLS('dehesaIndexLocation', requestedRegion);
    }
    wireGlobalControls();
    document.addEventListener('dehesa:intel-ready', function () { renderMarketNewsIntel(); });
    window.addEventListener('popstate', restorePriceUrl);
    renderAll();
    loadPublishedPrices();
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
    getLocation: function () { return state.location; },
    openHistory: function (key) { openHistory(key); }
  };
})(window);
