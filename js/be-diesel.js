/* Dehesa Index — Bélgica: gasóleo agrícola (precio máximo oficial diario del SPF Economía) y gasóleo/fioul semanales desde 2005
   (Boletín Petrolero de la UE). data/be-diesel.json (scripts/update-be-diesel.py). Ficha de Bélgica. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Gasóleo agrícola en Bélgica (precio máximo oficial)', last: 'Precio máximo oficial del {d}', big: 'Gasóleo agrícola, desde 2.000 l', small: 'Gasóleo agrícola, menos de 2.000 l', novat: 'Gasóleo agrícola sin IVA (21 %)', road: 'Gasóleo de automoción B7', heat: 'Fioul de calefacción, desde 2.000 l', gap: 'Ahorro frente al gasóleo de automoción', w: 'Hace una semana', m: 'Hace un mes', y: 'Hace un año', vat: 'IVA incluido',
      c1: 'Precio máximo oficial cada día', c2: 'Precios semanales desde 2005 (Boletín Petrolero de la UE)', from: 'Desde', all: 'Todo (2005)', hover: 'Pasa el cursor o toca el gráfico.', lF: 'Agrícola (≥ 2.000 l)', lR: 'Automoción B7', lD: 'Gasóleo con impuestos', lN: 'Gasóleo sin impuestos', lH: 'Fioul de calefacción', unit: '€/l',
      note: 'En Bélgica el gasóleo para tractores y maquinaria agrícola es un producto aparte, coloreado y con un impuesto especial mucho más bajo que el de automoción. El Gobierno fija cada día laborable su precio máximo de venta (con el contrato-programa del sector), que es el que aquí se muestra, IVA incluido. Los agricultores en régimen general de IVA lo recuperan; los acogidos al régimen agrícola a tanto alzado, no. La serie diaria empieza en octubre de 2025 y crece cada día; la semanal es la media nacional del Boletín Petrolero de la UE.', src: 'Fuente:', srcA: 'SPF Economía, tarifa oficial de los productos petrolíferos', srcB: 'be.STAT (Statbel)', srcC: 'Comisión Europea, Weekly Oil Bulletin' },
    en: { h: 'Farm diesel in Belgium (official maximum price)', last: 'Official maximum price on {d}', big: 'Farm diesel, 2,000 l or more', small: 'Farm diesel, under 2,000 l', novat: 'Farm diesel net of VAT (21 %)', road: 'Road diesel B7', heat: 'Heating oil, 2,000 l or more', gap: 'Saving against road diesel', w: 'A week ago', m: 'A month ago', y: 'A year ago', vat: 'VAT included',
      c1: 'Official maximum price each day', c2: 'Weekly prices since 2005 (EU Weekly Oil Bulletin)', from: 'From', all: 'All (2005)', hover: 'Hover or tap the chart.', lF: 'Farm (≥ 2,000 l)', lR: 'Road B7', lD: 'Diesel, taxes included', lN: 'Diesel before taxes', lH: 'Heating oil', unit: '€/l',
      note: 'In Belgium diesel for tractors and farm machinery is a separate, dyed product with much lower excise duty than road diesel. The government sets its maximum retail price every working day (under the sector’s programme contract); that is the price shown here, VAT included. Farmers under the standard VAT regime recover the VAT; those under the flat-rate farm scheme do not. The daily series starts in October 2025 and grows every day; the weekly one is the national average from the EU Weekly Oil Bulletin.', src: 'Source:', srcA: 'FPS Economy, official tariff of petroleum products', srcB: 'be.STAT (Statbel)', srcC: 'European Commission, Weekly Oil Bulletin' },
    fr: { h: 'Gazole agricole en Belgique (prix maximum officiel)', last: 'Prix maximum officiel du {d}', big: 'Gasoil agricole, à partir de 2 000 l', small: 'Gasoil agricole, moins de 2 000 l', novat: 'Gasoil agricole hors TVA (21 %)', road: 'Diesel routier B7', heat: 'Gasoil de chauffage, à partir de 2 000 l', gap: 'Économie par rapport au diesel routier', w: 'Il y a une semaine', m: 'Il y a un mois', y: 'Il y a un an', vat: 'TVA comprise',
      c1: 'Prix maximum officiel chaque jour', c2: 'Prix hebdomadaires depuis 2005 (Bulletin pétrolier de l’UE)', from: 'Depuis', all: 'Tout (2005)', hover: 'Survolez ou touchez le graphique.', lF: 'Agricole (≥ 2 000 l)', lR: 'Routier B7', lD: 'Gazole TTC', lN: 'Gazole hors taxes', lH: 'Gasoil de chauffage', unit: '€/l',
      note: 'En Belgique, le gasoil des tracteurs et machines agricoles est un produit distinct, coloré et soumis à une accise bien plus faible que le diesel routier. Le gouvernement fixe chaque jour ouvrable son prix maximum de vente (dans le cadre du contrat-programme du secteur) ; c’est ce prix, TVA comprise, qui est affiché ici. Les agriculteurs au régime normal de TVA la récupèrent ; ceux au régime forfaitaire agricole, non. La série quotidienne commence en octobre 2025 et s’allonge chaque jour ; la série hebdomadaire est la moyenne nationale du Bulletin pétrolier de l’UE.', src: 'Source :', srcA: 'SPF Économie, tarif officiel des produits pétroliers', srcB: 'be.STAT (Statbel)', srcC: 'Commission européenne, Bulletin pétrolier hebdomadaire' },
    it: { h: 'Gasolio agricolo in Belgio (prezzo massimo ufficiale)', last: 'Prezzo massimo ufficiale del {d}', big: 'Gasolio agricolo, da 2.000 l', small: 'Gasolio agricolo, meno di 2.000 l', novat: 'Gasolio agricolo senza IVA (21 %)', road: 'Gasolio per autotrazione B7', heat: 'Gasolio da riscaldamento, da 2.000 l', gap: 'Risparmio rispetto al gasolio per autotrazione', w: 'Una settimana fa', m: 'Un mese fa', y: 'Un anno fa', vat: 'IVA inclusa',
      c1: 'Prezzo massimo ufficiale ogni giorno', c2: 'Prezzi settimanali dal 2005 (Bollettino petrolifero dell’UE)', from: 'Dal', all: 'Tutto (2005)', hover: 'Passa il cursore o tocca il grafico.', lF: 'Agricolo (≥ 2.000 l)', lR: 'Autotrazione B7', lD: 'Gasolio con tasse', lN: 'Gasolio senza tasse', lH: 'Gasolio da riscaldamento', unit: '€/l',
      note: 'In Belgio il gasolio per trattori e macchine agricole è un prodotto a parte, colorato e con un’accisa molto più bassa di quello per autotrazione. Il governo ne fissa ogni giorno lavorativo il prezzo massimo di vendita (con il contratto-programma del settore): è il prezzo mostrato qui, IVA inclusa. Gli agricoltori in regime IVA ordinario la recuperano; quelli nel regime forfettario agricolo no. La serie giornaliera parte da ottobre 2025 e cresce ogni giorno; quella settimanale è la media nazionale del Bollettino petrolifero dell’UE.', src: 'Fonte:', srcA: 'SPF Economia, tariffa ufficiale dei prodotti petroliferi', srcB: 'be.STAT (Statbel)', srcC: 'Commissione europea, Weekly Oil Bulletin' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, st = { from: 2019 };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function eur(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function sgn(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function pct(v, lg) { return ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %)'; }
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  /* S: [[columna, clase de línea, etiqueta]]; cls: clase del contenedor; sel: html del selector o '' */
  function chart(R, S, lg, t, cls, title, sel) {
    if (R.length < 2) return { html: '' };
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, t0 = Date.parse(R[0][0]), t1 = Date.parse(R[R.length - 1][0]), lo = 1e9, hi = 0, i, j;
    for (i = 0; i < R.length; i++) for (j = 0; j < S.length; j++) { var vv = R[i][S[j][0]]; if (vv != null) { lo = Math.min(lo, vv); hi = Math.max(hi, vv); } }
    lo = Math.floor(lo * 5) / 5; hi = Math.ceil(hi * 5) / 5; var step = hi - lo > 1.6 ? 0.4 : 0.2;
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); }, g = '', xt = '';
    for (var v = lo; v <= hi + 1e-9; v += step) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '</text>';
    function tick(iso, lab) { var xx = X(iso); xt += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + esc(lab) + '</text>'; }
    var y0 = parseInt(R[0][0].slice(0, 4), 10), y1 = parseInt(R[R.length - 1][0].slice(0, 4), 10);
    if (t1 - t0 > 2.5 * 365 * 864e5) { var ev = y1 - y0 > 12 ? 4 : y1 - y0 > 5 ? 2 : 1; for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) tick(yy + '-01-01', String(yy)); }
    else { var d = new Date(Date.UTC(y0, parseInt(R[0][0].slice(5, 7), 10), 1)); while (d.getTime() <= t1) { var iso = d.toISOString().slice(0, 10); if ((d.getUTCMonth() % 3) === 0) tick(iso, d.toLocaleDateString(LOC[lg], { month: 'short', year: '2-digit', timeZone: 'UTC' })); d.setUTCMonth(d.getUTCMonth() + 1); } }
    function line(ix) { var p = '', open = false; for (var k = 0; k < R.length; k++) { if (R[k][ix] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(R[k][0]).toFixed(1) + ' ' + Y(R[k][ix]).toFixed(1); open = true; } return p; }
    var paths = '', leg = '';
    for (j = S.length - 1; j >= 0; j--) paths += '<path class="wp-line wp-line-' + S[j][1] + '" d="' + line(S[j][0]) + '"/>';
    for (j = 0; j < S.length; j++) leg += '<span><i class="wp-sw wp-sw-' + S[j][1] + '"></i>' + esc(S[j][2]) + '</span>';
    return { R: R, X: X, W: W, S: S, cls: cls, html: '<div class="di-info-card-title gb-sub">' + esc(title) + '</div>' + (sel ? '<div class="wd-sels">' + sel + '</div>' : '') + '<div class="wp-chart ' + cls + '"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(title) + '">' + g + xt + paths +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg><div class="wp-legend">' + leg + '<span class="wp-unit">' + esc(t.unit) + '</span></div></div>' };
  }
  function bind(el, c, lg, t) {
    var box = el.querySelector('.' + c.cls); if (!box || !c.R) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.R.length; k++) { var dd = Math.abs(c.X(c.R[k][0]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var x = c.R[b], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(day(x[0], lg)) + '</b>' + c.S.map(function (s) { return ' · ' + esc(s[2]) + ' <b>' + eur(x[s[0]], lg) + '</b>'; }).join('');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/be-diesel.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      if (!d || !d.daily || !d.daily.length) return false;
      var t = T[lg], D = d.daily, n = D.length, x = D[n - 1];
      function back(days) {
        var target = new Date(Date.parse(x[0]) - days * 864e5).toISOString().slice(0, 10), r = null;
        for (var k = n - 1; k >= 0; k--) if (D[k][0] <= target) { r = D[k]; break; }
        return r && (Date.parse(target) - Date.parse(r[0])) < 10 * 864e5 ? sgn(x[1] - r[1], lg) + pct((x[1] / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—';
      }
      function draw(focus) {
        var c1 = chart(D, [[1, 't', t.lF], [3, 'r', t.lR]], lg, t, 'bd-day', t.c1, '');
        var fsel = '<label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select bf-from" aria-label="' + esc(t.from) + '">' + [[2005, t.all], [2015, '2015'], [2019, '2019'], [2023, '2023']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === st.from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
        var c2 = chart((d.weekly || []).filter(function (r) { return parseInt(r[0].slice(0, 4), 10) >= st.from; }), [[1, 't', t.lD], [2, 'r', t.lN], [3, 'w', t.lH]], lg, t, 'bd-week', t.c2, fsel);
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-be-diesel" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.last.replace('{d}', day(x[0], lg))) + ' · ' + esc(t.vat) + '</p><div class="di-info-stat-list" style="max-width:640px">' +
          row(t.big, '<b>' + eur(x[1], lg) + '</b>') + row(t.small, eur(x[2], lg)) + row(t.novat, eur(d.farmNoVat, lg)) + row(t.road, eur(x[3], lg)) +
          (x[3] != null ? row(t.gap, '<b>' + eur(x[3] - x[1], lg) + '</b>') : '') + row(t.heat, eur(x[4], lg)) + row(t.w, back(7)) + row(t.m, back(30)) + row(t.y, back(365)) + '</div>' + c1.html + c2.html +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>, ' + esc(t.srcB) + ' (CC BY 4.0); <a href="' + esc(d.source.wobUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcC) + '</a></p></section>';
        bind(el, c1, lg, t); bind(el, c2, lg, t);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-bf')) { el.setAttribute('data-bf', '1'); el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('bf-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.bf-from'); } }); }
      return true;
    });
  }
  global.DIBeDiesel = { mount: mount };
})(window);
