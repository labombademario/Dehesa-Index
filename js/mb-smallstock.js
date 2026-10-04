/* Canadá: ovino y caprino en las subastas de Manitoba (Winnipeg y Grunthal) y porcino de las procesadoras de Manitoba (Manitoba Agriculture, informes semanales;
   data/mb-markets/sheep-goat.json y hogs.json). ES5, sin librerías. Uso: MBSmall.mount(contenedor, lang, 'sg'|'hog'); la cabecera desplegable la pinta js/paises.js.
   Nada se estima: C$/cwt (100 lb) y C$/100 kg tal cual; C$/kg es la conversion exacta; el cambio solo compara dos ventas o semanas de la misma serie, con sus fechas. */
(function () {
  'use strict';
  var KG = 45.359237, DOC = {}, LD = {};
  var FILE = { sg: 'data/mb-markets/sheep-goat.json', hog: 'data/mb-markets/hogs.json' };
  var LIC = 'Contains information from the Government of Manitoba, licensed under the OpenMB Information and Data Use License (Manitoba.ca/OpenMB).';
  var T = {
    es: { cls: 'Clase', mart: 'Subasta', low: 'Mínimo', high: 'Máximo', avg: 'Media', sale: 'Última venta', vs: 'Vs. venta anterior', none: 'Sin precio publicado en esa venta.', loading: 'Cargando…', err: 'No se han podido cargar los datos.',
      chart: 'Evolución de la media por venta', sales: 'ventas', tbl: 'Todas las clases en la última venta', metric: 'Cifra', week: 'Semana acabada el', wvs: 'Vs. semana anterior', yoy: 'Vs. mismo viernes del año anterior', na: 'sin dato',
      sheep: 'Oveja de desecho', lamb100: 'Cordero 100+ lb', lamb80: 'Cordero 80–100 lb', lamb60: 'Cordero 60–80 lb', lambU60: 'Cordero menos de 60 lb', billy: 'Macho cabrío', nanny: 'Cabra', kid: 'Cabrito',
      allIn: 'Precio de la canal «all in» (C$/100 kg)', index100: 'Precio Index 100 (C$/100 kg)', pigs: 'Cerdos procesados (semana)', kg: 'Peso medio de canal (kg)', last8: 'Últimas 8 semanas', weeks: 'semanas',
      noteSg: 'Precios de las subastas de ovino y caprino de Winnipeg y Grunthal del informe semanal de Manitoba Agriculture (venden cada dos semanas aproximadamente; se muestra la fecha de la última venta). Peso vivo, C$ por cwt (100 lb). Las cabras las publica Manitoba por cabeza y desde abril de 2025 las convierte a C$/cwt con pesos medios que estima ella misma: aquí solo aparecen cuando el informe indica C$/cwt, y no son una medición directa del peso. Un hueco es un precio que Manitoba no publicó o una cifra que dos informes dan distinta (se deja vacía). Cambio = misma serie frente a la venta anterior que tenemos.',
      noteHog: 'Porcino de las procesadoras de Manitoba (Hog Information Order): precio medio ponderado de la canal, «all in» (incluye primas y descuentos, C$/100 kg) y «Index 100» (all in dividido por el índice medio de la canal), cerdos procesados y peso medio de canal. Las semanas acaban en viernes. Cambios calculados con nuestra propia serie; el del año anterior solo si existe el mismo viernes 52 semanas antes.' },
    en: { cls: 'Class', mart: 'Auction', low: 'Low', high: 'High', avg: 'Average', sale: 'Last sale', vs: 'Vs. previous sale', none: 'No price published for that sale.', loading: 'Loading…', err: 'The data could not be loaded.',
      chart: 'Average by sale', sales: 'sales', tbl: 'All classes at the last sale', metric: 'Measure', week: 'Week ending', wvs: 'Vs. previous week', yoy: 'Vs. same Friday last year', na: 'no data',
      sheep: 'Cull sheep', lamb100: 'Lamb 100+ lb', lamb80: 'Lamb 80–100 lb', lamb60: 'Lamb 60–80 lb', lambU60: 'Lamb under 60 lb', billy: 'Billy goats', nanny: 'Nanny goats', kid: 'Kids',
      allIn: 'All-in carcass price (C$/100 kg)', index100: 'Index 100 price (C$/100 kg)', pigs: 'Pigs processed (week)', kg: 'Average carcass weight (kg)', last8: 'Last 8 weeks', weeks: 'weeks',
      noteSg: 'Prices at the Winnipeg and Grunthal sheep and goat auctions from Manitoba Agriculture\'s weekly report (they sell roughly every two weeks; the date of the last sale is shown). Live weight, C$ per cwt (100 lb). Manitoba reported goats per head and since April 2025 converts them to C$/cwt using average weights it estimates itself: they appear here only when the report says C$/cwt, and are not a direct weight measurement. A gap is a price Manitoba did not publish or a figure two reports give differently (left empty). Change = same series against the previous sale we hold.',
      noteHog: 'Hogs at Manitoba processors (Hog Information Order): weighted average carcass price, "all in" (includes premiums and discounts, C$/100 kg) and "Index 100" (all in divided by the average carcass index), pigs processed and average carcass weight. Weeks end on Friday. Changes are computed from our own series; the year-on-year change only when the same Friday 52 weeks earlier exists.' },
    fr: { cls: 'Catégorie', mart: 'Encan', low: 'Minimum', high: 'Maximum', avg: 'Moyenne', sale: 'Dernière vente', vs: 'Vs. vente précédente', none: 'Aucun prix publié pour cette vente.', loading: 'Chargement…', err: 'Impossible de charger les données.',
      chart: 'Moyenne par vente', sales: 'ventes', tbl: 'Toutes les catégories à la dernière vente', metric: 'Mesure', week: 'Semaine se terminant le', wvs: 'Vs. semaine préc.', yoy: 'Vs. même vendredi de l\'an dernier', na: 'pas de donnée',
      sheep: 'Brebis de réforme', lamb100: 'Agneau 100+ lb', lamb80: 'Agneau 80–100 lb', lamb60: 'Agneau 60–80 lb', lambU60: 'Agneau moins de 60 lb', billy: 'Boucs', nanny: 'Chèvres', kid: 'Chevreaux',
      allIn: 'Prix de la carcasse « all in » ($ CA/100 kg)', index100: 'Prix Index 100 ($ CA/100 kg)', pigs: 'Porcs transformés (semaine)', kg: 'Poids moyen de carcasse (kg)', last8: '8 dernières semaines', weeks: 'semaines',
      noteSg: 'Prix des encans d\'ovins et de caprins de Winnipeg et Grunthal tirés du rapport hebdomadaire de Manitoba Agriculture (ils vendent environ toutes les deux semaines ; la date de la dernière vente est indiquée). Poids vif, $ CA par cwt (100 lb). Le Manitoba publiait les chèvres par tête et, depuis avril 2025, les convertit en $ CA/cwt avec des poids moyens qu\'il estime lui-même : elles n\'apparaissent ici que lorsque le rapport indique $ CA/cwt et ne sont pas une mesure directe du poids. Un vide est un prix non publié ou un chiffre que deux rapports donnent différemment (laissé vide). Variation = même série par rapport à la vente précédente que nous détenons.',
      noteHog: 'Porcs des transformateurs du Manitoba (Hog Information Order) : prix moyen pondéré de la carcasse, « all in » (primes et pénalités incluses, $ CA/100 kg) et « Index 100 » (all in divisé par l\'indice moyen de carcasse), porcs transformés et poids moyen de carcasse. Les semaines se terminent le vendredi. Variations calculées à partir de notre propre série ; celle sur un an seulement si le même vendredi 52 semaines plus tôt existe.' },
    it: { cls: 'Categoria', mart: 'Asta', low: 'Minimo', high: 'Massimo', avg: 'Media', sale: 'Ultima vendita', vs: 'Vs. vendita precedente', none: 'Nessun prezzo pubblicato per quella vendita.', loading: 'Caricamento…', err: 'Impossibile caricare i dati.',
      chart: 'Media per vendita', sales: 'vendite', tbl: 'Tutte le categorie all\'ultima vendita', metric: 'Misura', week: 'Settimana conclusa il', wvs: 'Vs. settimana prec.', yoy: 'Vs. stesso venerdì dell\'anno prima', na: 'nessun dato',
      sheep: 'Pecore a fine carriera', lamb100: 'Agnello 100+ lb', lamb80: 'Agnello 80–100 lb', lamb60: 'Agnello 60–80 lb', lambU60: 'Agnello meno di 60 lb', billy: 'Capri maschi', nanny: 'Capre', kid: 'Capretti',
      allIn: 'Prezzo della carcassa «all in» (C$/100 kg)', index100: 'Prezzo Index 100 (C$/100 kg)', pigs: 'Suini lavorati (settimana)', kg: 'Peso medio della carcassa (kg)', last8: 'Ultime 8 settimane', weeks: 'settimane',
      noteSg: 'Prezzi delle aste di ovini e caprini di Winnipeg e Grunthal dal rapporto settimanale di Manitoba Agriculture (vendono circa ogni due settimane; è indicata la data dell\'ultima vendita). Peso vivo, C$ per cwt (100 lb). Il Manitoba pubblicava le capre a capo e da aprile 2025 le converte in C$/cwt con pesi medi che stima da sé: qui compaiono solo quando il rapporto indica C$/cwt e non sono una misura diretta del peso. Un vuoto è un prezzo non pubblicato o un dato che due rapporti riportano diversamente (lasciato vuoto). Variazione = stessa serie rispetto alla vendita precedente in nostro possesso.',
      noteHog: 'Suini dei trasformatori del Manitoba (Hog Information Order): prezzo medio ponderato della carcassa, «all in» (premi e sconti inclusi, C$/100 kg) e «Index 100» (all in diviso per l\'indice medio della carcassa), suini lavorati e peso medio della carcassa. Le settimane terminano di venerdì. Variazioni calcolate sulla nostra serie; quella annua solo se esiste lo stesso venerdì 52 settimane prima.' }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nf(v, d, lang) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function pc(v, lang) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1, lang) + ' %'; }
  function load(kind) { if (DOC[kind]) return Promise.resolve(DOC[kind]); if (!LD[kind]) LD[kind] = fetch(FILE[kind]).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { DOC[kind] = d; return d; }); return LD[kind]; }
  function cite(period) { var Q = window.DICite; if (!Q) return ''; var c = Q.html('mb_agri', { period: String(period || '') }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function tile(lab, val, sub) { return '<div class="de-tile"><div class="de-tl">' + esc(lab) + '</div><div class="de-tv">' + val + '</div><div class="de-ts">' + sub + '</div></div>'; }
  function chart(pts, t, lang, unit, title, dec) {
    if (pts.length < 2 || !window.DehesaChart) return '';
    return '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + esc(title) + '</b></p>' + window.DehesaChart.render({ series: [{ name: title, color: '#2f6b4a', pts: pts }], xMode: 'time', yTitle: unit, aria: title, noLegend: true,
      vFmt: function (v) { return nf(v, dec, lang); }, yFmt: function (v) { return nf(v, dec === 0 ? 0 : 0, lang); }, xFmt: function (x) { var d = new Date(x); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1) + '/' + String(d.getUTCFullYear()).slice(2); } });
  }
  function renderSg(box, st, lang, D) {
    var t = T[lang], ci = D.classes.indexOf(st.cls); if (ci < 0) ci = 0;
    var ss = D.sales[st.mart] || {}, ks = Object.keys(ss).sort(), have = ks.filter(function (k) { return ss[k][ci]; }), last = ks[ks.length - 1];
    var opts = D.classes.map(function (k) { return '<option value="' + k + '"' + (k === D.classes[ci] ? ' selected' : '') + '>' + esc(t[k]) + '</option>'; }).join('');
    var mopts = D.marts.map(function (m) { return '<option value="' + esc(m) + '"' + (st.mart === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('');
    var h = '<div class="de-ctl"><label>' + esc(t.cls) + '<br><select class="di-compare-select" data-mbs="cls">' + opts + '</select></label><label>' + esc(t.mart) + '<br><select class="di-compare-select" data-mbs="mart">' + mopts + '</select></label></div>';
    var lk = have[have.length - 1], pk = have[have.length - 2], cur = lk ? ss[lk][ci] : null, prev = pk ? ss[pk][ci] : null, tl = '';
    if (cur) {
      tl += tile(t.avg + ' · C$/cwt', nf(cur[2], 2, lang), esc(t.low) + ' ' + nf(cur[0], 2, lang) + ' · ' + esc(t.high) + ' ' + nf(cur[1], 2, lang));
      tl += tile(t.avg + ' · C$/kg', nf(cur[2] / KG, 2, lang), esc(t.vs) + ': ' + (prev ? pc((cur[2] / prev[2] - 1) * 100, lang) + ' (' + esc(pk) + ')' : esc(t.na)));
      tl += tile(t.sale, esc(lk), esc(lk === last ? '' : t.mart + ' ' + st.mart + ': ' + last));
    } else tl += tile(t.avg, '–', esc(t.none));
    h += '<div class="de-tiles">' + tl + '</div>';
    h += chart(have.map(function (k) { return { x: Date.parse(k + 'T00:00:00Z'), y: ss[k][ci][2], l: k }; }), t, lang, 'C$/cwt', t.chart + ' · ' + t[D.classes[ci]] + ' · ' + st.mart, 2);
    var cells = function (r) { return r ? '<td class="r">' + nf(r[0], 2, lang) + '</td><td class="r">' + nf(r[1], 2, lang) + '</td><td class="r"><b>' + nf(r[2], 2, lang) + '</b></td>' : '<td class="r">–</td><td class="r">–</td><td class="r">–</td>'; };
    if (last) h += '<details><summary style="cursor:pointer;font-size:13px">' + esc(t.tbl) + ' · ' + esc(st.mart) + ' · ' + esc(last) + '</summary><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.cls) + '</th><th scope="col" class="r">' + esc(t.low) + '</th><th scope="col" class="r">' + esc(t.high) + '</th><th scope="col" class="r">' + esc(t.avg) + '</th></tr></thead><tbody>' +
      D.classes.map(function (k, i) { return '<tr><td>' + esc(t[k]) + '</td>' + cells(ss[last][i]) + '</tr>'; }).join('') + '</tbody></table></div></details>';
    h += '<p class="di-movers-hint">' + esc(t.noteSg) + '</p><p class="di-movers-hint">' + esc(LIC) + '</p>' + cite(last);
    box.innerHTML = h;
  }
  var UNIT = { allIn: 'C$/100 kg', index100: 'C$/100 kg', pigs: '', kg: 'kg' }, DEC = { allIn: 2, index100: 2, pigs: 0, kg: 2 };
  function renderHog(box, st, lang, D) {
    var t = T[lang], mi = D.fields.indexOf(st.metric); if (mi < 0) mi = 0; var m = D.fields[mi];
    var ks = Object.keys(D.weeks).sort(), have = ks.filter(function (k) { return D.weeks[k][mi] != null; }), lk = have[have.length - 1], pk = have[have.length - 2];
    var opts = D.fields.map(function (k) { return '<option value="' + k + '"' + (k === m ? ' selected' : '') + '>' + esc(t[k]) + '</option>'; }).join('');
    var h = '<div class="de-ctl"><label>' + esc(t.metric) + '<br><select class="di-compare-select" data-mbh="metric">' + opts + '</select></label></div>', tl = '';
    if (lk) {
      var v = D.weeks[lk][mi], p = pk && (Date.parse(lk) - Date.parse(pk)) <= 7.5 * 864e5 ? D.weeks[pk][mi] : null;
      var yk = new Date(Date.parse(lk + 'T00:00:00Z') - 364 * 864e5).toISOString().slice(0, 10), y = D.weeks[yk] ? D.weeks[yk][mi] : null;
      tl += tile(t[m], nf(v, DEC[m], lang), esc(t.week) + ' ' + esc(lk));
      tl += tile(t.wvs, p != null ? pc((v / p - 1) * 100, lang) : esc(t.na), p != null ? nf(p, DEC[m], lang) + ' (' + esc(pk) + ')' : '');
      tl += tile(t.yoy, y != null ? pc((v / y - 1) * 100, lang) : esc(t.na), y != null ? nf(y, DEC[m], lang) + ' (' + esc(yk) + ')' : '');
    } else tl += tile(t[m], '–', esc(t.none));
    h += '<div class="de-tiles">' + tl + '</div>';
    h += chart(have.map(function (k) { return { x: Date.parse(k + 'T00:00:00Z'), y: D.weeks[k][mi], l: k }; }), t, lang, UNIT[m], t[m], DEC[m]);
    var rows = ks.slice(-8).reverse();
    h += '<details><summary style="cursor:pointer;font-size:13px">' + esc(t.last8) + '</summary><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.week) + '</th>' + D.fields.map(function (f) { return '<th scope="col" class="r">' + esc(t[f]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (k) { return '<tr><td>' + esc(k) + '</td>' + D.weeks[k].map(function (v, i) { return '<td class="r">' + (v == null ? '–' : nf(v, DEC[D.fields[i]], lang)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>';
    h += '<p class="di-movers-hint">' + esc(t.noteHog) + '</p><p class="di-movers-hint">' + esc(LIC) + '</p>' + cite(ks[ks.length - 1]);
    box.innerHTML = h;
  }
  function mount(body, lang, kind) {
    lang = T[lang] ? lang : 'es'; var t = T[lang], st = kind === 'hog' ? { metric: 'allIn' } : { cls: 'lamb80', mart: 'Winnipeg' }, key = kind === 'hog' ? 'data-mbh' : 'data-mbs';
    body.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>';
    var go = function () { var D = DOC[kind]; (kind === 'hog' ? renderHog : renderSg)(body, st, lang, D); };
    load(kind).then(go).catch(function () { body.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; });
    body.addEventListener('change', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute(key); if (!a || !DOC[kind]) return;
      st[a] = e.target.value; go(); var n = body.querySelector('[' + key + '="' + a + '"]'); if (n) n.focus();
    });
  }
  window.MBSmall = { mount: mount };
})();
