/* Dehesa Index — Italia: estadísticas agrarias del ISTAT (índices de precios agrarios, macellazioni, consistenze del bestiame, fertilizzanti, fitosanitari).
   data/italy-istat/*.json (scripts/update-it-istat.py). Bloque de la ficha de Italia. ES5. window.DIItIstat. Usa window.ESUI (js/es-ui.js). */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Estadísticas agrarias de Italia (ISTAT)', tabs: { prices: 'Precios agrarios', slaughter: 'Sacrificios', herds: 'Censo ganadero', fert: 'Fertilizantes', pest: 'Fitosanitarios' },
      sold: 'Precios percibidos por el agricultor', bought: 'Precios pagados por el agricultor', side: 'Índice', prod: 'Producto', idx: 'Índice (2020 = 100)', mom: 'Mes anterior', yoy: 'Hace un año', all: 'Todos los grupos, ordenados por variación anual',
      cat: 'Categoría', metric: 'Dato', heads: 'Cabezas sacrificadas', dead: 'Peso canal (t)', yld: 'Rendimiento (%)', last: 'Último mes: {m}', vsY: 'frente al mismo mes del año anterior', per: 'Periodo', yr: 'Año', cls: 'Clase', type: 'Tipo', unitKg: 'kg de sustancia activa', unitHa: 'kg por hectárea', kind: 'Medida',
      reg: 'Por región', nat: 'Total nacional', trend: 'Evolución nacional', nodata: 'Sin dato publicado', mac: 'Macroárea', hint: 'Orden de mayor a menor. Una celda vacía es dato no publicado, no un cero.',
      nPrices: 'Índices del ISTAT, base 2020 = 100. Las variaciones son las que publica el propio ISTAT. Un índice de precios percibidos mide lo que cobra el agricultor, no lo que paga el consumidor.',
      nSlaughter: 'Macellazioni del ISTAT: mes provisional los más recientes. El peso canal se publica en quintales o en kg según la categoría y aquí se muestra en toneladas.',
      nHerds: 'Encuesta de consistencias del ISTAT (diciembre; junio para porcino y algunos grupos). Cabezas.',
      nFert: 'Fertilizantes distribuidos para uso agrícola, en toneladas de producto. Las cifras de 2013-2016 las publica el ISTAT en quintales y se pasan a toneladas. Es lo distribuido, no lo aplicado.',
      nPest: 'Sustancia activa contenida en los fitosanitarios distribuidos, por clase. Es lo distribuido para la venta, no lo aplicado en cada campo.', src: 'Fuente:' },
    en: { h: 'Italy agricultural statistics (ISTAT)', tabs: { prices: 'Farm prices', slaughter: 'Slaughter', herds: 'Livestock census', fert: 'Fertilisers', pest: 'Pesticides' },
      sold: 'Prices received by farmers', bought: 'Prices paid by farmers', side: 'Index', prod: 'Product', idx: 'Index (2020 = 100)', mom: 'Previous month', yoy: 'A year ago', all: 'All groups, ranked by annual change',
      cat: 'Category', metric: 'Measure', heads: 'Head slaughtered', dead: 'Carcase weight (t)', yld: 'Yield (%)', last: 'Latest month: {m}', vsY: 'against the same month a year earlier', per: 'Period', yr: 'Year', cls: 'Class', type: 'Type', unitKg: 'kg of active substance', unitHa: 'kg per hectare', kind: 'Measure',
      reg: 'By region', nat: 'National total', trend: 'National trend', nodata: 'No published figure', mac: 'Macro-area', hint: 'Ranked high to low. An empty cell means the figure is not published, not zero.',
      nPrices: 'ISTAT indices, 2020 = 100. The changes are the ones ISTAT publishes. A price-received index tracks what the farmer is paid, not what the consumer pays.',
      nSlaughter: 'ISTAT slaughter statistics; the latest months are provisional. Carcase weight is published in quintals or kg depending on the category and shown here in tonnes.',
      nHerds: 'ISTAT livestock survey (December; June for pigs and some groups). Head.',
      nFert: 'Fertilisers distributed for agricultural use, in tonnes of product. ISTAT publishes 2013-2016 in quintals; they are converted to tonnes. This is what was distributed, not what was applied.',
      nPest: 'Active substance contained in the plant protection products distributed, by class. It is what was distributed for sale, not what was applied in each field.', src: 'Source:' },
    fr: { h: 'Statistiques agricoles de l’Italie (ISTAT)', tabs: { prices: 'Prix agricoles', slaughter: 'Abattages', herds: 'Cheptel', fert: 'Engrais', pest: 'Phytosanitaires' },
      sold: 'Prix perçus par l’agriculteur', bought: 'Prix payés par l’agriculteur', side: 'Indice', prod: 'Produit', idx: 'Indice (2020 = 100)', mom: 'Mois précédent', yoy: 'Il y a un an', all: 'Tous les groupes, classés par variation annuelle',
      cat: 'Catégorie', metric: 'Donnée', heads: 'Têtes abattues', dead: 'Poids carcasse (t)', yld: 'Rendement (%)', last: 'Dernier mois : {m}', vsY: 'par rapport au même mois un an plus tôt', per: 'Période', yr: 'Année', cls: 'Classe', type: 'Type', unitKg: 'kg de substance active', unitHa: 'kg par hectare', kind: 'Mesure',
      reg: 'Par région', nat: 'Total national', trend: 'Évolution nationale', nodata: 'Pas de chiffre publié', mac: 'Macro-zone', hint: 'Classé du plus grand au plus petit. Une case vide signifie chiffre non publié, pas zéro.',
      nPrices: 'Indices ISTAT, base 2020 = 100. Les variations sont celles que publie l’ISTAT. Un indice des prix perçus mesure ce que touche l’agriculteur, pas ce que paie le consommateur.',
      nSlaughter: 'Abattages ISTAT ; les derniers mois sont provisoires. Le poids carcasse est publié en quintaux ou en kg selon la catégorie et affiché ici en tonnes.',
      nHerds: 'Enquête ISTAT sur le cheptel (décembre ; juin pour les porcins et certains groupes). Têtes.',
      nFert: 'Engrais distribués à usage agricole, en tonnes de produit. L’ISTAT publie 2013-2016 en quintaux ; ils sont convertis en tonnes. C’est ce qui a été distribué, pas ce qui a été épandu.',
      nPest: 'Substance active contenue dans les produits phytosanitaires distribués, par classe. C’est ce qui a été distribué à la vente, pas ce qui a été appliqué sur chaque parcelle.', src: 'Source :' },
    it: { h: 'Statistiche agricole dell’Italia (ISTAT)', tabs: { prices: 'Prezzi agricoli', slaughter: 'Macellazioni', herds: 'Consistenze', fert: 'Fertilizzanti', pest: 'Fitosanitari' },
      sold: 'Prezzi percepiti dagli agricoltori', bought: 'Prezzi pagati dagli agricoltori', side: 'Indice', prod: 'Prodotto', idx: 'Indice (2020 = 100)', mom: 'Mese precedente', yoy: 'Un anno fa', all: 'Tutti i gruppi, in ordine di variazione annua',
      cat: 'Categoria', metric: 'Dato', heads: 'Capi macellati', dead: 'Peso morto (t)', yld: 'Resa (%)', last: 'Ultimo mese: {m}', vsY: 'rispetto allo stesso mese dell’anno prima', per: 'Periodo', yr: 'Anno', cls: 'Classe', type: 'Tipo', unitKg: 'kg di sostanza attiva', unitHa: 'kg per ettaro', kind: 'Misura',
      reg: 'Per regione', nat: 'Totale nazionale', trend: 'Andamento nazionale', nodata: 'Dato non pubblicato', mac: 'Ripartizione', hint: 'In ordine decrescente. Una cella vuota è un dato non pubblicato, non uno zero.',
      nPrices: 'Indici ISTAT, base 2020 = 100. Le variazioni sono quelle pubblicate dall’ISTAT. Un indice dei prezzi percepiti misura quanto incassa l’agricoltore, non quanto paga il consumatore.',
      nSlaughter: 'Macellazioni ISTAT; gli ultimi mesi sono provvisori. Il peso morto è pubblicato in quintali o in kg a seconda della categoria e qui è mostrato in tonnellate.',
      nHerds: 'Indagine ISTAT sulle consistenze (dicembre; giugno per i suini e alcuni gruppi). Capi.',
      nFert: 'Fertilizzanti distribuiti per uso agricolo, in tonnellate di prodotto. L’ISTAT pubblica il 2013-2016 in quintali; qui sono convertiti in tonnellate. È il distribuito, non l’applicato.',
      nPest: 'Sostanza attiva contenuta nei prodotti fitosanitari distribuiti, per classe. È il distribuito per la vendita, non l’applicato in ogni campo.', src: 'Fonte:' }
  };
  var U = global.ESUI, ST = { tab: 'prices', side: 'sold', prod: null, cat: null, metric: 'heads', hcat: null, hper: null, ftype: null, fyear: null, pcls: null, pkind: 'kg', pyear: null }, D = {}, LAST_LG = 'es';
  var FILES = { prices: 'prices', slaughter: 'slaughter', herds: 'herds', fert: 'fertilisers', pest: 'pesticides' };
  function lbl(o, lg, code) { var l = o && o.label; return (l && (l[lg] || l.en || l.it)) || code; }
  function alab(o, lg, code) { return lbl(o, lg, code); }
  function nice(s) { s = String(s || ''); return s === s.toUpperCase() && s.length > 3 ? s.charAt(0) + s.slice(1).toLowerCase() : s; }
  function lastIdx(a) { for (var i = a.length - 1; i >= 0; i--) if (a[i] != null) return i; return -1; }
  function sgn(v, d) { return v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + U.nf(Math.abs(v), d == null ? 1 : d) + ' %'; }
  function col(v) { return v == null || v === 0 ? '' : v > 0 ? 'color:#2f7d4f' : 'color:#b4541a'; }
  function card(n, v, note) { return '<div class="cof-card"><div class="cof-n">' + n + '</div><div class="cof-v">' + v + '</div>' + (note ? '<div class="cof-note">' + note + '</div>' : '') + '</div>'; }
  function selOf(obj, lg, cur, sortFn) { var ks = Object.keys(obj); if (sortFn) ks.sort(sortFn); return ks.map(function (k) { return U.opt(k, nice(lbl(obj[k], lg, k)), cur); }).join(''); }
  function monthLabel(m, lg) { var p = m.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, 1)).toLocaleDateString(lg, { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return m; } }
  function note(t, k) { return '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t[k]) + '</p>'; }

  function pricesView(d, lg, t) {
    var g = d[ST.side], items = g.items, ks = Object.keys(items);
    if (!items[ST.prod]) ST.prod = ks[0];
    var e = items[ST.prod], M = g.months, i = lastIdx(e.index), out = '';
    out += U.sel('it-side', t.side, U.opt('sold', t.sold, ST.side) + U.opt('bought', t.bought, ST.side), ST.side) + U.sel('it-prod', t.prod, selOf(items, lg, ST.prod, function (a, b) { return nice(lbl(items[a], lg, a)).localeCompare(nice(lbl(items[b], lg, b))); }), ST.prod);
    out += '<div class="cof-cards">' + card(t.idx + ' · ' + U.esc(monthLabel(M[i], lg)), U.nf(e.index[i], 1)) + card(t.mom, '<span style="' + col(e.mom[i]) + '">' + sgn(e.mom[i]) + '</span>') + card(t.yoy, '<span style="' + col(e.yoy[i]) + '">' + sgn(e.yoy[i]) + '</span>') + '</div>';
    out += U.chart([{ name: nice(lbl(e, lg, ST.prod)), v: e.index }], M.map(function (m) { return monthLabel(m, lg); }), t.idx, nice(lbl(e, lg, ST.prod)), 1);
    var rows = ks.map(function (k) { var x = items[k], j = lastIdx(x.index); return { k: k, l: nice(lbl(x, lg, k)), idx: x.index[j], yoy: x.yoy[j] }; }).sort(function (a, b) { return (b.yoy == null ? -1e9 : b.yoy) - (a.yoy == null ? -1e9 : a.yoy); });
    out += '<h3 class="cof-h3">' + U.esc(t.all) + '</h3><div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:320px;font-size:13.5px"><thead><tr><th style="' + U.th + 'text-align:left">' + U.esc(t.prod) + '</th><th style="' + U.th + 'text-align:right">' + U.esc(t.idx) + '</th><th style="' + U.th + 'text-align:right">' + U.esc(t.yoy) + '</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td style="' + U.td + 'text-align:left">' + U.esc(r.l) + '</td><td style="' + U.td + '">' + U.nf(r.idx, 1) + '</td><td style="' + U.td + col(r.yoy) + '">' + sgn(r.yoy) + '</td></tr>'; }).join('') + '</tbody></table></div>' + note(t, 'nPrices');
    return out;
  }
  function slaughterView(d, lg, t) {
    var sp = d.species, ks = Object.keys(sp), M = d.months;
    if (!sp[ST.cat]) ST.cat = sp.TOTCATT ? 'TOTCATT' : ks[0];
    var e = sp[ST.cat], out = '', k = ST.metric, arr = e[k], i = lastIdx(arr);
    out += U.sel('it-cat', t.cat, selOf(sp, lg, ST.cat, function (a, b) { return nice(lbl(sp[a], lg, a)).localeCompare(nice(lbl(sp[b], lg, b))); }), ST.cat) + U.sel('it-metric', t.metric, U.opt('heads', t.heads, k) + U.opt('dead', t.dead, k) + U.opt('yield', t.yld, k), k);
    if (i < 0) return out + '<p class="cof-note">' + U.esc(t.nodata) + '</p>';
    var prev = M.indexOf(String(+M[i].slice(0, 4) - 1) + M[i].slice(4)), pv = prev >= 0 ? arr[prev] : null, ch = pv ? (arr[i] / pv - 1) * 100 : null;
    out += '<div class="cof-cards">' + card(U.esc(t.last.replace('{m}', monthLabel(M[i], lg))), U.nf(arr[i], k === 'yield' ? 1 : 0) + (k === 'yield' ? ' %' : ''), k === 'yield' ? '' : ch == null ? '' : '<span style="' + col(ch) + '">' + sgn(ch) + '</span> ' + U.esc(t.vsY)) + '</div>';
    out += U.chart([{ name: nice(lbl(e, lg, ST.cat)), v: arr }], M.map(function (m) { return monthLabel(m, lg); }), k === 'heads' ? t.heads : k === 'dead' ? t.dead : t.yld, nice(lbl(e, lg, ST.cat)), k === 'yield' ? 1 : 0);
    return out + note(t, 'nSlaughter');
  }
  function regional(d, lg, t, o) {
    /* o: groups (obj code -> {label, v:{area:[...]}}), axis, key (state key for group), unit, note */
    var G = o.groups, ks = Object.keys(G), A = d.areas, ax = d[o.axis];
    if (!G[ST[o.key]]) ST[o.key] = ks[0];
    var g = G[ST[o.key]], yk = o.yk;
    if (ax.indexOf(ST[yk]) < 0) { var cand = ax.map(function (p, j) { var any = false, a; for (a in g.v) if (g.v[a][j] != null) any = true; return any ? p : null; }).filter(Boolean); ST[yk] = cand[cand.length - 1] || ax[ax.length - 1]; }
    var j = ax.indexOf(ST[yk]), out = '';
    var gsel = U.sel('it-g-' + o.key, o.glabel, selOf(G, lg, ST[o.key], function (a, b) { return nice(lbl(G[a], lg, a)).localeCompare(nice(lbl(G[b], lg, b))); }), ST[o.key]);
    out += gsel + U.sel('it-y-' + o.key, t.per, ax.slice().reverse().map(function (p) { return U.opt(p, p, ST[yk]); }).join(''), ST[yk]) + (o.extra || '');
    var it = g.v.IT ? g.v.IT[j] : null, itp = g.v.IT && j > 0 ? g.v.IT[j - 1] : null;
    out += '<div class="cof-cards">' + card(U.esc(t.nat + ' · ' + ST[yk]), it == null ? '–' : U.nf(it, o.dec) + ' ' + U.esc(o.unit), itp ? '<span style="' + col(it - itp) + '">' + sgn((it / itp - 1) * 100) + '</span>' : '') + '</div>';
    var rows = Object.keys(g.v).filter(function (a) { return A[a] && A[a].kind === 'region' && g.v[a][j] != null; }).map(function (a) { return [nice(alab(A[a], lg, a)), g.v[a][j]]; }).sort(function (a, b) { return b[1] - a[1]; });
    if (rows.length) out += '<h3 class="cof-h3">' + U.esc(t.reg) + '</h3>' + U.bars(rows, rows[0][1] || 1, o.dec, o.unit);
    if (g.v.IT && g.v.IT.filter(function (x) { return x != null; }).length > 1) out += '<h3 class="cof-h3">' + U.esc(t.trend) + '</h3>' + U.chart([{ name: nice(lbl(g, lg, ST[o.key])), v: g.v.IT }], ax, o.unit, nice(lbl(g, lg, ST[o.key])), o.dec);
    return out + '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t.hint) + '</p>' + note(t, o.note);
  }
  function herdsView(d, lg, t) {
    var G = {}; Object.keys(d.herds).forEach(function (k) { var h = d.herds[k]; G[k] = { label: { en: nice(lbl(h, 'en', k)) + (h.sex === '1' ? ' (M)' : h.sex === '2' ? ' (F)' : ''), it: nice(lbl(h, 'it', k)) + (h.sex === '1' ? ' (M)' : h.sex === '2' ? ' (F)' : '') }, v: h.v }; });
    return regional(d, lg, t, { groups: G, axis: 'periods', key: 'hcat', yk: 'hper', unit: lg === 'es' ? 'cabezas' : lg === 'fr' ? 'têtes' : lg === 'it' ? 'capi' : 'head', dec: 0, glabel: t.cat, note: 'nHerds' });
  }
  function fertView(d, lg, t) { return regional(d, lg, t, { groups: d.types, axis: 'years', key: 'ftype', yk: 'fyear', unit: 't', dec: 0, glabel: t.type, note: 'nFert' }); }
  function pestView(d, lg, t) {
    var ha = ST.pkind === 'ha', ex = U.sel('it-kind', t.kind, U.opt('kg', t.unitKg, ST.pkind) + U.opt('ha', t.unitHa, ST.pkind), ST.pkind);
    return regional(d, lg, t, { groups: ha ? d.perHa : d.classes, axis: 'years', key: 'pcls', yk: 'pyear', unit: ha ? 'kg/ha' : 'kg', dec: ha ? 2 : 0, glabel: t.cls, note: 'nPest', extra: ex });
  }
  var VIEWS = { prices: pricesView, slaughter: slaughterView, herds: herdsView, fert: fertView, pest: pestView };
  function load(tab) { var f = FILES[tab]; if (!D[f]) D[f] = U.json('data/italy-istat/' + f + '.json'); return D[f]; }

  function mount(el, lg) {
    if (!el || !U) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es'; LAST_LG = lg;
    function draw(focus) {
      var t = T[lg];
      return load(ST.tab).then(function (d) {
        if (!d) { el.hidden = true; return false; }
        el.hidden = false;
        var tabs = Object.keys(T.es.tabs).map(function (k) { return U.chip(k === ST.tab, 'it-tab', 'data-tab="' + k + '"', t.tabs[k]); }).join('');
        var body; try { body = VIEWS[ST.tab](d, lg, t); } catch (e) { body = '<p class="cof-note">' + U.esc(t.nodata) + '</p>'; }
        el.innerHTML = '<section class="di-card cof" id="ps-it-istat" style="max-width:none"><h2 class="cof-h2">' + U.esc(t.h) + '</h2><div style="margin:6px 0 10px">' + tabs + '</div>' + body + U.cite('istat') + '</section>';
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        return true;
      });
    }
    if (!el.getAttribute('data-it')) {
      el.setAttribute('data-it', '1');
      el.addEventListener('click', function (ev) { var b = ev.target.closest ? ev.target.closest('.it-tab') : null; if (b) { ST.tab = b.getAttribute('data-tab'); draw('.it-tab[data-tab="' + ST.tab + '"]'); } });
      el.addEventListener('change', function (ev) {
        var id = ev.target.id || '', v = ev.target.value, m;
        if (id === 'it-side') { ST.side = v; ST.prod = null; } else if (id === 'it-prod') ST.prod = v; else if (id === 'it-cat') ST.cat = v; else if (id === 'it-metric') ST.metric = v; else if (id === 'it-kind') { ST.pkind = v; ST.pcls = null; }
        else if ((m = /^it-([gy])-(\w+)$/.exec(id))) { var key = m[2], yk = { hcat: 'hper', ftype: 'fyear', pcls: 'pyear' }[key]; if (m[1] === 'g') ST[key] = v; else ST[yk] = v; }
        draw('#' + id);
      });
    }
    return Promise.all([global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function () { return draw(); });
  }
  global.DIItIstat = { mount: mount };
})(window);
