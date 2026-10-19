/* Dehesa Index — Coste de una receta: el comprador define cuantos kg de cada ingrediente lleva una tonelada de su producto final y se calcula el
   coste con los precios oficiales de data/api/v1, hoy y mes a mes. Todo en el navegador, receta guardada en localStorage. Sin previsiones:
   solo ingredientes con precio, mismos moneda y peso; los meses en que falta algun ingrediente no se calculan. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared, KEY = 'dehesaReceta';
  /* unidades de peso convertibles a tonelada metrica: unidades por tonelada */
  var PERT = { tonelada: 1, '100kg': 10, kg: 1000, lb: 2204.62262, ton_corta: 1.10231131, cwt: 22.0462262 };
  var T = {
    es: { h1: 'Coste de una receta', sub: 'Define la receta de tu producto y calcula cuánto cuesta con los precios oficiales de cada ingrediente, hoy y en los últimos tres años. Se calcula en tu navegador.',
      nm: 'Nombre de la receta', ph: 'Pienso de engorde', cur: 'Moneda', ing: 'Ingredientes', kg: 'kg por tonelada de producto', ser: 'Precio de referencia', add: 'Añadir ingrediente', addC: 'Añadir uno con mi propio precio', cname: 'Nombre', cprice: 'Tu precio por tonelada', oth: 'Otros costes por tonelada (envase, transporte, mano de obra…)', rm: 'Quitar',
      rt: 'Resultado', now: 'Coste por tonelada de producto', asof: 'último mes con todos los precios: {m}', yago: 'Hace 12 meses', chg: 'Variación a 12 meses', rng: 'Rango de los últimos 36 meses', na: 'sin dato',
      tc: ['Ingrediente', 'kg por t', 'Precio (último dato)', 'Precio por t', 'Coste por t', '% del coste'], tot: 'Total', custom: 'precio propio', oneT: 'Evolución del coste por tonelada', chart: 'Coste mensual de la receta',
      none: 'Añade al menos un ingrediente con cantidad para ver el coste.', gap: 'Faltan datos de algún ingrediente en estos meses; esos meses no se calculan ni se rellenan: {m}.', 
      mix: 'Solo se pueden mezclar precios de la misma moneda: cambia la moneda para ver otros ingredientes. No convertimos monedas.', print: 'Imprimir', exp: 'Descargar receta (JSON)', imp: 'Importar receta', csv: 'Descargar CSV', clr: 'Empezar de nuevo', curQ: 'Cambiar de moneda borra la receta actual (los precios de otra moneda no se pueden mezclar). ¿Continuar?', 
      ex: 'Cargar una receta de ejemplo inventada', exN: 'Receta de ejemplo (cantidades inventadas)', mem: 'Este navegador no deja guardar datos: la receta se pierde al cerrar la pestaña. Descarga la copia para no perderla.',
      bT: 'Cómo se calcula', b: ['Coste por tonelada = suma de (kg de cada ingrediente ÷ 1000 × su precio por tonelada) + otros costes. Los precios en otras unidades de peso (100 kg, libra, quintal…) se convierten a toneladas métricas.', 'Cada mes usa el precio mensual de la serie; en las semanales, la media del mes si hay datos hasta el día 22 o más tarde. Si a un ingrediente le falta un mes, ese mes no se calcula.', 'Los precios son referencias regionales de fuentes oficiales, no lo que pagas tú por tu calidad, entrega o volumen. Es una guía para negociar, no una previsión.', 'Solo aparecen precios por peso (no por volumen, bushel ni índices) y de series mensuales o semanales.'],
      lic: 'Fuentes y licencias', fin: 'Información de fuentes oficiales, no asesoramiento financiero.', load: 'Cargando…', fail: 'No se pudo cargar la lista de precios.', negL: 'Informe de negociación', cmpL: 'Comparar mis facturas' },
    en: { h1: 'Recipe cost', sub: 'Define your product’s recipe and calculate what it costs with the official prices of each ingredient, today and over the last three years. Calculated in your browser.',
      nm: 'Recipe name', ph: 'Fattening feed', cur: 'Currency', ing: 'Ingredients', kg: 'kg per tonne of product', ser: 'Reference price', add: 'Add ingredient', addC: 'Add one with my own price', cname: 'Name', cprice: 'Your price per tonne', oth: 'Other costs per tonne (packaging, transport, labour…)', rm: 'Remove',
      rt: 'Result', now: 'Cost per tonne of product', asof: 'latest month with all prices: {m}', yago: '12 months ago', chg: '12-month change', rng: 'Range over the last 36 months', na: 'no data',
      tc: ['Ingredient', 'kg per t', 'Price (latest data)', 'Price per t', 'Cost per t', '% of cost'], tot: 'Total', custom: 'own price', oneT: 'Cost per tonne over time', chart: 'Monthly recipe cost',
      none: 'Add at least one ingredient with a quantity to see the cost.', gap: 'Some ingredient has no data in these months; those months are not calculated or filled: {m}.',
      mix: 'Only prices in the same currency can be mixed: change the currency to see other ingredients. We do not convert currencies.', print: 'Print', exp: 'Download recipe (JSON)', imp: 'Import recipe', csv: 'Download CSV', clr: 'Start again', curQ: 'Changing currency clears the current recipe (prices in other currencies cannot be mixed). Continue?',
      ex: 'Load a made-up example recipe', exN: 'Example recipe (made-up quantities)', mem: 'This browser does not allow saving data: the recipe is lost when the tab closes. Download the backup to keep it.',
      bT: 'How it is calculated', b: ['Cost per tonne = sum of (kg of each ingredient ÷ 1000 × its price per tonne) + other costs. Prices in other weight units (100 kg, pound, hundredweight…) are converted to metric tonnes.', 'Each month uses the series’ monthly price; for weekly series, the month’s average if there is data up to day 22 or later. If an ingredient lacks a month, that month is not calculated.', 'Prices are regional references from official sources, not what you pay for your quality, delivery or volume. It is a guide for negotiating, not a forecast.', 'Only prices by weight (not by volume, bushel or index) and from monthly or weekly series appear.'],
      lic: 'Sources and licences', fin: 'Information from official sources, not financial advice.', load: 'Loading…', fail: 'Could not load the price list.', negL: 'Negotiation report', cmpL: 'Compare my invoices' },
    fr: { h1: 'Coût d’une recette', sub: 'Définissez la recette de votre produit et calculez ce qu’il coûte avec les prix officiels de chaque ingrédient, aujourd’hui et sur trois ans. Calculé dans votre navigateur.',
      nm: 'Nom de la recette', ph: 'Aliment d’engraissement', cur: 'Monnaie', ing: 'Ingrédients', kg: 'kg par tonne de produit', ser: 'Prix de référence', add: 'Ajouter un ingrédient', addC: 'En ajouter un avec mon prix', cname: 'Nom', cprice: 'Votre prix par tonne', oth: 'Autres coûts par tonne (emballage, transport, main-d’œuvre…)', rm: 'Retirer',
      rt: 'Résultat', now: 'Coût par tonne de produit', asof: 'dernier mois avec tous les prix : {m}', yago: 'Il y a 12 mois', chg: 'Variation sur 12 mois', rng: 'Fourchette des 36 derniers mois', na: 'pas de donnée',
      tc: ['Ingrédient', 'kg par t', 'Prix (dernière donnée)', 'Prix par t', 'Coût par t', '% du coût'], tot: 'Total', custom: 'prix propre', oneT: 'Coût par tonne dans le temps', chart: 'Coût mensuel de la recette',
      none: 'Ajoutez au moins un ingrédient avec une quantité pour voir le coût.', gap: 'Il manque des données pour un ingrédient ces mois-ci ; ces mois ne sont ni calculés ni comblés : {m}.',
      mix: 'On ne peut mélanger que des prix de la même monnaie : changez la monnaie pour voir d’autres ingrédients. Nous ne convertissons pas les monnaies.', print: 'Imprimer', exp: 'Télécharger la recette (JSON)', imp: 'Importer une recette', csv: 'Télécharger le CSV', clr: 'Recommencer', curQ: 'Changer de monnaie efface la recette actuelle (on ne peut pas mélanger des prix de monnaies différentes). Continuer ?',
      ex: 'Charger une recette d’exemple fictive', exN: 'Recette d’exemple (quantités fictives)', mem: 'Ce navigateur ne permet pas d’enregistrer : la recette se perd à la fermeture de l’onglet. Téléchargez la copie pour la conserver.',
      bT: 'Comment c’est calculé', b: ['Coût par tonne = somme de (kg de chaque ingrédient ÷ 1000 × son prix par tonne) + autres coûts. Les prix dans d’autres unités de poids (100 kg, livre, quintal…) sont convertis en tonnes métriques.', 'Chaque mois utilise le prix mensuel de la série ; pour les séries hebdomadaires, la moyenne du mois s’il y a des données jusqu’au 22 ou plus tard. Si un ingrédient manque un mois, ce mois n’est pas calculé.', 'Les prix sont des références régionales de sources officielles, pas ce que vous payez pour votre qualité, livraison ou volume. C’est un repère pour négocier, pas une prévision.', 'Seuls apparaissent les prix au poids (pas au volume, boisseau ou indice) des séries mensuelles ou hebdomadaires.'],
      lic: 'Sources et licences', fin: 'Information issue de sources officielles, pas un conseil financier.', load: 'Chargement…', fail: 'Impossible de charger la liste des prix.', negL: 'Rapport de négociation', cmpL: 'Comparer mes factures' },
    it: { h1: 'Costo di una ricetta', sub: 'Definisci la ricetta del tuo prodotto e calcola quanto costa con i prezzi ufficiali di ogni ingrediente, oggi e negli ultimi tre anni. Calcolato nel tuo browser.',
      nm: 'Nome della ricetta', ph: 'Mangime da ingrasso', cur: 'Valuta', ing: 'Ingredienti', kg: 'kg per tonnellata di prodotto', ser: 'Prezzo di riferimento', add: 'Aggiungi ingrediente', addC: 'Aggiungine uno con il mio prezzo', cname: 'Nome', cprice: 'Il tuo prezzo per tonnellata', oth: 'Altri costi per tonnellata (imballaggio, trasporto, manodopera…)', rm: 'Rimuovi',
      rt: 'Risultato', now: 'Costo per tonnellata di prodotto', asof: 'ultimo mese con tutti i prezzi: {m}', yago: '12 mesi fa', chg: 'Variazione a 12 mesi', rng: 'Intervallo degli ultimi 36 mesi', na: 'nessun dato',
      tc: ['Ingrediente', 'kg per t', 'Prezzo (ultimo dato)', 'Prezzo per t', 'Costo per t', '% del costo'], tot: 'Totale', custom: 'prezzo proprio', oneT: 'Costo per tonnellata nel tempo', chart: 'Costo mensile della ricetta',
      none: 'Aggiungi almeno un ingrediente con una quantità per vedere il costo.', gap: 'Manca il dato di un ingrediente in questi mesi; quei mesi non vengono calcolati né riempiti: {m}.',
      mix: 'Si possono mescolare solo prezzi della stessa valuta: cambia valuta per vedere altri ingredienti. Non convertiamo le valute.', print: 'Stampa', exp: 'Scarica ricetta (JSON)', imp: 'Importa ricetta', csv: 'Scarica CSV', clr: 'Ricomincia', curQ: 'Cambiare valuta cancella la ricetta attuale (non si possono mescolare prezzi di valute diverse). Continuare?',
      ex: 'Carica una ricetta d’esempio inventata', exN: 'Ricetta d’esempio (quantità inventate)', mem: 'Questo browser non permette di salvare dati: la ricetta si perde alla chiusura della scheda. Scarica la copia per conservarla.',
      bT: 'Come si calcola', b: ['Costo per tonnellata = somma di (kg di ogni ingrediente ÷ 1000 × il suo prezzo per tonnellata) + altri costi. I prezzi in altre unità di peso (100 kg, libbra, quintale…) sono convertiti in tonnellate metriche.', 'Ogni mese usa il prezzo mensile della serie; per le settimanali, la media del mese se ci sono dati fino al 22 o dopo. Se a un ingrediente manca un mese, quel mese non viene calcolato.', 'I prezzi sono riferimenti regionali di fonti ufficiali, non quanto paghi tu per qualità, consegna o volume. È una guida per negoziare, non una previsione.', 'Compaiono solo prezzi al peso (non a volume, bushel o indici) e di serie mensili o settimanali.'],
      lic: 'Fonti e licenze', fin: 'Informazioni da fonti ufficiali, non consulenza finanziaria.', load: 'Caricamento…', fail: 'Impossibile caricare l’elenco dei prezzi.', negL: 'Rapporto di negoziazione', cmpL: 'Confronta le mie fatture' }
  };
  var IDX = null, FAILED = false, SER = {}, PENDING = {}, MEMONLY = false, R = { name: '', cur: 'EUR', other: '', items: [] };
  function UL(u) { return S.unitLabel ? S.unitLabel(u, lang()) : u; }
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n, d) { try { return Number(n).toLocaleString(lang(), { maximumFractionDigits: d == null ? 2 : d }); } catch (e) { return String(n); } }
  function nm(o, k) { return (o && (o[lang()] || o.es)) || k || ''; }
  function num(s) {
    s = String(s == null ? '' : s).trim().replace(/\s/g, '');
    var c = s.lastIndexOf(','), d = s.lastIndexOf('.');
    if (c > -1 && d > -1) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');   /* 1.234,56 (ES/FR/IT) o 1,234.56 (EN): gana el ultimo separador */
    else if (d > -1 && s.indexOf('.') !== d) s = s.replace(/\./g, '');                              /* 1.234.567 */
    else if (c > -1 && s.indexOf(',') !== c) s = s.replace(/,/g, '');                                /* 1,234,567 */
    else s = s.replace(',', '.');                                                                     /* 12,5 = 12.5 (una sola coma es decimal) */
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  function sinfo(id) { return IDX && IDX.series.filter(function (x) { return x.id === id; })[0]; }
  function usable(s) { return PERT[s.unit] && s.currency !== 'INDEX' && (s.frequency === 'monthly' || s.frequency === 'weekly'); }
  function label(s) { return nm(s.name, s.product) + ' — ' + (nm(s.place) || s.region); }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(R)); MEMONLY = false; } catch (e) { MEMONLY = true; } }
  function restore() { try { var r = localStorage.getItem(KEY); if (r) setR(JSON.parse(r)); } catch (e) { MEMONLY = true; } }
  function setR(o) {
    var cur = o && /^[A-Z]{3}$/.test(o.cur) ? o.cur : 'EUR', items = [];
    ((o && o.items) || []).forEach(function (x) {
      var kg = typeof x.kg === 'number' ? x.kg : num(x.kg); if (!(kg >= 0) || !isFinite(kg)) kg = 0;
      if (x.s) { var s = sinfo(x.s); if (s && usable(s) && s.currency === cur) items.push({ s: x.s, kg: kg }); }
      else if (x.c) { var pr = typeof x.p === 'number' ? x.p : num(x.p); items.push({ c: String(x.c).slice(0, 40), p: isFinite(pr) && pr >= 0 ? pr : 0, kg: kg }); }
    });
    R = { name: String((o && o.name) || '').slice(0, 60), cur: cur, other: (o && o.other != null) ? String(o.other) : '', items: items };
  }
  function need() { R.items.forEach(function (x) { if (!x.s || SER[x.s] || PENDING[x.s]) return; PENDING[x.s] = 1; fetch(S.sitePath('data/api/v1/series/' + x.s + '.json')).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { SER[x.s] = d; }).catch(function () { SER[x.s] = { failed: true, points: [] }; }).then(function () { delete PENDING[x.s]; render(); }); }); }
  function pending() { return Object.keys(PENDING).length > 0; }
  /* serie -> { 'AAAA-MM': valor } con la misma regla que las cestas */
  function monthly(s) {
    var o = {}, g = {};
    if (!s || s.failed) return o;
    if (s.frequency === 'monthly') { s.points.forEach(function (p) { if (/^\d{4}-\d{2}/.test(p[0])) o[p[0].slice(0, 7)] = p[1]; }); return o; }
    s.points.forEach(function (p) { var m = /^(\d{4}-\d{2})-(\d{2})$/.exec(p[0]); if (!m) return; var a = g[m[1]] || (g[m[1]] = { v: [], d: 0 }); a.v.push(p[1]); if (+m[2] > a.d) a.d = +m[2]; });
    Object.keys(g).forEach(function (k) { if (g[k].d >= 22) { var sum = 0; g[k].v.forEach(function (x) { sum += x; }); o[k] = sum / g[k].v.length; } });
    return o;
  }
  function calc() {
    var its = R.items.filter(function (x) { return x.kg > 0 && (x.c || (SER[x.s] && !SER[x.s].failed)); }), other = num(R.other); if (!isFinite(other)) other = 0;
    if (!its.length) return null;
    var M = its.map(function (x) { return x.s ? monthly(SER[x.s]) : null; }), months = null;
    its.forEach(function (x, i) { if (!M[i]) return; var ks = Object.keys(M[i]); months = months === null ? ks : months.filter(function (k) { return M[i][k] != null; }); });
    var all = {}, hasSer = M.some(function (m) { return m; });
    if (!hasSer) return { rows: rowsOf(its, other), months: [], series: [] };
    months.sort();
    var series = months.map(function (mo) { var c = other; its.forEach(function (x, i) { c += x.kg / 1000 * (x.s ? M[i][mo] * PERT[sinfo(x.s).unit] : x.p); }); return [mo, c]; });
    var missing = []; if (series.length) { var all2 = {}; its.forEach(function (x, i) { if (M[i]) Object.keys(M[i]).forEach(function (k) { all2[k] = 1; }); }); var first = series[0][0]; Object.keys(all2).sort().forEach(function (k) { if (k >= first && months.indexOf(k) < 0) missing.push(k); }); }
    return { rows: rowsOf(its, other), months: months, series: series, missing: missing, other: other };
  }
  function rowsOf(its, other) {
    var rows = its.map(function (x) { if (x.c) return { n: x.c, kg: x.kg, custom: true, pt: x.p, cost: x.kg / 1000 * x.p }; var s = SER[x.s], inf = sinfo(x.s), last = s.points[s.points.length - 1], pt = last[1] * PERT[inf.unit]; return { n: label(inf), kg: x.kg, last: last, unit: inf.unit, cur: inf.currency, pt: pt, cost: x.kg / 1000 * pt, inf: inf, s: s }; });
    var tot = other; rows.forEach(function (r) { tot += r.cost; }); rows.tot = tot; rows.other = other; return rows;
  }
  function th(c) { return '<th style="padding:6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600">' + esc(c) + '</th>'; }
  function td(x, st) { return '<td style="padding:6px;border-top:1px solid var(--border);' + (st || '') + '">' + x + '</td>'; }
  function chart(w, ser) {
    var v = ser.slice(-36); if (v.length < 3) return '';
    var W = 560, H = 160, P = 6, mn = Infinity, mx = -Infinity; v.forEach(function (p) { if (p[1] < mn) mn = p[1]; if (p[1] > mx) mx = p[1]; }); if (mx === mn) { mx += 1; mn -= 1; }
    var idx = function (m) { return +m.slice(0, 4) * 12 + +m.slice(5, 7); }, a = idx(v[0][0]), b = idx(v[v.length - 1][0]);
    var xy = v.map(function (p) { return [P + (W - 2 * P) * (idx(p[0]) - a) / Math.max(1, b - a), H - P - (H - 2 * P) * (p[1] - mn) / (mx - mn)]; }), d = '';
    xy.forEach(function (q, k) { d += (k && idx(v[k][0]) - idx(v[k - 1][0]) === 1 ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ' '; });
    var dots = xy.map(function (q, k) { return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2.2" fill="var(--accent,#2f6b3f)"><title>' + esc(v[k][0] + ' · ' + nf(v[k][1]) + ' ' + R.cur + '/t') + '</title></circle>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img" aria-label="' + esc(w.chart) + '"><path d="' + d + '" fill="none" stroke="var(--accent,#2f6b3f)" stroke-width="2" stroke-linejoin="round"/>' + dots + '</svg>' +
      '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-muted)"><span>' + esc(v[0][0]) + ' · ' + nf(v[0][1], 0) + '</span><span>' + esc(v[v.length - 1][0]) + ' · ' + nf(v[v.length - 1][1], 0) + ' ' + esc(R.cur) + '/t</span></div>';
  }
  function render() {
    var w = t(), root = document.getElementById('mr-body'); if (!root) return;
    document.getElementById('mr-h1').textContent = w.h1; document.getElementById('mr-sub').textContent = w.sub; document.title = w.h1 + ' | Dehesa Index';
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!IDX) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.load) + '</p>'; return; }
    need();
    var curs = {}; IDX.series.forEach(function (s) { if (usable(s)) curs[s.currency] = 1; }); var cl = Object.keys(curs).sort();
    var avail = IDX.series.filter(function (s) { return usable(s) && s.currency === R.cur; }).sort(function (a, b) { return label(a).localeCompare(label(b), lang()); });
    var inp = 'padding:7px;width:100%', h = '';
    if (MEMONLY) h += '<p class="di-movers-hint" style="color:#8f5f12">' + esc(w.mem) + '</p>';
    h += '<div class="di-card no-print" style="padding:14px;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))"><label style="display:grid;gap:4px;font-size:12.5px">' + esc(w.nm) + '<input id="mr-n" maxlength="60" placeholder="' + esc(w.ph) + '" value="' + esc(R.name) + '" style="' + inp + '"></label>' +
      '<label style="display:grid;gap:4px;font-size:12.5px">' + esc(w.cur) + '<select id="mr-c" style="' + inp + '">' + cl.map(function (c) { return '<option' + (c === R.cur ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label style="display:grid;gap:4px;font-size:12.5px">' + esc(w.oth) + ' (' + esc(R.cur) + ')<input id="mr-o" inputmode="decimal" value="' + esc(R.other) + '" style="' + inp + '"></label></div><p class="di-movers-hint">' + esc(w.mix) + '</p>';
    h += '<h2 style="margin:18px 0 6px;font-size:18px">' + esc(w.ing) + '</h2><div class="di-card" style="padding:8px 14px"><div id="mr-list" style="display:grid;gap:8px">' +
      R.items.map(function (x, i) { return '<div style="display:grid;gap:8px;grid-template-columns:minmax(0,3fr) minmax(90px,1fr) auto;align-items:end">' + (x.s ? '<label style="display:grid;gap:3px;font-size:12px">' + esc(w.ser) + '<select data-s="' + i + '" style="' + inp + '">' + avail.map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === x.s ? ' selected' : '') + '>' + esc(label(s)) + '</option>'; }).join('') + '</select></label>' :
        '<div style="display:grid;gap:8px;grid-template-columns:1fr 1fr"><label style="display:grid;gap:3px;font-size:12px">' + esc(w.cname) + '<input data-cn="' + i + '" maxlength="40" value="' + esc(x.c) + '" style="' + inp + '"></label><label style="display:grid;gap:3px;font-size:12px">' + esc(w.cprice) + '<input data-cp="' + i + '" inputmode="decimal" value="' + esc(x.p) + '" style="' + inp + '"></label></div>') +
        '<label style="display:grid;gap:3px;font-size:12px">' + esc(w.kg) + '<input data-k="' + i + '" inputmode="decimal" value="' + esc(x.kg || '') + '" style="' + inp + '"></label><button class="di-btn-sec no-print" data-rm="' + i + '">' + esc(w.rm) + '</button></div>'; }).join('') + '</div>' +
      '<p class="no-print" style="margin:10px 0 4px;display:flex;flex-wrap:wrap;gap:8px"><button class="di-btn-sec" id="mr-add">' + esc(w.add) + '</button><button class="di-btn-sec" id="mr-addc">' + esc(w.addC) + '</button>' + (R.items.length ? '<button class="di-btn-sec" id="mr-clr">' + esc(w.clr) + '</button>' : '<button class="di-btn-sec" id="mr-ex">' + esc(w.ex) + '</button>') + '</p></div>';
    var c = calc();
    h += '<h2 style="margin:22px 0 6px;font-size:18px">' + esc(w.rt) + '</h2>';
    if (!c) h += '<p class="di-emp-p">' + esc(w.none) + '</p>';
    else if (pending()) h += '<p class="di-movers-hint">' + esc(w.load) + '</p>';
    else {
      var rows = c.rows, last = c.series[c.series.length - 1], ya = null, k; if (last) { var ym = (+last[0].slice(0, 4) - 1) + last[0].slice(4); for (k = 0; k < c.series.length; k++) if (c.series[k][0] === ym) ya = c.series[k]; }
      var v36 = c.series.slice(-36), mn = Infinity, mx = -Infinity; v36.forEach(function (p) { if (p[1] < mn) mn = p[1]; if (p[1] > mx) mx = p[1]; });
      var chg = last && ya ? (last[1] / ya[1] - 1) * 100 : null, kp = function (a, b, s) { return '<div class="di-card" style="padding:10px 14px"><div style="font-size:12px;color:var(--text-muted)">' + esc(a) + '</div><div style="font-size:20px;font-weight:700">' + b + '</div>' + (s ? '<div style="font-size:12px;color:var(--text-muted)">' + esc(s) + '</div>' : '') + '</div>'; };
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px">' + (last ? kp(w.now, nf(last[1], 2) + ' ' + esc(R.cur) + '/t', w.asof.replace('{m}', last[0])) : kp(w.now, nf(rows.tot, 2) + ' ' + esc(R.cur) + '/t', '')) +
        kp(w.yago, ya ? nf(ya[1], 2) + ' ' + esc(R.cur) + '/t' : esc(w.na), ya ? ya[0] : '') + kp(w.chg, chg == null ? esc(w.na) : (chg > 0 ? '+' : '') + nf(chg, 1) + ' %', '') + kp(w.rng, v36.length ? nf(mn, 0) + ' – ' + nf(mx, 0) : esc(w.na), v36.length ? R.cur + '/t' : '') + '</div>';
      h += '<div class="di-card" style="padding:4px 14px;overflow-x:auto;margin-top:12px"><table data-no-rows style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>' + w.tc.map(th).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + td('<b>' + esc(r.n) + '</b>' + (r.custom ? ' <span style="color:var(--text-muted);font-size:11px">(' + esc(w.custom) + ')</span>' : '')) + td(nf(r.kg)) + td(r.custom ? '—' : nf(r.last[1]) + ' ' + esc(r.cur) + '/' + esc(UL(r.unit)) + ' <span style="color:var(--text-muted);font-size:11px">(' + esc(r.last[0]) + ')</span>') + td(nf(r.pt) + ' ' + esc(R.cur)) + td(nf(r.cost) + ' ' + esc(R.cur)) + td(rows.tot ? nf(r.cost / rows.tot * 100, 1) + ' %' : '') + '</tr>'; }).join('') +
        (rows.other ? '<tr>' + td(esc(w.oth.split(' (')[0])) + td('') + td('') + td('') + td(nf(rows.other) + ' ' + esc(R.cur)) + td(nf(rows.other / rows.tot * 100, 1) + ' %') + '</tr>' : '') + '<tr>' + td('<b>' + esc(w.tot) + '</b>') + td('') + td('') + td('') + td('<b>' + nf(rows.tot) + ' ' + esc(R.cur) + '/t</b>') + td('') + '</tr></tbody></table></div>';
      if (c.series.length > 2) h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.oneT) + '</h3><div class="di-card" style="padding:12px 14px">' + chart(w, c.series) + '</div>';
      if (c.missing && c.missing.length) h += '<p class="di-movers-hint">' + esc(w.gap.replace('{m}', c.missing.slice(-12).join(', '))) + '</p>';
      h += '<p class="no-print" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"><button class="di-btn-sec" id="mr-print">' + esc(w.print) + '</button><button class="di-btn-sec" id="mr-csv">' + esc(w.csv) + '</button><button class="di-btn-sec" id="mr-exp">' + esc(w.exp) + '</button><label class="di-btn-sec" style="cursor:pointer">' + esc(w.imp) + '<input type="file" id="mr-f" accept=".json" style="display:none"></label></p>';
      var seen = {}; h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.lic) + '</h3><ul class="di-emp-p" style="padding-left:18px">' + rows.filter(function (r) { return r.inf && !seen[r.inf.id] && (seen[r.inf.id] = 1); }).map(function (r) { return '<li>' + esc(r.n) + ': ' + esc(r.inf.sourceName) + ' · ' + esc(r.inf.license) + ' · ' + esc(String(r.inf.attribution || '').replace(/^Source:\s*/i, '')) + '</li>'; }).join('') + '</ul>';
    }
    h += '<h2 style="margin:24px 0 6px;font-size:16px">' + esc(w.bT) + '</h2><ul class="di-emp-p" style="padding-left:18px">' + w.b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="di-movers-hint">' + esc(w.fin) + '</p>' +
      '<p class="no-print"><a class="di-btn-sec" href="informe-negociacion.html">' + esc(w.negL) + '</a> <a class="di-btn-sec" href="comparador-facturas.html">' + esc(w.cmpL) + '</a></p>';
    root.innerHTML = h; bind(w);
  }
  function download(name, text, type) { try { var b = new Blob([text], { type: type }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); } catch (e) { } }
  function bind(w) {
    var $ = function (i) { return document.getElementById(i); }, q = function (s) { return document.querySelectorAll(s); };
    function each(sel, fn) { Array.prototype.forEach.call(q(sel), fn); }
    $('mr-n').oninput = function (e) { R.name = e.target.value.slice(0, 60); persist(); };
    $('mr-o').onchange = function (e) { R.other = e.target.value; persist(); render(); };
    $('mr-c').onchange = function (e) { var cur = e.target.value; if (R.items.length && !window.confirm(w.curQ)) { e.target.value = R.cur; return; } setR({ name: R.name, cur: cur, other: '', items: [] }); persist(); render(); };
    $('mr-add').onclick = function () { var a = IDX.series.filter(function (s) { return usable(s) && s.currency === R.cur; }); if (a.length) { var pick = a.filter(function (s) { return !R.items.some(function (x) { return x.s === s.id; }); })[0] || a[0]; R.items.push({ s: pick.id, kg: 0 }); persist(); render(); } };
    $('mr-addc').onclick = function () { R.items.push({ c: '', p: 0, kg: 0 }); persist(); render(); };
    each('[data-s]', function (e) { e.onchange = function () { R.items[+e.getAttribute('data-s')].s = e.value; persist(); render(); }; });
    each('[data-k]', function (e) { e.onchange = function () { var v = num(e.value); R.items[+e.getAttribute('data-k')].kg = isFinite(v) && v >= 0 ? v : 0; persist(); render(); }; });
    each('[data-cn]', function (e) { e.onchange = function () { R.items[+e.getAttribute('data-cn')].c = e.value.slice(0, 40) || '—'; persist(); render(); }; });
    each('[data-cp]', function (e) { e.onchange = function () { var v = num(e.value); R.items[+e.getAttribute('data-cp')].p = isFinite(v) && v >= 0 ? v : 0; persist(); render(); }; });
    each('[data-rm]', function (e) { e.onclick = function () { R.items.splice(+e.getAttribute('data-rm'), 1); persist(); render(); }; });
    if ($('mr-ex')) $('mr-ex').onclick = function () {
      var a = IDX.series.filter(function (s) { return usable(s) && s.currency === R.cur; }), by = function (p) { return a.filter(function (s) { return s.product === p; })[0]; }, ex = [['maiz', 600], ['harina_soja', 250], ['trigo', 100]].map(function (r) { var s = by(r[0]); return s ? { s: s.id, kg: r[1] } : null; }).filter(Boolean);
      if (!ex.length) ex = a.slice(0, 2).map(function (s, i) { return { s: s.id, kg: i ? 300 : 700 }; });
      setR({ name: w.exN, cur: R.cur, other: '20', items: ex }); persist(); render(); };
    if ($('mr-print')) $('mr-print').onclick = function () { window.print(); };
    if ($('mr-exp')) $('mr-exp').onclick = function () { download('receta-dehesa-index.json', JSON.stringify(R, null, 1), 'application/json'); };
    if ($('mr-csv')) $('mr-csv').onclick = function () { var c = calc(); if (!c) return; var rows = [['month', 'cost_per_tonne', 'currency']].concat(c.series.map(function (p) { return [p[0], Math.round(p[1] * 100) / 100, R.cur]; })); download('coste-receta-dehesa-index.csv', rows.map(function (r) { return r.join(';'); }).join('\n'), 'text/csv'); };
    if ($('mr-clr')) $('mr-clr').onclick = function () { R = { name: '', cur: R.cur, other: '', items: [] }; persist(); render(); };
    if ($('mr-f')) $('mr-f').onchange = function (e) { var f = e.target.files && e.target.files[0]; if (!f || !window.FileReader) return; var fr = new FileReader(); fr.onload = function () { try { setR(JSON.parse(String(fr.result))); persist(); render(); } catch (x) { } }; fr.readAsText(f); };
  }
  S.init('data');
  S.onLangChange = render;
  window.DehesaReceta = { _state: function () { return R; } };
  render();
  fetch(S.sitePath('data/api/v1/index.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { IDX = d; restore(); render(); }).catch(function () { FAILED = true; render(); });
})();
