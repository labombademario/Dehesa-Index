/* Dehesa Index — Informe de negociación: un producto, todos sus mercados, listo para imprimir o guardar en PDF.
   Lee la API publica (data/api/v1, solo fuentes con licencia apta) y el clima (data/climate.json). Todo se calcula en el navegador;
   nada se estima: sin dato = no aparece. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: {
      title: 'Informe de negociación', h1: 'Informe de negociación de un producto',
      sub: 'Elige un producto y obtén en un clic su precio actual, cómo ha cambiado, cómo se compara con otros mercados y con los últimos cinco años, y el clima de las zonas productoras. Cada cifra lleva su fuente y licencia. Se imprime o se guarda en PDF.',
      loading: 'Cargando…', fail: 'No se pudieron cargar los datos. Vuelve a intentarlo en unos minutos.', product: 'Producto', coop: 'Tu nombre o empresa (opcional, solo en el informe)', print: 'Imprimir o guardar en PDF', copy: 'Copiar enlace', copied: 'Enlace copiado',
      rep: 'Informe de negociación', prepared: 'Preparado el', dataAsOf: 'Datos a fecha de', by: 'Preparado por',
      kT: 'Precio y variación por mercado', cols: ['Mercado', 'Último precio', 'Semana o periodo anterior', 'Hace un año', 'Rango 12 meses', 'Frente a 5 años'],
      pos: 'más caro que el {x} % de los datos', prev: 'periodo anterior', na: 'sin dato', range: '{a} – {b}',
      cT: 'Evolución (últimos 3 años)', pT: 'Para la mesa de negociación',
      pS: '{n} ({p}): {v} {u} el {d}. {c12} {pos}', c12up: 'Es un {x} % más que hace un año.', c12dn: 'Es un {x} % menos que hace un año.', c12eq: 'Está igual que hace un año.', c12no: 'No hay dato de hace un año para comparar.', posS: 'Está más caro que el {x} % de los datos de los últimos cinco años.', posNo: 'No hay cinco años de datos suficientes para situarlo.',
      mT: 'Comparación entre mercados', mN: 'Las unidades y monedas son distintas, así que se comparan variaciones, no precios. Lee la nota de cada serie antes de sacar conclusiones.', mCols: ['Mercado', 'Variación en 12 meses', 'Último dato'], mOne: 'Este producto solo tiene un mercado en la API; no hay con qué compararlo.',
      wT: 'Clima de las zonas productoras', wN: 'Último mes disponible frente a la media 2001-2020 del mismo mes (NASA POWER). Una anomalía de lluvia negativa es menos lluvia de la habitual.', wCols: ['Zona', 'Mes', 'Lluvia frente a lo normal', 'Temperatura frente a lo normal'], wNone: 'No tenemos una zona climática asociada a este producto.',
      sT: 'Fuentes y licencias', sCols: ['Mercado', 'Fuente', 'Licencia', 'Uso comercial', 'Qué mide'], v: { apto: 'Apto', condiciones: 'Con condiciones' },
      mtT: 'Cómo se calcula', mt: ['La variación a 12 meses compara el último dato con el más cercano a un año antes (con un margen de tolerancia según la frecuencia). Si no hay dato, no se calcula.', 'La posición frente a 5 años es el porcentaje de datos de los últimos cinco años que son iguales o más baratos que el actual. No es una previsión.', 'Los datos son los de cada fuente, sin estimar ni rellenar huecos. Cita la fuente con el texto de atribución. Esto no es asesoramiento financiero ni jurídico.'],
      M: { us: 'EE. UU.', eu: 'Unión Europea', uk: 'Reino Unido', ca: 'Canadá' }, up: 'sube', down: 'baja', per: { weekly: 'semanal', monthly: 'mensual', daily: 'diaria', quarterly: 'trimestral' },
      more: 'Más datos de este producto', ctaT: '¿Lo quieres con tus propios datos de compra o venta?', ctaB: 'Escríbenos', cmp: 'Comparar mis facturas con el mercado'
    },
    en: {
      title: 'Negotiation report', h1: 'Negotiation report for one product',
      sub: 'Pick a product and get, in one click, its current price, how it has changed, how it compares with other markets and with the last five years, and the weather in the growing areas. Every figure carries its source and licence. Print it or save it as a PDF.',
      loading: 'Loading…', fail: 'Could not load the data. Please try again in a few minutes.', product: 'Product', coop: 'Your name or company (optional, report only)', print: 'Print or save as PDF', copy: 'Copy link', copied: 'Link copied',
      rep: 'Negotiation report', prepared: 'Prepared on', dataAsOf: 'Data as of', by: 'Prepared by',
      kT: 'Price and change by market', cols: ['Market', 'Latest price', 'Previous period', 'A year ago', '12-month range', 'Against 5 years'],
      pos: 'higher than {x}% of the data', prev: 'previous period', na: 'no data', range: '{a} – {b}',
      cT: 'Trend (last 3 years)', pT: 'For the negotiating table',
      pS: '{n} ({p}): {v} {u} on {d}. {c12} {pos}', c12up: 'That is {x}% more than a year ago.', c12dn: 'That is {x}% less than a year ago.', c12eq: 'It is the same as a year ago.', c12no: 'There is no figure from a year ago to compare with.', posS: 'It is higher than {x}% of the data from the last five years.', posNo: 'There are not enough years of data to place it.',
      mT: 'Comparison between markets', mN: 'Units and currencies differ, so changes are compared, not prices. Read each series’ note before drawing conclusions.', mCols: ['Market', '12-month change', 'Latest data'], mOne: 'This product has only one market in the API; there is nothing to compare it with.',
      wT: 'Weather in the growing areas', wN: 'Latest available month against the 2001-2020 average for the same month (NASA POWER). A negative rain anomaly means less rain than usual.', wCols: ['Area', 'Month', 'Rain against normal', 'Temperature against normal'], wNone: 'We have no weather area linked to this product.',
      sT: 'Sources and licences', sCols: ['Market', 'Source', 'Licence', 'Commercial use', 'What it measures'], v: { apto: 'Fit', condiciones: 'With conditions' },
      mtT: 'How it is calculated', mt: ['The 12-month change compares the latest data point with the one closest to a year earlier (within a tolerance that depends on frequency). If there is none, it is not calculated.', 'The 5-year position is the share of the last five years’ data that is equal to or cheaper than the current figure. It is not a forecast.', 'Data are each source’s own, with no estimates and no gap filling. Credit the source with its attribution text. This is not financial or legal advice.'],
      M: { us: 'United States', eu: 'European Union', uk: 'United Kingdom', ca: 'Canada' }, up: 'up', down: 'down', per: { weekly: 'weekly', monthly: 'monthly', daily: 'daily', quarterly: 'quarterly' },
      more: 'More data on this product', ctaT: 'Want it with your own purchase or sales data?', ctaB: 'Contact us', cmp: 'Compare my invoices with the market'
    },
    fr: {
      title: 'Rapport de négociation', h1: 'Rapport de négociation pour un produit',
      sub: 'Choisissez un produit et obtenez en un clic son prix actuel, son évolution, sa comparaison avec d’autres marchés et avec les cinq dernières années, et la météo des zones de production. Chaque chiffre porte sa source et sa licence. À imprimer ou à enregistrer en PDF.',
      loading: 'Chargement…', fail: 'Impossible de charger les données. Réessayez dans quelques minutes.', product: 'Produit', coop: 'Votre nom ou entreprise (facultatif, rapport seulement)', print: 'Imprimer ou enregistrer en PDF', copy: 'Copier le lien', copied: 'Lien copié',
      rep: 'Rapport de négociation', prepared: 'Préparé le', dataAsOf: 'Données au', by: 'Préparé par',
      kT: 'Prix et évolution par marché', cols: ['Marché', 'Dernier prix', 'Période précédente', 'Il y a un an', 'Fourchette 12 mois', 'Face à 5 ans'],
      pos: 'plus cher que {x} % des données', prev: 'période précédente', na: 'pas de donnée', range: '{a} – {b}',
      cT: 'Évolution (3 dernières années)', pT: 'Pour la table de négociation',
      pS: '{n} ({p}) : {v} {u} le {d}. {c12} {pos}', c12up: 'Soit {x} % de plus qu’il y a un an.', c12dn: 'Soit {x} % de moins qu’il y a un an.', c12eq: 'Identique à il y a un an.', c12no: 'Pas de donnée d’il y a un an pour comparer.', posS: 'Il est plus cher que {x} % des données des cinq dernières années.', posNo: 'Pas assez d’années de données pour le situer.',
      mT: 'Comparaison entre marchés', mN: 'Les unités et les monnaies diffèrent : on compare des variations, pas des prix. Lisez la note de chaque série avant de conclure.', mCols: ['Marché', 'Variation sur 12 mois', 'Dernière donnée'], mOne: 'Ce produit n’a qu’un marché dans l’API ; rien à comparer.',
      wT: 'Météo des zones de production', wN: 'Dernier mois disponible face à la moyenne 2001-2020 du même mois (NASA POWER). Une anomalie de pluie négative signifie moins de pluie que d’habitude.', wCols: ['Zone', 'Mois', 'Pluie face à la normale', 'Température face à la normale'], wNone: 'Nous n’avons pas de zone climatique liée à ce produit.',
      sT: 'Sources et licences', sCols: ['Marché', 'Source', 'Licence', 'Usage commercial', 'Ce que mesure la série'], v: { apto: 'Apte', condiciones: 'Sous conditions' },
      mtT: 'Comment c’est calculé', mt: ['La variation sur 12 mois compare la dernière donnée à celle la plus proche d’un an plus tôt (avec une tolérance selon la fréquence). Sans donnée, pas de calcul.', 'La position face à 5 ans est la part des données des cinq dernières années égales ou moins chères que le chiffre actuel. Ce n’est pas une prévision.', 'Les données sont celles de chaque source, sans estimation ni comblement des trous. Citez la source avec son texte d’attribution. Ceci n’est pas un conseil financier ni juridique.'],
      M: { us: 'États-Unis', eu: 'Union européenne', uk: 'Royaume-Uni', ca: 'Canada' }, up: 'hausse', down: 'baisse', per: { weekly: 'hebdomadaire', monthly: 'mensuelle', daily: 'quotidienne', quarterly: 'trimestrielle' },
      more: 'Plus de données sur ce produit', ctaT: 'Vous le voulez avec vos propres données d’achat ou de vente ?', ctaB: 'Nous écrire', cmp: 'Comparer mes factures au marché'
    },
    it: {
      title: 'Rapporto di negoziazione', h1: 'Rapporto di negoziazione per un prodotto',
      sub: 'Scegli un prodotto e ottieni in un clic il prezzo attuale, come è cambiato, il confronto con altri mercati e con gli ultimi cinque anni, e il meteo delle zone produttive. Ogni cifra riporta fonte e licenza. Si stampa o si salva in PDF.',
      loading: 'Caricamento…', fail: 'Impossibile caricare i dati. Riprova tra qualche minuto.', product: 'Prodotto', coop: 'Il tuo nome o azienda (facoltativo, solo nel rapporto)', print: 'Stampa o salva in PDF', copy: 'Copia il link', copied: 'Link copiato',
      rep: 'Rapporto di negoziazione', prepared: 'Preparato il', dataAsOf: 'Dati al', by: 'Preparato da',
      kT: 'Prezzo e variazione per mercato', cols: ['Mercato', 'Ultimo prezzo', 'Periodo precedente', 'Un anno fa', 'Intervallo 12 mesi', 'Rispetto a 5 anni'],
      pos: 'più caro del {x}% dei dati', prev: 'periodo precedente', na: 'nessun dato', range: '{a} – {b}',
      cT: 'Andamento (ultimi 3 anni)', pT: 'Per il tavolo di negoziazione',
      pS: '{n} ({p}): {v} {u} il {d}. {c12} {pos}', c12up: 'È il {x}% in più di un anno fa.', c12dn: 'È il {x}% in meno di un anno fa.', c12eq: 'È uguale a un anno fa.', c12no: 'Non c’è un dato di un anno fa da confrontare.', posS: 'È più caro del {x}% dei dati degli ultimi cinque anni.', posNo: 'Non ci sono abbastanza anni di dati per collocarlo.',
      mT: 'Confronto tra mercati', mN: 'Unità e valute sono diverse, quindi si confrontano le variazioni, non i prezzi. Leggi la nota di ogni serie prima di trarre conclusioni.', mCols: ['Mercato', 'Variazione a 12 mesi', 'Ultimo dato'], mOne: 'Questo prodotto ha un solo mercato nell’API; non c’è nulla con cui confrontarlo.',
      wT: 'Meteo delle zone produttive', wN: 'Ultimo mese disponibile rispetto alla media 2001-2020 dello stesso mese (NASA POWER). Un’anomalia di pioggia negativa significa meno pioggia del solito.', wCols: ['Zona', 'Mese', 'Pioggia rispetto alla norma', 'Temperatura rispetto alla norma'], wNone: 'Non abbiamo una zona climatica legata a questo prodotto.',
      sT: 'Fonti e licenze', sCols: ['Mercato', 'Fonte', 'Licenza', 'Uso commerciale', 'Cosa misura'], v: { apto: 'Idoneo', condiciones: 'Con condizioni' },
      mtT: 'Come si calcola', mt: ['La variazione a 12 mesi confronta l’ultimo dato con quello più vicino a un anno prima (con una tolleranza secondo la frequenza). Se manca, non si calcola.', 'La posizione rispetto a 5 anni è la quota dei dati degli ultimi cinque anni uguali o più economici della cifra attuale. Non è una previsione.', 'I dati sono quelli di ogni fonte, senza stime né riempimento dei vuoti. Cita la fonte con il suo testo di attribuzione. Questa non è consulenza finanziaria né legale.'],
      M: { us: 'Stati Uniti', eu: 'Unione europea', uk: 'Regno Unito', ca: 'Canada' }, up: 'sale', down: 'scende', per: { weekly: 'settimanale', monthly: 'mensile', daily: 'giornaliera', quarterly: 'trimestrale' },
      more: 'Altri dati su questo prodotto', ctaT: 'Lo vuoi con i tuoi dati di acquisto o vendita?', ctaB: 'Scrivici', cmp: 'Confronta le mie fatture con il mercato'
    }
  };
  var IDX = null, LAT = null, CLI = null, SER = {}, FAILED = false, PROD = '', COOP = '', LOADING = 0;
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n, d) { try { return Number(n).toLocaleString(lang(), { maximumFractionDigits: d == null ? 2 : d }); } catch (e) { return String(n); } }
  function nm(o, k) { return (o && (o[lang()] || o.es)) || k || ''; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? m : o[k]; }); }
  function toT(d) {
    var m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d))) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(\d{4})-(\d{2})$/.exec(d))) return Date.UTC(+m[1], +m[2] - 1, 15);
    if ((m = /^(\d{4})-Q(\d)$/.exec(d))) return Date.UTC(+m[1], (+m[2] - 1) * 3 + 1, 15);
    return NaN;
  }
  var DAY = 86400000, TOL = { daily: 20, weekly: 20, monthly: 45, quarterly: 100 };
  function nearest(pts, target, tolDays) {
    var best = null, bd = 1e18, i, dd;
    for (i = 0; i < pts.length; i++) { dd = Math.abs(toT(pts[i][0]) - target); if (dd < bd) { bd = dd; best = pts[i]; } }
    return best && bd <= tolDays * DAY ? best : null;
  }
  function stats(s) {
    var pts = s.points, last = pts[pts.length - 1], tl = toT(last[0]), o = { last: last };
    var ago = nearest(pts, tl - 365 * DAY, TOL[s.frequency] || 45);
    o.ago = ago; o.chg12 = ago && ago[1] ? (last[1] / ago[1] - 1) * 100 : null;
    var y1 = pts.filter(function (p) { return toT(p[0]) > tl - 365 * DAY; });
    if (y1.length > 1) o.range = [Math.min.apply(null, y1.map(function (p) { return p[1]; })), Math.max.apply(null, y1.map(function (p) { return p[1]; }))];
    var w5 = pts.filter(function (p) { return toT(p[0]) > tl - 5 * 365.25 * DAY; });
    var first = pts[0] && toT(pts[0][0]);
    if (w5.length >= 24 && first <= tl - 4.5 * 365.25 * DAY) o.pos = Math.round(w5.filter(function (p) { return p[1] <= last[1]; }).length / w5.length * 100);
    return o;
  }
  function chart(s) {
    var tl = toT(s.points[s.points.length - 1][0]), pts = s.points.filter(function (p) { return toT(p[0]) > tl - 3 * 365.25 * DAY; });
    if (pts.length < 3) return '';
    var W = 560, H = 120, P = 6, lo = Infinity, hi = -Infinity, t0 = toT(pts[0][0]), t1 = toT(pts[pts.length - 1][0]), i;
    for (i = 0; i < pts.length; i++) { lo = Math.min(lo, pts[i][1]); hi = Math.max(hi, pts[i][1]); }
    if (hi === lo) hi = lo + 1;
    var d = pts.map(function (p, k) { return (k ? 'L' : 'M') + (P + (toT(p[0]) - t0) / (t1 - t0 || 1) * (W - 2 * P)).toFixed(1) + ' ' + (H - P - (p[1] - lo) / (hi - lo) * (H - 2 * P)).toFixed(1); }).join('');
    var lx = W - P, ly = H - P - (pts[pts.length - 1][1] - lo) / (hi - lo) * (H - 2 * P);
    return '<svg viewBox="0 0 ' + W + ' ' + (H + 14) + '" role="img" aria-label="' + esc(nm(s.name) + ' ' + pts[0][0] + ' → ' + pts[pts.length - 1][0]) + '" style="width:100%;max-width:560px;height:auto"><path d="' + d + '" fill="none" stroke="#1f5c3a" stroke-width="2" stroke-linejoin="round"/><circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="3.5" fill="#1f5c3a" stroke="#fff" stroke-width="2"/>' +
      '<text x="' + P + '" y="' + (H + 11) + '" font-size="10" fill="#6b6b6b">' + esc(pts[0][0]) + ' · ' + nf(lo) + '–' + nf(hi) + '</text><text x="' + (W - P) + '" y="' + (H + 11) + '" font-size="10" fill="#6b6b6b" text-anchor="end">' + esc(pts[pts.length - 1][0]) + '</text></svg>';
  }
  function mk(w, s) { return w.M[s.region] || s.region; }
  function place(s) { var p = nm(s.place); return p && p !== (T[lang()].M[s.region] || '') ? p : ''; }
  function products() {
    var seen = {}, out = [];
    IDX.series.forEach(function (s) { if (!seen[s.product]) { seen[s.product] = 1; out.push({ k: s.product, n: nm(s.name, s.product) }); } });
    out.sort(function (a, b) { return a.n.localeCompare(b.n, lang()); });
    return out;
  }
  function need() {
    IDX.series.filter(function (s) { return s.product === PROD && !SER[s.id]; }).forEach(function (s) {
      SER[s.id] = 'loading'; LOADING++;
      fetch(S.sitePath('data/api/v1/series/' + s.id + '.json')).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) { SER[s.id] = d; }).catch(function () { delete SER[s.id]; FAILED = true; }).then(function () { LOADING--; render(); });
    });
  }
  function th(c) { return '<th style="padding:6px 6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600">' + esc(c) + '</th>'; }
  function table(cols, rows) { return '<div style="overflow-x:auto"><table data-no-rows class="ic-t" style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>' + cols.map(th).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function td(x, st) { return '<td style="padding:6px;border-top:1px solid var(--border);vertical-align:top;' + (st || '') + '">' + x + '</td>'; }
  function climateHtml(w) {
    var locs = CLI ? CLI.locations.filter(function (l) { return l.crops.indexOf(PROD) > -1 && l.months && l.months.length; }) : [];
    if (!locs.length) return '<p class="di-movers-hint">' + esc(w.wNone) + '</p>';
    var rows = locs.slice(0, 10).map(function (l) {
      var m = l.months[l.months.length - 1], pa = m.precipAnomalyPct, ta = m.tempAnomalyC;
      return '<tr>' + td('<b>' + esc(l.name) + '</b>') + td(esc(m.period)) + td(pa == null ? esc(w.na) : (pa > 0 ? '+' : '') + nf(pa, 0) + ' %') + td(ta == null ? esc(w.na) : (ta > 0 ? '+' : '') + nf(ta, 1) + ' °C') + '</tr>';
    });
    return '<p class="di-movers-hint">' + esc(w.wN) + '</p>' + table(w.wCols, rows) + '<p class="di-movers-hint">NASA POWER (MERRA-2). ' + esc(CLI.source && CLI.source.license || '') + '</p>';
  }
  function render() {
    var w = t(), root = document.getElementById('nb-body'); if (!root) return;
    document.getElementById('nb-h1').textContent = w.h1; document.getElementById('nb-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    if (FAILED && !IDX) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!IDX || !LAT) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.loading) + '</p>'; return; }
    var prods = products(); if (!PROD || !prods.some(function (p) { return p.k === PROD; })) PROD = prods.some(function (p) { return p.k === 'trigo'; }) ? 'trigo' : prods[0].k;
    need();
    var ss = IDX.series.filter(function (s) { return s.product === PROD; }), data = ss.map(function (s) { return SER[s.id]; });
    var ready = data.every(function (d) { return d && d !== 'loading'; });
    var h = '<div class="no-print" style="display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-bottom:14px"><label style="font-size:13px">' + esc(w.product) + '<br><select id="nb-p" class="di-compare-select" style="width:auto;min-width:200px">' +
      prods.map(function (p) { return '<option value="' + esc(p.k) + '"' + (p.k === PROD ? ' selected' : '') + '>' + esc(p.n) + '</option>'; }).join('') + '</select></label>' +
      '<label style="font-size:13px">' + esc(w.coop) + '<br><input id="nb-c" class="di-compare-select" style="min-width:240px;width:auto" value="' + esc(COOP) + '"></label>' +
      '<button id="nb-print" class="di-btn-gold-solid" type="button">' + esc(w.print) + '</button><button id="nb-copy" class="di-btn-sec" type="button">' + esc(w.copy) + '</button></div>';
    if (!ready) { root.innerHTML = h + '<p class="di-movers-hint">' + esc(w.loading) + '</p>'; bind(); return; }
    var rows = [], pitch = [], cmp = [], ch = '', src = [], asof = '';
    var L = {}; LAT.series.forEach(function (x) { L[x.id] = x; });
    data.forEach(function (s) {
      var st = stats(s), lt = L[s.id] || {}, u = s.unit + ' ' + s.currency, pl = place(s);
      if (!asof || st.last[0] > asof) asof = st.last[0];
      s._st = st;
      rows.push('<tr>' + td('<b>' + esc(mk(w, s)) + '</b>' + (pl ? '<div style="font-size:11.5px;color:var(--text-muted)">' + esc(pl) + '</div>' : '') + '<div style="font-size:11.5px;color:var(--text-muted)">' + esc(w.per[s.frequency] || s.frequency) + '</div>') +
        td('<b>' + nf(st.last[1]) + '</b> ' + esc(u) + '<div style="font-size:11.5px;color:var(--text-muted)">' + esc(st.last[0]) + '</div>') +
        td(lt.previous != null ? nf(lt.previous) + (lt.changePct != null ? '<div style="font-size:11.5px;color:var(--text-muted)">' + (lt.changePct > 0 ? '+' : '') + nf(lt.changePct) + ' % ' + esc(lt.previousDate || '') + '</div>' : '') : esc(w.na)) +
        td(st.ago ? nf(st.ago[1]) + '<div style="font-size:11.5px;color:var(--text-muted)">' + (st.chg12 > 0 ? '+' : '') + nf(st.chg12, 1) + ' % · ' + esc(st.ago[0]) + '</div>' : esc(w.na)) +
        td(st.range ? esc(fill(w.range, { a: nf(st.range[0]), b: nf(st.range[1]) })) : esc(w.na)) +
        td(st.pos != null ? esc(fill(w.pos, { x: st.pos })) : esc(w.na)) + '</tr>');
      ch += '<div style="margin:10px 0;break-inside:avoid"><div style="font-size:13px;font-weight:600">' + esc(mk(w, s)) + (pl ? ' · ' + esc(pl) : '') + ' — ' + esc(u) + '</div>' + chart(s) + '</div>';
      var c12 = st.chg12 == null ? w.c12no : (Math.abs(st.chg12) < 0.05 ? w.c12eq : fill(st.chg12 > 0 ? w.c12up : w.c12dn, { x: nf(Math.abs(st.chg12), 1) }));
      pitch.push('<li style="margin:6px 0">' + esc(fill(w.pS, { n: nm(s.name, s.product), p: mk(w, s) + (pl ? ', ' + pl : ''), v: nf(st.last[1]), u: u, d: st.last[0], c12: c12, pos: st.pos != null ? fill(w.posS, { x: st.pos }) : w.posNo })) + '</li>');
      cmp.push({ s: s, c: st.chg12 });
      src.push('<tr>' + td('<b>' + esc(mk(w, s)) + '</b>') + td(esc(s.sourceName)) + td(esc(s.license)) + td(esc(w.v[s.verdict] || s.verdict)) + td('<div style="font-size:12px">' + esc(nm(s.note) || '') + '</div><div style="font-size:11.5px;color:var(--text-muted);margin-top:3px">' + esc(s.attribution) + '</div>') + '</tr>');
    });
    var today = new Date().toISOString().slice(0, 10);
    h += '<article class="ic-sheet di-card" style="padding:18px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><div><div style="font-size:12px;color:var(--text-muted)">' + esc(w.rep) + '</div><h2 style="margin:2px 0;font-size:24px">' + esc(nm(ss[0].name, PROD)) + '</h2>' +
      (COOP ? '<div style="font-size:13px">' + esc(w.by) + ': <b>' + esc(COOP) + '</b></div>' : '') + '</div><div style="font-size:12px;color:var(--text-muted);text-align:right">' + esc(w.prepared) + ' ' + esc(today) + '<br>' + esc(w.dataAsOf) + ' ' + esc(asof) + '<br>dehesaindex.com</div></div>';
    h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.kT) + '</h3>' + table(w.cols, rows);
    h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.pT) + '</h3><ul style="margin:0;padding-left:18px;font-size:14px">' + pitch.join('') + '</ul>';
    h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.cT) + '</h3>' + ch;
    h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.mT) + '</h3>';
    if (cmp.length < 2) h += '<p class="di-movers-hint">' + esc(w.mOne) + '</p>';
    else {
      cmp.sort(function (a, b) { return (b.c == null ? -1e9 : b.c) - (a.c == null ? -1e9 : a.c); });
      h += '<p class="di-movers-hint">' + esc(w.mN) + '</p>' + table(w.mCols, cmp.map(function (x) { return '<tr>' + td('<b>' + esc(mk(w, x.s)) + '</b>') + td(x.c == null ? esc(w.na) : (x.c > 0 ? '+' : '') + nf(x.c, 1) + ' %') + td(esc(x.s._st.last[0])) + '</tr>'; }));
    }
    h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.wT) + '</h3>' + climateHtml(w);
    h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.sT) + '</h3>' + table(w.sCols, src);
    h += '<h3 style="margin:18px 0 6px;font-size:16px">' + esc(w.mtT) + '</h3>' + w.mt.map(function (p) { return '<p class="ic-foot" style="font-size:12px">' + esc(p) + '</p>'; }).join('') + '</article>';
    h += '<p class="di-movers-hint no-print"><a href="producto.html?p=' + encodeURIComponent(PROD) + '">' + esc(w.more) + '</a> · <a href="mi-explotacion.html">' + esc(w.cmp) + '</a></p>';
    h += '<section class="di-card di-emp-cta no-print" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.ctaT) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaB) + '</a></section>';
    root.innerHTML = h; bind();
  }
  function bind() {
    var w = t(), p = document.getElementById('nb-p'), c = document.getElementById('nb-c');
    if (p) p.onchange = function (e) { PROD = e.target.value; try { history.replaceState(null, '', '?p=' + encodeURIComponent(PROD)); } catch (x) {} render(); };
    if (c) c.onchange = function (e) { COOP = e.target.value; render(); };
    var pr = document.getElementById('nb-print'); if (pr) pr.onclick = function () { window.print(); };
    var cp = document.getElementById('nb-copy');
    if (cp) cp.onclick = function () { var u = location.origin + location.pathname + '?p=' + encodeURIComponent(PROD); try { navigator.clipboard.writeText(u).then(function () { cp.textContent = w.copied; }); } catch (x) {} };
  }
  var qp = /[?&]p=([^&]+)/.exec(location.search); if (qp) PROD = decodeURIComponent(qp[1]);
  S.init('data');
  S.onLangChange = render;
  render();
  function J(u) { return fetch(S.sitePath(u)).then(function (r) { return r.ok ? r.json() : Promise.reject(); }); }
  J('data/api/v1/index.json').then(function (d) { IDX = d; return J('data/api/v1/latest.json'); }).then(function (d) { LAT = d; render(); }).catch(function () { FAILED = true; render(); });
  J('data/climate.json').then(function (d) { CLI = d; render(); }).catch(function () {});
})();
