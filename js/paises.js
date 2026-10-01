/* Dehesa Index — Producción y comercio por país. Carga y fusiona los ficheros de estadísticas por país (data/*-stats.json):
   MAPA y Eurostat (España), FranceAgriMer (Francia), BLE y Destatis (Alemania), Statbel (Bélgica), Eurostat (Austria),
   INE (Portugal), Statistics Canada, Statistics Denmark, CBS (Países Bajos), ABS (Australia), Eurostat Comext (comercio exterior)
   y los bancos centrales (tipos de interés de EE. UU., UE, Canadá y Australia). Perfil de país con datos macro (Banco Mundial) y sueldos.
   Solo series reales publicadas por la fuente; nada se estima ni se rellena. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Producción y comercio por país', sub: 'España (precios percibidos por el agricultor, fertilizantes y piensos desde 1990), Francia (cereales, carne y precios pagados al productor, FranceAgriMer), Alemania (leche, sacrificio, fruta y hortaliza e índices, BLE y Destatis), Bélgica (leche, sacrificio, índices de precios; Statbel), Austria (precios agrarios, leche, sacrificio y cultivos; Eurostat), Portugal (índices de precios, leche, carne, cultivos y censo ganadero; INE), Canadá (cosechas, existencias, ganado, lácteos e ingresos agrarios; Statistics Canada) y producción, sacrificio, cultivos, costes y exportaciones de Dinamarca, Países Bajos y Australia, con datos oficiales y su histórico completo.',
      country: 'País', group: 'Tipo', series: 'Serie', range: 'Periodo', all: 'Todos', production: 'Producción y sacrificio', crops: 'Cultivos', trade: 'Comercio exterior', costs: 'Costes de explotación', prices_lv: 'Precios ganaderos', quotes: 'Cotizaciones de mercado', milk: 'Leche (precios y volúmenes)', milk_regions: 'Leche: precio por región', meat_regions: 'Sacrificio: precio por región', prices_paid: 'Precios pagados al productor', prices_fv: 'Precios de frutas y hortalizas', inputs_f: 'Fertilizantes (precios pagados)', inputs_a: 'Piensos (precios pagados)', idx_perc: 'Índices de precios percibidos', idx_pag: 'Índices de precios pagados', incub: 'Incubación avícola', inputs: 'Insumos (precios)', prices: 'Precios e índices', livestock: 'Censo ganadero', environment: 'Estiércol y medio ambiente', organic: 'Agricultura ecológica', stocks: 'Existencias', income: 'Ingresos y renta agraria', rates: 'Tipos de interés', partners: 'Socios comerciales', latest: 'Último dato', change: 'Var. vs. anterior', period: 'Periodo', unit: 'Unidad',
      r6m: '6 meses', r1: '1 año', r3: '3 años', r5: '5 años', r10: '10 años', r20: '20 años', rmax: 'Máximo', date: 'Fecha', table: 'Ver todas las series', src: 'Fuente', lic: 'Licencia', updated: 'Actualizado', note: 'Datos oficiales tal como los publica cada fuente; los nombres de las series se mantienen en inglés. Las exportaciones de Australia son valor en dólares australianos, no volumen. Los índices australianos usan la base que publica el ABS. El último periodo puede ser provisional.', none: 'Sin datos disponibles.',
      countries: { US: 'EE. UU.', EU: 'Unión Europea', ES: 'España', FR: 'Francia', DE: 'Alemania', BE: 'Bélgica', AT: 'Austria', PT: 'Portugal', CA: 'Canadá', DK: 'Dinamarca', NL: 'Países Bajos', AU: 'Australia' }, freq: { monthly: 'mensual', weekly: 'semanal', quarterly: 'trimestral', annual: 'anual', semiannual: 'semestral' } },
    en: { title: 'Production and trade by country', sub: 'Spain (farm-gate prices, fertiliser and feed prices since 1990), France (cereal and meat quotations, farm-gate prices paid, FranceAgriMer), Germany (milk, slaughter, fruit and vegetables, indices; BLE and Destatis), Belgium (milk, slaughter, price indices; Statbel), Austria (farm prices, milk, slaughter and crops; Eurostat), Portugal (price indices, milk, meat, crops and livestock census; INE), Canada (harvests, stocks, livestock, dairy and farm income; Statistics Canada) plus production, slaughter, crops, costs and exports for Denmark, the Netherlands and Australia, from official data with full history.',
      country: 'Country', group: 'Type', series: 'Series', range: 'Period', all: 'All', production: 'Production and slaughter', crops: 'Crops', trade: 'Foreign trade', costs: 'Farm costs', prices_lv: 'Livestock prices', quotes: 'Market quotations', milk: 'Milk (prices and volumes)', milk_regions: 'Milk: price by region', meat_regions: 'Slaughter prices by region', prices_paid: 'Farm-gate prices paid', prices_fv: 'Fruit and vegetable prices', inputs_f: 'Fertiliser prices paid', inputs_a: 'Feed prices paid', idx_perc: 'Price indices received', idx_pag: 'Price indices paid', incub: 'Hatchery (poultry)', inputs: 'Input prices', prices: 'Prices and indices', livestock: 'Livestock census', environment: 'Manure and environment', organic: 'Organic farming', stocks: 'Stocks', income: 'Farm receipts and income', rates: 'Interest rates', partners: 'Trading partners', latest: 'Latest', change: 'Change vs. previous', period: 'Period', unit: 'Unit',
      r6m: '6 months', r1: '1 year', r3: '3 years', r5: '5 years', r10: '10 years', r20: '20 years', rmax: 'Max', date: 'Date', table: 'See all series', src: 'Source', lic: 'Licence', updated: 'Updated', note: 'Official data as published by each source. Australian exports are value in Australian dollars, not volume. The latest period may be provisional.', none: 'No data available.',
      countries: { US: 'United States', EU: 'European Union', ES: 'Spain', FR: 'France', DE: 'Germany', BE: 'Belgium', AT: 'Austria', PT: 'Portugal', CA: 'Canada', DK: 'Denmark', NL: 'Netherlands', AU: 'Australia' }, freq: { monthly: 'monthly', weekly: 'weekly', quarterly: 'quarterly', annual: 'annual', semiannual: 'twice a year' } },
    fr: { title: 'Production et commerce par pays', sub: 'Espagne (prix à la production, engrais et aliments depuis 1990), France (cotations des céréales et des viandes, prix payés aux producteurs, FranceAgriMer), Allemagne (lait, abattage, fruits et légumes, indices ; BLE et Destatis), Belgique (lait, abattages, indices de prix ; Statbel), Autriche (prix agricoles, lait, abattages et cultures ; Eurostat), Portugal (indices de prix, lait, viande, cultures et cheptel ; INE), Canada (récoltes, stocks, cheptel, produits laitiers et revenu agricole ; Statistics Canada) et production, abattages, cultures, coûts et exportations du Danemark, des Pays-Bas et de l’Australie, avec données officielles et historique complet.',
      country: 'Pays', group: 'Type', series: 'Série', range: 'Période', all: 'Tous', production: 'Production et abattages', crops: 'Cultures', trade: 'Commerce extérieur', costs: 'Coûts d’exploitation', prices_lv: 'Prix de l’élevage', quotes: 'Cotations de marché', milk: 'Lait (prix et volumes)', milk_regions: 'Lait : prix par région', meat_regions: 'Abattage : prix par région', prices_paid: 'Prix payés aux producteurs', prices_fv: 'Prix des fruits et légumes', inputs_f: 'Prix des engrais payés', inputs_a: 'Prix des aliments payés', idx_perc: 'Indices des prix reçus', idx_pag: 'Indices des prix payés', incub: 'Couvoirs (volailles)', inputs: 'Prix des intrants', prices: 'Prix et indices', livestock: 'Recensement du cheptel', environment: 'Fumier et environnement', organic: 'Agriculture biologique', stocks: 'Stocks', income: 'Recettes et revenu agricole', rates: 'Taux d’intérêt', partners: 'Partenaires commerciaux', latest: 'Dernière donnée', change: 'Var. vs précédent', period: 'Période', unit: 'Unité',
      r6m: '6 mois', r1: '1 an', r3: '3 ans', r5: '5 ans', r10: '10 ans', r20: '20 ans', rmax: 'Maximum', date: 'Date', table: 'Voir toutes les séries', src: 'Source', lic: 'Licence', updated: 'Mis à jour', note: 'Données officielles telles que publiées par chaque source ; les noms des séries restent en anglais. Les exportations australiennes sont en valeur (dollars australiens), pas en volume. La dernière période peut être provisoire.', none: 'Aucune donnée disponible.',
      countries: { US: 'États-Unis', EU: 'Union européenne', ES: 'Espagne', FR: 'France', DE: 'Allemagne', BE: 'Belgique', AT: 'Autriche', PT: 'Portugal', CA: 'Canada', DK: 'Danemark', NL: 'Pays-Bas', AU: 'Australie' }, freq: { monthly: 'mensuelle', weekly: 'hebdomadaire', quarterly: 'trimestrielle', annual: 'annuelle', semiannual: 'semestrielle' } },
    it: { title: 'Produzione e commercio per paese', sub: 'Spagna (prezzi alla produzione, fertilizzanti e mangimi dal 1990), Francia (quotazioni di cereali e carne, prezzi pagati ai produttori, FranceAgriMer), Germania (latte, macellazione, frutta e ortaggi, indici; BLE e Destatis), Belgio (latte, macellazioni, indici dei prezzi; Statbel), Austria (prezzi agricoli, latte, macellazioni e colture; Eurostat), Portogallo (indici dei prezzi, latte, carne, colture e bestiame; INE), Canada (raccolti, scorte, bestiame, latticini e reddito agricolo; Statistics Canada) e produzione, macellazioni, colture, costi ed esportazioni di Danimarca, Paesi Bassi e Australia, con dati ufficiali e storico completo.',
      country: 'Paese', group: 'Tipo', series: 'Serie', range: 'Periodo', all: 'Tutti', production: 'Produzione e macellazioni', crops: 'Colture', trade: 'Commercio estero', costs: 'Costi aziendali', prices_lv: 'Prezzi zootecnici', quotes: 'Quotazioni di mercato', milk: 'Latte (prezzi e volumi)', milk_regions: 'Latte: prezzo per regione', meat_regions: 'Macellazione: prezzo per regione', prices_paid: 'Prezzi pagati ai produttori', prices_fv: 'Prezzi di frutta e ortaggi', inputs_f: 'Prezzi dei fertilizzanti pagati', inputs_a: 'Prezzi dei mangimi pagati', idx_perc: 'Indici dei prezzi ricevuti', idx_pag: 'Indici dei prezzi pagati', incub: 'Incubatoi (avicoli)', inputs: 'Prezzi degli input', prices: 'Prezzi e indici', livestock: 'Censimento del bestiame', environment: 'Letame e ambiente', organic: 'Agricoltura biologica', stocks: 'Scorte', income: 'Ricavi e reddito agricolo', rates: 'Tassi di interesse', partners: 'Partner commerciali', latest: 'Ultimo dato', change: 'Var. vs precedente', period: 'Periodo', unit: 'Unità',
      r6m: '6 mesi', r1: '1 anno', r3: '3 anni', r5: '5 anni', r10: '10 anni', r20: '20 anni', rmax: 'Massimo', date: 'Data', table: 'Vedi tutte le serie', src: 'Fonte', lic: 'Licenza', updated: 'Aggiornato', note: 'Dati ufficiali come pubblicati da ciascuna fonte; i nomi delle serie restano in inglese. Le esportazioni australiane sono in valore (dollari australiani), non in volume. L’ultimo periodo può essere provvisorio.', none: 'Nessun dato disponibile.',
      countries: { US: 'Stati Uniti', EU: 'Unione europea', ES: 'Spagna', FR: 'Francia', DE: 'Germania', BE: 'Belgio', AT: 'Austria', PT: 'Portugal', CA: 'Canada', DK: 'Danimarca', NL: 'Paesi Bassi', AU: 'Australia' }, freq: { monthly: 'mensile', weekly: 'settimanale', quarterly: 'trimestrale', annual: 'annuale', semiannual: 'semestrale' } }
  };
  var MACRO = null, WAGES = null, DATA = null, ST = { c: 'ES', g: 'all', s: null, r: 'max', fx: false };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dec(v) { var a = Math.abs(v); return a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 1 : 2; }
  function ts(p) { // "1995-01" | "2026-Q2" | "2026" -> ms UTC
    var m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p))) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(\d{4})-(\d{2})$/.exec(p))) return Date.UTC(+m[1], +m[2] - 1, 1);
    if ((m = /^(\d{4})-Q(\d)$/.exec(p))) return Date.UTC(+m[1], (+m[2] - 1) * 3, 1);
    if ((m = /^(\d{4})$/.exec(p))) return Date.UTC(+m[1], 0, 1);
    return NaN;
  }
  function plabel(p, freq) {
    if (freq === 'weekly' || /^\d{4}-\d{2}-\d{2}$/.test(p)) { try { return new Date(ts(p)).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p; } }
    if (freq === 'monthly' || /^\d{4}-\d{2}$/.test(p)) { try { return new Date(ts(p)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p; } }
    return p;
  }
  function chartFor(s) {
    var t = tt(), years = { '6m': 0.5, '1': 1, '3': 3, '5': 5, '10': 10, '20': 20 }[ST.r], pts = s.points.slice();
    if (years) { var last = ts(pts[pts.length - 1][0]), from = last - years * 365.25 * 864e5; pts = pts.filter(function (p) { return ts(p[0]) >= from; }); }
    var series = [{ name: s.label, color: '#2f6b4a', pts: pts.map(function (p) { return { x: ts(p[0]), y: p[1], l: plabel(p[0], s.frequency) }; }) }];
    var d = dec(s.latest);
    return window.DehesaChart.render({ series: series, xMode: 'time', xTitle: t.date, yTitle: s.unit, aria: s.label + ' (' + s.unit + ')', noLegend: true, vFmt: function (v) { return nf(v, d); },
      xFmt: s.frequency === 'annual' ? function (x) { return new Date(x).getUTCFullYear(); } : undefined });
  }

  /* Local vs nacional: prima o descuento de cada región frente al precio nacional publicado por la misma fuente */
  var LV2 = { es: ['Local frente a nacional', 'Prima (+) o descuento (−) de cada región sobre el precio nacional de la misma fuente, mismo periodo.', 'Región', 'Región', 'Nacional', 'Prima / descuento', 'Esta serie en el tiempo', 'Sin comparación nacional publicada para esta serie.'],
    en: ['Local vs national', 'Premium (+) or discount (−) of each region over the national price from the same source, same period.', 'Region', 'Region', 'National', 'Premium / discount', 'This series over time', 'No published national benchmark for this series.'],
    fr: ['Local vs national', 'Prime (+) ou décote (−) de chaque région par rapport au prix national de la même source, même période.', 'Région', 'Région', 'National', 'Prime / décote', 'Cette série dans le temps', 'Pas de référence nationale publiée pour cette série.'],
    it: ['Locale vs nazionale', 'Premio (+) o sconto (−) di ogni regione sul prezzo nazionale della stessa fonte, stesso periodo.', 'Regione', 'Regione', 'Nazionale', 'Premio / sconto', 'Questa serie nel tempo', 'Nessun riferimento nazionale pubblicato per questa serie.'] };
  function lvKey(sr) {
    var m;
    if (sr.group === 'milk_regions') { m = /^(.+?), (organic|conventional) milk: (.*)$/.exec(sr.label); return m ? { key: m[2] + '|' + m[3], reg: m[1], nat: new RegExp('^' + m[2].charAt(0).toUpperCase() + m[2].slice(1) + ' milk: ' + m[3].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } : null; }
    if (sr.group === 'meat_regions') { m = /^(.+?): (.+)$/.exec(sr.label); return m ? { key: m[1], reg: m[2], nat: new RegExp('^' + m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\(Germany, carcass\\)$', 'i') } : null; }
    return null;
  }
  function ptAt(sr, per) { for (var i = sr.points.length - 1; i >= 0; i--) if (sr.points[i][0] === per) return sr.points[i][1]; return null; }
  function localBox(cur, c) {
    var k = lvKey(cur); if (!k) return ''; var w = LV2[lang()] || LV2.es, nat = null;
    c.series.forEach(function (x) { if (!nat && x.group !== cur.group && k.nat.test(x.label)) nat = x; });
    if (!nat) return '<div class="di-movers-hint" style="margin-top:6px">' + esc(w[7]) + '</div>';
    var rows = [];
    c.series.forEach(function (x) { if (x.group !== cur.group) return; var kk = lvKey(x); if (!kk || kk.key !== k.key || x.latestPeriod !== cur.latestPeriod) return; var nv = ptAt(nat, x.latestPeriod); if (nv == null || !nv) return; rows.push({ x: x, reg: kk.reg, nv: nv, pr: (x.latest - nv) / nv * 100 }); });
    if (rows.length < 2) return '';
    rows.sort(function (a, b) { return b.pr - a.pr; });
    var mx = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.pr); })) || 1, d = dec(cur.latest);
    return '<div style="margin-top:10px;border-top:1px solid var(--border);padding-top:8px"><b>' + esc(w[0]) + '</b><div class="di-movers-hint" style="margin:2px 0 6px">' + esc(w[1]) + ' ' + esc(plabel(cur.latestPeriod, cur.frequency)) + ' · ' + esc(cur.unit) + '</div>' +
      '<table style="border-collapse:collapse;width:100%;font-size:13px"><tr style="font-size:10.5px;font-weight:700;color:var(--text-faint);text-align:left"><th style="padding:4px 6px">' + esc(w[3].toUpperCase()) + '</th><th style="padding:4px 6px;text-align:right">' + esc(cur.unit.toUpperCase()) + '</th><th style="padding:4px 6px;text-align:right">' + esc(w[4].toUpperCase()) + ' ' + nf(rows[0].nv, d) + '</th><th style="padding:4px 6px;min-width:130px">' + esc(w[5].toUpperCase()) + '</th></tr>' +
      rows.map(function (r) { var col = r.pr >= 0 ? '#2f6b4a' : '#a33', cur2 = r.x.id === cur.id; return '<tr style="border-top:1px solid var(--border);' + (cur2 ? 'font-weight:700;background:var(--surface-alt)' : '') + '"><td style="padding:5px 6px">' + esc(r.reg) + '</td><td style="padding:5px 6px;text-align:right">' + nf(r.x.latest, d) + '</td><td style="padding:5px 6px;text-align:right;color:var(--text-muted)">' + nf(r.nv, d) + '</td><td style="padding:5px 6px"><span style="display:inline-block;height:8px;width:' + Math.round(Math.abs(r.pr) / mx * 80) + 'px;background:' + col + ';vertical-align:middle;border-radius:2px"></span> <span style="color:' + col + '">' + (r.pr > 0 ? '+' : r.pr < 0 ? '−' : '') + nf(Math.abs(r.pr), 1) + ' %</span></td></tr>'; }).join('') + '</table></div>';
  }

  /* FX histórico: convierte series monetarias no-euro a EUR con la media mensual del tipo del BCE de CADA periodo (no el de hoy) */
  var FX = null, FXT = { es: ['Convertir a EUR con el tipo de cada periodo', 'Convertido a euros con la media mensual del tipo de referencia del BCE de cada periodo (anual y trimestral: media de sus meses); no con el tipo de hoy. Original:', 'Sin tipo de cambio disponible para algún periodo: esos puntos se omiten.'], en: ['Convert to EUR at each period’s rate', 'Converted to euros using the ECB reference rate monthly average of each period (annual and quarterly: average of their months), not today’s rate. Original:', 'No exchange rate for some periods: those points are omitted.'], fr: ['Convertir en EUR au taux de chaque période', 'Converti en euros avec la moyenne mensuelle du taux de référence de la BCE de chaque période (annuel et trimestriel : moyenne de leurs mois), pas le taux d’aujourd’hui. Original :', 'Pas de taux pour certaines périodes : ces points sont omis.'], it: ['Converti in EUR al cambio di ogni periodo', 'Convertito in euro con la media mensile del tasso di riferimento BCE di ciascun periodo (annuale e trimestrale: media dei mesi), non il cambio di oggi. Originale:', 'Nessun tasso per alcuni periodi: quei punti sono omessi.'] };
  function curOf(u) {
    u = String(u || ''); if (/index|øre|unit as in source|%/i.test(u)) return null;
    if (/^(CAD|C\$)/.test(u)) return 'CAD'; if (/^(A\$|AUD)/.test(u)) return 'AUD'; if (/^DKK/.test(u)) return 'DKK'; if (/^(USD|US\$|\$)/.test(u)) return 'USD'; if (/^(GBP|£)/.test(u)) return 'GBP'; return null;
  }
  function fxRate(cur, per) {
    var a = FX && FX.currencies[cur]; if (!a) return null; if (!FX._m) FX._m = {};
    if (!FX._m[cur]) { var m = {}; a.forEach(function (r) { m[r[0]] = r[1]; }); FX._m[cur] = m; }
    var M = FX._m[cur], m2 = /^(\d{4})(?:-(\d{2}|Q[1-4]|S[12]))?/.exec(String(per)); if (!m2) return null;
    var y = m2[1], x = m2[2], months;
    if (!x) months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']; else if (x[0] === 'Q') { var q = +x[1]; months = [q * 3 - 2, q * 3 - 1, q * 3].map(function (n) { return ('0' + n).slice(-2); }); } else if (x[0] === 'S') months = x === 'S1' ? ['01', '02', '03', '04', '05', '06'] : ['07', '08', '09', '10', '11', '12']; else months = [x];
    var v = months.map(function (mm) { return M[y + '-' + mm]; }).filter(function (z) { return z != null; }); if (!v.length) return null; if (months.length > 1 && v.length < months.length && !x) { /* año incompleto: media de los meses disponibles */ }
    return v.reduce(function (s2, z) { return s2 + z; }, 0) / v.length;
  }
  function fxConv(sr) {
    var cu = curOf(sr.unit); if (!cu || !FX) return sr; var pts = [], miss = false;
    sr.points.forEach(function (p) { var r = fxRate(cu, p[0]); if (r && p[1] != null) pts.push([p[0], p[1] / r]); else miss = true; });
    if (pts.length < 2) return sr; var o = {}, k; for (k in sr) o[k] = sr[k];
    o.points = pts; o.latestPeriod = pts[pts.length - 1][0]; o.latest = pts[pts.length - 1][1]; o.changePct = pts.length > 1 && pts[pts.length - 2][1] ? (o.latest - pts[pts.length - 2][1]) / Math.abs(pts[pts.length - 2][1]) * 100 : null;
    o.unit = sr.unit.replace(/^(CAD|C\$|A\$|AUD|DKK|USD|US\$|\$|GBP|£)/, 'EUR'); o._fx = { from: cu, orig: sr, miss: miss }; return o;
  }
  function fxBox(cur0, cur) {
    if (!FX || !curOf(cur0.unit)) return ''; var w = FXT[lang()] || FXT.es;
    return '<label style="display:block;font-size:12.5px;margin:0 0 8px"><input type="checkbox" id="ps-fx"' + (ST.fx ? ' checked' : '') + '> ' + esc(w[0]) + ' (' + esc(curOf(cur0.unit)) + ' → EUR)</label>' +
      (ST.fx && cur._fx ? '<div class="di-movers-hint" style="margin:0 0 6px">' + esc(w[1]) + ' ' + nf(cur0.latest, dec(cur0.latest)) + ' ' + esc(cur0.unit) + (cur._fx.miss ? '. ' + esc(w[2]) : '') + '</div>' : '');
  }
  fetch('data/fx-history.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.currencies) { FX = d; if (DATA) build(); } }).catch(function () {});
  var PS = null, CF = { ES: 'spain-stats', FR: 'france-stats', DE: 'germany-stats', BE: 'belgium-stats', AT: 'austria-stats', PT: 'portugal-stats', CA: 'canada-stats', AU: 'country-stats', DK: 'country-stats', NL: 'country-stats', US: 'interest-rates-stats', EU: 'interest-rates-stats' },
    LV = { es: ['Linaje del dato', 'Fichero', 'último cambio', 'próxima ejecución prevista', 'última ejecución'], en: ['Data lineage', 'File', 'last change', 'next run due', 'last run'], fr: ['Lignage de la donnée', 'Fichier', 'dernier changement', 'prochaine exécution prévue', 'dernière exécution'], it: ['Lignaggio del dato', 'File', 'ultima modifica', 'prossima esecuzione prevista', 'ultima esecuzione'] };
  function dshort(i) { try { return new Date(i).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return String(i).slice(0, 10); } }
  function lineage(cc) {
    if (!PS || !CF[cc]) return ''; var f = 'data/' + CF[cc] + '.json', p = null, e = null, v = LV[lang()] || LV.es;
    PS.pipelines.forEach(function (x) { (x.files || []).forEach(function (y) { if (y.path === f && !p) { p = x; e = y; } }); }); if (!p) return '';
    return '<p class="di-movers-hint">' + v[0] + ': ' + v[1] + ' <code>' + esc(f) + '</code>' + (e.lastChange ? ' · ' + v[2] + ' ' + esc(dshort(e.lastChange)) : '') + (p.last ? ' · ' + v[4] + ' ' + esc(dshort(p.last.startedAt)) : '') + (p.nextRun ? ' · ' + v[3] + ' ' + esc(dshort(p.nextRun)) : '') + ' · <a href="status.html">status</a></p>';
  }
  fetch('data/pipeline-status.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) { PS = d; if (DATA) build(); } }).catch(function () {});
  var REV = [], RV = { es: ['Revisiones oficiales detectadas', 'antes', 'ahora', 'detectado'], en: ['Official revisions detected', 'was', 'now', 'detected'], fr: ['Révisions officielles détectées', 'avant', 'maintenant', 'détecté'], it: ['Revisioni ufficiali rilevate', 'prima', 'ora', 'rilevato'] };
  function revBox(cur) {
    var r = REV.filter(function (x) { return x.series === ST.c + '/' + cur.id; }).slice(0, 5); if (!r.length) return '';
    var v = RV[lang()] || RV.es;
    return '<div class="di-movers-hint" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px"><b>' + v[0] + '</b>' + r.map(function (x) { return '<div>' + esc(plabel(x.period, cur.frequency)) + ': ' + v[1] + ' ' + nf(x.old, dec(x.old)) + ' → ' + v[2] + ' <b>' + nf(x.new, dec(x.new)) + '</b>' + (x.pct == null ? '' : ' (' + (x.pct > 0 ? '+' : '') + nf(x.pct, 1) + ' %)') + ' · ' + v[3] + ' ' + esc(String(x.detectedAt).slice(0, 10)) + '</div>'; }).join('') + '</div>';
  }
  fetch('data/revisions.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.revisions) { REV = d.revisions; if (DATA) build(); } }).catch(function () {});
  function watchBtn(cur) {
    if (!window.DIWatch) return ''; var w = DIWatch.labels[lang()] || DIWatch.labels.es, on = DIWatch.has(ST.c, cur.id);
    return ' <button type="button" id="ps-watch" aria-pressed="' + on + '" style="float:right;margin:-4px 0 0 8px;padding:3px 10px;border:1px solid var(--border);border-radius:999px;background:' + (on ? '#e3f0e5' : 'transparent') + ';color:inherit;font:inherit;font-size:12px;letter-spacing:0;cursor:pointer">' + esc(on ? w.following : w.follow) + '</button>';
  }
  function build() {
    var root = document.getElementById('paises-body'); if (!root || !DATA) return;
    if (needsFor(ST.c).some(function (n) { return FD[n] === undefined; })) { ensure(ST.c).then(build); return; }
    var t = tt(), c = DATA.countries[ST.c] || DATA.countries.ES || DATA.countries.DK;
    var list = c.series.filter(function (s) { return ST.g === 'all' || s.group === ST.g; });
    if (!list.some(function (s) { return s.id === ST.s; })) ST.s = list.length ? list[0].id : null;
    var cur0 = list.filter(function (s) { return s.id === ST.s; })[0], cur = cur0 && ST.fx ? fxConv(cur0) : cur0;
    var countries = CCODES.slice().sort(function (x, y) { var o = { ES: 0, FR: 1, DE: 2, BE: 3, AT: 4, PT: 5, CA: 6, US: 7, EU: 8 }; return (o[x] == null ? 9 : o[x]) - (o[y] == null ? 9 : o[y]); });
    var groups = ['all'].concat(['production', 'crops', 'livestock', 'trade', 'quotes', 'prices', 'prices_paid', 'milk', 'milk_regions', 'prices_lv', 'meat_regions', 'prices_fv', 'inputs', 'inputs_f', 'inputs_a', 'idx_perc', 'idx_pag', 'costs', 'environment', 'organic', 'stocks', 'income', 'partners', 'rates'].filter(function (g) { return c.series.some(function (s) { return s.group === g; }); }));
    var opt = function (arr, sel, lab) { return arr.map(function (k) { return '<option value="' + esc(k) + '"' + (k === sel ? ' selected' : '') + '>' + esc(lab(k)) + '</option>'; }).join(''); };
    var sel = function (id, label, inner) { return '<label style="font-size:13px;flex:1;min-width:150px">' + label + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; };
    var rng = ['6m', '1', '3', '5', '10', '20', 'max'];
    var prof = window.DIProfile ? window.DIProfile.html(ST.c, c, { lang: lang(), t: t, groups: groups, esc: esc, nf: nf, dec: dec, plabel: plabel, macro: MACRO && MACRO.countries[ST.c], wage: WAGES && WAGES.countries[ST.c], rate: window.DIProfile.rateOf(c) }) : '';
    var html = prof + '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:0 0 14px">' +
      sel('ps-c', t.country, opt(countries, ST.c, function (k) { return t.countries[k] || k; })) +
      sel('ps-g', t.group, opt(groups, ST.g, function (k) { return k === 'all' ? t.all : t[k]; })) +
      sel('ps-s', t.series, opt(list.map(function (s) { return s.id; }), ST.s, function (id) { return list.filter(function (s) { return s.id === id; })[0].label; })) +
      sel('ps-r', t.range, opt(rng, ST.r, function (k) { return k === 'max' ? t.rmax : t['r' + k]; })) + '</div>';
    if (cur) {
      var ch = cur.changePct;
      html += '<div class="di-card" style="padding:16px 18px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + esc(cur.label.toUpperCase()) + ' (' + esc(cur.unit) + ')' + watchBtn(cur) + '</div>' + fxBox(cur0, cur) + chartFor(cur) +
        '<div class="di-movers-hint" style="margin-top:6px">' + t.latest + ' (' + esc(plabel(cur.latestPeriod, cur.frequency)) + '): <b>' + nf(cur.latest, dec(cur.latest)) + ' ' + esc(cur.unit) + '</b>' + (ch == null ? '' : ' · ' + (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), 1) + ' %') + ' · ' + t.freq[cur.frequency] + '</div>' + localBox(cur, c) + revBox(cur) + '</div>';
    } else html += '<p class="di-movers-hint">' + t.none + '</p>';
    html += '<details style="margin-top:14px"><summary style="cursor:pointer;font-size:13px">' + t.table + '</summary><div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:8px"><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:13.5px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:8px 6px">' + t.series.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.latest.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.change.toUpperCase() + '</th><th style="padding:8px 6px">' + t.period.toUpperCase() + '</th><th style="padding:8px 6px">' + t.unit.toUpperCase() + '</th></tr>' +
      c.series.map(function (s) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px">' + esc(s.label) + '</td><td style="padding:8px 6px;text-align:right">' + nf(s.latest, dec(s.latest)) + '</td><td style="padding:8px 6px;text-align:right">' + (s.changePct == null ? '' : (s.changePct > 0 ? '+' : s.changePct < 0 ? '−' : '') + nf(Math.abs(s.changePct), 1) + ' %') + '</td><td style="padding:8px 6px">' + esc(plabel(s.latestPeriod, s.frequency)) + '</td><td style="padding:8px 6px">' + esc(s.unit) + '</td></tr>'; }).join('') + '</table></div></details>' +
      '<p class="di-movers-hint" style="margin-top:12px">' + t.note + '</p><p class="di-movers-hint">' + t.src + ': <a href="' + esc(c.source.url) + '" target="_blank" rel="noopener">' + esc(c.source.name) + '</a> · ' + t.lic + ': ' + esc(c.source.license) + ' · ' + t.updated + ': ' + esc((DATA.generatedAt || '').slice(0, 10)) + '</p>' + lineage(ST.c);
    if (ST.c === 'PT') html += '<div id="ps-ifap"></div>'; html += '<div id="ps-tp"></div>';
    root.innerHTML = html;
    if (window.DITradePartners) { var tpn = document.getElementById('ps-tp'); if (tpn) window.DITradePartners.mount(tpn, ST.c, lang()); } if (ST.c === 'PT' && window.DIIfapMap) { var im = document.getElementById('ps-ifap'); if (im) window.DIIfapMap.mount(im, lang()); }
    var bind = function (id, key) { var el = document.getElementById(id); if (el) el.onchange = function (e) { ST[key] = e.target.value; if (key === 'c') { ST.g = 'all'; ST.s = null; } if (key === 'g') ST.s = null; build(); var n = document.getElementById(id); if (n) n.focus(); }; };
    var fb = document.getElementById('ps-fx'); if (fb) fb.onchange = function () { ST.fx = fb.checked; build(); };
    var wb = document.getElementById('ps-watch'); if (wb && cur) wb.onclick = function () { DIWatch.toggle(ST.c, cur.id); build(); };
    if (wb && cur && DIWatch.editor) { // avisos locales de esta serie (desplegable bajo el titulo del grafico)
      var card = wb.parentNode.parentNode, det = document.createElement('details'), sm = document.createElement('summary'), rl = (DIWatch.rl[lang()] || DIWatch.rl.es), nr = DIWatch.rules(ST.c, cur.id).length;
      det.style.cssText = 'margin:6px 0 8px'; if (nr) det.open = true; sm.style.cssText = 'cursor:pointer;font-size:12.5px;color:var(--text-faint)'; sm.textContent = '🔔 ' + rl.rules + (nr ? ' (' + nr + ')' : '');
      det.appendChild(sm); var box = document.createElement('div'); box.style.marginTop = '6px'; box.innerHTML = DIWatch.editor(ST.c, cur.id, lang()); det.appendChild(box);
      var after = wb.parentNode; after.parentNode.insertBefore(det, after.nextSibling); DIWatch.bindEditor(box, build);
    }
    Array.prototype.forEach.call(root.querySelectorAll('[data-pg],[data-ps]'), function (el) { el.onclick = function () { var g = el.getAttribute('data-pg'), sid = el.getAttribute('data-ps'); if (g) { ST.g = g; ST.s = null; } else { var s = c.series.filter(function (x) { return x.id === sid; })[0]; if (s) { ST.g = s.group; ST.s = sid; } } build(); var e = document.getElementById('ps-explorer'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
        try { var qq = new URLSearchParams(window.location.search); qq.set('c', ST.c); ['g', 's', 'r'].forEach(function (k) { var v = ST[k]; if (v && v !== 'all' && !(k === 'r' && v === 'max')) qq.set(k, v); else qq.delete(k); }); history.replaceState(null, '', '?' + qq.toString() + window.location.hash); } catch (e) {} bind('ps-c', 'c'); bind('ps-g', 'g'); bind('ps-s', 's'); bind('ps-r', 'r');
  }
  function shell() { var t = tt(); var h = document.getElementById('pg-h1'), s = document.getElementById('pg-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = 'Dehesa Index — ' + t.title; }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); build(); };
  shell();
  var q = new URLSearchParams(window.location.search); if (q.get('c')) ST.c = q.get('c').toUpperCase(); if (q.get('g')) ST.g = q.get('g'); if (q.get('s')) ST.s = q.get('s'); if (q.get('r')) ST.r = q.get('r'); if (q.get('fx') === '1') ST.fx = true;
  /* Carga bajo demanda: solo los ficheros del país elegido (antes se bajaban los 12 a la vez, ~8 MB). country-stats (DK, NL, AU) va siempre. */
  var FORDER = ['country-stats', 'spain-stats', 'france-stats', 'germany-stats', 'belgium-stats', 'austria-stats', 'portugal-stats', 'portugal-eurostat-stats', 'canada-stats', 'eu-trade-stats', 'australia-trade-stats', 'interest-rates-stats'];
  var NEED = { ES: ['spain-stats', 'eu-trade-stats'], FR: ['france-stats', 'eu-trade-stats'], DE: ['germany-stats', 'eu-trade-stats'], BE: ['belgium-stats', 'eu-trade-stats'], AT: ['austria-stats', 'eu-trade-stats'], PT: ['portugal-stats', 'portugal-eurostat-stats', 'eu-trade-stats'], DK: ['country-stats', 'eu-trade-stats'], NL: ['country-stats', 'eu-trade-stats'], CA: ['canada-stats', 'interest-rates-stats'], AU: ['country-stats', 'australia-trade-stats', 'interest-rates-stats'], US: ['interest-rates-stats'], EU: ['interest-rates-stats'] };
  var CCODES = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'DK', 'NL', 'CA', 'US', 'EU', 'AU'], FD = {}, PEND = {};
  function getFile(n) { if (FD[n] !== undefined) return Promise.resolve(); if (PEND[n]) return PEND[n]; return PEND[n] = fetch('data/' + n + '.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (j) { FD[n] = j; }).catch(function (e) { FD[n] = null; if (n === 'country-stats') throw e; }); }
  function rebuildData() {
    var d = { countries: {}, generatedAt: FD['country-stats'] && FD['country-stats'].generatedAt };
    FORDER.forEach(function (n) { var x = FD[n]; if (!x || !x.countries) return; Object.keys(x.countries).forEach(function (k) { var c = c0(x.countries[k]); if (c.extend && d.countries[k]) { var b = d.countries[k]; b.sources = b.sources || [b.source.name]; if (c.source && b.sources.indexOf(c.source.name) < 0) b.sources.push(c.source.name); b.series = b.series.concat(c.series); } else { c.sources = [c.source.name]; d.countries[k] = c; } }); d.spainUpdated = d.spainUpdated || x.generatedAt; });
    DATA = d;
  }
  function c0(c) { var o = {}, k; for (k in c) o[k] = c[k]; return o; }  // copia superficial: no tocamos el JSON cargado al re-fusionar
  function needsFor(cc) { return ['country-stats'].concat(NEED[cc] || []); }
  function ensure(cc) { return Promise.all(needsFor(cc).map(getFile)).then(function () { rebuildData(); }); }
  getFile('country-stats').then(function () {
    return Promise.all([fetch('data/country-macro.json'), fetch('data/country-wages.json')].map(function (f) { return f.then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }));
  }).then(function (m) { MACRO = m[0]; WAGES = m[1]; return ensure(ST.c); }).then(function () { if (!DATA.countries[ST.c] || !DATA.countries[ST.c].series.length) ST.c = 'ES'; return ensure(ST.c); }).then(function () { build(); })
    .catch(function () { var b = document.getElementById('paises-body'); if (b) b.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
})();
