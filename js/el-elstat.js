/* Dehesa Index — Grecia: estadísticas agrarias de ELSTAT (índices de precios agrarios en origen y de insumos, productos seleccionados, cuentas agrarias por región).
   data/el-elstat/{prices,accounts,regions}.json (scripts/update-el-elstat.py). Bloque de la ficha de Grecia. ES5. window.DIElElstat. Usa window.ESUI (js/es-ui.js). */
(function (global) {
  'use strict';
  var T = {
    es: { h: 'Estadísticas agrarias de Grecia (ELSTAT)', tabs: { out: 'Precios en origen', prod: 'Productos', inp: 'Insumos', reg: 'Cuentas por región', geo: 'Cultivos y ganado por región' },
      grp: 'Grupo', prodL: 'Producto', idx: 'Índice (2020 = 100)', mom: 'Mes anterior', yoy: 'Hace un año', last: 'Último mes: {m}', all: 'Todos los grupos, ordenados por variación anual',
      range: 'Periodo', r3: '3 años', r10: '10 años', rall: 'Desde 2000', annualH: 'Media anual del índice', monthsH: 'Meses de {y}', yrAvg: 'Media de {y}', line: 'Concepto', nat: 'Total nacional', top: 'Región con más', share: 'del total',
      regions: 'Por región (NUTS 2)', yr: 'Año {y}, millones de euros', nodata: 'Sin dato publicado', cats: { c: 'Cereales y cultivos', v: 'Hortalizas y patata', f: 'Frutas, frutos secos y olivo', a: 'Ganado y productos animales' },
      nOut: 'Índices de ELSTAT, base 2020 = 100, de lo que cobra el agricultor sin contar subvenciones. Los meses recientes son provisionales. No es el precio del consumidor.',
      nInp: 'Índices de ELSTAT, base 2020 = 100, de lo que paga el agricultor por semillas, energía, abonos, piensos, maquinaria y otros insumos. Los meses recientes son provisionales.',
      nProd: 'Índices de productos seleccionados (ELSTAT, 2020 = 100). Un mes vacío es un mes sin precio (producto fuera de temporada), no un cero. Del año en curso solo se publica el detalle mensual.',
      nReg: 'Cuentas económicas de la agricultura por región (ELSTAT), a precios básicos, millones de euros. Las 13 regiones NUTS 2 suman el total nacional. Una celda vacía es dato no publicado.', src: 'Fuente:', g_ind: 'Cultivo o ganado', g_met: 'Medida', g_mA: 'Superficie (ha)', g_mP: 'Producción (t)', g_gC: 'Cultivos', g_gL: 'Ganadería y leche', g_lv1: 'Regiones', g_lv2: 'Unidades regionales (top 20)', g_nat: 'Total nacional', g_top: 'Primera región', g_share: 'del total', g_yld: 'Rendimiento', g_ha: 't/ha', g_hd: 'cabezas', g_t: 't', g_yr: 'Año {y}', g_note: 'Encuesta agraria y encuesta ganadera anuales de ELSTAT por región y unidad regional. Superficies en hectáreas (ELSTAT publica estremas), producciones en toneladas, ganado en cabezas a 31 de diciembre. Las unidades suman su región y las regiones suman Grecia. Un hueco es dato no publicado (—).' },
    en: { h: 'Greece agricultural statistics (ELSTAT)', tabs: { out: 'Farm-gate prices', prod: 'Products', inp: 'Inputs', reg: 'Accounts by region', geo: 'Crops and livestock by region' },
      grp: 'Group', prodL: 'Product', idx: 'Index (2020 = 100)', mom: 'Previous month', yoy: 'A year ago', last: 'Latest month: {m}', all: 'All groups, ranked by annual change',
      range: 'Period', r3: '3 years', r10: '10 years', rall: 'Since 2000', annualH: 'Annual index', monthsH: 'Months of {y}', yrAvg: 'Average {y}', line: 'Item', nat: 'National total', top: 'Largest region', share: 'of the total',
      regions: 'By region (NUTS 2)', yr: 'Year {y}, million euro', nodata: 'No published figure', cats: { c: 'Cereals and field crops', v: 'Vegetables and potatoes', f: 'Fruit, nuts and olives', a: 'Livestock and animal products' },
      nOut: 'ELSTAT indices, 2020 = 100, of what the farmer is paid, excluding subsidies. Recent months are provisional. It is not the consumer price.',
      nInp: 'ELSTAT indices, 2020 = 100, of what the farmer pays for seed, energy, fertiliser, feed, machinery and other inputs. Recent months are provisional.',
      nProd: 'ELSTAT indices for selected products (2020 = 100). An empty month means no price that month (out of season), not zero. Only the current year is published month by month.',
      nReg: 'ELSTAT economic accounts for agriculture by region, at basic prices, million euro. The 13 NUTS 2 regions add up to the national total. An empty cell means the figure is not published.', src: 'Source:', g_ind: 'Crop or livestock', g_met: 'Measure', g_mA: 'Area (ha)', g_mP: 'Production (t)', g_gC: 'Crops', g_gL: 'Livestock and milk', g_lv1: 'Regions', g_lv2: 'Regional units (top 20)', g_nat: 'National total', g_top: 'Largest region', g_share: 'of the total', g_yld: 'Yield', g_ha: 't/ha', g_hd: 'head', g_t: 't', g_yr: 'Year {y}', g_note: 'ELSTAT annual agricultural and livestock surveys by region and regional unit. Areas in hectares (ELSTAT publishes stremmata), production in tonnes, livestock in head on 31 December. Units add up to their region and regions to Greece. A gap is an unpublished figure (—).' },
    fr: { h: 'Statistiques agricoles de la Grèce (ELSTAT)', tabs: { out: 'Prix à la production', prod: 'Produits', inp: 'Intrants', reg: 'Comptes par région', geo: 'Cultures et élevage par région' },
      grp: 'Groupe', prodL: 'Produit', idx: 'Indice (2020 = 100)', mom: 'Mois précédent', yoy: 'Il y a un an', last: 'Dernier mois : {m}', all: 'Tous les groupes, classés par variation annuelle',
      range: 'Période', r3: '3 ans', r10: '10 ans', rall: 'Depuis 2000', annualH: 'Indice annuel', monthsH: 'Mois de {y}', yrAvg: 'Moyenne {y}', line: 'Poste', nat: 'Total national', top: 'Première région', share: 'du total',
      regions: 'Par région (NUTS 2)', yr: 'Année {y}, millions d’euros', nodata: 'Pas de chiffre publié', cats: { c: 'Céréales et grandes cultures', v: 'Légumes et pommes de terre', f: 'Fruits, fruits à coque et olives', a: 'Élevage et produits animaux' },
      nOut: 'Indices ELSTAT, base 2020 = 100, de ce que touche l’agriculteur, hors subventions. Les mois récents sont provisoires. Ce n’est pas le prix au consommateur.',
      nInp: 'Indices ELSTAT, base 2020 = 100, de ce que paie l’agriculteur pour les semences, l’énergie, les engrais, l’alimentation animale, le matériel et d’autres intrants. Les mois récents sont provisoires.',
      nProd: 'Indices ELSTAT de produits sélectionnés (2020 = 100). Un mois vide signifie pas de prix ce mois-là (hors saison), pas zéro. Seule l’année en cours est publiée mois par mois.',
      nReg: 'Comptes économiques de l’agriculture par région (ELSTAT), aux prix de base, millions d’euros. Les 13 régions NUTS 2 totalisent le chiffre national. Une case vide signifie chiffre non publié.', src: 'Source :', g_ind: 'Culture ou élevage', g_met: 'Mesure', g_mA: 'Surface (ha)', g_mP: 'Production (t)', g_gC: 'Cultures', g_gL: 'Élevage et lait', g_lv1: 'Régions', g_lv2: 'Unités régionales (20 premières)', g_nat: 'Total national', g_top: 'Première région', g_share: 'du total', g_yld: 'Rendement', g_ha: 't/ha', g_hd: 'têtes', g_t: 't', g_yr: 'Année {y}', g_note: 'Enquêtes agricole et d’élevage annuelles d’ELSTAT par région et unité régionale. Surfaces en hectares (ELSTAT publie des stremmata), production en tonnes, cheptel en têtes au 31 décembre. Les unités totalisent leur région et les régions la Grèce. Un blanc est un chiffre non publié (—).' },
    it: { h: 'Statistiche agricole della Grecia (ELSTAT)', tabs: { out: 'Prezzi alla produzione', prod: 'Prodotti', inp: 'Input', reg: 'Conti per regione', geo: 'Colture e allevamento per regione' },
      grp: 'Gruppo', prodL: 'Prodotto', idx: 'Indice (2020 = 100)', mom: 'Mese precedente', yoy: 'Un anno fa', last: 'Ultimo mese: {m}', all: 'Tutti i gruppi, in ordine di variazione annua',
      range: 'Periodo', r3: '3 anni', r10: '10 anni', rall: 'Dal 2000', annualH: 'Indice annuo', monthsH: 'Mesi del {y}', yrAvg: 'Media {y}', line: 'Voce', nat: 'Totale nazionale', top: 'Regione maggiore', share: 'del totale',
      regions: 'Per regione (NUTS 2)', yr: 'Anno {y}, milioni di euro', nodata: 'Dato non pubblicato', cats: { c: 'Cereali e seminativi', v: 'Ortaggi e patate', f: 'Frutta, frutta a guscio e olive', a: 'Zootecnia e prodotti animali' },
      nOut: 'Indici ELSTAT, base 2020 = 100, di quanto incassa l’agricoltore, senza sussidi. I mesi recenti sono provvisori. Non è il prezzo al consumo.',
      nInp: 'Indici ELSTAT, base 2020 = 100, di quanto paga l’agricoltore per sementi, energia, fertilizzanti, mangimi, macchine e altri input. I mesi recenti sono provvisori.',
      nProd: 'Indici ELSTAT di prodotti selezionati (2020 = 100). Un mese vuoto significa nessun prezzo in quel mese (fuori stagione), non zero. Solo l’anno in corso è pubblicato mese per mese.',
      nReg: 'Conti economici dell’agricoltura per regione (ELSTAT), a prezzi base, milioni di euro. Le 13 regioni NUTS 2 sommano il totale nazionale. Una cella vuota significa dato non pubblicato.', src: 'Fonte:', g_ind: 'Coltura o allevamento', g_met: 'Misura', g_mA: 'Superficie (ha)', g_mP: 'Produzione (t)', g_gC: 'Colture', g_gL: 'Allevamento e latte', g_lv1: 'Regioni', g_lv2: 'Unità regionali (prime 20)', g_nat: 'Totale nazionale', g_top: 'Prima regione', g_share: 'del totale', g_yld: 'Resa', g_ha: 't/ha', g_hd: 'capi', g_t: 't', g_yr: 'Anno {y}', g_note: 'Indagini agraria e zootecnica annuali di ELSTAT per regione e unità regionale. Superfici in ettari (ELSTAT pubblica stremmata), produzione in tonnellate, bestiame in capi al 31 dicembre. Le unità sommano la propria regione e le regioni la Grecia. Un vuoto è un dato non pubblicato (—).' }
  };
  /* etiquetas: en|es|fr|it (el inglés es el nombre de ELSTAT, acortado) */
  var LG = { en: 0, es: 1, fr: 2, it: 3 };
  var L = {
    '140000': 'Agricultural output, total|Producción agraria total|Production agricole totale|Produzione agricola totale', '141000': 'Agricultural output excluding fruit and vegetables|Producción agraria sin frutas ni hortalizas|Production agricole hors fruits et légumes|Produzione agricola senza frutta e ortaggi',
    '100000': 'Crop output|Producción vegetal|Production végétale|Produzione vegetale', '101000': 'Crop output excluding fruit and vegetables|Producción vegetal sin frutas ni hortalizas|Production végétale hors fruits et légumes|Produzione vegetale senza frutta e ortaggi',
    '010000': 'Cereals|Cereales|Céréales|Cereali', '020000': 'Industrial crops|Cultivos industriales|Cultures industrielles|Colture industriali', '030000': 'Forage plants|Plantas forrajeras|Plantes fourragères|Piante foraggere',
    '040000': 'Vegetables and horticultural products|Hortalizas y productos hortícolas|Légumes et produits horticoles|Ortaggi e prodotti orticoli', '050000': 'Potatoes|Patatas|Pommes de terre|Patate', '060000': 'Fruits|Frutas|Fruits|Frutta',
    '070000': 'Wine|Vino|Vin|Vino', '080000': 'Olive oil|Aceite de oliva|Huile d’olive|Olio d’oliva', '090000': 'Other crop products|Otros productos vegetales|Autres produits végétaux|Altri prodotti vegetali',
    '130000': 'Animal output|Producción animal|Production animale|Produzione animale', '110000': 'Animals|Animales|Animaux|Animali', '120000': 'Animal products|Productos animales|Produits animaux|Prodotti animali',
    '220000': 'All inputs|Todos los insumos|Tous les intrants|Tutti gli input', '200000': 'Goods and services consumed|Bienes y servicios consumidos|Biens et services consommés|Beni e servizi consumati',
    '201000': 'Seeds and planting stock|Semillas y plantones|Semences et plants|Sementi e piantine', '202000': 'Energy and lubricants|Energía y lubricantes|Énergie et lubrifiants|Energia e lubrificanti',
    '203000': 'Fertilisers and soil improvers|Fertilizantes y enmiendas|Engrais et amendements|Fertilizzanti e ammendanti', '204000': 'Plant protection products|Fitosanitarios|Produits phytosanitaires|Prodotti fitosanitari',
    '205000': 'Veterinary expenses|Gastos veterinarios|Frais vétérinaires|Spese veterinarie', '206000': 'Animal feed|Piensos|Aliments pour animaux|Mangimi',
    '207000': 'Maintenance of materials|Mantenimiento de materiales|Entretien du matériel|Manutenzione dei materiali', '208000': 'Maintenance of buildings|Mantenimiento de edificios|Entretien des bâtiments|Manutenzione degli edifici',
    '209000': 'Other goods and services|Otros bienes y servicios|Autres biens et services|Altri beni e servizi', '210000': 'Goods and services for investment|Bienes y servicios de inversión|Biens et services d’investissement|Beni e servizi per investimenti',
    '211000': 'Materials (machinery and vehicles)|Materiales (maquinaria y vehículos)|Matériel (machines et véhicules)|Materiali (macchine e veicoli)', '211110': 'Rotovators and two-wheel equipment|Motocultores y equipos de dos ruedas|Motoculteurs et matériel à deux roues|Motocoltivatori e attrezzature a due ruote',
    '211120': 'Machinery for cultivation|Maquinaria de cultivo|Machines de culture|Macchine per la coltivazione', '211130': 'Machinery for harvesting|Maquinaria de cosecha|Machines de récolte|Macchine per la raccolta',
    '211140': 'Farm machinery and installations|Maquinaria e instalaciones agrarias|Machines et installations agricoles|Macchine e impianti agricoli', '211210': 'Tractors|Tractores|Tracteurs|Trattori',
    '211290': 'Other vehicles|Otros vehículos|Autres véhicules|Altri veicoli', '212000': 'Buildings|Edificios|Bâtiments|Edifici',
    'aegina-pistachio': 'Aegina pistachio|Pistacho de Egina|Pistache d’Égine|Pistacchio di Egina', almonds: 'Almonds|Almendras|Amandes|Mandorle', artichoke: 'Artichokes|Alcachofas|Artichauts|Carciofi', asparagus: 'Asparagus|Espárragos|Asperges|Asparagi',
    cabbages: 'Cabbages|Coles|Choux|Cavoli', capsicum: 'Peppers|Pimientos|Poivrons|Peperoni', carrots: 'Carrots|Zanahorias|Carottes|Carote', cattle: 'Cattle|Vacuno|Bovins|Bovini', cauliflowers: 'Cauliflowers|Coliflores|Choux-fleurs|Cavolfiori',
    cherries: 'Cherries|Cerezas|Cerises|Ciliegie', chickens: 'Chickens|Pollos|Poulets|Polli', 'citrus-fruit': 'Citrus fruit|Cítricos|Agrumes|Agrumi', cotton: 'Cotton|Algodón|Coton|Cotone', courgettes: 'Courgettes|Calabacines|Courgettes|Zucchine',
    'cow-milk': 'Cow milk|Leche de vaca|Lait de vache|Latte vaccino', cucumbers: 'Cucumbers|Pepinos|Concombres|Cetrioli', 'dessert-apples': 'Dessert apples|Manzanas de mesa|Pommes de table|Mele da tavola', 'durum-wheat': 'Durum wheat|Trigo duro|Blé dur|Grano duro',
    eggplants: 'Aubergines|Berenjenas|Aubergines|Melanzane', eggs: 'Eggs|Huevos|Œufs|Uova', endives: 'Endives|Escarolas|Endives|Indivie', 'fresh-fruit-excluding-citrus-fruit-and-grapes': 'Fresh fruit (no citrus or grapes)|Fruta fresca (sin cítricos ni uva)|Fruits frais (hors agrumes et raisin)|Frutta fresca (senza agrumi né uva)',
    'fresh-vegetables': 'Fresh vegetables|Hortalizas frescas|Légumes frais|Ortaggi freschi', 'goat-milk': 'Goat milk|Leche de cabra|Lait de chèvre|Latte caprino', goats: 'Goats|Caprino|Caprins|Caprini', grapes: 'Grapes (all)|Uva (total)|Raisin (total)|Uva (totale)',
    'green-beans': 'Green beans|Judías verdes|Haricots verts|Fagiolini', honey: 'Honey|Miel|Miel|Miele', lamb: 'Lamb|Cordero|Agneau|Agnello', lemons: 'Lemons|Limones|Citrons|Limoni', lettuce: 'Lettuce|Lechuga|Laitue|Lattuga', maize: 'Maize|Maíz|Maïs|Mais',
    mandarin: 'Mandarins|Mandarinas|Mandarines|Mandarini', milk: 'Milk (all)|Leche (total)|Lait (total)|Latte (totale)', nuts: 'Nuts|Frutos secos|Fruits à coque|Frutta a guscio', 'oil-seeds-and-oleaginous-fruits-including-seeds': 'Oilseeds|Oleaginosas|Oléagineux|Semi oleosi',
    'olive-oil': 'Olive oil|Aceite de oliva|Huile d’olive|Olio d’oliva', onions: 'Onions|Cebollas|Oignons|Cipolle', oranges: 'Oranges|Naranjas|Oranges|Arance', 'other-animal-products': 'Other animal products|Otros productos animales|Autres produits animaux|Altri prodotti animali',
    peaches: 'Peaches|Melocotones|Pêches|Pesche', pears: 'Pears|Peras|Poires|Pere', pigs: 'Pigs|Porcino|Porcs|Suini', 'plants-and-flowers': 'Plants and flowers|Plantas y flores|Plantes et fleurs|Piante e fiori',
    'potatoes-for-consumption': 'Potatoes for consumption|Patatas de consumo|Pommes de terre de consommation|Patate da consumo', rice: 'Rice|Arroz|Riz|Riso', 'rice-including-seeds': 'Rice (with seed)|Arroz (con semilla)|Riz (avec semences)|Riso (con sementi)',
    sheep: 'Sheep|Ovino|Ovins|Ovini', 'sheep-milk': 'Sheep milk|Leche de oveja|Lait de brebis|Latte ovino', 'soft-wheat': 'Soft wheat|Trigo blando|Blé tendre|Grano tenero', spinach: 'Spinach|Espinacas|Épinards|Spinaci',
    'sugar-beet': 'Sugar beet|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero', 'table-grapes': 'Table grapes|Uva de mesa|Raisin de table|Uva da tavola', 'table-olives': 'Table olives|Aceituna de mesa|Olives de table|Olive da tavola',
    tobacco: 'Tobacco|Tabaco|Tabac|Tabacco', tomatoes: 'Tomatoes|Tomates|Tomates|Pomodori', veal: 'Veal|Ternera|Veau|Vitello', walnuts: 'Walnuts|Nueces|Noix|Noci', watermelons: 'Watermelons|Sandías|Pastèques|Cocomeri',
    'wheat-and-spelt': 'Wheat and spelt|Trigo y espelta|Blé et épeautre|Frumento e farro'
  };
  var CATS = { c: ['soft-wheat', 'durum-wheat', 'wheat-and-spelt', 'maize', 'rice', 'rice-including-seeds', 'cotton', 'tobacco', 'sugar-beet', 'oil-seeds-and-oleaginous-fruits-including-seeds'],
    v: ['fresh-vegetables', 'tomatoes', 'cucumbers', 'courgettes', 'eggplants', 'capsicum', 'onions', 'cabbages', 'cauliflowers', 'lettuce', 'endives', 'spinach', 'green-beans', 'carrots', 'artichoke', 'asparagus', 'watermelons', 'potatoes-for-consumption', 'plants-and-flowers'],
    f: ['fresh-fruit-excluding-citrus-fruit-and-grapes', 'dessert-apples', 'pears', 'peaches', 'cherries', 'citrus-fruit', 'oranges', 'mandarin', 'lemons', 'grapes', 'table-grapes', 'nuts', 'almonds', 'walnuts', 'aegina-pistachio', 'table-olives', 'olive-oil'],
    a: ['cattle', 'veal', 'pigs', 'sheep', 'lamb', 'goats', 'chickens', 'milk', 'cow-milk', 'sheep-milk', 'goat-milk', 'eggs', 'honey', 'other-animal-products'] };
  /* líneas de la cuenta regional (en|es|fr|it); el código es el de ELSTAT/Eurostat */
  var A = {
    '01': 'Cereals|Cereales|Céréales|Cereali', '01.1': 'Wheat and spelt|Trigo y espelta|Blé et épeautre|Frumento e farro', '01.11': 'Soft wheat|Trigo blando|Blé tendre|Grano tenero', '01.12': 'Durum wheat|Trigo duro|Blé dur|Grano duro',
    '01.2': 'Rye|Centeno|Seigle|Segale', '01.3': 'Barley|Cebada|Orge|Orzo', '01.4': 'Oats|Avena|Avoine|Avena', '01.5': 'Grain maize|Maíz grano|Maïs grain|Mais da granella', '01.6': 'Rice|Arroz|Riz|Riso', '01.9': 'Other cereals|Otros cereales|Autres céréales|Altri cereali',
    '02': 'Industrial crops|Cultivos industriales|Cultures industrielles|Colture industriali', '02.1': 'Oilseeds|Oleaginosas|Oléagineux|Semi oleosi', '02.11': 'Rapeseed|Colza|Colza|Colza', '02.12': 'Sunflower|Girasol|Tournesol|Girasole', '02.13': 'Soya|Soja|Soja|Soia',
    '02.19': 'Other oilseed products|Otras oleaginosas|Autres oléagineux|Altri semi oleosi', '02.2': 'Protein crops|Proteaginosas|Protéagineux|Proteaginose', '02.3': 'Raw tobacco|Tabaco en rama|Tabac brut|Tabacco greggio', '02.4': 'Sugar beet|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero',
    '02.5': 'Other industrial crops (cotton…)|Otros cultivos industriales (algodón…)|Autres cultures industrielles (coton…)|Altre colture industriali (cotone…)', '03': 'Forage plants|Plantas forrajeras|Plantes fourragères|Piante foraggere',
    '04': 'Vegetables and horticulture|Hortalizas y horticultura|Légumes et horticulture|Ortaggi e orticoltura', '04.1': 'Fresh vegetables|Hortalizas frescas|Légumes frais|Ortaggi freschi', '04.2': 'Plants and flowers|Plantas y flores|Plantes et fleurs|Piante e fiori',
    '05': 'Potatoes|Patatas|Pommes de terre|Patate', '06': 'Fruit|Frutas|Fruits|Frutta', '06.1': 'Fresh fruit|Fruta fresca|Fruits frais|Frutta fresca', '06.2': 'Citrus fruit|Cítricos|Agrumes|Agrumi', '06.3': 'Tropical fruit|Frutas tropicales|Fruits tropicaux|Frutta tropicale',
    '06.4': 'Grapes|Uva|Raisin|Uva', '06.5': 'Olives|Aceituna|Olives|Olive', '07': 'Wine|Vino|Vin|Vino', '08': 'Olive oil|Aceite de oliva|Huile d’olive|Olio d’oliva', '09': 'Other crop products|Otros productos vegetales|Autres produits végétaux|Altri prodotti vegetali',
    '10': 'Crop output|Producción vegetal|Production végétale|Produzione vegetale', '11': 'Animals|Animales|Animaux|Animali', '11.1': 'Cattle|Vacuno|Bovins|Bovini', '11.2': 'Pigs|Porcino|Porcs|Suini', '11.3': 'Equines|Équidos|Équidés|Equini',
    '11.4': 'Sheep and goats|Ovino y caprino|Ovins et caprins|Ovini e caprini', '11.5': 'Poultry|Aves de corral|Volailles|Pollame', '11.9': 'Other animals|Otros animales|Autres animaux|Altri animali', '12': 'Animal products|Productos animales|Produits animaux|Prodotti animali',
    '12.1': 'Milk|Leche|Lait|Latte', '12.2': 'Eggs|Huevos|Œufs|Uova', '12.9': 'Other animal products|Otros productos animales|Autres produits animaux|Altri prodotti animali', '13': 'Animal output|Producción animal|Production animale|Produzione animale',
    '14': 'Agricultural goods output|Producción de bienes agrarios|Production de biens agricoles|Produzione di beni agricoli', '15': 'Agricultural services output|Producción de servicios agrarios|Production de services agricoles|Produzione di servizi agricoli',
    '16': 'Agricultural output|Producción agraria|Production agricole|Produzione agricola', '17': 'Secondary activities|Actividades secundarias|Activités secondaires|Attività secondarie', '18': 'Output of the agricultural industry|Producción de la rama agraria|Production de la branche agricole|Produzione del ramo agricolo',
    '19': 'Intermediate consumption|Consumos intermedios|Consommation intermédiaire|Consumi intermedi', '20': 'Gross value added|Valor añadido bruto|Valeur ajoutée brute|Valore aggiunto lordo', '21': 'Fixed capital consumption|Consumo de capital fijo|Consommation de capital fixe|Consumo di capitale fisso',
    '22': 'Net value added|Valor añadido neto|Valeur ajoutée nette|Valore aggiunto netto', '23': 'Compensation of employees|Remuneración de asalariados|Rémunération des salariés|Redditi da lavoro dipendente', '24': 'Other taxes on production|Otros impuestos a la producción|Autres impôts sur la production|Altre imposte sulla produzione',
    '25': 'Other subsidies on production|Otras subvenciones a la producción|Autres subventions sur la production|Altri contributi alla produzione', '26': 'Factor income|Renta de los factores|Revenu des facteurs|Reddito dei fattori', '27': 'Operating surplus / mixed income|Excedente de explotación / renta mixta|Excédent d’exploitation / revenu mixte|Risultato di gestione / reddito misto',
    '28': 'Rents paid|Alquileres pagados|Fermages payés|Fitti pagati', '29': 'Interest paid|Intereses pagados|Intérêts payés|Interessi pagati', '30': 'Interest received|Intereses cobrados|Intérêts reçus|Interessi ricevuti', '31': 'Entrepreneurial income|Renta empresarial|Revenu entrepreneurial|Reddito imprenditoriale'
  };
  var RN = { EL30: 'Attica|Ática|Attique|Attica', EL41: 'North Aegean|Egeo Septentrional|Égée-Septentrional|Egeo settentrionale', EL42: 'South Aegean|Egeo Meridional|Égée-Méridional|Egeo meridionale', EL43: 'Crete|Creta|Crète|Creta',
    EL51: 'East Macedonia and Thrace|Macedonia Oriental y Tracia|Macédoine-Orientale et Thrace|Macedonia orientale e Tracia', EL52: 'Central Macedonia|Macedonia Central|Macédoine-Centrale|Macedonia centrale', EL53: 'Western Macedonia|Macedonia Occidental|Macédoine-Occidentale|Macedonia occidentale',
    EL54: 'Epirus|Epiro|Épire|Epiro', EL61: 'Thessaly|Tesalia|Thessalie|Tessaglia', EL62: 'Ionian Islands|Islas Jónicas|Îles Ioniennes|Isole Ionie', EL63: 'Western Greece|Grecia Occidental|Grèce-Occidentale|Grecia occidentale',
    EL64: 'Central Greece|Grecia Central|Grèce-Centrale|Grecia centrale', EL65: 'Peloponnese|Peloponeso|Péloponnèse|Peloponneso' };
var GL = {
    wheat_common: 'Common wheat|Trigo blando|Blé tendre|Frumento tenero', wheat_durum: 'Durum wheat|Trigo duro|Blé dur|Frumento duro', barley: 'Barley|Cebada|Orge|Orzo', oats: 'Oats|Avena|Avoine|Avena', maize: 'Maize|Maíz|Maïs|Mais', rice: 'Rice|Arroz|Riz|Riso',
    cotton: 'Cotton|Algodón|Coton|Cotone', sunflower: 'Sunflower|Girasol|Tournesol|Girasole', soya: 'Soya|Soja|Soja|Soia', rapeseed: 'Rapeseed|Colza|Colza|Colza', sugarbeet: 'Sugar beet|Remolacha azucarera|Betterave sucrière|Barbabietola da zucchero',
    tree_orange: 'Oranges|Naranja|Oranges|Arance', tree_mandarin: 'Mandarins|Mandarina|Mandarines|Mandarini', tree_lemon: 'Lemons|Limón|Citrons|Limoni', tree_peach: 'Peaches and nectarines|Melocotón y nectarina|Pêches et nectarines|Pesche e nettarine',
    tree_apple: 'Apples|Manzana|Pommes|Mele', tree_kiwi: 'Kiwi|Kiwi|Kiwi|Kiwi', tree_almond: 'Almonds|Almendra|Amandes|Mandorle', tree_walnut: 'Walnuts|Nuez|Noix|Noci', tree_cherry: 'Cherries|Cereza|Cerises|Ciliegie', tree_pistachio: 'Pistachios|Pistacho|Pistaches|Pistacchi',
    olive_oil: 'Olive oil|Aceite de oliva|Huile d’olive|Olio d’oliva',
    cattle: 'Cattle and buffaloes|Vacuno y búfalos|Bovins et buffles|Bovini e bufali', dairy_cows: 'Dairy cows|Vacas de leche|Vaches laitières|Vacche da latte', sheep: 'Sheep|Ovino|Ovins|Ovini', goats: 'Goats|Caprino|Caprins|Caprini', pigs: 'Pigs|Porcino|Porcins|Suini',
    milk_total: 'Milk, all species|Leche, todas las especies|Lait, toutes espèces|Latte, tutte le specie', milk_cow: 'Cow and buffalo milk|Leche de vaca y búfala|Lait de vache et de bufflonne|Latte vaccino e bufalino', milk_sheep: 'Sheep milk|Leche de oveja|Lait de brebis|Latte ovino', milk_goat: 'Goat milk|Leche de cabra|Lait de chèvre|Latte caprino'
  };
  var GR = { 'Eastern Macedonia and Thrace': 'EL51', 'Central Macedonia': 'EL52', 'Western Macedonia': 'EL53', Epirus: 'EL54', Thessally: 'EL61', 'Ionian Islands': 'EL62', 'Western Greece': 'EL63', 'Central Greece': 'EL64', Peloponnese: 'EL65', Attica: 'EL30', 'Northern Aegean': 'EL41', 'Southern Aegean': 'EL42', Crete: 'EL43' };
  var U = global.ESUI, ST = { tab: 'out', og: '140000', ig: '220000', rng: '10', prod: 'olive-oil', line: '14', gi: 'wheat_durum', gm: 'prod', gl: '1' }, D = {};
  function nm(tab, k, lg, fb) { var s = tab[k]; if (!s) return fb || k; var a = s.split('|'); return a[LG[lg]] || a[0]; }
  function lastIdx(a) { for (var i = a.length - 1; i >= 0; i--) if (a[i] != null) return i; return -1; }
  function sgn(v, d) { return v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + U.nf(Math.abs(v), d == null ? 1 : d) + ' %'; }
  function col(v) { return v == null || v === 0 ? '' : v > 0 ? 'color:#2f7d4f' : 'color:#b4541a'; }
  function card(n, v, note) { return '<div class="di-card cof-card"><div class="cof-lbl">' + n + '</div><div class="cof-val">' + v + '</div>' + (note ? '<div class="cof-note" style="margin:2px 0 0">' + note + '</div>' : '') + '</div>'; }
  function mlabel(m, lg) { var p = m.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, 1)).toLocaleDateString(lg, { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return m; } }
  function mshort(k, lg) { try { return new Date(Date.UTC(2000, k, 1)).toLocaleDateString(lg, { month: 'short', timeZone: 'UTC' }); } catch (e) { return String(k + 1); } }
  function note(t, k) { return '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t[k]) + '</p>'; }
  function change(v, i, back) { return i >= back && v[i] != null && v[i - back] ? (v[i] / v[i - back] - 1) * 100 : null; }
  function codeOrder(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  function indexView(d, lg, t, side) {
    var S = d[side], ks = Object.keys(S), key = side === 'output' ? 'og' : 'ig', M = d.months;
    if (!S[ST[key]]) ST[key] = ks[0];
    var e = S[ST[key]], v = e.v, i = lastIdx(v), out = '';
    var opts = ks.map(function (k) { return U.opt(k, nm(L, k, lg, S[k].name), ST[key]); }).join('');
    out += U.sel('el-g', t.grp, opts, ST[key]) + U.sel('el-r', t.range, U.opt('3', t.r3, ST.rng) + U.opt('10', t.r10, ST.rng) + U.opt('all', t.rall, ST.rng), ST.rng);
    if (i < 0) return out + '<p class="cof-note">' + U.esc(t.nodata) + '</p>';
    var mom = change(v, i, 1), yoy = change(v, i, 12);
    out += '<div class="cof-cards">' + card(U.esc(t.idx + ' · ' + mlabel(M[i], lg)), U.nf(v[i], 1)) + card(t.mom, '<span style="' + col(mom) + '">' + sgn(mom) + '</span>') + card(t.yoy, '<span style="' + col(yoy) + '">' + sgn(yoy) + '</span>') + '</div>';
    var n = ST.rng === 'all' ? M.length : (+ST.rng) * 12, from = Math.max(0, i + 1 - n), vv = v.slice(from, i + 1), ll = M.slice(from, i + 1).map(function (m) { return mlabel(m, lg); });
    out += U.chart([{ name: nm(L, ST[key], lg, e.name), v: vv }], ll, t.idx, nm(L, ST[key], lg, e.name), 1);
    var rows = ks.map(function (k) { var x = S[k], j = lastIdx(x.v); return { l: nm(L, k, lg, x.name), idx: j < 0 ? null : x.v[j], yoy: j < 0 ? null : change(x.v, j, 12) }; }).sort(function (a, b) { return (b.yoy == null ? -1e9 : b.yoy) - (a.yoy == null ? -1e9 : a.yoy); });
    out += '<h3 class="cof-h3">' + U.esc(t.all) + '</h3><div style="overflow-x:auto"><table data-no-cards data-no-rows style="border-collapse:collapse;width:100%;min-width:320px;font-size:13.5px"><thead><tr><th style="' + U.th + 'text-align:left">' + U.esc(t.grp) + '</th><th style="' + U.th + 'text-align:right">' + U.esc(t.idx) + '</th><th style="' + U.th + 'text-align:right">' + U.esc(t.yoy) + '</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td style="' + U.td + 'text-align:left">' + U.esc(r.l) + '</td><td style="' + U.td + '">' + U.nf(r.idx, 1) + '</td><td style="' + U.td + col(r.yoy) + '">' + sgn(r.yoy) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return out + note(t, side === 'output' ? 'nOut' : 'nInp');
  }
  function prodView(d, lg, t) {
    var P = d.products, out = '', seen = {};
    if (!P[ST.prod]) ST.prod = Object.keys(P)[0];
    var opts = Object.keys(CATS).map(function (c) {
      var ids = CATS[c].filter(function (k) { return P[k]; }); ids.forEach(function (k) { seen[k] = 1; });
      return ids.length ? '<optgroup label="' + U.esc(t.cats[c]) + '">' + ids.map(function (k) { return U.opt(k, nm(L, k, lg, P[k].name), ST.prod); }).join('') + '</optgroup>' : '';
    }).join('');
    var rest = Object.keys(P).filter(function (k) { return !seen[k]; }); if (rest.length) opts += rest.map(function (k) { return U.opt(k, nm(L, k, lg, P[k].name), ST.prod); }).join('');
    out += U.sel('el-p', t.prodL, opts, ST.prod);
    var e = P[ST.prod], a = e.annual, i = lastIdx(a), y1 = e.from + i, nmz = nm(L, ST.prod, lg, e.name);
    if (i < 0) return out + '<p class="cof-note">' + U.esc(t.nodata) + '</p>';
    var yoy = i > 0 && a[i - 1] ? (a[i] / a[i - 1] - 1) * 100 : null, mo = e.monthly, mi = mo ? lastIdx(mo.v) : -1;
    out += '<div class="cof-cards">' + card(U.esc(t.yrAvg.replace('{y}', y1)), U.nf(a[i], 1), '<span style="' + col(yoy) + '">' + sgn(yoy) + '</span>');
    if (mi >= 0) { var pm = mi > 0 ? mo.v[mi - 1] : null, pc = pm ? (mo.v[mi] / pm - 1) * 100 : null; out += card(U.esc(t.idx + ' · ' + mshort(mi, lg) + ' ' + mo.year), U.nf(mo.v[mi], 1), pc == null ? '' : '<span style="' + col(pc) + '">' + sgn(pc) + ' · ' + U.esc(t.mom) + '</span>'); }
    out += '</div>';
    var yrs = a.map(function (x, k) { return e.from + k; });
    out += U.chart([{ name: nmz, v: a }], yrs, t.annualH, nmz, 1);
    if (mo) {
      out += '<h3 class="cof-h3">' + U.esc(t.monthsH.replace('{y}', mo.year)) + '</h3><div style="overflow-x:auto"><table data-no-cards data-no-rows style="border-collapse:collapse;width:100%;min-width:420px;font-size:13px"><thead><tr>' +
        mo.v.map(function (x, k) { return '<th style="' + U.th + 'text-align:right">' + U.esc(mshort(k, lg)) + '</th>'; }).join('') + '</tr></thead><tbody><tr>' + mo.v.map(function (x) { return '<td style="' + U.td + '">' + (x == null ? '–' : U.nf(x, 1)) + '</td>'; }).join('') + '</tr></tbody></table></div>';
    }
    return out + note(t, 'nProd');
  }
  function regView(a, lg, t) {
    var rows = a.rows, R = {}, k, out = '';
    rows.forEach(function (r) { R[r.c] = r; });
    if (!R[ST.line]) ST.line = R['14'] ? '14' : rows[0].c;
    var opts = rows.map(function (r) { return U.opt(r.c, r.c + ' · ' + nm(A, r.c, lg, r.name), ST.line); }).join('');
    out += U.sel('el-l', t.line, opts, ST.line);
    var r = R[ST.line], pos = {}; a.regions.forEach(function (x, j) { pos[x.id] = j; });
    var tot = r.v[pos.EL], list = [];
    a.regions.forEach(function (x, j) { if (x.level === 2 && r.v[j] != null) list.push([nm(RN, x.id, lg, x.name), r.v[j], tot ? U.nf(r.v[j] / tot * 100, 1) + ' %' : '']); });
    list.sort(function (p, q) { return q[1] - p[1]; });
    var dec = tot != null && Math.abs(tot) < 100 ? 1 : 0;
    out += '<div class="cof-cards">' + card(U.esc(t.nat + ' · ' + t.yr.replace('{y}', a.year)), tot == null ? '–' : U.nf(tot, dec) + ' M€');
    if (list.length && tot) out += card(U.esc(t.top), U.esc(list[0][0]), U.nf(list[0][1] / tot * 100, 1) + ' % ' + U.esc(t.share));
    out += '</div>';
    if (list.length) out += '<h3 class="cof-h3">' + U.esc(t.regions) + '</h3>' + U.bars(list, list[0][1] || 1, dec, 'M€');
    return out + note(t, 'nReg');
  }
  function geoView(g, lg, t) {
    var yk = String(g.year), Y = g.years[yk] || g.years[Object.keys(g.years).sort().pop()], A = g.areas, C = Y.crops, Lv = Y.livestock, ks = Object.keys(C).concat(Object.keys(Lv));
    if (ks.indexOf(ST.gi) < 0) ST.gi = ks[0];
    var live = !!Lv[ST.gi], e = live ? Lv[ST.gi] : C[ST.gi], hasA = !live && !!e.area;
    if (!hasA && ST.gm === 'area') ST.gm = 'prod';
    var v = live ? e.v : (ST.gm === 'area' && hasA ? e.area : e.prod), unit = live ? (e.unit === 'head' ? t.g_hd : t.g_t) : (ST.gm === 'area' && hasA ? 'ha' : t.g_t);
    var og = function (arr, cls) { return '<optgroup label="' + U.esc(cls) + '">' + arr.map(function (k) { return U.opt(k, nm(GL, k, lg, k), ST.gi); }).join('') + '</optgroup>'; };
    var out = U.sel('el-gi', t.g_ind, og(Object.keys(C), t.g_gC) + og(Object.keys(Lv), t.g_gL), ST.gi);
    if (hasA) out += U.sel('el-gm', t.g_met, U.opt('prod', t.g_mP, ST.gm) + U.opt('area', t.g_mA, ST.gm), ST.gm);
    out += '<div style="margin:6px 0 10px">' + U.chip(ST.gl === '1', 'el-gl', 'data-l="1"', t.g_lv1) + U.chip(ST.gl === '2', 'el-gl', 'data-l="2"', t.g_lv2) + '</div>';
    var tot = v[0], list = [], regName = {};
    A.forEach(function (a, j) { if (a.level === 1) regName[a.id] = GR[a.en] ? nm(RN, GR[a.en], lg, a.en) : a.en; });
    A.forEach(function (a, j) {
      if (a.level !== +ST.gl || v[j] == null) return;
      list.push([a.level === 1 ? regName[a.id] : a.en + ' (' + regName[a.parent] + ')', v[j], tot ? U.nf(v[j] / tot * 100, 1) + ' %' : '']);
    });
    list.sort(function (p, q) { return q[1] - p[1]; });
    var dec = tot != null && Math.abs(tot) < 100 ? 1 : 0, top = list.slice(0, 20);
    var cards = card(U.esc(t.g_nat + ' · ' + t.g_yr.replace('{y}', g.year)), tot == null ? '–' : U.nf(tot, dec) + ' ' + U.esc(unit), U.esc(nm(GL, ST.gi, lg, ST.gi)));
    if (list.length && tot) cards += card(U.esc(t.g_top), U.esc(list[0][0]), U.nf(list[0][1] / tot * 100, 1) + ' % ' + U.esc(t.g_share));
    if (hasA && e.area[0] && e.prod[0]) cards += card(U.esc(t.g_yld), U.nf(e.prod[0] / e.area[0], 2) + ' ' + U.esc(t.g_ha));
    out += '<div class="cof-cards">' + cards + '</div>';
    if (top.length) out += U.bars(top, top[0][1] || 1, dec, unit);
    return out + '<p class="cof-note" style="margin:10px 0 0">' + U.esc(t.g_note) + '</p>';
  }
  var VIEWS = {
    geo: function (d, lg, t) { return geoView(d.regions, lg, t); },
    out: function (d, lg, t) { return indexView(d.prices, lg, t, 'output'); },
    inp: function (d, lg, t) { return indexView(d.prices, lg, t, 'input'); },
    prod: function (d, lg, t) { return prodView(d.prices, lg, t); },
    reg: function (d, lg, t) { return regView(d.accounts, lg, t); }
  };
  function load() {
    if (D.p || D.a || D.g) return Promise.resolve(D);
    return Promise.all([U.json('data/el-elstat/prices.json'), U.json('data/el-elstat/accounts.json'), U.json('data/el-elstat/regions.json')]).then(function (r) { D = { prices: r[0], accounts: r[1], regions: r[2], p: !!r[0], a: !!r[1], g: !!r[2] }; return D; });
  }
  function mount(el, lg) {
    if (!el || !U) return Promise.resolve(false);
    lg = T[lg] ? lg : 'es';
    function draw(focus) {
      var t = T[lg];
      return load().then(function (d) {
        if (!d.p && !d.a && !d.g) { el.hidden = true; return false; }
        el.hidden = false;
        var tabs = Object.keys(T.es.tabs).filter(function (k) { return k === 'reg' ? d.a : k === 'geo' ? d.g : d.p; });
        if (tabs.indexOf(ST.tab) < 0) ST.tab = tabs[0];
        var chips = tabs.map(function (k) { return U.chip(k === ST.tab, 'el-tab', 'data-tab="' + k + '"', t.tabs[k]); }).join('');
        var body; try { body = VIEWS[ST.tab](d, lg, t); } catch (e) { body = '<p class="cof-note">' + U.esc(t.nodata) + '</p>'; }
        el.innerHTML = '<section class="di-card cof" id="ps-el-elstat" style="max-width:none"><h2 class="cof-h2">' + U.esc(t.h) + '</h2><div style="margin:6px 0 10px">' + chips + '</div>' + body + U.cite('elstat') + '</section>';
        if (focus) { var f = el.querySelector(focus); if (f) f.focus(); }
        return true;
      });
    }
    if (!el.getAttribute('data-el')) {
      el.setAttribute('data-el', '1');
      el.addEventListener('click', function (ev) { var b = ev.target.closest ? ev.target.closest('.el-tab') : null; if (b) { ST.tab = b.getAttribute('data-tab'); draw('.el-tab[data-tab="' + ST.tab + '"]'); return; } var l = ev.target.closest ? ev.target.closest('.el-gl') : null; if (l) { ST.gl = l.getAttribute('data-l'); draw('.el-gl[data-l="' + ST.gl + '"]'); } });
      el.addEventListener('change', function (ev) {
        var id = ev.target.id || '', v = ev.target.value;
        if (id === 'el-g') { if (ST.tab === 'inp') ST.ig = v; else ST.og = v; } else if (id === 'el-r') ST.rng = v; else if (id === 'el-p') ST.prod = v; else if (id === 'el-l') ST.line = v; else if (id === 'el-gi') ST.gi = v; else if (id === 'el-gm') ST.gm = v;
        draw('#' + id);
      });
    }
    return Promise.all([global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function () { return draw(); });
  }
  global.DIElElstat = { mount: mount };
})(window);
