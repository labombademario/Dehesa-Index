/* Dehesa Index — Grecia: leche, sacrificio y lácteos por unidad regional (ELGO-DIMITRA, data.gov.gr, CC BY 4.0).
   data/el-elgo/{milk,meat,dairy}.json (scripts/update-el-elgo.py). Bloque de la ficha de Grecia. ES5. window.DIElElgo. Usa window.ESUI (js/es-ui.js). */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Leche, carne y lácteos de Grecia (ELGO-Dimitra)', tabs: { milk: 'Leche', meat: 'Sacrificio', dairy: 'Lácteos y quesos' },
      type: 'Leche de', rng: 'Periodo', r3: '3 años', rall: 'Desde 2020', price: 'Precio pagado al ganadero', priceU: '€/kg', vol: 'Entregas a la industria', volU: 'miles de toneladas', prod: 'Ganaderos que entregan',
      lm: 'Último mes: {m}', yoy: 'frente a hace un año', org: 'Parte ecológica de las entregas', last12: 'Últimos 12 meses', prev: 'los 12 anteriores', top: 'Provincias con más {y}', yr: 'Año {y}', perKg: '€/kg', kt: 'kt',
      cow: 'vaca', sheep: 'oveja', goat: 'cabra', buffalo: 'búfala', grp: 'Especie', heads: 'Cabezas', carc: 'Peso en canal', cattle: 'Vacuno', pigs: 'Porcino', lamb: 'Cordero', sheepM: 'Ovino adulto', kid: 'Cabrito', goatM: 'Caprino adulto', poultry: 'Aves (pollo, gallina, pavo)',
      imp: 'de animales de otros países de la UE', pts: 'Producto', feta: 'Feta DOP por provincia', pdo: 'Quesos con denominación de origen (DOP/IGP)', grpD: 'Lácteos por grupo', pick: 'Producto', nodata: 'Sin dato publicado', annualBars: 'Provincias, {y}', thou: 'mil',
      nMilk: 'Leche entregada a compradores y transformadores registrados, por mes y unidad regional (ELGO-Dimitra). El precio es valor entre kilos, sin subvenciones; la leche de oveja y cabra sigue una estacionalidad fuerte (pico en primavera). Las provincias suman el total nacional; el último año está incompleto.',
      nMeat: 'Animales sacrificados en mataderos registrados y peso de canal en kilos, por mes (ELGO-Dimitra). Los animales de otros países de la UE sacrificados en Grecia cuentan en el total. Las aves solo llegan de 16 provincias.',
      nDairy: 'Producción mensual de la industria láctea registrada, en kilos (ELGO-Dimitra). Son cantidades producidas, no precios. «Otros» es la categoría residual de ELGO. Los quesos DOP/IGP los publica ELGO por separado.', src: 'Fuente:' },
    en: { h: 'Greece milk, meat and dairy (ELGO-Dimitra)', tabs: { milk: 'Milk', meat: 'Slaughter', dairy: 'Dairy and cheese' },
      type: 'Milk from', rng: 'Period', r3: '3 years', rall: 'Since 2020', price: 'Price paid to the farmer', priceU: '€/kg', vol: 'Deliveries to the industry', volU: 'thousand tonnes', prod: 'Farmers delivering',
      lm: 'Latest month: {m}', yoy: 'vs a year ago', org: 'Organic share of deliveries', last12: 'Last 12 months', prev: 'the 12 before', top: 'Top provinces by {y}', yr: 'Year {y}', perKg: '€/kg', kt: 'kt',
      cow: 'cows', sheep: 'sheep', goat: 'goats', buffalo: 'buffalo', grp: 'Species', heads: 'Head', carc: 'Carcass weight', cattle: 'Cattle', pigs: 'Pigs', lamb: 'Lamb', sheepM: 'Adult sheep', kid: 'Kid', goatM: 'Adult goat', poultry: 'Poultry (chicken, hen, turkey)',
      imp: 'from animals of other EU countries', pts: 'Product', feta: 'PDO feta by province', pdo: 'Cheeses with protected designation (PDO/PGI)', grpD: 'Dairy by group', pick: 'Product', nodata: 'No published figure', annualBars: 'Provinces, {y}', thou: 'thousand',
      nMilk: 'Milk delivered to registered buyers and processors, by month and regional unit (ELGO-Dimitra). The price is value divided by kilos, without subsidies; sheep and goat milk is strongly seasonal (spring peak). Provinces add up to the national total; the latest year is incomplete.',
      nMeat: 'Animals slaughtered in registered slaughterhouses and carcass weight in kilos, by month (ELGO-Dimitra). Animals from other EU countries slaughtered in Greece are included. Poultry comes from 16 provinces only.',
      nDairy: 'Monthly output of the registered dairy industry, in kilos (ELGO-Dimitra). These are quantities produced, not prices. “Other” is ELGO’s residual category. PDO/PGI cheeses are published by ELGO separately.', src: 'Source:' },
    fr: { h: 'Lait, viande et produits laitiers de la Grèce (ELGO-Dimitra)', tabs: { milk: 'Lait', meat: 'Abattages', dairy: 'Laitiers et fromages' },
      type: 'Lait de', rng: 'Période', r3: '3 ans', rall: 'Depuis 2020', price: 'Prix payé à l’éleveur', priceU: '€/kg', vol: 'Livraisons à l’industrie', volU: 'milliers de tonnes', prod: 'Éleveurs livreurs',
      lm: 'Dernier mois : {m}', yoy: 'sur un an', org: 'Part bio des livraisons', last12: '12 derniers mois', prev: 'les 12 précédents', top: 'Premières provinces en {y}', yr: 'Année {y}', perKg: '€/kg', kt: 'kt',
      cow: 'vache', sheep: 'brebis', goat: 'chèvre', buffalo: 'bufflonne', grp: 'Espèce', heads: 'Têtes', carc: 'Poids carcasse', cattle: 'Bovins', pigs: 'Porcins', lamb: 'Agneau', sheepM: 'Ovins adultes', kid: 'Chevreau', goatM: 'Caprins adultes', poultry: 'Volailles (poulet, poule, dinde)',
      imp: 'd’animaux d’autres pays de l’UE', pts: 'Produit', feta: 'Feta AOP par province', pdo: 'Fromages sous appellation (AOP/IGP)', grpD: 'Produits laitiers par groupe', pick: 'Produit', nodata: 'Pas de chiffre publié', annualBars: 'Provinces, {y}', thou: 'mille',
      nMilk: 'Lait livré aux acheteurs et transformateurs enregistrés, par mois et unité régionale (ELGO-Dimitra). Le prix est la valeur divisée par les kilos, hors subventions ; le lait de brebis et de chèvre est très saisonnier (pic au printemps). Les provinces totalisent le national ; la dernière année est incomplète.',
      nMeat: 'Animaux abattus dans les abattoirs enregistrés et poids de carcasse en kilos, par mois (ELGO-Dimitra). Les animaux d’autres pays de l’UE abattus en Grèce sont inclus. Les volailles viennent de 16 provinces seulement.',
      nDairy: 'Production mensuelle de l’industrie laitière enregistrée, en kilos (ELGO-Dimitra). Ce sont des quantités produites, pas des prix. « Autres » est la catégorie résiduelle d’ELGO. Les fromages AOP/IGP sont publiés à part par ELGO.', src: 'Source :' },
    it: { h: 'Latte, carne e latticini della Grecia (ELGO-Dimitra)', tabs: { milk: 'Latte', meat: 'Macellazioni', dairy: 'Latticini e formaggi' },
      type: 'Latte di', rng: 'Periodo', r3: '3 anni', rall: 'Dal 2020', price: 'Prezzo pagato all’allevatore', priceU: '€/kg', vol: 'Consegne all’industria', volU: 'migliaia di tonnellate', prod: 'Allevatori che consegnano',
      lm: 'Ultimo mese: {m}', yoy: 'su un anno', org: 'Quota biologica delle consegne', last12: 'Ultimi 12 mesi', prev: 'i 12 precedenti', top: 'Prime province per {y}', yr: 'Anno {y}', perKg: '€/kg', kt: 'kt',
      cow: 'vacca', sheep: 'pecora', goat: 'capra', buffalo: 'bufala', grp: 'Specie', heads: 'Capi', carc: 'Peso in carcassa', cattle: 'Bovini', pigs: 'Suini', lamb: 'Agnello', sheepM: 'Ovini adulti', kid: 'Capretto', goatM: 'Caprini adulti', poultry: 'Avicoli (pollo, gallina, tacchino)',
      imp: 'di animali di altri paesi UE', pts: 'Prodotto', feta: 'Feta DOP per provincia', pdo: 'Formaggi a denominazione (DOP/IGP)', grpD: 'Latticini per gruppo', pick: 'Prodotto', nodata: 'Dato non pubblicato', annualBars: 'Province, {y}', thou: 'mila',
      nMilk: 'Latte consegnato ad acquirenti e trasformatori registrati, per mese e unità regionale (ELGO-Dimitra). Il prezzo è il valore diviso per i chili, senza sussidi; il latte ovino e caprino è molto stagionale (picco in primavera). Le province sommano il totale nazionale; l’ultimo anno è incompleto.',
      nMeat: 'Animali macellati in macelli registrati e peso in carcassa in chili, per mese (ELGO-Dimitra). Gli animali di altri paesi UE macellati in Grecia sono inclusi. Gli avicoli arrivano da sole 16 province.',
      nDairy: 'Produzione mensile dell’industria lattiero-casearia registrata, in chili (ELGO-Dimitra). Sono quantità prodotte, non prezzi. «Altri» è la categoria residuale di ELGO. I formaggi DOP/IGP sono pubblicati a parte da ELGO.', src: 'Fonte:' }
  };
  var DG = { 'milk-pasteurised': 'Pasteurised milk|Leche pasteurizada|Lait pasteurisé|Latte pastorizzato', 'milk-uht': 'UHT milk|Leche UHT|Lait UHT|Latte UHT', 'milk-fermented': 'Soured milk|Leche fermentada|Lait fermenté|Latte fermentato', 'milk-condensed': 'Condensed milk|Leche condensada|Lait concentré|Latte condensato',
    'yogurt-cow': 'Plain cow yogurt|Yogur natural de vaca|Yaourt nature de vache|Yogurt naturale vaccino', 'yogurt-sheep': 'Plain sheep yogurt|Yogur natural de oveja|Yaourt nature de brebis|Yogurt naturale ovino', 'yogurt-goat': 'Plain goat yogurt|Yogur natural de cabra|Yaourt nature de chèvre|Yogurt naturale caprino',
    'yogurt-strained': 'Strained (Greek) yogurt|Yogur griego (colado)|Yaourt grec (égoutté)|Yogurt greco (colato)', 'yogurt-other': 'Other yogurt|Otros yogures|Autres yaourts|Altri yogurt',
    'cheese-soft': 'Soft cheese (incl. feta)|Quesos blandos (incluye feta)|Fromages mous (dont feta)|Formaggi molli (inclusa feta)', 'cheese-hard': 'Hard and semi-hard cheese|Quesos duros y semiduros|Fromages durs et mi-durs|Formaggi duri e semiduri',
    'cheese-whey': 'Whey cheese|Quesos de suero|Fromages de petit-lait|Formaggi di siero', 'cheese-processed': 'Processed cheese|Queso fundido|Fromage fondu|Formaggio fuso', 'cheese-analogue': 'Cheese analogues and imitation|Análogos e imitaciones|Analogues et imitations|Analoghi e imitazioni',
    butter: 'Butter|Mantequilla|Beurre|Burro', cream: 'Cream|Nata|Crème|Panna', desserts: 'Dairy desserts|Postres lácteos|Desserts lactés|Dessert lattiero-caseari', drinks: 'Dairy drinks|Bebidas lácteas|Boissons lactées|Bevande lattiere', 'non-dairy': 'Non-dairy products|No lácteos|Non laitiers|Non lattiero-caseari', other: 'Other|Otros|Autres|Altri' };
  var PD = { 'Π.Ο.Π. ΦΕΤΑ': 'Feta', 'Π.Ο.Π. ΚΑΣΕΡΙ': 'Kasseri', 'Π.Ο.Π. ΜΑΝΟΥΡΙ': 'Manouri', 'Π.Ο.Π. ΚΕΦΑΛΟΓΡΑΒΙΕΡΑ': 'Kefalograviera', 'Π.Ο.Π. ΓΑΛΟΤΥΡΙ': 'Galotyri', 'Π.Ο.Π. ΓΡΑΒΙΕΡΑ ΚΡΗΤΗΣ': 'Graviera Kritis', 'Π.Ο.Π. ΜΠΑΤΖΟΣ': 'Batzos',
    'Π.Ο.Π. ΞΥΝΟΜΥΖΗΘΡΑ ΚΡΗΤΗΣ': 'Xynomyzithra Kritis', 'Π.Ο.Π. ΣΦΕΛΑ': 'Sfela', 'Π.Ο.Π. ΤΣΑΛΑΦΟΥΤΙ': 'Tsalafouti', 'Π.Γ.Ε ΚΡΑΣΟΤΥΡΙ ΚΩ-ΤΥΡΙ ΤΗΣ ΠΟΣΙΑΣ': 'Krasotyri Kos (PGI)', 'Π.Ο.Π. ΓΡΑΒΙΕΡΑ ΑΓΡΑΦΩΝ': 'Graviera Agrafon', 'Π.Ο.Π. ΑΝΕΒΑΤΟ': 'Anevato',
    'Π.Ο.Π. ΞΥΓΑΛΟ Η ΞΙΓΑΛΟ ΣΗΤΕΙΑΣ': 'Xygalo Siteias', 'Π.Ο.Π. ΠΗΧΤΟΓΑΛΟ ΧΑΝΙΩΝ': 'Pichtogalo Chanion', 'Π.Ο.Π. ΦΟΡΜΑΕΛΛΑ ΑΡΑΧΩΒΑΣ': 'Formaella Arachovas', 'Π.Ο.Π. ΚΑΤΙΚΙ ΔΟΜΟΚΟΥ': 'Katiki Domokou', 'Π.Ο.Π. ΛΑΔΟΤΥΡΙ ΜΥΤΙΛΗΝΗΣ': 'Ladotyri Mytilinis',
    'Π.Ο.Π. ΚΑΛΑΘΑΚΙ ΛΗΜΝΟΥ': 'Kalathaki Limnou', 'Π.Ο.Π. ΣΑΝ ΜΙΧΑΛΗ': 'San Michali', 'Π.Ο.Π. ΚΟΠΑΝΙΣΤΗ': 'Kopanisti', 'Π.Ο.Π. ΑΡΣΕΝΙΚΟ ΝΑΞΟΥ': 'Arseniko Naxou', 'Π.Ο.Π. ΓΡΑΒΙΕΡΑ ΝΑΞΟΥ': 'Graviera Naxou' };
  var FEAT = 'Π.Ο.Π. ΦΕΤΑ', LG = { en: 0, es: 1, fr: 2, it: 3 };
  var U = global.ESUI, ST = { tab: 'milk', mt: 'sheep', rng: '3', mg: 'cattle', dk: 'g:cheese-soft' }, D = {};
  function nm(tab, k, lg) { var s = tab[k]; if (!s) return k; var a = s.split('|'); return a[LG[lg]] || a[0]; }
  function lastIdx(a) { for (var i = a.length - 1; i >= 0; i--) if (a[i] != null) return i; return -1; }
  function sgn(v) { return v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + U.nf(Math.abs(v), 1) + ' %'; }
  function col(v) { return v == null || v === 0 ? '' : v > 0 ? 'color:#2f7d4f' : 'color:#b4541a'; }
  function card(n, v, note) { return '<div class="di-card cof-card"><div class="cof-lbl">' + n + '</div><div class="cof-val">' + v + '</div>' + (note ? '<div class="cof-note" style="margin:2px 0 0">' + note + '</div>' : '') + '</div>'; }
  function mlabel(m, lg) { var p = m.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, 1)).toLocaleDateString(lg, { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return m; } }
  function note(t, k) { return '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t[k]) + '</p>'; }
  function pct(a, b) { return a != null && b ? (a / b - 1) * 100 : null; }
  function sum(a, from, to) { var s = 0; for (var i = Math.max(0, from); i < to && i < a.length; i++) s += a[i] || 0; return s; }
  function rngSel(t) { return U.sel('elg-r', t.rng, U.opt('3', t.r3, ST.rng) + U.opt('all', t.rall, ST.rng), ST.rng); }
  function slice(M, lg) { var n = ST.rng === 'all' ? M.length : 36, f = Math.max(0, M.length - n); return { f: f, l: M.slice(f).map(function (m) { return mlabel(m, lg); }) }; }
  /* unidades regionales: último año natural completo y ranking */
  function fullYear(M) { var y = M[M.length - 1].slice(0, 4), c = 0; M.forEach(function (m) { if (m.slice(0, 4) === y) c++; }); return c === 12 ? y : String(+y - 1); }
  function rank(P, names, y, lg, getv, getp) {
    var rows = [], tot = 0;
    Object.keys(P).forEach(function (p) { var v = getv(P[p], y); if (v) { rows.push([names[p].en, v, getp ? getp(P[p], y) : '']); tot += v; } });
    rows.sort(function (a, b) { return b[1] - a[1]; });
    return { rows: rows.slice(0, 10), tot: tot };
  }

  function milkView(d, lg, t) {
    var M = d.months, E = d.types[ST.mt], out = '', opts = ['sheep', 'goat', 'cow', 'buffalo'].map(function (k) { return U.opt(k, t[k], ST.mt); }).join('');
    out += U.sel('elg-t', t.type, opts, ST.mt) + rngSel(t);
    var i = lastIdx(E.price), n = M.length;
    if (i < 0) return out + '<p class="cof-note">' + U.esc(t.nodata) + '</p>';
    var yoyP = i >= 12 ? pct(E.price[i], E.price[i - 12]) : null, yoyV = i >= 12 ? pct(E.kg[i], E.kg[i - 12]) : null;
    var l12 = sum(E.kg, n - 12, n), p12 = sum(E.kg, n - 24, n - 12), org = sum(E.orgKg, n - 12, n);
    out += '<div class="cof-cards">' + card(U.esc(t.price + ' · ' + mlabel(M[i], lg)), U.nf(E.price[i], 3) + ' ' + t.priceU, '<span style="' + col(yoyP) + '">' + sgn(yoyP) + '</span> ' + U.esc(t.yoy));
    out += card(U.esc(t.vol + ' · ' + mlabel(M[i], lg)), U.nf(E.kg[i] / 1e6, 1) + ' ' + t.kt, '<span style="' + col(yoyV) + '">' + sgn(yoyV) + '</span> ' + U.esc(t.yoy));
    out += card(U.esc(t.last12), U.nf(l12 / 1e6, 0) + ' ' + t.kt, '<span style="' + col(pct(l12, p12)) + '">' + sgn(pct(l12, p12)) + '</span> ' + U.esc(t.yoy));
    if (org > 0 && l12) out += card(U.esc(t.org), U.nf(org / l12 * 100, 1) + ' %');
    out += '</div>';
    var s = slice(M, lg);
    out += U.chart([{ name: t[ST.mt], v: E.price.slice(s.f) }], s.l, t.price + ' (' + t.priceU + ')', t.price, 3);
    out += U.chart([{ name: t[ST.mt], v: E.kg.slice(s.f).map(function (x) { return x / 1e6; }) }], s.l, t.vol + ' (' + t.kt + ')', t.vol, 1);
    var y = fullYear(M), R = rank(d.prefectures[ST.mt], d.names, y, lg, function (o, yy) { return o.kg[yy]; }, function (o, yy) { return o.eur[yy] && o.kg[yy] ? U.nf(o.eur[yy] / o.kg[yy], 3) + ' ' + t.priceU : ''; });
    if (R.rows.length) out += '<h3 class="cof-h3">' + U.esc(t.top.replace('{y}', y)) + ' · ' + U.esc(t.vol) + '</h3>' + U.bars(R.rows.map(function (r) { return [r[0], r[1] / 1e6, r[2]]; }), R.rows[0][1] / 1e6, 1, t.kt);
    return out + note(t, 'nMilk');
  }
  function meatView(d, lg, t) {
    var M = d.months, keys = ['cattle', 'pigs', 'lamb', 'sheep', 'kid', 'goat'], out = '', isP = ST.mg === 'poultry';
    out += U.sel('elg-g', t.grp, keys.map(function (k) { return U.opt(k, t[k === 'sheep' ? 'sheepM' : k === 'goat' ? 'goatM' : k], ST.mg); }).join('') + U.opt('poultry', t.poultry, ST.mg), ST.mg) + rngSel(t);
    var G = isP ? { kg: d.poultry.types.broiler.kg.map(function (x, i) { var s = 0; Object.keys(d.poultry.types).forEach(function (k) { s += d.poultry.types[k].kg[i]; }); return s; }),
      heads: d.poultry.months.map(function (m, i) { var s = 0; Object.keys(d.poultry.types).forEach(function (k) { s += d.poultry.types[k].heads[i]; }); return s; }), importedKg: null } : d.groups[ST.mg];
    var MM = isP ? d.poultry.months : M, n = MM.length, i = n - 1;
    var lm = sum(G.kg, n - 1, n), yo = i >= 12 ? G.kg[i - 12] : null, l12 = sum(G.kg, n - 12, n), p12 = sum(G.kg, n - 24, n - 12), h12 = sum(G.heads, n - 12, n);
    out += '<div class="cof-cards">' + card(U.esc(t.carc + ' · ' + mlabel(MM[i], lg)), U.nf(lm / 1e6, 1) + ' ' + t.kt, '<span style="' + col(pct(lm, yo)) + '">' + sgn(pct(lm, yo)) + '</span> ' + U.esc(t.yoy));
    out += card(U.esc(t.last12 + ' · ' + t.carc), U.nf(l12 / 1e6, 1) + ' ' + t.kt, '<span style="' + col(pct(l12, p12)) + '">' + sgn(pct(l12, p12)) + '</span> ' + U.esc(t.yoy));
    out += card(U.esc(t.last12 + ' · ' + t.heads), U.nf(h12 / 1e3, 0) + ' ' + t.thou, G.importedKg && l12 ? U.nf(sum(G.importedKg, n - 12, n) / l12 * 100, 1) + ' % ' + U.esc(t.imp) : '');
    out += '</div>';
    var sl = ST.rng === 'all' ? MM.length : 36, f = Math.max(0, MM.length - sl);
    out += U.chart([{ name: t.carc, v: G.kg.slice(f).map(function (x) { return x / 1e6; }) }], MM.slice(f).map(function (m) { return mlabel(m, lg); }), t.carc + ' (' + t.kt + ')', t.carc, 1);
    var P = isP ? d.poultry.prefectures : null, y = fullYear(MM), R;
    if (isP) { R = { rows: [], tot: 0 }; Object.keys(P).forEach(function (p) { var v = P[p][y]; if (v) R.rows.push([d.names[p].en, v]); }); R.rows.sort(function (a, b) { return b[1] - a[1]; }); R.rows = R.rows.slice(0, 10); }
    else R = rank(d.prefectures[ST.mg], d.names, y, lg, function (o, yy) { return o.kg[yy]; });
    if (R.rows.length) out += '<h3 class="cof-h3">' + U.esc(t.top.replace('{y}', y)) + ' · ' + U.esc(t.carc) + '</h3>' + U.bars(R.rows.map(function (r) { return [r[0], r[1] / 1e6]; }), R.rows[0][1] / 1e6, 2, t.kt);
    return out + note(t, 'nMeat');
  }
  function dairyView(d, lg, t) {
    var out = '', gk = Object.keys(d.groups).filter(function (k) { return sum(d.groups[k], d.months.length - 12, d.months.length) > 0; }), pk = Object.keys(d.pdo.products).filter(function (k) { return sum(d.pdo.products[k].kg, 0, d.pdo.months.length) > 0; });
    pk.sort(function (a, b) { return sum(d.pdo.products[b].kg, d.pdo.months.length - 12, d.pdo.months.length) - sum(d.pdo.products[a].kg, d.pdo.months.length - 12, d.pdo.months.length); });
    if (ST.dk.slice(2) !== '' && ((ST.dk[0] === 'g' && gk.indexOf(ST.dk.slice(2)) < 0) || (ST.dk[0] === 'p' && pk.indexOf(ST.dk.slice(2)) < 0))) ST.dk = 'g:' + gk[0];
    var opts = '<optgroup label="' + U.esc(t.grpD) + '">' + gk.map(function (k) { return U.opt('g:' + k, nm(DG, k, lg), ST.dk); }).join('') + '</optgroup><optgroup label="' + U.esc(t.pdo) + '">' + pk.map(function (k) { return U.opt('p:' + k, PD[k] || k, ST.dk); }).join('') + '</optgroup>';
    out += U.sel('elg-d', t.pick, opts, ST.dk) + rngSel(t);
    var isP = ST.dk[0] === 'p', k = ST.dk.slice(2), MM = isP ? d.pdo.months : d.months, v = isP ? d.pdo.products[k].kg : d.groups[k], n = MM.length, i = n - 1;
    var l12 = sum(v, n - 12, n), p12 = sum(v, n - 24, n - 12), yo = i >= 12 ? v[i - 12] : null, label = isP ? (PD[k] || k) : nm(DG, k, lg);
    out += '<div class="cof-cards">' + card(U.esc(label + ' · ' + mlabel(MM[i], lg)), U.nf(v[i] / 1e6, 2) + ' ' + t.kt, '<span style="' + col(pct(v[i], yo)) + '">' + sgn(pct(v[i], yo)) + '</span> ' + U.esc(t.yoy));
    out += card(U.esc(t.last12), U.nf(l12 / 1e6, 1) + ' ' + t.kt, '<span style="' + col(pct(l12, p12)) + '">' + sgn(pct(l12, p12)) + '</span> ' + U.esc(t.yoy));
    if (isP) { var og = sum(d.pdo.products[k].orgKg, n - 12, n); if (og > 0 && l12) out += card(U.esc(t.org), U.nf(og / l12 * 100, 1) + ' %'); }
    out += '</div>';
    var sl = ST.rng === 'all' ? n : 36, f = Math.max(0, n - sl);
    out += U.chart([{ name: label, v: v.slice(f).map(function (x) { return x / 1e6; }) }], MM.slice(f).map(function (m) { return mlabel(m, lg); }), label + ' (' + t.kt + ')', label, 2);
    if (isP && k === FEAT) {
      var y = fullYear(d.pdo.months), rows = [];
      Object.keys(d.fetaPrefectures).forEach(function (p) { var x = d.fetaPrefectures[p][y]; if (x) rows.push([d.names[p].en, x / 1e6]); });
      rows.sort(function (a, b) { return b[1] - a[1]; }); rows = rows.slice(0, 10);
      if (rows.length) out += '<h3 class="cof-h3">' + U.esc(t.feta + ' · ' + t.yr.replace('{y}', y)) + '</h3>' + U.bars(rows, rows[0][1], 1, t.kt);
    }
    return out + note(t, 'nDairy');
  }
  var VIEWS = { milk: function (d, lg, t) { return milkView(d.milk, lg, t); }, meat: function (d, lg, t) { return meatView(d.meat, lg, t); }, dairy: function (d, lg, t) { return dairyView(d.dairy, lg, t); } };
  function load() {
    if (D.ok) return Promise.resolve(D);
    return Promise.all([U.json('data/el-elgo/milk.json'), U.json('data/el-elgo/meat.json'), U.json('data/el-elgo/dairy.json')]).then(function (r) { D = { milk: r[0], meat: r[1], dairy: r[2], ok: !!(r[0] || r[1] || r[2]) }; return D; });
  }
  function mount(el, lg) {
    if (!el || !U) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    function draw(focus) {
      var t = T[lg];
      return load().then(function (d) {
        if (!d.ok) { el.hidden = true; return false; }
        el.hidden = false;
        var tabs = Object.keys(T.es.tabs).filter(function (k) { return d[k]; });
        if (tabs.indexOf(ST.tab) < 0) ST.tab = tabs[0];
        var chips = tabs.map(function (k) { return U.chip(k === ST.tab, 'elg-tab', 'data-tab="' + k + '"', t.tabs[k]); }).join('');
        var body; try { body = VIEWS[ST.tab](d, lg, t); } catch (e) { body = '<p class="cof-note">' + U.esc(t.nodata) + '</p>'; }
        el.innerHTML = '<section class="di-card cof" id="ps-el-elgo" style="max-width:none"><h2 class="cof-h2">' + U.esc(t.h) + '</h2><div style="margin:6px 0 10px">' + chips + '</div>' + body + U.cite('elgo_dimitra') + '</section>';
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        return true;
      });
    }
    if (!el.getAttribute('data-elg')) {
      el.setAttribute('data-elg', '1');
      el.addEventListener('click', function (ev) { var b = ev.target.closest ? ev.target.closest('.elg-tab') : null; if (b) { ST.tab = b.getAttribute('data-tab'); draw('.elg-tab[data-tab="' + ST.tab + '"]'); } });
      el.addEventListener('change', function (ev) {
        var id = ev.target.id || '', v = ev.target.value;
        if (id === 'elg-t') ST.mt = v; else if (id === 'elg-g') ST.mg = v; else if (id === 'elg-d') ST.dk = v; else if (id === 'elg-r') ST.rng = v;
        draw('#' + id);
      });
    }
    return Promise.all([global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function () { return draw(); });
  }
  global.DIElElgo = { mount: mount };
})(window);
