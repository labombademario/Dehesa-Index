/* Dehesa Index — Blog */
(function () {
  'use strict';

  // Fuentes reales citadas en las notas -- mismo criterio de honestidad que
  // Noticias/Calendario: enlaces verificables, nada inventado.
  var SRC = {
    farmprogress: 'https://www.farmprogress.com/marketing/usda-forecasts-smallest-us-winter-wheat-crop-since-1965-as-drought-devastates-key-growing-regions-in-the-plains',
    riotimes: 'https://www.riotimesonline.com/grains-soy-corn-latam-monday-september-21-2026/',
    moncloa: 'https://www.moncloa.com/2026/09/26/contratos-leche-vacuno-revision-alza-precios-3438213/',
    eiasteo: 'https://www.eia.gov/outlooks/steo/',
    dtnfert: 'https://www.dtnpf.com/agriculture/web/ag/crops/article/2026/10/14/uan32-leads-fertilizer-prices-higher',
    spglobal: 'https://press.spglobal.com/2026-10-19-Out-of-Hormuz-Energy-Shocks,-the-Ingredients-for-a-Global-Food-Crisis',
    agronewscyl: 'https://www.agronewscastillayleon.com/precios-agrarios-2-6-noviembre-2026-porcino-cereales-vacuno',
    pigsitecme: 'https://www.thepigsite.com/news/2026/11/cattle-futures-fall-for-an-eighth-session-on-weak-cash-prices-cme',
    pigsiteweekly: 'https://www.thepigsite.com/articles/weekly-pig-report-lean-hog-futures-extend-losses-as-cash-hog-prices-weaken'
  };

  // Categorías: mismas etiquetas que el resto del sitio para el mismo grupo
  // de producto (Precios, Dehesa Market Map).
  var CAT = {
    es: { cereales: 'Cereales', fertilizantes: 'Fertilizantes', lacteos: 'Lácteos', energia: 'Energía', porcino: 'Porcino' },
    en: { cereales: 'Grains', fertilizantes: 'Fertilizer', lacteos: 'Dairy', energia: 'Energy', porcino: 'Pork' },
    fr: { cereales: 'Céréales', fertilizantes: 'Engrais', lacteos: 'Produits laitiers', energia: 'Énergie', porcino: 'Porc' },
    it: { cereales: 'Cereali', fertilizantes: 'Fertilizzanti', lacteos: 'Lattiero-caseario', energia: 'Energia', porcino: 'Suini' }
  };

  function buildStrings() {
    var STRINGS = {};
    var langCat = {};
    Object.keys(CAT).forEach(function (lg) { langCat[lg] = CAT[lg]; });

    STRINGS.es = {
      title: 'Blog: qué mueve los mercados agrícolas | Dehesa Index', badge: 'NOTAS REALES', updated: 'Actualizado 9 nov 2026',
      h1: 'Blog',
      sub: 'Contexto corto sobre qué mueve estos mercados esta semana, con cifras y fuentes reales — no un resumen de titulares, sino la lectura de Dehesa Index sobre lo que hay detrás.',
      disclaimer: 'Cada nota cita datos y fechas reales, verificables en las fuentes enlazadas al pie. Cuando un dato concreto no está disponible (por ejemplo, un precio objetivo aún no publicado), se dice explícitamente en vez de estimarlo.',
      posts: [
        {
          category: CAT.es.porcino, date: '2026-11-09', dateLabel: '9 nov 2026',
          title: 'El cerdo encadena semanas a la baja a ambos lados del Atlántico',
          para1: 'En España, la canal de cerdo de clase S —la referencia española que publica la Comisión Europea y sigue Dehesa Index— cotizó a 160,25 €/100 kg la semana del 1 de noviembre: es la sexta bajada semanal seguida y un 10,3% menos que los 178,56 € del 20 de septiembre. Las lonjas cuentan lo mismo en vivo: en Segovia, el cerdo selecto cerró la sesión del 5 de noviembre en 1,147 €/kg, 3,5 céntimos menos que la semana anterior y 21 céntimos por debajo del 17 de septiembre (1,357 €/kg), y el lechón de 20 kg bajó a 35 € la unidad. La crónica de Agronews Castilla y León habla de una trayectoria descendente que viene de octubre, pero no atribuye la caída a una causa concreta, y aquí tampoco se le pone una. El ibérico va a contracorriente: en Salamanca subió 10 céntimos, con el cebo de campo a 3,16 €/kg.',
          para2: 'En Estados Unidos el ajuste es más brusco. El precio base de la canal en compra directa que publica el USDA (informe LM_HG201) bajó de 78,79 $/cwt el 5 de octubre a 63,66 $ el 6 de noviembre, un 19,2% menos en un mes, y ese mismo día el futuro de cerdo magro de diciembre en Chicago cerró en 55,10 centavos por libra, tras tocar un mínimo de contrato de 54,225. Los operadores citados por Reuters lo achacan a una demanda floja de carne de cerdo y a una oferta abundante de animales, con canales más pesadas: 293,5 libras de media la semana del 31 de octubre, frente a 291,6 hace un año. En exportación, las ventas netas de la última semana sumaron 37.300 toneladas, un 12% menos que la semana anterior, y México se llevó cerca del 45%. Para el cebadero, que compró el lechón y el pienso meses antes, la bajada se nota primero en el margen; esto describe lo ocurrido, no es una previsión de hacia dónde irá el precio.',
          sources: [{ label: 'Agronews Castilla y León (7 nov 2026)', url: SRC.agronewscyl }, { label: 'The Pig Site (6 nov 2026)', url: SRC.pigsitecme }, { label: 'The Pig Site, informe semanal (6 nov 2026)', url: SRC.pigsiteweekly }]
        },
        {
          category: CAT.es.energia, date: '2026-10-21', dateLabel: '21 oct 2026',
          title: 'Del petróleo al abono: la factura energética llega al campo',
          para1: 'El precio spot del Brent que publica la EIA cerró el 9 de octubre en 127,43 $/barril, un 28,6% más que cinco semanas antes; el WTI estadounidense subió mucho menos (96,88 $, +6,3%). Detrás está el conflicto en Oriente Medio: en su previsión del 6 de octubre, la EIA espera que los flujos de crudo de la región sigan limitados durante el cuarto trimestre y sitúa el Brent en una media de 105 $/barril en ese periodo. El gasóleo es el eslabón más tenso: en EE. UU. el precio minorista medio fue de 6,29 $/galón en septiembre, con los inventarios de destilados de la Costa Este un 32% por debajo de su media de cinco años. En la UE la subida va, por ahora, más despacio: el Boletín Petrolero sitúa el gasóleo en 2,14 €/litro el 12 de octubre, un 1,3% más en cinco semanas.',
          para2: 'Al agricultor la energía le llega también por el abono nitrogenado, que se fabrica con gas. Según el S&P Global Institute, por el estrecho de Ormuz pasa normalmente cerca del 29% del comercio mundial de urea y alrededor del 21% del amoníaco que se comercia. En la encuesta de DTN de la primera semana de octubre, la urea minorista en EE. UU. costaba 672 $/tonelada (un 12% más que hace un año) y el amoníaco anhidro 977 $ (+20%); en los datos del Banco Mundial que sigue Dehesa Index, la urea marcó 407,5 $/t en septiembre (+4,5% en el mes) y el gas natural en Europa subió un 20% ese mismo mes. Como recuerda S&P, los agricultores compran semilla, abono y combustible meses antes de vender la cosecha, así que el golpe se nota primero en los márgenes: sus autores creen que podría no llegar con fuerza a los precios de los alimentos hasta 2027, una lectura suya y no una previsión de Dehesa Index.',
          sources: [{ label: 'EIA (6 oct 2026)', url: SRC.eiasteo }, { label: 'DTN (14 oct 2026)', url: SRC.dtnfert }, { label: 'S&P Global (19 oct 2026)', url: SRC.spglobal }]
        },
        {
          category: CAT.es.cereales, date: '2026-09-28', dateLabel: '28 sep 2026',
          title: 'Por qué el trigo llega caro a esta campaña',
          para1: 'La cosecha de trigo de invierno de EE. UU. para 2026-27 se quedó en 1.048 millones de bushels — un 25% menos que el año anterior y la más pequeña desde 1965, según el USDA. La sequía golpeó con fuerza el oeste de Kansas, el este de Colorado y el Panhandle: en Kansas el rendimiento cayó a 37 bushels por acre, desde 51 en 2025, y la variedad más afectada (trigo duro rojo de invierno) bajó un 36%. El USDA proyecta que el precio medio en origen suba a 6,50 $/bushel en la campaña 2026-27, 1,50 $ más que el año anterior — aunque las exportaciones estadounidenses se prevén un 15% más bajas, porque el propio encarecimiento resta competitividad frente a otros exportadores.',
          para2: 'En el día a día, sin embargo, el mercado no sube en línea recta: el 18 de septiembre trigo, maíz y soja cerraron a la baja (trigo -1,45%, maíz -0,66%, soja -1,04%) después de que el USDA recortara la previsión de maíz en Kansas en 39 millones de bushels sin que China saliera a comprar para compensar — un recordatorio de que en cereales el fundamental de largo plazo (una cosecha corta) y el movimiento del día (falta de demanda puntual) pueden tirar en direcciones distintas.',
          sources: [{ label: 'Farm Progress (22 may 2026)', url: SRC.farmprogress }, { label: 'Rio Times (21 sep 2026)', url: SRC.riotimes }]
        },
        {
          category: CAT.es.lacteos, date: '2026-09-28', dateLabel: '28 sep 2026',
          title: 'España: los ganaderos piden subir el precio de la leche antes de octubre',
          para1: 'Unión de Uniones, una de las principales organizaciones agrarias españolas, ha pedido a los ganaderos de vacuno de leche que exijan una subida de precio al renovar sus contratos, con la mayoría de las renovaciones concentradas en los primeros días de octubre — el momento clave de negociación del año para el sector. La petición se apoya en la Ley de la Cadena Alimentaria, que prohíbe vender por debajo del coste de producción; la organización pide que el precio en origen cubra ese coste, que incluye desde el pienso hasta la energía y la mano de obra.',
          para2: 'La presión es mayor en Galicia, Asturias, Cantabria y Castilla y León, donde la ganadería de leche sostiene buena parte de la economía rural: cobrar por debajo de coste, explican, reduce el margen, frena la inversión y, a la larga, empuja al abandono de explotaciones. El artículo no da una cifra concreta de precio objetivo, y Dehesa Index tampoco tiene un dato de precio pagado verificado para esta fecha — así que aquí se recoge la petición, no una cifra de precio confirmada.',
          sources: [{ label: 'Moncloa.com (26 sep 2026)', url: SRC.moncloa }]
        }
      ]
    };
    STRINGS.en = {
      title: 'Blog: what moves farm markets | Dehesa Index', badge: 'REAL NOTES', updated: 'Updated Nov 9, 2026',
      h1: 'Blog',
      sub: "Short context on what's moving these markets this week, with real figures and sources — not a headline roundup, but Dehesa Index's own read on what's behind them.",
      disclaimer: 'Each note cites real, dated facts, verifiable at the sources linked below. When a specific figure isn’t available (a target price not yet published, say), that’s stated outright rather than estimated.',
      posts: [
        {
          category: CAT.en.porcino, date: '2026-11-09', dateLabel: 'Nov 9, 2026',
          title: 'Pig prices keep sliding on both sides of the Atlantic',
          para1: 'In Spain, the class S pig carcass price — the Spanish reference published by the European Commission and tracked by Dehesa Index — stood at €160.25/100 kg in the week of November 1: its sixth weekly drop in a row and 10.3% below the €178.56 of September 20. Livestock exchanges tell the same story for live pigs: in Segovia, top-grade pigs closed the November 5 session at €1.147/kg, 3.5 cents down on the week and 21 cents below September 17 (€1.357/kg), while 20 kg piglets fell to €35 a head. The Agronews Castilla y León market report describes a downward trend running since October but does not pin the drop on a specific cause, and neither do we here. Iberian pigs bucked the trend: in Salamanca they rose 10 cents, with free-range finished pigs at €3.16/kg.',
          para2: 'In the United States the correction is sharper. The USDA\'s negotiated base carcass price (report LM_HG201) fell from $78.79/cwt on October 5 to $63.66 on November 6, down 19.2% in a month, and that same day December lean hog futures in Chicago settled at 55.10 cents per pound after hitting a contract low of 54.225. Traders cited by Reuters blame poor demand for pork and plentiful hog supplies, with heavier carcasses: an average of 293.5 lb in the week ending October 31, against 291.6 a year earlier. On the export side, net sales for the latest week came to 37,300 tonnes, 12% less than the week before, with Mexico taking about 45%. For finishers, who bought piglets and feed months ago, the drop shows up first in margins; this describes what has happened and is not a forecast of where prices will go.',
          sources: [{ label: 'Agronews Castilla y León (Nov 7, 2026)', url: SRC.agronewscyl }, { label: 'The Pig Site (Nov 6, 2026)', url: SRC.pigsitecme }, { label: 'The Pig Site, weekly report (Nov 6, 2026)', url: SRC.pigsiteweekly }]
        },
        {
          category: CAT.en.energia, date: '2026-10-21', dateLabel: 'Oct 21, 2026',
          title: 'From oil to fertilizer: the energy bill reaches the farm',
          para1: 'The Brent spot price published by the EIA closed at $127.43/barrel on October 9, up 28.6% from five weeks earlier; U.S. WTI rose far less ($96.88, +6.3%). Behind it is the conflict in the Middle East: in its October 6 outlook, the EIA expects the region\'s crude flows to stay constrained through the fourth quarter and puts Brent at an average of $105/barrel for that period. Diesel is the tightest link: the U.S. average retail price was $6.29/gallon in September, with East Coast distillate inventories 32% below their five-year average. In the EU the rise is slower for now: the Oil Bulletin puts diesel at €2.14/litre on October 12, up 1.3% in five weeks.',
          para2: 'Energy also reaches farmers through nitrogen fertilizer, which is made from gas. According to the S&P Global Institute, about 29% of global urea trade and around 21% of traded ammonia normally pass through the Strait of Hormuz. In DTN\'s survey for the first week of October, U.S. retail urea cost $672/ton (12% more than a year ago) and anhydrous ammonia $977 (+20%); in the World Bank data Dehesa Index tracks, urea stood at $407.5/t in September (+4.5% on the month) and natural gas in Europe rose 20% that same month. As S&P points out, farmers buy seed, fertilizer and fuel months before they sell a crop, so the hit shows up in margins first: the authors think it may not reach food prices in force until 2027 — their reading, not a Dehesa Index forecast.',
          sources: [{ label: 'EIA (Oct 6, 2026)', url: SRC.eiasteo }, { label: 'DTN (Oct 14, 2026)', url: SRC.dtnfert }, { label: 'S&P Global (Oct 19, 2026)', url: SRC.spglobal }]
        },
        {
          category: CAT.en.cereales, date: '2026-09-28', dateLabel: 'Sep 28, 2026',
          title: 'Why wheat is expensive this marketing year',
          para1: 'The U.S. winter wheat harvest for 2026-27 came in at 1.048 billion bushels — 25% below the previous year and the smallest since 1965, according to the USDA. Drought hit western Kansas, eastern Colorado and the Panhandle hard: Kansas yields fell to 37 bushels per acre, down from 51 in 2025, and the hardest-hit variety (hard red winter wheat) dropped 36%. The USDA projects the average farm price will rise to $6.50/bushel in 2026-27, up $1.50 from the year before — though U.S. exports are expected to fall 15%, since the higher price itself makes American wheat less competitive against other exporters.',
          para2: "Day to day, though, the market doesn't move in a straight line: on September 18, wheat, corn and soybeans all closed lower (wheat -1.45%, corn -0.66%, soybeans -1.04%) after the USDA cut its Kansas corn forecast by 39 million bushels with no fresh Chinese buying to offset it — a reminder that in grains, the long-run fundamental (a short crop) and the day's move (a lack of buyers) can pull in opposite directions.",
          sources: [{ label: 'Farm Progress (May 22, 2026)', url: SRC.farmprogress }, { label: 'Rio Times (Sep 21, 2026)', url: SRC.riotimes }]
        },
        {
          category: CAT.en.lacteos, date: '2026-09-28', dateLabel: 'Sep 28, 2026',
          title: 'Spain: dairy farmers push for higher milk prices ahead of October',
          para1: "Unión de Uniones, one of Spain's main farming associations, has urged dairy cattle farmers to demand higher prices when renewing their contracts, most of which come up in the first days of October — the sector's key negotiating moment of the year. The request leans on Spain's Food Chain Law, which bans selling below production cost; the group is asking that the farm-gate price cover that cost, from feed to energy to labor.",
          para2: "The pressure is greatest in Galicia, Asturias, Cantabria and Castilla y León, where dairy farming underpins much of the rural economy: selling below cost, the group argues, squeezes margins, discourages investment and, over time, pushes farms to close. The article doesn't give a specific target price, and Dehesa Index doesn't have a verified paid price for this date either — so what's recorded here is the request itself, not a confirmed price figure.",
          sources: [{ label: 'Moncloa.com (Sep 26, 2026)', url: SRC.moncloa }]
        }
      ]
    };
    STRINGS.fr = {
      title: 'Blog : ce qui fait bouger les marchés agricoles | Dehesa Index', badge: 'NOTES RÉELLES', updated: 'Mis à jour le 9 nov. 2026',
      h1: 'Blog',
      sub: "Un contexte court sur ce qui fait bouger ces marchés cette semaine, avec des chiffres et des sources réels — pas un résumé de titres, mais la lecture de Dehesa Index sur ce qu'il y a derrière.",
      disclaimer: "Chaque note cite des faits réels et datés, vérifiables sur les sources indiquées ci-dessous. Quand un chiffre précis n'est pas disponible (un prix cible pas encore publié, par exemple), cela est dit explicitement plutôt qu'estimé.",
      posts: [
        {
          category: CAT.fr.porcino, date: '2026-11-09', dateLabel: '9 nov. 2026',
          title: 'Le porc enchaîne les semaines de baisse des deux côtés de l’Atlantique',
          para1: 'En Espagne, la carcasse de porc de classe S — la référence espagnole publiée par la Commission européenne et suivie par Dehesa Index — s’est établie à 160,25 €/100 kg la semaine du 1er novembre : c’est la sixième baisse hebdomadaire d’affilée, soit 10,3 % de moins que les 178,56 € du 20 septembre. Les marchés au cadran racontent la même chose pour le porc vif : à Ségovie, le porc « selecto » a clôturé la séance du 5 novembre à 1,147 €/kg, 3,5 centimes de moins que la semaine précédente et 21 centimes sous son niveau du 17 septembre (1,357 €/kg), tandis que le porcelet de 20 kg est descendu à 35 € pièce. La chronique d’Agronews Castilla y León évoque une tendance baissière entamée en octobre sans l’attribuer à une cause précise, et nous ne lui en prêtons pas non plus. Le porc ibérique va à contre-courant : à Salamanque, il a gagné 10 centimes, le « cebo de campo » s’établissant à 3,16 €/kg.',
          para2: 'Aux États-Unis, l’ajustement est plus brutal. Le prix de base de la carcasse en achat direct publié par l’USDA (rapport LM_HG201) est passé de 78,79 $/cwt le 5 octobre à 63,66 $ le 6 novembre, soit 19,2 % de moins en un mois, et le même jour le contrat à terme de porc maigre de décembre à Chicago a clôturé à 55,10 cents la livre, après un plus bas de contrat à 54,225. Les opérateurs cités par Reuters l’attribuent à une demande de viande porcine faible et à une offre abondante d’animaux, avec des carcasses plus lourdes : 293,5 livres en moyenne la semaine close le 31 octobre, contre 291,6 un an plus tôt. À l’export, les ventes nettes de la dernière semaine ont atteint 37 300 tonnes, 12 % de moins que la semaine précédente, le Mexique en absorbant environ 45 %. Pour l’engraisseur, qui a acheté porcelets et aliments des mois plus tôt, la baisse se lit d’abord dans la marge ; il s’agit d’un constat, pas d’une prévision sur l’évolution des prix.',
          sources: [{ label: 'Agronews Castilla y León (7 nov. 2026)', url: SRC.agronewscyl }, { label: 'The Pig Site (6 nov. 2026)', url: SRC.pigsitecme }, { label: 'The Pig Site, rapport hebdomadaire (6 nov. 2026)', url: SRC.pigsiteweekly }]
        },
        {
          category: CAT.fr.energia, date: '2026-10-21', dateLabel: '21 oct. 2026',
          title: 'Du pétrole aux engrais : la facture énergétique arrive à la ferme',
          para1: 'Le prix spot du Brent publié par l\'EIA a clôturé à 127,43 $/baril le 9 octobre, soit 28,6 % de plus que cinq semaines plus tôt ; le WTI américain a bien moins progressé (96,88 $, +6,3 %). En toile de fond, le conflit au Moyen-Orient : dans ses prévisions du 6 octobre, l\'EIA s\'attend à ce que les flux de brut de la région restent limités au quatrième trimestre et situe le Brent à 105 $/baril en moyenne sur cette période. Le gazole est le maillon le plus tendu : aux États-Unis, le prix moyen à la pompe a atteint 6,29 $/gallon en septembre, avec des stocks de distillats de la côte Est inférieurs de 32 % à leur moyenne sur cinq ans. Dans l\'UE, la hausse est pour l\'instant plus lente : le Bulletin pétrolier situe le gazole à 2,14 €/litre le 12 octobre, en hausse de 1,3 % en cinq semaines.',
          para2: 'L\'énergie arrive aussi chez l\'agriculteur par les engrais azotés, fabriqués à partir de gaz. Selon le S&P Global Institute, environ 29 % du commerce mondial d\'urée et quelque 21 % de l\'ammoniac échangé transitent normalement par le détroit d\'Ormuz. Dans l\'enquête DTN de la première semaine d\'octobre, l\'urée au détail coûtait 672 $/tonne aux États-Unis (12 % de plus qu\'il y a un an) et l\'ammoniac anhydre 977 $ (+20 %) ; dans les données de la Banque mondiale suivies par Dehesa Index, l\'urée s\'établissait à 407,5 $/t en septembre (+4,5 % sur le mois) et le gaz naturel en Europe a augmenté de 20 % le même mois. Comme le rappelle S&P, les agriculteurs achètent semences, engrais et carburant des mois avant de vendre leur récolte : le choc se voit d\'abord dans les marges, et les auteurs estiment qu\'il pourrait ne toucher pleinement les prix alimentaires qu\'en 2027 — leur lecture, pas une prévision de Dehesa Index.',
          sources: [{ label: 'EIA (6 oct. 2026)', url: SRC.eiasteo }, { label: 'DTN (14 oct. 2026)', url: SRC.dtnfert }, { label: 'S&P Global (19 oct. 2026)', url: SRC.spglobal }]
        },
        {
          category: CAT.fr.cereales, date: '2026-09-28', dateLabel: '28 sept. 2026',
          title: 'Pourquoi le blé coûte cher cette campagne',
          para1: "La récolte de blé d'hiver américaine 2026-27 s'est établie à 1,048 milliard de boisseaux — 25 % de moins que l'année précédente et la plus faible depuis 1965, selon l'USDA. La sécheresse a durement touché l'ouest du Kansas, l'est du Colorado et le Panhandle : au Kansas, le rendement est tombé à 37 boisseaux par acre, contre 51 en 2025, et la variété la plus touchée (blé roux d'hiver dur) a chuté de 36 %. L'USDA prévoit que le prix moyen à la production grimpe à 6,50 $/boisseau en 2026-27, soit 1,50 $ de plus que l'année précédente — même si les exportations américaines devraient reculer de 15 %, la hausse des prix rendant le blé américain moins compétitif face aux autres exportateurs.",
          para2: "Au jour le jour, pourtant, le marché ne monte pas en ligne droite : le 18 septembre, blé, maïs et soja ont tous clôturé en baisse (blé -1,45 %, maïs -0,66 %, soja -1,04 %) après que l'USDA a réduit sa prévision de maïs au Kansas de 39 millions de boisseaux, sans achats chinois pour compenser — un rappel que, sur les céréales, le fondamental de long terme (une récolte courte) et le mouvement du jour (un manque d'acheteurs) peuvent tirer en sens opposés.",
          sources: [{ label: 'Farm Progress (22 mai 2026)', url: SRC.farmprogress }, { label: 'Rio Times (21 sept. 2026)', url: SRC.riotimes }]
        },
        {
          category: CAT.fr.lacteos, date: '2026-09-28', dateLabel: '28 sept. 2026',
          title: 'Espagne : les éleveurs laitiers réclament une hausse du prix du lait avant octobre',
          para1: "Unión de Uniones, l'une des principales organisations agricoles espagnoles, a appelé les éleveurs laitiers à exiger une hausse de prix lors du renouvellement de leurs contrats, dont la plupart arrivent à échéance dans les premiers jours d'octobre — le moment de négociation clé de l'année pour la filière. La demande s'appuie sur la loi espagnole de la chaîne alimentaire, qui interdit de vendre en dessous du coût de production ; l'organisation demande que le prix départ ferme couvre ce coût, de l'alimentation animale à l'énergie en passant par la main-d'œuvre.",
          para2: "La pression est la plus forte en Galice, dans les Asturies, en Cantabrie et à Castille-et-León, où l'élevage laitier fait vivre une bonne partie de l'économie rurale : vendre en dessous du coût, selon l'organisation, réduit les marges, freine l'investissement et pousse, à terme, à l'abandon des exploitations. L'article ne donne pas de prix cible précis, et Dehesa Index ne dispose pas non plus d'un prix payé vérifié à cette date — ce qui est rapporté ici est donc la demande elle-même, pas un chiffre de prix confirmé.",
          sources: [{ label: 'Moncloa.com (26 sept. 2026)', url: SRC.moncloa }]
        }
      ]
    };
    STRINGS.it = {
      title: 'Blog: cosa muove i mercati agricoli | Dehesa Index', badge: 'NOTE REALI', updated: 'Aggiornato 9 nov 2026',
      h1: 'Blog',
      sub: 'Un contesto breve su cosa muove questi mercati questa settimana, con cifre e fonti reali — non un riassunto di titoli, ma la lettura di Dehesa Index su cosa c’è dietro.',
      disclaimer: 'Ogni nota cita fatti reali e datati, verificabili nelle fonti collegate in fondo. Quando un dato preciso non è disponibile (un prezzo obiettivo non ancora pubblicato, ad esempio), questo viene dichiarato esplicitamente invece di essere stimato.',
      posts: [
        {
          category: CAT.it.porcino, date: '2026-11-09', dateLabel: '9 nov 2026',
          title: 'Il suino continua a scendere su entrambe le sponde dell’Atlantico',
          para1: 'In Spagna la carcassa suina di classe S — il riferimento spagnolo pubblicato dalla Commissione europea e seguito da Dehesa Index — ha quotato 160,25 €/100 kg nella settimana del 1° novembre: è il sesto calo settimanale di fila e il 10,3% in meno rispetto ai 178,56 € del 20 settembre. Le borse merci raccontano lo stesso per il suino vivo: a Segovia il suino «selecto» ha chiuso la seduta del 5 novembre a 1,147 €/kg, 3,5 centesimi in meno della settimana precedente e 21 centesimi sotto il 17 settembre (1,357 €/kg), mentre il lattonzolo da 20 kg è sceso a 35 € a capo. La cronaca di Agronews Castilla y León parla di una tendenza al ribasso iniziata a ottobre, ma non la attribuisce a una causa precisa, e nemmeno noi lo facciamo qui. Il suino iberico va in controtendenza: a Salamanca è salito di 10 centesimi, con il «cebo de campo» a 3,16 €/kg.',
          para2: 'Negli Stati Uniti la correzione è più brusca. Il prezzo base della carcassa in acquisto diretto pubblicato dall’USDA (rapporto LM_HG201) è sceso da 78,79 $/cwt il 5 ottobre a 63,66 $ il 6 novembre, il 19,2% in meno in un mese, e lo stesso giorno il future sul suino magro di dicembre a Chicago ha chiuso a 55,10 centesimi per libbra, dopo aver toccato un minimo di contratto a 54,225. Gli operatori citati da Reuters lo attribuiscono alla domanda debole di carne suina e all’ampia offerta di capi, con carcasse più pesanti: 293,5 libbre di media nella settimana chiusa il 31 ottobre, contro 291,6 un anno prima. Sul fronte export, le vendite nette dell’ultima settimana sono state 37.300 tonnellate, il 12% in meno della settimana precedente, con il Messico a circa il 45%. Per l’ingrassatore, che ha comprato lattonzoli e mangime mesi prima, il calo si vede prima di tutto nel margine; è una descrizione di quanto accaduto, non una previsione su dove andranno i prezzi.',
          sources: [{ label: 'Agronews Castilla y León (7 nov 2026)', url: SRC.agronewscyl }, { label: 'The Pig Site (6 nov 2026)', url: SRC.pigsitecme }, { label: 'The Pig Site, rapporto settimanale (6 nov 2026)', url: SRC.pigsiteweekly }]
        },
        {
          category: CAT.it.energia, date: '2026-10-21', dateLabel: '21 ott 2026',
          title: 'Dal petrolio ai concimi: la bolletta energetica arriva nei campi',
          para1: 'Il prezzo spot del Brent pubblicato dall\'EIA ha chiuso il 9 ottobre a 127,43 $/barile, il 28,6% in più rispetto a cinque settimane prima; il WTI statunitense è salito molto meno (96,88 $, +6,3%). Dietro c\'è il conflitto in Medio Oriente: nelle previsioni del 6 ottobre, l\'EIA si aspetta che i flussi di greggio della regione restino limitati nel quarto trimestre e colloca il Brent a una media di 105 $/barile in quel periodo. Il gasolio è l\'anello più teso: negli Stati Uniti il prezzo medio al dettaglio è stato di 6,29 $/gallone a settembre, con le scorte di distillati della costa orientale del 32% sotto la media quinquennale. Nell\'UE il rialzo per ora è più lento: il Bollettino petrolifero indica il gasolio a 2,14 €/litro il 12 ottobre, +1,3% in cinque settimane.',
          para2: 'L\'energia arriva all\'agricoltore anche attraverso i concimi azotati, prodotti dal gas. Secondo lo S&P Global Institute, dallo stretto di Hormuz passa normalmente circa il 29% del commercio mondiale di urea e intorno al 21% dell\'ammoniaca scambiata. Nell\'indagine DTN della prima settimana di ottobre, l\'urea al dettaglio negli Stati Uniti costava 672 $/tonnellata (il 12% in più di un anno fa) e l\'ammoniaca anidra 977 $ (+20%); nei dati della Banca Mondiale seguiti da Dehesa Index, l\'urea era a 407,5 $/t a settembre (+4,5% sul mese) e il gas naturale in Europa è salito del 20% nello stesso mese. Come ricorda S&P, gli agricoltori comprano sementi, concimi e carburante mesi prima di vendere il raccolto, quindi il colpo si vede prima nei margini: secondo gli autori potrebbe non arrivare con forza ai prezzi alimentari prima del 2027 — una loro lettura, non una previsione di Dehesa Index.',
          sources: [{ label: 'EIA (6 ott 2026)', url: SRC.eiasteo }, { label: 'DTN (14 ott 2026)', url: SRC.dtnfert }, { label: 'S&P Global (19 ott 2026)', url: SRC.spglobal }]
        },
        {
          category: CAT.it.cereales, date: '2026-09-28', dateLabel: '28 set 2026',
          title: 'Perché il grano costa caro in questa campagna',
          para1: "Il raccolto di grano invernale statunitense 2026-27 si è fermato a 1,048 miliardi di bushel — il 25% in meno rispetto all'anno precedente e il più basso dal 1965, secondo l'USDA. La siccità ha colpito duramente il Kansas occidentale, il Colorado orientale e il Panhandle: in Kansas la resa è scesa a 37 bushel per acro, da 51 nel 2025, e la varietà più colpita (grano rosso invernale duro) è calata del 36%. L'USDA prevede che il prezzo medio all'origine salga a 6,50 $/bushel nella campagna 2026-27, 1,50 $ in più rispetto all'anno precedente — anche se le esportazioni statunitensi dovrebbero calare del 15%, perché il rincaro stesso rende il grano americano meno competitivo rispetto agli altri paesi esportatori.",
          para2: "Nel breve termine, però, il mercato non sale in linea retta: il 18 settembre grano, mais e soia hanno chiuso tutti in ribasso (grano -1,45%, mais -0,66%, soia -1,04%) dopo che l'USDA ha tagliato la previsione sul mais del Kansas di 39 milioni di bushel senza nuovi acquisti cinesi a compensare — un promemoria che, nei cereali, il fondamentale di lungo periodo (un raccolto scarso) e il movimento del giorno (la mancanza di acquirenti) possono tirare in direzioni opposte.",
          sources: [{ label: 'Farm Progress (22 mag 2026)', url: SRC.farmprogress }, { label: 'Rio Times (21 set 2026)', url: SRC.riotimes }]
        },
        {
          category: CAT.it.lacteos, date: '2026-09-28', dateLabel: '28 set 2026',
          title: 'Spagna: gli allevatori chiedono un aumento del prezzo del latte prima di ottobre',
          para1: "Unión de Uniones, una delle principali associazioni agricole spagnole, ha invitato gli allevatori da latte a chiedere prezzi più alti nel rinnovo dei contratti, la maggior parte dei quali scade nei primi giorni di ottobre — il momento chiave di trattativa dell'anno per il settore. La richiesta si basa sulla legge spagnola della filiera alimentare, che vieta di vendere sotto il costo di produzione; l'organizzazione chiede che il prezzo all'origine copra quel costo, dal mangime all'energia fino alla manodopera.",
          para2: "La pressione è maggiore in Galizia, Asturie, Cantabria e Castiglia e León, dove l'allevamento da latte sostiene buona parte dell'economia rurale: vendere sotto costo, sostiene l'organizzazione, riduce i margini, scoraggia gli investimenti e, nel tempo, spinge alla chiusura delle aziende. L'articolo non fornisce una cifra di prezzo obiettivo precisa, e nemmeno Dehesa Index dispone di un prezzo pagato verificato per questa data — quindi qui si riporta la richiesta in sé, non una cifra di prezzo confermata.",
          sources: [{ label: 'Moncloa.com (26 set 2026)', url: SRC.moncloa }]
        }
      ]
    };
    return STRINGS;
  }
  var STRINGS = buildStrings();
  /* Suscripción por correo: queda apagada hasta que se rellene DehesaShared.newsletter (js/shared.js: action y provider) con el servicio elegido
     (Buttondown, MailerLite, Mailchimp…). Sin ella no se muestra nada: la web no guarda correos por sí misma. */
  var NL = {
    es: { h: 'Recibe cada artículo por correo', p: 'Escribe tu email y te llegará cada entrada nueva del blog. Puedes darte de baja cuando quieras.', ph: 'tu@email.com', ok: 'Acepto recibir el blog por correo y la política de privacidad.', btn: 'Suscribirme', lbl: 'Correo electrónico', pv: 'Aviso legal y privacidad' },
    en: { h: 'Get every article by email', p: 'Enter your email and each new blog post will reach you. You can unsubscribe at any time.', ph: 'you@email.com', ok: 'I agree to receive the blog by email and to the privacy policy.', btn: 'Subscribe', lbl: 'Email address', pv: 'Legal notice and privacy' },
    fr: { h: 'Recevez chaque article par e-mail', p: 'Saisissez votre e-mail et chaque nouvel article vous parviendra. Vous pouvez vous désabonner à tout moment.', ph: 'vous@email.com', ok: 'J’accepte de recevoir le blog par e-mail et la politique de confidentialité.', btn: 'S’abonner', lbl: 'Adresse e-mail', pv: 'Mentions légales et confidentialité' },
    it: { h: 'Ricevi ogni articolo via email', p: 'Inserisci la tua email e riceverai ogni nuovo articolo del blog. Puoi disiscriverti quando vuoi.', ph: 'tu@email.com', ok: 'Accetto di ricevere il blog via email e l’informativa sulla privacy.', btn: 'Iscriviti', lbl: 'Indirizzo email', pv: 'Note legali e privacy' }
  };
  function subscribeBox(lang, esc) {
    var NEWSLETTER_ACTION = window.DehesaShared.newsletter.action; if (!/^https:\/\//.test(NEWSLETTER_ACTION) || !window.DehesaShared.newsletter.provider) return '';
    var n = NL[lang] || NL.es;
    return '<form class="di-card di-blog-sub" method="post" action="' + esc(NEWSLETTER_ACTION) + '" target="_blank" style="padding:14px 16px;margin:0 0 16px"><h2 style="margin:0 0 4px;font-size:16px">' + esc(n.h) + '</h2><p class="di-movers-hint" style="margin:0 0 8px">' + esc(n.p) + '</p>' +
      '<label for="bl-email" class="di-movers-hint" style="display:block">' + esc(n.lbl) + '</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="bl-email" name="email" type="email" required autocomplete="email" placeholder="' + esc(n.ph) + '" style="flex:1 1 220px;min-width:0;padding:9px 10px;border:1px solid var(--border);border-radius:8px;font:inherit"><button type="submit" class="di-src-tab" style="flex:0 0 auto">' + esc(n.btn) + '</button></div>' +
      '<label class="di-movers-hint" style="display:block;margin-top:8px"><input type="checkbox" required> ' + esc(n.ok) + ' <a href="legal.html">' + esc(n.pv) + '</a></label></form>';
  }

  function render() {
    var lang = window.DehesaShared.getLang();
    var esc = window.DehesaShared.esc;
    var t = STRINGS[lang] || STRINGS.es;

    document.title = t.title;
    document.getElementById('bl-badge').textContent = t.badge;
    document.getElementById('bl-updated').textContent = t.updated;
    document.getElementById('bl-h1').textContent = t.h1;
    document.getElementById('bl-sub').textContent = t.sub;
    document.getElementById('bl-disclaimer').textContent = t.disclaimer;

    document.getElementById('bl-posts').innerHTML = subscribeBox(lang, esc) + t.posts.map(function (post) {
      var sourcesHtml = post.sources.map(function (s) {
        return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.label) + ' ↗</a>';
      }).join('');
      return '<article class="di-card di-blog-post">' +
        '<div class="di-blog-post-meta"><span class="di-blog-post-cat">' + esc(post.category) + '</span><span class="di-blog-post-date">' + esc(post.dateLabel) + '</span></div>' +
        '<h2 class="di-blog-post-title">' + esc(post.title) + '</h2>' +
        '<p class="di-blog-post-para">' + esc(post.para1) + '</p>' +
        '<p class="di-blog-post-para">' + esc(post.para2) + '</p>' +
        '<div class="di-blog-post-sources">' + sourcesHtml + '</div>' +
      '</article>';
    }).join('');
  }

  window.DehesaShared.init('blog');
  window.DehesaShared.onLangChange = render;
  render();
})();
