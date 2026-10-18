/* Dehesa Index — Bloques de series de la UE con selector (producción vegetal por país; precios ecológicos). ES5.
   Cada bloque lee un fichero *-stats.json (formato común: countries.<CC>.series[]) y muestra: país -> categoría -> serie -> gráfica + últimos 12 periodos.
   Los nombres de las series están como los publica la fuente (en inglés). No se calcula nada: cada punto es una cifra publicada. */
(function () {
  'use strict';
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var BLOCKS = {
    eprod: { file: 'data/eu-production-stats.json', cite: 'eu_agrifood', url: 'https://agridata.ec.europa.eu/extensions/DashboardCereals/CerealsProduction.html', def: 'ES',
      h: ['Producción vegetal por país (campaña en curso incluida)', 'Crop production by country (current campaign included)', 'Production végétale par pays (campagne en cours incluse)', 'Produzione vegetale per paese (campagna in corso inclusa)'],
      sub: ['Producción, superficie y rendimiento de cereales y oleaginosas por país, arroz, remolacha azucarera por región y aceite de oliva por mes, del portal agroalimentario de la Comisión Europea. Llega antes que los datos finales de Eurostat.',
        'Production, area and yield of cereals and oilseeds by country, rice, sugar beet by region and olive oil by month, from the European Commission’s Agri-food Data Portal. It arrives earlier than Eurostat’s final figures.',
        'Production, superficie et rendement des céréales et oléagineux par pays, riz, betterave sucrière par région et huile d’olive par mois, du portail agroalimentaire de la Commission européenne. Ils arrivent avant les chiffres définitifs d’Eurostat.',
        'Produzione, superficie e resa di cereali e semi oleosi per paese, riso, barbabietola da zucchero per regione e olio d’oliva per mese, dal portale agroalimentare della Commissione europea. Arrivano prima dei dati definitivi di Eurostat.'],
      note: ['El último año es la campaña en curso: el portal no indica si es definitivo, así que conviene tomarlo como provisional. Unidades como las publica el portal (miles de t, miles de ha, t/ha). El arroz suma los códigos NC que lista el portal para cada producto.',
        'The latest year is the current campaign: the portal does not say whether it is final, so treat it as provisional. Units as published by the portal (thousand t, thousand ha, t/ha). Rice adds up the CN codes the portal lists for each product.',
        'La dernière année est la campagne en cours : le portail n’indique pas si elle est définitive, il faut donc la considérer comme provisoire. Unités telles que publiées (milliers de t, milliers d’ha, t/ha). Le riz additionne les codes NC listés par le portail pour chaque produit.',
        'L’ultimo anno è la campagna in corso: il portale non dice se è definitivo, quindi va considerato provvisorio. Unità come pubblicate (migliaia di t, migliaia di ha, t/ha). Il riso somma i codici NC che il portale elenca per ogni prodotto.'] },
    eorg: { showNote: true, file: 'data/eu-organic-stats.json', cite: 'eu_agrifood', url: 'https://agridata.ec.europa.eu/extensions/DashboardPrices/OrganicPrices.html', def: 'ES',
      h: ['Precios ecológicos frente al producto de comparación', 'Organic prices against the comparison product', 'Prix bio face au produit de comparaison', 'Prezzi biologici rispetto al prodotto di confronto'],
      sub: ['Precio ecológico, precio del producto de comparación y diferencial en %, por país y mes: leche, huevos, vacuno, aves, cereales, oleaginosas y fruta y hortaliza (Comisión Europea).',
        'Organic price, comparison-product price and the premium in %, by country and month: milk, eggs, beef, poultry, cereals, oilseeds and fruit and vegetables (European Commission).',
        'Prix bio, prix du produit de comparaison et écart en %, par pays et par mois : lait, œufs, bœuf, volaille, céréales, oléagineux et fruits et légumes (Commission européenne).',
        'Prezzo biologico, prezzo del prodotto di confronto e differenza in %, per paese e mese: latte, uova, bovino, pollame, cereali, semi oleosi e frutta e ortaggi (Commissione europea).'],
      note: ['El diferencial es la cifra que publica la Comisión; Dehesa Index solo comprobó que cuadra con los dos precios. El producto de comparación es el que fija la Comisión (por ejemplo, huevos camperos o leche cruda), no necesariamente el convencional.',
        'The premium is the Commission’s own figure; Dehesa Index only checked that it matches the two prices. The comparison product is the one the Commission sets (for example free-range eggs or raw milk), not necessarily the conventional one.',
        'L’écart est le chiffre publié par la Commission ; Dehesa Index a seulement vérifié qu’il correspond aux deux prix. Le produit de comparaison est celui que fixe la Commission (par exemple œufs plein air ou lait cru), pas forcément le conventionnel.',
        'La differenza è la cifra pubblicata dalla Commissione; Dehesa Index ha solo verificato che torni con i due prezzi. Il prodotto di confronto è quello fissato dalla Commissione (per esempio uova all’aperto o latte crudo), non necessariamente il convenzionale.'] }
  };
  var T = {
    es: { ctry: 'País', cat: 'Categoría', ser: 'Serie', chart: 'Gráfica', last: 'Últimos 12 periodos', per: 'Periodo', val: 'Valor', chg: 'Cambio', open: 'Abrir la fuente', src: 'Último dato:', alt: 'Evolución de {n}', en: 'Los nombres de las series están como los publica la fuente (en inglés).' },
    en: { ctry: 'Country', cat: 'Category', ser: 'Series', chart: 'Chart', last: 'Last 12 periods', per: 'Period', val: 'Value', chg: 'Change', open: 'Open the source', src: 'Latest data:', alt: 'Trend of {n}', en: 'Series names appear as published by the source (in English).' },
    fr: { ctry: 'Pays', cat: 'Catégorie', ser: 'Série', chart: 'Graphique', last: '12 dernières périodes', per: 'Période', val: 'Valeur', chg: 'Variation', open: 'Ouvrir la source', src: 'Dernière donnée :', alt: 'Évolution de {n}', en: 'Les noms des séries sont ceux de la source (en anglais).' },
    it: { ctry: 'Paese', cat: 'Categoria', ser: 'Serie', chart: 'Grafico', last: 'Ultimi 12 periodi', per: 'Periodo', val: 'Valore', chg: 'Variazione', open: 'Apri la fonte', src: 'Ultimo dato:', alt: 'Andamento di {n}', en: 'I nomi delle serie sono quelli della fonte (in inglese).' }
  };
  var STATE = {};
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function fv(v) { if (v == null) return '—'; var a = Math.abs(v); return nf(v, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function clean(l) { return String(l).replace(/\s*\((?:EU Agri-food[^()]*)\)\s*$/, ''); }
  function catOf(s) { var i = String(s.label).indexOf(':'); return i > 0 ? s.label.slice(0, i) : s.group; }
  function ts(p) { var m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(String(p)); return m ? Date.UTC(+m[1], m[2] ? +m[2] - 1 : 0, m[3] ? +m[3] : 1) : null; }
  function cname(c, code) { try { var dn = window.Intl && Intl.DisplayNames ? new Intl.DisplayNames([lang()], { type: 'region' }) : null; var iso = { EL: 'GR', UK: 'GB' }[code] || code; if (dn && code !== 'EU') return dn.of(iso) || c.name; } catch (e) {} return c.name || code; }
  function chart(s, T0) {
    if (!window.DehesaChart || !window.DehesaChart.render) return '';
    var rows = s.points.slice(-(s.frequency === 'annual' ? 40 : 120)), pts = [], k, t;
    for (k = 0; k < rows.length; k++) { t = ts(rows[k][0]); if (t != null) pts.push({ x: t, y: rows[k][1], l: rows[k][0] }); }
    if (pts.length < 3) return '';
    return window.DehesaChart.render({ series: [{ name: clean(s.label), color: '#1d5178', pts: pts }], xMode: 'time', yTitle: s.unit || '', aria: T0.alt.replace('{n}', clean(s.label)), zero: false, noLegend: true, vFmt: fv });
  }
  function render(id) {
    var root = document.getElementById(id), st = STATE[id], b = BLOCKS[id]; if (!root || !st) return;
    var P = LI[lang()] || 0, T0 = T[lang()] || T.es, codes = Object.keys(st.countries);
    codes.sort(function (a, c) { return cname(st.countries[a], a).localeCompare(cname(st.countries[c], c), lang()); });
    if (!st.cc || !st.countries[st.cc]) st.cc = st.countries[b.def] ? b.def : codes[0];
    var all = st.countries[st.cc].series, cats = [], seen = {}, list = [];
    all.forEach(function (s) { var c = catOf(s); if (!seen[c]) { seen[c] = 1; cats.push(c); } });
    cats.sort(function (a, c) { return a.localeCompare(c, 'en'); });
    if (!st.cat || !seen[st.cat]) st.cat = cats[0];
    all.forEach(function (s) { if (catOf(s) === st.cat) list.push(s); });
    if (!st.sid || !list.some(function (s) { return s.id === st.sid; })) st.sid = list[0].id;
    var s = list.filter(function (x) { return x.id === st.sid; })[0];
    var sel = '<div style="display:flex;flex-wrap:wrap;gap:10px 18px;margin:10px 0 4px"><label class="di-movers-hint">' + esc(T0.ctry) + '<select data-cpick="1" id="' + id + '-cc" style="display:block;margin-top:4px;font:inherit;max-width:100%">' +
      codes.map(function (c) { return '<option value="' + esc(c) + '"' + (c === st.cc ? ' selected' : '') + '>' + esc(cname(st.countries[c], c)) + '</option>'; }).join('') + '</select></label>' +
      '<label class="di-movers-hint">' + esc(T0.cat) + '<select id="' + id + '-cat" style="display:block;margin-top:4px;font:inherit;max-width:100%">' +
      cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === st.cat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
      '<label class="di-movers-hint" style="flex:1 1 280px">' + esc(T0.ser) + '<select id="' + id + '-ser" style="display:block;margin-top:4px;font:inherit;max-width:100%;width:100%">' +
      list.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === st.sid ? ' selected' : '') + '>' + esc(clean(x.label).replace(/^[^:]*:\s*/, '')) + '</option>'; }).join('') + '</select></label></div>';
    var rows = s.points.slice(-12).reverse(), body = '';
    var th = 'padding:7px 6px;font-size:11px;font-weight:700;color:var(--text-faint);text-align:right;', td = 'padding:6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';
    rows.forEach(function (r, j) {
      var prev = s.points[s.points.length - 1 - j - 1], ch = prev && prev[1] ? (r[1] / prev[1] - 1) * 100 : null;
      body += '<tr><th scope="row" style="' + td + 'text-align:left;font-weight:400">' + esc(r[0]) + '</th><td style="' + td + '">' + esc(fv(r[1])) + '</td><td style="' + td + '">' + (ch == null ? '—' : esc((ch > 0 ? '+' : '') + nf(ch, 1) + ' %')) + '</td></tr>';
    });
    var tab = '<details class="usm-more"><summary>' + esc(T0.last) + '</summary><div style="overflow:auto"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr><th scope="col" style="' + th + 'text-align:left">' + esc(T0.per) + '</th><th scope="col" style="' + th + '">' + esc(T0.val) + ' (' + esc(s.unit || '') + ')</th><th scope="col" style="' + th + '">' + esc(T0.chg) + '</th></tr></thead><tbody>' + body + '</tbody></table></div></details>';
    var cite = window.DICite && window.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + window.DICite.html(b.cite, { period: s.latestPeriod }) + '</div>' : '';
    root.innerHTML = '<h2 class="cof-h2">' + esc(b.h[P]) + '</h2><p class="cof-sub">' + esc(b.sub[P]) + '</p>' + sel + '<h3 class="cof-h3">' + esc(clean(s.label)) + ' · ' + esc(T0.chart) + '</h3>' + chart(s, T0) + tab +
      '<p class="cof-note">' + (b.showNote ? esc(s.periodNote || '') + ' ' : '') + esc(b.note[P]) + ' ' + esc(T0.en) + ' ' + esc(T0.src) + ' ' + esc(s.latestPeriod) + '. <a href="' + esc(b.url) + '" target="_blank" rel="noopener noreferrer">' + esc(T0.open) + '</a></p>' + cite;
    var a = document.getElementById(id + '-cc'), c = document.getElementById(id + '-cat'), r = document.getElementById(id + '-ser');
    if (a) a.onchange = function () { st.cc = a.value; st.cat = null; st.sid = null; render(id); };
    if (c) c.onchange = function () { st.cat = c.value; st.sid = null; render(id); };
    if (r) r.onchange = function () { st.sid = r.value; render(id); };
  }
  function boot() {
    var ids = Object.keys(BLOCKS).filter(function (k) { return document.getElementById(k); });
    if (!ids.length) return;
    ids.forEach(function (id) {
      var go = function () { Promise.all([fetch(BLOCKS[id].file).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) {
        var cs = a[0] && a[0].countries; if (!cs || Object.keys(cs).length < 3) return;
        STATE[id] = { countries: cs, cc: null, cat: null, sid: null }; render(id);
      }); }, el = document.getElementById(id), done = false, once = function () { if (!done) { done = true; go(); } };
      // el fichero pesa cerca de 1 MB: se pide cuando el bloque esta a punto de verse
      if (el && 'IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e.some(function (x) { return x.isIntersecting; })) { io.disconnect(); once(); } }, { rootMargin: '800px 0px' }); io.observe(el); } else once();
    });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); ids.forEach(render); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
