/* Dehesa Index — Ganadería y lácteo de EE. UU. (USDA NASS Quick Stats): cerdos, vacuno, leche y existencias en frío. */
(function () {
  'use strict';
  var D = null;
  var SEL = { tab: 'hogs', key: null, state: null };
  var C1 = '#1d5178', SEQ = ['#eef2f5', '#c6d5e0', '#8fb0c8', '#4f82a6', '#1d5178'];
  var ST = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  var P = 0; // índice de idioma en las tablas de etiquetas: es, en, fr, it
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  // Etiquetas de series: short_desc de Quick Stats → [es, en, fr, it]
  var LBL = {
    'HOGS - INVENTORY': ['Cerdos · total', 'Hogs · total inventory', 'Porcs · total', 'Suini · totale'],
    'HOGS, BREEDING - INVENTORY': ['Cerdos · reproductores', 'Hogs · breeding herd', 'Porcs · reproducteurs', 'Suini · riproduttori'],
    'HOGS, MARKET - INVENTORY': ['Cerdos · de mercado (cebo)', 'Hogs · market', 'Porcs · à l’engrais', 'Suini · da macello'],
    'HOGS, MARKET, LT 50 LBS - INVENTORY': ['Cerdos de mercado · menos de 50 lb', 'Market hogs · under 50 lb', 'Porcs à l’engrais · moins de 50 lb', 'Suini da macello · meno di 50 lb'],
    'HOGS, MARKET, 50 TO 119 LBS - INVENTORY': ['Cerdos de mercado · 50–119 lb', 'Market hogs · 50–119 lb', 'Porcs à l’engrais · 50–119 lb', 'Suini da macello · 50–119 lb'],
    'HOGS, MARKET, 120 TO 179 LBS - INVENTORY': ['Cerdos de mercado · 120–179 lb', 'Market hogs · 120–179 lb', 'Porcs à l’engrais · 120–179 lb', 'Suini da macello · 120–179 lb'],
    'HOGS, MARKET, GE 180 LBS - INVENTORY': ['Cerdos de mercado · 180 lb o más', 'Market hogs · 180 lb and over', 'Porcs à l’engrais · 180 lb et plus', 'Suini da macello · 180 lb e oltre'],
    'HOGS - PIG CROP, MEASURED IN HEAD': ['Camada de lechones (trimestre)', 'Pig crop (quarter)', 'Porcelets nés (trimestre)', 'Nati di suinetti (trimestre)'],
    'HOGS - LITTER RATE, MEASURED IN PIGS / LITTER': ['Lechones por camada (trimestre)', 'Pigs per litter (quarter)', 'Porcelets par portée (trimestre)', 'Suinetti per figliata (trimestre)'],
    'CATTLE, INCL CALVES - INVENTORY': ['Vacuno total, con terneros', 'All cattle and calves', 'Bovins total, avec veaux', 'Bovini totali, con vitelli'],
    'CATTLE, COWS - INVENTORY': ['Vacas (carne y leche)', 'Cows (beef and milk)', 'Vaches (viande et lait)', 'Vacche (carne e latte)'],
    'CATTLE, COWS, BEEF - INVENTORY': ['Vacas de carne', 'Beef cows', 'Vaches allaitantes', 'Vacche da carne'],
    'CATTLE, COWS, MILK - INVENTORY': ['Vacas lecheras', 'Milk cows', 'Vaches laitières', 'Vacche da latte'],
    'CATTLE, CALVES - INVENTORY': ['Terneros', 'Calves', 'Veaux', 'Vitelli'],
    'CATTLE, BULLS, GE 500 LBS - INVENTORY': ['Toros (500 lb o más)', 'Bulls (500 lb and over)', 'Taureaux (500 lb et plus)', 'Tori (500 lb e oltre)'],
    'CATTLE, HEIFERS, GE 500 LBS - INVENTORY': ['Novillas (500 lb o más)', 'Heifers (500 lb and over)', 'Génisses (500 lb et plus)', 'Manze (500 lb e oltre)'],
    'CATTLE, HEIFERS, GE 500 LBS, BEEF REPLACEMENT - INVENTORY': ['Novillas de reposición, carne', 'Beef replacement heifers', 'Génisses de renouvellement, viande', 'Manze di rimonta, carne'],
    'CATTLE, HEIFERS, GE 500 LBS, MILK REPLACEMENT - INVENTORY': ['Novillas de reposición, leche', 'Milk replacement heifers', 'Génisses de renouvellement, lait', 'Manze di rimonta, latte'],
    'CATTLE, STEERS, GE 500 LBS - INVENTORY': ['Novillos (500 lb o más)', 'Steers (500 lb and over)', 'Bouvillons (500 lb et plus)', 'Manzi (500 lb e oltre)'],
    'CATTLE, ON FEED - INVENTORY': ['Ganado en cebadero', 'Cattle on feed', 'Bovins en engraissement', 'Bovini all’ingrasso'],
    'MILK - PRODUCTION, MEASURED IN LB': ['Producción de leche', 'Milk production', 'Production de lait', 'Produzione di latte'],
    'MILK - PRODUCTION, MEASURED IN LB / HEAD': ['Producción de leche por vaca', 'Milk production per cow', 'Production de lait par vache', 'Produzione di latte per vacca'],
    'MILK - PRICE RECEIVED, MEASURED IN $ / CWT': ['Precio recibido por la leche', 'Milk price received', 'Prix reçu pour le lait', 'Prezzo ricevuto per il latte']
  };
  var PROD = { BEEF: ['Vacuno', 'Beef', 'Bœuf', 'Manzo'], PORK: ['Cerdo', 'Pork', 'Porc', 'Maiale'], CHICKENS: ['Pollo', 'Chicken', 'Poulet', 'Pollo'], TURKEYS: ['Pavo', 'Turkey', 'Dinde', 'Tacchino'], 'LAMB & MUTTON': ['Cordero y ovino', 'Lamb and mutton', 'Agneau et mouton', 'Agnello e montone'], VEAL: ['Ternera', 'Veal', 'Veau', 'Vitello'], BUTTER: ['Mantequilla', 'Butter', 'Beurre', 'Burro'], CHEESE: ['Queso', 'Cheese', 'Fromage', 'Formaggio'], EGGS: ['Huevos', 'Eggs', 'Œufs', 'Uova'] };
  var CUT = { 'BONE-IN': ['con hueso', 'bone-in', 'avec os', 'con osso'], BONELESS: ['deshuesado', 'boneless', 'désossé', 'disossato'], BELLIES: ['panceta', 'bellies', 'poitrines', 'pancette'], BUTTS: ['paleta (butts)', 'butts', 'épaules (butts)', 'spalle (butts)'], HAMS: ['jamones', 'hams', 'jambons', 'prosciutti'], LOINS: ['lomos', 'loins', 'longes', 'lombi'], PICNICS: ['paletillas', 'picnics', 'palerons', 'spalle (picnics)'], RIBS: ['costillas', 'ribs', 'côtes', 'costine'], TRIMMINGS: ['recortes', 'trimmings', 'parures', 'rifilature'], 'VARIETY MEATS': ['despojos', 'variety meats', 'abats', 'frattaglie'], 'OTHER CLASS': ['otras', 'other', 'autres', 'altri'], UNCLASSIFIED: ['sin clasificar', 'unclassified', 'non classé', 'non classificato'], BREASTS: ['pechugas', 'breasts', 'poitrines', 'petti'], 'BREASTS & BREAST MEAT': ['pechugas', 'breasts', 'poitrines', 'petti'], WINGS: ['alas', 'wings', 'ailes', 'ali'], LEGS: ['muslos y patas', 'legs', 'cuisses', 'cosce'], 'LEG QUARTERS': ['cuartos traseros', 'leg quarters', 'quartiers arrière', 'quarti posteriori'], DRUMSTICKS: ['contramuslos', 'drumsticks', 'pilons', 'sovracosce'], THIGH: ['muslo', 'thigh', 'haut de cuisse', 'coscia'], 'THIGH & THIGH QUARTERS': ['muslos', 'thighs', 'hauts de cuisse', 'cosce'], 'THIGH MEAT': ['carne de muslo', 'thigh meat', 'viande de cuisse', 'carne di coscia'], 'PAWS & FEET': ['patas', 'paws and feet', 'pattes', 'zampe'], 'OTHER PARTS & FORMS': ['otras partes', 'other parts', 'autres morceaux', 'altre parti'], WHOLE: ['enteros', 'whole', 'entiers', 'interi'], 'YOUNG, WHOLE': ['jóvenes, enteros', 'young, whole', 'jeunes, entiers', 'giovani, interi'], 'MATURE, WHOLE, HENS': ['gallinas adultas', 'mature hens', 'poules adultes', 'galline adulte'], 'WHOLE, HENS': ['hembras enteras', 'whole hens', 'femelles entières', 'femmine intere'], 'WHOLE, TOMS': ['machos enteros', 'whole toms', 'mâles entiers', 'maschi interi'], 'DEBONED MEAT': ['carne deshuesada', 'deboned meat', 'viande désossée', 'carne disossata'], YOLKS: ['yemas', 'yolks', 'jaunes', 'tuorli'], WHITE: ['claras', 'whites', 'blancs', 'albumi'], 'WHOLE OR MIXED': ['enteros o mezcla', 'whole or mixed', 'entiers ou mélange', 'interi o misti'], NATURAL: ['natural', 'natural', 'naturel', 'naturale'], AMERICAN: ['americano', 'American', 'américain', 'americano'], SWISS: ['suizo', 'Swiss', 'suisse', 'svizzero'], '(EXCL AMERICAN & SWISS)': ['sin americano ni suizo', 'excl. American and Swiss', 'hors américain et suisse', 'escl. americano e svizzero'] };
  var COLD_ORDER = ['BEEF', 'PORK', 'CHICKENS', 'TURKEYS', 'LAMB & MUTTON', 'VEAL', 'BUTTER', 'CHEESE', 'EGGS'];
  function coldLabel(k) {
    var head = k.split(' - ')[0].replace(/, COLD STORAGE.*$/, ''), parts = head.split(', '), prod = PROD[parts[0]];
    if (!prod) return k;
    var rest = parts.slice(1), out = [];
    var i = 0; while (i < rest.length) { var two = rest[i] + ', ' + rest[i + 1]; var three = rest[i] + ', ' + rest[i + 1] + ', ' + rest[i + 2]; if (CUT[three]) { out.push(CUT[three][P]); i += 3; } else if (rest[i + 1] && CUT[two]) { out.push(CUT[two][P]); i += 2; } else { out.push(CUT[rest[i]] ? CUT[rest[i]][P] : rest[i].toLowerCase()); i++; } }
    return prod[P] + (out.length ? ' · ' + out.join(', ') : '');
  }
  var GROUPS = {
    hogs: ['HOGS - INVENTORY', 'HOGS, BREEDING - INVENTORY', 'HOGS, MARKET - INVENTORY', 'HOGS, MARKET, LT 50 LBS - INVENTORY', 'HOGS, MARKET, 50 TO 119 LBS - INVENTORY', 'HOGS, MARKET, 120 TO 179 LBS - INVENTORY', 'HOGS, MARKET, GE 180 LBS - INVENTORY', 'HOGS - PIG CROP, MEASURED IN HEAD', 'HOGS - LITTER RATE, MEASURED IN PIGS / LITTER'],
    cattle: ['CATTLE, INCL CALVES - INVENTORY', 'CATTLE, COWS - INVENTORY', 'CATTLE, COWS, BEEF - INVENTORY', 'CATTLE, COWS, MILK - INVENTORY', 'CATTLE, CALVES - INVENTORY', 'CATTLE, ON FEED - INVENTORY', 'CATTLE, BULLS, GE 500 LBS - INVENTORY', 'CATTLE, STEERS, GE 500 LBS - INVENTORY', 'CATTLE, HEIFERS, GE 500 LBS - INVENTORY', 'CATTLE, HEIFERS, GE 500 LBS, BEEF REPLACEMENT - INVENTORY', 'CATTLE, HEIFERS, GE 500 LBS, MILK REPLACEMENT - INVENTORY'],
    dairy: ['MILK - PRODUCTION, MEASURED IN LB', 'MILK - PRODUCTION, MEASURED IN LB / HEAD', 'MILK - PRICE RECEIVED, MEASURED IN $ / CWT'],
    cold: null
  };
  var QONLY = { 'HOGS - PIG CROP, MEASURED IN HEAD': 1, 'HOGS - LITTER RATE, MEASURED IN PIGS / LITTER': 1 };
  var T = {
    es: { title: 'Ganadería y lácteo de EE. UU.', sub: 'Censo de cerdos y vacuno, producción de leche por estado y existencias de carne y lácteos en cámaras frigoríficas. Datos de USDA NASS (encuestas Hogs and Pigs, Cattle, Milk Production y Cold Storage) tal como los publica Quick Stats.',
      hogs: 'Cerdos', cattle: 'Vacuno', dairy: 'Leche', cold: 'Existencias en frío', series: 'Serie', latest: 'Último dato', vsPrev: 'frente al dato anterior', vsYear: 'frente al mismo periodo del año anterior', hist: 'Evolución', states: 'Por estado', state: 'Estado', value: 'Valor', chg: 'Variación anual', noData: 'Sin datos.', noStates: 'NASS no publica esta serie por estado.',
      legend: 'Tramos por quintiles del valor', pick: 'Pulsa un estado para ver su evolución.', period: 'Periodo', heads: 'cabezas', pigs: 'lechones', cwt: 'cwt (45,36 kg)', lb: 'lb',
      note: 'Fuente: USDA NASS, Quick Stats (datos públicos). Las encuestas de cerdos son trimestrales (1 dic., 1 mar., 1 jun., 1 sep.), las de vacuno semestrales (1 ene. y 1 jul.), la leche y las existencias en frío mensuales. Los datos por estado solo se muestran cuando NASS los publica para el mismo periodo. “lb” = libras (1 lb = 0,4536 kg). Este producto usa la API de NASS pero no está respaldado ni certificado por NASS.',
      src: 'Fuente: USDA NASS (datos públicos)', mLb: 'M lb', kLb: 'mil lb' },
    en: { title: 'U.S. livestock and dairy', sub: 'Hog and cattle inventories, milk production by state and meat and dairy stocks in cold storage. USDA NASS data (Hogs and Pigs, Cattle, Milk Production and Cold Storage surveys) as published in Quick Stats.',
      hogs: 'Hogs', cattle: 'Cattle', dairy: 'Milk', cold: 'Cold storage', series: 'Series', latest: 'Latest', vsPrev: 'vs. previous reading', vsYear: 'vs. same period last year', hist: 'Trend', states: 'By state', state: 'State', value: 'Value', chg: 'YoY change', noData: 'No data.', noStates: 'NASS does not publish this series by state.',
      legend: 'Value quintiles', pick: 'Click a state to see its trend.', period: 'Period', heads: 'head', pigs: 'pigs', cwt: 'cwt (100 lb)', lb: 'lb',
      note: 'Source: USDA NASS, Quick Stats (public data). Hog surveys are quarterly (Dec 1, Mar 1, Jun 1, Sep 1), cattle inventories semi-annual (Jan 1 and Jul 1), milk and cold storage are monthly. State data are shown only when NASS publishes them for the same period. “lb” = pounds. This product uses the NASS API but is not endorsed or certified by NASS.',
      src: 'Source: USDA NASS (public data)', mLb: 'M lb', kLb: 'k lb' },
    fr: { title: 'Élevage et lait aux États-Unis', sub: 'Inventaires de porcs et de bovins, production de lait par État et stocks de viande et de produits laitiers en entrepôt frigorifique. Données de l’USDA NASS (enquêtes Hogs and Pigs, Cattle, Milk Production et Cold Storage) telles que publiées dans Quick Stats.',
      hogs: 'Porcs', cattle: 'Bovins', dairy: 'Lait', cold: 'Stocks frigorifiques', series: 'Série', latest: 'Dernier chiffre', vsPrev: 'par rapport au relevé précédent', vsYear: 'par rapport à la même période l’an dernier', hist: 'Évolution', states: 'Par État', state: 'État', value: 'Valeur', chg: 'Variation annuelle', noData: 'Pas de données.', noStates: 'NASS ne publie pas cette série par État.',
      legend: 'Quintiles de la valeur', pick: 'Cliquez sur un État pour voir son évolution.', period: 'Période', heads: 'têtes', pigs: 'porcelets', cwt: 'cwt (100 lb)', lb: 'lb',
      note: 'Source : USDA NASS, Quick Stats (données publiques). Les enquêtes porcines sont trimestrielles (1er déc., mars, juin, sept.), les inventaires bovins semestriels (1er janv. et juil.), le lait et les stocks frigorifiques mensuels. Les données par État ne sont affichées que si NASS les publie pour la même période. « lb » = livres. Ce produit utilise l’API de NASS mais n’est ni approuvé ni certifié par NASS.',
      src: 'Source : USDA NASS (données publiques)', mLb: 'M lb', kLb: 'k lb' },
    it: { title: 'Zootecnia e latte negli USA', sub: 'Inventari di suini e bovini, produzione di latte per Stato e scorte di carne e latticini in celle frigorifere. Dati USDA NASS (indagini Hogs and Pigs, Cattle, Milk Production e Cold Storage) come pubblicati in Quick Stats.',
      hogs: 'Suini', cattle: 'Bovini', dairy: 'Latte', cold: 'Scorte in frigo', series: 'Serie', latest: 'Ultimo dato', vsPrev: 'rispetto al dato precedente', vsYear: 'rispetto allo stesso periodo dell’anno scorso', hist: 'Andamento', states: 'Per Stato', state: 'Stato', value: 'Valore', chg: 'Variazione annua', noData: 'Nessun dato.', noStates: 'NASS non pubblica questa serie per Stato.',
      legend: 'Quintili del valore', pick: 'Clicca su uno Stato per vederne l’andamento.', period: 'Periodo', heads: 'capi', pigs: 'suinetti', cwt: 'cwt (100 lb)', lb: 'lb',
      note: 'Fonte: USDA NASS, Quick Stats (dati pubblici). Le indagini sui suini sono trimestrali (1 dic., mar., giu., set.), gli inventari dei bovini semestrali (1 gen. e 1 lug.), latte e scorte in frigo mensili. I dati per Stato sono mostrati solo se NASS li pubblica per lo stesso periodo. “lb” = libbre. Questo prodotto usa l’API di NASS ma non è approvato né certificato da NASS.',
      src: 'Fonte: USDA NASS (dati pubblici)', mLb: 'M lb', kLb: 'k lb' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tr() { P = LI[lang()] || 0; return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function label(k) { return LBL[k] ? LBL[k][P] : /COLD STORAGE/.test(k) ? coldLabel(k) : k; }
  function fmt(u, v, t) {
    if (u === 'HEAD') return v >= 1e6 ? nf(v / 1e6, 2) + ' M' : v >= 1e3 ? nf(v / 1e3, 0) + ' k' : nf(v, 0);
    if (u === 'LB') return v >= 1e9 ? nf(v / 1e9, 2) + ' ' + (lang() === 'en' ? 'bn' : lang() === 'fr' ? 'Md' : lang() === 'it' ? 'mld' : 'mil M') + ' lb' : nf(v / 1e6, 0) + ' M lb';
    if (u === 'LB / HEAD') return nf(v, 0) + ' lb';
    if (u === '$ / CWT') return '$ ' + nf(v, 2) + ' / cwt';
    if (u === 'PIGS / LITTER') return nf(v, 2);
    return nf(v, 2);
  }
  function unitNote(u, t) { return u === 'HEAD' ? t.heads : u === 'PIGS / LITTER' ? t.pigs : u === '$ / CWT' ? t.cwt : u === 'LB' || u === 'LB / HEAD' ? t.lb : u; }
  function pct(a, b) { return b ? (a / b - 1) * 100 : null; }
  function chgHtml(p) { if (p === null) return '<span style="color:var(--text-faint)">—</span>'; var c = p > 0.05 ? '#2f7d4f' : p < -0.05 ? '#a9491f' : 'var(--text-faint)'; return '<span style="color:' + c + ';font-weight:600">' + (p > 0.05 ? '+' : p < -0.05 ? '−' : '') + nf(Math.abs(p), 1) + ' %</span>'; }
  function plabel(p) { return p.length === 7 ? p : p; }
  function prevYear(p) { return (Number(p.slice(0, 4)) - 1) + p.slice(4); }
  function pts(arr, k) { return QONLY[k] ? arr.filter(function (x) { return /-(02|05|08|11)$/.test(x[0]); }) : arr; }
  function lookup(arr, p) { for (var i = arr.length - 1; i >= 0; i--) if (arr[i][0] === p) return arr[i][1]; return null; }
  function groupKeys(tab) {
    if (tab === 'cold') { var ks = Object.keys(D.series).filter(function (k) { return /COLD STORAGE/.test(k); }); ks.sort(function (a, b) { var pa = COLD_ORDER.indexOf(a.split(', ')[0]), pb = COLD_ORDER.indexOf(b.split(', ')[0]); return pa - pb || a.split(', ').length - b.split(', ').length || a.localeCompare(b); }); return ks; }
    return GROUPS[tab].filter(function (k) { return D.series[k] && D.series[k].n.length; });
  }
  function lineChart(a, u, t) {
    var W = 720, H = 230, L = 62, R = 12, Tp = 12, Bt = 26, n = a.length, min = Infinity, max = -Infinity;
    a.forEach(function (x) { if (x[1] > max) max = x[1]; if (x[1] < min) min = x[1]; });
    if (n < 2) return '';
    var lo = min >= 0 ? Math.max(0, min - (max - min) * 0.15) : min, hi = max + (max - min) * 0.1 || max * 1.1;
    var x = function (i) { return L + (W - L - R) * i / (n - 1); }, y = function (v) { return Tp + (H - Tp - Bt) * (1 - (v - lo) / (hi - lo)); };
    var g = ''; for (var k = 0; k <= 4; k++) { var vv = lo + (hi - lo) * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(vv) + '" y2="' + y(vv) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (y(vv) + 4) + '" font-size="11" text-anchor="end" fill="var(--text-faint)">' + esc(fmt(u, vv, t)) + '</text>'; }
    var d = a.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[1]).toFixed(1); }).join(' ');
    var dots = n <= 40 ? a.map(function (p, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p[1]).toFixed(1) + '" r="3" fill="' + C1 + '"><title>' + esc(p[0] + ': ' + fmt(u, p[1], t)) + '</title></circle>'; }).join('') : '';
    var xl = [0, Math.floor((n - 1) / 2), n - 1].map(function (i) { return '<text x="' + x(i) + '" y="' + (H - 8) + '" font-size="11" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" fill="var(--text-faint)">' + esc(a[i][0]) + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img"><path d="' + d + '" fill="none" stroke="' + C1 + '" stroke-width="2.2" stroke-linejoin="round"/>' + g + dots + xl + '</svg>';
  }
  function card(label2, value, sub) { return '<div class="di-card" style="padding:14px 16px;flex:1 1 200px;min-width:180px"><div style="font-size:11px;letter-spacing:.4px;color:var(--text-faint);font-weight:700">' + esc(label2).toUpperCase() + '</div><div style="font-size:24px;font-weight:700;margin:4px 0 2px;font-family:\'Source Serif 4\',serif">' + value + '</div><div style="font-size:12.5px">' + sub + '</div></div>'; }
  function statesBlock(k, s, t, nat) {
    var rows = [], maxP = '';
    Object.keys(s.s).forEach(function (st) { if (!ST[st]) return; var a = pts(s.s[st], k); if (a.length && a[a.length - 1][0] > maxP) maxP = a[a.length - 1][0]; });
    Object.keys(s.s).forEach(function (st) { if (!ST[st]) return; var a = pts(s.s[st], k); if (!a.length || a[a.length - 1][0] !== maxP) return; var v = a[a.length - 1][1], pv = lookup(a, prevYear(maxP)); rows.push({ st: st, v: v, y: pv === null ? null : pct(v, pv) }); });
    if (rows.length < 5) return '<p class="di-movers-hint">' + esc(t.noStates) + '</p>';
    rows.sort(function (a, b) { return b.v - a.v; });
    var sorted = rows.map(function (r) { return r.v; }).sort(function (a, b) { return a - b; }), cuts = [1, 2, 3, 4].map(function (q) { return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q / 5))]; });
    var cls = function (v) { var i = 0; while (i < 4 && v >= cuts[i]) i++; return i; };
    var vals = {}; rows.forEach(function (r) { vals[r.st] = r; });
    var svg = window.DEHESA_US_STATES ? '<svg viewBox="' + window.DEHESA_US_STATES.viewBox + '" style="width:100%;height:auto;display:block" role="img">' + window.DEHESA_US_STATES.states.map(function (s2) { var r = vals[s2.id]; return '<path data-st="' + s2.id + '" d="' + s2.d + '" fill="' + (r ? SEQ[cls(r.v)] : '#e6e2d6') + '" stroke="#fff" stroke-width="0.8" stroke-linejoin="round"></path>'; }).join('') + '</svg>' : '';
    var lg = SEQ.map(function (c, i) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + c + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></span>' + esc(i === 0 ? '< ' + fmt(s.u, cuts[0], t) : i === 4 ? '≥ ' + fmt(s.u, cuts[3], t) : fmt(s.u, cuts[i - 1], t) + ' – ' + fmt(s.u, cuts[i], t)) + '</span>'; }).join('');
    var th = function (x, r) { return '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:' + (r ? 'right' : 'left') + '">' + esc(x).toUpperCase() + '</th>'; };
    var tbl = '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><tr>' + th(t.state) + '<th></th>' + th(t.value, 1) + th(t.chg, 1) + '</tr>' +
      rows.map(function (r) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:9px 6px;font-weight:600;white-space:nowrap">' + esc(ST[r.st]) + '</td><td style="padding:9px 6px;width:30%"><div style="height:8px;border-radius:2px 4px 4px 2px;background:' + SEQ[3] + ';width:' + (r.v / rows[0].v * 100).toFixed(1) + '%"></div></td><td style="padding:9px 6px;text-align:right;white-space:nowrap">' + esc(fmt(s.u, r.v, t)) + '</td><td style="padding:9px 6px;text-align:right">' + chgHtml(r.y) + '</td></tr>'; }).join('') + '</table></div>';
    return '<div style="font-weight:600;margin:18px 0 6px">' + esc(t.states) + ' · ' + esc(maxP) + '</div><div class="di-card" style="padding:8px;position:relative"><div id="gn-map">' + svg + '</div><div id="gn-tip" style="display:none;position:absolute;pointer-events:none;background:var(--surface,#fff);border:1px solid var(--border);border-radius:6px;padding:6px 9px;font-size:12.5px;box-shadow:0 2px 8px rgba(0,0,0,.12);white-space:nowrap"></div></div><div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;margin:8px 0">' + lg + '</div>' + tbl;
  }
  function render() {
    var t = tr(), root = document.getElementById('gn-body');
    document.title = 'Dehesa Index — ' + t.title;
    document.getElementById('pg-h1').textContent = t.title; document.getElementById('pg-sub').textContent = t.sub;
    if (!D) { root.innerHTML = '<p class="di-movers-hint">' + esc(t.noData) + '</p>'; return; }
    var tabs = ['hogs', 'cattle', 'dairy', 'cold'].filter(function (g) { return groupKeys(g).length; });
    if (tabs.indexOf(SEL.tab) < 0) SEL.tab = tabs[0];
    var keys = groupKeys(SEL.tab); if (keys.indexOf(SEL.key) < 0) SEL.key = keys[0];
    var s = D.series[SEL.key], a = pts(s.n, SEL.key), last = a[a.length - 1], prev = a.length > 1 ? a[a.length - 2] : null, py = lookup(a, prevYear(last[0]));
    var tabHtml = tabs.map(function (g) { return '<button type="button" class="di-link-btn" data-tab="' + g + '" aria-pressed="' + (SEL.tab === g) + '" style="' + (SEL.tab === g ? 'font-weight:700;text-decoration:underline;' : '') + 'margin-right:18px;font-size:15px">' + esc(t[g]) + '</button>'; }).join('');
    var opts = keys.map(function (k) { return '<option value="' + esc(k) + '"' + (k === SEL.key ? ' selected' : '') + '>' + esc(label(k)) + '</option>'; }).join('');
    var cards = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0">' + card(t.latest + ' · ' + last[0], esc(fmt(s.u, last[1], t)), '<span style="color:var(--text-faint)">' + esc(unitNote(s.u, t)) + '</span>') +
      card(t.vsPrev, prev ? chgHtml(pct(last[1], prev[1])) : '—', prev ? '<span style="color:var(--text-faint)">' + esc(prev[0] + ': ' + fmt(s.u, prev[1], t)) + '</span>' : '') +
      card(t.vsYear, py !== null ? chgHtml(pct(last[1], py)) : '—', py !== null ? '<span style="color:var(--text-faint)">' + esc(prevYear(last[0]) + ': ' + fmt(s.u, py, t)) + '</span>' : '') + '</div>';
    var chart = '<div class="di-card" style="padding:14px 16px"><div style="font-weight:600;margin-bottom:6px">' + esc(label(SEL.key)) + ' · ' + esc(t.hist) + '</div>' + lineChart(a, s.u, t) + '</div>';
    var st = Object.keys(s.s).length ? statesBlock(SEL.key, s, t) : '';
    root.innerHTML = '<div style="margin-bottom:14px">' + tabHtml + '</div><label style="font-size:13px">' + esc(t.series) + '<br><select id="gn-sel" class="di-compare-select" style="max-width:100%">' + opts + '</select></label>' + cards + chart + st +
      '<p class="di-info-api-notice" style="margin:14px 0 6px">' + esc(t.note) + '</p><p class="di-movers-hint">' + esc(t.src) + '</p>';
    Array.prototype.forEach.call(root.querySelectorAll('[data-tab]'), function (b) { b.onclick = function () { SEL.tab = b.getAttribute('data-tab'); SEL.key = null; render(); }; });
    document.getElementById('gn-sel').onchange = function (e) { SEL.key = e.target.value; render(); };
    var box = document.getElementById('gn-map'), tip = document.getElementById('gn-tip');
    if (box) { var wrap = tip.parentNode; Array.prototype.forEach.call(box.querySelectorAll('path'), function (p) {
      var code = p.getAttribute('data-st');
      p.addEventListener('mousemove', function (e) { var b = wrap.getBoundingClientRect(); var arr = s.s[code] ? pts(s.s[code], SEL.key) : null; tip.innerHTML = '<strong>' + esc(ST[code] || code) + '</strong><br>' + (arr && arr.length ? esc(fmt(s.u, arr[arr.length - 1][1], t)) + ' · ' + esc(arr[arr.length - 1][0]) : esc(t.noData)); tip.style.display = 'block'; tip.style.left = Math.min(e.clientX - b.left + 12, b.width - 170) + 'px'; tip.style.top = (e.clientY - b.top + 12) + 'px'; });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
    }); }
  }
  window.DehesaShared.init('informacion');
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  fetch('data/nass-livestock.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) {
    D = d && d.series && Object.keys(d.series).length ? d : null;
    var q = new URLSearchParams(window.location.search);
    if (q.get('tab') && GROUPS.hasOwnProperty(q.get('tab'))) SEL.tab = q.get('tab');
    render();
  });
})();
