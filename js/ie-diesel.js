/* Dehesa Index — Irlanda: gasóleo semanal (Boletín Petrolero de la UE), gasóleo marcado («marked gas oil») despachado cada mes y precio de los combustibles agrarios (CSO).
   data/ie-diesel.json (scripts/update-ie-diesel.py). Ficha de Irlanda. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Gasóleo agrícola en Irlanda («marked gas oil»)', eu: 'Gasóleo medio en surtidor, semana del {d}', tax: 'con impuestos', notax: 'sin impuestos', heat: 'Fioul de calefacción, misma semana', w: 'Hace una semana', m: 'Hace cuatro semanas', y: 'Hace un año',
      mg: 'Gasóleo marcado despachado en {m}', mg2: 'millones de litros', mgy: 'Mismo mes del año anterior', mg12: 'Últimos 12 meses frente a los 12 anteriores', fi: 'Índice del combustible que pagan los agricultores, {m}', fi2: 'base 2020 = 100', fiy: 'Hace un año',
      chE: 'Gasóleo en surtidor, Boletín Petrolero de la UE (semanal)', chM: 'Gasóleo marcado despachado por mes, últimos 3 años', chF: 'Precios de los insumos energéticos agrarios (base 2020 = 100)', from: 'Desde', all: 'Todo', lT: 'Con impuestos', lN: 'Sin impuestos', lH: 'Fioul de calefacción', lM: 'Millones de litros', lF: 'Combustible de motores', lEn: 'Energía', lA: 'Todos los insumos', hover: 'Pasa el cursor por la gráfica.',
      note: 'Irlanda no publica en abierto un precio del gasóleo marcado («marked gas oil» o «green diesel»), el que compran agricultores y otros usuarios autorizados con un impuesto especial reducido, así que Dehesa Index no lo inventa ni lo estima. Muestra tres series oficiales que sí existen: el gasóleo de automoción del Boletín Petrolero de la UE (precio medio observado en el surtidor, no el marcado); los litros de gasóleo marcado que salen cada mes de los depósitos fiscales (datos de Revenue publicados por el CSO), que son volumen y no precio, y que no son solo agrícolas, porque el gasóleo marcado lo usan también otros sectores autorizados; y el índice de precios de insumos agrarios del CSO (combustible de motores, energía y total de insumos).', src: 'Fuentes:', srcA: 'CSO Irlanda, CC BY 4.0', srcB: 'Comisión Europea, Weekly Oil Bulletin' },
    en: { h: 'Farm diesel in Ireland (“marked gas oil”)', eu: 'Average pump diesel, week of {d}', tax: 'taxes included', notax: 'before taxes', heat: 'Heating oil, same week', w: 'A week ago', m: 'Four weeks ago', y: 'A year ago',
      mg: 'Marked gas oil cleared in {m}', mg2: 'million litres', mgy: 'Same month a year earlier', mg12: 'Last 12 months vs the previous 12', fi: 'Index of the fuel farmers pay for, {m}', fi2: 'base 2020 = 100', fiy: 'A year ago',
      chE: 'Pump diesel, EU Weekly Oil Bulletin (weekly)', chM: 'Marked gas oil cleared per month, last 3 years', chF: 'Farm energy input prices (base 2020 = 100)', from: 'From', all: 'All', lT: 'With taxes', lN: 'Before taxes', lH: 'Heating oil', lM: 'Million litres', lF: 'Motor fuel', lEn: 'Energy', lA: 'All inputs', hover: 'Hover over the chart.',
      note: 'Ireland does not publish an open price for marked gas oil (“green diesel”), the fuel bought by farmers and other authorised users at a reduced excise rate, so Dehesa Index neither makes one up nor estimates it. It shows three official series that do exist: road diesel from the EU Weekly Oil Bulletin (average observed pump price, not the marked fuel); the litres of marked gas oil released each month from bonded stores (Revenue data published by the CSO), which are volume rather than price and not only agricultural, since other authorised sectors use marked gas oil too; and the CSO’s agricultural input price index (motor fuel, energy and all inputs).', src: 'Sources:', srcA: 'CSO Ireland, CC BY 4.0', srcB: 'European Commission, Weekly Oil Bulletin' },
    fr: { h: 'Gazole agricole en Irlande (« marked gas oil »)', eu: 'Gazole moyen à la pompe, semaine du {d}', tax: 'TTC', notax: 'hors taxes', heat: 'Fioul domestique, même semaine', w: 'Il y a une semaine', m: 'Il y a quatre semaines', y: 'Il y a un an',
      mg: 'Gazole marqué livré en {m}', mg2: 'millions de litres', mgy: 'Même mois un an plus tôt', mg12: '12 derniers mois contre les 12 précédents', fi: 'Indice du carburant payé par les agriculteurs, {m}', fi2: 'base 2020 = 100', fiy: 'Il y a un an',
      chE: 'Gazole à la pompe, Bulletin pétrolier de l’UE (hebdomadaire)', chM: 'Gazole marqué livré par mois, 3 dernières années', chF: 'Prix des intrants énergétiques agricoles (base 2020 = 100)', from: 'Depuis', all: 'Tout', lT: 'TTC', lN: 'Hors taxes', lH: 'Fioul domestique', lM: 'Millions de litres', lF: 'Carburant moteurs', lEn: 'Énergie', lA: 'Tous les intrants', hover: 'Survolez le graphique.',
      note: 'L’Irlande ne publie pas en open data de prix du gazole marqué (« marked gas oil » ou « green diesel »), celui qu’achètent agriculteurs et autres utilisateurs autorisés avec une accise réduite ; Dehesa Index ne l’invente donc pas et ne l’estime pas. Il montre trois séries officielles qui existent : le gazole routier du Bulletin pétrolier de l’UE (prix moyen observé à la pompe, pas le marqué) ; les litres de gazole marqué sortis chaque mois des entrepôts fiscaux (données de Revenue publiées par le CSO), qui sont un volume et non un prix, et pas uniquement agricoles, d’autres secteurs autorisés en utilisant aussi ; et l’indice des prix des intrants agricoles du CSO (carburant moteurs, énergie et ensemble des intrants).', src: 'Sources :', srcA: 'CSO Irlande, CC BY 4.0', srcB: 'Commission européenne, Weekly Oil Bulletin' },
    it: { h: 'Gasolio agricolo in Irlanda («marked gas oil»)', eu: 'Gasolio medio alla pompa, settimana del {d}', tax: 'tasse incluse', notax: 'senza tasse', heat: 'Gasolio da riscaldamento, stessa settimana', w: 'Una settimana fa', m: 'Quattro settimane fa', y: 'Un anno fa',
      mg: 'Gasolio marcato immesso in consumo a {m}', mg2: 'milioni di litri', mgy: 'Stesso mese dell’anno prima', mg12: 'Ultimi 12 mesi contro i 12 precedenti', fi: 'Indice del carburante pagato dagli agricoltori, {m}', fi2: 'base 2020 = 100', fiy: 'Un anno fa',
      chE: 'Gasolio alla pompa, Bollettino petrolifero UE (settimanale)', chM: 'Gasolio marcato immesso in consumo al mese, ultimi 3 anni', chF: 'Prezzi degli input energetici agricoli (base 2020 = 100)', from: 'Dal', all: 'Tutto', lT: 'Tasse incluse', lN: 'Senza tasse', lH: 'Gasolio da riscaldamento', lM: 'Milioni di litri', lF: 'Carburante per motori', lEn: 'Energia', lA: 'Tutti gli input', hover: 'Passa il cursore sul grafico.',
      note: 'L’Irlanda non pubblica in formato aperto un prezzo del gasolio marcato («marked gas oil» o «green diesel»), quello acquistato da agricoltori e altri utenti autorizzati con un’accisa ridotta; Dehesa Index non lo inventa né lo stima. Mostra tre serie ufficiali che esistono: il gasolio stradale del Bollettino petrolifero UE (prezzo medio osservato alla pompa, non il marcato); i litri di gasolio marcato usciti ogni mese dai depositi fiscali (dati di Revenue pubblicati dal CSO), che sono volume e non prezzo, e non solo agricoli, perché lo usano anche altri settori autorizzati; e l’indice dei prezzi degli input agricoli del CSO (carburante per motori, energia e totale input).', src: 'Fonti:', srcA: 'CSO Irlanda, CC BY 4.0', srcB: 'Commissione europea, Weekly Oil Bulletin' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, st = { from: 2019 };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function num(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function eur(v, lg) { return v == null ? '—' : num(v, lg, 3) + ' €/l'; }
  function sgn(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), lg, 3) + ' €/l'; }
  function pct(v, lg) { return ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), lg, 1) + ' %)'; }
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function mon(m, lg) { return new Date(m + '-15T12:00:00Z').toLocaleDateString(LOC[lg], { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  // Gráfica de líneas: R = filas [fecha, v1, v2…]; S = [{ix, cls, lab}]; cid = {title, cls, unit, step, dec}
  function chart(R, S, from, cid, t, withSel, lg) {
    R = R.filter(function (r) { return parseInt(r[0].slice(0, 4), 10) >= from; }); if (R.length < 2) return { html: '' };
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, t0 = Date.parse(R[0][0]), t1 = Date.parse(R[R.length - 1][0]), lo = 1e9, hi = 0, i, j, q = cid.round;
    for (i = 0; i < R.length; i++) for (j = 0; j < S.length; j++) { var v0 = R[i][S[j].ix]; if (v0 != null) { lo = Math.min(lo, v0); hi = Math.max(hi, v0); } }
    lo = Math.floor(lo / q) * q; hi = Math.ceil(hi / q) * q; var step = (hi - lo) / q > 8 ? q * 2 : q;
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); }, g = '', xt = '', v;
    for (v = lo; v <= hi + 1e-9; v += step) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + num(v, lg, cid.dec) + '</text>';
    var y0 = parseInt(R[0][0].slice(0, 4), 10), y1 = parseInt(R[R.length - 1][0].slice(0, 4), 10), ev = y1 - y0 > 12 ? 4 : y1 - y0 > 5 ? 2 : 1;
    for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) { var xx = X(yy + '-01-01'); xt += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    function line(ix) { var p = '', open = false; for (var k = 0; k < R.length; k++) { if (R[k][ix] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(R[k][0]).toFixed(1) + ' ' + Y(R[k][ix]).toFixed(1); open = true; } return p; }
    var fsel = withSel ? '<div class="wd-sels"><label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select pf-from" data-chips aria-label="' + esc(t.from) + '">' + [[2005, t.all], [2015, '2015'], [2019, '2019'], [2023, '2023']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === from ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>' : '';
    return { R: R, X: X, W: W, S: S, cls: cid.cls, dec: cid.dec, unit: cid.u, html: '<div class="di-info-card-title gb-sub">' + esc(cid.title) + '</div>' + fsel + '<div class="wp-chart ' + cid.cls + '"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(cid.title) + '">' + g + xt +
      S.slice().reverse().map(function (s) { return '<path class="wp-line wp-line-' + s.cls + '" d="' + line(s.ix) + '"/>'; }).join('') +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg><div class="wp-legend">' + S.map(function (s) { return '<span><i class="wp-sw wp-sw-' + s.cls + '"></i>' + esc(s.lab) + '</span>'; }).join('') + '<span class="wp-unit">' + esc(cid.unit) + '</span></div></div>' };
  }
  function bind(el, c, lg, t) {
    if (!c.R) return; var box = el.querySelector('.' + c.cls); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.R.length; k++) { var dd = Math.abs(c.X(c.R[k][0]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var x = c.R[b], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(x[0].length > 7 ? day(x[0], lg) : mon(x[0].slice(0, 7), lg)) + '</b>' + c.S.map(function (s, i) { return ' · ' + esc(s.lab) + ' ' + (i ? '' : '<b>') + (c.unit ? num(x[s.ix], lg, c.dec) + ' ' + c.unit : num(x[s.ix], lg, c.dec)) + (i ? '' : '</b>'); }).join('');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  function bars(C, t, lg) {
    var S = C.slice(-36), n = S.length, W = 560, H = 200, L = 34, R = 8, Tp = 10, B = 26, hi = 0, i; if (n < 12) return '';
    for (i = 0; i < n; i++) hi = Math.max(hi, S[i][3]); hi = Math.ceil(hi / 20) * 20;
    var bw = (W - L - R) / n, Y = function (v) { return Tp + (hi - v) / hi * (H - Tp - B); }, g = '', b = '', v;
    for (v = 0; v <= hi; v += 20) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    for (i = 0; i < n; i++) {
      var x = L + i * bw, y = Y(S[i][3]);
      b += '<rect class="bn-bar' + (i === n - 1 ? ' bn-last' : '') + '" x="' + (x + bw * 0.12).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.76).toFixed(1) + '" height="' + (H - B - y).toFixed(1) + '" rx="1.5"><title>' + esc(mon(S[i][0], lg) + ': ' + num(S[i][3], lg, 0) + ' ' + t.mg2) + '</title></rect>';
      if (S[i][0].slice(5) === '01' || i === n - 1) b += '<text class="wp-tick" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + esc(S[i][0].slice(2, 4) + '/' + S[i][0].slice(5)) + '</text>';
    }
    return '<div class="di-info-card-title gb-sub">' + esc(t.chM) + '</div><div class="wp-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.chM) + '">' + g + b + '</svg><div class="wp-legend"><span><i class="wp-sw bn-sw"></i>' + esc(t.lM) + '</span></div></div>';
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/ie-diesel.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      if (!d || !d.weekly || !d.weekly.length || !d.clearance || !d.clearance.length || !d.prices || !d.prices.length) return false;
      var t = T[lg], R = d.weekly, n = R.length, x = R[n - 1], C = d.clearance, cn = C.length, c = C[cn - 1], P = d.prices, pn = P.length, p = P[pn - 1], i;
      function back(k) { var r = R[n - 1 - k]; return r ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
      var cy = C[cn - 13], s12 = 0, p12 = 0; for (i = 0; i < 12; i++) { s12 += C[cn - 1 - i][3]; if (C[cn - 13 - i]) p12 += C[cn - 13 - i][3]; }
      var py = P[pn - 13];
      function draw(focus) {
        var ec = chart(R, [{ ix: 1, cls: 't', lab: t.lT }, { ix: 2, cls: 'r', lab: t.lN }, { ix: 3, cls: 'w', lab: t.lH }], st.from, { title: t.chE, cls: 'ie-ech', unit: '€/l', u: '€/l', round: 0.2, dec: 1 }, t, true, lg);
        var fc = chart(P, [{ ix: 1, cls: 't', lab: t.lF }, { ix: 2, cls: 'r', lab: t.lEn }, { ix: 3, cls: 'w', lab: t.lA }], 2020, { title: t.chF, cls: 'ie-fch', unit: t.fi2, u: '', round: 20, dec: 0 }, t, false, lg);
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-ie-diesel" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.eu.replace('{d}', day(x[0], lg)), '<b>' + eur(x[1], lg) + '</b> ' + esc(t.tax) + ' · ' + eur(x[2], lg) + ' ' + esc(t.notax)) + row(t.heat, eur(x[3], lg)) + row(t.w, back(1)) + row(t.m, back(4)) + row(t.y, back(52)) +
          row(t.mg.replace('{m}', mon(c[0], lg)), '<b>' + num(c[3], lg, 0) + '</b> ' + esc(t.mg2)) + (cy ? row(t.mgy, num(cy[3], lg, 0) + pct((c[3] / cy[3] - 1) * 100, lg)) : '') + (p12 ? row(t.mg12, num(s12, lg, 0) + ' · ' + num(p12, lg, 0) + pct((s12 / p12 - 1) * 100, lg)) : '') +
          row(t.fi.replace('{m}', mon(p[0], lg)), '<b>' + num(p[1], lg, 1) + '</b> (' + esc(t.fi2) + ')') + (py ? row(t.fiy, num(py[1], lg, 1) + pct((p[1] / py[1] - 1) * 100, lg)) : '') + '</div>' +
          ec.html + bars(C, t, lg) + fc.html +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>; <a href="' + esc(d.source.wobUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcB) + '</a></p></section>';
        bind(el, ec, lg, t); bind(el, fc, lg, t);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-pf')) { el.setAttribute('data-pf', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('pf-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.pf-from'); } }); }
      return true;
    });
  }
  global.DIIeDiesel = { mount: mount };
})(window);
