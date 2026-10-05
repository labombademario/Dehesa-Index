/* Colorea el mapa de un país por una métrica regional (sequía, producción agraria, superficie, exportaciones…) con los mismos ficheros de data/ que leen los perfiles.
   Solo colorea lo que la fuente publica: las regiones sin dato quedan en gris y se dice. Lo usan paises.js y region.js. */
(function () {
  'use strict';
  var L4 = { en: 0, es: 1, fr: 2, it: 3 }, G = ['#e8f1e4', '#bfdcb8', '#8cc08c', '#4f9a62', '#1f6b43'], O = ['#fdecc8', '#f9c97a', '#ef9b4a', '#d4622d', '#a32d1f'], NODATA = '#e4e4e0';
  var cache = {};
  function get(u) { return cache[u] || (cache[u] = fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function last(a) { for (var i = (a || []).length - 1; i >= 0; i--) if (a[i][1] != null) return a[i]; return null; }
  function at(a, y) { for (var i = 0; i < (a || []).length; i++) if (+a[i][0] === +y && a[i][1] != null) return a[i][1]; return null; }
  var EU_FILE = { ES: 'es', FR: 'fr', IT: 'it', DE: 'de' };
  var M = {
    US: [
      { id: 'drought', ramp: O, unit: ' %', label: ['Drought (moderate or worse)', 'Sequía (moderada o peor)', 'Sécheresse (modérée ou pire)', 'Siccità (moderata o peggiore)'], dec: 1 },
      { id: 'cattle', ramp: G, unit: '', label: ['Cattle on feed (thousand head)', 'Vacuno en cebaderos (miles de cabezas)', 'Bovins en engraissement (milliers de têtes)', 'Bovini in ingrasso (migliaia di capi)'], dec: 0 },
      { id: 'tax', ramp: G, unit: ' %', label: ['State sales tax rate', 'Impuesto estatal sobre las ventas', 'Taxe de vente de l’État', 'Imposta statale sulle vendite'], dec: 2 }],
    CA: [
      { id: 'drought', ramp: O, unit: ' %', label: ['Drought (moderate or worse)', 'Sequía (moderada o peor)', 'Sécheresse (modérée ou pire)', 'Siccità (moderata o peggiore)'], dec: 1 },
      { id: 'receipts', ramp: G, unit: ' M CAD', label: ['Farm cash receipts (M CAD)', 'Ingresos en efectivo de las explotaciones (M CAD)', 'Recettes agricoles en espèces (M CAD)', 'Ricavi agricoli in contanti (M CAD)'], dec: 0 }],
    AU: [
      { id: 'agrifood', ramp: G, unit: ' A$ M', label: ['Agri-food exports (A$ M)', 'Exportaciones agroalimentarias (M A$)', 'Exportations agroalimentaires (M A$)', 'Esportazioni agroalimentari (M A$)'], dec: 0 },
      { id: 'beef', ramp: G, unit: ' A$ M', label: ['Beef exports (A$ M)', 'Exportaciones de carne bovina (M A$)', 'Exportations de viande bovine (M A$)', 'Esportazioni di carne bovina (M A$)'], dec: 0 },
      { id: 'wheat', ramp: G, unit: ' A$ M', label: ['Wheat exports (A$ M)', 'Exportaciones de trigo (M A$)', 'Exportations de blé (M A$)', 'Esportazioni di frumento (M A$)'], dec: 0 },
      { id: 'wine', ramp: G, unit: ' A$ M', label: ['Wine and spirits exports (A$ M)', 'Exportaciones de vino y bebidas (M A$)', 'Exportations de vin et boissons (M A$)', 'Esportazioni di vino e bevande (M A$)'], dec: 0 }]
  };
  var EU = [
    { id: 'output', ramp: G, unit: ' M EUR', label: ['Agricultural industry output (M EUR)', 'Producción de la rama agraria (M EUR)', 'Production de la branche agricole (M EUR)', 'Produzione del ramo agricolo (M EUR)'], dec: 0 },
    { id: 'uaa', ramp: G, unit: ' kha', label: ['Utilised agricultural area (thousand ha)', 'Superficie agraria útil (miles de ha)', 'Surface agricole utilisée (milliers d’ha)', 'Superficie agricola utilizzata (migliaia di ha)'], dec: 0 },
    { id: 'perha', ramp: G, unit: ' EUR/ha', label: ['Output per hectare of farmland (EUR/ha)', 'Producción por hectárea de superficie agraria (EUR/ha)', 'Production par hectare de surface agricole (EUR/ha)', 'Produzione per ettaro di superficie agricola (EUR/ha)'], dec: 0 }];
  ['ES', 'FR', 'IT', 'DE', 'NL', 'AT', 'BE', 'DK'].forEach(function (c) { M[c] = EU; });
  // vista precalculada (scripts/build-views.py -> data/views/region-metrics.json, ~7 KB): el mapa no baja el fichero regional entero; si falta, se calcula aquí
  function compute(cc, id) {
    return get('data/views/region-metrics.json').then(function (V) { var m = V && V.countries && V.countries[cc] && V.countries[cc][id]; return m && m.vals ? { vals: m.vals, period: m.period } : computeFull(cc, id); });
  }
  function computeFull(cc, id) {
    var v = {}, per = '';
    if (cc === 'US' && id === 'drought') return get('data/drought.json').then(function (d) { if (!d || !d.states) return null; Object.keys(d.states).forEach(function (k) { var r = d.states[k]; if (r && r.length) { v[k] = r[r.length - 1][2]; if (String(r[r.length - 1][0]) > per) per = String(r[r.length - 1][0]); } }); return { vals: v, period: per }; });
    if (cc === 'US' && id === 'cattle') return Promise.all([get('data/cattle-on-feed.json'), window.DehesaRegionNames ? 1 : 0]).then(function (a) { var d = a[0], N = window.DehesaRegionNames && window.DehesaRegionNames.US; if (!d || !d.reports || !N) return null; var r = d.reports[d.reports.length - 1], en = {}; Object.keys(N).forEach(function (k) { en[N[k].split('|')[0]] = k; }); (r.states || []).forEach(function (s) { if (en[s.state]) v[en[s.state]] = s.current; }); return { vals: v, period: r.inventoryDate }; });
    if (cc === 'US' && id === 'tax') return get('data/other-tax.json').then(function (d) { var S = d && d.us && d.us.states; if (!S) return null; Object.keys(S).forEach(function (k) { v[k] = S[k].noStateSalesTax ? 0 : S[k].rate; }); return { vals: v, period: d.reviewedAt || '' }; });
    if (cc === 'CA' && id === 'drought') return get('data/canada-drought.json').then(function (d) { if (!d || !d.provinces) return null; Object.keys(d.provinces).forEach(function (k) { var r = d.provinces[k].v[d.periods.length - 1]; if (r) v[k] = r[1]; }); return { vals: v, period: d.asOf }; });
    if (cc === 'CA' && id === 'receipts') return get('data/canada-provinces.json').then(function (d) { if (!d || !d.provinces) return null; Object.keys(d.provinces).forEach(function (k) { if (k === 'CA') return; var o = d.provinces[k].receipts && d.provinces[k].receipts['total-farm-cash-receipts'], p = o && last(o.pts); if (p) { v[k] = p[1]; if (String(p[0]) > per) per = String(p[0]); } }); return { vals: v, period: per }; });
    if (cc === 'AU') return get('data/au-states.json').then(function (d) { if (!d || !d.states) return null; Object.keys(d.states).forEach(function (k) { var p = d.states[k][id] && last(d.states[k][id]); if (p) { v[k] = p[1]; if (String(p[0]) > per) per = String(p[0]); } }); return { vals: v, period: per }; });
    var f = EU_FILE[cc] || cc.toLowerCase();
    return get('data/eu-regions-' + f + '.json').then(function (d) { if (!d || !d.regions) return null;
      Object.keys(d.regions).forEach(function (k) { var b = d.regions[k], o = b.eaa && b.eaa.AM180000, ua = b.crops && b.crops.UAA && b.crops.UAA.area;
        if (id === 'output') { var p = last(o); if (p && p[1] > 0) { v[k] = p[1]; if (String(p[0]) > per) per = String(p[0]); } }
        else if (id === 'uaa') { var q = last(ua); if (q) { v[k] = q[1]; if (String(q[0]) > per) per = String(q[0]); } }
        else if (id === 'perha') { var p2 = last(o), u2 = p2 && at(ua, p2[0]); if (p2 && p2[1] > 0 && u2) { v[k] = p2[1] / u2 * 1000; if (String(p2[0]) > per) per = String(p2[0]); } } });
      return { vals: v, period: per }; });
  }
  function distinct(a) { var o = {}, c = 0; a.forEach(function (x) { if (!o[x]) { o[x] = 1; c++; } }); return c; }
  function breaks(vals, n) { var a = vals.slice().sort(function (x, y) { return x - y; }), b = []; for (var i = 1; i < n; i++) b.push(a[Math.min(a.length - 1, Math.floor(a.length * i / n))]); return b; }
  function fmt(v, m, lg) { try { return v.toLocaleString(lg, { minimumFractionDigits: 0, maximumFractionDigits: m.dec }) + m.unit; } catch (e) { return v + m.unit; } }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var TXT = { es: { none: 'Sin dato', by: 'Colorear por', as: 'dato de', hl: 'Solo resaltar' }, en: { none: 'No data', by: 'Colour by', as: 'data for', hl: 'Highlight only' }, fr: { none: 'Pas de donnée', by: 'Colorier par', as: 'donnée de', hl: 'Surligner seulement' }, it: { none: 'Nessun dato', by: 'Colora per', as: 'dato del', hl: 'Solo evidenzia' } };
  /* pinta los <path> del svg (cada uno dentro de <a href="...r=ID">) y devuelve el HTML de la leyenda */
  function paint(svg, cc, id, lg, selected) {
    var list = M[cc] || [], m = list.filter(function (x) { return x.id === id; })[0], t = TXT[lg] || TXT.es, li = L4[lg] == null ? 1 : L4[lg];
    var paths = svg.querySelectorAll('a path');
    var clear = function () { [].forEach.call(paths, function (p) { var a = p.parentNode, r = (/[?&]r=([^&]+)/.exec(a.getAttribute('href')) || [])[1], on = r === selected; p.setAttribute('fill', on ? '#2f6b4a' : '#cfd8cc'); p.setAttribute('stroke', '#fff'); p.setAttribute('stroke-width', '1'); }); };
    if (!m) { clear(); return Promise.resolve(''); }
    return compute(cc, id).then(function (res) {
      if (!res || !Object.keys(res.vals).length) { clear(); return ''; }
      var vals = Object.keys(res.vals).map(function (k) { return res.vals[k]; }), n = Math.min(5, Math.max(1, distinct(vals))), br = breaks(vals, n), miss = 0;
      var cls = function (x) { var c = 0; for (var i = 0; i < br.length; i++) if (x >= br[i]) c++; return Math.min(c, n - 1); };
      [].forEach.call(paths, function (p) {
        var a = p.parentNode, r = (/[?&]r=([^&]+)/.exec(a.getAttribute('href')) || [])[1], x = res.vals[r], ti = p.querySelector('title'), nm = ti ? ti.getAttribute('data-n') || ti.textContent.split(' — ')[0] : '';
        if (ti) { ti.setAttribute('data-n', nm); ti.textContent = nm + ' — ' + (x == null ? t.none : fmt(x, m, lg)); }
        p.setAttribute('fill', x == null ? NODATA : m.ramp[Math.round(cls(x) * (m.ramp.length - 1) / Math.max(1, n - 1))]);
        var on = r === selected; p.setAttribute('stroke', on ? '#111' : '#fff'); p.setAttribute('stroke-width', on ? '2.5' : '1'); if (on && a.parentNode) a.parentNode.appendChild(a);
        if (x == null) miss++;
      });
      var sw = []; for (var i = 0; i < n; i++) { var lo = i === 0 ? Math.min.apply(null, vals) : br[i - 1], hi = i === n - 1 ? Math.max.apply(null, vals) : br[i];
        sw.push('<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px"><i style="width:14px;height:14px;border-radius:3px;background:' + m.ramp[Math.round(i * (m.ramp.length - 1) / Math.max(1, n - 1))] + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></i>' + esc(fmt(lo, m, lg).replace(m.unit, '')) + ' – ' + esc(fmt(hi, m, lg)) + '</span>'); }
      if (miss) sw.push('<span style="display:inline-flex;align-items:center;gap:4px"><i style="width:14px;height:14px;border-radius:3px;background:' + NODATA + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></i>' + esc(t.none) + '</span>');
      return '<div class="di-movers-hint" style="margin:8px 0 0;font-size:12px">' + esc(m.label[li]) + (res.period ? ' · ' + esc(t.as + ' ' + String(res.period).slice(0, 10)) : '') + '<div style="margin-top:4px">' + sw.join('') + '</div></div>';
    });
  }
  function selectHtml(cc, lg, idAttr, current) {
    var list = M[cc] || [], t = TXT[lg] || TXT.es, li = L4[lg] == null ? 1 : L4[lg]; if (!list.length) return '';
    return '<label style="font-size:13px;display:block;margin:0 0 8px">' + esc(t.by) + ' <select id="' + idAttr + '" class="di-compare-select"><option value="">' + esc(t.hl) + '</option>' + list.map(function (m) { return '<option value="' + m.id + '"' + (m.id === current ? ' selected' : '') + '>' + esc(m.label[li]) + '</option>'; }).join('') + '</select></label>';
  }
  window.DehesaRegionMetrics = { list: function (cc) { return M[cc] || []; }, paint: paint, selectHtml: selectHtml, compute: compute };
})();
