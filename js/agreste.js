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
    yoy: L('Variación sobre el mismo mes del año anterior', 'Change on the same month a year earlier', 'Variation sur le même mois un an plus tôt', 'Variazione sullo stesso mese di un anno prima'),
    hName: L('Serie', 'Series', 'Série', 'Serie'), hLast: L('Último', 'Latest', 'Dernier', 'Ultimo'), hPer: L('Periodo', 'Period', 'Période', 'Periodo'), hChg: L('Variación', 'Change', 'Variation', 'Variazione'), hFirst: L('Desde el inicio', 'Since the start', 'Depuis le début', 'Dall’inizio'),
    show: L('Pulsa una fila para añadirla o quitarla de la gráfica (hasta 4).', 'Click a row to add or remove it from the chart (up to 4).', 'Cliquez sur une ligne pour l’ajouter ou la retirer du graphique (4 au maximum).', 'Clicca una riga per aggiungerla o toglierla dal grafico (massimo 4).'),
    prov: L('(p) provisional', '(p) provisional', '(p) provisoire', '(p) provvisorio'),
    src: L('Fuente', 'Source', 'Source', 'Fonte'), lic: L('Licence Ouverte 2.0 (Etalab)', 'Licence Ouverte 2.0 (Etalab)', 'Licence Ouverte 2.0 (Etalab)', 'Licence Ouverte 2.0 (Etalab)'),
    data: L('Datos', 'Data', 'Données', 'Dati'), cat2: L('Todas las series de Agreste en el catálogo', 'All Agreste series in the catalogue', 'Toutes les séries d’Agreste dans le catalogue', 'Tutte le serie di Agreste nel catalogo'),
    emptable: { 'etp-categoria': L('Empleo por categoría de activo (ETP)', 'Jobs by type of worker (FTE)', 'Emploi par catégorie d’actif (ETP)', 'Lavoro per categoria di attivo (ETP)'), 'etp-otex': L('Empleo por orientación técnico-económica (ETP)', 'Jobs by farm type (FTE)', 'Emploi par orientation technico-économique (ETP)', 'Lavoro per orientamento tecnico-economico (ETP)'), 'etp-region': L('Empleo por región (ETP)', 'Jobs by region (FTE)', 'Emploi par région (ETP)', 'Lavoro per regione (ETP)'), 'etp-departamento': L('Empleo por departamento (ETP)', 'Jobs by département (FTE)', 'Emploi par département (ETP)', 'Lavoro per dipartimento (ETP)'), 'etp-otex-categoria': L('Empleo por OTEX y categoría (ETP)', 'Jobs by farm type and worker type (FTE)', 'Emploi par OTEX et catégorie (ETP)', 'Lavoro per OTEX e categoria (ETP)'), 'permanentes-otex': L('Activos permanentes por OTEX', 'Permanent workers by farm type', 'Actifs permanents par OTEX', 'Attivi permanenti per OTEX'), 'permanentes-region': L('Activos permanentes por región', 'Permanent workers by region', 'Actifs permanents par région', 'Attivi permanenti per regione'), 'salario-otex': L('Salario bruto horario por OTEX (€/h)', 'Gross hourly wage by farm type (€/h)', 'Salaire brut horaire par OTEX (€/h)', 'Salario lordo orario per OTEX (€/h)'), 'salario-region': L('Salario bruto horario por región (€/h)', 'Gross hourly wage by region (€/h)', 'Salaire brut horaire par région (€/h)', 'Salario lordo orario per regione (€/h)') },
    emphint: L('ETP = equivalentes a tiempo completo. Estimaciones de Agreste a partir del Censo Agrario; el último año es provisional. Las orientaciones (OTEX), regiones y departamentos se muestran con el nombre de Agreste.', 'FTE = full-time equivalents. Agreste estimates built on the Agricultural Census; the last year is provisional. Farm types (OTEX), regions and départements keep Agreste’s names.', 'ETP = équivalents temps plein. Estimations d’Agreste à partir du recensement agricole ; la dernière année est provisoire. Les OTEX, régions et départements gardent les noms d’Agreste.', 'ETP = equivalenti a tempo pieno. Stime di Agreste basate sul Censimento agricolo; l’ultimo anno è provvisorio. OTEX, regioni e dipartimenti mantengono i nomi di Agreste.'),
    suehint: L('Hectáreas según la encuesta TERUTI-Lucas (series largas desde 1982). Departamentos: 3 grandes usos; regiones: 13 usos. Guadalupe, Martinica, Reunión, Guayana y Mayotte empiezan más tarde.', 'Hectares from the TERUTI-Lucas survey (long series since 1982). Départements: 3 main uses; regions: 13 uses. Guadeloupe, Martinique, Réunion, Guyane and Mayotte start later.', 'Hectares selon l’enquête TERUTI-Lucas (séries longues depuis 1982). Départements : 3 grands usages ; régions : 13 usages. La Guadeloupe, la Martinique, La Réunion, la Guyane et Mayotte commencent plus tard.', 'Ettari secondo l’indagine TERUTI-Lucas (serie lunghe dal 1982). Dipartimenti: 3 usi principali; regioni: 13 usi. Guadalupa, Martinica, Riunione, Guyana e Mayotte iniziano più tardi.'),
    deps: L('Departamentos (3 usos)', 'Départements (3 uses)', 'Départements (3 usages)', 'Dipartimenti (3 usi)'), regs: L('Regiones (13 usos)', 'Regions (13 uses)', 'Régions (13 usages)', 'Regioni (13 usi)'),
    insuhint: L('Índice de precios de los medios de producción agrícola (IPAMPA), base 100 = 2020, Francia mensual. Los productos van en jerarquía: sangrado = subproducto. Un valor de 120 significa un 20 % más caro que la media de 2020.', 'Index of agricultural input prices (IPAMPA), base 100 = 2020, France, monthly. Products are hierarchical: indentation = sub-product. A value of 120 means 20 % dearer than the 2020 average.', 'Indice des prix d’achat des moyens de production agricole (IPAMPA), base 100 = 2020, France, mensuel. Les produits sont hiérarchisés : retrait = sous-produit. Une valeur de 120 signifie 20 % de plus que la moyenne 2020.', 'Indice dei prezzi dei mezzi di produzione agricola (IPAMPA), base 100 = 2020, Francia, mensile. I prodotti sono gerarchici: rientro = sottoprodotto. Un valore di 120 significa il 20 % in più della media 2020.'),
    byreg: L('Por región (media anual)', 'By region (annual average)', 'Par région (moyenne annuelle)', 'Per regione (media annuale)'), curYear: L('El año en curso es la media de los meses publicados.', 'The current year is the average of the months published.', 'L’année en cours est la moyenne des mois publiés.', 'L’anno in corso è la media dei mesi pubblicati.'),
    vinhint: L('Producción de vino en miles de hectolitros por cuenca vitivinícola. «Tous bassins» es el total de Francia; el último año es la estimación de la campaña en curso.', 'Wine production in thousand hectolitres by wine region. “Tous bassins” is the France total; the latest year is the estimate for the current harvest.', 'Production de vin en milliers d’hectolitres par bassin viticole. « Tous bassins » est le total France ; la dernière année est l’estimation de la récolte en cours.', 'Produzione di vino in migliaia di ettolitri per bacino viticolo. «Tous bassins» è il totale Francia; l’ultimo anno è la stima della vendemmia in corso.'),
    vcat: { 'vinconj-1': L('Total vinos', 'Total wine', 'Total vins', 'Totale vini'), 'vinconj-111': L('Vinos AOP y VDN AOP', 'PDO wines and PDO sweet wines', 'Vins AOP et VDN AOP', 'Vini DOP e VDN DOP'), 'vinconj-112': L('Cosecha para eaux-de-vie (destilación)', 'Harvest for eaux-de-vie (distillation)', 'Récolte pour eaux-de-vie', 'Raccolto per acqueviti (distillazione)'), 'vinconj-113': L('Vinos IGP', 'PGI wines', 'Vins IGP', 'Vini IGP'), 'vinconj-114': L('Vinos sin IG y sin clasificar', 'Wines without GI and unclassified', 'Vins sans IG et non classés', 'Vini senza IG e non classificati') },
    vtotal: L('Total Francia', 'France total', 'Total France', 'Totale Francia'),
    uHa: L('ha', 'ha', 'ha', 'ha'), uIdx: L('índice', 'index', 'indice', 'indice'), uKhl: L('miles de hl', 'thousand hl', 'milliers d’hl', 'migliaia di hl'), uEtp: L('ETP', 'FTE', 'ETP', 'ETP'), uPers: L('personas', 'people', 'personnes', 'persone'), uEur: L('€/h', '€/h', '€/h', '€/h'),
    usoName: { '1': L('Suelos artificializados', 'Artificial land', 'Sols artificialisés', 'Suoli artificializzati'), '2': L('Suelos agrícolas', 'Agricultural land', 'Sols agricoles', 'Suoli agricoli'), '3': L('Suelos naturales', 'Natural land', 'Sols naturels', 'Suoli naturali') }
  };
  var CACHE = {}, STATE = { tab: 'empleo', sel: {} }, BASE = 'data/france-agreste-more/';
  function load(f) { if (CACHE[f]) return CACHE[f]; return CACHE[f] = fetch(BASE + f, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function tsOf(p) { var y = +p.slice(0, 4), m = p.length > 4 ? +p.slice(5, 7) : 1; return Date.UTC(y, m - 1, 1); }
  function pc(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }
  function chg(v) { if (v == null) return '<span class="ag-m">—</span>'; var up = v > 0.049, dn = v < -0.049; return '<span class="ag-chg ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲ +' : dn ? '▼ −' : '■ ') + nf(Math.abs(v), 1) + ' %</span>'; }
  function cleanLab(s) { return String(s).replace(/ \(B\.2020\)$/, '').replace(/ - Réapparaît.*$/, ''); }
  function usoLab(s) { var m = /^(.*) - ([123])- (.*)$/.exec(s); if (m) return m[1] + ' · ' + tx(T.usoName[m[2]]); var k = /^([123])- /.exec(s); return k ? tx(T.usoName[k[1]]) : s; }
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
      return { id: s.id, label: lab ? lab(s) : s.label, points: p, last: lastP[1], per: lastP[0], prov: s.provisional, depth: s.depth, chg: prev ? pc(lastP[1], prev[1]) : null, chgFirst: n > 1 ? pc(lastP[1], p[0][1]) : null };
    });
  }
  function selectHtml(id, label, opts, cur) {
    return '<label class="ag-lab" for="' + id + '">' + esc(label) + '</label><select id="' + id + '" class="di-field-input ag-sel">' + opts.map(function (o) { return o.group ? '<optgroup label="' + esc(o.group) + '">' + o.items.map(function (i) { return '<option value="' + esc(i[0]) + '"' + (i[0] === cur ? ' selected' : '') + '>' + esc(i[1]) + '</option>'; }).join('') + '</optgroup>' : '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
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
    var opts = [{ group: tx(T.deps), items: france.concat(others).map(function (n) { return ['D:' + n, n]; }) }, { group: tx(T.regs), items: rorder.map(function (n) { return ['R:' + n, n]; }) }];
    var isReg = cur.charAt(0) === 'R', nm = cur.slice(2), ser = (isReg ? regs : groups)[nm];
    if (!ser) { cur = STATE.terr = 'D:France métropolitaine'; nm = 'France métropolitaine'; ser = groups[nm]; isReg = false; }
    var rows = rowsOf(ser, function (s) { return isReg ? s.label.split(' - ').slice(1).join(' - ').replace(/^\d+- /, '') : tx(T.usoName[(/- ([123])- /.exec(s.label) || [0, '2'])[1]]); });
    return '<p class="di-movers-hint">' + esc(tx(T.suehint)) + '</p><div class="ag-pick">' + selectHtml('ag-terr', tx(T.terr), opts, cur) + '</div>' +
      block('sue-' + cur, rows, { unit: tx(T.uHa), dec: 0, aria: nm, defSel: isReg ? [rows[0].id] : rows.map(function (r) { return r.id; }).slice(0, 3), first: true }) + head(d);
  }
  function insumos(d) {
    var ser = d.tables[0].series, cur = STATE.prod || ser[0].id;
    if (!ser.some(function (s) { return s.id === cur; })) cur = ser[0].id;
    var s0 = ser.filter(function (s) { return s.id === cur; })[0];
    var opts = ser.map(function (s) { return [s.id, new Array((s.depth || 0) + 1).join('· ') + cleanLab(s.label)]; });
    var rows = rowsOf([s0], function (s) { return cleanLab(s.label); });
    var r0 = rows[0], yoy = null; r0.points.forEach(function (p) { if (p[0] === (+r0.per.slice(0, 4) - 1) + r0.per.slice(4)) yoy = p[1]; });
    r0.chg = pc(r0.last, yoy);
    var base = '<p class="di-movers-hint">' + esc(tx(T.insuhint)) + '</p><div class="ag-pick">' + selectHtml('ag-prod', tx(T.prod), opts, cur) + '</div>' +
      block('ins-' + cur, rows, { unit: tx(T.uIdx), dec: 1, monthly: true, aria: cleanLab(s0.label) }) + '<p class="ag-m">' + esc(tx(T.yoy)) + ': ' + chg(r0.chg) + ' (' + esc(r0.per) + ')</p>';
    return base + '<h2 class="ag-h2">' + esc(tx(T.byreg)) + '</h2><div id="ag-reg">' + esc(tx(T.loading)) + '</div>' + head(d);
  }
  function insumosReg(d, id) {
    var rows = [], code = id.split('-').pop();
    d.tables.forEach(function (t) { t.series.forEach(function (s) { if (s.id.slice(-code.length - 1) === '-' + code && s.points.length) rows = rows.concat(rowsOf([s], function () { return t.label.replace(/ \(1\)$/, ''); })); }); });
    if (!rows.length) return '';
    var key = 'insreg-' + id;
    return block(key, rows, { unit: tx(T.uIdx), dec: 1, sort: true, aria: tx(T.byreg), defSel: rows.slice(0, 3).map(function (r) { return r.id; }), first: true }) + '<p class="ag-m">' + esc(tx(T.curYear)) + '</p>';
  }
  function vendimia(d) {
    var cur = STATE.vcat || d.tables[0].id, t = d.tables.filter(function (x) { return x.id === cur; })[0] || d.tables[0];
    var opts = d.tables.map(function (x) { return [x.id, T.vcat[x.id] ? tx(T.vcat[x.id]) : x.label]; });
    var rows = rowsOf(t.series, function (x) { return /^Tous/.test(x.label) ? tx(T.vtotal) : x.label; });
    var tot = rows.filter(function (r) { return r.label === tx(T.vtotal); })[0];
    return '<p class="di-movers-hint">' + esc(tx(T.vinhint)) + '</p><div class="ag-pick">' + selectHtml('ag-vcat', tx(T.cat), opts, t.id) + '</div>' +
      block('vin-' + t.id, rows, { unit: tx(T.uKhl), dec: 0, sort: true, defSel: tot ? [tot.id] : [rows[0].id], first: true, aria: T.vcat[t.id] ? tx(T.vcat[t.id]) : t.label }) + head(d);
  }

  /* ---- montaje ---- */
  function bodyEl() { return document.getElementById('ag-body'); }
  function paint(html) { var b = bodyEl(); if (b) b.innerHTML = html; }
  function render() {
    var tab = STATE.tab;
    var bar = '<div class="di-tabs-bar" role="tablist">' + ['empleo', 'suelo', 'insumos', 'vendimia'].map(function (k) { return '<button type="button" role="tab" class="di-tab-btn' + (k === tab ? ' active' : '') + '" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + esc(tx(T.tabs[k])) + '</button>'; }).join('') + '</div>';
    var root = document.getElementById('ag-root'); root.innerHTML = bar + '<div id="ag-body" role="tabpanel">' + esc(tx(T.loading)) + '</div>';
    var file = { empleo: 'empleo.json', suelo: 'teruti.json', insumos: 'ipampa-fr.json', vendimia: 'vinconj.json' }[tab];
    load(file).then(function (d) {
      if (STATE.tab !== tab) return;
      if (!d || !d.tables) { paint('<p class="ag-m">' + esc(tx(T.fail)) + '</p>'); return; }
      paint({ empleo: empleo, suelo: suelo, insumos: insumos, vendimia: vendimia }[tab](d));
      if (tab === 'insumos') load('ipampa-regiones.json').then(function (r) { var el = document.getElementById('ag-reg'); if (!el || STATE.tab !== 'insumos') return; el.innerHTML = r && r.tables ? (insumosReg(r, STATE.prod || d.tables[0].series[0].id) || '<p class="ag-m">—</p>') : '<p class="ag-m">' + esc(tx(T.fail)) + '</p>'; });
    });
  }
  function init() {
    var sub = document.getElementById('ag-sub'), h1 = document.getElementById('ag-h1');
    function text() { if (h1) h1.textContent = tx(T.h1); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.h1) + ' | Dehesa Index'; var cat = document.getElementById('ag-cat'); if (cat) cat.textContent = tx(T.cat2); }
    text();
    var h = (location.hash || '').replace('#', ''); if (/^(empleo|suelo|insumos|vendimia)$/.test(h)) STATE.tab = h;
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-tab],[data-k]') : null; if (!b) return;
      if (b.getAttribute('data-tab')) { STATE.tab = b.getAttribute('data-tab'); try { history.replaceState(null, '', '#' + STATE.tab); } catch (x) { /* sin history */ } render(); return; }
      var k = b.getAttribute('data-k'), id = b.getAttribute('data-id'), sel = STATE.sel[k] || [], i = sel.indexOf(id);
      if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } else { sel.push(id); if (sel.length > 4) sel.shift(); }
      STATE.sel[k] = sel; var d = CACHE[{ empleo: 'empleo.json', suelo: 'teruti.json', insumos: 'ipampa-fr.json', vendimia: 'vinconj.json' }[STATE.tab]];
      if (STATE.tab === 'insumos') { rerenderInsumos(); return; }
      if (d) d.then(function (dd) { paint({ empleo: empleo, suelo: suelo, vendimia: vendimia }[STATE.tab](dd)); });
    });
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t || !t.id) return;
      if (t.id === 'ag-emp') STATE.emp = t.value; else if (t.id === 'ag-terr') STATE.terr = t.value; else if (t.id === 'ag-prod') STATE.prod = t.value; else if (t.id === 'ag-vcat') STATE.vcat = t.value; else return;
      if (t.id === 'ag-prod') { rerenderInsumos(); return; }
      var d = CACHE[{ empleo: 'empleo.json', suelo: 'teruti.json', vendimia: 'vinconj.json' }[STATE.tab]]; if (d) d.then(function (dd) { paint({ empleo: empleo, suelo: suelo, vendimia: vendimia }[STATE.tab](dd)); });
    });
    function rerenderInsumos() { render(); }
    global.addEventListener('hashchange', function () { var k = (location.hash || '').replace('#', ''); if (/^(empleo|suelo|insumos|vendimia)$/.test(k) && k !== STATE.tab) { STATE.tab = k; render(); } });
    S.onLangChange = function () { text(); render(); };
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
