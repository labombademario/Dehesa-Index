/* Dehesa Index — Mis compras: tus compras y ventas guardadas en ESTE navegador (localStorage) y comparadas con varios precios de mercado a la vez.
   Nada se sube a ningun servidor. El dato de mercado de cada fecha sale de data/api/v1 (ver js/market-lookup.js); sin dato = sin comparar. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared, DL = window.DehesaLookup, KEY = 'dehesaMisCompras';
  var T = {
    es: { h1: 'Mis compras', sub: 'Guarda tus compras y ventas en este navegador y compáralas con varios precios de mercado a la vez. Nada se sube a ningún servidor.',
      add: 'Añadir una operación', d: 'Fecha', s: 'Precio de mercado de referencia', k: 'Tipo', buy: 'Compra', sell: 'Venta', q: 'Cantidad', p: 'Tu precio', n: 'Nota (opcional)', addB: 'Guardar', bad: 'Revisa la fecha (AAAA-MM-DD o DD/MM/AAAA), la cantidad y el precio.',
      sumT: 'Resumen por precio de mercado', sc: ['Mercado', 'Tipo', 'Cantidad', 'Tu precio medio', 'Mercado medio', 'Diferencia', 'Total'], lnT: 'Tus operaciones', lc: ['Fecha', 'Tipo', 'Mercado', 'Cantidad', 'Tu precio', 'Mercado ese día', 'Diferencia', 'Nota', ''],
      nomk: 'sin dato de mercado para esa fecha', del: 'Borrar', empty: 'Aún no hay operaciones. Añade la primera arriba, importa un fichero o carga un ejemplo.', ex: 'Cargar un ejemplo inventado', exN: 'Ejemplo inventado', 
      exp: 'Descargar copia (JSON)', csv: 'Descargar CSV', imp: 'Importar copia o CSV', print: 'Imprimir', clr: 'Borrar todo', clrQ: '¿Borrar todas las operaciones de este navegador? No se puede deshacer.', 
      mem: 'Este navegador no deja guardar datos: lo que añadas se pierde al cerrar la pestaña. Descarga la copia para no perderlo.', imported: '{n} operaciones importadas, {b} filas descartadas.', load: 'Cargando…', fail: 'No se pudo cargar la lista de precios de mercado.',
      higher: 'por encima del mercado', lower: 'por debajo del mercado', same: 'igual que el mercado', bT: 'Cómo leerlo', 
      b: ['Compras: pagar menos que el mercado es mejor. Ventas: cobrar más que el mercado es mejor. La palabra «por encima» o «por debajo» va siempre escrita; el color solo ayuda.', 'El precio de mercado es una referencia regional de una fuente oficial, no el precio exacto de tu producto, calidad o entrega. Léelo como orientación.', 'Mensual: el mismo mes. Trimestral: el mismo trimestre. Semanal: la última cotización de los 14 días anteriores. Diaria: la de los 7 días anteriores. Si no hay, no se compara y no se estima.', 'Los totales solo suman operaciones en la misma moneda y unidad. Todo se guarda en este navegador: si lo borras o cambias de dispositivo, descarga antes la copia.'],
      fin: 'Información de fuentes oficiales, no asesoramiento financiero.', cmpL: 'Comparar facturas en bloque', repL: 'Informe de negociación', M: { us: 'EE. UU.', eu: 'UE', uk: 'Reino Unido', ca: 'Canadá' } },
    en: { h1: 'My trades', sub: 'Save your purchases and sales in this browser and compare them with several market prices at once. Nothing is uploaded to any server.',
      add: 'Add a trade', d: 'Date', s: 'Reference market price', k: 'Type', buy: 'Purchase', sell: 'Sale', q: 'Quantity', p: 'Your price', n: 'Note (optional)', addB: 'Save', bad: 'Check the date (YYYY-MM-DD or DD/MM/YYYY), quantity and price.',
      sumT: 'Summary by market price', sc: ['Market', 'Type', 'Quantity', 'Your average price', 'Market average', 'Difference', 'Total'], lnT: 'Your trades', lc: ['Date', 'Type', 'Market', 'Quantity', 'Your price', 'Market that day', 'Difference', 'Note', ''],
      nomk: 'no market data for that date', del: 'Delete', empty: 'No trades yet. Add the first one above, import a file or load an example.', ex: 'Load a made-up example', exN: 'Made-up example',
      exp: 'Download backup (JSON)', csv: 'Download CSV', imp: 'Import backup or CSV', print: 'Print', clr: 'Delete all', clrQ: 'Delete all trades in this browser? This cannot be undone.',
      mem: 'This browser does not allow saving data: what you add is lost when the tab closes. Download the backup to keep it.', imported: '{n} trades imported, {b} rows discarded.', load: 'Loading…', fail: 'Could not load the market price list.',
      higher: 'above market', lower: 'below market', same: 'same as market', bT: 'How to read it',
      b: ['Purchases: paying less than the market is better. Sales: getting more than the market is better. The words “above” or “below” are always written; colour only helps.', 'The market price is a regional reference from an official source, not the exact price of your product, quality or delivery. Read it as guidance.', 'Monthly: the same month. Quarterly: the same quarter. Weekly: the latest quote in the previous 14 days. Daily: in the previous 7 days. If there is none, it is not compared and nothing is estimated.', 'Totals only add trades in the same currency and unit. Everything is saved in this browser: if you clear it or switch device, download the backup first.'],
      fin: 'Information from official sources, not financial advice.', cmpL: 'Compare invoices in bulk', repL: 'Negotiation report', M: { us: 'US', eu: 'EU', uk: 'UK', ca: 'Canada' } },
    fr: { h1: 'Mes achats', sub: 'Enregistrez vos achats et ventes dans ce navigateur et comparez-les à plusieurs prix de marché à la fois. Rien n’est envoyé à un serveur.',
      add: 'Ajouter une opération', d: 'Date', s: 'Prix de marché de référence', k: 'Type', buy: 'Achat', sell: 'Vente', q: 'Quantité', p: 'Votre prix', n: 'Note (facultatif)', addB: 'Enregistrer', bad: 'Vérifiez la date (AAAA-MM-JJ ou JJ/MM/AAAA), la quantité et le prix.',
      sumT: 'Résumé par prix de marché', sc: ['Marché', 'Type', 'Quantité', 'Votre prix moyen', 'Marché moyen', 'Écart', 'Total'], lnT: 'Vos opérations', lc: ['Date', 'Type', 'Marché', 'Quantité', 'Votre prix', 'Marché ce jour-là', 'Écart', 'Note', ''],
      nomk: 'pas de donnée de marché pour cette date', del: 'Supprimer', empty: 'Aucune opération pour l’instant. Ajoutez la première ci-dessus, importez un fichier ou chargez un exemple.', ex: 'Charger un exemple fictif', exN: 'Exemple fictif',
      exp: 'Télécharger la copie (JSON)', csv: 'Télécharger le CSV', imp: 'Importer une copie ou un CSV', print: 'Imprimer', clr: 'Tout supprimer', clrQ: 'Supprimer toutes les opérations de ce navigateur ? Action irréversible.',
      mem: 'Ce navigateur ne permet pas d’enregistrer : ce que vous ajoutez se perd à la fermeture de l’onglet. Téléchargez la copie pour le conserver.', imported: '{n} opérations importées, {b} lignes écartées.', load: 'Chargement…', fail: 'Impossible de charger la liste des prix de marché.',
      higher: 'au-dessus du marché', lower: 'au-dessous du marché', same: 'égal au marché', bT: 'Comment le lire',
      b: ['Achats : payer moins que le marché est mieux. Ventes : recevoir plus que le marché est mieux. Les mots « au-dessus » ou « au-dessous » sont toujours écrits ; la couleur ne fait qu’aider.', 'Le prix de marché est une référence régionale d’une source officielle, pas le prix exact de votre produit, qualité ou livraison. À lire comme une indication.', 'Mensuel : le même mois. Trimestriel : le même trimestre. Hebdomadaire : la dernière cotation des 14 jours précédents. Quotidien : celle des 7 jours précédents. Sans donnée, pas de comparaison et rien n’est estimé.', 'Les totaux n’additionnent que les opérations dans la même monnaie et unité. Tout est enregistré dans ce navigateur : si vous l’effacez ou changez d’appareil, téléchargez d’abord la copie.'],
      fin: 'Information issue de sources officielles, pas un conseil financier.', cmpL: 'Comparer des factures en lot', repL: 'Rapport de négociation', M: { us: 'É.-U.', eu: 'UE', uk: 'Royaume-Uni', ca: 'Canada' } },
    it: { h1: 'I miei acquisti', sub: 'Salva acquisti e vendite in questo browser e confrontali con più prezzi di mercato insieme. Nulla viene caricato su un server.',
      add: 'Aggiungi un’operazione', d: 'Data', s: 'Prezzo di mercato di riferimento', k: 'Tipo', buy: 'Acquisto', sell: 'Vendita', q: 'Quantità', p: 'Il tuo prezzo', n: 'Nota (facoltativa)', addB: 'Salva', bad: 'Controlla la data (AAAA-MM-GG o GG/MM/AAAA), la quantità e il prezzo.',
      sumT: 'Riepilogo per prezzo di mercato', sc: ['Mercato', 'Tipo', 'Quantità', 'Tuo prezzo medio', 'Mercato medio', 'Differenza', 'Totale'], lnT: 'Le tue operazioni', lc: ['Data', 'Tipo', 'Mercato', 'Quantità', 'Tuo prezzo', 'Mercato quel giorno', 'Differenza', 'Nota', ''],
      nomk: 'nessun dato di mercato per quella data', del: 'Elimina', empty: 'Ancora nessuna operazione. Aggiungi la prima qui sopra, importa un file o carica un esempio.', ex: 'Carica un esempio inventato', exN: 'Esempio inventato',
      exp: 'Scarica copia (JSON)', csv: 'Scarica CSV', imp: 'Importa copia o CSV', print: 'Stampa', clr: 'Elimina tutto', clrQ: 'Eliminare tutte le operazioni di questo browser? Non si può annullare.',
      mem: 'Questo browser non permette di salvare dati: ciò che aggiungi si perde alla chiusura della scheda. Scarica la copia per conservarlo.', imported: '{n} operazioni importate, {b} righe scartate.', load: 'Caricamento…', fail: 'Impossibile caricare l’elenco dei prezzi di mercato.',
      higher: 'sopra il mercato', lower: 'sotto il mercato', same: 'pari al mercato', bT: 'Come leggerlo',
      b: ['Acquisti: pagare meno del mercato è meglio. Vendite: incassare più del mercato è meglio. Le parole «sopra» o «sotto» sono sempre scritte; il colore aiuta soltanto.', 'Il prezzo di mercato è un riferimento regionale di una fonte ufficiale, non il prezzo esatto del tuo prodotto, qualità o consegna. Leggilo come orientamento.', 'Mensile: lo stesso mese. Trimestrale: lo stesso trimestre. Settimanale: l’ultima quotazione dei 14 giorni precedenti. Giornaliero: dei 7 giorni precedenti. Se manca, non si confronta e nulla viene stimato.', 'I totali sommano solo operazioni nella stessa valuta e unità. Tutto è salvato in questo browser: se lo cancelli o cambi dispositivo, scarica prima la copia.'],
      fin: 'Informazioni da fonti ufficiali, non consulenza finanziaria.', cmpL: 'Confronta fatture in blocco', repL: 'Rapporto di negoziazione', M: { us: 'USA', eu: 'UE', uk: 'Regno Unito', ca: 'Canada' } }
  };
  var IDX = null, FAILED = false, SER = {}, PENDING = {}, ITEMS = [], MEMONLY = false, MSG = '', DRAFT = { d: '', s: '', k: 'buy', q: '', p: '', n: '' };
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n, d) { try { return Number(n).toLocaleString(lang(), { maximumFractionDigits: d == null ? 2 : d }); } catch (e) { return String(n); } }
  function nm(o, k) { return (o && (o[lang()] || o.es)) || k || ''; }
  function sgn(n, d) { return (n > 0 ? '+' : '') + nf(n, d); }
  function sinfo(id) { return IDX && IDX.series.filter(function (x) { return x.id === id; })[0]; }
  function label(s) { var w = t(); return nm(s.name, s.product) + ' — ' + (nm(s.place) || w.M[s.region] || s.region); }
  /* ---- almacenamiento ---- */
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ version: 1, items: ITEMS })); MEMONLY = false; } catch (e) { MEMONLY = true; } }
  function load() { try { var r = localStorage.getItem(KEY); if (r) { var o = JSON.parse(r); if (o && o.items) ITEMS = clean(o.items).ok; } } catch (e) { MEMONLY = true; } }
  function clean(arr) {
    var ok = [], bad = 0; (arr || []).forEach(function (x) {
      var d = x && DL.parseDate(x.d), q = x && (typeof x.q === 'number' ? x.q : DL.num(x.q)), p = x && (typeof x.p === 'number' ? x.p : DL.num(x.p));
      if (!d || !isFinite(q) || q <= 0 || !isFinite(p) || p < 0 || !/^[a-z]{2}\/[a-z0-9_-]+$/.test(x.s || '') || (IDX && !sinfo(x.s))) { bad++; return; }
      ok.push({ i: x.i || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)), d: d, s: x.s, q: q, p: p, k: x.k === 'sell' ? 'sell' : 'buy', n: String(x.n || '').slice(0, 80) });
    }); return { ok: ok, bad: bad };
  }
  function need() {
    var ids = {}; ITEMS.forEach(function (x) { ids[x.s] = 1; });
    Object.keys(ids).forEach(function (id) { if (SER[id] || PENDING[id]) return; PENDING[id] = 1;
      fetch(S.sitePath('data/api/v1/series/' + id + '.json')).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { SER[id] = d; }).catch(function () { SER[id] = { failed: true, points: [] }; }).then(function () { delete PENDING[id]; render(); }); });
  }
  function ready() { return Object.keys(PENDING).length === 0; }
  /* ---- calculo ---- */
  function calc(x) { var s = SER[x.s], pt = s && !s.failed ? DL.lookup(s, x.d) : null; return pt ? { mkt: pt[1], md: pt[0], diff: x.p - pt[1], tot: x.q * (x.p - pt[1]) } : null; }
  function groups() {
    var g = {}; ITEMS.forEach(function (x) { var c = calc(x); if (!c) return; var k = x.s + '|' + x.k, o = g[k] || (g[k] = { s: x.s, k: x.k, q: 0, P: 0, M: 0, n: 0 }); o.q += x.q; o.P += x.q * x.p; o.M += x.q * c.mkt; o.n++; });
    return Object.keys(g).sort().map(function (k) { return g[k]; });
  }
  function verdict(w, kind, diff) { if (Math.abs(diff) < 1e-9) return w.same; return diff > 0 ? w.higher : w.lower; }
  function good(kind, diff) { return kind === 'buy' ? diff < 0 : diff > 0; }
  function colr(kind, diff) { return Math.abs(diff) < 1e-9 ? '' : 'color:' + (good(kind, diff) ? '#17703f' : '#9a3b1a') + ';'; }
  function th(c) { return '<th style="padding:6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600">' + esc(c) + '</th>'; }
  function td(x, st) { return '<td style="padding:6px;border-top:1px solid var(--border);' + (st || '') + '">' + x + '</td>'; }
  function UL(u) { return S.unitLabel ? S.unitLabel(u, lang()) : u; }
  function unitOf(s) { return s ? s.currency + '/' + UL(s.unit) : ''; }
  function render() {
    var w = t(), root = document.getElementById('mc-body'); if (!root) return;
    document.getElementById('mc-h1').textContent = w.h1; document.getElementById('mc-sub').textContent = w.sub; document.title = w.h1 + ' | Dehesa Index';
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!IDX) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.load) + '</p>'; return; }
    var sorted = IDX.series.slice().sort(function (a, b) { return label(a).localeCompare(label(b), lang()); }), sid = DRAFT.s || (sinfo('eu/trigo') ? 'eu/trigo' : sorted[0].id), si = sinfo(sid);
    var opts = sorted.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === sid ? ' selected' : '') + '>' + esc(label(x)) + '</option>'; }).join('');
    var inp = 'padding:7px;width:100%', lab = function (k, c) { return '<label style="display:grid;gap:4px;font-size:12.5px">' + esc(k) + c + '</label>'; };
    var h = '';
    if (MEMONLY) h += '<p class="di-movers-hint" style="color:#8f5f12">' + esc(w.mem) + '</p>';
    if (MSG) h += '<p class="di-movers-hint" id="mc-msg">' + esc(MSG) + '</p>';
    h += '<form id="mc-form" class="di-card no-print" style="padding:14px;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));align-items:end"><h2 style="grid-column:1/-1;margin:0;font-size:16px">' + esc(w.add) + '</h2>' +
      lab(w.d, '<input id="mc-d" required placeholder="2026-10-19" value="' + esc(DRAFT.d) + '" style="' + inp + '">') + lab(w.s, '<select id="mc-s" style="' + inp + '">' + opts + '</select>') +
      lab(w.k, '<select id="mc-k" style="' + inp + '"><option value="buy"' + (DRAFT.k === 'buy' ? ' selected' : '') + '>' + esc(w.buy) + '</option><option value="sell"' + (DRAFT.k === 'sell' ? ' selected' : '') + '>' + esc(w.sell) + '</option></select>') +
      lab(w.q + (si ? ' (' + UL(si.unit) + ')' : ''), '<input id="mc-q" required inputmode="decimal" value="' + esc(DRAFT.q) + '" style="' + inp + '">') + lab(w.p + (si ? ' (' + unitOf(si) + ')' : ''), '<input id="mc-p" required inputmode="decimal" value="' + esc(DRAFT.p) + '" style="' + inp + '">') +
      lab(w.n, '<input id="mc-n" maxlength="80" value="' + esc(DRAFT.n) + '" style="' + inp + '">') + '<div><button class="di-btn-gold-solid" type="submit">' + esc(w.addB) + '</button></div></form>';
    if (!ITEMS.length) h += '<p class="di-emp-p" style="margin-top:16px">' + esc(w.empty) + '</p><p class="no-print"><button class="di-btn-sec" id="mc-ex">' + esc(w.ex) + '</button> <label class="di-btn-sec" style="cursor:pointer">' + esc(w.imp) + '<input type="file" id="mc-f" accept=".json,.csv,.txt" style="display:none"></label></p>';
    else {
      need();
      if (!ready()) h += '<p class="di-movers-hint">' + esc(w.load) + '</p>';
      var G = groups();
      if (G.length) h += '<h2 style="margin:22px 0 6px;font-size:18px">' + esc(w.sumT) + '</h2><div class="di-card" style="padding:4px 14px;overflow-x:auto"><table data-no-rows style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>' + w.sc.map(th).join('') + '</tr></thead><tbody>' +
        G.map(function (g) { var s = SER[g.s], inf = sinfo(g.s), paid = g.P / g.q, mk = g.M / g.q, d = paid - mk, tot = g.P - g.M;
          return '<tr>' + td('<b>' + esc(label(inf)) + '</b>') + td(esc(g.k === 'buy' ? w.buy : w.sell)) + td(nf(g.q) + ' ' + esc(UL(inf.unit))) + td(nf(paid) + ' ' + esc(unitOf(inf))) + td(nf(mk) + ' ' + esc(unitOf(inf))) +
            td('<span style="' + colr(g.k, d) + '">' + sgn(d) + ' (' + esc(verdict(w, g.k, d)) + ')</span>') + td('<b style="' + colr(g.k, tot) + '">' + sgn(tot, 0) + ' ' + esc(inf.currency) + '</b>') + '</tr>'; }).join('') + '</tbody></table></div>';
      h += '<h2 style="margin:22px 0 6px;font-size:18px">' + esc(w.lnT) + '</h2><div class="di-card" style="padding:4px 14px;overflow-x:auto"><table data-no-rows style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>' + w.lc.map(th).join('') + '</tr></thead><tbody>' +
        ITEMS.slice().sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; }).map(function (x) { var inf = sinfo(x.s), c = ready() ? calc(x) : null, u = unitOf(inf);
          return '<tr>' + td(esc(x.d)) + td(esc(x.k === 'buy' ? w.buy : w.sell)) + td(esc(label(inf))) + td(nf(x.q) + ' ' + esc(UL(inf.unit))) + td(nf(x.p) + ' ' + esc(u)) +
            td(c ? nf(c.mkt) + ' ' + esc(u) + ' <span style="color:var(--text-muted);font-size:11px">(' + esc(c.md) + ')</span>' : '<span style="color:var(--text-muted)">' + esc(ready() ? w.nomk : '…') + '</span>') +
            td(c ? '<span style="' + colr(x.k, c.diff) + '">' + sgn(c.diff) + ' (' + esc(verdict(w, x.k, c.diff)) + ')</span>' : '') + td(esc(x.n)) + td('<button class="di-btn-sec no-print" data-del="' + esc(x.i) + '">' + esc(w.del) + '</button>') + '</tr>'; }).join('') + '</tbody></table></div>';
      h += '<p class="no-print" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"><button class="di-btn-sec" id="mc-exp">' + esc(w.exp) + '</button><button class="di-btn-sec" id="mc-csv">' + esc(w.csv) + '</button><label class="di-btn-sec" style="cursor:pointer">' + esc(w.imp) + '<input type="file" id="mc-f" accept=".json,.csv,.txt" style="display:none"></label><button class="di-btn-sec" id="mc-print">' + esc(w.print) + '</button><button class="di-btn-sec" id="mc-clr">' + esc(w.clr) + '</button></p>';
    }
    h += '<h2 style="margin:26px 0 6px;font-size:16px">' + esc(w.bT) + '</h2><ul class="di-emp-p" style="padding-left:18px">' + w.b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<p class="di-movers-hint">' + esc(w.fin) + '</p><p class="no-print"><a class="di-btn-sec" href="comparador-facturas.html">' + esc(w.cmpL) + '</a> <a class="di-btn-sec" href="informe-negociacion.html">' + esc(w.repL) + '</a></p>';
    root.innerHTML = h; bind(w);
  }
  function download(name, text, type) { try { var b = new Blob([text], { type: type }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); } catch (e) { } }
  function csvOut() {
    var rows = [['date', 'series', 'quantity', 'your_price', 'type', 'note', 'market_price', 'market_date', 'difference']];   /* mismo orden de columnas que acepta el importador */
    ITEMS.forEach(function (x) { var c = calc(x); rows.push([x.d, x.s, x.q, x.p, x.k, '"' + (/^[=+\-@]/.test(x.n) ? "'" : '') + x.n.replace(/"/g, '""') + '"', c ? c.mkt : '', c ? c.md : '', c ? Math.round(c.diff * 100) / 100 : '']);   /* una nota que empieza por = + - @ no se evalua como formula en Excel */ });
    return rows.map(function (r) { return r.join(';'); }).join('\n');
  }
  function fromText(text) {
    var o = null; try { o = JSON.parse(text); } catch (e) { }
    if (o && (o.items || o.length)) return clean(o.items || o);
    var arr = []; text.split(/\r?\n/).forEach(function (ln, i) { ln = ln.trim(); if (!ln) return; var p = ln.indexOf('\t') > -1 ? ln.split('\t') : ln.split(';'); if (p.length < 4) return; if (i === 0 && !DL.parseDate(p[0])) return;
      var k = /^(sell|venta|vente|vendita|v)$/i.test((p[4] || '').trim()) ? 'sell' : 'buy'; arr.push({ d: p[0], s: p[1].trim(), q: p[2], p: p[3], k: k, n: String(p[5] || '').replace(/^"(.*)"$/, '$1').replace(/""/g, '"') }); });
    var r = clean(arr); r.bad += 0; return r;
  }
  function bind(w) {
    var $ = function (i) { return document.getElementById(i); }, form = $('mc-form');
    function keep() { DRAFT = { d: $('mc-d').value, s: $('mc-s').value, k: $('mc-k').value, q: $('mc-q').value, p: $('mc-p').value, n: $('mc-n').value }; }
    $('mc-s').onchange = function () { keep(); render(); };
    form.onsubmit = function (e) { e.preventDefault(); keep(); var r = clean([DRAFT]); if (!r.ok.length) { MSG = w.bad; render(); return; } ITEMS = ITEMS.concat(r.ok); save(); DRAFT.d = ''; DRAFT.q = ''; DRAFT.p = ''; DRAFT.n = ''; MSG = ''; render(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { var id = b.getAttribute('data-del'); ITEMS = ITEMS.filter(function (x) { return x.i !== id; }); save(); MSG = ''; render(); }; });
    if ($('mc-exp')) $('mc-exp').onclick = function () { download('mis-compras-dehesa-index.json', JSON.stringify({ version: 1, items: ITEMS }, null, 1), 'application/json'); };
    if ($('mc-csv')) $('mc-csv').onclick = function () { download('mis-compras-dehesa-index.csv', csvOut(), 'text/csv'); };
    if ($('mc-print')) $('mc-print').onclick = function () { window.print(); };
    if ($('mc-clr')) $('mc-clr').onclick = function () { if (window.confirm(w.clrQ)) { ITEMS = []; save(); MSG = ''; render(); } };
    if ($('mc-ex')) $('mc-ex').onclick = function () {
      var id = sinfo('eu/trigo') ? 'eu/trigo' : IDX.series[0].id; fetch(S.sitePath('data/api/v1/series/' + id + '.json')).then(function (r) { return r.json(); }).then(function (d) { SER[id] = d; var pts = d.points.slice(-60).filter(function (p, k) { return k % 12 === 0; }).slice(-3), arr = [];
        pts.forEach(function (p, k) { var dt = /^\d{4}-\d{2}-\d{2}$/.test(p[0]) ? p[0] : p[0].slice(0, 7) + '-15'; if (/Q/.test(dt)) return; arr.push({ d: dt, s: id, q: 100 * (k + 1), p: Math.round(p[1] * (k % 2 ? 0.97 : 1.04) * 100) / 100, k: k % 2 ? 'sell' : 'buy', n: w.exN }); });
        ITEMS = ITEMS.concat(clean(arr).ok); save(); render(); }).catch(function () { });
    };
    if ($('mc-f')) $('mc-f').onchange = function (e) { var f = e.target.files && e.target.files[0]; if (!f || !window.FileReader) return; var fr = new FileReader(); fr.onload = function () { var r = fromText(String(fr.result)), key = function (x) { return [x.d, x.s, x.q, x.p, x.k, x.n].join('|'); }, have = {}; ITEMS.forEach(function (x) { have[key(x)] = 1; }); r.ok = r.ok.filter(function (x) { if (have[key(x)]) { r.bad++; return false; } have[key(x)] = 1; return true; });   /* sin duplicados: reimportar la misma copia no multiplica las operaciones */
      ITEMS = ITEMS.concat(r.ok); save(); MSG = w.imported.replace('{n}', r.ok.length).replace('{b}', r.bad); render(); }; fr.readAsText(f); };
  }
  S.init('data');
  S.onLangChange = render;
  window.DehesaMisCompras = { _state: function () { return { items: ITEMS.slice() }; } };
  render();
  fetch(S.sitePath('data/api/v1/index.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { IDX = d; load(); render(); }).catch(function () { FAILED = true; render(); });
})();
