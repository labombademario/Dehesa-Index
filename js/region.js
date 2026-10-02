/* Dehesa Index — Perfil de región (estados de EE. UU. y provincias de Canadá). ES5.
   Cada bloque lee un fichero que ya existe en data/ y muestra solo lo que ese fichero publica para la región; lo que no hay se lista como «sin dato», nunca se rellena.
   URL: region.html?c=US&r=IA  /  region.html?c=CA&r=SK */
(function () {
  'use strict';
  var L4 = { en: 0, es: 1, fr: 2, it: 3 };
  var US = window.DehesaRegionNames.US;
  var CA = window.DehesaRegionNames.CA;
  var CA_SLUG = { SK: 'saskatchewan', AB: 'alberta', MB: 'manitoba', ON: 'ontario', QC: 'quebec' };
  var CA_CITY = { SK: ['regina', 'saskatoon'], AB: ['calgary', 'edmonton'], MB: ['winnipeg'], ON: ['toronto'], QC: ['montreal'], BC: ['vancouver'] };
  var CA_CITY_N = { regina: 'Regina', saskatoon: 'Saskatoon', calgary: 'Calgary', edmonton: 'Edmonton', winnipeg: 'Winnipeg', toronto: 'Toronto', montreal: 'Montréal', vancouver: 'Vancouver' };
  var C = {
    US: { flag: '🇺🇸', names: US, map: 'DEHESA_US_STATES', country: ['United States', 'Estados Unidos', 'États-Unis', 'Stati Uniti'], kind: ['State', 'Estado', 'État', 'Stato'], kinds: ['states', 'estados', 'États', 'stati'], profile: 'paises.html?c=US' },
    CA: { flag: '🇨🇦', names: CA, map: 'DEHESA_CA_PROVINCES', country: ['Canada', 'Canadá', 'Canada', 'Canada'], kind: ['Province or territory', 'Provincia o territorio', 'Province ou territoire', 'Provincia o territorio'], kinds: ['provinces and territories', 'provincias y territorios', 'provinces et territoires', 'province e territori'], profile: 'paises.html?c=CA' }
  };
  var T = {
    es: { sub: 'Lo que publican las fuentes oficiales para esta región. Lo que no hay se indica; nada se rellena ni se estima.', home: 'Perfil de país', pick: 'Elegir', mapAlt: 'Mapa. Pulsa una región para abrir su perfil.', missing: 'Todavía sin dato de esta región', missingHint: 'Los datos de estas áreas no se publican para esta región o aún no los tenemos:', loading: 'Cargando…', unknown: 'No conocemos esta región. Elige una en el mapa.',
      drought: 'Sequía', droughtSub: 'Porcentaje de la superficie de la región en cada clase (acumulativo: «moderada o peor» incluye severa, extrema y excepcional).', d0: 'Seco o peor', d1: 'Moderada o peor', d2: 'Severa o peor', d3: 'Extrema o peor', d4: 'Excepcional', week: 'Semana del', month: 'Mes de', trend: 'Evolución', d1n: 'Moderada o peor', d3n: 'Extrema o peor',
      crops: 'Cultivos', cropsSub: 'Superficie cosechada, rendimiento y producción del último año publicado (USDA NASS). Unidades de EE. UU., tal como las publica la fuente. Si el año aún no ha terminado, las cifras son previsiones de la fuente.', crop: 'Cultivo', area: 'Superficie cosechada', yield: 'Rendimiento', prod: 'Producción', year: 'Año',
      cattle: 'Ganado vacuno en cebaderos', cattleSub: 'Existencias en cebaderos de 1.000 o más cabezas (USDA NASS, informe mensual).', onfeed: 'En cebadero', yago: 'Hace un año', prevm: 'Mes anterior', vsya: 'frente al año anterior', kh: 'miles de cabezas', asof: 'a',
      bids: 'Precios locales de granos', bidsSub: 'Ofertas de compra al contado en los mercados del estado (USDA AMS), último día con dato.', commodity: 'Producto', range: 'Rango entre mercados', mkts: 'mercados', more: 'Ver el detalle por mercado',
      fert: 'Fertilizantes', fertSub: 'Precio medio al por menor en el estado (USDA AMS, informes de costes de producción).', product: 'Producto', price: 'Precio', yoyl: 'Hace un año', date: 'Fecha', usdt: 'USD por tonelada corta',
      tax: 'Impuesto', taxSub: 'Impuesto estatal sobre las ventas (tipo general, sin impuestos locales).', rate: 'Tipo estatal', nostate: 'Sin impuesto estatal sobre las ventas', taxCalc: 'Usarlo en la calculadora',
      costs: 'Costes de las explotaciones', costsSub: 'Gastos de explotación por partida, Statistics Canada (millones de dólares canadienses, anual).', item: 'Partida', total: 'Total de gastos', share: 'del total', cad: 'M CAD',
      prices: 'Precios de referencia', pricesSub: 'Productos cuya provincia de referencia es esta (Statistics Canada, mensual) y las ofertas semanales de Alberta Agriculture.', unit: 'Unidad', vs: 'Variación',
      fuel: 'Combustible', fuelSub: 'Precio al consumidor por ciudad (Statistics Canada, mensual), centavos de dólar canadiense por litro.', city: 'Ciudad', fuelkind: 'Combustible', note: 'Fuente' },
    en: { sub: 'What the official sources publish for this region. Anything missing is stated; nothing is filled in or estimated.', home: 'Country profile', pick: 'Choose', mapAlt: 'Map. Select a region to open its profile.', missing: 'No data for this region yet', missingHint: 'Data for these areas is not published for this region or we do not have it yet:', loading: 'Loading…', unknown: 'We do not know this region. Pick one on the map.',
      drought: 'Drought', droughtSub: 'Share of the region’s area in each class (cumulative: “moderate or worse” includes severe, extreme and exceptional).', d0: 'Dry or worse', d1: 'Moderate or worse', d2: 'Severe or worse', d3: 'Extreme or worse', d4: 'Exceptional', week: 'Week of', month: 'Month of', trend: 'Trend', d1n: 'Moderate or worse', d3n: 'Extreme or worse',
      crops: 'Crops', cropsSub: 'Harvested area, yield and production for the latest published year (USDA NASS). U.S. units, as published by the source. If the year is not over yet, figures are the source’s forecasts.', crop: 'Crop', area: 'Harvested area', yield: 'Yield', prod: 'Production', year: 'Year',
      cattle: 'Cattle on feed', cattleSub: 'Inventory in feedlots of 1,000 head or more (USDA NASS, monthly report).', onfeed: 'On feed', yago: 'A year ago', prevm: 'Previous month', vsya: 'vs. a year earlier', kh: 'thousand head', asof: 'as of',
      bids: 'Local grain prices', bidsSub: 'Cash bids at the state’s markets (USDA AMS), latest day with data.', commodity: 'Commodity', range: 'Range across markets', mkts: 'markets', more: 'See the market-by-market detail',
      fert: 'Fertilizers', fertSub: 'Average retail price in the state (USDA AMS, production cost reports).', product: 'Product', price: 'Price', yoyl: 'A year ago', date: 'Date', usdt: 'USD per short ton',
      tax: 'Tax', taxSub: 'State sales tax (general rate, excluding local taxes).', rate: 'State rate', nostate: 'No state sales tax', taxCalc: 'Use it in the calculator',
      costs: 'Farm costs', costsSub: 'Farm operating expenses by item, Statistics Canada (million Canadian dollars, annual).', item: 'Item', total: 'Total expenses', share: 'of total', cad: 'M CAD',
      prices: 'Reference prices', pricesSub: 'Products whose reference province is this one (Statistics Canada, monthly) and weekly Alberta Agriculture bids.', unit: 'Unit', vs: 'Change',
      fuel: 'Fuel', fuelSub: 'Consumer price by city (Statistics Canada, monthly), Canadian cents per litre.', city: 'City', fuelkind: 'Fuel', note: 'Source' },
    fr: { sub: 'Ce que publient les sources officielles pour cette région. Ce qui manque est indiqué ; rien n’est comblé ni estimé.', home: 'Profil du pays', pick: 'Choisir', mapAlt: 'Carte. Sélectionnez une région pour ouvrir son profil.', missing: 'Pas encore de données pour cette région', missingHint: 'Les données de ces domaines ne sont pas publiées pour cette région ou nous ne les avons pas encore :', loading: 'Chargement…', unknown: 'Région inconnue. Choisissez-en une sur la carte.',
      drought: 'Sécheresse', droughtSub: 'Part de la superficie de la région dans chaque classe (cumulatif : « modérée ou pire » inclut grave, extrême et exceptionnelle).', d0: 'Sec ou pire', d1: 'Modérée ou pire', d2: 'Grave ou pire', d3: 'Extrême ou pire', d4: 'Exceptionnelle', week: 'Semaine du', month: 'Mois de', trend: 'Évolution', d1n: 'Modérée ou pire', d3n: 'Extrême ou pire',
      crops: 'Cultures', cropsSub: 'Superficie récoltée, rendement et production de la dernière année publiée (USDA NASS). Unités américaines, telles que publiées. Si l’année n’est pas terminée, ce sont des prévisions de la source.', crop: 'Culture', area: 'Superficie récoltée', yield: 'Rendement', prod: 'Production', year: 'Année',
      cattle: 'Bovins en engraissement', cattleSub: 'Effectifs dans les parcs de 1 000 têtes ou plus (USDA NASS, rapport mensuel).', onfeed: 'En engraissement', yago: 'Il y a un an', prevm: 'Mois précédent', vsya: 'par rapport à l’an dernier', kh: 'milliers de têtes', asof: 'au',
      bids: 'Prix locaux des céréales', bidsSub: 'Offres d’achat au comptant sur les marchés de l’État (USDA AMS), dernier jour avec données.', commodity: 'Produit', range: 'Écart entre marchés', mkts: 'marchés', more: 'Voir le détail par marché',
      fert: 'Engrais', fertSub: 'Prix moyen de détail dans l’État (USDA AMS, rapports de coûts de production).', product: 'Produit', price: 'Prix', yoyl: 'Il y a un an', date: 'Date', usdt: 'USD par tonne courte',
      tax: 'Taxe', taxSub: 'Taxe de vente de l’État (taux général, hors taxes locales).', rate: 'Taux de l’État', nostate: 'Pas de taxe de vente d’État', taxCalc: 'L’utiliser dans le calculateur',
      costs: 'Coûts des exploitations', costsSub: 'Dépenses d’exploitation par poste, Statistique Canada (millions de dollars canadiens, annuel).', item: 'Poste', total: 'Total des dépenses', share: 'du total', cad: 'M CAD',
      prices: 'Prix de référence', pricesSub: 'Produits dont la province de référence est celle-ci (Statistique Canada, mensuel) et offres hebdomadaires d’Alberta Agriculture.', unit: 'Unité', vs: 'Variation',
      fuel: 'Carburant', fuelSub: 'Prix à la consommation par ville (Statistique Canada, mensuel), cents canadiens par litre.', city: 'Ville', fuelkind: 'Carburant', note: 'Source' },
    it: { sub: 'Ciò che pubblicano le fonti ufficiali per questa regione. Ciò che manca è indicato; nulla viene riempito o stimato.', home: 'Profilo del paese', pick: 'Scegli', mapAlt: 'Mappa. Seleziona una regione per aprire il suo profilo.', missing: 'Ancora nessun dato per questa regione', missingHint: 'I dati di queste aree non sono pubblicati per questa regione o non li abbiamo ancora:', loading: 'Caricamento…', unknown: 'Regione sconosciuta. Sceglierne una sulla mappa.',
      drought: 'Siccità', droughtSub: 'Quota della superficie della regione in ogni classe (cumulativo: «moderata o peggio» include severa, estrema ed eccezionale).', d0: 'Secco o peggio', d1: 'Moderata o peggio', d2: 'Severa o peggio', d3: 'Estrema o peggio', d4: 'Eccezionale', week: 'Settimana del', month: 'Mese di', trend: 'Andamento', d1n: 'Moderata o peggio', d3n: 'Estrema o peggio',
      crops: 'Colture', cropsSub: 'Superficie raccolta, resa e produzione dell’ultimo anno pubblicato (USDA NASS). Unità statunitensi, come pubblicate. Se l’anno non è concluso, sono previsioni della fonte.', crop: 'Coltura', area: 'Superficie raccolta', yield: 'Resa', prod: 'Produzione', year: 'Anno',
      cattle: 'Bovini in ingrasso', cattleSub: 'Consistenza negli allevamenti di 1.000 capi o più (USDA NASS, rapporto mensile).', onfeed: 'In ingrasso', yago: 'Un anno fa', prevm: 'Mese precedente', vsya: 'rispetto a un anno prima', kh: 'migliaia di capi', asof: 'al',
      bids: 'Prezzi locali dei cereali', bidsSub: 'Offerte di acquisto a pronti sui mercati dello Stato (USDA AMS), ultimo giorno con dati.', commodity: 'Prodotto', range: 'Intervallo tra mercati', mkts: 'mercati', more: 'Vedi il dettaglio per mercato',
      fert: 'Fertilizzanti', fertSub: 'Prezzo medio al dettaglio nello Stato (USDA AMS, rapporti sui costi di produzione).', product: 'Prodotto', price: 'Prezzo', yoyl: 'Un anno fa', date: 'Data', usdt: 'USD per tonnellata corta',
      tax: 'Imposta', taxSub: 'Imposta statale sulle vendite (aliquota generale, escluse le imposte locali).', rate: 'Aliquota statale', nostate: 'Nessuna imposta statale sulle vendite', taxCalc: 'Usala nel calcolatore',
      costs: 'Costi delle aziende', costsSub: 'Spese di esercizio per voce, Statistics Canada (milioni di dollari canadesi, annuale).', item: 'Voce', total: 'Totale spese', share: 'del totale', cad: 'M CAD',
      prices: 'Prezzi di riferimento', pricesSub: 'Prodotti la cui provincia di riferimento è questa (Statistics Canada, mensile) e offerte settimanali di Alberta Agriculture.', unit: 'Unità', vs: 'Variazione',
      fuel: 'Carburante', fuelSub: 'Prezzo al consumo per città (Statistics Canada, mensile), centesimi di dollaro canadese al litro.', city: 'Città', fuelkind: 'Carburante', note: 'Fonte' }
  };
  var LBL = {
    crops: { 'CORN, GRAIN': ['Corn', 'Maíz', 'Maïs', 'Mais'], SOYBEANS: ['Soybeans', 'Soja', 'Soja', 'Soia'], WHEAT: ['Wheat', 'Trigo', 'Blé', 'Frumento'], BARLEY: ['Barley', 'Cebada', 'Orge', 'Orzo'], OATS: ['Oats', 'Avena', 'Avoine', 'Avena'], 'SORGHUM, GRAIN': ['Sorghum', 'Sorgo', 'Sorgho', 'Sorgo'], RICE: ['Rice', 'Arroz', 'Riz', 'Riso'], COTTON: ['Cotton', 'Algodón', 'Coton', 'Cotone'], HAY: ['Hay', 'Heno', 'Foin', 'Fieno'], PEANUTS: ['Peanuts', 'Cacahuetes', 'Arachides', 'Arachidi'] },
    fert: { amoniaco: ['Anhydrous ammonia', 'Amoníaco anhidro', 'Ammoniac anhydre', 'Ammoniaca anidra'], urea: ['Urea', 'Urea', 'Urée', 'Urea'], dap: ['DAP', 'DAP', 'DAP', 'DAP'], map: ['MAP', 'MAP', 'MAP', 'MAP'], potasa: ['Potash', 'Potasa', 'Potasse', 'Potassa'], uan: ['Liquid nitrogen (UAN)', 'Nitrógeno líquido (UAN)', 'Azote liquide (UAN)', 'Azoto liquido (UAN)'] },
    grain: { corn: ['Corn', 'Maíz', 'Maïs', 'Mais'], soybeans: ['Soybeans', 'Soja', 'Soja', 'Soia'], wheat: ['Wheat', 'Trigo', 'Blé', 'Frumento'], barley: ['Barley', 'Cebada', 'Orge', 'Orzo'], oats: ['Oats', 'Avena', 'Avoine', 'Avena'], sorghum: ['Sorghum', 'Sorgo', 'Sorgho', 'Sorgo'] },
    fuel: { diesel: ['Diesel', 'Diésel', 'Diesel', 'Diesel'], gasoline: ['Gasoline', 'Gasolina', 'Essence', 'Benzina'] }
  };
  var CACHE = {}, Q = (function () { var o = {}, s = location.search.replace(/^\?/, '').split('&'); s.forEach(function (p) { var k = p.split('='); if (k[0]) o[k[0]] = decodeURIComponent(k[1] || ''); }); return o; })();
  var ST = { c: (Q.c || 'US').toUpperCase(), r: (Q.r || '').toUpperCase() };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = L4[lang()]; return i == null ? 1 : i; }
  function tt() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return Number(v).toFixed(d); } }
  function dec(v) { return Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0; }
  function ms(iso) { var p = iso.split('-'); return Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1)); }
  function day(iso) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1))).toLocaleDateString(lang(), p.length > 2 ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function pct(v) { return v == null ? '' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %'; }
  function get(url) { if (!CACHE[url]) CACHE[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }).catch(function () { return null; }); return CACHE[url]; }
  function nm(cfg, id, idx) { var s = cfg.names[id]; if (!s) return id; var p = s.split('|'); return p[idx != null ? idx : li()] || p[0]; }
  function nameEn(cfg, id) { return cfg.names[id].split('|')[0]; }
  function card(title, sub, body, src) { return '<section class="di-card" style="padding:16px 18px;margin-top:14px"><h2 class="cof-h2" style="margin:0 0 4px">' + esc(title) + '</h2>' + (sub ? '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(sub) + '</p>' : '') + body + (src || '') + '</section>'; }
  function cite(id, period) { return window.DICite && window.DICite.html ? window.DICite.html(id, period ? { period: period } : {}) : ''; }
  var TH = 'padding:8px 6px;', TD = 'padding:7px 6px;border-top:1px solid var(--border);';
  function table(heads, rows, min) { return '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:' + (min || 460) + 'px;font-size:13.5px"><tr style="font-size:11px;font-weight:700;color:var(--text-faint);text-align:left">' + heads.map(function (h, i) { return '<th style="' + TH + (i ? 'text-align:right' : '') + '">' + esc(h) + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td style="' + TD + (i ? 'text-align:right;font-variant-numeric:tabular-nums' : '') + '">' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; }

  /* ---------- bloques EE. UU. ---------- */
  function usDrought(x) {
    return get('data/drought.json').then(function (d) {
      var rows = d && d.states && d.states[x.r]; if (!rows || !rows.length) return null; var t = tt(), l = rows[rows.length - 1];
      var cells = [[t.d1, l[2]], [t.d2, l[3]], [t.d3, l[4]], [t.d4, l[5]], [t.d0, l[1]]];
      var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.week) + ' ' + esc(day(l[0])) + '</p>' + '<div style="display:flex;gap:10px;flex-wrap:wrap">' + cells.map(function (c, i) { return '<div style="flex:1;min-width:110px"><div style="font-size:12px;color:var(--text-faint)">' + esc(c[0]) + '</div><div style="font-size:22px;font-weight:700">' + nf(c[1], 1) + ' %</div></div>'; }).join('') + '</div>';
      var a = [], b = []; rows.forEach(function (r) { a.push({ x: ms(r[0]), y: r[2], l: r[0] }); b.push({ x: ms(r[0]), y: r[4], l: r[0] }); });
      body += window.DehesaChart.render({ series: [{ name: t.d1n, color: '#e08a3a', pts: a }, { name: t.d3n, color: '#b03a2e', pts: b }], xMode: 'time', yMin: 0, yMax: 100, yTitle: '%', aria: t.drought + ' ' + nm(C.US, x.r), vFmt: function (v) { return nf(v, 1) + ' %'; }, yFmt: function (v) { return nf(v, 0); } });
      return card(t.drought, t.droughtSub, body, cite('us_drought_monitor', l[0].slice(0, 7)));
    });
  }
  function usCrops(x) {
    return get('data/nass-crops.json').then(function (d) {
      if (!d || !d.series) return null; var t = tt(), by = {};
      Object.keys(d.series).forEach(function (k) {
        var s = d.series[k], i = k.indexOf(' - '), crop = k.slice(0, i), st = k.slice(i + 3); if (!LBL.crops[crop] || !s.s || !s.s[x.r]) return;
        var kind = st === 'ACRES HARVESTED' ? 'area' : /^YIELD, MEASURED IN/.test(st) ? 'yield' : /^PRODUCTION, MEASURED IN/.test(st) && !/\$|PCT/.test(st) ? 'prod' : null; if (!kind) return;
        var pts = s.s[x.r].filter(function (p) { return p[1] != null && p[1] > 0; }); if (!pts.length) return;
        by[crop] = by[crop] || {}; by[crop][kind] = { pts: pts, unit: st.replace(/^.*MEASURED IN /, '').toLowerCase() };
      });
      var rows = Object.keys(by).map(function (crop) {
        var o = by[crop], yr = 0; ['area', 'yield', 'prod'].forEach(function (k) { if (o[k]) yr = Math.max(yr, +o[k].pts[o[k].pts.length - 1][0]); });
        var cell = function (k, u) { var e = o[k]; if (!e) return '<span style="color:var(--text-faint)">—</span>'; var p = e.pts[e.pts.length - 1]; if (+p[0] !== yr) return '<span style="color:var(--text-faint)">—</span>'; return nf(p[1], dec(p[1])) + ' <span style="color:var(--text-faint);font-size:12px">' + esc(u || e.unit) + '</span>'; };
        return { crop: crop, yr: yr, cells: [esc(LBL.crops[crop][li()]), cell('area', 'acres'), cell('yield'), cell('prod'), String(yr)] };
      }).filter(function (r) { return r.yr >= 2020; }).sort(function (a, b) { return a.cells[0] < b.cells[0] ? -1 : 1; });
      if (!rows.length) return null;
      return card(t.crops, t.cropsSub, table([t.crop, t.area, t.yield, t.prod, t.year], rows.map(function (r) { return r.cells; }), 560), cite('usda_nass'));
    });
  }
  function usCattle(x) {
    return get('data/cattle-on-feed.json').then(function (d) {
      if (!d || !d.reports || !d.reports.length) return null; var r = d.reports[d.reports.length - 1], en = nameEn(C.US, x.r), t = tt(), s = null;
      (r.states || []).forEach(function (q) { if (q.state === en) s = q; }); if (!s) return null;
      var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.asof) + ' ' + esc(day(r.inventoryDate)) + ' · ' + esc(t.kh) + '</p><div style="display:flex;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:130px"><div style="font-size:12px;color:var(--text-faint)">' + esc(t.onfeed) + '</div><div style="font-size:22px;font-weight:700">' + nf(s.current, 0) + '</div><div class="di-movers-hint" style="margin:0">' + esc(pct(s.pctYearAgo - 100)) + ' ' + esc(t.vsya) + '</div></div><div style="flex:1;min-width:130px"><div style="font-size:12px;color:var(--text-faint)">' + esc(t.yago) + '</div><div style="font-size:22px;font-weight:700">' + nf(s.yearAgo, 0) + '</div></div><div style="flex:1;min-width:130px"><div style="font-size:12px;color:var(--text-faint)">' + esc(t.prevm) + '</div><div style="font-size:22px;font-weight:700">' + nf(s.prevMonth, 0) + '</div></div></div>';
      return card(t.cattle, t.cattleSub, body, cite('usda_nass', r.inventoryDate.slice(0, 7)));
    });
  }
  function usBids(x) {
    return get('data/us-cash-bids/manifest.json').then(function (m) {
      var st = m && m.states && m.states[x.r]; if (!st) return null; var t = tt(), ks = Object.keys(st.commodities);
      return Promise.all(ks.map(function (k) { return get('data/us-cash-bids/' + st.commodities[k].shard); })).then(function (sh) {
        var rows = [];
        ks.forEach(function (k, i) {
          var d = sh[i]; if (!d || !d.series) return; var last = ''; d.series.forEach(function (s) { if (s.date > last) last = s.date; });
          var v = d.series.filter(function (s) { return s.date === last && s.avg != null && s.freshness === 'LIVE'; }).map(function (s) { return s.avg; }); if (!v.length) return;
          var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), u = d.series[0].unit || '';
          rows.push([esc((LBL.grain[k] || [m.commodities[k] ? m.commodities[k].name : k])[li()] || k), lo === hi ? nf(lo, 2) : nf(lo, 2) + ' – ' + nf(hi, 2), esc('USD/' + u), esc(day(last)), String(v.length)]);
        });
        if (!rows.length) return null;
        var body = table([t.commodity, t.range, '', t.date, t.mkts], rows, 520) + '<p class="di-movers-hint" style="margin:8px 0 0"><a href="precios-locales.html">' + esc(t.more) + ' →</a></p>';
        return card(t.bids, t.bidsSub, body, cite('usda_ams_mars'));
      });
    });
  }
  function usFert(x) {
    return get('data/us-fertilizers.json').then(function (d) {
      if (!d || !d.products) return null; var en = nameEn(C.US, x.r), t = tt(), rows = [];
      d.products.forEach(function (p) { p.states.forEach(function (s) { if (s.state === en) rows.push([esc((LBL.fert[p.id] || [p.id, p.id, p.id, p.id])[li()]) + ' <span style="color:var(--text-faint);font-size:12px">' + esc(s.spec) + '</span>', nf(s.avg, 0), s.yoy != null ? nf(s.yoy, 0) : '—', esc(day(s.date))]); }); });
      if (!rows.length) return null;
      return card(t.fert, t.fertSub + ' ' + t.usdt + '.', table([t.product, t.price, t.yoyl, t.date], rows, 520), cite('usda_ams_mars'));
    });
  }
  function usTax(x) {
    return get('data/other-tax.json').then(function (d) {
      var s = d && d.us && d.us.states && d.us.states[x.r]; if (!s) return null; var t = tt();
      var body = '<div style="font-size:22px;font-weight:700">' + (s.noStateSalesTax ? esc(t.nostate) : nf(s.rate, 2) + ' %') + '</div><p class="di-movers-hint" style="margin:6px 0 0">' + esc(d.us.name + ' · ' + (d.us.source ? d.us.source.name : '')) + '. <a href="calculadora.html">' + esc(t.taxCalc) + ' →</a></p>';
      return card(t.tax, t.taxSub, body, '');
    });
  }
  /* ---------- bloques Canadá ---------- */
  function caDrought(x) {
    return get('data/canada-drought.json').then(function (d) {
      var p = d && d.provinces && d.provinces[x.r]; if (!p) return null; var t = tt(), n = d.periods.length - 1, l = p.v[n];
      var cells = [[t.d1, l[1]], [t.d2, l[2]], [t.d3, l[3]], [t.d4, l[4]], [t.d0, l[0]]];
      var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.month) + ' ' + esc(day(d.asOf.slice(0, 7))) + '</p><div style="display:flex;gap:10px;flex-wrap:wrap">' + cells.map(function (c) { return '<div style="flex:1;min-width:110px"><div style="font-size:12px;color:var(--text-faint)">' + esc(c[0]) + '</div><div style="font-size:22px;font-weight:700">' + nf(c[1], 1) + ' %</div></div>'; }).join('') + '</div>';
      var a = [], b = []; d.periods.forEach(function (q, i) { a.push({ x: ms(q), y: p.v[i][1], l: q }); b.push({ x: ms(q), y: p.v[i][3], l: q }); });
      body += window.DehesaChart.render({ series: [{ name: t.d1n, color: '#e08a3a', pts: a }, { name: t.d3n, color: '#b03a2e', pts: b }], xMode: 'time', yMin: 0, yMax: 100, yTitle: '%', aria: t.drought + ' ' + nm(C.CA, x.r), vFmt: function (v) { return nf(v, 1) + ' %'; }, yFmt: function (v) { return nf(v, 0); } });
      return card(t.drought, t.droughtSub + ' ' + (lang() === 'es' ? 'Es la superficie total de la provincia, no solo la agrícola.' : lang() === 'fr' ? 'C’est la superficie totale de la province, pas seulement agricole.' : lang() === 'it' ? 'È la superficie totale della provincia, non solo quella agricola.' : 'This is the province’s total area, not only farmland.'), body, cite('aafc_drought', d.asOf.slice(0, 7)));
    });
  }
  var EXP_L = { total: ['Total expenses', 'Total de gastos', 'Total des dépenses', 'Totale spese'], interest: ['Interest', 'Intereses', 'Intérêts', 'Interessi'], 'machinery-fuel': ['Machinery fuel', 'Combustible de maquinaria', 'Carburant des machines', 'Carburante macchinari'], feed: ['Feed', 'Piensos', 'Aliments du bétail', 'Mangimi'], 'fertiliser-and-lime': ['Fertiliser and lime', 'Fertilizantes y cal', 'Engrais et chaux', 'Fertilizzanti e calce'] };
  function caCosts(x) {
    var slug = CA_SLUG[x.r]; if (!slug) return Promise.resolve(null);
    return get('data/canada-stats.json').then(function (d) {
      var S = d && d.countries && d.countries.CA && d.countries.CA.series; if (!S) return null; var t = tt(), tot = null, rows = [], per = null;
      S.forEach(function (s) { if (s.id.indexOf('ca-exp-' + slug + '-') !== 0) return; var k = s.id.slice(('ca-exp-' + slug + '-').length); if (k === 'total-expenses') { tot = s; per = s.latestPeriod; } });
      if (!tot) return null;
      S.forEach(function (s) { if (s.id.indexOf('ca-exp-' + slug + '-') !== 0) return; var k = s.id.slice(('ca-exp-' + slug + '-').length); if (k === 'total-expenses' || !EXP_L[k]) return; rows.push([esc(EXP_L[k][li()]), nf(s.latest, 0), nf(s.latest / tot.latest * 100, 1) + ' %', esc(s.latestPeriod)]); });
      rows.unshift(['<b>' + esc(t.total) + '</b>', '<b>' + nf(tot.latest, 0) + '</b>', '', esc(per)]);
      return card(t.costs, t.costsSub, table([t.item, t.cad, t.share, t.year], rows, 460), cite('statcan', per));
    });
  }
  function caPrices(x) {
    return get('data/latest.json').then(function (d) {
      if (!d || !d.observations) return null; var t = tt(), N = (window.DehesaData && window.DehesaData.NAMES && window.DehesaData.NAMES[lang()]) || {}, en = nameEn(C.CA, x.r), rows = [];
      d.observations.forEach(function (o) { if (o.region !== 'ca' || o.province !== en || o.value == null) return; rows.push([esc(N[o.product] || o.product), nf(o.value, dec(o.value)) + ' <span style="color:var(--text-faint);font-size:12px">' + esc(o.currency || 'CAD') + '/' + esc(o.unit) + '</span>', esc(pct(o.changePct)), esc(day(o.observationDate)), o.sourceId]); });
      if (!rows.length) return null; rows.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
      var srcs = {}; rows.forEach(function (r) { srcs[r[4]] = 1; });
      return card(t.prices, t.pricesSub, table([t.product, t.price, t.vs, t.date], rows.map(function (r) { return r.slice(0, 4); }), 520), Object.keys(srcs).map(function (s) { return cite(s); }).join(''));
    });
  }
  function caFuel(x) {
    var cities = CA_CITY[x.r]; if (!cities) return Promise.resolve(null);
    return get('data/canada-stats.json').then(function (d) {
      var S = d && d.countries && d.countries.CA && d.countries.CA.series; if (!S) return null; var t = tt(), rows = [], per = '';
      S.forEach(function (s) { cities.forEach(function (c) { if (s.id.indexOf('ca-fuel-' + c + '-') !== 0) return; var k = /diesel/.test(s.id) ? 'diesel' : 'gasoline'; rows.push([esc(CA_CITY_N[c]), esc(LBL.fuel[k][li()]), nf(s.latest, 1), esc(day(s.latestPeriod))]); per = s.latestPeriod; }); });
      if (!rows.length) return null;
      return card(t.fuel, t.fuelSub, table([t.city, t.fuelkind, 'c/L', t.date], rows, 420), cite('statcan', per));
    });
  }
  var MODS = { US: [['drought', usDrought], ['crops', usCrops], ['cattle', usCattle], ['bids', usBids], ['fert', usFert], ['tax', usTax]], CA: [['drought', caDrought], ['costs', caCosts], ['prices', caPrices], ['fuel', caFuel]] };
  var MOD_NAME = { drought: 'drought', crops: 'crops', cattle: 'cattle', bids: 'bids', fert: 'fert', tax: 'tax', costs: 'costs', prices: 'prices', fuel: 'fuel' };
  /* ---------- mapa y página ---------- */
  function mapSvg(cfg, r) {
    var M = window[cfg.map]; if (!M) return '';
    return '<svg viewBox="' + M.viewBox + '" role="img" aria-label="' + esc(tt().mapAlt) + '" style="width:100%;height:auto;display:block">' + M.states.map(function (s) { var on = s.id === r, name = nm(cfg, s.id); return '<a href="region.html?c=' + ST.c + '&amp;r=' + s.id + '"><path d="' + s.d + '" fill="' + (on ? '#2f6b4a' : '#cfd8cc') + '" stroke="#fff" stroke-width="1" style="cursor:pointer"><title>' + esc(name) + '</title></path></a>'; }).join('') + '</svg>';
  }
  var seq = 0;
  // canonical y og:url propios por region (la pagina es una sola con ?c=&r=)
  function setCanonical() { var u = 'https://dehesaindex.com/region.html' + (C[ST.c] && C[ST.c].names[ST.r] ? '?c=' + ST.c + '&r=' + ST.r : ''), c = document.querySelector('link[rel="canonical"]'), o = document.querySelector('meta[property="og:url"]'); if (c) c.setAttribute('href', u); if (o) o.setAttribute('content', u); }
  function render() {
    setCanonical();
    var root = document.getElementById('rg-body'), t = tt(), cfg = C[ST.c]; if (!root) return;
    if (!cfg) { root.innerHTML = '<p class="di-movers-hint">' + esc(t.unknown) + '</p>'; return; }
    var ids = Object.keys(cfg.names).sort(function (a, b) { return nm(cfg, a) < nm(cfg, b) ? -1 : 1; }), known = !!cfg.names[ST.r];
    var h1 = document.getElementById('pg-h1'), sub = document.getElementById('pg-sub'), cr = document.getElementById('rg-crumb');
    if (cr) cr.innerHTML = '<a href="' + cfg.profile + '">' + cfg.flag + ' ' + esc(t.home + ' · ' + cfg.country[li()]) + '</a>';
    if (h1) h1.textContent = known ? nm(cfg, ST.r) : cfg.kinds[li()].charAt(0).toUpperCase() + cfg.kinds[li()].slice(1); if (sub) sub.textContent = t.sub;
    document.title = 'Dehesa Index — ' + (known ? nm(cfg, ST.r) + ' · ' + cfg.country[li()] : cfg.country[li()]);
    var side = '<div class="di-card" style="padding:12px 14px"><label style="font-size:13px;display:block;margin-bottom:8px">' + esc(cfg.kind[li()]) + '<br><select id="rg-sel" class="di-compare-select"><option value="">' + esc(t.pick) + '…</option>' + ids.map(function (i) { return '<option value="' + i + '"' + (i === ST.r ? ' selected' : '') + '>' + esc(nm(cfg, i)) + '</option>'; }).join('') + '</select></label>' + mapSvg(cfg, ST.r) + '</div>';
    if (!known) { root.innerHTML = side; bind(); return; }
    root.innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start"><div style="flex:1 1 300px;max-width:420px;position:sticky;top:12px">' + side + '</div><div id="rg-main" style="flex:2 1 420px;min-width:0"><p class="di-movers-hint">' + esc(t.loading) + '</p></div></div>';
    bind(); var my = ++seq, x = { c: ST.c, r: ST.r };
    Promise.all(MODS[ST.c].map(function (m) { return m[1](x).catch(function () { return null; }); })).then(function (out) {
      if (my !== seq) return; var el = document.getElementById('rg-main'); if (!el) return; var miss = [];
      var html = out.map(function (h, i) { if (!h) miss.push(t[MOD_NAME[MODS[ST.c][i][0]]]); return h || ''; }).join('');
      if (miss.length) html += '<section class="di-card" style="padding:14px 18px;margin-top:14px"><b>' + esc(t.missing) + '</b><p class="di-movers-hint" style="margin:6px 0 0">' + esc(t.missingHint) + ' ' + esc(miss.join(', ')) + '.</p></section>';
      el.innerHTML = html;
    });
  }
  function bind() { var s = document.getElementById('rg-sel'); if (s) s.onchange = function () { if (!s.value) return; ST.r = s.value; try { history.pushState(null, '', 'region.html?c=' + ST.c + '&r=' + ST.r); } catch (e) {} render(); }; }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  window.addEventListener('popstate', function () { var s = location.search; var m = /[?&]c=([A-Za-z]+)/.exec(s), r = /[?&]r=([A-Za-z]+)/.exec(s); ST.c = m ? m[1].toUpperCase() : 'US'; ST.r = r ? r[1].toUpperCase() : ''; render(); });
  Promise.all([window.DICite ? window.DICite.load().catch(function () {}) : Promise.resolve()]).then(render, render);
})();
