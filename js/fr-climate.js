/* Dehesa Index — Francia: lluvia y temperatura del mes por departamento, estaciones de Météo-France frente a su normal 1991-2020.
   data/fr-climate-departements.json (scripts/update-fr-climate-departements.py). Bloque de la ficha de Francia (paises.js frUp) y tabla de la región
   (region-more.js). Mapa con js/fr-dept-map.js. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Lluvia y temperatura por departamento', sub: 'Estaciones de Météo-France de cada departamento comparadas con su normal 1991-2020.', month: 'Mes', p: 'Lluvia', t: 'Temperatura',
      mapP: 'Lluvia del mes frente a lo normal (%)', mapT: 'Temperatura media frente a lo normal (°C)', hint: 'Pasa el cursor o toca un departamento para ver su último año.', none: 'sin estaciones suficientes',
      dry: 'Departamentos con menos del 50 % de la lluvia normal', wet: 'Departamentos con más del 150 % de la lluvia normal', warm: 'Anomalía media de temperatura (media de departamentos)', of: 'de',
      mm: 'mm', vsN: 'frente a lo normal', normal: 'normal', st: 'estaciones', dep: 'Departamento', tbl: 'Último año en {d}', pa: 'Lluvia (mm)', pPct: '% de lo normal', tc: 'Temp. media (°C)', ta: 'Diferencia (°C)',
      calc: 'Cálculo de Dehesa Index con datos de Météo-France.', src: 'Fuente:', srcN: 'Météo-France, Données climatologiques de base (data.gouv.fr)', miss: 'Sin dato reciente por falta de estaciones: {d}.',
      lp: ['muy seco (<50 %)', 'seco (50-80 %)', 'normal (80-120 %)', 'húmedo (120-150 %)', 'muy húmedo (>150 %)'], lt: ['< −1,5', '−1,5 a −0,5', '−0,5 a +0,5', '+0,5 a +1,5', '> +1,5'] },
    en: { h: 'Rainfall and temperature by département', sub: 'Météo-France stations in each département compared with their 1991-2020 normal.', month: 'Month', p: 'Rainfall', t: 'Temperature',
      mapP: 'Rainfall this month vs normal (%)', mapT: 'Mean temperature vs normal (°C)', hint: 'Hover or tap a département to see its last year.', none: 'not enough stations',
      dry: 'Départements with under 50 % of normal rainfall', wet: 'Départements with over 150 % of normal rainfall', warm: 'Average temperature anomaly (mean of départements)', of: 'of',
      mm: 'mm', vsN: 'vs normal', normal: 'normal', st: 'stations', dep: 'Département', tbl: 'Last year in {d}', pa: 'Rainfall (mm)', pPct: '% of normal', tc: 'Mean temp. (°C)', ta: 'Difference (°C)',
      calc: 'Calculated by Dehesa Index from Météo-France data.', src: 'Source:', srcN: 'Météo-France, Données climatologiques de base (data.gouv.fr)', miss: 'No recent data for lack of stations: {d}.',
      lp: ['very dry (<50 %)', 'dry (50-80 %)', 'normal (80-120 %)', 'wet (120-150 %)', 'very wet (>150 %)'], lt: ['< −1.5', '−1.5 to −0.5', '−0.5 to +0.5', '+0.5 to +1.5', '> +1.5'] },
    fr: { h: 'Pluie et température par département', sub: 'Stations Météo-France de chaque département comparées à leur normale 1991-2020.', month: 'Mois', p: 'Pluie', t: 'Température',
      mapP: 'Pluie du mois par rapport à la normale (%)', mapT: 'Température moyenne par rapport à la normale (°C)', hint: 'Survolez ou touchez un département pour voir sa dernière année.', none: 'pas assez de stations',
      dry: 'Départements à moins de 50 % de la pluie normale', wet: 'Départements à plus de 150 % de la pluie normale', warm: 'Écart moyen de température (moyenne des départements)', of: 'sur',
      mm: 'mm', vsN: 'par rapport à la normale', normal: 'normale', st: 'stations', dep: 'Département', tbl: 'Dernière année : {d}', pa: 'Pluie (mm)', pPct: '% de la normale', tc: 'Temp. moyenne (°C)', ta: 'Écart (°C)',
      calc: 'Calcul de Dehesa Index à partir des données de Météo-France.', src: 'Source :', srcN: 'Météo-France, Données climatologiques de base (data.gouv.fr)', miss: 'Pas de donnée récente faute de stations : {d}.',
      lp: ['très sec (<50 %)', 'sec (50-80 %)', 'normal (80-120 %)', 'humide (120-150 %)', 'très humide (>150 %)'], lt: ['< −1,5', '−1,5 à −0,5', '−0,5 à +0,5', '+0,5 à +1,5', '> +1,5'] },
    it: { h: 'Pioggia e temperatura per dipartimento', sub: 'Stazioni di Météo-France di ogni dipartimento confrontate con la loro normale 1991-2020.', month: 'Mese', p: 'Pioggia', t: 'Temperatura',
      mapP: 'Pioggia del mese rispetto alla norma (%)', mapT: 'Temperatura media rispetto alla norma (°C)', hint: 'Passa il cursore o tocca un dipartimento per vedere il suo ultimo anno.', none: 'stazioni insufficienti',
      dry: 'Dipartimenti con meno del 50 % della pioggia normale', wet: 'Dipartimenti con più del 150 % della pioggia normale', warm: 'Scarto medio di temperatura (media dei dipartimenti)', of: 'su',
      mm: 'mm', vsN: 'rispetto alla norma', normal: 'normale', st: 'stazioni', dep: 'Dipartimento', tbl: 'Ultimo anno: {d}', pa: 'Pioggia (mm)', pPct: '% della norma', tc: 'Temp. media (°C)', ta: 'Scarto (°C)',
      calc: 'Calcolo di Dehesa Index su dati di Météo-France.', src: 'Fonte:', srcN: 'Météo-France, Données climatologiques de base (data.gouv.fr)', miss: 'Nessun dato recente per mancanza di stazioni: {d}.',
      lp: ['molto secco (<50 %)', 'secco (50-80 %)', 'normale (80-120 %)', 'umido (120-150 %)', 'molto umido (>150 %)'], lt: ['< −1,5', '−1,5 a −0,5', '−0,5 a +0,5', '+0,5 a +1,5', '> +1,5'] }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, CACHE = {}, ST = { m: 'p', per: null };
  /* Alemania (js/fr-climate.js sirve a los dos países): medias de área por Land del DWD, data/de-climate-laender.json (scripts/update-de-climate-laender.py) */
  var TDE = {
    es: { h: 'Lluvia y temperatura por Land', sub: 'Medias de cada Land que publica el Deutscher Wetterdienst, comparadas con la normal 1991-2020.', hint: 'Pasa el cursor o toca un Land para ver su último año.', none: 'sin dato',
      dry: 'Länder con menos del 50 % de la lluvia normal', wet: 'Länder con más del 150 % de la lluvia normal', warm: 'Alemania (media del DWD): diferencia de temperatura', nat: 'Alemania (media del DWD): lluvia', calc: 'La normal y la diferencia las calcula Dehesa Index con la serie del DWD.', srcN: 'Deutscher Wetterdienst, Climate Data Center (medias regionales)', area: 'área del DWD: {a}' },
    en: { h: 'Rainfall and temperature by Land', sub: 'Area averages for each Land published by the Deutscher Wetterdienst, compared with the 1991-2020 normal.', hint: 'Hover or tap a Land to see its last year.', none: 'no data',
      dry: 'Länder with under 50 % of normal rainfall', wet: 'Länder with over 150 % of normal rainfall', warm: 'Germany (DWD average): temperature difference', nat: 'Germany (DWD average): rainfall', calc: 'The normal and the difference are calculated by Dehesa Index from the DWD series.', srcN: 'Deutscher Wetterdienst, Climate Data Center (regional averages)', area: 'DWD area: {a}' },
    fr: { h: 'Pluie et température par Land', sub: 'Moyennes de chaque Land publiées par le Deutscher Wetterdienst, comparées à la normale 1991-2020.', hint: 'Survolez ou touchez un Land pour voir sa dernière année.', none: 'pas de donnée',
      dry: 'Länder à moins de 50 % de la pluie normale', wet: 'Länder à plus de 150 % de la pluie normale', warm: 'Allemagne (moyenne du DWD) : écart de température', nat: 'Allemagne (moyenne du DWD) : pluie', calc: 'La normale et l’écart sont calculés par Dehesa Index à partir de la série du DWD.', srcN: 'Deutscher Wetterdienst, Climate Data Center (moyennes régionales)', area: 'zone du DWD : {a}' },
    it: { h: 'Pioggia e temperatura per Land', sub: 'Medie di ogni Land pubblicate dal Deutscher Wetterdienst, confrontate con la normale 1991-2020.', hint: 'Passa il cursore o tocca un Land per vedere il suo ultimo anno.', none: 'nessun dato',
      dry: 'Länder con meno del 50 % della pioggia normale', wet: 'Länder con più del 150 % della pioggia normale', warm: 'Germania (media del DWD): scarto di temperatura', nat: 'Germania (media del DWD): pioggia', calc: 'La normale e lo scarto sono calcolati da Dehesa Index sulla serie del DWD.', srcN: 'Deutscher Wetterdienst, Climate Data Center (medie regionali)', area: 'area del DWD: {a}' }
  };
  /* Grecia y demás países con rejilla de NASA POWER promediada por región NUTS 2: data/region-grid-climate/<PAIS>.json (scripts/update-region-grid-climate.py) */
  var TGR = {
    es: { h: 'Lluvia y temperatura por región', sub: 'Media de toda la región con la rejilla de NASA POWER (reanálisis MERRA-2), comparada con su normal 1991-2020.', hint: 'Pasa el cursor o toca una región para ver su último año.', none: 'sin dato',
      dry: 'Regiones con menos del 50 % de la lluvia normal', wet: 'Regiones con más del 150 % de la lluvia normal', warm: 'Diferencia media de temperatura (media de las regiones)', calc: 'La media por región, la normal y la diferencia las calcula Dehesa Index con la rejilla de NASA POWER.', srcN: 'NASA POWER (MERRA-2), endpoint regional', tbl: 'Último año: {d}' },
    en: { h: 'Rainfall and temperature by region', sub: 'Average over the whole region from the NASA POWER grid (MERRA-2 reanalysis), compared with its 1991-2020 normal.', hint: 'Hover or tap a region to see its last year.', none: 'no data',
      dry: 'Regions with under 50 % of normal rainfall', wet: 'Regions with over 150 % of normal rainfall', warm: 'Average temperature difference (mean of the regions)', calc: 'The regional average, the normal and the difference are calculated by Dehesa Index from the NASA POWER grid.', srcN: 'NASA POWER (MERRA-2), regional endpoint', tbl: 'Last year: {d}' },
    fr: { h: 'Pluie et température par région', sub: 'Moyenne sur toute la région à partir de la grille de NASA POWER (réanalyse MERRA-2), comparée à sa normale 1991-2020.', hint: 'Survolez ou touchez une région pour voir sa dernière année.', none: 'pas de donnée',
      dry: 'Régions à moins de 50 % de la pluie normale', wet: 'Régions à plus de 150 % de la pluie normale', warm: 'Écart moyen de température (moyenne des régions)', calc: 'La moyenne régionale, la normale et l’écart sont calculés par Dehesa Index à partir de la grille de NASA POWER.', srcN: 'NASA POWER (MERRA-2), point d’accès régional', tbl: 'Dernière année : {d}' },
    it: { h: 'Pioggia e temperatura per regione', sub: 'Media dell’intera regione dalla griglia di NASA POWER (rianalisi MERRA-2), confrontata con la sua normale 1991-2020.', hint: 'Passa il cursore o tocca una regione per vedere il suo ultimo anno.', none: 'nessun dato',
      dry: 'Regioni con meno del 50 % della pioggia normale', wet: 'Regioni con più del 150 % della pioggia normale', warm: 'Scarto medio di temperatura (media delle regioni)', calc: 'La media regionale, la normale e lo scarto sono calcolati da Dehesa Index sulla griglia di NASA POWER.', srcN: 'NASA POWER (MERRA-2), endpoint regionale', tbl: 'Ultimo anno: {d}' }
  };
  var CFG = { FR: { url: 'data/fr-climate-departements.json', map: null, id: 'ps-fr-clim', lic: 'Licence Ouverte 2.0', tx: null },
    DE: { url: 'data/de-climate-laender.json', map: ['DEHESA_DE_LAENDER', 'vendor/de-laender.js'], id: 'ps-de-clim', lic: 'CC BY 4.0', tx: TDE, nat: 'DE' },
    EL: { url: 'data/region-grid-climate/EL.json', map: ['DEHESA_EL_REGIONS', 'vendor/el-regions.js'], id: 'ps-el-clim', lic: 'NASA', tx: TGR } };
  function tx(c, lg) { var t = T[lg], o = c.tx && c.tx[lg], r = {}, k; for (k in t) r[k] = t[k]; if (o) for (k in o) r[k] = o[k]; return r; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg] || 'es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function sg(v, d, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d, lg); }
  function mname(p, lg) { try { return new Date(Date.UTC(+p.slice(0, 4), +p.slice(5, 7) - 1, 1)).toLocaleDateString(LOC[lg], { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p; } }
  function load(u) { u = u || CFG.FR.url; return CACHE[u] || (CACHE[u] = fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function units(D) { return D ? (D.departements || D.units || []) : []; }
  function at(d, per) { for (var i = 0; i < d.months.length; i++) if (d.months[i].period === per) return d.months[i]; return null; }
  /* tabla del último año de un departamento */
  function deptTable(d, lg, t) {
    t = t || T[lg]; var th = 'padding:6px;font-size:11px;font-weight:700;color:var(--text-faint);text-align:right', td = 'padding:6px;border-top:1px solid var(--border);text-align:right;font-variant-numeric:tabular-nums';
    var rows = d.months.slice().reverse().map(function (m) { var pp = m.precipAnomalyPct == null ? null : 100 + m.precipAnomalyPct;
      return '<tr><td style="' + td + ';text-align:left">' + esc(mname(m.period, lg)) + '</td><td style="' + td + '">' + nf(m.precipMm, 0, lg) + '</td><td style="' + td + '">' + (pp == null ? '—' : nf(pp, 0, lg) + ' %') + '</td><td style="' + td + '">' + nf(m.tempC, 1, lg) + '</td><td style="' + td + '">' + sg(m.tempAnomalyC, 1, lg) + '</td></tr>'; }).join('');
    return '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:13px"><caption style="text-align:left;font-weight:700;padding:4px 0">' + esc(t.tbl.replace('{d}', d.name + ' (' + d.id + ')')) + '</caption><thead><tr><th scope="col" style="' + th + ';text-align:left">' + esc(t.month) + '</th><th scope="col" style="' + th + '">' + esc(t.pa) + '</th><th scope="col" style="' + th + '">' + esc(t.pPct) + '</th><th scope="col" style="' + th + '">' + esc(t.tc) + '</th><th scope="col" style="' + th + '">' + esc(t.ta) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function mount(el, lg, cc) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es'; var C = CFG[cc] || CFG.FR;
    var M = global.DIFrDeptMap;
    return Promise.all([load(C.url), M ? (C.map ? M.load(C.map[0], C.map[1]) : M.load()) : null]).then(function (a) {
      var D = a[0], MAP = a[1], U = units(D); if (!U.length) { el.innerHTML = ''; return false; }
      var t = tx(C, lg), pers = {}, byId = {}, NAT = C.nat ? byId : null;
      U.forEach(function (d) { byId[d.mapId || d.id] = d; d.months.forEach(function (m) { pers[m.period] = 1; }); });
      var P = Object.keys(pers).sort(); if (!ST.per || P.indexOf(ST.per) < 0) ST.per = D.lastPeriod;
      var vals = {}, dry = 0, wet = 0, n = 0, ta = [], k;
      U.forEach(function (d) { var m = at(d, ST.per); if (!m || d.id === C.nat) return;
        var v = ST.m === 'p' ? (m.precipAnomalyPct == null ? null : 100 + m.precipAnomalyPct) : m.tempAnomalyC;
        if (v != null) { vals[d.mapId || d.id] = v; if (d.id === '20') { vals['2A'] = v; vals['2B'] = v; } }
        if (m.precipAnomalyPct != null) { n++; if (m.precipAnomalyPct < -50) dry++; if (m.precipAnomalyPct > 50) wet++; }
        if (m.tempAnomalyC != null) ta.push(m.tempAnomalyC); });
      var tav = ta.length ? ta.reduce(function (s, x) { return s + x; }, 0) / ta.length : null, nm0 = C.nat && byId[C.nat] ? at(byId[C.nat], ST.per) : null;
      if (nm0) tav = nm0.tempAnomalyC;   /* Alemania: la media nacional es la del DWD, no la media de los Länder */
      var mp = MAP && M ? M.html(MAP, ST.m === 'p' ? { values: vals, cuts: [50, 80, 120, 150], labels: t.lp, fmt: function (v) { return nf(v, 0, lg) + ' %'; }, label: t.mapP, none: t.none }
        : { values: vals, cuts: [-1.5, -0.5, 0.5, 1.5], labels: t.lt, fmt: function (v) { return sg(v, 1, lg) + ' °C'; }, label: t.mapT, none: t.none }) : null;
      var chip = function (on, data, txt) { return '<button type="button" class="esp-chip' + (on ? ' on' : '') + '" ' + data + ' aria-pressed="' + on + '">' + esc(txt) + '</button>'; };
      var opts = P.slice().reverse().map(function (p) { return '<option value="' + p + '"' + (p === ST.per ? ' selected' : '') + '>' + esc(mname(p, lg)) + '</option>'; }).join('');
      var row = function (l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; };
      var miss = (D.missing || []).map(function (id) { return id; });
      el.innerHTML = '<section class="di-card ps-rm gb-card frc-card ' + (ST.m === 'p' ? 'frc-p' : 'frc-t') + '" id="' + C.id + '" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.sub) + '</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px"><div class="esp-tabs" role="group">' + chip(ST.m === 'p', 'data-frc="p"', '🌧️ ' + t.p) + chip(ST.m === 't', 'data-frc="t"', '🌡️ ' + t.t) + '</div>' +
        '<label style="font-size:13px">' + esc(t.month) + ' <select class="frc-per" style="margin-left:4px">' + opts + '</select></label></div>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(t.dry, '<b>' + dry + '</b> ' + esc(t.of) + ' ' + n) + row(t.wet, '<b>' + wet + '</b> ' + esc(t.of) + ' ' + n) + (nm0 && nm0.precipAnomalyPct != null ? row(t.nat, '<b>' + nf(100 + nm0.precipAnomalyPct, 0, lg) + ' %</b> ' + esc(t.vsN)) : '') + row(t.warm, '<b>' + sg(tav, 1, lg) + ' °C</b>') + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc((ST.m === 'p' ? t.mapP : t.mapT) + ' · ' + mname(ST.per, lg)) + '</div><div class="wp-readout frc-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html : '') +
        '<div class="frc-dept" style="margin-top:10px"></div>' +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc((D.methodology && D.methodology[lg]) || (D.methodology && D.methodology.en) || '') + (miss.length ? ' ' + esc(t.miss.replace('{d}', miss.join(', '))) : '') + '</p>' +
        '<p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a> (' + esc(C.lic) + '). ' + esc(t.calc) + '</p></section>';
      Array.prototype.forEach.call(el.querySelectorAll('[data-frc]'), function (b) { b.onclick = function () { ST.m = b.getAttribute('data-frc'); mount(el, lg, cc); }; });
      var sel = el.querySelector('.frc-per'); if (sel) sel.onchange = function () { ST.per = sel.value; mount(el, lg, cc); };
      var box = el.querySelector('.frc-dept');
      if (mp) M.bind(el, el.querySelector('.frc-tip'), t.hint, function (id) {
        var d = byId[id] || ((id === '2A' || id === '2B') ? byId['20'] : null), nm = d ? d.name : (mp.names[id] || id);
        if (!d) { box.innerHTML = ''; return '<b>' + esc(nm) + '</b> · ' + esc(t.none); }
        box.innerHTML = deptTable(d, lg, t);
        var m = at(d, ST.per); if (!m) return '<b>' + esc(nm) + '</b> · ' + esc(t.none);
        return '<b>' + esc(nm) + '</b> · ' + esc(t.p) + ' <b>' + nf(m.precipMm, 0, lg) + ' ' + t.mm + '</b> (' + (m.precipAnomalyPct == null ? '—' : nf(100 + m.precipAnomalyPct, 0, lg) + ' % ' + esc(t.vsN)) + ') · ' + esc(t.t) + ' <b>' + nf(m.tempC, 1, lg) + ' °C</b> (' + sg(m.tempAnomalyC, 1, lg) + ' °C)' + ((m.nPrecip || m.nTemp) ? ' · ' + (m.nPrecip || m.nTemp) + ' ' + esc(t.st) : '') + (d.dwdArea && d.dwdArea !== d.name && t.area ? ' · ' + esc(t.area.replace('{a}', d.dwdArea)) : '');
      });
      return true;
    });
  }
  /* filas para la tabla de la región (region-more.js): último mes de cada departamento de la región */
  function regionRows(reg, lg) {
    lg = T[lg] ? lg : 'es';
    return load().then(function (D) {
      if (!D || !D.departements) return null;
      var deps = D.departements.filter(function (d) { return d.region === reg; }); if (!deps.length) return null;
      var per = D.lastPeriod;
      return { period: per, month: mname(per, lg), source: D.source, rows: deps.map(function (d) { var m = at(d, per) || {};
        return [esc(d.name) + ' <span style="color:var(--text-faint);font-size:12px">' + esc(d.id) + '</span>', nf(m.precipMm, 0, lg), m.precipAnomalyPct == null ? '—' : nf(100 + m.precipAnomalyPct, 0, lg) + ' %', nf(m.tempC, 1, lg), sg(m.tempAnomalyC, 1, lg)]; }) };
    });
  }
  global.DIFrClimate = { mount: mount, regionRows: regionRows, T: T };
})(window);
