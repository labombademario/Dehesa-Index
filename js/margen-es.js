/* Dehesa Index — Referencia de España para la calculadora de margen: rendimiento de tu provincia (MAPA), costes de referencia por hectárea (RECAN, MAPA)
   y la PAC estimada que calculaste en pac.html, siempre como línea aparte del margen de mercado. ES5, sin librerías.
   Reglas: no se rellena nada sin que la persona pulse el botón; cada cifra dice su fuente y su año; los costes por ha son la cifra publicada por explotación dividida
   entre la SAU media publicada (cuenta nuestra, dicho en pantalla); el rendimiento es el provincial, sin separar secano y regadío porque el MAPA no lo hace en esa tabla;
   la PAC solo se suma si las hectáreas coinciden con las de la página PAC. Se carga solo cuando el cultivo tiene referencia o ya hay una estimación PAC guardada. */
(function () {
  'use strict';
  var SC = 'data/spain-crops/', LSK = 'di-margen-es-v1', PACK = 'di-pac-est-v1';
  var LANGS = ['es', 'en', 'fr', 'it'];
  // cultivo de la calculadora -> código MAPA (grupo y cultivo) y tipo de explotación RECAN
  var MAP = { trigo: { g: 'cereales', c: 'CE1100', r: 'cer' }, cebada: { g: 'cereales', c: 'CE1300', r: 'cer' }, avena: { g: 'cereales', c: 'CE1410', r: 'cer' }, maiz: { g: 'cereales', c: 'CE1500', r: 'cer' }, arroz: { g: 'cereales', c: 'CE2000', r: 'arroz' }, soja: { g: 'industriales', c: 'IN1300', r: 'cer' }, colza: { g: 'industriales', c: 'IN1100', r: 'cer' } };
  // provincia INE -> comunidad tal como la nombra RECAN
  var CCAA = { '01': 'País Vasco', '02': 'Castilla-La Mancha', '03': 'Comunidad Valenciana', '04': 'Andalucía', '05': 'Castilla y León', '06': 'Extremadura', '07': 'Islas Baleares', '08': 'Cataluña', '09': 'Castilla y León', '10': 'Extremadura', '11': 'Andalucía', '12': 'Comunidad Valenciana', '13': 'Castilla-La Mancha', '14': 'Andalucía', '15': 'Galicia', '16': 'Castilla-La Mancha', '17': 'Cataluña', '18': 'Andalucía', '19': 'Castilla-La Mancha', '20': 'País Vasco', '21': 'Andalucía', '22': 'Aragón', '23': 'Andalucía', '24': 'Castilla y León', '25': 'Cataluña', '26': 'La Rioja', '27': 'Galicia', '28': 'Comunidad de Madrid', '29': 'Andalucía', '30': 'Región de Murcia', '31': 'Comunidad Foral de Navarra', '32': 'Galicia', '33': 'Principado de Asturias', '34': 'Castilla y León', '35': 'Canarias', '36': 'Galicia', '37': 'Castilla y León', '38': 'Canarias', '39': 'Cantabria', '40': 'Castilla y León', '41': 'Andalucía', '42': 'Castilla y León', '43': 'Cataluña', '44': 'Aragón', '45': 'Castilla-La Mancha', '46': 'Comunidad Valenciana', '47': 'Castilla y León', '48': 'País Vasco', '49': 'Castilla y León', '50': 'Aragón' };
  var T = {
    es: { h: 'Referencia para España', hint: 'Datos públicos de tu provincia y de explotaciones como la tuya. No se rellena nada hasta que pulses un botón.', prov: 'Provincia', choose: 'Elige…',
      yH: 'Rendimiento de tu provincia', yTxt: 'MAPA, campaña {camp} (provisional): {y} t/ha ({p} t sobre {a} ha cosechadas). Media nacional: {n} t/ha. Es la media de toda la provincia, con secano y regadío juntos: el MAPA no los separa en esta tabla.', yUse: 'Usar este rendimiento', yNone: 'El MAPA no publica este cultivo en {prov} en la campaña {camp}.',
      cH: 'Costes de referencia por hectárea (RECAN)', cTxt: 'Explotaciones de «{type}» en {ccaa}, ejercicio {y}. Cada cifra es la publicada por el MAPA por explotación dividida entre la SAU media (cuenta nuestra). Son medias de toda la explotación, no solo de este cultivo.', size: 'Dimensión económica', cLoad: 'Cargar costes de referencia', cLoaded: 'Cargados: energía, maquinaria, mano de obra, alquiler y otros. Revísalos.',
      cSpec: 'Costes específicos de cultivos (semilla, abonos y fitosanitarios): {v} € por ha de media. RECAN no los desglosa: repártelos tú en Fertilizantes, Semilla y Fitosanitarios.', cNote: 'Mano de obra = salarios y cargas sociales (no incluye el trabajo familiar). Maquinaria = mantenimiento, trabajos de terceros y amortizaciones. Otros = otros costes generales e intereses.', cNone: 'RECAN no publica este tipo de explotación en {ccaa} (celdas confidenciales o muestra insuficiente).',
      thSize: 'Dimensión', thN: 'Muestra', thProd: 'Producción vegetal', thCost: 'Costes totales', thSub: 'Subvenciones', thNet: 'Renta neta', unitHa: '€/ha', small: 'muestra pequeña', fixed: 'Los tramos de dimensión son los de RECAN; no se promedian entre sí.',
      pH: 'PAC estimada (estimación, aparte del margen de mercado)', pTxt: 'De tu cálculo en la página PAC (campaña {y}, {h} ha): {mid} € (rango {lo}–{hi} €). No son los importes del FEGA: son los del real decreto.', pSum: 'Margen de mercado + PAC estimada', pDiff: 'Tu cálculo PAC es para {h} ha y esta calculadora usa {a} ha: no se suman. Recalcula en la página PAC con las mismas hectáreas.', pNone: 'Calcula tu PAC estimada', pCur: 'La PAC está en euros: pasa el caso a EUR para sumarla.', pUnit: '€', src: 'Fuente' },
    en: { h: 'Spain reference', hint: 'Public data for your province and for farms like yours. Nothing is filled in until you press a button.', prov: 'Province', choose: 'Choose…',
      yH: 'Your province’s yield', yTxt: 'MAPA, {camp} campaign (provisional): {y} t/ha ({p} t over {a} ha harvested). National average: {n} t/ha. This is the average of the whole province, rainfed and irrigated together: MAPA does not separate them in this table.', yUse: 'Use this yield', yNone: 'MAPA does not publish this crop in {prov} for the {camp} campaign.',
      cH: 'Reference costs per hectare (RECAN)', cTxt: '“{type}” farms in {ccaa}, year {y}. Each figure is the per-farm number published by MAPA divided by the average utilised area (our calculation). They are averages of the whole farm, not only this crop.', size: 'Economic size', cLoad: 'Load reference costs', cLoaded: 'Loaded: energy, machinery, labour, rent and other. Please review them.',
      cSpec: 'Crop-specific costs (seed, fertiliser and crop protection): € {v} per ha on average. RECAN does not break them down: split them yourself into Fertiliser, Seed and Crop protection.', cNote: 'Labour = wages and social charges (unpaid family labour is not included). Machinery = maintenance, contractor work and depreciation. Other = other overheads and interest.', cNone: 'RECAN does not publish this farm type in {ccaa} (confidential cells or too small a sample).',
      thSize: 'Size', thN: 'Sample', thProd: 'Crop output', thCost: 'Total costs', thSub: 'Subsidies', thNet: 'Net income', unitHa: '€/ha', small: 'small sample', fixed: 'Size classes are RECAN’s own; they are not averaged together.',
      pH: 'Estimated CAP payments (an estimate, separate from the market margin)', pTxt: 'From your calculation on the CAP page ({y} campaign, {h} ha): € {mid} (range € {lo}–{hi}). These are not FEGA’s payment rates: they are those in the royal decree.', pSum: 'Market margin + estimated CAP', pDiff: 'Your CAP calculation is for {h} ha and this calculator uses {a} ha: they are not added. Recalculate on the CAP page with the same hectares.', pNone: 'Calculate your estimated CAP', pCur: 'CAP is in euros: switch the case to EUR to add it.', pUnit: '€', src: 'Source' },
    fr: { h: 'Référence pour l’Espagne', hint: 'Données publiques de votre province et d’exploitations comme la vôtre. Rien n’est rempli tant que vous n’appuyez pas sur un bouton.', prov: 'Province', choose: 'Choisir…',
      yH: 'Rendement de votre province', yTxt: 'MAPA, campagne {camp} (provisoire) : {y} t/ha ({p} t sur {a} ha récoltés). Moyenne nationale : {n} t/ha. C’est la moyenne de toute la province, sec et irrigué confondus : le MAPA ne les sépare pas dans ce tableau.', yUse: 'Utiliser ce rendement', yNone: 'Le MAPA ne publie pas cette culture en {prov} pour la campagne {camp}.',
      cH: 'Coûts de référence par hectare (RECAN)', cTxt: 'Exploitations « {type} » en {ccaa}, exercice {y}. Chaque chiffre est celui publié par le MAPA par exploitation divisé par la SAU moyenne (calcul de notre part). Ce sont des moyennes de toute l’exploitation, pas seulement de cette culture.', size: 'Dimension économique', cLoad: 'Charger les coûts de référence', cLoaded: 'Chargés : énergie, machines, main-d’œuvre, fermage et autres. Vérifiez-les.',
      cSpec: 'Coûts spécifiques des cultures (semences, engrais et phytosanitaires) : {v} € par ha en moyenne. RECAN ne les détaille pas : répartissez-les vous-même entre Engrais, Semences et Phytosanitaires.', cNote: 'Main-d’œuvre = salaires et charges sociales (hors travail familial). Machines = entretien, travaux par des tiers et amortissements. Autres = autres frais généraux et intérêts.', cNone: 'RECAN ne publie pas ce type d’exploitation en {ccaa} (cellules confidentielles ou échantillon insuffisant).',
      thSize: 'Dimension', thN: 'Échantillon', thProd: 'Production végétale', thCost: 'Coûts totaux', thSub: 'Subventions', thNet: 'Revenu net', unitHa: '€/ha', small: 'petit échantillon', fixed: 'Les tranches de dimension sont celles de RECAN ; elles ne sont pas moyennées entre elles.',
      pH: 'PAC estimée (estimation, à part de la marge de marché)', pTxt: 'D’après votre calcul sur la page PAC (campagne {y}, {h} ha) : {mid} € (fourchette {lo}–{hi} €). Ce ne sont pas les montants du FEGA : ce sont ceux du décret royal.', pSum: 'Marge de marché + PAC estimée', pDiff: 'Votre calcul PAC porte sur {h} ha et ce calculateur utilise {a} ha : ils ne sont pas additionnés. Recalculez sur la page PAC avec les mêmes hectares.', pNone: 'Calculer votre PAC estimée', pCur: 'La PAC est en euros : passez le cas en EUR pour l’additionner.', pUnit: '€', src: 'Source' },
    it: { h: 'Riferimento per la Spagna', hint: 'Dati pubblici della tua provincia e di aziende come la tua. Nulla viene compilato finché non premi un pulsante.', prov: 'Provincia', choose: 'Scegli…',
      yH: 'Resa della tua provincia', yTxt: 'MAPA, campagna {camp} (provvisoria): {y} t/ha ({p} t su {a} ha raccolti). Media nazionale: {n} t/ha. È la media di tutta la provincia, asciutto e irriguo insieme: il MAPA non li separa in questa tabella.', yUse: 'Usa questa resa', yNone: 'Il MAPA non pubblica questa coltura in {prov} per la campagna {camp}.',
      cH: 'Costi di riferimento per ettaro (RECAN)', cTxt: 'Aziende «{type}» in {ccaa}, esercizio {y}. Ogni cifra è quella pubblicata dal MAPA per azienda divisa per la SAU media (calcolo nostro). Sono medie di tutta l’azienda, non solo di questa coltura.', size: 'Dimensione economica', cLoad: 'Carica i costi di riferimento', cLoaded: 'Caricati: energia, macchinari, manodopera, affitto e altri. Controllali.',
      cSpec: 'Costi specifici delle colture (sementi, concimi e fitosanitari): {v} € per ha in media. RECAN non li dettaglia: ripartiscili tu tra Fertilizzanti, Sementi e Fitosanitari.', cNote: 'Manodopera = salari e oneri sociali (escluso il lavoro familiare). Macchinari = manutenzione, lavori di terzi e ammortamenti. Altri = altri costi generali e interessi.', cNone: 'RECAN non pubblica questo tipo di azienda in {ccaa} (celle riservate o campione insufficiente).',
      thSize: 'Dimensione', thN: 'Campione', thProd: 'Produzione vegetale', thCost: 'Costi totali', thSub: 'Sussidi', thNet: 'Reddito netto', unitHa: '€/ha', small: 'campione piccolo', fixed: 'Le fasce di dimensione sono quelle di RECAN; non si mediano tra loro.',
      pH: 'PAC stimata (stima, separata dal margine di mercato)', pTxt: 'Dal tuo calcolo nella pagina PAC (campagna {y}, {h} ha): {mid} € (intervallo {lo}–{hi} €). Non sono gli importi del FEGA: sono quelli del regio decreto.', pSum: 'Margine di mercato + PAC stimata', pDiff: 'Il tuo calcolo PAC riguarda {h} ha e questo calcolatore usa {a} ha: non vengono sommati. Ricalcola nella pagina PAC con gli stessi ettari.', pNone: 'Calcola la tua PAC stimata', pCur: 'La PAC è in euro: porta il caso in EUR per sommarla.', pUnit: '€', src: 'Fonte' }
  };
  var RTYPE = { cer: { es: 'Cereales, oleaginosas y leguminosas', en: 'Cereals, oilseeds and pulses', fr: 'Céréales, oléagineux et légumineuses', it: 'Cereali, oleaginose e leguminose' }, arroz: { es: 'Arroz', en: 'Rice', fr: 'Riz', it: 'Riso' } };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tr() { return T[lang()] || T.es; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function sp(p) { return window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath(p) : p; }
  function get(p) { return fetch(sp(p)).then(function (r) { if (!r.ok) throw new Error(p); return r.json(); }); }
  function cite(period) { var Q = window.DICite; if (!Q) return ''; var c = Q.html('mapa_es', { period: String(period || '') }); return c ? '<div class="pp-cites">' + c + '</div>' : ''; }
  var API = null, EL = null, IX = null, GRP = {}, RC = null, ST = { prov: '', size: '' };
  try { var sv = JSON.parse(window.localStorage.getItem(LSK) || 'null'); if (sv && /^\d{2}$/.test(sv.prov || '')) ST.prov = sv.prov; } catch (e) { /* sin almacenamiento */ }
  function save() { try { window.localStorage.setItem(LSK, JSON.stringify({ prov: ST.prov })); } catch (e) { /* idem */ } }
  function can(crop) { return !!MAP[crop]; }
  function loadGroup(g) { if (GRP[g]) return GRP[g]; return GRP[g] = (IX ? Promise.resolve(IX) : get(SC + 'index.json').then(function (i) { IX = i; return i; })).then(function (ix) { return get(SC + ix.groups[g].file); }).catch(function (e) { delete GRP[g]; throw e; }); }
  function loadRecan() { if (RC) return RC; return RC = get('data/recan.json').catch(function (e) { RC = null; throw e; }); }
  function cropOf(g, code) { var camps = Object.keys(g.campaigns).sort(), camp = camps[camps.length - 1], cs = g.campaigns[camp].crops, c = null; for (var i = 0; i < cs.length; i++) if (cs[i].c === code) c = cs[i]; return { camp: camp, crop: c }; }
  function vi(d, code) { for (var i = 0; i < d.vars.length; i++) if (d.vars[i][0] === code) return i; return -1; }
  function recanRows(d, ccaa, kind) {
    var ci = d.ccaa.indexOf(ccaa), ti = -1, i; if (ci < 0) return null;
    for (i = 0; i < d.types.length; i++) { var n = d.types[i][1]; if (kind === 'arroz' ? n === 'Arroz' : /^Cereales \(excepto arroz\)/.test(n)) ti = i; }
    if (ti < 0) return null;
    var ys = d.years.map(function (y, k) { return k; }).reverse();
    for (var k = 0; k < ys.length; k++) {
      var rows = d.rows.filter(function (x) { return x[0] === ys[k] && x[1] === ci && x[2] === ti; });
      if (rows.length) return { year: d.years[ys[k]], rows: rows.sort(function (a, b) { return a[3] - b[3]; }) };
    }
    return null;
  }
  function perHa(d, x, code) { var s = x[6][vi(d, 'SE025')], v = x[6][vi(d, code)]; return s > 0 && v != null ? v / s : null; }
  function sumHa(d, x, codes) { var t = 0; for (var i = 0; i < codes.length; i++) { var v = perHa(d, x, codes[i]); if (v == null) return null; t += v; } return t; }
  function opt(v, l, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(l) + '</option>'; }
  function r2(v) { return Math.round(v * 100) / 100; }

  function draw(el, api) {
    EL = el; API = api; var c = api.C(), m = MAP[c.crop]; if (!m) { el.innerHTML = ''; return; }
    var t = tr(), sel = function (id, label, inner) { return '<label for="' + id + '" style="font-size:13px">' + esc(label) + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; };
    loadGroup(m.g).then(function (g) {
      if (API.C() !== c) return;
      var provs = Object.keys(g.provinces).sort(function (a, b) { return g.provinces[a].localeCompare(g.provinces[b], 'es'); });
      var h = '<fieldset class="cc-fs"><legend>' + esc(t.h) + '</legend><p class="pt-src" style="margin:0 0 8px">' + esc(t.hint) + '</p>' + sel('cc-es-prov', t.prov, opt('', t.choose, ST.prov) + provs.map(function (k) { return opt(k, g.provinces[k], ST.prov); }).join('')) + '<div id="cc-es-body"></div></fieldset>';
      el.innerHTML = h;
      el.querySelector('#cc-es-prov').onchange = function (e) { ST.prov = e.target.value; save(); body(c, g, m); };
      body(c, g, m);
    }, function () { el.innerHTML = ''; });
  }
  function body(c, g, m) {
    var t = tr(), box = document.getElementById('cc-es-body'); if (!box) return; if (!ST.prov) { box.innerHTML = ''; return; }
    var o = cropOf(g, m.c), cr = o.crop, pn = g.provinces[ST.prov], h = '';
    var a = cr && cr.v[ST.prov], y = a && a[3] > 0 && a[4] != null ? a[4] / a[3] : null, yN = cr && cr.t[3] > 0 ? cr.t[4] / cr.t[3] : null;
    h += '<h3 style="font-size:15px;margin:10px 0 4px">' + esc(t.yH) + '</h3>';
    if (y == null) h += '<p class="pt-src">' + esc(fill(t.yNone, { prov: pn, camp: o.camp })) + '</p>';
    else h += '<p class="pt-src" style="margin:0 0 6px">' + esc(fill(t.yTxt, { camp: o.camp, y: nf(y, 2), p: nf(a[4], 0), a: nf(a[3], 0), n: yN != null ? nf(yN, 2) : '–' })) + '</p><div class="pt-bar-ctl"><button type="button" class="pt-chip" data-es-y="' + r2(y) + '">' + esc(t.yUse) + '</button></div>' + cite(o.camp);
    h += '<div id="cc-es-recan"></div>';
    box.innerHTML = h;
    var yb = box.querySelector('[data-es-y]'); if (yb) yb.onclick = function () { var cc = API.C(); cc.yU = 't_ha'; cc.y = yb.getAttribute('data-es-y'); API.save(); API.shell(); };
    loadRecan().then(function (d) { if (API.C() !== c) return; recan(c, d, m, pn); }, function () { /* sin RECAN: el rendimiento sigue disponible */ });
  }
  function recan(c, d, m, pn) {
    var t = tr(), box = document.getElementById('cc-es-recan'); if (!box) return; var ccaa = CCAA[ST.prov], R = recanRows(d, ccaa, m.r), L = lang(), type = (RTYPE[m.r] || {})[L] || RTYPE[m.r].es;
    if (!R) { box.innerHTML = '<p class="pt-src">' + esc(fill(t.cNone, { ccaa: ccaa })) + '</p>'; return; }
    var prod = 'SE136', costs = ['SE270'], sub = ['SE605'], net = ['SE420'];
    var rows = R.rows.map(function (x) { return { x: x, sau: x[6][vi(d, 'SE025')], prod: x[6][vi(d, prod)], cost: sumHa(d, x, costs), sub: sumHa(d, x, sub), net: sumHa(d, x, net) }; });
    var f = function (v) { return v == null ? '–' : nf(v, 0); };
    var h = '<h3 style="font-size:15px;margin:12px 0 4px">' + esc(t.cH) + '</h3><p class="pt-src" style="margin:0 0 6px">' + esc(fill(t.cTxt, { type: type, ccaa: ccaa, y: R.year })) + '</p>';
    h += '<div class="pt-tblwrap"><table class="pt-table" data-no-rows><thead><tr><th scope="col">' + esc(t.thSize) + '</th><th scope="col" class="r">' + esc(t.thN) + '</th><th scope="col" class="r">' + esc(t.thProd) + ' (' + esc(t.unitHa) + ')</th><th scope="col" class="r">' + esc(t.thCost) + ' (' + esc(t.unitHa) + ')</th><th scope="col" class="r">' + esc(t.thSub) + ' (' + esc(t.unitHa) + ')</th><th scope="col" class="r">' + esc(t.thNet) + ' (' + esc(t.unitHa) + ')</th></tr></thead><tbody>';
    rows.forEach(function (r) { h += '<tr><th scope="row" style="text-align:left;font-weight:400">' + esc(d.dims[r.x[3]]) + '</th><td class="r">' + nf(r.x[4], 0) + (r.x[4] < 10 ? ' <small>(' + esc(t.small) + ')</small>' : '') + '</td><td class="r">' + f(r.prod) + '</td><td class="r">' + f(r.cost) + '</td><td class="r">' + f(r.sub) + '</td><td class="r">' + f(r.net) + '</td></tr>'; });
    h += '</tbody></table></div><p class="pt-src">' + esc(t.fixed) + '</p>';
    var cur = null; rows.forEach(function (r) { if (String(r.x[3]) === ST.size) cur = r; });
    h += '<div class="cc-grid" style="margin-top:6px"><label for="cc-es-size" style="font-size:13px">' + esc(t.size) + '<br><select id="cc-es-size" class="di-compare-select">' + opt('', t.choose, ST.size) + rows.map(function (r) { return opt(r.x[3], d.dims[r.x[3]], ST.size); }).join('') + '</select></label></div>';
    if (cur) {
      var spec = perHa(d, cur.x, 'SE282');
      h += '<div class="pt-bar-ctl"><button type="button" class="pt-chip" data-es-c="1">' + esc(t.cLoad) + '</button></div>' + (spec != null ? '<p class="pt-src">' + esc(fill(t.cSpec, { v: nf(spec, 0) })) + '</p>' : '') + '<p class="pt-src">' + esc(t.cNote) + '</p>';
    }
    h += cite(R.year);
    box.innerHTML = h;
    box.querySelector('#cc-es-size').onchange = function (e) { ST.size = e.target.value; recan(c, d, m, pn); };
    var cb = box.querySelector('[data-es-c]');
    if (cb && cur) cb.onclick = function () {
      var cc = API.C(), x = cur.x, v = function (codes) { var s = sumHa(d, x, codes); return s == null ? '' : String(r2(s)); };
      cc.cur = 'EUR'; cc.areaU = 'ha';
      cc.costs.energy = v(['SE345']); cc.costs.mach = v(['SE340', 'SE350', 'SE360']); cc.costs.labour = v(['SE370']); cc.costs.rent = v(['SE375']); cc.costs.other = v(['SE356', 'SE380']);
      if (cc.pSrc === 'dehesa') { cc.pSrc = 'manual'; cc.inst = ''; }
      API.save(); API.shell();
    };
  }
  // PAC estimada que la persona calculó en pac.html (se guarda allí al calcular): línea APARTE del margen de mercado
  function pacEst() { try { var o = JSON.parse(window.localStorage.getItem(PACK) || 'null'); if (o && typeof o.mid === 'number' && typeof o.ha === 'number' && o.ha > 0 && typeof o.lo === 'number' && typeof o.hi === 'number') return o; } catch (e) { /* nada */ } return null; }
  function pacHtml(p) {
    var t = tr(), e = pacEst(), h = '<div class="pt-note" style="margin-top:10px"><b>' + esc(t.pH) + '</b>';
    if (!e) return h + '<br><a href="pac.html">' + esc(t.pNone) + '</a></div>';
    h += '<br>' + esc(fill(t.pTxt, { y: e.y, h: nf(e.ha, 2), mid: nf(e.mid, 0), lo: nf(e.lo, 0), hi: nf(e.hi, 0) }));
    if (p.cur !== 'EUR') h += '<br>' + esc(t.pCur);
    else if (p.areaHa == null || Math.abs(p.areaHa - e.ha) > 0.005) h += '<br>' + esc(fill(t.pDiff, { h: nf(e.ha, 2), a: p.areaHa == null ? '–' : nf(p.areaHa, 2) }));
    else if (p.margin != null) h += '<br><b>' + esc(t.pSum) + ': ' + nf(p.margin + e.mid, 0) + ' €</b> <small>(' + nf(p.margin + e.lo, 0) + '–' + nf(p.margin + e.hi, 0) + ' €)</small>';
    return h + '</div>';
  }
  window.DIMargenES = { can: can, draw: draw, pacHtml: pacHtml, hasPac: function () { return !!pacEst(); } };
})();
