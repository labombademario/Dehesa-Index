/* Dehesa Index — Croacia: estadística agraria del DZS (cultivos, ganado, leche, índices de precios agrarios, balances).
   data/hr-dzs/{crops,livestock,dairy,prices,balance}.json (scripts/update-hr-dzs.py). Bloque de la ficha de Croacia. ES5. window.DIHrDzs. Usa window.ESUI (js/es-ui.js). */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Estadística agraria de Croacia (DZS)', tabs: { crops: 'Cultivos por región', live: 'Ganado y producción animal', dairy: 'Lácteos', prices: 'Precios agrarios', bal: 'Balances y abonos' },
      item: 'Producto', meas: 'Medida', year: 'Año', mA: 'Superficie (ha)', mP: 'Producción (t)', mY: 'Rendimiento (t/ha)', national: 'Total nacional', yoy: 'Frente al año anterior', top: 'Región con más', share: 'del total', hist: 'Evolución nacional',
      gField: 'Cultivos de campo', gVeg: 'Hortalizas', gFruit: 'Frutales, uva y olivo', gOther: 'Aceite y vino', byReg: 'Por región estadística', headCount: 'cabezas', species: 'Especie o producto', gLive: 'Ganado (cabezas a 31 de diciembre)', gProd: 'Producción animal',
      series: 'Serie', groupM: 'Tabla', gMilk: 'Leche recogida en lecherías (t)', gFresh: 'Productos frescos (t)', gOtherD: 'Mantequilla, quesos y suero (t)', latest: 'Último dato', period: 'Trimestre', annual: 'Año completo', idx: 'Índice (2020 = 100)',
      out: 'Producto (lo que cobra el agricultor)', inp: 'Insumos (lo que paga)', all: 'Todas las categorías, por variación anual', balT: 'Balance', balV: 'Concepto', fert: 'Abonos minerales (t de materia activa)', n: 'Nitrógeno', p: 'Fósforo', nodata: 'Sin dato publicado',
      nCrops: 'Encuesta agraria anual del DZS. Croacia solo publica el detalle por 4 regiones estadísticas (no hay provincias). El rendimiento es el publicado por el DZS; una celda vacía es dato no publicado.',
      nLive: 'Encuesta ganadera anual del DZS. Hasta 2020 el DZS usaba otra clasificación regional y de categorías: la serie nacional se enlaza en 2021 y puede tener un salto metodológico.',
      nDairy: 'Leche recogida y productos elaborados en las lecherías croatas (DZS), en toneladas.', nPrices: 'Índices de precios agrarios del DZS, base 2020 = 100, trimestrales. Producto: lo que cobra el agricultor; insumos: lo que paga. No es el precio del consumidor.',
      nBal: 'Balances anuales del DZS en miles de toneladas y consumo de abonos minerales. El último año de los balances va un año por detrás de la producción.', src: 'Fuente:' },
    en: { h: 'Croatia agricultural statistics (DZS)', tabs: { crops: 'Crops by region', live: 'Livestock and animal output', dairy: 'Dairy', prices: 'Farm prices', bal: 'Balances and fertiliser' },
      item: 'Product', meas: 'Measure', year: 'Year', mA: 'Area (ha)', mP: 'Production (t)', mY: 'Yield (t/ha)', national: 'National total', yoy: 'Versus previous year', top: 'Largest region', share: 'of the total', hist: 'National trend',
      gField: 'Field crops', gVeg: 'Vegetables', gFruit: 'Fruit, grapes and olives', gOther: 'Oil and wine', byReg: 'By statistical region', headCount: 'head', species: 'Species or product', gLive: 'Livestock (head on 31 December)', gProd: 'Animal output',
      series: 'Series', groupM: 'Table', gMilk: 'Milk collected in dairies (t)', gFresh: 'Fresh products (t)', gOtherD: 'Butter, cheese and whey (t)', latest: 'Latest', period: 'Quarter', annual: 'Full year', idx: 'Index (2020 = 100)',
      out: 'Output (what the farmer is paid)', inp: 'Inputs (what the farmer pays)', all: 'All categories, ranked by annual change', balT: 'Balance', balV: 'Item', fert: 'Mineral fertiliser (t of active substance)', n: 'Nitrogen', p: 'Phosphorus', nodata: 'No published figure',
      nCrops: 'DZS annual agricultural survey. Croatia only publishes detail for its 4 statistical regions (no counties). Yield is as published by DZS; an empty cell means the figure is not published.',
      nLive: 'DZS annual livestock survey. Until 2020 DZS used a different regional and category classification: the national series is spliced at 2021 and may show a methodological jump.',
      nDairy: 'Milk collected and products made in Croatian dairies (DZS), in tonnes.', nPrices: 'DZS agricultural price indices, 2020 = 100, quarterly. Output: what the farmer is paid; inputs: what the farmer pays. It is not the consumer price.',
      nBal: 'DZS annual balance sheets in thousand tonnes and mineral fertiliser use. The latest balance year lags production by a year.', src: 'Source:' },
    fr: { h: 'Statistiques agricoles de la Croatie (DZS)', tabs: { crops: 'Cultures par région', live: 'Élevage et production animale', dairy: 'Produits laitiers', prices: 'Prix agricoles', bal: 'Bilans et engrais' },
      item: 'Produit', meas: 'Mesure', year: 'Année', mA: 'Surface (ha)', mP: 'Production (t)', mY: 'Rendement (t/ha)', national: 'Total national', yoy: 'Par rapport à l’an dernier', top: 'Première région', share: 'du total', hist: 'Évolution nationale',
      gField: 'Grandes cultures', gVeg: 'Légumes', gFruit: 'Fruits, raisin et olives', gOther: 'Huile et vin', byReg: 'Par région statistique', headCount: 'têtes', species: 'Espèce ou produit', gLive: 'Cheptel (têtes au 31 décembre)', gProd: 'Production animale',
      series: 'Série', groupM: 'Tableau', gMilk: 'Lait collecté en laiteries (t)', gFresh: 'Produits frais (t)', gOtherD: 'Beurre, fromages et petit-lait (t)', latest: 'Dernier chiffre', period: 'Trimestre', annual: 'Année complète', idx: 'Indice (2020 = 100)',
      out: 'Produits (ce que touche l’agriculteur)', inp: 'Intrants (ce qu’il paie)', all: 'Toutes les catégories, par variation annuelle', balT: 'Bilan', balV: 'Poste', fert: 'Engrais minéraux (t de matière active)', n: 'Azote', p: 'Phosphore', nodata: 'Pas de chiffre publié',
      nCrops: 'Enquête agricole annuelle du DZS. La Croatie ne publie le détail que pour 4 régions statistiques (pas de comitats). Le rendement est celui publié par le DZS ; une case vide signifie chiffre non publié.',
      nLive: 'Enquête annuelle sur l’élevage du DZS. Jusqu’en 2020 le DZS utilisait une autre classification régionale et par catégories : la série nationale est raccordée en 2021 et peut présenter une rupture méthodologique.',
      nDairy: 'Lait collecté et produits fabriqués dans les laiteries croates (DZS), en tonnes.', nPrices: 'Indices de prix agricoles du DZS, base 2020 = 100, trimestriels. Produits : ce que touche l’agriculteur ; intrants : ce qu’il paie. Ce n’est pas le prix au consommateur.',
      nBal: 'Bilans annuels du DZS en milliers de tonnes et consommation d’engrais minéraux. La dernière année des bilans a un an de retard sur la production.', src: 'Source :' },
    it: { h: 'Statistiche agricole della Croazia (DZS)', tabs: { crops: 'Colture per regione', live: 'Allevamento e produzione animale', dairy: 'Lattiero-caseari', prices: 'Prezzi agricoli', bal: 'Bilanci e fertilizzanti' },
      item: 'Prodotto', meas: 'Misura', year: 'Anno', mA: 'Superficie (ha)', mP: 'Produzione (t)', mY: 'Resa (t/ha)', national: 'Totale nazionale', yoy: 'Rispetto all’anno prima', top: 'Regione maggiore', share: 'del totale', hist: 'Andamento nazionale',
      gField: 'Seminativi', gVeg: 'Ortaggi', gFruit: 'Frutta, uva e olive', gOther: 'Olio e vino', byReg: 'Per regione statistica', headCount: 'capi', species: 'Specie o prodotto', gLive: 'Bestiame (capi al 31 dicembre)', gProd: 'Produzione animale',
      series: 'Serie', groupM: 'Tabella', gMilk: 'Latte raccolto nei caseifici (t)', gFresh: 'Prodotti freschi (t)', gOtherD: 'Burro, formaggi e siero (t)', latest: 'Ultimo dato', period: 'Trimestre', annual: 'Anno intero', idx: 'Indice (2020 = 100)',
      out: 'Prodotti (quanto incassa l’agricoltore)', inp: 'Input (quanto paga)', all: 'Tutte le categorie, per variazione annua', balT: 'Bilancio', balV: 'Voce', fert: 'Fertilizzanti minerali (t di sostanza attiva)', n: 'Azoto', p: 'Fosforo', nodata: 'Dato non pubblicato',
      nCrops: 'Indagine agraria annuale del DZS. La Croazia pubblica il dettaglio solo per 4 regioni statistiche (non ci sono contee). La resa è quella pubblicata dal DZS; una cella vuota è un dato non pubblicato.',
      nLive: 'Indagine zootecnica annuale del DZS. Fino al 2020 il DZS usava un’altra classificazione regionale e per categorie: la serie nazionale è raccordata nel 2021 e può avere un salto metodologico.',
      nDairy: 'Latte raccolto e prodotti fabbricati nei caseifici croati (DZS), in tonnellate.', nPrices: 'Indici dei prezzi agricoli del DZS, base 2020 = 100, trimestrali. Prodotti: quanto incassa l’agricoltore; input: quanto paga. Non è il prezzo al consumo.',
      nBal: 'Bilanci annuali del DZS in migliaia di tonnellate e consumo di fertilizzanti minerali. L’ultimo anno dei bilanci ha un anno di ritardo sulla produzione.', src: 'Fonte:' }
  };
  /* nombres de regiones y de productos (en|es|fr|it); lo que no figura aquí se muestra con el nombre inglés del DZS sin su número */
  var N = {
    'Republic of Croatia': 'Croatia|Croacia|Croatie|Croazia', Total: 'Croatia|Croacia|Croatie|Croazia', 'Pannonian Croatia': 'Pannonian Croatia|Croacia Panónica|Croatie pannonienne|Croazia Pannonica', 'Adriatic Croatia': 'Adriatic Croatia|Croacia Adriática|Croatie adriatique|Croazia Adriatica',
    'City of Zagreb': 'City of Zagreb|Ciudad de Zagreb|Ville de Zagreb|Città di Zagabria', 'North Croatia': 'North Croatia|Croacia del Norte|Croatie du Nord|Croazia del Nord',
    'Wheat': 'Wheat|Trigo|Blé|Frumento', 'Soft winter wheat': 'Soft winter wheat|Trigo blando de invierno|Blé tendre d’hiver|Frumento tenero invernale', 'Durum wheat': 'Durum wheat|Trigo duro|Blé dur|Frumento duro',
    'Rye, winter and spring': 'Rye|Centeno|Seigle|Segale', 'Barley': 'Barley|Cebada|Orge|Orzo', 'Winter barley': 'Winter barley|Cebada de invierno|Orge d’hiver|Orzo invernale', 'Spring barley': 'Spring barley|Cebada de primavera|Orge de printemps|Orzo primaverile',
    'Oats': 'Oats|Avena|Avoine|Avena', 'Grain maize': 'Grain maize|Maíz grano|Maïs grain|Mais da granella', 'Rice': 'Rice|Arroz|Riz|Riso', 'Sunflower': 'Sunflower|Girasol|Tournesol|Girasole', 'Soya beans': 'Soya|Soja|Soja|Soia',
    'Rape and turnip rape': 'Rapeseed|Colza|Colza|Colza', 'Sugar beet': 'Sugar beet|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero', 'Potatoes': 'Potatoes|Patata|Pommes de terre|Patate', 'Tobacco': 'Tobacco|Tabaco|Tabac|Tabacco',
    'Apples': 'Apples|Manzana|Pommes|Mele', 'Pears': 'Pears|Pera|Poires|Pere', 'Peaches': 'Peaches|Melocotón|Pêches|Pesche', 'Plums': 'Plums|Ciruela|Prunes|Prugne', 'Cherries': 'Cherries|Cereza|Cerises|Ciliegie', 'Mandarins': 'Mandarins|Mandarina|Mandarines|Mandarini',
    'Walnuts': 'Walnuts|Nuez|Noix|Noci', 'Hazelnuts': 'Hazelnuts|Avellana|Noisettes|Nocciole', 'Almonds': 'Almonds|Almendra|Amandes|Mandorle', 'Olives, total': 'Olives|Aceituna|Olives|Olive', 'Grapes, total': 'Grapes|Uva|Raisin|Uva',
    'Tomatoes': 'Tomatoes|Tomate|Tomates|Pomodori', 'Onions': 'Onions|Cebolla|Oignons|Cipolle', 'Cabbage (white and red)': 'Cabbage|Col|Chou|Cavolo', 'Carrots': 'Carrots|Zanahoria|Carottes|Carote',
    'Olive oil': 'Olive oil|Aceite de oliva|Huile d’olive|Olio d’oliva', Wine: 'Wine|Vino|Vin|Vino',
    cattle: 'Cattle|Vacuno|Bovins|Bovini', pigs: 'Pigs|Porcino|Porcins|Suini', sheep: 'Sheep|Ovino|Ovins|Ovini', goats: 'Goats|Caprino|Caprins|Caprini', poultry: 'Poultry|Aves de corral|Volailles|Pollame',
    milk0: 'Cows’ milk|Leche de vaca|Lait de vache|Latte vaccino', milk1: 'Sheep’s milk|Leche de oveja|Lait de brebis|Latte ovino', milk2: 'Goats’ milk|Leche de cabra|Lait de chèvre|Latte caprino',
    eggs: 'Eggs|Huevos|Œufs|Uova', honey: 'Honey|Miel|Miel|Miele', wool: 'Wool|Lana|Laine|Lana',
    '1. Cow milk': 'Cow milk|Leche de vaca|Lait de vache|Latte vaccino', '2. Sheep milk': 'Sheep milk|Leche de oveja|Lait de brebis|Latte ovino', '3. Goat milk': 'Goat milk|Leche de cabra|Lait de chèvre|Latte caprino',
    '1. Butter': 'Butter|Mantequilla|Beurre|Burro', '13. Whey': 'Whey|Suero|Petit-lait|Siero', '11. Fresh cheese': 'Fresh cheese|Queso fresco|Fromage frais|Formaggio fresco', '12. Processed cheese': 'Processed cheese|Queso fundido|Fromage fondu|Formaggio fuso',
    '2. Cheese from cows\'milk (pure)': 'Cow cheese|Queso de vaca|Fromage de vache|Formaggio vaccino', '3. Cheese from ewes milk (pure)': 'Ewe cheese|Queso de oveja|Fromage de brebis|Formaggio ovino', '4. Cheese from goats milk (pure)': 'Goat cheese|Queso de cabra|Fromage de chèvre|Formaggio caprino',
    'AGRICULTURAL GOODS OUTPUT, including fruits and vegetables (TOTAL)': 'Agricultural output, total|Producción agraria total|Production agricole totale|Produzione agricola totale', 'CROP OUTPUT, including fruits and vegetables': 'Crop output|Producción vegetal|Production végétale|Produzione vegetale',
    CEREALS: 'Cereals|Cereales|Céréales|Cereali', 'INDUSTRIAL PLANTS': 'Industrial crops|Cultivos industriales|Cultures industrielles|Colture industriali', Milk: 'Milk|Leche|Lait|Latte', 'Consumer eggs': 'Eggs|Huevos|Œufs|Uova',
    'GOODS AND SERVICES CURRENTLY CONSUMED IN AGRICULTURE (INPUT I)': 'Goods and services consumed|Bienes y servicios consumidos|Biens et services consommés|Beni e servizi consumati', 'Energy; lubricants': 'Energy and lubricants|Energía y lubricantes|Énergie et lubrifiants|Energia e lubrificanti',
    'Fertilisers and soil improvers': 'Fertilisers|Fertilizantes|Engrais|Fertilizzanti', 'Seeds and planting stock': 'Seeds|Semillas|Semences|Sementi', 'Animal feeding stuffs': 'Animal feed|Piensos|Aliments pour animaux|Mangimi', 'INPUT TOTAL (INPUT I + INPUT II)': 'All inputs|Todos los insumos|Tous les intrants|Tutti gli input',
    'Soft spring wheat': 'Soft spring wheat|Trigo blando de primavera|Blé tendre de printemps|Frumento tenero primaverile',
    'Triticale': 'Triticale|Triticale|Triticale|Triticale',
    'Other cereals (sorghum, millet, buckwheat, spelt and etc.)': 'Other cereals (sorghum, millet, buckwheat, spelt and etc.)|Otros cereales (sorgo, mijo, trigo sarraceno, espelta…)|Autres céréales (sorgho, millet, sarrasin, épeautre…)|Altri cereali (sorgo, miglio, grano saraceno, farro…)',
    'Peas, dry grain': 'Peas, dry grain|Guisantes secos|Pois secs|Piselli secchi',
    'Fodder peas': 'Fodder peas|Guisantes forrajeros|Pois fourragers|Piselli da foraggio',
    'Beans, dry grain': 'Beans, dry grain|Judías secas|Haricots secs|Fagioli secchi',
    'Other dried pulses': 'Other dried pulses|Otras legumbres secas|Autres légumes secs|Altri legumi secchi',
    'Potatoes, early': 'Potatoes, early|Patata temprana|Pommes de terre primeurs|Patate precoci',
    'Potatoes, late and seed': 'Potatoes, late and seed|Patata tardía y de siembra|Pommes de terre tardives et de semence|Patate tardive e da seme',
    'Sugar beet (excluding seed)': 'Sugar beet (excluding seed)|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero',
    'Fodder beet': 'Fodder beet|Remolacha forrajera|Betterave fourragère|Barbabietola da foraggio',
    'Other root crops n. e. c.': 'Other root crops n. e. c.|Otras raíces y tubérculos|Autres racines et tubercules|Altre radici e tuberi',
    'Fodder kale': 'Fodder kale|Col forrajera|Chou fourrager|Cavolo da foraggio',
    'Rapeseed': 'Rapeseed|Colza|Colza|Colza',
    'Sunflower seed': 'Sunflower seed|Girasol|Tournesol|Girasole',
    'Other oil seeds': 'Other oil seeds|Otras oleaginosas|Autres oléagineux|Altre oleaginose',
    'Other industrial crops': 'Other industrial crops|Otros cultivos industriales|Autres cultures industrielles|Altre colture industriali',
    'Aromatic and medicinal herbs, spices': 'Aromatic and medicinal herbs, spices|Hierbas aromáticas, medicinales y especias|Plantes aromatiques, médicinales et épices|Erbe aromatiche, medicinali e spezie',
    'Green maize': 'Green maize|Maíz forrajero|Maïs fourrager|Mais da foraggio',
    'Green maize - main crop': 'Green maize - main crop|Maíz forrajero, cultivo principal|Maïs fourrager, culture principale|Mais da foraggio, coltura principale',
    'Green maize - subsequent crops': 'Green maize - subsequent crops|Maíz forrajero, cultivo sucesivo|Maïs fourrager, culture dérobée|Mais da foraggio, coltura successiva',
    'Other annual green fodder': 'Other annual green fodder|Otros forrajes verdes anuales|Autres fourrages verts annuels|Altri foraggi verdi annuali',
    'Clover and mixtures': 'Clover and mixtures|Trébol y mezclas|Trèfle et mélanges|Trifoglio e miscugli',
    'Lucerne': 'Lucerne|Alfalfa|Luzerne|Erba medica',
    'Other leguminous plants harvested green': 'Other leguminous plants harvested green|Otras leguminosas segadas en verde|Autres légumineuses récoltées en vert|Altre leguminose raccolte in verde',
    'Temporary grasses and grazings': 'Temporary grasses and grazings|Praderas temporales|Prairies temporaires|Prati temporanei',
    'Permanent grassland': 'Permanent grassland|Pastos permanentes|Prairies permanentes|Prati permanenti',
    'Meadows': 'Meadows|Prados|Prés de fauche|Prati',
    'Pastures': 'Pastures|Pastizales|Pâturages|Pascoli',
    'Intensive pastures': 'Intensive pastures|Pastizales intensivos|Pâturages intensifs|Pascoli intensivi',
    'Exstensive pastures': 'Exstensive pastures|Pastizales extensivos|Pâturages extensifs|Pascoli estensivi',
    'Total fresh vegetables': 'Total fresh vegetables|Total de hortalizas frescas|Total légumes frais|Totale ortaggi freschi',
    'Cauliflower and broccoli': 'Cauliflower and broccoli|Coliflor y brócoli|Chou-fleur et brocoli|Cavolfiore e broccoli',
    'Other brassicas': 'Other brassicas|Otras coles|Autres choux|Altri cavoli',
    'Leeks': 'Leeks|Puerro|Poireaux|Porri',
    'Lettuce': 'Lettuce|Lechuga|Laitue|Lattuga',
    'Lettuces under glass or high accessible cover': 'Lettuces under glass or high accessible cover|Lechuga bajo cubierta|Laitue sous abri|Lattuga in serra',
    'Other leafy or stalked vegetables': 'Other leafy or stalked vegetables|Otras hortalizas de hoja o tallo|Autres légumes feuilles ou tiges|Altri ortaggi a foglia o stelo',
    'Tomatoes for fresh consumption': 'Tomatoes for fresh consumption|Tomate para consumo en fresco|Tomates de consommation fraîche|Pomodori da consumo fresco',
    'Tomatoes under glass or high accessible cover': 'Tomatoes under glass or high accessible cover|Tomate bajo cubierta|Tomates sous abri|Pomodori in serra',
    'Cucumbers and gherkins': 'Cucumbers and gherkins|Pepino y pepinillo|Concombres et cornichons|Cetrioli e cetriolini',
    'Cucumbers and gherkins under glass or high accessible cover': 'Cucumbers and gherkins under glass or high accessible cover|Pepino bajo cubierta|Concombres sous abri|Cetrioli in serra',
    'Melons': 'Melons|Melón|Melons|Meloni',
    'Watermelons': 'Watermelons|Sandía|Pastèques|Cocomeri',
    'Red peppers, capsicum': 'Red peppers, capsicum|Pimiento|Poivrons|Peperoni',
    'Red peppers, capsicum under glass or high accessible cover': 'Red peppers, capsicum under glass or high accessible cover|Pimiento bajo cubierta|Poivrons sous abri|Peperoni in serra',
    'Other vegetables cultivated for fruit': 'Other vegetables cultivated for fruit|Otras hortalizas de fruto|Autres légumes-fruits|Altri ortaggi da frutto',
    'Onions and garlic': 'Onions and garlic|Cebolla y ajo|Oignons et ail|Cipolle e aglio',
    'Beetroot': 'Beetroot|Remolacha de mesa|Betterave rouge|Barbabietola rossa',
    'Other root and tuber vegetables': 'Other root and tuber vegetables|Otras raíces y tubérculos hortícolas|Autres légumes racines et tubercules|Altri ortaggi a radice e tubero',
    'Green peas': 'Green peas|Guisantes verdes|Petits pois|Piselli freschi',
    'Green beans': 'Green beans|Judías verdes|Haricots verts|Fagiolini',
    'Fresh vegetables (kitchen gardens)': 'Fresh vegetables (kitchen gardens)|Hortalizas frescas (huertos familiares)|Légumes frais (jardins familiaux)|Ortaggi freschi (orti familiari)',
    'Total fruits': 'Total fruits|Total de frutas|Total fruits|Totale frutta',
    'Peaches and nectarines': 'Peaches and nectarines|Melocotón y nectarina|Pêches et nectarines|Pesche e nettarine',
    'Nectarines': 'Nectarines|Nectarina|Nectarines|Nettarine',
    'Apricots': 'Apricots|Albaricoque|Abricots|Albicocche',
    'Cherries including sour cherries': 'Cherries including sour cherries|Cereza y guinda|Cerises et griottes|Ciliegie e amarene',
    'Sweet cherries': 'Sweet cherries|Cereza dulce|Cerises douces|Ciliegie dolci',
    'Sour cherries': 'Sour cherries|Guinda|Griottes|Amarene',
    'Figs': 'Figs|Higo|Figues|Fichi',
    'Strawberries': 'Strawberries|Fresa|Fraises|Fragole',
    'Berries fruits, excluding strawberries': 'Berries fruits, excluding strawberries|Frutos del bosque (sin fresa)|Petits fruits (hors fraise)|Frutti di bosco (senza fragole)',
    'Oranges': 'Oranges|Naranja|Oranges|Arance',
    'Lemons': 'Lemons|Limón|Citrons|Limoni',
    'Fresh fruit (kitchen gardens)': 'Fresh fruit (kitchen gardens)|Fruta fresca (huertos familiares)|Fruits frais (jardins familiaux)|Frutta fresca (orti familiari)',
    'Ray and meslin': 'Ray and meslin|Centeno y morcajo|Seigle et méteil|Segale e frumento segalato',
    'Oats and mixed grains': 'Oats and mixed grains|Avena y cereales mixtos|Avoine et céréales mélangées|Avena e cereali misti',
    'Maize grain': 'Maize grain|Maíz grano|Maïs grain|Mais da granella',
    'Other cereals': 'Other cereals|Otros cereales|Autres céréales|Altri cereali',
    'Paddy rice': 'Paddy rice|Arroz cáscara|Riz paddy|Riso risone',
    'Husked rice': 'Husked rice|Arroz cargo|Riz décortiqué|Riso semigreggio',
    'Milled rice': 'Milled rice|Arroz blanco|Riz usiné|Riso lavorato',
    'Sugar in white': 'Sugar in white|Azúcar blanco|Sucre blanc|Zucchero bianco',
    'Usable production': 'Usable production|Producción utilizable|Production utilisable|Produzione utilizzabile',
    'Total imports': 'Total imports|Importaciones totales|Importations totales|Importazioni totali',
    'Total exports': 'Total exports|Exportaciones totales|Exportations totales|Esportazioni totali',
    'Total domestic uses': 'Total domestic uses|Usos internos totales|Utilisations intérieures totales|Usi interni totali',
    'Human consumption': 'Human consumption|Consumo humano|Consommation humaine|Consumo umano',
    'Industrial uses': 'Industrial uses|Usos industriales|Usages industriels|Usi industriali',
    'Seeds': 'Seeds|Semillas|Semences|Sementi',
    'Animal feed': 'Animal feed|Pienso|Alimentation animale|Mangimi',
    'Losses': 'Losses|Pérdidas|Pertes|Perdite',
    'Processing': 'Processing|Transformación|Transformation|Trasformazione',
    'of which from domestic sugar beet': 'of which from domestic sugar beet|de ello, de remolacha nacional|dont de betterave nationale|di cui da barbabietola nazionale',
    'of which from imported sugar beet': 'of which from imported sugar beet|de ello, de remolacha importada|dont de betterave importée|di cui da barbabietola importata',
    'Degree of self-sufficiency (%)': 'Degree of self-sufficiency (%)|Grado de autoabastecimiento (%)|Taux d’autosuffisance (%)|Grado di autoapprovvigionamento (%)',
    'Human consumption per capita (kg)': 'Human consumption per capita (kg)|Consumo humano per cápita (kg)|Consommation humaine par habitant (kg)|Consumo umano pro capite (kg)',
    'AGRICULTURAL GOODS OUTPUT, excluding fruits and vegetables': 'AGRICULTURAL GOODS OUTPUT, excluding fruits and vegetables|Producción agraria sin frutas ni hortalizas|Production agricole hors fruits et légumes|Produzione agricola senza frutta e ortaggi',
    'CROP OUTPUT, excluding fruits and vegetables': 'CROP OUTPUT, excluding fruits and vegetables|Producción vegetal sin frutas ni hortalizas|Production végétale hors fruits et légumes|Produzione vegetale senza frutta e ortaggi',
    'FORAGE PLANTS': 'FORAGE PLANTS|Plantas forrajeras|Plantes fourragères|Piante foraggere',
    'VEGETABLES, FLOWERS AND PLANTS': 'VEGETABLES, FLOWERS AND PLANTS|Hortalizas, flores y plantas|Légumes, fleurs et plantes|Ortaggi, fiori e piante',
    'Fresh vegetables': 'Fresh vegetables|Hortalizas frescas|Légumes frais|Ortaggi freschi',
    'Flowers and plants': 'Flowers and plants|Flores y plantas|Fleurs et plantes|Fiori e piante',
    'POTATOES (including seeds)': 'POTATOES (including seeds)|Patata (con simiente)|Pommes de terre (avec plants)|Patate (con seme)',
    'FRUITS': 'FRUITS|Frutas|Fruits|Frutta',
    'WINE': 'WINE|Vino|Vin|Vino',
    'OLIVE OIL': 'OLIVE OIL|Aceite de oliva|Huile d’olive|Olio d’oliva',
    'ANIMAL OUTPUT (LIVESTOCK, POULTRY AND ANIMAL PRODUCTS OUTPUT)': 'ANIMAL OUTPUT (LIVESTOCK, POULTRY AND ANIMAL PRODUCTS OUTPUT)|Producción animal|Production animale|Produzione animale',
    'ANIMALS (LIVESTOCK AND POULTRY)': 'ANIMALS (LIVESTOCK AND POULTRY)|Animales (ganado y aves)|Animaux (bétail et volailles)|Animali (bestiame e pollame)',
    'Cattle': 'Cattle|Vacuno|Bovins|Bovini',
    'Pigs': 'Pigs|Porcino|Porcins|Suini',
    'Horses': 'Horses|Equino|Chevaux|Equini',
    'Sheep and goats': 'Sheep and goats|Ovino y caprino|Ovins et caprins|Ovini e caprini',
    'Poultry': 'Poultry|Aves|Volailles|Pollame',
    'Other animals': 'Other animals|Otros animales|Autres animaux|Altri animali',
    'ANIMAL PRODUCTS OUTPUT': 'ANIMAL PRODUCTS OUTPUT|Productos animales|Produits animaux|Prodotti animali',
    'Other animal products output (the indeks refers to the prices of honey and raw skin excluding lamb,s)': 'Other animal products output (the indeks refers to the prices of honey and raw skin excluding lamb,s)|Otros productos animales (miel y pieles)|Autres produits animaux (miel et peaux)|Altri prodotti animali (miele e pelli)',
    'Plant protection products and pesticides': 'Plant protection products and pesticides|Fitosanitarios|Produits phytosanitaires|Prodotti fitosanitari',
    'Veterinary expenses': 'Veterinary expenses|Gastos veterinarios|Frais vétérinaires|Spese veterinarie',
    'Animal feedingstuffs': 'Animal feedingstuffs|Piensos|Aliments pour animaux|Mangimi',
    'Maintenance of materials': 'Maintenance of materials|Mantenimiento de materiales|Entretien du matériel|Manutenzione dei materiali',
    'Maintenance of buildings': 'Maintenance of buildings|Mantenimiento de edificios|Entretien des bâtiments|Manutenzione degli edifici',
    'Other goods and services': 'Other goods and services|Otros bienes y servicios|Autres biens et services|Altri beni e servizi',
    'GOODS AND SERVICES CONTRIBUTING TO AGRICULTURAL INVESTMENT (INPUT II)': 'GOODS AND SERVICES CONTRIBUTING TO AGRICULTURAL INVESTMENT (INPUT II)|Bienes y servicios de inversión|Biens et services d’investissement|Beni e servizi per investimenti',
    'MATERIALS': 'MATERIALS|Materiales|Matériel|Materiali',
    'Machinery and other equipment': 'Machinery and other equipment|Maquinaria y otros equipos|Machines et autres équipements|Macchine e altre attrezzature',
    'Transport equipment': 'Transport equipment|Equipos de transporte|Matériel de transport|Mezzi di trasporto',
    'BUILDINGS': 'BUILDINGS|Edificios|Bâtiments|Edifici',
    'Farm buildings (non-residential)': 'Farm buildings (non-residential)|Edificios agrarios (no residenciales)|Bâtiments agricoles (non résidentiels)|Edifici agricoli (non residenziali)',
    'Other works except land improvements (other buildings, structures, etc.)': 'Other works except land improvements (other buildings, structures, etc.)|Otras obras (salvo mejoras del suelo)|Autres travaux (hors améliorations foncières)|Altri lavori (escluse bonifiche)'
  };
  var LG = { en: 0, es: 1, fr: 2, it: 3 };
  var U = global.ESUI, ST = { tab: 'crops', ci: 'bp2|0', cm: 'prod', cy: '', li: 'cattle', ly: '', di: 'collected', dc: '0', pk: 'output', pc: '0', bk: 'cereals', bt: '0' }, D = {};
  function clean(s) { return String(s).replace(/^\d+(\.\d+)*\.?\s+/, '').replace(/\s*\([\d\s+]+\)\s*$/, '').replace(/\s+/g, ' ').trim(); }
  function nm(raw, lg) { var k = String(raw).replace(/^\d+(\.\d+)*\.?\s+/, '').replace(/\s*\([\d\s+]+\)\s*$/, '').replace(/\s+/g, ' ').trim(), s = N[k] || N[raw] || N[clean(raw)]; if (!s) return clean(raw); var a = s.split('|'); return a[LG[lg]] || a[0]; }
  function size(t) { return t.dims.map(function (d) { return d.l.length; }); }
  function at(t, ix) { var p = 0, s = size(t), k; for (k = 0; k < s.length; k++) p = p * s[k] + (ix[k] || 0); return t.v[p]; }
  function yearAxis(t) { for (var k = 0; k < t.dims.length; k++) { var l = t.dims[k].l; if (l.length && /^\d{4}$/.test(l[0]) && /^\d{4}$/.test(l[l.length - 1])) return k; } return -1; }
  function chg(a, b) { return a != null && b ? (a / b - 1) * 100 : null; }
  function sgn(v, d) { return v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + U.nf(Math.abs(v), d == null ? 1 : d) + ' %'; }
  function col(v) { return v == null || v === 0 ? '' : v > 0 ? 'color:#2f7d4f' : 'color:#b4541a'; }
  function card(n, v, note) { return '<div class="di-card cof-card"><div class="cof-lbl">' + n + '</div><div class="cof-val">' + v + '</div>' + (note ? '<div class="cof-note" style="margin:2px 0 0">' + note + '</div>' : '') + '</div>'; }
  function note(t, k) { return '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t[k]) + '</p>'; }
  function lastNN(t, ix, ya) { var n = t.dims[ya].l.length; for (var y = n - 1; y >= 0; y--) { var o = {}, k; for (k in ix) o[k] = ix[k]; o[ya] = y; if (at(t, o) != null) return y; } return -1; }
  function dp(x) { return x == null ? 0 : Math.abs(x) < 100 ? 1 : 0; }

  /* ---- cultivos por región: clave 'tabla|categoria' ---- */
  function cropItems(d, lg, t) {
    var out = '', grp = [['bp2', t.gField], ['bp3', t.gVeg], ['bp4', t.gFruit]];
    grp.forEach(function (g) {
      var tb = d.tables[g[0]]; if (!tb) return;
      out += '<optgroup label="' + U.esc(g[1]) + '">' + tb.dims[0].l.map(function (l, i) { return /^\d+\s+/.test(l) && !/^\d+\s+Total/.test(l) ? U.opt(g[0] + '|' + i, nm(l, lg), ST.ci) : ''; }).join('') + '</optgroup>';
    });
    var oth = ''; if (d.tables.bp5) oth += U.opt('bp5|0', nm('Olive oil', lg), ST.ci); if (d.tables.bp6) oth += U.opt('bp6|0', nm('Wine', lg), ST.ci);
    return oth ? out + '<optgroup label="' + U.esc(t.gOther) + '">' + oth + '</optgroup>' : out;
  }
  function cropsView(d, lg, t) {
    var p = ST.ci.split('|'), tb = d.tables[p[0]]; if (!tb) { ST.ci = 'bp2|0'; p = ST.ci.split('|'); tb = d.tables.bp2; }
    var c = +p[1], ya = yearAxis(tb), ys = tb.dims[ya].l, special = p[0] === 'bp5' || p[0] === 'bp6', ri = 2, vi = special ? -1 : 3;
    if (ST.cy === '' || ys.indexOf(ST.cy) < 0) ST.cy = ys[ys.length - 1];
    var yi = ys.indexOf(ST.cy), ms = special ? { prod: 0 } : { area: 0, prod: 1, yld: 2 };
    if (ms[ST.cm] == null) ST.cm = 'prod';
    var unit = special ? (p[0] === 'bp5' ? 'hl' : '000 hl') : (ST.cm === 'area' ? 'ha' : ST.cm === 'yld' ? 't/ha' : 't');
    function v(r, y) { var ix = {}; ix[0] = c; ix[ya] = y; ix[ri] = r; if (vi >= 0) ix[vi] = ms[ST.cm]; return at(tb, ix); }
    var out = U.sel('hr-ci', t.item, cropItems(d, lg, t), ST.ci);
    if (!special) out += U.sel('hr-cm', t.meas, U.opt('prod', t.mP, ST.cm) + U.opt('area', t.mA, ST.cm) + U.opt('yld', t.mY, ST.cm), ST.cm);
    out += U.sel('hr-cy', t.year, ys.slice().reverse().map(function (y) { return U.opt(y, y, ST.cy); }).join(''), ST.cy);
    var tot = v(0, yi), prev = yi > 0 ? v(0, yi - 1) : null, regs = tb.dims[ri].l, list = [];
    for (var r = 1; r < regs.length; r++) { var x = v(r, yi); if (x != null) list.push([nm(regs[r], lg), x, tot && ST.cm !== 'yld' ? U.nf(x / tot * 100, 1) + ' %' : '']); }
    list.sort(function (a, b) { return b[1] - a[1]; });
    var dc = ST.cm === 'yld' ? 1 : dp(tot);
    if (tot == null) return out + '<p class="cof-note">' + U.esc(t.nodata) + '</p>' + note(t, 'nCrops');
    var cards = card(U.esc(t.national + ' · ' + ST.cy), U.nf(tot, dc) + ' ' + U.esc(unit), U.esc(nm(tb.dims[0].l[c], lg))) + card(U.esc(t.yoy), '<span style="' + col(chg(tot, prev)) + '">' + sgn(chg(tot, prev)) + '</span>');
    if (list.length && ST.cm !== 'yld') cards += card(U.esc(t.top), U.esc(list[0][0]), U.nf(list[0][1] / tot * 100, 1) + ' % ' + U.esc(t.share));
    out += '<div class="cof-cards">' + cards + '</div>';
    if (list.length) out += '<h3 class="cof-h3">' + U.esc(t.byReg) + '</h3>' + U.bars(list, ST.cm === 'yld' ? list[0][1] : list[0][1] || 1, dc, unit);
    var hv = ys.map(function (y, k) { return v(0, k); });
    out += '<h3 class="cof-h3">' + U.esc(t.hist) + '</h3>' + U.chart([{ name: nm(tb.dims[0].l[c], lg), v: hv }], ys, unit, nm(tb.dims[0].l[c], lg), dc);
    return out + note(t, 'nCrops');
  }

  /* ---- ganado y producción animal ---- */
  var SPEC = ['cattle', 'pigs', 'sheep', 'goats', 'poultry'], PROD = ['milk0', 'milk1', 'milk2', 'eggs', 'honey', 'wool'];
  function liveView(d, lg, t) {
    var opts = '<optgroup label="' + U.esc(t.gLive) + '">' + SPEC.filter(function (k) { return d.tables[k]; }).map(function (k) { return U.opt(k, nm(k, lg), ST.li); }).join('') + '</optgroup>' +
      '<optgroup label="' + U.esc(t.gProd) + '">' + PROD.map(function (k) { return U.opt(k, nm(k, lg), ST.li); }).join('') + '</optgroup>';
    var out = U.sel('hr-li', t.species, opts, ST.li), isSpec = SPEC.indexOf(ST.li) >= 0;
    if (!isSpec && PROD.indexOf(ST.li) < 0) ST.li = 'cattle';
    if (isSpec) {
      var tb = d.tables[ST.li], th = d.tables[ST.li + '_h'], ya = yearAxis(tb), ys = tb.dims[ya].l, ci = tb.dims[0].l.length - 1;
      if (ST.ly === '' || ys.indexOf(ST.ly) < 0) ST.ly = ys[ys.length - 1];
      out += U.sel('hr-ly', t.year, ys.slice().reverse().map(function (y) { return U.opt(y, y, ST.ly); }).join(''), ST.ly);
      var yi = ys.indexOf(ST.ly);
      function g(r, y) { var ix = {}; ix[0] = ci; ix[ya] = y; ix[2] = r; return at(tb, ix); }
      var tot = g(0, yi), prev = yi > 0 ? g(0, yi - 1) : null, regs = tb.dims[2].l, list = [];
      for (var r = 1; r < regs.length; r++) { var x = g(r, yi); if (x != null) list.push([nm(regs[r], lg), x, tot ? U.nf(x / tot * 100, 1) + ' %' : '']); }
      list.sort(function (a, b) { return b[1] - a[1]; });
      var cards = card(U.esc(t.national + ' · ' + ST.ly), U.nf(tot, 0) + ' ' + U.esc(t.headCount), U.esc(nm(ST.li, lg))) + card(U.esc(t.yoy), '<span style="' + col(chg(tot, prev)) + '">' + sgn(chg(tot, prev)) + '</span>');
      if (list.length && tot) cards += card(U.esc(t.top), U.esc(list[0][0]), U.nf(list[0][1] / tot * 100, 1) + ' % ' + U.esc(t.share));
      out += '<div class="cof-cards">' + cards + '</div>';
      if (list.length) out += '<h3 class="cof-h3">' + U.esc(t.byReg) + '</h3>' + U.bars(list, list[0][1] || 1, 0, t.headCount);
      var labs = [], vals = [];
      if (th) { var hy = yearAxis(th), hl = th.dims[hy].l, hc = th.dims[0].l.length - 1; hl.forEach(function (y, k) { var ix = {}; ix[0] = hc; ix[hy] = k; ix[1 + (hy === 1 ? 1 : 0)] = 0; labs.push(y); vals.push(at(th, ix)); }); }
      ys.forEach(function (y, k) { labs.push(y); vals.push(g(0, k)); });
      out += '<h3 class="cof-h3">' + U.esc(t.hist) + '</h3>' + U.chart([{ name: nm(ST.li, lg), v: vals }], labs, t.headCount, nm(ST.li, lg), 0);
      return out + note(t, 'nLive');
    }
    var key = ST.li.indexOf('milk') === 0 ? 'milk' : ST.li, tp = d.tables[key], pa = yearAxis(tp), pl = tp.dims[pa].l, sp = ST.li.indexOf('milk') === 0 ? +ST.li.slice(4) : 0;
    var pv = pl.map(function (y, k) { var ix = {}; ix[pa] = k; if (pa === 1) ix[0] = sp; return at(tp, ix); }), i = pv.length - 1; while (i > 0 && pv[i] == null) i--;
    var un = key === 'milk' ? '000 l' : key === 'eggs' ? '000' : 't';
    out += '<div class="cof-cards">' + card(U.esc(t.latest + ' · ' + pl[i]), U.nf(pv[i], 0) + ' ' + U.esc(un), U.esc(nm(ST.li, lg))) + card(U.esc(t.yoy), '<span style="' + col(chg(pv[i], pv[i - 1])) + '">' + sgn(chg(pv[i], pv[i - 1])) + '</span>') + '</div>';
    out += '<h3 class="cof-h3">' + U.esc(t.hist) + '</h3>' + U.chart([{ name: nm(ST.li, lg), v: pv }], pl, un, nm(ST.li, lg), 0);
    return out + note(t, 'nLive');
  }

  /* ---- lácteos ---- */
  function dairyView(d, lg, t) {
    var G = { collected: t.gMilk, fresh: t.gFresh, products: t.gOtherD }, tb;
    if (!d.tables[ST.di]) ST.di = 'collected';
    tb = d.tables[ST.di];
    var out = U.sel('hr-di', t.groupM, Object.keys(G).map(function (k) { return U.opt(k, G[k], ST.di); }).join(''), ST.di);
    if (+ST.dc >= tb.dims[0].l.length) ST.dc = '0';
    out += U.sel('hr-dc', t.item, tb.dims[0].l.map(function (l, i) { return U.opt(i, nm(l, lg), ST.dc); }).join(''), ST.dc);
    var ya = yearAxis(tb), ys = tb.dims[ya].l, c = +ST.dc, vals = ys.map(function (y, k) { var ix = {}; ix[0] = c; ix[ya] = k; return at(tb, ix); }), i = vals.length - 1; while (i > 0 && vals[i] == null) i--;
    out += '<div class="cof-cards">' + card(U.esc(t.latest + ' · ' + ys[i]), U.nf(vals[i], 0) + ' t', U.esc(nm(tb.dims[0].l[c], lg))) + card(U.esc(t.yoy), '<span style="' + col(chg(vals[i], vals[i - 1])) + '">' + sgn(chg(vals[i], vals[i - 1])) + '</span>') + '</div>';
    out += '<h3 class="cof-h3">' + U.esc(t.hist) + '</h3>' + U.chart([{ name: nm(tb.dims[0].l[c], lg), v: vals }], ys, 't', nm(tb.dims[0].l[c], lg), 0);
    var rows = tb.dims[0].l.map(function (l, k) { var ix = {}; ix[0] = k; ix[ya] = i; var a = at(tb, ix); ix[ya] = i - 1; return { l: nm(l, lg), v: a, y: chg(a, at(tb, ix)) }; }).filter(function (r) { return r.v != null; });
    out += '<div style="overflow-x:auto"><table data-no-cards data-no-rows style="border-collapse:collapse;width:100%;min-width:320px;font-size:13.5px"><thead><tr><th style="' + U.th + 'text-align:left">' + U.esc(t.item) + '</th><th style="' + U.th + '">t · ' + U.esc(ys[i]) + '</th><th style="' + U.th + '">' + U.esc(t.yoy) + '</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td style="' + U.td + 'text-align:left">' + U.esc(r.l) + '</td><td style="' + U.td + '">' + U.nf(r.v, 0) + '</td><td style="' + U.td + col(r.y) + '">' + sgn(r.y) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return out + note(t, 'nDairy');
  }

  /* ---- índices de precios agrarios ---- */
  function pricesView(d, lg, t) {
    if (!d.tables[ST.pk]) ST.pk = 'output';
    var tb = d.tables[ST.pk], ya = yearAxis(tb), ys = tb.dims[ya].l, pa = ya === 1 ? 2 : 1, per = tb.dims[pa].l;
    if (+ST.pc >= tb.dims[0].l.length) ST.pc = '0';
    var out = '<div style="margin:6px 0 10px">' + U.chip(ST.pk === 'output', 'hr-pk', 'data-k="output"', t.out) + U.chip(ST.pk === 'input', 'hr-pk', 'data-k="input"', t.inp) + '</div>';
    out += U.sel('hr-pc', t.item, tb.dims[0].l.map(function (l, i) { return U.opt(i, nm(l, lg), ST.pc); }).join(''), ST.pc);
    function g(c, y, p) { var ix = {}; ix[0] = c; ix[ya] = y; ix[pa] = p; return at(tb, ix); }
    var c = +ST.pc, labs = [], vals = [];
    ys.forEach(function (y, k) { for (var p = 0; p < 4; p++) { labs.push(y + ' ' + per[p]); vals.push(g(c, k, p)); } });
    var j = vals.length - 1; while (j > 0 && vals[j] == null) j--;
    var yoy = chg(vals[j], vals[j - 4]), qoq = chg(vals[j], vals[j - 1]);
    out += '<div class="cof-cards">' + card(U.esc(t.idx + ' · ' + labs[j]), U.nf(vals[j], 1), U.esc(nm(tb.dims[0].l[c], lg))) + card(U.esc(t.yoy), '<span style="' + col(yoy) + '">' + sgn(yoy) + '</span>') + '</div>';
    out += U.chart([{ name: nm(tb.dims[0].l[c], lg), v: vals.slice(-60) }], labs.slice(-60), t.idx, nm(tb.dims[0].l[c], lg), 1);
    var rows = tb.dims[0].l.map(function (l, k) {
      var lastY = Math.floor(j / 4), cur = g(k, lastY, j % 4), pr = lastY > 0 ? g(k, lastY - 1, j % 4) : null;
      return { l: nm(l, lg), idx: cur, y: chg(cur, pr) };
    }).filter(function (r) { return r.idx != null; }).sort(function (a, b) { return (b.y == null ? -1e9 : b.y) - (a.y == null ? -1e9 : a.y); });
    out += '<h3 class="cof-h3">' + U.esc(t.all) + ' · ' + U.esc(labs[j]) + '</h3><div style="overflow-x:auto"><table data-no-cards data-no-rows style="border-collapse:collapse;width:100%;min-width:320px;font-size:13.5px"><thead><tr><th style="' + U.th + 'text-align:left">' + U.esc(t.item) + '</th><th style="' + U.th + '">' + U.esc(t.idx) + '</th><th style="' + U.th + '">' + U.esc(t.yoy) + '</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td style="' + U.td + 'text-align:left">' + U.esc(r.l) + '</td><td style="' + U.td + '">' + U.nf(r.idx, 1) + '</td><td style="' + U.td + col(r.y) + '">' + sgn(r.y) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return out + note(t, 'nPrices');
  }

  /* ---- balances y abonos ---- */
  function balView(d, lg, t) {
    var K = ['cereals', 'oilseeds', 'rice', 'sugar'].filter(function (k) { return d.tables[k]; }), lab = { cereals: 'Cereals|Cereales|Céréales|Cereali', oilseeds: 'Oilseeds|Oleaginosas|Oléagineux|Oleaginose', rice: 'Rice|Arroz|Riz|Riso', sugar: 'Sugar|Azúcar|Sucre|Zucchero' };
    if (K.indexOf(ST.bk) < 0) ST.bk = K[0];
    var tb = d.tables[ST.bk], ya = yearAxis(tb), ys = tb.dims[ya].l, other = [0, 1, 2].filter(function (k) { return k !== 0 && k !== ya; })[0];
    var out = U.sel('hr-bk', t.balT, K.map(function (k) { return U.opt(k, lab[k].split('|')[LG[lg]], ST.bk); }).join(''), ST.bk);
    var ov = other != null && tb.dims[other] ? tb.dims[other].l : ['']; if (+ST.bt >= ov.length) ST.bt = '0';
    if (ov.length > 1) out += U.sel('hr-bt', t.item, ov.map(function (l, i) { return U.opt(i, nm(l, lg), ST.bt); }).join(''), ST.bt);
    var yi = ys.length - 1, rows = tb.dims[0].l.map(function (l, k) { var ix = {}; ix[0] = k; ix[ya] = yi; if (other != null && tb.dims[other]) ix[other] = +ST.bt; var a = at(tb, ix); ix[ya] = yi - 1; return { l: nm(l, lg), v: a, p: at(tb, ix) }; }).filter(function (r) { return r.v != null; });
    out += '<div style="overflow-x:auto"><table data-no-cards data-no-rows style="border-collapse:collapse;width:100%;min-width:320px;font-size:13.5px"><thead><tr><th style="' + U.th + 'text-align:left">' + U.esc(t.balV) + '</th><th style="' + U.th + '">' + U.esc(ys[yi]) + '</th><th style="' + U.th + '">' + U.esc(ys[yi - 1]) + '</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td style="' + U.td + 'text-align:left">' + U.esc(r.l) + '</td><td style="' + U.td + '">' + U.nf(r.v, 1) + '</td><td style="' + U.td + '">' + U.nf(r.p, 1) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var f = d.tables.fert_active;
    if (f) { var fy = yearAxis(f), fl = f.dims[fy].l, sr = [0, 1].map(function (c) { return { name: [t.n, t.p][c], v: fl.map(function (y, k) { var ix = {}; ix[0] = c; ix[fy] = k; return at(f, ix); }) }; });
      out += '<h3 class="cof-h3">' + U.esc(t.fert) + '</h3>' + U.chart(sr, fl, 't', t.fert, 0); }
    return out + note(t, 'nBal');
  }
  var VIEWS = {
    crops: function (D, lg, t) { return cropsView(D.crops, lg, t); }, live: function (D, lg, t) { return liveView(D.livestock, lg, t); },
    dairy: function (D, lg, t) { return dairyView(D.dairy, lg, t); }, prices: function (D, lg, t) { return pricesView(D.prices, lg, t); }, bal: function (D, lg, t) { return balView(D.balance, lg, t); }
  };
  function load() {
    if (D.ok) return Promise.resolve(D);
    var n = ['crops', 'livestock', 'dairy', 'prices', 'balance'];
    return Promise.all(n.map(function (k) { return U.json('data/hr-dzs/' + k + '.json'); })).then(function (r) {
      n.forEach(function (k, i) { D[k] = r[i]; }); D.ok = r.some(function (x) { return !!x; }); return D;
    });
  }
  function need(tab) { return { crops: 'crops', live: 'livestock', dairy: 'dairy', prices: 'prices', bal: 'balance' }[tab]; }
  function mount(el, lg) {
    if (!el || !U) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    function draw(focus) {
      var t = T[lg];
      return load().then(function (d) {
        if (!d.ok) { el.hidden = true; return false; }
        el.hidden = false;
        var tabs = Object.keys(T.es.tabs).filter(function (k) { return d[need(k)]; });
        if (tabs.indexOf(ST.tab) < 0) ST.tab = tabs[0];
        var chips = tabs.map(function (k) { return U.chip(k === ST.tab, 'hr-tab', 'data-tab="' + k + '"', t.tabs[k]); }).join('');
        var data = {}, body; Object.keys(d).forEach(function (k) { if (d[k] && d[k].tables) data[k] = d[k]; });
        try { body = VIEWS[ST.tab](data, lg, t); } catch (e) { body = '<p class="cof-note">' + U.esc(t.nodata) + '</p>'; }
        el.innerHTML = '<section class="di-card cof" id="ps-hr-dzs" style="max-width:none"><h2 class="cof-h2">' + U.esc(t.h) + '</h2><div style="margin:6px 0 10px">' + chips + '</div>' + body + U.cite('dzs_hr') + '</section>';
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        return true;
      });
    }
    if (!el.getAttribute('data-hr')) {
      el.setAttribute('data-hr', '1');
      el.addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('.hr-tab') : null; if (b) { ST.tab = b.getAttribute('data-tab'); draw('.hr-tab[data-tab="' + ST.tab + '"]'); return; }
        var k = ev.target.closest ? ev.target.closest('.hr-pk') : null; if (k) { ST.pk = k.getAttribute('data-k'); ST.pc = '0'; draw('.hr-pk[data-k="' + ST.pk + '"]'); }
      });
      el.addEventListener('change', function (ev) {
        var id = ev.target.id || '', v = ev.target.value;
        if (id === 'hr-ci') { ST.ci = v; ST.cm = ST.cm === 'yld' && (v.indexOf('bp5') === 0 || v.indexOf('bp6') === 0) ? 'prod' : ST.cm; } else if (id === 'hr-cm') ST.cm = v; else if (id === 'hr-cy') ST.cy = v;
        else if (id === 'hr-li') { ST.li = v; } else if (id === 'hr-ly') ST.ly = v; else if (id === 'hr-di') { ST.di = v; ST.dc = '0'; } else if (id === 'hr-dc') ST.dc = v;
        else if (id === 'hr-pc') ST.pc = v; else if (id === 'hr-bk') { ST.bk = v; ST.bt = '0'; } else if (id === 'hr-bt') ST.bt = v;
        draw('#' + id);
      });
    }
    return Promise.all([global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function () { return draw(); });
  }
  global.DIHrDzs = { mount: mount };
})(window);
