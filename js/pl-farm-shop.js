/* Dehesa Index — Polonia: del campo a la tienda (precio al agricultor frente a precio al consumo, GUS).
   data/poland-farm-shop.json (scripts/update-poland.py). Se monta en la ficha de Polonia (paises.js): DIPlFarmShop.mount(el, lang). Si el fichero no existe el bloque no se dibuja. ES5.
   No es un margen: el agricultor cobra por litro o por kg de peso vivo y la tienda por litro o por kg de un corte; se muestran las dos series de GUS y su cociente. */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Del campo a la tienda en Polonia', badge: 'DATOS OFICIALES REALES', pair: 'Producto', year: 'Año', milk: 'Leche de vaca', pork: 'Cerdo', beef: 'Vacuno',
      farm: 'Precio al agricultor (acopio)', retail: 'Precio en tienda', gap: 'Diferencia', ratio: 'Veces el precio al agricultor', farmShort: 'Agricultor', hover: 'Pasa el cursor o toca la gráfica para ver cada año', noData: 'sin dato', all: 'Ver todos los años', yr: 'Año', evo: 'Evolución',
      note: 'Medias anuales de GUS: el precio que cobra el agricultor al vender (acopio) y el que paga el consumidor en tienda. No es un margen comercial: el agricultor cobra por litro o por kilo de peso vivo del animal y la tienda por kilo de un corte ya despiezado, así que la diferencia incluye rendimiento en canal, despiece, transformación, transporte, impuestos y beneficio de cada eslabón. Precios corrientes, sin deflactar.',
      src: 'Fuente:', srcN: 'GUS, Banco de Datos Locales: precios de acopio (P1458) y precios al consumo de carne, grasas y lácteos (P1463, P1464)', cite: 'Diferencias y cocientes: cálculo de Dehesa Index.', mk: 'Dos medias anuales de GUS, desde 1999', ty: 'Precio medio anual (PLN)', ob: 'Un dato por año y serie; los huecos se muestran como «sin dato»' },
    en: { h: 'From farm to shop in Poland', badge: 'REAL OFFICIAL DATA', pair: 'Product', year: 'Year', milk: 'Cow’s milk', pork: 'Pork', beef: 'Beef',
      farm: 'Farm price (procurement)', retail: 'Shop price', gap: 'Difference', ratio: 'Times the farm price', farmShort: 'Farm', hover: 'Hover or tap the chart to see each year', noData: 'no figure', all: 'Show all years', yr: 'Year', evo: 'Trend',
      note: 'GUS annual averages: the price the farmer receives when selling (procurement) and the price the consumer pays in the shop. This is not a trade margin: the farmer is paid per litre or per kilo of live animal weight and the shop charges per kilo of a cut, so the difference includes carcass yield, cutting, processing, transport, taxes and each link’s profit. Current prices, not adjusted for inflation.',
      src: 'Source:', srcN: 'GUS, Local Data Bank: procurement prices (P1458) and retail prices of meat, fats and dairy (P1463, P1464)', cite: 'Differences and ratios: calculated by Dehesa Index.', mk: 'Two GUS annual averages, since 1999', ty: 'Annual average price (PLN)', ob: 'One figure per year and series; gaps are shown as “no figure”' },
    fr: { h: 'Du champ au magasin en Pologne', badge: 'DONNÉES OFFICIELLES RÉELLES', pair: 'Produit', year: 'Année', milk: 'Lait de vache', pork: 'Porc', beef: 'Bœuf',
      farm: 'Prix à l’agriculteur (collecte)', retail: 'Prix en magasin', gap: 'Écart', ratio: 'Multiple du prix à la ferme', farmShort: 'Ferme', hover: 'Survolez ou touchez le graphique pour voir chaque année', noData: 'pas de chiffre', all: 'Voir toutes les années', yr: 'Année', evo: 'Évolution',
      note: 'Moyennes annuelles de GUS : le prix perçu par l’agriculteur à la vente (collecte) et celui payé par le consommateur en magasin. Ce n’est pas une marge commerciale : l’agriculteur est payé au litre ou au kilo de poids vif et le magasin au kilo d’une pièce découpée ; l’écart inclut donc rendement carcasse, découpe, transformation, transport, taxes et profit de chaque maillon. Prix courants, non déflatés.',
      src: 'Source :', srcN: 'GUS, Banque de données locales : prix de collecte (P1458) et prix à la consommation de viande, graisses et produits laitiers (P1463, P1464)', cite: 'Écarts et multiples : calcul de Dehesa Index.', mk: 'Deux moyennes annuelles de GUS, depuis 1999', ty: 'Prix moyen annuel (PLN)', ob: 'Un chiffre par année et série ; les trous sont affichés « pas de chiffre »' },
    it: { h: 'Dal campo al negozio in Polonia', badge: 'DATI UFFICIALI REALI', pair: 'Prodotto', year: 'Anno', milk: 'Latte vaccino', pork: 'Maiale', beef: 'Manzo',
      farm: 'Prezzo all’agricoltore (conferimento)', retail: 'Prezzo al negozio', gap: 'Differenza', ratio: 'Volte il prezzo in azienda', farmShort: 'Azienda', hover: 'Passa il cursore o tocca il grafico per vedere ogni anno', noData: 'nessun dato', all: 'Vedi tutti gli anni', yr: 'Anno', evo: 'Andamento',
      note: 'Medie annue di GUS: il prezzo che l’agricoltore incassa alla vendita (conferimento) e quello che il consumatore paga in negozio. Non è un margine commerciale: l’agricoltore è pagato al litro o al chilo di peso vivo e il negozio al chilo di un taglio già sezionato, quindi la differenza include resa alla macellazione, sezionamento, trasformazione, trasporto, imposte e utile di ogni anello. Prezzi correnti, non deflazionati.',
      src: 'Fonte:', srcN: 'GUS, Banca dati locale: prezzi di conferimento (P1458) e prezzi al consumo di carne, grassi e latticini (P1463, P1464)', cite: 'Differenze e rapporti: calcolo di Dehesa Index.', mk: 'Due medie annue di GUS, dal 1999', ty: 'Prezzo medio annuo (PLN)', ob: 'Un dato per anno e serie; i vuoti sono mostrati come «nessun dato»' }
  };
  var NM = { 'pl-gus-retail-4941': { en: 'Milk 3-3.5% (UHT, carton)', es: 'Leche 3-3,5 % (UHT, brik)', fr: 'Lait 3-3,5 % (UHT, brique)', it: 'Latte 3-3,5 % (UHT, cartone)' },
    'pl-gus-retail-4920': { en: 'Pork, centre loin (bone-in)', es: 'Cerdo, lomo con hueso', fr: 'Porc, longe avec os', it: 'Maiale, lonza con osso' }, 'pl-gus-retail-4927': { en: 'Boiled ham', es: 'Jamón cocido', fr: 'Jambon cuit', it: 'Prosciutto cotto' },
    'pl-gus-retail-4922': { en: 'Beef, roast (bone-in)', es: 'Vacuno, asado con hueso', fr: 'Bœuf, rôti avec os', it: 'Manzo, arrosto con osso' }, 'pl-gus-retail-4923': { en: 'Beef, boneless (gammon)', es: 'Vacuno, pieza sin hueso', fr: 'Bœuf, pièce désossée', it: 'Manzo, pezzo disossato' },
    'pl-gus-proc-4876': { en: 'Cow’s milk (per l)', es: 'Leche de vaca (por l)', fr: 'Lait de vache (par l)', it: 'Latte vaccino (per l)' }, 'pl-gus-proc-4875': { en: 'Pigs, live weight (per kg)', es: 'Cerdo, peso vivo (por kg)', fr: 'Porcs, poids vif (par kg)', it: 'Suini, peso vivo (per kg)' },
    'pl-gus-proc-4873': { en: 'Cattle, live weight (per kg)', es: 'Vacuno, peso vivo (por kg)', fr: 'Bovins, poids vif (par kg)', it: 'Bovini, peso vivo (per kg)' } };
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, LX = { en: 0, es: 1, fr: 2, it: 3 };
  var ST = { p: 'milk', s: 0, year: null }, SCR = {}, CACHE = null;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function fmt(v, lg, d) { return v == null ? '—' : v.toLocaleString(LOC[lg], { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d, useGrouping: 'always' }); }
  function row(l, v) { return '<div class="di-info-stat-row"><span class="di-info-stat-label">' + esc(l) + '</span><span class="di-info-stat-value">' + v + '</span></div>'; }
  function script(src, have) {
    if (have()) return Promise.resolve();
    return SCR[src] || (SCR[src] = new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
  }
  function load() { return CACHE || (CACHE = fetch('data/poland-farm-shop.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function nm(s, lg) { var n = NM[s.id]; return n ? (n[lg] || n.en) : s.label; }
  function sel(label, cls, arr, cur) {
    return '<label class="wp-sel"><span>' + esc(label) + '</span><select class="di-compare-select ' + cls + '" data-chips aria-label="' + esc(label) + '">' + arr.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function chart(p, farm, ret, lg) {
    var t = T[lg], Y = p.years, i, lo = 1e18, hi = 0, W = 560, H = 210, L = 44, R = 14, Tp = 16, B = 24;
    var all = [farm].concat([ret]);
    all.forEach(function (s) { s.values.forEach(function (v) { if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }); });
    lo = 0; var raw = hi / 4, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / mag, stp = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag; hi = Math.ceil(hi / stp) * stp;
    var y0 = Y[0], y1 = Y[Y.length - 1], X = function (y) { return L + (y - y0) / Math.max(1, y1 - y0) * (W - L - R); }, Yy = function (v) { return Tp + (hi - v) / (hi - lo) * (H - Tp - B); };
    var grid = '', gv, paths = [];
    for (gv = 0; gv <= hi + 1e-9; gv += stp) grid += '<line class="wp-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Yy(gv).toFixed(1) + '" y2="' + Yy(gv).toFixed(1) + '"/><text class="wp-tick" x="' + (L - 5) + '" y="' + (Yy(gv) + 3).toFixed(1) + '" text-anchor="end">' + esc(fmt(gv, lg, stp < 1 ? 1 : 0)) + '</text>';
    for (i = 0; i < Y.length; i++) if (Y[i] % 5 === 0 || i === Y.length - 1) grid += '<text class="wp-tick" x="' + X(Y[i]).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + Y[i] + '</text>';
    all.forEach(function (s, k) {
      var d = '', go = false;
      for (i = 0; i < Y.length; i++) { if (s.values[i] == null) { go = false; continue; } d += (go ? 'L' : 'M') + X(Y[i]).toFixed(1) + ' ' + Yy(s.values[i]).toFixed(1); go = true; }
      paths.push('<path class="wp-line ' + (k ? 'wp-line-t' : '') + '" d="' + d + '"' + (k ? '' : ' style="stroke:#b5651d;stroke-width:2;fill:none;stroke-dasharray:6 3"') + '/>');
    });
    var lgd = '<div class="wp-readout" aria-live="polite" data-def="' + esc(t.hover) + '">' + esc(t.hover) + '</div>';
    return { html: '<div class="di-info-card-title gb-sub">' + esc(t.evo) + '</div><div class="wp-chart gb-chart">' + lgd + '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.evo + ' · ' + nm(farm, lg) + ' / ' + nm(ret, lg)) + '">' + grid + paths.join('') + '<line class="wp-cross" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="display:none"/></svg>' +
      '<div class="di-field-hint" style="margin-top:6px">— ' + esc(nm(ret, lg)) + ' &nbsp; ┄ ' + esc(nm(farm, lg)) + '</div></div>', X: X, W: W, Y: Y, farm: farm, ret: ret };
  }
  function bindChart(root, c, lg) {
    var box = root.querySelector('.gb-chart'); if (!box) return;
    var svg = box.querySelector('svg'), ro = box.querySelector('.wp-readout'), cr = box.querySelector('.wp-cross'), t = T[lg], unit = c.ret.unit;
    function at(ev) {
      var r = svg.getBoundingClientRect(), cx = ev.touches ? ev.touches[0].clientX : ev.clientX, vx = (cx - r.left) / r.width * c.W, best = 0, bd = 1e9, j;
      for (j = 0; j < c.Y.length; j++) { var dd = Math.abs(c.X(c.Y[j]) - vx); if (dd < bd) { bd = dd; best = j; } }
      var px = c.X(c.Y[best]); cr.setAttribute('x1', px); cr.setAttribute('x2', px); cr.style.display = '';
      ro.innerHTML = '<b>' + c.Y[best] + '</b> · ' + esc(t.farmShort) + ' <b>' + fmt(c.farm.values[best], lg) + '</b> · ' + esc(t.retail) + ' <b>' + fmt(c.ret.values[best], lg) + '</b> ' + esc(unit);
    }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchstart', at, { passive: true }); svg.addEventListener('touchmove', at, { passive: true });
    svg.addEventListener('mouseleave', function () { cr.style.display = 'none'; ro.textContent = t.hover; });
  }
  function mount(el, lg) {
    if (!el) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    return load().then(function (d) {
      if (!d || !d.pairs || !d.pairs.length) { el.hidden = true; return false; }
      var t = T[lg], P = {}; d.pairs.forEach(function (p) { P[p.id] = p; });
      function draw(focus) {
        if (!P[ST.p]) ST.p = d.pairs[0].id;
        var p = P[ST.p], farm = p.series.filter(function (s) { return s.role === 'farm'; })[0], rets = p.series.filter(function (s) { return s.role === 'retail'; });
        if (ST.s >= rets.length) ST.s = 0;
        var ret = rets[ST.s], Y = p.years, last = Y.length - 1, i;
        while (last > 0 && (farm.values[last] == null || ret.values[last] == null)) last--;
        if (ST.year == null || Y.indexOf(ST.year) < 0) ST.year = Y[last];
        var yi = Y.indexOf(ST.year), fv = farm.values[yi], rv = ret.values[yi], u = ret.unit;
        var stat = row(t.farm + ' · ' + ST.year, fv != null ? '<b>' + fmt(fv, lg) + ' ' + esc(u) + '</b>' : esc(t.noData)) + row(t.retail + ' · ' + ST.year, rv != null ? '<b>' + fmt(rv, lg) + ' ' + esc(u) + '</b>' : esc(t.noData)) +
          (fv && rv ? row(t.gap, fmt(rv - fv, lg) + ' ' + esc(u)) + row(t.ratio, '<b>' + fmt(rv / fv, lg, 1) + '×</b>') : '');
        var head = sel(t.pair, 'fs-p', d.pairs.map(function (q) { return [q.id, t[q.id]]; }), ST.p) + (rets.length > 1 ? sel(t.retail, 'fs-s', rets.map(function (s, k) { return [k, nm(s, lg)]; }), ST.s) : '') + sel(t.year, 'fs-y', Y.slice().reverse().map(function (y) { return [y, String(y)]; }), ST.year);
        var rows = ''; for (i = Y.length - 1; i >= 0; i--) if (farm.values[i] != null && ret.values[i] != null) rows += '<tr><td>' + Y[i] + '</td><td>' + fmt(farm.values[i], lg) + '</td><td>' + fmt(ret.values[i], lg) + '</td><td>' + fmt(ret.values[i] / farm.values[i], lg, 1) + '×</td></tr>';
        var tbl = '<details class="gb-all"><summary>' + esc(t.all) + '</summary><div class="gb-tw"><table class="di-table"><thead><tr><th>' + esc(t.yr) + '</th><th>' + esc(t.farmShort + ' (' + u + ')') + '</th><th>' + esc(t.retail + ' (' + u + ')') + '</th><th>' + esc(t.ratio) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
        var c = chart(p, farm, ret, lg);
        var trust = global.DehesaDataTrust ? global.DehesaDataTrust.info({ src: t.srcN, url: d.source.url, fq: 'annual', mk: t.mk, ty: t.ty, ob: t.ob, me: t.note, st: 'official' }, lg) : '';
        el.innerHTML = '<section class="di-card ps-rm wp-card gb-card" id="ps-farm-shop-pl" style="max-width:none"><div class="di-badge di-badge-green di-info-badge">' + esc(t.badge) + '</div><h2 class="ps-rm-h">' + esc(t.h) + '</h2>' +
          '<div class="wd-sels">' + head + '</div><div class="di-info-stat-list" style="max-width:640px">' + stat + '</div>' + c.html + tbl + trust +
          '<p class="di-movers-hint" style="margin:10px 0 0">' + esc(t.note) + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(t.src) + ' <a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.srcN) + '</a>. ' + esc(t.cite) + '</p></section>';
        el.hidden = false; bindChart(el, c, lg);
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
      }
      draw();
      if (!el.getAttribute('data-fs')) {
        el.setAttribute('data-fs', '1');
        el.addEventListener('change', function (ev) {
          var cl = ' ' + (ev.target.className || '') + ' ', v = ev.target.value;
          if (cl.indexOf(' fs-p ') >= 0) { ST.p = v; ST.s = 0; draw('.fs-p'); } else if (cl.indexOf(' fs-s ') >= 0) { ST.s = parseInt(v, 10); draw('.fs-s'); } else if (cl.indexOf(' fs-y ') >= 0) { ST.year = parseInt(v, 10); draw('.fs-y'); }
        });
      }
      return true;
    });
  }
  global.DIPlFarmShop = { mount: mount };
})(window);
