/* Dehesa Index — calendario oficial de USDA (NASS + WASDE), módulo compartido. ES5, navegador y Node.
   Lee data/usda-calendar.json (lo escribe scripts/update-usda-calendar.py a partir de las páginas oficiales) y responde:
   próxima fecha / última fecha de un informe, y qué sale en los próximos días. NUNCA calcula ni inventa fechas: si el informe
   no está en el fichero devuelve null. Las fechas y horas son las que publica el organismo (hora del este de EE. UU., ET).
   DIUsdaCal.load() -> Promise<doc|null>; .next(doc, id, todayIso); .last(doc, id, todayIso); .upcoming(doc, todayIso, days, ids); .today() */
(function (root) {
  'use strict';
  var NAMES = {
    'wasde': { es: 'WASDE (oferta y demanda mundial)', en: 'WASDE (world supply and demand)', fr: 'WASDE (offre et demande mondiales)', it: 'WASDE (offerta e domanda mondiali)' },
    'crop-production': { es: 'Crop Production (producción de cultivos)', en: 'Crop Production', fr: 'Crop Production (production des cultures)', it: 'Crop Production (produzione delle colture)' },
    'crop-progress': { es: 'Crop Progress (estado de los cultivos)', en: 'Crop Progress', fr: 'Crop Progress (état des cultures)', it: 'Crop Progress (stato delle colture)' },
    'cattle-on-feed': { es: 'Cattle on Feed (ganado en cebaderos)', en: 'Cattle on Feed', fr: 'Cattle on Feed (bovins en engraissement)', it: 'Cattle on Feed (bovini in ingrasso)' },
    'milk-production': { es: 'Milk Production (producción de leche)', en: 'Milk Production', fr: 'Milk Production (production de lait)', it: 'Milk Production (produzione di latte)' },
    'hogs-and-pigs': { es: 'Hogs and Pigs (inventario porcino)', en: 'Hogs and Pigs', fr: 'Hogs and Pigs (cheptel porcin)', it: 'Hogs and Pigs (patrimonio suino)' },
    'grain-stocks': { es: 'Grain Stocks (existencias de granos)', en: 'Grain Stocks', fr: 'Grain Stocks (stocks de grains)', it: 'Grain Stocks (scorte di cereali)' },
    'agricultural-prices': { es: 'Agricultural Prices (precios agrarios)', en: 'Agricultural Prices', fr: 'Agricultural Prices (prix agricoles)', it: 'Agricultural Prices (prezzi agricoli)' },
    'cold-storage': { es: 'Cold Storage (existencias en frío)', en: 'Cold Storage', fr: 'Cold Storage (stocks frigorifiques)', it: 'Cold Storage (scorte frigorifere)' }
  };
  var FEATURED = ['wasde', 'crop-production', 'crop-progress', 'cattle-on-feed', 'milk-production', 'hogs-and-pigs', 'grain-stocks', 'agricultural-prices', 'cold-storage'];
  var MON = { es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'] };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtDate(iso, lang) {
    var p = String(iso).split('-'), m = (MON[lang] || MON.es)[+p[1] - 1];
    return lang === 'en' ? m + ' ' + (+p[2]) + ', ' + p[0] : (+p[2]) + ' ' + m + ' ' + p[0];
  }
  function days(a, b) { var x = a.split('-'), y = b.split('-'); return Math.round((Date.UTC(+y[0], +y[1] - 1, +y[2]) - Date.UTC(+x[0], +x[1] - 1, +x[2])) / 86400000); }
  function rows(doc, id) { return (doc && doc.releases || []).filter(function (r) { return r.id === id; }); }
  function next(doc, id, t) { t = t || today(); var r = rows(doc, id).filter(function (x) { return x.date >= t; }); return r.length ? r[0] : null; }
  function last(doc, id, t) { t = t || today(); var r = rows(doc, id).filter(function (x) { return x.date < t; }); return r.length ? r[r.length - 1] : null; }
  function upcoming(doc, t, n, ids) {
    t = t || today(); ids = ids || FEATURED;
    return (doc && doc.releases || []).filter(function (r) { var d = days(t, r.date); return d >= 0 && d <= n && ids.indexOf(r.id) >= 0; });
  }
  function timeTxt(r) { return r && r.time ? r.time + ' ET' : ''; }
  var P = null;
  function load(url) {
    if (P) return P;
    var u = url || 'data/usda-calendar.json';
    P = (typeof fetch === 'function' ? fetch(u).then(function (r) { return r.ok ? r.json() : null; }) : Promise.resolve(null)).catch(function () { return null; });
    return P;
  }
  var API = { NAMES: NAMES, FEATURED: FEATURED, load: load, next: next, last: last, upcoming: upcoming, days: days, fmtDate: fmtDate, timeTxt: timeTxt, today: today };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.DIUsdaCal = API;
})(typeof window !== 'undefined' ? window : this);
