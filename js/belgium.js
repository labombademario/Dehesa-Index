/* Dehesa Index — Bélgica · Statbel: censo ganadero y superficies, cosecha, IPC de alimentos, pesca, lácteos y balances de carne (belgium.html). ES5.
   Datos: data/belgium-more/{ganado,cosecha,ipc,pesca,lacteos,carne}.json (scripts/update-belgium-more.py), Statbel, CC BY 4.0.
   Cada pestaña descarga su fichero solo al abrirse. Un dato ausente se muestra como ausente; el precio de lonja es valor/cantidad (derivado). */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var S = global.DehesaShared || {};
  function lg() { var l = S.getLang ? S.getLang() : 'es'; return IX[l] != null ? l : 'es'; }
  function tx(a) { return a[IX[lg()]]; }
  var NTR = {"Número de cabezas en la encuesta de mayo (censo agrario). El último año es un avance provisional de Statbel cuando ya hay datos del año en curso.": ["Número de cabezas en la encuesta de mayo (censo agrario). El último año es un avance provisional de Statbel cuando ya hay datos del año en curso.", "Number of head in the May survey (agricultural census). The latest year is a provisional Statbel estimate when data for the current year are already available.", "Nombre de têtes lors de l’enquête de mai (recensement agricole). La dernière année est une estimation provisoire de Statbel lorsque les données de l’année en cours sont déjà disponibles.", "Numero di capi nell’indagine di maggio (censimento agricolo). L’ultimo anno è una stima provvisoria di Statbel quando sono già disponibili i dati dell’anno in corso."], "Superficie en hectáreas (el Excel de Statbel las da en áreas: 1 ha = 100 áreas). El último año es un avance provisional cuando ya hay datos del año en curso.": ["Superficie en hectáreas (el Excel de Statbel las da en áreas: 1 ha = 100 áreas). El último año es un avance provisional cuando ya hay datos del año en curso.", "Area in hectares (the Statbel Excel gives it in ares: 1 ha = 100 ares). The latest year is a provisional estimate when data for the current year are already available.", "Superficie en hectares (le fichier Excel de Statbel la donne en ares : 1 ha = 100 ares). La dernière année est une estimation provisoire lorsque les données de l’année en cours sont déjà disponibles.", "Superficie in ettari (l’Excel di Statbel la riporta in are: 1 ha = 100 are). L’ultimo anno è una stima provvisoria quando sono già disponibili i dati dell’anno in corso."], "Explotaciones con producción agraria en la encuesta de mayo.": ["Explotaciones con producción agraria en la encuesta de mayo.", "Farms with agricultural production in the May survey.", "Exploitations avec production agricole lors de l’enquête de mai.", "Aziende con produzione agricola nell’indagine di maggio."], "Número de explotaciones por clase de superficie agrícola, Bélgica.": ["Número de explotaciones por clase de superficie agrícola, Bélgica.", "Number of farms by agricultural area class, Belgium.", "Nombre d’exploitations par classe de surface agricole, Belgique.", "Numero di aziende per classe di superficie agricola, Belgio."], "Precio medio mensual de compra de grano en empresas (ZSRIR); sin IVA": ["Precio medio mensual de compra de grano en empresas (ZSRIR); sin IVA", "Monthly average purchase price of grain at companies (ZSRIR); excluding VAT", "Prix d’achat moyen mensuel des grains auprès des entreprises (ZSRIR) ; hors TVA", "Prezzo medio mensile d’acquisto dei cereali presso le imprese (ZSRIR); IVA esclusa"], "Precio medio semanal de compra, semana de lunes a domingo (ZSRIR)": ["Precio medio semanal de compra, semana de lunes a domingo (ZSRIR)", "Weekly average purchase price, Monday-to-Sunday week (ZSRIR)", "Prix d’achat moyen hebdomadaire, semaine du lundi au dimanche (ZSRIR)", "Prezzo medio settimanale d’acquisto, settimana da lunedì a domenica (ZSRIR)"], "Precio medio de la pesca descargada en lonjas y puertos de Portugal (valor dividido por cantidad, tal como lo publican DGRM y el INE), por puerto, isla o región.": ["Precio medio de la pesca descargada en lonjas y puertos de Portugal (valor dividido por cantidad, tal como lo publican DGRM y el INE), por puerto, isla o región.", "Average price of the catch landed at Portuguese fish markets and ports (value divided by quantity, as published by DGRM and INE), by port, island or region.", "Prix moyen de la pêche débarquée dans les criées et ports du Portugal (valeur divisée par la quantité, tel que publié par la DGRM et l’INE), par port, île ou région.", "Prezzo medio del pescato sbarcato nei mercati ittici e nei porti del Portogallo (valore diviso per quantità, come pubblicato da DGRM e INE), per porto, isola o regione."]};
  function nn(x) { var a = NTR[x]; return a ? a[IX[lg()]] : x; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { return v == null || isNaN(v) ? '—' : (+v).toLocaleString(LOC[lg()], { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 0 : d }); }
  var TABS = ['ganado', 'cosecha', 'ipc', 'pesca', 'lacteos', 'carne'];
  var T = {
    h1: L('Bélgica · Statbel: ganado, cosecha, precios al consumo, pesca, lácteos y carne', 'Belgium · Statbel: livestock, harvest, consumer prices, fishing, dairy and meat', 'Belgique · Statbel : cheptel, récolte, prix à la consommation, pêche, laitier et viande', 'Belgio · Statbel: bestiame, raccolto, prezzi al consumo, pesca, latte e carne'),
    sub: L('Seis conjuntos de la oficina estadística belga (Statbel), tal como los publica: censo ganadero y de superficies por región y provincia, cosecha definitiva por cultivo, IPC de alimentos, desembarques de pesca con su precio de lonja, productos lácteos y balances de abastecimiento de carne.',
           'Six datasets from the Belgian statistical office (Statbel), as published: livestock and land census by region and province, final harvest by crop, food CPI, fish landings with their auction price, dairy products and meat supply balances.',
           'Six jeux de données de l’office statistique belge (Statbel), tels que publiés : recensement du cheptel et des superficies par région et province, récolte définitive par culture, IPC alimentaire, débarquements de pêche avec leur prix à la criée, produits laitiers et bilans d’approvisionnement en viande.',
           'Sei insiemi dell’ufficio statistico belga (Statbel), come pubblicati: censimento di bestiame e superfici per regione e provincia, raccolto definitivo per coltura, IPC alimentare, sbarchi di pesca con il prezzo all’asta, prodotti lattiero-caseari e bilanci di approvvigionamento della carne.'),
    tabs: { ganado: L('🐄 Ganado y superficies', '🐄 Livestock and land', '🐄 Cheptel et superficies', '🐄 Bestiame e superfici'), cosecha: L('🌾 Cosecha', '🌾 Harvest', '🌾 Récolte', '🌾 Raccolto'), ipc: L('🛒 IPC alimentos', '🛒 Food CPI', '🛒 IPC alimentaire', '🛒 IPC alimentare'),
            pesca: L('🐟 Pesca', '🐟 Fishing', '🐟 Pêche', '🐟 Pesca'), lacteos: L('🥛 Lácteos', '🥛 Dairy', '🥛 Laitier', '🥛 Latte e derivati'), carne: L('🥩 Carne', '🥩 Meat', '🥩 Viande', '🥩 Carne') },
    loading: L('Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'), fail: L('No se han podido cargar estos datos. Prueba de nuevo en unos minutos.', 'These data could not be loaded. Try again in a few minutes.', 'Ces données n’ont pas pu être chargées. Réessayez dans quelques minutes.', 'Impossibile caricare questi dati. Riprova tra qualche minuto.'),
    pick: L('Tabla', 'Table', 'Tableau', 'Tabella'), full: L('Abrir en página completa', 'Open as a full page', 'Ouvrir en pleine page', 'Apri a pagina intera'),
    hName: L('Serie', 'Series', 'Série', 'Serie'), hLast: L('Último', 'Latest', 'Dernier', 'Ultimo'), hPer: L('Periodo', 'Period', 'Période', 'Periodo'), hChg: L('Variación anual', 'Annual change', 'Variation annuelle', 'Variazione annua'), hFirst: L('Desde el inicio', 'Since the start', 'Depuis le début', 'Dall’inizio'),
    show: L('Pulsa una fila para añadirla o quitarla de la gráfica (hasta 4).', 'Click a row to add or remove it from the chart (up to 4).', 'Cliquez sur une ligne pour l’ajouter ou la retirer du graphique (4 au maximum).', 'Clicca una riga per aggiungerla o toglierla dal grafico (massimo 4).'),
    prov: L('(p) provisional', '(p) provisional', '(p) provisoire', '(p) provvisorio'),
    src: L('Fuente', 'Source', 'Source', 'Fonte'), cat2: L('Todas las series de Statbel en el catálogo', 'All Statbel series in the catalogue', 'Toutes les séries de Statbel dans le catalogue', 'Tutte le serie di Statbel nel catalogo'),
    note: L('Nota', 'Note', 'Note', 'Nota'),
    hint: {
      ganado: L('Resultados de la encuesta agraria de mayo: cabezas de ganado, superficie de cada cultivo y número de explotaciones en Bélgica, Flandes, Valonia y sus diez provincias. El último año puede ser un avance provisional (p) que Statbel publica antes que el censo definitivo. Es la única fuente belga con cabezas de ganado.',
                'Results of the May farm survey: head of livestock, area of each crop and number of farms for Belgium, Flanders, Wallonia and their ten provinces. The latest year can be a provisional (p) advance that Statbel publishes before the final census. It is the only Belgian source with livestock numbers.',
                'Résultats de l’enquête agricole de mai : effectifs du cheptel, superficie de chaque culture et nombre d’exploitations pour la Belgique, la Flandre, la Wallonie et leurs dix provinces. La dernière année peut être une estimation provisoire (p) publiée avant le recensement définitif. C’est la seule source belge avec les effectifs du cheptel.',
                'Risultati dell’indagine agricola di maggio: capi di bestiame, superficie di ogni coltura e numero di aziende per Belgio, Fiandre, Vallonia e le loro dieci province. L’ultimo anno può essere una stima provvisoria (p) che Statbel pubblica prima del censimento definitivo. È l’unica fonte belga con i capi di bestiame.'),
      cosecha: L('Estimación definitiva de la cosecha: producción en toneladas, rendimiento en toneladas por hectárea y superficie cosechada de cada cultivo. Bélgica tiene cinco años de producción y rendimiento; Flandes, Valonia y Bruselas, los dos últimos años publicados con nombres comparables.',
                 'Final harvest estimate: production in tonnes, yield in tonnes per hectare and harvested area of each crop. Belgium has five years of production and yield; Flanders, Wallonia and Brussels, the latest two years published with comparable names.',
                 'Estimation définitive de la récolte : production en tonnes, rendement en tonnes par hectare et superficie récoltée de chaque culture. La Belgique a cinq ans de production et de rendement ; la Flandre, la Wallonie et Bruxelles, les deux dernières années publiées avec des noms comparables.',
                 'Stima definitiva del raccolto: produzione in tonnellate, resa in tonnellate per ettaro e superficie raccolta di ogni coltura. Il Belgio ha cinque anni di produzione e resa; Fiandre, Vallonia e Bruxelles, gli ultimi due anni pubblicati con nomi confrontabili.'),
      ipc: L('Índice de precios al consumo de Bélgica por grupo de producto (clasificación COICOP), mensual desde 2006, base 2025 = 100. Sirve para ver cuánto del precio del supermercado se debe a cada familia: carne, lácteos, pan, fruta, hortalizas, aceites.',
             'Belgian consumer price index by product group (COICOP classification), monthly since 2006, base 2025 = 100. It shows how much of the supermarket price comes from each family: meat, dairy, bread, fruit, vegetables, oils.',
             'Indice des prix à la consommation belge par groupe de produits (classification COICOP), mensuel depuis 2006, base 2025 = 100. Il montre ce qui, dans le prix au supermarché, vient de chaque famille : viande, produits laitiers, pain, fruits, légumes, huiles.',
             'Indice dei prezzi al consumo belga per gruppo di prodotti (classificazione COICOP), mensile dal 2006, base 2025 = 100. Mostra quanta parte del prezzo al supermercato dipende da ogni famiglia: carne, latticini, pane, frutta, ortaggi, oli.'),
      pesca: L('Desembarques de la flota belga en Ostende, Zeebrugge y Nieuwpoort: toneladas, miles de euros y precio medio de lonja por especie. El precio es una división (valor entre cantidad) hecha aquí; Statbel no publica cotizaciones.',
               'Landings of the Belgian fleet at Ostend, Zeebrugge and Nieuwpoort: tonnes, thousand euros and average auction price by species. The price is a division (value over quantity) done here; Statbel does not publish quotations.',
               'Débarquements de la flotte belge à Ostende, Zeebrugge et Nieuport : tonnes, milliers d’euros et prix moyen à la criée par espèce. Le prix est une division (valeur sur quantité) faite ici ; Statbel ne publie pas de cotations.',
               'Sbarchi della flotta belga a Ostenda, Zeebrugge e Nieuwpoort: tonnellate, migliaia di euro e prezzo medio all’asta per specie. Il prezzo è una divisione (valore su quantità) fatta qui; Statbel non pubblica quotazioni.'),
      lacteos: L('Producción de las industrias lácteas belgas por producto: leche de consumo, nata, yogur, mantequilla, leche en polvo y quesos, mensual y anual. La recogida de leche en granja está en el catálogo de Bélgica.',
                 'Output of Belgian dairies by product: drinking milk, cream, yoghurt, butter, milk powder and cheese, monthly and yearly. Farm milk collection is in the Belgium catalogue.',
                 'Production des laiteries belges par produit : lait de consommation, crème, yaourt, beurre, lait en poudre et fromages, mensuelle et annuelle. La collecte de lait à la ferme figure dans le catalogue de la Belgique.',
                 'Produzione dei caseifici belgi per prodotto: latte alimentare, panna, yogurt, burro, latte in polvere e formaggi, mensile e annuale. La raccolta del latte in azienda è nel catalogo del Belgio.'),
      carne: L('Balance de abastecimiento de cada carne: producción, comercio exterior, consumo aparente por habitante y autoabastecimiento (por encima del 100 % significa que Bélgica produce más de lo que consume).',
               'Supply balance of each meat: production, foreign trade, apparent consumption per head and self-sufficiency (above 100 % means Belgium produces more than it consumes).',
               'Bilan d’approvisionnement de chaque viande : production, commerce extérieur, consommation apparente par habitant et autoapprovisionnement (au-dessus de 100 % la Belgique produit plus qu’elle ne consomme).',
               'Bilancio di approvvigionamento di ogni carne: produzione, commercio estero, consumo apparente pro capite e autoapprovvigionamento (sopra il 100 % il Belgio produce più di quanto consuma).')
    },
    grpName: {
      ganado: L('Ganado (cabezas)', 'Livestock (head)', 'Cheptel (têtes)', 'Bestiame (capi)'), superficies: L('Superficies (ha)', 'Land (ha)', 'Superficies (ha)', 'Superfici (ha)'), explotaciones: L('Explotaciones', 'Farms', 'Exploitations', 'Aziende'),
      cosecha: L('Bélgica', 'Belgium', 'Belgique', 'Belgio'), 'cosecha-region': L('Regiones', 'Regions', 'Régions', 'Regioni'), ipc: L('Precios al consumo', 'Consumer prices', 'Prix à la consommation', 'Prezzi al consumo'),
      pesca: L('Pesca marítima', 'Sea fishing', 'Pêche maritime', 'Pesca marittima'), lacteos: L('Lácteos', 'Dairy', 'Laitier', 'Latte e derivati'), carne: L('Carne', 'Meat', 'Viande', 'Carne')
    }
  };
  var FILE = { ganado: 'ganado.json', cosecha: 'cosecha.json', ipc: 'ipc.json', pesca: 'pesca.json', lacteos: 'lacteos.json', carne: 'carne.json' };
  var CACHE = {}, STATE = { tab: 'ganado', sel: {}, tid: {} }, BASE = 'data/belgium-more/', COLORS = ['#1d5178', '#a9491f', '#2e7d5b', '#7a4a8c'];
  function load(f) { if (CACHE[f]) return CACHE[f]; return CACHE[f] = fetch(BASE + f, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function tsOf(p) { var y = +p.slice(0, 4), m = p.length > 4 ? +p.slice(5, 7) : 1; return Date.UTC(y, m - 1, 1); }
  function pc(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }
  function chg(v) { if (v == null) return '<span class="ag-m">—</span>'; var up = v > 0.049, dn = v < -0.049; return '<span class="ag-chg ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲ +' : dn ? '▼ −' : '■ ') + nf(Math.abs(v), 1) + ' %</span>'; }
  function lab(o) { var l = lg(); return l === 'es' || !o.l ? o.label : (o.l[l] || o.label); }
  function rowsOf(t) {
    return t.series.map(function (s) {
      var p = s.points, n = p.length, lastP = p[n - 1], per = lastP[0], ann = per.length === 4, y1 = (+per.slice(0, 4) - 1) + per.slice(4), prev = null;
      p.forEach(function (x) { if (x[0] === y1) prev = x[1]; });
      return { id: s.id, label: lab(s), nl: s.orig, points: p, last: lastP[1], per: per, prov: s.provisional, chg: pc(lastP[1], prev), chgFirst: n > 1 ? pc(lastP[1], p[0][1]) : null, ann: ann };
    });
  }
  function decOf(rows, unit) { return /índice|%|€\/kg|t\/ha|kg\/hab/.test(unit || '') || rows.every(function (r) { return Math.abs(r.last) < 100; }) ? 1 : 0; }
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
  function head(d) { return '<p class="ag-m">' + esc(tx(T.src)) + ': Statbel · ' + esc(d.edition || '') + ' · CC BY 4.0</p>'; }
  function tab(d) {
    var tabk = STATE.tab, cur = STATE.tid[tabk], t = d.tables.filter(function (x) { return x.id === cur; })[0] || d.tables[0];
    STATE.tid[tabk] = t.id;
    var order = [], groups = {};
    d.tables.forEach(function (x) { var g = x.group || 'x'; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push([x.id, lab(x)]); });
    var opts = order.length > 1 ? order.map(function (g) { return { group: T.grpName[g] ? tx(T.grpName[g]) : g, items: groups[g] }; }) : d.tables.map(function (x) { return [x.id, lab(x)]; });
    var rows = rowsOf(t), key = tabk + '-' + t.id, defSel = rows.slice(0, 2).map(function (r) { return r.id; });
    var inner = block(key, rows, { unit: t.unit, aria: lab(t), sort: rows.length > 12, defSel: defSel });
    var pick = '<div class="ag-pick">' + selectHtml('be-tab', tx(T.pick), opts, t.id) + '</div>';
    var note = t.note ? '<p class="ag-m">' + esc(tx(T.note)) + ': ' + esc(nn(t.note)) + '</p>' : '';
    return '<p class="di-movers-hint">' + esc(tx(T.hint[tabk])) + '</p>' + pick + inner + note + head(d);
  }
  function paint(html) { var b = document.getElementById('be-body'); if (b) b.innerHTML = html; }
  function render() {
    var tabk = STATE.tab;
    var bar = '<div class="di-tabs-bar" role="tablist">' + TABS.map(function (k) { return '<button type="button" role="tab" class="di-tab-btn' + (k === tabk ? ' active' : '') + '" data-tab="' + k + '" aria-selected="' + (k === tabk) + '">' + esc(tx(T.tabs[k])) + '</button>'; }).join('') + '</div>';
    document.getElementById('be-root').innerHTML = bar + '<div id="be-body" role="tabpanel">' + esc(tx(T.loading)) + '</div>';
    load(FILE[tabk]).then(function (d) {
      if (STATE.tab !== tabk) return;
      if (!d || !d.tables) { paint('<p class="ag-m">' + esc(tx(T.fail)) + '</p>'); return; }
      paint(tab(d));
    });
  }
  function repaint() { var f = CACHE[FILE[STATE.tab]]; if (f) f.then(function (d) { if (d) paint(tab(d)); }); }
  var BOUND = false, EMBED = false;
  function init() {
    var sub = document.getElementById('be-sub'), h1 = document.getElementById('be-h1');
    function text() { if (h1) h1.textContent = tx(T.h1); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.h1) + ' | Dehesa Index'; var cat = document.getElementById('be-cat'); if (cat) cat.textContent = tx(T.cat2); }
    text();
    var h = (location.hash || '').replace('#', ''); if (!EMBED && TABS.indexOf(h) >= 0) STATE.tab = h;
    if (BOUND) { render(); return; }
    BOUND = true;
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-tab],[data-k]') : null; if (!b || !document.getElementById('be-root')) return;
      if (b.getAttribute('data-tab')) { STATE.tab = b.getAttribute('data-tab'); if (!EMBED) { try { history.replaceState(null, '', '#' + STATE.tab); } catch (x) { /* sin history */ } } render(); return; }
      var k = b.getAttribute('data-k'), id = b.getAttribute('data-id'), sel = STATE.sel[k] || [], i = sel.indexOf(id);
      if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } else { sel.push(id); if (sel.length > 4) sel.shift(); }
      STATE.sel[k] = sel; repaint();
    });
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t || t.id !== 'be-tab' || !document.getElementById('be-root')) return;
      STATE.tid[STATE.tab] = t.value; repaint();
    });
    global.addEventListener('hashchange', function () { if (EMBED) return; var k = (location.hash || '').replace('#', ''); if (TABS.indexOf(k) >= 0 && k !== STATE.tab) { STATE.tab = k; render(); } });
    if (!EMBED && S.init) S.init('informacion');
    if (!EMBED) S.onLangChange = function () { text(); render(); };
    render();
  }
  global.DIBelgium = { mount: function (el) {
    EMBED = true;
    el.innerHTML = '<section class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.h1)) + '</h2><p class="di-movers-hint">' + esc(tx(T.sub)) + '</p><div id="be-root"></div><p class="ag-m"><a href="belgium.html">' + esc(tx(T.full)) + '</a></p></section>';
    init();
  } };
  if (document.getElementById('be-h1')) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init(); }
})(window);
