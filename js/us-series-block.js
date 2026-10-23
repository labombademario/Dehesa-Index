/* Dehesa Index — Bloques de series de EE. UU. con selector (transformación NASS, carne y ganado ERS, leche de las órdenes federales AMS). ES5.
   Cada bloque lee un fichero *-stats.json (formato común: countries.US.series[]) y muestra: categoría -> serie -> gráfica + últimos 12 periodos.
   Los nombres de las series están como los publica la fuente (en inglés). No se calcula nada: cada punto es una cifra publicada. */
(function () {
  'use strict';
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  var BLOCKS = {
    cas: { cc: 'CA', min: 5, file: 'data/ca-aafc-slaughter-stats.json', cite: 'aafc_slaughter', url: 'https://open.canada.ca/data/en/dataset/43ea3719-f2ea-4c30-91d2-c8cf9b9b1cef',
      catf: function (s) { var m = /^ca-aafc-slaughter-(calves|cattle|hogs|sheep)/.exec(s.id); return m ? m[1] : 'other'; },
      catn: { cattle: ['Vacuno adulto', 'Cattle', 'Bovins adultes', 'Bovini adulti'], calves: ['Terneros', 'Calves', 'Veaux', 'Vitelli'], hogs: ['Cerdos', 'Hogs', 'Porcs', 'Suini'], sheep: ['Ovino', 'Sheep and lambs', 'Ovins', 'Ovini'] },
      h: ['Canadá: sacrificio semanal de ganado', 'Canada: weekly livestock slaughter', 'Canada : abattage hebdomadaire du bétail', 'Canada: macellazione settimanale del bestiame'],
      sub: ['Cabezas sacrificadas cada semana en mataderos con inspección federal: vacuno (novillos, novillas, vacas, toros), terneros, cerdos y ovino (Agriculture and Agri-Food Canada).', 'Head slaughtered each week in federally inspected plants: cattle (steers, heifers, cows, bulls), calves, hogs and sheep and lambs (Agriculture and Agri-Food Canada).', 'Têtes abattues chaque semaine dans les établissements sous inspection fédérale : bovins (bouvillons, génisses, vaches, taureaux), veaux, porcs et ovins (Agriculture et Agroalimentaire Canada).', 'Capi macellati ogni settimana negli impianti sotto ispezione federale: bovini (manzi, giovenche, vacche, tori), vitelli, suini e ovini (Agriculture and Agri-Food Canada).'],
      note: ['Solo incluye mataderos con inspección federal: la matanza provincial y en explotación no cuenta. Se muestran las últimas 520 semanas; la serie original llega a 1997. La semana termina en sábado.', 'Only federally inspected plants are counted: provincial and on-farm slaughter is not included. The last 520 weeks are shown; the original series goes back to 1997. Weeks end on Saturday.', 'Seuls les établissements sous inspection fédérale sont comptés : l’abattage provincial et à la ferme n’est pas inclus. Les 520 dernières semaines sont affichées ; la série d’origine remonte à 1997. Les semaines se terminent le samedi.', 'Sono conteggiati solo gli impianti sotto ispezione federale: macellazione provinciale e in azienda esclusa. Si mostrano le ultime 520 settimane; la serie originale parte dal 1997. Le settimane finiscono di sabato.'] },
    bcpi: { cc: 'CA', min: 5, file: 'data/ca-boc-bcpi-stats.json', cite: 'bank_of_canada', url: 'https://www.bankofcanada.ca/rates/price-indexes/bcpi/',
      catf: function (s) { return s.frequency; },
      catn: { weekly: ['Semanal', 'Weekly', 'Hebdomadaire', 'Settimanale'], monthly: ['Mensual', 'Monthly', 'Mensuel', 'Mensile'] },
      h: ['Canadá: índices de precios de materias primas (Banco de Canadá)', 'Canada: commodity price indices (Bank of Canada)', 'Canada : indices des prix des produits de base (Banque du Canada)', 'Canada: indici dei prezzi delle materie prime (Banca del Canada)'],
      sub: ['Índice BCPI de los productos que Canadá exporta: total, sin energía, energía, metales y minerales, silvicultura, agricultura y pesca. Semanal (últimas 520 semanas) y mensual desde 1972.', 'The BCPI index of the commodities Canada exports: total, excluding energy, energy, metals and minerals, forestry, agriculture and fish. Weekly (last 520 weeks) and monthly since 1972.', 'Indice BCPI des produits que le Canada exporte : total, hors énergie, énergie, métaux et minéraux, foresterie, agriculture et pêche. Hebdomadaire (520 dernières semaines) et mensuel depuis 1972.', 'Indice BCPI delle materie prime che il Canada esporta: totale, esclusa energia, energia, metalli e minerali, silvicoltura, agricoltura e pesca. Settimanale (ultime 520 settimane) e mensile dal 1972.'],
      note: ['Los índices están en dólares de EE. UU. con base 1972 = 100: mide cómo cambian los precios, no su nivel. La pesca solo se publica mensual.', 'The indices are in US dollars with 1972 = 100: they measure how prices change, not their level. Fish is published monthly only.', 'Les indices sont en dollars américains, base 1972 = 100 : ils mesurent l’évolution des prix, pas leur niveau. La pêche n’est publiée qu’en mensuel.', 'Gli indici sono in dollari USA con base 1972 = 100: misurano come cambiano i prezzi, non il loro livello. La pesca è pubblicata solo mensile.'] },
    rmpi: { cc: 'CA', min: 10, file: 'data/ca-statcan-more-stats.json', cite: 'statcan', url: 'https://www150.statcan.gc.ca/n1/en/catalogue/18100268',
      filter: function (s) { return String(s.id).indexOf('ca-sc-rmpi-') === 0; },
      catf: function (s) { var l = String(s.label).toLowerCase(); return /fish|crustacean/.test(l) ? 'fish' : /cattle|hogs|chicken|poultry|milk|egg|animal|calves|sheep|fur/.test(l) ? 'animal' : /wheat|barley|oats|canola|corn|soybean|crop|grain|seed|potato|vegetable|fruit|nursery|rubber/.test(l) ? 'crop' : /crude|oil|gas|coal|energy|bitumen|steam|uranium/.test(l) ? 'energy' : /log|wood|pulp|forest|pole|pulpwood/.test(l) ? 'forest' : /total|raw materials/.test(l) ? 'total' : 'mineral'; },
      catn: { total: ['Total', 'Total', 'Total', 'Totale'], crop: ['Cultivos', 'Crops', 'Cultures', 'Colture'], animal: ['Ganado, huevos y leche', 'Livestock, eggs and milk', 'Bétail, œufs et lait', 'Bestiame, uova e latte'], fish: ['Pesca', 'Fish and seafood', 'Poissons et fruits de mer', 'Pesce e frutti di mare'], energy: ['Energía', 'Energy', 'Énergie', 'Energia'], forest: ['Madera y silvicultura', 'Wood and forestry', 'Bois et foresterie', 'Legno e silvicoltura'], mineral: ['Metales y minerales', 'Metals and minerals', 'Métaux et minéraux', 'Metalli e minerali'] },
      h: ['Canadá: precios de las materias primas que compra la industria', 'Canada: prices of raw materials bought by industry', 'Canada : prix des matières premières achetées par l’industrie', 'Canada: prezzi delle materie prime acquistate dall’industria'],
      sub: ['Índice mensual de precios de materias primas (cebada, canola, maíz, soja, trigo, vacuno, cerdos, pollos, leche, huevos, pescado, madera, petróleo, gas y minerales) desde 1981. Statistics Canada, tabla 18-10-0268.', 'Monthly raw materials price index (barley, canola, corn, soybeans, wheat, cattle, hogs, chickens, milk, eggs, fish, wood, oil, gas and minerals) since 1981. Statistics Canada, table 18-10-0268.', 'Indice mensuel des prix des matières premières (orge, canola, maïs, soja, blé, bovins, porcs, poulets, lait, œufs, poisson, bois, pétrole, gaz et minéraux) depuis 1981. Statistique Canada, tableau 18-10-0268.', 'Indice mensile dei prezzi delle materie prime (orzo, canola, mais, soia, grano, bovini, suini, polli, latte, uova, pesce, legno, petrolio, gas e minerali) dal 1981. Statistics Canada, tabella 18-10-0268.'],
      note: ['Base 2020-01 = 100. Mide el cambio de precio de lo que compra la industria canadiense, no el precio que cobra el agricultor. Statistics Canada actualiza la clasificación de productos de vez en cuando y por eso algunos productos aparecen con dos series de distinta duración.', 'Base January 2020 = 100. It tracks the price change of what Canadian industry buys, not the price farmers receive. Statistics Canada updates its product classification from time to time, so some products appear with two series of different length.', 'Base janvier 2020 = 100. Il mesure l’évolution du prix de ce qu’achète l’industrie canadienne, pas le prix reçu par l’agriculteur. Statistique Canada met à jour sa classification des produits de temps à autre ; certains produits apparaissent donc avec deux séries de durées différentes.', 'Base gennaio 2020 = 100. Misura la variazione dei prezzi di ciò che compra l’industria canadese, non il prezzo incassato dall’agricoltore. Statistics Canada aggiorna ogni tanto la classificazione dei prodotti, quindi alcuni prodotti compaiono con due serie di lunghezza diversa.'] },
    npr: { tr: 1, file: 'data/us-nass-processing-stats.json', cite: 'usda_nass', cat: 'colon', url: 'https://esmis.nal.usda.gov/publication/fats-and-oils-oilseed-crushings-production-consumption-and-stocks',
      h: ['Transformación de oleaginosas y maíz en EE. UU.', 'U.S. oilseed and corn processing', 'Transformation des oléagineux et du maïs aux États-Unis', 'Trasformazione di semi oleosi e mais negli USA'],
      sub: ['Soja triturada, aceite y harina producidos, existencias en fábrica, colza, algodón, grasas animales y coproductos del maíz (etanol, DDGS): los informes mensuales Fats and Oils y Grain Crushings del USDA NASS.',
        'Soybeans crushed, oil and meal produced, crusher stocks, canola, cottonseed, animal fats and corn co-products (ethanol, DDGS): USDA NASS monthly Fats and Oils and Grain Crushings reports.',
        'Soja triturée, huile et tourteaux produits, stocks des usines, colza, coton, graisses animales et coproduits du maïs (éthanol, DDGS) : rapports mensuels Fats and Oils et Grain Crushings de l’USDA NASS.',
        'Soia triturata, olio e farina prodotti, scorte negli impianti, colza, cotone, grassi animali e coprodotti del mais (etanolo, DDGS): rapporti mensili Fats and Oils e Grain Crushings dell’USDA NASS.'],
      note: ['NASS retiene algunas cifras por confidencialidad (hueco en la serie) y revisa el mes anterior en cada informe; aquí gana siempre la última cifra publicada. El historial empieza en enero de 2025 y crece con cada informe mensual.',
        'NASS withholds some figures for confidentiality (a gap in the series) and revises the previous month in each report; the latest published figure always wins here. The history starts in January 2025 and grows with each monthly report.',
        'Le NASS retient certains chiffres pour des raisons de confidentialité (trou dans la série) et révise le mois précédent à chaque rapport ; c’est toujours le dernier chiffre publié qui l’emporte. L’historique commence en janvier 2025 et s’allonge à chaque rapport mensuel.',
        'Il NASS trattiene alcune cifre per riservatezza (vuoto nella serie) e rivede il mese precedente a ogni rapporto; qui vale sempre l’ultima cifra pubblicata. Lo storico parte da gennaio 2025 e cresce a ogni rapporto mensile.'] },
    bio: { file: 'data/us-ers-bioenergy-stats.json', cite: 'usda_ers', cat: 'colon', url: 'https://www.ers.usda.gov/data-products/us-bioenergy-statistics',
      h: ['Bioenergía de EE. UU.: etanol, biodiésel y diésel renovable', 'U.S. bioenergy: ethanol, biodiesel and renewable diesel', 'Bioénergie aux États-Unis : éthanol, biodiesel et diesel renouvelable', 'Bioenergia negli USA: etanolo, biodiesel e diesel rinnovabile'],
      sub: ['Producción, consumo y precios del etanol, el biodiésel y el diésel renovable; maíz, sorgo y aceites usados como materia prima; coproductos (DDGS); capacidad de las plantas y estaciones de combustibles alternativos (USDA ERS).',
        'Production, use and prices of ethanol, biodiesel and renewable diesel; corn, sorghum and oils used as feedstock; co-products (DDGS); plant capacity and alternative fuel stations (USDA ERS).',
        'Production, usage et prix de l’éthanol, du biodiesel et du diesel renouvelable ; maïs, sorgho et huiles utilisés comme matière première ; coproduits (DDGS) ; capacité des usines et stations de carburants alternatifs (USDA ERS).',
        'Produzione, uso e prezzi di etanolo, biodiesel e diesel rinnovabile; mais, sorgo e oli usati come materia prima; coprodotti (DDGS); capacità degli impianti e stazioni di carburanti alternativi (USDA ERS).'],
      note: ['Las campañas comerciales (maíz sep-ago, soja oct-sep) se fechan en su año de inicio; los trimestres de campaña, en su mes final. Las cifras recientes pueden ser estimaciones de ERS.',
        'Marketing years (corn Sep-Aug, soybean Oct-Sep) are dated at their starting year; marketing-year quarters at their final month. Recent figures can be ERS estimates.',
        'Les campagnes de commercialisation (maïs sept-août, soja oct-sept) sont datées de leur année de début ; les trimestres de campagne, de leur mois final. Les chiffres récents peuvent être des estimations de l’ERS.',
        'Le campagne di commercializzazione (mais set-ago, soia ott-set) sono datate al loro anno di inizio; i trimestri di campagna al mese finale. Le cifre recenti possono essere stime dell’ERS.'] },
    fer: { file: 'data/us-ers-fertilizer-stats.json', cite: 'usda_ers', cat: 'colon', url: 'https://www.ers.usda.gov/data-products/fertilizer-use-and-price',
      h: ['Fertilizantes en EE. UU.: consumo, precios pagados y dosis en maíz', 'U.S. fertilizer: use, prices paid and corn application rates', 'Engrais aux États-Unis : consommation, prix payés et doses sur le maïs', 'Fertilizzanti negli USA: consumo, prezzi pagati e dosi sul mais'],
      sub: ['Consumo de nitrógeno, fósforo y potasio, consumo por material (amoníaco, urea, DAP, cloruro potásico…), precios pagados por los agricultores, índices de precios y, por estado, el porcentaje de maíz fertilizado y la dosis por acre (USDA ERS).',
        'Nitrogen, phosphate and potash consumption, use by material (ammonia, urea, DAP, potassium chloride…), prices paid by farmers, price indexes and, by state, the share of corn acreage fertilized and the rate per acre (USDA ERS).',
        'Consommation d’azote, de phosphore et de potasse, consommation par matière (ammoniac, urée, DAP, chlorure de potassium…), prix payés par les agriculteurs, indices de prix et, par État, part du maïs fertilisé et dose par acre (USDA ERS).',
        'Consumo di azoto, fosforo e potassio, consumo per materiale (ammoniaca, urea, DAP, cloruro di potassio…), prezzi pagati dagli agricoltori, indici di prezzo e, per stato, quota di mais concimato e dose per acro (USDA ERS).'],
      note: ['Es un archivo histórico que ERS ya no actualiza: el consumo llega a 2015, los precios a 2014 y los índices a 2018. Sirve para ver la evolución larga, no el mercado de hoy.',
        'This is a historical archive that ERS no longer updates: use runs to 2015, prices to 2014 and indexes to 2018. It shows the long-run trend, not today’s market.',
        'C’est une archive historique que l’ERS ne met plus à jour : la consommation s’arrête en 2015, les prix en 2014 et les indices en 2018. Elle montre l’évolution longue, pas le marché actuel.',
        'È un archivio storico che l’ERS non aggiorna più: il consumo arriva al 2015, i prezzi al 2014 e gli indici al 2018. Mostra l’andamento di lungo periodo, non il mercato di oggi.'] },
    flk: { file: 'data/us-ers-livestock-stats.json', cite: 'usda_ers', cat: 'colon', url: 'https://www.ers.usda.gov/data-products/livestock-and-meat-domestic-data',
      h: ['Carne y ganado de EE. UU.: oferta, pesos, precios y cebadero', 'U.S. meat and livestock: supply, weights, prices and feedlot', 'Viande et bétail aux États-Unis : offre, poids, prix et parc d’engraissement', 'Carne e bestiame negli USA: offerta, pesi, prezzi e feedlot'],
      sub: ['Producción, importaciones, exportaciones, existencias y consumo por persona de cada carne y de los huevos; pesos medios, existencias en frío, precios del ganado y mayoristas, terneros fuera de cebaderos y simulador de rentabilidad del cebadero (USDA ERS).',
        'Production, imports, exports, stocks and per-person use of each meat and of eggs; average weights, cold storage, livestock and wholesale prices, feeder cattle outside feedlots and the feedlot profitability simulator (USDA ERS).',
        'Production, importations, exportations, stocks et consommation par personne de chaque viande et des œufs ; poids moyens, stocks frigorifiques, prix du bétail et de gros, bovins hors parcs d’engraissement et simulateur de rentabilité (USDA ERS).',
        'Produzione, importazioni, esportazioni, scorte e consumo pro capite di ogni carne e delle uova; pesi medi, scorte frigorifere, prezzi del bestiame e all’ingrosso, vitelli fuori dai feedlot e simulatore di redditività (USDA ERS).'],
      note: ['Las cifras del año en curso incluyen estimaciones del propio ERS. Las series anuales son de enero a diciembre. El simulador del cebadero usa periodos de alimentación de 4 meses fechados en su mes final.',
        'Current-year figures include ERS’s own estimates. Annual series run January to December. The feedlot simulator uses 4-month feeding periods dated at their final month.',
        'Les chiffres de l’année en cours incluent des estimations de l’ERS. Les séries annuelles vont de janvier à décembre. Le simulateur utilise des périodes d’engraissement de 4 mois datées de leur dernier mois.',
        'Le cifre dell’anno in corso includono stime dell’ERS. Le serie annuali vanno da gennaio a dicembre. Il simulatore usa periodi di alimentazione di 4 mesi datati al mese finale.'] },
    fmm: { file: 'data/us-fmmo-stats.json', cite: 'usda_ams_fmmo', cat: 'group', url: 'https://www.ams.usda.gov/rules-regulations/moa/dairy',
      h: ['Leche en EE. UU.: precios de clase y órdenes federales', 'U.S. milk: class prices and federal orders', 'Lait aux États-Unis : prix par classe et ordonnances fédérales', 'Latte negli USA: prezzi di classe e ordini federali'],
      sub: ['Precios mínimos de las clases I a IV (suero, queso, mantequilla y polvo), precio uniforme, precio mailbox por zona, leche del pool y su reparto por uso, y composición de la leche de los productores (USDA AMS).',
        'Minimum prices for Classes I to IV (fluid, soft products, cheese and whey, butter and powder), uniform price, mailbox price by area, pooled milk and its split by use, and producer milk composition (USDA AMS).',
        'Prix minimaux des classes I à IV (lait de consommation, produits frais, fromage et lactosérum, beurre et poudre), prix uniforme, prix mailbox par zone, lait du pool et sa répartition par usage, et composition du lait des producteurs (USDA AMS).',
        'Prezzi minimi delle classi da I a IV (latte alimentare, prodotti freschi, formaggio e siero, burro e polvere), prezzo uniforme, prezzo mailbox per zona, latte del pool e sua ripartizione per uso, e composizione del latte dei produttori (USDA AMS).'],
      note: ['Los precios de clase son mínimos regulados (USD por cwt al 3,5 % de grasa), no el precio que cobra cada ganadero; el precio mailbox sí es lo que recibe el ganadero tras deducciones. Si AMS revisa un mes, gana la última publicación.',
        'Class prices are regulated minimums (USD per cwt at 3.5% butterfat), not what each farmer is paid; the mailbox price is what the farmer actually receives after deductions. If AMS revises a month, the latest publication wins.',
        'Les prix de classe sont des minimums réglementés (USD par cwt à 3,5 % de matière grasse), pas ce que touche chaque éleveur ; le prix mailbox est ce que l’éleveur reçoit après déductions. Si l’AMS révise un mois, la dernière publication l’emporte.',
        'I prezzi di classe sono minimi regolamentati (USD per cwt al 3,5 % di grasso), non quanto incassa ogni allevatore; il prezzo mailbox è quanto riceve l’allevatore dopo le detrazioni. Se AMS rivede un mese, vale l’ultima pubblicazione.'] }
  };
  var T = {
    es: { trn: 'Los nombres de las series están traducidos del inglés original de la fuente; las cifras no se modifican. Dehesa Index no calcula nada sobre ellas.', cat: 'Categoría', ser: 'Serie', chart: 'Gráfica', last: 'Últimos 12 periodos', per: 'Periodo', val: 'Valor', chg: 'Cambio', open: 'Abrir la fuente', src: 'Último dato:', alt: 'Evolución de {n}', en: 'Los nombres de las series están como los publica la fuente (en inglés). Dehesa Index no calcula nada sobre estas cifras.', grp: { prices: 'Precios', production: 'Producción y uso', stocks: 'Existencias', trade: 'Comercio' } },
    en: { cat: 'Category', ser: 'Series', chart: 'Chart', last: 'Last 12 periods', per: 'Period', val: 'Value', chg: 'Change', open: 'Open the source', src: 'Latest data:', alt: 'Trend of {n}', en: 'Series names appear as published by the source (in English). Dehesa Index calculates nothing on these figures.', grp: { prices: 'Prices', production: 'Production and use', stocks: 'Stocks', trade: 'Trade' } },
    fr: { trn: 'Les noms des séries sont traduits de l’anglais d’origine de la source ; les chiffres ne sont pas modifiés. Dehesa Index ne calcule rien sur ces chiffres.', cat: 'Catégorie', ser: 'Série', chart: 'Graphique', last: '12 dernières périodes', per: 'Période', val: 'Valeur', chg: 'Variation', open: 'Ouvrir la source', src: 'Dernière donnée :', alt: 'Évolution de {n}', en: 'Les noms des séries sont ceux de la source (en anglais). Dehesa Index ne calcule rien sur ces chiffres.', grp: { prices: 'Prix', production: 'Production et usage', stocks: 'Stocks', trade: 'Commerce' } },
    it: { trn: 'I nomi delle serie sono tradotti dall’inglese originale della fonte; le cifre non vengono modificate. Dehesa Index non calcola nulla su queste cifre.', cat: 'Categoria', ser: 'Serie', chart: 'Grafico', last: 'Ultimi 12 periodi', per: 'Periodo', val: 'Valore', chg: 'Variazione', open: 'Apri la fonte', src: 'Ultimo dato:', alt: 'Andamento di {n}', en: 'I nomi delle serie sono quelli della fonte (in inglese). Dehesa Index non calcola nulla su queste cifre.', grp: { prices: 'Prezzi', production: 'Produzione e uso', stocks: 'Scorte', trade: 'Commercio' } }
  };
  var STATE = {};
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }); } catch (e) { return v.toFixed(d); } }
  function fv(v) { if (v == null) return '—'; var a = Math.abs(v); return nf(v, a >= 1000 ? 0 : a >= 100 ? 1 : 2); }
  function xu(u) { var l = lang(); return u && window.DIUS && l !== 'en' ? window.DIUS.unit(u, l) : u; }
  function tr(l) { var g = lang(); return window.DIClear && window.DIClear.tl && g !== 'en' ? window.DIClear.tl(String(l), g) : String(l); }
  function clean(l) { return tr(l).replace(/\s*\((?:[^()]*(?:NASS|ERS|AMS|monthly|annual|mensual|mensuel|mensile)[^()]*)\)\s*$/, ''); }
  var CNAME = {};
  function catOf(b, s, T0) { if (b.catf) return b.catf(s); if (b.cat === 'group') return s.group; var i = String(s.label).indexOf(':'); return i > 0 ? s.label.slice(0, i) : s.group; }
  function catName(b, c, T0) { if (b.catn) return (b.catn[c] || [c, c, c, c])[LI[lang()] || 0]; return b.cat === 'group' ? (T0.grp[c] || c) : (CNAME[c] || c); }
  function pfmt(p, fq) { return fq === 'annual' ? p : p.length === 7 ? p : p; }
  function ts(p) { var m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(String(p)); return m ? Date.UTC(+m[1], m[2] ? +m[2] - 1 : 0, m[3] ? +m[3] : 1) : null; }
  function chart(s, T0) {
    if (!window.DehesaChart || !window.DehesaChart.render) return '';
    var rows = s.points.slice(-(s.frequency === 'annual' ? 40 : 120)), pts = [], k, t;
    for (k = 0; k < rows.length; k++) { t = ts(rows[k][0]); if (t != null) pts.push({ x: t, y: rows[k][1], l: rows[k][0] }); }
    if (pts.length < 3) return '';
    return window.DehesaChart.render({ series: [{ name: clean(s.label), color: '#1d5178', pts: pts }], xMode: 'time', yTitle: xu(s.unit) || '', aria: T0.alt.replace('{n}', clean(s.label)), zero: false, noLegend: true, vFmt: fv });
  }
  function render(id) {
    var root = document.getElementById(id), st = STATE[id], b = BLOCKS[id]; if (!root || !st) return;
    var P = LI[lang()] || 0, T0 = T[lang()] || T.es, i, cats = [], seen = {}, list = [];
    st.series.forEach(function (s) { var c = catOf(b, s, T0); if (!seen[c]) { seen[c] = 1; cats.push(c); if (b.cat !== 'group' && !b.catf) { var tn = clean(s.label), q = tn.indexOf(':'); CNAME[c] = q > 0 ? tn.slice(0, q) : c; } } });
    cats.sort(function (a, c) { return String(catName(b, a, T0)).localeCompare(catName(b, c, T0), lang()); });
    if (!st.cat || !seen[st.cat]) st.cat = cats[0];
    st.series.forEach(function (s) { if (catOf(b, s, T0) === st.cat) list.push(s); });
    if (!st.sid || !list.some(function (s) { return s.id === st.sid; })) st.sid = list[0].id;
    var s = list.filter(function (x) { return x.id === st.sid; })[0];
    var sel = '<div style="display:flex;flex-wrap:wrap;gap:10px 18px;margin:10px 0 4px"><label class="di-movers-hint">' + esc(T0.cat) + '<select data-chips id="' + id + '-cat" style="display:block;margin-top:4px;font:inherit;max-width:100%">' +
      cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === st.cat ? ' selected' : '') + '>' + esc((window.DIUS && window.DIUS.emo(c) ? window.DIUS.emo(c) + ' ' : '') + catName(b, c, T0)) + '</option>'; }).join('') + '</select></label>' +
      '<label class="di-movers-hint" style="flex:1 1 280px">' + esc(T0.ser) + '<select data-chips id="' + id + '-ser" style="display:block;margin-top:4px;font:inherit;max-width:100%;width:100%">' +
      list.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === st.sid ? ' selected' : '') + '>' + esc(clean(x.label)) + '</option>'; }).join('') + '</select></label></div>';
    var rows = s.points.slice(-12).reverse(), body = '';
    var th = 'padding:7px 6px;font-size:11px;font-weight:700;color:var(--text-faint);text-align:right;', td = 'padding:6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;text-align:right;';
    rows.forEach(function (r, j) {
      var prev = s.points[s.points.length - 1 - j - 1], ch = prev && prev[1] ? (r[1] / prev[1] - 1) * 100 : null;
      body += '<tr><th scope="row" style="' + td + 'text-align:left;font-weight:400">' + esc(r[0]) + '</th><td style="' + td + '">' + esc(fv(r[1])) + '</td><td style="' + td + '">' + (ch == null ? '—' : esc((ch > 0 ? '+' : '') + nf(ch, 1) + ' %')) + '</td></tr>';
    });
    var tab = '<details class="usm-more"><summary>' + esc(T0.last) + '</summary><div style="overflow:auto"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr><th scope="col" style="' + th + 'text-align:left">' + esc(T0.per) + '</th><th scope="col" style="' + th + '">' + esc(T0.val) + ' (' + esc(xu(s.unit) || '') + ')</th><th scope="col" style="' + th + '">' + esc(T0.chg) + '</th></tr></thead><tbody>' + body + '</tbody></table></div></details>';
    var cite = window.DICite && window.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + window.DICite.html(b.cite, { period: s.latestPeriod }) + '</div>' : '';
    root.innerHTML = '<h2 class="cof-h2">' + esc(b.h[P]) + '</h2><p class="cof-sub">' + esc(b.sub[P]) + '</p>' + sel + '<h3 class="cof-h3">' + esc(clean(s.label)) + ' · ' + esc(T0.chart) + '</h3>' + chart(s, T0) + tab +
      '<p class="cof-note">' + esc(b.note[P]) + ' ' + esc(b.tr && T0.trn ? T0.trn : T0.en) + ' ' + esc(T0.src) + ' ' + esc(s.latestPeriod) + '. <a href="' + esc(b.url) + '" target="_blank" rel="noopener noreferrer">' + esc(T0.open) + '</a></p>' + cite;
    var c = document.getElementById(id + '-cat'), r = document.getElementById(id + '-ser');
    if (c) c.onchange = function () { st.cat = c.value; st.sid = null; render(id); };
    if (r) r.onchange = function () { st.sid = r.value; render(id); };
  }
  function boot() {
    var ids = Object.keys(BLOCKS).filter(function (k) { return document.getElementById(k); });
    if (!ids.length) return;
    ids.forEach(function (id) {
      Promise.all([fetch(BLOCKS[id].file).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), window.DICite ? window.DICite.load().catch(function () { return null; }) : Promise.resolve(null)]).then(function (a) {
        var us = a[0] && a[0].countries && a[0].countries[BLOCKS[id].cc || 'US']; if (!us || !us.series) return;
        var ss = BLOCKS[id].filter ? us.series.filter(BLOCKS[id].filter) : us.series; if (ss.length < (BLOCKS[id].min || 10)) return;
        STATE[id] = { series: ss, cat: null, sid: null }; render(id);
      });
    });
    var prev = window.DehesaShared && window.DehesaShared.onLangChange;
    if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); ids.forEach(render); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
