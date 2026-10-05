/* Dehesa Index — Vista por sector: «Agricultura · Ganadería · Ambos» (ficha de país y ficha de región). ES5, sin librerías.
   No borra datos: lo que no corresponde a la vista elegida se pliega al final con un «mostrar». Lo común (clima, cuentas agrarias, comercio, costes, seguros, índices…) se ve siempre.
   La elección se guarda solo en este navegador (localStorage, si está disponible); sin cuentas. */
(function () {
  'use strict';
  var KEY = 'di-sector-v1', CUR = null, subs = [];
  var T = {
    es: { lab: 'Ver los datos de', all: 'Ambos', agri: 'Agricultura', live: 'Ganadería', hint: 'Lo común (clima, cuentas, comercio, costes, seguros) se ve siempre. Se guarda en este navegador.', fold: { agri: '{n} bloques de agricultura plegados', live: '{n} bloques de ganadería plegados' }, fold1: { agri: '1 bloque de agricultura plegado', live: '1 bloque de ganadería plegado' }, show: 'mostrar', og: { agri: 'Agricultura', live: 'Ganadería', common: 'Común' } },
    en: { lab: 'Show data for', all: 'Both', agri: 'Crops', live: 'Livestock', hint: 'Shared data (weather, accounts, trade, costs, insurance) is always shown. Saved in this browser.', fold: { agri: '{n} crop blocks folded', live: '{n} livestock blocks folded' }, fold1: { agri: '1 crop block folded', live: '1 livestock block folded' }, show: 'show', og: { agri: 'Crops', live: 'Livestock', common: 'Shared' } },
    fr: { lab: 'Afficher les données', all: 'Les deux', agri: 'Cultures', live: 'Élevage', hint: 'Les données communes (climat, comptes, commerce, coûts, assurances) restent visibles. Enregistré dans ce navigateur.', fold: { agri: '{n} blocs cultures repliés', live: '{n} blocs élevage repliés' }, fold1: { agri: '1 bloc cultures replié', live: '1 bloc élevage replié' }, show: 'afficher', og: { agri: 'Cultures', live: 'Élevage', common: 'Commun' } },
    it: { lab: 'Mostra i dati di', all: 'Entrambi', agri: 'Agricoltura', live: 'Allevamento', hint: 'I dati comuni (clima, conti, commercio, costi, assicurazioni) restano visibili. Salvato in questo browser.', fold: { agri: '{n} blocchi di agricoltura chiusi', live: '{n} blocchi di allevamento chiusi' }, fold1: { agri: '1 blocco di agricoltura chiuso', live: '1 blocco di allevamento chiuso' }, show: 'mostra', og: { agri: 'Agricoltura', live: 'Allevamento', common: 'Comune' } }
  };
  // grupos de series de los ficheros *-stats.json. Los mixtos (producción, comercio, índices…) se deciden serie a serie por la etiqueta.
  var GROUP = { crops: 'agri', crops_regions: 'agri', prices: 'agri', prices_fv: 'agri', inputs_f: 'agri',
    livestock: 'live', prices_lv: 'live', milk: 'live', meat_regions: 'live', milk_regions: 'live', inputs_a: 'live' };
  var MIXED = { production: 1, trade: 1, idx_perc: 1, idx_pag: 1, stocks: 1, inputs: 1, organic: 1, quotes: 1, prices_paid: 1, costs: 1 };
  var RX_LIVE = /\b(cattle|bovine|beef|veal|calf|calves|cows?|bulls?|heifers?|steers?|pigs?|swine|hogs?|pork|piglets?|sows?|sheep|lambs?|ovine|mutton|goats?|caprine|milk|dairy|butter|cheese|cream|whey|eggs?|hens?|poultry|chickens?|broilers?|turkeys?|ducks?|geese|meat|slaughter\w*|carcass\w*|livestock|animals?|wool|honey|rabbits?|horses?|equine|feed\w*|fodder|vacuno|bovino|porcino|ovino|caprino|leche|l[aá]cteos?|huevos?|aves|pollos?|cerdos?|corderos?|ganad\w*|sacrificio|piensos?|carne)\b/i;
  var RX_AGRI = /\b(wheat|maize|corn|barley|oats|rye|rice|triticale|sorghum|soy\w*|rapeseed|canola|sunflower\w*|potato\w*|sugar|beet\w*|wine|grapes?|must|vine\w*|olives?|fruits?|apples?|pears?|citrus|oranges?|vegetables?|tomato\w*|onions?|cereals?|crops?|harvest\w*|seeds?|fertili\w*|nitrogen|urea|phosph\w*|potash|pulses?|peas|beans|flax|hemp|chicory|tobacco|cotton|cabbage|lettuce|trigo|ma[ií]z|cebada|avena|centeno|arroz|soja|colza|girasol|patatas?|remolacha|vino|uvas?|aceit\w*|olivar|frutas?|hortalizas|cereales|cultivos?|abonos?|fertilizantes?)\b/i;
  var MOD = { // bloques de region.js y region-more.js
    ercrops: 'agri', crops: 'agri', cacrops: 'agri', escrops: 'agri', cere: 'agri', deprod: 'agri', nlcrops: 'agri', bids: 'agri', fert: 'agri',
    usprices: 'agri', usstocks: 'agri', usarc: 'agri', usslaughter: 'live', usdairy: 'live', erlive: 'live', cattle: 'live', lvst: 'live', eslv: 'live', essl: 'live', esmilk: 'live', delive: 'live', mb: 'live', local: 'live', deprices: 'live' };
  // bloques de detalle de la ficha de país (paises.html)
  var DETAIL = { 'ps-us': 'common', 'ps-mb': 'live', 'ps-es': 'agri', 'ps-de': 'agri', 'ps-ifap': 'agri' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function get() { if (CUR) return CUR; var v = null; try { v = window.localStorage.getItem(KEY); } catch (e) {} CUR = v === 'agri' || v === 'live' ? v : 'all'; return CUR; }
  function set(v) { CUR = v === 'agri' || v === 'live' ? v : 'all'; try { window.localStorage.setItem(KEY, CUR); } catch (e) {} subs.forEach(function (f) { try { f(CUR); } catch (e) {} }); }
  function ofSeries(s) {
    if (!s) return 'common'; var g = GROUP[s.group]; if (g) return g; if (!MIXED[s.group]) return 'common';
    var l = String(s.label || ''), lv = RX_LIVE.test(l), ag = RX_AGRI.test(l);
    return lv && !ag ? 'live' : ag && !lv ? 'agri' : 'common';
  }
  function ofGroup(g) { return GROUP[g] || 'common'; }
  function ofModule(k) { return MOD[k] || 'common'; }
  function ofDetail(id) { return DETAIL[id] || 'common'; }
  function visible(sec) { var c = get(); return c === 'all' || sec === 'common' || sec === c; }
  function other() { var c = get(); return c === 'agri' ? 'live' : c === 'live' ? 'agri' : null; }
  function barHtml() {
    var x = t(), c = get();
    return '<div class="sec-bar" role="group" aria-label="' + esc(x.lab) + '"><span class="sec-lab">' + esc(x.lab) + '</span>' + ['all', 'agri', 'live'].map(function (k) {
      return '<button type="button" class="sec-btn" data-sec="' + k + '" aria-pressed="' + (k === c ? 'true' : 'false') + '">' + esc(x[k]) + '</button>'; }).join('') + '<span class="sec-hint">' + esc(x.hint) + '</span></div>';
  }
  function bind(root, onChange) {
    if (!root) return; root.onclick = function (e) { var b = e.target.closest ? e.target.closest('[data-sec]') : null; if (!b) return; var v = b.getAttribute('data-sec'); if (v === get()) return; set(v); if (onChange) onChange(v); };
  }
  function foldHtml(n, inner) {
    var o = other(); if (!o || !n) return inner || ''; var x = t();
    return '<details class="sec-fold"><summary>' + esc(n === 1 ? x.fold1[o] : x.fold[o].replace('{n}', n)) + ' · <span class="sec-show">' + esc(x.show) + '</span></summary>' + inner + '</details>';
  }
  window.DehesaSector = { get: get, set: set, ofSeries: ofSeries, ofGroup: ofGroup, ofModule: ofModule, ofDetail: ofDetail, visible: visible, other: other, barHtml: barHtml, bind: bind, foldHtml: foldHtml,
    label: function (k) { return t().og[k] || k; }, onChange: function (f) { subs.push(f); } };
})();
