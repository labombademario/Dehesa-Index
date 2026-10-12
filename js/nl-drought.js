/* Dehesa Index — Países Bajos: sequía por región COROP (40 NUTS 3) y déficit de precipitación del KNMI; indicador europeo a partir del Indicador Combinado de Sequía del Observatorio Europeo de la Sequía (EDO).
   data/nl-drought.json (scripts/update-nl-drought.py). En sequia.html (#nlsq) y en la pestaña «Sequía» de la ficha de los Países Bajos. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { hh: 'Indicador europeo para todo el país', all40: 'Ver las 40 regiones', h: 'Sequía en Países Bajos', at: 'Última década del indicador europeo: {d}', wa: 'Superficie con aviso o alerta de sequía', all: 'Superficie en sequía agrícola (vigilancia, aviso o alerta)', ly: 'Misma década del año pasado', map: 'Superficie con aviso o alerta por región COROP', hint: 'Pasa el cursor o toca una región.', none: 'sin dato',
      cls: ['Sin sequía o en recuperación', 'Vigilancia', 'Aviso', 'Alerta'], idx: 'Reparto de la superficie de Países Bajos', hist: 'Superficie de Países Bajos con aviso o alerta, últimos 3 años', hover: 'Pasa el cursor por la gráfica.', tbl: 'Las 10 regiones más afectadas', all40: 'Ver las 40 regiones', prov: 'Región', hy: 'Hace un año', unit: '% de la superficie',
      dh: 'Déficit de precipitación (neerslagtekort)', dnow: 'Déficit acumulado desde el 1 de abril, a {d}', dly: 'Mismo día del año pasado', dmed: 'Mediana de 2001 a {y} en esa fecha', dmax: 'Máximo de esta temporada hasta ahora', dmaxs: 'Máximo de {y}', dchart: 'Déficit acumulado desde el 1 de abril (mm)', lCur: 'Este año', lPrev: 'Año pasado', lMed: 'Mediana 2001–{y}', lBand: 'Rango entre el 10 % y el 90 % de los años', mm: 'mm', dhover: 'Pasa el cursor por la gráfica.',
      dnote: 'Es la evaporación de referencia (Makkink) menos la lluvia, sumadas día a día desde el 1 de abril y promediadas en 13 estaciones del KNMI, igual que define el KNMI su «neerslagtekort». Lo calcula Dehesa Index con los datos diarios del KNMI, así que puede diferir unos milímetros de la cifra que publica el propio KNMI (en 2018 sale 314 mm, y el KNMI da una cifra algo menor). El déficit no es la sequía agrícola por sí solo: depende del suelo y del riego.',
      note: 'El indicador europeo combina tres señales cada 10 días: déficit de lluvia (vigilancia), déficit de humedad del suelo (aviso) y estrés de la vegetación visto desde satélite (alerta). Dehesa Index lo calcula para cada una de las 40 regiones COROP (la ficha del país solo lo da por 4 regiones). La superficie es toda la región, no solo la agrícola, y el reparto nacional pondera cada región por sus celdas de 4 km.', src: 'Fuentes:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'regiones: Eurostat/GISCO (© EuroGeographics)', srcC: 'KNMI, datos diarios' },
    en: { hh: 'European indicator for the whole country', all40: 'Show all 40 regions', h: 'Drought in the Netherlands', at: 'Latest dekad of the European indicator: {d}', wa: 'Area under drought warning or alert', all: 'Area in agricultural drought (watch, warning or alert)', ly: 'Same dekad last year', map: 'Area under warning or alert by COROP region', hint: 'Hover or tap a region.', none: 'no data',
      cls: ['No drought or recovering', 'Watch', 'Warning', 'Alert'], idx: 'Breakdown of the Netherlands’ area', hist: 'Dutch area under warning or alert, last 3 years', hover: 'Hover over the chart.', tbl: 'The 10 most affected regions', all40: 'See all 40 regions', prov: 'Region', hy: 'A year ago', unit: '% of the area',
      dh: 'Precipitation deficit (neerslagtekort)', dnow: 'Cumulative deficit since 1 April, as of {d}', dly: 'Same day last year', dmed: 'Median 2001–{y} on that date', dmax: 'Highest this season so far', dmaxs: 'Highest in {y}', dchart: 'Cumulative deficit since 1 April (mm)', lCur: 'This year', lPrev: 'Last year', lMed: 'Median 2001–{y}', lBand: 'Range between the 10th and 90th percentile of years', mm: 'mm', dhover: 'Hover over the chart.',
      dnote: 'It is reference evapotranspiration (Makkink) minus rainfall, added up day by day from 1 April and averaged over 13 KNMI stations, the way the KNMI defines its “neerslagtekort”. Dehesa Index computes it from the KNMI’s daily data, so it can differ by a few millimetres from the figure the KNMI itself publishes (for 2018 it gives 314 mm, and the KNMI’s figure is slightly lower). The deficit alone is not agricultural drought: it depends on soil and irrigation.',
      note: 'The European indicator combines three signals every 10 days: rainfall deficit (watch), soil-moisture deficit (warning) and vegetation stress seen from satellite (alert). Dehesa Index computes it for each of the 40 COROP regions (the country page only gives it for 4 regions). The area is the whole region, not just farmland, and the national breakdown weights each region by its 4 km cells.', src: 'Sources:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'regions: Eurostat/GISCO (© EuroGeographics)', srcC: 'KNMI, daily data' },
    fr: { hh: 'Indicateur européen pour tout le pays', all40: 'Voir les 40 régions', h: 'Sécheresse aux Pays-Bas', at: 'Dernière décade de l’indicateur européen : {d}', wa: 'Surface en avertissement ou alerte de sécheresse', all: 'Surface en sécheresse agricole (vigilance, avertissement ou alerte)', ly: 'Même décade l’an dernier', map: 'Surface en avertissement ou alerte par région COROP', hint: 'Survolez ou touchez une région.', none: 'pas de donnée',
      cls: ['Pas de sécheresse ou en rétablissement', 'Vigilance', 'Avertissement', 'Alerte'], idx: 'Répartition de la superficie des Pays-Bas', hist: 'Surface des Pays-Bas en avertissement ou alerte, 3 dernières années', hover: 'Survolez le graphique.', tbl: 'Les 10 régions les plus touchées', all40: 'Voir les 40 régions', prov: 'Région', hy: 'Il y a un an', unit: '% de la surface',
      dh: 'Déficit de précipitations (neerslagtekort)', dnow: 'Déficit cumulé depuis le 1er avril, au {d}', dly: 'Même jour l’an dernier', dmed: 'Médiane 2001–{y} à cette date', dmax: 'Maximum de cette saison jusqu’ici', dmaxs: 'Maximum de {y}', dchart: 'Déficit cumulé depuis le 1er avril (mm)', lCur: 'Cette année', lPrev: 'L’an dernier', lMed: 'Médiane 2001–{y}', lBand: 'Intervalle entre le 10e et le 90e centile des années', mm: 'mm', dhover: 'Survolez le graphique.',
      dnote: 'C’est l’évapotranspiration de référence (Makkink) moins la pluie, cumulées jour après jour depuis le 1er avril et moyennées sur 13 stations du KNMI, comme le KNMI définit son « neerslagtekort ». Dehesa Index le calcule à partir des données quotidiennes du KNMI ; il peut donc différer de quelques millimètres du chiffre publié par le KNMI (pour 2018 il donne 314 mm, et celui du KNMI est un peu plus bas). Le déficit seul n’est pas la sécheresse agricole : il dépend du sol et de l’irrigation.',
      note: 'L’indicateur européen combine trois signaux tous les 10 jours : déficit de pluie (vigilance), déficit d’humidité du sol (avertissement) et stress de la végétation vu par satellite (alerte). Dehesa Index le calcule pour chacune des 40 régions COROP (la fiche du pays ne le donne que pour 4 régions). La surface est celle de la région entière, pas seulement agricole, et la répartition nationale pondère chaque région par ses mailles de 4 km.', src: 'Sources :', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'régions : Eurostat/GISCO (© EuroGeographics)', srcC: 'KNMI, données quotidiennes' },
    it: { hh: 'Indicatore europeo per tutto il paese', all40: 'Mostra tutte le 40 regioni', h: 'Siccità nei Paesi Bassi', at: 'Ultima decade dell’indicatore europeo: {d}', wa: 'Superficie in allerta o allarme siccità', all: 'Superficie in siccità agricola (attenzione, allerta o allarme)', ly: 'Stessa decade dell’anno scorso', map: 'Superficie in allerta o allarme per regione COROP', hint: 'Passa il cursore o tocca una regione.', none: 'nessun dato',
      cls: ['Nessuna siccità o in recupero', 'Attenzione', 'Allerta', 'Allarme'], idx: 'Ripartizione della superficie dei Paesi Bassi', hist: 'Superficie olandese in allerta o allarme, ultimi 3 anni', hover: 'Passa il cursore sul grafico.', tbl: 'Le 10 regioni più colpite', all40: 'Vedi tutte le 40 regioni', prov: 'Regione', hy: 'Un anno fa', unit: '% della superficie',
      dh: 'Deficit di precipitazioni (neerslagtekort)', dnow: 'Deficit cumulato dal 1° aprile, al {d}', dly: 'Stesso giorno dell’anno scorso', dmed: 'Mediana 2001–{y} in quella data', dmax: 'Massimo di questa stagione finora', dmaxs: 'Massimo del {y}', dchart: 'Deficit cumulato dal 1° aprile (mm)', lCur: 'Quest’anno', lPrev: 'Anno scorso', lMed: 'Mediana 2001–{y}', lBand: 'Intervallo tra il 10° e il 90° percentile degli anni', mm: 'mm', dhover: 'Passa il cursore sul grafico.',
      dnote: 'È l’evapotraspirazione di riferimento (Makkink) meno la pioggia, sommate giorno per giorno dal 1° aprile e mediate su 13 stazioni del KNMI, come il KNMI definisce il suo «neerslagtekort». Lo calcola Dehesa Index con i dati giornalieri del KNMI, quindi può differire di qualche millimetro dalla cifra pubblicata dal KNMI (per il 2018 dà 314 mm, e quella del KNMI è un po’ più bassa). Il deficit da solo non è siccità agricola: dipende dal suolo e dall’irrigazione.',
      note: 'L’indicatore europeo combina tre segnali ogni 10 giorni: deficit di pioggia (attenzione), deficit di umidità del suolo (allerta) e stress della vegetazione visto da satellite (allarme). Dehesa Index lo calcola per ciascuna delle 40 regioni COROP (la scheda del paese lo dà solo per 4 regioni). La superficie è quella dell’intera regione, non solo agricola, e la ripartizione nazionale pesa ogni regione in base alle sue celle da 4 km.', src: 'Fonti:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'regioni: Eurostat/GISCO (© EuroGeographics)', srcC: 'KNMI, dati giornalieri' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc;
  function day(iso, lg) { return iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—'; }
  function dshort(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function nf(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function nm(n) { return String(n); }
  function cl(x) { return Math.max(0, Math.min(100, x)); }
  function wa(v) { return cl(v[1] + v[2]); }
  function all3(v) { return cl(v[0] + v[1] + v[2]); }
  function national(D, i) {
    var s = [0, 0, 0, 0, 0, 0], n = 0, k, j;
    for (k in D.counties) if (D.counties.hasOwnProperty(k)) { var c = D.counties[k]; n += c.cells; for (j = 0; j < 6; j++) s[j] += c.cells * c.v[i][j]; }
    return s.map(function (x) { return x / n; });
  }
  function stack(S, t, lg) {
    var q = [Math.max(0, 100 - all3(S)), cl(S[0]), cl(S[1]), cl(S[2])];
    return '<div class="be-stk"><div class="be-stk-l">' + esc(t.idx) + '</div><div class="be-stk-b" role="img" aria-label="' + esc(t.cls.map(function (c, i) { return c + ' ' + nf(q[i], lg, 1) + ' %'; }).join(', ')) + '">' +
      q.map(function (v, i) { return v > 0.05 ? '<span class="be-s' + i + '" style="width:' + v.toFixed(2) + '%" title="' + esc(t.cls[i] + ': ' + nf(v, lg, 1) + ' %') + '">' + (v >= 9 ? nf(v, lg) + ' %' : '') + '</span>' : ''; }).join('') + '</div></div>' +
      '<div class="wp-legend">' + t.cls.map(function (c, i) { return '<span><i class="wp-sw be-s' + i + '"></i>' + esc(c) + '</span>'; }).join('') + '</div>';
  }
  function hchart(P, V, t, lg) {
    var n = P.length; if (n < 4) return { html: '' };
    var W = 560, Hh = 190, L = 34, R = 8, Tp = 10, B = 24, t0 = Date.parse(P[0]), t1 = Date.parse(P[n - 1]);
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - R); }, Y = function (v) { return Tp + (100 - v) / 100 * (Hh - Tp - B); }, g = '', p = '', v, k;
    for (v = 0; v <= 100; v += 25) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    var y0 = parseInt(P[0].slice(0, 4), 10), y1 = parseInt(P[n - 1].slice(0, 4), 10);
    for (var yy = y0 + 1; yy <= y1; yy++) { var iso = yy + '-01-01'; g += '<line class="wp-grid wp-grid-v" x1="' + X(iso).toFixed(1) + '" x2="' + X(iso).toFixed(1) + '" y1="' + Tp + '" y2="' + (Hh - B) + '"/><text class="wp-tick" x="' + X(iso).toFixed(1) + '" y="' + (Hh - 7) + '" text-anchor="middle">' + yy + '</text>'; }
    for (k = 0; k < n; k++) p += (k ? 'L' : 'M') + X(P[k]).toFixed(1) + ' ' + Y(V[k]).toFixed(1);
    return { P: P, V: V, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.hist) + '</div><div class="wp-chart nl-hchart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + Hh + '" class="wp-svg" role="img" aria-label="' + esc(t.hist) + '">' + g +
      '<path class="wp-line wp-line-t" d="' + p + '"/><line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (Hh - B) + '" style="display:none"/></svg><div class="wp-legend"><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' };
  }
  function bindH(el, c, t, lg) {
    var box = el.querySelector('.nl-hchart'); if (!box || !c.P) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.P.length; k++) { var dd = Math.abs(c.X(c.P[k]) - vx); if (dd < bd) { bd = dd; b = k; } }
      var px = c.X(c.P[b]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(dshort(c.P[b], lg)) + '</b> · ' + esc(t.wa) + ' <b>' + nf(c.V[b], lg, 1) + ' %</b>';
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  function dfx(t, k, v) { return t[k].replace('{y}', v); }
  function dchart(D, t, lg) {
    var n = D.days, W = 560, Hh = 230, L = 40, R = 8, Tp = 10, B = 24, hi = 0, lo = 0, i, S = [D.cur, D.prev, D.med, D.p90, D.p10];
    S.forEach(function (a) { a.forEach(function (v) { if (v != null) { hi = Math.max(hi, v); lo = Math.min(lo, v); } }); });
    hi = Math.ceil(hi / 50) * 50; lo = Math.floor(lo / 50) * 50;
    var X = function (k) { return L + k / (n - 1) * (W - L - R); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (Hh - Tp - B); }, g = '', v, k;
    for (v = lo; v <= hi; v += 50) g += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    var y0 = D.curYear, M = [['04-01', 0], ['05-01', 30], ['06-01', 61], ['07-01', 91], ['08-01', 122], ['09-01', 153], ['10-01', 183]];
    M.forEach(function (m) { g += '<line class="wp-grid wp-grid-v" x1="' + X(m[1]).toFixed(1) + '" x2="' + X(m[1]).toFixed(1) + '" y1="' + Tp + '" y2="' + (Hh - B) + '"/><text class="wp-tick" x="' + X(m[1]).toFixed(1) + '" y="' + (Hh - 7) + '" text-anchor="middle">' + new Date('2001-' + m[0] + 'T12:00:00Z').toLocaleDateString(LOC[lg], { month: 'short', timeZone: 'UTC' }) + '</text>'; });
    function path(a) { var p = '', open = false; for (k = 0; k < a.length; k++) { if (a[k] == null) { open = false; continue; } p += (open ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(a[k]).toFixed(1); open = true; } return p; }
    var band = ''; for (k = 0; k < n; k++) if (D.p90[k] != null && D.p10[k] != null) band += (band ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(D.p90[k]).toFixed(1); for (k = n - 1; k >= 0; k--) if (D.p90[k] != null && D.p10[k] != null) band += 'L' + X(k).toFixed(1) + ' ' + Y(D.p10[k]).toFixed(1); band += 'Z';
    var py = D.prevYear, ry = String(py);
    return { D: D, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.dchart) + '</div><div class="wp-chart nl-dchart"><div class="wp-readout" aria-live="polite">' + esc(t.dhover) + '</div><svg viewBox="0 0 ' + W + ' ' + Hh + '" class="wp-svg" role="img" aria-label="' + esc(t.dchart) + '">' + g +
      '<path class="nl-band" d="' + band + '"/><path class="wp-line wp-line-w nl-dash" d="' + path(D.med) + '"/><path class="wp-line wp-line-r" d="' + path(D.prev) + '"/><path class="wp-line wp-line-t" d="' + path(D.cur) + '"/>' +
      '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (Hh - B) + '" style="display:none"/></svg><div class="wp-legend"><span><i class="wp-sw wp-sw-t"></i>' + esc(t.lCur) + ' (' + D.curYear + ')</span><span><i class="wp-sw wp-sw-r"></i>' + esc(t.lPrev) + ' (' + py + ')</span><span><i class="wp-sw wp-sw-w"></i>' + esc(dfx(t, 'lMed', ry)) + '</span><span><i class="wp-sw nl-bsw"></i>' + esc(t.lBand) + '</span><span class="wp-unit">' + esc(t.mm) + '</span></div></div>' };
  }
  function dbind(el, c, t, lg) {
    var box = el.querySelector('.nl-dchart'); if (!box || !c.D) return; var D = c.D, svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, k = Math.round((vx - 40) / (c.W - 48) * (D.days - 1)); k = Math.max(0, Math.min(D.days - 1, k));
      var px = c.X(k), dt = new Date(Date.UTC(2001, 3, 1 + k, 12)); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(dt.toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', timeZone: 'UTC' })) + '</b> · ' + esc(t.lCur) + ' <b>' + (D.cur[k] == null ? '—' : nf(D.cur[k], lg) + ' ' + t.mm) + '</b> · ' + esc(t.lPrev) + ' ' + (D.prev[k] == null ? '—' : nf(D.prev[k], lg)) + ' · ' + esc(dfx(t, 'lMed', String(D.prevYear))) + ' ' + (D.med[k] == null ? '—' : nf(D.med[k], lg));
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.dhover; });
  }
  function defHtml(D, t, lg) {
    if (!D || !D.cur || !D.cur.length) return { html: '' };
    var k = D.cur.length - 1, now = D.cur[k], prev = D.prev[k], med = D.med[k], mx = 0, i; for (i = 0; i <= k; i++) if (D.cur[i] != null) mx = Math.max(mx, D.cur[i]);
    var d = new Date(Date.UTC(D.curYear, 3, 1 + k, 12)).toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    function df(a, b) { return a == null || b == null ? '' : ' (' + (a - b > 0 ? '+' : a - b < 0 ? '−' : '') + nf(Math.abs(a - b), lg) + ' ' + t.mm + ')'; }
    var c = dchart(D, t, lg);
    return { c: c, html: '<h3 class="gb-sub" style="margin:14px 0 6px;font-size:16px">' + esc(t.dh) + '</h3><div class="di-info-stat-list" style="max-width:640px">' + row(t.dnow.replace('{d}', d), '<b>' + nf(now, lg) + ' ' + esc(t.mm) + '</b>') +
      (prev != null ? row(t.dly, nf(prev, lg) + ' ' + esc(t.mm) + esc(df(now, prev))) : '') + (med != null ? row(dfx(t, 'dmed', String(D.prevYear)), nf(med, lg) + ' ' + esc(t.mm) + esc(df(now, med))) : '') + row(t.dmax, nf(mx, lg) + ' ' + esc(t.mm)) + '</div>' + c.html + '<p class="di-movers-hint" style="margin:6px 0 14px">' + esc(t.dnote) + '</p>' };
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/nl-drought.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load('DEHESA_NL_COROP', 'vendor/nl-corop.js')]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.counties || !D.periods || D.periods.length < 4) return false;
      var t = T[lg], DF = defHtml(D.deficit, t, lg), P = D.periods, n = P.length, last = n - 1, vals = {}, k, ly = -1, tl = Date.parse(P[last]) - 365 * 864e5, bd = 1e12;
      for (k = 0; k < n; k++) { var dd = Math.abs(Date.parse(P[k]) - tl); if (dd < bd) { bd = dd; ly = k; } }
      if (bd > 6 * 864e5) ly = -1;
      for (k in D.counties) if (D.counties.hasOwnProperty(k)) vals[k] = wa(D.counties[k].v[last]);
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [10, 30, 50, 70], labels: ['< 10 %', '10–30 %', '30–50 %', '50–70 %', '≥ 70 %'], fmt: function (v) { return nf(v, lg, 1) + ' %'; }, label: t.map, none: t.none }) : null;
      var names = {}; if (MAP) MAP.states.forEach(function (s) { names[s.id] = nm(s.name); });
      var S = national(D, last), SL = ly >= 0 ? national(D, ly) : null, V = [], i;
      for (i = 0; i < n; i++) V.push(wa(national(D, i)));
      var rowsA = Object.keys(D.counties).sort(function (x, y) { return vals[y] - vals[x]; }).map(function (c) {
        var v = D.counties[c].v[last], h = ly >= 0 ? wa(D.counties[c].v[ly]) : null;
        return '<tr><th scope="row">' + esc(names[c] || nm(D.counties[c].name)) + '</th><td class="cof-n">' + nf(cl(v[0]), lg) + '</td><td class="cof-n">' + nf(cl(v[1]), lg) + '</td><td class="cof-n">' + nf(cl(v[2]), lg) + '</td><td class="cof-n"><b>' + nf(wa(v), lg) + '</b></td><td class="cof-n">' + (h == null ? '—' : nf(h, lg)) + '</td></tr>';
      });
      var HEAD = '<thead><tr><th scope="col">' + esc(t.prov) + '</th><th scope="col" class="cof-n">' + esc(t.cls[1]) + ' %</th><th scope="col" class="cof-n">' + esc(t.cls[2]) + ' %</th><th scope="col" class="cof-n">' + esc(t.cls[3]) + ' %</th><th scope="col" class="cof-n">' + esc(t.wa) + ' %</th><th scope="col" class="cof-n">' + esc(t.hy) + ' %</th></tr></thead>';
      var hc = hchart(P, V, t, lg);
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="nl-sq" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{d}', day(P[last], lg))) + '</p>' +
        DF.html + '<div class="di-info-card-title gb-sub">' + esc(t.hh || t.wa) + '</div><div class="di-info-stat-list" style="max-width:640px">' + row(t.wa, '<b>' + nf(wa(S), lg, 1) + ' %</b>') + row(t.all, nf(all3(S), lg, 1) + ' %') + (SL ? row(t.ly, nf(wa(SL), lg, 1) + ' % · ' + esc(dshort(P[ly], lg))) : '') + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map) + '</div><div class="wp-readout nl-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html : '') + stack(S, t, lg) + hc.html +
        '<div class="di-info-card-title gb-sub">' + esc(t.tbl) + '</div><div style="overflow-x:auto"><table class="cof-tbl" style="max-width:760px">' + HEAD + '<tbody>' + rowsA.slice(0, 10).join('') + '</tbody></table></div>' +
        '<details class="nl-all"><summary>' + esc(t.all40) + '</summary><div style="overflow-x:auto"><table class="cof-tbl" style="max-width:760px">' + HEAD + '<tbody>' + rowsA.slice(10).join('') + '</tbody></table></div></details>' +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>; ' + (D.deficit && D.source.knmiUrl ? '<a href="' + esc(D.source.knmiUrl) + '" target="_blank" rel="noopener noreferrer">KNMI</a>; ' : '') + esc(t.srcB) + '</p></section>';
      if (mp) M.bind(el, el.querySelector('.nl-tip'), t.hint, function (id) { var c = D.counties[id], nmn = names[id] || id; if (!c) return '<b>' + esc(nmn) + '</b> · ' + esc(t.none); var v = c.v[last]; return '<b>' + esc(nmn) + '</b> · ' + esc(t.wa) + ' ' + nf(wa(v), lg, 1) + ' % (' + esc(t.cls[2]) + ' ' + nf(cl(v[1]), lg) + ', ' + esc(t.cls[3]) + ' ' + nf(cl(v[2]), lg) + ')'; });
      bindH(el, hc, t, lg); if (DF.c) dbind(el, DF.c, t, lg);
      return true;
    });
  }
  global.DINlDrought = { mount: mount };
  function auto() {
    var el = document.getElementById('nlsq'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
