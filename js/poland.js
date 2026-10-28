/* Dehesa Index — Polonia · ZSRIR: precios de cereales, colza, carne, lácteos, huevos, piensos, fruta y azúcar (poland.html). ES5.
   Datos: data/poland-zsrir/{cereales,colza}.json (scripts/update-pl-zsrir.py), boletines del ZSRIR del Ministerio de Agricultura de Polonia en dane.gov.pl, CC BY 4.0.
   Cada pestaña descarga su fichero solo al abrirse. Un dato ausente se muestra como ausente; nada se estima ni se convierte. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var S = global.DehesaShared || {};
  function lg() { var l = S.getLang ? S.getLang() : 'es'; return IX[l] != null ? l : 'es'; }
  function tx(a) { return a[IX[lg()]]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { return v == null || isNaN(v) ? '—' : (+v).toLocaleString(LOC[lg()], { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 0 : d }); }
  var TABS = ['cereales', 'colza', 'carne', 'lacteos', 'piensos', 'fruta', 'mayorista', 'azucar'];
  var T = {
    h1: L('Polonia · ZSRIR: precios de cereales, colza, carne, lácteos, huevos, piensos, fruta y azúcar', 'Poland · ZSRIR: prices of cereals, rapeseed, meat, dairy, eggs, feed, fruit and sugar', 'Pologne · ZSRIR : prix des céréales, du colza, de la viande, des produits laitiers, des œufs et des aliments du bétail', 'Polonia · ZSRIR: prezzi di cereali, colza, carne, latticini, uova e mangimi'),
    sub: L('Boletines semanales del sistema de información de mercados agrarios del Ministerio de Agricultura de Polonia (ZSRIR), tal como los publica: precio medio de compra en zlotys por tonelada, sin IVA. Se actualizan los jueves.',
           'Weekly bulletins from the Polish Ministry of Agriculture’s agricultural market information system (ZSRIR), as published: average purchase price in zlotys per tonne, excluding VAT. Updated on Thursdays.',
           'Bulletins hebdomadaires du système d’information sur les marchés agricoles du ministère polonais de l’Agriculture (ZSRIR), tels que publiés : prix d’achat moyen en zlotys par tonne, hors TVA. Mis à jour le jeudi.',
           'Bollettini settimanali del sistema informativo sui mercati agricoli del ministero dell’Agricoltura polacco (ZSRIR), come pubblicati: prezzo medio d’acquisto in zloty per tonnellata, IVA esclusa. Aggiornati il giovedì.'),
    tabs: { cereales: L('🌾 Cereales', '🌾 Cereals', '🌾 Céréales', '🌾 Cereali'), colza: L('🌼 Colza', '🌼 Rapeseed', '🌼 Colza', '🌼 Colza'), carne: L('🥩 Carne', '🥩 Meat', '🥩 Viande', '🥩 Carne'), lacteos: L('🥛 Lácteos y huevos', '🥛 Dairy and eggs', '🥛 Produits laitiers et œufs', '🥛 Latte e uova'), piensos: L('🐄 Piensos', '🐄 Feed', '🐄 Aliments du bétail', '🐄 Mangimi'), fruta: L('🍎 Fruta y hortalizas', '🍎 Fruit and vegetables', '🍎 Fruits et légumes', '🍎 Frutta e ortaggi'), mayorista: L('🏪 Mayoristas', '🏪 Wholesale', '🏪 Marchés de gros', '🏪 Ingrosso'), azucar: L('🍬 Azúcar', '🍬 Sugar', '🍬 Sucre', '🍬 Zucchero') },
    loading: L('Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'), fail: L('No se han podido cargar estos datos. Prueba de nuevo en unos minutos.', 'These data could not be loaded. Try again in a few minutes.', 'Ces données n’ont pas pu être chargées. Réessayez dans quelques minutes.', 'Impossibile caricare questi dati. Riprova tra qualche minuto.'),
    pick: L('Tabla', 'Table', 'Tableau', 'Tabella'), full: L('Abrir en página completa', 'Open as a full page', 'Ouvrir en pleine page', 'Apri a pagina intera'),
    hName: L('Serie', 'Series', 'Série', 'Serie'), hLast: L('Último', 'Latest', 'Dernier', 'Ultimo'), hPer: L('Periodo', 'Period', 'Période', 'Periodo'), hChg: L('Variación anual', 'Annual change', 'Variation annuelle', 'Variazione annua'), hFirst: L('Desde el inicio', 'Since the start', 'Depuis le début', 'Dall’inizio'),
    show: L('Pulsa una fila para añadirla o quitarla de la gráfica (hasta 4).', 'Click a row to add or remove it from the chart (up to 4).', 'Cliquez sur une ligne pour l’ajouter ou la retirer du graphique (4 au maximum).', 'Premi una riga per aggiungerla o toglierla dal grafico (fino a 4).'),
    prov: L('(p) provisional', '(p) provisional', '(p) provisoire', '(p) provvisorio'),
    src: L('Fuente', 'Source', 'Source', 'Fonte'), cat2: L('Todas las series de Polonia en el catálogo', 'All Poland series in the catalogue', 'Toutes les séries de la Pologne dans le catalogue', 'Tutte le serie della Polonia nel catalogo'),
    note: L('Nota', 'Note', 'Note', 'Nota'),
    hint: {
      cereales: L('Precio medio de compra de 12 cereales (trigo, centeno, cebada, maíz, avena y triticale; de consumo y forrajeros) en empresas de toda Polonia, mensual desde octubre de 2006, y el trigo de consumo y el maíz semanales desde 2022. La fecha de cada boletín es la que figura dentro de la hoja, no la del título del recurso.',
                  'Average purchase price of 12 cereals (wheat, rye, barley, maize, oats and triticale; food and feed grades) at firms across Poland, monthly since October 2006, plus weekly food wheat and maize since 2022. The date of each bulletin is the one inside the sheet, not the title of the resource.',
                  'Prix d’achat moyen de 12 céréales (blé, seigle, orge, maïs, avoine et triticale ; de consommation et fourragers) auprès des entreprises de toute la Pologne, mensuel depuis octobre 2006, et blé de consommation et maïs hebdomadaires depuis 2022. La date de chaque bulletin est celle qui figure dans la feuille, pas celle du titre de la ressource.',
                  'Prezzo medio d’acquisto di 12 cereali (frumento, segale, orzo, mais, avena e triticale; di consumo e foraggeri) presso le imprese di tutta la Polonia, mensile da ottobre 2006, più frumento di consumo e mais settimanali dal 2022. La data di ogni bollettino è quella dentro il foglio, non quella del titolo della risorsa.'),
      colza: L('Precio medio de compra de la semilla de colza en Polonia, mensual y semanal desde 2022. Cada dato semanal se contrasta con la tabla resumen del propio boletín antes de publicarse.',
               'Average purchase price of rapeseed in Poland, monthly and weekly since 2022. Each weekly value is cross-checked against the bulletin’s own summary table before it is published.',
               'Prix d’achat moyen de la graine de colza en Pologne, mensuel et hebdomadaire depuis 2022. Chaque valeur hebdomadaire est recoupée avec le tableau récapitulatif du bulletin avant publication.',
               'Prezzo medio d’acquisto dei semi di colza in Polonia, mensile e settimanale dal 2022. Ogni valore settimanale è verificato con la tabella riepilogativa del bollettino prima della pubblicazione.')
,
      carne: L('Precio de compra en mataderos de Polonia: cerdo de engorde en peso vivo (semanal y mensual) y canal de clase E, vacuno en canal por categoría y pollo broiler, semanal desde 2022. Cada dato semanal se contrasta con el resumen del propio boletín.',
               'Purchase prices at Polish slaughterhouses: fattening pigs by live weight (weekly and monthly) and class E carcass, beef carcass by category and broiler chicken, weekly since 2022. Each weekly value is cross-checked against the bulletin’s own summary.',
               'Prix d’achat dans les abattoirs polonais : porcs charcutiers en poids vif (hebdomadaire et mensuel) et carcasse de classe E, carcasse de bovins par catégorie et poulet de chair, hebdomadaire depuis 2022. Chaque valeur hebdomadaire est recoupée avec le récapitulatif du bulletin.',
               'Prezzi d’acquisto nei macelli polacchi: suini da ingrasso a peso vivo (settimanale e mensile) e carcassa di classe E, carcassa bovina per categoria e pollo da carne, settimanale dal 2022. Ogni valore settimanale è verificato con il riepilogo del bollettino.'),
      lacteos: L('Leche cruda (compra, mensual desde 2004), mantequilla, leche en polvo y quesos (venta, semanal) y huevos para transformación (compra, semanal). La leche entera en polvo y el Edam empiezan en la semana 49 de 2025 porque antes las hojas históricas del boletín repiten la misma serie en ambas.',
                 'Raw milk (purchase, monthly since 2004), butter, milk powder and cheese (selling, weekly) and eggs for processing (purchase, weekly). Whole milk powder and Edam start in week 49 of 2025 because earlier the bulletin’s historical sheets repeat the same series for both.',
                 'Lait cru (achat, mensuel depuis 2004), beurre, lait en poudre et fromages (vente, hebdomadaire) et œufs de transformation (achat, hebdomadaire). Le lait entier en poudre et l’Edam commencent à la semaine 49 de 2025 car, avant, les feuilles historiques du bulletin répètent la même série pour les deux.',
                 'Latte crudo (acquisto, mensile dal 2004), burro, latte in polvere e formaggi (vendita, settimanale) e uova per la trasformazione (acquisto, settimanale). Il latte intero in polvere e l’Edam iniziano alla settimana 49 del 2025 perché prima i fogli storici del bollettino ripetono la stessa serie per entrambi.'),
      piensos: L('Precio medio de venta de piensos compuestos en toda Polonia: complementarios para bovino y completos para aves y porcino, mensual, últimos diez años. Es el único dato de coste de un insumo físico de Polonia en la web.',
                 'Average selling price of compound feed across Poland: complementary feed for cattle and complete feed for poultry and pigs, monthly, last ten years. It is the only physical input cost for Poland on the site.',
                 'Prix de vente moyen des aliments composés dans toute la Pologne : complémentaires pour bovins et complets pour volailles et porcs, mensuel, dix dernières années. C’est la seule donnée de coût d’intrant physique de la Pologne sur le site.',
                 'Prezzo medio di vendita dei mangimi composti in tutta la Polonia: complementari per bovini e completi per pollame e suini, mensile, ultimi dieci anni. È l’unico dato di costo di un input fisico della Polonia sul sito.')
,
      fruta: L('Precio medio semanal que paga el comercio minorista (cadenas) por manzanas nacionales sueltas (Gala, Jonagold, Ligol, Szampion) y por zanahoria, tomate redondo y patata. El boletín solo trae el último año, así que la serie empieza en septiembre de 2025 y crece cada semana. Las filas con la fecha mal escrita en la hoja se omiten.',
               'Average weekly price paid by retailers (supermarket chains) for loose Polish apples (Gala, Jonagold, Ligol, Szampion) and for carrots, round tomatoes and potatoes. The bulletin only carries the last year, so the series starts in September 2025 and grows every week. Rows with a misspelled date in the sheet are skipped.',
               'Prix moyen hebdomadaire payé par le commerce de détail (chaînes) pour les pommes polonaises en vrac (Gala, Jonagold, Ligol, Szampion) et pour les carottes, tomates rondes et pommes de terre. Le bulletin ne couvre que la dernière année : la série commence en septembre 2025 et s’allonge chaque semaine. Les lignes dont la date est mal saisie dans la feuille sont ignorées.',
               'Prezzo medio settimanale pagato dal commercio al dettaglio (catene) per mele polacche sfuse (Gala, Jonagold, Ligol, Szampion) e per carote, pomodori tondi e patate. Il bollettino contiene solo l’ultimo anno: la serie parte da settembre 2025 e cresce ogni settimana. Le righe con la data scritta male nel foglio vengono saltate.'),
      mayorista: L('Precio mayorista medio de siete hortalizas (zanahoria, patata, cebolla, repollo, remolacha, tomate, pimiento rojo) y de la pera, en PLN/kg: media de los cinco mercados mayoristas (Bronisze, Gdańsk, Łódź, Poznań, Rzeszów), punto medio entre el precio mínimo y el máximo. Cada boletín trae dos fechas y se han reunido todos desde noviembre de 2025. No se publica la manzana mayorista porque su media semanal se repite demasiado para fiarse.',
                   'Average wholesale price of seven vegetables (carrots, potatoes, onions, cabbage, beetroot, tomatoes, red peppers) and of pears, in PLN/kg: mean of the five wholesale markets (Bronisze, Gdańsk, Łódź, Poznań, Rzeszów), midpoint between the minimum and maximum price. Each bulletin carries two dates and all of them since November 2025 have been combined. Wholesale apples are not published because their weekly average repeats too often to be trusted.',
                   'Prix de gros moyen de sept légumes (carottes, pommes de terre, oignons, chou, betteraves, tomates, poivrons rouges) et des poires, en PLN/kg : moyenne des cinq marchés de gros (Bronisze, Gdańsk, Łódź, Poznań, Rzeszów), milieu entre le prix minimum et le prix maximum. Chaque bulletin contient deux dates et tous ceux depuis novembre 2025 ont été réunis. Les pommes de gros ne sont pas publiées : leur moyenne hebdomadaire se répète trop pour être fiable.',
                   'Prezzo medio all’ingrosso di sette ortaggi (carote, patate, cipolle, cavolo, barbabietole, pomodori, peperoni rossi) e delle pere, in PLN/kg: media dei cinque mercati all’ingrosso (Bronisze, Gdańsk, Łódź, Poznań, Rzeszów), punto medio tra prezzo minimo e massimo. Ogni bollettino contiene due date e sono stati riuniti tutti quelli da novembre 2025. Le mele all’ingrosso non sono pubblicate: la loro media settimanale si ripete troppo per essere affidabile.'),
      azucar: L('Precio mensual del azúcar blanco desde 2022: venta al mercado interior, compra de la industria de transformación y compra del comercio minorista. Se publica con unos dos meses de retraso.',
                'Monthly price of white sugar since 2022: domestic sales, purchases by the food-processing industry and purchases by retailers. Published with a lag of about two months.',
                'Prix mensuel du sucre blanc depuis 2022 : ventes intérieures, achats de l’industrie de transformation et achats du commerce de détail. Publié avec environ deux mois de décalage.',
                'Prezzo mensile dello zucchero bianco dal 2022: vendite interne, acquisti dell’industria di trasformazione e acquisti del commercio al dettaglio. Pubblicato con circa due mesi di ritardo.')
    },
    grpName: { cereales: L('Cereales', 'Cereals', 'Céréales', 'Cereali'), colza: L('Colza', 'Rapeseed', 'Colza', 'Colza'), carne: L('Carne', 'Meat', 'Viande', 'Carne'), lacteos: L('Leche y lácteos', 'Milk and dairy', 'Lait et produits laitiers', 'Latte e latticini'), huevos: L('Huevos', 'Eggs', 'Œufs', 'Uova'), piensos: L('Piensos', 'Feed', 'Aliments du bétail', 'Mangimi'), fruta: L('Fruta', 'Fruit', 'Fruits', 'Frutta'), hortalizas: L('Hortalizas', 'Vegetables', 'Légumes', 'Ortaggi'), azucar: L('Azúcar', 'Sugar', 'Sucre', 'Zucchero') }
  };
  var FILE = { cereales: 'cereales.json', colza: 'colza.json', carne: 'carne.json', lacteos: 'lacteos.json', piensos: 'piensos.json', fruta: 'fruta.json', mayorista: 'mayorista.json', azucar: 'azucar.json' };
  var CACHE = {}, STATE = { tab: 'cereales', sel: {}, tid: {} }, BASE = 'data/poland-zsrir/', COLORS = ['#1d5178', '#a9491f', '#2e7d5b', '#7a4a8c'];
  function load(f) { if (CACHE[f]) return CACHE[f]; return CACHE[f] = fetch(BASE + f, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function tsOf(p) { var y = +p.slice(0, 4), m = 1, c = p.charAt(5); if (p.charAt(5) === 'W') { var j4 = new Date(Date.UTC(y, 0, 4)), mon = j4.getTime() - ((j4.getUTCDay() + 6) % 7) * 864e5; return mon + (+p.slice(6) - 1) * 7 * 864e5 + 6 * 864e5; } if (p.charAt(4) === '-') { if (c === 'Q') m = (+p.slice(6) - 1) * 3 + 1; else if (c === 'S') m = (+p.slice(6) - 1) * 6 + 1; else m = +p.slice(5, 7); } return Date.UTC(y, m - 1, 1); }
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
  function decOf(rows, unit) { return /índice|%|€\/kg|t\/ha|kg\/hab|kg\/ha|l\/hab/.test(unit || '') || rows.every(function (r) { return Math.abs(r.last) < 100; }) ? 2 : 0; }
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
  function head(d) { return '<p class="ag-m">' + esc(tx(T.src)) + ': ZSRIR (MRiRW) · dane.gov.pl · ' + esc(d.edition || '') + ' · CC BY 4.0</p>'; }
  function tab(d) {
    var tabk = STATE.tab, cur = STATE.tid[tabk], t = d.tables.filter(function (x) { return x.id === cur; })[0] || d.tables[0];
    STATE.tid[tabk] = t.id;
    var order = [], groups = {};
    d.tables.forEach(function (x) { var g = x.group || 'x'; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push([x.id, lab(x)]); });
    var opts = order.length > 1 ? order.map(function (g) { return { group: T.grpName[g] ? tx(T.grpName[g]) : g, items: groups[g] }; }) : d.tables.map(function (x) { return [x.id, lab(x)]; });
    var rows = rowsOf(t), key = tabk + '-' + t.id, defSel = rows.slice(0, 2).map(function (r) { return r.id; });
    var inner = block(key, rows, { unit: t.unit, aria: lab(t), sort: rows.length > 12, defSel: defSel });
    var pick = '<div class="ag-pick">' + selectHtml('pl-tab', tx(T.pick), opts, t.id) + '</div>';
    var note = t.note ? '<p class="ag-m">' + esc(tx(T.note)) + ': ' + esc(t.note) + '</p>' : '';
    return '<p class="di-movers-hint">' + esc(tx(T.hint[tabk])) + '</p>' + pick + inner + note + head(d);
  }
  function paint(html) { var b = document.getElementById('pl-body'); if (b) b.innerHTML = html; }
  function render() {
    var tabk = STATE.tab;
    var bar = '<div class="di-tabs-bar" role="tablist">' + TABS.map(function (k) { return '<button type="button" role="tab" class="di-tab-btn' + (k === tabk ? ' active' : '') + '" data-tab="' + k + '" aria-selected="' + (k === tabk) + '">' + esc(tx(T.tabs[k])) + '</button>'; }).join('') + '</div>';
    document.getElementById('pl-root').innerHTML = bar + '<div id="pl-body" role="tabpanel">' + esc(tx(T.loading)) + '</div>';
    load(FILE[tabk]).then(function (d) {
      if (STATE.tab !== tabk) return;
      if (!d || !d.tables) { paint('<p class="ag-m">' + esc(tx(T.fail)) + '</p>'); return; }
      paint(tab(d));
    });
  }
  function repaint() { var f = CACHE[FILE[STATE.tab]]; if (f) f.then(function (d) { if (d) paint(tab(d)); }); }
  var BOUND = false, EMBED = false;
  function init() {
    var sub = document.getElementById('pl-sub'), h1 = document.getElementById('pl-h1');
    function text() { if (h1) h1.textContent = tx(T.h1); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.h1) + ' | Dehesa Index'; var cat = document.getElementById('pl-cat'); if (cat) cat.textContent = tx(T.cat2); }
    text();
    var h = (location.hash || '').replace('#', ''); if (!EMBED && TABS.indexOf(h) >= 0) STATE.tab = h;
    if (BOUND) { render(); return; }
    BOUND = true;
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-tab],[data-k]') : null; if (!b || !document.getElementById('pl-root')) return;
      if (b.getAttribute('data-tab')) { STATE.tab = b.getAttribute('data-tab'); if (!EMBED) { try { history.replaceState(null, '', '#' + STATE.tab); } catch (x) { /* sin history */ } } render(); return; }
      var k = b.getAttribute('data-k'), id = b.getAttribute('data-id'), sel = STATE.sel[k] || [], i = sel.indexOf(id);
      if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } else { sel.push(id); if (sel.length > 4) sel.shift(); }
      STATE.sel[k] = sel; repaint();
    });
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t || t.id !== 'pl-tab' || !document.getElementById('pl-root')) return;
      STATE.tid[STATE.tab] = t.value; repaint();
    });
    global.addEventListener('hashchange', function () { if (EMBED) return; var k = (location.hash || '').replace('#', ''); if (TABS.indexOf(k) >= 0 && k !== STATE.tab) { STATE.tab = k; render(); } });
    if (!EMBED && S.init) S.init('informacion');
    if (!EMBED) S.onLangChange = function () { text(); render(); };
    render();
  }
  global.DIPoland = { mount: function (el) {
    EMBED = true;
    el.innerHTML = '<section class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.h1)) + '</h2><p class="di-movers-hint">' + esc(tx(T.sub)) + '</p><div id="pl-root"></div><p class="ag-m"><a href="poland.html">' + esc(tx(T.full)) + '</a></p></section>';
    init();
  } };
  if (document.getElementById('pl-h1')) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init(); }
})(window);
