/* Dehesa Index — Perfil de región (estados de EE. UU. y provincias de Canadá). ES5.
   Cada bloque lee un fichero que ya existe en data/ y muestra solo lo que ese fichero publica para la región; lo que no hay se lista como «sin dato», nunca se rellena.
   URL: region.html?c=US&r=IA  /  region.html?c=CA&r=SK */
(function () {
  'use strict';
  var L4 = { en: 0, es: 1, fr: 2, it: 3 };
  var US = window.DehesaRegionNames.US;
  var CA = window.DehesaRegionNames.CA;
  var BE = window.DehesaRegionNames.BE, DK = window.DehesaRegionNames.DK, ES = window.DehesaRegionNames.ES, FR = window.DehesaRegionNames.FR, IT = window.DehesaRegionNames.IT, DE = window.DehesaRegionNames.DE, AU = window.DehesaRegionNames.AU, NL = window.DehesaRegionNames.NL, AT = window.DehesaRegionNames.AT;
  var CA_SLUG = { SK: 'saskatchewan', AB: 'alberta', MB: 'manitoba', ON: 'ontario', QC: 'quebec' };
  var CA_CITY = { SK: ['regina', 'saskatoon'], AB: ['calgary', 'edmonton'], MB: ['winnipeg'], ON: ['toronto'], QC: ['montreal'], BC: ['vancouver'] };
  var CA_CITY_N = { regina: 'Regina', saskatoon: 'Saskatoon', calgary: 'Calgary', edmonton: 'Edmonton', winnipeg: 'Winnipeg', toronto: 'Toronto', montreal: 'Montréal', vancouver: 'Vancouver' };
  var C = {
    US: { flag: '🇺🇸', names: US, map: 'DEHESA_US_STATES', country: ['United States', 'Estados Unidos', 'États-Unis', 'Stati Uniti'], kind: ['State', 'Estado', 'État', 'Stato'], kinds: ['states', 'estados', 'États', 'stati'], profile: 'paises.html?c=US' },
    CA: { flag: '🇨🇦', names: CA, map: 'DEHESA_CA_PROVINCES', country: ['Canada', 'Canadá', 'Canada', 'Canada'], kind: ['Province or territory', 'Provincia o territorio', 'Province ou territoire', 'Provincia o territorio'], kinds: ['provinces and territories', 'provincias y territorios', 'provinces et territoires', 'province e territori'], profile: 'paises.html?c=CA' },
    FR: { flag: '🇫🇷', names: FR, map: 'DEHESA_FR_REGIONS', country: ['France', 'Francia', 'France', 'Francia'], kind: ['Region', 'Región', 'Région', 'Regione'], kinds: ['regions', 'regiones', 'régions', 'regioni'], profile: 'paises.html?c=FR' },
    IT: { flag: '🇮🇹', names: IT, map: 'DEHESA_IT_REGIONS', country: ['Italy', 'Italia', 'Italie', 'Italia'], kind: ['Region', 'Región', 'Région', 'Regione'], kinds: ['regions', 'regiones', 'régions', 'regioni'], profile: 'paises.html?c=IT' },
    DE: { flag: '🇩🇪', names: DE, map: 'DEHESA_DE_LAENDER', country: ['Germany', 'Alemania', 'Allemagne', 'Germania'], kind: ['State (Land)', 'Estado federado (Land)', 'Land', 'Land'], kinds: ['federal states', 'estados federados', 'Länder', 'Länder'], profile: 'paises.html?c=DE' },
    AU: { flag: '🇦🇺', names: AU, map: 'DEHESA_AU_STATES', country: ['Australia', 'Australia', 'Australie', 'Australia'], kind: ['State or territory', 'Estado o territorio', 'État ou territoire', 'Stato o territorio'], kinds: ['states and territories', 'estados y territorios', 'États et territoires', 'stati e territori'], profile: 'paises.html?c=AU' },
    BE: { flag: '🇧🇪', names: BE, map: 'DEHESA_BE_PROVINCES', country: ['Belgium', 'Bélgica', 'Belgique', 'Belgio'], kind: ['Province', 'Provincia', 'Province', 'Provincia'], kinds: ['provinces', 'provincias', 'provinces', 'province'], profile: 'paises.html?c=BE' },
    DK: { flag: '🇩🇰', names: DK, map: 'DEHESA_DK_REGIONS', country: ['Denmark', 'Dinamarca', 'Danemark', 'Danimarca'], kind: ['Region', 'Región', 'Région', 'Regione'], kinds: ['regions', 'regiones', 'régions', 'regioni'], profile: 'paises.html?c=DK' },
    NL: { flag: '🇳🇱', names: NL, map: 'DEHESA_NL_PROVINCES', country: ['Netherlands', 'Países Bajos', 'Pays-Bas', 'Paesi Bassi'], kind: ['Province', 'Provincia', 'Province', 'Provincia'], kinds: ['provinces', 'provincias', 'provinces', 'province'], profile: 'paises.html?c=NL' },
    AT: { flag: '🇦🇹', names: AT, map: 'DEHESA_AT_LAENDER', country: ['Austria', 'Austria', 'Autriche', 'Austria'], kind: ['State (Land)', 'Estado federado (Land)', 'Land', 'Land'], kinds: ['federal states', 'estados federados', 'Länder', 'Länder'], profile: 'paises.html?c=AT' },
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
  function cite(id, period, note) { var o = {}; if (period) o.period = period; if (note) o.note = note; return window.DICite && window.DICite.html ? window.DICite.html(id, o) : ''; }
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
  /* ---------- UE: datos regionales de Eurostat (España, Francia, Italia y Alemania) ---------- */
  var TE = {
    es: { eaa: 'Producción y renta agraria', eaaSub: 'Cuentas económicas de la agricultura de la región (Eurostat), millones de euros a precios corrientes. Último año publicado.', eaOut: 'Producción de la rama agraria', eaNote: 'Eurostat publica estas cuentas con uno o dos años de retraso. La suma de las regiones coincide con el total nacional de Eurostat', ec: 'Peso en el país', eaYoy: 'frente al año anterior', evolution: 'Evolución', eMeUr: 'M€', prodMix: 'De dónde viene la producción', item: 'Partida', val: 'Valor', shareOut: '% de la producción', yearL: 'Año',
      ercrops: 'Cultivos', ercropsSub: 'Superficie y producción de la región (Eurostat, estadísticas de cultivos). El rendimiento es producción dividida por superficie, calculado por Dehesa Index. En cultivos permanentes solo se publica la superficie principal.', areaH: 'Superficie', prodH: 'Producción', yieldH: 'Rendimiento', kha2: 'mil ha', kt2: 'mil t', tha: 't/ha', cropH: 'Cultivo', uaaLine: 'Superficie agraria útil', ofWhich: 'de ella',
      erlive: 'Ganado y leche', erliveSub: 'Efectivos de la región (Eurostat, miles de cabezas) y leche de vaca producida en granja (miles de toneladas).', animalH: 'Efectivos', headsH: 'Miles de cabezas', milkL: 'Leche de vaca en granja', ktL: 'mil t',
      erfarms: 'Explotaciones', erfarmsSub: 'Censo agrario de la UE (Eurostat): explotaciones, superficie, trabajo y producción estándar de la región.', holdings: 'Explotaciones', uaaH: 'SAU', avgSize: 'Tamaño medio', lsuH: 'Unidades ganaderas', awuH: 'Trabajo (UTA)', soH: 'Producción estándar', typeH: 'Tipo de explotación', chgH: 'Cambio desde', haH: 'ha', mEur: 'M€', stdOut: 'La producción estándar es una estimación del valor de la producción potencial.', since: 'desde',
      deprices: 'Precios de la leche y del ganado', depricesSub: 'Precios de la BLE para el grupo de Länder al que pertenece este Land: la BLE publica estos precios por grupos de Länder, no por Land.', group: 'Grupo publicado', kind: 'Tipo', pricesCt: 'ct/kg', per100: '€/100 kg canal', organic: 'ecológica', conv: 'convencional', milkStd: 'Leche, precio en granja estandarizado', date2: 'Fecha',
      euNote: 'Cifras de Eurostat; los rendimientos, los pesos y las sumas los calcula Dehesa Index. Eurostat no es responsable de esos cálculos.', frNote: ' (Francia: sin territorios de ultramar)' },
    en: { eaa: 'Output and farm income', eaaSub: 'Economic accounts for agriculture for the region (Eurostat), million euro at current prices. Latest published year.', eaOut: 'Agricultural industry output', eaNote: 'Eurostat publishes these accounts one or two years late. The regions add up to Eurostat’s national total', ec: 'Share of the country', eaYoy: 'vs. a year earlier', evolution: 'Trend', eMeUr: 'M€', prodMix: 'Where the output comes from', item: 'Item', val: 'Value', shareOut: '% of output', yearL: 'Year',
      ercrops: 'Crops', ercropsSub: 'Area and production for the region (Eurostat crop statistics). Yield is production divided by area, computed by Dehesa Index. For permanent crops only the main area is published.', areaH: 'Area', prodH: 'Production', yieldH: 'Yield', kha2: 'thousand ha', kt2: 'thousand t', tha: 't/ha', cropH: 'Crop', uaaLine: 'Utilised agricultural area', ofWhich: 'of which',
      erlive: 'Livestock and milk', erliveSub: 'Animal numbers in the region (Eurostat, thousand head) and cow’s milk produced on farms (thousand tonnes).', animalH: 'Animals', headsH: 'Thousand head', milkL: 'Cow’s milk on farms', ktL: 'thousand t',
      erfarms: 'Farms', erfarmsSub: 'EU farm structure survey (Eurostat): holdings, land, labour and standard output of the region.', holdings: 'Holdings', uaaH: 'UAA', avgSize: 'Average size', lsuH: 'Livestock units', awuH: 'Labour (AWU)', soH: 'Standard output', typeH: 'Farm type', chgH: 'Change since', haH: 'ha', mEur: 'M€', stdOut: 'Standard output is an estimate of the value of potential production.', since: 'since',
      deprices: 'Milk and livestock prices', depricesSub: 'BLE prices for the group of Länder this Land belongs to: BLE publishes these prices by groups of Länder, not by Land.', group: 'Published group', kind: 'Type', pricesCt: 'ct/kg', per100: '€/100 kg carcass', organic: 'organic', conv: 'conventional', milkStd: 'Milk, standardised farm-gate price', date2: 'Date',
      euNote: 'Figures are Eurostat’s; yields, shares and sums are computed by Dehesa Index. Eurostat is not responsible for those calculations.', frNote: ' (France: excluding overseas territories)' },
    fr: { eaa: 'Production et revenu agricoles', eaaSub: 'Comptes économiques de l’agriculture de la région (Eurostat), millions d’euros aux prix courants. Dernière année publiée.', eaOut: 'Production de la branche agricole', eaNote: 'Eurostat publie ces comptes avec un ou deux ans de retard. La somme des régions coïncide avec le total national d’Eurostat', ec: 'Part du pays', eaYoy: 'par rapport à l’an dernier', evolution: 'Évolution', eMeUr: 'M€', prodMix: 'D’où vient la production', item: 'Poste', val: 'Valeur', shareOut: '% de la production', yearL: 'Année',
      ercrops: 'Cultures', ercropsSub: 'Superficie et production de la région (Eurostat, statistiques des cultures). Le rendement est la production divisée par la superficie, calculé par Dehesa Index. Pour les cultures permanentes, seule la superficie principale est publiée.', areaH: 'Superficie', prodH: 'Production', yieldH: 'Rendement', kha2: 'milliers d’ha', kt2: 'milliers de t', tha: 't/ha', cropH: 'Culture', uaaLine: 'Surface agricole utilisée', ofWhich: 'dont',
      erlive: 'Élevage et lait', erliveSub: 'Effectifs de la région (Eurostat, milliers de têtes) et lait de vache produit à la ferme (milliers de tonnes).', animalH: 'Effectifs', headsH: 'Milliers de têtes', milkL: 'Lait de vache à la ferme', ktL: 'milliers de t',
      erfarms: 'Exploitations', erfarmsSub: 'Enquête européenne sur la structure des exploitations (Eurostat) : exploitations, surfaces, travail et production standard de la région.', holdings: 'Exploitations', uaaH: 'SAU', avgSize: 'Taille moyenne', lsuH: 'Unités gros bétail', awuH: 'Travail (UTA)', soH: 'Production standard', typeH: 'Type d’exploitation', chgH: 'Variation depuis', haH: 'ha', mEur: 'M€', stdOut: 'La production standard est une estimation de la valeur de la production potentielle.', since: 'depuis',
      deprices: 'Prix du lait et du bétail', depricesSub: 'Prix de la BLE pour le groupe de Länder auquel appartient ce Land : la BLE publie ces prix par groupes de Länder, pas par Land.', group: 'Groupe publié', kind: 'Type', pricesCt: 'ct/kg', per100: '€/100 kg carcasse', organic: 'biologique', conv: 'conventionnel', milkStd: 'Lait, prix à la ferme standardisé', date2: 'Date',
      euNote: 'Chiffres d’Eurostat ; les rendements, parts et sommes sont calculés par Dehesa Index. Eurostat n’est pas responsable de ces calculs.', frNote: ' (France : hors outre-mer)' },
    it: { eaa: 'Produzione e reddito agricolo', eaaSub: 'Conti economici dell’agricoltura della regione (Eurostat), milioni di euro a prezzi correnti. Ultimo anno pubblicato.', eaOut: 'Produzione del ramo agricolo', eaNote: 'Eurostat pubblica questi conti con uno o due anni di ritardo. La somma delle regioni coincide con il totale nazionale di Eurostat', ec: 'Peso nel paese', eaYoy: 'rispetto all’anno prima', evolution: 'Andamento', eMeUr: 'M€', prodMix: 'Da dove viene la produzione', item: 'Voce', val: 'Valore', shareOut: '% della produzione', yearL: 'Anno',
      ercrops: 'Colture', ercropsSub: 'Superficie e produzione della regione (Eurostat, statistiche sulle colture). La resa è la produzione divisa per la superficie, calcolata da Dehesa Index. Per le colture permanenti si pubblica solo la superficie principale.', areaH: 'Superficie', prodH: 'Produzione', yieldH: 'Resa', kha2: 'migliaia di ha', kt2: 'migliaia di t', tha: 't/ha', cropH: 'Coltura', uaaLine: 'Superficie agricola utilizzata', ofWhich: 'di cui',
      erlive: 'Bestiame e latte', erliveSub: 'Consistenze della regione (Eurostat, migliaia di capi) e latte vaccino prodotto in azienda (migliaia di tonnellate).', animalH: 'Consistenze', headsH: 'Migliaia di capi', milkL: 'Latte vaccino in azienda', ktL: 'migliaia di t',
      erfarms: 'Aziende', erfarmsSub: 'Indagine UE sulla struttura delle aziende agricole (Eurostat): aziende, superfici, lavoro e produzione standard della regione.', holdings: 'Aziende', uaaH: 'SAU', avgSize: 'Dimensione media', lsuH: 'Unità di bestiame', awuH: 'Lavoro (ULA)', soH: 'Produzione standard', typeH: 'Tipo di azienda', chgH: 'Variazione dal', haH: 'ha', mEur: 'M€', stdOut: 'La produzione standard è una stima del valore della produzione potenziale.', since: 'dal',
      deprices: 'Prezzi del latte e del bestiame', depricesSub: 'Prezzi BLE per il gruppo di Länder a cui appartiene questo Land: la BLE pubblica questi prezzi per gruppi di Länder, non per Land.', group: 'Gruppo pubblicato', kind: 'Tipo', pricesCt: 'ct/kg', per100: '€/100 kg carcassa', organic: 'biologico', conv: 'convenzionale', milkStd: 'Latte, prezzo alla stalla standardizzato', date2: 'Data',
      euNote: 'Cifre di Eurostat; rese, quote e somme sono calcolate da Dehesa Index. Eurostat non è responsabile di tali calcoli.', frNote: ' (Francia: esclusi i territori d’oltremare)' }
  };
  Object.keys(TE).forEach(function (l) { Object.keys(TE[l]).forEach(function (k) { T[l][k] = TE[l][k]; }); });
  var EL = { // [en, es, fr, it]
    AM180000: ['Agricultural industry output', 'Producción de la rama agraria', 'Production de la branche agricole', 'Produzione del ramo agricolo'], AM160000: ['Agricultural output', 'Producción agraria', 'Production agricole', 'Produzione agricola'],
    AM100000: ['Crop output', 'Producción vegetal', 'Production végétale', 'Produzione vegetale'], AM110000: ['Animals (livestock sold)', 'Animales (ganado vendido)', 'Animaux', 'Animali'], AM120000: ['Animal products', 'Productos animales', 'Produits animaux', 'Prodotti animali'],
    AM010000: ['Cereals', 'Cereales', 'Céréales', 'Cereali'], AM020000: ['Industrial crops', 'Cultivos industriales', 'Cultures industrielles', 'Colture industriali'], AM030000: ['Forage plants', 'Plantas forrajeras', 'Plantes fourragères', 'Piante foraggere'], AM040000: ['Vegetables and horticulture', 'Hortalizas y horticultura', 'Légumes et horticulture', 'Ortaggi e orticoltura'], AM050000: ['Potatoes', 'Patatas', 'Pommes de terre', 'Patate'], AM060000: ['Fruit', 'Fruta', 'Fruits', 'Frutta'], AM070000: ['Wine', 'Vino', 'Vin', 'Vino'], AM080000: ['Olive oil', 'Aceite de oliva', 'Huile d’olive', 'Olio d’oliva'],
    AM111000: ['Cattle', 'Vacuno', 'Bovins', 'Bovini'], AM112000: ['Pigs', 'Porcino', 'Porcins', 'Suini'], AM114000: ['Sheep and goats', 'Ovino y caprino', 'Ovins et caprins', 'Ovini e caprini'], AM115000: ['Poultry', 'Aves', 'Volaille', 'Pollame'], AM121000: ['Milk', 'Leche', 'Lait', 'Latte'], AM122000: ['Eggs', 'Huevos', 'Œufs', 'Uova'],
    AM200000: ['Intermediate consumption', 'Consumos intermedios', 'Consommations intermédiaires', 'Consumi intermedi'], AM206000: ['of which feed', 'de ellos piensos', 'dont aliments pour animaux', 'di cui mangimi'], AM203000: ['of which fertilisers', 'de ellos fertilizantes', 'dont engrais', 'di cui fertilizzanti'], AM202000: ['of which energy', 'de ella energía', 'dont énergie', 'di cui energia'],
    AM260000: ['Gross value added', 'Valor añadido bruto', 'Valeur ajoutée brute', 'Valore aggiunto lordo'], AM280000: ['Net value added', 'Valor añadido neto', 'Valeur ajoutée nette', 'Valore aggiunto netto'], AM310000: ['Other subsidies on production', 'Otras subvenciones a la producción', 'Autres subventions à la production', 'Altri contributi alla produzione'], AM320000: ['Factor income', 'Renta de los factores', 'Revenu des facteurs', 'Reddito dei fattori'], AM330000: ['Net operating surplus / mixed income', 'Excedente neto de explotación / renta mixta', 'Excédent net d’exploitation / revenu mixte', 'Risultato netto di gestione / reddito misto'], AM370000: ['Entrepreneurial income', 'Renta empresarial', 'Revenu entrepreneurial', 'Reddito imprenditoriale']
  };
  var EC = {
    UAA: ['Utilised agricultural area', 'Superficie agraria útil', 'Surface agricole utilisée', 'Superficie agricola utilizzata'], ARA: ['Arable land', 'Tierra arable', 'Terres arables', 'Seminativi'], J0000: ['Permanent grassland', 'Prados y pastos permanentes', 'Prairies permanentes', 'Prati permanenti'],
    C0000: ['Cereals (grain)', 'Cereales (grano)', 'Céréales (grain)', 'Cereali (granella)'], C1110: ['Common wheat', 'Trigo blando', 'Blé tendre', 'Frumento tenero'], C1120: ['Durum wheat', 'Trigo duro', 'Blé dur', 'Frumento duro'], C1200: ['Rye', 'Centeno', 'Seigle', 'Segale'], C1300: ['Barley', 'Cebada', 'Orge', 'Orzo'], C1500: ['Grain maize', 'Maíz grano', 'Maïs grain', 'Mais da granella'],
    R1000: ['Potatoes', 'Patata', 'Pomme de terre', 'Patata'], R2000: ['Sugar beet', 'Remolacha azucarera', 'Betterave sucrière', 'Barbabietola da zucchero'], I1110: ['Rapeseed', 'Colza', 'Colza', 'Colza'], I1120: ['Sunflower', 'Girasol', 'Tournesol', 'Girasole'], I1130: ['Soya', 'Soja', 'Soja', 'Soia'],
    P0000: ['Dry pulses and protein crops', 'Leguminosas grano y proteaginosas', 'Légumineuses à grains et protéagineux', 'Legumi secchi e proteaginose'], G3000: ['Green maize', 'Maíz forrajero', 'Maïs fourrage', 'Mais da foraggio'], F0000: ['Fruit, berries and nuts', 'Frutales, bayas y frutos secos', 'Fruits, baies et fruits à coque', 'Frutta, bacche e frutta a guscio'], T0000: ['Citrus', 'Cítricos', 'Agrumes', 'Agrumi'], W1000: ['Vines (grapes)', 'Viñedo', 'Vignes', 'Vite'], O1000: ['Olives', 'Olivar', 'Oliviers', 'Olivo']
  };
  var EAN = { A2000: ['Cattle', 'Vacuno', 'Bovins', 'Bovini'], A2300F: ['Dairy cows', 'Vacas lecheras', 'Vaches laitières', 'Vacche da latte'], A2300G: ['Other cows', 'Vacas no lecheras', 'Vaches allaitantes', 'Vacche non da latte'], A3100: ['Pigs', 'Porcino', 'Porcins', 'Suini'], A4100: ['Sheep', 'Ovino', 'Ovins', 'Ovini'], A4200: ['Goats', 'Caprino', 'Caprins', 'Caprini'] };
  var EFT = { FT1: ['Field crops', 'Cultivos herbáceos', 'Grandes cultures', 'Seminativi'], FT2: ['Horticulture', 'Horticultura', 'Horticulture', 'Orticoltura'], FT3: ['Permanent crops', 'Cultivos permanentes', 'Cultures permanentes', 'Colture permanenti'], FT4: ['Grazing livestock', 'Herbívoros', 'Herbivores', 'Erbivori'], FT5: ['Granivores', 'Granívoros (porcino y aves)', 'Granivores', 'Granivori'], FT6: ['Mixed cropping', 'Policultivo', 'Polyculture', 'Policoltura'], FT7: ['Mixed livestock', 'Policría', 'Polyélevage', 'Poliallevamento'], FT8: ['Mixed crops and livestock', 'Cultivos y ganado mixtos', 'Polyculture-élevage', 'Colture e allevamento misti'], FT9: ['Non-classified', 'Sin clasificar', 'Non classées', 'Non classificate'] };
  LBL.deMeat = ['Slaughter prices by region (BLE)', 'Precios de sacrificio por región (BLE)', 'Prix d’abattage par région (BLE)', 'Prezzi di macellazione per regione (BLE)'];
  var EAA_COLS = [['AM180000'], ['AM260000'], ['AM320000'], ['AM370000']];
  function euData(cc) { return get('data/eu-regions-' + cc.toLowerCase() + '.json'); }
  function ycell(p, y) { for (var i = p.length - 1; i >= 0; i--) if (p[i][0] === y) return p[i][1]; return null; }
  function lastP(p) { return p && p.length ? p[p.length - 1] : null; }
  function countryTotal(D, pick, y) { var s = 0, n = 0, k; for (k in D.regions) { var p = pick(D.regions[k]); var v = p ? ycell(p, y) : null; if (v == null) return null; s += v; n++; } return n ? s : null; }
  function euNote(cc) { return cite('eurostat', '', tt().euNote + (cc === 'FR' ? tt().frNote : '')); }
  function sharePct(v, tot) { return tot ? nf(v / tot * 100, v / tot < .1 ? 1 : 0) + ' %' : '<span style="color:var(--text-faint)">—</span>'; }
  function euEaa(x) {
    return euData(x.c).then(function (D) {
      var b = D && D.regions && D.regions[x.r], o = b && b.eaa; /* producción 0 en todas las partidas (Bruselas-Capital, 2023): no es un dato, se lista como «sin dato» */ if (!o || !o.AM180000 || !(lastP(o.AM180000)[1] > 0)) return null; var t = tt(), y = lastP(o.AM180000)[0], f = function (it) { return o[it] ? ycell(o[it], y) : null; };
      var yoy = function (it) { var a = f(it), c = o[it] ? ycell(o[it], y - 1) : null; return a != null && c ? (a / c - 1) * 100 : null; };
      var tiles = EAA_COLS.map(function (c) { var it = c[0], v = f(it); if (v == null) return ''; var yy = yoy(it), tt0 = countryTotal(D, function (r) { return r.eaa && r.eaa[it]; }, y);
        return '<div style="flex:1;min-width:140px"><div style="font-size:12px;color:var(--text-faint)">' + esc(EL[it][li()]) + '</div><div style="font-size:22px;font-weight:700">' + nf(v, dec(v)) + ' <span style="font-size:13px;font-weight:400;color:var(--text-faint)">' + esc(t.eMeUr) + '</span></div><div style="font-size:12px;color:var(--text-faint)">' + (yy != null ? esc(pct(yy)) + ' ' + esc(t.eaYoy) : '') + (tt0 ? ' · ' + esc(t.ec) + ' ' + sharePct(v, tt0) : '') + '</div></div>'; }).join('');
      var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.yearL) + ' ' + y + '</p><div style="display:flex;gap:10px;flex-wrap:wrap">' + tiles + '</div>';
      var cs = [['AM180000', '#2f6b4a'], ['AM200000', '#b03a2e'], ['AM260000', '#e08a3a']].map(function (c) { return o[c[0]] ? { name: EL[c[0]][li()], color: c[1], pts: o[c[0]].map(function (p) { return { x: Date.UTC(p[0], 0, 1), y: p[1], l: String(p[0]) }; }) } : null; }).filter(Boolean);
      if (cs.length) body += window.DehesaChart.render({ series: cs, xMode: 'time', yMin: 0, yTitle: t.eMeUr, aria: t.eaa + ' ' + nm(C[x.c], x.r), vFmt: function (v) { return nf(v, dec(v)) + ' ' + t.eMeUr; }, yFmt: function (v) { return nf(v, 0); }, xFmt: function (v) { return new Date(v).getUTCFullYear(); } });
      var base = f('AM160000'), items = ['AM100000', 'AM110000', 'AM120000', 'AM010000', 'AM020000', 'AM030000', 'AM040000', 'AM050000', 'AM060000', 'AM070000', 'AM080000', 'AM111000', 'AM112000', 'AM114000', 'AM115000', 'AM121000', 'AM122000'];
      var rows = items.map(function (it) { var v = f(it); return v == null || v <= 0 ? null : { it: it, v: v }; }).filter(Boolean);
      var grp = rows.filter(function (r) { return ['AM100000', 'AM110000', 'AM120000'].indexOf(r.it) >= 0; }), det = rows.filter(function (r) { return ['AM100000', 'AM110000', 'AM120000'].indexOf(r.it) < 0; }).sort(function (a, c) { return c.v - a.v; });
      var mk = function (r) { var yy = yoy(r.it); return [esc(EL[r.it][li()]), nf(r.v, dec(r.v)), base ? nf(r.v / base * 100, 1) + ' %' : '', yy == null ? '' : esc(pct(yy))]; };
      if (base && rows.length) body += '<h3 style="margin:14px 0 4px;font-size:14px">' + esc(t.prodMix) + '</h3>' + table([t.item, t.eMeUr, t.shareOut, t.eaYoy], grp.concat(det).map(mk), 460);
      body += '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.eaNote) + (x.c === 'FR' ? esc(t.frNote) : '') + '.</p>';
      return card(t.eaa, t.eaaSub, body, euNote(x.c));
    });
  }
  function euCrops(x) {
    return euData(x.c).then(function (D) {
      var b = D && D.regions && D.regions[x.r], c = b && b.crops; if (!c) return null; var t = tt(), rows = [], head = '';
      Object.keys(c).forEach(function (k) {
        var e = c[k], a = lastP(e.area), pr = lastP(e.prod), y = a ? a[0] : pr ? pr[0] : null; if (!EC[k] || y == null) return;
        var av = a && a[0] === y ? a[1] : null, pv = pr && pr[0] === y ? pr[1] : null; if (!(av > 0) && !(pv > 0)) return;
        var tot = av != null ? countryTotal(D, function (r) { return r.crops && r.crops[k] && r.crops[k].area; }, y) : null;
        rows.push({ k: k, y: y, av: av, pv: pv, tot: tot });
      });
      var uaa = rows.filter(function (r) { return r.k === 'UAA'; })[0];
      if (uaa) head = '<p style="margin:0 0 8px"><b>' + nf(uaa.av, dec(uaa.av)) + ' ' + esc(t.kha2) + '</b> ' + esc(EC.UAA[li()].toLowerCase()) + ' · ' + uaa.y + [['ARA', 0], ['J0000', 0]].map(function (z) { var r = rows.filter(function (q) { return q.k === z[0]; })[0]; return r ? ' · ' + esc(EC[z[0]][li()].toLowerCase()) + ' ' + nf(r.av, dec(r.av)) : ''; }).join('') + '</p>';
      rows = rows.filter(function (r) { return r.k !== 'UAA'; }).sort(function (p, q) { return (q.av || 0) - (p.av || 0); });
      if (!rows.length) return null;
      var tb = table([t.cropH, t.areaH + ' (' + t.kha2 + ')', t.prodH + ' (' + t.kt2 + ')', t.yieldH + ' (' + t.tha + ')', t.ec, t.yearL], rows.map(function (r) {
        var dash = '<span style="color:var(--text-faint)">—</span>';
        return [esc(EC[r.k][li()]), r.av != null ? nf(r.av, dec(r.av)) : dash, r.pv != null ? nf(r.pv, dec(r.pv)) : dash, r.av > 0 && r.pv != null ? nf(r.pv / r.av, 1) : dash, r.av != null && r.tot ? sharePct(r.av, r.tot) : dash, String(r.y)];
      }), 640);
      return card(t.ercrops, t.ercropsSub, head + tb, euNote(x.c));
    });
  }
  function euLive(x) {
    return euData(x.c).then(function (D) {
      var b = D && D.regions && D.regions[x.r], an = b && b.animals; if (!an) return null; var t = tt(), rows = [];
      Object.keys(EAN).forEach(function (k) { var p = an[k], l = lastP(p); if (!l || !(l[1] > 0)) return; var pv = ycell(p, l[0] - 1), tot = countryTotal(D, function (r) { return r.animals && r.animals[k]; }, l[0]);
        rows.push([esc(EAN[k][li()]), nf(l[1], dec(l[1])), pv ? esc(pct((l[1] / pv - 1) * 100)) : '', tot ? sharePct(l[1], tot) : '', String(l[0])]); });
      var body = rows.length ? table([t.animalH, t.headsH, t.eaYoy, t.ec, t.yearL], rows, 480) : '';
      var m = lastP(b.milk);
      if (m) { var mp = ycell(b.milk, m[0] - 1), mt = countryTotal(D, function (r) { return r.milk; }, m[0]); body += '<p style="margin:10px 0 0"><b>' + nf(m[1], 0) + ' ' + esc(t.ktL) + '</b> ' + esc(t.milkL.toLowerCase()) + ' · ' + m[0] + (mp ? ' · ' + esc(pct((m[1] / mp - 1) * 100)) + ' ' + esc(t.eaYoy) : '') + (mt ? ' · ' + esc(t.ec) + ' ' + sharePct(m[1], mt) : '') + '</p>';
        if (b.milk.length > 3) body += window.DehesaChart.render({ series: [{ name: t.milkL, color: '#2f6b4a', pts: b.milk.map(function (p) { return { x: Date.UTC(p[0], 0, 1), y: p[1], l: String(p[0]) }; }) }], xMode: 'time', yMin: 0, yTitle: t.ktL, noLegend: true, aria: t.milkL + ' ' + nm(C[x.c], x.r), vFmt: function (v) { return nf(v, 0) + ' ' + t.ktL; }, yFmt: function (v) { return nf(v, 0); }, xFmt: function (v) { return new Date(v).getUTCFullYear(); } }); }
      if (!body) return null;
      return card(t.erlive, t.erliveSub, body, euNote(x.c));
    });
  }
  function euFarms(x) {
    return euData(x.c).then(function (D) {
      var b = D && D.regions && D.regions[x.r], F = b && b.farms, T0 = F && F.TOTAL; if (!T0) return null; var t = tt(), ys = Object.keys(T0).sort(), y = ys[ys.length - 1], f = T0[y], y0 = ys[0], f0 = T0[y0];
      if (!f || !f.HLD) return null;
      var tile = function (lab, v, unit, sub) { return '<div style="flex:1;min-width:130px"><div style="font-size:12px;color:var(--text-faint)">' + esc(lab) + '</div><div style="font-size:20px;font-weight:700">' + v + (unit ? ' <span style="font-size:13px;font-weight:400;color:var(--text-faint)">' + esc(unit) + '</span>' : '') + '</div>' + (sub ? '<div style="font-size:12px;color:var(--text-faint)">' + sub + '</div>' : '') + '</div>'; };
      var chg = f0 && f0.HLD && y0 !== y ? esc(pct((f.HLD / f0.HLD - 1) * 100)) + ' ' + esc(t.since) + ' ' + y0 : '';
      var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.yearL) + ' ' + y + '</p><div style="display:flex;gap:10px;flex-wrap:wrap">' + tile(t.holdings, nf(f.HLD, 0), '', chg) + (f.HA ? tile(t.uaaH, nf(f.HA / 1000, dec(f.HA / 1000)), t.kha2, '') + tile(t.avgSize, nf(f.HA / f.HLD, 1), t.haH, '') : '') + (f.AWU ? tile(t.awuH, nf(f.AWU, 0), '', '') : '') + (f.EUR ? tile(t.soH, nf(f.EUR / 1e6, 0), t.mEur, '') : '') + '</div>';
      var types = Object.keys(EFT).map(function (k) { var e = F[k] && F[k][y]; return e && e.HLD ? { k: k, e: e } : null; }).filter(Boolean).sort(function (p, q) { return q.e.HLD - p.e.HLD; });
      if (types.length) body += '<h3 style="margin:14px 0 4px;font-size:14px">' + esc(t.typeH) + '</h3>' + table([t.typeH, t.holdings, '%', t.uaaH + ' (' + t.haH + ')', t.soH + ' (' + t.mEur + ')'], types.map(function (r) { return [esc(EFT[r.k][li()]), nf(r.e.HLD, 0), nf(r.e.HLD / f.HLD * 100, 0) + ' %', r.e.HA ? nf(r.e.HA, 0) : '', r.e.EUR ? nf(r.e.EUR / 1e6, 0) : '']; }), 560) + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.stdOut) + '</p>';
      return card(t.erfarms, t.erfarmsSub, body, euNote(x.c));
    });
  }
  /* Alemania: precios BLE por grupo de Länder */
  var DE_EN = { BW: 'Baden-Württemberg', BY: 'Bavaria', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hesse', MV: 'Mecklenburg-Western Pomerania', NI: 'Lower Saxony', NW: 'North Rhine-Westphalia', RP: 'Rhineland-Palatinate', SL: 'Saarland', SN: 'Saxony', ST: 'Saxony-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thuringia' };
  function deGroupHas(txt, en) { return txt.split(/\s*\/\s*|,\s*|\s+and\s+/).some(function (z) { return z === en; }); }
  function dePrices(x) {
    return get('data/germany-stats.json').then(function (d) {
      var S = d && d.countries && d.countries.DE && d.countries.DE.series, en = DE_EN[x.r]; if (!S || !en) return null; var t = tt(), milk = [], meat = [];
      S.forEach(function (s) {
        if (s.latest == null) return;
        if (s.group === 'milk_regions') { var m = /^(.*), (organic|conventional) milk/.exec(s.label); if (m && deGroupHas(m[1], en)) milk.push([esc(m[1]), esc(t[m[2] === 'organic' ? 'organic' : 'conv']), nf(s.latest, 2) + ' <span style="color:var(--text-faint);font-size:12px">' + esc(t.pricesCt) + '</span>', s.changePct != null ? esc(pct(s.changePct)) : '', esc(day(s.latestPeriod))]); }
        else if (s.group === 'meat_regions') { var q = /^(.*): (.*)$/.exec(s.label); if (q && deGroupHas(q[2], en)) meat.push([esc(q[1]), esc(q[2]), nf(s.latest, 2) + ' <span style="color:var(--text-faint);font-size:12px">' + esc(t.per100) + '</span>', s.changePct != null ? esc(pct(s.changePct)) : '', esc(day(s.latestPeriod))]); }
      });
      if (!milk.length && !meat.length) return null;
      milk.sort(function (a, c) { return a[0] < c[0] ? -1 : 1; }); meat.sort(function (a, c) { return a[0] < c[0] ? -1 : 1; });
      var body = (milk.length ? '<h3 style="margin:0 0 4px;font-size:14px">' + esc(t.milkStd) + '</h3>' + table([t.group, t.kind, t.price, t.vs, t.date2], milk, 560) : '') + (meat.length ? '<h3 style="margin:14px 0 4px;font-size:14px">' + esc(LBL.deMeat[li()]) + '</h3>' + table([t.product, t.group, t.price, t.vs, t.date2], meat, 620) : '');
      return card(t.deprices, t.depricesSub, body, cite('ble'));
    });
  }
  /* ---------- Australia: exportaciones por estado (ABS) ---------- */
  var TAU = {es: { auex: 'Exportaciones agroalimentarias', auexSub: 'Valor de las exportaciones de mercancías del estado por año natural completo (ABS, comercio internacional por estado de origen), millones de dólares australianos. Los estados suman algo menos que el total nacional porque la ABS no asigna toda la mercancía a un estado.', auAll: 'Total agroalimentario', auShare: 'Peso en Australia', auProd: 'Producto', auNote: 'No hay dato publicado de producción, superficie ni precios por estado en una fuente abierta que podamos reutilizar; por eso esta página solo muestra comercio.', auLive: 'Animales vivos', auBeef: 'Carne bovina', auSheep: 'Otras carnes (ovino)', auMilk: 'Leche y nata', auCheese: 'Queso', auWheat: 'Trigo', auBarley: 'Cebada', auMaize: 'Maíz', auSugar: 'Azúcar', auWine: 'Bebidas alcohólicas (vino)', auOil: 'Oleaginosas', auCotton: 'Algodón', auWool: 'Lana' },
    en: { auex: 'Agri-food exports', auexSub: 'Value of the state’s merchandise exports by full calendar year (ABS, international trade by state of origin), million Australian dollars. States add up to a little less than the national total because the ABS does not allocate every shipment to a state.', auAll: 'Agri-food total', auShare: 'Share of Australia', auProd: 'Product', auNote: 'No production, area or price data by state is published in an open source we can reuse, so this page only shows trade.', auLive: 'Live animals', auBeef: 'Bovine meat', auSheep: 'Other meat (incl. sheep meat)', auMilk: 'Milk and cream', auCheese: 'Cheese', auWheat: 'Wheat', auBarley: 'Barley', auMaize: 'Maize', auSugar: 'Sugar', auWine: 'Alcoholic beverages (wine)', auOil: 'Oilseeds', auCotton: 'Cotton', auWool: 'Wool' },
    fr: { auex: 'Exportations agroalimentaires', auexSub: 'Valeur des exportations de marchandises de l’État par année civile complète (ABS, commerce international par État d’origine), millions de dollars australiens. Les États totalisent un peu moins que le total national car l’ABS n’attribue pas toute la marchandise à un État.', auAll: 'Total agroalimentaire', auShare: 'Part de l’Australie', auProd: 'Produit', auNote: 'Aucune donnée de production, de superficie ou de prix par État n’est publiée dans une source ouverte réutilisable ; cette page ne montre donc que le commerce.', auLive: 'Animaux vivants', auBeef: 'Viande bovine', auSheep: 'Autres viandes (ovine)', auMilk: 'Lait et crème', auCheese: 'Fromage', auWheat: 'Blé', auBarley: 'Orge', auMaize: 'Maïs', auSugar: 'Sucre', auWine: 'Boissons alcooliques (vin)', auOil: 'Oléagineux', auCotton: 'Coton', auWool: 'Laine' },
    it: { auex: 'Esportazioni agroalimentari', auexSub: 'Valore delle esportazioni di merci dello stato per anno solare completo (ABS, commercio internazionale per stato di origine), milioni di dollari australiani. Gli stati sommano un po’ meno del totale nazionale perché l’ABS non attribuisce tutta la merce a uno stato.', auAll: 'Totale agroalimentare', auShare: 'Peso in Australia', auProd: 'Prodotto', auNote: 'Non ci sono dati di produzione, superficie o prezzi per stato in una fonte aperta riutilizzabile; questa pagina mostra quindi solo il commercio.', auLive: 'Animali vivi', auBeef: 'Carne bovina', auSheep: 'Altre carni (ovine)', auMilk: 'Latte e panna', auCheese: 'Formaggio', auWheat: 'Frumento', auBarley: 'Orzo', auMaize: 'Mais', auSugar: 'Zucchero', auWine: 'Bevande alcoliche (vino)', auOil: 'Semi oleosi', auCotton: 'Cotone', auWool: 'Lana' } };
  Object.keys(TAU).forEach(function (l) { Object.keys(TAU[l]).forEach(function (k) { T[l][k] = TAU[l][k]; }); });
  var AU_P = [['agrifood', 'auAll'], ['beef', 'auBeef'], ['sheepmeat', 'auSheep'], ['wheat', 'auWheat'], ['barley', 'auBarley'], ['maize', 'auMaize'], ['oilseeds', 'auOil'], ['cotton', 'auCotton'], ['wool', 'auWool'], ['wine', 'auWine'], ['sugar', 'auSugar'], ['milk', 'auMilk'], ['cheese', 'auCheese'], ['live', 'auLive']];
  function auExports(x) {
    return get('data/au-states.json').then(function (d) {
      var S = d && d.states, b = S && S[x.r]; if (!b || !b.agrifood) return null; var t = tt(), y = b.agrifood[b.agrifood.length - 1][0], rows = [];
      var tot = function (k, yy) { var s = 0; Object.keys(S).forEach(function (st) { s += (S[st][k] ? ycell(S[st][k], yy) : 0) || 0; }); return s; };
      AU_P.forEach(function (z) { var p = b[z[0]], v = p ? ycell(p, y) : null; if (v == null || v <= 0) return; var pv = ycell(p, y - 1), all = tot(z[0], y);
        rows.push([esc(t[z[1]]), nf(v, dec(v)), pv ? esc(pct((v / pv - 1) * 100)) : '', all ? sharePct(v, all) : '']); });
      var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(t.yearL) + ' ' + y + '</p>' + table([t.auProd, 'A$ M', t.eaYoy, t.auShare], rows, 460);
      body += window.DehesaChart.render({ series: [{ name: t.auAll, color: '#2f6b4a', pts: b.agrifood.map(function (p) { return { x: Date.UTC(p[0], 0, 1), y: p[1], l: String(p[0]) }; }) }], xMode: 'time', yMin: 0, yTitle: 'A$ M', noLegend: true, aria: t.auex + ' ' + nm(C.AU, x.r), vFmt: function (v) { return nf(v, dec(v)) + ' A$ M'; }, yFmt: function (v) { return nf(v, 0); }, xFmt: function (v) { return new Date(v).getUTCFullYear(); } });
      body += '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(t.auNote) + '</p>';
      return card(t.auex, t.auexSub, body, cite('abs'));
    });
  }
  var MODS = { US: [['drought', usDrought], ['crops', usCrops], ['cattle', usCattle], ['bids', usBids], ['fert', usFert], ['tax', usTax]], CA: [['drought', caDrought], ['cacrops', caCrops], ['lvst', caLivestock], ['inc', caIncome], ['rec', caReceipts], ['costs', caCosts], ['prices', caPrices], ['fuel', caFuel]], ES: [['eaa', euEaa], ['recan', esRecan], ['ercrops', euCrops], ['erlive', euLive], ['erfarms', euFarms]], FR: [['eaa', euEaa], ['ercrops', euCrops], ['erlive', euLive], ['erfarms', euFarms]], NL: [['eaa', euEaa], ['ercrops', euCrops], ['erlive', euLive], ['erfarms', euFarms]], AT: [['eaa', euEaa], ['ercrops', euCrops], ['erlive', euLive], ['erfarms', euFarms]], BE: [['eaa', euEaa], ['ercrops', euCrops], ['erlive', euLive], ['erfarms', euFarms]], DK: [['eaa', euEaa], ['ercrops', euCrops], ['erlive', euLive], ['erfarms', euFarms]], IT: [['eaa', euEaa], ['ercrops', euCrops], ['erlive', euLive], ['erfarms', euFarms]], AU: [['auex', auExports]], DE: [['eaa', euEaa], ['ercrops', euCrops], ['erlive', euLive], ['erfarms', euFarms], ['deprices', dePrices]] };
  var MOD_NAME = { auex: 'auex', recan: 'recan', eaa: 'eaa', ercrops: 'ercrops', erlive: 'erlive', erfarms: 'erfarms', deprices: 'deprices', cacrops: 'cacrops', lvst: 'lvst', inc: 'inc', rec: 'rec', drought: 'drought', crops: 'crops', cattle: 'cattle', bids: 'bids', fert: 'fert', tax: 'tax', costs: 'costs', prices: 'prices', fuel: 'fuel' };
  /* Economía y población de la región (Eurostat NUTS 2): PIB, PIB por habitante (calculado), población y paro. Solo lo que Eurostat publica para esa región. */
  var MAC = {
    es: { t: 'Economía y población', sub: 'PIB, población y paro de la región según Eurostat (nivel NUTS 2). Solo se muestra lo que la fuente publica.', gdp: 'PIB', gdppc: 'PIB por habitante', pop: 'Población', unemp: 'Paro (15-74 años)', yoy: 'frente al año anterior', note: 'El PIB por habitante lo calcula Dehesa Index dividiendo el PIB por la población de 1 de enero. La tasa de paro y el resto de cifras aparecen solo cuando Eurostat las publica para esa región; Dehesa Index no las estima ni suma tasas.', mn: ' M', bn: ' mil M' },
    en: { t: 'Economy and population', sub: 'GDP, population and unemployment of the region from Eurostat (NUTS 2 level). Only what the source publishes is shown.', gdp: 'GDP', gdppc: 'GDP per inhabitant', pop: 'Population', unemp: 'Unemployment (15-74)', yoy: 'vs previous year', note: 'GDP per inhabitant is calculated by Dehesa Index as GDP divided by the 1 January population. The unemployment rate and the other figures appear only when Eurostat publishes them for that region; Dehesa Index does not estimate them or add up rates.', mn: ' M', bn: ' bn' },
    fr: { t: 'Économie et population', sub: 'PIB, population et chômage de la région selon Eurostat (niveau NUTS 2). Seul ce que la source publie est affiché.', gdp: 'PIB', gdppc: 'PIB par habitant', pop: 'Population', unemp: 'Chômage (15-74 ans)', yoy: 'par rapport à l’année précédente', note: 'Le PIB par habitant est calculé par Dehesa Index en divisant le PIB par la population au 1er janvier. Le taux de chômage et les autres chiffres n’apparaissent que si Eurostat les publie pour cette région ; Dehesa Index ne les estime pas et n’additionne pas de taux.', mn: ' M', bn: ' Md' },
    it: { t: 'Economia e popolazione', sub: 'PIL, popolazione e disoccupazione della regione secondo Eurostat (livello NUTS 2). Si mostra solo ciò che la fonte pubblica.', gdp: 'PIL', gdppc: 'PIL pro capite', pop: 'Popolazione', unemp: 'Disoccupazione (15-74 anni)', yoy: 'rispetto all’anno precedente', note: 'Il PIL pro capite è calcolato da Dehesa Index dividendo il PIL per la popolazione al 1° gennaio. Il tasso di disoccupazione e le altre cifre compaiono solo se Eurostat le pubblica per quella regione; Dehesa Index non le stima e non somma tassi.', mn: ' M', bn: ' mld' }
  };
  function euMacro(x) {
    return get('data/eu-regions-macro.json').then(function (d) {
      var R = d && d.regions && d.regions[x.c] && d.regions[x.c][x.r]; if (!R) return null;
      var m = MAC[lang()] || MAC.es, tiles = [], yrs = [];
      var last = function (a) { return a && a.length ? a[a.length - 1] : null; };
      var add = function (k, fmt) {
        var a = R[k], l = last(a); if (!l || l[0] < new Date().getFullYear() - 5) return; /* series paradas hace años no se muestran como actuales */ var pv = a.length > 1 && a[a.length - 2][0] === l[0] - 1 ? a[a.length - 2][1] : null; yrs.push(l[0]);
        tiles.push('<div style="min-width:130px"><div style="font-size:11px;color:var(--text-faint)">' + esc(m[k]) + '</div><div style="font-size:18px;font-weight:700;font-variant-numeric:tabular-nums">' + fmt(l[1]) + ' <span style="font-weight:400;font-size:12px;color:var(--text-faint)">(' + l[0] + ')</span></div>' +
          (pv ? '<div style="font-size:11px;color:var(--text-muted)">' + (k === 'unemp' ? esc((l[1] - pv > 0 ? '+' : l[1] - pv < 0 ? '−' : '') + nf(Math.abs(l[1] - pv), 1) + ' pp') : esc(pct((l[1] / pv - 1) * 100))) + ' ' + esc(m.yoy) + '</div>' : '') + '</div>');
      };
      add('gdp', function (v) { return nf(v, 0) + m.mn + ' €'; });
      add('gdppc', function (v) { return nf(v, 0) + ' €'; });
      add('pop', function (v) { return v >= 1e6 ? nf(v / 1e6, 2) + m.mn : nf(v / 1000, 0) + ' k'; });
      add('unemp', function (v) { return nf(v, 1) + ' %'; });
      if (!tiles.length) return null;
      var body = '<div style="display:flex;flex-wrap:wrap;gap:14px 28px">' + tiles.join('') + '</div><p class="di-movers-hint" style="margin:10px 0 0">' + esc(m.note) + '</p>';
      return card(m.t, m.sub, body, cite('eurostat', String(Math.max.apply(null, yrs))));
    });
  }
  ['ES', 'FR', 'IT', 'DE', 'NL', 'AT', 'BE', 'DK'].forEach(function (c) { if (MODS[c]) MODS[c].unshift(['macro', euMacro]); else MODS[c] = [['macro', euMacro]]; });
  /* Economía y población de cada estado de EE. UU.: PIB (BEA), población (Census), paro (BLS) y PIB por habitante (calculado). */
  var MACUS = {
    es: { sub: 'PIB, población y paro del estado según BEA, Census Bureau y BLS. Solo se muestra lo que las fuentes publican.', note: 'El PIB por habitante lo calcula Dehesa Index dividiendo el PIB del año por la población a 1 de julio. El paro es la tasa mensual desestacionalizada de BLS (LAUS); Dehesa Index no estima ni suma tasas.', unemp: 'Paro', mn: ' M', bn: ' mil M' },
    en: { sub: 'GDP, population and unemployment of the state from BEA, the Census Bureau and BLS. Only what the sources publish is shown.', note: 'GDP per inhabitant is calculated by Dehesa Index as the year’s GDP divided by the 1 July population. Unemployment is the seasonally adjusted monthly rate from BLS (LAUS); Dehesa Index does not estimate it or add up rates.', unemp: 'Unemployment', mn: ' M', bn: ' bn' },
    fr: { sub: 'PIB, population et chômage de l’État selon le BEA, le Census Bureau et le BLS. Seul ce que les sources publient est affiché.', note: 'Le PIB par habitant est calculé par Dehesa Index en divisant le PIB de l’année par la population au 1er juillet. Le chômage est le taux mensuel désaisonnalisé du BLS (LAUS) ; Dehesa Index ne l’estime pas et n’additionne pas de taux.', unemp: 'Chômage', mn: ' M', bn: ' Md' },
    it: { sub: 'PIL, popolazione e disoccupazione dello stato secondo BEA, Census Bureau e BLS. Si mostra solo ciò che le fonti pubblicano.', note: 'Il PIL pro capite è calcolato da Dehesa Index dividendo il PIL dell’anno per la popolazione al 1° luglio. La disoccupazione è il tasso mensile destagionalizzato del BLS (LAUS); Dehesa Index non lo stima e non somma tassi.', unemp: 'Disoccupazione', mn: ' M', bn: ' mld' }
  };
  function usMacro(x) {
    return get('data/us-states-macro.json').then(function (d) {
      var R = d && d.regions && d.regions[x.r]; if (!R) return null;
      var m = MAC[lang()] || MAC.es, u = MACUS[lang()] || MACUS.es, tiles = [], yrs = [];
      var last = function (a) { return a && a.length ? a[a.length - 1] : null; };
      var add = function (k, fmt, lab) {
        var a = R[k], l = last(a); if (!l) return; var mo = typeof l[0] === 'string'; var pv = null;
        if (mo) { var y = +l[0].slice(0, 4), p = (y - 1) + l[0].slice(4); for (var i = 0; i < a.length; i++) if (a[i][0] === p) pv = a[i][1]; yrs.push(y); }
        else { pv = a.length > 1 && a[a.length - 2][0] === l[0] - 1 ? a[a.length - 2][1] : null; yrs.push(l[0]); }
        var per = mo ? l[0].slice(0, 4) + '-' + l[0].slice(5) : String(l[0]);
        if (mo) { try { per = new Date(Date.UTC(+l[0].slice(0, 4), +l[0].slice(5) - 1, 1)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) {} }
        tiles.push('<div style="min-width:130px"><div style="font-size:11px;color:var(--text-faint)">' + esc(lab) + '</div><div style="font-size:18px;font-weight:700;font-variant-numeric:tabular-nums">' + fmt(l[1]) + ' <span style="font-weight:400;font-size:12px;color:var(--text-faint)">(' + esc(per) + ')</span></div>' +
          (pv != null ? '<div style="font-size:11px;color:var(--text-muted)">' + (k === 'unemp' ? esc((l[1] - pv > 0 ? '+' : l[1] - pv < 0 ? '−' : '') + nf(Math.abs(l[1] - pv), 1) + ' pp') : esc(pct((l[1] / pv - 1) * 100))) + ' ' + esc(m.yoy) + '</div>' : '') + '</div>');
      };
      add('gdp', function (v) { return '$' + nf(v / 1000, 1) + m.bn; }, m.gdp);
      add('gdppc', function (v) { return '$' + nf(v, 0); }, m.gdppc);
      add('pop', function (v) { return v >= 1e6 ? nf(v / 1e6, 2) + m.mn : nf(v / 1000, 0) + ' k'; }, m.pop);
      add('unemp', function (v) { return nf(v, 1) + ' %'; }, u.unemp);
      if (!tiles.length) return null;
      var body = '<div style="display:flex;flex-wrap:wrap;gap:14px 28px">' + tiles.join('') + '</div><p class="di-movers-hint" style="margin:10px 0 0">' + esc(u.note) + '</p>';
      return card(m.t, u.sub, body, cite('bea', R.gdp && R.gdp.length ? String(R.gdp[R.gdp.length - 1][0]) : '') + ' ' + cite('census', R.pop && R.pop.length ? String(R.pop[R.pop.length - 1][0]) : '') + ' ' + cite('bls', R.unemp && R.unemp.length ? R.unemp[R.unemp.length - 1][0] : ''));
    });
  }
  (function () { if (MODS.US) MODS.US.unshift(['macro', usMacro]); else MODS.US = [['macro', usMacro]]; })();
  MOD_NAME.macro = 'macro'; ['es', 'en', 'fr', 'it'].forEach(function (l) { if (T[l]) T[l].macro = MAC[l].t; });
  /* bloques adicionales (js/region-more.js): clima, seguros, mercados locales, cultivos y ganado de España por comunidad, agua y maíz de Francia, producción, tierra y ganado de Alemania, CBS de Países Bajos */
  var OPTIONAL = {};
  (function () {
    if (!window.DehesaRegionMore) return;
    var mon = function (p) { if (!/^\d{4}-\d{2}$/.test(String(p))) return String(p); var q = String(p).split('-'); try { return new Date(Date.UTC(+q[0], +q[1] - 1, 1)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return String(p); } };
    var M = window.DehesaRegionMore({ get: get, card: card, cite: cite, table: table, nf: nf, esc: esc, tt: tt, day: day, pct: pct, dec: dec, lang: lang, plabel: mon,
      nameFr: function (r) { var s = C.FR.names[r]; return s ? s.split('|')[2] : r; }, yearWord: function () { return tt().yearL || ''; } });
    Object.keys(M.T).forEach(function (l) { if (!T[l]) return; Object.keys(M.T[l]).forEach(function (k) { if (T[l][k] == null) T[l][k] = M.T[l][k]; }); });
    Object.keys(M.mods).forEach(function (c) { if (!MODS[c]) MODS[c] = []; M.mods[c].forEach(function (m) { MODS[c].push(m); MOD_NAME[m[0]] = m[0]; }); });
    OPTIONAL = M.optional || {};
  })();
  /* ---------- mapa y página ---------- */
  function mapSvg(cfg, r) {
    var M = window[cfg.map]; if (!M) return '';
    var R = window.DehesaRegionMetrics;
    return (R ? R.selectHtml(ST.c, lang(), 'rg-metric', '') : '') + '<svg id="rg-svg" viewBox="' + M.viewBox + '" role="group" aria-label="' + esc(tt().mapAlt) + '" style="width:100%;height:auto;display:block">' + M.states.map(function (s) { var on = s.id === r, name = nm(cfg, s.id); return '<a href="region.html?c=' + ST.c + '&amp;r=' + s.id + '"><path d="' + s.d + '" fill="' + (on ? '#2f6b4a' : '#cfd8cc') + '" stroke="#fff" stroke-width="1" style="cursor:pointer"><title>' + esc(name) + '</title></path></a>'; }).join('') + '</svg><div id="rg-legend"></div>';
  }
  function bindMetric() {
    var R = window.DehesaRegionMetrics, sel = document.getElementById('rg-metric'), svg = document.getElementById('rg-svg'), lg = document.getElementById('rg-legend'); if (!R || !sel || !svg || !lg) return;
    sel.onchange = function () { R.paint(svg, ST.c, sel.value, lang(), ST.r).then(function (h) { lg.innerHTML = h; }); };
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
    if (cr) { var HP = { es: ['Inicio', 'Países'], en: ['Home', 'Countries'], fr: ['Accueil', 'Pays'], it: ['Home', 'Paesi'] }[lang()] || ['Inicio', 'Países'], F = window.DehesaShared && window.DehesaShared.frame; if (F) F.crumbs(cr, [[HP[0], 'index.html'], [HP[1], 'paises.html'], [cfg.country[li()], cfg.profile], [known ? nm(cfg, ST.r) : cfg.kinds[li()], null]]); }
    if (h1) h1.textContent = known ? nm(cfg, ST.r) : cfg.kinds[li()].charAt(0).toUpperCase() + cfg.kinds[li()].slice(1); if (sub) sub.textContent = t.sub;
    document.title = (known ? nm(cfg, ST.r) + ' · ' + cfg.country[li()] : cfg.country[li()]) + ' | Dehesa Index';
    var side = '<div class="di-card" style="padding:12px 14px"><label style="font-size:13px;display:block;margin-bottom:8px">' + esc(cfg.kind[li()]) + '<br><select id="rg-sel" class="di-compare-select"><option value="">' + esc(t.pick) + '…</option>' + ids.map(function (i) { return '<option value="' + i + '"' + (i === ST.r ? ' selected' : '') + '>' + esc(nm(cfg, i)) + '</option>'; }).join('') + '</select></label>' + mapSvg(cfg, ST.r) + '</div>';
    if (!known) { root.innerHTML = side; bind(); return; }
    root.innerHTML = '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start"><div style="flex:1 1 300px;max-width:420px;position:sticky;top:12px">' + side + '</div><div id="rg-main" style="flex:2 1 420px;min-width:0"><p class="di-movers-hint">' + esc(t.loading) + '</p></div></div>';
    bind(); bindMetric(); var my = ++seq, x = { c: ST.c, r: ST.r };
    Promise.all(MODS[ST.c].map(function (m) { return m[1](x).catch(function () { return null; }); })).then(function (out) {
      if (my !== seq) return; var el = document.getElementById('rg-main'); if (!el) return; var miss = [];
      // vista por sector (js/sector.js): lo de la otra vista se pliega al final, no se borra; lo común se ve siempre
      var SEC = window.DehesaSector, toc = [], tocA = [], tocB = [], main = [], folded = [], first = [];
      out.forEach(function (h, i) { var k = MODS[ST.c][i][0]; if (!h) { if (!OPTIONAL[k]) miss.push(t[MOD_NAME[k]]); return; }
        var blk = '<div id="rg-' + k + '" class="rg-blk">' + h + '</div>', sec = SEC ? SEC.ofModule(k) : 'common';
        if (SEC && !SEC.visible(sec)) { folded.push(blk); return; }
        var lead = SEC && SEC.get() !== 'all' && sec !== 'common', a = '<a href="#rg-' + k + '">' + esc(t[MOD_NAME[k]] || k) + '</a>'; (lead ? first : main).push(blk); (lead ? tocA : tocB).push(a); });
      toc = tocA.concat(tocB);
      var html = (SEC ? '<div id="rg-sector">' + SEC.barHtml() + '</div>' : '') + (toc.length > 1 ? '<nav class="rg-toc" aria-label="' + esc(t.toc || '') + '"><span>' + esc(t.toc || '') + '</span>' + toc.join('') + '</nav>' : '') + first.join('') + main.join('') + (folded.length ? SEC.foldHtml(folded.length, folded.join('')) : '');
      if (miss.length) html += '<section class="di-card" style="padding:14px 18px;margin-top:14px"><b>' + esc(t.missing) + '</b><p class="di-movers-hint" style="margin:6px 0 0">' + esc(t.missingHint) + ' ' + esc(miss.join(', ')) + '.</p></section>';
      html += staticLinks();
      el.innerHTML = html;
      if (SEC) SEC.bind(document.getElementById('rg-sector'), function () { render(); });
    });
  }
  var SL = { es: ['Resumen fijo de ', 'Todas las regiones: '], en: ['Fixed summary page for ', 'All regions: '], fr: ['Page de synthèse de ', 'Toutes les régions : '], it: ['Pagina di sintesi di ', 'Tutte le regioni: '] };
  function staticLinks() {
    var U = window.DehesaRegionUrls; if (!U) return ''; var l = lang(), a = U.page(ST.c, ST.r, l), h = U.hub(ST.c, l), cfg = C[ST.c], v = SL[l] || SL.es; if (!a) return '';
    return '<p class="di-movers-hint" style="margin-top:14px"><a href="' + a + '">' + esc(v[0] + nm(cfg, ST.r)) + '</a> · <a href="' + h + '">' + esc(v[1] + cfg.country[li()]) + '</a></p>';
  }
  function bind() { var s = document.getElementById('rg-sel'); if (s) s.onchange = function () { if (!s.value) return; ST.r = s.value; try { history.pushState(null, '', 'region.html?c=' + ST.c + '&r=' + ST.r); } catch (e) {} render(); }; }
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  window.addEventListener('popstate', function () { var s = location.search; var m = /[?&]c=([A-Za-z]+)/.exec(s), r = /[?&]r=([A-Za-z]+)/.exec(s); ST.c = m ? m[1].toUpperCase() : 'US'; ST.r = r ? r[1].toUpperCase() : ''; render(); });
  Promise.all([window.DICite ? window.DICite.load().catch(function () {}) : Promise.resolve()]).then(render, render);
})();
