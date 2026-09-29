/* Dehesa Index — página de Información */
(function () {
  'use strict';

  // Fuentes oficiales reales de cada dato, para que cualquiera pueda
  // comprobar de dónde vienen las cifras del panel.
  var URLS = {
    nass: 'https://www.nass.usda.gov/',
    ec: 'https://agridata.ec.europa.eu/extensions/DataPortal/prices.html',
    cme: 'https://www.cmegroup.com/markets/agriculture.html',
    dtn: 'https://www.dtnpf.com/agriculture/web/ag/crops/article/2026/09/23/fertilizer-prices-rise-six-eight',
    ecb: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html'
  };

  var STRINGS = {
    es: {
      title: 'Dehesa Index — Información',
      h1: 'Información',
      sub: 'Quiénes somos, de dónde viene el nombre y cómo construimos el panel de precios.',
      sec1Title: 'Nuestra misión',
      sec1Body: 'Dehesa Index reúne en un solo panel los precios agrícolas de EE. UU. y Europa — cereales, lácteos, ganado, pienso y fertilizantes — para que agricultores, ganaderos, cooperativas y compradores puedan comparar ambos mercados de un vistazo, en la misma moneda y la misma unidad.',
      sec2Title: 'El nombre',
      sec2Body: 'La dehesa es el paisaje agroganadero de la España atlántica y mediterránea — encinas, pasto y ganado en equilibrio con la tierra. Dehesa Index toma ese nombre como punto de partida: un índice de precios con raíces en el campo, pensado para leerse tan fácilmente en Cáceres como en Iowa.',
      sec3Title: 'Fuentes de datos',
      sec3Intro: 'El panel está diseñado para conectarse con fuentes públicas y de mercado reconocidas. Pulsa en cualquiera de ellas para consultar los datos oficiales directamente en origen:',
      sources: [
        { text: 'USDA NASS / AMS (precios agrícolas y lácteos de EE. UU.)', url: URLS.nass },
        { text: 'Comisión Europea — Agri-food Data Portal', url: URLS.ec },
        { text: 'CME Group y Euronext (futuros de materias primas)', url: URLS.cme },
        { text: 'DTN Fertilizer Index', url: URLS.dtn },
        { text: 'Banco Central Europeo (tipos de cambio de referencia)', url: URLS.ecb }
      ],
      disclaimer: 'Los precios que se muestran hoy en el panel son datos de muestra con fines de diseño y producto. El siguiente paso del proyecto es conectar las fuentes en vivo indicadas arriba.',
      apiNotice: 'Los precios de EE. UU. de trigo, maíz y arroz se actualizan cada mes de forma automática desde USDA NASS Quick Stats. This product uses the NASS API but is not endorsed or certified by NASS. Los tipos de cambio EUR/USD y GBP/USD se actualizan cada día laborable desde las cotizaciones de referencia del Banco Central Europeo, que el propio BCE publica solo con fines informativos, no para uso en transacciones.'
    },
    en: {
      title: 'Dehesa Index — Information',
      h1: 'Information',
      sub: 'Who we are, where the name comes from, and how we built the price dashboard.',
      sec1Title: 'Our mission',
      sec1Body: 'Dehesa Index brings U.S. and European farm prices — grains, dairy, livestock, feed and fertilizer — together in one dashboard, so farmers, ranchers, cooperatives and buyers can compare both markets at a glance, in the same currency and the same unit.',
      sec2Title: 'The name',
      sec2Body: 'The "dehesa" is the traditional farming-and-grazing landscape of Atlantic and Mediterranean Spain — holm oaks, pasture and livestock in balance with the land. Dehesa Index takes that name as its starting point: a price index rooted in the countryside, meant to read just as naturally in Cáceres as in Iowa.',
      sec3Title: 'Data sources',
      sec3Intro: 'The dashboard is designed to connect to recognized public and market sources. Click any of them to check the official data at the source:',
      sources: [
        { text: 'USDA NASS / AMS (U.S. farm and dairy prices)', url: URLS.nass },
        { text: 'European Commission — Agri-food Data Portal', url: URLS.ec },
        { text: 'CME Group and Euronext (commodity futures)', url: URLS.cme },
        { text: 'DTN Fertilizer Index', url: URLS.dtn },
        { text: 'European Central Bank (reference exchange rates)', url: URLS.ecb }
      ],
      disclaimer: 'The prices shown on the dashboard today are sample data for design and product purposes. The next step for the project is connecting the live sources listed above.',
      apiNotice: "The U.S. wheat, corn and rice prices are updated automatically every month from USDA NASS Quick Stats. This product uses the NASS API but is not endorsed or certified by NASS. The EUR/USD and GBP/USD exchange rates are updated every business day from the European Central Bank's reference rates, which the ECB itself publishes for information purposes only, not for use in transactions."
    },
    fr: {
      title: 'Dehesa Index — Informations',
      h1: 'Informations',
      sub: "Qui nous sommes, d'où vient le nom et comment nous avons construit le tableau des prix.",
      sec1Title: 'Notre mission',
      sec1Body: "Dehesa Index réunit en un seul tableau de bord les prix agricoles américains et européens — céréales, produits laitiers, bétail, aliments pour animaux et engrais — afin que les agriculteurs, éleveurs, coopératives et acheteurs puissent comparer les deux marchés d'un coup d'œil, dans la même devise et la même unité.",
      sec2Title: 'Le nom',
      sec2Body: "La « dehesa » est le paysage agropastoral traditionnel de l'Espagne atlantique et méditerranéenne — chênes verts, pâturages et bétail en équilibre avec la terre. Dehesa Index reprend ce nom comme point de départ : un indice de prix enraciné dans la campagne, pensé pour se lire aussi naturellement à Cáceres que dans l'Iowa.",
      sec3Title: 'Sources des données',
      sec3Intro: "Le tableau de bord est conçu pour se connecter à des sources publiques et de marché reconnues. Cliquez sur l'une d'elles pour consulter les données officielles à la source :",
      sources: [
        { text: 'USDA NASS / AMS (prix agricoles et laitiers américains)', url: URLS.nass },
        { text: 'Commission européenne — Agri-food Data Portal', url: URLS.ec },
        { text: 'CME Group et Euronext (contrats à terme sur matières premières)', url: URLS.cme },
        { text: 'DTN Fertilizer Index', url: URLS.dtn },
        { text: 'Banque centrale européenne (taux de change de référence)', url: URLS.ecb }
      ],
      disclaimer: 'Les prix actuellement affichés sur le tableau de bord sont des données fictives à des fins de conception et de produit. La prochaine étape du projet consiste à connecter les sources en direct mentionnées ci-dessus.',
      apiNotice: "Les prix américains du blé, du maïs et du riz sont mis à jour automatiquement chaque mois depuis USDA NASS Quick Stats. This product uses the NASS API but is not endorsed or certified by NASS. Les taux EUR/USD et GBP/USD sont mis à jour chaque jour ouvré à partir des taux de référence de la Banque centrale européenne, publiés par la BCE à titre purement informatif, non destinés à des transactions."
    },
    it: {
      title: 'Dehesa Index — Informazioni',
      h1: 'Informazioni',
      sub: 'Chi siamo, da dove viene il nome e come abbiamo costruito il pannello dei prezzi.',
      sec1Title: 'La nostra missione',
      sec1Body: "Dehesa Index riunisce in un unico pannello i prezzi agricoli di Stati Uniti ed Europa — cereali, lattiero-caseario, bestiame, mangimi e fertilizzanti — così che agricoltori, allevatori, cooperative e acquirenti possano confrontare entrambi i mercati a colpo d'occhio, nella stessa valuta e nella stessa unità di misura.",
      sec2Title: 'Il nome',
      sec2Body: 'La "dehesa" è il paesaggio agro-pastorale tradizionale della Spagna atlantica e mediterranea — querce da sughero, pascolo e bestiame in equilibrio con la terra. Dehesa Index prende questo nome come punto di partenza: un indice dei prezzi con radici nella campagna, pensato per leggersi con la stessa naturalezza a Cáceres come in Iowa.',
      sec3Title: 'Fonti dei dati',
      sec3Intro: 'Il pannello è progettato per collegarsi a fonti pubbliche e di mercato riconosciute. Clicca su una qualsiasi di esse per consultare i dati ufficiali direttamente alla fonte:',
      sources: [
        { text: 'USDA NASS / AMS (prezzi agricoli e lattiero-caseari statunitensi)', url: URLS.nass },
        { text: 'Commissione europea — Agri-food Data Portal', url: URLS.ec },
        { text: 'CME Group ed Euronext (futures sulle materie prime)', url: URLS.cme },
        { text: 'DTN Fertilizer Index', url: URLS.dtn },
        { text: 'Banca Centrale Europea (tassi di cambio di riferimento)', url: URLS.ecb }
      ],
      disclaimer: 'I prezzi mostrati oggi nel pannello sono dati campione a scopo di progettazione e di prodotto. Il prossimo passo del progetto è collegare le fonti in tempo reale indicate sopra.',
      apiNotice: "I prezzi statunitensi di grano, mais e riso vengono aggiornati automaticamente ogni mese da USDA NASS Quick Stats. This product uses the NASS API but is not endorsed or certified by NASS. I tassi EUR/USD e GBP/USD vengono aggiornati ogni giorno lavorativo dai tassi di riferimento della Banca Centrale Europea, pubblicati dalla BCE a solo scopo informativo, non per l'uso in transazioni."
    }
  };

  function render() {
    var lang = window.DehesaShared.getLang();
    var esc = window.DehesaShared.esc;
    var t = STRINGS[lang] || STRINGS.es;

    document.title = t.title;
    document.getElementById('inf-h1').textContent = t.h1;
    document.getElementById('inf-sub').textContent = t.sub;
    document.getElementById('inf-sec1-title').textContent = t.sec1Title;
    document.getElementById('inf-sec1-body').textContent = t.sec1Body;
    document.getElementById('inf-sec2-title').textContent = t.sec2Title;
    document.getElementById('inf-sec2-body').textContent = t.sec2Body;
    document.getElementById('inf-sec3-title').textContent = t.sec3Title;
    document.getElementById('inf-sec3-intro').textContent = t.sec3Intro;
    document.getElementById('inf-sources-list').innerHTML = t.sources.map(function (s) {
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.text) + '</a></li>';
    }).join('');
    document.getElementById('inf-disclaimer').textContent = t.disclaimer;
    document.getElementById('inf-api-notice').textContent = t.apiNotice;
  }

  window.DehesaShared.init('informacion');
  window.DehesaShared.onLangChange = render;
  render();
})();
