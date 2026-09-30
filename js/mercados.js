/* Dehesa Index — Mercados USDA. Lee data/ams/*.json (USDA AMS Market News, API MARS). */
(function () {
  'use strict';
  var IDX = null, CACHE = {}, SEL = { fam: null, id: null, f: {}, q: '', all: false, sel: null, lim: 60 };
  var COL = '#2a6f97';
  var T = {
    es: { title: 'Mercados USDA', sub: 'Precios de mercado de EE. UU. tal como los publica USDA AMS Market News: piensos y subproductos, etanol, granos, legumbres, aves, huevos, ganado, heno y lácteos. Unidades y monedas originales, sin convertir.',
      family: 'Sector', report: 'Informe', search: 'Buscar', searchPh: 'p. ej. soybean, Iowa, alfalfa…', all: 'Incluir series sin dato reciente', desc: 'Producto', unit: 'Unidad', date: 'Fecha', price: 'Precio', range: 'Rango', chg: 'Var.', mid: 'punto medio del rango', shown: 'series', of: 'de', more: 'Mostrar más', none: 'Ninguna serie coincide con estos filtros.', noData: 'Los datos de mercados USDA aún no están disponibles.',
      history: 'Histórico', cols: 'Últimos datos', allv: 'Todos', open: 'Ver el informe en USDA', updated: 'Último dato del informe', pts: 'puntos',
      caveat: 'Son precios de mercado de EE. UU. publicados por USDA AMS; no son un índice de Dehesa Index ni son comparables con los europeos: cada informe tiene su propia base (lugar, calidad, entrega, unidad). Cuando el informe no da un precio medio, se muestra el punto medio del rango y se indica.',
      src: 'Fuente: USDA AMS Market News (API MARS), datos públicos del Gobierno de EE. UU.', methodLink: 'Metodología', fams: { feed: 'Piensos y subproductos', bio: 'Etanol y coproductos', grain: 'Granos y algodón', oilseed: 'Oleaginosas', pulse: 'Legumbres', rice: 'Arroz', poultry: 'Aves y huevos', meat: 'Carne y subproductos', pig: 'Cerdos de recría y ovino', cattle: 'Ganado directo', hay: 'Heno', dairy: 'Lácteos', auction: 'Subastas de ganado', costs: 'Costes de producción', fv: 'Frutas y hortalizas' } },
    en: { title: 'USDA markets', sub: 'U.S. market prices as published by USDA AMS Market News: feed and by-products, ethanol, grains, pulses, poultry, eggs, livestock, hay and dairy. Original units and currencies, not converted.',
      family: 'Sector', report: 'Report', search: 'Search', searchPh: 'e.g. soybean, Iowa, alfalfa…', all: 'Include series with no recent data', desc: 'Product', unit: 'Unit', date: 'Date', price: 'Price', range: 'Range', chg: 'Chg.', mid: 'midpoint of the range', shown: 'series', of: 'of', more: 'Show more', none: 'No series match these filters.', noData: 'USDA market data is not available yet.',
      history: 'History', cols: 'Latest data', allv: 'All', open: 'View the report at USDA', updated: 'Latest data in the report', pts: 'points',
      caveat: 'These are U.S. market prices published by USDA AMS; they are not a Dehesa Index measure and are not comparable with European ones: each report has its own basis (place, quality, delivery, unit). When a report gives no average price, the midpoint of the range is shown and flagged.',
      src: 'Source: USDA AMS Market News (MARS API), public U.S. Government data.', methodLink: 'Methodology', fams: { feed: 'Feed and by-products', bio: 'Ethanol and co-products', grain: 'Grains and cotton', oilseed: 'Oilseeds', pulse: 'Pulses', rice: 'Rice', poultry: 'Poultry and eggs', meat: 'Meat and by-products', pig: 'Feeder pigs and sheep', cattle: 'Direct cattle', hay: 'Hay', dairy: 'Dairy', auction: 'Cattle auctions', costs: 'Production costs', fv: 'Fruits and vegetables' } },
    fr: { title: 'Marchés USDA', sub: 'Prix de marché américains tels que publiés par USDA AMS Market News : aliments et sous-produits, éthanol, céréales, légumineuses, volaille, œufs, bétail, foin et produits laitiers. Unités et devises d’origine, sans conversion.',
      family: 'Secteur', report: 'Rapport', search: 'Rechercher', searchPh: 'ex. soybean, Iowa, alfalfa…', all: 'Inclure les séries sans donnée récente', desc: 'Produit', unit: 'Unité', date: 'Date', price: 'Prix', range: 'Fourchette', chg: 'Var.', mid: 'milieu de la fourchette', shown: 'séries', of: 'sur', more: 'Afficher plus', none: 'Aucune série ne correspond à ces filtres.', noData: 'Les données des marchés USDA ne sont pas encore disponibles.',
      history: 'Historique', cols: 'Dernières données', allv: 'Tous', open: 'Voir le rapport chez l’USDA', updated: 'Dernière donnée du rapport', pts: 'points',
      caveat: 'Ce sont des prix de marché américains publiés par USDA AMS ; ils ne constituent pas un indicateur de Dehesa Index et ne sont pas comparables aux prix européens : chaque rapport a sa propre base (lieu, qualité, livraison, unité). Lorsqu’un rapport ne donne pas de prix moyen, le milieu de la fourchette est affiché et signalé.',
      src: 'Source : USDA AMS Market News (API MARS), données publiques du gouvernement américain.', methodLink: 'Méthodologie', fams: { feed: 'Aliments et sous-produits', bio: 'Éthanol et coproduits', grain: 'Céréales et coton', oilseed: 'Oléagineux', pulse: 'Légumineuses', rice: 'Riz', poultry: 'Volaille et œufs', meat: 'Viande et sous-produits', pig: 'Porcelets et ovins', cattle: 'Bétail direct', hay: 'Foin', dairy: 'Produits laitiers', auction: 'Ventes aux enchères de bétail', costs: 'Coûts de production', fv: 'Fruits et légumes' } },
    it: { title: 'Mercati USDA', sub: 'Prezzi di mercato USA come pubblicati da USDA AMS Market News: mangimi e sottoprodotti, etanolo, cereali, legumi, pollame, uova, bestiame, fieno e latticini. Unità e valute originali, senza conversione.',
      family: 'Settore', report: 'Rapporto', search: 'Cerca', searchPh: 'es. soybean, Iowa, alfalfa…', all: 'Includi serie senza dati recenti', desc: 'Prodotto', unit: 'Unità', date: 'Data', price: 'Prezzo', range: 'Intervallo', chg: 'Var.', mid: 'punto medio dell’intervallo', shown: 'serie', of: 'di', more: 'Mostra altro', none: 'Nessuna serie corrisponde a questi filtri.', noData: 'I dati dei mercati USDA non sono ancora disponibili.',
      history: 'Storico', cols: 'Ultimi dati', allv: 'Tutti', open: 'Vedi il rapporto presso USDA', updated: 'Ultimo dato del rapporto', pts: 'punti',
      caveat: 'Sono prezzi di mercato USA pubblicati da USDA AMS; non sono un indicatore di Dehesa Index e non sono confrontabili con quelli europei: ogni rapporto ha la propria base (luogo, qualità, consegna, unità). Quando un rapporto non fornisce un prezzo medio, viene mostrato il punto medio dell’intervallo e segnalato.',
      src: 'Fonte: USDA AMS Market News (API MARS), dati pubblici del governo USA.', methodLink: 'Metodologia', fams: { feed: 'Mangimi e sottoprodotti', bio: 'Etanolo e coprodotti', grain: 'Cereali e cotone', oilseed: 'Semi oleosi', pulse: 'Legumi', rice: 'Riso', poultry: 'Pollame e uova', meat: 'Carne e sottoprodotti', pig: 'Suinetti e ovini', cattle: 'Bestiame diretto', hay: 'Fieno', dairy: 'Latticini', auction: 'Aste di bestiame', costs: 'Costi di produzione', fv: 'Frutta e verdura' } }
  };
  var FAM_ORDER = ['feed', 'bio', 'grain', 'oilseed', 'pulse', 'rice', 'poultry', 'meat', 'pig', 'cattle', 'hay', 'dairy', 'auction', 'costs', 'fv'];
  function lang() { return window.DehesaShared.getLang(); }
  function t() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(v); } catch (e) { return v.toFixed(d); } }
  function fmt(v) { var a = Math.abs(v); return nf(v, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function val(p) { if (p[1] !== null) return { v: p[1], mid: false }; if (p[2] !== null && p[3] !== null) return { v: (p[2] + p[3]) / 2, mid: true }; if (p[2] !== null) return { v: p[2], mid: false }; if (p[3] !== null) return { v: p[3], mid: false }; return null; }
  function dateTxt(d) { try { return new Date(d + 'T12:00:00Z').toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } }
  function load(id) {
    if (CACHE[id]) return Promise.resolve(CACHE[id]);
    return fetch('data/ams/' + id + '.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) CACHE[id] = d; return d; }).catch(function () { return null; });
  }
  function labelOf(doc, s) { var o = []; doc.dn.forEach(function (n, i) { if (n !== 'Section' && s.v[i]) o.push(s.v[i]); }); return o.join(' · '); }
  function pretty(n) { n = String(n).replace(/[_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim(); return n.charAt(0).toUpperCase() + n.slice(1); }
  function reportsOf(fam) { return IDX.reports.filter(function (r) { return r.fam === fam; }).sort(function (a, b) { return a.title.localeCompare(b.title); }); }
  function cutoff(doc) { var d = new Date(doc.lastDate + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (doc.freq === 'd' ? 10 : 24)); return d.toISOString().slice(0, 10); }

  function chart(s) {
    var pts = [];
    s.p.forEach(function (p) { var v = val(p); if (v) pts.push({ d: p[0], v: v.v, lo: p[2], hi: p[3], mid: v.mid }); });
    if (pts.length < 2) return '<p class="di-movers-hint">' + esc(t().history) + ': ' + pts.length + ' ' + esc(t().pts) + '</p>';
    var W = 640, H = 200, L = 52, R = 12, Tp = 12, B = 24, vs = pts.map(function (p) { return p.v; });
    var mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
    if (mx === mn) { mx += 1; mn -= 1; } else { var pad = (mx - mn) * 0.12; mn -= pad; mx += pad; }
    var x = function (i) { return L + i * (W - L - R) / (pts.length - 1); }, y = function (v) { return Tp + (mx - v) / (mx - mn) * (H - Tp - B); };
    var g = '', i, k;
    for (k = 0; k <= 4; k++) { var gv = mn + (mx - mn) * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(gv) + '" y2="' + y(gv) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (y(gv) + 4) + '" text-anchor="end" font-size="10.5" fill="var(--text-faint)">' + fmt(gv) + '</text>'; }
    [0, Math.floor((pts.length - 1) / 2), pts.length - 1].forEach(function (j, n) { g += '<text x="' + x(j) + '" y="' + (H - 6) + '" text-anchor="' + (n === 0 ? 'start' : n === 2 ? 'end' : 'middle') + '" font-size="10.5" fill="var(--text-faint)">' + esc(pts[j].d.slice(0, 7)) + '</text>'; });
    var path = ''; pts.forEach(function (p, j) { path += (j ? ' L' : 'M') + x(j) + ',' + y(p.v); });
    g += '<path d="' + path + '" fill="none" stroke="' + COL + '" stroke-width="2" stroke-linejoin="round"/><circle cx="' + x(pts.length - 1) + '" cy="' + y(pts[pts.length - 1].v) + '" r="4" fill="' + COL + '" stroke="var(--surface,#fff)" stroke-width="2"/>';
    var h = '<div style="position:relative"><svg id="ms-ch" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;touch-action:pan-y" role="img" aria-label="' + esc(t().history) + '">' + g + '<line class="xh" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" stroke="var(--text-faint)" stroke-dasharray="3 3" style="display:none"/><rect class="hit" x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent"/></svg><div class="tip" style="display:none;position:absolute;top:0;pointer-events:none;background:var(--surface,#fff);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:12.5px;box-shadow:0 2px 10px rgba(0,0,0,.12);white-space:nowrap"></div></div>';
    return { html: h, pts: pts, W: W, L: L, R: R };
  }
  function wireChart(c, unit) {
    var svg = document.getElementById('ms-ch'); if (!svg || !c.pts) return;
    var box = svg.parentNode, tip = box.querySelector('.tip'), xh = svg.querySelector('.xh'), hit = svg.querySelector('.hit'), n = c.pts.length;
    function move(e) {
      var pt = e.touches ? e.touches[0] : e, r = svg.getBoundingClientRect(), fx = (pt.clientX - r.left) / r.width * c.W;
      var i = Math.round((fx - c.L) / (c.W - c.L - c.R) * (n - 1)); i = Math.max(0, Math.min(n - 1, i));
      var xx = c.L + i * (c.W - c.L - c.R) / (n - 1), p = c.pts[i];
      xh.setAttribute('x1', xx); xh.setAttribute('x2', xx); xh.style.display = '';
      tip.innerHTML = '<strong>' + esc(dateTxt(p.d)) + '</strong><br>' + fmt(p.v) + ' ' + esc(unit) + (p.mid ? ' (' + esc(t().mid) + ')' : '') + (p.lo !== null && p.hi !== null && !p.mid ? '<br>' + esc(t().range) + ': ' + fmt(p.lo) + '–' + fmt(p.hi) : '');
      tip.style.display = 'block';
      var left = xx / c.W * r.width + 10; if (left + tip.offsetWidth > r.width) left = xx / c.W * r.width - tip.offsetWidth - 10; tip.style.left = Math.max(0, left) + 'px';
    }
    hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', move); hit.addEventListener('touchmove', move);
    hit.addEventListener('mouseleave', function () { tip.style.display = 'none'; xh.style.display = 'none'; });
  }

  function page() {
    var x = t(); document.title = 'Dehesa Index — ' + x.title;
    document.getElementById('pg-h1').textContent = x.title; document.getElementById('pg-sub').textContent = x.sub;
    var fams = FAM_ORDER.filter(function (f) { return IDX.reports.some(function (r) { return r.fam === f; }); });
    if (fams.indexOf(SEL.fam) < 0) SEL.fam = fams[0];
    var reps = reportsOf(SEL.fam);
    if (!reps.some(function (r) { return r.id === SEL.id; })) { SEL.id = reps[0].id; SEL.f = {}; SEL.sel = null; }
    var body = document.getElementById('ms-body');
    var fopts = fams.map(function (f) { return '<option value="' + f + '"' + (f === SEL.fam ? ' selected' : '') + '>' + esc(x.fams[f]) + '</option>'; }).join('');
    var ropts = reps.map(function (r) { return '<option value="' + r.id + '"' + (r.id === SEL.id ? ' selected' : '') + '>' + esc(r.title) + '</option>'; }).join('');
    load(SEL.id).then(function (doc) {
      if (!doc) { body.innerHTML = '<p class="di-movers-hint">' + esc(x.noData) + '</p>'; return; }
      var co = cutoff(doc);
      var rows = doc.series.map(function (s, i) { return { i: i, s: s, last: s.p[s.p.length - 1] }; });
      if (!SEL.all) rows = rows.filter(function (r) { return r.last[0] >= co; });
      // filtros por dimensión
      var dimHtml = '';
      doc.dn.forEach(function (name, di) {
        var vals = {}; rows.forEach(function (r) { vals[r.s.v[di]] = 1; });
        var list = Object.keys(vals).filter(Boolean).sort();
        if (list.length < 2 || list.length > 60) return;
        dimHtml += '<label style="font-size:13px">' + esc(pretty(name)) + '<br><select class="di-compare-select" data-dim="' + di + '"><option value="">' + esc(x.allv) + '</option>' + list.map(function (v) { return '<option value="' + esc(v) + '"' + (SEL.f[di] === v ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select></label>';
      });
      Object.keys(SEL.f).forEach(function (di) { if (SEL.f[di]) rows = rows.filter(function (r) { return r.s.v[di] === SEL.f[di]; }); });
      var q = SEL.q.trim().toLowerCase();
      if (q) rows = rows.filter(function (r) { return (r.s.v.join(' ') + ' ' + r.s.u).toLowerCase().indexOf(q) >= 0; });
      var total = rows.length, shown = rows.slice(0, SEL.lim);
      var trs = shown.map(function (r) {
        var pv = val(r.last), prev = r.s.p.length > 1 ? val(r.s.p[r.s.p.length - 2]) : null, ch = pv && prev && prev.v ? (pv.v / prev.v - 1) * 100 : null;
        var desc = labelOf(doc, r.s) || doc.title, on = SEL.sel === r.i;
        return '<tr data-s="' + r.i + '" style="border-top:1px solid var(--border);cursor:pointer;' + (on ? 'background:var(--surface-2,rgba(0,0,0,.04))' : '') + '"><td style="padding:9px 6px;font-weight:' + (on ? '700' : '500') + '">' + esc(desc) + '</td><td style="padding:9px 6px;color:var(--text-faint);white-space:nowrap">' + esc(r.s.u) + '</td><td style="padding:9px 6px;white-space:nowrap">' + esc(dateTxt(r.last[0])) + '</td><td style="padding:9px 6px;text-align:right;white-space:nowrap;font-weight:600">' + (pv ? (pv.mid ? '≈ ' : '') + fmt(pv.v) : '—') + '</td><td style="padding:9px 6px;text-align:right;white-space:nowrap;color:var(--text-faint)">' + (r.last[2] !== null && r.last[3] !== null && r.last[2] !== r.last[3] ? fmt(r.last[2]) + '–' + fmt(r.last[3]) : '') + '</td><td style="padding:9px 6px;text-align:right;white-space:nowrap;color:' + (ch === null ? 'var(--text-faint)' : ch > 0 ? 'var(--up,#1b7f4b)' : ch < 0 ? 'var(--down,#b3261e)' : 'var(--text-faint)') + '">' + (ch === null ? '' : (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), 1) + ' %') + '</td></tr>';
      }).join('');
      var detail = '';
      if (SEL.sel !== null && doc.series[SEL.sel]) {
        var s = doc.series[SEL.sel], c = chart(s);
        detail = '<div class="di-card" style="padding:16px 18px;margin-bottom:14px"><h3 style="font-size:15px;margin:0 0 2px">' + esc(labelOf(doc, s) || doc.title) + '</h3><p class="di-movers-hint" style="margin:0 0 6px">' + esc(s.u) + ' · ' + s.p.length + ' ' + esc(x.pts) + '</p>' + (c.html || c) + '</div>';
        if (c.html) detail = detail.replace('</div></div>', '</div></div>');
      }
      body.innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px"><label style="font-size:13px">' + esc(x.family) + '<br><select id="ms-f" class="di-compare-select">' + fopts + '</select></label><label style="font-size:13px;flex:1;min-width:220px">' + esc(x.report) + '<br><select id="ms-r" class="di-compare-select" style="max-width:100%">' + ropts + '</select></label></div>' +
        '<p class="di-movers-hint" style="margin:0 0 12px">' + esc(x.updated) + ': ' + esc(dateTxt(doc.lastDate)) + ' · <a href="https://mymarketnews.ams.usda.gov/viewReport/' + doc.id + '" target="_blank" rel="noopener">' + esc(x.open) + ' →</a></p>' +
        '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;align-items:flex-end">' + dimHtml + '<label style="font-size:13px">' + esc(x.search) + '<br><input id="ms-q" type="text" value="' + esc(SEL.q) + '" placeholder="' + esc(x.searchPh) + '" class="di-compare-select" style="min-width:200px"></label><label style="font-size:13px;display:flex;gap:6px;align-items:center"><input id="ms-all" type="checkbox"' + (SEL.all ? ' checked' : '') + '> ' + esc(x.all) + '</label></div>' +
        detail + '<div class="di-card" style="padding:6px 16px;overflow-x:auto">' + (total ? '<table style="border-collapse:collapse;width:100%;min-width:560px;font-size:14px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:10px 6px">' + esc(x.desc.toUpperCase()) + '</th><th style="padding:10px 6px">' + esc(x.unit.toUpperCase()) + '</th><th style="padding:10px 6px">' + esc(x.date.toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + esc(x.price.toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + esc(x.range.toUpperCase()) + '</th><th style="padding:10px 6px;text-align:right">' + esc(x.chg.toUpperCase()) + '</th></tr>' + trs + '</table>' : '<p class="di-movers-hint" style="padding:14px 0">' + esc(x.none) + '</p>') + '</div>' +
        '<p class="di-movers-hint" style="margin-top:6px">' + shown.length + ' ' + esc(x.of) + ' ' + total + ' ' + esc(x.shown) + (total > shown.length ? ' · <button type="button" class="di-link-btn" id="ms-more">' + esc(x.more) + '</button>' : '') + '</p>' +
        '<p class="di-info-api-notice" style="margin:14px 0">' + esc(x.caveat) + '</p><p class="di-movers-hint">' + esc(x.src) + ' <a href="metodologia.html#mercados">' + esc(x.methodLink) + '</a>.</p>';
      document.getElementById('ms-f').onchange = function (e) { SEL.fam = e.target.value; SEL.id = null; SEL.q = ''; SEL.lim = 60; page(); };
      document.getElementById('ms-r').onchange = function (e) { SEL.id = parseInt(e.target.value, 10); SEL.f = {}; SEL.sel = null; SEL.q = ''; SEL.lim = 60; page(); };
      document.getElementById('ms-all').onchange = function (e) { SEL.all = e.target.checked; page(); };
      var qi = document.getElementById('ms-q'); qi.onchange = function () { SEL.q = qi.value; SEL.lim = 60; page(); };
      qi.onkeydown = function (e) { if (e.key === 'Enter') { SEL.q = qi.value; SEL.lim = 60; page(); } };
      Array.prototype.forEach.call(body.querySelectorAll('[data-dim]'), function (el) { el.onchange = function () { SEL.f[el.getAttribute('data-dim')] = el.value; SEL.lim = 60; page(); }; });
      Array.prototype.forEach.call(body.querySelectorAll('tr[data-s]'), function (tr) { tr.onclick = function () { SEL.sel = parseInt(tr.getAttribute('data-s'), 10); page(); window.scrollTo({ top: body.offsetTop - 20 }); }; });
      var mb = document.getElementById('ms-more'); if (mb) mb.onclick = function () { SEL.lim += 120; page(); };
      if (SEL.sel !== null && doc.series[SEL.sel]) { var cc = chart(doc.series[SEL.sel]); wireChart(cc, doc.series[SEL.sel].u); }
    });
  }
  var HT = {
    es: { h: 'Mercados USDA', hint: 'Precios de mercado de EE. UU. (USDA AMS)', more: 'Ver todos los mercados', n: 'informes' },
    en: { h: 'USDA markets', hint: 'U.S. market prices (USDA AMS)', more: 'See all markets', n: 'reports' },
    fr: { h: 'Marchés USDA', hint: 'Prix de marché américains (USDA AMS)', more: 'Voir tous les marchés', n: 'rapports' },
    it: { h: 'Mercati USDA', hint: 'Prezzi di mercato USA (USDA AMS)', more: 'Vedi tutti i mercati', n: 'rapporti' }
  };
  function teaser() {
    var el = document.getElementById('home-mercados'); if (!el || !IDX) return;
    var h = HT[lang()] || HT.es, x = t();
    var chips = FAM_ORDER.filter(function (f) { return IDX.reports.some(function (r) { return r.fam === f; }); }).map(function (f) {
      var n = IDX.reports.filter(function (r) { return r.fam === f; }).length;
      return '<a class="di-link-btn" href="mercados.html?fam=' + f + '" style="display:inline-block;margin:0 14px 8px 0">' + esc(x.fams[f]) + ' <span style="color:var(--text-faint)">(' + n + ')</span></a>';
    }).join('');
    el.innerHTML = '<div class="di-movers-head-row"><h2>' + esc(h.h) + '</h2><span class="di-movers-hint">' + esc(h.hint) + '</span></div><div class="di-card" style="padding:18px 20px">' + chips + '</div><p class="di-movers-hint" style="margin-top:10px"><a href="mercados.html">' + esc(h.more) + ' →</a> · ' + IDX.reports.length + ' ' + esc(h.n) + '</p>';
  }
  var isPage = !!document.getElementById('ms-body');
  if (!isPage && !document.getElementById('home-mercados')) return;
  if (!isPage) {
    fetch('data/ams/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.reports || !d.reports.length) return; IDX = d; teaser();
      var prev = window.DehesaShared.onLangChange;
      window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); teaser(); };
    }).catch(function () {});
    return;
  }
  window.DehesaShared.init('informacion');
  fetch('data/ams/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || !d.reports || !d.reports.length) { document.getElementById('pg-h1').textContent = t().title; document.getElementById('ms-body').innerHTML = '<p class="di-movers-hint">' + esc(t().noData) + '</p>'; return; }
    IDX = d;
    var qp = new URLSearchParams(window.location.search), r = parseInt(qp.get('r'), 10), fam = qp.get('fam');
    if (r) { var m = IDX.reports.filter(function (x) { return x.id === r; })[0]; if (m) { SEL.fam = m.fam; SEL.id = m.id; } } else if (fam) SEL.fam = fam;
    if (qp.get('q')) SEL.q = qp.get('q');
    page();
    var prev = window.DehesaShared.onLangChange;
    window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); page(); };
  }).catch(function () { document.getElementById('ms-body').innerHTML = '<p class="di-movers-hint">' + esc(t().noData) + '</p>'; });
})();
