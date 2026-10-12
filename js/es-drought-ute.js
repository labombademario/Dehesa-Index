/* Dehesa Index — España: escasez de agua (UTE) y sequía prolongada (UTS) por demarcación hidrográfica, del informe mensual del Observatorio
   Nacional de la Sequía (MITECO). data/es-drought-ute.json (scripts/update-es-drought-ute.py). Se usa en sequia.html (#esute) y en la pestaña
   «Sequía» de la ficha de España (js/country-drought.js). ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Escasez de agua y sequía prolongada en las cuencas de España', at: 'Situación a {d}', sc: { normal: 'Normalidad', prealert: 'Prealerta', alert: 'Alerta', emergency: 'Emergencia' }, dr: { drought: 'Sequía prolongada', none: 'Sin sequía prolongada' },
      ute: 'Unidades de escasez', uts: 'Unidades en sequía prolongada', of: 'de', dem: 'Demarcación', gS: 'Índice de sequía', gE: 'Índice de escasez', worst: 'En alerta o emergencia', units: 'Ver las unidades', unit: 'Unidad', ix: 'Índice', state: 'Escenario', drs: 'Sequía', prev: 'Mes anterior', hist: 'Unidades de escasez en alerta o emergencia, mes a mes',
      note: 'Los planes especiales de sequía dividen cada cuenca en unidades. Para cada una el ministerio calcula dos índices de 0 a 1 (cuanto más bajo, peor): sequía prolongada, que mide la falta de lluvia y de caudal natural, y escasez, que mide si hay agua para atender los riegos, los abastecimientos y otros usos. Solo están las cuencas que gestiona el Estado: las internas de Cataluña, Andalucía, Galicia, País Vasco, Baleares y Canarias no aparecen. Escenario asignado por Dehesa Index con los umbrales generales de los planes (normalidad desde 0,50; prealerta desde 0,30; alerta desde 0,15; emergencia por debajo; sequía prolongada por debajo de 0,30).',
      src: 'Fuente:', srcN: 'MITECO, Observatorio Nacional de la Sequía, informe mensual de sequía y escasez' },
    en: { h: 'Water scarcity and prolonged drought in Spain’s river basins', at: 'Situation at {d}', sc: { normal: 'Normal', prealert: 'Pre-alert', alert: 'Alert', emergency: 'Emergency' }, dr: { drought: 'Prolonged drought', none: 'No prolonged drought' },
      ute: 'Scarcity units', uts: 'Units in prolonged drought', of: 'of', dem: 'River basin district', gS: 'Drought index', gE: 'Scarcity index', worst: 'On alert or emergency', units: 'See the units', unit: 'Unit', ix: 'Index', state: 'Scenario', drs: 'Drought', prev: 'Previous month', hist: 'Scarcity units on alert or emergency, month by month',
      note: 'Spain’s special drought plans split each basin into units. For each one the ministry calculates two indices from 0 to 1 (the lower, the worse): prolonged drought, which measures the lack of rain and natural flow, and scarcity, which measures whether there is water for irrigation, urban supply and other uses. Only the basins managed by the State are covered: the internal basins of Catalonia, Andalusia, Galicia, the Basque Country, the Balearic and Canary Islands are not. Scenario assigned by Dehesa Index with the plans’ general thresholds (normal from 0.50; pre-alert from 0.30; alert from 0.15; emergency below; prolonged drought below 0.30).',
      src: 'Source:', srcN: 'MITECO, National Drought Observatory, monthly drought and scarcity report' },
    fr: { h: 'Pénurie d’eau et sécheresse prolongée dans les bassins espagnols', at: 'Situation au {d}', sc: { normal: 'Normalité', prealert: 'Pré-alerte', alert: 'Alerte', emergency: 'Urgence' }, dr: { drought: 'Sécheresse prolongée', none: 'Pas de sécheresse prolongée' },
      ute: 'Unités de pénurie', uts: 'Unités en sécheresse prolongée', of: 'sur', dem: 'District hydrographique', gS: 'Indice de sécheresse', gE: 'Indice de pénurie', worst: 'En alerte ou urgence', units: 'Voir les unités', unit: 'Unité', ix: 'Indice', state: 'Scénario', drs: 'Sécheresse', prev: 'Mois précédent', hist: 'Unités de pénurie en alerte ou urgence, mois par mois',
      note: 'Les plans spéciaux sécheresse découpent chaque bassin en unités. Pour chacune, le ministère calcule deux indices de 0 à 1 (plus c’est bas, pire c’est) : sécheresse prolongée, qui mesure le manque de pluie et de débit naturel, et pénurie, qui mesure s’il y a de l’eau pour l’irrigation, l’eau potable et les autres usages. Seuls les bassins gérés par l’État sont couverts : les bassins internes de Catalogne, d’Andalousie, de Galice, du Pays basque, des Baléares et des Canaries n’y figurent pas. Scénario attribué par Dehesa Index avec les seuils généraux des plans (normalité dès 0,50 ; pré-alerte dès 0,30 ; alerte dès 0,15 ; urgence en dessous ; sécheresse prolongée sous 0,30).',
      src: 'Source :', srcN: 'MITECO, Observatoire national de la sécheresse, rapport mensuel' },
    it: { h: 'Scarsità d’acqua e siccità prolungata nei bacini spagnoli', at: 'Situazione al {d}', sc: { normal: 'Normalità', prealert: 'Preallerta', alert: 'Allerta', emergency: 'Emergenza' }, dr: { drought: 'Siccità prolungata', none: 'Nessuna siccità prolungata' },
      ute: 'Unità di scarsità', uts: 'Unità in siccità prolungata', of: 'su', dem: 'Distretto idrografico', gS: 'Indice di siccità', gE: 'Indice di scarsità', worst: 'In allerta o emergenza', units: 'Vedi le unità', unit: 'Unità', ix: 'Indice', state: 'Scenario', drs: 'Siccità', prev: 'Mese precedente', hist: 'Unità di scarsità in allerta o emergenza, mese per mese',
      note: 'I piani speciali per la siccità dividono ogni bacino in unità. Per ognuna il ministero calcola due indici da 0 a 1 (più è basso, peggio è): siccità prolungata, che misura la mancanza di pioggia e di portata naturale, e scarsità, che misura se c’è acqua per irrigazione, acqua potabile e altri usi. Sono coperti solo i bacini gestiti dallo Stato: quelli interni di Catalogna, Andalusia, Galizia, Paesi Baschi, Baleari e Canarie non compaiono. Scenario assegnato da Dehesa Index con le soglie generali dei piani (normalità da 0,50; preallerta da 0,30; allerta da 0,15; emergenza sotto; siccità prolungata sotto 0,30).',
      src: 'Fonte:', srcN: 'MITECO, Osservatorio nazionale della siccità, rapporto mensile' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, ORD = ['emergency', 'alert', 'prealert', 'normal'];
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function n3(v, lg) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function mon(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function chip(k, lab) { return '<span class="ute-chip ute-' + k + '">' + esc(lab) + '</span>'; }
  function stateOfIndex(v) { return v == null ? null : v >= 0.5 ? 'normal' : v >= 0.3 ? 'prealert' : v >= 0.15 ? 'alert' : 'emergency'; }
  function html(D, lg) {
    var t = T[lg] || T.es, dems = D.demarcations, H = D.history || [], last = H[H.length - 1] || {}, c = last.ute || {}, tot = 0, i;
    ORD.forEach(function (k) { tot += c[k] || 0; });
    var bar = '<div class="ute-bar" role="img" aria-label="' + esc(ORD.map(function (k) { return t.sc[k] + ' ' + (c[k] || 0); }).join(', ')) + '">' + ORD.slice().reverse().map(function (k) { return c[k] ? '<span class="ute-' + k + '" style="flex:' + c[k] + '"></span>' : ''; }).join('') + '</div>' +
      '<div class="ute-leg">' + ORD.map(function (k) { return chip(k, t.sc[k]) + ' <b>' + (c[k] || 0) + '</b>'; }).join(' ') + '</div>';
    var names = Object.keys(dems).sort(function (a, b) {
      function bad(d) { return d.ute.filter(function (r) { return r.state === 'alert' || r.state === 'emergency'; }).length; }
      return bad(dems[b]) - bad(dems[a]) || (dems[a].global.scarcity == null ? 9 : dems[a].global.scarcity) - (dems[b].global.scarcity == null ? 9 : dems[b].global.scarcity);
    });
    var rows = names.map(function (n) {
      var d = dems[n], w = d.ute.filter(function (r) { return r.state === 'alert' || r.state === 'emergency'; }).length, ge = d.global.scarcity, gs = d.global.drought;
      var units = d.ute.slice().sort(function (a, b) { return a.value - b.value; }).map(function (r) { return '<tr><th scope="row">' + esc(r.name) + '</th><td class="cof-n">' + n3(r.value, lg) + '</td><td>' + chip(r.state, t.sc[r.state]) + '</td><td class="cof-n">' + (r.series.length > 1 ? n3(r.series[r.series.length - 2], lg) : '—') + '</td></tr>'; }).join('');
      var dr = d.uts.filter(function (r) { return r.state === 'drought'; });
      return '<tr><th scope="row">' + esc(n) + '</th><td class="cof-n">' + (gs == null ? '—' : n3(gs, lg) + (gs < 0.3 ? ' ' + chip('alert', t.drs) : '')) + '</td><td class="cof-n">' + (ge == null ? '—' : n3(ge, lg) + ' ' + chip(stateOfIndex(ge), t.sc[stateOfIndex(ge)])) + '</td><td class="cof-n"><b>' + w + '</b> / ' + d.ute.length + '</td></tr>' +
        '<tr class="ute-sub"><td colspan="4"><details><summary>' + esc(t.units) + ' (' + d.ute.length + ' · ' + esc(t.uts.toLowerCase()) + ': ' + dr.length + ')</summary><div style="overflow-x:auto"><table class="cof-tbl ute-in"><thead><tr><th scope="col">' + esc(t.unit) + '</th><th scope="col" class="cof-n">' + esc(t.ix) + '</th><th scope="col">' + esc(t.state) + '</th><th scope="col" class="cof-n">' + esc(t.prev) + '</th></tr></thead><tbody>' + units + '</tbody></table></div>' +
        (dr.length ? '<p class="di-field-hint" style="margin:6px 0 0">' + esc(t.dr.drought) + ': ' + esc(dr.map(function (r) { return r.name; }).join(', ')) + '</p>' : '') + '</details></td></tr>';
    }).join('');
    var hist = '';
    if (H.length > 1) hist = '<h3 style="margin:14px 0 6px;font-size:15px">' + esc(t.hist) + '</h3><div class="ute-hist">' + H.slice(-24).map(function (h) { var b = (h.ute.alert || 0) + (h.ute.emergency || 0); return '<span title="' + esc(mon(h.date, lg) + ': ' + b) + '"><i style="height:' + Math.max(2, b * 3) + 'px"></i><small>' + esc(mon(h.date, lg)) + '</small></span>'; }).join('') + '</div>';
    return '<section class="di-card ps-rm ute-card" id="es-ute"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{d}', day(D.asOf, lg))) + '</p>' +
      '<div class="di-info-stat-list" style="max-width:640px"><div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(t.ute) + '</span><span class="di-info-stat-value"><b>' + tot + '</b></span></div><div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(t.uts) + '</span><span class="di-info-stat-value"><b>' + (last.utsDrought || 0) + '</b> ' + esc(t.of) + ' ' + (last.uts || 0) + '</span></div></div>' +
      bar + '<div style="overflow-x:auto;margin-top:10px"><table class="cof-tbl ute-tbl"><thead><tr><th scope="col">' + esc(t.dem) + '</th><th scope="col" class="cof-n">' + esc(t.gS) + '</th><th scope="col" class="cof-n">' + esc(t.gE) + '</th><th scope="col" class="cof-n">' + esc(t.worst) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + hist +
      '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a></p></section>';
  }
  var CACHE = null;
  function load() { return CACHE || (CACHE = fetch('data/es-drought-ute.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function mount(el, lg) {
    if (!el) return Promise.resolve(false);
    return load().then(function (D) { if (!D || !D.demarcations) return false; el.innerHTML = html(D, T[lg] ? lg : 'es'); return true; });
  }
  global.DIEsDroughtUTE = { mount: mount };
  // sequia.html: sección propia
  function auto() {
    var el = document.getElementById('esute'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
