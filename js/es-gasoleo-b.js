/* Dehesa Index — Gasóleo B (gasóleo agrícola) en España: precio en las gasolineras por provincia y su histórico (MITECO, Geoportal de Gasolineras).
   data/es-gasoleo-b.json (scripts/update-es-gasoleo-b.py). Se muestra debajo de la pestaña «España» de insumos.html: el bloque sigue la visibilidad de #in-es.
   El mapa de provincias (vendor/es-provinces.js) se carga solo al abrir la pestaña. ES5. */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var T = {
    es: { h: 'Gasóleo agrícola (gasóleo B) en las gasolineras', badge: 'DATOS OFICIALES REALES', today: 'Mediana nacional', st: 'gasolineras que lo venden', a: 'Gasóleo A (automoción), mismas fechas', gap: 'Diferencia con el gasóleo A', w: 'Hace una semana', m: 'Hace un mes', y: 'Hace un año', map: 'Mediana por provincia', hoverMap: 'Pasa el cursor o toca una provincia.', noData: 'sin gasolineras con gasóleo B en los datos', stations: 'gasolineras', cheap: 'Provincias más baratas', dear: 'Provincias más caras', all: 'Ver todas las provincias', prov: 'Provincia', med: 'Mediana B', medA: 'Mediana A', n: 'Gasolineras',
      chart: 'Evolución de la mediana nacional', from: 'Desde', allH: 'Todo (2007)', hover: 'Pasa el cursor o toca el gráfico para ver cada fecha.', lb: 'Gasóleo B (agrícola)', la: 'Gasóleo A (automoción)', unit: '€/l', hist: 'Un punto al mes hasta 2022, uno por semana desde 2023 y uno por día desde octubre de 2026.', pend: 'El histórico se está completando: faltan {n} fechas por descargar.',
      note: 'Precio de venta al público, con impuestos, que comunica cada gasolinera al ministerio. El gasóleo B lleva un impuesto especial reducido y solo puede usarse en maquinaria agrícola y otros usos autorizados. Mucho gasóleo agrícola se sirve a domicilio en la explotación, a un precio que aquí no aparece. La mediana es el precio del medio: la mitad de las gasolineras está por encima y la otra mitad por debajo. Canarias, Ceuta y Melilla no tienen gasóleo B en estos datos.',
      src: 'Fuente:', cite: 'Medianas por provincia y diferencias: cálculo de Dehesa Index.', mk: 'Mediana del precio de venta al público del gasóleo B en las estaciones de servicio de España', ty: 'Precio (€/l, con impuestos)', ob: 'Una fecha por punto; cada punto es la mediana de todas las gasolineras que lo venden ese día', me: 'Dehesa Index descarga cada día los precios de todas las gasolineras del servicio del MITECO y calcula la mediana del gasóleo B y del gasóleo A por provincia y para España; el histórico sale del mismo servicio, que guarda los precios de cada día desde 2007.' },
    en: { h: 'Farm diesel (gasóleo B) at Spanish filling stations', badge: 'REAL OFFICIAL DATA', today: 'National median', st: 'stations selling it', a: 'Road diesel (gasóleo A), same dates', gap: 'Gap with road diesel', w: 'A week ago', m: 'A month ago', y: 'A year ago', map: 'Median by province', hoverMap: 'Hover or tap a province.', noData: 'no stations selling farm diesel in the data', stations: 'stations', cheap: 'Cheapest provinces', dear: 'Most expensive provinces', all: 'See every province', prov: 'Province', med: 'Median B', medA: 'Median A', n: 'Stations',
      chart: 'National median over time', from: 'From', allH: 'All (2007)', hover: 'Hover or tap the chart to read each date.', lb: 'Farm diesel (B)', la: 'Road diesel (A)', unit: '€/l', hist: 'One point a month until 2022, one a week since 2023 and one a day since October 2026.', pend: 'The history is still being filled in: {n} dates left to download.',
      note: 'Retail price, taxes included, that each filling station reports to the ministry. Gasóleo B carries a reduced excise duty and may only be used in farm machinery and other authorised uses. Much farm diesel is delivered straight to the farm, at a price that does not appear here. The median is the middle price: half the stations charge more and half charge less. The Canary Islands, Ceuta and Melilla have no gasóleo B in this data.',
      src: 'Source:', cite: 'Province medians and gaps: calculated by Dehesa Index.', mk: 'Median retail price of farm diesel (gasóleo B) at Spanish filling stations', ty: 'Price (€/l, taxes included)', ob: 'One date per point; each point is the median of every station selling it that day', me: 'Dehesa Index downloads the prices of every filling station from the MITECO service each day and calculates the median of gasóleo B and gasóleo A by province and for Spain; the history comes from the same service, which keeps each day’s prices since 2007.' },
    fr: { h: 'Gazole agricole (gasóleo B) dans les stations-service espagnoles', badge: 'DONNÉES OFFICIELLES RÉELLES', today: 'Médiane nationale', st: 'stations qui le vendent', a: 'Gazole routier (gasóleo A), mêmes dates', gap: 'Écart avec le gazole routier', w: 'Il y a une semaine', m: 'Il y a un mois', y: 'Il y a un an', map: 'Médiane par province', hoverMap: 'Survolez ou touchez une province.', noData: 'aucune station vendant du gazole agricole dans les données', stations: 'stations', cheap: 'Provinces les moins chères', dear: 'Provinces les plus chères', all: 'Voir toutes les provinces', prov: 'Province', med: 'Médiane B', medA: 'Médiane A', n: 'Stations',
      chart: 'Évolution de la médiane nationale', from: 'Depuis', allH: 'Tout (2007)', hover: 'Survolez ou touchez le graphique pour lire chaque date.', lb: 'Gazole agricole (B)', la: 'Gazole routier (A)', unit: '€/l', hist: 'Un point par mois jusqu’en 2022, un par semaine depuis 2023 et un par jour depuis octobre 2026.', pend: 'L’historique est en cours de remplissage : {n} dates restent à télécharger.',
      note: 'Prix de vente au public, taxes comprises, que chaque station déclare au ministère. Le gasóleo B bénéficie d’une accise réduite et ne peut servir qu’aux machines agricoles et autres usages autorisés. Une grande partie du gazole agricole est livrée directement à l’exploitation, à un prix qui n’apparaît pas ici. La médiane est le prix du milieu : la moitié des stations est au-dessus, l’autre moitié en dessous. Les Canaries, Ceuta et Melilla n’ont pas de gasóleo B dans ces données.',
      src: 'Source :', cite: 'Médianes par province et écarts : calcul de Dehesa Index.', mk: 'Médiane du prix de vente au public du gazole agricole (gasóleo B) dans les stations-service espagnoles', ty: 'Prix (€/l, taxes comprises)', ob: 'Une date par point ; chaque point est la médiane de toutes les stations qui le vendent ce jour-là', me: 'Dehesa Index télécharge chaque jour les prix de toutes les stations-service du service du MITECO et calcule la médiane du gasóleo B et du gasóleo A par province et pour l’Espagne ; l’historique vient du même service, qui conserve les prix de chaque jour depuis 2007.' },
    it: { h: 'Gasolio agricolo (gasóleo B) nei distributori spagnoli', badge: 'DATI UFFICIALI REALI', today: 'Mediana nazionale', st: 'distributori che lo vendono', a: 'Gasolio per autotrazione (gasóleo A), stesse date', gap: 'Differenza con il gasolio per autotrazione', w: 'Una settimana fa', m: 'Un mese fa', y: 'Un anno fa', map: 'Mediana per provincia', hoverMap: 'Passa il cursore o tocca una provincia.', noData: 'nessun distributore con gasolio agricolo nei dati', stations: 'distributori', cheap: 'Province più economiche', dear: 'Province più care', all: 'Vedi tutte le province', prov: 'Provincia', med: 'Mediana B', medA: 'Mediana A', n: 'Distributori',
      chart: 'Andamento della mediana nazionale', from: 'Dal', allH: 'Tutto (2007)', hover: 'Passa il cursore o tocca il grafico per leggere ogni data.', lb: 'Gasolio agricolo (B)', la: 'Gasolio per autotrazione (A)', unit: '€/l', hist: 'Un punto al mese fino al 2022, uno a settimana dal 2023 e uno al giorno da ottobre 2026.', pend: 'Lo storico è in fase di completamento: mancano {n} date da scaricare.',
      note: 'Prezzo di vendita al pubblico, tasse incluse, che ogni distributore comunica al ministero. Il gasóleo B ha un’accisa ridotta e può essere usato solo nelle macchine agricole e in altri usi autorizzati. Gran parte del gasolio agricolo viene consegnata direttamente in azienda, a un prezzo che qui non compare. La mediana è il prezzo centrale: metà dei distributori sta sopra e metà sotto. Canarie, Ceuta e Melilla non hanno gasóleo B in questi dati.',
      src: 'Fonte:', cite: 'Mediane per provincia e differenze: calcolo di Dehesa Index.', mk: 'Mediana del prezzo di vendita al pubblico del gasolio agricolo (gasóleo B) nei distributori spagnoli', ty: 'Prezzo (€/l, tasse incluse)', ob: 'Una data per punto; ogni punto è la mediana di tutti i distributori che lo vendono quel giorno', me: 'Dehesa Index scarica ogni giorno i prezzi di tutti i distributori dal servizio del MITECO e calcola la mediana del gasóleo B e del gasóleo A per provincia e per la Spagna; lo storico viene dallo stesso servizio, che conserva i prezzi di ogni giorno dal 2007.' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  var st = { from: 2015 };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lang() { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; }
  function eur(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d == null ? 3 : d, maximumFractionDigits: d == null ? 3 : d }) + ' €/l'; }
  function sgn(v, lg) { if (v == null) return '—'; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' €/l'; }
  function pct(v, lg) { if (v == null) return ''; return ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %)'; }
  function dlabel(iso, lg) { var d = new Date(iso + 'T12:00:00Z'); return d.toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function back(rows, iso, days) {   // fila mas cercana a «iso menos days» (con tolerancia de un tercio del plazo)
    var t = Date.parse(iso) - days * 864e5, best = null, bd = 1e18;
    for (var i = 0; i < rows.length; i++) { var dd = Math.abs(Date.parse(rows[i][0]) - t); if (dd < bd && rows[i][1] != null) { bd = dd; best = rows[i]; } }
    return best && bd <= Math.max(2, days / 3) * 864e5 ? best : null;
  }
  function names() { var o = {}; ((global.DEHESA_ES_PROVINCES || {}).states || []).forEach(function (s) { o[s.id] = s.name; }); return o; }
  function bins(vals) {   // 5 tramos por cuantiles
    var v = vals.slice().sort(function (a, b) { return a - b; }), q = [];
    for (var i = 1; i < 5; i++) q.push(v[Math.min(v.length - 1, Math.floor(i * v.length / 5))]);
    return q;
  }
  function cls(v, q) { if (v == null) return 'gb-cx'; for (var i = 0; i < q.length; i++) if (v < q[i]) return 'gb-c' + i; return 'gb-c4'; }
  function mapHtml(d, lg) {
    var t = T[lg], M = global.DEHESA_ES_PROVINCES; if (!M) return '';
    var P = d.latest.provinces, N = names(), vals = [], k;
    for (k in P) if (P.hasOwnProperty(k)) vals.push(P[k][0]);
    var q = bins(vals);
    var paths = M.states.map(function (s) { var p = P[s.id]; return '<path class="gb-prov ' + cls(p ? p[0] : null, q) + '" data-id="' + s.id + '" tabindex="0" aria-label="' + esc(s.name + ': ' + (p ? eur(p[0], lg) : t.noData)) + '" d="' + s.d + '"/>'; }).join('');
    var leg = '<div class="wp-legend gb-leg">' + [0, 1, 2, 3, 4].map(function (i) { var lo = i ? q[i - 1] : Math.min.apply(null, vals), hi = i < 4 ? q[i] : Math.max.apply(null, vals); return '<span><i class="gb-key gb-c' + i + '"></i>' + esc(lo.toLocaleString(LOC[lg], { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '–' + hi.toLocaleString(LOC[lg], { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + '</span>'; }).join('') + '<span><i class="gb-key gb-cx"></i>' + esc(t.noData) + '</span></div>';
    var list = []; for (k in P) if (P.hasOwnProperty(k)) list.push([k, P[k]]);
    list.sort(function (a, b) { return a[1][0] - b[1][0]; });
    function li(x) { return '<li>' + esc(N[x[0]] || x[0]) + ' · <b>' + eur(x[1][0], lg) + '</b> <span class="gb-n">(' + x[1][1] + ' ' + esc(t.stations) + ')</span></li>'; }
    var tbl = '<details class="gb-all"><summary>' + esc(t.all) + '</summary><div class="gb-tw"><table class="di-table"><thead><tr><th>' + esc(t.prov) + '</th><th>' + esc(t.med) + '</th><th>' + esc(t.medA) + '</th><th>' + esc(t.n) + '</th></tr></thead><tbody>' +
      list.slice().sort(function (a, b) { return (N[a[0]] || '').localeCompare(N[b[0]] || '', LOC[lg]); }).map(function (x) { return '<tr><td>' + esc(N[x[0]] || x[0]) + '</td><td>' + eur(x[1][0], lg) + '</td><td>' + eur(x[1][3], lg) + '</td><td>' + x[1][1] + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
    return '<div class="gb-mapwrap"><div class="di-info-card-title gb-sub">' + esc(t.map) + ' · ' + esc(dlabel(d.latest.date, lg)) + '</div><div class="wp-readout gb-tip" aria-live="polite">' + esc(t.hoverMap) + '</div>' +
      '<svg class="gb-map" viewBox="' + M.viewBox + '" role="img" aria-label="' + esc(t.map) + '">' + paths + '</svg>' + leg +
      '<div class="gb-rank"><div><div class="gb-rh">' + esc(t.cheap) + '</div><ol>' + list.slice(0, 5).map(li).join('') + '</ol></div><div><div class="gb-rh">' + esc(t.dear) + '</div><ol>' + list.slice(-5).reverse().map(li).join('') + '</ol></div></div>' + tbl + '</div>';
  }
  function chart(d, lg) {
    var t = T[lg], R = d.history.rows.filter(function (r) { return r[1] != null && parseInt(r[0].slice(0, 4), 10) >= st.from; });
    if (R.length < 2) return { html: '' };
    var W = 560, H = 220, L = 40, Rr = 8, Tp = 10, B = 24, t0 = Date.parse(R[0][0]), t1 = Date.parse(R[R.length - 1][0]), lo = 1e9, hi = 0, i;
    for (i = 0; i < R.length; i++) { lo = Math.min(lo, R[i][1]); if (R[i][2] != null) hi = Math.max(hi, R[i][2]); hi = Math.max(hi, R[i][1]); }
    lo = Math.floor(lo * 5) / 5; hi = Math.ceil(hi * 5) / 5; if (hi - lo < 0.4) hi = lo + 0.4;
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - Rr); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); };
    var grid = '', step = hi - lo > 1.2 ? 0.4 : 0.2;
    for (var g = lo; g <= hi + 1e-9; g += step) grid += '<line class="wp-grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(g).toFixed(1) + '" y2="' + Y(g).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(g) + 3.5).toFixed(1) + '" text-anchor="end">' + g.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '</text>';
    var y0 = parseInt(R[0][0].slice(0, 4), 10), y1 = parseInt(R[R.length - 1][0].slice(0, 4), 10), ev = y1 - y0 > 12 ? 4 : y1 - y0 > 5 ? 2 : 1, xt = '';
    for (var yy = y0 + 1; yy <= y1; yy++) if (yy % ev === 0) { var xx = X(yy + '-01-01'); xt += '<line class="wp-grid wp-grid-v" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + xx.toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    function line(ix) { var p = '', open = false; for (var j = 0; j < R.length; j++) { if (R[j][ix] == null || (j && Date.parse(R[j][0]) - Date.parse(R[j - 1][0]) > 45 * 864e5)) open = false; if (R[j][ix] == null) continue; p += (open ? 'L' : 'M') + X(R[j][0]).toFixed(1) + ' ' + Y(R[j][ix]).toFixed(1); open = true; } return p; }
    var last = R[R.length - 1];
    var fsel = '<label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select gb-from" aria-label="' + esc(t.from) + '">' + [[2007, t.allH], [2015, '2015'], [2020, '2020'], [2024, '2024']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === st.from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    var html = '<div class="di-info-card-title gb-sub">' + esc(t.chart) + '</div><div class="wd-sels">' + fsel + '</div><div class="wp-chart gb-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.chart) + '" class="wp-svg">' + grid + xt +
      '<path class="wp-line wp-line-t" d="' + line(2) + '"/><path class="wp-line wp-line-r" d="' + line(1) + '"/>' +
      '<circle class="wp-dot wp-dot-r" cx="' + X(last[0]).toFixed(1) + '" cy="' + Y(last[1]).toFixed(1) + '" r="3.5"/>' +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="wp-legend"><span><i class="wp-sw wp-sw-r"></i>' + esc(t.lb) + '</span><span><i class="wp-sw wp-sw-t"></i>' + esc(t.la) + '</span><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' +
      '<div class="wp-hist">' + esc(t.hist) + (d.history.pending ? ' ' + esc(t.pend.replace('{n}', d.history.pending)) : '') + '</div>';
    return { html: html, R: R, X: X, W: W, L: L, Rr: Rr };
  }
  function bindChart(root, c, lg) {
    var box = root.querySelector('.gb-chart'); if (!box || !c.R) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), t = T[lg];
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, best = 0, bd = 1e9;
      for (var j = 0; j < c.R.length; j++) { var dd = Math.abs(c.X(c.R[j][0]) - vx); if (dd < bd) { bd = dd; best = j; } }
      var x = c.R[best], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(dlabel(x[0], lg)) + '</b> · ' + esc(t.lb) + ' <b>' + eur(x[1], lg) + '</b>' + (x[2] != null ? ' · ' + esc(t.la) + ' ' + eur(x[2], lg) : '');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  function bindMap(root, d, lg) {
    var svg = root.querySelector('.gb-map'); if (!svg) return;
    var tip = root.querySelector('.gb-tip'), t = T[lg], N = names(), P = d.latest.provinces, on = null;
    function show(el) {
      if (on) on.classList.remove('gb-on'); on = el;
      if (!el) { tip.textContent = t.hoverMap; return; }
      el.classList.add('gb-on'); var id = el.getAttribute('data-id'), p = P[id];
      tip.innerHTML = '<b>' + esc(N[id] || id) + '</b> · ' + (p ? '<b>' + eur(p[0], lg) + '</b> (' + p[1] + ' ' + esc(t.stations) + ')' + (p[3] != null ? ' · ' + esc(t.la) + ' ' + eur(p[3], lg) : '') : esc(t.noData));
    }
    function pick(ev) { var el = ev.target; show(el && el.getAttribute && el.getAttribute('data-id') ? el : null); }
    svg.addEventListener('mouseover', pick); svg.addEventListener('focusin', pick); svg.addEventListener('click', pick);
    svg.addEventListener('mouseleave', function () { show(null); });
  }
  var CACHE = null, MAPP = null;
  function load() { return CACHE || (CACHE = fetch('data/es-gasoleo-b.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function mapScript() {
    if (global.DEHESA_ES_PROVINCES) return Promise.resolve();
    return MAPP || (MAPP = new Promise(function (ok) { var s = document.createElement('script'); s.src = 'vendor/es-provinces.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
  }
  function render(el) {
    Promise.all([load(), mapScript()]).then(function (res) {
      var d = res[0]; if (!d || !d.latest || !d.history) { el.hidden = true; return; }
      var lg = lang(), t = T[lg], L = d.latest, rows = d.history.rows;
      function draw(focus) {
        var w = back(rows, L.date, 7), m = back(rows, L.date, 30), y = back(rows, L.date, 365), c = chart(d, lg);
        function ch(r) { return r ? sgn(L.b - r[1], lg) + pct((L.b / r[1] - 1) * 100, lg) + ' · ' + eur(r[1], lg) : '—'; }
        el.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div><div class="di-card di-info-card wp-card gb-card"><div class="di-info-card-title">' + esc(t.h) + '</div><div class="di-info-stat-list">' +
          row(t.today + ' · ' + dlabel(L.date, lg), '<b>' + eur(L.b, lg) + '</b> · ' + L.nb.toLocaleString(LOC[lg]) + ' ' + esc(t.st)) +
          row(t.a, eur(L.a, lg)) + row(t.gap, L.a != null ? sgn(L.b - L.a, lg) : '—') +
          row(t.w, ch(w)) + row(t.m, ch(m)) + row(t.y, ch(y)) + '</div>' + mapHtml(d, lg) + c.html +
          (global.DehesaDataTrust ? global.DehesaDataTrust.info({ src: 'MITECO (Geoportal de Gasolineras)', url: d.source.url, fq: 'daily', mk: t.mk, ty: t.ty, ob: t.ob, me: t.me, st: 'official' }, lg) : '') + '</div>' +
          '<div class="di-info-scope-note">' + esc(t.note) + '</div><div class="di-field-hint di-info-sources">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">MITECO, Geoportal de Gasolineras</a> (<a href="' + esc(d.source.catalog) + '" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>)<br>' + esc(t.cite) + '</div>';
        bindChart(el, c, lg); bindMap(el, d, lg);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-gb')) {
        el.setAttribute('data-gb', '1');
        el.addEventListener('change', function (ev) { if ((ev.target.className || '').indexOf('gb-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.gb-from'); } });
      }
    });
  }
  // sigue la visibilidad de la pestaña «España» (#in-es); se dibuja la primera vez que se abre y al cambiar de idioma
  function init() {
    var tab = document.getElementById('in-es'), el = document.getElementById('in-es-gb'); if (!tab || !el) return;
    var drawn = false;
    function sync() { el.hidden = tab.hidden; if (!tab.hidden && !drawn) { drawn = true; render(el); } }
    if (global.MutationObserver) new MutationObserver(sync).observe(tab, { attributes: true, attributeFilter: ['hidden'] });
    sync();
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); if (drawn) render(el); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  global.DehesaGasoleoB = { render: render };
})(window);
