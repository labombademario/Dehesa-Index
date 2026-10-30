/* Dehesa Index — Producción y comercio por país. Carga y fusiona los ficheros de estadísticas por país (data/*-stats.json):
   MAPA y Eurostat (España), FranceAgriMer (Francia), BLE y Destatis (Alemania), Statbel (Bélgica), Eurostat (Austria),
   INE (Portugal), Statistics Canada, Statistics Denmark, CBS (Países Bajos), ABS (Australia), Eurostat Comext (comercio exterior)
   y los bancos centrales (tipos de interés de EE. UU., UE, Canadá y Australia). Perfil de país con datos macro (Banco Mundial) y sueldos.
   Solo series reales publicadas por la fuente; nada se estima ni se rellena. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Producción y comercio por país', sub: 'España (precios percibidos por el agricultor, fertilizantes y piensos desde 1990), Francia (cereales, carne y precios pagados al productor, FranceAgriMer), Alemania (leche, sacrificio, fruta y hortaliza e índices, BLE y Destatis), Bélgica (leche, sacrificio, índices de precios; Statbel), Austria (precios agrarios, leche, sacrificio y cultivos; Eurostat), Portugal (índices de precios, leche, carne, cultivos y censo ganadero; INE), Canadá (cosechas, existencias, ganado, lácteos e ingresos agrarios; Statistics Canada) y producción, sacrificio, cultivos, costes y exportaciones de Dinamarca, Países Bajos y Australia, con datos oficiales y su histórico completo.',
      country: 'País', group: 'Tipo', series: 'Serie', range: 'Periodo', all: 'Todos', fish: 'Pesca y acuicultura', production: 'Producción y sacrificio', crops: 'Cultivos', trade: 'Comercio exterior', costs: 'Costes de explotación', prices_lv: 'Precios ganaderos', quotes: 'Cotizaciones de mercado', milk: 'Leche (precios y volúmenes)', milk_regions: 'Leche: precio por región', crops_regions: 'Cultivos por región', meat_regions: 'Sacrificio: precio por región', prices_paid: 'Precios pagados al productor', prices_fv: 'Precios de frutas y hortalizas', inputs_f: 'Fertilizantes (precios pagados)', inputs_a: 'Piensos (precios pagados)', idx_perc: 'Índices de precios percibidos', idx_pag: 'Índices de precios pagados', incub: 'Incubación avícola', inputs: 'Insumos (precios)', prices: 'Precios e índices', livestock: 'Censo ganadero', environment: 'Estiércol y medio ambiente', organic: 'Agricultura ecológica', climate: 'Clima', stocks: 'Existencias', income: 'Ingresos y renta agraria', rates: 'Tipos de interés y de cambio', partners: 'Socios comerciales', latest: 'Último dato', change: 'Var. vs. anterior', period: 'Periodo', unit: 'Unidad',
      r6m: '6 meses', r1: '1 año', r3: '3 años', r5: '5 años', r10: '10 años', r20: '20 años', rmax: 'Máximo', date: 'Fecha', table: 'Ver todas las series', src: 'Fuente', lic: 'Licencia', updated: 'Actualizado', note: 'Datos oficiales tal como los publica cada fuente; los nombres de las series se mantienen en inglés. Las exportaciones de Australia son valor en dólares australianos, no volumen. Los índices australianos usan la base que publica el ABS. El último periodo puede ser provisional.', none: 'Sin datos disponibles.',
      countries: { US: 'EE. UU.', EU: 'Unión Europea', ES: 'España', FR: 'Francia', DE: 'Alemania', BE: 'Bélgica', AT: 'Austria', PT: 'Portugal', IT: 'Italia', CA: 'Canadá', DK: 'Dinamarca', NL: 'Países Bajos', AU: 'Australia', UK: 'Reino Unido', AR: 'Argentina', CL: 'Chile', UY: 'Uruguay', PL: 'Polonia', BG: 'Bulgaria', EL: 'Grecia', FI: 'Finlandia', HR: 'Croacia', IE: 'Irlanda', LT: 'Lituania', SK: 'Eslovaquia', CZ: 'Chequia', EE: 'Estonia', HU: 'Hungría', LV: 'Letonia', RO: 'Rumanía', SE: 'Suecia', CY: 'Chipre', LU: 'Luxemburgo', MT: 'Malta', SI: 'Eslovenia', CH: 'Suiza' }, freq: { monthly: 'mensual', weekly: 'semanal', quarterly: 'trimestral', annual: 'anual', semiannual: 'semestral' } },
    en: { title: 'Production and trade by country', sub: 'Spain (farm-gate prices, fertiliser and feed prices since 1990), France (cereal and meat quotations, farm-gate prices paid, FranceAgriMer), Germany (milk, slaughter, fruit and vegetables, indices; BLE and Destatis), Belgium (milk, slaughter, price indices; Statbel), Austria (farm prices, milk, slaughter and crops; Eurostat), Portugal (price indices, milk, meat, crops and livestock census; INE), Canada (harvests, stocks, livestock, dairy and farm income; Statistics Canada) plus production, slaughter, crops, costs and exports for Denmark, the Netherlands and Australia, from official data with full history.',
      country: 'Country', group: 'Type', series: 'Series', range: 'Period', all: 'All', fish: 'Fishing and aquaculture', production: 'Production and slaughter', crops: 'Crops', trade: 'Foreign trade', costs: 'Farm costs', prices_lv: 'Livestock prices', quotes: 'Market quotations', milk: 'Milk (prices and volumes)', milk_regions: 'Milk: price by region', crops_regions: 'Crops by region', meat_regions: 'Slaughter prices by region', prices_paid: 'Farm-gate prices paid', prices_fv: 'Fruit and vegetable prices', inputs_f: 'Fertiliser prices paid', inputs_a: 'Feed prices paid', idx_perc: 'Price indices received', idx_pag: 'Price indices paid', incub: 'Hatchery (poultry)', inputs: 'Input prices', prices: 'Prices and indices', livestock: 'Livestock census', environment: 'Manure and environment', organic: 'Organic farming', climate: 'Climate', stocks: 'Stocks', income: 'Farm receipts and income', rates: 'Interest and exchange rates', partners: 'Trading partners', latest: 'Latest', change: 'Change vs. previous', period: 'Period', unit: 'Unit',
      r6m: '6 months', r1: '1 year', r3: '3 years', r5: '5 years', r10: '10 years', r20: '20 years', rmax: 'Max', date: 'Date', table: 'See all series', src: 'Source', lic: 'Licence', updated: 'Updated', note: 'Official data as published by each source. Australian exports are value in Australian dollars, not volume. The latest period may be provisional.', none: 'No data available.',
      countries: { US: 'United States', EU: 'European Union', ES: 'Spain', FR: 'France', DE: 'Germany', BE: 'Belgium', AT: 'Austria', PT: 'Portugal', IT: 'Italy', CA: 'Canada', DK: 'Denmark', NL: 'Netherlands', AU: 'Australia', UK: 'United Kingdom', AR: 'Argentina', CL: 'Chile', UY: 'Uruguay', PL: 'Poland', BG: 'Bulgaria', EL: 'Greece', FI: 'Finland', HR: 'Croatia', IE: 'Ireland', LT: 'Lithuania', SK: 'Slovakia', CZ: 'Czechia', EE: 'Estonia', HU: 'Hungary', LV: 'Latvia', RO: 'Romania', SE: 'Sweden', CY: 'Cyprus', LU: 'Luxembourg', MT: 'Malta', SI: 'Slovenia', CH: 'Switzerland' }, freq: { monthly: 'monthly', weekly: 'weekly', quarterly: 'quarterly', annual: 'annual', semiannual: 'twice a year' } },
    fr: { title: 'Production et commerce par pays', sub: 'Espagne (prix à la production, engrais et aliments depuis 1990), France (cotations des céréales et des viandes, prix payés aux producteurs, FranceAgriMer), Allemagne (lait, abattage, fruits et légumes, indices ; BLE et Destatis), Belgique (lait, abattages, indices de prix ; Statbel), Autriche (prix agricoles, lait, abattages et cultures ; Eurostat), Portugal (indices de prix, lait, viande, cultures et cheptel ; INE), Canada (récoltes, stocks, cheptel, produits laitiers et revenu agricole ; Statistics Canada) et production, abattages, cultures, coûts et exportations du Danemark, des Pays-Bas et de l’Australie, avec données officielles et historique complet.',
      country: 'Pays', group: 'Type', series: 'Série', range: 'Période', all: 'Tous', fish: 'Pêche et aquaculture', production: 'Production et abattages', crops: 'Cultures', trade: 'Commerce extérieur', costs: 'Coûts d’exploitation', prices_lv: 'Prix de l’élevage', quotes: 'Cotations de marché', milk: 'Lait (prix et volumes)', milk_regions: 'Lait : prix par région', crops_regions: 'Cultures par région', meat_regions: 'Abattage : prix par région', prices_paid: 'Prix payés aux producteurs', prices_fv: 'Prix des fruits et légumes', inputs_f: 'Prix des engrais payés', inputs_a: 'Prix des aliments payés', idx_perc: 'Indices des prix reçus', idx_pag: 'Indices des prix payés', incub: 'Couvoirs (volailles)', inputs: 'Prix des intrants', prices: 'Prix et indices', livestock: 'Recensement du cheptel', environment: 'Fumier et environnement', organic: 'Agriculture biologique', climate: 'Climat', stocks: 'Stocks', income: 'Recettes et revenu agricole', rates: 'Taux d’intérêt et de change', partners: 'Partenaires commerciaux', latest: 'Dernière donnée', change: 'Var. vs précédent', period: 'Période', unit: 'Unité',
      r6m: '6 mois', r1: '1 an', r3: '3 ans', r5: '5 ans', r10: '10 ans', r20: '20 ans', rmax: 'Maximum', date: 'Date', table: 'Voir toutes les séries', src: 'Source', lic: 'Licence', updated: 'Mis à jour', note: 'Données officielles telles que publiées par chaque source ; les noms des séries restent en anglais. Les exportations australiennes sont en valeur (dollars australiens), pas en volume. La dernière période peut être provisoire.', none: 'Aucune donnée disponible.',
      countries: { US: 'États-Unis', EU: 'Union européenne', ES: 'Espagne', FR: 'France', DE: 'Allemagne', BE: 'Belgique', AT: 'Autriche', PT: 'Portugal', IT: 'Italie', CA: 'Canada', DK: 'Danemark', NL: 'Pays-Bas', AU: 'Australie', UK: 'Royaume-Uni', AR: 'Argentine', CL: 'Chili', UY: 'Uruguay', PL: 'Pologne', BG: 'Bulgarie', EL: 'Grèce', FI: 'Finlande', HR: 'Croatie', IE: 'Irlande', LT: 'Lituanie', SK: 'Slovaquie', CZ: 'Tchéquie', EE: 'Estonie', HU: 'Hongrie', LV: 'Lettonie', RO: 'Roumanie', SE: 'Suède', CY: 'Chypre', LU: 'Luxembourg', MT: 'Malte', SI: 'Slovénie', CH: 'Suisse' }, freq: { monthly: 'mensuelle', weekly: 'hebdomadaire', quarterly: 'trimestrielle', annual: 'annuelle', semiannual: 'semestrielle' } },
    it: { title: 'Produzione e commercio per paese', sub: 'Spagna (prezzi alla produzione, fertilizzanti e mangimi dal 1990), Francia (quotazioni di cereali e carne, prezzi pagati ai produttori, FranceAgriMer), Germania (latte, macellazione, frutta e ortaggi, indici; BLE e Destatis), Belgio (latte, macellazioni, indici dei prezzi; Statbel), Austria (prezzi agricoli, latte, macellazioni e colture; Eurostat), Portogallo (indici dei prezzi, latte, carne, colture e bestiame; INE), Canada (raccolti, scorte, bestiame, latticini e reddito agricolo; Statistics Canada) e produzione, macellazioni, colture, costi ed esportazioni di Danimarca, Paesi Bassi e Australia, con dati ufficiali e storico completo.',
      country: 'Paese', group: 'Tipo', series: 'Serie', range: 'Periodo', all: 'Tutti', fish: 'Pesca e acquacoltura', production: 'Produzione e macellazioni', crops: 'Colture', trade: 'Commercio estero', costs: 'Costi aziendali', prices_lv: 'Prezzi zootecnici', quotes: 'Quotazioni di mercato', milk: 'Latte (prezzi e volumi)', milk_regions: 'Latte: prezzo per regione', crops_regions: 'Colture per regione', meat_regions: 'Macellazione: prezzo per regione', prices_paid: 'Prezzi pagati ai produttori', prices_fv: 'Prezzi di frutta e ortaggi', inputs_f: 'Prezzi dei fertilizzanti pagati', inputs_a: 'Prezzi dei mangimi pagati', idx_perc: 'Indici dei prezzi ricevuti', idx_pag: 'Indici dei prezzi pagati', incub: 'Incubatoi (avicoli)', inputs: 'Prezzi degli input', prices: 'Prezzi e indici', livestock: 'Censimento del bestiame', environment: 'Letame e ambiente', organic: 'Agricoltura biologica', climate: 'Clima', stocks: 'Scorte', income: 'Ricavi e reddito agricolo', rates: 'Tassi di interesse e di cambio', partners: 'Partner commerciali', latest: 'Ultimo dato', change: 'Var. vs precedente', period: 'Periodo', unit: 'Unità',
      r6m: '6 mesi', r1: '1 anno', r3: '3 anni', r5: '5 anni', r10: '10 anni', r20: '20 anni', rmax: 'Massimo', date: 'Data', table: 'Vedi tutte le serie', src: 'Fonte', lic: 'Licenza', updated: 'Aggiornato', note: 'Dati ufficiali come pubblicati da ciascuna fonte; i nomi delle serie restano in inglese. Le esportazioni australiane sono in valore (dollari australiani), non in volume. L’ultimo periodo può essere provvisorio.', none: 'Nessun dato disponibile.',
      countries: { US: 'Stati Uniti', EU: 'Unione europea', ES: 'Spagna', FR: 'Francia', DE: 'Germania', BE: 'Belgio', AT: 'Austria', PT: 'Portugal', IT: 'Italia', CA: 'Canada', DK: 'Danimarca', NL: 'Paesi Bassi', AU: 'Australia', UK: 'Regno Unito', AR: 'Argentina', CL: 'Cile', UY: 'Uruguay', PL: 'Polonia', BG: 'Bulgaria', EL: 'Grecia', FI: 'Finlandia', HR: 'Croazia', IE: 'Irlanda', LT: 'Lituania', SK: 'Slovacchia', CZ: 'Cechia', EE: 'Estonia', HU: 'Ungheria', LV: 'Lettonia', RO: 'Romania', SE: 'Svezia', CY: 'Cipro', LU: 'Lussemburgo', MT: 'Malta', SI: 'Slovenia', CH: 'Svizzera' }, freq: { monthly: 'mensile', weekly: 'settimanale', quarterly: 'trimestrale', annual: 'annuale', semiannual: 'semestrale' } }
  };
  var MACRO = null, WAGES = null, ECBR = null, DATA = null, ST = { c: 'ES', g: 'all', s: null, r: 'max', fx: false, real: false };
  /* Bloques largos de la ficha (comercio por socio, mapa IFAP): se pliegan en un <details> cerrado con título y una línea que explica qué son.
     El contenedor interior conserva su id, así el módulo se monta igual y sus repintados no pierden el pliegue. */
  var FOLD_T = {
    tp: { es: ['Comercio por producto y socio', 'Principales socios comerciales de cada producto, con su cuota y la variación sobre el año anterior.'], en: ['Trade by product and partner', 'Main trading partners for each product, with their share and the change on the previous year.'], fr: ['Commerce par produit et partenaire', 'Principaux partenaires commerciaux de chaque produit, avec leur part et la variation sur un an.'], it: ['Commercio per prodotto e partner', 'Principali partner commerciali di ogni prodotto, con la quota e la variazione sull’anno precedente.'] },
    ifap: { es: ['Mapa de parcelas y cultivos (IFAP)', 'Parcelas declaradas en Portugal y su cultivo; acerca el mapa para verlas.'], en: ['Parcel and crop map (IFAP)', 'Declared parcels in Portugal and their crop; zoom in to see them.'], fr: ['Carte des parcelles et cultures (IFAP)', 'Parcelles déclarées au Portugal et leur culture ; zoomez pour les voir.'], it: ['Mappa di parcelle e colture (IFAP)', 'Parcelle dichiarate in Portogallo e relativa coltura; ingrandisci per vederle.'] }
  };
  function foldBox(id, key) {
    var t = (FOLD_T[key][lang()] || FOLD_T[key].es);
    return '<details class="di-fold di-fold-x" data-fold="' + id + '"><summary><h3 class="cof-h2" style="margin:0 0 4px;font-size:17px">' + t[0] + '</h3><p class="di-movers-hint" style="margin:0">' + t[1] + '</p></summary><div id="' + id + '"></div></details>';
  }
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function TL(l) { return window.DIClear ? window.DIClear.tl(l, lang()) : l; }
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
    var t = tt(), years = { '1m': 1 / 12, '6m': 0.5, '1': 1, '3': 3, '5': 5, '10': 10, '20': 20 }[ST.r], pts = s.points.slice();
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
    if (/^(CAD|C\$)/.test(u)) return 'CAD'; if (/^(A\$|AUD)/.test(u)) return 'AUD'; if (/^DKK/.test(u)) return 'DKK'; if (/^CHF/.test(u)) return 'CHF'; if (/^(USD|US\$|\$)/.test(u)) return 'USD'; if (/^(GBP|£)/.test(u)) return 'GBP'; return null;
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
    o.unit = sr.unit.replace(/^(CAD|C\$|A\$|AUD|DKK|CHF|USD|US\$|\$|GBP|£)/, 'EUR'); o._fx = { from: cu, orig: sr, miss: miss }; return o;
  }
  function fxBox(cur0, cur) {
    if (!FX || !curOf(cur0.unit)) return ''; var w = FXT[lang()] || FXT.es;
    return '<label style="display:block;font-size:12.5px;margin:0 0 8px"><input type="checkbox" id="ps-fx"' + (ST.fx ? ' checked' : '') + '> ' + esc(w[0]) + ' (' + esc(curOf(cur0.unit)) + ' → EUR)</label>' +
      (ST.fx && cur._fx ? '<div class="di-movers-hint" style="margin:0 0 6px">' + esc(w[1]) + ' ' + nf(cur0.latest, dec(cur0.latest)) + ' ' + esc(cur0.unit) + (cur._fx.miss ? '. ' + esc(w[2]) : '') + '</div>' : '');
  }

  /* Precios reales: deflactados con el IPC del pais (data/cpi.json, bajo demanda); el valor publicado no cambia */
  var RCPI = null, RCT = {
    es: ['Precios reales (ajustados por la inflación)', 'Deflactado con {src} ({base}) y expresado en precios de {ref}: valor × IPC de {ref} ÷ IPC del periodo. Es un cálculo nuestro, no un dato publicado; original:', '{n} puntos sin IPC disponible se omiten.', 'Desmarca la casilla para ver los valores publicados (nominales).', 'Sin IPC utilizable para esta serie (el país no lo tiene en la frecuencia que hace falta); se muestran los valores publicados.', 'precios de {ref}'],
    en: ['Real prices (inflation-adjusted)', 'Deflated with {src} ({base}) and expressed in {ref} prices: value × CPI of {ref} ÷ CPI of the period. This is our own calculation, not a published figure; original:', '{n} points without an available CPI are omitted.', 'Untick to see the published (nominal) values.', 'No usable CPI for this series (the country has none at the frequency needed); published values are shown.', '{ref} prices'],
    fr: ['Prix réels (corrigés de l’inflation)', 'Déflaté avec {src} ({base}) et exprimé en prix de {ref} : valeur × IPC de {ref} ÷ IPC de la période. C’est un calcul de notre part, pas une donnée publiée ; original :', '{n} points sans IPC disponible sont omis.', 'Décochez pour voir les valeurs publiées (nominales).', 'Pas d’IPC utilisable pour cette série (le pays n’en a pas à la fréquence requise) ; les valeurs publiées sont affichées.', 'prix de {ref}'],
    it: ['Prezzi reali (corretti per l’inflazione)', 'Deflazionato con {src} ({base}) ed espresso in prezzi di {ref}: valore × IPC di {ref} ÷ IPC del periodo. È un calcolo nostro, non un dato pubblicato; originale:', '{n} punti senza IPC disponibile vengono omessi.', 'Deseleziona per vedere i valori pubblicati (nominali).', 'Nessun IPC utilizzabile per questa serie (il paese non ne ha alla frequenza necessaria); si mostrano i valori pubblicati.', 'prezzi di {ref}']
  };
  var RSRC = { eurostat: 'Eurostat HICP', ons: 'ONS CPI', bls: 'BLS CPI-U', statcan: 'Statistics Canada CPI', indec: 'INDEC IPC', world_bank_wdi: 'World Bank CPI' };
  function rfill(x, o) { return String(x).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function rref(r) { return r.kind === 'm' && /^\d{4}-\d{2}$/.test(r.ref) ? plabel(r.ref, 'monthly') : r.ref; }
  function realConv(sr) {
    if (!RCPI || !window.DehesaChart || !window.DehesaChart.real || !window.DehesaChart.real.can(ST.c, sr.unit)) return sr;
    var d = window.DehesaChart.real.deflate(ST.c, sr.points, sr.frequency); if (!d) { var z = {}, kk; for (kk in sr) z[kk] = sr[kk]; z._realNo = true; return z; }
    var pts = d.points, o = {}, k; for (k in sr) o[k] = sr[k];
    o.points = pts; o.latestPeriod = pts[pts.length - 1][0]; o.latest = pts[pts.length - 1][1]; o.changePct = pts.length > 1 && pts[pts.length - 2][1] ? (o.latest - pts[pts.length - 2][1]) / Math.abs(pts[pts.length - 2][1]) * 100 : null;
    o.unit = sr.unit + ' · ' + rfill((RCT[lang()] || RCT.es)[5], { ref: rref(d) }); o._real = { orig: sr, d: d }; return o;
  }
  function realBox(cur0, cur) {
    if (!window.DehesaChart || !window.DehesaChart.real || !window.DehesaChart.real.can(ST.c, cur0.unit)) return ''; var w = RCT[lang()] || RCT.es, r = cur._real;
    var cite = r && window.DICite && window.DICite.derived ? window.DICite.derived([r.d.src], { what: 'CPI deflation' }) : '';
    return '<label style="display:block;font-size:12.5px;margin:0 0 8px"><input type="checkbox" id="ps-real"' + (ST.real ? ' checked' : '') + (ST.fx ? ' disabled' : '') + '> ' + esc(w[0]) + '</label>' +
      (ST.real && r ? '<div class="di-movers-hint" style="margin:0 0 6px">' + esc(rfill(w[1], { src: RSRC[r.d.src] || r.d.name, base: r.d.base, ref: rref(r.d) })) + ' ' + nf(cur0.latest, dec(cur0.latest)) + ' ' + esc(cur0.unit) + (r.d.miss ? '. ' + esc(rfill(w[2], { n: r.d.miss })) : '') + ' ' + esc(w[3]) + cite + '</div>' : '') +
      (ST.real && RCPI && cur._realNo ? '<div class="di-movers-hint" style="margin:0 0 6px">' + esc(w[4]) + '</div>' : '');
  }
  fetch('data/fx-history.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.currencies) { FX = d; if (DATA) build(); } }).catch(function () {});
  var PS = null,
    LV = { es: ['Linaje del dato', 'Fichero', 'último cambio', 'próxima ejecución prevista', 'última ejecución'], en: ['Data lineage', 'File', 'last change', 'next run due', 'last run'], fr: ['Lignage de la donnée', 'Fichier', 'dernier changement', 'prochaine exécution prévue', 'dernière exécution'], it: ['Lignaggio del dato', 'File', 'ultima modifica', 'prossima esecuzione prevista', 'ultima esecuzione'] };
  function dshort(i) { try { return new Date(i).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return String(i).slice(0, 10); } }
  function lineage(cur) { return '<div id="ps-lin">' + lineageIn(cur) + '</div>'; }
  function lineageIn(cur) {
    if (!PS || !cur || !cur.source) return ''; var f = 'data/' + cur.source, p = null, e = null, v = LV[lang()] || LV.es;
    PS.pipelines.forEach(function (x) { (x.files || []).forEach(function (y) { if (y.path === f && !p) { p = x; e = y; } }); }); if (!p) return '';
    return '<p class="di-movers-hint">' + v[0] + ': ' + v[1] + ' <code>' + esc(f) + '</code>' + (e.lastChange ? ' · ' + v[2] + ' ' + esc(dshort(e.lastChange)) : '') + (p.last ? ' · ' + v[4] + ' ' + esc(dshort(p.last.startedAt)) : '') + (p.nextRun ? ' · ' + v[3] + ' ' + esc(dshort(p.nextRun)) : '') + ' · <a href="status.html">status</a></p>';
  }
  var REV = [], RV = { es: ['Cambios históricos detectados', 'antes', 'ahora', 'detectado'], en: ['Historical changes detected', 'was', 'now', 'detected'], fr: ['Changements d’historique détectés', 'avant', 'maintenant', 'détecté'], it: ['Cambi nello storico rilevati', 'prima', 'ora', 'rilevato'] };
  function revBox(cur) { return '<div id="ps-rev">' + revBoxIn(cur) + '</div>'; }
  function revBoxIn(cur) {
    var r = REV.filter(function (x) { return x.series === ST.c + '/' + cur.id; }).slice(0, 5); if (!r.length) return '';
    var v = RV[lang()] || RV.es;
    return '<div class="di-movers-hint" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px"><b>' + v[0] + '</b>' + r.map(function (x) { return '<div>' + esc(plabel(x.period, cur.frequency)) + ': ' + v[1] + ' ' + nf(x.old, dec(x.old)) + ' → ' + v[2] + ' <b>' + nf(x.new, dec(x.new)) + '</b>' + (x.pct == null ? '' : ' (' + (x.pct > 0 ? '+' : '') + nf(x.pct, 1) + ' %)') + ' · ' + v[3] + ' ' + esc(String(x.detectedAt).slice(0, 10)) + '</div>'; }).join('') + '</div>';
  }
  var CURX = null;
  function fill() { var x = CURX; if (!x) return; var a = document.getElementById('ps-lin'), r = document.getElementById('ps-rev'); if (a) a.innerHTML = lineageIn(x.cur0); if (r) r.innerHTML = revBoxIn(x.cur); }   // sin repintar la ficha: no cierra lo que el usuario acaba de abrir
  // Linaje y revisiones son detalle de la serie: se descargan al primer gesto o cuando la seccion de fuentes esta cerca, no al abrir la ficha
  (function () {
    var done = false, ev = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
    function go(e0) {
      if (e0 && e0.type === 'scroll' && e0.target !== document && e0.target !== window) return;   // el scroll interno de una lista (p. ej. el selector de series) no cuenta como gesto del usuario
      if (done) return; done = true; ev.forEach(function (e) { window.removeEventListener(e, go, true); });
      fetch('data/pipeline-status.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) { PS = d; fill(); } }).catch(function () {});
      fetch('data/revisions.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.revisions) { REV = d.revisions; fill(); } }).catch(function () {});
    }
    ev.forEach(function (e) { window.addEventListener(e, go, { capture: true, passive: true }); });
  })();
  function watchBtn(cur) {
    if (!window.DIWatch) return ''; var w = DIWatch.labels[lang()] || DIWatch.labels.es, on = DIWatch.has(ST.c, cur.id);
    return ' <button type="button" id="ps-watch" aria-pressed="' + on + '" style="float:right;margin:-4px 0 0 8px;padding:3px 10px;border:1px solid var(--border);border-radius:999px;background:' + (on ? '#e3f0e5' : 'transparent') + ';color:inherit;font:inherit;font-size:12px;letter-spacing:0;cursor:pointer">' + esc(on ? w.following : w.follow) + '</button>';
  }
  var RM_T = { es: ['Perfiles por estado', 'Perfiles por provincia o territorio', 'Pulsa un estado para ver todo lo que tenemos de él: sequía, cultivos, ganado en cebaderos, precios locales de grano, ganado y heno, fertilizantes, seguro agrario, impuestos y clima.', 'Pulsa una provincia o territorio para ver todo lo que tenemos de él: sequía, cultivos, ganado, renta, ingresos y costes de las explotaciones, precios de referencia, combustible, seguro agrario, subastas (Manitoba) y clima.'], en: ['Profiles by state', 'Profiles by province or territory', 'Select a state to see everything we have on it: drought, crops, cattle on feed, local grain, cattle and hay prices, fertilizers, crop insurance, taxes and weather.', 'Select a province or territory to see everything we have on it: drought, crops, livestock, farm income, receipts and costs, reference prices, fuel, crop insurance, auctions (Manitoba) and weather.'], fr: ['Profils par État', 'Profils par province ou territoire', 'Sélectionnez un État pour voir tout ce que nous avons sur lui : sécheresse, cultures, bovins en engraissement, prix locaux des céréales, du bétail et du foin, engrais, assurance récolte, taxes et climat.', 'Sélectionnez une province ou un territoire pour voir tout ce que nous avons : sécheresse, cultures, élevage, revenu, recettes et coûts des exploitations, prix de référence, carburant, assurance récolte, enchères (Manitoba) et climat.'], it: ['Profili per Stato', 'Profili per provincia o territorio', 'Seleziona uno Stato per vedere tutto ciò che abbiamo su di esso: siccità, colture, bovini in ingrasso, prezzi locali di cereali, bestiame e fieno, fertilizzanti, assicurazione sui raccolti, imposte e clima.', 'Seleziona una provincia o un territorio per vedere tutto ciò che abbiamo: siccità, colture, bestiame, reddito, ricavi e costi delle aziende, prezzi di riferimento, carburante, assicurazione sui raccolti, aste (Manitoba) e clima.'] };
  var RM_EU = {}; RM_EU.AU = {es: ['Perfiles por estado o territorio', 'Pulsa un estado o territorio para ver sus exportaciones agroalimentarias por producto (ABS).'], en: ['Profiles by state or territory', 'Select a state or territory to see its agri-food exports by product (ABS).'], fr: ['Profils par État ou territoire', 'Sélectionnez un État ou un territoire pour voir ses exportations agroalimentaires par produit (ABS).'], it: ['Profili per stato o territorio', 'Seleziona uno stato o un territorio per vedere le sue esportazioni agroalimentari per prodotto (ABS).']};
  (function () { var E = {"ES": {"es": ["Perfiles por comunidad autónoma", "Pulsa una comunidad para ver todo lo que tenemos de ella: producción y renta agraria, cultivos por grupo, censo ganadero, sacrificio, leche, explotaciones, costes (RECAN) y clima (MAPA, Eurostat)."], "en": ["Profiles by autonomous community", "Select a community to see everything we have on it: output and farm income, crops by group, livestock census, slaughter, milk, farm structure, costs (RECAN) and weather (MAPA, Eurostat)."], "fr": ["Profils par communauté autonome", "Sélectionnez une communauté pour voir tout ce que nous avons : production et revenu agricoles, cultures par groupe, cheptel, abattages, lait, exploitations, coûts (RECAN) et climat (MAPA, Eurostat)."], "it": ["Profili per comunità autonoma", "Seleziona una comunità per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture per gruppo, censimento del bestiame, macellazioni, latte, aziende, costi (RECAN) e clima (MAPA, Eurostat)."]}, "FR": {"es": ["Perfiles por región", "Pulsa una región para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat), restricciones de agua por departamento (VigiEau), estado del maíz (FranceAgriMer) y clima."], "en": ["Profiles by region", "Select a region to see everything we have on it: output and farm income, crops, livestock and milk, farm structure (Eurostat), water restrictions by département (VigiEau), maize condition (FranceAgriMer) and weather."], "fr": ["Profils par région", "Sélectionnez une région pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat), restrictions d’eau par département (VigiEau), état du maïs (FranceAgriMer) et climat."], "it": ["Profili per regione", "Seleziona una regione per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, bestiame e latte, aziende (Eurostat), restrizioni idriche per dipartimento (VigiEau), stato del mais (FranceAgriMer) e clima."]}, "IT": {"es": ["Perfiles por región", "Pulsa una región para ver su perfil: producción y renta agraria, cultivos, ganado y leche y estructura de las explotaciones (Eurostat)."], "en": ["Profiles by region", "Select a region to see its profile: output and farm income, crops, livestock and milk, and farm structure (Eurostat)."], "fr": ["Profils par région", "Sélectionnez une région pour voir son profil : production et revenu agricoles, cultures, élevage et lait, structure des exploitations (Eurostat)."], "it": ["Profili per regione", "Seleziona una regione per vedere il suo profilo: produzione e reddito agricolo, colture, bestiame e latte, struttura delle aziende (Eurostat)."]}, "DE": {"es": ["Perfiles por Land", "Pulsa un Land para ver todo lo que tenemos de él: producción y renta agraria, explotaciones (Eurostat), cosecha por cultivo, precio y arrendamiento de la tierra, sacrificio y huevos (Destatis), precios de la leche y el ganado (BLE) y clima."], "en": ["Profiles by Land (federal state)", "Select a Land to see everything we have on it: output and farm income, farm structure (Eurostat), harvest by crop, land prices and rents, slaughter and eggs (Destatis), milk and livestock prices (BLE) and weather."], "fr": ["Profils par Land", "Sélectionnez un Land pour voir tout ce que nous avons : production et revenu agricoles, exploitations (Eurostat), récolte par culture, prix et fermage des terres, abattages et œufs (Destatis), prix du lait et du bétail (BLE) et climat."], "it": ["Profili per Land", "Seleziona un Land per vedere tutto ciò che abbiamo: produzione e reddito agricolo, aziende (Eurostat), raccolto per coltura, prezzi e affitti dei terreni, macellazioni e uova (Destatis), prezzi del latte e del bestiame (BLE) e clima."]}}; for (var k in E) RM_EU[k] = E[k]; })();
  RM_EU.NL = {"es": ["Perfiles por provincia", "Pulsa una provincia para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche (Eurostat), cultivos herbáceos, explotaciones y ganado (CBS) y clima."], "en": ["Profiles by province", "Select a province to see everything we have on it: output and farm income, crops, livestock and milk (Eurostat), arable crops, farms and livestock (CBS) and weather."], "fr": ["Profils par province", "Sélectionnez une province pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait (Eurostat), grandes cultures, exploitations et cheptel (CBS) et climat."], "it": ["Profili per provincia", "Seleziona una provincia per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, bestiame e latte (Eurostat), seminativi, aziende e bestiame (CBS) e clima."]}; RM_EU.AT = {"es": ["Perfiles por estado federado", "Pulsa un estado federado (Land) para ver su perfil: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat)."], "en": ["Profiles by federal state", "Select a federal state (Land) to see its profile: output and farm income, crops, livestock and milk, farm structure (Eurostat)."], "fr": ["Profils par Land", "Sélectionnez un Land pour voir son profil : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat)."], "it": ["Profili per Land", "Seleziona un Land per vedere il suo profilo: produzione e reddito agricolo, colture, bestiame e latte, aziende (Eurostat)."]};
  RM_EU.BE = {"es": ["Perfiles por provincia", "Pulsa una provincia para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat) y clima."], "en": ["Profiles by province", "Select a province to see everything we have on it: output and farm income, crops, livestock and milk, farm structure (Eurostat) and weather."], "fr": ["Profils par province", "Sélectionnez une province pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat) et climat."], "it": ["Profili per provincia", "Seleziona una provincia per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, bestiame e latte, aziende (Eurostat) e clima."]};
  RM_EU.DK = {"es": ["Perfiles por región", "Pulsa una región para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat) y clima."], "en": ["Profiles by region", "Select a region to see everything we have on it: output and farm income, crops, livestock and milk, farm structure (Eurostat) and weather."], "fr": ["Profils par région", "Sélectionnez une région pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat) et climat."], "it": ["Profili per regione", "Seleziona una regione per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, bestiame e latte, aziende (Eurostat) e clima."]};
  RM_EU.PL = {"es": ["Perfiles por voivodía", "Pulsa una voivodía para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat)."], "en": ["Profiles by voivodeship", "Select a voivodeship to see everything we have on it: output and farm income, crops, livestock and milk, farm structure (Eurostat)."], "fr": ["Profils par voïvodie", "Sélectionnez une voïvodie pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat)."], "it": ["Profili per voivodato", "Seleziona un voivodato per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, allevamento e latte, aziende agricole (Eurostat)."]};
  RM_EU.PT = {"es": ["Perfiles por región", "Pulsa una región para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat)."], "en": ["Profiles by region", "Select a region to see everything we have on it: output and farm income, crops, livestock and milk, farm structure (Eurostat)."], "fr": ["Profils par région", "Sélectionnez une région pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat)."], "it": ["Profili per regione", "Seleziona una regione per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, allevamento e latte, aziende agricole (Eurostat)."]};
  RM_EU.CH = {"es": ["Perfiles por gran región", "Pulsa una gran región para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat)."], "en": ["Profiles by major region", "Select a major region to see everything we have on it: output and farm income, crops, livestock and milk, farm structure (Eurostat)."], "fr": ["Profils par grande région", "Sélectionnez une grande région pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat)."], "it": ["Profili per grande regione", "Seleziona una grande regione per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, allevamento e latte, aziende agricole (Eurostat)."]};
  RM_EU.IE = {"es": ["Perfiles por región", "Pulsa una región para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat)."], "en": ["Profiles by region", "Select a region to see everything we have on it: output and farm income, crops, livestock and milk, farm structure (Eurostat)."], "fr": ["Profils par région", "Sélectionnez une région pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat)."], "it": ["Profili per regione", "Seleziona una regione per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, allevamento e latte, aziende agricole (Eurostat)."]};
  RM_EU.EL = {"es": ["Perfiles por región", "Pulsa una región para ver todo lo que tenemos de ella: producción y renta agraria, cultivos, ganado y leche, explotaciones (Eurostat)."], "en": ["Profiles by region", "Select a region to see everything we have on it: output and farm income, crops, livestock and milk, farm structure (Eurostat)."], "fr": ["Profils par région", "Sélectionnez une région pour voir tout ce que nous avons : production et revenu agricoles, cultures, élevage et lait, exploitations (Eurostat)."], "it": ["Profili per regione", "Seleziona una regione per vedere tutto ciò che abbiamo: produzione e reddito agricolo, colture, allevamento e latte, aziende agricole (Eurostat)."]};
  RM_EU.FI = RM_EU.BG = RM_EU.HR = RM_EU.LT = RM_EU.SK = RM_EU.CZ = RM_EU.HU = RM_EU.RO = RM_EU.SE = RM_EU.SI = RM_EU.EL; RM_EU.UK = {"es": ["Perfiles por región", "Pulsa una región (las 12 regiones NUTS 1: nueve de Inglaterra, Gales, Escocia e Irlanda del Norte) para ver lo que publica Eurostat de ella. Eurostat dejó de recibir datos del Reino Unido tras el Brexit: las cifras llegan como mucho a 2019-2020."], "en": ["Profiles by region", "Select a region (the 12 NUTS 1 regions: nine in England, Wales, Scotland and Northern Ireland) to see what Eurostat publishes on it. Eurostat stopped receiving UK data after Brexit: figures end in 2019-2020 at the latest."], "fr": ["Profils par région", "Sélectionnez une région (les 12 régions NUTS 1 : neuf en Angleterre, le pays de Galles, l’Écosse et l’Irlande du Nord) pour voir ce qu’Eurostat publie. Eurostat ne reçoit plus de données du Royaume-Uni depuis le Brexit : les chiffres s’arrêtent au plus tard en 2019-2020."], "it": ["Profili per regione", "Seleziona una regione (le 12 regioni NUTS 1: nove in Inghilterra, Galles, Scozia e Irlanda del Nord) per vedere cosa pubblica Eurostat. Dopo la Brexit Eurostat non riceve più dati del Regno Unito: le cifre arrivano al massimo al 2019-2020."]};
  RM_EU.CL = {es: ['Regiones de Chile', 'Pasa el ratón por una región para ver su nombre. Dehesa Index todavía no publica series regionales de Chile (los datos oficiales que usamos son nacionales), así que el mapa no se colorea ni enlaza: no inventamos cifras por región.'], en: ['Regions of Chile', 'Hover over a region to see its name. Dehesa Index does not yet publish regional series for Chile (the official data we use are national), so the map is neither coloured nor linked: we do not invent regional figures.'], fr: ['Régions du Chili', 'Survolez une région pour voir son nom. Dehesa Index ne publie pas encore de séries régionales pour le Chili (les données officielles que nous utilisons sont nationales) ; la carte n’est donc ni colorée ni liée : nous n’inventons pas de chiffres régionaux.'], it: ['Regioni del Cile', 'Passa il mouse su una regione per vederne il nome. Dehesa Index non pubblica ancora serie regionali per il Cile (i dati ufficiali che usiamo sono nazionali), quindi la mappa non è colorata né collegata: non inventiamo cifre regionali.']};
  RM_EU.UY = {"es": ["Perfiles por departamento", "Pulsa un departamento para ver su ganado y el precio de su tierra (DICOSE y MGAP). El mapa se colorea con esos mismos datos; los contornos son generalizados (Natural Earth), no los límites oficiales."], "en": ["Profiles by department", "Click a department to see its livestock and land prices (DICOSE and MGAP). The map is coloured with the same data; outlines are generalised (Natural Earth), not the official boundaries."], "fr": ["Profils par département", "Cliquez sur un département pour voir son cheptel et le prix de ses terres (DICOSE et MGAP). La carte est colorée avec les mêmes données ; les contours sont généralisés (Natural Earth), non les limites officielles."], "it": ["Profili per dipartimento", "Fai clic su un dipartimento per vedere il bestiame e il prezzo della terra (DICOSE e MGAP). La mappa è colorata con gli stessi dati; i contorni sono generalizzati (Natural Earth), non i confini ufficiali."]};
  RM_EU.AR = {"es": ["Perfiles por provincia", "Pulsa una provincia para ver sus cultivos extensivos: superficie sembrada, producción y rendimiento por campaña (Ministerio de Agricultura, Estimaciones agrícolas)."], "en": ["Profiles by province", "Select a province to see its field crops: area sown, production and yield by season (Ministry of Agriculture, crop estimates)."], "fr": ["Profils par province", "Sélectionnez une province pour voir ses grandes cultures : surface semée, production et rendement par campagne (ministère de l’Agriculture, estimations agricoles)."], "it": ["Profili per provincia", "Seleziona una provincia per vedere le sue colture estensive: superficie seminata, produzione e resa per campagna (Ministero dell’Agricoltura, stime agricole)."]};
  var REGMAP = { US: 1, CA: 1, ES: 1, FR: 1, IT: 1, DE: 1, AU: 1, NL: 1, AT: 1, BE: 1, DK: 1, PL: 1, PT: 1, CH: 1, IE: 1, EL: 1, FI: 1, BG: 1, HR: 1, LT: 1, SK: 1, CZ: 1, HU: 1, RO: 1, SE: 1, SI: 1, UK: 1, AR: 1, CL: 1, UY: 1 };
  function rmName(cc, s) { var N = window.DehesaRegionNames && window.DehesaRegionNames[cc], v = N && N[s.id]; if (!v) return s.name || s.id; var p = v.split('|'), L = { en: 0, es: 1, fr: 2, it: 3 }[lang()]; return p[L == null ? 1 : L] || p[0]; }
  var HL = { es: 'Todas las regiones en una página: cifras y enlaces', en: 'All regions on one page: figures and links', fr: 'Toutes les régions sur une page : chiffres et liens', it: 'Tutte le regioni in una pagina: cifre e link' };
  function hubLink(cc) { var U = window.DehesaRegionUrls, h = U && U.hub(cc, lang()); return h ? '<p class="di-movers-hint" style="margin:8px 0 0;text-align:center"><a href="' + h + '">' + esc(HL[lang()] || HL.es) + ' →</a></p>' : ''; }
  /* «Ver los datos de» manda también en el mapa: con Agricultura solo se ofrecen medidas agrícolas, con Ganadería las ganaderas; lo común (producción total, jefes de explotación, sequía...) solo en «Todo». Si el sector no tiene ninguna medida por región (la pesca, hoy en todos los países), se dice y el mapa no se colorea. */
  var RMS = { es: ['No tenemos datos de {s} por región en {c}: el mapa queda sin colorear. Para verlo coloreado, elige «Todo» u otro sector arriba.', 'pesca', 'agricultura', 'ganadería'], en: ['We have no regional {s} data for {c}, so the map is not coloured. Choose “All” or another sector above to colour it.', 'fisheries', 'agriculture', 'livestock'], fr: ['Nous n’avons pas de données régionales de {s} pour ce pays ({c}) : la carte n’est pas coloriée. Choisissez « Tout » ou un autre secteur ci-dessus.', 'pêche', 'agriculture', 'élevage'], it: ['Non abbiamo dati regionali di {s} per {c}: la mappa non è colorata. Scegli «Tutto» o un altro settore qui sopra.', 'pesca', 'agricoltura', 'allevamento'] };
  function metricSel(cc) { var R = window.DehesaRegionMetrics; if (!R) return ''; var all = R.list(cc), sec = window.DehesaSector ? window.DehesaSector.get() : 'all', L = sec === 'all' ? all : all.filter(function (m) { return m.sec === sec; }); if (!all.length) return '';
    if (!L.length) { var w = RMS[lang()] || RMS.es; return '<p class="di-movers-hint ps-rm-nosec" style="margin:0 0 8px">' + esc(w[0].replace('{s}', w[{ fish: 1, agri: 2, live: 3 }[sec] || 1]).replace('{c}', tt().countries[cc] || cc)) + '</p>'; }
    var pref = { live: ['animal', 'cattle', 'milk', 'beef'], agri: ['crop', 'wheat', 'uaa'], all: ['output'] }[sec] || [], d = L[0].id; pref.some(function (p) { return L.some(function (m) { if (m.id === p) { d = p; return true; } }); }); return R.selectHtml(cc, lang(), 'ps-metric', d, L); }
  function paintReg(cc, el) {
    var R = window.DehesaRegionMetrics, sel = document.getElementById('ps-metric'), svg = el.querySelector('svg'), lg = document.getElementById('ps-legend'); if (!R || !svg || !lg) return;
    var run = function () { R.paint(svg, cc, sel ? sel.value : '', lang(), '').then(function (h) { lg.innerHTML = h; listVals(el, svg); }); };
    if (sel) sel.onchange = run;
    // el coloreado descarga datos (hasta ~400 KB): solo cuando la tarjeta entra en pantalla, para no pesar en la carga inicial
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); run(); } }, { rootMargin: '200px' }); io.observe(svg); } else run();
  }
  var RMX = { es: { title: 'Regiones de {c}', hint: 'Pasa el ratón por una región para ver su dato; púlsala para abrir todo lo que tenemos de ella.', list: 'Todas las regiones', open: 'Abrir' },
    en: { title: 'Regions of {c}', hint: 'Hover over a region to see its figure; select it to open everything we have on it.', list: 'All regions', open: 'Open' },
    fr: { title: 'Régions : {c}', hint: 'Survolez une région pour voir son chiffre ; sélectionnez-la pour ouvrir tout ce que nous avons sur elle.', list: 'Toutes les régions', open: 'Ouvrir' },
    it: { title: 'Regioni: {c}', hint: 'Passa il mouse su una regione per vedere il suo dato; selezionala per aprire tutto ciò che abbiamo su di essa.', list: 'Tutte le regioni', open: 'Apri' } };
  // nombre y valor de cada región (el <title> del contorno lo rellena region-metrics.js al colorear: «Nombre — valor»)
  function rmText(a) { var ti = a.querySelector('title'); return ti ? ti.textContent : ''; }
  function bindHover(el, nolink) {
    var info = el.querySelector('#ps-rm-info'), X = RMX[lang()] || RMX.es; if (!info) return;
    var on = function (r) { [].forEach.call(el.querySelectorAll('[data-r]'), function (a) { a.classList.toggle('is-on', a.getAttribute('data-r') === r); }); };
    var show = function (e) { var a = e.target.closest ? e.target.closest('[data-r]') : null; if (!a) return; var r = a.getAttribute('data-r'), m = el.querySelector('svg a[data-r="' + r + '"]'); info.textContent = (m ? rmText(m) : a.textContent) + (nolink ? '' : ' · ' + X.open + ' →'); on(r); };
    var hide = function () { info.textContent = nolink ? '' : X.hint; on(''); };
    el.addEventListener('mouseover', show); el.addEventListener('focusin', show); el.addEventListener('mouseleave', hide);
  }
  function listVals(el, svg) {
    [].forEach.call(svg.querySelectorAll('a[data-r]'), function (a) { var r = a.getAttribute('data-r'), li = el.querySelector('.ps-rm-list a[data-r="' + r + '"] .v'), tx = rmText(a), k = tx.indexOf(' — '); if (li) li.textContent = k > 0 ? tx.slice(k + 3) : ''; });
  }
  function regMap(cc) {
    var key = { US: 'DEHESA_US_STATES', CA: 'DEHESA_CA_PROVINCES', ES: 'DEHESA_ES_CCAA', FR: 'DEHESA_FR_REGIONS', IT: 'DEHESA_IT_REGIONS', DE: 'DEHESA_DE_LAENDER', AU: 'DEHESA_AU_STATES', NL: 'DEHESA_NL_PROVINCES', AT: 'DEHESA_AT_LAENDER', BE: 'DEHESA_BE_PROVINCES', DK: 'DEHESA_DK_REGIONS', PL: 'DEHESA_PL_VOIVODESHIPS', PT: 'DEHESA_PT_REGIONS', CH: 'DEHESA_CH_REGIONS', IE: 'DEHESA_IE_REGIONS', EL: 'DEHESA_EL_REGIONS', FI: 'DEHESA_FI_REGIONS', BG: 'DEHESA_BG_REGIONS', HR: 'DEHESA_HR_REGIONS', LT: 'DEHESA_LT_REGIONS', SK: 'DEHESA_SK_REGIONS', CZ: 'DEHESA_CZ_REGIONS', HU: 'DEHESA_HU_REGIONS', RO: 'DEHESA_RO_REGIONS', SE: 'DEHESA_SE_REGIONS', SI: 'DEHESA_SI_REGIONS', UK: 'DEHESA_UK_REGIONS', AR: 'DEHESA_AR_PROVINCES', CL: 'DEHESA_CL_REGIONS', UY: 'DEHESA_UY_DEPTS' }[cc], src = { US: 'vendor/us-states.js', CA: 'vendor/ca-provinces.js', ES: 'vendor/es-ccaa.js', FR: 'vendor/fr-regions.js', IT: 'vendor/it-regions.js', DE: 'vendor/de-laender.js', AU: 'vendor/au-states.js', NL: 'vendor/nl-provinces.js', AT: 'vendor/at-laender.js', BE: 'vendor/be-provinces.js', DK: 'vendor/dk-regions.js', PL: 'vendor/pl-voivodeships.js', PT: 'vendor/pt-regions.js', CH: 'vendor/ch-regions.js', IE: 'vendor/ie-regions.js', EL: 'vendor/el-regions.js', FI: 'vendor/fi-regions.js', BG: 'vendor/bg-regions.js', HR: 'vendor/hr-regions.js', LT: 'vendor/lt-regions.js', SK: 'vendor/sk-regions.js', CZ: 'vendor/cz-regions.js', HU: 'vendor/hu-regions.js', RO: 'vendor/ro-regions.js', SE: 'vendor/se-regions.js', SI: 'vendor/si-regions.js', UK: 'vendor/uk-regions.js', AR: 'vendor/ar-provinces.js', CL: 'vendor/cl-regions.js', UY: 'vendor/uy-departments.js' }[cc];
    var draw = function () { var el = document.getElementById('ps-regmap'), M = window[key]; if (!el || !M) return; var t = RM_T[lang()] || RM_T.es, i = cc === 'US' ? 0 : 1; if (RM_EU[cc]) { var te = RM_EU[cc][lang()] || RM_EU[cc].es; t = [te[0], te[0], te[1], te[1]]; i = 0; }
      var NL = cc === 'CL', hr = function (s) { return NL ? '' : ' href="region.html?c=' + cc + '&amp;r=' + s.id + '"'; }, X = RMX[lang()] || RMX.es, ids = M.states.slice().sort(function (a, b) { return rmName(cc, a).localeCompare(rmName(cc, b), lang()); });
      el.innerHTML = '<section class="di-card ps-rm"><h2 class="ps-rm-h">' + esc(X.title.replace('{c}', tt().countries[cc] || cc)) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t[2 + i]) + '</p>' +
        '<div class="ps-rm-grid"><div class="ps-rm-map">' + metricSel(cc) + '<p class="ps-rm-info" id="ps-rm-info" aria-live="polite">' + esc(NL ? '' : X.hint) + '</p><svg viewBox="' + M.viewBox + '"' + (NL ? ' style="display:block;margin:0 auto;height:min(70vh,620px);width:auto;max-width:100%"' : '') + ' role="group" aria-label="' + esc(t[i]) + '">' + M.states.map(function (s) { return '<a' + hr(s) + ' data-r="' + s.id + '"><path d="' + s.d + '" fill="#cfd8cc" stroke="#fff" stroke-width="1"><title>' + esc(rmName(cc, s)) + '</title></path></a>'; }).join('') + '</svg><div id="ps-legend"></div></div>' +
        '<nav class="ps-rm-list" aria-label="' + esc(X.list) + '"><div class="ps-rm-lh">' + esc(X.list) + ' <span>(' + ids.length + ')</span></div><ul>' + ids.map(function (s) { return '<li><a' + hr(s) + ' data-r="' + s.id + '"><span class="n">' + esc(rmName(cc, s)) + '</span><span class="v"></span></a></li>'; }).join('') + '</ul></nav></div>' + hubLink(cc) + '</section>';
      bindHover(el, NL); paintReg(cc, el); };
    var loadJs = function (src, then) { var x = document.createElement('script'); x.src = src; x.onload = then; x.onerror = then; document.head.appendChild(x); };
    var go = function () { var step = function () { if (window.DehesaRegionNames) draw(); else loadJs('js/region-names.js', draw); }; if (window.DehesaRegionMetrics) step(); else loadJs('js/region-metrics.js?v=20261021', step); };
    if (window[key]) go(); else { var sc = document.createElement('script'); sc.src = src; sc.onload = go; document.head.appendChild(sc); }
  }
  function build() {
    var root = document.getElementById('paises-body'); if (!root || !DATA) return;
    var tok = ++TOK; setTab();
    loadCountry(ST.c).then(function () { return prep(); }).then(function () { if (tok === TOK) render(); }).catch(function () { if (tok === TOK) root.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
  }
  function selectedList(c) {
    var list = c.series.filter(function (s) { return ST.g === 'all' || s.group === ST.g; });
    if (REQS && ST.s === REQS && ST.g === 'all' && !list.some(function (s) { return s.id === ST.s; })) { SNOTE = { k: 'gone', id: REQS }; REQS = ''; }
    if (!list.some(function (s) { return s.id === ST.s; })) ST.s = list.length ? ((window.DIExplorer && window.DIExplorer.first({ list: list, collapse: collapse, t: tt(), lang: lang() })) || list[0].id) : null;
    return list;
  }
  function pt(s) { return DISeries.series(s.cc, s.id).then(function (f) { s.points = f.points; }).catch(function () {}); }
  /* Grupos del selector en el orden de la vista de sector (js/sector.js) */
  function groupOpts(groups, t) {
    var SEC = window.DehesaSector, lab = function (k) { return k === 'all' ? t.all : t[k]; }, one = function (k) { return '<option value="' + esc(k) + '"' + (k === ST.g ? ' selected' : '') + '>' + esc(lab(k)) + '</option>'; };
    if (!SEC || SEC.get() === 'all') return groups.map(one).join('');
    var cur = SEC.get(), oth = SEC.others ? SEC.others() : [SEC.other()], by = { agri: [], live: [], fish: [], common: [] };
    groups.forEach(function (g) { if (g !== 'all') by[SEC.ofGroup(g)].push(g); });
    return one('all') + [cur, 'common'].concat(oth).filter(function (k) { return by[k].length; }).map(function (k) { return '<optgroup label="' + esc(SEC.label(k)) + '">' + by[k].map(one).join('') + '</optgroup>'; }).join('');
  }
  /* EE. UU.: totales NASS/ERS (js/us-depth.js), solo en esta ficha */
  function usDepth() {
    var el = document.getElementById('ps-us'); if (!el) return;
    var go = function () { if (window.DehesaUsDepth) window.DehesaUsDepth.render(el); };
    var load = function (src, then) { var x = document.createElement('script'); x.src = src; x.onload = then; x.onerror = then; document.head.appendChild(x); };
    if (window.DehesaUsDepth) go(); else load(window.DehesaRegionMore ? 'js/us-depth.js' : 'js/region-more.js', function () { if (window.DehesaUsDepth) go(); else load('js/us-depth.js', go); });
  }
  function sectorUp() {
    var SEC = window.DehesaSector, bar = document.getElementById('ps-sector'), det = document.getElementById('ps-detail'); if (!SEC || !bar) return;
    var reb = function () { var y = window.pageYOffset; build(); setTimeout(function () { try { window.scrollTo(0, y); } catch (e) {} }, 0); };
    bar.innerHTML = SEC.barHtml(); SEC.bind(bar, reb); SEC.bind(document.getElementById('pp-sum-sec'), reb);   // la misma elección también desde «En pocas palabras»
    if (!det || SEC.get() === 'all') return;
    var hide = [].filter.call(det.children, function (el) { return el.id && !SEC.visible(SEC.ofDetail(el.id)); }); if (!hide.length) return;
    var wrap = document.createElement('div'); wrap.innerHTML = SEC.foldHtml(hide.length, ''); var fold = wrap.firstChild; if (!fold) return;
    hide.forEach(function (el) { fold.appendChild(el); }); det.appendChild(fold);
  }
  function groupsOf(c) { return ['all'].concat(GROUPS.filter(function (g) { return c.series.some(function (s) { return s.group === g; }); })); }
  /* Solo se descargan los trozos que se pintan */
  function prep() {
    var c = DATA.countries[ST.c], list = selectedList(c), cur0 = list.filter(function (s) { return s.id === ST.s; })[0], need = [];
    if (cur0) {
      need.push(cur0); var k = lvKey(cur0);
      if (k) { var nat = null; c.series.forEach(function (x) { if (!nat && x.group !== cur0.group && k.nat.test(x.label)) nat = x; }); if (nat) { need.push(nat); c.series.forEach(function (x) { var kk = x.group === cur0.group && lvKey(x); if (kk && kk.key === k.key && x.latestPeriod === cur0.latestPeriod) need.push(x); }); } }
    }
    if (window.DIProfile) { try { window.DIProfile.kpis(ST.c, c.series, groupsOf(c)).forEach(function (s) { need.push(s); }); } catch (e) {} }
    var seen = {}; return Promise.all(need.filter(function (s) { if (!s || s.points || seen[s.cc + s.id]) return false; seen[s.cc + s.id] = 1; return true; }).map(pt)).then(function () { return window.DIExplorer ? cmpPrep() : null; });
  }
  /* Migas + barra de secciones */
  var FRL = { es: ['Cifras clave', 'Comercio', 'Gráfico y series', 'Detalle del país', 'Fuentes y metodología', 'Inicio', 'Países', 'Preguntas', 'Regiones', 'Sequía', 'Emisiones', 'Pesca', 'Jefes de explotación', 'Censo agrario', 'Más datos'], en: ['Key numbers', 'Trade', 'Chart and series', 'Country detail', 'Sources and methodology', 'Home', 'Countries', 'Questions', 'Regions', 'Drought', 'Emissions', 'Fisheries', 'Farm managers', 'Farm census', 'More data'], fr: ['Chiffres clés', 'Commerce', 'Graphique et séries', 'Détail du pays', 'Sources et méthodologie', 'Accueil', 'Pays', 'Questions', 'Régions', 'Sécheresse', 'Émissions', 'Pêche', 'Chefs d’exploitation', 'Recensement agricole', 'Autres données'], it: ['Cifre chiave', 'Commercio', 'Grafico e serie', 'Dettaglio del paese', 'Fonti e metodologia', 'Home', 'Paesi', 'Domande', 'Regioni', 'Siccità', 'Emissioni', 'Pesca', 'Capi azienda', 'Censimento agricolo', 'Altri dati'] };
  /* Marco comun: «Datos propios del pais» y avisos de secciones que faltan */
  var OWN = { es: ['Datos propios del país', 'Todavía no hay bloques propios de este país; debajo están el perfil agrario y el comercio por producto y socio, iguales en todas las fichas.'], en: ['Country-specific data', 'No country-specific blocks yet; below are the farm profile and trade by product and partner, the same on every country page.'], fr: ['Données propres au pays', 'Pas encore de blocs propres à ce pays ; ci-dessous, le profil agricole et le commerce par produit et partenaire, identiques sur chaque fiche.'], it: ['Dati specifici del paese', 'Ancora nessun blocco specifico per questo paese; sotto trovi il profilo agricolo e il commercio per prodotto e partner, uguali in ogni scheda.'] };
  var TPN = { es: 'Todavía no hay comercio por producto y socio de este país en Dehesa Index.', en: 'Dehesa Index does not show trade by product and partner for this country yet.', fr: 'Dehesa Index n’affiche pas encore le commerce par produit et partenaire pour ce pays.', it: 'Dehesa Index non mostra ancora il commercio per prodotto e partner per questo paese.' };
  var SLOT = { reg: { es: 'Dehesa Index aún no tiene un mapa de regiones de este país.', en: 'Dehesa Index does not have a regions map for this country yet.', fr: 'Dehesa Index n’a pas encore de carte des régions pour ce pays.', it: 'Dehesa Index non ha ancora una mappa delle regioni per questo paese.' } };
  function slotNote(id, key) {
    var el = document.getElementById(id); if (!el || el.firstElementChild) return; var X = RMX[lang()] || RMX.es;
    el.innerHTML = '<section class="di-card ps-rm"><h2 class="ps-rm-h">' + esc(X.title.replace('{c}', tt().countries[ST.c] || ST.c)) + '</h2><p class="di-movers-hint" style="margin:0">' + esc(SLOT[key][lang()] || SLOT[key].es) + '</p></section>';
  }
  /* lleva al gráfico completo (explorador) y lo mantiene a la vista mientras los bloques de más arriba terminan de cargarse y mueven la página */
  function goExplorer() {
    /* Fija el explorador en pantalla hasta que la página se asiente (los bloques de arriba cargan y cambian la altura). Solo cancela una acción real del usuario
       pasado un margen de 700 ms: la inercia del trackpad o del dedo justo después de pulsar no cuenta. Con ResizeObserver se realinea en cada cambio de altura. */
    var t0 = Date.now(), stop = false, evs = ['wheel', 'touchmove', 'keydown'], timer = 0, ro = null;
    var done = function () { if (stop) return; stop = true; evs.forEach(function (ev) { window.removeEventListener(ev, off, true); }); if (ro) { try { ro.disconnect(); } catch (e) {} } clearInterval(timer); };
    var off = function (e) { if (Date.now() - t0 < 700) return; if (e && e.type === 'wheel' && Math.abs(e.deltaY || 0) < 4) return; done(); };
    evs.forEach(function (ev) { window.addEventListener(ev, off, { capture: true, passive: true }); });
    var align = function () { if (stop) return; var e = document.getElementById('ps-explorer'); if (!e) return; var d = e.getBoundingClientRect().top - 120; if (Math.abs(d) > 2) window.scrollBy(0, d); };
    align();
    var rt = document.getElementById('paises-body'); if (window.ResizeObserver && rt) { try { ro = new ResizeObserver(function () { align(); }); ro.observe(rt); } catch (e) {} }
    timer = setInterval(function () { align(); if (Date.now() - t0 > 4500) done(); }, 120);
    [0, 60, 250, 700, 1500].forEach(function (ms) { setTimeout(align, ms); });
  }
  function frameUp(c) {
    var F = window.DehesaShared && window.DehesaShared.frame, L = FRL[lang()] || FRL.es; if (!F) return;
    var nm = tt().countries[ST.c] || c.name || ST.c;
    F.crumbs(document.getElementById('pa-crumbs'), [[L[5], 'index.html'], [L[6], 'paises.html'], [nm, null]]);
    var hasId = function (id) { return !!document.getElementById(id); }, more = null;
    /* tierra/regadío y gasóleo agrícola: solo cuentan si el hueco ya tiene contenido (el hueco vacío se crea siempre) */
    var DIESEL = ['pp-fr-gnr', 'pp-de-diesel', 'pp-it-fuel', 'pp-pl-diesel', 'pp-be-diesel', 'pp-at-diesel', 'pp-hr-diesel', 'pp-ie-diesel', 'pp-nl-diesel', 'pp-pt-diesel', 'pp-eu-diesel'];
    var hasC = function (id) { var e = document.getElementById(id); return !!(e && e.firstElementChild && e.offsetHeight > 2); };
    var diesel = null; DIESEL.forEach(function (id) { if (!diesel && hasC(id)) diesel = id; });
    var CLIMID = 'pp-' + String(ST.c).toLowerCase() + '-clim';   /* lluvia y temperatura por región (FR, DE y los países con la rejilla de NASA POWER) */
    var MORE = [CLIMID, 'pp-forecast', 'pp-eu-nit', 'pp-land-es', 'pp-gi', 'pp-eu-tariff'], extra = [];
    if (hasId('pp-eu-land') && !document.getElementById('pp-eu-land').hidden) extra.push('pp-eu-land'); if (diesel) extra.push(diesel);
    if (hasId('pp-census') || hasId('pp-managers') || hasId('pp-eu-tariff')) MORE.concat(extra).forEach(function (id) { if (!more && (hasId(id) || extra.indexOf(id) >= 0)) more = id; });
    /* lo que cuelga de «Comercio» en el orden de la página: cada bloque largo con su propio apartado (pesca, edad de los jefes, censo agrario, resto) */
    var ML = { es: { 'pp-forecast': 'Previsiones de producción de carne', 'pp-eu-nit': 'Nitratos en el agua', 'pp-land-es': 'Precio de la tierra y cánones', 'pp-gi': 'Denominaciones de origen', 'pp-eu-tariff': 'Aranceles en vigor' }, en: { 'pp-forecast': 'Meat production forecasts', 'pp-eu-nit': 'Nitrates in water', 'pp-land-es': 'Land prices and rents', 'pp-gi': 'Protected designations of origin', 'pp-eu-tariff': 'Tariff measures in force' }, fr: { 'pp-forecast': 'Prévisions de production de viande', 'pp-eu-nit': 'Nitrates dans l’eau', 'pp-land-es': 'Prix des terres et fermages', 'pp-gi': 'Appellations d’origine', 'pp-eu-tariff': 'Mesures tarifaires en vigueur' }, it: { 'pp-forecast': 'Previsioni di produzione di carne', 'pp-eu-nit': 'Nitrati nell’acqua', 'pp-land-es': 'Prezzo della terra e canoni', 'pp-gi': 'Denominazioni di origine', 'pp-eu-tariff': 'Misure tariffarie in vigore' } }[lang()] || {};
    var XL = { es: ['Tierra y regadío', 'Gasóleo agrícola'], en: ['Land and irrigation', 'Agricultural diesel'], fr: ['Terres et irrigation', 'Gazole agricole'], it: ['Terra e irrigazione', 'Gasolio agricolo'] }[lang()] || ['Tierra y regadío', 'Gasóleo agrícola'];
    ML[CLIMID] = ({ es: 'Lluvia y temperatura', en: 'Rainfall and temperature', fr: 'Pluie et température', it: 'Pioggia e temperatura' })[lang()] || 'Lluvia y temperatura';
    var moreSubs = function () { var r = MORE.filter(hasId).map(function (id) { return [id, ML[id] || id]; }); if (extra.indexOf('pp-eu-land') >= 0) r.push(['pp-eu-land', XL[0]]); if (diesel) r.push([diesel, XL[1]]); return r; };
    F.bar(document.getElementById('pa-bar'), nm, [['ps-regmap', L[8]], ['pp-kpi', L[0]], ['pp-trade', L[1]], ['pp-eu-econ', ({ es: 'Economía agraria', en: 'Farm economics', fr: 'Économie agricole', it: 'Economia agricola' })[lang()]], ['pp-fish', L[11]], ['pp-managers', L[12]], ['pp-census', L[13]], [more || 'pp-more-none', L[14], moreSubs()], ['pp-ask', L[7]], ['ps-explorer', L[2]], ['ps-detail', L[3]], ['ps-drought', L[9]], ['ps-ghg', L[10]], ['ps-sources', L[4]]]); /* misma barra, mismo orden en todos los paises */
  }
  /* Denominaciones de origen (vinos y quesos, eAmbrosia): bloque propio que se carga solo si el pais tiene fichero (js/denominaciones.js) */
  /* Sequia del pais (js/country-drought.js): solo ese pais; la pagina completa sigue en sequia.html. Se carga a peticion y, si hay datos, se anade a la barra. */
  /* Sequía y emisiones van después del detalle del país y justo antes de «Fuentes»; los huecos vacíos pp-drought-slot / pp-ghg-slot se quedan junto al comercio como puntos de anclaje del resto de bloques */
  function lateBox(id, after) {
    var s = document.getElementById('ps-sources'); if (!s || !s.parentNode) return null;
    var el = document.createElement('div'); el.id = id; var ref = after && after.parentNode === s.parentNode ? after.nextSibling : s; s.parentNode.insertBefore(el, ref); return el;
  }
  /* Ficha de la UE: economía agraria y aranceles entre Comercio y Preguntas; sequía y clima en su sitio habitual (módulos de costes.html, sequia.html y aranceles) */
  function euPageUp() {
    var tr = document.getElementById('pp-trade'), lg = lang(); if (!tr || !tr.parentNode) return;
    var js = function (src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); };
    var eco = document.createElement('div'); eco.id = 'pp-eu-econ'; eco.innerHTML = '<section id="eucs" class="cof" aria-live="polite" style="margin-top:28px"></section>'; tr.parentNode.insertBefore(eco, tr.nextSibling);
    var tar = document.createElement('div'); tar.id = 'pp-eu-tariff'; tar.style.minHeight = '1px'; eco.parentNode.insertBefore(tar, eco.nextSibling);
    nearView(eco, function () { if (!window.DICite) js('js/cite.js?v=0', function () { js('js/eu-farm-economics.js?v=20261020', function () { frameUp(PAGE_C); }); }); else js('js/eu-farm-economics.js?v=20261020', function () { frameUp(PAGE_C); }); });
    nearView(tar, function () { var go = function () { window.DIEuTariffs.mount(tar, lg).then(function () { frameUp(PAGE_C); }); }; if (window.DIEuTariffs) go(); else js('js/eu-tariffs-panel.js?v=20261020', go); });
    /* Sin cifra agregada de la UE para estos temas (Eurostat solo publica por país): enlaces a las fichas que sí los tienen */
    var LK = { es: ['Datos que solo existen por país', 'Eurostat y las fuentes nacionales no dan una cifra de toda la UE para estos temas; cada país tiene su ficha.', 'Nitratos en el agua', 'Tierra y regadío', 'Gasóleo agrícola'], en: ['Data that only exist by country', 'Eurostat and national sources give no EU-wide figure for these topics; each country has its own page.', 'Nitrates in water', 'Land and irrigation', 'Agricultural diesel'], fr: ['Données qui n’existent que par pays', 'Eurostat et les sources nationales ne donnent pas de chiffre pour toute l’UE sur ces thèmes ; chaque pays a sa fiche.', 'Nitrates dans l’eau', 'Terres et irrigation', 'Gazole agricole'], it: ['Dati che esistono solo per paese', 'Eurostat e le fonti nazionali non danno una cifra per tutta l’UE su questi temi; ogni paese ha la sua scheda.', 'Nitrati nell’acqua', 'Terra e irrigazione', 'Gasolio agricolo'] }[lg] || {};
    var lists = [[2, EUNIT.slice().sort()], [3, LANDCC.slice().sort()], [4, ['FR', 'DE', 'IT', 'PL', 'BE', 'AT', 'HR', 'IE', 'NL', 'PT', 'EL', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'HU', 'LT', 'LU', 'LV', 'MT', 'RO', 'SE', 'SI', 'SK'].sort()]];
    var lk = document.createElement('div'); lk.id = 'pp-eu-bycountry'; var cn = tt().countries || {};
    lk.innerHTML = '<section class="cof" style="margin-top:28px"><h2 class="cof-h2">' + esc(LK[0]) + '</h2><p class="cof-sub">' + esc(LK[1]) + '</p>' + lists.map(function (l) { return '<h3 class="cof-h3">' + esc(LK[l[0]]) + '</h3><p class="cof-note" style="line-height:2">' + l[1].map(function (k) { return '<a href="paises.html?c=' + k + '" style="margin-right:14px;white-space:nowrap">' + flagE(k) + esc(cn[k] || (function () { try { return new Intl.DisplayNames([lg], { type: 'region' }).of(k === 'EL' ? 'GR' : k); } catch (e) { return k; } })()) + '</a>'; }).join('') + '</p>'; }).join('') + '</section>';
    tar.parentNode.insertBefore(lk, tar.nextSibling);
    var dr = lateBox('ps-drought'); if (!dr) return;
    dr.innerHTML = '<section id="eusq" class="cof" aria-live="polite" style="margin-top:28px"></section><section id="eucl" class="cof" aria-live="polite"></section>';
    nearView(dr, function () { js('js/eu-drought.js?v=20261020', function () { js('js/eu-climate.js?v=20261021', function () { frameUp(PAGE_C); }); }); });
  }
  var PAGE_C = null;
  function droughtUp(c) {
    if (ST.c === 'EU') { PAGE_C = c; return euPageUp(); }
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-drought-slot'; tr.parentNode.insertBefore(el, tr.nextSibling);
    el = lateBox('pp-drought-box') || el;
    var go = function () { if (!window.DIDroughtCountry || ST.c !== cc) return; window.DIDroughtCountry.mount(el, cc, tt().countries[cc] || cc, lang()).then(function (ok) { if (ok && ST.c === cc) frameUp(c); }); };
    if (window.DIDroughtCountry) go(); else { var sc = document.createElement('script'); sc.src = 'js/country-drought.js?v=20261026'; sc.onload = go; document.head.appendChild(sc); }
  }
  /* Emisiones del campo (js/es-ghg-agri.js): España con el inventario del MITECO; el resto de la UE con Eurostat env_air_gge. Si el fichero del país no existe, no se pinta nada */
  function ghgUp(c) {
    if (['ES', 'FR', 'DE', 'IT', 'PL', 'BE', 'AT', 'HR', 'IE', 'NL', 'PT', 'CA', 'UY', 'EL', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'HU', 'LT', 'LU', 'LV', 'MT', 'RO', 'SE', 'SI', 'SK', 'CH'].indexOf(ST.c) < 0) return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-ghg-slot'; var after = document.getElementById('pp-drought-slot') || tr; after.parentNode.insertBefore(el, after.nextSibling);
    el = lateBox('pp-ghg-box', document.getElementById('pp-drought-box')) || el;
    var go = function () { if (window.DIEsGHG && ST.c === cc) window.DIEsGHG.mount(el, lang(), cc).then(function (ok) { if (ok && ST.c === cc) frameUp(c); }); };
    if (window.DIEsGHG) go(); else { var sc = document.createElement('script'); sc.src = 'js/es-ghg-agri.js?v=20261018a'; sc.onload = go; document.head.appendChild(sc); }
  }
  /* Francia: gasóleo no de carretera (js/fr-gnr.js) y nitratos en las aguas subterráneas (js/fr-nitrates.js), con el mapa de departamentos compartido */
  function frUp() {
    if (ST.c !== 'FR') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var a = document.createElement('div'); a.id = 'pp-fr-gnr'; var b = document.createElement('div'); b.id = 'pp-fr-nit'; var c = document.createElement('div'); c.id = 'pp-fr-clim';
    after.parentNode.insertBefore(b, after.nextSibling); after.parentNode.insertBefore(a, after.nextSibling); after.parentNode.insertBefore(c, after.nextSibling);   /* clima por departamento (Météo-France, js/fr-climate.js) primero */
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (ST.c !== cc) return; if (window.DIFrClimate) window.DIFrClimate.mount(c, lang()); if (window.DIFrGNR) window.DIFrGNR.mount(a, lang()); if (window.DIFrNitrates) window.DIFrNitrates.mount(b, lang()); };
    var mods = function () { if (window.DIFrGNR && window.DIFrNitrates && window.DIFrClimate) return go(); var n = 0, done = function () { if (++n === 3) go(); }; js('js/fr-gnr.js?v=20261013', done); js('js/fr-nitrates.js?v=20261012', done); js('js/fr-climate.js?v=20261028c', done); };
    if (window.DIFrDeptMap) mods(); else js('js/fr-dept-map.js?v=20261015', mods);
  }
  /* Alemania: gasóleo y devolución Agrardiesel (js/de-diesel.js) */
  function deUp() {
    if (ST.c !== 'DE') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-de-diesel'; after.parentNode.insertBefore(el, after.nextSibling);
    var go = function () { if (window.DIDeDiesel && ST.c === cc) window.DIDeDiesel.mount(el, lang()); };
    if (window.DIDeDiesel) go(); else { var sc = document.createElement('script'); sc.src = 'js/de-diesel.js?v=20261013'; sc.onload = go; document.head.appendChild(sc); }
    /* lluvia y temperatura por Land (medias del DWD; js/fr-climate.js con la configuración de Alemania y el mapa de js/fr-dept-map.js) */
    var cl = document.createElement('div'); cl.id = 'pp-de-clim'; cl.style.minHeight = '1px'; after.parentNode.insertBefore(cl, after.nextSibling);
    var js1 = function (src, ok) { var x = document.createElement('script'); x.src = src; x.onload = ok; document.head.appendChild(x); };
    var goC = function () { if (window.DIFrClimate && ST.c === cc) window.DIFrClimate.mount(cl, lang(), 'DE'); };
    nearView(cl, function () { var m2 = function () { if (window.DIFrClimate) goC(); else js1('js/fr-climate.js?v=20261028c', goC); }; if (window.DIFrDeptMap) m2(); else js1('js/fr-dept-map.js?v=20261015', m2); });
    /* precio de la tierra agrícola por Regierungsbezirk (Destatis 61521-0020; js/de-land-prices.js con el mapa NUTS 2 de vendor/de-nuts2.js) */
    var ld = document.createElement('div'); ld.id = 'pp-de-land'; ld.style.minHeight = '1px'; cl.parentNode.insertBefore(ld, cl.nextSibling);
    var goL = function () { if (window.DIDeLand && ST.c === cc) window.DIDeLand.mount(ld, lang()); };
    nearView(ld, function () { var m3 = function () { if (window.DIDeLand) goL(); else js1('js/de-land-prices.js?v=20261027', goL); }; if (window.DIFrDeptMap) m3(); else js1('js/fr-dept-map.js?v=20261015', m3); });
  }
  /* Italia: gasóleo de automoción y de calefacción y mapa por región (js/it-fuel.js) */
  function itUp() {
    if (ST.c !== 'IT') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-it-fuel'; after.parentNode.insertBefore(el, after.nextSibling);
    var fg = document.createElement('div'); fg.id = 'pp-it-foggia'; after.parentNode.insertBefore(fg, after.nextSibling);   /* Borsa Merci di Foggia (js/it-foggia.js) antes del gasóleo */
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (ST.c !== cc) return; if (window.DIItFoggia) window.DIItFoggia.mount(fg, lang()); if (window.DIItFuel) window.DIItFuel.mount(el, lang()); };
    var mod = function () { var n = 0, done = function () { if (++n === 2) go(); }; if (window.DIItFuel) done(); else js('js/it-fuel.js?v=20261013', done); if (window.DIItFoggia) done(); else js('js/it-foggia.js?v=0', done); };
    if (window.DIFrDeptMap) mod(); else js('js/fr-dept-map.js?v=20261015', mod);
  }
  /* Italia: estadísticas agrarias del ISTAT (js/it-istat.js; precios agrarios, sacrificios, censo ganadero, fertilizantes y fitosanitarios) */
  function itIstatUp() {
    if (ST.c !== 'IT') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-land-fr-it') || document.getElementById('pp-it-fuel') || document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-it-istat'; after.parentNode.insertBefore(el, after.nextSibling);
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (window.DIItIstat && ST.c === cc) window.DIItIstat.mount(el, lang()); };
    var mod = function () { if (window.DIItIstat) go(); else js('js/it-istat.js?v=20261026', go); };
    if (window.ESUI) mod(); else js('js/es-ui.js?v=20261015', mod);
  }
  /* Francia e Italia: precio/valor de la tierra agrícola por departamento/región (js/land-fr-it.js; Italia solo se dibuja si su fichero existe) */
  function landUp() {
    if (ST.c === 'ES') {   /* España: el bloque de insumos.html (MAPA, comunidades y provincias, con mapa) tambien en la ficha del pais */
      var trE = document.getElementById('pp-trade'); if (!trE || !trE.parentNode) return;
      var afE = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || trE;
      var elE = document.createElement('div'); elE.id = 'pp-land-es'; afE.parentNode.insertBefore(elE, afE.nextSibling);
      var goE = function () { if (window.DehesaEsTierra && ST.c === 'ES') window.DehesaEsTierra.render(elE); };
      elE.style.minHeight = '1px'; nearView(elE, function () { if (window.DehesaEsTierra) goE(); else { var scE = document.createElement('script'); scE.src = 'js/es-tierra.js?v=20261015'; scE.onload = goE; document.head.appendChild(scE); } });
      return;
    }
    if (ST.c !== 'FR' && ST.c !== 'IT') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-fr-nit') || document.getElementById('pp-it-fuel') || document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-land-fr-it'; after.parentNode.insertBefore(el, after.nextSibling);
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (window.DILandFrIt && ST.c === cc) window.DILandFrIt.mount(el, lang(), cc); };
    var mod = function () { if (window.DILandFrIt) go(); else js('js/land-fr-it.js?v=20261014', go); };
    if (window.DIFrDeptMap) mod(); else js('js/fr-dept-map.js?v=20261015', mod);
  }
  /* Polonia: gasóleo y devolución del impuesto especial (js/pl-diesel.js) */
  function plUp() {
    if (ST.c !== 'PL') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-pl-diesel'; after.parentNode.insertBefore(el, after.nextSibling);
    var go = function () { if (window.DIPlDiesel && ST.c === cc) window.DIPlDiesel.mount(el, lang()); };
    if (window.DIPlDiesel) go(); else { var sc = document.createElement('script'); sc.src = 'js/pl-diesel.js?v=20261013'; sc.onload = go; document.head.appendChild(sc); }
  }
  /* Polonia: precio de la tierra arable por voivodía (js/land-pl.js, GUS BDL) */
  function plLandUp() {
    if (ST.c !== 'PL') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-pl-diesel') || document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-land-pl'; after.parentNode.insertBefore(el, after.nextSibling);
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (window.DILandPl && ST.c === cc) window.DILandPl.mount(el, lang()); };
    var mod = function () { if (window.DILandPl) go(); else js('js/land-pl.js?v=20261014', go); };
    if (window.DIFrDeptMap) mod(); else js('js/fr-dept-map.js?v=20261015', mod);
  }
  /* Polonia: cultivos, ganado, carne y leche por voivodía (js/regions-pl.js, GUS BDL) */
  function plRegionsUp() {
    if (ST.c !== 'PL') return;
    var base = document.getElementById('pp-land-pl'), cc = ST.c; if (!base || !base.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-regions-pl'; base.parentNode.insertBefore(el, base.nextSibling);
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (window.DIRegionsPl && ST.c === cc) window.DIRegionsPl.mount(el, lang()); };
    var mod = function () { if (window.DIRegionsPl) go(); else js('js/regions-pl.js?v=20261014', go); };
    if (window.DIFrDeptMap) mod(); else js('js/fr-dept-map.js?v=20261015', mod);
  }
  /* Polonia: del campo a la tienda (js/pl-farm-shop.js, GUS BDL) */
  function plFarmShopUp() {
    if (ST.c !== 'PL') return;
    var base = document.getElementById('pp-regions-pl') || document.getElementById('pp-land-pl'), cc = ST.c; if (!base || !base.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-farm-shop-pl'; base.parentNode.insertBefore(el, base.nextSibling);
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (window.DIPlFarmShop && ST.c === cc) window.DIPlFarmShop.mount(el, lang()); };
    if (window.DIPlFarmShop) go(); else js('js/pl-farm-shop.js?v=20261014', go);
  }
  /* Belgica: gasoleo agricola (js/be-diesel.js) y nitratos en Flandes (js/be-nitrates.js) */
  function nordicUp() {
    if (ST.c !== 'SE' && ST.c !== 'DK') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-nordic-weather'; el.style.minHeight = '1px'; after.parentNode.insertBefore(el, after.nextSibling);   // tiempo observado frente a lo normal (SMHI, DMI; js/nordic-weather.js)
    function js(src, ok) { var s3 = document.createElement('script'); s3.src = src; s3.onload = ok; document.head.appendChild(s3); }
    var go = function () { if (window.DINordicWeather && ST.c === cc) window.DINordicWeather.mount(el, lang(), cc); };
    var mod = function () { var run = function () { if (window.DINordicWeather) go(); else js('js/nordic-weather.js?v=0', go); }; if (window.DICite) run(); else js('js/cite.js?v=0', run); };
    nearView(el, function () { if (window.ESUI) mod(); else js('js/es-ui.js?v=20261015', mod); });
  }
  function beUp() {
    if (ST.c !== 'BE') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-be-diesel'; after.parentNode.insertBefore(el, after.nextSibling);
    var el2 = document.createElement('div'); el2.id = 'pp-be-nitrates'; el.parentNode.insertBefore(el2, el.nextSibling);
    var go = function () { if (ST.c !== cc) return; if (window.DIBeDiesel) window.DIBeDiesel.mount(el, lang()); if (window.DIBeNitrates) window.DIBeNitrates.mount(el2, lang()); };
    var n = 0, done = function () { if (++n === 2) go(); }, js = function (src) { var sc = document.createElement('script'); sc.src = src; sc.onload = done; sc.onerror = done; document.head.appendChild(sc); };
    if (window.DIBeDiesel && window.DIBeNitrates) go(); else { js('js/be-diesel.js?v=20261013'); js('js/be-nitrates.js?v=20261013'); }
    /* Belgica: tiempo observado y deficit de precipitacion del KMI-IRM (js/be-weather.js; data/be-weather.json) */
    var el3 = document.createElement('div'); el3.id = 'pp-be-weather'; el3.style.minHeight = '1px'; el2.parentNode.insertBefore(el3, el2.nextSibling);
    function js3(src, ok) { var s3 = document.createElement('script'); s3.src = src; s3.onload = ok; document.head.appendChild(s3); }
    var go3 = function () { if (window.DIBeWeather && ST.c === cc) window.DIBeWeather.mount(el3, lang()); };
    var mod3 = function () { var run = function () { if (window.DIBeWeather) go3(); else js3('js/be-weather.js?v=20261026', go3); }; if (window.DICite) run(); else js3('js/cite.js?v=0', run); };
    nearView(el3, function () { if (window.ESUI) mod3(); else js3('js/es-ui.js?v=20261015', mod3); });
    /* Valonia: superficie por cultivo del parcelario agricola anonimo del SIGEC (js/be-wallonia-crops.js; data/be-wallonia-crops.json) */
    var el4 = document.createElement('div'); el4.id = 'pp-be-wallonia-crops'; el4.style.minHeight = '1px'; el3.parentNode.insertBefore(el4, el3.nextSibling);
    var go4 = function () { if (window.DIBeWalCrops && ST.c === cc) window.DIBeWalCrops.mount(el4, lang()); };
    var mod4 = function () { var run = function () { if (window.DIBeWalCrops) go4(); else js3('js/be-wallonia-crops.js?v=20261026', go4); }; if (window.DICite) run(); else js3('js/cite.js?v=0', run); };
    nearView(el4, function () { if (window.ESUI) mod4(); else js3('js/es-ui.js?v=20261015', mod4); });
  }
  /* Austria: gasoleo y devolucion Agrardiesel (js/at-diesel.js) */
  function atUp() {
    if (ST.c !== 'AT') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-at-diesel'; after.parentNode.insertBefore(el, after.nextSibling);
    var go = function () { if (window.DIAtDiesel && ST.c === cc) window.DIAtDiesel.mount(el, lang()); };
    if (window.DIAtDiesel) go(); else { var sc = document.createElement('script'); sc.src = 'js/at-diesel.js?v=20261013'; sc.onload = go; document.head.appendChild(sc); }
  }
  /* Croacia: precios maximos oficiales del gasoleo y del gasoleo azul agricola (js/hr-diesel.js) */
  function hrUp() {
    if (ST.c !== 'HR') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-hr-diesel'; after.parentNode.insertBefore(el, after.nextSibling);
    var go = function () { if (window.DIHrDiesel && ST.c === cc) window.DIHrDiesel.mount(el, lang()); };
    if (window.DIHrDiesel) go(); else { var sc = document.createElement('script'); sc.src = 'js/hr-diesel.js?v=20261019'; sc.onload = go; document.head.appendChild(sc); }
    /* Croacia: estadística agraria del DZS (js/hr-dzs.js; cultivos por región, ganado, lácteos, índices de precios agrarios y balances; data/hr-dzs/) */
    var el2 = document.createElement('div'); el2.id = 'pp-hr-dzs'; el2.style.minHeight = '1px'; el.parentNode.insertBefore(el2, el.nextSibling);
    function js(src, ok) { var s2 = document.createElement('script'); s2.src = src; s2.onload = ok; document.head.appendChild(s2); }
    var go2 = function () { if (window.DIHrDzs && ST.c === cc) window.DIHrDzs.mount(el2, lang()); };
    var mod2 = function () { var run = function () { if (window.DIHrDzs) go2(); else js('js/hr-dzs.js?v=20261026', go2); }; if (window.DICite) run(); else js('js/cite.js?v=0', run); };
    nearView(el2, function () { if (window.ESUI) mod2(); else js('js/es-ui.js?v=20261015', mod2); });
    /* Croacia por provincia: APPRRR (js/hr-apprrr.js; explotaciones, ARKOD y viñedo de las 21 provincias; data/hr-apprrr/) */
    var el3 = document.createElement('div'); el3.id = 'pp-hr-apprrr'; el3.style.minHeight = '1px'; el2.parentNode.insertBefore(el3, el2.nextSibling);
    var go3 = function () { if (window.DIHrApprrr && ST.c === cc) window.DIHrApprrr.mount(el3, lang()); };
    var mod3 = function () { var run = function () { if (window.DIHrApprrr) go3(); else js('js/hr-apprrr.js?v=20261026', go3); }; if (window.DICite) run(); else js('js/cite.js?v=0', run); };
    nearView(el3, function () { if (window.ESUI) mod3(); else js('js/es-ui.js?v=20261015', mod3); });
  }
  /* Irlanda: gasoleo (Boletin Petrolero UE, despachos de gasoleo marcado e indice de combustibles agrarios del CSO, js/ie-diesel.js) y nitratos/agua (EPA via CSO, js/ie-nitrates.js) */
  function ieUp() {
    if (ST.c !== 'IE') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var a = document.createElement('div'); a.id = 'pp-ie-diesel'; var b = document.createElement('div'); b.id = 'pp-ie-nit';
    after.parentNode.insertBefore(b, after.nextSibling); after.parentNode.insertBefore(a, after.nextSibling);
    var run = function (obj, el, src) { var go = function () { if (window[obj] && ST.c === cc) window[obj].mount(el, lang()); }; if (window[obj]) go(); else { var sc = document.createElement('script'); sc.src = src; sc.onload = go; document.head.appendChild(sc); } };
    run('DIIeDiesel', a, 'js/ie-diesel.js?v=20261020'); run('DIIeNitrates', b, 'js/ie-nitrates.js?v=20261020');
  }
  /* Países Bajos: gasoleo (Boletin Petrolero UE, CBS y precio de compra en explotaciones, js/nl-diesel.js) y nitratos (RIVM LMM y Eurostat, js/nl-nitrates.js) */
  function nlUp() {
    if (ST.c !== 'NL') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var a = document.createElement('div'); a.id = 'pp-nl-diesel'; var b = document.createElement('div'); b.id = 'pp-nl-nit';
    after.parentNode.insertBefore(b, after.nextSibling); after.parentNode.insertBefore(a, after.nextSibling);
    var run = function (obj, el, src) { var go = function () { if (window[obj] && ST.c === cc) window[obj].mount(el, lang()); }; if (window[obj]) go(); else { var sc = document.createElement('script'); sc.src = src; sc.onload = go; document.head.appendChild(sc); } };
    run('DINlDiesel', a, 'js/nl-diesel.js?v=20261021'); run('DINlNitrates', b, 'js/nl-nitrates.js?v=20261021');
  }
  /* Portugal: gasoleo (Boletin Petrolero UE y precio de compra agrario de Eurostat, js/pt-diesel.js) y nitratos (Eurostat, js/pt-nitrates.js) */
  function ptUp() {
    if (ST.c !== 'PT') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var a = document.createElement('div'); a.id = 'pp-pt-diesel'; var b = document.createElement('div'); b.id = 'pp-pt-nit';
    after.parentNode.insertBefore(b, after.nextSibling); after.parentNode.insertBefore(a, after.nextSibling);
    var run = function (obj, el, src) { var go = function () { if (window[obj] && ST.c === cc) window[obj].mount(el, lang()); }; if (window[obj]) go(); else { var sc = document.createElement('script'); sc.src = src; sc.onload = go; document.head.appendChild(sc); } };
    run('DIPtDiesel', a, 'js/pt-diesel.js?v=0'); run('DIPtNitrates', b, 'js/pt-nitrates.js?v=0');
  }
  /* Cifras clave de Irlanda (CSO) y Hungría (KSH): tierra, leche / cosechas y precios (js/farm-headlines.js, data/views/farm-headlines/<CC>.json) */
  function farmHeadUp() {
    if (ST.c !== 'IE' && ST.c !== 'HU') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-farm-head'; el.style.minHeight = '1px'; tr.parentNode.insertBefore(el, tr.nextSibling);
    var go = function () { if (window.DIFarmHeadlines && ST.c === cc) window.DIFarmHeadlines.mount(el, lang(), cc); };
    nearView(el, function () { if (window.DIFarmHeadlines) go(); else { var sc = document.createElement('script'); sc.src = 'js/farm-headlines.js?v=0'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Edad de los jefes de explotación (js/farm-managers.js, data/views/farm-managers.json): 26 países de la UE, Eurostat ef_fsi_agesex */
  var MGRCC = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'DK', 'NL', 'EL', 'IE', 'FI', 'BG', 'HR', 'LT', 'SK', 'CZ', 'EE', 'HU', 'LV', 'RO', 'SE', 'SI'];
  function mgrUp() {
    if (ST.c === 'UK') {   /* Reino Unido: solo Inglaterra (Defra), proporciones por tramo de edad */
      var trU = document.getElementById('pp-trade'), ccU = ST.c; if (!trU || !trU.parentNode) return;
      var elU = document.createElement('div'); elU.id = 'pp-managers'; elU.style.minHeight = '1px'; trU.parentNode.insertBefore(elU, trU.nextSibling);
      var goU = function () { if (window.DIUkFarmersAge && ST.c === ccU) window.DIUkFarmersAge.mount(elU, lang()); };
      nearView(elU, function () { if (window.DIUkFarmersAge) goU(); else { var scU = document.createElement('script'); scU.src = 'js/uk-farmers-age.js?v=0'; scU.onload = goU; document.head.appendChild(scU); } });
      var elS = document.createElement('div'); elS.id = 'pp-uk-structure'; elS.style.minHeight = '1px'; elU.parentNode.insertBefore(elS, elU.nextSibling);
      var goS = function () { if (window.DIUkStructure && ST.c === ccU) window.DIUkStructure.mount(elS, lang()); };
      nearView(elS, function () { if (window.DIUkStructure) goS(); else { var scS = document.createElement('script'); scS.src = 'js/uk-structure.js?v=0'; scS.onload = goS; document.head.appendChild(scS); } });
      return;
    }
    if (MGRCC.indexOf(ST.c) < 0) return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-managers'; el.style.minHeight = '1px'; tr.parentNode.insertBefore(el, tr.nextSibling);
    var go = function () { if (window.DIFarmManagers && ST.c === cc) window.DIFarmManagers.mount(el, lang(), cc); };
    nearView(el, function () { if (window.DIFarmManagers) go(); else { var sc = document.createElement('script'); sc.src = 'js/farm-managers.js?v=0'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Censo agrario de Eurostat (js/farm-census.js, data/views/census/<CC>.json): jefes, mano de obra, tecnología, riego, prácticas del suelo y estructura; 24 países de la UE. Va justo debajo de la edad de los jefes. */
  var CENSUSCC = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'DK', 'NL', 'PL', 'EL', 'IE', 'FI', 'BG', 'HR', 'LT', 'SK', 'CZ', 'EE', 'HU', 'LV', 'RO', 'SE', 'SI'];
  function censusUp() {
    if (CENSUSCC.indexOf(ST.c) < 0) return;
    var prev = document.getElementById('pp-managers') || document.getElementById('pp-trade'), cc = ST.c; if (!prev || !prev.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-census'; el.style.minHeight = '1px'; prev.parentNode.insertBefore(el, prev.nextSibling);
    var go = function () { if (window.DIFarmCensus && ST.c === cc) window.DIFarmCensus.mount(el, lang(), cc); };
    nearView(el, function () { if (window.DIFarmCensus) go(); else { var sc = document.createElement('script'); sc.src = 'js/farm-census.js?v=0'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Mostrar u ocultar bloques de la ficha (js/page-blocks.js): panel con una casilla por bloque; al cambiar, la barra de secciones se rehace */
  function pageBlocks(c) {
    var cc = ST.c, go = function () { if (window.DIPageBlocks && ST.c === cc) window.DIPageBlocks.mount(cc, function () { frameUp(c); }); };
    if (window.DIPageBlocks) go(); else { var sc = document.createElement('script'); sc.src = 'js/page-blocks.js?v=20261022'; sc.onload = go; document.head.appendChild(sc); }
  }
  /* Francia: las restricciones de agua por departamento (VigiEau) van junto a la sequía, no entre los datos propios del país */
  function moveFrWater() {
    var d = document.getElementById('eu-fr-water'), s = document.getElementById('ps-sources'); if (!d || !s || !s.parentNode) return;
    var old = document.getElementById('pp-fr-water-box'); if (old && old.parentNode) old.parentNode.removeChild(old);
    var n = 0, put = function () {
      var dr = document.getElementById('pp-drought-box'); if (!dr && n++ < 10) return false;
      var box = document.createElement('div'); box.id = 'pp-fr-water-box'; box.style.marginTop = '14px'; s.parentNode.insertBefore(box, dr ? dr.nextSibling : s); box.appendChild(d); return true;
    };
    if (!put()) { var t = setInterval(function () { if (put()) clearInterval(t); }, 300); }
  }
  /* Países Bajos · CBS (js/netherlands.js, data/netherlands-more/): facturación trimestral, invernaderos y flores, nitrógeno y política, cadena de precios y otros; se carga al acercarse al bloque */
  function nlMoreUp() {
    if (ST.c !== 'NL') return;
    var cc = ST.c, host = document.getElementById('ps-agri'); if (!host || !host.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-nl-more'; el.style.minHeight = '1px'; host.parentNode.insertBefore(el, host);
    var go = function () { if (window.DINetherlands && ST.c === cc) window.DINetherlands.mount(el); };
    nearView(el, function () { if (window.DINetherlands) go(); else { var sc = document.createElement('script'); sc.src = 'js/netherlands.js?v=20261023'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Bélgica · Statbel (js/belgium.js, data/belgium-more/): ganado y superficies, cosecha, IPC de alimentos, pesca, lácteos y carne; se carga al acercarse al bloque */
  function beMoreUp() {
    if (ST.c !== 'BE') return;
    var cc = ST.c, host = document.getElementById('ps-agri'); if (!host || !host.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-be-more'; el.style.minHeight = '1px'; host.parentNode.insertBefore(el, host);
    var go = function () { if (window.DIBelgium && ST.c === cc) window.DIBelgium.mount(el); };
    nearView(el, function () { if (window.DIBelgium) go(); else { var sc = document.createElement('script'); sc.src = 'js/belgium.js?v=20261023'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Portugal · INE (js/portugal.js, data/portugal-more/): pesca, balances, leche, carne, IPCA, incendios, cultivos por región, fertilizantes y miel; se carga al acercarse al bloque */
  function ptMoreUp() {
    if (ST.c !== 'PT') return;
    var cc = ST.c, host = document.getElementById('ps-agri'); if (!host || !host.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-pt-more'; el.style.minHeight = '1px'; host.parentNode.insertBefore(el, host);
    var go = function () { if (window.DIPortugal && ST.c === cc) window.DIPortugal.mount(el); };
    nearView(el, function () { if (window.DIPortugal) go(); else { var sc = document.createElement('script'); sc.src = 'js/portugal.js?v=20261023'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Polonia · ZSRIR (js/poland.js, data/poland-zsrir/): precios de compra de cereales y colza; se carga al acercarse al bloque */
  function plZsrirUp() {
    if (ST.c !== 'PL') return;
    var cc = ST.c, host = document.getElementById('ps-agri'); if (!host || !host.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-pl-zsrir'; el.style.minHeight = '1px'; host.parentNode.insertBefore(el, host);
    var go = function () { if (window.DIPoland && ST.c === cc) window.DIPoland.mount(el); };
    nearView(el, function () { if (window.DIPoland) go(); else { var sc = document.createElement('script'); sc.src = 'js/poland.js?v=20261023'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Agreste (js/agreste.js, data/france-agreste-more/): empleo, uso del suelo, insumos IPAMPA y vendimia de Francia; se carga al acercarse al bloque */
  function agrUp() {
    if (ST.c !== 'FR') return;
    var cc = ST.c, host = document.getElementById('ps-agri'); if (!host || !host.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-agreste'; el.style.minHeight = '1px'; host.parentNode.insertBefore(el, host);
    var go = function () { if (window.DIAgreste && ST.c === cc) window.DIAgreste.mount(el); };
    nearView(el, function () { if (window.DIAgreste) go(); else { var sc = document.createElement('script'); sc.src = 'js/agreste.js?v=20261022'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Previsiones de producción de carne de Eurostat hasta 2027 (js/eu-forecast.js, data/views/forecast/<CC>.json); solo los países para los que Eurostat publica previsión */
  var FCCC = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'DK', 'NL', 'PL', 'EL', 'IE', 'FI', 'BG', 'HR', 'LT', 'SK', 'CZ', 'EE', 'HU', 'LV', 'RO', 'SE', 'SI'];
  function forecastUp() {
    if (FCCC.indexOf(ST.c) < 0) return;
    var prev = document.getElementById('pp-census') || document.getElementById('pp-managers') || document.getElementById('pp-trade'), cc = ST.c; if (!prev || !prev.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-forecast'; el.style.minHeight = '1px'; prev.parentNode.insertBefore(el, prev.nextSibling);
    var go = function () { if (window.DIEuForecast && ST.c === cc) window.DIEuForecast.mount(el, lang(), cc); };
    var load = function (src, then) { var sc = document.createElement('script'); sc.src = src; sc.onload = then; sc.onerror = then; document.head.appendChild(sc); };
    nearView(el, function () { if (window.DIEuForecast) go(); else if (window.DILabelTl) load('js/eu-forecast.js?v=1', go); else load('js/label-tl.js?v=0', function () { load('js/eu-forecast.js?v=1', go); }); });
  }
  /* Pesca y acuicultura (js/pesca.js, data/views/fish/<CC>.json): 24 países de la UE (Eurostat) y EE. UU. (NOAA). Con el sector «Pesca» sube justo debajo de las cifras clave;
     con «Agricultura» o «Ganadería» se pliega (no se borra), como el resto de bloques de otro sector. */
  var FISHCC = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'DK', 'NL', 'PL', 'EL', 'IE', 'FI', 'BG', 'HR', 'LT', 'SK', 'CZ', 'EE', 'HU', 'LV', 'RO', 'SE', 'SI', 'US'];
  function fishUp() {
    if (FISHCC.indexOf(ST.c) < 0) return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var SEC = window.DehesaSector, sec = SEC ? SEC.get() : 'all', folded = sec === 'agri' || sec === 'live';
    var el = document.createElement('div'); el.id = 'pp-fish'; el.style.minHeight = '1px';
    if (sec === 'fish') tr.parentNode.insertBefore(el, tr); else tr.parentNode.insertBefore(el, tr.nextSibling);
    var go = function () { if (window.DIFish && ST.c === cc) window.DIFish.mountCountry(el, lang(), cc, folded); };
    var load = function (src, then) { var sc = document.createElement('script'); sc.src = src; sc.onload = then; sc.onerror = then; document.head.appendChild(sc); };
    nearView(el, function () { if (window.DIFish) go(); else if (window.DILabelTl) load('js/pesca.js?v=0', go); else load('js/label-tl.js?v=0', function () { load('js/pesca.js?v=0', go); }); });
  }
  /* Bosque y madera (js/bosque.js): incendios (36 países), precio de la madera (SI, CZ, LV, FI, PL) y cortas y daños (CZ, SE, EE, HU); aparece solo si hay dato del país */
  function forestUp() {
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-fish') || tr;
    var el = document.createElement('div'); el.id = 'pp-forest'; el.style.minHeight = '1px'; after.parentNode.insertBefore(el, after.nextSibling);
    var go = function () { if (window.DIForest && ST.c === cc) window.DIForest.mountCountry(el, lang(), cc); };
    var load = function (src, then) { var sc = document.createElement('script'); sc.src = src; sc.onload = then; sc.onerror = then; document.head.appendChild(sc); };
    nearView(el, function () { if (window.DIForest) go(); else if (window.DehesaChart) load('js/bosque.js?v=0', go); else load('js/chart.js?v=0', function () { load('js/bosque.js?v=0', go); }); });
  }
  /* 16 países de la UE sin bloque propio de gasóleo: Boletín Petrolero de la Comisión (js/eu-diesel.js, data/views/diesel-eu/<CC>.json) */
  var EUDIESEL = ['EL', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'HU', 'LT', 'LU', 'LV', 'MT', 'RO', 'SE', 'SI', 'SK'];
  function euDieselUp() {
    if (EUDIESEL.indexOf(ST.c) < 0) return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-eu-diesel'; el.style.minHeight = '1px'; after.parentNode.insertBefore(el, after.nextSibling);
    var go = function () { if (window.DIEuDiesel && ST.c === cc) window.DIEuDiesel.mount(el, lang(), cc); };
    nearView(el, function () { if (window.DIEuDiesel) go(); else { var sc = document.createElement('script'); sc.src = 'js/eu-diesel.js?v=0'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Nitratos en aguas subterráneas y balance de nitrógeno (Eurostat) en 17 países sin bloque propio (js/eu-nitrates.js, data/eu-nitrates.json) */
  /* Grecia: estadísticas agrarias de ELSTAT (js/el-elstat.js; precios en origen, insumos, productos y cuentas por región; data/el-elstat/) */
  /* lluvia y temperatura por región como media de la rejilla de NASA POWER (js/fr-climate.js con la configuración de cada país; data/region-grid-climate/<PAIS>.json) */
  var GRIDCLIM = ['EL', 'ES', 'IT', 'AT', 'BE', 'NL', 'DK', 'RO', 'HU', 'SK'];
  function gridClimUp() {
    if (GRIDCLIM.indexOf(ST.c) < 0) return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-' + cc.toLowerCase() + '-clim'; el.style.minHeight = '1px'; after.parentNode.insertBefore(el, after.nextSibling);
    var js1 = function (src, ok) { var x = document.createElement('script'); x.src = src; x.onload = ok; document.head.appendChild(x); };
    var go = function () { if (window.DIFrClimate && ST.c === cc) window.DIFrClimate.mount(el, lang(), cc); };
    nearView(el, function () { var m = function () { if (window.DIFrClimate) go(); else js1('js/fr-climate.js?v=20261028c', go); }; if (window.DIFrDeptMap) m(); else js1('js/fr-dept-map.js?v=20261015', m); });
  }
  function elUp() {
    if (ST.c !== 'EL') return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-eu-diesel') || document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-el-elstat'; el.style.minHeight = '1px'; after.parentNode.insertBefore(el, after.nextSibling);
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (window.DIElElstat && ST.c === cc) window.DIElElstat.mount(el, lang()); };
    var mod = function () { if (window.DIElElstat) go(); else js('js/el-elstat.js?v=20261019', go); };
    nearView(el, function () { if (window.ESUI) mod(); else js('js/es-ui.js?v=20261015', mod); });
    /* Grecia: leche, sacrificio y lácteos por provincia (js/el-elgo.js; ELGO-Dimitra, data/el-elgo/) */
    var el2 = document.createElement('div'); el2.id = 'pp-el-elgo'; el2.style.minHeight = '1px'; el.parentNode.insertBefore(el2, el.nextSibling);
    var go2 = function () { if (window.DIElElgo && ST.c === cc) window.DIElElgo.mount(el2, lang()); };
    var mod2 = function () { if (window.DIElElgo) go2(); else js('js/el-elgo.js?v=20261026', go2); };
    nearView(el2, function () { if (window.ESUI) mod2(); else js('js/es-ui.js?v=20261015', mod2); });
  }
  var LANDCC = ['FR', 'IT', 'PL', 'PT', 'DE', 'BE', 'HR', 'EL'];
  function euLandUp() {
    if (LANDCC.indexOf(ST.c) < 0) return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-land-fr-it') || document.getElementById('pp-el-elgo') || document.getElementById('pp-el-elstat') || document.getElementById('pp-eu-diesel') || document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-eu-land'; el.style.minHeight = '1px'; after.parentNode.insertBefore(el, after.nextSibling);
    function js(src, ok) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
    var go = function () { if (window.DIEuLand && ST.c === cc) window.DIEuLand.mount(el, lang(), cc); };
    var mod = function () { if (window.DIEuLand) go(); else js('js/eu-land.js?v=20261020', go); };
    nearView(el, function () { if (window.ESUI) mod(); else js('js/es-ui.js?v=20261015', mod); });
  }
  var EUNIT = ['ES', 'DE', 'IT', 'PL', 'AT', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'LT', 'LV', 'RO', 'SE', 'SI', 'SK'];
  function euNitUp() {
    if (EUNIT.indexOf(ST.c) < 0) return;
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var after = document.getElementById('pp-eu-diesel') || document.getElementById('pp-ghg-slot') || document.getElementById('pp-drought-slot') || tr;
    var el = document.createElement('div'); el.id = 'pp-eu-nit'; el.style.minHeight = '1px'; after.parentNode.insertBefore(el, after.nextSibling);
    var go = function () { if (window.DIEuNitrates && ST.c === cc) window.DIEuNitrates.mount(el, lang(), cc); };
    nearView(el, function () { if (window.DIEuNitrates) go(); else { var sc = document.createElement('script'); sc.src = 'js/eu-nitrates.js?v=0'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Carga diferida: el bloque se monta cuando se acerca a la pantalla (16-oct-2026: las denominaciones de España bajaban 96 KB de zonas al abrir la ficha) */
  function nearView(el, fn) {
    if (!el || !('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { io.disconnect(); fn(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
  }
  function giUp() {
    var tr = document.getElementById('pp-trade'), cc = ST.c; if (!tr || !tr.parentNode) return;
    var el = document.createElement('div'); el.id = 'pp-gi'; el.style.minHeight = '1px'; tr.parentNode.insertBefore(el, tr.nextSibling);
    var go = function () { if (window.DIGI && ST.c === cc) window.DIGI.mount(el, cc, lang()); };
    nearView(el, function () { if (window.DIGI) go(); else { var sc = document.createElement('script'); sc.src = 'js/denominaciones.js?v=20261013'; sc.onload = go; document.head.appendChild(sc); } });
  }
  /* Selector de series: buscador + lista con grupos «tema: medida». La etiqueta se acorta quitando solo el nombre de la fuente (Eurostat), que ya se cita bajo el gráfico. */
  var SP = { es: ['Buscar serie', 'p. ej. cebada rendimiento', '{n} de {m} series', 'Sin resultados: prueba con menos palabras.', 'Otras series', 'Variantes de esta serie', 'Las variantes casi idénticas van agrupadas: elige la tuya en «Variantes».', ' variantes'], en: ['Find a series', 'e.g. barley yield', '{n} of {m} series', 'No results: try fewer words.', 'Other series', 'Variants of this series', 'Near-identical variants are grouped: pick yours under “Variants”.', ' variants'], fr: ['Chercher une série', 'ex. orge rendement', '{n} séries sur {m}', 'Aucun résultat : essayez moins de mots.', 'Autres séries', 'Variantes de cette série', 'Les variantes quasi identiques sont regroupées : choisissez la vôtre sous « Variantes ».', ' variantes'], it: ['Cerca una serie', 'es. orzo resa', '{n} serie su {m}', 'Nessun risultato: prova con meno parole.', 'Altre serie', 'Varianti di questa serie', 'Le varianti quasi identiche sono raggruppate: scegli la tua sotto «Varianti».', ' varianti'] };
  function norm(x) { var r = String(x || '').toLowerCase(); try { r = r.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {} return r; }
  function shortLab(x) { if (x._lab) return x._lab; return TL(x.label).replace(/,\s*Eurostat\)/, ')').replace(/\s*\(Eurostat\)/, '').replace(/\s{2,}/g, ' ').trim(); }
  window.DIPaisesLabel = function (t) { return TL(t); };

  /* Variantes casi identicas (trigo y espelta / trigo blando y espelta / ... ; mismo producto en varias plazas): una sola entrada en la lista y las variantes como opcion secundaria */
  var GSTOP = { and: 1, y: 1, et: 1, e: 1, de: 1, of: 1, the: 1 };
  function gtok(k) { return norm(k).split(/[^a-z0-9\-]+/).filter(function (w) { return w && !GSTOP[w]; }); }
  var GNOT = { non: 1, no: 1, not: 1, sin: 1, sans: 1, senza: 1, excluding: 1, excluded: 1, excluido: 1, excluidos: 1, excluida: 1, excluidas: 1, excl: 1, valor: 1, value: 1, valeur: 1, valore: 1, precio: 1, price: 1, prix: 1, prezzo: 1, indice: 1, index: 1, coste: 1, cost: 1, share: 1, cuota: 1 };
  var GGEO = { west: 1, east: 1, north: 1, south: 1, new: 1, occidental: 1, oriental: 1, norte: 1, sur: 1, nord: 1, ouest: 1, est: 1, ovest: 1, nuevo: 1, nueva: 1, nouveau: 1, nouvelle: 1, nuovo: 1, nuova: 1, septentrional: 1, meridional: 1 };
  function gproper(t) { return /(^|\s)[A-ZÁÉÍÓÚÑÜ]/.test(String(t || '').replace(/^\S+\s*/, '')); } /* nombre propio tras la primera palabra: es un lugar (Pays de la Loire), no una variante */
  function gsub(a, b, braw) { /* a es una version mas general de b: contiene todas sus palabras y b anade como mucho 2 calificativos (no un punto cardinal: Virginia no es Virginia Occidental) */
    var i, extra = 0; if (a.length >= b.length || gproper(braw)) return false;
    for (i = 0; i < a.length; i++) if (b.indexOf(a[i]) < 0) return false;
    for (i = 0; i < b.length; i++) if (a.indexOf(b[i]) < 0) { extra++; if (GGEO[b[i]] || GNOT[b[i]]) return false; }
    return extra <= 2;
  }
  function groupInfo(list) {
    var info = list.map(function (x) {
      var l = shortLab(x), i = l.indexOf(': '), k = '', m = l, par = '', pm;
      if (i > 2 && i < 70) { k = l.slice(0, i); m = l.slice(i + 2); pm = /^(.*\S)\s+\(([^()]{1,40})\)$/.exec(m); if (pm && !/[=,]|^[A-Z]{3,}$/.test(pm[2])) { m = pm[1]; par = pm[2]; } }
      else { pm = /^(.*?)\s+\((.+)\)$/.exec(l); if (pm) { k = pm[1]; m = '(' + pm[2] + ')'; } }
      return { x: x, k: k, m: m, par: par, kt: gtok(k) };
    });
    var byM = {}; info.forEach(function (r) { (byM[r.m] = byM[r.m] || []).push(r); });
    Object.keys(byM).forEach(function (m) {
      var ks = {}, roots = {}; byM[m].forEach(function (r) { ks[r.k] = r.kt; });
      Object.keys(ks).forEach(function (k) { var best = k; Object.keys(ks).forEach(function (o) { if (o !== k && ks[o].length && gsub(ks[o], ks[k], k) && (best === k || ks[o].length < ks[best].length)) best = o; }); roots[k] = best; });
      byM[m].forEach(function (r) { r.root = roots[r.k]; });
    });
    var groups = {}, order = [];
    info.forEach(function (r) { r.v = r.k; var key = 'A\u0001' + r.root + '\u0001' + r.m; if (!groups[key]) { groups[key] = { key: key, disp: r.root ? r.root + (r.m.charAt(0) === '(' ? ' ' : ': ') + r.m : r.m, root: r.root, mem: [] }; order.push(groups[key]); } groups[key].mem.push(r); r.g = groups[key]; });
    /* segunda pasada: lo que no se agrupo por el prefijo se agrupa por el producto tras los dos puntos ("Indice de precios: Trigo y espelta (2020=100)") */
    var byT = {};
    info.forEach(function (r) {
      if (r.g.mem.length > 1 || !r.k) return; var m = r.m + (r.par ? ' (' + r.par + ')' : ''), mm = /^(.*?)((?:\s+\(|,\s|\s·\s).*)?$/.exec(m); r.head = mm[1]; r.tail = mm[2] || ''; r.ht = gtok(r.head);
      if (r.ht.length) (byT[r.k + '\u0001' + r.tail] = byT[r.k + '\u0001' + r.tail] || []).push(r);
    });
    Object.keys(byT).forEach(function (t) {
      var rs = byT[t]; if (rs.length < 2) return;
      rs.forEach(function (r) { var best = r; rs.forEach(function (o) { if (o !== r && gsub(o.ht, r.ht, r.head) && (best === r || o.ht.length < best.ht.length)) best = o; }); r.broot = best.head; });
      rs.forEach(function (r) { var key = 'B\u0001' + t + '\u0001' + r.broot; if (!groups[key]) { groups[key] = { key: key, disp: r.k + ': ' + r.broot + r.tail, root: r.k, mem: [] }; order.push(groups[key]); } if (r.g.mem.length === 1) { order.splice(order.indexOf(r.g), 1); } groups[key].mem.push(r); r.g = groups[key]; r.v = r.head; });
    });
    order = order.filter(function (g) { /* un grupo de mas de 8 ya no son "variantes casi iguales" sino productos distintos (cortes, calidades...): se dejan sueltos */
      if (g.mem.length <= 8) return true;
      g.mem.forEach(function (r) { r.g = { key: 'S\u0001' + r.x.id, disp: shortLab(r.x), root: '', mem: [r] }; r.v = r.k; });
      return false;
    });
    return { info: info, groups: order };
  }
  function collapse(list, all, sel) { /* una entrada por grupo; si la serie elegida esta en el grupo, ella es la que se muestra */
    var gi = all._gi || (all._gi = groupInfo(all)), byId = {}, inList = {}, out = [], done = {};
    gi.info.forEach(function (r) { byId[r.x.id] = r; }); list.forEach(function (x) { inList[x.id] = 1; });
    list.forEach(function (x) {
      var r = byId[x.id], g = r.g; if (done[g.key]) return; done[g.key] = 1;
      var rep = g.mem.filter(function (q) { return q.x.id === sel; })[0] || g.mem.slice().sort(function (a, b) { return a.kt.length - b.kt.length || (a.par ? 1 : 0) - (b.par ? 1 : 0); })[0];
      var c = {}, kk; for (kk in rep.x) c[kk] = rep.x[kk];
      c._lab = g.disp; c._n = g.mem.length; c.id = rep.x.id; out.push(c);
    });
    return out;
  }
  function variantsHtml(all, cur) {
    if (!cur) return ''; var gi = groupInfo(all), r = gi.info.filter(function (q) { return q.x.id === cur.id; })[0];
    if (!r || r.g.mem.length < 2) return ''; var q = SP[lang()] || SP.es, g = r.g, vk = {}, vp = {};
    g.mem.forEach(function (m) { vk[m.v] = 1; vp[m.par] = 1; });
    var byK = Object.keys(vk).length > 1, byP = Object.keys(vp).length > 1, dup = {};
    g.mem.forEach(function (m) { var l0 = (byK ? m.v : '') + (byK && byP && m.par ? ' · ' : '') + (byP ? m.par : '') || m.v || m.par || shortLab(m.x); dup[l0] = (dup[l0] || 0) + 1; });
    return '<div id="ps-var" style="margin:8px 0 2px;padding:8px 10px;border-left:3px solid var(--accent,#2f6f4f);background:var(--bg-soft,rgba(120,110,80,.08));border-radius:0 8px 8px 0"><div style="font-size:12px;font-weight:700;margin-bottom:6px">' + esc(q[5]) + ' · ' + g.mem.length + '</div><div style="display:flex;flex-wrap:wrap;gap:6px">' +
      g.mem.map(function (m) {
        var lab = (byK ? m.v : '') + (byK && byP && m.par ? ' · ' : '') + (byP ? m.par : '') || m.v || m.par || shortLab(m.x), on = m.x.id === cur.id;
        if (dup[lab] > 1) lab += ' (' + String(m.x.label).replace(/\s*\((?:[^()]*Eurostat[^()]*)\)\s*$/, '').split(/:\s/)[0].replace(/,\s.*$/, '').slice(0, 40) + ')'; /* misma etiqueta traducida: se distingue por la original */
        return '<button type="button" data-s="' + esc(m.x.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '" style="font:inherit;font-size:12.5px;cursor:pointer;border-radius:999px;padding:4px 11px;border:1px solid ' + (on ? 'var(--text,#231f14)' : 'var(--border,#ddd6c4)') + ';background:' + (on ? 'var(--text,#231f14)' : 'transparent') + ';color:' + (on ? 'var(--surface,#fffdf7)' : 'inherit') + ';font-weight:' + (on ? 700 : 400) + '" title="' + esc(TL(m.x.label)) + '">' + esc(lab) + '</button>';
      }).join('') + '</div></div>';
  }
  function filterSeries(list, q) {
    var tk = norm(q).split(/\s+/).filter(Boolean); if (!tk.length) return list;
    var ex = list.filter(function (x) { var h = norm(x.label + ' ' + TL(x.label)); return tk.every(function (k) { return h.indexOf(k) > -1; }); });
    if (ex.length) return ex;
    if (!window.DehesaSearch) { // el motor se carga solo si hace falta (primera busqueda sin coincidencia exacta)
      if (!document.getElementById('di-search-js')) { var sc = document.createElement('script'); sc.id = 'di-search-js'; sc.src = window.DehesaShared && DehesaShared.sitePath ? DehesaShared.sitePath('js/search.js') : 'js/search.js'; sc.onload = function () { var i = document.getElementById('ps-q'); if (i && i.oninput) i.oninput(); }; document.head.appendChild(sc); }
      return ex;
    }
    // sin coincidencia exacta: tolera erratas ("cevada rendimento") con el mismo motor del buscador global
    return list.filter(function (x) { return DehesaSearch.match(q, x.label + ' ' + TL(x.label)) >= 0.45; });
  }
  function seriesOpts(list, sel) {
    var one = function (x, lab) { return '<option value="' + esc(x.id) + '"' + (x.id === sel ? ' selected' : '') + ' title="' + esc(TL(x.label)) + '">' + esc((x._n > 1 ? '＋' + (x._n - 1) + ' · ' : '') + lab) + '</option>'; };
    var rows = list.map(function (x) { var l = shortLab(x), i = l.indexOf(': '); return { x: x, l: l, k: i > 2 && i < 70 ? l.slice(0, i) : '', m: i > 2 && i < 70 ? l.slice(i + 2) : l }; });
    var cnt = {}; rows.forEach(function (r) { if (r.k) cnt[r.k] = (cnt[r.k] || 0) + 1; });
    var out = '', seen = {}, loose = '';
    rows.forEach(function (r) {
      if (r.k && cnt[r.k] > 1) { if (seen[r.k]) return; seen[r.k] = 1; out += '<optgroup label="' + esc(r.k) + '">' + rows.filter(function (q) { return q.k === r.k; }).map(function (q) { return one(q.x, q.m); }).join('') + '</optgroup>'; }
      else loose += one(r.x, r.l);
    });
    return out + (loose ? (out ? '<optgroup label="' + esc((SP[lang()] || SP.es)[4]) + '">' + loose + '</optgroup>' : loose) : '');
  }
  function seriesCount(n, m) { return (SP[lang()] || SP.es)[2].replace('{n}', nf(n, 0)).replace('{m}', nf(m, 0)); }
  function seriesPicker(list, t, nov) {
    var q = SP[lang()] || SP.es, shown = filterSeries(list, ST.q || ''), fl = shown.length; if (!ST.q) shown = collapse(shown, list, ST.s);
    return '<div style="flex:1 1 100%;font-size:13px"><label for="ps-q">' + esc(q[0]) + '</label><br><input id="ps-q" type="search" class="di-compare-select" autocomplete="off" placeholder="' + esc(q[1]) + '" value="' + esc(ST.q || '') + '" style="width:100%;box-sizing:border-box">' +
      '<div id="ps-qn" class="di-movers-hint" role="status" aria-live="polite" style="margin:4px 0">' + esc(shown.length ? seriesCount(shown.length, list.length) + (shown.length < fl ? ' · ' + q[6] : '') : q[3]) + '</div>' +
      '<select id="ps-s" class="di-compare-select" size="' + (shown.length < 8 ? Math.max(2, shown.length) : 8) + '" aria-label="' + esc(t.series) + '" style="width:100%">' + seriesOpts(shown, ST.s) + '</select>' + (nov ? '' : variantsHtml(list, list.filter(function (z) { return z.id === ST.s; })[0])) + '</div>';
  }
  /* Explorador (js/pais-explorer.js): contexto con lo que necesita de esta ficha */
  function cutPts(pts) { var years = { '6m': 0.5, '1': 1, '3': 3, '5': 5, '10': 10, '20': 20 }[ST.r]; if (!years || !pts.length) return pts; var from = ts(pts[pts.length - 1][0]) - years * 365.25 * 864e5; return pts.filter(function (p) { return ts(p[0]) >= from; }); }
  function xctx(c, list, cur0, cur, t, countries, opt, groups, rng) {
    return { lang: lang(), list: list, cc: ST.c, g: ST.g, cur0: cur0, cur: cur, cmp: ST.cmp, t: t, countries: t.countries, country: t.countries[ST.c] || ST.c, allSeries: c.series,
      cmpCountries: CCODES.filter(function (k) { return AVAIL[k] && k !== ST.c; }), groupLabel: t.group, groupOpts: groupOpts(groups, t),
      countryOpts: opt(countries, ST.c, function (k) { return flagE(k) + (t.countries[k] || k); }), rangeOpts: opt(rng, ST.r, function (k) { return k === 'max' ? t.rmax : t['r' + k]; }),
      oldPicker: seriesPicker(list, t, true), collapse: collapse, filterSeries: filterSeries, TL: TL, shortLab: shortLab, plabel: plabel, nf: nf, dec: dec, ts: ts, cut: cutPts,
      r: ST.r, setR: function (v) { ST.r = v; }, srcName: function (id) { var s = id && lreg(id); return s ? s.name : ''; }, loadPts: function (s) { return s.points ? Promise.resolve(s) : pt(s).then(function () { return s; }); }, fx: ST.fx, real: ST.real, firstId: function () { return window.DIExplorer.first({ list: list, collapse: collapse, t: t, lang: lang() }); },
      setS: function (id) { ST.s = id; }, setG: function (g) { ST.g = g; },
      resetAll: function () { ST.g = 'all'; ST.s = null; ST.r = 'max'; ST.fx = false; ST.real = false; ST.cmp = null; ST.q = ''; } };
  }
  function xapi() {
    var act = function (fn) { var e = document.getElementById('ex-top'), t0 = e ? e.getBoundingClientRect().top : 0; fn(); build(); holdAt('ex-top', t0); };
    return { act: act, loadCountry: loadCountry,
      setCmp: function (o) { act(function () { ST.cmp = o; }); },
      matchIn: function (cc, s) { /* 1) misma etiqueta (sin la fuente entre paréntesis), unidad y frecuencia; 2) mismo producto, misma medida, unidad y frecuencia. Se muestra siempre qué serie se ha elegido. */
        var k = function (x) { return String(x.label).replace(/\s*\([^()]*\)\s*$/, '').toLowerCase(); }, L = ((DATA.countries[cc] || {}).series || []), best = null, better = function (x) { return !best || (x.n || 0) > (best.n || 0) || ((x.n || 0) === (best.n || 0) && String(x.latestPeriod) > String(best.latestPeriod)); };
        L.forEach(function (x) { if (k(x) === k(s) && x.unit === s.unit && x.frequency === s.frequency && better(x)) best = x; });
        if (!best && s.tags && s.tags.length && window.DIExplorer) { var m = window.DIExplorer.meas(s), t0 = s.tags[0]; L.forEach(function (x) { if ((x.tags || []).indexOf(t0) >= 0 && window.DIExplorer.meas(x) === m && x.unit === s.unit && x.frequency === s.frequency && x.group === s.group && better(x)) best = x; }); }
        if (!best && s.tags && s.tags.length && window.DIExplorer) { var m2 = window.DIExplorer.meas(s), t1 = s.tags[0]; L.forEach(function (x) { if ((x.tags || []).indexOf(t1) >= 0 && window.DIExplorer.meas(x) === m2 && x.frequency === s.frequency && x.group === s.group && better(x)) best = x; }); } /* otra unidad: se compara en índice */
        return best; } };
  }
  function cmpPrep() {
    if (!ST.cmp) return Promise.resolve();
    return loadCountry(ST.cmp.cc).then(function () {
      var o = ((DATA.countries[ST.cmp.cc] || {}).series || []).filter(function (x) { return x.id === ST.cmp.id; })[0]; if (!o) { ST.cmp = null; return; }
      return DISeries.series(o.cc, o.id).then(function (f) { window.DIExplorer.setCmpSeries(ST.cmp.cc, ST.cmp.id, { id: o.id, label: o.label, unit: o.unit, frequency: o.frequency, points: f.points }); });
    }).catch(function () { ST.cmp = null; });
  }
  function render() {
    var root = document.getElementById('paises-body'); if (!root || !DATA) return;
    var t = tt(), c = DATA.countries[ST.c];
    var list = selectedList(c);
    var cur0 = list.filter(function (s) { return s.id === ST.s; })[0]; if (cur0 && !cur0.points) cur0 = null;
    var cur = cur0 && ST.fx ? fxConv(cur0) : cur0 && ST.real ? realConv(cur0) : cur0;
    CURX = { cur: cur, cur0: cur0 };
    var countries = CCODES.filter(function (k) { return AVAIL[k]; }).sort(function (x, y) { var o = { ES: 0, FR: 1, DE: 2, BE: 3, AT: 4, PT: 5, CA: 6, US: 7, EU: 8 }; return (o[x] == null ? 9 : o[x]) - (o[y] == null ? 9 : o[y]); });
    var groups = groupsOf(c);
    var opt = function (arr, sel, lab) { return arr.map(function (k) { return '<option value="' + esc(k) + '"' + (k === sel ? ' selected' : '') + '>' + esc(lab(k)) + '</option>'; }).join(''); };
    var optLabS = function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === ST.s ? ' selected' : '') + '>' + esc(TL(x.label)) + '</option>'; };
    /* selector de series: pinta solo la opción activa y completa la lista al tocarlo (mismo contenido, ~1.000 <option> menos al abrir la ficha) */
    var optS = (list.length > 60 && ST.s) ? list.filter(function (x) { return x.id === ST.s; }).map(optLabS).join('') : list.map(optLabS).join('');
    var sel = function (id, label, inner) { return '<label style="font-size:13px;flex:1;min-width:150px">' + label + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; };
    var rng = ['1m', '6m', '1', '3', '5', '10', '20', 'max'];
    var TH = { es: ['Datos de {c} por tema', 'series', 'Cada tema abre las series de ese país en el explorador.'], en: ['{c} data by topic', 'series', 'Each topic opens that country’s series in the explorer.'], fr: ['Données de {c} par thème', 'séries', 'Chaque thème ouvre les séries du pays dans l’explorateur.'], it: ['Dati di {c} per tema', 'serie', 'Ogni tema apre le serie del paese nell’esploratore.'] }[lang()] || [];
    var TEMO = { production: '🥩', crops: '🌾', livestock: '🐄', fish: '🐟', trade: '🚢', quotes: '📈', prices: '🏷️', prices_paid: '🧾', milk: '🥛', milk_regions: '🥛', crops_regions: '🗺️', prices_lv: '🐂', meat_regions: '🥩', prices_fv: '🍎', inputs: '🛒', inputs_f: '🧪', inputs_a: '🌽', costs: '🧮', environment: '♻️', organic: '🌿', climate: '⛅', stocks: '📦', income: '💰', partners: '🤝' };
    var cnt = {}; c.series.forEach(function (x) { cnt[x.group] = (cnt[x.group] || 0) + 1; });
    var themes = GROUPS.filter(function (g) { return cnt[g] && t[g] && !/^(idx_perc|idx_pag|rates)$/.test(g); });
    var themeHtml = themes.length > 1 ? '<section id="ps-themes" class="pp-anchor"><h2 style="margin:14px 0 4px;font-size:19px">' + esc(TH[0].replace('{c}', t.countries[ST.c] || ST.c)) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(TH[2]) + '</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">' + themes.map(function (g) { return '<a class="di-card" href="paises.html?c=' + ST.c + '&amp;g=' + g + '#ps-explorer" style="display:block;padding:10px 12px;text-decoration:none;color:inherit">' + (TEMO[g] ? '<span aria-hidden="true" style="display:block;font-size:24px;line-height:1.1;margin-bottom:4px">' + TEMO[g] + '</span>' : '') + '<b>' + esc(t[g]) + '</b><div class="di-movers-hint" style="margin:2px 0 0">' + nf(cnt[g], 0) + ' ' + esc(TH[1]) + '</div></a>'; }).join('') + '</div></section>' : '';
    var prof = window.DIProfile ? window.DIProfile.html(ST.c, c, { lang: lang(), t: t, groups: groups, esc: esc, nf: nf, dec: dec, plabel: plabel, macro: MACRO && MACRO.countries[ST.c], wage: WAGES && WAGES.countries[ST.c], rate: window.DIProfile.rateOf(c) || (/^(AT|BE|BG|CY|DE|EE|EL|ES|FI|FR|HR|IE|IT|LT|LU|LV|MT|NL|PT|SI|SK)$/.test(ST.c) && ECBR ? (function (r) { if (!r) return null; var o = {}, k, P = r.points || []; for (k in r) o[k] = r[k]; o.ecb = true; if (o.latest == null && P.length) { o.latest = P[P.length - 1][1]; o.latestPeriod = P[P.length - 1][0]; } return o.latest == null ? null : o; })(window.DIProfile.rateOf(ECBR)) : null), afterHero: themeHtml + '<div class="ps-secgrp">' + (window.DehesaSector ? '<div id="ps-sector"></div>' : '') + '<div id="ps-regmap" class="pp-anchor"></div></div>' }) : '';
    var EXC = window.DIExplorer ? xctx(c, list, cur0, cur, t, countries, opt, groups, rng) : null;
    if (SNOTE && SNOTE.s && SNOTE.s !== ST.s) SNOTE = null; if (SNOTE && !SNOTE.s) SNOTE.s = ST.s;
    var SN = { es: ['Esta serie cambió de identificador: te mostramos la misma con su nombre actual.', 'La serie del enlace ({id}) ya no se publica en este país; te mostramos otra. Busca arriba la que quieres.'],
      en: ['This series changed its identifier: we show you the same one under its current name.', 'The linked series ({id}) is no longer published for this country; we show you another. Search above for the one you want.'],
      fr: ['Cette série a changé d’identifiant : nous vous montrons la même sous son nom actuel.', 'La série du lien ({id}) n’est plus publiée pour ce pays ; nous vous en montrons une autre. Cherchez ci-dessus celle que vous voulez.'],
      it: ['Questa serie ha cambiato identificativo: ti mostriamo la stessa con il nome attuale.', 'La serie del link ({id}) non è più pubblicata per questo paese; te ne mostriamo un’altra. Cerca qui sopra quella che vuoi.'] }[lang()] || [];
    var snote = SNOTE ? '<p class="di-movers-hint" id="ps-snote" style="color:#8f5f12">' + esc((SNOTE.k === 'ren' ? SN[0] : SN[1] || '').replace('{id}', SNOTE.id || '')) + '</p>' : '';
    var html = snote + prof + (EXC ? window.DIExplorer.html(EXC) : '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:0 0 14px">' +
      sel('ps-g', t.group, groupOpts(groups, t)) +
      sel('ps-r', t.range, opt(rng, ST.r, function (k) { return k === 'max' ? t.rmax : t['r' + k]; })) + seriesPicker(list, t) + '</div>');
    if (cur) {
      var ch = cur.changePct;
      html += '<div class="di-card" style="padding:16px 18px"><div style="font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin-bottom:4px">' + (EXC ? '<span class="ps-hd-r">' + (window.DIExplorer.rangeBtns ? window.DIExplorer.rangeBtns(EXC, cur) : '') + watchBtn(cur).replace('float:right;margin:-4px 0 0 8px;', 'margin:0;') + '</span>' : watchBtn(cur)) + esc(TL(cur.label).toUpperCase()) + ' (' + esc(cur.unit) + ')' + (window.DehesaShared && window.DehesaShared.reportLink ? ' <span style="font-weight:400;letter-spacing:0">' + window.DehesaShared.reportLink({ id: ST.c + '/' + cur0.id, label: cur0.label, period: cur0.latestPeriod, value: cur0.latest, unit: cur0.unit }) + '</span>' : '') + '</div>' + fxBox(cur0, cur) + realBox(cur0, cur) + (EXC ? (window.DIExplorer.answer ? window.DIExplorer.answer(EXC, cur, cur0) : window.DIExplorer.sentence(EXC, cur, cur0)) : '') + ((EXC && ST.cmp && window.DIExplorer.cmpChart(EXC, cur0)) || chartFor(cur)) +
        '<div class="di-movers-hint" style="margin-top:6px">' + t.latest + ' (' + esc(plabel(cur.latestPeriod, cur.frequency)) + '): <b>' + nf(cur.latest, dec(cur.latest)) + ' ' + esc(cur.unit) + '</b>' + (ch == null || EXC ? '' : ' · ' + (ch > 0 ? '+' : ch < 0 ? '−' : '') + nf(Math.abs(ch), 1) + ' %' + (window.DehesaShared && window.DehesaShared.chgTag ? window.DehesaShared.chgTag(cur) : '')) + ' · ' + t.freq[cur.frequency] + '</div>' + localBox(cur, c) + revBox(cur) + (EXC ? window.DIExplorer.variantsWrap(EXC, variantsHtml(list, cur0)) + window.DIExplorer.cmpPanel(EXC) : '') + '</div>';
    } else html += '<p class="di-movers-hint">' + t.none + '</p>';
    var allTbl = function () { return '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:8px"><table style="border-collapse:collapse;width:100%;min-width:520px;font-size:13.5px"><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left"><th style="padding:8px 6px">' + t.series.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.latest.toUpperCase() + '</th><th style="padding:8px 6px;text-align:right">' + t.change.toUpperCase() + '</th><th style="padding:8px 6px">' + t.period.toUpperCase() + '</th><th style="padding:8px 6px">' + t.unit.toUpperCase() + '</th></tr>' +
      c.series.map(function (s) { return '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px">' + esc(TL(s.label)) + '</td><td style="padding:8px 6px;text-align:right">' + nf(s.latest, dec(s.latest)) + '</td><td style="padding:8px 6px;text-align:right">' + (s.changePct == null ? '' : (s.changePct > 0 ? '+' : s.changePct < 0 ? '−' : '') + nf(Math.abs(s.changePct), 1) + ' %' + (window.DehesaShared && window.DehesaShared.chgTag ? window.DehesaShared.chgTag(s) : '')) + '</td><td style="padding:8px 6px">' + esc(plabel(s.latestPeriod, s.frequency)) + '</td><td style="padding:8px 6px">' + esc(s.unit) + '</td></tr>'; }).join('') + '</table></div>'; };
    html += '<details id="ps-all" style="margin-top:14px"><summary style="cursor:pointer;font-size:13px">' + t.table + '</summary><div id="ps-all-body"></div></details>';
    var srcHtml = '<section id="ps-sources" class="pa-sources"><h2 class="pa-sources-h">' + esc(FRL[lang()][4]) + '</h2><p class="di-movers-hint">' + t.note + '</p>' + srcBox(c, cur0, t) + '<p class="di-movers-hint">' + t.updated + ': ' + esc((DATA.generatedAt || '').slice(0, 10)) + '</p>' + lineage(cur0) + '</section>';
    var own = ''; /* enlaces a paginas propias del pais: van dentro de «Datos propios del pais», no sueltos entre secciones */
    if (ST.c === 'ES') { var RC = { es: ['Costes y rentas de las explotaciones agrarias (RECAN)', 'Ver costes, ingresos y renta por tipo de explotación'], en: ['Farm costs and incomes (RECAN)', 'See costs, revenue and income by farm type'], fr: ['Coûts et revenus des exploitations (RECAN)', 'Voir coûts, recettes et revenus par type d\'exploitation'], it: ['Costi e redditi delle aziende agricole (RECAN)', 'Vedi costi, ricavi e redditi per tipo di azienda'] }[lang()] || []; own += '<a class="di-card" href="recan.html" style="display:block;padding:14px 18px;margin-top:14px;text-decoration:none;color:inherit"><b>' + esc(RC[0]) + ' →</b><div class="di-movers-hint" style="margin:4px 0 0">' + esc(RC[1]) + '</div></a>'; var BC = { es: ['Boletín semanal de precios de cereales (MAPA)', 'Precios mundiales, de la UE y de España por lonja. PDF del MAPA; Dehesa Index no reproduce sus cifras.'], en: ['Weekly cereal price bulletin (MAPA)', 'World, EU and Spanish market prices. MAPA PDF; Dehesa Index does not reproduce its figures.'], fr: ['Bulletin hebdomadaire des prix des céréales (MAPA)', 'Prix mondiaux, de l\'UE et des places espagnoles. PDF du MAPA ; Dehesa Index n\'en reprend pas les chiffres.'], it: ['Bollettino settimanale dei prezzi dei cereali (MAPA)', 'Prezzi mondiali, UE e delle piazze spagnole. PDF del MAPA; Dehesa Index non ne riproduce le cifre.'] }[lang()] || []; own += '<a class="di-card" href="https://www.mapa.gob.es/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/cereales/evolucion-de-los-precios-de-los-principales-cereales" target="_blank" rel="noopener noreferrer" style="display:block;padding:14px 18px;margin-top:14px;text-decoration:none;color:inherit"><b>' + esc(BC[0]) + ' ↗</b><div class="di-movers-hint" style="margin:4px 0 0">' + esc(BC[1]) + '</div></a>'; }
    if (ST.c === 'CA') { var CG = { es: ['Granos de Canadá: exportaciones, entregas y existencias', 'Datos semanales de la Canadian Grain Commission para trigo, canola, cebada y más.'], en: ['Canadian grain: exports, deliveries and stocks', 'Weekly Canadian Grain Commission data for wheat, canola, barley and more.'], fr: ['Céréales du Canada : exportations, livraisons et stocks', 'Données hebdomadaires de la Commission canadienne des grains pour le blé, le canola, l\'orge et plus.'], it: ['Cereali del Canada: esportazioni, consegne e scorte', 'Dati settimanali della Canadian Grain Commission per frumento, canola, orzo e altro.'] }[lang()] || []; own += '<a class="di-card" href="canada-granos.html" style="display:block;padding:14px 18px;margin-top:14px;text-decoration:none;color:inherit"><b>' + esc(CG[0]) + ' →</b><div class="di-movers-hint" style="margin:4px 0 0">' + esc(CG[1]) + '</div></a>'; }
    if (ST.c === 'US') { var UL = { es: ['Precios locales del grano en EE. UU.', 'Lo que pagan los compradores por maíz, soja, trigo y más en cada estado (ofertas en efectivo de USDA AMS), además de ganado y heno.'], en: ['Local grain prices in the United States', 'What buyers are paying for corn, soybeans, wheat and more in each state (USDA AMS cash bids), plus cattle and hay.'], fr: ['Prix locaux des grains aux États-Unis', 'Ce que paient les acheteurs pour le maïs, le soja, le blé et plus dans chaque État (offres au comptant de l\'USDA AMS), ainsi que bétail et foin.'], it: ['Prezzi locali dei cereali negli Stati Uniti', 'Quanto pagano gli acquirenti per mais, soia, frumento e altro in ogni Stato (offerte in contanti USDA AMS), più bestiame e fieno.'] }[lang()] || []; own += '<a class="di-card" href="precios-locales.html" style="display:block;padding:14px 18px;margin-top:14px;text-decoration:none;color:inherit"><b>' + esc(UL[0]) + ' →</b><div class="di-movers-hint" style="margin:4px 0 0">' + esc(UL[1]) + '</div></a>'; }
    ((window.DehesaShared.countryLinks && window.DehesaShared.countryLinks(ST.c)) || []).forEach(function (l) { if (own.indexOf(l.file) < 0) own += '<a class="di-card" href="' + l.href + '" style="display:block;padding:14px 18px;margin-top:14px;text-decoration:none;color:inherit"><b>' + esc(l.label) + ' →</b><div class="di-movers-hint" style="margin:4px 0 0">' + esc(l.d) + '</div></a>'; });
    html += '<div id="ps-detail"><h3 id="ps-own" class="ps-own-h">' + esc(OWN[lang()] ? OWN[lang()][0] : OWN.es[0]) + '</h3>' + own + '<div id="ps-ownnote"></div>'; if (REGMAP[ST.c] && !window.DIProfile) html += '<div id="ps-regmap"></div>';
    if (ST.c === 'PT') html += foldBox('ps-ifap', 'ifap'); html += (ST.c === 'DE' ? '<div id="ps-de"></div>' : '') + (ST.c === 'CA' ? '<div id="ps-mb"></div>' : '') + (ST.c === 'US' ? '<div id="ps-us"></div>' : '') + (ST.c === 'ES' ? '<div id="ps-es"></div>' : '') + (ST.c === 'CL' ? '<div id="ps-cl"></div>' : '') + (/^(DK|NL|FR)$/.test(ST.c) ? '<div id="ps-eu"></div>' : '') + '<div id="ps-agri"></div>' + foldBox('ps-tp', 'tp') + '</div>' + srcHtml;
    root.innerHTML = html; giUp(); droughtUp(c); ghgUp(c); frUp(); agrUp(); deUp(); itUp(); landUp(); itIstatUp(); plUp(); plLandUp(); plRegionsUp(); plFarmShopUp(); beUp(); nordicUp(); atUp(); hrUp(); ieUp(); nlUp(); nlMoreUp(); beMoreUp(); ptUp(); ptMoreUp(); plZsrirUp(); farmHeadUp(); mgrUp(); censusUp(); forecastUp(); fishUp(); forestUp(); euDieselUp(); elUp(); gridClimUp(); euLandUp(); euNitUp(); sectorUp(); pageBlocks(c); if (ST.c === 'US') usDepth(); if (window.DICite && window.DICite.compact) window.DICite.compact(root, 'section, .pp-kgrid, #pp-trade'); frameUp(c); [1500, 4000, 9000].forEach(function (ms) { setTimeout(function () { if (document.getElementById("pa-bar")) frameUp(c); }, ms); }); if (REGMAP[ST.c]) regMap(ST.c); else slotNote('ps-regmap', 'reg'); if (window.DIClear) { DIClear.bindHelp(); DIClear.bindShare(); DIClear.bindNav(); if (!ST.hashDone) { ST.hashDone = 1; var hh = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); if (!hh && REQS) hh = document.getElementById('ps-explorer'); /* enlace a una serie concreta (buscador, avisos, fichas): se abre en su gráfico, no en la cabecera del perfil */ if (hh) setTimeout(function () { hh.scrollIntoView(); }, 60); } }
    var ub = root.querySelector('[data-unusual]'); if (ub) ub.onclick = function () { ub.disabled = true; ub.textContent = ub.getAttribute('data-busy'); Promise.all(c.series.filter(function (x) { return !x.points && x.n >= 24; }).map(pt)).then(function () { build(); }); };
    if (ST.c === 'DE') { var den = document.getElementById('ps-de'), mdf = function () { if (window.DEFarm && den) window.DEFarm.mount(den, lang()); }; if (window.DEFarm) mdf(); else { var dsc = document.createElement('script'); dsc.src = 'js/de-agri.js?v=20261003'; dsc.onload = mdf; document.head.appendChild(dsc); } }
    if (ST.c === 'CA') { var mbn = document.getElementById('ps-mb'); if (mbn) { /* Manitoba (vacuno, ovino y caprino, porcino, granos): cabeceras aqui, modulos (js/mb-cattle.js, js/mb-smallstock.js, js/mb-grains.js) solo al abrir */
      var MBT = { es: [['Manitoba: ganado vacuno en subastas (semanal)', 'Ver precios por clase y subasta'], ['Manitoba: ovino y caprino en subastas', 'Ver precios por clase y subasta'], ['Manitoba: porcino (procesadoras, semanal)', 'Ver precio de la canal, cerdos procesados y peso'], ['Manitoba: granos y oleaginosas (elevador de Winnipeg, semanal)', 'Ver precio por cultivo en C$/t y C$/bushel, desde 1987']],
        en: [['Manitoba: auction cattle prices (weekly)', 'See prices by class and auction'], ['Manitoba: sheep and goats at auction', 'See prices by class and auction'], ['Manitoba: hogs (processors, weekly)', 'See carcass price, pigs processed and weight'], ['Manitoba: grains and oilseeds (Winnipeg elevator, weekly)', 'See the price by crop in C$/t and C$/bushel, since 1987']],
        fr: [['Manitoba : bovins aux encans (hebdomadaire)', 'Voir les prix par catégorie et par encan'], ['Manitoba : ovins et caprins aux encans', 'Voir les prix par catégorie et par encan'], ['Manitoba : porcs (transformateurs, hebdomadaire)', 'Voir le prix de la carcasse, les porcs transformés et le poids'], ['Manitoba : grains et oléagineux (élévateur de Winnipeg, hebdomadaire)', 'Voir le prix par culture en $ CA/t et $ CA/boisseau, depuis 1987']],
        it: [['Manitoba: bovini alle aste (settimanale)', 'Vedi i prezzi per categoria e asta'], ['Manitoba: ovini e caprini alle aste', 'Vedi i prezzi per categoria e asta'], ['Manitoba: suini (trasformatori, settimanale)', 'Vedi prezzo della carcassa, suini lavorati e peso'], ['Manitoba: cereali e semi oleosi (elevatore di Winnipeg, settimanale)', 'Vedi il prezzo per coltura in C$/t e C$/bushel, dal 1987']] }[lang()] || [];
      var MBK = [['mb-cattle', 'js/mb-cattle.js?v=20261003', 'MBCattle', null], ['mb-sheep-goat', 'js/mb-smallstock.js?v=20261004', 'MBSmall', 'sg'], ['mb-hogs', 'js/mb-smallstock.js?v=20261004', 'MBSmall', 'hog'], ['mb-grains', 'js/mb-grains.js?v=0', 'MBGrains', null]];
      mbn.innerHTML = MBK.map(function (k, i) { return '<details class="pa-card di-card" id="' + k[0] + '"><summary>' + esc(MBT[i][0]) + ' · <span>' + esc(MBT[i][1]) + '</span></summary><div class="es-body"></div></details>'; }).join('');
      MBK.forEach(function (k, i) { var mbd = mbn.children[i], mbg = function () { var go = function () { if (window[k[2]]) window[k[2]].mount(mbd.lastChild, lang(), k[3]); }; if (window[k[2]]) go(); else { var mbs = document.createElement('script'); mbs.src = k[1]; mbs.onload = go; document.head.appendChild(mbs); } };
        mbd.addEventListener('toggle', function () { if (mbd.open && !mbd.getAttribute('data-ld')) { mbd.setAttribute('data-ld', '1'); mbg(); } }); if (location.hash === '#' + k[0]) mbd.open = true; }); } }
    if (ST.c === 'ES') { var esn = document.getElementById('ps-es'); if (esn) { /* cultivos por provincia: la cabecera se pinta aqui y el modulo (js/es-crops.js) solo se descarga al abrir */
      var EST = { es: ['España: cultivos por provincia (superficie, producción y rendimiento)', 'Ver qué se cultiva y cuánto se produce en cada provincia'], en: ['Spain: crops by province (area, production and yield)', 'See what is grown, and how much, in each province'], fr: ['Espagne : cultures par province (surface, production et rendement)', 'Voir ce qui est cultivé, et en quelle quantité, dans chaque province'], it: ['Spagna: colture per provincia (superficie, produzione e resa)', 'Vedi cosa si coltiva, e quanto, in ogni provincia'] }[lang()] || [];
      esn.innerHTML = '<details class="pa-card di-card"><summary>' + esc(EST[0]) + ' · <span>' + esc(EST[1]) + '</span></summary><div class="es-body"></div></details>';
      var esd = esn.firstChild, esg = function () { var go = function () { if (window.ESCrops) window.ESCrops.mount(esd.lastChild, lang()); }; if (window.ESCrops) go(); else { var esc2 = document.createElement('script'); esc2.src = 'js/es-crops.js?v=20261003'; esc2.onload = go; document.head.appendChild(esc2); } };
      esd.addEventListener('toggle', function () { if (esd.open && !esd.getAttribute('data-ld')) { esd.setAttribute('data-ld', '1'); esg(); } }); if (location.hash === '#es-crops') esd.open = true; } }
    if (ST.c === 'CL') { var cln = document.getElementById('ps-cl'); if (cln) { /* frutas y hortalizas de Chile (ODEPA): cabecera aqui, tablas (js/precios-fv.js) solo al abrir */
      var CLT = { es: ['Chile: frutas y hortalizas (mayoristas y consumidor)', 'Precios de cada mercado mayorista y de cada región'], en: ['Chile: fruit and vegetables (wholesale and consumer)', 'Prices at each wholesale market and in each region'], fr: ['Chili : fruits et légumes (gros et consommation)', 'Prix de chaque marché de gros et de chaque région'], it: ['Cile: frutta e ortaggi (ingrosso e consumo)', 'Prezzi di ogni mercato all’ingrosso e di ogni regione'] }[lang()] || [];
      cln.innerHTML = '<details class="pa-card di-card" id="cl-fv"><summary>' + esc(CLT[0]) + ' · <span>' + esc(CLT[1]) + '</span></summary><div class="es-body"></div></details>';
      var cld = cln.firstChild, clg = function () { var go = function () { if (window.DehesaFV) window.DehesaFV.render(cld.lastChild, { location: 'cl', lang: lang() }); }; if (window.DehesaFV) go(); else { var cls = document.createElement('script'); cls.src = 'js/precios-fv.js?v=0'; cls.onload = go; document.head.appendChild(cls); } };
      cld.addEventListener('toggle', function () { if (cld.open && !cld.getAttribute('data-ld')) { cld.setAttribute('data-ld', '1'); clg(); } }); if (location.hash === '#cl-fv') cld.open = true; } }
    if (/^(DK|NL|FR)$/.test(ST.c)) { var eun = document.getElementById('ps-eu'), euG = function () { window.EUHeads.mount(eun, ST.c, lang()); if (ST.c === 'FR') moveFrWater(); }; if (eun) { if (window.EUHeads) euG(); else { var hs = document.createElement('script'); hs.src = 'js/eu-heads.js?v=20261003'; hs.onload = euG; document.head.appendChild(hs); } } } /* DK, NL y FR en profundidad: js/eu-heads.js pinta las cabeceras y js/eu-depth.js solo se descarga al abrir un bloque */
    if (window.DIAgri) { var agn = document.getElementById('ps-agri'); if (agn) window.DIAgri.mount(agn, ST.c, lang()); } if (window.DITradePartners) { var tpn = document.getElementById('ps-tp'); if (tpn) { var tpd = tpn.parentNode; /* sin datos de comercio no se muestra el bloque */ var tpm = document.createElement('p'); tpm.className = 'di-movers-hint'; tpm.textContent = (TPN[lang()] || TPN.es); tpn.parentNode.appendChild(tpm); /* el bloque se ve siempre; sin datos, lo dice */ if (window.MutationObserver) new MutationObserver(function () { tpm.hidden = !!tpn.firstElementChild; }).observe(tpn, { childList: true }); window.DITradePartners.mount(tpn, ST.c, lang()); } } if (ST.c === 'PT' && window.DIIfapMap) { var im = document.getElementById('ps-ifap'), imd = im && im.parentNode; /* el mapa necesita tamaño visible: se monta al abrir */ if (im && imd) { var once = function () { if (imd.open && !im.getAttribute('data-m')) { im.setAttribute('data-m', '1'); window.DIIfapMap.mount(im, lang()); } }; imd.addEventListener('toggle', once); once(); } }
    var ow = document.getElementById('ps-detail'), on = document.getElementById('ps-ownnote'); if (ow && on) { var n = 0; Array.prototype.forEach.call(ow.children, function (e) { if (e.tagName === 'A' || /^ps-(de|mb|us|es|eu|cl)$/.test(e.id) || e.getAttribute('data-fold') === 'ps-ifap') n++; }); if (!n) on.innerHTML = '<p class="di-movers-hint">' + esc((OWN[lang()] || OWN.es)[1]) + '</p>'; }
    var psAll = document.getElementById('ps-all'), psBody = document.getElementById('ps-all-body');
    if (psAll && psBody) { var fillAll = function () { if (psAll.open && !psBody.firstChild) psBody.innerHTML = allTbl(); }; psAll.addEventListener('toggle', fillAll); fillAll(); }
    if (EXC) window.DIExplorer.bind(root, EXC, xapi());
    var psQ = document.getElementById('ps-q'), psS = document.getElementById('ps-s'), psN = document.getElementById('ps-qn');
    if (psQ && psS) psQ.oninput = function () {
      ST.q = psQ.value; var sh = filterSeries(list, ST.q), q = SP[lang()] || SP.es, fl0 = sh.length; if (!ST.q) sh = collapse(sh, list, ST.s);
      psS.innerHTML = seriesOpts(sh, ST.s); psS.size = sh.length < 8 ? Math.max(2, sh.length) : 8;
      if (psN) psN.textContent = sh.length ? seriesCount(sh.length, list.length) + (sh.length < fl0 ? ' · ' + q[6] : '') : q[3];
    };
    var pv = document.getElementById('ps-var'); if (pv) pv.onclick = function (e) { var b = e.target.closest ? e.target.closest('button[data-s]') : null; if (!b) return; ST.s = b.getAttribute('data-s'); var t2 = pv.getBoundingClientRect().top; build(); holdAt('ps-var', t2); };
    if (psQ) psQ.onkeydown = function (e) { if (e.key === 'Enter' && psS && psS.options.length) { e.preventDefault(); ST.s = psS.options[0].value; var t1 = psQ.getBoundingClientRect().top; build(); holdAt('ps-q', t1); } else if (e.key === 'ArrowDown' && psS && psS.options.length) { e.preventDefault(); psS.focus(); } };
    var bind = function (id, key) { var el = document.getElementById(id); if (el) el.onchange = function (e) { ST[key] = e.target.value; if (key === 'c') { ST.g = 'all'; ST.s = null; ST.q = ''; ST.cmp = null; if (window.DIExplorer) window.DIExplorer.reset(); } if (key === 'g') { ST.s = null; ST.q = ''; } var t0 = el.getBoundingClientRect().top; build(); holdAt(id, t0); var n = document.getElementById(id); if (n) { try { n.focus({ preventScroll: true }); } catch (er) {} } }; };
    var fb = document.getElementById('ps-fx'); if (fb) fb.onchange = function () { ST.fx = fb.checked; if (ST.fx) ST.real = false; var t0 = fb.getBoundingClientRect().top; build(); holdAt('ps-fx', t0); };
    var rb = document.getElementById('ps-real'); if (rb) rb.onchange = function () { ST.real = rb.checked; if (ST.real) { ST.fx = false; if (!RCPI) { window.DehesaChart.real.load().then(function (d) { RCPI = d || false; build(); }); return; } } build(); };
    var wb = document.getElementById('ps-watch'); if (wb && cur) wb.onclick = function () { DIWatch.toggle(ST.c, cur.id); build(); };
    if (wb && cur && DIWatch.editor) { // avisos locales de esta serie (desplegable bajo el titulo del grafico)
      var card = wb.parentNode.parentNode, det = document.createElement('details'), sm = document.createElement('summary'), rl = (DIWatch.rl[lang()] || DIWatch.rl.es), nr = DIWatch.rules(ST.c, cur.id).length;
      det.style.cssText = 'margin:6px 0 8px'; if (nr) det.open = true; sm.style.cssText = 'cursor:pointer;font-size:12.5px;color:var(--text-faint);display:block;min-height:24px;line-height:24px'; sm.textContent = '🔔 ' + rl.rules + (nr ? ' (' + nr + ')' : '');
      det.appendChild(sm); var box = document.createElement('div'); box.style.marginTop = '6px'; box.innerHTML = DIWatch.editor(ST.c, cur.id, lang()); det.appendChild(box);
      var after = wb.parentNode; after.parentNode.insertBefore(det, after.nextSibling); DIWatch.bindEditor(box, build);
    }
    Array.prototype.forEach.call(root.querySelectorAll('[data-pg],[data-ps]'), function (el) { el.onclick = function () { var g = el.getAttribute('data-pg'), sid = el.getAttribute('data-ps'); if (g) { ST.g = g; ST.s = null; } else { var s = c.series.filter(function (x) { return x.id === sid; })[0]; if (s) { ST.g = s.group; ST.s = sid; } } var mh = root.offsetHeight; root.style.minHeight = mh + 'px'; build(); goExplorer(); setTimeout(function () { root.style.minHeight = ''; }, 4600); }; });
        try { var qq = new URLSearchParams(window.location.search); qq.set('c', ST.c); ['g', 's', 'r'].forEach(function (k) { var v = ST[k]; if (v && v !== 'all' && !(k === 'r' && v === 'max')) qq.set(k, v); else qq.delete(k); }); if (ST.cmp) qq.set('cmp', ST.cmp.cc + ':' + ST.cmp.id); else qq.delete('cmp'); history.replaceState(null, '', '?' + qq.toString() + window.location.hash); } catch (e) {} bind('ps-c', 'c'); bind('ps-g', 'g'); bind('ps-s', 's'); bind('ps-r', 'r');
  }
  /* Al cambiar un desplegable la ficha se repinta y los bloques de arriba se recargan: se mantiene el control en el mismo sitio de la pantalla
     durante un segundo (hasta que la página termina de colocarse), salvo que el usuario se ponga a desplazarse. */
  function holdAt(id, top) {
    var stop = false, end = Date.now() + 1200, quit = function () { stop = true; };
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, quit, { passive: true, once: true }); });
    var fix = function () { if (stop) return; var e = document.getElementById(id); if (e) { var d = e.getBoundingClientRect().top - top; if (Math.abs(d) > 1) window.scrollBy(0, d); } if (Date.now() < end) (window.requestAnimationFrame || setTimeout)(fix); };
    fix();
  }
  function shell() { var t = tt(); var h = document.getElementById('pg-h1'), s = document.getElementById('pg-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = tabTitle(t); }
  // Pestaña del navegador (y título que ve Google): país + qué ofrece la página. El H1 de la página no cambia.
  var TAB = { es: ': datos agrarios, precios y comercio', en: ': farm data, prices and trade', fr: ' : données agricoles, prix et commerce', it: ': dati agricoli, prezzi e commercio' };
  function tabTitle(t) { var n = ST && ST.c && t.countries ? t.countries[ST.c] : ''; return n ? n + (TAB[lang()] || TAB.es) + ' | Dehesa Index' : t.title + ' | Dehesa Index'; }
  function setTab() { document.title = tabTitle(tt()); }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); build(); if (LABELS_ON && window.DILabelTl && !window.DILabelTl.ready(lang())) window.DILabelTl.load(lang()).then(function (ok) { if (ok) { shell(); build(); } }); };
  // Glosario de etiquetas: activo (presupuesto 530 KB gz, 8-oct-2026)
  var LABELS_ON = true;
  if (LABELS_ON && window.DILabelTl && !window.DILabelTl.ready(lang())) window.DILabelTl.load(lang()).then(function (ok) { if (ok) { shell(); build(); } });
  shell();
  var q = new URLSearchParams(window.location.search); if (q.get('c')) ST.c = q.get('c').toUpperCase(); if (q.get('g')) ST.g = q.get('g'); if (q.get('s')) ST.s = q.get('s'); var REQS = q.get('s') || '', SNOTE = null;   /* enlace a una serie concreta: si cambio de id o ya no existe, se dice (no se cambia de serie en silencio) */ if (q.get('r')) ST.r = q.get('r'); if (q.get('cmp')) { var cm = q.get('cmp').split(':'); if (cm.length > 1 && cm[0].toUpperCase() === ST.c) ST.cmp = { cc: cm[0].toUpperCase(), id: cm.slice(1).join(':') }; } if (q.get('fx') === '1') ST.fx = true; if (q.get('real') === '1' && !ST.fx) { ST.real = true; window.addEventListener('load', function () { if (window.DehesaChart && window.DehesaChart.real) window.DehesaChart.real.load().then(function (d) { RCPI = d || false; if (DATA) build(); }); }); }
  /* Carga por catalogo (capa de datos unificada): manifiesto -> catalogo del pais -> trozo de la serie. Nunca se piden los *-stats.json. */
  var GROUPS = ['production', 'crops', 'livestock', 'fish', 'trade', 'quotes', 'prices', 'prices_paid', 'milk', 'milk_regions', 'crops_regions', 'prices_lv', 'meat_regions', 'prices_fv', 'inputs', 'inputs_f', 'inputs_a', 'idx_perc', 'idx_pag', 'costs', 'environment', 'organic', 'climate', 'stocks', 'income', 'partners', 'rates'];
  function flagE(k) { if (k === 'EU') return '\uD83C\uDDEA\uD83C\uDDFA '; var i = k === 'EL' ? 'GR' : k === 'UK' ? 'GB' : k; return /^[A-Z]{2}$/.test(i) ? String.fromCodePoint(127397 + i.charCodeAt(0), 127397 + i.charCodeAt(1)) + ' ' : ''; }
  var CCODES = ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'DK', 'NL', 'CA', 'US', 'EU', 'AU', 'UK', 'AR', 'CL', 'UY', 'PL', 'CH', 'EL', 'IE', 'FI', 'BG', 'HR', 'LT', 'SK', 'CZ', 'EE', 'HU', 'LV', 'RO', 'SE', 'SI', 'CY', 'LU', 'MT'], AVAIL = {}, CAT = {}, TOK = 0, LREG = null;
  var LP = { es: ['licencia pendiente de verificar', 'Fuentes de este país', 'Licencia'], en: ['licence pending verification', 'Sources for this country', 'Licence'], fr: ['licence à vérifier', 'Sources de ce pays', 'Licence'], it: ['licenza da verificare', 'Fonti di questo paese', 'Licenza'] };
  function loadCountry(cc) {
    if (CAT[cc]) return CAT[cc];
    return CAT[cc] = DISeries.country(cc, true).then(function (c) {
      var S = (c.series || []).filter(function (s) { return s.group !== 'product' && s.format !== 'eu-regions'; }).map(function (s) {
        return { id: s.id, cc: cc, label: s.label, unit: s.unit, frequency: s.freq, group: s.group, latestPeriod: s.latestPeriod, latest: s.latest, changePct: s.changePct, cb: s.cb, n: s.n, first: s.first, source: s.source, sourceId: s.sourceId, licenseId: s.licenseId, fs: s.fs, tags: s.tags || [] };
      });
      DATA.countries[cc] = { name: c.name, sources: c.sources || [], series: S };
    }).catch(function (e) { delete CAT[cc]; throw e; });
  }
  /* Fuente y licencia: del registro de licencias via sourceId */
  function lreg(id) { return LREG && LREG.sources && LREG.sources[id]; }
  function srcLine(id, t) {
    var s = lreg(id), w = LP[lang()] || LP.es; if (!s) return esc(id);
    return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a> · ' + w[2] + ': ' + (s.licenseUrl ? '<a href="' + esc(s.licenseUrl) + '" target="_blank" rel="noopener">' + esc(s.licenseName) + '</a>' : esc(s.licenseName)) + (s.status === 'VERIFIED' ? '' : ' <em>(' + esc(w[0]) + ')</em>');
  }
  function srcBox(c, cur, t) {
    var w = LP[lang()] || LP.es, ids = [], seen = {};
    c.series.forEach(function (s) { if (s.sourceId && !seen[s.sourceId]) { seen[s.sourceId] = 1; ids.push(s.sourceId); } });
    var h = '';
    if (cur && cur.sourceId) h += '<p class="di-movers-hint">' + t.src + ': ' + srcLine(cur.sourceId, t) + '</p>';
    var others = ids.filter(function (id) { return !cur || id !== cur.sourceId; });
    if (others.length) h += '<p class="di-movers-hint">' + esc(w[1]) + ': ' + others.map(function (id) { var s = lreg(id); return s ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(id); }).join(' · ') + '</p>';
    return h;
  }
  fetch('data/views/license-cite.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.sources) { LREG = d; if (window.DICite) window.DICite.use(d); if (DATA) build(); } }).catch(function () {}); /* vista reducida del registro (solo fuentes en uso y campos de la cita) */
  DISeries.manifest().then(function (m) {
    DATA = { countries: {}, generatedAt: m.generatedAt };
    CCODES.forEach(function (k) { var e = m.countries[k]; AVAIL[k] = !!(e && e.metrics && Object.keys(e.metrics).some(function (g) { return g !== 'product' && g.indexOf('eu_') !== 0; })); });
    if (!AVAIL[ST.c]) ST.c = 'ES';
    return Promise.all([fetch('data/country-macro.json'), fetch('data/country-wages.json'), fetch('data/series/EU/rates.json')].map(function (f) { return f.then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }));
  }).then(function (m) { MACRO = m[0]; WAGES = m[1]; ECBR = m[2] && m[2].series ? m[2] : null;
    if (!REQS) return build();
    return fetch('data/series-renames.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (d) {
      var to = d && d.renames && d.renames[REQS]; if (to) { ST.s = to; REQS = to; SNOTE = { k: 'ren', id: to, s: to }; } build(); });
  })
    .catch(function () { var b = document.getElementById('paises-body'); if (b) b.innerHTML = '<p class="di-movers-hint">' + tt().none + '</p>'; });
})();
