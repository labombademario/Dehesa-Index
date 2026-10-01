/* Dehesa Index — nombres y banderas de los agregados que trae el catalogo Agri-food de la UE (no son paises). ES5.
   DIAgg.label(codigo, idioma) -> nombre legible o null; DIAgg.flag(codigo) -> bandera o ''. */
(function () {
  'use strict';
  var L = {
    'EU+UK': { es: 'UE y Reino Unido (media)', en: 'EU and UK (average)', fr: 'UE et Royaume-Uni (moyenne)', it: 'UE e Regno Unito (media)' },
    'EU-UK': { es: 'UE sin Reino Unido (media)', en: 'EU excluding UK (average)', fr: 'UE hors Royaume-Uni (moyenne)', it: 'UE senza Regno Unito (media)' },
    'EU Average': { es: 'Media UE', en: 'EU average', fr: 'Moyenne UE', it: 'Media UE' },
    'EU13': { es: 'UE-13 (Estados miembros desde 2004)', en: 'EU-13 (Member States since 2004)', fr: 'UE-13 (États membres depuis 2004)', it: 'UE-13 (Stati membri dal 2004)' },
    'EU14': { es: 'UE-14 (UE-15 sin Reino Unido)', en: 'EU-14 (EU-15 without UK)', fr: 'UE-14 (UE-15 sans Royaume-Uni)', it: 'UE-14 (UE-15 senza Regno Unito)' },
    'EU15': { es: 'UE-15 (miembros antes de 2004)', en: 'EU-15 (members before 2004)', fr: 'UE-15 (membres avant 2004)', it: 'UE-15 (membri prima del 2004)' }
  };
  var S = { es: 'Región azucarera ', en: 'Sugar region ', fr: 'Région sucrière ', it: 'Regione dello zucchero ' };
  function label(c, lg) {
    lg = L['EU13'][lg] ? lg : 'es';
    if (L[c]) return L[c][lg];
    var m = /^Region (\d)$/.exec(c); if (m) return S[lg] + m[1];
    return null;
  }
  function flag(c) { return L[c] ? '🇪🇺' : ''; }
  window.DIAgg = { label: label, flag: flag };
})();
