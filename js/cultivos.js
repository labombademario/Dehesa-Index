/* Dehesa Index — Estado de los cultivos (USDA NASS Crop Progress). Lee data/crop-progress.json. */
(function () {
  'use strict';
  var DATA = null, SEL = { crop: 'corn', season: null, stage: null };
  var CUR = '#2a6f97', PREV = '#b8651b', AVG = '#8a8578';
  var CLS = ['ve', 'p', 'f', 'g', 'e'], CLS_COL = ['#8a4a12', '#c98a4b', '#cfcac0', '#6fa3c0', '#1f5f88'];
  var ORDER = ['corn', 'soybeans', 'wheat_winter', 'wheat_spring', 'cotton'];
  var T = {
    es: { title: 'Estado de los cultivos', sub: 'Cómo van los cultivos de EE. UU. semana a semana: valoración y avance de siembra y cosecha. Datos oficiales de USDA NASS (Crop Progress).',
      crops: { corn: 'Maíz', soybeans: 'Soja', wheat_winter: 'Trigo de invierno', wheat_spring: 'Trigo de primavera', cotton: 'Algodón' }, crop: 'Cultivo', season: 'Campaña', week: 'Semana al', ge: 'Buena + excelente', wow: 'vs. semana anterior', yoy: 'vs. mismo momento del año pasado', avg: 'vs. media de 5 años',
      classes: { ve: 'Muy mala', p: 'Mala', f: 'Regular', g: 'Buena', e: 'Excelente' }, dist: 'Valoración de la superficie', geChart: 'Buena + excelente, semana a semana', progChart: 'Avance', stage: 'Etapa', thisSeason: 'Campaña', lastYear: 'Año pasado', avg5: 'Media 5 años', pp: 'pp',
      stages: { planted: 'Sembrado', emerged: 'Nacido', silking: 'Espigado (sedas)', dough: 'Grano lechoso-pastoso', dented: 'Grano dentado', mature: 'Maduro', harvested: 'Cosechado', blooming: 'Floración', setting_pods: 'Formación de vainas', dropping_leaves: 'Caída de hojas', headed: 'Espigado', squaring: 'Cuadros florales', setting_bolls: 'Formación de cápsulas', bolls_opening: 'Cápsulas abiertas' },
      table: 'Avance por etapa', states: 'Por estado', stName: 'Estado', prevW: 'Sem. ant.', none: 'Sin datos de este cultivo por ahora.', off: 'Fuera de temporada: el informe de valoración se publica aproximadamente de abril a noviembre.', latestW: 'Última semana con dato', mapLink: 'Ver en el mapa', dash: 'línea discontinua',
      caveat: 'Las cifras nacionales son el porcentaje de superficie en cada categoría según la encuesta semanal de NASS, que se publica los lunes por la tarde (hora de EE. UU.). La media de 5 años y la comparación con el año pasado son cálculo propio a partir de las mismas semanas de campañas anteriores, interpolando entre informes. La valoración es subjetiva (la dan corresponsales locales) y no es una previsión de cosecha ni de precios.', src: 'Fuente: USDA NASS, Crop Progress (Quick Stats). Este producto usa la API de NASS pero no está respaldado ni certificado por NASS. Más en', methodLink: 'Metodología', updated: 'Actualizado', home: 'Estado de los cultivos en EE. UU.', homeHint: 'Buena + excelente, última semana', more: 'Ver todos los cultivos', map: 'Mapa' },
    en: { title: 'Crop conditions', sub: 'How U.S. crops are doing week by week: condition ratings and planting and harvest progress. Official USDA NASS data (Crop Progress).',
      crops: { corn: 'Corn', soybeans: 'Soybeans', wheat_winter: 'Winter wheat', wheat_spring: 'Spring wheat', cotton: 'Cotton' }, crop: 'Crop', season: 'Season', week: 'Week ending', ge: 'Good + excellent', wow: 'vs. previous week', yoy: 'vs. same time last year', avg: 'vs. 5-year average',
      classes: { ve: 'Very poor', p: 'Poor', f: 'Fair', g: 'Good', e: 'Excellent' }, dist: 'Condition of the acreage', geChart: 'Good + excellent, week by week', progChart: 'Progress', stage: 'Stage', thisSeason: 'Season', lastYear: 'Last year', avg5: '5-year avg', pp: 'pp',
      stages: { planted: 'Planted', emerged: 'Emerged', silking: 'Silking', dough: 'Dough', dented: 'Dented', mature: 'Mature', harvested: 'Harvested', blooming: 'Blooming', setting_pods: 'Setting pods', dropping_leaves: 'Dropping leaves', headed: 'Headed', squaring: 'Squaring', setting_bolls: 'Setting bolls', bolls_opening: 'Bolls opening' },
      table: 'Progress by stage', states: 'By state', stName: 'State', prevW: 'Prev. wk', none: 'No data for this crop yet.', off: 'Off season: condition ratings are published roughly from April to November.', latestW: 'Latest week with data', mapLink: 'See on the map', dash: 'dashed line',
      caveat: 'National figures are the share of acreage in each category from NASS’s weekly survey, published Monday afternoons (U.S. time). The 5-year average and the year-ago comparison are our own calculation from the same weeks of earlier seasons, interpolating between reports. Ratings are subjective (given by local reporters) and are not a crop or price forecast.', src: 'Source: USDA NASS, Crop Progress (Quick Stats). This product uses the NASS API but is not endorsed or certified by NASS. More in', methodLink: 'Methodology', updated: 'Updated', home: 'U.S. crop conditions', homeHint: 'Good + excellent, latest week', more: 'See all crops', map: 'Map' },
    fr: { title: 'État des cultures', sub: 'Où en sont les cultures américaines semaine après semaine : notation et avancement des semis et des récoltes. Données officielles USDA NASS (Crop Progress).',
      crops: { corn: 'Maïs', soybeans: 'Soja', wheat_winter: 'Blé d’hiver', wheat_spring: 'Blé de printemps', cotton: 'Coton' }, crop: 'Culture', season: 'Campagne', week: 'Semaine au', ge: 'Bon + excellent', wow: 'vs. semaine précédente', yoy: 'vs. même moment l’an dernier', avg: 'vs. moyenne 5 ans',
      classes: { ve: 'Très mauvais', p: 'Mauvais', f: 'Moyen', g: 'Bon', e: 'Excellent' }, dist: 'État de la surface', geChart: 'Bon + excellent, semaine par semaine', progChart: 'Avancement', stage: 'Stade', thisSeason: 'Campagne', lastYear: 'Année dernière', avg5: 'Moyenne 5 ans', pp: 'pp',
      stages: { planted: 'Semé', emerged: 'Levé', silking: 'Soies', dough: 'Pâteux', dented: 'Denté', mature: 'Mûr', harvested: 'Récolté', blooming: 'Floraison', setting_pods: 'Formation des gousses', dropping_leaves: 'Chute des feuilles', headed: 'Épiaison', squaring: 'Boutons floraux', setting_bolls: 'Formation des capsules', bolls_opening: 'Capsules ouvertes' },
      table: 'Avancement par stade', states: 'Par État', stName: 'État', prevW: 'Sem. préc.', none: 'Pas encore de données pour cette culture.', off: 'Hors saison : la notation est publiée environ d’avril à novembre.', latestW: 'Dernière semaine avec données', mapLink: 'Voir sur la carte', dash: 'trait pointillé',
      caveat: 'Les chiffres nationaux sont la part de la surface dans chaque catégorie selon l’enquête hebdomadaire du NASS, publiée le lundi après-midi (heure américaine). La moyenne 5 ans et la comparaison avec l’an dernier sont un calcul propre à partir des mêmes semaines des campagnes précédentes, par interpolation. La notation est subjective (donnée par des correspondants locaux) et ne constitue pas une prévision de récolte ni de prix.', src: 'Source : USDA NASS, Crop Progress (Quick Stats). Ce produit utilise l’API du NASS mais n’est ni approuvé ni certifié par le NASS. Plus dans', methodLink: 'Méthodologie', updated: 'Mis à jour', home: 'État des cultures aux États-Unis', homeHint: 'Bon + excellent, dernière semaine', more: 'Voir toutes les cultures', map: 'Carte' },
    it: { title: 'Stato delle colture', sub: 'Come vanno le colture USA settimana dopo settimana: valutazione e avanzamento di semine e raccolti. Dati ufficiali USDA NASS (Crop Progress).',
      crops: { corn: 'Mais', soybeans: 'Soia', wheat_winter: 'Grano invernale', wheat_spring: 'Grano primaverile', cotton: 'Cotone' }, crop: 'Coltura', season: 'Campagna', week: 'Settimana al', ge: 'Buono + eccellente', wow: 'vs. settimana precedente', yoy: 'vs. stesso momento dell’anno scorso', avg: 'vs. media 5 anni',
      classes: { ve: 'Molto scarso', p: 'Scarso', f: 'Discreto', g: 'Buono', e: 'Eccellente' }, dist: 'Condizione della superficie', geChart: 'Buono + eccellente, settimana per settimana', progChart: 'Avanzamento', stage: 'Fase', thisSeason: 'Campagna', lastYear: 'Anno scorso', avg5: 'Media 5 anni', pp: 'pp',
      stages: { planted: 'Seminato', emerged: 'Emerso', silking: 'Sete', dough: 'Pastoso', dented: 'Dentato', mature: 'Maturo', harvested: 'Raccolto', blooming: 'Fioritura', setting_pods: 'Formazione baccelli', dropping_leaves: 'Caduta foglie', headed: 'Spigatura', squaring: 'Bottoni fiorali', setting_bolls: 'Formazione capsule', bolls_opening: 'Capsule aperte' },
      table: 'Avanzamento per fase', states: 'Per Stato', stName: 'Stato', prevW: 'Sett. prec.', none: 'Ancora nessun dato per questa coltura.', off: 'Fuori stagione: la valutazione è pubblicata circa da aprile a novembre.', latestW: 'Ultima settimana con dati', mapLink: 'Vedi sulla mappa', dash: 'linea tratteggiata',
      caveat: 'I dati nazionali sono la quota di superficie in ogni categoria secondo l’indagine settimanale del NASS, pubblicata il lunedì pomeriggio (ora USA). La media 5 anni e il confronto con l’anno scorso sono un calcolo proprio dalle stesse settimane delle campagne precedenti, con interpolazione. La valutazione è soggettiva (data da corrispondenti locali) e non è una previsione di raccolto né di prezzi.', src: 'Fonte: USDA NASS, Crop Progress (Quick Stats). Questo prodotto usa l’API del NASS ma non è approvato né certificato dal NASS. Altro in', methodLink: 'Metodologia', updated: 'Aggiornato', home: 'Stato delle colture USA', homeHint: 'Buono + eccellente, ultima settimana', more: 'Vedi tutte le colture', map: 'Mappa' }
  };
  function lang() { return window.DehesaShared.getLang(); }
  function t() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); } catch (e) { return v.toFixed(d || 0); } }
  function sg(v, d, u) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d || 0) + (u || ''); }
  function dfmt(iso, withYear) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined, timeZone: 'UTC' }); } catch (e) { return iso; } }
  function crop(id) { for (var i = 0; i < DATA.crops.length; i++) if (DATA.crops[i].id === id) return DATA.crops[i]; return null; }
  function isWinter(id) { return id === 'wheat_winter'; }
  function anchor(id, season) { return isWinter(id) ? Date.UTC(season - 1, 8, 1) : Date.UTC(season, 0, 1); }
  function off(id, season, iso) { var p = iso.split('-'); return Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - anchor(id, season)) / 86400000); }
  function ge(row) { return row[4] + row[5]; }
  // serie [[offset, valor]] de una campaña
  function condSeries(c, s) { var S = c.seasons[s]; return S ? S.condition.map(function (r) { return [off(c.id, s, r[0]), ge(r), r[0]]; }) : []; }
  function progSeries(c, s, st) { var S = c.seasons[s]; var a = S && S.progress[st]; return a ? a.map(function (r) { return [off(c.id, s, r[0]), r[1], r[0], r[1] >= 99 ? 'done' : '']; }) : []; }
  function at(ser, x) { // interpolación lineal; null fuera del rango publicado
    if (!ser.length || x < ser[0][0]) return null;
    if (x > ser[ser.length - 1][0]) return ser[ser.length - 1][1] >= 99 && ser[ser.length - 1][3] === 'done' ? ser[ser.length - 1][1] : null;
    for (var i = 0; i < ser.length; i++) { if (ser[i][0] === x) return ser[i][1]; if (ser[i][0] > x) { var a = ser[i - 1], b = ser[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } }
    return null;
  }
  function seasonsWithCond(c) { return Object.keys(c.seasons).filter(function (y) { return c.seasons[y].condition.length; }).map(Number).sort(function (a, b) { return a - b; }); }
  function avg5(c, s, x, mk) { var v = [], k; for (k = 1; k <= 5; k++) { var val = at(mk(c, s - k), x); if (val !== null) v.push(val); } return v.length >= 4 ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null; }

  function lineChart(id, series, xTicks) {
    var W = 640, H = 220, L = 40, R = 14, Tp = 12, B = 26, all = [], xs = [];
    series.forEach(function (s) { s.pts.forEach(function (p) { all.push(p[1]); xs.push(p[0]); }); });
    if (!all.length) return '';
    var mn = 0, mx = Math.max(10, Math.ceil(Math.max.apply(null, all) / 10) * 10), x0 = Math.min.apply(null, xTicks.map(function (k) { return k[0]; })), x1 = Math.max.apply(null, xTicks.map(function (k) { return k[0]; }));
    var X = function (v) { return L + (v - x0) / (x1 - x0) * (W - L - R); }, Y = function (v) { return Tp + (mx - v) / (mx - mn) * (H - Tp - B); }, g = '', k;
    for (k = 0; k <= 4; k++) { var gv = mn + (mx - mn) * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(gv) + '" y2="' + Y(gv) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (Y(gv) + 4) + '" text-anchor="end" font-size="10.5" fill="var(--text-faint)">' + nf(gv) + ' %</text>'; }
    xTicks.forEach(function (tk) { g += '<text x="' + X(tk[0]) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10.5" fill="var(--text-faint)">' + esc(tk[1]) + '</text>'; });
    series.forEach(function (s) {
      var d = s.pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ');
      g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.w || 2) + '"' + (s.dash ? ' stroke-dasharray="5 4"' : '') + ' stroke-linejoin="round"/>';
      if (s.end && s.pts.length) { var lp = s.pts[s.pts.length - 1]; g += '<circle cx="' + X(lp[0]) + '" cy="' + Y(lp[1]) + '" r="4" fill="' + s.color + '" stroke="var(--surface,#fff)" stroke-width="2"/>'; }
    });
    var lg = '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;margin:6px 0">' + series.map(function (s) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:16px;height:0;border-top:' + (s.dash ? '2px dashed ' : '3px solid ') + s.color + ';display:inline-block"></span>' + esc(s.name) + '</span>'; }).join('') + '</div>';
    return '<div style="position:relative">' + lg + '<svg id="' + id + '" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;touch-action:pan-y" role="img" aria-label="' + esc(series.map(function (s) { return s.name; }).join(', ')) + '">' + g + '<line class="xh" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" stroke="var(--text-faint)" stroke-dasharray="3 3" style="display:none"/><rect class="hit" x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '" fill="transparent"/></svg><div class="tip" style="display:none;position:absolute;top:30px;pointer-events:none;background:var(--surface,#fff);border:1px solid var(--border);border-radius:6px;padding:6px 9px;font-size:12.5px;box-shadow:0 2px 8px rgba(0,0,0,.12);white-space:nowrap"></div></div>';
  }
  function wire(id, series, xTicks, season, c) {
    var svg = document.getElementById(id); if (!svg) return;
    var box = svg.parentNode, tip = box.querySelector('.tip'), xh = svg.querySelector('.xh'), W = 640, L = 40, R = 14;
    var x0 = Math.min.apply(null, xTicks.map(function (k) { return k[0]; })), x1 = Math.max.apply(null, xTicks.map(function (k) { return k[0]; }));
    function move(e) {
      var pt = e.touches ? e.touches[0] : e, r = svg.getBoundingClientRect(), fx = (pt.clientX - r.left) / r.width * W;
      var x = Math.round(x0 + (fx - L) / (W - L - R) * (x1 - x0)); x = Math.max(x0, Math.min(x1, x));
      var xx = L + (x - x0) / (x1 - x0) * (W - L - R); xh.setAttribute('x1', xx); xh.setAttribute('x2', xx); xh.style.display = '';
      var d = new Date(anchor(c.id, season) + x * 86400000);
      tip.innerHTML = '<strong>' + esc(d.toLocaleDateString(lang(), { day: 'numeric', month: 'short', timeZone: 'UTC' })) + '</strong>' + series.map(function (s) { var v = at(s.pts, x); return '<br><span style="color:' + s.color + '">●</span> ' + esc(s.name) + ': ' + (v === null ? '—' : nf(v, 0) + ' %'); }).join('');
      tip.style.display = 'block'; var left = xx / W * r.width + 10; if (left + tip.offsetWidth > r.width) left = xx / W * r.width - tip.offsetWidth - 10; tip.style.left = Math.max(0, left) + 'px';
    }
    var hit = svg.querySelector('.hit'); hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', move); hit.addEventListener('touchmove', move);
    hit.addEventListener('mouseleave', function () { tip.style.display = 'none'; xh.style.display = 'none'; });
  }
  function monthTicks(id, season) { var a = anchor(id, season), out = [[0, ''], [364, '']], m0 = isWinter(id) ? 8 : 0, y0 = isWinter(id) ? season - 1 : season, step = isWinter(id) ? 2 : 1, i; for (i = 0; i < 12; i += step) { var d = Date.UTC(y0, m0 + i, 1), o = Math.round((d - a) / 86400000); if (o > 0 && o < 355) out.push([o, new Date(d).toLocaleDateString(lang(), { month: 'short', timeZone: 'UTC' })]); } return out; }

  function rangeTicks(ticks, seriesArr) {
    var lo = 1e9, hi = -1e9; seriesArr.forEach(function (q) { q.pts.forEach(function (p) { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); }); });
    if (lo > hi) return ticks; lo = Math.max(0, lo - 4); hi = Math.min(364, hi + 4);
    return [[lo, ''], [hi, '']].concat(ticks.filter(function (k) { return k[1] && k[0] > lo + 6 && k[0] < hi - 6; }));
  }
  function latestInfo(c) {
    var ss = seasonsWithCond(c); if (!ss.length) return null;
    var s = ss[ss.length - 1], cond = c.seasons[s].condition, last = cond[cond.length - 1], prev = cond.length > 1 ? cond[cond.length - 2] : null, x = off(c.id, s, last[0]);
    var yo = at(condSeries(c, s - 1), x), av = avg5(c, s, x, condSeries);
    return { season: s, last: last, prev: prev, geNow: ge(last), wow: prev ? ge(last) - ge(prev) : null, yoy: yo === null ? null : ge(last) - yo, avg: av === null ? null : ge(last) - av, x: x };
  }
  function delta(label, v) { return '<div style="font-size:12.5px;color:var(--text-faint)">' + (v === null ? '' : '<strong style="color:var(--text)">' + sg(v, 0, ' ' + t().pp) + '</strong> ' + esc(label)) + '</div>'; }

  function page() {
    var x = t(), c = crop(SEL.crop) || crop(ORDER[0]);
    document.title = 'Dehesa Index — ' + x.title; document.getElementById('pg-h1').textContent = x.title; document.getElementById('pg-sub').textContent = x.sub;
    var cropsHave = ORDER.filter(function (id) { return crop(id); });
    var ss = seasonsWithCond(c);
    if (!ss.length) { document.getElementById('cu-body').innerHTML = '<p class="di-movers-hint">' + x.none + '</p>'; return; }
    if (ss.indexOf(SEL.season) < 0) SEL.season = ss[ss.length - 1];
    var s = SEL.season, cond = c.seasons[s].condition, isLatest = s === ss[ss.length - 1];
    var wk = cond.length - 1, last = cond[wk], prev = wk ? cond[wk - 1] : null, xo = off(c.id, s, last[0]);
    var yo = at(condSeries(c, s - 1), xo), av = avg5(c, s, xo, condSeries);
    var copts = cropsHave.map(function (id) { return '<option value="' + id + '"' + (id === c.id ? ' selected' : '') + '>' + esc(x.crops[id]) + '</option>'; }).join('');
    var sopts = ss.slice().reverse().map(function (y) { return '<option value="' + y + '"' + (y === s ? ' selected' : '') + '>' + y + '</option>'; }).join('');
    var ctr = '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px"><label style="font-size:13px">' + x.crop + '<br><select id="cu-c" class="di-compare-select">' + copts + '</select></label><label style="font-size:13px">' + x.season + '<br><select id="cu-s" class="di-compare-select">' + sopts + '</select></label></div>';
    // titular + distribución
    var dist = '<div style="display:flex;height:22px;border-radius:4px;overflow:hidden;gap:2px;margin:10px 0 6px" role="img" aria-label="' + esc(x.dist) + '">' + CLS.map(function (k, i) { return '<div title="' + esc(x.classes[k]) + ' ' + last[i + 1] + ' %" style="flex:' + Math.max(last[i + 1], 0.0001) + ';background:' + CLS_COL[i] + '"></div>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px">' + CLS.map(function (k, i) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + CLS_COL[i] + ';display:inline-block"></span>' + esc(x.classes[k]) + ' <strong>' + last[i + 1] + ' %</strong></span>'; }).join('') + '</div>';
    var head = '<div class="di-card" style="padding:20px;margin-bottom:8px"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px"><div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)">' + esc(x.ge.toUpperCase()) + ' · ' + esc(x.week) + ' ' + esc(dfmt(last[0], true)) + '</div><div style="font-family:\'Source Serif 4\',serif;font-size:34px;font-weight:600;margin:4px 0 2px">' + nf(ge(last)) + ' %</div></div><div>' +
      delta(x.wow, prev ? ge(last) - ge(prev) : null) + delta(x.yoy, yo === null ? null : ge(last) - yo) + delta(x.avg, av === null ? null : ge(last) - av) + '</div></div>' + dist + '</div>' +
      (isLatest && DATA.lastWeekEnding && last[0] < DATA.lastWeekEnding && daysBetween(last[0], DATA.lastWeekEnding) > 21 ? '<p class="di-movers-hint">' + esc(x.off) + '</p>' : '');
    // gráfico valoración
    var ticks = monthTicks(c.id, s), sers = [{ name: x.thisSeason + ' ' + s, color: CUR, w: 2.5, end: true, pts: condSeries(c, s) }, { name: x.lastYear + ' (' + (s - 1) + ')', color: PREV, pts: condSeries(c, s - 1) }];
    var avgPts = []; condSeries(c, s).forEach(function (p) { var v = avg5(c, s, p[0], condSeries); if (v !== null) avgPts.push([p[0], v]); });
    // la media se dibuja sobre todo el rango de semanas de la campaña anterior para no recortarla
    var avgPts2 = []; condSeries(c, s - 1).concat(condSeries(c, s)).map(function (p) { return p[0]; }).sort(function (a, b) { return a - b; }).filter(function (v, i, a) { return !i || v !== a[i - 1]; }).forEach(function (o) { var v = avg5(c, s, o, condSeries); if (v !== null) avgPts2.push([o, v]); });
    sers = sers.filter(function (q) { return q.pts.length; }); if (avgPts2.length) sers.push({ name: x.avg5, color: AVG, dash: true, pts: avgPts2 });
    var ticks1 = rangeTicks(ticks, sers), ch1 = lineChart('cu-ch1', sers, ticks1);
    // progreso
    var stages = Object.keys(c.seasons[s].progress); if (!stages.length) { var ps = Object.keys(c.seasons).sort().reverse(); for (var i = 0; i < ps.length && !stages.length; i++) stages = Object.keys(c.seasons[ps[i]].progress); }
    var pref = ['planted', 'emerged', 'blooming', 'headed', 'silking', 'squaring', 'dough', 'setting_pods', 'setting_bolls', 'dented', 'bolls_opening', 'mature', 'dropping_leaves', 'harvested'];
    stages.sort(function (a, b) { return pref.indexOf(a) - pref.indexOf(b); });
    if (stages.indexOf(SEL.stage) < 0) { var bestD = '', best = stages[0]; stages.forEach(function (k) { var a = c.seasons[s].progress[k]; var d = a && a.length ? a[a.length - 1][0] : ''; if (d >= bestD && d) { bestD = d; best = k; } }); SEL.stage = best; }
    var stOpts = stages.map(function (k) { return '<option value="' + k + '"' + (k === SEL.stage ? ' selected' : '') + '>' + esc(x.stages[k] || k) + '</option>'; }).join('');
    var st = SEL.stage, ps1 = progSeries(c, s, st), psers = [{ name: x.thisSeason + ' ' + s, color: CUR, w: 2.5, end: true, pts: ps1 }, { name: x.lastYear + ' (' + (s - 1) + ')', color: PREV, pts: progSeries(c, s - 1, st) }].filter(function (q) { return q.pts.length; });
    var mkp = function (cc, ss2) { return progSeries(cc, ss2, st); };
    var offs = []; psers.forEach(function (q) { q.pts.forEach(function (p) { offs.push(p[0]); }); }); offs = offs.sort(function (a, b) { return a - b; }).filter(function (v, i, a) { return !i || v !== a[i - 1]; });
    var apts = []; offs.forEach(function (o) { var v = avg5(c, s, o, mkp); if (v !== null) apts.push([o, v]); }); if (apts.length) psers.push({ name: x.avg5, color: AVG, dash: true, pts: apts });
    var ticks2 = rangeTicks(ticks, psers), ch2 = psers.length ? lineChart('cu-ch2', psers, ticks2) : '';
    // tabla de etapas
    var rows = stages.map(function (k) {
      var ser = progSeries(c, s, k); if (!ser.length) return '';
      var l = ser[ser.length - 1], yv = at(progSeries(c, s - 1, k), l[0]), av2 = avg5(c, s, l[0], function (cc, ss2) { return progSeries(cc, ss2, k); });
      return '<tr style="border-top:1px solid var(--border)"><td style="padding:9px 6px;font-weight:600">' + esc(x.stages[k] || k) + '</td><td style="padding:9px 6px;text-align:right;white-space:nowrap">' + nf(l[1]) + ' %</td><td style="padding:9px 6px;text-align:right;color:var(--text-faint)">' + (yv === null ? '—' : nf(yv, 0) + ' %') + '</td><td style="padding:9px 6px;text-align:right;color:var(--text-faint)">' + (av2 === null ? '—' : nf(av2, 0) + ' %') + '</td><td style="padding:9px 6px;text-align:right;font-weight:600">' + (av2 === null ? '—' : sg(l[1] - av2, 0, ' ' + x.pp)) + '</td><td style="padding:9px 6px;color:var(--text-faint);white-space:nowrap">' + esc(dfmt(l[2])) + '</td></tr>';
    }).join('');
    var tbl = '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + esc(x.stage.toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + s + '</th><th style="padding:10px 6px;text-align:right">' + esc(x.lastYear.toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + esc(x.avg5.toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + esc(x.avg.toUpperCase()) + '</th><th style="padding:10px 6px">' + esc(x.week.toUpperCase()) + '</th></tr>' + rows + '</table></div>';
    // estados (solo campaña más reciente)
    var stRows = '';
    if (isLatest) {
      var list = Object.keys(c.states).map(function (k) { var a = c.states[k], l = a[a.length - 1], p = a.length > 1 ? a[a.length - 2] : null; return { k: k, we: l.we, ge: l.g + l.e, d: p ? l.g + l.e - (p.g + p.e) : null }; }).filter(function (r) { return r.we >= shiftDate(last[0], -35); }).sort(function (a, b) { return b.ge - a.ge; });
      stRows = list.length ? '<h2 style="margin:26px 0 10px">' + esc(x.states) + '</h2><div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + esc(x.stName.toUpperCase()) + '</th><th></th><th style="padding:10px 6px;text-align:right">' + esc(x.ge.toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + esc(x.wow.toUpperCase()) + '</th><th style="padding:10px 6px">' + esc(x.week.toUpperCase()) + '</th></tr>' +
        list.map(function (r) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px;font-weight:600">' + esc(r.k) + '</td><td style="padding:8px 6px;width:34%"><div style="height:8px;border-radius:2px 4px 4px 2px;background:' + CLS_COL[4] + ';width:' + r.ge + '%"></div></td><td style="padding:8px 6px;text-align:right">' + nf(r.ge) + ' %</td><td style="padding:8px 6px;text-align:right;color:var(--text-faint)">' + (r.d === null ? '—' : sg(r.d, 0, ' ' + x.pp)) + '</td><td style="padding:8px 6px;color:var(--text-faint);white-space:nowrap">' + esc(dfmt(r.we)) + '</td></tr>'; }).join('') + '</table></div>' : '';
    }
    document.getElementById('cu-body').innerHTML = ctr + head +
      '<p class="di-movers-hint" style="margin-top:6px">' + esc(x.updated) + ': ' + esc(dfmt(DATA.lastWeekEnding, true)) + ' · <a href="mapa.html">' + esc(x.mapLink) + ' →</a> · <a href="clima.html">' + esc(T[lang()] === T.es ? 'Clima agrícola' : lang() === 'en' ? 'Agricultural climate' : lang() === 'fr' ? 'Climat agricole' : 'Clima agricolo') + ' →</a></p>' +
      '<h2 style="margin:20px 0 10px">' + esc(x.geChart) + '</h2><div class="di-card" style="padding:14px 18px">' + ch1 + '</div>' +
      '<h2 style="margin:26px 0 10px">' + esc(x.progChart) + '</h2><div class="di-card" style="padding:14px 18px"><label style="font-size:13px">' + esc(x.stage) + ' <select id="cu-st" class="di-compare-select">' + stOpts + '</select></label>' + ch2 + '</div>' +
      '<h2 style="margin:26px 0 10px">' + esc(x.table) + '</h2>' + tbl + stRows +
      '<p class="di-info-api-notice" style="margin:18px 0 10px">' + esc(x.caveat) + '</p><p class="di-movers-hint">' + esc(x.src) + ' <a href="metodologia.html#cultivos">' + esc(x.methodLink) + '</a>.</p>';
    document.getElementById('cu-c').onchange = function (e) { SEL.crop = e.target.value; SEL.season = null; SEL.stage = null; page(); };
    document.getElementById('cu-s').onchange = function (e) { SEL.season = parseInt(e.target.value, 10); page(); };
    var stEl = document.getElementById('cu-st'); if (stEl) stEl.onchange = function (e) { SEL.stage = e.target.value; page(); };
    if (ch1) wire('cu-ch1', sers, ticks1, s, c); if (ch2) wire('cu-ch2', psers, ticks2, s, c);
  }
  function shiftDate(iso, days) { var p = iso.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) + days * 86400000).toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

  function teaser() {
    var el = document.getElementById('home-cultivos'); if (!el || !DATA) return;
    var x = t(), cells = '';
    ['corn', 'soybeans', 'wheat_spring', 'cotton'].forEach(function (id) {
      var c = crop(id); if (!c) return; var i = latestInfo(c); if (!i) return;
      cells += '<div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)">' + esc(x.crops[id].toUpperCase()) + '</div><div style="font-family:\'Source Serif 4\',serif;font-size:26px;font-weight:600;margin:4px 0 2px">' + nf(i.geNow) + ' %</div><div style="font-size:12.5px;color:var(--text-faint)">' + (i.yoy === null ? '' : sg(i.yoy, 0, ' ' + x.pp) + ' ' + esc(x.yoy)) + '<br>' + esc(dfmt(i.last[0])) + '</div></div>';
    });
    if (!cells) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="di-movers-head-row"><h2>' + esc(x.home) + '</h2><span class="di-movers-hint">' + esc(x.homeHint) + '</span></div><div class="di-card" style="padding:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:20px">' + cells + '</div><p class="di-movers-hint" style="margin-top:10px"><a href="cultivos.html">' + esc(x.more) + ' →</a> · <a href="mapa.html">' + esc(x.map) + '</a> · USDA NASS</p>';
  }
  var isPage = !!document.getElementById('cu-body');
  if (!isPage && !document.getElementById('home-cultivos')) return;
  if (isPage) window.DehesaShared.init('informacion');
  fetch('data/crop-progress.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) {
    if (!d || !d.crops || !d.crops.length) throw Error('x'); DATA = d;
    if (isPage) page(); teaser();
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); if (isPage) page(); teaser(); };
  }).catch(function () { if (isPage) document.getElementById('cu-body').innerHTML = '<p class="di-movers-hint">' + t().none + '</p>'; });
})();
