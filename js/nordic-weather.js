/* Dehesa Index — Suecia y Dinamarca: lluvia y temperatura observadas frente a lo normal (SMHI y DMI, datos abiertos CC BY 4.0). data/{se,dk}-weather.json (scripts/update-nordic-weather.py).
   Bloque de la ficha de cada país. ES5. window.DINordicWeather. Usa window.ESUI (js/es-ui.js). */
(function (global) {
  'use strict';
  var U = global.ESUI, D = {};
  var CC = { se: { id: 'smhi', n: { es: 'Suecia', en: 'Sweden', fr: 'Suède', it: 'Svezia' }, inst: { es: 'SMHI', en: 'SMHI', fr: 'SMHI', it: 'SMHI' } }, dk: { id: 'dmi', n: { es: 'Dinamarca', en: 'Denmark', fr: 'Danemark', it: 'Danimarca' }, inst: { es: 'DMI', en: 'DMI', fr: 'DMI', it: 'DMI' } } };
  var T = {
    es: { h: 'Tiempo observado en {n} ({i})', at: 'Estaciones de {i} con datos abiertos, hasta el {d}', l30: 'Últimos 30 días', rain30: 'Lluvia (media de las estaciones)', normal: 'Normal {s}–{y} en esas fechas', pct: 'del normal', t30: 'Temperatura media', tN: 'Normal en esas fechas', apr: 'Lluvia desde el 1 de abril', aprN: 'Normal desde el 1 de abril',
      mh: 'Los últimos 12 meses', mon: 'Mes', rain: 'Lluvia (mm)', rainN: 'Normal (mm)', temp: 'Temp. media (°C)', tempN: 'Normal (°C)', sh: 'Estaciones', st: 'Estación', r30: 'Lluvia 30 días (mm)', t7: 'Temp. 7 días (°C)', mm: 'mm', ud: 'estaciones',
      note: 'Cálculo de Dehesa Index con las observaciones diarias de {i} (no son cifras publicadas por el instituto): promedio de las estaciones con dato cada día; mes = suma de lluvia y media de temperatura (meses con al menos el 90 % de los días); el normal es la media de esos mismos meses o fechas desde {s} hasta el año anterior (al menos {m} años). Son pocas estaciones repartidas por el país: sirven para ver la tendencia nacional, no el tiempo de una finca.' },
    en: { h: 'Observed weather in {n} ({i})', at: '{i} open-data stations, up to {d}', l30: 'Last 30 days', rain30: 'Rainfall (station average)', normal: 'Normal {s}–{y} for those dates', pct: 'of normal', t30: 'Mean temperature', tN: 'Normal for those dates', apr: 'Rainfall since 1 April', aprN: 'Normal since 1 April',
      mh: 'The last 12 months', mon: 'Month', rain: 'Rain (mm)', rainN: 'Normal (mm)', temp: 'Mean temp. (°C)', tempN: 'Normal (°C)', sh: 'Stations', st: 'Station', r30: 'Rain 30 days (mm)', t7: 'Temp. 7 days (°C)', mm: 'mm', ud: 'stations',
      note: 'Calculated by Dehesa Index from {i}’s daily observations (not figures published by the institute): average of the stations with data each day; month = rainfall sum and mean temperature (months with at least 90 % of the days); the normal is the average of those same months or dates from {s} to the previous year (at least {m} years). There are few stations spread over the country: they show the national trend, not the weather on a farm.' },
    fr: { h: 'Météo observée en {n} ({i})', at: 'Stations en données ouvertes de {i}, jusqu’au {d}', l30: '30 derniers jours', rain30: 'Pluie (moyenne des stations)', normal: 'Normale {s}–{y} à ces dates', pct: 'de la normale', t30: 'Température moyenne', tN: 'Normale à ces dates', apr: 'Pluie depuis le 1er avril', aprN: 'Normale depuis le 1er avril',
      mh: 'Les 12 derniers mois', mon: 'Mois', rain: 'Pluie (mm)', rainN: 'Normale (mm)', temp: 'Temp. moy. (°C)', tempN: 'Normale (°C)', sh: 'Stations', st: 'Station', r30: 'Pluie 30 jours (mm)', t7: 'Temp. 7 jours (°C)', mm: 'mm', ud: 'stations',
      note: 'Calcul de Dehesa Index à partir des observations journalières de {i} (ce ne sont pas des chiffres publiés par l’institut) : moyenne des stations avec donnée chaque jour ; mois = somme de la pluie et moyenne de la température (mois avec au moins 90 % des jours) ; la normale est la moyenne de ces mêmes mois ou dates de {s} à l’année précédente (au moins {m} ans). Il y a peu de stations réparties sur le pays : elles montrent la tendance nationale, pas la météo d’une exploitation.' },
    it: { h: 'Tempo osservato in {n} ({i})', at: 'Stazioni in dati aperti di {i}, fino al {d}', l30: 'Ultimi 30 giorni', rain30: 'Pioggia (media delle stazioni)', normal: 'Normale {s}–{y} in quelle date', pct: 'del normale', t30: 'Temperatura media', tN: 'Normale in quelle date', apr: 'Pioggia dal 1° aprile', aprN: 'Normale dal 1° aprile',
      mh: 'Gli ultimi 12 mesi', mon: 'Mese', rain: 'Pioggia (mm)', rainN: 'Normale (mm)', temp: 'Temp. media (°C)', tempN: 'Normale (°C)', sh: 'Stazioni', st: 'Stazione', r30: 'Pioggia 30 giorni (mm)', t7: 'Temp. 7 giorni (°C)', mm: 'mm', ud: 'stazioni',
      note: 'Calcolo di Dehesa Index sulle osservazioni giornaliere di {i} (non sono cifre pubblicate dall’istituto): media delle stazioni con dato ogni giorno; mese = somma della pioggia e media della temperatura (mesi con almeno il 90 % dei giorni); il normale è la media degli stessi mesi o date dal {s} all’anno precedente (almeno {m} anni). Le stazioni sono poche e sparse sul paese: mostrano la tendenza nazionale, non il tempo di un’azienda.' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  function dlong(iso, lg) { var p = iso.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)).toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function card(n, v, note) { return '<div class="di-card cof-card"><div class="cof-lbl">' + n + '</div><div class="cof-val">' + v + '</div>' + (note ? '<div class="cof-note" style="margin:2px 0 0">' + note + '</div>' : '') + '</div>'; }
  function sg(a, b, d) { var x = a - b; return (x > 0 ? '+' : x < 0 ? '−' : '') + U.nf(Math.abs(x), d); }
  function vw(tbl, mo, t, lg) { return global.DIWeatherView ? global.DIWeatherView.wrap(tbl, mo, t, lg, U.nf) : tbl; }
  function needView() { return global.DIWeatherView ? Promise.resolve() : new Promise(function (res) { var sc = document.createElement('script'); sc.src = 'js/weather-view.js?v=20261028'; sc.onload = res; sc.onerror = res; document.head.appendChild(sc); }); }
  function html(d, cc, lg) {
    var t = T[lg], c = CC[cc], o = function (s) { return s.replace(/\{n\}/g, c.n[lg]).replace(/\{i\}/g, c.inst[lg]).replace('{s}', d.since).replace('{m}', 12).replace('{y}', d.asOf.slice(0, 4) - 1).replace('{d}', dlong(d.asOf, lg)); };
    var L = d.l30 || {}, A = d.sinceApr, cards = '';
    if (L.rain != null) cards += card(U.esc(t.rain30), U.nf(L.rain, 0) + ' ' + t.mm, U.esc(dlong(L.from, lg) + ' – ' + dlong(d.asOf, lg)));
    if (L.rain != null && L.rainN != null) cards += card(U.esc(o(t.normal)), U.nf(L.rainN, 0) + ' ' + t.mm, U.nf(L.rain / L.rainN * 100, 0) + ' % ' + U.esc(t.pct));
    if (L.temp != null && L.tempN != null) cards += card(U.esc(t.t30), U.nf(L.temp, 1) + ' °C', U.esc(sg(L.temp, L.tempN, 1) + ' °C · ' + t.tN));
    if (A && A.rain != null && A.rainN != null) cards += card(U.esc(t.apr), U.nf(A.rain, 0) + ' ' + t.mm, U.nf(A.rain / A.rainN * 100, 0) + ' % ' + U.esc(t.pct + ' (' + U.nf(A.rainN, 0) + ' ' + t.mm + ')'));
    var mo = [];
    var rows = d.monthly.map(function (m) {
      var lab = new Date(Date.UTC(+m.m.slice(0, 4), +m.m.slice(5, 7) - 1, 1, 12)).toLocaleDateString(LOC[lg], { month: 'short', year: 'numeric', timeZone: 'UTC' });
      mo.push({ label: lab, rain: m.rain, rainN: m.rainN, temp: m.temp, tempN: m.tempN });
      return '<tr><th scope="row">' + U.esc(lab) + '</th><td class="cof-n">' + (m.rain == null ? '—' : '<b>' + U.nf(m.rain, 0) + '</b>') + '</td><td class="cof-n">' + (m.rainN == null ? '—' : U.nf(m.rainN, 0)) + '</td><td class="cof-n">' + (m.temp == null ? '—' : U.nf(m.temp, 1)) + '</td><td class="cof-n">' + (m.tempN == null ? '—' : U.nf(m.tempN, 1)) + '</td></tr>';
    }).join('');
    var sr = d.stations.slice().sort(function (a, b) { return (b.rain30 == null ? -1 : b.rain30) - (a.rain30 == null ? -1 : a.rain30); }).map(function (s) {
      return '<tr><th scope="row">' + U.esc(s.name) + '</th><td class="cof-n">' + (s.rain30 == null ? '—' : U.nf(s.rain30, 0)) + '</td><td class="cof-n">' + (s.temp7 == null ? '—' : U.nf(s.temp7, 1)) + '</td></tr>';
    }).join('');
    return '<h2 class="cof-h2">' + U.esc(o(t.h)) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + U.esc(o(t.at)) + '</p>' + (cards ? '<h3 class="cof-h3">' + U.esc(t.l30) + '</h3><div class="cof-cards">' + cards + '</div>' : '') +
      '<h3 class="cof-h3">' + U.esc(t.mh) + '</h3>' + vw('<div style="overflow-x:auto"><table class="cof-tbl" style="max-width:640px"><thead><tr><th scope="col">' + U.esc(t.mon) + '</th><th scope="col" class="cof-n">' + U.esc(t.rain) + '</th><th scope="col" class="cof-n">' + U.esc(t.rainN) + '</th><th scope="col" class="cof-n">' + U.esc(t.temp) + '</th><th scope="col" class="cof-n">' + U.esc(t.tempN) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>', mo, t, lg) +
      '<h3 class="cof-h3">' + U.esc(t.sh) + ' (' + d.stations.length + ')</h3><div style="overflow-x:auto"><table class="cof-tbl" style="max-width:520px"><thead><tr><th scope="col">' + U.esc(t.st) + '</th><th scope="col" class="cof-n">' + U.esc(t.r30) + '</th><th scope="col" class="cof-n">' + U.esc(t.t7) + '</th></tr></thead><tbody>' + sr + '</tbody></table></div>' +
      '<p class="cof-note" style="margin:10px 0 0">' + U.esc(o(t.note)) + '</p>';
  }
  function load(cc) { if (D[cc] !== undefined) return Promise.resolve(D[cc]); return U.json('data/' + cc + '-weather.json').then(function (r) { D[cc] = r || false; return D[cc]; }); }
  function mount(el, lg, cc) {
    U = U || global.ESUI; cc = String(cc || '').toLowerCase();
    if (!el || !U || !CC[cc]) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    return Promise.all([load(cc).then(function (r) { return needView().then(function () { return r; }); }), global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function (a) {
      var d = a[0]; if (!d || !d.monthly || !d.stations) { el.hidden = true; return false; }
      el.hidden = false; el.innerHTML = '<section class="di-card cof wp-card" id="ps-' + cc + '-weather" style="max-width:none">' + html(d, cc, lg) + U.cite(CC[cc].id) + '</section>'; return true;
    });
  }
  global.DINordicWeather = { mount: mount };
})(window);
