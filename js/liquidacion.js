/* Dehesa Index — Justificar la liquidación. La cooperativa pega o escribe sus ventas (fecha, toneladas, precio) y se comparan con
   las cotizaciones oficiales de lonja de la Comisión Europea (Agri-food Data Portal) en las MISMAS fechas y con los MISMOS volúmenes.
   Todo se calcula en el navegador: las ventas no se envían a ningún servidor ni se guardan. Catálogo de referencias:
   data/views/liq-refs/<PAIS>.json (scripts/build-liquidation-refs.py); puntos: data/eu/<familia>/<serie>.json (días desde 2000-01-01). ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: {
      title: 'Justificar la liquidación', h1: 'Justificar la liquidación ante los socios',
      sub: 'Escribe o pega las ventas de la campaña y compáralas con las lonjas oficiales en las mismas fechas y con los mismos volúmenes. Sale un resumen listo para la asamblea o el Consejo Rector.',
      privacy: 'Tus ventas no salen de este navegador: no se envían a ningún servidor ni se guardan. Si recargas la página, desaparecen.',
      s1: '1. Elige con qué comparar', country: 'País', product: 'Producto', refs: 'Lonjas o mercados de referencia (hasta 3)', last: 'último dato',
      s2: '2. Tus ventas', s2h: 'Una línea por venta o por liquidación parcial: fecha, toneladas y precio en {u}. Puedes pegarlas desde Excel (columnas fecha, toneladas, precio).',
      date: 'Fecha', qty: 'Toneladas', price: 'Precio', add: 'Añadir venta', del: 'Quitar', paste: 'Pegar desde Excel o CSV', pasteBtn: 'Usar estas líneas', file: 'Cargar fichero CSV',
      example: 'Cargar un ejemplo', emT: '¿Sin ventas a mano? Prueba con un ejemplo', emP: 'Carga seis ventas de ejemplo (volúmenes y precios inventados, fechas reales de la referencia elegida) y verás cómo sale el informe para el Consejo Rector.', more: 'Ver más lonjas ({n})', exampleNote: 'Ejemplo con cifras inventadas, solo para ver cómo funciona.', clear: 'Vaciar', coop: 'Nombre de la cooperativa (opcional, solo para el informe)', campaign: 'Campaña (opcional)',
      s3: '3. Resultado', none: 'Añade al menos una venta con fecha, toneladas y precio.', noref: 'Elige al menos una referencia.', loadingRef: 'Cargando cotizaciones…',
      sold: 'Volumen vendido', yours: 'Vuestro precio medio', weighted: 'ponderado por toneladas', refAt: 'Referencia en las mismas fechas', diff: 'Diferencia', total: 'Equivale en total a',
      above: 'por encima', below: 'por debajo', equal: 'igual que', sent: 'En la campaña {c}vendimos {q} t a un precio medio de {p}. En las mismas fechas y con los mismos volúmenes, {r} marcaba {rv}: {d} {dir} de la referencia ({dp}).',
      sentEq: 'En la campaña {c}vendimos {q} t a un precio medio de {p}, el mismo que marcaba {r} en las mismas fechas y con los mismos volúmenes.',
      range: 'En ese periodo la referencia osciló entre {lo} y {hi}; su media simple fue {avg}.', missing: '{n} venta(s) sin dato de referencia en los 14 días anteriores: no entran en la comparación con {r}.',
      chartT: 'Vuestras ventas frente a la referencia', dotNote: 'Cada punto es una venta; su tamaño, el volumen.', yourSales: 'Vuestras ventas',
      tCols: ['Fecha', 'Toneladas', 'Vuestro precio'], refDate: 'dato del', print: 'Imprimir o guardar en PDF', csv: 'Descargar resultado (CSV)',
      method: 'Cómo se calcula: para cada venta se toma la última cotización publicada de la lonja en la fecha de la venta o en los 14 días anteriores. El precio de referencia es la media de esas cotizaciones ponderada por vuestras toneladas, igual que vuestro precio medio. Así se compara lo mismo: mismas fechas, mismos volúmenes. Las cotizaciones son las que publica la Comisión Europea (Agri-food Data Portal) para cada lonja; pueden diferir en calidad, portes y condiciones de vuestras ventas.',
      src: 'Fuente: Comisión Europea, Agri-food Data Portal (cotizaciones semanales de lonja). Cálculo hecho por Dehesa Index con las ventas introducidas por el usuario.',
      reportT: 'Informe de liquidación', prepared: 'Preparado con Dehesa Index', bad: 'Línea {n} no reconocida: «{x}»', okLines: '{n} venta(s) cargadas.',
      cta: '¿Queréis este informe cada campaña con vuestras propias referencias y por socio? Contadnos cómo liquidáis.', ctaBtn: 'Escríbenos', fail: 'No se pudieron cargar las referencias. Vuelve a intentarlo en unos minutos.'
    },
    en: {
      title: 'Settlement price check', h1: 'Justify your settlement price to members',
      sub: 'Type or paste the season’s sales and compare them with official market quotations on the same dates and with the same volumes. You get a summary ready for the general meeting or the board.',
      privacy: 'Your sales never leave this browser: they are not sent to any server or stored. If you reload the page, they are gone.',
      s1: '1. Choose what to compare with', country: 'Country', product: 'Product', refs: 'Reference markets (up to 3)', last: 'latest data',
      s2: '2. Your sales', s2h: 'One line per sale or partial settlement: date, tonnes and price in {u}. You can paste them from Excel (columns date, tonnes, price).',
      date: 'Date', qty: 'Tonnes', price: 'Price', add: 'Add sale', del: 'Remove', paste: 'Paste from Excel or CSV', pasteBtn: 'Use these lines', file: 'Load CSV file',
      example: 'Load an example', emT: 'No sales to hand? Try an example', emP: 'Load six example sales (made-up volumes and prices, real dates from the chosen reference) to see what the report for the board looks like.', more: 'Show more markets ({n})', exampleNote: 'Example with made-up figures, only to see how it works.', clear: 'Clear', coop: 'Cooperative name (optional, report only)', campaign: 'Season (optional)',
      s3: '3. Result', none: 'Add at least one sale with date, tonnes and price.', noref: 'Choose at least one reference.', loadingRef: 'Loading quotations…',
      sold: 'Volume sold', yours: 'Your average price', weighted: 'weighted by tonnes', refAt: 'Reference on the same dates', diff: 'Difference', total: 'Equivalent in total to',
      above: 'above', below: 'below', equal: 'equal to', sent: 'In the {c}season we sold {q} t at an average price of {p}. On the same dates and with the same volumes, {r} quoted {rv}: {d} {dir} the reference ({dp}).',
      sentEq: 'In the {c}season we sold {q} t at an average price of {p}, the same as {r} quoted on the same dates and with the same volumes.',
      range: 'Over that period the reference ranged from {lo} to {hi}; its simple average was {avg}.', missing: '{n} sale(s) without a reference quotation in the previous 14 days: left out of the comparison with {r}.',
      chartT: 'Your sales against the reference', dotNote: 'Each dot is a sale; its size is the volume.', yourSales: 'Your sales',
      tCols: ['Date', 'Tonnes', 'Your price'], refDate: 'data of', print: 'Print or save as PDF', csv: 'Download result (CSV)',
      method: 'How it is computed: for each sale we take the latest quotation published for the market on the sale date or in the previous 14 days. The reference price is the average of those quotations weighted by your tonnes, like your average price. So like is compared with like: same dates, same volumes. Quotations are those published by the European Commission (Agri-food Data Portal) for each market; they may differ from your sales in quality, freight and terms.',
      src: 'Source: European Commission, Agri-food Data Portal (weekly market quotations). Computed by Dehesa Index with the sales entered by the user.',
      reportT: 'Settlement report', prepared: 'Prepared with Dehesa Index', bad: 'Line {n} not recognised: “{x}”', okLines: '{n} sale(s) loaded.',
      cta: 'Want this report every season with your own references and per member? Tell us how you settle.', ctaBtn: 'Contact us', fail: 'Could not load the references. Please try again in a few minutes.'
    },
    fr: {
      title: 'Justifier le prix de liquidation', h1: 'Justifier le prix payé aux adhérents',
      sub: 'Saisissez ou collez les ventes de la campagne et comparez-les aux cotations officielles aux mêmes dates et avec les mêmes volumes. Vous obtenez un résumé prêt pour l’assemblée générale ou le conseil d’administration.',
      privacy: 'Vos ventes ne quittent pas ce navigateur : elles ne sont envoyées à aucun serveur ni enregistrées. Si vous rechargez la page, elles disparaissent.',
      s1: '1. Choisissez la référence', country: 'Pays', product: 'Produit', refs: 'Marchés de référence (3 maximum)', last: 'dernière donnée',
      s2: '2. Vos ventes', s2h: 'Une ligne par vente ou par liquidation partielle : date, tonnes et prix en {u}. Vous pouvez les coller depuis Excel (colonnes date, tonnes, prix).',
      date: 'Date', qty: 'Tonnes', price: 'Prix', add: 'Ajouter une vente', del: 'Retirer', paste: 'Coller depuis Excel ou CSV', pasteBtn: 'Utiliser ces lignes', file: 'Charger un fichier CSV',
      example: 'Charger un exemple', emT: 'Pas de ventes sous la main ? Essayez un exemple', emP: 'Chargez six ventes d’exemple (volumes et prix inventés, dates réelles de la référence choisie) pour voir le rapport destiné au conseil.', more: 'Voir plus de marchés ({n})', exampleNote: 'Exemple avec des chiffres inventés, seulement pour voir le fonctionnement.', clear: 'Vider', coop: 'Nom de la coopérative (facultatif, pour le rapport)', campaign: 'Campagne (facultatif)',
      s3: '3. Résultat', none: 'Ajoutez au moins une vente avec date, tonnes et prix.', noref: 'Choisissez au moins une référence.', loadingRef: 'Chargement des cotations…',
      sold: 'Volume vendu', yours: 'Votre prix moyen', weighted: 'pondéré par les tonnes', refAt: 'Référence aux mêmes dates', diff: 'Écart', total: 'Soit au total',
      above: 'au-dessus', below: 'en dessous', equal: 'égal à', sent: 'Pendant la campagne {c}nous avons vendu {q} t à un prix moyen de {p}. Aux mêmes dates et avec les mêmes volumes, {r} cotait {rv} : {d} {dir} de la référence ({dp}).',
      sentEq: 'Pendant la campagne {c}nous avons vendu {q} t à un prix moyen de {p}, le même que la cotation de {r} aux mêmes dates et avec les mêmes volumes.',
      range: 'Sur cette période, la référence a varié entre {lo} et {hi} ; sa moyenne simple a été de {avg}.', missing: '{n} vente(s) sans cotation de référence dans les 14 jours précédents : exclue(s) de la comparaison avec {r}.',
      chartT: 'Vos ventes face à la référence', dotNote: 'Chaque point est une vente ; sa taille, le volume.', yourSales: 'Vos ventes',
      tCols: ['Date', 'Tonnes', 'Votre prix'], refDate: 'donnée du', print: 'Imprimer ou enregistrer en PDF', csv: 'Télécharger le résultat (CSV)',
      method: 'Calcul : pour chaque vente, on prend la dernière cotation publiée pour le marché à la date de la vente ou dans les 14 jours précédents. Le prix de référence est la moyenne de ces cotations pondérée par vos tonnes, comme votre prix moyen. On compare donc la même chose : mêmes dates, mêmes volumes. Les cotations sont celles publiées par la Commission européenne (Agri-food Data Portal) ; elles peuvent différer de vos ventes en qualité, transport et conditions.',
      src: 'Source : Commission européenne, Agri-food Data Portal (cotations hebdomadaires). Calcul effectué par Dehesa Index avec les ventes saisies par l’utilisateur.',
      reportT: 'Rapport de liquidation', prepared: 'Préparé avec Dehesa Index', bad: 'Ligne {n} non reconnue : « {x} »', okLines: '{n} vente(s) chargée(s).',
      cta: 'Vous voulez ce rapport chaque campagne avec vos propres références et par adhérent ? Dites-nous comment vous liquidez.', ctaBtn: 'Nous écrire', fail: 'Impossible de charger les références. Réessayez dans quelques minutes.'
    },
    it: {
      title: 'Giustificare la liquidazione', h1: 'Giustificare il prezzo di liquidazione ai soci',
      sub: 'Scrivi o incolla le vendite della campagna e confrontale con le quotazioni ufficiali nelle stesse date e con gli stessi volumi. Ottieni un riepilogo pronto per l’assemblea o il consiglio di amministrazione.',
      privacy: 'Le tue vendite non escono da questo browser: non vengono inviate a nessun server né salvate. Se ricarichi la pagina, spariscono.',
      s1: '1. Scegli il riferimento', country: 'Paese', product: 'Prodotto', refs: 'Mercati di riferimento (massimo 3)', last: 'ultimo dato',
      s2: '2. Le tue vendite', s2h: 'Una riga per vendita o liquidazione parziale: data, tonnellate e prezzo in {u}. Puoi incollarle da Excel (colonne data, tonnellate, prezzo).',
      date: 'Data', qty: 'Tonnellate', price: 'Prezzo', add: 'Aggiungi vendita', del: 'Togli', paste: 'Incolla da Excel o CSV', pasteBtn: 'Usa queste righe', file: 'Carica file CSV',
      example: 'Carica un esempio', emT: 'Nessuna vendita a portata di mano? Prova un esempio', emP: 'Carica sei vendite di esempio (volumi e prezzi inventati, date reali del riferimento scelto) per vedere il rapporto per il consiglio.', more: 'Mostra altri mercati ({n})', exampleNote: 'Esempio con cifre inventate, solo per vedere come funziona.', clear: 'Svuota', coop: 'Nome della cooperativa (facoltativo, solo per il rapporto)', campaign: 'Campagna (facoltativo)',
      s3: '3. Risultato', none: 'Aggiungi almeno una vendita con data, tonnellate e prezzo.', noref: 'Scegli almeno un riferimento.', loadingRef: 'Caricamento delle quotazioni…',
      sold: 'Volume venduto', yours: 'Il vostro prezzo medio', weighted: 'ponderato per tonnellate', refAt: 'Riferimento nelle stesse date', diff: 'Differenza', total: 'Equivale in totale a',
      above: 'sopra', below: 'sotto', equal: 'uguale a', sent: 'Nella campagna {c}abbiamo venduto {q} t a un prezzo medio di {p}. Nelle stesse date e con gli stessi volumi, {r} quotava {rv}: {d} {dir} il riferimento ({dp}).',
      sentEq: 'Nella campagna {c}abbiamo venduto {q} t a un prezzo medio di {p}, lo stesso quotato da {r} nelle stesse date e con gli stessi volumi.',
      range: 'In quel periodo il riferimento è oscillato tra {lo} e {hi}; la media semplice è stata {avg}.', missing: '{n} vendita/e senza quotazione di riferimento nei 14 giorni precedenti: escluse dal confronto con {r}.',
      chartT: 'Le vostre vendite rispetto al riferimento', dotNote: 'Ogni punto è una vendita; la dimensione è il volume.', yourSales: 'Le vostre vendite',
      tCols: ['Data', 'Tonnellate', 'Il vostro prezzo'], refDate: 'dato del', print: 'Stampa o salva in PDF', csv: 'Scarica il risultato (CSV)',
      method: 'Come si calcola: per ogni vendita si prende l’ultima quotazione pubblicata per il mercato alla data della vendita o nei 14 giorni precedenti. Il prezzo di riferimento è la media di quelle quotazioni ponderata per le vostre tonnellate, come il vostro prezzo medio. Così si confronta la stessa cosa: stesse date, stessi volumi. Le quotazioni sono quelle pubblicate dalla Commissione europea (Agri-food Data Portal); possono differire dalle vostre vendite per qualità, trasporto e condizioni.',
      src: 'Fonte: Commissione europea, Agri-food Data Portal (quotazioni settimanali). Calcolo di Dehesa Index con le vendite inserite dall’utente.',
      reportT: 'Rapporto di liquidazione', prepared: 'Preparato con Dehesa Index', bad: 'Riga {n} non riconosciuta: «{x}»', okLines: '{n} vendita/e caricate.',
      cta: 'Volete questo rapporto ogni campagna con i vostri riferimenti e per socio? Raccontateci come liquidate.', ctaBtn: 'Scrivici', fail: 'Impossibile caricare i riferimenti. Riprova tra qualche minuto.'
    }
  };
  var COLORS = ['#1f6f8b', '#b5622a', '#6b4fa0'];
  var EPOCH = Date.UTC(2000, 0, 1), DAY = 864e5, MAXGAP = 14;
  var IDX = null, REFS = null, CC = 'ES', PROD = '', SEL = [], PTS = {}, ROWS = [], FAILED = false, MSG = '', COOP = '', CAMP = '', EXAMPLE = false;
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nm(o) { return (o && (o[lang()] || o.es)) || ''; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? '' : o[k]; }); }
  function num(v, d) { if (v == null || !isFinite(v)) return '—'; try { return Number(v).toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return Number(v).toFixed(d); } }
  function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function fdate(s) { return s ? (S.fmtDate ? S.fmtDate(s) : s) : '—'; }
  function cname(c) { try { return new Intl.DisplayNames([lang()], { type: 'region' }).of(c === 'EL' ? 'GR' : c === 'UK' ? 'GB' : c); } catch (e) { return c; } }
  function refKey(r) { return r.file + '|' + (r.mRaw || ''); }
  function refLabel(r) { return (r.market ? nm(r.market) : '') + (r.stage ? (r.market ? ' · ' : '') + nm(r.stage) : ''); }
  function refShort(r) { return r.market ? nm(r.market) : nm(r.stage) || nm(r.product); }
  function unitOf() { var r = REFS && SEL.length ? REFS.filter(function (x) { return refKey(x) === SEL[0]; })[0] : null; return r ? r.unit : '€/t'; }
  function perT(u) { u = String(u || '').replace(/\s/g, ''); return /\/t$/.test(u) ? 1 : /\/100kg$/.test(u) ? 10 : null; } // € por tonelada = precio × factor
  // ---- lectura de números y fechas tal como llegan de Excel en español o en inglés ----
  function pnum(s) {
    s = String(s == null ? '' : s).replace(/[€\s]|EUR/gi, '').replace(/[^\d.,-]/g, '');
    if (!s) return null;
    var c = s.lastIndexOf(','), d = s.lastIndexOf('.');
    if (c > -1 && d > -1) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (c > -1) s = (/^-?\d{1,3}(,\d{3})+$/.test(s) && lang() === 'en') ? s.replace(/,/g, '') : s.replace(',', '.');
    else if (d > -1 && /^-?\d{1,3}(\.\d{3})+$/.test(s) && lang() !== 'en') s = s.replace(/\./g, '');
    var v = parseFloat(s); return isFinite(v) ? v : null;
  }
  function pdate(s) {
    s = String(s || '').trim(); var m;
    if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) return mk(+m[1], +m[2], +m[3]);
    if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/))) { var y = +m[3]; if (y < 100) y += 2000; return lang() === 'en' && +m[1] <= 12 && +m[2] > 12 ? mk(y, +m[1], +m[2]) : mk(y, +m[2], +m[1]); }
    return null;
    function mk(y, mo, d) { if (mo < 1 || mo > 12 || d < 1 || d > 31) return null; var ms = Date.UTC(y, mo - 1, d); return iso(ms) === y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2) ? iso(ms) : null; }
  }
  function parseLines(txt) {
    var out = [], bad = [];
    String(txt || '').split(/\r?\n/).forEach(function (line, i) {
      if (!line.trim()) return;
      var cells = line.indexOf('\t') > -1 ? line.split('\t') : line.indexOf(';') > -1 ? line.split(';') : line.split(/,(?=\s*[^\s])/);
      if (cells.length < 3 && line.indexOf(',') > -1 && line.indexOf(';') < 0) cells = line.split(',');
      cells = cells.map(function (c) { return c.replace(/^"|"$/g, '').trim(); });
      var d = pdate(cells[0]), q = pnum(cells[1]), p = pnum(cells[2]);
      if (!d || q == null || p == null || q <= 0 || p <= 0) { if (i > 0 || !/[a-z]/i.test(line)) bad.push(fill(t().bad, { n: i + 1, x: line.slice(0, 40) })); return; }
      out.push({ d: d, q: q, p: p });
    });
    return { rows: out, bad: bad };
  }
  // ---- referencias ----
  function loadCountry(cc) {
    CC = cc; REFS = null; SEL = []; PROD = ''; render();
    get('data/views/liq-refs/' + cc + '.json').then(function (d) {
      REFS = d.refs || [];
      var prods = products(), pref = prods.filter(function (o) { return o.k === 'cereales|Feed barley'; })[0];
      PROD = pref ? pref.k : prods.length ? prods.slice().sort(function (a, b) { return b.n - a.n; })[0].k : '';
      autoSel(); render();
    }).catch(function () { FAILED = true; render(); });
  }
  function products() {
    var seen = {}, out = [];
    (REFS || []).forEach(function (r) { var k = r.fam + '|' + r.product.en; if (!seen[k]) { seen[k] = 1; out.push({ k: k, r: r, n: 0 }); } });
    (REFS || []).forEach(function (r) { var k = r.fam + '|' + r.product.en; out.forEach(function (o) { if (o.k === k) o.n++; }); });
    return out;
  }
  function prodRefs() { return (REFS || []).filter(function (r) { return r.fam + '|' + r.product.en === PROD; }).sort(function (a, b) { return a.last < b.last ? 1 : a.last > b.last ? -1 : refLabel(a) < refLabel(b) ? -1 : 1; }); }
  function autoSel() { var pr = prodRefs(); SEL = pr.length ? [refKey(pr[0])] : []; ensurePts(); }
  function ensurePts() {
    SEL.forEach(function (k) {
      if (PTS[k]) return;
      var r = REFS.filter(function (x) { return refKey(x) === k; })[0]; if (!r) return;
      PTS[k] = 'loading';
      get(r.file).then(function (d) {
        var reg = (d.regions || []).filter(function (x) { return x.c === CC && (x.m || '') === (r.mRaw || ''); })[0];
        PTS[k] = reg ? reg.d.map(function (dd, i) { return [EPOCH + dd * DAY, reg.v[i]]; }).filter(function (p) { return p[1] != null; }) : [];
        render();
      }).catch(function () { PTS[k] = []; render(); });
    });
  }
  function get(u) { return fetch(S.sitePath(u), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }); }
  // ---- cálculo ----
  function refAt(pts, ms) {
    var lo = 0, hi = pts.length - 1, best = -1;
    while (lo <= hi) { var mid = (lo + hi) >> 1; if (pts[mid][0] <= ms) { best = mid; lo = mid + 1; } else hi = mid - 1; }
    if (best < 0 || (ms - pts[best][0]) / DAY > MAXGAP) return null;
    return pts[best];
  }
  function compute() {
    var rows = ROWS.filter(function (r) { return r.d && r.q > 0 && r.p > 0; }).sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    if (!rows.length) return null;
    var Q = 0, PQ = 0; rows.forEach(function (r) { Q += r.q; PQ += r.p * r.q; });
    var res = { rows: rows, q: Q, p: PQ / Q, from: rows[0].d, to: rows[rows.length - 1].d, refs: [] };
    SEL.forEach(function (k, i) {
      var pts = PTS[k], r = REFS.filter(function (x) { return refKey(x) === k; })[0];
      if (!r || !pts || pts === 'loading') { res.refs.push({ k: k, r: r, loading: true, color: COLORS[i] }); return; }
      var q = 0, rq = 0, pq = 0, miss = 0, per = [];
      rows.forEach(function (s) {
        var hit = refAt(pts, Date.UTC(+s.d.slice(0, 4), +s.d.slice(5, 7) - 1, +s.d.slice(8, 10)));
        per.push(hit);
        if (!hit) { miss++; return; }
        q += s.q; rq += hit[1] * s.q; pq += s.p * s.q;
      });
      var f0 = Date.UTC(+res.from.slice(0, 4), +res.from.slice(5, 7) - 1, +res.from.slice(8, 10)) - MAXGAP * DAY, t0 = Date.UTC(+res.to.slice(0, 4), +res.to.slice(5, 7) - 1, +res.to.slice(8, 10));
      var win = pts.filter(function (p) { return p[0] >= f0 && p[0] <= t0; });
      var vals = win.map(function (p) { return p[1]; });
      res.refs.push({ k: k, r: r, color: COLORS[i], q: q, ref: q ? rq / q : null, own: q ? pq / q : null, miss: miss, per: per, win: win,
        lo: vals.length ? Math.min.apply(null, vals) : null, hi: vals.length ? Math.max.apply(null, vals) : null, avg: vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null });
    });
    return res;
  }
  // ---- gráfico (SVG): líneas de referencia y un punto por venta ----
  function chart(res, w, u) {
    var series = res.refs.filter(function (x) { return x.win && x.win.length; });
    var all = []; series.forEach(function (x) { x.win.forEach(function (p) { all.push(p[1]); }); }); res.rows.forEach(function (r) { all.push(r.p); });
    if (all.length < 2) return '';
    var ms = function (d) { return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)); };
    var x0 = ms(res.from) - 21 * DAY, x1 = ms(res.to) + 10 * DAY;
    series.forEach(function (x) { if (x.win[0][0] < x0) x0 = x.win[0][0]; });
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all), pad = (mx - mn) * 0.12 || mx * 0.05 || 1; mn -= pad; mx += pad;
    var W = 760, H = 280, L = 54, R = 14, Tp = 12, B = 30, pw = W - L - R, ph = H - Tp - B;
    var X = function (v) { return L + (v - x0) / (x1 - x0) * pw; }, Y = function (v) { return Tp + (1 - (v - mn) / (mx - mn)) * ph; };
    var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lq-chart" role="img" aria-label="' + esc(w.chartT) + '">';
    for (var i = 0; i <= 4; i++) { var v = mn + (mx - mn) * i / 4, y = Y(v); h += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--border)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--text-muted)">' + esc(num(v, 0)) + '</text>'; }
    var months = []; var d0 = new Date(x0); var cur = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 1);
    while (cur < x1) { months.push(cur); var dd = new Date(cur); cur = Date.UTC(dd.getUTCFullYear(), dd.getUTCMonth() + 1, 1); }
    var step = Math.max(1, Math.ceil(months.length / 8));
    months.forEach(function (m, j) { if (j % step) return; var x = X(m); var lab; try { lab = new Date(m).toLocaleDateString(lang(), { month: 'short', year: '2-digit', timeZone: 'UTC' }); } catch (e) { lab = iso(m).slice(0, 7); } h += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '" stroke="var(--border)" stroke-dasharray="2 3"/><text x="' + x.toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="var(--text-muted)">' + esc(lab) + '</text>'; });
    series.forEach(function (x) { h += '<path d="' + x.win.map(function (p, k) { return (k ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ') + '" fill="none" stroke="' + x.color + '" stroke-width="2"/>'; });
    var qmax = Math.max.apply(null, res.rows.map(function (r) { return r.q; }));
    res.rows.forEach(function (r) { var rad = 3.5 + 6.5 * Math.sqrt(r.q / qmax); h += '<circle cx="' + X(ms(r.d)).toFixed(1) + '" cy="' + Y(r.p).toFixed(1) + '" r="' + rad.toFixed(1) + '" fill="var(--text)" fill-opacity=".78" stroke="var(--surface)" stroke-width="2"><title>' + esc(fdate(r.d) + ' · ' + num(r.q, 0) + ' t · ' + num(r.p, 2) + ' ' + u) + '</title></circle>'; });
    h += '</svg>';
    var leg = '<div class="lq-leg"><span><i style="background:var(--text);border-radius:50%"></i>' + esc(w.yourSales) + '</span>' + series.map(function (x) { return '<span><i style="background:' + x.color + '"></i>' + esc(refShort(x.r)) + '</span>'; }).join('') + '</div>';
    return '<h3 class="lq-h3">' + esc(w.chartT) + '</h3>' + leg + h + '<p class="lq-m">' + esc(w.dotNote) + '</p>';
  }
  // ---- render ----
  function inputsHtml(w) {
    var u = unitOf();
    var h = '<section class="di-card lq-sec no-print"><h2>' + esc(w.s1) + '</h2><div class="lq-row">';
    h += '<label>' + esc(w.country) + ' <select data-cpick="1" id="lq-c" class="di-compare-select">' + (IDX ? IDX.countries : [{ c: 'ES' }]).map(function (c) { return { c: c.c, n: cname(c.c) }; }).sort(function (a, b) { return a.c === 'ES' ? -1 : b.c === 'ES' ? 1 : a.n < b.n ? -1 : 1; }).map(function (c) { return '<option value="' + c.c + '"' + (c.c === CC ? ' selected' : '') + '>' + esc(c.n) + '</option>'; }).join('') + '</select></label>';
    if (REFS) h += '<label>' + esc(w.product) + ' <select id="lq-p" class="di-compare-select">' + products().map(function (o) { return '<option value="' + esc(o.k) + '"' + (o.k === PROD ? ' selected' : '') + '>' + esc(nm(o.r.product)) + ' (' + o.n + ')</option>'; }).join('') + '</select></label>';
    h += '</div>';
    if (REFS) {
      var refHtml = function (r) {
        var k = refKey(r), on = SEL.indexOf(k) > -1, ci = SEL.indexOf(k);
        return '<label class="lq-ref' + (on ? ' on' : '') + '"><input type="checkbox" data-ref="' + esc(k) + '"' + (on ? ' checked' : '') + (!on && SEL.length >= 3 ? ' disabled' : '') + '>' + (on ? '<i style="background:' + COLORS[ci] + '"></i>' : '') +
          '<span>' + esc(refLabel(r) || nm(r.product)) + '<small>' + esc(r.unit + ' · ' + w.last + ' ' + fdate(r.last)) + '</small></span></label>';
      }, all = prodRefs(), shown = all.filter(function (r, i) { return i < 4 || SEL.indexOf(refKey(r)) > -1; }), rest = all.filter(function (r) { return shown.indexOf(r) < 0; });
      /* lista larga (hasta 11 lonjas): las 4 primeras y las elegidas a la vista; el resto, plegado */
      h += '<div class="lq-lab">' + esc(w.refs) + '</div><div class="lq-refs">' + shown.map(refHtml).join('') + '</div>' +
        (rest.length ? '<details class="ms-more"><summary>' + esc(fill(w.more, { n: rest.length })) + '</summary><div class="lq-refs">' + rest.map(refHtml).join('') + '</div></details>' : '');
    } else if (!FAILED) h += '<p class="lq-m">…</p>';
    h += '</section>';
    h += '<section class="di-card lq-sec no-print"><h2>' + esc(w.s2) + '</h2><p class="lq-m">' + esc(fill(w.s2h, { u: u })) + '</p>';
    h += '<div class="lq-row"><label>' + esc(w.coop) + ' <input id="lq-coop" class="di-compare-select" value="' + esc(COOP) + '"></label><label>' + esc(w.campaign) + ' <input id="lq-camp" class="di-compare-select" placeholder="2025/26" value="' + esc(CAMP) + '"></label></div>';
    h += '<div style="overflow-x:auto"><table class="lq-t" data-no-rows data-no-cards><thead><tr><th>' + esc(w.date) + '</th><th>' + esc(w.qty) + '</th><th>' + esc(w.price) + ' (' + esc(u) + ')</th><th></th></tr></thead><tbody>' +
      ROWS.map(function (r, i) { return '<tr><td><input type="date" data-i="' + i + '" data-f="d" value="' + esc(r.d || '') + '"></td><td><input inputmode="decimal" data-i="' + i + '" data-f="q" value="' + esc(r.q == null ? '' : num(r.q, r.q % 1 ? 2 : 0)) + '"></td><td><input inputmode="decimal" data-i="' + i + '" data-f="p" value="' + esc(r.p == null ? '' : num(r.p, 2)) + '"></td><td><button type="button" class="di-link-btn" data-del="' + i + '">' + esc(w.del) + '</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="lq-row"><button type="button" class="di-link-btn" id="lq-add">+ ' + esc(w.add) + '</button><button type="button" class="di-link-btn" id="lq-ex">' + esc(w.example) + '</button>' + (ROWS.length ? '<button type="button" class="di-link-btn" id="lq-clr">' + esc(w.clear) + '</button>' : '') + '</div>' +
      (EXAMPLE ? '<p class="lq-m" style="color:#8f5f12">' + esc(w.exampleNote) + '</p>' : '') +
      '<details class="lq-paste"><summary>' + esc(w.paste) + '</summary><textarea id="lq-txt" rows="6" placeholder="15/09/2025	1200	228,50"></textarea><div class="lq-row"><button type="button" class="di-btn-gold-solid" id="lq-use">' + esc(w.pasteBtn) + '</button><label class="di-link-btn" style="cursor:pointer">' + esc(w.file) + '<input type="file" id="lq-file" accept=".csv,.txt,text/csv,text/plain" hidden></label></div></details>' +
      (MSG ? '<p class="lq-m">' + esc(MSG) + '</p>' : '') + '<p class="lq-privacy">🔒 ' + esc(w.privacy) + '</p></section>';
    return h;
  }
  function resultHtml(w) {
    var u = unitOf(), f = perT(u);
    var h = '<section class="di-card lq-sec lq-report"><div class="lq-rhead"><div><div class="lq-kicker">' + esc(w.reportT) + (CAMP ? ' · ' + esc(CAMP) : '') + '</div><div class="lq-title">' + esc(COOP || w.s3) + '</div>' + (EXAMPLE ? '<div class="lq-ex-badge">' + esc(w.exampleNote) + '</div>' : '') + '</div><div class="lq-m">' + esc(w.prepared) + ' · ' + esc(fdate(iso(Date.now()))) + '</div></div>';
    if (!SEL.length) return h + '<p>' + esc(w.noref) + '</p></section>';
    var res = compute();
    if (!res) return h + '<p class="lq-m">' + esc(w.none) + '</p><div class="mc-first no-print"><b>' + esc(w.emT) + '</b><p class="di-emp-p">' + esc(w.emP) + '</p><button type="button" class="di-btn-gold-solid" id="lq-ex2">' + esc(w.example) + '</button></div></section>';
    h += '<div class="lq-cards"><div><span>' + esc(w.sold) + '</span><strong>' + esc(num(res.q, 0)) + ' t</strong><small>' + esc(fdate(res.from) + ' → ' + fdate(res.to)) + '</small></div><div><span>' + esc(w.yours) + '</span><strong>' + esc(num(res.p, 2)) + ' ' + esc(u) + '</strong><small>' + esc(w.weighted) + '</small></div></div>';
    var camp = CAMP ? CAMP + ' ' : '';
    res.refs.forEach(function (x) {
      if (x.loading) { h += '<p class="lq-m">' + esc(w.loadingRef) + '</p>'; return; }
      if (!x.q) { h += '<p class="lq-m">' + esc(fill(w.missing, { n: res.rows.length, r: refShort(x.r) })) + '</p>'; return; }
      var d = x.own - x.ref, dp = d / x.ref * 100, dir = Math.abs(d) < 0.005 ? 'eq' : d > 0 ? 'up' : 'down', col = dir === 'up' ? 'var(--positive)' : dir === 'down' ? 'var(--negative)' : 'var(--text-muted)';
      h += '<div class="lq-cmp" style="border-left-color:' + x.color + '"><div class="lq-cmp-h">' + esc(refLabel(x.r)) + '</div><div class="lq-cards">' +
        '<div><span>' + esc(w.refAt) + '</span><strong>' + esc(num(x.ref, 2)) + ' ' + esc(u) + '</strong></div>' +
        '<div><span>' + esc(w.diff) + '</span><strong style="color:' + col + '">' + (d > 0 ? '+' : d < 0 ? '−' : '') + esc(num(Math.abs(d), 2)) + ' ' + esc(u) + '</strong><small>' + (dp > 0 ? '+' : dp < 0 ? '−' : '') + esc(num(Math.abs(dp), 1)) + ' %</small></div>' +
        (f ? '<div><span>' + esc(w.total) + '</span><strong style="color:' + col + '">' + (d > 0 ? '+' : d < 0 ? '−' : '') + esc(num(Math.abs(d) * f * x.q, 0)) + ' €</strong><small>' + esc(num(x.q, 0)) + ' t</small></div>' : '') + '</div>';
      var s = dir === 'eq' ? fill(w.sentEq, { c: camp, q: num(x.q, 0), p: num(x.own, 2) + ' ' + u, r: refShort(x.r) }) :
        fill(w.sent, { c: camp, q: num(x.q, 0), p: num(x.own, 2) + ' ' + u, r: refShort(x.r), rv: num(x.ref, 2) + ' ' + u, d: num(Math.abs(d), 2) + ' ' + u, dir: dir === 'up' ? w.above : w.below, dp: (dp > 0 ? '+' : '−') + num(Math.abs(dp), 1) + ' %' });
      h += '<p class="lq-sent">' + esc(s) + '</p>';
      if (x.lo != null) h += '<p class="lq-m">' + esc(fill(w.range, { lo: num(x.lo, 2) + ' ' + u, hi: num(x.hi, 2) + ' ' + u, avg: num(x.avg, 2) + ' ' + u })) + '</p>';
      if (x.miss) h += '<p class="lq-m" style="color:#8f5f12">' + esc(fill(w.missing, { n: x.miss, r: refShort(x.r) })) + '</p>';
      h += '</div>';
    });
    h += chart(res, w, u);
    var ready = res.refs.filter(function (x) { return x.per; });
    h += '<div style="overflow-x:auto"><table class="lq-t lq-tr" data-no-rows><thead><tr>' + w.tCols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + ready.map(function (x) { return '<th style="color:' + x.color + '">' + esc(refShort(x.r)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      res.rows.map(function (r, i) { return '<tr><td>' + esc(fdate(r.d)) + '</td><td>' + esc(num(r.q, r.q % 1 ? 2 : 0)) + '</td><td>' + esc(num(r.p, 2)) + '</td>' + ready.map(function (x) { var hit = x.per[i]; if (!hit) return '<td class="lq-m">—</td>'; var dd = r.p - hit[1]; return '<td>' + esc(num(hit[1], 2)) + ' <span style="color:' + (dd > 0 ? 'var(--positive)' : dd < 0 ? 'var(--negative)' : 'inherit') + '">(' + (dd > 0 ? '+' : dd < 0 ? '−' : '') + esc(num(Math.abs(dd), 2)) + ')</span><div class="lq-m">' + esc(w.refDate + ' ' + fdate(iso(hit[0]))) + '</div></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    h += '<p class="lq-m">' + esc(w.method) + '</p><p class="lq-m">' + esc(w.src) + '</p>';
    h += '<div class="lq-row no-print"><button type="button" class="di-btn-gold-solid" id="lq-print">' + esc(w.print) + '</button><button type="button" class="di-link-btn" id="lq-csv">' + esc(w.csv) + '</button></div>';
    return h + '</section>';
  }
  function render() {
    var w = t(), root = document.getElementById('lq-body'); if (!root) return;
    document.getElementById('lq-h1').textContent = w.h1; document.getElementById('lq-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    var ae = document.activeElement, focusId = ae && ae.getAttribute ? (ae.id || (ae.getAttribute('data-i') != null ? 'i' + ae.getAttribute('data-i') + ae.getAttribute('data-f') : '')) : '';
    root.innerHTML = inputsHtml(w) + resultHtml(w) + '<section class="di-card di-emp-cta no-print" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.cta) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaBtn) + '</a></section>';
    wire();
    if (focusId) { var el = document.getElementById(focusId) || (focusId.charAt(0) === 'i' ? root.querySelector('[data-i="' + focusId.slice(1, -1) + '"][data-f="' + focusId.slice(-1) + '"]') : null); if (el && el.focus) { try { el.focus(); } catch (e) {} } }
  }
  function wire() {
    var root = document.getElementById('lq-body'), $ = function (id) { return document.getElementById(id); };
    if ($('lq-c')) $('lq-c').onchange = function (e) { loadCountry(e.target.value); };
    if ($('lq-p')) $('lq-p').onchange = function (e) { PROD = e.target.value; autoSel(); render(); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-ref]'), function (cb) { cb.onchange = function () { var k = cb.getAttribute('data-ref'), i = SEL.indexOf(k); if (cb.checked && i < 0 && SEL.length < 3) SEL.push(k); if (!cb.checked && i > -1) SEL.splice(i, 1); ensurePts(); render(); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-i]'), function (inp) { inp.onchange = function () { var r = ROWS[+inp.getAttribute('data-i')], f = inp.getAttribute('data-f'); r[f] = f === 'd' ? (inp.value || null) : pnum(inp.value); EXAMPLE = false; render(); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { ROWS.splice(+b.getAttribute('data-del'), 1); render(); }; });
    if ($('lq-add')) $('lq-add').onclick = function () { var last = ROWS[ROWS.length - 1]; ROWS.push({ d: null, q: null, p: null }); render(); var ins = root.querySelectorAll('[data-f="d"]'); if (ins.length) ins[ins.length - 1].focus(); void last; };
    if ($('lq-clr')) $('lq-clr').onclick = function () { ROWS = []; EXAMPLE = false; MSG = ''; render(); };
    if ($('lq-ex')) $('lq-ex').onclick = example;
    if ($('lq-ex2')) $('lq-ex2').onclick = function () { example(); var r = document.querySelector('.lq-report'); if (r && r.scrollIntoView) { try { r.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { r.scrollIntoView(); } } };
    if ($('lq-coop')) $('lq-coop').oninput = function (e) { COOP = e.target.value; var ti = root.querySelector('.lq-title'); if (ti) ti.textContent = COOP || t().s3; };
    if ($('lq-camp')) $('lq-camp').onchange = function (e) { CAMP = e.target.value; render(); };
    if ($('lq-use')) $('lq-use').onclick = function () { useText($('lq-txt').value); };
    if ($('lq-file')) $('lq-file').onchange = function (e) { var f = e.target.files && e.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { useText(String(rd.result || '')); }; rd.readAsText(f); };
    if ($('lq-print')) $('lq-print').onclick = function () { window.print(); };
    if ($('lq-csv')) $('lq-csv').onclick = downloadCsv;
  }
  function useText(txt) { var r = parseLines(txt); if (r.rows.length) { ROWS = r.rows; EXAMPLE = false; } MSG = fill(t().okLines, { n: r.rows.length }) + (r.bad.length ? ' ' + r.bad.slice(0, 3).join(' · ') + (r.bad.length > 3 ? ' …' : '') : ''); render(); }
  // Ejemplo: fechas reales de la referencia elegida y cifras de venta INVENTADAS (se avisa en pantalla).
  function example() {
    var k = SEL[0], pts = PTS[k]; if (!pts || pts === 'loading' || pts.length < 30) return;
    var tail = pts.slice(-40), picks = [2, 8, 14, 20, 27, 34].filter(function (i) { return i < tail.length; });
    var vol = [850, 1400, 620, 2100, 980, 1300], off = [-4.2, -1.5, -6.8, 2.1, -3.4, -2.6];
    ROWS = picks.map(function (i, j) { return { d: iso(tail[i][0] + 2 * DAY), q: vol[j], p: Math.round((tail[i][1] + off[j]) * 100) / 100 }; });
    EXAMPLE = true; MSG = ''; render();
  }
  function downloadCsv() {
    var res = compute(); if (!res) return; var w = t(), u = unitOf();
    var ready = res.refs.filter(function (x) { return x.per; });
    var lines = [['date', 'tonnes', 'price_' + u].concat(ready.reduce(function (a, x) { var n = refShort(x.r); return a.concat([n + ' (' + u + ')', n + ' date', n + ' diff']); }, []))];
    res.rows.forEach(function (r, i) { lines.push([r.d, r.q, r.p].concat(ready.reduce(function (a, x) { var hit = x.per[i]; return a.concat(hit ? [hit[1], iso(hit[0]), Math.round((r.p - hit[1]) * 100) / 100] : ['', '', '']); }, []))); });
    lines.push([]); lines.push(['# ' + w.src]);
    var csv = '﻿' + lines.map(function (l) { return l.map(function (c) { c = String(c == null ? '' : c); return /[",;\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'liquidacion-dehesa-index.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  S.init('data');
  S.onLangChange = render;
  render();
  get('data/views/liq-refs/index.json').then(function (d) { IDX = d; render(); }).catch(function () {});
  loadCountry('ES');
})();
