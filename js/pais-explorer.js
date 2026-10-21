/* Dehesa Index — Explorador de datos de la ficha de país (js/paises.js lo usa para todos los países).
   Idea: empezar por la pregunta, no por los filtros. Buscador con sugerencias, «Para empezar», fichas de producto y de tema,
   medidas como pestañas, serie principal por defecto (las variantes quedan como aviso bajo el gráfico), frase en lenguaje claro y comparación.
   Nada se estima: el producto sale de las etiquetas (tags) del catálogo y la medida de la etiqueta, el grupo y la unidad de cada serie. ES5, sin librerías. */
(function () {
  'use strict';
  var S = { allt: false, q: '', pf: null, allp: false, cq: '', act: -1, cact: -1 };
  var CP = {}; /* series de comparación ya descargadas */
  var X = {
    es: { sentQ: 'Elige qué quieres ver', sent1: 'Quiero ver', sent2: 'de', sent3: 'en', rst: 'Restablecer', rstT: 'Quitar filtros y volver al inicio', vsPrev: 'frente al periodo anterior', aLast: 'Último dato', aYoy: 'Frente a {q}', a5: 'Frente a la media de 5 años', aRange: 'Máximo y mínimo del periodo mostrado', aMax: 'Máx.', aMin: 'Mín.', q: 'Busca lo que quieres ver', ph: 'Prueba: trigo producción, precio leche, rendimiento cebada', start: 'Para empezar', prods: 'Productos', themes: 'Temas', moreT: 'Más temas', lessT: 'Menos temas', more: 'Más productos', less: 'Menos productos', ser: 'Serie', noRes: 'Sin resultados: prueba con menos palabras o elige un producto abajo.', moreRes: '{n} resultados más: sigue escribiendo para afinar.',
      adv: 'Vista avanzada: todas las categorías y series', scope: 'Mostrando solo el tema', clear: 'Ver todo', v1: 'Hay {n} variantes de esta serie (por método o fuente).', v2: 'Verlas', cmp: 'Comparar con otra serie de este país', cmpS: 'Otra serie de este país', cmpSph: 'Busca la serie con la que comparar', cmpC: 'El mismo dato en otro país', cmpNone: 'Elegir país…', cmpNo: 'Este país no publica esta serie con el mismo nombre y la misma unidad.', cmpOn: 'Comparando con', cmpRm: 'Quitar comparación', cmpIdx: 'Las unidades son distintas: se comparan en índice (100 = primer periodo común).', cmpLoad: 'Cargando…', last: 'último dato',
      sen: '{n} ({c}): {v} {u} ({p}){d}.', up: ', un {x} % más que {q}', dn: ', un {x} % menos que {q}', eq: ', igual que {q}', ctry: 'País', per: 'Periodo', meas: 'Qué mirar', prodLab: 'Producto o tema',
      M: { price: 'Precio', index: 'Índices', yield: 'Rendimiento', value: 'Valor', area: 'Superficie', production: 'Producción', trade: 'Comercio', stocks: 'Existencias', animals: 'Censo y ganado', income: 'Rentas y costes', other: 'Otros datos' } },
    en: { sentQ: 'Choose what you want to see', sent1: 'Show me', sent2: 'for', sent3: 'in', rst: 'Reset', rstT: 'Clear filters and go back to the start', vsPrev: 'vs previous period', aLast: 'Latest', aYoy: 'Versus {q}', a5: 'Versus the 5-year average', aRange: 'High and low of the period shown', aMax: 'High', aMin: 'Low', q: 'Search what you want to see', ph: 'Try: wheat production, milk price, barley yield', start: 'Get started', prods: 'Products', themes: 'Topics', moreT: 'More topics', lessT: 'Fewer topics', more: 'More products', less: 'Fewer products', ser: 'Series', noRes: 'No results: try fewer words or pick a product below.', moreRes: '{n} more results: keep typing to narrow down.',
      adv: 'Advanced view: all categories and series', scope: 'Showing only the topic', clear: 'Show all', v1: 'This series has {n} variants (by method or source).', v2: 'Show them', cmp: 'Compare with another series from this country', cmpS: 'Another series from this country', cmpSph: 'Search the series to compare with', cmpC: 'The same data in another country', cmpNone: 'Choose a country…', cmpNo: 'This country does not publish this series under the same name and unit.', cmpOn: 'Comparing with', cmpRm: 'Remove comparison', cmpIdx: 'The units differ: shown as an index (100 = first common period).', cmpLoad: 'Loading…', last: 'latest',
      sen: '{n} ({c}): {v} {u} ({p}){d}.', up: ', {x}% higher than {q}', dn: ', {x}% lower than {q}', eq: ', unchanged from {q}', ctry: 'Country', per: 'Period', meas: 'What to look at', prodLab: 'Product or topic',
      M: { price: 'Price', index: 'Indices', yield: 'Yield', value: 'Value', area: 'Area', production: 'Production', trade: 'Trade', stocks: 'Stocks', animals: 'Livestock numbers', income: 'Income and costs', other: 'Other data' } },
    fr: { sentQ: 'Choisissez ce que vous voulez voir', sent1: 'Je veux voir', sent2: 'de', sent3: 'pour', rst: 'Réinitialiser', rstT: 'Effacer les filtres et revenir au départ', vsPrev: 'par rapport à la période précédente', aLast: 'Dernière donnée', aYoy: 'Par rapport à {q}', a5: 'Par rapport à la moyenne sur 5 ans', aRange: 'Maximum et minimum de la période affichée', aMax: 'Max.', aMin: 'Min.', q: 'Cherchez ce que vous voulez voir', ph: 'Essayez : blé production, prix lait, rendement orge', start: 'Pour commencer', prods: 'Produits', themes: 'Thèmes', moreT: 'Plus de thèmes', lessT: 'Moins de thèmes', more: 'Plus de produits', less: 'Moins de produits', ser: 'Série', noRes: 'Aucun résultat : essayez moins de mots ou choisissez un produit ci-dessous.', moreRes: '{n} résultats de plus : continuez à taper pour affiner.',
      adv: 'Vue avancée : toutes les catégories et séries', scope: 'Affichage limité au thème', clear: 'Tout afficher', v1: 'Cette série a {n} variantes (par méthode ou source).', v2: 'Les voir', cmp: 'Comparer avec une autre série de ce pays', cmpS: 'Une autre série de ce pays', cmpSph: 'Cherchez la série à comparer', cmpC: 'La même donnée dans un autre pays', cmpNone: 'Choisir un pays…', cmpNo: 'Ce pays ne publie pas cette série avec le même nom et la même unité.', cmpOn: 'Comparaison avec', cmpRm: 'Retirer la comparaison', cmpIdx: 'Les unités diffèrent : comparaison en indice (100 = première période commune).', cmpLoad: 'Chargement…', last: 'dernière donnée',
      sen: '{n} ({c}) : {v} {u} ({p}){d}.', up: ', en hausse de {x} % par rapport à {q}', dn: ', en baisse de {x} % par rapport à {q}', eq: ', stable par rapport à {q}', ctry: 'Pays', per: 'Période', meas: 'Que regarder', prodLab: 'Produit ou thème',
      M: { price: 'Prix', index: 'Indices', yield: 'Rendement', value: 'Valeur', area: 'Surface', production: 'Production', trade: 'Commerce', stocks: 'Stocks', animals: 'Cheptel', income: 'Revenus et coûts', other: 'Autres données' } },
    it: { sentQ: 'Scegli cosa vuoi vedere', sent1: 'Voglio vedere', sent2: 'di', sent3: 'per', rst: 'Reimposta', rstT: 'Rimuovi i filtri e torna all’inizio', vsPrev: 'rispetto al periodo precedente', aLast: 'Ultimo dato', aYoy: 'Rispetto a {q}', a5: 'Rispetto alla media di 5 anni', aRange: 'Massimo e minimo del periodo mostrato', aMax: 'Max.', aMin: 'Min.', q: 'Cerca ciò che vuoi vedere', ph: 'Prova: frumento produzione, prezzo latte, resa orzo', start: 'Per iniziare', prods: 'Prodotti', themes: 'Temi', moreT: 'Più temi', lessT: 'Meno temi', more: 'Più prodotti', less: 'Meno prodotti', ser: 'Serie', noRes: 'Nessun risultato: prova con meno parole o scegli un prodotto qui sotto.', moreRes: '{n} risultati in più: continua a scrivere per restringere.',
      adv: 'Vista avanzata: tutte le categorie e serie', scope: 'Mostro solo il tema', clear: 'Mostra tutto', v1: 'Questa serie ha {n} varianti (per metodo o fonte).', v2: 'Mostrale', cmp: 'Confronta con un’altra serie di questo paese', cmpS: 'Un’altra serie di questo paese', cmpSph: 'Cerca la serie da confrontare', cmpC: 'Lo stesso dato in un altro paese', cmpNone: 'Scegli un paese…', cmpNo: 'Questo paese non pubblica questa serie con lo stesso nome e la stessa unità.', cmpOn: 'Confronto con', cmpRm: 'Rimuovi il confronto', cmpIdx: 'Le unità sono diverse: confronto in indice (100 = primo periodo comune).', cmpLoad: 'Caricamento…', last: 'ultimo dato',
      sen: '{n} ({c}): {v} {u} ({p}){d}.', up: ', {x} % in più rispetto a {q}', dn: ', {x} % in meno rispetto a {q}', eq: ', invariato rispetto a {q}', ctry: 'Paese', per: 'Periodo', meas: 'Cosa guardare', prodLab: 'Prodotto o tema',
      M: { price: 'Prezzo', index: 'Indici', yield: 'Resa', value: 'Valore', area: 'Superficie', production: 'Produzione', trade: 'Commercio', stocks: 'Scorte', animals: 'Consistenza', income: 'Redditi e costi', other: 'Altri dati' } }
  };
  var PN = { cattle: ['Vacuno', 'Cattle', 'Bovins', 'Bovini', '🐄'], sheep: ['Ovino', 'Sheep', 'Ovins', 'Ovini', '🐑'], fruit: ['Fruta', 'Fruit', 'Fruits', 'Frutta', '🍎'], milk: ['Leche', 'Milk', 'Lait', 'Latte', '🥛'], poultry: ['Aves', 'Poultry', 'Volaille', 'Pollame', '🐔'], pigs: ['Porcino', 'Pigs', 'Porcins', 'Suini', '🐖'],
    wheat: ['Trigo', 'Wheat', 'Blé', 'Frumento', '🌾'], barley: ['Cebada', 'Barley', 'Orge', 'Orzo', '🌾'], fertilizer: ['Fertilizantes', 'Fertiliser', 'Engrais', 'Fertilizzanti', '🧪'], rapeseed: ['Colza', 'Rapeseed', 'Colza', 'Colza', '🌼'], wine: ['Vino', 'Wine', 'Vin', 'Vino', '🍷'], olive: ['Olivar', 'Olives', 'Olives', 'Olive', '🫒'],
    eggs: ['Huevos', 'Eggs', 'Œufs', 'Uova', '🥚'], oats: ['Avena', 'Oats', 'Avoine', 'Avena', '🌾'], maize: ['Maíz', 'Maize', 'Maïs', 'Mais', '🌽'], potato: ['Patata', 'Potatoes', 'Pommes de terre', 'Patate', '🥔'], sugar: ['Azúcar', 'Sugar', 'Sucre', 'Zucchero', '🍬'], rye: ['Centeno', 'Rye', 'Seigle', 'Segale', '🌾'],
    rice: ['Arroz', 'Rice', 'Riz', 'Riso', '🍚'], energy: ['Energía', 'Energy', 'Énergie', 'Energia', '⛽'], soy: ['Soja', 'Soy', 'Soja', 'Soia', '🫘'], cheese: ['Queso', 'Cheese', 'Fromage', 'Formaggio', '🧀'], butter: ['Mantequilla', 'Butter', 'Beurre', 'Burro', '🧈'], tomato: ['Tomate', 'Tomato', 'Tomate', 'Pomodoro', '🍅'] };
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var MPRI = ['price', 'production', 'area', 'yield', 'value', 'index', 'trade', 'stocks', 'animals', 'income', 'other'];
  var PRICEG = /^(prices|prices_lv|prices_fv|prices_paid|quotes|inputs|inputs_f|inputs_a|milk_regions|meat_regions)$/;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $(id) { return document.getElementById(id); }
  function lg(cx) { return X[cx.lang] ? cx.lang : 'es'; }
  function pname(tag, cx) { var p = PN[tag]; return p ? p[LI[lg(cx)]] : tag; }
  /* Medida de una serie: por grupo, etiqueta original (en inglés o español) y unidad */
  function meas(x) {
    var l = String(x.label || '').toLowerCase(), g = x.group, u = String(x.unit || '').toLowerCase();
    if (g === 'trade' || g === 'partners' || /\b(exports?|imports?|trade balance)\b/.test(l)) return 'trade';
    if (g === 'stocks') return 'stocks';
    if (g === 'idx_perc' || g === 'idx_pag' || /\bindex\b|\bindices\b|índice|indice/.test(l) || /index/.test(u)) return 'index';
    if (/yield|rendimiento|rendement|\bresa\b/.test(l)) return 'yield';
    if (/million|billion|\bmio\b|\bmrd\b/.test(u) && !/\/(t|kg|100|ha|head|l)\b/.test(u)) return 'value'; /* valor total (millones de EUR), no precio unitario */
    if (PRICEG.test(g) || /price|prix|prezzo|precio|cash bid|quotation|cotiz|rent\b/.test(l)) return 'price';
    if (g === 'income' || g === 'costs') return 'income';
    if (/\barea\b|surface|superficie|hectare|utilised agricultural|land use|cultivated|acreage|planted/.test(l) || u === 'ha') return 'area';
    if (g === 'livestock' || /livestock|holdings|animals|\bhead\b|census|herd|heifer|calves|sows|cows/.test(l)) return 'animals';
    if (/production|harvest|output|slaughter|deliver|volume|sacrific|crop/.test(l) || g === 'production') return 'production';
    return 'other';
  }
  function model(cx) {
    var list = cx.list; if (list._ex) return list._ex;
    var items = list.map(function (x) { return { x: x, m: meas(x), t: (x.tags || []).filter(function (k) { return PN[k] && !(/^(inputs|inputs_a|inputs_f|prices_paid)$/.test(x.group) && k !== 'fertilizer' && k !== 'energy'); }) }; }), P = {}, G = {}, by = {};
    items.forEach(function (it) { by[it.x.id] = it; it.t.forEach(function (k) { (P[k] = P[k] || []).push(it); }); (G[it.x.group] = G[it.x.group] || []).push(it); });
    return (list._ex = { items: items, P: P, G: G, by: by });
  }
  var PPRI = ['wheat', 'milk', 'cattle', 'maize', 'pigs', 'barley', 'olive', 'wine', 'sheep', 'poultry', 'eggs', 'rapeseed', 'potato', 'sugar', 'fruit', 'tomato', 'rice', 'oats', 'rye', 'soy', 'cheese', 'butter', 'fertilizer', 'energy'];
  function pkeys(md) { return Object.keys(md.P).sort(function (a, b) { var ia = PPRI.indexOf(a), ib = PPRI.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); }); }
  function ficha(md, key) { return key.charAt(0) === 'p' ? md.P[key.slice(2)] || [] : md.G[key.slice(2)] || []; }
  function fichaOf(md, it) { if (S.pf && ficha(md, S.pf).indexOf(it) >= 0) return S.pf; return it.t.length ? 'p:' + it.t[0] : 'g:' + it.x.group; }
  function bestOf(cx, xs, sel) { /* una por grupo de variantes; la más reciente y con más datos */
    if (!xs.length) return null; var cl = cx.collapse(xs, cx.list, sel);
    cl.sort(function (a, b) { return String(b.latestPeriod || '').slice(0, 4).localeCompare(String(a.latestPeriod || '').slice(0, 4)) || (b.n || 0) - (a.n || 0); });
    return cl[0].id;
  }
  function bestInFicha(cx, md, key, sel) {
    var its = ficha(md, key), have = {}; its.forEach(function (it) { have[it.m] = 1; });
    var mk = MPRI.filter(function (m) { return have[m]; })[0]; if (!mk) return null;
    return bestOf(cx, its.filter(function (it) { return it.m === mk; }).map(function (it) { return it.x; }), sel);
  }
  function highlights(cx, md) {
    var keys = pkeys(md).slice(0, 6), out = [];
    keys.forEach(function (k) { var id = bestInFicha(cx, md, 'p:' + k, null); if (id) out.push({ id: id, k: k, m: md.by[id].m }); });
    if (out.length < 6) Object.keys(md.G).sort(function (a, b) { return md.G[b].length - md.G[a].length; }).forEach(function (g) {
      if (out.length >= 6 || !cx.t[g]) return; var id = bestInFicha(cx, md, 'g:' + g, null); if (id && !out.some(function (o) { return o.id === id; })) out.push({ id: id, g: g, m: md.by[id].m });
    });
    return out;
  }
  function hlLabel(cx, h) { var w = X[lg(cx)]; return h.k ? pname(h.k, cx) + ' · ' + w.M[h.m].toLowerCase() : (cx.t[h.g] || h.g); }
  /* serie que se muestra al abrir la ficha, si nadie ha elegido otra */
  function first(cx) { var md = model(cx), h = highlights(cx, md); return h.length ? h[0].id : null; }

  function chip(cls, attrs, inner, on) { return '<button type="button" class="' + cls + '"' + attrs + ' aria-pressed="' + (on ? 'true' : 'false') + '">' + inner + '</button>'; }
  function trimPrefix(labs) { /* si todas empiezan por lo mismo («Trigo: ») se quita */
    var pre, ok = labs.length > 1; labs.forEach(function (l, k) { var i = l.indexOf(': '), p = i > 2 && i < 70 ? l.slice(0, i + 2) : null; if (k === 0) pre = p; else if (pre !== p) ok = false; }); /* sin prefijo en una sola etiqueta = no se recorta ninguna */
    return ok && pre && labs.every(function (l) { return l.length > pre.length; }) ? labs.map(function (l) { return l.slice(pre.length); }) : labs;
  }
  function html(cx) {
    var w = X[lg(cx)], md = model(cx), cur = cx.cur0, it = cur ? md.by[cur.id] : null, fk = it ? fichaOf(md, it) : null, h = '';
    h += '<div class="ex" id="ex-top">';
    var hl = highlights(cx, md);
    // «Para empezar» retirado: duplicaba Productos + Qué mirar
    if (cx.g !== 'all' && cx.t[cx.g]) h += '<div class="ex-row"><span class="ex-lab">' + esc(w.scope) + ' <b>' + esc(cx.t[cx.g]) + '</b></span>' + chip('ex-chip', ' data-ex="g0"', esc(w.clear), false) + '</div>';
    var dirty = S.pf || S.allp || S.allt || cx.g !== 'all' || cx.cmp || cx.r !== 'max' || cx.fx || cx.real || (cur && cx.firstId && cur.id !== cx.firstId());
    if (dirty) h += '<div class="ex-rsrow"><button type="button" class="ex-chip ex-chip-s ex-rst" data-ex="rst" title="' + esc(w.rstT) + '">↺ ' + esc(w.rst) + '</button></div>';
    var pk = pkeys(md);
    if (pk.length) {
      var lim = 10, sh = S.allp || pk.length <= lim + 2 ? pk : pk.slice(0, lim); if (fk && fk.charAt(0) === 'p' && sh.indexOf(fk.slice(2)) < 0) sh = sh.concat([fk.slice(2)]);
      h += '<div class="ex-row" role="group" aria-label="' + esc(w.prods) + '"><span class="ex-lab">' + esc(w.prods) + '</span>' + sh.map(function (k) { return chip('ex-chip', ' data-ex="f" data-v="p:' + k + '"', PN[k][4] + ' ' + esc(pname(k, cx)), fk === 'p:' + k); }).join('') +
        (pk.length > lim + 2 ? '<button type="button" class="ex-chip ex-more" data-ex="allp">' + esc(S.allp ? w.less : w.more + ' (' + pk.length + ')') + '</button>' : '') + '</div>';
    }
    h += '<div class="ex-q"><label for="ex-q" class="ex-ql">' + esc(w.q) + '</label>' +
      '<input id="ex-q" type="search" class="um-input" role="combobox" aria-expanded="false" aria-controls="ex-res" aria-autocomplete="list" autocomplete="off" placeholder="' + esc(w.ph) + '" value="">' +
      '<div id="ex-res" class="ex-res" role="listbox" aria-label="' + esc(w.q) + '" hidden></div></div>';
    var gk = Object.keys(md.G).filter(function (g) { return cx.t[g]; }).sort(function (a, b) { return md.G[b].length - md.G[a].length; });
    if (gk.length > 1) {
      var gl = 6, gs = S.allt || gk.length <= gl + 1 ? gk : gk.slice(0, gl); if (fk && fk.charAt(0) === 'g' && gs.indexOf(fk.slice(2)) < 0) gs = gs.concat([fk.slice(2)]);
      h += '<div class="ex-row" role="group" aria-label="' + esc(w.themes) + '"><span class="ex-lab">' + esc(w.themes) + '</span>' + gs.map(function (g) { return chip('ex-chip ex-th', ' data-ex="f" data-v="g:' + g + '"', esc(cx.t[g]), fk === 'g:' + g); }).join('') +
        (gk.length > gl + 1 ? '<button type="button" class="ex-chip ex-more" data-ex="allt">' + esc(S.allt ? w.lessT : w.moreT + ' (' + gk.length + ')') + '</button>' : '') + '</div>';
    }
    if (fk && it) {
      var its = ficha(md, fk), have = {}; its.forEach(function (x) { have[x.m] = (have[x.m] || 0) + 1; });
      var ms = MPRI.filter(function (m) { return have[m]; });
      var sx = its.filter(function (x) { return x.m === it.m; }).map(function (x) { return x.x; }), cl = cx.collapse(sx, cx.list, cur.id), labs = [];
      cl.sort(function (a, b) { return String(b.latestPeriod || '').slice(0, 4).localeCompare(String(a.latestPeriod || '').slice(0, 4)) || (b.n || 0) - (a.n || 0); });
      labs = trimPrefix(cl.map(function (c) { return String(c._lab || cx.shortLab(c)).replace(/:\s*\(/, ' ('); }));
      /* Frase: «Quiero ver [medida] de [serie] en [país]». El país es texto fijo: la ficha ya es de un solo país. */
      h += '<div class="ex-sent" role="group" aria-label="' + esc(w.sentQ) + '"><span>' + esc(w.sent1) + '</span>' +
        (ms.length > 1 ? '<select id="ex-sm" class="di-compare-select ex-sel" data-ex="msel" aria-label="' + esc(w.meas) + '">' + ms.map(function (m) { return '<option value="' + m + '"' + (it.m === m ? ' selected' : '') + '>' + esc(w.M[m].toLowerCase()) + '</option>'; }).join('') + '</select>' : '<b>' + esc(w.M[it.m].toLowerCase()) + '</b>') +
        '<span>' + esc(w.sent2) + '</span>' +
        (cl.length > 1 ? '<select id="ex-sel" class="di-compare-select ex-sel" data-ex="ssel" aria-label="' + esc(w.ser) + '">' + cl.map(function (c, i) { return '<option value="' + esc(c.id) + '" title="' + esc(cx.TL(c.label)) + '"' + (c.id === cur.id ? ' selected' : '') + '>' + esc(labs[i]) + '</option>'; }).join('') + '</select>' : '<b>' + esc(labs[0] || '') + '</b>') +
        '<span>' + esc(w.sent3) + '</span><b>' + esc(cx.country) + '</b></div>';
    }
    h += '<details class="ex-adv"><summary>' + esc(w.adv) + '</summary><div class="ex-advb"><label style="font-size:13px">' + esc(cx.groupLabel) + '<br><select id="ps-g" class="di-compare-select">' + cx.groupOpts + '</select></label>' + cx.oldPicker + '</div></details></div>';
    return h;
  }
  /* Frase en lenguaje claro */
  function sentence(cx, s, s0) {
    var w = X[lg(cx)], p = s.points; if (!p || !p.length) return '';
    var last = p[p.length - 1], per = last[0], prev = null, m = /^(\d{4})-(\d{2})$/.exec(per), i;
    if (m) { var py = (+m[1] - 1) + '-' + m[2]; for (i = p.length - 2; i >= 0; i--) if (p[i][0] === py) { prev = p[i]; break; } } else if (p.length > 1) prev = p[p.length - 2];
    var d = '';
    if (prev && prev[1] != null && last[1] != null && prev[1] > 0 && last[1] >= 0) {
      var pc = (last[1] / prev[1] - 1) * 100, q = cx.plabel(prev[0], s.frequency);
      d = Math.abs(pc) < 0.05 ? w.eq.replace('{q}', q) : (pc > 0 ? w.up : w.dn).replace('{x}', cx.nf(Math.abs(pc), Math.abs(pc) < 10 ? 1 : 0)).replace('{q}', q);
    }
    var name = cx.shortLab(s0).replace(/\s*\([^()]*\)\s*$/, '');
    return '<p class="ex-sen">' + esc(w.sen.replace('{n}', name).replace('{c}', cx.country).replace('{v}', cx.nf(last[1], cx.dec(last[1]))).replace('{u}', s.unit).replace('{p}', cx.plabel(per, s.frequency)).replace('{d}', d)) + '</p>';
  }
  /* Ficha de respuesta: lo que se ve de un vistazo, todo calculado de la propia serie (nada estimado) */
  function answer(cx, s, s0) {
    var w = X[lg(cx)], p = s.points; if (!p || !p.length) return ''; var last = p[p.length - 1]; if (last[1] == null) return '';
    var m = /^(\d{4})(.*)$/.exec(String(last[0])), yoy = null, ql = '', i, tiles = '';
    var pct = function (v) { return (v > 0 ? '▲ +' : v < 0 ? '▼ −' : '') + cx.nf(Math.abs(v), Math.abs(v) < 10 ? 1 : 0) + ' %'; };
    var tile = function (lab, big, small) { return '<div class="ex-at"><div class="ex-atl">' + esc(lab) + '</div><div class="ex-atv">' + big + '</div>' + (small ? '<div class="ex-ats">' + small + '</div>' : '') + '</div>'; };
    tiles += tile(cx.shortLab(s0).replace(/\s*\([^()]*\)\s*$/, '') + ' · ' + cx.plabel(last[0], s.frequency), esc(cx.nf(last[1], cx.dec(last[1]))), esc(s.unit || ''));
    if (m) {
      for (i = p.length - 2; i >= 0; i--) if (p[i][0] === (+m[1] - 1) + m[2]) { yoy = p[i]; break; }
      if (yoy && yoy[1] > 0 && last[1] >= 0) tiles += tile(w.aYoy.replace('{q}', cx.plabel(yoy[0], s.frequency)), esc(pct((last[1] / yoy[1] - 1) * 100)), '');
      var vals = [], by = {}; p.forEach(function (q) { by[q[0]] = q[1]; });
      for (i = 1; i <= 5; i++) { var v = by[(+m[1] - i) + m[2]]; if (v != null) vals.push(v); }
      if (vals.length >= 3) { var av = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length; if (av > 0) tiles += tile(w.a5, esc(pct((last[1] / av - 1) * 100)), ''); }
    }
    var vis = cutRange(cx, p.slice()).filter(function (q) { return q[1] != null; });
    if (vis.length > 2) {
      var mx = vis[0], mn = vis[0]; vis.forEach(function (q) { if (q[1] > mx[1]) mx = q; if (q[1] < mn[1]) mn = q; });
      tiles += tile(w.aRange, '', esc(w.aMax) + ' ' + esc(cx.nf(mx[1], cx.dec(mx[1]))) + ' · ' + esc(cx.plabel(mx[0], s.frequency)) + '<br>' + esc(w.aMin) + ' ' + esc(cx.nf(mn[1], cx.dec(mn[1]))) + ' · ' + esc(cx.plabel(mn[0], s.frequency)));
    }
    return '<div class="ex-ans" role="group" aria-label="' + esc(w.aLast) + '">' + tiles + '</div>';
  }
  function variantsWrap(cx, vh) {
    if (!vh) return ''; var n = (vh.match(/data-s=/g) || []).length; if (n < 2) return ''; var w = X[lg(cx)];
    return '<details class="ex-var"><summary>' + esc(w.v1.replace('{n}', n)) + ' <b>' + esc(w.v2) + '</b></summary>' + vh + '</details>';
  }
  /* Comparación */
  function cmpKey(c) { return c.cc + '/' + c.id; }
  function cmpPanel(cx) {
    var w = X[lg(cx)], h = '<details class="ex-cmp" id="ex-cmp"' + (cx.cmp ? ' open' : '') + '><summary>' + esc(w.cmp) + '</summary>';
    if (cx.cmp) {
      var cs = CP[cmpKey(cx.cmp)];
      h += '<p class="ex-cmpon">' + esc(w.cmpOn) + ': <b>' + esc(cs ? cx.TL(cs.label) + ' (' + (cx.countries[cx.cmp.cc] || cx.cmp.cc) + ')' : cx.cmp.id) + '</b> <button type="button" class="ex-chip ex-chip-s" data-ex="cmprm">' + esc(w.cmpRm) + '</button></p>';
      if (cs && cx.cur && cs.unit !== cx.cur.unit) h += '<p class="di-movers-hint">' + esc(w.cmpIdx) + '</p>';
    }
    h += '<div class="ex-cmpb"><div><label for="ex-cq" class="ex-ql">' + esc(w.cmpS) + '</label><input id="ex-cq" type="search" class="um-input" autocomplete="off" placeholder="' + esc(w.cmpSph) + '"><div id="ex-cres" class="ex-res" role="listbox" aria-label="' + esc(w.cmpS) + '" hidden></div></div>' +
      '</div></details>';
    return h;
  }
  function cutRange(cx, pts) { return cx.cut(pts); }
  function cmpChart(cx, s) {
    if (!cx.cmp) return ''; var o = CP[cmpKey(cx.cmp)]; if (!o || !o.points || !o.points.length || !s.points) return '';
    var w = X[lg(cx)], same = o.unit === s.unit, A = cutRange(cx, s.points.slice()).map(function (p) { return { x: cx.ts(p[0]), y: p[1], l: cx.plabel(p[0], s.frequency) }; }), B = cutRange(cx, o.points.slice()).map(function (p) { return { x: cx.ts(p[0]), y: p[1], l: cx.plabel(p[0], o.frequency) }; });
    if (!A.length || !B.length) return '';
    if (!same) { /* unidades distintas: índice 100 en el primer periodo en que existen las dos */
      var st = Math.max(A[0].x, B[0].x), rb = function (a) { var b0 = null, i; for (i = 0; i < a.length; i++) if (a[i].x >= st && a[i].y) { b0 = a[i].y; break; } return b0 ? a.filter(function (p) { return p.x >= st; }).map(function (p) { return { x: p.x, y: p.y == null ? null : p.y / b0 * 100, l: p.l }; }) : []; };
      A = rb(A); B = rb(B); if (!A.length || !B.length) return '';
    }
    var nm = function (z, c0) { return cx.TL(z.label) + (c0 && c0 !== cx.cc ? ' (' + (cx.countries[c0] || c0) + ')' : ''); };
    return window.DehesaChart.render({ series: [{ name: nm(s, cx.cc), color: '#2f6b4a', pts: A }, { name: nm(o, cx.cmp.cc), color: '#b5651d', pts: B }], xMode: 'time', xTitle: cx.t.date, yTitle: same ? s.unit : 'Index (100)', aria: nm(s, cx.cc) + ' / ' + nm(o, cx.cmp.cc), vFmt: function (v) { return cx.nf(v, same ? cx.dec(v) : 1); } });
  }
  function norm(x) { var r = String(x || '').toLowerCase(); try { r = r.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {} return r; }
  function results(cx, q, all, cur) {
    var w = X[lg(cx)], sh = cx.filterSeries(all, q), tk = norm(q).split(/\s+/).filter(Boolean);
    sh = sh.map(function (x, i) { var l = norm(cx.shortLab(x)); return { x: x, i: i, s: (l.indexOf(tk[0]) === 0 ? 0 : 1) }; }).sort(function (a, b) { return a.s - b.s || (b.x.n || 0) - (a.x.n || 0) || a.i - b.i; }).map(function (r) { return r.x; });
    var cl = cx.collapse(sh, all, cur), tot = cl.length; return { list: cl.slice(0, 8), tot: tot, w: w };
  }
  function resHtml(cx, r, pre) {
    if (!r.list.length) return '<div class="ex-nores">' + esc(r.w.noRes) + '</div>';
    return r.list.map(function (c, i) { return '<button type="button" role="option" aria-selected="false" class="ex-opt" id="' + pre + i + '" data-id="' + esc(c.id) + '"><span class="ex-ol">' + esc(c._lab || cx.shortLab(c)) + '</span><span class="ex-om">' + esc(r.w.M[meas(c)]) + ' · ' + esc(cx.plabel(c.latestPeriod, c.frequency)) + (c.latest != null ? ' · <b>' + esc(cx.nf(c.latest, cx.dec(c.latest))) + ' ' + esc(c.unit || '') + '</b>' : '') + (c.changePct != null ? ' · <span title="' + esc(r.w.vsPrev) + '">' + (c.changePct > 0 ? '▲ +' : c.changePct < 0 ? '▼ −' : '') + esc(cx.nf(Math.abs(c.changePct), 1)) + ' %</span>' : '') + '</span></button>'; }).join('') + (r.tot > r.list.length ? '<div class="ex-nores">' + esc(r.w.moreRes.replace('{n}', r.tot - r.list.length)) + '</div>' : '');
  }
  /* api: { act(fn) repinta manteniendo el sitio, build(), pick(id), setCmp(obj|null), loadCountry(cc), pts(cc,id) } */
  function bind(root, cx, api) {
    var w = X[lg(cx)], md = model(cx), inp = $('ex-q'), box = $('ex-res');
    if (inp && box) {
      var go = function (id) { api.act(function () { S.pf = null; cx.setS(id); }); };
      var act = -1, draw = function () { var q = inp.value.trim(); act = -1; if (!q) { box.hidden = true; box.innerHTML = ''; inp.setAttribute('aria-expanded', 'false'); return; } box.innerHTML = resHtml(cx, results(cx, q, cx.list, cx.cur0 && cx.cur0.id), 'ex-o'); box.hidden = false; inp.setAttribute('aria-expanded', 'true'); };
      var setAct = function (i) { var o = box.querySelectorAll('.ex-opt'); if (!o.length) return; act = (i + o.length) % o.length; Array.prototype.forEach.call(o, function (e, k) { e.classList.toggle('ex-act', k === act); e.setAttribute('aria-selected', k === act ? 'true' : 'false'); }); inp.setAttribute('aria-activedescendant', o[act].id); };
      inp.addEventListener('input', draw);
      inp.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); setAct(act + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(act < 0 ? -1 : act - 1); } else if (e.key === 'Enter') { e.preventDefault(); var o = box.querySelectorAll('.ex-opt'); if (o.length) go(o[act >= 0 ? act : 0].getAttribute('data-id')); } else if (e.key === 'Escape') { inp.value = ''; draw(); } });
      box.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('.ex-opt') : null; if (b) go(b.getAttribute('data-id')); });
    }
    var top = $('ex-top');
    if (top) top.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-ex]') : null; if (!b || b.tagName !== 'BUTTON') return; var a = b.getAttribute('data-ex'), v = b.getAttribute('data-v');
      if (a === 'rst') { api.act(function () { S.pf = null; S.allp = false; S.allt = false; cx.resetAll(); }); return; }
      if (a === 'allp') { S.allp = !S.allp; api.act(function () {}); return; }
      if (a === 'allt') { S.allt = !S.allt; api.act(function () {}); return; }
      if (a === 'h') { api.act(function () { S.pf = null; cx.setS(v); }); return; }
      if (a === 'g0') { api.act(function () { cx.setG('all'); }); return; }
      if (a === 'f') { var id = bestInFicha(cx, md, v, cx.cur0 && cx.cur0.id); if (id) api.act(function () { S.pf = v; cx.setS(id); }); return; }
      if (a === 'm') { var it = cx.cur0 && md.by[cx.cur0.id]; if (!it) return; var fk = fichaOf(md, it), id2 = bestOf(cx, ficha(md, fk).filter(function (z) { return z.m === v; }).map(function (z) { return z.x; }), cx.cur0.id); if (id2) api.act(function () { S.pf = fk; cx.setS(id2); }); return; }
      if (a === 's') { var it2 = md.by[v], fk2 = it2 && cx.cur0 && md.by[cx.cur0.id] ? fichaOf(md, md.by[cx.cur0.id]) : null; api.act(function () { S.pf = fk2; cx.setS(v); }); }
    });
    var msl = $('ex-sm'); if (msl) msl.addEventListener('change', function () { var it = cx.cur0 && md.by[cx.cur0.id]; if (!it) return; var fk = fichaOf(md, it), id2 = bestOf(cx, ficha(md, fk).filter(function (z) { return z.m === msl.value; }).map(function (z) { return z.x; }), cx.cur0.id); if (id2) api.act(function () { S.pf = fk; cx.setS(id2); }); });
    var sel = $('ex-sel'); if (sel) sel.addEventListener('change', function () { var it = cx.cur0 && md.by[cx.cur0.id], fk = it ? fichaOf(md, it) : null, v = sel.value; api.act(function () { S.pf = fk; cx.setS(v); }); });
    /* comparar */
    var cq = $('ex-cq'), cr = $('ex-cres');
    if (cq && cr) {
      var cact = -1, cdraw = function () { var q = cq.value.trim(); cact = -1; if (!q) { cr.hidden = true; cr.innerHTML = ''; return; } cr.innerHTML = resHtml(cx, results(cx, q, cx.allSeries, cx.cur0 && cx.cur0.id), 'ex-c'); cr.hidden = false; };
      var csetAct = function (i) { var o = cr.querySelectorAll('.ex-opt'); if (!o.length) return; cact = (i + o.length) % o.length; Array.prototype.forEach.call(o, function (e, k) { e.classList.toggle('ex-act', k === cact); }); };
      var cgo = function (id) { api.setCmp({ cc: cx.cc, id: id }); };
      cq.addEventListener('input', cdraw);
      cq.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); csetAct(cact + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); csetAct(cact < 0 ? -1 : cact - 1); } else if (e.key === 'Enter') { e.preventDefault(); var o = cr.querySelectorAll('.ex-opt'); if (o.length) cgo(o[cact >= 0 ? cact : 0].getAttribute('data-id')); } });
      cr.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('.ex-opt') : null; if (b) cgo(b.getAttribute('data-id')); });
    }
    var cmp = $('ex-cmp'); if (cmp) cmp.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('[data-ex="cmprm"]') : null; if (b) api.setCmp(null); });
  }
  function loadCmp(cc, id, pts) { var k = cc + '/' + id; if (CP[k] && CP[k].points) return Promise.resolve(CP[k]); return pts(cc, id).then(function (s) { CP[k] = s; return s; }); }
  function setCmpSeries(cc, id, s) { CP[cc + '/' + id] = s; }
  window.DIExplorer = { perLabel: function (cx) { return X[lg(cx)].per; }, html: html, bind: bind, first: first, sentence: sentence, answer: answer, variantsWrap: variantsWrap, cmpPanel: cmpPanel, cmpChart: cmpChart, loadCmp: loadCmp, setCmpSeries: setCmpSeries, meas: meas, reset: function () { S.pf = null; S.allp = false; S.allt = false; } };
})();
