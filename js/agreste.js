/* Dehesa Index — Francia · Agreste: empleo agrícola, uso del suelo, insumos (IPAMPA) y vendimia (agreste.html). ES5.
   Datos: data/france-agreste-more/{empleo,teruti,ipampa-fr,ipampa-regiones,vinconj}.json (scripts/update-fr-agreste-more.py), Agreste (SSP), Licence Ouverte.
   Cada pestaña descarga su fichero solo al abrirse. Los nombres de territorios, orientaciones (OTEX) y productos se muestran como los publica Agreste. Un dato ausente se muestra como ausente. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var S = global.DehesaShared || {};
  function lg() { var l = S.getLang ? S.getLang() : 'es'; return IX[l] != null ? l : 'es'; }
  function tx(a) { return a[IX[lg()]]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { return v == null || isNaN(v) ? '—' : (+v).toLocaleString(LOC[lg()], { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 0 : d }); }
  var T = {
    h1: L('Francia · Agreste: empleo, suelo, insumos y vendimia', 'France · Agreste: jobs, land use, inputs and wine harvest', 'France · Agreste : emploi, sols, intrants et vendanges', 'Francia · Agreste: lavoro, suolo, input e vendemmia'),
    sub: L('Cuatro conjuntos del servicio de estadística del Ministerio de Agricultura de Francia (Agreste/SSP), tal como los publica. Las series de precios, cuentas y comercio de Agreste están en el catálogo.', 'Four datasets from the French Ministry of Agriculture statistics service (Agreste/SSP), as published. Agreste price, accounts and trade series are in the catalogue.', 'Quatre jeux de données du service statistique du ministère de l’Agriculture (Agreste/SSP), tels que publiés. Les séries de prix, comptes et commerce d’Agreste sont dans le catalogue.', 'Quattro insiemi di dati del servizio statistico del Ministero dell’Agricoltura francese (Agreste/SSP), come pubblicati. Le serie di prezzi, conti e commercio di Agreste sono nel catalogo.'),
    tabs: { empleo: L('👷 Empleo', '👷 Jobs', '👷 Emploi', '👷 Lavoro'), suelo: L('🗺️ Uso del suelo', '🗺️ Land use', '🗺️ Occupation des sols', '🗺️ Uso del suolo'), insumos: L('🧪 Insumos (IPAMPA)', '🧪 Inputs (IPAMPA)', '🧪 Intrants (IPAMPA)', '🧪 Input (IPAMPA)'), vendimia: L('🍇 Vendimia', '🍇 Wine harvest', '🍇 Vendanges', '🍇 Vendemmia') },
    loading: L('Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'), fail: L('No se han podido cargar estos datos. Prueba de nuevo en unos minutos.', 'These data could not be loaded. Try again in a few minutes.', 'Ces données n’ont pas pu être chargées. Réessayez dans quelques minutes.', 'Impossibile caricare questi dati. Riprova tra qualche minuto.'),
    pick: L('Tabla', 'Table', 'Tableau', 'Tabella'), prod: L('Producto', 'Product', 'Produit', 'Prodotto'), cat: L('Categoría', 'Category', 'Catégorie', 'Categoria'), terr: L('Territorio', 'Territory', 'Territoire', 'Territorio'),
    full: L('Abrir en página completa', 'Open as a full page', 'Ouvrir en pleine page', 'Apri a pagina intera'),
    yoy: L('Variación sobre el mismo mes del año anterior', 'Change on the same month a year earlier', 'Variation sur le même mois un an plus tôt', 'Variazione sullo stesso mese di un anno prima'),
    hName: L('Serie', 'Series', 'Série', 'Serie'), hLast: L('Último', 'Latest', 'Dernier', 'Ultimo'), hPer: L('Periodo', 'Period', 'Période', 'Periodo'), hChg: L('Variación', 'Change', 'Variation', 'Variazione'), hFirst: L('Desde el inicio', 'Since the start', 'Depuis le début', 'Dall’inizio'),
    show: L('Pulsa una fila para añadirla o quitarla de la gráfica (hasta 4).', 'Click a row to add or remove it from the chart (up to 4).', 'Cliquez sur une ligne pour l’ajouter ou la retirer du graphique (4 au maximum).', 'Clicca una riga per aggiungerla o toglierla dal grafico (massimo 4).'),
    prov: L('(p) provisional', '(p) provisional', '(p) provisoire', '(p) provvisorio'),
    src: L('Fuente', 'Source', 'Source', 'Fonte'), lic: L('Licence Ouverte 2.0 (Etalab)', 'Licence Ouverte 2.0 (Etalab)', 'Licence Ouverte 2.0 (Etalab)', 'Licence Ouverte 2.0 (Etalab)'),
    data: L('Datos', 'Data', 'Données', 'Dati'), cat2: L('Todas las series de Agreste en el catálogo', 'All Agreste series in the catalogue', 'Toutes les séries d’Agreste dans le catalogue', 'Tutte le serie di Agreste nel catalogo'),
    emptable: { 'etp-categoria': L('Empleo por categoría de activo (ETP)', 'Jobs by type of worker (FTE)', 'Emploi par catégorie d’actif (ETP)', 'Lavoro per categoria di attivo (ETP)'), 'etp-otex': L('Empleo por orientación técnico-económica (ETP)', 'Jobs by farm type (FTE)', 'Emploi par orientation technico-économique (ETP)', 'Lavoro per orientamento tecnico-economico (ETP)'), 'etp-region': L('Empleo por región (ETP)', 'Jobs by region (FTE)', 'Emploi par région (ETP)', 'Lavoro per regione (ETP)'), 'etp-departamento': L('Empleo por departamento (ETP)', 'Jobs by department (FTE)', 'Emploi par département (ETP)', 'Lavoro per dipartimento (ETP)'), 'etp-otex-categoria': L('Empleo por OTEX y categoría (ETP)', 'Jobs by farm type and worker type (FTE)', 'Emploi par OTEX et catégorie (ETP)', 'Lavoro per OTEX e categoria (ETP)'), 'permanentes-otex': L('Activos permanentes por OTEX', 'Permanent workers by farm type', 'Actifs permanents par OTEX', 'Attivi permanenti per OTEX'), 'permanentes-region': L('Activos permanentes por región', 'Permanent workers by region', 'Actifs permanents par région', 'Attivi permanenti per regione'), 'salario-otex': L('Salario bruto horario por OTEX (€/h)', 'Gross hourly wage by farm type (€/h)', 'Salaire brut horaire par OTEX (€/h)', 'Salario lordo orario per OTEX (€/h)'), 'salario-region': L('Salario bruto horario por región (€/h)', 'Gross hourly wage by region (€/h)', 'Salaire brut horaire par région (€/h)', 'Salario lordo orario per regione (€/h)') },
    emphint: L('ETP = equivalentes a tiempo completo. Estimaciones de Agreste a partir del Censo Agrario; el último año es provisional. Las orientaciones (OTEX), regiones y departamentos se muestran con el nombre de Agreste.', 'FTE = full-time equivalents. Agreste estimates built on the Agricultural Census; the last year is provisional. Farm types (OTEX), regions and départements keep Agreste’s names.', 'ETP = équivalents temps plein. Estimations d’Agreste à partir du recensement agricole ; la dernière année est provisoire. Les OTEX, régions et départements gardent les noms d’Agreste.', 'ETP = equivalenti a tempo pieno. Stime di Agreste basate sul Censimento agricolo; l’ultimo anno è provvisorio. OTEX, regioni e dipartimenti mantengono i nomi di Agreste.'),
    suehint: L('Hectáreas según la encuesta TERUTI-Lucas (series largas desde 1982). Departamentos: 3 grandes usos; regiones: 13 usos. Guadalupe, Martinica, Reunión, Guayana y Mayotte empiezan más tarde.', 'Hectares from the TERUTI-Lucas survey (long series since 1982). Departments: 3 main uses; regions: 13 uses. Guadeloupe, Martinique, Réunion, Guyane and Mayotte start later.', 'Hectares selon l’enquête TERUTI-Lucas (séries longues depuis 1982). Départements : 3 grands usages ; régions : 13 usages. La Guadeloupe, la Martinique, La Réunion, la Guyane et Mayotte commencent plus tard.', 'Ettari secondo l’indagine TERUTI-Lucas (serie lunghe dal 1982). Dipartimenti: 3 usi principali; regioni: 13 usi. Guadalupa, Martinica, Riunione, Guyana e Mayotte iniziano più tardi.'),
    deps: L('Departamentos (3 usos)', 'Departments (3 uses)', 'Départements (3 usages)', 'Dipartimenti (3 usi)'), regs: L('Regiones (13 usos)', 'Regions (13 uses)', 'Régions (13 usages)', 'Regioni (13 usi)'),
    byreg: L('Por región (media anual)', 'By region (annual average)', 'Par région (moyenne annuelle)', 'Per regione (media annuale)'), curYear: L('El año en curso es la media de los meses publicados.', 'The current year is the average of the months published.', 'L’année en cours est la moyenne des mois publiés.', 'L’anno in corso è la media dei mesi pubblicati.'),
    vinhint: L('Producción de vino en miles de hectolitros por cuenca vitivinícola. «Tous bassins» es el total de Francia; el último año es la estimación de la campaña en curso.', 'Wine production in thousand hectolitres by wine region. “Tous bassins” is the France total; the latest year is the estimate for the current harvest.', 'Production de vin en milliers d’hectolitres par bassin viticole. « Tous bassins » est le total France ; la dernière année est l’estimation de la récolte en cours.', 'Produzione di vino in migliaia di ettolitri per bacino viticolo. «Tous bassins» è il totale Francia; l’ultimo anno è la stima della vendemmia in corso.'),
    vcat: { 'vinconj-1': L('Total vinos', 'Total wine', 'Total vins', 'Totale vini'), 'vinconj-111': L('Vinos AOP y VDN AOP', 'PDO wines and PDO sweet wines', 'Vins AOP et VDN AOP', 'Vini DOP e VDN DOP'), 'vinconj-112': L('Cosecha para eaux-de-vie (destilación)', 'Harvest for eaux-de-vie (distillation)', 'Récolte pour eaux-de-vie', 'Raccolto per acqueviti (distillazione)'), 'vinconj-113': L('Vinos IGP', 'PGI wines', 'Vins IGP', 'Vini IGP'), 'vinconj-114': L('Vinos sin IG y sin clasificar', 'Wines without GI and unclassified', 'Vins sans IG et non classés', 'Vini senza IG e non classificati') },
    vtotal: L('Total Francia', 'France total', 'Total France', 'Totale Francia'),
    insuhint: L('Precios que pagan los agricultores franceses por semillas, energía, fertilizantes, fitosanitarios, piensos, maquinaria y servicios. Índice base 100 = 2020: un valor de 120 significa un 20 % más caro que la media de 2020. Elige un grupo o busca un producto.', 'Prices French farmers pay for seeds, energy, fertilisers, crop protection, feed, machinery and services. Index base 100 = 2020: 120 means 20 % dearer than the 2020 average. Pick a group or search for a product.', 'Prix payés par les agriculteurs français pour les semences, l’énergie, les engrais, les produits phytosanitaires, les aliments du bétail, le matériel et les services. Indice base 100 = 2020 : 120 signifie 20 % de plus que la moyenne 2020. Choisissez un groupe ou cherchez un produit.', 'Prezzi pagati dagli agricoltori francesi per sementi, energia, concimi, fitosanitari, mangimi, macchinari e servizi. Indice base 100 = 2020: 120 significa il 20 % in più della media 2020. Scegli un gruppo o cerca un prodotto.'),
    insSearch: L('Buscar un producto', 'Search for a product', 'Chercher un produit', 'Cerca un prodotto'), insPh: L('urea, gasóleo, soja…', 'urea, diesel, soya…', 'urée, gazole, soja…', 'urea, gasolio, soia…'),
    insGroups: L('Grupos principales', 'Main groups', 'Grands groupes', 'Gruppi principali'), insNone: L('Sin resultados', 'No matches', 'Aucun résultat', 'Nessun risultato'),
    insInside: L('Desglose de «{x}»', 'Breakdown of “{x}”', 'Détail de « {x} »', 'Dettaglio di «{x}»'), insSame: L('Mismo grupo que «{x}»', 'Same group as “{x}”', 'Même groupe que « {x} »', 'Stesso gruppo di «{x}»'),
    insTip: L('Pulsa un nombre para ver su desglose. Marca la casilla para compararlo en la gráfica (hasta 4).', 'Click a name to see its breakdown. Tick the box to compare it on the chart (up to 4).', 'Cliquez sur un nom pour voir son détail. Cochez la case pour le comparer sur le graphique (4 au maximum).', 'Clicca un nome per vedere il dettaglio. Spunta la casella per confrontarlo nel grafico (massimo 4).'),
    insAdd: L('Añadir a la gráfica', 'Add to chart', 'Ajouter au graphique', 'Aggiungi al grafico'), yoy12: L('Variación en 12 meses', 'Change over 12 months', 'Variation sur 12 mois', 'Variazione su 12 mesi'),
    mapNone: L('Sin dato', 'No data', 'Sans donnée', 'Senza dato'), mapLevel: L('Nivel', 'Level', 'Niveau', 'Livello'), mapShow: L('Mostrar', 'Show', 'Afficher', 'Mostra'),
    lvD: L('Departamentos', 'Departments', 'Départements', 'Dipartimenti'), lvR: L('Regiones', 'Regions', 'Régions', 'Regioni'), ofArea: L('del territorio', 'of the area', 'du territoire', 'del territorio'),
    mapBaseL: L('Pasa el ratón o toca un territorio para ver su dato; púlsalo para ver su gráfica abajo.', 'Hover or tap an area to see its figure; click it to chart it below.', 'Survolez ou touchez un territoire pour voir son chiffre ; cliquez pour afficher son graphique en dessous.', 'Passa il mouse o tocca un territorio per vedere il dato; cliccaci per il grafico sotto.'),
    mapNoteL: L('El mapa muestra Francia metropolitana; los territorios de ultramar están en la lista.', 'The map shows metropolitan France; overseas territories are in the list.', 'La carte montre la France métropolitaine ; l’outre-mer figure dans la liste.', 'La mappa mostra la Francia metropolitana; i territori d’oltremare sono nell’elenco.'),
    mapBaseR: L('Pasa el ratón o toca una región para ver su índice; púlsala para añadirla o quitarla de la gráfica (hasta 4).', 'Hover or tap a region to see its index; click it to add or remove it from the chart (up to 4).', 'Survolez ou touchez une région pour voir son indice ; cliquez pour l’ajouter ou la retirer du graphique (4 au maximum).', 'Passa il mouse o tocca una regione per vedere il suo indice; cliccala per aggiungerla o toglierla dal grafico (massimo 4).'),
    mapBaseW: L('Pasa el ratón o toca una cuenca para ver su dato; púlsala para añadirla o quitarla de la gráfica.', 'Hover or tap a wine region to see its figure; click it to add or remove it from the chart.', 'Survolez ou touchez un bassin pour voir son chiffre ; cliquez pour l’ajouter ou le retirer du graphique.', 'Passa il mouse o tocca un bacino per vedere il dato; cliccaci per aggiungerlo o toglierlo dal grafico.'),
    mapNoteW: L('Las cuencas se dibujan como grupos de departamentos (aproximado: sus límites reales no siguen los departamentos).', 'Wine regions are drawn as groups of départements (approximate: real boundaries do not follow départements).', 'Les bassins sont dessinés comme des groupes de départements (approximatif : les limites réelles ne suivent pas les départements).', 'I bacini sono disegnati come gruppi di dipartimenti (approssimativo: i confini reali non seguono i dipartimenti).'),
    uHa: L('ha', 'ha', 'ha', 'ha'), uIdx: L('índice', 'index', 'indice', 'indice'), uKhl: L('miles de hl', 'thousand hl', 'milliers d’hl', 'migliaia di hl'), uEtp: L('ETP', 'FTE', 'ETP', 'ETP'), uPers: L('personas', 'people', 'personnes', 'persone'), uEur: L('€/h', '€/h', '€/h', '€/h'),
    usoName: { '1': L('Suelos artificializados', 'Artificial land', 'Sols artificialisés', 'Suoli artificializzati'), '2': L('Suelos agrícolas', 'Agricultural land', 'Sols agricoles', 'Suoli agricoli'), '3': L('Suelos naturales', 'Natural land', 'Sols naturels', 'Suoli naturali') }
  };
  var CACHE = {}, STATE = { tab: 'empleo', sel: {} }, BASE = 'data/france-agreste-more/';
  function load(f) { if (CACHE[f]) return CACHE[f]; return CACHE[f] = fetch(BASE + f, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function tsOf(p) { var y = +p.slice(0, 4), m = p.length > 4 ? +p.slice(5, 7) : 1; return Date.UTC(y, m - 1, 1); }
  function pc(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }
  function chg(v) { if (v == null) return '<span class="ag-m">—</span>'; var up = v > 0.049, dn = v < -0.049; return '<span class="ag-chg ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲ +' : dn ? '▼ −' : '■ ') + nf(Math.abs(v), 1) + ' %</span>'; }
  function cleanLab(s) { return trl(s); }
  function usoLab(s) { var m = /^(.*) - ([123])- (.*)$/.exec(s); if (m) return m[1] + ' · ' + tx(T.usoName[m[2]]); var k = /^([123])- /.exec(s); return k ? tx(T.usoName[k[1]]) : s; }
  /* etiquetas que Agreste publica en francés: se traducen con js/agreste-labels.js (clave = etiqueta francesa normalizada) */
  var LABP = null;
  function labs() { if (global.DIAgresteLabels) return Promise.resolve(); return LABP || (LABP = new Promise(function (ok) { var sc = document.createElement('script'); sc.src = 'js/agreste-labels.js?v=20261022'; sc.onload = sc.onerror = function () { ok(); }; document.head.appendChild(sc); })); }
  function nk(s) { return String(s).replace(/ /g, ' ').replace(/ - Réapparaît.*$/, '').replace(/\s*\(B\.[0-9]*\)?\s*$/, '').replace(/\s+/g, ' ').replace(/^ | $/g, ''); }
  function trl(s) { var D = global.DIAgresteLabels, k = nk(s), v = D && D[k], i = { es: 0, en: 1, it: 2 }[lg()]; return v && i != null ? v[i] : k; }
  function regLab(s) { var q = /^(.*?)( \(\d\d\))$/.exec(s); return q ? trl(q[1]) + q[2] : trl(s); }
  function agl(s) {
    var m = /^(\d{4}) - (.*?)(?: - ((?:Chef |Conjoint |Salarié |Saisonnier |ETA, |Tous ).*))?$/.exec(s);
    if (m) return m[1] + ' · ' + trl(m[2]) + (m[3] ? ' — ' + trl(m[3]) : '');
    var t = /^(Toutes orientations) - (Tous actifs)$/.exec(s); if (t) return trl(t[1]) + ' — ' + trl(t[2]);
    var du = /^(.+) - \1$/.exec(s); if (du) return trl(du[1]);
    var d = /^(.*? \(\d\d\)) - (.*)$/.exec(s); if (d) return regLab(d[1]) + ' — ' + d[2];
    return regLab(s);
  }
  function fold(s) { s = String(s).toLowerCase(); try { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { return s; } }
  function quant(vals) { var v = vals.slice().sort(function (a, b) { return a - b; }), q = []; for (var i = 1; i < 5; i++) q.push(v[Math.min(v.length - 1, Math.floor(i * v.length / 5))]); return q; }
  function cls(v, cuts) { if (v == null) return 'gb-cx'; for (var i = 0; i < cuts.length; i++) if (v < cuts[i]) return 'gb-c' + i; return 'gb-c' + cuts.length; }
  var MAPP = {};
  function need(src, v) { if (global[v]) return Promise.resolve(global[v]); return MAPP[v] || (MAPP[v] = new Promise(function (ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = function () { ok(global[v] || null); }; sc.onerror = function () { ok(null); }; document.head.appendChild(sc); })); }
  function legend(cuts, lo, hi, fmt) { return '<div class="wp-legend gb-leg">' + [0, 1, 2, 3, 4].map(function (i) { return '<span><i class="gb-key gb-c' + i + '"></i>' + esc(fmt(i ? cuts[i - 1] : lo) + '–' + fmt(i < 4 ? cuts[i] : hi)) + '</span>'; }).join('') + '<span><i class="gb-key gb-cx"></i>' + esc(tx(T.mapNone)) + '</span></div>'; }
  var COLORS = ['#1d5178', '#a9491f', '#2e7d5b', '#7a4a8c'];

  /* bloque genérico: tabla de series + gráfica de las seleccionadas */
  function block(key, rows, o) {
    var sel = STATE.sel[key];
    if (!sel || !sel.length || !rows.some(function (r) { return sel.indexOf(r.id) >= 0; })) sel = STATE.sel[key] = (o.defSel || [rows[0].id]).filter(function (id) { return rows.some(function (r) { return r.id === id; }); });
    if (!sel.length) sel = STATE.sel[key] = [rows[0].id];
    var list = rows.slice(); if (o.sort) list.sort(function (a, b) { return (b.last || 0) - (a.last || 0); });
    var series = [], anyProv = false;
    sel.forEach(function (id, n) { var r = rows.filter(function (x) { return x.id === id; })[0]; if (!r) return; series.push({ name: r.label, color: COLORS[n % 4], pts: r.points.map(function (p) { return { x: tsOf(p[0]), y: p[1], l: p[0] }; }) }); });
    var chart = global.DehesaChart ? global.DehesaChart.render({ series: series, xMode: 'time', yTitle: o.unit, noLegend: series.length < 2, aria: o.aria, vFmt: function (v) { return nf(v, o.dec); }, xFmt: o.monthly ? undefined : function (x) { return new Date(x).getUTCFullYear(); } }) : '';
    var body = list.map(function (r) {
      var on = sel.indexOf(r.id) >= 0, pr = r.prov && r.prov.indexOf(r.per) >= 0; if (pr) anyProv = true;
      return '<tr><td><button type="button" class="ag-row" data-k="' + esc(key) + '" data-id="' + esc(r.id) + '" aria-pressed="' + on + '" style="padding-left:' + (8 + (r.depth || 0) * 12) + 'px">' + esc(r.label) + '</button></td><td class="num">' + nf(r.last, o.dec) + '</td><td>' + esc(r.per) + (pr ? ' (p)' : '') + '</td><td class="num">' + chg(r.chg) + '</td>' + (o.first ? '<td class="num">' + chg(r.chgFirst) + '</td>' : '') + '</tr>';
    }).join('');
    return '<div class="ag-chart">' + chart + '</div><p class="ag-m">' + esc(tx(T.show)) + (anyProv ? ' ' + esc(tx(T.prov)) + '.' : '') + '</p><div class="di-table-wrap"><table class="di-table ag-tbl"><thead><tr><th>' + esc(tx(T.hName)) + '</th><th class="num">' + esc(tx(T.hLast)) + ' (' + esc(o.unit) + ')</th><th>' + esc(tx(T.hPer)) + '</th><th class="num">' + esc(tx(T.hChg)) + '</th>' + (o.first ? '<th class="num">' + esc(tx(T.hFirst)) + '</th>' : '') + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function rowsOf(series, lab) {
    return series.map(function (s) {
      var p = s.points, n = p.length, lastP = p[n - 1], prev = n > 1 ? p[n - 2] : null;
      return { id: s.id, label: lab ? lab(s) : agl(s.label), points: p, last: lastP[1], per: lastP[0], prov: s.provisional, depth: s.depth, chg: prev ? pc(lastP[1], prev[1]) : null, chgFirst: n > 1 ? pc(lastP[1], p[0][1]) : null };
    });
  }
  function selectHtml(id, label, opts, cur) {
    return '<label class="ag-lab" for="' + id + '">' + esc(label) + '</label><select id="' + id + '" class="di-field-input ag-sel" data-search="1">' + opts.map(function (o) { return o.group ? '<optgroup label="' + esc(o.group) + '">' + o.items.map(function (i) { return '<option value="' + esc(i[0]) + '"' + (i[0] === cur ? ' selected' : '') + '>' + esc(i[1]) + '</option>'; }).join('') + '</optgroup>' : '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }
  function head(d) { return '<p class="ag-m">' + esc(tx(T.src)) + ': Agreste (SSP) · ' + esc(d.edition || '') + ' · ' + esc(tx(T.lic)) + '</p>'; }

  /* ---- pestañas ---- */
  function empleo(d) {
    var tid = STATE.emp || 'etp-categoria', t = d.tables.filter(function (x) { return x.id === tid; })[0] || d.tables[0];
    tid = t.id;
    var unit = /salario/.test(tid) ? tx(T.uEur) : /permanentes/.test(tid) ? tx(T.uPers) : tx(T.uEtp);
    var opts = d.tables.map(function (x) { return [x.id, T.emptable[x.id] ? tx(T.emptable[x.id]) : x.label]; });
    var wide = /departamento|otex-categoria/.test(tid);
    return '<p class="di-movers-hint">' + esc(tx(T.emphint)) + '</p><div class="ag-pick">' + selectHtml('ag-emp', tx(T.pick), opts, tid) + '</div>' +
      block('emp-' + tid, rowsOf(t.series), { unit: unit, dec: /salario/.test(tid) ? 2 : 0, aria: tx(T.emptable[tid] || [t.label, t.label, t.label, t.label]), sort: wide, first: true }) + head(d);
  }
  function suelo(d) {
    var dep = d.tables.filter(function (x) { return /departamento/.test(x.id); })[0], reg = d.tables.filter(function (x) { return /region/.test(x.id); })[0];
    var groups = {}, order = [];
    dep.series.forEach(function (s) { var nm = s.label.split(' - ')[0]; if (!groups[nm]) { groups[nm] = []; order.push(nm); } groups[nm].push(s); });
    var regs = {}, rorder = [];
    reg.series.forEach(function (s) { var nm = s.label.split(' - ')[0]; if (!regs[nm]) { regs[nm] = []; rorder.push(nm); } regs[nm].push(s); });
    var cur = STATE.terr || 'D:France métropolitaine';
    var france = order.filter(function (n) { return /^France/.test(n); }), others = order.filter(function (n) { return !/^France/.test(n); });
    var opts = [{ group: tx(T.deps), items: france.concat(others).map(function (n) { return ['D:' + n, trl(n)]; }) }, { group: tx(T.regs), items: rorder.map(function (n) { return ['R:' + n, trl(n)]; }) }];
    var isReg = cur.charAt(0) === 'R', nm = cur.slice(2), ser = (isReg ? regs : groups)[nm];
    if (!ser) { cur = STATE.terr = 'D:France métropolitaine'; nm = 'France métropolitaine'; ser = groups[nm]; isReg = false; }
    var rows = rowsOf(ser, function (s) { return isReg ? trl(s.label.split(' - ').slice(1).join(' - ').replace(/^\d+- /, '')) : tx(T.usoName[(/- ([123])- /.exec(s.label) || [0, '2'])[1]]); });
    setTimeout(function () { drawLand(d); }, 0);
    return '<p class="di-movers-hint">' + esc(tx(T.suehint)) + '</p><div class="ag-pick">' + selectHtml('ag-terr', tx(T.terr), opts, cur) + '</div>' +
      '<div class="ag-vgrid"><div class="ag-vmap ag-land"><div id="ag-map"></div></div><div class="ag-vdata">' +
      block('sue-' + cur, rows, { unit: tx(T.uHa), dec: 0, aria: trl(nm), defSel: isReg ? [rows[0].id] : rows.map(function (r) { return r.id; }).slice(0, 3), first: true }) + '</div></div>' + head(d);
  }
  /* ---- insumos: grupos principales + buscador + desglose por niveles (en vez de una lista de 190 productos) ---- */
  function tree(ser) {
    var par = [], kids = [], st = [0], i, dp;
    for (i = 0; i < ser.length; i++) {
      kids[i] = []; dp = ser[i].depth || 0;
      if (i === 0) { par[0] = -1; continue; }
      if (dp === 0) st = [0];
      while (st.length > 1 && (ser[st[st.length - 1]].depth || 0) >= Math.max(dp, 1)) st.pop();
      par[i] = st[st.length - 1]; st.push(i); kids[par[i]].push(i);
    }
    return { par: par, kids: kids };
  }
  function pgrow(s) { return rowsOf([s], function () { return trl(s.label); })[0]; }
  function yoyOf(r) { var y = null, py = (+r.per.slice(0, 4) - 1) + r.per.slice(4); r.points.forEach(function (p) { if (p[0] === py) y = p[1]; }); return pc(r.last, y); }
  function insumos(d) {
    var ser = d.tables[0].series, TR = tree(ser), cur = -1, k;
    ser.forEach(function (s, n) { if (s.id === STATE.prod) cur = n; }); if (cur < 0) cur = 0;
    STATE.ser = ser; STATE.tr = TR;
    var path = [], i = cur; while (i >= 0) { path.unshift(i); i = TR.par[i]; }
    var chips = [0]; ser.forEach(function (s, n) { if ((s.depth || 0) === 1) chips.push(n); });
    var act = 0; path.forEach(function (n) { if ((ser[n].depth || 0) === 1) act = n; });
    var cmp = (STATE.cmp || []).filter(function (n) { return n !== cur && ser[n]; }).slice(0, 3), ids = [cur].concat(cmp);
    var rowsC = ids.map(function (n) { return pgrow(ser[n]); }), r0 = rowsC[0], yoy = yoyOf(r0);
    var cs = rowsC.map(function (r, n) { return { name: r.label, color: COLORS[n % 4], pts: r.points.map(function (p) { return { x: tsOf(p[0]), y: p[1], l: p[0] }; }) }; });
    var chart = global.DehesaChart ? global.DehesaChart.render({ series: cs, xMode: 'time', yTitle: tx(T.uIdx), noLegend: cs.length < 2, aria: r0.label, vFmt: function (v) { return nf(v, 1); } }) : '';
    var chipH = '<div class="ag-chips" role="group" aria-label="' + esc(tx(T.insGroups)) + '">' + chips.map(function (n) { return '<button type="button" class="ag-chip" data-prod="' + esc(ser[n].id) + '" aria-pressed="' + (n === act) + '">' + esc(trl(ser[n].label)) + '</button>'; }).join('') + '</div>';
    var crumbs = path.length > 1 ? '<nav class="ag-crumbs" aria-label="' + esc(tx(T.insGroups)) + '">' + path.map(function (n, j) { return j === path.length - 1 ? '<strong>' + esc(trl(ser[n].label)) + '</strong>' : '<button type="button" class="ag-crumb" data-prod="' + esc(ser[n].id) + '">' + esc(trl(ser[n].label)) + '</button> ›'; }).join(' ') + '</nav>' : '';
    var list = TR.kids[cur].length ? TR.kids[cur] : (TR.par[cur] >= 0 ? TR.kids[TR.par[cur]] : []), parentN = TR.kids[cur].length ? cur : TR.par[cur];
    var body = list.map(function (n) {
      var r = pgrow(ser[n]), on = ids.indexOf(n) >= 0, isCur = n === cur, more = TR.kids[n].length;
      return '<tr' + (isCur ? ' aria-current="true" class="ag-cur"' : '') + '><td class="ag-cb"><input type="checkbox" data-cmp="' + esc(ser[n].id) + '"' + (on ? ' checked' : '') + (isCur ? ' disabled' : '') + ' aria-label="' + esc(tx(T.insAdd) + ': ' + r.label) + '"></td><td><button type="button" class="ag-name" data-prod="' + esc(ser[n].id) + '">' + esc(r.label) + (more ? ' <span aria-hidden="true">›</span>' : '') + '</button></td><td class="num">' + nf(r.last, 1) + '</td><td class="num">' + chg(yoyOf(r)) + '</td></tr>';
    }).join('');
    var title = list.length ? (TR.kids[cur].length ? tx(T.insInside) : tx(T.insSame)).replace('{x}', trl(ser[parentN >= 0 ? parentN : cur].label)) : '';
    var tbl = list.length ? '<h2 class="ag-h2">' + esc(title) + '</h2><p class="ag-m">' + esc(tx(T.insTip)) + '</p><div class="di-table-wrap"><table class="di-table ag-tbl"><thead><tr><th><span class="cof-vh">' + esc(tx(T.insAdd)) + '</span></th><th>' + esc(tx(T.prod)) + '</th><th class="num">' + esc(tx(T.hLast)) + '</th><th class="num">' + esc(tx(T.yoy12)) + '</th></tr></thead><tbody>' + body + '</tbody></table></div>' : '';
    return '<p class="di-movers-hint">' + esc(tx(T.insuhint)) + '</p>' +
      '<div class="ag-search"><label class="ag-lab" for="ag-q">' + esc(tx(T.insSearch)) + '</label><input id="ag-q" type="search" class="di-field-input ag-q" autocomplete="off" placeholder="' + esc(tx(T.insPh)) + '"><div id="ag-qres" class="ag-chips" aria-live="polite"></div></div>' +
      chipH + crumbs +
      '<div class="ag-kpi"><span class="ag-kv">' + nf(r0.last, 1) + '</span> <span class="ag-m">' + esc(tx(T.uIdx)) + ' · ' + esc(r0.per) + '</span> · <span class="ag-m">' + esc(tx(T.yoy12)) + ':</span> ' + chg(yoy) + '</div>' +
      '<div class="ag-chart">' + chart + '</div>' + tbl +
      '<h2 class="ag-h2">' + esc(tx(T.byreg)) + '</h2><div id="ag-reg">' + esc(tx(T.loading)) + '</div>' + head(d);
  }
  function searchIns(q) {
    var host = document.getElementById('ag-qres'), ser = STATE.ser; if (!host || !ser) return;
    q = fold(q).replace(/^\s+|\s+$/g, ''); if (q.length < 2) { host.innerHTML = ''; return; }
    var hits = [], n; for (n = 0; n < ser.length && hits.length < 8; n++) if (fold(trl(ser[n].label)).indexOf(q) >= 0 || fold(nk(ser[n].label)).indexOf(q) >= 0) hits.push(n);
    host.innerHTML = hits.length ? hits.map(function (n) { var p = STATE.tr.par[n]; return '<button type="button" class="ag-chip" data-prod="' + esc(ser[n].id) + '">' + esc(trl(ser[n].label)) + (p > 0 ? ' <span class="ag-m">· ' + esc(trl(ser[p].label)) + '</span>' : '') + '</button>'; }).join('') : '<span class="ag-m">' + esc(tx(T.insNone)) + '</span>';
  }
  function loadRegs(d) {
    load('ipampa-regiones.json').then(function (r) { var el = document.getElementById('ag-reg'); if (!el || STATE.tab !== 'insumos') return; el.innerHTML = r && r.tables ? (insumosReg(r, STATE.prod || d.tables[0].series[0].id) || '<p class="ag-m">—</p>') : '<p class="ag-m">' + esc(tx(T.fail)) + '</p>'; });
  }
  function insumosReg(d, id) {
    var rows = [], code = id.split('-').pop();
    d.tables.forEach(function (t) { t.series.forEach(function (s) { if (s.id.slice(-code.length - 1) === '-' + code && s.points.length) rows = rows.concat(rowsOf([s], function () { return trl(t.label.replace(/ \(1\)$/, '')); })); }); });
    if (!rows.length) return '';
    var key = 'insreg-' + id;
    setTimeout(function () { drawRMap(rows, key); }, 0);
    return '<div class="ag-vgrid ag-rev"><div class="ag-vdata">' +
      block(key, rows, { unit: tx(T.uIdx), dec: 1, sort: true, aria: tx(T.byreg), defSel: rows.slice(0, 3).map(function (r) { return r.id; }), first: true }) + '<p class="ag-m">' + esc(tx(T.curYear)) + '</p>' +
      '</div><div class="ag-vmap ag-ipa"><div id="ag-rmap"></div></div></div>';
  }
  /* regiones metropolitanas: la clave es el trozo del id de Agreste (ipampa-reg-<región>-<código>) y el valor, el id del contorno de vendor/fr-regions.js; Córcega no tiene dato y se dibuja en gris */
  var IRM = { 'auvergne-rhone-alpes': 'ARA', 'bourgogne-franche-comte': 'BFC', 'bretagne': 'BRE', 'centre-val-de-loire': 'CVL', 'grand-est': 'GES', 'hauts-de-france': 'HDF', 'ile-de-france': 'IDF', 'normandie': 'NOR', 'nouvelle-aquitaine': 'NAQ', 'occitanie': 'OCC', 'pays-de-la-loire': 'PDL', 'provence-alpes-cote-d-azur': 'PAC' };
  function drawRMap(rows, key) {
    need('vendor/fr-regions.js', 'DEHESA_FR_REGIONS').then(function (MAP) {
      var host = document.getElementById('ag-rmap'); if (!host || !MAP) return;
      var sel = STATE.sel[key] || [], by = {}, vals = [];
      rows.forEach(function (r) { var m = /^ipampa-reg-(.+)-\d+$/.exec(r.id), c = m && IRM[m[1]]; if (c && r.last != null) { by[c] = r; vals.push(r.last); } });
      if (!vals.length) { host.innerHTML = ''; return; }
      var cuts = quant(vals), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      var paths = MAP.states.map(function (st) {
        var r = by[st.id];
        if (!r) return '<path class="gb-prov gb-cx ag-bp" d="' + st.d + '" aria-hidden="true"/>';
        var on = sel.indexOf(r.id) >= 0, tip = r.label + ': ' + nf(r.last, 1) + ' ' + tx(T.uIdx) + ' (' + r.per + ')';
        return '<path class="gb-prov ag-bp ' + cls(r.last, cuts) + (on ? ' ag-on' : '') + '" data-k="' + esc(key) + '" data-id="' + esc(r.id) + '" data-tip="' + esc(tip) + '" tabindex="0" role="button" aria-pressed="' + on + '" aria-label="' + esc(tip) + '" d="' + st.d + '"/>';
      }).join('');
      host.innerHTML = '<svg viewBox="' + MAP.viewBox + '" role="group" aria-label="' + esc(tx(T.byreg)) + '">' + paths + '</svg>' + legend(cuts, lo, hi, function (v) { return nf(v, 0); }) +
        '<p class="ag-m ag-ro" aria-live="polite" data-base="' + esc(tx(T.mapBaseR)) + '">' + esc(tx(T.mapBaseR)) + '</p><p class="ag-m">' + esc(tx(T.mapNoteL)) + '</p>';
    });
  }
  /* cuencas vitivinícolas como grupos de departamentos (aproximado); clave = sufijo del id de Agreste */
  var VB = { als: ['67', '68'], bordo: ['33'], bourgo: ['21', '71', '89', '69'], centre: ['44', '49', '37', '41', '45', '18', '36', '72', '58', '79', '85'], champ: ['51', '10', '02', '52', '77'], cognac: ['16', '17'], corse: ['2A', '2B'], jura: ['39'], oc: ['11', '30', '34', '66', '48'], rhone: ['84', '26', '07', '13', '83', '04', '05', '06', '38'], savoie: ['73', '74', '01'], sudouest: ['24', '47', '46', '82', '81', '32', '40', '64', '65', '12', '31', '09'] };
  function vendimia(d) {
    var cur = STATE.vcat || d.tables[0].id, t = d.tables.filter(function (x) { return x.id === cur; })[0] || d.tables[0];
    var opts = d.tables.map(function (x) { return [x.id, T.vcat[x.id] ? tx(T.vcat[x.id]) : trl(x.label)]; });
    var rows = rowsOf(t.series, function (x) { return /^Tous/.test(x.label) ? tx(T.vtotal) : trl(x.label); });
    var tot = rows.filter(function (r) { return r.label === tx(T.vtotal); })[0];
    setTimeout(function () { drawVMap(t, rows); }, 0);
    return '<div class="ag-vgrid"><div class="ag-vmap ag-wine"><div id="ag-vmap"></div></div><div class="ag-vdata"><p class="di-movers-hint">' + esc(tx(T.vinhint)) + '</p><div class="ag-pick">' + selectHtml('ag-vcat', tx(T.cat), opts, t.id) + '</div>' +
      block('vin-' + t.id, rows, { unit: tx(T.uKhl), dec: 0, sort: true, defSel: tot ? [tot.id] : [rows[0].id], first: true, aria: T.vcat[t.id] ? tx(T.vcat[t.id]) : trl(t.label) }) + '</div></div>' + head(d);
  }
  function drawVMap(t, rows) {
    need('vendor/fr-departements.js', 'DEHESA_FR_DEPTS').then(function (MAP) {
      var host = document.getElementById('ag-vmap'); if (!host || !MAP) return;
      var key = 'vin-' + t.id, sel = STATE.sel[key] || [], suf = {}, vals = [], inv = {};
      rows.forEach(function (r) { var b = r.id.replace(/^vinconj-\d+-/, ''); if (VB[b] && r.last != null) { suf[b] = r; vals.push(r.last); } });
      Object.keys(VB).forEach(function (b) { VB[b].forEach(function (c) { inv[c] = b; }); });
      var cuts = quant(vals), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      var paths = MAP.states.map(function (st) {
        var b = inv[st.id], r = b && suf[b];
        if (!r) return '<path class="gb-prov gb-cx ag-bp" d="' + st.d + '" aria-hidden="true"/>';
        var on = sel.indexOf(r.id) >= 0, tip = r.label + ': ' + nf(r.last, 0) + ' ' + tx(T.uKhl) + ' (' + r.per + ')';
        return '<path class="gb-prov ag-bp ' + cls(r.last, cuts) + (on ? ' ag-on' : '') + '" data-k="' + esc(key) + '" data-id="' + esc(r.id) + '" data-tip="' + esc(tip) + '" tabindex="0" role="button" aria-pressed="' + on + '" aria-label="' + esc(tip) + '" d="' + st.d + '"/>';
      }).join('');
      host.innerHTML = '<svg viewBox="' + MAP.viewBox + '" role="group" aria-label="' + esc(tx(T.tabs.vendimia)) + '">' + paths + '</svg>' + legend(cuts, lo, hi, function (v) { return nf(v, 0); }) +
        '<p class="ag-m ag-ro" aria-live="polite" data-base="' + esc(tx(T.mapBaseW)) + '">' + esc(tx(T.mapBaseW)) + '</p><p class="ag-m">' + esc(tx(T.mapNoteW)) + '</p>';
    });
  }
  /* ---- uso del suelo: mapa de Francia (departamentos o regiones) coloreado por el peso de cada uso ---- */
  var RMAP = { IDF: '11', CVL: '24', BFC: '27', NOR: '28', HDF: '32', GES: '44', PDL: '52', BRE: '53', NAQ: '75', OCC: '76', ARA: '84', PAC: '93', COR: '94' };
  var RGRP = { art: ['11', '12', '13'], agr: ['21', '22', '23', '25', '50'], nat: ['31', '32', '40', '60', '70'] };
  function terGroup(id) { return id === '2A' ? '2a' : id === '2B' ? '2b' : /^(75|92|93|94)$/.test(id) ? '75-91-92-93' : id; }
  function drawLand(d) {
    var host = document.getElementById('ag-map'); if (!host) return;
    var lev = STATE.mlev === 'R' ? 'R' : 'D', isR = lev === 'R';
    need(isR ? 'vendor/fr-regions.js' : 'vendor/fr-departements.js', isR ? 'DEHESA_FR_REGIONS' : 'DEHESA_FR_DEPTS').then(function (MAP) {
      host = document.getElementById('ag-map'); if (!host || !MAP) return;
      var tb = d.tables.filter(function (x) { return isR ? /region/.test(x.id) : /departamento/.test(x.id); })[0], by = {}, names = {}, useName = {}, per = '';
      tb.series.forEach(function (s) {
        var m = isR ? /^teruti-13-(\d\d)-(\d\d)$/.exec(s.id) : /^teruti-3-(.+)-([123])$/.exec(s.id), last = s.points[s.points.length - 1]; if (!m || !last) return;
        by[m[1]] = by[m[1]] || { tot: 0, u: {} }; by[m[1]].u[m[2]] = last[1]; by[m[1]].tot += last[1]; names[m[1]] = s.label.split(' - ')[0]; per = last[0];
        if (isR) useName[m[2]] = trl(s.label.split(' - ').slice(1).join(' - ').replace(/^\d+- /, ''));
      });
      var opts = [['art', tx(T.usoName['1'])], ['agr', tx(T.usoName['2'])], ['nat', tx(T.usoName['3'])]];
      if (isR) Object.keys(useName).sort().forEach(function (u) { opts.push([u, useName[u]]); });
      var met = STATE.mmet; if (!opts.some(function (o) { return o[0] === met; })) met = STATE.mmet = 'agr';
      var us = isR ? (RGRP[met] || [met]) : [{ art: '1', agr: '2', nat: '3' }[met]];
      var vals = [], cur = STATE.terr;
      var paths = MAP.states.map(function (st) {
        var code = isR ? RMAP[st.id] : terGroup(st.id), g = by[code];
        if (!g) return '<path class="gb-prov gb-cx ag-bp" d="' + st.d + '" aria-hidden="true"/>';
        var ha = 0; us.forEach(function (u) { ha += g.u[u] || 0; });
        var v = g.tot ? ha / g.tot * 100 : null; vals.push(v);
        st._v = v; st._g = g; st._ha = ha; return null;
      });
      var cuts = quant(vals), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      paths = MAP.states.map(function (st) {
        var code = isR ? RMAP[st.id] : terGroup(st.id), g = by[code];
        if (!g) return '<path class="gb-prov gb-cx ag-bp" d="' + st.d + '" aria-hidden="true"/>';
        var key = (isR ? 'R:' : 'D:') + names[code], on = key === cur, tip = trl(names[code]) + ': ' + nf(st._v, 1) + ' % ' + tx(T.ofArea) + ' · ' + nf(st._ha, 0) + ' ' + tx(T.uHa) + ' (' + per + ')';
        return '<path class="gb-prov ag-bp ' + cls(st._v, cuts) + (on ? ' ag-on' : '') + '" data-terr="' + esc(key) + '" data-tip="' + esc(tip) + '" tabindex="0" role="button" aria-pressed="' + on + '" aria-label="' + esc(tip) + '" d="' + st.d + '"/>';
      }).join('');
      host.innerHTML = '<div class="ag-pick"><label class="ag-lab" for="ag-mlev">' + esc(tx(T.mapLevel)) + '</label><select id="ag-mlev" class="di-field-input ag-sel">' + [['D', tx(T.lvD)], ['R', tx(T.lvR)]].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === lev ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>' +
        '<label class="ag-lab" for="ag-mmet">' + esc(tx(T.mapShow)) + '</label><select id="ag-mmet" class="di-field-input ag-sel">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === met ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>' +
        '<svg viewBox="' + MAP.viewBox + '" role="group" aria-label="' + esc(tx(T.tabs.suelo)) + '">' + paths + '</svg>' + legend(cuts, lo, hi, function (v) { return nf(v, 0) + ' %'; }) +
        '<p class="ag-m ag-ro" aria-live="polite" data-base="' + esc(tx(T.mapBaseL)) + '">' + esc(tx(T.mapBaseL)) + '</p><p class="ag-m">' + esc(tx(T.mapNoteL)) + '</p>';
    });
  }

  /* ---- montaje ---- */
  function bodyEl() { return document.getElementById('ag-body'); }
  function paint(html) { var b = bodyEl(); if (b) b.innerHTML = html; }
  function render() {
    var tab = STATE.tab;
    var bar = '<div class="di-tabs-bar" role="tablist">' + ['empleo', 'suelo', 'insumos', 'vendimia'].map(function (k) { return '<button type="button" role="tab" class="di-tab-btn' + (k === tab ? ' active' : '') + '" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + esc(tx(T.tabs[k])) + '</button>'; }).join('') + '</div>';
    var root = document.getElementById('ag-root'); root.innerHTML = bar + '<div id="ag-body" role="tabpanel">' + esc(tx(T.loading)) + '</div>';
    var file = { empleo: 'empleo.json', suelo: 'teruti.json', insumos: 'ipampa-fr.json', vendimia: 'vinconj.json' }[tab];
    Promise.all([load(file), labs()]).then(function (rr) {
      var d = rr[0];
      if (STATE.tab !== tab) return;
      if (!d || !d.tables) { paint('<p class="ag-m">' + esc(tx(T.fail)) + '</p>'); return; }
      paint({ empleo: empleo, suelo: suelo, insumos: insumos, vendimia: vendimia }[tab](d));
      if (tab === 'insumos') loadRegs(d);
    });
  }
  var BOUND = false, EMBED = false;
  function init() {
    var sub = document.getElementById('ag-sub'), h1 = document.getElementById('ag-h1');
    function text() { if (h1) h1.textContent = tx(T.h1); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.h1) + ' | Dehesa Index'; var cat = document.getElementById('ag-cat'); if (cat) cat.textContent = tx(T.cat2); }
    text();
    var h = (location.hash || '').replace('#', ''); if (!EMBED && /^(empleo|suelo|insumos|vendimia)$/.test(h)) STATE.tab = h;
    if (BOUND) { render(); return; }
    BOUND = true;
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-tab],[data-k],[data-prod],[data-terr]') : null; if (!b) return;
      if (b.getAttribute('data-prod')) { STATE.prod = b.getAttribute('data-prod'); STATE.cmp = []; rerenderInsumos(); return; }
      if (b.getAttribute('data-terr')) { STATE.terr = b.getAttribute('data-terr'); var dt = CACHE['teruti.json']; if (dt) dt.then(function (dd) { paint(suelo(dd)); }); return; }
      if (b.getAttribute('data-tab')) { STATE.tab = b.getAttribute('data-tab'); if (!EMBED) { try { history.replaceState(null, '', '#' + STATE.tab); } catch (x) { /* sin history */ } } render(); return; }
      var k = b.getAttribute('data-k'), id = b.getAttribute('data-id'), sel = STATE.sel[k] || [], i = sel.indexOf(id);
      if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } else { sel.push(id); if (sel.length > 4) sel.shift(); }
      STATE.sel[k] = sel; var d = CACHE[{ empleo: 'empleo.json', suelo: 'teruti.json', insumos: 'ipampa-fr.json', vendimia: 'vinconj.json' }[STATE.tab]];
      if (STATE.tab === 'insumos') { rerenderInsumos(); return; }
      if (d) d.then(function (dd) { paint({ empleo: empleo, suelo: suelo, vendimia: vendimia }[STATE.tab](dd)); });
    });
    document.addEventListener('change', function (e) {
      var t = e.target; if (t && t.getAttribute && t.getAttribute('data-cmp')) {
        var id = t.getAttribute('data-cmp'), ix = -1; (STATE.ser || []).forEach(function (x, n) { if (x.id === id) ix = n; });
        var c = STATE.cmp || [], j = c.indexOf(ix); if (j >= 0) c.splice(j, 1); else if (ix >= 0) { c.push(ix); if (c.length > 3) c.shift(); }
        STATE.cmp = c; rerenderInsumos(); return;
      }
      if (!t || !t.id) return;
      if (t.id === 'ag-emp') STATE.emp = t.value; else if (t.id === 'ag-terr') STATE.terr = t.value; else if (t.id === 'ag-prod') STATE.prod = t.value; else if (t.id === 'ag-vcat') STATE.vcat = t.value; else if (t.id === 'ag-mlev') STATE.mlev = t.value; else if (t.id === 'ag-mmet') STATE.mmet = t.value; else return;
            var d = CACHE[{ empleo: 'empleo.json', suelo: 'teruti.json', vendimia: 'vinconj.json' }[STATE.tab]]; if (d) d.then(function (dd) { paint({ empleo: empleo, suelo: suelo, vendimia: vendimia }[STATE.tab](dd)); });
    });
    function rerenderInsumos() { var f = CACHE['ipampa-fr.json']; if (f) f.then(function (dd) { paint(insumos(dd)); loadRegs(dd); }); }
    document.addEventListener('input', function (e) { if (e.target && e.target.id === 'ag-q') searchIns(e.target.value); });
    function hov(e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null, box = el && el.closest('.ag-vmap'); if (!box) return;
      var ro = box.querySelector('.ag-ro'), old = box.querySelectorAll('.ag-hl'), i, id = el.getAttribute('data-id'), all;
      if (ro) ro.textContent = el.getAttribute('data-tip');
      for (i = 0; i < old.length; i++) old[i].classList.remove('ag-hl');
      if (id) { all = box.querySelectorAll('[data-id]'); for (i = 0; i < all.length; i++) if (all[i].getAttribute('data-id') === id) all[i].classList.add('ag-hl'); } else el.classList.add('ag-hl');
    }
    function unhov(e) {
      var box = e.target && e.target.closest ? e.target.closest('.ag-vmap') : null; if (!box || (e.relatedTarget && box.contains(e.relatedTarget))) return;
      var ro = box.querySelector('.ag-ro'), old = box.querySelectorAll('.ag-hl'), i; if (ro) ro.textContent = ro.getAttribute('data-base') || '';
      for (i = 0; i < old.length; i++) old[i].classList.remove('ag-hl');
    }
    document.addEventListener('mouseover', hov); document.addEventListener('focusin', hov); document.addEventListener('mouseout', unhov); document.addEventListener('focusout', unhov);
    document.addEventListener('keydown', function (e) { var el = e.target; if ((e.key === 'Enter' || e.key === ' ') && el && el.getAttribute && el.getAttribute('role') === 'button' && el.tagName === 'path') { e.preventDefault(); var ev = document.createEvent('MouseEvents'); ev.initEvent('click', true, true); el.dispatchEvent(ev); } });
    global.addEventListener('hashchange', function () { if (EMBED) return; var k = (location.hash || '').replace('#', ''); if (/^(empleo|suelo|insumos|vendimia)$/.test(k) && k !== STATE.tab) { STATE.tab = k; render(); } });
    if (!EMBED && S.init) S.init('informacion');   /* cabecera, menu y pie (faltaba: la pagina salia sin ellos) */
    if (!EMBED) S.onLangChange = function () { text(); render(); };
    render();
  }
  global.DIAgreste = { mount: function (el) {
    EMBED = true;
    el.innerHTML = '<section class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.h1)) + '</h2><p class="di-movers-hint">' + esc(tx(T.sub)) + '</p><div id="ag-root"></div><p class="ag-m"><a href="agreste.html">' + esc(tx(T.full)) + '</a></p></section>';
    init();
  } };
  if (document.getElementById('ag-h1')) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init(); }
})(window);
