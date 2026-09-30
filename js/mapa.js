/* Dehesa Index — Mapa agrícola. Capas: precios verificados (data/latest.json) y clima (data/climate.json).
   Solo pinta lo que tiene dato verificado; cada valor va en su moneda y unidad (no se convierten monedas en el mapa). */
(function () {
  'use strict';
  var EU27 = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
  // Ámbito geográfico real de cada serie UE (según su metodología en data/latest.json).
  var EU_SPAIN = { arroz: 1, cerdo: 1, cordero: 1, harina_soja: 1, huevos: 1, leche: 1, maiz: 1, oliva: 1, pollo: 1, trigo: 1, vaca: 1 };
  var EU_WIDE = { azucar: 1, dap: 1, potasa: 1, diesel: 1 };
  var UK_CODE = 'GB';
  var UP = '#b4341f', DOWN = '#2a6f97', FLAT = '#9c968a';
  var PRECIP_CLASSES = [[-Infinity, -40, '#8a4a12'], [-40, -15, '#c98a4b'], [-15, 15, '#cfcac0'], [15, 40, '#6fa3c0'], [40, Infinity, '#1f5f88']];
  var TEMP_CLASSES = [[-Infinity, -1.5, '#1f6d6b'], [-1.5, -0.5, '#7fb5b3'], [-0.5, 0.5, '#cfcac0'], [0.5, 1.5, '#e0946f'], [1.5, Infinity, '#b4341f']];
  var T = {
    es: { title: 'Mapa agrícola', noVerified: 'sin dato verificado', sub: 'Dónde están los datos: precios verificados por país y cómo va el clima en las regiones productoras.',
      views: { all: 'Atlántico', us: 'EE. UU.', eu: 'Europa' }, layers: { price: 'Precios', precip: 'Lluvia', temp: 'Temperatura' }, product: 'Producto', scopeEs: 'España (referencia UE)', scopeEu: 'Media UE', scopeUs: 'EE. UU.', scopeUk: 'Reino Unido',
      change: 'Variación', date: 'Fecha', price: 'Precio', area: 'Ámbito', real: 'REAL', nc: 'NO COMPARABLE', up: 'sube', down: 'baja', flat: 'sin cambio',
      priceNote: 'Cada precio va en su moneda y unidad de origen: el mapa no convierte monedas. El color indica solo si el precio subió o bajó frente al periodo anterior (semanal o mensual según la fuente). Un país sin color no tiene dato verificado para este producto.',
      noData: 'Este producto no tiene datos verificados.', region: 'Región', vsNormal: 'vs. media 2001-2020', legendTitle: 'Leyenda',
      climateNote: 'Último mes cerrado, frente a la media 2001-2020 (NASA POWER). Cada punto es una celda de unos 50 km representativa de la región, no una estación. Es contexto, no predice cosechas ni precios.', more: 'Más detalle e histórico desde 2000',
      wet: 'más húmedo', dry: 'más seco', hot: 'más cálido', cool: 'más fresco', normal: 'cerca de lo normal', mm: 'mm', mapFail: 'No se pudo cargar el mapa; los datos siguen disponibles en la tabla.',
      names: { arroz: 'Arroz', azucar: 'Azúcar', cerdo: 'Cerdo', cordero: 'Cordero', dap: 'Fertilizante fosfatado', diesel: 'Diésel', harina_soja: 'Harina de soja', huevos: 'Huevos', leche: 'Leche', maiz: 'Maíz', oliva: 'Aceite de oliva', pollo: 'Pollo', potasa: 'Fertilizante potásico', trigo: 'Trigo', vaca: 'Vacuno' },
      units: { tonelada: 'tonelada', '100kg': '100 kg', cwt: 'cwt', bushel: 'bushel', docena: 'docena', litro: 'litro', gal: 'galón', kg: 'kg', lb: 'lb' } },
    en: { title: 'Agricultural map', noVerified: 'no verified data', sub: 'Where the data is: verified prices by country and how the climate looks in producing regions.',
      views: { all: 'Atlantic', us: 'U.S.', eu: 'Europe' }, layers: { price: 'Prices', precip: 'Rainfall', temp: 'Temperature' }, product: 'Product', scopeEs: 'Spain (EU reference)', scopeEu: 'EU average', scopeUs: 'United States', scopeUk: 'United Kingdom',
      change: 'Change', date: 'Date', price: 'Price', area: 'Scope', real: 'REAL', nc: 'NOT COMPARABLE', up: 'up', down: 'down', flat: 'unchanged',
      priceNote: 'Each price is in its original currency and unit: the map does not convert currencies. Colour only shows whether the price rose or fell versus the previous period (weekly or monthly depending on the source). A country without colour has no verified data for this product.',
      noData: 'This product has no verified data.', region: 'Region', vsNormal: 'vs. 2001-2020 average', legendTitle: 'Legend',
      climateNote: 'Latest closed month vs. the 2001-2020 average (NASA POWER). Each point is a ~50 km grid cell representing the region, not a station. Context only: it does not forecast crops or prices.', more: 'More detail and history since 2000',
      wet: 'wetter', dry: 'drier', hot: 'warmer', cool: 'cooler', normal: 'near normal', mm: 'mm', mapFail: 'The map could not be loaded; the data is still available in the table.',
      names: { arroz: 'Rice', azucar: 'Sugar', cerdo: 'Pork', cordero: 'Lamb', dap: 'Phosphate fertiliser', diesel: 'Diesel', harina_soja: 'Soya meal', huevos: 'Eggs', leche: 'Milk', maiz: 'Corn', oliva: 'Olive oil', pollo: 'Chicken', potasa: 'Potash fertiliser', trigo: 'Wheat', vaca: 'Beef' },
      units: { tonelada: 'tonne', '100kg': '100 kg', cwt: 'cwt', bushel: 'bushel', docena: 'dozen', litro: 'litre', gal: 'gallon', kg: 'kg', lb: 'lb' } },
    fr: { title: 'Carte agricole', noVerified: 'pas de donnée vérifiée', sub: 'Où se trouvent les données : prix vérifiés par pays et état du climat dans les régions productrices.',
      views: { all: 'Atlantique', us: 'États-Unis', eu: 'Europe' }, layers: { price: 'Prix', precip: 'Pluie', temp: 'Température' }, product: 'Produit', scopeEs: 'Espagne (référence UE)', scopeEu: 'Moyenne UE', scopeUs: 'États-Unis', scopeUk: 'Royaume-Uni',
      change: 'Variation', date: 'Date', price: 'Prix', area: 'Périmètre', real: 'RÉEL', nc: 'NON COMPARABLE', up: 'hausse', down: 'baisse', flat: 'stable',
      priceNote: 'Chaque prix est dans sa devise et son unité d’origine : la carte ne convertit pas les devises. La couleur indique seulement si le prix a monté ou baissé par rapport à la période précédente (hebdomadaire ou mensuelle selon la source). Un pays sans couleur n’a pas de donnée vérifiée pour ce produit.',
      noData: 'Ce produit n’a pas de données vérifiées.', region: 'Région', vsNormal: 'vs. moyenne 2001-2020', legendTitle: 'Légende',
      climateNote: 'Dernier mois clos, par rapport à la moyenne 2001-2020 (NASA POWER). Chaque point est une maille d’environ 50 km représentative de la région, pas une station. Contexte uniquement : cela ne prévoit ni récoltes ni prix.', more: 'Plus de détails et historique depuis 2000',
      wet: 'plus humide', dry: 'plus sec', hot: 'plus chaud', cool: 'plus frais', normal: 'proche de la normale', mm: 'mm', mapFail: 'La carte n’a pas pu être chargée ; les données restent disponibles dans le tableau.',
      names: { arroz: 'Riz', azucar: 'Sucre', cerdo: 'Porc', cordero: 'Agneau', dap: 'Engrais phosphaté', diesel: 'Diesel', harina_soja: 'Tourteau de soja', huevos: 'Œufs', leche: 'Lait', maiz: 'Maïs', oliva: 'Huile d’olive', pollo: 'Poulet', potasa: 'Engrais potassique', trigo: 'Blé', vaca: 'Bœuf' },
      units: { tonelada: 'tonne', '100kg': '100 kg', cwt: 'cwt', bushel: 'boisseau', docena: 'douzaine', litro: 'litre', gal: 'gallon', kg: 'kg', lb: 'lb' } },
    it: { title: 'Mappa agricola', noVerified: 'nessun dato verificato', sub: 'Dove sono i dati: prezzi verificati per paese e stato del clima nelle regioni produttrici.',
      views: { all: 'Atlantico', us: 'USA', eu: 'Europa' }, layers: { price: 'Prezzi', precip: 'Pioggia', temp: 'Temperatura' }, product: 'Prodotto', scopeEs: 'Spagna (riferimento UE)', scopeEu: 'Media UE', scopeUs: 'Stati Uniti', scopeUk: 'Regno Unito',
      change: 'Variazione', date: 'Data', price: 'Prezzo', area: 'Ambito', real: 'REALE', nc: 'NON COMPARABILE', up: 'in aumento', down: 'in calo', flat: 'invariato',
      priceNote: 'Ogni prezzo è nella sua valuta e unità di origine: la mappa non converte le valute. Il colore indica solo se il prezzo è salito o sceso rispetto al periodo precedente (settimanale o mensile secondo la fonte). Un paese senza colore non ha dati verificati per questo prodotto.',
      noData: 'Questo prodotto non ha dati verificati.', region: 'Regione', vsNormal: 'vs. media 2001-2020', legendTitle: 'Legenda',
      climateNote: 'Ultimo mese chiuso, rispetto alla media 2001-2020 (NASA POWER). Ogni punto è una cella di circa 50 km rappresentativa della regione, non una stazione. Solo contesto: non prevede raccolti né prezzi.', more: 'Più dettagli e storico dal 2000',
      wet: 'più umido', dry: 'più secco', hot: 'più caldo', cool: 'più fresco', normal: 'vicino alla norma', mm: 'mm', mapFail: 'Impossibile caricare la mappa; i dati restano disponibili nella tabella.',
      names: { arroz: 'Riso', azucar: 'Zucchero', cerdo: 'Maiale', cordero: 'Agnello', dap: 'Fertilizzante fosfatico', diesel: 'Gasolio', harina_soja: 'Farina di soia', huevos: 'Uova', leche: 'Latte', maiz: 'Mais', oliva: 'Olio d’oliva', pollo: 'Pollo', potasa: 'Fertilizzante potassico', trigo: 'Grano', vaca: 'Bovino' },
      units: { tonelada: 'tonnellata', '100kg': '100 kg', cwt: 'cwt', bushel: 'bushel', docena: 'dozzina', litro: 'litro', gal: 'gallone', kg: 'kg', lb: 'lb' } }
  };
  var LATEST = null, CLIMATE = null, MAP = null;
  var SEL = { layer: 'price', product: 'trigo', view: 'all' };
  var VIEWS = { all: { regions: ['US', 'GB', 'ES', 'FR', 'DE', 'IT', 'PL'] }, us: { coords: [39, -97], scale: 2.6 }, eu: { coords: [48, 9], scale: 4.2 } };
  var SYM = { EUR: '€', USD: '$', GBP: '£' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tr() { return T[lang()] || T.es; }
  function num(v, d) { return v.toFixed(d).replace('.', ','); }
  function sgn(v, d, unit) { return (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), d) + unit; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function priceDecimals(v) { return Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2; }
  function inClass(v, classes) { for (var i = 0; i < classes.length; i++) if (v >= classes[i][0] && v < classes[i][1]) return classes[i][2]; return classes[classes.length - 1][2]; }

  function priceRows(product) {
    var t = tr(), out = [];
    LATEST.forEach(function (o) {
      if (o.product !== product || o.status !== 'verified') return;
      var codes, scope;
      if (o.region === 'us') { codes = ['US']; scope = t.scopeUs; }
      else if (o.region === 'uk') { codes = [UK_CODE]; scope = t.scopeUk; }
      else if (EU_SPAIN[product]) { codes = ['ES']; scope = t.scopeEs; }
      else if (EU_WIDE[product]) { codes = EU27; scope = t.scopeEu; }
      else return;
      out.push({ codes: codes, scope: scope, value: o.value, currency: o.currency, unit: o.unit, change: o.changePct, date: o.observationDate, nc: o.comparability === 'not_comparable', freq: o.frequency });
    });
    return out;
  }
  function priceProducts() {
    var seen = {};
    LATEST.forEach(function (o) { if (o.status === 'verified' && (EU_SPAIN[o.product] || EU_WIDE[o.product] || (o.region !== 'eu' && T.es.names[o.product]))) seen[o.product] = 1; });
    return Object.keys(seen).sort(function (a, b) { return tr().names[a].localeCompare(tr().names[b]); });
  }
  function changeColor(c) { return c > 0 ? UP : c < 0 ? DOWN : FLAT; }
  function changeWord(c, t) { return c > 0 ? t.up : c < 0 ? t.down : t.flat; }

  function paintMap(codesColors, markers) {
    if (MAP) { try { MAP.destroy(); } catch (e) {} MAP = null; }
    var host = document.getElementById('mapa-canvas'), fb = document.getElementById('mapa-fallback');
    if (!host) return;
    host.innerHTML = '';
    if (typeof window.jsVectorMap !== 'function') { fb.textContent = tr().mapFail; fb.style.display = 'block'; return; }
    fb.style.display = 'none';
    try {
      MAP = new window.jsVectorMap({
        selector: '#mapa-canvas', map: 'world', backgroundColor: 'transparent', zoomButtons: true, zoomOnScroll: false, showTooltip: true,
        regionStyle: { initial: { fill: '#e6e2d6', stroke: '#c8c3b4', strokeWidth: 0.4, fillOpacity: 1 }, hover: { fillOpacity: 0.85 } },
        markers: markers || [], markerStyle: { initial: { r: 8, stroke: '#ffffff', strokeWidth: 1.5, fillOpacity: 1 }, hover: { r: 10 } },
        onMarkerTooltipShow: function (e, tip, idx) { if (markers && markers[idx]) tip.text(markers[idx].html, true); },
        onRegionTooltipShow: function (e, tip, code) { var h = codesColors && codesColors[code] && codesColors[code].html; if (h) tip.text(h, true); }
      });
      try { var vw = VIEWS[SEL.view] || VIEWS.all; MAP.setFocus(vw.regions ? { regions: vw.regions, animate: false } : { coords: vw.coords, scale: vw.scale, animate: false }); } catch (e) {}
      Object.keys(codesColors || {}).forEach(function (code) {
        var r = MAP.regions && MAP.regions[code]; if (r) { try { r.element.setStyle('fill', codesColors[code].color); } catch (e) {} }
      });
    } catch (e) { MAP = null; fb.textContent = tr().mapFail; fb.style.display = 'block'; }
  }

  function legend(items) {
    return '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;margin:8px 0">' + items.map(function (i) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + i[0] + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></span>' + esc(i[1]) + '</span>'; }).join('') + '</div>';
  }

  function renderPrice(t) {
    var prods = priceProducts();
    if (prods.indexOf(SEL.product) < 0) SEL.product = prods[0];
    var rows = priceRows(SEL.product);
    var opts = prods.map(function (p) { return '<option value="' + p + '"' + (p === SEL.product ? ' selected' : '') + '>' + esc(t.names[p]) + '</option>'; }).join('');
    var colors = {};
    rows.forEach(function (r) {
      var html = '<strong>' + esc(r.scope) + '</strong><br>' + esc(SYM[r.currency] || r.currency) + num(r.value, priceDecimals(r.value)) + ' / ' + esc(t.units[r.unit] || r.unit) + '<br>' + esc(t.change) + ': ' + sgn(r.change, 1, ' %') + ' (' + changeWord(r.change, t) + ')';
      r.codes.forEach(function (c) { colors[c] = { color: changeColor(r.change), html: html }; });
    });
    var table = '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + t.area.toUpperCase() + '</th><th style="padding:10px 6px;text-align:right">' + t.price.toUpperCase() + '</th><th style="padding:10px 6px;text-align:right">' + t.change.toUpperCase() + '</th><th style="padding:10px 6px">' + t.date.toUpperCase() + '</th><th style="padding:10px 6px"></th></tr>' +
      rows.map(function (r) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:10px 6px;font-weight:600">' + esc(r.scope) + '</td><td style="padding:10px 6px;text-align:right">' + esc(SYM[r.currency] || r.currency) + num(r.value, priceDecimals(r.value)) + ' / ' + esc(t.units[r.unit] || r.unit) + '</td><td style="padding:10px 6px;text-align:right;font-weight:600;color:' + changeColor(r.change) + '">' + sgn(r.change, 1, ' %') + '</td><td style="padding:10px 6px">' + esc(r.date) + '</td><td style="padding:10px 6px"><span class="di-movers-hint">' + (r.nc ? t.nc : t.real) + '</span></td></tr>'; }).join('') + '</table></div>';
    document.getElementById('mapa-controls').innerHTML = '<label style="font-size:13px">' + t.product + '<br><select id="mapa-sel-prod" class="di-compare-select">' + opts + '</select></label>';
    document.getElementById('mapa-sel-prod').onchange = function (e) { SEL.product = e.target.value; render(); };
    document.getElementById('mapa-legend').innerHTML = legend([[UP, t.up], [DOWN, t.down], [FLAT, t.flat], ['#e6e2d6', t.noVerified]]);
    document.getElementById('mapa-table').innerHTML = rows.length ? table : '<p class="di-movers-hint">' + t.noData + '</p>';
    document.getElementById('mapa-note').textContent = t.priceNote;
    paintMap(colors, null);
  }

  function renderClimate(t, kind) {
    if (!CLIMATE) { SEL.layer = 'price'; return renderPrice(t); }
    var isP = kind === 'precip', classes = isP ? PRECIP_CLASSES : TEMP_CLASSES;
    var locs = CLIMATE.locations, last = CLIMATE.lastPeriod;
    var markers = locs.map(function (l) {
      var m = l.months[l.months.length - 1], v = isP ? m.precipAnomalyPct : m.tempAnomalyC;
      var line = isP ? sgn(v, 0, ' %') + ' (' + num(m.precipMm, 0) + ' ' + t.mm + ')' : sgn(v, 1, ' °C') + ' (' + num(m.tempC, 1) + ' °C)';
      return { name: l.name, coords: [l.lat, l.lon], style: { initial: { fill: inClass(v, classes) } }, html: '<strong>' + esc(l.name) + '</strong><br>' + esc(m.period) + ': ' + line + '<br>' + t.vsNormal, v: v, m: m, l: l };
    });
    var rows = markers.slice().sort(function (a, b) { return isP ? a.v - b.v : b.v - a.v; });
    var table = '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:480px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + t.region.toUpperCase() + ' (' + esc(last) + ')</th><th style="padding:10px 6px;text-align:right">' + (isP ? t.layers.precip : t.layers.temp).toUpperCase() + ' ' + t.vsNormal.toUpperCase() + '</th></tr>' +
      rows.map(function (r) { var c = inClass(r.v, classes); return '<tr style="border-top:1px solid var(--border)"><td style="padding:10px 6px"><span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' + c + ';margin-right:8px;border:1px solid rgba(0,0,0,.15)"></span><b>' + esc(r.l.name) + '</b></td><td style="padding:10px 6px;text-align:right;font-weight:600">' + (isP ? sgn(r.v, 0, ' %') : sgn(r.v, 1, ' °C')) + '</td></tr>'; }).join('') + '</table></div>';
    document.getElementById('mapa-controls').innerHTML = '';
    var lg = isP ? [[classes[0][2], '< −40 % ' + t.dry], [classes[1][2], '−40 … −15 %'], [classes[2][2], t.normal], [classes[3][2], '+15 … +40 %'], [classes[4][2], '> +40 % ' + t.wet]] : [[classes[0][2], '< −1,5 °C ' + t.cool], [classes[1][2], '−1,5 … −0,5 °C'], [classes[2][2], t.normal], [classes[3][2], '+0,5 … +1,5 °C'], [classes[4][2], '> +1,5 °C ' + t.hot]];
    document.getElementById('mapa-legend').innerHTML = legend(lg);
    document.getElementById('mapa-table').innerHTML = table + '<p class="di-movers-hint" style="margin-top:8px"><a href="clima.html">' + t.more + ' →</a></p>';
    document.getElementById('mapa-note').textContent = t.climateNote;
    paintMap(null, markers);
  }

  function shell() {
    var t = tr();
    var btn = function (k) { return '<button type="button" class="di-link-btn" data-layer="' + k + '" aria-pressed="' + (SEL.layer === k) + '" style="' + (SEL.layer === k ? 'font-weight:700;text-decoration:underline;' : '') + 'margin-right:14px">' + t.layers[k] + '</button>'; };
    document.getElementById('mapa-body').innerHTML = '<div style="margin-bottom:12px">' + btn('price') + btn('precip') + btn('temp') + '</div><div id="mapa-controls" style="margin-bottom:10px"></div><div id="mapa-legend"></div>' +
      '<div style="margin:0 0 6px;font-size:13px">' + ['all', 'us', 'eu'].map(function (v) { return '<button type="button" class="di-link-btn" data-view="' + v + '" aria-pressed="' + (SEL.view === v) + '" style="' + (SEL.view === v ? 'font-weight:700;text-decoration:underline;' : '') + 'margin-right:12px">' + t.views[v] + '</button>'; }).join('') + '</div><div class="di-card" style="padding:8px"><div id="mapa-canvas" style="height:420px;width:100%"></div><p id="mapa-fallback" class="di-movers-hint" style="display:none;padding:12px"></p></div><p id="mapa-note" class="di-info-api-notice" style="margin:10px 0 18px"></p><div id="mapa-table"></div>';
    Array.prototype.forEach.call(document.querySelectorAll('#mapa-body [data-view]'), function (b) { b.onclick = function () { SEL.view = b.getAttribute('data-view'); shell(); render(); }; });
    Array.prototype.forEach.call(document.querySelectorAll('#mapa-body [data-layer]'), function (b) { b.onclick = function () { SEL.layer = b.getAttribute('data-layer'); shell(); render(); }; });
  }
  function render() {
    var t = tr();
    document.title = 'Dehesa Index — ' + t.title;
    document.getElementById('pg-h1').textContent = t.title;
    document.getElementById('pg-sub').textContent = t.sub;
    if (!document.getElementById('mapa-canvas')) shell();
    if (SEL.layer === 'price') renderPrice(t); else renderClimate(t, SEL.layer);
  }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); render(); };
  Promise.all([
    fetch('data/latest.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch('data/climate.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]).then(function (a) {
    LATEST = (a[0] && a[0].observations) || []; CLIMATE = a[1] && a[1].locations && a[1].locations.length ? a[1] : null;
    if (!LATEST.length && !CLIMATE) return;
    shell(); render();
  });
})();
