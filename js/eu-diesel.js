/* Dehesa Index — Gasóleo semanal en 16 países de la UE sin bloque propio (Boletín Petrolero de la Comisión Europea).
   data/views/diesel-eu/<CC>.json (scripts/update-eu-diesel-more.py + build-views.py). Ficha de país. ES5. */
(function (global) {
  'use strict';
  var NM = {
    EL: ['Grecia', 'Greece', 'Grèce', 'Grecia'], BG: ['Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'], CY: ['Chipre', 'Cyprus', 'Chypre', 'Cipro'], CZ: ['Chequia', 'Czechia', 'Tchéquie', 'Cechia'],
    DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca'], EE: ['Estonia', 'Estonia', 'Estonie', 'Estonia'], FI: ['Finlandia', 'Finland', 'Finlande', 'Finlandia'], HU: ['Hungría', 'Hungary', 'Hongrie', 'Ungheria'],
    LT: ['Lituania', 'Lithuania', 'Lituanie', 'Lituania'], LU: ['Luxemburgo', 'Luxembourg', 'Luxembourg', 'Lussemburgo'], LV: ['Letonia', 'Latvia', 'Lettonie', 'Lettonia'], MT: ['Malta', 'Malta', 'Malte', 'Malta'],
    RO: ['Rumanía', 'Romania', 'Roumanie', 'Romania'], SE: ['Suecia', 'Sweden', 'Suède', 'Svezia'], SI: ['Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia'], SK: ['Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia']
  };
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var T = {
    es: { h: 'Gasóleo en {n}', eu: 'Gasóleo medio en surtidor, semana del {d}', tax: 'con impuestos', notax: 'sin impuestos', w: 'Hace una semana', m: 'Hace cuatro semanas', y: 'Hace un año', sh: 'Impuestos en el precio', ch: 'Gasóleo en surtidor, Boletín Petrolero de la UE (semanal)', from: 'Desde', all: 'Todo', lT: 'Con impuestos', lN: 'Sin impuestos', hover: 'Pasa el cursor por la gráfica.',
      note: 'Gasóleo de automoción: precio medio que cada Estado miembro comunica a la Comisión. No es el gasóleo agrícola, que en muchos países tiene un impuesto reducido y no se publica en abierto en esta fuente. Las comparaciones entre países tienen validez limitada por diferencias de calidad y de mercado. «Impuestos en el precio» es la diferencia entre el precio con y sin impuestos, dividida por el precio con impuestos.', src: 'Fuente:', srcA: 'Comisión Europea, Weekly Oil Bulletin' },
    en: { h: 'Diesel in {n}', eu: 'Average pump diesel, week of {d}', tax: 'taxes included', notax: 'before taxes', w: 'A week ago', m: 'Four weeks ago', y: 'A year ago', sh: 'Taxes in the price', ch: 'Pump diesel, EU Weekly Oil Bulletin (weekly)', from: 'From', all: 'All', lT: 'With taxes', lN: 'Before taxes', hover: 'Hover over the chart.',
      note: 'Road diesel: the average price each Member State reports to the Commission. It is not agricultural diesel, which in many countries carries a reduced tax and is not openly published in this source. Comparisons between countries have limited validity because of differences in quality and market. “Taxes in the price” is the gap between the price with and without taxes, divided by the price with taxes.', src: 'Source:', srcA: 'European Commission, Weekly Oil Bulletin' },
    fr: { h: 'Gazole en {n}', eu: 'Gazole moyen à la pompe, semaine du {d}', tax: 'TTC', notax: 'hors taxes', w: 'Il y a une semaine', m: 'Il y a quatre semaines', y: 'Il y a un an', sh: 'Taxes dans le prix', ch: 'Gazole à la pompe, Bulletin pétrolier de l’UE (hebdomadaire)', from: 'Depuis', all: 'Tout', lT: 'TTC', lN: 'Hors taxes', hover: 'Survolez le graphique.',
      note: 'Gazole routier : prix moyen que chaque État membre communique à la Commission. Ce n’est pas le gazole agricole, qui dans de nombreux pays bénéficie d’une taxation réduite et n’est pas publié en open data dans cette source. Les comparaisons entre pays ont une validité limitée en raison des différences de qualité et de marché. « Taxes dans le prix » est l’écart entre le prix TTC et hors taxes, divisé par le prix TTC.', src: 'Source :', srcA: 'Commission européenne, Weekly Oil Bulletin' },
    it: { h: 'Gasolio in {n}', eu: 'Gasolio medio alla pompa, settimana del {d}', tax: 'tasse incluse', notax: 'senza tasse', w: 'Una settimana fa', m: 'Quattro settimane fa', y: 'Un anno fa', sh: 'Tasse nel prezzo', ch: 'Gasolio alla pompa, Bollettino petrolifero UE (settimanale)', from: 'Dal', all: 'Tutto', lT: 'Tasse incluse', lN: 'Senza tasse', hover: 'Passa il cursore sul grafico.',
      note: 'Gasolio stradale: prezzo medio che ogni Stato membro comunica alla Commissione. Non è il gasolio agricolo, che in molti paesi ha una tassazione ridotta e non è pubblicato in formato aperto in questa fonte. I confronti tra paesi hanno validità limitata per differenze di qualità e di mercato. «Tasse nel prezzo» è la differenza tra prezzo con e senza tasse, divisa per il prezzo con tasse.', src: 'Fonte:', srcA: 'Commissione europea, Weekly Oil Bulletin' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, st = { from: 2019 };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function num(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function eur(v, lg) { return v == null ? '—' : num(v, lg, 3) + ' €/l'; }
  function sgn(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), lg, 3) + ' €/l'; }
  function pct(v, lg) { return ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), lg, 1) + ' %)'; }
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function chart(R, from, t, lg, nm) {
    R = R.filter(function (r) { return parseInt(r[0].slice(0, 4), 10) >= from; }); if (R.length < 2) return { html: '' };
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, t0 = Date.parse(R[0][0]), t1 = Date.parse(R[R.length - 1][0]), lo = 1e9, hi = 0, i, j, q = 0.2;
    for (i = 0; i < R.length; i++) for (j = 1; j <= 2; j++) { var v0 = R[i][j]; if (v0 != null) { lo = Math.min(lo, v0); hi = Math.max(hi, v0); } }
    lo = Math.floor(lo / q) * q; hi = Math.ceil(hi / q) * q; var step = (hi - lo) / q > 8 ? q * 2 : q;
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); }, g = '', xt = '', v;
    for (v = lo; v <= hi + 1e-9; v += step) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + num(v, lg, 1) + '</text>';
    var y0 = parseInt(R[0][0].slice(0, 4), 10), y1 = parseInt(R[R.length - 1][0].slice(0, 4), 10), ev = y1 - y0 > 12 ? 4 : y1 - y0 > 5 ? 2 : 1;
    for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) { var xx = X(yy + '-01-01'); xt += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    function line(ix) { var p = '', open = false; for (var k = 0; k < R.length; k++) { if (R[k][ix] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(R[k][0]).toFixed(1) + ' ' + Y(R[k][ix]).toFixed(1); open = true; } return p; }
    var S = [{ ix: 1, cls: 't', lab: t.lT }, { ix: 2, cls: 'r', lab: t.lN }];
    var fsel = '<div class="wd-sels"><label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select pf-from" aria-label="' + esc(t.from) + '">' + [[2019, '2019'], [2022, '2022'], [2024, '2024']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === from ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>';
    return { R: R, X: X, W: W, S: S, html: '<div class="di-info-card-title gb-sub">' + esc(t.ch) + '</div>' + fsel + '<div class="wp-chart eud-ch"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.ch + ' — ' + nm) + '">' + g + xt +
      S.slice().reverse().map(function (s) { return '<path class="wp-line wp-line-' + s.cls + '" d="' + line(s.ix) + '"/>'; }).join('') +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg><div class="wp-legend">' + S.map(function (s) { return '<span><i class="wp-sw wp-sw-' + s.cls + '"></i>' + esc(s.lab) + '</span>'; }).join('') + '<span class="wp-unit">€/l</span></div></div>' };
  }
  function bind(el, c, lg, t) {
    if (!c.R) return; var box = el.querySelector('.eud-ch'); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.R.length; k++) { var dd = Math.abs(c.X(c.R[k][0]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var x = c.R[b], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(day(x[0], lg)) + '</b>' + c.S.map(function (s, i) { return ' · ' + esc(s.lab) + ' ' + (i ? '' : '<b>') + num(x[s.ix], lg, 3) + ' €/l' + (i ? '' : '</b>'); }).join('');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = {};
  function mount(el, lg, cc) {
    if (!el || !NM[cc]) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE[cc] = CACHE[cc] || fetch('data/views/diesel-eu/' + cc + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE[cc].then(function (d) {
      if (!d || !d.weekly || d.weekly.length < 60) return false;
      var t = T[lg], nm = NM[cc][LI[lg]], R = d.weekly, n = R.length, x = R[n - 1];
      function back(k) { var r = R[n - 1 - k]; return r ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
      function draw(focus) {
        var ec = chart(R, st.from, t, lg, nm);
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-eu-diesel" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h.replace('{n}', nm)) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.eu.replace('{d}', day(x[0], lg)), '<b>' + eur(x[1], lg) + '</b> ' + esc(t.tax) + (x[2] != null ? ' · ' + eur(x[2], lg) + ' ' + esc(t.notax) : '')) + row(t.w, back(1)) + row(t.m, back(4)) + row(t.y, back(52)) +
          (x[2] != null ? row(t.sh, num((x[1] - x[2]) / x[1] * 100, lg, 1) + ' %') : '') + '</div>' + ec.html +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc((d.source || {}).url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a></p></section>';
        bind(el, ec, lg, t);
        if (focus) { var q = el.querySelector(focus); if (q) q.focus(); }
      }
      draw();
      if (!el.getAttribute('data-pf')) { el.setAttribute('data-pf', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('pf-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.pf-from'); } }); }
      return true;
    });
  }
  global.DIEuDiesel = { mount: mount };
})(window);
