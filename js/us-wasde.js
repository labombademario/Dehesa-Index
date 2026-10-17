/* Dehesa Index — WASDE de EE. UU. con las revisiones de cada mes (#wsd) y la previsión de precio de ERS por modelo frente al WASDE (#sap). ES5.
   Lee data/us-markets/wasde.json (scripts/update-us-wasde.py) y data/us-markets/sap-forecasts.json (scripts/update-us-sap.py).
   WASDE = cifras oficiales del USDA. La previsión de ERS es la salida de un modelo (futuros y base): NO es oficial y así se rotula. No se calcula nada. */
(function () {
  'use strict';
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var W = null, S = null, WC = null, WR = 0, SC = 0, SY = null;
  var TX = {
    es: { wh: 'WASDE: balances de oferta y demanda y sus revisiones', ws: 'Las cifras oficiales del informe mensual del USDA (trigo, maíz, soja, arroz, algodón, azúcar, carnes, huevos y leche) para los últimos años comerciales, con el valor del mes anterior para ver cuánto se ha revisado.',
      com: 'Producto', a: 'Magnitud', u: 'Unidad', prev: 'mes anterior', rev: 'Recorrido de las revisiones', since: 'El historial de revisiones empieza en {m} y crece con cada informe mensual; las revisiones de precios desde 2003 están en la previsión de ERS de abajo.', pick: 'Pulsa una fila para ver cómo se ha revisado.', none: 'Sin revisiones registradas todavía.',
      wn: 'Informe de {m}. Los nombres de las magnitudes están como los publica el USDA (en inglés). Est. = estimación, Proj. = proyección. Dehesa Index no calcula nada.', open: 'Abrir la fuente', g: { crops: 'Cultivos', oilseeds: 'Oleaginosas', livestock: 'Ganadería', dairy: 'Lácteos' },
      sh: 'Previsión de precio de ERS (modelo) frente al WASDE', ss: 'ERS calcula cada semana un precio medio de campaña con un modelo de futuros y base. No es una previsión oficial del USDA: la cifra oficial es la del WASDE, que se muestra al lado.', badge: 'MODELO · NO OFICIAL', my: 'Campaña', model: 'Modelo ERS (no oficial)', wasde: 'WASDE (oficial)', act: 'Resultado final publicado', sn: 'Última previsión del modelo: {d}. Fuente del modelo: ERS, Season-Average Price Forecasts.', alt: 'Previsión de {c}, campaña {y}' },
    en: { wh: 'WASDE: supply and demand balances and their revisions', ws: 'The official figures of USDA’s monthly report (wheat, corn, soybeans, rice, cotton, sugar, meats, eggs and milk) for the latest marketing years, with last month’s value to show how much was revised.',
      com: 'Commodity', a: 'Item', u: 'Unit', prev: 'previous month', rev: 'Revision path', since: 'The revision history starts in {m} and grows with each monthly report; price revisions since 2003 are in the ERS forecast below.', pick: 'Click a row to see how it was revised.', none: 'No revisions recorded yet.',
      wn: 'Report of {m}. Item names appear as published by USDA (in English). Est. = estimate, Proj. = projection. Dehesa Index calculates nothing.', open: 'Open the source', g: { crops: 'Crops', oilseeds: 'Oilseeds', livestock: 'Livestock', dairy: 'Dairy' },
      sh: 'ERS price forecast (model) versus WASDE', ss: 'ERS computes a season-average price every week with a futures-and-basis model. It is not an official USDA forecast: the official figure is the WASDE number, shown alongside.', badge: 'MODEL · NOT OFFICIAL', my: 'Marketing year', model: 'ERS model (not official)', wasde: 'WASDE (official)', act: 'Final published result', sn: 'Latest model forecast: {d}. Model source: ERS, Season-Average Price Forecasts.', alt: '{c} forecast, {y} marketing year' },
    fr: { wh: 'WASDE : bilans offre-demande et leurs révisions', ws: 'Les chiffres officiels du rapport mensuel de l’USDA (blé, maïs, soja, riz, coton, sucre, viandes, œufs et lait) pour les dernières campagnes, avec la valeur du mois précédent pour voir l’ampleur de la révision.',
      com: 'Produit', a: 'Poste', u: 'Unité', prev: 'mois précédent', rev: 'Parcours des révisions', since: 'L’historique des révisions commence en {m} et s’allonge à chaque rapport mensuel ; les révisions de prix depuis 2003 figurent dans la prévision de l’ERS ci-dessous.', pick: 'Cliquez sur une ligne pour voir sa révision.', none: 'Aucune révision enregistrée pour l’instant.',
      wn: 'Rapport de {m}. Les noms des postes sont ceux de l’USDA (en anglais). Est. = estimation, Proj. = projection. Dehesa Index ne calcule rien.', open: 'Ouvrir la source', g: { crops: 'Cultures', oilseeds: 'Oléagineux', livestock: 'Élevage', dairy: 'Produits laitiers' },
      sh: 'Prévision de prix de l’ERS (modèle) face au WASDE', ss: 'L’ERS calcule chaque semaine un prix moyen de campagne avec un modèle de contrats à terme et de base. Ce n’est pas une prévision officielle de l’USDA : le chiffre officiel est celui du WASDE, affiché à côté.', badge: 'MODÈLE · NON OFFICIEL', my: 'Campagne', model: 'Modèle ERS (non officiel)', wasde: 'WASDE (officiel)', act: 'Résultat final publié', sn: 'Dernière prévision du modèle : {d}. Source du modèle : ERS, Season-Average Price Forecasts.', alt: 'Prévision de {c}, campagne {y}' },
    it: { wh: 'WASDE: bilanci di offerta e domanda e le loro revisioni', ws: 'Le cifre ufficiali del rapporto mensile dell’USDA (frumento, mais, soia, riso, cotone, zucchero, carni, uova e latte) per le ultime campagne, con il valore del mese precedente per vedere quanto è stato rivisto.',
      com: 'Prodotto', a: 'Voce', u: 'Unità', prev: 'mese precedente', rev: 'Percorso delle revisioni', since: 'Lo storico delle revisioni parte da {m} e cresce a ogni rapporto mensile; le revisioni dei prezzi dal 2003 sono nella previsione ERS qui sotto.', pick: 'Clicca una riga per vedere come è stata rivista.', none: 'Nessuna revisione registrata finora.',
      wn: 'Rapporto di {m}. I nomi delle voci sono quelli dell’USDA (in inglese). Est. = stima, Proj. = proiezione. Dehesa Index non calcola nulla.', open: 'Apri la fonte', g: { crops: 'Colture', oilseeds: 'Semi oleosi', livestock: 'Zootecnia', dairy: 'Latte e derivati' },
      sh: 'Previsione di prezzo ERS (modello) a confronto con il WASDE', ss: 'L’ERS calcola ogni settimana un prezzo medio di campagna con un modello di futures e base. Non è una previsione ufficiale dell’USDA: la cifra ufficiale è quella del WASDE, mostrata accanto.', badge: 'MODELLO · NON UFFICIALE', my: 'Campagna', model: 'Modello ERS (non ufficiale)', wasde: 'WASDE (ufficiale)', act: 'Risultato finale pubblicato', sn: 'Ultima previsione del modello: {d}. Fonte del modello: ERS, Season-Average Price Forecasts.', alt: 'Previsione di {c}, campagna {y}' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function fv(v) { if (v == null) return '—'; var a = Math.abs(v); return nf(v, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function cite(id, period) { return window.DICite && window.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + window.DICite.html(id, { period: period }) + '</div>' : ''; }
  var TH = 'padding:7px 6px;font-size:11px;font-weight:700;color:var(--text-faint);text-align:right;white-space:nowrap;', TD = 'padding:6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';
  function renderW() {
    var root = document.getElementById('wsd'); if (!root || !W) return;
    var T0 = TX[lang()] || TX.es, coms = [], seen = {}, i, g, byG = {};
    W.items.forEach(function (it) { if (!seen[it.cn]) { seen[it.cn] = 1; (byG[it.g] = byG[it.g] || []).push(it.cn); } });
    if (!WC || !seen[WC]) WC = seen.Corn ? 'Corn' : W.items[0].cn;
    var rows = W.items.filter(function (it) { return it.cn === WC; }), yrs = [];
    rows.forEach(function (it) { it.rows.forEach(function (r) { if (yrs.indexOf(r.my) < 0) yrs.push(r.my); }); });
    yrs.sort(); yrs = yrs.slice(-3);
    if (WR >= rows.length) WR = 0;
    var sel = '<label class="di-movers-hint" style="display:block;margin:10px 0 4px">' + esc(T0.com) + '<select id="wsd-sel" style="display:block;margin-top:4px;font:inherit;max-width:100%">' +
      ['crops', 'oilseeds', 'livestock', 'dairy'].filter(function (k) { return byG[k]; }).map(function (k) { return '<optgroup label="' + esc(T0.g[k]) + '">' + byG[k].map(function (c) { return '<option value="' + esc(c) + '"' + (c === WC ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select></label>';
    var head = '<tr><th scope="col" style="' + TH + 'text-align:left">' + esc(T0.a) + '</th><th scope="col" style="' + TH + 'text-align:left">' + esc(T0.u) + '</th>' + yrs.map(function (y) { return '<th scope="col" style="' + TH + '">' + esc(y) + '</th>'; }).join('') + '</tr>';
    var body = rows.map(function (it, j) {
      var cells = yrs.map(function (y) {
        var r = null; it.rows.forEach(function (x) { if (x.my === y) r = x; });
        if (!r || r.v == null) return '<td style="' + TD + '">—</td>';
        var ch = r.prev != null && r.prev !== r.v ? '<br><span style="font-size:11px;color:var(--text-faint)">' + esc(T0.prev) + ': ' + esc(fv(r.prev)) + '</span>' : '';
        return '<td style="' + TD + '">' + esc(fv(r.v)) + (r.st ? ' <span style="font-size:11px;color:var(--text-faint)">' + esc(r.st) + '</span>' : '') + ch + '</td>';
      }).join('');
      return '<tr class="wsd-r" data-j="' + j + '" tabindex="0" style="cursor:pointer;' + (j === WR ? 'background:var(--bg-soft,rgba(0,0,0,.05))' : '') + '"><th scope="row" style="' + TD + 'text-align:left;font-weight:400">' + esc(it.a) + '</th><td style="' + TD + 'text-align:left">' + esc(it.u) + '</td>' + cells + '</tr>';
    }).join('');
    var it0 = rows[WR], path = '';
    it0.rows.forEach(function (r) { if (r.hist && r.hist.length > 1) path += '<p class="di-movers-hint"><strong>' + esc(r.my) + '</strong>: ' + r.hist.map(function (h) { return esc(h[0]) + ' ' + esc(fv(h[1])); }).join(' → ') + '</p>'; });
    var rev = '<h3 class="cof-h3">' + esc(T0.rev) + ' · ' + esc(it0.a) + '</h3>' + (path || '<p class="di-movers-hint">' + esc(T0.none) + '</p>') + '<p class="di-movers-hint">' + esc(f(T0.since, { m: W.ledgerSince })) + '</p>';
    root.innerHTML = '<h2 class="cof-h2">' + esc(T0.wh) + '</h2><p class="cof-sub">' + esc(T0.ws) + '</p>' + sel + '<div style="overflow:auto;max-height:520px"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div><p class="di-movers-hint">' + esc(T0.pick) + '</p>' + rev +
      '<p class="cof-note">' + esc(f(T0.wn, { m: W.reportMonth })) + ' <a href="' + esc(W.pageUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(T0.open) + '</a></p>' + cite('usda_oce_wasde', W.reportMonth);
    var s = document.getElementById('wsd-sel'); if (s) s.onchange = function () { WC = s.value; WR = 0; renderW(); };
    Array.prototype.forEach.call(root.querySelectorAll('.wsd-r'), function (el) { function go() { WR = +el.getAttribute('data-j'); renderW(); } el.onclick = go; el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  }
  function renderS() {
    var root = document.getElementById('sap'); if (!root || !S) return;
    var T0 = TX[lang()] || TX.es, c = S.commodities[SC] || S.commodities[0], ys = c.years, y = null, i;
    for (i = 0; i < ys.length; i++) if (ys[i].label === SY) y = ys[i];
    if (!y) { y = ys[ys.length - 1]; for (i = ys.length - 1; i >= 0; i--) if (ys[i].actual == null) y = ys[i]; SY = y.label; }
    var pm = [], pw = [], k, t;
    for (k = 0; k < y.points.length; k++) {
      var p = y.points[k], q = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p[0]); if (!q) continue; t = Date.UTC(+q[1], +q[2] - 1, +q[3]);
      if (p[1] != null) pm.push({ x: t, y: p[1], l: p[0] }); if (p[2] != null) pw.push({ x: t, y: p[2], l: p[0] });
    }
    var ser = [{ name: T0.model, color: '#1d5178', pts: pm }]; if (pw.length > 1) ser.push({ name: T0.wasde, color: '#b5651d', pts: pw });
    var ch = window.DehesaChart && window.DehesaChart.render && pm.length > 2 ? window.DehesaChart.render({ series: ser, xMode: 'time', yTitle: c.unit, aria: f(T0.alt, { c: c.id, y: y.label }), zero: false, noLegend: false, vFmt: fv }) : '';
    var sel = '<div style="display:flex;flex-wrap:wrap;gap:10px 18px;margin:10px 0 4px"><label class="di-movers-hint">' + esc(T0.com) + '<select id="sap-c" style="display:block;margin-top:4px;font:inherit">' + S.commodities.map(function (x, j) { return '<option value="' + j + '"' + (j === SC ? ' selected' : '') + '>' + esc(x.id) + '</option>'; }).join('') + '</select></label>' +
      '<label class="di-movers-hint">' + esc(T0.my) + '<select id="sap-y" style="display:block;margin-top:4px;font:inherit">' + ys.map(function (x) { return '<option value="' + esc(x.label) + '"' + (x.label === y.label ? ' selected' : '') + '>' + esc(x.label) + '</option>'; }).join('') + '</select></label></div>';
    var act = y.actual != null ? '<p class="di-movers-hint">' + esc(T0.act) + ': <strong>' + esc(fv(y.actual)) + ' ' + esc(c.unit) + '</strong></p>' : '';
    root.innerHTML = '<h2 class="cof-h2">' + esc(T0.sh) + ' <span style="font-size:11px;font-weight:700;letter-spacing:.04em;border:1px solid currentColor;border-radius:4px;padding:2px 6px;vertical-align:middle">' + esc(T0.badge) + '</span></h2><p class="cof-sub">' + esc(T0.ss) + '</p>' + sel + ch + act +
      '<p class="cof-note">' + esc(f(T0.sn, { d: S.latestForecastDate })) + ' <a href="' + esc(S.pageUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(T0.open) + '</a></p>' + cite('usda_ers', S.latestForecastDate);
    var a = document.getElementById('sap-c'), b = document.getElementById('sap-y');
    if (a) a.onchange = function () { SC = +a.value; SY = null; renderS(); };
    if (b) b.onchange = function () { SY = b.value; renderS(); };
  }
  function getj(u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function boot() {
    if (!document.getElementById('wsd') && !document.getElementById('sap')) return;
    Promise.all([getj('data/us-markets/wasde.json'), getj('data/us-markets/sap-forecasts.json'), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) {
      W = a[0] && a[0].items && a[0].items.length >= 150 ? a[0] : null; S = a[1] && a[1].commodities && a[1].commodities.length >= 3 && a[1].official === false ? a[1] : null;
      renderW(); renderS();
    });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); renderW(); renderS(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
