/* Dehesa Index — Irlanda: nitratos en las aguas subterráneas y estado ecológico de los ríos (EPA, publicado por el CSO). data/ie-nitrates.json
   (scripts/update-ie-nitrates.py). Ficha de Irlanda. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Nitratos y calidad del agua en Irlanda', gw: 'Aguas subterráneas: puntos de control por tramo de nitrato (mg/l NO₃)', ge: 'Puntos de control con 50 mg/l o más', g2: 'Puntos con 37,5 mg/l o más', g3: 'Puntos con menos de 10 mg/l', rv: 'Ríos: tramos por estado ecológico (Directiva Marco del Agua)', rg: 'Tramos en estado bueno o alto', rb: 'Tramos en estado pobre o malo', yr: 'Año', pe: 'Periodo', prev: 'Año anterior', gcl: ['<5', '5–<10', '10–<25', '25–<37,5', '37,5–<50', '≥ 50'], rcl: ['Alto', 'Bueno', 'Moderado', 'Pobre', 'Malo'],
      note: 'La Agencia de Protección Ambiental de Irlanda (EPA) resume cada año los resultados de su red de aguas subterráneas: el 50 mg/l es el umbral de la Directiva de Nitratos de la UE. Los ríos se evalúan en periodos de tres años según la Directiva Marco del Agua; el estado ecológico depende de muchos factores, no solo del nitrato. La EPA no publica en abierto una concentración de nitrato por región o por estación en un formato fijo, así que Dehesa Index muestra solo este resumen nacional.', src: 'Fuente:', srcA: 'EPA Irlanda, vía CSO (indicadores ambientales), CC BY 4.0' },
    en: { h: 'Nitrates and water quality in Ireland', gw: 'Groundwater: monitoring points by nitrate band (mg/l NO₃)', ge: 'Monitoring points at 50 mg/l or more', g2: 'Points at 37.5 mg/l or more', g3: 'Points below 10 mg/l', rv: 'Rivers: water bodies by ecological status (Water Framework Directive)', rg: 'Water bodies in good or high status', rb: 'Water bodies in poor or bad status', yr: 'Year', pe: 'Period', prev: 'Previous year', gcl: ['<5', '5–<10', '10–<25', '25–<37.5', '37.5–<50', '≥ 50'], rcl: ['High', 'Good', 'Moderate', 'Poor', 'Bad'],
      note: 'Ireland’s Environmental Protection Agency (EPA) summarises each year the results of its groundwater network: 50 mg/l is the threshold of the EU Nitrates Directive. Rivers are assessed over three-year periods under the Water Framework Directive; ecological status depends on many factors, not only nitrate. The EPA does not publish nitrate concentrations by region or station in a fixed open format, so Dehesa Index shows only this national summary.', src: 'Source:', srcA: 'EPA Ireland, via CSO (environmental indicators), CC BY 4.0' },
    fr: { h: 'Nitrates et qualité de l’eau en Irlande', gw: 'Eaux souterraines : points de contrôle par tranche de nitrate (mg/l NO₃)', ge: 'Points de contrôle à 50 mg/l ou plus', g2: 'Points à 37,5 mg/l ou plus', g3: 'Points sous 10 mg/l', rv: 'Rivières : masses d’eau par état écologique (directive-cadre sur l’eau)', rg: 'Masses d’eau en bon ou très bon état', rb: 'Masses d’eau en état médiocre ou mauvais', yr: 'Année', pe: 'Période', prev: 'Année précédente', gcl: ['<5', '5–<10', '10–<25', '25–<37,5', '37,5–<50', '≥ 50'], rcl: ['Très bon', 'Bon', 'Moyen', 'Médiocre', 'Mauvais'],
      note: 'L’Agence de protection de l’environnement d’Irlande (EPA) résume chaque année les résultats de son réseau d’eaux souterraines : 50 mg/l est le seuil de la directive Nitrates de l’UE. Les rivières sont évaluées par périodes de trois ans selon la directive-cadre sur l’eau ; l’état écologique dépend de nombreux facteurs, pas seulement du nitrate. L’EPA ne publie pas en open data de concentration de nitrate par région ou par station dans un format fixe ; Dehesa Index n’affiche donc que ce résumé national.', src: 'Source :', srcA: 'EPA Irlande, via CSO (indicateurs environnementaux), CC BY 4.0' },
    it: { h: 'Nitrati e qualità dell’acqua in Irlanda', gw: 'Acque sotterranee: punti di controllo per fascia di nitrato (mg/l NO₃)', ge: 'Punti di controllo a 50 mg/l o più', g2: 'Punti a 37,5 mg/l o più', g3: 'Punti sotto 10 mg/l', rv: 'Fiumi: corpi idrici per stato ecologico (direttiva quadro sulle acque)', rg: 'Corpi idrici in stato buono o elevato', rb: 'Corpi idrici in stato scarso o cattivo', yr: 'Anno', pe: 'Periodo', prev: 'Anno precedente', gcl: ['<5', '5–<10', '10–<25', '25–<37,5', '37,5–<50', '≥ 50'], rcl: ['Elevato', 'Buono', 'Sufficiente', 'Scarso', 'Cattivo'],
      note: 'L’Agenzia per la protezione ambientale d’Irlanda (EPA) riassume ogni anno i risultati della sua rete di acque sotterranee: 50 mg/l è la soglia della direttiva Nitrati dell’UE. I fiumi sono valutati su periodi di tre anni secondo la direttiva quadro sulle acque; lo stato ecologico dipende da molti fattori, non solo dal nitrato. L’EPA non pubblica in formato aperto concentrazioni di nitrato per regione o stazione in un formato fisso, quindi Dehesa Index mostra solo questo riepilogo nazionale.', src: 'Fonte:', srcA: 'EPA Irlanda, tramite CSO (indicatori ambientali), CC BY 4.0' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  // Barras apiladas por año/periodo: rows = [[etiqueta, v1…vn]], cls = prefijo de clase, labels = nombres de las clases
  function stacks(rows, pre, labels, lg) {
    var o = '';
    rows.forEach(function (r) {
      var q = r.slice(1);
      o += '<div class="be-stk"><div class="be-stk-l">' + esc(r[0]) + '</div><div class="be-stk-b" role="img" aria-label="' + esc(labels.map(function (c, i) { return c + ' ' + nf(q[i], lg) + ' %'; }).join(', ')) + '">' +
        q.map(function (v, i) { return v > 0.05 ? '<span class="' + pre + i + '" style="width:' + v.toFixed(2) + '%" title="' + esc(labels[i] + ': ' + nf(v, lg) + ' %') + '">' + (v >= 8 ? nf(v, lg) : '') + '</span>' : ''; }).join('') + '</div></div>';
    });
    return o + '<div class="wp-legend">' + labels.map(function (c, i) { return '<span><i class="wp-sw ' + pre + i + '"></i>' + esc(c) + '</span>'; }).join('') + '</div>';
  }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/ie-nitrates.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return CACHE.then(function (d) {
      if (!d || !d.groundwater || !d.groundwater.length || !d.rivers || !d.rivers.length) return false;
      var t = T[lg], G = d.groundwater, g = G[G.length - 1], gp = G[G.length - 2], RV = d.rivers, r = RV[RV.length - 1], rp = RV[RV.length - 2];
      el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-ie-nitrates" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><div class="di-info-stat-list" style="max-width:640px">' +
        row(t.ge + ' · ' + g[0], '<b>' + nf(g[6], lg) + ' %</b>' + (gp ? ' · ' + esc(t.prev) + ' ' + nf(gp[6], lg) + ' %' : '')) + row(t.g2, nf(g[5] + g[6], lg) + ' %') + row(t.g3, nf(g[1] + g[2], lg) + ' %') +
        row(t.rg + ' · ' + r[0], '<b>' + nf(r[1] + r[2], lg) + ' %</b>' + (rp ? ' · ' + esc(rp[0]) + ': ' + nf(rp[1] + rp[2], lg) + ' %' : '')) + row(t.rb, nf(r[4] + r[5], lg) + ' %') + '</div>' +
        '<div class="di-info-card-title gb-sub">' + esc(t.gw) + '</div>' + stacks(G.slice().reverse(), 'ie-n', t.gcl, lg) +
        '<div class="di-info-card-title gb-sub">' + esc(t.rv) + '</div>' + stacks(RV.slice(-6).reverse(), 'ie-r', t.rcl, lg) +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcA) + '</a></p></section>';
      return true;
    });
  }
  global.DIIeNitrates = { mount: mount };
})(window);
