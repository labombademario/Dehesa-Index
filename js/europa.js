/* Dehesa Index — Precios de la UE.
   Todas las series del Agri-food Data Portal de la Comisión Europea (data/eu/), por país, con gráfica comparable.
   No convierte ni promedia: cada línea es lo que publica el portal, en su unidad. */
(function () {
  'use strict';
  var COLORS = ['#2a6f97', '#a9491f', 'var(--positive)', '#b8891b', '#7a4a9a', '#3a8f9a'];
  var MAXSEL = 6;
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dfmt(iso) { try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function mfmt(iso) { try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso.slice(0, 7); } }

  var FAMILY_NAME = {
    cereales: ['Cereales', 'Cereals', 'Céréales', 'Cereali'],
    oleaginosas: ['Oleaginosas y tortas', 'Oilseeds and meals', 'Oléagineux et tourteaux', 'Semi oleosi e farine'],
    lacteos: ['Lácteos', 'Dairy', 'Produits laitiers', 'Latticini'],
    vacuno: ['Vacuno', 'Beef and cattle', 'Bovins', 'Bovini'],
    cerdo: ['Cerdo', 'Pigmeat', 'Porc', 'Suino'],
    pollo: ['Pollo', 'Poultry', 'Volaille', 'Pollo'],
    huevos: ['Huevos', 'Eggs', 'Œufs', 'Uova'],
    ovino: ['Cordero', 'Lamb', 'Agneau', 'Agnello'],
    arroz: ['Arroz', 'Rice', 'Riz', 'Riso'],
    leche: ['Leche cruda', 'Raw milk', 'Lait cru', 'Latte crudo'],
    aceite: ['Aceite de oliva', 'Olive oil', "Huile d'olive", "Olio d'oliva"],
    azucar: ['Azúcar', 'Sugar', 'Sucre', 'Zucchero'],
    vino: ['Vino', 'Wine', 'Vin', 'Vino'],
    fruta: ['Fruta y hortaliza', 'Fruit and vegetables', 'Fruits et légumes', 'Frutta e ortaggi'],
    fertilizantes: ['Fertilizantes', 'Fertilisers', 'Engrais', 'Fertilizzanti']
  };
  // Etiquetas del portal (en inglés) -> [es, en, fr, it]. Lo que no está aquí se muestra tal cual lo publica el portal.
  var W = {
    'Average': ['Media', 'Average', 'Moyenne', 'Media'],
    'Not informed': ['No informado', 'Not informed', 'Non renseigné', 'Non indicato'],
    'Refined olive oil (up to 0.3%)': ['Aceite de oliva refinado (hasta 0,3 %)', 'Refined olive oil (up to 0.3%)', 'Huile d’olive raffinée (jusqu’à 0,3 %)', 'Olio d’oliva raffinato (fino allo 0,3 %)'],
    'Refined olive-pomace oil (up to 0.3%)': ['Aceite de orujo de oliva refinado (hasta 0,3 %)', 'Refined olive-pomace oil (up to 0.3%)', 'Huile de grignons d’olive raffinée (jusqu’à 0,3 %)', 'Olio di sansa d’oliva raffinato (fino allo 0,3 %)'],
    'Crude olive-pomace oil (from 5 to 10%)': ['Aceite de orujo de oliva crudo (del 5 al 10 %)', 'Crude olive-pomace oil (from 5 to 10%)', 'Huile de grignons d’olive brute (de 5 à 10 %)', 'Olio di sansa d’oliva grezzo (dal 5 al 10 %)'],
    'Crude sunflower oil': ['Aceite de girasol crudo', 'Crude sunflower oil', 'Huile de tournesol brute', 'Olio di girasole grezzo'],
    'Crude rape oil': ['Aceite de colza crudo', 'Crude rape oil', 'Huile de colza brute', 'Olio di colza grezzo'],
    'Crude soya bean oil': ['Aceite de soja crudo', 'Crude soya bean oil', 'Huile de soja brute', 'Olio di soia grezzo'],
    'Above 35% protein content': ['Más del 35 % de proteína', 'Above 35% protein content', 'Plus de 35 % de protéines', 'Oltre il 35 % di proteine'],
    'Below 30% protein content': ['Menos del 30 % de proteína', 'Below 30% protein content', 'Moins de 30 % de protéines', 'Meno del 30 % di proteine'],
    'From dehulled seeds': ['De semillas descascarilladas', 'From dehulled seeds', 'À partir de graines décortiquées', 'Da semi decorticati'],
    'buyer warehouse': ['Almacén del comprador', 'buyer warehouse', 'Entrepôt de l’acheteur', 'Magazzino dell’acquirente'],
    'ex-factory': ['En fábrica', 'ex-factory', 'Départ usine', 'Franco fabbrica'],
    'Feed barley': ['Cebada forrajera', 'Feed barley', 'Orge fourragère', 'Orzo da foraggio'],
    'Malting barley': ['Cebada cervecera', 'Malting barley', 'Orge de brasserie', 'Orzo da birra'],
    'Malting barley - M2RH': ['Cebada cervecera M2RH', 'Malting barley M2RH', 'Orge de brasserie M2RH', 'Orzo da birra M2RH'],
    'Breadmaking common wheat': ['Trigo blando panificable', 'Breadmaking common wheat', 'Blé tendre panifiable', 'Grano tenero panificabile'],
    'Milling wheat': ['Trigo de molienda', 'Milling wheat', 'Blé meunier', 'Grano da macinazione'],
    'Feed wheat': ['Trigo forrajero', 'Feed wheat', 'Blé fourrager', 'Grano da foraggio'],
    'Durum wheat': ['Trigo duro', 'Durum wheat', 'Blé dur', 'Grano duro'],
    'Feed maize': ['Maíz forrajero', 'Feed maize', 'Maïs fourrager', 'Mais da foraggio'],
    'Feed oats': ['Avena forrajera', 'Feed oats', 'Avoine fourragère', 'Avena da foraggio'],
    'Milling oats': ['Avena de molienda', 'Milling oats', 'Avoine meunière', 'Avena da macinazione'],
    'Rye of breadmaking quality': ['Centeno panificable', 'Breadmaking rye', 'Seigle panifiable', 'Segale panificabile'],
    'Milling rye': ['Centeno de molienda', 'Milling rye', 'Seigle meunier', 'Segale da macinazione'],
    'Feed rye': ['Centeno forrajero', 'Feed rye', 'Seigle fourrager', 'Segale da foraggio'],
    'Triticale': ['Triticale', 'Triticale', 'Triticale', 'Triticale'],
    'Wheat bran': ['Salvado de trigo', 'Wheat bran', 'Son de blé', 'Crusca di frumento'],
    'National Average - Not Specified': ['Media nacional', 'National average', 'Moyenne nationale', 'Media nazionale'],
    'Departure from silo - after some storage - on truck or other transport means': ['Salida de silo (tras almacenamiento), en camión', 'Ex-silo (after storage), on truck', 'Départ silo (après stockage), camion', 'Franco silo (dopo stoccaggio), camion'],
    'Departure from farm or from production area - on truck or other transport means': ['Salida de explotación o zona de producción, en camión', 'Ex-farm or production area, on truck', 'Départ ferme ou zone de production, camion', 'Franco azienda o zona di produzione, camion'],
    'Deliver to first customer - silo or processing plant - on truck or other transport means': ['Entregado al primer cliente (silo o planta), en camión', 'Delivered to first customer (silo or plant), on truck', 'Livré au premier client (silo ou usine), camion', 'Consegnato al primo cliente (silo o impianto), camion'],
    'Price at farm gate': ['Precio en explotación', 'Farm-gate price', 'Prix départ ferme', "Prezzo all'azienda"],
    'Delivered to port - grain delivered to a port silo by train or truck or barge': ['Entregado en puerto (silo portuario)', 'Delivered to port (port silo)', 'Livré au port (silo portuaire)', 'Consegnato al porto (silo portuale)'],
    'Free On Board - Incoterm': ['FOB (franco a bordo)', 'FOB (free on board)', 'FOB (franco à bord)', 'FOB (franco a bordo)'],
    'Cost, Insurance and Freight - Incoterm': ['CIF (coste, seguro y flete)', 'CIF (cost, insurance, freight)', 'CIF (coût, assurance, fret)', 'CIF (costo, assicurazione, nolo)'],
    'Shipped to the place (port), unloaded, on truck leaving port': ['Puesto en puerto, descargado, en camión', 'At port, unloaded, on truck', 'Au port, déchargé, camion', 'Al porto, scaricato, camion'],
    'Rendu Port - Delivered': ['Entregado en puerto (rendu)', 'Delivered at port (rendu)', 'Rendu port', 'Reso porto'],
    'Sunflower seed': ['Semilla de girasol', 'Sunflower seed', 'Graine de tournesol', 'Semi di girasole'],
    'Rapeseed': ['Colza', 'Rapeseed', 'Colza', 'Colza'],
    'Rapeseed meal': ['Torta de colza', 'Rapeseed meal', 'Tourteau de colza', 'Farina di colza'],
    'Sunflower seed meal': ['Torta de girasol', 'Sunflower seed meal', 'Tourteau de tournesol', 'Farina di girasole'],
    'Soya meal': ['Harina de soja', 'Soya meal', 'Tourteau de soja', 'Farina di soia'],
    'Soya beans': ['Soja en grano', 'Soya beans', 'Soja (grain)', 'Soia (semi)'],
    'Standard': ['Estándar', 'Standard', 'Standard', 'Standard'],
    'High-oleic': ['Alto oleico', 'High-oleic', 'Haut oléique', 'Alto oleico'],
    '30-35% protein content': ['30-35 % de proteína', '30-35% protein', '30-35 % de protéines', '30-35% di proteine'],
    '40-50% protein content': ['40-50 % de proteína', '40-50% protein', '40-50 % de protéines', '40-50% di proteine'],
    'DEPSILO': ['Salida de silo', 'Ex-silo', 'Départ silo', 'Franco silo'], 'DEPSILO GEX': ['Salida de silo (GEX)', 'Ex-silo (GEX)', 'Départ silo (GEX)', 'Franco silo (GEX)'],
    'DELPROC': ['Entregado a la transformadora', 'Delivered to processor', "Livré à l'usine", 'Consegnato al trasformatore'],
    'FGATE': ['Puerta de explotación', 'Farm gate', 'Départ ferme', 'Cancello azienda'], 'Départ': ['Salida (départ)', 'Ex-works (départ)', 'Départ', 'Franco partenza'],
    'BUTTER': ['Mantequilla', 'Butter', 'Beurre', 'Burro'], 'SMP': ['Leche desnatada en polvo', 'Skimmed milk powder', 'Poudre de lait écrémé', 'Latte scremato in polvere'],
    'WMP': ['Leche entera en polvo', 'Whole milk powder', 'Poudre de lait entier', 'Latte intero in polvere'], 'DRINKING MILK': ['Leche de consumo', 'Drinking milk', 'Lait de consommation', 'Latte alimentare'],
    'WHEYPOWDER': ['Suero en polvo', 'Whey powder', 'Lactosérum en poudre', 'Siero in polvere'], 'CREAM': ['Nata', 'Cream', 'Crème', 'Panna'],
    'EDAM': ['Queso Edam', 'Edam cheese', 'Edam', 'Edam'], 'GOUDA': ['Queso Gouda', 'Gouda cheese', 'Gouda', 'Gouda'], 'EMMENTAL': ['Queso Emmental', 'Emmental cheese', 'Emmental', 'Emmental'], 'CHEDDAR': ['Queso Cheddar', 'Cheddar cheese', 'Cheddar', 'Cheddar'],
    'Young bulls': ['Machos jóvenes (A)', 'Young bulls (A)', 'Jeunes bovins (A)', 'Giovani tori (A)'], 'Bulls': ['Toros (B)', 'Bulls (B)', 'Taureaux (B)', 'Tori (B)'],
    'Steers': ['Bueyes (C)', 'Steers (C)', 'Bœufs (C)', 'Buoi (C)'], 'Cows': ['Vacas (D)', 'Cows (D)', 'Vaches (D)', 'Vacche (D)'], 'Heifers': ['Novillas (E)', 'Heifers (E)', 'Génisses (E)', 'Manze (E)'],
    'Young cattle': ['Ganado joven (Z)', 'Young cattle (Z)', 'Jeunes bovins (Z)', 'Giovani bovini (Z)'], 'Calves slaughtered <8M': ['Terneros sacrificados (<8 meses)', 'Calves slaughtered (<8 months)', 'Veaux abattus (<8 mois)', 'Vitelli macellati (<8 mesi)'],
    'Adult male indicative price': ['Precio indicativo de machos adultos', 'Adult male indicative price', 'Prix indicatif des mâles adultes', 'Prezzo indicativo dei maschi adulti'],
    'S': ['Canal clase S', 'Carcass class S', 'Carcasse classe S', 'Carcassa classe S'], 'E': ['Canal clase E', 'Carcass class E', 'Carcasse classe E', 'Carcassa classe E'], 'R': ['Canal clase R', 'Carcass class R', 'Carcasse classe R', 'Carcassa classe R'],
    'Piglet': ['Lechón', 'Piglet', 'Porcelet', 'Suinetto'], 'Average S + E': ['Media S + E', 'Average S + E', 'Moyenne S + E', 'Media S + E'],
    'Whole broiler (65%)': ['Pollo entero (65 %)', 'Whole broiler (65%)', 'Poulet entier (65 %)', 'Pollo intero (65%)'], 'Breast Fillet': ['Filete de pechuga', 'Breast fillet', 'Filet de poitrine', 'Filetto di petto'],
    'Legs': ['Muslos', 'Legs', 'Cuisses', 'Cosce'], 'Selling price': ['Precio de venta', 'Selling price', 'Prix de vente', 'Prezzo di vendita'],
    'Barn': ['Suelo', 'Barn', 'Au sol', 'A terra'], 'Cage': ['Jaula', 'Cage', 'Cage', 'Gabbia'], 'Free range': ['Camperos', 'Free range', 'Plein air', 'Allevati all’aperto'], 'Organic': ['Ecológicos', 'Organic', 'Bio', 'Biologiche'],
    'Heavy Lamb': ['Cordero pesado', 'Heavy lamb', 'Agneau lourd', 'Agnello pesante'], 'Light Lamb': ['Cordero ligero', 'Light lamb', 'Agneau léger', 'Agnello leggero'],
    'Paddy': ['Arroz cáscara', 'Paddy rice', 'Riz paddy', 'Risone'], 'Milled non parboiled': ['Blanco (no vaporizado)', 'Milled, non-parboiled', 'Blanchi (non étuvé)', 'Lavorato (non parboiled)'], 'Broken': ['Partido', 'Broken', 'Brisures', 'Rotture'],
    'Japonica': ['Japónica', 'Japonica', 'Japonica', 'Japonica'], 'Indica': ['Índica', 'Indica', 'Indica', 'Indica'], 'Avg': ['media', 'average', 'moyenne', 'media'],
    'Raw milk': ['Leche cruda', 'Raw milk', 'Lait cru', 'Latte crudo'], 'Organic raw milk': ['Leche cruda ecológica', 'Organic raw milk', 'Lait cru bio', 'Latte crudo biologico'],
    'Extra virgin olive oil (up to 0.8%)': ['Aceite de oliva virgen extra (hasta 0,8 %)', 'Extra virgin olive oil (up to 0.8%)', "Huile d'olive vierge extra (jusqu'à 0,8 %)", "Olio extra vergine d'oliva (fino a 0,8%)"],
    'Virgin olive oil (up to 2%)': ['Aceite de oliva virgen (hasta 2 %)', 'Virgin olive oil (up to 2%)', "Huile d'olive vierge (jusqu'à 2 %)", "Olio vergine d'oliva (fino a 2%)"],
    'Lampante olive oil (2%)': ['Aceite de oliva lampante (2 %)', 'Lampante olive oil (2%)', "Huile d'olive lampante (2 %)", "Olio d'oliva lampante (2%)"],
    'Monthly data': ['Datos mensuales', 'Monthly data', 'Données mensuelles', 'Dati mensili'], 'Short term contracts': ['Contratos a corto plazo', 'Short-term contracts', 'Contrats à court terme', 'Contratti a breve termine'],
    'N (Nitrogen)': ['Nitrógeno (N)', 'Nitrogen (N)', 'Azote (N)', 'Azoto (N)'], 'P (Phosphorus)': ['Fósforo (P)', 'Phosphorus (P)', 'Phosphore (P)', 'Fosforo (P)'], 'K (Potash)': ['Potasa (K)', 'Potash (K)', 'Potasse (K)', 'Potassio (K)']
  };
  var TX = {
    es: {
      title: 'Precios de la UE', sub: 'Todas las series de precios que publica la Comisión Europea (Agri-food Data Portal), país por país. Elige un producto y compara países en una misma gráfica.',
      family: 'Familia', product: 'Producto', filter: 'Filtrar productos…', regions: 'Países y zonas', pickHint: 'Elige hasta 6 (clic para añadir o quitar)', range: 'Periodo',
      table: 'Último dato por país', country: 'País o zona', last: 'Último', date: 'Fecha', vsPrev: 'vs. anterior', vsYear: 'vs. hace un año', since: 'Desde', stale: 'sin actualizar',
      market: 'Mercado', csv: 'Exportar CSV', noData: 'Sin datos para esta selección.', loading: 'Cargando…', err: 'No se han podido cargar los datos.',
      src: 'Fuente: Comisión Europea, Agri-food Data Portal (API pública). Cada línea es el precio que publica el portal para ese país y producto, en su unidad, sin convertir ni promediar. Si un país publica varios mercados, cada uno aparece por separado. El portal no publica la fecha en que sube cada dato.',
      unitNote: 'Unidad', series: 'series', points: 'puntos', euNote: '“UE” es el agregado que publica la Comisión, no una media calculada por Dehesa Index.', all: 'Todo', y: 'a', updated: 'Actualizado',
      methodLink: 'Metodología', linkProd: 'Ficha de producto', linkPrices: 'Panel de precios', more: 'Sigue explorando', noneSel: 'Elige al menos un país.', freqW: 'semanal', freqM: 'mensual', freq: 'Frecuencia', canal: 'Peso canal salvo indicación'
    },
    en: {
      title: 'EU prices', sub: 'Every price series the European Commission publishes (Agri-food Data Portal), country by country. Pick a product and compare countries on one chart.',
      family: 'Family', product: 'Product', filter: 'Filter products…', regions: 'Countries and areas', pickHint: 'Choose up to 6 (click to add or remove)', range: 'Period',
      table: 'Latest reading by country', country: 'Country or area', last: 'Latest', date: 'Date', vsPrev: 'vs. previous', vsYear: 'vs. a year ago', since: 'Since', stale: 'not updated',
      market: 'Market', csv: 'Export CSV', noData: 'No data for this selection.', loading: 'Loading…', err: 'The data could not be loaded.',
      src: 'Source: European Commission, Agri-food Data Portal (public API). Each line is the price the portal publishes for that country and product, in its own unit, not converted or averaged. When a country publishes several markets, each is shown separately. The portal does not publish the date each figure was released.',
      unitNote: 'Unit', series: 'series', points: 'points', euNote: '“EU” is the aggregate published by the Commission, not an average calculated by Dehesa Index.', all: 'All', y: 'y', updated: 'Updated',
      methodLink: 'Methodology', linkProd: 'Product page', linkPrices: 'Price dashboard', more: 'Keep exploring', noneSel: 'Pick at least one country.', freqW: 'weekly', freqM: 'monthly', freq: 'Frequency', canal: 'Carcass weight unless stated'
    },
    fr: {
      title: 'Prix de l’UE', sub: 'Toutes les séries de prix publiées par la Commission européenne (Agri-food Data Portal), pays par pays. Choisissez un produit et comparez les pays sur un même graphique.',
      family: 'Famille', product: 'Produit', filter: 'Filtrer les produits…', regions: 'Pays et zones', pickHint: 'Choisissez jusqu’à 6 (clic pour ajouter ou retirer)', range: 'Période',
      table: 'Dernière valeur par pays', country: 'Pays ou zone', last: 'Dernier', date: 'Date', vsPrev: 'vs précédent', vsYear: 'vs il y a un an', since: 'Depuis', stale: 'non mis à jour',
      market: 'Marché', csv: 'Exporter en CSV', noData: 'Aucune donnée pour cette sélection.', loading: 'Chargement…', err: 'Impossible de charger les données.',
      src: 'Source : Commission européenne, Agri-food Data Portal (API publique). Chaque courbe est le prix publié par le portail pour ce pays et ce produit, dans son unité, sans conversion ni moyenne. Si un pays publie plusieurs marchés, chacun apparaît séparément. Le portail ne publie pas la date de mise en ligne de chaque valeur.',
      unitNote: 'Unité', series: 'séries', points: 'points', euNote: '« UE » est l’agrégat publié par la Commission, pas une moyenne calculée par Dehesa Index.', all: 'Tout', y: 'a', updated: 'Mis à jour',
      methodLink: 'Méthodologie', linkProd: 'Fiche produit', linkPrices: 'Tableau des prix', more: 'Continuer', noneSel: 'Choisissez au moins un pays.', freqW: 'hebdomadaire', freqM: 'mensuelle', freq: 'Fréquence', canal: 'Poids carcasse sauf indication'
    },
    it: {
      title: 'Prezzi UE', sub: 'Tutte le serie di prezzi pubblicate dalla Commissione europea (Agri-food Data Portal), paese per paese. Scegli un prodotto e confronta i paesi in un unico grafico.',
      family: 'Famiglia', product: 'Prodotto', filter: 'Filtra i prodotti…', regions: 'Paesi e zone', pickHint: 'Scegli fino a 6 (clic per aggiungere o togliere)', range: 'Periodo',
      table: 'Ultimo dato per paese', country: 'Paese o zona', last: 'Ultimo', date: 'Data', vsPrev: 'vs precedente', vsYear: 'vs un anno fa', since: 'Da', stale: 'non aggiornato',
      market: 'Mercato', csv: 'Esporta CSV', noData: 'Nessun dato per questa selezione.', loading: 'Caricamento…', err: 'Impossibile caricare i dati.',
      src: 'Fonte: Commissione europea, Agri-food Data Portal (API pubblica). Ogni linea è il prezzo pubblicato dal portale per quel paese e prodotto, nella sua unità, senza conversioni né medie. Se un paese pubblica più mercati, ciascuno compare separatamente. Il portale non pubblica la data di rilascio di ogni dato.',
      unitNote: 'Unità', series: 'serie', points: 'punti', euNote: '«UE» è l’aggregato pubblicato dalla Commissione, non una media calcolata da Dehesa Index.', all: 'Tutto', y: 'a', updated: 'Aggiornato',
      methodLink: 'Metodologia', linkProd: 'Scheda prodotto', linkPrices: 'Pannello prezzi', more: 'Continua', noneSel: 'Scegli almeno un paese.', freqW: 'settimanale', freqM: 'mensile', freq: 'Frequenza', canal: 'Peso carcassa salvo indicazione'
    }
  };
  function tr() { return TX[lang()] || TX.es; }
  // Fruta y hortaliza: producto y variedad se traducen a español; en otros idiomas se deja el nombre del portal (inglés)
  var FRUIT = { 'Apples': 'Manzanas', 'Bananas': 'Plátanos', 'Tomatoes': 'Tomates', 'Carrots': 'Zanahorias', 'Pears': 'Peras', 'Onions': 'Cebollas', 'Lettuces': 'Lechugas', 'Peppers': 'Pimientos', 'Cauliflowers': 'Coliflores', 'Oranges': 'Naranjas', 'Cucumbers': 'Pepinos', 'Egg Plants': 'Berenjenas', 'Lemons': 'Limones', 'Garlic': 'Ajos', 'Courgettes': 'Calabacines', 'Peaches': 'Melocotones', 'Table Grapes': 'Uva de mesa', 'Beans': 'Judías verdes', 'Strawberries': 'Fresas', 'Nectarines': 'Nectarinas', 'Cabbage': 'Repollos', 'Plums': 'Ciruelas', 'Kiwis Hayward': 'Kiwis Hayward', 'Melons': 'Melones', 'Leeks': 'Puerros', 'Mandarins': 'Mandarinas', 'Cultivated Mushrooms': 'Champiñones', 'Clementines': 'Clementinas', 'Water Melons': 'Sandías', 'Cherries': 'Cerezas', 'Apricots': 'Albaricoques', 'Avocados': 'Aguacates', 'Asparagus': 'Espárragos', 'Satsumas': 'Satsumas', 'Ware potatoes': 'Patatas' };
  var FVAR = { 'All types and varieties': 'Todas las variedades', 'Round': 'Redondo', 'Cherry/Special': 'Cherry/especial', 'Red delicious and other red varieties': 'Red delicious y otras rojas', 'Golden delicious': 'Golden delicious', 'Smooth varieties': 'Lisos', 'White': 'Blanco', 'White flesh': 'Pulpa blanca', 'Yellow flesh': 'Pulpa amarilla', 'Large size': 'Calibre grande', 'Small size': 'Calibre pequeño', 'Closed': 'Cerrados', 'Spring': 'Primavera', 'Violet': 'Morado', 'Flat': 'Planos', 'All sweet varieties': 'Todas las dulces', 'Navel': 'Navel', 'Yellow flesh - Large packaging': 'Pulpa amarilla, envase grande', 'Yellow flesh - Small packaging': 'Pulpa amarilla, envase pequeño', 'White flesh - Large packaging': 'Pulpa blanca, envase grande', 'White flesh - Small packaging': 'Pulpa blanca, envase pequeño', 'All types and varieties - large packaging': 'Todas las variedades, envase grande', 'All types and varieties - small packaging': 'Todas las variedades, envase pequeño', 'National weighted average of all types and varieties': 'Media nacional ponderada de todas las variedades', 'National weighted average of main varieties covering at least 70 % of the representative market in the reference period of the notification': 'Media nacional ponderada de las principales variedades (≥ 70 % del mercado)', 'Iceberg': 'Iceberg', 'With seeds in large packaging': 'Con pepitas, envase grande', 'With seeds in small packaging': 'Con pepitas, envase pequeño', 'Seedless in large packaging': 'Sin pepitas, envase grande', 'Seedless in small packaging': 'Sin pepitas, envase pequeño', 'Avec pépins - With seeds': 'Con pepitas' };
  var FSTAGE = { 'Ex-packaging station price': ['Salida de central de envasado', 'Ex-packaging station'], 'Farmgate price': ['Precio en finca', 'Farm-gate price'], 'Retail buying price': ['Compra del comercio minorista', 'Retail buying price'], 'Retail selling price': ['Venta al consumidor', 'Retail selling price'] };
  // Fruta y hortaliza en francés e italiano (en inglés se deja el nombre del portal; los nombres de variedad propios, p. ej. Gala o Conference, no se traducen).
  var FX = {
    fr: {
      fruit: { 'Apples': 'Pommes', 'Bananas': 'Bananes', 'Tomatoes': 'Tomates', 'Carrots': 'Carottes', 'Pears': 'Poires', 'Onions': 'Oignons', 'Lettuces': 'Laitues', 'Peppers': 'Poivrons', 'Cauliflowers': 'Choux-fleurs', 'Oranges': 'Oranges', 'Cucumbers': 'Concombres', 'Egg Plants': 'Aubergines', 'Lemons': 'Citrons', 'Garlic': 'Ail', 'Courgettes': 'Courgettes', 'Peaches': 'Pêches', 'Table Grapes': 'Raisin de table', 'Beans': 'Haricots verts', 'Strawberries': 'Fraises', 'Nectarines': 'Nectarines', 'Cabbage': 'Choux', 'Plums': 'Prunes', 'Kiwis Hayward': 'Kiwis Hayward', 'Melons': 'Melons', 'Leeks': 'Poireaux', 'Mandarins': 'Mandarines', 'Cultivated Mushrooms': 'Champignons de culture', 'Clementines': 'Clémentines', 'Water Melons': 'Pastèques', 'Cherries': 'Cerises', 'Apricots': 'Abricots', 'Avocados': 'Avocats', 'Asparagus': 'Asperges', 'Satsumas': 'Satsumas', 'Ware potatoes': 'Pommes de terre' },
      vari: { 'All types and varieties': 'Toutes variétés', 'Round': 'Rondes', 'Cherry/Special': 'Cerise/spéciale', 'Red delicious and other red varieties': 'Red delicious et autres variétés rouges', 'Golden delicious': 'Golden delicious', 'Smooth varieties': 'Variétés lisses', 'White': 'Blanc', 'White flesh': 'Chair blanche', 'Yellow flesh': 'Chair jaune', 'Large size': 'Gros calibre', 'Small size': 'Petit calibre', 'Closed': 'Fermés', 'Spring': 'Printemps', 'Violet': 'Violet', 'Flat': 'Plates', 'All sweet varieties': 'Toutes variétés douces', 'Navel': 'Navel', 'Yellow flesh - Large packaging': 'Chair jaune, grand conditionnement', 'Yellow flesh - Small packaging': 'Chair jaune, petit conditionnement', 'White flesh - Large packaging': 'Chair blanche, grand conditionnement', 'White flesh - Small packaging': 'Chair blanche, petit conditionnement', 'All types and varieties - large packaging': 'Toutes variétés, grand conditionnement', 'All types and varieties - small packaging': 'Toutes variétés, petit conditionnement', 'National weighted average of all types and varieties': 'Moyenne nationale pondérée de toutes variétés', 'National weighted average of main varieties covering at least 70 % of the representative market in the reference period of the notification': 'Moyenne nationale pondérée des principales variétés (≥ 70 % du marché)', 'Iceberg': 'Iceberg', 'With seeds in large packaging': 'Avec pépins, grand conditionnement', 'With seeds in small packaging': 'Avec pépins, petit conditionnement', 'Seedless in large packaging': 'Sans pépins, grand conditionnement', 'Seedless in small packaging': 'Sans pépins, petit conditionnement', 'Avec pépins - With seeds': 'Avec pépins' },
      stage: { 'Ex-packaging station price': 'Sortie de station de conditionnement', 'Farmgate price': 'Prix départ exploitation', 'Retail buying price': 'Prix d’achat du commerce de détail', 'Retail selling price': 'Prix de vente au consommateur' },
      org: 'Bio', ban: 'Bananes'
    },
    it: {
      fruit: { 'Apples': 'Mele', 'Bananas': 'Banane', 'Tomatoes': 'Pomodori', 'Carrots': 'Carote', 'Pears': 'Pere', 'Onions': 'Cipolle', 'Lettuces': 'Lattughe', 'Peppers': 'Peperoni', 'Cauliflowers': 'Cavolfiori', 'Oranges': 'Arance', 'Cucumbers': 'Cetrioli', 'Egg Plants': 'Melanzane', 'Lemons': 'Limoni', 'Garlic': 'Aglio', 'Courgettes': 'Zucchine', 'Peaches': 'Pesche', 'Table Grapes': 'Uva da tavola', 'Beans': 'Fagiolini', 'Strawberries': 'Fragole', 'Nectarines': 'Pesche noci', 'Cabbage': 'Cavoli', 'Plums': 'Prugne', 'Kiwis Hayward': 'Kiwi Hayward', 'Melons': 'Meloni', 'Leeks': 'Porri', 'Mandarins': 'Mandarini', 'Cultivated Mushrooms': 'Funghi coltivati', 'Clementines': 'Clementine', 'Water Melons': 'Angurie', 'Cherries': 'Ciliegie', 'Apricots': 'Albicocche', 'Avocados': 'Avocado', 'Asparagus': 'Asparagi', 'Satsumas': 'Satsuma', 'Ware potatoes': 'Patate' },
      vari: { 'All types and varieties': 'Tutte le varietà', 'Round': 'Rotondi', 'Cherry/Special': 'Ciliegino/speciale', 'Red delicious and other red varieties': 'Red delicious e altre varietà rosse', 'Golden delicious': 'Golden delicious', 'Smooth varieties': 'Varietà lisce', 'White': 'Bianco', 'White flesh': 'Polpa bianca', 'Yellow flesh': 'Polpa gialla', 'Large size': 'Calibro grande', 'Small size': 'Calibro piccolo', 'Closed': 'Chiusi', 'Spring': 'Primaverile', 'Violet': 'Viola', 'Flat': 'Piatte', 'All sweet varieties': 'Tutte le varietà dolci', 'Navel': 'Navel', 'Yellow flesh - Large packaging': 'Polpa gialla, confezione grande', 'Yellow flesh - Small packaging': 'Polpa gialla, confezione piccola', 'White flesh - Large packaging': 'Polpa bianca, confezione grande', 'White flesh - Small packaging': 'Polpa bianca, confezione piccola', 'All types and varieties - large packaging': 'Tutte le varietà, confezione grande', 'All types and varieties - small packaging': 'Tutte le varietà, confezione piccola', 'National weighted average of all types and varieties': 'Media nazionale ponderata di tutte le varietà', 'National weighted average of main varieties covering at least 70 % of the representative market in the reference period of the notification': 'Media nazionale ponderata delle principali varietà (≥ 70 % del mercato)', 'Iceberg': 'Iceberg', 'With seeds in large packaging': 'Con semi, confezione grande', 'With seeds in small packaging': 'Con semi, confezione piccola', 'Seedless in large packaging': 'Senza semi, confezione grande', 'Seedless in small packaging': 'Senza semi, confezione piccola', 'Avec pépins - With seeds': 'Con semi', 'Autres laitues pommées': 'Altre lattughe a cappuccio', 'Oignons blancs': 'Cipolle bianche', 'Oignons jaunes': 'Cipolle gialle', 'Poivron blanc': 'Peperone bianco', 'Allongé vert': 'Allungato verde', 'Carré coloré': 'Quadrato colorato', 'Carré vert': 'Quadrato verde', 'Allongées': 'Allungate', 'Prunes européennes': 'Prugne europee' },
      stage: { 'Ex-packaging station price': 'Uscita dal centro di confezionamento', 'Farmgate price': 'Prezzo alla produzione (in azienda)', 'Retail buying price': 'Prezzo d’acquisto del dettaglio', 'Retail selling price': 'Prezzo di vendita al consumo' },
      org: 'Bio', ban: 'Banane'
    }
  };
  function w(s) {
    var lg = lang(), r = W[s]; if (r) return r[LI[lg] || 0];
    var gm = /^(.+?) - ([A-Z0-9]{2,6})$/.exec(s); if (gm && W[gm[1]]) return W[gm[1]][LI[lg] || 0] + ' (' + gm[2] + ')';   // variedad/calidad con codigo: «Malting barley - M2RP»
    if (lg === 'en') return FSTAGE[s] ? FSTAGE[s][1] : s;
    var X = FX[lg], st = lg === 'es' ? (FSTAGE[s] || [])[0] : X.stage[s];
    if (st) return st;
    var fr = lg === 'es' ? FRUIT : X.fruit, vr = lg === 'es' ? FVAR : X.vari;
    var b = /^Bananas [–-] EU [–-] (.*)$/.exec(s); if (b) return (lg === 'es' ? 'Plátanos' : X.ban) + ' · UE · ' + (vr[b[1]] || b[1]);
    var m = /^(Organic-)?(Ware potatoes|[A-Za-z ]+?)(?:,.*?)?(?: [-–] (.*))?$/.exec(s);
    if (m && fr[m[2]]) {
      var v = m[3] ? (vr[m[3]] || m[3].replace(/^Bananas? [-–] /, '')) : '';
      return (m[1] ? (lg === 'es' ? 'Ecológicas' : X.org) + ' · ' : '') + fr[m[2]] + (v ? ' · ' + v : '');
    }
    return s;
  }
  function seriesTitle(parts) { return parts.map(w).join(' · '); }
  var ISO = { EL: 'GR', UK: 'GB' };
  var AGG = { 'EU': ['UE (agregado de la Comisión)', 'EU (Commission aggregate)', 'UE (agrégat de la Commission)', 'UE (aggregato della Commissione)'],
    'EU+UK': ['UE + Reino Unido', 'EU + UK', 'UE + Royaume-Uni', 'UE + Regno Unito'], 'EU-UK': ['UE (EU-UK)', 'EU (EU-UK)', 'UE (EU-UK)', 'UE (EU-UK)'],
    'EU Average': ['Media UE', 'EU average', 'Moyenne UE', 'Media UE'], 'Region 1': ['Región 1', 'Region 1', 'Région 1', 'Regione 1'], 'Region 2': ['Región 2', 'Region 2', 'Région 2', 'Regione 2'], 'Region 3': ['Región 3', 'Region 3', 'Région 3', 'Regione 3'] };
  var dn = {};
  function cname(code) {
    if (AGG[code]) return AGG[code][LI[lang()] || 0];
    var L = lang(); try { dn[L] = dn[L] || new Intl.DisplayNames([L], { type: 'region' }); var n = dn[L].of(ISO[code] || code); return n && n !== (ISO[code] || code) ? n : code; } catch (e) { return code; }
  }
  function rname(r) { return cname(r.c) + (r.m ? ' · ' + r.m : ''); }
  function rkey(r) { return r.c + (r.m ? '|' + r.m : ''); }

  var ST = { idx: null, fams: {}, sers: {}, fam: 'cereales', sid: null, sel: null, range: 'auto', q: '' };

  function get(file) { return fetch(file).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function setUrl() { try { var q = new URLSearchParams(); q.set('f', ST.fam); if (ST.sid) q.set('s', ST.sid); if (ST.sel && ST.sel.length) q.set('r', ST.sel.join(',')); history.replaceState(null, '', 'europa.html?' + q.toString()); } catch (e) {} }

  function pct(a, b) { return b ? (a / b - 1) * 100 : null; }
  function delta(v) { if (v === null || v === undefined || isNaN(v)) return '<span style="color:var(--text-faint)">—</span>'; var c = v > 0.05 ? 'var(--positive)' : v < -0.05 ? '#a9491f' : 'var(--text-faint)'; return '<span style="color:' + c + ';font-weight:600">' + (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %</span>'; }
  function famOf(id) { for (var i = 0; i < ST.idx.families.length; i++) if (ST.idx.families[i].id === id) return ST.idx.families[i]; return null; }
  function curSeriesMeta() { var f = ST.fams[ST.fam]; if (!f) return null; for (var i = 0; i < f.series.length; i++) if (f.series[i].id === ST.sid) return f.series[i]; return null; }

  function defaultSel(meta) {
    var have = {}; meta.regions.forEach(function (r) { have[rkey(r)] = r; });
    var pref = ['EU', 'ES', 'FR', 'DE', 'IT', 'NL', 'PL', 'IE'], out = [];
    pref.forEach(function (c) { if (have[c] && out.length < 4) out.push(c); });
    if (out.length < 3) meta.regions.slice().sort(function (a, b) { return b.n - a.n; }).forEach(function (r) { if (out.length < 4 && out.indexOf(rkey(r)) < 0) out.push(rkey(r)); });
    return out;
  }

  function rangesFor(d) {
    var span = 0; d.regions.forEach(function (r) { var s = r.d[r.d.length - 1] - r.d[0]; if (s > span) span = s; });
    var all = [['1y', 365], ['2y', 730], ['5y', 1826], ['10y', 3652]], out = [];
    all.forEach(function (x) { if (span > x[1] * 1.15) out.push(x); });
    out.push(['max', 0]); return out;
  }
  function dayIso(n) { return new Date(Date.UTC(2000, 0, 1) + n * 864e5).toISOString().slice(0, 10); }

  function renderChartAndTable(t, meta, d) {
    var freqM = meta.freq === 'monthly', byKey = {};
    d.regions.forEach(function (r) { byKey[rkey(r)] = r; });
    var ranges = rangesFor(d), rk = ST.range;
    var valid = ranges.map(function (x) { return x[0]; });
    if (valid.indexOf(rk) < 0) rk = valid.indexOf('2y') >= 0 ? '2y' : 'max';
    ST.range = rk;
    var rdays = 0; ranges.forEach(function (x) { if (x[0] === rk) rdays = x[1]; });
    var maxDay = 0; d.regions.forEach(function (r) { if (r.d[r.d.length - 1] > maxDay) maxDay = r.d[r.d.length - 1]; });
    var from = rdays ? maxDay - rdays : -1e9;
    var sel = (ST.sel || []).filter(function (k) { return byKey[k]; });
    var series = sel.map(function (k, i) {
      var r = byKey[k], pts = [];
      var gap = freqM ? 75 : 28, prevD = null;
      for (var j = 0; j < r.d.length; j++) if (r.d[j] >= from) {
        // hueco largo sin datos: se corta la línea en vez de unir con una recta que parecería dato
        if (prevD !== null && r.d[j] - prevD > gap) pts.push({ x: Date.UTC(2000, 0, 1) + (prevD + 1) * 864e5, y: null, l: '' });
        pts.push({ x: Date.UTC(2000, 0, 1) + r.d[j] * 864e5, y: r.v[j], l: freqM ? mfmt(dayIso(r.d[j])) : dfmt(dayIso(r.d[j])) }); prevD = r.d[j];
      }
      return { name: rname(r), color: COLORS[i % COLORS.length], pts: pts };
    });
    var dec = 2;
    var chart = series.length ? window.DehesaChart.render({ series: series, xMode: 'time', xTitle: t.date, yTitle: meta.unit, aria: seriesTitle(meta.parts) + ' (' + meta.unit + ')', vFmt: function (v) { return nf(v, dec); }, xFmt: freqM ? function (ts) { return mfmt(new Date(ts).toISOString().slice(0, 10)); } : undefined }) : '<p class="di-movers-hint">' + esc(t.noneSel) + '</p>';
    var rangeBtns = '<div class="di-range-btns">' + ranges.map(function (x) { return '<button type="button" class="di-range-btn' + (x[0] === rk ? ' active' : '') + '" data-range="' + x[0] + '">' + (x[0] === 'max' ? esc(t.all) : x[0].toUpperCase()) + '</button>'; }).join('') + '</div>';
    var famNow = ''; meta.regions.forEach(function (r) { if (r.last[0] > famNow) famNow = r.last[0]; });
    var staleDays = freqM ? 100 : 35, nowMs = Date.parse(famNow + 'T00:00:00Z');
    // Solo series vigentes por defecto; las historicas, aparte y con su fecha (auditoria 8-oct-2026)
    var isOldR = function (r) { return (nowMs - Date.parse(r.last[0] + 'T00:00:00Z')) / 864e5 > staleDays; };
    var curR = meta.regions.filter(function (r) { return !isOldR(r); }), oldR = meta.regions.filter(isOldR);
    if (!curR.length) { curR = oldR; oldR = []; }   // todo historico: una sola tabla, cada fila con su fecha
    var HT = { es: ['Series históricas', 'último dato', 'Buscar país'], en: ['Historical series', 'latest', 'Find country'], fr: ['Séries historiques', 'dernière donnée', 'Chercher un pays'], it: ['Serie storiche', 'ultimo dato', 'Cerca paese'] }[lang()] || ['Series históricas', 'último dato', 'Buscar país'];
    var chipOf = function (r) {
      var k = rkey(r), on = sel.indexOf(k) >= 0, ci = sel.indexOf(k);
      return '<button type="button" class="di-region-btn' + (on ? ' active' : '') + '" data-reg="' + esc(k) + '" data-name="' + esc(rname(r).toLowerCase()) + '" style="' + (on ? 'background:' + COLORS[ci % COLORS.length] + ';border-color:' + COLORS[ci % COLORS.length] + ';' : '') + 'padding:5px 11px;font-size:12px">' + esc(rname(r)) + (isOldR(r) ? ' · ' + esc((freqM ? mfmt : dfmt)(r.last[0])) : '') + '</button>';
    };
    var chipsCur = curR.map(chipOf).join(''), chipsOld = oldR.map(chipOf).join('');
    var chips = meta.regions.map(function (r) {
      var k = rkey(r), on = sel.indexOf(k) >= 0, ci = sel.indexOf(k);
      return '<button type="button" class="di-region-btn' + (on ? ' active' : '') + '" data-reg="' + esc(k) + '" style="' + (on ? 'background:' + COLORS[ci % COLORS.length] + ';border-color:' + COLORS[ci % COLORS.length] + ';' : '') + 'padding:5px 11px;font-size:12px">' + esc(rname(r)) + '</button>';
    }).join('');
    var rowOf = function (r) {
      var k = rkey(r), on = sel.indexOf(k) >= 0, old = (nowMs - Date.parse(r.last[0] + 'T00:00:00Z')) / 864e5 > staleDays;
      var f = freqM ? mfmt : dfmt;
      return '<tr data-reg="' + esc(k) + '" style="cursor:pointer;border-top:1px solid var(--border);' + (on ? 'background:var(--surface-2,rgba(0,0,0,.03))' : '') + '"><td style="padding:7px 10px;font-weight:600">' + esc(rname(r)) + '</td><td style="padding:7px 10px;text-align:right;font-variant-numeric:tabular-nums">' + nf(r.last[1], 2) + '</td><td style="padding:7px 10px;white-space:nowrap">' + esc(f(r.last[0])) + (old ? ' <span style="color:#a9491f;font-size:11.5px">· ' + esc(t.stale) + '</span>' : '') + '</td><td style="padding:7px 10px;text-align:right">' + delta(r.prev ? pct(r.last[1], r.prev[1]) : null) + '</td><td style="padding:7px 10px;text-align:right">' + delta(r.yoy ? pct(r.last[1], r.yoy[1]) : null) + '</td><td style="padding:7px 10px;white-space:nowrap;color:var(--text-muted)">' + esc(f(r.first)) + '</td></tr>';
    };
    var rows = curR.map(rowOf).join(''), rowsOld = oldR.map(rowOf).join('');
    var th = 'padding:7px 10px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:700';
    var tbl = '<div style="font-weight:700;font-size:14px;margin:18px 0 8px">' + esc(t.table) + ' <span style="font-weight:500;color:var(--text-muted);font-size:12.5px">· ' + esc(meta.unit) + '</span></div><div class="di-card" style="overflow-x:auto;padding:4px 0"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:13.5px"><thead><tr><th style="' + th + '">' + esc(t.country) + '</th><th style="' + th + ';text-align:right">' + esc(t.last) + '</th><th style="' + th + '">' + esc(t.date) + '</th><th style="' + th + ';text-align:right">' + esc(t.vsPrev) + '</th><th style="' + th + ';text-align:right">' + esc(t.vsYear) + '</th><th style="' + th + '">' + esc(t.since) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    if (rowsOld) { var tblOld = tbl.replace(rows, rowsOld); tbl += '<details style="margin:10px 0"><summary style="cursor:pointer;font-weight:600">' + esc(HT[0]) + ' (' + oldR.length + ')</summary>' + tblOld.replace(/<div style="font-weight:700;font-size:14px;margin:18px 0 8px">[\s\S]*?<\/div>/, '') + '</details>'; }
    var hasEU = meta.regions.some(function (r) { return r.c === 'EU'; });
    return '<div style="font-weight:700;font-size:14px;margin:14px 0 4px">' + esc(t.regions) + ' <span style="font-weight:500;color:var(--text-muted);font-size:12.5px">· ' + esc(t.pickHint) + '</span></div>' + (meta.regions.length > 12 ? '<input type="search" class="di-compare-select" id="eu-cfilter" aria-label="' + esc(HT[2]) + '" placeholder="' + esc(HT[2]) + '" style="margin:0 0 8px;min-width:200px">' : '') + '<div id="eu-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' + chipsCur + '</div>' + (chipsOld ? '<details style="margin:0 0 12px"><summary style="cursor:pointer;font-size:13px">' + esc(HT[0]) + ' (' + oldR.length + ')</summary><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + chipsOld + '</div></details>' : '') +
      rangeBtns + chart + tbl +
      '<p style="margin:10px 0 0"><button type="button" class="di-range-btn" id="eu-csv">' + esc(t.csv) + '</button></p>' +
      (hasEU ? '<p class="di-movers-hint" style="margin-top:8px">' + esc(t.euNote) + '</p>' : '');
  }

  function shell(t) {
    var fams = ST.idx.families;
    var chips = fams.map(function (f) { return '<button type="button" class="di-region-btn' + (f.id === ST.fam ? ' active' : '') + '" data-fam="' + f.id + '">' + esc((FAMILY_NAME[f.id] || [f.id])[LI[lang()] || 0]) + '</button>'; }).join('');
    return '<div class="di-region-btns" style="margin-top:6px">' + chips + '</div><div id="eu-fam"></div>' +
      ci('eu_agrifood') + '<p class="di-movers-hint" style="margin-top:22px">' + esc(t.src) + ' <a href="metodologia.html">' + esc(t.methodLink) + '</a>. <a href="producto.html">' + esc(t.linkProd) + '</a> · <a href="precios.html">' + esc(t.linkPrices) + '</a></p>';
  }

  function famView(t) {
    var f = ST.fams[ST.fam], box = document.getElementById('eu-fam'); if (!box) return;
    if (!f) { box.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>'; return; }
    if (!ST.sid || !f.series.some(function (s) { return s.id === ST.sid; })) { ST.sid = f.series[0] && f.series[0].id; ST.sel = null; }
    var q = ST.q.toLowerCase();
    var list = f.series.filter(function (s) { return s.id === ST.sid || !q || seriesTitle(s.parts).toLowerCase().indexOf(q) >= 0; });
    var opts = list.map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === ST.sid ? ' selected' : '') + '>' + esc(seriesTitle(s.parts)) + ' (' + s.regions.length + ')</option>'; }).join('');
    var filt = f.series.length > 14 ? '<input id="eu-q" type="search" aria-label="' + esc(t.filter) + '" placeholder="' + esc(t.filter) + '" value="' + esc(ST.q) + '" style="padding:7px 10px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface);color:var(--text);font-size:13px;max-width:240px;width:100%;margin-right:8px">' : '';
    var meta = curSeriesMeta();
    var info = meta ? '<span style="font-size:12.5px;color:var(--text-muted)">' + esc(t.unitNote) + ': <strong>' + esc(meta.unit) + '</strong> · ' + esc(t.freq) + ': ' + esc(meta.freq === 'monthly' ? t.freqM : t.freqW) + ' · ' + esc(t.updated) + ': ' + esc(meta.freq === 'monthly' ? mfmt(meta.latest) : dfmt(meta.latest)) + '</span>' : '';
    box.innerHTML = '<div style="margin:6px 0 4px;font-weight:700;font-size:14px">' + esc(t.product) + ' <span style="font-weight:500;color:var(--text-muted);font-size:12.5px">· ' + f.series.length + ' ' + esc(t.series) + '</span></div><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px">' + filt +
      '<select id="eu-sel" aria-label="' + esc(t.product) + '" style="padding:7px 10px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface);color:var(--text);font-size:13px;max-width:100%;flex:1;min-width:220px">' + opts + '</select></div><div style="margin-bottom:4px">' + info + '</div><div id="eu-ser"><p class="di-movers-hint">' + esc(t.loading) + '</p></div>';
    var sel = document.getElementById('eu-sel'); if (sel) sel.onchange = function (e) { ST.sid = e.target.value; ST.sel = null; ST.range = 'auto'; loadSeries(); };
    var qi = document.getElementById('eu-q'); if (qi) qi.oninput = function (e) { ST.q = e.target.value; var pos = e.target.selectionStart; famView(t); var n = document.getElementById('eu-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } };
    loadSeries();
  }

  function loadSeries() {
    var t = tr(), meta = curSeriesMeta(), box = document.getElementById('eu-ser'); if (!meta || !box) return;
    var key = ST.fam + '/' + ST.sid, go = function (d) {
      var b = document.getElementById('eu-ser'); if (!b) return;
      if (!d) { b.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; return; }
      if (!ST.sel) ST.sel = defaultSel(meta);
      b.innerHTML = renderChartAndTable(t, meta, d); setUrl(); bind(d, meta);
    };
    if (ST.sers[key]) go(ST.sers[key]); else get('data/eu/' + key + '.json').then(function (d) { ST.sers[key] = d; go(d); });
  }

  function toggle(k, d, meta) {
    var i = ST.sel.indexOf(k);
    if (i >= 0) ST.sel.splice(i, 1); else { if (ST.sel.length >= MAXSEL) ST.sel.shift(); ST.sel.push(k); }
    var b = document.getElementById('eu-ser'); b.innerHTML = renderChartAndTable(tr(), meta, d); setUrl(); bind(d, meta);
  }
  function bind(d, meta) {
    var box = document.getElementById('eu-ser'); if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('[data-reg]'), function (el) { el.onclick = function () { toggle(el.getAttribute('data-reg'), d, meta); }; });
    var cf = box.querySelector('#eu-cfilter'); if (cf) cf.oninput = function () { var q = cf.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); Array.prototype.forEach.call(box.querySelectorAll('button[data-name]'), function (b2) { b2.style.display = !q || b2.getAttribute('data-name').normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf(q) > -1 ? '' : 'none'; }); };
    Array.prototype.forEach.call(box.querySelectorAll('[data-range]'), function (el) { el.onclick = function () { ST.range = el.getAttribute('data-range'); box.innerHTML = renderChartAndTable(tr(), meta, d); bind(d, meta); }; });
    var csv = document.getElementById('eu-csv');
    if (csv) csv.onclick = function () {
      var lines = ['date,region,market,value,unit'], byKey = {}; d.regions.forEach(function (r) { byKey[rkey(r)] = r; });
      (ST.sel || []).forEach(function (k) { var r = byKey[k]; if (!r) return; for (var j = 0; j < r.d.length; j++) lines.push([dayIso(r.d[j]), r.c, '"' + (r.m || '').replace(/"/g, '""') + '"', r.v[j], '"' + meta.unit + '"'].join(',')); });
      var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'dehesa-index-ue-' + ST.sid + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };
  }

  function loadFamily(cb) {
    if (ST.fams[ST.fam]) return cb();
    get('data/eu/' + ST.fam + '.json').then(function (f) { ST.fams[ST.fam] = f; cb(); });
  }

  function ci(id, o) { return window.DICite && id ? window.DICite.html(id, o || {}) : ''; }
  function render() {
    var t = tr(), root = document.getElementById('pr-body');
    document.title = t.title + ' | Dehesa Index';
    document.getElementById('pg-h1').textContent = t.title;
    document.getElementById('pg-sub').textContent = t.sub;
    if (!ST.idx) { root.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; return; }
    root.innerHTML = shell(t);
    Array.prototype.forEach.call(root.querySelectorAll('[data-fam]'), function (b) { b.onclick = function () { ST.fam = b.getAttribute('data-fam'); ST.sid = null; ST.sel = null; ST.range = 'auto'; ST.q = ''; Array.prototype.forEach.call(root.querySelectorAll('[data-fam]'), function (x) { x.classList.toggle('active', x === b); }); famView(tr()); loadFamily(function () { famView(tr()); }); }; });
    famView(t); loadFamily(function () { famView(tr()); });
  }

  window.DehesaShared.init('informacion');
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  var qs = new URLSearchParams(window.location.search);
  get('data/eu/index.json').then(function (idx) {
    ST.idx = idx;
    if (idx && idx.families && idx.families.length) {
      var f = qs.get('f'); ST.fam = f && famOf(f) ? f : idx.families[0].id;
      ST.sid = qs.get('s'); if (qs.get('r')) ST.sel = qs.get('r').split(',');
    }
    var go = function () { render(); }; (window.DICite ? window.DICite.load() : Promise.resolve()).then(go, go);
  });
})();
