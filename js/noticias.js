/* Dehesa Index — página de Noticias */
(function () {
  'use strict';

  var MONTHS = {
    es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  };
  function fmtNewsDate(iso, lg) {
    var parts = iso.split('-');
    var year = parts[0], month = parseInt(parts[1], 10), day = parseInt(parts[2], 10);
    var m = (MONTHS[lg] || MONTHS.es)[month - 1];
    if (lg === 'en') return m + ' ' + day + ', ' + year;
    return day + ' ' + m + ' ' + year;
  }

  // NEWS_ITEMS — la parte que tocaría una futura tarea programada de
  // refresco. Cada elemento es una noticia real, fechada y verificable,
  // con enlace real a su fuente — nunca contenido inventado. Más reciente
  // primero.
  var NEWS_ITEMS = [
    {
      id: 'n1', source: 'Euronews', url: 'https://www.euronews.com/2026/09/22/spanish-farmers-demand-urgent-aid-as-war-in-iran-drives-up-costs',
      date: '2026-09-22', region: 'eu',
      es: { headline: 'Los agricultores españoles piden ayuda urgente por el encarecimiento de costes debido a la guerra de Irán', summary: 'Organizaciones agrarias españolas reclaman ayudas urgentes ante la subida del gasóleo y los fertilizantes provocada por el conflicto en Irán, que se suma a los efectos de la sequía en las explotaciones.' },
      en: { headline: 'Spanish farmers demand urgent aid as war in Iran drives up costs', summary: "Spanish farm groups are calling for emergency government aid as fuel and fertiliser prices spike due to the conflict in Iran, compounding the toll of drought on farms." },
      fr: { headline: "Les agriculteurs espagnols réclament une aide urgente face à la hausse des coûts liée à la guerre en Iran", summary: "Les organisations agricoles espagnoles demandent une aide d'urgence face à la flambée des prix du gazole et des engrais provoquée par le conflit en Iran, qui s'ajoute aux effets de la sécheresse sur les exploitations." },
      it: { headline: "Gli agricoltori spagnoli chiedono aiuti urgenti per l'aumento dei costi dovuto alla guerra in Iran", summary: "Le organizzazioni agricole spagnole chiedono aiuti governativi urgenti di fronte all'aumento dei prezzi di gasolio e fertilizzanti provocato dal conflitto in Iran, che si aggiunge agli effetti della siccità sulle aziende agricole." }
    },
    {
      id: 'n8', source: 'Reuters', url: 'https://www.reuters.com/business/energy/record-us-diesel-prices-squeeze-farmers-food-prices-may-rise-2026-09-18/',
      date: '2026-09-18', region: 'us',
      es: { headline: 'El diésel en EE. UU. alcanza niveles récord y presiona los costes agrícolas', summary: 'Los precios récord del diésel están elevando los costes de explotación y transporte de agricultores estadounidenses, con posibles efectos sobre los precios de los alimentos.' },
      en: { headline: 'Record U.S. diesel prices squeeze farmers and could lift food costs', summary: 'Record diesel prices are raising operating and transport costs for U.S. farmers, with possible knock-on effects on food prices.' },
      fr: { headline: 'Le diesel américain atteint des niveaux records et pèse sur les coûts agricoles', summary: 'Les prix records du diesel augmentent les coûts d’exploitation et de transport des agriculteurs américains, avec des effets possibles sur les prix alimentaires.' },
      it: { headline: 'Il diesel negli USA raggiunge livelli record e pesa sui costi agricoli', summary: 'I prezzi record del diesel aumentano i costi operativi e di trasporto degli agricoltori statunitensi, con possibili effetti sui prezzi alimentari.' }
    },
    {
      id: 'n9', source: 'Farm Progress', url: 'https://www.farmprogress.com/markets-and-quotes/morning-market-review',
      date: '2026-09-29', region: 'us',
      es: { headline: 'La cosecha de maíz de EE. UU. llega al 18% mientras las lluvias ralentizan el avance', summary: 'El avance de la cosecha de maíz alcanza el 18%, mientras las lluvias en el Medio Oeste dificultan el trabajo de campo y condicionan el ritmo de recolección.' },
      en: { headline: 'U.S. corn harvest reaches 18% as rain slows fieldwork', summary: 'The U.S. corn harvest is 18% complete as rain across the Midwest slows fieldwork and limits near-term harvest progress.' },
      fr: { headline: 'La récolte de maïs américaine atteint 18 % alors que les pluies ralentissent les travaux', summary: 'La récolte américaine de maïs atteint 18 %, tandis que les pluies dans le Midwest ralentissent les travaux et limitent les progrès à court terme.' },
      it: { headline: 'Il raccolto di mais negli USA raggiunge il 18% mentre le piogge rallentano i lavori', summary: 'La raccolta statunitense di mais è completata al 18%, mentre le piogge nel Midwest rallentano i lavori nei campi.' }
    },
    {
      id: 'n10', source: 'Reuters', url: 'https://www.reuters.com/world/americas/weather-not-price-drive-brazil-mills-sugar-production-2026-09-29/',
      date: '2026-09-29', region: 'global',
      es: { headline: 'El clima condiciona la producción de azúcar de Brasil pese a la subida de precios', summary: 'Las lluvias inusualmente intensas en el centro-sur de Brasil están retrasando la cosecha y limitando el contenido de azúcar de la caña, condicionando la mezcla entre azúcar y etanol.' },
      en: { headline: 'Weather, not price, drives Brazil mills on sugar production', summary: 'Unusually wet weather in Brazil’s center-south is delaying harvest and limiting cane sugar content, affecting the balance between sugar and ethanol.' },
      fr: { headline: 'Le climat, plutôt que les prix, guide la production de sucre au Brésil', summary: 'Des pluies inhabituellement fortes dans le centre-sud du Brésil retardent la récolte et limitent la teneur en sucre de la canne, influençant le choix entre sucre et éthanol.' },
      it: { headline: 'Il clima, più dei prezzi, guida la produzione di zucchero in Brasile', summary: 'Le piogge insolitamente intense nel centro-sud del Brasile stanno ritardando la raccolta e limitando il contenuto zuccherino della canna, influenzando il mix tra zucchero ed etanolo.' }
    },
    {
      id: 'n11', source: 'Reuters', url: 'https://www.reuters.com/world/europe/lukashenko-proposes-us-join-belarus-gazprom-fertilizer-project-belta-reports-2026-09-29/',
      date: '2026-09-29', region: 'global',
      es: { headline: 'Belarús plantea un proyecto de fertilizantes nitrogenados con Gazprom y ofrece cooperación a EE. UU.', summary: 'Belarús anunció un proyecto de planta de fertilizantes nitrogenados con Gazprom y planteó incorporar cooperación estadounidense, según Reuters citando a la agencia estatal Belta.' },
      en: { headline: 'Belarus proposes a nitrogen fertilizer project with Gazprom and offers U.S. cooperation', summary: 'Belarus announced a proposed nitrogen fertilizer plant with Gazprom and suggested U.S. cooperation, Reuters reported citing state news agency Belta.' },
      fr: { headline: 'La Biélorussie propose un projet d’engrais azotés avec Gazprom et offre une coopération aux États-Unis', summary: 'La Biélorussie a annoncé un projet d’usine d’engrais azotés avec Gazprom et proposé une coopération américaine, selon Reuters citant l’agence d’État Belta.' },
      it: { headline: 'La Bielorussia propone un progetto di fertilizzanti azotati con Gazprom e offre cooperazione agli USA', summary: 'La Bielorussia ha annunciato un progetto di impianto di fertilizzanti azotati con Gazprom e proposto una cooperazione statunitense, secondo Reuters citando l’agenzia statale Belta.' }
    },
    {
      id: 'n12', source: 'Reuters', url: 'https://www.reuters.com/world/china/china-says-cut-tariffs-us-farm-goods-soybeans-excluded-2026-09-28/',
      date: '2026-09-28', region: 'global',
      es: { headline: 'China recorta aranceles a productos agrícolas de EE. UU., pero excluye la soja', summary: 'China anunció reducciones arancelarias para varios productos agrícolas estadounidenses, entre ellos maíz, trigo, carne y lácteos, mientras la soja quedó excluida.' },
      en: { headline: 'China cuts tariffs on U.S. farm goods but excludes soybeans', summary: 'China announced tariff reductions for several U.S. agricultural products, including corn, wheat, meat and dairy, while soybeans were excluded.' },
      fr: { headline: 'La Chine réduit les droits sur les produits agricoles américains mais exclut le soja', summary: 'La Chine a annoncé des réductions de droits sur plusieurs produits agricoles américains, notamment le maïs, le blé, la viande et les produits laitiers, tandis que le soja est exclu.' },
      it: { headline: 'La Cina riduce i dazi sui prodotti agricoli USA ma esclude la soia', summary: 'La Cina ha annunciato riduzioni dei dazi su diversi prodotti agricoli statunitensi, tra cui mais, grano, carne e lattiero-caseari, mentre la soia è esclusa.' }
    },
    {
      id: 'n13', source: 'European Commission', url: 'https://agriculture.ec.europa.eu/media/news/eu-agri-food-trade-remains-solid-2026-2026-09-28_en',
      date: '2026-09-28', region: 'eu',
      es: { headline: 'El comercio agroalimentario de la UE sigue siendo sólido en 2026', summary: 'La Comisión Europea informó de que las importaciones agroalimentarias acumuladas de la UE alcanzaron 108.600 millones de euros hasta julio, un 4% menos interanual, con menores importaciones de cereales y lácteos.' },
      en: { headline: 'EU agri-food trade remains solid in 2026', summary: 'The European Commission reported cumulative EU agri-food imports of €108.6 billion through July, down 4% year on year, with lower cereal and dairy import values.' },
      fr: { headline: 'Le commerce agroalimentaire de l’UE reste solide en 2026', summary: 'La Commission européenne indique que les importations agroalimentaires cumulées de l’UE ont atteint 108,6 milliards d’euros jusqu’en juillet, en baisse de 4 % sur un an, avec des valeurs d’importation plus faibles pour les céréales et les produits laitiers.' },
      it: { headline: 'Il commercio agroalimentare dell’UE resta solido nel 2026', summary: 'La Commissione europea riferisce che le importazioni agroalimentari cumulate dell’UE hanno raggiunto 108,6 miliardi di euro fino a luglio, in calo del 4% annuo, con valori inferiori per cereali e lattiero-caseari.' }
    },
    {
      id: 'n7', source: 'DTN Progressive Farmer', url: 'https://www.dtnpf.com/agriculture/web/ag/news/article/2026/09/21/usda-crop-progress-corn-13-harvested',
      date: '2026-09-21', region: 'us',
      es: { headline: 'Lluvias récord de septiembre frenan la cosecha de maíz en el Corn Belt de EE. UU.', summary: 'Datos del USDA muestran que solo el 13% del maíz estaba cosechado a fecha del 20 de septiembre, muy por detrás de la media, tras un mes marcado por precipitaciones históricas en el Medio Oeste.' },
      en: { headline: 'Record September rains slow corn harvest across the U.S. Corn Belt', summary: 'USDA data show just 13% of the corn crop had been harvested as of Sept. 20, well behind average, after a month of historic rainfall across the Midwest.' },
      fr: { headline: 'Des pluies record en septembre ralentissent la récolte de maïs dans la Corn Belt américaine', summary: "Selon les données de l'USDA, seuls 13 % du maïs avaient été récoltés au 20 septembre, bien en dessous de la moyenne, après un mois marqué par des précipitations historiques dans le Midwest." },
      it: { headline: 'Piogge record di settembre rallentano la raccolta del mais nella Corn Belt statunitense', summary: "I dati dell'USDA mostrano che solo il 13% del mais era stato raccolto al 20 settembre, ben al di sotto della media, dopo un mese segnato da piogge storiche nel Midwest." }
    },
    {
      id: 'n2', source: 'Euronews', url: 'https://www.euronews.com/2026/09/17/heat-and-drought-why-beer-at-oktoberfest-could-soon-be-in-short-supply',
      date: '2026-09-17', region: 'eu',
      es: { headline: 'Calor y sequía: por qué podría escasear la cerveza en el Oktoberfest', summary: 'Las altas temperaturas y la falta de lluvias han reducido la cosecha de cebada y lúpulo en Baviera, lo que amenaza con encarecer la cerveza que se sirve en el Oktoberfest.' },
      en: { headline: 'Heat and drought: why beer at Oktoberfest could soon be in short supply', summary: "Record heat and low rainfall have shrunk Bavaria's barley and hops harvest, threatening to push up the price of the beer served at Oktoberfest." },
      fr: { headline: "Chaleur et sécheresse : pourquoi la bière pourrait bientôt manquer à l'Oktoberfest", summary: "La chaleur record et le manque de pluie ont réduit la récolte d'orge et de houblon en Bavière, ce qui menace de faire grimper le prix de la bière servie à l'Oktoberfest." },
      it: { headline: "Caldo e siccità: perché la birra all'Oktoberfest potrebbe presto scarseggiare", summary: 'Il caldo record e la scarsità di piogge hanno ridotto il raccolto di orzo e luppolo in Baviera, con il rischio di far salire il prezzo della birra servita alla festa.' }
    },
    {
      id: 'n3', source: 'Euronews', url: 'https://www.euronews.com/2026/09/10/farmers-know-cash-is-limited-european-commissioner-for-agriculture-christophe-hansen-says',
      date: '2026-09-10', region: 'eu',
      es: { headline: '"Los agricultores saben que el dinero es limitado", dice el comisario europeo de Agricultura', summary: 'Christophe Hansen defiende el nuevo reparto del presupuesto de la PAC en las negociaciones sobre el próximo marco financiero de la UE, en medio de las presiones del sector agrario por mantener la financiación.' },
      en: { headline: '"Farmers know cash is limited", European commissioner for agriculture says', summary: "Christophe Hansen defends the proposed shake-up of the CAP budget in talks over the EU's next long-term financial framework, amid pressure from the farming sector to protect funding." },
      fr: { headline: '« Les agriculteurs savent que l’argent est limité », affirme le commissaire européen à l’Agriculture', summary: "Christophe Hansen défend la nouvelle répartition du budget de la PAC dans les négociations sur le prochain cadre financier pluriannuel de l'UE, alors que le secteur agricole fait pression pour préserver les financements." },
      it: { headline: '"Gli agricoltori sanno che i fondi sono limitati", afferma il commissario europeo all’Agricoltura', summary: "Christophe Hansen difende la nuova ripartizione del bilancio della PAC nei negoziati sul prossimo quadro finanziario pluriennale dell'UE, mentre il settore agricolo fa pressione per proteggere i finanziamenti." }
    },
    {
      id: 'n4', source: 'Euronews', url: 'https://www.euronews.com/2026/09/07/digital-agriculture-the-5-ways-ai-is-transforming-how-we-farm',
      date: '2026-09-07', region: 'global',
      es: { headline: 'Agricultura digital: cinco formas en que la IA está transformando el campo', summary: 'Sensores, drones y modelos de inteligencia artificial ayudan ya a decidir cuándo regar, abonar y cosechar, con el objetivo de reducir costes e insumos en las explotaciones europeas.' },
      en: { headline: 'Digital agriculture: the 5 ways AI is transforming how we farm', summary: 'Sensors, drones and AI models are increasingly guiding decisions on irrigation, fertilising and harvest timing, aiming to cut costs and input use on European farms.' },
      fr: { headline: "Agriculture numérique : cinq façons dont l'IA transforme le monde agricole", summary: "Capteurs, drones et modèles d'intelligence artificielle aident désormais à décider quand irriguer, fertiliser et récolter, dans le but de réduire les coûts et les intrants dans les exploitations européennes." },
      it: { headline: 'Agricoltura digitale: cinque modi in cui l’IA sta trasformando le campagne', summary: "Sensori, droni e modelli di intelligenza artificiale aiutano già a decidere quando irrigare, concimare e raccogliere, con l'obiettivo di ridurre costi e input nelle aziende agricole europee." }
    },
    {
      id: 'n6', source: 'La Moncloa — Gobierno de España', url: 'https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/agricultura/Paginas/2026/280726-solicitud-unica-pac.aspx',
      date: '2026-07-28', region: 'eu',
      es: { headline: 'Más de 563.000 agricultores y ganaderos solicitan las ayudas de la PAC para la campaña 2026', summary: 'El Ministerio de Agricultura, Pesca y Alimentación cierra el plazo de la solicitud única de la PAC con más de 563.000 solicitudes, que canalizan buena parte de las ayudas directas al sector en España.' },
      en: { headline: 'Over 563,000 farmers and ranchers apply for CAP aid for the 2026 campaign', summary: "Spain's Ministry of Agriculture, Fisheries and Food closes the CAP single-application window with more than 563,000 applications, channelling the bulk of direct aid to the country's farm sector." },
      fr: { headline: '"Plus de 563 000 agriculteurs et éleveurs demandent les aides de la PAC pour la campagne 2026"', summary: "Le ministère espagnol de l'Agriculture, de la Pêche et de l'Alimentation clôture la demande unique de la PAC avec plus de 563 000 dossiers, qui concentrent l'essentiel des aides directes au secteur agricole en Espagne." },
      it: { headline: 'Oltre 563.000 agricoltori e allevatori richiedono gli aiuti della PAC per la campagna 2026', summary: 'Il Ministero spagnolo dell’Agricoltura, della Pesca e dell’Alimentazione chiude la domanda unica della PAC con oltre 563.000 richieste, che convogliano gran parte degli aiuti diretti al settore agricolo in Spagna.' }
    },
    {
      id: 'n5', source: 'Associated Press', url: 'https://www.pbs.org/newshour/nation/already-under-financial-pressure-farmers-squeezed-further-by-tariffs-and-iran-war',
      date: '2026-04-13', region: 'us',
      es: { headline: 'Ya bajo presión financiera, los agricultores estadounidenses se ven más asfixiados por los aranceles y la guerra de Irán', summary: 'Productores de soja del Medio Oeste afrontan menores ventas a China y mayores costes de gasóleo mientras Washington negocia aranceles; una ayuda federal de 12.000 millones de dólares no basta, según los agricultores.' },
      en: { headline: 'Already under financial pressure, farmers squeezed further by tariffs and Iran war', summary: 'Midwest soybean growers face reduced sales to China and rising fuel costs as Washington negotiates tariffs; farmers say a $12 billion federal aid package falls short of covering the losses.' },
      fr: { headline: 'Déjà sous pression financière, les agriculteurs américains davantage étranglés par les tarifs douaniers et la guerre en Iran', summary: "Les producteurs de soja du Midwest subissent une baisse des ventes vers la Chine et une hausse du coût du gazole alors que Washington négocie des droits de douane ; une aide fédérale de 12 milliards de dollars reste insuffisante selon les agriculteurs." },
      it: { headline: 'Già sotto pressione finanziaria, gli agricoltori statunitensi ulteriormente colpiti dai dazi e dalla guerra in Iran', summary: "I produttori di soia del Midwest affrontano un calo delle vendite verso la Cina e l'aumento dei costi del gasolio mentre Washington negozia i dazi; secondo gli agricoltori un pacchetto di aiuti federali da 12 miliardi di dollari non basta a coprire le perdite." }
    }
  ];

  var UPDATED_ISO = '2026-09-29';

  var PRODUCT_LABELS = {
    es: { trigo: 'Trigo', maiz: 'Maíz', arroz: 'Arroz', cebada: 'Cebada', soja: 'Soja', fertilizantes: 'Fertilizantes', diesel: 'Diésel', energia: 'Energía', costes: 'Costes agrícolas', pac: 'PAC' },
    en: { trigo: 'Wheat', maiz: 'Corn', arroz: 'Rice', cebada: 'Barley', soja: 'Soybeans', fertilizantes: 'Fertiliser', diesel: 'Diesel', energia: 'Energy', costes: 'Farm costs', pac: 'CAP' },
    fr: { trigo: 'Blé', maiz: 'Maïs', arroz: 'Riz', cebada: 'Orge', soja: 'Soja', fertilizantes: 'Engrais', diesel: 'Gazole', energia: 'Énergie', costes: 'Coûts agricoles', pac: 'PAC' },
    it: { trigo: 'Grano', maiz: 'Mais', arroz: 'Riso', cebada: 'Orzo', soja: 'Soia', fertilizantes: 'Fertilizzanti', diesel: 'Gasolio', energia: 'Energia', costes: 'Costi agricoli', pac: 'PAC' }
  };
  var TOPIC_LABELS = {
    es: { clima: 'Clima', costes: 'Costes', comercio: 'Comercio', politica: 'Política agraria', oferta: 'Oferta y cosecha', tecnologia: 'Tecnología', energia: 'Energía', ayudas: 'Ayudas' },
    en: { clima: 'Weather', costes: 'Costs', comercio: 'Trade', politica: 'Agricultural policy', oferta: 'Supply & harvest', tecnologia: 'Technology', energia: 'Energy', ayudas: 'Support & aid' },
    fr: { clima: 'Climat', costes: 'Coûts', comercio: 'Commerce', politica: 'Politique agricole', oferta: 'Offre & récolte', tecnologia: 'Technologie', energia: 'Énergie', ayudas: 'Aides' },
    it: { clima: 'Clima', costes: 'Costi', comercio: 'Commercio', politica: 'Politica agricola', oferta: 'Offerta e raccolto', tecnologia: 'Tecnologia', energia: 'Energia', ayudas: 'Aiuti' }
  };
  var REGION_LABELS = {
    es: { all: 'Todas', us: 'EE. UU.', eu: 'Europa', uk: 'Reino Unido', global: 'Global' },
    en: { all: 'All', us: 'U.S.', eu: 'Europe', uk: 'United Kingdom', global: 'Global' },
    fr: { all: 'Toutes', us: 'États-Unis', eu: 'Europe', uk: 'Royaume-Uni', global: 'Mondial' },
    it: { all: 'Tutte', us: 'Stati Uniti', eu: 'Europa', uk: 'Regno Unito', global: 'Globale' }
  };

  function inferTags(item) {
    var text = [item.es && item.es.headline, item.es && item.es.summary, item.en && item.en.headline, item.en && item.en.summary].join(' ').toLowerCase();
    var products = [], topics = [];
    function has(re) { return re.test(text); }
    if (has(/maíz|corn|corn belt/)) products.push('maiz');
    if (has(/trigo|wheat/)) products.push('trigo');
    if (has(/arroz|rice/)) products.push('arroz');
    if (has(/cebada|barley|beer|cerveza|bière|birra/)) products.push('cebada');
    if (has(/soja|soybean/)) products.push('soja');
    if (has(/fertiliz|fertiliser|fertilizer|engrais/)) products.push('fertilizantes');
    if (has(/gasóleo|diesel|fuel|combustible|carburant|gasolio/)) products.push('diesel');
    if (has(/energía|energy|energie|energia|gas/)) products.push('energia');
    if (has(/costes|costs|coûts|costi|cost/)) products.push('costes');
    if (has(/pac|cap budget|ayudas de la pac|aide|aid|funding|financ/)) products.push('pac');
    if (has(/sequía|drought|sécheresse|siccità|heat|calor|chaleur|caldo|rain|lluvia|pluie|pioggia/)) topics.push('clima');
    if (has(/coste|costes|cost|prix|price|precios|gasóleo|diesel|fertiliz/)) topics.push('costes');
    if (has(/tariff|arancel|duty|china|trade|comercio|commerce|export|ventas|sales/)) topics.push('comercio');
    if (has(/pac|budget|presupuesto|commissioner|comisario|policy|política|funding|financ/)) topics.push('politica');
    if (has(/harvest|cosecha|crop|cultivo|recolte|raccolto|supply|oferta/)) topics.push('oferta');
    if (has(/ai|ia |artificial intelligence|inteligencia artificial|drones|sensores|digital/)) topics.push('tecnologia');
    if (has(/energy|energía|energie|energia|gasóleo|diesel|fuel|gas/)) topics.push('energia');
    if (has(/ayuda|aid|aide|aiuti|funding|financiación|support/)) topics.push('ayudas');
    return { products: products.filter(function(v,i,a){ return a.indexOf(v) === i; }), topics: topics.filter(function(v,i,a){ return a.indexOf(v) === i; }) };
  }

  NEWS_ITEMS.forEach(function(item) {
    var tags = inferTags(item);
    item.products = tags.products;
    item.topics = tags.topics;
  });

  var STRINGS = {
    es: {
      title: 'Dehesa Index — Noticias', h1: 'Noticias',
      sub: 'Los titulares más recientes del mundo agrícola, seleccionados de agencias de noticias y fuentes oficiales.',
      badge: 'TITULARES REALES', updatedLabel: 'Actualizado',
      disclaimer: 'Estos titulares son reales y verificados, cada uno enlazado directamente a su fuente original. Se actualizan periódicamente mediante una tarea programada, no mediante un feed en directo, así que puede haber un pequeño desfase entre una noticia y su publicación aquí.',
      readMore: 'Leer en la fuente',
      filterAll: 'Todas', filterGlobal: 'Global', filterEuropa: 'Europa', filterAmerica: 'América',
      regionLabel: 'Región', productLabel: 'Producto / mercado', topicLabel: 'Tema',
      intelTitle: 'Qué está moviendo estos mercados', intelSub: 'Contexto editorial construido a partir de las noticias visibles y sus etiquetas.',
      intelEmpty: 'No hay suficiente cobertura para generar contexto con estos filtros.',
      filterSummary: 'Mostrando {count} noticias', tagMarket: 'Mercado', tagTopic: 'Tema',
      noResultsHint: 'No hay noticias en esta categoría por ahora. Prueba con otro filtro.',
      sourcesTitle: 'Fuentes',
      sources: [
        { text: 'Euronews — Agricultura', url: 'https://www.euronews.com/tag/agriculture' },
        { text: 'Associated Press — Agricultura', url: 'https://apnews.com/hub/agriculture' },
        { text: 'La Moncloa — Gobierno de España', url: 'https://www.lamoncloa.gob.es/' },
        { text: 'DTN Progressive Farmer', url: 'https://www.dtnpf.com/' },
        { text: 'USDA — Sala de prensa (EE. UU.)', url: 'https://www.usda.gov/media/press-releases' },
        { text: 'FAO — Sala de prensa (ONU)', url: 'https://www.fao.org/newsroom/en/' },
        { text: 'Comisión Europea — Noticias de Agricultura', url: 'https://agriculture.ec.europa.eu/news_en' },
        { text: 'ANSA — Terra & Gusto (Italia)', url: 'https://www.ansa.it/canale_terraegusto/' },
        { text: 'La France Agricole (Francia)', url: 'https://www.lafranceagricole.fr/actualites' }
      ]
    },
    en: {
      title: 'Dehesa Index — News', h1: 'News',
      sub: 'The most recent headlines from the agricultural world, curated from news agencies and official sources.',
      badge: 'REAL HEADLINES', updatedLabel: 'Updated',
      disclaimer: "These headlines are real and verified, each linking directly to its original source. They're refreshed periodically by a scheduled task rather than a live feed, so there can be a short delay between a story breaking and appearing here.",
      readMore: 'Read at the source',
      filterAll: 'All', filterGlobal: 'Global', filterEuropa: 'Europe', filterAmerica: 'Americas',
      regionLabel: 'Region', productLabel: 'Product / market', topicLabel: 'Theme',
      intelTitle: 'What is moving these markets', intelSub: 'Editorial context built from the visible stories and their tags.',
      intelEmpty: 'There is not enough coverage to build context with these filters.',
      filterSummary: 'Showing {count} stories', tagMarket: 'Market', tagTopic: 'Theme',
      noResultsHint: 'No headlines in this category right now. Try another filter.',
      sourcesTitle: 'Sources',
      sources: [
        { text: 'Euronews — Agriculture', url: 'https://www.euronews.com/tag/agriculture' },
        { text: 'Associated Press — Agriculture', url: 'https://apnews.com/hub/agriculture' },
        { text: 'La Moncloa — Government of Spain', url: 'https://www.lamoncloa.gob.es/' },
        { text: 'DTN Progressive Farmer', url: 'https://www.dtnpf.com/' },
        { text: 'USDA Newsroom (U.S.)', url: 'https://www.usda.gov/media/press-releases' },
        { text: 'FAO Newsroom (UN)', url: 'https://www.fao.org/newsroom/en/' },
        { text: 'European Commission — Agriculture News', url: 'https://agriculture.ec.europa.eu/news_en' },
        { text: 'ANSA — Terra & Gusto (Italy)', url: 'https://www.ansa.it/canale_terraegusto/' },
        { text: 'La France Agricole (France)', url: 'https://www.lafranceagricole.fr/actualites' }
      ]
    },
    fr: {
      title: 'Dehesa Index — Actualités', h1: 'Actualités',
      sub: "Les derniers titres du monde agricole, sélectionnés auprès d'agences de presse et de sources officielles.",
      badge: 'TITRES RÉELS', updatedLabel: 'Mis à jour',
      disclaimer: "Ces titres sont réels et vérifiés, chacun renvoyant directement à sa source d'origine. Ils sont actualisés périodiquement par une tâche programmée plutôt que par un flux en direct : un léger décalage peut donc exister entre la publication d'une actualité et son apparition ici.",
      readMore: 'Lire la source',
      filterAll: 'Toutes', filterGlobal: 'Mondial', filterEuropa: 'Europe', filterAmerica: 'Amériques',
      regionLabel: 'Région', productLabel: 'Produit / marché', topicLabel: 'Thème',
      intelTitle: 'Ce qui fait bouger ces marchés', intelSub: 'Contexte éditorial construit à partir des actualités visibles et de leurs étiquettes.',
      intelEmpty: 'Couverture insuffisante pour générer un contexte avec ces filtres.',
      filterSummary: '{count} actualités affichées', tagMarket: 'Marché', tagTopic: 'Thème',
      noResultsHint: "Aucune actualité dans cette catégorie pour l'instant. Essayez un autre filtre.",
      sourcesTitle: 'Sources',
      sources: [
        { text: 'Euronews — Agriculture', url: 'https://www.euronews.com/tag/agriculture' },
        { text: 'Associated Press — Agriculture', url: 'https://apnews.com/hub/agriculture' },
        { text: 'La Moncloa — Gouvernement espagnol', url: 'https://www.lamoncloa.gob.es/' },
        { text: 'DTN Progressive Farmer', url: 'https://www.dtnpf.com/' },
        { text: 'USDA — Salle de presse (États-Unis)', url: 'https://www.usda.gov/media/press-releases' },
        { text: 'FAO — Salle de presse (ONU)', url: 'https://www.fao.org/newsroom/en/' },
        { text: 'Commission européenne — Actualités agricoles', url: 'https://agriculture.ec.europa.eu/news_en' },
        { text: 'ANSA — Terra & Gusto (Italie)', url: 'https://www.ansa.it/canale_terraegusto/' },
        { text: 'La France Agricole', url: 'https://www.lafranceagricole.fr/actualites' }
      ]
    },
    it: {
      title: 'Dehesa Index — Notizie', h1: 'Notizie',
      sub: 'I titoli più recenti dal mondo agricolo, selezionati da agenzie di stampa e fonti ufficiali.',
      badge: 'TITOLI REALI', updatedLabel: 'Aggiornato',
      disclaimer: "Questi titoli sono reali e verificati, ciascuno con un link diretto alla fonte originale. Vengono aggiornati periodicamente tramite un'attività pianificata anziché in tempo reale, quindi può trascorrere un breve intervallo tra la pubblicazione di una notizia e la sua comparsa qui.",
      readMore: 'Leggi alla fonte',
      filterAll: 'Tutte', filterGlobal: 'Globale', filterEuropa: 'Europa', filterAmerica: 'Americhe',
      regionLabel: 'Regione', productLabel: 'Prodotto / mercato', topicLabel: 'Tema',
      intelTitle: 'Cosa sta muovendo questi mercati', intelSub: 'Contesto editoriale costruito dalle notizie visibili e dalle relative etichette.',
      intelEmpty: 'Copertura insufficiente per generare contesto con questi filtri.',
      filterSummary: 'Visualizzate {count} notizie', tagMarket: 'Mercato', tagTopic: 'Tema',
      noResultsHint: 'Nessuna notizia in questa categoria al momento. Prova un altro filtro.',
      sourcesTitle: 'Fonti',
      sources: [
        { text: 'Euronews — Agricoltura', url: 'https://www.euronews.com/tag/agriculture' },
        { text: 'Associated Press — Agricoltura', url: 'https://apnews.com/hub/agriculture' },
        { text: 'La Moncloa — Governo spagnolo', url: 'https://www.lamoncloa.gob.es/' },
        { text: 'DTN Progressive Farmer', url: 'https://www.dtnpf.com/' },
        { text: 'USDA — Sala stampa (Stati Uniti)', url: 'https://www.usda.gov/media/press-releases' },
        { text: 'FAO — Sala stampa (ONU)', url: 'https://www.fao.org/newsroom/en/' },
        { text: "Commissione europea — Notizie sull'agricoltura", url: 'https://agriculture.ec.europa.eu/news_en' },
        { text: 'ANSA — Terra & Gusto', url: 'https://www.ansa.it/canale_terraegusto/' },
        { text: 'La France Agricole (Francia)', url: 'https://www.lafranceagricole.fr/actualites' }
      ]
    }
  };

  var initialParams = new URLSearchParams(window.location.search);
  var state = {
    region: initialParams.get('region') || 'all',
    product: initialParams.get('product') || 'all',
    topic: initialParams.get('topic') || 'all'
  };
  function syncUrl() {
    var params = [];
    if (state.region !== 'all') params.push('region=' + encodeURIComponent(state.region));
    if (state.product !== 'all') params.push('product=' + encodeURIComponent(state.product));
    if (state.topic !== 'all') params.push('topic=' + encodeURIComponent(state.topic));
    var next = window.location.pathname + (params.length ? '?' + params.join('&') : '');
    if (window.history && window.history.pushState) window.history.pushState({ dehesa: 'news' }, '', next);
  }

  window.addEventListener('popstate', function () {
    var p = new URLSearchParams(window.location.search);
    state.region = p.get('region') || 'all';
    state.product = p.get('product') || 'all';
    state.topic = p.get('topic') || 'all';
    render();
  });

  function optionHtml(value, label, selected) {
    return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';
  }

  function productPriceUrl(product) {
    var map = { trigo:'trigo', maiz:'maiz', leche:'leche', fertilizantes:'urea', diesel:'diesel', arroz:'arroz' };
    return 'precios.html?product=' + encodeURIComponent(map[product] || product);
  }
  function newsContextParams() {
    var p = [];
    if (state.region !== 'all') p.push('region=' + encodeURIComponent(state.region));
    if (state.product !== 'all') p.push('product=' + encodeURIComponent(state.product));
    if (state.topic !== 'all') p.push('topic=' + encodeURIComponent(state.topic));
    return p.length ? '?' + p.join('&') : '';
  }

  function getFilteredItems() {
    return NEWS_ITEMS.filter(function(item) {
      return (state.region === 'all' || item.region === state.region) &&
        (state.product === 'all' || item.products.indexOf(state.product) !== -1) &&
        (state.topic === 'all' || item.topics.indexOf(state.topic) !== -1);
    });
  }

  function renderIntel(items, t, lang, esc) {
    var intel = document.getElementById('nw-intel');
    var counts = {};
    items.forEach(function(item) {
      item.topics.forEach(function(topic) { counts[topic] = (counts[topic] || 0) + 1; });
    });
    var topics = Object.keys(counts).sort(function(a,b){ return counts[b] - counts[a]; }).slice(0, 3);
    if (!items.length || !topics.length) {
      intel.innerHTML = '<div class="di-news-intel-head"><div><span class="di-section-kicker">INTELLIGENCE</span><h2 id="nw-intel-title">' + esc(t.intelTitle) + '</h2><p>' + esc(t.intelEmpty) + '</p></div><span class="di-news-intel-state">PENDIENTE</span></div>';
      return;
    }
    var lead = topics[0];
    var leadCount = counts[lead];
    var productCounts = {};
    items.forEach(function(item) { item.products.forEach(function(p){ productCounts[p] = (productCounts[p] || 0) + 1; }); });
    var products = Object.keys(productCounts).sort(function(a,b){ return productCounts[b] - productCounts[a]; }).slice(0,4);
    var selectedProduct = state.product !== 'all' ? (PRODUCT_LABELS[lang] || PRODUCT_LABELS.es)[state.product] : null;
    var context = (lang === 'es'
      ? (selectedProduct ? selectedProduct + ' aparece asociado principalmente a ' + TOPIC_LABELS.es[lead].toLowerCase() + ' en ' + leadCount + ' noticia' + (leadCount === 1 ? '' : 's') + '.' : 'La cobertura disponible está dominada por ' + TOPIC_LABELS.es[lead].toLowerCase() + ' (' + leadCount + ' noticia' + (leadCount === 1 ? '' : 's') + '). Los mercados relacionados son ' + products.map(function(p){ return PRODUCT_LABELS.es[p]; }).join(', ') + '.')
      : lang === 'fr'
      ? (selectedProduct ? selectedProduct + ' est principalement associé à ' + TOPIC_LABELS.fr[lead].toLowerCase() + ' dans ' + leadCount + ' actualité' + (leadCount === 1 ? '' : 's') + '.' : 'La couverture disponible est dominée par ' + TOPIC_LABELS.fr[lead].toLowerCase() + ' (' + leadCount + ' actualité' + (leadCount === 1 ? '' : 's') + '). Les marchés associés sont ' + products.map(function(p){ return PRODUCT_LABELS.fr[p]; }).join(', ') + '.')
      : lang === 'it'
      ? (selectedProduct ? selectedProduct + ' è associato soprattutto a ' + TOPIC_LABELS.it[lead].toLowerCase() + ' in ' + leadCount + ' notizi' + (leadCount === 1 ? 'a' : 'e') + '.' : 'La copertura disponibile è dominata da ' + TOPIC_LABELS.it[lead].toLowerCase() + ' (' + leadCount + ' notizi' + (leadCount === 1 ? 'a' : 'e') + '). I mercati collegati sono ' + products.map(function(p){ return PRODUCT_LABELS.it[p]; }).join(', ') + '.')
      : (selectedProduct ? selectedProduct + ' is mainly associated with ' + TOPIC_LABELS.en[lead].toLowerCase() + ' across ' + leadCount + ' stor' + (leadCount === 1 ? 'y' : 'ies') + '.' : 'Available coverage is dominated by ' + TOPIC_LABELS.en[lead].toLowerCase() + ' (' + leadCount + ' stor' + (leadCount === 1 ? 'y' : 'ies') + '). Related markets are ' + products.map(function(p){ return PRODUCT_LABELS.en[p]; }).join(', ') + '.'));
    intel.innerHTML = '<div class="di-news-intel-head"><div><span class="di-section-kicker">INTELLIGENCE</span><h2 id="nw-intel-title">' + esc(t.intelTitle) + '</h2><p>' + esc(t.intelSub) + '</p></div><span class="di-news-intel-state">CONTEXTO</span></div>' +
      '<div class="di-news-context">' + esc(context) + '</div>' +
      '<div class="di-news-intel-tags">' + topics.map(function(topic){ return '<span class="di-news-tag topic">' + esc(t.tagTopic + ': ' + (TOPIC_LABELS[lang] || TOPIC_LABELS.es)[topic]) + '</span>'; }).join('') + products.map(function(p){ return '<span class="di-news-tag product">' + esc(t.tagMarket + ': ' + (PRODUCT_LABELS[lang] || PRODUCT_LABELS.es)[p]) + '</span>'; }).join('') + '</div>';
  }

  function render() {
    var lang = window.DehesaShared.getLang();
    var esc = window.DehesaShared.esc;
    var t = STRINGS[lang] || STRINGS.es;
    window.DehesaShared.renderContextBar('noticias');
    var regionLabels = REGION_LABELS[lang] || REGION_LABELS.es;
    var productLabels = PRODUCT_LABELS[lang] || PRODUCT_LABELS.es;
    var topicLabels = TOPIC_LABELS[lang] || TOPIC_LABELS.es;

    document.title = t.title;
    document.getElementById('nw-badge').textContent = t.badge;
    document.getElementById('nw-updated').textContent = t.updatedLabel + ': ' + fmtNewsDate(UPDATED_ISO, lang);
    document.getElementById('nw-h1').textContent = t.h1;
    document.getElementById('nw-sub').textContent = t.sub;
    document.getElementById('nw-disclaimer').textContent = t.disclaimer;

    document.getElementById('nw-region-label').textContent = t.regionLabel;
    document.getElementById('nw-product-label').textContent = t.productLabel;
    document.getElementById('nw-topic-label').textContent = t.topicLabel;

    var regions = ['all','us','eu','uk','global'];
    var products = [];
    var topics = [];
    NEWS_ITEMS.forEach(function(item) {
      item.products.forEach(function(p){ if(products.indexOf(p) === -1) products.push(p); });
      item.topics.forEach(function(topic){ if(topics.indexOf(topic) === -1) topics.push(topic); });
    });
    products.sort(function(a,b){ return (productLabels[a] || a).localeCompare(productLabels[b] || b); });
    topics.sort(function(a,b){ return (topicLabels[a] || a).localeCompare(topicLabels[b] || b); });

    document.getElementById('nw-region-filter').innerHTML = regions.map(function(v){ return optionHtml(v, regionLabels[v], state.region === v); }).join('');
    document.getElementById('nw-product-filter').innerHTML = optionHtml('all', lang === 'es' ? 'Todos' : lang === 'fr' ? 'Tous' : lang === 'it' ? 'Tutti' : 'All', state.product === 'all') +
      products.map(function(v){ return optionHtml(v, productLabels[v], state.product === v); }).join('');
    document.getElementById('nw-topic-filter').innerHTML = optionHtml('all', lang === 'es' ? 'Todos' : lang === 'fr' ? 'Tous' : lang === 'it' ? 'Tutti' : 'All', state.topic === 'all') +
      topics.map(function(v){ return optionHtml(v, topicLabels[v], state.topic === v); }).join('');

    ['region','product','topic'].forEach(function(key) {
      var el = document.getElementById('nw-' + key + '-filter');
      el.onchange = function(){ state[key] = el.value; syncUrl(); render(); };
    });

    var filteredItems = getFilteredItems();
    renderIntel(filteredItems, t, lang, esc);
    document.getElementById('nw-filter-summary').textContent = t.filterSummary.replace('{count}', String(filteredItems.length));

    var itemsHtml;
    if (filteredItems.length > 0) {
      itemsHtml = '<div class="di-news-list">' + filteredItems.map(function(item) {
        var tr = item[lang] || item.es;
        var marketTags = item.products.map(function(p){ return '<span class="di-news-tag product">' + esc((PRODUCT_LABELS[lang] || PRODUCT_LABELS.es)[p]) + '</span>'; }).join('');
        var topicTags = item.topics.map(function(topic){ return '<span class="di-news-tag topic">' + esc((TOPIC_LABELS[lang] || TOPIC_LABELS.es)[topic]) + '</span>'; }).join('');
        return '<article class="di-card di-news-item">' +
          '<div class="di-news-item-meta"><span class="di-news-item-source">' + esc(item.source) + '</span><span>·</span><span>' + esc(fmtNewsDate(item.date, lang)) + '</span></div>' +
          '<div class="di-news-item-headline">' + esc(tr.headline) + '</div>' +
          '<p class="di-news-item-summary">' + esc(tr.summary) + '</p>' +
          '<div class="di-news-tags">' + marketTags + topicTags + '</div>' +
          '<a class="di-news-item-readmore" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.readMore) + ' →</a>' +
          '<a class="di-news-item-price-link" href="' + productPriceUrl(item.products[0] || 'trigo') + '">' + esc(lang === 'es' ? 'Ver precios' : lang === 'fr' ? 'Voir les prix' : lang === 'it' ? 'Vedi prezzi' : 'View prices') + ' →</a></article>';
      }).join('') + '</div>';
    } else {
      itemsHtml = '<div class="di-news-empty">' + esc(t.noResultsHint) + '</div>';
    }
    document.getElementById('nw-items').innerHTML = itemsHtml;

    document.getElementById('nw-sources-title').textContent = t.sourcesTitle;
    document.getElementById('nw-sources-list').innerHTML = t.sources.map(function(s) {
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.text) + '</a></li>';
    }).join('');
  }

  window.DehesaShared.init('noticias');
  window.DehesaShared.onLangChange = render;
  render();
})();
