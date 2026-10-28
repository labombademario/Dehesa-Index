/* Dehesa Index — Portugal · INE: pesca, balances de abastecimiento, leche, carne, IPCA de alimentos, incendios rurales, cultivos por región, fertilizantes y miel (portugal.html). ES5.
   Datos: data/portugal-more/{pesca,balances,leche,carne,ipc,incendios,cultivos,insumos}.json (scripts/update-portugal-more.py), INE (incendios: ICNF; pesca: DGRM), CC BY 4.0.
   Cada pestaña descarga su fichero solo al abrirse. Un dato ausente se muestra como ausente; nada se estima. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var S = global.DehesaShared || {};
  function lg() { var l = S.getLang ? S.getLang() : 'es'; return IX[l] != null ? l : 'es'; }
  function tx(a) { return a[IX[lg()]]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { return v == null || isNaN(v) ? '—' : (+v).toLocaleString(LOC[lg()], { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 0 : d }); }
  var TABS = ['pesca', 'balances', 'leche', 'carne', 'ipc', 'incendios', 'cultivos', 'insumos'];
  var T = {
    h1: L('Portugal · INE: pesca, balances, leche, carne, precios al consumo, incendios, cultivos y fertilizantes', 'Portugal · INE: fishing, supply balances, milk, meat, consumer prices, fires, crops and fertilisers', 'Portugal · INE : pêche, bilans d’approvisionnement, lait, viande, prix à la consommation, incendies, cultures et engrais', 'Portogallo · INE: pesca, bilanci di approvvigionamento, latte, carne, prezzi al consumo, incendi, colture e fertilizzanti'),
    sub: L('Ocho conjuntos del Instituto Nacional de Estadística de Portugal (INE), tal como los publica: precio medio de la pesca descargada, autoabastecimiento y consumo, leche recogida, producción bruta de carne, IPCA de alimentos, incendios rurales, superficie de cultivos por región, fertilizantes y miel.',
           'Eight datasets from Statistics Portugal (INE), as published: mean price of landed fish, self-sufficiency and consumption, milk collected, gross meat production, food HICP, rural fires, crop area by region, fertilisers and honey.',
           'Huit jeux de données de l’Institut national de la statistique du Portugal (INE), tels que publiés : prix moyen du poisson débarqué, autosuffisance et consommation, lait collecté, production brute de viande, IPCH alimentaire, incendies rurales, superficie des cultures par région, engrais et miel.',
           'Otto insiemi dell’Istituto nazionale di statistica del Portogallo (INE), come pubblicati: prezzo medio del pesce sbarcato, autosufficienza e consumo, latte raccolto, produzione lorda di carne, IPCA alimentare, incendi rurali, superficie delle colture per regione, fertilizzanti e miele.'),
    tabs: { pesca: L('🐟 Pesca', '🐟 Fishing', '🐟 Pêche', '🐟 Pesca'), balances: L('⚖️ Balances', '⚖️ Supply balances', '⚖️ Bilans', '⚖️ Bilanci'), leche: L('🥛 Leche', '🥛 Milk', '🥛 Lait', '🥛 Latte'), carne: L('🥩 Carne', '🥩 Meat', '🥩 Viande', '🥩 Carne'),
            ipc: L('🛒 Precios al consumo', '🛒 Consumer prices', '🛒 Prix à la consommation', '🛒 Prezzi al consumo'), incendios: L('🔥 Incendios', '🔥 Fires', '🔥 Incendies', '🔥 Incendi'), cultivos: L('🌾 Cultivos por región', '🌾 Crops by region', '🌾 Cultures par région', '🌾 Colture per regione'), insumos: L('🧪 Fertilizantes y miel', '🧪 Fertilisers and honey', '🧪 Engrais et miel', '🧪 Fertilizzanti e miele') },
    loading: L('Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'), fail: L('No se han podido cargar estos datos. Prueba de nuevo en unos minutos.', 'These data could not be loaded. Try again in a few minutes.', 'Ces données n’ont pas pu être chargées. Réessayez dans quelques minutes.', 'Impossibile caricare questi dati. Riprova tra qualche minuto.'),
    pick: L('Tabla', 'Table', 'Tableau', 'Tabella'), full: L('Abrir en página completa', 'Open as a full page', 'Ouvrir en pleine page', 'Apri a pagina intera'),
    hName: L('Serie', 'Series', 'Série', 'Serie'), hLast: L('Último', 'Latest', 'Dernier', 'Ultimo'), hPer: L('Periodo', 'Period', 'Période', 'Periodo'), hChg: L('Variación anual', 'Annual change', 'Variation annuelle', 'Variazione annua'), hFirst: L('Desde el inicio', 'Since the start', 'Depuis le début', 'Dall’inizio'),
    show: L('Pulsa una fila para añadirla o quitarla de la gráfica (hasta 4).', 'Click a row to add or remove it from the chart (up to 4).', 'Cliquez sur une ligne pour l’ajouter ou la retirer du graphique (4 au maximum).', 'Fai clic su una riga per aggiungerla o toglierla dal grafico (fino a 4).'),
    prov: L('(p) provisional', '(p) provisional', '(p) provisoire', '(p) provvisorio'),
    src: L('Fuente', 'Source', 'Source', 'Fonte'), cat2: L('Todas las series del INE en el catálogo', 'All INE series in the catalogue', 'Toutes les séries de l’INE dans le catalogue', 'Tutte le serie dell’INE nel catalogo'),
    note: L('Nota', 'Note', 'Note', 'Nota'),
    hint: {
      pesca: L('Precio medio de la pesca descargada en euros por kilo, por puerto, isla o región y grupo de especies, desde 1969. Lo calcula la dirección general de recursos marinos (DGRM) y lo publica el INE; no es la cotización diaria de una lonja.',
               'Mean price of landed fish in euros per kilo, by port, island or region and species group, since 1969. It is calculated by the fisheries authority (DGRM) and published by INE; it is not a daily auction quote.',
               'Prix moyen du poisson débarqué en euros par kilo, par port, île ou région et groupe d’espèces, depuis 1969. Il est calculé par l’autorité des pêches (DGRM) et publié par l’INE ; ce n’est pas une cotation quotidienne de criée.',
               'Prezzo medio del pesce sbarcato in euro al chilo, per porto, isola o regione e gruppo di specie, dal 1969. Lo calcola l’autorità della pesca (DGRM) e lo pubblica l’INE; non è la quotazione giornaliera di un mercato ittico.'),
      balances: L('Cuánto produce Portugal frente a lo que consume: autoabastecimiento (por encima del 100 % produce más de lo que consume) y consumo humano, total y por habitante, de carne, cereales, fruta, miel y vino. Cereales, fruta y vino van por campaña.',
                  'How much Portugal produces compared with what it consumes: self-sufficiency (above 100 % it produces more than it consumes) and human consumption, total and per head, of meat, cereals, fruit, honey and wine. Cereals, fruit and wine are by marketing year.',
                  'Ce que le Portugal produit par rapport à ce qu’il consomme : autosuffisance (au-dessus de 100 % il produit plus qu’il ne consomme) et consommation humaine, totale et par habitant, de viande, céréales, fruits, miel et vin. Céréales, fruits et vin sont par campagne.',
                  'Quanto produce il Portogallo rispetto a quanto consuma: autosufficienza (sopra il 100 % produce più di quanto consuma) e consumo umano, totale e pro capite, di carne, cereali, frutta, miele e vino. Cereali, frutta e vino sono per campagna.'),
      leche: L('Leche recogida por las industrias lácteas, por tipo (vaca, oveja, cabra), en toneladas y en miles de litros, anual desde 1986.',
               'Milk collected by dairies, by type (cow, sheep, goat), in tonnes and thousand litres, yearly since 1986.',
               'Lait collecté par les laiteries, par type (vache, brebis, chèvre), en tonnes et en milliers de litres, annuel depuis 1986.',
               'Latte raccolto dai caseifici, per tipo (vacca, pecora, capra), in tonnellate e migliaia di litri, annuale dal 1986.'),
      carne: L('Producción bruta indígena de carne: producción neta más el saldo de comercio de animales vivos, en peso en canal. Porcino trimestral; bovino, ovino y caprino semestral, desde 1995. Cifras en miles de cabezas.',
               'Gross indigenous meat production: net production plus the balance of live-animal trade, in carcass weight. Pigs quarterly; cattle, sheep and goats half-yearly, since 1995. Figures in thousand head.',
               'Production brute indigène de viande : production nette plus le solde du commerce d’animaux vivants, en poids carcasse. Porcins trimestriel ; bovins, ovins et caprins semestriel, depuis 1995. Chiffres en milliers de têtes.',
               'Produzione lorda indigena di carne: produzione netta più il saldo del commercio di animali vivi, in peso di carcassa. Suini trimestrale; bovini, ovini e caprini semestrale, dal 1995. Cifre in migliaia di capi.'),
      ipc: L('Índice armonizado de precios al consumo (IPCA) de Portugal por grupo de alimentos (clasificación COICOP 2018), mensual desde 1996, base 2025 = 100. Sirve para ver cuánto del precio de la cesta se debe a la carne, los lácteos, el pan o la fruta.',
             'Portugal’s harmonised index of consumer prices (HICP) by food group (COICOP 2018 classification), monthly since 1996, base 2025 = 100. It shows how much of the basket price comes from meat, dairy, bread or fruit.',
             'Indice des prix à la consommation harmonisé (IPCH) du Portugal par groupe alimentaire (classification COICOP 2018), mensuel depuis 1996, base 2025 = 100. Il montre ce qui, dans le prix du panier, vient de la viande, des produits laitiers, du pain ou des fruits.',
             'Indice armonizzato dei prezzi al consumo (IPCA) del Portogallo per gruppo alimentare (classificazione COICOP 2018), mensile dal 1996, base 2025 = 100. Mostra quanta parte del prezzo del carrello dipende da carne, latticini, pane o frutta.'),
      incendios: L('Incendios rurales (número por tamaño) y superficie quemada por tipo de terreno, de la serie del ICNF que publica el INE. Portugal, regiones y subregiones, y 308 municipios. El último año puede ser provisional.',
                   'Rural fires (number by size) and burnt area by land type, from the ICNF series published by INE. Portugal, regions and subregions, and 308 municipalities. The latest year may be provisional.',
                   'Incendies rurales (nombre par taille) et surface brûlée par type de terrain, d’après la série de l’ICNF publiée par l’INE. Portugal, régions et sous-régions, et 308 communes. La dernière année peut être provisoire.',
                   'Incendi rurali (numero per dimensione) e superficie bruciata per tipo di terreno, dalla serie dell’ICNF pubblicata dall’INE. Portogallo, regioni e sottoregioni e 308 comuni. L’ultimo anno può essere provvisorio.'),
      cultivos: L('Superficie de los principales cultivos en Portugal y en cada región (NUTS 2024), en hectáreas. Solo hay tres años publicados con esta geografía, así que sirve sobre todo para comparar regiones.',
                  'Area of the main crops in Portugal and in each region (NUTS 2024), in hectares. Only three years are published with this geography, so it is mainly useful for comparing regions.',
                  'Superficie des principales cultures au Portugal et dans chaque région (NUTS 2024), en hectares. Seules trois années sont publiées avec cette géographie ; elle sert surtout à comparer les régions.',
                  'Superficie delle principali colture in Portogallo e in ogni regione (NUTS 2024), in ettari. Con questa geografia sono pubblicati solo tre anni, quindi serve soprattutto a confrontare le regioni.'),
      insumos: L('Consumo aparente de fertilizantes minerales por hectárea de superficie agrícola utilizada (desde 1995) y producción de miel (desde 1938).',
                 'Apparent consumption of mineral fertilisers per hectare of utilised agricultural area (since 1995) and honey production (since 1938).',
                 'Consommation apparente d’engrais minéraux par hectare de surface agricole utilisée (depuis 1995) et production de miel (depuis 1938).',
                 'Consumo apparente di fertilizzanti minerali per ettaro di superficie agricola utilizzata (dal 1995) e produzione di miele (dal 1938).')
    },
    grpName: {
      pesca: L('Pesca descargada', 'Landed fish', 'Poisson débarqué', 'Pesce sbarcato'), carne: L('Carne', 'Meat', 'Viande', 'Carne'), vegetal: L('Cereales y fruta', 'Cereals and fruit', 'Céréales et fruits', 'Cereali e frutta'), miel: L('Miel', 'Honey', 'Miel', 'Miele'), vino: L('Vino', 'Wine', 'Vin', 'Vino'),
      leche: L('Leche recogida', 'Milk collected', 'Lait collecté', 'Latte raccolto'), ipc: L('Precios al consumo', 'Consumer prices', 'Prix à la consommation', 'Prezzi al consumo'),
      nacional: L('Portugal', 'Portugal', 'Portugal', 'Portogallo'), regiones: L('Regiones', 'Regions', 'Régions', 'Regioni'), municipios: L('Municipios', 'Municipalities', 'Communes', 'Comuni'), insumos: L('Fertilizantes', 'Fertilisers', 'Engrais', 'Fertilizzanti')
    }
  };
  var FILE = { pesca: 'pesca.json', balances: 'balances.json', leche: 'leche.json', carne: 'carne.json', ipc: 'ipc.json', incendios: 'incendios.json', cultivos: 'cultivos.json', insumos: 'insumos.json' };
  var CACHE = {}, STATE = { tab: 'pesca', sel: {}, tid: {} }, BASE = 'data/portugal-more/', COLORS = ['#1d5178', '#a9491f', '#2e7d5b', '#7a4a8c'];
  function load(f) { if (CACHE[f]) return CACHE[f]; return CACHE[f] = fetch(BASE + f, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function tsOf(p) { var y = +p.slice(0, 4), m = 1, c = p.charAt(5); if (p.charAt(4) === '-') { if (c === 'Q') m = (+p.slice(6) - 1) * 3 + 1; else if (c === 'S') m = (+p.slice(6) - 1) * 6 + 1; else m = +p.slice(5, 7); } return Date.UTC(y, m - 1, 1); }
  function pc(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }
  function chg(v) { if (v == null) return '<span class="ag-m">—</span>'; var up = v > 0.049, dn = v < -0.049; return '<span class="ag-chg ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲ +' : dn ? '▼ −' : '■ ') + nf(Math.abs(v), 1) + ' %</span>'; }
  function lab(o) { var l = lg(); return l === 'es' || !o.l ? o.label : (o.l[l] || o.label); }
  function rowsOf(t) {
    return t.series.map(function (s) {
      var p = s.points, n = p.length, lastP = p[n - 1], per = lastP[0], ann = per.length === 4 || per.charAt(4) === '/', y1 = per.charAt(4) === '/' ? (+per.slice(0, 4) - 1) + '/' + ('0' + ((+per.slice(5) + 99) % 100)).slice(-2) : (+per.slice(0, 4) - 1) + per.slice(4), prev = null;
      p.forEach(function (x) { if (x[0] === y1) prev = x[1]; });
      return { id: s.id, label: lab(s), nl: s.orig, points: p, last: lastP[1], per: per, prov: s.provisional, chg: pc(lastP[1], prev), chgFirst: n > 1 ? pc(lastP[1], p[0][1]) : null, ann: ann };
    });
  }
  function decOf(rows, unit) { return /índice|%|€\/kg|t\/ha|kg\/hab|kg\/ha|l\/hab/.test(unit || '') || rows.every(function (r) { return Math.abs(r.last) < 100; }) ? 1 : 0; }
  function block(key, rows, o) {
    var sel = STATE.sel[key];
    if (!sel || !sel.length || !rows.some(function (r) { return sel.indexOf(r.id) >= 0; })) sel = STATE.sel[key] = (o.defSel || [rows[0].id]).filter(function (id) { return rows.some(function (r) { return r.id === id; }); });
    if (!sel.length) sel = STATE.sel[key] = [rows[0].id];
    var list = rows.slice(); if (o.sort) list.sort(function (a, b) { return (b.last || 0) - (a.last || 0); });
    var series = [], anyProv = false, ann = rows[0].ann, dec = decOf(rows, o.unit);
    sel.forEach(function (id, n) { var r = rows.filter(function (x) { return x.id === id; })[0]; if (!r) return; series.push({ name: r.label, color: COLORS[n % 4], pts: r.points.map(function (p) { return { x: tsOf(p[0]), y: p[1], l: p[0] }; }) }); });
    var chart = global.DehesaChart ? global.DehesaChart.render({ series: series, xMode: 'time', yTitle: o.unit, noLegend: series.length < 2, aria: o.aria, vFmt: function (v) { return nf(v, dec); }, xFmt: ann ? function (x) { return new Date(x).getUTCFullYear(); } : undefined }) : '';
    var body = list.map(function (r) {
      var on = sel.indexOf(r.id) >= 0, pr = r.prov && r.prov.indexOf(r.per) >= 0; if (pr) anyProv = true;
      return '<tr><td><button type="button" class="ag-row" data-k="' + esc(key) + '" data-id="' + esc(r.id) + '" aria-pressed="' + on + '"' + (r.nl ? ' title="' + esc(r.nl) + '"' : '') + '>' + esc(r.label) + '</button></td><td class="num">' + nf(r.last, dec) + '</td><td>' + esc(r.per) + (pr ? ' (p)' : '') + '</td><td class="num">' + chg(r.chg) + '</td><td class="num">' + chg(r.chgFirst) + '</td></tr>';
    }).join('');
    return '<div class="ag-chart">' + chart + '</div><p class="ag-m">' + esc(tx(T.show)) + (anyProv ? ' ' + esc(tx(T.prov)) + '.' : '') + '</p><div class="di-table-wrap"><table class="di-table ag-tbl"><thead><tr><th>' + esc(tx(T.hName)) + '</th><th class="num">' + esc(tx(T.hLast)) + ' (' + esc(o.unit) + ')</th><th>' + esc(tx(T.hPer)) + '</th><th class="num">' + esc(tx(T.hChg)) + '</th><th class="num">' + esc(tx(T.hFirst)) + '</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function selectHtml(id, label, opts, cur) {
    return '<label class="ag-lab" for="' + id + '">' + esc(label) + '</label><select id="' + id + '" class="di-field-input ag-sel" data-search="1">' + opts.map(function (o) { return o.group ? '<optgroup label="' + esc(o.group) + '">' + o.items.map(function (i) { return '<option value="' + esc(i[0]) + '"' + (i[0] === cur ? ' selected' : '') + '>' + esc(i[1]) + '</option>'; }).join('') + '</optgroup>' : '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }
  function head(d) { return '<p class="ag-m">' + esc(tx(T.src)) + ': INE · ' + esc(d.edition || '') + ' · CC BY 4.0</p>'; }
  function tab(d) {
    var tabk = STATE.tab, cur = STATE.tid[tabk], t = d.tables.filter(function (x) { return x.id === cur; })[0] || d.tables[0];
    STATE.tid[tabk] = t.id;
    var order = [], groups = {};
    d.tables.forEach(function (x) { var g = x.group || 'x'; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push([x.id, lab(x)]); });
    var opts = order.length > 1 ? order.map(function (g) { return { group: T.grpName[g] ? tx(T.grpName[g]) : g, items: groups[g] }; }) : d.tables.map(function (x) { return [x.id, lab(x)]; });
    var rows = rowsOf(t), key = tabk + '-' + t.id, defSel = rows.slice(0, 2).map(function (r) { return r.id; });
    var inner = block(key, rows, { unit: t.unit, aria: lab(t), sort: rows.length > 12, defSel: defSel });
    var pick = '<div class="ag-pick">' + selectHtml('pt-tab', tx(T.pick), opts, t.id) + '</div>';
    var note = t.note ? '<p class="ag-m">' + esc(tx(T.note)) + ': ' + esc(t.note) + '</p>' : '';
    return '<p class="di-movers-hint">' + esc(tx(T.hint[tabk])) + '</p>' + pick + inner + note + head(d);
  }
  function paint(html) { var b = document.getElementById('pt-body'); if (b) b.innerHTML = html; }
  function render() {
    var tabk = STATE.tab;
    var bar = '<div class="di-tabs-bar" role="tablist">' + TABS.map(function (k) { return '<button type="button" role="tab" class="di-tab-btn' + (k === tabk ? ' active' : '') + '" data-tab="' + k + '" aria-selected="' + (k === tabk) + '">' + esc(tx(T.tabs[k])) + '</button>'; }).join('') + '</div>';
    document.getElementById('pt-root').innerHTML = bar + '<div id="pt-body" role="tabpanel">' + esc(tx(T.loading)) + '</div>';
    load(FILE[tabk]).then(function (d) {
      if (STATE.tab !== tabk) return;
      if (!d || !d.tables) { paint('<p class="ag-m">' + esc(tx(T.fail)) + '</p>'); return; }
      paint(tab(d));
    });
  }
  function repaint() { var f = CACHE[FILE[STATE.tab]]; if (f) f.then(function (d) { if (d) paint(tab(d)); }); }
  var BOUND = false, EMBED = false;
  function init() {
    var sub = document.getElementById('pt-sub'), h1 = document.getElementById('pt-h1');
    function text() { if (h1) h1.textContent = tx(T.h1); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.h1) + ' | Dehesa Index'; var cat = document.getElementById('pt-cat'); if (cat) cat.textContent = tx(T.cat2); }
    text();
    var h = (location.hash || '').replace('#', ''); if (!EMBED && TABS.indexOf(h) >= 0) STATE.tab = h;
    if (BOUND) { render(); return; }
    BOUND = true;
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-tab],[data-k]') : null; if (!b || !document.getElementById('pt-root')) return;
      if (b.getAttribute('data-tab')) { STATE.tab = b.getAttribute('data-tab'); if (!EMBED) { try { history.replaceState(null, '', '#' + STATE.tab); } catch (x) { /* sin history */ } } render(); return; }
      var k = b.getAttribute('data-k'), id = b.getAttribute('data-id'), sel = STATE.sel[k] || [], i = sel.indexOf(id);
      if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } else { sel.push(id); if (sel.length > 4) sel.shift(); }
      STATE.sel[k] = sel; repaint();
    });
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t || t.id !== 'pt-tab' || !document.getElementById('pt-root')) return;
      STATE.tid[STATE.tab] = t.value; repaint();
    });
    global.addEventListener('hashchange', function () { if (EMBED) return; var k = (location.hash || '').replace('#', ''); if (TABS.indexOf(k) >= 0 && k !== STATE.tab) { STATE.tab = k; render(); } });
    if (!EMBED && S.init) S.init('informacion');
    if (!EMBED) S.onLangChange = function () { text(); render(); };
    render();
  }
  global.DIPortugal = { mount: function (el) {
    EMBED = true;
    el.innerHTML = '<section class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.h1)) + '</h2><p class="di-movers-hint">' + esc(tx(T.sub)) + '</p><div id="pt-root"></div><p class="ag-m"><a href="portugal.html">' + esc(tx(T.full)) + '</a></p></section>';
    init();
  } };
  if (document.getElementById('pt-h1')) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init(); }
})(window);
