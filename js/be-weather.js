/* Dehesa Index — Bélgica: tiempo observado y déficit de precipitación (KMI-IRM, estaciones automáticas). data/be-weather.json (scripts/update-be-weather.py).
   Bloque de la ficha de Bélgica. ES5. window.DIBeWeather. Usa window.ESUI (js/es-ui.js) y las clases del gráfico de déficit de Países Bajos (css/style.css). */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Meteorología en Bélgica (KMI-IRM)', at: 'Estaciones automáticas del Real Instituto Meteorológico de Bélgica, al {d}', dh: 'Déficit de precipitación', dnow: 'Déficit acumulado desde el 1 de abril, al {d}', dly: 'Mismo día del año pasado', dmed: 'Mediana {s}–{y} en esa fecha', dmax: 'Máximo de esta temporada hasta hoy', dchart: 'Déficit acumulado desde el 1 de abril (mm)', lCur: 'Este año', lPrev: 'Año pasado', lMed: 'Mediana {s}–{y}', lBand: 'Rango entre el percentil 10 y el 90 de los años', mm: 'mm', hover: 'Pasa el cursor por el gráfico.',
      l30: 'Últimos 30 días', rain30: 'Lluvia (media de las estaciones)', normal: 'Normal {s}–{y} en esas fechas', pct: 'del normal', mh: 'Los últimos 12 meses', mon: 'Mes', rain: 'Lluvia (mm)', rainN: 'Normal (mm)', temp: 'Temp. media (°C)', tempN: 'Normal (°C)', part: 'mes en curso', sh: 'Por estación', st: 'Estación', prov: 'Provincia', r30: 'Lluvia 30 d (mm)', t7: 'Temp. media 7 d', tm7: 'Mínima 7 d', soil: 'Suelo a 10 cm', fr: 'Días de helada (30 d)',
      note: 'El déficit es la evaporación de referencia (Makkink) menos la lluvia, sumados día a día desde el 1 de abril y promediados entre las estaciones con dato (al menos 8 de 14), el mismo método que el «neerslagtekort» neerlandés. Lo calcula Dehesa Index con las observaciones diarias del KMI-IRM; no es una cifra publicada por el KMI. El déficit por sí solo no es sequía agrícola: depende del suelo y del riego. Las medias salen de 14 estaciones, no de toda la superficie.', src: 'Fuente:' },
    en: { h: 'Weather in Belgium (KMI-IRM)', at: 'Automatic weather stations of the Royal Meteorological Institute of Belgium, as of {d}', dh: 'Precipitation deficit', dnow: 'Cumulative deficit since 1 April, as of {d}', dly: 'Same day last year', dmed: 'Median {s}–{y} on that date', dmax: 'Highest this season so far', dchart: 'Cumulative deficit since 1 April (mm)', lCur: 'This year', lPrev: 'Last year', lMed: 'Median {s}–{y}', lBand: 'Range between the 10th and 90th percentile of years', mm: 'mm', hover: 'Hover over the chart.',
      l30: 'Last 30 days', rain30: 'Rainfall (station average)', normal: 'Normal {s}–{y} for those dates', pct: 'of normal', mh: 'The last 12 months', mon: 'Month', rain: 'Rain (mm)', rainN: 'Normal (mm)', temp: 'Mean temp. (°C)', tempN: 'Normal (°C)', part: 'month in progress', sh: 'By station', st: 'Station', prov: 'Province', r30: 'Rain 30 d (mm)', t7: 'Mean temp. 7 d', tm7: 'Lowest 7 d', soil: 'Soil at 10 cm', fr: 'Frost days (30 d)',
      note: 'The deficit is reference evapotranspiration (Makkink) minus rainfall, added up day by day from 1 April and averaged over the stations with data (at least 8 of 14), the same method as the Dutch “neerslagtekort”. Dehesa Index computes it from the KMI-IRM daily observations; it is not a figure published by the KMI. The deficit alone is not agricultural drought: it depends on soil and irrigation. Averages come from 14 stations, not from the whole territory.', src: 'Source:' },
    fr: { h: 'Météo en Belgique (KMI-IRM)', at: 'Stations automatiques de l’Institut royal météorologique de Belgique, au {d}', dh: 'Déficit de précipitations', dnow: 'Déficit cumulé depuis le 1er avril, au {d}', dly: 'Même jour l’an dernier', dmed: 'Médiane {s}–{y} à cette date', dmax: 'Maximum de cette saison jusqu’ici', dchart: 'Déficit cumulé depuis le 1er avril (mm)', lCur: 'Cette année', lPrev: 'L’an dernier', lMed: 'Médiane {s}–{y}', lBand: 'Intervalle entre le 10e et le 90e percentile des années', mm: 'mm', hover: 'Passez le curseur sur le graphique.',
      l30: '30 derniers jours', rain30: 'Pluie (moyenne des stations)', normal: 'Normale {s}–{y} à ces dates', pct: 'de la normale', mh: 'Les 12 derniers mois', mon: 'Mois', rain: 'Pluie (mm)', rainN: 'Normale (mm)', temp: 'Temp. moyenne (°C)', tempN: 'Normale (°C)', part: 'mois en cours', sh: 'Par station', st: 'Station', prov: 'Province', r30: 'Pluie 30 j (mm)', t7: 'Temp. moy. 7 j', tm7: 'Minimale 7 j', soil: 'Sol à 10 cm', fr: 'Jours de gel (30 j)',
      note: 'Le déficit est l’évapotranspiration de référence (Makkink) moins la pluie, additionnées jour par jour depuis le 1er avril et moyennées sur les stations disposant de données (au moins 8 sur 14), la même méthode que le « neerslagtekort » néerlandais. Il est calculé par Dehesa Index à partir des observations quotidiennes de l’IRM ; ce n’est pas un chiffre publié par l’IRM. Le déficit seul n’est pas la sécheresse agricole : il dépend du sol et de l’irrigation. Les moyennes viennent de 14 stations, pas de tout le territoire.', src: 'Source :' },
    it: { h: 'Meteo in Belgio (KMI-IRM)', at: 'Stazioni automatiche dell’Istituto reale meteorologico del Belgio, al {d}', dh: 'Deficit di precipitazioni', dnow: 'Deficit cumulato dal 1° aprile, al {d}', dly: 'Stesso giorno dell’anno scorso', dmed: 'Mediana {s}–{y} in quella data', dmax: 'Massimo di questa stagione finora', dchart: 'Deficit cumulato dal 1° aprile (mm)', lCur: 'Quest’anno', lPrev: 'Anno scorso', lMed: 'Mediana {s}–{y}', lBand: 'Intervallo tra il 10° e il 90° percentile degli anni', mm: 'mm', hover: 'Passa il cursore sul grafico.',
      l30: 'Ultimi 30 giorni', rain30: 'Pioggia (media delle stazioni)', normal: 'Normale {s}–{y} in quelle date', pct: 'della normale', mh: 'Gli ultimi 12 mesi', mon: 'Mese', rain: 'Pioggia (mm)', rainN: 'Normale (mm)', temp: 'Temp. media (°C)', tempN: 'Normale (°C)', part: 'mese in corso', sh: 'Per stazione', st: 'Stazione', prov: 'Provincia', r30: 'Pioggia 30 g (mm)', t7: 'Temp. media 7 g', tm7: 'Minima 7 g', soil: 'Suolo a 10 cm', fr: 'Giorni di gelo (30 g)',
      note: 'Il deficit è l’evapotraspirazione di riferimento (Makkink) meno la pioggia, sommate giorno per giorno dal 1° aprile e mediate sulle stazioni con dato (almeno 8 su 14), lo stesso metodo del «neerslagtekort» olandese. Lo calcola Dehesa Index con le osservazioni giornaliere del KMI-IRM; non è una cifra pubblicata dal KMI. Il deficit da solo non è siccità agricola: dipende dal suolo e dall’irrigazione. Le medie vengono da 14 stazioni, non da tutto il territorio.', src: 'Fonte:' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-BE', it: 'it-IT' };
  var PN = { BE10: 'Bruxelles', BE21: 'Antwerpen', BE22: 'Limburg', BE23: 'Oost-Vlaanderen', BE24: 'Vlaams-Brabant', BE25: 'West-Vlaanderen', BE31: 'Brabant wallon', BE32: 'Hainaut', BE33: 'Liège', BE34: 'Luxembourg', BE35: 'Namur' };
  var U = global.ESUI, D = null;
  function fx(s, t) { return s.replace('{s}', t.s).replace('{y}', t.y); }
  function card(n, v, note) { return '<div class="di-card cof-card"><div class="cof-lbl">' + n + '</div><div class="cof-val">' + v + '</div>' + (note ? '<div class="cof-note" style="margin:2px 0 0">' + note + '</div>' : '') + '</div>'; }
  function dlong(iso, lg) { var p = iso.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)).toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function chart(F, t, lg) {
    var n = F.days, W = 560, Hh = 230, L = 40, R = 8, Tp = 10, B = 24, hi = 0, lo = 0, k, v, g = '';
    [F.cur, F.prev, F.med, F.p90, F.p10].forEach(function (a) { a.forEach(function (x) { if (x != null) { hi = Math.max(hi, x); lo = Math.min(lo, x); } }); });
    hi = Math.ceil(hi / 50) * 50; lo = Math.floor(lo / 50) * 50;
    var X = function (i) { return L + i / (n - 1) * (W - L - R); }, Y = function (x) { return Tp + (hi - x) / (hi - lo) * (Hh - Tp - B); };
    for (v = lo; v <= hi; v += 50) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    [['04-01', 0], ['05-01', 30], ['06-01', 61], ['07-01', 91], ['08-01', 122], ['09-01', 153], ['10-01', 183]].forEach(function (m) {
      g += '<line class="wp-grid wp-grid-v" x1="' + X(m[1]).toFixed(1) + '" x2="' + X(m[1]).toFixed(1) + '" y1="' + Tp + '" y2="' + (Hh - B) + '"/><text class="wp-tick" x="' + X(m[1]).toFixed(1) + '" y="' + (Hh - 7) + '" text-anchor="middle">' + new Date('2001-' + m[0] + 'T12:00:00Z').toLocaleDateString(LOC[lg], { month: 'short', timeZone: 'UTC' }) + '</text>';
    });
    function path(a) { var p = '', open = false, i; for (i = 0; i < a.length; i++) { if (a[i] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(a[i]).toFixed(1); open = true; } return p; }
    var band = '', i; for (i = 0; i < n; i++) if (F.p90[i] != null && F.p10[i] != null) band += (band ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(F.p90[i]).toFixed(1);
    for (i = n - 1; i >= 0; i--) if (F.p90[i] != null && F.p10[i] != null) band += 'L' + X(i).toFixed(1) + ' ' + Y(F.p10[i]).toFixed(1); band += 'Z';
    var tm = { s: F.since, y: F.prevYear };
    return { X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + U.esc(t.dchart) + '</div><div class="wp-chart be-dchart"><div class="wp-readout" aria-live="polite">' + U.esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + Hh + '" class="wp-svg" role="img" aria-label="' + U.esc(t.dchart) + '">' + g +
      '<path class="nl-band" d="' + band + '"/><path class="wp-line wp-line-w nl-dash" d="' + path(F.med) + '"/><path class="wp-line wp-line-r" d="' + path(F.prev) + '"/><path class="wp-line wp-line-t" d="' + path(F.cur) + '"/>' +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (Hh - B) + '" style="display:none"/></svg><div class="wp-legend"><span><i class="wp-sw wp-sw-t"></i>' + U.esc(t.lCur) + ' (' + F.curYear + ')</span><span><i class="wp-sw wp-sw-r"></i>' + U.esc(t.lPrev) + ' (' + F.prevYear + ')</span><span><i class="wp-sw wp-sw-w"></i>' + U.esc(fx(t.lMed, tm)) + '</span><span><i class="wp-sw nl-bsw"></i>' + U.esc(t.lBand) + '</span></div></div>' };
  }
  function bind(el, c, F, t, lg) {
    var box = el.querySelector('.be-dchart'); if (!box) return; var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), tm = { s: F.since, y: F.prevYear };
    function nfm(x) { return x == null ? '—' : U.nf(x, 0); }
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, k = Math.round((vx - 40) / (c.W - 48) * (F.days - 1)); k = Math.max(0, Math.min(F.days - 1, k));
      var dt = new Date(Date.UTC(2001, 3, 1 + k, 12)); cr.setAttribute('x1', c.X(k)); cr.setAttribute('x2', c.X(k)); cr.style.display = '';
      ro.innerHTML = '<b>' + U.esc(dt.toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', timeZone: 'UTC' })) + '</b> · ' + U.esc(t.lCur) + ' <b>' + (F.cur[k] == null ? '—' : nfm(F.cur[k]) + ' ' + t.mm) + '</b> · ' + U.esc(t.lPrev) + ' ' + nfm(F.prev[k]) + ' · ' + U.esc(fx(t.lMed, tm)) + ' ' + nfm(F.med[k]);
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  function html(d, lg, t) {
    var F = d.deficit, k = F.cur.length - 1, now = F.cur[k], tm = { s: F.since, y: F.prevYear }, mx = 0, i, c = chart(F, t, lg);
    for (i = 0; i <= k; i++) if (F.cur[i] != null) mx = Math.max(mx, F.cur[i]);
    function df(a, b) { return a == null || b == null ? '' : ' (' + (a - b > 0 ? '+' : a - b < 0 ? '−' : '') + U.nf(Math.abs(a - b), 0) + ' ' + t.mm + ')'; }
    function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + l + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
    var out = '<p class="di-movers-hint" style="margin:0 0 10px">' + U.esc(t.at.replace('{d}', dlong(d.asOf, lg))) + '</p>';
    out += '<h3 class="cof-h3">' + U.esc(t.dh) + '</h3><div class="di-info-stat-list" style="max-width:640px">' + row(U.esc(t.dnow.replace('{d}', dlong(F.asOf, lg))), '<b>' + U.nf(now, 0) + ' ' + U.esc(t.mm) + '</b>') +
      (F.prev[k] != null ? row(U.esc(t.dly), U.nf(F.prev[k], 0) + ' ' + U.esc(t.mm) + U.esc(df(now, F.prev[k]))) : '') + (F.med[k] != null ? row(U.esc(fx(t.dmed, tm)), U.nf(F.med[k], 0) + ' ' + U.esc(t.mm) + U.esc(df(now, F.med[k]))) : '') +
      row(U.esc(t.dmax), U.nf(mx, 0) + ' ' + U.esc(t.mm)) + '</div>' + c.html;
    var L = d.last30; if (L && L.rain != null) {
      out += '<h3 class="cof-h3">' + U.esc(t.l30) + '</h3><div class="cof-cards">' + card(U.esc(t.rain30), U.nf(L.rain, 0) + ' ' + U.esc(t.mm), U.esc(dlong(L.from, lg) + ' – ' + dlong(L.to, lg)));
      if (L.rainNormal != null) out += card(U.esc(fx(t.normal, tm)), U.nf(L.rainNormal, 0) + ' ' + U.esc(t.mm), U.nf(L.rain / L.rainNormal * 100, 0) + ' % ' + U.esc(t.pct));
      out += '</div>';
    }
    var head = '<thead><tr><th scope="col">' + U.esc(t.mon) + '</th><th scope="col" class="cof-n">' + U.esc(t.rain) + '</th><th scope="col" class="cof-n">' + U.esc(t.rainN) + '</th><th scope="col" class="cof-n">' + U.esc(t.temp) + '</th><th scope="col" class="cof-n">' + U.esc(t.tempN) + '</th></tr></thead>';
    var rows = d.monthly.map(function (m) {
      var lab = new Date(Date.UTC(m.y, m.m - 1, 1, 12)).toLocaleDateString(LOC[lg], { month: 'short', year: 'numeric', timeZone: 'UTC' });
      return '<tr><th scope="row">' + U.esc(lab) + (m.rain == null ? ' <span class="cof-note">(' + U.esc(t.part) + ')</span>' : '') + '</th><td class="cof-n">' + (m.rain == null ? '—' : '<b>' + U.nf(m.rain, 0) + '</b>') + '</td><td class="cof-n">' + U.nf(m.rainNormal, 0) + '</td><td class="cof-n">' + U.nf(m.temp, 1) + '</td><td class="cof-n">' + U.nf(m.tempNormal, 1) + '</td></tr>';
    }).join('');
    out += '<h3 class="cof-h3">' + U.esc(t.mh) + '</h3><div style="overflow-x:auto"><table class="cof-tbl" style="max-width:640px">' + head + '<tbody>' + rows + '</tbody></table></div>';
    var sh = '<thead><tr><th scope="col">' + U.esc(t.st) + '</th><th scope="col">' + U.esc(t.prov) + '</th><th scope="col" class="cof-n">' + U.esc(t.r30) + '</th><th scope="col" class="cof-n">' + U.esc(t.t7) + '</th><th scope="col" class="cof-n">' + U.esc(t.tm7) + '</th><th scope="col" class="cof-n">' + U.esc(t.soil) + '</th><th scope="col" class="cof-n">' + U.esc(t.fr) + '</th></tr></thead>';
    var sr = d.stations.slice().sort(function (a, b) { return (b.rain30 == null ? -1 : b.rain30) - (a.rain30 == null ? -1 : a.rain30); }).map(function (s) {
      return '<tr><th scope="row">' + U.esc(s.name) + '</th><td>' + U.esc(PN[s.province] || s.province) + '</td><td class="cof-n">' + U.nf(s.rain30, 0) + '</td><td class="cof-n">' + U.nf(s.temp7, 1) + '</td><td class="cof-n">' + U.nf(s.tmin7, 1) + '</td><td class="cof-n">' + U.nf(s.soil10, 1) + '</td><td class="cof-n">' + s.frost30 + '</td></tr>';
    }).join('');
    out += '<h3 class="cof-h3">' + U.esc(t.sh) + '</h3><div style="overflow-x:auto"><table class="cof-tbl" style="min-width:560px">' + sh + '<tbody>' + sr + '</tbody></table></div>';
    out += '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t.note) + '</p>';
    return { html: out, chart: c, F: F };
  }
  function load() { if (D) return Promise.resolve(D); return U.json('data/be-weather.json').then(function (r) { D = r || false; return D; }); }
  function mount(el, lg) {
    if (!el || !U) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    return Promise.all([load(), global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function (a) {
      var d = a[0]; if (!d || !d.deficit || !d.stations) { el.hidden = true; return false; }
      el.hidden = false; var t = T[lg], h = html(d, lg, t);
      el.innerHTML = '<section class="di-card cof wp-card" id="ps-be-weather" style="max-width:none"><h2 class="cof-h2">' + U.esc(t.h) + '</h2>' + h.html + U.cite('kmi_be') + '</section>';
      bind(el, h.chart, h.F, t, lg); return true;
    });
  }
  global.DIBeWeather = { mount: mount };
})(window);
