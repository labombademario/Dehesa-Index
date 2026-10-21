/* Dehesa Index — Renta agraria y cuentas de la agricultura de España (MAPA, Cuentas Económicas de la Agricultura). ES5.
   data/spain-income/cea.json (scripts/update-es-cea.py). Millones de euros corrientes a precios básicos, tal como los publica el MAPA; el cambio entre años lo calcula Dehesa Index.
   Se muestra bajo la pestaña «España» de costes.html (sigue la visibilidad de #cs-es). */
(function (global) {
  'use strict';
  var S = global.DehesaShared, D = null, ROW = 'G', RY = null, drawn = false;
  var T = {
    es: { h: 'Renta agraria de España', sub: 'Cuánto produce, gasta y gana el campo español, según las cuentas económicas de la agricultura del Ministerio. Millones de euros corrientes.', item: 'Concepto', last: 'Último año', chg: 'Cambio sobre el año anterior', calc: 'cálculo de Dehesa Index', reg: 'Por comunidad autónoma', yr: 'Año', mu: 'M€', prov: 'Los años más recientes son avance o estimación del ministerio y se revisan después.', alt: '{n}, millones de euros', note: 'Valores corrientes a precios básicos (sin quitar la inflación). Metodología SEC-95 hasta 2013 y SEC-2010 desde 2014. Las cuentas regionales llegan a un año menos que las nacionales.', src: 'Fuente:', open: 'Ver la fuente original', share: 'Peso en España' },
    en: { h: 'Farm income in Spain', sub: 'How much Spanish agriculture produces, spends and earns, per the Ministry’s economic accounts for agriculture. Million euros, current prices.', item: 'Item', last: 'Latest year', chg: 'Change on previous year', calc: 'Dehesa Index calculation', reg: 'By autonomous community', yr: 'Year', mu: '€m', prov: 'The most recent years are the ministry’s advance or estimate and get revised later.', alt: '{n}, million euros', note: 'Current values at basic prices (not adjusted for inflation). ESA-95 methodology to 2013, ESA-2010 from 2014. Regional accounts run one year behind the national ones.', src: 'Source:', open: 'See the original source', share: 'Share of Spain' },
    fr: { h: 'Revenu agricole de l’Espagne', sub: 'Ce que l’agriculture espagnole produit, dépense et gagne, selon les comptes économiques de l’agriculture du ministère. Millions d’euros courants.', item: 'Poste', last: 'Dernière année', chg: 'Variation sur l’année précédente', calc: 'calcul de Dehesa Index', reg: 'Par communauté autonome', yr: 'Année', mu: 'M€', prov: 'Les années les plus récentes sont une avance ou une estimation du ministère et seront révisées.', alt: '{n}, millions d’euros', note: 'Valeurs courantes aux prix de base (sans correction de l’inflation). Méthodologie SEC-95 jusqu’en 2013, SEC-2010 depuis 2014. Les comptes régionaux ont un an de retard sur les nationaux.', src: 'Source :', open: 'Voir la source d’origine', share: 'Part de l’Espagne' },
    it: { h: 'Reddito agricolo della Spagna', sub: 'Quanto produce, spende e guadagna l’agricoltura spagnola, secondo i conti economici dell’agricoltura del Ministero. Milioni di euro correnti.', item: 'Voce', last: 'Ultimo anno', chg: 'Variazione sull’anno precedente', calc: 'calcolo di Dehesa Index', reg: 'Per comunità autonoma', yr: 'Anno', mu: 'M€', prov: 'Gli anni più recenti sono un anticipo o una stima del ministero e vengono poi riveduti.', alt: '{n}, milioni di euro', note: 'Valori correnti a prezzi base (non corretti per l’inflazione). Metodologia SEC-95 fino al 2013, SEC-2010 dal 2014. I conti regionali hanno un anno di ritardo sui nazionali.', src: 'Fonte:', open: 'Vedi la fonte originale', share: 'Quota della Spagna' }
  };
  var LB = { es: {}, en: { 'PRODUCCION VEGETAL': 'Crop output', 'PRODUCCION ANIMAL': 'Animal output', 'Cereales': 'Cereals', 'Hortalizas': 'Vegetables', 'Patata': 'Potatoes', 'Frutas': 'Fruit', 'Vino y mosto': 'Wine and must', 'Aceite de oliva': 'Olive oil', 'Bovino': 'Cattle', 'Porcino': 'Pigs', 'Aves': 'Poultry', 'Leche': 'Milk', 'Huevos': 'Eggs', 'Piensos': 'Feed', 'RENTA AGRARIA': 'FARM INCOME', 'PRODUCCION RAMA AGRARIA': 'AGRICULTURAL OUTPUT', 'CONSUMOS INTERMEDIOS': 'INTERMEDIATE CONSUMPTION', 'VALOR AÑADIDO BRUTO': 'GROSS VALUE ADDED' }, fr: {}, it: {} };
  function lang() { return S && S.getLang ? S.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function lbl(l) { l = l.replace(/\*+$/, '').trim(); var m = l.replace(/^\d+\s+/, ''), e = (LB[lang()] || {}); for (var k in e) if (m.toUpperCase().indexOf(k.toUpperCase()) >= 0 && m.length <= k.length + 14) return e[k] + (/^\d+\s/.test(l) ? '' : ''); return m.replace(/\s*\(\d+\)\s*$/, ''); }
  function pct(a, b) { if (a == null || !b) return null; return (b / a - 1) * 100; }
  function pcs(p) { return p == null ? '—' : (p > 0.05 ? '+' : p < -0.05 ? '−' : '') + nf(Math.abs(p), 1) + ' %'; }
  function pcc(p) { return p == null ? 'inherit' : p > 0.05 ? 'var(--up, #2c6e49)' : p < -0.05 ? 'var(--down, #a33)' : 'inherit'; }
  var th = 'padding:8px 6px;font-size:11px;font-weight:700;color:var(--text-faint);', td = 'padding:7px 6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';
  function rowOf(items, k) { var i; for (i = 0; i < items.length; i++) if (items[i].label.charAt(0) === k && (k !== 'G' || /RENTA/i.test(items[i].label)) && items[i].level === 0) return items[i]; for (i = 0; i < items.length; i++) if (items[i].label === k) return items[i]; return null; }
  function render(el) {
    var t = T[lang()] || T.es, N = D.national, Y = D.years, row = null, i;
    for (i = 0; i < N.length; i++) if (N[i].label === ROW) row = N[i]; if (!row) { row = rowOf(N, 'G') || N[0]; ROW = row.label; }
    var sel = '<label class="di-movers-hint" style="display:block;margin:8px 0 4px">' + esc(t.item) + '<select data-chips id="esr-sel" style="display:block;margin-top:4px;font:inherit;max-width:100%">' + N.map(function (x) { return '<option value="' + esc(x.label) + '"' + (x.label === ROW ? ' selected' : '') + '>' + (x.level ? '  ' : '') + esc(lbl(x.label)) + '</option>'; }).join('') + '</select></label>';
    var li = row.v.length - 1; while (li >= 0 && row.v[li] == null) li--;
    var p = li > 0 ? pct(row.v[li - 1], row.v[li]) : null;
    var cards = '<div class="cof-cards"><div class="di-card cof-card"><div class="cof-n">' + esc(t.last) + ' · ' + esc(Y[li]) + '</div><div class="cof-v">' + esc(nf(row.v[li], 0)) + ' <small>' + esc(t.mu) + '</small></div></div><div class="di-card cof-card"><div class="cof-n">' + esc(t.chg) + '</div><div class="cof-v" style="color:' + pcc(p) + '">' + esc(pcs(p)) + '</div><div class="di-movers-hint">' + esc(t.calc) + '</div></div></div>';
    var lab = {}; Y.forEach(function (y, k) { lab[k] = String(y); });
    var ch = global.DehesaChart && global.DehesaChart.render ? global.DehesaChart.render({ series: [{ name: lbl(row.label), color: '#1d5178', pts: row.v.map(function (v, k) { return { x: k, y: v, l: String(Y[k]) }; }).filter(function (q) { return q.y != null; }) }], xLabels: lab, yTitle: t.mu, aria: f(t.alt, { n: lbl(row.label) }), zero: true, noLegend: true, vFmt: function (v) { return nf(v, 0); } }) : '';
    var ry = Object.keys(D.regional).sort(); if (!RY || ry.indexOf(RY) < 0) RY = ry[ry.length - 1];
    var out = '';
    if (RY) {
      var R = D.regional[RY], ri = -1; R.items.forEach(function (x, k) { if (x.label.charAt(0) === row.label.charAt(0) && x.label.replace(/[\s*]+/g, '').slice(0, 12) === row.label.replace(/[\s*]+/g, '').slice(0, 12)) ri = k; });
      if (ri >= 0) {
        var it = R.items[ri], n = R.regions.length - 1, tot = it.v[n], rows = R.regions.slice(0, n).map(function (nm, k) { return [nm, it.v[k]]; }).filter(function (r) { return r[1] != null; }).sort(function (a, b) { return b[1] - a[1]; });
        var ysel = '<label class="di-movers-hint" style="display:inline-block;margin:0 0 8px">' + esc(t.yr) + '<select id="esr-y" style="display:block;margin-top:4px;font:inherit">' + ry.map(function (y) { return '<option' + (y === RY ? ' selected' : '') + '>' + esc(y) + '</option>'; }).join('') + '</select></label>';
        out = '<h3 class="cof-h3">' + esc(t.reg) + ' · ' + esc(lbl(row.label)) + '</h3>' + ysel + '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:300px;font-size:13.5px"><thead><tr><th scope="col" style="' + th + 'text-align:left"></th><th scope="col" style="' + th + 'text-align:right">' + esc(t.mu) + '</th><th scope="col" style="' + th + 'text-align:right">' + esc(t.share) + '</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td style="' + td + 'text-align:left">' + esc(r[0].replace(/\s*\(\d+\)\s*$/, '')) + '</td><td style="' + td + '">' + esc(nf(r[1], 0)) + '</td><td style="' + td + '">' + esc(tot ? nf(r[1] / tot * 100, 1) + ' %' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
    }
    var cite = global.DICite && global.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + global.DICite.html('mapa_es', {}) + '</div>' : '';
    el.innerHTML = '<section class="cof"><h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p>' + sel + cards + ch + '<p class="cof-note">' + esc(t.prov) + '</p>' + out + '<p class="cof-note">' + esc(t.note) + ' ' + esc(t.src) + ' <a href="' + esc(D.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.open) + '</a></p>' + cite + '</section>';
    var a = el.querySelector('#esr-sel'); if (a) a.onchange = function () { ROW = a.value; render(el); };
    var b = el.querySelector('#esr-y'); if (b) b.onchange = function () { RY = b.value; render(el); };
  }
  function boot() {
    var tab = document.getElementById('cs-es'), el = document.getElementById('cs-es-cea'); if (!tab || !el) return;
    function sync() { el.hidden = tab.hidden; if (!tab.hidden && !drawn) { drawn = true; Promise.all([fetch('data/spain-income/cea.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), global.DICite ? global.DICite.load().catch(function () { return null; }) : null]).then(function (a) { if (!a[0] || !a[0].national) { el.hidden = true; return; } D = a[0]; render(el); }); } }
    sync(); if (global.MutationObserver) new MutationObserver(sync).observe(tab, { attributes: true, attributeFilter: ['hidden'] });
    if (S) { var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); if (drawn && D) render(el); }; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
