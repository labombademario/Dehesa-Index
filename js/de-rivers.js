/* Dehesa Index — Alemania: nivel del agua de los rios de navegacion (Rin, Meno, Mosela, Neckar, Weser, Elba y Danubio), PEGELONLINE de la WSV (DL-DE-Zero-2.0).
   data/de-rivers.json (scripts/update-de-rivers.py) y vendor/de-rivers-map.js (scripts/build-de-rivers-map.py). Mismo formato que los embalses de España (js/embalses.js):
   mapa con un punto por estación, tabla ordenable y gráfico. En sequia.html (#derivers) y en la pestaña «Sequía» de la ficha de Alemania (js/country-drought.js).
   Lo mostrado es la lectura actual, el estado y las referencias oficiales de la WSV; la media diaria, la serie propia y las variaciones son cálculo de Dehesa Index. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Ríos alemanes: nivel del agua', s: 'Nivel de las estaciones de la Administración federal de vías navegables en el Rin, el Meno, la Mosela, el Neckar, el Weser, el Elba y el Danubio, comparado con la media de cada estación. Con el río bajo las barcazas cargan menos y el flete de cereal y abonos sube.',
      at: 'Última lectura {t} (hora de Alemania).', mh: 'Mapa de estaciones', mhint: 'Cada punto es una estación; el color es el estado que publica la WSV. Pasa el cursor o toca un punto para ver cuál es; pulsa una estación en la tabla para ver su gráfico.',
      cnt: '{a} estaciones en el mapa', legend: 'Estado', lv: { low: 'bajo', normal: 'normal', high: 'alto', none: 'sin estado' },
      cols: ['Estación', 'Nivel (cm)', 'Estado', 'Frente a la media (cm)', 'Variación 7 días (cm)', 'Caudal (m³/s)'], rv: { Rhein: 'Rin', Main: 'Meno', Mosel: 'Mosela', Neckar: 'Neckar', Weser: 'Weser', Elbe: 'Elba', Donau: 'Danubio' },
      cd: 'Nivel, media diaria', mw: 'Media {a}–{b}', mnw: 'Mínimo medio {a}–{b}', ax: 'cm', ref: 'Media {a}–{b}',
      glw: 'En el Rin, el nivel equivalente de aguas bajas (GlW) de Kaub es {v} cm.', since: 'La serie diaria empieza el {d} y crece cada día: la API solo ofrece los últimos 30 días, así que aún no hay comparación con el año pasado ni con una media de varios años.',
      note: 'Datos brutos de la Administración federal de vías navegables (WSV), sin revisar. El nivel es la lectura de la escala de cada estación (no la profundidad del cauce). «Estado» es el que publica la WSV: bajo = por debajo de la media de los niveles mínimos (MNW), alto = por encima de la media de los máximos (MHW). La media y el mínimo medio son valores de referencia oficiales de cada estación para el periodo indicado. La media diaria (días con al menos el 80 % de las lecturas) y la variación a 7 días son cálculo de Dehesa Index. Un nivel puede quedar por debajo del mínimo medio e incluso del mínimo de referencia; esto no es un aviso de navegación.',
      src: 'Fuente: WSV, PEGELONLINE (datos brutos, DL-DE-Zero-2.0).', mean: 'media' },
    en: { h: 'German rivers: water level', s: 'Level at the Federal Waterways and Shipping Administration gauges on the Rhine, Main, Moselle, Neckar, Weser, Elbe and Danube, against each gauge’s mean. At low water barges load less and freight for grain and fertiliser rises.',
      at: 'Latest reading {t} (German time).', mh: 'Gauge map', mhint: 'Each dot is a gauge; the colour is the status WSV publishes. Hover or tap a dot to see which one it is; select a gauge in the table to see its chart.',
      cnt: '{a} gauges on the map', legend: 'Status', lv: { low: 'low', normal: 'normal', high: 'high', none: 'no status' },
      cols: ['Gauge', 'Level (cm)', 'Status', 'Versus mean (cm)', '7-day change (cm)', 'Discharge (m³/s)'], rv: { Rhein: 'Rhine', Main: 'Main', Mosel: 'Moselle', Neckar: 'Neckar', Weser: 'Weser', Elbe: 'Elbe', Donau: 'Danube' },
      cd: 'Level, daily mean', mw: 'Mean {a}–{b}', mnw: 'Mean low {a}–{b}', ax: 'cm', ref: 'Mean {a}–{b}',
      glw: 'On the Rhine, the equivalent low-water level (GlW) at Kaub is {v} cm.', since: 'The daily series starts on {d} and grows every day: the API only offers the last 30 days, so there is no comparison with last year or a multi-year mean yet.',
      note: 'Raw, unrevised data from Germany’s Federal Waterways and Shipping Administration (WSV). Level is the reading on each gauge’s scale (not the depth of the channel). “Status” is the one WSV publishes: low = below the mean of the low-water levels (MNW), high = above the mean of the high-water levels (MHW). The mean and the mean low are official reference values for each gauge over the period shown. The daily mean (days with at least 80% of the readings) and the 7-day change are Dehesa Index calculations. A level can fall below the mean low and even below the reference minimum; this is not a navigation warning.',
      src: 'Source: WSV, PEGELONLINE (raw data, DL-DE-Zero-2.0).', mean: 'mean' },
    fr: { h: 'Fleuves allemands : niveau de l’eau', s: 'Niveau aux stations de l’Administration fédérale des voies navigables sur le Rhin, le Main, la Moselle, le Neckar, le Weser, l’Elbe et le Danube, comparé à la moyenne de chaque station. À l’étiage, les barges chargent moins et le fret de céréales et d’engrais monte.',
      at: 'Dernière mesure {t} (heure allemande).', mh: 'Carte des stations', mhint: 'Chaque point est une station ; la couleur est l’état publié par la WSV. Survolez ou touchez un point pour l’identifier ; choisissez une station dans le tableau pour voir son graphique.',
      cnt: '{a} stations sur la carte', legend: 'État', lv: { low: 'bas', normal: 'normal', high: 'haut', none: 'sans état' },
      cols: ['Station', 'Niveau (cm)', 'État', 'Par rapport à la moyenne (cm)', 'Variation 7 jours (cm)', 'Débit (m³/s)'], rv: { Rhein: 'Rhin', Main: 'Main', Mosel: 'Moselle', Neckar: 'Neckar', Weser: 'Weser', Elbe: 'Elbe', Donau: 'Danube' },
      cd: 'Niveau, moyenne journalière', mw: 'Moyenne {a}–{b}', mnw: 'Minimum moyen {a}–{b}', ax: 'cm', ref: 'Moyenne {a}–{b}',
      glw: 'Sur le Rhin, le niveau équivalent d’étiage (GlW) de Kaub est de {v} cm.', since: 'La série journalière commence le {d} et s’allonge chaque jour : l’API ne donne que les 30 derniers jours, il n’y a donc pas encore de comparaison avec l’an dernier ni avec une moyenne pluriannuelle.',
      note: 'Données brutes de l’Administration fédérale des voies navigables (WSV), non révisées. Le niveau est la lecture de l’échelle de chaque station (pas la profondeur du chenal). L’« état » est celui que publie la WSV : bas = sous la moyenne des niveaux minimaux (MNW), haut = au-dessus de la moyenne des maximaux (MHW). La moyenne et le minimum moyen sont des valeurs de référence officielles de chaque station pour la période indiquée. La moyenne journalière (jours avec au moins 80 % des mesures) et la variation sur 7 jours sont des calculs de Dehesa Index. Un niveau peut passer sous le minimum moyen, voire sous le minimum de référence ; ce n’est pas un avis à la batellerie.',
      src: 'Source : WSV, PEGELONLINE (données brutes, DL-DE-Zero-2.0).', mean: 'moyenne' },
    it: { h: 'Fiumi tedeschi: livello dell’acqua', s: 'Livello alle stazioni dell’Amministrazione federale delle vie navigabili su Reno, Meno, Mosella, Neckar, Weser, Elba e Danubio, rispetto alla media di ogni stazione. Con il fiume basso le chiatte caricano meno e il nolo di cereali e concimi sale.',
      at: 'Ultima lettura {t} (ora tedesca).', mh: 'Mappa delle stazioni', mhint: 'Ogni punto è una stazione; il colore è lo stato pubblicato dalla WSV. Passa il cursore o tocca un punto per vedere quale sia; scegli una stazione nella tabella per vederne il grafico.',
      cnt: '{a} stazioni sulla mappa', legend: 'Stato', lv: { low: 'basso', normal: 'normale', high: 'alto', none: 'senza stato' },
      cols: ['Stazione', 'Livello (cm)', 'Stato', 'Rispetto alla media (cm)', 'Variazione 7 giorni (cm)', 'Portata (m³/s)'], rv: { Rhein: 'Reno', Main: 'Meno', Mosel: 'Mosella', Neckar: 'Neckar', Weser: 'Weser', Elbe: 'Elba', Donau: 'Danubio' },
      cd: 'Livello, media giornaliera', mw: 'Media {a}–{b}', mnw: 'Minimo medio {a}–{b}', ax: 'cm', ref: 'Media {a}–{b}',
      glw: 'Sul Reno, il livello equivalente di magra (GlW) a Kaub è {v} cm.', since: 'La serie giornaliera inizia il {d} e cresce ogni giorno: l’API offre solo gli ultimi 30 giorni, quindi non c’è ancora un confronto con l’anno scorso né con una media pluriennale.',
      note: 'Dati grezzi dell’Amministrazione federale delle vie navigabili (WSV), non rivisti. Il livello è la lettura dell’asta di ogni stazione (non la profondità dell’alveo). Lo «stato» è quello pubblicato dalla WSV: basso = sotto la media dei livelli minimi (MNW), alto = sopra la media dei massimi (MHW). La media e il minimo medio sono valori di riferimento ufficiali di ogni stazione per il periodo indicato. La media giornaliera (giorni con almeno l’80 % delle letture) e la variazione a 7 giorni sono calcoli di Dehesa Index. Un livello può scendere sotto il minimo medio e perfino sotto il minimo di riferimento; non è un avviso alla navigazione.',
      src: 'Fonte: WSV, PEGELONLINE (dati grezzi, DL-DE-Zero-2.0).', mean: 'media' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, COL = { low: '#c0541d', normal: '#3d7fb8', high: '#1b4f7d', none: '#b5b0a2' };
  var D = null, SEL = null, MAPL = 0, CUR = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d, lg) { try { return Number(v).toLocaleString(LOC[lg], { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return Number(v).toFixed(d); } }
  function sg(v, lg) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 0, lg); }
  function day(s, lg) { var q = String(s).slice(0, 10).split('-'); try { return new Intl.DateTimeFormat(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+q[0], +q[1] - 1, +q[2]))); } catch (e) { return s; } }
  function when(s, lg) { return day(s, lg) + ', ' + String(s).slice(11, 16); }
  function ts(s) { var q = String(s).split('-'); return Date.UTC(+q[0], +q[1] - 1, +q[2]); }
  function stName(s, t) { return (t.rv[s.river] || s.river) + ' · ' + s.name; }
  function st(x) { return x.w.state || 'none'; }
  function ago7(x) {
    var p = x.points, n = p.length; if (n < 8) return null; var want = ts(p[n - 1][0]) - 7 * 864e5;
    for (var i = n - 2; i >= 0; i--) { var d = ts(p[i][0]); if (d === want) return p[n - 1][1] - p[i][1]; if (d < want) return null; }
    return null;
  }
  function mapHtml(t) {
    var G = global.DEHESA_DE_RIVER_MAP; if (!G) return '';
    var P = G.proj, S = D.stations.filter(function (x) { return x.lon != null && x.lat != null; });
    var regs = G.regions.map(function (g) { return '<path d="' + g.d + '" fill="var(--surface-2,#f1eee6)" stroke="var(--border,#d9d3c4)" stroke-width="0.8"/>'; }).join('');
    var rvs = G.rivers.map(function (r) { return '<path d="' + r.d + '" fill="none" stroke="#9bb7d4" stroke-width="' + (r.major ? 1.6 : 0.9) + '" stroke-linejoin="round" stroke-linecap="round"/>'; }).join('');
    var dots = S.map(function (x) {
      var cx = (x.lon - P.lon0) * P.c * P.k, cy = (P.lat0 - x.lat) * P.k, on = x.id === SEL;
      return '<circle class="der-dot" data-id="' + esc(x.id) + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (on ? 8 : 6) + '" fill="' + COL[st(x)] + '" stroke="' + (on ? 'var(--text,#222)' : 'var(--surface,#fff)') + '" stroke-width="' + (on ? 2.5 : 1.2) + '"/>';
    }).join('');
    var key = ['low', 'normal', 'high', 'none'].map(function (k) { return '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px"><i style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' + COL[k] + ';border:1px solid var(--border)"></i>' + esc(t.lv[k]) + '</span>'; }).join('');
    return '<h3 style="margin:14px 0 4px;font-size:15px">' + esc(t.mh) + '</h3><p class="cof-note" style="margin:0 0 8px">' + esc(t.mhint) + '</p>' +
      '<div class="di-card der-map" style="padding:10px 12px;position:relative;max-width:560px"><div class="der-tip cof-note" aria-live="polite" style="min-height:2.6em;margin:0 0 6px">' + esc(t.cnt.replace('{a}', S.length)) + '</div>' +
      '<svg viewBox="' + G.viewBox + '" role="img" aria-label="' + esc(t.mh) + '" style="width:100%;height:auto;display:block;touch-action:manipulation">' + regs + rvs + dots + '</svg>' +
      '<div class="cof-note" style="margin-top:6px"><strong>' + esc(t.legend) + ':</strong> ' + key + '</div></div>';
  }
  function tipText(x, t, lg) {
    var r = x.ref.MW != null ? x.w.value - x.ref.MW : null;
    return '<strong>' + esc(stName(x, t)) + '</strong> · ' + esc(t.lv[st(x)]) + '<br><strong>' + nf(x.w.value, 0, lg) + ' cm</strong>' + (r != null ? ' (' + sg(r, lg) + ' cm ' + esc(t.mean) + ')' : '') + (x.q ? ' · ' + nf(x.q.value, 0, lg) + ' m³/s' : '');
  }
  function chartHtml(x, t, lg) {
    var pts = x.points.map(function (p) { return { x: ts(p[0]), y: p[1], l: day(p[0], lg) }; }); if (pts.length < 2 || !global.DehesaChart || !global.DehesaChart.render) return '';
    var pp = x.ref.period || ['', ''], x0 = pts[0].x, x1 = pts[pts.length - 1].x, ser = [{ name: t.cd, color: '#2a6f97', pts: pts }];
    if (x.ref.MW != null) ser.push({ name: t.mw.replace('{a}', pp[0]).replace('{b}', pp[1]), color: '#6b8e7a', dash: true, pts: [{ x: x0, y: x.ref.MW, l: '' }, { x: x1, y: x.ref.MW, l: '' }] });
    if (x.ref.MNW != null) ser.push({ name: t.mnw.replace('{a}', pp[0]).replace('{b}', pp[1]), color: '#b8651b', dash: true, pts: [{ x: x0, y: x.ref.MNW, l: '' }, { x: x1, y: x.ref.MNW, l: '' }] });
    return '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(stName(x, t)) + '</h3><div>' + global.DehesaChart.render({ series: ser, xMode: 'time', yTitle: t.ax, aria: t.cd + ' · ' + stName(x, t), legend: true, vFmt: function (v) { return nf(v, 0, lg); } }) + '</div>';
  }
  function loadMap() {
    if (MAPL) return; MAPL = 1;
    var s = document.createElement('script'); s.src = 'vendor/de-rivers-map.js?v=20261026'; s.onload = function () { if (CUR) render(CUR.el, CUR.lg); }; document.head.appendChild(s);
  }
  function render(el, lg) {
    var t = T[lg] || T.es, S = D.stations; CUR = { el: el, lg: lg };
    if (!SEL || !S.some(function (x) { return x.id === SEL; })) SEL = (S.filter(function (x) { return x.id === 'kaub'; })[0] || S[0]).id;
    var cur = S.filter(function (x) { return x.id === SEL; })[0];
    var rows = S.map(function (x) {
      var d = x.ref.MW != null ? x.w.value - x.ref.MW : null, c7 = ago7(x), s = st(x), per = x.ref.period ? ' title="' + esc(t.ref.replace('{a}', x.ref.period[0]).replace('{b}', x.ref.period[1])) + '"' : '';
      return '<tr style="' + (x.id === SEL ? 'background:rgba(29,81,120,.06)' : '') + '"><th scope="row"><button type="button" class="der-b" data-id="' + esc(x.id) + '" style="all:unset;cursor:pointer;font-weight:600">' + esc(stName(x, t)) + '</button></th>' +
        '<td class="cof-n" data-v="' + x.w.value + '"><strong>' + nf(x.w.value, 0, lg) + '</strong></td><td class="cof-n" data-v="' + ['low', 'normal', 'high', 'none'].indexOf(s) + '"><span style="font-weight:600;color:' + (s === 'low' ? '#b3501a' : s === 'high' ? '#1b4f7d' : 'inherit') + '">' + esc(t.lv[s]) + '</span></td>' +
        '<td class="cof-n"' + per + (d != null ? ' data-v="' + d + '"' : '') + '>' + sg(d, lg) + '</td><td class="cof-n"' + (c7 != null ? ' data-v="' + c7 + '"' : '') + '>' + sg(c7, lg) + '</td><td class="cof-n der-q" data-v="' + (x.q ? x.q.value : '') + '">' + (x.q ? nf(x.q.value, 0, lg) : '—') + '</td></tr>';
    }).join('');
    var head = t.cols.map(function (c, i) { return '<th scope="col"' + (i ? ' class="cof-n' + (i === 5 ? ' der-q' : '') + '"' : '') + '>' + esc(c) + '</th>'; }).join('');
    var kaub = S.filter(function (x) { return x.id === 'kaub'; })[0], glw = kaub && kaub.ref.GlW != null ? '<p class="cof-note" style="margin:8px 0 0">' + esc(t.glw.replace('{v}', nf(kaub.ref.GlW, 0, lg))) + '</p>' : '';
    var since = cur.first ? '<p class="cof-note" style="margin:8px 0 0">' + esc(t.since.replace('{d}', day(cur.first, lg))) + '</p>' : '';
    var cite = global.DICite && global.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + global.DICite.html('pegelonline', { period: D.latestTime.slice(0, 10) }) + '</div>' : '';
    el.innerHTML = '<style>@media(max-width:520px){.cof-tbl .der-q{display:none!important}}</style><h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.s) + ' ' + esc(t.at.replace('{t}', when(D.latestTime, lg))) + '</p>' + mapHtml(t) +
      '<div class="di-card" style="padding:6px 14px;overflow-x:auto;margin-top:14px"><table class="cof-tbl"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      chartHtml(cur, t, lg) + glw + since + '<p class="cof-note" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="cof-note" style="margin:6px 0 0">' + esc(t.src) + '</p>' + cite;
    Array.prototype.forEach.call(el.querySelectorAll('.der-b'), function (b) { b.onclick = function () { SEL = b.getAttribute('data-id'); render(el, lg); }; });
    var box = el.querySelector('.der-map');
    if (box) {
      var tip = box.querySelector('.der-tip'), svg = box.querySelector('svg'), base = tip.innerHTML;
      var by = function (id) { return S.filter(function (x) { return x.id === id; })[0]; };
      svg.addEventListener('mouseover', function (e) { if (e.target.classList && e.target.classList.contains('der-dot')) tip.innerHTML = tipText(by(e.target.getAttribute('data-id')), t, lg); });
      svg.addEventListener('mouseleave', function () { tip.innerHTML = base; });
      svg.addEventListener('click', function (e) {
        var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, px = (e.clientX - r.left) / r.width * vb.width, py = (e.clientY - r.top) / r.height * vb.height, best = null, bd = 1e9;
        Array.prototype.forEach.call(svg.querySelectorAll('.der-dot'), function (c) { var dx = c.cx.baseVal.value - px, dy = c.cy.baseVal.value - py, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = c; } });
        if (best && bd < 600) { SEL = best.getAttribute('data-id'); render(el, lg); }
      });
    }
    if (!global.DEHESA_DE_RIVER_MAP) loadMap();
  }
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    var p = D ? Promise.resolve(D) : fetch('data/de-rivers.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return p.then(function (d) { if (!d || !d.stations || d.stations.length < 3) return false; D = d; render(el, lg); return true; });
  }
  global.DIDeRivers = { mount: mount };
  function auto() {
    var el = document.getElementById('derivers'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
