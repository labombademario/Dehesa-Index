/* Dehesa Index — Clima agrícola. Lee data/climate.json (NASA POWER). Sin datos, no pinta nada. */
(function () {
  'use strict';
  var WET = '#2a6f97', DRY = '#b8651b', HOT = '#b4341f', COOL = '#2b7a78';
  var T = {
    es: { histTitle: 'Histórico desde 2000', histSub: 'Cómo ha sido cada año frente a la media 2001-2020, para la región y la época que elijas.', selRegion: 'Región', selPeriod: 'Época', periods: { year: 'Año completo (ene-dic)', season: 'Campaña (mar-ago)', summer: 'Verano (jun-ago)' }, histPrecip: 'Lluvia acumulada vs. normal', histTemp: 'Temperatura media vs. normal', rankP: 'Lluvia: puesto {r} de {n} años (1 = el más seco)', rankT: 'Temperatura: puesto {r} de {n} años (1 = el más cálido)', yearWord: 'Año', histNote: 'Solo años con todos los meses de la época cerrados y con dato válido. Como la media es 2001-2020, los años de ese periodo se reparten alrededor de cero por construcción. Los meses más recientes los calcula NASA con un flujo de procesamiento distinto (GEOS-IT) que puede revisarse después: léelos con cautela.', tableView: 'Ver datos en tabla', title: 'Clima agrícola', sub: 'Cuánto se ha desviado la lluvia y la temperatura de lo normal en regiones productoras. Es contexto: no predice cosechas ni precios.',
      regions: { us: 'Estados Unidos', eu: 'Unión Europea', uk: 'Reino Unido' }, precip: 'Lluvia vs. normal', temp: 'Temperatura vs. normal', trend: 'Lluvia, últimos meses',
      dry: 'más seco', wet: 'más húmedo', hot: 'más cálido', cool: 'más fresco', month: 'Mes', crops: { trigo: 'trigo', maiz: 'maíz', soja: 'soja', cebada: 'cebada', arroz: 'arroz' },
      teaserTitle: 'Clima agrícola', teaserHint: 'Último mes cerrado, frente a la media 2001-2020', driest: 'Más seco', wettest: 'Más húmedo', hottest: 'Más cálido', more: 'Ver todas las regiones',
      note: 'Fuente: NASA POWER (reanálisis MERRA-2), media 2001-2020 del mismo mes. Cada punto es una celda de malla de unos 50 km representativa de la región, no una estación ni un promedio de toda la región. Solo meses cerrados con dato válido.', links: 'Cómo se calcula', table: 'Ver datos en tabla', mm: 'mm', legendP: 'Barra azul: más lluvia de lo normal · barra marrón: menos', legendT: 'Barra roja: más cálido · barra verde azulada: más fresco', showTable: 'Tabla de datos' },
    en: { histTitle: 'History since 2000', histSub: 'How each year compared with the 2001-2020 average, for the region and season you choose.', selRegion: 'Region', selPeriod: 'Season', periods: { year: 'Full year (Jan-Dec)', season: 'Growing season (Mar-Aug)', summer: 'Summer (Jun-Aug)' }, histPrecip: 'Cumulative rainfall vs. normal', histTemp: 'Mean temperature vs. normal', rankP: 'Rainfall: rank {r} of {n} years (1 = driest)', rankT: 'Temperature: rank {r} of {n} years (1 = warmest)', yearWord: 'Year', histNote: 'Only years with every month of the season closed and valid. Since the average is 2001-2020, years in that period are spread around zero by construction. The most recent months are computed by NASA with a different processing stream (GEOS-IT) that may be revised later: read them with caution.', tableView: 'View data as a table', title: 'Agricultural climate', sub: 'How far rainfall and temperature are from normal in producing regions. It is context: it does not forecast crops or prices.',
      regions: { us: 'United States', eu: 'European Union', uk: 'United Kingdom' }, precip: 'Rainfall vs. normal', temp: 'Temperature vs. normal', trend: 'Rainfall, recent months',
      dry: 'drier', wet: 'wetter', hot: 'warmer', cool: 'cooler', month: 'Month', crops: { trigo: 'wheat', maiz: 'corn', soja: 'soybeans', cebada: 'barley', arroz: 'rice' },
      teaserTitle: 'Agricultural climate', teaserHint: 'Latest closed month vs. the 2001-2020 average', driest: 'Driest', wettest: 'Wettest', hottest: 'Warmest', more: 'See all regions',
      note: 'Source: NASA POWER (MERRA-2 reanalysis), 2001-2020 average for the same month. Each point is a ~50 km grid cell representing the region, not a station or a whole-region average. Closed months with valid data only.', links: 'How it is calculated', mm: 'mm', legendP: 'Blue bar: wetter than normal · brown bar: drier', legendT: 'Red bar: warmer · teal bar: cooler', showTable: 'Data table' },
    fr: { histTitle: 'Historique depuis 2000', histSub: 'Comment chaque année se situe par rapport à la moyenne 2001-2020, pour la région et la période choisies.', selRegion: 'Région', selPeriod: 'Période', periods: { year: 'Année complète (janv.-déc.)', season: 'Campagne (mars-août)', summer: 'Été (juin-août)' }, histPrecip: 'Pluie cumulée vs. normale', histTemp: 'Température moyenne vs. normale', rankP: 'Pluie : rang {r} sur {n} ans (1 = le plus sec)', rankT: 'Température : rang {r} sur {n} ans (1 = le plus chaud)', yearWord: 'Année', histNote: 'Uniquement les années dont tous les mois de la période sont clos et valides. La moyenne étant 2001-2020, les années de cette période se répartissent autour de zéro par construction. Les mois les plus récents sont calculés par la NASA avec un autre flux de traitement (GEOS-IT), susceptible d’être révisé : à lire avec prudence.', tableView: 'Voir les données en tableau', title: 'Climat agricole', sub: 'Écart des pluies et de la température par rapport à la normale dans les régions productrices. C’est un contexte : cela ne prévoit ni récoltes ni prix.',
      regions: { us: 'États-Unis', eu: 'Union européenne', uk: 'Royaume-Uni' }, precip: 'Pluie vs. normale', temp: 'Température vs. normale', trend: 'Pluie, derniers mois',
      dry: 'plus sec', wet: 'plus humide', hot: 'plus chaud', cool: 'plus frais', month: 'Mois', crops: { trigo: 'blé', maiz: 'maïs', soja: 'soja', cebada: 'orge', arroz: 'riz' },
      teaserTitle: 'Climat agricole', teaserHint: 'Dernier mois clos, par rapport à la moyenne 2001-2020', driest: 'Plus sec', wettest: 'Plus humide', hottest: 'Plus chaud', more: 'Voir toutes les régions',
      note: 'Source : NASA POWER (réanalyse MERRA-2), moyenne 2001-2020 du même mois. Chaque point est une maille d’environ 50 km représentative de la région, pas une station ni une moyenne de toute la région. Mois clos avec données valides uniquement.', links: 'Méthode de calcul', mm: 'mm', legendP: 'Barre bleue : plus de pluie que la normale · barre brune : moins', legendT: 'Barre rouge : plus chaud · barre bleu-vert : plus frais', showTable: 'Tableau de données' },
    it: { histTitle: 'Storico dal 2000', histSub: 'Come è stato ogni anno rispetto alla media 2001-2020, per la regione e il periodo scelti.', selRegion: 'Regione', selPeriod: 'Periodo', periods: { year: 'Anno intero (gen-dic)', season: 'Campagna (mar-ago)', summer: 'Estate (giu-ago)' }, histPrecip: 'Pioggia cumulata vs. norma', histTemp: 'Temperatura media vs. norma', rankP: 'Pioggia: posizione {r} su {n} anni (1 = il più secco)', rankT: 'Temperatura: posizione {r} su {n} anni (1 = il più caldo)', yearWord: 'Anno', histNote: 'Solo anni con tutti i mesi del periodo chiusi e validi. Poiché la media è 2001-2020, gli anni di quel periodo si distribuiscono attorno allo zero per costruzione. I mesi più recenti sono calcolati dalla NASA con un diverso flusso di elaborazione (GEOS-IT) che potrebbe essere rivisto: leggili con cautela.', tableView: 'Vedi i dati in tabella', title: 'Clima agricolo', sub: 'Quanto pioggia e temperatura si discostano dalla norma nelle regioni produttrici. È contesto: non prevede raccolti né prezzi.',
      regions: { us: 'Stati Uniti', eu: 'Unione europea', uk: 'Regno Unito' }, precip: 'Pioggia vs. norma', temp: 'Temperatura vs. norma', trend: 'Pioggia, ultimi mesi',
      dry: 'più secco', wet: 'più umido', hot: 'più caldo', cool: 'più fresco', month: 'Mese', crops: { trigo: 'grano', maiz: 'mais', soja: 'soia', cebada: 'orzo', arroz: 'riso' },
      teaserTitle: 'Clima agricolo', teaserHint: 'Ultimo mese chiuso, rispetto alla media 2001-2020', driest: 'Più secco', wettest: 'Più umido', hottest: 'Più caldo', more: 'Vedi tutte le regioni',
      note: 'Fonte: NASA POWER (rianalisi MERRA-2), media 2001-2020 dello stesso mese. Ogni punto è una cella di circa 50 km rappresentativa della regione, non una stazione né una media dell’intera regione. Solo mesi chiusi con dati validi.', links: 'Come si calcola', mm: 'mm', legendP: 'Barra blu: più pioggia del normale · barra marrone: meno', legendT: 'Barra rossa: più caldo · barra verde-azzurra: più fresco', showTable: 'Tabella dei dati' }
  };
  var DATA = null;
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function num(v, d) { return v.toFixed(d).replace('.', ','); }
  function sgn(v, d, unit) { return (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), d) + unit; }
  function last(l) { return l.months[l.months.length - 1]; }
  // Barra divergente centrada: el signo va siempre en el texto, no solo en el color.
  function bar(v, max, pos, neg, txt) {
    var w = Math.min(Math.abs(v) / max, 1) * 50;
    var st = v >= 0 ? 'left:50%;background:' + pos : 'left:' + (50 - w) + '%;background:' + neg;
    return '<div style="display:flex;align-items:center;gap:8px"><div style="position:relative;flex:1;height:10px;background:var(--border);border-radius:5px;min-width:90px"><div style="position:absolute;top:0;height:10px;width:' + w + '%;' + st + ';border-radius:' + (v >= 0 ? '0 5px 5px 0' : '5px 0 0 5px') + '"></div><div style="position:absolute;left:50%;top:-2px;width:1px;height:14px;background:var(--text-muted)"></div></div><span style="min-width:64px;text-align:right;font-size:13px;font-weight:600">' + txt + '</span></div>';
  }
  function spark(months) {
    var m = months.slice(-12), w = 96, h = 26, bw = w / m.length;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="96" height="26" role="img" aria-label="">' + m.map(function (x, i) {
      var v = Math.max(-100, Math.min(100, x.precipAnomalyPct)), hh = Math.abs(v) / 100 * (h / 2 - 1);
      return '<rect x="' + (i * bw + 0.5).toFixed(1) + '" y="' + (v >= 0 ? (h / 2 - hh) : h / 2).toFixed(1) + '" width="' + (bw - 1.5).toFixed(1) + '" height="' + Math.max(hh, 0.8).toFixed(1) + '" fill="' + (v >= 0 ? WET : DRY) + '"><title>' + x.period + ': ' + sgn(x.precipAnomalyPct, 0, ' %') + '</title></rect>';
    }).join('') + '<line x1="0" x2="' + w + '" y1="' + h / 2 + '" y2="' + h / 2 + '" stroke="currentColor" stroke-opacity=".3"/></svg>';
  }
  function cropsText(l, t) { return l.crops.map(function (c) { return t.crops[c] || c; }).join(', '); }
  function pick(fn, dir) { return DATA.locations.slice().sort(function (a, b) { return dir * (fn(last(a)) - fn(last(b))); })[0]; }
  function fmtPeriod(p) { return p; }
  function page() {
    var el = document.getElementById('clima-body'); if (!el || !DATA) return;
    var t = T[lang()] || T.es;
    document.title = 'Dehesa Index — ' + t.title;
    document.getElementById('pg-h1').textContent = t.title;
    document.getElementById('pg-sub').textContent = t.sub;
    var html = '<p class="di-movers-hint" style="margin:0 0 6px">' + t.month + ': <b>' + DATA.lastPeriod + '</b> · ' + t.legendP + '<br>' + t.legendT + '</p>';
    ['us', 'eu', 'uk'].forEach(function (r) {
      var rows = DATA.locations.filter(function (l) { return l.region === r; }); if (!rows.length) return;
      html += '<section class="di-info-section"><h2>' + t.regions[r] + '</h2><div class="di-card" style="padding:6px 16px;overflow-x:auto">' +
        '<div style="display:grid;grid-template-columns:minmax(150px,1.2fr) minmax(170px,1.3fr) minmax(170px,1.3fr) 100px;gap:14px;padding:8px 0;font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);border-bottom:1px solid var(--border);min-width:640px"><span></span><span>' + t.precip.toUpperCase() + '</span><span>' + t.temp.toUpperCase() + '</span><span>' + t.trend.toUpperCase() + '</span></div>' +
        rows.map(function (l) {
          var m = last(l);
          return '<div style="display:grid;grid-template-columns:minmax(150px,1.2fr) minmax(170px,1.3fr) minmax(170px,1.3fr) 100px;gap:14px;padding:12px 0;align-items:center;border-bottom:1px solid var(--border);min-width:640px"><div><div style="font-weight:600;font-size:14px">' + l.name + '</div><div class="di-movers-hint">' + cropsText(l, t) + '</div></div>' +
            '<div>' + bar(m.precipAnomalyPct, 100, WET, DRY, sgn(m.precipAnomalyPct, 0, ' %')) + '<div class="di-movers-hint">' + num(m.precipMm, 0) + ' ' + t.mm + ' (' + num(m.precipBaselineMm, 0) + ' ' + t.mm + ')</div></div>' +
            '<div>' + bar(m.tempAnomalyC, 5, HOT, COOL, sgn(m.tempAnomalyC, 1, ' °C')) + '<div class="di-movers-hint">' + num(m.tempC, 1) + ' °C (' + num(m.tempBaselineC, 1) + ' °C)</div></div>' +
            '<div>' + spark(l.months) + '</div></div>';
        }).join('') + '</div></section>';
    });
    html += '<p class="di-info-api-notice">' + t.note + ' <a href="metodologia.html">' + t.links + '</a> · <a href="data/climate.json">JSON</a></p>';
    el.innerHTML = html + '<div id="clima-hist"></div>';
    histRender();
  }

  // ---------------- Histórico desde 2000 ----------------
  var HIST = null, SEL = { loc: null, period: 'season' };
  var PERIODS = { year: [0, 11], season: [2, 7], summer: [5, 7] };
  function dim(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  function yearly(h, per, start) {
    var y0 = +start.slice(0, 4), a = PERIODS[per][0], b = PERIODS[per][1], out = [];
    var nYears = Math.floor(h.precipMmDay.length / 12);
    for (var i = 0; i < nYears; i++) {
      var y = y0 + i, pS = 0, pB = 0, tS = 0, tB = 0, d = 0, ok = true;
      for (var m = a; m <= b; m++) {
        var p = h.precipMmDay[i * 12 + m], t = h.tempC[i * 12 + m];
        if (p === null || t === null) { ok = false; break; }
        var n = dim(y, m); pS += p * n; pB += h.baselinePrecipMmDay[m] * n; tS += t * n; tB += h.baselineTempC[m] * n; d += n;
      }
      if (ok) out.push({ year: y, precipMm: pS, baseMm: pB, precipPct: 100 * (pS / pB - 1), tempC: tS / d, tempDiff: (tS - tB) / d });
    }
    return out;
  }
  function yearsChart(rows, key, pos, neg, unit, dec) {
    var w = 720, h = 190, pl = 40, pr = 8, pt = 10, pb = 22, n = rows.length;
    var vals = rows.map(function (r) { return r[key]; });
    var mx = Math.max.apply(null, vals.concat([1])), mn = Math.min.apply(null, vals.concat([-1]));
    var span = Math.max(Math.abs(mx), Math.abs(mn)); mx = span; mn = -span;
    var iw = w - pl - pr, ih = h - pt - pb, bw = iw / n;
    function Y(v) { return pt + (mx - v) / (mx - mn) * ih; }
    var g = '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="currentColor" stroke-opacity=".45"/>' +
      '<text x="' + (pl - 6) + '" y="' + (Y(mx) + 4) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".65">' + sgn(mx, dec, '') + '</text>' +
      '<text x="' + (pl - 6) + '" y="' + (Y(0) + 4) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".65">0</text>' +
      '<text x="' + (pl - 6) + '" y="' + (Y(mn) + 4) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".65">' + sgn(mn, dec, '') + '</text>';
    rows.forEach(function (r, i) {
      var v = r[key], y1 = Y(Math.max(v, 0)), hh = Math.max(Math.abs(Y(v) - Y(0)), 1), x = pl + i * bw + 1;
      var last = i === n - 1;
      g += '<rect x="' + x.toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + (v >= 0 ? pos : neg) + '"' + (last ? ' stroke="currentColor" stroke-width="1.5"' : '') + '><title>' + r.year + ': ' + sgn(v, dec, unit) + '</title></rect>';
      if ((r.year % 5 === 0 && r.year <= rows[n - 1].year - 2) || last) g += '<text x="' + (x + (bw - 2) / 2).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".7">' + r.year + '</text>';
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" style="display:block;max-width:760px">' + g + '</svg>';
  }
  function rank(rows, key, desc) { var cur = rows[rows.length - 1][key]; var r = 1; rows.forEach(function (x) { if (desc ? x[key] > cur : x[key] < cur) r++; }); return r; }
  function fill(str, o) { return str.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function histRender() {
    var el = document.getElementById('clima-hist'); if (!el || !HIST || !DATA) return;
    var t = T[lang()] || T.es;
    var loc = HIST.locations.filter(function (l) { return l.id === SEL.loc; })[0] || HIST.locations[0];
    SEL.loc = loc.id;
    var rows = yearly(loc, SEL.period, HIST.start); if (rows.length < 5) { el.innerHTML = ''; return; }
    var meta = DATA.locations.filter(function (l) { return l.id === loc.id; })[0] || { name: loc.id };
    var opt = HIST.locations.map(function (l) { var m = DATA.locations.filter(function (d) { return d.id === l.id; })[0]; return '<option value="' + l.id + '"' + (l.id === loc.id ? ' selected' : '') + '>' + (m ? m.name : l.id) + '</option>'; }).join('');
    var per = Object.keys(PERIODS).map(function (k) { return '<option value="' + k + '"' + (k === SEL.period ? ' selected' : '') + '>' + t.periods[k] + '</option>'; }).join('');
    var cur = rows[rows.length - 1], N = rows.length;
    var tbl = '<table style="border-collapse:collapse;font-size:13px;width:100%;max-width:520px"><tr><th style="text-align:left;padding:4px 8px">' + t.yearWord + '</th><th style="text-align:right;padding:4px 8px">mm</th><th style="text-align:right;padding:4px 8px">%</th><th style="text-align:right;padding:4px 8px">°C</th><th style="text-align:right;padding:4px 8px">Δ °C</th></tr>' +
      rows.slice().reverse().map(function (r) { return '<tr><td style="padding:3px 8px">' + r.year + '</td><td style="text-align:right;padding:3px 8px">' + num(r.precipMm, 0) + '</td><td style="text-align:right;padding:3px 8px">' + sgn(r.precipPct, 0, '') + '</td><td style="text-align:right;padding:3px 8px">' + num(r.tempC, 1) + '</td><td style="text-align:right;padding:3px 8px">' + sgn(r.tempDiff, 1, '') + '</td></tr>'; }).join('') + '</table>';
    el.innerHTML = '<section class="di-info-section"><h2>' + t.histTitle + '</h2><p>' + t.histSub + '</p>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin:0 0 14px"><label style="font-size:13px">' + t.selRegion + '<br><select id="clima-sel-loc" class="di-compare-select">' + opt + '</select></label><label style="font-size:13px">' + t.selPeriod + '<br><select id="clima-sel-per" class="di-compare-select">' + per + '</select></label></div>' +
      '<div class="di-card" style="padding:16px 18px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + t.histPrecip.toUpperCase() + ' (%)</div>' + yearsChart(rows, 'precipPct', WET, DRY, ' %', 0) +
      '<div class="di-movers-hint" style="margin:4px 0 16px">' + cur.year + ': <b>' + sgn(cur.precipPct, 0, ' %') + '</b> · ' + fill(t.rankP, { r: rank(rows, 'precipPct', false), n: N }) + '</div>' +
      '<div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + t.histTemp.toUpperCase() + ' (°C)</div>' + yearsChart(rows, 'tempDiff', HOT, COOL, ' °C', 1) +
      '<div class="di-movers-hint" style="margin-top:4px">' + cur.year + ': <b>' + sgn(cur.tempDiff, 1, ' °C') + '</b> · ' + fill(t.rankT, { r: rank(rows, 'tempDiff', true), n: N }) + '</div></div>' +
      '<p class="di-movers-hint" style="margin-top:8px">' + t.histNote + '</p>' +
      '<details style="margin-top:8px"><summary style="cursor:pointer;font-size:13px">' + t.tableView + '</summary><div style="margin-top:8px">' + tbl + '</div></details></section>';
    document.getElementById('clima-sel-loc').onchange = function (e) { SEL.loc = e.target.value; histRender(); document.getElementById('clima-sel-loc').focus(); };
    document.getElementById('clima-sel-per').onchange = function (e) { SEL.period = e.target.value; histRender(); document.getElementById('clima-sel-per').focus(); };
  }
  function loadHist() {
    if (!document.getElementById('clima-hist')) return;
    fetch('data/climate-history.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (h) { if (h && h.locations && h.locations.length) { HIST = h; SEL.loc = h.locations[0].id; histRender(); } }).catch(function (e) {  });
  }
  function teaser() {
    var el = document.getElementById('home-clima'); if (!el || !DATA) return;
    var t = T[lang()] || T.es;
    var dry = pick(function (m) { return m.precipAnomalyPct; }, 1), wet = pick(function (m) { return m.precipAnomalyPct; }, -1), hot = pick(function (m) { return m.tempAnomalyC; }, -1);
    function cell(label, l, txt, color) { return '<div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)">' + label.toUpperCase() + '</div><div style="font-weight:600;margin:4px 0 2px">' + l.name + '</div><div style="font-size:22px;font-weight:700;color:' + color + '">' + txt + '</div></div>'; }
    el.innerHTML = '<div class="di-movers-head-row"><h2>' + t.teaserTitle + '</h2><span class="di-movers-hint">' + t.teaserHint + ' (' + DATA.lastPeriod + ')</span></div>' +
      '<div class="di-card" style="padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px">' +
      cell(t.driest, dry, sgn(last(dry).precipAnomalyPct, 0, ' %'), DRY) + cell(t.wettest, wet, sgn(last(wet).precipAnomalyPct, 0, ' %'), WET) + cell(t.hottest, hot, sgn(last(hot).tempAnomalyC, 1, ' °C'), HOT) + '</div>' +
      '<p class="di-movers-hint" style="margin-top:10px"><a href="clima.html">' + t.more + ' →</a> · NASA POWER</p>';
  }
  function render() { page(); teaser(); }
  var _first = true;
  if (!document.getElementById('clima-body') && !document.getElementById('home-clima')) return;
  if (document.getElementById('clima-body')) window.DehesaShared.init('informacion');
  fetch('data/climate.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) {
    if (!d || !d.locations || !d.locations.length) return;
    DATA = d; render(); loadHist();
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }).catch(function () {});
})();
