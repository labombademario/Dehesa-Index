/* Dehesa Index — Oferta y demanda: pestañas de balances oficiales por país (Canadá, UE, Francia, Australia…).
   Un solo módulo para todos: lee data/supply-balances/<país>.json (formato de scripts/build_supply_balances.py) y pinta tarjetas, tabla de balance,
   comparación entre productos y gráficos. Partida que la fuente no publica = «—»; nada se calcula salvo existencias/uso (rotulado). ES5.
   Lo usa js/oferta-demanda-es.js para la barra de pestañas: ODCountries.chips() / current() / has() / show() / hide(). */
(function () {
  'use strict';
  var P = window.DehesaPSD, LANGS = ['es', 'en', 'fr', 'it'], C1 = '#2a6f97', C2 = '#b8651b', C3 = '#2b7a78';
  function T4(es, en, fr, it) { return { es: es, en: en, fr: fr, it: it }; }
  var CC = {
    FR: { file: 'data/supply-balances/fr.json', tab: T4('Francia (FranceAgriMer)', 'France (FranceAgriMer)', 'France (FranceAgriMer)', 'Francia (FranceAgriMer)'),
      title: T4('Oferta y demanda de cereales en Francia', 'Cereals supply and demand in France', 'Offre et demande de céréales en France', 'Offerta e domanda di cereali in Francia'),
      sub: T4('Balance de los cereales franceses por campaña (julio a junio): cosecha comercializada, usos, exportaciones y existencias. Datos de FranceAgriMer, con la campaña reciente provisional y la siguiente en previsión.',
        'French cereal balance by marketing year (July to June): marketed crop, uses, exports and stocks. FranceAgriMer data, with the latest year provisional and the next one a forecast.',
        'Bilan des céréales françaises par campagne (juillet à juin) : collecte, utilisations, exportations et stocks. Données de FranceAgriMer, la dernière campagne étant provisoire et la suivante en prévision.',
        'Bilancio dei cereali francesi per campagna (da luglio a giugno): raccolto commercializzato, utilizzi, esportazioni e scorte. Dati di FranceAgriMer, con l’ultima campagna provvisoria e la successiva in previsione.') },
    EU: { file: 'data/supply-balances/eu.json', tab: T4('Unión Europea (Comisión Europea)', 'European Union (European Commission)', 'Union européenne (Commission européenne)', 'Unione europea (Commissione europea)'),
      title: T4('Oferta y demanda de cereales en la Unión Europea', 'Cereals supply and demand in the European Union', 'Offre et demande de céréales dans l’Union européenne', 'Offerta e domanda di cereali nell’Unione europea'),
      sub: T4('Balance de cereales de la UE-27 por campaña (julio a junio): producción, importaciones, usos, exportaciones y existencias. Datos de la Comisión Europea (DG AGRI), con estimaciones, previsiones y proyecciones.',
        'EU-27 cereal balance by marketing year (July to June): production, imports, uses, exports and stocks. European Commission (DG AGRI) data, with estimates, forecasts and projections.',
        'Bilan céréalier de l’UE-27 par campagne (juillet à juin) : production, importations, utilisations, exportations et stocks. Données de la Commission européenne (DG AGRI), avec estimations, prévisions et projections.',
        'Bilancio cerealicolo dell’UE-27 per campagna (da luglio a giugno): produzione, importazioni, utilizzi, esportazioni e scorte. Dati della Commissione europea (DG AGRI), con stime, previsioni e proiezioni.') },
    CA: { file: 'data/supply-balances/ca.json', tab: T4('Canadá (Statistics Canada)', 'Canada (Statistics Canada)', 'Canada (Statistique Canada)', 'Canada (Statistics Canada)'),
      title: T4('Oferta y demanda de cultivos en Canadá', 'Crop supply and demand in Canada', 'Offre et demande de cultures au Canada', 'Offerta e domanda di colture in Canada'),
      sub: T4('Balance de los cultivos de Canadá por campaña (agosto a julio): producción, exportaciones, consumo interno y existencias. Datos de Statistics Canada, tal como los publica.',
        'Canada’s crop balance by crop year (August to July): production, exports, domestic disappearance and stocks. Statistics Canada data, as published.',
        'Bilan des cultures du Canada par campagne (août à juillet) : production, exportations, utilisation intérieure et stocks. Données de Statistique Canada, telles que publiées.',
        'Bilancio delle colture del Canada per campagna (da agosto a luglio): produzione, esportazioni, consumo interno e scorte. Dati di Statistics Canada, come pubblicati.') }
  };
  var ORDER = ['EU', 'FR', 'CA'];
  var T = {
    es: { product: 'Producto', year: 'Campaña', item: 'Partida', kt: 'miles de toneladas', prev: 'Anterior', chg: 'Var.', vs: 'vs. campaña anterior', balance: 'Balance', cmp: 'Todos los productos', stu: 'Existencias sobre uso', stuOf: 'existencias finales ÷ ({0})', chart1: 'Producción, consumo y exportaciones', chart2: 'Existencias sobre uso', noProd: 'La fuente no publica este producto en esta campaña.', noData: 'Sin datos de oferta y demanda por ahora.', src: 'Fuente', table: 'tabla', blank: 'Un guion (—) significa que la fuente no publica esa cifra: no se calcula ni se estima.', pp: 'pp' },
    en: { product: 'Product', year: 'Crop year', item: 'Item', kt: 'thousand tonnes', prev: 'Previous', chg: 'Chg.', vs: 'vs. previous year', balance: 'Balance', cmp: 'All products', stu: 'Stocks-to-use', stuOf: 'ending stocks ÷ ({0})', chart1: 'Production, use and exports', chart2: 'Stocks-to-use', noProd: 'The source does not publish this product for this crop year.', noData: 'No supply and demand data yet.', src: 'Source', table: 'table', blank: 'A dash (—) means the source does not publish that figure: it is not calculated or estimated.', pp: 'pp' },
    fr: { product: 'Produit', year: 'Campagne', item: 'Poste', kt: 'milliers de tonnes', prev: 'Précédente', chg: 'Var.', vs: 'vs. campagne précédente', balance: 'Bilan', cmp: 'Tous les produits', stu: 'Stocks sur utilisation', stuOf: 'stocks finaux ÷ ({0})', chart1: 'Production, utilisation et exportations', chart2: 'Stocks sur utilisation', noProd: 'La source ne publie pas ce produit pour cette campagne.', noData: 'Pas encore de données d’offre et de demande.', src: 'Source', table: 'tableau', blank: 'Un tiret (—) signifie que la source ne publie pas ce chiffre : il n’est ni calculé ni estimé.', pp: 'pp' },
    it: { product: 'Prodotto', year: 'Campagna', item: 'Voce', kt: 'migliaia di tonnellate', prev: 'Precedente', chg: 'Var.', vs: 'vs. campagna precedente', balance: 'Bilancio', cmp: 'Tutti i prodotti', stu: 'Scorte su utilizzo', stuOf: 'scorte finali ÷ ({0})', chart1: 'Produzione, utilizzo ed esportazioni', chart2: 'Scorte su utilizzo', noProd: 'La fonte non pubblica questo prodotto per questa campagna.', noData: 'Nessun dato di offerta e domanda per ora.', src: 'Fonte', table: 'tabella', blank: 'Un trattino (—) significa che la fonte non pubblica quella cifra: non è calcolata né stimata.', pp: 'pp' }
  };
  var cur = null, DATA = {}, SEL = { p: 'wheat', y: null };

  function li() { var i = LANGS.indexOf(window.DehesaShared.getLang()); return i < 0 ? 0 : i; }
  function L() { return LANGS[li()]; }
  function t() { return T[L()]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { return P.nf(v, d); }
  function url(u) { return /^https?:\/\//i.test(String(u || '')) ? u : ''; }
  function ci(id, period) { return window.DICite && id ? window.DICite.html(id, { period: period || '' }) : ''; }
  function dash() { return '<span class="di-movers-hint">—</span>'; }
  function big(v) { return v === null ? '—' : Math.abs(v) >= 1000 ? nf(v / 1000, 1) + ' Mt' : nf(v, 0) + ' kt'; }
  function pct(a, b) { return a !== null && b ? (a - b) / Math.abs(b) * 100 : null; }
  function card(l, v, sub, hint) { return '<div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)">' + esc(l.toUpperCase()) + '</div><div style="font-family:\'Source Serif 4\',serif;font-size:28px;font-weight:600;margin:4px 0 2px">' + v + '</div><div style="font-size:12.5px;color:var(--text-faint)">' + (sub || '') + '</div>' + (hint ? '<div style="font-size:11.5px;color:var(--text-faint)">' + esc(hint) + '</div>' : '') + '</div>'; }

  function D() { return DATA[cur]; }
  function ys() { return Object.keys(D().campaigns).sort(); }
  function V(y, p, k) { var c = D().campaigns[y], v = c && c.v[p] && c.v[p][k]; return typeof v === 'number' ? v : null; }
  function has(y, p) { var c = D().campaigns[y]; return !!(c && c.v[p]); }
  function name(o) { return o.name[L()] || o.name.es; }
  function itemBy(id) { var a = D().items; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function stu(y, p) {
    var s = D().stocksToUse, n = V(y, p, s.num), d = 0, i, v;
    if (n === null) return null;
    for (i = 0; i < s.den.length; i++) { v = V(y, p, s.den[i]); if (v === null) return null; d += v; }
    return d ? n / d * 100 : null;
  }
  function stuHint() { var d = D(), n = d.stocksToUse.den.map(function (k) { return name(itemBy(k)).toLowerCase(); }).join(' + '); return t().stuOf.replace('{0}', n); }
  function chg(a, b) { var p = pct(a, b); return p === null ? '' : P.sgnPct(p) + ' ' + t().vs; }
  function pp(a, b) { return a !== null && b !== null ? (a - b > 0 ? '+' : '−') + nf(Math.abs(a - b), 1) + ' ' + t().pp : ''; }

  function head() {
    var c = CC[cur]; if (!c) return;
    var h1 = document.getElementById('pg-h1'), sb = document.getElementById('pg-sub');
    document.title = c.title[L()] + ' | Dehesa Index'; if (h1) h1.textContent = c.title[L()]; if (sb) sb.textContent = c.sub[L()];
  }

  function render() {
    var el = document.getElementById('od-cc'); if (!el || !cur || !D()) return;
    var x = t(), l = li(), d = D(), Y = ys(), i;
    // campaña por defecto: la más reciente con dato del producto elegido
    if (!d.campaigns[SEL.y]) { SEL.y = Y[Y.length - 1]; }
    var okp = d.products.some(function (p) { return p.id === SEL.p; }); if (!okp) SEL.p = d.products[0].id;
    var y = SEL.y, py = String(+y - 1), hp = !!d.campaigns[py], p = SEL.p, prod = d.products.filter(function (q) { return q.id === p; })[0];
    var popts = d.products.map(function (q) { return '<option value="' + esc(q.id) + '"' + (q.id === p ? ' selected' : '') + '>' + esc(name(q)) + '</option>'; }).join('');
    var yopts = Y.slice().reverse().map(function (k) { return '<option value="' + k + '"' + (k === y ? ' selected' : '') + '>' + esc(d.campaigns[k].label) + '</option>'; }).join('');
    var ctr = '<div class="di-card" style="padding:14px 18px;margin:14px 0;display:flex;gap:16px;flex-wrap:wrap;align-items:center"><label style="font-size:13px">' + x.product + ' <select id="od-cc-p" class="di-compare-select">' + popts + '</select></label><label style="font-size:13px">' + x.year + ' <select id="od-cc-y" class="di-compare-select">' + yopts + '</select></label></div>';
    var meta = '<p class="di-movers-hint">' + esc(d.source.name) + (d.source.table ? ' · ' + x.table + ' ' + esc(d.source.table) : '') + (url(d.source.url) ? ' · <a href="' + esc(url(d.source.url)) + '" rel="noopener">' + x.src + '</a>' : '') + '</p>';
    var foot = '<p class="di-info-api-notice" style="margin:14px 0">' + esc(d.note[L()]) + '</p><p class="di-movers-hint">' + esc(x.blank) + '</p>' + ci(d.sourceId, d.campaigns[ys()[ys().length - 1]].label);
    var body;
    if (!has(y, p)) {
      body = '<p class="di-info-api-notice" style="margin:14px 0">' + esc(x.noProd) + '</p>';
    } else {
      var cards = '<div class="di-card" style="padding:16px 18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px">' + d.cards.map(function (k) { var v = V(y, p, k); return card(name(itemBy(k)), big(v), hp ? chg(v, V(py, p, k)) : '', ''); }).join('') +
        card(x.stu, stu(y, p) === null ? '—' : nf(stu(y, p), 1) + ' %', hp ? pp(stu(y, p), stu(py, p)) : '', stuHint()) + '</div>';
      var th = 'padding:6px 8px', thr = 'text-align:right;' + th;
      var rows = d.items.filter(function (it) { return V(y, p, it.id) !== null || (hp && V(py, p, it.id) !== null); }).map(function (it) {
        var v = V(y, p, it.id), pv = hp ? V(py, p, it.id) : null, ch = pct(v, pv);
        return '<tr style="border-top:1px solid var(--border)"><td style="padding:6px 8px;' + (it.sub ? 'padding-left:' + (8 + it.sub * 16) + 'px;color:var(--text-faint);' : '') + (it.strong ? 'font-weight:700' : '') + '">' + esc(name(it)) + '</td><td style="text-align:right;padding:6px 8px;' + (it.strong ? 'font-weight:700' : '') + '">' + (v === null ? dash() : nf(v, v % 1 ? 1 : 0)) + '</td>' + (hp ? '<td style="text-align:right;padding:6px 8px">' + (pv === null ? dash() : nf(pv, pv % 1 ? 1 : 0)) + '</td><td style="text-align:right;padding:6px 8px;color:var(--text-faint)">' + (ch === null ? '—' : P.sgnPct(ch)) + '</td>' : '') + '</tr>';
      }).join('');
      var tbl = '<div style="overflow-x:auto"><table class="di-table" style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr><th style="text-align:left;' + th + '">' + x.item + ' (' + x.kt + ')</th><th style="' + thr + '">' + esc(d.campaigns[y].label) + '</th>' + (hp ? '<th style="' + thr + '">' + esc(d.campaigns[py].label) + '</th><th style="' + thr + '">' + x.chg + '</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
      var ck = d.cards;
      var cmp = '<div style="overflow-x:auto"><table class="di-table" style="width:100%;border-collapse:collapse;font-size:13.5px"><thead><tr><th style="text-align:left;' + th + '">' + x.product + '</th>' + ck.map(function (k) { return '<th style="' + thr + '">' + esc(name(itemBy(k))) + '</th>'; }).join('') + '<th style="' + thr + '">' + esc(x.stu) + '</th></tr></thead><tbody>' +
        d.products.filter(function (q) { return has(y, q.id); }).map(function (q) { return '<tr style="border-top:1px solid var(--border)' + (q.id === p ? ';background:var(--surface-alt,transparent)' : '') + '"><td style="padding:6px 8px;font-weight:' + (q.id === p ? '700' : '400') + '">' + esc(name(q)) + '</td>' + ck.map(function (k) { var v = V(y, q.id, k); return '<td style="text-align:right;padding:6px 8px">' + (v === null ? dash() : nf(v, v % 1 ? 1 : 0)) + '</td>'; }).join('') + '<td style="text-align:right;padding:6px 8px">' + (stu(y, q.id) === null ? dash() : nf(stu(y, q.id), 1) + ' %') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      var lab = {}; Y.forEach(function (k) { lab[+k] = d.campaigns[k].label; });
      var cols = [C1, C2, C3];
      var s1 = d.chart.map(function (k, j) { return { name: name(itemBy(k)), color: cols[j % 3], pts: Y.map(function (z) { return { x: +z, y: V(z, p, k), l: d.campaigns[z].label }; }) }; });
      var s2 = [{ name: x.stu, color: C3, pts: Y.map(function (z) { return { x: +z, y: stu(z, p), l: d.campaigns[z].label }; }) }];
      var CH = window.DehesaChart, xf = function (v) { return v % 1 === 0 ? (lab[v] || '') : ''; };
      var ch1 = CH ? CH.render({ series: s1, xMode: 'index', xLabels: lab, xFmt: xf, yTitle: 'kt', aria: x.chart1 + ' · ' + name(prod), vFmt: function (v) { return nf(v, 0) + ' kt'; } }) : '';
      var ch2 = CH ? CH.render({ series: s2, xMode: 'index', xLabels: lab, xFmt: xf, yTitle: '%', aria: x.chart2 + ' · ' + name(prod), noLegend: true, vFmt: function (v) { return nf(v, 1) + ' %'; } }) : '';
      body = cards + meta + '<h2 style="margin:20px 0 10px">' + x.balance + ' · ' + esc(name(prod)) + ' · ' + esc(d.campaigns[y].label) + '</h2>' + tbl +
        '<h2 style="margin:26px 0 10px">' + x.cmp + ' · ' + esc(d.campaigns[y].label) + '</h2>' + cmp +
        '<h2 style="margin:26px 0 10px">' + esc(name(prod)) + '</h2><div class="di-card" style="padding:16px 18px"><h3 style="font-size:15px;margin:0">' + x.chart1 + '</h3>' + ch1 + '<h3 style="font-size:15px;margin:14px 0 0">' + x.chart2 + '</h3>' + ch2 + '</div>';
    }
    el.innerHTML = ctr + body + foot;
    document.getElementById('od-cc-p').onchange = function (e) { SEL.p = e.target.value; render(); };
    document.getElementById('od-cc-y').onchange = function (e) { SEL.y = e.target.value; render(); };
  }

  function setUrl(cc) {
    try {
      var q = new URLSearchParams(window.location.search), c = (q.get('c') || '').toUpperCase();
      if (cc) q.set('c', cc); else if (CC[c]) q.delete('c'); else return;
      var s = q.toString(); history.replaceState(null, '', window.location.pathname + (s ? '?' + s : '') + window.location.hash);
    } catch (e) {}
  }
  function load(cc) {
    if (DATA[cc]) return Promise.resolve(DATA[cc]);
    return fetch(CC[cc].file).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) { if (d && d.campaigns && d.products && d.products.length) DATA[cc] = d; return DATA[cc] || null; });
  }
  function show(cc, noUrl) {
    if (!CC[cc]) return;
    cur = cc; SEL.y = null; SEL.p = 'wheat';
    var w = document.getElementById('od-body'), e = document.getElementById('od-es'), el = document.getElementById('od-cc');
    if (w) w.hidden = true; if (e) e.hidden = true; if (el) el.hidden = false;
    if (!noUrl) setUrl(cc);
    head();
    load(cc).then(function (d) {
      if (cur !== cc) return;
      if (!d) { if (el) el.innerHTML = '<p class="di-movers-hint">' + esc(t().noData) + '</p>'; return; }
      (window.DICite ? window.DICite.load().catch(function () {}) : Promise.resolve()).then(function () { if (cur === cc) render(); });
    });
  }
  function hide(keepUrl) {
    var el = document.getElementById('od-cc'); if (el) { el.hidden = true; el.innerHTML = ''; }
    if (cur && !keepUrl) setUrl(null);
    cur = null;
  }

  if (!document.getElementById('od-cc')) return;
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); if (cur && D()) { head(); render(); } };
  window.ODCountries = {
    chips: function () { return ORDER.map(function (cc) { return { cc: cc, label: CC[cc].tab[L()] }; }); },
    has: function (cc) { return !!CC[String(cc || '').toUpperCase()]; },
    current: function () { return cur; },
    show: show, hide: hide
  };
})();
