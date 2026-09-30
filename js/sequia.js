/* Dehesa Index — Monitor de sequía de EE. UU. (U.S. Drought Monitor: NDMC, USDA, NOAA). Semanal, por estado. */
(function () {
  'use strict';
  var D = null;
  var SEL = { metric: 1, region: 'CONUS' };
  var CLS = ['#f3efe4', '#f1d9a0', '#e3b25a', '#cf7f36', '#a9491f', '#6e2410'];
  var ST = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  var T = {
    es: { title: 'Monitor de sequía de EE. UU.', sub: 'Qué parte de cada estado está en sequía, semana a semana. Datos del U.S. Drought Monitor (Universidad de Nebraska-Lincoln, USDA y NOAA); se actualizan los jueves con el mapa válido al martes anterior.',
      metric: 'Categoría', region: 'Zona', conus: 'EE. UU. continental', week: 'Semana al', of: 'de la superficie',
      m: ['D0 o peor · Anormalmente seco', 'D1 o peor · Sequía moderada', 'D2 o peor · Sequía severa', 'D3 o peor · Sequía extrema', 'D4 · Sequía excepcional'],
      ms: ['Anormalmente seco (D0+)', 'Sequía (D1+)', 'Sequía severa (D2+)', 'Sequía extrema (D3+)', 'Sequía excepcional (D4)'],
      vsWeek: 'frente a la semana anterior', vsYear: 'frente al mismo momento del año pasado', pp: 'pp',
      chart: 'Evolución: últimos 12 meses frente a los 12 anteriores', cur: 'Últimos 12 meses', prev: '12 meses anteriores',
      state: 'Estado', now: 'Ahora', dWeek: 'Vs. semana anterior', dYear: 'Vs. año anterior', noData: 'Sin datos.',
      legendNone: 'Sin sequía en esa categoría', tip: 'de la superficie en', pick: 'Pulsa un estado para ver su evolución.',
      note: 'Fuente: U.S. Drought Monitor, elaborado por el National Drought Mitigation Center (Universidad de Nebraska-Lincoln) con USDA y NOAA. Las categorías son acumuladas: D1 incluye D2, D3 y D4. “pp” son puntos porcentuales. El mapa es una valoración semanal que combina índices, medidas de campo y criterio de expertos; no es un pronóstico.',
      src: 'Fuente: U.S. Drought Monitor (datos públicos)' },
    en: { title: 'U.S. Drought Monitor', sub: 'How much of each state is in drought, week by week. Data from the U.S. Drought Monitor (University of Nebraska-Lincoln, USDA and NOAA); updated on Thursdays with the map valid the previous Tuesday.',
      metric: 'Category', region: 'Area', conus: 'Contiguous U.S.', week: 'Week of', of: 'of the area',
      m: ['D0 or worse · Abnormally dry', 'D1 or worse · Moderate drought', 'D2 or worse · Severe drought', 'D3 or worse · Extreme drought', 'D4 · Exceptional drought'],
      ms: ['Abnormally dry (D0+)', 'Drought (D1+)', 'Severe drought (D2+)', 'Extreme drought (D3+)', 'Exceptional drought (D4)'],
      vsWeek: 'vs. previous week', vsYear: 'vs. same time last year', pp: 'pp',
      chart: 'Trend: last 12 months vs. the 12 before', cur: 'Last 12 months', prev: 'Previous 12 months',
      state: 'State', now: 'Now', dWeek: 'vs. prev. week', dYear: 'vs. last year', noData: 'No data.',
      legendNone: 'None in that category', tip: 'of the area in', pick: 'Click a state to see its trend.',
      note: 'Source: U.S. Drought Monitor, produced by the National Drought Mitigation Center (University of Nebraska-Lincoln) with USDA and NOAA. Categories are cumulative: D1 includes D2, D3 and D4. “pp” means percentage points. The map is a weekly assessment combining indices, field measurements and expert judgement; it is not a forecast.',
      src: 'Source: U.S. Drought Monitor (public data)' },
    fr: { title: 'Moniteur de sécheresse américain', sub: 'Quelle part de chaque État est en sécheresse, semaine après semaine. Données du U.S. Drought Monitor (Université du Nebraska-Lincoln, USDA et NOAA) ; mises à jour le jeudi avec la carte valable le mardi précédent.',
      metric: 'Catégorie', region: 'Zone', conus: 'États-Unis continentaux', week: 'Semaine du', of: 'de la surface',
      m: ['D0 ou pire · Anormalement sec', 'D1 ou pire · Sécheresse modérée', 'D2 ou pire · Sécheresse sévère', 'D3 ou pire · Sécheresse extrême', 'D4 · Sécheresse exceptionnelle'],
      ms: ['Anormalement sec (D0+)', 'Sécheresse (D1+)', 'Sécheresse sévère (D2+)', 'Sécheresse extrême (D3+)', 'Sécheresse exceptionnelle (D4)'],
      vsWeek: 'par rapport à la semaine précédente', vsYear: 'par rapport à la même période l’an dernier', pp: 'pt',
      chart: 'Évolution : 12 derniers mois et 12 mois précédents', cur: '12 derniers mois', prev: '12 mois précédents',
      state: 'État', now: 'Actuel', dWeek: 'Vs sem. préc.', dYear: 'Vs an dernier', noData: 'Pas de données.',
      legendNone: 'Aucune dans cette catégorie', tip: 'de la surface en', pick: 'Cliquez sur un État pour voir son évolution.',
      note: 'Source : U.S. Drought Monitor, produit par le National Drought Mitigation Center (Université du Nebraska-Lincoln) avec l’USDA et la NOAA. Les catégories sont cumulatives : D1 inclut D2, D3 et D4. « pt » = points de pourcentage. La carte est une évaluation hebdomadaire combinant indices, mesures de terrain et expertise ; ce n’est pas une prévision.',
      src: 'Source : U.S. Drought Monitor (données publiques)' },
    it: { title: 'Monitor della siccità negli USA', sub: 'Quanta parte di ogni Stato è in siccità, settimana per settimana. Dati dell’U.S. Drought Monitor (Università del Nebraska-Lincoln, USDA e NOAA); aggiornati il giovedì con la mappa valida il martedì precedente.',
      metric: 'Categoria', region: 'Area', conus: 'USA continentali', week: 'Settimana del', of: 'della superficie',
      m: ['D0 o peggio · Anormalmente secco', 'D1 o peggio · Siccità moderata', 'D2 o peggio · Siccità severa', 'D3 o peggio · Siccità estrema', 'D4 · Siccità eccezionale'],
      ms: ['Anormalmente secco (D0+)', 'Siccità (D1+)', 'Siccità severa (D2+)', 'Siccità estrema (D3+)', 'Siccità eccezionale (D4)'],
      vsWeek: 'rispetto alla settimana precedente', vsYear: 'rispetto allo stesso periodo dell’anno scorso', pp: 'pp',
      chart: 'Andamento: ultimi 12 mesi e i 12 precedenti', cur: 'Ultimi 12 mesi', prev: '12 mesi precedenti',
      state: 'Stato', now: 'Ora', dWeek: 'Vs sett. prec.', dYear: 'Vs anno scorso', noData: 'Nessun dato.',
      legendNone: 'Nessuna in quella categoria', tip: 'della superficie in', pick: 'Clicca su uno Stato per vederne l’andamento.',
      note: 'Fonte: U.S. Drought Monitor, elaborato dal National Drought Mitigation Center (Università del Nebraska-Lincoln) con USDA e NOAA. Le categorie sono cumulative: D1 include D2, D3 e D4. “pp” = punti percentuali. La mappa è una valutazione settimanale che combina indici, misure in campo e giudizio di esperti; non è una previsione.',
      src: 'Fonte: U.S. Drought Monitor (dati pubblici)' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tr() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function series(region) { return region === 'CONUS' ? D.us.conus : D.states[region] || []; }
  function val(row, m) { return row[1 + m]; }
  function at(rows, off) { return rows.length > off ? rows[rows.length - 1 - off] : null; }
  function delta(d, t) { if (d === null) return '<span style="color:var(--text-faint)">—</span>'; var c = d > 0.05 ? '#a9491f' : d < -0.05 ? '#2f7d4f' : 'var(--text-faint)'; return '<span style="color:' + c + ';font-weight:600">' + (d > 0.05 ? '+' : d < -0.05 ? '−' : '') + nf(Math.abs(d), 1) + ' ' + esc(t.pp) + '</span>'; }
  function cls(v) { return v <= 0 ? 0 : v < 10 ? 1 : v < 25 ? 2 : v < 45 ? 3 : v < 70 ? 4 : 5; }
  function lineChart(a, b, labels, t) {
    var W = 720, H = 230, L = 46, R = 12, Tp = 12, Bt = 26, n = Math.max(a.length, b.length), max = 0;
    a.concat(b).forEach(function (v) { if (v > max) max = v; });
    var nice = max <= 10 ? 10 : max <= 25 ? 25 : max <= 50 ? 50 : 100;
    var x = function (i) { return L + (W - L - R) * (n > 1 ? i / (n - 1) : 0); }, y = function (v) { return Tp + (H - Tp - Bt) * (1 - v / nice); };
    var g = ''; for (var k = 0; k <= 4; k++) { var vv = nice * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(vv) + '" y2="' + y(vv) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (y(vv) + 4) + '" font-size="11" text-anchor="end" fill="var(--text-faint)">' + nf(vv, 0) + ' %</text>'; }
    var p = function (arr, col) { return '<path d="' + arr.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round"/>'; };
    var xl = [0, Math.floor((n - 1) / 2), n - 1].map(function (i) { return '<text x="' + x(i) + '" y="' + (H - 8) + '" font-size="11" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" fill="var(--text-faint)">' + esc(labels[i] || '') + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" role="img">' + g + p(b, '#b8a98a') + p(a, '#a9491f') + xl + '</svg>';
  }
  function card(label, value, sub) { return '<div class="di-card" style="padding:14px 16px;flex:1 1 200px;min-width:180px"><div style="font-size:11px;letter-spacing:.4px;color:var(--text-faint);font-weight:700">' + esc(label).toUpperCase() + '</div><div style="font-size:24px;font-weight:700;margin:4px 0 2px;font-family:\'Source Serif 4\',serif">' + value + '</div><div style="font-size:12.5px">' + sub + '</div></div>'; }
  function rname(r, t) { return r === 'CONUS' ? t.conus : (ST[r] || r); }
  function render() {
    var t = tr(), root = document.getElementById('sq-body');
    document.title = 'Dehesa Index — ' + t.title;
    document.getElementById('pg-h1').textContent = t.title; document.getElementById('pg-sub').textContent = t.sub;
    if (!D) { root.innerHTML = '<p class="di-movers-hint">' + esc(t.noData) + '</p>'; return; }
    var m = SEL.metric, rows = series(SEL.region), last = at(rows, 0), pw = at(rows, 1), py = at(rows, 52);
    var cur = val(last, m);
    var cards = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0">' + [1, 2, 0].map(function (k) {
      var l = at(series(SEL.region), 0), a = at(series(SEL.region), 1), y = at(series(SEL.region), 52), v = val(l, k);
      return card(t.ms[k], nf(v, 1) + ' %', delta(a ? v - val(a, k) : null, t) + ' <span style="color:var(--text-faint)">' + esc(t.vsWeek) + '</span><br>' + delta(y ? v - val(y, k) : null, t) + ' <span style="color:var(--text-faint)">' + esc(t.vsYear) + '</span>');
    }).join('') + '</div>';
    var mopts = t.m.map(function (s, k) { return '<option value="' + k + '"' + (k === m ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('');
    var regs = Object.keys(D.states).sort(function (a, b) { return (ST[a] || a).localeCompare(ST[b] || b); });
    var ropts = '<option value="CONUS"' + (SEL.region === 'CONUS' ? ' selected' : '') + '>' + esc(t.conus) + '</option>' + regs.map(function (r) { return '<option value="' + r + '"' + (r === SEL.region ? ' selected' : '') + '>' + esc(ST[r] || r) + '</option>'; }).join('');
    var svg = '';
    if (window.DEHESA_US_STATES) svg = '<svg viewBox="' + window.DEHESA_US_STATES.viewBox + '" style="width:100%;height:auto;display:block" role="img" aria-label="' + esc(t.ms[m]) + '">' + window.DEHESA_US_STATES.states.map(function (s) {
      var r = D.states[s.id], v = r && r.length ? val(r[r.length - 1], m) : null;
      return '<path data-st="' + s.id + '" d="' + s.d + '" fill="' + (v === null ? '#e6e2d6' : CLS[cls(v)]) + '" stroke="' + (s.id === SEL.region ? '#1d5178' : '#ffffff') + '" stroke-width="' + (s.id === SEL.region ? 2 : 0.8) + '" stroke-linejoin="round" style="cursor:pointer"></path>';
    }).join('') + '</svg>';
    var lg = ['0 %', '< 10 %', '10–25 %', '25–45 %', '45–70 %', '≥ 70 %'].map(function (s, k) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + CLS[k] + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></span>' + esc(s) + '</span>'; }).join('');
    var wk = rows.slice(-52), pk = rows.slice(-104, -52);
    var chart = '<div class="di-card" style="padding:14px 16px;margin-top:14px"><div style="font-weight:600;margin-bottom:4px">' + esc(rname(SEL.region, t)) + ' · ' + esc(t.ms[m]) + '</div><div style="font-size:12.5px;color:var(--text-faint);margin-bottom:6px">' + esc(t.chart) + '</div>' +
      '<div style="display:flex;gap:16px;font-size:12.5px;margin-bottom:6px"><span><span style="display:inline-block;width:14px;height:3px;background:#a9491f;vertical-align:middle;margin-right:6px"></span>' + esc(t.cur) + '</span><span><span style="display:inline-block;width:14px;height:3px;background:#b8a98a;vertical-align:middle;margin-right:6px"></span>' + esc(t.prev) + '</span></div>' +
      lineChart(wk.map(function (r) { return val(r, m); }), pk.map(function (r) { return val(r, m); }), wk.map(function (r) { return r[0]; }), t) + '</div>';
    var list = regs.map(function (s) { var r = D.states[s], l = r[r.length - 1], a = r.length > 1 ? r[r.length - 2] : null, y = r.length > 52 ? r[r.length - 53] : null; return { s: s, v: val(l, m), dw: a ? val(l, m) - val(a, m) : null, dy: y ? val(l, m) - val(y, m) : null }; }).sort(function (a, b) { return b.v - a.v; });
    var th = function (x, r) { return '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:' + (r ? 'right' : 'left') + '">' + esc(x).toUpperCase() + '</th>'; };
    var table = '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table style="border-collapse:collapse;width:100%;min-width:480px;font-size:14px"><tr>' + th(t.state) + '<th></th>' + th(t.now, 1) + th(t.dWeek, 1) + th(t.dYear, 1) + '</tr>' +
      list.map(function (r) { return '<tr data-row="' + r.s + '" style="border-top:1px solid var(--border);cursor:pointer' + (r.s === SEL.region ? ';background:rgba(29,81,120,.06)' : '') + '"><td style="padding:9px 6px;font-weight:600;white-space:nowrap">' + esc(ST[r.s] || r.s) + '</td><td style="padding:9px 6px;width:30%"><div style="height:8px;border-radius:2px 4px 4px 2px;background:' + CLS[Math.max(1, cls(r.v))] + ';width:' + Math.min(100, r.v).toFixed(1) + '%"></div></td><td style="padding:9px 6px;text-align:right">' + nf(r.v, 1) + ' %</td><td style="padding:9px 6px;text-align:right">' + delta(r.dw, t) + '</td><td style="padding:9px 6px;text-align:right">' + delta(r.dy, t) + '</td></tr>'; }).join('') + '</table></div>';
    root.innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap"><label style="font-size:13px">' + esc(t.metric) + '<br><select id="sq-sel-m" class="di-compare-select">' + mopts + '</select></label><label style="font-size:13px">' + esc(t.region) + '<br><select id="sq-sel-r" class="di-compare-select">' + ropts + '</select></label></div>' +
      '<div style="margin-top:8px;font-size:13px;color:var(--text-faint)">' + esc(t.week) + ' ' + esc(last[0]) + '</div>' + cards +
      '<div class="di-card" style="padding:8px;position:relative"><div id="sq-map">' + svg + '</div><div id="sq-tip" style="display:none;position:absolute;pointer-events:none;background:var(--surface,#fff);border:1px solid var(--border);border-radius:6px;padding:6px 9px;font-size:12.5px;box-shadow:0 2px 8px rgba(0,0,0,.12);white-space:nowrap"></div></div>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;margin:8px 0">' + lg + '</div><p class="di-movers-hint">' + esc(t.pick) + '</p>' + chart + table +
      '<p class="di-info-api-notice" style="margin:14px 0 6px">' + esc(t.note) + '</p><p class="di-movers-hint">' + esc(t.src) + '</p>';
    document.getElementById('sq-sel-m').onchange = function (e) { SEL.metric = parseInt(e.target.value, 10); render(); };
    document.getElementById('sq-sel-r').onchange = function (e) { SEL.region = e.target.value; render(); };
    var box = document.getElementById('sq-map'), tip = document.getElementById('sq-tip'), wrap = tip.parentNode;
    Array.prototype.forEach.call(box.querySelectorAll('path'), function (p) {
      var st = p.getAttribute('data-st'), r = D.states[st], v = r && r.length ? val(r[r.length - 1], m) : null;
      p.addEventListener('mousemove', function (e) { var b = wrap.getBoundingClientRect(); tip.innerHTML = '<strong>' + esc(ST[st] || st) + '</strong><br>' + (v === null ? esc(t.noData) : nf(v, 1) + ' % ' + esc(t.tip) + ' ' + esc(t.ms[m])); tip.style.display = 'block'; tip.style.left = Math.min(e.clientX - b.left + 12, b.width - 200) + 'px'; tip.style.top = (e.clientY - b.top + 12) + 'px'; });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      p.addEventListener('click', function () { if (r) { SEL.region = st; render(); } });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-row]'), function (tr2) { tr2.onclick = function () { SEL.region = tr2.getAttribute('data-row'); render(); }; });
  }
  window.DehesaShared.init('informacion');
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  fetch('data/drought.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) {
    D = d && d.states && d.us && d.us.conus && d.us.conus.length ? d : null;
    var q = new URLSearchParams(window.location.search);
    if (q.get('state') && D && D.states[q.get('state')]) SEL.region = q.get('state');
    if (q.get('cat') && /^[0-4]$/.test(q.get('cat'))) SEL.metric = parseInt(q.get('cat'), 10);
    render();
  });
})();
