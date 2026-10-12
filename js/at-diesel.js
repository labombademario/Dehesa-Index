/* Dehesa Index — Austria: gasóleo y fioul de calefacción (Boletín Petrolero de la UE, semanal desde 2005) y coste aproximado del gasóleo para
   una explotación con la devolución «Agrardieselrückvergütung». data/at-diesel.json (scripts/update-at-diesel.py). Ficha de Austria. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Gasóleo agrícola en Austria (devolución «Agrardiesel»)', last: 'Gasóleo en surtidor, semana del {d}', tax: 'con impuestos', notax: 'sin impuestos', heat: 'Fioul de calefacción, misma semana', ref: 'Devolución por litro en {y}', prov: 'provisional, pendiente del reglamento', fin: 'definitiva', lim: 'Litros a tanto alzado', lim2: '{a} l/ha en tierra arable, {b} l/ha en viña y frutales, {c} l/ha en prados de 2 o más cortes', cN: 'Coste en régimen general de IVA', cN2: 'sin IVA (20 %) y descontada la devolución', cF: 'Coste en régimen a tanto alzado', cF2: 'con IVA (no se recupera) y descontada la devolución', w: 'Hace una semana', m: 'Hace cuatro semanas', y: 'Hace un año', chart: 'Precios semanales (en euros)', from: 'Desde', all: 'Todo (2005)', hover: 'Pasa el cursor o toca el gráfico para ver cada semana.', lD: 'Gasóleo con impuestos', lN: 'Gasóleo sin impuestos', lH: 'Fioul de calefacción', unit: '€/l',
      note: 'En Austria no hay un gasóleo agrícola aparte: el agricultor reposta gasóleo normal y el Estado le devuelve una cantidad fija por litro, calculada con un consumo a tanto alzado por hectárea según el tipo de cultivo (no con las facturas). La AMA la paga en diciembre junto con las ayudas. Entre 2023 y 2025 fueron 7 céntimos por litro; para 2026 y 2027 la AMA prevé unos 15,5 céntimos, a falta del reglamento definitivo. La mayoría de las explotaciones austriacas tributan en el régimen de IVA a tanto alzado y no recuperan el IVA, por eso se dan los dos costes. Precios medios nacionales del Boletín Petrolero de la UE; los cálculos son de Dehesa Index.', src: 'Fuente:', srcA: 'Comisión Europea, Weekly Oil Bulletin', srcB: 'AMA, hoja informativa de la devolución' },
    en: { h: 'Farm diesel in Austria (“Agrardiesel” refund)', last: 'Pump diesel, week of {d}', tax: 'taxes included', notax: 'before taxes', heat: 'Heating oil, same week', ref: 'Refund per litre in {y}', prov: 'provisional, awaiting the regulation', fin: 'final', lim: 'Flat-rate litres', lim2: '{a} l/ha on arable land, {b} l/ha in vineyards and orchards, {c} l/ha on meadows cut twice or more', cN: 'Cost under standard VAT', cN2: 'net of VAT (20 %) and the refund', cF: 'Cost under the flat-rate scheme', cF2: 'VAT included (not recovered), net of the refund', w: 'A week ago', m: 'Four weeks ago', y: 'A year ago', chart: 'Weekly prices (in euros)', from: 'From', all: 'All (2005)', hover: 'Hover or tap the chart to read each week.', lD: 'Diesel, taxes included', lN: 'Diesel before taxes', lH: 'Heating oil', unit: '€/l',
      note: 'Austria has no separate farm diesel: farmers fill up with ordinary diesel and the state pays back a fixed amount per litre, based on a flat-rate consumption per hectare by crop type (not on invoices). The AMA pays it in December together with the farm payments. It was 7 cents per litre from 2023 to 2025; for 2026 and 2027 the AMA expects about 15.5 cents, pending the final regulation. Most Austrian farms use the flat-rate VAT scheme and do not recover VAT, so both costs are shown. National average prices from the EU Weekly Oil Bulletin; calculations by Dehesa Index.', src: 'Source:', srcA: 'European Commission, Weekly Oil Bulletin', srcB: 'AMA, refund information sheet' },
    fr: { h: 'Gazole agricole en Autriche (remboursement « Agrardiesel »)', last: 'Gazole à la pompe, semaine du {d}', tax: 'TTC', notax: 'hors taxes', heat: 'Fioul domestique, même semaine', ref: 'Remboursement par litre en {y}', prov: 'provisoire, en attente du règlement', fin: 'définitif', lim: 'Litres forfaitaires', lim2: '{a} l/ha en terres arables, {b} l/ha en vignes et vergers, {c} l/ha en prairies fauchées deux fois ou plus', cN: 'Coût au régime normal de TVA', cN2: 'hors TVA (20 %) et remboursement déduit', cF: 'Coût au régime forfaitaire', cF2: 'TVA comprise (non récupérée), remboursement déduit', w: 'Il y a une semaine', m: 'Il y a quatre semaines', y: 'Il y a un an', chart: 'Prix hebdomadaires (en euros)', from: 'Depuis', all: 'Tout (2005)', hover: 'Survolez ou touchez le graphique pour lire chaque semaine.', lD: 'Gazole TTC', lN: 'Gazole hors taxes', lH: 'Fioul domestique', unit: '€/l',
      note: 'L’Autriche n’a pas de gazole agricole distinct : l’agriculteur fait le plein de gazole ordinaire et l’État lui rembourse un montant fixe par litre, calculé sur une consommation forfaitaire par hectare selon le type de culture (pas sur factures). L’AMA le verse en décembre avec les aides. Il était de 7 centimes par litre de 2023 à 2025 ; pour 2026 et 2027 l’AMA prévoit environ 15,5 centimes, en attendant le règlement définitif. La plupart des exploitations autrichiennes relèvent du régime forfaitaire de TVA et ne la récupèrent pas, d’où les deux coûts. Prix moyens nationaux du Bulletin pétrolier de l’UE ; calculs de Dehesa Index.', src: 'Source :', srcA: 'Commission européenne, Bulletin pétrolier hebdomadaire', srcB: 'AMA, fiche d’information sur le remboursement' },
    it: { h: 'Gasolio agricolo in Austria (rimborso «Agrardiesel»)', last: 'Gasolio alla pompa, settimana del {d}', tax: 'tasse incluse', notax: 'senza tasse', heat: 'Gasolio da riscaldamento, stessa settimana', ref: 'Rimborso al litro nel {y}', prov: 'provvisorio, in attesa del regolamento', fin: 'definitivo', lim: 'Litri forfettari', lim2: '{a} l/ha su seminativi, {b} l/ha in vigneti e frutteti, {c} l/ha su prati con due o più sfalci', cN: 'Costo in regime IVA ordinario', cN2: 'senza IVA (20 %) e al netto del rimborso', cF: 'Costo in regime forfettario', cF2: 'IVA inclusa (non recuperata), al netto del rimborso', w: 'Una settimana fa', m: 'Quattro settimane fa', y: 'Un anno fa', chart: 'Prezzi settimanali (in euro)', from: 'Dal', all: 'Tutto (2005)', hover: 'Passa il cursore o tocca il grafico per leggere ogni settimana.', lD: 'Gasolio con tasse', lN: 'Gasolio senza tasse', lH: 'Gasolio da riscaldamento', unit: '€/l',
      note: 'In Austria non esiste un gasolio agricolo a parte: l’agricoltore fa rifornimento di gasolio normale e lo Stato gli rimborsa un importo fisso al litro, calcolato su un consumo forfettario per ettaro secondo il tipo di coltura (non sulle fatture). L’AMA lo paga a dicembre insieme agli aiuti. Dal 2023 al 2025 era di 7 centesimi al litro; per il 2026 e il 2027 l’AMA prevede circa 15,5 centesimi, in attesa del regolamento definitivo. La maggior parte delle aziende austriache applica il regime IVA forfettario e non recupera l’IVA, per questo si mostrano entrambi i costi. Prezzi medi nazionali del Bollettino petrolifero dell’UE; calcoli di Dehesa Index.', src: 'Fonte:', srcA: 'Commissione europea, Weekly Oil Bulletin', srcB: 'AMA, scheda informativa sul rimborso' }
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
    var fsel = '<label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select pf-from" aria-label="' + esc(t.from) + '">' + [[2005, t.all], [2015, '2015'], [2019, '2019'], [2023, '2023']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === st.from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    return { R: R, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.chart) + '</div><div class="wd-sels">' + fsel + '</div><div class="wp-chart pf-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.chart) + '">' + g + xt +
      '<path class="wp-line wp-line-w" d="' + line(3) + '"/><path class="wp-line wp-line-r" d="' + line(2) + '"/><path class="wp-line wp-line-t" d="' + line(1) + '"/><line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="wp-legend"><span><i class="wp-sw wp-sw-t"></i>' + esc(t.lD) + '</span><span><i class="wp-sw wp-sw-r"></i>' + esc(t.lN) + '</span><span><i class="wp-sw wp-sw-w"></i>' + esc(t.lH) + '</span><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' };
  }
  function bind(el, c, lg, t) {
    var box = el.querySelector('.pf-chart'); if (!box || !c.R) return;
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
    CACHE = CACHE || fetch('data/at-diesel.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      if (!d || !d.weekly || !d.weekly.length) return false;
      var t = T[lg], R = d.weekly, n = R.length, x = R[n - 1], A = d.refund;
      function back(k) { var r = R[n - 1 - k]; return r ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
      function draw(focus) {
        var c = chart(R, lg, t);
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-at-diesel" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.last.replace('{d}', day(x[0], lg)), '<b>' + eur(x[1], lg) + '</b> ' + esc(t.tax) + ' · ' + eur(x[2], lg) + ' ' + esc(t.notax)) +
          (A ? row(t.ref.replace('{y}', A.year), '<b>' + eur(A.eurPerLitre, lg) + '</b> · ' + esc(A.provisional ? t.prov : t.fin)) + (A.litresPerHa ? row(t.lim, esc(t.lim2.replace('{a}', A.litresPerHa.arable).replace('{b}', A.litresPerHa.permanentCrops).replace('{c}', A.litresPerHa.meadows2plus))) : '') +
            row(t.cN, '<b>' + eur(d.farmCostNet, lg) + '</b> · ' + esc(t.cN2)) + row(t.cF, '<b>' + eur(d.farmCostFlat, lg) + '</b> · ' + esc(t.cF2)) : '') +
          row(t.heat, eur(x[3], lg)) + row(t.w, back(1)) + row(t.m, back(4)) + row(t.y, back(52)) + '</div>' + c.html +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>' + (A ? '; <a href="' + esc(A.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcB) + '</a>' : '') + '</p></section>';
        bind(el, c, lg, t);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-pf')) { el.setAttribute('data-pf', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('pf-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.pf-from'); } }); }
      return true;
    });
  }
  global.DIAtDiesel = { mount: mount };
})(window);
