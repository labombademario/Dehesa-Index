/* Dehesa Index — Comercio exterior agroalimentario de España (Eurostat Comext, catálogo de España). Pestaña «España» de exportaciones.html sobre js/ca-series.js. ES5. */
(function () {
  'use strict';
  var T = {
    es: { tabUS: 'EE. UU.', tabCA: 'España', title: 'Comercio exterior agroalimentario de España', sub: 'Exportaciones, importaciones y saldo comercial agroalimentario de España por producto (mensual) y por país socio (anual), en millones de euros. Datos de Eurostat (Comext).',
      latest: 'Último dato', vsPrev: 'frente al periodo anterior', vsYear: 'frente al mismo periodo del año anterior', change: 'Variación', period: 'Periodo', series: 'Serie', range: 'Periodo mostrado', years: 'años', all: 'Todo', date: 'Fecha', noData: 'Sin datos disponibles.',
      note: 'Valores en millones de euros, comercio de mercancías según Eurostat (Comext, sistema especial). «Extra-UE» e «intra-UE» separan el comercio con países de fuera y de dentro de la Unión. Las cifras recientes se revisan. Un hueco es un hueco, nunca cero.', src: 'Fuente: Eurostat (Comext).' },
    en: { tabUS: 'United States', tabCA: 'Spain', title: 'Spanish agri-food foreign trade', sub: 'Spain’s agri-food exports, imports and trade balance by product (monthly) and by partner country (annual), in EUR million. Eurostat (Comext) data.',
      latest: 'Latest', vsPrev: 'vs. previous period', vsYear: 'vs. same period last year', change: 'Change', period: 'Period', series: 'Series', range: 'Period shown', years: 'years', all: 'All', date: 'Date', noData: 'No data available.',
      note: 'Values in EUR million, merchandise trade according to Eurostat (Comext). “Extra-EU” and “intra-EU” separate trade with countries outside and inside the Union. Recent figures are revised. A gap is a gap, never zero.', src: 'Source: Eurostat (Comext).' },
    fr: { tabUS: 'États-Unis', tabCA: 'Espagne', title: 'Commerce extérieur agroalimentaire de l’Espagne', sub: 'Exportations, importations et solde commercial agroalimentaires de l’Espagne par produit (mensuel) et par pays partenaire (annuel), en millions d’euros. Données d’Eurostat (Comext).',
      latest: 'Dernière donnée', vsPrev: 'par rapport à la période précédente', vsYear: 'par rapport à la même période l’an dernier', change: 'Variation', period: 'Période', series: 'Série', range: 'Période affichée', years: 'ans', all: 'Tout', date: 'Date', noData: 'Aucune donnée disponible.',
      note: 'Valeurs en millions d’euros, commerce de marchandises selon Eurostat (Comext). « Extra-UE » et « intra-UE » distinguent le commerce avec les pays hors et dans l’Union. Les chiffres récents sont révisés. Un manque est un manque, jamais zéro.', src: 'Source : Eurostat (Comext).' },
    it: { tabUS: 'Stati Uniti', tabCA: 'Spagna', title: 'Commercio estero agroalimentare della Spagna', sub: 'Esportazioni, importazioni e saldo commerciale agroalimentari della Spagna per prodotto (mensile) e per paese partner (annuale), in milioni di euro. Dati Eurostat (Comext).',
      latest: 'Ultimo dato', vsPrev: 'rispetto al periodo precedente', vsYear: 'rispetto allo stesso periodo dell’anno scorso', change: 'Variazione', period: 'Periodo', series: 'Serie', range: 'Periodo mostrato', years: 'anni', all: 'Tutto', date: 'Data', noData: 'Nessun dato disponibile.',
      note: 'Valori in milioni di euro, commercio di merci secondo Eurostat (Comext). «Extra-UE» e «intra-UE» distinguono il commercio con paesi esterni e interni all’Unione. Le cifre recenti vengono riviste. Un vuoto è un vuoto, mai zero.', src: 'Fonte: Eurostat (Comext).' }
  };
  var has = function (s, a) { return s.id.indexOf(a) === 0; };
  window.EXSpain = window.CASeries.create({
    id: 'ex-es', tabsHost: 'ex-ca-tabs', usBody: 'ex-body', country: 'ES', texts: T, defaultGroup: 'exp', cite: 'eurostat',
    groups: [
      { id: 'exp', label: ['Exportaciones por producto', 'Exports by product', 'Exportations par produit', 'Esportazioni per prodotto'], pick: function (s) { return s.group === 'trade' && has(s, 'eu-es-trade-exp-'); } },
      { id: 'imp', label: ['Importaciones por producto', 'Imports by product', 'Importations par produit', 'Importazioni per prodotto'], pick: function (s) { return s.group === 'trade' && has(s, 'eu-es-trade-imp-'); } },
      { id: 'bal', label: ['Saldo comercial por producto', 'Trade balance by product', 'Solde commercial par produit', 'Saldo commerciale per prodotto'], pick: function (s) { return s.group === 'trade' && has(s, 'eu-es-trade-bal-'); } },
      { id: 'pexp', label: ['Exportaciones por país (anual)', 'Exports by country (annual)', 'Exportations par pays (annuel)', 'Esportazioni per paese (annuale)'], pick: function (s) { return s.group === 'partners' && has(s, 'eu-es-tp-exp-'); } },
      { id: 'pimp', label: ['Importaciones por país (anual)', 'Imports by country (annual)', 'Importations par pays (annuel)', 'Importazioni per paese (annuale)'], pick: function (s) { return s.group === 'partners' && has(s, 'eu-es-tp-imp-'); } }
    ]
  });
})();
