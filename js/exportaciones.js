/* Dehesa Index — Exportaciones de EE. UU. Ventas semanales (USDA FAS ESR) y comercio mensual por país (USDA FAS GATS). */
(function () {
  'use strict';
  var ESR = null, GATS = null;
  var SEL = { tab: 'esr', code: 401, flow: 'ex', group: 'maiz', period: '12', top: 15 };
  var C1 = '#1d5178', C2 = '#b8a98a';
  var GN = {
    es: { trigo: 'Trigo', maiz: 'Maíz', arroz: 'Arroz', sorgo: 'Sorgo', cebada: 'Cebada', soja: 'Soja (grano)', harina_soja: 'Harina de soja', aceite_soja: 'Aceite de soja', ddgs: 'DDGS y residuos de destilería', etanol: 'Etanol', vacuno: 'Vacuno', cerdo: 'Cerdo', pollo: 'Pollo y aves', lacteos: 'Lácteos', huevos: 'Huevos', algodon: 'Algodón', fertilizantes: 'Fertilizantes', ganado_vivo: 'Ganado vivo (vacuno)' },
    en: { trigo: 'Wheat', maiz: 'Corn', arroz: 'Rice', sorgo: 'Sorghum', cebada: 'Barley', soja: 'Soybeans', harina_soja: 'Soybean meal', aceite_soja: 'Soybean oil', ddgs: 'DDGS and distillery residues', etanol: 'Ethanol', vacuno: 'Beef', cerdo: 'Pork', pollo: 'Poultry', lacteos: 'Dairy', huevos: 'Eggs', algodon: 'Cotton', fertilizantes: 'Fertilizers', ganado_vivo: 'Live cattle' },
    fr: { trigo: 'Blé', maiz: 'Maïs', arroz: 'Riz', sorgo: 'Sorgho', cebada: 'Orge', soja: 'Soja (graines)', harina_soja: 'Tourteau de soja', aceite_soja: 'Huile de soja', ddgs: 'DDGS et résidus de distillerie', etanol: 'Éthanol', vacuno: 'Bœuf', cerdo: 'Porc', pollo: 'Volaille', lacteos: 'Produits laitiers', huevos: 'Œufs', algodon: 'Coton', fertilizantes: 'Engrais', ganado_vivo: 'Bovins vivants' },
    it: { trigo: 'Grano', maiz: 'Mais', arroz: 'Riso', sorgo: 'Sorgo', cebada: 'Orzo', soja: 'Soia (semi)', harina_soja: 'Farina di soia', aceite_soja: 'Olio di soia', ddgs: 'DDGS e residui di distilleria', etanol: 'Etanolo', vacuno: 'Manzo', cerdo: 'Maiale', pollo: 'Pollame', lacteos: 'Latticini', huevos: 'Uova', algodon: 'Cotone', fertilizantes: 'Fertilizzanti', ganado_vivo: 'Bovini vivi' }
  };
  var CN = {
    es: { 107: 'Trigo (todas las clases)', 101: 'Trigo duro rojo de invierno (HRW)', 102: 'Trigo blando rojo de invierno (SRW)', 103: 'Trigo duro rojo de primavera (HRS)', 104: 'Trigo blanco', 105: 'Trigo duro (durum)', 401: 'Maíz', 701: 'Sorgo', 301: 'Cebada', 801: 'Soja (grano)', 901: 'Harina de soja', 902: 'Aceite de soja', 1404: 'Algodón upland', 1505: 'Arroz (todos)', 1701: 'Vacuno (cortes de músculo)', 1702: 'Cerdo (cortes de músculo)' },
    en: { 107: 'Wheat (all classes)', 101: 'Hard red winter wheat (HRW)', 102: 'Soft red winter wheat (SRW)', 103: 'Hard red spring wheat (HRS)', 104: 'White wheat', 105: 'Durum wheat', 401: 'Corn', 701: 'Sorghum', 301: 'Barley', 801: 'Soybeans', 901: 'Soybean meal', 902: 'Soybean oil', 1404: 'Upland cotton', 1505: 'Rice (all)', 1701: 'Beef (muscle cuts)', 1702: 'Pork (muscle cuts)' },
    fr: { 107: 'Blé (toutes classes)', 101: 'Blé dur rouge d’hiver (HRW)', 102: 'Blé tendre rouge d’hiver (SRW)', 103: 'Blé dur rouge de printemps (HRS)', 104: 'Blé blanc', 105: 'Blé dur (durum)', 401: 'Maïs', 701: 'Sorgho', 301: 'Orge', 801: 'Soja (graines)', 901: 'Tourteau de soja', 902: 'Huile de soja', 1404: 'Coton upland', 1505: 'Riz (tous)', 1701: 'Bœuf (morceaux musculaires)', 1702: 'Porc (morceaux musculaires)' },
    it: { 107: 'Grano (tutte le classi)', 101: 'Grano duro rosso invernale (HRW)', 102: 'Grano tenero rosso invernale (SRW)', 103: 'Grano duro rosso primaverile (HRS)', 104: 'Grano bianco', 105: 'Grano duro (durum)', 401: 'Mais', 701: 'Sorgo', 301: 'Orzo', 801: 'Soia (semi)', 901: 'Farina di soia', 902: 'Olio di soia', 1404: 'Cotone upland', 1505: 'Riso (tutti)', 1701: 'Manzo (tagli muscolari)', 1702: 'Maiale (tagli muscolari)' }
  };
  var T = {
    es: { title: 'Exportaciones de EE. UU.', sub: 'Quién compra la cosecha y la carne de EE. UU.: ventas de exportación semanales (USDA FAS) y comercio mensual por país (USDA FAS, datos del Census Bureau). Cifras oficiales en su unidad original.',
      tabEsr: 'Ventas semanales', tabGats: 'Comercio mensual', product: 'Producto', flow: 'Flujo', ex: 'Exportaciones de EE. UU.', im: 'Importaciones de EE. UU.', period: 'Periodo', p12: 'Últimos 12 meses', p1: 'Último mes',
      weekEnd: 'Semana al', my: 'Campaña', acc: 'Exportado en la campaña', out: 'Ventas pendientes de embarcar', com: 'Compromiso total', net: 'Ventas netas de la semana', vsPrev: 'frente a la misma semana de la campaña anterior',
      chartAcc: 'Exportaciones acumuladas por semana de campaña', cur: 'Campaña actual', prev: 'Campaña anterior', weekN: 'semana de campaña',
      country: 'País', unknown: 'Destino sin asignar', others: 'Otros', total: 'Total', wk: 'Embarcado en la semana', mt: 't', kt: 'kt', mtt: 'Mt', bales: 'balas', noData: 'Sin datos.',
      value: 'Valor (USD)', qty: 'Cantidad (t)', chg: 'Variación', monthly: 'Valor mensual (millones de USD)', month: 'Mes', vsYear: 'frente a los 12 meses anteriores', vsYear1: 'frente al mismo mes del año anterior', mapLink: 'Ver en el mapa', usd: 'USD',
      esrNote: 'Fuente: USDA FAS, Export Sales Reporting (informe semanal de ventas de exportación, se publica los jueves). Toneladas métricas salvo el algodón (balas). Las ventas pendientes son ventas ya cerradas y aún no embarcadas. Los totales suman los destinos publicados; el agregado de la UE cuenta como un solo destino. Son cifras que las empresas declaran a USDA y pueden revisarse.',
      gatsNote: 'Fuente: USDA FAS GATS, con datos de comercio del Census Bureau de EE. UU. Solo comercio de EE. UU. con cada país (no los flujos entre terceros). Valor en dólares corrientes; la cantidad solo se muestra cuando el Census la mide en kilos. Los dos últimos meses pueden revisarse. Los códigos arancelarios (HS) agrupan productos de forma aproximada, por ejemplo «Lácteos» reúne los capítulos 0401-0406.',
      src: 'Fuente: USDA FAS (datos públicos del Gobierno de EE. UU.)' },
    en: { title: 'U.S. exports', sub: 'Who buys U.S. crops and meat: weekly export sales (USDA FAS) and monthly trade by country (USDA FAS, U.S. Census Bureau data). Official figures in their original units.',
      tabEsr: 'Weekly sales', tabGats: 'Monthly trade', product: 'Product', flow: 'Flow', ex: 'U.S. exports', im: 'U.S. imports', period: 'Period', p12: 'Last 12 months', p1: 'Latest month',
      weekEnd: 'Week ending', my: 'Marketing year', acc: 'Exported this marketing year', out: 'Outstanding sales (not yet shipped)', com: 'Total commitment', net: 'Net sales this week', vsPrev: 'vs. same week last marketing year',
      chartAcc: 'Accumulated exports by marketing-year week', cur: 'Current year', prev: 'Previous year', weekN: 'marketing-year week',
      country: 'Country', unknown: 'Unassigned destination', others: 'Others', total: 'Total', wk: 'Shipped this week', mt: 't', kt: 'kt', mtt: 'Mt', bales: 'bales', noData: 'No data.',
      value: 'Value (USD)', qty: 'Quantity (t)', chg: 'Change', monthly: 'Monthly value (million USD)', month: 'Month', vsYear: 'vs. the previous 12 months', vsYear1: 'vs. same month last year', mapLink: 'See on the map', usd: 'USD',
      esrNote: 'Source: USDA FAS, Export Sales Reporting (weekly export sales report, released on Thursdays). Metric tons except cotton (bales). Outstanding sales are sales already made but not yet shipped. Totals add up the published destinations; the EU aggregate counts as one destination. Figures are reported by companies to USDA and may be revised.',
      gatsNote: 'Source: USDA FAS GATS, using U.S. Census Bureau trade data. U.S. trade with each country only (not flows between third countries). Current-dollar values; quantity is shown only when the Census measures it in kilograms. The last two months may be revised. Tariff (HS) codes group products approximately; for example “Dairy” combines chapters 0401-0406.',
      src: 'Source: USDA FAS (public U.S. Government data)' },
    fr: { title: 'Exportations américaines', sub: 'Qui achète les récoltes et la viande des États-Unis : ventes à l’exportation hebdomadaires (USDA FAS) et commerce mensuel par pays (USDA FAS, données du Census Bureau). Chiffres officiels dans leur unité d’origine.',
      tabEsr: 'Ventes hebdomadaires', tabGats: 'Commerce mensuel', product: 'Produit', flow: 'Flux', ex: 'Exportations des États-Unis', im: 'Importations des États-Unis', period: 'Période', p12: '12 derniers mois', p1: 'Dernier mois',
      weekEnd: 'Semaine au', my: 'Campagne', acc: 'Exporté sur la campagne', out: 'Ventes en attente d’expédition', com: 'Engagement total', net: 'Ventes nettes de la semaine', vsPrev: 'par rapport à la même semaine de la campagne précédente',
      chartAcc: 'Exportations cumulées par semaine de campagne', cur: 'Campagne en cours', prev: 'Campagne précédente', weekN: 'semaine de campagne',
      country: 'Pays', unknown: 'Destination non attribuée', others: 'Autres', total: 'Total', wk: 'Expédié cette semaine', mt: 't', kt: 'kt', mtt: 'Mt', bales: 'balles', noData: 'Pas de données.',
      value: 'Valeur (USD)', qty: 'Quantité (t)', chg: 'Variation', monthly: 'Valeur mensuelle (millions d’USD)', month: 'Mois', vsYear: 'par rapport aux 12 mois précédents', vsYear1: 'par rapport au même mois de l’an dernier', mapLink: 'Voir sur la carte', usd: 'USD',
      esrNote: 'Source : USDA FAS, Export Sales Reporting (rapport hebdomadaire, publié le jeudi). Tonnes métriques sauf le coton (balles). Les ventes en attente sont des ventes conclues mais pas encore expédiées. Les totaux additionnent les destinations publiées ; l’agrégat UE compte comme une seule destination. Chiffres déclarés par les entreprises à l’USDA, susceptibles de révision.',
      gatsNote: 'Source : USDA FAS GATS, à partir des données commerciales du Census Bureau. Commerce des États-Unis avec chaque pays uniquement (pas les flux entre pays tiers). Valeurs en dollars courants ; la quantité n’apparaît que lorsque le Census la mesure en kilos. Les deux derniers mois peuvent être révisés. Les codes tarifaires (SH) regroupent les produits de façon approximative ; par exemple « Produits laitiers » réunit les chapitres 0401-0406.',
      src: 'Source : USDA FAS (données publiques du gouvernement américain)' },
    it: { title: 'Esportazioni USA', sub: 'Chi compra i raccolti e la carne degli Stati Uniti: vendite all’esportazione settimanali (USDA FAS) e commercio mensile per paese (USDA FAS, dati del Census Bureau). Cifre ufficiali nell’unità originale.',
      tabEsr: 'Vendite settimanali', tabGats: 'Commercio mensile', product: 'Prodotto', flow: 'Flusso', ex: 'Esportazioni USA', im: 'Importazioni USA', period: 'Periodo', p12: 'Ultimi 12 mesi', p1: 'Ultimo mese',
      weekEnd: 'Settimana al', my: 'Campagna', acc: 'Esportato nella campagna', out: 'Vendite in attesa di spedizione', com: 'Impegno totale', net: 'Vendite nette della settimana', vsPrev: 'rispetto alla stessa settimana della campagna precedente',
      chartAcc: 'Esportazioni cumulate per settimana di campagna', cur: 'Campagna in corso', prev: 'Campagna precedente', weekN: 'settimana di campagna',
      country: 'Paese', unknown: 'Destinazione non assegnata', others: 'Altri', total: 'Totale', wk: 'Spedito nella settimana', mt: 't', kt: 'kt', mtt: 'Mt', bales: 'balle', noData: 'Nessun dato.',
      value: 'Valore (USD)', qty: 'Quantità (t)', chg: 'Variazione', monthly: 'Valore mensile (milioni di USD)', month: 'Mese', vsYear: 'rispetto ai 12 mesi precedenti', vsYear1: 'rispetto allo stesso mese dell’anno scorso', mapLink: 'Vedi sulla mappa', usd: 'USD',
      esrNote: 'Fonte: USDA FAS, Export Sales Reporting (rapporto settimanale, pubblicato il giovedì). Tonnellate metriche, tranne il cotone (balle). Le vendite in sospeso sono vendite concluse e non ancora spedite. I totali sommano le destinazioni pubblicate; l’aggregato UE conta come un’unica destinazione. Cifre dichiarate dalle imprese all’USDA, soggette a revisione.',
      gatsNote: 'Fonte: USDA FAS GATS, con dati commerciali del Census Bureau. Solo il commercio degli Stati Uniti con ciascun paese (non i flussi tra paesi terzi). Valori in dollari correnti; la quantità compare solo quando il Census la misura in chilogrammi. Gli ultimi due mesi possono essere rivisti. I codici tariffari (SA) raggruppano i prodotti in modo approssimativo; ad esempio «Latticini» riunisce i capitoli 0401-0406.',
      src: 'Fonte: USDA FAS (dati pubblici del governo USA)' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tr() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { maximumFractionDigits: d === undefined ? 0 : d, minimumFractionDigits: d || 0 }); } catch (e) { return String(Math.round(v)); } }
  function tons(v, t) { var a = Math.abs(v); return a >= 1e6 ? nf(v / 1e6, 2) + ' ' + t.mtt : a >= 1e3 ? nf(v / 1e3, 1) + ' ' + t.kt : nf(v) + ' ' + t.mt; }
  function usd(v) { var a = Math.abs(v); return a >= 1e9 ? nf(v / 1e9, 2) + ' Md $' : a >= 1e6 ? nf(v / 1e6, 1) + ' M$' : nf(v / 1e3, 0) + ' k$'; }
  function cname(i2, fallback) { if (!i2) return fallback; if (i2 === 'EU') return { es: 'Unión Europea', en: 'European Union', fr: 'Union européenne', it: 'Unione europea' }[lang()]; try { return new Intl.DisplayNames([lang()], { type: 'region' }).of(i2) || fallback; } catch (e) { return fallback; } }
  function pct(a, b) { return b > 0 ? (a - b) / b * 100 : null; }
  function chgHtml(p) { if (p === null || !isFinite(p)) return '<span style="color:var(--text-faint)">—</span>'; return '<b style="color:' + (p > 0 ? '#2e7d4f' : p < 0 ? '#b3402a' : 'inherit') + '">' + (p > 0 ? '+' : p < 0 ? '−' : '') + nf(Math.abs(p), 1) + ' %</b>'; }
  function unitOf(c, t) { return /Bales/i.test(c.unit) ? t.bales : t.mt; }
  function qty(v, c, t) { return /Bales/i.test(c.unit) ? nf(v) + ' ' + t.bales : tons(v, t); }
  function th(s, right) { return '<th style="padding:10px 6px;font-size:10.5px;letter-spacing:.4px;text-align:' + (right ? 'right' : 'left') + '">' + esc(s).toUpperCase() + '</th>'; }
  function td(s, right, b) { return '<td style="padding:9px 6px;text-align:' + (right ? 'right' : 'left') + (b ? ';font-weight:600' : '') + '">' + s + '</td>'; }

  function lineChart(series, labels, fmt) {
    var W = 720, H = 240, L = 54, R = 12, Tp = 12, Bt = 28, max = 0, n = 0;
    series.forEach(function (s) { s.v.forEach(function (v) { if (v > max) max = v; }); if (s.v.length > n) n = s.v.length; });
    if (!n || !max) return '';
    var step = Math.pow(10, Math.floor(Math.log10(max))), nice = Math.ceil(max / step) * step; if (nice / step > 5) nice = Math.ceil(max / (step * 2)) * step * 2;
    var x = function (i) { return L + (W - L - R) * (n > 1 ? i / (n - 1) : 0); }, y = function (v) { return Tp + (H - Tp - Bt) * (1 - v / nice); };
    var g = '';
    for (var k = 0; k <= 4; k++) { var vv = nice * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(vv) + '" y2="' + y(vv) + '" stroke="var(--border)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (y(vv) + 4) + '" font-size="11" text-anchor="end" fill="var(--text-faint)">' + esc(fmt(vv)) + '</text>'; }
    var paths = series.map(function (s) { var d = s.v.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' '); return '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.2" stroke-linejoin="round"/>'; }).join('');
    var xl = ''; [0, Math.floor((n - 1) / 2), n - 1].forEach(function (i) { if (labels[i] !== undefined) xl += '<text x="' + x(i) + '" y="' + (H - 8) + '" font-size="11" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" fill="var(--text-faint)">' + esc(labels[i]) + '</text>'; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img">' + g + paths + xl + '</svg>';
  }
  function barChart(vals, labels, fmt, color) {
    var W = 720, H = 220, L = 54, R = 8, Tp = 10, Bt = 26, max = Math.max.apply(null, vals.concat([1])), n = vals.length;
    var step = Math.pow(10, Math.floor(Math.log10(max))), nice = Math.ceil(max / step) * step; if (nice / step > 5) nice = Math.ceil(max / (step * 2)) * step * 2;
    var bw = (W - L - R) / n, y = function (v) { return Tp + (H - Tp - Bt) * (1 - v / nice); }, g = '';
    for (var k = 0; k <= 4; k++) { var vv = nice * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(vv) + '" y2="' + y(vv) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (y(vv) + 4) + '" font-size="11" text-anchor="end" fill="var(--text-faint)">' + esc(fmt(vv)) + '</text>'; }
    var bars = vals.map(function (v, i) { return '<rect x="' + (L + i * bw + 1.5).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + Math.max(1, bw - 3).toFixed(1) + '" height="' + Math.max(0, (H - Bt) - y(v)).toFixed(1) + '" rx="2" fill="' + color + '"><title>' + esc(labels[i] + ': ' + fmt(v)) + '</title></rect>'; }).join('');
    var xl = [0, Math.floor((n - 1) / 2), n - 1].map(function (i) { return '<text x="' + (L + i * bw + bw / 2) + '" y="' + (H - 8) + '" font-size="11" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" fill="var(--text-faint)">' + esc(labels[i]) + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img">' + g + bars + xl + '</svg>';
  }
  function card(label, value, sub) { return '<div class="di-card" style="padding:14px 16px;flex:1 1 200px;min-width:180px"><div style="font-size:11px;letter-spacing:.4px;color:var(--text-faint);font-weight:700">' + esc(label).toUpperCase() + '</div><div style="font-size:24px;font-weight:700;margin:4px 0 2px;font-family:\'Source Serif 4\',serif">' + value + '</div><div style="font-size:12.5px">' + (sub || '') + '</div></div>'; }

  function renderEsr(t) {
    if (!ESR) return '<p class="di-movers-hint">' + t.noData + '</p>';
    var cs = ESR.commodities, c = cs.filter(function (x) { return x.code === SEL.code; })[0] || cs[0]; SEL.code = c.code;
    var names = CN[lang()] || CN.es;
    var opts = cs.map(function (x) { return '<option value="' + x.code + '"' + (x.code === c.code ? ' selected' : '') + '>' + esc(names[x.code] || x.name) + '</option>'; }).join('');
    var tot = c.totals, ps = c.prevSameWeek, com = tot.acc + tot.out;
    var cards = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0">' +
      card(t.acc, qty(tot.acc, c, t), ps ? chgHtml(pct(tot.acc, ps.acc)) + ' <span style="color:var(--text-faint)">' + esc(t.vsPrev) + '</span>' : '') +
      card(t.out, qty(tot.out, c, t), ps ? chgHtml(pct(tot.out, ps.out)) + ' <span style="color:var(--text-faint)">' + esc(t.vsPrev) + '</span>' : '') +
      card(t.com, qty(com, c, t), ps ? chgHtml(pct(com, ps.acc + ps.out)) + ' <span style="color:var(--text-faint)">' + esc(t.vsPrev) + '</span>' : '') +
      card(t.net, qty(tot.net, c, t), '<span style="color:var(--text-faint)">' + esc(t.wk) + ': ' + qty(tot.wk, c, t) + '</span>') + '</div>';
    var cur = c.weekly.map(function (w) { return w.acc; }), pr = c.weeklyPrev.map(function (w) { return w.acc; });
    var isB = /Bales/i.test(c.unit), fmt = function (v) { return isB ? nf(v / 1e6, 1) + ' M' : (v >= 1e6 ? nf(v / 1e6, 1) + ' Mt' : nf(v / 1e3, 0) + ' kt'); };
    var chart = '<div class="di-card" style="padding:14px 16px"><div style="font-weight:600;margin-bottom:6px">' + esc(t.chartAcc) + '</div>' +
      '<div style="display:flex;gap:16px;font-size:12.5px;margin-bottom:6px"><span><span style="display:inline-block;width:14px;height:3px;background:' + C1 + ';vertical-align:middle;margin-right:6px"></span>' + esc(t.cur) + ' (' + esc(c.my) + ')</span><span><span style="display:inline-block;width:14px;height:3px;background:' + C2 + ';vertical-align:middle;margin-right:6px"></span>' + esc(t.prev) + '</span></div>' +
      lineChart([{ v: pr, color: C2 }, { v: cur, color: C1 }], c.weekly.map(function (w, i) { return '#' + (i + 1); }), fmt) +
      '<div style="font-size:11.5px;color:var(--text-faint);text-align:right">' + esc(t.weekN) + '</div></div>';
    var rows = c.countries.slice(), tail = null;
    var top = rows.filter(function (r) { return r.i2 || r.c !== 9990; }).slice(0, SEL.top);
    var unk = rows.filter(function (r) { return r.c === 9990; })[0];
    var table = '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:14px"><tr>' + th(t.country) + th(t.acc, 1) + th(t.out, 1) + th(t.com, 1) + th(t.net, 1) + '</tr>' +
      top.map(function (r) { return '<tr style="border-top:1px solid var(--border)">' + td(esc(cname(r.i2, r.n)), 0, 1) + td(qty(r.acc, c, t), 1) + td(qty(r.out, c, t), 1) + td(qty(r.acc + r.out, c, t), 1) + td(qty(r.net, c, t), 1) + '</tr>'; }).join('') +
      (unk ? '<tr style="border-top:1px solid var(--border)">' + td('<span style="color:var(--text-faint)">' + esc(t.unknown) + '</span>', 0) + td(qty(unk.acc, c, t), 1) + td(qty(unk.out, c, t), 1) + td(qty(unk.acc + unk.out, c, t), 1) + td(qty(unk.net, c, t), 1) + '</tr>' : '') +
      '<tr style="border-top:2px solid var(--border);font-weight:700">' + td(esc(t.total), 0, 1) + td(qty(tot.acc, c, t), 1, 1) + td(qty(tot.out, c, t), 1, 1) + td(qty(com, c, t), 1, 1) + td(qty(tot.net, c, t), 1, 1) + '</tr></table></div>';
    return '<label style="font-size:13px">' + esc(t.product) + '<br><select id="ex-sel-code" class="di-compare-select">' + opts + '</select></label>' +
      '<div style="margin-top:8px;font-size:13px;color:var(--text-faint)">' + esc(t.weekEnd) + ' ' + esc(c.weekEnding) + ' · ' + esc(t.my) + ' ' + esc(c.my) + '</div>' + cards + chart + table +
      '<p class="di-info-api-notice" style="margin:14px 0 6px">' + esc(t.esrNote) + '</p><p class="di-movers-hint"><a href="mapa.html?layer=buyers&code=' + c.code + '">' + esc(t.mapLink) + ' →</a></p>';
  }

  function gatsSeries(flow, group) {
    var g = (GATS[flow] || {})[group] || {}, months = GATS.months, tot = months.map(function () { return 0; });
    Object.keys(g).forEach(function (p) { months.forEach(function (m, i) { var a = g[p][m]; if (a) tot[i] += a[0]; }); });
    return tot;
  }
  function renderGats(t) {
    if (!GATS) return '<p class="di-movers-hint">' + t.noData + '</p>';
    var groups = GATS.groups, gn = GN[lang()] || GN.es;
    if (groups.indexOf(SEL.group) < 0) SEL.group = groups[0];
    var opts = groups.map(function (g) { return '<option value="' + g + '"' + (g === SEL.group ? ' selected' : '') + '>' + esc(gn[g] || g) + '</option>'; }).join('');
    var months = GATS.months, n = months.length, last = months[n - 1];
    var fopts = ['ex', 'im'].map(function (f) { return '<option value="' + f + '"' + (f === SEL.flow ? ' selected' : '') + '>' + esc(t[f]) + '</option>'; }).join('');
    var popts = ['12', '1'].map(function (p) { return '<option value="' + p + '"' + (p === SEL.period ? ' selected' : '') + '>' + esc(t['p' + p]) + '</option>'; }).join('');
    var series = gatsSeries(SEL.flow, SEL.group);
    var lab = months.map(function (m) { return m.slice(0, 4) + '-' + m.slice(4); });
    var cur = SEL.period === '12' ? months.slice(-12) : [last];
    var prev = SEL.period === '12' ? months.slice(-24, -12) : [months[n - 13]].filter(Boolean);
    var g = (GATS[SEL.flow] || {})[SEL.group] || {}, rows = [];
    Object.keys(g).forEach(function (p) {
      var v = 0, q = 0, qk = true, pv = 0, has = false;
      cur.forEach(function (m) { var a = g[p][m]; if (a) { v += a[0]; if (a[1] === null) qk = false; else q += a[1]; has = true; } });
      prev.forEach(function (m) { var a = g[p][m]; if (a) pv += a[0]; });
      if (has && v > 0) { var pi = GATS.partners[p] || { n: p, i2: null }; rows.push({ n: pi.n, i2: pi.i2, v: v, q: qk ? q : null, pv: pv, prevOk: prev.length === cur.length }); }
    });
    rows.sort(function (a, b) { return b.v - a.v; });
    var total = rows.reduce(function (s, r) { return s + r.v; }, 0), ptotal = rows.reduce(function (s, r) { return s + r.pv; }, 0), hasQ = rows.some(function (r) { return r.q !== null; });
    var chart = '<div class="di-card" style="padding:14px 16px;margin-top:14px"><div style="font-weight:600;margin-bottom:6px">' + esc(t.monthly) + '</div>' + barChart(series.map(function (v) { return v / 1e6; }), lab, function (v) { return nf(v, v < 10 ? 1 : 0); }, SEL.flow === 'ex' ? C1 : '#a05a2c') + '</div>';
    var vs = SEL.period === '12' ? t.vsYear : t.vsYear1;
    var table = rows.length ? '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:14px"><tr>' + th(t.country) + th(t.value, 1) + (hasQ ? th(t.qty, 1) : '') + th('%', 1) + th(t.chg + ' ' + vs, 1) + '</tr>' +
      rows.slice(0, SEL.top).map(function (r) { return '<tr style="border-top:1px solid var(--border)">' + td(esc(cname(r.i2, r.n)), 0, 1) + td(usd(r.v), 1) + (hasQ ? td(r.q !== null ? tons(r.q, t) : '—', 1) : '') + td(nf(r.v / total * 100, 1) + ' %', 1) + td(r.prevOk ? chgHtml(pct(r.v, r.pv)) : '—', 1) + '</tr>'; }).join('') +
      '<tr style="border-top:2px solid var(--border);font-weight:700">' + td(esc(t.total), 0, 1) + td(usd(total), 1, 1) + (hasQ ? td('', 1) : '') + td('100 %', 1, 1) + td(chgHtml(pct(total, ptotal)), 1) + '</tr></table></div>' : '<p class="di-movers-hint">' + t.noData + '</p>';
    return '<div style="display:flex;gap:16px;flex-wrap:wrap"><label style="font-size:13px">' + esc(t.flow) + '<br><select id="ex-sel-flow" class="di-compare-select">' + fopts + '</select></label><label style="font-size:13px">' + esc(t.product) + '<br><select id="ex-sel-group" class="di-compare-select">' + opts + '</select></label><label style="font-size:13px">' + esc(t.period) + '<br><select id="ex-sel-period" class="di-compare-select">' + popts + '</select></label></div>' +
      '<div style="margin-top:8px;font-size:13px;color:var(--text-faint)">' + esc(t.month) + ': ' + esc(last.slice(0, 4) + '-' + last.slice(4)) + '</div>' + chart + table +
      '<p class="di-info-api-notice" style="margin:14px 0 6px">' + esc(t.gatsNote) + '</p><p class="di-movers-hint"><a href="mapa.html?layer=trade&flow=' + SEL.flow + '&group=' + SEL.group + '">' + esc(t.mapLink) + ' →</a></p>';
  }

  function render() {
    var t = tr();
    document.title = 'Dehesa Index — ' + t.title;
    document.getElementById('pg-h1').textContent = t.title;
    document.getElementById('pg-sub').textContent = t.sub;
    var tab = function (k, label) { return '<button type="button" class="di-link-btn" data-tab="' + k + '" aria-pressed="' + (SEL.tab === k) + '" style="' + (SEL.tab === k ? 'font-weight:700;text-decoration:underline;' : '') + 'margin-right:18px;font-size:15px">' + esc(label) + '</button>'; };
    document.getElementById('ex-body').innerHTML = '<div style="margin-bottom:14px">' + (ESR ? tab('esr', t.tabEsr) : '') + (GATS ? tab('gats', t.tabGats) : '') + '</div>' + (SEL.tab === 'esr' ? renderEsr(t) : renderGats(t)) + '<p class="di-movers-hint" style="margin-top:6px">' + esc(t.src) + '</p>';
    var q = function (s) { return document.getElementById('ex-body').querySelectorAll(s); };
    Array.prototype.forEach.call(q('[data-tab]'), function (b) { b.onclick = function () { SEL.tab = b.getAttribute('data-tab'); render(); }; });
    var e = document.getElementById('ex-sel-code'); if (e) e.onchange = function () { SEL.code = parseInt(e.value, 10); render(); };
    e = document.getElementById('ex-sel-flow'); if (e) e.onchange = function () { SEL.flow = e.value; render(); };
    e = document.getElementById('ex-sel-group'); if (e) e.onchange = function () { SEL.group = e.value; render(); };
    e = document.getElementById('ex-sel-period'); if (e) e.onchange = function () { SEL.period = e.value; render(); };
  }
  window.DehesaShared.init('informacion');
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  Promise.all([
    fetch('data/export-sales.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch('data/gats.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]).then(function (a) {
    ESR = a[0] && a[0].commodities && a[0].commodities.length ? a[0] : null;
    GATS = a[1] && a[1].months && a[1].months.length > 1 ? a[1] : null;
    var q = new URLSearchParams(window.location.search);
    if (q.get('tab') === 'gats' && GATS) SEL.tab = 'gats'; else if (!ESR && GATS) SEL.tab = 'gats';
    if (q.get('code')) SEL.code = parseInt(q.get('code'), 10); if (q.get('flow')) SEL.flow = q.get('flow'); if (q.get('group')) SEL.group = q.get('group');
    render();
  });
})();
