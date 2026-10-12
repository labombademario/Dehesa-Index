/* Dehesa Index — Italia: estado de severidad hídrica por distrito hidrográfico (ISPRA, Observatorios distritales de los usos del agua).
   data/it-water-severity.json (scripts/update-it-severity.py). En sequia.html (#itsev) y en la pestaña «Sequía» de la ficha de Italia. ES5. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Severidad hídrica en Italia por distrito', at: 'Actualizado por ISPRA el {d}', lv: { normal: 'Normal', low: 'Baja', medium: 'Media', high: 'Alta' }, dist: 'Distrito hidrográfico', level: 'Severidad', bul: 'Último boletín', exc: 'Excepción (texto del observatorio)', map: 'Severidad por distrito (coloreado por regiones, aproximado)', hint: 'Pasa el cursor o toca una región.', none: 'sin dato', in: 'Distrito', changes: 'Cambios registrados',
      note: 'Cada uno de los siete distritos hidrográficos de Italia tiene un observatorio que decide el escenario de severidad hídrica: normal, baja (aún hay agua para todos pero los indicadores empeoran), media (caudales y embalses por debajo de lo normal, probables daños económicos) o alta (el agua no alcanza para todos los usos y se aplican restricciones, por ejemplo al riego). Es el nivel medio de cada distrito: dentro puede haber zonas mejor o peor. El mapa colorea las regiones según el distrito que más territorio cubre; los límites reales son cuencas, no regiones.', src: 'Fuente:', srcN: 'ISPRA, estado de severidad hídrica a escala nacional' },
    en: { h: 'Water severity in Italy by river basin district', at: 'Updated by ISPRA on {d}', lv: { normal: 'Normal', low: 'Low', medium: 'Medium', high: 'High' }, dist: 'River basin district', level: 'Severity', bul: 'Latest bulletin', exc: 'Exception (observatory wording)', map: 'Severity by district (shaded by region, approximate)', hint: 'Hover or tap a region.', none: 'no data', in: 'District', changes: 'Recorded changes',
      note: 'Each of Italy’s seven river basin districts has an observatory that sets the water-severity scenario: normal, low (there is still water for everyone but the indicators are worsening), medium (flows and reservoirs below normal, economic damage likely) or high (water is not enough for every use and restrictions apply, for example on irrigation). It is the average level of each district: some areas inside may be better or worse. The map shades regions by the district covering most of their land; the real boundaries are river basins, not regions.', src: 'Source:', srcN: 'ISPRA, national water severity status' },
    fr: { h: 'Sévérité hydrique en Italie par district', at: 'Mis à jour par l’ISPRA le {d}', lv: { normal: 'Normale', low: 'Faible', medium: 'Moyenne', high: 'Élevée' }, dist: 'District hydrographique', level: 'Sévérité', bul: 'Dernier bulletin', exc: 'Exception (texte de l’observatoire)', map: 'Sévérité par district (colorée par région, approximative)', hint: 'Survolez ou touchez une région.', none: 'pas de donnée', in: 'District', changes: 'Changements enregistrés',
      note: 'Chacun des sept districts hydrographiques italiens dispose d’un observatoire qui fixe le scénario de sévérité hydrique : normale, faible (l’eau suffit encore mais les indicateurs se dégradent), moyenne (débits et retenues sous la normale, dommages économiques probables) ou élevée (l’eau ne suffit pas à tous les usages et des restrictions s’appliquent, notamment à l’irrigation). C’est le niveau moyen du district : certaines zones peuvent être mieux ou moins bien loties. La carte colore les régions selon le district qui en couvre la plus grande partie ; les limites réelles sont des bassins, pas des régions.', src: 'Source :', srcN: 'ISPRA, état de sévérité hydrique national' },
    it: { h: 'Severità idrica in Italia per distretto', at: 'Aggiornato da ISPRA il {d}', lv: { normal: 'Normale', low: 'Bassa', medium: 'Media', high: 'Alta' }, dist: 'Distretto idrografico', level: 'Severità', bul: 'Ultimo bollettino', exc: 'Eccezione (testo dell’osservatorio)', map: 'Severità per distretto (colorata per regione, approssimata)', hint: 'Passa il cursore o tocca una regione.', none: 'nessun dato', in: 'Distretto', changes: 'Cambiamenti registrati',
      note: 'Ognuno dei sette distretti idrografici italiani ha un osservatorio che stabilisce lo scenario di severità idrica: normale, bassa (l’acqua basta ancora ma gli indicatori peggiorano), media (portate e invasi sotto la norma, probabili danni economici) o alta (l’acqua non basta per tutti gli usi e si applicano restrizioni, per esempio all’irrigazione). È il livello medio del distretto: al suo interno possono esserci aree in condizioni migliori o peggiori. La mappa colora le regioni secondo il distretto che ne copre la maggior parte; i limiti reali sono bacini, non regioni.', src: 'Fonte:', srcN: 'ISPRA, stato di severità idrica a scala nazionale' }
  };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, M = global.DIFrDeptMap, esc = M.esc, IX = { normal: 0, low: 1, medium: 2, high: 3 };
  function day(iso, lg) { return iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[lg], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—'; }
  var CACHE = null;
  function mount(el, lg) {
    if (!el) return Promise.resolve(false); lg = T[lg] ? lg : 'es';
    CACHE = CACHE || fetch('data/it-water-severity.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return Promise.all([CACHE, M.load('DEHESA_IT_REGIONS', 'vendor/it-regions.js')]).then(function (a) {
      var D = a[0], MAP = a[1]; if (!D || !D.districts) return false;
      var t = T[lg], vals = {}, byReg = {}, k;
      for (k in D.districts) if (D.districts.hasOwnProperty(k)) D.districts[k].regions.forEach(function (r) { vals[r] = IX[D.districts[k].level] + 0.5; byReg[r] = k; });
      var mp = MAP ? M.html(MAP, { values: vals, cuts: [1, 2, 3, 3.9], labels: [t.lv.normal, t.lv.low, t.lv.medium, t.lv.high, ''], fmt: function (v) { var l = ['normal', 'low', 'medium', 'high'][Math.floor(v)]; return t.lv[l]; }, label: t.map, none: t.none }) : null;
      var order = Object.keys(D.districts).sort(function (x, y) { return IX[D.districts[y].level] - IX[D.districts[x].level]; });
      var rows = order.map(function (k2) { var d = D.districts[k2]; return '<tr><th scope="row">' + esc(d.name) + '</th><td><span class="ute-chip ute-' + ({ normal: 'normal', low: 'prealert', medium: 'alert', high: 'emergency' })[d.level] + '">' + esc(t.lv[d.level]) + '</span>' + (d.note ? '<div class="di-field-hint" lang="it" style="margin-top:3px">«' + esc(d.note) + '»</div>' : '') + '</td><td class="cof-n">' + esc(day(d.bulletinDate, lg)) + '</td></tr>'; }).join('');
      var hist = (D.history || []).length > 1 ? '<p class="di-field-hint">' + esc(t.changes) + ': ' + D.history.length + '</p>' : '';
      el.innerHTML = '<section class="di-card ps-rm gb-card ute-card" id="it-sev" style="max-width:none"><h2 class="ps-rm-h">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.at.replace('{d}', day(D.asOf, lg))) + '</p>' +
        '<div style="overflow-x:auto"><table class="cof-tbl" style="max-width:760px"><thead><tr><th scope="col">' + esc(t.dist) + '</th><th scope="col">' + esc(t.level) + '</th><th scope="col" class="cof-n">' + esc(t.bul) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        (mp ? '<div class="di-info-card-title gb-sub">' + esc(t.map) + '</div><div class="wp-readout is-tip" aria-live="polite">' + esc(t.hint) + '</div>' + mp.html.replace(/<span><i class="gb-key gb-c4"><\/i><\/span>/, '') : '') + hist +
        '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a> (CC BY 4.0)</p></section>';
      if (mp) M.bind(el, el.querySelector('.is-tip'), t.hint, function (id) { var dk = byReg[id], nm = mp.names[id] || id; if (!dk) return '<b>' + esc(nm) + '</b>'; var d = D.districts[dk]; return '<b>' + esc(nm) + '</b> · ' + esc(t.in) + ' ' + esc(d.name) + ': <b>' + esc(t.lv[d.level]) + '</b>'; });
      return true;
    });
  }
  global.DIItSeverity = { mount: mount };
  function auto() {
    var el = document.getElementById('itsev'); if (!el) return;
    var S = global.DehesaShared, lg = function () { var l = S && S.getLang ? S.getLang() : 'es'; return T[l] ? l : 'es'; };
    mount(el, lg());
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); mount(el, lg()); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
