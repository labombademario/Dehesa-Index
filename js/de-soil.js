/* Dehesa Index — Alemania: humedad del suelo por Land (DWD, % de capacidad de campo útil, mes a mes desde 1991) frente a 1991-2020.
   data/de-soil-moisture.json (scripts/update-de-soil-moisture.py). En sequia.html (#desoil) y en la pestaña «Sequía» de la ficha de Alemania. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Humedad del suelo en Alemania (DWD)', at: '{m}', de: 'Alemania, media', avg: 'Media de {mm} en 1991-2020', rng: 'Mínimo y máximo de {mm} en 1991-2020', diff: 'Diferencia con la media', pts: 'puntos', map: 'Humedad del suelo por Land · {m} (diferencia con la media de 1991-2020)', hint: 'Pasa el cursor o toca un Land.', none: 'sin dato', chart: 'Alemania: humedad del suelo mes a mes', lV: 'Este año', lA: 'Media 1991-2020', lP: 'Año anterior', unit: '% nFK',
      note: 'Humedad media del suelo del mes bajo hierba en un suelo franco-arenoso, en porcentaje de la capacidad de campo útil (% nFK), que el servicio meteorológico alemán (DWD) calcula en una rejilla de 1 km. Por debajo del 50 % las plantas empiezan a notar la falta de agua y por debajo del 30 % hay estrés hídrico fuerte. Medias por Land y comparación con 1991-2020: cálculo de Dehesa Index.', src: 'Fuente:', srcN: 'Deutscher Wetterdienst (DWD), Climate Data Center' },
    en: { h: 'Soil moisture in Germany (DWD)', at: '{m}', de: 'Germany, average', avg: '{mm} average in 1991-2020', rng: '{mm} low and high in 1991-2020', diff: 'Difference from average', pts: 'points', map: 'Soil moisture by state · {m} (difference from the 1991-2020 average)', hint: 'Hover or tap a state.', none: 'no data', chart: 'Germany: soil moisture month by month', lV: 'This year', lA: '1991-2020 average', lP: 'Previous year', unit: '% nFK',
      note: 'Average monthly soil moisture under grass in a loamy-sand soil, as a percentage of plant-available water capacity (% nFK), calculated by Germany’s weather service (DWD) on a 1 km grid. Below 50 % plants start to feel the lack of water and below 30 % there is severe water stress. State averages and the comparison with 1991-2020: calculated by Dehesa Index.', src: 'Source:', srcN: 'Deutscher Wetterdienst (DWD), Climate Data Center' },
    fr: { h: 'Humidité du sol en Allemagne (DWD)', at: '{m}', de: 'Allemagne, moyenne', avg: 'Moyenne de {mm} en 1991-2020', rng: 'Minimum et maximum de {mm} en 1991-2020', diff: 'Écart à la moyenne', pts: 'points', map: 'Humidité du sol par Land · {m} (écart à la moyenne 1991-2020)', hint: 'Survolez ou touchez un Land.', none: 'pas de donnée', chart: 'Allemagne : humidité du sol mois par mois', lV: 'Cette année', lA: 'Moyenne 1991-2020', lP: 'Année précédente', unit: '% nFK',
      note: 'Humidité moyenne du sol du mois sous prairie dans un sol limono-sableux, en pourcentage de la réserve utile (% nFK), calculée par le service météorologique allemand (DWD) sur une grille de 1 km. Sous 50 %, les plantes commencent à manquer d’eau ; sous 30 %, le stress hydrique est fort. Moyennes par Land et comparaison avec 1991-2020 : calcul de Dehesa Index.', src: 'Source :', srcN: 'Deutscher Wetterdienst (DWD), Climate Data Center' },
    it: { h: 'Umidità del suolo in Germania (DWD)', at: '{m}', de: 'Germania, media', avg: 'Media di {mm} nel 1991-2020', rng: 'Minimo e massimo di {mm} nel 1991-2020', diff: 'Differenza dalla media', pts: 'punti', map: 'Umidità del suolo per Land · {m} (differenza dalla media 1991-2020)', hint: 'Passa il cursore o tocca un Land.', none: 'nessun dato', chart: 'Germania: umidità del suolo mese per mese', lV: 'Quest’anno', lA: 'Media 1991-2020', lP: 'Anno precedente', unit: '% nFK',
      note: 'Umidità media mensile del suolo sotto prato in un terreno franco-sabbioso, in percentuale della capacità di campo utile (% nFK), calcolata dal servizio meteorologico tedesco (DWD) su una griglia di 1 km. Sotto il 50 % le piante iniziano a soffrire la mancanza d’acqua e sotto il 30 % lo stress idrico è forte. Medie per Land e confronto con il 1991-2020: calcolo di Dehesa Index.', src: 'Fonte:', srcN: 'Deutscher Wetterdienst (DWD), Climate Data Center' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc;
  function mon(k, lg, noY) { return new Date(k + '-15T12:00:00Z').toLocaleDateString(LOC[lg], noY ? { month: 'long', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function n1(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function sg(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + n1(Math.abs(v), lg); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function chart(D, lg, t) {
    var ms = D.months, v = D.values.DE, c = D.clim.DE, L = ms[ms.length - 1], y = parseInt(L.slice(0, 4), 10), W = 560, H = 200, Lf = 34, R = 8, Tp = 10, B = 22;
    var X = function (m) { return Lf + (m - 1) * (W - Lf - R) / 11; }, Y = function (x) { return Tp + (110 - x) / 110 * (H - Tp - B); }, g = '', xt = '';
    [0, 30, 50, 80, 110].forEach(function (x) { g += '<line class="wp-grid" x1="' + Lf + '" x2="' + (W - R) + '" y1="' + Y(x).toFixed(1) + '" y2="' + Y(x).toFixed(1) + '"/><text class="wp-tick" x="' + (Lf - 5) + '" y="' + (Y(x) + 3.5).toFixed(1) + '" text-anchor="end">' + x + '</text>'; });
    for (var m = 1; m <= 12; m++) xt += '<text class="wp-tick" x="' + X(m).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(new Date(Date.UTC(2020, m - 1, 15)).toLocaleDateString(LOC[lg], { month: 'short', timeZone: 'UTC' })) + '</text>';
    function yr(Y0) { var p = '', o = false; for (var k = 0; k < ms.length; k++) if (parseInt(ms[k].slice(0, 4), 10) === Y0 && v[k] != null) { p += (o ? 'L' : 'M') + X(parseInt(ms[k].slice(5), 10)).toFixed(1) + ' ' + Y(v[k]).toFixed(1); o = true; } return p; }
    var band = '', av = '';
    for (m = 1; m <= 12; m++) if (c[m - 1]) { av += (av ? 'L' : 'M') + X(m).toFixed(1) + ' ' + Y(c[m - 1][0]).toFixed(1); }
    var up = [], dn = []; for (m = 1; m <= 12; m++) if (c[m - 1]) { up.push(X(m).toFixed(1) + ' ' + Y(c[m - 1][2]).toFixed(1)); dn.unshift(X(m).toFixed(1) + ' ' + Y(c[m - 1][1]).toFixed(1)); }
    if (up.length) band = '<path class="ds-band" d="M' + up.join('L') + 'L' + dn.join('L') + 'Z"/>';
    return '<div class="di-info-card-title gb-sub">' + esc(t.chart) + '</div><div class="wp-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" class="wp-svg" role="img" aria-label="' + esc(t.chart) + '">' + g + xt + band +
      '<path class="wp-line wp-line-t" stroke-dasharray="4 3" d="' + av + '"/><path class="wp-line wp-line-w" d="' + yr(y - 1) + '"/><path class="wp-line wp-line-r" d="' + yr(y) + '"/></svg>' +
      '<div class="wp-legend"><span><i class="wp-sw wp-sw-r"></i>' + esc(t.lV) + ' (' + y + ')</span><span><i class="wp-sw wp-sw-w"></i>' + esc(t.lP) + ' (' + (y - 1) + ')</span><span><i class="wp-sw wp-sw-t"></i>' + esc(t.lA) + '</span><span class="wp-unit">' + esc(t.unit) + '</span></div></div>';
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/de-soil-moisture.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load('DEHESA_DE_LAENDER', 'vendor/de-laender.js')]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.months) return false;
      var t = T[lg], n = D.months.length - 1, L = D.months[n], mi = parseInt(L.slice(5), 10) - 1, v = D.values.DE[n], c = D.clim.DE[mi], vals = {};
      D.regions.forEach(function (k) { if (k !== 'DE' && D.values[k][n] != null && D.clim[k][mi]) vals[k] = D.clim[k][mi][0] - D.values[k][n]; });   // falta de agua frente a la media: mas oscuro = mas seco
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [-3, 3, 10, 20], labels: ['> +3', '+3 / −3', '−3 / −10', '−10 / −20', '< −20'], fmt: function (x, short) { x = -x; return short ? (x > 0 ? '+' : x < 0 ? '−' : '') + Math.round(Math.abs(x)) : sg(x, lg) + ' ' + t.pts; }, label: t.map.replace('{m}', mon(L, lg)), none: t.none }) : null;
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card ds-card" id="de-soil" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{m}', mon(L, lg))) + '</p>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(t.de, '<b>' + n1(v, lg) + ' % nFK</b>') + (c ? row(t.avg.replace('{mm}', mon(L, lg, true)), n1(c[0], lg) + ' % nFK') + row(t.diff, '<b>' + sg(v - c[0], lg) + '</b> ' + esc(t.pts)) + row(t.rng.replace('{mm}', mon(L, lg, true)), n1(c[1], lg) + ' – ' + n1(c[2], lg) + ' % nFK') : '') + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map.replace('{m}', mon(L, lg))) + '</div><div class="wp-readout ds-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html.replace('gb-map fr-dmap', 'gb-map fr-dmap ds-map') : '') + chart(D, lg, t) +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a> (CC BY 4.0)</p></section>';
      if (mp) M.bind(el, el.querySelector('.ds-tip'), t.hint, function (id) { var nm = mp.names[id] || id, x = D.values[id] ? D.values[id][n] : null, cc = D.clim[id] ? D.clim[id][mi] : null; return '<b>' + esc(nm) + '</b> · ' + (x == null ? esc(t.none) : '<b>' + n1(x, lg) + ' % nFK</b>' + (cc ? ' · ' + esc(t.diff) + ' ' + sg(x - cc[0], lg) + ' ' + esc(t.pts) : '')); });
      return true;
    });
  }
  global.DIDeSoil = { mount: mount };
  function auto() {
    var el = document.getElementById('desoil'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
