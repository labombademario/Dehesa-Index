/* Dehesa Index — Austria: sequía por Land (SPEI de GeoSphere Austria, WINFORE) y estado de las aguas subterráneas (BMLUK).
   data/at-drought.json (scripts/update-at-drought.py). En sequia.html (#atsq) y en la pestaña «Sequía» de la ficha de Austria. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Sequía en Austria: balance hídrico y aguas subterráneas', at: 'Datos del {d}', s90: 'Balance hídrico de 90 días (SPEI90), media de Austria', s30: 'Balance hídrico de 30 días (SPEI30)', dry: 'Superficie seca o peor (SPEI90 ≤ −1)', map: 'SPEI90 medio por Land', hint: 'Pasa el cursor o toca un Land.', none: 'sin dato', idx: 'Superficie de Austria por clase', b90: '90 días (SPEI90)', b30: '30 días (SPEI30)', cl: { normal: 'Normal o húmedo', dry: 'Seco', veryDry: 'Muy seco', extreme: 'Extremadamente seco' }, tbl: 'Por Land', land: 'Land', vd: 'Muy seco o peor (SPEI90)', gw: 'Aguas subterráneas bajas o muy bajas', gwH: 'Aguas subterráneas: nivel de las estaciones', gwC: { veryLow: 'Muy bajo', low: 'Bajo', normal: 'Normal', high: 'Alto', veryHigh: 'Muy alto' }, st: 'estaciones', hist: 'SPEI90 medio de Austria, últimos dos años', hover: 'Pasa el cursor o toca el gráfico.', wet: 'húmedo', dryL: 'seco',
      note: 'El SPEI compara la lluvia con la evaporación potencial de los últimos 30 o 90 días y la expresa en desviaciones respecto a lo normal de cada lugar: por debajo de −1 es seco, de −1,5 muy seco y de −2 extremadamente seco. GeoSphere Austria lo calcula cada día en una rejilla de 1 km (WINFORE); Dehesa Index lo promedia por Land. El nivel de las aguas subterráneas es el de las estaciones con teletransmisión del servicio hidrográfico (BMLUK), con la clase de color de su mapa oficial; el informe mensual del ministerio de septiembre de 2026 situaba casi el 90 % de las estaciones en niveles bajos o muy bajos.', src: 'Fuentes:', srcA: 'GeoSphere Austria, WINFORE (CC BY 4.0)', srcB: 'BMLUK, Grundwasser Aktuell (CC BY 4.0)' },
    en: { h: 'Drought in Austria: water balance and groundwater', at: 'Data for {d}', s90: '90-day water balance (SPEI90), Austrian average', s30: '30-day water balance (SPEI30)', dry: 'Area dry or worse (SPEI90 ≤ −1)', map: 'Mean SPEI90 by Land', hint: 'Hover or tap a Land.', none: 'no data', idx: 'Area of Austria by class', b90: '90 days (SPEI90)', b30: '30 days (SPEI30)', cl: { normal: 'Normal or wet', dry: 'Dry', veryDry: 'Very dry', extreme: 'Extremely dry' }, tbl: 'By Land', land: 'Land', vd: 'Very dry or worse (SPEI90)', gw: 'Groundwater low or very low', gwH: 'Groundwater: level at monitoring stations', gwC: { veryLow: 'Very low', low: 'Low', normal: 'Normal', high: 'High', veryHigh: 'Very high' }, st: 'stations', hist: 'Austrian mean SPEI90, last two years', hover: 'Hover or tap the chart.', wet: 'wet', dryL: 'dry',
      note: 'SPEI compares rainfall with potential evaporation over the last 30 or 90 days and expresses it in deviations from what is normal at each place: below −1 is dry, below −1.5 very dry and below −2 extremely dry. GeoSphere Austria computes it every day on a 1 km grid (WINFORE); Dehesa Index averages it by Land. Groundwater levels come from the hydrographic service’s telemetry stations (BMLUK), with the colour class of its official map; the ministry’s monthly report for September 2026 put almost 90 % of stations at low or very low levels.', src: 'Sources:', srcA: 'GeoSphere Austria, WINFORE (CC BY 4.0)', srcB: 'BMLUK, Grundwasser Aktuell (CC BY 4.0)' },
    fr: { h: 'Sécheresse en Autriche : bilan hydrique et nappes', at: 'Données du {d}', s90: 'Bilan hydrique sur 90 jours (SPEI90), moyenne autrichienne', s30: 'Bilan hydrique sur 30 jours (SPEI30)', dry: 'Surface sèche ou pire (SPEI90 ≤ −1)', map: 'SPEI90 moyen par Land', hint: 'Survolez ou touchez un Land.', none: 'pas de donnée', idx: 'Surface de l’Autriche par classe', b90: '90 jours (SPEI90)', b30: '30 jours (SPEI30)', cl: { normal: 'Normal ou humide', dry: 'Sec', veryDry: 'Très sec', extreme: 'Extrêmement sec' }, tbl: 'Par Land', land: 'Land', vd: 'Très sec ou pire (SPEI90)', gw: 'Nappes basses ou très basses', gwH: 'Nappes : niveau aux stations', gwC: { veryLow: 'Très bas', low: 'Bas', normal: 'Normal', high: 'Haut', veryHigh: 'Très haut' }, st: 'stations', hist: 'SPEI90 moyen de l’Autriche, deux dernières années', hover: 'Survolez ou touchez le graphique.', wet: 'humide', dryL: 'sec',
      note: 'Le SPEI compare la pluie à l’évaporation potentielle des 30 ou 90 derniers jours et l’exprime en écarts à la normale de chaque lieu : sous −1 c’est sec, sous −1,5 très sec et sous −2 extrêmement sec. GeoSphere Austria le calcule chaque jour sur une grille de 1 km (WINFORE) ; Dehesa Index en fait la moyenne par Land. Le niveau des nappes est celui des stations télétransmises du service hydrographique (BMLUK), avec la classe de couleur de sa carte officielle ; le rapport mensuel du ministère de septembre 2026 plaçait près de 90 % des stations à des niveaux bas ou très bas.', src: 'Sources :', srcA: 'GeoSphere Austria, WINFORE (CC BY 4.0)', srcB: 'BMLUK, Grundwasser Aktuell (CC BY 4.0)' },
    it: { h: 'Siccità in Austria: bilancio idrico e falde', at: 'Dati del {d}', s90: 'Bilancio idrico a 90 giorni (SPEI90), media austriaca', s30: 'Bilancio idrico a 30 giorni (SPEI30)', dry: 'Superficie secca o peggio (SPEI90 ≤ −1)', map: 'SPEI90 medio per Land', hint: 'Passa il cursore o tocca un Land.', none: 'nessun dato', idx: 'Superficie dell’Austria per classe', b90: '90 giorni (SPEI90)', b30: '30 giorni (SPEI30)', cl: { normal: 'Normale o umido', dry: 'Secco', veryDry: 'Molto secco', extreme: 'Estremamente secco' }, tbl: 'Per Land', land: 'Land', vd: 'Molto secco o peggio (SPEI90)', gw: 'Falde basse o molto basse', gwH: 'Falde: livello alle stazioni', gwC: { veryLow: 'Molto basso', low: 'Basso', normal: 'Normale', high: 'Alto', veryHigh: 'Molto alto' }, st: 'stazioni', hist: 'SPEI90 medio dell’Austria, ultimi due anni', hover: 'Passa il cursore o tocca il grafico.', wet: 'umido', dryL: 'secco',
      note: 'Lo SPEI confronta la pioggia con l’evaporazione potenziale degli ultimi 30 o 90 giorni e la esprime in scarti dalla norma di ogni luogo: sotto −1 è secco, sotto −1,5 molto secco e sotto −2 estremamente secco. GeoSphere Austria lo calcola ogni giorno su una griglia di 1 km (WINFORE); Dehesa Index ne fa la media per Land. Il livello delle falde è quello delle stazioni in telemisura del servizio idrografico (BMLUK), con la classe di colore della sua mappa ufficiale; il rapporto mensile del ministero di settembre 2026 indicava quasi il 90 % delle stazioni su livelli bassi o molto bassi.', src: 'Fonti:', srcA: 'GeoSphere Austria, WINFORE (CC BY 4.0)', srcB: 'BMLUK, Grundwasser Aktuell (CC BY 4.0)' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc, ORD = ['normal', 'dry', 'veryDry', 'extreme'], GWO = ['veryLow', 'low', 'normal', 'high', 'veryHigh'];
  function day(iso, lg) { return iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—'; }
  function nf(v, lg, d) { return v == null ? '—' : (v < 0 ? '−' : '') + Math.abs(v).toLocaleString(LOC[lg], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function shares(s) { return { normal: 100 - s.dry, dry: s.dry - s.veryDry, veryDry: s.veryDry - s.extreme, extreme: s.extreme }; }
  function stack(lab, s, t, lg) {
    var S = shares(s);
    return '<div class="be-stk"><div class="be-stk-l">' + esc(lab) + '</div><div class="be-stk-b" role="img" aria-label="' + esc(lab + ': ' + ORD.map(function (k) { return t.cl[k] + ' ' + nf(S[k], lg, 1) + ' %'; }).join(', ')) + '">' +
      ORD.map(function (k, i) { var v = Math.max(0, S[k]); return v > 0 ? '<span class="be-s' + i + '" style="width:' + v + '%" title="' + esc(t.cl[k] + ': ' + nf(v, lg, 1) + ' %') + '">' + (v >= 9 ? nf(v, lg) + ' %' : '') + '</span>' : ''; }).join('') + '</div></div>';
  }
  function hchart(H, t, lg) {
    if (H.length < 3) return { html: '' };
    var W = 560, Hh = 200, L = 34, R = 8, Tp = 10, B = 24, t0 = Date.parse(H[0].date), t1 = Date.parse(H[H.length - 1].date), lo = -3, hi = 3;
    H.forEach(function (h) { lo = Math.min(lo, Math.floor(h.spei90)); hi = Math.max(hi, Math.ceil(h.spei90)); });
    var X = function (iso) { return L + (Date.parse(iso) - t0) / Math.max(1, t1 - t0) * (W - L - R); }, Y = function (v) { return Tp + (hi - v) / (hi - lo) * (Hh - Tp - B); }, g = '', p = '', v, k;
    for (v = lo; v <= hi; v++) g += '<line class="wp-grid' + (v === 0 ? ' at-zero' : '') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + nf(v, lg) + '</text>';
    g += '<rect class="at-dryband" x="' + L + '" y="' + Y(-1).toFixed(1) + '" width="' + (W - L - R) + '" height="' + (Y(lo) - Y(-1)).toFixed(1) + '"/>';
    var y0 = parseInt(H[0].date.slice(0, 4), 10), y1 = parseInt(H[H.length - 1].date.slice(0, 4), 10);
    for (var yy = y0; yy <= y1; yy++) for (var mm = 0; mm < 12; mm += 6) { var iso = yy + '-' + (mm < 9 ? '0' : '') + (mm + 1) + '-01', xx = Date.parse(iso); if (xx > t0 && xx < t1) g += '<line class="wp-grid wp-grid-v" x1="' + X(iso).toFixed(1) + '" x2="' + X(iso).toFixed(1) + '" y1="' + Tp + '" y2="' + (Hh - B) + '"/><text class="wp-tick" x="' + X(iso).toFixed(1) + '" y="' + (Hh - 7) + '" text-anchor="middle">' + esc(new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { month: 'short', year: '2-digit', timeZone: 'UTC' })) + '</text>'; }
    for (k = 0; k < H.length; k++) p += (k ? 'L' : 'M') + X(H[k].date).toFixed(1) + ' ' + Y(H[k].spei90).toFixed(1);
    return { H: H, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.hist) + '</div><div class="wp-chart at-hchart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + Hh + '" class="wp-svg" role="img" aria-label="' + esc(t.hist) + '">' + g + '<path class="wp-line wp-line-t" d="' + p + '"/><line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (Hh - B) + '" style="display:none"/></svg></div>' };
  }
  function bindH(el, c, t, lg) {
    var box = el.querySelector('.at-hchart'); if (!box || !c.H) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross');
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, b = 0, bd = 1e9;
      for (var k = 0; k < c.H.length; k++) { var dd = Math.abs(c.X(c.H[k].date) - vx); if (dd < bd) { bd = dd; b = k; } }
      var h = c.H[b], px = c.X(h.date); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + esc(day(h.date, lg)) + '</b> · SPEI90 <b>' + nf(h.spei90, lg, 2) + '</b> · ' + esc(t.dry) + ' ' + nf(h.dry90, lg) + ' %';
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/at-drought.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load('DEHESA_AT_LAENDER', 'vendor/at-laender.js')]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.lands || !D.austria) return false;
      var t = T[lg], A = D.austria, vals = {}, k, G = D.groundwater;
      for (k in D.lands) if (D.lands.hasOwnProperty(k) && D.lands[k].spei90) vals[k] = -D.lands[k].spei90.mean;
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [0, 1, 1.5, 2], labels: ['> 0', '0 … −1', '−1 … ' + nf(-1.5, lg, 1), nf(-1.5, lg, 1) + ' … −2', '≤ −2'], fmt: function (v) { return 'SPEI90 ' + nf(-v, lg, 2); }, label: t.map, none: t.none }) : null;
      var names = mp ? mp.names : {};
      var rows = Object.keys(D.lands).sort(function (x, y) { return D.lands[x].spei90.mean - D.lands[y].spei90.mean; }).map(function (c) {
        var l = D.lands[c], g = G && G.lands && G.lands[c], gn = 0, gl = 0, q;
        if (g) for (q in g) if (g.hasOwnProperty(q)) { gn += g[q]; if (q === 'low' || q === 'veryLow') gl += g[q]; }
        return '<tr><th scope="row">' + esc(names[c] || c) + '</th><td class="cof-n">' + nf(l.spei90.mean, lg, 2) + '</td><td class="cof-n">' + nf(l.spei90.veryDry, lg) + ' %</td><td class="cof-n">' + nf(l.spei30.mean, lg, 2) + '</td><td class="cof-n">' + (gn ? gl + ' / ' + gn : '—') + '</td></tr>';
      }).join('');
      var gwh = '';
      if (G) { var tot = 0; GWO.forEach(function (c) { tot += G.classes[c] || 0; });
        gwh = '<div class="di-info-card-title gb-sub">' + esc(t.gwH) + ' · ' + esc(day(G.date, lg)) + '</div><div class="be-stk"><div class="be-stk-l">' + nf(tot, lg) + ' ' + esc(t.st) + '</div><div class="be-stk-b">' +
          GWO.map(function (c, i) { var n = G.classes[c] || 0, w = tot ? n / tot * 100 : 0; return n ? '<span class="at-g' + i + '" style="width:' + w.toFixed(1) + '%" title="' + esc(t.gwC[c] + ': ' + n) + '">' + (w >= 8 ? n : '') + '</span>' : ''; }).join('') + '</div></div>' +
          '<div class="wp-legend">' + GWO.filter(function (c) { return G.classes[c]; }).map(function (c) { return '<span><i class="wp-sw at-g' + GWO.indexOf(c) + '"></i>' + esc(t.gwC[c]) + ' (' + G.classes[c] + ')</span>'; }).join('') + '</div>'; }
      var hc = hchart(D.history || [], t, lg);
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="at-sq" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{d}', day(D.asOf, lg))) + '</p>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(t.s90, '<b>' + nf(A.spei90.mean, lg, 2) + '</b>') + row(t.dry, '<b>' + nf(A.spei90.dry, lg) + ' %</b>') + row(t.s30, nf(A.spei30.mean, lg, 2)) + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map) + '</div><div class="wp-readout at-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html : '') +
        '<div class="di-info-card-title gb-sub">' + esc(t.idx) + '</div>' + stack(t.b90, A.spei90, t, lg) + stack(t.b30, A.spei30, t, lg) + '<div class="wp-legend">' + ORD.map(function (c, i) { return '<span><i class="wp-sw be-s' + i + '"></i>' + esc(t.cl[c]) + '</span>'; }).join('') + '</div>' +
        gwh + '<div class="di-info-card-title gb-sub">' + esc(t.tbl) + '</div><div style="overflow-x:auto"><table class="cof-tbl" style="max-width:760px"><thead><tr><th scope="col">' + esc(t.land) + '</th><th scope="col" class="cof-n">SPEI90</th><th scope="col" class="cof-n">' + esc(t.vd) + '</th><th scope="col" class="cof-n">SPEI30</th><th scope="col" class="cof-n">' + esc(t.gw) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + hc.html +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>; <a href="https://www.data.gv.at/" target="_blank" rel="noopener noreferrer">' + esc(t.srcB) + '</a></p></section>';
      if (mp) M.bind(el, el.querySelector('.at-tip'), t.hint, function (id) { var l = D.lands[id], nm = names[id] || id; return '<b>' + esc(nm) + '</b> · ' + (l ? 'SPEI90 ' + nf(l.spei90.mean, lg, 2) + ' · ' + esc(t.vd) + ' ' + nf(l.spei90.veryDry, lg) + ' %' : esc(t.none)); });
      bindH(el, hc, t, lg);
      return true;
    });
  }
  global.DIAtDrought = { mount: mount };
  function auto() {
    var el = document.getElementById('atsq'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
