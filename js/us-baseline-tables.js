/* Dehesa Index — Tablas de las proyecciones agrarias de EE. UU. (USDA ERS, libros .xlsx del Agricultural Baseline Database). ES5.
   Lee data/us-markets/baseline-tables.json (scripts/update-ers-baseline.py): 16 tablas con sus filas, secciones, unidades y periodos tal como las publica ERS.
   Los nombres de las filas se muestran en inglés, como en la fuente. No se calcula nada. Las columnas con rango ("2026–35") son medias que publica ERS y no entran en la gráfica. */
(function () {
  'use strict';
  var D = null, SEL = null, ROW = 0;
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var TN = { 1: ['PIB mundial: crecimiento por país', 'World GDP growth by country', 'PIB mondial : croissance par pays', 'PIL mondiale: crescita per paese'], 2: ['Macroeconomía de EE. UU.', 'U.S. macroeconomy', 'Macroéconomie des États-Unis', 'Macroeconomia degli USA'], 3: ['Tipo de cambio real por país', 'Real exchange rate by country', 'Taux de change réel par pays', 'Tasso di cambio reale per paese'], 4: ['Crecimiento de la población por país', 'Population growth by country', 'Croissance démographique par pays', 'Crescita della popolazione per paese'],
    5: ['Superficie de cultivos y reserva de conservación (CRP)', 'Crop acreage and Conservation Reserve', 'Superficies cultivées et réserve de conservation', 'Superfici colturali e riserva di conservazione'], 16: ['Azúcar', 'Sugar', 'Sucre', 'Zucchero'], 17: ['Frutas, frutos secos y hortalizas', 'Fruits, nuts and vegetables', 'Fruits, fruits à coque et légumes', 'Frutta, frutta secca e ortaggi'], 18: ['Consumo de carne por persona', 'Per-capita meat consumption', 'Consommation de viande par habitant', 'Consumo di carne pro capite'],
    19: ['Vacuno', 'Beef', 'Bœuf', 'Manzo'], 20: ['Porcino', 'Pork', 'Porc', 'Suino'], 21: ['Pollo joven', 'Young chicken', 'Poulet', 'Pollo giovane'], 22: ['Pavo', 'Turkey', 'Dinde', 'Tacchino'], 23: ['Huevos', 'Eggs', 'Œufs', 'Uova'], 24: ['Lácteos', 'Dairy', 'Produits laitiers', 'Latticini'], 25: ['Comercio exterior agrario (años fiscales)', 'Agricultural trade (fiscal years)', 'Commerce agricole extérieur (années fiscales)', 'Commercio agricolo estero (anni fiscali)'], 26: ['Ingresos, gastos y renta agraria', 'Farm receipts, expenses and income', 'Recettes, dépenses et revenu agricoles', 'Ricavi, spese e reddito agricolo'] };
  var T = {
    es: { h: 'Más tablas de las proyecciones de EE. UU.', sub: 'Macroeconomía, población y PIB mundiales, comercio exterior, renta agraria, frutas y hortalizas, azúcar, lácteos y ganadería: las tablas completas del informe de proyecciones del USDA.', tbl: 'Tabla', row: 'Fila', unit: 'Unidad', chart: 'Evolución de la fila elegida (sin las medias de varios años)', notes: 'Notas de la fuente', all: 'Ver la tabla completa',
      note: 'Los nombres de las filas y las notas están como los publica ERS (en inglés). Dehesa Index no calcula nada sobre estas tablas. Las columnas con rango de años (por ejemplo 2026–35) son medias que publica ERS. Las proyecciones se cerraron en noviembre de 2025 y los supuestos macroeconómicos en septiembre de 2025, según las notas de las propias tablas.', src: 'Fuente: USDA ERS, Agricultural Baseline Database (edición {ed}, libros .xlsx), preparada por el Interagency Agricultural Projections Committee.', alt: '{n}: {r}', open: 'Ver la fuente original' },
    en: { h: 'More tables from the U.S. projections', sub: 'World macroeconomy, population and GDP, agricultural trade, farm income, fruits and vegetables, sugar, dairy and livestock: the full tables of USDA’s projections report.', tbl: 'Table', row: 'Row', unit: 'Unit', chart: 'Trend of the chosen row (without the multi-year averages)', notes: 'Source notes', all: 'See the full table',
      note: 'Row names and notes appear as published by ERS (in English). Dehesa Index calculates nothing on these tables. Columns with a year range (for example 2026–35) are averages published by ERS. According to the tables’ own notes, projections were completed in November 2025 and the macroeconomic assumptions in September 2025.', src: 'Source: USDA ERS, Agricultural Baseline Database ({ed} edition, .xlsx workbooks), prepared by the Interagency Agricultural Projections Committee.', alt: '{n}: {r}', open: 'See the original source' },
    fr: { h: 'Plus de tableaux des projections américaines', sub: 'Macroéconomie, population et PIB mondiaux, commerce extérieur, revenu agricole, fruits et légumes, sucre, produits laitiers et élevage : les tableaux complets du rapport de projections de l’USDA.', tbl: 'Tableau', row: 'Ligne', unit: 'Unité', chart: 'Évolution de la ligne choisie (sans les moyennes pluriannuelles)', notes: 'Notes de la source', all: 'Voir le tableau complet',
      note: 'Les noms de lignes et les notes sont ceux de l’ERS (en anglais). Dehesa Index ne calcule rien sur ces tableaux. Les colonnes avec une période (par exemple 2026–35) sont des moyennes publiées par l’ERS. D’après les notes des tableaux, les projections ont été finalisées en novembre 2025 et les hypothèses macroéconomiques en septembre 2025.', src: 'Source : USDA ERS, Agricultural Baseline Database (édition {ed}, classeurs .xlsx), préparée par l’Interagency Agricultural Projections Committee.', alt: '{n} : {r}', open: 'Voir la source d’origine' },
    it: { h: 'Altre tabelle delle proiezioni USA', sub: 'Macroeconomia, popolazione e PIL mondiali, commercio estero, reddito agricolo, frutta e ortaggi, zucchero, latticini e zootecnia: le tabelle complete del rapporto di proiezioni dell’USDA.', tbl: 'Tabella', row: 'Riga', unit: 'Unità', chart: 'Andamento della riga scelta (senza le medie pluriennali)', notes: 'Note della fonte', all: 'Vedi la tabella completa',
      note: 'I nomi delle righe e le note sono come li pubblica ERS (in inglese). Dehesa Index non calcola nulla su queste tabelle. Le colonne con un intervallo di anni (ad esempio 2026–35) sono medie pubblicate da ERS. Secondo le note delle tabelle, le proiezioni sono state completate a novembre 2025 e le ipotesi macroeconomiche a settembre 2025.', src: 'Fonte: USDA ERS, Agricultural Baseline Database (edizione {ed}, cartelle .xlsx), preparata dall’Interagency Agricultural Projections Committee.', alt: '{n}: {r}', open: 'Vedi la fonte originale' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function fv(v) { if (v == null) return '—'; var a = Math.abs(v); return nf(v, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function num(t) { var m = /^Table\s+(\d+)/.exec(t.title); return m ? +m[1] : 0; }
  function xl(k, s) { var l = lang(); return s && window.DIUS && l !== 'en' ? window.DIUS[k](s, l) : s; }
  var TE = { 1: '🌍', 2: '🇺🇸', 3: '💱', 4: '👥', 5: '🌾', 16: '🍬', 17: '🍎', 18: '🍽️', 19: '🐄', 20: '🐖', 21: '🐔', 22: '🦃', 23: '🥚', 24: '🥛', 25: '🚢', 26: '💵' };
  function temo(t) { var e = TE[num(t)]; return e ? e + ' ' : ''; }
  function tname(t, P) { var n = num(t); return TN[n] ? TN[n][P] : t.title; }
  function cur() { var i; for (i = 0; i < D.tables.length; i++) if (D.tables[i].id === SEL) return D.tables[i]; return D.tables[0]; }
  function isP(y) { return /[–-]/.test(y) && !/\//.test(y); }
  function chart(t, r, T, P) {
    if (!window.DehesaChart || !window.DehesaChart.render) return '';
    var pts = [], lab = {}, k = 0, i;
    for (i = 0; i < t.years.length; i++) { if (isP(t.years[i]) || r.values[i] == null) continue; lab[k] = t.years[i]; pts.push({ x: k, y: r.values[i], l: t.years[i] }); k++; }
    if (pts.length < 3) return '';
    return window.DehesaChart.render({ series: [{ name: xl('row', r.label), color: '#1d5178', pts: pts }], xLabels: lab, yTitle: xl('unit', r.unit || t.unit || ''), aria: f(T.alt, { n: tname(t, P), r: xl('row', r.label) }), zero: false, noLegend: true, vFmt: fv });
  }
  function render() {
    var root = document.getElementById('nbt'); if (!root || !D) return;
    var T0 = T[lang()] || T.es, P = LI[lang()] || 0, t = cur(), i;
    if (ROW >= t.rows.length) ROW = 0;
    var r = t.rows[ROW];
    var sel = '<label class="di-movers-hint" style="display:block;margin:10px 0 4px">' + esc(T0.tbl) + '<select id="nbt-sel" style="display:block;margin-top:4px;font:inherit;max-width:100%">' + D.tables.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === t.id ? ' selected' : '') + '>' + esc(temo(x) + tname(x, P)) + '</option>'; }).join('') + '</select></label>';
    var th = 'padding:7px 6px;font-size:11px;font-weight:700;color:var(--text-faint);text-align:right;white-space:nowrap;position:sticky;top:0;background:var(--bg,#fff);', td = 'padding:6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap;';
    var last = null, body = '';
    t.rows.forEach(function (x, j) {
      if (x.section && x.section !== last) { body += '<tr><th scope="rowgroup" colspan="' + (t.years.length + 2) + '" style="padding:10px 6px 4px;text-align:left;font-size:12px">' + esc(x.section) + '</th></tr>'; last = x.section; }
      body += '<tr class="nbt-r" data-j="' + j + '" tabindex="0" style="cursor:pointer;' + (j === ROW ? 'background:var(--bg-soft,rgba(0,0,0,.05))' : '') + '"><th scope="row" style="' + td + 'text-align:left;font-weight:400;padding-left:' + (6 + 12 * (x.indent || 0)) + 'px;white-space:normal;min-width:180px">' + esc(xl('row', x.label)) + '</th><td style="' + td + 'text-align:left;color:var(--text-muted)">' + esc(xl('unit', x.unit || t.unit || '')) + '</td>' + x.values.map(function (v) { return '<td style="' + td + '">' + esc(fv(v)) + '</td>'; }).join('') + '</tr>';
    });
    var tab = '<div style="overflow:auto;max-height:520px"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr><th scope="col" style="' + th + 'text-align:left">' + esc(T0.row) + '</th><th scope="col" style="' + th + 'text-align:left">' + esc(T0.unit) + '</th>' + t.years.map(function (y) { return '<th scope="col" style="' + th + '">' + esc(y) + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    var notes = t.notes.length ? '<details class="usm-more"><summary>' + esc(T0.notes) + '</summary>' + t.notes.map(function (n) { return '<p class="di-movers-hint">' + esc(n) + '</p>'; }).join('') + '</details>' : '';
    var cite = window.DICite && window.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + window.DICite.html('usda_ers', { period: D.edition }) + '</div>' : '';
    root.innerHTML = '<h2 class="cof-h2">' + esc(T0.h) + '</h2><p class="cof-sub">' + esc(T0.sub) + '</p>' + sel + '<h3 class="cof-h3">' + esc(xl('row', r.label)) + ' · ' + esc(T0.chart) + '</h3>' + chart(t, r, T0, P) + '<h3 class="cof-h3">' + esc(tname(t, P)) + '</h3>' + tab + notes +
      '<p class="cof-note">' + esc(T0.note) + ' ' + esc(f(T0.src, { ed: D.edition })) + ' <a href="' + esc(D.pageUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(T0.open) + '</a></p>' + cite;
    var s = document.getElementById('nbt-sel'); if (s) s.onchange = function () { SEL = s.value; ROW = 0; render(); };
    Array.prototype.forEach.call(root.querySelectorAll('.nbt-r'), function (el) { function go() { ROW = +el.getAttribute('data-j'); render(); } el.onclick = go; el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  }
  function boot() {
    if (!document.getElementById('nbt')) return;
    Promise.all([fetch('data/us-markets/baseline-tables.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) {
      D = a[0] && a[0].tables && a[0].tables.length >= 12 ? a[0] : null; if (!D) return; SEL = D.tables[0].id; render();
    });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
