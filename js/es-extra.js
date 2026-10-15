/* Dehesa Index — España (MAPA): ESYRCE rendimientos/riego/leñosos/suelo, huevos, lácteas, previsiones de ganado y avances de cosechas. ES5. Usa window.ESUI. */
(function (global) {
  'use strict';
  var U = global.ESUI; if (!U) return;
  var T = {
    es: { x: 'ESYRCE: rendimientos, riego, leñosos y suelo', xs: 'Encuesta sobre superficies y rendimientos de cultivos del Ministerio. Cada bloque indica el año de la encuesta; las cifras provinciales proceden de muestreo, no de censo.', y: 'Rendimiento', ir: 'Riego', wo: 'Leñosos', so: 'Suelo', yr: 'Año', cr: 'Cultivo', te: 'Territorio', sec: 'Secano', reg: 'Regadío', kgha: 'kg/ha', par: 'parcelas muestreadas', rk: 'Rendimiento por provincia', ev: 'Rendimiento nacional por año de encuesta', ha: 'ha', drip: 'Riego localizado sobre el regado total (cálculo de Dehesa Index)', gh: 'Superficie en invernadero', st: 'Estado de la plantación', fa: 'Barbecho: técnicas de mantenimiento', wd: 'Leñosos: técnicas de mantenimiento del suelo', nob: 'Sin dato en este año', xn: 'Se omiten las series de olivar de almazara por un error de copia en el libro original del Ministerio. Otras tablas (3.4, 3.5, 3.9, 3.10) y las praderas aún no se interpretan.',
      eg: 'Huevos y aves de puesta en España', egs: 'Capacidad de producción de las granjas de gallinas por sistema de cría, según el Ministerio.', hens: 'Gallinas ponedoras', dz: 'Docenas', cage: 'Jaulas', floor: 'Suelo', free: 'Campo', organic: 'Ecológico', ot: 'Otros', sys: 'Sistemas de cría', rkh: 'Comunidades por número de gallinas', egn: 'Cifras de número de aves (no producción). Cada columna cubre solo los sistemas que el Ministerio publica por separado ese año.', nat: 'España',
      da: 'Sector lácteo: industria y granjas', das: 'Leche recogida e industria láctea según la estadística anual del Ministerio.', milk: 'Leche recogida en explotaciones (miles de t)', cow: 'Vaca', sheep: 'Oveja', goat: 'Cabra', prod: 'Producción de la industria (miles de t)', cm: 'Leche de vaca por comunidad (miles de t)', dn: 'Años anteriores a 2017 no se pudieron leer: el Ministerio los publica en un formato antiguo.', fcast: 'Previsiones de producción de ganado', fcs: 'Previsiones del Ministerio de cabezas sacrificadas, en miles. Se guarda cada edición que se lee, así que el historial crece con el tiempo.', per: 'Período', ed: 'Edición',
      av: 'Avances de superficies y producciones', avs: 'Estimación mensual del Ministerio por cultivo: superficie (miles de ha) y producción (miles de t).', ar: 'Superficie', pr: 'Producción', yl: 'Rendimiento (t/ha)', defi: 'definitivo', prov: 'provisional', adv: 'avance', sc: 'Sección', all: 'Todas', ml: 'Estimación a', hi: 'Evolución de la cifra de avance entre ediciones', avn: 'Rendimiento = producción ÷ superficie, cálculo de Dehesa Index.' },
    en: { x: 'ESYRCE: yields, irrigation, woody crops and soil', xs: 'Ministry survey of crop areas and yields. Each block shows the survey year; provincial figures come from sampling, not a census.', y: 'Yield', ir: 'Irrigation', wo: 'Woody crops', so: 'Soil', yr: 'Year', cr: 'Crop', te: 'Territory', sec: 'Rainfed', reg: 'Irrigated', kgha: 'kg/ha', par: 'sampled plots', rk: 'Yield by province', ev: 'National yield by survey year', ha: 'ha', drip: 'Drip irrigation as a share of total irrigated area (Dehesa Index calculation)', gh: 'Greenhouse area', st: 'Plantation status', fa: 'Fallow: soil management techniques', wd: 'Woody crops: soil management techniques', nob: 'No data for this year', xn: 'Olive-for-oil series are left out because of a copy error in the Ministry’s original workbook. Other tables (3.4, 3.5, 3.9, 3.10) and grasslands are not interpreted yet.',
      eg: 'Eggs and laying hens in Spain', egs: 'Production capacity of laying-hen farms by rearing system, from the Ministry.', hens: 'Laying hens', dz: 'Dozens', cage: 'Cage', floor: 'Barn', free: 'Free range', organic: 'Organic', ot: 'Other', sys: 'Rearing systems', rkh: 'Regions by number of hens', egn: 'Bird counts (not output). Each column covers only the systems the Ministry publishes separately that year.', nat: 'Spain',
      da: 'Dairy sector: industry and farms', das: 'Milk collected and dairy industry from the Ministry’s annual statistics.', milk: 'Milk collected on farms (thousand t)', cow: 'Cow', sheep: 'Sheep', goat: 'Goat', prod: 'Industry output (thousand t)', cm: 'Cow milk by region (thousand t)', dn: 'Years before 2017 could not be read: the Ministry publishes them in an old format.', fcast: 'Livestock production forecasts', fcs: 'Ministry forecasts of animals slaughtered, in thousands. Every edition read is kept, so the history grows over time.', per: 'Period', ed: 'Edition',
      av: 'Crop area and production advances', avs: 'Monthly Ministry estimate by crop: area (thousand ha) and production (thousand t).', ar: 'Area', pr: 'Production', yl: 'Yield (t/ha)', defi: 'final', prov: 'provisional', adv: 'advance', sc: 'Section', all: 'All', ml: 'Estimate as of month', hi: 'How the advance figure changed between editions', avn: 'Yield = production ÷ area, a Dehesa Index calculation.' },
    fr: { x: 'ESYRCE : rendements, irrigation, cultures ligneuses et sol', xs: 'Enquête du ministère sur les superficies et rendements des cultures. Chaque bloc indique l’année d’enquête ; les chiffres provinciaux viennent d’un échantillon, pas d’un recensement.', y: 'Rendement', ir: 'Irrigation', wo: 'Ligneux', so: 'Sol', yr: 'Année', cr: 'Culture', te: 'Territoire', sec: 'Pluvial', reg: 'Irrigué', kgha: 'kg/ha', par: 'parcelles échantillonnées', rk: 'Rendement par province', ev: 'Rendement national par année d’enquête', ha: 'ha', drip: 'Goutte-à-goutte en part de la surface irriguée totale (calcul Dehesa Index)', gh: 'Surface sous serre', st: 'État de la plantation', fa: 'Jachère : techniques d’entretien du sol', wd: 'Ligneux : techniques d’entretien du sol', nob: 'Pas de donnée cette année', xn: 'Les séries d’olivier à huile sont omises à cause d’une erreur de copie dans le classeur d’origine du ministère. Les autres tableaux (3.4, 3.5, 3.9, 3.10) et les prairies ne sont pas encore interprétés.',
      eg: 'Œufs et poules pondeuses en Espagne', egs: 'Capacité de production des élevages de poules pondeuses par mode d’élevage, selon le ministère.', hens: 'Poules pondeuses', dz: 'Douzaines', cage: 'Cage', floor: 'Sol', free: 'Plein air', organic: 'Bio', ot: 'Autres', sys: 'Modes d’élevage', rkh: 'Régions par nombre de poules', egn: 'Effectifs (pas la production). Chaque colonne ne couvre que les modes publiés séparément cette année-là.', nat: 'Espagne',
      da: 'Secteur laitier : industrie et élevages', das: 'Lait collecté et industrie laitière selon la statistique annuelle du ministère.', milk: 'Lait collecté en exploitation (milliers de t)', cow: 'Vache', sheep: 'Brebis', goat: 'Chèvre', prod: 'Production de l’industrie (milliers de t)', cm: 'Lait de vache par région (milliers de t)', dn: 'Les années avant 2017 n’ont pas pu être lues : le ministère les publie dans un ancien format.', fcast: 'Prévisions de production animale', fcs: 'Prévisions du ministère des animaux abattus, en milliers. Chaque édition lue est conservée : l’historique s’allonge avec le temps.', per: 'Période', ed: 'Édition',
      av: 'Avances de superficies et de productions', avs: 'Estimation mensuelle du ministère par culture : superficie (milliers d’ha) et production (milliers de t).', ar: 'Superficie', pr: 'Production', yl: 'Rendement (t/ha)', defi: 'définitif', prov: 'provisoire', adv: 'avance', sc: 'Section', all: 'Toutes', ml: 'Estimation au mois', hi: 'Évolution du chiffre d’avance entre éditions', avn: 'Rendement = production ÷ superficie, calcul Dehesa Index.' },
    it: { x: 'ESYRCE: rese, irrigazione, legnose e suolo', xs: 'Indagine del ministero su superfici e rese delle colture. Ogni blocco indica l’anno d’indagine; i dati provinciali derivano da un campione, non da un censimento.', y: 'Resa', ir: 'Irrigazione', wo: 'Legnose', so: 'Suolo', yr: 'Anno', cr: 'Coltura', te: 'Territorio', sec: 'Asciutto', reg: 'Irriguo', kgha: 'kg/ha', par: 'particelle campionate', rk: 'Resa per provincia', ev: 'Resa nazionale per anno d’indagine', ha: 'ha', drip: 'Microirrigazione in quota sulla superficie irrigata totale (calcolo Dehesa Index)', gh: 'Superficie in serra', st: 'Stato dell’impianto', fa: 'Maggese: tecniche di gestione del suolo', wd: 'Legnose: tecniche di gestione del suolo', nob: 'Nessun dato per quest’anno', xn: 'Le serie dell’olivo da olio sono escluse per un errore di copia nella cartella originale del ministero. Le altre tabelle (3.4, 3.5, 3.9, 3.10) e i prati non sono ancora interpretati.',
      eg: 'Uova e galline ovaiole in Spagna', egs: 'Capacità produttiva degli allevamenti di galline ovaiole per sistema di allevamento, dal ministero.', hens: 'Galline ovaiole', dz: 'Dozzine', cage: 'Gabbia', floor: 'A terra', free: 'All’aperto', organic: 'Biologico', ot: 'Altro', sys: 'Sistemi di allevamento', rkh: 'Regioni per numero di galline', egn: 'Numero di capi (non produzione). Ogni colonna copre solo i sistemi pubblicati separatamente in quell’anno.', nat: 'Spagna',
      da: 'Settore lattiero: industria e aziende', das: 'Latte raccolto e industria lattiero-casearia dalla statistica annuale del ministero.', milk: 'Latte raccolto in azienda (migliaia di t)', cow: 'Vacca', sheep: 'Pecora', goat: 'Capra', prod: 'Produzione dell’industria (migliaia di t)', cm: 'Latte vaccino per regione (migliaia di t)', dn: 'Gli anni prima del 2017 non si sono potuti leggere: il ministero li pubblica in un vecchio formato.', fcast: 'Previsioni di produzione di bestiame', fcs: 'Previsioni del ministero sui capi macellati, in migliaia. Ogni edizione letta viene conservata: lo storico cresce nel tempo.', per: 'Periodo', ed: 'Edizione',
      av: 'Anticipazioni di superfici e produzioni', avs: 'Stima mensile del ministero per coltura: superficie (migliaia di ha) e produzione (migliaia di t).', ar: 'Superficie', pr: 'Produzione', yl: 'Resa (t/ha)', defi: 'definitivo', prov: 'provvisorio', adv: 'anticipazione', sc: 'Sezione', all: 'Tutte', ml: 'Stima al mese', hi: 'Evoluzione del dato di anticipazione tra edizioni', avn: 'Resa = produzione ÷ superficie, calcolo Dehesa Index.' }
  };
  function t() { return T[U.lang()] || T.es; }
  function title(s) { return String(s || '').toLowerCase().replace(/(^|[\/\- (])([a-záéíóúñü])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/ (De|Del|La|Las|El|Los|Y)(?= )/g, function (m) { return m.toLowerCase(); }); }
  function head(h, s) { return '<h2 class="cof-h2">' + U.esc(h) + '</h2><p class="cof-sub">' + U.esc(s) + '</p>'; }
  function card(n, v) { return '<div class="di-card cof-card"><div class="cof-n">' + U.esc(n) + '</div><div class="cof-v">' + v + '</div></div>'; }
  function last(a) { return a[a.length - 1]; }

  /* ---------- A. ESYRCE extra ---------- */
  var X = { idx: null, docs: {}, year: null, sec: 'y', crop: null, terr: null, wcrop: null };
  function loadX() {
    return U.json('data/spain-esyrce/extra-index.json').then(function (ix) {
      if (!ix || !ix.years) return null; X.idx = ix; var ys = Object.keys(ix.years).sort();
      return Promise.all(ys.map(function (y) { return U.json('data/spain-esyrce/' + ix.years[y].file).then(function (d) { if (d) X.docs[y] = d; }); })).then(function () { X.year = last(Object.keys(X.docs).sort()); return X.year ? true : null; });
    });
  }
  function yearsWith(k) { return Object.keys(X.docs).sort().filter(function (y) { return X.docs[y][k] && (k !== 'yields' || X.docs[y].yields.length); }); }
  function drawX(el) {
    var tt = t(), secs = [['y', tt.y], ['ir', tt.ir], ['wo', tt.wo], ['so', tt.so]], key = { y: 'yields', ir: 'irrigation', wo: 'woody', so: 'soil' };
    var ys = yearsWith(key[X.sec]); if (!ys.length) { X.sec = 'y'; ys = yearsWith('yields'); }
    if (ys.indexOf(X.year) < 0) X.year = last(ys);
    var d = X.docs[X.year], h = '<section class="cof">' + head(tt.x, tt.xs) + '<div role="group">' + secs.map(function (s) { return yearsWith(key[s[0]]).length ? U.chip(X.sec === s[0], 'esx-s', 'data-s="' + s[0] + '"', s[1]) : ''; }).join('') + '</div>';
    h += U.sel('esx-y', tt.yr, ys.map(function (y) { return U.opt(y, y, X.year); }).join(''), X.year);
    if (X.sec === 'y') h += bodyYield(d, ys, tt); else if (X.sec === 'ir') h += bodyIrr(d, tt); else if (X.sec === 'wo') h += bodyWoody(d, tt); else h += bodySoil(d, tt);
    el.innerHTML = h + '<p class="cof-note">' + U.esc(tt.xn) + '</p>' + U.cite('mapa_es') + '</section>';
    Array.prototype.forEach.call(el.querySelectorAll('.esx-s'), function (b) { b.onclick = function () { X.sec = b.getAttribute('data-s'); drawX(el); }; });
    var sy = el.querySelector('#esx-y'); if (sy) sy.onchange = function () { X.year = sy.value; drawX(el); };
    var sc = el.querySelector('#esx-c'); if (sc) sc.onchange = function () { X.crop = sc.value; drawX(el); };
    var st = el.querySelector('#esx-t'); if (st) st.onchange = function () { X.terr = st.value; drawX(el); };
    var sw = el.querySelector('#esx-w'); if (sw) sw.onchange = function () { X.wcrop = sw.value; drawX(el); };
  }
  function ykey(q) { return q.name + '|' + q.regime; }
  function bodyYield(d, ys, tt) {
    var names = []; d.yields.forEach(function (q) { if (names.indexOf(q.name) < 0) names.push(q.name); });
    if (names.indexOf(X.crop) < 0) X.crop = names.indexOf('TRIGO BLANDO') >= 0 ? 'TRIGO BLANDO' : names[0];
    var h = U.sel('esx-c', tt.cr, names.map(function (n) { return U.opt(n, title(n), X.crop); }).join(''), X.crop);
    var qs = d.yields.filter(function (q) { return q.name === X.crop; }), cards = '', rank = [];
    qs.forEach(function (q) {
      var ts = d.yieldSets[q.set], i = ts.length - 1, nat = q.y[i];
      cards += card((q.regime === 'secano' ? tt.sec : tt.reg) + ' · ' + tt.kgha, nat == null ? '–' : U.esc(U.nf(nat, 0)) + '<span class="cof-note"> · ' + U.esc(U.nf(q.n[i], 0)) + ' ' + tt.par + '</span>');
      ts.forEach(function (tr, k) { if (tr.kind === 'province' && q.y[k] != null) rank.push([title(tr.name), q.y[k], q.regime === 'secano' ? tt.sec : tt.reg]); });
    });
    h += '<div class="cof-cards">' + cards + '</div>';
    if (rank.length) { rank.sort(function (a, b) { return b[1] - a[1]; }); h += '<h3 class="cof-h3">' + U.esc(tt.rk) + '</h3>' + U.bars(rank.slice(0, 15), rank[0][1], 0, tt.kgha); }
    var ser = [];
    ['secano', 'regadio'].forEach(function (rg) {
      var v = ys.map(function (y) { var q = X.docs[y].yields.filter(function (z) { return z.name === X.crop && z.regime === rg; })[0]; return q ? q.y[X.docs[y].yieldSets[q.set].length - 1] : null; });
      if (v.filter(function (x) { return x != null; }).length) ser.push({ name: rg === 'secano' ? tt.sec : tt.reg, v: v });
    });
    if (ys.length > 1 && ser.length) h += '<h3 class="cof-h3">' + U.esc(tt.ev) + '</h3>' + U.chart(ser, ys, tt.kgha, tt.ev, 0);
    return h;
  }
  function terrOpts(d, blk, tt) { var ts = blk.territories; if (!X.terr || !ts.some(function (z) { return z.id === X.terr; })) X.terr = last(ts).id; return U.sel('esx-t', tt.te, ts.map(function (z) { return U.opt(z.id, title(z.name), X.terr); }).join(''), X.terr); }
  function at(blk, m) { var i = blk.territories.map(function (z) { return z.id; }).indexOf(X.terr); return i < 0 || !blk.measures[m] ? null : blk.measures[m][i]; }
  function bodyIrr(d, tt) {
    var h = terrOpts(d, d.irrigation, tt), I = d.irrigation, ms = Object.keys(I.measures).filter(function (m) { return !/^total/i.test(m); }), tot = at(I, 'Total regadío'), loc = at(I, 'Localizado');
    h += '<div class="cof-cards">' + card('Total ' + tt.reg.toLowerCase() + ' · ' + tt.ha, tot == null ? '–' : U.esc(U.nf(tot, 0))) + (tot && loc != null ? card(tt.drip, U.esc(U.nf(loc / tot * 100, 1)) + ' %') : '') + '</div>';
    var rows = ms.map(function (m) { return [m, at(I, m)]; }).filter(function (r) { return r[1] != null && r[1] > 0; }); if (!rows.length) return h + '<p class="cof-note">' + tt.nob + '</p>';
    return h + U.bars(rows, Math.max.apply(null, rows.map(function (r) { return r[1]; })), 0, tt.ha);
  }
  function bodyWoody(d, tt) {
    var W = d.woody, crops = W.crops.map(function (c) { return c.crop; });
    if (crops.indexOf(X.wcrop) < 0) X.wcrop = crops.indexOf('Olivar') >= 0 ? 'Olivar' : crops[0];
    var h = U.sel('esx-w', tt.cr, crops.map(function (c) { return U.opt(c, c, X.wcrop); }).join(''), X.wcrop), c = W.crops.filter(function (z) { return z.crop === X.wcrop; })[0], i = W.territories.length - 1;
    var rows = c.states.map(function (s, k) { return [s, c.v[k] ? c.v[k][i] : null]; }).filter(function (r) { return r[1] != null && r[1] > 0; });
    var rk = []; var ix = c.states.indexOf('Plantación en Producción'); if (ix >= 0) W.territories.forEach(function (z, k) { if (z.kind === 'province' && c.v[ix][k] > 0) rk.push([title(z.name), c.v[ix][k]]); });
    h += '<h3 class="cof-h3">' + U.esc(tt.st) + ' · ' + U.esc(title(W.territories[i].name)) + '</h3>' + (rows.length ? U.bars(rows, Math.max.apply(null, rows.map(function (r) { return r[1]; })), 0, tt.ha) : '<p class="cof-note">' + tt.nob + '</p>');
    if (rk.length) { rk.sort(function (a, b) { return b[1] - a[1]; }); h += '<h3 class="cof-h3">' + U.esc(c.states[ix]) + '</h3>' + U.bars(rk.slice(0, 12), rk[0][1], 0, tt.ha); }
    return h;
  }
  function bodySoil(d, tt) {
    var h = terrOpts(d, d.soil.fallow, tt);
    [['fallow', tt.fa], ['woody', tt.wd]].forEach(function (p) {
      var B = d.soil[p[0]]; if (!B) return; var rows = Object.keys(B.measures).map(function (m) { return [m, at(B, m)]; }).filter(function (r) { return r[1] != null && r[1] > 0; });
      h += '<h3 class="cof-h3">' + U.esc(p[1]) + '</h3>' + (rows.length ? U.bars(rows, Math.max.apply(null, rows.map(function (r) { return r[1]; })), 0, tt.ha) : '<p class="cof-note">' + tt.nob + '</p>');
    });
    return h;
  }

  /* ---------- B. Huevos ---------- */
  var E = { d: null, y: null, m: 'hens', terr: 'espana' };
  function drawEggs(el) {
    var tt = t(), D = E.d, ys = Object.keys(D.years).sort(); if (ys.indexOf(E.y) < 0) E.y = last(ys);
    var Y = D.years[E.y][E.m], ti = D.territories.map(function (z) { return z.id; }), i = ti.indexOf(E.terr); if (i < 0) { E.terr = 'espana'; i = ti.indexOf('espana'); }
    var h = '<section class="cof">' + head(tt.eg, tt.egs) + '<div role="group">' + [['hens', tt.hens], ['dozens', tt.dz]].map(function (m) { return U.chip(E.m === m[0], 'ese-m', 'data-m="' + m[0] + '"', m[1]); }).join('') + '</div>';
    h += U.sel('ese-y', tt.yr, ys.map(function (y) { return U.opt(y, y, E.y); }).join(''), E.y) + U.sel('ese-t', tt.te, D.territories.map(function (z) { return U.opt(z.id, title(z.name) === 'España' ? tt.nat : z.name, E.terr); }).join(''), E.terr);
    var sys = [['cage', tt.cage], ['floor', tt.floor], ['free', tt.free], ['organic', tt.organic], ['cage_floor', tt.cage + ' + ' + tt.floor.toLowerCase()], ['free_organic', tt.free + ' + ' + tt.organic.toLowerCase()]];
    function g(k) { return Y[k] ? Y[k][i] : null; } if (g('cage') != null && g('floor') != null) sys.splice(4, 1); if (g('free') != null && g('organic') != null) sys.pop();
    var rows = sys.map(function (s) { return [s[1], g(s[0])]; }).filter(function (r) { return r[1] != null && r[1] > 0; }), tot = Y.hens ? Y.hens[i] : Y.all ? Y.all[i] : null, all = Y.all ? Y.all[i] : null;
    h += '<div class="cof-cards">' + card(E.m === 'hens' ? tt.hens : tt.dz, tot == null ? (all == null ? '–' : U.esc(U.nf(all, 0))) : U.esc(U.nf(tot, 0))) + '</div>';
    if (rows.length) h += '<h3 class="cof-h3">' + U.esc(tt.sys) + '</h3>' + U.bars(rows, Math.max.apply(null, rows.map(function (r) { return r[1]; })), 0, '');
    var key = Y.hens ? 'hens' : 'all', rk = []; D.territories.forEach(function (z, k) { if (z.kind === 'ccaa' && Y[key] && Y[key][k] > 0) rk.push([z.name, Y[key][k]]); });
    if (rk.length) { rk.sort(function (a, b) { return b[1] - a[1]; }); h += '<h3 class="cof-h3">' + U.esc(tt.rkh) + '</h3>' + U.bars(rk, rk[0][1], 0, ''); }
    el.innerHTML = h + '<p class="cof-note">' + U.esc(tt.egn) + '</p>' + U.cite('mapa_es') + '</section>';
    Array.prototype.forEach.call(el.querySelectorAll('.ese-m'), function (b) { b.onclick = function () { E.m = b.getAttribute('data-m'); drawEggs(el); }; });
    el.querySelector('#ese-y').onchange = function () { E.y = this.value; drawEggs(el); }; el.querySelector('#ese-t').onchange = function () { E.terr = this.value; drawEggs(el); };
  }

  /* ---------- C. Lácteas ---------- */
  var DA = { d: null };
  function drawDairy(el) {
    var tt = t(), D = DA.d, yrs = D.years, C = D.industry.collected;
    function row(lbl, nm) { var r = C.filter(function (c) { return c.label.indexOf(nm) >= 0; })[0]; return r ? { name: lbl, v: r.v } : null; }
    var s = [row(tt.cow, 'Leche de vaca'), row(tt.sheep, 'Leche de oveja'), row(tt.goat, 'Leche de cabra')].filter(Boolean);
    var h = '<section class="cof">' + head(tt.da, tt.das) + '<div class="cof-cards">' + s.map(function (r) { var j = r.v.length - 1; while (j > 0 && r.v[j] == null) j--; return card(r.name + ' · ' + yrs[j], r.v[j] == null ? '–' : U.esc(U.nf(r.v[j], 0))); }).join('') + '</div>';
    if (s.length && yrs.length > 1) h += '<h3 class="cof-h3">' + U.esc(tt.milk) + '</h3>' + U.chart(s, yrs, '', tt.milk, 0);
    var cm = []; D.cowMilkByCcaa.territories.forEach(function (z) { var v = D.cowMilkByCcaa.v[z.id]; if (z.kind === 'ccaa' && v && v[0] != null) cm.push([z.name, v[0]]); });
    if (cm.length) { cm.sort(function (a, b) { return b[1] - a[1]; }); h += '<h3 class="cof-h3">' + U.esc(tt.cm) + ' · ' + yrs[0] + '</h3>' + U.bars(cm, cm[0][1], 0, ''); }
    var pr = D.industry.products.filter(function (p) { return /^\d\.\d\.?$/.test(p.code) && p.v[1] != null && !/^diferencias/i.test(p.label); }).map(function (p) { return [p.label, p.v[1]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12);
    if (pr.length) h += '<h3 class="cof-h3">' + U.esc(tt.prod) + ' · ' + last(yrs) + '</h3>' + U.bars(pr, pr[0][1], 0, '');
    el.innerHTML = h + '<p class="cof-note">' + U.esc(tt.dn) + '</p>' + U.cite('mapa_es') + '</section>';
  }

  /* ---------- D. Previsiones ---------- */
  var F = { d: null, ed: null };
  function drawFc(el) {
    var tt = t(), eds = Object.keys(F.d.editions).sort(); if (eds.indexOf(F.ed) < 0) F.ed = last(eds);
    var E2 = F.d.editions[F.ed], h = '<section class="cof">' + head(tt.fcast, tt.fcs) + U.sel('esf-e', tt.ed, eds.map(function (e) { return U.opt(e, e, F.ed); }).join(''), F.ed);
    E2.species.forEach(function (sp) {
      h += '<h3 class="cof-h3">' + U.esc(sp.species) + ' <span class="di-movers-hint">· ' + U.esc(E2.unit) + '</span></h3><div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:320px;font-size:13.5px"><thead><tr><th scope="col" style="' + U.th + 'text-align:left">' + U.esc(tt.per) + '</th>' + sp.columns.map(function (c) { return '<th scope="col" style="' + U.th + 'text-align:right">' + U.esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + sp.periods.map(function (p) { return '<tr><td style="' + U.td + 'text-align:left">' + U.esc(p.period) + '</td>' + p.v.map(function (v) { return '<td style="' + U.td + '">' + U.esc(U.nf(v, 0)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    });
    el.innerHTML = h + U.cite('mapa_es') + '</section>'; el.querySelector('#esf-e').onchange = function () { F.ed = this.value; drawFc(el); };
  }

  /* ---------- E. Avances ---------- */
  var A = { d: null, sec: 'all', key: null, m: 'prod' };
  function drawAv(el) {
    var tt = t(), D = A.d, secs = []; D.items.forEach(function (it) { if (secs.indexOf(it.section) < 0) secs.push(it.section); }); if (A.sec === 'all' && !A.touched) A.sec = secs[0] || 'all';
    var items = D.items.filter(function (it) { return A.sec === 'all' || it.section === A.sec; });
    var h = '<section class="cof">' + head(tt.av, tt.avs + ' ' + D.editionLabel + '.') + U.sel('esa-s', tt.sc, U.opt('all', tt.all, A.sec) + secs.map(function (s) { return U.opt(s, title(s), A.sec); }).join(''), A.sec);
    h += '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:420px;font-size:13.5px"><thead><tr><th scope="col" style="' + U.th + 'text-align:left">' + U.esc(tt.cr) + '</th><th scope="col" style="' + U.th + 'text-align:right">' + U.esc(tt.ar) + '</th><th scope="col" style="' + U.th + 'text-align:right">' + U.esc(tt.pr) + '</th><th scope="col" style="' + U.th + 'text-align:right">' + U.esc(tt.yl) + '</th></tr></thead><tbody>';
    items.forEach(function (it) {
      var j = 2, a = it.area[j], p = it.prod[j]; if (a == null && p == null) { j = 1; a = it.area[j]; p = it.prod[j]; } if (a == null && p == null) return;
      var st = tt[({ definitivo: 'defi', provisional: 'prov', avance: 'adv' })[it.status[j]]] || '';
      h += '<tr><td style="' + U.td + 'text-align:left">' + U.esc(title(it.label)) + ' <span class="di-movers-hint">· ' + it.years[j] + ' ' + U.esc(st) + '</span></td><td style="' + U.td + '">' + U.esc(U.nf(a, 1)) + '</td><td style="' + U.td + '">' + U.esc(U.nf(p, 1)) + '</td><td style="' + U.td + '">' + (a > 0 && p != null ? U.esc(U.nf(p / a, 2)) : '–') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    var hk = Object.keys(D.history).sort();
    if (hk.length > 1) h += '<p class="cof-note">' + U.esc(tt.hi) + ': ' + hk.join(' → ') + '.</p>';
    el.innerHTML = h + '<p class="cof-note">' + U.esc(tt.avn) + '</p>' + U.cite('mapa_es') + '</section>'; el.querySelector('#esa-s').onchange = function () { A.touched = 1; A.sec = this.value; drawAv(el); };
  }

  U.mount('rd-es', 'rd-es-esyrce-x', loadX, drawX);
  U.mount('rd-es', 'rd-es-avances', function () { return U.json('data/spain-avances/avances.json').then(function (d) { A.d = d && d.items && d.items.length ? d : null; return A.d; }); }, drawAv);
  U.mount('gn-esm', 'gn-es-eggs', function () { return U.json('data/spain-ganaderia/eggs.json').then(function (d) { E.d = d && d.years ? d : null; return E.d; }); }, drawEggs);
  U.mount('gn-esm', 'gn-es-fcast', function () { return U.json('data/spain-ganaderia/forecasts.json').then(function (d) { F.d = d && d.editions && Object.keys(d.editions).length ? d : null; return F.d; }); }, drawFc);
  U.mount('gn-esm', 'gn-es-dairy', function () { return U.json('data/spain-ganaderia/dairy.json').then(function (d) { DA.d = d && d.industry ? d : null; return DA.d; }); }, drawDairy);
})(window);
