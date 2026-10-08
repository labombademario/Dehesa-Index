/* Dehesa Index — «Avisar de un problema» en cada serie (idea 6, 8-oct-2026): un correo ya rellenado con la serie, el periodo y la página.
   Sin formularios ni datos guardados. Se carga solo en las páginas que muestran series (precios, producto, países, revisiones). ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared; if (!S) return;
  // «Avisar de un problema» en cada serie (auditoria 8-oct-2026): un correo ya rellenado con la serie, el periodo y la pagina; sin formularios ni datos guardados
  var RP = { es: ['Avisar de un problema', 'Problema con una serie', 'Serie', 'Periodo', 'Valor', 'Página', 'Qué has visto (y qué esperabas):'], en: ['Report a problem', 'Problem with a series', 'Series', 'Period', 'Value', 'Page', 'What you saw (and what you expected):'], fr: ['Signaler un problème', 'Problème sur une série', 'Série', 'Période', 'Valeur', 'Page', 'Ce que vous avez vu (et ce que vous attendiez) :'], it: ['Segnala un problema', 'Problema con una serie', 'Serie', 'Periodo', 'Valore', 'Pagina', 'Cosa hai visto (e cosa ti aspettavi):'] };
  function reportHref(o) {
    o = o || {}; var r = RP[S.getLang()] || RP.es, b = [r[2] + ': ' + (o.label || '') + (o.id ? ' [' + o.id + ']' : ''), o.period ? r[3] + ': ' + o.period : '', o.value != null ? r[4] + ': ' + o.value + (o.unit ? ' ' + o.unit : '') : '', r[5] + ': ' + window.location.href, '', r[6], ''].filter(function (x, i) { return x || i > 3; }).join('\n');
    return 'mailto:hola@dehesaindex.com?subject=' + encodeURIComponent(r[1] + ': ' + (o.id || o.label || '')) + '&body=' + encodeURIComponent(b);
  }
  function reportLink(o, cls) { return '<a class="' + (cls || 'di-report') + '" href="' + S.esc(reportHref(o)) + '">⚑ ' + S.esc((RP[S.getLang()] || RP.es)[0]) + '</a>'; }

  S.reportHref = reportHref; S.reportLink = reportLink;
})();
