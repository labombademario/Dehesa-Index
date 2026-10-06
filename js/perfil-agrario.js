/* Perfil agrario por país (Banco Mundial, WDI, CC BY 4.0) - ES5, sin librerías.
   Lee data/worldbank-agri.json (solo al abrir el desplegable). Uso: DIAgri.mount(el, 'ES', lang) */
(function () {
  'use strict';
  var FILE = 'data/worldbank-agri.json', DATA = null, LOADING = null;
  var UNITS = {
    pct: '%', km2: 'km²', ha: 'ha', haPc: { es: 'ha/persona', en: 'ha/person', fr: 'ha/personne', it: 'ha/persona' }, mha: 'M ha', kgha: 'kg/ha', mt: 'Mt',
    idx: { es: 'índice 2014-16 = 100', en: 'index 2014-16 = 100', fr: 'indice 2014-16 = 100', it: 'indice 2014-16 = 100' },
    cpi: { es: 'índice 2010 = 100', en: 'index 2010 = 100', fr: 'indice 2010 = 100', it: 'indice 2010 = 100' },
    usdK: { es: 'US$ constantes 2015 por trabajador', en: 'constant 2015 US$ per worker', fr: 'US$ constants 2015 par travailleur', it: 'US$ costanti 2015 per lavoratore' },
    usdB: { es: 'mil millones de US$', en: 'US$ billion', fr: 'milliards de US$', it: 'miliardi di US$' },
    lcu: { es: 'moneda local por US$', en: 'local currency per US$', fr: 'monnaie locale par US$', it: 'valuta locale per US$' },
    ann: { es: '% anual', en: '% per year', fr: '% par an', it: '% annuo' },
    co2: { es: 'Mt CO₂ eq.', en: 'Mt CO₂e', fr: 'Mt CO₂ éq.', it: 'Mt CO₂ eq.' }
  };
  // clave: [es, en, fr, it, unidad, tipo de cambio de 10 años: 'pp' (puntos), 'pct' (%) o null]
  var IND = {
    agriLandPct: ['Tierra agrícola (% del territorio)', 'Agricultural land (% of land area)', 'Terres agricoles (% du territoire)', 'Terreno agricolo (% del territorio)', 'pct', 'pp'],
    agriLandKm2: ['Superficie agrícola', 'Agricultural land area', 'Surface agricole', 'Superficie agricola', 'km2', 'pct'],
    arableLandPct: ['Tierra de cultivo (% del territorio)', 'Arable land (% of land area)', 'Terres arables (% du territoire)', 'Seminativi (% del territorio)', 'pct', 'pp'],
    arablePerCap: ['Tierra de cultivo por habitante', 'Arable land per person', 'Terres arables par habitant', 'Seminativi per abitante', 'haPc', 'pct'],
    irrigatedPct: ['Superficie de regadío (% de la agrícola)', 'Irrigated land (% of agricultural land)', 'Terres irriguées (% des terres agricoles)', 'Terreno irrigato (% di quello agricolo)', 'pct', 'pp'],
    agriEmploymentPct: ['Empleo en la agricultura (% del total)', 'Employment in agriculture (% of total)', 'Emploi agricole (% du total)', 'Occupazione in agricoltura (% del totale)', 'pct', 'pp'],
    agriVaPerWorker: ['Valor añadido agrario por trabajador', 'Agricultural value added per worker', 'Valeur ajoutée agricole par travailleur', 'Valore aggiunto agricolo per lavoratore', 'usdK', 'pct'],
    agriVaUsd: ['Valor añadido agrario', 'Agricultural value added', 'Valeur ajoutée agricole', 'Valore aggiunto agricolo', 'usdB', 'pct'],
    agriVaPct: ['Peso de la agricultura en el PIB', 'Agriculture share of GDP', 'Part de l’agriculture dans le PIB', 'Peso dell’agricoltura nel PIL', 'pct', 'pp'],
    cerealYield: ['Rendimiento de cereales', 'Cereal yield', 'Rendement des céréales', 'Resa dei cereali', 'kgha', 'pct'],
    cerealArea: ['Superficie de cereales', 'Land under cereals', 'Surface en céréales', 'Superficie a cereali', 'mha', 'pct'],
    cerealProd: ['Producción de cereales', 'Cereal production', 'Production de céréales', 'Produzione di cereali', 'mt', 'pct'],
    fertKgHa: ['Fertilizante por hectárea cultivable', 'Fertilizer per hectare of arable land', 'Engrais par hectare arable', 'Fertilizzante per ettaro di seminativo', 'kgha', 'pct'],
    cropIdx: ['Índice de producción agrícola', 'Crop production index', 'Indice de production végétale', 'Indice di produzione vegetale', 'idx', 'pct'],
    livestockIdx: ['Índice de producción ganadera', 'Livestock production index', 'Indice de production animale', 'Indice di produzione zootecnica', 'idx', 'pct'],
    foodIdx: ['Índice de producción de alimentos', 'Food production index', 'Indice de production alimentaire', 'Indice di produzione alimentare', 'idx', 'pct'],
    agriRawExpPct: ['Materias primas agrarias (% de las exportaciones)', 'Agricultural raw materials (% of exports)', 'Matières premières agricoles (% des exportations)', 'Materie prime agricole (% delle esportazioni)', 'pct', 'pp'],
    agriRawImpPct: ['Materias primas agrarias (% de las importaciones)', 'Agricultural raw materials (% of imports)', 'Matières premières agricoles (% des importations)', 'Materie prime agricole (% delle importazioni)', 'pct', 'pp'],
    foodExpPct: ['Alimentos (% de las exportaciones)', 'Food (% of exports)', 'Produits alimentaires (% des exportations)', 'Alimentari (% delle esportazioni)', 'pct', 'pp'],
    foodImpPct: ['Alimentos (% de las importaciones)', 'Food (% of imports)', 'Produits alimentaires (% des importations)', 'Alimentari (% delle importazioni)', 'pct', 'pp'],
    cpi: ['Índice de precios al consumo (IPC)', 'Consumer price index (CPI)', 'Indice des prix à la consommation (IPC)', 'Indice dei prezzi al consumo (IPC)', 'cpi', 'pct'],
    inflation: ['Inflación anual', 'Annual inflation', 'Inflation annuelle', 'Inflazione annua', 'ann', null],
    fxUsd: ['Tipo de cambio oficial frente al dólar', 'Official exchange rate per US dollar', 'Taux de change officiel par dollar', 'Cambio ufficiale per dollaro', 'lcu', 'pct'],
    gdpGrowth: ['Crecimiento del PIB', 'GDP growth', 'Croissance du PIB', 'Crescita del PIL', 'ann', null],
    forestPct: ['Superficie forestal (% del territorio)', 'Forest area (% of land area)', 'Surface forestière (% du territoire)', 'Superficie forestale (% del territorio)', 'pct', 'pp'],
    permCropPct: ['Cultivos permanentes (% del territorio)', 'Permanent cropland (% of land area)', 'Cultures permanentes (% du territoire)', 'Colture permanenti (% del territorio)', 'pct', 'pp'],
    ruralPopPct: ['Población rural (% del total)', 'Rural population (% of total)', 'Population rurale (% du total)', 'Popolazione rurale (% del totale)', 'pct', 'pp'],
    agriEmpFemalePct: ['Empleo agrario femenino (% del empleo femenino)', 'Female employment in agriculture (% of female employment)', 'Emploi agricole féminin (% de l’emploi féminin)', 'Occupazione agricola femminile (% dell’occupazione femminile)', 'pct', 'pp'],
    agriEmpMalePct: ['Empleo agrario masculino (% del empleo masculino)', 'Male employment in agriculture (% of male employment)', 'Emploi agricole masculin (% de l’emploi masculin)', 'Occupazione agricola maschile (% dell’occupazione maschile)', 'pct', 'pp'],
    agriVaGrowth: ['Crecimiento del valor añadido agrario', 'Agricultural value added growth', 'Croissance de la valeur ajoutée agricole', 'Crescita del valore aggiunto agricolo', 'ann', null],
    ch4Agri: ['Metano de la agricultura', 'Agricultural methane emissions', 'Méthane de l’agriculture', 'Metano dell’agricoltura', 'co2', 'pct'],
    n2oAgri: ['Óxido nitroso de la agricultura', 'Agricultural nitrous oxide emissions', 'Protoxyde d’azote de l’agriculture', 'Protossido di azoto dell’agricoltura', 'co2', 'pct'],
    waterAgriPct: ['Agua dulce usada por la agricultura (% del total)', 'Freshwater used by agriculture (% of total)', 'Eau douce utilisée par l’agriculture (% du total)', 'Acqua dolce usata dall’agricoltura (% del totale)', 'pct', 'pp']
  };
  var BLOCKS = [
    ['structure', ['agriLandPct', 'arableLandPct', 'arablePerCap', 'irrigatedPct', 'agriEmploymentPct', 'agriVaPerWorker', 'agriVaPct', 'agriVaUsd', 'agriLandKm2', 'permCropPct', 'forestPct', 'ruralPopPct', 'agriEmpFemalePct', 'agriEmpMalePct']],
    ['yield', ['cerealYield', 'cerealArea', 'cerealProd', 'fertKgHa']],
    ['indices', ['cropIdx', 'livestockIdx', 'foodIdx', 'agriVaGrowth']],
    ['trade', ['foodExpPct', 'foodImpPct', 'agriRawExpPct', 'agriRawImpPct']],
    ['macro', ['cpi', 'inflation', 'fxUsd', 'gdpGrowth']],
    ['environment', ['ch4Agri', 'n2oAgri', 'waterAgriPct']]
  ];
  var T = {
    es: { title: 'Perfil agrario', open: 'Ver el perfil agrario y la comparación con otros países', hint: 'Estructura del campo, rendimientos, comercio agrario, precios y medio ambiente, con serie desde 1990 y el año de cada dato. Fuente: Banco Mundial (WDI).',
      B: { structure: 'Estructura', yield: 'Rendimiento e insumos', indices: 'Índices de producción', trade: 'Comercio agrario', macro: 'Precios y macro', environment: 'Medio ambiente' },
      ind: 'Indicador', last: 'Último dato', chg: 'Vs. 10 años antes', trend: 'Tendencia', cmp: 'Comparar con', none: 'ninguno', pp: 'pp', loading: 'Cargando…', err: 'No se han podido cargar los datos del Banco Mundial.', noData: 'Sin datos para este país.',
      click: 'Pulsa una fila para ver su gráfico y compararla con otro país.', year: 'Año', bn: ' mil M', yearsAgo: '',
      notes: { macro: 'El IPC permite deflactar precios (precio real = precio ÷ IPC × 100), pero todavía no lo aplicamos a las series de precios de la web. Antes de 1999 el Banco Mundial da el tipo de cambio de los países del euro en su moneda anterior: no lo mostramos. Sin dato de IPC ni tipo de cambio para la UE en conjunto.', structure: 'El valor añadido por trabajador del Banco Mundial para EE. UU. solo tiene el año 2015.', yield: 'Cereales: trigo, maíz, cebada, arroz y otros, según la FAO.', trade: 'Porcentajes sobre el total de mercancías, no sobre el comercio agrario.', environment: 'Emisiones del sector agrario según EDGAR (JRC), en millones de toneladas de CO₂ equivalente. El agua dulce procede de AQUASTAT (FAO).', indices: 'Base 2014-2016 = 100 (FAO).' } },
    en: { title: 'Agricultural profile', open: 'See the agricultural profile and compare with other countries', hint: 'Farm structure, yields, agri-food trade, prices and environment, as a series from 1990 with the year of each figure. Source: World Bank (WDI).',
      B: { structure: 'Structure', yield: 'Yield and inputs', indices: 'Production indices', trade: 'Agri-food trade', macro: 'Prices and macro', environment: 'Environment' },
      ind: 'Indicator', last: 'Latest', chg: 'Vs. 10 years earlier', trend: 'Trend', cmp: 'Compare with', none: 'none', pp: 'pp', loading: 'Loading…', err: 'The World Bank data could not be loaded.', noData: 'No data for this country.',
      click: 'Click a row to see its chart and compare it with another country.', year: 'Year', bn: ' bn', yearsAgo: '',
      notes: { macro: 'The CPI can be used to deflate prices (real price = price ÷ CPI × 100), but we do not yet apply it to the price series on the site. Before 1999 the World Bank gives euro-area exchange rates in the former national currency: we do not show them. No CPI or exchange rate for the EU as a whole.', structure: 'The World Bank’s value added per worker for the US only has the year 2015.', yield: 'Cereals: wheat, maize, barley, rice and others, according to FAO.', trade: 'Percentages of total merchandise trade, not of agri-food trade.', environment: 'Agricultural emissions from EDGAR (JRC), in million tonnes of CO₂ equivalent. Fresh water comes from AQUASTAT (FAO).', indices: 'Base 2014-2016 = 100 (FAO).' } },
    fr: { title: 'Profil agricole', open: 'Voir le profil agricole et la comparaison avec d’autres pays', hint: 'Structure agricole, rendements, commerce agroalimentaire, prix et environnement, en série depuis 1990 avec l’année de chaque donnée. Source : Banque mondiale (WDI).',
      B: { structure: 'Structure', yield: 'Rendement et intrants', indices: 'Indices de production', trade: 'Commerce agroalimentaire', macro: 'Prix et macro', environment: 'Environnement' },
      ind: 'Indicateur', last: 'Dernière donnée', chg: 'Vs 10 ans avant', trend: 'Tendance', cmp: 'Comparer avec', none: 'aucun', pp: 'pt', loading: 'Chargement…', err: 'Impossible de charger les données de la Banque mondiale.', noData: 'Pas de données pour ce pays.',
      click: 'Cliquez sur une ligne pour voir son graphique et la comparer avec un autre pays.', year: 'Année', bn: ' Md', yearsAgo: '',
      notes: { macro: 'L’IPC permet de déflater les prix (prix réel = prix ÷ IPC × 100), mais nous ne l’appliquons pas encore aux séries de prix du site. Avant 1999, la Banque mondiale donne les taux de change de la zone euro dans l’ancienne monnaie nationale : nous ne les montrons pas. Pas d’IPC ni de taux de change pour l’UE dans son ensemble.', structure: 'La valeur ajoutée par travailleur de la Banque mondiale pour les États-Unis ne couvre que l’année 2015.', yield: 'Céréales : blé, maïs, orge, riz et autres, selon la FAO.', trade: 'Pourcentages du commerce total de marchandises, pas du commerce agroalimentaire.', environment: 'Émissions agricoles selon EDGAR (JRC), en millions de tonnes d’équivalent CO₂. L’eau douce provient d’AQUASTAT (FAO).', indices: 'Base 2014-2016 = 100 (FAO).' } },
    it: { title: 'Profilo agricolo', open: 'Vedi il profilo agricolo e il confronto con altri paesi', hint: 'Struttura agricola, rese, commercio agroalimentare, prezzi e ambiente, in serie dal 1990 con l’anno di ogni dato. Fonte: Banca mondiale (WDI).',
      B: { structure: 'Struttura', yield: 'Rese e input', indices: 'Indici di produzione', trade: 'Commercio agroalimentare', macro: 'Prezzi e macro', environment: 'Ambiente' },
      ind: 'Indicatore', last: 'Ultimo dato', chg: 'Vs 10 anni prima', trend: 'Andamento', cmp: 'Confronta con', none: 'nessuno', pp: 'pp', loading: 'Caricamento…', err: 'Impossibile caricare i dati della Banca mondiale.', noData: 'Nessun dato per questo paese.',
      click: 'Clicca una riga per vedere il grafico e confrontarla con un altro paese.', year: 'Anno', bn: ' mld', yearsAgo: '',
      notes: { macro: 'L’IPC permette di deflazionare i prezzi (prezzo reale = prezzo ÷ IPC × 100), ma non lo applichiamo ancora alle serie di prezzi del sito. Prima del 1999 la Banca mondiale dà i cambi dei paesi dell’euro nella vecchia valuta nazionale: non li mostriamo. Nessun IPC né cambio per l’UE nel suo insieme.', structure: 'Il valore aggiunto per lavoratore della Banca mondiale per gli USA copre solo il 2015.', yield: 'Cereali: grano, mais, orzo, riso e altri, secondo la FAO.', trade: 'Percentuali sul totale delle merci, non sul commercio agroalimentare.', environment: 'Emissioni agricole secondo EDGAR (JRC), in milioni di tonnellate di CO₂ equivalente. L’acqua dolce proviene da AQUASTAT (FAO).', indices: 'Base 2014-2016 = 100 (FAO).' } }
  };
  var CN = {
    es: { US: 'Estados Unidos', EU: 'Unión Europea', ES: 'España', FR: 'Francia', DE: 'Alemania', BE: 'Bélgica', AT: 'Austria', PT: 'Portugal', IT: 'Italia', DK: 'Dinamarca', NL: 'Países Bajos', CA: 'Canadá', AU: 'Australia' },
    en: { US: 'United States', EU: 'European Union', ES: 'Spain', FR: 'France', DE: 'Germany', BE: 'Belgium', AT: 'Austria', PT: 'Portugal', IT: 'Italy', DK: 'Denmark', NL: 'Netherlands', CA: 'Canada', AU: 'Australia' },
    fr: { US: 'États-Unis', EU: 'Union européenne', ES: 'Espagne', FR: 'France', DE: 'Allemagne', BE: 'Belgique', AT: 'Autriche', PT: 'Portugal', IT: 'Italie', DK: 'Danemark', NL: 'Pays-Bas', CA: 'Canada', AU: 'Australie' },
    it: { US: 'Stati Uniti', EU: 'Unione europea', ES: 'Spagna', FR: 'Francia', DE: 'Germania', BE: 'Belgio', AT: 'Austria', PT: 'Portogallo', IT: 'Italia', DK: 'Danimarca', NL: 'Paesi Bassi', CA: 'Canada', AU: 'Australia' }
  };
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d, lang) { try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function unit(k, lang) { var u = UNITS[IND[k][4]]; return typeof u === 'string' ? u : u[lang]; }
  function at(s, y) { var i = y - s.y0; return i >= 0 && i < s.v.length ? s.v[i] : null; }
  function last(s) { return { y: s.y0 + s.v.length - 1, v: s.v[s.v.length - 1] }; }
  function fmt(k, v, lang, t) {
    var u = IND[k][4];
    if (u === 'usdB') return nf(v / 1e9, v >= 1e10 ? 0 : 1, lang) + t.bn + ' US$';
    if (u === 'mt') return nf(v / 1e6, v >= 1e7 ? 0 : 1, lang) + ' Mt';
    if (u === 'mha') return nf(v / 1e6, v >= 1e7 ? 0 : 1, lang) + ' M ha';
    if (u === 'km2') return nf(v, 0, lang) + ' km²';
    if (u === 'pct' || u === 'ann') return nf(v, 1, lang) + ' %';
    if (u === 'kgha') return nf(v, 0, lang) + ' kg/ha';
    if (u === 'haPc') return nf(v, 2, lang) + ' ha';
    if (u === 'usdK') return nf(v, 0, lang) + ' US$';
    if (u === 'lcu') return nf(v, v >= 100 ? 0 : 2, lang);
    return nf(v, v >= 100 ? 0 : 1, lang);
  }
  function chgOf(k, s, lang, t) {
    var mode = IND[k][5]; if (!mode) return '–';
    var l = last(s), b = at(s, l.y - 10); if (b == null || l.v == null) return '–';
    if (mode === 'pp') { var d = l.v - b; if (Math.abs(d) < 0.05) d = 0; return (d > 0 ? '+' : d < 0 ? '−' : '') + nf(Math.abs(d), 1, lang) + ' ' + t.pp; }
    if (!(b > 0)) return '–';
    var p = (l.v - b) / b * 100; if (Math.abs(p) < 0.05) p = 0; return (p > 0 ? '+' : p < 0 ? '−' : '') + nf(Math.abs(p), 1, lang) + ' %';
  }
  function spark(s) {
    var v = s.v.filter(function (x) { return x != null; }).slice(-30); if (v.length < 2) return '';
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), w = 84, h = 24, rg = mx - mn || 1;
    var pts = v.map(function (x, i) { return (i / (v.length - 1) * w).toFixed(1) + ',' + (h - 2 - (x - mn) / rg * (h - 4)).toFixed(1); }).join(' ');
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline fill="none" stroke="#2f6b4a" stroke-width="1.6" points="' + pts + '"/></svg>';
  }
  function chart(k, cc, other, lang, t) {
    var C = window.DehesaChart; if (!C) return '';
    var names = CN[lang] || CN.es, ser = [], cols = ['#2f6b4a', '#b7791f'];
    [cc, other].forEach(function (c, i) {
      if (!c || !DATA.countries[c] || !DATA.countries[c][k]) return;
      var s = DATA.countries[c][k], pts = [];
      s.v.forEach(function (v, j) { if (v != null) pts.push({ x: Date.UTC(s.y0 + j, 0, 1), y: v, l: String(s.y0 + j) }); });
      if (pts.length > 1) ser.push({ name: names[c] || c, color: cols[i], pts: pts });
    });
    if (!ser.length) return '';
    var d = IND[k][4] === 'haPc' ? 2 : 1;
    return C.render({ series: ser, xMode: 'time', xTitle: t.year, yTitle: unit(k, lang), aria: IND[k][LI[lang]] + ' (' + unit(k, lang) + ')', noLegend: ser.length < 2,
      vFmt: function (v) { return Math.abs(v) >= 1e9 ? nf(v / 1e9, 1, lang) + t.bn : Math.abs(v) >= 1e6 ? nf(v / 1e6, 1, lang) + ' M' : nf(v, Math.abs(v) >= 100 ? 0 : d, lang); },
      xFmt: function (x) { return new Date(x).getUTCFullYear(); } });
  }
  function render(el, cc, lang, st) {
    var t = T[lang] || T.es, li = LI[lang] != null ? LI[lang] : 0, names = CN[lang] || CN.es, body = el.querySelector('.pa-body'); if (!body) return;
    var cs = DATA.countries[cc]; if (!cs || !Object.keys(cs).length) { body.innerHTML = '<p class="di-movers-hint">' + esc(t.noData) + '</p>'; return; }
    var avail = BLOCKS.filter(function (b) { return b[1].some(function (k) { return cs[k]; }); });
    if (!st.b || !avail.some(function (b) { return b[0] === st.b; })) st.b = avail[0][0];
    var blk = BLOCKS.filter(function (b) { return b[0] === st.b; })[0], maxY = 0, h = '';
    h += '<div class="di-src-tabs" role="group">' + avail.map(function (b) { return '<button type="button" class="di-src-tab" data-pab="' + b[0] + '" aria-pressed="' + (b[0] === st.b) + '">' + esc(t.B[b[0]]) + '</button>'; }).join('') + '</div>';
    h += '<div style="overflow-x:auto"><table class="pa-t" data-no-cards><thead><tr><th scope="col">' + esc(t.ind) + '</th><th scope="col" class="r">' + esc(t.last) + '</th><th scope="col" class="r">' + esc(t.chg) + '</th><th scope="col" class="pa-tr">' + esc(t.trend) + '</th></tr></thead><tbody>';
    blk[1].forEach(function (k) {
      var s = cs[k]; if (!s) return; var l = last(s); if (l.y > maxY) maxY = l.y;
      var sel = st.k === k;
      h += '<tr class="pa-r' + (sel ? ' on' : '') + '" data-pak="' + k + '" tabindex="0" role="button" aria-expanded="' + sel + '"><td>' + esc(IND[k][li]) + '</td><td class="r"><b>' + esc(fmt(k, l.v, lang, t)) + '</b> <span class="pa-y">(' + l.y + ')</span></td><td class="r">' + esc(chgOf(k, s, lang, t)) + '</td><td class="pa-tr">' + spark(s) + '</td></tr>';
      if (sel) {
        var opts = '<option value="">' + esc(t.none) + '</option>' + Object.keys(names).filter(function (c) { return c !== cc && DATA.countries[c] && DATA.countries[c][k]; }).map(function (c) { return '<option value="' + c + '"' + (st.o === c ? ' selected' : '') + '>' + esc(names[c]) + '</option>'; }).join('');
        h += '<tr class="pa-ch"><td colspan="4"><div class="pa-cmp"><b>' + esc(IND[k][li]) + '</b> · ' + esc(unit(k, lang)) + '<label>' + esc(t.cmp) + ' <select class="di-compare-select" data-pao="1">' + opts + '</select></label></div>' + chart(k, cc, st.o, lang, t) + '</td></tr>';
      }
    });
    h += '</tbody></table></div><p class="di-movers-hint">' + esc(t.click) + '</p>' + (t.notes[st.b] && !(st.b === 'structure' && cc !== 'US') ? '<p class="di-movers-hint">' + esc(t.notes[st.b]) + '</p>' : '');
    var Q = window.DICite; if (Q && maxY) { var c = Q.html('world_bank_wdi', { period: String(maxY) }); if (c) h += '<div class="pp-cites">' + c + '</div>'; }
    body.innerHTML = h;
  }
  function load() {
    if (DATA) return Promise.resolve(DATA);
    if (!LOADING) LOADING = fetch(FILE).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { DATA = d; return d; });
    return LOADING;
  }
  function mount(el, cc, lang) {
    if (!el) return; var t = T[lang] || T.es, st = { b: null, k: null, o: '' };
    el.innerHTML = '<details class="pa-card di-card"><summary>' + esc(t.title) + ' · <span>' + esc(t.open) + '</span></summary><p class="di-movers-hint" style="margin:8px 0 10px">' + esc(t.hint) + '</p><div class="pa-body"></div></details>';
    var det = el.querySelector('details'), body = el.querySelector('.pa-body');
    function go() { body.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>'; load().then(function () { render(el, cc, lang, st); }).catch(function () { LOADING = null; body.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; }); }
    det.addEventListener('toggle', function () { if (det.open && !DATA) go(); else if (det.open) render(el, cc, lang, st); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-pab]') : null, r = e.target.closest ? e.target.closest('[data-pak]') : null;
      if (b) { st.b = b.getAttribute('data-pab'); st.k = null; st.o = ''; render(el, cc, lang, st); }
      else if (r && !(e.target.closest && e.target.closest('.pa-ch'))) { var k = r.getAttribute('data-pak'); st.k = st.k === k ? null : k; st.o = ''; render(el, cc, lang, st); }
    });
    el.addEventListener('keydown', function (e) { var r = e.target && e.target.getAttribute && e.target.getAttribute('data-pak'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); st.k = st.k === r ? null : r; st.o = ''; render(el, cc, lang, st); } });
    el.addEventListener('change', function (e) { if (e.target && e.target.getAttribute && e.target.getAttribute('data-pao')) { st.o = e.target.value; render(el, cc, lang, st); } });
  }
  window.DIAgri = { mount: mount };
})();
