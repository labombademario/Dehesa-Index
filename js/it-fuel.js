/* Dehesa Index — Italia: gasóleo de automoción y de calefacción (MASE, semanal desde 2005) y gasóleo en las gasolineras por región (MIMIT).
   data/it-fuel.json (scripts/update-it-fuel.py). Bloque de la ficha de Italia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Gasóleo en Italia', last: 'Gasóleo de automoción, semana del {d}', heat: 'Gasóleo de calefacción, misma semana', w: 'Hace una semana', m: 'Hace cuatro semanas', y: 'Hace un año', chart: 'Precios medios semanales', from: 'Desde', all: 'Todo (2005)', hover: 'Pasa el cursor o toca el gráfico para ver cada semana.', lA: 'Gasóleo de automoción', lH: 'Gasóleo de calefacción', unit: '€/l, con impuestos',
      map: 'Gasóleo en las gasolineras, mediana por región · {d}', mapHint: 'Pasa el cursor o toca una región.', none: 'sin dato', st: 'gasolineras',
      note: 'En Italia el gasóleo agrícola lleva un impuesto reducido y las regiones asignan a cada explotación un cupo anual a través del registro UMA; no hay un precio público nacional de ese gasóleo, así que aquí se muestran el de automoción y el de calefacción, que son la referencia de mercado. Precios medios semanales con impuestos del Ministerio de Medio Ambiente y Seguridad Energética; el mapa es la mediana del gasóleo en autoservicio que cada gasolinera comunica al Ministerio de Empresas.', src: 'Fuente:', srcA: 'MASE, precios medios semanales de los carburantes', srcB: 'MIMIT, precios en las gasolineras', cite: 'Medianas por región y variaciones: cálculo de Dehesa Index.' },
    en: { h: 'Diesel in Italy', last: 'Road diesel, week of {d}', heat: 'Heating gas oil, same week', w: 'A week ago', m: 'Four weeks ago', y: 'A year ago', chart: 'Weekly average prices', from: 'From', all: 'All (2005)', hover: 'Hover or tap the chart to read each week.', lA: 'Road diesel', lH: 'Heating gas oil', unit: '€/l, taxes included',
      map: 'Diesel at filling stations, median by region · {d}', mapHint: 'Hover or tap a region.', none: 'no data', st: 'stations',
      note: 'In Italy farm diesel carries a reduced excise duty and the regions give each farm a yearly allowance through the UMA register; there is no public national price for it, so this shows road diesel and heating gas oil, the market benchmarks. Weekly average prices with taxes from the Ministry of Environment and Energy Security; the map is the median self-service diesel price each station reports to the Ministry of Enterprises.', src: 'Source:', srcA: 'MASE, weekly average fuel prices', srcB: 'MIMIT, filling-station prices', cite: 'Regional medians and changes: calculated by Dehesa Index.' },
    fr: { h: 'Gazole en Italie', last: 'Gazole routier, semaine du {d}', heat: 'Gazole de chauffage, même semaine', w: 'Il y a une semaine', m: 'Il y a quatre semaines', y: 'Il y a un an', chart: 'Prix moyens hebdomadaires', from: 'Depuis', all: 'Tout (2005)', hover: 'Survolez ou touchez le graphique pour lire chaque semaine.', lA: 'Gazole routier', lH: 'Gazole de chauffage', unit: '€/l TTC',
      map: 'Gazole en station, médiane par région · {d}', mapHint: 'Survolez ou touchez une région.', none: 'pas de donnée', st: 'stations',
      note: 'En Italie, le gazole agricole bénéficie d’une accise réduite et les régions attribuent à chaque exploitation un contingent annuel via le registre UMA ; il n’existe pas de prix public national de ce gazole, d’où l’affichage du gazole routier et du gazole de chauffage, références de marché. Prix moyens hebdomadaires TTC du ministère de l’Environnement et de la Sécurité énergétique ; la carte montre la médiane du gazole en libre-service déclarée par chaque station au ministère des Entreprises.', src: 'Source :', srcA: 'MASE, prix moyens hebdomadaires des carburants', srcB: 'MIMIT, prix en station', cite: 'Médianes régionales et variations : calcul de Dehesa Index.' },
    it: { h: 'Gasolio in Italia', last: 'Gasolio auto, settimana del {d}', heat: 'Gasolio da riscaldamento, stessa settimana', w: 'Una settimana fa', m: 'Quattro settimane fa', y: 'Un anno fa', chart: 'Prezzi medi settimanali', from: 'Dal', all: 'Tutto (2005)', hover: 'Passa il cursore o tocca il grafico per leggere ogni settimana.', lA: 'Gasolio auto', lH: 'Gasolio da riscaldamento', unit: '€/l, tasse incluse',
      map: 'Gasolio ai distributori, mediana per regione · {d}', mapHint: 'Passa il cursore o tocca una regione.', none: 'nessun dato', st: 'distributori',
      note: 'In Italia il gasolio agricolo ha un’accisa ridotta e le regioni assegnano a ogni azienda un quantitativo annuo tramite l’UMA; non esiste un prezzo pubblico nazionale di quel gasolio, perciò qui si mostrano il gasolio auto e quello da riscaldamento, riferimenti di mercato. Prezzi medi settimanali con tasse del Ministero dell’Ambiente e della Sicurezza Energetica; la mappa è la mediana del gasolio self che ogni distributore comunica al Ministero delle Imprese.', src: 'Fonte:', srcA: 'MASE, prezzi medi settimanali dei carburanti', srcB: 'MIMIT, prezzi ai distributori', cite: 'Mediane regionali e variazioni: calcolo di Dehesa Index.' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, st = { from: 2019 }, M = global.DIFrDeptMap, esc = M.esc;
  function eur(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function sgn(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function pct(v, lg) { return ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %)'; }
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function chart(R, lg, t) {
    R = R.filter(function (r) { return parseInt(r[0].slice(0, 4), 10) >= st.from; }); if (R.length < 2) return { html: '' };
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, t0 = Date.parse(R[0][0]), t1 = Date.parse(R[R.length - 1][0]), lo = 1e9, hi = 0, i, j;
    for (i = 0; i < R.length; i++) for (j = 1; j < 3; j++) if (R[i][j] != null) { lo = Math.min(lo, R[i][j]); hi = Math.max(hi, R[i][j]); }
    lo = Math.floor(lo * 5) / 5; hi = Math.ceil(hi * 5) / 5; var stp = hi - lo > 1.6 ? 0.4 : 0.2;
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); }, g = '', xt = '';
    for (var v = lo; v <= hi + 1e-9; v += stp) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '</text>';
    var y0 = parseInt(R[0][0].slice(0, 4), 10), y1 = parseInt(R[R.length - 1][0].slice(0, 4), 10), ev = y1 - y0 > 12 ? 4 : y1 - y0 > 5 ? 2 : 1;
    for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) { var xx = X(yy + '-01-01'); xt += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    function line(ix) { var p = '', open = false; for (var k = 0; k < R.length; k++) { if (R[k][ix] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(R[k][0]).toFixed(1) + ' ' + Y(R[k][ix]).toFixed(1); open = true; } return p; }
    var fsel = '<label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select if-from" aria-label="' + esc(t.from) + '">' + [[2005, t.all], [2015, '2015'], [2019, '2019'], [2023, '2023']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === st.from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    return { R: R, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.chart) + '</div><div class="wd-sels">' + fsel + '</div><div class="wp-chart if-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.chart) + '">' + g + xt +
      '<path class="wp-line wp-line-w" d="' + line(2) + '"/><path class="wp-line wp-line-t" d="' + line(1) + '"/><line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="wp-legend"><span><i class="wp-sw wp-sw-t"></i>' + esc(t.lA) + '</span><span><i class="wp-sw wp-sw-w"></i>' + esc(t.lH) + '</span><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' };
  }
  function bind(el, c, lg, t) {
    var box = el.querySelector('.if-chart'); if (!box || !c.R) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.R.length; k++) { var dd = Math.abs(c.X(c.R[k][0]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var x = c.R[b], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(day(x[0], lg)) + '</b> · ' + esc(t.lA) + ' <b>' + eur(x[1], lg) + '</b> · ' + esc(t.lH) + ' ' + eur(x[2], lg);
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/it-fuel.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load('DEHESA_IT_REGIONS', 'vendor/it-regions.js')]).then(function (a) {
      var d = a[0], MAP = a[1]; if (!d || !d.weekly || !d.weekly.length) return false;
      var t = T[lg], R = d.weekly, n = R.length, x = R[n - 1];
      function back(k) { var r = R[n - 1 - k]; return r ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
      function draw(focus) {
        var c = chart(R, lg, t), S = d.stations, vals = {}, k, mp = '';
        if (S && MAP) {
          for (k in S.regions) if (S.regions.hasOwnProperty(k)) vals[k] = S.regions[k][0];
          var m = M.html(MAP, { values: vals, fmt: function (v, short) { return short ? v.toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : eur(v, lg); }, label: t.map.replace('{d}', day(S.date, lg)), none: t.none });
          mp = '<div class="di-info-card-title gb-sub">' + esc(t.map.replace('{d}', day(S.date, lg))) + '</div><div class="wp-readout if-tip" aria-live="polite">' + esc(t.mapHint) + '</div>' + m.html;
        }
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-it-fuel" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.last.replace('{d}', day(x[0], lg)), '<b>' + eur(x[1], lg) + '</b>') + row(t.heat, eur(x[2], lg)) + row(t.w, back(1)) + row(t.m, back(4)) + row(t.y, back(52)) + '</div>' + c.html + mp +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a> (CC BY 4.0); <a href="' + esc(d.source.stationsUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcB) + '</a> (IODL 2.0)<br>' + esc(t.cite) + '</p></section>';
        bind(el, c, lg, t);
        if (S && MAP) M.bind(el, el.querySelector('.if-tip'), t.mapHint, function (id) { var v = S.regions[id], nm = (MAP.states.filter(function (s) { return s.id === id; })[0] || {}).name || id; return '<b>' + esc(nm) + '</b> · ' + (v ? '<b>' + eur(v[0], lg) + '</b> (' + v[1] + ' ' + esc(t.st) + ')' : esc(t.none)); });
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-if')) { el.setAttribute('data-if', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('if-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.if-from'); } }); }
      return true;
    });
  }
  global.DIItFuel = { mount: mount };
})(window);
