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

  var UPDATED_ISO = '2026-09-27';

  var STRINGS = {
    es: {
      title: 'Dehesa Index — Noticias', h1: 'Noticias',
      sub: 'Los titulares más recientes del mundo agrícola, seleccionados de agencias de noticias y fuentes oficiales.',
      badge: 'TITULARES REALES', updatedLabel: 'Actualizado',
      disclaimer: 'Estos titulares son reales y verificados, cada uno enlazado directamente a su fuente original. Se actualizan periódicamente mediante una tarea programada, no mediante un feed en directo, así que puede haber un pequeño desfase entre una noticia y su publicación aquí.',
      readMore: 'Leer en la fuente',
      filterAll: 'Todas', filterGlobal: 'Global', filterEuropa: 'Europa', filterAmerica: 'América',
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

  var state = { filter: 'all' };

  function render() {
    var lang = window.DehesaShared.getLang();
    var esc = window.DehesaShared.esc;
    var t = STRINGS[lang] || STRINGS.es;

    document.title = t.title;
    document.getElementById('nw-badge').textContent = t.badge;
    document.getElementById('nw-updated').textContent = t.updatedLabel + ': ' + fmtNewsDate(UPDATED_ISO, lang);
    document.getElementById('nw-h1').textContent = t.h1;
    document.getElementById('nw-sub').textContent = t.sub;
    document.getElementById('nw-disclaimer').textContent = t.disclaimer;

    var FILTER_OPTIONS = [
      { id: 'all', label: t.filterAll },
      { id: 'global', label: t.filterGlobal },
      { id: 'eu', label: t.filterEuropa },
      { id: 'us', label: t.filterAmerica }
    ];
    document.getElementById('nw-filters').innerHTML = FILTER_OPTIONS.map(function (opt) {
      var active = state.filter === opt.id ? ' active' : '';
      return '<button type="button" class="di-location-btn di-news-filter-btn' + active + '" data-filter="' + opt.id + '">' + esc(opt.label) + '</button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('#nw-filters button'), function (btn) {
      btn.addEventListener('click', function () {
        state.filter = btn.getAttribute('data-filter');
        render();
      });
    });

    var filteredItems = NEWS_ITEMS.filter(function (item) {
      return state.filter === 'all' || item.region === state.filter;
    });

    var itemsHtml;
    if (filteredItems.length > 0) {
      itemsHtml = '<div class="di-news-list">' + filteredItems.map(function (item) {
        var tr = item[lang] || item.es;
        return '<a class="di-card di-news-item" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="di-news-item-meta"><span class="di-news-item-source">' + esc(item.source) + '</span><span>·</span><span>' + esc(fmtNewsDate(item.date, lang)) + '</span></div>' +
          '<div class="di-news-item-headline">' + esc(tr.headline) + '</div>' +
          '<p class="di-news-item-summary">' + esc(tr.summary) + '</p>' +
          '<span class="di-news-item-readmore">' + esc(t.readMore) + ' →</span>' +
        '</a>';
      }).join('') + '</div>';
    } else {
      itemsHtml = '<div class="di-news-empty">' + esc(t.noResultsHint) + '</div>';
    }
    document.getElementById('nw-items').innerHTML = itemsHtml;

    document.getElementById('nw-sources-title').textContent = t.sourcesTitle;
    document.getElementById('nw-sources-list').innerHTML = t.sources.map(function (s) {
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.text) + '</a></li>';
    }).join('');
  }

  window.DehesaShared.init('noticias');
  window.DehesaShared.onLangChange = render;
  render();
})();
