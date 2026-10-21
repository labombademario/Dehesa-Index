/* Dehesa Index — página de Apps: estado de la app de iPhone/iPad y de la de Mac. Sin insignia oficial de Apple hasta que haya enlace real. */
(function () {
  'use strict';

  var STRINGS = {
    "es": {
      "title": "Apps para iPhone, iPad y Mac | Dehesa Index",
      "h1": "Dehesa Index en tu móvil y en tu Mac",
      "sub": "Las mismas cifras de la web, con su fuente y su fecha, en una app para iPhone y iPad y en otra para Mac.",
      "iosH": "iPhone y iPad",
      "iosStatus": "Próximamente en la App Store",
      "iosText": "La app está en pruebas con un grupo reducido. Incluye los precios por categoría, las fichas de país con sus indicadores y gráficos que se recorren con el dedo. Cuando salga en la App Store, el botón de descarga aparecerá aquí.",
      "macH": "Mac",
      "macStatus": "Próximamente",
      "macText": "Una ventana de Mac con la web completa. Todavía no está publicada: cuando lo esté, la descarga estará en esta página.",
      "note": "Mientras tanto, la web funciona igual en el navegador de cualquier móvil u ordenador."
    },
    "en": {
      "title": "Apps for iPhone, iPad and Mac | Dehesa Index",
      "h1": "Dehesa Index on your phone and your Mac",
      "sub": "The same figures as the website, with their source and date, in an app for iPhone and iPad and another for Mac.",
      "iosH": "iPhone and iPad",
      "iosStatus": "Coming soon to the App Store",
      "iosText": "The app is being tested with a small group. It includes prices by category, country pages with their indicators, and charts you can scrub with your finger. When it is on the App Store, the download button will appear here.",
      "macH": "Mac",
      "macStatus": "Coming soon",
      "macText": "A Mac window with the full website. It is not published yet: when it is, the download will be on this page.",
      "note": "In the meantime, the website works the same in the browser of any phone or computer."
    },
    "fr": {
      "title": "Apps pour iPhone, iPad et Mac | Dehesa Index",
      "h1": "Dehesa Index sur votre mobile et votre Mac",
      "sub": "Les mêmes chiffres que le site, avec leur source et leur date, dans une app pour iPhone et iPad et une autre pour Mac.",
      "iosH": "iPhone et iPad",
      "iosStatus": "Bientôt sur l’App Store",
      "iosText": "L’app est en test auprès d’un petit groupe. Elle propose les prix par catégorie, des fiches pays avec leurs indicateurs et des graphiques que l’on parcourt du doigt. Quand elle sera sur l’App Store, le bouton de téléchargement apparaîtra ici.",
      "macH": "Mac",
      "macStatus": "Bientôt disponible",
      "macText": "Une fenêtre Mac avec le site complet. Elle n’est pas encore publiée : le moment venu, le téléchargement sera sur cette page.",
      "note": "En attendant, le site fonctionne de la même façon dans le navigateur de n’importe quel mobile ou ordinateur."
    },
    "it": {
      "title": "App | Dehesa Index",
      "h1": "Dehesa Index sul tuo telefono e sul tuo Mac",
      "sub": "Gli stessi dati del sito, con fonte e data, in un’app per iPhone e iPad e in un’altra per Mac.",
      "iosH": "iPhone e iPad",
      "iosStatus": "Presto sull’App Store",
      "iosText": "L’app è in prova con un piccolo gruppo. Include i prezzi per categoria, le schede paese con i loro indicatori e grafici che si scorrono con il dito. Quando sarà sull’App Store, il pulsante di download comparirà qui.",
      "macH": "Mac",
      "macStatus": "Presto disponibile",
      "macText": "Una finestra Mac con il sito completo. Non è ancora pubblicata: quando lo sarà, il download sarà in questa pagina.",
      "note": "Nel frattempo il sito funziona allo stesso modo nel browser di qualsiasi telefono o computer."
    }
  };

  function render() {
    var lang = window.DehesaShared.getLang();
    var t = STRINGS[lang] || STRINGS.es;
    document.title = t.title;
    var set = function (id, v) { document.getElementById(id).textContent = v; };
    set('ap-h1', t.h1); set('ap-sub', t.sub);
    set('ap-ios-h', t.iosH); set('ap-ios-status', t.iosStatus); set('ap-ios-text', t.iosText);
    set('ap-mac-h', t.macH); set('ap-mac-status', t.macStatus); set('ap-mac-text', t.macText);
    set('ap-note', t.note);
  }

  window.DehesaShared.init('app');
  window.DehesaShared.onLangChange = render;
  render();
})();
