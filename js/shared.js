/* Dehesa Index — lógica compartida entre todas las páginas:
   idioma + tema (persistidos en localStorage), Nav, Footer,
   pantalla de bienvenida de idioma y tour guiado.
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
  function readTourSeen() {
    try { return window.localStorage.getItem('dehesaIndexTourSeen') === '1'; } catch (e) { return false; }
  }
  function writeTourSeen() {
    try { window.localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {}
  }

  var lang = readLang() || 'es';
  var theme = readTheme();

  function applyThemeAttr() {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('lang', lang); // WCAG 3.1.1: el idioma de la pagina sigue al selector
  }
  applyThemeAttr();

  // ---------------------------------------------------------------------
  // Traducciones: Nav, Footer, bienvenida de idioma y tour guiado.
  // ---------------------------------------------------------------------
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

  // Submenús de datos. Cada grupo agrupa páginas que cuelgan de él; el resto del menú no cambia.
  var NAV_ORDER = ['home', 'precios', 'noticias', 'calendario', 'g:data', 'g:tools', 'informacion', 'blog', 'empresas', 'contacto'];
  // Hojas: { file, query?, hash?, label }. Ramas: { items: [...], label } (se despliegan dentro del menú).
  var NAV_GROUPS = {
    data: { label: { es: 'Datos', en: 'Data', fr: 'Données', it: 'Dati' }, items: [
      { file: 'perfiles.html', label: { es: 'Perfiles de país y comparador', en: 'Country profiles and comparison', fr: 'Profils de pays et comparateur', it: 'Profili paese e confronto' } },
      { label: { es: 'EE. UU.', en: 'United States', fr: 'États-Unis', it: 'Stati Uniti' }, items: [
        { file: 'paises.html', query: '?c=US', label: { es: 'Perfil de EE. UU. (macro y tipos de interés)', en: 'US profile (macro and interest rates)', fr: 'Profil des États-Unis (macro et taux)', it: 'Profilo USA (macro e tassi)' } },
        { file: 'mercados.html', label: { es: 'Mercados USDA', en: 'USDA markets', fr: 'Marchés USDA', it: 'Mercati USDA' } },
        { file: 'exportaciones.html', label: { es: 'Exportaciones', en: 'Exports', fr: 'Exportations', it: 'Esportazioni' } },
        { file: 'oferta-demanda.html', label: { es: 'Oferta y demanda', en: 'Supply and demand', fr: 'Offre et demande', it: 'Offerta e domanda' } },
        { file: 'cultivos.html', label: { es: 'Estado de los cultivos', en: 'Crop progress', fr: 'État des cultures', it: 'Stato delle colture' } },
        { file: 'rendimientos.html', label: { es: 'Rendimientos', en: 'Yields', fr: 'Rendements', it: 'Rese' } },
        { file: 'ganaderia.html', label: { es: 'Ganadería', en: 'Livestock', fr: 'Élevage', it: 'Zootecnia' } },
        { file: 'sequia.html', label: { es: 'Sequía', en: 'Drought', fr: 'Sécheresse', it: 'Siccità' } },
        { file: 'insumos.html', label: { es: 'Insumos', en: 'Inputs', fr: 'Intrants', it: 'Input' } },
        { file: 'costes.html', label: { es: 'Costes', en: 'Costs', fr: 'Coûts', it: 'Costi' } },
        { file: 'aranceles.html', label: { es: 'Aranceles', en: 'Tariffs', fr: 'Droits de douane', it: 'Dazi' } }
      ] },
      { label: { es: 'Europa', en: 'Europe', fr: 'Europe', it: 'Europa' }, items: [
        { file: 'paises.html', query: '?c=EU', label: { es: 'Perfil de la Unión Europea (macro y tipos)', en: 'European Union profile (macro and rates)', fr: 'Profil de l’Union européenne (macro et taux)', it: 'Profilo Unione europea (macro e tassi)' } },
        { file: 'europa.html', label: { es: 'Precios de la UE (todos los países)', en: 'EU prices (all countries)', fr: 'Prix de l’UE (tous les pays)', it: 'Prezzi UE (tutti i paesi)' } },
        { file: 'index.html', hash: '#home-dehesa-index', label: { es: 'Índice Dehesa (UE y EE. UU.)', en: 'Dehesa Index (EU and US)', fr: 'Indice Dehesa (UE et États-Unis)', it: 'Indice Dehesa (UE e Stati Uniti)' }, noActive: true },
        { file: 'paises.html', query: '?c=ES', label: { es: 'España', en: 'Spain', fr: 'Espagne', it: 'Spagna' } },
        { file: 'paises.html', query: '?c=FR', label: { es: 'Francia', en: 'France', fr: 'France', it: 'Francia' } },
        { file: 'paises.html', query: '?c=DE', label: { es: 'Alemania', en: 'Germany', fr: 'Allemagne', it: 'Germania' } },
        { file: 'paises.html', query: '?c=BE', label: { es: 'Bélgica', en: 'Belgium', fr: 'Belgique', it: 'Belgio' } },
        { file: 'paises.html', query: '?c=AT', label: { es: 'Austria', en: 'Austria', fr: 'Autriche', it: 'Austria' } },
        { file: 'paises.html', query: '?c=PT', label: { es: 'Portugal', en: 'Portugal', fr: 'Portugal', it: 'Portogallo' } },
        { file: 'paises.html', query: '?c=DK', label: { es: 'Dinamarca', en: 'Denmark', fr: 'Danemark', it: 'Danimarca' } },
        { file: 'paises.html', query: '?c=NL', label: { es: 'Países Bajos', en: 'Netherlands', fr: 'Pays-Bas', it: 'Paesi Bassi' } },
        { file: 'recan.html', label: { es: 'España: costes y rentas de las explotaciones', en: 'Spain: farm costs and incomes', fr: 'Espagne : coûts et revenus des exploitations', it: 'Spagna: costi e redditi delle aziende' } }
      ] },
      { label: { es: 'Otros países', en: 'Other countries', fr: 'Autres pays', it: 'Altri paesi' }, items: [
        { file: 'paises.html', query: '?c=CA', label: { es: 'Canadá (producción, renta y tipos)', en: 'Canada (production and income)', fr: 'Canada (production et revenu)', it: 'Canada (produzione e reddito)' } },
        { file: 'paises.html', query: '?c=AU', label: { es: 'Australia', en: 'Australia', fr: 'Australie', it: 'Australia' } }
      ] }
    ] },
    tools: { label: { es: 'Herramientas', en: 'Tools', fr: 'Outils', it: 'Strumenti' }, items: [
      { file: 'producto.html', query: '?p=trigo', label: { es: 'Ficha de producto', en: 'Product page', fr: 'Fiche produit', it: 'Scheda prodotto' } },
      { file: 'mapa.html', label: { es: 'Mapa agrícola', en: 'Farm map', fr: 'Carte agricole', it: 'Mappa agricola' } },
      { file: 'clima.html', label: { es: 'Clima agrícola', en: 'Farm weather', fr: 'Météo agricole', it: 'Meteo agricolo' } },
      { file: 'catalogo.html', label: { es: 'Catálogo de datos', en: 'Data catalogue', fr: 'Catalogue de données', it: 'Catalogo dei dati' } },
      { file: 'calculadora.html', label: { es: 'Calculadora de margen', en: 'Margin calculator', fr: 'Calculateur de marge', it: 'Calcolatore di margine' } },
      { file: 'relaciones.html', label: { es: 'Relaciones entre mercados', en: 'Cross-market relationships', fr: 'Relations entre marchés', it: 'Relazioni tra mercati' } },
      { file: 'comparador.html', label: { es: 'Comparador por producto y país', en: 'Product and country comparator', fr: 'Comparateur par produit et pays', it: 'Confronto per prodotto e paese' } },
      { file: 'brief.html', label: { es: 'Qué ha cambiado hoy', en: 'What changed today', fr: 'Ce qui a changé aujourd’hui', it: 'Cosa è cambiato oggi' } },
      { file: 'status.html', label: { es: 'Estado de los datos', en: 'Data status', fr: 'État des données', it: 'Stato dei dati' } }
    ] }
  };
  function currentFile() { var f = window.location.pathname.split('/').pop(); return f || 'index.html'; }
  function leafActive(i) {
    if (i.noActive || i.file !== currentFile()) return false;
    if (i.query && i.query.indexOf('?c=') === 0) { var c = (new URLSearchParams(window.location.search).get('c') || 'ES').toUpperCase(); return c === i.query.slice(3); }
    return true;
  }
  function branchActive(list) { return list.some(function (i) { return i.items ? branchActive(i.items) : leafActive(i); }); }
  function groupIsActive(g) { return branchActive(g.items); }
  // Menú recursivo: las ramas son acordeones; se abre sola la que contiene la página actual.
  function navItems(list, cls, sub) {
    return list.map(function (i) {
      var lab = esc(i.label[lang] || i.label.es);
      if (i.items) {
        var on = branchActive(i.items);
        return '<div class="di-nav-sub' + (on ? ' is-open' : '') + '"><button type="button" class="di-nav-subbtn' + (on ? ' active' : '') + '" aria-expanded="' + (on ? 'true' : 'false') + '">' + lab + ' <span aria-hidden="true">▾</span></button><div class="di-nav-subitems">' + navItems(i.items, cls, true) + '</div></div>';
      }
      return '<a class="' + cls + (leafActive(i) ? ' active' : '') + '" href="' + sitePath(i.file) + (i.query || '') + (i.hash || '') + '">' + lab + '</a>';
    }).join('');
  }

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

  var LANG_WELCOME_TITLE = 'Elige tu idioma · Choose your language<br>Choisissez votre langue · Scegli la lingua';

  var TOUR_STEPS_BY_LANG = {
    es: [
      { icon: '🌾', title: 'Bienvenido a Dehesa Index', body: 'Un vistazo rápido a las herramientas del panel de precios, para que sepas dónde está cada cosa.' },
      { icon: '🗺️', title: 'Dehesa Market Map', body: 'Un mapa de calor con los 18 productos: el tamaño indica su peso en el mercado global, el color si sube o baja esta semana.' },
      { icon: '🎯', title: 'Dehesa Agricultural Momentum', body: 'Compara el movimiento a corto y largo plazo de cada producto en un solo gráfico, para detectar tendencias de un vistazo.' },
      { icon: '🗓️', title: 'Calendario y Noticias', body: 'El calendario reúne los próximos informes y datos clave; Noticias resume la actualidad que mueve estos mercados.' },
      { icon: '🔍', title: 'Buscador, favoritos y alertas', body: 'Usa la lupa de arriba del todo para saltar directo a cualquier producto, marca tus favoritos con la ☆ y crea alertas de precio con la 🔔.' }
    ],
    en: [
      { icon: '🌾', title: 'Welcome to Dehesa Index', body: "A quick look at the price dashboard's tools, so you know where everything lives." },
      { icon: '🗺️', title: 'Dehesa Market Map', body: "A heat map of all 18 products: size shows its weight in the global market, color shows whether it's up or down this week." },
      { icon: '🎯', title: 'Dehesa Agricultural Momentum', body: "Compares each product's short- and long-term movement on a single chart, so you can spot trends at a glance." },
      { icon: '🗓️', title: 'Calendar & News', body: "The calendar gathers upcoming reports and key data releases; News summarizes what's moving these markets." },
      { icon: '🔍', title: 'Search, favorites & alerts', body: 'Use the search box at the top to jump straight to any product, star your favorites with ☆, and set price alerts with 🔔.' }
    ],
    fr: [
      { icon: '🌾', title: 'Bienvenue sur Dehesa Index', body: "Un aperçu rapide des outils du tableau des prix, pour savoir où se trouve chaque chose." },
      { icon: '🗺️', title: 'Dehesa Market Map', body: "Une carte thermique des 18 produits : la taille indique son poids sur le marché mondial, la couleur s'il monte ou baisse cette semaine." },
      { icon: '🎯', title: 'Dehesa Agricultural Momentum', body: "Compare l'évolution à court et long terme de chaque produit sur un seul graphique, pour repérer les tendances en un coup d'œil." },
      { icon: '🗓️', title: 'Calendrier et actualités', body: "Le calendrier rassemble les prochains rapports et données clés ; Actualités résume ce qui fait bouger ces marchés." },
      { icon: '🔍', title: 'Recherche, favoris et alertes', body: "Utilisez la recherche tout en haut pour accéder directement à un produit, marquez vos favoris avec ☆ et créez des alertes de prix avec 🔔." }
    ],
    it: [
      { icon: '🌾', title: 'Benvenuto in Dehesa Index', body: "Una rapida panoramica degli strumenti del pannello dei prezzi, per sapere dove trovare ogni cosa." },
      { icon: '🗺️', title: 'Dehesa Market Map', body: "Una mappa di calore dei 18 prodotti: la dimensione indica il suo peso nel mercato globale, il colore se sale o scende questa settimana." },
      { icon: '🎯', title: 'Dehesa Agricultural Momentum', body: "Confronta l'andamento a breve e lungo termine di ogni prodotto in un unico grafico, per individuare le tendenze a colpo d'occhio." },
      { icon: '🗓️', title: 'Calendario e notizie', body: "Il calendario raccoglie i prossimi report e dati chiave; Notizie riassume l'attualità che muove questi mercati." },
      { icon: '🔍', title: 'Ricerca, preferiti e avvisi', body: "Usa la ricerca in cima alla pagina per andare direttamente a un prodotto, segna i preferiti con ☆ e crea avvisi di prezzo con 🔔." }
    ]
  };
  var TOUR_NAV_BY_LANG = {
    es: { back: 'Atrás', next: 'Siguiente', finish: 'Ir a Precios', skip: 'Saltar tour' },
    en: { back: 'Back', next: 'Next', finish: 'Go to Prices', skip: 'Skip tour' },
    fr: { back: 'Précédent', next: 'Suivant', finish: 'Aller aux prix', skip: 'Passer le tour' },
    it: { back: 'Indietro', next: 'Avanti', finish: 'Vai ai prezzi', skip: 'Salta il tour' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function sitePrefix() {
    var path = (window.location && window.location.pathname) || '';
    if (/\/datos\/en\/[^/]+\/?$/.test(path)) return '../../../';
    return /\/(precios|datos)\/[^/]+\/?$/.test(path) ? '../../' : '';
  }
  function sitePath(path) { return sitePrefix() + path; }

  /* Accesibilidad y movil: tablas con scope/data-label (tarjetas en pantallas estrechas) y foco visible */
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
        if (heads.length >= 3 && heads.length <= 8 && rows.length) t.classList.add('di-cards-m');
      }
    }
    // Regiones con scroll horizontal: accesibles por teclado (WCAG 2.1.1) si no contienen nada enfocable.
    function scrollRegions() {
      var els = document.querySelectorAll('main *, .di-ticker, .di-chart-svg-wrap'), n = Math.min(els.length, 4000);
      for (var i = 0; i < n; i++) {
        var e = els[i]; if (e.hasAttribute('tabindex') || e.scrollWidth <= e.clientWidth + 1 || !e.clientWidth) continue;
        var ox = getComputedStyle(e).overflowX; if (ox !== 'auto' && ox !== 'scroll' && !(ox === 'hidden' && e.classList.contains('di-ticker'))) continue;
        if (e.querySelector('a[href],button,input,select,textarea,[tabindex]')) continue;
        e.setAttribute('tabindex', '0');
      }
    }
    function run() { fix(document); scrollRegions(); try { new MutationObserver(function () { clearTimeout(run.t); run.t = setTimeout(function () { fix(document); scrollRegions(); }, 150); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  })();

  /* Avisos de la lista de seguimiento: solo si hay reglas guardadas se carga watchlist.js y se muestra el aviso flotante */
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

  /* PWA: manifiesto y service worker (cache parcial; sin conexion se sirven las paginas ya vistas) */
  (function pwa() {
    try {
      if (!document.querySelector('link[rel="manifest"]')) { var l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.webmanifest'; document.head.appendChild(l); }
      if (!document.querySelector('meta[name="theme-color"]')) { var m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#2f6b3a'; document.head.appendChild(m); }
      if ('serviceWorker' in navigator && (location.protocol === 'https:' || (location.hostname === 'localhost' && /pwa=1/.test(location.search)))) {
        window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
      }
    } catch (e) {}
  })();

  // ---------------------------------------------------------------------
  // Nav
  // ---------------------------------------------------------------------
  // Buscador global: se carga solo la primera vez que se abre (js/search.js + data/search-index.json)
  function openSearch() {
    if (window.DehesaSearch) { window.DehesaSearch.open(); return; }
    window.__diSearchWantOpen = true;
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
        var g = NAV_GROUPS[k.slice(2)], on = groupIsActive(g);
        return '<div class="di-nav-group"><button type="button" class="di-nav-gbtn' + (on ? ' active' : '') + '" aria-haspopup="true" aria-expanded="false">' + esc(g.label[lang] || g.label.es) + ' <span aria-hidden="true">▾</span></button>' +
          '<div class="di-nav-menu">' + navItems(g.items, '') + '</div></div>';
      }
      var isActive = k === activePage && !inGroup;
      return '<a class="' + (isActive ? 'active' : '') + '" href="' + sitePath(NAV_PAGES[k]) + '" role="button">' + esc(t[k]) + '</a>';
    }).join('');

    var langOptionsHtml = LANG_OPTIONS.map(function (o) {
      return '<option value="' + o.code + '"' + (o.code === lang ? ' selected' : '') + '>' + o.label + '</option>';
    }).join('');

    var mobileHtml = NAV_ORDER.map(function (k) {
      if (k.indexOf('g:') === 0) {
        var g = NAV_GROUPS[k.slice(2)];
        return '<div class="di-nav-mgroup">' + esc(g.label[lang] || g.label.es) + '</div>' + navItems(g.items, 'di-nav-msub');
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
            '<button type="button" class="di-search-btn" id="di-search-btn" title="' + esc(t.search) + ' ( / )" aria-label="' + esc(t.search) + '">🔍</button>' +
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
    Array.prototype.forEach.call(document.querySelectorAll('.di-nav-subbtn'), function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var p = b.parentNode, open = p.classList.toggle('is-open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', closeGroups);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeGroups(); });
    var toggleBtn = document.getElementById('di-mobile-toggle');
    var panel = document.getElementById('di-mobile-panel');
    toggleBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggleBtn.textContent = open ? '✕' : '☰';
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', open ? t.closeMenu : t.openMenu);
    });
  }

  // ---------------------------------------------------------------------
  // Contexto de navegación: conserva la relación entre módulos sin obligar
  // al usuario a volver al principio de la página.
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // Footer
  // ---------------------------------------------------------------------
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
          '<div>' +
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

  // ---------------------------------------------------------------------
  // Bienvenida de idioma + tour guiado (solo la primera visita)
  // ---------------------------------------------------------------------
  function renderWelcomeAndTour() {
    var overlayRoot = document.getElementById('di-overlay-root');
    if (!overlayRoot) return;

    var hasSavedLang = !!readLang();
    var tourSeen = readTourSeen();
    var showWelcome = !hasSavedLang;
    var tourStep = 0;

    function closeAll() { overlayRoot.innerHTML = ''; }

    function paintWelcome() {
      var html =
        '<div class="di-modal-overlay">' +
          '<div class="di-modal-card">' +
            '<h2>' + LANG_WELCOME_TITLE + '</h2>' +
            '<div class="di-lang-grid">' +
              LANG_OPTIONS.map(function (o) {
                return '<button data-lang="' + o.code + '">' + o.label + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>';
      overlayRoot.innerHTML = html;
      Array.prototype.forEach.call(overlayRoot.querySelectorAll('button[data-lang]'), function (btn) {
        btn.addEventListener('click', function () {
          setLang(btn.getAttribute('data-lang'), { skipReload: true });
          if (!readTourSeen()) { paintTour(); } else { closeAll(); }
        });
      });
    }

    function paintTour() {
      var steps = TOUR_STEPS_BY_LANG[lang] || TOUR_STEPS_BY_LANG.es;
      var tn = TOUR_NAV_BY_LANG[lang] || TOUR_NAV_BY_LANG.es;
      tourStep = Math.max(0, Math.min(tourStep, steps.length - 1));
      var isLast = tourStep === steps.length - 1;
      var cur = steps[tourStep];
      var dotsHtml = steps.map(function (_, i) {
        return '<span class="' + (i === tourStep ? 'active' : '') + '" style="width:' + (i === tourStep ? 8 : 6) + 'px;height:' + (i === tourStep ? 8 : 6) + 'px;"></span>';
      }).join('');
      var html =
        '<div class="di-modal-overlay di-tour-overlay">' +
          '<div class="di-tour-card">' +
            '<div class="di-tour-skip-row"><button class="di-tour-skip" id="di-tour-skip">' + esc(tn.skip) + '</button></div>' +
            '<div class="di-tour-body">' +
              '<div class="di-tour-icon">' + cur.icon + '</div>' +
              '<h2>' + esc(cur.title) + '</h2>' +
              '<p>' + esc(cur.body) + '</p>' +
            '</div>' +
            '<div class="di-tour-dots">' + dotsHtml + '</div>' +
            '<div class="di-tour-nav">' +
              (tourStep > 0 ? '<button class="di-tour-back" id="di-tour-back">' + esc(tn.back) + '</button>' : '<span></span>') +
              '<button class="di-tour-next" id="di-tour-next">' + esc(isLast ? tn.finish : tn.next) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      overlayRoot.innerHTML = html;
      var backBtn = document.getElementById('di-tour-back');
      if (backBtn) backBtn.addEventListener('click', function () { tourStep = Math.max(0, tourStep - 1); paintTour(); });
      document.getElementById('di-tour-next').addEventListener('click', function () {
        if (tourStep >= steps.length - 1) {
          writeTourSeen();
          closeAll();
          if (!/precios\.html$/.test(window.location.pathname)) {
            window.location.href = sitePath('precios.html');
          }
        } else {
          tourStep += 1;
          paintTour();
        }
      });
      document.getElementById('di-tour-skip').addEventListener('click', function () {
        writeTourSeen();
        closeAll();
      });
    }

    if (showWelcome) {
      paintWelcome();
    } else if (!tourSeen) {
      paintTour();
    }
  }

  // ---------------------------------------------------------------------
  // Setters compartidos: idioma y tema. Recargan la página para que todo
  // el contenido (no solo Nav/Footer) se vuelva a pintar en el idioma o
  // tema elegido -- cada página guarda su propio estado de UI (pestaña
  // activa, filtros...) por separado si quiere sobrevivir a la recarga.
  // ---------------------------------------------------------------------
  function setLang(code, opts) {
    if (LANGS.indexOf(code) === -1) return;
    writeLang(code);
    lang = code;
    if (opts && opts.skipReload) {
      renderNav(global.DehesaShared.activePage);
      renderFooter();
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
    // Algunas páginas pintan colores dependientes del tema directamente en el
    // HTML (p. ej. los SVG de las minigráficas) -- reutilizamos el mismo
    // callback que el cambio de idioma para que esas páginas se repinten.
    if (typeof global.DehesaShared.onLangChange === 'function') global.DehesaShared.onLangChange(lang);
  }


  // ── Tablas ordenables: clic en la cabecera (A-Z, mayor-menor, fecha), otro clic invierte, un tercero restaura ──
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
    renderWelcomeAndTour();
    initTableSort();
  }

  global.DehesaShared = {
    LANGS: LANGS,
    getLang: function () { return lang; },
    getTheme: function () { return theme; },
    setLang: setLang,
    toggleTheme: toggleTheme,
    init: init,
    renderContextBar: renderContextBar,
    esc: esc,
    sitePath: sitePath,
    openSearch: openSearch,
    onLangChange: null // páginas pueden sobrescribir esto para re-renderizar su contenido sin recargar
  };
})(window);
