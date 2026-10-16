/* Dehesa Index — Vista por sector: «Todo · Agricultura · Ganadería · Pesca» (ficha de país y ficha de región). ES5, sin librerías.
   No borra datos: lo que no corresponde a la vista elegida se pliega al final con un «mostrar». Lo común (clima, cuentas agrarias, comercio, costes, seguros, índices…) se ve siempre.
   La elección se guarda solo en este navegador (localStorage, si está disponible); sin cuentas. */
(function () {
  'use strict';
  var KEY = 'di-sector-v1', CUR = null, subs = [];
  var T = {
    es: { lab: 'Ver los datos de', all: 'Todo', agri: 'Agricultura', live: 'Ganadería', fish: 'Pesca', hint: 'Lo común (clima, cuentas, comercio, costes, seguros) se ve siempre. Se guarda en este navegador.', fold: '{n} bloques de otros sectores plegados', fold1: '1 bloque de otro sector plegado', show: 'mostrar', og: { agri: 'Agricultura', live: 'Ganadería', fish: 'Pesca y acuicultura', common: 'Común' } },
    en: { lab: 'Show data for', all: 'All', agri: 'Crops', live: 'Livestock', fish: 'Fishing', hint: 'Shared data (weather, accounts, trade, costs, insurance) is always shown. Saved in this browser.', fold: '{n} blocks from other sectors folded', fold1: '1 block from another sector folded', show: 'show', og: { agri: 'Crops', live: 'Livestock', fish: 'Fishing and aquaculture', common: 'Shared' } },
    fr: { lab: 'Afficher les données', all: 'Tout', agri: 'Cultures', live: 'Élevage', fish: 'Pêche', hint: 'Les données communes (climat, comptes, commerce, coûts, assurances) restent visibles. Enregistré dans ce navigateur.', fold: '{n} blocs d’autres secteurs repliés', fold1: '1 bloc d’un autre secteur replié', show: 'afficher', og: { agri: 'Cultures', live: 'Élevage', fish: 'Pêche et aquaculture', common: 'Commun' } },
    it: { lab: 'Mostra i dati di', all: 'Tutto', agri: 'Agricoltura', live: 'Allevamento', fish: 'Pesca', hint: 'I dati comuni (clima, conti, commercio, costi, assicurazioni) restano visibili. Salvato in questo browser.', fold: '{n} blocchi di altri settori chiusi', fold1: '1 blocco di un altro settore chiuso', show: 'mostra', og: { agri: 'Agricoltura', live: 'Allevamento', fish: 'Pesca e acquacoltura', common: 'Comune' } }
  };
  // grupos de series de los ficheros *-stats.json. Los mixtos (producción, comercio, índices…) se deciden serie a serie por la etiqueta.
  var GROUP = { crops: 'agri', crops_regions: 'agri', prices: 'agri', prices_fv: 'agri', inputs_f: 'agri',
    livestock: 'live', prices_lv: 'live', milk: 'live', meat_regions: 'live', milk_regions: 'live', inputs_a: 'live', fish: 'fish' };
  var SECS = ['agri', 'live', 'fish'];
  var RX_FISH = /\b(fish\w*|seafood|aquacult\w*|salmon|trout|tuna|cod|hake|sardines?|anchov\w*|shrimps?|prawns?|mussels?|oysters?|crustaceans?|molluscs?|pesca\w*|pescados?|acuicult\w*|mariscos?|at[uú]n|merluza|bacalao|salm[oó]n)\b/i;
  var MIXED = { production: 1, trade: 1, idx_perc: 1, idx_pag: 1, stocks: 1, inputs: 1, organic: 1, quotes: 1, prices_paid: 1, costs: 1 };
  var RX_LIVE = /\b(cattle|bovine|beef|veal|calf|calves|cows?|bulls?|heifers?|steers?|pigs?|swine|hogs?|pork|piglets?|sows?|sheep|lambs?|ovine|mutton|goats?|caprine|milk|dairy|butter|cheese|cream|whey|eggs?|hens?|poultry|chickens?|broilers?|turkeys?|ducks?|geese|meat|slaughter\w*|carcass\w*|livestock|animals?|wool|honey|rabbits?|horses?|equine|feed\w*|fodder|vacuno|bovino|porcino|ovino|caprino|leche|l[aá]cteos?|huevos?|aves|pollos?|cerdos?|corderos?|ganad\w*|sacrificio|piensos?|carne)\b/i;
  var RX_AGRI = /\b(wheat|maize|corn|barley|oats|rye|rice|triticale|sorghum|soy\w*|rapeseed|canola|sunflower\w*|potato\w*|sugar|beet\w*|wine|grapes?|must|vine\w*|olives?|fruits?|apples?|pears?|citrus|oranges?|vegetables?|tomato\w*|onions?|cereals?|crops?|harvest\w*|seeds?|fertili\w*|nitrogen|urea|phosph\w*|potash|pulses?|peas|beans|flax|hemp|chicory|tobacco|cotton|cabbage|lettuce|trigo|ma[ií]z|cebada|avena|centeno|arroz|soja|colza|girasol|patatas?|remolacha|vino|uvas?|aceit\w*|olivar|frutas?|hortalizas|cereales|cultivos?|abonos?|fertilizantes?)\b/i;
  var MOD = { // bloques de region.js y region-more.js
    ercrops: 'agri', crops: 'agri', cacrops: 'agri', escrops: 'agri', cere: 'agri', deprod: 'agri', nlcrops: 'agri', bids: 'agri', fert: 'agri',
    usprices: 'agri', eslonjas: 'agri', usstocks: 'agri', usarc: 'agri', usslaughter: 'live', usdairy: 'live', erlive: 'live', cattle: 'live', lvst: 'live', eslv: 'live', essl: 'live', esmilk: 'live', delive: 'live', mb: 'live', local: 'live', deprices: 'live' };
  // bloques de detalle de la ficha de país (paises.html)
  var DETAIL = { 'ps-us': 'common', 'ps-mb': 'live', 'ps-es': 'agri', 'ps-de': 'agri', 'ps-ifap': 'agri' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function get() { if (CUR) return CUR; var v = null; try { v = window.localStorage.getItem(KEY); } catch (e) {} CUR = SECS.indexOf(v) >= 0 ? v : 'all'; return CUR; }
  function set(v) { CUR = SECS.indexOf(v) >= 0 ? v : 'all'; try { window.localStorage.setItem(KEY, CUR); } catch (e) {} subs.forEach(function (f) { try { f(CUR); } catch (e) {} }); }
  function ofSeries(s) {
    if (!s) return 'common'; var g = GROUP[s.group]; if (g) return g; if (!MIXED[s.group]) return 'common';
    var l = String(s.label || ''), lv = RX_LIVE.test(l), ag = RX_AGRI.test(l), fs = RX_FISH.test(l);
    if (fs && !lv && !ag) return 'fish';
    return fs ? 'common' : lv && !ag ? 'live' : ag && !lv ? 'agri' : 'common';
  }
  function ofGroup(g) { return GROUP[g] || 'common'; }
  function ofModule(k) { return MOD[k] || 'common'; }
  function ofDetail(id) { return DETAIL[id] || 'common'; }
  function visible(sec) { var c = get(); return c === 'all' || sec === 'common' || sec === c; }
  function others() { var c = get(); return c === 'all' ? [] : SECS.filter(function (k) { return k !== c; }); }
  function other() { return others()[0] || null; }
  function barHtml() {
    var x = t(), c = get();
    return '<div class="sec-bar" role="group" aria-label="' + esc(x.lab) + '"><span class="sec-lab">' + esc(x.lab) + '</span>' + ['all'].concat(SECS).map(function (k) {
      return '<button type="button" class="sec-btn" data-sec="' + k + '" aria-pressed="' + (k === c ? 'true' : 'false') + '">' + esc(x[k]) + '</button>'; }).join('') + '<span class="sec-hint">' + esc(x.hint) + '</span></div>';
  }
  function bind(root, onChange) {
    if (!root) return; root.onclick = function (e) { var b = e.target.closest ? e.target.closest('[data-sec]') : null; if (!b) return; var v = b.getAttribute('data-sec'); if (v === get()) return; set(v); if (onChange) onChange(v); };
  }
  function foldHtml(n, inner) {
    if (get() === 'all' || !n) return inner || ''; var x = t();
    return '<details class="sec-fold"><summary>' + esc(n === 1 ? x.fold1 : x.fold.replace('{n}', n)) + ' · <span class="sec-show">' + esc(x.show) + '</span></summary>' + inner + '</details>';
  }
  window.DehesaSector = { get: get, set: set, ofSeries: ofSeries, ofGroup: ofGroup, ofModule: ofModule, ofDetail: ofDetail, visible: visible, other: other, others: others, barHtml: barHtml, bind: bind, foldHtml: foldHtml,
    label: function (k) { return t().og[k] || k; }, onChange: function (f) { subs.push(f); } };
})();
