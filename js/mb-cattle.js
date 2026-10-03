/* Canadá: ganado vacuno en las subastas de Manitoba (Manitoba Agriculture, informe semanal; data/mb-markets/cattle.json).
   ES5, sin librerías. Uso: MBCattle.mount(contenedor, lang); la cabecera desplegable la pinta js/paises.js para no descargar este módulo hasta abrirla.
   Nada se estima: C$/cwt tal cual (cwt = 100 lb); C$/kg es la conversion exacta (1 lb = 0,45359237 kg); el cambio solo compara dos semanas de la misma serie (clase y subasta). */
(function () {
  'use strict';
  var F = 'data/mb-markets/cattle.json', D = null, LD = null;
  var KG = 45.359237;
  var T = {
    es: { all: 'Manitoba (media de las subastas)', cls: 'Clase', mart: 'Subasta', low: 'Mínimo', high: 'Máximo', avg: 'Media', wk: 'Semana del', chg: 'Vs. semana anterior', none: 'Sin precio publicado esta semana.',
      head: 'Cabezas vendidas (semana)', ytd: 'Acumulado del año', vs: 'Vs.', sale: 'Fecha de venta', nosale: 'sin venta', loading: 'Cargando…', err: 'No se han podido cargar los datos.', chart: 'Evolución semanal de la media',
      kg: 'C$/kg', cwt: 'C$/cwt', weeks: 'semanas', tbl: 'Todas las clases', cow: 'Vacas de desvieje', cowD12: 'Vacas D1, D2', cowD3: 'Vacas D3', bull: 'Toros', steer: 'Novillos (cebo)', heif: 'Terneras (cebo)', lb: 'lb',
      note: 'Precios de las subastas de ganado de Manitoba (Ashern, Gladstone, Grunthal, Killarney, Ste Rose, Virden, Winnipeg) del informe semanal de Manitoba Agriculture: venta de viernes a jueves, mínimo, máximo y media por clase y tramo de peso. El «total de Manitoba» es la media publicada por la propia Manitoba. Peso vivo, C$ por cwt (100 lb). Solo hay las semanas publicadas desde que empezamos a recogerlas; no se usa el histórico mensual de la página (precios de Canfax, de terceros). Las semanas con muy pocas cabezas vendidas (por festivos, p. ej.) pueden dar medias poco representativas: el punto del gráfico indica las cabezas.',
      lic: 'Contains information from the Government of Manitoba, licensed under the OpenMB Information and Data Use License (Manitoba.ca/OpenMB).' },
    en: { all: 'Manitoba (average of auctions)', cls: 'Class', mart: 'Auction', low: 'Low', high: 'High', avg: 'Average', wk: 'Week of', chg: 'Vs. previous week', none: 'No price published this week.',
      head: 'Head sold (week)', ytd: 'Year to date', vs: 'Vs.', sale: 'Sale date', nosale: 'no sale', loading: 'Loading…', err: 'The data could not be loaded.', chart: 'Weekly average',
      kg: 'C$/kg', cwt: 'C$/cwt', weeks: 'weeks', tbl: 'All classes', cow: 'Slaughter cows', cowD12: 'D1, D2 cows', cowD3: 'D3 cows', bull: 'Bulls', steer: 'Feeder steers', heif: 'Feeder heifers', lb: 'lb',
      note: 'Prices at Manitoba cattle auction marts (Ashern, Gladstone, Grunthal, Killarney, Ste Rose, Virden, Winnipeg) from Manitoba Agriculture\'s weekly report: sales Friday to Thursday, low, high and average by class and weight range. The Manitoba figure is the average Manitoba itself publishes. Live weight, C$ per cwt (100 lb). Only the weeks published since we started collecting them are shown; the page\'s monthly history is not used (its cattle prices are Canfax\'s, a third party). Weeks with very few head sold (holidays, for instance) can give unrepresentative averages: each chart point shows the head count.',
      lic: 'Contains information from the Government of Manitoba, licensed under the OpenMB Information and Data Use License (Manitoba.ca/OpenMB).' },
    fr: { all: 'Manitoba (moyenne des encans)', cls: 'Catégorie', mart: 'Encan', low: 'Minimum', high: 'Maximum', avg: 'Moyenne', wk: 'Semaine du', chg: 'Vs. semaine préc.', none: 'Aucun prix publié cette semaine.',
      head: 'Têtes vendues (semaine)', ytd: 'Cumul de l\'année', vs: 'Vs.', sale: 'Date de vente', nosale: 'pas de vente', loading: 'Chargement…', err: 'Impossible de charger les données.', chart: 'Moyenne hebdomadaire',
      kg: '$ CA/kg', cwt: '$ CA/cwt', weeks: 'semaines', tbl: 'Toutes les catégories', cow: 'Vaches de réforme', cowD12: 'Vaches D1, D2', cowD3: 'Vaches D3', bull: 'Taureaux', steer: 'Bouvillons (engraissement)', heif: 'Génisses (engraissement)', lb: 'lb',
      note: 'Prix des encans de bovins du Manitoba (Ashern, Gladstone, Grunthal, Killarney, Ste Rose, Virden, Winnipeg) tirés du rapport hebdomadaire de Manitoba Agriculture : ventes du vendredi au jeudi, minimum, maximum et moyenne par catégorie et tranche de poids. Le chiffre « Manitoba » est la moyenne publiée par la province. Poids vif, $ CA par cwt (100 lb). Seules les semaines publiées depuis le début de notre collecte sont affichées ; l\'historique mensuel de la page n\'est pas utilisé (prix de Canfax, un tiers). Les semaines avec très peu de têtes vendues (jours fériés, par exemple) peuvent donner des moyennes peu représentatives : chaque point du graphique indique le nombre de têtes.',
      lic: 'Contains information from the Government of Manitoba, licensed under the OpenMB Information and Data Use License (Manitoba.ca/OpenMB).' },
    it: { all: 'Manitoba (media delle aste)', cls: 'Categoria', mart: 'Asta', low: 'Minimo', high: 'Massimo', avg: 'Media', wk: 'Settimana del', chg: 'Vs. settimana prec.', none: 'Nessun prezzo pubblicato questa settimana.',
      head: 'Capi venduti (settimana)', ytd: 'Da inizio anno', vs: 'Vs.', sale: 'Data di vendita', nosale: 'nessuna vendita', loading: 'Caricamento…', err: 'Impossibile caricare i dati.', chart: 'Media settimanale',
      kg: 'C$/kg', cwt: 'C$/cwt', weeks: 'settimane', tbl: 'Tutte le categorie', cow: 'Vacche a fine carriera', cowD12: 'Vacche D1, D2', cowD3: 'Vacche D3', bull: 'Tori', steer: 'Manzi da ingrasso', heif: 'Manze da ingrasso', lb: 'lb',
      note: 'Prezzi delle aste di bovini del Manitoba (Ashern, Gladstone, Grunthal, Killarney, Ste Rose, Virden, Winnipeg) dal rapporto settimanale di Manitoba Agriculture: vendite da venerdì a giovedì, minimo, massimo e media per categoria e fascia di peso. Il dato «Manitoba» è la media pubblicata dalla provincia. Peso vivo, C$ per cwt (100 lb). Sono mostrate solo le settimane pubblicate da quando abbiamo iniziato a raccoglierle; lo storico mensile della pagina non è usato (prezzi di Canfax, terzi). Le settimane con pochissimi capi venduti (per le festività, ad esempio) possono dare medie poco rappresentative: ogni punto del grafico indica il numero di capi.',
      lic: 'Contains information from the Government of Manitoba, licensed under the OpenMB Information and Data Use License (Manitoba.ca/OpenMB).' }
  };
  var RNG = { 901: '901+', 801: '801–900', 701: '701–800', 601: '601–700', 501: '501–600', 401: '401–500' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nf(v, d, lang) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function pc(v, lang) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1, lang) + ' %'; }
  function load() { if (D) return Promise.resolve(D); if (!LD) LD = fetch(F).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { D = d; return d; }); return LD; }
  function label(k, t) {
    if (k === 'cowD12') return t.cowD12; if (k === 'cowD3') return t.cowD3; if (k === 'bull') return t.bull;
    var m = /^(steer|heif)(\d{3})$/.exec(k); return t[m[1]] + ' ' + RNG[m[2]] + ' ' + t.lb;
  }
  function trio(w, mart, i) { var r = mart === 'all' ? w.summary[i] : (w.marts[mart] && w.marts[mart].rows[i]); return r || null; }
  function cite(period) { var Q = window.DICite; if (!Q) return ''; var c = Q.html('mb_agri', { period: String(period || '') }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  function tile(lab, val, sub) { return '<div class="de-tile"><div class="de-tl">' + esc(lab) + '</div><div class="de-tv">' + val + '</div><div class="de-ts">' + sub + '</div></div>'; }

  function render(box, st, lang) {
    var t = T[lang], wk = Object.keys(D.weeks).sort(), last = wk[wk.length - 1], w = D.weeks[last], pw = wk.length > 1 ? D.weeks[wk[wk.length - 2]] : null;
    var ci = D.classes.indexOf(st.cls); if (ci < 0) ci = 3;
    var opts = D.classes.map(function (k) { return '<option value="' + k + '"' + (k === D.classes[ci] ? ' selected' : '') + '>' + esc(label(k, t)) + '</option>'; }).join('');
    var mopts = '<option value="all"' + (st.mart === 'all' ? ' selected' : '') + '>' + esc(t.all) + '</option>' + D.marts.map(function (m) { return '<option value="' + esc(m) + '"' + (st.mart === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('');
    var h = '<div class="de-ctl"><label>' + esc(t.cls) + '<br><select class="di-compare-select" data-mb="cls">' + opts + '</select></label><label>' + esc(t.mart) + '<br><select class="di-compare-select" data-mb="mart">' + mopts + '</select></label></div>';
    var cur = trio(w, st.mart, ci), prev = pw ? trio(pw, st.mart, ci) : null, tl = '';
    if (cur) {
      tl += tile(t.avg + ' · ' + t.cwt, nf(cur[2], 2, lang), esc(t.low) + ' ' + nf(cur[0], 2, lang) + ' · ' + esc(t.high) + ' ' + nf(cur[1], 2, lang));
      tl += tile(t.avg + ' · ' + t.kg, nf(cur[2] / KG, 2, lang), esc(t.chg) + ': ' + (prev ? pc((cur[2] / prev[2] - 1) * 100, lang) : '–'));
    } else tl += tile(t.avg, '–', esc(t.none));
    if (st.mart === 'all') tl += tile(t.head, nf(w.weekTotal, 0, lang), esc(t.ytd) + ' ' + Object.keys(w.ytd).sort().reverse()[0] + ': ' + nf(w.ytd[Object.keys(w.ytd).sort().reverse()[0]], 0, lang) + ' · ' + esc(t.vs) + ' ' + Object.keys(w.ytd).sort()[0] + ': ' + pc((w.ytd[Object.keys(w.ytd).sort().reverse()[0]] / w.ytd[Object.keys(w.ytd).sort()[0]] - 1) * 100, lang));
    else { var m = w.marts[st.mart]; tl += tile(t.head, nf(w.head[st.mart], 0, lang), esc(t.sale) + ': ' + (m.date ? esc(m.date) : esc(t.nosale))); }
    h += '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(t.wk) + ' ' + esc(last) + '</p><div class="de-tiles">' + tl + '</div>';
    var pts = [];
    wk.forEach(function (k) { var r = trio(D.weeks[k], st.mart, ci); if (r) pts.push({ x: Date.parse(k + 'T00:00:00Z'), y: r[2], l: k + ' · ' + (st.mart === 'all' ? D.weeks[k].weekTotal : D.weeks[k].head[st.mart]) }); });
    if (pts.length > 1 && window.DehesaChart) h += '<p class="di-movers-hint" style="margin:10px 0 2px"><b>' + esc(t.chart) + '</b> · ' + esc(label(D.classes[ci], t)) + ' · ' + wk.length + ' ' + esc(t.weeks) + '</p>' +
      window.DehesaChart.render({ series: [{ name: t.avg, color: '#2f6b4a', pts: pts }], xMode: 'time', yTitle: 'C$/cwt', aria: t.chart + ' ' + label(D.classes[ci], t), noLegend: true, vFmt: function (v) { return nf(v, 2, lang); }, yFmt: function (v) { return nf(v, 0, lang); },
        xFmt: function (x) { var d = new Date(x); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); } });
    // todas las clases de la semana
    var cells = function (r) { return r ? '<td class="r">' + nf(r[0], 2, lang) + '</td><td class="r">' + nf(r[1], 2, lang) + '</td><td class="r"><b>' + nf(r[2], 2, lang) + '</b></td>' : '<td class="r">–</td><td class="r">–</td><td class="r">–</td>'; };
    h += '<details><summary style="cursor:pointer;font-size:13px">' + esc(t.tbl) + ' · ' + esc(st.mart === 'all' ? t.all : st.mart) + '</summary><div class="de-sc"><table class="de-t" data-no-cards><thead><tr><th scope="col">' + esc(t.cls) + '</th><th scope="col" class="r">' + esc(t.low) + '</th><th scope="col" class="r">' + esc(t.high) + '</th><th scope="col" class="r">' + esc(t.avg) + '</th></tr></thead><tbody>' +
      D.classes.map(function (k, i) { return '<tr><td>' + esc(label(k, t)) + '</td>' + cells(trio(w, st.mart, i)) + '</tr>'; }).join('') + '</tbody></table></div></details>';
    h += '<p class="di-movers-hint">' + esc(t.note) + '</p><p class="di-movers-hint">' + esc(t.lic) + '</p>' + cite(last);
    box.innerHTML = h;
  }

  function mount(body, lang) {
    lang = T[lang] ? lang : 'es'; var t = T[lang], st = { cls: 'steer701', mart: 'all' };
    body.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>';
    load().then(function () { render(body, st, lang); }).catch(function () { body.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; });
    body.addEventListener('change', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-mb'); if (!a || !D) return;
      st[a] = e.target.value; render(body, st, lang);
      var n = body.querySelector('[data-mb="' + a + '"]'); if (n) n.focus();
    });
  }
  window.MBCattle = { mount: mount };
})();
