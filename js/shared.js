/* Dehesa Index — lógica compartida entre todas las páginas:
   idioma + tema (persistidos en localStorage), Nav, Footer,
   idioma por defecto del navegador.
   Vanilla JS, sin frameworks ni build step. */

(function (global) {
  'use strict';

  var LANGS = ['es', 'en', 'fr', 'it'];

  function readLang() {
    try {
      var v = window.localStorage.getItem('dehesaIndexLang');
      if (LANGS.indexOf(v) > -1) return v;
    } catch (e) {}
    return null;
  }
  function writeLang(code) {
    try { window.localStorage.setItem('dehesaIndexLang', code); } catch (e) {}
  }
  function readTheme() {
    try {
      var v = window.localStorage.getItem('dehesaIndexTheme');
      if (v === 'light' || v === 'dark') return v;
    } catch (e) {}
    return 'light';
  }
  function writeTheme(mode) {
    try { window.localStorage.setItem('dehesaIndexTheme', mode); } catch (e) {}
  }

  function detectLang() {
    try {
      var L = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
      for (var i = 0; i < L.length; i++) { var c = String(L[i] || '').slice(0, 2).toLowerCase(); if (LANGS.indexOf(c) > -1) return c; }
    } catch (e) {}
    return 'en';
  }
  var lang = readLang() || detectLang();
  var theme = readTheme();

  var DENSITY = { 'precios.html': 'compact', 'europa.html': 'compact', 'lonjas.html': 'compact', 'mercados.html': 'compact', 'precios-locales.html': 'compact', 'comparador.html': 'compact', 'catalogo.html': 'compact', 'calendario.html': 'compact', 'noticias.html': 'compact',
    'metodologia.html': 'expanded', 'observatorio.html': 'expanded', 'informacion.html': 'expanded', 'status.html': 'expanded', 'legal.html': 'expanded' };
  function applyThemeAttr() {
    try { var f = window.location.pathname.split('/').pop() || 'index.html'; document.documentElement.setAttribute('data-density', DENSITY[f] || 'standard'); } catch (e) { /* sin densidad: estandar */ }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('lang', lang); // WCAG 3.1.1: el idioma de la pagina sigue al selector
  }
  applyThemeAttr();

  var NAV_LABELS = {
    es: { search: 'Buscar', home: 'Inicio', precios: 'Precios', noticias: 'Noticias', calendario: 'Calendario', informacion: 'Información', blog: 'Blog', empresas: 'Empresas', contacto: 'Contacto', toDark: 'Cambiar a modo oscuro', toLight: 'Cambiar a modo claro', langSelect: 'Elegir idioma', openMenu: 'Abrir menú', closeMenu: 'Cerrar menú' },
    en: { search: 'Search', home: 'Home', precios: 'Prices', noticias: 'News', calendario: 'Calendar', informacion: 'Information', blog: 'Blog', empresas: 'Business', contacto: 'Contact', toDark: 'Switch to dark mode', toLight: 'Switch to light mode', langSelect: 'Choose language', openMenu: 'Open menu', closeMenu: 'Close menu' },
    fr: { search: 'Rechercher', home: 'Accueil', precios: 'Prix', noticias: 'Actualités', calendario: 'Calendrier', informacion: 'Informations', blog: 'Blog', empresas: 'Entreprises', contacto: 'Contact', toDark: 'Passer en mode sombre', toLight: 'Passer en mode clair', langSelect: 'Choisir la langue', openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu' },
    it: { search: 'Cerca', home: 'Home', precios: 'Prezzi', noticias: 'Notizie', calendario: 'Calendario', informacion: 'Informazioni', blog: 'Blog', empresas: 'Aziende', contacto: 'Contatti', toDark: 'Passa alla modalità scura', toLight: 'Passa alla modalità chiara', langSelect: 'Scegli la lingua', openMenu: 'Apri il menu', closeMenu: 'Chiudi il menu' }
  };
  var LANG_OPTIONS = [
    { code: 'es', label: '🇪🇸 Español' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'it', label: '🇮🇹 Italiano' }
  ];
  var NAV_KEYS = ['home', 'precios', 'noticias', 'calendario', 'informacion', 'blog', 'empresas', 'contacto'];
  var NAV_PAGES = {
    home: 'index.html', precios: 'precios.html', noticias: 'noticias.html',
    calendario: 'calendario.html', informacion: 'informacion.html', blog: 'blog.html',
    empresas: 'empresas.html', contacto: 'contacto.html'
  };

  function L(es, en, fr, it) { return { es: es, en: en, fr: fr, it: it }; }
  function pg(file, label, query) { var o = { file: file, label: label }; if (query) o.query = query; return o; }
  function ctry(c, es, en, fr, it) { return pg('paises.html', L(es, en, fr, it), '?c=' + c); }
  var NAV_ORDER = ['g:prices', 'g:countries', 'g:mine', 'g:compare', 'g:today', 'g:more'];
  function pd(file, label, d, query) { var o = pg(file, label, query); o.d = d; return o; }
  function cd(c, es, en, fr, it) { var o = ctry(c, es, en, fr, it); o.chip = 1; return o; }
  var NAV_GROUPS = {
    today: { label: L('Hoy', 'Today', 'Aujourd’hui', 'Oggi'), items: [
      pd('brief.html', L('Qué ha cambiado hoy', 'What changed today', 'Ce qui a changé aujourd’hui', 'Cosa è cambiato oggi'), L('Datos nuevos, mayores movimientos y revisiones del día', 'New data, biggest moves and revisions of the day', 'Nouvelles données, plus fortes variations et révisions du jour', 'Nuovi dati, maggiori movimenti e revisioni del giorno')),
      pd('noticias.html', L('Noticias', 'News', 'Actualités', 'Notizie'), L('Titulares recientes de agencias y fuentes oficiales', 'Recent headlines from agencies and official sources', 'Titres récents d’agences et de sources officielles', 'Titoli recenti da agenzie e fonti ufficiali')),
      pd('calendario.html', L('Calendario agrícola', 'Farm calendar', 'Calendrier agricole', 'Calendario agricolo'), L('Próximas publicaciones oficiales: USDA, UE, Canadá, Australia', 'Upcoming official releases: USDA, EU, Canada, Australia', 'Prochaines publications officielles : USDA, UE, Canada, Australie', 'Prossime pubblicazioni ufficiali: USDA, UE, Canada, Australia')),
      pd('blog.html', L('Resumen semanal', 'Weekly summary', 'Résumé hebdomadaire', 'Riepilogo settimanale'), L('Lo más importante de la semana, con sus datos', 'The week’s key moves, with their data', 'L’essentiel de la semaine, avec ses données', 'Il più importante della settimana, con i dati'))
    ] },
    prices: { label: L('Precios', 'Prices', 'Prix', 'Prezzi'), mega: 1, first: L('Precios', 'Prices', 'Prix', 'Prezzi'), items: [
      pd('precios.html', L('Panel de precios', 'Price dashboard', 'Tableau des prix', 'Pannello dei prezzi'), L('Todos los productos en EE. UU., UE, Reino Unido y Canadá', 'Every product in the US, EU, UK and Canada', 'Tous les produits aux États-Unis, dans l’UE, au Royaume-Uni et au Canada', 'Tutti i prodotti in USA, UE, Regno Unito e Canada')),
      pd('producto.html', L('Ficha de producto', 'Product page', 'Fiche produit', 'Scheda prodotto'), L('Un producto a fondo: precio, países, histórico y comercio', 'One product in depth: price, countries, history and trade', 'Un produit en détail : prix, pays, historique et commerce', 'Un prodotto a fondo: prezzo, paesi, storico e commercio'), '?p=trigo'),
      pd('europa.html', L('Precios de la UE', 'EU prices', 'Prix de l’UE', 'Prezzi UE'), L('UE · cotizaciones país por país, con histórico', 'EU · country-by-country quotes, with history', 'UE · cotations pays par pays, avec historique', 'UE · quotazioni paese per paese, con storico')),
      pd('lonjas.html', L('Lonjas y mercados de España', 'Spanish local markets', 'Marchés locaux d’Espagne', 'Mercati locali della Spagna'), L('Cereales, aceite y girasol por provincia o zona', 'Cereals, olive oil and sunflower by province or zone', 'Céréales, huile d’olive et tournesol par province ou zone', 'Cereali, olio d’oliva e girasole per provincia o zona')),
      { file: 'index.html', hash: '#home-dehesa-index', noActive: true, label: L('Índice Dehesa', 'Dehesa Index', 'Indice Dehesa', 'Indice Dehesa'), d: L('Índice de precios agrícolas de la UE, EE. UU. y Canadá', 'Farm price index for the EU, US and Canada', 'Indice des prix agricoles UE, États-Unis et Canada', 'Indice dei prezzi agricoli UE, USA e Canada') },
      pd('comparador.html', L('Comparador por producto y país', 'Product and country comparator', 'Comparateur par produit et pays', 'Confronto per prodotto e paese'), L('El precio de un producto en varios países, misma unidad', 'One product’s price across countries, same unit', 'Le prix d’un produit dans plusieurs pays, même unité', 'Il prezzo di un prodotto in più paesi, stessa unità')),
      { label: L('Mercados y relaciones', 'Markets and relationships', 'Marchés et relations', 'Mercati e relazioni'), items: [
        pd('mercados.html', L('Precios de mercado de EE. UU.', 'US market prices', 'Prix de marché des États-Unis', 'Prezzi di mercato USA'), L('EE. UU. · precios de AMS Market News: grano, ganado, heno…', 'US · AMS Market News prices: grain, livestock, hay…', 'États-Unis · prix AMS Market News : grains, bétail, foin…', 'USA · prezzi AMS Market News: cereali, bestiame, fieno…')),
        pd('relaciones.html', L('Relaciones entre mercados', 'Cross-market relationships', 'Relations entre marchés', 'Relazioni tra mercati'), L('Cómo se mueven juntos insumos, clima, existencias y precios', 'How inputs, weather, stocks and prices move together', 'Comment intrants, météo, stocks et prix évoluent ensemble', 'Come si muovono insieme input, meteo, scorte e prezzi'))
      ] }
    ] },
    countries: { label: L('Países', 'Countries', 'Pays', 'Paesi'), mega: 1, first: L('Por país', 'By country', 'Par pays', 'Per paese'), items: [
      pd('perfiles.html', L('Perfiles de país y comparador', 'Country profiles and comparison', 'Profils de pays et comparateur', 'Profili paese e confronto'), L('Qué datos hay de cada país y comparación de dos países', 'What we have for each country and a two-country comparison', 'Les données de chaque pays et la comparaison de deux pays', 'I dati di ogni paese e il confronto tra due paesi')),
      pd('pac.html', L('PAC en la UE', 'EU CAP', 'PAC dans l’UE', 'PAC nell’UE'), L('UE-27 · asignaciones por país; ocho países con su ficha', 'EU-27 · allocations by country; eight countries with their own page', 'UE-27 · dotations par pays ; huit pays avec leur fiche', 'UE-27 · dotazioni per paese; otto paesi con la loro scheda'), '?c=EU'),
      pd('pac.html', L('PAC España', 'Spain CAP', 'PAC Espagne', 'PAC Spagna'), L('España · ayudas por hectárea, calendario y reglas', 'Spain · payments per hectare, calendar and rules', 'Espagne · aides à l’hectare, calendrier et règles', 'Spagna · aiuti per ettaro, calendario e regole'), '?c=ES'),
      cd('US', 'EE. UU.', 'United States', 'États-Unis', 'Stati Uniti'),
      cd('EU', 'Unión Europea', 'European Union', 'Union européenne', 'Unione Europea'),
      cd('ES', 'España', 'Spain', 'Espagne', 'Spagna'),
      cd('FR', 'Francia', 'France', 'France', 'Francia'),
      cd('DE', 'Alemania', 'Germany', 'Allemagne', 'Germania'),
      cd('BE', 'Bélgica', 'Belgium', 'Belgique', 'Belgio'),
      cd('AT', 'Austria', 'Austria', 'Autriche', 'Austria'),
      cd('PT', 'Portugal', 'Portugal', 'Portugal', 'Portogallo'),
      cd('IT', 'Italia', 'Italy', 'Italie', 'Italia'),
      cd('DK', 'Dinamarca', 'Denmark', 'Danemark', 'Danimarca'),
      cd('NL', 'Países Bajos', 'Netherlands', 'Pays-Bas', 'Paesi Bassi'),
      cd('CA', 'Canadá', 'Canada', 'Canada', 'Canada'),
      cd('AU', 'Australia', 'Australia', 'Australie', 'Australia'),
      cd('UK', 'Reino Unido', 'United Kingdom', 'Royaume-Uni', 'Regno Unito'),
      cd('AR', 'Argentina', 'Argentina', 'Argentine', 'Argentina'),
      cd('CL', 'Chile', 'Chile', 'Chili', 'Cile'),
      cd('PL', 'Polonia', 'Poland', 'Pologne', 'Polonia'),
      cd('EL', 'Grecia', 'Greece', 'Grèce', 'Grecia'),
      cd('IE', 'Irlanda', 'Ireland', 'Irlande', 'Irlanda'),
      cd('FI', 'Finlandia', 'Finland', 'Finlande', 'Finlandia'),
      cd('BG', 'Bulgaria', 'Bulgaria', 'Bulgarie', 'Bulgaria'),
      cd('HR', 'Croacia', 'Croatia', 'Croatie', 'Croazia'),
      cd('LT', 'Lituania', 'Lithuania', 'Lituanie', 'Lituania'),
      cd('SK', 'Eslovaquia', 'Slovakia', 'Slovaquie', 'Slovacchia'),
      cd('CH', 'Suiza', 'Switzerland', 'Suisse', 'Svizzera')
    ] },
    production: { label: L('Producción y clima', 'Production and weather', 'Production et météo', 'Produzione e meteo'), mega: 1, first: L('Cultivos y ganado', 'Crops and livestock', 'Cultures et élevage', 'Colture e allevamento'), items: [
      pd('cultivos.html', L('Estado de los cultivos (EE. UU.)', 'Crop progress (US)', 'État des cultures (É.-U.)', 'Stato delle colture (USA)'), L('EE. UU. · condición y avance semanal por estado', 'US · weekly condition and progress by state', 'États-Unis · état et avancement hebdomadaires par État', 'USA · condizione e avanzamento settimanali per stato')),
      pd('rendimientos.html', L('Rendimientos (EE. UU.)', 'Yields (US)', 'Rendements (É.-U.)', 'Rese (USA)'), L('EE. UU. · rendimiento, superficie y producción por estado', 'US · yield, acreage and output by state', 'États-Unis · rendement, surface et production par État', 'USA · resa, superficie e produzione per stato')),
      pd('ganaderia.html', L('Ganadería (EE. UU.)', 'Livestock (US)', 'Élevage (É.-U.)', 'Zootecnia (USA)'), L('EE. UU. · censos, leche por estado y existencias en frío', 'US · inventories, milk by state and cold storage', 'États-Unis · cheptels, lait par État et stocks frigorifiques', 'USA · consistenze, latte per stato e scorte in frigo')),
      pd('oferta-demanda.html', L('Oferta y demanda mundial', 'World supply and demand', 'Offre et demande mondiales', 'Offerta e domanda mondiale'), L('Mundo · producción, consumo y existencias por país', 'World · production, use and stocks by country', 'Monde · production, consommation et stocks par pays', 'Mondo · produzione, consumi e scorte per paese')),
      { label: L('Clima y mapa', 'Weather and map', 'Météo et carte', 'Meteo e mappa'), items: [
        pd('sequia.html', L('Sequía', 'Drought', 'Sécheresse', 'Siccità'), L('EE. UU. por estado y Europa por país, semana a semana', 'US by state and Europe by country, week by week', 'États-Unis par État et Europe par pays, semaine par semaine', 'USA per stato ed Europa per paese, settimana per settimana')),
        pd('clima.html', L('Clima agrícola', 'Farm weather', 'Météo agricole', 'Meteo agricolo'), L('Lluvia y temperatura frente a la media, por zona productora', 'Rain and temperature vs normal, by growing area', 'Pluie et température par rapport à la normale, par zone', 'Pioggia e temperatura rispetto alla media, per zona')),
        pd('mapa.html', L('Mapa agrícola', 'Farm map', 'Carte agricole', 'Mappa agricola'), L('Precios, clima, producción y comercio sobre el mapa', 'Prices, weather, output and trade on a map', 'Prix, météo, production et commerce sur une carte', 'Prezzi, meteo, produzione e commercio sulla mappa'))
      ] }
    ] },
    trade: { label: L('Comercio', 'Trade', 'Commerce', 'Commercio'), items: [
      pd('exportaciones.html', L('Exportaciones de EE. UU.', 'US exports', 'Exportations des États-Unis', 'Esportazioni USA'), L('EE. UU. · ventas semanales y comercio por país comprador', 'US · weekly sales and trade by buyer country', 'États-Unis · ventes hebdomadaires et commerce par pays acheteur', 'USA · vendite settimanali e commercio per paese acquirente')),
      pd('aranceles.html', L('Aranceles', 'Tariffs', 'Droits de douane', 'Dazi'), L('EE. UU., UE, Canadá y México · por producto', 'US, EU, Canada and Mexico · by product', 'États-Unis, UE, Canada et Mexique · par produit', 'USA, UE, Canada e Messico · per prodotto')),
      pd('canada-granos.html', L('Granos de Canadá', 'Canadian grain', 'Grains du Canada', 'Cereali del Canada'), L('Canadá · exportaciones, entregas y existencias semanales', 'Canada · weekly exports, deliveries and stocks', 'Canada · exportations, livraisons et stocks hebdomadaires', 'Canada · esportazioni, consegne e scorte settimanali'))
    ] },
    costs: { label: L('Costes', 'Costs', 'Coûts', 'Costi'), items: [
      pd('insumos.html', L('Insumos (EE. UU.)', 'Inputs (US)', 'Intrants (É.-U.)', 'Input (USA)'), L('EE. UU. · fertilizantes por estado y precios pagados', 'US · fertilizer by state and prices paid', 'États-Unis · engrais par État et prix payés', 'USA · fertilizzanti per stato e prezzi pagati')),
      pd('costes.html', L('Costes por cultivo (EE. UU.)', 'Crop costs (US)', 'Coûts par culture (É.-U.)', 'Costi per coltura (USA)'), L('EE. UU. · costes por cultivo y renta agraria (ERS)', 'US · costs by crop and farm income (ERS)', 'États-Unis · coûts par culture et revenu agricole (ERS)', 'USA · costi per coltura e reddito agricolo (ERS)')),
      pd('recan.html', L('Costes y rentas en España (RECAN)', 'Spanish farm costs and incomes (RECAN)', 'Coûts et revenus en Espagne (RECAN)', 'Costi e redditi in Spagna (RECAN)'), L('España · por comunidad, tipo y tamaño de explotación', 'Spain · by region, farm type and size', 'Espagne · par région, type et taille d’exploitation', 'Spagna · per regione, tipo e dimensione aziendale')),
      pd('calculadora.html', L('Calculadora de margen', 'Margin calculator', 'Calculateur de marge', 'Calcolatore di margine'), L('Coste por hectárea y tonelada, precio de equilibrio y margen', 'Cost per hectare and tonne, break-even price and margin', 'Coût par hectare et tonne, prix d’équilibre et marge', 'Costo per ettaro e tonnellata, prezzo di pareggio e margine'))
    ] },
    mine: { label: L('Mi espacio', 'My space', 'Mon espace', 'Il mio spazio'), items: [
      pd('mi-mercado.html', L('Mi mercado', 'My market', 'Mon marché', 'Il mio mercato'), L('Tu zona y tu producto: precio local, seguro, sequía y más', 'Your area and product: local price, insurance, drought and more', 'Votre zone et votre produit : prix local, assurance, sécheresse…', 'La tua zona e il tuo prodotto: prezzo locale, assicurazione, siccità…')),
      pd('siembra.html', L('Qué sembrar', 'What to plant', 'Quoi semer', 'Cosa seminare'), L('Compara cultivos de tu región y reparte tu superficie', 'Compare crops in your area and split your land', 'Comparez les cultures de votre région et répartissez votre surface', 'Confronta le colture della tua zona e ripartisci la superficie')),
      pd('mi-explotacion.html', L('Mi explotación', 'My farm', 'Mon exploitation', 'La mia azienda'), L('Tus cultivos y costes: margen, equilibrio y qué ha cambiado', 'Your crops and costs: margin, break-even and what changed', 'Vos cultures et coûts : marge, équilibre et ce qui a changé', 'Le tue colture e costi: margine, pareggio e cosa è cambiato')),
      pd('mi-seguimiento.html', L('Mi seguimiento', 'My watchlist', 'Mon suivi', 'Il mio seguito'), L('Sigue productos y series con avisos, sin cuenta', 'Follow products and series with alerts, no account', 'Suivez produits et séries avec alertes, sans compte', 'Segui prodotti e serie con avvisi, senza account'))
    ] },
    data: { label: L('Datos', 'Data', 'Données', 'Dati'), items: [
      pd('catalogo.html', L('Catálogo de datos', 'Data catalogue', 'Catalogue de données', 'Catalogo dei dati'), L('Más de 5.800 series por país, métrica y producto', 'Over 5,800 series by country, metric and product', 'Plus de 5 800 séries par pays, mesure et produit', 'Oltre 5.800 serie per paese, metrica e prodotto')),
      pd('metodologia.html', L('Metodología', 'Methodology', 'Méthodologie', 'Metodologia'), L('Cómo se verifican, fechan y convierten los datos', 'How data are verified, dated and converted', 'Comment les données sont vérifiées, datées et converties', 'Come i dati sono verificati, datati e convertiti')),
      pd('status.html', L('Estado de los datos', 'Data status', 'État des données', 'Stato dei dati'), L('Última y próxima actualización de cada fuente', 'Last and next update of each source', 'Dernière et prochaine mise à jour de chaque source', 'Ultimo e prossimo aggiornamento di ogni fonte')),
      pd('revisiones.html', L('Revisiones y correcciones', 'Revisions and corrections', 'Révisions et corrections', 'Revisioni e correzioni'), L('Qué cifras cambiaron, cuándo, por qué y qué llegó tarde', 'Which figures changed, when, why, and what arrived late', 'Quels chiffres ont changé, quand, pourquoi, et ce qui est arrivé en retard', 'Quali dati sono cambiati, quando, perché e cosa è arrivato in ritardo')),
      pd('observatorio.html', L('Observatorio de datos', 'Data observatory', 'Observatoire des données', 'Osservatorio dei dati'), L('Novedades, frescura, cobertura y próximas publicaciones', 'What’s new, freshness, coverage and upcoming releases', 'Nouveautés, fraîcheur, couverture et prochaines publications', 'Novità, freschezza, copertura e prossime pubblicazioni')),
      pd('informacion.html', L('Información', 'About', 'Informations', 'Informazioni'), L('Quiénes somos y de qué fuentes se nutre el panel', 'Who we are and which sources feed the dashboard', 'Qui nous sommes et quelles sources alimentent le tableau', 'Chi siamo e quali fonti alimentano il pannello'))
    ] }
  };
  (function () {
    var G = NAV_GROUPS, pick = function (g, files) { return G[g].items.filter(function (i) { return !i.items && files.indexOf(i.file) > -1; }); };
    G.prices.label = L('Buscar precios', 'Find prices', 'Trouver un prix', 'Trova prezzi');
    G.today.label = L('Noticias y calendario', 'News and calendar', 'Actualités et calendrier', 'Notizie e calendario');
    G.mine.label = L('Mi mercado', 'My market', 'Mon marché', 'Il mio mercato');
    G.mine.items = G.mine.items.concat(pick('costs', ['calculadora.html']));
    G.compare = { label: L('Comparar', 'Compare', 'Comparer', 'Confrontare'), items: pick('prices', ['comparador.html']).concat(pick('countries', ['perfiles.html']), pick('production', ['oferta-demanda.html']), G.prices.items.filter(function (i) { return i.items; })[0].items.filter(function (i) { return i.file === 'relaciones.html'; })) };
    var prod = G.production.items.filter(function (i) { return !i.items; }).concat(G.production.items.filter(function (i) { return i.items; })[0].items);
    var all = [].concat(G.countries.items, prod, G.trade.items, G.costs.items), one = function (f, q) { return all.filter(function (x) { return x.file === f && (x.query || '') === (q || ''); })[0]; };
    G.more = { label: L('Más herramientas', 'More tools', 'Plus d’outils', 'Altri strumenti'), mega: 1, items: [
      { label: L('Clima, mapa y comercio', 'Weather, map and trade', 'Météo, carte et commerce', 'Meteo, mappa e commercio'), items: prod.filter(function (i) { return /^(sequia|clima|mapa)\./.test(i.file); }).concat(one('aranceles.html')) },
      { label: L('Datos e información avanzada', 'Data and advanced information', 'Données et informations avancées', 'Dati e informazioni avanzate'), items: G.data.items }
    ] };
    var dl = function (es, en, fr, it, items, cc) { return { label: L(es, en, fr, it), items: items, cc: cc }; };
    G.countries.chipsFirst = 1;
    G.countries.items = G.countries.items.filter(function (i) { return i.chip; }).concat([
      dl('Datos de EE. UU.', 'US data', 'Données des É.-U.', 'Dati USA', [one('exportaciones.html'), one('insumos.html'), one('costes.html'), one('cultivos.html'), one('rendimientos.html'), one('ganaderia.html')], 'US'),
      dl('Datos de Canadá', 'Canada data', 'Données du Canada', 'Dati Canada', [one('canada-granos.html')], 'CA'),
      dl('Datos de España', 'Spain data', 'Données de l’Espagne', 'Dati Spagna', [one('recan.html'), one('pac.html', '?c=ES')], 'ES'),
      dl('Datos de la UE', 'EU data', 'Données de l’UE', 'Dati UE', [one('pac.html', '?c=EU')], 'EU')
    ]);
  })();
  function currentFile() { var f = window.location.pathname.split('/').pop(); return f || 'index.html'; }
  function leafActive(i) {
    if (i.query === '?c=US' && currentFile() === 'precios-locales.html') return true; // perfil de EE. UU.: aquí vive el grano local
    if (i.noActive || i.file !== currentFile()) return false;
    if (i.query && i.query.indexOf('?c=') === 0) { var c = (new URLSearchParams(window.location.search).get('c') || 'ES').toUpperCase(); return c === i.query.slice(3); }
    return true;
  }
  function branchActive(list) { return list.some(function (i) { return i.items ? branchActive(i.items) : leafActive(i); }); }
  function groupIsActive(g) { return branchActive(g.items); }
  function itemHtml(i) {
    var on = leafActive(i), d = i.d ? (i.d[lang] || i.d.es) : '';
    return '<a class="di-nav-item' + (on ? ' active' : '') + '" href="' + sitePath(i.file) + (i.query || '') + (i.hash || '') + '"' + (on ? ' aria-current="page"' : '') + '><span class="di-nav-it">' + esc(i.label[lang] || i.label.es) + '</span>' + (d ? '<span class="di-nav-id">' + esc(d) + '</span>' : '') + '</a>';
  }
  function chipHtml(i) {
    var on = leafActive(i);
    return '<a class="di-nav-chip' + (on ? ' active' : '') + '" href="' + sitePath(i.file) + (i.query || '') + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(i.label[lang] || i.label.es) + '</a>';
  }
  var REGIONS = [{ k: 'SA', l: L('Sudamérica', 'South America', 'Amérique du Sud', 'Sud America') }, { k: 'NA', l: L('Norteamérica', 'North America', 'Amérique du Nord', 'Nord America') }, { k: 'EU', l: L('Europa', 'Europe', 'Europe', 'Europa') }, { k: 'OT', l: L('Otros', 'Others', 'Autres', 'Altri') }];
  var REG_OF = { AR: 'SA', CL: 'SA', US: 'NA', CA: 'NA', EU: 'EU', ES: 'EU', FR: 'EU', DE: 'EU', BE: 'EU', AT: 'EU', PT: 'EU', IT: 'EU', DK: 'EU', NL: 'EU', UK: 'EU', PL: 'EU', EL: 'EU', IE: 'EU', FI: 'EU', BG: 'EU', HR: 'EU', LT: 'EU', SK: 'EU', CH: 'EU' };
  function panelHtml(g) {
    var leaves = g.items.filter(function (i) { return !i.items && !i.chip; }), chips = g.items.filter(function (i) { return i.chip; }), cols = [];
    if (leaves.length) cols.push({ h: g.first, items: leaves });
    g.items.forEach(function (i) { if (i.items) cols.push({ h: i.label, items: i.items }); });
    var h = cols.map(function (c) { return '<div class="di-nav-col">' + (c.h ? '<div class="di-nav-colh">' + esc(c.h[lang] || c.h.es) + '</div>' : '') + c.items.map(itemHtml).join('') + '</div>'; }).join('');
    var ch = ''; if (chips.length) ch = '<div class="di-nav-regs' + (g.chipsFirst ? ' di-nav-regs-top' : '') + '">' + REGIONS.map(function (r) {
      var rc = chips.filter(function (i) { return (REG_OF[(i.query || '').slice(3)] || 'OT') === r.k; });
      return rc.length ? '<section class="di-nav-reg"><div class="di-nav-regh">' + esc(r.l[lang] || r.l.es) + '</div><div class="di-nav-chips">' + rc.map(chipHtml).join('') + '</div></section>' : '';
    }).join('') + '</div>';
    return g.chipsFirst ? ch + h : h + ch;
  }
  var QUICK = { mm: L('Mi mercado', 'My market', 'Mon marché', 'Il mio mercato'), news: L('Noticias', 'News', 'Actualités', 'Notizie'), cal: L('Calendario', 'Calendar', 'Calendrier', 'Calendario') };
  function quickLink(file, key, cls) { var on = currentFile() === file; return '<a class="' + cls + (on ? ' active' : '') + '" href="' + sitePath(file) + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(QUICK[key][lang] || QUICK[key].es) + '</a>'; }

  var FOOTER_STRINGS = {
    es: {
      blurb: 'Un panel diario y semanal de precios agrícolas de EE. UU., Europa, Reino Unido y Canadá: cereales, lácteos, ganado, pienso y fertilizantes, todo en un mismo sitio.',
      sourcesTitle: 'FUENTES DE DATOS',
      linksTitle: 'ENLACES',
      noticeTitle: 'AVISO',
      notice: 'Datos oficiales verificados, con su fecha y fuente; lo que no se puede verificar se marca como pendiente. Informativo: no es asesoramiento de inversión ni precios en tiempo real.',
      copyrightText: '© 2026 Dehesa Index',
      methodologyLabel: 'Metodología',
      legalLabel: 'Aviso legal y privacidad'
    },
    en: {
      blurb: 'A daily and weekly dashboard of U.S., European, UK and Canadian farm prices: grains, dairy, livestock, feed and fertilizer, all in one place.',
      sourcesTitle: 'DATA SOURCES',
      linksTitle: 'LINKS',
      noticeTitle: 'DISCLAIMER',
      notice: 'Verified official data with its date and source; anything we cannot verify is marked pending. For information only: not investment advice and not real-time prices.',
      copyrightText: '© 2026 Dehesa Index',
      methodologyLabel: 'Methodology',
      legalLabel: 'Legal notice & privacy'
    },
    fr: {
      blurb: "Un tableau de bord quotidien et hebdomadaire des prix agricoles des États-Unis, d’Europe, du Royaume-Uni et du Canada : céréales, produits laitiers, bétail, aliments pour animaux et engrais, réunis en un seul endroit.",
      sourcesTitle: 'SOURCES DES DONNÉES',
      linksTitle: 'LIENS',
      noticeTitle: 'AVERTISSEMENT',
      notice: "Données officielles vérifiées, avec leur date et leur source ; ce qui ne peut être vérifié est marqué en attente. À titre informatif : ni conseil en investissement ni prix en temps réel.",
      copyrightText: '© 2026 Dehesa Index',
      methodologyLabel: 'Méthodologie',
      legalLabel: 'Mentions légales et confidentialité'
    },
    it: {
      blurb: 'Un pannello giornaliero e settimanale dei prezzi agricoli di Stati Uniti, Europa, Regno Unito e Canada: cereali, lattiero-caseario, bestiame, mangimi e fertilizzanti, tutto in un unico posto.',
      sourcesTitle: 'FONTI DEI DATI',
      linksTitle: 'LINK',
      noticeTitle: 'AVVISO',
      notice: 'Dati ufficiali verificati, con data e fonte; ciò che non si può verificare è segnato come in attesa. Solo a scopo informativo: non è consulenza di investimento né prezzi in tempo reale.',
      copyrightText: '© 2026 Dehesa Index',
      methodologyLabel: 'Metodologia',
      legalLabel: 'Note legali e privacy'
    }
  };
  var FOOTER_URLS = {
    nass: 'https://www.nass.usda.gov/',
    ec: 'https://agridata.ec.europa.eu/extensions/DataPortal/prices.html',
    defra: 'https://www.gov.uk/government/collections/agriculture-in-the-united-kingdom',
    eurostat: 'https://ec.europa.eu/eurostat/web/agriculture/database',
    eia: 'https://www.eia.gov/petroleum/gasdiesel/',
    wb: 'https://www.worldbank.org/en/research/commodity-markets',
    ecb: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html'
  };
  var FOOTER_SOURCES = [
    { text: 'USDA NASS / AMS', url: FOOTER_URLS.nass },
    { textKey: 'ec', url: FOOTER_URLS.ec },
    { text: 'Defra (UK)', url: FOOTER_URLS.defra },
    { text: 'Eurostat', url: FOOTER_URLS.eurostat },
    { text: 'EIA', url: FOOTER_URLS.eia },
    { text: 'World Bank', url: FOOTER_URLS.wb },
    { text: 'ECB', url: FOOTER_URLS.ecb },
    { text: 'USDA PSD', url: 'https://apps.fas.usda.gov/psdonline/' },
    { text: 'USDA AMS', url: 'https://mymarketnews.ams.usda.gov/' },
    { text: 'NASA POWER', url: 'https://power.larc.nasa.gov/' }
  ];
  var FOOTER_EC_LABEL = {
    es: 'Comisión Europea — Agri-food Data Portal',
    en: 'European Commission — Agri-food Data Portal',
    fr: 'Commission européenne — Agri-food Data Portal',
    it: 'Commissione europea — Agri-food Data Portal'
  };



  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var SELF_PREFIX = (function () { try { var s = document.currentScript || document.querySelector('script[src*="js/shared.js"]'), m = s && /^(.*?)js\/shared\.js/.exec(s.getAttribute('src') || ''); return m ? m[1] : null; } catch (e) { return null; } })();
  function sitePrefix() {
    if (SELF_PREFIX !== null) return SELF_PREFIX;
    var path = (window.location && window.location.pathname) || '';
    if (/\/datos\/en\/[^/]+\/?$/.test(path)) return '../../../';
    return /\/(precios|datos)\/[^/]+\/?$/.test(path) ? '../../' : '';
  }
  function sitePath(path) { return sitePrefix() + path; }

  (function a11yTables() {
    function fix(root) {
      var ts = (root || document).querySelectorAll('table:not([data-a11y])');
      for (var i = 0; i < ts.length; i++) {
        var t = ts[i], heads = [], hr = t.querySelector('thead tr') || t.querySelector('tr');
        if (!hr) continue;
        t.setAttribute('data-a11y', '1');
        var ths = hr.children;
        for (var j = 0; j < ths.length; j++) { heads.push((ths[j].textContent || '').replace(/\s+/g, ' ').trim()); if (ths[j].tagName === 'TH' && !ths[j].getAttribute('scope')) ths[j].setAttribute('scope', 'col'); }
        var rows = t.querySelectorAll('tbody tr'); if (!rows.length) { rows = t.querySelectorAll('tr'); }
        for (var r = 0; r < rows.length; r++) {
          if (rows[r] === hr) continue; var cs = rows[r].children;
          for (var c = 0; c < cs.length; c++) { if (cs[c].tagName === 'TD' && heads[c] && !cs[c].hasAttribute('data-label')) cs[c].setAttribute('data-label', heads[c]); if (cs[c].tagName === 'TH' && !cs[c].getAttribute('scope')) cs[c].setAttribute('scope', 'row'); }
        }
        if (heads.length >= 3 && heads.length <= 8 && rows.length && !t.hasAttribute('data-no-cards')) t.classList.add('di-cards-m'); if (heads.length >= 4 && t.querySelector('thead') && !t.hasAttribute('data-no-rows')) t.classList.add('di-rows-m');
      }
    }
    if (!global.__diRowsM) { global.__diRowsM = 1;
      var tog = function (e) { if (!global.matchMedia || !global.matchMedia('(max-width:560px)').matches) return; var tr = e.target.closest ? e.target.closest('table.di-rows-m tbody tr') : null; if (!tr) return; if (e.type === 'keydown') { if (e.key !== 'Enter' && e.key !== ' ') return; if (e.target !== tr) return; } else if (e.target.closest('a,button,input,select,textarea,label')) return; if (e.type === 'keydown') e.preventDefault(); var o = tr.classList.toggle('open'); tr.setAttribute('aria-expanded', String(o)); };
      document.addEventListener('click', tog); document.addEventListener('keydown', tog);
    }
    function scrollRegions() {
      var els = document.querySelectorAll('main *, .di-ticker, .di-chart-svg-wrap'), n = Math.min(els.length, 4000);
      for (var i = 0; i < n; i++) {
        var e = els[i]; if (e.hasAttribute('tabindex') || e.scrollWidth <= e.clientWidth + 1 || !e.clientWidth) continue;
        var ox = getComputedStyle(e).overflowX; if (ox !== 'auto' && ox !== 'scroll' && !(ox === 'hidden' && e.classList.contains('di-ticker'))) continue;
        if (e.querySelector('a[href],button,input,select,textarea,[tabindex]')) continue;
        e.setAttribute('tabindex', '0');
      }
    }
    function run() { fix(document); scrollRegions(); try { new MutationObserver(function () { clearTimeout(run.t); run.t = setTimeout(function () { fix(document); (window.requestIdleCallback || function (f) { return setTimeout(f, 1); })(scrollRegions, { timeout: 1500 }); }, 150); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  })();

  (function watchPill() {
    try {
      var raw = window.localStorage.getItem('di-watchlist-v1') || ''; if (raw.indexOf('"r":[{') < 0) return;
      window.addEventListener('load', function () {
        var go = function () { if (window.DIWatch && window.DIWatch.pill) window.DIWatch.pill(global.DehesaShared && global.DehesaShared.getLang ? global.DehesaShared.getLang() : 'es'); };
        if (window.DIWatch && window.DIWatch.pill) return go();
        var sc = document.createElement('script'); sc.src = sitePath('js/watchlist.js?v=20261001'); sc.onload = go; document.body.appendChild(sc);
      });
    } catch (e) {}
  })();

  (function pwa() {
    try {
      if (!document.querySelector('link[rel="manifest"]')) { var l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.webmanifest'; document.head.appendChild(l); }
      if (!document.querySelector('meta[name="theme-color"]')) { var m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#2f6b3a'; document.head.appendChild(m); }
      if ('serviceWorker' in navigator && (location.protocol === 'https:' || (location.hostname === 'localhost' && /pwa=1/.test(location.search)))) {
        window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
      }
    } catch (e) {}
  })();


  var FR = { spy: false, clk: false };
  function frHdr() { var h = document.querySelector('.di-header'), st = h && window.getComputedStyle(h).position === 'sticky'; document.documentElement.style.setProperty('--di-hdr', (st ? h.offsetHeight : 0) + 'px'); return st ? h.offsetHeight : 0; }
  function frCrumbs(el, items) {
    if (!el) return; var e = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    el.innerHTML = '<ol>' + items.map(function (it, i) { var last = i === items.length - 1; return '<li' + (last ? ' aria-current="page"' : '') + '>' + (it[1] && !last ? '<a href="' + e(it[1]) + '">' + e(it[0]) + '</a>' : e(it[0])) + '</li>'; }).join('') + '</ol>';
  }
  function frBar(host, title, items) {
    if (!host) return; var e = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    items = items.filter(function (it) { return document.getElementById(it[0]); });
    if (items.length < 2) { host.innerHTML = ''; host.hidden = true; return; }
    host.hidden = false; host.className = 'pt-ctx di-frame-bar'; host.setAttribute('aria-label', title);
    host.innerHTML = '<strong class="pt-ctx-t">' + e(title) + '</strong>' + items.map(function (it) { return '<a href="#' + e(it[0]) + '" data-fr="' + e(it[0]) + '">' + e(it[1]) + '</a>'; }).join('');
    frHdr();
    var upd = function () { var cur = null, h = frHdr(); Array.prototype.forEach.call(document.querySelectorAll('.di-frame-bar a[data-fr]'), function (a) { var t = document.getElementById(a.getAttribute('data-fr')); if (t && t.getBoundingClientRect().top <= h + 100) cur = a; }); Array.prototype.forEach.call(document.querySelectorAll('.di-frame-bar a[data-fr]'), function (a) { if (a === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); };
    if (!FR.spy) { FR.spy = true; var tk = false; window.addEventListener('resize', frHdr); window.addEventListener('scroll', function () { if (tk) return; tk = true; (window.requestAnimationFrame || setTimeout)(function () { tk = false; upd(); }); }, { passive: true }); }
    if (!FR.clk) { FR.clk = true; document.addEventListener('click', function (ev) { var a = ev.target.closest ? ev.target.closest('.di-frame-bar a[data-fr]') : null; if (!a) return; var t = document.getElementById(a.getAttribute('data-fr')); if (!t) return; ev.preventDefault(); t.scrollIntoView({ behavior: 'auto', block: 'start' }); }); }
    upd();
  }

  function frAuto() {
    var navs = document.querySelectorAll('.di-crumbs[data-crumb-group]'); if (!navs.length) return;
    var HM = { es: 'Inicio', en: 'Home', fr: 'Accueil', it: 'Home' };
    Array.prototype.forEach.call(navs, function (n) {
      var gk = n.getAttribute('data-crumb-group'), g = NAV_GROUPS[gk], h1 = document.querySelector('.di-page-head h1') || document.querySelector('main h1, .di-page h1, h1');
      if (!g && gk !== 'none') return;
      var first = g ? (g.items || []).filter(function (i) { return i.file; })[0] : null;
      var draw = function () { var it = [[HM[lang] || HM.es, sitePath('index.html')]]; if (g) it.push([g.label[lang] || g.label.es, first ? sitePath(first.file) + (first.query || '') : null]); it.push([h1 ? h1.textContent : '', null]); frCrumbs(n, it); };
      draw(); if (h1 && window.MutationObserver && !n.getAttribute('data-obs')) { n.setAttribute('data-obs', '1'); new MutationObserver(draw).observe(h1, { childList: true, characterData: true, subtree: true }); }
    });
  }
  var REL_T = L('Relacionado', 'Related', 'Voir aussi', 'Correlati');
  var REL_X = { compare: ['precios.html', 'catalogo.html'], more: ['precios.html', 'mi-mercado.html'], today: ['precios.html', 'mi-seguimiento.html'], prices: ['mi-mercado.html', 'calendario.html'], countries: ['comparador.html', 'catalogo.html'], production: ['precios.html', 'calendario.html'], trade: ['precios.html', 'oferta-demanda.html'], costs: ['mi-explotacion.html', 'precios.html'], mine: ['precios.html', 'brief.html'], data: ['catalogo.html', 'status.html'] };
  function findLeaf(file) {
    var found = null;
    NAV_ORDER.forEach(function (k) { var g = NAV_GROUPS[k.slice(2)]; (function walk(list, col) { list.forEach(function (i) { if (i.items) walk(i.items, i.items); else if (!found && i.file === file && !i.chip && !i.hash) found = i; }); })(g.items, null); });
    return found;
  }
  function renderRelated() {
    if (document.getElementById('di-related')) return;
    var host = document.querySelector('main') || document.querySelector('.di-page'); if (!host) return;
    var cur = null, gkey = null, col = null;
    NAV_ORDER.forEach(function (k) {
      var g = NAV_GROUPS[k.slice(2)];
      (function walk(list, parent) { list.forEach(function (i) { if (cur) return; if (i.items) walk(i.items, i.items); else if (leafActive(i)) { cur = i; gkey = k.slice(2); col = parent || g.items.filter(function (x) { return !x.items && !x.chip; }); } }); })(g.items, null);
    });
    if (!cur) return;
    var picks = [], seen = {}; seen[cur.file + (cur.query || '')] = 1;
    var add = function (i) { var key = i.file + (i.query || ''); if (!i || seen[key] || i.hash) return; seen[key] = 1; picks.push(i); };
    if (cur.chip) ['perfiles.html', 'mi-mercado.html', 'comparador.html', 'catalogo.html'].forEach(function (f) { var x = findLeaf(f); if (x) add(x); });
    else {
      col.filter(function (i) { return !i.chip; }).slice(0).forEach(function (i) { if (picks.length < 4) add(i); });
      (REL_X[gkey] || []).forEach(function (f) { var x = findLeaf(f); if (x && currentFile() !== f) add(x); });
    }
    if (!picks.length) return;
    var sec = document.createElement('section'); sec.id = 'di-related'; sec.className = 'di-related'; sec.setAttribute('aria-labelledby', 'di-related-h');
    sec.innerHTML = '<h2 id="di-related-h">' + esc(REL_T[lang] || REL_T.es) + '</h2><div class="di-related-grid">' + picks.slice(0, 6).map(function (i) {
      var d = i.d ? (i.d[lang] || i.d.es) : '';
      return '<a class="di-related-card" href="' + sitePath(i.file) + (i.query || '') + '"><span class="di-nav-it">' + esc(i.label[lang] || i.label.es) + '</span>' + (d ? '<span class="di-nav-id">' + esc(d) + '</span>' : '') + '</a>';
    }).join('') + '</div>';
    var inner = host.querySelector(':scope > .di-container') || host;
    inner.appendChild(sec);
  }
  function openSearch(q) {
    q = typeof q === 'string' ? q : '';
    if (window.DehesaSearch) { window.DehesaSearch.open(q); return; }
    window.__diSearchWantOpen = q || true;
    if (document.getElementById('di-search-js')) return;
    var sc = document.createElement('script'); sc.id = 'di-search-js'; sc.src = sitePath('js/search.js'); document.head.appendChild(sc);
  }
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable);
    if ((e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) { e.preventDefault(); openSearch(); }
  });

  function renderNav(activePage) {
    var root = document.getElementById('di-nav-root');
    if (!root) return;
    var t = NAV_LABELS[lang] || NAV_LABELS.es;

    var curFile = currentFile();
    var inGroup = NAV_ORDER.some(function (k) { return k.indexOf('g:') === 0 && groupIsActive(NAV_GROUPS[k.slice(2)]); });
    var linksHtml = NAV_ORDER.map(function (k) {
      if (k.indexOf('g:') === 0) {
        var g = NAV_GROUPS[k.slice(2)], on = groupIsActive(g), gl = g.label[lang] || g.label.es;
        return '<div class="di-nav-group' + (g.mega ? ' di-nav-g-mega' : '') + '"><button type="button" class="di-nav-gbtn' + (on ? ' active' : '') + '" aria-haspopup="true" aria-expanded="false">' + esc(gl) + ' <span aria-hidden="true">▾</span></button>' +
          '<div class="di-nav-menu' + (g.mega ? ' di-nav-mega' : '') + '" role="group" aria-label="' + esc(gl) + '"><div class="di-nav-cols' + (g.chipsFirst ? ' di-nav-cols-4' : '') + '">' + panelHtml(g) + '</div></div></div>';
      }
      var isActive = k === activePage && !inGroup;
      return '<a class="' + (isActive ? 'active' : '') + '" href="' + sitePath(NAV_PAGES[k]) + '" role="button">' + esc(t[k]) + '</a>';
    }).join('');

    var narrowMq = window.matchMedia ? window.matchMedia('(max-width: 700px)') : null;
    function langLabel(o, narrow) { return narrow ? o.label.split(' ')[0] + ' ' + o.code.toUpperCase() : o.label; }
    var langOptionsHtml = LANG_OPTIONS.map(function (o) {
      return '<option value="' + o.code + '"' + (o.code === lang ? ' selected' : '') + '>' + langLabel(o, narrowMq && narrowMq.matches) + '</option>';
    }).join('');

    var mobileHtml = '<div class="di-nav-mquick">' + quickLink('mi-mercado.html', 'mm', 'di-nav-cta') + quickLink('noticias.html', 'news', 'di-nav-qlink') + quickLink('calendario.html', 'cal', 'di-nav-qlink') + '</div>' + NAV_ORDER.map(function (k) {
      if (k.indexOf('g:') === 0) {
        var g = NAV_GROUPS[k.slice(2)], on = groupIsActive(g);
        return '<div class="di-nav-msec' + (on ? ' is-open' : '') + '"><button type="button" class="di-nav-mbtn' + (on ? ' active' : '') + '" aria-expanded="' + (on ? 'true' : 'false') + '">' + esc(g.label[lang] || g.label.es) + ' <span aria-hidden="true">▾</span></button><div class="di-nav-mbody">' + panelHtml(g) + '</div></div>';
      }
      var isActive = k === activePage && !inGroup;
      return '<a class="' + (isActive ? 'active' : '') + '" href="' + sitePath(NAV_PAGES[k]) + '">' + esc(t[k]) + '</a>';
    }).join('');

    root.innerHTML =
      '<header class="di-header">' +
        '<div class="di-header-inner">' +
          '<a class="di-nav-logo" href="' + sitePath('index.html') + '"><img src="' + sitePath('assets/logo-nav.png') + '" width="116" height="100" alt="Dehesa Index"></a>' +
          '<nav class="di-nav-links">' + linksHtml + '</nav>' +
          '<div class="di-nav-side">' +
            quickLink('mi-mercado.html', 'mm', 'di-nav-cta di-nav-cta-d') +
            '<button type="button" class="di-search-btn" id="di-search-btn" title="' + esc(t.search) + ' ( / )" aria-label="' + esc(t.search) + '">🔍<span class="di-search-lbl" aria-hidden="true">' + esc(t.search) + '</span></button>' +
            '<select class="di-lang-select" id="di-lang-select" title="' + esc(t.langSelect) + '">' + langOptionsHtml + '</select>' +
            '<span class="di-vsep"></span>' +
            '<button class="di-theme-toggle" id="di-theme-toggle" title="' + esc(theme === 'dark' ? t.toLight : t.toDark) + '">' + (theme === 'dark' ? '☀️' : '🌙') + '</button>' +
            '<button class="di-nav-toggle" id="di-mobile-toggle" aria-label="' + esc(t.openMenu) + '" aria-expanded="false">☰</button>' +
          '</div>' +
        '</div>' +
        '<div class="di-nav-mobile-panel" id="di-mobile-panel">' + mobileHtml + '</div>' +
      '</header>';

    document.getElementById('di-search-btn').addEventListener('click', openSearch);
    document.getElementById('di-lang-select').addEventListener('change', function (e) {
      setLang(e.target.value);
    });
    document.getElementById('di-theme-toggle').addEventListener('click', function () {
      toggleTheme();
    });
    var gbtns = root.querySelectorAll('.di-nav-gbtn');
    function closeGroups() { Array.prototype.forEach.call(gbtns, function (b) { b.setAttribute('aria-expanded', 'false'); b.parentNode.classList.remove('is-open'); }); }
    Array.prototype.forEach.call(gbtns, function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = b.parentNode.classList.contains('is-open');
        closeGroups();
        if (!open) { b.parentNode.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('.di-nav-mbtn'), function (b) {
      b.addEventListener('click', function () {
        var open = b.parentNode.classList.toggle('is-open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('.di-nav-menu'), function (m) { m.addEventListener('click', function (e) { e.stopPropagation(); }); });
    if (narrowMq && narrowMq.addEventListener) narrowMq.addEventListener('change', function (ev) {
      var opts = document.querySelectorAll('#di-lang-select option');
      Array.prototype.forEach.call(opts, function (op, ix) { if (LANG_OPTIONS[ix]) op.textContent = langLabel(LANG_OPTIONS[ix], ev.matches); });
    });
    document.addEventListener('click', closeGroups);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeGroups(); });
    var setHdr = function () { var h = root.querySelector('.di-header'); if (!h) return; var st = window.getComputedStyle(h).position; document.documentElement.style.setProperty('--di-hdr-h', (st === 'sticky' || st === 'fixed' ? h.offsetHeight : 0) + 'px'); };
    setHdr(); if (!root.getAttribute('data-hdr')) { root.setAttribute('data-hdr', '1'); window.addEventListener('resize', setHdr); }
    var toggleBtn = document.getElementById('di-mobile-toggle');
    var panel = document.getElementById('di-mobile-panel');
    toggleBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggleBtn.textContent = open ? '✕' : '☰';
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', open ? t.closeMenu : t.openMenu);
    });
  }

  function renderContextBar(activePage) {
    var root = document.getElementById('di-nav-root');
    if (!root) return;
    var qs = new URLSearchParams(window.location.search);
    var product = qs.get('product');
    var region = qs.get('region');
    var crop = qs.get('crop');
    var topic = qs.get('topic');
    var hasContext = !!(product || region || crop || topic);
    var existing = document.getElementById('di-context-bar');
    if (existing) existing.remove();
    if (!hasContext) return;
    var labels = {
      es: { context:'Contexto', prices:'Precios', news:'Noticias', calendar:'Calendario', back:'Atrás', product:'Producto', region:'Mercado' },
      en: { context:'Context', prices:'Prices', news:'News', calendar:'Calendar', back:'Back', product:'Product', region:'Market' },
      fr: { context:'Contexte', prices:'Prix', news:'Actualités', calendar:'Calendrier', back:'Retour', product:'Produit', region:'Marché' },
      it: { context:'Contesto', prices:'Prezzi', news:'Notizie', calendar:'Calendario', back:'Indietro', product:'Prodotto', region:'Mercato' }
    };
    var l = labels[lang] || labels.es;
    var productLabels = {
      trigo:{es:'Trigo',en:'Wheat',fr:'Blé',it:'Grano'},
      maiz:{es:'Maíz',en:'Corn',fr:'Maïs',it:'Mais'},
      arroz:{es:'Arroz',en:'Rice',fr:'Riz',it:'Riso'},
      leche:{es:'Leche',en:'Milk',fr:'Lait',it:'Latte'},
      urea:{es:'Urea',en:'Urea',fr:'Urée',it:'Urea'},
      diesel:{es:'Diésel',en:'Diesel',fr:'Diesel',it:'Diesel'},
      fertilizantes:{es:'Fertilizantes',en:'Fertilizers',fr:'Engrais',it:'Fertilizzanti'}
    };
    var regionLabels = {
      us:{es:'EE. UU.',en:'U.S.',fr:'États-Unis',it:'USA'},
      eu:{es:'Europa',en:'Europe',fr:'Europe',it:'Europa'},
      uk:{es:'Reino Unido',en:'United Kingdom',fr:'Royaume-Uni',it:'Regno Unito'},
      global:{es:'Global',en:'Global',fr:'Mondial',it:'Globale'}
    };
    var cropLabels = {
      trigo:{es:'Trigo',en:'Wheat',fr:'Blé',it:'Grano'}, maiz:{es:'Maíz',en:'Corn',fr:'Maïs',it:'Mais'},
      arroz:{es:'Arroz',en:'Rice',fr:'Riz',it:'Riso'}, cebada:{es:'Cebada',en:'Barley',fr:'Orge',it:'Orzo'},
      soja:{es:'Soja',en:'Soybean',fr:'Soja',it:'Soia'}, leche:{es:'Leche',en:'Milk',fr:'Lait',it:'Latte'},
      fertilizantes:{es:'Fertilizantes',en:'Fertilizers',fr:'Engrais',it:'Fertilizzanti'}, diesel:{es:'Diésel',en:'Diesel',fr:'Diesel',it:'Diesel'}
    };
    var bits = [];
    if (product) bits.push((productLabels[product] || {es:product,en:product,fr:product,it:product})[lang] || product);
    if (crop && !product) bits.push((cropLabels[crop] || {es:crop,en:crop,fr:crop,it:crop})[lang] || crop);
    if (region) bits.push((regionLabels[region] || {es:region,en:region,fr:region,it:region})[lang] || region);
    if (topic) bits.push(topic);
    var mappedProduct = product || ({ fertilizantes:'urea', cebada:'cebada', soja:'soja' }[crop] || crop);
    var contextParams = [];
    if (mappedProduct) contextParams.push('product=' + encodeURIComponent(mappedProduct));
    if (region) contextParams.push('region=' + encodeURIComponent(region));
    var priceHref = sitePath('precios.html') + (contextParams.length ? '?' + contextParams.join('&') : '');
    var newsHref = sitePath('noticias.html') + (contextParams.length ? '?' + contextParams.join('&') : '');
    var calendarParams = [];
    var mappedCrop = crop || ({ urea:'fertilizantes', fertilizantes:'fertilizantes', diesel:'diesel', trigo:'trigo', maiz:'maiz', arroz:'arroz', leche:'leche' }[product] || product);
    if (mappedCrop) calendarParams.push('crop=' + encodeURIComponent(mappedCrop));
    if (region) calendarParams.push('region=' + encodeURIComponent(region));
    var calendarHref = sitePath('calendario.html') + (calendarParams.length ? '?' + calendarParams.join('&') : '');
    var siblingLinks = activePage === 'precios'
      ? '<a href="' + esc(newsHref) + '">' + esc(l.news) + ' →</a><a href="' + esc(calendarHref) + '">' + esc(l.calendar) + ' →</a>'
      : activePage === 'noticias'
        ? '<a href="' + esc(priceHref) + '">' + esc(l.prices) + ' →</a><a href="' + esc(calendarHref) + '">' + esc(l.calendar) + ' →</a>'
        : '<a href="' + esc(priceHref) + '">' + esc(l.prices) + ' →</a><a href="' + esc(newsHref) + '">' + esc(l.news) + ' →</a>';
    var backButton = (document.referrer && document.referrer.indexOf(window.location.origin) === 0)
      ? '<button type="button" class="di-context-back" id="di-context-back">← ' + esc(l.back) + '</button>'
      : '';
    var bar = document.createElement('div');
    bar.className = 'di-context-bar';
    bar.id = 'di-context-bar';
    bar.innerHTML = '<div class="di-context-inner"><div class="di-context-copy"><span class="di-context-kicker">' + esc(l.context) + '</span><strong>' + esc(bits.join(' · ')) + '</strong></div><div class="di-context-actions">' + backButton + siblingLinks + '</div></div>';
    root.appendChild(bar);
    var back = document.getElementById('di-context-back');
    if (back) back.addEventListener('click', function(){ window.history.back(); });
  }

  function renderFooter() {
    var root = document.getElementById('di-footer-root');
    if (!root) return;
    var t = FOOTER_STRINGS[lang] || FOOTER_STRINGS.es;
    var navT = NAV_LABELS[lang] || NAV_LABELS.es;

    var sourcesHtml = FOOTER_SOURCES.map(function (s) {
      var label = s.textKey === 'ec' ? (FOOTER_EC_LABEL[lang] || FOOTER_EC_LABEL.es) : s.text;
      return '<li><a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a></li>';
    }).join('');

    var linksHtml = NAV_KEYS.map(function (k) {
      return '<a href="' + sitePath(NAV_PAGES[k]) + '" style="text-decoration:none;"><button>' + esc(navT[k]) + '</button></a>';
    }).join('');

    root.innerHTML =
      '<footer class="di-footer">' +
        '<div class="di-footer-grid">' +
          '<div data-nosnippet>' +
            '<img src="' + sitePath('assets/logo-nav.png') + '" width="116" height="100" alt="Dehesa Index">' +
            '<p>' + esc(t.blurb) + '</p>' +
          '</div>' +
          '<div>' +
            '<div class="di-footer-title">' + esc(t.sourcesTitle) + '</div>' +
            '<ul>' + sourcesHtml + '</ul>' +
          '</div>' +
          '<div>' +
            '<div class="di-footer-title">' + esc(t.linksTitle) + '</div>' +
            '<div class="di-footer-links">' + linksHtml + '</div>' +
          '</div>' +
          '<div>' +
            '<div class="di-footer-title">' + esc(t.noticeTitle) + '</div>' +
            '<p class="di-footer-notice">' + esc(t.notice) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="di-footer-bottom">' + esc(t.copyrightText) + ' · <a href="' + sitePath('metodologia.html') + '">' + esc(t.methodologyLabel) + '</a> · <a href="' + sitePath('legal.html') + '">' + esc(t.legalLabel) + '</a></div>' +
      '</footer>';
  }



  function setLang(code, opts) {
    if (LANGS.indexOf(code) === -1) return;
    writeLang(code);
    lang = code;
    if (opts && opts.skipReload) {
      renderNav(global.DehesaShared.activePage);
      renderFooter();
      var rel = document.getElementById('di-related'); if (rel) rel.parentNode.removeChild(rel); renderRelated(); frAuto();
      if (typeof global.DehesaShared.onLangChange === 'function') global.DehesaShared.onLangChange(code);
      return;
    }
    window.location.reload();
  }
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    writeTheme(theme);
    applyThemeAttr();
    renderNav(global.DehesaShared.activePage);
    renderContextBar(global.DehesaShared.activePage);
    if (typeof global.DehesaShared.onLangChange === 'function') global.DehesaShared.onLangChange(lang);
  }


  var SORT_T = {
    es: { tip: 'Ordenar por esta columna', asc: 'ascendente', desc: 'descendente' },
    en: { tip: 'Sort by this column', asc: 'ascending', desc: 'descending' },
    fr: { tip: 'Trier par cette colonne', asc: 'croissant', desc: 'décroissant' },
    it: { tip: 'Ordina per questa colonna', asc: 'crescente', desc: 'decrescente' }
  };
  var MONTHS = { ene: 1, jan: 1, janv: 1, gen: 1, feb: 2, fev: 2, 'févr': 2, mar: 3, abr: 4, apr: 4, avr: 4, may: 5, mai: 5, mag: 5, jun: 6, juin: 6, giu: 6, jul: 7, juil: 7, lug: 7, ago: 8, aug: 8, 'août': 8, set: 9, sep: 9, sept: 9, oct: 10, ott: 10, nov: 11, dic: 12, dec: 12, 'déc': 12 };
  var sortState = {}, sortBusy = false;
  function cellText(c) { return (c.getAttribute('data-sort') || c.textContent || '').replace(/\s+/g, ' ').trim(); }
  function parseDate(s) {
    var m;
    if ((m = /^(\d{4})-(\d{2})(?:-(\d{2}))?(?!\d)/.exec(s))) return +m[1] * 10000 + +m[2] * 100 + (m[3] ? +m[3] : 0);
    if ((m = /^(\d{4})-?Q([1-4])$/i.exec(s))) return +m[1] * 10000 + (+m[2] * 3 - 2) * 100;
    if ((m = /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/.exec(s))) return +m[3] * 10000 + +m[2] * 100 + +m[1];
    if ((m = /^(\d{1,2})?\s*([A-Za-zéûÉ]{3,5})\.?\s+(?:de\s+)?(\d{4})$/.exec(s)) && MONTHS[m[2].toLowerCase()]) return +m[3] * 10000 + MONTHS[m[2].toLowerCase()] * 100 + (m[1] ? +m[1] : 0);
    return null;
  }
  function parseNum(s) {
    var m = /^[+\-−–]?\s*[$€£]?\s*\d[\d.,   ]*/.exec(s);
    if (!m) return null;
    var neg = /^[\-−–]/.test(m[0].trim()), x = m[0].replace(/[^\d.,]/g, '');
    var dot = x.lastIndexOf('.'), com = x.lastIndexOf(',');
    if (dot > -1 && com > -1) x = dot > com ? x.replace(/,/g, '') : x.replace(/\./g, '').replace(',', '.');
    else if (com > -1) x = (lang === 'en' && /^\d{1,3}(,\d{3})+$/.test(x)) ? x.replace(/,/g, '') : x.replace(',', '.');
    else if (dot > -1) { if (/^\d{1,3}(\.\d{3})+$/.test(x) && lang !== 'en') x = x.replace(/\./g, ''); }
    var v = parseFloat(x);
    return isNaN(v) ? null : (neg ? -v : v);
  }
  function sortableTable(tb) {
    if (!tb || tb.classList.contains('di-nosort') || tb.classList.contains('di-corr-table') || tb.closest('.di-nosort')) return null;
    var hr = null, rows = tb.rows, i, j;
    for (i = 0; i < rows.length; i++) { if (rows[i].querySelector('th')) { hr = rows[i]; break; } }
    if (!hr || hr.querySelector('[rowspan],[colspan]')) return null;
    var body = [];
    for (i = 0; i < rows.length; i++) {
      if (rows[i] === hr) continue;
      if (rows[i].querySelector('th') && !rows[i].querySelector('td')) return null;
      if (rows[i].querySelector('[colspan]')) return null;
      if (rows[i].cells.length !== hr.cells.length) return null;
      body.push(rows[i]);
    }
    if (body.length < 3) return null;
    for (j = 0; j < hr.cells.length; j++) if (hr.cells[j].tagName !== 'TH') return null;
    return { hr: hr, body: body };
  }
  function tableSig(tb, hr) { var h = []; for (var i = 0; i < hr.cells.length; i++) { var c = hr.cells[i].cloneNode(true), ind = c.querySelector('.di-sort-ind'); if (ind) ind.parentNode.removeChild(ind); h.push(c.textContent.trim()); } return location.pathname + location.search.split('&')[0] + '|' + h.join('|'); }
  function colType(body, col) {
    var n = 0, d = 0, nu = 0, i, v;
    for (i = 0; i < body.length; i++) { v = cellText(body[i].cells[col]); if (!v || /^[–—\-]+$|^n\.?[dsa]\.?$/i.test(v)) continue; n++; if (parseDate(v) != null) d++; else if (parseNum(v) != null) nu++; }
    if (!n) return 'text';
    return d / n >= 0.6 ? 'date' : nu / n >= 0.6 ? 'num' : 'text';
  }
  function applySort(tb, info, col, dir) {
    var type = colType(info.body, col), keyed = info.body.map(function (r, idx) {
      var v = cellText(r.cells[col]), k = null;
      if (type === 'date') k = parseDate(v); else if (type === 'num') k = parseNum(v);
      if (r.getAttribute('data-i0') == null) r.setAttribute('data-i0', idx);
      return { r: r, k: type === 'text' ? v.toLowerCase() : k, empty: type === 'text' ? !v : k == null, o: +r.getAttribute('data-i0') };
    });
    keyed.sort(function (a, b) {
      if (dir === 0) return a.o - b.o;
      if (a.empty !== b.empty) return a.empty ? 1 : -1;
      if (a.empty) return a.o - b.o;
      var c = type === 'text' ? a.k.localeCompare(b.k, lang, { numeric: true, sensitivity: 'base' }) : a.k - b.k;
      return c === 0 ? a.o - b.o : c * (dir === 'asc' ? 1 : -1);
    });
    keyed.forEach(function (x) { x.r.parentNode.appendChild(x.r); });
    paintHeaders(tb, info, col, dir);
  }
  function paintHeaders(tb, info, col, dir) {
    var t = SORT_T[lang] || SORT_T.es;
    for (var j = 0; j < info.hr.cells.length; j++) {
      var th = info.hr.cells[j], ind = th.querySelector('.di-sort-ind');
      if (!ind) { ind = document.createElement('span'); ind.className = 'di-sort-ind'; ind.setAttribute('aria-hidden', 'true'); th.appendChild(ind); }
      th.classList.add('di-sortable'); th.setAttribute('tabindex', '0'); th.setAttribute('role', 'button');
      if (!th.getAttribute('title')) th.setAttribute('title', t.tip);
      if (j === col && dir) { ind.textContent = dir === 'asc' ? ' ▲' : ' ▼'; th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending'); }
      else { ind.textContent = ''; th.removeAttribute('aria-sort'); }
    }
    tb.setAttribute('data-sort-ready', '1');
  }
  function ensureSortable() {
    if (sortBusy) return; sortBusy = true;
    try {
      var tbs = document.querySelectorAll('main table, #app table, .di-card table, table');
      for (var i = 0; i < tbs.length; i++) {
        var tb = tbs[i]; if (tb.getAttribute('data-sort-ready')) continue;
        var info = sortableTable(tb); if (!info) { tb.setAttribute('data-sort-ready', '0'); continue; }
        var st = sortState[tableSig(tb, info.hr)];
        if (st) applySort(tb, info, st.col, st.dir); else paintHeaders(tb, info, -1, 0);
      }
    } catch (e) { }
    sortBusy = false;
  }
  function onSortClick(ev) {
    if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
    var th = ev.target.closest ? ev.target.closest('th.di-sortable') : null; if (!th) return;
    var tb = th.closest('table'), info = tb && sortableTable(tb); if (!info) return;
    if (ev.type === 'keydown') ev.preventDefault();
    var col = th.cellIndex, sig = tableSig(tb, info.hr), st = sortState[sig], type = colType(info.body, col), first = type === 'text' ? 'asc' : 'desc', next;
    if (!st || st.col !== col) next = first; else if (st.dir === first) next = first === 'asc' ? 'desc' : 'asc'; else next = 0;
    sortState[sig] = next ? { col: col, dir: next } : null;
    applySort(tb, info, col, next);
  }
  function initTableSort() {
    var css = document.createElement('style');
    css.textContent = 'th.di-sortable{cursor:pointer;user-select:none;-webkit-user-select:none}th.di-sortable:hover{color:var(--text-primary,inherit)}th.di-sortable:focus-visible{outline:2px solid var(--accent,#2f6b4a);outline-offset:-2px}.di-sort-ind{font-size:9px;white-space:nowrap}';
    document.head.appendChild(css);
    document.addEventListener('click', onSortClick); document.addEventListener('keydown', onSortClick);
    var timer = null;
    new MutationObserver(function () { if (sortBusy) return; clearTimeout(timer); timer = setTimeout(ensureSortable, 60); }).observe(document.body, { childList: true, subtree: true });
    ensureSortable();
  }

  function init(activePage) {
    global.DehesaShared.activePage = activePage;
    renderNav(activePage);
    renderContextBar(activePage);
    renderFooter();
    initTableSort();
    frAuto();
    renderRelatedStable();
  }
  // El bloque «Relacionado» va al final de <main>: si se inserta mientras la pagina aun carga datos, queda a media pantalla y se desplaza cuando llega el contenido (CLS ~0,5 medido).
  // Se inserta cuando la altura de <main> deja de cambiar (dos lecturas seguidas iguales tras la carga) o, como tope, a los 6 s.
  function renderRelatedStable() {
    var host = document.querySelector('main') || document.querySelector('.di-page'); if (!host) return;
    var t0 = Date.now(), last = -1, same = 0;
    (function tick() {
      var h = host.scrollHeight; same = h === last ? same + 1 : 0; last = h;
      if ((document.readyState === 'complete' && same >= 2) || Date.now() - t0 > 6000) { renderRelated(); return; }
      setTimeout(tick, 300);
    })();
  }

  var MKT = null, MKT_P = null;
  function loadMarkets() {
    if (MKT) return Promise.resolve(MKT);
    if (!MKT_P) MKT_P = fetch(sitePath('data/market-labels.json')).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { MKT = d; return d; }).catch(function () { MKT_P = null; return null; });
    return MKT_P;
  }
  function marketLabel(o, lg) {
    if (!o) return '';
    var i = { es: 0, en: 1, fr: 2, it: 3 }[lg || lang]; if (i == null) i = 0;
    if (o.market && o.market.length === 4) return o.market[i];
    if (!MKT) return '';
    var m = MKT.byId[o.id]; if (m) return m[i];
    var src = String(o.sourceId || ''), id = String(o.id || ''), R = MKT.rules;
    var r = R[src] || (/^defra/.test(src) || /_defra_/.test(id) ? R.defra : /eurostat/.test(src) || /_eurostat_/.test(id) ? R.eurostat : null);
    return r ? r[i] : '';
  }
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, QW = { es: 'T', en: 'Q', fr: 'T', it: 'T' };
  function fmtDate(p, lg) {
    lg = lg || lang; var s = String(p == null ? '' : p), m;
    try {
      if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString(LOC[lg] || 'es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      if ((m = /^(\d{4})-(\d{2})$/.exec(s))) return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString(LOC[lg] || 'es-ES', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { return s; }
    if ((m = /^(\d{4})-Q([1-4])$/.exec(s))) return (QW[lg] || 'T') + m[2] + ' ' + m[1];
    return s;
  }

  global.DehesaShared = {
    countryLinks: function (cc) { var r = []; NAV_GROUPS.countries.items.forEach(function (b) { if (b.cc === cc) b.items.forEach(function (i) { r.push({ href: sitePath(i.file) + (i.query || ''), file: i.file, label: i.label[lang] || i.label.es, d: i.d ? (i.d[lang] || i.d.es) : '' }); }); }); return r; },
    newsletter: { action: 'https://dehesaindex.substack.com/api/v1/free?nojs=true', provider: 'Substack (Substack Inc., Estados Unidos)' },
    LANGS: LANGS,
    getLang: function () { return lang; },
    getTheme: function () { return theme; },
    setLang: setLang,
    toggleTheme: toggleTheme,
    init: init,
    renderContextBar: renderContextBar,
    esc: esc,
    marketLabel: marketLabel,
    loadMarkets: loadMarkets,
    fmtDate: fmtDate,
    sitePath: sitePath,
    openSearch: openSearch,
    frame: { crumbs: frCrumbs, bar: frBar },
    onLangChange: null // páginas pueden sobrescribir esto para re-renderizar su contenido sin recargar
  };
})(window);
