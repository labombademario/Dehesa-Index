/* Dehesa Index — Insumos agrarios de España (MAPA, precios y índices pagados por los agricultores). Pestaña «España» de insumos.html sobre js/ca-series.js. ES5. */
(function () {
  'use strict';
  var T = {
    es: { tabUS: 'EE. UU.', tabCA: 'España', title: 'Costes de los insumos agrarios de España', sub: 'Lo que pagan los agricultores y ganaderos españoles por fertilizantes, piensos y otros insumos: precios pagados mensuales (€/100 kg, sin IVA) e índices de precios pagados. Datos del Ministerio de Agricultura, Pesca y Alimentación (MAPA).',
      latest: 'Último dato', vsPrev: 'frente al periodo anterior', vsYear: 'frente al mismo periodo del año anterior', change: 'Variación', period: 'Periodo', series: 'Serie', range: 'Periodo mostrado', years: 'años', all: 'Todo', date: 'Fecha', noData: 'Sin datos disponibles.',
      note: 'Precios pagados por los agricultores a la entrada de la explotación, sin IVA, en €/100 kg, tal como los publica el MAPA. Los índices de precios pagados (base 2020 = 100) miden cuánto cambian los precios, no su nivel. Algunas series de fertilizantes dejaron de publicarse y muestran su último dato disponible; un hueco es un hueco, nunca cero.', src: 'Fuente: MAPA, precios y índices de precios pagados por los agricultores.' },
    en: { tabUS: 'United States', tabCA: 'Spain', title: 'Spanish farm input costs', sub: 'What Spanish farmers pay for fertiliser, feed and other inputs: monthly prices paid (€/100 kg, excluding VAT) and paid-price indices. Ministry of Agriculture, Fisheries and Food (MAPA) data.',
      latest: 'Latest', vsPrev: 'vs. previous period', vsYear: 'vs. same period last year', change: 'Change', period: 'Period', series: 'Series', range: 'Period shown', years: 'years', all: 'All', date: 'Date', noData: 'No data available.',
      note: 'Prices paid by farmers at the farm gate, excluding VAT, in €/100 kg, as published by MAPA. The paid-price indices (2020 = 100) measure how much prices change, not their level. Some fertiliser series are no longer published and show their last available figure; a gap is a gap, never zero.', src: 'Source: MAPA, prices and price indices paid by farmers.' },
    fr: { tabUS: 'États-Unis', tabCA: 'Espagne', title: 'Coûts des intrants agricoles en Espagne', sub: 'Ce que paient les agriculteurs espagnols pour les engrais, les aliments du bétail et d’autres intrants : prix payés mensuels (€/100 kg, hors TVA) et indices des prix payés. Données du ministère espagnol de l’Agriculture (MAPA).',
      latest: 'Dernière donnée', vsPrev: 'par rapport à la période précédente', vsYear: 'par rapport à la même période l’an dernier', change: 'Variation', period: 'Période', series: 'Série', range: 'Période affichée', years: 'ans', all: 'Tout', date: 'Date', noData: 'Aucune donnée disponible.',
      note: 'Prix payés par les agriculteurs à l’entrée de l’exploitation, hors TVA, en €/100 kg, tels que publiés par le MAPA. Les indices des prix payés (base 2020 = 100) mesurent l’évolution des prix, pas leur niveau. Certaines séries d’engrais ne sont plus publiées et montrent leur dernière valeur disponible ; un manque est un manque, jamais zéro.', src: 'Source : MAPA, prix et indices des prix payés par les agriculteurs.' },
    it: { tabUS: 'Stati Uniti', tabCA: 'Spagna', title: 'Costi degli input agricoli in Spagna', sub: 'Quanto pagano gli agricoltori spagnoli per fertilizzanti, mangimi e altri input: prezzi pagati mensili (€/100 kg, IVA esclusa) e indici dei prezzi pagati. Dati del ministero spagnolo dell’Agricoltura (MAPA).',
      latest: 'Ultimo dato', vsPrev: 'rispetto al periodo precedente', vsYear: 'rispetto allo stesso periodo dell’anno scorso', change: 'Variazione', period: 'Periodo', series: 'Serie', range: 'Periodo mostrato', years: 'anni', all: 'Tutto', date: 'Data', noData: 'Nessun dato disponibile.',
      note: 'Prezzi pagati dagli agricoltori all’ingresso dell’azienda, IVA esclusa, in €/100 kg, come pubblicati dal MAPA. Gli indici dei prezzi pagati (base 2020 = 100) misurano quanto cambiano i prezzi, non il loro livello. Alcune serie di fertilizzanti non sono più pubblicate e mostrano l’ultimo dato disponibile; un vuoto è un vuoto, mai zero.', src: 'Fonte: MAPA, prezzi e indici dei prezzi pagati dagli agricoltori.' }
  };
  window.INSpain = window.CASeries.create({
    id: 'in-es', tabsHost: 'in-ca-tabs', usBody: 'in-body', country: 'ES', texts: T, defaultGroup: 'fert', cite: 'mapa_es',
    groups: [
      { id: 'fert', label: ['Fertilizantes (precio pagado)', 'Fertilisers (price paid)', 'Engrais (prix payé)', 'Fertilizzanti (prezzo pagato)'], pick: function (s) { return s.group === 'inputs_f'; } },
      { id: 'feed', label: ['Piensos y alimentos (precio pagado)', 'Feed (price paid)', 'Aliments du bétail (prix payé)', 'Mangimi (prezzo pagato)'], pick: function (s) { return s.group === 'inputs_a'; } },
      { id: 'index', label: ['Índices de precios pagados', 'Paid-price indices', 'Indices des prix payés', 'Indici dei prezzi pagati'], pick: function (s) { return s.group === 'idx_pag'; } }
    ]
  });
})();
