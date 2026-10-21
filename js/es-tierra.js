/* Dehesa Index — Precio de la tierra y cánones de arrendamiento en España por comunidad autónoma y provincia (MAPA, Encuesta de precios de la tierra y Cánones de arrendamientos rústicos).
   data/spain-land/land.json (scripts/update-spain-land.py). Se muestra debajo de la pestaña «España» de insumos.html: el bloque sigue la visibilidad de #in-es.
   Los mapas (vendor/es-ccaa.js, vendor/es-provinces.js) se cargan solo al abrir la pestaña. ES5. */
(function (global) {
  'use strict';
  var S = global.DehesaShared;
  var T = {
    es: { h: 'Precio de la tierra y cánones de arrendamiento', badge: 'DATOS OFICIALES REALES', meas: 'Cifra', price: 'Precio de la tierra (€/ha)', rent: 'Canon de arrendamiento (€/ha y año)', type: 'Tipo de tierra', year: 'Año', level: 'Desglose', lccaa: 'Comunidades', lprov: 'Provincias', other: 'Otros cultivos (solo {y})',
      nat: 'España', natRow: 'Media de España', vsPrev: 'Frente al año anterior', vsFirst: 'Frente a {y}', hi: 'Más cara', lo: 'Más barata', hiR: 'Canon más alto', loR: 'Canon más bajo', map: 'Por comunidad autónoma', mapP: 'Por provincia', hoverMap: 'Pasa el cursor o toca una zona.', noData: 'sin dato publicado',
      all: 'Ver todas las zonas', reg: 'Zona', val: 'Valor', chg: 'Variación anual', evo: 'Evolución anual', evoIn: 'Evolución en', hover: 'Pasa el cursor o toca el gráfico para ver cada año.', def: 'definitivo', prov: 'provisional', provNote: 'Provincias: solo el último año publicado ({y}).',
      note: 'Precios medios anuales de las tierras de uso agrario y cánones medios de arrendamiento rústico que publica el MAPA a partir de su encuesta. Son medias de la encuesta, no un registro de compraventas, y cada tipo de tierra solo aparece en las zonas donde el MAPA publica su dato. Los años «provisional» pueden cambiar cuando el ministerio publique los definitivos.',
      src: 'Fuente:', cite: 'Variaciones, máximos y mínimos: cálculo de Dehesa Index.', mk: 'Precio medio anual de las tierras de uso agrario y canon medio de arrendamiento rústico, por comunidad autónoma y tipo de tierra', ty: 'Precio (€/ha) o canon (€/ha y año)', ob: 'Un dato por año, comunidad y tipo de tierra; el desglose provincial es del último año', me: 'Dehesa Index lee cada semana los libros Excel de la Encuesta de precios de la tierra y de Cánones de arrendamientos rústicos que publica el MAPA, comprueba que las 17 comunidades y las 50 provincias están y que las medias nacionales cuadran con las regionales, y conserva los años anteriores.' },
    en: { h: 'Farmland prices and rents in Spain', badge: 'REAL OFFICIAL DATA', meas: 'Measure', price: 'Land price (€/ha)', rent: 'Rental rate (€/ha per year)', type: 'Land type', year: 'Year', level: 'Breakdown', lccaa: 'Regions', lprov: 'Provinces', other: 'Other crops (only {y})',
      nat: 'Spain', natRow: 'Spain average', vsPrev: 'Versus previous year', vsFirst: 'Versus {y}', hi: 'Highest', lo: 'Lowest', hiR: 'Highest rent', loR: 'Lowest rent', map: 'By autonomous community', mapP: 'By province', hoverMap: 'Hover or tap an area.', noData: 'no published figure',
      all: 'Show all areas', reg: 'Area', val: 'Value', chg: 'Annual change', evo: 'Yearly trend', evoIn: 'Trend in', hover: 'Hover or tap the chart to read each year.', def: 'final', prov: 'provisional', provNote: 'Provinces: only the latest published year ({y}).',
      note: 'Annual average farmland prices and average rural rental rates published by MAPA from its survey. They are survey averages, not a register of sales, and each land type only appears where MAPA publishes it. Years marked “provisional” may change when the ministry publishes the final figures.',
      src: 'Source:', cite: 'Changes, highs and lows: calculated by Dehesa Index.', mk: 'Annual average price of agricultural land and average rural rental rate, by autonomous community and land type', ty: 'Price (€/ha) or rent (€/ha per year)', ob: 'One figure per year, region and land type; the provincial breakdown is for the latest year', me: 'Dehesa Index reads every week the Excel workbooks of the MAPA land-price survey and rural-rent tables, checks that all 17 regions and 50 provinces are present and that national averages match the regional ones, and keeps earlier years.' },
    fr: { h: 'Prix des terres et fermages en Espagne', badge: 'DONNÉES OFFICIELLES RÉELLES', meas: 'Indicateur', price: 'Prix de la terre (€/ha)', rent: 'Fermage (€/ha et par an)', type: 'Type de terre', year: 'Année', level: 'Découpage', lccaa: 'Régions', lprov: 'Provinces', other: 'Autres cultures (seulement {y})',
      nat: 'Espagne', natRow: 'Moyenne de l’Espagne', vsPrev: 'Par rapport à l’année précédente', vsFirst: 'Par rapport à {y}', hi: 'Plus chère', lo: 'Moins chère', hiR: 'Fermage le plus élevé', loR: 'Fermage le plus bas', map: 'Par communauté autonome', mapP: 'Par province', hoverMap: 'Survolez ou touchez une zone.', noData: 'pas de chiffre publié',
      all: 'Voir toutes les zones', reg: 'Zone', val: 'Valeur', chg: 'Variation annuelle', evo: 'Évolution annuelle', evoIn: 'Évolution en', hover: 'Survolez ou touchez le graphique pour lire chaque année.', def: 'définitif', prov: 'provisoire', provNote: 'Provinces : seulement la dernière année publiée ({y}).',
      note: 'Prix moyens annuels des terres agricoles et fermages ruraux moyens publiés par le MAPA à partir de son enquête. Ce sont des moyennes d’enquête, pas un registre de ventes, et chaque type de terre n’apparaît que là où le MAPA publie son chiffre. Les années « provisoire » peuvent changer quand le ministère publiera les chiffres définitifs.',
      src: 'Source :', cite: 'Variations, maximums et minimums : calcul de Dehesa Index.', mk: 'Prix moyen annuel des terres agricoles et fermage rural moyen, par communauté autonome et type de terre', ty: 'Prix (€/ha) ou fermage (€/ha et par an)', ob: 'Un chiffre par année, région et type de terre ; le découpage par province concerne la dernière année', me: 'Dehesa Index lit chaque semaine les classeurs Excel de l’enquête sur le prix des terres et des fermages ruraux du MAPA, vérifie que les 17 régions et les 50 provinces sont présentes et que les moyennes nationales concordent avec les régionales, et conserve les années précédentes.' },
    it: { h: 'Prezzi dei terreni e affitti in Spagna', badge: 'DATI UFFICIALI REALI', meas: 'Indicatore', price: 'Prezzo del terreno (€/ha)', rent: 'Canone d’affitto (€/ha all’anno)', type: 'Tipo di terreno', year: 'Anno', level: 'Dettaglio', lccaa: 'Regioni', lprov: 'Province', other: 'Altre colture (solo {y})',
      nat: 'Spagna', natRow: 'Media della Spagna', vsPrev: 'Rispetto all’anno precedente', vsFirst: 'Rispetto al {y}', hi: 'Più caro', lo: 'Più economico', hiR: 'Canone più alto', loR: 'Canone più basso', map: 'Per comunità autonoma', mapP: 'Per provincia', hoverMap: 'Passa il cursore o tocca una zona.', noData: 'nessun dato pubblicato',
      all: 'Mostra tutte le zone', reg: 'Zona', val: 'Valore', chg: 'Variazione annua', evo: 'Andamento annuale', evoIn: 'Andamento in', hover: 'Passa il cursore o tocca il grafico per leggere ogni anno.', def: 'definitivo', prov: 'provvisorio', provNote: 'Province: solo l’ultimo anno pubblicato ({y}).',
      note: 'Prezzi medi annui dei terreni agricoli e canoni medi di affitto rustico pubblicati dal MAPA sulla base della sua indagine. Sono medie d’indagine, non un registro di compravendite, e ogni tipo di terreno compare solo dove il MAPA ne pubblica il dato. Gli anni «provvisorio» possono cambiare quando il ministero pubblicherà i definitivi.',
      src: 'Fonte:', cite: 'Variazioni, massimi e minimi: calcolo di Dehesa Index.', mk: 'Prezzo medio annuo dei terreni agricoli e canone medio di affitto rustico, per comunità autonoma e tipo di terreno', ty: 'Prezzo (€/ha) o canone (€/ha all’anno)', ob: 'Un dato per anno, regione e tipo di terreno; il dettaglio provinciale riguarda l’ultimo anno', me: 'Dehesa Index legge ogni settimana le cartelle Excel dell’indagine sui prezzi dei terreni e dei canoni di affitto rustico del MAPA, verifica che ci siano le 17 regioni e le 50 province e che le medie nazionali tornino con quelle regionali, e conserva gli anni precedenti.' }
  };
  // etiquetas de los tipos de tierra: [es, en, fr, it]
  var TL = {
    PT: ['General (todas las tierras)', 'All land (general)', 'Ensemble des terres', 'Tutti i terreni'], GEN: ['General (todas las tierras)', 'All land (general)', 'Ensemble des terres', 'Tutti i terreni'],
    TAS: ['Tierras arables de secano', 'Arable land, rainfed', 'Terres arables sèches', 'Seminativi in asciutto'], TAR: ['Tierras arables de regadío', 'Arable land, irrigated', 'Terres arables irriguées', 'Seminativi irrigui'],
    OLS: ['Olivar de secano', 'Olive groves, rainfed', 'Oliveraies sèches', 'Oliveti in asciutto'], OLR: ['Olivar de regadío', 'Olive groves, irrigated', 'Oliveraies irriguées', 'Oliveti irrigui'],
    VIS: ['Viñedo de secano', 'Vineyards, rainfed', 'Vignobles secs', 'Vigneti in asciutto'], VIR: ['Viñedo de regadío', 'Vineyards, irrigated', 'Vignobles irrigués', 'Vigneti irrigui'],
    PRD: ['Prados', 'Meadows', 'Prairies', 'Prati'], PST: ['Pastizal', 'Pasture', 'Pâturages', 'Pascoli'],
    ARZ: ['Arrozal', 'Rice paddies', 'Rizières', 'Risaie'], CBP: ['Cultivos bajo plástico', 'Crops under plastic', 'Cultures sous plastique', 'Colture sotto plastica'], CIT: ['Cítricos', 'Citrus', 'Agrumes', 'Agrumi'],
    FCR: ['Frutal carnoso de regadío', 'Fleshy fruit trees, irrigated', 'Fruitiers à chair, irrigués', 'Frutteti a polpa, irrigui'], FCS: ['Frutal carnoso de secano', 'Fleshy fruit trees, rainfed', 'Fruitiers à chair, secs', 'Frutteti a polpa, in asciutto'],
    FSR: ['Frutos secos de regadío', 'Nut trees, irrigated', 'Fruits à coque, irrigués', 'Frutta secca, irrigua'], FSS: ['Frutos secos de secano', 'Nut trees, rainfed', 'Fruits à coque, secs', 'Frutta secca, in asciutto'],
    HUE: ['Huerta', 'Vegetable gardens', 'Cultures maraîchères', 'Orti'], PLT: ['Platanera', 'Banana plantations', 'Bananeraies', 'Bananeti'], SBT: ['Cultivos subtropicales y tropicales', 'Subtropical and tropical crops', 'Cultures subtropicales et tropicales', 'Colture subtropicali e tropicali']
  };
  var LI = { es: 0, en: 1, fr: 2, it: 3 }, LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  var st = { m: 'price', type: 'PT', year: null, lvl: 'ccaa', reg: 'ES' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lang() { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; }
  function tl(code, lg) { var a = TL[code]; return a ? a[LI[lg]] : code; }
  function fmt(v, lg) { if (v == null) return '—'; var d = v >= 100 ? 0 : 1; return v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); }
  function eur(v, lg) { return v == null ? '—' : fmt(v, lg) + (st.m === 'rent' ? ' €/ha·' + ({ es: 'año', en: 'yr', fr: 'an', it: 'anno' })[lg] : ' €/ha'); }
  function pct(v, lg) { if (v == null) return '—'; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function ccaaName(code, lg) {
    if (code === 'ES') return T[lg].nat;
    var N = global.DehesaRegionNames && global.DehesaRegionNames.ES, v = N && N[code];
    if (v) { var p = v.split('|'); return p[{ en: 0, es: 1, fr: 2, it: 3 }[lg]] || p[1] || code; }
    var M = global.DEHESA_ES_CCAA; if (M) for (var i = 0; i < M.states.length; i++) if (M.states[i].id === code) return M.states[i].name;
    return code;
  }
  function provName(id, d) { var M = global.DEHESA_ES_PROVINCES; if (M) for (var i = 0; i < M.states.length; i++) if (M.states[i].id === id) return M.states[i].name; return d.price.prov.names[id] || id; }
  function ylabel(d, y, lg) { return y + (d.status[String(y)] === 'provisional' ? ' (' + T[lg].prov + ')' : ''); }
  // valor de una comunidad: para el canon de «otros cultivos» solo existe el año de d.rent.other
  // valor de una comunidad: para el canon de «otros cultivos» solo existe el año de d.rent.other
  function val(d, code, type, yi) {
    if (st.m === 'price') { var s = d.price.ccaa[code]; return s && s[type] ? s[type][yi] : null; }
    if (d.rentTypes[type]) { var r = d.rent.ccaa[code]; return r && r[type] ? r[type][yi] : null; }
    var o = d.rent.other; if (!o || d.years[yi] !== o.year) return null;
    var v = o.values[code]; return v && v[type] != null ? v[type] : null;
  }
  function typesFor(d) {   // [[codigo, esOtro]] para el selector
    var out = [], k, seen = {};
    if (st.m === 'price' && st.lvl === 'prov') {
      var V = d.price.prov.values;
      for (k in d.types) if (d.types.hasOwnProperty(k)) { var hp = false; for (var pid in V) if (V.hasOwnProperty(pid) && V[pid][k] != null) { hp = true; break; } if (hp) out.push([k, false]); }
      return out;
    }
    if (st.m === 'price') {
      for (k in d.types) if (d.types.hasOwnProperty(k)) { var has = false; for (var c in d.price.ccaa) if (d.price.ccaa.hasOwnProperty(c) && d.price.ccaa[c][k]) { has = true; break; } if (has) out.push([k, false]); }
      return out;
    }
    for (k in d.rentTypes) if (d.rentTypes.hasOwnProperty(k)) out.push([k, false]);
    if (d.rent.other && d.rent.other.values) {
      for (var cc in d.rent.other.values) if (d.rent.other.values.hasOwnProperty(cc)) for (k in d.rent.other.values[cc]) if (d.rent.other.values[cc].hasOwnProperty(k) && !seen[k] && TL[k]) { seen[k] = 1; }
      for (k in seen) if (seen.hasOwnProperty(k)) out.push([k, true]);
    }
    return out;
  }
  function bins(vals) { var v = vals.slice().sort(function (a, b) { return a - b; }), q = []; for (var i = 1; i < 5; i++) q.push(v[Math.min(v.length - 1, Math.floor(i * v.length / 5))]); return q; }
  function cls(v, q) { if (v == null) return 'gb-cx'; for (var i = 0; i < q.length; i++) if (v < q[i]) return 'gb-c' + i; return 'gb-c4'; }
  // lista [[id, nombre, valor, valorAnterior]] segun el desglose
  function cells(d, yi, lg) {
    var out = [], i, id;
    if (st.lvl === 'prov' && st.m === 'price') {
      var V = d.price.prov.values;
      for (id in V) if (V.hasOwnProperty(id)) out.push([id, provName(id, d), V[id][st.type] != null ? V[id][st.type] : null, null]);
      return out;
    }
    var M = global.DEHESA_ES_CCAA;
    if (M) for (i = 0; i < M.states.length; i++) { id = M.states[i].id; out.push([id, ccaaName(id, lg), val(d, id, st.type, yi), yi > 0 ? val(d, id, st.type, yi - 1) : null]); }
    return out;
  }
  function mapHtml(d, lg, list, yi) {
    var t = T[lg], M = st.lvl === 'prov' && st.m === 'price' ? global.DEHESA_ES_PROVINCES : global.DEHESA_ES_CCAA; if (!M) return '';
    var vals = [], by = {}, i;
    for (i = 0; i < list.length; i++) { by[list[i][0]] = list[i]; if (list[i][2] != null) vals.push(list[i][2]); }
    if (!vals.length) return '<div class="wp-hist">' + esc(t.noData) + '</div>';
    var q = bins(vals), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var paths = M.states.map(function (s) { var c = by[s.id], v = c ? c[2] : null; return '<path class="gb-prov ' + cls(v, q) + '" data-id="' + s.id + '" tabindex="0" aria-label="' + esc((c ? c[1] : s.name) + ': ' + (v != null ? eur(v, lg) : t.noData)) + '" d="' + s.d + '"/>'; }).join('');
    var leg = '<div class="wp-legend gb-leg">' + [0, 1, 2, 3, 4].map(function (k) { var a = k ? q[k - 1] : lo, b = k < 4 ? q[k] : hi; return '<span><i class="gb-key gb-c' + k + '"></i>' + esc(fmt(a, lg) + '–' + fmt(b, lg)) + '</span>'; }).join('') + '<span><i class="gb-key gb-cx"></i>' + esc(t.noData) + '</span></div>';
    return '<div class="gb-mapwrap"><div class="di-info-card-title gb-sub">' + esc(st.lvl === 'prov' && st.m === 'price' ? t.mapP : t.map) + ' · ' + esc(tl(st.type, lg)) + ' · ' + esc(String(st.lvl === 'prov' && st.m === 'price' ? d.price.prov.year : d.years[yi])) + '</div><div class="wp-readout gb-tip" aria-live="polite">' + esc(t.hoverMap) + '</div>' +
      '<svg class="gb-map" viewBox="' + M.viewBox + '" role="img" aria-label="' + esc(t.map) + '">' + paths + '</svg>' + leg + '</div>';
  }
  function tableHtml(d, lg, list, showChg) {
    var t = T[lg], rows = list.filter(function (c) { return c[2] != null; }).sort(function (a, b) { return a[1].localeCompare(b[1], LOC[lg]); });
    return '<details class="gb-all"><summary>' + esc(t.all) + '</summary><div class="gb-tw"><table class="di-table"><thead><tr><th>' + esc(t.reg) + '</th><th>' + esc(t.val) + '</th>' + (showChg ? '<th>' + esc(t.chg) + '</th>' : '') + '</tr></thead><tbody>' +
      rows.map(function (c) { return '<tr><td>' + esc(c[1]) + '</td><td>' + eur(c[2], lg) + '</td>' + (showChg ? '<td>' + (c[3] != null ? pct((c[2] / c[3] - 1) * 100, lg) : '—') + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div></details>';
  }
  function chart(d, lg) {
    var t = T[lg], Y = d.years, pts = [], i, v;
    for (i = 0; i < Y.length; i++) { v = val(d, st.reg, st.type, i); if (v != null) pts.push([Y[i], v]); }
    var regs = ['ES'].concat(Object.keys(d.price.ccaa).filter(function (k) { return k !== 'ES'; }).sort(function (a, b) { return ccaaName(a, lg).localeCompare(ccaaName(b, lg), LOC[lg]); }));
    var sel = '<label class="wp-sel"><span>' + esc(t.evoIn) + '</span><select class="di-compare-select gb-reg" data-chips aria-label="' + esc(t.evoIn) + '">' + regs.map(function (k) { return '<option value="' + k + '"' + (k === st.reg ? ' selected' : '') + '>' + esc(ccaaName(k, lg)) + '</option>'; }).join('') + '</select></label>';
    var head = '<div class="di-info-card-title gb-sub">' + esc(t.evo) + ' · ' + esc(tl(st.type, lg)) + '</div><div class="wd-sels">' + sel + '</div>';
    if (pts.length < 2) return { html: head + '<div class="wp-hist">' + esc(t.noData) + '</div>' };
    var W = 560, H = 200, L = 52, R = 14, Tp = 16, B = 24, lo = 1e18, hi = 0;
    for (i = 0; i < pts.length; i++) { lo = Math.min(lo, pts[i][1]); hi = Math.max(hi, pts[i][1]); }
    var rg = (hi - lo) || hi * 0.2, raw = rg / 3, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / mag, stp = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
    lo = Math.max(0, Math.floor(lo / stp) * stp); hi = Math.ceil(hi / stp) * stp; if (hi - lo < stp) hi = lo + stp;
    var X = function (y) { return L + (y - Y[0]) / Math.max(1, Y[Y.length - 1] - Y[0]) * (W - L - R); }, Yy = function (x) { return Tp + (hi - x) / (hi - lo) * (H - Tp - B); };
    var grid = '';
    for (var gv = lo; gv <= hi + 1e-9; gv += stp) { grid += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Yy(gv).toFixed(1) + '" y2="' + Yy(gv).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Yy(gv) + 3.5).toFixed(1) + '" text-anchor="end">' + esc(fmt(gv, lg)) + '</text>'; }
    for (i = 0; i < Y.length; i++) grid += '<text class="wp-tick" x="' + X(Y[i]).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + Y[i] + '</text>';
    var path = '', dots = '';
    for (i = 0; i < pts.length; i++) { path += (i ? 'L' : 'M') + X(pts[i][0]).toFixed(1) + ' ' + Yy(pts[i][1]).toFixed(1); dots += '<circle class="wp-dot wp-dot-t" cx="' + X(pts[i][0]).toFixed(1) + '" cy="' + Yy(pts[i][1]).toFixed(1) + '" r="3.5"/>'; }
    var html = head + '<div class="wp-chart gb-chart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.evo + ' · ' + ccaaName(st.reg, lg)) + '">' + grid +
      '<path class="wp-line wp-line-t" d="' + path + '"/>' + dots + '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg></div>';
    return { html: html, pts: pts, X: X, W: W };
  }
  function bindChart(root, c, d, lg) {
    var box = root.querySelector('.gb-chart'); if (!box || !c.pts) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), t = T[lg];
    var pin = -1, VSL = { es: ['frente a', 'desde'], en: ['vs', 'since'], fr: ['par rapport à', 'depuis'], it: ['rispetto al', 'dal'] }[lg] || ['vs', 'since'],
      HP = { es: 'Pulsa un punto para ver su evolución en %.', en: 'Click a point to see its % change.', fr: 'Cliquez sur un point pour voir sa variation en %.', it: 'Fai clic su un punto per vedere la variazione in %.' }[lg] || '';
    function near(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, best = 0, bd = 1e9;
      for (var j = 0; j < c.pts.length; j++) { var dd = Math.abs(c.X(c.pts[j][0]) - vx); if (dd < bd) { bd = dd; best = j; } }
      return best;
    }
    function chg(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(lg, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
    function show(j, pinned) {
      var x = c.pts[j], px = c.X(x[0]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      var s = '<b>' + esc(ylabel(d, x[0], lg)) + '</b> · ' + esc(ccaaName(st.reg, lg)) + ' <b>' + eur(x[1], lg) + '</b>';
      if (pinned) {
        var ps = [];
        if (j > 0 && c.pts[j - 1][1]) ps.push('<b>' + chg((x[1] / c.pts[j - 1][1] - 1) * 100) + '</b> ' + VSL[0] + ' ' + c.pts[j - 1][0]);
        if (j > 1 && c.pts[0][1]) ps.push('<b>' + chg((x[1] / c.pts[0][1] - 1) * 100) + '</b> ' + VSL[1] + ' ' + c.pts[0][0]);
        if (ps.length) s += '<br>' + ps.join(' · ');
      }
      ro.innerHTML = s;
      Array.prototype.forEach.call(svg.querySelectorAll('.wp-dot'), function (d, k) { d.setAttribute('r', pinned && k === j ? 6 : 3.5); });
    }
    svg.addEventListener('mousemove', function (ev) { if (pin < 0) show(near(ev), false); });
    svg.addEventListener('touchstart', function (ev) { if (pin < 0) show(near(ev), false); }, { passive: true });
    svg.addEventListener('touchmove', function (ev) { if (pin < 0) show(near(ev), false); }, { passive: true });
    svg.addEventListener('click', function (ev) { var j = near(ev); pin = pin === j ? -1 : j; show(j, pin >= 0); });
    svg.addEventListener('mouseleave', function () { if (pin < 0) { cr.style.display = 'none'; ro.textContent = t.hover + ' ' + HP; } });
    ro.textContent = t.hover + ' ' + HP;
  }
  function bindMap(root, list, lg) {
    var svg = root.querySelector('.gb-map'); if (!svg) return;
    var tip = root.querySelector('.gb-tip'), t = T[lg], by = {}, on = null, i;
    for (i = 0; i < list.length; i++) by[list[i][0]] = list[i];
    function show(el) {
      if (on) on.classList.remove('gb-on'); on = el;
      if (!el) { tip.textContent = t.hoverMap; return; }
      el.classList.add('gb-on'); var id = el.getAttribute('data-id'), c = by[id];
      tip.innerHTML = '<b>' + esc(c ? c[1] : id) + '</b> · ' + (c && c[2] != null ? '<b>' + eur(c[2], lg) + '</b>' + (c[3] != null ? ' · ' + esc(t.vsPrev) + ' ' + pct((c[2] / c[3] - 1) * 100, lg) : '') : esc(t.noData));
    }
    function pick(ev) { var el = ev.target; show(el && el.getAttribute && el.getAttribute('data-id') ? el : null); }
    svg.addEventListener('mouseover', pick); svg.addEventListener('focusin', pick); svg.addEventListener('click', pick);
    svg.addEventListener('mouseleave', function () { show(null); });
  }
  var CACHE = null, SCR = {};
  function load() { return CACHE || (CACHE = fetch('data/spain-land/land.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function script(src, have) {
    if (have()) return Promise.resolve();
    return SCR[src] || (SCR[src] = new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
  }
  function names() { return script('js/region-names.js', function () { return !!global.DehesaRegionNames; }); }
  function opts(arr, cur) { return arr.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function sel(label, cls, arr, cur) { return '<label class="wp-sel"><span>' + esc(label) + '</span><select class="di-compare-select ' + cls + '" data-chips aria-label="' + esc(label) + '">' + opts(arr, cur) + '</select></label>'; }
  function render(el) {
    Promise.all([load(), script('vendor/es-ccaa.js', function () { return !!global.DEHESA_ES_CCAA; }), script('vendor/es-provinces.js', function () { return !!global.DEHESA_ES_PROVINCES; }), names()]).then(function (res) {
      var d = res[0]; if (!d || !d.years || !d.price || !d.rent) { el.hidden = true; return; }
      var lg = lang(), t = T[lg], last = d.years.length - 1;
      function draw(focus) {
        var tys = typesFor(d), ok = false, i;
        for (i = 0; i < tys.length; i++) if (tys[i][0] === st.type) ok = true;
        if (!ok) { st.type = tys.length ? tys[0][0] : 'PT'; for (i = 0; i < tys.length; i++) if (tys[i][0] === 'TAS') st.type = 'TAS'; }
        var other = st.m === 'rent' && !d.rentTypes[st.type];
        if (other) st.year = d.rent.other.year;
        if (st.year == null || d.years.indexOf(st.year) < 0) st.year = d.years[last];
        var yi = d.years.indexOf(st.year), provMode = st.lvl === 'prov' && st.m === 'price';
        if (provMode) yi = last;
        var list = cells(d, yi, lg), nat = val(d, 'ES', st.type, yi), natPrev = yi > 0 ? val(d, 'ES', st.type, yi - 1) : null, natFirst = val(d, 'ES', st.type, 0);
        var have = list.filter(function (c) { return c[2] != null; }), mx = null, mn = null;
        for (i = 0; i < have.length; i++) { if (!mx || have[i][2] > mx[2]) mx = have[i]; if (!mn || have[i][2] < mn[2]) mn = have[i]; }
        var c = chart(d, lg);
        var typeSel = '', grp = [], oth = [];
        for (i = 0; i < tys.length; i++) (tys[i][1] ? oth : grp).push([tys[i][0], tl(tys[i][0], lg)]);
        typeSel = '<label class="wp-sel"><span>' + esc(t.type) + '</span><select class="di-compare-select gb-type" data-chips aria-label="' + esc(t.type) + '">' + opts(grp, st.type) + (oth.length ? '<optgroup label="' + esc(t.other.replace('{y}', d.rent.other.year)) + '">' + opts(oth, st.type) + '</optgroup>' : '') + '</select></label>';
        var sels = '<div class="wd-sels">' + sel(t.meas, 'gb-m', [['price', t.price], ['rent', t.rent]], st.m) + typeSel +
          (st.m === 'price' ? sel(t.level, 'gb-lvl', [['ccaa', t.lccaa], ['prov', t.lprov]], st.lvl) : '') +
          (!provMode && !other ? sel(t.year, 'gb-year', d.years.slice().reverse().map(function (y) { return [y, ylabel(d, y, lg)]; }), st.year) : '') + '</div>';
        var stat = row(t.natRow + ' · ' + (provMode ? d.price.prov.year : ylabel(d, d.years[yi], lg)), nat != null ? '<b>' + eur(nat, lg) + '</b>' : esc(t.noData)) +
          (natPrev != null && nat != null ? row(t.vsPrev, pct((nat / natPrev - 1) * 100, lg) + ' · ' + eur(natPrev, lg)) : '') +
          (natFirst != null && nat != null && yi > 1 ? row(t.vsFirst.replace('{y}', d.years[0]), pct((nat / natFirst - 1) * 100, lg) + ' · ' + eur(natFirst, lg)) : '') +
          (mx && mn && mx[0] !== mn[0] ? row(st.m === 'rent' ? t.hiR : t.hi, esc(mx[1]) + ' · <b>' + eur(mx[2], lg) + '</b>') + row(st.m === 'rent' ? t.loR : t.lo, esc(mn[1]) + ' · <b>' + eur(mn[2], lg) + '</b>') : '');
        el.innerHTML = '<div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div><div class="di-card di-info-card wp-card gb-card"><div class="di-info-card-title">' + esc(t.h) + '</div>' + sels + '<div class="di-info-stat-list">' + stat + '</div>' +
          mapHtml(d, lg, list, yi) + tableHtml(d, lg, list, !provMode) + (provMode ? '<div class="wp-hist">' + esc(t.provNote.replace('{y}', d.price.prov.year)) + '</div>' : '') + c.html +
          (global.DehesaDataTrust ? global.DehesaDataTrust.info({ src: 'MAPA (Estadística agraria)', url: d.source.url, fq: 'annual', mk: t.mk, ty: t.ty, ob: t.ob, me: t.me, st: 'official' }, lg) : '') + '</div>' +
          '<div class="di-info-scope-note">' + esc(t.note) + '</div><div class="di-field-hint di-info-sources">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">MAPA, Estadística agraria</a><br>' + esc(t.cite) + '</div>';
        bindChart(el, c, d, lg); bindMap(el, list, lg);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-gb')) {
        el.setAttribute('data-gb', '1');
        el.addEventListener('change', function (ev) {
          var c = ' ' + (ev.target.className || '') + ' ', v = ev.target.value;
          if (c.indexOf(' gb-m ') >= 0) { st.m = v; if (v === 'rent') { st.type = 'GEN'; st.lvl = 'ccaa'; } else st.type = 'PT'; draw('.gb-m'); }
          else if (c.indexOf(' gb-type ') >= 0) { st.type = v; draw('.gb-type'); }
          else if (c.indexOf(' gb-lvl ') >= 0) { st.lvl = v; draw('.gb-lvl'); }
          else if (c.indexOf(' gb-year ') >= 0) { st.year = parseInt(v, 10); draw('.gb-year'); }
          else if (c.indexOf(' gb-reg ') >= 0) { st.reg = v; draw('.gb-reg'); }
        });
      }
    });
  }
  // sigue la visibilidad de la pestaña «España» (#in-es); se dibuja la primera vez que se abre y al cambiar de idioma
  function init() {
    var tab = document.getElementById('in-es'), el = document.getElementById('in-es-land'); if (!tab || !el) return;
    var drawn = false;
    function sync() { el.hidden = tab.hidden; if (!tab.hidden && !drawn) { drawn = true; render(el); } }
    if (global.MutationObserver) new MutationObserver(sync).observe(tab, { attributes: true, attributeFilter: ['hidden'] });
    sync();
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); if (drawn) render(el); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  global.DehesaEsTierra = { render: render };
})(window);
