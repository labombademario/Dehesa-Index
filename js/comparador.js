/* Dehesa Index — Comparador por producto y país con Unit Engine. ES5.
   Datos: data/product-compare.json (series mensuales en unidad y moneda ORIGINALES, con los kg por unidad de precio) + data/fx-history.json (BCE, media mensual).
   Modos: original (un grafico por pais, cada uno en su unidad) | EUR | USD (por t o por 100 kg) | indice 100 (sobre valores originales, sin tipo de cambio). El valor original siempre se ve. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Comparador por producto y país', sub: 'Elige un producto y los países; cambia la unidad sin perder de vista el valor original de cada fuente.', prod: 'Producto', countries: 'Países', unit: 'Unidades', orig: 'Unidades originales', idx: 'Índice 100', range: 'Periodo', yrs: ['1 año', '3 años', '5 años', '10 años', 'Máximo'],
      cOrig: 'Valor original (último)', cConv: 'Convertido', cChg: 'Cambio 12 m (original)', cSrc: 'Fuente', cComp: 'Comparabilidad', cPer: 'Periodo', max: 'Máximo 6 países a la vez en una gráfica.', au: 'Australia: sin precio de granja automatizable (ABARES bloquea a GitHub Actions, MLA exige registro y FAOSTAT impone CC BY 4.0 con restricción de promoción comercial, pendiente de revisión). Aparece cuando haya una fuente con licencia.',
      baseNote: 'Índice 100 = primer mes con dato de todos los países elegidos dentro del periodo; se calcula sobre los valores originales, así que no depende del tipo de cambio.',
      fxNote: 'Conversión: cada mes se convierte con la media mensual del tipo de cambio del BCE de ese mes (no el de hoy); bushel y cwt se pasan a kg con los factores estándar (trigo y soja 27,2155 kg/bu; maíz 25,4012; cebada 21,7724; avena 14,5149; cwt 45,3592 kg). Son precios de distinta calidad y etapa: «direccional» significa comparable en tendencia y orden de magnitud, no idéntico.',
      none: 'Sin datos para esta selección.', stale: 'dato desfasado', showOld: 'Mostrar datos antiguos', oldL: 'Datos antiguos (último dato de hace más de 6 meses)', hiddenOld: 'ocultos por desfasados', oldNote: 'Hay países cuyo último dato es muy anterior al resto; no se comparan al mismo nivel que los mercados actuales.', small: 'Un gráfico por país, cada uno en su unidad original.', conv: 'convertido', origL: 'original', eu: 'UE (media)', directional: 'direccional', exact: 'comparable', noprice: 'sin precio',
      sumLabel: 'Resumen', meth: 'Metodología', pt: 'por', fxMiss: 'Si un mes no tiene tipo de cambio se usa el del mes anterior (como máximo 2 meses atrás); si tampoco hay, ese punto no se convierte y se indica «sin conversión disponible». Nunca se usa el tipo de cambio de otra fecha posterior ni el de hoy.', cLast: 'Última cotización', cAvg: 'Promedio del mes', noConv: 'sin conversión disponible', cFresh: 'Frescura', aggNote: 'Última cotización = el último dato publicado por la fuente (con el tipo de cambio de su mes). Promedio del mes = la media de las cotizaciones del mes más reciente, que es lo que dibuja la gráfica; pueden diferir.', obs: 'cotiz.', skipN: 'puntos sin conversión omitidos', t: 't', kg100: '100 kg' },
    en: { title: 'Product and country comparator', sub: 'Pick a product and countries; switch units without losing sight of each source’s original value.', prod: 'Product', countries: 'Countries', unit: 'Units', orig: 'Original units', idx: 'Index 100', range: 'Period', yrs: ['1 year', '3 years', '5 years', '10 years', 'Max'],
      cOrig: 'Original value (latest)', cConv: 'Converted', cChg: '12-month change (original)', cSrc: 'Source', cComp: 'Comparability', cPer: 'Period', max: 'Up to 6 countries at once on one chart.', au: 'Australia: no automatable farm-price source (ABARES blocks GitHub Actions, MLA requires registration and FAOSTAT applies CC BY 4.0 with a commercial-promotion restriction, still under review). It will appear once a licensed source exists.',
      baseNote: 'Index 100 = first month with data for all selected countries within the period; computed on original values, so it does not depend on exchange rates.',
      fxNote: 'Conversion: each month is converted at that month’s ECB monthly average exchange rate (not today’s); bushel and cwt are turned into kg with standard factors (wheat and soybeans 27.2155 kg/bu; corn 25.4012; barley 21.7724; oats 14.5149; cwt 45.3592 kg). Prices differ in quality and trade stage: “directional” means comparable in trend and order of magnitude, not identical.',
      none: 'No data for this selection.', stale: 'outdated', showOld: 'Show old data', oldL: 'Old data (latest point more than 6 months behind)', hiddenOld: 'hidden as outdated', oldNote: 'Some countries’ latest data is far behind the rest; they are not compared on the same footing as current markets.', small: 'One chart per country, each in its original unit.', conv: 'converted', origL: 'original', eu: 'EU (average)', directional: 'directional', exact: 'comparable', noprice: 'no price',
      sumLabel: 'Summary', meth: 'Methodology', pt: 'per', fxMiss: 'If a month has no exchange rate the previous month is used (at most 2 months back); otherwise that point is not converted and shown as “no conversion available”. A later or today’s rate is never used.', cLast: 'Latest quote', cAvg: 'Monthly average', noConv: 'no conversion available', cFresh: 'Freshness', aggNote: 'Latest quote = the last value published by the source (at its month’s exchange rate). Monthly average = the mean of the quotes in the most recent month, which is what the chart plots; they can differ.', obs: 'quotes', skipN: 'points without conversion omitted', t: 't', kg100: '100 kg' },
    fr: { title: 'Comparateur par produit et pays', sub: 'Choisissez un produit et des pays ; changez d’unité sans perdre de vue la valeur d’origine de chaque source.', prod: 'Produit', countries: 'Pays', unit: 'Unités', orig: 'Unités d’origine', idx: 'Indice 100', range: 'Période', yrs: ['1 an', '3 ans', '5 ans', '10 ans', 'Max'],
      cOrig: 'Valeur d’origine (dernière)', cConv: 'Converti', cChg: 'Variation 12 mois (origine)', cSrc: 'Source', cComp: 'Comparabilité', cPer: 'Période', max: 'Jusqu’à 6 pays à la fois sur un graphique.', au: 'Australie : pas de prix à la ferme automatisable (l’ABARES bloque GitHub Actions, MLA exige une inscription et FAOSTAT applique la CC BY 4.0 avec une restriction de promotion commerciale, en cours d’examen). Elle apparaîtra avec une source sous licence.',
      baseNote: 'Indice 100 = premier mois avec données pour tous les pays choisis dans la période ; calculé sur les valeurs d’origine, il ne dépend pas du taux de change.',
      fxNote: 'Conversion : chaque mois est converti avec la moyenne mensuelle du taux de change de la BCE de ce mois (pas celui d’aujourd’hui) ; boisseau et cwt sont convertis en kg avec les facteurs standard (blé et soja 27,2155 kg/bu ; maïs 25,4012 ; orge 21,7724 ; avoine 14,5149 ; cwt 45,3592 kg). Les prix diffèrent par qualité et stade : « directionnel » signifie comparable en tendance et en ordre de grandeur, pas identique.',
      none: 'Aucune donnée pour cette sélection.', stale: 'donnée ancienne', showOld: 'Afficher les données anciennes', oldL: 'Données anciennes (dernier point en retard de plus de 6 mois)', hiddenOld: 'masqués car anciens', oldNote: 'Certains pays ont une dernière donnée très en retard ; ils ne sont pas comparés au même niveau que les marchés actuels.', small: 'Un graphique par pays, chacun dans son unité d’origine.', conv: 'converti', origL: 'origine', eu: 'UE (moyenne)', directional: 'directionnel', exact: 'comparable', noprice: 'pas de prix',
      sumLabel: 'Résumé', meth: 'Méthodologie', pt: 'par', fxMiss: 'Si un mois n’a pas de taux de change, on utilise celui du mois précédent (au plus 2 mois en arrière) ; sinon le point n’est pas converti et affiché « conversion indisponible ». Jamais un taux postérieur ni celui du jour.', cLast: 'Dernière cotation', cAvg: 'Moyenne du mois', noConv: 'conversion indisponible', cFresh: 'Fraîcheur', aggNote: 'Dernière cotation = la dernière valeur publiée par la source (au taux de son mois). Moyenne du mois = moyenne des cotations du mois le plus récent, ce que trace le graphique ; elles peuvent différer.', obs: 'cotations', skipN: 'points sans conversion omis', t: 't', kg100: '100 kg' },
    it: { title: 'Confronto per prodotto e paese', sub: 'Scegli un prodotto e i paesi; cambia unità senza perdere di vista il valore originale di ogni fonte.', prod: 'Prodotto', countries: 'Paesi', unit: 'Unità', orig: 'Unità originali', idx: 'Indice 100', range: 'Periodo', yrs: ['1 anno', '3 anni', '5 anni', '10 anni', 'Max'],
      cOrig: 'Valore originale (ultimo)', cConv: 'Convertito', cChg: 'Variazione 12 mesi (originale)', cSrc: 'Fonte', cComp: 'Confrontabilità', cPer: 'Periodo', max: 'Fino a 6 paesi alla volta su un grafico.', au: 'Australia: nessun prezzo alla fattoria automatizzabile (ABARES blocca GitHub Actions, MLA richiede registrazione e FAOSTAT applica la CC BY 4.0 con una restrizione di promozione commerciale, in corso di verifica). Comparirà con una fonte con licenza.',
      baseNote: 'Indice 100 = primo mese con dati per tutti i paesi scelti nel periodo; calcolato sui valori originali, quindi non dipende dal cambio.',
      fxNote: 'Conversione: ogni mese è convertito con la media mensile del cambio BCE di quel mese (non quello di oggi); bushel e cwt sono portati a kg con i fattori standard (grano e soia 27,2155 kg/bu; mais 25,4012; orzo 21,7724; avena 14,5149; cwt 45,3592 kg). I prezzi differiscono per qualità e fase: «direzionale» significa confrontabile per tendenza e ordine di grandezza, non identico.',
      none: 'Nessun dato per questa selezione.', stale: 'dato datato', showOld: 'Mostra dati vecchi', oldL: 'Dati vecchi (ultimo dato oltre 6 mesi indietro)', hiddenOld: 'nascosti perché datati', oldNote: 'Alcuni paesi hanno l’ultimo dato molto indietro; non sono confrontati sullo stesso piano dei mercati attuali.', small: 'Un grafico per paese, ciascuno nella sua unità originale.', conv: 'convertito', origL: 'originale', eu: 'UE (media)', directional: 'direzionale', exact: 'confrontabile', noprice: 'nessun prezzo',
      sumLabel: 'Riepilogo', meth: 'Metodologia', pt: 'per', fxMiss: 'Se un mese non ha il cambio si usa quello del mese precedente (al massimo 2 mesi indietro); altrimenti il punto non viene convertito e appare «conversione non disponibile». Mai un cambio successivo né quello di oggi.', cLast: 'Ultima quotazione', cAvg: 'Media del mese', noConv: 'conversione non disponibile', cFresh: 'Freschezza', aggNote: 'Ultima quotazione = l’ultimo valore pubblicato dalla fonte (al cambio del suo mese). Media del mese = media delle quotazioni del mese più recente, quella che disegna il grafico; possono differire.', obs: 'quotazioni', skipN: 'punti senza conversione omessi', t: 't', kg100: '100 kg' }
  };

  var X = {
    es: { fFresh: 'Datos', fOnly: 'Solo datos al día', fAll: 'Incluir históricos', kLbl: 'Comparabilidad', kAll: 'Todas', kExact: 'Exacta', kDir: 'Direccional', cOrigH: 'Original', cNormH: 'Normalizado', cDate: 'Fecha', kHelp: 'Exacta: mismo producto, unidad y punto de la cadena. Direccional: producto parecido pero con definiciones distintas (variedad, calidad, punto de venta): sirve para ver el orden de magnitud y la tendencia, no para restar precios.', noKExact: 'Ninguna serie de este producto tiene comparabilidad exacta: las fuentes definen el producto de forma distinta. Prueba con «Direccional» o «Todas».', noKDir: 'Ninguna serie de este producto es solo direccional con los filtros actuales.', normNote: 'Normalizado = convertido a la unidad elegida con el tipo de cambio mensual del BCE; en «Unidades originales» y «Índice 100» se muestra en €/t como referencia. Si no hay tipo de cambio válido, se indica en lugar de rellenarlo.', staleHid: 'Ocultos por no estar al día', shown: 'Mostrando', of: 'de', share: 'Copiar enlace', copied: 'Enlace copiado', link: 'Enlace a esta comparación' },
    en: { fFresh: 'Data', fOnly: 'Fresh data only', fAll: 'Include historical', kLbl: 'Comparability', kAll: 'All', kExact: 'Exact', kDir: 'Directional', cOrigH: 'Original', cNormH: 'Normalised', cDate: 'Date', kHelp: 'Exact: same product, unit and point in the chain. Directional: similar product with different definitions (variety, quality, point of sale): useful for order of magnitude and trend, not for subtracting prices.', noKExact: 'No series for this product has exact comparability: sources define the product differently. Try “Directional” or “All”.', noKDir: 'No series for this product is directional-only with the current filters.', normNote: 'Normalised = converted to the chosen unit with the monthly ECB exchange rate; under “Original units” and “Index 100” it is shown in €/t for reference. Where no valid exchange rate exists it says so instead of filling it in.', staleHid: 'Hidden because not up to date', shown: 'Showing', of: 'of', share: 'Copy link', copied: 'Link copied', link: 'Link to this comparison' },
    fr: { fFresh: 'Données', fOnly: 'Données à jour seulement', fAll: 'Inclure l’historique', kLbl: 'Comparabilité', kAll: 'Toutes', kExact: 'Exacte', kDir: 'Indicative', cOrigH: 'Origine', cNormH: 'Normalisé', cDate: 'Date', kHelp: 'Exacte : même produit, unité et stade de la chaîne. Indicative : produit voisin mais définitions différentes (variété, qualité, point de vente) : utile pour l’ordre de grandeur et la tendance, pas pour soustraire des prix.', noKExact: 'Aucune série de ce produit n’a une comparabilité exacte : les sources définissent le produit différemment. Essayez « Indicative » ou « Toutes ».', noKDir: 'Aucune série de ce produit n’est seulement indicative avec les filtres actuels.', normNote: 'Normalisé = converti dans l’unité choisie avec le taux mensuel de la BCE ; sous « Unités d’origine » et « Indice 100 » il s’affiche en €/t à titre de référence. Sans taux de change valide, c’est indiqué au lieu de combler.', staleHid: 'Masqués car pas à jour', shown: 'Affichage', of: 'sur', share: 'Copier le lien', copied: 'Lien copié', link: 'Lien vers cette comparaison' },
    it: { fFresh: 'Dati', fOnly: 'Solo dati aggiornati', fAll: 'Includi storici', kLbl: 'Confrontabilità', kAll: 'Tutte', kExact: 'Esatta', kDir: 'Indicativa', cOrigH: 'Originale', cNormH: 'Normalizzato', cDate: 'Data', kHelp: 'Esatta: stesso prodotto, unità e punto della filiera. Indicativa: prodotto simile ma con definizioni diverse (varietà, qualità, punto vendita): utile per ordine di grandezza e tendenza, non per sottrarre prezzi.', noKExact: 'Nessuna serie di questo prodotto ha confrontabilità esatta: le fonti definiscono il prodotto in modo diverso. Prova «Indicativa» o «Tutte».', noKDir: 'Nessuna serie di questo prodotto è solo indicativa con i filtri attuali.', normNote: 'Normalizzato = convertito nell’unità scelta con il cambio mensile BCE; in «Unità originali» e «Indice 100» è mostrato in €/t come riferimento. Se manca un cambio valido lo dice invece di riempire.', staleHid: 'Nascosti perché non aggiornati', shown: 'Mostrati', of: 'su', share: 'Copia link', copied: 'Link copiato', link: 'Link a questo confronto' }
  };
  Object.keys(X).forEach(function (l) { for (var k in X[l]) T[l][k] = X[l][k]; });
  var COL = ['#2f6b4a', '#c0662d', '#3b6fa8', '#8c5a9e', '#b08a1f', '#5f6b70'];
  var OKST = ['LIVE', 'FRESH', 'EXPECTED_DELAY'], ST = { old: false, k: 'all', p: 'trigo', c: ['ES', 'FR', 'DE', 'CA', 'US'], u: 'eur', r: 10 }, D = null, FX = null, SKIP = 0;
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { if (typeof v !== 'number' || !isFinite(v)) return '–'; var dd = d != null ? d : (Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 100 ? 1 : 2); try { return v.toLocaleString(lang(), { minimumFractionDigits: dd, maximumFractionDigits: dd }); } catch (e) { return v.toFixed(dd); } }
  function iso(c) { return c === 'EL' ? 'GR' : c === 'UK' ? 'GB' : c; }
  function flag(c) { if (c === 'EU') return '🇪🇺'; if (window.DIAgg && DIAgg.flag(c)) return DIAgg.flag(c); var i = iso(c); if (!/^[A-Z]{2}$/.test(i)) return ''; return String.fromCodePoint(127397 + i.charCodeAt(0), 127397 + i.charCodeAt(1)); }
  function cname(c) { if (c === 'EU') return tt().eu; var ag = window.DIAgg && DIAgg.label(c, lang()); if (ag) return ag; try { return new Intl.DisplayNames([lang()], { type: 'region' }).of(iso(c)) || c; } catch (e) { return c; } }
  function ts(ym) { return Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1); }
  // Unit Engine central (js/unit-engine.js): sin conversion valida devuelve null; nunca se rellena con "el ultimo tipo de cambio".
  function convert(s, v, ym, mode, per) { var r = window.DIUnits.convert(v, s, ym, mode, per); return r.value == null ? null : r.value; }
  function unitLbl(mode, per) { var t = tt(); return mode === 'usd' ? 'USD/' + (per === 1000 ? t.t : t.kg100) : '€/' + (per === 1000 ? t.t : t.kg100); }
  function cut(s) { var n = [1, 3, 5, 10, 99][ST.r_i != null ? ST.r_i : 3], last = s.points[s.points.length - 1][0]; var y = +last.slice(0, 4) - (n === 99 ? 99 : n), from = (n === 99 ? '0000' : ('' + y)) + last.slice(4); return s.points.filter(function (p) { return p[0] >= from; }); }
  function orgTxt(s) { return nf(s.latest[1], s.latest[1] < 20 ? 2 : s.latest[1] < 1000 ? 2 : 0) + ' ' + s.unit; }
  function chg12(s) { var pts = s.points, l = pts[pts.length - 1], y = (+l[0].slice(0, 4) - 1) + l[0].slice(4), o = null; for (var i = pts.length - 1; i >= 0; i--) if (pts[i][0] <= y) { o = pts[i]; break; } if (!o || !o[1]) return null; return (l[1] / o[1] - 1) * 100; }
  function pc(v) { if (v == null) return '–'; var c = v >= 0 ? '#2f6b4a' : '#a33'; return '<span style="color:' + c + ';font-weight:600">' + (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %</span>'; }
  // Frescura: un dato esta "antiguo" si su ultimo punto va mas de ~6 meses por detras del mas reciente del producto.
  var OLD_DAYS = 180;
  function refDate(p) { return p.series.reduce(function (a, s) { return s.latest[0] > a ? s.latest[0] : a; }, ''); }
  function isOld(s, p) { if (s.fs) return OKST.indexOf(s.fs) < 0; return (Date.parse(refDate(p)) - Date.parse(s.latest[0])) / 864e5 > OLD_DAYS; }
  function sel() { var p = D.products[ST.p]; return ST.c.map(function (c) { return p.series.filter(function (s) { return s.c === c; })[0]; }).filter(function (s) { return s && (ST.old || !isOld(s, p)) && (ST.k === 'all' || s.comp === ST.k); }); }
  function chartHtml(list, p, t) {
    var mode = ST.u, per = p.per, ser = [], vf = {}, i = 0; SKIP = 0;
    var base = null;
    if (mode === 'idx') { // primer mes comun a todas las series dentro del periodo
      var sets = list.map(function (s) { var o = {}; cut(s).forEach(function (q) { o[q[0]] = q[1]; }); return o; }), first = null;
      Object.keys(sets[0] || {}).sort().forEach(function (k) { if (first === null && sets.every(function (o) { return o[k] != null; })) first = k; }); base = first;
      if (!base) return '';
    }
    list.forEach(function (s, idx) {
      var name = flag(s.c) + ' ' + cname(s.c), pts = [], b0 = null;
      cut(s).forEach(function (q) {
        if (mode === 'idx') { if (q[0] < base) return; if (b0 == null) b0 = q[1]; if (!b0) return; pts.push({ x: ts(q[0]), y: q[1] / b0 * 100, o: q[1], l: DehesaChart.fmtMonth(ts(q[0])) }); }
        else { var y = convert(s, q[1], q[0], mode, per); if (y == null) SKIP++; if (y != null) pts.push({ x: ts(q[0]), y: y, o: q[1], l: DehesaChart.fmtMonth(ts(q[0])) }); }
      });
      if (!pts.length) return;
      ser.push({ name: name, color: COL[idx % COL.length], pts: pts });
      vf[name] = function (y, pt) { return nf(y, mode === 'idx' ? 1 : null) + (mode === 'idx' ? '' : ' ' + unitLbl(mode, per)) + (pt && pt.o != null ? '  ·  ' + t.origL + ': ' + nf(pt.o, 2) + ' ' + s.unit : ''); };
    });
    if (!ser.length) return '';
    var yt = mode === 'idx' ? t.idx : unitLbl(mode, per);
    return DehesaChart.render({ series: ser, xMode: 'time', yTitle: yt, aria: D.products[ST.p].label[lang()] + ' (' + yt + ')', legend: true, vFmtS: vf });
  }
  function smallMultiples(list, p, t) {
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">' + list.map(function (s, i) {
      var pts = cut(s).map(function (q) { return { x: ts(q[0]), y: q[1], l: DehesaChart.fmtMonth(ts(q[0])) }; });
      return '<div><div style="font-weight:600;font-size:13px;margin:0 0 2px">' + flag(s.c) + ' ' + esc(cname(s.c)) + ' <span style="font-weight:400;color:var(--text-faint)">· ' + esc(s.unit) + '</span></div>' + DehesaChart.render({ series: [{ name: cname(s.c), color: COL[i % COL.length], pts: pts }], xMode: 'time', yTitle: s.unit, noLegend: true, width: 420, height: 200, aria: cname(s.c) + ' (' + s.unit + ')' }) + '</div>';
    }).join('') + '</div>';
  }
  function fsBadge(s) {
    var st = s.fs, F = window.DIFreshness, lg = lang(); if (!st || !F) return '';
    var col = st === 'LIVE' || st === 'FRESH' ? '#2f6b4a' : st === 'EXPECTED_DELAY' ? '#8a6d1f' : '#a33';
    return '<span title="' + esc(st) + '" style="font-size:11px;border:1px solid ' + col + ';color:' + col + ';border-radius:999px;padding:0 6px;white-space:nowrap">' + esc((F.label[st] || {})[lg] || st) + '</span>';
  }
  function compBadge(s, t) {
    var k = s.comp, lab = k === 'exact' ? t.kExact : k === 'directional' ? t.kDir : (k || '—'), col = k === 'exact' ? '#2f6b4a' : k === 'directional' ? '#8a6d1f' : '#a33';
    return '<span title="' + esc(t.kHelp) + '" style="font-size:11px;border:1px solid ' + col + ';color:' + col + ';border-radius:999px;padding:0 6px;white-space:nowrap">' + esc(lab) + '</span>';
  }
  function table(list, p, t) {
    var mode = ST.u, cmode = (mode === 'idx' || mode === 'orig') ? 'eur' : mode, cu = unitLbl(cmode, p.per);
    var rows = list.map(function (s) {
      var ym = s.latest[0].slice(0, 7), cv = convert(s, s.latest[1], ym, cmode, p.per);
      var conv = cv == null ? '<span style="color:var(--text-faint);font-size:12px">' + esc(t.noConv) + '</span>' : '<strong>' + nf(cv) + '</strong> ' + esc(cu);
      return '<tr><th scope="row" style="text-align:left;font-weight:600">' + flag(s.c) + ' ' + esc(cname(s.c)) + '</th>' +
        '<td data-label="' + esc(t.cOrigH) + '"><strong>' + esc(orgTxt(s)) + '</strong></td>' +
        '<td data-label="' + esc(t.cNormH) + ' (' + esc(cu) + ')">' + conv + '</td>' +
        '<td data-label="' + esc(t.cDate) + '">' + esc(s.latest[0]) + '</td>' +
        '<td data-label="' + esc(t.cFresh) + '">' + fsBadge(s) + '</td><td data-label="' + esc(t.cSrc) + '">' + esc(s.src) + '</td>' +
        '<td data-label="' + esc(t.cComp) + '">' + compBadge(s, t) + '</td></tr>';
    }).join('');
    var th = function (x) { return '<th scope="col" style="text-align:left;font-size:11px;color:var(--text-faint);padding:4px 8px;border-bottom:1px solid var(--border)">' + esc(x) + '</th>'; };
    return '<div class="di-table-wrap"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr>' + th(t.countries.replace(/s$/, '')) + th(t.cOrigH) + th(t.cNormH + ' (' + cu + ')') + th(t.cDate) + th(t.cFresh) + th(t.cSrc) + th(t.cComp) + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="di-movers-hint">' + esc(t.normNote) + '</p>';
  }
  function chipStyle(on) { return 'display:inline-flex;align-items:center;gap:6px;margin:0 6px 6px 0;padding:4px 11px;border:1px solid ' + (on ? '#2f6b3a' : 'var(--border)') + ';border-radius:999px;background:' + (on ? '#e3f0e5' : 'transparent') + ';color:inherit;font:inherit;font-size:13px;cursor:pointer'; }
  function render() {
    var root = document.getElementById('cmp-body'); if (!root || !D) return; var t = tt(), p = D.products[ST.p];
    var h1 = document.getElementById('cp-h1'), sb = document.getElementById('cp-sub'); if (h1) h1.textContent = t.title; if (sb) sb.textContent = t.sub; document.title = 'Dehesa Index — ' + t.title;
    var list = sel(), codes = p.series.map(function (s) { return s.c; });
    var orderPref = ['ES', 'FR', 'DE', 'IT', 'NL', 'PL', 'DK', 'IE', 'UK', 'EU', 'CA', 'US'];
    codes.sort(function (a, b) { var x = orderPref.indexOf(a), y = orderPref.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || (a < b ? -1 : 1); });
    var h = '<div class="di-card" style="padding:14px 16px;margin-bottom:16px"><div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:10px"><label style="font-size:13px">' + esc(t.prod) + '<br><select id="cp-p" class="di-compare-select">' + Object.keys(D.products).map(function (k) { return '<option value="' + k + '"' + (k === ST.p ? ' selected' : '') + '>' + esc(D.products[k].label[lang()] || k) + '</option>'; }).join('') + '</select></label>' +
      '<label style="font-size:13px">' + esc(t.range) + '<br><select id="cp-r" class="di-compare-select">' + t.yrs.map(function (y, i) { return '<option value="' + i + '"' + (i === (ST.r_i != null ? ST.r_i : 3) ? ' selected' : '') + '>' + esc(y) + '</option>'; }).join('') + '</select></label></div>';
    var byC = {}; p.series.forEach(function (s) { byC[s.c] = s; });
    var fresh = codes.filter(function (c) { return !isOld(byC[c], p); }), hist = codes.filter(function (c) { return isOld(byC[c], p); });
    var chip = function (c) { var on = ST.c.indexOf(c) > -1, o = isOld(byC[c], p); return '<button type="button" data-c="' + c + '" aria-pressed="' + on + '" style="' + chipStyle(on) + (o ? ';opacity:.8' : '') + '">' + flag(c) + ' ' + esc(cname(c)) + (o ? ' <span style="font-size:11px;color:var(--text-faint)">· ' + esc(byC[c].latest[0].slice(0, 4)) + '</span>' : '') + '</button>'; };
    h += '<div style="font-size:13px;margin-bottom:4px">' + esc(t.countries) + '</div><div role="group" aria-label="' + esc(t.countries) + '">' + fresh.map(chip).join('') + '<span style="' + chipStyle(false) + ';cursor:default;border-style:dashed;color:var(--text-muted)" title="' + esc(t.au) + '">🇦🇺 ' + esc(cname('AU')) + ' · ' + esc(t.noprice) + '</span></div>';
    if (hist.length) {
      if (ST.old) h += '<div style="font-size:12px;color:var(--text-faint);margin-bottom:2px">' + esc(t.oldL) + '</div><div role="group" aria-label="' + esc(t.oldL) + '">' + hist.map(chip).join('') + '</div>';
      else if (ST.c.some(function (c) { return byC[c] && isOld(byC[c], p); })) h += '<div class="di-movers-hint" style="margin:0 0 6px">' + ST.c.filter(function (c) { return byC[c] && isOld(byC[c], p); }).map(function (c) { return flag(c) + ' ' + cname(c); }).join(', ') + ' — ' + esc(t.hiddenOld) + '. ' + esc(t.oldNote) + '</div>';
    }
    var modes = [['orig', t.orig], ['eur', '€/' + (p.per === 1000 ? t.t : t.kg100)], ['usd', 'USD/' + (p.per === 1000 ? t.t : t.kg100)], ['idx', t.idx]];
    var rg = function (lbl, attr, opts, cur) { return '<div style="font-size:13px;margin:6px 0 4px">' + esc(lbl) + '</div><div role="radiogroup" aria-label="' + esc(lbl) + '">' + opts.map(function (m) { var on = cur === m[0]; return '<button type="button" role="radio" aria-checked="' + on + '" data-' + attr + '="' + m[0] + '" style="' + chipStyle(on) + '">' + esc(m[1]) + '</button>'; }).join('') + '</div>'; };
    h += rg(t.unit, 'u', modes, ST.u) + rg(t.fFresh, 'f', [['fresh', t.fOnly], ['all', t.fAll + (hist.length ? ' (' + hist.length + ')' : '')]], ST.old ? 'all' : 'fresh') + rg(t.kLbl, 'k', [['all', t.kAll], ['exact', t.kExact], ['directional', t.kDir]], ST.k) + '<div class="di-movers-hint" style="margin-top:2px">' + esc(t.kHelp) + '</div></div>';
    if (!list.length) h += '<p class="di-movers-hint">' + esc(ST.k === 'exact' ? t.noKExact : ST.k === 'directional' ? t.noKDir : t.none) + '</p>';
    else {
      h += '<div class="di-card" style="padding:12px 14px;margin-bottom:16px">' + (ST.u === 'orig' ? '<div class="di-movers-hint" style="margin:0 0 8px">' + esc(t.small) + '</div>' + smallMultiples(list, p, t) : (chartHtml(list, p, t) || '<p class="di-movers-hint">' + esc(t.none) + '</p>')) + '</div>';
      h += '<div class="di-card" style="padding:12px 14px;margin-bottom:16px">' + table(list, p, t) + '</div>';
    }
    h += '<p class="di-movers-hint">' + (ST.u === 'idx' ? esc(t.baseNote) + ' ' : '') + esc(t.fxNote) + ' ' + esc(t.fxMiss) + (SKIP ? ' <strong>' + SKIP + ' ' + esc(t.skipN) + '.</strong>' : '') + ' <a href="metodologia.html" style="color:inherit">' + esc(t.meth) + '</a></p><p class="di-movers-hint">' + esc(t.au) + '</p>';
    root.innerHTML = h; bind(root, p);
    try { var q = new URLSearchParams(); q.set('p', ST.p); q.set('c', ST.c.join(',')); q.set('u', ST.u); q.set('r', ST.r_i != null ? ST.r_i : 3); if (ST.old) q.set('f', 'all'); if (ST.k !== 'all') q.set('k', ST.k); history.replaceState(null, '', '?' + q.toString()); } catch (e) {}
  }
  function bind(root, p) {
    root.querySelector('#cp-p').onchange = function (e) { ST.p = e.target.value; var codes = D.products[ST.p].series.map(function (s) { return s.c; }); var keep = ST.c.filter(function (c) { return codes.indexOf(c) > -1; }); ST.c = keep.length ? keep : ['ES', 'FR', 'DE', 'CA', 'US'].filter(function (c) { return codes.indexOf(c) > -1; }); render(); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-f]'), function (b) { b.onclick = function () { ST.old = b.getAttribute('data-f') === 'all'; render(); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { ST.k = b.getAttribute('data-k'); render(); }; });
    root.querySelector('#cp-r').onchange = function (e) { ST.r_i = +e.target.value; render(); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-c]'), function (b) { b.onclick = function () { var c = b.getAttribute('data-c'), i = ST.c.indexOf(c); if (i > -1) ST.c.splice(i, 1); else if (ST.c.length < 6) ST.c.push(c); render(); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-u]'), function (b) { b.onclick = function () { ST.u = b.getAttribute('data-u'); render(); }; });
  }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  var q = new URLSearchParams(location.search); if (q.get('h') === '1' || q.get('f') === 'all') ST.old = true; if (/^(exact|directional)$/.test(q.get('k') || '')) ST.k = q.get('k'); if (q.get('p')) ST.p = q.get('p'); if (q.get('c')) ST.c = q.get('c').toUpperCase().split(',').slice(0, 6); if (/^(orig|eur|usd|idx)$/.test(q.get('u') || '')) ST.u = q.get('u'); if (q.get('r') != null && /^[0-4]$/.test(q.get('r'))) ST.r_i = +q.get('r');
  Promise.all([fetch('data/product-compare.json').then(function (r) { return r.json(); }), fetch('data/fx-history.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })]).then(function (a) {
    D = a[0]; FX = a[1]; window.DIUnits.setFx(FX);
    if (!D.products[ST.p]) ST.p = 'trigo'; render();
  }).catch(function () { var r = document.getElementById('cmp-body'); if (r) r.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
})();
