/* Dehesa Index — ¿Quién produce qué en el mundo? (produccion-mundial.html). ES5.
   Fuente: USDA FAS PSD (data/supply-demand-map.json): producción por país de 13 productos, último año de campaña publicado.
   Cálculos propios, rotulados como tales: cuota sobre el total de los países publicados, ranking y variación frente a la campaña anterior.
   La UE figura como un único agregado (así lo publica el USDA) y se pinta en sus 27 países. Un dato ausente se muestra como ausente. */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var S = global.DehesaShared || {};
  function lg() { var l = S.getLang ? S.getLang() : 'es'; return IX[l] != null ? l : 'es'; }
  function tx(a) { return a[IX[lg()]]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { return v == null || isNaN(v) ? '—' : (+v).toLocaleString(LOC[lg()], { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pc(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }

  var T = {
    title: L('¿Quién produce qué en el mundo?', 'Who produces what in the world?', 'Qui produit quoi dans le monde ?', 'Chi produce cosa nel mondo?'),
    sub: L('Elige un producto y mira qué país lidera su producción; pulsa un país en el mapa para ver todo lo que produce. Datos oficiales del USDA y, para hortalizas y otros cultivos europeos, de Eurostat; siempre el último año publicado.',
           'Pick a product to see which country leads its production; click a country on the map to see everything it produces. Official data from the USDA and, for vegetables and other European crops, Eurostat; always the latest published year.',
           'Choisissez un produit pour voir quel pays en domine la production ; cliquez sur un pays de la carte pour voir tout ce qu’il produit. Données officielles de l’USDA et, pour les légumes et autres cultures européennes, d’Eurostat ; toujours la dernière année publiée.',
           'Scegli un prodotto per vedere quale paese ne guida la produzione; clicca un paese sulla mappa per vedere tutto ciò che produce. Dati ufficiali USDA e, per ortaggi e altre colture europee, Eurostat; sempre l’ultimo anno pubblicato.'),
    loading: L('Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'), fail: L('No se han podido cargar los datos. Vuelve a intentarlo más tarde.', 'The data could not be loaded. Please try again later.', 'Les données n’ont pas pu être chargées. Réessayez plus tard.', 'Impossibile caricare i dati. Riprova più tardi.'),
    bar: L('En esta página', 'On this page', 'Sur cette page', 'In questa pagina'),
    bars: { mapa: L('🗺️ Mapa', '🗺️ Map', '🗺️ Carte', '🗺️ Mappa'), lideres: L('🥇 Líderes', '🥇 Leaders', '🥇 Leaders', '🥇 Leader'), pais: L('🌍 País', '🌍 Country', '🌍 Pays', '🌍 Paese'), fuente: L('ℹ️ Fuente', 'ℹ️ Source', 'ℹ️ Source', 'ℹ️ Fonte') },
    country: L('País', 'Country', 'Pays', 'Paese'), view: { world: L('🌍 Mundo', '🌍 World', '🌍 Monde', '🌍 Mondo'), eu: L('🇪🇺 Europa', '🇪🇺 Europe', '🇪🇺 Europe', '🇪🇺 Europa') },
    grp: { cer: L('🌾 Cereales', '🌾 Cereals', '🌾 Céréales', '🌾 Cereali'), oil: L('🌱 Oleaginosas y aceites', '🌱 Oilseeds and oils', '🌱 Oléagineux et huiles', '🌱 Semi oleosi e oli'), meat: L('🥩 Carnes', '🥩 Meat', '🥩 Viandes', '🥩 Carni'), dairy: L('🥛 Lácteos', '🥛 Dairy', '🥛 Produits laitiers', '🥛 Latticini'), fruit: L('🍎 Frutas', '🍎 Fruit', '🍎 Fruits', '🍎 Frutta'), nuts: L('🌰 Frutos secos', '🌰 Tree nuts', '🌰 Fruits à coque', '🌰 Frutta secca'), other: L('☕ Café y algodón', '☕ Coffee and cotton', '☕ Café et coton', '☕ Caffè e cotone'), sugar: L('🍬 Azúcar', '🍬 Sugar', '🍬 Sucre', '🍬 Zucchero') },
    p: {
      trigo: L('Trigo', 'Wheat', 'Blé', 'Grano'), maiz: L('Maíz', 'Corn', 'Maïs', 'Mais'), arroz: L('Arroz', 'Rice', 'Riz', 'Riso'), cebada: L('Cebada', 'Barley', 'Orge', 'Orzo'),
      soja: L('Soja', 'Soybeans', 'Soja', 'Soia'), harina_soja: L('Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia'), colza: L('Colza', 'Rapeseed', 'Colza', 'Colza'), oliva: L('Aceite de oliva', 'Olive oil', 'Huile d’olive', 'Olio d’oliva'),
      vacuno: L('Vacuno', 'Beef', 'Bœuf', 'Manzo'), cerdo: L('Cerdo', 'Pork', 'Porc', 'Maiale'), pollo: L('Pollo', 'Chicken', 'Poulet', 'Pollo'), leche: L('Leche', 'Milk', 'Lait', 'Latte'), azucar: L('Azúcar', 'Sugar', 'Sucre', 'Zucchero'),
      avena: L('Avena', 'Oats', 'Avoine', 'Avena'), centeno: L('Centeno', 'Rye', 'Seigle', 'Segale'), sorgo: L('Sorgo', 'Sorghum', 'Sorgho', 'Sorgo'), mijo: L('Mijo', 'Millet', 'Millet', 'Miglio'),
      girasol: L('Girasol (pipa)', 'Sunflower seed', 'Tournesol (graine)', 'Girasole (seme)'), cacahuete: L('Cacahuete', 'Peanuts', 'Arachide', 'Arachidi'), aceite_palma: L('Aceite de palma', 'Palm oil', 'Huile de palme', 'Olio di palma'),
      aceite_soja: L('Aceite de soja', 'Soybean oil', 'Huile de soja', 'Olio di soia'), aceite_girasol: L('Aceite de girasol', 'Sunflower oil', 'Huile de tournesol', 'Olio di girasole'), aceite_colza: L('Aceite de colza', 'Rapeseed oil', 'Huile de colza', 'Olio di colza'),
      manzana: L('Manzana', 'Apples', 'Pommes', 'Mele'), pera: L('Pera', 'Pears', 'Poires', 'Pere'), melocoton: L('Melocotón y nectarina', 'Peaches and nectarines', 'Pêches et nectarines', 'Pesche e nettarine'), cereza: L('Cereza', 'Cherries', 'Cerises', 'Ciliegie'),
      uva_mesa: L('Uva de mesa', 'Table grapes', 'Raisin de table', 'Uva da tavola'), naranja: L('Naranja', 'Oranges', 'Oranges', 'Arance'), mandarina: L('Mandarina', 'Mandarins', 'Mandarines', 'Mandarini'), limon: L('Limón y lima', 'Lemons and limes', 'Citrons', 'Limoni e lime'), pomelo: L('Pomelo', 'Grapefruit', 'Pamplemousses', 'Pompelmi'),
      almendra: L('Almendra', 'Almonds', 'Amandes', 'Mandorle'), nuez: L('Nuez', 'Walnuts', 'Noix', 'Noci'), pistacho: L('Pistacho', 'Pistachios', 'Pistaches', 'Pistacchi'),
      cafe: L('Café', 'Coffee', 'Café', 'Caffè'), algodon: L('Algodón', 'Cotton', 'Coton', 'Cotone'), mantequilla: L('Mantequilla', 'Butter', 'Beurre', 'Burro'), queso: L('Queso', 'Cheese', 'Fromage', 'Formaggio'),
      leche_polvo_desnatada: L('Leche desnatada en polvo', 'Nonfat dry milk', 'Lait écrémé en poudre', 'Latte scremato in polvere'), leche_polvo_entera: L('Leche entera en polvo', 'Whole milk powder', 'Lait entier en poudre', 'Latte intero in polvere'),
      aceite_coco: L('Aceite de coco', 'Coconut oil', 'Huile de coco', 'Olio di cocco'), aceite_algodon: L('Aceite de algodón', 'Cottonseed oil', 'Huile de coton', 'Olio di semi di cotone'), aceite_cacahuete: L('Aceite de cacahuete', 'Peanut oil', 'Huile d’arachide', 'Olio di arachidi'), aceite_palmiste: L('Aceite de palmiste', 'Palm kernel oil', 'Huile de palmiste', 'Olio di palmisto'),
      harina_colza: L('Harina de colza', 'Rapeseed meal', 'Tourteau de colza', 'Farina di colza'), harina_girasol: L('Harina de girasol', 'Sunflower meal', 'Tourteau de tournesol', 'Farina di girasole'), semilla_algodon: L('Semilla de algodón', 'Cottonseed', 'Graine de coton', 'Semi di cotone')
    },
    euNote: L('Los productos de las secciones de hortalizas, leguminosas y los marcados como europeos (p. ej. avellana, castaña, patata) vienen de Eurostat (apro_cpsh1, producción cosechada) y cubren solo los países europeos que publican dato, no todo el mundo: el puesto y la cuota son sobre ese conjunto. Cada producto usa el último año en que publican los grandes productores.', 'Products in the vegetables and pulses sections and those marked as European (e.g. hazelnuts, chestnuts, potatoes) come from Eurostat (apro_cpsh1, harvested production) and cover only the European countries that publish data, not the whole world: rank and share are within that set. Each product uses the latest year in which the large producers publish.', 'Les produits des sections légumes et légumineuses et ceux marqués comme européens (p. ex. noisettes, châtaignes, pommes de terre) viennent d’Eurostat (apro_cpsh1, production récoltée) et ne couvrent que les pays européens qui publient, pas le monde entier : le rang et la part portent sur cet ensemble. Chaque produit utilise la dernière année où les grands producteurs publient.', 'I prodotti delle sezioni ortaggi e legumi e quelli indicati come europei (p. es. nocciole, castagne, patate) provengono da Eurostat (apro_cpsh1, produzione raccolta) e coprono solo i paesi europei che pubblicano dati, non il mondo intero: posizione e quota riguardano questo insieme. Ogni prodotto usa l’ultimo anno in cui pubblicano i grandi produttori.'),
    leader: L('Líder mundial', 'World leader', 'Leader mondial', 'Leader mondiale'), share: L('del total mundial', 'of the world total', 'du total mondial', 'del totale mondiale'),
    leaderEu: L('Líder en Europa', 'European leader', 'Leader européen', 'Leader europeo'), shareEu: L('del total europeo', 'of the European total', 'du total européen', 'del totale europeo'),
    worldEu: L('Total de los países europeos publicados', 'Total of the European countries published', 'Total des pays européens publiés', 'Totale dei paesi europei pubblicati'),
    fcst: L('previsión USDA', 'USDA forecast', 'prévision USDA', 'previsione USDA'),
    world: L('Total de los países publicados', 'Total of the countries published', 'Total des pays publiés', 'Totale dei paesi pubblicati'), my: L('Campaña', 'Marketing year', 'Campagne', 'Campagna'),
    top10: L('🏆 Los 10 mayores productores', '🏆 The 10 largest producers', '🏆 Les 10 plus grands producteurs', '🏆 I 10 maggiori produttori'), vs: L('vs campaña anterior', 'vs previous year', 'vs campagne précédente', 'vs campagna precedente'),
    nodata: L('sin dato', 'no data', 'sans donnée', 'nessun dato'), clk: L('Pulsa para ver lo que produce', 'Click to see what it produces', 'Cliquez pour voir ce qu’il produit', 'Clicca per vedere cosa produce'),
    nope: L('no produce este producto en los datos del USDA', 'does not produce this product in the USDA data', 'ne produit pas ce produit dans les données USDA', 'non produce questo prodotto nei dati USDA'),
    leadersT: L('🥇 Líderes por producto', '🥇 Leaders by product', '🥇 Leaders par produit', '🥇 Leader per prodotto'),
    leadersS: L('Los tres mayores productores de cada producto y su cuota sobre el total mundial. Pulsa una fila para verla en el mapa.', 'The three largest producers of each product and their share of the world total. Click a row to see it on the map.', 'Les trois plus grands producteurs de chaque produit et leur part du total mondial. Cliquez sur une ligne pour la voir sur la carte.', 'I tre maggiori produttori di ogni prodotto e la loro quota sul totale mondiale. Clicca una riga per vederla sulla mappa.'),
    hProd: L('Producto', 'Product', 'Produit', 'Prodotto'), hWorld: L('Producción mundial', 'World production', 'Production mondiale', 'Produzione mondiale'),
    paisT: L('🌍 Qué produce', '🌍 What it produces', '🌍 Ce qu’il produit', '🌍 Cosa produce'), paisS: L('Puesto mundial y cuota de cada producto del que el USDA publica datos para este país.', 'World rank and share of every product for which the USDA publishes data for this country.', 'Rang mondial et part de chaque produit pour lequel l’USDA publie des données sur ce pays.', 'Posto mondiale e quota di ogni prodotto per cui l’USDA pubblica dati su questo paese.'),
    viaEU: L('El USDA publica estos productos para la Unión Europea en conjunto, no país a país: las cifras y el puesto (🇪🇺) son los de la UE entera.', 'The USDA publishes these products for the European Union as a whole, not country by country: the figures and rank (🇪🇺) are those of the whole EU.', 'L’USDA publie ces produits pour l’Union européenne dans son ensemble, pas pays par pays : les chiffres et le rang (🇪🇺) sont ceux de toute l’UE.', 'L’USDA pubblica questi prodotti per l’Unione europea nel suo insieme, non paese per paese: cifre e posto (🇪🇺) sono quelli dell’intera UE.'),
    leadsIn: L('Es líder mundial en', 'World leader in', 'Leader mondial en', 'Leader mondiale in'), noLead: L('No lidera ninguno de estos productos.', 'It does not lead any of these products.', 'Il ne domine aucun de ces produits.', 'Non guida nessuno di questi prodotti.'),
    hRank: L('Puesto', 'Rank', 'Rang', 'Posto'), hVol: L('Producción', 'Production', 'Production', 'Produzione'), hShare: L('Cuota mundial', 'World share', 'Part mondiale', 'Quota mondiale'),
    fruitT: L('🍅 ¿Y las hortalizas y otras frutas?', '🍅 What about vegetables and other fruit?', '🍅 Et les légumes et les autres fruits ?', '🍅 E gli ortaggi e altra frutta?'),
    fruitN: L('El USDA sigue en este apartado unos pocos países por producto (los que más pesan en el comercio), así que en frutas y frutos secos el líder es el mayor de los países que el USDA publica, no necesariamente de todo el planeta. Tomate, patata, cebolla, plátano o aguacate no están en esta fuente y no se estiman: la producción europea de fruta y hortaliza por país está en la ficha de cada país.',
              'For each product the USDA tracks a limited set of countries (the ones that weigh most in trade), so for fruit and tree nuts the leader is the largest of the countries the USDA publishes, not necessarily of the whole planet. Tomato, potato, onion, banana or avocado are not in this source and are not estimated: European fruit and vegetable output by country is on each country profile.',
              'Pour chaque produit l’USDA suit un nombre limité de pays (ceux qui pèsent le plus dans le commerce) : pour les fruits et fruits à coque, le leader est donc le plus grand des pays publiés par l’USDA, pas forcément de toute la planète. Tomate, pomme de terre, oignon, banane ou avocat ne figurent pas dans cette source et ne sont pas estimés : la production européenne de fruits et légumes par pays figure sur la fiche de chaque pays.',
              'Per ogni prodotto l’USDA segue un numero limitato di paesi (quelli che pesano di più nel commercio): per frutta e frutta secca il leader è quindi il maggiore tra i paesi pubblicati dall’USDA, non necessariamente di tutto il pianeta. Pomodoro, patata, cipolla, banana o avocado non sono in questa fonte e non vengono stimati: la produzione europea di frutta e ortaggi per paese è nella scheda di ciascun paese.'),
    fiche: L('Ficha del país', 'Country profile', 'Fiche pays', 'Scheda paese'), mapL: L('Ver en el mapa agrícola', 'See on the farm map', 'Voir sur la carte agricole', 'Vedi sulla mappa agricola'),
    unitCarcass: L('peso en canal', 'carcass weight', 'poids en carcasse', 'peso in carcassa'),
    note: L('Fuente: USDA FAS, PSD Online (informe mensual WASDE). La cuota y el puesto son cálculos de Dehesa Index sobre los países que publica el USDA; la UE cuenta como un único productor. Millones de toneladas (Mt); carnes en peso en canal; café y algodón convertidos de sacos de 60 kg y balas de 480 libras a toneladas.', 'Source: USDA FAS, PSD Online (monthly WASDE report). Share and rank are Dehesa Index calculations over the countries the USDA publishes; the EU counts as a single producer. Million tonnes (Mt); meat in carcass weight; coffee and cotton converted from 60 kg bags and 480 lb bales to tonnes.', 'Source : USDA FAS, PSD Online (rapport mensuel WASDE). La part et le rang sont des calculs de Dehesa Index sur les pays publiés par l’USDA ; l’UE compte comme un seul producteur. Millions de tonnes (Mt) ; viandes en poids carcasse ; café et coton convertis de sacs de 60 kg et balles de 480 lb en tonnes.', 'Fonte: USDA FAS, PSD Online (rapporto mensile WASDE). Quota e posto sono calcoli di Dehesa Index sui paesi pubblicati dall’USDA; la UE conta come un unico produttore. Milioni di tonnellate (Mt); carni in peso in carcassa; caffè e cotone convertiti da sacchi da 60 kg e balle da 480 lb in tonnellate.')
  };
  var ORDER = [['cer', ['trigo', 'maiz', 'arroz', 'cebada', 'avena', 'centeno', 'sorgo', 'mijo']], ['fruit', ['manzana', 'pera', 'melocoton', 'cereza', 'uva_mesa', 'naranja', 'mandarina', 'limon', 'pomelo']], ['nuts', ['almendra', 'nuez', 'pistacho']], ['oil', ['soja', 'harina_soja', 'colza', 'girasol', 'cacahuete', 'oliva', 'aceite_palma', 'aceite_soja', 'aceite_girasol', 'aceite_colza', 'aceite_coco', 'aceite_algodon', 'aceite_cacahuete', 'aceite_palmiste', 'harina_colza', 'harina_girasol', 'semilla_algodon']], ['meat', ['vacuno', 'cerdo', 'pollo']], ['dairy', ['leche', 'mantequilla', 'queso', 'leche_polvo_desnatada', 'leche_polvo_entera']], ['sugar', ['azucar']], ['other', ['cafe', 'algodon']]];
  var EMO = { trigo: '🌾', maiz: '🌽', arroz: '🍚', cebada: '🍺', soja: '🫘', harina_soja: '🌱', colza: '🌼', oliva: '🫒', avena: '🥣', centeno: '🌾', sorgo: '🌿', mijo: '🌾', girasol: '🌻', cacahuete: '🥜', aceite_palma: '🌴', aceite_soja: '🫘', aceite_girasol: '🌻', aceite_colza: '🌼', manzana: '🍎', pera: '🍐', melocoton: '🍑', cereza: '🍒', uva_mesa: '🍇', naranja: '🍊', mandarina: '🍊', limon: '🍋', pomelo: '🍊', almendra: '🌰', nuez: '🌰', pistacho: '🥜', cafe: '☕', algodon: '☁️', mantequilla: '🧈', leche_polvo_desnatada: '🥛', leche_polvo_entera: '🥛', aceite_coco: '🥥', aceite_algodon: '☁️', aceite_cacahuete: '🥜', aceite_palmiste: '🌴', harina_colza: '🌼', harina_girasol: '🌻', semilla_algodon: '☁️', queso: '🧀', vacuno: '🐄', cerdo: '🐖', pollo: '🐔', leche: '🥛', azucar: '🍬' };

  /* Productos de Eurostat (apro_cpsh1, producción cosechada por país europeo): los que el USDA no publica. [es, en, fr, it, emoji, grupo] */
  var EUP = {
    F4200: ['Avellana', 'Hazelnuts', 'Noisettes', 'Nocciole', '🌰', 'nuts'], F4400: ['Castaña', 'Chestnuts', 'Châtaignes', 'Castagne', '🌰', 'nuts'],
    F1230: ['Albaricoque', 'Apricots', 'Abricots', 'Albicocche', '🍑', 'fruit'], F1250: ['Ciruela', 'Plums', 'Prunes', 'Prugne', '🟣', 'fruit'], F2100: ['Higo', 'Figs', 'Figues', 'Fichi', '🟣', 'fruit'],
    F2200: ['Kiwi', 'Kiwis', 'Kiwis', 'Kiwi', '🥝', 'fruit'], F2300: ['Aguacate', 'Avocados', 'Avocats', 'Avocado', '🥑', 'fruit'], F2400: ['Plátano', 'Bananas', 'Bananes', 'Banane', '🍌', 'fruit'],
    F3200: ['Frambuesa', 'Raspberries', 'Framboises', 'Lamponi', '🍓', 'fruit'], F3300: ['Arándano', 'Blueberries', 'Myrtilles', 'Mirtilli', '🫐', 'fruit'],
    W1000: ['Uva (total)', 'Grapes (total)', 'Raisin (total)', 'Uva (totale)', '🍇', 'fruit'], W1100: ['Uva para vino', 'Wine grapes', 'Raisin de cuve', 'Uva da vino', '🍷', 'fruit'],
    O1100: ['Aceituna de mesa', 'Table olives', 'Olives de table', 'Olive da tavola', '🫒', 'oil'], O1910: ['Aceituna para aceite', 'Olives for oil', 'Olives à huile', 'Olive da olio', '🫒', 'oil'],
    V3100: ['Tomate', 'Tomatoes', 'Tomates', 'Pomodori', '🍅', 'veg'], V3600: ['Pimiento', 'Peppers', 'Poivrons', 'Peperoni', '🫑', 'veg'], V3200_V3300: ['Pepino', 'Cucumbers', 'Concombres', 'Cetrioli', '🥒', 'veg'],
    V3410: ['Berenjena', 'Eggplants', 'Aubergines', 'Melanzane', '🍆', 'veg'], V3420: ['Calabacín', 'Courgettes', 'Courgettes', 'Zucchine', '🥒', 'veg'], V3520: ['Sandía', 'Watermelons', 'Pastèques', 'Angurie', '🍉', 'veg'],
    V3510: ['Melón', 'Melons', 'Melons', 'Meloni', '🍈', 'veg'], V4100: ['Zanahoria', 'Carrots', 'Carottes', 'Carote', '🥕', 'veg'], V4200: ['Cebolla y chalota', 'Onions and shallots', 'Oignons et échalotes', 'Cipolle e scalogni', '🧅', 'veg'],
    V4600: ['Ajo', 'Garlic', 'Ail', 'Aglio', '🧄', 'veg'], V2300: ['Lechuga', 'Lettuces', 'Laitues', 'Lattughe', '🥬', 'veg'], V2500: ['Espinaca', 'Spinach', 'Épinards', 'Spinaci', '🥬', 'veg'],
    V2600: ['Espárrago', 'Asparagus', 'Asperges', 'Asparagi', '🌿', 'veg'], V2800: ['Alcachofa', 'Artichokes', 'Artichauts', 'Carciofi', '🌿', 'veg'], V1100: ['Coliflor y brócoli', 'Cauliflower and broccoli', 'Chou-fleur et brocoli', 'Cavolfiore e broccoli', '🥦', 'veg'],
    V1300: ['Col', 'Cabbages', 'Choux', 'Cavoli', '🥬', 'veg'], V2100: ['Puerro', 'Leeks', 'Poireaux', 'Porri', '🌿', 'veg'], V4300: ['Remolacha roja', 'Beetroot', 'Betteraves rouges', 'Barbabietole rosse', '🟣', 'veg'],
    V5100: ['Guisante fresco', 'Fresh peas', 'Petits pois', 'Piselli freschi', '🫛', 'veg'], V5200: ['Judía verde', 'Fresh beans', 'Haricots verts', 'Fagiolini', '🫛', 'veg'], U1100: ['Champiñón', 'Mushrooms', 'Champignons', 'Funghi coltivati', '🍄', 'veg'],
    R1000: ['Patata', 'Potatoes', 'Pommes de terre', 'Patate', '🥔', 'veg'], R2000: ['Remolacha azucarera', 'Sugar beet', 'Betterave sucrière', 'Barbabietola da zucchero', '🍬', 'veg'],
    P1100: ['Guisante seco', 'Field peas', 'Pois protéagineux', 'Pisello proteico', '🫛', 'pulse'], P1200: ['Haba', 'Broad beans', 'Fèves', 'Fave', '🫘', 'pulse'], P1300: ['Altramuz dulce', 'Sweet lupins', 'Lupins doux', 'Lupini dolci', '🫘', 'pulse'],
    P9100: ['Lenteja', 'Lentils', 'Lentilles', 'Lenticchie', '🫘', 'pulse'], P9200: ['Garbanzo', 'Chickpeas', 'Pois chiches', 'Ceci', '🫘', 'pulse'], P9400: ['Veza', 'Vetches', 'Vesces', 'Vecce', '🫘', 'pulse'],
    C1120: ['Trigo duro', 'Durum wheat', 'Blé dur', 'Grano duro', '🌾', 'cer'], C1600: ['Triticale', 'Triticale', 'Triticale', 'Triticale', '🌾', 'cer'], G2100: ['Alfalfa', 'Lucerne', 'Luzerne', 'Erba medica', '🌿', 'pulse'],
    G3000: ['Maíz forrajero', 'Green maize', 'Maïs fourrage', 'Mais da foraggio', '🌽', 'cer'], I1140: ['Lino (linaza)', 'Linseed', 'Lin oléagineux', 'Lino da olio', '🌾', 'oil'],
    I2100: ['Lino textil', 'Fibre flax', 'Lin textile', 'Lino tessile', '🌾', 'other'], I2200: ['Cáñamo', 'Hemp', 'Chanvre', 'Canapa', '🌿', 'other'], I4000: ['Lúpulo', 'Hops', 'Houblon', 'Luppolo', '🍺', 'other'], I3000: ['Tabaco', 'Tobacco', 'Tabac', 'Tabacco', '🌿', 'other']
  };
  var EUG = { veg: L('🥕 Hortalizas y patata (Europa)', '🥕 Vegetables and potatoes (Europe)', '🥕 Légumes et pommes de terre (Europe)', '🥕 Ortaggi e patate (Europa)'), pulse: L('🫘 Leguminosas y forrajes (Europa)', '🫘 Pulses and fodder (Europe)', '🫘 Légumineuses et fourrages (Europe)', '🫘 Legumi e foraggi (Europa)') };
  function eurostat(doc) {
    var out = [];
    (doc.crops || []).forEach(function (c) {
      var m = EUP[c.code]; if (!m) return; var cs = {};
      Object.keys(c.countries).forEach(function (k) {
        if (k === 'EU') return; var ys = {}, any = false;
        Object.keys(c.countries[k]).forEach(function (y) { var v = c.countries[k][y]; if (v != null) { ys[y] = { production: v / 1000 }; any = true; } });
        if (any) cs[k === 'EL' ? 'GR' : k] = { name: k, years: ys };
      });
      out.push({ id: 'eu_' + c.code, unit: '1000 MT', latestMarketYear: +c.latestYear, countries: cs, euOnly: true });
      T.p['eu_' + c.code] = L(m[0], m[1], m[2], m[3]); EMO['eu_' + c.code] = m[4];
      var g = ORDER.filter(function (o) { return o[0] === m[5]; })[0];
      if (!g) { T.grp[m[5]] = EUG[m[5]]; g = [m[5], []]; ORDER.splice(ORDER.length - 2, 0, g); }
      g[1].push('eu_' + c.code);
    });
    return out;
  }
  var EU27 = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
  var SEQ = ['#e9efdf', '#c6dbb4', '#93bd86', '#549362', '#1f6b3f'], NONE = '#e6e2d6';
  var D = null, SEL = { p: 'trigo', c: 'US', v: 'world' }, MAP = null, STATS = {}, CUTS = [];

  function getJSON(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function comm(id) { for (var i = 0; i < D.commodities.length; i++) if (D.commodities[i].id === id) return D.commodities[i]; return null; }
  /* Factor para llevar la unidad de PSD a miles de toneladas: '1000 MT' = 1; 'MT' = 0,001; sacos de 60 kg y balas de 480 lb, por su peso. */
  function kt(unit) { var u = String(unit || ''); if (/60 KG/i.test(u)) return 0.06; if (/480/.test(u)) return 0.21772; return /^1000/.test(u) ? 1 : 0.001; }
  var CAL = { vacuno: 1, cerdo: 1, pollo: 1, leche: 1, mantequilla: 1, queso: 1 };
  function myLabel(id, y) { return CAL[id] || /^eu_/.test(id) ? String(y) : y + '/' + String((+y + 1) % 100 + 100).slice(1); }
  function yrs(c) { var ys = {}; Object.keys(c.countries).forEach(function (k) { Object.keys(c.countries[k].years || {}).forEach(function (y) { ys[y] = 1; }); }); return Object.keys(ys).sort(); }
  /* Ranking de un producto: cada país con su producción en el último año con dato y la del año anterior. */
  function stats(id) {
    if (STATS[id]) return STATS[id];
    var c = comm(id); if (!c) return null;
    var ys = yrs(c), f = kt(c.unit), last = String(c.latestMarketYear || ys[ys.length - 1]), prev, rows = [], tot = 0;
    function sum(y) { var t = 0; Object.keys(c.countries).forEach(function (k) { var o = c.countries[k].years || {}; t += (o[y] && o[y].production) || 0; }); return t; }
    /* Si la campaña más reciente aún está incompleta (menos del 90 % de la anterior), se usa la anterior. */
    if (sum(+last - 1) > 0 && sum(last) < 0.9 * sum(+last - 1)) last = String(+last - 1);
    prev = String(+last - 1);
    Object.keys(c.countries).forEach(function (k) {
      var y = c.countries[k].years || {}, a = y[last] && y[last].production, b = y[prev] && y[prev].production;
      if (a != null && a > 0) { rows.push({ k: k, v: a * f, pv: b == null ? null : b * f, name: c.countries[k].name }); tot += a * f; }
    });
    rows.sort(function (x, y) { return y.v - x.v; }); rows.forEach(function (r, i) { r.rank = i + 1; r.share = tot ? 100 * r.v / tot : null; });
    return STATS[id] = { id: id, unit: c.unit, last: last, fc: !c.euOnly && +last >= +c.latestMarketYear,  rows: rows, tot: tot, by: rows.reduce(function (m, r) { m[r.k] = r; return m; }, {}) };
  }
  /* Vista Europa: solo países europeos (la UE cuenta como un bloque, como publica el USDA), con su propio ranking y cuota. */
  var EUROPE = ['EU', 'UK', 'UA', 'RU', 'RS', 'BY', 'MD', 'AL', 'BA', 'MK', 'ME', 'NO', 'CH', 'XK', 'IS'];
  function vstats(id) {
    var st = stats(id); if (!st || SEL.v !== 'eu') return st;
    var key = id + '|eu'; if (STATS[key]) return STATS[key];
    var eo = comm(id) && comm(id).euOnly, rows = st.rows.filter(function (r) { return eo || EUROPE.indexOf(r.k) >= 0; }).map(function (r) { return { k: r.k, v: r.v, pv: r.pv, name: r.name }; }), tot = 0;
    rows.forEach(function (r) { tot += r.v; }); rows.forEach(function (r, i) { r.rank = i + 1; r.share = tot ? 100 * r.v / tot : null; });
    return STATS[key] = { id: st.id, unit: st.unit, last: st.last, fc: st.fc, rows: rows, tot: tot, by: rows.reduce(function (m, r) { m[r.k] = r; return m; }, {}) };
  }
  function iso(k) { return k === 'UK' ? 'GB' : k; }
  function flag(k) { var c = iso(k); return /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(127397 + c.charCodeAt(0), 127397 + c.charCodeAt(1)) + ' ' : '🏳️ '; }
  function cname(k, fb) {
    if (k === 'EU') return tx(L('Unión Europea', 'European Union', 'Union européenne', 'Unione europea'));
    try { var n = new Intl.DisplayNames([LOC[lg()]], { type: 'region' }).of(iso(k)); if (n && n !== iso(k)) return n; } catch (e) { /* sin Intl.DisplayNames */ }
    return fb || k;
  }
  function mt(v) { return v >= 1000 ? nf(v / 1000, v >= 10000 ? 0 : 1) + ' Mt' : nf(v, v >= 100 ? 0 : 1) + ' ' + tx(L('mil t', 'k t', 'kt', 'mila t')); }
  function chg(v) { if (v == null) return '<span class="cp-m">—</span>'; var up = v > 0.049, dn = v < -0.049; return '<span class="cp-chg ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲ +' : dn ? '▼ −' : '■ ') + nf(Math.abs(v), 1) + ' %</span>'; }
  function medal(n) { return n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : n + '.'; }
  function eoOnly(id) { var c = comm(id); return !!(c && c.euOnly); }
  function pname(id) { return tx(T.p[id]); }

  function classify() {
    var st = vstats(SEL.p), arr = st.rows.map(function (r) { return r.v; }).sort(function (a, b) { return a - b; });
    CUTS = [0.4, 0.65, 0.85, 0.95].map(function (q) { return arr.length ? arr[Math.min(arr.length - 1, Math.floor(q * arr.length))] : 0; });
  }
  function colorOf(v) { var k = 0; while (k < CUTS.length && v >= CUTS[k]) k++; return SEQ[k]; }

  function drawMap() {
    var host = document.getElementById('pm-map'); if (!host) return;
    if (MAP) { try { MAP.destroy(); } catch (e) { /* ya destruido */ } MAP = null; }
    host.innerHTML = '';
    if (typeof global.jsVectorMap !== 'function') { host.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; return; }
    var st = vstats(SEL.p);
    function key(code) { return EU27.indexOf(code) >= 0 && st.by.EU ? 'EU' : (code === 'GB' ? 'UK' : code); }
    try {
      MAP = new global.jsVectorMap({
        selector: '#pm-map', map: 'world', backgroundColor: 'transparent', zoomButtons: true, zoomOnScroll: false, showTooltip: true,
        regionStyle: { initial: { fill: NONE, stroke: '#c8c3b4', strokeWidth: 0.4, fillOpacity: 1 }, hover: { fillOpacity: 0.8 } },
        onRegionTooltipShow: function (e, tip, code) {
          var k = key(code), r = st.by[k], h = '<strong>' + esc(cname(k)) + '</strong>';
          if (r) h += '<br>' + esc(pname(SEL.p)) + ': ' + esc(mt(r.v)) + ' · ' + nf(r.share, 1) + ' %<br>' + esc(tx(T.clk)); else h += '<br>' + esc(tx(T.nodata)) + '<br>' + esc(tx(T.clk));
          tip.text(h, true);
        },
        onRegionClick: function (e, code) { pick(key(code)); }
      });
      try { if (SEL.v === 'eu') MAP.setFocus({ coords: [52, 12], scale: 3.6, animate: false }); } catch (e) { /* sin foco */ }
      paint();
    } catch (e) { MAP = null; host.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; }
  }
  function paint() {
    if (!MAP || !MAP.regions) return;
    var st = vstats(SEL.p);
    Object.keys(MAP.regions).forEach(function (code) {
      var k = EU27.indexOf(code) >= 0 && st.by.EU ? 'EU' : (code === 'GB' ? 'UK' : code), r = st.by[k], el = MAP.regions[code] && MAP.regions[code].element; if (!el) return;
      var sel = k === SEL.c;
      try { el.setStyle('fill', r ? colorOf(r.v) : NONE); el.setStyle('stroke', sel ? '#1b1b1b' : '#c8c3b4'); el.setStyle('strokeWidth', sel ? 1.6 : 0.4); } catch (e) { /* región sin estilo */ }
    });
    var lg2 = document.getElementById('pm-legend'); if (!lg2) return;
    var f = function (v) { return mt(v); }, lab = ['< ' + f(CUTS[0])]; for (var k = 1; k < CUTS.length; k++) lab.push(f(CUTS[k - 1]) + ' – ' + f(CUTS[k])); lab.push('> ' + f(CUTS[CUTS.length - 1]));
    lg2.innerHTML = SEQ.map(function (c, k) { return '<span class="cp-lg"><i style="background:' + c + '"></i>' + esc(lab[k]) + '</span>'; }).join('') + '<span class="cp-lg"><i style="background:' + NONE + '"></i>' + esc(tx(T.nodata)) + '</span>';
  }

  function chips(items, cur, attr) { return items.map(function (it) { return '<button type="button" class="cp-chip" data-' + attr + '="' + it[0] + '" aria-pressed="' + (it[0] === cur ? 'true' : 'false') + '">' + esc(it[1]) + '</button>'; }).join(''); }
  function productChips() {
    return ORDER.map(function (g) {
      return '<div class="pm-pg"><span class="cp-lab">' + esc(tx(T.grp[g[0]])) + '</span><span class="cp-seg">' + chips(g[1].filter(function (id) { return !!stats(id); }).map(function (id) { return [id, EMO[id] + ' ' + pname(id)]; }), SEL.p, 'p') + '</span></div>';
    }).join('');
  }
  function leaderPanel() {
    var st = vstats(SEL.p), ld = st.rows[0]; if (!ld) return '';
    var top = st.rows.slice(0, 10), max = top[0].v;
    var list = '<ol class="pm-top">' + top.map(function (r) {
      return '<li class="' + (r.k === SEL.c ? 'pm-on' : '') + '"><button type="button" class="cp-lk" data-cc="' + r.k + '">' + medal(r.rank) + ' ' + esc(flag(r.k) + cname(r.k, r.name)) + '</button><span class="pm-bar"><i style="width:' + (100 * r.v / max).toFixed(1) + '%"></i></span><b>' + esc(mt(r.v)) + '</b><span class="cp-m">' + nf(r.share, 1) + ' %</span>' + chg(pc(r.v, r.pv)) + '</li>';
    }).join('') + '</ol>';
    var unit = /CWE/.test(st.unit) ? ' · ' + tx(T.unitCarcass) : '';
    return '<div class="pm-hd"><span class="pm-emo" aria-hidden="true">' + EMO[SEL.p] + '</span> ' + esc(pname(SEL.p)) + '<span class="cp-m"> · ' + esc(tx(T.my)) + ' ' + esc(myLabel(SEL.p, st.last)) + esc(st.fc ? ' · ' + tx(T.fcst) : '') + esc(unit) + '</span></div>' +
      '<div class="pm-lead"><div class="cp-tl">' + esc(tx((SEL.v === 'eu' || eoOnly(SEL.p)) ? T.leaderEu : T.leader)) + '</div><div class="pm-lv">🥇 ' + esc(flag(ld.k) + cname(ld.k, ld.name)) + '</div><div class="cp-ts"><b>' + nf(ld.share, 1) + ' %</b> ' + esc(tx((SEL.v === 'eu' || eoOnly(SEL.p)) ? T.shareEu : T.share)) + ' · ' + esc(mt(ld.v)) + ' ' + chg(pc(ld.v, ld.pv)) + ' <span class="cp-m">' + esc(tx(T.vs)) + '</span></div></div>' +
      '<div class="cp-pk">' + esc(tx((SEL.v === 'eu' || eoOnly(SEL.p)) ? T.worldEu : T.world)) + ': <b>' + esc(mt(st.tot)) + '</b></div><h3 class="cp-h3">' + esc(tx(T.top10)) + '</h3>' + list;
  }
  function leadersTable() {
    var rows = '';
    ORDER.forEach(function (g) {
      rows += '<tr class="pm-grp"><td colspan="5">' + esc(tx(T.grp[g[0]])) + '</td></tr>';
      g[1].forEach(function (id) {
        var st = stats(id); if (!st || !st.rows.length) return;
        var cell = function (r) { return r ? '<button type="button" class="cp-lk" data-cc="' + r.k + '" data-pp="' + id + '">' + esc(flag(r.k) + cname(r.k, r.name)) + '</button> <span class="cp-m">' + nf(r.share, 0) + ' %</span>' : '—'; };
        rows += '<tr class="pm-prow" data-pr="' + id + '"><td><button type="button" class="cp-lk pm-pl" data-pr="' + id + '">' + EMO[id] + ' <b>' + esc(pname(id)) + '</b></button></td><td>🥇 ' + cell(st.rows[0]) + '</td><td>🥈 ' + cell(st.rows[1]) + '</td><td>🥉 ' + cell(st.rows[2]) + '</td><td class="num">' + esc(mt(st.tot)) + '</td></tr>';
      });
    });
    return '<section id="pm-lideres" class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.leadersT)) + '</h2><p class="di-movers-hint">' + esc(tx(T.leadersS)) + '</p><div class="di-table-wrap"><table class="di-table cp-tbl pm-lt"><thead><tr><th>' + esc(tx(T.hProd)) + '</th><th>🥇</th><th>🥈</th><th>🥉</th><th class="num">' + esc(tx(T.hWorld)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }
  function countrySection() {
    var k = SEL.c, rows = [], leads = [];
    var viaEU = false;
    D.commodities.forEach(function (c) { var st = stats(c.id), own = st && st.by[k], r = own || (st && EU27.indexOf(k) >= 0 ? st.by.EU : null); if (r) { if (!own) viaEU = true; rows.push({ id: c.id, r: r, st: st, eu: !own }); if (r.rank === 1 && own) leads.push(c.id); } });
    rows.sort(function (a, b) { return a.r.rank - b.r.rank; });
    var tb = rows.map(function (x) { return '<tr><td><button type="button" class="cp-lk" data-pr="' + x.id + '">' + EMO[x.id] + ' ' + esc(pname(x.id)) + '</button></td><td class="num">' + (x.eu ? '🇪🇺 ' : '') + medal(x.r.rank) + ' <span class="cp-m">' + esc(tx(T.of || L('de', 'of', 'sur', 'su'))) + ' ' + x.st.rows.length + '</span></td><td class="num">' + esc(mt(x.r.v)) + '</td><td class="num">' + nf(x.r.share, 1) + ' %</td><td class="num">' + chg(pc(x.r.v, x.r.pv)) + '</td></tr>'; }).join('');
    var lead = leads.length ? '<p class="pm-leads"><b>' + esc(tx(T.leadsIn)) + ':</b> ' + leads.map(function (id) { return EMO[id] + ' ' + esc(pname(id)); }).join(' · ') + '</p>' : '<p class="di-movers-hint">' + esc(tx(T.noLead)) + '</p>';
    if (viaEU) lead = '<p class="di-movers-hint">' + esc(tx(T.viaEU)) + '</p>' + lead;
    var ln = [['paises.html?c=' + (k === 'EU' ? 'EU' : k), '🧭', tx(T.fiche)], ['mapa.html', '🗺️', tx(T.mapL)]];
    return '<section id="pm-pais" class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.paisT)) + ' · ' + esc(flag(k) + cname(k)) + '</h2><p class="di-movers-hint">' + esc(tx(T.paisS)) + '</p>' + (rows.length ? lead + '<div class="di-table-wrap"><table class="di-table cp-tbl"><thead><tr><th>' + esc(tx(T.hProd)) + '</th><th class="num">' + esc(tx(T.hRank)) + '</th><th class="num">' + esc(tx(T.hVol)) + '</th><th class="num">' + esc(tx(T.hShare)) + '</th><th class="num">' + esc(tx(T.vs)) + '</th></tr></thead><tbody>' + tb + '</tbody></table></div>' : '<p class="di-movers-hint">' + esc(tx(T.nodata)) + '</p>') +
      '<div class="cp-links">' + ln.map(function (l) { return '<a class="cp-link" href="' + esc(l[0]) + '"><span aria-hidden="true">' + l[1] + '</span> ' + esc(l[2]) + '</a>'; }).join('') + '</div></section>';
  }
  function sourceSection() {
    return '<section id="pm-fuente" class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.fruitT)) + '</h2><p class="di-movers-hint">' + esc(tx(T.fruitN)) + '</p><p class="di-movers-hint">' + esc(tx(T.note)) + '</p>' + (D.commodities.some(function (c) { return c.euOnly; }) ? '<p class="di-movers-hint">' + esc(tx(T.euNote)) + '</p>' : '') + '<div id="pm-cites"></div></section>';
  }
  function cites() { var el = document.getElementById('pm-cites'), Q = global.DICite; if (!el || !Q || !Q.html) return; var h = Q.html('usda_fas_psd', { period: String(stats(SEL.p).last) }); if (h) el.innerHTML = '<div class="pp-cites">' + h + '</div>'; }
  function barUp() { var F = S.frame; if (!F || !F.bar) return; F.bar(document.getElementById('pa-bar'), tx(T.bar), ['mapa', 'lideres', 'pais', 'fuente'].map(function (k) { return ['pm-' + k, tx(T.bars[k])]; })); }
  function setUrl() { try { var u = new URL(global.location.href); u.searchParams.set('p', SEL.p); u.searchParams.set('c', SEL.c); global.history.replaceState(null, '', u.toString()); } catch (e) { /* sin URL */ } }

  function render() {
    var root = document.getElementById('pm-body'); if (!root || !D) return;
    var h1 = document.getElementById('pm-h1'), sub = document.getElementById('pm-sub'); if (h1) h1.textContent = tx(T.title); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.title) + ' | Dehesa Index';
    classify();
    var all = {}; D.commodities.forEach(function (c) { Object.keys(c.countries).forEach(function (k) { all[k] = c.countries[k].name; }); });
    var ccs = Object.keys(all).sort(function (a, b) { return cname(a, all[a]).localeCompare(cname(b, all[b]), LOC[lg()]); });
    var opts = ccs.map(function (k) { return '<option value="' + k + '"' + (k === SEL.c ? ' selected' : '') + '>' + esc(flag(k) + cname(k, all[k])) + '</option>'; }).join('');
    root.innerHTML = '<div class="cp-pick"><label for="pm-cc">' + esc(tx(T.country)) + '</label> <select data-cpick="1" id="pm-cc" class="di-compare-select">' + opts + '</select><span class="cp-seg">' + chips([['world', tx(T.view.world)], ['eu', tx(T.view.eu)]], SEL.v, 'v') + '</span></div>' +
      '<section id="pm-mapa" class="cp-hero"><div class="cp-mapcol"><div class="pm-chipbox">' + productChips() + '</div><div id="pm-map" class="cp-map" role="img" aria-label="' + esc(tx(T.title)) + '"></div><div id="pm-legend" class="cp-legend"></div></div><aside class="cp-panel" id="pm-panel" aria-live="polite">' + leaderPanel() + '</aside></section>' +
      leadersTable() + countrySection() + sourceSection();
    wire(root); drawMap(); cites(); barUp();
  }
  function pick(k) { SEL.c = k; setUrl(); var ps = document.getElementById('pm-pais'); render(); if (ps && global.innerWidth < 820) { /* en móvil, el panel está justo debajo del mapa */ } }
  function wire(root) {
    var sel = document.getElementById('pm-cc'); if (sel) sel.onchange = function () { pick(sel.value); };
    [].forEach.call(root.querySelectorAll('button[data-p]'), function (b) { b.onclick = function () { SEL.p = b.getAttribute('data-p'); setUrl(); render(); }; });
    [].forEach.call(root.querySelectorAll('button[data-v]'), function (b) { b.onclick = function () { SEL.v = b.getAttribute('data-v'); render(); }; });
    [].forEach.call(root.querySelectorAll('button[data-pr]'), function (b) { b.onclick = function () { SEL.p = b.getAttribute('data-pr'); setUrl(); render(); var m = document.getElementById('pm-mapa'); if (m && m.scrollIntoView) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
    [].forEach.call(root.querySelectorAll('button[data-cc]'), function (b) { b.onclick = function () { var pp = b.getAttribute('data-pp'); if (pp) SEL.p = pp; pick(b.getAttribute('data-cc')); }; });
  }
  function boot() {
    var root = document.getElementById('pm-body'); if (!root) return;
    if (S.init) S.init('production');
    try { var q = new URLSearchParams(global.location.search), p = q.get('p'), c = (q.get('c') || '').toUpperCase(); if (p && T.p[p]) SEL.p = p; if (c) SEL.c = c === 'GB' ? 'UK' : c; } catch (e) { /* sin parámetros */ }
    root.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.loading)) + '</p>';
    Promise.all([getJSON('data/supply-demand-map.json'), getJSON('data/world-production.json'), global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null, getJSON('data/eu-crops-map.json')]).then(function (r) {
      if (!r[0] || !r[0].commodities) { root.innerHTML = '<p>' + esc(tx(T.fail)) + '</p>'; return; }
      D = r[0]; if (r[1] && r[1].commodities) D.commodities = D.commodities.concat(r[1].commodities); if (r[3] && r[3].crops) D.commodities = D.commodities.concat(eurostat(r[3])); try { var pp = new URLSearchParams(global.location.search).get('p'); if (pp && T.p[pp] && comm(pp)) SEL.p = pp; } catch (e) { /* sin parámetros */ } if (!comm(SEL.p)) SEL.p = 'trigo';
      var any = false; D.commodities.forEach(function (c) { if (c.countries[SEL.c]) any = true; }); if (!any) SEL.c = 'US';
      render();
    });
    S.onLangChange = function () { render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
