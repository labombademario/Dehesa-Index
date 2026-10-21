/* Dehesa Index — Croacia: precios máximos oficiales del gasóleo y del «plavi dizel» (gasóleo azul agrícola), notas de la Vlada, y gasóleo semanal del
   Boletín Petrolero de la UE desde 2005. data/hr-diesel.json (scripts/update-hr-diesel.py). Ficha de Croacia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Gasóleo agrícola en Croacia («plavi dizel»)', off: 'Precio máximo oficial desde el {d}', blue: 'Gasóleo azul (plavi dizel)', dsl: 'Gasóleo normal (eurodizel)', gap: 'Ahorro del gasóleo azul', nov: 'Gasóleo azul sin IVA', nov2: 'para explotaciones que recuperan el IVA (25 %)', nm: 'Sin las medidas del Gobierno', nm2: 'gasóleo azul {b} · gasóleo normal {d}', chO: 'Precio máximo oficial, por semana publicada', lB: 'Gasóleo azul', lD: 'Gasóleo normal', lN: 'Azul sin medidas', unit: '€/l con IVA',
      eu: 'Gasóleo medio en surtidor, semana del {d}', tax: 'con impuestos', notax: 'sin impuestos', heat: 'Fioul de calefacción, misma semana', w: 'Hace una semana', m: 'Hace cuatro semanas', y: 'Hace un año', chE: 'Gasóleo en surtidor, Boletín Petrolero de la UE (semanal)', from: 'Desde', all: 'Todo', lT: 'Con impuestos', lN2: 'Sin impuestos', lH: 'Fioul de calefacción', hover: 'Pasa el cursor por la gráfica.',
      note: 'El gasóleo azul lo compran agricultores, pescadores y acuicultores con autorización de la Aduana (Carinska uprava); su impuesto especial es 0 € por 1.000 l (Uredba, NN 156/2022) frente a unos 330–390 € del gasóleo normal en 2026. El Gobierno fija cada semana un precio máximo para ambos con la «Uredba o utvrđivanju najviših maloprodajnih cijena naftnih derivata», pero el decreto solo trae la fórmula y las primas: los precios finales (y los que habría sin sus medidas) salen en la nota de prensa de la Vlada, que es de donde Dehesa Index los lee. Solo aparecen las semanas que el buscador de la Vlada devuelve, así que puede haber huecos; son precios máximos, no los pagados. La serie de la UE es el precio medio observado en el surtidor para el gasóleo de automoción, no el azul.', src: 'Fuentes:', srcA: 'Vlada Republike Hrvatske (citando la fuente)', srcB: 'Comisión Europea, Weekly Oil Bulletin' },
    en: { h: 'Farm diesel in Croatia (“plavi dizel”)', off: 'Official maximum price from {d}', blue: 'Blue diesel (plavi dizel)', dsl: 'Ordinary diesel (eurodizel)', gap: 'Saving with blue diesel', nov: 'Blue diesel before VAT', nov2: 'for farms that recover VAT (25 %)', nm: 'Without the Government’s measures', nm2: 'blue diesel {b} · ordinary diesel {d}', chO: 'Official maximum price, by published week', lB: 'Blue diesel', lD: 'Ordinary diesel', lN: 'Blue, no measures', unit: '€/l incl. VAT',
      eu: 'Average pump diesel, week of {d}', tax: 'taxes included', notax: 'before taxes', heat: 'Heating oil, same week', w: 'A week ago', m: 'Four weeks ago', y: 'A year ago', chE: 'Pump diesel, EU Weekly Oil Bulletin (weekly)', from: 'From', all: 'All', lT: 'With taxes', lN2: 'Before taxes', lH: 'Heating oil', hover: 'Hover over the chart.',
      note: 'Blue diesel is bought by farmers, fishers and aquaculture operators with a Customs authorisation (Carinska uprava); its excise duty is €0 per 1,000 l (Uredba, NN 156/2022) against about €330–390 for ordinary diesel in 2026. Every week the Government sets a maximum price for both with the “Uredba o utvrđivanju najviših maloprodajnih cijena naftnih derivata”, but the decree only carries the formula and the margins: the final prices (and what they would be without its measures) come in the Vlada’s press release, which is where Dehesa Index reads them. Only the weeks that the Vlada’s search returns appear, so there can be gaps; these are maximum prices, not prices paid. The EU series is the average pump price observed for road diesel, not blue diesel.', src: 'Sources:', srcA: 'Vlada Republike Hrvatske (source cited)', srcB: 'European Commission, Weekly Oil Bulletin' },
    fr: { h: 'Gazole agricole en Croatie (« plavi dizel »)', off: 'Prix maximal officiel depuis le {d}', blue: 'Gazole bleu (plavi dizel)', dsl: 'Gazole ordinaire (eurodizel)', gap: 'Économie avec le gazole bleu', nov: 'Gazole bleu hors TVA', nov2: 'pour les exploitations qui récupèrent la TVA (25 %)', nm: 'Sans les mesures du gouvernement', nm2: 'gazole bleu {b} · gazole ordinaire {d}', chO: 'Prix maximal officiel, par semaine publiée', lB: 'Gazole bleu', lD: 'Gazole ordinaire', lN: 'Bleu sans mesures', unit: '€/l TTC',
      eu: 'Gazole moyen à la pompe, semaine du {d}', tax: 'TTC', notax: 'hors taxes', heat: 'Fioul domestique, même semaine', w: 'Il y a une semaine', m: 'Il y a quatre semaines', y: 'Il y a un an', chE: 'Gazole à la pompe, Bulletin pétrolier de l’UE (hebdomadaire)', from: 'Depuis', all: 'Tout', lT: 'TTC', lN2: 'Hors taxes', lH: 'Fioul domestique', hover: 'Survolez le graphique.',
      note: 'Le gazole bleu est acheté par les agriculteurs, pêcheurs et aquaculteurs munis d’une autorisation des douanes (Carinska uprava) ; son accise est de 0 € par 1 000 l (Uredba, NN 156/2022) contre environ 330–390 € pour le gazole ordinaire en 2026. Chaque semaine, le gouvernement fixe un prix maximal pour les deux par l’« Uredba o utvrđivanju najviših maloprodajnih cijena naftnih derivata », mais le décret ne contient que la formule et les marges : les prix finaux (et ceux sans ses mesures) figurent dans le communiqué de la Vlada, d’où Dehesa Index les lit. Seules apparaissent les semaines que la recherche de la Vlada renvoie, d’où d’éventuels trous ; ce sont des prix maximaux, pas des prix payés. La série de l’UE est le prix moyen observé à la pompe pour le gazole routier, pas le bleu.', src: 'Sources :', srcA: 'Vlada Republike Hrvatske (source citée)', srcB: 'Commission européenne, Weekly Oil Bulletin' },
    it: { h: 'Gasolio agricolo in Croazia («plavi dizel»)', off: 'Prezzo massimo ufficiale dal {d}', blue: 'Gasolio blu (plavi dizel)', dsl: 'Gasolio normale (eurodizel)', gap: 'Risparmio con il gasolio blu', nov: 'Gasolio blu senza IVA', nov2: 'per le aziende che recuperano l’IVA (25 %)', nm: 'Senza le misure del Governo', nm2: 'gasolio blu {b} · gasolio normale {d}', chO: 'Prezzo massimo ufficiale, per settimana pubblicata', lB: 'Gasolio blu', lD: 'Gasolio normale', lN: 'Blu senza misure', unit: '€/l IVA inclusa',
      eu: 'Gasolio medio alla pompa, settimana del {d}', tax: 'tasse incluse', notax: 'senza tasse', heat: 'Gasolio da riscaldamento, stessa settimana', w: 'Una settimana fa', m: 'Quattro settimane fa', y: 'Un anno fa', chE: 'Gasolio alla pompa, Bollettino petrolifero UE (settimanale)', from: 'Dal', all: 'Tutto', lT: 'Tasse incluse', lN2: 'Senza tasse', lH: 'Gasolio da riscaldamento', hover: 'Passa il cursore sul grafico.',
      note: 'Il gasolio blu è acquistato da agricoltori, pescatori e acquacoltori con un’autorizzazione doganale (Carinska uprava); la sua accisa è di 0 € per 1.000 l (Uredba, NN 156/2022) contro circa 330–390 € del gasolio normale nel 2026. Ogni settimana il Governo fissa un prezzo massimo per entrambi con l’«Uredba o utvrđivanju najviših maloprodajnih cijena naftnih derivata», ma il decreto contiene solo la formula e i margini: i prezzi finali (e quelli senza le sue misure) sono nel comunicato della Vlada, da cui Dehesa Index li legge. Compaiono solo le settimane restituite dalla ricerca della Vlada, quindi possono esserci buchi; sono prezzi massimi, non pagati. La serie UE è il prezzo medio osservato alla pompa per il gasolio stradale, non il blu.', src: 'Fonti:', srcA: 'Vlada Republike Hrvatske (fonte citata)', srcB: 'Commissione europea, Weekly Oil Bulletin' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, st = { from: 2019 };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function eur(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d || 3, maximumFractionDigits: d || 3 }) + ' €/l'; }
  function sgn(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function pct(v, lg) { return ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %)'; }
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  // Gráfica de líneas: R = filas [fecha, v1, v2, v3…]; S = [{ix, cls, dots}]; desde = año mínimo
  function chart(R, S, from, cid, t, withSel) {
    R = R.filter(function (r) { return parseInt(r[0].slice(0, 4), 10) >= from; }); if (R.length < 2) return { html: '' };
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, t0 = Date.parse(R[0][0]), t1 = Date.parse(R[R.length - 1][0]), lo = 1e9, hi = 0, i, j;
    for (i = 0; i < R.length; i++) for (j = 0; j < S.length; j++) { var v0 = R[i][S[j].ix]; if (v0 != null) { lo = Math.min(lo, v0); hi = Math.max(hi, v0); } }
    lo = Math.floor(lo * 5) / 5; hi = Math.ceil(hi * 5) / 5; var step = hi - lo > 1.6 ? 0.4 : 0.2;
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); }, g = '', xt = '', v;
    for (v = lo; v <= hi + 1e-9; v += step) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v.toFixed(1) + '</text>';
    var y0 = parseInt(R[0][0].slice(0, 4), 10), y1 = parseInt(R[R.length - 1][0].slice(0, 4), 10), ev = y1 - y0 > 12 ? 4 : y1 - y0 > 5 ? 2 : 1;
    for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) { var xx = X(yy + '-01-01'); xt += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    function line(ix) { var p = '', open = false; for (var k = 0; k < R.length; k++) { if (R[k][ix] == null) { open = false; continue; } if (open && cid.gap && Date.parse(R[k][0]) - Date.parse(R[k - 1][0]) > cid.gap * 864e5) open = false; p += (open ? 'L' : 'M') + X(R[k][0]).toFixed(1) + ' ' + Y(R[k][ix]).toFixed(1); open = true; } return p; }
    function dots(ix, c) { var o = ''; for (var k = 0; k < R.length; k++) if (R[k][ix] != null) o += '<circle class="hr-dot hr-dot-' + c + '" cx="' + X(R[k][0]).toFixed(1) + '" cy="' + Y(R[k][ix]).toFixed(1) + '" r="2.4"/>'; return o; }
    var fsel = withSel ? '<div class="wd-sels"><label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select pf-from" data-chips aria-label="' + esc(t.from) + '">' + [[2005, t.all], [2015, '2015'], [2019, '2019'], [2023, '2023']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === from ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>' : '';
    return { R: R, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(cid.title) + '</div>' + fsel + '<div class="wp-chart ' + cid.cls + '"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(cid.title) + '">' + g + xt +
      S.slice().reverse().map(function (s) { return '<path class="wp-line wp-line-' + s.cls + (s.dash ? ' hr-dash' : '') + '" d="' + line(s.ix) + '"/>' + (s.dots ? dots(s.ix, s.cls) : ''); }).join('') +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg><div class="wp-legend">' + S.map(function (s) { return '<span><i class="wp-sw wp-sw-' + s.cls + '"></i>' + esc(s.lab) + '</span>'; }).join('') + '<span class="wp-unit">' + esc(cid.unit) + '</span></div></div>', S: S, cls: cid.cls };
  }
  function bind(el, c, lg, t) {
    if (!c.R) return; var box = el.querySelector('.' + c.cls); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.R.length; k++) { var dd = Math.abs(c.X(c.R[k][0]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var x = c.R[b], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(day(x[0], lg)) + '</b>' + c.S.map(function (s, i) { return ' · ' + esc(s.lab) + ' ' + (i ? '' : '<b>') + eur(x[s.ix], lg, s.d2 ? 2 : 3) + (i ? '' : '</b>'); }).join('');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/hr-diesel.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      if (!d || !d.weekly || !d.weekly.length || !d.official || !d.official.length) return false;
      var t = T[lg], R = d.weekly, n = R.length, x = R[n - 1], O = d.official, o = O[O.length - 1], vat = d.vat || 0.25;
      function back(k) { var r = R[n - 1 - k]; return r ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
      function draw(focus) {
        var oc = chart(O.map(function (r) { return [r[0], r[2], r[3], r[5]]; }), [{ ix: 2, cls: 't', lab: t.lB, dots: true, d2: true }, { ix: 1, cls: 'r', lab: t.lD, dots: true, d2: true }, { ix: 3, cls: 'w', lab: t.lN, dots: false, dash: true, d2: true }], 2000, { title: t.chO, cls: 'hr-och', unit: t.unit, gap: 16 }, t, false);
        var ec = chart(R, [{ ix: 1, cls: 't', lab: t.lT }, { ix: 2, cls: 'r', lab: t.lN2 }, { ix: 3, cls: 'w', lab: t.lH }], st.from, { title: t.chE, cls: 'hr-ech', unit: '€/l' }, t, true);
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-hr-diesel" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.off.replace('{d}', day(o[0], lg)), '') + row(t.blue, '<b>' + eur(o[3], lg, 2) + '</b>') + row(t.dsl, eur(o[2], lg, 2)) +
          row(t.gap, '<b>' + eur(o[2] - o[3], lg, 2) + '</b>' + pct(-(1 - o[3] / o[2]) * 100, lg)) + row(t.nov, '<b>' + eur(o[3] / (1 + vat), lg, 2) + '</b> · ' + esc(t.nov2)) +
          (o[4] != null && o[5] != null ? row(t.nm, esc(t.nm2.replace('{b}', eur(o[5], lg, 2)).replace('{d}', eur(o[4], lg, 2)))) : '') +
          row(t.eu.replace('{d}', day(x[0], lg)), '<b>' + eur(x[1], lg) + '</b> ' + esc(t.tax) + ' · ' + eur(x[2], lg) + ' ' + esc(t.notax)) +
          row(t.heat, eur(x[3], lg)) + row(t.w, back(1)) + row(t.m, back(4)) + row(t.y, back(52)) + '</div>' + oc.html + ec.html +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>; <a href="' + esc(d.source.wobUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcB) + '</a></p></section>';
        bind(el, oc, lg, t); bind(el, ec, lg, t);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-pf')) { el.setAttribute('data-pf', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('pf-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.pf-from'); } }); }
      return true;
    });
  }
  global.DIHrDiesel = { mount: mount };
})(window);
