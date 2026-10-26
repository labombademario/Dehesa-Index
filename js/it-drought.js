/* Dehesa Index — Italia: sequía por provincia (107 provincias, NUTS 3) a partir del Indicador Combinado de Sequía del Observatorio Europeo de la Sequía (EDO).
   data/it-drought.json (scripts/update-it-drought.py). En sequia.html (#itsq) y en la pestaña «Sequía» de la ficha de Italia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Sequía en Italia por provincia', at: 'Última década del indicador: {d}', wa: 'Superficie con aviso o alerta de sequía', all: 'Superficie en sequía agrícola (vigilancia, aviso o alerta)', ly: 'Misma década del año pasado', map: 'Superficie con aviso o alerta por provincia', hint: 'Pasa el cursor o toca una provincia.', none: 'sin dato',
      cls: ['Sin sequía o en recuperación', 'Vigilancia', 'Aviso', 'Alerta'], idx: 'Reparto de la superficie de Italia', hist: 'Superficie de Italia con aviso o alerta, últimos 3 años', hover: 'Pasa el cursor por la gráfica.', tbl: 'Por provincia (de más a menos afectada)', prov: 'Provincia', hy: 'Hace un año', unit: '% de la superficie',
      note: 'El indicador combina tres señales cada 10 días: déficit de lluvia (vigilancia), déficit de humedad del suelo (aviso) y estrés de la vegetación visto desde satélite (alerta). La ficha del país lo da por 21 regiones; aquí Dehesa Index lo calcula para cada una de las 107 provincias. La superficie es toda la provincia, no solo la agrícola (en las de montaña pesa el monte), y el reparto nacional pondera cada provincia por sus celdas de 4 km. Es otra medida que la severidad hídrica de ISPRA de más arriba: no son comparables entre sí.', src: 'Fuente:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'provincias: Eurostat/GISCO (© EuroGeographics)' },
    en: { h: 'Drought in Italy by province', at: 'Latest dekad of the indicator: {d}', wa: 'Area under drought warning or alert', all: 'Area in agricultural drought (watch, warning or alert)', ly: 'Same dekad last year', map: 'Area under warning or alert by province', hint: 'Hover or tap a province.', none: 'no data',
      cls: ['No drought or recovering', 'Watch', 'Warning', 'Alert'], idx: 'Breakdown of Italy’s area', hist: 'Italian area under warning or alert, last 3 years', hover: 'Hover over the chart.', tbl: 'By province (most to least affected)', prov: 'Province', hy: 'A year ago', unit: '% of the area',
      note: 'The indicator combines three signals every 10 days: rainfall deficit (watch), soil-moisture deficit (warning) and vegetation stress seen from satellite (alert). The country page gives it for 21 regions; here Dehesa Index computes it for each of the 107 provinces. The area is the whole province, not just farmland (mountain provinces are mostly forest and rock), and the national breakdown weights each province by its 4 km cells. It is a different measure from the ISPRA water severity above: the two are not comparable.', src: 'Source:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'provinces: Eurostat/GISCO (© EuroGeographics)' },
    fr: { h: 'Sécheresse en Italie par province', at: 'Dernière décade de l’indicateur : {d}', wa: 'Surface en avertissement ou alerte de sécheresse', all: 'Surface en sécheresse agricole (vigilance, avertissement ou alerte)', ly: 'Même décade l’an dernier', map: 'Surface en avertissement ou alerte par province', hint: 'Survolez ou touchez une province.', none: 'pas de donnée',
      cls: ['Pas de sécheresse ou en rétablissement', 'Vigilance', 'Avertissement', 'Alerte'], idx: 'Répartition de la superficie de l’Italie', hist: 'Surface de l’Italie en avertissement ou alerte, 3 dernières années', hover: 'Survolez le graphique.', tbl: 'Par province (de la plus à la moins touchée)', prov: 'Province', hy: 'Il y a un an', unit: '% de la surface',
      note: 'L’indicateur combine trois signaux tous les 10 jours : déficit de pluie (vigilance), déficit d’humidité du sol (avertissement) et stress de la végétation vu par satellite (alerte). La fiche du pays le donne pour 21 régions ; ici Dehesa Index le calcule pour chacune des 107 provinces. La surface est celle de la province entière, pas seulement agricole (les provinces de montagne sont surtout forêt et roche), et la répartition nationale pondère chaque province par ses mailles de 4 km. C’est une autre mesure que la sévérité hydrique de l’ISPRA plus haut : elles ne sont pas comparables.', src: 'Source :', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'provinces : Eurostat/GISCO (© EuroGeographics)' },
    it: { h: 'Siccità in Italia per provincia', at: 'Ultima decade dell’indicatore: {d}', wa: 'Superficie in allerta o allarme siccità', all: 'Superficie in siccità agricola (attenzione, allerta o allarme)', ly: 'Stessa decade dell’anno scorso', map: 'Superficie in allerta o allarme per provincia', hint: 'Passa il cursore o tocca una provincia.', none: 'nessun dato',
      cls: ['Nessuna siccità o in recupero', 'Attenzione', 'Allerta', 'Allarme'], idx: 'Ripartizione della superficie dell’Italia', hist: 'Superficie italiana in allerta o allarme, ultimi 3 anni', hover: 'Passa il cursore sul grafico.', tbl: 'Per provincia (dalla più alla meno colpita)', prov: 'Provincia', hy: 'Un anno fa', unit: '% della superficie',
      note: 'L’indicatore combina tre segnali ogni 10 giorni: deficit di pioggia (attenzione), deficit di umidità del suolo (allerta) e stress della vegetazione visto da satellite (allarme). La scheda del paese lo dà per 21 regioni; qui Dehesa Index lo calcola per ciascuna delle 107 province. La superficie è quella dell’intera provincia, non solo agricola (nelle province di montagna pesano bosco e roccia), e la ripartizione nazionale pesa ogni provincia in base alle sue celle da 4 km. È una misura diversa dalla severità idrica dell’ISPRA qui sopra: le due non sono confrontabili.', src: 'Fonte:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'province: Eurostat/GISCO (© EuroGeographics)' }
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
    return { P: P, V: V, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.hist) + '</div><div class="wp-chart it-hchart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + Hh + '" class="wp-svg" role="img" aria-label="' + esc(t.hist) + '">' + g +
      '<path class="wp-line wp-line-t" d="' + p + '"/><line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (Hh - B) + '" style="display:none"/></svg><div class="wp-legend"><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' };
  }
  function bindH(el, c, t, lg) {
    var box = el.querySelector('.it-hchart'); if (!box || !c.P) return;
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
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/it-drought.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load('DEHESA_IT_PROVINCES', 'vendor/it-provinces.js')]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.counties || !D.periods || D.periods.length < 4) return false;
      var t = T[lg], P = D.periods, n = P.length, last = n - 1, vals = {}, k, ly = -1, tl = Date.parse(P[last]) - 365 * 864e5, bd = 1e12;
      for (k = 0; k < n; k++) { var dd = Math.abs(Date.parse(P[k]) - tl); if (dd < bd) { bd = dd; ly = k; } }
      if (bd > 6 * 864e5) ly = -1;
      for (k in D.counties) if (D.counties.hasOwnProperty(k)) vals[k] = wa(D.counties[k].v[last]);
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [10, 30, 50, 70], labels: ['< 10 %', '10–30 %', '30–50 %', '50–70 %', '≥ 70 %'], fmt: function (v) { return nf(v, lg, 1) + ' %'; }, label: t.map, none: t.none }) : null;
      var names = {}; if (MAP) MAP.states.forEach(function (s) { names[s.id] = nm(s.name); });
      var S = national(D, last), SL = ly >= 0 ? national(D, ly) : null, V = [], i;
      for (i = 0; i < n; i++) V.push(wa(national(D, i)));
      var rows = Object.keys(D.counties).sort(function (x, y) { return vals[y] - vals[x]; }).map(function (c) {
        var v = D.counties[c].v[last], h = ly >= 0 ? wa(D.counties[c].v[ly]) : null;
        return '<tr><th scope="row">' + esc(names[c] || nm(D.counties[c].name)) + '</th><td class="cof-n">' + nf(cl(v[0]), lg) + '</td><td class="cof-n">' + nf(cl(v[1]), lg) + '</td><td class="cof-n">' + nf(cl(v[2]), lg) + '</td><td class="cof-n"><b>' + nf(wa(v), lg) + '</b></td><td class="cof-n">' + (h == null ? '—' : nf(h, lg)) + '</td></tr>';
      }).join('');
      var hc = hchart(P, V, t, lg);
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="it-sq" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{d}', day(P[last], lg))) + '</p>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(t.wa, '<b>' + nf(wa(S), lg, 1) + ' %</b>') + row(t.all, nf(all3(S), lg, 1) + ' %') + (SL ? row(t.ly, nf(wa(SL), lg, 1) + ' % · ' + esc(dshort(P[ly], lg))) : '') + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map) + '</div><div class="wp-readout it-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html : '') + stack(S, t, lg) + hc.html +
        '<div class="di-info-card-title gb-sub">' + esc(t.tbl) + '</div><div style="overflow:auto;max-height:440px"><table class="cof-tbl" style="max-width:760px"><thead><tr><th scope="col">' + esc(t.prov) + '</th><th scope="col" class="cof-n">' + esc(t.cls[1]) + ' %</th><th scope="col" class="cof-n">' + esc(t.cls[2]) + ' %</th><th scope="col" class="cof-n">' + esc(t.cls[3]) + ' %</th><th scope="col" class="cof-n">' + esc(t.wa) + ' %</th><th scope="col" class="cof-n">' + esc(t.hy) + ' %</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>; ' + esc(t.srcB) + '</p></section>';
      if (mp) M.bind(el, el.querySelector('.it-tip'), t.hint, function (id) { var c = D.counties[id], nmn = names[id] || id; if (!c) return '<b>' + esc(nmn) + '</b> · ' + esc(t.none); var v = c.v[last]; return '<b>' + esc(nmn) + '</b> · ' + esc(t.wa) + ' ' + nf(wa(v), lg, 1) + ' % (' + esc(t.cls[2]) + ' ' + nf(cl(v[1]), lg) + ', ' + esc(t.cls[3]) + ' ' + nf(cl(v[2]), lg) + ')'; });
      bindH(el, hc, t, lg);
      return true;
    });
  }
  global.DIItDrought = { mount: mount };
  function auto() {
    var el = document.getElementById('itsq'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
