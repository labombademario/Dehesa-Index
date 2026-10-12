/* Dehesa Index — Bélgica (Flandes): nitrato en las aguas superficiales de zonas agrícolas (red MAP de la VMM), por año de invierno.
   data/be-nitrates.json (scripts/update-be-nitrates.py). Ficha de Bélgica. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Nitratos en los ríos de zonas agrícolas de Flandes', last: 'Año de invierno {y}', pct: 'Puntos de control por encima de 50 mg/l', mean: 'Concentración media de nitrato', prev: 'Año anterior', min: 'Mínimo de la serie', goal: 'Objetivo del plan de abonado (2018)', chart: 'Puntos por encima de 50 mg/l, por año de invierno', lP: '% de puntos > 50 mg/l', lG: 'Objetivo 5 %', na: 'aún sin publicar',
      note: 'La Vlaamse Milieumaatschappij (VMM) controla una red de puntos en arroyos y canales en zonas agrícolas (red MAP). Cada «año de invierno» va de julio a junio, que es cuando el nitrato que sobra tras la cosecha se lava hacia el agua. El umbral de 50 mg/l es el de la Directiva de Nitratos de la UE; los planes de abonado flamencos fijaron como meta no superar el 16 % de puntos en 2014 y el 5 % en 2018. Valonia no publica un dato equivalente en formato abierto.', src: 'Fuente:', srcN: 'Vlaamse Milieumaatschappij, indicador «Nitraat in oppervlaktewater in landbouwgebied» (Modellicentie voor gratis hergebruik)' },
    en: { h: 'Nitrates in rivers in Flemish farming areas', last: 'Winter year {y}', pct: 'Monitoring points above 50 mg/l', mean: 'Mean nitrate concentration', prev: 'Previous year', min: 'Lowest in the series', goal: 'Manure action plan target (2018)', chart: 'Points above 50 mg/l, by winter year', lP: '% of points > 50 mg/l', lG: '5 % target', na: 'not yet published',
      note: 'The Flanders Environment Agency (VMM) monitors a network of points on streams and ditches in farming areas (the MAP network). Each “winter year” runs from July to June, when nitrate left over after harvest washes into the water. The 50 mg/l threshold comes from the EU Nitrates Directive; the Flemish manure action plans set targets of no more than 16 % of points above it in 2014 and 5 % in 2018. Wallonia does not publish an equivalent figure in open format.', src: 'Source:', srcN: 'Flanders Environment Agency (VMM), indicator “Nitraat in oppervlaktewater in landbouwgebied” (Modellicentie voor gratis hergebruik)' },
    fr: { h: 'Nitrates dans les cours d’eau des zones agricoles de Flandre', last: 'Année d’hiver {y}', pct: 'Points de contrôle au-dessus de 50 mg/l', mean: 'Concentration moyenne en nitrate', prev: 'Année précédente', min: 'Minimum de la série', goal: 'Objectif du plan d’action engrais (2018)', chart: 'Points au-dessus de 50 mg/l, par année d’hiver', lP: '% de points > 50 mg/l', lG: 'Objectif 5 %', na: 'pas encore publiée',
      note: 'La Vlaamse Milieumaatschappij (VMM) suit un réseau de points sur des ruisseaux et fossés en zone agricole (réseau MAP). Chaque « année d’hiver » va de juillet à juin, période où le nitrate resté après la récolte est lessivé vers l’eau. Le seuil de 50 mg/l est celui de la directive Nitrates de l’UE ; les plans d’action flamands visaient au plus 16 % de points au-dessus en 2014 et 5 % en 2018. La Wallonie ne publie pas de donnée équivalente en format ouvert.', src: 'Source :', srcN: 'Vlaamse Milieumaatschappij, indicateur « Nitraat in oppervlaktewater in landbouwgebied » (Modellicentie voor gratis hergebruik)' },
    it: { h: 'Nitrati nei corsi d’acqua delle zone agricole delle Fiandre', last: 'Anno invernale {y}', pct: 'Punti di controllo sopra 50 mg/l', mean: 'Concentrazione media di nitrato', prev: 'Anno precedente', min: 'Minimo della serie', goal: 'Obiettivo del piano d’azione sui fertilizzanti (2018)', chart: 'Punti sopra 50 mg/l, per anno invernale', lP: '% di punti > 50 mg/l', lG: 'Obiettivo 5 %', na: 'non ancora pubblicata',
      note: 'La Vlaamse Milieumaatschappij (VMM) controlla una rete di punti su ruscelli e fossi in zone agricole (rete MAP). Ogni «anno invernale» va da luglio a giugno, quando il nitrato rimasto dopo il raccolto viene dilavato verso l’acqua. La soglia di 50 mg/l è quella della direttiva Nitrati dell’UE; i piani d’azione fiamminghi puntavano a non superarla in più del 16 % dei punti nel 2014 e del 5 % nel 2018. La Vallonia non pubblica un dato equivalente in formato aperto.', src: 'Fonte:', srcN: 'Vlaamse Milieumaatschappij, indicatore «Nitraat in oppervlaktewater in landbouwgebied» (Modellicentie voor gratis hergebruik)' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function chart(S, lg, t) {
    var W = 560, H = 210, L = 34, R = 8, Tp = 10, B = 26, n = S.length, hi = 50, i;
    for (i = 0; i < n; i++) hi = Math.max(hi, Math.ceil(S[i][2] / 10) * 10);
    var bw = (W - L - R) / n, Y = function (v) { return Tp + (hi - v) / hi * (H - Tp - B); }, g = '', b = '';
    for (var v = 0; v <= hi; v += 10) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    for (i = 0; i < n; i++) {
      var x = L + i * bw, y = Y(S[i][2]);
      b += '<rect class="bn-bar' + (i === n - 1 ? ' bn-last' : '') + '" x="' + (x + bw * 0.15).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.7).toFixed(1) + '" height="' + (H - B - y).toFixed(1) + '" rx="1.5"><title>' + esc(S[i][0] + ': ' + nf(S[i][2], lg, 1) + ' %' + (S[i][1] != null ? ' · ' + nf(S[i][1], lg, 1) + ' mg/l' : '')) + '</title></rect>';
      if (i % 4 === 0 || i === n - 1) b += '<text class="wp-tick" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + esc(S[i][0].slice(2, 4) + '/' + S[i][0].slice(7, 9)) + '</text>';
    }
    g += '<line class="bn-goal" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(5).toFixed(1) + '" y2="' + Y(5).toFixed(1) + '"/>';
    return '<div class="di-info-card-title gb-sub">' + esc(t.chart) + '</div><div class="wp-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.chart) + '">' + g + b + '</svg><div class="wp-legend"><span><i class="wp-sw bn-sw"></i>' + esc(t.lP) + '</span><span><i class="wp-sw bn-sw-g"></i>' + esc(t.lG) + '</span></div></div>';
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/be-nitrates.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      if (!d || !d.series || !d.series.length) return false;
      var t = T[lg], S = d.series, x = S[S.length - 1], p = S[S.length - 2], mn = S[0];
      S.forEach(function (r) { if (r[2] < mn[2]) mn = r; });
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-be-nitrates" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
        row(t.last.replace('{y}', x[0]) + ' · ' + t.pct, '<b>' + nf(x[2], lg, 1) + ' %</b>') + row(t.mean, x[1] != null ? nf(x[1], lg, 1) + ' mg/l' : esc(t.na) + (p && p[1] != null ? ' · ' + esc(p[0]) + ': ' + nf(p[1], lg, 1) + ' mg/l' : '')) +
        (p ? row(t.prev + ' (' + p[0] + ')', nf(p[2], lg, 1) + ' %') : '') + row(t.min + ' (' + mn[0] + ')', nf(mn[2], lg, 1) + ' %') + row(t.goal, '5 %') + '</div>' + chart(S, lg, t) +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer" lang="nl">' + esc(t.srcN) + '</a></p></section>';
      return true;
    });
  }
  global.DIBeNitrates = { mount: mount };
})(window);
