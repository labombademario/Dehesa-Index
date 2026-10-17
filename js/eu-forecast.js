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
    next: L('Próxima previsión', 'Next forecast', 'Prochaine prévision', 'Prossima previsione'), later: L('Después', 'Later', 'Ensuite', 'Poi'),
    unit: L('Miles de cabezas de ganado', 'Thousand head of livestock', 'Milliers de têtes de bétail', 'Migliaia di capi di bestiame'), per: L('S1 y S2 = primer y segundo semestre; Q1 a Q4 = trimestres. ▲▼ comparan con el último dato observado.', 'S1 and S2 = first and second half-year; Q1 to Q4 = quarters. ▲▼ compare with the last observed figure.', 'S1 et S2 = premier et second semestre ; Q1 à Q4 = trimestres. ▲▼ comparent avec la dernière valeur observée.', 'S1 e S2 = primo e secondo semestre; Q1-Q4 = trimestri. ▲▼ confrontano con l’ultimo dato osservato.'),
    item: L('Concepto', 'Item', 'Élément', 'Voce'), last: L('Último dato observado', 'Last observed', 'Dernière valeur observée', 'Ultimo dato osservato'), fc: L('previsión', 'forecast', 'prévision', 'previsione'),
    note: L('La variación (%) frente al último dato observado la calcula Dehesa Index. Las previsiones las revisa Eurostat con cada actualización.', 'The change (%) against the last observed figure is calculated by Dehesa Index. Eurostat revises the forecasts with each update.', 'La variation (%) par rapport à la dernière valeur observée est calculée par Dehesa Index. Eurostat révise les prévisions à chaque mise à jour.', 'La variazione (%) rispetto all’ultimo dato osservato è calcolata da Dehesa Index. Eurostat rivede le previsioni a ogni aggiornamento.'),
    src: L('Fuente:', 'Source:', 'Source :', 'Fonte:'), srcA: L('Eurostat, apro_mt_ppighq y apro_mt_pcatlhs (reutilización según la Decisión 2011/833/UE)', 'Eurostat, apro_mt_ppighq and apro_mt_pcatlhs (reuse under Decision 2011/833/EU)', 'Eurostat, apro_mt_ppighq et apro_mt_pcatlhs (réutilisation selon la décision 2011/833/UE)', 'Eurostat, apro_mt_ppighq e apro_mt_pcatlhs (riutilizzo ai sensi della decisione 2011/833/UE)')
  };
  var G = { cattle: ['🐄', L('Vacuno', 'Cattle', 'Bovins', 'Bovini')], sheep: ['🐑', L('Ovino y caprino', 'Sheep and goats', 'Ovins et caprins', 'Ovini e caprini')], pigs: ['🐖', L('Porcino', 'Pigs', 'Porcins', 'Suini')] };
  var GROUP = function (n) { return /sheep|goat/i.test(n) ? 'sheep' : /pig/i.test(n) ? 'pigs' : 'cattle'; };
  var NM = { 'Live bovine animals': L('Bovinos vivos', 'Live cattle', 'Bovins vivants', 'Bovini vivi'), 'Bovine animals, less than 1 year old': L('Bovinos de menos de 1 año', 'Cattle under 1 year', 'Bovins de moins d’un an', 'Bovini sotto 1 anno'), 'Bovine animals, 1 year old or over': L('Bovinos de 1 año o más', 'Cattle 1 year or over', 'Bovins d’un an ou plus', 'Bovini da 1 anno in su'), 'Male bovine animals, 1 year old or over': L('Machos bovinos de 1 año o más', 'Male cattle 1 year or over', 'Mâles bovins d’un an ou plus', 'Maschi bovini da 1 anno in su'), 'Heifers': L('Novillas', 'Heifers', 'Génisses', 'Giovenche'), 'Cows': L('Vacas', 'Cows', 'Vaches', 'Vacche'), 'Live sheep and goats': L('Ovino y caprino vivo', 'Live sheep and goats', 'Ovins et caprins vivants', 'Ovini e caprini vivi'), 'Live sheep': L('Ovino vivo', 'Live sheep', 'Ovins vivants', 'Ovini vivi'), 'Live goats': L('Caprino vivo', 'Live goats', 'Caprins vivants', 'Caprini vivi'), 'Pigs': L('Cerdos vivos', 'Live pigs', 'Porcs vivants', 'Suini vivi') };
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
        var sh = short(s.label), raw = /\(pigs\)/.test(s.label) ? 'Pigs' : sh[0], g = GROUP(raw), lastO = s.obs[s.obs.length - 1];
        var nm = NM[raw] ? NM[raw][i] : (tl && tl.tl ? (tl.tl(raw, lg) || raw) : raw);
        return { nm: nm, g: g, last: lastO, fc: s.fc };
      }).filter(function (x) { return x.fc.length; });
      if (!rows.length) return false;
      var pf = function (p) { var m = /^(\d{4})-([SQ]\d)$/.exec(p); return m ? m[2] + ' ' + m[1] : p; };
      var chg = function (f, base) { if (!base || f == null) return ''; var c = (f / base - 1) * 100, up = c >= 0; return '<span class="ef-chg ' + (up ? 'up' : 'dn') + '">' + (up ? '▲ +' : '▼ ') + nf(c) + ' %</span>'; };
      var order = ['cattle', 'sheep', 'pigs'], out = '';
      order.forEach(function (g) {
        var rs = rows.filter(function (x) { return x.g === g; }); if (!rs.length) return;
        out += '<h3 class="ef-gh">' + G[g][0] + ' ' + esc(G[g][1][i]) + '</h3><div class="di-table-wrap"><table class="di-table di-cards-m ef-tbl" data-no-rows data-sort-ready="0"><thead><tr><th scope="col">' + esc(T.item[i]) + '</th><th scope="col" class="num">' + esc(T.last[i]) + '</th><th scope="col" class="num">' + esc(T.next[i]) + '</th><th scope="col">' + esc(T.later[i]) + '</th></tr></thead><tbody>' + rs.map(function (x) {
          var base = x.last ? x.last[1] : null, f0 = x.fc[0];
          return '<tr><th scope="row">' + esc(x.nm) + '</th><td class="num" data-label="' + esc(T.last[i]) + '">' + (x.last ? '<b>' + nf(x.last[1]) + '</b> <span class="fsh-m">' + esc(pf(x.last[0])) + '</span>' : '—') + '</td>' +
            '<td class="num" data-label="' + esc(T.next[i]) + '"><b>' + nf(f0[1]) + '</b> <span class="fsh-m">' + esc(pf(f0[0])) + '</span> ' + chg(f0[1], base) + '</td>' +
            '<td data-label="' + esc(T.later[i]) + '">' + (x.fc.length > 1 ? x.fc.slice(1).map(function (q) { return '<span class="ef-chip">' + esc(pf(q[0])) + ' <b>' + nf(q[1]) + '</b> ' + chg(q[1], base) + '</span>'; }).join('') : '<span class="fsh-m">—</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      });
      el.innerHTML = '<section class="di-card ps-rm gb-card" id="ps-eu-forecast" style="max-width:none"><h2 class="ps-rm-h">' + esc(T.h[i]) + '</h2><p class="di-movers-hint" style="margin:0 0 4px">' + esc(T.sub[i]) + '</p><p class="di-movers-hint" style="margin:0 0 6px"><b>' + esc(T.unit[i]) + '</b> · ' + esc(T.per[i]) + '</p>' + out +
        '<p class="di-movers-hint" style="margin:10px 0 0;max-width:860px">' + esc(T.note[i]) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(T.src[i]) + ' <a href="https://ec.europa.eu/eurostat/databrowser/view/apro_mt_ppighq" rel="noopener" target="_blank">' + esc(T.srcA[i]) + '</a></p></section>';
      return true;
    });
  }
  global.DIEuForecast = { mount: mount };
})(window);
