/* Dehesa Index — Sequía en Canadá (Canadian Drought Monitor, Agriculture and Agri-Food Canada y socios; Open Government Licence - Canada). ES5.
   Lee data/canada-drought.json: por provincia y territorio, % de la SUPERFICIE TOTAL (tierra y aguas interiores) en cada clase D0-D4, cada mes. Clases acumulativas. */
(function () {
  'use strict';
  var D = null, SEL = 'SK';
  var T = {
    es: { h: 'Sequía en Canadá', sub: 'Porcentaje de la superficie de cada provincia en sequía según el Canadian Drought Monitor (Agricultura y Agroalimentación de Canadá y socios). Mes de', cls: ['Anormalmente seco', 'Moderada', 'Severa', 'Extrema', 'Excepcional'],
      prov: 'Provincia', drought: 'En sequía (moderada o peor)', sev: 'Severa o peor', ext: 'Extrema o peor', dry: 'Seco o peor', ly: 'Mismo mes, año anterior', mom: 'Mes anterior', hist: 'Evolución mensual', pick: 'Pulsa una provincia para ver su evolución.', none: 'Sin datos de sequía de Canadá por ahora.', alt: '{n}: superficie en sequía moderada o peor, de {a} ({x} %) a {b} ({y} %)', d1: 'Moderada o peor', d3: 'Extrema o peor',
      note: 'Las clases son acumulativas: «moderada o peor» incluye también severa, extrema y excepcional. El porcentaje es de la superficie total de la provincia, no solo de la tierra agrícola: en las provincias del norte y en Quebec u Ontario la mayor parte del territorio no es agrícola. Cifras aproximadas: el cálculo usa una frontera generalizada (Natural Earth) que no coincide exactamente con la de la fuente. Los datos del último mes pueden revisarse.', src: 'Fuente' },
    en: { h: 'Drought in Canada', sub: 'Share of each province’s area in drought according to the Canadian Drought Monitor (Agriculture and Agri-Food Canada and partners). Month of', cls: ['Abnormally dry', 'Moderate', 'Severe', 'Extreme', 'Exceptional'],
      prov: 'Province', drought: 'In drought (moderate or worse)', sev: 'Severe or worse', ext: 'Extreme or worse', dry: 'Dry or worse', ly: 'Same month, last year', mom: 'Previous month', hist: 'Monthly trend', pick: 'Select a province to see its trend.', none: 'No Canadian drought data yet.', alt: '{n}: area in moderate drought or worse, from {a} ({x}%) to {b} ({y}%)', d1: 'Moderate or worse', d3: 'Extreme or worse',
      note: 'Classes are cumulative: “moderate or worse” also includes severe, extreme and exceptional. The percentage is of the province’s total area, not only farmland: in the northern provinces, Quebec and Ontario most of the territory is not agricultural. Figures are approximate: the calculation uses a generalised boundary (Natural Earth) that does not exactly match the source’s. The latest month can be revised.', src: 'Source' },
    fr: { h: 'Sécheresse au Canada', sub: 'Part de la superficie de chaque province en sécheresse selon le Moniteur canadien de la sécheresse (Agriculture et Agroalimentaire Canada et partenaires). Mois de', cls: ['Anormalement sec', 'Modérée', 'Grave', 'Extrême', 'Exceptionnelle'],
      prov: 'Province', drought: 'En sécheresse (modérée ou pire)', sev: 'Grave ou pire', ext: 'Extrême ou pire', dry: 'Sec ou pire', ly: 'Même mois, an dernier', mom: 'Mois précédent', hist: 'Évolution mensuelle', pick: 'Sélectionnez une province pour voir son évolution.', none: 'Pas encore de données de sécheresse pour le Canada.', alt: '{n} : superficie en sécheresse modérée ou pire, de {a} ({x} %) à {b} ({y} %)', d1: 'Modérée ou pire', d3: 'Extrême ou pire',
      note: 'Les classes sont cumulatives : « modérée ou pire » inclut aussi grave, extrême et exceptionnelle. Le pourcentage porte sur la superficie totale de la province, pas seulement les terres agricoles : dans les provinces du nord, au Québec et en Ontario, l’essentiel du territoire n’est pas agricole. Chiffres approximatifs : le calcul utilise une frontière généralisée (Natural Earth) qui ne coïncide pas exactement avec celle de la source. Les données du dernier mois peuvent être révisées.', src: 'Source' },
    it: { h: 'Siccità in Canada', sub: 'Quota della superficie di ogni provincia in siccità secondo il Canadian Drought Monitor (Agriculture and Agri-Food Canada e partner). Mese di', cls: ['Anormalmente secco', 'Moderata', 'Severa', 'Estrema', 'Eccezionale'],
      prov: 'Provincia', drought: 'In siccità (moderata o peggio)', sev: 'Severa o peggio', ext: 'Estrema o peggio', dry: 'Secco o peggio', ly: 'Stesso mese, anno scorso', mom: 'Mese precedente', hist: 'Andamento mensile', pick: 'Seleziona una provincia per vedere l’andamento.', none: 'Ancora nessun dato di siccità per il Canada.', alt: '{n}: superficie in siccità moderata o peggio, da {a} ({x}%) a {b} ({y}%)', d1: 'Moderata o peggio', d3: 'Estrema o peggio',
      note: 'Le classi sono cumulative: «moderata o peggio» include anche severa, estrema ed eccezionale. La percentuale è sulla superficie totale della provincia, non solo sui terreni agricoli: nelle province del nord, in Québec e in Ontario gran parte del territorio non è agricolo. Cifre approssimate: il calcolo usa un confine generalizzato (Natural Earth) che non coincide esattamente con quello della fonte. I dati dell’ultimo mese possono essere rivisti.', src: 'Fonte' }
  };
  var PN = { AB: { es: 'Alberta', en: 'Alberta', fr: 'Alberta', it: 'Alberta' }, BC: { es: 'Columbia Británica', en: 'British Columbia', fr: 'Colombie-Britannique', it: 'Columbia Britannica' }, MB: { es: 'Manitoba', en: 'Manitoba', fr: 'Manitoba', it: 'Manitoba' }, NB: { es: 'Nuevo Brunswick', en: 'New Brunswick', fr: 'Nouveau-Brunswick', it: 'Nuovo Brunswick' },
    NL: { es: 'Terranova y Labrador', en: 'Newfoundland and Labrador', fr: 'Terre-Neuve-et-Labrador', it: 'Terranova e Labrador' }, NS: { es: 'Nueva Escocia', en: 'Nova Scotia', fr: 'Nouvelle-Écosse', it: 'Nuova Scozia' }, NT: { es: 'Territorios del Noroeste', en: 'Northwest Territories', fr: 'Territoires du Nord-Ouest', it: 'Territori del Nord-Ovest' },
    NU: { es: 'Nunavut', en: 'Nunavut', fr: 'Nunavut', it: 'Nunavut' }, ON: { es: 'Ontario', en: 'Ontario', fr: 'Ontario', it: 'Ontario' }, PE: { es: 'Isla del Príncipe Eduardo', en: 'Prince Edward Island', fr: 'Île-du-Prince-Édouard', it: 'Isola del Principe Edoardo' }, QC: { es: 'Quebec', en: 'Quebec', fr: 'Québec', it: 'Québec' },
    SK: { es: 'Saskatchewan', en: 'Saskatchewan', fr: 'Saskatchewan', it: 'Saskatchewan' }, YT: { es: 'Yukón', en: 'Yukon', fr: 'Yukon', it: 'Yukon' } };
  var COL = ['#e0cf7a', '#e0b84a', '#e08a3a', '#b03a2e', '#6e1f1a'];
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function mon(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, 15)).toLocaleDateString(lang(), { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso.slice(0, 7); } }
  function pn(c) { return (PN[c] && (PN[c][lang()] || PN[c].es)) || D.provinces[c].name; }
  function ms(iso) { var p = iso.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function pc(v) { return nf(v, 1) + ' %'; }
  function idxYear(last) { var p = D.periods[last].split('-'), y = (+p[0] - 1) + '-' + p[1]; for (var i = 0; i < D.periods.length; i++) if (D.periods[i].slice(0, 7) === y) return i; return -1; }
  function chart(code, t) {
    var v = D.provinces[code].v, p1 = [], p3 = [];
    D.periods.forEach(function (p, i) { p1.push({ x: ms(p), y: v[i][1], l: p }); p3.push({ x: ms(p), y: v[i][3], l: p }); });
    if (p1.length < 4) return '';
    var n = p1.length - 1, al = t.alt.replace('{n}', pn(code)).replace('{a}', mon(D.periods[0])).replace('{x}', nf(v[0][1], 1)).replace('{b}', mon(D.periods[n])).replace('{y}', nf(v[n][1], 1));
    return '<h3 class="cof-h3">' + esc(pn(code)) + ' · ' + esc(t.hist) + '</h3>' + window.DehesaChart.render({ series: [{ name: t.d1, color: '#e08a3a', pts: p1 }, { name: t.d3, color: '#b03a2e', pts: p3 }], xMode: 'time', yMin: 0, yMax: 100, yTitle: '%', aria: al,
      vFmt: function (x) { return nf(x, 1) + ' %'; }, yFmt: function (x) { return nf(x, 0); } });
  }
  function render() {
    var root = document.getElementById('casq'); if (!root) return; var t = tt();
    if (!D || !D.provinces) { root.innerHTML = ''; return; }
    var last = D.periods.length - 1, ly = idxYear(last), codes = Object.keys(D.provinces).sort(function (a, b) { return D.provinces[b].v[last][1] - D.provinces[a].v[last][1]; });
    var legend = t.cls.map(function (n, i) { return '<span style="margin-right:12px;white-space:nowrap"><span style="color:' + COL[i] + '">■</span> D' + i + ' ' + esc(n) + '</span>'; }).join('');
    var rows = codes.map(function (c) {
      var r = D.provinces[c].v[last], pm = last > 0 ? D.provinces[c].v[last - 1] : null, yr = ly >= 0 ? D.provinces[c].v[ly] : null;
      var bar = [r[1] - r[2], r[2] - r[3], r[3] - r[4], r[4]].map(function (v, i) { return v > 0 ? '<span style="display:inline-block;height:12px;width:' + Math.min(100, v).toFixed(1) + '%;background:' + COL[i + 1] + '"></span>' : ''; }).join('');
      return '<tr style="cursor:pointer' + (c === SEL ? ';background:rgba(29,81,120,.06)' : '') + '"><th scope="row"><button type="button" class="casq-b" data-c="' + c + '" style="all:unset;cursor:pointer;font-weight:600">' + esc(pn(c)) + '</button></th><td class="cof-n"><strong>' + pc(r[1]) + '</strong></td><td class="cof-n">' + pc(r[2]) + '</td><td class="cof-n">' + pc(r[3]) + '</td><td class="cof-n">' + pc(r[0]) + '</td><td class="cof-n">' + (pm ? pc(pm[1]) : '') + '</td><td class="cof-n">' + (yr ? pc(yr[1]) : '') + '</td><td style="min-width:120px"><div style="display:flex;width:100%;background:var(--border);border-radius:3px;overflow:hidden">' + bar + '</div></td></tr>';
    }).join('');
    root.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + ' ' + esc(mon(D.asOf)) + '.</p><p class="cof-note" style="line-height:1.8">' + legend + '</p><div class="di-card" style="padding:6px 14px;overflow-x:auto"><table class="cof-tbl"><thead><tr><th scope="col">' + esc(t.prov) + '</th><th scope="col" class="cof-n">' + esc(t.drought) + '</th><th scope="col" class="cof-n">' + esc(t.sev) + '</th><th scope="col" class="cof-n">' + esc(t.ext) + '</th><th scope="col" class="cof-n">' + esc(t.dry) + '</th><th scope="col" class="cof-n">' + esc(t.mom) + '</th><th scope="col" class="cof-n">' + esc(t.ly) + '</th><th scope="col"></th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="cof-note">' + esc(t.pick) + '</p>' +
      '<div class="di-card" style="padding:12px 16px;margin-top:10px">' + chart(SEL, t) + '</div><p class="cof-note">' + esc(t.note) + '</p>' + (window.DICite ? window.DICite.html('aafc_drought', { period: D.asOf.slice(0, 7) }) : '');
    Array.prototype.forEach.call(root.querySelectorAll('.casq-b'), function (b) { b.onclick = function () { SEL = b.getAttribute('data-c'); render(); }; });
  }
  function boot() {
    if (!document.getElementById('casq')) return;
    Promise.all([fetch('data/canada-drought.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) { D = a[0]; render(); });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
