/* Dehesa Index — Francia: ríos que se quedan sin agua (Observatoire national des étiages, ONDE, OFB) por departamento y mes.
   data/fr-onde.json (scripts/update-fr-onde.py). Se usa en sequia.html (#fronde) y en la pestaña «Sequía» de la ficha de Francia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Ríos sin agua en Francia (red ONDE)', at: 'Campaña de {m}', pts: 'Puntos de río observados', dry: 'Cauce seco', nof: 'Con agua pero sin corriente', flow: 'Con corriente', avg: 'Media de {m} en {a}–{b} (cauce seco)', map: '% de puntos secos o sin corriente, por departamento · {m}', hint: 'Pasa el cursor o toca un departamento.', none: 'sin observaciones ese mes', hist: '% de puntos con el cauce seco en {mm} de cada año', of: 'de',
      note: 'El Observatoire national des étiages (OFB) visita cada mes, de mayo a septiembre, unos 3.300 puntos de pequeños ríos y anota si el agua corre, si hay agua pero no corre o si el cauce está seco. Es la señal más directa de sequía en los ríos de cabecera, de donde beben el ganado y muchos riegos. En años de crisis hay visitas complementarias fuera de ese calendario. Porcentajes y medias: cálculo de Dehesa Index.', src: 'Fuente:', srcN: 'OFB, Observatoire national des étiages (ONDE), vía Hub’Eau' },
    en: { h: 'Rivers running dry in France (ONDE network)', at: '{m} survey', pts: 'River points observed', dry: 'Dry bed', nof: 'Water but no flow', flow: 'Flowing', avg: '{m} average in {a}–{b} (dry bed)', map: '% of points dry or not flowing, by department · {m}', hint: 'Hover or tap a department.', none: 'no observations that month', hist: '% of points with a dry bed in {mm} of each year', of: 'of',
      note: 'France’s National Low-Flow Observatory (OFB) visits about 3,300 points on small rivers every month from May to September and records whether water is flowing, standing without flow, or whether the bed is dry. It is the most direct sign of drought in headwater streams, which water livestock and many irrigators. In crisis years there are extra visits outside that calendar. Percentages and averages: calculated by Dehesa Index.', src: 'Source:', srcN: 'OFB, National Low-Flow Observatory (ONDE), via Hub’Eau' },
    fr: { h: 'Cours d’eau à sec en France (réseau ONDE)', at: 'Campagne de {m}', pts: 'Points observés', dry: 'Assec', nof: 'Écoulement non visible', flow: 'Écoulement visible', avg: 'Moyenne de {m} en {a}–{b} (assec)', map: '% de points en assec ou sans écoulement visible, par département · {m}', hint: 'Survolez ou touchez un département.', none: 'pas d’observation ce mois-là', hist: '% de points en assec en {mm} de chaque année', of: 'sur',
      note: 'L’Observatoire national des étiages (OFB) visite chaque mois, de mai à septembre, environ 3 300 points sur de petits cours d’eau et note si l’eau s’écoule, si elle stagne sans écoulement visible ou si le lit est à sec. C’est le signe le plus direct de sécheresse en tête de bassin, là où s’abreuve le bétail et où puisent de nombreux irrigants. Les années de crise, des campagnes complémentaires s’ajoutent. Pourcentages et moyennes : calcul de Dehesa Index.', src: 'Source :', srcN: 'OFB, Observatoire national des étiages (ONDE), via Hub’Eau' },
    it: { h: 'Fiumi in secca in Francia (rete ONDE)', at: 'Rilevazione di {m}', pts: 'Punti osservati', dry: 'Alveo asciutto', nof: 'Acqua ma senza corrente', flow: 'Con corrente', avg: 'Media di {m} nel {a}–{b} (alveo asciutto)', map: '% di punti asciutti o senza corrente, per dipartimento · {m}', hint: 'Passa il cursore o tocca un dipartimento.', none: 'nessuna osservazione quel mese', hist: '% di punti con alveo asciutto a {mm} di ogni anno', of: 'su',
      note: 'L’Osservatorio nazionale delle magre (OFB) visita ogni mese, da maggio a settembre, circa 3.300 punti su piccoli corsi d’acqua e annota se l’acqua scorre, se c’è acqua ferma o se l’alveo è asciutto. È il segnale più diretto di siccità nei corsi d’acqua di testata, dove si abbevera il bestiame e attingono molti irrigatori. Negli anni di crisi ci sono visite aggiuntive. Percentuali e medie: calcolo di Dehesa Index.', src: 'Fonte:', srcN: 'OFB, Osservatorio nazionale delle magre (ONDE), tramite Hub’Eau' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc;
  function mon(k, lg, longY) { var d = new Date(k + '-15T12:00:00Z'); return d.toLocaleDateString(LOC[lg], longY === false ? { month: 'long', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function p1(v, lg) { return v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/fr-onde.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load()]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.months || !D.months.length) return false;
      var t = T[lg], ms = D.months, i, main = null;
      for (i = ms.length - 1; i >= 0; i--) { var s = ms[i].total[0] + ms[i].total[1] + ms[i].total[2]; if (s >= 1500) { main = ms[i]; break; } }
      if (!main) main = ms[ms.length - 1];
      var tot = main.total, n = tot[0] + tot[1] + tot[2], mm = main.month.slice(5), yr = parseInt(main.month.slice(0, 4), 10);
      var same = ms.filter(function (m) { var s = m.total[0] + m.total[1] + m.total[2]; return m.month.slice(5) === mm && s >= 1000; });
      var prev = same.filter(function (m) { return parseInt(m.month.slice(0, 4), 10) < yr; }), avg = null;
      if (prev.length) { avg = 0; prev.forEach(function (m) { avg += 100 * m.total[2] / (m.total[0] + m.total[1] + m.total[2]); }); avg /= prev.length; }
      var vals = {}, k; for (k in main.departments) if (main.departments.hasOwnProperty(k)) { var v = main.departments[k], sn = v[0] + v[1] + v[2]; if (sn >= 5) vals[k] = 100 * (v[1] + v[2]) / sn; }
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [5, 15, 30, 50], fmt: function (v, short) { return short ? Math.round(v) + ' %' : p1(v, lg); }, label: t.map.replace('{m}', mon(main.month, lg)), none: t.none }) : null;
      var mx = 0; same.forEach(function (m) { mx = Math.max(mx, 100 * m.total[2] / (m.total[0] + m.total[1] + m.total[2])); }); mx = Math.max(10, Math.ceil(mx / 10) * 10);
      var bars = '<div class="on-bars" role="img" aria-label="' + esc(t.hist.replace('{mm}', mon(main.month, lg, false))) + '">' + same.map(function (m) { var s = m.total[0] + m.total[1] + m.total[2], p = 100 * m.total[2] / s; return '<span title="' + esc(m.month.slice(0, 4) + ': ' + p1(p, lg)) + '"><b>' + Math.round(p) + '</b><i style="height:' + (p / mx * 90).toFixed(1) + 'px"' + (m === main ? ' class="on-cur"' : '') + '></i><small>' + m.month.slice(2, 4) + '</small></span>'; }).join('') + '</div>';
      el.innerHTML = '<section class="di-card ps-rm gb-card on-card" id="fr-onde" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{m}', mon(main.month, lg))) + '</p>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(t.pts, '<b>' + n.toLocaleString(LOC[lg]) + '</b>') + row(t.dry, '<b>' + p1(100 * tot[2] / n, lg) + '</b> (' + tot[2] + ')') + row(t.nof, p1(100 * tot[1] / n, lg) + ' (' + tot[1] + ')') + row(t.flow, p1(100 * tot[0] / n, lg) + ' (' + tot[0] + ')') +
        (avg != null ? row(t.avg.replace('{m}', mon(main.month, lg, false)).replace('{a}', prev[0].month.slice(0, 4)).replace('{b}', prev[prev.length - 1].month.slice(0, 4)), p1(avg, lg)) : '') + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map.replace('{m}', mon(main.month, lg))) + '</div><div class="wp-readout on-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html : '') +
        '<div class="di-info-card-title gb-sub">' + esc(t.hist.replace('{mm}', mon(main.month, lg, false))) + '</div>' + bars +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a> (Licence Ouverte 2.0)</p></section>';
      if (mp) M.bind(el, el.querySelector('.on-tip'), t.hint, function (id) { var v = main.departments[id], nm = (D.deptNames && D.deptNames[id]) || mp.names[id] || id; if (!v) return '<b>' + esc(nm) + '</b> · ' + esc(t.none); var sn = v[0] + v[1] + v[2]; return '<b>' + esc(nm) + '</b> · ' + esc(t.dry) + ' ' + v[2] + ' · ' + esc(t.nof) + ' ' + v[1] + ' · ' + esc(t.flow) + ' ' + v[0] + ' (' + sn + ')'; });
      return true;
    });
  }
  global.DIFrOnde = { mount: mount };
  function auto() {
    var el = document.getElementById('fronde'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
