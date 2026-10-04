/* Dehesa Index — Ganadería de Canadá por provincia (Statistics Canada, tablas 32-10-0130 vacuno, 32-10-0160 porcino y 32-10-0129 ovino; data/canada-provinces.json).
   Pestaña «Canadá» de ganaderia.html sobre js/ca-explorer.js. Existencias a 1 de enero y 1 de julio. Un hueco es un hueco. ES5. */
(function () {
  'use strict';
  var ITEMS = [
    ['cattle', 'total-cattle', ['Vacuno · total', 'Cattle · total', 'Bovins · total', 'Bovini · totale']],
    ['cattle', 'beef-cows', ['Vacas de carne', 'Beef cows', 'Vaches de boucherie', 'Vacche da carne']],
    ['cattle', 'dairy-cows', ['Vacas lecheras', 'Dairy cows', 'Vaches laitières', 'Vacche da latte']],
    ['cattle', 'total-heifers', ['Novillas', 'Heifers', 'Génisses', 'Giovenche']],
    ['cattle', 'calves-under-1-year', ['Terneros de menos de 1 año', 'Calves under 1 year', 'Veaux de moins d’un an', 'Vitelli sotto 1 anno']],
    ['hogs', 'hogs-total', ['Cerdos · total', 'Hogs · total', 'Porcs · total', 'Suini · totale']],
    ['hogs', 'sows-and-gilts-6-months-and-over', ['Cerdas reproductoras (6 meses o más)', 'Sows and gilts (6 months and over)', 'Truies et cochettes (6 mois et plus)', 'Scrofe e scrofette (6 mesi e oltre)']],
    ['sheep', 'sheep-and-lambs-total', ['Ovino · total', 'Sheep and lambs · total', 'Ovins · total', 'Ovini · totale']],
    ['sheep', 'ewes', ['Ovejas', 'Ewes', 'Brebis', 'Pecore']],
    ['sheep', 'lambs-for-marketing', ['Corderos para sacrificio', 'Lambs for marketing', 'Agneaux de marché', 'Agnelli da macello']]
  ];
  var items = ITEMS.map(function (x) { return { id: x[0] + '/' + x[1], label: x[2] }; });
  function ser(D, prov, item, m) { var p = item.split('/'), P = D.provinces[prov], g = P && P[p[0]], s = g && g[p[1]]; return s ? s.pts || null : null; }
  var T = {
    es: { tabUS: 'EE. UU. (por estado)', tabCA: 'Canadá (por provincia)', title: 'Ganadería de Canadá por provincia', sub: 'Existencias de vacuno, porcino y ovino a 1 de enero y 1 de julio, por provincia. Datos de Statistics Canada tal como se publican.',
      item: 'Categoría', measure: 'Cifra', period: 'Fecha del censo', head: 'Existencias', ca: 'Canadá', vsPrev: 'frente al mismo censo del año anterior', hist: 'Evolución nacional', prov: 'Por provincia', share: 'Peso en Canadá', value: 'Existencias', change: 'Variación', province: 'Provincia', pick: 'Pulsa una provincia (mapa o tabla) para compararla con Canadá.', clear: 'Quitar la provincia', open: 'Perfil de la provincia', noData: 'Sin datos disponibles.', noProv: 'Sin dato publicado para esta categoría y fecha.', last: 'Último censo',
      note: 'Existencias en miles de cabezas a 1 de enero y 1 de julio. Los territorios no aparecen: Statistics Canada no publica estas tablas para Yukon, Territorios del Noroeste ni Nunavut. Un hueco es un hueco, nunca cero. Precios de ganado en subastas: Manitoba, semanal, en la ficha de Canadá.', src: 'Fuente: Statistics Canada, tablas 32-10-0130, 32-10-0160 y 32-10-0129 (Open Government Licence – Canada).', mapAlt: 'Mapa de provincias de Canadá coloreado por las existencias', unitK: 'mil cab.', unitM: 'M cab.' },
    en: { tabUS: 'United States (by state)', tabCA: 'Canada (by province)', title: 'Canadian livestock by province', sub: 'Cattle, hog and sheep inventories on 1 January and 1 July, by province. Statistics Canada data as published.',
      item: 'Category', measure: 'Measure', period: 'Survey date', head: 'Inventory', ca: 'Canada', vsPrev: 'vs. same survey a year earlier', hist: 'National trend', prov: 'By province', share: 'Share of Canada', value: 'Inventory', change: 'Change', province: 'Province', pick: 'Select a province (map or table) to compare it with Canada.', clear: 'Remove province', open: 'Province profile', noData: 'No data available.', noProv: 'No published figure for this category and date.', last: 'Latest survey',
      note: 'Inventories in thousand head on 1 January and 1 July. Territories are not shown: Statistics Canada does not publish these tables for Yukon, the Northwest Territories or Nunavut. A gap is a gap, never zero. Auction cattle prices: Manitoba, weekly, on the Canada profile.', src: 'Source: Statistics Canada, tables 32-10-0130, 32-10-0160 and 32-10-0129 (Open Government Licence – Canada).', mapAlt: 'Map of Canadian provinces coloured by inventory', unitK: 'k head', unitM: 'M head' },
    fr: { tabUS: 'États-Unis (par État)', tabCA: 'Canada (par province)', title: 'Élevage canadien par province', sub: 'Effectifs de bovins, de porcs et d’ovins au 1er janvier et au 1er juillet, par province. Données de Statistique Canada telles que publiées.',
      item: 'Catégorie', measure: 'Chiffre', period: 'Date du recensement', head: 'Effectifs', ca: 'Canada', vsPrev: 'par rapport au même relevé un an plus tôt', hist: 'Évolution nationale', prov: 'Par province', share: 'Part du Canada', value: 'Effectifs', change: 'Variation', province: 'Province', pick: 'Sélectionnez une province (carte ou tableau) pour la comparer au Canada.', clear: 'Retirer la province', open: 'Profil de la province', noData: 'Aucune donnée disponible.', noProv: 'Aucun chiffre publié pour cette catégorie et cette date.', last: 'Dernier relevé',
      note: 'Effectifs en milliers de têtes au 1er janvier et au 1er juillet. Les territoires ne figurent pas : Statistique Canada ne publie pas ces tableaux pour le Yukon, les Territoires du Nord-Ouest ni le Nunavut. Un manque est un manque, jamais zéro. Prix du bétail aux encans : Manitoba, hebdomadaire, dans la fiche du Canada.', src: 'Source : Statistique Canada, tableaux 32-10-0130, 32-10-0160 et 32-10-0129 (Licence du gouvernement ouvert – Canada).', mapAlt: 'Carte des provinces canadiennes colorée selon les effectifs', unitK: 'mille têtes', unitM: 'M têtes' },
    it: { tabUS: 'Stati Uniti (per Stato)', tabCA: 'Canada (per provincia)', title: 'Zootecnia canadese per provincia', sub: 'Consistenze di bovini, suini e ovini al 1° gennaio e al 1° luglio, per provincia. Dati di Statistics Canada come pubblicati.',
      item: 'Categoria', measure: 'Dato', period: 'Data della rilevazione', head: 'Consistenza', ca: 'Canada', vsPrev: 'rispetto alla stessa rilevazione dell’anno prima', hist: 'Andamento nazionale', prov: 'Per provincia', share: 'Peso sul Canada', value: 'Consistenza', change: 'Variazione', province: 'Provincia', pick: 'Seleziona una provincia (mappa o tabella) per confrontarla con il Canada.', clear: 'Rimuovi la provincia', open: 'Profilo della provincia', noData: 'Nessun dato disponibile.', noProv: 'Nessun dato pubblicato per questa categoria e data.', last: 'Ultima rilevazione',
      note: 'Consistenze in migliaia di capi al 1° gennaio e al 1° luglio. I territori non compaiono: Statistics Canada non pubblica queste tabelle per lo Yukon, i Territori del Nord-Ovest e il Nunavut. Un vuoto è un vuoto, mai zero. Prezzi del bestiame alle aste: Manitoba, settimanali, nella scheda del Canada.', src: 'Fonte: Statistics Canada, tabelle 32-10-0130, 32-10-0160 e 32-10-0129 (Open Government Licence – Canada).', mapAlt: 'Mappa delle province canadesi colorata in base alla consistenza', unitK: 'mila capi', unitM: 'M capi' }
  };
  function lg() { return window.DehesaShared.getLang(); }
  var ex = window.CAExplorer.create({
    id: 'gn-ca', usBody: 'gn-body', usExtra: '#cof, #nd, #nl', texts: T, items: items, defaultItem: 'cattle/total-cattle', defaultMeasure: 'head', cite: 'statcan',
    measures: function (D, item) { return ser(D, 'CA', item, 'head') ? ['head'] : []; },
    series: ser,
    fmt: function (m, v) { var t = T[lg()] || T.es, d = function (x, n) { try { return x.toLocaleString(lg(), { minimumFractionDigits: n, maximumFractionDigits: n }); } catch (e) { return x.toFixed(n); } }; return v >= 1000 ? d(v / 1000, 2) + ' ' + t.unitM : d(v, 0) + ' ' + t.unitK; },
    yTitle: function () { return (T[lg()] || T.es).unitK; },
    shareMeasure: function () { return true; },
    extra: function () { var L = { es: ['Precios de ganado vacuno en subastas de Manitoba (semanal)', 'Granos: exportaciones y existencias (CGC)'], en: ['Manitoba auction cattle prices (weekly)', 'Grain: exports and stocks (CGC)'], fr: ['Prix du bétail aux encans du Manitoba (hebdomadaire)', 'Grains : exportations et stocks (CGC)'], it: ['Prezzi del bestiame alle aste del Manitoba (settimanali)', 'Cereali: esportazioni e scorte (CGC)'] }[lg()] || []; return '<p class="di-movers-hint" style="margin-top:10px"><a href="paises.html?c=CA#mb-cattle">' + L[0] + ' →</a></p>'; },
    usRender: function () { if (window.__gnUsRender) window.__gnUsRender(); }
  });
  window.GNCanada = ex;
})();
