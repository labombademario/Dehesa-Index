/* Dehesa Index — Cattle on Feed (USDA NASS): ganado vacuno en cebaderos de EE. UU. ES5.
   Lee data/cattle-on-feed.json (cifras tal como las publica NASS, en miles de cabezas). La variación frente al año anterior se calcula
   con las dos cifras publicadas del propio informe (actual y año anterior) y se indica como tal; nada más se calcula ni se rellena. */
(function () {
  'use strict';
  var D = null;
  var T = {
    es: { h: 'Ganado en cebaderos (Cattle on Feed)', sub: 'Cebaderos de EE. UU. con capacidad de 1.000 o más cabezas. Informe mensual de USDA NASS; cifras en miles de cabezas.', rel: 'Publicado el', inv: 'Existencias a 1 de {m}', pl: 'Entradas en {m}', mk: 'Salidas a matadero en {m}', od: 'Otras bajas en {m}',
      yoy: 'frente al año anterior', hist: 'Existencias el día 1 de cada mes', histAlt: 'Existencias de ganado en cebaderos, de {a} ({x}) a {b} ({y}), en miles de cabezas', states: 'Por estado', st: 'Estado', stInv: 'Existencias', stYoy: 'Año anterior', total: 'Total EE. UU.', other: 'Otros estados', unit: 'miles de cabezas',
      note: 'Variación calculada con las dos cifras publicadas en el informe (actual y año anterior). Entradas, salidas y bajas corresponden al mes anterior a la fecha de existencias.', src: 'Fuente: USDA NASS, Cattle on Feed (datos públicos del Gobierno de EE. UU.)', open: 'Ver el informe original', next: 'Próxima publicación' },
    en: { h: 'Cattle on feed (Cattle on Feed)', sub: 'U.S. feedlots with capacity of 1,000 or more head. Monthly USDA NASS report; figures in thousand head.', rel: 'Released', inv: 'On feed {m} 1', pl: 'Placements in {m}', mk: 'Marketings in {m}', od: 'Other disappearance in {m}',
      yoy: 'vs. a year earlier', hist: 'On-feed inventory on the 1st of each month', histAlt: 'Cattle on feed inventory, from {a} ({x}) to {b} ({y}), in thousand head', states: 'By state', st: 'State', stInv: 'On feed', stYoy: 'Year earlier', total: 'U.S. total', other: 'Other states', unit: 'thousand head',
      note: 'Change calculated from the two figures published in the report (current and year earlier). Placements, marketings and other disappearance refer to the month before the inventory date.', src: 'Source: USDA NASS, Cattle on Feed (U.S. Government public data)', open: 'Open the original report', next: 'Next release' },
    fr: { h: 'Bovins en engraissement (Cattle on Feed)', sub: 'Parcs d’engraissement américains de 1 000 têtes ou plus. Rapport mensuel de l’USDA NASS ; chiffres en milliers de têtes.', rel: 'Publié le', inv: 'Effectifs au 1er {m}', pl: 'Entrées en {m}', mk: 'Sorties vers l’abattoir en {m}', od: 'Autres pertes en {m}',
      yoy: 'par rapport à l’an dernier', hist: 'Effectifs au 1er de chaque mois', histAlt: 'Bovins en engraissement, de {a} ({x}) à {b} ({y}), en milliers de têtes', states: 'Par État', st: 'État', stInv: 'Effectifs', stYoy: 'An dernier', total: 'Total États-Unis', other: 'Autres États', unit: 'milliers de têtes',
      note: 'Variation calculée avec les deux chiffres publiés dans le rapport (actuel et an dernier). Entrées, sorties et pertes concernent le mois précédant la date des effectifs.', src: 'Source : USDA NASS, Cattle on Feed (données publiques du gouvernement américain)', open: 'Voir le rapport d’origine', next: 'Prochaine publication' },
    it: { h: 'Bovini in ingrasso (Cattle on Feed)', sub: 'Allevamenti statunitensi con capacità di 1.000 capi o più. Rapporto mensile USDA NASS; cifre in migliaia di capi.', rel: 'Pubblicato il', inv: 'Consistenza al 1° {m}', pl: 'Ingressi a {m}', mk: 'Uscite al macello a {m}', od: 'Altre perdite a {m}',
      yoy: 'rispetto a un anno prima', hist: 'Consistenza il 1° di ogni mese', histAlt: 'Bovini in ingrasso, da {a} ({x}) a {b} ({y}), in migliaia di capi', states: 'Per Stato', st: 'Stato', stInv: 'Consistenza', stYoy: 'Anno prima', total: 'Totale USA', other: 'Altri Stati', unit: 'migliaia di capi',
      note: 'Variazione calcolata con le due cifre pubblicate nel rapporto (attuale e anno prima). Ingressi, uscite e perdite si riferiscono al mese precedente la data di consistenza.', src: 'Fonte: USDA NASS, Cattle on Feed (dati pubblici del governo USA)', open: 'Apri il rapporto originale', next: 'Prossima pubblicazione' }
  };
  var SN = { 'Arizona': 'Arizona', 'California': 'California', 'Colorado': 'Colorado', 'Idaho': 'Idaho', 'Iowa': 'Iowa', 'Kansas': 'Kansas', 'Nebraska': 'Nebraska', 'Oklahoma': 'Oklahoma', 'South Dakota': 'South Dakota', 'Texas': 'Texas', 'Washington': 'Washington' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v) { try { return v.toLocaleString(lang()); } catch (e) { return String(v); } }
  function pc(a, b) { if (!b) return ''; var v = (a / b - 1) * 100, s = (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toFixed(1); return (lang() === 'en' ? s : s.replace('.', ',')) + ' %'; }
  function col(a, b) { return a > b ? 'var(--up, #2c6e49)' : a < b ? 'var(--down, #a33)' : 'inherit'; }
  function mon(iso, withYear) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1))).toLocaleDateString(lang(), withYear ? { month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function day(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function fm(t, m) { return t.replace('{m}', m); }
  function niceTicks(a, b) { var raw = (b - a) / 3, e = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / e, st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e, out = [], v = Math.ceil(a / st - 1e-9) * st; for (; v <= b + 1e-9; v += st) out.push(Math.round(v / st) * st); return out; }
  function chart(reps, t) {
    var pts = reps.slice(-24).map(function (r) { return { d: r.inventoryDate, v: r.national.current.onFeedEnd }; });
    if (pts.length < 3) return '';
    var W = 640, H = 170, L = 52, R = 10, Tp = 12, B = 24, mn = Infinity, mx = -Infinity;
    pts.forEach(function (p) { if (p.v < mn) mn = p.v; if (p.v > mx) mx = p.v; });
    var pad = (mx - mn) * 0.12 || 1; mn -= pad; mx += pad;
    function X(i) { return L + i * (W - L - R) / (pts.length - 1); }
    function Y(v) { return Tp + (mx - v) * (H - Tp - B) / (mx - mn); }
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' ');
    var ticks = niceTicks(mn, mx).map(function (v) { return '<g><line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--border)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + esc(nf(Math.round(v))) + '</text></g>'; }).join('');
    var first = pts[0], last = pts[pts.length - 1];
    var xl = '<text x="' + L + '" y="' + (H - 6) + '" font-size="11" fill="var(--text-faint)">' + esc(mon(first.d, true)) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + esc(mon(last.d, true)) + '</text>';
    var alt = t.histAlt.replace('{a}', mon(first.d, true)).replace('{x}', nf(first.v)).replace('{b}', mon(last.d, true)).replace('{y}', nf(last.v));
    return '<h3 class="cof-h3">' + esc(t.hist) + '</h3><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '" style="width:100%;height:auto;max-width:720px">' + ticks + '<path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/><circle cx="' + X(pts.length - 1).toFixed(1) + '" cy="' + Y(last.v).toFixed(1) + '" r="3.5" fill="var(--accent)"/>' + xl + '</svg>';
  }
  function render() {
    var root = document.getElementById('cof'); if (!root || !D || !D.reports || !D.reports.length) return;
    var t = T[lang()] || T.es, r = D.reports[D.reports.length - 1], c = r.national.current, y = r.national.yearAgo;
    var mInv = mon(r.inventoryDate), mFlow = mon(r.flowMonth + '-01');
    var cards = [['inv', c.onFeedEnd, y.onFeedEnd, fm(t.inv, mInv)], ['pl', c.placed, y.placed, fm(t.pl, mFlow)], ['mk', c.marketed, y.marketed, fm(t.mk, mFlow)], ['od', c.otherDisappearance, y.otherDisappearance, fm(t.od, mFlow)]];
    var h = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + ' ' + esc(t.rel) + ' ' + esc(day(r.release)) + '.</p><div class="cof-cards">' +
      cards.map(function (k) { var ch = pc(k[1], k[2]); return '<div class="di-card cof-card"><div class="cof-lbl">' + esc(k[3]) + '</div><div class="cof-val">' + esc(nf(k[1])) + '</div><div class="cof-chg" style="color:' + col(k[1], k[2]) + '">' + esc(ch) + ' <span>' + esc(t.yoy) + '</span></div></div>'; }).join('') + '</div>' + (window.DICite ? window.DICite.html('usda_nass', { period: r.inventoryDate.slice(0, 7), pub: r.release }) : '');
    h += chart(D.reports, t);
    var rows = r.states.filter(function (s) { return s.state !== 'United States'; }).sort(function (a, b) { if (a.state === 'Other States') return 1; if (b.state === 'Other States') return -1; return b.current - a.current; });
    var tot = r.states.filter(function (s) { return s.state === 'United States'; })[0], mx = rows.reduce(function (m, s) { return Math.max(m, s.current); }, 1);
    h += '<h3 class="cof-h3">' + esc(t.states) + ' · ' + esc(mon(r.inventoryDate, true)) + '</h3><div class="di-card" style="padding:6px 14px;overflow-x:auto"><table class="cof-tbl"><caption class="cof-cap">' + esc(t.unit) + '</caption><thead><tr><th scope="col">' + esc(t.st) + '</th><th scope="col" class="cof-n">' + esc(t.stInv) + '</th><th scope="col" class="cof-b"><span class="cof-vh">' + esc(t.stInv) + '</span></th><th scope="col" class="cof-n">' + esc(t.stYoy) + '</th></tr></thead><tbody>' +
      rows.map(function (s) { var nm = s.state === 'Other States' ? t.other : (SN[s.state] || s.state); return '<tr><th scope="row">' + esc(nm) + '</th><td class="cof-n">' + esc(nf(s.current)) + '</td><td class="cof-b"><span class="cof-bar" style="width:' + Math.max(1, Math.round(s.current / mx * 100)) + '%"></span></td><td class="cof-n" style="color:' + col(s.current, s.yearAgo) + '">' + esc(pc(s.current, s.yearAgo)) + '</td></tr>'; }).join('') +
      (tot ? '<tr class="cof-tot"><th scope="row">' + esc(t.total) + '</th><td class="cof-n">' + esc(nf(tot.current)) + '</td><td class="cof-b"></td><td class="cof-n" style="color:' + col(tot.current, tot.yearAgo) + '">' + esc(pc(tot.current, tot.yearAgo)) + '</td></tr>' : '') + '</tbody></table></div>';
    var nx = '';
    if (window.DIUsdaCal && window.DIUsdaCal.next && CAL) { var n = window.DIUsdaCal.next(CAL, 'cattle-on-feed'); if (n) nx = ' · ' + t.next + ': ' + day(n.date); }
    h += '<p class="cof-note">' + esc(t.note) + '</p><p class="cof-note">' + esc(t.src) + nx + ' · <a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.open) + '</a></p>';
    root.innerHTML = h;
  }
  var CAL = null;
  function boot() {
    var root = document.getElementById('cof'); if (!root) return;
    Promise.all([fetch('data/cattle-on-feed.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DIUsdaCal ? window.DIUsdaCal.load() : Promise.resolve(null), window.DICite ? window.DICite.load() : Promise.resolve(null)]).then(function (a) { D = a[0]; CAL = a[1]; render(); });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
