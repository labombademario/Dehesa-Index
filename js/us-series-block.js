/* Dehesa Index — Bloques de series de EE. UU. con selector (transformación NASS, carne y ganado ERS, leche de las órdenes federales AMS). ES5.
   Cada bloque lee un fichero *-stats.json (formato común: countries.US.series[]) y muestra: categoría -> serie -> gráfica + últimos 12 periodos.
   Los nombres de las series están como los publica la fuente (en inglés). No se calcula nada: cada punto es una cifra publicada. */
(function () {
  'use strict';
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var BLOCKS = {
    npr: { file: 'data/us-nass-processing-stats.json', cite: 'usda_nass', cat: 'colon', url: 'https://esmis.nal.usda.gov/publication/fats-and-oils-oilseed-crushings-production-consumption-and-stocks',
      h: ['Transformación de oleaginosas y maíz en EE. UU.', 'U.S. oilseed and corn processing', 'Transformation des oléagineux et du maïs aux États-Unis', 'Trasformazione di semi oleosi e mais negli USA'],
      sub: ['Soja triturada, aceite y harina producidos, existencias en fábrica, colza, algodón, grasas animales y coproductos del maíz (etanol, DDGS): los informes mensuales Fats and Oils y Grain Crushings del USDA NASS.',
        'Soybeans crushed, oil and meal produced, crusher stocks, canola, cottonseed, animal fats and corn co-products (ethanol, DDGS): USDA NASS monthly Fats and Oils and Grain Crushings reports.',
        'Soja triturée, huile et tourteaux produits, stocks des usines, colza, coton, graisses animales et coproduits du maïs (éthanol, DDGS) : rapports mensuels Fats and Oils et Grain Crushings de l’USDA NASS.',
        'Soia triturata, olio e farina prodotti, scorte negli impianti, colza, cotone, grassi animali e coprodotti del mais (etanolo, DDGS): rapporti mensili Fats and Oils e Grain Crushings dell’USDA NASS.'],
      note: ['NASS retiene algunas cifras por confidencialidad (hueco en la serie) y revisa el mes anterior en cada informe; aquí gana siempre la última cifra publicada. El historial empieza en enero de 2025 y crece con cada informe mensual.',
        'NASS withholds some figures for confidentiality (a gap in the series) and revises the previous month in each report; the latest published figure always wins here. The history starts in January 2025 and grows with each monthly report.',
        'Le NASS retient certains chiffres pour des raisons de confidentialité (trou dans la série) et révise le mois précédent à chaque rapport ; c’est toujours le dernier chiffre publié qui l’emporte. L’historique commence en janvier 2025 et s’allonge à chaque rapport mensuel.',
        'Il NASS trattiene alcune cifre per riservatezza (vuoto nella serie) e rivede il mese precedente a ogni rapporto; qui vale sempre l’ultima cifra pubblicata. Lo storico parte da gennaio 2025 e cresce a ogni rapporto mensile.'] },
    flk: { file: 'data/us-ers-livestock-stats.json', cite: 'usda_ers', cat: 'colon', url: 'https://www.ers.usda.gov/data-products/livestock-and-meat-domestic-data',
      h: ['Carne y ganado de EE. UU.: oferta, pesos, precios y cebadero', 'U.S. meat and livestock: supply, weights, prices and feedlot', 'Viande et bétail aux États-Unis : offre, poids, prix et parc d’engraissement', 'Carne e bestiame negli USA: offerta, pesi, prezzi e feedlot'],
      sub: ['Producción, importaciones, exportaciones, existencias y consumo por persona de cada carne y de los huevos; pesos medios, existencias en frío, precios del ganado y mayoristas, terneros fuera de cebaderos y simulador de rentabilidad del cebadero (USDA ERS).',
        'Production, imports, exports, stocks and per-person use of each meat and of eggs; average weights, cold storage, livestock and wholesale prices, feeder cattle outside feedlots and the feedlot profitability simulator (USDA ERS).',
        'Production, importations, exportations, stocks et consommation par personne de chaque viande et des œufs ; poids moyens, stocks frigorifiques, prix du bétail et de gros, bovins hors parcs d’engraissement et simulateur de rentabilité (USDA ERS).',
        'Produzione, importazioni, esportazioni, scorte e consumo pro capite di ogni carne e delle uova; pesi medi, scorte frigorifere, prezzi del bestiame e all’ingrosso, vitelli fuori dai feedlot e simulatore di redditività (USDA ERS).'],
      note: ['Las cifras del año en curso incluyen estimaciones del propio ERS. Las series anuales son de enero a diciembre. El simulador del cebadero usa periodos de alimentación de 4 meses fechados en su mes final.',
        'Current-year figures include ERS’s own estimates. Annual series run January to December. The feedlot simulator uses 4-month feeding periods dated at their final month.',
        'Les chiffres de l’année en cours incluent des estimations de l’ERS. Les séries annuelles vont de janvier à décembre. Le simulateur utilise des périodes d’engraissement de 4 mois datées de leur dernier mois.',
        'Le cifre dell’anno in corso includono stime dell’ERS. Le serie annuali vanno da gennaio a dicembre. Il simulatore usa periodi di alimentazione di 4 mesi datati al mese finale.'] },
    fmm: { file: 'data/us-fmmo-stats.json', cite: 'usda_ams_fmmo', cat: 'group', url: 'https://www.ams.usda.gov/rules-regulations/moa/dairy',
      h: ['Leche en EE. UU.: precios de clase y órdenes federales', 'U.S. milk: class prices and federal orders', 'Lait aux États-Unis : prix par classe et ordonnances fédérales', 'Latte negli USA: prezzi di classe e ordini federali'],
      sub: ['Precios mínimos de las clases I a IV (suero, queso, mantequilla y polvo), precio uniforme, precio mailbox por zona, leche del pool y su reparto por uso, y composición de la leche de los productores (USDA AMS).',
        'Minimum prices for Classes I to IV (fluid, soft products, cheese and whey, butter and powder), uniform price, mailbox price by area, pooled milk and its split by use, and producer milk composition (USDA AMS).',
        'Prix minimaux des classes I à IV (lait de consommation, produits frais, fromage et lactosérum, beurre et poudre), prix uniforme, prix mailbox par zone, lait du pool et sa répartition par usage, et composition du lait des producteurs (USDA AMS).',
        'Prezzi minimi delle classi da I a IV (latte alimentare, prodotti freschi, formaggio e siero, burro e polvere), prezzo uniforme, prezzo mailbox per zona, latte del pool e sua ripartizione per uso, e composizione del latte dei produttori (USDA AMS).'],
      note: ['Los precios de clase son mínimos regulados (USD por cwt al 3,5 % de grasa), no el precio que cobra cada ganadero; el precio mailbox sí es lo que recibe el ganadero tras deducciones. Si AMS revisa un mes, gana la última publicación.',
        'Class prices are regulated minimums (USD per cwt at 3.5% butterfat), not what each farmer is paid; the mailbox price is what the farmer actually receives after deductions. If AMS revises a month, the latest publication wins.',
        'Les prix de classe sont des minimums réglementés (USD par cwt à 3,5 % de matière grasse), pas ce que touche chaque éleveur ; le prix mailbox est ce que l’éleveur reçoit après déductions. Si l’AMS révise un mois, la dernière publication l’emporte.',
        'I prezzi di classe sono minimi regolamentati (USD per cwt al 3,5 % di grasso), non quanto incassa ogni allevatore; il prezzo mailbox è quanto riceve l’allevatore dopo le detrazioni. Se AMS rivede un mese, vale l’ultima pubblicazione.'] }
  };
  var T = {
    es: { cat: 'Categoría', ser: 'Serie', chart: 'Gráfica', last: 'Últimos 12 periodos', per: 'Periodo', val: 'Valor', chg: 'Cambio', open: 'Abrir la fuente', src: 'Último dato:', alt: 'Evolución de {n}', en: 'Los nombres de las series están como los publica la fuente (en inglés). Dehesa Index no calcula nada sobre estas cifras.', grp: { prices: 'Precios', production: 'Producción y uso', stocks: 'Existencias', trade: 'Comercio' } },
    en: { cat: 'Category', ser: 'Series', chart: 'Chart', last: 'Last 12 periods', per: 'Period', val: 'Value', chg: 'Change', open: 'Open the source', src: 'Latest data:', alt: 'Trend of {n}', en: 'Series names appear as published by the source (in English). Dehesa Index calculates nothing on these figures.', grp: { prices: 'Prices', production: 'Production and use', stocks: 'Stocks', trade: 'Trade' } },
    fr: { cat: 'Catégorie', ser: 'Série', chart: 'Graphique', last: '12 dernières périodes', per: 'Période', val: 'Valeur', chg: 'Variation', open: 'Ouvrir la source', src: 'Dernière donnée :', alt: 'Évolution de {n}', en: 'Les noms des séries sont ceux de la source (en anglais). Dehesa Index ne calcule rien sur ces chiffres.', grp: { prices: 'Prix', production: 'Production et usage', stocks: 'Stocks', trade: 'Commerce' } },
    it: { cat: 'Categoria', ser: 'Serie', chart: 'Grafico', last: 'Ultimi 12 periodi', per: 'Periodo', val: 'Valore', chg: 'Variazione', open: 'Apri la fonte', src: 'Ultimo dato:', alt: 'Andamento di {n}', en: 'I nomi delle serie sono quelli della fonte (in inglese). Dehesa Index non calcola nulla su queste cifre.', grp: { prices: 'Prezzi', production: 'Produzione e uso', stocks: 'Scorte', trade: 'Commercio' } }
  };
  var STATE = {};
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function fv(v) { if (v == null) return '—'; var a = Math.abs(v); return nf(v, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function clean(l) { return String(l).replace(/\s*\((?:[^()]*(?:NASS|ERS|AMS|monthly|annual)[^()]*)\)\s*$/, ''); }
  function catOf(b, s, T0) { if (b.cat === 'group') return s.group; var i = String(s.label).indexOf(':'); return i > 0 ? s.label.slice(0, i) : s.group; }
  function catName(b, c, T0) { return b.cat === 'group' ? (T0.grp[c] || c) : c; }
  function pfmt(p, fq) { return fq === 'annual' ? p : p.length === 7 ? p : p; }
  function ts(p) { var m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(String(p)); return m ? Date.UTC(+m[1], m[2] ? +m[2] - 1 : 0, m[3] ? +m[3] : 1) : null; }
  function chart(s, T0) {
    if (!window.DehesaChart || !window.DehesaChart.render) return '';
    var rows = s.points.slice(-(s.frequency === 'annual' ? 40 : 120)), pts = [], k, t;
    for (k = 0; k < rows.length; k++) { t = ts(rows[k][0]); if (t != null) pts.push({ x: t, y: rows[k][1], l: rows[k][0] }); }
    if (pts.length < 3) return '';
    return window.DehesaChart.render({ series: [{ name: clean(s.label), color: '#1d5178', pts: pts }], xMode: 'time', yTitle: s.unit || '', aria: T0.alt.replace('{n}', clean(s.label)), zero: false, noLegend: true, vFmt: fv });
  }
  function render(id) {
    var root = document.getElementById(id), st = STATE[id], b = BLOCKS[id]; if (!root || !st) return;
    var P = LI[lang()] || 0, T0 = T[lang()] || T.es, i, cats = [], seen = {}, list = [];
    st.series.forEach(function (s) { var c = catOf(b, s, T0); if (!seen[c]) { seen[c] = 1; cats.push(c); } });
    cats.sort(function (a, c) { return String(catName(b, a, T0)).localeCompare(catName(b, c, T0), lang()); });
    if (!st.cat || !seen[st.cat]) st.cat = cats[0];
    st.series.forEach(function (s) { if (catOf(b, s, T0) === st.cat) list.push(s); });
    if (!st.sid || !list.some(function (s) { return s.id === st.sid; })) st.sid = list[0].id;
    var s = list.filter(function (x) { return x.id === st.sid; })[0];
    var sel = '<div style="display:flex;flex-wrap:wrap;gap:10px 18px;margin:10px 0 4px"><label class="di-movers-hint">' + esc(T0.cat) + '<select id="' + id + '-cat" style="display:block;margin-top:4px;font:inherit;max-width:100%">' +
      cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === st.cat ? ' selected' : '') + '>' + esc(catName(b, c, T0)) + '</option>'; }).join('') + '</select></label>' +
      '<label class="di-movers-hint" style="flex:1 1 280px">' + esc(T0.ser) + '<select id="' + id + '-ser" style="display:block;margin-top:4px;font:inherit;max-width:100%;width:100%">' +
      list.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === st.sid ? ' selected' : '') + '>' + esc(clean(x.label)) + '</option>'; }).join('') + '</select></label></div>';
    var rows = s.points.slice(-12).reverse(), body = '';
    var th = 'padding:7px 6px;font-size:11px;font-weight:700;color:var(--text-faint);text-align:right;', td = 'padding:6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';
    rows.forEach(function (r, j) {
      var prev = s.points[s.points.length - 1 - j - 1], ch = prev && prev[1] ? (r[1] / prev[1] - 1) * 100 : null;
      body += '<tr><th scope="row" style="' + td + 'text-align:left;font-weight:400">' + esc(r[0]) + '</th><td style="' + td + '">' + esc(fv(r[1])) + '</td><td style="' + td + '">' + (ch == null ? '—' : esc((ch > 0 ? '+' : '') + nf(ch, 1) + ' %')) + '</td></tr>';
    });
    var tab = '<details class="usm-more"><summary>' + esc(T0.last) + '</summary><div style="overflow:auto"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr><th scope="col" style="' + th + 'text-align:left">' + esc(T0.per) + '</th><th scope="col" style="' + th + '">' + esc(T0.val) + ' (' + esc(s.unit || '') + ')</th><th scope="col" style="' + th + '">' + esc(T0.chg) + '</th></tr></thead><tbody>' + body + '</tbody></table></div></details>';
    var cite = window.DICite && window.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + window.DICite.html(b.cite, { period: s.latestPeriod }) + '</div>' : '';
    root.innerHTML = '<h2 class="cof-h2">' + esc(b.h[P]) + '</h2><p class="cof-sub">' + esc(b.sub[P]) + '</p>' + sel + '<h3 class="cof-h3">' + esc(clean(s.label)) + ' · ' + esc(T0.chart) + '</h3>' + chart(s, T0) + tab +
      '<p class="cof-note">' + esc(b.note[P]) + ' ' + esc(T0.en) + ' ' + esc(T0.src) + ' ' + esc(s.latestPeriod) + '. <a href="' + esc(b.url) + '" target="_blank" rel="noopener noreferrer">' + esc(T0.open) + '</a></p>' + cite;
    var c = document.getElementById(id + '-cat'), r = document.getElementById(id + '-ser');
    if (c) c.onchange = function () { st.cat = c.value; st.sid = null; render(id); };
    if (r) r.onchange = function () { st.sid = r.value; render(id); };
  }
  function boot() {
    var ids = Object.keys(BLOCKS).filter(function (k) { return document.getElementById(k); });
    if (!ids.length) return;
    ids.forEach(function (id) {
      Promise.all([fetch(BLOCKS[id].file).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) {
        var us = a[0] && a[0].countries && a[0].countries.US; if (!us || !us.series || us.series.length < 10) return;
        STATE[id] = { series: us.series, cat: null, sid: null }; render(id);
      });
    });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); ids.forEach(render); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
