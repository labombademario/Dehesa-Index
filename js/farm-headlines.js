/* Dehesa Index — cifras clave de Irlanda (CSO) y Hungría (KSH) en la ficha de país: tierra, leche / cosechas, precios.
   Datos: data/views/farm-headlines/<CC>.json (scripts/build-views.py, desde data/ie-cso-stats.json y data/hu-ksh-stats.json). ES5. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IDX = { es: 0, en: 1, fr: 2, it: 3 };
  var UI = {
    h: { IE: ['Irlanda en cifras: tierra, leche y precios', 'Ireland in figures: land, milk and prices', 'L’Irlande en chiffres : terre, lait et prix', 'Irlanda in cifre: terra, latte e prezzi'],
         HU: ['Hungría en cifras: tierra, cosechas y ganadería', 'Hungary in figures: land, harvests and livestock', 'La Hongrie en chiffres : terres, récoltes et élevage', 'Ungheria in cifre: terra, raccolti e allevamento'] },
    hover: ['Pasa el cursor por la gráfica.', 'Hover over the chart.', 'Survolez le graphique.', 'Passa il cursore sul grafico.'],
    src: ['Fuente:', 'Source:', 'Source :', 'Fonte:'],
    prev: ['antes', 'before', 'avant', 'prima'],
    note: {
      IE: ['Precio mediano de las ventas de tierra agrícola, según el CSO. Los índices de precios tienen base 2020 = 100. La leche es la recibida por industrias y cooperativas.',
           'Median price of agricultural land sales, according to the CSO. Price indices use 2020 = 100. Milk is the volume received by processors and co-ops.',
           'Prix médian des ventes de terres agricoles, selon le CSO. Les indices de prix ont pour base 2020 = 100. Le lait est celui reçu par les laiteries et coopératives.',
           'Prezzo mediano delle vendite di terra agricola, secondo il CSO. Gli indici di prezzo hanno base 2020 = 100. Il latte è quello ricevuto da industrie e cooperative.'],
      HU: ['Los valores del año en curso son los que publica el KSH y pueden ser provisionales. Precio y alquiler de la tierra de cultivo en forintos por hectárea.',
           'Current-year values are as published by the KSH and may be provisional. Arable land price and rent in forints per hectare.',
           'Les valeurs de l’année en cours sont celles publiées par le KSH et peuvent être provisoires. Prix et loyer des terres arables en forints par hectare.',
           'I valori dell’anno in corso sono quelli pubblicati dal KSH e possono essere provvisori. Prezzo e affitto della terra arabile in fiorini per ettaro.']
    },
    srcA: { IE: ['CSO Irlanda (PxStat), CC BY 4.0', 'CSO Ireland (PxStat), CC BY 4.0', 'CSO Irlande (PxStat), CC BY 4.0', 'CSO Irlanda (PxStat), CC BY 4.0'],
            HU: ['KSH Hungría (STADAT), CC BY 4.0', 'KSH Hungary (STADAT), CC BY 4.0', 'KSH Hongrie (STADAT), CC BY 4.0', 'KSH Ungheria (STADAT), CC BY 4.0'] }
  };
  var L = {
    land: ['Precio mediano de la tierra agrícola', 'Median agricultural land price', 'Prix médian des terres agricoles', 'Prezzo mediano della terra agricola'],
    tx: ['Ventas de tierra registradas', 'Land sales recorded', 'Ventes de terres enregistrées', 'Vendite di terra registrate'],
    milk: ['Leche recibida por las industrias', 'Milk received by processors', 'Lait reçu par les laiteries', 'Latte ricevuto dalle industrie'],
    fat: ['Grasa de la leche', 'Milk fat content', 'Matière grasse du lait', 'Grasso del latte'], prot: ['Proteína de la leche', 'Milk protein content', 'Protéines du lait', 'Proteine del latte'],
    pout: ['Índice de precios agrarios de producción', 'Agricultural output price index', 'Indice des prix agricoles à la production', 'Indice dei prezzi agricoli alla produzione'],
    pin: ['Índice de precios de los insumos', 'Agricultural input price index', 'Indice des prix des intrants', 'Indice dei prezzi dei mezzi di produzione'],
    pmilk: ['Índice del precio de la leche', 'Milk price index', 'Indice du prix du lait', 'Indice del prezzo del latte'], pfert: ['Índice del precio de los fertilizantes', 'Fertiliser price index', 'Indice du prix des engrais', 'Indice del prezzo dei fertilizzanti'],
    fert: ['Fertilizantes vendidos (total con cal)', 'Fertiliser sales (total incl. lime)', 'Engrais vendus (total chaux comprise)', 'Fertilizzanti venduti (totale con calce)'], pot: ['Potasio vendido', 'Potassium sold', 'Potassium vendu', 'Potassio venduto'],
    aland: ['Precio de la tierra de cultivo', 'Arable land price', 'Prix des terres arables', 'Prezzo della terra arabile'], arent: ['Alquiler anual de la tierra de cultivo', 'Annual arable land rent', 'Loyer annuel des terres arables', 'Affitto annuo della terra arabile'],
    gland: ['Precio del pastizal', 'Grassland price', 'Prix des prairies', 'Prezzo del prato'],
    wp: ['Producción de trigo', 'Wheat production', 'Production de blé', 'Produzione di grano'], wy: ['Rendimiento del trigo', 'Wheat yield', 'Rendement du blé', 'Resa del grano'],
    mp: ['Producción de maíz', 'Maize production', 'Production de maïs', 'Produzione di mais'], my: ['Rendimiento del maíz', 'Maize yield', 'Rendement du maïs', 'Resa del mais'],
    cow: ['Leche de vaca producida', 'Cow’s milk produced', 'Lait de vache produit', 'Latte vaccino prodotto'], cat: ['Vacuno (1 de diciembre)', 'Cattle (1 December)', 'Bovins (1er décembre)', 'Bovini (1° dicembre)'], pig: ['Porcino (1 de diciembre)', 'Pigs (1 December)', 'Porcins (1er décembre)', 'Suini (1° dicembre)'],
    gva: ['Peso de la agricultura, silvicultura y pesca en el valor añadido', 'Agriculture, forestry and fishing share of gross value added', 'Part de l’agriculture, sylviculture et pêche dans la valeur ajoutée', 'Peso di agricoltura, silvicoltura e pesca nel valore aggiunto']
  };
  var P = 'ie-cso-', K = 'hu-ksh-';
  var CFG = {
    IE: {
      rows: [['land', P + 'ara02-median-price-p-all-land-types-ireland', 0, ' €/ha'], ['tx', P + 'ara02-number-of-tran-all-land-types-ireland', 0, ''], ['milk', P + 'aka01-intake-of-cows-milk-by-m-domestic', 0, ' M l'],
             ['fat', P + 'aka01-fat-content-domestic', 2, ' %'], ['prot', P + 'aka01-protein-content-domestic', 2, ' %'], ['pout', P + 'ahm05-agricultural-output-price-index', 1, ''], ['pin', P + 'ahm05-agricultural-input-price-index', 1, ''],
             ['pmilk', P + 'ahm05-milk', 1, ''], ['pfert', P + 'ahm05-fertilisers', 1, ''], ['fert', P + 'eiia17-total-sales', 0, ' t'], ['pot', P + 'eiia17-potassium', 0, ' t']],
      charts: [{ t: ['Precio mediano de la tierra agrícola (€/ha)', 'Median agricultural land price (€/ha)', 'Prix médian des terres agricoles (€/ha)', 'Prezzo mediano della terra agricola (€/ha)'], s: [['land', P + 'ara02-median-price-p-all-land-types-ireland']] },
               { t: ['Leche recibida por las industrias (millones de litros)', 'Milk received by processors (million litres)', 'Lait reçu par les laiteries (millions de litres)', 'Latte ricevuto dalle industrie (milioni di litri)'], s: [['milk', P + 'aka01-intake-of-cows-milk-by-m-domestic']] }],
      url: 'https://data.cso.ie/'
    },
    HU: {
      rows: [['aland', K + '0009-arable-land-agricultural-land-pr', 0, ' HUF/ha'], ['arent', K + '0009-arable-land-annual-rental-prices', 0, ' HUF/ha'], ['gland', K + '0009-grassland-agricultural-land-pr', 0, ' HUF/ha'],
             ['wp', K + '0015-wheat', 0, ' t'], ['wy', K + '0018-wheat', 0, ' kg/ha'], ['mp', K + '0015-maize', 0, ' t'], ['my', K + '0018-maize', 0, ' kg/ha'],
             ['cow', K + '0034-cow-s-milk-production', 0, ' M l'], ['cat', K + '0027-cattle', 0, ' k'], ['pig', K + '0027-pigs', 0, ' k'], ['gva', K + '0001-share-of-agriculture-forestry-and-fishin', 1, ' %']],
      charts: [{ t: ['Precio de la tierra de cultivo (HUF/ha)', 'Arable land price (HUF/ha)', 'Prix des terres arables (HUF/ha)', 'Prezzo della terra arabile (HUF/ha)'], s: [['aland', K + '0009-arable-land-agricultural-land-pr']] },
               { t: ['Producción de trigo y de maíz (toneladas)', 'Wheat and maize production (tonnes)', 'Production de blé et de maïs (tonnes)', 'Produzione di grano e di mais (tonnellate)'], s: [['wp', K + '0015-wheat'], ['mp', K + '0015-maize']] }],
      url: 'https://www.ksh.hu/stadat'
    }
  };
  var CL = ['t', 'r'];
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function niceStep(max) { var raw = max / 4, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function chart(list, title, i, lg, cls) {
    var W = 560, H = 220, Lm = 62, Rr = 8, Tp = 10, B = 24, y0 = 1e9, y1 = 0, hi = 0, k, j;
    list.forEach(function (o) { o.pts.forEach(function (r) { y0 = Math.min(y0, +r[0].slice(0, 4)); y1 = Math.max(y1, +r[0].slice(0, 4)); hi = Math.max(hi, r[1]); }); });
    if (y1 <= y0 || hi <= 0) return { html: '' };
    var st = niceStep(hi); hi = Math.ceil(hi / st) * st;
    var X = function (y) { return Lm + (y - y0) / (y1 - y0) * (W - Lm - Rr); }, Y = function (v) { return Tp + (hi - v) / hi * (H - Tp - B); }, g = '';
    for (k = 0; k <= hi + 1e-9; k += st) g += '<line class="wp-grid" x1="' + Lm + '" x2="' + (W - Rr) + '" y1="' + Y(k).toFixed(1) + '" y2="' + Y(k).toFixed(1) + '"/><text class="wp-tick" x="' + (Lm - 5) + '" y="' + (Y(k) + 3.5).toFixed(1) + '" text-anchor="end">' + nf(k, lg, 0) + '</text>';
    var step = (y1 - y0) > 30 ? 10 : 5;
    for (j = Math.ceil(y0 / step) * step; j <= y1; j += step) g += '<text class="wp-tick" x="' + X(j).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="' + (X(j) > W - 20 ? 'end' : 'middle') + '">' + j + '</text>';
    var paths = list.map(function (o, n) { return '<path class="wp-line wp-line-' + CL[n] + '" d="' + o.pts.map(function (r, m) { return (m ? 'L' : 'M') + X(+r[0].slice(0, 4)).toFixed(1) + ' ' + Y(r[1]).toFixed(1); }).join('') + '"/>'; }).join('');
    var leg = list.length > 1 ? '<div class="wp-legend">' + list.map(function (o, n) { return '<span><i class="wp-sw wp-sw-' + CL[n] + '"></i>' + esc(L[o.k][i]) + '</span>'; }).join('') + '</div>' : '';
    return { list: list, X: X, W: W, Lm: Lm, cls: cls, y0: y0, y1: y1, i: i,
      html: '<div class="di-info-card-title gb-sub">' + esc(title) + '</div><div class="wp-chart ' + cls + '"><div class="wp-readout" aria-live="polite">' + esc(UI.hover[i]) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(title) + '">' + g + paths + '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' + leg + '</div>' };
  }
  function bind(el, c, lg) {
    if (!c.list) return; var box = el.querySelector('.' + c.cls); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, y = Math.round(c.y0 + (vx - c.Lm) / (c.W - c.Lm - 8) * (c.y1 - c.y0));
      y = Math.max(c.y0, Math.min(c.y1, y)); var px = c.X(y); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + y + '</b>' + c.list.map(function (o) { var q = o.pts.filter(function (p) { return +p[0].slice(0, 4) === y; })[0]; return q ? ' · ' + esc(L[o.k][c.i]) + ' <b>' + nf(q[1], lg, o.d) + '</b>' : ''; }).join('');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = UI.hover[c.i]; });
  }
  var CACHE = {};
  function mount(el, lg, cc) {
    if (!el || !CFG[cc]) return Promise.resolve(false); lg = LOC[lg] ? lg : 'es'; var i = IDX[lg], cfg = CFG[cc];
    CACHE[cc] = CACHE[cc] || fetch('data/views/farm-headlines/' + cc + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE[cc].then(function (d) {
      if (!d || !d.series || d.series.length < 6) return false;
      var by = {}; d.series.forEach(function (s) { by[s.id] = s; });
      var rows = cfg.rows.map(function (r) {
        var s = by[r[1]]; if (!s || !s.points || !s.points.length) return '';
        var n = s.points.length, a = s.points[n - 1], b = n > 1 ? s.points[n - 2] : null, u = r[3];
        return row(L[r[0]][i] + ' · ' + a[0], '<b>' + nf(a[1], lg, r[2]) + u + '</b>' + (b ? ' · ' + esc(b[0]) + ': ' + nf(b[1], lg, r[2]) : ''));
      }).join('');
      var dd = {}; cfg.rows.forEach(function (r) { dd[r[0]] = r[2]; });
      var charts = cfg.charts.map(function (c, n) {
        var list = c.s.map(function (x) { var s = by[x[1]]; return s ? { k: x[0], d: dd[x[0]], pts: s.points.filter(function (p) { return p[1] != null; }) } : null; }).filter(function (o) { return o && o.pts.length > 2; });
        return list.length ? chart(list, c.t[i], i, lg, 'fh-' + cc + n) : { html: '' };
      });
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-farm-headlines" style="max-width:none"><h2 class="ps-rm-h">' + esc(UI.h[cc][i]) + '</h2><div class="di-info-stat-list" style="max-width:760px">' + rows + '</div>' +
        charts.map(function (c) { return c.html; }).join('') + '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(UI.note[cc][i]) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(UI.src[i]) + ' <a href="' + esc(cfg.url) + '" target="_blank" rel="noopener noreferrer">' + esc(UI.srcA[cc][i]) + '</a></p></section>';
      charts.forEach(function (c) { bind(el, c, lg); });
      return true;
    });
  }
  global.DIFarmHeadlines = { mount: mount };
})(window);
