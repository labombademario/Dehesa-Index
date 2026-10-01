/* Dehesa Index — Calculadora de margen y precio de equilibrio de un cultivo. ES5.
   Entradas: cultivo, superficie (ha o acre), rendimiento (t/ha o bu/acre), precio (manual o precio de Dehesa con mercado, fuente y fecha) y costes por unidad de superficie
   (fertilizante, semilla, fitosanitarios, pienso, energia/gasoleo, maquinaria, mano de obra, alquiler, otros).
   Salidas: coste total, por ha, por acre, por t (y por bu si el cultivo tiene bushel valido), precio y rendimiento de equilibrio, ingresos, margen y margen %.
   Sensibilidad -10 % / actual / +10 % (precio, rendimiento o costes) y comparacion A/B/C. Ha<->acre y t<->bushel SOLO via Unit Engine (bushel solo con cultivo).
   Privacidad: todo el calculo ocurre en el navegador; no se envia nada. Guardado opcional en localStorage (apagado por defecto).
   Nunca rellena datos: costes y rendimiento empiezan vacios. El precio de Dehesa es una referencia de mercado (fuente, fecha, frescura y comparabilidad visibles), no tu precio de venta. */
(function () {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LANGS.indexOf(lang()); return i < 0 ? 0 : i; }
  var TX = {
    title: ['Calculadora de margen y precio de equilibrio', 'Margin and break-even calculator', 'Calculateur de marge et de prix d’équilibre', 'Calcolatore di margine e prezzo di pareggio'],
    sub: ['Introduce tus costes y tu rendimiento y obtén coste por ha y por tonelada, precio de equilibrio y margen. Todo se calcula en tu navegador: no se envía ningún dato.', 'Enter your costs and yield to get cost per ha and per tonne, break-even price and margin. Everything is computed in your browser: no data is sent.', 'Saisissez vos coûts et votre rendement pour obtenir le coût par ha et par tonne, le prix d’équilibre et la marge. Tout est calculé dans votre navigateur : aucune donnée n’est envoyée.', 'Inserisci costi e resa per ottenere costo per ha e per tonnellata, prezzo di pareggio e margine. Tutto è calcolato nel tuo browser: nessun dato viene inviato.'],
    privacy: ['Tus datos no salen del navegador. Si activas “Recordar”, se guardan solo en este dispositivo (localStorage) y puedes borrarlos cuando quieras.', 'Your data never leaves the browser. If you enable “Remember”, it is stored only on this device (localStorage) and you can delete it any time.', 'Vos données ne quittent pas le navigateur. Si vous activez « Mémoriser », elles restent sur cet appareil (localStorage) et vous pouvez les effacer à tout moment.', 'I tuoi dati non lasciano il browser. Se attivi “Ricorda”, restano solo su questo dispositivo (localStorage) e puoi cancellarli quando vuoi.'],
    remember: ['Recordar en este navegador', 'Remember in this browser', 'Mémoriser dans ce navigateur', 'Ricorda in questo browser'],
    forget: ['Borrar datos guardados', 'Delete saved data', 'Effacer les données enregistrées', 'Cancella i dati salvati'],
    case: ['Escenario', 'Case', 'Scénario', 'Scenario'],
    copyTo: ['Copiar a', 'Copy to', 'Copier vers', 'Copia in'],
    crop: ['Cultivo', 'Crop', 'Culture', 'Coltura'],
    area: ['Superficie', 'Area', 'Surface', 'Superficie'],
    yield: ['Rendimiento', 'Yield', 'Rendement', 'Resa'],
    price: ['Precio de venta', 'Selling price', 'Prix de vente', 'Prezzo di vendita'],
    currency: ['Moneda', 'Currency', 'Devise', 'Valuta'],
    areaUnit: ['Unidad de superficie', 'Area unit', 'Unité de surface', 'Unità di superficie'],
    yieldUnit: ['Unidad de rendimiento', 'Yield unit', 'Unité de rendement', 'Unità di resa'],
    priceUnit: ['Unidad del precio', 'Price unit', 'Unité du prix', 'Unità del prezzo'],
    manual: ['Manual', 'Manual', 'Manuel', 'Manuale'],
    dehesa: ['Precio de Dehesa', 'Dehesa price', 'Prix Dehesa', 'Prezzo Dehesa'],
    market: ['Mercado de referencia', 'Reference market', 'Marché de référence', 'Mercato di riferimento'],
    costs: ['Costes', 'Costs', 'Coûts', 'Costi'],
    costsHint: ['por unidad de superficie; lo que dejes en blanco cuenta como 0', 'per area unit; anything left blank counts as 0', 'par unité de surface ; ce qui reste vide compte pour 0', 'per unità di superficie; ciò che lasci vuoto vale 0'],
    c_fert: ['Fertilizantes', 'Fertiliser', 'Engrais', 'Fertilizzanti'], c_seed: ['Semilla', 'Seed', 'Semences', 'Sementi'], c_prot: ['Fitosanitarios', 'Crop protection', 'Produits phytosanitaires', 'Fitosanitari'],
    ersLoad: ['Cargar referencia USDA ERS ({0}, EE. UU.)', 'Load USDA ERS reference ({0}, U.S.)', 'Charger la référence USDA ERS ({0}, É.-U.)', 'Carica il riferimento USDA ERS ({0}, USA)'],
    ersNote: ['Media nacional de EE. UU. por acre sembrado, en dólares: rellena las partidas, pasa el caso a USD y acres y, si el rendimiento está vacío, pone el de ERS ({0} bu/acre). Incluye costes imputados (coste de oportunidad de la tierra y del trabajo no remunerado: {1} $/acre), que no son desembolsos. Es una referencia, no tu explotación: sustituye cada cifra por la tuya.', 'U.S. national average per planted acre, in dollars: fills the items, switches the case to USD and acres and, if yield is empty, sets the ERS yield ({0} bu/acre). Includes imputed costs (opportunity cost of land and unpaid labour: ${1}/acre), which are not cash outlays. A reference, not your farm: replace each figure with your own.', 'Moyenne nationale des É.-U. par acre planté, en dollars : remplit les postes, passe le cas en USD et acres et, si le rendement est vide, met celui de l’ERS ({0} bu/acre). Inclut des coûts imputés (coût d’opportunité de la terre et du travail non rémunéré : {1} $/acre), qui ne sont pas des décaissements. Une référence, pas votre exploitation : remplacez chaque chiffre par le vôtre.', 'Media nazionale USA per acro seminato, in dollari: compila le voci, passa il caso a USD e acri e, se la resa è vuota, imposta quella ERS ({0} bu/acro). Include costi imputati (costo opportunità di terra e lavoro non retribuito: {1} $/acro), che non sono esborsi. Un riferimento, non la tua azienda: sostituisci ogni cifra con la tua.'],
    ersSrc: ['Fuente: USDA ERS, Commodity Costs and Returns', 'Source: USDA ERS, Commodity Costs and Returns', 'Source : USDA ERS, Commodity Costs and Returns', 'Fonte: USDA ERS, Commodity Costs and Returns'],
    c_feed: ['Pienso / alimentación comprada', 'Feed / purchased feed', 'Aliments achetés', 'Mangimi acquistati'], c_energy: ['Energía y gasóleo', 'Energy and diesel', 'Énergie et gazole', 'Energia e gasolio'], c_mach: ['Maquinaria', 'Machinery', 'Machines', 'Macchinari'],
    c_labour: ['Mano de obra', 'Labour', 'Main-d’œuvre', 'Manodopera'], c_rent: ['Alquiler de tierra', 'Land rent', 'Fermage', 'Affitto terreno'], c_other: ['Otros costes', 'Other costs', 'Autres coûts', 'Altri costi'],
    results: ['Resultados', 'Results', 'Résultats', 'Risultati'],
    needMore: ['Rellena superficie, rendimiento y precio para ver el margen; los costes por sí solos ya dan el coste por unidad.', 'Fill in area, yield and price to see the margin; costs alone already give the cost per unit.', 'Renseignez surface, rendement et prix pour voir la marge ; les coûts seuls donnent déjà le coût unitaire.', 'Compila superficie, resa e prezzo per vedere il margine; i soli costi danno già il costo unitario.'],
    totalCost: ['Coste total', 'Total cost', 'Coût total', 'Costo totale'],
    costHa: ['Coste por ha', 'Cost per ha', 'Coût par ha', 'Costo per ha'],
    costAc: ['Coste por acre', 'Cost per acre', 'Coût par acre', 'Costo per acro'],
    costT: ['Coste por tonelada', 'Cost per tonne', 'Coût par tonne', 'Costo per tonnellata'],
    costBu: ['Coste por bushel', 'Cost per bushel', 'Coût par boisseau', 'Costo per bushel'],
    bePrice: ['Precio de equilibrio', 'Break-even price', 'Prix d’équilibre', 'Prezzo di pareggio'],
    beYield: ['Rendimiento de equilibrio', 'Break-even yield', 'Rendement d’équilibre', 'Resa di pareggio'],
    revenue: ['Ingresos', 'Revenue', 'Recettes', 'Ricavi'],
    revenueHa: ['Ingresos por ha', 'Revenue per ha', 'Recettes par ha', 'Ricavi per ha'],
    margin: ['Margen', 'Margin', 'Marge', 'Margine'],
    marginHa: ['Margen por ha', 'Margin per ha', 'Marge par ha', 'Margine per ha'],
    marginT: ['Margen por tonelada', 'Margin per tonne', 'Marge par tonne', 'Margine per tonnellata'],
    marginPct: ['Margen sobre ingresos', 'Margin on revenue', 'Marge sur recettes', 'Margine sui ricavi'],
    yieldConv: ['Rendimiento equivalente', 'Equivalent yield', 'Rendement équivalent', 'Resa equivalente'],
    beNote: ['Precio de equilibrio = coste por tonelada con tu rendimiento: por debajo de ese precio pierdes dinero.', 'Break-even price = cost per tonne at your yield: below that price you lose money.', 'Prix d’équilibre = coût par tonne à votre rendement : en dessous de ce prix, vous perdez de l’argent.', 'Prezzo di pareggio = costo per tonnellata alla tua resa: sotto quel prezzo perdi denaro.'],
    sens: ['Sensibilidad', 'Sensitivity', 'Sensibilité', 'Sensibilità'],
    sensHint: ['Qué pasaría con el margen si UNA variable cambia; es un ejercicio de cálculo, no una previsión.', 'What would happen to the margin if ONE variable changes; a calculation exercise, not a forecast.', 'Ce qui arriverait à la marge si UNE variable change ; un exercice de calcul, pas une prévision.', 'Cosa accadrebbe al margine se UNA variabile cambia; un esercizio di calcolo, non una previsione.'],
    vary: ['Variable', 'Variable', 'Variable', 'Variabile'],
    vPrice: ['Precio', 'Price', 'Prix', 'Prezzo'], vYield: ['Rendimiento', 'Yield', 'Rendement', 'Resa'], vCost: ['Costes', 'Costs', 'Coûts', 'Costi'],
    step: ['Variación', 'Change', 'Variation', 'Variazione'],
    actual: ['Actual', 'Current', 'Actuel', 'Attuale'],
    value: ['Valor', 'Value', 'Valeur', 'Valore'],
    compare: ['Comparación de escenarios A/B/C', 'Case comparison A/B/C', 'Comparaison des scénarios A/B/C', 'Confronto scenari A/B/C'],
    compareHint: ['Rellena hasta tres escenarios (p. ej. otra variedad, otro precio o menos abono) y compáralos lado a lado.', 'Fill in up to three cases (e.g. another variety, another price or less fertiliser) and compare them side by side.', 'Renseignez jusqu’à trois scénarios (autre variété, autre prix, moins d’engrais…) et comparez-les côte à côte.', 'Compila fino a tre scenari (altra varietà, altro prezzo, meno concime…) e confrontali affiancati.'],
    ha: ['ha', 'ha', 'ha', 'ha'], ac: ['acre', 'acre', 'acre', 'acro'],
    tha: ['t/ha', 't/ha', 't/ha', 't/ha'], buac: ['bu/acre', 'bu/acre', 'bu/acre', 'bu/acro'],
    pt: ['por tonelada', 'per tonne', 'par tonne', 'per tonnellata'], pbu: ['por bushel', 'per bushel', 'par boisseau', 'per bushel'],
    refTitle: ['Referencia de mercado', 'Market reference', 'Référence de marché', 'Riferimento di mercato'],
    refNote: ['Es una referencia de mercado, no el precio que cobrarás: depende de calidad, contrato, transporte y fecha de venta. Mira el valor original, su fecha y su comparabilidad.', 'It is a market reference, not the price you will get: it depends on quality, contract, transport and sale date. Check the original value, its date and comparability.', 'C’est une référence de marché, pas le prix que vous obtiendrez : il dépend de la qualité, du contrat, du transport et de la date de vente. Vérifiez la valeur d’origine, sa date et sa comparabilité.', 'È un riferimento di mercato, non il prezzo che otterrai: dipende da qualità, contratto, trasporto e data di vendita. Controlla valore originale, data e confrontabilità.'],
    original: ['Original', 'Original', 'Original', 'Originale'],
    converted: ['Convertido', 'Converted', 'Converti', 'Convertito'],
    useIt: ['Se usa como precio del escenario', 'Used as the case price', 'Utilisé comme prix du scénario', 'Usato come prezzo dello scenario'],
    loading: ['Cargando precio…', 'Loading price…', 'Chargement du prix…', 'Caricamento prezzo…'],
    noRef: ['Dehesa no tiene un precio de referencia convertible para este cultivo en esta moneda; introduce tu precio a mano.', 'Dehesa has no convertible reference price for this crop in this currency; enter your own price.', 'Dehesa n’a pas de prix de référence convertible pour cette culture dans cette devise ; saisissez votre prix.', 'Dehesa non ha un prezzo di riferimento convertibile per questa coltura in questa valuta; inserisci il tuo prezzo.'],
    noFx: ['No hay tipo de cambio del BCE para ese mes (ni los 2 anteriores): no se convierte.', 'No ECB rate for that month (nor the 2 previous): not converted.', 'Pas de taux BCE pour ce mois (ni les 2 précédents) : pas de conversion.', 'Nessun tasso BCE per quel mese (né i 2 precedenti): nessuna conversione.'],
    noUnit: ['Esta unidad de precio no se puede convertir sin suponer algo.', 'This price unit cannot be converted without assuming something.', 'Cette unité de prix ne peut pas être convertie sans hypothèse.', 'Questa unità di prezzo non si può convertire senza ipotesi.'],
    stale: ['Aviso: este dato está {0}; revísalo antes de decidir.', 'Warning: this data point is {0}; check it before deciding.', 'Attention : cette donnée est {0} ; vérifiez-la avant de décider.', 'Attenzione: questo dato è {0}; verificalo prima di decidere.'],
    notComp: ['Su concepto de precio no es comparable con otros mercados: úsalo solo como orientación para este cultivo.', 'Its price concept is not comparable with other markets: use it only as guidance for this crop.', 'Son concept de prix n’est pas comparable aux autres marchés : à utiliser seulement comme repère pour cette culture.', 'Il suo concetto di prezzo non è confrontabile con altri mercati: usalo solo come orientamento per questa coltura.'],
    source: ['Fuente', 'Source', 'Source', 'Fonte'],
    asOf: ['Dato de', 'Data for', 'Donnée du', 'Dato del'],
    fxNote: ['Conversión: tipo de cambio mensual del BCE del mes del dato (si falta, el mes anterior, máximo 2 meses). ha↔acre y t↔bushel con el Unit Engine (bushel solo con el estándar USDA del cultivo).', 'Conversion: monthly ECB rate of the data month (if missing, the previous month, at most 2). ha↔acre and t↔bushel via the Unit Engine (bushel only with the crop’s USDA standard).', 'Conversion : taux mensuel BCE du mois de la donnée (à défaut le mois précédent, 2 max.). ha↔acre et t↔boisseau via le Unit Engine (boisseau seulement avec le standard USDA de la culture).', 'Conversione: tasso mensile BCE del mese del dato (se manca, il mese precedente, max 2). ha↔acro e t↔bushel con lo Unit Engine (bushel solo con lo standard USDA della coltura).'],
    bad: ['Revisa este valor', 'Check this value', 'Vérifiez cette valeur', 'Controlla questo valore'],
    prodLink: ['Ficha del cultivo', 'Crop profile', 'Fiche de la culture', 'Scheda della coltura'],
    notInc: ['No incluido: subvenciones, seguros, intereses, impuestos ni amortización de maquinaria salvo que los añadas en “Otros” o “Maquinaria”.', 'Not included: subsidies, insurance, interest, taxes or machinery depreciation unless you add them under “Other” or “Machinery”.', 'Non inclus : subventions, assurances, intérêts, impôts ni amortissement du matériel sauf si vous les ajoutez dans « Autres » ou « Machines ».', 'Non inclusi: sussidi, assicurazioni, interessi, imposte né ammortamento dei macchinari salvo che li aggiunga in “Altri” o “Macchinari”.']
  };
  function t(k) { var a = TX[k]; if (!a) return k; return a[li()] === undefined ? a[0] : a[li()]; }
  function tf(k) { var s = t(k), a = arguments; return s.replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1] === undefined ? m : a[+i + 1]; }); }
  var CROPS = { trigo: ['Trigo', 'Wheat', 'Blé', 'Frumento'], maiz: ['Maíz', 'Maize (corn)', 'Maïs', 'Mais'], cebada: ['Cebada', 'Barley', 'Orge', 'Orzo'], avena: ['Avena', 'Oats', 'Avoine', 'Avena'], arroz: ['Arroz', 'Rice', 'Riz', 'Riso'], soja: ['Soja (grano)', 'Soybeans', 'Soja (grain)', 'Soia (semi)'], colza: ['Colza', 'Rapeseed / canola', 'Colza', 'Colza'] };
  var CORDER = ['trigo', 'maiz', 'cebada', 'avena', 'arroz', 'soja', 'colza'];
  var COSTS = ['fert', 'seed', 'prot', 'feed', 'energy', 'mach', 'labour', 'rent', 'other'];
  var CURS = { EUR: '€', USD: 'USD', CAD: 'CAD', GBP: 'GBP' };
  var REG = { eu: ['Unión Europea', 'European Union', 'Union européenne', 'Unione europea'], us: ['EE. UU.', 'United States', 'États-Unis', 'Stati Uniti'], ca: ['Canadá', 'Canada', 'Canada', 'Canada'], uk: ['Reino Unido', 'United Kingdom', 'Royaume-Uni', 'Regno Unito'] };
  var SRC = { eu_agrifood: 'Comisión Europea · Agri-food Data Portal', usda_nass: 'USDA NASS (Quick Stats)', statcan: 'Statistics Canada', defra: 'DEFRA' };
  var UL = { tonelada: 't', '100kg': '100 kg', bushel: 'bu', cwt: 'cwt', ton_corta: 'short ton' };
  var KEY = 'di-calc-v1';
  var U = window.DIUnits, HA_AC = U.area.HA_PER_ACRE;

  function blank(crop) { var c = {}; COSTS.forEach(function (k) { c[k] = ''; }); return { crop: crop || 'trigo', areaU: 'ha', area: '', yU: 't_ha', y: '', cur: 'EUR', pSrc: 'manual', pUnit: 't', p: '', inst: '', costs: c, vary: 'price', step: 10 }; }
  var S = { cases: { A: blank(), B: blank(), C: blank() }, cur: 'A', remember: false }, REFC = {}, META = null, FXLOADED = null;

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function num(s) { if (s === '' || s === null || s === undefined) return null; var v = parseFloat(String(s).replace(/\s/g, '').replace(',', '.')); return isFinite(v) ? v : null; }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function money(v, cur, d) { return nf(v, d === undefined ? (Math.abs(v) < 1000 ? 2 : 0) : d) + ' ' + (CURS[cur] || cur); }
  function r2(v) { return Math.round(v * 10000) / 10000; } // 4 decimales: al cambiar de unidad ida y vuelta no se acumula error
  function dstr(iso) { var s = String(iso || ''), p = s.split('-'); try { if (/^\d{4}-\d{2}$/.test(s)) return new Date(Date.UTC(+p[0], +p[1] - 1, 1)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2].slice(0, 2))).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { /* texto */ } return s; }
  function bushelKg(crop) { return U.mass.bushelKg(crop); }
  function C() { return S.cases[S.cur]; }
  function save() { if (!S.remember) return; try { localStorage.setItem(KEY, JSON.stringify({ cases: S.cases, cur: S.cur })); } catch (e) { /* sin almacenamiento */ } }
  function loadSaved() { try { var raw = localStorage.getItem(KEY); if (!raw) return; var d = JSON.parse(raw); if (d && d.cases && d.cases.A) { ['A', 'B', 'C'].forEach(function (k) { if (d.cases[k]) { var b = blank(); var c = d.cases[k]; Object.keys(b).forEach(function (f) { if (f !== 'costs' && c[f] !== undefined) b[f] = c[f]; }); COSTS.forEach(function (f) { if (c.costs && c.costs[f] !== undefined) b.costs[f] = c.costs[f]; }); S.cases[k] = b; } }); S.cur = d.cur || 'A'; S.remember = true; } } catch (e) { /* datos corruptos: se ignoran */ } }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } }

  /* ---------- calculo (unidades canonicas: ha, t, t/ha, precio por t) ---------- */
  function canon(c) {
    var kgBu = bushelKg(c.crop), a = num(c.area), y = num(c.y), p = num(c.p), cost = 0, anyCost = false;
    var area = a === null ? null : (c.areaU === 'ha' ? a : a * HA_AC);
    var yld = null; if (y !== null) { if (c.yU === 't_ha') yld = y; else if (kgBu) yld = y * kgBu / 1000 / HA_AC; }
    var price = null; if (p !== null) { if (c.pUnit === 't') price = p; else if (kgBu) price = p / (kgBu / 1000); }
    COSTS.forEach(function (k) { var v = num(c.costs[k]); if (v !== null) { cost += v; anyCost = true; } });
    var costHa = anyCost ? (c.areaU === 'ha' ? cost : cost / HA_AC) : null;
    return { area: area, yld: yld, price: price, costHa: costHa, kgBu: kgBu };
  }
  function calc(c, over) {
    var k = canon(c); over = over || {};
    var price = k.price !== null && over.price ? k.price * over.price : k.price, yld = k.yld !== null && over.yld ? k.yld * over.yld : k.yld, costHa = k.costHa !== null && over.cost ? k.costHa * over.cost : k.costHa;
    var o = { k: k, price: price, yld: yld, costHa: costHa };
    if (costHa !== null) { o.costAc = costHa * HA_AC; if (k.area) o.cost = costHa * k.area; }
    if (costHa !== null && yld > 0) { o.costT = costHa / yld; if (k.kgBu) o.costBu = o.costT * k.kgBu / 1000; }
    if (costHa !== null && price > 0) { o.beYield = costHa / price; if (k.kgBu) o.beYieldBuAc = o.beYield * 1000 / k.kgBu * HA_AC; }
    if (price > 0 && yld > 0) {
      o.revHa = price * yld; if (k.area) o.rev = o.revHa * k.area;
      if (costHa !== null) { o.marginHa = o.revHa - costHa; o.margin = k.area ? o.marginHa * k.area : null; o.marginT = o.marginHa / yld; o.marginPct = o.revHa > 0 ? o.marginHa / o.revHa * 100 : null; }
    }
    return o;
  }

  /* ---------- precio de Dehesa (carga perezosa) ---------- */
  function loadMeta() {
    if (META) return Promise.resolve(META);
    return fetch((window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath('data/product-metadata.json') : 'data/product-metadata.json')).then(function (r) { if (!r.ok) throw new Error('meta'); return r.json(); }).then(function (m) { META = m; return m; });
  }
  function loadFx() {
    if (FXLOADED) return FXLOADED;
    return FXLOADED = fetch((window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath('data/fx-history.json') : 'data/fx-history.json')).then(function (r) { return r.ok ? r.json() : null; }).then(function (fx) { U.setFx(fx); return fx; });
  }
  function instruments(crop) {
    var m = META && META.products[crop]; if (!m) return [];
    return m.instruments.filter(function (i) { return !/harina/.test(i.product); }); // la harina de soja no es el precio del grano
  }
  function loadRef(crop) {
    if (REFC[crop]) return REFC[crop];
    return REFC[crop] = Promise.all([loadMeta(), loadFx(), window.DIFreshness.ready()]).then(function () {
      var ins = instruments(crop), regs = []; ins.forEach(function (i) { if (regs.indexOf(i.region) < 0) regs.push(i.region); });
      return window.DIPrices.latest(regs).then(function (obs) {
        var by = {}; obs.forEach(function (o) { by[o.region + '/' + o.product] = o; });
        return ins.map(function (i) { return by[i.region + '/' + i.product]; }).filter(function (o) { return o && typeof o.value === 'number' && o.status !== 'pending'; });
      });
    }).catch(function (e) { delete REFC[crop]; throw e; });
  }
  function baseKg(o, crop) { if (o.unit === 'tonelada') return 1000; if (o.unit === 'bushel') return U.mass.kgPer('bushel', crop); if (o.unit === 'ton_corta') return U.mass.kgPer('short_ton'); return U.mass.kgPer(o.unit === 'docena' ? 'x' : o.unit); }
  // precio de Dehesa por tonelada en la moneda elegida; {value, reason}
  function refPerT(o, crop, cur) {
    var kg = baseKg(o, crop); if (!kg) return { value: null, reason: 'noUnit' };
    var ym = String(o.observationDate || '').slice(0, 7);
    var r = U.convert(o.value, { cur: o.currency, kg: kg }, ym, 'eur', 1000);
    if (r.value === null || r.value === undefined) return { value: null, reason: 'noFx' };
    if (cur === 'EUR') return { value: r.value };
    if (cur === 'USD') { var u = U.convert(o.value, { cur: o.currency, kg: kg }, ym, 'usd', 1000); return u.value === null || u.value === undefined ? { value: null, reason: 'noFx' } : { value: u.value }; }
    var fx = U.getHistoricalFx(cur, ym); if (fx.rate === null || fx.rate === undefined) return { value: null, reason: 'noFx' };
    return { value: r.value * fx.rate };
  }

  /* ---------- render ---------- */
  function field(id, label, html) { return '<div class="cc-field"><label for="' + id + '">' + esc(label) + '</label>' + html + '</div>'; }
  function selectHtml(id, opts, cur) { return '<select id="' + id + '" data-f="' + id.replace(/^cc-/, '') + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function inputHtml(id, val, ph, ex) { return '<input id="' + id + '" data-f="' + id.replace(/^cc-/, '') + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(val) + '" placeholder="' + esc(ph || '') + '"' + (ex || '') + '>'; }
  function seg(name, opts, cur) { return '<div class="pt-bar-ctl" role="radiogroup">' + opts.map(function (o) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (o[0] === cur) + '" data-seg="' + name + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>'; }
  function caseTabs() {
    return '<div class="pt-bar-ctl"><span class="pt-lbl">' + esc(t('case')) + '</span><span role="radiogroup" aria-label="' + esc(t('case')) + '" style="display:contents">' + ['A', 'B', 'C'].map(function (k) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (S.cur === k) + '" data-case="' + k + '">' + esc(t('case')) + ' ' + k + '</button>'; }).join('') + '</span>' +
      ['A', 'B', 'C'].filter(function (k) { return k !== S.cur; }).map(function (k) { return '<button type="button" class="pt-chip" data-copy="' + k + '" title="' + esc(t('copyTo') + ' ' + k) + '">' + esc(t('copyTo')) + ' ' + k + '</button>'; }).join('') + '</div>';
  }
  function inputsHtml() {
    var c = C(), kgBu = bushelKg(c.crop), au = c.areaU === 'ha' ? t('ha') : t('ac');
    var h = '<div class="cc-grid">';
    h += field('cc-crop', t('crop'), selectHtml('cc-crop', CORDER.map(function (k) { return [k, CROPS[k][li()]]; }), c.crop));
    h += field('cc-area', t('area') + ' (' + au + ')', '<div class="cc-row">' + inputHtml('cc-area', c.area, '0') + seg('areaU', [['ha', t('ha')], ['ac', t('ac')]], c.areaU) + '</div>');
    h += field('cc-y', t('yield') + ' (' + (c.yU === 't_ha' ? t('tha') : t('buac')) + ')', '<div class="cc-row">' + inputHtml('cc-y', c.y, '0') + seg('yU', [['t_ha', t('tha')]].concat(kgBu ? [['bu_ac', t('buac')]] : []), kgBu ? c.yU : 't_ha') + '</div>');
    h += field('cc-cur', t('currency'), selectHtml('cc-cur', Object.keys(CURS).map(function (k) { return [k, k]; }), c.cur));
    h += '</div>';
    h += '<fieldset class="cc-fs"><legend>' + esc(t('price')) + '</legend>' + seg('pSrc', [['manual', t('manual')], ['dehesa', t('dehesa')]], c.pSrc);
    if (c.pSrc === 'manual') h += '<div class="cc-grid">' + field('cc-p', t('price') + ' (' + CURS[c.cur] + ' ' + (c.pUnit === 't' ? t('pt') : t('pbu')) + ')', '<div class="cc-row">' + inputHtml('cc-p', c.p, '0') + seg('pUnit', [['t', t('pt')]].concat(kgBu ? [['bu', t('pbu')]] : []), kgBu ? c.pUnit : 't') + '</div>') + '</div>';
    else h += '<div id="cc-ref" class="pt-skel">' + esc(t('loading')) + '</div>';
    h += '</fieldset>';
    h += '<fieldset class="cc-fs"><legend>' + esc(t('costs')) + ' (' + esc(CURS[c.cur]) + '/' + esc(au) + ')</legend><p class="pt-src" style="margin:0 0 8px">' + esc(t('costsHint')) + '</p><div id="cc-ers"></div><div class="cc-grid">' + COSTS.map(function (k) { return field('cc-c-' + k, t('c_' + k), inputHtml('cc-c-' + k, c.costs[k], '0')); }).join('') + '</div></fieldset>';
    h += '<p class="pt-src">' + esc(t('notInc')) + '</p>';
    h += '<div class="pt-bar-ctl"><label style="font-size:13px"><input type="checkbox" id="cc-remember"' + (S.remember ? ' checked' : '') + '> ' + esc(t('remember')) + '</label>' + (S.remember ? '<button type="button" class="pt-chip" data-forget="1">' + esc(t('forget')) + '</button>' : '') + '</div>';
    return h;
  }
  function stat(label, value, sub, cls) { return '<div class="di-card pt-card"><div class="pt-k">' + esc(label) + '</div><div class="pt-v ' + (cls || '') + '">' + value + '</div>' + (sub ? '<div class="pt-sub">' + sub + '</div>' : '') + '</div>'; }
  function resultsHtml() {
    var c = C(), o = calc(c), cur = c.cur, k = o.k, au = c.areaU;
    var h = '';
    if (o.costHa === null && o.rev === undefined) return '<div class="pt-note">' + esc(t('needMore')) + '</div>';
    h += '<div class="pt-cards">';
    if (o.cost !== undefined) h += stat(t('totalCost'), esc(money(o.cost, cur)));
    if (o.costHa !== null) h += stat(t('costHa'), esc(money(o.costHa, cur)), esc(t('costAc')) + ': ' + esc(money(o.costAc, cur)));
    if (o.costT !== undefined) h += stat(t('costT'), esc(money(o.costT, cur)), o.costBu !== undefined ? esc(t('costBu')) + ': ' + esc(money(o.costBu, cur, 2)) : '');
    if (o.costT !== undefined) h += stat(t('bePrice'), esc(money(o.costT, cur)) + ' <small>/ t</small>', esc(t('beNote')));
    if (o.beYield !== undefined) h += stat(t('beYield'), esc(nf(o.beYield, 2)) + ' <small>t/ha</small>', o.beYieldBuAc !== undefined ? esc(nf(o.beYieldBuAc, 1)) + ' bu/acre' : '');
    if (o.revHa !== undefined) h += stat(t('revenueHa'), esc(money(o.revHa, cur)), o.rev !== undefined ? esc(t('revenue')) + ': ' + esc(money(o.rev, cur)) : '');
    if (o.marginHa !== undefined) h += stat(t('marginHa'), esc(money(o.marginHa, cur)), (o.margin !== undefined && o.margin !== null ? esc(t('margin')) + ': ' + esc(money(o.margin, cur)) + '<br>' : '') + esc(t('marginT')) + ': ' + esc(money(o.marginT, cur)) + (o.marginPct !== null ? '<br>' + esc(t('marginPct')) + ': ' + esc(nf(o.marginPct, 1)) + ' %' : ''), o.marginHa >= 0 ? 'pt-up' : 'pt-down');
    h += '</div>';
    if (c.yU === 'bu_ac' && k.yld !== null) h += '<p class="pt-src">' + esc(t('yieldConv')) + ': ' + esc(nf(k.yld, 2)) + ' t/ha</p>';
    if (c.yU === 't_ha' && k.kgBu && k.yld !== null) h += '<p class="pt-src">' + esc(t('yieldConv')) + ': ' + esc(nf(k.yld * 1000 / k.kgBu * HA_AC, 1)) + ' bu/acre</p>';
    return h;
  }
  function sensHtml() {
    var c = C(), base = calc(c); if (base.marginHa === undefined) return '';
    var st = c.step / 100, cur = c.cur, V = c.vary, cols = [[1 - st, '−' + c.step + ' %'], [1, t('actual')], [1 + st, '+' + c.step + ' %']];
    function ov(f) { var x = {}; x[V === 'price' ? 'price' : V === 'yield' ? 'yld' : 'cost'] = f; return x; }
    var rows = cols.map(function (cl) { return { l: cl[1], o: calc(c, ov(cl[0])) }; });
    var h = '<div class="pt-bar-ctl"><span class="pt-lbl">' + esc(t('vary')) + '</span>' + [['price', t('vPrice')], ['yield', t('vYield')], ['cost', t('vCost')]].map(function (v) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (V === v[0]) + '" data-seg="vary" data-v="' + v[0] + '">' + esc(v[1]) + '</button>'; }).join('') +
      '<span class="pt-lbl" style="margin-left:8px">' + esc(t('step')) + '</span>' + [5, 10, 20].map(function (s) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (c.step === s) + '" data-seg="step" data-v="' + s + '">±' + s + ' %</button>'; }).join('') + '</div>';
    function row(label, f) { return '<tr><th scope="row" style="text-align:left">' + esc(label) + '</th>' + rows.map(function (r) { return '<td class="r">' + f(r.o) + '</td>'; }).join('') + '</tr>'; }
    var valLabel = V === 'price' ? t('price') : V === 'yield' ? t('yield') : t('costHa');
    h += '<div class="pt-tblwrap"><table class="pt-table"><thead><tr><th></th>' + rows.map(function (r) { return '<th class="r">' + esc(r.l) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      row(valLabel, function (o) { return esc(V === 'price' ? money(o.price, cur) + ' / t' : V === 'yield' ? nf(o.yld, 2) + ' t/ha' : money(o.costHa, cur) + ' /ha'); }) +
      row(t('revenueHa'), function (o) { return esc(money(o.revHa, cur)); }) + row(t('costHa'), function (o) { return esc(money(o.costHa, cur)); }) +
      row(t('marginHa'), function (o) { return '<span class="' + (o.marginHa >= 0 ? 'pt-up' : 'pt-down') + '">' + esc(money(o.marginHa, cur)) + '</span>'; }) +
      row(t('marginPct'), function (o) { return o.marginPct === null ? '—' : esc(nf(o.marginPct, 1) + ' %'); }) +
      row(t('bePrice'), function (o) { return esc(money(o.costT, cur)) + ' / t'; }) + '</tbody></table></div>';
    return h;
  }
  function compareHtml() {
    var rows = [], any = 0;
    var keys = ['A', 'B', 'C'], os = keys.map(function (k) { var c = S.cases[k], o = calc(c); if (o.marginHa !== undefined || o.costHa !== null) any++; return { k: k, c: c, o: o }; });
    if (any < 2) return '<p class="pt-sub">' + esc(t('compareHint')) + '</p>';
    function row(label, f) { return '<tr><th scope="row" style="text-align:left">' + esc(label) + '</th>' + os.map(function (x) { return '<td class="r">' + f(x) + '</td>'; }).join('') + '</tr>'; }
    return '<div class="pt-tblwrap"><table class="pt-table"><thead><tr><th></th>' + os.map(function (x) { return '<th class="r">' + esc(t('case')) + ' ' + x.k + '</th>'; }).join('') + '</tr></thead><tbody>' +
      row(t('crop'), function (x) { return esc(CROPS[x.c.crop][li()]); }) + row(t('currency'), function (x) { return esc(x.c.cur); }) +
      row(t('costHa'), function (x) { return x.o.costHa === null ? '—' : esc(money(x.o.costHa, x.c.cur)); }) + row(t('costT'), function (x) { return x.o.costT === undefined ? '—' : esc(money(x.o.costT, x.c.cur)); }) +
      row(t('bePrice'), function (x) { return x.o.costT === undefined ? '—' : esc(money(x.o.costT, x.c.cur)) + ' / t'; }) +
      row(t('revenueHa'), function (x) { return x.o.revHa === undefined ? '—' : esc(money(x.o.revHa, x.c.cur)); }) +
      row(t('marginHa'), function (x) { return x.o.marginHa === undefined ? '—' : '<span class="' + (x.o.marginHa >= 0 ? 'pt-up' : 'pt-down') + '">' + esc(money(x.o.marginHa, x.c.cur)) + '</span>'; }) +
      row(t('margin'), function (x) { return x.o.margin === undefined || x.o.margin === null ? '—' : esc(money(x.o.margin, x.c.cur)); }) +
      row(t('marginPct'), function (x) { return x.o.marginPct === undefined || x.o.marginPct === null ? '—' : esc(nf(x.o.marginPct, 1) + ' %'); }) + '</tbody></table></div><p class="pt-src">' + esc(t('compareHint')) + '</p>';
  }
  function sec(id, title, hint, body) { return '<section class="pt-sec" id="' + id + '"><div class="di-movers-head-row"><h2>' + esc(title) + '</h2>' + (hint ? '<span class="di-movers-hint">' + esc(hint) + '</span>' : '') + '</div>' + body + '</section>'; }
  function shell() {
    document.getElementById('cc-h1').textContent = t('title'); document.getElementById('cc-sub').textContent = t('sub'); document.title = 'Dehesa Index — ' + t('title');
    document.getElementById('cc-body').innerHTML = '<div class="pt-wrap"><div class="pt-note">' + esc(t('privacy')) + '</div>' + caseTabs() + '<div id="cc-inputs">' + inputsHtml() + '</div>' +
      sec('cc-results-sec', t('results'), '', '<div id="cc-results" aria-live="polite">' + resultsHtml() + '</div><p class="pt-src">' + esc(t('fxNote')) + '</p><p class="pt-src"><a href="producto.html?p=' + C().crop + '">' + esc(t('prodLink')) + ' →</a></p>') +
      sec('cc-sens-sec', t('sens'), t('sensHint'), '<div id="cc-sens">' + sensHtml() + '</div>') +
      sec('cc-cmp-sec', t('compare'), '', '<div id="cc-cmp">' + compareHtml() + '</div>') + '</div>';
    if (C().pSrc === 'dehesa') drawRef();
    drawErs();
  }
  function update() { var r = document.getElementById('cc-results'); if (r) r.innerHTML = resultsHtml(); var s = document.getElementById('cc-sens'); if (s) s.innerHTML = sensHtml(); var c = document.getElementById('cc-cmp'); if (c) c.innerHTML = compareHtml(); save(); }

  var ERSREF = null;
  function loadErs() {
    if (ERSREF) return ERSREF;
    return ERSREF = fetch((window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath('data/ers-cost-reference.json') : 'data/ers-cost-reference.json')).then(function (r) { if (!r.ok) throw new Error('ers'); return r.json(); }).catch(function (e) { ERSREF = null; throw e; });
  }
  function drawErs() {
    var c = C(), el = document.getElementById('cc-ers'); if (!el) return;
    loadErs().then(function (d) {
      el = document.getElementById('cc-ers'); var e = d.crops && d.crops[c.crop]; if (!el || C() !== c || !e) return;
      el.innerHTML = '<div class="pt-bar-ctl"><button type="button" class="pt-chip" data-ers="1">' + esc(tf('ersLoad', e.year)) + '</button></div><p class="pt-src" style="margin:4px 0 8px">' + esc(tf('ersNote', nf(e.yieldBuPerAcre, 0), nf(e.imputed, 0))) + ' ' + esc(t('ersSrc')) + '.</p>';
    }, function () { /* sin referencia: la calculadora funciona igual */ });
  }
  function applyErs() {
    var c = C();
    loadErs().then(function (d) {
      var e = d.crops && d.crops[c.crop]; if (!e || C() !== c) return;
      c.cur = 'USD'; c.areaU = 'ac';
      COSTS.forEach(function (k) { c.costs[k] = e.costs[k] ? String(e.costs[k]) : ''; });
      if (!num(c.y) && bushelKg(c.crop)) { c.yU = 'bu_ac'; c.y = String(e.yieldBuPerAcre); }
      if (c.pSrc === 'dehesa') { c.pSrc = 'manual'; c.inst = ''; }
      save(); shell();
    });
  }
  function drawRef() {
    var c = C(), el = document.getElementById('cc-ref'); if (!el) return;
    loadRef(c.crop).then(function (obs) {
      el = document.getElementById('cc-ref'); if (!el || C() !== c) return;
      var rows = obs.map(function (o) { var r = refPerT(o, c.crop, c.cur); return { o: o, r: r, key: o.region + '/' + o.product }; });
      var ok = rows.filter(function (x) { return x.r.value !== null; });
      if (!ok.length) { el.className = ''; el.innerHTML = '<div class="pt-note">' + esc(t('noRef')) + (rows[0] ? ' ' + esc(t(rows[0].r.reason)) : '') + '</div>'; c.p = ''; update(); return; }
      var cur = null; ok.forEach(function (x) { if (x.key === c.inst) cur = x; }); cur = cur || ok[0]; c.inst = cur.key; c.pUnit = 't'; c.p = String(r2(cur.r.value));
      var f = window.DIFreshness.evaluate(cur.o.observationDate, cur.o.frequency, cur.o.sourceId), st = f.state, lab = (window.DIFreshness.label[st] || {})[LANGS[li()]] || st;
      var sel = ok.length > 1 ? field('cc-inst', t('market'), '<select id="cc-inst" data-f="inst">' + ok.map(function (x) { return '<option value="' + esc(x.key) + '"' + (x.key === cur.key ? ' selected' : '') + '>' + esc(REG[x.o.region][li()]) + '</option>'; }).join('') + '</select>') : '';
      el.className = '';
      el.innerHTML = sel + '<div class="di-card pt-card" style="margin-top:8px"><div class="pt-k">' + esc(t('refTitle')) + ' · ' + esc(REG[cur.o.region][li()]) + '</div><div class="pt-v">' + esc(money(cur.r.value, c.cur, 2)) + ' <small>/ t</small></div>' +
        '<div class="pt-sub">' + esc(t('original')) + ': ' + esc(nf(cur.o.value, 2) + ' ' + cur.o.currency + '/' + (UL[cur.o.unit] || cur.o.unit)) + ' · ' + esc(t('asOf')) + ' ' + esc(dstr(cur.o.observationDate)) + '</div>' +
        '<div class="pt-sub">' + esc(t('source')) + ': ' + esc(SRC[cur.o.sourceId] || cur.o.sourceId) + '</div>' +
        '<div><span class="pt-badge pt-fs-' + st + '">' + esc(lab) + '</span><span class="pt-badge pt-cp-' + (cur.o.comparability || 'directional') + '">' + esc(cur.o.comparability === 'not_comparable' ? 'no comparable' : 'orientativa') + '</span></div>' +
        (st === 'DELAYED' || st === 'STALE' ? '<div class="pt-note">' + esc(tf('stale', lab.toLowerCase())) + '</div>' : '') + (cur.o.comparability === 'not_comparable' ? '<div class="pt-note">' + esc(t('notComp')) + '</div>' : '') +
        '<div class="pt-sub">' + esc(t('useIt')) + ' (' + esc(money(cur.r.value, c.cur, 2)) + ' / t).</div></div><p class="pt-src">' + esc(t('refNote')) + '</p>';
      update();
    }, function () { var e2 = document.getElementById('cc-ref'); if (e2) { e2.className = ''; e2.innerHTML = '<div class="pt-err">' + esc(t('noRef')) + '</div>'; } });
  }

  /* ---------- eventos ---------- */
  function convertCase(c, field, to) { // cambia de unidad convirtiendo los valores ya escritos (exacto, via Unit Engine)
    var kgBu = bushelKg(c.crop), v;
    if (field === 'areaU') {
      var a = num(c.area); if (a !== null) c.area = String(r2(to === 'ac' ? U.area.haToAcre(a) : U.area.acreToHa(a)));
      COSTS.forEach(function (k) { v = num(c.costs[k]); if (v !== null) c.costs[k] = String(r2(to === 'ac' ? v * HA_AC : v / HA_AC)); });
      c.areaU = to;
    } else if (field === 'yU') {
      var y = num(c.y); if (y !== null && kgBu) c.y = String(r2(to === 'bu_ac' ? y * 1000 / kgBu * HA_AC : y * kgBu / 1000 / HA_AC)); c.yU = to;
    } else if (field === 'pUnit') {
      var p = num(c.p); if (p !== null && kgBu) c.p = String(r2(to === 'bu' ? p * kgBu / 1000 : p / (kgBu / 1000))); c.pUnit = to;
    }
  }
  function onClick(e) {
    var el = e.target; while (el && el !== document && !(el.getAttribute && (el.getAttribute('data-seg') || el.getAttribute('data-case') || el.getAttribute('data-copy') || el.getAttribute('data-forget') || el.getAttribute('data-ers')))) el = el.parentNode;
    if (!el || el === document) return;
    var c = C(), seg2 = el.getAttribute('data-seg'), v = el.getAttribute('data-v');
    if (el.getAttribute('data-case')) { S.cur = el.getAttribute('data-case'); save(); shell(); return; }
    if (el.getAttribute('data-copy')) { var to = el.getAttribute('data-copy'); S.cases[to] = JSON.parse(JSON.stringify(c)); S.cur = to; save(); shell(); return; }
    if (el.getAttribute('data-ers')) { applyErs(); return; }
    if (el.getAttribute('data-forget')) { wipe(); S.remember = false; shell(); return; }
    if (seg2 === 'areaU' || seg2 === 'yU' || seg2 === 'pUnit') { if (c[seg2] !== v) { convertCase(c, seg2, v); save(); shell(); } return; }
    if (seg2 === 'pSrc') { c.pSrc = v; if (v === 'manual') c.inst = ''; save(); shell(); return; }
    if (seg2 === 'vary') { c.vary = v; save(); var s = document.getElementById('cc-sens'); if (s) s.innerHTML = sensHtml(); return; }
    if (seg2 === 'step') { c.step = +v; save(); var s2 = document.getElementById('cc-sens'); if (s2) s2.innerHTML = sensHtml(); }
  }
  function onInput(e) {
    var el = e.target, f = el.getAttribute && el.getAttribute('data-f'); if (!f) return;
    var c = C(), val = el.value;
    if (el.id === 'cc-remember') return;
    var m = /^c-(.+)$/.exec(f);
    if (m) c.costs[m[1]] = val; else if (f === 'area' || f === 'y' || f === 'p') c[f] = val;
    else return;
    var bad = val !== '' && (num(val) === null || num(val) < 0);
    el.setAttribute('aria-invalid', bad ? 'true' : 'false'); el.title = bad ? t('bad') : '';
    if (f === 'p') { c.pSrc = 'manual'; c.inst = ''; }
    update();
  }
  function onChange(e) {
    var el = e.target; if (el.id === 'cc-remember') { S.remember = el.checked; if (S.remember) save(); else wipe(); shell(); return; }
    var f = el.getAttribute && el.getAttribute('data-f'); if (!f) return; var c = C();
    if (f === 'crop') { c.crop = el.value; if (!bushelKg(c.crop)) { c.yU = 't_ha'; c.pUnit = 't'; } c.inst = ''; save(); shell(); }
    else if (f === 'cur') { c.cur = el.value; save(); shell(); }
    else if (f === 'inst') { c.inst = el.value; drawRef(); }
  }

  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); shell(); };
  window.DehesaShared.init('informacion');
  loadSaved();
  var q = new URLSearchParams(location.search); if (q.get('crop') && CROPS[q.get('crop')]) { C().crop = q.get('crop'); }
  var body = document.getElementById('cc-body');
  body.addEventListener('click', onClick); body.addEventListener('input', onInput); body.addEventListener('change', onChange);
  shell();
  window.DICalc = { calc: function (c, o) { return calc(c, o); }, blank: blank, canon: canon, state: function () { return S; } };
})();
