/* Dehesa Index — Rendimientos y superficie por estado de EE. UU. (USDA NASS Quick Stats, encuestas Crop Production y Acreage). */
(function () {
  'use strict';
  var D = null, SEL = { crop: 'CORN, GRAIN', metric: 'yield', year: null, state: null };
  var C1 = '#1d5178', C2 = '#b8a98a', SEQ = ['#eef2f5', '#c6d5e0', '#8fb0c8', '#4f82a6', '#1d5178'];
  var LI = { es: 0, en: 1, fr: 2, it: 3 }, P = 0;
  var ST = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  var CROPS = {
    'CORN, GRAIN': ['Maíz (grano)', 'Corn (grain)', 'Maïs (grain)', 'Mais (granella)'], SOYBEANS: ['Soja', 'Soybeans', 'Soja', 'Soia'], WHEAT: ['Trigo (todos)', 'Wheat (all)', 'Blé (tous)', 'Grano (tutti)'], 'WHEAT, WINTER': ['Trigo de invierno', 'Winter wheat', 'Blé d’hiver', 'Grano invernale'], 'WHEAT, SPRING, (EXCL DURUM)': ['Trigo de primavera (sin duro)', 'Spring wheat (excl. durum)', 'Blé de printemps (hors dur)', 'Grano primaverile (escl. duro)'], 'WHEAT, SPRING, DURUM': ['Trigo duro (durum)', 'Durum wheat', 'Blé dur', 'Grano duro'], COTTON: ['Algodón (todo)', 'Cotton (all)', 'Coton (tout)', 'Cotone (tutto)'], 'COTTON, UPLAND': ['Algodón upland', 'Upland cotton', 'Coton upland', 'Cotone upland'], 'COTTON, PIMA': ['Algodón Pima', 'Pima cotton', 'Coton Pima', 'Cotone Pima'], 'SORGHUM, GRAIN': ['Sorgo (grano)', 'Sorghum (grain)', 'Sorgho (grain)', 'Sorgo (granella)'], BARLEY: ['Cebada', 'Barley', 'Orge', 'Orzo'], OATS: ['Avena', 'Oats', 'Avoine', 'Avena'], RICE: ['Arroz (todo)', 'Rice (all)', 'Riz (tout)', 'Riso (tutto)'], 'RICE, LONG GRAIN': ['Arroz grano largo', 'Long-grain rice', 'Riz long', 'Riso a grana lunga'], 'RICE, MEDIUM GRAIN': ['Arroz grano medio', 'Medium-grain rice', 'Riz rond moyen', 'Riso a grana media'], PEANUTS: ['Cacahuete', 'Peanuts', 'Arachide', 'Arachidi'], HAY: ['Heno (todo)', 'Hay (all)', 'Foin (tout)', 'Fieno (tutto)'], 'HAY, ALFALFA': ['Alfalfa (heno)', 'Alfalfa hay', 'Luzerne (foin)', 'Erba medica (fieno)'], 'HAY, (EXCL ALFALFA)': ['Heno sin alfalfa', 'Hay excl. alfalfa', 'Foin hors luzerne', 'Fieno escl. erba medica']
  };
  var MET = { yield: /^(.+?) - YIELD, MEASURED/, production: /^(.+?) - PRODUCTION, MEASURED IN (?!\$)/, harvested: /^(.+?) - (?:ACRES|AREA) HARVESTED/, planted: /^(.+?) - ACRES PLANTED/ };
  var T = {
    es: { title: 'Rendimientos y superficie por estado de EE. UU.', sub: 'Rendimiento por acre, superficie sembrada y cosechada y producción de los principales cultivos por estado. Datos de USDA NASS (Crop Production y Acreage) tal como los publica Quick Stats.',
      crop: 'Cultivo', metric: 'Cifra', year: 'Campaña', yield: 'Rendimiento', production: 'Producción', harvested: 'Superficie cosechada', planted: 'Superficie sembrada', us: 'EE. UU.', vsPrev: 'frente al año anterior', hist: 'Evolución nacional', states: 'Por estado', state: 'Estado', value: 'Valor', chg: 'Var. anual', noData: 'Sin datos.', pick: 'Pulsa un estado para ver su evolución.',
      fc: 'previsión NASS', ac: 'acres', acre: 'acre', bu: 'bu', note: 'Fuente: USDA NASS, Quick Stats (datos públicos). Unidades originales de NASS: acre = 0,4047 ha; bushel (bu) de maíz = 25,4 kg, de soja y trigo = 27,2 kg. El último año puede ser una estimación o previsión de NASS mientras la campaña no esté cerrada. Solo se muestran estados con dato publicado. Este producto usa la API de NASS pero no está respaldado ni certificado por NASS.', src: 'Fuente: USDA NASS (datos públicos)' },
    en: { title: 'U.S. yields and acreage by state', sub: 'Yield per acre, planted and harvested area and production of the main crops by state. USDA NASS data (Crop Production and Acreage) as published in Quick Stats.',
      crop: 'Crop', metric: 'Measure', year: 'Crop year', yield: 'Yield', production: 'Production', harvested: 'Harvested area', planted: 'Planted area', us: 'U.S.', vsPrev: 'vs. previous year', hist: 'National trend', states: 'By state', state: 'State', value: 'Value', chg: 'YoY chg.', noData: 'No data.', pick: 'Click a state to see its trend.',
      fc: 'NASS forecast', ac: 'acres', acre: 'acre', bu: 'bu', note: 'Source: USDA NASS, Quick Stats (public data). Original NASS units: 1 acre = 0.4047 ha; 1 bushel (bu) of corn = 25.4 kg, of soybeans and wheat = 27.2 kg. The latest year may be a NASS estimate or forecast until the crop year closes. Only states with a published figure are shown. This product uses the NASS API but is not endorsed or certified by NASS.', src: 'Source: USDA NASS (public data)' },
    fr: { title: 'Rendements et surfaces par État américain', sub: 'Rendement par acre, surfaces semées et récoltées et production des principales cultures par État. Données de l’USDA NASS (Crop Production et Acreage) telles que publiées dans Quick Stats.',
      crop: 'Culture', metric: 'Chiffre', year: 'Campagne', yield: 'Rendement', production: 'Production', harvested: 'Surface récoltée', planted: 'Surface semée', us: 'États-Unis', vsPrev: 'par rapport à l’an dernier', hist: 'Évolution nationale', states: 'Par État', state: 'État', value: 'Valeur', chg: 'Var. annuelle', noData: 'Pas de données.', pick: 'Cliquez sur un État pour voir son évolution.',
      fc: 'prévision NASS', ac: 'acres', acre: 'acre', bu: 'bu', note: 'Source : USDA NASS, Quick Stats (données publiques). Unités d’origine : 1 acre = 0,4047 ha ; 1 bushel (bu) de maïs = 25,4 kg, de soja et de blé = 27,2 kg. La dernière année peut être une estimation ou prévision de NASS tant que la campagne n’est pas close. Seuls les États avec un chiffre publié sont affichés. Ce produit utilise l’API de NASS mais n’est ni approuvé ni certifié par NASS.', src: 'Source : USDA NASS (données publiques)' },
    it: { title: 'Rese e superfici per Stato USA', sub: 'Resa per acro, superficie seminata e raccolta e produzione delle principali colture per Stato. Dati USDA NASS (Crop Production e Acreage) come pubblicati in Quick Stats.',
      crop: 'Coltura', metric: 'Dato', year: 'Campagna', yield: 'Resa', production: 'Produzione', harvested: 'Superficie raccolta', planted: 'Superficie seminata', us: 'USA', vsPrev: 'rispetto all’anno scorso', hist: 'Andamento nazionale', states: 'Per Stato', state: 'Stato', value: 'Valore', chg: 'Var. annua', noData: 'Nessun dato.', pick: 'Clicca su uno Stato per vederne l’andamento.',
      fc: 'previsione NASS', ac: 'acri', acre: 'acro', bu: 'bu', note: 'Fonte: USDA NASS, Quick Stats (dati pubblici). Unità originali: 1 acro = 0,4047 ha; 1 bushel (bu) di mais = 25,4 kg, di soia e grano = 27,2 kg. L’ultimo anno può essere una stima o previsione NASS finché la campagna non è chiusa. Sono mostrati solo gli Stati con dato pubblicato. Questo prodotto usa l’API di NASS ma non è approvato né certificato da NASS.', src: 'Fonte: USDA NASS (dati pubblici)' }
  };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tr() { P = LI[lang()] || 0; return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function seriesFor(crop, metric) {
    var re = MET[metric], first = crop.split(',')[0], found = null;
    Object.keys(D.series).forEach(function (k) { var m = k.match(re); if (m && (m[1] === crop || (metric === 'planted' && m[1] === first && !found && (crop === 'CORN, GRAIN' || crop === 'SORGHUM, GRAIN')))) found = k; });
    return found;
  }
  function fmt(u, v) {
    if (u === 'ACRES') return v >= 1e6 ? nf(v / 1e6, 2) + ' M ac' : nf(v / 1e3, 0) + ' k ac';
    if (u === 'BU') return v >= 1e6 ? nf(v / 1e6, 0) + ' M bu' : nf(v / 1e3, 0) + ' k bu';
    if (u === 'CWT') return nf(v / 1e6, 1) + ' M cwt';
    if (u === 'TONS') return v >= 1e6 ? nf(v / 1e6, 1) + ' M t (short)' : nf(v / 1e3, 0) + ' k t (short)';
    if (u === 'LB') return nf(v / 1e6, 0) + ' M lb';
    if (u === '480 LB BALES') return v >= 1e6 ? nf(v / 1e6, 2) + ' M ' : nf(v / 1e3, 0) + ' k ';
    if (u === 'BU / ACRE') return nf(v, 1) + ' bu/ac';
    if (u === 'LB / ACRE') return nf(v, 0) + ' lb/ac';
    if (u === 'TONS / ACRE') return nf(v, 2) + ' t/ac';
    return nf(v, 1);
  }
  function unitLabel(u) { return u === '480 LB BALES' ? (lang() === 'es' ? 'pacas de 480 lb' : lang() === 'fr' ? 'balles de 480 lb' : lang() === 'it' ? 'balle da 480 lb' : '480-lb bales') : u.toLowerCase(); }
  function pct(a, b) { return b ? (a / b - 1) * 100 : null; }
  function chg(p) { if (p === null) return '<span style="color:var(--text-faint)">—</span>'; var c = p > 0.05 ? '#2f7d4f' : p < -0.05 ? '#a9491f' : 'var(--text-faint)'; return '<span style="color:' + c + ';font-weight:600">' + (p > 0.05 ? '+' : p < -0.05 ? '−' : '') + nf(Math.abs(p), 1) + ' %</span>'; }
  function val(arr, y) { for (var i = 0; i < arr.length; i++) if (arr[i][0] === y) return arr[i][1]; return null; }
  var AXX = { es: 'Campaña', en: 'Crop year', fr: 'Campagne', it: 'Campagna' };
  function axTitle(y, x, yx) { return '<text transform="translate(12 ' + yx + ') rotate(-90)" font-size="11" font-weight="600" text-anchor="middle" fill="var(--text-faint)">' + esc(y) + '</text><text x="' + x[0] + '" y="' + x[1] + '" font-size="11" font-weight="600" text-anchor="middle" fill="var(--text-faint)">' + esc(x[2]) + '</text>'; }
  function lineChart(a, b, u, labels, names) {
    var W = 720, H = 244, L = 80, R = 12, Tp = 12, Bt = 48, n = labels.length, max = -Infinity, min = Infinity;
    a.concat(b || []).forEach(function (v) { if (v !== null) { if (v > max) max = v; if (v < min) min = v; } });
    if (n < 2 || !isFinite(max)) return '';
    var lo = Math.max(0, min - (max - min) * 0.2), hi = max + (max - min) * 0.1 || max * 1.1;
    var x = function (i) { return L + (W - L - R) * i / (n - 1); }, y = function (v) { return Tp + (H - Tp - Bt) * (1 - (v - lo) / (hi - lo)); };
    var g = ''; for (var k = 0; k <= 4; k++) { var vv = lo + (hi - lo) * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(vv) + '" y2="' + y(vv) + '" stroke="var(--border)"/><text x="' + (L - 6) + '" y="' + (y(vv) + 4) + '" font-size="11" text-anchor="end" fill="var(--text-faint)">' + esc(fmt(u, vv)) + '</text>'; }
    var path = function (arr, col) { var d = '', pen = false; arr.forEach(function (v, i) { if (v === null) { pen = false; return; } d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; pen = true; }); return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round"/>' + arr.map(function (v, i) { return v === null ? '' : '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3" fill="' + col + '"><title>' + esc(labels[i] + ': ' + fmt(u, v)) + '</title></circle>'; }).join(''); };
    var xl = [0, Math.floor((n - 1) / 2), n - 1].map(function (i) { return '<text x="' + x(i) + '" y="' + (H - Bt + 17) + '" font-size="11" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" fill="var(--text-faint)">' + esc(labels[i]) + '</text>'; }).join('') + axTitle(unitLabel(u), [(L + W - R) / 2, H - 5, AXX[lang()] || AXX.es], (Tp + H - Bt) / 2);
    var hv = function (arr, col, nm) { var pp = []; arr.forEach(function (v, i) { if (v !== null) pp.push([+x(i).toFixed(1), +y(v).toFixed(1), fmt(u, v), labels[i]]); }); return { n: nm, c: col, p: pp }; };
    var spec = { L: L, R: W - R, T: Tp, B: H - Bt, s: (b ? [hv(b, C2, names[1]), hv(a, C1, names[0])] : [hv(a, C1, names[0])]) };
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;touch-action:pan-y" role="img"' + window.DehesaChart.attr(spec).replace(' style="touch-action:pan-y"', '') + '>' + g + (b ? path(b, C2) : '') + path(a, C1) + xl + '</svg>';
  }
  function card(l, v, sub) { return '<div class="di-card" style="padding:14px 16px;flex:1 1 200px;min-width:180px"><div style="font-size:11px;letter-spacing:.4px;color:var(--text-faint);font-weight:700">' + esc(l).toUpperCase() + '</div><div style="font-size:24px;font-weight:700;margin:4px 0 2px;font-family:\'Source Serif 4\',serif">' + v + '</div><div style="font-size:12.5px">' + sub + '</div></div>'; }
  function render() {
    var t = tr(), root = document.getElementById('rd-body');
    document.title = 'Dehesa Index — ' + t.title; document.getElementById('pg-h1').textContent = t.title; document.getElementById('pg-sub').textContent = t.sub;
    if (!D) { root.innerHTML = '<p class="di-movers-hint">' + esc(t.noData) + '</p>'; return; }
    var crops = Object.keys(CROPS).filter(function (c) { return seriesFor(c, 'yield') || seriesFor(c, 'production'); });
    if (crops.indexOf(SEL.crop) < 0) SEL.crop = crops[0];
    var mets = ['yield', 'production', 'harvested', 'planted'].filter(function (m) { return seriesFor(SEL.crop, m); });
    if (mets.indexOf(SEL.metric) < 0) SEL.metric = mets[0];
    var key = seriesFor(SEL.crop, SEL.metric), s = D.series[key], u = s.u;
    var years = s.n.map(function (x) { return x[0]; }).sort().reverse();
    if (years.indexOf(SEL.year) < 0) SEL.year = years[0];
    var yp = String(Number(SEL.year) - 1), nv = val(s.n, SEL.year), np = val(s.n, yp), isLast = SEL.year === years[0];
    var stt = {}; Object.keys(s.s).forEach(function (st) { if (!ST[st]) return; var v = val(s.s[st], SEL.year); if (v !== null) stt[st] = { v: v, p: val(s.s[st], yp) }; });
    var rows = Object.keys(stt).map(function (st) { return { st: st, v: stt[st].v, y: stt[st].p === null ? null : pct(stt[st].v, stt[st].p) }; }).sort(function (a, b) { return b.v - a.v; });
    var sorted = rows.map(function (r) { return r.v; }).sort(function (a, b) { return a - b; }), cuts = [1, 2, 3, 4].map(function (q) { return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q / 5))]; });
    var cls = function (v) { var i = 0; while (i < 4 && v >= cuts[i]) i++; return i; };
    var copts = crops.map(function (c) { return '<option value="' + esc(c) + '"' + (c === SEL.crop ? ' selected' : '') + '>' + esc(CROPS[c][P]) + '</option>'; }).join('');
    var mopts = mets.map(function (m) { return '<option value="' + m + '"' + (m === SEL.metric ? ' selected' : '') + '>' + esc(t[m]) + '</option>'; }).join('');
    var yopts = years.map(function (y) { return '<option value="' + y + '"' + (y === SEL.year ? ' selected' : '') + '>' + y + (y === years[0] ? ' *' : '') + '</option>'; }).join('');
    var cards = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0">' + card(t.us + ' · ' + SEL.year + (isLast ? ' *' : ''), nv === null ? '—' : esc(fmt(u, nv)), '<span style="color:var(--text-faint)">' + esc(unitLabel(u)) + '</span>') + card(t.vsPrev, nv !== null && np !== null ? chg(pct(nv, np)) : '—', np !== null ? '<span style="color:var(--text-faint)">' + esc(yp + ': ' + fmt(u, np)) + '</span>' : '') + '</div>';
    var chartYears = s.n.map(function (x) { return x[0]; }), natVals = s.n.map(function (x) { return x[1]; });
    var stSel = SEL.state && s.s[SEL.state] ? SEL.state : null;
    var stVals = stSel ? chartYears.map(function (y) { return val(s.s[stSel], y); }) : null;
    var chart = '<div class="di-card" style="padding:14px 16px"><div style="font-weight:600;margin-bottom:6px">' + esc(CROPS[SEL.crop][P]) + ' · ' + esc(t[SEL.metric]) + ' · ' + esc(stSel ? ST[stSel] : t.us) + '</div>' + lineChart(stSel ? stVals : natVals, stSel ? natVals : null, u, chartYears, [stSel ? ST[stSel] : t.us, t.us]) + (stSel ? '<div style="font-size:12px;color:var(--text-faint)"><span style="display:inline-block;width:14px;height:3px;background:' + C1 + ';vertical-align:middle;margin-right:6px"></span>' + esc(ST[stSel]) + ' <span style="display:inline-block;width:14px;height:3px;background:' + C2 + ';vertical-align:middle;margin:0 6px 0 14px"></span>' + esc(t.us) + '</div>' : '') + '</div>';
    var svg = window.DEHESA_US_STATES ? '<svg viewBox="' + window.DEHESA_US_STATES.viewBox + '" style="width:100%;height:auto;display:block" role="img">' + window.DEHESA_US_STATES.states.map(function (s2) { var r = stt[s2.id]; return '<path data-st="' + s2.id + '" d="' + s2.d + '" fill="' + (r ? SEQ[cls(r.v)] : '#e6e2d6') + '" stroke="' + (s2.id === stSel ? '#a9491f' : '#fff') + '" stroke-width="' + (s2.id === stSel ? 2 : 0.8) + '" stroke-linejoin="round" style="cursor:pointer"></path>'; }).join('') + '</svg>' : '';
    var lg = rows.length >= 5 ? SEQ.map(function (c, i) { return '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:3px;background:' + c + ';display:inline-block;border:1px solid rgba(0,0,0,.15)"></span>' + esc(i === 0 ? '< ' + fmt(u, cuts[0]) : i === 4 ? '≥ ' + fmt(u, cuts[3]) : fmt(u, cuts[i - 1]) + ' – ' + fmt(u, cuts[i])) + '</span>'; }).join('') : '';
    var th = function (x, r) { return '<th style="padding:10px 6px;font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:' + (r ? 'right' : 'left') + '">' + esc(x).toUpperCase() + '</th>'; };
    var tbl = rows.length ? '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:14px"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:14px"><tr>' + th(t.state) + '<th></th>' + th(t.value, 1) + th(t.chg, 1) + '</tr>' + rows.map(function (r) { return '<tr data-row="' + r.st + '" style="border-top:1px solid var(--border);cursor:pointer' + (r.st === stSel ? ';background:rgba(29,81,120,.06)' : '') + '"><td style="padding:9px 6px;font-weight:600;white-space:nowrap">' + esc(ST[r.st]) + '</td><td style="padding:9px 6px;width:30%"><div style="height:8px;border-radius:2px 4px 4px 2px;background:' + SEQ[3] + ';width:' + (r.v / rows[0].v * 100).toFixed(1) + '%"></div></td><td style="padding:9px 6px;text-align:right;white-space:nowrap">' + esc(fmt(u, r.v)) + '</td><td style="padding:9px 6px;text-align:right">' + chg(r.y) + '</td></tr>'; }).join('') + '</table></div>' : '';
    root.innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap"><label style="font-size:13px">' + esc(t.crop) + '<br><select id="rd-crop" class="di-compare-select">' + copts + '</select></label><label style="font-size:13px">' + esc(t.metric) + '<br><select id="rd-met" class="di-compare-select">' + mopts + '</select></label><label style="font-size:13px">' + esc(t.year) + '<br><select id="rd-year" class="di-compare-select">' + yopts + '</select></label></div>' + cards + chart +
      (rows.length ? '<div style="font-weight:600;margin:18px 0 6px">' + esc(t.states) + ' · ' + esc(SEL.year) + '</div><div class="di-card" style="padding:8px;position:relative"><div id="rd-map">' + svg + '</div><div id="rd-tip" style="display:none;position:absolute;pointer-events:none;background:var(--surface,#fff);border:1px solid var(--border);border-radius:6px;padding:6px 9px;font-size:12.5px;box-shadow:0 2px 8px rgba(0,0,0,.12);white-space:nowrap"></div></div><div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;margin:8px 0">' + lg + '</div><p class="di-movers-hint">' + esc(t.pick) + '</p>' + tbl : '') +
      '<p class="di-info-api-notice" style="margin:14px 0 6px">* ' + esc(t.fc) + '. ' + esc(t.note) + '</p><p class="di-movers-hint">' + esc(t.src) + '</p>';
    document.getElementById('rd-crop').onchange = function (e) { SEL.crop = e.target.value; SEL.state = null; SEL.year = null; render(); };
    document.getElementById('rd-met').onchange = function (e) { SEL.metric = e.target.value; render(); };
    document.getElementById('rd-year').onchange = function (e) { SEL.year = e.target.value; render(); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-row]'), function (r) { r.onclick = function () { SEL.state = r.getAttribute('data-row'); render(); }; });
    var box = document.getElementById('rd-map'), tip = document.getElementById('rd-tip');
    if (box) { var wrap = tip.parentNode; Array.prototype.forEach.call(box.querySelectorAll('path'), function (p) { var code = p.getAttribute('data-st'), r = stt[code];
      p.addEventListener('mousemove', function (e) { var b = wrap.getBoundingClientRect(); tip.innerHTML = '<strong>' + esc(ST[code] || code) + '</strong><br>' + (r ? esc(fmt(u, r.v)) : esc(t.noData)); tip.style.display = 'block'; tip.style.left = Math.min(e.clientX - b.left + 12, b.width - 170) + 'px'; tip.style.top = (e.clientY - b.top + 12) + 'px'; });
      p.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      p.addEventListener('click', function () { if (r) { SEL.state = code; render(); } }); }); }
  }
  window.DehesaShared.init('informacion');
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  fetch('data/nass-crops.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) {
    D = d && d.series && Object.keys(d.series).length ? d : null;
    var q = new URLSearchParams(window.location.search);
    if (q.get('crop') && CROPS[q.get('crop')]) SEL.crop = q.get('crop');
    if (q.get('metric') && MET[q.get('metric')]) SEL.metric = q.get('metric');
    render();
  });
})();
