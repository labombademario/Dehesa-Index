/* Dehesa Index — Precios locales de GANADO y HENO en EE. UU. (USDA AMS Market News). ES5, sin librerías.
   Lee data/us-local/status.json y, por estado, UN fichero (cattle-<ST>.json o hay-<ST>.json). Se carga solo al abrir la pestaña Ganado o Heno de precios-locales.html.
   Reglas: precios tal como los publica el USDA (USD/cwt, USD/tonelada, USD/paca...), sin estimar nada; una serie = una especificación (clase, tramo de peso, marco, grado, calidad,
   empaque, tipo de venta); el cambio semanal solo se calcula entre dos puntos de la misma serie. La única conversión es la exacta de cwt (100 lb) a kg.
   Uso: USLocal.mount(el, kind, lang, H) con H = { esc, nf, get(path), cite(id, opts), chart(series, opts) }. */
(function () {
  'use strict';
  var SRC = 'usda_ams_mars', LB_KG = 0.45359237;
  var T = {
    es: { cattle: 'Ganado', hay: 'Heno', state: 'Estado', cls: 'Clase', wb: 'Tramo de peso (lb)', week: 'Semana del informe', loading: 'Cargando…', err: 'No se pudo cargar esta selección. Inténtalo de nuevo más tarde.', none: 'Sin dato publicado para esta selección.',
      ageOk: 'actualizado', ageLate: 'retrasado', days: 'd', ago: 'hace',
      cls_Steers: 'Machos castrados (steers)', cls_Heifers: 'Hembras (heifers)', cls_Bulls: 'Toros (bulls)',
      price: 'Precio medio', vsPrev: 'Vs. semana anterior', vsYear: 'Vs. hace un año', vs4: 'Vs. hace 4 semanas', head: 'cabezas vendidas', avgW: 'peso medio', receipts: 'Cabezas en las subastas del estado', recWk: 'Vs. semana anterior', recYr: 'Vs. hace un año',
      usd: 'USD/cwt', perKg: 'USD/kg', cwt: '1 cwt = 100 lb = 45,36 kg', refT: 'Terneros de recría y cebo: precio por tramo de peso', refNote: 'Marco medio y grande, grado muscular 1, sin condiciones especiales (la referencia habitual de los informes). Precio medio de las subastas del estado, ponderado por cabezas; el cambio compara con la semana anterior.',
      chartT: 'Evolución semanal', chartNote: 'Semanas con menos de 5 cabezas vendidas no se dibujan (cifras muy ruidosas); sí aparecen en la tabla del informe.', omitted: 'omitidas',
      allT: 'Todas las clases y especificaciones de la semana', commodity: 'Tipo', com_Feeder: 'Terneros de recría y cebo (feeder)', com_Replacement: 'Reposición (replacement)', com_Slaughter: 'Sacrificio (slaughter)',
      cClass: 'Clase', cSpec: 'Especificación', cWeight: 'Peso (lb)', cHead: 'Cabezas', cWt: 'Peso medio', cRange: 'Rango', cAvg: 'Media', cUnit: 'Unidad', perCwt: 'USD/cwt', perUnit: 'USD/cabeza',
      specNote: 'M&L = marco medio y grande; M = medio; L = grande; #1, #1-2… = grado muscular. Las filas con condiciones especiales (sin destetar, fancy…) llevan su etiqueta y no se mezclan con la referencia.',
      cattleSrc: 'Resumen semanal de subastas de ganado del estado (USDA AMS). Las cifras son las del informe: Dehesa no estima ni suaviza nada.',
      hClass: 'Clase', hQuality: 'Calidad', hPackage: 'Empaque', hUnit: 'Unidad', hSale: 'Venta', hFreight: 'Entrega', hRegion: 'Región', hRange: 'Rango', hAvg: 'Media pond.', hQty: 'Cantidad', hChg: 'Vs. informe anterior', hPer: 'Precio por', unitF: 'Unidad de precio', hFilterC: 'Clase de heno',
      hTitle: 'Precios del heno', hNote: 'Informe directo del USDA: precios de oferta (Ask), de operaciones (Trade) o de contrato. «F.O.B.» = en finca o pila; «Delivered» = entregado. La calidad (Supreme, Premium, Good, Fair, Utility) es la que asigna el informe. Cada fila es una especificación distinta: no se mezclan clases, calidades, empaques ni tipos de venta.',
      hChartT: 'Evolución de la especificación seleccionada', hClick: 'Pulsa una fila para ver su serie.', hMin: 'mínimo', hMax: 'máximo', hAvgS: 'media ponderada', hMid: 'punto medio del rango', hOnly: 'Esta serie solo tiene', hPts: 'informes',
      hSrc: 'Direct Hay Report del estado (USDA AMS). Los precios son los del informe; el cambio compara con el informe anterior de la misma especificación.', report: 'Informe original', conv: 'Conversión exacta', all: 'Todas' },
    en: { cattle: 'Cattle', hay: 'Hay', state: 'State', cls: 'Class', wb: 'Weight break (lb)', week: 'Report week', loading: 'Loading…', err: 'This selection could not be loaded. Please try again later.', none: 'No published figure for this selection.',
      ageOk: 'up to date', ageLate: 'delayed', days: 'd', ago: '',
      cls_Steers: 'Steers', cls_Heifers: 'Heifers', cls_Bulls: 'Bulls',
      price: 'Average price', vsPrev: 'Vs. previous week', vsYear: 'Vs. a year ago', vs4: 'Vs. 4 weeks ago', head: 'head sold', avgW: 'average weight', receipts: 'Head at the state’s auctions', recWk: 'Vs. previous week', recYr: 'Vs. a year ago',
      usd: 'USD/cwt', perKg: 'USD/kg', cwt: '1 cwt = 100 lb = 45.36 kg', refT: 'Feeder cattle: price by weight break', refNote: 'Medium and large frame, muscle grade 1, no special conditions (the usual reference in the reports). Average price across the state’s auctions, weighted by head; the change compares with the previous week.',
      chartT: 'Weekly trend', chartNote: 'Weeks with fewer than 5 head sold are not plotted (very noisy figures); they still appear in the report table.', omitted: 'omitted',
      allT: 'All classes and specifications this week', commodity: 'Type', com_Feeder: 'Feeder cattle', com_Replacement: 'Replacement cattle', com_Slaughter: 'Slaughter cattle',
      cClass: 'Class', cSpec: 'Specification', cWeight: 'Weight (lb)', cHead: 'Head', cWt: 'Avg weight', cRange: 'Range', cAvg: 'Average', cUnit: 'Unit', perCwt: 'USD/cwt', perUnit: 'USD/head',
      specNote: 'M&L = medium and large frame; M = medium; L = large; #1, #1-2… = muscle grade. Rows with special conditions (unweaned, fancy…) carry their label and are not mixed with the reference.',
      cattleSrc: 'Weekly summary of the state’s cattle auctions (USDA AMS). Figures are as reported: Dehesa does not estimate or smooth anything.',
      hClass: 'Class', hQuality: 'Quality', hPackage: 'Package', hUnit: 'Unit', hSale: 'Sale', hFreight: 'Delivery', hRegion: 'Region', hRange: 'Range', hAvg: 'Wtd. avg', hQty: 'Quantity', hChg: 'Vs. previous report', hPer: 'Price per', unitF: 'Price unit', hFilterC: 'Hay class',
      hTitle: 'Hay prices', hNote: 'USDA direct report: asking prices (Ask), trades (Trade) or contract. “F.O.B.” = at the farm or stack; “Delivered” = delivered. Quality (Supreme, Premium, Good, Fair, Utility) is the one the report assigns. Each row is a different specification: classes, qualities, packages and sale types are never mixed.',
      hChartT: 'Trend of the selected specification', hClick: 'Click a row to see its series.', hMin: 'minimum', hMax: 'maximum', hAvgS: 'weighted average', hMid: 'midpoint of the range', hOnly: 'This series has only', hPts: 'reports',
      hSrc: 'The state’s Direct Hay Report (USDA AMS). Prices are as reported; the change compares with the previous report of the same specification.', report: 'Original report', conv: 'Exact conversion', all: 'All' },
    fr: { cattle: 'Bovins', hay: 'Foin', state: 'État', cls: 'Classe', wb: 'Tranche de poids (lb)', week: 'Semaine du rapport', loading: 'Chargement…', err: 'Impossible de charger cette sélection. Réessayez plus tard.', none: 'Aucune donnée publiée pour cette sélection.',
      ageOk: 'à jour', ageLate: 'en retard', days: 'j', ago: 'il y a',
      cls_Steers: 'Bœufs castrés (steers)', cls_Heifers: 'Génisses (heifers)', cls_Bulls: 'Taureaux (bulls)',
      price: 'Prix moyen', vsPrev: 'Vs. semaine préc.', vsYear: 'Vs. il y a un an', vs4: 'Vs. il y a 4 semaines', head: 'têtes vendues', avgW: 'poids moyen', receipts: 'Têtes dans les ventes de l’État', recWk: 'Vs. semaine préc.', recYr: 'Vs. il y a un an',
      usd: 'USD/cwt', perKg: 'USD/kg', cwt: '1 cwt = 100 lb = 45,36 kg', refT: 'Bovins d’engraissement : prix par tranche de poids', refNote: 'Cadre moyen et grand, note de musculature 1, sans condition particulière (la référence habituelle des rapports). Prix moyen des ventes de l’État, pondéré par les têtes ; la variation compare à la semaine précédente.',
      chartT: 'Évolution hebdomadaire', chartNote: 'Les semaines avec moins de 5 têtes vendues ne sont pas tracées (chiffres très bruités) ; elles figurent dans le tableau du rapport.', omitted: 'omises',
      allT: 'Toutes les classes et spécifications de la semaine', commodity: 'Type', com_Feeder: 'Bovins d’engraissement (feeder)', com_Replacement: 'Renouvellement (replacement)', com_Slaughter: 'Abattage (slaughter)',
      cClass: 'Classe', cSpec: 'Spécification', cWeight: 'Poids (lb)', cHead: 'Têtes', cWt: 'Poids moyen', cRange: 'Fourchette', cAvg: 'Moyenne', cUnit: 'Unité', perCwt: 'USD/cwt', perUnit: 'USD/tête',
      specNote: 'M&L = cadre moyen et grand ; M = moyen ; L = grand ; #1, #1-2… = note de musculature. Les lignes à conditions particulières (non sevrés, fancy…) portent leur étiquette et ne sont pas mélangées à la référence.',
      cattleSrc: 'Résumé hebdomadaire des ventes de bovins de l’État (USDA AMS). Les chiffres sont ceux du rapport : Dehesa n’estime ni ne lisse rien.',
      hClass: 'Classe', hQuality: 'Qualité', hPackage: 'Conditionnement', hUnit: 'Unité', hSale: 'Vente', hFreight: 'Livraison', hRegion: 'Région', hRange: 'Fourchette', hAvg: 'Moy. pond.', hQty: 'Quantité', hChg: 'Vs. rapport préc.', hPer: 'Prix par', unitF: 'Unité de prix', hFilterC: 'Classe de foin',
      hTitle: 'Prix du foin', hNote: 'Rapport direct de l’USDA : prix demandés (Ask), transactions (Trade) ou contrat. « F.O.B. » = à la ferme ou au tas ; « Delivered » = livré. La qualité (Supreme, Premium, Good, Fair, Utility) est celle que le rapport attribue. Chaque ligne est une spécification distincte : classes, qualités, conditionnements et types de vente ne sont jamais mélangés.',
      hChartT: 'Évolution de la spécification sélectionnée', hClick: 'Cliquez sur une ligne pour voir sa série.', hMin: 'minimum', hMax: 'maximum', hAvgS: 'moyenne pondérée', hMid: 'milieu de la fourchette', hOnly: 'Cette série n’a que', hPts: 'rapports',
      hSrc: 'Direct Hay Report de l’État (USDA AMS). Les prix sont ceux du rapport ; la variation compare au rapport précédent de la même spécification.', report: 'Rapport original', conv: 'Conversion exacte', all: 'Toutes' },
    it: { cattle: 'Bovini', hay: 'Fieno', state: 'Stato', cls: 'Classe', wb: 'Fascia di peso (lb)', week: 'Settimana del rapporto', loading: 'Caricamento…', err: 'Impossibile caricare questa selezione. Riprova più tardi.', none: 'Nessun dato pubblicato per questa selezione.',
      ageOk: 'aggiornato', ageLate: 'in ritardo', days: 'g', ago: '',
      cls_Steers: 'Maschi castrati (steers)', cls_Heifers: 'Femmine (heifers)', cls_Bulls: 'Tori (bulls)',
      price: 'Prezzo medio', vsPrev: 'Vs. settimana prec.', vsYear: 'Vs. un anno fa', vs4: 'Vs. 4 settimane fa', head: 'capi venduti', avgW: 'peso medio', receipts: 'Capi nelle aste dello Stato', recWk: 'Vs. settimana prec.', recYr: 'Vs. un anno fa',
      usd: 'USD/cwt', perKg: 'USD/kg', cwt: '1 cwt = 100 lb = 45,36 kg', refT: 'Bovini da ingrasso: prezzo per fascia di peso', refNote: 'Telaio medio e grande, grado muscolare 1, senza condizioni particolari (il riferimento abituale dei rapporti). Prezzo medio delle aste dello Stato, ponderato per capi; la variazione confronta con la settimana precedente.',
      chartT: 'Andamento settimanale', chartNote: 'Le settimane con meno di 5 capi venduti non sono tracciate (cifre molto rumorose); compaiono nella tabella del rapporto.', omitted: 'omesse',
      allT: 'Tutte le classi e specifiche della settimana', commodity: 'Tipo', com_Feeder: 'Bovini da ingrasso (feeder)', com_Replacement: 'Rimonta (replacement)', com_Slaughter: 'Macellazione (slaughter)',
      cClass: 'Classe', cSpec: 'Specifica', cWeight: 'Peso (lb)', cHead: 'Capi', cWt: 'Peso medio', cRange: 'Intervallo', cAvg: 'Media', cUnit: 'Unità', perCwt: 'USD/cwt', perUnit: 'USD/capo',
      specNote: 'M&L = telaio medio e grande; M = medio; L = grande; #1, #1-2… = grado muscolare. Le righe con condizioni particolari (non svezzati, fancy…) hanno la loro etichetta e non si mescolano al riferimento.',
      cattleSrc: 'Riepilogo settimanale delle aste di bovini dello Stato (USDA AMS). Le cifre sono quelle del rapporto: Dehesa non stima né leviga nulla.',
      hClass: 'Classe', hQuality: 'Qualità', hPackage: 'Confezione', hUnit: 'Unità', hSale: 'Vendita', hFreight: 'Consegna', hRegion: 'Regione', hRange: 'Intervallo', hAvg: 'Media pond.', hQty: 'Quantità', hChg: 'Vs. rapporto prec.', hPer: 'Prezzo per', unitF: 'Unità di prezzo', hFilterC: 'Classe di fieno',
      hTitle: 'Prezzi del fieno', hNote: 'Rapporto diretto dell’USDA: prezzi richiesti (Ask), transazioni (Trade) o contratto. «F.O.B.» = in azienda o nel mucchio; «Delivered» = consegnato. La qualità (Supreme, Premium, Good, Fair, Utility) è quella assegnata dal rapporto. Ogni riga è una specifica diversa: classi, qualità, confezioni e tipi di vendita non si mescolano mai.',
      hChartT: 'Andamento della specifica selezionata', hClick: 'Tocca una riga per vedere la sua serie.', hMin: 'minimo', hMax: 'massimo', hAvgS: 'media ponderata', hMid: 'punto medio dell’intervallo', hOnly: 'Questa serie ha solo', hPts: 'rapporti',
      hSrc: 'Direct Hay Report dello Stato (USDA AMS). I prezzi sono quelli del rapporto; la variazione confronta con il rapporto precedente della stessa specifica.', report: 'Rapporto originale', conv: 'Conversione esatta', all: 'Tutte' }
  };
  var ST_NAMES = { AZ: 'Arizona', CA: 'California', CO: 'Colorado', FL: 'Florida', ID: 'Idaho', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NM: 'New Mexico', OK: 'Oklahoma', OR: 'Oregon', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', WA: 'Washington / Oregon (Columbia Basin)', WY: 'Wyoming' };
  var Q_ORDER = ['Supreme', 'Premium/Supreme', 'Premium', 'Good/Premium', 'Good', 'Fair/Good', 'Fair', 'Utility', ''];
  var FRAME = { 'Medium and Large': 'M&L', 'Large': 'L', 'Medium': 'M', 'Small and Medium': 'S&M', 'Small': 'S', '': '' };
  var STATUS = null, DOCS = {}, UI = {};

  function tr(lang) { return T[lang] || T.es; }
  function get(H, path) { return H.get(path); }
  function loadDoc(H, kind, st) { var k = kind + '-' + st; if (!DOCS[k]) DOCS[k] = H.get(k + '.json').catch(function (e) { delete DOCS[k]; throw e; }); return DOCS[k]; }
  function days(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }
  function addDays(d, n) { return new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10); }
  function near(pts, date, tol) { var best = null, bd = 1e9; for (var i = 0; i < pts.length; i++) { var dd = Math.abs(days(pts[i][0], date)); if (dd <= tol && dd < bd) { bd = dd; best = pts[i]; } } return best; }
  function pct(a, b) { return (b > 0 && a != null) ? (a / b - 1) * 100 : null; }
  function dtxt(iso, lang) { try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function pc(v, lang, H) { if (v == null || !isFinite(v)) return '–'; if (Math.abs(v) < 0.05) v = 0; var c = v > 0 ? '#2f6b4a' : v < 0 ? '#a33' : 'inherit'; return '<span style="color:' + c + ';font-weight:600">' + (v > 0 ? '+' : v < 0 ? '−' : '') + H.nf(Math.abs(v), 1) + ' %</span>'; }
  function tile(H, lab, val, sub) { return '<div class="de-tile"><div class="de-tl">' + H.esc(lab) + '</div><div class="de-tv">' + val + '</div><div class="de-ts">' + sub + '</div></div>'; }
  function btns(attr, keys, labels, cur) { return '<div class="di-src-tabs" role="group">' + keys.map(function (k) { return '<button type="button" class="di-src-tab" ' + attr + '="' + k + '" aria-pressed="' + (k === cur) + '">' + labels[k] + '</button>'; }).join('') + '</div>'; }
  function th(s, r) { return '<th scope="col"' + (r ? ' class="r"' : '') + '>' + s + '</th>'; }
  function ageBadge(date, lang, t, limit) {
    var n = days(date, new Date().toISOString().slice(0, 10)), ok = n <= limit, c = ok ? ['#E3F0E5', '#276A43'] : ['#FBE3D0', '#9a4a12'];
    return '<span class="di-badge" style="background:' + c[0] + ';color:' + c[1] + ';padding:2px 8px;border-radius:10px;font-size:12px">' + (ok ? t.ageOk : t.ageLate) + '</span> <span class="di-movers-hint">' + (t.ago ? t.ago + ' ' : '') + n + ' ' + t.days + (t.ago ? '' : ' ' + (lang === 'it' ? 'fa' : 'ago')) + '</span>';
  }
  function stateSel(H, kind, st, t) {
    var list = STATUS.reports.filter(function (r) { return r.kind === kind && r.latest; }).map(function (r) { return r.state; }).sort(function (a, b) { return (ST_NAMES[a] || a).localeCompare(ST_NAMES[b] || b); });
    return { list: list, html: '<label style="font-size:13px;display:block;margin:0 0 12px">' + H.esc(t.state) + '<br><select class="di-compare-select" data-us="state">' + list.map(function (k) { return '<option value="' + k + '"' + (k === st ? ' selected' : '') + '>' + H.esc(ST_NAMES[k] || k) + '</option>'; }).join('') + '</select></label>' };
  }
  function specLabel(r) {
    var p = [], f = FRAME[r[2]] != null ? FRAME[r[2]] : r[2]; if (f) p.push(f); if (r[3]) p.push('#' + r[3]); if (r[4]) p.push(r[4]); if (r[13]) p.push(r[13]);
    return p.join(' · ');
  }
  function wbLabel(lo, hi, wt) { return lo != null ? lo + (hi != null && hi !== lo ? '–' + hi : '') : (wt != null ? '≈ ' + Math.round(wt) : '–'); }

  /* ------------------------------ ganado ------------------------------ */
  function cattle(doc, lang, H) {
    var t = tr(lang), u = UI.cattle, L = doc.latest, h = '', cls = u.cls, hist = doc.history;
    var avail = ['Steers', 'Heifers', 'Bulls'].filter(function (c) { return Object.keys(hist).some(function (k) { return k.indexOf(c + '|') === 0; }); });
    if (avail.indexOf(cls) < 0) cls = avail[0];
    var wbs = Object.keys(hist).filter(function (k) { return k.indexOf(cls + '|') === 0 && days(hist[k][hist[k].length - 1][0], L.date) <= 28; }).map(function (k) { return +k.split('|')[1]; }).sort(function (a, b) { return a - b; });
    var wb = u.wb; if (wbs.indexOf(wb) < 0) wb = wbs.indexOf(500) >= 0 ? 500 : wbs[0];
    u.cls = cls; u.wb = wb;
    h += '<p class="di-movers-hint" style="margin:0 0 8px">' + H.esc(dtxt(L.date, lang)) + ' · ' + ageBadge(L.date, lang, t, 12) + ' · <a href="' + H.esc(doc.source.url) + '" target="_blank" rel="noopener">' + H.esc(t.report) + ' (' + doc.source.reportId + ')</a></p>';
    var rc = L.receipts || {};
    if (rc.week != null) h += '<div class="de-tiles">' + tile(H, t.receipts, H.nf(rc.week, 0), H.esc(t.recWk) + ': ' + pc(pct(rc.week, rc.weekAgo), lang, H) + ' · ' + H.esc(t.recYr) + ': ' + pc(pct(rc.week, rc.yearAgo), lang, H)) + '</div>';
    if (!wbs.length) return h + '<p class="di-movers-hint">' + H.esc(t.none) + '</p>' + cattleAll(doc, lang, H);
    var clsLab = {}; avail.forEach(function (c) { clsLab[c] = t['cls_' + c]; });
    var key = cls + '|' + wb, pts = hist[key], last = pts[pts.length - 1], prev = near(pts, addDays(last[0], -7), 3), p4 = near(pts, addDays(last[0], -28), 5), yr = near(pts, addDays(last[0], -364), 10);
    h += btns('data-uscls', avail, clsLab, cls) + '<label style="font-size:13px;display:inline-block;margin:6px 0 10px">' + H.esc(t.wb) + ' <select class="di-compare-select" data-us="wb">' + wbs.map(function (w) { return '<option value="' + w + '"' + (w === wb ? ' selected' : '') + '>' + w + '–' + (w + 50) + '</option>'; }).join('') + '</select></label>';
    var kg = lang === 'en' ? '' : ' · ≈ ' + H.nf(last[1] / 100 / LB_KG, 2) + ' ' + t.perKg;
    h += '<div class="de-tiles">' + tile(H, t.price + ' · ' + dtxt(last[0], lang), H.nf(last[1], 2) + ' <span style="font-size:13px;font-weight:400">' + t.usd + '</span>', H.nf(last[2], 0) + ' ' + H.esc(t.head) + (last[3] ? ' · ' + H.esc(t.avgW) + ' ' + H.nf(last[3], 0) + ' lb' : '') + H.esc(kg)) +
      tile(H, t.vsPrev, pc(prev ? pct(last[1], prev[1]) : null, lang, H), prev ? H.nf(prev[1], 2) + ' · ' + dtxt(prev[0], lang) : '–') + tile(H, t.vs4, pc(p4 ? pct(last[1], p4[1]) : null, lang, H), p4 ? H.nf(p4[1], 2) + ' · ' + dtxt(p4[0], lang) : '–') +
      tile(H, t.vsYear, pc(yr ? pct(last[1], yr[1]) : null, lang, H), yr ? H.nf(yr[1], 2) + ' · ' + dtxt(yr[0], lang) : '–') + '</div><p class="di-movers-hint">' + H.esc(t.cwt) + '</p>';
    var shown = pts.filter(function (p) { return p[2] >= 5; }), om = pts.length - shown.length;
    h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.chartT) + '</b> · ' + H.esc(clsLab[cls]) + ' · ' + wb + '–' + (wb + 50) + ' lb · ' + H.esc(t.usd) + '</p>' +
      (shown.length > 1 ? H.chart([{ name: t.price, color: '#2f6b4a', pts: shown.map(function (p) { return { x: Date.parse(p[0] + 'T00:00:00Z'), y: p[1], l: p[0] + ' · ' + p[2] + ' ' + t.head }; }) }], { unit: t.usd, aria: t.chartT + ' ' + clsLab[cls] + ' ' + wb, vFmt: function (v) { return H.nf(v, 2) + ' ' + t.usd; }, yFmt: function (v) { return H.nf(v, 0); }, xFmt: function (x) { return dtxt(new Date(x).toISOString().slice(0, 10), lang).replace(/^\d+ /, ''); } }) : '<p class="di-movers-hint">' + H.esc(t.none) + '</p>') +
      '<p class="di-movers-hint">' + H.esc(t.chartNote) + (om ? ' (' + H.esc(t.omitted) + ': ' + om + ')' : '') + '</p>';
    /* tabla de referencia: tramos x clases en la ultima semana */
    var br = {}, cl3 = avail;
    cl3.forEach(function (c) { Object.keys(hist).forEach(function (k) { if (k.indexOf(c + '|') !== 0) return; var p = hist[k][hist[k].length - 1]; if (p[0] !== L.date) return; var w = +k.split('|')[1], pv = near(hist[k], addDays(p[0], -7), 3); (br[w] = br[w] || {})[c] = { p: p[1], n: p[2], chg: pv ? pct(p[1], pv[1]) : null }; }); });
    var ws = Object.keys(br).map(Number).sort(function (a, b) { return a - b; });
    if (ws.length) {
      h += '<p class="di-movers-hint" style="margin:14px 0 2px"><b>' + H.esc(t.refT) + '</b> · ' + H.esc(dtxt(L.date, lang)) + '</p><div class="de-sc"><table class="de-t" data-no-cards><thead><tr>' + th(H.esc(t.cWeight)) + cl3.map(function (c) { return th(H.esc(clsLab[c]) + ' · ' + H.esc(t.usd), 1); }).join('') + '</tr></thead><tbody>' +
        ws.map(function (w) { return '<tr><td>' + w + '–' + (w + 50) + '</td>' + cl3.map(function (c) { var x = br[w][c]; return '<td class="r">' + (x ? '<b>' + H.nf(x.p, 2) + '</b> <span class="di-movers-hint">(' + x.n + ') </span>' + pc(x.chg, lang, H) : '–') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="di-movers-hint">' + H.esc(t.refNote) + '</p>';
    }
    return h + cattleAll(doc, lang, H);
  }
  function cattleAll(doc, lang, H) {
    var t = tr(lang), u = UI.cattle, rows = doc.latest.rows, coms = ['Feeder Cattle', 'Replacement Cattle', 'Slaughter Cattle'].filter(function (c) { return rows.some(function (r) { return r[0] === c; }); });
    if (!coms.length) return '';
    if (coms.indexOf(u.com) < 0) u.com = coms[0];
    var lab = { 'Feeder Cattle': t.com_Feeder, 'Replacement Cattle': t.com_Replacement, 'Slaughter Cattle': t.com_Slaughter };
    var sel = rows.filter(function (r) { return r[0] === u.com; });
    var body = sel.map(function (r) {
      var unit = r[5] === 'Per Unit' ? t.perUnit : t.perCwt, rng = r[10] === r[11] ? H.nf(r[10], 2) : H.nf(r[10], 2) + '–' + H.nf(r[11], 2);
      return '<tr><td>' + H.esc(r[1]) + '</td><td>' + H.esc(specLabel(r)) + '</td><td class="r">' + H.esc(wbLabel(r[6], r[7], r[9])) + '</td><td class="r">' + H.nf(r[8], 0) + '</td><td class="r">' + (r[9] != null ? H.nf(r[9], 0) : '–') + '</td><td class="r">' + rng + '</td><td class="r"><b>' + H.nf(r[12], 2) + '</b></td><td>' + H.esc(unit) + '</td></tr>';
    }).join('');
    return '<details style="margin:14px 0"' + (u.open ? ' open' : '') + ' data-usd="all"><summary style="cursor:pointer;font-weight:600">' + H.esc(t.allT) + ' (' + rows.length + ')</summary>' + btns('data-uscom', coms, lab, u.com) +
      '<div class="de-sc"><table class="de-t" data-no-cards style="min-width:640px"><thead><tr>' + th(H.esc(t.cClass)) + th(H.esc(t.cSpec)) + th(H.esc(t.cWeight), 1) + th(H.esc(t.cHead), 1) + th(H.esc(t.cWt), 1) + th(H.esc(t.cRange), 1) + th(H.esc(t.cAvg), 1) + th(H.esc(t.cUnit)) + '</tr></thead><tbody>' + body + '</tbody></table></div><p class="di-movers-hint">' + H.esc(t.specNote) + '</p></details>' +
      '<p class="di-movers-hint">' + H.esc(t.cattleSrc) + '</p>' + H.cite(SRC, doc.latest.date);
  }

  /* ------------------------------ heno ------------------------------ */
  function hayRow(r, hist, t, H, lang) {
    var key = r.slice(0, 11).join('|'), pts = hist[key] || [], n = pts.length, last = pts[n - 1], prev = n > 1 ? pts[n - 2] : null;
    var mid = function (p) { return p[3] != null ? p[3] : (p[1] + p[2]) / 2; };
    return { key: key, r: r, chg: prev && last ? pct(mid(last), mid(prev)) : null, prevDate: prev ? prev[0] : null };
  }
  function hay(doc, lang, H) {
    var t = tr(lang), u = UI.hay, L = doc.latest, rows = L.rows, h = '', hist = doc.history;
    var classes = []; rows.forEach(function (r) { if (classes.indexOf(r[0]) < 0) classes.push(r[0]); }); classes.sort();
    if (u.cls !== 'all' && classes.indexOf(u.cls) < 0) u.cls = classes.indexOf('Alfalfa') >= 0 ? 'Alfalfa' : classes[0];
    var units = []; rows.forEach(function (r) { if (units.indexOf(r[3]) < 0) units.push(r[3]); });
    if (units.indexOf(u.unit) < 0) u.unit = units.indexOf('Per Ton') >= 0 ? 'Per Ton' : units[0];
    h += '<p class="di-movers-hint" style="margin:0 0 8px">' + H.esc(dtxt(L.date, lang)) + ' · ' + ageBadge(L.date, lang, t, 45) + ' · <a href="' + H.esc(doc.source.url) + '" target="_blank" rel="noopener">' + H.esc(t.report) + ' (' + doc.source.reportId + ')</a></p>';
    var cl = { all: t.all }; classes.forEach(function (c) { cl[c] = c; });
    var ul = {}; units.forEach(function (x) { ul[x] = x.replace('Per ', ''); });
    h += btns('data-uscls', ['all'].concat(classes), cl, u.cls) + btns('data-usunit', units, ul, u.unit);
    var sel = rows.filter(function (r) { return (u.cls === 'all' || r[0] === u.cls) && r[3] === u.unit; }).map(function (r) { return hayRow(r, hist, t, H, lang); });
    sel.sort(function (a, b) { return a.r[0].localeCompare(b.r[0]) || Q_ORDER.indexOf(a.r[1]) - Q_ORDER.indexOf(b.r[1]) || a.r[2].localeCompare(b.r[2]) || a.key.localeCompare(b.key); });
    if (!sel.length) return h + '<p class="di-movers-hint">' + H.esc(t.none) + '</p>';
    if (!u.sel || !hist[u.sel] || !sel.some(function (x) { return x.key === u.sel; })) u.sel = sel[0].key;
    var tb = sel.map(function (x) {
      var r = x.r, on = x.key === u.sel, desc = [r[4], r[5], r[6], r[7], r[8], r[9], r[10]].filter(function (s) { return s; }).join(' · ');
      return '<tr class="pa-r' + (on ? ' on' : '') + '" data-usk="' + H.esc(x.key) + '" tabindex="0" role="button" aria-pressed="' + on + '"><td>' + H.esc(r[0]) + '</td><td>' + H.esc(r[1] || '–') + '</td><td>' + H.esc(r[2] || '–') + '</td><td>' + H.esc(desc) + '</td><td class="r">' +
        (r[12] === r[13] ? H.nf(r[12], 2) : H.nf(r[12], 2) + '–' + H.nf(r[13], 2)) + '</td><td class="r">' + (r[14] != null ? '<b>' + H.nf(r[14], 2) + '</b>' : '–') + '</td><td class="r">' + (r[11] != null ? H.nf(r[11], 0) : '–') + '</td><td class="r">' + pc(x.chg, lang, H) + '</td></tr>';
    }).join('');
    h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.hTitle) + '</b> · USD ' + H.esc(ul[u.unit].toLowerCase()) + '</p><div class="de-sc"><table class="de-t" data-no-cards style="min-width:720px"><thead><tr>' + th(H.esc(t.hClass)) + th(H.esc(t.hQuality)) + th(H.esc(t.hPackage)) + th(H.esc(t.hSale) + ' · ' + H.esc(t.hFreight) + ' · ' + H.esc(t.hRegion)) + th(H.esc(t.hRange), 1) + th(H.esc(t.hAvg), 1) + th(H.esc(t.hQty), 1) + th(H.esc(t.hChg), 1) + '</tr></thead><tbody>' + tb + '</tbody></table></div><p class="di-movers-hint">' + H.esc(t.hClick) + '</p>';
    var pts = hist[u.sel] || [], spec = u.sel.split('|').filter(function (s) { return s; }).join(' · '), lowest = pts.length < 3;
    var mk = function (i) { return pts.filter(function (p) { return p[i] != null; }).map(function (p) { return { x: Date.parse(p[0] + 'T00:00:00Z'), y: p[i], l: p[0] }; }); };
    var ser = [{ name: t.hMin, color: '#9a9484', pts: mk(1) }, { name: t.hMax, color: '#b7791f', pts: mk(2) }];
    if (pts.some(function (p) { return p[3] != null; })) ser.push({ name: t.hAvgS, color: '#2f6b4a', pts: mk(3) });
    h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + H.esc(t.hChartT) + '</b> · ' + H.esc(spec) + '</p>' + (pts.length > 1 ? H.chart(ser, { unit: 'USD ' + ul[u.unit].toLowerCase(), aria: t.hChartT + ' ' + spec, vFmt: function (v) { return H.nf(v, 2); }, yFmt: function (v) { return H.nf(v, v >= 100 ? 0 : 1); }, xFmt: function (x) { return dtxt(new Date(x).toISOString().slice(0, 10), lang).replace(/^\d+ /, ''); } }) : '') +
      (lowest ? '<p class="di-movers-hint">' + H.esc(t.hOnly) + ' ' + pts.length + ' ' + H.esc(t.hPts) + '.</p>' : '');
    return h + '<p class="di-movers-hint">' + H.esc(t.hNote) + '</p><p class="di-movers-hint">' + H.esc(t.hSrc) + '</p>' + H.cite(SRC, L.date);
  }

  /* ------------------------------ montaje ------------------------------ */
  function render(el, kind, lang, H) {
    var t = tr(lang), u = UI[kind];
    el.innerHTML = '<p class="di-movers-hint">' + H.esc(t.loading) + '</p>';
    var p = STATUS ? Promise.resolve(STATUS) : H.get('status.json').then(function (d) { STATUS = d; return d; });
    p.then(function () {
      var ss = stateSel(H, kind, u.st, t); if (!ss.list.length) throw new Error('empty');
      if (ss.list.indexOf(u.st) < 0) { u.st = ss.list.indexOf('KS') >= 0 ? 'KS' : ss.list[0]; ss = stateSel(H, kind, u.st, t); }
      return loadDoc(H, kind, u.st).then(function (doc) { el.innerHTML = ss.html + (kind === 'cattle' ? cattle(doc, lang, H) : hay(doc, lang, H)); });
    }).catch(function () { STATUS = null; el.innerHTML = '<p class="di-info-api-notice">' + H.esc(t.err) + '</p>'; });
  }
  function mount(el, kind, lang, H, state) {
    UI[kind] = UI[kind] || (kind === 'cattle' ? { st: 'KS', cls: 'Steers', wb: 500, com: 'Feeder Cattle', open: false } : { st: 'KS', cls: 'Alfalfa', unit: 'Per Ton', sel: null });
    if (state) UI[kind].st = state;
    var u = UI[kind];
    if (!el._usBound) {
      el._usBound = true;
      el.addEventListener('change', function (e) { var k = e.target && e.target.getAttribute && e.target.getAttribute('data-us'), kd = el._usKind, uu = UI[kd]; if (!k) return; if (k === 'state') { uu.st = e.target.value; uu.sel = null; if (el._usOnState) el._usOnState(uu.st); } else if (k === 'wb') uu.wb = +e.target.value; render(el, kd, el._usLang, el._usH); });
      el.addEventListener('click', function (e) {
        var tg = e.target && e.target.closest ? e.target : null; if (!tg) return; var kd = el._usKind, uu = UI[kd], b;
        if ((b = tg.closest('[data-uscls]'))) uu.cls = b.getAttribute('data-uscls');
        else if ((b = tg.closest('[data-usunit]'))) uu.unit = b.getAttribute('data-usunit');
        else if ((b = tg.closest('[data-uscom]'))) { uu.com = b.getAttribute('data-uscom'); uu.open = true; }
        else if ((b = tg.closest('[data-usk]'))) uu.sel = b.getAttribute('data-usk');
        else return;
        render(el, kd, el._usLang, el._usH);
      });
      el.addEventListener('toggle', function (e) { var d = e.target; if (d && d.getAttribute && d.getAttribute('data-usd') === 'all') UI.cattle.open = d.open; }, true);
      el.addEventListener('keydown', function (e) { var r = e.target && e.target.getAttribute && e.target.getAttribute('data-usk'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); UI[el._usKind].sel = r; render(el, el._usKind, el._usLang, el._usH); } });
    }
    el._usKind = kind; el._usLang = lang; el._usH = H; render(el, kind, lang, H);
    return u;
  }
  function setOnState(el, fn) { el._usOnState = fn; }
  window.USLocal = { mount: mount, onState: setOnState, state: function (kind) { return UI[kind] && UI[kind].st; }, _text: T };
})();
