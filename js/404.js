/* Dehesa Index — pagina 404: buscador y accesos a lo mas usado. ES5. Se sirve en cualquier profundidad de URL, por eso todo va con rutas desde la raiz. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Página no encontrada | Dehesa Index', h1: 'No encontramos esta página', sub: 'La dirección puede haber cambiado o tener un error. Busca el dato que necesitas o elige una de las secciones de abajo.', label: 'Buscar un producto, país o dato', ph: 'Prueba: «precio del trigo», «abono», «Francia»…', go: 'Buscar',
      cards: [['precios.html', 'Panel de precios', 'Todos los productos en EE. UU., UE, Reino Unido y Canadá'], ['brief.html', 'Qué ha cambiado hoy', 'Datos nuevos, mayores movimientos y revisiones del día'], ['calendario.html', 'Calendario agrícola', 'Próximas publicaciones oficiales: USDA, UE, Canadá, Australia'], ['catalogo.html', 'Catálogo de datos', 'Más de 5.800 series por país, métrica y producto']],
      err: '¿Crees que es un error nuestro?', write: 'Escríbenos', err2: 'con la dirección que no funciona.' },
    en: { title: 'Page not found | Dehesa Index', h1: 'We could not find this page', sub: 'The address may have changed or contain a typo. Search for the data you need or pick one of the sections below.', label: 'Search a product, country or data', ph: 'Try: “wheat price”, “fertiliser”, “France”…', go: 'Search',
      cards: [['precios.html', 'Price dashboard', 'Every product in the US, EU, UK and Canada'], ['brief.html', 'What changed today', 'New data, biggest moves and revisions of the day'], ['calendario.html', 'Farm calendar', 'Upcoming official releases: USDA, EU, Canada, Australia'], ['catalogo.html', 'Data catalogue', 'Over 5,800 series by country, metric and product']],
      err: 'Do you think this is our mistake?', write: 'Write to us', err2: 'with the address that does not work.' },
    fr: { title: 'Page introuvable | Dehesa Index', h1: 'Nous ne trouvons pas cette page', sub: 'L’adresse a peut-être changé ou contient une erreur. Cherchez la donnée dont vous avez besoin ou choisissez une section ci-dessous.', label: 'Chercher un produit, un pays ou une donnée', ph: 'Essayez : « prix du blé », « engrais », « France »…', go: 'Chercher',
      cards: [['precios.html', 'Tableau des prix', 'Tous les produits aux États-Unis, dans l’UE, au Royaume-Uni et au Canada'], ['brief.html', 'Ce qui a changé aujourd’hui', 'Nouvelles données, plus grands mouvements et révisions du jour'], ['calendario.html', 'Calendrier agricole', 'Prochaines publications officielles : USDA, UE, Canada, Australie'], ['catalogo.html', 'Catalogue de données', 'Plus de 5 800 séries par pays, mesure et produit']],
      err: 'Vous pensez que c’est une erreur de notre part ?', write: 'Écrivez-nous', err2: 'avec l’adresse qui ne fonctionne pas.' },
    it: { title: 'Pagina non trovata | Dehesa Index', h1: 'Non troviamo questa pagina', sub: 'L’indirizzo potrebbe essere cambiato o contenere un errore. Cerca il dato che ti serve o scegli una delle sezioni qui sotto.', label: 'Cerca un prodotto, un paese o un dato', ph: 'Prova: «prezzo del grano», «concime», «Francia»…', go: 'Cerca',
      cards: [['precios.html', 'Pannello dei prezzi', 'Tutti i prodotti in USA, UE, Regno Unito e Canada'], ['brief.html', 'Cosa è cambiato oggi', 'Nuovi dati, maggiori movimenti e revisioni del giorno'], ['calendario.html', 'Calendario agricolo', 'Prossime pubblicazioni ufficiali: USDA, UE, Canada, Australia'], ['catalogo.html', 'Catalogo dei dati', 'Oltre 5.800 serie per paese, metrica e prodotto']],
      err: 'Pensi che sia un nostro errore?', write: 'Scrivici', err2: 'con l’indirizzo che non funziona.' }
  };
  var pm = /^\/(en|fr|it)(\/|$)/.exec(window.location.pathname || '');
  if (pm) { try { window.localStorage.setItem('dehesaIndexLang', pm[1]); } catch (e) { } }
  function $(id) { return document.getElementById(id); }
  function lang() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return T[l] ? l : 'es'; }
  function href(f) { return window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath(f) : '/' + f; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function render() {
    var t = T[lang()], l = lang();
    document.documentElement.lang = l; document.title = t.title;
    $('e4-h1').textContent = t.h1; $('e4-sub').textContent = t.sub; $('e4-label').textContent = t.label; $('e4-q').setAttribute('placeholder', t.ph); $('e4-go').textContent = t.go;
    $('e4-cards').innerHTML = t.cards.map(function (c) { return '<a class="di-card di-404-card" href="' + esc(href(c[0])) + '"><b>' + esc(c[1]) + '</b><span>' + esc(c[2]) + '</span></a>'; }).join('');
    $('e4-err').innerHTML = esc(t.err) + ' <a href="' + esc(href('contacto.html')) + '">' + esc(t.write) + '</a> ' + esc(t.err2);
  }
  if (window.DehesaShared && window.DehesaShared.init) window.DehesaShared.init('404');
  render();
  if (window.DehesaShared) window.DehesaShared.onLangChange = render;
  $('e4-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = $('e4-q').value.trim();
    if (window.DehesaShared && window.DehesaShared.openSearch) window.DehesaShared.openSearch(q);
  });
  try { $('e4-q').focus(); } catch (e) { }
})();
