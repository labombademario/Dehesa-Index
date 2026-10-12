/* Dehesa Index — Alemania: índice de precios de la madera de los bosques estatales (Destatis, tabla 61231-0002), mensual desde 1968. data/wood-prices-de.json. ES5.
   Es un índice (2015=100), no euros por m3. Si el fichero no carga, la pestaña no cambia. */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var T = {
    es: { h: 'Alemania: precio de la madera de los bosques estatales', badge: 'DATOS OFICIALES REALES', prod: 'Producto', from: 'Desde', all: 'Todo (1968)', last: 'Último mes', mom: 'Variación mensual', yoy: 'Variación anual', vs: 'Frente a 2015', peak: 'Máximo histórico', since: 'Histórico desde', hover: 'Pasa el cursor o toca el gráfico para ver cada mes.', unit: 'índice, 2015 = 100', chart: 'Índice de precios de productor de la madera', src: 'Fuente:', cite: 'Datenquelle: Statistisches Bundesamt (Destatis), GENESIS-Online, tabla 61231-0002, 2026; Datenlizenz Deutschland – Namensnennung – Version 2.0. Dehesa Index ha seleccionado productos y calculado las variaciones.',
      note: 'Es un índice de precios (2015 = 100), no euros por m³: dice cuánto ha subido o bajado la madera frente a 2015, no cuánto cuesta. Recoge solo la madera que venden los bosques estatales alemanes (Staatsforsten), que no es todo el mercado; los bosques privados y municipales pueden moverse distinto.',
      mk: 'Índice de precios de productor de los productos de la corta de los bosques estatales de Alemania (Staatsforsten), base 2015 = 100', ty: 'Índice (no precio en euros)', ob: 'Un mes por punto; un hueco es un mes sin dato', me: 'Dehesa Index descarga la tabla 61231-0002 de Destatis (GENESIS-Online) y guarda el total, trozas, madera industrial, leña y las trozas de cinco especies. Las variaciones las calcula Dehesa Index. La douglasia solo tiene datos desde diciembre de 2019 y la leña desde 2012.',
      p: { total: 'Madera en rollo (total)', logs: 'Trozas (madera de sierra)', pulp: 'Madera industrial (trituración)', fuel: 'Leña', spruce: 'Trozas de abeto (Fichte)', pine: 'Trozas de pino (Kiefer)', beech: 'Trozas de haya (Buche)', oak: 'Trozas de roble (Eiche)', douglas: 'Trozas de douglasia' } },
    en: { h: 'Germany: state-forest timber prices', badge: 'REAL OFFICIAL DATA', prod: 'Product', from: 'From', all: 'All (1968)', last: 'Latest month', mom: 'Monthly change', yoy: 'Annual change', vs: 'Versus 2015', peak: 'All-time high', since: 'History since', hover: 'Hover or tap the chart to read each month.', unit: 'index, 2015 = 100', chart: 'Producer price index of timber', src: 'Source:', cite: 'Datenquelle: Statistisches Bundesamt (Destatis), GENESIS-Online, table 61231-0002, 2026; Datenlizenz Deutschland – Namensnennung – Version 2.0. Dehesa Index selected products and calculated the changes.',
      note: 'This is a price index (2015 = 100), not euros per m³: it shows how far timber has risen or fallen against 2015, not what it costs. It covers only timber sold by the German state forests (Staatsforsten), which is not the whole market; private and municipal forests can move differently.',
      mk: 'Producer price index of timber products from the German state forests (Staatsforsten), base 2015 = 100', ty: 'Index (not a euro price)', ob: 'One month per point; a gap is a month without data', me: 'Dehesa Index downloads Destatis table 61231-0002 (GENESIS-Online) and keeps the total, sawlogs, industrial wood, fuelwood and the logs of five species. Changes are calculated by Dehesa Index. Douglas fir only has data from December 2019 and fuelwood from 2012.',
      p: { total: 'Roundwood (total)', logs: 'Sawlogs', pulp: 'Industrial wood (pulpwood)', fuel: 'Fuelwood', spruce: 'Spruce logs (Fichte)', pine: 'Pine logs (Kiefer)', beech: 'Beech logs (Buche)', oak: 'Oak logs (Eiche)', douglas: 'Douglas fir logs' } },
    fr: { h: 'Allemagne : prix du bois des forêts domaniales', badge: 'DONNÉES OFFICIELLES RÉELLES', prod: 'Produit', from: 'Depuis', all: 'Tout (1968)', last: 'Dernier mois', mom: 'Variation mensuelle', yoy: 'Variation annuelle', vs: 'Par rapport à 2015', peak: 'Maximum historique', since: 'Historique depuis', hover: 'Survolez ou touchez le graphique pour lire chaque mois.', unit: 'indice, 2015 = 100', chart: 'Indice des prix à la production du bois', src: 'Source :', cite: 'Datenquelle: Statistisches Bundesamt (Destatis), GENESIS-Online, tableau 61231-0002, 2026 ; Datenlizenz Deutschland – Namensnennung – Version 2.0. Dehesa Index a sélectionné les produits et calculé les variations.',
      note: 'C’est un indice de prix (2015 = 100), pas des euros par m³ : il indique de combien le bois a monté ou baissé par rapport à 2015, pas ce qu’il coûte. Il ne couvre que le bois vendu par les forêts domaniales allemandes (Staatsforsten), pas tout le marché ; les forêts privées et communales peuvent évoluer autrement.',
      mk: 'Indice des prix à la production des produits de l’exploitation des forêts domaniales allemandes (Staatsforsten), base 2015 = 100', ty: 'Indice (pas un prix en euros)', ob: 'Un mois par point ; un trou est un mois sans donnée', me: 'Dehesa Index télécharge le tableau 61231-0002 de Destatis (GENESIS-Online) et conserve le total, les grumes, le bois d’industrie, le bois de feu et les grumes de cinq essences. Les variations sont calculées par Dehesa Index. Le douglas n’a de données que depuis décembre 2019 et le bois de feu depuis 2012.',
      p: { total: 'Bois rond (total)', logs: 'Grumes (bois de sciage)', pulp: 'Bois d’industrie (trituration)', fuel: 'Bois de feu', spruce: 'Grumes d’épicéa (Fichte)', pine: 'Grumes de pin (Kiefer)', beech: 'Grumes de hêtre (Buche)', oak: 'Grumes de chêne (Eiche)', douglas: 'Grumes de douglas' } },
    it: { h: 'Germania: prezzo del legname delle foreste statali', badge: 'DATI UFFICIALI REALI', prod: 'Prodotto', from: 'Dal', all: 'Tutto (1968)', last: 'Ultimo mese', mom: 'Variazione mensile', yoy: 'Variazione annua', vs: 'Rispetto al 2015', peak: 'Massimo storico', since: 'Storico dal', hover: 'Passa il cursore o tocca il grafico per leggere ogni mese.', unit: 'indice, 2015 = 100', chart: 'Indice dei prezzi alla produzione del legname', src: 'Fonte:', cite: 'Datenquelle: Statistisches Bundesamt (Destatis), GENESIS-Online, tabella 61231-0002, 2026; Datenlizenz Deutschland – Namensnennung – Version 2.0. Dehesa Index ha selezionato i prodotti e calcolato le variazioni.',
      note: 'È un indice di prezzi (2015 = 100), non euro per m³: indica di quanto il legname è salito o sceso rispetto al 2015, non quanto costa. Copre solo il legname venduto dalle foreste statali tedesche (Staatsforsten), non tutto il mercato; le foreste private e comunali possono muoversi diversamente.',
      mk: 'Indice dei prezzi alla produzione dei prodotti del taglio delle foreste statali tedesche (Staatsforsten), base 2015 = 100', ty: 'Indice (non un prezzo in euro)', ob: 'Un mese per punto; un vuoto è un mese senza dato', me: 'Dehesa Index scarica la tabella 61231-0002 di Destatis (GENESIS-Online) e conserva il totale, i tronchi, il legname industriale, la legna da ardere e i tronchi di cinque specie. Le variazioni sono calcolate da Dehesa Index. La douglasia ha dati solo da dicembre 2019 e la legna da ardere dal 2012.',
      p: { total: 'Legname tondo (totale)', logs: 'Tronchi da sega', pulp: 'Legname industriale (triturazione)', fuel: 'Legna da ardere', spruce: 'Tronchi di abete rosso (Fichte)', pine: 'Tronchi di pino (Kiefer)', beech: 'Tronchi di faggio (Buche)', oak: 'Tronchi di quercia (Eiche)', douglas: 'Tronchi di douglasia' } }
  };
  var ORDER = ['total', 'logs', 'pulp', 'fuel', 'spruce', 'pine', 'beech', 'oak', 'douglas'];
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  var MN = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'] };
  var st = { prod: 'total', from: 1968 };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lang() { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; }
  function n1(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function pct(v, lg) { if (v == null) return '—'; return v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' }).replace('-', '−') + ' %'; }
  function mlabel(m, lg) { return MN[lg][parseInt(m.slice(5), 10) - 1] + ' ' + m.slice(0, 4); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function lastIdx(v) { for (var i = v.length - 1; i >= 0; i--) if (v[i] != null) return i; return -1; }
  function firstIdx(v) { for (var i = 0; i < v.length; i++) if (v[i] != null) return i; return -1; }
  function ratio(a, b) { return a != null && b ? (a / b - 1) * 100 : null; }
  function build(d, lg) {
    var t = T[lg], ms = d.months, s = d.series[st.prod], li = lastIdx(s), fi = firstIdx(s), n = ms.length, i;
    var start = Math.max(fi, 0); for (i = 0; i < n; i++) if (parseInt(ms[i].slice(0, 4), 10) >= st.from) { start = Math.max(start, i); break; }
    var W = 560, H = 220, L = 38, R = 8, Tp = 10, B = 24, cnt = n - start, hi = 0;
    for (i = start; i < n; i++) if (s[i] != null && s[i] > hi) hi = s[i];
    var step = hi > 150 ? 50 : 25; hi = Math.ceil(hi / step) * step;
    var X = function (k) { return L + (k - start) / (n - 1 - start) * (W - L - R); }, Y = function (v) { return Tp + (hi - v) / hi * (H - Tp - B); };
    var grid = ''; for (var gv = 0; gv <= hi; gv += step) grid += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(gv).toFixed(1) + '" y2="' + Y(gv).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(gv) + 3.5).toFixed(1) + '" text-anchor="end">' + gv + '</text>';
    var span = parseInt(ms[n - 1].slice(0, 4), 10) - parseInt(ms[start].slice(0, 4), 10), ev = span > 40 ? 10 : span > 15 ? 5 : 2, xt = '';
    for (i = start; i < n; i++) if (ms[i].slice(5) === '01' && parseInt(ms[i].slice(0, 4), 10) % ev === 0) xt += '<line class="wp-grid wp-grid-v" x1="' + X(i).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + X(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + ms[i].slice(0, 4) + '</text>';
    var p = '', open = false; for (i = start; i < n; i++) { if (s[i] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(s[i]).toFixed(1); open = true; }
    var yr = li >= 12 ? s[li - 12] : null, pk = 0, pi = -1; for (i = 0; i < n; i++) if (s[i] != null && s[i] >= pk) { pk = s[i]; pi = i; }
    var base = 0, c = 0; for (i = 0; i < n; i++) if (ms[i].slice(0, 4) === '2015' && s[i] != null) { base += s[i]; c++; }
    var psel = '<label class="wp-sel"><span>' + esc(t.prod) + '</span><select class="di-compare-select wd-prod" aria-label="' + esc(t.prod) + '">' + ORDER.map(function (k) { return '<option value="' + k + '"' + (k === st.prod ? ' selected' : '') + '>' + esc(t.p[k]) + '</option>'; }).join('') + '</select></label>';
    var fsel = '<label class="wp-sel"><span>' + esc(t.from) + '</span><select class="di-compare-select wd-from" aria-label="' + esc(t.from) + '">' + [[1968, t.all], [2000, '2000'], [2015, '2015'], [2020, '2020']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === st.from ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
    var html = '<div class="di-card di-info-card wp-card wr-card"><div class="di-info-card-title">' + esc(t.h) + '</div><div class="wd-sels">' + psel + fsel + '</div><div class="di-info-stat-list">' +
      row(t.last + ' · ' + mlabel(ms[li], lg), '<b>' + n1(s[li], lg) + '</b> ' + esc(t.unit)) +
      row(t.mom, pct(ratio(s[li], li > 0 ? s[li - 1] : null), lg)) + row(t.yoy, pct(ratio(s[li], yr), lg)) +
      row(t.vs, c ? pct(ratio(s[li], base / c), lg) : '—') + row(t.peak, '<b>' + n1(pk, lg) + '</b> · ' + esc(pi >= 0 ? mlabel(ms[pi], lg) : '')) + '</div>' +
      '<div class="wp-hist">' + esc(t.since) + ' ' + esc(mlabel(ms[fi], lg)) + '</div>' +
      '<div class="wp-chart wd-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.chart + ' — ' + t.p[st.prod]) + '" class="wp-svg">' + grid + xt +
      '<path class="wp-line wp-line-t" d="' + p + '"/><circle class="wp-dot wp-dot-t" cx="' + X(li).toFixed(1) + '" cy="' + Y(s[li]).toFixed(1) + '" r="3.5"/>' +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="wp-legend"><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' +
      (global.DehesaDataTrust ? global.DehesaDataTrust.info({ src: 'Destatis (GENESIS-Online 61231-0002)', url: d.source.url, fq: 'monthly', mk: t.mk, ty: t.ty, ob: t.ob, me: t.me, st: 'official' }, lg) : '') + '</div>';
    return { html: html, s: s, ms: ms, start: start, n: n, W: W, L: L, R: R };
  }
  function bind(root, b, lg) {
    var box = root.querySelector('.wd-chart'); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), t = T[lg];
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * b.W;
      var k = Math.max(b.start, Math.min(b.n - 1, b.start + Math.round((vx - b.L) / (b.W - b.L - b.R) * (b.n - 1 - b.start)))), px = b.L + (k - b.start) / (b.n - 1 - b.start) * (b.W - b.L - b.R);
      cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(mlabel(b.ms[k], lg)) + '</b> · ' + (b.s[k] == null ? '—' : '<b>' + n1(b.s[k], lg) + '</b> (' + esc(t.unit) + ')');
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function load() { return CACHE || (CACHE = fetch('data/wood-prices-de.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function render(el) {
    if (!el) return;
    load().then(function (d) {
      if (!d || !d.series || !d.series.total || !d.months) return;
      var lg = lang(), t = T[lg];
      function draw(focus) {
        var b = build(d, lg);
        el.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div>' + b.html + '<div class="di-info-scope-note">' + esc(t.note) + '</div><div class="di-field-hint di-info-sources">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">Destatis (GENESIS-Online 61231-0002)</a><br>' + esc(t.cite) + '</div>';
        bind(el, b, lg);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-wd')) {
        el.setAttribute('data-wd', '1');
        el.addEventListener('change', function (ev) {
          var c = ev.target && ev.target.className || '';
          if (c.indexOf('wd-prod') >= 0) { st.prod = ev.target.value; draw('.wd-prod'); }
          else if (c.indexOf('wd-from') >= 0) { st.from = parseInt(ev.target.value, 10); draw('.wd-from'); }
        });
      }
    });
  }
  global.DehesaWoodDE = { render: render };
})(window);
