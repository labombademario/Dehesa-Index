/* Dehesa Index — Informe de mercado para cooperativas (muestra). Lee data/views/coop-report.json (scripts/build-coop-report.py).
   Una hoja imprimible: qué sube y qué baja (variación a ~1 mes), presión de insumos, siguientes datos y publicaciones del USDA. Sin estimaciones. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: {
      title: 'Informe de mercado para cooperativas', h1: 'Informe de mercado para cooperativas',
      sub: 'Muestra del informe periódico: una hoja con lo que se ha movido en tu mercado, cómo van los insumos frente al precio de venta y qué datos llegan próximamente. Se genera solo con los precios oficiales que ya publica Dehesa Index.',
      sample: 'Muestra', mkt: 'Mercado', print: 'Imprimir o guardar en PDF', asof: 'Datos a fecha de', loading: 'Cargando…', fail: 'No se pudo cargar el informe. Vuelve a intentarlo en unos minutos.',
      M: { eu: 'Unión Europea', us: 'Estados Unidos', uk: 'Reino Unido', ca: 'Canadá' },
      up: 'Lo que más sube', down: 'Lo que más baja', none: 'Ningún precio al día con esa tendencia.', chg: 'a 1 mes', from: 'desde',
      mT: 'Presión de insumos frente al precio de venta', mS: 'Variación a 1 mes del precio de venta frente a una cesta de insumos (harina de soja, diésel y urea, con los pesos de abajo). Diferencia positiva = el precio de venta sube más que los insumos.',
      mBasket: 'Cesta de insumos', mCost: 'Coste combinado', mCols: ['Producto', 'Dato de', 'Precio de venta', 'Diferencia'], mNone: 'En este mercado no hay precios de insumos verificados para calcularlo.',
      mNote: 'No es el margen de ninguna explotación: faltan cantidades, otros costes y la estructura de cada actividad.',
      nT: 'Próximos datos de tus precios', nS: 'Fecha en la que se espera el siguiente dato de cada fuente, según su calendario habitual.', nCols: ['Producto', 'Último dato', 'Siguiente esperado'],
      uT: 'Publicaciones del USDA en las próximas 3 semanas', uS: 'Informes oficiales de EE. UU. que suelen mover los mercados mundiales de grano y ganado.',
      lateT: 'Pendientes de dato nuevo', lateS: 'Estos precios van retrasados respecto al calendario de su fuente; se muestran con su última fecha y no entran en «sube» ni «baja».',
      foot: 'Fuentes oficiales citadas en cada precio de Dehesa Index. La variación compara el último dato con el de hace unos 30 días; con datos mensuales es el mes anterior. Nada se estima ni se rellena.',
      ctaT: 'Este informe es una muestra.', ctaP: 'La versión para tu cooperativa se adapta a tus productos y tu zona, y puede llegarte cada semana. Cuéntanos qué necesitas.', ctaBtn: 'Pedir el informe'
    },
    en: {
      title: 'Market report for cooperatives', h1: 'Market report for cooperatives',
      sub: 'Sample of the periodic report: one page with what moved in your market, how inputs are doing against the selling price and which data come next. It is built only from the official prices Dehesa Index already publishes.',
      sample: 'Sample', mkt: 'Market', print: 'Print or save as PDF', asof: 'Data as of', loading: 'Loading…', fail: 'Could not load the report. Please try again in a few minutes.',
      M: { eu: 'European Union', us: 'United States', uk: 'United Kingdom', ca: 'Canada' },
      up: 'Biggest risers', down: 'Biggest fallers', none: 'No up-to-date price with that trend.', chg: '1-month change', from: 'from',
      mT: 'Input pressure against the selling price', mS: '1-month change in the selling price against an input basket (soybean meal, diesel and urea, with the weights below). A positive difference means the selling price is rising faster than inputs.',
      mBasket: 'Input basket', mCost: 'Combined cost', mCols: ['Product', 'Data for', 'Selling price', 'Difference'], mNone: 'This market has no verified input prices to compute it.',
      mNote: 'This is not the margin of any farm: quantities, other costs and each operation’s structure are missing.',
      nT: 'Next data for your prices', nS: 'Date when the next data point of each source is expected, based on its usual schedule.', nCols: ['Product', 'Latest data', 'Next expected'],
      uT: 'USDA releases in the next 3 weeks', uS: 'Official U.S. reports that often move world grain and livestock markets.',
      lateT: 'Waiting for new data', lateS: 'These prices are behind their source’s schedule; they are shown with their latest date and are left out of risers and fallers.',
      foot: 'Official sources are cited on every price in Dehesa Index. The change compares the latest data point with the one about 30 days earlier; for monthly data it is the previous month. Nothing is estimated or filled in.',
      ctaT: 'This report is a sample.', ctaP: 'The version for your cooperative is tailored to your products and area, and can reach you every week. Tell us what you need.', ctaBtn: 'Request the report'
    },
    fr: {
      title: 'Rapport de marché pour coopératives', h1: 'Rapport de marché pour coopératives',
      sub: 'Exemple du rapport périodique : une page avec ce qui a bougé sur votre marché, l’évolution des intrants face au prix de vente et les prochaines données. Il est construit uniquement avec les prix officiels déjà publiés par Dehesa Index.',
      sample: 'Exemple', mkt: 'Marché', print: 'Imprimer ou enregistrer en PDF', asof: 'Données au', loading: 'Chargement…', fail: 'Impossible de charger le rapport. Réessayez dans quelques minutes.',
      M: { eu: 'Union européenne', us: 'États-Unis', uk: 'Royaume-Uni', ca: 'Canada' },
      up: 'Plus fortes hausses', down: 'Plus fortes baisses', none: 'Aucun prix à jour avec cette tendance.', chg: 'sur 1 mois', from: 'depuis',
      mT: 'Pression des intrants face au prix de vente', mS: 'Variation sur 1 mois du prix de vente face à un panier d’intrants (tourteau de soja, gazole et urée, avec les poids ci-dessous). Écart positif = le prix de vente monte plus que les intrants.',
      mBasket: 'Panier d’intrants', mCost: 'Coût combiné', mCols: ['Produit', 'Donnée du', 'Prix de vente', 'Écart'], mNone: 'Ce marché n’a pas de prix d’intrants vérifiés pour le calculer.',
      mNote: 'Ce n’est la marge d’aucune exploitation : il manque les quantités, les autres coûts et la structure de chaque activité.',
      nT: 'Prochaines données de vos prix', nS: 'Date à laquelle la prochaine donnée de chaque source est attendue, selon son calendrier habituel.', nCols: ['Produit', 'Dernière donnée', 'Prochaine attendue'],
      uT: 'Publications de l’USDA dans les 3 prochaines semaines', uS: 'Rapports officiels américains qui font souvent bouger les marchés mondiaux des grains et du bétail.',
      lateT: 'En attente de nouvelle donnée', lateS: 'Ces prix sont en retard sur le calendrier de leur source ; ils sont affichés avec leur dernière date et exclus des hausses et des baisses.',
      foot: 'Les sources officielles sont citées sur chaque prix de Dehesa Index. La variation compare la dernière donnée à celle d’il y a environ 30 jours ; pour les données mensuelles, au mois précédent. Rien n’est estimé ni complété.',
      ctaT: 'Ce rapport est un exemple.', ctaP: 'La version pour votre coopérative s’adapte à vos produits et à votre zone, et peut vous parvenir chaque semaine. Dites-nous ce qu’il vous faut.', ctaBtn: 'Demander le rapport'
    },
    it: {
      title: 'Rapporto di mercato per cooperative', h1: 'Rapporto di mercato per cooperative',
      sub: 'Esempio del rapporto periodico: una pagina con ciò che si è mosso nel tuo mercato, l’andamento dei mezzi tecnici rispetto al prezzo di vendita e i prossimi dati in arrivo. È costruito solo con i prezzi ufficiali che Dehesa Index già pubblica.',
      sample: 'Esempio', mkt: 'Mercato', print: 'Stampa o salva in PDF', asof: 'Dati al', loading: 'Caricamento…', fail: 'Impossibile caricare il rapporto. Riprova tra qualche minuto.',
      M: { eu: 'Unione europea', us: 'Stati Uniti', uk: 'Regno Unito', ca: 'Canada' },
      up: 'Maggiori rialzi', down: 'Maggiori ribassi', none: 'Nessun prezzo aggiornato con questa tendenza.', chg: 'a 1 mese', from: 'da',
      mT: 'Pressione dei mezzi tecnici sul prezzo di vendita', mS: 'Variazione a 1 mese del prezzo di vendita rispetto a un paniere di mezzi tecnici (farina di soia, gasolio e urea, con i pesi sotto). Differenza positiva = il prezzo di vendita sale più dei mezzi tecnici.',
      mBasket: 'Paniere di mezzi tecnici', mCost: 'Costo combinato', mCols: ['Prodotto', 'Dato del', 'Prezzo di vendita', 'Differenza'], mNone: 'In questo mercato non ci sono prezzi verificati dei mezzi tecnici per calcolarlo.',
      mNote: 'Non è il margine di nessuna azienda: mancano quantità, altri costi e la struttura di ogni attività.',
      nT: 'Prossimi dati dei tuoi prezzi', nS: 'Data in cui è atteso il prossimo dato di ogni fonte, secondo il suo calendario abituale.', nCols: ['Prodotto', 'Ultimo dato', 'Prossimo atteso'],
      uT: 'Pubblicazioni dell’USDA nelle prossime 3 settimane', uS: 'Rapporti ufficiali statunitensi che spesso muovono i mercati mondiali di cereali e bestiame.',
      lateT: 'In attesa di un nuovo dato', lateS: 'Questi prezzi sono in ritardo rispetto al calendario della fonte; sono mostrati con l’ultima data ed esclusi da rialzi e ribassi.',
      foot: 'Le fonti ufficiali sono citate su ogni prezzo di Dehesa Index. La variazione confronta l’ultimo dato con quello di circa 30 giorni prima; per i dati mensili, il mese precedente. Niente è stimato né riempito.',
      ctaT: 'Questo rapporto è un esempio.', ctaP: 'La versione per la tua cooperativa si adatta ai tuoi prodotti e alla tua zona, e può arrivarti ogni settimana. Raccontaci di cosa hai bisogno.', ctaBtn: 'Richiedi il rapporto'
    }
  };
  var DOC = null, FAILED = false, REG = 'eu';
  try { var q = (location.search.match(/[?&]m=(eu|us|uk|ca)/) || [])[1]; if (q) REG = q; } catch (e) {}
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nm(o, k) { return (o && (o[lang()] || o.es)) || k || ''; }
  function num(v, d) { if (v == null || !isFinite(v)) return '—'; var s = Number(v).toFixed(d); return lang() === 'en' ? s : s.replace('.', ','); }
  function pct(v) { if (v == null) return '—'; return (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), 1) + ' %'; }
  function pts(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), 1) + ' pts'; }
  function col(v) { if (v != null && Math.abs(v) < 0.05) return 'var(--text-muted)'; return v > 0 ? 'var(--positive)' : v < 0 ? 'var(--negative)' : 'var(--text-muted)'; }
  function d(x) { return x ? (S.fmtDate ? S.fmtDate(String(x).slice(0, 10)) : x) : '—'; }
  function val(it) { return it.value == null ? '—' : num(it.value, it.value >= 100 ? 1 : 2) + ' ' + nm(it.unit); }
  function sec(title, sub, body) { return '<section class="ic-sec"><h2>' + esc(title) + '</h2>' + (sub ? '<p class="ic-sub">' + esc(sub) + '</p>' : '') + body + '</section>'; }
  function moverList(w, R, by, ids) {
    if (!ids.length) return '<p class="ic-sub">' + esc(w.none) + '</p>';
    return '<table class="ic-t"><tbody>' + ids.map(function (k) {
      var it = by[k];
      return '<tr><td><strong>' + esc(nm(it.name, k)) + '</strong>' + (nm(it.place) ? '<div class="ic-m">' + esc(nm(it.place)) + '</div>' : '') + '</td><td class="ic-r">' + esc(val(it)) + '<div class="ic-m">' + esc(d(it.date)) + '</div></td>' +
        '<td class="ic-r" style="color:' + col(it.change1m) + ';font-weight:700">' + esc(pct(it.change1m)) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function render() {
    var w = t(), root = document.getElementById('ic-body'); if (!root) return;
    document.getElementById('ic-h1').textContent = w.h1; document.getElementById('ic-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!DOC) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.loading) + '</p>'; return; }
    var R = DOC.regions[REG], by = {}; R.items.forEach(function (x) { by[x.product] = x; });
    var h = '<div class="ic-bar no-print"><label>' + esc(w.mkt) + ' <select id="ic-m" class="di-compare-select" style="width:auto">' + ['eu', 'us', 'uk', 'ca'].filter(function (r) { return DOC.regions[r]; }).map(function (r) {
      return '<option value="' + r + '"' + (r === REG ? ' selected' : '') + '>' + esc(w.M[r]) + '</option>'; }).join('') + '</select></label>' +
      '<button type="button" id="ic-print" class="di-btn-gold-solid">' + esc(w.print) + '</button></div>';
    h += '<article class="ic-sheet"><header class="ic-head"><div><span class="ic-badge">' + esc(w.sample) + '</span><div class="ic-title">Dehesa Index · ' + esc(w.title) + '</div><div class="ic-m">' + esc(w.M[REG]) + ' · ' + esc(w.asof) + ' ' + esc(d(DOC.generatedAt)) + '</div></div></header>';
    h += '<div class="ic-grid">' + sec(w.up, w.chg, moverList(w, R, by, R.up)) + sec(w.down, w.chg, moverList(w, R, by, R.down)) + '</div>';
    var m = R.margin, mb;
    if (m) {
      mb = '<p class="ic-sub">' + esc(w.mBasket) + ': ' + m.basket.map(function (b) { return esc(nm(by[b.product] && by[b.product].name, b.product)) + ' ' + b.weight + ' % (' + esc(pct(b.change)) + ')'; }).join(' · ') +
        ' → <strong>' + esc(w.mCost) + ' ' + esc(pct(m.cost)) + '</strong></p><table class="ic-t"><thead><tr>' + w.mCols.map(function (c, i) { return '<th' + (i ? ' class="ic-r"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        m.rows.map(function (r) { return '<tr><td>' + esc(nm(by[r.product].name, r.product)) + '</td><td class="ic-r">' + esc(d(by[r.product].date)) + '</td><td class="ic-r">' + esc(pct(r.sale)) + '</td><td class="ic-r" style="color:' + col(r.delta) + ';font-weight:700">' + esc(pts(r.delta)) + '</td></tr>'; }).join('') +
        '</tbody></table><p class="ic-m">' + esc(w.mNote) + '</p>';
    } else mb = '<p class="ic-sub">' + esc(w.mNone) + '</p>';
    h += sec(w.mT, m ? w.mS : '', mb);
    var nx = R.next.filter(function (k) { return R.late.indexOf(k) < 0; }).slice(0, 8);
    var nb = '<table class="ic-t"><thead><tr>' + w.nCols.map(function (c, i) { return '<th' + (i ? ' class="ic-r"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      nx.map(function (k) { var it = by[k]; return '<tr><td>' + esc(nm(it.name, k)) + '</td><td class="ic-r">' + esc(d(it.date)) + '</td><td class="ic-r">' + esc(d(it.expectedNext)) + '</td></tr>'; }).join('') + '</tbody></table>';
    var ub = DOC.usda.length ? '<table class="ic-t"><tbody>' + DOC.usda.slice(0, 8).map(function (u) { return '<tr><td>' + esc(d(u.date)) + (u.time ? ' · ' + esc(u.time) + ' ET' : '') + '</td><td>' + esc(u.name) + '</td><td class="ic-r ic-m">' + esc(u.agency) + '</td></tr>'; }).join('') + '</tbody></table>' : '';
    h += '<div class="ic-grid">' + sec(w.nT, w.nS, nb) + (ub ? sec(w.uT, w.uS, ub) : '') + '</div>';
    if (R.late.length) h += sec(w.lateT, w.lateS, '<p style="margin:0;font-size:13px">' + R.late.map(function (k) { return esc(nm(by[k].name, k)) + ' (' + esc(d(by[k].date)) + ')'; }).join(' · ') + '</p>');
    h += '<footer class="ic-foot">' + esc(w.foot) + ' dehesaindex.com</footer></article>';
    h += '<section class="di-card di-emp-cta no-print" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 6px"><strong>' + esc(w.ctaT) + '</strong></p><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.ctaP) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaBtn) + '</a></section>';
    root.innerHTML = h;
    document.getElementById('ic-m').onchange = function (e) { REG = e.target.value; try { history.replaceState(null, '', '?m=' + REG); } catch (er) {} render(); };
    document.getElementById('ic-print').onclick = function () { window.print(); };
  }
  S.init('data');
  S.onLangChange = render;
  render();
  fetch(S.sitePath('data/views/coop-report.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (x) { DOC = x; render(); }).catch(function () { FAILED = true; render(); });
})();
