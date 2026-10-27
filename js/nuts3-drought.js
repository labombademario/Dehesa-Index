/* Dehesa Index — Sequía por provincia/condado (unidades NUTS 3) de 14 países: DE FR DK SE FI CZ HU RO BG SK SI LT LV EE.
   Indicador Combinado de Sequía del Observatorio Europeo de la Sequía (EDO, CC BY 4.0) calculado por scripts/update-eu-drought-nuts3.py
   -> data/eu-drought-nuts3/<CC>.json; contornos vendor/nuts3/<cc>.js (Eurostat/GISCO). En sequia.html (#n3sq, con selector de país) y en la pestaña «Sequía» de cada ficha. ES5. */
(function (global) {
  'use strict';
  var C = { // país: [es, en, fr, it, unidad es, en, fr, it]
    DE: ['Alemania', 'Germany', 'Allemagne', 'Germania', 'distrito (Kreis)', 'district (Kreis)', 'district (Kreis)', 'distretto (Kreis)'],
    FR: ['Francia', 'France', 'France', 'Francia', 'departamento', 'département', 'département', 'dipartimento'],
    DK: ['Dinamarca', 'Denmark', 'Danemark', 'Danimarca', 'región (landsdel)', 'region (landsdel)', 'région (landsdel)', 'regione (landsdel)'],
    SE: ['Suecia', 'Sweden', 'Suède', 'Svezia', 'condado (län)', 'county (län)', 'comté (län)', 'contea (län)'],
    FI: ['Finlandia', 'Finland', 'Finlande', 'Finlandia', 'región (maakunta)', 'region (maakunta)', 'région (maakunta)', 'regione (maakunta)'],
    CZ: ['Chequia', 'Czechia', 'Tchéquie', 'Cechia', 'región (kraj)', 'region (kraj)', 'région (kraj)', 'regione (kraj)'],
    HU: ['Hungría', 'Hungary', 'Hongrie', 'Ungheria', 'condado (megye)', 'county (megye)', 'comitat (megye)', 'contea (megye)'],
    RO: ['Rumanía', 'Romania', 'Roumanie', 'Romania', 'provincia (județ)', 'county (județ)', 'județ', 'distretto (județ)'],
    BG: ['Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria', 'provincia (oblast)', 'province (oblast)', 'oblast', 'provincia (oblast)'],
    SK: ['Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia', 'región (kraj)', 'region (kraj)', 'région (kraj)', 'regione (kraj)'],
    SI: ['Eslovenia', 'Slovenia', 'Slovénie', 'Slovenia', 'región estadística', 'statistical region', 'région statistique', 'regione statistica'],
    LT: ['Lituania', 'Lithuania', 'Lituanie', 'Lituania', 'condado (apskritis)', 'county (apskritis)', 'comté (apskritis)', 'contea (apskritis)'],
    LV: ['Letonia', 'Latvia', 'Lettonie', 'Lettonia', 'región estadística', 'statistical region', 'région statistique', 'regione statistica'],
    EE: ['Estonia', 'Estonia', 'Estonie', 'Estonia', 'región', 'region', 'région', 'regione'] };
  var ORDER = ['DE', 'FR', 'RO', 'BG', 'SE', 'FI', 'HU', 'CZ', 'SK', 'SI', 'DK', 'LT', 'LV', 'EE'], LI = { es: 0, en: 1, fr: 2, it: 3 };
  var T = {
    es: { h: '{c}: sequía por {u}', pick: 'País', at: 'Última década del indicador: {d}', wa: 'Superficie con aviso o alerta de sequía', all: 'Superficie en sequía agrícola (vigilancia, aviso o alerta)', ly: 'Misma década del año pasado', map: 'Superficie con aviso o alerta por {u}', hint: 'Pasa el cursor o toca una unidad.', none: 'sin dato',
      cls: ['Sin sequía o en recuperación', 'Vigilancia', 'Aviso', 'Alerta'], idx: 'Reparto de la superficie de {c}', hist: 'Superficie de {c} con aviso o alerta, últimos 3 años', hover: 'Pasa el cursor por la gráfica.', tbl: 'Por {u}', prov: 'Unidad', hy: 'Hace un año', unit: '% de la superficie', more: 'Ver las {n} unidades', less: 'Ver solo las {n} más afectadas',
      near: 'El asterisco marca unidades más pequeñas que unas pocas celdas de 4 km (ciudades, islas): su valor es el de las celdas vecinas.',
      note: 'El indicador combina tres señales cada 10 días: déficit de lluvia (vigilancia), déficit de humedad del suelo (aviso) y estrés de la vegetación visto desde satélite (alerta). Dehesa Index lo calcula para cada unidad NUTS 3 de Eurostat; la ficha del país solo lo da por regiones mayores (NUTS 2). La superficie es toda la unidad, no solo la agrícola, y el reparto nacional pondera cada unidad por sus celdas de 4 km. Es un indicador europeo común: el servicio meteorológico o hidrológico de cada país puede medir la sequía con otros métodos.', src: 'Fuente:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'unidades: Eurostat/GISCO (© EuroGeographics)' },
    en: { h: '{c}: drought by {u}', pick: 'Country', at: 'Latest dekad of the indicator: {d}', wa: 'Area under drought warning or alert', all: 'Area in agricultural drought (watch, warning or alert)', ly: 'Same dekad last year', map: 'Area under warning or alert by {u}', hint: 'Hover or tap a unit.', none: 'no data',
      cls: ['No drought or recovering', 'Watch', 'Warning', 'Alert'], idx: 'Breakdown of the area of {c}', hist: 'Area of {c} under warning or alert, last 3 years', hover: 'Hover over the chart.', tbl: 'By {u}', prov: 'Unit', hy: 'A year ago', unit: '% of the area', more: 'Show all {n} units', less: 'Show only the {n} most affected',
      near: 'An asterisk marks units smaller than a few 4 km cells (cities, islands): their value is that of the neighbouring cells.',
      note: 'The indicator combines three signals every 10 days: rainfall deficit (watch), soil-moisture deficit (warning) and vegetation stress seen from satellite (alert). Dehesa Index computes it for each Eurostat NUTS 3 unit; the country page only gives it for larger regions (NUTS 2). The area is the whole unit, not just farmland, and the national breakdown weights each unit by its 4 km cells. This is a common European indicator: each country’s weather or hydrological service may measure drought with other methods.', src: 'Source:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'units: Eurostat/GISCO (© EuroGeographics)' },
    fr: { h: '{c} : sécheresse par {u}', pick: 'Pays', at: 'Dernière décade de l’indicateur : {d}', wa: 'Surface en avertissement ou alerte de sécheresse', all: 'Surface en sécheresse agricole (vigilance, avertissement ou alerte)', ly: 'Même décade l’an dernier', map: 'Surface en avertissement ou alerte par {u}', hint: 'Survolez ou touchez une unité.', none: 'pas de donnée',
      cls: ['Pas de sécheresse ou en rétablissement', 'Vigilance', 'Avertissement', 'Alerte'], idx: 'Répartition de la superficie de {c}', hist: 'Surface de {c} en avertissement ou alerte, 3 dernières années', hover: 'Survolez le graphique.', tbl: 'Par {u}', prov: 'Unité', hy: 'Il y a un an', unit: '% de la surface', more: 'Voir les {n} unités', less: 'Voir seulement les {n} plus touchées',
      near: 'L’astérisque marque les unités plus petites que quelques mailles de 4 km (villes, îles) : leur valeur est celle des mailles voisines.',
      note: 'L’indicateur combine trois signaux tous les 10 jours : déficit de pluie (vigilance), déficit d’humidité du sol (avertissement) et stress de la végétation vu par satellite (alerte). Dehesa Index le calcule pour chaque unité NUTS 3 d’Eurostat ; la fiche du pays ne le donne que pour de plus grandes régions (NUTS 2). La surface est celle de l’unité entière, pas seulement agricole, et la répartition nationale pondère chaque unité par ses mailles de 4 km. C’est un indicateur européen commun : le service météorologique ou hydrologique de chaque pays peut mesurer la sécheresse autrement.', src: 'Source :', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'unités : Eurostat/GISCO (© EuroGeographics)' },
    it: { h: '{c}: siccità per {u}', pick: 'Paese', at: 'Ultima decade dell’indicatore: {d}', wa: 'Superficie in allerta o allarme siccità', all: 'Superficie in siccità agricola (attenzione, allerta o allarme)', ly: 'Stessa decade dell’anno scorso', map: 'Superficie in allerta o allarme per {u}', hint: 'Passa il cursore o tocca un’unità.', none: 'nessun dato',
      cls: ['Nessuna siccità o in recupero', 'Attenzione', 'Allerta', 'Allarme'], idx: 'Ripartizione della superficie di {c}', hist: 'Superficie di {c} in allerta o allarme, ultimi 3 anni', hover: 'Passa il cursore sul grafico.', tbl: 'Per {u}', prov: 'Unità', hy: 'Un anno fa', unit: '% della superficie', more: 'Mostra tutte le {n} unità', less: 'Mostra solo le {n} più colpite',
      near: 'L’asterisco indica unità più piccole di poche celle da 4 km (città, isole): il loro valore è quello delle celle vicine.',
      note: 'L’indicatore combina tre segnali ogni 10 giorni: deficit di pioggia (attenzione), deficit di umidità del suolo (allerta) e stress della vegetazione visto da satellite (allarme). Dehesa Index lo calcola per ogni unità NUTS 3 di Eurostat; la scheda del paese lo dà solo per regioni più grandi (NUTS 2). La superficie è quella dell’intera unità, non solo agricola, e la ripartizione nazionale pesa ogni unità in base alle sue celle da 4 km. È un indicatore europeo comune: il servizio meteorologico o idrologico di ogni paese può misurare la siccità con altri metodi.', src: 'Fonte:', srcA: 'European Drought Observatory (JRC, Copernicus), CC BY 4.0', srcB: 'unità: Eurostat/GISCO (© EuroGeographics)' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc, TOP = 25;
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (a, k) { return o[k] != null ? o[k] : a; }); }
  function day(iso, lg) { return iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—'; }
  function dshort(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function nf(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function cl(x) { return Math.max(0, Math.min(100, x)); }
  function wa(v) { return cl(v[1] + v[2]); }
  function all3(v) { return cl(v[0] + v[1] + v[2]); }
  function national(D, i) {
    var s = [0, 0, 0], n = 0, k, j;
    for (k in D.regions) if (D.regions.hasOwnProperty(k)) { var c = D.regions[k]; n += c.cells; for (j = 0; j < 3; j++) s[j] += c.cells * c.v[i][j]; }
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
    return { P: P, V: V, X: X, W: W, html: '<div class="di-info-card-title gb-sub">' + esc(t.hist) + '</div><div class="wp-chart hr-hchart"><div class="wp-readout" aria-live="polite">' + esc(t.hover) + '</div><svg viewBox="0 0 ' + W + ' ' + Hh + '" class="wp-svg" role="img" aria-label="' + esc(t.hist) + '">' + g +
      '<path class="wp-line wp-line-t" d="' + p + '"/><line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (Hh - B) + '" style="display:none"/></svg><div class="wp-legend"><span class="wp-unit">' + esc(t.unit) + '</span></div></div>' };
  }
  function bindH(el, c, t, lg) {
    var box = el.querySelector('.hr-hchart'); if (!box || !c.P) return;
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
  var CACHE = {};
  function load(cc) {
    return CACHE[cc] || (CACHE[cc] = fetch('data/eu-drought-nuts3/' + cc + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }));
  }
  /* opts.pick: true -> muestra el selector de país (sequia.html); cc: país inicial */
  function mount(el, lg, cc, opts) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es'; cc = C[cc] ? cc : 'DE'; opts = opts || {};
    return Promise.all([load(cc), M.load('DEHESA_NUTS3_' + cc, 'vendor/nuts3/' + cc.toLowerCase() + '.js')]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.regions || !D.periods || D.periods.length < 4) return false;
      var o = { c: C[cc][LI[lg]], u: C[cc][4 + LI[lg]] }, t = {}, kk;
      for (kk in T[lg]) if (T[lg].hasOwnProperty(kk)) t[kk] = typeof T[lg][kk] === 'string' ? fill(T[lg][kk], o) : T[lg][kk];
      var P = D.periods, n = P.length, last = n - 1, vals = {}, k, ly = -1, tl = Date.parse(P[last]) - 365 * 864e5, bd = 1e12, R = D.regions;
      for (k = 0; k < n; k++) { var dd = Math.abs(Date.parse(P[k]) - tl); if (dd < bd) { bd = dd; ly = k; } }
      if (bd > 6 * 864e5) ly = -1;
      for (k in R) if (R.hasOwnProperty(k)) vals[k] = wa(R[k].v[last]);
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [10, 30, 50, 70], labels: ['< 10 %', '10–30 %', '30–50 %', '50–70 %', '≥ 70 %'], fmt: function (v) { return nf(v, lg, 1) + ' %'; }, label: t.map, none: t.none }) : null;
      var names = {}, anyNear = false; if (MAP) MAP.states.forEach(function (s) { names[s.id] = s.name; });
      var S = national(D, last), SL = ly >= 0 ? national(D, ly) : null, V = [], i;
      for (i = 0; i < n; i++) V.push(wa(national(D, i)));
      var ids = Object.keys(R).sort(function (x, y) { return vals[y] - vals[x]; }), big = ids.length > TOP + 5;
      var rows = ids.map(function (c, ix) {
        var v = R[c].v[last], h = ly >= 0 ? wa(R[c].v[ly]) : null; if (R[c].near) anyNear = true;
        return '<tr' + (big && ix >= TOP ? ' class="n3-x" style="display:none"' : '') + '><th scope="row">' + esc(names[c] || R[c].name) + (R[c].near ? '*' : '') + '</th><td class="cof-n">' + nf(cl(v[0]), lg) + '</td><td class="cof-n">' + nf(cl(v[1]), lg) + '</td><td class="cof-n">' + nf(cl(v[2]), lg) + '</td><td class="cof-n"><b>' + nf(wa(v), lg) + '</b></td><td class="cof-n">' + (h == null ? '—' : nf(h, lg)) + '</td></tr>';
      }).join('');
      var hc = hchart(P, V, t, lg), sel = '';
      if (opts.pick) sel = '<label style="font-size:13px;display:block;margin:0 0 10px">' + esc(t.pick) + '<br><select id="n3-cc" class="di-compare-select">' + ORDER.map(function (x) { return '<option value="' + x + '"' + (x === cc ? ' selected' : '') + '>' + esc(C[x][LI[lg]]) + '</option>'; }).join('') + '</select></label>';
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="n3-sq" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2>' + sel + '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{d}', day(P[last], lg))) + '</p>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(t.wa, '<b>' + nf(wa(S), lg, 1) + ' %</b>') + row(t.all, nf(all3(S), lg, 1) + ' %') + (SL ? row(t.ly, nf(wa(SL), lg, 1) + ' % · ' + esc(dshort(P[ly], lg))) : '') + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map) + '</div><div class="wp-readout hr-tip" aria-live="polite">' + esc(t.hint) + '</div><div style="max-width:' + (parseFloat(MAP.viewBox.split(' ')[3]) > parseFloat(MAP.viewBox.split(' ')[2]) ? 460 : 760) + 'px">' + mp.html + '</div>' : '') + stack(S, t, lg) + hc.html +
        '<div class="di-info-card-title gb-sub">' + esc(t.tbl) + '</div><div style="overflow-x:auto"><table class="cof-tbl" style="max-width:760px"><thead><tr><th scope="col">' + esc(t.prov) + '</th><th scope="col" class="cof-n">' + esc(t.cls[1]) + ' %</th><th scope="col" class="cof-n">' + esc(t.cls[2]) + ' %</th><th scope="col" class="cof-n">' + esc(t.cls[3]) + ' %</th><th scope="col" class="cof-n">' + esc(t.wa) + ' %</th><th scope="col" class="cof-n">' + esc(t.hy) + ' %</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        (big ? '<p style="margin:8px 0 0"><button type="button" class="di-compare-select n3-more" aria-expanded="false">' + esc(fill(t.more, { n: ids.length })) + '</button></p>' : '') +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + (anyNear ? ' ' + esc(t.near) : '') + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a>; ' + esc(t.srcB) + '</p></section>';
      if (mp) M.bind(el, el.querySelector('.hr-tip'), t.hint, function (id) { var c = R[id], nmn = names[id] || id; if (!c) return '<b>' + esc(nmn) + '</b> · ' + esc(t.none); var v = c.v[last]; return '<b>' + esc(nmn) + (c.near ? '*' : '') + '</b> · ' + esc(t.wa) + ' ' + nf(wa(v), lg, 1) + ' % (' + esc(t.cls[2]) + ' ' + nf(cl(v[1]), lg) + ', ' + esc(t.cls[3]) + ' ' + nf(cl(v[2]), lg) + ')'; });
      bindH(el, hc, t, lg);
      var mb = el.querySelector('.n3-more');
      if (mb) mb.addEventListener('click', function () {
        var open = mb.getAttribute('aria-expanded') !== 'true', xs = el.querySelectorAll('.n3-x'), j;
        for (j = 0; j < xs.length; j++) xs[j].style.display = open ? '' : 'none';
        mb.setAttribute('aria-expanded', open ? 'true' : 'false'); mb.textContent = open ? fill(t.less, { n: TOP }) : fill(t.more, { n: ids.length });
      });
      if (opts.pick) { var sc = el.querySelector('#n3-cc'); if (sc) sc.addEventListener('change', function () { opts.cc = sc.value; mount(el, lg, sc.value, opts); }); }
      return true;
    });
  }
  global.DINuts3Drought = { mount: mount, countries: ORDER };
  function auto() {
    var el = document.getElementById('n3sq'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; }, st = { pick: true, cc: 'DE' };
    var run = function () { mount(el, lg(), st.cc, st); };
    run();
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); run(); }; }
    el.addEventListener('change', function (ev) { if (ev.target && ev.target.id === 'n3-cc') st.cc = ev.target.value; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
