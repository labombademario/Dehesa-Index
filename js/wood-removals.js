/* Dehesa Index — Cortas de madera en rollo (Eurostat for_remov): Alemania, Italia, España y Francia, con histórico anual. data/wood-removals.json. ES5.
   Es un volumen (miles de m3 sin corteza), no un precio. Si el fichero no carga, la pestaña no cambia. */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var T = {
    es: { h: 'Cortas de madera en rollo', badge: 'DATOS OFICIALES REALES', country: 'País', total: 'Total', conif: 'Coníferas', broad: 'Frondosas', last: 'Último año', yoy: 'Variación anual', ind: 'Industrial (trozas, trituración y otros)', fw: 'Leña', shareFw: 'Parte que va a leña', logs: 'Trozas', pulp: 'Madera para trituración', unit: 'miles de m³ sin corteza', hover: 'Pasa el cursor o toca el gráfico para ver cada año.', est: 'Dato estimado por la fuente', since: 'Histórico desde', note: 'Es el volumen que se corta cada año, no un precio. Los países declaran a Eurostat con distinta puntualidad: el último año de cada uno puede ser provisional y algún año puede faltar.', src: 'Fuente:', chart: 'Cortas anuales de madera en rollo', names: { DE: 'Alemania', IT: 'Italia', ES: 'España', FR: 'Francia' },
      mk: 'Cortas anuales de madera en rollo declaradas por cada país a Eurostat (cuestionario conjunto del sector forestal con FAO, UNECE e ITTO), en miles de m³ sin corteza', ty: 'Volumen anual (no precio)', ob: 'Cada país, un año por fila; un hueco es un año no declarado', me: 'Dehesa Index descarga el conjunto for_remov de Eurostat y guarda el total, coníferas, frondosas, uso industrial y leña. Las variaciones las calcula Dehesa Index. El agregado de la UE-27 de este conjunto solo llega a 2016, por eso no se muestra.' },
    en: { h: 'Roundwood removals', badge: 'REAL OFFICIAL DATA', country: 'Country', total: 'Total', conif: 'Conifers', broad: 'Broadleaves', last: 'Latest year', yoy: 'Annual change', ind: 'Industrial (logs, pulpwood and other)', fw: 'Fuelwood', shareFw: 'Share going to fuelwood', logs: 'Sawlogs and veneer logs', pulp: 'Pulpwood', unit: 'thousand m³ under bark', hover: 'Hover or tap the chart to read each year.', est: 'Estimated by the source', since: 'History since', note: 'This is the volume cut each year, not a price. Countries report to Eurostat with different timing: the latest year of each may be provisional and a year may be missing.', src: 'Source:', chart: 'Annual roundwood removals', names: { DE: 'Germany', IT: 'Italy', ES: 'Spain', FR: 'France' },
      mk: 'Annual roundwood removals reported by each country to Eurostat (Joint Forest Sector Questionnaire with FAO, UNECE and ITTO), in thousand m³ under bark', ty: 'Annual volume (not a price)', ob: 'One year per row; a gap is a year not reported', me: 'Dehesa Index downloads the Eurostat for_remov dataset and keeps total, conifers, broadleaves, industrial use and fuelwood. Changes are calculated by Dehesa Index. The EU-27 aggregate in this dataset only reaches 2016, so it is not shown.' },
    fr: { h: 'Récolte de bois rond', badge: 'DONNÉES OFFICIELLES RÉELLES', country: 'Pays', total: 'Total', conif: 'Résineux', broad: 'Feuillus', last: 'Dernière année', yoy: 'Variation annuelle', ind: 'Industriel (grumes, trituration et autres)', fw: 'Bois de feu', shareFw: 'Part destinée au bois de feu', logs: 'Grumes', pulp: 'Bois de trituration', unit: 'milliers de m³ sans écorce', hover: 'Survolez ou touchez le graphique pour lire chaque année.', est: 'Estimé par la source', since: 'Historique depuis', note: 'C’est le volume récolté chaque année, pas un prix. Les pays déclarent à Eurostat avec des délais différents : la dernière année de chacun peut être provisoire et une année peut manquer.', src: 'Source :', chart: 'Récolte annuelle de bois rond', names: { DE: 'Allemagne', IT: 'Italie', ES: 'Espagne', FR: 'France' },
      mk: 'Récolte annuelle de bois rond déclarée par chaque pays à Eurostat (questionnaire conjoint du secteur forestier avec la FAO, la CEE-ONU et l’OIBT), en milliers de m³ sans écorce', ty: 'Volume annuel (pas un prix)', ob: 'Une année par ligne ; un trou est une année non déclarée', me: 'Dehesa Index télécharge le jeu for_remov d’Eurostat et conserve le total, les résineux, les feuillus, l’usage industriel et le bois de feu. Les variations sont calculées par Dehesa Index. L’agrégat UE-27 de ce jeu ne dépasse pas 2016 : il n’est donc pas affiché.' },
    it: { h: 'Tagli di legname tondo', badge: 'DATI UFFICIALI REALI', country: 'Paese', total: 'Totale', conif: 'Conifere', broad: 'Latifoglie', last: 'Ultimo anno', yoy: 'Variazione annua', ind: 'Industriale (tronchi, triturazione e altro)', fw: 'Legna da ardere', shareFw: 'Quota destinata a legna da ardere', logs: 'Tronchi da sega e da trancia', pulp: 'Legname da triturazione', unit: 'migliaia di m³ senza corteccia', hover: 'Passa il cursore o tocca il grafico per leggere ogni anno.', est: 'Stimato dalla fonte', since: 'Storico dal', note: 'È il volume tagliato ogni anno, non un prezzo. I paesi dichiarano a Eurostat con tempi diversi: l’ultimo anno di ciascuno può essere provvisorio e un anno può mancare.', src: 'Fonte:', chart: 'Tagli annui di legname tondo', names: { DE: 'Germania', IT: 'Italia', ES: 'Spagna', FR: 'Francia' },
      mk: 'Tagli annui di legname tondo dichiarati da ciascun paese a Eurostat (questionario congiunto del settore forestale con FAO, UNECE e ITTO), in migliaia di m³ senza corteccia', ty: 'Volume annuo (non un prezzo)', ob: 'Un anno per riga; un vuoto è un anno non dichiarato', me: 'Dehesa Index scarica il set for_remov di Eurostat e conserva totale, conifere, latifoglie, uso industriale e legna da ardere. Le variazioni sono calcolate da Dehesa Index. L’aggregato UE-27 di questo set arriva solo al 2016, quindi non è mostrato.' }
  };
  var ES = {
    es: { eh: 'España: cortas y valor según el MITECO (2001-2021)', en: 'Dato puntual del Anuario de Estadística Forestal 2021, no una serie que se actualice. El volumen es con corteza, por eso no coincide con el de Eurostat (sin corteza). El valor es el que calcula el MITECO en cargadero con un precio medio estimado; no es un precio de mercado.', ey: 'Año', ec: 'Cortas (miles de m³ con corteza)', ev: 'Valor en cargadero (miles de €)', el: 'Leñas (miles de t)', elv: 'Valor de la leña (miles de €)', ee: '* valor estimado por el MITECO', },
    en: { eh: 'Spain: removals and value per MITECO (2001-2021)', en: 'One-off figures from the 2021 Forestry Statistics Yearbook, not a series that gets updated. Volume is over bark, so it differs from Eurostat (under bark). Value is MITECO’s roadside estimate from an estimated average price; it is not a market price.', ey: 'Year', ec: 'Removals (thousand m³ over bark)', ev: 'Roadside value (€ thousand)', el: 'Fuelwood (thousand t)', elv: 'Fuelwood value (€ thousand)', ee: '* value estimated by MITECO', },
    fr: { eh: 'Espagne : récoltes et valeur selon le MITECO (2001-2021)', en: 'Chiffres ponctuels de l’annuaire de statistique forestière 2021, pas une série mise à jour. Le volume est avec écorce, il diffère donc d’Eurostat (sans écorce). La valeur est l’estimation du MITECO départ route à partir d’un prix moyen estimé ; ce n’est pas un prix de marché.', ey: 'Année', ec: 'Récoltes (milliers de m³ avec écorce)', ev: 'Valeur départ route (milliers d’€)', el: 'Bois de feu (milliers de t)', elv: 'Valeur du bois de feu (milliers d’€)', ee: '* valeur estimée par le MITECO', },
    it: { eh: 'Spagna: tagli e valore secondo il MITECO (2001-2021)', en: 'Dati puntuali dell’Annuario di statistica forestale 2021, non una serie aggiornata. Il volume è con corteccia, perciò differisce da Eurostat (senza corteccia). Il valore è la stima del MITECO a bordo strada da un prezzo medio stimato; non è un prezzo di mercato.', ey: 'Anno', ec: 'Tagli (migliaia di m³ con corteccia)', ev: 'Valore a bordo strada (migliaia di €)', el: 'Legna (migliaia di t)', elv: 'Valore della legna (migliaia di €)', ee: '* valore stimato dal MITECO', },
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lang() { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; }
  function n0(v, lg) { return v == null ? '—' : Math.round(v).toLocaleString(LOC[lg]); }
  function pct(v, lg, d) { if (v == null) return '—'; return v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d, signDisplay: 'exceptZero' }).replace('-', '−') + ' %'; }
  function readLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function home() { var loc = readLS('dehesaIndexLocation'), c = (readLS('dehesaIndexEuCountry') || '').toUpperCase(); return loc === 'eu' && /^[A-Z]{2}$/.test(c) ? c : 'ES'; }
  function nm(code, lg) { try { return new Intl.DisplayNames([lg || lang()], { type: 'region' }).of(code === 'EL' ? 'GR' : code); } catch (e) { return code; } }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function lastIdx(v) { for (var i = v.length - 1; i >= 0; i--) if (v[i] != null) return i; return -1; }
  function build(d, cc, lg) {
    var t = T[lg], c = d.countries[cc], s = c.series, y = d.years, n = y.length, W = 560, H = 210, L = 44, R = 8, Tp = 10, B = 24, i;
    var tot = s['TOTAL.RW'], li = lastIdx(tot), pi = li - 1, est = c.estimated.indexOf(y[li]) >= 0;
    var vals = []; ['TOTAL.RW', 'CONIF.RW', 'NCONIF.RW'].forEach(function (k) { s[k].forEach(function (x) { if (x != null) vals.push(x); }); });
    var step = 10000, lo = 0, hi = Math.ceil(Math.max.apply(null, vals) / step) * step; if (hi / step > 8) step = 20000, hi = Math.ceil(Math.max.apply(null, vals) / step) * step; if (hi - lo < 10000) { hi = 10000; step = 2500; }
    var X = function (k) { return L + k / (n - 1) * (W - L - R); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); };
    var grid = ''; for (var gv = lo; gv <= hi + 1; gv += step) grid += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(gv).toFixed(1) + '" y2="' + Y(gv).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(gv) + 3.5).toFixed(1) + '" text-anchor="end">' + n0(gv, lg) + '</text>';
    var xt = ''; for (i = 0; i < n; i++) if (y[i] % 5 === 0) xt += '<line class="wp-grid wp-grid-v" x1="' + X(i).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '"/><text class="wp-tick" x="' + X(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + y[i] + '</text>';
    var line = function (k) { var p = '', open = false; s[k].forEach(function (v, j) { if (v == null) { open = false; return; } p += (open ? 'L' : 'M') + X(j).toFixed(1) + ' ' + Y(v).toFixed(1); open = true; }); return p; };
    var dot = function (k, cls) { var j = lastIdx(s[k]); return j < 0 ? '' : '<circle class="wp-dot ' + cls + '" cx="' + X(j).toFixed(1) + '" cy="' + Y(s[k][j]).toFixed(1) + '" r="3.5"/>'; };
    var sel = '<label class="wp-sel"><span>' + esc(t.country) + '</span><select class="di-compare-select wr-cc" data-chips aria-label="' + esc(t.country) + '">' + Object.keys(d.countries).sort(function (a, b) { return nm(a, lg).localeCompare(nm(b, lg), LOC[lg]); }).map(function (k) { return '<option value="' + k + '"' + (k === cc ? ' selected' : '') + '>' + esc(nm(k, lg)) + '</option>'; }).join('') + '</select></label>';
    var ind = s['TOTAL.RW_IN'][li], fw = s['TOTAL.RW_FW'][li], first = 0; while (tot[first] == null) first++;
    var html = '<div class="di-card di-info-card wp-card wr-card"><div class="di-info-card-title">' + esc(t.h + ' — ' + nm(cc, lg) + ' (' + y[li] + ')') + '</div>' + sel + '<div class="di-info-stat-list">' +
      row(t.total + ' · ' + y[li] + (est ? ' *' : ''), '<b>' + n0(tot[li], lg) + '</b> ' + esc(t.unit)) +
      row(t.yoy, pct(pi >= 0 && tot[pi] ? (tot[li] / tot[pi] - 1) * 100 : null, lg, 1)) +
      row(t.conif, n0(s['CONIF.RW'][li], lg)) + row(t.broad, n0(s['NCONIF.RW'][li], lg)) +
      row(t.logs, n0(s['TOTAL.RW_IN_LG'][li], lg)) + row(t.pulp, n0(s['TOTAL.RW_IN_PW'][li], lg)) + row(t.fw, n0(fw, lg)) +
      row(t.shareFw, pct(fw != null && tot[li] ? fw / tot[li] * 100 : null, lg, 0).replace('+', '')) + '</div>' +
      '<div class="wp-hist">' + esc(t.since) + ' ' + y[first] + (est ? ' · * ' + esc(t.est) : '') + '</div>' +
      '<div class="wp-chart wr-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.chart) + '" class="wp-svg">' + grid + xt +
      '<path class="wp-line wp-line-w" d="' + line('CONIF.RW') + '"/><path class="wp-line wp-line-r" d="' + line('NCONIF.RW') + '"/><path class="wp-line wp-line-t" d="' + line('TOTAL.RW') + '"/>' + dot('TOTAL.RW', 'wp-dot-t') +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="wp-legend"><span><i class="wp-sw wp-sw-t"></i>' + esc(t.total) + '</span><span><i class="wp-sw wp-sw-w"></i>' + esc(t.conif) + '</span><span><i class="wp-sw wp-sw-r"></i>' + esc(t.broad) + '</span><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' +
      (global.DehesaDataTrust ? global.DehesaDataTrust.info({ src: d.source.name, url: d.source.url, fq: 'annual', mk: t.mk, ty: t.ty, ob: t.ob, me: t.me, st: 'official' }, lg) : '') + '</div>';
    return { html: html, c: c, s: s, y: y, W: W, L: L, R: R, n: n };
  }
  function bind(root, b, lg) {
    var box = root.querySelector('.wr-chart'); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), t = T[lg];
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * b.W;
      var k = Math.max(0, Math.min(b.n - 1, Math.round((vx - b.L) / (b.W - b.L - b.R) * (b.n - 1)))), px = b.L + k / (b.n - 1) * (b.W - b.L - b.R);
      cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + b.y[k] + '</b>' + (b.c.estimated.indexOf(b.y[k]) >= 0 ? ' *' : '') + ' · ' + esc(t.total) + ' <b>' + n0(b.s['TOTAL.RW'][k], lg) + '</b> · ' + esc(t.conif) + ' <b>' + n0(b.s['CONIF.RW'][k], lg) + '</b> · ' + esc(t.broad) + ' <b>' + n0(b.s['NCONIF.RW'][k], lg) + '</b> (' + esc(t.unit) + ')';
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function load() { return CACHE || (CACHE = fetch('data/wood-removals.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  var ESC_ = null;
  function esLoad() { return ESC_ || (ESC_ = fetch('data/es-forest-products-anuario2021.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function esBlock(f, lg) {
    var n0 = function (v) { return v == null ? '—' : Math.round(v).toLocaleString(LOC[lg], { useGrouping: 'always' }); };
    var t = ES[lg], fw = {}, th = function (x) { return '<th style="text-align:right;padding:4px 8px">' + esc(x) + '</th>'; }, td = function (x) { return '<td style="text-align:right;padding:4px 8px">' + x + '</td>'; };
    f.firewood.forEach(function (r) { fw[r.year] = r; });
    var rows = f.wood.slice().reverse().map(function (r) { var l = fw[r.year] || {}; return '<tr>' + td('<b>' + r.year + '</b>') + td(n0(r.total)) + td(n0(r.valor) + (r.est ? ' *' : '')) + td(n0(l.production)) + td(n0(l.value) + (l.est ? ' *' : '')) + '</tr>'; }).join('');
    return '<details class="di-card di-info-card" style="margin-top:12px"><summary style="cursor:pointer"><b>' + esc(t.eh) + '</b></summary><p class="di-field-hint" style="margin:8px 0">' + esc(t.en) + '</p><div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%"><thead><tr>' + th(t.ey) + th(t.ec) + th(t.ev) + th(t.el) + th(t.elv) + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="di-field-hint" style="margin:6px 0 0">' + esc(t.ee) + ' · <a href="' + esc(f.source.url) + '" target="_blank" rel="noopener">' + esc(f.source.name) + '</a></p></details>';
  }
  function render(el) {
    if (!el) return;
    load().then(function (d) {
      if (!d || !d.countries || !d.countries.ES) return;
      var lg = lang(), t = T[lg], cc = home();
      function draw(code) {
        var b = build(d, code, lg);
        el.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div>' + b.html + '<div class="di-info-scope-note">' + esc(t.note) + '</div><div class="di-field-hint di-info-sources">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">Eurostat (for_remov)</a></div>';
        bind(el, b, lg);
        if (code === 'ES') esLoad().then(function (f) { if (f && f.wood && el.querySelector('.wr-card')) el.insertAdjacentHTML('beforeend', esBlock(f, lg)); });
      }
      if (!d.countries[cc]) {
        var NO = { es: ['No tenemos datos de cortas de madera de {c}.', 'Elige otro país para ver sus cifras:'], en: ['We have no roundwood removals data for {c}.', 'Pick another country to see its figures:'], fr: ['Nous n’avons pas de données de récolte de bois pour {c}.', 'Choisissez un autre pays pour voir ses chiffres :'], it: ['Non abbiamo dati sui tagli di legname per {c}.', 'Scegli un altro paese per vedere le sue cifre:'] }[lg];
        var ks = Object.keys(d.countries).sort(function (a, b) { return nm(a, lg).localeCompare(nm(b, lg), LOC[lg]); });
        el.innerHTML = '<div class="di-info-scope-note">' + esc(NO[0].replace('{c}', nm(cc, lg))) + '</div><label class="wp-sel"><span>' + esc(NO[1]) + '</span><select class="di-compare-select wr-cc" aria-label="' + esc(t.country) + '"><option value="">—</option>' + ks.map(function (k) { return '<option value="' + k + '">' + esc(nm(k, lg)) + '</option>'; }).join('') + '</select></label>';
      } else draw(cc);
      el.addEventListener('change', function (ev) { if (ev.target && ev.target.className.indexOf('wr-cc') >= 0 && ev.target.value) { draw(ev.target.value); var s2 = el.querySelector('.wr-cc'); if (s2) s2.focus(); } });
    });
  }
  global.DehesaWood = { render: render };
})(window);
