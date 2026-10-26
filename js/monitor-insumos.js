/* Dehesa Index — Monitor de insumos para cooperativas. Lee data/views/input-monitor.json (scripts/build-input-monitor.py).
   Precio actual de fertilizantes, piensos y gasóleo en España frente a sus últimos 10 años (percentil, mínimo, máximo, media)
   y relación grano/fertilizante. Es una posición histórica, no una previsión ni una recomendación de compra. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: { barShort: 'Cuánto fertilizante', barT: 'En esta página', seeChart: 'Ver gráfico',
      title: 'Monitor de insumos', h1: 'Monitor de insumos: ¿está caro o barato?',
      sub: 'El precio que pagan los agricultores en España por fertilizantes, piensos y gasóleo, comparado con sus propios últimos 10 años. Y cuánto fertilizante se compra hoy con el grano. Sirve para preparar la compra agrupada de la cooperativa con datos oficiales en la mano.',
      loading: 'Cargando…', fail: 'No se pudo cargar el monitor. Vuelve a intentarlo en unos minutos.', asof: 'Datos a fecha de',
      howT: 'Cómo leerlo', how: 'El percentil dice en qué parte de su historia está el precio de hoy: 86 significa que el precio actual es igual o más caro que el 86 % de los meses de los últimos 10 años. No es una previsión: dice dónde estamos, no hacia dónde vamos.',
      rT: 'Cuánto fertilizante compra el grano', rS: 'Kilos de fertilizante que se pagan con 100 kg de grano, con los precios del mismo mes (precio percibido del grano y precio pagado del fertilizante, ambos del Ministerio). Cuanto más alto, más fertilizante compra la cosecha.',
      grain: 'Grano', rCols: ['Fertilizante', 'Con 100 kg de grano', 'Posición en 10 años', 'Peor mes', 'Mejor mes'], kg: 'kg',
      rLow: 'de los meses menos favorables', rMid: 'en la zona media', rHigh: 'de los meses más favorables',
      g: { nitrogen: 'Abonos nitrogenados', pk: 'Fósforo y potasio', compound: 'Abonos complejos', feed: 'Piensos y forrajes', energy: 'Energía' },
      cols: ['Insumo', 'Último precio', 'En un año', 'Posición en 10 años', 'Mínimo', 'Máximo', 'Evolución'],
      worse: 'peor', better: 'mejor', cheap: 'barato', dear: 'caro', pctOf: 'percentil', yrs: 'años de historia', late: 'dato retrasado', since: 'desde',
      note: ['Fertilizantes y piensos: precios pagados por los agricultores a la entrada de la explotación, media nacional, sin IVA, en €/100 kg (Ministerio de Agricultura, Pesca y Alimentación). Son medias nacionales: el precio de tu proveedor puede ser distinto.',
        'Gasóleo: precio de surtidor del gasóleo de automoción en España, con impuestos (Weekly Oil Bulletin de la Comisión Europea). No es el gasóleo agrícola (gasóleo B), que lleva otra fiscalidad; sirve para ver la tendencia. Su histórico empieza en 2021, así que la posición se calcula sobre 5 años.',
        'Nada se estima ni se rellena: si un dato llega tarde, se muestra con su fecha y la etiqueta «dato retrasado».'],
      cta: '¿Quieres este monitor con los insumos que compra tu cooperativa y un aviso cuando un precio baje de un umbral? Cuéntanos qué necesitas.', ctaBtn: 'Escríbenos'
    },
    en: { barShort: 'Fertiliser purchasing power', barT: 'On this page', seeChart: 'View chart',
      title: 'Input monitor', h1: 'Input monitor: expensive or cheap?',
      sub: 'What Spanish farmers pay for fertiliser, feed and diesel, compared with their own last 10 years, and how much fertiliser grain buys today. Use it to prepare the cooperative’s group purchase with official data at hand.',
      loading: 'Loading…', fail: 'Could not load the monitor. Please try again in a few minutes.', asof: 'Data as of',
      howT: 'How to read it', how: 'The percentile shows where today’s price sits in its own history: 86 means the current price is equal to or higher than 86% of the months in the last 10 years. It is not a forecast: it says where we are, not where we are going.',
      rT: 'How much fertiliser grain buys', rS: 'Kilos of fertiliser paid for with 100 kg of grain, using prices for the same month (grain price received and fertiliser price paid, both from the Ministry). The higher, the more fertiliser the crop buys.',
      grain: 'Grain', rCols: ['Fertiliser', 'With 100 kg of grain', 'Position in 10 years', 'Worst month', 'Best month'], kg: 'kg',
      rLow: 'among the least favourable months', rMid: 'in the middle range', rHigh: 'among the most favourable months',
      g: { nitrogen: 'Nitrogen fertilisers', pk: 'Phosphorus and potassium', compound: 'Compound fertilisers', feed: 'Feed and forage', energy: 'Energy' },
      cols: ['Input', 'Latest price', 'Over a year', 'Position in 10 years', 'Low', 'High', 'Trend'],
      worse: 'worse', better: 'better', cheap: 'cheap', dear: 'dear', pctOf: 'percentile', yrs: 'years of history', late: 'late data', since: 'since',
      note: ['Fertiliser and feed: prices paid by farmers at the farm gate, national average, excluding VAT, in €/100 kg (Spanish Ministry of Agriculture, Fisheries and Food). They are national averages: your supplier’s price may differ.',
        'Diesel: pump price of road diesel in Spain, taxes included (European Commission Weekly Oil Bulletin). It is not agricultural diesel (gasóleo B), which is taxed differently; it shows the trend. Its history starts in 2021, so the position is computed over 5 years.',
        'Nothing is estimated or filled in: late data are shown with their date and a “late data” label.'],
      cta: 'Want this monitor with the inputs your cooperative buys and an alert when a price drops below a threshold? Tell us what you need.', ctaBtn: 'Contact us'
    },
    fr: { barShort: 'Combien d’engrais', barT: 'Sur cette page', seeChart: 'Voir le graphique',
      title: 'Moniteur des intrants', h1: 'Moniteur des intrants : cher ou bon marché ?',
      sub: 'Ce que paient les agriculteurs espagnols pour les engrais, les aliments du bétail et le gazole, comparé à leurs propres 10 dernières années, et combien d’engrais le grain achète aujourd’hui. Pour préparer l’achat groupé de la coopérative avec des données officielles.',
      loading: 'Chargement…', fail: 'Impossible de charger le moniteur. Réessayez dans quelques minutes.', asof: 'Données au',
      howT: 'Comment le lire', how: 'Le centile indique où se situe le prix d’aujourd’hui dans son histoire : 86 signifie que le prix actuel est égal ou supérieur à celui de 86 % des mois des 10 dernières années. Ce n’est pas une prévision : il dit où nous en sommes, pas où nous allons.',
      rT: 'Combien d’engrais achète le grain', rS: 'Kilos d’engrais payés avec 100 kg de grain, aux prix du même mois (prix perçu du grain et prix payé de l’engrais, tous deux du ministère). Plus c’est élevé, plus la récolte achète d’engrais.',
      grain: 'Grain', rCols: ['Engrais', 'Avec 100 kg de grain', 'Position sur 10 ans', 'Pire mois', 'Meilleur mois'], kg: 'kg',
      rLow: 'parmi les mois les moins favorables', rMid: 'dans la zone moyenne', rHigh: 'parmi les mois les plus favorables',
      g: { nitrogen: 'Engrais azotés', pk: 'Phosphore et potasse', compound: 'Engrais composés', feed: 'Aliments et fourrages', energy: 'Énergie' },
      cols: ['Intrant', 'Dernier prix', 'Sur un an', 'Position sur 10 ans', 'Minimum', 'Maximum', 'Évolution'],
      worse: 'pire', better: 'meilleur', cheap: 'bon marché', dear: 'cher', pctOf: 'centile', yrs: 'ans d’historique', late: 'donnée en retard', since: 'depuis',
      note: ['Engrais et aliments : prix payés par les agriculteurs à l’entrée de l’exploitation, moyenne nationale, hors TVA, en €/100 kg (ministère espagnol de l’Agriculture, de la Pêche et de l’Alimentation). Ce sont des moyennes nationales : le prix de votre fournisseur peut différer.',
        'Gazole : prix à la pompe du gazole routier en Espagne, taxes comprises (Weekly Oil Bulletin de la Commission européenne). Ce n’est pas le gazole agricole, autrement taxé ; il montre la tendance. Son historique commence en 2021 : la position est calculée sur 5 ans.',
        'Rien n’est estimé ni complété : une donnée en retard est affichée avec sa date et la mention « donnée en retard ».'],
      cta: 'Vous voulez ce moniteur avec les intrants que votre coopérative achète et une alerte quand un prix passe sous un seuil ? Dites-nous ce qu’il vous faut.', ctaBtn: 'Nous écrire'
    },
    it: { barShort: 'Quanto fertilizzante', barT: 'In questa pagina', seeChart: 'Vedi grafico',
      title: 'Monitor dei mezzi tecnici', h1: 'Monitor dei mezzi tecnici: caro o conveniente?',
      sub: 'Quanto pagano gli agricoltori spagnoli per fertilizzanti, mangimi e gasolio, confrontato con i loro ultimi 10 anni, e quanto fertilizzante compra oggi il grano. Per preparare l’acquisto collettivo della cooperativa con dati ufficiali alla mano.',
      loading: 'Caricamento…', fail: 'Impossibile caricare il monitor. Riprova tra qualche minuto.', asof: 'Dati al',
      howT: 'Come leggerlo', how: 'Il percentile indica dove si trova il prezzo di oggi nella sua storia: 86 significa che il prezzo attuale è uguale o superiore a quello dell’86 % dei mesi degli ultimi 10 anni. Non è una previsione: dice dove siamo, non dove andiamo.',
      rT: 'Quanto fertilizzante compra il grano', rS: 'Chili di fertilizzante pagati con 100 kg di grano, ai prezzi dello stesso mese (prezzo percepito del grano e prezzo pagato del fertilizzante, entrambi del Ministero). Più è alto, più fertilizzante compra il raccolto.',
      grain: 'Grano', rCols: ['Fertilizzante', 'Con 100 kg di grano', 'Posizione in 10 anni', 'Mese peggiore', 'Mese migliore'], kg: 'kg',
      rLow: 'tra i mesi meno favorevoli', rMid: 'nella fascia media', rHigh: 'tra i mesi più favorevoli',
      g: { nitrogen: 'Concimi azotati', pk: 'Fosforo e potassio', compound: 'Concimi complessi', feed: 'Mangimi e foraggi', energy: 'Energia' },
      cols: ['Mezzo tecnico', 'Ultimo prezzo', 'In un anno', 'Posizione in 10 anni', 'Minimo', 'Massimo', 'Andamento'],
      worse: 'peggio', better: 'meglio', cheap: 'conveniente', dear: 'caro', pctOf: 'percentile', yrs: 'anni di storico', late: 'dato in ritardo', since: 'dal',
      note: ['Fertilizzanti e mangimi: prezzi pagati dagli agricoltori all’ingresso dell’azienda, media nazionale, IVA esclusa, in €/100 kg (Ministero spagnolo dell’Agricoltura, Pesca e Alimentazione). Sono medie nazionali: il prezzo del tuo fornitore può essere diverso.',
        'Gasolio: prezzo alla pompa del gasolio per autotrazione in Spagna, tasse incluse (Weekly Oil Bulletin della Commissione europea). Non è il gasolio agricolo, tassato diversamente; mostra la tendenza. Lo storico parte dal 2021, quindi la posizione è calcolata su 5 anni.',
        'Niente è stimato né riempito: un dato in ritardo è mostrato con la sua data e l’etichetta «dato in ritardo».'],
      cta: 'Vuoi questo monitor con i mezzi tecnici che compra la tua cooperativa e un avviso quando un prezzo scende sotto una soglia? Raccontaci di cosa hai bisogno.', ctaBtn: 'Scrivici'
    }
  };

  /* Textos del selector de país y de los países con índices (no son precios: son posiciones frente a su propia historia) */
  var X = {
    es: { country: 'País', sub: 'Cuánto cuestan los insumos en {c} frente a su propia historia: dónde está hoy cada índice de precios entre sus mínimos y máximos de los últimos {y} años.',
      idx: 'índice 2020=100', q: 'T', rI: 'Cereales frente a abonos', rSI: 'Cuántos abonos compra el cereal respecto a 2020: precio de venta de los cereales dividido entre el índice de precios del abono, ambos con base 2020=100 y del mismo periodo. Más de 100 = el cereal compra más abono que en 2020; menos de 100 = menos. Es un cociente de índices, no kilos.',
      rColsI: ['Abono', 'Cereal ÷ abono (2020=100)', 'Posición en {y} años', 'Peor periodo', 'Mejor periodo'],
      g: { fert: 'Abonos y fertilizantes', general: 'Otros insumos', world: 'Referencia internacional (Banco Mundial)' },
      wT: 'Precio internacional de los fertilizantes', wS: 'Referencia común para todos los países: precio de mercado internacional en USD por tonelada, no lo que paga el agricultor en su país. Sirve para ver si el abono está caro o barato en el mundo.',
      noteI: ['Índices de precios pagados por los agricultores (insumos) y de precios percibidos (cereales), con base 2020 = 100: miden cuánto ha subido o bajado el precio frente a 2020, no cuánto cuesta en euros. La posición dice dónde está el último dato entre los {y} años que cubre cada serie.',
        'Nada se estima ni se rellena: si un país no publica una serie, no aparece. Los datos trimestrales se muestran como T1 a T4.'],
      srcI: { FR: 'Fuente: INSEE (índices IPAMPA de precios pagados e IPPAP de precios percibidos), mensuales desde 2005.', EU: 'Fuente: Eurostat (apri_pi_inq y apri_pi_outq), trimestrales desde 2020; gasóleo: Boletín Petrolero Semanal de la Comisión Europea, con impuestos.' },
      wNote: 'Fuente: Banco Mundial, Commodity Price Data (Pink Sheet), USD por tonelada, mensual. Son precios internacionales de mercado: el precio que paga un agricultor depende de su país, su proveedor y los impuestos.', spain: 'Precios reales (MAPA)',
      sNameUS: 'Azufre importado · EE. UU. (todos los orígenes)', sUsgs: 'USGS, azufre elemental en EE. UU.: valor unitario medio anual FOB mina o planta (USD por tonelada): {a}. Precio del contrato en Tampa (USD por tonelada larga): {t}. El dato de 2025 es una estimación del USGS.', pT: 'Insumos: valor unitario de comercio exterior', pFlow: 'Flujo', pImp: 'Importaciones', pExp: 'Exportaciones', pGrp: { fert: 'Fertilizantes', energy: 'Energía y plásticos', feed: 'Piensos', grain: 'Cereales (referencia)', afford: 'Cuánto fertilizante compra una tonelada de grano', other: 'Otros insumos' }, pNote: 'Fuente: Eurostat Comext, comercio con países de fuera de la UE, euros por tonelada, mensual. Es el valor de aduana de lo que realmente se comerció, no un precio de mercado: va por detrás del mercado y se mueve con el volumen y la mezcla de productos de cada mes. Solo se muestran meses con volumen suficiente (según el producto) y series de al menos dos años; lo que falta no se estima. El petróleo y el gas agrupan productos muy distintos; los tractores se miden por tonelada de peso, así que su cifra solo sirve para ver la tendencia.', pAfName: '{f} por 1 t de {g}', pAfNote: 'Cruce: kilos de fertilizante que se compran con una tonelada de grano, dividiendo el valor unitario de importación del grano entre el del fertilizante del mismo mes (Eurostat Comext, solo importaciones desde fuera de la UE). Son valores de aduana de lo que entró cada mes, no precios de mercado ni de lonja; el grano y el abono importados no tienen por qué ser los que compra un agricultor concreto. Más kilos significa que el grano compra más abono.', pOrT: 'De dónde llegan los insumos a la UE', pOrS: 'Reparto de las importaciones de la UE-27 desde fuera de la UE por país de origen, en toneladas ({y}).', pOrCols: ['Producto', 'Principales orígenes (cuota en toneladas)', 'Toneladas'], sT: 'Azufre: valor unitario de importación', sName: 'Azufre importado de fuera de la UE · {c}', sEU: 'UE-27', sNote: 'Fuente: Eurostat Comext (código 2503, azufre de todo tipo), importaciones desde fuera de la UE, euros por tonelada, mensual. Es el valor de aduana de lo que realmente entró (coste, seguro y flete incluidos), no un precio de mercado: va por detrás del mercado y se mueve con el volumen del mes. Solo se muestran meses con más de {m} toneladas; los demás quedan en blanco. Los países sin volumen suficiente no aparecen.' },
    en: { country: 'Country', sub: 'How expensive inputs are in {c} compared with their own history: where each price index sits today between its lows and highs of the last {y} years.',
      idx: 'index 2020=100', q: 'Q', rI: 'Cereals versus fertiliser', rSI: 'How much fertiliser cereals buy compared with 2020: the cereal selling-price index divided by the fertiliser price index, both based on 2020=100 and for the same period. Above 100 = cereals buy more fertiliser than in 2020; below 100 = less. It is a ratio of indices, not kilos.',
      rColsI: ['Fertiliser', 'Cereal ÷ fertiliser (2020=100)', 'Position in {y} years', 'Worst period', 'Best period'],
      g: { fert: 'Fertilisers', general: 'Other inputs', world: 'International reference (World Bank)' },
      wT: 'International fertiliser prices', wS: 'A common reference for every country: international market price in USD per tonne, not what a farmer pays at home. It shows whether fertiliser is dear or cheap worldwide.',
      noteI: ['Indices of prices paid by farmers (inputs) and prices received (cereals), base 2020 = 100: they show how much a price has risen or fallen since 2020, not what it costs in euros. The position shows where the latest value sits within the {y} years each series covers.',
        'Nothing is estimated or filled in: if a country does not publish a series, it does not appear. Quarterly data are shown as Q1 to Q4.'],
      srcI: { FR: 'Source: INSEE (IPAMPA index of prices paid and IPPAP index of prices received), monthly since 2005.', EU: 'Source: Eurostat (apri_pi_inq and apri_pi_outq), quarterly since 2020; diesel: European Commission Weekly Oil Bulletin, taxes included.' },
      wNote: 'Source: World Bank, Commodity Price Data (Pink Sheet), USD per tonne, monthly. These are international market prices: what a farmer pays depends on the country, the supplier and taxes.', spain: 'Actual prices (MAPA)',
      sNameUS: 'Sulphur imported · United States (all origins)', sUsgs: 'USGS, elemental sulfur in the US: average annual unit value FOB mine or plant (USD per tonne): {a}. Tampa contract price (USD per long ton): {t}. The 2025 figure is a USGS estimate.', pT: 'Inputs: foreign-trade unit value', pFlow: 'Flow', pImp: 'Imports', pExp: 'Exports', pGrp: { fert: 'Fertilisers', energy: 'Energy and plastics', feed: 'Feed', grain: 'Cereals (reference)', afford: 'How much fertiliser one tonne of grain buys', other: 'Other inputs' }, pNote: 'Source: Eurostat Comext, trade with countries outside the EU, euros per tonne, monthly. It is the customs value of what was actually traded, not a market price: it lags the market and moves with each month’s volume and product mix. Only months with enough volume (depending on the product) and series of at least two years are shown; what is missing is not estimated. Petroleum and gas group very different products; tractors are measured per tonne of weight, so their figure is only useful for the trend.', pAfName: '{f} per 1 t of {g}', pAfNote: 'Cross-check: kilos of fertiliser bought with one tonne of grain, dividing the grain import unit value by the fertiliser one of the same month (Eurostat Comext, imports from outside the EU only). These are customs values of what came in each month, not market or exchange prices; the imported grain and fertiliser are not necessarily what a given farmer buys. More kilos means the grain buys more fertiliser.', pOrT: 'Where inputs come from into the EU', pOrS: 'Split of EU-27 imports from outside the EU by country of origin, in tonnes ({y}).', pOrCols: ['Product', 'Main origins (share of tonnes)', 'Tonnes'], sT: 'Sulphur: import unit value', sName: 'Sulphur imported from outside the EU · {c}', sEU: 'EU-27', sNote: 'Source: Eurostat Comext (code 2503, sulphur of all kinds), imports from outside the EU, euros per tonne, monthly. It is the customs value of what actually came in (cost, insurance and freight included), not a market price: it lags the market and moves with the month’s volume. Only months above {m} tonnes are shown; the others are left blank. Countries without enough volume do not appear.' },
    fr: { country: 'Pays', sub: 'Combien coûtent les intrants en {c} par rapport à leur propre historique : où se situe aujourd’hui chaque indice de prix entre ses minimums et maximums des {y} dernières années.',
      idx: 'indice 2020=100', q: 'T', rI: 'Céréales face aux engrais', rSI: 'Quelle quantité d’engrais les céréales achètent par rapport à 2020 : l’indice du prix de vente des céréales divisé par l’indice du prix de l’engrais, tous deux en base 2020=100 et pour la même période. Plus de 100 = les céréales achètent plus d’engrais qu’en 2020 ; moins de 100 = moins. C’est un rapport d’indices, pas des kilos.',
      rColsI: ['Engrais', 'Céréale ÷ engrais (2020=100)', 'Position sur {y} ans', 'Pire période', 'Meilleure période'],
      g: { fert: 'Engrais', general: 'Autres intrants', world: 'Référence internationale (Banque mondiale)' },
      wT: 'Prix internationaux des engrais', wS: 'Une référence commune à tous les pays : prix du marché international en USD par tonne, pas ce que paie l’agriculteur chez lui. Elle montre si l’engrais est cher ou bon marché dans le monde.',
      noteI: ['Indices des prix payés par les agriculteurs (intrants) et des prix perçus (céréales), base 2020 = 100 : ils montrent de combien un prix a monté ou baissé depuis 2020, pas combien il coûte en euros. La position indique où se situe la dernière valeur sur les {y} ans couverts par chaque série.',
        'Rien n’est estimé ni complété : si un pays ne publie pas une série, elle n’apparaît pas. Les données trimestrielles sont affichées en T1 à T4.'],
      srcI: { FR: 'Source : INSEE (indices IPAMPA des prix payés et IPPAP des prix perçus), mensuels depuis 2005.', EU: 'Source : Eurostat (apri_pi_inq et apri_pi_outq), trimestriel depuis 2020 ; gazole : Bulletin pétrolier hebdomadaire de la Commission européenne, taxes comprises.' },
      wNote: 'Source : Banque mondiale, Commodity Price Data (Pink Sheet), USD par tonne, mensuel. Ce sont des prix de marché internationaux : ce que paie un agriculteur dépend du pays, du fournisseur et des taxes.', spain: 'Prix réels (MAPA)',
      sNameUS: 'Soufre importé · États-Unis (toutes origines)', sUsgs: 'USGS, soufre élémentaire aux États-Unis : valeur unitaire moyenne annuelle FOB mine ou usine (USD par tonne) : {a}. Prix du contrat à Tampa (USD par tonne longue) : {t}. Le chiffre de 2025 est une estimation de l’USGS.', pT: 'Intrants : valeur unitaire du commerce extérieur', pFlow: 'Flux', pImp: 'Importations', pExp: 'Exportations', pGrp: { fert: 'Engrais', energy: 'Énergie et plastiques', feed: 'Aliments', grain: 'Céréales (référence)', afford: 'Combien d’engrais achète une tonne de grain', other: 'Autres intrants' }, pNote: 'Source : Eurostat Comext, commerce avec les pays hors UE, euros par tonne, mensuel. C’est la valeur en douane de ce qui a réellement été échangé, pas un prix de marché : elle suit le marché avec retard et varie avec le volume et la composition de chaque mois. Seuls les mois à volume suffisant (selon le produit) et les séries d’au moins deux ans sont affichés ; ce qui manque n’est pas estimé. Le pétrole et le gaz regroupent des produits très différents ; les tracteurs sont mesurés par tonne de poids, leur chiffre ne sert donc qu’à voir la tendance.', pAfName: '{f} pour 1 t de {g}', pAfNote: 'Croisement : kilos d’engrais achetés avec une tonne de grain, en divisant la valeur unitaire à l’importation du grain par celle de l’engrais du même mois (Eurostat Comext, importations hors UE uniquement). Ce sont des valeurs en douane de ce qui est entré chaque mois, pas des prix de marché ; le grain et l’engrais importés ne sont pas forcément ceux qu’achète un agriculteur donné. Plus de kilos signifie que le grain achète plus d’engrais.', pOrT: 'D’où viennent les intrants dans l’UE', pOrS: 'Répartition des importations de l’UE-27 hors UE par pays d’origine, en tonnes ({y}).', pOrCols: ['Produit', 'Principales origines (part en tonnes)', 'Tonnes'], sT: 'Soufre : valeur unitaire à l’importation', sName: 'Soufre importé de l’extérieur de l’UE · {c}', sEU: 'UE-27', sNote: 'Source : Eurostat Comext (code 2503, soufre de toute nature), importations hors UE, euros par tonne, mensuel. C’est la valeur en douane de ce qui est réellement entré (coût, assurance et fret compris), pas un prix de marché : elle suit le marché avec retard et varie avec le volume du mois. Seuls les mois de plus de {m} tonnes sont affichés ; les autres restent vides. Les pays sans volume suffisant n’apparaissent pas.' },
    it: { country: 'Paese', sub: 'Quanto costano i mezzi tecnici in {c} rispetto alla loro storia: dove si trova oggi ciascun indice dei prezzi tra i minimi e i massimi degli ultimi {y} anni.',
      idx: 'indice 2020=100', q: 'T', rI: 'Cereali rispetto ai concimi', rSI: 'Quanto concime comprano i cereali rispetto al 2020: l’indice del prezzo di vendita dei cereali diviso per l’indice del prezzo del concime, entrambi in base 2020=100 e dello stesso periodo. Oltre 100 = i cereali comprano più concime che nel 2020; sotto 100 = meno. È un rapporto tra indici, non chili.',
      rColsI: ['Concime', 'Cereale ÷ concime (2020=100)', 'Posizione in {y} anni', 'Periodo peggiore', 'Periodo migliore'],
      g: { fert: 'Concimi', general: 'Altri mezzi tecnici', world: 'Riferimento internazionale (Banca Mondiale)' },
      wT: 'Prezzi internazionali dei concimi', wS: 'Un riferimento comune a tutti i paesi: prezzo di mercato internazionale in USD per tonnellata, non quanto paga l’agricoltore nel suo paese. Mostra se il concime è caro o conveniente nel mondo.',
      noteI: ['Indici dei prezzi pagati dagli agricoltori (mezzi tecnici) e dei prezzi ricevuti (cereali), base 2020 = 100: mostrano di quanto un prezzo è salito o sceso dal 2020, non quanto costa in euro. La posizione indica dove si trova l’ultimo dato negli {y} anni coperti da ciascuna serie.',
        'Niente è stimato né riempito: se un paese non pubblica una serie, non compare. I dati trimestrali sono mostrati come T1–T4.'],
      srcI: { FR: 'Fonte: INSEE (indici IPAMPA dei prezzi pagati e IPPAP dei prezzi percepiti), mensili dal 2005.', EU: 'Fonte: Eurostat (apri_pi_inq e apri_pi_outq), trimestrali dal 2020; gasolio: Bollettino petrolifero settimanale della Commissione europea, tasse incluse.' },
      wNote: 'Fonte: Banca Mondiale, Commodity Price Data (Pink Sheet), USD per tonnellata, mensile. Sono prezzi di mercato internazionali: quanto paga un agricoltore dipende dal paese, dal fornitore e dalle tasse.', spain: 'Prezzi reali (MAPA)',
      sNameUS: 'Zolfo importato · Stati Uniti (tutte le origini)', sUsgs: 'USGS, zolfo elementare negli Stati Uniti: valore unitario medio annuo FOB miniera o impianto (USD per tonnellata): {a}. Prezzo del contratto a Tampa (USD per tonnellata lunga): {t}. Il dato del 2025 è una stima dell’USGS.', pT: 'Mezzi tecnici: valore unitario del commercio estero', pFlow: 'Flusso', pImp: 'Importazioni', pExp: 'Esportazioni', pGrp: { fert: 'Concimi', energy: 'Energia e plastiche', feed: 'Mangimi', grain: 'Cereali (riferimento)', afford: 'Quanto concime compra una tonnellata di cereale', other: 'Altri mezzi tecnici' }, pNote: 'Fonte: Eurostat Comext, commercio con i paesi extra-UE, euro per tonnellata, mensile. È il valore doganale di ciò che è stato realmente scambiato, non un prezzo di mercato: segue il mercato con ritardo e varia con il volume e la composizione di ogni mese. Si mostrano solo i mesi con volume sufficiente (secondo il prodotto) e le serie di almeno due anni; ciò che manca non viene stimato. Petrolio e gas raggruppano prodotti molto diversi; i trattori sono misurati per tonnellata di peso, quindi la cifra serve solo per la tendenza.', pAfName: '{f} per 1 t di {g}', pAfNote: 'Incrocio: chili di concime acquistati con una tonnellata di cereale, dividendo il valore unitario all’importazione del cereale per quello del concime dello stesso mese (Eurostat Comext, solo importazioni da fuori UE). Sono valori doganali di ciò che è entrato ogni mese, non prezzi di mercato; il cereale e il concime importati non sono necessariamente quelli che acquista un singolo agricoltore. Più chili significa che il cereale compra più concime.', pOrT: 'Da dove arrivano i mezzi tecnici nell’UE', pOrS: 'Ripartizione delle importazioni UE-27 da fuori UE per paese di origine, in tonnellate ({y}).', pOrCols: ['Prodotto', 'Principali origini (quota in tonnellate)', 'Tonnellate'], sT: 'Zolfo: valore unitario all’importazione', sName: 'Zolfo importato da fuori dell’UE · {c}', sEU: 'UE-27', sNote: 'Fonte: Eurostat Comext (codice 2503, zolfo di ogni specie), importazioni da fuori dell’UE, euro per tonnellata, mensile. È il valore doganale di ciò che è realmente entrato (costo, assicurazione e nolo inclusi), non un prezzo di mercato: segue il mercato con ritardo e varia con il volume del mese. Si mostrano solo i mesi sopra {m} tonnellate; gli altri restano vuoti. I paesi senza volume sufficiente non compaiono.' },
  };
  var DOC = null, WORLD = null, SULPH = null, SGDOC = null, PRICES = null, PGDOC = null, FLOW = 'imp', INDEX = null, CC = 'ES', FAILED = false, GRAIN = 'es-perc-trigo', ES_DOC = null;
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nm(o) { return (o && (o[lang()] || o.es)) || ''; }
  function num(v, d) { if (v == null || !isFinite(v)) return '—'; var s = Number(v).toFixed(d); return lang() === 'en' ? s : s.replace('.', ','); }
  function pct(v) { return v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), 1) + ' %'; }

  function xt() { return X[lang()] || X.es; }
  function yrs() { var v = DOC && DOC.years ? DOC.years : 10; return num(v, v % 1 ? 1 : 0); }
  function Y(s) { return String(s).replace(/\b10\b/g, yrs()).replace('{y}', yrs()); }
  function isIdx() { return !!(DOC && DOC.kind === 'index'); }
  function flag(c) { var i = c === 'EL' ? 'GR' : c; return /^[A-Z]{2}$/.test(i) && c !== 'EU' ? String.fromCodePoint(127397 + i.charCodeAt(0), 127397 + i.charCodeAt(1)) : '🇪🇺'; }
  function cname(c) { if (c === 'EU') return ({ es: 'Unión Europea', en: 'European Union', fr: 'Union européenne', it: 'Unione europea' })[lang()]; try { return new Intl.DisplayNames([lang()], { type: 'region' }).of(c === 'EL' ? 'GR' : c) || c; } catch (e) { return c; } }
  function per(p) {
    var mo = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'], q = /^(\d{4})-Q([1-4])$/.exec(p || '');
    if (q) return xt().q + q[2] + ' ' + q[1];
    if (!p) return '—'; if (p.length === 10) return S.fmtDate ? S.fmtDate(p) : p;
    if (p.length === 7) { try { return new Date(p + '-15T00:00:00Z').toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return mo[+p.slice(5)] + ' ' + p.slice(0, 4); } }
    return p;
  }
  function unitShort(u) { u = String(u || ''); if (u.indexOf('índice') === 0) return xt().idx; return u.replace(' (sin IVA)', '').replace('EUR/litro', '€/l'); }
  function dec(v, u) { if (u && String(u).indexOf('índice') === 0) return 1; if (u === 'USD/t' || u === 'EUR/t' || u === 'kg/t') return v >= 100 ? 0 : 1; return v < 10 ? 3 : 2; }

  // barra de posición: 0 = el más barato de la ventana, 100 = el más caro
  function bar(p, w, inverse, sid) {
    var c = inverse ? (p >= 67 ? 'var(--positive)' : p <= 33 ? 'var(--negative)' : '#8f5f12') : (p >= 67 ? 'var(--negative)' : p <= 33 ? 'var(--positive)' : '#8f5f12');
    return '<div class="mi-pos"' + (sid ? ' role="button" tabindex="0" data-sp="' + esc(sid) + '" aria-expanded="false" aria-label="' + esc(w.seeChart + ': ' + p) + '" style="cursor:pointer"' : '') + ' title="' + esc((sid ? w.seeChart + ' · ' : '') + w.pctOf + ' ' + p) + '"><div class="mi-track"><span class="mi-dot" style="left:' + Math.max(0, Math.min(100, p)) + '%;background:' + c + '"></span></div>' +
      '<div class="mi-pos-l"><span>' + esc(inverse ? '' : w.cheap) + '</span><strong style="color:' + c + '">' + p + '</strong><span>' + esc(inverse ? '' : w.dear) + '</span></div></div>';
  }
  function spark(vals) {
    if (!vals || vals.length < 3) return '';
    var W = 110, H = 30, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), r = mx - mn || 1;
    var d = vals.map(function (v, i) { return (i ? 'L' : 'M') + (i / (vals.length - 1) * W).toFixed(1) + ' ' + (H - 3 - (v - mn) / r * (H - 6)).toFixed(1); }).join(' ');
    var lx = W, ly = (H - 3 - (vals[vals.length - 1] - mn) / r * (H - 6)).toFixed(1);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="var(--text-muted)" stroke-width="1.4"/><circle cx="' + (lx - 1.5) + '" cy="' + ly + '" r="2.6" fill="var(--text)"/></svg>';
  }

  function rid(r) { return 'r|' + r.grain + '|' + r.fert; }
  function ratioBlock(w) {
    var X1 = xt(), I = isIdx(), grains = [], seen = {};
    DOC.ratios.forEach(function (r) { if (!seen[r.grain]) { seen[r.grain] = 1; grains.push(r); } });
    if (!grains.length) return '';
    if (!seen[GRAIN]) GRAIN = grains[0].grain;
    var rows = DOC.ratios.filter(function (r) { return r.grain === GRAIN; }), cols = I ? X1.rColsI : w.rCols, u = I ? '' : ' ' + w.kg;
    var h = '<section class="di-card mi-sec" id="mi-ratio"><h2>' + esc(I ? X1.rI : w.rT) + '</h2><p class="mi-sub">' + esc(I ? X1.rSI : w.rS) + '</p>';
    if (grains.length > 1) h += '<label class="mi-lab">' + esc(w.grain) + ' <select id="mi-g" class="di-compare-select" style="width:auto">' + grains.map(function (r) { return '<option value="' + r.grain + '"' + (r.grain === GRAIN ? ' selected' : '') + '>' + esc(({ 'es-perc-trigo': '🌾 ', 'es-perc-cebada': '🍺 ', 'es-perc-maiz': '🌽 ', 'es-perc-girasol': '🌻 ', 'am010000': '🌾 ', 'am011000': '🌾 ', 'am013000': '🍺 ', 'am015000': '🌽 ', 'fr-596': '🌾 ', 'fr-600': '🌾 ', 'fr-597': '🍺 ', 'fr-605': '🌽 ' }[r.grain] || '') + nm(r.grainName)) + '</option>'; }).join('') + '</select></label>';
    h += '<div style="overflow-x:auto"><table class="mi-t" data-no-rows><thead><tr>' + cols.map(function (c) { return '<th>' + esc(Y(c)) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var lab = r.pct <= 20 ? w.rLow : r.pct >= 80 ? w.rHigh : w.rMid;
      h += '<tr><td><strong>' + esc(nm(r.fertName)) + '</strong><div class="mi-m">' + esc(per(r.last)) + '</div></td><td><strong>' + esc(num(r.value, 1)) + esc(u) + '</strong></td>' +
        '<td>' + bar(r.pct, w, true, r.spark && r.spark.length > 2 ? rid(r) : '') + '<div class="mi-m">' + esc(lab) + '</div></td><td>' + esc(num(r.min[1], 1)) + esc(u) + '<div class="mi-m">' + esc(per(r.min[0])) + '</div></td>' +
        '<td>' + esc(num(r.max[1], 1)) + esc(u) + '<div class="mi-m">' + esc(per(r.max[0])) + '</div></td></tr>' +
        '<tr class="mi-ch" data-ch="' + esc(rid(r)) + '" hidden><td colspan="5" style="padding:4px 6px 14px"></td></tr>';
    });
    return h + '</tbody></table></div></section>';
  }
  function groupBlock(w, g, title, sub) {
    if (!g.items.length) return '';
    var X1 = xt(), h = '<section class="di-card mi-sec" id="mi-g-' + esc(g.id) + '"><h2>' + esc(title || w.g[g.id] || X1.g[g.id] || g.id) + '</h2>' + (sub ? '<p class="mi-sub">' + esc(sub) + '</p>' : '') + '<div style="overflow-x:auto"><table class="mi-t" data-no-rows><thead><tr>' + w.cols.map(function (c) { return '<th>' + esc(Y(c)) + '</th>'; }).join('') + '</tr></thead><tbody>';
    g.items.forEach(function (x) {
      var late = x.state === 'DELAYED' || x.state === 'STALE', yr = x.years < 9.5 ? '<div class="mi-m">' + esc(num(x.years, x.years % 1 ? 1 : 0) + ' ' + w.yrs) + '</div>' : '';
      h += '<tr><td><strong>' + esc(nm(x.name)) + '</strong></td>' +
        '<td><strong>' + esc(num(x.value, dec(x.value, x.unit))) + '</strong> <span class="mi-m">' + esc(unitShort(x.unit)) + '</span><div class="mi-m">' + esc(per(x.last)) + (late ? ' · <span style="color:#8f5f12">' + esc(w.late) + '</span>' : '') + '</div></td>' +
        '<td style="color:' + (x.yoy > 0 ? (g.gid === 'afford' ? 'var(--positive)' : 'var(--negative)') : x.yoy < 0 ? (g.gid === 'afford' ? 'var(--negative)' : 'var(--positive)') : 'inherit') + ';font-weight:600">' + esc(pct(x.yoy)) + '</td>' +
        '<td>' + bar(x.pct, w, g.gid === 'afford', x.spark && x.spark.length > 2 ? x.id : '') + yr + '</td>' +
        '<td>' + esc(num(x.min[1], dec(x.min[1], x.unit))) + '<div class="mi-m">' + esc(per(x.min[0])) + '</div></td><td>' + esc(num(x.max[1], dec(x.max[1], x.unit))) + '<div class="mi-m">' + esc(per(x.max[0])) + '</div></td>' +
        '<td>' + (x.spark && x.spark.length > 2 ? '<button type="button" class="mi-sp" data-sp="' + esc(x.id) + '" aria-expanded="false" title="' + esc(w.seeChart) + '" aria-label="' + esc(w.seeChart + ': ' + nm(x.name)) + '" style="background:none;border:0;padding:2px;cursor:pointer;font:inherit;color:inherit;text-align:left">' + spark(x.spark) + '<div class="mi-m" style="margin:0">' + esc(w.seeChart) + ' ▾</div></button>' : '') + '</td></tr>' +
        '<tr class="mi-ch" data-ch="' + esc(x.id) + '" hidden><td colspan="7" style="padding:4px 6px 14px"></td></tr>';
    });
    return h + '</tbody></table></div></section>';
  }
  function findItem(id) { var r = null; if (id.indexOf('r|') === 0) { (DOC.ratios || []).forEach(function (q) { if (rid(q) === id) r = q; }); if (r) r.name = r.fertName; return r; } [DOC, WORLD, SGDOC, PGDOC].forEach(function (d) { if (d) d.groups.forEach(function (g) { g.items.forEach(function (x) { if (x.id === id) r = x; }); }); }); return r; }
  function toggleChart(id, btn) {
    var row = document.querySelector('tr[data-ch="' + id + '"]'); if (!row) return;
    var open = row.hasAttribute('hidden'); var all = document.querySelectorAll('[data-sp="' + id + '"]'); function ae(v) { Array.prototype.forEach.call(all, function (e) { e.setAttribute('aria-expanded', v); }); }
    if (!open) { row.setAttribute('hidden', ''); ae('false'); return; }
    var x = findItem(id), w = t(), cell = row.firstChild; if (!x || !x.spark) return;
    var pts = [], n = x.spark.length, y = +x.last.slice(0, 4), qm = /-Q([1-4])$/.exec(x.last), m = qm ? +qm[1] * 3 - 1 : +x.last.slice(5, 7) - 1, step = qm ? 3 : 1, i, d, lab, qq = qm ? +qm[1] : 0;
    for (i = n - 1; i >= 0; i--) {
      d = Date.UTC(y, m, 15); lab = qm ? per(y + '-Q' + qq) : per(new Date(d).toISOString().slice(0, 7));
      if (x.spark[i] != null) pts.unshift({ x: d, y: x.spark[i], l: lab });
      m -= step; if (m < 0) { m += 12; y--; } if (qm) { qq--; if (qq < 1) qq = 4; }
    }
    cell.innerHTML = '<div style="font-weight:600;margin:6px 0">' + esc(nm(x.name)) + ' · ' + esc(unitShort(x.unit)) + '</div>' + (window.DehesaChart && window.DehesaChart.render && pts.length > 2 ? window.DehesaChart.render({ series: [{ name: nm(x.name), color: '#8a2d2d', pts: pts }], xMode: 'time', yTitle: unitShort(x.unit), aria: nm(x.name), zero: false, noLegend: true, vFmt: function (v) { return v == null ? '—' : num(v, dec(v, x.unit)); } }) : '');
    row.removeAttribute('hidden'); ae('true');
  }
  function chips() {   // selector compacto de la web (js/country-picker.js): boton con buscador y grupos, en vez de una pared de botones
    var X1 = xt(), list = [{ cc: 'ES' }].concat((INDEX && INDEX.countries) || []);
    return '<div class="mi-how cp-pick" style="display:flex;margin-bottom:14px"><label class="cp-lab" for="mi-cc">' + esc(X1.country) + '</label><select id="mi-cc" data-cpick data-cprecent="insumos" class="di-compare-select">' +
      list.map(function (c) { return '<option value="' + c.cc + '"' + (c.cc === CC ? ' selected' : '') + '>' + flag(c.cc) + ' ' + esc(cname(c.cc)) + '</option>'; }).join('') + '</select></div>';
  }
  function sulphGroup() {   // azufre (Eurostat Comext): UE-27 y, si hay volumen suficiente, el pais elegido
    var X1 = xt(), items = [], l = lang();
    if (!SULPH) return null;
    ['EU', CC, 'US'].forEach(function (c, i) {
      var it = SULPH.items[c], o = {}, k, x = {}; if (!it || (i && c === 'EU') || (i === 2 && CC === 'US')) return;
      o[l] = c === 'US' ? X1.sNameUS : X1.sName.replace('{c}', c === 'EU' ? X1.sEU : cname(c)); x.id = 'sul-' + c; x.name = o;
      for (k in it) if (Object.prototype.hasOwnProperty.call(it, k)) x[k] = it[k];
      items.push(x);
    });
    return items.length ? { id: 'sulphur', items: items } : null;
  }
  function usgsNote() {   // texto con las cifras del USGS (anual y Tampa); null si no hay datos
    var U = SULPH && SULPH.usgs, X1 = xt(), a, t;
    if (!U || !U.annual || !U.tampa) return null;
    a = U.annual.map(function (p) { return p[0] + ': ' + num(p[1], p[1] >= 100 ? 0 : 1) + (U.estimateFrom && p[0] === U.estimateFrom ? '*' : ''); }).join(', ');
    t = U.tampa.map(function (p) { return per(p[0]) + ': ' + num(p[1], 0); }).join(', ');
    return X1.sUsgs.replace('{a}', a).replace('{t}', t);
  }
  function pricesGroups() {   // insumos (Eurostat Comext): por producto, la UE-27 y, si hay volumen suficiente, el pais elegido
    var X1 = xt(), l = lang(), out = [];
    if (!PRICES) return out;
    ['fert', 'energy', 'feed', 'grain', 'other'].forEach(function (gid) {
      var items = [];
      PRICES.products.forEach(function (p) {
        if (p.group !== gid) return;
        var by = (PRICES.items[FLOW] || {})[p.cn]; if (!by) return;
        ['EU', CC].forEach(function (c, i) {
          var it = by[c], o = {}, k, x = {}; if (!it || (i && c === 'EU')) return;
          o[l] = (p.name[l] || p.name.es) + ' · ' + (c === 'EU' ? X1.sEU : cname(c)); x.id = 'inp-' + FLOW + '-' + p.id + '-' + c; x.name = o;
          for (k in it) if (Object.prototype.hasOwnProperty.call(it, k)) x[k] = it[k];
          items.push(x);
        });
      });
      if (items.length) out.push({ id: 'inp-' + gid, gid: gid, items: items });
    });
    var af = PRICES.items.afford, pr = {}, ai = [];
    if (af) {
      PRICES.products.forEach(function (p) { pr[p.cn] = p; });
      Object.keys(af).forEach(function (f) {
        Object.keys(af[f]).forEach(function (g) {
          ['EU', CC].forEach(function (c, i) {
            var it = af[f][g][c], o = {}, k, x = {}; if (!it || (i && c === 'EU') || !pr[f] || !pr[g]) return;
            o[l] = (X1.pAfName.replace('{f}', pr[f].name[l] || pr[f].name.es).replace('{g}', (pr[g].name[l] || pr[g].name.es).toLowerCase())) + ' · ' + (c === 'EU' ? X1.sEU : cname(c)); x.id = 'inp-af-' + f + '-' + g + '-' + c; x.name = o;
            for (k in it) if (Object.prototype.hasOwnProperty.call(it, k)) x[k] = it[k];
            ai.push(x);
          });
        });
      });
      if (ai.length) out.push({ id: 'inp-afford', gid: 'afford', items: ai });
    }
    return out;
  }
  function originsBlock(w) {
    var X1 = xt(), l = lang(), rows = '';
    if (!PRICES || !PRICES.origins) return '';
    PRICES.products.forEach(function (p) {
      [['EU', PRICES.origins[p.cn]], [CC, CC !== 'EU' && PRICES.originsByCountry ? (PRICES.originsByCountry[p.cn] || {})[CC] : null]].forEach(function (e) {
        var o = e[1]; if (!o || !o.top || !o.top.length) return;
        rows += '<tr><td><strong>' + esc(p.name[l] || p.name.es) + '</strong> <span class="mi-m">' + esc(e[0] === 'EU' ? X1.sEU : cname(e[0])) + '</span></td><td>' + o.top.map(function (t) { return esc(cname(t[0])) + ' ' + esc(num(t[1], 0)) + ' %'; }).join(' · ') + '</td><td>' + esc(num(o.tonnes / 1000, o.tonnes < 10000 ? 1 : 0)) + ' kt</td></tr>';
      });
    });
    if (!rows) return '';
    return '<section class="di-card mi-sec" id="mi-g-origins"><h2>' + esc(X1.pOrT) + '</h2><p class="mi-sub">' + esc(X1.pOrS.replace('{y}', PRICES.originsYear)) + '</p><div style="overflow-x:auto"><table class="mi-t" data-no-rows><thead><tr>' + X1.pOrCols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }
  function flowPicker() {
    var X1 = xt();
    return '<div class="mi-how cp-pick" style="display:flex;margin:14px 0"><label class="cp-lab" for="mi-flow">' + esc(X1.pFlow) + '</label><select id="mi-flow" class="di-compare-select"><option value="imp"' + (FLOW === 'imp' ? ' selected' : '') + '>' + esc(X1.pImp) + '</option><option value="exp"' + (FLOW === 'exp' ? ' selected' : '') + '>' + esc(X1.pExp) + '</option></select></div>';
  }
  function render() {
    var w = t(), X1 = xt(), root = document.getElementById('mi-body'); if (!root) return;
    document.getElementById('mi-h1').textContent = w.h1; document.title = w.title + ' | Dehesa Index';
    document.getElementById('mi-sub').textContent = DOC && isIdx() ? Y(X1.sub).replace('{c}', cname(CC)) : w.sub;
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!DOC) { root.innerHTML = chips() + '<p class="di-movers-hint" role="status">' + esc(w.loading) + '</p>'; bindChips(root); return; }
    var I = isIdx(), h = chips() + '<div class="mi-how"><strong>' + esc(w.howT) + '.</strong> ' + esc(Y(w.how)) + '<div class="mi-m" style="margin-top:4px">' + esc(w.asof) + ' ' + esc(S.fmtDate ? S.fmtDate(String(DOC.generatedAt).slice(0, 10)) : DOC.generatedAt) + '</div></div>';
    h += ratioBlock(w);
    DOC.groups.forEach(function (g) { h += groupBlock(w, g); });
    if (WORLD && WORLD.groups[0].items.length) h += groupBlock(w, WORLD.groups[0], X1.wT, X1.wS);
    var SG = sulphGroup(); SGDOC = SG ? { groups: [SG] } : null;
    if (SG) h += groupBlock(w, SG, X1.sT);
    var PG = pricesGroups(); PGDOC = PG.length ? { groups: PG } : null;
    if (PG.length) { h += flowPicker(); PG.forEach(function (g) { h += groupBlock(w, g, X1.pGrp[g.gid]); }); h += originsBlock(w); }
    h += (I ? X1.noteI.map(Y).concat([X1.srcI[CC === 'FR' ? 'FR' : 'EU']]) : w.note).concat(WORLD ? [X1.wNote] : []).concat(SG ? [X1.sNote.replace('{m}', String(SULPH.minTonnes))].concat(usgsNote() ? [usgsNote()] : []) : []).concat(PG.length ? [X1.pNote].concat(PG.some(function (g) { return g.gid === 'afford'; }) ? [X1.pAfNote] : []) : []).map(function (p) { return '<p class="di-movers-hint" style="max-width:820px">' + esc(p) + '</p>'; }).join('');
    h += '<section class="di-card di-emp-cta" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.cta) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaBtn) + '</a></section>';
    root.innerHTML = h; bindChips(root);
    Array.prototype.forEach.call(root.querySelectorAll('[data-sp]'), function (b) { b.onclick = function () { toggleChart(b.getAttribute('data-sp'), b); }; b.onkeydown = function (e) { if (b.getAttribute('role') === 'button' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleChart(b.getAttribute('data-sp'), b); } }; });
    var F = S.frame, bh = document.getElementById('mi-bar'), secs = [];
    if (root.querySelector('#mi-ratio')) secs.push(['mi-ratio', w.barShort]);
    DOC.groups.forEach(function (g) { if (g.items.length) secs.push(['mi-g-' + g.id, w.g[g.id] || X1.g[g.id] || g.id]); });
    if (WORLD && WORLD.groups[0].items.length) secs.push(['mi-g-world', X1.g.world]);
    if (SG) secs.push(['mi-g-sulphur', X1.sT]);
    PG.forEach(function (g) { secs.push(['mi-g-' + g.id, X1.pGrp[g.gid]]); });
    if (root.querySelector('#mi-g-origins')) secs.push(['mi-g-origins', X1.pOrT]);
    if (F && bh) F.bar(bh, w.barT, secs);
    var fs = document.getElementById('mi-flow'); if (fs) fs.onchange = function (e) { FLOW = e.target.value === 'exp' ? 'exp' : 'imp'; render(); };
    var sel = document.getElementById('mi-g'); if (sel) sel.onchange = function (e) { GRAIN = e.target.value; render(); };
  }
  function bindChips(root) { var s = root.querySelector('#mi-cc'); if (!s) return; s.onchange = function () { setCountry(s.value); }; if (window.DehesaCountryPicker) window.DehesaCountryPicker.scan(root); }
  function getJ(u) { return fetch(S.sitePath(u), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }); }
  function setCountry(cc, noPush) {
    CC = cc; FAILED = false; DOC = null;
    if (!noPush) { try { var u = new URL(location.href); if (cc === 'ES') u.searchParams.delete('c'); else u.searchParams.set('c', cc); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { /* sin historial */ } }
    render();
    var p = cc === 'ES' ? (ES_DOC ? Promise.resolve(ES_DOC) : getJ('data/views/input-monitor.json').then(function (d) { return (ES_DOC = d); })) : getJ('data/views/input-monitor-countries/' + cc + '.json');
    p.then(function (d) { if (CC !== cc) return; DOC = d; GRAIN = d.ratios && d.ratios.length ? d.ratios[0].grain : GRAIN; render(); }).catch(function () { if (CC === cc) { FAILED = true; render(); } });
  }
  S.init('data');
  S.onLangChange = render;
  render();
  var q0 = /[?&]c=([A-Za-z]{2})/.exec(location.search), cc0 = q0 ? q0[1].toUpperCase() : 'ES';
  getJ('data/views/input-monitor-countries/index.json').then(function (d) { INDEX = d; }).catch(function () { INDEX = null; }).then(function () {
    if (!INDEX) return null;  // la referencia mundial y el azufre solo se piden si el índice dice que existen
    var pw = INDEX.world ? getJ('data/views/input-monitor-countries/world.json').then(function (d) { WORLD = d; }).catch(function () { WORLD = null; }) : Promise.resolve();
    return pw.then(function () { return INDEX.sulphur ? getJ('data/views/input-monitor-countries/sulphur.json').then(function (d) { SULPH = d; }).catch(function () { SULPH = null; }) : null; }).then(function () { return INDEX.prices ? getJ('data/views/input-monitor-countries/prices.json').then(function (d) { PRICES = d; }).catch(function () { PRICES = null; }) : null; });
  }).then(function () {
    var ok = cc0 === 'ES' || (INDEX && INDEX.countries.some(function (c) { return c.cc === cc0; }));
    setCountry(ok ? cc0 : 'ES', true);
  });
})();
