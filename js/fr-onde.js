/* Dehesa Index — Francia: ríos que se quedan sin agua (Observatoire national des étiages, ONDE, OFB) por departamento y mes.
   data/fr-onde.json (scripts/update-fr-onde.py). Se usa en sequia.html (#fronde) y en la pestaña «Sequía» de la ficha de Francia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { pick: 'Ver otra campaña', allFr: 'Francia (total)', chart: '{n} · % de puntos secos y sin corriente, mes a mes', clickHint: 'Pincha un departamento del mapa para ver su gráfico completo.', lgDry: 'Cauce seco', lgNof: 'Con agua pero sin corriente', noHist: 'Este departamento no tiene observaciones suficientes.', back: 'Ver Francia entera', h: 'Ríos sin agua en Francia (red ONDE)', at: 'Campaña de {m}', pts: 'Puntos de río observados', dry: 'Cauce seco', nof: 'Con agua pero sin corriente', flow: 'Con corriente', avg: 'Media de {m} en {a}–{b} (cauce seco)', map: '% de puntos secos o sin corriente, por departamento · {m}', hint: 'Pasa el cursor o toca un departamento.', none: 'sin observaciones ese mes', hist: '% de puntos con el cauce seco en {mm} de cada año', of: 'de',
      note: 'El Observatoire national des étiages (OFB) visita cada mes, de mayo a septiembre, unos 3.300 puntos de pequeños ríos y anota si el agua corre, si hay agua pero no corre o si el cauce está seco. Es la señal más directa de sequía en los ríos de cabecera, de donde beben el ganado y muchos riegos. En años de crisis hay visitas complementarias fuera de ese calendario. Porcentajes y medias: cálculo de Dehesa Index.', src: 'Fuente:', srcN: 'OFB, Observatoire national des étiages (ONDE), vía Hub’Eau' },
    en: { pick: 'View another survey', allFr: 'France (total)', chart: '{n} · % of points dry or not flowing, month by month', clickHint: 'Click a department on the map to see its full chart.', lgDry: 'Dry bed', lgNof: 'Water but no flow', noHist: 'This department does not have enough observations.', back: 'Show all of France', h: 'Rivers running dry in France (ONDE network)', at: '{m} survey', pts: 'River points observed', dry: 'Dry bed', nof: 'Water but no flow', flow: 'Flowing', avg: '{m} average in {a}–{b} (dry bed)', map: '% of points dry or not flowing, by department · {m}', hint: 'Hover or tap a department.', none: 'no observations that month', hist: '% of points with a dry bed in {mm} of each year', of: 'of',
      note: 'France’s National Low-Flow Observatory (OFB) visits about 3,300 points on small rivers every month from May to September and records whether water is flowing, standing without flow, or whether the bed is dry. It is the most direct sign of drought in headwater streams, which water livestock and many irrigators. In crisis years there are extra visits outside that calendar. Percentages and averages: calculated by Dehesa Index.', src: 'Source:', srcN: 'OFB, National Low-Flow Observatory (ONDE), via Hub’Eau' },
    fr: { pick: 'Voir une autre campagne', allFr: 'France entière', chart: '{n} · % de points en assec ou sans écoulement, mois par mois', clickHint: 'Cliquez sur un département de la carte pour voir son graphique complet.', lgDry: 'Assec', lgNof: 'Écoulement non visible', noHist: 'Ce département n’a pas assez d’observations.', back: 'Voir toute la France', h: 'Cours d’eau à sec en France (réseau ONDE)', at: 'Campagne de {m}', pts: 'Points observés', dry: 'Assec', nof: 'Écoulement non visible', flow: 'Écoulement visible', avg: 'Moyenne de {m} en {a}–{b} (assec)', map: '% de points en assec ou sans écoulement visible, par département · {m}', hint: 'Survolez ou touchez un département.', none: 'pas d’observation ce mois-là', hist: '% de points en assec en {mm} de chaque année', of: 'sur',
      note: 'L’Observatoire national des étiages (OFB) visite chaque mois, de mai à septembre, environ 3 300 points sur de petits cours d’eau et note si l’eau s’écoule, si elle stagne sans écoulement visible ou si le lit est à sec. C’est le signe le plus direct de sécheresse en tête de bassin, là où s’abreuve le bétail et où puisent de nombreux irrigants. Les années de crise, des campagnes complémentaires s’ajoutent. Pourcentages et moyennes : calcul de Dehesa Index.', src: 'Source :', srcN: 'OFB, Observatoire national des étiages (ONDE), via Hub’Eau' },
    it: { pick: 'Vedi un’altra rilevazione', allFr: 'Francia (totale)', chart: '{n} · % di punti asciutti o senza corrente, mese per mese', clickHint: 'Clicca un dipartimento sulla mappa per vedere il suo grafico completo.', lgDry: 'Alveo asciutto', lgNof: 'Acqua ma senza corrente', noHist: 'Questo dipartimento non ha abbastanza osservazioni.', back: 'Mostra tutta la Francia', h: 'Fiumi in secca in Francia (rete ONDE)', at: 'Rilevazione di {m}', pts: 'Punti osservati', dry: 'Alveo asciutto', nof: 'Acqua ma senza corrente', flow: 'Con corrente', avg: 'Media di {m} nel {a}–{b} (alveo asciutto)', map: '% di punti asciutti o senza corrente, per dipartimento · {m}', hint: 'Passa il cursore o tocca un dipartimento.', none: 'nessuna osservazione quel mese', hist: '% di punti con alveo asciutto a {mm} di ogni anno', of: 'su',
      note: 'L’Osservatorio nazionale delle magre (OFB) visita ogni mese, da maggio a settembre, circa 3.300 punti su piccoli corsi d’acqua e annota se l’acqua scorre, se c’è acqua ferma o se l’alveo è asciutto. È il segnale più diretto di siccità nei corsi d’acqua di testata, dove si abbevera il bestiame e attingono molti irrigatori. Negli anni di crisi ci sono visite aggiuntive. Percentuali e medie: calcolo di Dehesa Index.', src: 'Fonte:', srcN: 'OFB, Osservatorio nazionale delle magre (ONDE), tramite Hub’Eau' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc;
  function mon(k, lg, longY) { var d = new Date(k + '-15T12:00:00Z'); return d.toLocaleDateString(LOC[lg], longY === false ? { month: 'long', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function p1(v, lg) { return v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  var CACHE = null;
  var NS = 'http://www.w3.org/2000/svg';
  function sum3(v) { return v[0] + v[1] + v[2]; }
  /* gráfico mensual completo (barras apiladas: cauce seco + con agua pero sin corriente) de un departamento o de toda Francia */
  function chartHtml(ms, id, t, lg, curKey) {
    var pts = [], i;
    for (i = 0; i < ms.length; i++) { var v = id ? ms[i].departments[id] : ms[i].total; if (!v) continue; var n = sum3(v); if (n < (id ? 5 : 1000)) continue; pts.push({ m: ms[i].month, dry: 100 * v[2] / n, nof: 100 * v[1] / n, n: n }); }
    if (pts.length < 3) return '<p class="di-movers-hint">' + esc(t.noHist) + '</p>';
    var y0 = parseInt(pts[0].m.slice(0, 4), 10), y1 = parseInt(pts[pts.length - 1].m.slice(0, 4), 10), slots = (y1 - y0 + 1) * 12, W = 1000, H = 230, L = 34, B = 24, T0 = 8, sw = (W - L) / slots, bw = Math.max(2, sw * 0.72), ph = H - B - T0;
    var mx = 0; pts.forEach(function (p) { mx = Math.max(mx, p.dry + p.nof); }); mx = Math.max(20, Math.ceil(mx / 20) * 20);
    var g = '', k;
    for (k = 0; k <= 4; k++) { var yv = mx * k / 4, yy = T0 + ph - ph * k / 4; g += '<line x1="' + L + '" x2="' + W + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="currentColor" stroke-opacity=".15"/><text x="' + (L - 4) + '" y="' + (yy + 3).toFixed(1) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".7">' + Math.round(yv) + '%</text>'; }
    for (k = y0; k <= y1; k++) g += '<text x="' + (L + ((k - y0) * 12 + 6) * sw).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".7">' + k + '</text>';
    pts.forEach(function (p) {
      var yr = parseInt(p.m.slice(0, 4), 10), mo = parseInt(p.m.slice(5), 10) - 1, x = L + ((yr - y0) * 12 + mo) * sw + (sw - bw) / 2, hd = ph * p.dry / mx, hn = ph * p.nof / mx, cur = p.m === curKey;
      g += '<g><title>' + esc(mon(p.m, lg) + ' · ' + t.dry + ' ' + p1(p.dry, lg) + ' · ' + t.nof + ' ' + p1(p.nof, lg) + ' (' + p.n + ')') + '</title><rect x="' + x.toFixed(1) + '" y="' + (T0 + ph - hd).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hd.toFixed(1) + '" fill="var(--gb4)"' + (cur ? ' stroke="currentColor" stroke-width="1.5"' : '') + '/><rect x="' + x.toFixed(1) + '" y="' + (T0 + ph - hd - hn).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hn.toFixed(1) + '" fill="var(--gb2)"/></g>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:900px;height:auto;display:block" role="img" aria-label="' + esc(t.chart.replace('{n}', '')) + '">' + g + '</svg><div class="wp-legend gb-leg"><span><i class="gb-key gb-c4"></i>' + esc(t.lgDry) + '</span><span><i class="gb-key gb-c2"></i>' + esc(t.lgNof) + '</span></div>';
  }
  function mount(el, lg, opt) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/fr-onde.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load()]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.months || !D.months.length) return false;
      var t = T[lg], ms = D.months, i, main = null, selD = '';
      var big = ms.filter(function (m) { return sum3(m.total) >= 1000; });
      for (i = ms.length - 1; i >= 0; i--) { if (sum3(ms[i].total) >= 1500) { main = ms[i]; break; } }
      if (!main) main = ms[ms.length - 1];
      function draw() {
        var tot = main.total, n = sum3(tot), mm = main.month.slice(5), yr = parseInt(main.month.slice(0, 4), 10);
        var same = ms.filter(function (m) { return m.month.slice(5) === mm && sum3(m.total) >= 1000; });
        var prev = same.filter(function (m) { return parseInt(m.month.slice(0, 4), 10) < yr; }), avg = null;
        if (prev.length) { avg = 0; prev.forEach(function (m) { avg += 100 * m.total[2] / sum3(m.total); }); avg /= prev.length; }
        var vals = {}, k; for (k in main.departments) if (main.departments.hasOwnProperty(k)) { var v = main.departments[k], sn = sum3(v); if (sn >= 5) vals[k] = 100 * (v[1] + v[2]) / sn; }
        var mp = MAP ? M.html(MAP, { values: vals, cuts: [5, 15, 30, 50], fmt: function (v, short) { return short ? Math.round(v) + ' %' : p1(v, lg); }, label: t.map.replace('{m}', mon(main.month, lg)), none: t.none }) : null;
        var mx = 0; same.forEach(function (m) { mx = Math.max(mx, 100 * m.total[2] / sum3(m.total)); }); mx = Math.max(10, Math.ceil(mx / 10) * 10);
        var bars = '<div class="on-bars" role="img" aria-label="' + esc(t.hist.replace('{mm}', mon(main.month, lg, false))) + '">' + same.map(function (m) { var s = sum3(m.total), p = 100 * m.total[2] / s; return '<span title="' + esc(m.month.slice(0, 4) + ': ' + p1(p, lg)) + '"><b>' + Math.round(p) + '</b><i style="height:' + (p / mx * 90).toFixed(1) + 'px"' + (m === main ? ' class="on-cur"' : '') + '></i><small>' + m.month.slice(2, 4) + '</small></span>'; }).join('') + '</div>';
        var opts = big.slice().reverse().map(function (m) { return '<option value="' + m.month + '"' + (m === main ? ' selected' : '') + '>' + esc(mon(m.month, lg)) + '</option>'; }).join('');
        var nm = function (id) { return id ? ((D.deptNames && D.deptNames[id]) || (mp && mp.names[id]) || id) : t.allFr; };
        el.innerHTML = '<section class="di-card ps-rm gb-card on-card" id="fr-onde" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2>' +
          '<label class="di-movers-hint" style="display:block;margin:0 0 10px">' + esc(t.pick) + ' <select class="di-compare-select" data-on="m" data-chips>' + opts + '</select></label>' +
          '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{m}', mon(main.month, lg))) + '</p>' +
          '<div class="di-info-stat-list" style="max-width:640px">' + row(t.pts, '<b>' + n.toLocaleString(LOC[lg]) + '</b>') + row(t.dry, '<b>' + p1(100 * tot[2] / n, lg) + '</b> (' + tot[2] + ')') + row(t.nof, p1(100 * tot[1] / n, lg) + ' (' + tot[1] + ')') + row(t.flow, p1(100 * tot[0] / n, lg) + ' (' + tot[0] + ')') +
          (avg != null ? row(t.avg.replace('{m}', mon(main.month, lg, false)).replace('{a}', prev[0].month.slice(0, 4)).replace('{b}', prev[prev.length - 1].month.slice(0, 4)), p1(avg, lg)) : '') + '</div>' +
          (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map.replace('{m}', mon(main.month, lg))) + '</div><div class="wp-readout on-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html + '<p class="di-field-hint" style="margin:4px 0 0">' + esc(t.clickHint) + '</p>' : '') +
          '<div class="di-info-card-title gb-sub on-ct"></div><div class="on-chart"></div>' +
          '<div class="di-info-card-title gb-sub">' + esc(t.hist.replace('{mm}', mon(main.month, lg, false))) + '</div>' + bars +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a> (Licence Ouverte 2.0)</p></section>';
        function chart() {
          var ct = el.querySelector('.on-ct'), cb = el.querySelector('.on-chart'); if (!ct || !cb) return;
          ct.innerHTML = esc(t.chart.replace('{n}', nm(selD))) + (selD ? ' <button type="button" class="di-src-tab" data-on="all">' + esc(t.back) + '</button>' : '');
          cb.innerHTML = chartHtml(ms, selD, t, lg, main.month);
          var bk = ct.querySelector('[data-on="all"]'); if (bk) bk.addEventListener('click', function () { selD = ''; chart(); });
        }
        chart();
        var sel = el.querySelector('select[data-on="m"]');
        if (sel) sel.addEventListener('change', function () { main = ms.filter(function (m) { return m.month === sel.value; })[0] || main; draw(); var s2 = el.querySelector('select[data-on="m"]'); if (s2) s2.focus(); });
        if (mp) {
          M.bind(el, el.querySelector('.on-tip'), t.hint, function (id) { var v = main.departments[id], nm2 = nm(id); if (!v) return '<b>' + esc(nm2) + '</b> · ' + esc(t.none); var sn = sum3(v); return '<b>' + esc(nm2) + '</b> · ' + esc(t.dry) + ' ' + v[2] + ' · ' + esc(t.nof) + ' ' + v[1] + ' · ' + esc(t.flow) + ' ' + v[0] + ' (' + sn + ')'; });
          var svg = el.querySelector('.fr-dmap');
          if (svg) svg.addEventListener('click', function (ev) { var d = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-id'); if (d) { selD = d; chart(); } });
        }
      }
      draw();
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
