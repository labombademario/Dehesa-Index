/* Dehesa Index — Comercio exterior agroalimentario por país (comercio-pais.html). ES5.
   Datos: data/views/trade-products/<CC>.json (Eurostat Comext para países de la UE; USDA FAS/Census para EE. UU.; ABS, HMRC, SUBREI y Statistics Canada para AU, UK, CL, CA).
   Cada país en su moneda y su clasificación; no se convierten monedas ni se suman países entre sí. Un dato ausente se muestra como ausente. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var S = global.DehesaShared || {};
  function lg() { var l = S.getLang ? S.getLang() : 'es'; return IX[l] != null ? l : 'es'; }
  function tx(a) { return a[IX[lg()]]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { return v == null || isNaN(v) ? '—' : (+v).toLocaleString(LOC[lg()], { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 0 : d }); }
  var CC = ['AT', 'AU', 'BE', 'BG', 'CA', 'CL', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'UK', 'US'];
  var EUC = 'AT BE BG CY CZ DE DK EE EL ES FI FR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK'.split(' ');
  var T = {
    title: L('Comercio exterior agroalimentario por país', 'Agri-food foreign trade by country', 'Commerce extérieur agroalimentaire par pays', 'Commercio estero agroalimentare per paese'),
    sub: L('Elige un país y un producto: el mapa pinta sus socios comerciales y la lista ordena quién pesa más. Datos oficiales de cada país, en su propia moneda.', 'Pick a country and a product: the map paints its trading partners and the list ranks who weighs most. Official data for each country, in its own currency.', 'Choisissez un pays et un produit : la carte colore ses partenaires commerciaux et la liste classe les plus importants. Données officielles de chaque pays, dans sa propre monnaie.', 'Scegli un paese e un prodotto: la mappa colora i suoi partner commerciali e l’elenco ordina i più importanti. Dati ufficiali di ciascun paese, nella sua valuta.'),
    loading: L('Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'), fail: L('No se han podido cargar los datos de este país.', 'The data for this country could not be loaded.', 'Les données de ce pays n’ont pas pu être chargées.', 'Impossibile caricare i dati di questo paese.'),
    bar: L('En esta página', 'On this page', 'Sur cette page', 'In questa pagina'),
    bars: { mapa: L('🗺️ Mapa', '🗺️ Map', '🗺️ Carte', '🗺️ Mappa'), productos: L('📦 Productos', '📦 Products', '📦 Produits', '📦 Prodotti'), fuente: L('ℹ️ Fuente', 'ℹ️ Source', 'ℹ️ Source', 'ℹ️ Fonte') },
    country: L('País', 'Country', 'Pays', 'Paese'), year: L('Año', 'Year', 'Année', 'Anno'), product: L('Producto', 'Product', 'Produit', 'Prodotto'),
    flow: { exp: L('📤 Vende (exporta)', '📤 Sells (exports)', '📤 Vend (exporte)', '📤 Vende (esporta)'), imp: L('📥 Compra (importa)', '📥 Buys (imports)', '📥 Achète (importe)', '📥 Compra (importa)') },
    total: L('Total mundial', 'World total', 'Total monde', 'Totale mondo'), sumMain: L('Suma de los socios publicados', 'Sum of the partners published', 'Somme des partenaires publiés', 'Somma dei partner pubblicati'),
    intra: L('Dentro de la UE', 'Within the EU', 'Dans l’UE', 'Dentro la UE'), extra: L('Fuera de la UE', 'Outside the EU', 'Hors UE', 'Fuori dalla UE'),
    top: L('🏆 Principales socios', '🏆 Main partners', '🏆 Principaux partenaires', '🏆 Principali partner'), vs: L('vs año anterior', 'vs previous year', 'vs année précédente', 'vs anno precedente'),
    first: L('Primer socio', 'Top partner', 'Premier partenaire', 'Primo partner'), top3: L('Los tres primeros suman', 'The top three add up to', 'Les trois premiers totalisent', 'I primi tre sommano'),
    of: L('del total', 'of the total', 'du total', 'del totale'), noPartner: L('Este producto no tiene desglose por socio para este país.', 'This product has no partner breakdown for this country.', 'Ce produit n’a pas de ventilation par partenaire pour ce pays.', 'Questo prodotto non ha dettaglio per partner per questo paese.'),
    nodata: L('sin dato', 'no data', 'sans donnée', 'nessun dato'),
    prodT: L('📦 Todos los productos', '📦 All products', '📦 Tous les produits', '📦 Tutti i prodotti'), prodS: L('Valor, variación y primer socio de cada producto del país elegido. Pulsa un producto para verlo en el mapa.', 'Value, change and top partner of each product for the chosen country. Click a product to see it on the map.', 'Valeur, variation et premier partenaire de chaque produit du pays choisi. Cliquez sur un produit pour le voir sur la carte.', 'Valore, variazione e primo partner di ogni prodotto del paese scelto. Clicca un prodotto per vederlo sulla mappa.'),
    hVal: L('Valor', 'Value', 'Valeur', 'Valore'), hChg: L('Variación', 'Change', 'Variation', 'Variazione'), hTop: L('Primer socio', 'Top partner', 'Premier partenaire', 'Primo partner'),
    more: L('Más detalle de este país', 'More detail on this country', 'Plus de détails sur ce pays', 'Più dettagli su questo paese'), usLink: L('Ventas semanales y comercio mensual de EE. UU. (USDA)', 'U.S. weekly sales and monthly trade (USDA)', 'Ventes hebdomadaires et commerce mensuel des États-Unis (USDA)', 'Vendite settimanali e commercio mensile USA (USDA)'),
    fiche: L('Ficha del país', 'Country profile', 'Fiche pays', 'Scheda paese'), tariffs: L('Aranceles', 'Tariffs', 'Droits de douane', 'Dazi'),
    srcT: L('ℹ️ Fuente y cómo leerlo', 'ℹ️ Source and how to read it', 'ℹ️ Source et lecture', 'ℹ️ Fonte e lettura'),
    noteEU: L('Valor en millones de euros, último año completo; el comercio dentro de la UE está incluido. En Países Bajos y Bélgica una parte importante es tránsito y reexportación (efecto Róterdam y Amberes).', 'Value in EUR million, latest complete year; intra-EU trade is included. For the Netherlands and Belgium a large share is transit and re-export (Rotterdam and Antwerp effect).', 'Valeur en millions d’euros, dernière année complète ; le commerce intra-UE est inclus. Aux Pays-Bas et en Belgique, une part importante est du transit et de la réexportation (effet Rotterdam et Anvers).', 'Valore in milioni di euro, ultimo anno completo; il commercio intra-UE è incluso. Nei Paesi Bassi e in Belgio una quota importante è transito e riesportazione (effetto Rotterdam e Anversa).'),
    noteOth: L('Valor en millones de la moneda del país; no se convierte ni se compara entre países. Cada país usa su propia clasificación de productos, por eso las listas difieren.', 'Value in millions of the country’s own currency; it is not converted or compared across countries. Each country uses its own product classification, so lists differ.', 'Valeur en millions de la monnaie du pays ; elle n’est ni convertie ni comparée entre pays. Chaque pays utilise sa propre classification de produits, donc les listes diffèrent.', 'Valore in milioni della valuta del paese; non viene convertito né confrontato tra paesi. Ogni paese usa la propria classificazione dei prodotti, quindi gli elenchi differiscono.'),
    noteUS: L('Solo los principales socios agrarios; el «total» es la suma de los socios publicados, no el total de EE. UU. Periodo: 12 meses móviles (LTM).', 'Main agricultural partners only; the “total” is the sum of the partners published, not the U.S. total. Period: last twelve months (LTM).', 'Seulement les principaux partenaires agricoles ; le « total » est la somme des partenaires publiés, pas le total des États-Unis. Période : 12 derniers mois glissants (LTM).', 'Solo i principali partner agricoli; il «totale» è la somma dei partner pubblicati, non il totale USA. Periodo: ultimi dodici mesi (LTM).'),
    src: L('Fuente', 'Source', 'Source', 'Fonte')
  };
  var UNIT = { 'EUR million': 'M€', 'USD million': 'M US$', 'A$ million': 'M A$', 'GBP million': 'M£', 'CAD million': 'M C$' };
  var GRP = [
    ['cer', L('🌾 Cereales y oleaginosas', '🌾 Grains and oilseeds', '🌾 Céréales et oléagineux', '🌾 Cereali e semi oleosi'), /^(10|12|100\d|120\d|04[1-4]|222|trigo|maiz|sorgo|cebada|arroz|centeno|avena|colza|soja|harina_soja|aceite_soja|ddgs)/],
    ['meat', L('🥩 Carne y ganado', '🥩 Meat and livestock', '🥩 Viande et bétail', '🥩 Carne e bestiame'), /^(01|02|0201|0203|0204|0207|011|012|001|vacuno|cerdo|pollo|ovino|ganado_vivo|huevos)/],
    ['dairy', L('🥛 Lácteos y huevos', '🥛 Dairy and eggs', '🥛 Produits laitiers et œufs', '🥛 Latticini e uova'), /^(04|0401|0405|0406|0407|022|023|024|025|lacteos|queso|mantequilla)/],
    ['fruit', L('🍎 Fruta, hortalizas y aceite', '🍎 Fruit, vegetables and oil', '🍎 Fruits, légumes et huile', '🍎 Frutta, ortaggi e olio'), /^(07|08|0701|15|1509|057|fruta|patata|aceite_oliva)/],
    ['bev', L('🍷 Vino, azúcar y bebidas', '🍷 Wine, sugar and drinks', '🍷 Vin, sucre et boissons', '🍷 Vino, zucchero e bevande'), /^(17|1701|22|2204|061|112|azucar|vino)/]
  ];
  var OTHER = L('🧰 Insumos y otros', '🧰 Inputs and other', '🧰 Intrants et autres', '🧰 Input e altro');
  function grpOf(k) { for (var i = 0; i < GRP.length; i++) if (GRP[i][2].test(k)) return i; return -1; }
  function emo(k, name) {
    var m = { trigo: '🌾', maiz: '🌽', sorgo: '🌿', cebada: '🍺', arroz: '🍚', centeno: '🌾', avena: '🥣', colza: '🌼', soja: '🫘', harina_soja: '🌱', aceite_soja: '🫘', ddgs: '🌽', etanol: '⛽', algodon: '☁️', ganado_vivo: '🐄', vacuno: '🐄', lacteos: '🥛', huevos: '🥚', fertilizantes: '🧪', cerdo: '🐖', pollo: '🐔', queso: '🧀', fruta: '🍎', aceite_oliva: '🫒', azucar: '🍬', vino: '🍷', mantequilla: '🧈', ovino: '🐑', patata: '🥔',
      '0': '🧺', '001': '🐄', '01': '🐄', '011': '🐄', '012': '🐑', '022': '🥛', '024': '🧀', '023': '🧈', '025': '🥚', '041': '🌾', '042': '🍚', '043': '🍺', '044': '🌽', '061': '🍬', '112': '🍷', '222': '🌼', '263': '☁️', '268': '🐑', '56': '🧪', '057': '🍎', '02': '🥩', '04': '🥛', '07': '🥬', '08': '🍎', '10': '🌾', '12': '🌼', '15': '🫒', '17': '🍬', '22': '🍷', '23': '🐟', '31': '🧪', '45': '🍾', '1509': '🫒',
      '1001': '🌾', '1002': '🌾', '1003': '🍺', '1004': '🥣', '1005': '🌽', '1006': '🍚', '1201': '🫘', '1205': '🌼', '1701': '🍬', '0701': '🥔', '0201': '🐄', '0201-0202': '🐄', '0202': '🐄', '0203': '🐖', '0204': '🐑', '0207': '🐔', '0401': '🥛', '0405': '🧈', '0406': '🧀', '0407': '🥚', '2204': '🍷', 'farm-food': '🧺' };
    return m[k] || '📦';
  }
  var D = null, SEL = { c: 'ES', f: 'exp', p: '', y: -1 }, MAP = null, CUTS = [], SEQ = ['#e9efdf', '#c6dbb4', '#93bd86', '#549362', '#1f6b3f'], NONE = '#e6e2d6', CACHE = {};

  function load(cc) {
    if (CACHE[cc]) return CACHE[cc];
    return CACHE[cc] = fetch('data/views/trade-products/' + cc + '.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function iso(c) { return c === 'EL' ? 'GR' : c === 'UK' ? 'GB' : c; }
  function flag(c) { var i = iso(c); return /^[A-Z]{2}$/.test(i) ? String.fromCodePoint(127397 + i.charCodeAt(0), 127397 + i.charCodeAt(1)) + ' ' : '🏳️ '; }
  function cname(c, fb) {
    try { var n = new Intl.DisplayNames([LOC[lg()]], { type: 'region' }).of(iso(c)); if (n && n !== iso(c)) return n; } catch (e) { /* sin Intl.DisplayNames */ }
    return fb || c;
  }
  function pName(k, node) {
    if (node && node.nm && node.nm[lg()]) return node.nm[lg()];
    var P = global.DITradePartners && global.DITradePartners.label; var l = P ? P(k, lg()) : null;
    return l || (node && node.name) || k;
  }
  function unit() { return UNIT[D.unit] || D.unit; }
  function money(v) { return v == null ? '—' : nf(v, v >= 100 ? 0 : v >= 1 ? 1 : 2) + ' ' + unit(); }
  function pct(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }
  function chg(v) { if (v == null) return '<span class="cp-m">—</span>'; var up = v > 0.049, dn = v < -0.049; return '<span class="cp-chg ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲ +' : dn ? '▼ −' : '■ ') + nf(Math.abs(v), 1) + ' %</span>'; }
  function medal(n) { return n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : n + '.'; }
  function prods() { return D.reporters[SEL.c] || {}; }
  function node() { var p = prods()[SEL.p]; return p ? p[SEL.f] : null; }
  function totalOf(nd, i) {
    if (!nd) return null;
    if (nd.world && nd.world[i] != null) return nd.world[i];
    var t = 0, any = false; (nd.partners || []).forEach(function (r) { if (r.v[i] != null) { t += r.v[i]; any = true; } }); return any ? t : null;
  }
  function parts(nd, i) { return (nd && nd.partners || []).filter(function (r) { return r.v[i]; }).sort(function (a, b) { return b.v[i] - a.v[i]; }); }

  function classify(ps, i) {
    var arr = ps.map(function (r) { return r.v[i]; }).sort(function (a, b) { return a - b; });
    CUTS = [0.4, 0.65, 0.85, 0.95].map(function (q) { return arr.length ? arr[Math.min(arr.length - 1, Math.floor(q * arr.length))] : 0; });
  }
  function colorOf(v) { var k = 0; while (k < CUTS.length && v >= CUTS[k]) k++; return SEQ[k]; }

  function drawMap(ps, i, tot) {
    var host = document.getElementById('ct-map'); if (!host) return;
    if (MAP) { try { MAP.destroy(); } catch (e) { /* ya destruido */ } MAP = null; }
    host.innerHTML = '';
    if (typeof global.jsVectorMap !== 'function') { host.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; return; }
    var vals = {}, nm = {}; ps.forEach(function (r) { var c = iso(r.c); if (/^[A-Z]{2}$/.test(c)) { vals[c] = r.v[i]; nm[c] = r.n; } });
    try {
      MAP = new global.jsVectorMap({
        selector: '#ct-map', map: 'world', backgroundColor: 'transparent', zoomButtons: true, zoomOnScroll: false, showTooltip: true,
        regionStyle: { initial: { fill: NONE, stroke: '#c8c3b4', strokeWidth: 0.4, fillOpacity: 1 }, hover: { fillOpacity: 0.8 } },
        onRegionTooltipShow: function (e, tip, code) { if (vals[code] != null) tip.text('<strong>' + esc(cname(code, nm[code])) + '</strong><br>' + esc(money(vals[code])) + (tot ? ' · ' + nf(100 * vals[code] / tot, 1) + ' %' : ''), true); else tip.text(esc(cname(code)), true); }
      });
      Object.keys(MAP.regions || {}).forEach(function (code) {
        var el = MAP.regions[code] && MAP.regions[code].element; if (!el) return;
        var isSel = code === iso(SEL.c);
        try { el.setStyle('fill', vals[code] != null ? colorOf(vals[code]) : NONE); if (isSel) { el.setStyle('stroke', '#1b1b1b'); el.setStyle('strokeWidth', 1.6); } } catch (e) { /* sin estilo */ }
      });
      var lgd = document.getElementById('ct-legend');
      if (lgd) { var f = function (v) { return nf(v, v >= 100 ? 0 : 1); }, lab = ['< ' + f(CUTS[0])]; for (var k = 1; k < CUTS.length; k++) lab.push(f(CUTS[k - 1]) + ' – ' + f(CUTS[k])); lab.push('> ' + f(CUTS[CUTS.length - 1]));
        lgd.innerHTML = SEQ.map(function (c, k2) { return '<span class="cp-lg"><i style="background:' + c + '"></i>' + esc(lab[k2]) + ' ' + esc(unit()) + '</span>'; }).join('') + '<span class="cp-lg"><i style="background:' + NONE + '"></i>' + esc(tx(T.nodata)) + '</span>'; }
    } catch (e) { MAP = null; host.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; }
  }

  function chips(items, cur, attr) { return items.map(function (it) { return '<button type="button" class="cp-chip" data-' + attr + '="' + esc(it[0]) + '" aria-pressed="' + (String(it[0]) === String(cur) ? 'true' : 'false') + '">' + esc(it[1]) + '</button>'; }).join(''); }
  function productChips() {
    var P = prods(), keys = Object.keys(P), groups = {}, order = [];
    keys.forEach(function (k) { var g = grpOf(k); (groups[g] = groups[g] || []).push(k); });
    GRP.forEach(function (g, i) { if (groups[i]) order.push([i, tx(g[1])]); });
    if (groups[-1]) order.push([-1, tx(OTHER)]);
    if (order.length === 1) return '<span class="cp-seg">' + chips(keys.map(function (k) { return [k, emo(k) + ' ' + pName(k, P[k])]; }), SEL.p, 'p') + '</span>';
    return order.map(function (o) { return '<div class="pm-pg"><span class="cp-lab">' + esc(o[1]) + '</span><span class="cp-seg">' + chips(groups[o[0]].map(function (k) { return [k, emo(k) + ' ' + pName(k, P[k])]; }), SEL.p, 'p') + '</span></div>'; }).join('');
  }
  function panel(ps, i, tot) {
    var nd = node(), P = prods()[SEL.p], prev = i > 0 ? i - 1 : null;
    var head = '<div class="pm-hd"><span class="pm-emo" aria-hidden="true">' + emo(SEL.p) + '</span> ' + esc(pName(SEL.p, P)) + '<span class="cp-m"> · ' + esc(D.years[i]) + '</span></div>';
    if (!nd || !ps.length) return head + '<p class="di-movers-hint">' + esc(tx(T.noPartner)) + '</p>';
    var hasWorld = nd.world && nd.world[i] != null, t0 = prev != null ? totalOf(nd, prev) : null, lead = ps[0];
    var sh3 = 0; ps.slice(0, 3).forEach(function (r) { sh3 += r.v[i]; });
    var max = lead.v[i];
    var list = '<ol class="pm-top">' + ps.slice(0, 10).map(function (r, n) {
      return '<li><span class="ct-nm">' + medal(n + 1) + ' ' + esc(flag(r.c) + cname(r.c, r.n)) + '</span><span class="pm-bar"><i style="width:' + (100 * r.v[i] / max).toFixed(1) + '%"></i></span><b>' + esc(money(r.v[i])) + '</b><span class="cp-m">' + (tot ? nf(100 * r.v[i] / tot, 1) + ' %' : '') + '</span>' + chg(prev != null ? pct(r.v[i], r.v[prev]) : null) + '</li>';
    }).join('') + '</ol>';
    var split = '';
    if (nd.intra && nd.extra && nd.intra[i] != null) split = '<div class="cp-pk">' + esc(tx(T.intra)) + ': <b>' + esc(money(nd.intra[i])) + '</b> · ' + esc(tx(T.extra)) + ': <b>' + esc(money(nd.extra[i])) + '</b></div>';
    return head +
      '<div class="pm-lead"><div class="cp-tl">' + esc(tx(T.first)) + '</div><div class="pm-lv">🥇 ' + esc(flag(lead.c) + cname(lead.c, lead.n)) + '</div><div class="cp-ts">' + (tot ? '<b>' + nf(100 * lead.v[i] / tot, 1) + ' %</b> ' + esc(tx(T.of)) + ' · ' : '') + esc(money(lead.v[i])) + (prev != null ? ' ' + chg(pct(lead.v[i], lead.v[prev])) + ' <span class="cp-m">' + esc(tx(T.vs)) + '</span>' : '') + '</div></div>' +
      '<div class="cp-pk">' + esc(hasWorld ? tx(T.total) : tx(T.sumMain)) + ': <b>' + esc(money(tot)) + '</b> ' + (prev != null ? chg(pct(tot, t0)) : '') + '</div>' + split +
      (tot ? '<div class="cp-pk">' + esc(tx(T.top3)) + ' <b>' + nf(100 * sh3 / tot, 0) + ' %</b> ' + esc(tx(T.of)) + '</div>' : '') +
      '<h3 class="cp-h3">' + esc(tx(T.top)) + '</h3>' + list;
  }
  function productsTable(i) {
    var P = prods(), prev = i > 0 ? i - 1 : null, rows = '', last = -2;
    var keys = Object.keys(P).sort(function (a, b) { var ga = grpOf(a), gb = grpOf(b); ga = ga < 0 ? 99 : ga; gb = gb < 0 ? 99 : gb; return ga - gb; });
    keys.forEach(function (k) {
      var nd = P[k][SEL.f]; if (!nd) return;
      var g = grpOf(k);
      if (g !== last) { last = g; rows += '<tr class="pm-grp"><td colspan="4">' + esc(tx(g < 0 ? OTHER : GRP[g][1])) + '</td></tr>'; }
      var tot = totalOf(nd, i), ps = parts(nd, i), ld = ps[0];
      rows += '<tr><td><button type="button" class="cp-lk" data-pk="' + esc(k) + '">' + emo(k) + ' <b>' + esc(pName(k, P[k])) + '</b></button></td><td class="num">' + esc(money(tot)) + '</td><td class="num">' + chg(prev != null ? pct(tot, totalOf(nd, prev)) : null) + '</td><td>' + (ld ? '🥇 ' + esc(flag(ld.c) + cname(ld.c, ld.n)) + ' <span class="cp-m">' + (tot ? nf(100 * ld.v[i] / tot, 0) + ' %' : '') + '</span>' : '<span class="cp-m">—</span>') + '</td></tr>';
    });
    return '<section id="ct-productos" class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.prodT)) + ' · ' + esc(flag(SEL.c) + cname(SEL.c)) + ' · ' + esc(tx(T.flow[SEL.f])) + '</h2><p class="di-movers-hint">' + esc(tx(T.prodS)) + '</p><div class="di-table-wrap"><table class="di-table cp-tbl pm-lt"><thead><tr><th>' + esc(tx(T.product)) + '</th><th class="num">' + esc(tx(T.hVal)) + '</th><th class="num">' + esc(tx(T.hChg)) + '</th><th>' + esc(tx(T.hTop)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }
  function sourceSection() {
    var src = D.source || {}, note = SEL.c === 'US' ? T.noteUS : EUC.indexOf(SEL.c) >= 0 ? T.noteEU : T.noteOth;
    var links = [];
    if (SEL.c === 'US') links.push(['exportaciones.html', '🇺🇸', tx(T.usLink)]);
    links.push(['paises.html?c=' + SEL.c, '🧭', tx(T.fiche)], ['aranceles.html', '🛃', tx(T.tariffs)]);
    return '<section id="ct-fuente" class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.srcT)) + '</h2><p class="di-movers-hint">' + esc(tx(note)) + '</p><p class="di-movers-hint">' + esc(tx(T.src)) + ': ' + (src.url ? '<a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.name || src.url) + '</a>' : esc(src.name || '')) + (src.license ? ' · ' + esc(src.license) : '') + '</p>' +
      '<h3 class="cp-h3">' + esc(tx(T.more)) + '</h3><div class="cp-links">' + links.map(function (l) { return '<a class="cp-link" href="' + esc(l[0]) + '"><span aria-hidden="true">' + l[1] + '</span> ' + esc(l[2]) + '</a>'; }).join('') + '</div></section>';
  }
  function barUp() { var F = S.frame; if (!F || !F.bar) return; F.bar(document.getElementById('pa-bar'), tx(T.bar), ['mapa', 'productos', 'fuente'].map(function (k) { return ['ct-' + k, tx(T.bars[k])]; })); }
  function setUrl() { try { var u = new URL(global.location.href); u.searchParams.set('c', SEL.c); u.searchParams.set('f', SEL.f); u.searchParams.set('p', SEL.p); u.searchParams.set('y', D.years[SEL.y]); global.history.replaceState(null, '', u.toString()); } catch (e) { /* sin URL */ } }

  function render() {
    var root = document.getElementById('ct-body'); if (!root || !D) return;
    var h1 = document.getElementById('ct-h1'), sub = document.getElementById('ct-sub'); if (h1) h1.textContent = tx(T.title); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.title) + ' | Dehesa Index';
    var P = prods(); if (!P[SEL.p] || !P[SEL.p][SEL.f]) { SEL.p = P['0'] ? '0' : P['farm-food'] ? 'farm-food' : Object.keys(P)[0]; }
    var yrs = D.years; if (SEL.y < 0 || SEL.y >= yrs.length) SEL.y = yrs.length - 1;
    var i = SEL.y, nd = node(), ps = parts(nd, i), tot = totalOf(nd, i);
    classify(ps, i);
    var opts = CC.map(function (k) { return '<option value="' + k + '"' + (k === SEL.c ? ' selected' : '') + '>' + esc(flag(k) + cname(k)) + '</option>'; }).sort().join('');
    var yopts = yrs.map(function (y, n) { return '<option value="' + n + '"' + (n === i ? ' selected' : '') + '>' + esc(y) + '</option>'; }).reverse().join('');
    root.innerHTML = '<div class="cp-pick"><label for="ct-cc">' + esc(tx(T.country)) + '</label> <select data-cpick="1" id="ct-cc" class="di-compare-select">' + opts + '</select><span class="cp-seg">' + chips([['exp', tx(T.flow.exp)], ['imp', tx(T.flow.imp)]], SEL.f, 'f') + '</span><label for="ct-yy">' + esc(tx(T.year)) + '</label> <select data-cpick="1" id="ct-yy" class="di-compare-select">' + yopts + '</select></div>' +
      '<section id="ct-mapa" class="cp-hero"><div class="cp-mapcol"><div class="pm-chipbox">' + productChips() + '</div><div id="ct-map" class="cp-map" role="img" aria-label="' + esc(tx(T.title)) + '"></div><div id="ct-legend" class="cp-legend"></div></div><aside class="cp-panel" id="ct-panel" aria-live="polite">' + panel(ps, i, tot) + '</aside></section>' +
      productsTable(i) + sourceSection();
    wire(root); drawMap(ps, i, tot); barUp();
  }
  function reload(cc) {
    var root = document.getElementById('ct-body');
    load(cc).then(function (d) {
      if (!d || !d.reporters || !d.reporters[cc]) { if (root) root.innerHTML = '<p>' + esc(tx(T.fail)) + '</p>'; return; }
      D = d; SEL.c = cc; SEL.y = -1; setUrl(); render();
    });
  }
  function wire(root) {
    var cc = document.getElementById('ct-cc'); if (cc) cc.onchange = function () { reload(cc.value); };
    var yy = document.getElementById('ct-yy'); if (yy) yy.onchange = function () { SEL.y = +yy.value; setUrl(); render(); };
    [].forEach.call(root.querySelectorAll('button[data-f]'), function (b) { b.onclick = function () { SEL.f = b.getAttribute('data-f'); setUrl(); render(); }; });
    [].forEach.call(root.querySelectorAll('button[data-p]'), function (b) { b.onclick = function () { SEL.p = b.getAttribute('data-p'); setUrl(); render(); }; });
    [].forEach.call(root.querySelectorAll('button[data-pk]'), function (b) { b.onclick = function () { SEL.p = b.getAttribute('data-pk'); setUrl(); render(); var m = document.getElementById('ct-mapa'); if (m && m.scrollIntoView) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
  }
  function boot() {
    var root = document.getElementById('ct-body'); if (!root) return;
    if (S.init) S.init('information');
    try { var q = new URLSearchParams(global.location.search), c = (q.get('c') || '').toUpperCase(); if (c === 'GR') c = 'EL'; if (c === 'GB') c = 'UK'; if (CC.indexOf(c) >= 0) SEL.c = c; if (q.get('f') === 'imp') SEL.f = 'imp'; if (q.get('p')) SEL.p = q.get('p'); var y = q.get('y'); SEL.yq = y; } catch (e) { /* sin parámetros */ }
    root.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.loading)) + '</p>';
    Promise.all([load(SEL.c), global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function (r) {
      if (!r[0] || !r[0].reporters || !r[0].reporters[SEL.c]) { root.innerHTML = '<p>' + esc(tx(T.fail)) + '</p>'; return; }
      D = r[0]; if (SEL.yq) { var n = D.years.map(String).indexOf(String(SEL.yq)); if (n >= 0) SEL.y = n; }
      render();
    });
    S.onLangChange = function () { render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
