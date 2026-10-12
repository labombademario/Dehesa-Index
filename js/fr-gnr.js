/* Dehesa Index — Francia: gasóleo no de carretera (GNR, el gasóleo agrícola), gazole y fioul doméstico, precios medios semanales de la DGEC,
   y mediana del gazole por departamento en las gasolineras. data/fr-gnr.json (scripts/update-fr-gnr.py). Bloque de la ficha de Francia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Gasóleo agrícola (GNR) y combustibles en Francia', last: 'Gasóleo no de carretera (GNR), semana del {d}', htt: 'sin impuestos ni IVA', ttc: 'con impuestos', gaz: 'Gazole de carretera, misma semana', gap: 'Diferencia con el gazole', fod: 'Fioul doméstico (calefacción)', w: 'Hace una semana', m: 'Hace cuatro semanas', y: 'Hace un año', chart: 'Precios medios semanales', from: 'Desde', allH: 'Todo (2020)', hover: 'Pasa el cursor o toca el gráfico para ver cada semana.', lG: 'GNR (agrícola)', lA: 'Gazole (carretera)', lF: 'Fioul doméstico', unit: '€/l, con impuestos',
      map: 'Gazole de carretera en las gasolineras, mediana por departamento · {d}', mapHint: 'Pasa el cursor o toca un departamento.', none: 'sin dato', st: 'gasolineras',
      note: 'El GNR es el gasóleo de los tractores y la maquinaria agrícola: lleva un impuesto especial menor que el gazole de carretera y los agricultores pueden pedir además el reembolso de una parte de ese impuesto, así que lo que pagan de verdad queda por debajo del precio con impuestos. Son precios medios nacionales que calcula cada semana el ministerio (DGEC). En las gasolineras no se vende GNR: el mapa es el gazole de carretera, para ver cómo cambia el precio del gasóleo de un departamento a otro.',
      src: 'Fuente:', srcA: 'Ministerio de Transición Ecológica de Francia (DGEC), precios de los productos petrolíferos', srcB: 'precios en las gasolineras (flujo instantáneo)', cite: 'Medianas por departamento y variaciones: cálculo de Dehesa Index.' },
    en: { h: 'Farm diesel (GNR) and fuels in France', last: 'Non-road diesel (GNR), week of {d}', htt: 'before duty and VAT', ttc: 'taxes included', gaz: 'Road diesel, same week', gap: 'Gap with road diesel', fod: 'Heating oil', w: 'A week ago', m: 'Four weeks ago', y: 'A year ago', chart: 'Weekly average prices', from: 'From', allH: 'All (2020)', hover: 'Hover or tap the chart to read each week.', lG: 'GNR (farm)', lA: 'Road diesel', lF: 'Heating oil', unit: '€/l, taxes included',
      map: 'Road diesel at filling stations, median by department · {d}', mapHint: 'Hover or tap a department.', none: 'no data', st: 'stations',
      note: 'GNR is the diesel used in tractors and farm machinery: it carries a lower excise duty than road diesel, and farmers can also claim back part of that duty, so what they actually pay is below the taxed price. These are national averages calculated weekly by the ministry (DGEC). Filling stations do not sell GNR: the map shows road diesel, to see how diesel prices vary from one department to another.',
      src: 'Source:', srcA: 'French Ministry for the Ecological Transition (DGEC), petroleum product prices', srcB: 'filling-station prices (live feed)', cite: 'Department medians and changes: calculated by Dehesa Index.' },
    fr: { h: 'Gazole non routier (GNR) et combustibles en France', last: 'Gazole non routier (GNR), semaine du {d}', htt: 'hors taxes', ttc: 'toutes taxes', gaz: 'Gazole routier, même semaine', gap: 'Écart avec le gazole', fod: 'Fioul domestique', w: 'Il y a une semaine', m: 'Il y a quatre semaines', y: 'Il y a un an', chart: 'Prix moyens hebdomadaires', from: 'Depuis', allH: 'Tout (2020)', hover: 'Survolez ou touchez le graphique pour lire chaque semaine.', lG: 'GNR (agricole)', lA: 'Gazole (routier)', lF: 'Fioul domestique', unit: '€/l TTC',
      map: 'Gazole routier en station, médiane par département · {d}', mapHint: 'Survolez ou touchez un département.', none: 'pas de donnée', st: 'stations',
      note: 'Le GNR est le gazole des tracteurs et engins agricoles : son accise est plus faible que celle du gazole routier et les exploitants peuvent en outre demander le remboursement d’une partie de cette accise ; ce qu’ils paient réellement est donc inférieur au prix TTC. Ce sont des prix moyens nationaux calculés chaque semaine par la DGEC. Les stations ne vendent pas de GNR : la carte montre le gazole routier, pour voir comment le prix varie d’un département à l’autre.',
      src: 'Source :', srcA: 'Ministère de la Transition écologique (DGEC), prix des produits pétroliers', srcB: 'prix des carburants en station (flux instantané)', cite: 'Médianes par département et variations : calcul de Dehesa Index.' },
    it: { h: 'Gasolio agricolo (GNR) e combustibili in Francia', last: 'Gasolio non stradale (GNR), settimana del {d}', htt: 'senza accise né IVA', ttc: 'tasse incluse', gaz: 'Gasolio stradale, stessa settimana', gap: 'Differenza con il gasolio stradale', fod: 'Gasolio da riscaldamento', w: 'Una settimana fa', m: 'Quattro settimane fa', y: 'Un anno fa', chart: 'Prezzi medi settimanali', from: 'Dal', allH: 'Tutto (2020)', hover: 'Passa il cursore o tocca il grafico per leggere ogni settimana.', lG: 'GNR (agricolo)', lA: 'Gasolio stradale', lF: 'Gasolio da riscaldamento', unit: '€/l, tasse incluse',
      map: 'Gasolio stradale ai distributori, mediana per dipartimento · {d}', mapHint: 'Passa il cursore o tocca un dipartimento.', none: 'nessun dato', st: 'distributori',
      note: 'Il GNR è il gasolio di trattori e macchine agricole: ha un’accisa più bassa del gasolio stradale e gli agricoltori possono chiedere il rimborso di una parte di quell’accisa, quindi ciò che pagano davvero è inferiore al prezzo con tasse. Sono prezzi medi nazionali calcolati ogni settimana dal ministero (DGEC). Ai distributori il GNR non si vende: la mappa mostra il gasolio stradale, per vedere come varia il prezzo da un dipartimento all’altro.',
      src: 'Fonte:', srcA: 'Ministero francese della Transizione ecologica (DGEC), prezzi dei prodotti petroliferi', srcB: 'prezzi ai distributori (flusso in tempo reale)', cite: 'Mediane per dipartimento e variazioni: calcolo di Dehesa Index.' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, st = { from: 2020 };
  var M = global.DIFrDeptMap, esc = M.esc;
  function eur(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d == null ? 3 : d, maximumFractionDigits: d == null ? 3 : d }) + ' €/l'; }
  function sgn(v, lg) { if (v == null) return '—'; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function pct(v, lg) { return ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %)'; }
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function chart(R, lg, t) {
    R = R.filter(function (r) { return parseInt(r[0].slice(0, 4), 10) >= st.from && r[1] != null; }); if (R.length < 2) return { html: '' };
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, t0 = Date.parse(R[0][0]), t1 = Date.parse(R[R.length - 1][0]), lo = 1e9, hi = 0, i, j;
    for (i = 0; i < R.length; i++) for (j = 1; j < 5; j++) if (j !== 2 && R[i][j] != null) { lo = Math.min(lo, R[i][j]); hi = Math.max(hi, R[i][j]); }
    lo = Math.floor(lo * 5) / 5; hi = Math.ceil(hi * 5) / 5;
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); }, g = '', xt = '';
    for (var v = lo; v <= hi + 1e-9; v += 0.2) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '</text>';
    for (var yy = parseInt(R[0][0].slice(0, 4), 10) + 1; yy <= parseInt(R[R.length - 1][0].slice(0, 4), 10); yy++) { var xx = X(yy + '-01-01'); xt += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    function line(ix) { var p = '', open = false; for (var k = 0; k < R.length; k++) { if (R[k][ix] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(R[k][0]).toFixed(1) + ' ' + Y(R[k][ix]).toFixed(1); open = true; } return p; }
    var fsel = '<label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select fg-from" aria-label="' + esc(t.from) + '">' + [[2020, t.allH], [2023, '2023'], [2025, '2025']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === st.from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    return { R: R, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.chart) + '</div><div class="wd-sels">' + fsel + '</div><div class="wp-chart fg-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.chart) + '">' + g + xt +
      '<path class="wp-line wp-line-w" d="' + line(4) + '"/><path class="wp-line wp-line-t" d="' + line(3) + '"/><path class="wp-line wp-line-r" d="' + line(1) + '"/><line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="wp-legend"><span><i class="wp-sw wp-sw-r"></i>' + esc(t.lG) + '</span><span><i class="wp-sw wp-sw-t"></i>' + esc(t.lA) + '</span><span><i class="wp-sw wp-sw-w"></i>' + esc(t.lF) + '</span><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' };
  }
  function bindChart(el, c, lg, t) {
    var box = el.querySelector('.fg-chart'); if (!box || !c.R) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.R.length; k++) { var dd = Math.abs(c.X(c.R[k][0]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var x = c.R[b], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(day(x[0], lg)) + '</b> · ' + esc(t.lG) + ' <b>' + eur(x[1], lg) + '</b> · ' + esc(t.lA) + ' ' + eur(x[3], lg) + ' · ' + esc(t.lF) + ' ' + eur(x[4], lg);
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/fr-gnr.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load()]).then(function (a) {
      var d = a[0], MAP = a[1]; if (!d || !d.weekly || !d.weekly.length) return false;
      var t = T[lg], R = d.weekly, n = R.length, x = R[n - 1];
      function back(k) { var r = R[n - 1 - k]; return r ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
      function draw(focus) {
        var c = chart(R, lg, t), S = d.stations, vals = {}, k, mp = '';
        if (S && MAP) {
          for (k in S.departments) if (S.departments.hasOwnProperty(k)) vals[k] = S.departments[k][0];
          var m = M.html(MAP, { values: vals, fmt: function (v, short) { return short ? v.toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : eur(v, lg); }, label: t.map.replace('{d}', day(S.date, lg)), none: t.none });
          mp = '<div class="di-info-card-title gb-sub">' + esc(t.map.replace('{d}', day(S.date, lg))) + '</div><div class="wp-readout fg-tip" aria-live="polite">' + esc(t.mapHint) + '</div>' + m.html;
        }
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-fr-gnr" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.last.replace('{d}', day(x[0], lg)), '<b>' + eur(x[1], lg) + '</b> ' + esc(t.ttc) + ' · ' + eur(x[2], lg) + ' ' + esc(t.htt)) + row(t.gaz, eur(x[3], lg)) + row(t.gap, x[3] != null ? sgn(x[1] - x[3], lg) : '—') + row(t.fod, eur(x[4], lg)) +
          row(t.w, back(1)) + row(t.m, back(4)) + row(t.y, back(52)) + '</div>' + c.html + mp +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>; <a href="' + esc(d.source.stationsUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcB) + '</a> (Licence Ouverte 2.0)<br>' + esc(t.cite) + '</p></section>';
        bindChart(el, c, lg, t);
        if (S && MAP) M.bind(el, el.querySelector('.fg-tip'), t.mapHint, function (id) { var v = S.departments[id], nm = (MAP.states.filter(function (s) { return s.id === id; })[0] || {}).name || id; return '<b>' + esc(nm) + '</b> · ' + (v ? '<b>' + eur(v[0], lg) + '</b> (' + v[1] + ' ' + esc(t.st) + ')' : esc(t.none)); });
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-fg')) { el.setAttribute('data-fg', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('fg-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.fg-from'); } }); }
      return true;
    });
  }
  global.DIFrGNR = { mount: mount };
})(window);
