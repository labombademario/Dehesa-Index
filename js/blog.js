/* Dehesa Index — Blog */
(function () {
  'use strict';

  // Fuentes reales citadas en las notas -- mismo criterio de honestidad que
  // Noticias/Calendario: enlaces verificables, nada inventado.
  var SRC = {
    farmprogress: 'https://www.farmprogress.com/marketing/usda-forecasts-smallest-us-winter-wheat-crop-since-1965-as-drought-devastates-key-growing-regions-in-the-plains',
    riotimes: 'https://www.riotimesonline.com/grains-soy-corn-latam-monday-september-21-2026/',
    dtn: 'https://www.dtnpf.com/agriculture/web/ag/crops/article/2026/09/23/fertilizer-prices-rise-six-eight',
    moncloa: 'https://www.moncloa.com/2026/09/26/contratos-leche-vacuno-revision-alza-precios-3438213/'
  };

  // Categorías: mismas etiquetas que el resto del sitio para el mismo grupo
  // de producto (Precios, Dehesa Market Map).
  var CAT = {
    es: { cereales: 'Cereales', fertilizantes: 'Fertilizantes', lacteos: 'Lácteos' },
    en: { cereales: 'Grains', fertilizantes: 'Fertilizer', lacteos: 'Dairy' },
    fr: { cereales: 'Céréales', fertilizantes: 'Engrais', lacteos: 'Produits laitiers' },
    it: { cereales: 'Cereali', fertilizantes: 'Fertilizzanti', lacteos: 'Lattiero-caseario' }
  };

  function buildStrings() {
    var STRINGS = {};
    var langCat = {};
    Object.keys(CAT).forEach(function (lg) { langCat[lg] = CAT[lg]; });

    STRINGS.es = {
      title: 'Dehesa Index — Blog', badge: 'NOTAS REALES', updated: 'Actualizado 28 sep 2026',
      h1: 'Blog',
      sub: 'Contexto corto sobre qué mueve estos mercados esta semana, con cifras y fuentes reales — no un resumen de titulares, sino la lectura de Dehesa Index sobre lo que hay detrás.',
      disclaimer: 'Cada nota cita datos y fechas reales, verificables en las fuentes enlazadas al pie. Cuando un dato concreto no está disponible (por ejemplo, un precio objetivo aún no publicado), se dice explícitamente en vez de estimarlo.',
      posts: [
        {
          category: CAT.es.cereales, dateLabel: '22 may 2026 · 21 sep 2026',
          title: 'Por qué el trigo llega caro a esta campaña',
          para1: 'La cosecha de trigo de invierno de EE. UU. para 2026-27 se quedó en 1.048 millones de bushels — un 25% menos que el año anterior y la más pequeña desde 1965, según el USDA. La sequía golpeó con fuerza el oeste de Kansas, el este de Colorado y el Panhandle: en Kansas el rendimiento cayó a 37 bushels por acre, desde 51 en 2025, y la variedad más afectada (trigo duro rojo de invierno) bajó un 36%. El USDA proyecta que el precio medio en origen suba a 6,50 $/bushel en la campaña 2026-27, 1,50 $ más que el año anterior — aunque las exportaciones estadounidenses se prevén un 15% más bajas, porque el propio encarecimiento resta competitividad frente a otros exportadores.',
          para2: 'En el día a día, sin embargo, el mercado no sube en línea recta: el 18 de septiembre trigo, maíz y soja cerraron a la baja (trigo -1,45%, maíz -0,66%, soja -1,04%) después de que el USDA recortara la previsión de maíz en Kansas en 39 millones de bushels sin que China saliera a comprar para compensar — un recordatorio de que en cereales el fundamental de largo plazo (una cosecha corta) y el movimiento del día (falta de demanda puntual) pueden tirar en direcciones distintas.',
          sources: [{ label: 'Farm Progress', url: SRC.farmprogress }, { label: 'Rio Times', url: SRC.riotimes }]
        },
        {
          category: CAT.es.fertilizantes, dateLabel: '23 sep 2026',
          title: 'Potasa de Bielorrusia: mucho ruido, poco movimiento (todavía)',
          para1: 'En la semana del 14 al 18 de septiembre, seis de los ocho fertilizantes que sigue DTN subieron de precio en EE. UU. y solo dos bajaron, aunque ningún movimiento superó el 5% que DTN considera "significativo". La urea cerró en 659 $/tonelada (ligeramente por debajo del mes anterior, pero un 6% por encima de hace un año) y el DAP en 925 $/tonelada (un 2% por encima de hace un año); el anhidro fue el que más subió interanualmente, un 22%.',
          para2: 'La atención del mercado está puesta en una posible importación de potasa desde Bielorrusia, planteada por la administración Trump — pero el analista Josh Linville lo resume así: "necesitamos ayuda con fósforo y nitrógeno", no con potasa, que no es hoy el nutriente más escaso. Además, la ruta logística tendría que pasar por Lituania, Letonia, Polonia y Ucrania, con las complicaciones que eso implica. Por ahora, más un titular que un cambio real de precios.',
          sources: [{ label: 'DTN Progressive Farmer', url: SRC.dtn }]
        },
        {
          category: CAT.es.lacteos, dateLabel: '26 sep 2026',
          title: 'España: los ganaderos piden subir el precio de la leche antes de octubre',
          para1: 'Unión de Uniones, una de las principales organizaciones agrarias españolas, ha pedido a los ganaderos de vacuno de leche que exijan una subida de precio al renovar sus contratos, con la mayoría de las renovaciones concentradas en los primeros días de octubre — el momento clave de negociación del año para el sector. La petición se apoya en la Ley de la Cadena Alimentaria, que prohíbe vender por debajo del coste de producción; la organización pide que el precio en origen cubra ese coste, que incluye desde el pienso hasta la energía y la mano de obra.',
          para2: 'La presión es mayor en Galicia, Asturias, Cantabria y Castilla y León, donde la ganadería de leche sostiene buena parte de la economía rural: cobrar por debajo de coste, explican, reduce el margen, frena la inversión y, a la larga, empuja al abandono de explotaciones. El artículo no da una cifra concreta de precio objetivo, y Dehesa Index tampoco tiene un dato de precio pagado verificado para esta fecha — así que aquí se recoge la petición, no una cifra de precio confirmada.',
          sources: [{ label: 'Moncloa.com', url: SRC.moncloa }]
        }
      ]
    };
    STRINGS.en = {
      title: 'Dehesa Index — Blog', badge: 'REAL NOTES', updated: 'Updated Sep 28, 2026',
      h1: 'Blog',
      sub: "Short context on what's moving these markets this week, with real figures and sources — not a headline roundup, but Dehesa Index's own read on what's behind them.",
      disclaimer: 'Each note cites real, dated facts, verifiable at the sources linked below. When a specific figure isn’t available (a target price not yet published, say), that’s stated outright rather than estimated.',
      posts: [
        {
          category: CAT.en.cereales, dateLabel: 'May 22, 2026 · Sep 21, 2026',
          title: 'Why wheat is expensive this marketing year',
          para1: 'The U.S. winter wheat harvest for 2026-27 came in at 1.048 billion bushels — 25% below the previous year and the smallest since 1965, according to the USDA. Drought hit western Kansas, eastern Colorado and the Panhandle hard: Kansas yields fell to 37 bushels per acre, down from 51 in 2025, and the hardest-hit variety (hard red winter wheat) dropped 36%. The USDA projects the average farm price will rise to $6.50/bushel in 2026-27, up $1.50 from the year before — though U.S. exports are expected to fall 15%, since the higher price itself makes American wheat less competitive against other exporters.',
          para2: "Day to day, though, the market doesn't move in a straight line: on September 18, wheat, corn and soybeans all closed lower (wheat -1.45%, corn -0.66%, soybeans -1.04%) after the USDA cut its Kansas corn forecast by 39 million bushels with no fresh Chinese buying to offset it — a reminder that in grains, the long-run fundamental (a short crop) and the day's move (a lack of buyers) can pull in opposite directions.",
          sources: [{ label: 'Farm Progress', url: SRC.farmprogress }, { label: 'Rio Times', url: SRC.riotimes }]
        },
        {
          category: CAT.en.fertilizantes, dateLabel: 'Sep 23, 2026',
          title: 'Belarusian potash: plenty of noise, not much movement (yet)',
          para1: 'In the week of September 14-18, six of the eight fertilizers DTN tracks rose in the U.S. and only two fell, though no move topped the 5% DTN considers "significant." Urea closed at $659/ton (slightly below the prior month, but 6% above a year ago) and DAP at $925/ton (2% above a year ago); anhydrous posted the largest year-over-year gain, up 22%.',
          para2: 'Markets are watching a possible potash import deal with Belarus, floated by the Trump administration — but analyst Josh Linville put it plainly: "We need help on phosphate and nitrogen," not potash, which isn’t today’s scarce nutrient. The shipping route would also have to run through Lithuania, Latvia, Poland and Ukraine, with all the complications that implies. For now, more of a headline than an actual price shift.',
          sources: [{ label: 'DTN Progressive Farmer', url: SRC.dtn }]
        },
        {
          category: CAT.en.lacteos, dateLabel: 'Sep 26, 2026',
          title: 'Spain: dairy farmers push for higher milk prices ahead of October',
          para1: "Unión de Uniones, one of Spain's main farming associations, has urged dairy cattle farmers to demand higher prices when renewing their contracts, most of which come up in the first days of October — the sector's key negotiating moment of the year. The request leans on Spain's Food Chain Law, which bans selling below production cost; the group is asking that the farm-gate price cover that cost, from feed to energy to labor.",
          para2: "The pressure is greatest in Galicia, Asturias, Cantabria and Castilla y León, where dairy farming underpins much of the rural economy: selling below cost, the group argues, squeezes margins, discourages investment and, over time, pushes farms to close. The article doesn't give a specific target price, and Dehesa Index doesn't have a verified paid price for this date either — so what's recorded here is the request itself, not a confirmed price figure.",
          sources: [{ label: 'Moncloa.com', url: SRC.moncloa }]
        }
      ]
    };
    STRINGS.fr = {
      title: 'Dehesa Index — Blog', badge: 'NOTES RÉELLES', updated: 'Mis à jour le 28 sept. 2026',
      h1: 'Blog',
      sub: "Un contexte court sur ce qui fait bouger ces marchés cette semaine, avec des chiffres et des sources réels — pas un résumé de titres, mais la lecture de Dehesa Index sur ce qu'il y a derrière.",
      disclaimer: "Chaque note cite des faits réels et datés, vérifiables sur les sources indiquées ci-dessous. Quand un chiffre précis n'est pas disponible (un prix cible pas encore publié, par exemple), cela est dit explicitement plutôt qu'estimé.",
      posts: [
        {
          category: CAT.fr.cereales, dateLabel: '22 mai 2026 · 21 sept. 2026',
          title: 'Pourquoi le blé coûte cher cette campagne',
          para1: "La récolte de blé d'hiver américaine 2026-27 s'est établie à 1,048 milliard de boisseaux — 25 % de moins que l'année précédente et la plus faible depuis 1965, selon l'USDA. La sécheresse a durement touché l'ouest du Kansas, l'est du Colorado et le Panhandle : au Kansas, le rendement est tombé à 37 boisseaux par acre, contre 51 en 2025, et la variété la plus touchée (blé roux d'hiver dur) a chuté de 36 %. L'USDA prévoit que le prix moyen à la production grimpe à 6,50 $/boisseau en 2026-27, soit 1,50 $ de plus que l'année précédente — même si les exportations américaines devraient reculer de 15 %, la hausse des prix rendant le blé américain moins compétitif face aux autres exportateurs.",
          para2: "Au jour le jour, pourtant, le marché ne monte pas en ligne droite : le 18 septembre, blé, maïs et soja ont tous clôturé en baisse (blé -1,45 %, maïs -0,66 %, soja -1,04 %) après que l'USDA a réduit sa prévision de maïs au Kansas de 39 millions de boisseaux, sans achats chinois pour compenser — un rappel que, sur les céréales, le fondamental de long terme (une récolte courte) et le mouvement du jour (un manque d'acheteurs) peuvent tirer en sens opposés.",
          sources: [{ label: 'Farm Progress', url: SRC.farmprogress }, { label: 'Rio Times', url: SRC.riotimes }]
        },
        {
          category: CAT.fr.fertilizantes, dateLabel: '23 sept. 2026',
          title: 'Potasse biélorusse : beaucoup de bruit, peu de mouvement (pour l’instant)',
          para1: "Durant la semaine du 14 au 18 septembre, six des huit engrais suivis par DTN ont vu leur prix augmenter aux États-Unis, et seulement deux ont baissé — sans qu'aucun mouvement ne dépasse les 5 % que DTN juge \"significatifs\". L'urée a clôturé à 659 $/tonne (légèrement en dessous du mois précédent, mais 6 % au-dessus d'il y a un an) et le DAP à 925 $/tonne (2 % au-dessus d'il y a un an) ; l'ammoniac anhydre a affiché la plus forte hausse sur un an, à 22 %.",
          para2: "Les marchés surveillent un possible accord d'importation de potasse avec la Biélorussie, évoqué par l'administration Trump — mais l'analyste Josh Linville résume ainsi la situation : \"Nous avons besoin d'aide sur le phosphate et l'azote\", pas sur la potasse, qui n'est pas aujourd'hui le nutriment le plus rare. La route d'acheminement devrait en plus passer par la Lituanie, la Lettonie, la Pologne et l'Ukraine, avec toutes les complications que cela suppose. Pour l'instant, plus un effet d'annonce qu'un vrai mouvement de prix.",
          sources: [{ label: 'DTN Progressive Farmer', url: SRC.dtn }]
        },
        {
          category: CAT.fr.lacteos, dateLabel: '26 sept. 2026',
          title: 'Espagne : les éleveurs laitiers réclament une hausse du prix du lait avant octobre',
          para1: "Unión de Uniones, l'une des principales organisations agricoles espagnoles, a appelé les éleveurs laitiers à exiger une hausse de prix lors du renouvellement de leurs contrats, dont la plupart arrivent à échéance dans les premiers jours d'octobre — le moment de négociation clé de l'année pour la filière. La demande s'appuie sur la loi espagnole de la chaîne alimentaire, qui interdit de vendre en dessous du coût de production ; l'organisation demande que le prix départ ferme couvre ce coût, de l'alimentation animale à l'énergie en passant par la main-d'œuvre.",
          para2: "La pression est la plus forte en Galice, dans les Asturies, en Cantabrie et à Castille-et-León, où l'élevage laitier fait vivre une bonne partie de l'économie rurale : vendre en dessous du coût, selon l'organisation, réduit les marges, freine l'investissement et pousse, à terme, à l'abandon des exploitations. L'article ne donne pas de prix cible précis, et Dehesa Index ne dispose pas non plus d'un prix payé vérifié à cette date — ce qui est rapporté ici est donc la demande elle-même, pas un chiffre de prix confirmé.",
          sources: [{ label: 'Moncloa.com', url: SRC.moncloa }]
        }
      ]
    };
    STRINGS.it = {
      title: 'Dehesa Index — Blog', badge: 'NOTE REALI', updated: 'Aggiornato 28 set 2026',
      h1: 'Blog',
      sub: 'Un contesto breve su cosa muove questi mercati questa settimana, con cifre e fonti reali — non un riassunto di titoli, ma la lettura di Dehesa Index su cosa c’è dietro.',
      disclaimer: 'Ogni nota cita fatti reali e datati, verificabili nelle fonti collegate in fondo. Quando un dato preciso non è disponibile (un prezzo obiettivo non ancora pubblicato, ad esempio), questo viene dichiarato esplicitamente invece di essere stimato.',
      posts: [
        {
          category: CAT.it.cereales, dateLabel: '22 mag 2026 · 21 set 2026',
          title: 'Perché il grano costa caro in questa campagna',
          para1: "Il raccolto di grano invernale statunitense 2026-27 si è fermato a 1,048 miliardi di bushel — il 25% in meno rispetto all'anno precedente e il più basso dal 1965, secondo l'USDA. La siccità ha colpito duramente il Kansas occidentale, il Colorado orientale e il Panhandle: in Kansas la resa è scesa a 37 bushel per acro, da 51 nel 2025, e la varietà più colpita (grano rosso invernale duro) è calata del 36%. L'USDA prevede che il prezzo medio all'origine salga a 6,50 $/bushel nella campagna 2026-27, 1,50 $ in più rispetto all'anno precedente — anche se le esportazioni statunitensi dovrebbero calare del 15%, perché il rincaro stesso rende il grano americano meno competitivo rispetto agli altri paesi esportatori.",
          para2: "Nel breve termine, però, il mercato non sale in linea retta: il 18 settembre grano, mais e soia hanno chiuso tutti in ribasso (grano -1,45%, mais -0,66%, soia -1,04%) dopo che l'USDA ha tagliato la previsione sul mais del Kansas di 39 milioni di bushel senza nuovi acquisti cinesi a compensare — un promemoria che, nei cereali, il fondamentale di lungo periodo (un raccolto scarso) e il movimento del giorno (la mancanza di acquirenti) possono tirare in direzioni opposte.",
          sources: [{ label: 'Farm Progress', url: SRC.farmprogress }, { label: 'Rio Times', url: SRC.riotimes }]
        },
        {
          category: CAT.it.fertilizantes, dateLabel: '23 set 2026',
          title: 'Potassa bielorussa: tanto rumore, pochi movimenti (per ora)',
          para1: "Nella settimana dal 14 al 18 settembre, sei degli otto fertilizzanti monitorati da DTN sono saliti di prezzo negli Stati Uniti, e solo due sono scesi, anche se nessun movimento ha superato il 5% che DTN considera \"significativo\". L'urea ha chiuso a 659 $/tonnellata (leggermente sotto il mese precedente, ma il 6% sopra rispetto a un anno fa) e il DAP a 925 $/tonnellata (2% sopra rispetto a un anno fa); l'anidro ha registrato il maggior aumento su base annua, +22%.",
          para2: "I mercati guardano a un possibile accordo di importazione di potassa dalla Bielorussia, ipotizzato dall'amministrazione Trump — ma l'analista Josh Linville lo dice chiaramente: \"Ci serve aiuto su fosforo e azoto\", non sulla potassa, che oggi non è il nutriente più scarso. La rotta di trasporto dovrebbe inoltre passare per Lituania, Lettonia, Polonia e Ucraina, con tutte le complicazioni che questo comporta. Per ora, più un titolo che un vero cambiamento di prezzo.",
          sources: [{ label: 'DTN Progressive Farmer', url: SRC.dtn }]
        },
        {
          category: CAT.it.lacteos, dateLabel: '26 set 2026',
          title: 'Spagna: gli allevatori chiedono un aumento del prezzo del latte prima di ottobre',
          para1: "Unión de Uniones, una delle principali associazioni agricole spagnole, ha invitato gli allevatori da latte a chiedere prezzi più alti nel rinnovo dei contratti, la maggior parte dei quali scade nei primi giorni di ottobre — il momento chiave di trattativa dell'anno per il settore. La richiesta si basa sulla legge spagnola della filiera alimentare, che vieta di vendere sotto il costo di produzione; l'organizzazione chiede che il prezzo all'origine copra quel costo, dal mangime all'energia fino alla manodopera.",
          para2: "La pressione è maggiore in Galizia, Asturie, Cantabria e Castiglia e León, dove l'allevamento da latte sostiene buona parte dell'economia rurale: vendere sotto costo, sostiene l'organizzazione, riduce i margini, scoraggia gli investimenti e, nel tempo, spinge alla chiusura delle aziende. L'articolo non fornisce una cifra di prezzo obiettivo precisa, e nemmeno Dehesa Index dispone di un prezzo pagato verificato per questa data — quindi qui si riporta la richiesta in sé, non una cifra di prezzo confermata.",
          sources: [{ label: 'Moncloa.com', url: SRC.moncloa }]
        }
      ]
    };
    return STRINGS;
  }
  var STRINGS = buildStrings();

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

    document.getElementById('bl-posts').innerHTML = t.posts.map(function (post) {
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
