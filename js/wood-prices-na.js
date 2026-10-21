/* Dehesa Index — Madera en EE. UU. (BLS, índice de precios de productor, 1982 = 100) y Canadá (Statistics Canada, IPPI). data/wood-prices-na.json
   (scripts/update-wood-prices-na.py). Son índices, no dólares por pie tablar. Productos con botones; periodo con botones; gráfico con lectura al pasar.
   Si el fichero o el país no tienen datos, no pinta nada. ES5. window.DehesaWoodNA.render(el, 'US'|'CA') */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var T = {
    es: { US: 'EE. UU.: precio de la madera (índice de precios de productor)', CA: 'Canadá: precio de la madera (índice de precios industriales)', badge: 'DATOS OFICIALES REALES', last: 'Último mes', mom: 'Variación mensual', yoy: 'Variación anual', peak: 'Máximo de la serie', from: 'Desde', all: 'Todo', unit: 'índice', hover: 'Pasa el cursor o toca el gráfico para leer cada mes.',
      note: 'Es un índice de precios, no dólares por pie tablar o por m³: dice cuánto ha subido o bajado la madera frente al año base, no cuánto cuesta. Variaciones calculadas por Dehesa Index con las cifras publicadas.', src: 'Fuente:',
      p: { lumber: 'Madera aserrada (total)', softwood: 'Madera aserrada de coníferas', hardwood: 'Madera aserrada de frondosas', plywood: 'Contrachapado', logs: 'Trozas, rollizos y madera para pasta' } },
    en: { US: 'US: timber prices (producer price index)', CA: 'Canada: timber prices (industrial product price index)', badge: 'REAL OFFICIAL DATA', last: 'Latest month', mom: 'Monthly change', yoy: 'Annual change', peak: 'Series high', from: 'From', all: 'All', unit: 'index', hover: 'Hover or tap the chart to read each month.',
      note: 'This is a price index, not dollars per board foot or per m³: it shows how far timber has risen or fallen against the base year, not what it costs. Changes calculated by Dehesa Index from the published figures.', src: 'Source:',
      p: { lumber: 'Lumber (total)', softwood: 'Softwood lumber', hardwood: 'Hardwood lumber', plywood: 'Plywood', logs: 'Logs, bolts, timber and pulpwood' } },
    fr: { US: 'États-Unis : prix du bois (indice des prix à la production)', CA: 'Canada : prix du bois (indice des prix des produits industriels)', badge: 'DONNÉES OFFICIELLES RÉELLES', last: 'Dernier mois', mom: 'Variation mensuelle', yoy: 'Variation annuelle', peak: 'Maximum de la série', from: 'Depuis', all: 'Tout', unit: 'indice', hover: 'Survolez ou touchez le graphique pour lire chaque mois.',
      note: 'C’est un indice de prix, pas des dollars par pied-planche ou par m³ : il indique de combien le bois a monté ou baissé par rapport à l’année de base, pas ce qu’il coûte. Variations calculées par Dehesa Index à partir des chiffres publiés.', src: 'Source :',
      p: { lumber: 'Bois de sciage (total)', softwood: 'Bois de sciage résineux', hardwood: 'Bois de sciage feuillus', plywood: 'Contreplaqué', logs: 'Grumes, billes et bois à pâte' } },
    it: { US: 'USA: prezzo del legname (indice dei prezzi alla produzione)', CA: 'Canada: prezzo del legname (indice dei prezzi industriali)', badge: 'DATI UFFICIALI REALI', last: 'Ultimo mese', mom: 'Variazione mensile', yoy: 'Variazione annua', peak: 'Massimo della serie', from: 'Dal', all: 'Tutto', unit: 'indice', hover: 'Passa il cursore o tocca il grafico per leggere ogni mese.',
      note: 'È un indice di prezzi, non dollari per piede di tavola o per m³: indica di quanto il legname è salito o sceso rispetto all’anno base, non quanto costa. Variazioni calcolate da Dehesa Index sulle cifre pubblicate.', src: 'Fonte:',
      p: { lumber: 'Legname segato (totale)', softwood: 'Legname segato di conifere', hardwood: 'Legname segato di latifoglie', plywood: 'Compensato', logs: 'Tronchi, toppi e legno da pasta' } }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  var MN = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'] };
  var ST = {};
  function lang() { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function n1(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function pct(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' }).replace('-', '−') + ' %'; }
  function ml(m, lg) { return MN[lg][parseInt(m.slice(5), 10) - 1] + ' ' + m.slice(0, 4); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  var CACHE = null;
  function load() { return CACHE || (CACHE = fetch('data/wood-prices-na.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function nameOf(t, k) { return t.p[k] || k; }
  function draw(el, cc, d) {
    var lg = lang(), t = T[lg], c = d.countries[cc], keys = Object.keys(c.series), st = ST[cc] || (ST[cc] = { k: keys[0], from: 2000 });
    if (keys.indexOf(st.k) < 0) st.k = keys[0];
    var ms = c.months, s = c.series[st.k], n = ms.length, li = -1, i;
    for (i = n - 1; i >= 0; i--) if (s[i] != null) { li = i; break; }
    if (li < 0) { el.innerHTML = ''; return; }
    var pk = 0, pi = 0; for (i = 0; i < n; i++) if (s[i] != null && s[i] >= pk) { pk = s[i]; pi = i; }
    var prev = li > 0 ? s[li - 1] : null, yr = li >= 12 ? s[li - 12] : null;
    var pts = []; for (i = 0; i < n; i++) if (s[i] != null && parseInt(ms[i].slice(0, 4), 10) >= st.from) pts.push({ x: Date.UTC(+ms[i].slice(0, 4), +ms[i].slice(5) - 1, 1), y: s[i], l: ml(ms[i], lg) });
    var chips = '<div class="dch" role="group" aria-label="' + esc(t.unit) + '"><div class="dch-row">' + keys.map(function (k) { return '<button type="button" class="dch-b" data-wna-k="' + k + '" aria-pressed="' + (k === st.k) + '"><span aria-hidden="true">🌲</span><span>' + esc(nameOf(t, k)) + '</span></button>'; }).join('') + '</div></div>';
    var y0 = +ms[0].slice(0, 4), from = [[y0, t.all + ' (' + y0 + ')'], [2000, '2000'], [2015, '2015'], [2020, '2020']];
    var fchips = '<div class="dch" role="group" aria-label="' + esc(t.from) + '"><span class="dch-l">' + esc(t.from) + '</span><div class="dch-row">' + from.map(function (o) { return '<button type="button" class="dch-b" data-wna-f="' + o[0] + '" aria-pressed="' + (o[0] === st.from) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div></div>';
    var C = global.DehesaChart, ch = C ? C.render({ series: [{ name: nameOf(t, st.k), color: '#2f6b4a', pts: pts }], xMode: 'time', yTitle: t.unit + ' (' + (c.source.base || '') + ')', aria: t[cc] + ' — ' + nameOf(t, st.k), noLegend: true,
      vFmt: function (v) { return n1(v, lg); }, xFmt: function (x) { return new Date(x).getUTCFullYear(); } }) : '';
    el.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div><div class="di-card di-info-card wp-card"><div class="di-info-card-title">' + esc(t[cc]) + '</div>' + chips + fchips +
      '<div class="di-info-stat-list">' + row(t.last + ' · ' + ml(ms[li], lg), '<b>' + n1(s[li], lg) + '</b> ' + esc(t.unit) + ' (' + esc(c.source.base || '') + ')') + row(t.mom, pct(prev ? (s[li] / prev - 1) * 100 : null, lg)) + row(t.yoy, pct(yr ? (s[li] / yr - 1) * 100 : null, lg)) +
      row(t.peak, '<b>' + n1(pk, lg) + '</b> · ' + esc(ml(ms[pi], lg))) + '</div>' + ch + '</div>' +
      '<div class="di-info-scope-note">' + esc(t.note) + '</div><div class="di-field-hint di-info-sources">' + esc(t.src) + ' <a href="' + esc(c.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(c.source.name) + '</a> · ' + esc(c.source.license) + '</div>';
  }
  function render(el, cc) {
    if (!el) return;
    load().then(function (d) {
      if (!d || !d.countries || !d.countries[cc]) { el.innerHTML = ''; return; }
      draw(el, cc, d);
      if (!el.getAttribute('data-wna')) {
        el.setAttribute('data-wna', '1');
        el.addEventListener('click', function (ev) {
          var b = ev.target.closest ? ev.target.closest('button[data-wna-k],button[data-wna-f]') : null; if (!b) return;
          var st = ST[cc]; if (b.getAttribute('data-wna-k')) st.k = b.getAttribute('data-wna-k'); else st.from = +b.getAttribute('data-wna-f');
          var sel = b.getAttribute('data-wna-k') ? '[data-wna-k="' + st.k + '"]' : '[data-wna-f="' + st.from + '"]';
          draw(el, cc, d); var f = el.querySelector(sel); if (f) f.focus();
        });
      }
    });
  }
  global.DehesaWoodNA = { render: render, has: function (cc) { return load().then(function (d) { return !!(d && d.countries && d.countries[cc]); }); } };
})(window);
