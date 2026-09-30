/* Dehesa Index — página de Información */
(function () {
  'use strict';

  // Fuentes oficiales reales de cada dato, para que cualquiera pueda
  // comprobar de dónde vienen las cifras del panel.
  var URLS = {
    nass: 'https://www.nass.usda.gov/',
    ec: 'https://agridata.ec.europa.eu/extensions/DataPortal/prices.html',
    defra: 'https://www.gov.uk/government/collections/agriculture-in-the-united-kingdom',
    statcan: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210007701',
    eurostat: 'https://ec.europa.eu/eurostat/web/agriculture/database',
    eia: 'https://www.eia.gov/petroleum/gasdiesel/',
    wb: 'https://www.worldbank.org/en/research/commodity-markets',
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
      sec3Intro: 'Todas las cifras que muestra el panel vienen de estas fuentes oficiales. Pulsa en cualquiera para consultar el dato en origen; la página de Metodología explica cómo se usa cada una:',
      sources: [
        { text: 'USDA NASS (precios recibidos por el productor en EE. UU.)', url: URLS.nass },
        { text: 'Comisión Europea — Agri-food Data Portal (precios UE) y Oil Bulletin (diésel)', url: URLS.ec },
        { text: 'Defra (Reino Unido: leche e índices de precios agrarios, Open Government Licence v3.0)', url: URLS.defra },
        { text: 'Statistics Canada (Canadá: precios agrícolas mensuales por provincia, Open Government Licence – Canada)', url: URLS.statcan },
        { text: 'Alberta Agriculture and Irrigation (Canadá: informes semanales de mercado de cultivos y ganado, Open Government Licence – Alberta)', url: 'https://open.alberta.ca/publications/3479492' },
        { text: 'Statistics Denmark (Dinamarca (precios agrícolas mensuales, CC BY 4.0))', url: 'https://www.statbank.dk/' },
        { text: 'MAPA (España (precios percibidos y pagados desde 1990 y RECAN, CC BY 4.0))', url: 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido' },
        { text: 'FranceAgriMer (Francia (Licence Ouverte 2.0))', url: 'https://visionet.franceagrimer.fr/' },
        { text: 'BLE y Destatis (Alemania (dl-de/by-2.0 y dl-de/zero-2.0))', url: 'https://open-data.ble.de/' },
        { text: 'Statbel (Bélgica, open data: reutilización libre citando la fuente)', url: 'https://statbel.fgov.be/en/open-data' },
        { text: 'Statistics Netherlands (CBS StatLine, CC BY 4.0)', url: 'https://opendata.cbs.nl/' },
        { text: 'Australian Bureau of Statistics (ABS Data API, CC BY 4.0)', url: 'https://www.abs.gov.au/' },
        { text: 'Eurostat (índices de precios agrarios de la UE)', url: URLS.eurostat },
        { text: 'EIA (diésel en EE. UU.) y Banco Mundial (urea)', url: URLS.eia },
        { text: 'Banco Central Europeo (tipos de cambio de referencia)', url: URLS.ecb },
        { text: 'USDA FAS — PSD Online (CC BY 4.0)', url: 'https://apps.fas.usda.gov/psdonline/' },
        { text: 'NASA POWER', url: 'https://power.larc.nasa.gov/' }
      ],
      disclaimer: 'Dehesa Index solo muestra un valor cuando se ha podido verificar en su fuente oficial, con su fecha. Lo que aún no tiene fuente verificada aparece como «pendiente» y sin cifra. Es información, no asesoramiento de inversión.',
      apiNotice: 'Los precios de EE. UU. proceden de USDA NASS Quick Stats y se consultan cada semana (NASS publica una vez al mes). This product uses the NASS API but is not endorsed or certified by NASS. Los tipos de cambio se actualizan cada día laborable con las cotizaciones de referencia del Banco Central Europeo, que las publica solo con fines informativos.'
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
      sec3Intro: 'Every figure on the dashboard comes from these official sources. Click any of them to check the data at the source; the Methodology page explains how each one is used:',
      sources: [
        { text: 'USDA NASS (U.S. prices received by farmers)', url: URLS.nass },
        { text: 'European Commission — Agri-food Data Portal (EU prices) and Oil Bulletin (diesel)', url: URLS.ec },
        { text: 'Defra (UK: milk and agricultural price indices, Open Government Licence v3.0)', url: URLS.defra },
        { text: 'Statistics Canada (Canada: monthly farm product prices by province, Open Government Licence – Canada)', url: URLS.statcan },
        { text: 'Alberta Agriculture and Irrigation (Canada: weekly crop and livestock market reviews, Open Government Licence – Alberta)', url: 'https://open.alberta.ca/publications/3479492' },
        { text: 'Statistics Denmark (Denmark (monthly farm prices, CC BY 4.0))', url: 'https://www.statbank.dk/' },
        { text: 'MAPA (Spain (prices received and paid since 1990 and RECAN, CC BY 4.0))', url: 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido' },
        { text: 'FranceAgriMer (France (Licence Ouverte 2.0))', url: 'https://visionet.franceagrimer.fr/' },
        { text: 'BLE y Destatis (Germany (dl-de/by-2.0 y dl-de/zero-2.0))', url: 'https://open-data.ble.de/' },
        { text: 'Statbel (Belgium, open data: free reuse, source cited)', url: 'https://statbel.fgov.be/en/open-data' },
        { text: 'Statistics Netherlands (CBS StatLine, CC BY 4.0)', url: 'https://opendata.cbs.nl/' },
        { text: 'Australian Bureau of Statistics (ABS Data API, CC BY 4.0)', url: 'https://www.abs.gov.au/' },
        { text: 'Eurostat (EU agricultural price indices)', url: URLS.eurostat },
        { text: 'EIA (U.S. diesel) and World Bank (urea)', url: URLS.eia },
        { text: 'European Central Bank (reference exchange rates)', url: URLS.ecb },
        { text: 'USDA FAS — PSD Online (CC BY 4.0)', url: 'https://apps.fas.usda.gov/psdonline/' },
        { text: 'NASA POWER', url: 'https://power.larc.nasa.gov/' }
      ],
      disclaimer: 'Dehesa Index only shows a value once it has been verified at its official source, with its date. Anything without a verified source appears as “pending” with no figure. This is information, not investment advice.',
      apiNotice: 'U.S. prices come from USDA NASS Quick Stats and are checked every week (NASS publishes once a month). This product uses the NASS API but is not endorsed or certified by NASS. Exchange rates are updated every business day from the European Central Bank reference rates, which the ECB publishes for information purposes only.'
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
      sec3Intro: 'Tous les chiffres du tableau de bord proviennent de ces sources officielles. Cliquez sur l\'une d\'elles pour consulter la donnée à la source ; la page Méthodologie explique l\'usage de chacune :',
      sources: [
        { text: 'USDA NASS (prix reçus par les agriculteurs aux États-Unis)', url: URLS.nass },
        { text: 'Commission européenne — Agri-food Data Portal (prix UE) et Oil Bulletin (diesel)', url: URLS.ec },
        { text: 'Defra (Royaume-Uni : lait et indices des prix agricoles, Open Government Licence v3.0)', url: URLS.defra },
        { text: 'Statistique Canada (Canada : prix des produits agricoles, mensuels par province, Licence du gouvernement ouvert – Canada)', url: URLS.statcan },
        { text: 'Alberta Agriculture and Irrigation (Canada : revues hebdomadaires des marchés des cultures et du bétail, Open Government Licence – Alberta)', url: 'https://open.alberta.ca/publications/3479492' },
        { text: 'Statistics Denmark (Danemark (prix agricoles mensuels, CC BY 4.0))', url: 'https://www.statbank.dk/' },
        { text: 'MAPA (Espagne (prix reçus et payés depuis 1990 et RECAN, CC BY 4.0))', url: 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido' },
        { text: 'FranceAgriMer (France (Licence Ouverte 2.0))', url: 'https://visionet.franceagrimer.fr/' },
        { text: 'BLE y Destatis (Allemagne (dl-de/by-2.0 y dl-de/zero-2.0))', url: 'https://open-data.ble.de/' },
        { text: 'Statbel (Belgique, données ouvertes : réutilisation libre, source citée)', url: 'https://statbel.fgov.be/en/open-data' },
        { text: 'Statistics Netherlands (CBS StatLine, CC BY 4.0)', url: 'https://opendata.cbs.nl/' },
        { text: 'Australian Bureau of Statistics (ABS Data API, CC BY 4.0)', url: 'https://www.abs.gov.au/' },
        { text: 'Eurostat (indices des prix agricoles de l\'UE)', url: URLS.eurostat },
        { text: 'EIA (diesel aux États-Unis) et Banque mondiale (urée)', url: URLS.eia },
        { text: 'Banque centrale européenne (taux de change de référence)', url: URLS.ecb },
        { text: 'USDA FAS — PSD Online (CC BY 4.0)', url: 'https://apps.fas.usda.gov/psdonline/' },
        { text: 'NASA POWER', url: 'https://power.larc.nasa.gov/' }
      ],
      disclaimer: 'Dehesa Index n\'affiche une valeur que lorsqu\'elle a pu être vérifiée à sa source officielle, avec sa date. Ce qui n\'a pas encore de source vérifiée apparaît « en attente », sans chiffre. Information, non conseil en investissement.',
      apiNotice: 'Les prix américains proviennent d\'USDA NASS Quick Stats et sont consultés chaque semaine (NASS publie une fois par mois). This product uses the NASS API but is not endorsed or certified by NASS. Les taux de change sont mis à jour chaque jour ouvré à partir des taux de référence de la Banque centrale européenne, publiés à titre informatif uniquement.'
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
      sec3Intro: 'Tutte le cifre del pannello provengono da queste fonti ufficiali. Clicca su una di esse per consultare il dato all\'origine; la pagina Metodologia spiega come si usa ciascuna:',
      sources: [
        { text: 'USDA NASS (prezzi ricevuti dagli agricoltori negli USA)', url: URLS.nass },
        { text: 'Commissione europea — Agri-food Data Portal (prezzi UE) e Oil Bulletin (gasolio)', url: URLS.ec },
        { text: 'Defra (Regno Unito: latte e indici dei prezzi agricoli, Open Government Licence v3.0)', url: URLS.defra },
        { text: 'Statistics Canada (Canada: prezzi agricoli mensili per provincia, Open Government Licence – Canada)', url: URLS.statcan },
        { text: 'Alberta Agriculture and Irrigation (Canada: rassegne settimanali dei mercati di colture e bestiame, Open Government Licence – Alberta)', url: 'https://open.alberta.ca/publications/3479492' },
        { text: 'Statistics Denmark (Danimarca (prezzi agricoli mensili, CC BY 4.0))', url: 'https://www.statbank.dk/' },
        { text: 'MAPA (Spagna (prezzi ricevuti e pagati dal 1990 e RECAN, CC BY 4.0))', url: 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido' },
        { text: 'FranceAgriMer (Francia (Licence Ouverte 2.0))', url: 'https://visionet.franceagrimer.fr/' },
        { text: 'BLE y Destatis (Germania (dl-de/by-2.0 y dl-de/zero-2.0))', url: 'https://open-data.ble.de/' },
        { text: 'Statbel (Belgio, dati aperti: riutilizzo libero, con citazione della fonte)', url: 'https://statbel.fgov.be/en/open-data' },
        { text: 'Statistics Netherlands (CBS StatLine, CC BY 4.0)', url: 'https://opendata.cbs.nl/' },
        { text: 'Australian Bureau of Statistics (ABS Data API, CC BY 4.0)', url: 'https://www.abs.gov.au/' },
        { text: 'Eurostat (indici dei prezzi agricoli dell\'UE)', url: URLS.eurostat },
        { text: 'EIA (gasolio negli USA) e Banca mondiale (urea)', url: URLS.eia },
        { text: 'Banca centrale europea (tassi di cambio di riferimento)', url: URLS.ecb },
        { text: 'USDA FAS — PSD Online (CC BY 4.0)', url: 'https://apps.fas.usda.gov/psdonline/' },
        { text: 'NASA POWER', url: 'https://power.larc.nasa.gov/' }
      ],
      disclaimer: 'Dehesa Index mostra un valore solo quando è stato verificato alla fonte ufficiale, con la sua data. Ciò che non ha ancora una fonte verificata appare «in attesa», senza cifra. Informazione, non consulenza di investimento.',
      apiNotice: 'I prezzi USA provengono da USDA NASS Quick Stats e vengono controllati ogni settimana (NASS pubblica una volta al mese). This product uses the NASS API but is not endorsed or certified by NASS. I tassi di cambio sono aggiornati ogni giorno lavorativo dai tassi di riferimento della Banca centrale europea, pubblicati solo a scopo informativo.'
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
