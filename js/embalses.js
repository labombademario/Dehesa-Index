/* Dehesa Index — Embalses de España (MITECO, Boletín Hidrológico). Lee data/spain-reservoirs.json. ES5. Datos provisionales sin validar. */
(function () {
  'use strict';
  var D = null, SEL = 'ES';
  var T = {
    es: { mh: 'Mapa de embalses', mhint: 'Cada punto es un embalse; el tamaño, su capacidad, y el color, lo lleno que está. Pasa el cursor o toca un punto para ver cuál es. Pulsa una demarcación en la tabla para resaltar sus embalses.', mcount: '{a} de {b} embalses en el mapa', mmiss: 'Los {n} restantes no tienen todavía una ubicación verificada y solo cuentan en la tabla.', mcap: 'capacidad', mly: 'hace un año', mhydro: 'hidroeléctrico', mloc: 'Ubicación: Wikidata (CC0).', mall: 'Ver todos', mlegend: 'Llenado', h: 'Embalses de España', sub: 'Agua almacenada en los embalses por demarcación hidrográfica, comparada con la misma semana del año pasado y con la media de los diez años anteriores. Es la lectura más directa de la sequía para el riego.', week: 'Semana del', full: 'Llenado', cap: 'Capacidad', st: 'Almacenada', ly: 'Año pasado', avg: 'Media 10 años', vsly: 'Frente al año pasado', vsavg: 'Frente a la media', basin: 'Demarcación', nowL: 'Ahora', lyL: 'Año pasado', avL: 'Media 10 años (banda: mínimo–máximo)', es: 'España', hm: 'hm³', pp: 'pp', alt: '{n}: llenado de {x} % en la última semana, frente a {y} % de media en la misma semana',
      note: 'Porcentaje = agua almacenada entre capacidad de los embalses que informan cada semana. La media, el mínimo y el máximo son de los diez años anteriores en la misma semana. Son datos del Boletín Hidrológico, que el ministerio publica como provisionales: las últimas semanas pueden revisarse. Los hemos contrastado con las notas de prensa del MITECO (capacidad idéntica y agua almacenada con diferencias de un 0,2 % o menos).', src: 'Fuente: MITECO, Boletín Hidrológico (BD-Embalses). Reutilización citando la fuente según el aviso legal del ministerio.' },
    en: { mh: 'Reservoir map', mhint: 'Each dot is a reservoir; size shows its capacity and colour how full it is. Hover or tap a dot to see which one it is. Select a basin district in the table to highlight its reservoirs.', mcount: '{a} of {b} reservoirs on the map', mmiss: 'The other {n} do not have a verified location yet and only count in the table.', mcap: 'capacity', mly: 'a year ago', mhydro: 'hydropower', mloc: 'Location: Wikidata (CC0).', mall: 'Show all', mlegend: 'Filled', h: 'Reservoirs in Spain', sub: 'Water stored in reservoirs by river basin district, compared with the same week last year and with the average of the previous ten years. It is the most direct drought reading for irrigation.', week: 'Week of', full: 'Filled', cap: 'Capacity', st: 'Stored', ly: 'Last year', avg: '10-year mean', vsly: 'Vs last year', vsavg: 'Vs average', basin: 'River basin', nowL: 'Now', lyL: 'Last year', avL: '10-year mean (band: minimum–maximum)', es: 'Spain', hm: 'hm³', pp: 'pp', alt: '{n}: {x}% full in the latest week, against a {y}% average for the same week',
      note: 'Percentage = stored water divided by the capacity of the reservoirs reporting each week. The mean, minimum and maximum are for the previous ten years in the same week. Data from the Hydrological Bulletin, which the ministry publishes as provisional: the latest weeks may be revised. We checked them against MITECO press releases (identical capacity, stored water within 0.2%).', src: 'Source: MITECO (Spanish Ministry for the Ecological Transition), Boletín Hidrológico (BD-Embalses). Reuse with attribution under the ministry’s legal notice.' },
    fr: { mh: 'Carte des retenues', mhint: 'Chaque point est une retenue ; la taille indique sa capacité et la couleur son remplissage. Survolez ou touchez un point pour l’identifier. Choisissez un bassin dans le tableau pour mettre ses retenues en évidence.', mcount: '{a} retenues sur {b} sur la carte', mmiss: 'Les {n} autres n’ont pas encore de localisation vérifiée et ne comptent que dans le tableau.', mcap: 'capacité', mly: 'il y a un an', mhydro: 'hydroélectrique', mloc: 'Localisation : Wikidata (CC0).', mall: 'Tout afficher', mlegend: 'Remplissage', h: 'Réservoirs d’Espagne', sub: 'Eau stockée dans les retenues par bassin hydrographique, comparée à la même semaine de l’an dernier et à la moyenne des dix années précédentes. C’est la lecture la plus directe de la sécheresse pour l’irrigation.', week: 'Semaine du', full: 'Remplissage', cap: 'Capacité', st: 'Stockée', ly: 'An dernier', avg: 'Moyenne 10 ans', vsly: 'Vs an dernier', vsavg: 'Vs moyenne', basin: 'Bassin', nowL: 'Maintenant', lyL: 'An dernier', avL: 'Moyenne 10 ans (bande : minimum–maximum)', es: 'Espagne', hm: 'hm³', pp: 'pp', alt: '{n} : {x} % de remplissage la dernière semaine, contre {y} % en moyenne la même semaine',
      note: 'Pourcentage = eau stockée divisée par la capacité des retenues qui déclarent chaque semaine. La moyenne, le minimum et le maximum portent sur les dix années précédentes à la même semaine. Données du Bulletin hydrologique, que le ministère publie comme provisoires : les dernières semaines peuvent être révisées. Nous les avons comparées aux communiqués du MITECO (capacité identique, eau stockée à 0,2 % près).', src: 'Source : MITECO, Boletín Hidrológico (BD-Embalses). Réutilisation avec mention de la source selon l’avis juridique du ministère.' },
    it: { mh: 'Mappa degli invasi', mhint: 'Ogni punto è un invaso; la dimensione indica la capacità e il colore quanto è pieno. Passa il cursore o tocca un punto per vedere quale sia. Scegli un distretto nella tabella per evidenziarne gli invasi.', mcount: '{a} invasi su {b} sulla mappa', mmiss: 'Gli altri {n} non hanno ancora una posizione verificata e contano solo nella tabella.', mcap: 'capacità', mly: 'un anno fa', mhydro: 'idroelettrico', mloc: 'Posizione: Wikidata (CC0).', mall: 'Mostra tutti', mlegend: 'Riempimento', h: 'Invasi della Spagna', sub: 'Acqua immagazzinata negli invasi per distretto idrografico, confrontata con la stessa settimana dell’anno scorso e con la media dei dieci anni precedenti. È la lettura più diretta della siccità per l’irrigazione.', week: 'Settimana del', full: 'Riempimento', cap: 'Capacità', st: 'Immagazzinata', ly: 'Anno scorso', avg: 'Media 10 anni', vsly: 'Vs anno scorso', vsavg: 'Vs media', basin: 'Distretto', nowL: 'Ora', lyL: 'Anno scorso', avL: 'Media 10 anni (banda: minimo–massimo)', es: 'Spagna', hm: 'hm³', pp: 'pp', alt: '{n}: {x}% pieno nell’ultima settimana, contro una media del {y}% nella stessa settimana',
      note: 'Percentuale = acqua immagazzinata divisa per la capacità degli invasi che comunicano ogni settimana. Media, minimo e massimo riguardano i dieci anni precedenti nella stessa settimana. Dati del Bollettino idrologico, che il ministero pubblica come provvisori: le ultime settimane possono essere riviste. Li abbiamo confrontati con i comunicati del MITECO (capacità identica, acqua immagazzinata entro lo 0,2 %).', src: 'Fonte: MITECO, Boletín Hidrológico (BD-Embalses). Riutilizzo citando la fonte secondo l’avviso legale del ministero.' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function sg(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1); }
  function day(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function isoWeek(iso) { var p = iso.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])), n = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - n); var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil(((d - y0) / 86400000 + 1) / 7); }
  function pct(s, i) { return s.capacity[i] > 0 ? 100 * s.stored[i] / s.capacity[i] : null; }
  function name(k, t) { return k === 'ES' ? t.es : D.series[k].name; }
  function ref(k, iso) { var c = D.climatology[k]; return c ? c[String(isoWeek(iso))] : null; }
  function lyIdx(s, i) { var j = i - 52; return j >= 0 ? j : null; }
  function chart(k, t) {
    var s = D.series[k], n = s.dates.length, a = Math.max(0, n - 52), W = 640, H = 200, L = 40, R = 10, Tp = 12, B = 24, m = n - a; if (m < 10) return '';
    function X(i) { return L + i * (W - L - R) / (m - 1); } function Y(v) { return Tp + (100 - v) * (H - Tp - B) / 100; }
    var cur = [], prev = [], av = [], lo = [], hi = [], i, j, r;
    for (i = 0; i < m; i++) { cur.push(pct(s, a + i)); j = a + i - 52; prev.push(j >= 0 ? pct(s, j) : null); r = ref(k, s.dates[a + i]); av.push(r ? r[0] : null); lo.push(r ? r[1] : null); hi.push(r ? r[2] : null); }
    function path(arr) { var d = '', pen = false; arr.forEach(function (v, q) { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(q).toFixed(1) + ' ' + Y(v).toFixed(1) + ' '; pen = true; }); return d; }
    var band = ''; if (av.every(function (v, q) { return v != null && lo[q] != null; })) band = '<path d="' + lo.map(function (v, q) { return (q ? 'L' : 'M') + X(q).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ') + ' ' + hi.map(function (v, q) { return [X(q), Y(v)]; }).reverse().map(function (p) { return 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') + ' Z" fill="rgba(142,195,167,.28)"/>';
    var grid = [0, 25, 50, 75, 100].map(function (v) { return '<g><line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + v + '</text></g>'; }).join('');
    var lastAv = ref(k, s.dates[n - 1]), alt = t.alt.replace('{n}', name(k, t)).replace('{x}', nf(cur[m - 1], 0)).replace('{y}', lastAv ? nf(lastAv[0], 0) : '–');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '" style="width:100%;height:auto;max-width:720px">' + grid + band + '<path d="' + path(av) + '" fill="none" stroke="#6b8e7a" stroke-width="1.6" stroke-dasharray="5 4"/><path d="' + path(prev) + '" fill="none" stroke="#b8651b" stroke-width="2"/><path d="' + path(cur) + '" fill="none" stroke="#2a6f97" stroke-width="2.6"/><text x="' + L + '" y="' + (H - 6) + '" font-size="11" fill="var(--text-faint)">' + esc(s.dates[a].slice(0, 7)) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" fill="var(--text-faint)">' + esc(s.dates[n - 1].slice(0, 7)) + '</text></svg>' +
      '<p class="cof-note"><span style="color:#2a6f97">■</span> ' + esc(t.nowL) + ' &nbsp; <span style="color:#b8651b">■</span> ' + esc(t.lyL) + ' &nbsp; <span style="color:#6b8e7a">■</span> ' + esc(t.avL) + '</p>';
  }
  var PTS = null, MAPL = 0, BINS = [20, 40, 60, 80], COLS = ['#e5eef6', '#b4d0e6', '#78aad2', '#3d7fb8', '#1b4f7d'];
  function colorOf(p) { var i = 0; while (i < BINS.length && p >= BINS[i]) i++; return COLS[i]; }
  function mapHtml(t) {
    var G = window.DEHESA_ES_RESERVOIR_MAP; if (!PTS || !G) return '';
    var P = G.proj, it = PTS.items, on = it.filter(function (x) { return x[5] != null; }), maxc = 0;
    on.forEach(function (x) { if (x[2] > maxc) maxc = x[2]; });
    var sel = SEL !== 'ES' ? SEL : null;
    var dots = on.slice().sort(function (a, b) { return b[2] - a[2]; }).map(function (x) {
      var cx = (x[6] - P.lon0) * P.c * P.k, cy = (P.lat0 - x[5]) * P.k, r = Math.max(2.4, 11 * Math.sqrt(x[2] / maxc)), p = x[2] > 0 ? 100 * x[3] / x[2] : 0, dim = sel && x[1] !== sel;
      return '<circle class="emb-dot" data-i="' + it.indexOf(x) + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + colorOf(p) + '" stroke="var(--surface,#fff)" stroke-width="1"' + (dim ? ' opacity=".18"' : '') + '/>';
    }).join('');
    var regs = G.regions.map(function (g) { return '<path d="' + g.d + '" fill="var(--surface-2,#f1eee6)" stroke="var(--border,#d9d3c4)" stroke-width="0.8"/>'; }).join('');
    var lg = COLS.map(function (c, i) { return '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:12px"><i style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' + c + ';border:1px solid var(--border)"></i>' + (i === 0 ? '< ' + BINS[0] : i === COLS.length - 1 ? '≥ ' + BINS[BINS.length - 1] : BINS[i - 1] + '–' + BINS[i]) + ' %</span>'; }).join('');
    return '<h3 style="margin:14px 0 4px;font-size:15px">' + esc(t.mh) + '</h3><p class="cof-note" style="margin:0 0 8px">' + esc(t.mhint) + '</p>' +
      '<div class="di-card emb-map" style="padding:10px 12px;position:relative;max-width:760px"><div class="emb-tip cof-note" aria-live="polite" style="min-height:2.6em;margin:0 0 6px">' + esc(t.mcount.replace('{a}', on.length).replace('{b}', it.length)) + (sel ? ' · <button type="button" class="embsq-b" data-k="ES" style="all:unset;cursor:pointer;text-decoration:underline">' + esc(t.mall) + '</button>' : '') + '</div>' +
      '<svg viewBox="' + G.viewBox + '" role="img" aria-label="' + esc(t.mh) + '" style="width:100%;height:auto;display:block;touch-action:manipulation">' + regs + dots + '</svg>' +
      '<div class="cof-note" style="margin-top:6px"><strong>' + esc(t.mlegend) + ':</strong> ' + lg + '</div>' +
      '<p class="cof-note" style="margin:6px 0 0">' + esc(t.mmiss.replace('{n}', it.length - on.length)) + ' ' + esc(t.mloc) + '</p></div>';
  }
  function bindMap(root, t) {
    var box = root.querySelector('.emb-map'); if (!box) return;
    var tip = box.querySelector('.emb-tip'), svg = box.querySelector('svg'), base = tip.innerHTML, last = null;
    function show(el) {
      if (last) last.setAttribute('stroke-width', '1'); last = el;
      if (!el) { tip.innerHTML = base; return; }
      el.setAttribute('stroke-width', '2.5'); el.parentNode.appendChild(el);
      var x = PTS.items[+el.getAttribute('data-i')], p = x[2] > 0 ? 100 * x[3] / x[2] : null;
      tip.innerHTML = '<strong>' + esc(x[0]) + '</strong> · ' + esc(x[1]) + (x[8] ? ' · ' + esc(t.mhydro) : '') + '<br><strong>' + nf(p, 1) + ' %</strong> (' + nf(x[3], 0) + ' / ' + nf(x[2], 0) + ' hm³ ' + esc(t.mcap) + ')' +
        (x[4] != null && p != null ? ' · ' + sg(p - x[4]) + ' pp ' + esc(t.mly) : '');
    }
    svg.addEventListener('mouseover', function (e) { if (e.target.classList && e.target.classList.contains('emb-dot')) show(e.target); });
    svg.addEventListener('mouseleave', function () { show(null); });
    svg.addEventListener('click', function (e) {   // en movil: el punto mas cercano al toque
      var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, px = (e.clientX - r.left) / r.width * vb.width, py = (e.clientY - r.top) / r.height * vb.height, best = null, bd = 1e9;
      Array.prototype.forEach.call(svg.querySelectorAll('.emb-dot'), function (c) { if (c.getAttribute('opacity')) return; var dx = c.cx.baseVal.value - px, dy = c.cy.baseVal.value - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = c; } });
      show(bd < 400 ? best : null);
    });
  }
  function loadMap() {
    if (MAPL) return; MAPL = 1;
    var s = document.createElement('script'); s.src = 'vendor/es-reservoir-map.js'; s.onload = render; document.head.appendChild(s);
    fetch('data/spain-reservoirs-points.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) { PTS = d && d.items && d.items.length ? d : null; render(); });
  }
  function render() {
    var root = document.getElementById('embsq'); if (!root || !D || !D.series || !D.series.ES) return;
    var t = T[lang()] || T.es, keys = Object.keys(D.series).filter(function (k) { return k !== 'ES'; }), now = function (k) { var s = D.series[k]; return pct(s, s.dates.length - 1); };
    keys.sort(function (a, b) { return now(a) - now(b); }); keys.unshift('ES');
    var rows = keys.map(function (k) {
      var s = D.series[k], i = s.dates.length - 1, p = pct(s, i), j = lyIdx(s, i), ly = j != null ? pct(s, j) : null, r = ref(k, s.dates[i]);
      return '<tr style="' + (k === SEL ? 'background:rgba(29,81,120,.06)' : '') + '"><th scope="row"><button type="button" class="embsq-b" data-k="' + esc(k) + '" style="all:unset;cursor:pointer;font-weight:' + (k === 'ES' ? 700 : 600) + '">' + esc(name(k, t)) + '</button></th><td class="cof-n"><strong>' + nf(p, 1) + ' %</strong></td><td class="cof-n embsq-st">' + nf(s.stored[i], 0) + ' / ' + nf(s.capacity[i], 0) + '</td><td class="cof-n">' + (ly == null ? '—' : sg(p - ly) + ' ' + t.pp) + '</td><td class="cof-n">' + (r ? sg(p - r[0]) + ' ' + t.pp : '—') + '</td></tr>';
    }).join('');
    var s0 = D.series[SEL];
    root.innerHTML = '<style>@media(max-width:520px){.embsq-st{display:none}}</style><h2 class="cof-h2">' + esc(t.h) + '</h2><p class="cof-sub">' + esc(t.sub) + ' ' + esc(t.week) + ' ' + esc(day(D.asOf)) + '.</p>' + mapHtml(t) + '<div class="di-card" style="padding:6px 14px;overflow-x:auto"><table class="cof-tbl"><thead><tr><th scope="col">' + esc(t.basin) + '</th><th scope="col" class="cof-n">' + esc(t.full) + '</th><th scope="col" class="cof-n embsq-st">' + esc(t.st) + ' / ' + esc(t.cap) + ' (' + esc(t.hm) + ')</th><th scope="col" class="cof-n">' + esc(t.vsly) + '</th><th scope="col" class="cof-n">' + esc(t.vsavg) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div><h3 class="cof-h3">' + esc(name(SEL, t)) + '</h3>' + (s0 ? chart(SEL, t) : '') + '<p class="cof-note">' + esc(t.note) + '</p><p class="cof-note">' + esc(t.src) + '</p>' + (window.DICite ? window.DICite.html('miteco_embalses', {}) : '');
    Array.prototype.forEach.call(root.querySelectorAll('.embsq-b'), function (b) { b.onclick = function () { SEL = b.getAttribute('data-k'); render(); }; });
    bindMap(root, t); loadMap();
  }
  function boot() {
    if (!document.getElementById('embsq')) return;
    Promise.all([fetch('data/spain-reservoirs.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve()]).then(function (a) { D = a[0]; render(); });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
