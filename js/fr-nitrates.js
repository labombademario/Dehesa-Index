/* Dehesa Index — Francia: nitratos en las aguas subterráneas por departamento (ADES/BRGM vía Hub'Eau). data/fr-nitrates.json
   (scripts/update-fr-nitrates.py). Bloque de la ficha de Francia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Nitratos en las aguas subterráneas de Francia', yr: 'Año {y}', pts: 'Puntos de control con análisis', med: 'Mediana de nitratos', o50: 'Puntos por encima de 50 mg/l', o25: 'Puntos por encima de 25 mg/l', map: '% de puntos por encima de 50 mg/l, por departamento · {y}', hint: 'Pasa el cursor o toca un departamento.', none: 'menos de 5 puntos con análisis', trend: '% de puntos por encima de 50 mg/l, cada año', medD: 'mediana', p: 'puntos',
      note: 'Para cada punto de control de las aguas subterráneas se toma la media de sus análisis del año; un análisis por debajo del límite de cuantificación cuenta como la mitad de ese límite. 50 mg/l es el límite para el agua potable y el que usa la Directiva de Nitratos para declarar una zona vulnerable; 25 mg/l es el nivel de vigilancia. La red no es igual de densa en todos los departamentos y cambia algo de un año a otro. Cálculos de Dehesa Index.', src: 'Fuente:', srcN: 'ADES (BRGM), calidad de las aguas subterráneas, vía Hub’Eau' },
    en: { h: 'Nitrates in France’s groundwater', yr: 'Year {y}', pts: 'Monitoring points with analyses', med: 'Median nitrate level', o50: 'Points above 50 mg/l', o25: 'Points above 25 mg/l', map: '% of points above 50 mg/l, by department · {y}', hint: 'Hover or tap a department.', none: 'fewer than 5 points with analyses', trend: '% of points above 50 mg/l, each year', medD: 'median', p: 'points',
      note: 'For each groundwater monitoring point we take the average of its analyses in the year; a result below the quantification limit counts as half that limit. 50 mg/l is the drinking-water limit and the level the Nitrates Directive uses to designate vulnerable zones; 25 mg/l is the watch level. The network is not equally dense in every department and changes slightly from year to year. Calculations by Dehesa Index.', src: 'Source:', srcN: 'ADES (BRGM), groundwater quality, via Hub’Eau' },
    fr: { h: 'Nitrates dans les eaux souterraines en France', yr: 'Année {y}', pts: 'Points de contrôle analysés', med: 'Teneur médiane en nitrates', o50: 'Points au-dessus de 50 mg/l', o25: 'Points au-dessus de 25 mg/l', map: '% de points au-dessus de 50 mg/l, par département · {y}', hint: 'Survolez ou touchez un département.', none: 'moins de 5 points analysés', trend: '% de points au-dessus de 50 mg/l, chaque année', medD: 'médiane', p: 'points',
      note: 'Pour chaque point de contrôle des eaux souterraines, on retient la moyenne de ses analyses de l’année ; un résultat inférieur à la limite de quantification compte pour la moitié de cette limite. 50 mg/l est la limite de potabilité et le seuil retenu par la directive Nitrates pour classer une zone vulnérable ; 25 mg/l est le seuil de vigilance. Le réseau n’a pas la même densité dans tous les départements et varie un peu d’une année à l’autre. Calculs de Dehesa Index.', src: 'Source :', srcN: 'ADES (BRGM), qualité des eaux souterraines, via Hub’Eau' },
    it: { h: 'Nitrati nelle acque sotterranee della Francia', yr: 'Anno {y}', pts: 'Punti di controllo con analisi', med: 'Mediana dei nitrati', o50: 'Punti sopra 50 mg/l', o25: 'Punti sopra 25 mg/l', map: '% di punti sopra 50 mg/l, per dipartimento · {y}', hint: 'Passa il cursore o tocca un dipartimento.', none: 'meno di 5 punti con analisi', trend: '% di punti sopra 50 mg/l, ogni anno', medD: 'mediana', p: 'punti',
      note: 'Per ogni punto di controllo delle acque sotterranee si prende la media delle analisi dell’anno; un risultato sotto il limite di quantificazione conta come la metà di quel limite. 50 mg/l è il limite per l’acqua potabile e la soglia che la Direttiva Nitrati usa per designare le zone vulnerabili; 25 mg/l è la soglia di attenzione. La rete non è ugualmente densa in tutti i dipartimenti e cambia un po’ da un anno all’altro. Calcoli di Dehesa Index.', src: 'Fonte:', srcN: 'ADES (BRGM), qualità delle acque sotterranee, tramite Hub’Eau' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc;
  function p1(v, lg) { return v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function mg(v, lg) { return v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mg/l'; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/fr-nitrates.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load()]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.years || !D.years.length) return false;
      var t = T[lg], Y = D.years[D.years.length - 1], vals = {}, k;
      for (k in Y.departments) if (Y.departments.hasOwnProperty(k) && Y.departments[k][0] >= 5) vals[k] = Y.departments[k][3];
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [2, 5, 10, 20], fmt: function (v, short) { return short ? Math.round(v) + ' %' : p1(v, lg); }, label: t.map.replace('{y}', Y.year), none: t.none }) : null;
      var mx = 0; D.years.forEach(function (y) { mx = Math.max(mx, y.over50); }); mx = Math.max(5, Math.ceil(mx / 5) * 5);
      var bars = '<div class="on-bars" role="img" aria-label="' + esc(t.trend) + '">' + D.years.map(function (y) { return '<span title="' + esc(y.year + ': ' + p1(y.over50, lg) + ' · ' + t.medD + ' ' + mg(y.median, lg)) + '"><b>' + y.over50.toLocaleString(LOC[lg], { maximumFractionDigits: 1 }) + '</b><i style="height:' + (y.over50 / mx * 90).toFixed(1) + 'px"' + (y === Y ? ' class="on-cur"' : '') + '></i><small>' + String(y.year).slice(2) + '</small></span>'; }).join('') + '</div>';
      el.innerHTML = '<section class="di-card ps-rm gb-card on-card" id="ps-fr-nit" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.yr.replace('{y}', Y.year)) + '</p>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(t.pts, '<b>' + Y.points.toLocaleString(LOC[lg]) + '</b>') + row(t.med, '<b>' + mg(Y.median, lg) + '</b>') + row(t.o50, '<b>' + p1(Y.over50, lg) + '</b>') + row(t.o25, p1(Y.over25, lg)) + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map.replace('{y}', Y.year)) + '</div><div class="wp-readout nt-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html : '') +
        '<div class="di-info-card-title gb-sub">' + esc(t.trend) + '</div>' + bars +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a> (Licence Ouverte 2.0)</p></section>';
      if (mp) M.bind(el, el.querySelector('.nt-tip'), t.hint, function (id) { var v = Y.departments[id], nm = (D.deptNames && D.deptNames[id]) || mp.names[id] || id; if (!v) return '<b>' + esc(nm) + '</b> · ' + esc(t.none); return '<b>' + esc(nm) + '</b> · ' + esc(t.o50) + ' <b>' + p1(v[3], lg) + '</b> · ' + esc(t.medD) + ' ' + mg(v[1], lg) + ' (' + v[0] + ' ' + esc(t.p) + ')'; });
      return true;
    });
  }
  global.DIFrNitrates = { mount: mount };
})(window);
