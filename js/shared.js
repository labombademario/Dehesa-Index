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
  }
  applyThemeAttr();

  // ---------------------------------------------------------------------
  // Traducciones: Nav, Footer, bienvenida de idioma y tour guiado.
  // ---------------------------------------------------------------------
  var NAV_LABELS = {
    es: { home: 'Inicio', precios: 'Precios', noticias: 'Noticias', calendario: 'Calendario', informacion: 'Información', blog: 'Blog', empresas: 'Empresas', contacto: 'Contacto', toDark: 'Cambiar a modo oscuro', toLight: 'Cambiar a modo claro', langSelect: 'Elegir idioma', openMenu: 'Abrir menú', closeMenu: 'Cerrar menú' },
    en: { home: 'Home', precios: 'Prices', noticias: 'News', calendario: 'Calendar', informacion: 'Information', blog: 'Blog', empresas: 'Business', contacto: 'Contact', toDark: 'Switch to dark mode', toLight: 'Switch to light mode', langSelect: 'Choose language', openMenu: 'Open menu', closeMenu: 'Close menu' },
    fr: { home: 'Accueil', precios: 'Prix', noticias: 'Actualités', calendario: 'Calendrier', informacion: 'Informations', blog: 'Blog', empresas: 'Entreprises', contacto: 'Contact', toDark: 'Passer en mode sombre', toLight: 'Passer en mode clair', langSelect: 'Choisir la langue', openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu' },
    it: { home: 'Home', precios: 'Prezzi', noticias: 'Notizie', calendario: 'Calendario', informacion: 'Informazioni', blog: 'Blog', empresas: 'Aziende', contacto: 'Contatti', toDark: 'Passa alla modalità scura', toLight: 'Passa alla modalità chiara', langSelect: 'Scegli la lingua', openMenu: 'Apri il menu', closeMenu: 'Chiudi il menu' }
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

  var FOOTER_STRINGS = {
    es: {
      blurb: 'Un panel diario y semanal de precios agrícolas de EE. UU. y Europa: cereales, lácteos, ganado, pienso y fertilizantes, todo en un mismo sitio.',
      sourcesTitle: 'FUENTES DE DATOS',
      linksTitle: 'ENLACES',
      noticeTitle: 'AVISO',
      notice: 'Datos de muestra con fines de diseño. No constituyen asesoramiento de inversión ni reflejan precios de mercado en tiempo real.',
      copyrightText: '© 2026 Dehesa Index'
    },
    en: {
      blurb: 'A daily and weekly dashboard of U.S. and European farm prices: grains, dairy, livestock, feed and fertilizer, all in one place.',
      sourcesTitle: 'DATA SOURCES',
      linksTitle: 'LINKS',
      noticeTitle: 'DISCLAIMER',
      notice: 'Sample data for design purposes only. Not investment advice and does not reflect real-time market prices.',
      copyrightText: '© 2026 Dehesa Index'
    },
    fr: {
      blurb: "Un tableau de bord quotidien et hebdomadaire des prix agricoles américains et européens : céréales, produits laitiers, bétail, aliments pour animaux et engrais, réunis en un seul endroit.",
      sourcesTitle: 'SOURCES DES DONNÉES',
      linksTitle: 'LIENS',
      noticeTitle: 'AVERTISSEMENT',
      notice: "Données fictives à des fins de conception. Ne constitue pas un conseil en investissement et ne reflète pas les prix du marché en temps réel.",
      copyrightText: '© 2026 Dehesa Index'
    },
    it: {
      blurb: 'Un pannello giornaliero e settimanale dei prezzi agricoli di Stati Uniti ed Europa: cereali, lattiero-caseario, bestiame, mangimi e fertilizzanti, tutto in un unico posto.',
      sourcesTitle: 'FONTI DEI DATI',
      linksTitle: 'LINK',
      noticeTitle: 'AVVISO',
      notice: 'Dati campione a scopo di progettazione. Non costituiscono consulenza di investimento né riflettono prezzi di mercato in tempo reale.',
      copyrightText: '© 2026 Dehesa Index'
    }
  };
  var FOOTER_URLS = {
    nass: 'https://www.nass.usda.gov/',
    ec: 'https://agridata.ec.europa.eu/extensions/DataPortal/prices.html',
    cme: 'https://www.cmegroup.com/markets/agriculture.html',
    dtn: 'https://www.dtnpf.com/agriculture/web/ag/crops/article/2026/09/23/fertilizer-prices-rise-six-eight'
  };
  var FOOTER_SOURCES = [
    { text: 'USDA NASS / AMS', url: FOOTER_URLS.nass },
    { textKey: 'ec', url: FOOTER_URLS.ec },
    { text: 'CME Group · Euronext', url: FOOTER_URLS.cme },
    { text: 'DTN Fertilizer Index', url: FOOTER_URLS.dtn }
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
    return /\/precios\/[^/]+\/?$/.test(path) ? '../../' : '';
  }
  function sitePath(path) { return sitePrefix() + path; }

  // ---------------------------------------------------------------------
  // Nav
  // ---------------------------------------------------------------------
  function renderNav(activePage) {
    var root = document.getElementById('di-nav-root');
    if (!root) return;
    var t = NAV_LABELS[lang] || NAV_LABELS.es;

    var linksHtml = NAV_KEYS.map(function (k) {
      var isActive = k === activePage;
      return '<a class="' + (isActive ? 'active' : '') + '" href="' + sitePath(NAV_PAGES[k]) + '" role="button">' + esc(t[k]) + '</a>';
    }).join('');

    var langOptionsHtml = LANG_OPTIONS.map(function (o) {
      return '<option value="' + o.code + '"' + (o.code === lang ? ' selected' : '') + '>' + o.label + '</option>';
    }).join('');

    var mobileHtml = NAV_KEYS.map(function (k) {
      var isActive = k === activePage;
      return '<a class="' + (isActive ? 'active' : '') + '" href="' + sitePath(NAV_PAGES[k]) + '">' + esc(t[k]) + '</a>';
    }).join('');

    root.innerHTML =
      '<header class="di-header">' +
        '<div class="di-header-inner">' +
          '<a class="di-nav-logo" href="' + sitePath('index.html') + '"><img src="' + sitePath('assets/logo.png') + '" alt="Dehesa Index"></a>' +
          '<nav class="di-nav-links">' + linksHtml + '</nav>' +
          '<div class="di-nav-side">' +
            '<select class="di-lang-select" id="di-lang-select" title="' + esc(t.langSelect) + '">' + langOptionsHtml + '</select>' +
            '<span class="di-vsep"></span>' +
            '<button class="di-theme-toggle" id="di-theme-toggle" title="' + esc(theme === 'dark' ? t.toLight : t.toDark) + '">' + (theme === 'dark' ? '☀️' : '🌙') + '</button>' +
            '<button class="di-nav-toggle" id="di-mobile-toggle" aria-label="' + esc(t.openMenu) + '" aria-expanded="false">☰</button>' +
          '</div>' +
        '</div>' +
        '<div class="di-nav-mobile-panel" id="di-mobile-panel">' + mobileHtml + '</div>' +
      '</header>';

    document.getElementById('di-lang-select').addEventListener('change', function (e) {
      setLang(e.target.value);
    });
    document.getElementById('di-theme-toggle').addEventListener('click', function () {
      toggleTheme();
    });
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
    bar.innerHTML = '<div class="di-context-inner"><div class="di-context-copy"><span class="di-context-kicker">' + esc(l.context) + '</span><strong>' + esc(bits.join(' · ')) + '</strong></div><div class="di-context-actions">' + backButton + '<a href="' + esc(siblingHref) + '">' + esc(siblingLabel) + ' →</a></div></div>';
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
            '<img src="' + sitePath('assets/logo.png') + '" alt="Dehesa Index">' +
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
        '<div class="di-footer-bottom">' + esc(t.copyrightText) + '</div>' +
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

  function init(activePage) {
    global.DehesaShared.activePage = activePage;
    renderNav(activePage);
    renderContextBar(activePage);
    renderFooter();
    renderWelcomeAndTour();
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
    onLangChange: null // páginas pueden sobrescribir esto para re-renderizar su contenido sin recargar
  };
})(window);
