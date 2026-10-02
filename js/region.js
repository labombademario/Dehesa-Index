/* Dehesa Index — Perfil de región (estados de EE. UU. y provincias de Canadá). ES5.
   Cada bloque lee un fichero que ya existe en data/ y muestra solo lo que ese fichero publica para la región; lo que no hay se lista como «sin dato», nunca se rellena.
   URL: region.html?c=US&r=IA  /  region.html?c=CA&r=SK */
(function () {
  'use strict';
  var L4 = { en: 0, es: 1, fr: 2, it: 3 };
  var US = window.DehesaRegionNames.US;
  var CA = window.DehesaRegionNames.CA;
  var ES = window.DehesaRegionNames.ES;
  var CA_SLUG = { SK: 'saskatchewan', AB: 'alberta', MB: 'manitoba', ON: 'ontario', QC: 'quebec' };
  var CA_CITY = { SK: ['regina', 'saskatoon'], AB: ['calgary', 'edmonton'], MB: ['winnipeg'], ON: ['toronto'], QC: ['montreal'], BC: ['vancouver'] };
  var CA_CITY_N = { regina: 'Regina', saskatoon: 'Saskatoon', calgary: 'Calgary', edmonton: 'Edmonton', winnipeg: 'Winnipeg', toronto: 'Toronto', montreal: 'Montréal', vancouver: 'Vancouver' };
  var C = {
    US: { flag: '🇺🇸', names: US, map: 'DEHESA_US_STATES', country: ['United States', 'Estados Unidos', 'États-Unis', 'Stati Uniti'], kind: ['State', 'Estado', 'État', 'Stato'], kinds: ['states', 'estados', 'États', 'stati'], profile: 'paises.html?c=US' },
    CA: { flag: '🇨🇦', names: CA, map: 'DEHESA_CA_PROVINCES', country: ['Canada', 'Canadá', 'Canada', 'Canada'], kind: ['Province or territory', 'Provincia o territorio', 'Province ou territoire', 'Provincia o territorio'], kinds: ['provinces and territories', 'provincias y territorios', 'provinces et territoires', 'province e territori'], profile: 'paises.html?c=CA' },
    ES: { flag: '🇪🇸', names: ES, map: 'DEHESA_ES_CCAA', country: ['Spain', 'España', 'Espagne', 'Spagna'], kind: ['Autonomous community', 'Comunidad autónoma', 'Communauté autonome', 'Comunità autonoma'], kinds: ['autonomous communities', 'comunidades autónomas', 'communautés autonomes', 'comunità autonome'], profile: 'paises.html?c=ES' }
  };
  var T = {
    es: { sub: 'Lo que publican las fuentes oficiales para esta región. Lo que no hay se indica; nada se rellena ni se estima.', home: 'Perfil de país', pick: 'Elegir', mapAlt: 'Mapa. Pulsa una región para abrir su perfil.', missing: 'Todavía sin dato de esta región', missingHint: 'Los datos de estas áreas no se publican para esta región o aún no los tenemos:', loading: 'Cargando…', unknown: 'No conocemos esta región. Elige una en el mapa.',
      drought: 'Sequía', droughtSub: 'Porcentaje de la superficie de la región en cada clase (acumulativo: «moderada o peor» incluye severa, extrema y excepcional).', d0: 'Seco o peor', d1: 'Moderada o peor', d2: 'Severa o peor', d3: 'Extrema o peor', d4: 'Excepcional', week: 'Semana del', month: 'Mes de', trend: 'Evolución', d1n: 'Moderada o peor', d3n: 'Extrema o peor',
      crops: 'Cultivos', cropsSub: 'Superficie cosechada, rendimiento y producción del último año publicado (USDA NASS). Unidades de EE. UU., tal como las publica la fuente. Si el año aún no ha terminado, las cifras son previsiones de la fuente.', crop: 'Cultivo', area: 'Superficie cosechada', yield: 'Rendimiento', prod: 'Producción', year: 'Año',
      cattle: 'Ganado vacuno en cebaderos', cattleSub: 'Existencias en cebaderos de 1.000 o más cabezas (USDA NASS, informe mensual).', onfeed: 'En cebadero', yago: 'Hace un año', prevm: 'Mes anterior', vsya: 'frente al año anterior', kh: 'miles de cabezas', asof: 'a',
      bids: 'Precios locales de granos', bidsSub: 'Ofertas de compra al contado en los mercados del estado (USDA AMS), último día con dato.', commodity: 'Producto', range: 'Rango entre mercados', mkts: 'mercados', more: 'Ver el detalle por mercado',
      fert: 'Fertilizantes', fertSub: 'Precio medio al por menor en el estado (USDA AMS, informes de costes de producción).', product: 'Producto', price: 'Precio', yoyl: 'Hace un año', date: 'Fecha', usdt: 'USD por tonelada corta',
      tax: 'Impuesto', taxSub: 'Impuesto estatal sobre las ventas (tipo general, sin impuestos locales).', rate: 'Tipo estatal', nostate: 'Sin impuesto estatal sobre las ventas', taxCalc: 'Usarlo en la calculadora',
      cacrops: 'Cultivos', cacropsSub: 'Superficie, rendimiento y producción del último año publicado (Statistics Canada, sistema métrico). Si el año aún no ha terminado, las cifras son previsiones de la fuente.', seeded: 'Superficie sembrada', shareCa: 'Peso en Canadá', farmPrice: 'Precio en finca', kha: 'miles de ha', kt: 'miles de t', kgha: 'kg/ha', cadt: 'CAD/t',
      lvst: 'Ganado', lvstSub: 'Existencias a 1 de enero y 1 de julio (Statistics Canada), miles de cabezas.', head: 'Existencias', per: 'Fecha', yoyc: 'Mismo mes, año anterior', cattleN: 'Vacuno', hogsN: 'Porcino', sheepN: 'Ovino',
      inc: 'Renta agraria', incSub: 'Cuentas agrarias de la provincia (Statistics Canada), millones de dólares canadienses, anual.', netInc: 'Renta neta', cashRec: 'Ingresos en efectivo', opExp: 'Gastos de explotación', netCash: 'Renta neta en efectivo', depr: 'Amortización',
      recCrop: 'Cultivos', recLv: 'Ganadería y productos',
      rec: 'Ingresos por producto', recSub: 'Ingresos en efectivo de las explotaciones por producto (Statistics Canada), millones de dólares canadienses, último año. Los nombres de los productos son los que publica la fuente, en inglés.', prevY: 'Año anterior', terr: 'Statistics Canada no publica estas tablas para los territorios.',
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
      cacrops: 'Crops', cacropsSub: 'Area, yield and production for the latest published year (Statistics Canada, metric). If the year is not over yet, figures are the source’s forecasts.', seeded: 'Seeded area', shareCa: 'Share of Canada', farmPrice: 'Farm price', kha: 'thousand ha', kt: 'thousand t', kgha: 'kg/ha', cadt: 'CAD/t',
      lvst: 'Livestock', lvstSub: 'Inventories at 1 January and 1 July (Statistics Canada), thousand head.', head: 'Inventory', per: 'Date', yoyc: 'Same date, last year', cattleN: 'Cattle', hogsN: 'Hogs', sheepN: 'Sheep',
      inc: 'Farm income', incSub: 'Provincial farm accounts (Statistics Canada), million Canadian dollars, annual.', netInc: 'Net income', cashRec: 'Cash receipts', opExp: 'Operating expenses', netCash: 'Net cash income', depr: 'Depreciation',
      recCrop: 'Crops', recLv: 'Livestock and products',
      rec: 'Receipts by product', recSub: 'Farm cash receipts by product (Statistics Canada), million Canadian dollars, latest year. Product names are as published by the source.', prevY: 'Previous year', terr: 'Statistics Canada does not publish these tables for the territories.',
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
      cacrops: 'Cultures', cacropsSub: 'Superficie, rendement et production de la dernière année publiée (Statistique Canada, système métrique). Si l’année n’est pas terminée, ce sont des prévisions de la source.', seeded: 'Superficie ensemencée', shareCa: 'Part du Canada', farmPrice: 'Prix à la ferme', kha: 'milliers d’ha', kt: 'milliers de t', kgha: 'kg/ha', cadt: 'CAD/t',
      lvst: 'Élevage', lvstSub: 'Effectifs au 1er janvier et au 1er juillet (Statistique Canada), milliers de têtes.', head: 'Effectifs', per: 'Date', yoyc: 'Même date, an dernier', cattleN: 'Bovins', hogsN: 'Porcins', sheepN: 'Ovins',
      inc: 'Revenu agricole', incSub: 'Comptes agricoles de la province (Statistique Canada), millions de dollars canadiens, annuel.', netInc: 'Revenu net', cashRec: 'Recettes monétaires', opExp: 'Dépenses d’exploitation', netCash: 'Revenu net monétaire', depr: 'Amortissement',
      recCrop: 'Cultures', recLv: 'Élevage et produits',
      rec: 'Recettes par produit', recSub: 'Recettes monétaires agricoles par produit (Statistique Canada), millions de dollars canadiens, dernière année. Les noms des produits sont ceux de la source, en anglais.', prevY: 'Année précédente', terr: 'Statistique Canada ne publie pas ces tableaux pour les territoires.',
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
      cacrops: 'Colture', cacropsSub: 'Superficie, resa e produzione dell’ultimo anno pubblicato (Statistics Canada, sistema metrico). Se l’anno non è concluso, sono previsioni della fonte.', seeded: 'Superficie seminata', shareCa: 'Quota del Canada', farmPrice: 'Prezzo in azienda', kha: 'migliaia di ha', kt: 'migliaia di t', kgha: 'kg/ha', cadt: 'CAD/t',
      lvst: 'Bestiame', lvstSub: 'Consistenze al 1° gennaio e al 1° luglio (Statistics Canada), migliaia di capi.', head: 'Consistenza', per: 'Data', yoyc: 'Stessa data, anno scorso', cattleN: 'Bovini', hogsN: 'Suini', sheepN: 'Ovini',
      inc: 'Reddito agricolo', incSub: 'Conti agricoli della provincia (Statistics Canada), milioni di dollari canadesi, annuale.', netInc: 'Reddito netto', cashRec: 'Ricavi in contanti', opExp: 'Spese di esercizio', netCash: 'Reddito netto in contanti', depr: 'Ammortamento',
      recCrop: 'Colture', recLv: 'Bestiame e prodotti',
      rec: 'Ricavi per prodotto', recSub: 'Ricavi in contanti delle aziende per prodotto (Statistics Canada), milioni di dollari canadesi, ultimo anno. I nomi dei prodotti sono quelli della fonte, in inglese.', prevY: 'Anno precedente', terr: 'Statistics Canada non pubblica queste tabelle per i territori.',
      costs: 'Costi delle aziende', costsSub: 'Spese di esercizio per voce, Statistics Canada (milioni di dollari canadesi, annuale).', item: 'Voce', total: 'Totale spese', share: 'del totale', cad: 'M CAD',
      prices: 'Prezzi di riferimento', pricesSub: 'Prodotti la cui provincia di riferimento è questa (Statistics Canada, mensile) e offerte settimanali di Alberta Agriculture.', unit: 'Unità', vs: 'Variazione',
      fuel: 'Carburante', fuelSub: 'Prezzo al consumo per città (Statistics Canada, mensile), centesimi di dollaro canadese al litro.', city: 'Città', fuelkind: 'Carburante', note: 'Fonte' }
  };
  var LBL = {
    crops: { 'CORN, GRAIN': ['Corn', 'Maíz', 'Maïs', 'Mais'], SOYBEANS: ['Soybeans', 'Soja', 'Soja', 'Soia'], WHEAT: ['Wheat', 'Trigo', 'Blé', 'Frumento'], BARLEY: ['Barley', 'Cebada', 'Orge', 'Orzo'], OATS: ['Oats', 'Avena', 'Avoine', 'Avena'], 'SORGHUM, GRAIN': ['Sorghum', 'Sorgo', 'Sorgho', 'Sorgo'], RICE: ['Rice', 'Arroz', 'Riz', 'Riso'], COTTON: ['Cotton', 'Algodón', 'Coton', 'Cotone'], HAY: ['Hay', 'Heno', 'Foin', 'Fieno'], PEANUTS: ['Peanuts', 'Cacahuetes', 'Arachides', 'Arachidi'] },
    fert: { amoniaco: ['Anhydrous ammonia', 'Amoníaco anhidro', 'Ammoniac anhydre', 'Ammoniaca anidra'], urea: ['Urea', 'Urea', 'Urée', 'Urea'], dap: ['DAP', 'DAP', 'DAP', 'DAP'], map: ['MAP', 'MAP', 'MAP', 'MAP'], potasa: ['Potash', 'Potasa', 'Potasse', 'Potassa'], uan: ['Liquid nitrogen (UAN)', 'Nitrógeno líquido (UAN)', 'Azote liquide (UAN)', 'Azoto liquido (UAN)'] },
    grain: { corn: ['Corn', 'Maíz', 'Maïs', 'Mais'], soybeans: ['Soybeans', 'Soja', 'Soja', 'Soia'], wheat: ['Wheat', 'Trigo', 'Blé', 'Frumento'], barley: ['Barley', 'Cebada', 'Orge', 'Orzo'], oats: ['Oats', 'Avena', 'Avoine', 'Avena'], sorghum: ['Sorghum', 'Sorgo', 'Sorgho', 'Sorgo'] },
    cacrop: { 'wheat-all': ['Wheat (all)', 'Trigo (total)', 'Blé (total)', 'Frumento (totale)'], 'wheat-durum': ['Durum wheat', 'Trigo duro', 'Blé dur', 'Frumento duro'], barley: ['Barley', 'Cebada', 'Orge', 'Orzo'], oats: ['Oats', 'Avena', 'Avoine', 'Avena'], 'rye-all': ['Rye', 'Centeno', 'Seigle', 'Segale'], 'canola-rapeseed': ['Canola', 'Canola (colza)', 'Canola', 'Canola'], 'corn-for-grain': ['Grain corn', 'Maíz grano', 'Maïs-grain', 'Mais da granella'], soybeans: ['Soybeans', 'Soja', 'Soja', 'Soia'], 'peas-dry': ['Dry peas', 'Guisantes secos', 'Pois secs', 'Piselli secchi'], lentils: ['Lentils', 'Lentejas', 'Lentilles', 'Lenticchie'], flaxseed: ['Flaxseed', 'Lino', 'Lin', 'Lino'], 'sunflower-seed': ['Sunflower seed', 'Girasol', 'Tournesol', 'Girasole'], 'mustard-seed': ['Mustard seed', 'Mostaza', 'Moutarde', 'Senape'], 'chick-peas': ['Chickpeas', 'Garbanzos', 'Pois chiches', 'Ceci'], 'canary-seed': ['Canary seed', 'Alpiste', 'Alpiste', 'Scagliola'] },
    calv: { 'total-cattle': ['Total cattle', 'Total vacuno', 'Total bovins', 'Totale bovini'], 'dairy-cows': ['Dairy cows', 'Vacas lecheras', 'Vaches laitières', 'Vacche da latte'], 'beef-cows': ['Beef cows', 'Vacas de carne', 'Vaches allaitantes', 'Vacche da carne'], 'calves-under-1-year': ['Calves under 1 year', 'Terneros menores de 1 año', 'Veaux de moins d’un an', 'Vitelli sotto 1 anno'], 'total-heifers': ['Heifers', 'Novillas', 'Génisses', 'Manze'], 'hogs-total': ['Total hogs', 'Total porcino', 'Total porcins', 'Totale suini'], 'sows-and-gilts-6-months-and-over': ['Sows and gilts', 'Cerdas y primalas', 'Truies et cochettes', 'Scrofe e scrofette'], 'sheep-and-lambs-total': ['Sheep and lambs', 'Ovejas y corderos', 'Moutons et agneaux', 'Pecore e agnelli'], ewes: ['Ewes', 'Ovejas', 'Brebis', 'Pecore'], 'lambs-for-marketing': ['Lambs for marketing', 'Corderos para mercado', 'Agneaux de marché', 'Agnelli da mercato'] },
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
  function caProv(r) { return get('data/canada-provinces.json').then(function (d) { return d && d.provinces ? d : null; }); }
  function lastOf(a) { return a && a.length ? a[a.length - 1] : null; }
  function ptAt(a, p) { for (var i = 0; i < a.length; i++) if (a[i][0] === p) return a[i][1]; return null; }
  function caCrops(x) {
    return caProv().then(function (d) {
      var P = d && d.provinces[x.r], N = d && d.provinces.CA; if (!P || !P.crops) return null; var t = tt(), rows = [];
      Object.keys(P.crops).forEach(function (k) {
        var c = P.crops[k], pr = lastOf(c.prod); if (!pr) return; var yr = pr[0], nat = N && N.crops && N.crops[k] && N.crops[k].prod ? ptAt(N.crops[k].prod, yr) : null, g = function (tag) { return c[tag] ? ptAt(c[tag], yr) : null; }, f = function (v, d2) { return v == null ? '<span style="color:var(--text-faint)">—</span>' : nf(v, d2); };
        rows.push({ v: pr[1], cells: [esc(LBL.cacrop[k] ? LBL.cacrop[k][li()] : c.name), f(g('area'), 1), f(g('yield'), 0), f(pr[1], 1), nat ? nf(pr[1] / nat * 100, 1) + ' %' : '—', String(yr)] });
      });
      if (!rows.length) return null; rows.sort(function (a, b) { return b.v - a.v; });
      return card(t.cacrops, t.cacropsSub, table([t.crop, t.seeded + ' (' + t.kha + ')', t.yield + ' (' + t.kgha + ')', t.prod + ' (' + t.kt + ')', t.shareCa, t.year], rows.map(function (q) { return q.cells; }), 560), cite('statcan'));
    });
  }
  function caLivestock(x) {
    return caProv().then(function (d) {
      var P = d && d.provinces[x.r]; if (!P) return null; var t = tt(), rows = [];
      [['cattle', t.cattleN], ['hogs', t.hogsN], ['sheep', t.sheepN]].forEach(function (g) {
        var B = P[g[0]]; if (!B) return;
        Object.keys(B).forEach(function (k) { var s = B[k], l = lastOf(s.pts); if (!l) return; var py = (+l[0].slice(0, 4) - 1) + l[0].slice(4), ya = ptAt(s.pts, py); rows.push([esc(g[1] + ': ' + (LBL.calv[k] ? LBL.calv[k][li()] : s.name)), nf(l[1], dec(l[1])), esc(day(l[0])), ya == null ? '' : esc(pct((l[1] / ya - 1) * 100))]); });
      });
      if (!rows.length) return null;
      return card(t.lvst, t.lvstSub, table([t.item, t.head, t.per, t.yoyc], rows, 520), cite('statcan'));
    });
  }
  function caIncome(x) {
    return caProv().then(function (d) {
      var P = d && d.provinces[x.r]; if (!P || !P.income) return null; var t = tt(), I = P.income, keys = [['cash-receipts-total', t.cashRec, '#2f6b4a'], ['operating-expenses-after-rebates', t.opExp, '#b03a2e'], ['net-income-total', t.netInc, '#3a5f8a']];
      var any = keys.filter(function (k) { return I[k[0]]; }); if (!any.length) return null;
      var tbl = [['cash-receipts-total', t.cashRec], ['operating-expenses-after-rebates', t.opExp], ['net-cash-income', t.netCash], ['net-income-total', t.netInc]].filter(function (k) { return I[k[0]]; }).map(function (k) { var l = lastOf(I[k[0]].pts), pv = I[k[0]].pts.length > 1 ? I[k[0]].pts[I[k[0]].pts.length - 2] : null; return [esc(k[1]), nf(l[1], 0), pv ? esc(pct(pv[1] ? (l[1] / pv[1] - 1) * 100 : null)) : '', esc(l[0])]; });
      var ser = any.map(function (k) { return { name: k[1], color: k[2], pts: I[k[0]].pts.map(function (p) { return { x: Date.UTC(+p[0], 0, 1), y: p[1], l: p[0] }; }) }; });
      var ch = window.DehesaChart.render({ series: ser, xMode: 'time', yTitle: t.cad, aria: t.inc + ' ' + nm(C.CA, x.r), vFmt: function (v) { return nf(v, 0); }, yFmt: function (v) { return nf(v, 0); }, xFmt: function (v) { return new Date(v).getUTCFullYear(); } });
      return card(t.inc, t.incSub, table([t.item, t.cad, t.vs, t.year], tbl, 420) + ch, cite('statcan'));
    });
  }
  function caReceipts(x) {
    return caProv().then(function (d) {
      var P = d && d.provinces[x.r]; if (!P || !P.receipts) return null; var t = tt(), R = P.receipts, ks = Object.keys(R), tot = R['total-farm-cash-receipts'];
      var rows = ks.filter(function (k) { return !/^total-/.test(k); }).map(function (k) { var s = R[k], l = lastOf(s.pts), pv = s.pts.length > 1 ? s.pts[s.pts.length - 2][1] : null; return { v: l[1], l: l, pv: pv, name: s.name }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 12);
      if (!rows.length) return null; var tl = tot ? lastOf(tot.pts) : null;
      var body = table([t.item, t.cad, t.share, t.prevY, t.vs], rows.map(function (q) { return [esc(q.name), nf(q.v, dec(q.v)), tl ? nf(q.v / tl[1] * 100, 1) + ' %' : '', q.pv == null ? '' : nf(q.pv, dec(q.pv)), q.pv ? esc(pct((q.v / q.pv - 1) * 100)) : '']; }), 560);
      return card(t.rec + (tl ? ' · ' + tl[0] : ''), t.recSub, (tl ? '<p style="margin:0 0 8px"><b>' + nf(tl[1], 0) + ' ' + esc(t.cad) + '</b>' + [['total-crop-receipts', t.recCrop], ['total-livestock-and-livestock-product-receipts', t.recLv]].map(function (z) { var e = R[z[0]], l2 = e && lastOf(e.pts); return l2 ? ' · ' + esc(z[1]) + ': ' + nf(l2[1], 0) : ''; }).join('') + '</p>' : '') + body, cite('statcan'));
    });
  }

  /* ---------- España: RECAN por comunidad autónoma ---------- */
  var TX = {
    es: { recan: 'Renta y costes de las explotaciones', recanSub: 'Red Contable Agraria Nacional (MAPA): valores medios por explotación en el último ejercicio publicado, para los tipos de explotación con más explotaciones representadas. Cada fila es la clase de dimensión económica con más explotaciones; las celdas confidenciales no se publican y nada se promedia entre clases.', rcType: 'Tipo de explotación', rcSize: 'Dimensión económica predominante', rcFarms: 'Explotaciones representadas', rcSample: 'Muestra', rcSau: 'SAU (ha)', rcOut: 'Producción bruta (€)', rcCost: 'Costes totales (€)', rcNet: 'Renta neta (€)', rcSubs: 'Subvenciones corrientes (€)', rcTotal: 'explotaciones representadas en las celdas publicadas', rcAll: 'Ver todas las variables, tipos y ejercicios', rcNote: 'Los nombres de los tipos y las clases son los del MAPA.' },
    en: { recan: 'Farm income and costs', recanSub: 'Spanish Farm Accountancy Data Network (MAPA): per-farm averages for the latest published year, for the farm types with the most farms represented. Each row is the economic-size class with the most farms; confidential cells are not published and nothing is averaged across classes.', rcType: 'Farm type', rcSize: 'Main economic size class', rcFarms: 'Farms represented', rcSample: 'Sample', rcSau: 'UAA (ha)', rcOut: 'Gross output (€)', rcCost: 'Total costs (€)', rcNet: 'Net income (€)', rcSubs: 'Current subsidies (€)', rcTotal: 'farms represented in the published cells', rcAll: 'See all variables, types and years', rcNote: 'Farm-type and size-class names are as published by MAPA, in Spanish.' },
    fr: { recan: 'Revenus et coûts des exploitations', recanSub: 'Réseau comptable agricole espagnol (MAPA) : moyennes par exploitation pour la dernière année publiée, pour les types d’exploitation les plus représentés. Chaque ligne est la classe de dimension économique comptant le plus d’exploitations ; les cellules confidentielles ne sont pas publiées et rien n’est moyenné entre classes.', rcType: 'Type d’exploitation', rcSize: 'Classe économique principale', rcFarms: 'Exploitations représentées', rcSample: 'Échantillon', rcSau: 'SAU (ha)', rcOut: 'Production brute (€)', rcCost: 'Coûts totaux (€)', rcNet: 'Revenu net (€)', rcSubs: 'Subventions courantes (€)', rcTotal: 'exploitations représentées dans les cellules publiées', rcAll: 'Voir toutes les variables, types et années', rcNote: 'Les noms des types et des classes sont ceux du MAPA, en espagnol.' },
    it: { recan: 'Reddito e costi delle aziende', recanSub: 'Rete contabile agraria spagnola (MAPA): valori medi per azienda nell’ultimo anno pubblicato, per i tipi di azienda con più aziende rappresentate. Ogni riga è la classe di dimensione economica con più aziende; le celle riservate non sono pubblicate e nulla viene mediato tra classi.', rcType: 'Tipo di azienda', rcSize: 'Classe economica principale', rcFarms: 'Aziende rappresentate', rcSample: 'Campione', rcSau: 'SAU (ha)', rcOut: 'Produzione lorda (€)', rcCost: 'Costi totali (€)', rcNet: 'Reddito netto (€)', rcSubs: 'Sussidi correnti (€)', rcTotal: 'aziende rappresentate nelle celle pubblicate', rcAll: 'Vedi tutte le variabili, i tipi e gli anni', rcNote: 'I nomi dei tipi e delle classi sono quelli del MAPA, in spagnolo.' }
  };
  Object.keys(TX).forEach(function (l) { Object.keys(TX[l]).forEach(function (k) { T[l][k] = TX[l][k]; }); });
  var RC_CCAA = { AN: 'Andalucía', AR: 'Aragón', AS: 'Principado de Asturias', CN: 'Canarias', CB: 'Cantabria', CL: 'Castilla y León', CM: 'Castilla-La Mancha', CT: 'Cataluña', EX: 'Extremadura', GA: 'Galicia', IB: 'Islas Baleares', RI: 'La Rioja', MD: 'Comunidad de Madrid', MC: 'Región de Murcia', NC: 'Comunidad Foral de Navarra', PV: 'País Vasco', VC: 'Comunidad Valenciana' };
  function esRecan(x) {
    return get('data/recan.json').then(function (D) {
      if (!D || !D.rows) return null; var t = tt(), ci = D.ccaa.indexOf(RC_CCAA[x.r]); if (ci < 0) return null;
      var vi = {}; D.vars.forEach(function (v, i) { vi[v[0]] = i; });
      var rows = D.rows.filter(function (r) { return r[1] === ci; }); if (!rows.length) return null;
      var yr = Math.max.apply(null, rows.map(function (r) { return r[0]; })); rows = rows.filter(function (r) { return r[0] === yr; });
      var by = {}; rows.forEach(function (r) { var b = by[r[2]] = by[r[2]] || { t: r[2], sum: 0, best: null }; b.sum += r[5] || 0; if (!b.best || (r[5] || 0) > (b.best[5] || 0)) b.best = r; });
      var list = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.sum - a.sum; }), tot = list.reduce(function (a, b) { return a + b.sum; }, 0);
      if (!list.length || !tot) return null;
      var cell = function (r, id) { var v = r[6][vi[id]]; return v == null ? '<span style="color:var(--text-faint)">—</span>' : nf(v, dec(v)); };
      var body = '<p style="margin:0 0 8px"><b>' + nf(tot, 0) + '</b> ' + esc(t.rcTotal) + ' · ' + D.years[yr] + '</p>' + table([t.rcType, t.rcFarms, t.rcSize, t.rcSample, t.rcSau, t.rcOut, t.rcCost, t.rcNet, t.rcSubs], list.slice(0, 8).map(function (b) {
        var ty = D.types[b.t], r = b.best;
        return [esc(ty[0] === ty[1] ? ty[0] : ty[1]), nf(b.sum, 0), esc(D.dims[r[3]]), r[4] != null ? nf(r[4], 0) : '—', cell(r, 'SE025'), cell(r, 'SE131'), cell(r, 'SE270'), cell(r, 'SE420'), cell(r, 'SE605')];
      }), 900) + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.rcNote) + ' <a href="recan.html">' + esc(t.rcAll) + '</a></p>';
      return card(t.recan, t.recanSub, body, cite('mapa_es', String(D.years[yr])));
    });
  }
  var MODS = { US: [['drought', usDrought], ['crops', usCrops], ['cattle', usCattle], ['bids', usBids], ['fert', usFert], ['tax', usTax]], CA: [['drought', caDrought], ['cacrops', caCrops], ['lvst', caLivestock], ['inc', caIncome], ['rec', caReceipts], ['costs', caCosts], ['prices', caPrices], ['fuel', caFuel]], ES: [['recan', esRecan]] };
  var MOD_NAME = { recan: 'recan', cacrops: 'cacrops', lvst: 'lvst', inc: 'inc', rec: 'rec', drought: 'drought', crops: 'crops', cattle: 'cattle', bids: 'bids', fert: 'fert', tax: 'tax', costs: 'costs', prices: 'prices', fuel: 'fuel' };
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
