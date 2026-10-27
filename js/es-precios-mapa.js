/* Dehesa Index — Precios semanales de España (MAPA). ES5.
   data/spain-prices/pmn.json  (Precios Medios Nacionales, desde 2019)  y  data/spain-prices/obs.json (Observatorio de precios: origen y mayorista MERCASA, desde 2004).
   scripts/update-es-pmn.py. Cada precio es el que publica el ministerio; Dehesa Index solo calcula los cambios entre dos fechas y la diferencia destino-origen (rotuladas como cálculo propio). */
(function (global) {
  'use strict';
  var S = global.DehesaShared, LI = { es: 0, en: 1, fr: 2, it: 3 };
  var PM = null, OB = null, AN = null, TAB = 'pmn', SEL = {}, RNG = { pmn: 156, obs: 156, and: 156 }, Q = '', SECKS = { pmn: 'CEREALES', and: 'Hortícolas protegidos' }, STALE = 8;
  var T = {
    es: { swipe: 'Desliza para ver los {n} sectores →', price: 'Precio', search: 'Buscar producto (trigo, aguacate, cordero…)', sect: 'Sector', vs: 'vs. semana anterior', old: 'Sin dato reciente', oldNote: 'Fuera de temporada o que el ministerio dejó de publicar. Se muestra el último dato que hay.', lastd: 'Último dato', none: 'Ningún producto coincide con «{q}».', hint: 'Toca un producto para ver su gráfica y su histórico.', allsec: 'Resultados en todos los sectores', csv: 'Descargar CSV', col1: 'Origen', col2: 'Destino', n: '{n} productos', h: 'Precios semanales en España', sub: 'Precios medios nacionales y precios en origen y en destino que publica el Ministerio de Agricultura, semana a semana.', pmn: 'Precios medios nacionales', obs: 'Origen y destino', prod: 'Producto', rng: 'Periodo', r1: '1 año', r3: '3 años', rall: 'Todo', last: 'Última semana', wk: 'semana del {d}', c4: 'Cambio en 4 semanas', c52: 'Cambio en 1 año', calc: 'cálculo de Dehesa Index', tab: 'Últimas semanas', date: 'Semana', pos: 'Posición comercial', legend: 'Texto del ministerio sobre la posición comercial de cada precio',
      org: 'En origen (productor)', dst: 'Mayorista en destino (Mercas)', gap: 'Destino − origen', ratio: 'Veces el origen', gapNote: 'Última semana con los dos precios. Es un cálculo de Dehesa Index con precios de dos fuentes del ministerio; no es el margen de nadie.', nodata: 'Sin datos en este periodo', onlyOrg: 'Sin precio mayorista para este producto.',
      note: 'Un hueco significa que el ministerio no publicó precio esa semana. Precios sin IVA, en la posición comercial indicada. Los nombres de producto y sus especificaciones cambian a veces entre años; se unen por nombre.', src: 'Fuente:', open: 'Ver la fuente original', alt: '{n}, precio semanal', all: 'Todos' },
    en: { swipe: 'Swipe to see all {n} sectors →', price: 'Price', search: 'Search a product (wheat, avocado, lamb…)', sect: 'Sector', vs: 'vs. previous week', old: 'No recent data', oldNote: 'Out of season, or no longer published by the ministry. The latest available figure is shown.', lastd: 'Latest data', none: 'No product matches “{q}”.', hint: 'Tap a product to see its chart and history.', allsec: 'Results across all sectors', csv: 'Download CSV', col1: 'Farm-gate', col2: 'Wholesale', n: '{n} products', h: 'Weekly prices in Spain', sub: 'National average prices and farm-gate and wholesale prices published weekly by the Ministry of Agriculture.', pmn: 'National average prices', obs: 'Farm vs wholesale', prod: 'Product', rng: 'Period', r1: '1 year', r3: '3 years', rall: 'All', last: 'Latest week', wk: 'week of {d}', c4: '4-week change', c52: '1-year change', calc: 'Dehesa Index calculation', tab: 'Latest weeks', date: 'Week', pos: 'Trade position', legend: 'Ministry text on the trade position of each price',
      org: 'Farm-gate (producer)', dst: 'Wholesale at destination (Mercas)', gap: 'Wholesale − farm-gate', ratio: 'Times farm-gate', gapNote: 'Latest week with both prices. A Dehesa Index calculation from two ministry sources; it is nobody’s margin.', nodata: 'No data in this period', onlyOrg: 'No wholesale price for this product.',
      note: 'A gap means the ministry published no price that week. Prices exclude VAT, at the trade position shown. Product names and specifications sometimes change between years; they are joined by name.', src: 'Source:', open: 'See the original source', alt: '{n}, weekly price', all: 'All' },
    fr: { swipe: 'Faites défiler pour voir les {n} secteurs →', price: 'Prix', search: 'Chercher un produit (blé, avocat, agneau…)', sect: 'Secteur', vs: 'vs semaine précédente', old: 'Sans donnée récente', oldNote: 'Hors saison ou plus publié par le ministère. La dernière donnée disponible est affichée.', lastd: 'Dernière donnée', none: 'Aucun produit ne correspond à « {q} ».', hint: 'Touchez un produit pour voir son graphique et son historique.', allsec: 'Résultats dans tous les secteurs', csv: 'Télécharger le CSV', col1: 'Production', col2: 'Gros', n: '{n} produits', h: 'Prix hebdomadaires en Espagne', sub: 'Prix moyens nationaux et prix à la production et en gros que publie chaque semaine le ministère de l’Agriculture.', pmn: 'Prix moyens nationaux', obs: 'Production et gros', prod: 'Produit', rng: 'Période', r1: '1 an', r3: '3 ans', rall: 'Tout', last: 'Dernière semaine', wk: 'semaine du {d}', c4: 'Variation sur 4 semaines', c52: 'Variation sur 1 an', calc: 'calcul de Dehesa Index', tab: 'Dernières semaines', date: 'Semaine', pos: 'Stade commercial', legend: 'Texte du ministère sur le stade commercial de chaque prix',
      org: 'À la production (producteur)', dst: 'Gros à destination (Mercas)', gap: 'Gros − production', ratio: 'Fois la production', gapNote: 'Dernière semaine avec les deux prix. Calcul de Dehesa Index à partir de deux sources du ministère ; ce n’est la marge de personne.', nodata: 'Pas de données sur cette période', onlyOrg: 'Pas de prix de gros pour ce produit.',
      note: 'Un trou signifie que le ministère n’a publié aucun prix cette semaine. Prix hors TVA, au stade commercial indiqué. Les noms et spécifications des produits changent parfois d’une année à l’autre ; ils sont réunis par nom.', src: 'Source :', open: 'Voir la source d’origine', alt: '{n}, prix hebdomadaire', all: 'Tout' },
    it: { swipe: 'Scorri per vedere i {n} settori →', price: 'Prezzo', search: 'Cerca un prodotto (grano, avocado, agnello…)', sect: 'Settore', vs: 'vs settimana precedente', old: 'Senza dati recenti', oldNote: 'Fuori stagione o non più pubblicato dal ministero. Viene mostrato l’ultimo dato disponibile.', lastd: 'Ultimo dato', none: 'Nessun prodotto corrisponde a «{q}».', hint: 'Tocca un prodotto per vedere il grafico e lo storico.', allsec: 'Risultati in tutti i settori', csv: 'Scarica il CSV', col1: 'Origine', col2: 'Ingrosso', n: '{n} prodotti', h: 'Prezzi settimanali in Spagna', sub: 'Prezzi medi nazionali e prezzi all’origine e all’ingrosso pubblicati ogni settimana dal Ministero dell’Agricoltura.', pmn: 'Prezzi medi nazionali', obs: 'Origine e ingrosso', prod: 'Prodotto', rng: 'Periodo', r1: '1 anno', r3: '3 anni', rall: 'Tutto', last: 'Ultima settimana', wk: 'settimana del {d}', c4: 'Variazione a 4 settimane', c52: 'Variazione a 1 anno', calc: 'calcolo di Dehesa Index', tab: 'Ultime settimane', date: 'Settimana', pos: 'Posizione commerciale', legend: 'Testo del ministero sulla posizione commerciale di ogni prezzo',
      org: 'All’origine (produttore)', dst: 'Ingrosso a destinazione (Mercas)', gap: 'Ingrosso − origine', ratio: 'Volte l’origine', gapNote: 'Ultima settimana con entrambi i prezzi. Calcolo di Dehesa Index su due fonti del ministero; non è il margine di nessuno.', nodata: 'Nessun dato in questo periodo', onlyOrg: 'Nessun prezzo all’ingrosso per questo prodotto.',
      note: 'Un vuoto significa che il ministero non ha pubblicato il prezzo in quella settimana. Prezzi senza IVA, nella posizione commerciale indicata. I nomi dei prodotti cambiano a volte tra gli anni; vengono uniti per nome.', src: 'Fonte:', open: 'Vedi la fonte originale', alt: '{n}, prezzo settimanale', all: 'Tutto' }
  };
  var SC = { 'CEREALES': ['Cereales', 'Cereals', 'Céréales', 'Cereali'], 'ARROZ': ['Arroz', 'Rice', 'Riz', 'Riso'], 'ACEITES VEGETALES Y ACEITUNA DE MESA': ['Aceites y aceituna de mesa', 'Oils and table olives', 'Huiles et olives de table', 'Oli e olive da tavola'], 'VINO': ['Vino', 'Wine', 'Vin', 'Vino'], 'SEMILLAS OLEAGINOSAS, PROTEICOS Y TORTAS': ['Oleaginosas, proteicos y tortas', 'Oilseeds, protein crops and meals', 'Oléagineux, protéagineux et tourteaux', 'Oleaginose, proteiche e panelli'],
    'SEMILLAS OLEAGINOSAS Y PROTEICOS': ['Oleaginosas y proteicos', 'Oilseeds and protein crops', 'Oléagineux et protéagineux', 'Oleaginose e proteiche'], 'FRUTAS': ['Frutas', 'Fruit', 'Fruits', 'Frutta'], 'HORTALIZAS': ['Hortalizas', 'Vegetables', 'Légumes', 'Ortaggi'], 'BOVINO': ['Vacuno', 'Beef cattle', 'Bovins', 'Bovini'], 'OVINO': ['Ovino', 'Sheep', 'Ovins', 'Ovini'], 'PORCINO': ['Porcino', 'Pigs', 'Porcins', 'Suini'],
    'AVES, HUEVOS, CAZA': ['Aves, huevos y caza', 'Poultry, eggs and game', 'Volailles, œufs et gibier', 'Pollame, uova e selvaggina'], 'LÁCTEOS': ['Lácteos', 'Dairy', 'Produits laitiers', 'Latticini'], 'MIEL': ['Miel y polen', 'Honey and pollen', 'Miel et pollen', 'Miele e polline'], 'OLEAG': ['Oleaginosas y proteicos', 'Oilseeds and protein crops', 'Oléagineux et protéagineux', 'Oleaginose e proteiche'], 'undefined': ['Otros', 'Other', 'Autres', 'Altri'] };
  /* Pestaña Andalucía: data/spain-prices/andalucia.json (Observatorio de Precios y Mercados de la Junta de Andalucía; scripts/update-es-andalucia-prices.py) */
  var TA = {
    es: { tab: 'Andalucía', sub: 'Precios semanales que los operadores aportan al Observatorio de Precios y Mercados de la Junta de Andalucía.', note: 'Cada precio está en la posición comercial que se indica (agricultor, almazara, subasta, entrada a matadero…) y es el que publica la Junta. Un hueco significa que no hubo precio esa semana.', pos: 'Posición comercial' },
    en: { tab: 'Andalusia', sub: 'Weekly prices that traders report to the Andalusian Government’s Price and Market Observatory.', note: 'Each price is at the trade position shown (farmer, olive mill, auction, slaughterhouse entry…) and is the one the Andalusian Government publishes. A gap means there was no price that week.', pos: 'Trade position' },
    fr: { tab: 'Andalousie', sub: 'Prix hebdomadaires communiqués par les opérateurs à l’Observatoire des prix et des marchés de la Junta de Andalucía.', note: 'Chaque prix est au stade commercial indiqué (agriculteur, moulin, enchères, entrée abattoir…) et c’est celui que publie la Junta. Un trou signifie qu’il n’y a pas eu de prix cette semaine-là.', pos: 'Stade commercial' },
    it: { tab: 'Andalusia', sub: 'Prezzi settimanali comunicati dagli operatori all’Osservatorio dei prezzi e dei mercati della Junta de Andalucía.', note: 'Ogni prezzo è nella posizione commerciale indicata (agricoltore, frantoio, asta, ingresso al macello…) ed è quello pubblicato dalla Junta. Un vuoto significa che quella settimana non c’è stato prezzo.', pos: 'Posizione commerciale' }
  };
  var ASC = { 'Hortícolas protegidos': ['Hortícolas de invernadero', 'Greenhouse vegetables', 'Légumes sous serre', 'Ortaggi in serra', '🍅'], 'Hortícolas al aire libre': ['Hortícolas al aire libre', 'Open-field vegetables', 'Légumes de plein champ', 'Ortaggi in pieno campo', '🥕'],
    'Frutos rojos': ['Frutos rojos', 'Berries', 'Fruits rouges', 'Frutti rossi', '🍓'], 'Cítricos': ['Cítricos', 'Citrus fruit', 'Agrumes', 'Agrumi', '🍊'], 'Frutales no cítricos': ['Frutales no cítricos', 'Non-citrus fruit', 'Fruits non agrumes', 'Frutta non agrumi', '🥑'],
    'Frutales de cáscara': ['Frutos secos', 'Nuts', 'Fruits à coque', 'Frutta a guscio', '🌰'], 'Aceites': ['Aceite de oliva', 'Olive oil', 'Huile d’olive', 'Olio d’oliva', '🫒'], 'Aceituna': ['Aceituna de verdeo', 'Table olives', 'Olives de table', 'Olive da tavola', '🫒'],
    'Uva para transformacion': ['Uva de vinificación', 'Wine grapes', 'Raisin de cuve', 'Uva da vino', '🍇'], 'Cereales': ['Cereales', 'Cereals', 'Céréales', 'Cereali', '🌾'], 'Leguminosas grano': ['Leguminosas', 'Pulses', 'Légumineuses', 'Leguminose', '🫘'],
    'Cultivos herbáceos industriales': ['Girasol', 'Sunflower', 'Tournesol', 'Girasole', '🌻'], 'Flor cortada': ['Flor cortada', 'Cut flowers', 'Fleurs coupées', 'Fiori recisi', '💐'], 'Bovino para sacrificio': ['Vacuno', 'Beef cattle', 'Bovins', 'Bovini', '🐄'],
    'Ovino para sacrificio': ['Ovino', 'Sheep', 'Ovins', 'Ovini', '🐑'], 'Leches': ['Leche', 'Milk', 'Lait', 'Latte', '🥛'], 'Hortícolas protegidos ecológicos': ['Hortícolas ecológicos', 'Organic vegetables', 'Légumes bio', 'Ortaggi biologici', '🌿'],
    'Frutales de cáscara ecológicos': ['Almendra ecológica', 'Organic almonds', 'Amandes bio', 'Mandorle biologiche', '🌿'], 'Cítricos ecológicos': ['Cítricos ecológicos', 'Organic citrus', 'Agrumes bio', 'Agrumi biologici', '🌿'], 'Aceites ecológicos': ['Aceite ecológico', 'Organic olive oil', 'Huile d’olive bio', 'Olio biologico', '🌿'] };
  var APOS = { 'Agricultor': ['Agricultor', 'Farmer', 'Agriculteur', 'Agricoltore'], 'Árbol': ['En árbol', 'On the tree', 'Sur l’arbre', 'Sull’albero'], 'Ganadero': ['Ganadero', 'Livestock farmer', 'Éleveur', 'Allevatore'], 'Salida Almacén': ['Salida de almacén', 'Ex-warehouse', 'Sortie entrepôt', 'Uscita magazzino'],
    'Campo': ['Campo', 'Field', 'Champ', 'Campo'], 'Almazara o Bodega': ['Almazara o bodega', 'Olive mill or winery', 'Moulin ou cave', 'Frantoio o cantina'], 'Base': ['Precio base', 'Base price', 'Prix de base', 'Prezzo base'], 'Entrada Almacén Mayorista': ['Entrada a almacén mayorista', 'Wholesale warehouse entry', 'Entrée entrepôt de gros', 'Ingresso magazzino all’ingrosso'],
    'Consumo Andalucía': ['Consumo en Andalucía', 'Retail in Andalusia', 'Détail en Andalousie', 'Consumo in Andalusia'], 'Consumo España': ['Consumo en España', 'Retail in Spain', 'Détail en Espagne', 'Consumo in Spagna'], 'Subasta': ['Subasta', 'Auction', 'Enchères', 'Asta'],
    'Entrada Centro Manipulación': ['Entrada a central', 'Packing-house entry', 'Entrée station', 'Ingresso centrale'], 'Salida Centro Manipulación': ['Salida de central', 'Ex packing house', 'Sortie station', 'Uscita centrale'], 'Entrada Matadero': ['Entrada a matadero', 'Slaughterhouse entry', 'Entrée abattoir', 'Ingresso macello'],
    'Salida Matadero': ['Salida de matadero', 'Ex slaughterhouse', 'Sortie abattoir', 'Uscita macello'], 'Salida de industria de transformación': ['Salida de industria', 'Ex processing plant', 'Sortie usine', 'Uscita industria'], 'Mercas': ['Mercas (mayorista)', 'Mercas (wholesale)', 'Mercas (gros)', 'Mercas (ingrosso)'] };
  function apos(p, P) { return APOS[p] ? APOS[p][P] : p; }
  function DS() { return TAB === 'and' ? AN : PM; }
  var EM = { 'CEREALES': '🌾', 'ARROZ': '🍚', 'ACEITES VEGETALES Y ACEITUNA DE MESA': '🫒', 'VINO': '🍷', 'OLEAG': '🌻', 'FRUTAS': '🍎', 'HORTALIZAS': '🥕', 'BOVINO': '🐄', 'OVINO': '🐑', 'PORCINO': '🐖', 'AVES, HUEVOS, CAZA': '🐔', 'LÁCTEOS': '🥛', 'MIEL': '🍯', 'undefined': '📦' };
  function lang() { return S && S.getLang ? S.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dd(v) { var a = Math.abs(v); return a >= 1000 ? 0 : a >= 100 ? 1 : 2; }
  function fv(v) { return v == null ? '—' : nf(v, dd(v)); }
  function ts(w) { return Date.parse(w + 'T00:00:00Z'); }
  function dstr(w) { try { return new Date(ts(w)).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return w; } }
  function pct(a, b) { if (a == null || !b) return null; return (b / a - 1) * 100; }
  function pcs(p) { return p == null ? '—' : (p > 0.05 ? '+' : p < -0.05 ? '−' : '') + nf(Math.abs(p), 1) + ' %'; }
  function pcc(p) { return p == null ? 'inherit' : p > 0.05 ? 'var(--up, #2c6e49)' : p < -0.05 ? 'var(--down, #a33)' : 'inherit'; }
  function lastIdx(v) { var i = v.length - 1; while (i >= 0 && v[i] == null) i--; return i; }
  function window_(W, v) { var n = RNG[TAB]; var a = n ? Math.max(0, W.length - n) : 0, i; var out = []; for (i = a; i < W.length; i++) out.push(i); return out; }
  function pts(W, v, idx) { return idx.map(function (i) { return { x: ts(W[i]), y: v[i] }; }).filter(function (p) { return p.y != null; }); }
  function lineChart(series, unit, aria) {
    if (!global.DehesaChart || !global.DehesaChart.render) return '';
    return global.DehesaChart.render({ series: series, xMode: 'time', yTitle: unit, aria: aria, zero: false, noLegend: series.length < 2, vFmt: function (v) { return fv(v); } });
  }
  function posText(leg, pos) { if (!leg || !pos) return pos || ''; var parts = leg.replace(/^[^(]*(?=\()/, '').split(/;\s*(?=\(\d+\))/), i; for (i = 0; i < parts.length; i++) if (parts[i].indexOf(pos) === 0) return parts[i].replace(/\.\s*$/, ''); return pos; }

  function norm(x) { x = String(x || '').toLowerCase(); try { x = x.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { } return x; }
  function gk(s) { var k = s.sector || 'undefined'; return TAB !== 'and' && k.indexOf('SEMILLAS OLEAGINOSAS') === 0 ? 'OLEAG' : k; }
  function arrow(p) { return p == null ? '' : p > 0.05 ? '▲ ' : p < -0.05 ? '▼ ' : '= '; }
  function pca(p) { return p == null ? '—' : arrow(p) + nf(Math.abs(p), 1) + ' %'; }
  function chip(on, cls, data, label, emo) { return '<button type="button" class="esp-chip ' + cls + (on ? ' on' : '') + '" ' + data + ' aria-pressed="' + on + '">' + (emo ? '<span aria-hidden="true">' + emo + '</span> ' : '') + esc(label) + '</button>'; }
  function rangeChips(t) { var cur = RNG[TAB]; return '<div class="esp-rg" role="group" aria-label="' + esc(t.rng) + '">' + [[52, t.r1], [156, t.r3], [0, t.rall]].map(function (x) { return chip(cur === x[0], 'esp-r', 'data-r="' + x[0] + '"', x[1]); }).join('') + '</div>'; }
  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }
  function wide() { try { return global.matchMedia('(min-width:900px)').matches; } catch (e) { return false; } }
  function lastOf(v) { var i = lastIdx(v); return i; }
  function shortD(w) { try { return new Date(ts(w)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return w; } }
  function csv(name, W, v, unit) { var out = ['week,value,' + unit.replace(/,/g, ' ')], i; for (i = 0; i < W.length; i++) if (v[i] != null) out.push(W[i] + ',' + v[i]); return out.join('\n'); }
  var th = 'padding:8px 6px;font-size:11px;font-weight:700;color:var(--text-faint);', td = 'padding:7px 6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';

  /* ---- Medios nacionales ---- */
  function pmnDetail(t, s, W) {
    var li = lastIdx(s.v), idx = window_(W, s.v), unit = s.unit || '', i;
    var p1 = li >= 1 ? pct(s.v[li - 1], s.v[li]) : null, p4 = li >= 4 ? pct(s.v[li - 4], s.v[li]) : null, p52 = li >= 52 ? pct(s.v[li - 52], s.v[li]) : null;
    var cp = pts(W, s.v, idx), ch = cp.length ? lineChart([{ name: s.name, color: '#1d5178', pts: cp }], unit, f(t.alt, { n: s.name })) : '<p class="cof-sub">' + esc(t.nodata) + '</p>';
    var rows = []; for (i = li; i >= 0 && rows.length < 10; i--) rows.push('<tr><td style="' + td + 'text-align:left">' + esc(dstr(W[i])) + '</td><td style="' + td + '">' + esc(fv(s.v[i])) + '</td></tr>');
    return '<div class="esp-det" id="esp-det"><div class="esp-dh"><h3>' + esc(s.name) + '</h3><span>' + esc(unit) + ' · ' + esc(f(t.wk, { d: dstr(W[li]) })) + '</span></div>' +
      '<div class="esp-st"><span>' + esc(t.vs) + ': <b style="color:' + pcc(p1) + '">' + esc(pca(p1)) + '</b></span><span>' + esc(t.c4) + ': <b style="color:' + pcc(p4) + '">' + esc(pca(p4)) + '</b></span><span>' + esc(t.c52) + ': <b style="color:' + pcc(p52) + '">' + esc(pca(p52)) + '</b></span></div>' +
      (s.pos ? '<p class="di-movers-hint">' + esc(TAB === 'and' ? (TA[lang()] || TA.es).pos : t.pos) + ': ' + esc(TAB === 'and' ? apos(s.pos, LI[lang()] || 0) : posText(PM.legend, s.pos)) + '</p>' : '') + rangeChips(t) + ch +
      '<details class="usm-more"><summary>📋 ' + esc(t.tab) + '</summary><div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:260px;font-size:13.5px"><thead><tr><th scope="col" style="' + th + 'text-align:left">' + esc(t.date) + '</th><th scope="col" style="' + th + 'text-align:right">' + esc(s.name + ' (' + unit + ')') + '</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div></details>' +
      '<p class="esp-act"><button type="button" class="esp-csv" data-id="' + esc(s.id) + '">⬇️ ' + esc(t.csv) + '</button></p></div>';
  }
  function pmnRow(t, s, W, open, old) {
    var li = lastIdx(s.v), p1 = li >= 1 ? pct(s.v[li - 1], s.v[li]) : null, unit = s.unit || '';
    return '<button type="button" class="esp-row' + (open ? ' on' : '') + '" data-id="' + esc(s.id) + '" aria-expanded="' + open + '"' + (open ? ' aria-controls="esp-det"' : '') + '><span class="esp-n">' + esc(s.name) + '</span><span class="esp-p"><b>' + esc(fv(s.v[li])) + '</b><small>' + esc(unit) + '</small></span><span class="esp-c" style="color:' + (old ? 'inherit' : pcc(p1)) + '">' + esc(old ? shortD(W[li]) : pca(p1)) + '</span></button>';
  }
  function pmnList(t, P) {
    var D = DS(), W = D.weeks, q = norm(Q.trim()), set = D.series.filter(function (x) { return lastIdx(x.v) >= 0 && (q ? norm(x.name).indexOf(q) > -1 : gk(x) === SECKS[TAB]); }), fresh = [], old = [], opn = SEL[TAB], i, html = '';
    set.forEach(function (x) { (W.length - 1 - lastIdx(x.v) <= STALE ? fresh : old).push(x); });
    var all = fresh.concat(old), cur = null; all.forEach(function (x) { if (x.id === opn) cur = x; });
    if (!cur && wide() && opn !== '') cur = fresh[0] || null;   // en ordenador el panel nunca queda vacio
    if (!set.length) return '<p class="cof-sub">' + esc(f(t.none, { q: Q.trim() })) + '</p>';
    var curFresh = cur && fresh.indexOf(cur) > -1;
    html += '<div class="esp-hd"><span>' + esc(t.prod) + '</span><span>' + esc(t.price) + '</span><span>' + esc(t.vs) + '</span></div>';
    html += '<div class="esp-grid">' + fresh.map(function (x) { var o = x === cur; return pmnRow(t, x, W, o, false) + (o && !wide() ? pmnDetail(t, x, W) : ''); }).join('') + (curFresh && wide() ? pmnDetail(t, cur, W) : '') + '</div>';
    if (old.length) html += '<details class="esp-old"' + (cur && !curFresh ? ' open' : '') + '><summary>⏳ ' + esc(t.old) + ' · ' + old.length + '<span>' + esc(t.oldNote) + '</span></summary><div class="esp-grid1">' + old.map(function (x) { var o = x === cur; return pmnRow(t, x, W, o, true) + (o ? pmnDetail(t, x, W) : ''); }).join('') + '</div></details>';
    return html;
  }

  /* ---- Origen y destino ---- */
  function obsData() {
    var D = OB, org = {}, dst = {}, ids = [];
    D.series.forEach(function (x) { var k = x.id.slice(x.id.indexOf('-') + 1); if (x.stage === 'origen') org[k] = x; else dst[k] = x; });
    Object.keys(org).forEach(function (k) { ids.push(k); }); Object.keys(dst).forEach(function (k) { if (!org[k]) ids.push(k); });
    ids.sort(function (a, b) { return (org[a] || dst[a]).name.localeCompare((org[b] || dst[b]).name, lang()); });
    return { org: org, dst: dst, ids: ids };
  }
  function obsLast(x) { return x ? lastIdx(x.v) : -1; }
  function obsRow(t, k, o, d, W, open) {
    var lo = obsLast(o), ld = obsLast(d), base = o || d, unit = '€/' + (base.unit || 'kg');
    return '<button type="button" class="esp-row esp-row3' + (open ? ' on' : '') + '" data-id="' + esc(k) + '" aria-expanded="' + open + '"' + (open ? ' aria-controls="esp-det"' : '') + '><span class="esp-n">' + esc(base.name) + '</span><span class="esp-p"><b>' + esc(lo >= 0 ? fv(o.v[lo]) : '—') + '</b><small>' + esc(t.col1) + '</small></span><span class="esp-p"><b>' + esc(ld >= 0 ? fv(d.v[ld]) : '—') + '</b><small>' + esc(t.col2) + '</small></span></button>';
  }
  function obsDetail(t, k, o, d, W) {
    var base = o || d, idx = window_(W, base.v), unit = '€/' + (base.unit || 'kg'), series = [], gap = '', i;
    if (o) series.push({ name: t.org, color: '#4c7a4a', pts: pts(W, o.v, idx) }); if (d) series.push({ name: t.dst, color: '#b58a5b', pts: pts(W, d.v, idx) });
    series = series.filter(function (s) { return s.pts.length; });
    if (o && d) { for (i = W.length - 1; i >= 0 && !(o.v[i] != null && d.v[i] != null); i--); if (i >= 0) gap = '<div class="esp-st"><span>' + esc(t.gap) + ': <b>' + esc(nf(d.v[i] - o.v[i], 2)) + ' ' + esc(unit) + '</b></span><span>' + esc(t.ratio) + ': <b>' + esc(nf(d.v[i] / o.v[i], 1)) + ' ×</b></span><span>' + esc(f(t.wk, { d: dstr(W[i]) })) + ' · ' + esc(t.calc) + '</span></div><p class="cof-note">' + esc(t.gapNote) + '</p>'; }
    else gap = '<p class="cof-note">' + esc(t.onlyOrg) + '</p>';
    return '<div class="esp-det" id="esp-det"><div class="esp-dh"><h3>' + esc(base.name) + '</h3><span>' + esc(unit) + '</span></div>' + gap + rangeChips(t) + (series.length ? lineChart(series, unit, f(t.alt, { n: base.name })) : '<p class="cof-sub">' + esc(t.nodata) + '</p>') + '<p class="esp-act"><button type="button" class="esp-csv" data-id="' + esc(k) + '">⬇️ ' + esc(t.csv) + '</button></p></div>';
  }
  function obsList(t, P) {
    var D = OB, W = D.weeks, X = obsData(), q = norm(Q.trim()), ids = X.ids.filter(function (k) { return !q || norm((X.org[k] || X.dst[k]).name).indexOf(q) > -1; }), cur = SEL.obs;
    if (!ids.length) return '<p class="cof-sub">' + esc(f(t.none, { q: Q.trim() })) + '</p>';
    if (ids.indexOf(cur) < 0) cur = wide() && SEL.obs !== '' ? ids[0] : null;
    return '<div class="esp-hd esp-hd3"><span>' + esc(t.prod) + '</span><span>' + esc(t.col1) + '</span><span>' + esc(t.col2) + '</span></div><div class="esp-grid">' + ids.map(function (k) { var o = k === cur; return obsRow(t, k, X.org[k], X.dst[k], W, o) + (o && !wide() ? obsDetail(t, k, X.org[k], X.dst[k], W) : ''); }).join('') + (cur && wide() ? obsDetail(t, cur, X.org[cur], X.dst[cur], W) : '') + '</div>';
  }

  /* ---- bloque ---- */
  function sectorChips(t, P) {
    var cnt = {}, order = [], A = TAB === 'and'; DS().series.forEach(function (x) { var k = gk(x); if (!cnt[k]) { cnt[k] = 0; order.push(k); } cnt[k]++; });
    order.sort(function (a, b) { return cnt[b] - cnt[a]; });
    return '<div class="esp-chips" role="group" aria-label="' + esc(t.sect) + '">' + order.map(function (k) { return chip(!Q.trim() && SECKS[TAB] === k, 'esp-s', 'data-s="' + esc(k) + '"', (A ? (ASC[k] ? ASC[k][P] : k) : (SC[k] ? SC[k][P] : k)) + ' · ' + cnt[k], A ? (ASC[k] ? ASC[k][4] : '📦') : (EM[k] || '📦')); }).join('') + '</div>';
  }
  function csvDownload(el, id) {
    var t = T[lang()] || T.es, W, v, unit, name;
    if (TAB === 'pmn' || TAB === 'and') { var s = DS().series.filter(function (x) { return x.id === id; })[0]; if (!s) return; W = DS().weeks; v = s.v; unit = s.unit || ''; name = s.id; }
    else { var X = obsData(), o = X.org[id], d = X.dst[id], base = o || d; if (!base) return; W = OB.weeks; name = id; unit = '€/' + (base.unit || 'kg');
      var out = ['week,origen,destino,' + unit], i; for (i = 0; i < W.length; i++) if ((o && o.v[i] != null) || (d && d.v[i] != null)) out.push(W[i] + ',' + (o && o.v[i] != null ? o.v[i] : '') + ',' + (d && d.v[i] != null ? d.v[i] : ''));
      return dl(name, out.join('\n')); }
    dl(name, csv(name, W, v, unit));
  }
  function dl(name, text) { try { var b = new Blob([text + '\n'], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'dehesa-index-' + name + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 500); } catch (e) { } }
  function bindList(el) {
    var L = document.getElementById('esp-list'); if (!L) return;
    Array.prototype.forEach.call(L.querySelectorAll('.esp-row'), function (b) { b.onclick = function () { var id = b.getAttribute('data-id'); SEL[TAB] = SEL[TAB] === id && b.classList.contains('on') ? '' : id; fillList(el); var n = L.querySelector('.esp-row.on'); if (n && !wide()) { try { n.scrollIntoView({ block: 'nearest' }); } catch (e) { } } }; });
    Array.prototype.forEach.call(L.querySelectorAll('.esp-r'), function (b) { b.onclick = function () { RNG[TAB] = parseInt(b.getAttribute('data-r'), 10); fillList(el); }; });
    Array.prototype.forEach.call(L.querySelectorAll('.esp-csv'), function (b) { b.onclick = function () { csvDownload(el, b.getAttribute('data-id')); }; });
  }
  function fillList(el) { var L = document.getElementById('esp-list'); if (!L) return; var t = T[lang()] || T.es, P = LI[lang()] || 0; L.innerHTML = TAB === 'obs' ? obsList(t, P) : pmnList(t, P); bindList(el); }
  function render(el) {
    var t = T[lang()] || T.es, ta = TA[lang()] || TA.es, P = LI[lang()] || 0, hasP = !!PM, hasO = !!OB, hasA = !!AN; if (!hasP && !hasO && !hasA) { el.hidden = true; return; }
    if (TAB === 'pmn' && !hasP) TAB = hasO ? 'obs' : 'and'; if (TAB === 'obs' && !hasO) TAB = hasP ? 'pmn' : 'and'; if (TAB === 'and' && !hasA) TAB = hasP ? 'pmn' : 'obs';
    var tabs = '<div class="esp-tabs" role="group">' + (hasP ? chip(TAB === 'pmn', 'esp-t', 'data-t="pmn"', t.pmn, '📊') : '') + (hasO ? chip(TAB === 'obs', 'esp-t', 'data-t="obs"', t.obs, '🚜') : '') + (hasA ? chip(TAB === 'and', 'esp-t', 'data-t="and"', ta.tab, '☀️') : '') + '</div>';
    var cur = TAB === 'obs' ? OB : DS(), src = cur.source, wk = cur.weeks, isA = TAB === 'and';
    var cite = global.DICite && global.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + global.DICite.html(isA ? 'junta_andalucia_observatorio' : 'mapa_es', {}) + '</div>' : '';
    el.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(isA ? ta.sub : t.sub) + ' ' + esc(cap(f(t.wk, { d: dstr(wk[wk.length - 1]) }))) + '.</p>' + tabs +
      '<label class="esp-q"><span aria-hidden="true">🔍</span><input id="esp-q" type="search" autocomplete="off" value="' + esc(Q) + '" placeholder="' + esc(t.search) + '" aria-label="' + esc(t.search) + '"></label>' +
      (TAB !== 'obs' ? sectorChips(t, P) + '<p class="esp-swipe">' + esc(f(t.swipe, { n: Object.keys(DS().series.reduce(function (m, x) { m[gk(x)] = 1; return m; }, {})).length })) + '</p>' + (Q.trim() ? '<p class="di-movers-hint">' + esc(t.allsec) + '</p>' : '') : '') +
      '<div id="esp-list" class="esp-listw"></div><p class="esp-tip">' + esc(t.hint) + '</p><p class="cof-note">' + esc(isA ? ta.note : t.note) + ' ' + esc(t.src) + ' <a href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.open) + '</a></p>' + cite;
    Array.prototype.forEach.call(el.querySelectorAll('.esp-t'), function (b) { b.onclick = function () { TAB = b.getAttribute('data-t'); Q = ''; render(el); }; });
    Array.prototype.forEach.call(el.querySelectorAll('.esp-s'), function (b) { b.onclick = function () { SECKS[TAB] = b.getAttribute('data-s'); Q = ''; SEL[TAB] = null; render(el); }; });
    var qi = document.getElementById('esp-q'); if (qi) qi.oninput = function () { Q = qi.value; SEL[TAB] = null; fillList(el); };
    fillList(el);
  }
  function j(u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function boot() {
    var el = document.getElementById('esp'); if (!el) return;
    Promise.all([j('data/spain-prices/pmn.json'), j('data/spain-prices/obs.json'), global.DICite ? global.DICite.load().catch(function () { return null; }) : null, j('data/spain-prices/andalucia.json')]).then(function (a) {
      PM = a[0] && a[0].series && a[0].series.length > 50 ? a[0] : null; OB = a[1] && a[1].series && a[1].series.length > 20 ? a[1] : null; AN = a[3] && a[3].series && a[3].series.length > 50 ? a[3] : null;
      try { var qt = new URLSearchParams(global.location.search).get('esp'); if (qt === 'and' && AN) TAB = 'and'; } catch (e) { }
      render(el);
    });
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); render(el); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
