/* Dehesa Index — Precios semanales de España (MAPA). ES5.
   data/spain-prices/pmn.json  (Precios Medios Nacionales, desde 2019)  y  data/spain-prices/obs.json (Observatorio de precios: origen y mayorista MERCASA, desde 2004).
   scripts/update-es-pmn.py. Cada precio es el que publica el ministerio; Dehesa Index solo calcula los cambios entre dos fechas y la diferencia destino-origen (rotuladas como cálculo propio). */
(function (global) {
  'use strict';
  var S = global.DehesaShared, LI = { es: 0, en: 1, fr: 2, it: 3 };
  var PM = null, OB = null, TAB = 'pmn', SEL = {}, RNG = { pmn: 156, obs: 156 };
  var T = {
    es: { h: 'Precios semanales en España', sub: 'Precios medios nacionales y precios en origen y en destino que publica el Ministerio de Agricultura, semana a semana.', pmn: 'Precios medios nacionales', obs: 'Origen y destino', prod: 'Producto', rng: 'Periodo', r1: '1 año', r3: '3 años', rall: 'Todo', last: 'Última semana', wk: 'semana del {d}', c4: 'Cambio en 4 semanas', c52: 'Cambio en 1 año', calc: 'cálculo de Dehesa Index', tab: 'Últimas semanas', date: 'Semana', pos: 'Posición comercial', legend: 'Texto del ministerio sobre la posición comercial de cada precio',
      org: 'En origen (productor)', dst: 'Mayorista en destino (Mercas)', gap: 'Destino − origen', ratio: 'Veces el origen', gapNote: 'Última semana con los dos precios. Es un cálculo de Dehesa Index con precios de dos fuentes del ministerio; no es el margen de nadie.', nodata: 'Sin datos en este periodo', onlyOrg: 'Sin precio mayorista para este producto.',
      note: 'Un hueco significa que el ministerio no publicó precio esa semana. Precios sin IVA, en la posición comercial indicada. Los nombres de producto y sus especificaciones cambian a veces entre años; se unen por nombre.', src: 'Fuente:', open: 'Ver la fuente original', alt: '{n}, precio semanal', all: 'Todos' },
    en: { h: 'Weekly prices in Spain', sub: 'National average prices and farm-gate and wholesale prices published weekly by the Ministry of Agriculture.', pmn: 'National average prices', obs: 'Farm vs wholesale', prod: 'Product', rng: 'Period', r1: '1 year', r3: '3 years', rall: 'All', last: 'Latest week', wk: 'week of {d}', c4: '4-week change', c52: '1-year change', calc: 'Dehesa Index calculation', tab: 'Latest weeks', date: 'Week', pos: 'Trade position', legend: 'Ministry text on the trade position of each price',
      org: 'Farm-gate (producer)', dst: 'Wholesale at destination (Mercas)', gap: 'Wholesale − farm-gate', ratio: 'Times farm-gate', gapNote: 'Latest week with both prices. A Dehesa Index calculation from two ministry sources; it is nobody’s margin.', nodata: 'No data in this period', onlyOrg: 'No wholesale price for this product.',
      note: 'A gap means the ministry published no price that week. Prices exclude VAT, at the trade position shown. Product names and specifications sometimes change between years; they are joined by name.', src: 'Source:', open: 'See the original source', alt: '{n}, weekly price', all: 'All' },
    fr: { h: 'Prix hebdomadaires en Espagne', sub: 'Prix moyens nationaux et prix à la production et en gros que publie chaque semaine le ministère de l’Agriculture.', pmn: 'Prix moyens nationaux', obs: 'Production et gros', prod: 'Produit', rng: 'Période', r1: '1 an', r3: '3 ans', rall: 'Tout', last: 'Dernière semaine', wk: 'semaine du {d}', c4: 'Variation sur 4 semaines', c52: 'Variation sur 1 an', calc: 'calcul de Dehesa Index', tab: 'Dernières semaines', date: 'Semaine', pos: 'Stade commercial', legend: 'Texte du ministère sur le stade commercial de chaque prix',
      org: 'À la production (producteur)', dst: 'Gros à destination (Mercas)', gap: 'Gros − production', ratio: 'Fois la production', gapNote: 'Dernière semaine avec les deux prix. Calcul de Dehesa Index à partir de deux sources du ministère ; ce n’est la marge de personne.', nodata: 'Pas de données sur cette période', onlyOrg: 'Pas de prix de gros pour ce produit.',
      note: 'Un trou signifie que le ministère n’a publié aucun prix cette semaine. Prix hors TVA, au stade commercial indiqué. Les noms et spécifications des produits changent parfois d’une année à l’autre ; ils sont réunis par nom.', src: 'Source :', open: 'Voir la source d’origine', alt: '{n}, prix hebdomadaire', all: 'Tout' },
    it: { h: 'Prezzi settimanali in Spagna', sub: 'Prezzi medi nazionali e prezzi all’origine e all’ingrosso pubblicati ogni settimana dal Ministero dell’Agricoltura.', pmn: 'Prezzi medi nazionali', obs: 'Origine e ingrosso', prod: 'Prodotto', rng: 'Periodo', r1: '1 anno', r3: '3 anni', rall: 'Tutto', last: 'Ultima settimana', wk: 'settimana del {d}', c4: 'Variazione a 4 settimane', c52: 'Variazione a 1 anno', calc: 'calcolo di Dehesa Index', tab: 'Ultime settimane', date: 'Settimana', pos: 'Posizione commerciale', legend: 'Testo del ministero sulla posizione commerciale di ogni prezzo',
      org: 'All’origine (produttore)', dst: 'Ingrosso a destinazione (Mercas)', gap: 'Ingrosso − origine', ratio: 'Volte l’origine', gapNote: 'Ultima settimana con entrambi i prezzi. Calcolo di Dehesa Index su due fonti del ministero; non è il margine di nessuno.', nodata: 'Nessun dato in questo periodo', onlyOrg: 'Nessun prezzo all’ingrosso per questo prodotto.',
      note: 'Un vuoto significa che il ministero non ha pubblicato il prezzo in quella settimana. Prezzi senza IVA, nella posizione commerciale indicata. I nomi dei prodotti cambiano a volte tra gli anni; vengono uniti per nome.', src: 'Fonte:', open: 'Vedi la fonte originale', alt: '{n}, prezzo settimanale', all: 'Tutto' }
  };
  var SC = { 'CEREALES': ['Cereales', 'Cereals', 'Céréales', 'Cereali'], 'ARROZ': ['Arroz', 'Rice', 'Riz', 'Riso'], 'ACEITES VEGETALES Y ACEITUNA DE MESA': ['Aceites y aceituna de mesa', 'Oils and table olives', 'Huiles et olives de table', 'Oli e olive da tavola'], 'VINO': ['Vino', 'Wine', 'Vin', 'Vino'], 'SEMILLAS OLEAGINOSAS, PROTEICOS Y TORTAS': ['Oleaginosas, proteicos y tortas', 'Oilseeds, protein crops and meals', 'Oléagineux, protéagineux et tourteaux', 'Oleaginose, proteiche e panelli'],
    'SEMILLAS OLEAGINOSAS Y PROTEICOS': ['Oleaginosas y proteicos', 'Oilseeds and protein crops', 'Oléagineux et protéagineux', 'Oleaginose e proteiche'], 'FRUTAS': ['Frutas', 'Fruit', 'Fruits', 'Frutta'], 'HORTALIZAS': ['Hortalizas', 'Vegetables', 'Légumes', 'Ortaggi'], 'BOVINO': ['Vacuno', 'Beef cattle', 'Bovins', 'Bovini'], 'OVINO': ['Ovino', 'Sheep', 'Ovins', 'Ovini'], 'PORCINO': ['Porcino', 'Pigs', 'Porcins', 'Suini'],
    'AVES, HUEVOS, CAZA': ['Aves, huevos y caza', 'Poultry, eggs and game', 'Volailles, œufs et gibier', 'Pollame, uova e selvaggina'], 'LÁCTEOS': ['Lácteos', 'Dairy', 'Produits laitiers', 'Latticini'], 'MIEL': ['Miel y polen', 'Honey and pollen', 'Miel et pollen', 'Miele e polline'], 'undefined': ['Otros', 'Other', 'Autres', 'Altri'] };
  function lang() { return S && S.getLang ? S.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dd(v) { var a = Math.abs(v); return a >= 1000 ? 0 : a >= 100 ? 1 : 2; }
  function fv(v) { return v == null ? '—' : nf(v, dd(v)); }
  function ts(w) { return Date.parse(w + 'T00:00:00Z'); }
  function dstr(w) { try { return new Date(ts(w)).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return w; } }
  function pct(a, b) { if (a == null || !b) return null; return (b / a - 1) * 100; }
  function pcs(p) { return p == null ? '—' : (p > 0.05 ? '+' : p < -0.05 ? '−' : '') + nf(Math.abs(p), 1) + ' %'; }
  function pcc(p) { return p == null ? 'inherit' : p > 0.05 ? 'var(--up, #2c6e49)' : p < -0.05 ? 'var(--down, #a33)' : 'inherit'; }
  function lastIdx(v) { var i = v.length - 1; while (i >= 0 && v[i] == null) i--; return i; }
  function chip(on, cls, data, label) { return '<button type="button" class="' + cls + '" ' + data + ' aria-pressed="' + on + '" style="font:inherit;cursor:pointer;padding:6px 11px;margin:0 6px 6px 0;border:1px solid var(--border);border-radius:16px;background:' + (on ? 'var(--accent)' : 'transparent') + ';color:' + (on ? '#fff' : 'inherit') + '">' + esc(label) + '</button>'; }
  function rangeChips(t) { var cur = RNG[TAB]; return '<div role="group" aria-label="' + esc(t.rng) + '">' + [[52, t.r1], [156, t.r3], [0, t.rall]].map(function (x) { return chip(cur === x[0], 'esp-r', 'data-r="' + x[0] + '"', x[1]); }).join('') + '</div>'; }
  function window_(W, v) { var n = RNG[TAB]; var a = n ? Math.max(0, W.length - n) : 0, i; var out = []; for (i = a; i < W.length; i++) out.push(i); return out; }
  function pts(W, v, idx) { return idx.map(function (i) { return { x: ts(W[i]), y: v[i] }; }).filter(function (p) { return p.y != null; }); }
  function lineChart(series, unit, aria) {
    if (!global.DehesaChart || !global.DehesaChart.render) return '';
    return global.DehesaChart.render({ series: series, xMode: 'time', yTitle: unit, aria: aria, zero: false, noLegend: series.length < 2, vFmt: function (v) { return fv(v); } });
  }
  var th = 'padding:8px 6px;font-size:11px;font-weight:700;color:var(--text-faint);', td = 'padding:7px 6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';
  function posText(leg, pos) { if (!leg || !pos) return pos || ''; var parts = leg.replace(/^[^(]*(?=\()/, '').split(/;\s*(?=\(\d+\))/), i; for (i = 0; i < parts.length; i++) if (parts[i].indexOf(pos) === 0) return parts[i].replace(/\.\s*$/, ''); return pos; }
  function pmnHtml(t, P) {
    var D = PM, W = D.weeks, bySec = {}, order = [], cur = SEL.pmn, s = null, i;
    D.series.forEach(function (x) { var k = x.sector || 'undefined'; if (!bySec[k]) { bySec[k] = []; order.push(k); } bySec[k].push(x); });
    D.series.forEach(function (x) { if (x.id === cur) s = x; });
    if (!s) { s = D.series.filter(function (x) { return x.id === 'trigo-blando'; })[0] || D.series[0]; SEL.pmn = s.id; }
    var opts = order.map(function (k) { return '<optgroup label="' + esc(SC[k] ? SC[k][P] : k) + '">' + bySec[k].map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === s.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</optgroup>'; }).join('');
    var li = lastIdx(s.v), idx = window_(W, s.v), unit = s.unit || '';
    var p4 = li >= 4 ? pct(s.v[li - 4], s.v[li]) : null, p52 = li >= 52 ? pct(s.v[li - 52], s.v[li]) : null;
    var card = '<div class="cof-cards"><div class="di-card cof-card"><div class="cof-n">' + esc(t.last) + '</div><div class="cof-v">' + esc(fv(s.v[li])) + ' <small>' + esc(unit) + '</small></div><div class="di-movers-hint">' + esc(f(t.wk, { d: dstr(W[li]) })) + '</div></div>' +
      '<div class="di-card cof-card"><div class="cof-n">' + esc(t.c4) + '</div><div class="cof-v" style="color:' + pcc(p4) + '">' + esc(pcs(p4)) + '</div><div class="di-movers-hint">' + esc(t.calc) + '</div></div>' +
      '<div class="di-card cof-card"><div class="cof-n">' + esc(t.c52) + '</div><div class="cof-v" style="color:' + pcc(p52) + '">' + esc(pcs(p52)) + '</div><div class="di-movers-hint">' + esc(t.calc) + '</div></div></div>';
    var cp = pts(W, s.v, idx), ch = cp.length ? lineChart([{ name: s.name, color: '#1d5178', pts: cp }], unit, f(t.alt, { n: s.name })) : '<p class="cof-sub">' + esc(t.nodata) + '</p>';
    var rows = []; for (i = li; i >= 0 && rows.length < 10; i--) rows.push('<tr><td style="' + td + 'text-align:left">' + esc(dstr(W[i])) + '</td><td style="' + td + '">' + esc(fv(s.v[i])) + '</td></tr>');
    var tab = '<details class="usm-more"><summary>' + esc(t.tab) + '</summary><div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:260px;font-size:13.5px"><thead><tr><th scope="col" style="' + th + 'text-align:left">' + esc(t.date) + '</th><th scope="col" style="' + th + 'text-align:right">' + esc(s.name + ' (' + unit + ')') + '</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div></details>';
    var leg = D.legend ? '<details class="usm-more"><summary>' + esc(t.legend) + '</summary><p class="cof-note">' + esc(D.legend) + '</p></details>' : '';
    return '<label class="di-movers-hint" style="display:block;margin:10px 0 4px">' + esc(t.prod) + '<select id="esp-sel" style="display:block;margin-top:4px;font:inherit;max-width:100%">' + opts + '</select></label>' + (s.pos ? '<p class="di-movers-hint">' + esc(t.pos) + ': ' + esc(posText(D.legend, s.pos)) + '</p>' : '') + card + rangeChips(t) + ch + tab + leg;
  }
  function obsHtml(t, P) {
    var D = OB, W = D.weeks, org = {}, dst = {}, ids = [], cur = SEL.obs, i;
    D.series.forEach(function (x) { var k = x.id.slice(x.id.indexOf('-') + 1); if (x.stage === 'origen') org[k] = x; else dst[k] = x; });
    Object.keys(org).forEach(function (k) { ids.push(k); }); Object.keys(dst).forEach(function (k) { if (!org[k]) ids.push(k); });
    ids.sort(function (a, b) { return (org[a] || dst[a]).name.localeCompare((org[b] || dst[b]).name, lang()); });
    if (!cur || ids.indexOf(cur) < 0) { cur = ids.indexOf('tomate-redondo-liso') >= 0 ? 'tomate-redondo-liso' : ids[0]; SEL.obs = cur; }
    var o = org[cur], d = dst[cur], base = o || d, idx = window_(W, base.v), unit = '€/' + (base.unit || 'kg');
    var opts = ids.map(function (k) { var x = org[k] || dst[k]; return '<option value="' + esc(k) + '"' + (k === cur ? ' selected' : '') + '>' + esc(x.name) + (org[k] && dst[k] ? '' : ' *') + '</option>'; }).join('');
    var series = []; if (o) series.push({ name: t.org, color: '#4c7a4a', pts: pts(W, o.v, idx) }); if (d) series.push({ name: t.dst, color: '#b58a5b', pts: pts(W, d.v, idx) });
    series = series.filter(function (s) { return s.pts.length; });
    var gap = '';
    if (o && d) { for (i = W.length - 1; i >= 0 && !(o.v[i] != null && d.v[i] != null); i--); if (i >= 0) gap = '<div class="cof-cards"><div class="di-card cof-card"><div class="cof-n">' + esc(t.gap) + '</div><div class="cof-v">' + esc(nf(d.v[i] - o.v[i], 2)) + ' <small>' + esc(unit) + '</small></div><div class="di-movers-hint">' + esc(f(t.wk, { d: dstr(W[i]) })) + ' · ' + esc(t.calc) + '</div></div><div class="di-card cof-card"><div class="cof-n">' + esc(t.ratio) + '</div><div class="cof-v">' + esc(nf(d.v[i] / o.v[i], 1)) + ' ×</div><div class="di-movers-hint">' + esc(o.name) + '</div></div></div><p class="cof-note">' + esc(t.gapNote) + '</p>'; }
    else gap = '<p class="cof-note">' + esc(t.onlyOrg) + '</p>';
    return '<label class="di-movers-hint" style="display:block;margin:10px 0 4px">' + esc(t.prod) + '<select id="esp-sel" style="display:block;margin-top:4px;font:inherit;max-width:100%">' + opts + '</select></label>' + gap + rangeChips(t) + (series.length ? lineChart(series, unit, f(t.alt, { n: base.name })) : '<p class="cof-sub">' + esc(t.nodata) + '</p>');
  }
  function render(el) {
    var t = T[lang()] || T.es, P = LI[lang()] || 0, hasP = !!PM, hasO = !!OB; if (!hasP && !hasO) { el.hidden = true; return; }
    if (TAB === 'pmn' && !hasP) TAB = 'obs'; if (TAB === 'obs' && !hasO) TAB = 'pmn';
    var tabs = '<div role="group">' + (hasP ? chip(TAB === 'pmn', 'esp-t', 'data-t="pmn"', t.pmn) : '') + (hasO ? chip(TAB === 'obs', 'esp-t', 'data-t="obs"', t.obs) : '') + '</div>';
    var src = (TAB === 'pmn' ? PM : OB).source;
    var cite = global.DICite && global.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + global.DICite.html('mapa_es', {}) + '</div>' : '';
    el.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p>' + tabs + (TAB === 'pmn' ? pmnHtml(t, P) : obsHtml(t, P)) + '<p class="cof-note">' + esc(t.note) + ' ' + esc(t.src) + ' <a href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.open) + '</a></p>' + cite;
    Array.prototype.forEach.call(el.querySelectorAll('.esp-t'), function (b) { b.onclick = function () { TAB = b.getAttribute('data-t'); render(el); }; });
    Array.prototype.forEach.call(el.querySelectorAll('.esp-r'), function (b) { b.onclick = function () { RNG[TAB] = parseInt(b.getAttribute('data-r'), 10); render(el); }; });
    var se = document.getElementById('esp-sel'); if (se) se.onchange = function () { SEL[TAB] = se.value; render(el); };
  }
  function j(u) { return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function boot() {
    var el = document.getElementById('esp'); if (!el) return;
    Promise.all([j('data/spain-prices/pmn.json'), j('data/spain-prices/obs.json'), global.DICite ? global.DICite.load().catch(function () { return null; }) : null]).then(function (a) {
      PM = a[0] && a[0].series && a[0].series.length > 50 ? a[0] : null; OB = a[1] && a[1].series && a[1].series.length > 20 ? a[1] : null; render(el);
    });
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); render(el); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
