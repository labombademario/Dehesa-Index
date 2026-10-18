/* Dehesa Index — Costes, renta y alimentos por país (costes-pais.html). ES5.
   Europa: data/eu-farm-economics.json (Eurostat, cuentas económicas de la agricultura: producción, consumos intermedios, renta) y
   data/eu-food-monitor/<CC>.json (Eurostat prc_fpmt_m: precios al consumidor, en origen y de productor).
   EE. UU.: data/ers.json (USDA ERS: renta en caja por producto, costes por cultivo y ganado, precios de alimentos).
   Cálculos propios, rotulados como tales: ratios (% de la producción, % de los costes), renta por trabajador, variaciones a 12 meses e índice 2020 = 100.
   Los insumos se agrupan por el uso habitual (fertilizantes y fitosanitarios → agricultura; piensos y veterinario → ganadería; energía, compartida):
   Eurostat los publica por tipo de insumo, no por tipo de explotación. Un dato que la fuente no publica se muestra como ausente. */
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
    title: L('Costes, renta y alimentos por país', 'Farm costs, income and food prices by country', 'Coûts, revenu et prix alimentaires par pays', 'Costi, redditi e prezzi alimentari per paese'),
    sub: L('Cuánto cuesta producir, cuánto gana el sector y cuánto suben los alimentos, con la agricultura y la ganadería por separado. Elige un país en el mapa.',
           'What it costs to produce, what the sector earns and how food prices move, with crops and livestock shown separately. Pick a country on the map.',
           'Ce que coûte la production, ce que gagne le secteur et comment évoluent les prix alimentaires, cultures et élevage séparés. Choisissez un pays sur la carte.',
           'Quanto costa produrre, quanto guadagna il settore e come variano i prezzi alimentari, con agricoltura e allevamento separati. Scegli un paese sulla mappa.'),
    country: L('País', 'Country', 'Pays', 'Paese'), bar: L('En esta página', 'On this page', 'Sur cette page', 'In questa pagina'),
    loading: L('Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'), fail: L('No se han podido cargar los datos. Vuelve a intentarlo más tarde.', 'The data could not be loaded. Please try again later.', 'Les données n’ont pas pu être chargées. Réessayez plus tard.', 'Impossibile caricare i dati. Riprova più tardi.'),
    f: { all: L('✨ Todo', '✨ All', '✨ Tout', '✨ Tutto'), agri: L('🌾 Agricultura', '🌾 Crops', '🌾 Cultures', '🌾 Agricoltura'), gan: L('🐄 Ganadería', '🐄 Livestock', '🐄 Élevage', '🐄 Allevamento') },
    fl: L('Sector', 'Sector', 'Secteur', 'Settore'),
    views: { eu: L('🇪🇺 Europa', '🇪🇺 Europe', '🇪🇺 Europe', '🇪🇺 Europa'), world: L('🌍 Mundo', '🌍 World', '🌍 Monde', '🌍 Mondo') },
    mt: L('Colorear el mapa por', 'Colour the map by', 'Colorier la carte selon', 'Colora la mappa per'),
    m: {
      fi: L('💶 Renta por trabajador', '💶 Income per worker', '💶 Revenu par travailleur', '💶 Reddito per addetto'),
      ic: L('🧾 Costes sobre producción', '🧾 Costs over output', '🧾 Coûts sur production', '🧾 Costi su produzione'),
      yoy: L('📈 Renta empresarial vs año anterior', '📈 Entrepreneurial income vs last year', '📈 Revenu entrepreneurial vs an dernier', '📈 Reddito d’impresa vs anno scorso'),
      fert: L('🌱 Fertilizantes sobre costes', '🌱 Fertiliser share of costs', '🌱 Engrais en % des coûts', '🌱 Fertilizzanti sui costi'),
      feed: L('🌽 Piensos sobre costes', '🌽 Feed share of costs', '🌽 Aliments en % des coûts', '🌽 Mangimi sui costi')
    },
    mu: { fi: L('miles de € por trabajador (UTA)', 'thousand € per worker (AWU)', 'milliers d’€ par travailleur (UTA)', 'migliaia di € per addetto (ULA)'), pct: L('%', '%', '%', '%') },
    mr: L('Clasificación', 'Ranking', 'Classement', 'Classifica'), rk: L('puesto', 'rank', 'rang', 'posto'), of: L('de', 'of', 'sur', 'su'),
    nodata: L('sin dato', 'no data', 'sans donnée', 'nessun dato'), other: L('Datos del USDA (otra fuente)', 'USDA data (different source)', 'Données USDA (autre source)', 'Dati USDA (altra fonte)'),
    clk: L('Pulsa para verlo', 'Click to view', 'Cliquez pour voir', 'Clicca per vedere'),
    lessThan: L('menos de', 'under', 'moins de', 'meno di'), moreThan: L('más de', 'over', 'plus de', 'più di'),
    k: { out: L('Producción agraria', 'Agricultural output', 'Production agricole', 'Produzione agricola'), ic: L('Costes (consumos intermedios)', 'Costs (intermediate consumption)', 'Coûts (consommation intermédiaire)', 'Costi (consumi intermedi)'),
         ent: L('Renta empresarial', 'Entrepreneurial income', 'Revenu entrepreneurial', 'Reddito d’impresa'), pua: L('Renta por trabajador', 'Income per worker', 'Revenu par travailleur', 'Reddito per addetto'),
         share: L('de la producción', 'of output', 'de la production', 'della produzione') },
    mm: L(' M€', ' m€', ' M€', ' mln €'), bn: L(' mil M€', ' bn €', ' Md €', ' mld €'), keur: L(' mil €', ' k€', ' k€', ' mila €'),
    vs: L('vs año anterior', 'vs previous year', 'vs année précédente', 'vs anno precedente'),
    sec: {
      renta: L('💶 Renta agraria', '💶 Farm income', '💶 Revenu agricole', '💶 Reddito agricolo'),
      costes: L('🧾 Costes de producción', '🧾 Production costs', '🧾 Coûts de production', '🧾 Costi di produzione'),
      precios: L('🛒 Del campo al plato', '🛒 From farm to plate', '🛒 Du champ à l’assiette', '🛒 Dal campo al piatto'),
      detalle: L('🔎 Más detalle', '🔎 More detail', '🔎 Plus de détail', '🔎 Più dettaglio')
    },
    bars: { mapa: L('🗺️ Mapa', '🗺️ Map', '🗺️ Carte', '🗺️ Mappa'), renta: L('💶 Renta', '💶 Income', '💶 Revenu', '💶 Reddito'), costes: L('🧾 Costes', '🧾 Costs', '🧾 Coûts', '🧾 Costi'),
            precios: L('🛒 Precios', '🛒 Prices', '🛒 Prix', '🛒 Prezzi'), detalle: L('🔎 Detalle', '🔎 Detail', '🔎 Détail', '🔎 Dettaglio') },
    rentaSub: L('Millones de euros a precios corrientes. Último año publicado; puede ser provisional.', 'Million euro at current prices. Latest published year; it may be provisional.', 'Millions d’euros aux prix courants. Dernière année publiée ; elle peut être provisoire.', 'Milioni di euro a prezzi correnti. Ultimo anno pubblicato; può essere provvisorio.'),
    chRenta: L('Producción, costes y renta empresarial (M€)', 'Output, costs and entrepreneurial income (€m)', 'Production, coûts et revenu entrepreneurial (M€)', 'Produzione, costi e reddito d’impresa (mln €)'),
    lOut: L('Producción', 'Output', 'Production', 'Produzione'), lIc: L('Costes', 'Costs', 'Coûts', 'Costi'), lEnt: L('Renta empresarial', 'Entrepreneurial income', 'Revenu entrepreneurial', 'Reddito d’impresa'),
    lGva: L('Valor añadido bruto', 'Gross value added', 'Valeur ajoutée brute', 'Valore aggiunto lordo'), lComp: L('Gastos de personal', 'Labour compensation', 'Rémunération des salariés', 'Redditi da lavoro'), lFac: L('Renta de los factores', 'Factor income', 'Revenu des facteurs', 'Reddito dei fattori'),
    cSub: L('Lo que gasta el sector en cada insumo, el último año publicado. Las barras muestran el peso de cada uno sobre los costes totales.', 'What the sector spends on each input in the latest published year. Bars show each input’s weight in total costs.', 'Ce que le secteur dépense par intrant, dernière année publiée. Les barres montrent le poids de chacun dans les coûts totaux.', 'Quanto spende il settore per ogni input, ultimo anno pubblicato. Le barre mostrano il peso di ciascuno sui costi totali.'),
    cNote: L('Eurostat publica los costes por tipo de insumo, no por tipo de explotación. Dehesa Index los agrupa según su uso habitual: fertilizantes y fitosanitarios para la agricultura, piensos y veterinario para la ganadería; la energía sirve a las dos.',
             'Eurostat publishes costs by type of input, not by type of farm. Dehesa Index groups them by their usual use: fertiliser and plant protection for crops, feed and veterinary for livestock; energy serves both.',
             'Eurostat publie les coûts par type d’intrant, pas par type d’exploitation. Dehesa Index les regroupe selon leur usage habituel : engrais et phytosanitaires pour les cultures, aliments et vétérinaire pour l’élevage ; l’énergie sert aux deux.',
             'Eurostat pubblica i costi per tipo di input, non per tipo di azienda. Dehesa Index li raggruppa per uso abituale: fertilizzanti e fitosanitari per l’agricoltura, mangimi e veterinario per l’allevamento; l’energia serve a entrambi.'),
    g: { agri: L('🌾 Agricultura', '🌾 Crops', '🌾 Cultures', '🌾 Agricoltura'), gan: L('🐄 Ganadería', '🐄 Livestock', '🐄 Élevage', '🐄 Allevamento'), both: L('⚡ Energía (las dos)', '⚡ Energy (both)', '⚡ Énergie (les deux)', '⚡ Energia (entrambi)'), rest: L('📦 Resto de costes', '📦 Other costs', '📦 Autres coûts', '📦 Altri costi') },
    i: { fert: L('🌱 Fertilizantes', '🌱 Fertilisers', '🌱 Engrais', '🌱 Fertilizzanti'), ppp: L('🧪 Fitosanitarios', '🧪 Plant protection', '🧪 Phytosanitaires', '🧪 Fitosanitari'), feed: L('🌽 Piensos', '🌽 Feed', '🌽 Aliments du bétail', '🌽 Mangimi'),
         vet: L('💉 Veterinario', '💉 Veterinary', '💉 Vétérinaire', '💉 Veterinario'), energy: L('⚡ Energía y lubricantes', '⚡ Energy and lubricants', '⚡ Énergie et lubrifiants', '⚡ Energia e lubrificanti'), rest: L('📦 Resto', '📦 Other', '📦 Autres', '📦 Altro') },
    hAmt: L('Importe', 'Amount', 'Montant', 'Importo'), hShare: L('% de los costes', '% of costs', '% des coûts', '% dei costi'), hYoy: L('vs año anterior', 'vs previous year', 'vs année précédente', 'vs anno precedente'), hSince: L('vs 2020', 'vs 2020', 'vs 2020', 'vs 2020'),
    chIdx: L('Cuánto han subido los insumos (2020 = 100)', 'How much inputs have risen (2020 = 100)', 'Hausse des intrants (2020 = 100)', 'Quanto sono saliti gli input (2020 = 100)'),
    pSub: L('Variación en 12 meses hasta {m}, de los índices de Eurostat. Para cada producto: 🏪 lo que paga el consumidor, 🚜 el precio en origen (materia prima agraria) y 🏭 el precio de productor de la industria. Un guion indica que Eurostat no publica ese índice para el país.',
            '12-month change to {m} in Eurostat indices. For each product: 🏪 what consumers pay, 🚜 the farm-gate (raw commodity) price and 🏭 the industry producer price. A dash means Eurostat does not publish that index for the country.',
            'Variation sur 12 mois jusqu’à {m} des indices Eurostat. Pour chaque produit : 🏪 ce que paie le consommateur, 🚜 le prix à la ferme (matière première) et 🏭 le prix producteur de l’industrie. Un tiret indique qu’Eurostat ne publie pas cet indice pour le pays.',
            'Variazione a 12 mesi fino a {m} degli indici Eurostat. Per ogni prodotto: 🏪 quanto paga il consumatore, 🚜 il prezzo alla produzione (materia prima) e 🏭 il prezzo alla produzione dell’industria. Un trattino indica che Eurostat non pubblica quell’indice per il paese.'),
    hProd: L('Producto', 'Product', 'Produit', 'Prodotto'), hCons: L('🏪 Consumidor', '🏪 Consumer', '🏪 Consommateur', '🏪 Consumatore'), hFarm: L('🚜 En origen', '🚜 Farm-gate', '🚜 À la ferme', '🚜 Alla produzione'), hInd: L('🏭 Industria', '🏭 Industry', '🏭 Industrie', '🏭 Industria'),
    noFood: L('Eurostat no publica precios de alimentos para este país.', 'Eurostat does not publish food prices for this country.', 'Eurostat ne publie pas de prix alimentaires pour ce pays.', 'Eurostat non pubblica prezzi alimentari per questo paese.'),
    noEaa: L('Eurostat no publica las cuentas económicas de la agricultura de este país.', 'Eurostat does not publish economic accounts for agriculture for this country.', 'Eurostat ne publie pas de comptes économiques de l’agriculture pour ce pays.', 'Eurostat non pubblica i conti economici dell’agricoltura per questo paese.'),
    foodNote: L('Índices de Eurostat (2025 = 100). La variación a 12 meses es un cálculo de Dehesa Index; Eurostat no es responsable de ese cálculo.', 'Eurostat indices (2025 = 100). The 12-month change is a Dehesa Index calculation; Eurostat is not responsible for it.', 'Indices Eurostat (2025 = 100). La variation sur 12 mois est un calcul de Dehesa Index ; Eurostat n’en est pas responsable.', 'Indici Eurostat (2025 = 100). La variazione a 12 mesi è un calcolo di Dehesa Index; Eurostat non ne è responsabile.'),
    eaaNote: L('Cifras de Eurostat (cuentas económicas de la agricultura). Los porcentajes, la renta por trabajador (renta de los factores entre unidades de trabajo anual) y el índice 2020 = 100 los calcula Dehesa Index.', 'Eurostat figures (economic accounts for agriculture). Percentages, income per worker (factor income divided by annual work units) and the 2020 = 100 index are calculated by Dehesa Index.', 'Chiffres Eurostat (comptes économiques de l’agriculture). Les pourcentages, le revenu par travailleur (revenu des facteurs par unité de travail annuel) et l’indice 2020 = 100 sont calculés par Dehesa Index.', 'Dati Eurostat (conti economici dell’agricoltura). Le percentuali, il reddito per addetto (reddito dei fattori per unità di lavoro annuo) e l’indice 2020 = 100 sono calcolati da Dehesa Index.'),
    detT: L('Ir al detalle', 'Go to the detail', 'Aller au détail', 'Vai al dettaglio'),
    us: {
      inc: L('Ingresos en caja de los agricultores y ganaderos de EE. UU. (miles de millones de dólares). Datos del USDA ERS; el último año es una previsión.', 'Cash receipts of US farmers and ranchers (US$ billion). USDA ERS data; the latest year is a forecast.', 'Recettes en espèces des agriculteurs et éleveurs américains (milliards de dollars). Données USDA ERS ; la dernière année est une prévision.', 'Incassi in contanti di agricoltori e allevatori USA (miliardi di dollari). Dati USDA ERS; l’ultimo anno è una previsione.'),
      all: L('Total', 'Total', 'Total', 'Totale'), crops: L('🌾 Cultivos', '🌾 Crops', '🌾 Cultures', '🌾 Colture'), live: L('🐄 Ganadería y productos', '🐄 Livestock and products', '🐄 Élevage et produits', '🐄 Allevamento e prodotti'), net: L('💵 Renta neta agraria', '💵 Net farm income', '💵 Revenu agricole net', '💵 Reddito agricolo netto'),
      rcpC: L('🌾 Ingresos por cultivo', '🌾 Receipts by crop', '🌾 Recettes par culture', '🌾 Incassi per coltura'), rcpL: L('🐄 Ingresos por producto ganadero', '🐄 Receipts by livestock product', '🐄 Recettes par produit d’élevage', '🐄 Incassi per prodotto zootecnico'),
      pSub: L('Variación a 12 meses hasta {m}, del USDA ERS. Para cada producto: 🏪 lo que paga el consumidor, 🚜 el precio en granja y 🏭 el precio mayorista. Un guion indica que el ERS no publica ese índice.','12-month change to {m}, from USDA ERS. For each product: 🏪 what consumers pay, 🚜 the farm-level price and 🏭 the wholesale price. A dash means ERS does not publish that index.','Variation sur 12 mois jusqu’à {m}, USDA ERS. Pour chaque produit : 🏪 prix payé par le consommateur, 🚜 prix à la ferme et 🏭 prix de gros. Un tiret indique que l’ERS ne publie pas cet indice.','Variazione a 12 mesi fino a {m}, USDA ERS. Per ogni prodotto: 🏪 prezzo al consumo, 🚜 prezzo in azienda e 🏭 prezzo all’ingrosso. Un trattino indica che l’ERS non pubblica quell’indice.'),
      hVal: L('mil M$', 'bn $', 'Md $', 'mld $'), costSub: L('Resultado por unidad producida en EE. UU. (total del país, último año con datos). Los cultivos van por acre plantado; la ganadería por unidad de producto.', 'Result per unit produced in the US (national total, latest year with data). Crops are per planted acre; livestock per unit of product.', 'Résultat par unité produite aux États-Unis (total national, dernière année disponible). Cultures par acre planté ; élevage par unité de produit.', 'Risultato per unità prodotta negli USA (totale nazionale, ultimo anno disponibile). Colture per acro piantato; allevamento per unità di prodotto.'),
      hGross: L('Valor bruto', 'Gross value', 'Valeur brute', 'Valore lordo'), hOp: L('Costes operativos', 'Operating costs', 'Coûts opérationnels', 'Costi operativi'), hNet: L('Resultado neto', 'Net result', 'Résultat net', 'Risultato netto'), hFeed: L('Piensos (% costes oper.)', 'Feed (% of op. costs)', 'Aliments (% coûts opér.)', 'Mangimi (% costi oper.)'), hUnit: L('Unidad', 'Unit', 'Unité', 'Unità'),
      acre: L('$ por acre', '$ per acre', '$ par acre', '$ per acro'), cwt: L('$ por 100 libras de leche', '$ per cwt of milk', '$ par cwt de lait', '$ per cwt di latte'), cow: L('$ por vaca', '$ per cow', '$ par vache', '$ per vacca'), gain: L('$ por 100 libras de ganancia', '$ per cwt of gain', '$ par cwt de gain', '$ per cwt di crescita'),
      foodNote: L('Datos del USDA ERS (índice de precios al consumidor y de precios de productor, IPP). La columna 🚜 es el precio en granja y la 🏭 el precio mayorista, cuando el ERS los publica.', 'USDA ERS data (consumer price index and producer price index, PPI). The 🚜 column is the farm-level price and 🏭 the wholesale price, where ERS publishes them.', 'Données USDA ERS (indice des prix à la consommation et des prix à la production). La colonne 🚜 est le prix à la ferme et 🏭 le prix de gros, quand l’ERS les publie.', 'Dati USDA ERS (indice dei prezzi al consumo e dei prezzi alla produzione). La colonna 🚜 è il prezzo in azienda e 🏭 quello all’ingrosso, quando l’ERS li pubblica.')
    },
    ln: { fiche: L('Ficha del país', 'Country profile', 'Fiche pays', 'Scheda paese'), recan: L('Costes y rentas por comunidad (RECAN)', 'Costs and incomes by region (RECAN)', 'Coûts et revenus par région (RECAN)', 'Costi e redditi per regione (RECAN)'),
          usc: L('Costes por cultivo y renta de EE. UU. (ERS)', 'US crop costs and income (ERS)', 'Coûts par culture et revenu des É.-U. (ERS)', 'Costi per coltura e reddito USA (ERS)'), usi: L('Insumos de EE. UU.', 'US inputs', 'Intrants des É.-U.', 'Input USA'),
          cac: L('Costes y renta de Canadá', 'Canadian costs and income', 'Coûts et revenu du Canada', 'Costi e reddito del Canada'), fish: L('Pesca y acuicultura', 'Fishing and aquaculture', 'Pêche et aquaculture', 'Pesca e acquacoltura'),
          eu: L('Precios de la UE', 'EU prices', 'Prix de l’UE', 'Prezzi UE') }
  };

  /* Productos: [código Eurostat, emoji + nombre] */
  var P_AGRI = [['CP01111', L('🌾 Cereales', '🌾 Cereals', '🌾 Céréales', '🌾 Cereali')], ['CP01115', L('🍝 Pasta', '🍝 Pasta', '🍝 Pâtes', '🍝 Pasta')], ['CP011751', L('🥔 Patatas', '🥔 Potatoes', '🥔 Pommes de terre', '🥔 Patate')],
    ['CP0117', L('🥕 Hortalizas y legumbres', '🥕 Vegetables and pulses', '🥕 Légumes et légumineuses', '🥕 Ortaggi e legumi')], ['CP0116', L('🍎 Frutas y frutos secos', '🍎 Fruit and nuts', '🍎 Fruits et fruits à coque', '🍎 Frutta e frutta secca')],
    ['CP01162', L('🍊 Cítricos', '🍊 Citrus fruit', '🍊 Agrumes', '🍊 Agrumi')], ['CP011513', L('🫒 Aceite de oliva', '🫒 Olive oil', '🫒 Huile d’olive', '🫒 Olio d’oliva')], ['CP01151', L('🌻 Aceites vegetales', '🌻 Vegetable oils', '🌻 Huiles végétales', '🌻 Oli vegetali')],
    ['CP01181', L('🍬 Azúcar', '🍬 Sugar', '🍬 Sucre', '🍬 Zucchero')], ['CP02121', L('🍷 Vino', '🍷 Wine', '🍷 Vin', '🍷 Vino')]];
  var P_GAN = [['CP01122', L('🥩 Carne fresca', '🥩 Fresh meat', '🥩 Viande fraîche', '🥩 Carne fresca')], ['CP011221', L('🐄 Vacuno', '🐄 Beef', '🐄 Bœuf', '🐄 Manzo')], ['CP011222', L('🐖 Cerdo', '🐖 Pork', '🐖 Porc', '🐖 Maiale')],
    ['CP011223', L('🐑 Cordero y cabrito', '🐑 Lamb and goat', '🐑 Agneau et chèvre', '🐑 Agnello e capra')], ['CP011224', L('🐔 Aves', '🐔 Poultry', '🐔 Volaille', '🐔 Pollame')], ['CP011225', L('🐇 Conejo', '🐇 Rabbit', '🐇 Lapin', '🐇 Coniglio')],
    ['CP01141', L('🥛 Leche', '🥛 Milk', '🥛 Lait', '🥛 Latte')], ['CP01145', L('🧀 Queso', '🧀 Cheese', '🧀 Fromage', '🧀 Formaggio')], ['CP01146', L('🥣 Yogur', '🥣 Yoghurt', '🥣 Yaourt', '🥣 Yogurt')],
    ['CP01152', L('🧈 Mantequilla', '🧈 Butter', '🧈 Beurre', '🧈 Burro')], ['CP01148', L('🥚 Huevos', '🥚 Eggs', '🥚 Œufs', '🥚 Uova')]];
  var P_ALL = [['CP011', L('🛒 Todos los alimentos', '🛒 All food', '🛒 Alimentation', '🛒 Alimentari')]];

  var SEQ = ['#e9efdf', '#c6dbb4', '#93bd86', '#549362', '#1f6b3f'], DIV = ['#b4341f', '#e0946f', '#cfcac0', '#8dbb8a', '#2e7d5b'], NONE = '#e6e2d6', OTHER = '#d4cbb6';
  var UPC = '#9a3b1f', DNC = '#245f7a';
  var EAA = null, FOOD = {}, ERS = null, CACHE = {}, SEL = { cc: 'ES', f: 'all', m: 'fi', v: 'eu' }, MAP = null, VALS = {}, CUTS = null;

  function getJSON(url) { CACHE[url] = CACHE[url] || fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); return CACHE[url]; }
  function iso(cc) { return cc === 'EL' ? 'GR' : cc === 'UK' ? 'GB' : cc; }
  function ours(code) { return code === 'GR' ? 'EL' : code === 'GB' ? 'UK' : code; }
  function flag(cc) { var c = iso(cc); return /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(127397 + c.charCodeAt(0), 127397 + c.charCodeAt(1)) + ' ' : '🇪🇺 '; }
  function cname(cc) {
    if (cc === 'EU27_2020') return tx(L('Unión Europea (27)', 'European Union (27)', 'Union européenne (27)', 'Unione europea (27)'));
    try { var n = new Intl.DisplayNames([LOC[lg()]], { type: 'region' }).of(iso(cc)); if (n && n !== iso(cc)) return n; } catch (e) { /* sin Intl.DisplayNames */ }
    return cc;
  }
  function chg(v, d) { if (v == null) return '<span class="cp-m">—</span>'; var up = v > 0.049, dn = v < -0.049; return '<span class="cp-chg ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲ +' : dn ? '▼ −' : '■ ') + nf(Math.abs(v), d == null ? 1 : d) + ' %</span>'; }
  function money(v) { return v >= 10000 ? nf(v / 1000, 1) + tx(T.bn) : nf(v, 0) + tx(T.mm); }
  function monthName(ym) { var m = /^(\d{4})-(\d{2})/.exec(ym || ''); if (!m) return ym || ''; try { return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString(LOC[lg()], { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return ym; } }

  /* ---------- Europa: cuentas económicas de la agricultura ---------- */
  function lastIdx(d) { for (var i = EAA.years.length - 1; i >= 0; i--) if (d.output[i] != null && d.ic[i] != null) return i; return -1; }
  function metric(cc, m) {
    var d = EAA && EAA.geos[cc]; if (!d || cc === 'EU27_2020') return null;
    var i = lastIdx(d); if (i < 0 || i < EAA.years.length - 3) return null;
    if (m === 'fi') return d.factor[i] != null && d.awu[i] ? { v: d.factor[i] / d.awu[i], y: EAA.years[i] } : null;
    if (m === 'ic') return d.output[i] ? { v: 100 * d.ic[i] / d.output[i], y: EAA.years[i] } : null;
    if (m === 'fert' || m === 'feed') return d.ic[i] && d[m][i] != null ? { v: 100 * d[m][i] / d.ic[i], y: EAA.years[i] } : null;
    if (m === 'yoy') { var v = i > 0 ? pc(d.entrep[i], d.entrep[i - 1]) : null; return v == null ? null : { v: v, y: EAA.years[i] }; }
    return null;
  }
  function fmtM(m, v) { return m === 'fi' ? nf(v, 1) + tx(T.keur) : m === 'yoy' ? (v > 0 ? '+' : '') + nf(v, 1) + ' %' : nf(v, 1) + ' %'; }
  function classify() {
    VALS = {}; var arr = [];
    Object.keys(EAA.geos).forEach(function (cc) { var r = metric(cc, SEL.m); if (r) { VALS[cc] = r; arr.push(r.v); } });
    arr.sort(function (a, b) { return a - b; });
    if (SEL.m === 'yoy') CUTS = [-10, -2, 2, 10];
    else CUTS = [0.2, 0.4, 0.6, 0.8].map(function (q) { return arr.length ? arr[Math.min(arr.length - 1, Math.floor(q * arr.length))] : 0; });
  }
  function cls(v) { var k = 0; while (k < CUTS.length && v >= CUTS[k]) k++; return k; }
  function colorOf(v) { return (SEL.m === 'yoy' ? DIV : SEQ)[cls(v)]; }

  /* ---------- Mapa ---------- */
  var VIEWS = { eu: { coords: [52, 12], scale: 3.6 }, world: { coords: [30, 0], scale: 1 } };
  function drawMap() {
    var host = document.getElementById('cp-map'); if (!host) return;
    if (MAP) { try { MAP.destroy(); } catch (e) { /* ya destruido */ } MAP = null; }
    host.innerHTML = '';
    if (typeof global.jsVectorMap !== 'function') { host.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; return; }
    try {
      MAP = new global.jsVectorMap({
        selector: '#cp-map', map: 'world', backgroundColor: 'transparent', zoomButtons: true, zoomOnScroll: false, showTooltip: true,
        regionStyle: { initial: { fill: NONE, stroke: '#c8c3b4', strokeWidth: 0.4, fillOpacity: 1 }, hover: { fillOpacity: 0.8 } },
        onRegionTooltipShow: function (e, tip, code) {
          var cc = ours(code), r = VALS[cc], h = '<strong>' + esc(cname(cc)) + '</strong>';
          if (r) h += '<br>' + esc(tx(T.m[SEL.m]).replace(/^\S+\s/, '')) + ': ' + esc(fmtM(SEL.m, r.v)) + ' (' + r.y + ')<br>' + esc(tx(T.clk));
          else if (cc === 'US') h += '<br>' + esc(tx(T.other)) + '<br>' + esc(tx(T.clk));
          else if (EAA.geos[cc]) h += '<br>' + esc(tx(T.nodata)) + '<br>' + esc(tx(T.clk));
          else return e.preventDefault && e.preventDefault();
          tip.text(h, true);
        },
        onRegionClick: function (e, code) { var cc = ours(code); if (EAA.geos[cc] || cc === 'US') pick(cc); }
      });
      try { var v = VIEWS[SEL.v] || VIEWS.eu; if (SEL.v === 'world') MAP.setFocus({ scale: 1, animate: false }); else MAP.setFocus({ coords: v.coords, scale: v.scale, animate: false }); } catch (e) { /* sin foco */ }
      paintMap();
    } catch (e) { MAP = null; host.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.fail)) + '</p>'; }
  }
  function paintMap() {
    if (!MAP || !MAP.regions) return;
    Object.keys(MAP.regions).forEach(function (code) {
      var cc = ours(code), r = VALS[cc], el = MAP.regions[code] && MAP.regions[code].element; if (!el) return;
      var fill = r ? colorOf(r.v) : cc === 'US' ? OTHER : EAA.geos[cc] && cc !== 'EU27_2020' ? '#dcd6c4' : NONE, sel = cc === SEL.cc;
      try { el.setStyle('fill', fill); el.setStyle('stroke', sel ? '#1b1b1b' : '#c8c3b4'); el.setStyle('strokeWidth', sel ? 1.6 : 0.4); } catch (e) { /* región sin estilo */ }
    });
    var lg2 = document.getElementById('cp-legend'); if (!lg2) return;
    var pal = SEL.m === 'yoy' ? DIV : SEQ, f = function (v) { return fmtM(SEL.m, v); };
    var lab = ['< ' + f(CUTS[0])]; for (var k = 1; k < CUTS.length; k++) lab.push(f(CUTS[k - 1]) + ' – ' + f(CUTS[k])); lab.push('> ' + f(CUTS[CUTS.length - 1]));
    lg2.innerHTML = pal.map(function (c, k) { return '<span class="cp-lg"><i style="background:' + c + '"></i>' + esc(lab[k]) + '</span>'; }).join('') + '<span class="cp-lg"><i style="background:' + OTHER + '"></i>' + esc(tx(T.other)) + '</span><span class="cp-lg"><i style="background:' + NONE + '"></i>' + esc(tx(T.nodata)) + '</span>';
  }

  /* ---------- Panel derecho: valores del país elegido ---------- */
  function tile(ico, label, val, sub) { return '<div class="cp-tile"><div class="cp-tl"><span aria-hidden="true">' + ico + '</span> ' + esc(label) + '</div><div class="cp-tv">' + val + '</div><div class="cp-ts">' + sub + '</div></div>'; }
  function eaaPanel() {
    var cc = SEL.cc, d = EAA.geos[cc]; if (!d) return '<p class="di-movers-hint">' + esc(tx(T.noEaa)) + '</p>';
    var i = lastIdx(d); if (i < 0) return '<p class="di-movers-hint">' + esc(tx(T.noEaa)) + '</p>';
    var y = EAA.years[i], p = i > 0 ? i - 1 : null, pu = d.factor[i] != null && d.awu[i] ? d.factor[i] / d.awu[i] : null, pup = p != null && d.factor[p] != null && d.awu[p] ? d.factor[p] / d.awu[p] : null;
    var sub = function (a, b) { return chg(pc(a, b)) + ' <span class="cp-m">' + esc(tx(T.vs)) + '</span>'; };
    var h = '<div class="cp-tiles">' +
      tile('🧺', tx(T.k.out), esc(money(d.output[i])), sub(d.output[i], p != null ? d.output[p] : null)) +
      tile('🧾', tx(T.k.ic), esc(money(d.ic[i])), sub(d.ic[i], p != null ? d.ic[p] : null)) +
      tile('💶', tx(T.k.ent), d.entrep[i] != null ? esc(money(d.entrep[i])) : '—', sub(d.entrep[i], p != null ? d.entrep[p] : null)) +
      tile('👩‍🌾', tx(T.k.pua), pu != null ? esc(nf(pu, 1) + tx(T.keur)) : '—', sub(pu, pup)) + '</div>';
    var r = VALS[cc], keys = Object.keys(VALS).sort(function (a, b) { return VALS[b].v - VALS[a].v; }), rk = keys.indexOf(cc);
    var rank = r && rk >= 0 ? '<p class="cp-rank">' + esc(tx(T.mr)) + ' · ' + esc(tx(T.m[SEL.m])) + ': <b>' + esc(tx(T.rk)) + ' ' + (rk + 1) + ' ' + esc(tx(T.of)) + ' ' + keys.length + '</b> (' + esc(fmtM(SEL.m, r.v)) + ', ' + r.y + ')</p>' : '';
    var top = '<ol class="cp-top">' + keys.slice(0, 5).map(function (k, n) { return '<li><button type="button" class="cp-lk" data-cc="' + k + '">' + (n === 0 ? '🥇' : n === 1 ? '🥈' : n === 2 ? '🥉' : (n + 1) + '.') + ' ' + esc(flag(k) + cname(k)) + '</button> <b>' + esc(fmtM(SEL.m, VALS[k].v)) + '</b></li>'; }).join('') + '</ol>';
    return '<div class="cp-pk">' + esc(tx(T.k.out)) + ' · ' + y + '</div>' + h + rank + top;
  }
  function usPanel() {
    return '<div class="cp-us" id="cp-us-kpis"><p class="di-movers-hint">' + esc(tx(T.loading)) + '</p></div>';
  }
  function panelHtml() {
    var cc = SEL.cc;
    return '<h2 class="cp-ph">' + esc(flag(cc) + cname(cc)) + '</h2>' + (cc === 'US' ? usPanel() : eaaPanel());
  }

  /* ---------- Secciones (Europa) ---------- */
  function sectionRenta() {
    var cc = SEL.cc, d = EAA.geos[cc]; if (!d || lastIdx(d) < 0) return '';
    var i = lastIdx(d), p = i > 0 ? i - 1 : null, ys = EAA.years;
    var ts = function (k) { var o = []; for (var j = 0; j < ys.length; j++) if (d[k][j] != null) o.push({ x: Date.UTC(ys[j], 0, 1), y: d[k][j], l: String(ys[j]) }); return o; };
    var chart = global.DehesaChart ? global.DehesaChart.render({ series: [{ name: tx(T.lOut), color: '#1d5178', pts: ts('output') }, { name: tx(T.lIc), color: '#a9491f', pts: ts('ic') }, { name: tx(T.lEnt), color: '#2e7d5b', pts: ts('entrep') }], xMode: 'time', yTitle: 'M€', aria: tx(T.chRenta) + ' · ' + cname(cc), vFmt: function (v) { return nf(v, 0); } }) : '';
    var rows = [['out', 'output'], ['ic', 'ic'], ['lGva', 'gva'], ['lComp', 'comp'], ['lFac', 'factor'], ['ent', 'entrep']].map(function (r) {
      var lab = r[0] === 'out' ? tx(T.k.out) : r[0] === 'ic' ? tx(T.k.ic) : r[0] === 'ent' ? tx(T.k.ent) : tx(T[r[0]]), v = d[r[1]][i], w = p != null ? d[r[1]][p] : null;
      return '<tr><td>' + esc(lab) + '</td><td class="num">' + (v == null ? '—' : esc(money(v))) + '</td><td class="num">' + chg(pc(v, w)) + '</td></tr>';
    }).join('');
    return '<section id="cp-renta" class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.sec.renta)) + ' · ' + esc(flag(cc) + cname(cc)) + '</h2><p class="di-movers-hint">' + esc(tx(T.rentaSub)) + '</p>' +
      '<div class="cp-two"><div class="cp-chart">' + (chart || '') + '</div><div class="di-table-wrap"><table class="di-table cp-tbl"><thead><tr><th>' + EAA.years[i] + '</th><th class="num">' + esc(tx(T.hAmt)) + '</th><th class="num">' + esc(tx(T.hYoy)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<p class="di-movers-hint">' + esc(tx(T.eaaNote)) + '</p></section>';
  }
  function costRow(d, k, i, p, base, tot) {
    var v = d[k][i]; if (v == null) return '';
    var sh = tot ? 100 * v / tot : null, y0 = base != null ? d[k][base] : null;
    return '<tr><td>' + esc(tx(T.i[k])) + '</td><td class="num">' + esc(money(v)) + '</td><td class="cp-barc"><span class="cp-bar"><i style="width:' + Math.min(100, sh || 0).toFixed(1) + '%"></i></span> <span class="cp-m">' + nf(sh, 1) + ' %</span></td><td class="num">' + chg(pc(v, p != null ? d[k][p] : null)) + '</td><td class="num">' + chg(pc(v, y0)) + '</td></tr>';
  }
  function costGroup(title, keys, d, i, p, base, tot, cls2) {
    var rows = keys.map(function (k) { return costRow(d, k, i, p, base, tot); }).join(''); if (!rows) return '';
    return '<div class="cp-g ' + cls2 + '"><h3 class="cp-h3">' + esc(title) + '</h3><div class="di-table-wrap"><table class="di-table cp-tbl"><thead><tr><th></th><th class="num">' + esc(tx(T.hAmt)) + '</th><th>' + esc(tx(T.hShare)) + '</th><th class="num">' + esc(tx(T.hYoy)) + '</th><th class="num">' + esc(tx(T.hSince)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function sectionCostes() {
    var cc = SEL.cc, d = EAA.geos[cc]; if (!d || lastIdx(d) < 0) return '';
    var i = lastIdx(d), p = i > 0 ? i - 1 : null, ys = EAA.years, base = ys.indexOf(2020), tot = d.ic[i];
    var known = 0; ['fert', 'ppp', 'feed', 'vet', 'energy'].forEach(function (k) { if (d[k][i] != null) known += d[k][i]; });
    var restV = tot != null ? tot - known : null;
    var idx = global.DehesaChart && base >= 0 ? global.DehesaChart.render({ series: ['fert', 'ppp', 'feed', 'vet', 'energy'].map(function (k, n) {
      var o = []; for (var j = 0; j < ys.length; j++) if (d[k][j] != null && d[k][base]) o.push({ x: Date.UTC(ys[j], 0, 1), y: 100 * d[k][j] / d[k][base], l: String(ys[j]) });
      return { name: tx(T.i[k]).replace(/^\S+\s/, ''), color: ['#2e7d5b', '#8a6d1f', '#a9491f', '#7a4a8c', '#1d5178'][n], pts: o }; }), xMode: 'time', aria: tx(T.chIdx) + ' · ' + cname(cc), vFmt: function (v) { return nf(v, 0); } }) : '';
    var rest = restV != null && restV > 0 ? '<div class="cp-g"><h3 class="cp-h3">' + esc(tx(T.g.rest)) + '</h3><p class="cp-m">' + esc(money(restV)) + ' · ' + nf(100 * restV / tot, 1) + ' %</p></div>' : '';
    return '<section id="cp-costes" class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.sec.costes)) + ' · ' + esc(flag(cc) + cname(cc)) + '</h2><p class="di-movers-hint">' + esc(tx(T.cSub)) + ' ' + ys[i] + '.</p>' +
      '<div class="cp-cols cp-cols1">' + costGroup(tx(T.g.agri), ['fert', 'ppp'], d, i, p, base, tot, 'cp-g-agri') + costGroup(tx(T.g.gan), ['feed', 'vet'], d, i, p, base, tot, 'cp-g-gan') + '</div>' +
      costGroup(tx(T.g.both), ['energy'], d, i, p, base, tot, 'cp-g-both') + rest +
      (idx ? '<h3 class="cp-h3">' + esc(tx(T.chIdx)) + '</h3><div class="cp-chart">' + idx + '</div>' : '') +
      '<p class="di-movers-hint">' + esc(tx(T.cNote)) + '</p></section>';
  }

  /* ---------- Precios de alimentos (Europa) ---------- */
  function yoyOf(s) {
    if (!s || !s.v) return null; var n = s.v.length; if (n < 13) return null;
    var a = s.v[n - 1], b = s.v[n - 13]; return a == null || b == null || !b ? null : (a / b - 1) * 100;
  }
  function foodRows(D, list) {
    var by = {}; D.series.forEach(function (s) { by[s.p + '|' + s.i] = s; });
    return list.map(function (it) {
      var c = yoyOf(by[it[0] + '|HICP']), f = yoyOf(by[it[0] + '|ACPI']), q = yoyOf(by[it[0] + '|PPI']);
      if (c == null && f == null && q == null) return '';
      return '<tr><td>' + esc(tx(it[1])) + '</td><td class="num">' + chg(c) + '</td><td class="num">' + chg(f) + '</td><td class="num">' + chg(q) + '</td></tr>';
    }).join('');
  }
  function foodTable(D, title, list, cls2) {
    var rows = foodRows(D, list); if (!rows) return '';
    return '<div class="cp-g ' + cls2 + '"><h3 class="cp-h3">' + esc(title) + '</h3><div class="di-table-wrap"><table class="di-table cp-tbl"><thead><tr><th>' + esc(tx(T.hProd)) + '</th><th class="num">' + esc(tx(T.hCons)) + '</th><th class="num">' + esc(tx(T.hFarm)) + '</th><th class="num">' + esc(tx(T.hInd)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function sectionPrecios(D) {
    var cc = SEL.cc, head = '<h2 class="cp-h2">' + esc(tx(T.sec.precios)) + ' · ' + esc(flag(cc) + cname(cc)) + '</h2>';
    if (!D) return '<section id="cp-precios" class="di-card cp-sec">' + head + '<p class="di-movers-hint">' + esc(tx(T.noFood)) + '</p></section>';
    return '<section id="cp-precios" class="di-card cp-sec">' + head + '<p class="di-movers-hint">' + esc(tx(T.pSub).replace('{m}', monthName(D.end))) + '</p>' +
      foodTable(D, tx(T.sec.precios).replace(/^\S+\s/, ''), P_ALL, 'cp-g-all') +
      '<div class="cp-cols">' + foodTable(D, tx(T.g.agri), P_AGRI, 'cp-g-agri') + foodTable(D, tx(T.g.gan), P_GAN, 'cp-g-gan') + '</div>' +
      '<p class="di-movers-hint">' + esc(tx(T.foodNote)) + '</p></section>';
  }

  /* ---------- Estados Unidos (USDA ERS) ---------- */
  var US_C = [['CRAUSCR--VAP', L('🌽 Maíz', '🌽 Corn', '🌽 Maïs', '🌽 Mais')], ['CRAUSSY--VAP', L('🫘 Soja', '🫘 Soybeans', '🫘 Soja', '🫘 Soia')], ['CRAUSWT--VAP', L('🌾 Trigo', '🌾 Wheat', '🌾 Blé', '🌾 Grano')],
    ['CRAUSCT--VAP', L('☁️ Algodón', '☁️ Cotton', '☁️ Coton', '☁️ Cotone')], ['CRAUSRI--VAP', L('🍚 Arroz', '🍚 Rice', '🍚 Riz', '🍚 Riso')], ['CRAUSVG--VAP', L('🥕 Hortalizas', '🥕 Vegetables', '🥕 Légumes', '🥕 Ortaggi')],
    ['CRAUSFN--VAP', L('🍎 Frutas y frutos secos', '🍎 Fruit and nuts', '🍎 Fruits et fruits à coque', '🍎 Frutta e frutta secca')], ['CRAUSHY--VAP', L('🌿 Heno', '🌿 Hay', '🌿 Foin', '🌿 Fieno')], ['CRAUSPO--VAP', L('🥔 Patatas', '🥔 Potatoes', '🥔 Pommes de terre', '🥔 Patate')]];
  var US_L = [['CRAUSCL--VAP', L('🐄 Ganado vacuno', '🐄 Cattle and calves', '🐄 Bovins', '🐄 Bovini')], ['CRAUSDY--VAP', L('🥛 Lácteos', '🥛 Dairy', '🥛 Produits laitiers', '🥛 Latticini')], ['CRAUSHG--VAP', L('🐖 Cerdos', '🐖 Hogs', '🐖 Porcs', '🐖 Suini')],
    ['CRAUSBR--VAP', L('🐔 Pollos (broilers)', '🐔 Broilers', '🐔 Poulets de chair', '🐔 Polli da carne')], ['CRAUSEG--VAP', L('🥚 Huevos', '🥚 Eggs', '🥚 Œufs', '🥚 Uova')], ['CRAUSTU--VAP', L('🦃 Pavos', '🦃 Turkeys', '🦃 Dindes', '🦃 Tacchini')]];
  var US_COST = [['corn', L('🌽 Maíz', '🌽 Corn', '🌽 Maïs', '🌽 Mais'), 'acre'], ['soybeans', L('🫘 Soja', '🫘 Soybeans', '🫘 Soja', '🫘 Soia'), 'acre'], ['wheat', L('🌾 Trigo', '🌾 Wheat', '🌾 Blé', '🌾 Grano'), 'acre'], ['rice', L('🍚 Arroz', '🍚 Rice', '🍚 Riz', '🍚 Riso'), 'acre'], ['cotton', L('☁️ Algodón', '☁️ Cotton', '☁️ Coton', '☁️ Cotone'), 'acre'],
    ['milk', L('🥛 Leche', '🥛 Milk', '🥛 Lait', '🥛 Latte'), 'cwt'], ['cow-calf', L('🐄 Vacas nodriza (terneros)', '🐄 Cow-calf', '🐄 Vaches allaitantes', '🐄 Vacca-vitello'), 'cow'], ['hogs-all', L('🐖 Cerdos', '🐖 Hogs', '🐖 Porcs', '🐖 Suini'), 'gain']];
  var US_FOOD = [['All food', null, null, L('🛒 Todos los alimentos', '🛒 All food', '🛒 Alimentation', '🛒 Alimentari'), 'all'],
    ['Beef and veal', 'Farm-level cattle', 'Wholesale beef', L('🐄 Vacuno', '🐄 Beef', '🐄 Bœuf', '🐄 Manzo'), 'gan'], ['Pork', null, 'Wholesale pork', L('🐖 Cerdo', '🐖 Pork', '🐖 Porc', '🐖 Maiale'), 'gan'],
    ['Poultry', null, 'Wholesale poultry', L('🐔 Aves', '🐔 Poultry', '🐔 Volaille', '🐔 Pollame'), 'gan'], ['Eggs', 'Farm-level eggs', null, L('🥚 Huevos', '🥚 Eggs', '🥚 Œufs', '🥚 Uova'), 'gan'],
    ['Dairy products', 'Farm-level milk', 'Wholesale dairy', L('🥛 Lácteos', '🥛 Dairy', '🥛 Produits laitiers', '🥛 Latticini'), 'gan'],
    ['Cereals and bakery products', 'Farm-level wheat', 'Wholesale wheat flour', L('🌾 Cereales y panadería', '🌾 Cereals and bakery', '🌾 Céréales et boulangerie', '🌾 Cereali e panetteria'), 'agri'],
    ['Fresh fruits', 'Farm-level fruits', null, L('🍎 Fruta fresca', '🍎 Fresh fruit', '🍎 Fruits frais', '🍎 Frutta fresca'), 'agri'], ['Fresh vegetables', 'Farm-level vegetables', null, L('🥕 Hortalizas frescas', '🥕 Fresh vegetables', '🥕 Légumes frais', '🥕 Ortaggi freschi'), 'agri'],
    ['Fats and oils', 'Farm-level soybeans', 'Wholesale fats and oils', L('🌻 Grasas y aceites (origen: soja)', '🌻 Fats and oils (farm: soybeans)', '🌻 Graisses et huiles (ferme : soja)', '🌻 Grassi e oli (azienda: soia)'), 'agri'],
    ['Sugar and sweets', null, null, L('🍬 Azúcar y dulces', '🍬 Sugar and sweets', '🍬 Sucre et sucreries', '🍬 Zucchero e dolci'), 'agri']];
  function usIncome() {
    var rows = ERS.income.rows, by = {};
    rows.forEach(function (r) { (by[r[0]] = by[r[0]] || {})[r[2]] = r[3]; });
    function last(id) { var o = by[id]; if (!o) return null; var ys = Object.keys(o).map(Number).sort(function (a, b) { return a - b; }), y = ys[ys.length - 1]; return { y: y, v: o[y] * 1000 / 1e9, p: o[y - 1] != null ? o[y - 1] * 1000 / 1e9 : null }; }
    return { last: last, by: by };
  }
  function usKpis() {
    var I = usIncome(), t = tx(T.us), bn = function (x) { return x ? nf(x.v, 1) + ' ' + tx(T.us.hVal) : '—'; };
    var one = function (ico, lab, id) { var x = I.last(id); return tile(ico.replace(/\s.*$/, ''), lab.replace(/^\S+\s/, ''), bn(x), x ? chg(pc(x.v, x.p)) + ' <span class="cp-m">' + esc(tx(T.vs)) + ' · ' + x.y + '</span>' : ''); };
    return '<div class="cp-tiles">' + one('🧺', tx(T.us.all), 'CRAUSAC--VAP').replace(esc(tx(T.us.all)), esc(tx(T.us.all))) + one('🌾', tx(T.us.crops), 'CRAUSCO--VAP') + one('🐄', tx(T.us.live), 'CRAUSLV--VAP') + one('💵', tx(T.us.net), 'FIAUSNTFI--P') + '</div><p class="di-movers-hint">' + esc(tx(T.us.inc)) + '</p>';
  }
  function usReceipts(list, title) {
    var I = usIncome(), rows = list.map(function (it) { var x = I.last(it[0]); if (!x) return ''; return '<tr><td>' + esc(tx(it[1])) + '</td><td class="num">' + nf(x.v, 1) + '</td><td class="num">' + chg(pc(x.v, x.p)) + '</td><td class="num cp-m">' + x.y + '</td></tr>'; }).join('');
    return rows ? '<div class="cp-g"><h3 class="cp-h3">' + esc(tx(title)) + '</h3><div class="di-table-wrap"><table class="di-table cp-tbl"><thead><tr><th></th><th class="num">' + esc(tx(T.us.hVal)) + '</th><th class="num">' + esc(tx(T.hYoy)) + '</th><th class="num"></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '';
  }
  function usCostRows(keys) {
    return keys.map(function (k) {
      var rows = (ERS.costs[k.k] || []).filter(function (r) { return r[3] === 'U.S. total'; }), ys = rows.map(function (r) { return r[4]; }); if (!ys.length) return '';
      var get = function (cat, item, y) { var r = rows.filter(function (x) { return x[0] === cat && x[1] === item && x[4] === y; })[0]; return r ? r[5] : null; };
      var y = Math.max.apply(null, ys), gv = null, op = null, net = null, fd = null;
      for (var yy = y; yy >= y - 3 && (gv == null || op == null || net == null); yy--) { gv = get('Gross value of production', 'Total, gross value of production', yy); op = get('Operating costs', 'Total, operating costs', yy); net = get('Net value', 'Value of production less total costs listed', yy); fd = get('Operating costs', 'Total, feed costs', yy); if (gv != null && op != null && net != null) { y = yy; break; } }
      if (gv == null || op == null) return '';
      return '<tr><td>' + esc(tx(k.l)) + '</td><td class="num">' + nf(gv, 2) + '</td><td class="num">' + nf(op, 2) + '</td><td class="num">' + (net == null ? '—' : '<span class="cp-chg ' + (net < 0 ? 'dn' : 'up') + '">' + nf(net, 2) + '</span>') + '</td><td class="num">' + (fd != null && op ? nf(100 * fd / op, 0) + ' %' : '—') + '</td><td class="cp-m">' + esc(tx(T.us[k.u])) + ' · ' + y + '</td></tr>';
    }).join('');
  }
  function usCosts() {
    var cr = US_COST.filter(function (x) { return x[2] === 'acre'; }).map(function (x) { return { k: x[0], l: x[1], u: x[2] }; }), lv = US_COST.filter(function (x) { return x[2] !== 'acre'; }).map(function (x) { return { k: x[0], l: x[1], u: x[2] }; });
    var th = '<thead><tr><th></th><th class="num">' + esc(tx(T.us.hGross)) + '</th><th class="num">' + esc(tx(T.us.hOp)) + '</th><th class="num">' + esc(tx(T.us.hNet)) + '</th><th class="num">' + esc(tx(T.us.hFeed)) + '</th><th>' + esc(tx(T.us.hUnit)) + '</th></tr></thead>';
    var tb = function (r) { return r ? '<div class="di-table-wrap"><table class="di-table cp-tbl">' + th + '<tbody>' + r + '</tbody></table></div>' : ''; };
    return '<p class="di-movers-hint">' + esc(tx(T.us.costSub)) + '</p><div class="cp-g cp-g-agri"><h3 class="cp-h3">' + esc(tx(T.g.agri)) + '</h3>' + tb(usCostRows(cr)) + '</div><div class="cp-g cp-g-gan"><h3 class="cp-h3">' + esc(tx(T.g.gan)) + '</h3>' + tb(usCostRows(lv)) + '</div>';
  }
  function usFoodTable(grp, title) {
    var cpi = {}, ppi = {}, yk = null;
    ERS.fpo.cpi.forEach(function (r) { cpi[r.n.split(' › ').pop()] = r; }); ERS.fpo.ppi.forEach(function (r) { ppi[r.n] = r; });
    var pick = function (r) { if (!r) return null; if (!yk) Object.keys(r.a).forEach(function (k) { if (/^Year-over-year/.test(k)) yk = k; }); return yk && r.a[yk] != null ? r.a[yk] : null; };
    var rows = US_FOOD.filter(function (f) { return f[4] === grp; }).map(function (f) {
      var c = pick(cpi[f[0]]), a = f[1] ? pick(ppi[f[1]]) : null, w = f[2] ? pick(ppi[f[2]]) : null; if (c == null && a == null && w == null) return '';
      return '<tr><td>' + esc(tx(f[3])) + '</td><td class="num">' + chg(c) + '</td><td class="num">' + chg(a) + '</td><td class="num">' + chg(w) + '</td></tr>';
    }).join('');
    var m = /to (\w+) (\d{4})$/.exec(yk || ''), mo = m ? monthName(m[2] + '-' + ('0' + (['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(m[1]) + 1)).slice(-2)) : '';
    return { html: rows ? '<div class="cp-g cp-g-' + grp + '"><h3 class="cp-h3">' + esc(tx(title)) + '</h3><div class="di-table-wrap"><table class="di-table cp-tbl"><thead><tr><th>' + esc(tx(T.hProd)) + '</th><th class="num">' + esc(tx(T.hCons)) + '</th><th class="num">' + esc(tx(T.hFarm)) + '</th><th class="num">' + esc(tx(T.us.hInd || T.hInd)) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' : '', mo: mo };
  }
  function usSections() {
    var a = usFoodTable('all', T.sec.precios), b = usFoodTable('agri', T.g.agri), c = usFoodTable('gan', T.g.gan), mo = a.mo || b.mo;
    var cc = 'US', hd = function (k) { return '<h2 class="cp-h2">' + esc(tx(T.sec[k])) + ' · ' + esc(flag(cc) + cname(cc)) + '</h2>'; };
    return '<section id="cp-renta" class="di-card cp-sec">' + hd('renta') + '<p class="di-movers-hint">' + esc(tx(T.us.inc)) + '</p><div class="cp-cols cp-cols1">' + usReceipts(US_C, T.us.rcpC) + usReceipts(US_L, T.us.rcpL) + '</div></section>' +
      '<section id="cp-costes" class="di-card cp-sec">' + hd('costes') + usCosts() + '</section>' +
      '<section id="cp-precios" class="di-card cp-sec">' + hd('precios') + '<p class="di-movers-hint">' + esc(tx(T.us.pSub).replace('{m}', mo)) + '</p>' + a.html + '<div class="cp-cols">' + b.html + c.html + '</div><p class="di-movers-hint">' + esc(tx(T.us.foodNote)) + '</p></section>';
  }

  /* ---------- Enlaces de detalle y fuentes ---------- */
  function sectionDetalle() {
    var cc = SEL.cc, ls = [['paises.html?c=' + (cc === 'EU27_2020' ? 'EU' : cc), '🧭', tx(T.ln.fiche)]];
    if (cc === 'ES') ls.push(['recan.html', '📊', tx(T.ln.recan)]);
    if (cc === 'US') { ls.push(['costes.html', '🌽', tx(T.ln.usc)]); ls.push(['insumos.html', '🧪', tx(T.ln.usi)]); }
    if (cc === 'CA') ls.push(['costes.html', '🍁', tx(T.ln.cac)]);
    if (cc !== 'US' && cc !== 'EU27_2020') ls.push(['pesca.html?c=' + cc, '🐟', tx(T.ln.fish)]);
    if (cc === 'EU27_2020') ls.push(['europa.html', '🇪🇺', tx(T.ln.eu)]);
    return '<section id="cp-detalle" class="di-card cp-sec"><h2 class="cp-h2">' + esc(tx(T.sec.detalle)) + '</h2><div class="cp-links">' + ls.map(function (l) { return '<a class="cp-link" href="' + esc(l[0]) + '"><span aria-hidden="true">' + l[1] + '</span> ' + esc(l[2]) + '</a>'; }).join('') + '</div><div id="cp-cites"></div></section>';
  }
  function cites() {
    var el = document.getElementById('cp-cites'), Q = global.DICite; if (!el || !Q || !Q.html) return;
    var out = []; if (SEL.cc === 'US') out.push(Q.html('usda_ers', { period: '' })); else { out.push(Q.html('eurostat', { period: EAA && EAA.years ? String(EAA.years[EAA.years.length - 1]) : '' })); }
    el.innerHTML = '<div class="pp-cites">' + out.filter(Boolean).join('') + '</div>';
  }

  /* ---------- Página ---------- */
  function applyFilter() { var b = document.getElementById('cp-body'); if (b) b.setAttribute('data-f', SEL.f); }
  function setUrl() { try { var u = new URL(global.location.href); u.searchParams.set('c', SEL.cc); u.searchParams.set('f', SEL.f); u.searchParams.set('m', SEL.m); global.history.replaceState(null, '', u.toString()); } catch (e) { /* sin URL */ } }
  function ccList() { var o = Object.keys(EAA.geos); if (o.indexOf('US') < 0) o.push('US'); return o; }
  function chips(items, cur, attr) { return items.map(function (it) { return '<button type="button" class="cp-chip" data-' + attr + '="' + it[0] + '" aria-pressed="' + (it[0] === cur ? 'true' : 'false') + '">' + esc(tx(it[1])) + '</button>'; }).join(''); }
  function barUp() {
    var F = S.frame; if (!F || !F.bar) return;
    F.bar(document.getElementById('pa-bar'), tx(T.bar), ['mapa', 'renta', 'costes', 'precios', 'detalle'].map(function (k) { return ['cp-' + k, tx(T.bars[k])]; }));
  }
  function metricsFor() { var ms = [['fi', T.m.fi], ['ic', T.m.ic], ['yoy', T.m.yoy]]; if (SEL.f !== 'gan') ms.splice(2, 0, ['fert', T.m.fert]); if (SEL.f !== 'agri') ms.splice(ms.length - 1, 0, ['feed', T.m.feed]); return ms; }
  function render() {
    var root = document.getElementById('cp-body'); if (!root || !EAA) return;
    var h1 = document.getElementById('cp-h1'), sub = document.getElementById('cp-sub'); if (h1) h1.textContent = tx(T.title); if (sub) sub.textContent = tx(T.sub); document.title = tx(T.title) + ' | Dehesa Index';
    if (!metricsFor().some(function (m) { return m[0] === SEL.m; })) SEL.m = 'fi';
    classify();
    var ccs = ccList().sort(function (a, b) { return cname(a).localeCompare(cname(b), LOC[lg()]); });
    var opts = ccs.map(function (c) { return '<option value="' + c + '"' + (c === SEL.cc ? ' selected' : '') + '>' + esc(flag(c) + cname(c)) + '</option>'; }).join('');
    root.innerHTML = '<div class="cp-pick"><label for="cp-cc">' + esc(tx(T.country)) + '</label> <select data-cpick="1" id="cp-cc" class="di-compare-select">' + opts + '</select>' +
      '<span class="cp-seg" role="group" aria-label="' + esc(tx(T.fl)) + '">' + chips([['all', T.f.all], ['agri', T.f.agri], ['gan', T.f.gan]], SEL.f, 'f') + '</span></div>' +
      '<section id="cp-mapa" class="cp-hero"><div class="cp-mapcol"><div class="cp-mrow"><span class="cp-lab">' + esc(tx(T.mt)) + '</span>' + chips(metricsFor(), SEL.m, 'm') + '</div>' +
      '<div class="cp-mrow"><span class="cp-seg">' + chips([['eu', T.views.eu], ['world', T.views.world]], SEL.v, 'v') + '</span></div><div id="cp-map" class="cp-map" role="img" aria-label="' + esc(tx(T.title)) + '"></div><div id="cp-legend" class="cp-legend"></div></div>' +
      '<aside class="cp-panel" id="cp-panel" aria-live="polite">' + panelHtml() + '</aside></section><div id="cp-secs"></div>';
    applyFilter(); wire(root); drawMap(); sections();
  }
  function sections() {
    var host = document.getElementById('cp-secs'); if (!host) return; var cc = SEL.cc, token = cc + '|' + Date.now(); host.setAttribute('data-t', token);
    var fin = function (html) { if (host.getAttribute('data-t') !== token) return; host.innerHTML = html + sectionDetalle(); cites(); barUp(); };
    if (cc === 'US') {
      host.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.loading)) + '</p>';
      getJSON('data/ers.json').then(function (d) { if (host.getAttribute('data-t') !== token) return; if (!d) { host.innerHTML = '<p>' + esc(tx(T.fail)) + '</p>'; return; } ERS = d; var k = document.getElementById('cp-us-kpis'); if (k) k.innerHTML = usKpis(); fin(usSections()); });
      return;
    }
    var base = sectionRenta() + sectionCostes();
    host.innerHTML = base + '<p class="di-movers-hint">' + esc(tx(T.loading)) + '</p>'; barUp();
    getJSON('data/eu-food-monitor/' + cc + '.json').then(function (D) { fin((base || '<p class="di-movers-hint">' + esc(tx(T.noEaa)) + '</p>') + sectionPrecios(D)); });
  }
  function pick(cc) { SEL.cc = cc; setUrl(); render(); }
  function wire(root) {
    var sel = document.getElementById('cp-cc'); if (sel) sel.onchange = function () { pick(sel.value); };
    [].forEach.call(root.querySelectorAll('[data-f]'), function (b) { if (b.tagName !== 'BUTTON') return; b.onclick = function () { SEL.f = b.getAttribute('data-f'); setUrl(); render(); }; });
    [].forEach.call(root.querySelectorAll('button[data-m]'), function (b) { b.onclick = function () { SEL.m = b.getAttribute('data-m'); setUrl(); render(); }; });
    [].forEach.call(root.querySelectorAll('button[data-v]'), function (b) { b.onclick = function () { SEL.v = b.getAttribute('data-v'); render(); }; });
    [].forEach.call(root.querySelectorAll('.cp-lk'), function (b) { b.onclick = function () { pick(b.getAttribute('data-cc')); }; });
  }
  function boot() {
    var root = document.getElementById('cp-body'); if (!root) return;
    if (S.init) S.init('costs');
    try { var q = new URLSearchParams(global.location.search), c = (q.get('c') || '').toUpperCase(), f = q.get('f'), m = q.get('m'); if (c) SEL.cc = c === 'EU' ? 'EU27_2020' : c; if (f === 'agri' || f === 'gan') SEL.f = f; if (m && T.m[m]) SEL.m = m; } catch (e) { /* sin parámetros */ }
    root.innerHTML = '<p class="di-movers-hint">' + esc(tx(T.loading)) + '</p>';
    Promise.all([getJSON('data/eu-farm-economics.json'), global.DICite && global.DICite.load ? global.DICite.load().catch(function () { return null; }) : null]).then(function (r) {
      if (!r[0] || !r[0].geos) { root.innerHTML = '<p>' + esc(tx(T.fail)) + '</p>'; return; }
      EAA = r[0]; if (SEL.cc !== 'US' && !EAA.geos[SEL.cc]) SEL.cc = 'ES';
      render();
    });
    S.onLangChange = function () { render(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
