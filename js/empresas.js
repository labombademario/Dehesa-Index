/* Dehesa Index — Empresas (landing honesta para la futura API) */
(function () {
  'use strict';

  var STRINGS = {
    es: {
      title: 'Empresas | Dehesa Index',
      badge: 'PARA EMPRESAS',
      h1: 'Datos agrícolas listos para integrar en tu operación',
      sub: 'Dehesa Index está construyendo una API de precios agrícolas por producto y región — pensada para quien necesita estos datos dentro de su propio sistema, no solo en una web para consultar a mano.',
      whatTitle: 'QUÉ HAY DETRÁS',
      whatP1: 'El panel público ya cubre 18 líneas de producto (cereales, ganado, lácteos, fertilizantes, pienso, vino a granel) en EE. UU., Europa, Reino Unido y Canadá, con desglose por país dentro de la UE (Alemania, Francia, España, Italia) y hasta 5 años de histórico diario simulado por producto y región.',
      whatP2: 'La API llevará ese mismo modelo interno de datos — cada precio identificado por producto y región — a un formato pensado para integrarse en hojas de cálculo, ERPs o sistemas de gestión de riesgo, en lugar de tener que copiarlo a mano desde el panel.',
      stats: [
        { value: '18', label: 'líneas de producto' },
        { value: '2', label: 'regiones (EE. UU., Europa, Reino Unido y Canadá)' },
        { value: '5', label: 'años de histórico por producto' }
      ],
      audienceTitle: 'PENSADO PARA',
      audiences: [
        { name: 'Cooperativas agrícolas', desc: 'Seguimiento de precios de referencia para decisiones de compra y venta con sus socios.' },
        { name: 'Traders y brokers', desc: 'Datos estructurados por producto y región para alimentar sus propios modelos.' },
        { name: 'Bancos y aseguradoras', desc: 'Contexto de mercado para financiación agrícola y seguro de cosecha.' },
        { name: 'Fabricantes de fertilizantes y pienso', desc: 'Vigilancia de precios de insumos y de los productos que dependen de ellos.' },
        { name: 'Empresas de alimentación', desc: 'Previsión de costes de materia prima ligados al campo.' },
        { name: 'Medios y analistas', desc: 'Series de datos citables para informes y artículos de mercado.' }
      ],
      apiTitle: 'QUÉ INCLUIRÁ LA API',
      apiStatusBadge: 'En fase de diseño — aún no disponible',
      apiFeatures: [
        'Precios actuales e histórico completo por producto y región, en JSON y CSV.',
        'Actualización con la misma cadencia que el panel público (diaria/semanal según producto).',
        'Filtrado por país dentro de Europa y por tipo de precio (referencia, futuro, índice, lonja).',
        'Webhooks o alertas automatizadas cuando un precio cruza un umbral.',
        'Documentación y ejemplos de integración en los lenguajes más comunes.'
      ],
      ctaTitle: 'Avísanos de tu interés',
      ctaBody: 'Todavía no hay backend construido ni fecha de lanzamiento fija — este proyecto está priorizando qué construir según quién lo pide. Escríbenos contándonos qué datos necesitarías y te avisamos en cuanto la API esté lista, con prioridad para quien ya se haya puesto en contacto.',
      ctaButton: 'Escribir a hola@dehesaindex.com',
      ctaSubject: 'Interes%20en%20la%20API%20de%20Dehesa%20Index',
      ctaNote: 'Sin formularios ni registros falsos: un correo real, a una dirección real, que leemos nosotros.'
    },
    en: {
      title: 'Business | Dehesa Index',
      badge: 'FOR BUSINESSES',
      h1: 'Agricultural data ready to plug into your operation',
      sub: "Dehesa Index is building a price API by product and region — built for teams that need this data inside their own systems, not just a dashboard to check by hand.",
      whatTitle: "WHAT'S BEHIND IT",
      whatP1: 'The public dashboard already covers 18 product lines (grains, livestock, dairy, fertilizer, feed, bulk wine) across the US and Europe, broken down by country within the EU (Germany, France, Spain, Italy), with up to 5 years of simulated daily history per product and region.',
      whatP2: 'The API will bring that same internal data model — every price identified by product and region — into a format meant to plug into spreadsheets, ERPs or risk-management systems, instead of copying it by hand from the dashboard.',
      stats: [
        { value: '18', label: 'product lines' },
        { value: '2', label: 'regions (US and Europe)' },
        { value: '5', label: 'years of history per product' }
      ],
      audienceTitle: 'BUILT FOR',
      audiences: [
        { name: 'Agricultural cooperatives', desc: 'Tracking reference prices for buy/sell decisions with their members.' },
        { name: 'Traders and brokers', desc: 'Structured data by product and region to feed their own models.' },
        { name: 'Banks and insurers', desc: 'Market context for agricultural lending and crop insurance.' },
        { name: 'Fertilizer and feed manufacturers', desc: 'Watching input prices and the products that depend on them.' },
        { name: 'Food companies', desc: 'Forecasting raw-material costs tied to the farm.' },
        { name: 'Media and analysts', desc: 'Citable data series for market reports and articles.' }
      ],
      apiTitle: 'WHAT THE API WILL INCLUDE',
      apiStatusBadge: 'In design — not available yet',
      apiFeatures: [
        'Current prices and full history by product and region, in JSON and CSV.',
        'Updated at the same cadence as the public dashboard (daily/weekly depending on product).',
        'Filtering by country within Europe and by price type (reference, future, index, market).',
        'Webhooks or automated alerts when a price crosses a threshold.',
        'Documentation and integration examples in common languages.'
      ],
      ctaTitle: "Let us know you're interested",
      ctaBody: "There's no backend built yet and no fixed launch date — this project is prioritizing what to build based on who asks for it. Tell us what data you'd need and we'll let you know as soon as the API is ready, with priority for whoever reached out first.",
      ctaButton: 'Email hola@dehesaindex.com',
      ctaSubject: 'Interest%20in%20the%20Dehesa%20Index%20API',
      ctaNote: 'No forms or fake sign-ups: a real email, to a real address, that we read ourselves.'
    },
    fr: {
      title: 'Entreprises | Dehesa Index',
      badge: 'POUR LES ENTREPRISES',
      h1: 'Des données agricoles prêtes à intégrer dans votre activité',
      sub: "Dehesa Index construit une API de prix agricoles par produit et par région — pensée pour ceux qui ont besoin de ces données dans leurs propres systèmes, pas seulement d'un tableau de bord à consulter à la main.",
      whatTitle: 'CE QUI EST DÉJÀ LÀ',
      whatP1: "Le tableau de bord public couvre déjà 18 lignes de produits (céréales, élevage, produits laitiers, engrais, aliments pour bétail, vin en vrac) aux États-Unis, en Europe, au Royaume-Uni et au Canada, avec une répartition par pays au sein de l'UE (Allemagne, France, Espagne, Italie) et jusqu'à 5 ans d'historique quotidien simulé par produit et région.",
      whatP2: "L'API reprendra ce même modèle de données interne — chaque prix identifié par produit et région — dans un format pensé pour s'intégrer dans des tableurs, des ERP ou des systèmes de gestion des risques, plutôt que de devoir le recopier à la main depuis le tableau de bord.",
      stats: [
        { value: '18', label: 'lignes de produits' },
        { value: '2', label: 'régions (États-Unis, Europe, Royaume-Uni et Canada)' },
        { value: '5', label: "ans d'historique par produit" }
      ],
      audienceTitle: 'CONÇU POUR',
      audiences: [
        { name: 'Coopératives agricoles', desc: "Suivi des prix de référence pour les décisions d'achat/vente avec leurs adhérents." },
        { name: 'Traders et courtiers', desc: 'Données structurées par produit et région pour alimenter leurs propres modèles.' },
        { name: 'Banques et assureurs', desc: "Contexte de marché pour le financement agricole et l'assurance récolte." },
        { name: "Fabricants d'engrais et d'aliments pour bétail", desc: 'Suivi des prix des intrants et des produits qui en dépendent.' },
        { name: 'Entreprises agroalimentaires', desc: 'Prévision des coûts de matières premières liées au champ.' },
        { name: 'Médias et analystes', desc: 'Séries de données citables pour rapports et articles de marché.' }
      ],
      apiTitle: "CE QUE L'API INCLURA",
      apiStatusBadge: 'En conception — pas encore disponible',
      apiFeatures: [
        'Prix actuels et historique complet par produit et région, en JSON et CSV.',
        'Mise à jour au même rythme que le tableau de bord public (quotidien/hebdomadaire selon le produit).',
        "Filtrage par pays au sein de l'Europe et par type de prix (référence, futur, indice, marché).",
        'Webhooks ou alertes automatisées quand un prix franchit un seuil.',
        "Documentation et exemples d'intégration dans les langages les plus courants."
      ],
      ctaTitle: 'Dites-nous que vous êtes intéressé',
      ctaBody: "Il n'y a pas encore de backend construit ni de date de lancement fixe — ce projet priorise ce qu'il construit selon qui le demande. Dites-nous quelles données vous seraient utiles et nous vous préviendrons dès que l'API sera prête, en priorité pour ceux qui nous auront déjà contactés.",
      ctaButton: 'Écrire à hola@dehesaindex.com',
      ctaSubject: 'Interet%20pour%20l%27API%20Dehesa%20Index',
      ctaNote: 'Pas de formulaire ni de fausse inscription : un vrai e-mail, à une vraie adresse, que nous lisons nous-mêmes.'
    },
    it: {
      title: 'Aziende | Dehesa Index',
      badge: 'PER LE AZIENDE',
      h1: 'Dati agricoli pronti da integrare nella tua attività',
      sub: "Dehesa Index sta costruendo un'API di prezzi agricoli per prodotto e regione — pensata per chi ha bisogno di questi dati dentro i propri sistemi, non solo di una dashboard da consultare a mano.",
      whatTitle: "COSA C'È DIETRO",
      whatP1: "La dashboard pubblica copre già 18 linee di prodotto (cereali, bestiame, lattiero-caseario, fertilizzanti, mangimi, vino sfuso) negli Stati Uniti e in Europa, con ripartizione per paese all'interno dell'UE (Germania, Francia, Spagna, Italia) e fino a 5 anni di storico giornaliero simulato per prodotto e regione.",
      whatP2: "L'API porterà questo stesso modello di dati interno — ogni prezzo identificato per prodotto e regione — in un formato pensato per integrarsi in fogli di calcolo, ERP o sistemi di gestione del rischio, invece di doverlo copiare a mano dalla dashboard.",
      stats: [
        { value: '18', label: 'linee di prodotto' },
        { value: '2', label: 'regioni (Stati Uniti, Europa, Regno Unito e Canada)' },
        { value: '5', label: 'anni di storico per prodotto' }
      ],
      audienceTitle: 'PENSATO PER',
      audiences: [
        { name: 'Cooperative agricole', desc: 'Monitoraggio dei prezzi di riferimento per le decisioni di acquisto/vendita con i soci.' },
        { name: 'Trader e broker', desc: 'Dati strutturati per prodotto e regione da usare nei propri modelli.' },
        { name: 'Banche e assicurazioni', desc: "Contesto di mercato per il credito agricolo e l'assicurazione del raccolto." },
        { name: 'Produttori di fertilizzanti e mangimi', desc: 'Monitoraggio dei prezzi degli input e dei prodotti che ne dipendono.' },
        { name: 'Aziende alimentari', desc: 'Previsione dei costi delle materie prime legate al campo.' },
        { name: 'Media e analisti', desc: 'Serie di dati citabili per report e articoli di mercato.' }
      ],
      apiTitle: "COSA INCLUDERÀ L'API",
      apiStatusBadge: 'In fase di progettazione — non ancora disponibile',
      apiFeatures: [
        'Prezzi attuali e storico completo per prodotto e regione, in JSON e CSV.',
        'Aggiornamento con la stessa cadenza della dashboard pubblica (giornaliera/settimanale a seconda del prodotto).',
        "Filtro per paese all'interno dell'Europa e per tipo di prezzo (riferimento, future, indice, mercato).",
        'Webhook o avvisi automatici quando un prezzo supera una soglia.',
        'Documentazione ed esempi di integrazione nei linguaggi più comuni.'
      ],
      ctaTitle: 'Facci sapere il tuo interesse',
      ctaBody: "Non esiste ancora un backend costruito né una data di lancio fissa — questo progetto sta dando priorità a cosa costruire in base a chi lo richiede. Scrivici quali dati ti servirebbero e ti avviseremo non appena l'API sarà pronta, con priorità per chi ci ha già contattato.",
      ctaButton: 'Scrivi a hola@dehesaindex.com',
      ctaSubject: 'Interesse%20per%20l%27API%20di%20Dehesa%20Index',
      ctaNote: 'Nessun modulo o falsa iscrizione: una vera email, a un indirizzo vero, che leggiamo di persona.'
    }
  };

  function render() {
    var lang = window.DehesaShared.getLang();
    var esc = window.DehesaShared.esc;
    var t = STRINGS[lang] || STRINGS.es;

    document.title = t.title;
    document.getElementById('em-badge').textContent = t.badge;
    document.getElementById('em-h1').textContent = t.h1;
    document.getElementById('em-sub').textContent = t.sub;

    document.getElementById('em-what-title').textContent = t.whatTitle;
    document.getElementById('em-what-p1').textContent = t.whatP1;
    document.getElementById('em-what-p2').textContent = t.whatP2;
    document.getElementById('em-stats').innerHTML = t.stats.map(function (s) {
      return '<div class="di-emp-stat"><div class="di-emp-stat-value">' + esc(s.value) + '</div><div class="di-emp-stat-label">' + esc(s.label) + '</div></div>';
    }).join('');

    document.getElementById('em-audience-title').textContent = t.audienceTitle;
    document.getElementById('em-audience-grid').innerHTML = t.audiences.map(function (a) {
      return '<div class="di-card di-emp-audience-card"><div class="di-emp-audience-name">' + esc(a.name) + '</div><div class="di-emp-audience-desc">' + esc(a.desc) + '</div></div>';
    }).join('');

    document.getElementById('em-api-title').textContent = t.apiTitle;
    document.getElementById('em-api-status').textContent = t.apiStatusBadge;
    document.getElementById('em-api-features').innerHTML = t.apiFeatures.map(function (f) {
      return '<div class="di-emp-api-feature"><span class="di-emp-api-arrow">→</span><span>' + esc(f) + '</span></div>';
    }).join('');

    document.getElementById('em-cta-title').textContent = t.ctaTitle;
    document.getElementById('em-cta-body').textContent = t.ctaBody;
    var ctaBtn = document.getElementById('em-cta-button');
    ctaBtn.textContent = t.ctaButton + ' ↗';
    ctaBtn.setAttribute('href', 'mailto:hola@dehesaindex.com?subject=' + t.ctaSubject);
    document.getElementById('em-cta-note').textContent = t.ctaNote;
  }

  window.DehesaShared.init('empresas');
  window.DehesaShared.onLangChange = render;
  render();
})();
