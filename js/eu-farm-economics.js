/* Dehesa Index — Costes y renta agraria de la UE (Eurostat, cuentas económicas de la agricultura). ES5.
   Lee data/eu-farm-economics.json (millones de euros a precios corrientes, tal como los publica Eurostat). Los ratios (% de la producción, renta por UTA) los calcula esta página. */
(function () {
  'use strict';
  var D = null, SEL = 'EU27_2020', LI = { es: 0, en: 1, fr: 2, it: 3 };
  var T = {
    es: { h: 'Costes y renta agraria en la UE', sub: 'Cuentas económicas de la agricultura de Eurostat: lo que produce el sector, lo que gasta en piensos, fertilizantes y energía, y la renta que queda. Millones de euros a precios corrientes.', out: 'Producción agraria', ic: 'Consumos intermedios', gva: 'Valor añadido bruto', fac: 'Renta de los factores', ent: 'Renta empresarial', yoy: 'frente al año anterior', ctry: 'País', sh: 'Peso sobre la producción', feed: 'Piensos', fert: 'Fertilizantes', energy: 'Energía', ppp: 'Fitosanitarios', vet: 'Veterinario', pua: 'Renta de los factores por UTA (miles de €)', indA: 'Indicador A (2020 = 100)', hist: 'Peso de cada coste sobre la producción, por año', histAlt: '{n}: piensos {a} % y fertilizantes {b} % de la producción en {y}', pick: 'Pulsa un país para verlo arriba.', bn: 'mil millones €', mm: 'mill. €',
      note: 'Cifras publicadas por Eurostat (aact_eaa01, aact_eaa06, aact_ali01). Los porcentajes y la renta por unidad de trabajo anual (UTA) los calcula Dehesa Index a partir de esas cifras; Eurostat no es responsable de esos cálculos. El último año puede ser provisional o una estimación avanzada.', src: 'Fuente: Eurostat, Economic accounts for agriculture' },
    en: { h: 'EU farm costs and income', sub: 'Eurostat economic accounts for agriculture: what the sector produces, what it spends on feed, fertiliser and energy, and the income that is left. Million euro at current prices.', out: 'Agricultural output', ic: 'Intermediate consumption', gva: 'Gross value added', fac: 'Factor income', ent: 'Entrepreneurial income', yoy: 'vs. previous year', ctry: 'Country', sh: 'Share of output', feed: 'Feed', fert: 'Fertilisers', energy: 'Energy', ppp: 'Plant protection', vet: 'Veterinary', pua: 'Factor income per annual work unit (EUR thousand)', indA: 'Indicator A (2020 = 100)', hist: 'Cost share of output, by year', histAlt: '{n}: feed {a}% and fertilisers {b}% of output in {y}', pick: 'Select a country to see it above.', bn: 'EUR bn', mm: 'EUR m',
      note: 'Figures published by Eurostat (aact_eaa01, aact_eaa06, aact_ali01). Percentages and income per annual work unit (AWU) are calculated by Dehesa Index from those figures; Eurostat is not responsible for these calculations. The latest year may be provisional or an advance estimate.', src: 'Source: Eurostat, Economic accounts for agriculture' },
    fr: { h: 'Coûts et revenu agricoles dans l’UE', sub: 'Comptes économiques de l’agriculture d’Eurostat : ce que produit le secteur, ce qu’il dépense en aliments, engrais et énergie, et le revenu qui reste. Millions d’euros aux prix courants.', out: 'Production agricole', ic: 'Consommation intermédiaire', gva: 'Valeur ajoutée brute', fac: 'Revenu des facteurs', ent: 'Revenu entrepreneurial', yoy: 'par rapport à l’année précédente', ctry: 'Pays', sh: 'Part de la production', feed: 'Aliments du bétail', fert: 'Engrais', energy: 'Énergie', ppp: 'Phytosanitaires', vet: 'Vétérinaire', pua: 'Revenu des facteurs par UTA (milliers d’€)', indA: 'Indicateur A (2020 = 100)', hist: 'Part de chaque coût dans la production, par année', histAlt: '{n} : aliments {a} % et engrais {b} % de la production en {y}', pick: 'Sélectionnez un pays pour l’afficher en haut.', bn: 'Md €', mm: 'M €',
      note: 'Chiffres publiés par Eurostat (aact_eaa01, aact_eaa06, aact_ali01). Les pourcentages et le revenu par unité de travail annuel (UTA) sont calculés par Dehesa Index à partir de ces chiffres ; Eurostat n’est pas responsable de ces calculs. La dernière année peut être provisoire ou une estimation avancée.', src: 'Source : Eurostat, Economic accounts for agriculture' },
    it: { h: 'Costi e reddito agricolo nell’UE', sub: 'Conti economici dell’agricoltura di Eurostat: quanto produce il settore, quanto spende in mangimi, fertilizzanti ed energia, e il reddito che resta. Milioni di euro a prezzi correnti.', out: 'Produzione agricola', ic: 'Consumi intermedi', gva: 'Valore aggiunto lordo', fac: 'Reddito dei fattori', ent: 'Reddito imprenditoriale', yoy: 'rispetto all’anno precedente', ctry: 'Paese', sh: 'Peso sulla produzione', feed: 'Mangimi', fert: 'Fertilizzanti', energy: 'Energia', ppp: 'Fitosanitari', vet: 'Veterinario', pua: 'Reddito dei fattori per ULA (migliaia di €)', indA: 'Indicatore A (2020 = 100)', hist: 'Peso di ogni costo sulla produzione, per anno', histAlt: '{n}: mangimi {a}% e fertilizzanti {b}% della produzione nel {y}', pick: 'Seleziona un paese per vederlo in alto.', bn: 'mld €', mm: 'mln €',
      note: 'Cifre pubblicate da Eurostat (aact_eaa01, aact_eaa06, aact_ali01). Le percentuali e il reddito per unità di lavoro annuo (ULA) sono calcolati da Dehesa Index a partire da quelle cifre; Eurostat non è responsabile di questi calcoli. L’ultimo anno può essere provvisorio o una stima anticipata.', src: 'Fonte: Eurostat, Economic accounts for agriculture' }
  };
  var COL = { feed: '#b8863a', fert: '#2c6e49', energy: '#1d5178', ppp: '#8a5a9a', vet: '#c0504d' };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  var DN = {};
  function cname(c) { var L = lang(); if (c === 'EU27_2020') return (T[L] || T.es).eu || ({ es: 'Unión Europea (27)', en: 'European Union (27)', fr: 'Union européenne (27)', it: 'Unione europea (27)' })[L]; var iso = c === 'EL' ? 'GR' : c === 'UK' ? 'GB' : c; try { DN[L] = DN[L] || new Intl.DisplayNames([L], { type: 'region' }); var n = DN[L].of(iso); return n && n !== iso ? n : c; } catch (e) { return c; } }
  function pc(a, b) { return a == null || !b ? null : (a / b - 1) * 100; }
  function ch(p) { if (p === null) return '—'; var c = p > 0.05 ? 'var(--up, #2c6e49)' : p < -0.05 ? 'var(--down, #a33)' : 'inherit'; return '<span style="color:' + c + '">' + (p > 0.05 ? '+' : p < -0.05 ? '−' : '') + nf(Math.abs(p), 1) + ' %</span>'; }
  function lastIdx(d) { for (var i = D.years.length - 1; i >= 0; i--) if (d.output[i] != null && d.ic[i] != null) return i; return -1; }
  function share(d, k, i) { return d[k][i] != null && d.output[i] ? 100 * d[k][i] / d.output[i] : null; }
  function mm(v, t) { return v >= 10000 ? nf(v / 1000, 1) + ' ' + t.bn : nf(v, 0) + ' ' + t.mm; }
  function mmH(v, t) { var big = v >= 10000, n = nf(big ? v / 1000 : v, big ? 1 : 0), u = big ? t.bn : t.mm; return esc(n) + ' <span class="cof-u">' + esc(u) + '</span>'; }
  function chart(code, t) {
    var d = D.geos[code], ys = D.years, W = 640, H = 200, L = 40, R = 10, Tp = 12, B = 24, ks = ['feed', 'fert', 'energy', 'ppp', 'vet'], mx = 0, n = ys.length;
    ks.forEach(function (k) { for (var i = 0; i < n; i++) { var s = share(d, k, i); if (s != null && s > mx) mx = s; } }); mx = Math.max(4, Math.ceil(mx / 4) * 4);
    function X(i) { return L + i * (W - L - R) / (n - 1); } function Y(v) { return Tp + (mx - v) * (H - Tp - B) / mx; }
    var g = [0, 1, 2, 3, 4].map(function (j) { var v = mx * j / 4; return '<g><line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + nf(v, 0) + '</text></g>'; }).join('');
    var lines = ks.map(function (k) { var p = '', go = false; for (var i = 0; i < n; i++) { var s = share(d, k, i); if (s == null) { go = false; continue; } p += (go ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(s).toFixed(1) + ' '; go = true; } return '<path d="' + p + '" fill="none" stroke="' + COL[k] + '" stroke-width="2"/>'; }).join('');
    var li = lastIdx(d), alt = t.histAlt.replace('{n}', cname(code)).replace('{a}', nf(share(d, 'feed', li) || 0, 1)).replace('{b}', nf(share(d, 'fert', li) || 0, 1)).replace('{y}', ys[li]);
    var lg = ks.map(function (k) { return '<span style="margin-right:12px;white-space:nowrap"><span style="color:' + COL[k] + '">■</span> ' + esc(t[k]) + '</span>'; }).join(' ');
    return '<h3 class="cof-h3">' + esc(cname(code)) + ' · ' + esc(t.hist) + ' (%)</h3><div class="eucs-ch" data-g="' + [W, H, L, R, Tp, B, mx, n].join(',') + '" style="position:relative;max-width:720px"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '" style="width:100%;height:auto;display:block;touch-action:pan-y">' + g + lines + '<text x="' + L + '" y="' + (H - 6) + '" font-size="11" fill="var(--text-faint)">' + ys[0] + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + ys[n - 1] + '</text><line class="eucs-x" y1="' + Tp + '" y2="' + (H - B) + '" stroke="var(--text-muted)" stroke-width="1" visibility="hidden"/><circle class="eucs-dot" r="5" fill="#fff" stroke-width="2.5" visibility="hidden"/></svg><div class="eucs-tip" role="status" hidden style="position:absolute;pointer-events:none;z-index:2;padding:6px 10px;border-radius:8px;font-size:12.5px;line-height:1.35;white-space:nowrap;background:var(--surface,#fff);color:var(--text);border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,.15)"></div></div><p class="cof-note">' + lg + '</p>';
  }
  /* Al pasar el ratón (o tocar) sobre el gráfico: línea más cercana, año y valor */
  function bindChart(root) {
    var box = root.querySelector('.eucs-ch'); if (!box) return;
    var G = box.getAttribute('data-g').split(',').map(Number), W = G[0], H = G[1], L = G[2], R = G[3], Tp = G[4], B = G[5], mx = G[6], n = G[7];
    var svg = box.querySelector('svg'), tip = box.querySelector('.eucs-tip'), vx = svg.querySelector('.eucs-x'), dot = svg.querySelector('.eucs-dot'), d = D.geos[SEL], ks = ['feed', 'fert', 'energy', 'ppp', 'vet'], t = T[lang()] || T.es;
    function hide() { tip.hidden = true; vx.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); }
    function move(e) {
      var r = svg.getBoundingClientRect(), k = W / r.width, px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
      var i = Math.round((px - L) * (n - 1) / (W - L - R)); if (i < 0) i = 0; if (i > n - 1) i = n - 1;
      var best = null, bd = 1e9; ks.forEach(function (key) { var v = share(d, key, i); if (v == null) return; var y = Tp + (mx - v) * (H - Tp - B) / mx, dd = Math.abs(y - py); if (dd < bd) { bd = dd; best = { k: key, v: v, y: y }; } });
      if (!best) { hide(); return; }
      var x = L + i * (W - L - R) / (n - 1);
      vx.setAttribute('x1', x); vx.setAttribute('x2', x); vx.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', x); dot.setAttribute('cy', best.y); dot.setAttribute('stroke', COL[best.k]); dot.setAttribute('visibility', 'visible');
      tip.innerHTML = '<b style="color:' + COL[best.k] + '">■</b> <b>' + esc(t[best.k]) + '</b><br>' + D.years[i] + ' · ' + nf(best.v, 1) + ' %';
      tip.hidden = false; var bw = box.getBoundingClientRect().width, tx = x / k + 12; if (tx + tip.offsetWidth > bw) tx = x / k - tip.offsetWidth - 12; tip.style.left = Math.max(0, tx) + 'px'; tip.style.top = Math.max(0, best.y / k - 44) + 'px';
    }
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', hide);
  }
  function render() {
    var root = document.getElementById('eucs'); if (!root || !D || !D.geos) return;
    var t = T[lang()] || T.es, d = D.geos[SEL], i = lastIdx(d), y = D.years[i], p = i > 0 ? i - 1 : null;
    function card(lab, k) { var v = d[k][i]; return '<div class="di-card cof-card"><div class="cof-lbl">' + esc(lab) + ' · ' + y + '</div><div class="cof-val">' + (v == null ? '—' : mmH(v, t)) + '</div><div class="cof-chg">' + ch(p === null ? null : pc(v, d[k][p])) + ' <span>' + esc(t.yoy) + '</span></div></div>'; }
    var pua = d.factor[i] != null && d.awu[i] ? d.factor[i] / d.awu[i] : null;
    var cards = '<div class="cof-cards">' + card(t.out, 'output') + card(t.ic, 'ic') + card(t.gva, 'gva') + card(t.fac, 'factor') + card(t.ent, 'entrep') + '<div class="di-card cof-card"><div class="cof-lbl">' + esc(t.pua) + ' · ' + y + '</div><div class="cof-val">' + (pua == null ? '—' : esc(nf(pua, 1))) + '</div><div class="cof-chg">' + (d.indA[i] != null ? esc(t.indA) + ': <strong>' + esc(nf(d.indA[i], 1)) + '</strong>' : '') + '</div></div></div>';
    var codes = Object.keys(D.geos).filter(function (c) { return c !== 'EU27_2020' && lastIdx(D.geos[c]) >= D.years.length - 3; }); codes.sort(function (a, b) { return D.geos[b].output[lastIdx(D.geos[b])] - D.geos[a].output[lastIdx(D.geos[a])]; }); codes.unshift('EU27_2020');
    var th = function (x, r) { return '<th scope="col"' + (r ? ' class="cof-n"' : '') + '>' + esc(x) + '</th>'; };
    var rows = codes.map(function (c) { var g = D.geos[c], k = lastIdx(g); function s(key) { var v = share(g, key, k); return '<td class="cof-n">' + (v == null ? '—' : esc(nf(v, 1))) + '</td>'; } var pu = g.factor[k] != null && g.awu[k] ? g.factor[k] / g.awu[k] : null;
      return '<tr' + (c === SEL ? ' style="background:rgba(29,81,120,.06)"' : '') + '><th scope="row"><button type="button" class="eucs-b" data-c="' + c + '" style="all:unset;cursor:pointer;font-weight:' + (c === 'EU27_2020' ? 700 : 600) + '">' + esc(cname(c)) + '</button> <span class="cof-lbl">' + D.years[k] + '</span></th><td class="cof-n">' + esc(mm(g.output[k], t)) + '</td>' + s('ic') + s('feed') + s('fert') + s('energy') + '<td class="cof-n">' + (pu == null ? '—' : esc(nf(pu, 1))) + '</td></tr>'; }).join('');
    var tbl = '<h3 class="cof-h3">' + esc(t.sh) + ' (%)</h3><div class="di-card" style="padding:6px 14px;overflow-x:auto"><table class="cof-tbl" style="min-width:640px"><thead><tr>' + th(t.ctry) + th(t.out, 1) + th(t.ic, 1) + th(t.feed, 1) + th(t.fert, 1) + th(t.energy, 1) + th(t.pua, 1) + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="cof-note">' + esc(t.pick) + '</p>';
    root.innerHTML = '<h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + '</p><h3 class="cof-h3">' + esc(cname(SEL)) + '</h3>' + cards + chart(SEL, t) + tbl + '<p class="cof-note">' + esc(t.note) + '</p><p class="cof-note">' + esc(t.src) + '</p>' + (window.DICite ? window.DICite.html('eurostat', {}) : '');
    bindChart(root);
    Array.prototype.forEach.call(root.querySelectorAll('.eucs-b'), function (b) { b.onclick = function () { SEL = b.getAttribute('data-c'); render(); var h = root.querySelector('h3'); if (h && h.scrollIntoView) h.scrollIntoView({ block: 'start' }); }; });
  }
  function boot() {
    if (!document.getElementById('eucs')) return;
    Promise.all([fetch('data/eu-farm-economics.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) { D = a[0]; render(); });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
