/* Dehesa Index — Cordero de EE. UU. (USDA AMS, despiece estimado nacional de la canal, LM_XL502). ES5.
   Lee data/us-lamb.json: valor diario de la canal (bruto, neto, cuarto delantero y trasero), en USD por 100 lb (cwt),
   media móvil de 5 días de precios FOB en planta. Los cambios se calculan con las cifras publicadas y se indican como tales. */
(function () {
  'use strict';
  var D = null, SEL = 1;
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var N = { 1: ['Valor bruto de la canal', 'Gross carcass value', 'Valeur brute de la carcasse', 'Valore lordo della carcassa'], 2: ['Valor neto de la canal', 'Net carcass value', 'Valeur nette de la carcasse', 'Valore netto della carcassa'], 3: ['Cuarto delantero', 'Foresaddle', 'Avant (foresaddle)', 'Quarto anteriore'], 4: ['Cuarto trasero', 'Hindsaddle', 'Arrière (hindsaddle)', 'Quarto posteriore'] };
  var T = {
    es: { h: 'Precios del cordero en EE. UU.', sub: 'Valor estimado de la canal de cordero y de sus cuartos, según el informe diario LM_XL502 de USDA AMS. Dólares por 100 libras (1 cwt = 45,36 kg), media móvil de 5 días de precios FOB en planta.', d: 'Día', prev: 'frente al día anterior', m: 'frente a 4 semanas antes', y: 'frente al año anterior', hist: 'Evolución, últimos 3 años', alt: '{n}, de {a} ({x}) a {b} ({y}), dólares por 100 libras', corr: 'Corrección publicada por AMS.', note: 'No es el precio de una subasta: es un valor estimado a partir de los precios que declaran las plantas.', src: 'Fuente: USDA AMS, National Estimated Lamb Carcass Cutout (datos públicos)', open: 'Ver informe' },
    en: { h: 'U.S. lamb prices', sub: 'Estimated value of the lamb carcass and its primals from the daily USDA AMS LM_XL502 report. Dollars per 100 pounds, 5-day rolling average of FOB plant prices.', d: 'Day', prev: 'vs. previous day', m: 'vs. 4 weeks earlier', y: 'vs. a year earlier', hist: 'Trend, last 3 years', alt: '{n}, from {a} ({x}) to {b} ({y}), dollars per 100 pounds', corr: 'Correction issued by AMS.', note: 'This is not an auction price: it is an estimated value built from prices reported by packing plants.', src: 'Source: USDA AMS, National Estimated Lamb Carcass Cutout (public data)', open: 'View report' },
    fr: { h: 'Prix de l’agneau aux États-Unis', sub: 'Valeur estimée de la carcasse d’agneau et de ses quartiers, d’après le rapport quotidien LM_XL502 de l’USDA AMS. Dollars par 100 livres, moyenne mobile sur 5 jours des prix FOB départ usine.', d: 'Jour', prev: 'par rapport à la veille', m: 'par rapport à 4 semaines avant', y: 'par rapport à l’an dernier', hist: 'Évolution, 3 dernières années', alt: '{n}, de {a} ({x}) à {b} ({y}), dollars par 100 livres', corr: 'Correction publiée par l’AMS.', note: 'Ce n’est pas un prix d’enchères : c’est une valeur estimée à partir des prix déclarés par les abattoirs.', src: 'Source : USDA AMS, National Estimated Lamb Carcass Cutout (données publiques)', open: 'Voir le rapport' },
    it: { h: 'Prezzi dell’agnello negli USA', sub: 'Valore stimato della carcassa di agnello e dei suoi quarti, dal rapporto giornaliero LM_XL502 dell’USDA AMS. Dollari per 100 libbre, media mobile a 5 giorni dei prezzi FOB impianto.', d: 'Giorno', prev: 'rispetto al giorno precedente', m: 'rispetto a 4 settimane prima', y: 'rispetto all’anno scorso', hist: 'Andamento, ultimi 3 anni', alt: '{n}, da {a} ({x}) a {b} ({y}), dollari per 100 libbre', corr: 'Correzione pubblicata dall’AMS.', note: 'Non è il prezzo di un’asta: è un valore stimato dai prezzi dichiarati dagli impianti di macellazione.', src: 'Fonte: USDA AMS, National Estimated Lamb Carcass Cutout (dati pubblici)', open: 'Vedi il rapporto' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function day(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function pc(a, b) { if (!b) return '—'; var v = (a / b - 1) * 100; return (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + nf(Math.abs(v), 1) + ' %'; }
  function col(a, b) { return !b ? 'inherit' : a > b ? 'var(--up, #2c6e49)' : a < b ? 'var(--down, #a33)' : 'inherit'; }
  function back(rows, i, c, days) { var t = Date.parse(rows[i][0]) - days * 86400000, best = null; for (var k = i - 1; k >= 0; k--) { var ms = Date.parse(rows[k][0]), g = Math.abs(ms - t); if (g <= 4 * 86400000 && (best === null || g < best[0])) best = [g, rows[k][c]]; if (ms < t - 6 * 86400000) break; } return best ? best[1] : null; }
  function niceTicks(a, b) { var raw = (b - a) / 3, e = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / e, st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e, out = [], v = Math.ceil(a / st - 1e-9) * st; for (; v <= b + 1e-9; v += st) out.push(Math.round(v / st) * st); return out; }
  function chart(rows, c, t) {
    var s = rows; if (s.length < 4) return '';
    var W = 640, H = 170, L = 46, R = 10, Tp = 12, B = 24, mn = Infinity, mx = -Infinity;
    s.forEach(function (x) { if (x[c] < mn) mn = x[c]; if (x[c] > mx) mx = x[c]; });
    var pad = (mx - mn) * 0.12 || 1; mn -= pad; mx += pad;
    function X(i) { return L + i * (W - L - R) / (s.length - 1); } function Y(v) { return Tp + (mx - v) * (H - Tp - B) / (mx - mn); }
    var path = s.map(function (x, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x[c]).toFixed(1); }).join(' ');
    var ticks = niceTicks(mn, mx).map(function (v) { return '<g><line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + nf(v, 0) + '</text></g>'; }).join('');
    var a = s[0], b = s[s.length - 1], nm = N[c][LI[lang()] || 0];
    var alt = t.alt.replace('{n}', nm).replace('{a}', day(a[0])).replace('{x}', nf(a[c], 0)).replace('{b}', day(b[0])).replace('{y}', nf(b[c], 0));
    return '<h3 class="cof-h3">' + esc(nm) + ' · ' + esc(t.hist) + '</h3><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '" style="width:100%;height:auto;max-width:720px">' + ticks + '<path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="2"/><text x="' + L + '" y="' + (H - 6) + '" font-size="11" fill="var(--text-faint)">' + esc(a[0]) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + esc(b[0]) + '</text></svg>';
  }
  function render() {
    var root = document.getElementById('nl'); if (!root || !D || !D.rows || D.rows.length < 20) return;
    var t = T[lang()] || T.es, P = LI[lang()] || 0, rows = D.rows, i = rows.length - 1, l = rows[i];
    var cards = [1, 2, 3, 4].map(function (c) {
      var pv = rows[i - 1][c], m4 = back(rows, i, c, 28), y1 = back(rows, i, c, 364);
      var line = function (lab, b) { return '<div class="cof-chg" style="color:' + col(l[c], b) + '">' + esc(pc(l[c], b)) + ' <span>' + esc(lab) + '</span></div>'; };
      return '<button type="button" class="di-card cof-card nl-card" data-c="' + c + '" aria-pressed="' + (c === SEL) + '" style="text-align:left;cursor:pointer;font:inherit;color:inherit' + (c === SEL ? ';outline:2px solid var(--accent)' : '') + '"><div class="cof-lbl">' + esc(N[c][P]) + '</div><div class="cof-val">' + esc(nf(l[c], 2)) + ' <span style="font-size:13px;font-weight:400">USD/cwt</span></div>' + line(t.prev, pv) + line(t.m, m4) + line(t.y, y1) + '<div class="cof-lbl" style="margin-top:4px">' + esc(t.d) + ' ' + esc(day(l[0])) + '</div></button>';
    }).join('');
    root.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p><div class="cof-cards">' + cards + '</div>' + chart(rows, SEL, t) + '<p class="cof-note">' + (l[5] ? esc(t.corr) + ' ' : '') + esc(t.note) + ' ' + esc(t.src) + ' · <a href="https://mymarketnews.ams.usda.gov/viewReport/2649" target="_blank" rel="noopener noreferrer">' + esc(t.open) + '</a></p>' + (window.DICite ? window.DICite.html('usda_ams_mars', {}) : '');
    Array.prototype.forEach.call(root.querySelectorAll('.nl-card'), function (b) { b.onclick = function () { SEL = +b.getAttribute('data-c'); render(); }; });
  }
  function boot() {
    if (!document.getElementById('nl')) return;
    Promise.all([fetch('data/us-lamb.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) { D = a[0]; render(); });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
