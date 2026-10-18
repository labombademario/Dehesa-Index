/* Dehesa Index — Monitor de insumos para cooperativas. Lee data/views/input-monitor.json (scripts/build-input-monitor.py).
   Precio actual de fertilizantes, piensos y gasóleo en España frente a sus últimos 10 años (percentil, mínimo, máximo, media)
   y relación grano/fertilizante. Es una posición histórica, no una previsión ni una recomendación de compra. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: { barShort: 'Cuánto fertilizante', barT: 'En esta página', seeChart: 'Ver gráfico',
      title: 'Monitor de insumos', h1: 'Monitor de insumos: ¿está caro o barato?',
      sub: 'El precio que pagan los agricultores en España por fertilizantes, piensos y gasóleo, comparado con sus propios últimos 10 años. Y cuánto fertilizante se compra hoy con el grano. Sirve para preparar la compra agrupada de la cooperativa con datos oficiales en la mano.',
      loading: 'Cargando…', fail: 'No se pudo cargar el monitor. Vuelve a intentarlo en unos minutos.', asof: 'Datos a fecha de',
      howT: 'Cómo leerlo', how: 'El percentil dice en qué parte de su historia está el precio de hoy: 86 significa que el precio actual es igual o más caro que el 86 % de los meses de los últimos 10 años. No es una previsión: dice dónde estamos, no hacia dónde vamos.',
      rT: 'Cuánto fertilizante compra el grano', rS: 'Kilos de fertilizante que se pagan con 100 kg de grano, con los precios del mismo mes (precio percibido del grano y precio pagado del fertilizante, ambos del Ministerio). Cuanto más alto, más fertilizante compra la cosecha.',
      grain: 'Grano', rCols: ['Fertilizante', 'Con 100 kg de grano', 'Posición en 10 años', 'Peor mes', 'Mejor mes'], kg: 'kg',
      rLow: 'de los meses menos favorables', rMid: 'en la zona media', rHigh: 'de los meses más favorables',
      g: { nitrogen: 'Abonos nitrogenados', pk: 'Fósforo y potasio', compound: 'Abonos complejos', feed: 'Piensos y forrajes', energy: 'Energía' },
      cols: ['Insumo', 'Último precio', 'En un año', 'Posición en 10 años', 'Mínimo', 'Máximo', 'Evolución'],
      worse: 'peor', better: 'mejor', cheap: 'barato', dear: 'caro', pctOf: 'percentil', yrs: 'años de historia', late: 'dato retrasado', since: 'desde',
      note: ['Fertilizantes y piensos: precios pagados por los agricultores a la entrada de la explotación, media nacional, sin IVA, en €/100 kg (Ministerio de Agricultura, Pesca y Alimentación). Son medias nacionales: el precio de tu proveedor puede ser distinto.',
        'Gasóleo: precio de surtidor del gasóleo de automoción en España, con impuestos (Weekly Oil Bulletin de la Comisión Europea). No es el gasóleo agrícola (gasóleo B), que lleva otra fiscalidad; sirve para ver la tendencia. Su histórico empieza en 2021, así que la posición se calcula sobre 5 años.',
        'Nada se estima ni se rellena: si un dato llega tarde, se muestra con su fecha y la etiqueta «dato retrasado».'],
      cta: '¿Quieres este monitor con los insumos que compra tu cooperativa y un aviso cuando un precio baje de un umbral? Cuéntanos qué necesitas.', ctaBtn: 'Escríbenos'
    },
    en: { barShort: 'Fertiliser purchasing power', barT: 'On this page', seeChart: 'View chart',
      title: 'Input monitor', h1: 'Input monitor: expensive or cheap?',
      sub: 'What Spanish farmers pay for fertiliser, feed and diesel, compared with their own last 10 years, and how much fertiliser grain buys today. Use it to prepare the cooperative’s group purchase with official data at hand.',
      loading: 'Loading…', fail: 'Could not load the monitor. Please try again in a few minutes.', asof: 'Data as of',
      howT: 'How to read it', how: 'The percentile shows where today’s price sits in its own history: 86 means the current price is equal to or higher than 86% of the months in the last 10 years. It is not a forecast: it says where we are, not where we are going.',
      rT: 'How much fertiliser grain buys', rS: 'Kilos of fertiliser paid for with 100 kg of grain, using prices for the same month (grain price received and fertiliser price paid, both from the Ministry). The higher, the more fertiliser the crop buys.',
      grain: 'Grain', rCols: ['Fertiliser', 'With 100 kg of grain', 'Position in 10 years', 'Worst month', 'Best month'], kg: 'kg',
      rLow: 'among the least favourable months', rMid: 'in the middle range', rHigh: 'among the most favourable months',
      g: { nitrogen: 'Nitrogen fertilisers', pk: 'Phosphorus and potassium', compound: 'Compound fertilisers', feed: 'Feed and forage', energy: 'Energy' },
      cols: ['Input', 'Latest price', 'Over a year', 'Position in 10 years', 'Low', 'High', 'Trend'],
      worse: 'worse', better: 'better', cheap: 'cheap', dear: 'dear', pctOf: 'percentile', yrs: 'years of history', late: 'late data', since: 'since',
      note: ['Fertiliser and feed: prices paid by farmers at the farm gate, national average, excluding VAT, in €/100 kg (Spanish Ministry of Agriculture, Fisheries and Food). They are national averages: your supplier’s price may differ.',
        'Diesel: pump price of road diesel in Spain, taxes included (European Commission Weekly Oil Bulletin). It is not agricultural diesel (gasóleo B), which is taxed differently; it shows the trend. Its history starts in 2021, so the position is computed over 5 years.',
        'Nothing is estimated or filled in: late data are shown with their date and a “late data” label.'],
      cta: 'Want this monitor with the inputs your cooperative buys and an alert when a price drops below a threshold? Tell us what you need.', ctaBtn: 'Contact us'
    },
    fr: { barShort: 'Combien d’engrais', barT: 'Sur cette page', seeChart: 'Voir le graphique',
      title: 'Moniteur des intrants', h1: 'Moniteur des intrants : cher ou bon marché ?',
      sub: 'Ce que paient les agriculteurs espagnols pour les engrais, les aliments du bétail et le gazole, comparé à leurs propres 10 dernières années, et combien d’engrais le grain achète aujourd’hui. Pour préparer l’achat groupé de la coopérative avec des données officielles.',
      loading: 'Chargement…', fail: 'Impossible de charger le moniteur. Réessayez dans quelques minutes.', asof: 'Données au',
      howT: 'Comment le lire', how: 'Le centile indique où se situe le prix d’aujourd’hui dans son histoire : 86 signifie que le prix actuel est égal ou supérieur à celui de 86 % des mois des 10 dernières années. Ce n’est pas une prévision : il dit où nous en sommes, pas où nous allons.',
      rT: 'Combien d’engrais achète le grain', rS: 'Kilos d’engrais payés avec 100 kg de grain, aux prix du même mois (prix perçu du grain et prix payé de l’engrais, tous deux du ministère). Plus c’est élevé, plus la récolte achète d’engrais.',
      grain: 'Grain', rCols: ['Engrais', 'Avec 100 kg de grain', 'Position sur 10 ans', 'Pire mois', 'Meilleur mois'], kg: 'kg',
      rLow: 'parmi les mois les moins favorables', rMid: 'dans la zone moyenne', rHigh: 'parmi les mois les plus favorables',
      g: { nitrogen: 'Engrais azotés', pk: 'Phosphore et potasse', compound: 'Engrais composés', feed: 'Aliments et fourrages', energy: 'Énergie' },
      cols: ['Intrant', 'Dernier prix', 'Sur un an', 'Position sur 10 ans', 'Minimum', 'Maximum', 'Évolution'],
      worse: 'pire', better: 'meilleur', cheap: 'bon marché', dear: 'cher', pctOf: 'centile', yrs: 'ans d’historique', late: 'donnée en retard', since: 'depuis',
      note: ['Engrais et aliments : prix payés par les agriculteurs à l’entrée de l’exploitation, moyenne nationale, hors TVA, en €/100 kg (ministère espagnol de l’Agriculture, de la Pêche et de l’Alimentation). Ce sont des moyennes nationales : le prix de votre fournisseur peut différer.',
        'Gazole : prix à la pompe du gazole routier en Espagne, taxes comprises (Weekly Oil Bulletin de la Commission européenne). Ce n’est pas le gazole agricole, autrement taxé ; il montre la tendance. Son historique commence en 2021 : la position est calculée sur 5 ans.',
        'Rien n’est estimé ni complété : une donnée en retard est affichée avec sa date et la mention « donnée en retard ».'],
      cta: 'Vous voulez ce moniteur avec les intrants que votre coopérative achète et une alerte quand un prix passe sous un seuil ? Dites-nous ce qu’il vous faut.', ctaBtn: 'Nous écrire'
    },
    it: { barShort: 'Quanto fertilizzante', barT: 'In questa pagina', seeChart: 'Vedi grafico',
      title: 'Monitor dei mezzi tecnici', h1: 'Monitor dei mezzi tecnici: caro o conveniente?',
      sub: 'Quanto pagano gli agricoltori spagnoli per fertilizzanti, mangimi e gasolio, confrontato con i loro ultimi 10 anni, e quanto fertilizzante compra oggi il grano. Per preparare l’acquisto collettivo della cooperativa con dati ufficiali alla mano.',
      loading: 'Caricamento…', fail: 'Impossibile caricare il monitor. Riprova tra qualche minuto.', asof: 'Dati al',
      howT: 'Come leggerlo', how: 'Il percentile indica dove si trova il prezzo di oggi nella sua storia: 86 significa che il prezzo attuale è uguale o superiore a quello dell’86 % dei mesi degli ultimi 10 anni. Non è una previsione: dice dove siamo, non dove andiamo.',
      rT: 'Quanto fertilizzante compra il grano', rS: 'Chili di fertilizzante pagati con 100 kg di grano, ai prezzi dello stesso mese (prezzo percepito del grano e prezzo pagato del fertilizzante, entrambi del Ministero). Più è alto, più fertilizzante compra il raccolto.',
      grain: 'Grano', rCols: ['Fertilizzante', 'Con 100 kg di grano', 'Posizione in 10 anni', 'Mese peggiore', 'Mese migliore'], kg: 'kg',
      rLow: 'tra i mesi meno favorevoli', rMid: 'nella fascia media', rHigh: 'tra i mesi più favorevoli',
      g: { nitrogen: 'Concimi azotati', pk: 'Fosforo e potassio', compound: 'Concimi complessi', feed: 'Mangimi e foraggi', energy: 'Energia' },
      cols: ['Mezzo tecnico', 'Ultimo prezzo', 'In un anno', 'Posizione in 10 anni', 'Minimo', 'Massimo', 'Andamento'],
      worse: 'peggio', better: 'meglio', cheap: 'conveniente', dear: 'caro', pctOf: 'percentile', yrs: 'anni di storico', late: 'dato in ritardo', since: 'dal',
      note: ['Fertilizzanti e mangimi: prezzi pagati dagli agricoltori all’ingresso dell’azienda, media nazionale, IVA esclusa, in €/100 kg (Ministero spagnolo dell’Agricoltura, Pesca e Alimentazione). Sono medie nazionali: il prezzo del tuo fornitore può essere diverso.',
        'Gasolio: prezzo alla pompa del gasolio per autotrazione in Spagna, tasse incluse (Weekly Oil Bulletin della Commissione europea). Non è il gasolio agricolo, tassato diversamente; mostra la tendenza. Lo storico parte dal 2021, quindi la posizione è calcolata su 5 anni.',
        'Niente è stimato né riempito: un dato in ritardo è mostrato con la sua data e l’etichetta «dato in ritardo».'],
      cta: 'Vuoi questo monitor con i mezzi tecnici che compra la tua cooperativa e un avviso quando un prezzo scende sotto una soglia? Raccontaci di cosa hai bisogno.', ctaBtn: 'Scrivici'
    }
  };
  var DOC = null, FAILED = false, GRAIN = 'es-perc-trigo';
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nm(o) { return (o && (o[lang()] || o.es)) || ''; }
  function num(v, d) { if (v == null || !isFinite(v)) return '—'; var s = Number(v).toFixed(d); return lang() === 'en' ? s : s.replace('.', ','); }
  function pct(v) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), 1) + ' %'; }
  function per(p) { var mo = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
    if (!p) return '—'; if (p.length === 10) return S.fmtDate ? S.fmtDate(p) : p;
    if (p.length === 7) { try { return new Date(p + '-15T00:00:00Z').toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return mo[+p.slice(5)] + ' ' + p.slice(0, 4); } }
    return p; }
  function unitShort(u) { return String(u || '').replace(' (sin IVA)', '').replace('EUR/litro', '€/l'); }
  function dec(v) { return v < 10 ? 3 : 2; }
  // barra de posición: 0 = el más barato de la ventana, 100 = el más caro
  function bar(p, w, inverse) {
    var c = inverse ? (p >= 67 ? 'var(--positive)' : p <= 33 ? 'var(--negative)' : '#8f5f12') : (p >= 67 ? 'var(--negative)' : p <= 33 ? 'var(--positive)' : '#8f5f12');
    return '<div class="mi-pos" title="' + esc(w.pctOf + ' ' + p) + '"><div class="mi-track"><span class="mi-dot" style="left:' + Math.max(0, Math.min(100, p)) + '%;background:' + c + '"></span></div>' +
      '<div class="mi-pos-l"><span>' + esc(inverse ? '' : w.cheap) + '</span><strong style="color:' + c + '">' + p + '</strong><span>' + esc(inverse ? '' : w.dear) + '</span></div></div>';
  }
  function spark(vals) {
    if (!vals || vals.length < 3) return '';
    var W = 110, H = 30, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), r = mx - mn || 1;
    var d = vals.map(function (v, i) { return (i ? 'L' : 'M') + (i / (vals.length - 1) * W).toFixed(1) + ' ' + (H - 3 - (v - mn) / r * (H - 6)).toFixed(1); }).join(' ');
    var lx = W, ly = (H - 3 - (vals[vals.length - 1] - mn) / r * (H - 6)).toFixed(1);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="var(--text-muted)" stroke-width="1.4"/><circle cx="' + (lx - 1.5) + '" cy="' + ly + '" r="2.6" fill="var(--text)"/></svg>';
  }
  function ratioBlock(w) {
    var grains = [], seen = {};
    DOC.ratios.forEach(function (r) { if (!seen[r.grain]) { seen[r.grain] = 1; grains.push(r); } });
    if (!seen[GRAIN] && grains.length) GRAIN = grains[0].grain;
    var rows = DOC.ratios.filter(function (r) { return r.grain === GRAIN; });
    var h = '<section class="di-card mi-sec" id="mi-ratio"><h2>' + esc(w.rT) + '</h2><p class="mi-sub">' + esc(w.rS) + '</p>' +
      '<label class="mi-lab">' + esc(w.grain) + ' <select id="mi-g" class="di-compare-select" style="width:auto">' + grains.map(function (r) { return '<option value="' + r.grain + '"' + (r.grain === GRAIN ? ' selected' : '') + '>' + esc(({ 'es-perc-trigo': '🌾 ', 'es-perc-cebada': '🍺 ', 'es-perc-maiz': '🌽 ', 'es-perc-girasol': '🌻 ' }[r.grain] || '') + nm(r.grainName)) + '</option>'; }).join('') + '</select></label>';
    h += '<div style="overflow-x:auto"><table class="mi-t" data-no-rows><thead><tr>' + w.rCols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var lab = r.pct <= 20 ? w.rLow : r.pct >= 80 ? w.rHigh : w.rMid;
      h += '<tr><td><strong>' + esc(nm(r.fertName)) + '</strong><div class="mi-m">' + esc(per(r.last)) + '</div></td><td><strong>' + esc(num(r.value, 1)) + ' ' + esc(w.kg) + '</strong></td>' +
        '<td>' + bar(r.pct, w, true) + '<div class="mi-m">' + esc(lab) + '</div></td><td>' + esc(num(r.min[1], 1)) + ' ' + esc(w.kg) + '<div class="mi-m">' + esc(per(r.min[0])) + '</div></td>' +
        '<td>' + esc(num(r.max[1], 1)) + ' ' + esc(w.kg) + '<div class="mi-m">' + esc(per(r.max[0])) + '</div></td></tr>';
    });
    return h + '</tbody></table></div></section>';
  }
  function groupBlock(w, g) {
    if (!g.items.length) return '';
    var h = '<section class="di-card mi-sec" id="mi-g-' + esc(g.id) + '"><h2>' + esc(w.g[g.id] || g.id) + '</h2><div style="overflow-x:auto"><table class="mi-t" data-no-rows><thead><tr>' + w.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    g.items.forEach(function (x) {
      var late = x.state === 'DELAYED' || x.state === 'STALE', yrs = x.years < 9.5 ? '<div class="mi-m">' + esc(num(x.years, 0) + ' ' + w.yrs) + '</div>' : '';
      h += '<tr><td><strong>' + esc(nm(x.name)) + '</strong></td>' +
        '<td><strong>' + esc(num(x.value, dec(x.value))) + '</strong> <span class="mi-m">' + esc(unitShort(x.unit)) + '</span><div class="mi-m">' + esc(per(x.last)) + (late ? ' · <span style="color:#8f5f12">' + esc(w.late) + '</span>' : '') + '</div></td>' +
        '<td style="color:' + (x.yoy > 0 ? 'var(--negative)' : x.yoy < 0 ? 'var(--positive)' : 'inherit') + ';font-weight:600">' + esc(pct(x.yoy)) + '</td>' +
        '<td>' + bar(x.pct, w, false) + yrs + '</td>' +
        '<td>' + esc(num(x.min[1], dec(x.min[1]))) + '<div class="mi-m">' + esc(per(x.min[0])) + '</div></td><td>' + esc(num(x.max[1], dec(x.max[1]))) + '<div class="mi-m">' + esc(per(x.max[0])) + '</div></td>' +
        '<td>' + (x.spark && x.spark.length > 2 ? '<button type="button" class="mi-sp" data-sp="' + esc(x.id) + '" aria-expanded="false" title="' + esc(w.seeChart) + '" aria-label="' + esc(w.seeChart + ': ' + nm(x.name)) + '" style="background:none;border:0;padding:2px;cursor:pointer;font:inherit;color:inherit;text-align:left">' + spark(x.spark) + '<div class="mi-m" style="font-size:11px">' + esc(w.seeChart) + ' ▾</div></button>' : '') + '</td></tr>' +
        '<tr class="mi-ch" data-ch="' + esc(x.id) + '" hidden><td colspan="7" style="padding:4px 6px 14px"></td></tr>';
    });
    return h + '</tbody></table></div></section>';
  }
  function findItem(id) { var r = null; DOC.groups.forEach(function (g) { g.items.forEach(function (x) { if (x.id === id) r = x; }); }); return r; }
  function toggleChart(id, btn) {
    var row = document.querySelector('tr[data-ch="' + id + '"]'); if (!row) return;
    var open = row.hasAttribute('hidden'); if (!open) { row.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); return; }
    var x = findItem(id), w = t(), cell = row.firstChild; if (!x || !x.spark) return;
    var pts = [], n = x.spark.length, y = +x.last.slice(0, 4), m = +x.last.slice(5, 7) - 1, i, d;
    for (i = n - 1; i >= 0; i--) { d = Date.UTC(y, m, 15); if (x.spark[i] != null) pts.unshift({ x: d, y: x.spark[i], l: per(new Date(d).toISOString().slice(0, 7)) }); m--; if (m < 0) { m = 11; y--; } }
    cell.innerHTML = '<div style="font-weight:600;margin:6px 0">' + esc(nm(x.name)) + ' · ' + esc(unitShort(x.unit)) + '</div>' + (window.DehesaChart && window.DehesaChart.render && pts.length > 2 ? window.DehesaChart.render({ series: [{ name: nm(x.name), color: '#8a2d2d', pts: pts }], xMode: 'time', yTitle: unitShort(x.unit), aria: nm(x.name), zero: false, noLegend: true, vFmt: function (v) { return v == null ? '—' : num(v, dec(v)); } }) : '');
    row.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true');
  }
  function render() {
    var w = t(), root = document.getElementById('mi-body'); if (!root) return;
    document.getElementById('mi-h1').textContent = w.h1; document.getElementById('mi-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!DOC) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.loading) + '</p>'; return; }
    var h = '<div class="mi-how"><strong>' + esc(w.howT) + '.</strong> ' + esc(w.how) + '<div class="mi-m" style="margin-top:4px">' + esc(w.asof) + ' ' + esc(S.fmtDate ? S.fmtDate(String(DOC.generatedAt).slice(0, 10)) : DOC.generatedAt) + '</div></div>';
    h += ratioBlock(w);
    DOC.groups.forEach(function (g) { h += groupBlock(w, g); });
    h += w.note.map(function (p) { return '<p class="di-movers-hint" style="max-width:820px">' + esc(p) + '</p>'; }).join('');
    h += '<section class="di-card di-emp-cta" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.cta) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaBtn) + '</a></section>';
    root.innerHTML = h;
    Array.prototype.forEach.call(root.querySelectorAll('.mi-sp'), function (b) { b.onclick = function () { toggleChart(b.getAttribute('data-sp'), b); }; });
    var F = S.frame, bh = document.getElementById('mi-bar');
    if (F && bh) F.bar(bh, w.barT, [['mi-ratio', w.barShort]].concat(DOC.groups.filter(function (g) { return g.items.length; }).map(function (g) { return ['mi-g-' + g.id, w.g[g.id] || g.id]; })));
    var sel = document.getElementById('mi-g'); if (sel) sel.onchange = function (e) { GRAIN = e.target.value; render(); };
  }
  S.init('data');
  S.onLangChange = render;
  render();
  fetch(S.sitePath('data/views/input-monitor.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) { DOC = d; render(); }).catch(function () { FAILED = true; render(); });
})();
