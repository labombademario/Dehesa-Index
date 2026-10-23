/* Dehesa Index — Países Bajos · CBS: facturación de las explotaciones, invernaderos y flores, nitrógeno y política agraria, cadena de precios y otros (netherlands.html). ES5.
   Datos: data/netherlands-more/{omzet,horticultura,nitrogeno,cadena,otros}.json (scripts/update-nl-cbs-more.py), Statistics Netherlands (CBS), CC BY 4.0.
   Cada pestaña descarga su fichero solo al abrirse. Un dato ausente se muestra como ausente; la facturación es volumen de negocio, no un precio. */
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
    h1: L('Países Bajos · CBS: facturación, invernaderos, nitrógeno y cadena de precios', 'Netherlands · CBS: turnover, glasshouses, nitrogen and the price chain', 'Pays-Bas · CBS : chiffre d’affaires, serres, azote et chaîne de prix', 'Paesi Bassi · CBS: fatturato, serre, azoto e filiera dei prezzi'),
    sub: L('Cinco conjuntos del Instituto de Estadística de los Países Bajos (CBS), tal como los publica: facturación trimestral de las explotaciones, horticultura bajo cristal y bulbos, balance de nitrógeno y estiércol, precios de la industria y del consumo, y otras series. Las series de precios agrarios, cereales, leche y ganado de este país están en el catálogo.', 'Five datasets from Statistics Netherlands (CBS), as published: quarterly farm turnover, glasshouse horticulture and bulbs, the nitrogen and manure balance, industry and consumer prices, and other series. The country’s farm prices, grains, milk and livestock series are in the catalogue.', 'Cinq jeux de données de l’Institut néerlandais de statistique (CBS), tels que publiés : chiffre d’affaires trimestriel des exploitations, horticulture sous serre et bulbes, bilan d’azote et d’effluents, prix de l’industrie et à la consommation, et autres séries. Les séries de prix agricoles, céréales, lait et élevage du pays sont dans le catalogue.', 'Cinque insiemi di dati dell’Istituto di statistica dei Paesi Bassi (CBS), come pubblicati: fatturato trimestrale delle aziende, orticoltura in serra e bulbi, bilancio di azoto e letame, prezzi dell’industria e al consumo, e altre serie. Le serie di prezzi agricoli, cereali, latte e bestiame del paese sono nel catalogo.'),
    tabs: { omzet: L('💶 Facturación', '💶 Turnover', '💶 Chiffre d’affaires', '💶 Fatturato'), horti: L('🌷 Invernaderos y flores', '🌷 Glasshouses and flowers', '🌷 Serres et fleurs', '🌷 Serre e fiori'), nitro: L('🌿 Nitrógeno y política', '🌿 Nitrogen and policy', '🌿 Azote et politique', '🌿 Azoto e politica'), cadena: L('🛒 Cadena de precios', '🛒 Price chain', '🛒 Chaîne de prix', '🛒 Filiera dei prezzi'), otros: L('🥕 Otros', '🥕 Other', '🥕 Autres', '🥕 Altri') },
    loading: L('Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'), fail: L('No se han podido cargar estos datos. Prueba de nuevo en unos minutos.', 'These data could not be loaded. Try again in a few minutes.', 'Ces données n’ont pas pu être chargées. Réessayez dans quelques minutes.', 'Impossibile caricare questi dati. Riprova tra qualche minuto.'),
    pick: L('Tabla', 'Table', 'Tableau', 'Tabella'), grp: L('Grupo de explotaciones', 'Farm group', 'Groupe d’exploitations', 'Gruppo di aziende'), full: L('Abrir en página completa', 'Open as a full page', 'Ouvrir en pleine page', 'Apri a pagina intera'),
    hName: L('Serie', 'Series', 'Série', 'Serie'), hLast: L('Último', 'Latest', 'Dernier', 'Ultimo'), hPer: L('Periodo', 'Period', 'Période', 'Periodo'), hChg: L('Variación anual', 'Annual change', 'Variation annuelle', 'Variazione annua'), hFirst: L('Desde el inicio', 'Since the start', 'Depuis le début', 'Dall’inizio'),
    show: L('Pulsa una fila para añadirla o quitarla de la gráfica (hasta 4).', 'Click a row to add or remove it from the chart (up to 4).', 'Cliquez sur une ligne pour l’ajouter ou la retirer du graphique (4 au maximum).', 'Clicca una riga per aggiungerla o toglierla dal grafico (massimo 4).'),
    prov: L('(p) provisional', '(p) provisional', '(p) provisoire', '(p) provvisorio'),
    src: L('Fuente', 'Source', 'Source', 'Fonte'), data: L('Datos', 'Data', 'Données', 'Dati'), cat2: L('Todas las series del CBS en el catálogo', 'All CBS series in the catalogue', 'Toutes les séries du CBS dans le catalogue', 'Tutte le serie del CBS nel catalogo'),
    hint: {
      omzet: L('La facturación (omzet) es el volumen de negocio de las explotaciones en millones de euros por trimestre. No es un precio: sube con el volumen vendido o con los precios, y es estacional (el 2.º trimestre es el más alto en hortícolas). Los dos últimos trimestres son provisionales. Los totales por grupo (herbáceos, horticultura, pastoreo, intensivos) el CBS solo los publica por ahora para el último trimestre.', 'Turnover (omzet) is the farms’ sales volume in millions of euros per quarter. It is not a price: it rises with volume sold or with prices, and it is seasonal (Q2 is the highest for horticulture). The last two quarters are provisional. For now the CBS publishes the group totals (arable, horticulture, grazing, intensive) only for the latest quarter.', 'Le chiffre d’affaires (omzet) est le volume d’affaires des exploitations en millions d’euros par trimestre. Ce n’est pas un prix : il monte avec les volumes vendus ou avec les prix et il est saisonnier (le 2e trimestre est le plus haut en horticulture). Les deux derniers trimestres sont provisoires. Le CBS ne publie pour l’instant les totaux par groupe (grandes cultures, horticulture, herbivores, hors-sol) que pour le dernier trimestre.', 'Il fatturato (omzet) è il volume d’affari delle aziende in milioni di euro per trimestre. Non è un prezzo: sale con i volumi venduti o con i prezzi ed è stagionale (il 2º trimestre è il più alto per l’orticoltura). Gli ultimi due trimestri sono provvisori. Per ora il CBS pubblica i totali per gruppo (seminativi, orticoltura, erbivori, intensivi) solo per l’ultimo trimestre.'),
      horti: L('Superficie en hectáreas del país que más exporta flores, plantas y hortalizas de invernadero. «Bajo cristal» son los invernaderos de vidrio; el resto de series muestran champiñón (superficie en ha y sustrato), endibia forzada (witlof) y forzado de bulbos.', 'Area in hectares in the country that exports most glasshouse flowers, plants and vegetables. “Glasshouse” means glass greenhouses; the other series show mushrooms (area in ha and substrate), forced chicory (witloof) and bulb forcing.', 'Surface en hectares du pays qui exporte le plus de fleurs, de plantes et de légumes de serre. « Sous serre » désigne les serres en verre ; les autres séries montrent le champignon (surface en ha et substrat), l’endive forcée (witloof) et le forçage de bulbes.', 'Superficie in ettari del paese che più esporta fiori, piante e ortaggi di serra. «In serra» indica le serre di vetro; le altre serie mostrano il champignon (superficie in ha e substrato), la cicoria forzata (witloof) e la forzatura dei bulbi.'),
      nitro: L('El tema político central del país: balance de nitrógeno y fósforo de la agricultura, estiércol y amoníaco por tipo de explotación, provincia y animal, estiércol colocado fuera de la agricultura, fitosanitarios vendidos y derechos de producción de cerdos y aves. Un excedente alto de nitrógeno o fosfato limita la actividad ganadera.', 'The country’s central policy issue: nitrogen and phosphorus balance of agriculture, manure and ammonia by farm type, province and animal, manure placed outside agriculture, plant-protection products sold and pig and poultry production rights. A high nitrogen or phosphate surplus limits livestock activity.', 'Le sujet politique central du pays : bilan d’azote et de phosphore de l’agriculture, effluents et ammoniac par type d’exploitation, province et animal, effluents placés hors agriculture, produits phytosanitaires vendus et droits de production de porcs et de volailles. Un excédent élevé d’azote ou de phosphate limite l’élevage.', 'Il tema politico centrale del paese: bilancio di azoto e fosforo dell’agricoltura, letame e ammoniaca per tipo di azienda, provincia e animale, letame collocato fuori dall’agricoltura, prodotti fitosanitari venduti e diritti di produzione di suini e avicoli. Un’eccedenza alta di azoto o fosfato limita l’allevamento.'),
      cadena: L('De la industria al supermercado: índice de precios de productor (PPI) de la industria alimentaria, base 2021 = 100, e IPC de alimentos al consumidor, base 2025 = 100. Las dos bases son distintas: compara la forma de las curvas y las variaciones anuales, no los niveles.', 'From factory to supermarket: producer price index (PPI) of the food industry, 2021 = 100, and consumer food prices, 2025 = 100. The two bases differ: compare the shape of the curves and the annual changes, not the levels.', 'De l’usine au supermarché : indice des prix à la production (PPI) de l’industrie alimentaire, base 2021 = 100, et prix à la consommation des aliments, base 2025 = 100. Les deux bases diffèrent : comparez la forme des courbes et les variations annuelles, pas les niveaux.', 'Dalla fabbrica al supermercato: indice dei prezzi alla produzione (PPI) dell’industria alimentare, base 2021 = 100, e prezzi al consumo degli alimenti, base 2025 = 100. Le due basi sono diverse: confronta la forma delle curve e le variazioni annue, non i livelli.'),
      otros: L('Hortalizas por especie, pastoreo de las vacas de leche, huevos ecológicos y convencionales, finanzas de las explotaciones (activo, deuda, resultado; ecológico frente a convencional) y cuánto se corrige la estimación de cosecha entre la provisional y la definitiva.', 'Vegetables by species, dairy-cow grazing, organic and conventional eggs, farm finances (assets, debt, result; organic vs conventional) and how much the harvest estimate is revised between provisional and final.', 'Légumes par espèce, pâturage des vaches laitières, œufs biologiques et conventionnels, finances des exploitations (actif, dette, résultat ; bio contre conventionnel) et ampleur de la révision de l’estimation de récolte entre provisoire et définitive.', 'Ortaggi per specie, pascolo delle vacche da latte, uova biologiche e convenzionali, finanze delle aziende (attivo, debiti, risultato; biologico e convenzionale) e quanto viene corretta la stima del raccolto tra provvisoria e definitiva.')
    },
    mapBase: L('Pasa el ratón o toca una provincia para ver su dato; púlsala para añadirla o quitarla de la gráfica.', 'Hover or tap a province to see its figure; click it to add or remove it from the chart.', 'Survolez ou touchez une province pour voir son chiffre ; cliquez pour l’ajouter ou la retirer du graphique.', 'Passa il mouse o tocca una provincia per vedere il dato; cliccaci per aggiungerla o toglierla dal grafico.'),
    mapNone: L('Sin dato', 'No data', 'Sans donnée', 'Senza dato'), grpName: {
      omzet: L('Facturación y explotaciones', 'Turnover and farms', 'Chiffre d’affaires et exploitations', 'Fatturato e aziende'),
      inv: L('Bajo cristal', 'Glasshouse', 'Sous serre', 'In serra'), air: L('Al aire libre', 'Open field', 'Plein champ', 'Pieno campo'), oth: L('Setas, endibia y bulbos', 'Mushrooms, chicory and bulbs', 'Champignons, endive et bulbes', 'Funghi, cicoria e bulbi'),
      bal: L('Balance de minerales', 'Mineral balance', 'Bilan minéral', 'Bilancio minerale'), man: L('Estiércol y amoníaco', 'Manure and ammonia', 'Effluents et ammoniac', 'Letame e ammoniaca'), pes: L('Fitosanitarios', 'Plant protection', 'Phytosanitaires', 'Fitosanitari'), rig: L('Derechos de producción', 'Production rights', 'Droits de production', 'Diritti di produzione'),
      ppi: L('Precios de la industria (PPI)', 'Industry prices (PPI)', 'Prix de l’industrie (PPI)', 'Prezzi dell’industria (PPI)'), cpi: L('Precios al consumo (IPC)', 'Consumer prices (CPI)', 'Prix à la consommation (IPC)', 'Prezzi al consumo (IPC)'),
      veg: L('Hortalizas', 'Vegetables', 'Légumes', 'Ortaggi'), gra: L('Pastoreo', 'Grazing', 'Pâturage', 'Pascolo'), egg: L('Huevos', 'Eggs', 'Œufs', 'Uova'), fin: L('Finanzas de las explotaciones', 'Farm finances', 'Finances des exploitations', 'Finanze delle aziende'), est: L('Cosecha: provisional frente a definitiva', 'Harvest: provisional vs final', 'Récolte : provisoire et définitive', 'Raccolto: provvisorio e definitivo')
    }
  };
  var FILE = { omzet: 'omzet.json', horti: 'horticultura.json', nitro: 'nitrogeno.json', cadena: 'cadena.json', otros: 'otros.json' };
  var CACHE = {}, STATE = { tab: 'omzet', sel: {}, tid: {} }, BASE = 'data/netherlands-more/', COLORS = ['#1d5178', '#a9491f', '#2e7d5b', '#7a4a8c'];
  function load(f) { if (CACHE[f]) return CACHE[f]; return CACHE[f] = fetch(BASE + f, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function tsOf(p) { var y = +p.slice(0, 4), q = /-Q(\d)$/.exec(p), m = q ? (+q[1] - 1) * 3 + 1 : p.length > 4 ? +p.slice(5, 7) : 1; return Date.UTC(y, m - 1, 1); }
  function pc(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }
  function chg(v) { if (v == null) return '<span class="ag-m">—</span>'; var up = v > 0.049, dn = v < -0.049; return '<span class="ag-chg ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲ +' : dn ? '▼ −' : '■ ') + nf(Math.abs(v), 1) + ' %</span>'; }
  function lab(o) { var l = lg(); return l === 'es' || !o.l ? o.label : (o.l[l] || o.label); }
  function groupOf(tid) {
    if (/^omzet|^explotaciones/.test(tid)) return 'omzet';
    if (/^invernadero/.test(tid)) return 'inv'; if (/^aire-libre/.test(tid)) return 'air'; if (/^otros-/.test(tid) && STATE.tab === 'horti') return 'oth';
    if (/^balance|^eficiencia/.test(tid)) return 'bal'; if (/^estiercol|^animal/.test(tid)) return 'man'; if (/^fitosanitarios/.test(tid)) return 'pes'; if (/^derechos/.test(tid)) return 'rig';
    if (/^ppi/.test(tid)) return 'ppi'; if (/^ipc/.test(tid)) return 'cpi';
    if (/^hortalizas/.test(tid)) return 'veg'; if (/^pastoreo/.test(tid)) return 'gra'; if (/^huevos/.test(tid)) return 'egg'; if (/^finanzas/.test(tid)) return 'fin'; if (/^estimacion/.test(tid)) return 'est';
    return 'omzet';
  }
  function fold(s) { s = String(s).toLowerCase(); try { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { return s; } }
  function quant(vals) { var v = vals.slice().sort(function (a, b) { return a - b; }), q = []; for (var i = 1; i < 5; i++) q.push(v[Math.min(v.length - 1, Math.floor(i * v.length / 5))]); return q; }
  function cls(v, cuts) { if (v == null) return 'gb-cx'; for (var i = 0; i < cuts.length; i++) if (v < cuts[i]) return 'gb-c' + i; return 'gb-c' + cuts.length; }
  function legend(cuts, lo, hi, fmt) { return '<div class="wp-legend gb-leg">' + [0, 1, 2, 3, 4].map(function (i) { return '<span><i class="gb-key gb-c' + i + '"></i>' + esc(fmt(i ? cuts[i - 1] : lo) + '–' + fmt(i < 4 ? cuts[i] : hi)) + '</span>'; }).join('') + '<span><i class="gb-key gb-cx"></i>' + esc(tx(T.mapNone)) + '</span></div>'; }
  var MAPP = null;
  function needMap() { if (global.DEHESA_NL_PROVINCES) return Promise.resolve(global.DEHESA_NL_PROVINCES); return MAPP || (MAPP = new Promise(function (ok) { var sc = document.createElement('script'); sc.src = 'vendor/nl-provinces.js'; sc.onload = function () { ok(global.DEHESA_NL_PROVINCES || null); }; sc.onerror = function () { ok(null); }; document.head.appendChild(sc); })); }
  var PVMAP = { GR: 'pv20', FR: 'pv21', DR: 'pv22', OV: 'pv23', FL: 'pv24', GE: 'pv25', UT: 'pv26', NH: 'pv27', ZH: 'pv28', ZE: 'pv29', NB: 'pv30', LI: 'pv31' };
  function rowsOf(t) {
    return t.series.map(function (s) {
      var p = s.points, n = p.length, lastP = p[n - 1], per = lastP[0], ann = per.length === 4, y1 = (+per.slice(0, 4) - 1) + per.slice(4), prev = null;
      p.forEach(function (x) { if (x[0] === y1) prev = x[1]; });
      return { id: s.id, label: lab(s), nl: s.nl, points: p, last: lastP[1], per: per, prov: s.provisional, chg: pc(lastP[1], prev), chgFirst: n > 1 ? pc(lastP[1], p[0][1]) : null, ann: ann };
    });
  }
  function decOf(rows, unit) { return /índice|%/.test(unit || '') || rows.every(function (r) { return Math.abs(r.last) < 100; }) ? 1 : 0; }
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
    return '<label class="ag-lab" for="' + id + '">' + esc(label) + '</label><select id="' + id + '" class="di-field-input ag-sel">' + opts.map(function (o) { return o.group ? '<optgroup label="' + esc(o.group) + '">' + o.items.map(function (i) { return '<option value="' + esc(i[0]) + '"' + (i[0] === cur ? ' selected' : '') + '>' + esc(i[1]) + '</option>'; }).join('') + '</optgroup>' : '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }
  function head(d) { return '<p class="ag-m">' + esc(tx(T.src)) + ': Statistics Netherlands (CBS) · ' + esc(d.edition || '') + ' · CC BY 4.0</p>'; }
  /* ---- una pestaña = un fichero con varias tablas ---- */
  function tab(d) {
    var tabk = STATE.tab, cur = STATE.tid[tabk], t = d.tables.filter(function (x) { return x.id === cur; })[0] || d.tables[0];
    STATE.tid[tabk] = t.id;
    var order = [], groups = {};
    d.tables.forEach(function (x) { var g = groupOf(x.id); if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push([x.id, lab(x)]); });
    var opts = order.length > 1 ? order.map(function (g) { return { group: tx(T.grpName[g]), items: groups[g] }; }) : d.tables.map(function (x) { return [x.id, lab(x)]; });
    var rows = rowsOf(t), isProv = rows.some(function (r) { return /-pv\d\d(-|$)/.test(r.id); }), pick = '', gsel = '';
    if (t.id === 'omzet-provincia') {
      var gset = []; rows.forEach(function (r) { var g = r.id.replace(/^nl-pv\d\d-/, ''); if (gset.indexOf(g) < 0) gset.push(g); });
      var gname = {}; t.series.forEach(function (s) { var g = s.id.replace(/^nl-pv\d\d-/, ''); if (!gname[g]) gname[g] = (lab(s).split(': ')[1] || g); });
      var g0 = STATE.grp && gset.indexOf(STATE.grp) >= 0 ? STATE.grp : gset[0]; STATE.grp = g0;
      gsel = selectHtml('nl-grp', tx(T.grp), gset.map(function (g) { return [g, gname[g]]; }), g0);
      rows = rows.filter(function (r) { return r.id.slice(-g0.length) === g0; });
      rows.forEach(function (r) { r.label = r.label.split(': ')[0]; });
    } else if (isProv) { rows.forEach(function (r) { r.label = r.label.split(': ')[0]; }); }
    var unit = t.unit, key = tabk + '-' + t.id + (STATE.grp && t.id === 'omzet-provincia' ? '-' + STATE.grp : '');
    var defSel = t.id === 'omzet-provincia' ? [rows[0].id] : rows.slice(0, 2).map(function (r) { return r.id; });
    var inner = block(key, rows, { unit: unit, aria: lab(t), sort: rows.length > 12 || isProv, defSel: defSel });
    pick = '<div class="ag-pick">' + selectHtml('nl-tab', tx(T.pick), opts, t.id) + gsel + '</div>';
    var note = '';
    if (isProv) {
      setTimeout(function () { drawMap(key, rows, unit); }, 0);
      return '<p class="di-movers-hint">' + esc(tx(T.hint[tabk])) + '</p>' + pick + '<div class="ag-vgrid"><div class="ag-vmap ag-land nl-map"><div id="nl-map"></div></div><div class="ag-vdata">' + inner + '</div></div>' + note + head(d);
    }
    return '<p class="di-movers-hint">' + esc(tx(T.hint[tabk])) + '</p>' + pick + inner + note + head(d);
  }
  function drawMap(key, rows, unit) {
    needMap().then(function (MAP) {
      var host = document.getElementById('nl-map'); if (!host || !MAP) return;
      var sel = STATE.sel[key] || [], by = {}, vals = [];
      rows.forEach(function (r) { var m = /-(pv\d\d)(-|$)/.exec(r.id); if (m) { by[m[1]] = r; if (r.last != null) vals.push(r.last); } });
      if (!vals.length) { host.innerHTML = ''; return; }
      var cuts = quant(vals), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), dec = decOf(rows, unit);
      var paths = MAP.states.map(function (st) {
        var r = by[PVMAP[st.id]]; if (!r) return '<path class="gb-prov gb-cx ag-bp" d="' + st.d + '" aria-hidden="true"/>';
        var on = sel.indexOf(r.id) >= 0, tip = r.label + ': ' + nf(r.last, dec) + ' ' + unit + ' (' + r.per + ')';
        return '<path class="gb-prov ag-bp ' + cls(r.last, cuts) + (on ? ' ag-on' : '') + '" data-k="' + esc(key) + '" data-id="' + esc(r.id) + '" data-tip="' + esc(tip) + '" tabindex="0" role="button" aria-pressed="' + on + '" aria-label="' + esc(tip) + '" d="' + st.d + '"/>';
      }).join('');
      host.innerHTML = '<svg viewBox="' + MAP.viewBox + '" role="group" aria-label="' + esc(tx(T.tabs[STATE.tab])) + '">' + paths + '</svg>' + legend(cuts, lo, hi, function (v) { return nf(v, dec); }) +
        '<p class="ag-m ag-ro" aria-live="polite" data-base="' + esc(tx(T.mapBase)) + '">' + esc(tx(T.mapBase)) + '</p>';
    });
  }
  /* ---- montaje ---- */
  function paint(html) { var b = document.getElementById('nl-body'); if (b) b.innerHTML = html; }
  function render() {
    var tabk = STATE.tab;
    var bar = '<div class="di-tabs-bar" role="tablist">' + ['omzet', 'horti', 'nitro', 'cadena', 'otros'].map(function (k) { return '<button type="button" role="tab" class="di-tab-btn' + (k === tabk ? ' active' : '') + '" data-tab="' + k + '" aria-selected="' + (k === tabk) + '">' + esc(tx(T.tabs[k])) + '</button>'; }).join('') + '</div>';
    document.getElementById('nl-root').innerHTML = bar + '<div id="nl-body" role="tabpanel">' + esc(tx(T.loading)) + '</div>';
    load(FILE[tabk]).then(function (d) {
      if (STATE.tab !== tabk) return;
      if (!d || !d.tables) { paint('<p class="ag-m">' + esc(tx(T.fail)) + '</p>'); return; }
      paint(tab(d));
    });
  }
  function repaint() { var f = CACHE[FILE[STATE.tab]]; if (f) f.then(function (d) { if (d) paint(tab(d)); }); }
  var BOUND = false, EMBED = false;
  function init() {
    var sub = document.getElementById('nl-sub'), h1 = document.getElementById('nl-h1');
    function text() { if (h1) h1.textContent = tx(T.h1); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.h1) + ' | Dehesa Index'; var cat = document.getElementById('nl-cat'); if (cat) cat.textContent = tx(T.cat2); }
    text();
    var h = (location.hash || '').replace('#', ''); if (!EMBED && /^(omzet|horti|nitro|cadena|otros)$/.test(h)) STATE.tab = h;
    if (BOUND) { render(); return; }
    BOUND = true;
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-tab],[data-k]') : null; if (!b || !document.getElementById('nl-root')) return;
      if (b.getAttribute('data-tab')) { STATE.tab = b.getAttribute('data-tab'); if (!EMBED) { try { history.replaceState(null, '', '#' + STATE.tab); } catch (x) { /* sin history */ } } render(); return; }
      var k = b.getAttribute('data-k'), id = b.getAttribute('data-id'), sel = STATE.sel[k] || [], i = sel.indexOf(id);
      if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } else { sel.push(id); if (sel.length > 4) sel.shift(); }
      STATE.sel[k] = sel; repaint();
    });
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t || !t.id || !document.getElementById('nl-root')) return;
      if (t.id === 'nl-tab') STATE.tid[STATE.tab] = t.value; else if (t.id === 'nl-grp') STATE.grp = t.value; else return;
      repaint();
    });
    function hov(e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null, box = el && el.closest('.ag-vmap'); if (!box) return;
      var ro = box.querySelector('.ag-ro'), old = box.querySelectorAll('.ag-hl'), i; if (ro) ro.textContent = el.getAttribute('data-tip');
      for (i = 0; i < old.length; i++) old[i].classList.remove('ag-hl'); el.classList.add('ag-hl');
    }
    function unhov(e) {
      var box = e.target && e.target.closest ? e.target.closest('.ag-vmap') : null; if (!box || (e.relatedTarget && box.contains(e.relatedTarget))) return;
      var ro = box.querySelector('.ag-ro'), old = box.querySelectorAll('.ag-hl'), i; if (ro) ro.textContent = ro.getAttribute('data-base') || '';
      for (i = 0; i < old.length; i++) old[i].classList.remove('ag-hl');
    }
    document.addEventListener('mouseover', hov); document.addEventListener('focusin', hov); document.addEventListener('mouseout', unhov); document.addEventListener('focusout', unhov);
    document.addEventListener('keydown', function (e) { var el = e.target; if ((e.key === 'Enter' || e.key === ' ') && el && el.getAttribute && el.getAttribute('role') === 'button' && el.tagName === 'path') { e.preventDefault(); var ev = document.createEvent('MouseEvents'); ev.initEvent('click', true, true); el.dispatchEvent(ev); } });
    global.addEventListener('hashchange', function () { if (EMBED) return; var k = (location.hash || '').replace('#', ''); if (/^(omzet|horti|nitro|cadena|otros)$/.test(k) && k !== STATE.tab) { STATE.tab = k; render(); } });
    if (!EMBED && S.init) S.init('informacion');
    if (!EMBED) S.onLangChange = function () { text(); render(); };
    render();
  }
  global.DINetherlands = { mount: function (el) {
    EMBED = true;
    el.innerHTML = '<section class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.h1)) + '</h2><p class="di-movers-hint">' + esc(tx(T.sub)) + '</p><div id="nl-root"></div><p class="ag-m"><a href="netherlands.html">' + esc(tx(T.full)) + '</a></p></section>';
    init();
  } };
  if (document.getElementById('nl-h1')) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init(); }
})(window);
