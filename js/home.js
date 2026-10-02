/* Dehesa Index — página de Inicio */
(function () {
  'use strict';

  // Market Movers: mismos productos y misma cifra que el panel de precios en
  // este momento (Trigo/UE, Maíz/EE. UU., Leche/EE. UU., Urea/EE. UU.), para
  // que la home no invente números distintos a los de Precios. Es una
  // instantánea que hay que actualizar a mano si cambian mucho los precios
  // de referencia -- no se recalcula sola.
  var MOVERS_DATA = [];
  var HOME_DATA = { status: 'loading', rows: [], stats: null };
  // Resumen unico de la Home (data/views/home-summary.json). Lo comparten las tarjetas (cultivos, oferta y demanda, clima, mercados) para no bajar sus datasets completos.
  var SUMMARY = null;
  window.DIHome = { summary: function () {
    if (!SUMMARY) SUMMARY = fetch('data/views/home-summary.json').then(function (r) { if (!r.ok) throw new Error('home-summary'); return r.json(); }).catch(function (e) { SUMMARY = null; throw e; });
    return SUMMARY;
  } };
  var PRODUCT_NAMES = { trigo: 'Trigo', maiz: 'Maíz', arroz: 'Arroz', leche: 'Leche', urea: 'Urea', diesel: 'Diésel' };
  function fmtMoverPrice(v) {
    var n = Number(v);
    if (!isFinite(n)) return '—';
    var decimals = Math.abs(n) >= 100 ? 1 : (Math.abs(n) >= 10 ? 2 : 3);
    return n.toFixed(decimals);
  }
  function productLabel(key) { return PRODUCT_NAMES[key] || String(key || '').replace(/-/g, ' '); }

  var STRINGS = {
    es: {
      h1: 'El pulso de la agricultura, en un solo panel',
      sub: "Precios de cereales, lácteos, ganado, pienso y fertilizantes en EE. UU., Europa y Canadá, con estadísticas oficiales de más de 30 países. Cada dato conserva su valor original, su fuente y su fecha.",
      ctaPrimary: 'Ver el panel de precios →',
      ctaSecondary: 'Cómo funciona',
      moversTitle: 'PANEL DE MERCADO',
      moversHint: 'Solo observaciones reales publicadas por la capa de datos',
      moversColProducto: 'Producto', moversColPrecio: 'Último', moversCol1D: 'Estado', moversCol1W: 'Fecha',
      moversCta: 'Abrir panel completo →',
      moversLabels: {
        trigo: { name: 'Trigo', unit: 'tonelada', market: 'Europa · Comisión Europea (Zaragoza)' },
        maiz: { name: 'Maíz', unit: 'bushel', market: 'EE. UU. · USDA NASS' },
        leche: { name: 'Leche', unit: 'cwt', market: 'EE. UU. · USDA NASS' },
        urea: { name: 'Urea', unit: 'ton corta', market: 'EE. UU. · DTN Fertilizer Index' }
      },
      stats: [
        { value: '11', label: 'categorías de producto' },
        { value: '18', label: 'mercados seguidos' },
        { value: '4', label: 'mercados de precios — EE. UU., Europa, Reino Unido y Canadá' },
        { value: 'Diario', label: 'ritmo de actualización' }
      ],
      coverTitle: 'Qué cubrimos',
      coverSub: 'Once categorías clave de la agricultura, con precios de referencia de ambos lados del Atlántico.',
      categories: [
        { label: 'Cereales', items: 'Maíz · Trigo · Arroz', desc: 'Precios de USDA NASS y de la Comisión Europea (Agri-food), en la misma unidad.' },
        { label: 'Lácteos', items: 'Leche', desc: 'Precios USDA NASS frente a referencias de la Comisión Europea.' },
        { label: 'Ganado', items: 'Vaca · Cabra', desc: 'Cotizaciones CME Group y lonjas europeas, en pie y en canal.' },
        { label: 'Porcino', items: 'Cerdo', desc: 'Referencia de porcino blanco de EE. UU. y la UE, más Mercolleida como lonja española.' },
        { label: 'Ovino', items: 'Cordero', desc: 'Precios de cordero en EE. UU. y referencias de canal en la Unión Europea.' },
        { label: 'Avicultura', items: 'Huevos · Pollo', desc: 'Precios de huevo y pollo en EE. UU. y la Unión Europea.' },
        { label: 'Pienso', items: 'Pienso compuesto · Harina de soja', desc: 'Índices de referencia de EE. UU. y la UE para el coste de alimentación.' },
        { label: 'Fertilizantes', items: 'Urea · DAP · Potasa', desc: 'DTN Fertilizer Index frente a referencias internacionales.' },
        { label: 'Azúcar', items: 'Azúcar', desc: 'Referencia USDA frente al precio del azúcar blanco en la Unión Europea.' },
        { label: 'Aceite de oliva', items: 'Aceite de oliva', desc: 'El dashboard semanal de la Comisión Europea, con España como referencia mundial.' },
        { label: 'Energía', items: 'Diésel agrícola', desc: 'Precio del gasóleo en EE. UU. (por región) y Europa (por país) — clave para el coste de la maquinaria.' }
      ],
      howTitle: 'Cómo funciona',
      howSub: 'Tres pasos para comparar precios de distintos mercados con la unidad y la moneda a la vista.',
      steps: [
        { n: '01', title: 'Elige categoría y mercado', desc: 'Cereales, lácteos, ganado, pienso o fertilizantes — en EE. UU. o Europa.' },
        { n: '02', title: 'Compara en la misma base', desc: 'Cambia moneda (USD/EUR) y unidad (imperial/métrica) para comparar directamente.' },
        { n: '03', title: 'Sigue la tendencia', desc: 'Gráficos históricos y variación porcentual para ver hacia dónde se mueve el mercado.' }
      ],
      disclaimer: 'Las cifras del panel principal se muestran únicamente cuando existe una observación real normalizada. Cuando una fuente está pendiente o no es comparable, se indica explícitamente.',
      ctaTitle: 'Explora el panel completo de precios',
      ctaSub: 'Cereales, lácteos, ganado, pienso y fertilizantes — actualizados y listos para comparar.',
      ctaButton: 'Ver precios →'
    },
    en: {
      h1: 'The pulse of agriculture, in one dashboard',
      sub: "Prices for grains, dairy, livestock, feed and fertilisers in the US, Europe and Canada, plus official statistics for 30+ countries. Every figure keeps its original value, source and date.",
      ctaPrimary: 'View the price dashboard →',
      ctaSecondary: 'How it works',
      moversTitle: 'MARKET SNAPSHOT',
      moversHint: 'Only real observations published by the data layer',
      moversColProducto: 'Commodity', moversColPrecio: 'Latest', moversCol1D: 'Status', moversCol1W: 'Date',
      moversCta: 'Open full dashboard →',
      moversLabels: {
        trigo: { name: 'Wheat', unit: 'tonne', market: 'Europe · European Commission (Zaragoza)' },
        maiz: { name: 'Corn', unit: 'bushel', market: 'U.S. · USDA NASS' },
        leche: { name: 'Milk', unit: 'cwt', market: 'U.S. · USDA NASS' },
        urea: { name: 'Urea', unit: 'short ton', market: 'U.S. · DTN Fertilizer Index' }
      },
      stats: [
        { value: '11', label: 'product categories' },
        { value: '18', label: 'markets tracked' },
        { value: '4', label: 'price markets — U.S., Europe, UK and Canada' },
        { value: 'Daily', label: 'update pace' }
      ],
      coverTitle: 'What we cover',
      coverSub: 'Eleven key agricultural categories, with reference prices from both sides of the Atlantic.',
      categories: [
        { label: 'Grains', items: 'Corn · Wheat · Rice', desc: 'USDA NASS and European Commission (Agri-food) prices, in the same unit.' },
        { label: 'Dairy', items: 'Milk', desc: 'USDA NASS prices against European Commission references.' },
        { label: 'Livestock', items: 'Cattle · Goat', desc: 'CME Group quotes and European markets, live weight and carcass.' },
        { label: 'Pork', items: 'Pork', desc: 'Standard pork reference for the U.S. and EU, plus Mercolleida as a Spanish market.' },
        { label: 'Sheep & Lamb', items: 'Lamb', desc: 'U.S. lamb prices against EU carcass references.' },
        { label: 'Poultry & Eggs', items: 'Eggs · Chicken', desc: 'Egg and chicken prices in the U.S. and the EU.' },
        { label: 'Feed', items: 'Compound feed · Soybean meal', desc: 'U.S. and EU reference indices for feed costs.' },
        { label: 'Fertilizer', items: 'Urea · DAP · Potash', desc: 'DTN Fertilizer Index against international references.' },
        { label: 'Sugar', items: 'Sugar', desc: 'USDA reference against the EU white sugar price.' },
        { label: 'Olive Oil', items: 'Olive oil', desc: "The European Commission's weekly dashboard, with Spain as the world benchmark." },
        { label: 'Energy', items: 'Agricultural diesel', desc: 'Diesel prices in the U.S. (by region) and Europe (by country) — key to machinery running costs.' }
      ],
      howTitle: 'How it works',
      howSub: 'Three steps to compare prices across markets with the unit and currency in view.',
      steps: [
        { n: '01', title: 'Choose category and market', desc: 'Grains, dairy, livestock, feed or fertilizer — in the U.S. or Europe.' },
        { n: '02', title: 'Compare on the same basis', desc: 'Switch currency (USD/EUR) and unit (imperial/metric) to compare directly.' },
        { n: '03', title: 'Follow the trend', desc: 'Historical charts and percentage change to see where the market is heading.' }
      ],
      disclaimer: 'Dashboard figures appear only when a real normalized observation exists. Pending or non-comparable sources are labeled explicitly.',
      ctaTitle: 'Explore the full price dashboard',
      ctaSub: 'Grains, dairy, livestock, feed and fertilizer — updated and ready to compare.',
      ctaButton: 'View prices →'
    },
    fr: {
      h1: "Le pouls de l'agriculture, en un seul tableau de bord",
      sub: "Prix des céréales, produits laitiers, bétail, aliments et engrais aux États-Unis, en Europe et au Canada, et statistiques officielles de plus de 30 pays. Chaque donnée garde sa valeur d’origine, sa source et sa date.",
      ctaPrimary: 'Voir le tableau des prix →',
      ctaSecondary: 'Comment ça marche',
      moversTitle: 'LES MOUVEMENTS AGRICOLES DU JOUR',
      moversHint: 'Seules les observations réelles publiées par la couche de données',
      moversColProducto: 'Produit', moversColPrecio: 'Prix', moversCol1D: '1J', moversCol1W: '1S',
      moversCta: 'Voir tous les prix →',
      moversLabels: {
        trigo: { name: 'Blé', unit: 'tonne', market: 'Europe · Commission européenne (Zaragoza)' },
        maiz: { name: 'Maïs', unit: 'bushel', market: 'États-Unis · USDA NASS' },
        leche: { name: 'Lait', unit: 'cwt', market: 'États-Unis · USDA NASS' },
        urea: { name: 'Urée', unit: 'tonne courte', market: 'États-Unis · DTN Fertilizer Index' }
      },
      stats: [
        { value: '11', label: 'catégories de produits' },
        { value: '18', label: 'marchés suivis' },
        { value: '4', label: 'marchés de prix — États-Unis, Europe, Royaume-Uni et Canada' },
        { value: 'Quotidien', label: 'rythme de mise à jour' }
      ],
      coverTitle: 'Ce que nous couvrons',
      coverSub: "Onze catégories agricoles clés, avec des prix de référence des deux côtés de l'Atlantique.",
      categories: [
        { label: 'Céréales', items: 'Maïs · Blé · Riz', desc: 'Prix USDA NASS et Commission européenne (Agri-food), dans la même unité.' },
        { label: 'Produits laitiers', items: 'Lait', desc: 'Prix USDA NASS face aux références de la Commission européenne.' },
        { label: 'Bétail', items: 'Bovins · Chèvre', desc: 'Cotations CME Group et marchés européens, sur pied et en carcasse.' },
        { label: 'Porc', items: 'Porc', desc: "Référence porc standard pour les États-Unis et l'UE, avec Mercolleida comme marché espagnol." },
        { label: 'Ovins', items: 'Agneau', desc: "Prix de l'agneau aux États-Unis face aux références carcasse dans l'UE." },
        { label: 'Volaille et œufs', items: 'Œufs · Poulet', desc: "Prix des œufs et du poulet aux États-Unis et dans l'UE." },
        { label: 'Aliments pour animaux', items: 'Aliment composé · Tourteau de soja', desc: "Indices de référence américains et européens pour le coût de l'alimentation animale." },
        { label: 'Engrais', items: 'Urée · DAP · Potasse', desc: 'DTN Fertilizer Index face aux références internationales.' },
        { label: 'Sucre', items: 'Sucre', desc: "Référence USDA face au prix du sucre blanc dans l'UE." },
        { label: "Huile d'olive", items: "Huile d'olive", desc: "Le tableau de bord hebdomadaire de la Commission européenne, avec l'Espagne comme référence mondiale." },
        { label: 'Énergie', items: 'Gazole agricole', desc: 'Prix du gazole aux États-Unis (par région) et en Europe (par pays) — un poste clé du coût de la machinerie.' }
      ],
      howTitle: 'Comment ça marche',
      howSub: "Trois étapes pour comparer les prix entre marchés, unité et devise d'origine toujours visibles.",
      steps: [
        { n: '01', title: 'Choisissez catégorie et marché', desc: 'Céréales, produits laitiers, bétail, aliments ou engrais — aux États-Unis ou en Europe.' },
        { n: '02', title: 'Comparez sur la même base', desc: "Changez la devise (USD/EUR) et l'unité (impérial/métrique) pour comparer directement." },
        { n: '03', title: 'Suivez la tendance', desc: 'Graphiques historiques et variation en pourcentage pour voir où va le marché.' }
      ],
      disclaimer: 'Le tableau de bord affiche uniquement une observation réelle normalisée. Les sources en attente ou non comparables sont signalées explicitement.',
      ctaTitle: 'Explorez le tableau de bord complet des prix',
      ctaSub: 'Céréales, produits laitiers, bétail, aliments pour animaux et engrais — mis à jour et prêts à être comparés.',
      ctaButton: 'Voir les prix →'
    },
    it: {
      h1: "Il polso dell'agricoltura, in un unico pannello",
      sub: "Prezzi di cereali, latte, bestiame, mangimi e fertilizzanti in USA, Europa e Canada, più statistiche ufficiali di oltre 30 paesi. Ogni dato mantiene valore originale, fonte e data.",
      ctaPrimary: 'Vedi il pannello dei prezzi →',
      ctaSecondary: 'Come funziona',
      moversTitle: 'I MOVIMENTI AGRICOLI DI OGGI',
      moversHint: 'Solo osservazioni reali pubblicate dal livello dati',
      moversColProducto: 'Prodotto', moversColPrecio: 'Prezzo', moversCol1D: '1G', moversCol1W: '1S',
      moversCta: 'Vedi tutti i prezzi →',
      moversLabels: {
        trigo: { name: 'Grano', unit: 'tonnellata', market: 'Europa · Commissione europea (Zaragoza)' },
        maiz: { name: 'Mais', unit: 'bushel', market: 'Stati Uniti · USDA NASS' },
        leche: { name: 'Latte', unit: 'cwt', market: 'Stati Uniti · USDA NASS' },
        urea: { name: 'Urea', unit: 'tonnellata corta', market: 'Stati Uniti · DTN Fertilizer Index' }
      },
      stats: [
        { value: '11', label: 'categorie di prodotto' },
        { value: '18', label: 'mercati monitorati' },
        { value: '4', label: 'mercati dei prezzi — Stati Uniti, Europa, Regno Unito e Canada' },
        { value: 'Giornaliero', label: 'ritmo di aggiornamento' }
      ],
      coverTitle: 'Cosa copriamo',
      coverSub: "Undici categorie chiave dell'agricoltura, con prezzi di riferimento da entrambe le sponde dell'Atlantico.",
      categories: [
        { label: 'Cereali', items: 'Mais · Grano · Riso', desc: 'Prezzi USDA NASS e Commissione europea (Agri-food), nella stessa unità di misura.' },
        { label: 'Lattiero-caseario', items: 'Latte', desc: 'Prezzi USDA NASS a confronto con i riferimenti della Commissione europea.' },
        { label: 'Bestiame', items: 'Bovini · Capre', desc: 'Quotazioni CME Group e mercati europei, peso vivo e peso morto.' },
        { label: 'Suini', items: 'Maiale', desc: 'Riferimento del mercato suino standard per Stati Uniti e UE, più Mercolleida come mercato spagnolo.' },
        { label: 'Ovini', items: 'Agnello', desc: "Prezzi dell'agnello negli Stati Uniti a confronto con i riferimenti di peso morto nell'UE." },
        { label: 'Avicoltura', items: 'Uova · Pollo', desc: "Prezzi di uova e pollo negli Stati Uniti e nell'UE." },
        { label: 'Mangimi', items: 'Mangime composto · Farina di soia', desc: "Indici di riferimento statunitensi ed europei per il costo dell'alimentazione." },
        { label: 'Fertilizzanti', items: 'Urea · DAP · Potassa', desc: 'DTN Fertilizer Index a confronto con i riferimenti internazionali.' },
        { label: 'Zucchero', items: 'Zucchero', desc: "Riferimento USDA a confronto con il prezzo dello zucchero bianco nell'UE." },
        { label: "Olio d'oliva", items: "Olio d'oliva", desc: "Il dashboard settimanale della Commissione europea, con la Spagna come riferimento mondiale." },
        { label: 'Energia', items: 'Gasolio agricolo', desc: 'Prezzo del gasolio negli Stati Uniti (per regione) e in Europa (per paese) — una voce chiave nel costo dei macchinari.' }
      ],
      howTitle: 'Come funziona',
      howSub: 'Tre passi per confrontare i prezzi tra mercati con unità e valuta in vista.',
      steps: [
        { n: '01', title: 'Scegli categoria e mercato', desc: 'Cereali, lattiero-caseario, bestiame, mangimi o fertilizzanti — negli Stati Uniti o in Europa.' },
        { n: '02', title: 'Confronta sulla stessa base', desc: 'Cambia valuta (USD/EUR) e unità di misura (imperiale/metrica) per confrontare direttamente.' },
        { n: '03', title: 'Segui la tendenza', desc: 'Grafici storici e variazione percentuale per vedere verso dove si muove il mercato.' }
      ],
      disclaimer: 'Il pannello mostra solo osservazioni reali normalizzate. Le fonti in attesa o non comparabili sono segnalate esplicitamente.',
      ctaTitle: 'Esplora il pannello completo dei prezzi',
      ctaSub: 'Cereali, lattiero-caseario, bestiame, mangimi e fertilizzanti — aggiornati e pronti per il confronto.',
      ctaButton: 'Vedi i prezzi →'
    }
  };


  // Bloque "Explora los datos": una tarjeta por página de datos, con enlace.
  // Solo describe qué hay en cada página; no muestra cifras (las cifras viven en cada página).
  var EXPLORE = {
    title: { es: 'Explora los datos', en: 'Explore the data', fr: 'Explorer les données', it: 'Esplora i dati' },
    sub: {
      es: 'Además de los precios: sequía, costes, rendimientos, comercio y ganadería, con datos oficiales de EE. UU., Europa, Canadá y Australia.',
      en: 'Beyond prices: drought, costs, yields, trade and livestock, with official data from the U.S., Europe, Canada and Australia.',
      fr: 'Au-delà des prix : sécheresse, coûts, rendements, commerce et élevage, avec des données officielles des États-Unis, d’Europe, du Canada et d’Australie.',
      it: 'Oltre ai prezzi: siccità, costi, rese, commercio e zootecnia, con dati ufficiali di Stati Uniti, Europa, Canada e Australia.'
    },
    cards: [
      { href: 'europa.html', tag: { es: 'UE', en: 'EU', fr: 'UE', it: 'UE' },
        title: { es: 'Precios de la UE', en: 'EU prices', fr: 'Prix de l’UE', it: 'Prezzi UE' },
        desc: { es: 'Cientos de series de la Comisión Europea, país por país: cereales, lácteos, carne, fruta y hortaliza, vino y fertilizantes.', en: 'Hundreds of European Commission series, country by country: grains, dairy, meat, fruit and vegetables, wine and fertilizers.', fr: 'Des centaines de séries de la Commission européenne, pays par pays : céréales, produits laitiers, viande, fruits et légumes, vin et engrais.', it: 'Centinaia di serie della Commissione europea, paese per paese: cereali, latticini, carne, frutta e ortaggi, vino e fertilizzanti.' } },
      { href: 'producto.html?p=trigo', tag: { es: 'EE. UU. + UE', en: 'U.S. + EU', fr: 'É.-U. + UE', it: 'USA + UE' },
        title: { es: 'Ficha de producto', en: 'Product page', fr: 'Fiche produit', it: 'Scheda prodotto' },
        desc: { es: 'Todo de un producto en una página: precios por mercado, oferta y demanda, exportaciones, sequía y costes.', en: 'Everything about one product on a page: prices by market, supply and demand, exports, drought and costs.', fr: 'Tout sur un produit en une page : prix par marché, offre et demande, exportations, sécheresse et coûts.', it: 'Tutto su un prodotto in una pagina: prezzi per mercato, offerta e domanda, esportazioni, siccità e costi.' } },
      { href: 'sequia.html', tag: { es: 'EE. UU.', en: 'U.S.', fr: 'É.-U.', it: 'USA' },
        title: { es: 'Sequía', en: 'Drought', fr: 'Sécheresse', it: 'Siccità' },
        desc: { es: 'Qué parte de cada estado está en sequía, semana a semana (U.S. Drought Monitor).', en: 'How much of each state is in drought, week by week (U.S. Drought Monitor).', fr: 'Quelle part de chaque État est en sécheresse, semaine après semaine (U.S. Drought Monitor).', it: 'Quanta parte di ogni stato è in siccità, settimana per settimana (U.S. Drought Monitor).' } },
      { href: 'ganaderia.html', tag: { es: 'EE. UU.', en: 'U.S.', fr: 'É.-U.', it: 'USA' },
        title: { es: 'Ganadería', en: 'Livestock', fr: 'Élevage', it: 'Zootecnia' },
        desc: { es: 'Cerdos, vacuno y leche por estado, y existencias en frío (USDA NASS).', en: 'Hogs, cattle and milk by state, and cold storage stocks (USDA NASS).', fr: 'Porcs, bovins et lait par État, et stocks frigorifiques (USDA NASS).', it: 'Suini, bovini e latte per stato, e scorte frigorifere (USDA NASS).' } },
      { href: 'insumos.html', tag: { es: 'EE. UU.', en: 'U.S.', fr: 'É.-U.', it: 'USA' },
        title: { es: 'Insumos', en: 'Inputs', fr: 'Intrants', it: 'Input' },
        desc: { es: 'Índices de precios que pagan los agricultores por sus insumos (USDA NASS).', en: 'Price indices paid by farmers for their inputs (USDA NASS).', fr: 'Indices des prix payés par les agriculteurs pour leurs intrants (USDA NASS).', it: 'Indici dei prezzi pagati dagli agricoltori per i loro input (USDA NASS).' } },
      { href: 'costes.html', tag: { es: 'EE. UU.', en: 'U.S.', fr: 'É.-U.', it: 'USA' },
        title: { es: 'Costes y rentabilidad', en: 'Costs and returns', fr: 'Coûts et rentabilité', it: 'Costi e redditività' },
        desc: { es: 'Costes de producción con punto de equilibrio, previsión de precios de alimentos y renta agraria (USDA ERS).', en: 'Production costs with break-even, food price outlook and farm income (USDA ERS).', fr: 'Coûts de production avec seuil de rentabilité, prévisions des prix alimentaires et revenu agricole (USDA ERS).', it: 'Costi di produzione con punto di pareggio, previsioni dei prezzi alimentari e reddito agricolo (USDA ERS).' } },
      { href: 'rendimientos.html', tag: { es: 'EE. UU.', en: 'U.S.', fr: 'É.-U.', it: 'USA' },
        title: { es: 'Rendimientos', en: 'Yields', fr: 'Rendements', it: 'Rese' },
        desc: { es: 'Rendimiento, superficie y producción por estado de 10 cultivos (USDA NASS).', en: 'Yield, area and production by state for 10 crops (USDA NASS).', fr: 'Rendement, superficie et production par État pour 10 cultures (USDA NASS).', it: 'Resa, superficie e produzione per stato di 10 colture (USDA NASS).' } },
      { href: 'exportaciones.html', tag: { es: 'EE. UU.', en: 'U.S.', fr: 'É.-U.', it: 'USA' },
        title: { es: 'Exportaciones', en: 'Exports', fr: 'Exportations', it: 'Esportazioni' },
        desc: { es: 'Ventas semanales de exportación y comercio por país (USDA FAS).', en: 'Weekly export sales and trade by country (USDA FAS).', fr: 'Ventes hebdomadaires à l’exportation et commerce par pays (USDA FAS).', it: 'Vendite settimanali all’export e commercio per paese (USDA FAS).' } }
    ]
  };
  function renderExplore(lang, esc) {
    var el = document.getElementById('home-explora');
    if (!el) return;
    el.innerHTML = '<div class="di-section-head"><h2>' + esc(EXPLORE.title[lang] || EXPLORE.title.es) + '</h2><p>' + esc(EXPLORE.sub[lang] || EXPLORE.sub.es) + '</p></div>' +
      '<div class="di-cat-grid">' + EXPLORE.cards.map(function (c) {
        return '<a class="di-cat-card" href="' + c.href + '"><div class="di-cat-bar"></div><div class="di-cat-label serif">' + esc(c.title[lang] || c.title.es) + '</div><div class="di-cat-items">' + esc(c.tag[lang] || c.tag.es) + '</div><div class="di-cat-desc">' + esc(c.desc[lang] || c.desc.es) + '</div></a>';
      }).join('') + '</div>';
  }


  /* ---------- Precios publicados (franja de la portada) ---------- */
  var TAPE = {
    es: { cols: ['Producto', 'Región', 'Precio', 'Variación', 'Fecha'], title: 'Último dato de cada mercado', note: 'Cada precio va en la unidad y la moneda de su fuente: no se comparan entre regiones.', all: 'Ver todos los precios →', loading: 'Cargando precios…', none: 'No se han podido cargar los precios.', obs: 'observaciones', src: 'fuentes',
      p: { trigo: 'Trigo', maiz: 'Maíz', leche: 'Leche' }, r: { eu: 'UE', us: 'EE. UU.', ca: 'Canadá' }, u: { tonelada: 't', bushel: 'bu', cwt: 'cwt', '100kg': '100 kg' } },
    en: { cols: ['Product', 'Region', 'Price', 'Change', 'Date'], title: 'Latest data from each market', note: 'Each price is in its source’s unit and currency: they are not compared across regions.', all: 'See all prices →', loading: 'Loading prices…', none: 'Prices could not be loaded.', obs: 'observations', src: 'sources',
      p: { trigo: 'Wheat', maiz: 'Corn', leche: 'Milk' }, r: { eu: 'EU', us: 'US', ca: 'Canada' }, u: { tonelada: 't', bushel: 'bu', cwt: 'cwt', '100kg': '100 kg' } },
    fr: { cols: ['Produit', 'Région', 'Prix', 'Variation', 'Date'], title: 'Dernière donnée de chaque marché', note: 'Chaque prix est dans l’unité et la devise de sa source : ils ne sont pas comparés entre régions.', all: 'Voir tous les prix →', loading: 'Chargement des prix…', none: 'Impossible de charger les prix.', obs: 'observations', src: 'sources',
      p: { trigo: 'Blé', maiz: 'Maïs', leche: 'Lait' }, r: { eu: 'UE', us: 'É.-U.', ca: 'Canada' }, u: { tonelada: 't', bushel: 'boisseau', cwt: 'cwt', '100kg': '100 kg' } },
    it: { cols: ['Prodotto', 'Regione', 'Prezzo', 'Variazione', 'Data'], title: 'Ultimo dato di ogni mercato', note: 'Ogni prezzo è nell’unità e nella valuta della sua fonte: non vengono confrontati tra regioni.', all: 'Vedi tutti i prezzi →', loading: 'Caricamento prezzi…', none: 'Impossibile caricare i prezzi.', obs: 'osservazioni', src: 'fonti',
      p: { trigo: 'Frumento', maiz: 'Mais', leche: 'Latte' }, r: { eu: 'UE', us: 'USA', ca: 'Canada' }, u: { tonelada: 't', bushel: 'bu', cwt: 'cwt', '100kg': '100 kg' } }
  };
  var TAPE_ROWS = [['trigo', 'eu'], ['trigo', 'us'], ['trigo', 'ca'], ['maiz', 'eu'], ['maiz', 'us'], ['maiz', 'ca'], ['leche', 'eu'], ['leche', 'us']];
  var TAPE_DATA = null;
  function tapeNum(v, lang) { var d = Math.abs(v) >= 100 ? 0 : 2; try { return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function tapeDate(iso, lang) {
    var p = String(iso || '').split('-'); if (p.length < 2) return '';
    try { return new Date(Date.UTC(+p[0], +p[1] - 1, p[2] ? +p[2] : 1)).toLocaleDateString(lang, p[2] ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } : { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; }
  }
  function tapeHtml(lang, esc) {
    var t = TAPE[lang] || TAPE.es, el = '<div class="di-tape-h">' + esc(t.title) + '</div>';
    if (TAPE_DATA === 'err') return el + '<p class="di-tape-note">' + esc(t.none) + '</p>';
    if (!TAPE_DATA) return el + '<p class="di-tape-note">' + esc(t.loading) + '</p>';
    var by = {}; TAPE_DATA.forEach(function (o) { by[o.product + '/' + o.region] = o; });
    var prev = '', rows = TAPE_ROWS.map(function (k) {
      var o = by[k[0] + '/' + k[1]]; if (!o || typeof o.value !== 'number') return '';
      var first = k[0] !== prev; prev = k[0];
      var ch = typeof o.changePct === 'number' ? o.changePct : null;
      var chTxt = ch === null ? '' : (ch > 0 ? '+' : ch < 0 ? '−' : '') + Math.abs(ch).toFixed(1).replace('.', lang === 'en' ? '.' : ',') + ' %';
      return '<tr' + (first ? ' class="first"' : '') + '><th scope="row">' + '<span class="' + (first ? 'di-tape-p' : 'di-sr') + '">' + esc(t.p[k[0]] || k[0]) + '</span>' + '</th><td class="rg">' + esc(t.r[k[1]] || k[1]) + (window.DICite && o.sourceId ? window.DICite.html(o.sourceId, { period: o.observationDate }) : '') + '</td>' +
        '<td class="v"><strong>' + esc(tapeNum(o.value, lang)) + '</strong> <span class="u">' + esc(o.currency + '/' + (t.u[o.unit] || o.unit)) + '</span></td>' +
        '<td class="c ' + (ch > 0 ? 'up' : ch < 0 ? 'dn' : '') + '">' + esc(chTxt) + '</td><td class="d">' + esc(tapeDate(o.observationDate, lang)) + '</td></tr>';
    }).join('');
    if (!rows) return el + '<p class="di-tape-note">' + esc(t.none) + '</p>';
    var st = HOME_DATA.stats, foot = st ? '<span>' + esc(String(st.observations)) + ' ' + esc(t.obs) + ' · ' + esc(String(st.sources)) + ' ' + esc(t.src) + '</span>' : '';
    return el + '<table class="di-tape-t" data-no-cards="1"><thead class="di-sr"><tr>' + t.cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table><div class="di-tape-f"><span>' + esc(t.note) + '</span>' + foot + '</div><a class="di-tape-a" href="precios.html">' + esc(t.all) + '</a>';
  }
  function loadTape() {
    var citeP = window.DICite ? window.DICite.load() : Promise.resolve(null);
    fetch('data/home-tape.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { return citeP.then(function () { return d; }); })
      .then(function (d) { TAPE_DATA = d.rows || []; render(); }, function () { TAPE_DATA = 'err'; render(); });
  }

  function render() {
    var lang = window.DehesaShared.getLang();
    var esc = window.DehesaShared.esc;
    var t = STRINGS[lang] || STRINGS.es;
    document.title = 'Dehesa Index — ' + ({ es: 'Precios agrícolas de EE. UU. y Europa', en: 'US and European farm commodity prices', fr: 'Prix agricoles États-Unis et Europe', it: 'Prezzi agricoli USA ed Europa' }[lang] || 'US and European farm commodity prices');
    renderExplore(lang, esc);
    document.getElementById('home-h1').textContent = t.h1;
    document.getElementById('home-sub').textContent = t.sub;
    document.getElementById('home-cta-primary').textContent = t.ctaPrimary;
    document.getElementById('home-cta-secondary').textContent = t.ctaSecondary;

    document.getElementById('home-stats').innerHTML = tapeHtml(lang, esc);

    document.getElementById('home-movers-title').textContent = t.moversTitle;
    document.getElementById('home-movers-hint').textContent = t.moversHint;
    document.getElementById('home-movers-cta').textContent = t.moversCta;

    var movers = HOME_DATA.rows.slice(0, 4).map(function(o) {
      var key = o.product;
      var label = (t.moversLabels && t.moversLabels[key]) || { name: productLabel(key), unit: o.unit || '', market: (o.region || '').toUpperCase() };
      var status = o.status === 'verified' ? (o.comparability === 'not_comparable' ? 'not-comparable' : 'real') : 'pending';
      var statusLabel = status === 'real' ? (lang === 'es' ? 'REAL' : lang === 'fr' ? 'RÉEL' : lang === 'it' ? 'REALE' : 'REAL') : status === 'not-comparable' ? (lang === 'es' ? 'NO COMPARABLE' : lang === 'fr' ? 'NON COMPARABLE' : lang === 'it' ? 'NON COMPARABILE' : 'NOT COMPARABLE') : (lang === 'es' ? 'PENDIENTE' : lang === 'fr' ? 'EN ATTENTE' : lang === 'it' ? 'IN ATTESA' : 'PENDING');
      return { name: label.name, market: label.market, source: o.sourceId || '—', sid: o.sourceId || '', pub: o.publicationDate || '', price: status === 'real' ? fmtMoverPrice(o.value) + (o.currency ? ' ' + o.currency : '') + (o.unit ? '/' + o.unit : '') : '—', status: status, statusLabel: statusLabel, date: o.observationDate || '—' };
    });
    var headRow = '<div class="di-movers-row head"><span>' + esc(t.moversColProducto) + '</span><span class="num">' + esc(t.moversColPrecio) + '</span><span class="num">' + esc(t.moversCol1D) + '</span><span class="num">' + esc(t.moversCol1W) + '</span></div>';
    var bodyRows = movers.length ? movers.map(function(row, i) {
      var borderStyle = i === movers.length - 1 ? 'border-bottom:none;' : '';
      return '<div class="di-movers-row" style="' + borderStyle + '">' +
        '<div><div class="di-movers-name">' + esc(row.name) + '</div><div class="di-movers-market">' + esc(row.market) + '</div><div class="di-movers-source">' + ((window.DICite && row.sid && window.DICite.html(row.sid, { period: row.date === '—' ? '' : row.date, pub: row.pub })) || esc(row.source)) + '</div></div>' +
        '<div class="num">' + esc(row.price) + '</div>' +
        '<div class="num"><span class="di-home-status ' + row.status + '">' + esc(row.statusLabel) + '</span></div>' +
        '<div class="num">' + esc(row.date) + '</div></div>';
    }).join('') : '<div class="di-home-empty">Sin observaciones reales disponibles todavía.</div>';
    document.getElementById('home-movers-table').innerHTML = headRow + bodyRows;

    document.getElementById('home-cover-title').textContent = t.coverTitle;
    document.getElementById('home-cover-sub').textContent = t.coverSub;
    document.getElementById('home-cat-grid').innerHTML = t.categories.map(function(c) {
      return '<a class="di-cat-card" href="precios.html"><div class="di-cat-bar"></div><div class="di-cat-label serif">' + esc(c.label) + '</div><div class="di-cat-items">' + esc(c.items) + '</div><div class="di-cat-desc">' + esc(c.desc) + '</div></a>';
    }).join('');
    document.getElementById('home-how-title').textContent = t.howTitle;
    document.getElementById('home-how-sub').textContent = t.howSub;
    document.getElementById('home-steps-grid').innerHTML = t.steps.map(function(s) {
      return '<div class="di-step"><div class="di-step-n serif">' + esc(s.n) + '</div><div class="di-step-title">' + esc(s.title) + '</div><div class="di-step-desc">' + esc(s.desc) + '</div></div>';
    }).join('');
    document.getElementById('home-disclaimer').textContent = t.disclaimer;
    document.getElementById('home-cta-title').textContent = t.ctaTitle;
    document.getElementById('home-cta-sub').textContent = t.ctaSub;
    document.getElementById('home-cta-button').textContent = t.ctaButton;
  }

  // Una sola peticion pequena (data/views/home-summary.json, ~45 KB) alimenta toda la Home; ya no se baja latest.json (3,7 MB) ni los datasets completos de cada tarjeta.
  function loadHomeData() {
    var citeP = window.DICite ? window.DICite.load() : Promise.resolve(null);
    Promise.all([window.DIHome.summary(), citeP]).then(function(r) { return r[0]; }).then(function(s) {
      HOME_DATA.rows = s.movers || [];
      HOME_DATA.stats = s.stats;
      HOME_DATA.loaded = true; HOME_DATA.status = 'live';
      render();
    }).catch(function(){ HOME_DATA.status = 'unavailable'; HOME_DATA.rows = []; HOME_DATA.stats = null; render(); });
  }

  window.DehesaShared.init('home');
  window.DehesaShared.onLangChange = render;
  render();
  loadHomeData();
  loadTape();
})();
