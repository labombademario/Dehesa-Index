/* Dehesa Index — Perfiles de país: vista previa de la UE, tarjetas por país y comparador de dos países. ES5.
   Usa DICountryData (carga común) y DIProfile (KPI elegidos a mano). */
(function () {
  'use strict';
  var CD = window.DICountryData, esc = CD.esc, nf = CD.nf;
  var T = {
    es: { title: 'Perfiles de país y comparador', sub: 'Qué datos tenemos de cada país, una vista previa de los precios de la Unión Europea y un comparador de dos países.',
      eu: 'Unión Europea: vista previa', euSub: 'Precios medios de la UE del portal agroalimentario de la Comisión Europea. Cada tarjeta es un precio medio publicado por la Comisión, sin recalcular.', euMore: 'Ver todos los precios de la UE →', euNote: 'Leche cruda y aceite no tienen media UE publicada: se muestra el país indicado.',
      countries: 'Países', open: 'Abrir perfil', series: 'series', cats: 'categorías', upto: 'Último dato', compare: 'Comparar dos países', a: 'País A', b: 'País B',
      key: 'Indicadores clave', cover: 'Cobertura', seriesN: 'Series', catsN: 'Categorías de datos', from: 'Datos desde', last: 'Último dato', sources: 'Fuentes', common: 'Mismo concepto, dos países', concept: 'Concepto', exp12: 'Exportaciones agroalimentarias (últimos 12 meses)', imp12: 'Importaciones agroalimentarias (últimos 12 meses)', bal12: 'Balanza agroalimentaria (últimos 12 meses)', cur: 'Aviso: las monedas son distintas (la UE en euros; Canadá y Australia en moneda local), no son comparables directamente.', cat: 'Categoría', wk: 'Semana', vsprev: 'vs. anterior', vsyr: 'vs. hace un año', date: 'Fecha', none: 'Sin datos',
      eun: { cerdo: 'Cerdo, clase E', vacuno: 'Machos jóvenes (A, O2)', trigo: 'Trigo panificable', cebada: 'Cebada forrajera', mantequilla: 'Mantequilla', leche_polvo: 'Leche desnatada en polvo', huevos: 'Huevos (jaula)', pollo: 'Pollo entero 65 %', cordero: 'Cordero pesado', nitrogeno: 'Fertilizante nitrogenado', leche: 'Leche cruda (Alemania)', aceite: 'Aceite de oliva virgen extra (España)' } },
    en: { title: 'Country profiles and comparison', sub: 'What data we hold for each country, a preview of European Union prices and a two-country comparison.',
      eu: 'European Union: preview', euSub: 'EU average prices from the European Commission agri-food data portal. Each card is an average published by the Commission, not recalculated.', euMore: 'See all EU prices →', euNote: 'Raw milk and olive oil have no published EU average: the country shown is indicated.',
      countries: 'Countries', open: 'Open profile', series: 'series', cats: 'categories', upto: 'Latest', compare: 'Compare two countries', a: 'Country A', b: 'Country B',
      key: 'Key indicators', cover: 'Coverage', seriesN: 'Series', catsN: 'Data categories', from: 'Data from', last: 'Latest data', sources: 'Sources', common: 'Same concept, two countries', concept: 'Concept', exp12: 'Agri-food exports (last 12 months)', imp12: 'Agri-food imports (last 12 months)', bal12: 'Agri-food trade balance (last 12 months)', cur: 'Note: currencies differ (the EU in euros; Canada and Australia in local currency), so they are not directly comparable.', cat: 'Category', wk: 'Week', vsprev: 'vs. previous', vsyr: 'vs. a year ago', date: 'Date', none: 'No data',
      eun: { cerdo: 'Pig, class E', vacuno: 'Young bulls (A, O2)', trigo: 'Bread-making wheat', cebada: 'Feed barley', mantequilla: 'Butter', leche_polvo: 'Skimmed milk powder', huevos: 'Eggs (cage)', pollo: 'Whole chicken 65%', cordero: 'Heavy lamb', nitrogeno: 'Nitrogen fertiliser', leche: 'Raw milk (Germany)', aceite: 'Extra virgin olive oil (Spain)' } },
    fr: { title: 'Profils de pays et comparateur', sub: 'Les données que nous avons pour chaque pays, un aperçu des prix de l’Union européenne et un comparateur de deux pays.',
      eu: 'Union européenne : aperçu', euSub: 'Prix moyens de l’UE issus du portail agroalimentaire de la Commission européenne. Chaque carte est une moyenne publiée par la Commission, sans recalcul.', euMore: 'Voir tous les prix de l’UE →', euNote: 'Pas de moyenne UE publiée pour le lait cru et l’huile d’olive : le pays indiqué est affiché.',
      countries: 'Pays', open: 'Ouvrir le profil', series: 'séries', cats: 'catégories', upto: 'Dernière donnée', compare: 'Comparer deux pays', a: 'Pays A', b: 'Pays B',
      key: 'Indicateurs clés', cover: 'Couverture', seriesN: 'Séries', catsN: 'Catégories de données', from: 'Données depuis', last: 'Dernière donnée', sources: 'Sources', common: 'Même concept, deux pays', concept: 'Concept', exp12: 'Exportations agroalimentaires (12 derniers mois)', imp12: 'Importations agroalimentaires (12 derniers mois)', bal12: 'Solde agroalimentaire (12 derniers mois)', cur: 'Attention : les monnaies diffèrent (l’UE en euros ; Canada et Australie en monnaie locale), comparaison directe impossible.', cat: 'Catégorie', wk: 'Semaine', vsprev: 'vs. précédent', vsyr: 'vs. il y a un an', date: 'Date', none: 'Pas de données',
      eun: { cerdo: 'Porc, classe E', vacuno: 'Jeunes bovins (A, O2)', trigo: 'Blé panifiable', cebada: 'Orge fourragère', mantequilla: 'Beurre', leche_polvo: 'Poudre de lait écrémé', huevos: 'Œufs (cage)', pollo: 'Poulet entier 65 %', cordero: 'Agneau lourd', nitrogeno: 'Engrais azoté', leche: 'Lait cru (Allemagne)', aceite: 'Huile d’olive vierge extra (Espagne)' } },
    it: { title: 'Profili paese e confronto', sub: 'I dati che abbiamo per ogni paese, un’anteprima dei prezzi dell’Unione europea e un confronto tra due paesi.',
      eu: 'Unione europea: anteprima', euSub: 'Prezzi medi UE dal portale agroalimentare della Commissione europea. Ogni scheda è una media pubblicata dalla Commissione, non ricalcolata.', euMore: 'Vedi tutti i prezzi UE →', euNote: 'Per latte crudo e olio d’oliva non c’è una media UE pubblicata: si mostra il paese indicato.',
      countries: 'Paesi', open: 'Apri profilo', series: 'serie', cats: 'categorie', upto: 'Ultimo dato', compare: 'Confronta due paesi', a: 'Paese A', b: 'Paese B',
      key: 'Indicatori chiave', cover: 'Copertura', seriesN: 'Serie', catsN: 'Categorie di dati', from: 'Dati dal', last: 'Ultimo dato', sources: 'Fonti', common: 'Stesso concetto, due paesi', concept: 'Concetto', exp12: 'Esportazioni agroalimentari (ultimi 12 mesi)', imp12: 'Importazioni agroalimentari (ultimi 12 mesi)', bal12: 'Saldo agroalimentare (ultimi 12 mesi)', cur: 'Attenzione: le valute differiscono (UE in euro; Canada e Australia in valuta locale), confronto non diretto.', cat: 'Categoria', wk: 'Settimana', vsprev: 'vs. precedente', vsyr: 'vs. un anno fa', date: 'Data', none: 'Nessun dato',
      eun: { cerdo: 'Suino, classe E', vacuno: 'Vitelloni (A, O2)', trigo: 'Frumento panificabile', cebada: 'Orzo da foraggio', mantequilla: 'Burro', leche_polvo: 'Latte scremato in polvere', huevos: 'Uova (gabbia)', pollo: 'Pollo intero 65%', cordero: 'Agnello pesante', nitrogeno: 'Fertilizzante azotato', leche: 'Latte crudo (Germania)', aceite: 'Olio extra vergine (Spagna)' } }
  };
  var ORDER = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'DK', 'NL', 'US', 'CA', 'AU', 'UK', 'PL', 'AR', 'CL', 'EU'];
  var D = null, EUD = null, MAC = null, WAG = null, ST = { a: 'ES', b: 'FR' };
  function lang() { return CD.lang(); }
  function tt() { return T[lang()] || T.es; }
  function lb() { return CD.labels(lang()); }
  function dtf(iso) { try { return new Date(iso.slice(0, 10) + 'T00:00:00Z').toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function pct(a, b) { return b ? (a - b) / Math.abs(b) * 100 : null; }
  function chip(v) { if (v == null) return '–'; var col = v >= 0 ? '#2f6b4a' : '#a33'; return '<span style="color:' + col + '">' + (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %</span>'; }
  function euCards() {
    var t = tt(), h = '';
    EUD.cards.forEach(function (p) {
      var r = p, ser = p;
      h += '<div class="di-card" style="padding:12px 14px"><div style="font-size:12.5px;font-weight:600;min-height:34px">' + esc(t.eun[p.k]) + '</div><div style="font-size:21px;font-weight:700;font-variant-numeric:tabular-nums;margin-top:4px">' + nf(r.last[1], CD.dec(r.last[1])) + '</div><div style="font-size:11px;color:var(--text-muted)">' + esc(ser.unit) + '</div><div style="font-size:12px;margin-top:6px;color:var(--text-muted)">' + t.vsprev + ': ' + chip(pct(r.last[1], r.prev && r.prev[1])) + '<br>' + t.vsyr + ': ' + chip(pct(r.last[1], r.yoy && r.yoy[1])) + '<br>' + esc(dtf(r.last[0])) + '</div></div>';
    });
    return h;
  }
  function covChip(c) { var v = c.summary ? c.summary.coverage : (window.DIProfile.coverage && c.series && window.DIProfile.coverage(c.series)); if (!v) return ''; return '<span title="Coverage score" style="font-size:11.5px;font-weight:700;border:1px solid var(--border);border-radius:10px;padding:1px 8px;color:' + (v.score >= 75 ? 'var(--positive)' : v.score >= 50 ? 'var(--footnote)' : 'var(--negative)') + '">' + v.score + '/100</span>'; }
  function stats(c) {
    if (!c.series && c.summary) return { n: c.summary.n, g: {}, nc: c.summary.categories, mn: c.summary.first, mx: c.summary.latestPeriod };  // tarjeta: resumen del manifiesto, sin bajar el catalogo
    var S = c.series, groups = {}, mn = null, mx = null;
    S.forEach(function (s) { groups[s.group] = (groups[s.group] || 0) + 1; var a = s.points ? s.points[0][0] : s.first; if (mn == null || a < mn) mn = a; if (mx == null || s.latestPeriod > mx) mx = s.latestPeriod; });
    return { n: S.length, g: groups, nc: Object.keys(groups).length, mn: mn, mx: mx };
  }
  function pl(p) { return CD.plabel(p, /^\d{4}-\d{2}$/.test(p) ? 'monthly' : /^\d{4}-\d{2}-\d{2}$/.test(p) ? 'weekly' : 'annual'); }
  function ctx(cc) {
    var l = lb();
    return { lang: lang(), t: l, groups: ['all'].concat(CD.groups), esc: esc, nf: nf, dec: CD.dec, plabel: CD.plabel, wage: WAG && cc && WAG.countries[cc], rate: cc && D.countries[cc] && D.countries[cc].series ? window.DIProfile.rateOf(D.countries[cc]) : null };
  }
  function sumSeries(c, kind) {
    return c.series.filter(function (x) { return new RegExp('^(eu-[a-z]{2}-trade|au)-' + (kind === 'exp' ? 'exp' : kind === 'imp' ? 'imp' : 'bal') + '-agrifood$').test(x.id) && x.frequency === 'monthly'; })[0];
  }
  function sum12(c, kind) {
    var s = sumSeries(c, kind);
    if (!s || !s.points || s.points.length < 12) return null;
    var pts = s.points.slice(-12), tot = 0; pts.forEach(function (p) { tot += p[1]; });
    return { v: tot, u: s.unit, p: pts[pts.length - 1][0] };
  }
  function kpiCard(s, x) {
    var lab = x.t, ch = s.changePct;
    return '<div class="di-card" style="padding:10px 12px;margin-bottom:8px"><div style="font-size:11px;color:var(--text-faint)">' + esc(lab[s.group] || s.group) + '</div><div style="font-size:12.5px;font-weight:600;line-height:1.3">' + esc(s.label.replace(/\s*\((monthly|quarterly|annual|weekly|half-year)[^)]*\)$/i, '')) + '</div><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px"><div><b style="font-size:18px;font-variant-numeric:tabular-nums">' + nf(s.latest, CD.dec(s.latest)) + '</b> <span style="font-size:11px;color:var(--text-muted)">' + esc(s.unit) + '</span></div>' + window.DIProfile.spark(s) + '</div><div style="font-size:11.5px;color:var(--text-muted)">' + esc(CD.plabel(s.latestPeriod, s.frequency)) + (ch == null ? '' : ' · ' + chip(ch)) + '</div></div>';
  }
  // Solo bajamos los puntos de lo que se pinta: los KPI de cada pais (sparkline) y las series de comercio de 12 meses.
  function compare() {
    if (!D.countries[ST.a] || !D.countries[ST.b]) return Promise.resolve('');
    return Promise.all([ensure(ST.a), ensure(ST.b)]).then(compareLoaded);
  }
  function compareLoaded() {
    var A = D.countries[ST.a], B = D.countries[ST.b];
    var ka = window.DIProfile.kpis(ST.a, A.series, groupBy(A)), kb = window.DIProfile.kpis(ST.b, B.series, groupBy(B)), need = ka.concat(kb);
    ['exp', 'imp', 'bal'].forEach(function (k) { need.push(sumSeries(A, k), sumSeries(B, k)); });
    return CD.hydrate(need).then(function () { return renderCompare(A, B, ka, kb); });
  }
  function renderCompare(A, B, ka, kb) {
    var t = tt(), l = lb();
    var sa = stats(A), sb = stats(B), x = ctx();
    var th = 'padding:8px 6px;', head = function (cc) { return '<th style="' + th + 'text-align:right">' + window.DIProfile.flag(cc) + ' ' + esc(l.countries[cc]) + '</th>'; };
    var h = '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table style="border-collapse:collapse;width:100%;min-width:460px;font-size:13.5px"><thead><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="' + th + '">' + t.cover.toUpperCase() + '</th>' + head(ST.a) + head(ST.b) + '</tr></thead><tbody>';
    var row = function (lab, va, vb) { return '<tr style="border-top:1px solid var(--border)"><td style="' + th + '">' + lab + '</td><td style="' + th + 'text-align:right">' + va + '</td><td style="' + th + 'text-align:right">' + vb + '</td></tr>'; };
    h += row(t.seriesN, sa.n, sb.n) + row(t.catsN, sa.nc, sb.nc) + row(t.from, esc(pl(sa.mn)), esc(pl(sb.mn))) + row(t.last, esc(pl(sa.mx)), esc(pl(sb.mx)));
    var cs = function (c) { return esc((c.sources || [c.source.name]).slice(0, 4).join(' · ')); };
    h += row(t.sources, '<span style="font-size:12px">' + cs(A) + '</span>', '<span style="font-size:12px">' + cs(B) + '</span>') + '</tbody></table></div>';
    // mismo concepto
    var rows = '', cur = false;
    [['exp', t.exp12], ['imp', t.imp12], ['bal', t.bal12]].forEach(function (k) {
      var a = sum12(A, k[0]), b = sum12(B, k[0]);
      if (!a && !b) return;
      if ((a && a.u !== 'EUR million') || (b && b.u !== 'EUR million')) { if (!(a && b && a.u === b.u)) cur = true; }
      var f = function (v) { return v ? nf(v.v, v.v >= 1000 ? 0 : 1) + ' <span style="font-size:11px;color:var(--text-muted)">' + esc(v.u) + '</span>' : '–'; };
      rows += row(esc(k[1]), f(a), f(b));
    });
    if (rows) h += '<h3 style="margin:22px 0 4px;font-size:15px">' + t.common + '</h3><div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:460px;font-size:13.5px"><thead><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="' + th + '">' + t.concept.toUpperCase() + '</th>' + head(ST.a) + head(ST.b) + '</tr></thead><tbody>' + rows + '</tbody></table></div>' + (cur ? '<p class="di-movers-hint" style="margin-top:6px">' + t.cur + '</p>' : '');
    // KPI lado a lado
    h += '<h3 style="margin:22px 0 8px;font-size:15px">' + t.key + '</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px"><div>' + ka.map(function (s) { return kpiCard(s, x); }).join('') + '</div><div>' + kb.map(function (s) { return kpiCard(s, x); }).join('') + '</div></div>';
    // categorías
    var all = {}; Object.keys(sa.g).concat(Object.keys(sb.g)).forEach(function (g) { all[g] = 1; });
    var cr = CD.groups.filter(function (g) { return all[g]; }).map(function (g) { return row(esc(l[g] || g), sa.g[g] || '–', sb.g[g] || '–'); }).join('');
    h += '<h3 style="margin:22px 0 4px;font-size:15px">' + t.catsN + '</h3><div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:460px;font-size:13.5px"><thead><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="' + th + '">' + t.cat.toUpperCase() + '</th>' + head(ST.a) + head(ST.b) + '</tr></thead><tbody>' + cr + '</tbody></table></div>';
    return h;
  }
  // El comparador (2 catalogos de pais + trozos de series) solo se carga cuando esta cerca de la pantalla, o ya si la URL lo pide (#comparar, ?a=&b=).
  var CMP_ON = /[?&]a=|[?&]b=|#comparar/.test(location.search + location.hash), CMP_IO = null;
  function lazyCompare() {
    var c = document.getElementById('pf-cmp'); if (!c) return;
    if (CMP_ON || !window.IntersectionObserver) { CMP_ON = true; fillCompare(); return; }
    if (CMP_IO) CMP_IO.disconnect();
    CMP_IO = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { CMP_ON = true; CMP_IO.disconnect(); fillCompare(); } }, { rootMargin: '300px' });
    CMP_IO.observe(c);
  }
  function fillCompare() { var tk = ++FILL; compare().then(function (h) { var c = document.getElementById('pf-cmp'); if (c && tk === FILL) c.innerHTML = h; }); }
  var FILL = 0;
  // El catalogo de un pais solo se baja cuando hace falta (comparador, avisos del usuario); las tarjetas usan el resumen del manifiesto.
  function ensure(cc) {
    var c = D.countries[cc]; if (!c || c.series) return Promise.resolve();
    return CD.country(cc).then(function (x) { c.series = x.series; c.sources = x.sources; c.source = x.source; });
  }
  function groupBy(c) { var g = {}; c.series.forEach(function (s) { (g[s.group] = g[s.group] || []).push(s); }); return g; }
  function build() {
    var root = document.getElementById('perfiles-body'); if (!root || !D) return;
    var t = tt(), l = lb(), h = watchPanel();
    if (EUD) h += '<section class="di-card" style="padding:16px 18px;margin-bottom:22px"><div style="display:flex;align-items:center;gap:12px"><span style="font-size:32px" aria-hidden="true">' + window.DIProfile.flag('EU') + '</span><div><div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--text-faint)">' + t.eu.toUpperCase() + '</div><div style="font-size:13px;color:var(--text-muted)">' + t.euSub + '</div></div></div>' + window.DIProfile.macroStrip(MAC && MAC.countries.EU, ctx('EU')) + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:12px">' + euCards() + '</div><p class="di-movers-hint" style="margin-top:8px">' + t.euNote + ' <a href="europa.html">' + t.euMore + '</a></p></section>';
    h += '<h2 style="margin:0 0 10px;font-size:18px">' + t.countries + '</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-bottom:26px">';
    ORDER.forEach(function (cc) {
      var c = D.countries[cc]; if (!c) return; var s = stats(c);
      h += '<a class="di-card" href="paises.html?c=' + cc + '" style="display:block;padding:14px 16px;text-decoration:none;color:inherit"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px" aria-hidden="true">' + window.DIProfile.flag(cc) + '</span><b style="font-size:15px;flex:1">' + esc(l.countries[cc]) + '</b>' + covChip(c) + '</div><div style="font-size:12.5px;color:var(--text-muted);margin-top:8px">' + s.n + ' ' + t.series + ' · ' + s.nc + ' ' + t.cats + '<br>' + t.upto + ': ' + esc(pl(s.mx)) + '</div><div style="font-size:12px;font-weight:700;color:#2f6b4a;margin-top:8px">' + t.open + ' →</div></a>';
    });
    h += '</div><h2 id="comparar" style="margin:0 0 8px;font-size:18px">' + t.compare + '</h2>';
    var opts = function (sel) { return ORDER.filter(function (cc) { return D.countries[cc]; }).map(function (cc) { return '<option value="' + cc + '"' + (cc === sel ? ' selected' : '') + '>' + window.DIProfile.flag(cc) + ' ' + esc(l.countries[cc]) + '</option>'; }).join(''); };
    h += '<div style="display:flex;gap:12px;flex-wrap:wrap"><label style="font-size:13px;flex:1;min-width:160px">' + t.a + '<br><select id="pf-a" class="di-compare-select">' + opts(ST.a) + '</select></label><label style="font-size:13px;flex:1;min-width:160px">' + t.b + '<br><select id="pf-b" class="di-compare-select">' + opts(ST.b) + '</select></label></div><div id="pf-cmp"></div>';
    root.innerHTML = h; lazyCompare();
    Array.prototype.forEach.call(root.querySelectorAll('[data-unwatch]'), function (b) { b.onclick = function () { var a = b.getAttribute('data-unwatch').split('|'); DIWatch.remove(a[0], a[1]); build(); }; });
    ['a', 'b'].forEach(function (k) { var e = document.getElementById('pf-' + k); if (e) e.onchange = function () { ST[k] = e.value; CMP_ON = true; fillCompare(); try { history.replaceState(null, '', '?a=' + ST.a + '&b=' + ST.b + '#comparar'); } catch (x) {} }; });
  }
  function watchPanel() {
    if (!window.DIWatch) return ''; var w = DIWatch.labels[lang()] || DIWatch.labels.es, list = DIWatch.list(), rows = '';
    list.forEach(function (it) {
      var c = D.countries[it.c], s = c && c.series.filter(function (x) { return x.id === it.s; })[0]; if (!s) return;
      var ch = s.changePct, col = ch == null ? 'inherit' : ch >= 0 ? '#2f6b4a' : '#a33';
      rows += '<div style="display:flex;align-items:center;gap:10px;border-top:1px solid var(--border);padding:8px 0"><span aria-hidden="true">' + window.DIProfile.flag(it.c) + '</span><a href="paises.html?c=' + esc(it.c) + '&g=' + esc(s.group) + '&s=' + esc(s.id) + '" style="flex:1;color:inherit;text-decoration:none" title="' + esc(w.open) + '">' + esc(s.label.length > 80 ? s.label.slice(0, 78) + '…' : s.label) + '<span style="display:block;font-size:11.5px;color:var(--text-muted)">' + esc(CD.plabel(s.latestPeriod, s.frequency)) + '</span></a><b style="font-variant-numeric:tabular-nums">' + nf(s.latest, CD.dec(s.latest)) + ' <span style="font-weight:400;font-size:11.5px;color:var(--text-muted)">' + esc(s.unit) + '</span></b><span style="min-width:62px;text-align:right;color:' + col + '">' + (ch == null ? '' : (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), 1) + ' %') + '</span><button type="button" data-unwatch="' + esc(it.c + '|' + s.id) + '" style="border:0;background:none;cursor:pointer;color:var(--text-muted);font-size:12px">' + esc(w.remove) + '</button></div>';
    });
    return '<section class="di-card" style="padding:14px 18px;margin-bottom:22px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)">★ ' + esc(w.title.toUpperCase()) + '</div><div class="di-movers-hint" style="margin:4px 0 6px">' + esc(w.hint) + ' <a href="brief.html#watch" style="color:inherit">🔔 →</a></div>' + (rows || '<div class="di-movers-hint">' + esc(w.empty) + '</div>') + '</section>';
  }
  function shell() { var t = tt(), h = document.getElementById('pf-h1'), s = document.getElementById('pf-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = t.title + ' | Dehesa Index'; }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); build(); };
  shell();
  var q = new URLSearchParams(window.location.search); if (q.get('a')) ST.a = q.get('a').toUpperCase(); if (q.get('b')) ST.b = q.get('b').toUpperCase();
  Promise.all([CD.index(), CD.wages().then(function (w) { WAG = w; return w; }), fetch('data/country-macro.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), fetch('data/views/eu-preview.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load() : null])
    .then(function (rs) { D = rs[0]; MAC = rs[2]; EUD = rs[3]; if (!D.countries[ST.a]) ST.a = 'ES'; if (!D.countries[ST.b]) ST.b = 'FR'; var wc = {}; (window.DIWatch ? DIWatch.list() : []).forEach(function (it) { wc[it.c] = 1; }); return Promise.all(Object.keys(wc).map(ensure)).catch(function () {}).then(build); })
    .catch(function () { var b = document.getElementById('perfiles-body'); if (b) b.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
})();
