/* Dehesa Index — Polonia: avisos de sequía hidrológica vigentes del IMGW-PIB por voivodato. data/pl-hydro-drought.json
   (scripts/update-pl-hydro-drought.py). En sequia.html (#plhd) y en la pestaña «Sequía» de la ficha de Polonia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Sequía hidrológica en Polonia: avisos del IMGW', at: 'Avisos vigentes a {d}', n: 'Avisos de sequía hidrológica vigentes', v: 'Voivodatos afectados', map: 'Avisos vigentes por voivodato', hint: 'Pasa el cursor o toca un voivodato.', none: 'sin avisos', list: 'Avisos vigentes (texto original en polaco)', since: 'desde', areas: 'Cuencas', zero: 'No hay avisos de sequía hidrológica vigentes.', hist: 'Avisos vigentes cada día', w1: 'aviso', w2: 'avisos',
      note: 'El instituto meteorológico polaco (IMGW-PIB) emite un aviso de sequía hidrológica cuando los caudales de las estaciones de referencia de una zona llevan al menos diez días por debajo del caudal mínimo medio (SNQ). Afecta al riego y al abrevado del ganado. Recuento por voivodato e histórico diario: cálculo de Dehesa Index con datos del IMGW-PIB.', src: 'Fuente:', srcN: 'Źródłem pochodzenia danych jest Instytut Meteorologii i Gospodarki Wodnej – Państwowy Instytut Badawczy (datos procesados por Dehesa Index)' },
    en: { h: 'Hydrological drought in Poland: IMGW warnings', at: 'Warnings in force on {d}', n: 'Hydrological drought warnings in force', v: 'Voivodeships affected', map: 'Warnings in force by voivodeship', hint: 'Hover or tap a voivodeship.', none: 'no warnings', list: 'Warnings in force (original Polish text)', since: 'since', areas: 'Catchments', zero: 'There are no hydrological drought warnings in force.', hist: 'Warnings in force each day', w1: 'warning', w2: 'warnings',
      note: 'Poland’s weather and water institute (IMGW-PIB) issues a hydrological drought warning when flows at an area’s reference gauges have been below the mean low flow (SNQ) for at least ten days. It affects irrigation and livestock watering. Counts by voivodeship and the daily history are calculated by Dehesa Index from IMGW-PIB data.', src: 'Source:', srcN: 'Źródłem pochodzenia danych jest Instytut Meteorologii i Gospodarki Wodnej – Państwowy Instytut Badawczy (data processed by Dehesa Index)' },
    fr: { h: 'Sécheresse hydrologique en Pologne : alertes de l’IMGW', at: 'Alertes en vigueur au {d}', n: 'Alertes de sécheresse hydrologique en vigueur', v: 'Voïvodies touchées', map: 'Alertes en vigueur par voïvodie', hint: 'Survolez ou touchez une voïvodie.', none: 'pas d’alerte', list: 'Alertes en vigueur (texte original en polonais)', since: 'depuis le', areas: 'Bassins', zero: 'Aucune alerte de sécheresse hydrologique en vigueur.', hist: 'Alertes en vigueur chaque jour', w1: 'alerte', w2: 'alertes',
      note: 'L’institut météorologique et hydrologique polonais (IMGW-PIB) émet une alerte de sécheresse hydrologique lorsque les débits des stations de référence d’une zone sont inférieurs au débit moyen d’étiage (SNQ) depuis au moins dix jours. Cela touche l’irrigation et l’abreuvement du bétail. Décompte par voïvodie et historique quotidien : calcul de Dehesa Index à partir des données de l’IMGW-PIB.', src: 'Source :', srcN: 'Źródłem pochodzenia danych jest Instytut Meteorologii i Gospodarki Wodnej – Państwowy Instytut Badawczy (données traitées par Dehesa Index)' },
    it: { h: 'Siccità idrologica in Polonia: allerte dell’IMGW', at: 'Allerte in vigore al {d}', n: 'Allerte di siccità idrologica in vigore', v: 'Voivodati interessati', map: 'Allerte in vigore per voivodato', hint: 'Passa il cursore o tocca un voivodato.', none: 'nessuna allerta', list: 'Allerte in vigore (testo originale in polacco)', since: 'dal', areas: 'Bacini', zero: 'Non ci sono allerte di siccità idrologica in vigore.', hist: 'Allerte in vigore ogni giorno', w1: 'allerta', w2: 'allerte',
      note: 'L’istituto meteorologico e idrologico polacco (IMGW-PIB) emette un’allerta di siccità idrologica quando le portate delle stazioni di riferimento di un’area restano per almeno dieci giorni sotto la portata minima media (SNQ). Riguarda l’irrigazione e l’abbeveraggio del bestiame. Conteggi per voivodato e storico giornaliero: calcolo di Dehesa Index su dati IMGW-PIB.', src: 'Fonte:', srcN: 'Źródłem pochodzenia danych jest Instytut Meteorologii i Gospodarki Wodnej – Państwowy Instytut Badawczy (dati elaborati da Dehesa Index)' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc;
  function day(iso, lg) { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/pl-hydro-drought.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load('DEHESA_PL_VOIVODESHIPS', 'vendor/pl-voivodeships.js')]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.voivodeships) return false;
      var t = T[lg], vals = {}, k, nv = 0;
      for (k in D.voivodeships) if (D.voivodeships.hasOwnProperty(k)) { vals[k] = D.voivodeships[k].warnings; if (vals[k]) nv++; }
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [1, 2, 3, 5], labels: ['0', '1', '2', '3–4', '5+'], fmt: function (v) { return v + ' ' + (v === 1 ? t.w1 : t.w2); }, label: t.map, none: t.none }) : null;
      var W = D.warnings || [];
      var list = W.length ? '<ul class="pl-wlist">' + W.map(function (w) { return '<li><b>' + esc(w.areas.map(function (x) { return x[1]; }).filter(function (x, i, s) { return s.indexOf(x) === i; }).join(', ')) + '</b> · ' + esc(t.since) + ' ' + esc(day(w.from, lg)) + '<div class="di-field-hint" lang="pl">' + esc(w.text) + '</div></li>'; }).join('') + '</ul>' : '<p>' + esc(t.zero) + '</p>';
      var H = D.history || [], bars = '';
      if (H.length > 1) { var mx = 1; H.forEach(function (h) { mx = Math.max(mx, h.warnings); }); bars = '<div class="di-info-card-title gb-sub">' + esc(t.hist) + '</div><div class="on-bars">' + H.slice(-60).map(function (h) { return '<span title="' + esc(h.date + ': ' + h.warnings) + '"><i style="height:' + (h.warnings / mx * 90 + 1).toFixed(1) + 'px"></i><small>' + h.date.slice(8) + '</small></span>'; }).join('') + '</div>'; }
      el.innerHTML = '<section class="di-card ps-rm gb-card" id="pl-hd" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{d}', day(D.asOf, lg))) + '</p>' +
        '<div class="di-info-stat-list" style="max-width:640px">' + row(t.n, '<b>' + W.length + '</b>') + row(t.v, '<b>' + nv + '</b> / 16') + '</div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map) + '</div><div class="wp-readout pl-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html : '') +
        (W.length ? '<details class="pl-wdet"><summary class="di-info-card-title gb-sub">' + esc(t.list) + ' (' + W.length + ')</summary>' + list + '</details>' : list) + bars +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer" lang="pl">' + esc(t.srcN) + '</a></p></section>';
      if (mp) M.bind(el, el.querySelector('.pl-tip'), t.hint, function (id) { var v = D.voivodeships[id], nm = mp.names[id] || id; return '<b>' + esc(nm) + '</b> · ' + (v && v.warnings ? v.warnings + ' ' + esc(v.warnings === 1 ? t.w1 : t.w2) + ' · ' + esc(t.areas) + ': ' + esc(v.areas.join(', ')) : esc(t.none)); });
      return true;
    });
  }
  global.DIPlDrought = { mount: mount };
  function auto() {
    var el = document.getElementById('plhd'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
