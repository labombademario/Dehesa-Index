/* Dehesa Index — Lácteos de EE. UU. (USDA AMS, National Dairy Products Sales Report). ES5.
   Lee data/us-dairy.json: precio semanal (USD/lb) de mantequilla, cheddar de bloque, suero y leche desnatada en polvo, tal como los publica AMS.
   Los cambios (semana anterior, 4 semanas, año) se calculan con las cifras publicadas y se indican como tales. */
(function () {
  'use strict';
  var D = null, SEL = 'mantequilla';
  var N = { mantequilla: ['Mantequilla', 'Butter', 'Beurre', 'Burro'], cheddar: ['Queso cheddar (bloque de 40 lb)', 'Cheddar cheese (40-lb block)', 'Cheddar (bloc de 40 lb)', 'Cheddar (blocco da 40 lb)'], suero: ['Suero en polvo', 'Dry whey', 'Lactosérum en poudre', 'Siero di latte in polvere'], leche_polvo: ['Leche desnatada en polvo', 'Nonfat dry milk', 'Lait écrémé en poudre', 'Latte scremato in polvere'] };
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var T = {
    es: { h: 'Precios de lácteos en EE. UU.', sub: 'Precio semanal medio de las ventas de mantequilla, queso cheddar, suero y leche en polvo, según el informe obligatorio NDPSR de USDA AMS. Dólares por libra (1 lb = 0,4536 kg).', wk: 'Semana al', prev: 'frente a la semana anterior', m: 'frente a 4 semanas antes', y: 'frente al año anterior', prov: 'Provisional: AMS puede revisar las cuatro semanas más recientes.', hist: 'Evolución, últimos 2 años', alt: '{n}, de {a} ({x}) a {b} ({y}), dólares por libra', sales: 'Ventas de la semana', lb: 'lb', src: 'Fuente: USDA AMS, National Dairy Products Sales Report (datos públicos)', open: 'Ver informe' },
    en: { h: 'U.S. dairy prices', sub: 'Weekly average sales price of butter, cheddar cheese, dry whey and nonfat dry milk from the mandatory USDA AMS NDPSR report. Dollars per pound.', wk: 'Week ending', prev: 'vs. previous week', m: 'vs. 4 weeks earlier', y: 'vs. a year earlier', prov: 'Provisional: AMS may revise the four most recent weeks.', hist: 'Trend, last 2 years', alt: '{n}, from {a} ({x}) to {b} ({y}), dollars per pound', sales: 'Weekly sales', lb: 'lb', src: 'Source: USDA AMS, National Dairy Products Sales Report (public data)', open: 'View report' },
    fr: { h: 'Prix des produits laitiers aux États-Unis', sub: 'Prix moyen hebdomadaire des ventes de beurre, cheddar, lactosérum et lait écrémé en poudre, d’après le rapport obligatoire NDPSR de l’USDA AMS. Dollars par livre.', wk: 'Semaine au', prev: 'par rapport à la semaine précédente', m: 'par rapport à 4 semaines avant', y: 'par rapport à l’an dernier', prov: 'Provisoire : l’AMS peut réviser les quatre dernières semaines.', hist: 'Évolution, 2 dernières années', alt: '{n}, de {a} ({x}) à {b} ({y}), dollars par livre', sales: 'Ventes de la semaine', lb: 'lb', src: 'Source : USDA AMS, National Dairy Products Sales Report (données publiques)', open: 'Voir le rapport' },
    it: { h: 'Prezzi dei latticini negli USA', sub: 'Prezzo medio settimanale delle vendite di burro, cheddar, siero e latte scremato in polvere, dal rapporto obbligatorio NDPSR dell’USDA AMS. Dollari per libbra.', wk: 'Settimana al', prev: 'rispetto alla settimana precedente', m: 'rispetto a 4 settimane prima', y: 'rispetto all’anno scorso', prov: 'Provvisorio: l’AMS può rivedere le quattro settimane più recenti.', hist: 'Andamento, ultimi 2 anni', alt: '{n}, da {a} ({x}) a {b} ({y}), dollari per libbra', sales: 'Vendite della settimana', lb: 'lb', src: 'Fonte: USDA AMS, National Dairy Products Sales Report (dati pubblici)', open: 'Vedi il rapporto' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function day(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function pc(a, b) { if (!b) return '—'; var v = (a / b - 1) * 100; return (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + nf(Math.abs(v), 1) + ' %'; }
  function col(a, b) { return !b ? 'inherit' : a > b ? 'var(--up, #2c6e49)' : a < b ? 'var(--down, #a33)' : 'inherit'; }
  function back(s, i, days) { var t = Date.parse(s[i][0]) - days * 86400000, best = null; for (var k = i - 1; k >= 0; k--) { var g = Math.abs(Date.parse(s[k][0]) - t); if (g <= 3.5 * 86400000 && (best === null || g < best[0])) best = [g, s[k][1]]; if (Date.parse(s[k][0]) < t - 5 * 86400000) break; } return best ? best[1] : null; }
  function chart(p, t) {
    var s = p.series.slice(-104); if (s.length < 4) return '';
    var W = 640, H = 170, L = 46, R = 10, Tp = 12, B = 24, mn = Infinity, mx = -Infinity;
    s.forEach(function (x) { if (x[1] < mn) mn = x[1]; if (x[1] > mx) mx = x[1]; });
    var pad = (mx - mn) * 0.12 || 0.05; mn -= pad; mx += pad;
    function X(i) { return L + i * (W - L - R) / (s.length - 1); } function Y(v) { return Tp + (mx - v) * (H - Tp - B) / (mx - mn); }
    var path = s.map(function (x, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x[1]).toFixed(1); }).join(' ');
    var ticks = [mn + pad, (mn + mx) / 2, mx - pad].map(function (v) { return '<g><line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + nf(v, 2) + '</text></g>'; }).join('');
    var a = s[0], b = s[s.length - 1], nm = N[p.id][LI[lang()] || 0];
    var alt = t.alt.replace('{n}', nm).replace('{a}', day(a[0])).replace('{x}', nf(a[1], 2)).replace('{b}', day(b[0])).replace('{y}', nf(b[1], 2));
    return '<h3 class="cof-h3">' + esc(nm) + ' · ' + esc(t.hist) + '</h3><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '" style="width:100%;height:auto;max-width:720px">' + ticks + '<path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="2"/><text x="' + L + '" y="' + (H - 6) + '" font-size="11" fill="var(--text-faint)">' + esc(a[0]) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + esc(b[0]) + '</text></svg>';
  }
  function render() {
    var root = document.getElementById('nd'); if (!root || !D || !D.products || !D.products.length) return;
    var t = T[lang()] || T.es, P = LI[lang()] || 0, any = false, cur = null;
    var cards = D.products.map(function (p) {
      var s = p.series, i = s.length - 1, l = s[i], pv = i ? s[i - 1][1] : null, m4 = back(s, i, 28), y1 = back(s, i, 364); if (l[3]) any = true; if (p.id === SEL) cur = p;
      var line = function (lab, b) { return '<div class="cof-chg" style="color:' + col(l[1], b) + '">' + esc(pc(l[1], b)) + ' <span>' + esc(lab) + '</span></div>'; };
      return '<button type="button" class="di-card cof-card nd-card" data-id="' + p.id + '" aria-pressed="' + (p.id === SEL) + '" style="text-align:left;cursor:pointer;font:inherit;color:inherit' + (p.id === SEL ? ';outline:2px solid var(--accent)' : '') + '"><div class="cof-lbl">' + esc(N[p.id][P]) + '</div><div class="cof-val">' + esc(nf(l[1], 3)) + ' <span style="font-size:13px;font-weight:400">USD/lb</span></div>' + line(t.prev, pv) + line(t.m, m4) + line(t.y, y1) + '<div class="cof-lbl" style="margin-top:4px">' + esc(t.wk) + ' ' + esc(day(l[0])) + (l[3] ? ' *' : '') + '</div></button>';
    }).join('');
    root.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p><div class="cof-cards">' + cards + '</div>' + (cur ? chart(cur, t) : '') + '<p class="cof-note">' + (any ? '* ' + esc(t.prov) + ' ' : '') + esc(t.src) + ' · <a href="https://mymarketnews.ams.usda.gov/viewReport/2993" target="_blank" rel="noopener noreferrer">' + esc(t.open) + '</a></p>' + (window.DICite ? window.DICite.html('usda_ams_mars', {}) : '');
    Array.prototype.forEach.call(root.querySelectorAll('.nd-card'), function (b) { b.onclick = function () { SEL = b.getAttribute('data-id'); render(); }; });
  }
  function boot() {
    if (!document.getElementById('nd')) return;
    Promise.all([fetch('data/us-dairy.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) { D = a[0]; render(); });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
