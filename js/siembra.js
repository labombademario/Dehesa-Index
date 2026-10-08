/* Dehesa Index — «Qué sembrar este año» (idea de Mario, 8-oct-2026).
   Compara los cultivos que de verdad se siembran en tu región con cifras oficiales: rendimiento de los últimos 5 años, precio al productor
   actual y de campañas anteriores, costes de cultivo cuando existen (USDA ERS) y existencias frente a su media. Propone un reparto orientativo
   de tus hectáreas con reglas explicadas en la propia página. No es una predicción ni un consejo: no conoce tu suelo, tu agua, tus contratos
   ni tus ayudas. Datos: data/sowing/<pais>.json (scripts/build-sowing.py). ES5, sin librerías. */
(function () {
  'use strict';
  var S = window.DehesaShared, RN = window.DehesaRegionNames || {};
  var LI = { es: 1, en: 0, fr: 2, it: 3 };   // region-names.js: en|es|fr|it
  var FR_CODE = { '84': 'ARA', '27': 'BFC', '53': 'BRE', '24': 'CVL', '94': 'COR', '44': 'GES', '32': 'HDF', '11': 'IDF', '28': 'NOR', '75': 'NAQ', '76': 'OCC', '52': 'PDL', '93': 'PAC' };
  var T = {
    es: { h1: 'Qué sembrar este año', sub: 'Compara los cultivos que se siembran en tu región con datos oficiales —rendimiento, precio al productor, costes y existencias— y reparte tus hectáreas. Tú decides: aquí tienes los números y cómo se han calculado.',
      ctry: 'País', us: 'Estados Unidos (por estado)', fr: 'Francia (por región)', reg: 'Región', area: 'Superficie que vas a sembrar', choose: 'Elige…',
      tbl: 'Cultivos de tu región', cols: ['Cultivo', 'Se siembra en la región', 'Rendimiento esperado', 'Precio de referencia', 'Ingreso esperado', 'Costes directos', 'Margen esperado', 'Existencias', 'Variabilidad'],
      med: 'mediana 5 años', range: 'rango', avg12: 'media 12 meses', implied: 'precio medio del último año', ctd: 'campaña en curso (acumulado)', noCost: 'sin dato', yourCost: 'tu coste', ers: 'USDA ERS, media EE. UU.',
      stHigh: 'por encima de lo normal (presión sobre el precio)', stLow: 'por debajo de lo normal (apoyo al precio)', stNorm: 'normales', stNone: '—', cvLow: 'baja', cvMid: 'media', cvHigh: 'alta',
      plan: 'Reparto orientativo de tu superficie', planWhy: 'Cómo se reparte: más superficie a los cultivos con mejor margen esperado y menos variable (margen ÷ (1 + variabilidad)), sin pasar del 50 % de la superficie ni de 1,5 veces lo que la región suele dedicar a cada cultivo, para respetar la rotación y no depender de un solo mercado.',
      planRev: 'No hay costes publicados para estos cultivos: el reparto usa el ingreso esperado. Añade tus costes en la tabla para que use el margen.', planLeft: 'Sin asignar (rotación, barbecho o cultivos que no están en la tabla)', planTot: 'Resultado esperado del reparto', planRange: 'rango con años malos y buenos',
      excluded: 'Fuera del reparto por no tener coste (añade el tuyo para incluirlo): {l}.', negative: 'Fuera del reparto porque, con estos precios y costes, el margen esperado no es positivo: {l}.', costHint: 'Tus costes directos (semilla, abono, fitosanitarios, gasóleo, maquinaria) en {u}. Opcional; se guardan solo en este navegador.',
      caveat: 'No es una predicción ni un consejo de siembra. Usa medias recientes de tu región y el precio actual al productor; no conoce tu suelo, tu agua, tu rotación, tus contratos, el seguro ni las ayudas (PAC, programas de EE. UU.), y el precio de la próxima cosecha puede ser distinto. Contrasta con tu técnico o cooperativa.',
      src: 'Fuentes', noData: 'No hay datos de cultivos para esta región.', pick: 'Elige país y región para ver la comparación.', best: 'Mejor margen esperado', bestRev: 'Mayor ingreso esperado', perYear: 'Ingreso real por {u} en la región, últimos años', grown: 'del total' },
    en: { h1: 'What to plant this year', sub: 'Compare the crops grown in your area using official data —yield, farm price, costs and stocks— and split your acreage. You decide: here are the numbers and how they were worked out.',
      ctry: 'Country', us: 'United States (by state)', fr: 'France (by region)', reg: 'Area', area: 'Area you will plant', choose: 'Choose…',
      tbl: 'Crops in your area', cols: ['Crop', 'Grown in the area', 'Expected yield', 'Reference price', 'Expected revenue', 'Direct costs', 'Expected margin', 'Stocks', 'Variability'],
      med: '5-year median', range: 'range', avg12: '12-month average', implied: 'last year’s average price', ctd: 'current season (to date)', noCost: 'no data', yourCost: 'your cost', ers: 'USDA ERS, US average',
      stHigh: 'above normal (pressure on price)', stLow: 'below normal (price support)', stNorm: 'normal', stNone: '—', cvLow: 'low', cvMid: 'medium', cvHigh: 'high',
      plan: 'Indicative split of your land', planWhy: 'How it is split: more area to crops with a better and less variable expected margin (margin ÷ (1 + variability)), never above 50% of your area nor 1.5 times what the area usually plants of each crop, to respect rotation and avoid relying on a single market.',
      planRev: 'No published costs for these crops: the split uses expected revenue. Add your costs in the table so it uses the margin.', planLeft: 'Not allocated (rotation, fallow or crops not in the table)', planTot: 'Expected result of the split', planRange: 'range with bad and good years',
      excluded: 'Left out of the split because there is no cost (add yours to include it): {l}.', negative: 'Left out because, at these prices and costs, the expected margin is not positive: {l}.', costHint: 'Your direct costs (seed, fertiliser, crop protection, fuel, machinery) in {u}. Optional; stored only in this browser.',
      caveat: 'This is not a forecast or planting advice. It uses recent averages for your area and the current farm price; it does not know your soil, water, rotation, contracts, insurance or support payments, and next harvest’s price may differ. Check with your adviser or co-op.',
      src: 'Sources', noData: 'No crop data for this area.', pick: 'Choose a country and area to see the comparison.', best: 'Best expected margin', bestRev: 'Highest expected revenue', perYear: 'Actual revenue per {u} in the area, recent years', grown: 'of total' },
    fr: { h1: 'Que semer cette année', sub: 'Comparez les cultures de votre région avec des données officielles —rendement, prix producteur, coûts et stocks— et répartissez vos hectares. C’est vous qui décidez : voici les chiffres et leur calcul.',
      ctry: 'Pays', us: 'États-Unis (par État)', fr: 'France (par région)', reg: 'Région', area: 'Surface que vous allez semer', choose: 'Choisir…',
      tbl: 'Cultures de votre région', cols: ['Culture', 'Semée dans la région', 'Rendement attendu', 'Prix de référence', 'Recette attendue', 'Coûts directs', 'Marge attendue', 'Stocks', 'Variabilité'],
      med: 'médiane 5 ans', range: 'fourchette', avg12: 'moyenne 12 mois', implied: 'prix moyen de l’an dernier', ctd: 'campagne en cours (cumul)', noCost: 'pas de donnée', yourCost: 'votre coût', ers: 'USDA ERS, moyenne É.-U.',
      stHigh: 'au-dessus de la normale (pression sur le prix)', stLow: 'en dessous de la normale (soutien du prix)', stNorm: 'normaux', stNone: '—', cvLow: 'faible', cvMid: 'moyenne', cvHigh: 'forte',
      plan: 'Répartition indicative de votre surface', planWhy: 'Comment c’est réparti : plus de surface aux cultures dont la marge attendue est meilleure et moins variable (marge ÷ (1 + variabilité)), sans dépasser 50 % de la surface ni 1,5 fois ce que la région consacre habituellement à chaque culture, pour respecter la rotation et ne pas dépendre d’un seul marché.',
      planRev: 'Aucun coût publié pour ces cultures : la répartition utilise la recette attendue. Ajoutez vos coûts dans le tableau pour utiliser la marge.', planLeft: 'Non attribué (rotation, jachère ou cultures hors tableau)', planTot: 'Résultat attendu de la répartition', planRange: 'fourchette entre mauvaises et bonnes années',
      excluded: 'Hors répartition faute de coût (ajoutez le vôtre pour l’inclure) : {l}.', negative: 'Hors répartition car, avec ces prix et ces coûts, la marge attendue n’est pas positive : {l}.', costHint: 'Vos coûts directs (semences, engrais, phytos, carburant, machines) en {u}. Facultatif ; enregistrés seulement dans ce navigateur.',
      caveat: 'Ce n’est ni une prévision ni un conseil de semis. Cela utilise des moyennes récentes de votre région et le prix producteur actuel ; cela ne connaît ni votre sol, ni votre eau, ni votre rotation, ni vos contrats, l’assurance ou les aides (PAC…), et le prix de la prochaine récolte peut différer. Vérifiez avec votre conseiller ou votre coopérative.',
      src: 'Sources', noData: 'Pas de données de cultures pour cette région.', pick: 'Choisissez un pays et une région pour voir la comparaison.', best: 'Meilleure marge attendue', bestRev: 'Recette attendue la plus élevée', perYear: 'Recette réelle par {u} dans la région, années récentes', grown: 'du total' },
    it: { h1: 'Cosa seminare quest’anno', sub: 'Confronta le colture della tua zona con dati ufficiali —resa, prezzo al produttore, costi e scorte— e ripartisci i tuoi ettari. Decidi tu: qui ci sono i numeri e come sono calcolati.',
      ctry: 'Paese', us: 'Stati Uniti (per stato)', fr: 'Francia (per regione)', reg: 'Zona', area: 'Superficie che seminerai', choose: 'Scegli…',
      tbl: 'Colture della tua zona', cols: ['Coltura', 'Coltivata nella zona', 'Resa attesa', 'Prezzo di riferimento', 'Ricavo atteso', 'Costi diretti', 'Margine atteso', 'Scorte', 'Variabilità'],
      med: 'mediana 5 anni', range: 'intervallo', avg12: 'media 12 mesi', implied: 'prezzo medio dell’ultimo anno', ctd: 'campagna in corso (cumulato)', noCost: 'nessun dato', yourCost: 'tuo costo', ers: 'USDA ERS, media USA',
      stHigh: 'sopra la norma (pressione sul prezzo)', stLow: 'sotto la norma (sostegno al prezzo)', stNorm: 'nella norma', stNone: '—', cvLow: 'bassa', cvMid: 'media', cvHigh: 'alta',
      plan: 'Ripartizione indicativa della tua superficie', planWhy: 'Come si ripartisce: più superficie alle colture con margine atteso migliore e meno variabile (margine ÷ (1 + variabilità)), senza superare il 50 % della superficie né 1,5 volte quanto la zona dedica di solito a ogni coltura, per rispettare la rotazione e non dipendere da un solo mercato.',
      planRev: 'Nessun costo pubblicato per queste colture: la ripartizione usa il ricavo atteso. Aggiungi i tuoi costi nella tabella per usare il margine.', planLeft: 'Non assegnato (rotazione, maggese o colture fuori tabella)', planTot: 'Risultato atteso della ripartizione', planRange: 'intervallo tra annate cattive e buone',
      excluded: 'Fuori dalla ripartizione perché manca il costo (aggiungi il tuo per includerla): {l}.', negative: 'Fuori dalla ripartizione perché, con questi prezzi e costi, il margine atteso non è positivo: {l}.', costHint: 'I tuoi costi diretti (seme, concimi, fitofarmaci, gasolio, macchine) in {u}. Facoltativo; salvati solo in questo browser.',
      caveat: 'Non è una previsione né un consiglio di semina. Usa medie recenti della tua zona e il prezzo attuale al produttore; non conosce il tuo suolo, l’acqua, la rotazione, i contratti, l’assicurazione né gli aiuti (PAC, programmi USA), e il prezzo del prossimo raccolto può essere diverso. Verifica con il tuo tecnico o la cooperativa.',
      src: 'Fonti', noData: 'Nessun dato colturale per questa zona.', pick: 'Scegli paese e zona per vedere il confronto.', best: 'Margine atteso migliore', bestRev: 'Ricavo atteso più alto', perYear: 'Ricavo reale per {u} nella zona, anni recenti', grown: 'del totale' }
  };
  var NOTES = {"es": ["Rendimiento por estado (USDA NASS); ingreso por acre cosechado = valor de la producción ÷ acres cosechados (NASS); precio actual = media de 12 meses del precio recibido (NASS) o, si no hay serie mensual, precio implícito del último año; costes de USDA ERS (media nacional, no por estado).", "Rendimiento y superficie por región (SSP/Agreste vía FranceAgriMer; el último año es provisional); precio pagado al productor por campaña (FranceAgriMer, media acumulada de la campaña); ingreso por ha = rendimiento × precio de esa campaña. Dehesa no tiene costes de cultivo publicados para Francia: añade los tuyos."], "en": ["Yield by state (USDA NASS); revenue per harvested acre = value of production ÷ harvested acres (NASS); current price = 12-month average of the price received (NASS) or, without a monthly series, last year’s implied price; costs from USDA ERS (national average, not by state).", "Yield and area by region (SSP/Agreste via FranceAgriMer; the latest year is provisional); price paid to farmers by campaign (FranceAgriMer, campaign-to-date average); revenue per ha = yield × that campaign’s price. Dehesa has no published crop costs for France: add your own."], "fr": ["Rendement par État (USDA NASS) ; produit par acre récolté = valeur de la production ÷ acres récoltés (NASS) ; prix actuel = moyenne sur 12 mois du prix reçu (NASS) ou, sans série mensuelle, prix implicite de la dernière année ; coûts USDA ERS (moyenne nationale, pas par État).", "Rendement et surface par région (SSP/Agreste via FranceAgriMer ; la dernière année est provisoire) ; prix payé aux producteurs par campagne (FranceAgriMer, moyenne cumulée de la campagne) ; produit par ha = rendement × prix de cette campagne. Dehesa n’a pas de coûts de culture publiés pour la France : ajoutez les vôtres."], "it": ["Resa per stato (USDA NASS); ricavo per acro raccolto = valore della produzione ÷ acri raccolti (NASS); prezzo attuale = media di 12 mesi del prezzo ricevuto (NASS) o, senza serie mensile, prezzo implicito dell’ultimo anno; costi USDA ERS (media nazionale, non per stato).", "Resa e superficie per regione (SSP/Agreste tramite FranceAgriMer; l’ultimo anno è provvisorio); prezzo pagato ai produttori per campagna (FranceAgriMer, media progressiva della campagna); ricavo per ha = resa × prezzo di quella campagna. Dehesa non ha costi colturali pubblicati per la Francia: aggiungi i tuoi."]};
  var ST = { c: '', r: '', area: '', costs: {} }, DOCS = {}, LSK = 'di-siembra-v1';
  function lang() { return S.getLang(); }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return S.esc(x == null ? '' : String(x)); }
  function nf(v, d) { if (typeof v !== 'number' || !isFinite(v)) return '—'; try { return v.toLocaleString(lang(), { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); } catch (e) { return v.toFixed(d || 0); } }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : null; }
  function cv(a) { if (a.length < 3) return null; var m = a.reduce(function (s, x) { return s + x; }, 0) / a.length; if (!m) return null; var v = a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1); return Math.sqrt(v) / Math.abs(m); }
  function last(o, n) { return Object.keys(o || {}).sort().slice(-n); }
  function save() { try { window.localStorage.setItem(LSK, JSON.stringify(ST)); } catch (e) {} }
  function read() { try { var s = JSON.parse(window.localStorage.getItem(LSK) || 'null'); if (s) { ST.c = s.c || ''; ST.r = s.r || ''; ST.area = s.area || ''; ST.costs = s.costs || {}; } } catch (e) {} var q = new URLSearchParams(location.search); if (q.get('c')) ST.c = q.get('c').toUpperCase(); if (q.get('r')) ST.r = q.get('r'); }
  function rname(c, code) { var tab = c === 'US' ? RN.US : RN.FR, k = c === 'FR' ? FR_CODE[code] : code, v = tab && tab[k]; if (v) return v.split('|')[LI[lang()]] || v.split('|')[0]; var d = DOCS[c] && DOCS[c].regions[code]; return d && d.name ? d.name.charAt(0) + d.name.slice(1).toLowerCase() : code; }
  function load(c) { if (DOCS[c]) return Promise.resolve(DOCS[c]); return fetch(S.sitePath('data/sowing/' + c.toLowerCase() + '.json')).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { DOCS[c] = d; return d; }); }
  // Una fila por cultivo de la region: rendimiento, precio, ingreso, coste, margen, existencias y variabilidad
  function rows(doc, code) {
    var R = doc.regions[code]; if (!R) return [];
    var yLast = {}; Object.keys(R.crops).forEach(function (k) { last(R.crops[k].area, 1).forEach(function (y) { yLast[y] = (yLast[y] || 0) + R.crops[k].area[y]; }); });
    var G = Math.max.apply(null, Object.keys(yLast).map(Number).concat([0])), out = [];
    Object.keys(R.crops).forEach(function (k) {
      var rc = R.crops[k], C = doc.crops[k], yrs = last(rc.yield, 5); if (!C || yrs.length < 3) return;
      var ys = yrs.map(function (y) { return rc.yield[y]; }), ay = last(rc.area, 1)[0], area = ay ? rc.area[ay] : 0;
      var minA = doc.areaUnit === 'acre' ? 2000 : 500; if (area < minA || +ay < G - 2) return;   // solo lo que de verdad (y todavia) se siembra en la region
      var shares = last(rc.area, 5).map(function (y) { var tot = 0; Object.keys(R.crops).forEach(function (k2) { tot += R.crops[k2].area[y] || 0; }); return tot ? rc.area[y] / tot : 0; });
      var p0 = C.price.current && C.price.current.value, ph = last(C.price.hist, 5).map(function (y) { return C.price.hist[y]; });
      if (!p0) return;
      var pMin = Math.min.apply(null, ph.concat([p0])), pMax = Math.max.apply(null, ph.concat([p0]));
      var yMed = median(ys), rev = yMed * p0, revLo = Math.min.apply(null, ys) * pMin, revHi = Math.max.apply(null, ys) * pMax;
      var hr = last(rc.rev, 5).map(function (y) { return rc.rev[y]; }), v = cv(hr.length >= 3 ? hr : ys);
      var own = ST.costs[ST.c + ':' + k], cost = own !== undefined && own !== '' && isFinite(+own) ? +own : (C.costs ? C.costs.operating : null), cKind = own !== undefined && own !== '' ? 'own' : (C.costs ? 'ers' : null);
      var stS = null; if (C.stocks) { var dlt = C.stocks.ratio / C.stocks.avg5 - 1; stS = dlt > 0.1 ? 'high' : dlt < -0.1 ? 'low' : 'norm'; }
      out.push({ k: k, C: C, area: area, share: yLast[G] ? area / yLast[G] : 0, maxShare: Math.max.apply(null, shares.concat([0])), yMed: yMed, yMin: Math.min.apply(null, ys), yMax: Math.max.apply(null, ys), yrs: yrs,
        p0: p0, rev: rev, revLo: revLo, revHi: revHi, cost: cost, cKind: cKind, margin: cost != null ? rev - cost : null, marLo: cost != null ? revLo - cost : null, marHi: cost != null ? revHi - cost : null, cv: v, st: stS, hist: rc.rev });
    });
    return out;
  }
  // Reparto: pesos = valor (margen, o ingreso si ningun cultivo tiene coste) / (1 + variabilidad), con topes por cultivo
  function plan(list, total) {
    var anyCost = list.some(function (x) { return x.margin != null; }), use = list.filter(function (x) { return anyCost ? x.margin != null : true; });
    var val = function (x) { return Math.max(0, anyCost ? x.margin : x.rev); };
    var cand = use.map(function (x) { return { x: x, w: val(x) / (1 + (x.cv || 0)), cap: Math.min(0.5, Math.max(x.maxShare >= 0.03 ? 0.05 : 0, 1.5 * x.maxShare)), s: 0 }; }).filter(function (c) { return c.w > 0 && c.cap >= 0.02; });   // cultivos casi testimoniales en la region: fuera del reparto
    var left = 1, open = cand.slice(), guard = 0;
    while (open.length && left > 1e-6 && guard++ < 20) {
      var W = open.reduce(function (s, c) { return s + c.w; }, 0), next = [], used = 0;
      open.forEach(function (c) { var add = left * c.w / W; if (c.s + add >= c.cap) { used += c.cap - c.s; c.s = c.cap; } else next.push(c); });
      if (next.length === open.length) { open.forEach(function (c) { c.s += left * c.w / W; }); left = 0; break; }
      left -= used; open = next;
    }
    var assigned = cand.reduce(function (s, c) { return s + c.s; }, 0);
    return { anyCost: anyCost, parts: cand.filter(function (c) { return c.s > 0.004 && c.s * total >= 0.5; }).sort(function (a, b) { return b.s - a.s; }), unassigned: Math.max(0, 1 - assigned), excluded: anyCost ? list.filter(function (x) { return x.margin == null; }) : [], negative: use.filter(function (x) { return val(x) <= 0; }), total: total };
  }
  function priceTxt(x) { var w = t(), cur = x.C.price.current, k = cur.kind === 'avg12m' ? w.avg12 : cur.kind === 'implied' ? w.implied : w.ctd; return nf(x.p0, x.p0 < 10 ? 2 : 0) + ' ' + x.C.priceUnit + ' · ' + k; }
  function render() {
    var w = t(), root = document.getElementById('sw-body');
    document.getElementById('sw-h1').textContent = w.h1; document.getElementById('sw-sub').textContent = w.sub; document.title = w.h1 + ' | Dehesa Index';
    var doc = ST.c && DOCS[ST.c], au = ST.c === 'US' ? 'acres' : 'ha', ru = ST.c === 'US' ? 'USD/acre' : 'EUR/ha';
    var regs = doc ? Object.keys(doc.regions).sort(function (a, b) { return rname(ST.c, a).localeCompare(rname(ST.c, b), lang()); }) : [];
    var h = '<div class="di-card" style="padding:14px 16px;margin:0 0 14px"><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">' +
      '<label style="font-size:13px">' + esc(w.ctry) + '<br><select id="sw-c" class="di-compare-select"><option value="">' + esc(w.choose) + '</option><option value="US"' + (ST.c === 'US' ? ' selected' : '') + '>' + esc(w.us) + '</option><option value="FR"' + (ST.c === 'FR' ? ' selected' : '') + '>' + esc(w.fr) + '</option></select></label>' +
      '<label style="font-size:13px">' + esc(w.reg) + '<br><select id="sw-r" class="di-compare-select"' + (doc ? '' : ' disabled') + '><option value="">' + esc(w.choose) + '</option>' + regs.map(function (r) { return '<option value="' + esc(r) + '"' + (r === ST.r ? ' selected' : '') + '>' + esc(rname(ST.c, r)) + '</option>'; }).join('') + '</select></label>' +
      '<label style="font-size:13px">' + esc(w.area) + ' (' + au + ')<br><input id="sw-a" type="number" min="0" step="1" inputmode="numeric" class="di-compare-select" style="width:140px" value="' + esc(ST.area) + '"></label></div></div>';
    if (!doc || !ST.r || !doc.regions[ST.r]) { root.innerHTML = h + '<p class="di-movers-hint">' + esc(w.pick) + '</p><p class="di-movers-hint">' + esc(w.caveat) + '</p>'; bind(); return; }
    var L = rows(doc, ST.r);
    if (!L.length) { root.innerHTML = h + '<p class="di-movers-hint">' + esc(w.noData) + '</p>'; bind(); return; }
    var anyCost = L.some(function (x) { return x.margin != null; });
    L.sort(function (a, b) { return anyCost ? ((b.margin == null ? -1e9 : b.margin) - (a.margin == null ? -1e9 : a.margin)) : b.rev - a.rev; });
    var stTxt = function (s) { return s === 'high' ? '▲ ' + w.stHigh : s === 'low' ? '▼ ' + w.stLow : s === 'norm' ? '■ ' + w.stNorm : w.stNone; };
    var cvTxt = function (v) { return v == null ? '—' : (v < 0.12 ? w.cvLow : v < 0.25 ? w.cvMid : w.cvHigh) + ' (' + nf(v * 100, 0) + ' %)'; };
    var top = L[0];
    h += '<section class="di-card" style="padding:14px 16px;margin:0 0 14px"><h2 style="font-size:18px;margin:0 0 4px">' + esc(w.tbl) + ' · ' + esc(rname(ST.c, ST.r)) + '</h2>' +
      '<p style="margin:0 0 10px"><b>' + esc(anyCost ? w.best : w.bestRev) + ': ' + esc(top.C.name[lang()] || top.C.name.es) + '</b> — ' + esc(nf(anyCost ? top.margin : top.rev, 0)) + ' ' + ru + '</p>' +
      '<div class="di-table-wrap" style="overflow-x:auto"><table class="di-table" style="width:100%;font-size:13px;border-collapse:collapse;min-width:860px"><thead><tr>' + w.cols.map(function (c) { return '<th style="text-align:left;padding:6px 8px;vertical-align:bottom">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      L.map(function (x) {
        var nm = x.C.name[lang()] || x.C.name.es, cc = ST.c + ':' + x.k, own = ST.costs[cc];
        var td = function (v, sub) { return '<td style="padding:6px 8px;border-top:1px solid var(--border);vertical-align:top">' + v + (sub ? '<div class="di-movers-hint" style="font-size:11.5px">' + sub + '</div>' : '') + '</td>'; };
        return '<tr>' + td('<b>' + esc(nm) + '</b>') + td(esc(nf(x.area, 0) + ' ' + au), esc((x.share > 0 && x.share < 0.005 ? '<1' : nf(x.share * 100, 0)) + ' % ' + w.grown)) +
          td(esc(nf(x.yMed, x.yMed < 20 ? 2 : 0) + ' ' + x.C.yieldUnit), esc(w.med + ' · ' + w.range + ' ' + nf(x.yMin, x.yMin < 20 ? 2 : 0) + '–' + nf(x.yMax, x.yMax < 20 ? 2 : 0))) +
          td(esc(priceTxt(x))) + td('<b>' + esc(nf(x.rev, 0) + ' ' + ru) + '</b>', esc(w.range + ' ' + nf(x.revLo, 0) + '–' + nf(x.revHi, 0))) +
          td('<input type="number" min="0" step="1" class="di-compare-select" style="width:90px" data-cost="' + esc(cc) + '" aria-label="' + esc(w.cols[5] + ' · ' + nm) + '" placeholder="' + esc(x.C.costs ? nf(x.C.costs.operating, 0) : w.noCost) + '" value="' + esc(own == null ? '' : own) + '">', esc(x.cKind === 'own' ? w.yourCost : x.cKind === 'ers' ? w.ers + ' ' + x.C.costs.year : w.noCost)) +
          td(x.margin != null ? '<b>' + esc(nf(x.margin, 0) + ' ' + ru) + '</b>' : '—', x.margin != null ? esc(w.range + ' ' + nf(x.marLo, 0) + '–' + nf(x.marHi, 0)) : '') +
          td(esc(stTxt(x.st)), x.C.stocks ? esc(nf(x.C.stocks.ratio * 100, 0) + ' % / ' + nf(x.C.stocks.avg5 * 100, 0) + ' %') : '') + td(esc(cvTxt(x.cv))) + '</tr>';
      }).join('') + '</tbody></table></div><p class="di-movers-hint" style="margin:8px 0 0">' + esc(w.costHint.replace('{u}', ru)) + '</p></section>';
    var tot = +ST.area;
    if (tot > 0) {
      var P = plan(L, tot), sum = 0, lo = 0, hi = 0;
      var prow = function (nm, ha, f, b) { return '<div role="listitem" style="display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:4px 12px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--line,#e5e5e5)"><span>' + (b ? '<b>' + esc(nm) + '</b>' : esc(nm)) + '</span><span style="text-align:right">' + esc(nf(ha, 0) + ' ' + au) + '</span><span style="text-align:right;min-width:3.2em">' + esc(nf(f * 100, 0)) + ' %</span><span aria-hidden="true" style="grid-column:1/-1;height:6px;border-radius:3px;background:var(--accent,#5a7d2a);opacity:' + (b ? '0.85' : '0.3') + ';width:' + Math.max(1, Math.round(f * 100)) + '%"></span></div>'; };
      h += '<section class="di-card" style="padding:14px 16px;margin:0 0 14px"><h2 style="font-size:18px;margin:0 0 6px">' + esc(w.plan) + '</h2>' + (P.anyCost ? '' : '<p class="pt-note" style="margin:0 0 8px">' + esc(w.planRev) + '</p>') +
        '<div role="list" style="margin:0 0 10px">' + P.parts.map(function (c) {
          var ha = c.s * tot, m = P.anyCost ? c.x.margin : c.x.rev, ml = P.anyCost ? c.x.marLo : c.x.revLo, mh = P.anyCost ? c.x.marHi : c.x.revHi; sum += ha * m; lo += ha * ml; hi += ha * mh;
          return prow(c.x.C.name[lang()] || c.x.C.name.es, ha, c.s, true);
        }).join('') + (P.unassigned > 0.004 ? prow(w.planLeft, P.unassigned * tot, P.unassigned, false) : '') + '</div>' +
        '<p style="margin:0 0 6px"><b>' + esc(w.planTot) + ': ' + esc(nf(sum, 0)) + ' ' + (ST.c === 'US' ? 'USD' : 'EUR') + '</b> <span class="di-movers-hint">(' + esc(w.planRange + ': ' + nf(lo, 0) + ' – ' + nf(hi, 0)) + ')</span></p>' +
        (P.excluded.length ? '<p class="di-movers-hint" style="margin:0 0 6px">' + esc(w.excluded.replace('{l}', P.excluded.map(function (x) { return x.C.name[lang()] || x.C.name.es; }).join(', '))) + '</p>' : '') +
        (P.negative.length ? '<p class="di-movers-hint" style="margin:0 0 6px">' + esc(w.negative.replace('{l}', P.negative.map(function (x) { return x.C.name[lang()] || x.C.name.es; }).join(', '))) + '</p>' : '') +
        '<p class="di-movers-hint" style="margin:0">' + esc(w.planWhy) + '</p></section>';
    }
    var cite = window.DICite ? (ST.c === 'US' ? ['usda_nass', 'usda_ers', 'usda_fas_psd'] : ['franceagrimer']).map(function (id) { return window.DICite.html(id, {}); }).join('') : '';
    h += '<p class="pt-note">' + esc(w.caveat) + '</p><p class="di-movers-hint">' + esc((NOTES[lang()] || NOTES.es)[ST.c === 'FR' ? 1 : 0]) + '</p>' + cite;
    root.innerHTML = h; bind();
  }
  function bind() {
    var c = document.getElementById('sw-c'); if (c) c.onchange = function () { ST.c = c.value; ST.r = ''; save(); if (ST.c) load(ST.c).then(render, render); else render(); };
    var r = document.getElementById('sw-r'); if (r) r.onchange = function () { ST.r = r.value; save(); render(); };
    var a = document.getElementById('sw-a'); if (a) a.onchange = function () { ST.area = a.value; save(); render(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-cost]'), function (i) { i.onchange = function () { var k = i.getAttribute('data-cost'); if (i.value === '') delete ST.costs[k]; else ST.costs[k] = i.value; save(); render(); }; });
    try { var q = new URLSearchParams(); if (ST.c) q.set('c', ST.c); if (ST.r) q.set('r', ST.r); history.replaceState(null, '', q.toString() ? '?' + q.toString() : location.pathname); } catch (e) {}
  }
  S.init('mine');
  S.onLangChange = render;
  read();
  var go = function () { if (ST.c) load(ST.c).then(render, render); else render(); };
  (window.DICite ? window.DICite.load().then(go, go) : go());
})();
