/* Dehesa Index — Oferta y demanda. Lee data/supply-demand.json (USDA PSD). */
(function () {
  'use strict';
  var P = window.DehesaPSD, DATA = null, SEL = { c: 'trigo', my: null, ent: '__world', rank: 'production' };
  var C1 = '#2a6f97', C2 = '#b8651b', C3 = '#2b7a78';
  var T = {
    es: { title: 'Oferta y demanda', sub: 'Producción, consumo, comercio y existencias por país. Datos oficiales de USDA (PSD), actualizados cada mes con el informe WASDE.', yT1: 'kt · Mt', yT2: '% del consumo', product: 'Producto', year: 'Campaña', forecast: 'previsión', estimate: 'estimación', vs: 'vs. campaña anterior', stu: 'Existencias / consumo', stuHint: 'existencias finales como % del consumo', balance: 'Balance mundial', item: 'Concepto', prev: 'Anterior', chg: 'Var.', rank: 'Ranking de países', share: 'del total', chart1: 'Producción y consumo', chart2: 'Existencias sobre consumo', entity: 'Zona', mapLink: 'Ver producción y exportaciones en el mapa', unit: 'Cifras en', ktons: 'miles de toneladas (carne: equivalente canal)', khá: 'miles de hectáreas', noData: 'Sin datos de oferta y demanda por ahora.', updated: 'Publicado', cal: 'Campaña = año natural.', split: 'Campaña comercial: 2025/26 empieza en 2025.', src: 'Fuente: USDA Foreign Agricultural Service, PSD Online (CC BY 4.0). Métodos y avisos en',  methodLink: 'Metodología', caveat: 'La campaña más reciente es una previsión que USDA revisa cada mes. “Mundo” es la suma de los países de PSD (la UE cuenta una vez), no una cifra oficial de USDA. Las campañas comerciales no coinciden entre países y el comercio mundial no siempre cuadra porque exportaciones e importaciones se declaran por separado.', listed: 'Los países listados suman', of: 'del total' },
    en: { title: 'Supply and demand', sub: 'Production, consumption, trade and stocks by country. Official USDA data (PSD), updated monthly with the WASDE report.', yT1: 'kt · Mt', yT2: '% of use', product: 'Product', year: 'Marketing year', forecast: 'forecast', estimate: 'estimate', vs: 'vs. previous year', stu: 'Stocks-to-use', stuHint: 'ending stocks as a % of consumption', balance: 'World balance', item: 'Item', prev: 'Previous', chg: 'Chg.', rank: 'Country ranking', share: 'of total', chart1: 'Production and consumption', chart2: 'Stocks-to-use', entity: 'Area', mapLink: 'See production and exports on the map', unit: 'Figures in', ktons: 'thousand tonnes (meat: carcass-weight equivalent)', khá: 'thousand hectares', noData: 'No supply and demand data yet.', updated: 'Published', cal: 'Marketing year = calendar year.', split: 'Marketing year: 2025/26 starts in 2025.', src: 'Source: USDA Foreign Agricultural Service, PSD Online (CC BY 4.0). Methods and notices in', methodLink: 'Methodology', caveat: 'The latest marketing year is a forecast that USDA revises every month. “World” is the sum of PSD countries (the EU counts once), not an official USDA figure. Marketing years differ between countries and world trade does not always balance because exports and imports are reported separately.', listed: 'Listed countries add up to', of: 'of the total' },
    fr: { title: 'Offre et demande', sub: 'Production, consommation, commerce et stocks par pays. Données officielles de l’USDA (PSD), mises à jour chaque mois avec le rapport WASDE.', yT1: 'kt · Mt', yT2: '% de l’utilisation', product: 'Produit', year: 'Campagne', forecast: 'prévision', estimate: 'estimation', vs: 'vs. campagne précédente', stu: 'Stocks / consommation', stuHint: 'stocks finaux en % de la consommation', balance: 'Bilan mondial', item: 'Poste', prev: 'Précédente', chg: 'Var.', rank: 'Classement des pays', share: 'du total', chart1: 'Production et consommation', chart2: 'Stocks sur consommation', entity: 'Zone', mapLink: 'Voir production et exportations sur la carte', unit: 'Chiffres en', ktons: 'milliers de tonnes (viande : équivalent carcasse)', khá: 'milliers d’hectares', noData: 'Pas encore de données d’offre et de demande.', updated: 'Publié', cal: 'Campagne = année civile.', split: 'Campagne commerciale : 2025/26 commence en 2025.', src: 'Source : USDA Foreign Agricultural Service, PSD Online (CC BY 4.0). Méthodes et avertissements dans', methodLink: 'Méthodologie', caveat: 'La campagne la plus récente est une prévision que l’USDA révise chaque mois. « Monde » est la somme des pays de PSD (l’UE compte une fois), pas un chiffre officiel de l’USDA. Les campagnes diffèrent selon les pays et le commerce mondial ne s’équilibre pas toujours car exportations et importations sont déclarées séparément.', listed: 'Les pays listés représentent', of: 'du total' },
    it: { title: 'Offerta e domanda', sub: 'Produzione, consumo, commercio e scorte per paese. Dati ufficiali USDA (PSD), aggiornati ogni mese con il rapporto WASDE.', yT1: 'kt · Mt', yT2: '% dell’utilizzo', product: 'Prodotto', year: 'Campagna', forecast: 'previsione', estimate: 'stima', vs: 'vs. campagna precedente', stu: 'Scorte / consumo', stuHint: 'scorte finali in % del consumo', balance: 'Bilancio mondiale', item: 'Voce', prev: 'Precedente', chg: 'Var.', rank: 'Classifica dei paesi', share: 'del totale', chart1: 'Produzione e consumo', chart2: 'Scorte sul consumo', entity: 'Area', mapLink: 'Vedi produzione ed esportazioni sulla mappa', unit: 'Cifre in', ktons: 'migliaia di tonnellate (carne: equivalente carcassa)', khá: 'migliaia di ettari', noData: 'Ancora nessun dato di offerta e domanda.', updated: 'Pubblicato', cal: 'Campagna = anno solare.', split: 'Campagna commerciale: 2025/26 inizia nel 2025.', src: 'Fonte: USDA Foreign Agricultural Service, PSD Online (CC BY 4.0). Metodi e avvisi in', methodLink: 'Metodologia', caveat: 'La campagna più recente è una previsione che l’USDA rivede ogni mese. “Mondo” è la somma dei paesi PSD (la UE conta una volta), non una cifra ufficiale USDA. Le campagne differiscono tra paesi e il commercio mondiale non sempre quadra perché esportazioni e importazioni sono dichiarate separatamente.', listed: 'I paesi elencati sommano', of: 'del totale' }
  };
  function t() { return T[window.DehesaShared.getLang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function com() { for (var i = 0; i < DATA.commodities.length; i++) if (DATA.commodities[i].id === SEL.c) return DATA.commodities[i]; return DATA.commodities[0]; }
  function years(c, ent) { return ent === '__world' ? c.world : (c.countries[ent] ? c.countries[ent].years : {}); }
  function val(c, ent, my, a) { var y = years(c, ent)[my]; var v = y && y[a]; return typeof v === 'number' ? v : null; }
  function stuOf(c, ent, my) { var e = val(c, ent, my, 'endingStocks'), u = val(c, ent, my, 'consumption'); return e !== null && u ? e / u * 100 : null; }
  function pct(a, b) { return a !== null && b ? (a - b) / Math.abs(b) * 100 : null; }
  function tag(c, my, x) { return my === c.latestMarketYear ? x.forecast : ''; }
  function entities(c) {
    var arr = Object.keys(c.countries).map(function (n) { var k = c.countries[n]; return { key: n, name: k.iso ? P.countryName(k.iso, n) : n, p: val(c, n, SEL.my, 'production') || 0 }; });
    arr.sort(function (a, b) { return b.p - a.p || a.name.localeCompare(b.name); });
    return arr;
  }
  function card(label, v, chg, hint) {
    return '<div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)">' + esc(label.toUpperCase()) + '</div><div style="font-family:\'Source Serif 4\',serif;font-size:28px;font-weight:600;margin:4px 0 2px">' + v + '</div><div style="font-size:12.5px;color:var(--text-faint)">' + (chg || '') + '</div>' + (hint ? '<div style="font-size:11.5px;color:var(--text-faint)">' + esc(hint) + '</div>' : '') + '</div>';
  }
  function chgTxt(a, b, x) { var p = pct(a, b); return p === null ? '' : P.sgnPct(p) + ' ' + x.vs; }

  // ---- gráfico de líneas SVG con cruz y tooltip
  function lineChart(id, ys, series, isPct, c) {
    var W = 640, H = 220, L = 60, R = 14, Tp = 14, B = 46, all = [];
    series.forEach(function (s) { s.v.forEach(function (v) { if (v !== null) all.push(v); }); });
    if (!all.length) return '';
    var mn = isPct ? 0 : Math.min.apply(null, all), mx = Math.max.apply(null, all);
    if (!isPct) mn = Math.max(0, mn - (mx - mn) * 0.15); else mn = Math.min(0, mn);
    if (mx === mn) mx = mn + 1;
    var span = mx - mn, x = function (i) { return L + i * (W - L - R) / Math.max(1, ys.length - 1); }, y = function (v) { return Tp + (mx - v) / span * (H - Tp - B); };
    var g = '', i, k;
    for (k = 0; k <= 4; k++) { var gv = mn + span * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(gv) + '" y2="' + y(gv) + '" stroke="var(--border)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (y(gv) + 4) + '" text-anchor="end" font-size="10.5" fill="var(--text-faint)">' + (isPct ? P.nf(gv, 0) + ' %' : P.nf(gv >= 1000 ? gv / 1000 : gv, gv >= 10000 ? 0 : gv >= 1000 ? 1 : 0) + (gv >= 1000 ? ' Mt' : '')) + '</text>'; }
    for (i = 0; i < ys.length; i++) if (i === 0 || i === ys.length - 1 || i % 3 === 0 && i <= ys.length - 3) g += '<text x="' + x(i) + '" y="' + (H - B + 17) + '" text-anchor="' + (i === ys.length - 1 ? 'end' : 'middle') + '" font-size="10.5" fill="var(--text-faint)">' + ys[i] + '</text>';
    g += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10.5" fill="var(--text-faint)" font-weight="600">' + esc(t().year) + '</text><text transform="translate(12 ' + ((Tp + H - B) / 2) + ') rotate(-90)" text-anchor="middle" font-size="10.5" fill="var(--text-faint)" font-weight="600">' + esc(isPct ? t().yT2 : t().yT1) + '</text>';
    series.forEach(function (s) {
      var solid = '', dash = '', started = false, last = null;
      for (i = 0; i < ys.length; i++) {
        if (s.v[i] === null) { started = false; continue; }
        var pt = x(i) + ',' + y(s.v[i]);
        if (i === ys.length - 1 && last !== null) dash = 'M' + x(last) + ',' + y(s.v[last]) + ' L' + pt;
        else solid += (started ? ' L' : ' M') + pt;
        started = true; last = i;
      }
      if (i === ys.length && s.v[ys.length - 1] !== null && ys.length > 1 && !dash) { /* solo un punto */ }
      g += '<path d="' + solid + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round"/>' + (dash ? '<path d="' + dash + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-dasharray="4 3"/>' : '');
      if (last !== null) g += '<circle cx="' + x(last) + '" cy="' + y(s.v[last]) + '" r="4" fill="' + s.color + '" stroke="var(--surface,#fff)" stroke-width="2"/>';
    });
    var spec = { L: L, R: W - R, T: Tp, B: H - B, s: series.map(function (s) { var pts = []; for (var j = 0; j < ys.length; j++) if (s.v[j] !== null) pts.push([+x(j).toFixed(1), +y(s.v[j]).toFixed(1), isPct ? P.nf(s.v[j], 1) + ' %' : P.big(s.v[j]), ys[j] + (c.marketYears[j] === c.latestMarketYear ? ' (' + t().forecast + ')' : ''), s.v[j]]); return { n: s.name, c: s.color, p: pts }; }) };
    var lg = '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;margin:6px 0">' + series.map(function (s) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:14px;height:3px;background:' + s.color + ';display:inline-block;border-radius:2px"></span>' + esc(s.name) + '</span>'; }).join('') + '</div>';
    return '<div style="position:relative">' + lg + '<svg id="' + id + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(series.map(function (s) { return s.name; }).join(', ')) + '"' + window.DehesaChart.attr(spec) + ' style="width:100%;height:auto;display:block;touch-action:pan-y">' + g + '</svg></div>';
  }
function ci(id, o) { return window.DICite && id ? window.DICite.html(id, o || {}) : ''; }
    function page() {
    var x = t(), c = com(), nm = P.names(), at = P.attrs();
    if (!(window.ODSpain && window.ODSpain.active()) && !(window.ODCountries && window.ODCountries.current())) { document.title = x.title + ' | Dehesa Index';
    document.getElementById('pg-h1').textContent = x.title; document.getElementById('pg-sub').textContent = x.sub; }
    if (!c.marketYears || c.marketYears.indexOf(SEL.my) < 0) SEL.my = c.latestMarketYear;
    var my = SEL.my, prevMy = my - 1, hasPrev = c.marketYears.indexOf(prevMy) >= 0;
    var opts = DATA.commodities.map(function (d) { return '<option value="' + d.id + '"' + (d.id === c.id ? ' selected' : '') + '>' + esc(nm[d.id] || d.id) + '</option>'; }).join('');
    var yopts = c.marketYears.slice().reverse().map(function (y) { return '<option value="' + y + '"' + (y === my ? ' selected' : '') + '>' + P.myLabel(c.id, y) + (y === c.latestMarketYear ? ' (' + x.forecast + ')' : '') + '</option>'; }).join('');
    var ents = entities(c);
    if (SEL.ent !== '__world' && !c.countries[SEL.ent]) SEL.ent = '__world';
    var eopts = '<option value="__world"' + (SEL.ent === '__world' ? ' selected' : '') + '>' + esc(P.world()) + '</option>' + ents.map(function (e) { return '<option value="' + esc(e.key) + '"' + (e.key === SEL.ent ? ' selected' : '') + '>' + esc(e.name) + '</option>'; }).join('');
    var ctr = '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px"><label style="font-size:13px">' + x.product + '<br><select id="od-c" class="di-compare-select">' + opts + '</select></label><label style="font-size:13px">' + x.year + '<br><select id="od-y" class="di-compare-select">' + yopts + '</select></label></div>';
    // titulares (mundo)
    var W = function (a, m) { return val(c, '__world', m, a); };
    var cards = [];
    ['production', 'consumption', 'exports', 'endingStocks'].forEach(function (a) {
      var v = W(a, my); if (v === null) return;
      cards.push(card(at[a], P.big(v), chgTxt(v, W(a, prevMy), x)));
    });
    var st = stuOf(c, '__world', my), stp = stuOf(c, '__world', prevMy);
    if (st !== null) cards.push(card(x.stu, P.nf(st, 1) + ' %', stp !== null ? (st - stp > 0 ? '+' : st - stp < 0 ? '−' : '') + P.nf(Math.abs(st - stp), 1) + ' pp ' + x.vs : '', x.stuHint));
    var head = '<div class="di-card" style="padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:20px;margin-bottom:22px">' + cards.join('') + '</div>';
    // balance
    var rowsA = ['beginningStocks', 'production', 'imports', 'totalSupply', 'consumption', 'feed', 'crush', 'exports', 'endingStocks', 'area'].filter(function (a) { return c.attributes.indexOf(a) >= 0 && W(a, my) !== null; });
    var tbl = '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:480px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + x.item.toUpperCase() + '</th><th style="padding:10px 6px;text-align:right">' + P.myLabel(c.id, my) + '</th><th style="padding:10px 6px;text-align:right">' + (hasPrev ? P.myLabel(c.id, prevMy) : x.prev.toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + x.chg.toUpperCase() + '</th></tr>' +
      rowsA.map(function (a) { var v = W(a, my), p = W(a, prevMy), ch = pct(v, p), sub = a === 'feed' || a === 'crush'; return '<tr style="border-top:1px solid var(--border)"><td style="padding:10px 6px;' + (sub ? 'padding-left:20px;color:var(--text-faint)' : 'font-weight:600') + '">' + esc(at[a]) + '</td><td style="padding:10px 6px;text-align:right">' + P.nf(v, 0) + '</td><td style="padding:10px 6px;text-align:right;color:var(--text-faint)">' + (p === null ? '—' : P.nf(p, 0)) + '</td><td style="padding:10px 6px;text-align:right;font-weight:600">' + (ch === null ? '—' : P.sgnPct(ch)) + '</td></tr>'; }).join('') + '</table></div>' +
      '<p class="di-movers-hint" style="margin-top:6px">' + x.unit + ' ' + (c.unit.indexOf('CWE') >= 0 ? x.ktons : x.ktons.split(' (')[0]) + (rowsA.indexOf('area') >= 0 ? ' · ' + at.area + ': ' + x.khá : '') + '. ' + (P.isCal(c.id) ? x.cal : x.split) + '</p>';
    // ranking
    var rk = ['production', 'exports', 'imports', 'consumption', 'endingStocks'].filter(function (a) { return c.attributes.indexOf(a) >= 0; });
    if (rk.indexOf(SEL.rank) < 0) SEL.rank = 'production';
    var tabs = rk.map(function (a) { return '<button type="button" class="di-link-btn" data-rank="' + a + '" aria-pressed="' + (SEL.rank === a) + '" style="' + (SEL.rank === a ? 'font-weight:700;text-decoration:underline;' : '') + 'margin-right:14px">' + esc(at[a]) + '</button>'; }).join('');
    var wt = W(SEL.rank, my);
    var list = Object.keys(c.countries).map(function (n) { return { n: n, iso: c.countries[n].iso, v: val(c, n, my, SEL.rank) }; }).filter(function (e) { return e.v; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 10);
    var mxv = list.length ? list[0].v : 1, sum = 0;
    var rows = list.map(function (e) { sum += e.v; var sh = wt ? e.v / wt * 100 : null; return '<tr style="border-top:1px solid var(--border)"><td style="padding:9px 6px;font-weight:600;white-space:nowrap">' + esc(e.iso ? P.countryName(e.iso, e.n) : e.n) + '</td><td style="padding:9px 6px;width:38%"><div style="height:8px;border-radius:2px 4px 4px 2px;background:' + C1 + ';width:' + (e.v / mxv * 100).toFixed(1) + '%"></div></td><td style="padding:9px 6px;text-align:right">' + P.nf(e.v, 0) + '</td><td style="padding:9px 6px;text-align:right;color:var(--text-faint)">' + (sh === null ? '—' : P.nf(sh, 1) + ' %') + '</td></tr>'; }).join('');
    var rank = '<div style="margin-bottom:8px">' + tabs + '</div><div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px"></th><th></th><th style="padding:10px 6px;text-align:right">' + esc(at[SEL.rank].toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + x.share.toUpperCase() + '</th></tr>' + rows + '</table></div>' +
      (wt && list.length ? '<p class="di-movers-hint" style="margin-top:6px">' + x.listed + ' ' + P.nf(sum / wt * 100, 0) + ' % ' + x.of + '.</p>' : '');
    // series
    var ys = c.marketYears.slice(), ent = SEL.ent;
    var s1 = [{ name: at.production, color: C1, v: ys.map(function (y) { return val(c, ent, y, 'production'); }) }, { name: at.consumption, color: C2, v: ys.map(function (y) { return val(c, ent, y, 'consumption'); }) }].filter(function (s) { return s.v.some(function (v) { return v !== null; }); });
    var s2 = [{ name: x.stu, color: C3, v: ys.map(function (y) { return stuOf(c, ent, y); }) }].filter(function (s) { return s.v.some(function (v) { return v !== null; }); });
    var ch1 = lineChart('od-ch1', ys.map(function (y) { return P.myLabel(c.id, y); }), s1, false, c);
    var ch2 = s2.length ? lineChart('od-ch2', ys.map(function (y) { return P.myLabel(c.id, y); }), s2, true, c) : '';
    var charts = '<div class="di-card" style="padding:16px 18px;margin-bottom:14px"><label style="font-size:13px">' + x.entity + ' <select id="od-e" class="di-compare-select">' + eopts + '</select></label>' +
      (ch1 ? '<h3 style="font-size:15px;margin:14px 0 0">' + x.chart1 + '</h3>' + ch1 : '') + (ch2 ? '<h3 style="font-size:15px;margin:14px 0 0">' + x.chart2 + '</h3>' + ch2 : '') + '<p class="di-movers-hint" style="margin-top:6px">' + x.year + ' ' + P.myLabel(c.id, c.latestMarketYear) + ': ' + x.forecast + ' (' + (x.forecast === 'previsión' ? 'línea discontinua' : x.forecast === 'forecast' ? 'dashed line' : x.forecast === 'prévision' ? 'trait pointillé' : 'linea tratteggiata') + ')</p></div>';
    var pub = c.publishedMonth ? '<p class="di-movers-hint">' + x.updated + ': ' + esc(c.publishedMonth) + ' · <a href="mapa.html">' + x.mapLink + ' →</a></p>' : '<p class="di-movers-hint"><a href="mapa.html">' + x.mapLink + ' →</a></p>';
    document.getElementById('od-body').innerHTML = ctr + head + pub + '<h2 style="margin:20px 0 10px">' + x.balance + ' · ' + esc(nm[c.id] || c.id) + '</h2>' + tbl + '<h2 style="margin:26px 0 10px">' + x.rank + '</h2>' + rank + '<h2 style="margin:26px 0 10px">' + esc(nm[c.id] || c.id) + '</h2>' + charts +
      '<p class="di-info-api-notice" style="margin:14px 0">' + esc(x.caveat) + '</p><p class="di-movers-hint">' + esc(x.src) + ' <a href="metodologia.html#oferta-demanda">' + x.methodLink + '</a>.</p>' + ci('usda_fas_psd', { period: c.publishedMonth });
    document.getElementById('od-c').onchange = function (e) { SEL.c = e.target.value; SEL.my = null; page(); };
    document.getElementById('od-y').onchange = function (e) { SEL.my = parseInt(e.target.value, 10); page(); };
    document.getElementById('od-e').onchange = function (e) { SEL.ent = e.target.value; page(); };
    Array.prototype.forEach.call(document.querySelectorAll('#od-body [data-rank]'), function (b) { b.onclick = function () { SEL.rank = b.getAttribute('data-rank'); page(); }; });
  }
  var HT = {
    es: { map: 'Mapa', h: 'Oferta y demanda mundial', hint: 'USDA (PSD), campaña más reciente (previsión)', prod: 'Producción', stu: 'Existencias / consumo', more: 'Ver el balance completo' },
    en: { map: 'Map', h: 'World supply and demand', hint: 'USDA (PSD), latest marketing year (forecast)', prod: 'Production', stu: 'Stocks-to-use', more: 'See the full balance' },
    fr: { map: 'Carte', h: 'Offre et demande mondiales', hint: 'USDA (PSD), campagne la plus récente (prévision)', prod: 'Production', stu: 'Stocks / consommation', more: 'Voir le bilan complet' },
    it: { map: 'Mappa', h: 'Offerta e domanda mondiale', hint: 'USDA (PSD), campagna più recente (previsione)', prod: 'Produzione', stu: 'Scorte / consumo', more: 'Vedi il bilancio completo' }
  };
  function teaser() {
    var el = document.getElementById('home-oferta'); if (!el || !DATA) return;
    var h = HT[window.DehesaShared.getLang()] || HT.es, nm = P.names(), cells = '';
    ['trigo', 'maiz', 'soja', 'azucar'].forEach(function (id) {
      var c = null; DATA.commodities.forEach(function (d) { if (d.id === id) c = d; });
      if (!c) return;
      var my = c.latestMarketYear, p = val(c, '__world', my, 'production'), p0 = val(c, '__world', my - 1, 'production'), st = stuOf(c, '__world', my);
      if (p === null) return;
      cells += '<div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)">' + esc((nm[id] || id).toUpperCase()) + ' · ' + P.myLabel(id, my) + '</div><div style="font-family:\'Source Serif 4\',serif;font-size:24px;font-weight:600;margin:4px 0 2px">' + P.big(p) + '</div><div style="font-size:12.5px;color:var(--text-faint)">' + h.prod + (p0 ? ' ' + P.sgnPct(pct(p, p0)) : '') + (st !== null ? '<br>' + h.stu + ': ' + P.nf(st, 0) + ' %' : '') + '</div></div>';
    });
    if (!cells) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="di-movers-head-row"><h2>' + h.h + '</h2><span class="di-movers-hint">' + h.hint + '</span></div><div class="di-card" style="padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:20px">' + cells + '</div><p class="di-movers-hint" style="margin-top:10px"><a href="oferta-demanda.html">' + h.more + ' →</a> · <a href="mapa.html">' + h.map + '</a> · USDA PSD</p>';
  }
  var isPage = !!document.getElementById('od-body');
  if (!isPage && !document.getElementById('home-oferta')) return;
  if (isPage) window.DehesaShared.init('informacion');
  (isPage || !window.DIHome ? P.load('data/supply-demand.json') : window.DIHome.summary().then(function (s) { return s.supplyDemand; }).catch(function () { return null; })).then(function (d) {
    if (!d) { if (isPage) document.getElementById('od-body').innerHTML = '<p class="di-movers-hint">' + t().noData + '</p>'; return; }
    DATA = d; SEL.c = 'trigo'; if (isPage) { var qc = new URLSearchParams(window.location.search).get('c'); if (qc && DATA.commodities.some(function (x) { return x.id === qc; })) SEL.c = qc; } window.__odWorldRender = function () { if (isPage) page(); }; var go = function () { if (isPage) page(); teaser(); }; (window.DICite ? window.DICite.load() : Promise.resolve()).then(go, go);
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); if (isPage) page(); teaser(); };
  });
})();
