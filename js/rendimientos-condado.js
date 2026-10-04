/* Dehesa Index — Rendimientos por condado de EE. UU. (USDA NASS Quick Stats, estimaciones por condado).
   Bloque «Por condado» de rendimientos.html: lo monta js/rendimientos.js con el cultivo elegido. Datos: data/us-county/yields/<cultivo>.json (rendimiento, superficie cosechada y producción por condado y año)
   y contornos por estado en vendor/us-counties/<ST>.json (Censo de EE. UU., vía us-atlas). Un condado sin dato es un hueco que NASS no publica, nunca cero. ES5. */
(function () {
  'use strict';
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var SEQ = ['#eef2f5', '#c6d5e0', '#8fb0c8', '#4f82a6', '#1d5178'], NONE = '#e6e2d6';
  var SLUG = { 'CORN, GRAIN': 'corn', SOYBEANS: 'soybeans', 'WHEAT, WINTER': 'wheat-winter', 'WHEAT, SPRING, (EXCL DURUM)': 'wheat-spring', 'COTTON, UPLAND': 'cotton-upland', 'SORGHUM, GRAIN': 'sorghum', RICE: 'rice', PEANUTS: 'peanuts', 'HAY, ALFALFA': 'hay-alfalfa', BARLEY: 'barley', OATS: 'oats' };
  var CACHE = {}, GEO = {}, SEL = { crop: null, state: null, metric: 'yield', year: null }, TOK = 0;
  var T = {
    es: { h: 'Por condado', sub: 'Estimaciones de NASS por condado. NASS solo publica los condados en los que la encuesta lo permite, y cada año son distintos: un condado en gris no tiene cifra publicada (o NASS la suprime por confidencialidad). Es un hueco, no un cero.',
      state: 'Estado', metric: 'Cifra', year: 'Año', yield: 'Rendimiento', harvested: 'Superficie cosechada', production: 'Producción', county: 'Condado', value: 'Valor', prev: 'vs. año anterior',
      cov: 'Condados con dato', of: 'de', range: 'Rango', top: 'Más alto', other: 'Otros condados (suma publicada por NASS)', all: 'Ver todos los condados', none: 'NASS no publica este cultivo por condado en este estado y año.', noCrop: 'NASS no publica este cultivo por condado.', loading: 'Cargando condados…', fail: 'No se han podido cargar los datos por condado.',
      note: 'Cifras tal como las publica NASS (Quick Stats, nivel condado). «Otros condados» es la suma que NASS da para los condados que no publica por separado. En todos los condados, producción = rendimiento × superficie cosechada con una tolerancia del 4 % (comprobado en cada carga). Contornos: Censo de EE. UU. (dominio público), vía us-atlas. Los límites son los de 2017: un condado que cambió después puede no aparecer en el mapa y sí en la tabla.',
      noMap: 'sin contorno en el mapa', legendNone: 'sin dato publicado' },
    en: { h: 'By county', sub: 'NASS county estimates. NASS only publishes the counties where the survey allows it, and they differ from year to year: a grey county has no published figure (or NASS withholds it for confidentiality). It is a gap, not a zero.',
      state: 'State', metric: 'Figure', year: 'Year', yield: 'Yield', harvested: 'Area harvested', production: 'Production', county: 'County', value: 'Value', prev: 'vs. previous year',
      cov: 'Counties with data', of: 'of', range: 'Range', top: 'Highest', other: 'Other counties (sum published by NASS)', all: 'Show all counties', none: 'NASS does not publish this crop by county in this state and year.', noCrop: 'NASS does not publish this crop by county.', loading: 'Loading counties…', fail: 'County data could not be loaded.',
      note: 'Figures as published by NASS (Quick Stats, county level). “Other counties” is the sum NASS gives for counties it does not publish separately. For every county, production = yield × area harvested within a 4 % tolerance (checked on every load). Outlines: US Census Bureau (public domain), via us-atlas. Boundaries are the 2017 ones: a county that changed later may be missing from the map but present in the table.',
      noMap: 'no outline on the map', legendNone: 'no published figure' },
    fr: { h: 'Par comté', sub: 'Estimations du NASS par comté. Le NASS ne publie que les comtés où l’enquête le permet, et ils changent d’une année à l’autre : un comté en gris n’a pas de chiffre publié (ou le NASS le supprime par confidentialité). C’est un manque, pas un zéro.',
      state: 'État', metric: 'Chiffre', year: 'Année', yield: 'Rendement', harvested: 'Surface récoltée', production: 'Production', county: 'Comté', value: 'Valeur', prev: 'vs. année précédente',
      cov: 'Comtés avec données', of: 'sur', range: 'Fourchette', top: 'Le plus élevé', other: 'Autres comtés (somme publiée par le NASS)', all: 'Voir tous les comtés', none: 'Le NASS ne publie pas cette culture par comté dans cet État et cette année.', noCrop: 'Le NASS ne publie pas cette culture par comté.', loading: 'Chargement des comtés…', fail: 'Impossible de charger les données par comté.',
      note: 'Chiffres tels que publiés par le NASS (Quick Stats, niveau comté). « Autres comtés » est la somme que le NASS donne pour les comtés qu’il ne publie pas séparément. Pour chaque comté, production = rendement × surface récoltée à 4 % près (vérifié à chaque chargement). Contours : US Census Bureau (domaine public), via us-atlas. Les limites sont celles de 2017 : un comté modifié depuis peut manquer sur la carte mais figurer dans le tableau.',
      noMap: 'sans contour sur la carte', legendNone: 'pas de chiffre publié' },
    it: { h: 'Per contea', sub: 'Stime NASS per contea. Il NASS pubblica solo le contee in cui l’indagine lo consente, e cambiano di anno in anno: una contea grigia non ha un dato pubblicato (o il NASS lo sopprime per riservatezza). È un vuoto, non uno zero.',
      state: 'Stato', metric: 'Dato', year: 'Anno', yield: 'Resa', harvested: 'Superficie raccolta', production: 'Produzione', county: 'Contea', value: 'Valore', prev: 'rispetto all’anno prima',
      cov: 'Contee con dato', of: 'su', range: 'Intervallo', top: 'Più alto', other: 'Altre contee (somma pubblicata dal NASS)', all: 'Mostra tutte le contee', none: 'Il NASS non pubblica questa coltura per contea in questo Stato e anno.', noCrop: 'Il NASS non pubblica questa coltura per contea.', loading: 'Caricamento delle contee…', fail: 'Impossibile caricare i dati per contea.',
      note: 'Dati come pubblicati dal NASS (Quick Stats, livello contea). «Altre contee» è la somma che il NASS dà per le contee che non pubblica separatamente. Per ogni contea, produzione = resa × superficie raccolta entro il 4 % (verificato a ogni caricamento). Contorni: US Census Bureau (pubblico dominio), tramite us-atlas. I confini sono quelli del 2017: una contea cambiata dopo può mancare dalla mappa ma comparire in tabella.',
      noMap: 'senza contorno sulla mappa', legendNone: 'nessun dato pubblicato' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function get(url) { return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function fmt(doc, m, v) {
    if (v === null || v === undefined) return '—';
    var u = doc.units[m];
    if (m === 'harvested') return v >= 1e6 ? nf(v / 1e6, 2) + ' M ac' : nf(v, 0) + ' ac';
    if (m === 'yield') return u === 'TONS / ACRE' ? nf(v, 2) + ' t/ac' : u === 'LB / ACRE' ? nf(v, 0) + ' lb/ac' : nf(v, 1) + ' bu/ac';
    var unit = u === 'BU' ? 'bu' : u === 'CWT' ? 'cwt' : u === 'LB' ? 'lb' : u === 'TONS' ? 't' : u === '480 LB BALES' ? (lang() === 'es' ? 'pacas' : lang() === 'fr' ? 'balles' : lang() === 'it' ? 'balle' : 'bales') : u.toLowerCase();
    return v >= 1e6 ? nf(v / 1e6, 2) + ' M ' + unit : v >= 1e4 ? nf(v / 1e3, 0) + ' k ' + unit : nf(v, 0) + ' ' + unit;
  }
  function cell(doc, f, m, yi) { var a = doc.counties[f]; var v = a ? a[m === 'yield' ? 0 : m === 'harvested' ? 1 : 2][yi] : null; return typeof v === 'number' ? v : null; }
  function stateTotal(doc, st, m, yi) { var s = 0, n = 0; Object.keys(doc.counties).forEach(function (f) { if (f.slice(0, 2) !== st || f.slice(2) === '998') return; var v = cell(doc, f, m, yi); if (v !== null) { s += v; n++; } }); return n ? s : null; }
  function load(slug) { if (CACHE[slug] !== undefined) return Promise.resolve(CACHE[slug]); return get('data/us-county/yields/' + slug + '.json').then(function (d) { CACHE[slug] = d && d.counties ? d : null; return CACHE[slug]; }); }
  function geo(code) { if (GEO[code]) return Promise.resolve(GEO[code]); return get('vendor/us-counties/' + code + '.json').then(function (d) { GEO[code] = d; return d; }); }
  var FIPS = { '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY' };
  var CODE = {}; Object.keys(FIPS).forEach(function (k) { CODE[FIPS[k]] = k; });
  function paint(host, ctx, doc, g, tok) {
    var t = T[lang()] || T.es, ST = ctx.ST || {}, m = SEL.metric, yi = doc.years.indexOf(Number(SEL.year)), sf = CODE[SEL.state], py = doc.years.indexOf(Number(SEL.year) - 1);
    var names = {}; if (g) g.c.forEach(function (c) { names[c[0]] = c[1]; });
    var rows = [], other = null;
    Object.keys(doc.counties).forEach(function (f) { if (f.slice(0, 2) !== sf) return; var v = cell(doc, f, m, yi); if (v === null) return; if (f.slice(2) === '998') { other = v; return; } rows.push({ f: f, name: names[f] || ('FIPS ' + f), v: v, p: py >= 0 ? cell(doc, f, m, py) : null }); });
    rows.sort(function (a, b) { return b.v - a.v; });
    var total = g ? g.c.length : null, vals = rows.map(function (r) { return r.v; }).sort(function (a, b) { return a - b; });
    var cuts = [1, 2, 3, 4].map(function (q) { return vals.length ? vals[Math.min(vals.length - 1, Math.floor(vals.length * q / 5))] : 0; });
    var cls = function (v) { var i = 0; while (i < 4 && v >= cuts[i]) i++; return i; };
    var byF = {}; rows.forEach(function (r) { byF[r.f] = r; });
    var svg = '';
    if (g && rows.length) {
      svg = '<svg viewBox="' + g.vb.join(' ') + '" style="width:100%;height:auto;max-height:560px;display:block" role="img" aria-label="' + esc((ctx.cropName || '') + ' · ' + t[m] + ' · ' + (ST[SEL.state] || SEL.state) + ' · ' + SEL.year) + '">' +
        g.c.map(function (c) { var r = byF[c[0]]; return '<path data-f="' + c[0] + '" d="' + c[2] + '" fill="' + (r ? SEQ[cls(r.v)] : NONE) + '" stroke="#fff" stroke-width="0.5" stroke-linejoin="round"></path>'; }).join('') + '</svg>';
    }
    var lg = rows.length >= 5 ? SEQ.map(function (c, i) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + c + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></span>' + esc(i === 0 ? '< ' + fmt(doc, m, cuts[0]) : i === 4 ? '≥ ' + fmt(doc, m, cuts[3]) : fmt(doc, m, cuts[i - 1]) + '–' + fmt(doc, m, cuts[i])) + '</span>'; }).join('') : '';
    lg += '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + NONE + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></span>' + esc(t.legendNone) + '</span>';
    var th = function (x, r) { return '<th style="padding:8px 6px;font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:' + (r ? 'right' : 'left') + '">' + esc(x).toUpperCase() + '</th>'; };
    var chg = function (r) { if (r.p === null || !r.p) return '<span style="color:var(--text-faint)">—</span>'; var p = (r.v / r.p - 1) * 100, c = p > 0.05 ? 'var(--positive)' : p < -0.05 ? '#a9491f' : 'var(--text-faint)'; return '<span style="color:' + c + ';font-weight:600">' + (p > 0.05 ? '+' : p < -0.05 ? '−' : '') + nf(Math.abs(p), 1) + ' %</span>'; };
    var tr = function (r) { return '<tr data-f="' + r.f + '" style="border-top:1px solid var(--border)"><td style="padding:7px 6px">' + esc(r.name) + (g && !names[r.f] ? ' <span class="di-movers-hint">(' + esc(t.noMap) + ')</span>' : '') + '</td><td style="padding:7px 6px;text-align:right;font-variant-numeric:tabular-nums">' + esc(fmt(doc, m, r.v)) + '</td><td style="padding:7px 6px;text-align:right">' + chg(r) + '</td></tr>'; };
    var head = '<thead><tr>' + th(t.county) + th(t.value, 1) + th(t.prev, 1) + '</tr></thead>';
    var tbl = rows.length ? '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table id="rd-cty-tbl" style="border-collapse:collapse;width:100%;min-width:360px;font-size:14px">' + head + '<tbody>' + rows.slice(0, 12).map(tr).join('') + '</tbody></table>' +
      (rows.length > 12 ? '<details style="margin:6px 0 10px"><summary style="cursor:pointer;font-weight:600;font-size:13px;padding:6px 0">' + esc(t.all) + ' (' + rows.length + ')</summary><table style="border-collapse:collapse;width:100%;min-width:360px;font-size:14px">' + head + '<tbody>' + rows.slice(12).map(tr).join('') + '</tbody></table></details>' : '') +
      (other !== null ? '<div style="border-top:1px solid var(--border);padding:8px 6px;font-size:13px;color:var(--text-faint)">' + esc(t.other) + ': <strong style="color:inherit">' + esc(fmt(doc, m, other)) + '</strong></div>' : '') + '</div>' : '';
    var cards = rows.length ? '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0">' +
      card(t.cov, nf(rows.length, 0) + (total ? ' ' + t.of + ' ' + nf(total, 0) : '')) + card(t.range, esc(fmt(doc, m, vals[0]) + ' – ' + fmt(doc, m, vals[vals.length - 1]))) + card(t.top, esc(rows[0].name) + ' · ' + esc(fmt(doc, m, rows[0].v))) + '</div>' : '';
    var body = rows.length ? cards + '<div class="di-card" style="padding:8px;position:relative"><div id="rd-cty-map">' + svg + '</div><div id="rd-cty-tip" style="display:none;position:absolute;pointer-events:none;background:var(--surface,#fff);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:2"></div></div><div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;margin:10px 0 0;color:var(--text-faint)">' + lg + '</div>' + tbl : '<p class="di-movers-hint" style="margin:14px 0">' + esc(t.none) + '</p>';
    var sec = document.getElementById('rd-cty-body'); if (!sec || tok !== TOK) return; sec.innerHTML = body;
    var box = document.getElementById('rd-cty-map'), tip = document.getElementById('rd-cty-tip');
    if (box && tip) { var wrap = tip.parentNode; Array.prototype.forEach.call(box.querySelectorAll('path'), function (p) { var f = p.getAttribute('data-f'), r = byF[f];
      p.addEventListener('mousemove', function (e) { var b = wrap.getBoundingClientRect(); tip.innerHTML = '<strong>' + esc(names[f] || f) + '</strong><br>' + (r ? esc(fmt(doc, m, r.v)) : esc(t.legendNone)); tip.style.display = 'block'; tip.style.left = Math.min(e.clientX - b.left + 12, b.width - 190) + 'px'; tip.style.top = (e.clientY - b.top + 12) + 'px'; });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; }); }); }
  }
  function card(l, v) { return '<div class="di-card" style="padding:12px 14px;flex:1 1 180px;min-width:160px"><div style="font-size:11px;letter-spacing:.4px;color:var(--text-faint);font-weight:700">' + esc(l).toUpperCase() + '</div><div style="font-size:18px;font-weight:700;margin:4px 0 0">' + v + '</div></div>'; }
  function statesWith(doc, yi, m) {
    var out = {}; Object.keys(doc.counties).forEach(function (f) { if (f.slice(2) === '998') return; if (cell(doc, f, m, yi) !== null) out[FIPS[f.slice(0, 2)]] = 1; });
    return Object.keys(out);
  }
  function render(host, ctx) {
    var t = T[lang()] || T.es, slug = SLUG[ctx.crop], tok = ++TOK;
    if (!host) return;
    if (SEL.crop !== ctx.crop) { SEL.crop = ctx.crop; SEL.state = null; if (ctx.year) SEL.year = ctx.year; }
    if (!slug) { host.innerHTML = ''; return; }
    host.innerHTML = '<h2 style="font-size:20px;margin:30px 0 4px">' + esc(t.h) + '</h2><p class="di-info-api-notice" style="margin:8px 0 14px">' + esc(t.sub) + '</p><div id="rd-cty-ctl"></div><div id="rd-cty-body"><p class="di-movers-hint">' + esc(t.loading) + '</p></div>';
    var go = function () { if (tok !== TOK) return; load(slug).then(function (doc) {
      if (tok !== TOK) return;
      if (!doc) { host.innerHTML = '<h2 style="font-size:20px;margin:30px 0 4px">' + esc(t.h) + '</h2><p class="di-movers-hint">' + esc(t.noCrop) + '</p>'; return; }
      var ys = doc.years.slice().reverse().filter(function (y) { return statesWith(doc, doc.years.indexOf(y), 'yield').length; }).map(String);
      if (!ys.length) { host.innerHTML = '<h2 style="font-size:20px;margin:30px 0 4px">' + esc(t.h) + '</h2><p class="di-movers-hint">' + esc(t.noCrop) + '</p>'; return; }
      if (ys.indexOf(String(SEL.year)) < 0) SEL.year = ys[0];
      if (ctx.metric === 'yield' || ctx.metric === 'harvested' || ctx.metric === 'production') { if (SEL.lastCtxMetric !== ctx.metric) { SEL.metric = ctx.metric; SEL.lastCtxMetric = ctx.metric; } }
      var yi = doc.years.indexOf(Number(SEL.year)), sts = statesWith(doc, yi, SEL.metric);
      if (!sts.length) { var alt = ys.filter(function (y) { return statesWith(doc, doc.years.indexOf(Number(y)), SEL.metric).length; })[0]; if (alt) { SEL.year = alt; yi = doc.years.indexOf(Number(alt)); sts = statesWith(doc, yi, SEL.metric); } }
      var ST = ctx.ST || {}; sts.sort(function (a, b) { return (ST[a] || a).localeCompare(ST[b] || b); });
      if (ctx.state && ctx.state !== SEL.lastCtxState) { SEL.lastCtxState = ctx.state; if (sts.indexOf(ctx.state) >= 0) SEL.state = ctx.state; }
      if (sts.indexOf(SEL.state) < 0) { var pref = ctx.state && sts.indexOf(ctx.state) >= 0 ? ctx.state : null, best = null, bv = -1; if (!pref) sts.forEach(function (s) { var v = stateTotal(doc, CODE[s], 'production', yi); if (v !== null && v > bv) { bv = v; best = s; } }); SEL.state = pref || best || sts[0]; }
      var o = function (a, cur, lab) { return a.map(function (k) { return '<option value="' + esc(k) + '"' + (k === cur ? ' selected' : '') + '>' + esc(lab ? lab(k) : k) + '</option>'; }).join(''); };
      document.getElementById('rd-cty-ctl').innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap"><label style="font-size:13px">' + esc(t.state) + '<br><select id="rd-cty-st" class="di-compare-select">' + o(sts, SEL.state, function (k) { return ST[k] || k; }) + '</select></label>' +
        '<label style="font-size:13px">' + esc(t.metric) + '<br><select id="rd-cty-m" class="di-compare-select">' + o(['yield', 'harvested', 'production'], SEL.metric, function (k) { return t[k]; }) + '</select></label>' +
        '<label style="font-size:13px">' + esc(t.year) + '<br><select id="rd-cty-y" class="di-compare-select">' + o(ys, String(SEL.year)) + '</select></label></div>';
      var again = function () { render(host, ctx); };
      document.getElementById('rd-cty-st').onchange = function (e) { SEL.state = e.target.value; again(); };
      document.getElementById('rd-cty-m').onchange = function (e) { SEL.metric = e.target.value; again(); };
      document.getElementById('rd-cty-y').onchange = function (e) { SEL.year = e.target.value; again(); };
      geo(CODE[SEL.state] ? SEL.state : '').then(function (g) { if (tok !== TOK) return; paint(host, ctx, doc, g, tok); var n = document.createElement('p'); n.className = 'di-movers-hint'; n.style.margin = '14px 0 0'; n.textContent = t.note; var b = document.getElementById('rd-cty-body'); if (b) b.appendChild(n); });
    }); };
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0] && es[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '600px' }); io.observe(host); } else go();
  }
  window.RDCounty = { render: render, supports: function (crop) { return !!SLUG[crop]; } };
})();
