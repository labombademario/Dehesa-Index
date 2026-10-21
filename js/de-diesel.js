/* Dehesa Index — Alemania: gasóleo y fioul de calefacción (Boletín Petrolero de la UE, semanal desde 2005) y coste aproximado del gasóleo para
   una explotación con la devolución «Agrardiesel» que publica la aduana. data/de-diesel.json (scripts/update-de-diesel.py). Ficha de Alemania. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Gasóleo agrícola en Alemania (Agrardiesel)', last: 'Gasóleo en surtidor, semana del {d}', tax: 'con impuestos', notax: 'sin impuestos', heat: 'Fioul de calefacción, misma semana', ref: 'Devolución Agrardiesel (aduana)', ref2: 'por litro', cost: 'Coste aproximado para la explotación', cost2: 'sin IVA y descontada la devolución', w: 'Hace una semana', m: 'Hace cuatro semanas', y: 'Hace un año', chart: 'Precios semanales', from: 'Desde', all: 'Todo (2005)', hover: 'Pasa el cursor o toca el gráfico para ver cada semana.', lD: 'Gasóleo con impuestos', lN: 'Gasóleo sin impuestos', lH: 'Fioul de calefacción', unit: '€/l', noRef: 'La página de la aduana no dio el importe de la devolución en la última lectura.',
      note: 'En Alemania no hay un gasóleo agrícola aparte: las explotaciones agrarias y forestales repostan gasóleo normal y piden después a la aduana la devolución de una parte del impuesto (§ 57 de la ley del impuesto sobre la energía). El coste aproximado resta el IVA, que recuperan las explotaciones en régimen general, y esa devolución; lo calcula Dehesa Index y no incluye descuentos por volumen ni entregas a granel. Precios medios nacionales del Boletín Petrolero de la UE.', src: 'Fuente:', srcA: 'Comisión Europea, Weekly Oil Bulletin', srcB: 'aduana alemana (Zoll), devolución para la agricultura' },
    en: { h: 'Farm diesel in Germany (Agrardiesel)', last: 'Pump diesel, week of {d}', tax: 'taxes included', notax: 'before taxes', heat: 'Heating oil, same week', ref: 'Agrardiesel refund (customs)', ref2: 'per litre', cost: 'Approximate cost for a farm', cost2: 'net of VAT and the refund', w: 'A week ago', m: 'Four weeks ago', y: 'A year ago', chart: 'Weekly prices', from: 'From', all: 'All (2005)', hover: 'Hover or tap the chart to read each week.', lD: 'Diesel, taxes included', lN: 'Diesel before taxes', lH: 'Heating oil', unit: '€/l', noRef: 'The customs page did not give the refund rate at the last reading.',
      note: 'Germany has no separate farm diesel: farms and forestry businesses fill up with ordinary diesel and then claim part of the duty back from customs (section 57 of the Energy Tax Act). The approximate cost removes VAT, which farms under the standard regime recover, and that refund; it is calculated by Dehesa Index and does not include volume discounts or bulk deliveries. National average prices from the EU Weekly Oil Bulletin.', src: 'Source:', srcA: 'European Commission, Weekly Oil Bulletin', srcB: 'German customs (Zoll), refund for agriculture' },
    fr: { h: 'Gazole agricole en Allemagne (Agrardiesel)', last: 'Gazole à la pompe, semaine du {d}', tax: 'TTC', notax: 'hors taxes', heat: 'Fioul domestique, même semaine', ref: 'Remboursement Agrardiesel (douane)', ref2: 'par litre', cost: 'Coût approximatif pour l’exploitation', cost2: 'hors TVA et remboursement déduit', w: 'Il y a une semaine', m: 'Il y a quatre semaines', y: 'Il y a un an', chart: 'Prix hebdomadaires', from: 'Depuis', all: 'Tout (2005)', hover: 'Survolez ou touchez le graphique pour lire chaque semaine.', lD: 'Gazole TTC', lN: 'Gazole hors taxes', lH: 'Fioul domestique', unit: '€/l', noRef: 'La page de la douane n’a pas donné le montant du remboursement lors de la dernière lecture.',
      note: 'L’Allemagne n’a pas de gazole agricole distinct : les exploitations agricoles et forestières font le plein de gazole ordinaire puis demandent à la douane le remboursement d’une partie de l’accise (§ 57 de la loi sur la taxation de l’énergie). Le coût approximatif retire la TVA, récupérée par les exploitations au régime normal, et ce remboursement ; il est calculé par Dehesa Index et n’inclut ni remises de volume ni livraisons en vrac. Prix moyens nationaux du Bulletin pétrolier de l’UE.', src: 'Source :', srcA: 'Commission européenne, Bulletin pétrolier hebdomadaire', srcB: 'douane allemande (Zoll), remboursement agricole' },
    it: { h: 'Gasolio agricolo in Germania (Agrardiesel)', last: 'Gasolio alla pompa, settimana del {d}', tax: 'tasse incluse', notax: 'senza tasse', heat: 'Gasolio da riscaldamento, stessa settimana', ref: 'Rimborso Agrardiesel (dogana)', ref2: 'al litro', cost: 'Costo approssimativo per l’azienda', cost2: 'senza IVA e al netto del rimborso', w: 'Una settimana fa', m: 'Quattro settimane fa', y: 'Un anno fa', chart: 'Prezzi settimanali', from: 'Dal', all: 'Tutto (2005)', hover: 'Passa il cursore o tocca il grafico per leggere ogni settimana.', lD: 'Gasolio con tasse', lN: 'Gasolio senza tasse', lH: 'Gasolio da riscaldamento', unit: '€/l', noRef: 'La pagina della dogana non ha dato l’importo del rimborso nell’ultima lettura.',
      note: 'In Germania non esiste un gasolio agricolo a parte: le aziende agricole e forestali fanno rifornimento di gasolio normale e poi chiedono alla dogana il rimborso di una parte dell’accisa (§ 57 della legge sull’imposta sull’energia). Il costo approssimativo toglie l’IVA, che le aziende in regime ordinario recuperano, e quel rimborso; è calcolato da Dehesa Index e non include sconti di volume né consegne sfuse. Prezzi medi nazionali del Bollettino petrolifero dell’UE.', src: 'Fonte:', srcA: 'Commissione europea, Weekly Oil Bulletin', srcB: 'dogana tedesca (Zoll), rimborso per l’agricoltura' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, st = { from: 2019 };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function eur(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function sgn(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function pct(v, lg) { return ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %)'; }
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function chart(R, lg, t) {
    R = R.filter(function (r) { return parseInt(r[0].slice(0, 4), 10) >= st.from; }); if (R.length < 2) return { html: '' };
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, t0 = Date.parse(R[0][0]), t1 = Date.parse(R[R.length - 1][0]), lo = 1e9, hi = 0, i, j;
    for (i = 0; i < R.length; i++) for (j = 1; j < 4; j++) if (R[i][j] != null) { lo = Math.min(lo, R[i][j]); hi = Math.max(hi, R[i][j]); }
    lo = Math.floor(lo * 5) / 5; hi = Math.ceil(hi * 5) / 5; var step = hi - lo > 1.6 ? 0.4 : 0.2;
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); }, g = '', xt = '';
    for (var v = lo; v <= hi + 1e-9; v += step) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '</text>';
    var y0 = parseInt(R[0][0].slice(0, 4), 10), y1 = parseInt(R[R.length - 1][0].slice(0, 4), 10), ev = y1 - y0 > 12 ? 4 : y1 - y0 > 5 ? 2 : 1;
    for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) { var xx = X(yy + '-01-01'); xt += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    function line(ix) { var p = '', open = false; for (var k = 0; k < R.length; k++) { if (R[k][ix] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(R[k][0]).toFixed(1) + ' ' + Y(R[k][ix]).toFixed(1); open = true; } return p; }
    var fsel = '<label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select dd-from" data-chips aria-label="' + esc(t.from) + '">' + [[2005, t.all], [2015, '2015'], [2019, '2019'], [2023, '2023']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === st.from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    return { R: R, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.chart) + '</div><div class="wd-sels">' + fsel + '</div><div class="wp-chart dd-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.chart) + '">' + g + xt +
      '<path class="wp-line wp-line-w" d="' + line(3) + '"/><path class="wp-line wp-line-r" d="' + line(2) + '"/><path class="wp-line wp-line-t" d="' + line(1) + '"/><line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="wp-legend"><span><i class="wp-sw wp-sw-t"></i>' + esc(t.lD) + '</span><span><i class="wp-sw wp-sw-r"></i>' + esc(t.lN) + '</span><span><i class="wp-sw wp-sw-w"></i>' + esc(t.lH) + '</span><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' };
  }
  function bind(el, c, lg, t) {
    var box = el.querySelector('.dd-chart'); if (!box || !c.R) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.R.length; k++) { var dd = Math.abs(c.X(c.R[k][0]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var x = c.R[b], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(day(x[0], lg)) + '</b> · ' + esc(t.lD) + ' <b>' + eur(x[1], lg) + '</b> · ' + esc(t.lN) + ' ' + eur(x[2], lg) + ' · ' + esc(t.lH) + ' ' + eur(x[3], lg);
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/de-diesel.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      if (!d || !d.weekly || !d.weekly.length) return false;
      var t = T[lg], R = d.weekly, n = R.length, x = R[n - 1], A = d.agrardiesel;
      function back(k) { var r = R[n - 1 - k]; return r ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
      function draw(focus) {
        var c = chart(R, lg, t);
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-de-diesel" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.last.replace('{d}', day(x[0], lg)), '<b>' + eur(x[1], lg) + '</b> ' + esc(t.tax) + ' · ' + eur(x[2], lg) + ' ' + esc(t.notax)) +
          (A ? row(t.ref, '<b>' + eur(A.eurPerLitre, lg) + '</b> ' + esc(t.ref2)) + row(t.cost, '<b>' + eur(d.farmCost, lg) + '</b> · ' + esc(t.cost2)) : '') +
          row(t.heat, eur(x[3], lg)) + row(t.w, back(1)) + row(t.m, back(4)) + row(t.y, back(52)) + '</div>' + (A ? '' : '<p class="di-field-hint">' + esc(t.noRef) + '</p>') + c.html +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>' + (A ? '; <a href="' + esc(A.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcB) + '</a>' : '') + '</p></section>';
        bind(el, c, lg, t);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-dd')) { el.setAttribute('data-dd', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('dd-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.dd-from'); } }); }
      return true;
    });
  }
  global.DIDeDiesel = { mount: mount };
})(window);
