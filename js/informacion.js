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

  var UI = {
    es: { byCountry: 'Por país', all: 'Todas', src: ['fuente', 'fuentes'], pending: 'licencia pendiente de confirmar', lic: 'Licencia', G: { US: 'Estados Unidos', EU: 'Unión Europea', UK: 'Reino Unido', CA: 'Canadá', ES: 'España', FR: 'Francia', DE: 'Alemania', PT: 'Portugal', BE: 'Bélgica', NL: 'Países Bajos', AT: 'Austria', DK: 'Dinamarca', AU: 'Australia', MX: 'México', INT: 'Internacional' } },
    en: { byCountry: 'By country', all: 'All', src: ['source', 'sources'], pending: 'licence to be confirmed', lic: 'Licence', G: { US: 'United States', EU: 'European Union', UK: 'United Kingdom', CA: 'Canada', ES: 'Spain', FR: 'France', DE: 'Germany', PT: 'Portugal', BE: 'Belgium', NL: 'Netherlands', AT: 'Austria', DK: 'Denmark', AU: 'Australia', MX: 'Mexico', INT: 'International' } },
    fr: { byCountry: 'Par pays', all: 'Toutes', src: ['source', 'sources'], pending: 'licence à confirmer', lic: 'Licence', G: { US: 'États-Unis', EU: 'Union européenne', UK: 'Royaume-Uni', CA: 'Canada', ES: 'Espagne', FR: 'France', DE: 'Allemagne', PT: 'Portugal', BE: 'Belgique', NL: 'Pays-Bas', AT: 'Autriche', DK: 'Danemark', AU: 'Australie', MX: 'Mexique', INT: 'International' } },
    it: { byCountry: 'Per paese', all: 'Tutte', src: ['fonte', 'fonti'], pending: 'licenza da confermare', lic: 'Licenza', G: { US: 'Stati Uniti', EU: 'Unione europea', UK: 'Regno Unito', CA: 'Canada', ES: 'Spagna', FR: 'Francia', DE: 'Germania', PT: 'Portogallo', BE: 'Belgio', NL: 'Paesi Bassi', AT: 'Austria', DK: 'Danimarca', AU: 'Australia', MX: 'Messico', INT: 'Internazionale' } }
  };
  var ORDER = ['US', 'EU', 'UK', 'CA', 'ES', 'FR', 'DE', 'PT', 'BE', 'NL', 'AT', 'DK', 'AU', 'MX', 'INT'];
  var FLAG = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CA: '🇨🇦', ES: '🇪🇸', FR: '🇫🇷', DE: '🇩🇪', PT: '🇵🇹', BE: '🇧🇪', NL: '🇳🇱', AT: '🇦🇹', DK: '🇩🇰', AU: '🇦🇺', MX: '🇲🇽', INT: '🌐' };
  var VIEW = 'country';

  function srcItem(r, u, esc) {
    var lic = r.p ? '<span class="di-src-lic di-src-lic-pend">' + esc(u.pending) + '</span>'
      : '<span class="di-src-lic">' + esc(u.lic) + ': ' + (r.lu ? '<a href="' + esc(r.lu) + '" target="_blank" rel="noopener noreferrer">' + esc(r.l) + '</a>' : esc(r.l)) + '</span>';
    return '<li><a href="' + esc(r.u) + '" target="_blank" rel="noopener noreferrer">' + esc(r.n) + '</a> ' + lic + '</li>';
  }

  function renderSources(lang) {
    var esc = window.DehesaShared.esc, u = UI[lang] || UI.es, rows = window.DEHESA_SOURCES || [], box = document.getElementById('inf-sources-list');
    var tabs = document.getElementById('inf-src-tabs');
    tabs.innerHTML = [['country', u.byCountry], ['all', u.all + ' (' + rows.length + ')']].map(function (b) {
      return '<button type="button" class="di-src-tab" data-v="' + b[0] + '" aria-pressed="' + (VIEW === b[0]) + '">' + esc(b[1]) + '</button>';
    }).join('');
    if (VIEW === 'all') {
      var sorted = rows.slice().sort(function (a, b) { return a.n.localeCompare(b.n); });
      box.innerHTML = '<ul class="di-info-list di-src-flat">' + sorted.map(function (r) { return srcItem(r, u, esc); }).join('') + '</ul>';
    } else {
      box.innerHTML = ORDER.map(function (c) {
        var g = rows.filter(function (r) { return r.c === c; });
        if (!g.length) return '';
        return '<details class="di-src-group"><summary><span class="di-src-flag" aria-hidden="true">' + FLAG[c] + '</span> ' + esc(u.G[c]) + ' <span class="di-src-count">' + g.length + ' ' + (g.length === 1 ? u.src[0] : u.src[1]) + '</span></summary><ul class="di-info-list">' + g.map(function (r) { return srcItem(r, u, esc); }).join('') + '</ul></details>';
      }).join('');
    }
  }

  var STRINGS = {
    es: {
      title: 'Información | Dehesa Index',
      h1: 'Información',
      sub: 'Quiénes somos, de dónde viene el nombre y cómo construimos el panel de precios.',
      sec1Title: 'Nuestra misión',
      sec1Body: 'Dehesa Index reúne en un solo panel los precios agrícolas de EE. UU., Europa, Reino Unido y Canadá, más estadísticas oficiales de más países — cereales, lácteos, ganado, pienso y fertilizantes — para que agricultores, ganaderos, cooperativas y compradores puedan comparar ambos mercados de un vistazo, en la misma moneda y la misma unidad.',
      sec2Title: 'El nombre',
      sec2Body: 'La dehesa es el paisaje agroganadero de la España atlántica y mediterránea — encinas, pasto y ganado en equilibrio con la tierra. Dehesa Index toma ese nombre como punto de partida: un índice de precios con raíces en el campo, pensado para leerse tan fácilmente en Cáceres como en Iowa.',
      sec3Title: 'Fuentes de datos',
      sec3Intro: 'Todas las cifras del panel vienen de fuentes oficiales. Aquí tienes las {n} que usamos hoy, agrupadas por país; pulsa en cualquiera para consultar el dato en origen. La página de Metodología explica cómo se usa cada una:',
      disclaimer: 'Dehesa Index solo muestra un valor cuando se ha podido verificar en su fuente oficial, con su fecha. Lo que aún no tiene fuente verificada aparece como «pendiente» y sin cifra. Es información, no asesoramiento de inversión.',
      apiNotice: 'Los precios de EE. UU. proceden de USDA NASS Quick Stats y se consultan cada semana (NASS publica una vez al mes). This product uses the NASS API but is not endorsed or certified by NASS. Los tipos de cambio se actualizan cada día laborable con las cotizaciones de referencia del Banco Central Europeo, que las publica solo con fines informativos.'
    },
    en: {
      title: 'Information | Dehesa Index',
      h1: 'Information',
      sub: 'Who we are, where the name comes from, and how we built the price dashboard.',
      sec1Title: 'Our mission',
      sec1Body: 'Dehesa Index brings U.S., European, UK and Canadian farm prices, plus official statistics for more countries — grains, dairy, livestock, feed and fertilizer — together in one dashboard, so farmers, ranchers, cooperatives and buyers can compare both markets at a glance, in the same currency and the same unit.',
      sec2Title: 'The name',
      sec2Body: 'The "dehesa" is the traditional farming-and-grazing landscape of Atlantic and Mediterranean Spain — holm oaks, pasture and livestock in balance with the land. Dehesa Index takes that name as its starting point: a price index rooted in the countryside, meant to read just as naturally in Cáceres as in Iowa.',
      sec3Title: 'Data sources',
      sec3Intro: 'Every figure on the dashboard comes from official sources. Here are the {n} we use today, grouped by country; click any of them to check the data at the source. The Methodology page explains how each one is used:',
      disclaimer: 'Dehesa Index only shows a value once it has been verified at its official source, with its date. Anything without a verified source appears as “pending” with no figure. This is information, not investment advice.',
      apiNotice: 'U.S. prices come from USDA NASS Quick Stats and are checked every week (NASS publishes once a month). This product uses the NASS API but is not endorsed or certified by NASS. Exchange rates are updated every business day from the European Central Bank reference rates, which the ECB publishes for information purposes only.'
    },
    fr: {
      title: 'Informations | Dehesa Index',
      h1: 'Informations',
      sub: "Qui nous sommes, d'où vient le nom et comment nous avons construit le tableau des prix.",
      sec1Title: 'Notre mission',
      sec1Body: "Dehesa Index réunit en un seul tableau de bord les prix agricoles américains, européens, britanniques et canadiens, plus des statistiques officielles de davantage de pays — céréales, produits laitiers, bétail, aliments pour animaux et engrais — afin que les agriculteurs, éleveurs, coopératives et acheteurs puissent comparer les deux marchés d'un coup d'œil, dans la même devise et la même unité.",
      sec2Title: 'Le nom',
      sec2Body: "La « dehesa » est le paysage agropastoral traditionnel de l'Espagne atlantique et méditerranéenne — chênes verts, pâturages et bétail en équilibre avec la terre. Dehesa Index reprend ce nom comme point de départ : un indice de prix enraciné dans la campagne, pensé pour se lire aussi naturellement à Cáceres que dans l'Iowa.",
      sec3Title: 'Sources des données',
      sec3Intro: 'Tous les chiffres du tableau de bord proviennent de sources officielles. Voici les {n} que nous utilisons aujourd’hui, regroupées par pays ; cliquez sur l’une d’elles pour consulter la donnée à la source. La page Méthodologie explique l’usage de chacune :',
      disclaimer: 'Dehesa Index n\'affiche une valeur que lorsqu\'elle a pu être vérifiée à sa source officielle, avec sa date. Ce qui n\'a pas encore de source vérifiée apparaît « en attente », sans chiffre. Information, non conseil en investissement.',
      apiNotice: 'Les prix américains proviennent d\'USDA NASS Quick Stats et sont consultés chaque semaine (NASS publie une fois par mois). This product uses the NASS API but is not endorsed or certified by NASS. Les taux de change sont mis à jour chaque jour ouvré à partir des taux de référence de la Banque centrale européenne, publiés à titre informatif uniquement.'
    },
    it: {
      title: 'Informazioni | Dehesa Index',
      h1: 'Informazioni',
      sub: 'Chi siamo, da dove viene il nome e come abbiamo costruito il pannello dei prezzi.',
      sec1Title: 'La nostra missione',
      sec1Body: "Dehesa Index riunisce in un unico pannello i prezzi agricoli di Stati Uniti, Europa, Regno Unito e Canada, più statistiche ufficiali di più paesi — cereali, lattiero-caseario, bestiame, mangimi e fertilizzanti — così che agricoltori, allevatori, cooperative e acquirenti possano confrontare entrambi i mercati a colpo d'occhio, nella stessa valuta e nella stessa unità di misura.",
      sec2Title: 'Il nome',
      sec2Body: 'La "dehesa" è il paesaggio agro-pastorale tradizionale della Spagna atlantica e mediterranea — querce da sughero, pascolo e bestiame in equilibrio con la terra. Dehesa Index prende questo nome come punto di partenza: un indice dei prezzi con radici nella campagna, pensato per leggersi con la stessa naturalezza a Cáceres come in Iowa.',
      sec3Title: 'Fonti dei dati',
      sec3Intro: 'Tutte le cifre del pannello provengono da fonti ufficiali. Ecco le {n} che usiamo oggi, raggruppate per paese; clicca su una di esse per consultare il dato all’origine. La pagina Metodologia spiega come si usa ciascuna:',
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
    document.getElementById('inf-sec3-intro').textContent = t.sec3Intro.replace('{n}', (window.DEHESA_SOURCES || []).length);
    renderSources(lang);
    document.getElementById('inf-disclaimer').textContent = t.disclaimer;
    document.getElementById('inf-api-notice').textContent = t.apiNotice;
  }

  document.getElementById('inf-src-tabs').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.di-src-tab') : null;
    if (!b) return;
    VIEW = b.getAttribute('data-v');
    renderSources(window.DehesaShared.getLang());
  });

  window.DehesaShared.init('informacion');
  window.DehesaShared.onLangChange = render;
  render();
})();
