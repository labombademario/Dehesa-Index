/* Dehesa Index — Comparador de facturas con el mercado. El usuario pega sus compras o ventas (fecha, cantidad, precio) y se comparan con
   el precio de mercado de una serie de la API publica (data/api/v1) en las MISMAS fechas y con las MISMAS cantidades.
   Todo se calcula en el navegador: no se envia ni se guarda nada. Sin dato de mercado en la fecha = la linea no entra. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: {
      mine: 'Guardar mis compras y compararlas con varios mercados',
      title: 'Comparador de facturas con el mercado', h1: 'Comparador de facturas con el mercado',
      sub: 'Pega tus compras o ventas y mira si pagaste o cobraste más o menos que el mercado en esas mismas fechas, con las mismas cantidades. Sirve para negociar con proveedores, justificar una liquidación o revisar una campaña.',
      privacy: 'Tus facturas no salen de este navegador: no se envían a ningún servidor ni se guardan. Si recargas la página, desaparecen.',
      s1: '1. Elige con qué comparar', series: 'Serie de mercado', mode: 'Qué comparas', buy: 'Compras (lo que pagaste)', sell: 'Ventas (lo que cobraste)',
      unitWarn: 'Escribe tus precios en {u}. Si tu factura está en otra unidad o moneda, conviértela antes: aquí no se convierte nada por ti.',
      s2: '2. Tus facturas', s2h: 'Una línea por factura: fecha, cantidad y precio unitario, separados por tabulador, punto y coma o coma. Puedes pegarlas desde Excel. Fechas: AAAA-MM-DD o DD/MM/AAAA. La cantidad es opcional (si falta, cuenta 1).',
      ph: '2026-03-12;24;268,5\n2026-04-02;30;271\n15/05/2026;18;262', btn: 'Comparar', ex: 'Cargar un ejemplo', exNote: 'Ejemplo con cifras inventadas, solo para ver cómo funciona.', file: 'Cargar fichero CSV', clear: 'Vaciar',
      s3: '3. Resultado', none: 'Pega al menos una factura con fecha y precio.', loadingS: 'Cargando la serie…', fail: 'No se pudo cargar la serie de mercado. Vuelve a intentarlo en unos minutos.',
      qty: 'Cantidad total', paid: 'Tu precio medio', rcv: 'Tu precio medio', mkt: 'Mercado en las mismas fechas', diff: 'Diferencia', total: 'En total', weighted: 'ponderado por cantidad',
      sB: 'Con {q} {u0} comparadas, pagaste de media {p} {u}, frente a {m} {u} del mercado en las mismas fechas: {d} {dir} (un {x} %). En total, {tdir} {t}.',
      sS: 'Con {q} {u0} comparadas, cobraste de media {p} {u}, frente a {m} {u} del mercado en las mismas fechas: {d} {dir} (un {x} %). En total, {tdir} {t}.',
      dirBuyUp: 'por encima', dirBuyDn: 'por debajo', dirSellUp: 'por encima', dirSellDn: 'por debajo', tBuyUp: 'pagaste de más', tBuyDn: 'pagaste de menos', tSellUp: 'cobraste de más', tSellDn: 'cobraste de menos', eq: 'igual que el mercado',
      cols: ['Fecha', 'Cantidad', 'Tu precio', 'Mercado', 'Dato del mercado', 'Diferencia'], skipped: '{n} línea(s) sin dato de mercado en esa fecha: no entran en la comparación.', bad: 'Línea {n} no reconocida: «{x}»',
      print: 'Imprimir o guardar en PDF', csv: 'Descargar resultado (CSV)', how: 'Cómo se calcula',
      howP: ['Para cada factura se toma el precio de mercado de su mismo mes (series mensuales), trimestre (trimestrales) o la última cotización de los 14 días anteriores (semanales y diarias). Sin dato, la línea no entra.', 'El precio de mercado medio se pondera por tus cantidades, igual que el tuyo, para que la comparación sea justa.', 'Esto no es asesoramiento financiero: la serie es un precio de referencia de una fuente oficial, no tu mercado exacto. Lee qué mide en la nota.'],
      src: 'Fuente', lic: 'Licencia', note: 'Qué mide la serie', report: 'Comparación de facturas', prepared: 'Preparado con Dehesa Index', neg: 'Informe de negociación de este producto',
      M: { us: 'EE. UU.', eu: 'UE', uk: 'Reino Unido', ca: 'Canadá' }, cta: '¿Quieres este análisis con tus datos de cada campaña y por proveedor? Cuéntanos cómo trabajas.', ctaB: 'Escríbenos'
    },
    en: {
      mine: 'Save my trades and compare them with several markets',
      title: 'Compare your invoices with the market', h1: 'Compare your invoices with the market',
      sub: 'Paste your purchases or sales and see whether you paid or received more or less than the market on those same dates, with the same quantities. Useful for negotiating with suppliers, justifying a settlement or reviewing a season.',
      privacy: 'Your invoices never leave this browser: they are not sent to any server or stored. If you reload the page, they are gone.',
      s1: '1. Choose what to compare with', series: 'Market series', mode: 'What you compare', buy: 'Purchases (what you paid)', sell: 'Sales (what you received)',
      unitWarn: 'Enter your prices in {u}. If your invoice uses another unit or currency, convert it first: nothing is converted for you here.',
      s2: '2. Your invoices', s2h: 'One line per invoice: date, quantity and unit price, separated by tab, semicolon or comma. You can paste from Excel. Dates: YYYY-MM-DD or DD/MM/YYYY. Quantity is optional (if missing it counts as 1).',
      ph: '2026-03-12;24;268.5\n2026-04-02;30;271\n15/05/2026;18;262', btn: 'Compare', ex: 'Load an example', exNote: 'Example with made-up figures, only to see how it works.', file: 'Load CSV file', clear: 'Clear',
      s3: '3. Result', none: 'Paste at least one invoice with a date and a price.', loadingS: 'Loading the series…', fail: 'Could not load the market series. Please try again in a few minutes.',
      qty: 'Total quantity', paid: 'Your average price', rcv: 'Your average price', mkt: 'Market on the same dates', diff: 'Difference', total: 'In total', weighted: 'weighted by quantity',
      sB: 'Over {q} {u0} compared, you paid {p} {u} on average, against {m} {u} for the market on the same dates: {d} {dir} (by {x}%). In total, {tdir} {t}.',
      sS: 'Over {q} {u0} compared, you received {p} {u} on average, against {m} {u} for the market on the same dates: {d} {dir} (by {x}%). In total, {tdir} {t}.',
      dirBuyUp: 'above', dirBuyDn: 'below', dirSellUp: 'above', dirSellDn: 'below', tBuyUp: 'you overpaid', tBuyDn: 'you paid less', tSellUp: 'you received more', tSellDn: 'you received less', eq: 'the same as the market',
      cols: ['Date', 'Quantity', 'Your price', 'Market', 'Market data point', 'Difference'], skipped: '{n} line(s) with no market data on that date: left out of the comparison.', bad: 'Line {n} not recognised: “{x}”',
      print: 'Print or save as PDF', csv: 'Download result (CSV)', how: 'How it is calculated',
      howP: ['For each invoice we take the market price of the same month (monthly series), quarter (quarterly) or the latest quotation in the previous 14 days (weekly and daily). With no data, the line is left out.', 'The average market price is weighted by your quantities, like yours, so the comparison is fair.', 'This is not financial advice: the series is a reference price from an official source, not your exact market. Read what it measures in the note.'],
      src: 'Source', lic: 'Licence', note: 'What the series measures', report: 'Invoice comparison', prepared: 'Prepared with Dehesa Index', neg: 'Negotiation report for this product',
      M: { us: 'US', eu: 'EU', uk: 'UK', ca: 'Canada' }, cta: 'Want this analysis with your data every season and by supplier? Tell us how you work.', ctaB: 'Contact us'
    },
    fr: {
      mine: 'Enregistrer mes achats et les comparer à plusieurs marchés',
      title: 'Comparer vos factures au marché', h1: 'Comparer vos factures au marché',
      sub: 'Collez vos achats ou ventes et voyez si vous avez payé ou reçu plus ou moins que le marché aux mêmes dates, avec les mêmes quantités. Utile pour négocier avec les fournisseurs, justifier un décompte ou revoir une campagne.',
      privacy: 'Vos factures ne quittent pas ce navigateur : elles ne sont envoyées à aucun serveur ni conservées. Si vous rechargez la page, elles disparaissent.',
      s1: '1. Choisissez la référence', series: 'Série de marché', mode: 'Ce que vous comparez', buy: 'Achats (ce que vous avez payé)', sell: 'Ventes (ce que vous avez reçu)',
      unitWarn: 'Saisissez vos prix en {u}. Si votre facture utilise une autre unité ou monnaie, convertissez-la d’abord : rien n’est converti pour vous ici.',
      s2: '2. Vos factures', s2h: 'Une ligne par facture : date, quantité et prix unitaire, séparés par tabulation, point-virgule ou virgule. Vous pouvez coller depuis Excel. Dates : AAAA-MM-JJ ou JJ/MM/AAAA. La quantité est facultative (à défaut, elle compte pour 1).',
      ph: '2026-03-12;24;268,5\n2026-04-02;30;271\n15/05/2026;18;262', btn: 'Comparer', ex: 'Charger un exemple', exNote: 'Exemple avec des chiffres inventés, juste pour voir comment ça marche.', file: 'Charger un fichier CSV', clear: 'Vider',
      s3: '3. Résultat', none: 'Collez au moins une facture avec une date et un prix.', loadingS: 'Chargement de la série…', fail: 'Impossible de charger la série de marché. Réessayez dans quelques minutes.',
      qty: 'Quantité totale', paid: 'Votre prix moyen', rcv: 'Votre prix moyen', mkt: 'Marché aux mêmes dates', diff: 'Écart', total: 'Au total', weighted: 'pondéré par la quantité',
      sB: 'Sur {q} {u0} comparées, vous avez payé {p} {u} en moyenne, contre {m} {u} pour le marché aux mêmes dates : {d} {dir} ({x} %). Au total, {tdir} {t}.',
      sS: 'Sur {q} {u0} comparées, vous avez reçu {p} {u} en moyenne, contre {m} {u} pour le marché aux mêmes dates : {d} {dir} ({x} %). Au total, {tdir} {t}.',
      dirBuyUp: 'au-dessus', dirBuyDn: 'en dessous', dirSellUp: 'au-dessus', dirSellDn: 'en dessous', tBuyUp: 'vous avez payé de trop', tBuyDn: 'vous avez payé de moins', tSellUp: 'vous avez reçu de plus', tSellDn: 'vous avez reçu de moins', eq: 'identique au marché',
      cols: ['Date', 'Quantité', 'Votre prix', 'Marché', 'Donnée du marché', 'Écart'], skipped: '{n} ligne(s) sans donnée de marché à cette date : exclues de la comparaison.', bad: 'Ligne {n} non reconnue : « {x} »',
      print: 'Imprimer ou enregistrer en PDF', csv: 'Télécharger le résultat (CSV)', how: 'Comment c’est calculé',
      howP: ['Pour chaque facture on prend le prix de marché du même mois (séries mensuelles), trimestre (trimestrielles) ou la dernière cotation des 14 jours précédents (hebdomadaires et quotidiennes). Sans donnée, la ligne est exclue.', 'Le prix de marché moyen est pondéré par vos quantités, comme le vôtre, pour une comparaison juste.', 'Ceci n’est pas un conseil financier : la série est un prix de référence d’une source officielle, pas votre marché exact. Lisez ce qu’elle mesure dans la note.'],
      src: 'Source', lic: 'Licence', note: 'Ce que mesure la série', report: 'Comparaison de factures', prepared: 'Préparé avec Dehesa Index', neg: 'Rapport de négociation de ce produit',
      M: { us: 'É.-U.', eu: 'UE', uk: 'Royaume-Uni', ca: 'Canada' }, cta: 'Vous voulez cette analyse avec vos données chaque campagne et par fournisseur ? Dites-nous comment vous travaillez.', ctaB: 'Nous écrire'
    },
    it: {
      mine: 'Salvare i miei acquisti e confrontarli con più mercati',
      title: 'Confronta le tue fatture con il mercato', h1: 'Confronta le tue fatture con il mercato',
      sub: 'Incolla i tuoi acquisti o vendite e vedi se hai pagato o incassato più o meno del mercato nelle stesse date, con le stesse quantità. Utile per negoziare con i fornitori, giustificare un conteggio o rivedere una campagna.',
      privacy: 'Le tue fatture non lasciano questo browser: non vengono inviate a nessun server né salvate. Se ricarichi la pagina, scompaiono.',
      s1: '1. Scegli con cosa confrontare', series: 'Serie di mercato', mode: 'Cosa confronti', buy: 'Acquisti (quanto hai pagato)', sell: 'Vendite (quanto hai incassato)',
      unitWarn: 'Scrivi i tuoi prezzi in {u}. Se la fattura usa un’altra unità o valuta, convertila prima: qui non si converte nulla per te.',
      s2: '2. Le tue fatture', s2h: 'Una riga per fattura: data, quantità e prezzo unitario, separati da tabulazione, punto e virgola o virgola. Puoi incollare da Excel. Date: AAAA-MM-GG o GG/MM/AAAA. La quantità è facoltativa (se manca vale 1).',
      ph: '2026-03-12;24;268,5\n2026-04-02;30;271\n15/05/2026;18;262', btn: 'Confronta', ex: 'Carica un esempio', exNote: 'Esempio con cifre inventate, solo per vedere come funziona.', file: 'Carica file CSV', clear: 'Svuota',
      s3: '3. Risultato', none: 'Incolla almeno una fattura con data e prezzo.', loadingS: 'Caricamento della serie…', fail: 'Impossibile caricare la serie di mercato. Riprova tra qualche minuto.',
      qty: 'Quantità totale', paid: 'Il tuo prezzo medio', rcv: 'Il tuo prezzo medio', mkt: 'Mercato nelle stesse date', diff: 'Differenza', total: 'In totale', weighted: 'ponderato per quantità',
      sB: 'Su {q} {u0} confrontate, hai pagato in media {p} {u}, contro {m} {u} del mercato nelle stesse date: {d} {dir} ({x}%). In totale, {tdir} {t}.',
      sS: 'Su {q} {u0} confrontate, hai incassato in media {p} {u}, contro {m} {u} del mercato nelle stesse date: {d} {dir} ({x}%). In totale, {tdir} {t}.',
      dirBuyUp: 'sopra', dirBuyDn: 'sotto', dirSellUp: 'sopra', dirSellDn: 'sotto', tBuyUp: 'hai pagato di più', tBuyDn: 'hai pagato di meno', tSellUp: 'hai incassato di più', tSellDn: 'hai incassato di meno', eq: 'uguale al mercato',
      cols: ['Data', 'Quantità', 'Il tuo prezzo', 'Mercato', 'Dato di mercato', 'Differenza'], skipped: '{n} riga/righe senza dato di mercato in quella data: escluse dal confronto.', bad: 'Riga {n} non riconosciuta: «{x}»',
      print: 'Stampa o salva in PDF', csv: 'Scarica il risultato (CSV)', how: 'Come si calcola',
      howP: ['Per ogni fattura si prende il prezzo di mercato dello stesso mese (serie mensili), trimestre (trimestrali) o l’ultima quotazione dei 14 giorni precedenti (settimanali e giornaliere). Senza dato, la riga è esclusa.', 'Il prezzo medio di mercato è ponderato per le tue quantità, come il tuo, perché il confronto sia equo.', 'Questa non è consulenza finanziaria: la serie è un prezzo di riferimento di una fonte ufficiale, non il tuo mercato esatto. Leggi cosa misura nella nota.'],
      src: 'Fonte', lic: 'Licenza', note: 'Cosa misura la serie', report: 'Confronto fatture', prepared: 'Preparato con Dehesa Index', neg: 'Rapporto di negoziazione di questo prodotto',
      M: { us: 'USA', eu: 'UE', uk: 'Regno Unito', ca: 'Canada' }, cta: 'Vuoi questa analisi con i tuoi dati a ogni campagna e per fornitore? Raccontaci come lavori.', ctaB: 'Scrivici'
    }
  };
  var IDX = null, SER = null, SID = '', MODE = 'buy', TEXT = '', LOADING = false, FAILED = false, RES = null;
  function UL(u) { return S.unitLabel ? S.unitLabel(u, lang()) : u; }
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n, d) { try { return Number(n).toLocaleString(lang(), { maximumFractionDigits: d == null ? 2 : d }); } catch (e) { return String(n); } }
  function nm(o, k) { return (o && (o[lang()] || o.es)) || k || ''; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? m : o[k]; }); }
  var DL = window.DehesaLookup, pad = DL.pad, num = DL.num, parseDate = DL.parseDate, dayT = DL.dayT, pointT = DL.pointT, lookup = DL.lookup;
  function parse(text) {
    var rows = [], bad = [], lines = text.split(/\r?\n/), i, p, d, q, pr;
    for (i = 0; i < lines.length; i++) {
      var ln = lines[i].trim(); if (!ln) continue;
      p = ln.indexOf('\t') > -1 ? ln.split('\t') : (ln.indexOf(';') > -1 ? ln.split(';') : ln.split(','));
      p = p.map(function (x) { return x.trim(); });
      d = parseDate(p[0]);
      if (!d && i === 0 && rows.length === 0 && !/\d/.test(p[0])) continue;   // cabecera (solo si no lleva numeros: una fecha imposible en la 1.ª linea se avisa)
      if (p.length === 2) { q = 1; pr = num(p[1]); } else { q = num(p[1]); pr = num(p[2]); }
      if (!d || isNaN(pr) || isNaN(q) || q <= 0) { bad.push([i + 1, ln]); continue; }
      rows.push({ date: d, qty: q, price: pr });
    }
    return { rows: rows, bad: bad };
  }
  function compute(s, parsed) {
    var out = [], skipped = 0, Q = 0, P = 0, M = 0;
    parsed.rows.forEach(function (r) {
      var pt = lookup(s, r.date); if (!pt) { skipped++; return; }
      out.push({ date: r.date, qty: r.qty, price: r.price, mkt: pt[1], md: pt[0] });
      Q += r.qty; P += r.qty * r.price; M += r.qty * pt[1];
    });
    return { lines: out, skipped: skipped, bad: parsed.bad, q: Q, paid: Q ? P / Q : 0, mkt: Q ? M / Q : 0, tot: P - M };
  }
  function sel() { return IDX && IDX.series.filter(function (x) { return x.id === SID; })[0]; }
  function loadSeries() {
    if (!SID || LOADING) return; var id = SID; LOADING = true; SER = null; FAILED = false;
    fetch(S.sitePath('data/api/v1/series/' + id + '.json')).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { if (SID === id) SER = d; }).catch(function () { FAILED = true; }).then(function () { LOADING = false; if (SID !== id) loadSeries(); render(); });
  }
  function th(c) { return '<th style="padding:6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600">' + esc(c) + '</th>'; }
  function td(x, st) { return '<td style="padding:6px;border-top:1px solid var(--border);' + (st || '') + '">' + x + '</td>'; }
  function sign(n, d) { return (n > 0 ? '+' : '') + nf(n, d); }
  function resultHtml(w, s) {
    var parsed = parse(TEXT);
    if (!parsed.rows.length && !parsed.bad.length) return '<p class="di-movers-hint">' + esc(w.none) + '</p>';
    var r = compute(s, parsed), u = UL(s.unit) + ' ' + s.currency, h = '';
    if (parsed.bad.length) h += '<p class="di-movers-hint" style="color:#8f5f12">' + parsed.bad.slice(0, 5).map(function (b) { return esc(fill(w.bad, { n: b[0], x: b[1] })); }).join('<br>') + '</p>';
    if (!r.lines.length) return h + '<p class="di-movers-hint">' + esc(fill(w.skipped, { n: r.skipped })) + '</p>';
    var diff = r.paid - r.mkt, pct = r.mkt ? diff / r.mkt * 100 : 0, up = diff > 0, buy = MODE === 'buy';
    var sentence = Math.abs(diff) < 0.005 ? fill(buy ? w.sB : w.sS, { q: nf(r.q), u0: UL(s.unit), p: nf(r.paid), u: u, m: nf(r.mkt), d: nf(0), dir: w.eq, x: nf(0, 1), t: nf(0), tdir: w.eq })
      : fill(buy ? w.sB : w.sS, { q: nf(r.q), u0: UL(s.unit), p: nf(r.paid), u: u, m: nf(r.mkt), d: nf(Math.abs(diff)) + ' ' + s.currency, dir: buy ? (up ? w.dirBuyUp : w.dirBuyDn) : (up ? w.dirSellUp : w.dirSellDn), x: nf(Math.abs(pct), 1), t: nf(Math.abs(r.tot)) + ' ' + s.currency, tdir: buy ? (up ? w.tBuyUp : w.tBuyDn) : (up ? w.tSellUp : w.tSellDn) });
    var good = buy ? diff <= 0 : diff >= 0, col = good ? '#17703f' : '#9a3b1a';
    RES = { s: s, r: r };
    h += '<article class="ic-sheet di-card" style="padding:16px"><div style="font-size:12px;color:var(--text-muted)">' + esc(w.report) + '</div><h3 style="margin:2px 0 10px;font-size:20px">' + esc(nm(s.name, s.product)) + ' · ' + esc(w.M[s.region] || s.region) + ' · ' + esc(u) + '</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px">' +
      kpi(w.qty, nf(r.q) + ' ' + UL(s.unit)) + kpi(buy ? w.paid : w.rcv, nf(r.paid) + ' ' + s.currency, w.weighted) + kpi(w.mkt, nf(r.mkt) + ' ' + s.currency, w.weighted) +
      '<div class="di-card" style="padding:10px 14px;border-color:' + col + '"><div style="font-size:12px;color:var(--text-muted)">' + esc(w.diff) + '</div><div style="font-size:20px;font-weight:700;color:' + col + '">' + sign(diff) + ' ' + esc(s.currency) + ' (' + sign(pct, 1) + ' %)</div><div style="font-size:11.5px;color:var(--text-muted)">' + esc(w.total) + ': ' + sign(r.tot) + ' ' + esc(s.currency) + '</div></div></div>' +
      '<p style="font-size:14px;margin:0 0 12px">' + esc(sentence) + '</p>' +
      '<div style="overflow-x:auto"><table data-no-rows class="ic-t" style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>' + w.cols.map(th).join('') + '</tr></thead><tbody>' +
      r.lines.map(function (l) { var dd = l.price - l.mkt; return '<tr>' + td(esc(l.date)) + td(nf(l.qty)) + td(nf(l.price)) + td(nf(l.mkt)) + td(esc(l.md)) + td(sign(dd) + ' (' + sign(l.mkt ? dd / l.mkt * 100 : 0, 1) + ' %)') + '</tr>'; }).join('') + '</tbody></table></div>' +
      (r.skipped ? '<p class="di-movers-hint">' + esc(fill(w.skipped, { n: r.skipped })) + '</p>' : '') +
      '<p class="ic-foot"><b>' + esc(w.src) + ':</b> ' + esc(s.sourceName) + ' · <b>' + esc(w.lic) + ':</b> ' + esc(s.license) + '<br><b>' + esc(w.note) + ':</b> ' + esc(nm(s.note) || '') + '<br>' + esc(s.attribution) + '</p></article>' +
      '<div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><button id="cf-print" class="di-btn-gold-solid" type="button">' + esc(w.print) + '</button><button id="cf-csv" class="di-btn-sec" type="button">' + esc(w.csv) + '</button><a href="informe-negociacion.html?p=' + encodeURIComponent(s.product) + '" style="align-self:center">' + esc(w.neg) + '</a></div>' +
      '<p class="no-print" style="margin-top:14px"><a class="di-btn-sec" href="mis-compras.html">' + esc(w.mine) + '</a></p><h3 style="margin:22px 0 6px;font-size:16px">' + esc(w.how) + '</h3>' + w.howP.map(function (p) { return '<p class="ic-foot" style="font-size:12px">' + esc(p) + '</p>'; }).join('');
    return h;
  }
  function kpi(k, v, sub) { return '<div class="di-card" style="padding:10px 14px"><div style="font-size:12px;color:var(--text-muted)">' + esc(k) + '</div><div style="font-size:20px;font-weight:700">' + esc(v) + '</div>' + (sub ? '<div style="font-size:11.5px;color:var(--text-muted)">' + esc(sub) + '</div>' : '') + '</div>'; }
  function exampleText(s) {
    var last = SER && SER.points[SER.points.length - 1], i, out = [];
    if (!last) return '';
    var pts = SER.points.slice(-60).filter(function (p, k) { return k % 12 === 0; }).slice(-4);
    for (i = 0; i < pts.length; i++) { var d = pts[i][0]; if (/^\d{4}-\d{2}$/.test(d)) d += '-10'; else if (/^\d{4}-Q/.test(d)) continue; out.push(d + ';' + (10 + i * 7) + ';' + String(Math.round(pts[i][1] * (1 + (i % 2 ? 0.03 : -0.02)) * 100) / 100).replace('.', lang() === 'en' ? '.' : ',')); }
    return out.join('\n');
  }
  function render() {
    var w = t(), root = document.getElementById('cf-body'); if (!root) return;
    document.getElementById('cf-h1').textContent = w.h1; document.getElementById('cf-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    if (!IDX) { root.innerHTML = '<p class="di-movers-hint">' + esc(FAILED ? w.fail : '…') + '</p>'; return; }
    if (!SID) SID = IDX.series.some(function (x) { return x.id === 'eu/trigo'; }) ? 'eu/trigo' : IDX.series[0].id;
    if (!SER && !LOADING && !FAILED) loadSeries();
    var s = SER || sel(), list = IDX.series.slice().sort(function (a, b) { return (nm(a.name, a.product) + a.region).localeCompare(nm(b.name, b.product) + b.region, lang()); });
    var h = '<p class="di-movers-hint no-print">' + esc(w.privacy) + '</p><div class="no-print"><h3 style="margin:14px 0 6px;font-size:16px">' + esc(w.s1) + '</h3><div style="display:flex;flex-wrap:wrap;gap:10px"><label style="font-size:13px">' + esc(w.series) + '<br><select id="cf-s" class="di-compare-select" style="width:auto;max-width:100%">' +
      list.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === SID ? ' selected' : '') + '>' + esc(nm(x.name, x.product) + ' — ' + (w.M[x.region] || x.region) + ' (' + x.unit + ' ' + x.currency + ')') + '</option>'; }).join('') + '</select></label>' +
      '<label style="font-size:13px">' + esc(w.mode) + '<br><select id="cf-m" class="di-compare-select" style="width:auto"><option value="buy"' + (MODE === 'buy' ? ' selected' : '') + '>' + esc(w.buy) + '</option><option value="sell"' + (MODE === 'sell' ? ' selected' : '') + '>' + esc(w.sell) + '</option></select></label></div>' +
      (sel() ? '<p class="di-movers-hint" style="color:#8f5f12">' + esc(fill(w.unitWarn, { u: UL(sel().unit) + ' ' + sel().currency })) + '</p>' : '') +
      '<h3 style="margin:14px 0 6px;font-size:16px">' + esc(w.s2) + '</h3><p class="di-movers-hint">' + esc(w.s2h) + '</p><textarea id="cf-t" rows="7" class="di-compare-select" style="width:100%;font-family:monospace;font-size:13px" placeholder="' + esc(w.ph) + '">' + esc(TEXT) + '</textarea>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px"><button id="cf-go" class="di-btn-gold-solid" type="button">' + esc(w.btn) + '</button><button id="cf-ex" class="di-btn-sec" type="button">' + esc(w.ex) + '</button><label class="di-btn-sec" style="cursor:pointer">' + esc(w.file) + '<input id="cf-f" type="file" accept=".csv,.txt,text/csv,text/plain" style="display:none"></label><button id="cf-clr" class="di-btn-sec" type="button">' + esc(w.clear) + '</button></div></div>' +
      '<h3 class="no-print" style="margin:18px 0 6px;font-size:16px">' + esc(w.s3) + '</h3>';
    if (FAILED) h += '<p>' + esc(w.fail) + '</p>'; else if (!SER) h += '<p class="di-movers-hint">' + esc(w.loadingS) + '</p>'; else h += resultHtml(w, SER);
    h += '<section class="di-card di-emp-cta no-print" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.cta) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaB) + '</a></section>';
    root.innerHTML = h; bind(w);
  }
  function csvOut() {
    if (!RES) return; var s = RES.s, w = t(), rows = [w.cols.join(';')];
    RES.r.lines.forEach(function (l) { rows.push([l.date, l.qty, l.price, l.mkt, l.md, Math.round((l.price - l.mkt) * 100) / 100].join(';')); });
    rows.push(''); rows.push(s.sourceName + ';' + s.license + ';' + s.attribution);
    var a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + rows.join('\n')); a.download = 'comparacion-' + s.id.replace('/', '-') + '.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function bind(w) {
    var $ = function (i) { return document.getElementById(i); };
    $('cf-s').onchange = function (e) { SID = e.target.value; SER = null; FAILED = false; TEXT = $('cf-t').value; loadSeries(); render(); };
    $('cf-m').onchange = function (e) { MODE = e.target.value; TEXT = $('cf-t').value; render(); };
    $('cf-go').onclick = function () { TEXT = $('cf-t').value; render(); };
    $('cf-clr').onclick = function () { TEXT = ''; RES = null; render(); };
    $('cf-ex').onclick = function () { TEXT = exampleText(); render(); if (TEXT) { var n = document.createElement('p'); n.className = 'di-movers-hint'; n.textContent = w.exNote; $('cf-t').parentNode.insertBefore(n, $('cf-t').nextSibling); } };
    $('cf-f').onchange = function (e) { var f = e.target.files && e.target.files[0]; if (!f || !window.FileReader) return; var fr = new FileReader(); fr.onload = function () { TEXT = String(fr.result); render(); }; fr.readAsText(f); };
    if ($('cf-print')) $('cf-print').onclick = function () { TEXT = $('cf-t').value; window.print(); };
    if ($('cf-csv')) $('cf-csv').onclick = csvOut;
  }
  var qp = /[?&]s=([^&]+)/.exec(location.search); if (qp) { try { SID = decodeURIComponent(qp[1]); } catch (e) { } }
  S.init('data');
  S.onLangChange = render;
  render();
  fetch(S.sitePath('data/api/v1/index.json')).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { IDX = d; render(); }).catch(function () { FAILED = true; render(); });
})();
