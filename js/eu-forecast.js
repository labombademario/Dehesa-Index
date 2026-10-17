/* Dehesa Index — Previsiones de producción de carne de Eurostat en la ficha de país (porcino, vacuno, ovino y caprino hasta 2027).
   Datos: data/views/forecast/<PAIS>.json (scripts/build-views.py, desde data/eurostat-more-stats.json: Eurostat apro_mt_ppighq y apro_mt_pcatlhs).
   Las cifras previstas son las de Eurostat y se rotulan como previsión; la variación frente al último dato observado la calcula esta ficha. ES5. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var T = {
    h: L('Previsiones de producción de carne', 'Meat production forecasts', 'Prévisions de production de viande', 'Previsioni di produzione di carne'),
    sub: L('Previsión de Eurostat para los próximos periodos (porcino, vacuno, ovino y caprino). Son previsiones, no observaciones.', 'Eurostat forecast for the coming periods (pigs, cattle, sheep and goats). These are forecasts, not observations.', 'Prévision d’Eurostat pour les prochaines périodes (porcins, bovins, ovins et caprins). Ce sont des prévisions, pas des observations.', 'Previsione di Eurostat per i prossimi periodi (suini, bovini, ovini e caprini). Sono previsioni, non osservazioni.'),
    item: L('Concepto', 'Item', 'Élément', 'Voce'), last: L('Último dato observado', 'Last observed', 'Dernière valeur observée', 'Ultimo dato osservato'), fc: L('previsión', 'forecast', 'prévision', 'previsione'),
    note: L('La variación (%) frente al último dato observado la calcula Dehesa Index. Las previsiones las revisa Eurostat con cada actualización.', 'The change (%) against the last observed figure is calculated by Dehesa Index. Eurostat revises the forecasts with each update.', 'La variation (%) par rapport à la dernière valeur observée est calculée par Dehesa Index. Eurostat révise les prévisions à chaque mise à jour.', 'La variazione (%) rispetto all’ultimo dato osservato è calcolata da Dehesa Index. Eurostat rivede le previsioni a ogni aggiornamento.'),
    src: L('Fuente:', 'Source:', 'Source :', 'Fonte:'), srcA: L('Eurostat, apro_mt_ppighq y apro_mt_pcatlhs (reutilización según la Decisión 2011/833/UE)', 'Eurostat, apro_mt_ppighq and apro_mt_pcatlhs (reuse under Decision 2011/833/EU)', 'Eurostat, apro_mt_ppighq et apro_mt_pcatlhs (réutilisation selon la décision 2011/833/UE)', 'Eurostat, apro_mt_ppighq e apro_mt_pcatlhs (riutilizzo ai sensi della decisione 2011/833/UE)')
  };
  var DOCS = {};
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function short(label) { var m = /^[^:]*:\s*(.*?)\s*\(([^()]*(?:\([^()]*\))?[^()]*),\s*Eurostat\)$/.exec(label); return m ? [m[1], m[2]] : [label, '']; }
  function mount(el, lg, cc) {
    if (!el) return Promise.resolve(false); lg = LOC[lg] ? lg : 'es'; var i = IX[lg];
    var sp = global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath : function (u) { return u; };
    var nf = function (v) { return v == null ? '—' : (+v).toLocaleString(LOC[lg], { maximumFractionDigits: Math.abs(v) < 100 ? 1 : 0 }); };
    DOCS[cc] = DOCS[cc] || fetch(sp('data/views/forecast/' + cc + '.json')).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    var tl = global.DILabelTl, gl = tl && tl.load ? tl.load(lg).catch(function () { return false; }) : Promise.resolve(false);
    return Promise.all([DOCS[cc], gl]).then(function (r) {
      var d = r[0]; if (!d || !d.series || !d.series.length) return false;
      var rows = d.series.slice(0, 24).map(function (s) {
        var sh = short(s.label), nm = tl && tl.tl ? (tl.tl(sh[0], lg) || sh[0]) : sh[0], lastO = s.obs[s.obs.length - 1];
        return { nm: nm, unit: sh[1], last: lastO, fc: s.fc, s: s };
      });
      var per = []; rows.forEach(function (x) { x.fc.forEach(function (p) { if (per.indexOf(p[0]) < 0) per.push(p[0]); }); }); per.sort();
      var head = '<tr><th>' + esc(T.item[i]) + '</th><th class="num">' + esc(T.last[i]) + '</th>' + per.map(function (p) { return '<th class="num">' + esc(p) + ' · ' + esc(T.fc[i]) + '</th>'; }).join('') + '</tr>';
      var body = rows.map(function (x) {
        var base = x.last ? x.last[1] : null;
        return '<tr><td>' + esc(x.nm) + (x.unit ? ' <span class="fsh-m">(' + esc(x.unit) + ')</span>' : '') + '</td><td class="num">' + (x.last ? nf(x.last[1]) + ' <span class="fsh-m">' + esc(x.last[0]) + '</span>' : '—') + '</td>' +
          per.map(function (p) { var f = null; x.fc.forEach(function (q) { if (q[0] === p) f = q[1]; }); return '<td class="num">' + (f == null ? '—' : nf(f) + (base ? ' <span class="fsh-m">' + (f / base - 1 >= 0 ? '+' : '') + nf((f / base - 1) * 100) + ' %</span>' : '')) + '</td>'; }).join('') + '</tr>';
      }).join('');
      el.innerHTML = '<section class="di-card ps-rm gb-card" id="ps-eu-forecast" style="max-width:none"><h2 class="ps-rm-h">' + esc(T.h[i]) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(T.sub[i]) + '</p>' +
        '<details class="sec-fold" open><summary>' + esc(T.h[i]) + '</summary><div class="di-table-wrap"><table class="di-table fsh-tbl"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div></details>' +
        '<p class="di-movers-hint" style="margin:10px 0 0;max-width:860px">' + esc(T.note[i]) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(T.src[i]) + ' <a href="https://ec.europa.eu/eurostat/databrowser/view/apro_mt_ppighq" rel="noopener" target="_blank">' + esc(T.srcA[i]) + '</a></p></section>';
      return true;
    });
  }
  global.DIEuForecast = { mount: mount };
})(window);
