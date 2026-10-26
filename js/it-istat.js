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
  function card(n, v, note) { return '<div class="di-card cof-card"><div class="cof-lbl">' + n + '</div><div class="cof-val">' + v + '</div>' + (note ? '<div class="cof-note" style="margin:2px 0 0">' + note + '</div>' : '') + '</div>'; }
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
    out += '<h3 class="cof-h3">' + U.esc(t.all) + '</h3><div style="overflow-x:auto"><table data-no-cards data-no-rows style="border-collapse:collapse;width:100%;min-width:320px;font-size:13.5px"><thead><tr><th style="' + U.th + 'text-align:left">' + U.esc(t.prod) + '</th><th style="' + U.th + 'text-align:right">' + U.esc(t.idx) + '</th><th style="' + U.th + 'text-align:right">' + U.esc(t.yoy) + '</th></tr></thead><tbody>' +
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
    var G0 = o.groups, A = d.areas, ax = d[o.axis], G = {}, k0, KD = o.kinds || ['region'];
    for (k0 in G0) if (G0.hasOwnProperty(k0) && Object.keys(G0[k0].v).some(function (a) { return A[a] && KD.indexOf(A[a].kind) >= 0; })) G[k0] = G0[k0];
    var ks = Object.keys(G);
    if (!G[ST[o.key]]) ST[o.key] = G[o.pref] ? o.pref : G['TOTCATT|9'] ? 'TOTCATT|9' : G.ALL ? 'ALL' : ks[0];
    var g = G[ST[o.key]], yk = o.yk;
    if (ax.indexOf(ST[yk]) < 0) { var cand = ax.map(function (p, j) { var n = 0, a; for (a in g.v) if (A[a] && KD.indexOf(A[a].kind) >= 0 && g.v[a][j] != null) n++; return n >= 3 ? p : null; }).filter(Boolean); if (!cand.length) cand = ax.map(function (p, j) { var any = false, a; for (a in g.v) if (g.v[a][j] != null) any = true; return any ? p : null; }).filter(Boolean); ST[yk] = cand[cand.length - 1] || ax[ax.length - 1]; }
    var j = ax.indexOf(ST[yk]), out = '', UNIT = typeof o.unit === 'function' ? o.unit(ST[o.key], g) : o.unit, DEC = typeof o.dec === 'function' ? o.dec(UNIT) : o.dec;
    var gsel = U.sel('it-g-' + o.key, o.glabel, selOf(G, lg, ST[o.key], function (a, b) { return nice(lbl(G[a], lg, a)).localeCompare(nice(lbl(G[b], lg, b))); }), ST[o.key]);
    out += gsel + U.sel('it-y-' + o.key, t.per, ax.slice().reverse().map(function (p) { return U.opt(p, p, ST[yk]); }).join(''), ST[yk]) + (o.extra || '');
    var it = g.v.IT ? g.v.IT[j] : null, itp = g.v.IT && j > 0 ? g.v.IT[j - 1] : null;
    out += '<div class="cof-cards">' + card(U.esc(t.nat + ' · ' + ST[yk]), it == null ? '–' : U.nf(it, DEC) + ' ' + U.esc(UNIT), itp ? '<span style="' + col(it - itp) + '">' + sgn((it / itp - 1) * 100) + '</span>' : '') + '</div>';
    var rows = Object.keys(g.v).filter(function (a) { return A[a] && KD.indexOf(A[a].kind) >= 0 && !(A.ITDA && (a === 'ITD1' || a === 'ITD2')) && g.v[a][j] != null; }).map(function (a) { return [nice(alab(A[a], lg, a)), g.v[a][j]]; }).sort(function (a, b) { return b[1] - a[1]; });
    if (KD[0] === 'province') rows = rows.slice(0, 30);
    if (rows.length) out += '<h3 class="cof-h3">' + U.esc(KD[0] === 'province' ? (o.provTitle || t.prov) : t.reg) + '</h3>' + U.bars(rows, rows[0][1] || 1, DEC, UNIT) + '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t.hint) + '</p>';
    if (g.v.IT && g.v.IT.filter(function (x) { return x != null; }).length > 1) out += '<h3 class="cof-h3">' + U.esc(t.trend) + '</h3>' + U.chart([{ name: nice(lbl(g, lg, ST[o.key])), v: g.v.IT }], ax, UNIT, nice(lbl(g, lg, ST[o.key])), DEC);
    return out + note(t, o.note);
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

  /* segunda tanda: cultivos, lácteos, agriturismo y riego (censo 2020) */
  var X2 = {
    es: { tabs: { crops: 'Cultivos', milk: 'Leche por región', agri: 'Agriturismo', irr: 'Riego (censo 2020)' }, provAll: 'Por provincia', nCropsP: 'Coltivazioni del ISTAT por provincia: superficie en hectáreas y producción recolectada (el ISTAT la publica en quintales y aquí va en toneladas). Bolzano y Trento figuran como provincias autónomas. En 2026 (estimación) el ISTAT ya usa las provincias nuevas de Cerdeña, por eso Sud Sardegna deja de aparecer y Cagliari cambia de tamaño. Las sumas por región cuadran con las cifras regionales; una celda ausente es un dato que el ISTAT no publica.', prov: 'Por provincia (las 30 primeras)', crop: 'Cultivo', metric2: 'Dato', area: 'Superficie (ha)', prodT: 'Producción recolectada (t)', product: 'Producto', serie: 'Serie', view: 'Desglose', ik: 'Territorio', iRegion: 'Regiones', iProv: 'Provincias',
      vIrr: 'Superficie y explotaciones', vSys: 'Por sistema de riego', vSrc: 'Por fuente de agua', vCrop: 'Por cultivo regado', cm: 'Municipios', cmBtn: 'Buscar por municipio', cmSearch: 'Nombre del municipio', cmReg: 'Región', cmAll: 'Todas', cmShow: 'Se muestran los {n} con más superficie regada', cmNone: 'Ningún municipio coincide', cmCols: ['Municipio', 'Provincia', 'Expl. regadas', 'Regada (ha)', 'Regable (ha)'],
      nCrops: 'Coltivazioni del ISTAT: superficie en hectáreas y producción recolectada, que el ISTAT publica en quintales y aquí va en toneladas. Los años más recientes son estimaciones. Cada cultivo aparece solo si el ISTAT publica su superficie.',
      nMilk: 'Latte e prodotti lattiero-caseari (ISTAT). Producción en toneladas (el ISTAT la da en quintales o toneladas); grasa y proteína en %. La serie regional llega hasta el último año que publica el ISTAT.',
      nAgri: 'Agriturismo (ISTAT): autorizaciones activas a 31 de diciembre. Una misma explotación puede contar en varios servicios, así que las series no se suman entre sí.',
      nIrr: 'Censimento dell’agricoltura 2020 del ISTAT (y la encuesta de 2023 cuando existe). Superficie en hectáreas. Regable es lo que podría regarse; regada, lo que se regó en la campaña.', farms: 'explotaciones', beds: 'camas', pitches: 'plazas de acampada', seats: 'comensales (plazas)', rooms: 'habitaciones', plants: 'establecimientos', cmNote: 'Datos del censo 2020 por municipio; la región se deduce del código ISTAT del municipio.' },
    en: { tabs: { crops: 'Crops', milk: 'Milk by region', agri: 'Agritourism', irr: 'Irrigation (2020 census)' }, provAll: 'By province', nCropsP: 'ISTAT crop statistics by province: area in hectares and harvested production (ISTAT publishes quintals; shown here in tonnes). Bolzano and Trento appear as autonomous provinces. In 2026 (estimate) ISTAT already uses Sardinia’s new provinces, so Sud Sardegna disappears and Cagliari changes size. Sums by region match the regional figures; a missing cell is a figure ISTAT does not publish.', prov: 'By province (top 30)', crop: 'Crop', metric2: 'Measure', area: 'Area (ha)', prodT: 'Harvested production (t)', product: 'Product', serie: 'Series', view: 'Breakdown', ik: 'Territory', iRegion: 'Regions', iProv: 'Provinces',
      vIrr: 'Area and farms', vSys: 'By irrigation system', vSrc: 'By water source', vCrop: 'By irrigated crop', cm: 'Municipalities', cmBtn: 'Search by municipality', cmSearch: 'Municipality name', cmReg: 'Region', cmAll: 'All', cmShow: 'Showing the {n} with the most irrigated area', cmNone: 'No municipality matches', cmCols: ['Municipality', 'Province', 'Irrigating farms', 'Irrigated (ha)', 'Irrigable (ha)'],
      nCrops: 'ISTAT crop statistics: area in hectares and harvested production, which ISTAT publishes in quintals and is shown here in tonnes. The latest years are estimates. A crop appears only if ISTAT publishes its area.',
      nMilk: 'ISTAT milk and dairy statistics. Output in tonnes (ISTAT gives quintals or tonnes); fat and protein in %. The regional series runs to the last year ISTAT publishes.',
      nAgri: 'ISTAT agritourism: authorisations active on 31 December. A farm can count under several services, so the series do not add up to each other.',
      nIrr: 'ISTAT 2020 agricultural census (and the 2023 survey where it exists). Area in hectares. Irrigable is what could be irrigated; irrigated is what was irrigated that season.', farms: 'farms', beds: 'beds', pitches: 'camping pitches', seats: 'seats', rooms: 'rooms', plants: 'plants', cmNote: '2020 census data by municipality; the region is inferred from the municipality’s ISTAT code.' },
    fr: { tabs: { crops: 'Cultures', milk: 'Lait par région', agri: 'Agritourisme', irr: 'Irrigation (recensement 2020)' }, provAll: 'Par province', nCropsP: 'Statistiques de cultures de l’ISTAT par province : surface en hectares et production récoltée (l’ISTAT publie des quintaux ; ici en tonnes). Bolzano et Trente figurent comme provinces autonomes. En 2026 (estimation) l’ISTAT utilise déjà les nouvelles provinces de Sardaigne : Sud Sardegna disparaît et Cagliari change de taille. Les sommes par région correspondent aux chiffres régionaux ; une case vide est une donnée que l’ISTAT ne publie pas.', prov: 'Par province (les 30 premières)', crop: 'Culture', metric2: 'Donnée', area: 'Surface (ha)', prodT: 'Production récoltée (t)', product: 'Produit', serie: 'Série', view: 'Détail', ik: 'Territoire', iRegion: 'Régions', iProv: 'Provinces',
      vIrr: 'Surface et exploitations', vSys: 'Par système d’irrigation', vSrc: 'Par source d’eau', vCrop: 'Par culture irriguée', cm: 'Communes', cmBtn: 'Chercher par commune', cmSearch: 'Nom de la commune', cmReg: 'Région', cmAll: 'Toutes', cmShow: 'Affichage des {n} communes à la plus grande surface irriguée', cmNone: 'Aucune commune ne correspond', cmCols: ['Commune', 'Province', 'Expl. irriguant', 'Irriguée (ha)', 'Irrigable (ha)'],
      nCrops: 'Statistiques de cultures de l’ISTAT : surface en hectares et production récoltée, que l’ISTAT publie en quintaux et qui est affichée ici en tonnes. Les années récentes sont des estimations. Une culture n’apparaît que si l’ISTAT publie sa surface.',
      nMilk: 'Lait et produits laitiers (ISTAT). Production en tonnes (l’ISTAT la donne en quintaux ou en tonnes) ; matière grasse et protéines en %. La série régionale va jusqu’à la dernière année publiée par l’ISTAT.',
      nAgri: 'Agritourisme (ISTAT) : autorisations actives au 31 décembre. Une même exploitation peut compter dans plusieurs services : les séries ne s’additionnent pas.',
      nIrr: 'Recensement agricole 2020 de l’ISTAT (et l’enquête de 2023 lorsqu’elle existe). Surfaces en hectares. Irrigable : ce qui pourrait être irrigué ; irriguée : ce qui l’a été pendant la campagne.', farms: 'exploitations', beds: 'lits', pitches: 'emplacements de camping', seats: 'couverts', rooms: 'chambres', plants: 'établissements', cmNote: 'Données du recensement 2020 par commune ; la région est déduite du code ISTAT de la commune.' },
    it: { tabs: { crops: 'Coltivazioni', milk: 'Latte per regione', agri: 'Agriturismo', irr: 'Irrigazione (censimento 2020)' }, provAll: 'Per provincia', nCropsP: 'Coltivazioni ISTAT per provincia: superficie in ettari e produzione raccolta (l’ISTAT pubblica quintali; qui in tonnellate). Bolzano e Trento figurano come province autonome. Nel 2026 (stima) l’ISTAT usa già le nuove province della Sardegna: Sud Sardegna scompare e Cagliari cambia dimensione. Le somme per regione coincidono con le cifre regionali; una cella vuota è un dato che l’ISTAT non pubblica.', prov: 'Per provincia (le prime 30)', crop: 'Coltivazione', metric2: 'Dato', area: 'Superficie (ha)', prodT: 'Produzione raccolta (t)', product: 'Prodotto', serie: 'Serie', view: 'Dettaglio', ik: 'Territorio', iRegion: 'Regioni', iProv: 'Province',
      vIrr: 'Superficie e aziende', vSys: 'Per sistema di irrigazione', vSrc: 'Per fonte idrica', vCrop: 'Per coltivazione irrigata', cm: 'Comuni', cmBtn: 'Cerca per comune', cmSearch: 'Nome del comune', cmReg: 'Regione', cmAll: 'Tutte', cmShow: 'Si mostrano i {n} con più superficie irrigata', cmNone: 'Nessun comune corrisponde', cmCols: ['Comune', 'Provincia', 'Aziende irriganti', 'Irrigata (ha)', 'Irrigabile (ha)'],
      nCrops: 'Coltivazioni ISTAT: superficie in ettari e produzione raccolta, che l’ISTAT pubblica in quintali e qui è in tonnellate. Gli anni più recenti sono stime. Una coltivazione compare solo se l’ISTAT ne pubblica la superficie.',
      nMilk: 'Latte e prodotti lattiero-caseari (ISTAT). Produzione in tonnellate (l’ISTAT la dà in quintali o tonnellate); grasso e proteine in %. La serie regionale arriva all’ultimo anno pubblicato dall’ISTAT.',
      nAgri: 'Agriturismo (ISTAT): autorizzazioni attive al 31 dicembre. La stessa azienda può rientrare in più servizi, quindi le serie non si sommano.',
      nIrr: 'Censimento dell’agricoltura 2020 dell’ISTAT (e l’indagine 2023 dove esiste). Superfici in ettari. Irrigabile è ciò che potrebbe essere irrigato; irrigata, ciò che è stato irrigato nell’annata.', farms: 'aziende', beds: 'posti letto', pitches: 'piazzole', seats: 'posti a tavola', rooms: 'camere', plants: 'stabilimenti', cmNote: 'Dati del censimento 2020 per comune; la regione è dedotta dal codice ISTAT del comune.' }
  };
  Object.keys(X2).forEach(function (l) { var k; for (k in X2[l]) if (k !== 'tabs') T[l][k] = X2[l][k]; for (k in X2[l].tabs) T[l].tabs[k] = X2[l].tabs[k]; });
  FILES.crops = 'crops'; FILES.milk = 'milk'; FILES.agri = 'agritourism'; FILES.irr = 'irrigation';
  function sub(o, key) { var g = {}; Object.keys(o).forEach(function (c) { if (o[c][key] && Object.keys(o[c][key]).length) g[c] = { label: o[c].label, v: o[c][key] }; }); return g; }
  function cropsView(d, lg, t) {
    var m = ST.cmet || 'a', kd = ST.ck === 'province' && d.regions ? 'province' : 'region', rf = kd === 'province' ? (ST.creg || '') : '';
    var ex = U.sel('it-cm', t.metric2, U.opt('a', t.area, m) + U.opt('p', t.prodT, m), m) + U.sel('it-ck', t.ik, U.opt('region', t.iRegion, kd) + U.opt('province', t.iProv, kd), kd);
    if (kd === 'province') ex += U.sel('it-cr', t.cmReg, U.opt('', t.cmAll, rf) + Object.keys(d.regions).sort(function (x, y) { return nice(lbl({ label: d.regions[x] }, lg, x)).localeCompare(nice(lbl({ label: d.regions[y] }, lg, y))); }).map(function (r) { return U.opt(r, nice(lbl({ label: d.regions[r] }, lg, r)), rf); }).join(''), rf);
    var G = sub(d.crops, m), best = null, bv = -1;
    if (rf) Object.keys(G).forEach(function (c) { var v = {}; Object.keys(G[c].v).forEach(function (a) { if (a === 'IT' || (d.areas[a] && d.areas[a].region === rf)) v[a] = G[c].v[a]; }); G[c] = { label: G[c].label, v: v }; });
    if (!G[ST.ccrop] && G.WHEATD) ST.ccrop = 'WHEATD';
    if (!G[ST.ccrop]) { Object.keys(G).forEach(function (c) { var v = G[c].v.IT; var l = v ? v[lastIdx(v)] : null; if (l != null && l > bv) { bv = l; best = c; } }); ST.ccrop = best; }
    return regional(d, lg, t, { groups: G, axis: 'years', key: 'ccrop', yk: 'cyear', kinds: [kd], unit: m === 'a' ? 'ha' : 't', dec: 0, glabel: t.crop, note: kd === 'province' ? 'nCropsP' : 'nCrops', extra: ex, provTitle: rf ? t.provAll : null });
  }
  function milkView(d, lg, t) {
    var G = {}; Object.keys(d.products).forEach(function (c) { G[c] = d.products[c]; });
    Object.keys(d.plants).forEach(function (c) { var l = d.plants[c].label; G['plants|' + c] = { label: { en: 'Number of plants: ' + (l.en || c), it: 'Numero di stabilimenti: ' + (l.it || c) }, v: d.plants[c].v }; });
    return regional(d, lg, t, { groups: G, axis: 'years', key: 'mprod', yk: 'myear', pref: 'TOT_MILK_Q', unit: function (c, g) { return c.indexOf('plants|') === 0 ? t.plants : g.unit === '%' ? '%' : 't'; }, dec: function (u) { return u === '%' ? 2 : 0; }, glabel: t.product, note: 'nMilk' });
  }
  var AU = { NUMAGRIAUTH: 'farms', NUMBEDS: 'beds', NUMSITES: 'pitches', NUMSEATS: 'seats', NUMROOM: 'rooms' };
  function agriView(d, lg, t) {
    var G = {}, tag = {};
    Object.keys(d.series).forEach(function (k) { var s = d.series[k]; G[k] = s; tag[k] = AU[s.measure] || 'farms'; });
    var dn = { ACT: ['Authorised farms (active)', 'Aziende autorizzate (attive)'], NEW: ['New authorisations in the year', 'Nuove autorizzazioni nell’anno'], CLOSED: ['Authorisations closed in the year', 'Autorizzazioni cessate nell’anno'] };
    Object.keys(d.dynamics || {}).forEach(function (k) { G['dyn|' + k] = { label: { en: dn[k][0], it: dn[k][1] }, v: d.dynamics[k] }; tag['dyn|' + k] = 'farms'; });
    Object.keys(d.altimetric || {}).forEach(function (k) { var l = d.altimetric[k].label; G['alt|' + k] = { label: { en: 'Authorised farms · ' + l.en, it: 'Aziende autorizzate · ' + l.it }, v: d.altimetric[k].v }; tag['alt|' + k] = 'farms'; });
    var sx = { '1': ['men', 'uomini'], '2': ['women', 'donne'] };
    Object.keys(d.sex || {}).forEach(function (k) { G['sex|' + k] = { label: { en: 'Authorised farms run by ' + sx[k][0], it: 'Aziende autorizzate condotte da ' + sx[k][1] }, v: d.sex[k] }; tag['sex|' + k] = 'farms'; });
    return regional(d, lg, t, { groups: G, axis: 'years', key: 'aser', yk: 'ayear', pref: 'NUMAGRIAUTH|ALL|ALL', unit: function (c) { return t[tag[c]] || t.farms; }, dec: 0, glabel: t.serie, note: 'nAgri' });
  }
  var CM = null;
  function irrView(d, lg, t) {
    var vw = ST.iview || 'irr', kd = ST.ik || 'region', G = {};
    var ex = U.sel('it-iv', t.view, U.opt('irr', t.vIrr, vw) + U.opt('sys', t.vSys, vw) + U.opt('src', t.vSrc, vw) + U.opt('crop', t.vCrop, vw), vw) + U.sel('it-ik', t.ik, U.opt('region', t.iRegion, kd) + U.opt('province', t.iProv, kd), kd);
    var src = vw === 'irr' ? d.irrigable : vw === 'sys' ? d.bySystem : vw === 'src' ? d.bySource : d.byCrop;
    Object.keys(src).forEach(function (c) { var s = src[c]; G[c] = { label: s.part && d.parts[vw] ? { en: lbl({ label: d.measures[s.measure] }, 'en', s.measure) + ' · ' + lbl({ label: d.parts[vw][s.part] }, 'en', s.part), it: lbl({ label: d.measures[s.measure] }, 'it', s.measure) + ' · ' + lbl({ label: d.parts[vw][s.part] }, 'it', s.part) } : { en: lbl({ label: d.measures[s.measure] }, 'en', s.measure), it: lbl({ label: d.measures[s.measure] }, 'it', s.measure) }, v: s.v, m: s.measure }; });
    var pref = vw === 'irr' ? 'IA' : vw === 'sys' ? 'IA|ALL' : vw === 'src' ? 'IA|ALL' : 'IA|ALL';
    var body = regional(d, lg, t, { groups: G, axis: 'years', key: 'iser', yk: 'iyear', pref: pref, kinds: [kd], unit: function (c, g) { return /^(IA|IBA|IA_CONSIR)/.test(c) ? 'ha' : t.farms; }, dec: 0, glabel: t.metric2, note: 'nIrr', extra: ex });
    return body + '<h3 class="cof-h3">' + U.esc(t.cm) + '</h3><div id="it-cm-box"><button type="button" class="it-cm-btn" style="font:inherit;cursor:pointer;padding:7px 12px">' + U.esc(t.cmBtn) + '</button></div>';
  }
  function cmTable(lg, t, q, reg) {
    var R = CM.rows, rn = {}, out, n = 0, nq = norm(q);
    var A = CM.areaNames || {};
    var rows = R.filter(function (r) { return (!reg || r[2] === reg) && (!nq || norm(r[1]).indexOf(nq) >= 0); }).sort(function (a, b) { return (b[7] || 0) - (a[7] || 0); }).slice(0, 25);
    if (!rows.length) return '<p class="cof-note">' + U.esc(t.cmNone) + '</p>';
    return '<p class="cof-note" style="margin:8px 0">' + U.esc(t.cmShow.replace('{n}', rows.length)) + '</p><div style="overflow-x:auto"><table data-no-cards data-no-rows style="border-collapse:collapse;width:100%;min-width:360px;font-size:13px"><thead><tr>' + t.cmCols.map(function (h, i) { return '<th style="' + U.th + (i < 2 ? 'text-align:left' : 'text-align:right') + '">' + U.esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td style="' + U.td + 'text-align:left">' + U.esc(r[1]) + '</td><td style="' + U.td + 'text-align:left">' + U.esc(r[3] || CM.regNames[r[2]] || '') + '</td><td style="' + U.td + '">' + U.nf(r[5], 0) + '</td><td style="' + U.td + '">' + U.nf(r[7], 0) + '</td><td style="' + U.td + '">' + U.nf(r[6], 0) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="cof-note" style="margin:8px 0 0">' + U.esc(t.cmNote) + '</p>';
  }
  function norm(s) { s = String(s || '').toLowerCase(); try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {} return s.replace(/[^a-z0-9]+/g, ' ').trim(); }
  function cmOpen(el, lg) {
    var t = T[lg], box = el.querySelector('#it-cm-box'); if (!box) return;
    Promise.all([CM ? CM : U.json('data/italy-istat/comuni.json'), D.irrigation]).then(function (a) {
      if (!a[0]) { box.innerHTML = '<p class="cof-note">' + U.esc(t.nodata) + '</p>'; return; }
      if (!CM || !CM.regNames) { CM = a[0]; CM.regNames = {}; var A = a[1] ? a[1].areas : {}; Object.keys(A).forEach(function (k) { if (A[k].kind === 'region') CM.regNames[k] = nice(lbl(A[k], lg, k)); }); }
      var opts = U.opt('', t.cmAll, '') + Object.keys(CM.regNames).sort(function (x, y) { return CM.regNames[x].localeCompare(CM.regNames[y]); }).map(function (k) { return U.opt(k, CM.regNames[k], ''); }).join('');
      box.innerHTML = '<label class="di-movers-hint" style="display:inline-block;margin:0 14px 8px 0">' + U.esc(t.cmSearch) + '<input id="it-cm-q" type="search" style="display:block;margin-top:3px;font:inherit;padding:6px 8px;min-width:200px"></label>' + U.sel('it-cm-r', t.cmReg, opts, '') + '<div id="it-cm-out"></div>';
      var go = function () { box.querySelector('#it-cm-out').innerHTML = cmTable(lg, t, box.querySelector('#it-cm-q').value, box.querySelector('#it-cm-r').value); };
      box.querySelector('#it-cm-q').addEventListener('input', go); box.querySelector('#it-cm-r').addEventListener('change', function (e) { e.stopPropagation(); go(); }); go();
    });
  }
  var YK = { hcat: 'hper', ftype: 'fyear', pcls: 'pyear', ccrop: 'cyear', mprod: 'myear', aser: 'ayear', iser: 'iyear' };
  var VIEWS = { prices: pricesView, slaughter: slaughterView, herds: herdsView, fert: fertView, pest: pestView, crops: cropsView, milk: milkView, agri: agriView, irr: irrView };
  function load(tab) { var f = FILES[tab]; if (tab === 'crops' && ST.ck === 'province') f = 'crops-prov'; if (!D[f]) D[f] = U.json('data/italy-istat/' + f + '.json'); return D[f]; }

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
        var bt = el.querySelector('.it-cm-btn'); if (bt) bt.addEventListener('click', function () { cmOpen(el, lg); });
        return true;
      });
    }
    if (!el.getAttribute('data-it')) {
      el.setAttribute('data-it', '1');
      el.addEventListener('click', function (ev) { var b = ev.target.closest ? ev.target.closest('.it-tab') : null; if (b) { ST.tab = b.getAttribute('data-tab'); draw('.it-tab[data-tab="' + ST.tab + '"]'); } });
      el.addEventListener('change', function (ev) {
        var id = ev.target.id || '', v = ev.target.value, m;
        if (id === 'it-side') { ST.side = v; ST.prod = null; } else if (id === 'it-prod') ST.prod = v; else if (id === 'it-cat') ST.cat = v; else if (id === 'it-metric') ST.metric = v; else if (id === 'it-kind') { ST.pkind = v; ST.pcls = null; } else if (id === 'it-cm') { ST.cmet = v; ST.ccrop = null; } else if (id === 'it-ck') { ST.ck = v; ST.cyear = null; } else if (id === 'it-cr') ST.creg = v; else if (id === 'it-iv') { ST.iview = v; ST.iser = null; } else if (id === 'it-ik') ST.ik = v; else if (id === 'it-cm-r') return;
        else if ((m = /^it-([gy])-(\w+)$/.exec(id))) { var key = m[2], yk = YK[key]; if (m[1] === 'g') ST[key] = v; else ST[yk] = v; }
        draw('#' + id);
      });
    }
    return Promise.all([global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function () { return draw(); });
  }
  global.DIItIstat = { mount: mount };
})(window);
