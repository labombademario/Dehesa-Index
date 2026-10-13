/* Dehesa Index — Portugal: gasóleo semanal (Boletín Petrolero de la UE) y precio de compra del gasóleo por las explotaciones (Eurostat).
   data/pt-diesel.json (scripts/update-pt-diesel.py). Ficha de Portugal. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Gasóleo en Portugal y coste para el agricultor', eu: 'Gasóleo medio en surtidor, semana del {d}', tax: 'con impuestos', notax: 'sin impuestos', w: 'Hace una semana', m: 'Hace cuatro semanas', y: 'Hace un año',
      fa: 'Precio de compra del gasóleo por las explotaciones, {y}', fa2: 'sin IVA deducible', fay: 'Año anterior',
      chE: 'Gasóleo en surtidor, Boletín Petrolero de la UE (semanal)', chF: 'Precio de compra del gasóleo por las explotaciones agrarias (€/l, anual)', from: 'Desde', all: 'Todo', lT: 'Con impuestos', lN: 'Sin impuestos', lF: 'Gasóleo comprado por las explotaciones', hover: 'Pasa el cursor por la gráfica.',
      note: 'Portugal tiene un gasóleo agrícola con impuesto reducido («gasóleo colorido e marcado»), pero su precio no se publica en abierto con una licencia que permita reutilizarlo: la DGEG lo ofrece en su portal de precios con términos que prohíben el uso comercial, así que Dehesa Index no lo usa ni lo estima. Muestra dos series oficiales que sí se pueden reutilizar: el gasóleo de automoción del Boletín Petrolero de la UE (precio medio semanal en surtidor) y el precio anual que pagan las explotaciones agrarias por el gasóleo, de Eurostat. Este último es un precio sin IVA deducible, no el de surtidor.', src: 'Fuentes:', srcA: 'Comisión Europea, Weekly Oil Bulletin', srcB: 'Comisión Europea, Weekly Oil Bulletin', srcC: 'Eurostat' },
    en: { h: 'Diesel in Portugal and what farmers pay', eu: 'Average pump diesel, week of {d}', tax: 'taxes included', notax: 'before taxes', w: 'A week ago', m: 'Four weeks ago', y: 'A year ago',
      fa: 'Price farms pay for diesel, {y}', fa2: 'excluding deductible VAT', fay: 'Previous year',
      chE: 'Pump diesel, EU Weekly Oil Bulletin (weekly)', chF: 'Price farms pay for diesel (€/l, annual)', from: 'From', all: 'All', lT: 'With taxes', lN: 'Before taxes', lF: 'Diesel bought by farms', hover: 'Hover over the chart.',
      note: 'Portugal has a reduced-tax agricultural diesel (“gasóleo colorido e marcado”), but its price is not published openly under a licence that allows reuse: the DGEG offers it on its price portal with terms that forbid commercial use, so Dehesa Index neither uses nor estimates it. It shows two official series that can be reused: road diesel from the EU Weekly Oil Bulletin (weekly average pump price) and the annual price farms pay for diesel, from Eurostat. The latter excludes deductible VAT and is not the pump price.', src: 'Sources:', srcA: 'European Commission, Weekly Oil Bulletin', srcB: 'European Commission, Weekly Oil Bulletin', srcC: 'Eurostat' },
    fr: { h: 'Gazole au Portugal et coût pour l’agriculteur', eu: 'Gazole moyen à la pompe, semaine du {d}', tax: 'TTC', notax: 'hors taxes', w: 'Il y a une semaine', m: 'Il y a quatre semaines', y: 'Il y a un an',
      fa: 'Prix d’achat du gazole par les exploitations, {y}', fa2: 'hors TVA déductible', fay: 'Année précédente',
      chE: 'Gazole à la pompe, Bulletin pétrolier de l’UE (hebdomadaire)', chF: 'Prix d’achat du gazole par les exploitations agricoles (€/l, annuel)', from: 'Depuis', all: 'Tout', lT: 'TTC', lN: 'Hors taxes', lF: 'Gazole acheté par les exploitations', hover: 'Survolez le graphique.',
      note: 'Le Portugal a un gazole agricole à taxation réduite (« gasóleo colorido e marcado »), mais son prix n’est pas publié en open data sous une licence qui permette la réutilisation : la DGEG le propose sur son portail de prix avec des conditions qui interdisent l’usage commercial ; Dehesa Index ne l’utilise donc pas et ne l’estime pas. Il montre deux séries officielles réutilisables : le gazole routier du Bulletin pétrolier de l’UE (prix moyen hebdomadaire à la pompe) et le prix annuel que paient les exploitations agricoles pour le gazole, d’Eurostat. Ce dernier est hors TVA déductible et n’est pas le prix à la pompe.', src: 'Sources :', srcA: 'Commission européenne, Weekly Oil Bulletin', srcB: 'Commission européenne, Weekly Oil Bulletin', srcC: 'Eurostat' },
    it: { h: 'Gasolio in Portogallo e costo per l’agricoltore', eu: 'Gasolio medio alla pompa, settimana del {d}', tax: 'tasse incluse', notax: 'senza tasse', w: 'Una settimana fa', m: 'Quattro settimane fa', y: 'Un anno fa',
      fa: 'Prezzo di acquisto del gasolio da parte delle aziende, {y}', fa2: 'senza IVA detraibile', fay: 'Anno precedente',
      chE: 'Gasolio alla pompa, Bollettino petrolifero UE (settimanale)', chF: 'Prezzo di acquisto del gasolio da parte delle aziende agricole (€/l, annuale)', from: 'Dal', all: 'Tutto', lT: 'Tasse incluse', lN: 'Senza tasse', lF: 'Gasolio acquistato dalle aziende', hover: 'Passa il cursore sul grafico.',
      note: 'Il Portogallo ha un gasolio agricolo a tassazione ridotta («gasóleo colorido e marcado»), ma il suo prezzo non è pubblicato in formato aperto con una licenza che ne consenta il riuso: la DGEG lo offre nel suo portale dei prezzi con condizioni che vietano l’uso commerciale, quindi Dehesa Index non lo usa né lo stima. Mostra due serie ufficiali riutilizzabili: il gasolio stradale del Bollettino petrolifero UE (prezzo medio settimanale alla pompa) e il prezzo annuo che le aziende agricole pagano per il gasolio, di Eurostat. Quest’ultimo è senza IVA detraibile e non è il prezzo alla pompa.', src: 'Fonti:', srcA: 'Commissione europea, Weekly Oil Bulletin', srcB: 'Commissione europea, Weekly Oil Bulletin', srcC: 'Eurostat' }
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
    var fsel = withSel ? '<div class="wd-sels"><label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select pf-from" aria-label="' + esc(t.from) + '">' + [[2005, t.all], [2015, '2015'], [2019, '2019'], [2023, '2023']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === from ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>' : '';
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
  function bars(F, t, lg) {
    var S = F.filter(function (r) { return r[1] != null; }).slice(-20), n = S.length, W = 560, H = 200, L = 34, R = 8, Tp = 10, B = 26, hi = 0, i; if (n < 3) return '';
    for (i = 0; i < n; i++) hi = Math.max(hi, S[i][1]); hi = Math.ceil(hi / 0.5) * 0.5;
    var bw = (W - L - R) / n, Y = function (v) { return Tp + (hi - v) / hi * (H - Tp - B); }, g = '', b = '', v;
    for (v = 0; v <= hi + 1e-9; v += 0.5) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + num(v, lg, 1) + '</text>';
    for (i = 0; i < n; i++) {
      var x = L + i * bw, y = Y(S[i][1]);
      b += '<rect class="bn-bar' + (i === n - 1 ? ' bn-last' : '') + '" x="' + (x + bw * 0.12).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.76).toFixed(1) + '" height="' + (H - B - y).toFixed(1) + '" rx="1.5"><title>' + esc(S[i][0] + ': ' + num(S[i][1], lg, 3) + ' €/l') + '</title></rect>';
      if (i % 2 === (n - 1) % 2) b += '<text class="wp-tick" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + esc(String(S[i][0]).slice(2)) + '</text>';
    }
    return '<div class="di-info-card-title gb-sub">' + esc(t.chF) + '</div><div class="wp-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.chF) + '">' + g + b + '</svg><div class="wp-legend"><span><i class="wp-sw bn-sw"></i>' + esc(t.lF) + '</span></div></div>';
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/pt-diesel.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      if (!d || !d.weekly || !d.weekly.length || !d.farm || !d.farm.length) return false;
      var t = T[lg], R = d.weekly, n = R.length, x = R[n - 1], F = d.farm, f = F[F.length - 1], fp = F[F.length - 2];
      function back(k) { var r = R[n - 1 - k]; return r ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
      function draw(focus) {
        var ec = chart(R, [{ ix: 1, cls: 't', lab: t.lT }, { ix: 2, cls: 'r', lab: t.lN }], st.from, { title: t.chE, cls: 'pt-ech', unit: '€/l', u: '€/l', round: 0.2, dec: 1 }, t, true, lg);
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-pt-diesel" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.eu.replace('{d}', day(x[0], lg)), '<b>' + eur(x[1], lg) + '</b> ' + esc(t.tax) + ' · ' + eur(x[2], lg) + ' ' + esc(t.notax)) + row(t.w, back(1)) + row(t.m, back(4)) + row(t.y, back(52)) +
          row(t.fa.replace('{y}', f[0]), '<b>' + eur(f[1], lg) + '</b> (' + esc(t.fa2) + ')') + (fp ? row(t.fay + ' · ' + fp[0], eur(fp[1], lg) + pct((f[1] / fp[1] - 1) * 100, lg)) : '') + '</div>' +
          ec.html + bars(F, t, lg) +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.wobUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcB) + '</a>; <a href="' + esc(d.source.farmUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcC) + '</a></p></section>';
        bind(el, ec, lg, t);
        if (focus) { var q = el.querySelector(focus); if (q) q.focus(); }
      }
      draw();
      if (!el.getAttribute('data-pf')) { el.setAttribute('data-pf', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('pf-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.pf-from'); } }); }
      return true;
    });
  }
  global.DIPtDiesel = { mount: mount };
})(window);
