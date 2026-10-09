/* Dehesa Index — Mercado e insumos de EE. UU.: posiciones de los fondos (CFTC COT), transporte de grano (USDA AMS AgTransport), gasóleo por región y propano (EIA).
   Lee data/us-markets/{cot,transport,fuel}.json (scripts/update-us-markets.py). Todo tal como lo publica cada fuente; lo calculado aquí (neto = largos − cortos,
   variación, posición en el rango de 3 años) se dice como tal. ES5, sin librerías. Uso: DehesaUsMarket.render(el) en insumos.html y en la ficha de EE. UU. */
(function () {
  'use strict';
  var T = {
    es: { insp: 'Inspecciones de exportación de grano (USDA AMS)', inspH: 'Toneladas métricas inspeccionadas para exportar, por semana (jueves). Es el mejor adelanto semanal de lo que sale de los puertos.', cn: 'Maíz', sb: 'Soja', wh: 'Trigo', sg: 'Sorgo', t: 'toneladas métricas', dst: 'Destinos de las últimas 4 semanas', ctry: 'País', lmr: 'Precios de referencia de ganado y carne (USDA AMS)', lmrSub: 'Notificación obligatoria de precios: lo que pagan los mataderos y lo que cuesta la carne en caja, a diario. USD por 100 libras (cwt).', beefC: 'Vacuno en caja: Choice', beefS: 'Vacuno en caja: Select', steerL: 'Novillo vivo, 5 zonas (negociado)', steerD: 'Novillo en canal, 5 zonas (negociado)', heiferL: 'Novilla viva, 5 zonas (negociado)', hogB: 'Cerdo: precio base de la canal', pkC: 'Cerdo: índice de la canal (pork cutout)', cwt: 'USD por 100 lb', vsD: 'vs día anterior', prim: 'Piezas del cerdo', loin: 'Lomo', butt: 'Paleta (butt)', picnic: 'Picnic', rib: 'Costilla', ham: 'Jamón', belly: 'Panceta', chartBeef: 'Índice de vacuno en caja', chartHog: 'Cerdo: base y cutout', chartCat: 'Novillo vivo, 5 zonas', head: 'Cabezas', loads: 'cargas', dem: 'Demanda de maíz y soja', demSub: 'Lo que tira del maíz y la soja dentro y fuera: etanol (EIA) y embarques de exportación inspeccionados (USDA AMS).', eth: 'Etanol de combustible (EIA)', ethP: 'Producción', ethS: 'Existencias', kbd: 'miles de barriles/día', kbbl: 'miles de barriles', avg4: 'Media de 4 semanas', mw: 'Medio Oeste (PADD 2)', chartEth: 'Producción de etanol', h: 'Mercado e insumos de EE. UU.', sub: 'Lo que mueve la base y el coste: posiciones de los fondos, fletes del grano y combustible por región. Datos oficiales semanales.',
      cot: 'Posiciones de los fondos (CFTC)', cotSub: 'Informe Commitments of Traders desagregado, solo futuros, a cierre del martes. «Fondos» son los gestores de dinero (managed money); neto = largos − cortos.',
      mkt: 'Mercado', net: 'Fondos netos', wk: 'Semana', oi: '% de contratos abiertos', rng: 'Rango 3 años', prod: 'Productores netos', contracts: 'contratos', rngH: 'Dónde está la posición neta de esta semana frente a las 156 anteriores: 0 = la más corta, 100 = la más larga (cálculo de Dehesa Index sobre los datos de la CFTC).',
      chartCot: 'Fondos netos', pick: 'Ver', date: 'Fecha',
      tr: 'Transporte de grano (USDA AMS)', trSub: 'Indicadores semanales de coste por modo (índice, media de 2017 = 100) y fletes de barcaza río abajo por el sistema del Misisipi. Fletes caros abaratan la base que recibe el agricultor del interior.',
      truck: 'Camión (gasóleo)', shuttle_train: 'Tren lanzadera', barge: 'Barcaza (río Illinois)', gulf_vessel: 'Golfo → Japón', pacific_vessel: 'Pacífico Noroeste → Japón',
      idx: 'Índice', vsW: 'vs semana anterior', vsY: 'vs hace un año', barge: 'Barcaza (río Illinois)', bpct: 'Flete de barcaza, % de la tarifa de referencia', loc: 'Tramo', now: 'Último', prevW: 'Semana anterior', yAgo: 'Hace un año',
      bpctH: 'La barcaza se cotiza en porcentaje de la tarifa histórica n.º 7 de cada tramo (100 % = tarifa de referencia).', bton: 'En USD por tonelada corta (último dato)',
      fuel: 'Gasóleo y propano (EIA)', fuelSub: 'Gasóleo de automoción, precio de venta al público (USD por galón, semanal) por región PADD. Propano residencial y mayorista: la EIA solo lo publica en temporada de calefacción (octubre a marzo).',
      area: 'Región', diesel: 'Gasóleo', prop: 'Propano', res: 'Residencial', whs: 'Mayorista', season: 'fuera de temporada: último dato de', chartFuel: 'Gasóleo: EE. UU. y Medio Oeste', usd: 'USD por galón',
      none: 'Sin datos todavía: el primer proceso aún no se ha ejecutado.', src: 'Fuente' },
    en: { insp: 'Grain export inspections (USDA AMS)', inspH: 'Metric tons inspected for export, by week (Thursday). The best weekly lead on what leaves the ports.', cn: 'Corn', sb: 'Soybeans', wh: 'Wheat', sg: 'Sorghum', t: 'metric tons', dst: 'Destinations, last 4 weeks', ctry: 'Country', lmr: 'Livestock and meat reference prices (USDA AMS)', lmrSub: 'Mandatory Price Reporting: what packers pay and what boxed meat costs, daily. USD per hundredweight (cwt).', beefC: 'Boxed beef: Choice', beefS: 'Boxed beef: Select', steerL: 'Live steers, 5 areas (negotiated)', steerD: 'Dressed steers, 5 areas (negotiated)', heiferL: 'Live heifers, 5 areas (negotiated)', hogB: 'Hogs: carcass base price', pkC: 'Pork cutout (carcass)', cwt: 'USD per cwt', vsD: 'vs previous day', prim: 'Pork primals', loin: 'Loin', butt: 'Butt', picnic: 'Picnic', rib: 'Rib', ham: 'Ham', belly: 'Belly', chartBeef: 'Boxed beef cutout', chartHog: 'Hogs: base and cutout', chartCat: 'Live steers, 5 areas', head: 'Head', loads: 'loads', dem: 'Corn and soybean demand', demSub: 'What pulls on corn and soybeans at home and abroad: ethanol (EIA) and inspected export shipments (USDA AMS).', eth: 'Fuel ethanol (EIA)', ethP: 'Production', ethS: 'Stocks', kbd: 'thousand barrels/day', kbbl: 'thousand barrels', avg4: '4-week average', mw: 'Midwest (PADD 2)', chartEth: 'Ethanol production', h: 'U.S. markets and inputs', sub: 'What drives basis and costs: fund positioning, grain freight and fuel by region. Official weekly data.',
      cot: 'Fund positioning (CFTC)', cotSub: 'Disaggregated Commitments of Traders, futures only, as of Tuesday. "Funds" means managed money; net = long − short.',
      mkt: 'Market', net: 'Funds net', wk: 'Week', oi: '% of open interest', rng: '3-year range', prod: 'Producers net', contracts: 'contracts', rngH: 'Where this week\'s net position sits against the previous 156 weeks: 0 = most short, 100 = most long (Dehesa Index calculation on CFTC data).',
      chartCot: 'Funds net', pick: 'Show', date: 'Date',
      tr: 'Grain transportation (USDA AMS)', trSub: 'Weekly cost indicators by mode (index, 2017 average = 100) and downbound barge freight on the Mississippi River System. Expensive freight widens the basis paid to interior farmers.',
      truck: 'Truck (diesel)', shuttle_train: 'Shuttle train', barge: 'Barge (Illinois River)', gulf_vessel: 'Gulf → Japan', pacific_vessel: 'Pacific Northwest → Japan',
      idx: 'Index', vsW: 'vs previous week', vsY: 'vs a year ago', bpct: 'Barge freight, % of benchmark tariff', loc: 'Stretch', now: 'Latest', prevW: 'Previous week', yAgo: 'A year ago',
      bpctH: 'Barge freight is quoted as a percentage of each stretch\'s historical Tariff No. 7 (100% = benchmark tariff).', bton: 'In USD per short ton (latest)',
      fuel: 'Diesel and propane (EIA)', fuelSub: 'On-highway diesel retail price (USD per gallon, weekly) by PADD region. Residential and wholesale propane: EIA only publishes it in the heating season (October to March).',
      area: 'Region', diesel: 'Diesel', prop: 'Propane', res: 'Residential', whs: 'Wholesale', season: 'off season: last value from', chartFuel: 'Diesel: U.S. and Midwest', usd: 'USD per gallon',
      none: 'No data yet: the first run has not happened.', src: 'Source' },
    fr: { insp: 'Inspections à l’exportation de grain (USDA AMS)', inspH: 'Tonnes métriques inspectées pour l’export, par semaine (jeudi). Le meilleur indicateur hebdomadaire de ce qui quitte les ports.', cn: 'Maïs', sb: 'Soja', wh: 'Blé', sg: 'Sorgho', t: 'tonnes métriques', dst: 'Destinations, 4 dernières semaines', ctry: 'Pays', lmr: 'Prix de référence du bétail et de la viande (USDA AMS)', lmrSub: 'Déclaration obligatoire des prix : ce que paient les abattoirs et le prix de la viande en caisse, au jour le jour. USD par 100 livres (cwt).', beefC: 'Bœuf en caisse : Choice', beefS: 'Bœuf en caisse : Select', steerL: 'Bouvillons vifs, 5 zones (négocié)', steerD: 'Bouvillons en carcasse, 5 zones (négocié)', heiferL: 'Génisses vives, 5 zones (négocié)', hogB: 'Porc : prix de base de la carcasse', pkC: 'Porc : indice de la carcasse (pork cutout)', cwt: 'USD par 100 lb', vsD: 'vs jour précédent', prim: 'Pièces du porc', loin: 'Longe', butt: 'Épaule (butt)', picnic: 'Picnic', rib: 'Travers', ham: 'Jambon', belly: 'Poitrine', chartBeef: 'Indice du bœuf en caisse', chartHog: 'Porc : base et cutout', chartCat: 'Bouvillons vifs, 5 zones', head: 'Têtes', loads: 'chargements', dem: 'Demande de maïs et de soja', demSub: 'Ce qui tire le maïs et le soja, aux États-Unis et à l’export : éthanol (EIA) et expéditions inspectées à l’exportation (USDA AMS).', eth: 'Éthanol carburant (EIA)', ethP: 'Production', ethS: 'Stocks', kbd: 'milliers de barils/jour', kbbl: 'milliers de barils', avg4: 'Moyenne sur 4 semaines', mw: 'Midwest (PADD 2)', chartEth: 'Production d’éthanol', h: 'Marchés et intrants des États-Unis', sub: 'Ce qui fait la base et les coûts : positions des fonds, fret du grain et carburant par région. Données officielles hebdomadaires.',
      cot: 'Positions des fonds (CFTC)', cotSub: 'Rapport Commitments of Traders désagrégé, contrats à terme seuls, au mardi. « Fonds » = gestionnaires de fonds (managed money) ; net = acheteurs − vendeurs.',
      mkt: 'Marché', net: 'Fonds nets', wk: 'Semaine', oi: '% des positions ouvertes', rng: 'Fourchette 3 ans', prod: 'Producteurs nets', contracts: 'contrats', rngH: 'Position nette de la semaine face aux 156 précédentes : 0 = la plus vendeuse, 100 = la plus acheteuse (calcul de Dehesa Index sur les données de la CFTC).',
      chartCot: 'Fonds nets', pick: 'Voir', date: 'Date',
      tr: 'Transport du grain (USDA AMS)', trSub: 'Indicateurs hebdomadaires de coût par mode (indice, moyenne 2017 = 100) et fret des barges vers l’aval sur le Mississippi. Un fret cher élargit la base payée aux producteurs de l’intérieur.',
      truck: 'Camion (gazole)', shuttle_train: 'Train navette', barge: 'Barge (rivière Illinois)', gulf_vessel: 'Golfe → Japon', pacific_vessel: 'Nord-Ouest Pacifique → Japon',
      idx: 'Indice', vsW: 'vs semaine précédente', vsY: 'vs il y a un an', bpct: 'Fret de barge, % du tarif de référence', loc: 'Tronçon', now: 'Dernier', prevW: 'Semaine précédente', yAgo: 'Il y a un an',
      bpctH: 'Le fret de barge se cote en pourcentage du tarif historique n° 7 de chaque tronçon (100 % = tarif de référence).', bton: 'En USD par tonne courte (dernier)',
      fuel: 'Gazole et propane (EIA)', fuelSub: 'Gazole routier, prix à la pompe (USD par gallon, hebdomadaire) par région PADD. Propane résidentiel et de gros : l’EIA ne le publie qu’en saison de chauffage (octobre à mars).',
      area: 'Région', diesel: 'Gazole', prop: 'Propane', res: 'Résidentiel', whs: 'Gros', season: 'hors saison : dernière donnée du', chartFuel: 'Gazole : États-Unis et Midwest', usd: 'USD par gallon',
      none: 'Pas encore de données : le premier traitement n’a pas encore tourné.', src: 'Source' },
    it: { insp: 'Ispezioni all’export di cereali (USDA AMS)', inspH: 'Tonnellate metriche ispezionate per l’export, per settimana (giovedì). Il miglior anticipatore settimanale di ciò che lascia i porti.', cn: 'Mais', sb: 'Soia', wh: 'Frumento', sg: 'Sorgo', t: 'tonnellate metriche', dst: 'Destinazioni, ultime 4 settimane', ctry: 'Paese', lmr: 'Prezzi di riferimento di bestiame e carne (USDA AMS)', lmrSub: 'Segnalazione obbligatoria dei prezzi: quanto pagano i macelli e quanto costa la carne in cassa, ogni giorno. USD per 100 libbre (cwt).', beefC: 'Manzo in cassa: Choice', beefS: 'Manzo in cassa: Select', steerL: 'Manzi vivi, 5 aree (negoziato)', steerD: 'Manzi in carcassa, 5 aree (negoziato)', heiferL: 'Giovenche vive, 5 aree (negoziato)', hogB: 'Suini: prezzo base della carcassa', pkC: 'Suini: indice della carcassa (pork cutout)', cwt: 'USD per 100 lb', vsD: 'vs giorno precedente', prim: 'Tagli del suino', loin: 'Lombo', butt: 'Spalla (butt)', picnic: 'Picnic', rib: 'Costine', ham: 'Prosciutto', belly: 'Pancetta', chartBeef: 'Indice del manzo in cassa', chartHog: 'Suini: base e cutout', chartCat: 'Manzi vivi, 5 aree', head: 'Capi', loads: 'carichi', dem: 'Domanda di mais e soia', demSub: 'Ciò che traina mais e soia in patria e all’estero: etanolo (EIA) e spedizioni all’export ispezionate (USDA AMS).', eth: 'Etanolo carburante (EIA)', ethP: 'Produzione', ethS: 'Scorte', kbd: 'migliaia di barili/giorno', kbbl: 'migliaia di barili', avg4: 'Media di 4 settimane', mw: 'Midwest (PADD 2)', chartEth: 'Produzione di etanolo', h: 'Mercati e input degli USA', sub: 'Ciò che muove base e costi: posizioni dei fondi, noli del grano e carburante per regione. Dati ufficiali settimanali.',
      cot: 'Posizioni dei fondi (CFTC)', cotSub: 'Rapporto Commitments of Traders disaggregato, solo futures, al martedì. «Fondi» = gestori di fondi (managed money); netto = lunghi − corti.',
      mkt: 'Mercato', net: 'Fondi netti', wk: 'Settimana', oi: '% dei contratti aperti', rng: 'Intervallo 3 anni', prod: 'Produttori netti', contracts: 'contratti', rngH: 'Dove si colloca la posizione netta della settimana rispetto alle 156 precedenti: 0 = la più corta, 100 = la più lunga (calcolo di Dehesa Index sui dati CFTC).',
      chartCot: 'Fondi netti', pick: 'Mostra', date: 'Data',
      tr: 'Trasporto del grano (USDA AMS)', trSub: 'Indicatori settimanali di costo per modalità (indice, media 2017 = 100) e noli delle chiatte verso valle sul Mississippi. Noli cari allargano la base pagata agli agricoltori dell’interno.',
      truck: 'Camion (gasolio)', shuttle_train: 'Treno navetta', barge: 'Chiatta (fiume Illinois)', gulf_vessel: 'Golfo → Giappone', pacific_vessel: 'Pacifico nord-occidentale → Giappone',
      idx: 'Indice', vsW: 'vs settimana precedente', vsY: 'vs un anno fa', bpct: 'Nolo delle chiatte, % della tariffa di riferimento', loc: 'Tratto', now: 'Ultimo', prevW: 'Settimana precedente', yAgo: 'Un anno fa',
      bpctH: 'Il nolo delle chiatte si quota in percentuale della tariffa storica n. 7 di ogni tratto (100% = tariffa di riferimento).', bton: 'In USD per tonnellata corta (ultimo)',
      fuel: 'Gasolio e propano (EIA)', fuelSub: 'Gasolio per autotrazione, prezzo al dettaglio (USD per gallone, settimanale) per regione PADD. Propano residenziale e all’ingrosso: l’EIA lo pubblica solo nella stagione di riscaldamento (ottobre-marzo).',
      area: 'Regione', diesel: 'Gasolio', prop: 'Propano', res: 'Residenziale', whs: 'Ingrosso', season: 'fuori stagione: ultimo dato del', chartFuel: 'Gasolio: USA e Midwest', usd: 'USD per gallone',
      none: 'Ancora nessun dato: la prima elaborazione non è ancora partita.', src: 'Fonte' }
  };
  var MK = { corn: { es: 'Maíz', en: 'Corn', fr: 'Maïs', it: 'Mais' }, soybeans: { es: 'Soja', en: 'Soybeans', fr: 'Soja', it: 'Soia' }, soymeal: { es: 'Harina de soja', en: 'Soybean meal', fr: 'Tourteau de soja', it: 'Farina di soia' },
    soyoil: { es: 'Aceite de soja', en: 'Soybean oil', fr: 'Huile de soja', it: 'Olio di soia' }, wheat_srw: { es: 'Trigo blando de invierno (SRW)', en: 'SRW wheat', fr: 'Blé tendre d’hiver (SRW)', it: 'Grano tenero invernale (SRW)' },
    wheat_hrw: { es: 'Trigo duro de invierno (HRW)', en: 'HRW wheat', fr: 'Blé dur d’hiver (HRW)', it: 'Grano duro invernale (HRW)' }, live_cattle: { es: 'Vacuno vivo', en: 'Live cattle', fr: 'Bovins vivants', it: 'Bovini vivi' },
    feeder_cattle: { es: 'Terneros de engorde', en: 'Feeder cattle', fr: 'Broutards', it: 'Vitelli da ingrasso' }, lean_hogs: { es: 'Porcino magro', en: 'Lean hogs', fr: 'Porcs maigres', it: 'Suini magri' } };
  var LIVE = { live_cattle: 1, feeder_cattle: 1, lean_hogs: 1 };
  var AREA = { NUS: { es: 'EE. UU.', en: 'U.S.', fr: 'États-Unis', it: 'USA' }, R10: { es: 'Costa Este (PADD 1)', en: 'East Coast (PADD 1)', fr: 'Côte Est (PADD 1)', it: 'Costa Est (PADD 1)' },
    R1X: { es: 'Nueva Inglaterra (PADD 1A)', en: 'New England (PADD 1A)', fr: 'Nouvelle-Angleterre (PADD 1A)', it: 'New England (PADD 1A)' }, R1Y: { es: 'Atlántico Central (PADD 1B)', en: 'Central Atlantic (PADD 1B)', fr: 'Atlantique Centre (PADD 1B)', it: 'Atlantico centrale (PADD 1B)' },
    R1Z: { es: 'Atlántico Sur (PADD 1C)', en: 'Lower Atlantic (PADD 1C)', fr: 'Atlantique Sud (PADD 1C)', it: 'Atlantico meridionale (PADD 1C)' }, R20: { es: 'Medio Oeste (PADD 2)', en: 'Midwest (PADD 2)', fr: 'Midwest (PADD 2)', it: 'Midwest (PADD 2)' },
    R30: { es: 'Costa del Golfo (PADD 3)', en: 'Gulf Coast (PADD 3)', fr: 'Côte du Golfe (PADD 3)', it: 'Costa del Golfo (PADD 3)' }, R40: { es: 'Montañas Rocosas (PADD 4)', en: 'Rocky Mountain (PADD 4)', fr: 'Rocheuses (PADD 4)', it: 'Montagne Rocciose (PADD 4)' },
    R50: { es: 'Costa Oeste (PADD 5)', en: 'West Coast (PADD 5)', fr: 'Côte Ouest (PADD 5)', it: 'Costa Ovest (PADD 5)' }, R5XCA: { es: 'Costa Oeste sin California', en: 'West Coast less California', fr: 'Côte Ouest hors Californie', it: 'Costa Ovest esclusa la California' },
    SCA: { es: 'California', en: 'California', fr: 'Californie', it: 'California' } };
  var ORDER = ['NUS', 'R10', 'R1X', 'R1Y', 'R1Z', 'R20', 'R30', 'R40', 'R50', 'R5XCA', 'SCA'];
  var MIDWEST = ['IA', 'IL', 'IN', 'KS', 'KY', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'OK', 'SD', 'TN', 'WI'];
  /* Regiones PADD de la EIA por estado (definición oficial de los Petroleum Administration for Defense Districts) */
  var PADD = { CT: 'R1X', ME: 'R1X', MA: 'R1X', NH: 'R1X', RI: 'R1X', VT: 'R1X', DE: 'R1Y', DC: 'R1Y', MD: 'R1Y', NJ: 'R1Y', NY: 'R1Y', PA: 'R1Y', FL: 'R1Z', GA: 'R1Z', NC: 'R1Z', SC: 'R1Z', VA: 'R1Z', WV: 'R1Z',
    IL: 'R20', IN: 'R20', IA: 'R20', KS: 'R20', KY: 'R20', MI: 'R20', MN: 'R20', MO: 'R20', NE: 'R20', ND: 'R20', SD: 'R20', OH: 'R20', OK: 'R20', TN: 'R20', WI: 'R20',
    AL: 'R30', AR: 'R30', LA: 'R30', MS: 'R30', NM: 'R30', TX: 'R30', CO: 'R40', ID: 'R40', MT: 'R40', UT: 'R40', WY: 'R40', AK: 'R50', AZ: 'R50', CA: 'R50', HI: 'R50', NV: 'R50', OR: 'R50', WA: 'R50' };
  var D = {}, SEL = { cot: 'corn', loc: null };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function L(o) { return o ? (o[lang()] || o.es) : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var NFC = {}, DFC = {}, DAYC = {};
  function nf(v, d) { try { var k = lang() + '|' + d, f = NFC[k] || (NFC[k] = new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d })); return f.format(v); } catch (e) { return Number(v).toFixed(d); } }
  function sgn(v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d); }
  function pctChg(a, b) { return a == null || b == null || !b ? null : (a / b - 1) * 100; }
  function chg(p, d) { if (p == null || !isFinite(p)) return '<span style="color:var(--text-faint)">—</span>'; return '<span style="font-weight:600">' + sgn(p, d == null ? 1 : d) + (d === 0 ? '' : ' %') + '</span>'; }
  function day(s) { var k = lang() + '|' + s; if (DAYC[k] !== undefined) return DAYC[k]; var q = String(s).split('-'), r; try { var f = DFC[lang()] || (DFC[lang()] = new Intl.DateTimeFormat(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })); r = f.format(new Date(Date.UTC(+q[0], +q[1] - 1, +q[2]))); } catch (e) { r = s; } return (DAYC[k] = r); }
  function ts(s) { var q = String(s).split('-'); return Date.UTC(+q[0], +q[1] - 1, +q[2] || 1); }
  function cite(id, period) { return window.DICite && window.DICite.html ? '<div class="pp-cites" style="margin-top:10px">' + window.DICite.html(id, period ? { period: period } : {}) + '</div>' : ''; }
  function get(n) { if (!D[n]) D[n] = fetch('data/us-markets/' + n + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); return D[n]; }
  /* el punto de hace ~1 año (entre 358 y 372 días antes) y el de la semana anterior */
  function back(pts, i, days) { var x = ts(pts[i][0]) - days * 864e5; for (var j = i; j >= 0; j--) { var dd = (ts(pts[j][0]) - x) / 864e5; if (Math.abs(dd) <= 7) return pts[j]; if (dd < -7) return null; } return null; }
  var TH = 'padding:8px 6px;font-size:11px;font-weight:700;color:var(--text-faint);', TD = 'padding:7px 6px;border-top:1px solid var(--border);font-variant-numeric:tabular-nums;';
  function table(heads, rows, min) {
    return '<div style="overflow-x:auto"><table class="usm-t" style="border-collapse:collapse;width:100%;min-width:' + (min || 520) + 'px;font-size:13.5px"><thead><tr>' + heads.map(function (h, i) { return '<th scope="col" style="' + TH + 'text-align:' + (i ? 'right' : 'left') + '">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td style="' + TD + 'text-align:' + (i ? 'right' : 'left') + '">' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function card(id, h, sub, body) { return '<section class="di-card usm-card" id="' + id + '" style="padding:16px 18px;margin-top:14px"><h3 class="cof-h2" style="margin:0 0 4px;font-size:18px">' + esc(h) + '</h3><p class="di-movers-hint" style="margin:0 0 12px">' + esc(sub) + '</p>' + body + '</section>'; }
  function chart(series, yTitle, aria, zero, vd) {
    if (!window.DehesaChart || !window.DehesaChart.render) return '';
    return '<div style="margin-top:12px">' + window.DehesaChart.render({ series: series, xMode: 'time', yTitle: yTitle, aria: aria, zero: !!zero, noLegend: series.length < 2, vFmt: function (v) { return nf(v, vd == null ? 0 : vd); } }) + '</div>';
  }
  /* ---------- CFTC ---------- */
  function cotHtml(d) {
    var x = t(); if (!d || !d.markets || !d.markets.length) return card('usm-cot', x.cot, x.cotSub, '<p class="di-movers-hint">' + esc(x.none) + '</p>');
    var F = d.fields, iL = F.indexOf('mmL') + 1, iS = F.indexOf('mmS') + 1, iO = F.indexOf('oi') + 1, pL = F.indexOf('pmL') + 1, pS = F.indexOf('pmS') + 1;
    function net(p) { return p[iL] == null || p[iS] == null ? null : p[iL] - p[iS]; }
    var rows = d.markets.map(function (m) {
      var P = m.points, z = P[P.length - 1], y = P[P.length - 2], n = net(z), np = y ? net(y) : null, hist = P.slice(Math.max(0, P.length - 157), P.length - 1).map(net).filter(function (v) { return v != null; });
      var rank = n == null || hist.length < 52 ? null : Math.round(100 * hist.filter(function (v) { return v < n; }).length / hist.length);
      var pn = z[pL] == null || z[pS] == null ? null : z[pL] - z[pS];
      var bar = rank == null ? '—' : '<span style="display:inline-flex;align-items:center;gap:6px"><span aria-hidden="true" style="display:inline-block;width:56px;height:6px;border-radius:3px;background:var(--border);position:relative"><span style="position:absolute;left:' + Math.max(0, Math.min(52, rank * 0.52)) + 'px;top:-2px;width:4px;height:10px;border-radius:2px;background:var(--text)"></span></span>' + rank + '</span>';
      return ['<button type="button" class="usm-pick" data-cot="' + esc(m.id) + '" aria-pressed="' + (m.id === SEL.cot ? 'true' : 'false') + '">' + esc(L(MK[m.id]) || m.label) + '</button>',
        n == null ? '—' : sgn(n, 0), n == null || np == null ? '—' : sgn(n - np, 0), n == null || !z[iO] ? '—' : sgn(100 * n / z[iO], 1) + ' %', bar, pn == null ? '—' : sgn(pn, 0)];
    });
    var m = d.markets.filter(function (q) { return q.id === SEL.cot; })[0] || d.markets[0], last = d.markets[0].points[d.markets[0].points.length - 1][0];
    var pts = m.points.map(function (p) { var v = net(p); return { x: ts(p[0]), y: v, l: day(p[0]) }; });
    var body = '<p class="di-movers-hint" style="margin:0 0 8px">' + esc(x.wk) + ': ' + esc(day(last)) + ' · ' + esc(x.contracts) + '</p>' + table([x.mkt, x.net, x.wk, x.oi, x.rng, x.prod], rows, 640) +
      '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(x.rngH) + '</p>' +
      chart([{ name: x.chartCot, color: '#1d5178', pts: pts }], x.contracts, x.chartCot + ' · ' + (L(MK[m.id]) || m.label), true, 0).replace('<div style="margin-top:12px">', '<div style="margin-top:12px"><div style="font-weight:600;margin-bottom:4px">' + esc(x.chartCot) + ' · ' + esc(L(MK[m.id]) || m.label) + '</div>') + cite('cftc', day(last));
    return card('usm-cot', x.cot, x.cotSub, body);
  }
  /* ---------- AgTransport ---------- */
  function trHtml(d) {
    var x = t(); if (!d || !d.indicators) return card('usm-tr', x.tr, x.trSub, '<p class="di-movers-hint">' + esc(x.none) + '</p>');
    var I = d.indicators, P = I.points, li = P.length - 1, z = P[li], w = P[li - 1], ya = back(P, li, 364);
    var kp = '<div class="usm-kpis">' + I.fields.map(function (f, k) {
      var v = z[k + 1]; if (v == null) return '';
      return '<div class="usm-kpi"><div class="usm-kl">' + esc(x[f] || f) + '</div><div class="usm-kv">' + nf(v, 0) + '</div><div class="usm-ks">' + esc(x.vsW) + ' ' + chg(pctChg(v, w && w[k + 1])) + '<br>' + esc(x.vsY) + ' ' + chg(pctChg(v, ya && ya[k + 1])) + '</div></div>';
    }).join('') + '</div><p class="di-movers-hint" style="margin:6px 0 0">' + esc(x.idx) + ' 2017 = 100 · ' + esc(day(z[0])) + '</p>';
    var S = d.bargePctTariff.series, lastB = '';
    var rows = S.map(function (s) {
      var p = s.points, i = p.length - 1, a = p[i], b = p[i - 1], c = back(p, i, 364); if (a[0] > lastB) lastB = a[0];
      return [esc(s.location), nf(a[1], 0) + ' %', b ? nf(b[1], 0) + ' %' : '—', c ? nf(c[1], 0) + ' %' : '—', chg(pctChg(a[1], c && c[1]))];
    });
    if (!SEL.loc || !S.some(function (s) { return s.location === SEL.loc; })) SEL.loc = (S.filter(function (s) { return /st\.? louis/i.test(s.location); })[0] || S[0]).location;
    var ss = S.filter(function (s) { return s.location === SEL.loc; })[0];
    var opts = S.map(function (s) { return '<option' + (s.location === SEL.loc ? ' selected' : '') + '>' + esc(s.location) + '</option>'; }).join('');
    var chartB = chart([{ name: ss.location, color: '#7a5a1d', pts: ss.points.map(function (p) { return { x: ts(p[0]), y: p[1], l: day(p[0]) }; }) }], '%', x.bpct + ' · ' + ss.location, true, 0);
    var ton = '';
    if (d.bargeUsdTon && d.bargeUsdTon.series && d.bargeUsdTon.series.length) {
      var tr = d.bargeUsdTon.series.map(function (s) { var a = s.points[s.points.length - 1]; return a ? [esc(s.location), nf(a[1], 2), esc(day(a[0]))] : null; }).filter(Boolean);
      ton = '<details class="usm-more"><summary>' + esc(x.bton) + '</summary>' + table([x.loc, 'USD/t', x.date], tr, 420) + '</details>';
    }
    var body = kp + '<h4 class="usm-h4">' + esc(x.bpct) + ' · ' + esc(day(lastB)) + '</h4>' + table([x.loc, x.now, x.prevW, x.yAgo, x.vsY], rows, 560) +
      '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(x.bpctH) + '</p><label class="usm-sel">' + esc(x.pick) + ' <select id="usm-loc" class="di-compare-select">' + opts + '</select></label>' + chartB + ton + cite('usda_ams_agtransport', day(z[0]));
    return card('usm-tr', x.tr, x.trSub, body);
  }
  /* ---------- EIA ---------- */
  function stName(c) { var N = window.DehesaRegionNames && window.DehesaRegionNames.US, v = N && N[c]; return v ? v.split('|')[{ en: 0, es: 1, fr: 2, it: 3 }[lang()] || 1] : c; }
  function lastOf(s) { return s && s.points && s.points.length ? s.points[s.points.length - 1] : null; }
  function fuelRow(name, s) { if (!s) return null; var p = s.points, i = p.length - 1, a = p[i], b = p[i - 1], c = back(p, i, 364); return [esc(name), nf(a[1], 3), chg(pctChg(a[1], b && b[1])), chg(pctChg(a[1], c && c[1])), esc(day(a[0]))]; }
  function fuelHtml(d) {
    var x = t(); if (!d || !d.diesel) return card('usm-fuel', x.fuel, x.fuelSub, '<p class="di-movers-hint">' + esc(x.none) + '</p>');
    var rows = ORDER.map(function (k) { return fuelRow(L(AREA[k]) || (d.diesel[k] && d.diesel[k].name), d.diesel[k]); }).filter(Boolean);
    var us = d.diesel.NUS, mw = d.diesel.R20, ser = [];
    if (us) ser.push({ name: L(AREA.NUS), color: '#1d5178', pts: us.points.map(function (p) { return { x: ts(p[0]), y: p[1], l: day(p[0]) }; }) });
    if (mw) ser.push({ name: L(AREA.R20), color: '#b5651d', pts: mw.points.map(function (p) { return { x: ts(p[0]), y: p[1], l: day(p[0]) }; }) });
    var R = d.propane.residential || {}, W = d.propane.wholesale || {}, lp = lastOf(R.NUS) || lastOf(W.NUS), off = lp && (Date.now() - ts(lp[0])) / 864e5 > 45;
    var keys = ['NUS', 'R20'].concat(MIDWEST.map(function (s) { return 'S' + s; }));
    var prow = keys.map(function (k) {
      var a = lastOf(R[k]), b = lastOf(W[k]); if (!a && !b) return null;
      var nm = k === 'NUS' || k === 'R20' ? L(AREA[k]) : stName(k.slice(1));
      return [esc(nm), a ? nf(a[1], 3) : '—', b ? nf(b[1], 3) : '—', esc(day((a || b)[0]))];
    }).filter(Boolean);
    var body = '<h4 class="usm-h4">' + esc(x.diesel) + ' · ' + esc(x.usd) + '</h4>' + table([x.area, x.now, x.vsW, x.vsY, x.date], rows, 560) + chart(ser, x.usd, x.chartFuel, false, 3) +
      '<h4 class="usm-h4">' + esc(x.prop) + ' · ' + esc(x.usd) + (off ? ' · ' + esc(x.season) + ' ' + esc(day(lp[0])) : '') + '</h4>' + table([x.area, x.res, x.whs, x.date], prow, 460) + cite('eia', us ? day(lastOf(us)[0]) : '');
    return card('usm-fuel', x.fuel, x.fuelSub, body);
  }
  /* ---------- demanda: etanol (EIA), inspecciones de exportación (AMS) y RIN (EPA) ---------- */
  function avgN(p, i, n) { if (i - n + 1 < 0) return null; var s = 0; for (var j = i - n + 1; j <= i; j++) s += p[j][1]; return s / n; }
  function ethHtml(d) {
    var x = t(); if (!d || !d.series || !d.series.prod_NUS) return '';
    var S = d.series, rows = [];
    [['prod_NUS', x.ethP + ' · ' + L(AREA.NUS), x.kbd], ['prod_R20', x.ethP + ' · ' + x.mw, x.kbd], ['stocks_NUS', x.ethS + ' · ' + L(AREA.NUS), x.kbbl], ['stocks_R20', x.ethS + ' · ' + x.mw, x.kbbl]].forEach(function (z) {
      var s = S[z[0]]; if (!s || !s.points.length) return; var p = s.points, i = p.length - 1, a = p[i], b = p[i - 1], c = back(p, i, 364), a4 = avgN(p, i, 4), ci = c ? p.indexOf(c) : -1, c4 = ci >= 3 ? avgN(p, ci, 4) : null;
      rows.push([esc(z[1]) + ' <span style="color:var(--text-faint)">(' + esc(z[2]) + ')</span>', nf(a[1], 0), chg(pctChg(a[1], b && b[1])), a4 != null ? nf(a4, 0) : '—', chg(pctChg(a4, c4)), esc(day(a[0]))]);
    });
    var pr = S.prod_NUS.points, ser = [{ name: L(AREA.NUS), color: '#5b7f2a', pts: pr.map(function (q) { return { x: ts(q[0]), y: q[1], l: day(q[0]) }; }) }];
    return '<h4 class="usm-h4">' + esc(x.eth) + '</h4>' + table(['', x.now, x.vsW, x.avg4, x.vsY, x.date], rows, 620) + chart(ser, x.kbd, x.chartEth, false, 0) + cite('eia', day(pr[pr.length - 1][0]));
  }

  /* ---------- inspecciones de exportación (USDA AMS / FGIS) ---------- */
  function inspHtml(d) {
    var x = t(); if (!d || !d.series || !d.series.CORN) return '';
    var G = [['CORN', x.cn, '#b5851d'], ['SOYBEANS', x.sb, '#5b7f2a'], ['WHEAT', x.wh, '#8a5a2b'], ['SORGHUM', x.sg, '#7a3b3b']], rows = [], ser = [];
    G.forEach(function (g) {
      var p = d.series[g[0]]; if (!p || !p.length) return; var i = p.length - 1, a = p[i], b = p[i - 1], c = back(p, i, 364), a4 = avgN(p, i, 4), ci = c ? p.indexOf(c) : -1, c4 = ci >= 3 ? avgN(p, ci, 4) : null;
      rows.push([esc(g[1]), nf(a[1], 0), chg(pctChg(a[1], b && b[1])), a4 != null ? nf(a4, 0) : '—', chg(pctChg(a4, c4)), esc(day(a[0]))]);
      if (g[0] === 'CORN' || g[0] === 'SOYBEANS') ser.push({ name: g[1], color: g[2], pts: p.map(function (q, k) { var m = avgN(p, k, 4); return m == null ? null : { x: ts(q[0]), y: m, l: day(q[0]) }; }).filter(Boolean) });
    });
    var dt = d.destinations || {}, dr = ['CORN', 'SOYBEANS'].map(function (g) { var o = dt[g]; return o ? '<div style="flex:1 1 240px;min-width:220px"><div style="font-weight:600;margin:10px 0 2px">' + esc(g === 'CORN' ? x.cn : x.sb) + '</div>' + table([x.ctry, x.t], o.countries.map(function (c) { return [esc(c[0]), nf(c[1], 0)]; }), 200) + '</div>' : ''; }).join('');
    var last = d.series.CORN[d.series.CORN.length - 1][0];
    return '<h4 class="usm-h4">' + esc(x.insp) + '</h4><p class="di-movers-hint" style="margin:0 0 6px">' + esc(x.inspH) + '</p>' + table(['(' + x.t + ')', x.now, x.vsW, x.avg4, x.vsY, x.date], rows, 620) +
      chart(ser, x.t + ' · ' + x.avg4, x.insp, false, 0) + (dr ? '<details class="usm-more"><summary>' + esc(x.dst) + '</summary><div style="display:flex;flex-wrap:wrap;gap:18px">' + dr + '</div></details>' : '') + cite('usda_ams_fgis', day(last));
  }
  function demHtml(eth, insp) {
    var x = t(), body = ethHtml(eth) + inspHtml(insp);
    return body ? card('usm-dem', x.dem, x.demSub, body) : '';
  }

  /* ---------- precios de referencia de ganado y carne (USDA AMS, Notificación Obligatoria de Precios) ---------- */
  function lmrRow(name, p, ix) { if (!p || !p.length) return null; var i = p.length - 1, a = p[i], b = p[i - 1], c = back(p, i, 364); if (a[ix] == null) return null; return [esc(name), nf(a[ix], 2), chg(pctChg(a[ix], b && b[ix])), chg(pctChg(a[ix], c && c[ix])), esc(day(a[0]))]; }
  function lmrHtml(d) {
    var x = t(); if (!d || !d.reports || !d.reports.beef) return '';
    var R = d.reports, C = (R.cattle && R.cattle.series) || {}, rows = [
      lmrRow(x.beefC, R.beef.rows, 1), lmrRow(x.beefS, R.beef.rows, 2), lmrRow(x.steerL, C['steer|live_fob'], 1), lmrRow(x.steerD, C['steer|dressed_delivered'], 1), lmrRow(x.heiferL, C['heifer|live_fob'], 1),
      lmrRow(x.hogB, R.hogs.rows, 1), lmrRow(x.pkC, R.pork.rows, 1)].filter(Boolean);
    function pts(p, ix) { return p.filter(function (q) { return q[ix] != null; }).map(function (q) { return { x: ts(q[0]), y: q[ix], l: day(q[0]) }; }); }
    var pk = R.pork.rows, pi = pk.length - 1, pr = ['loin', 'butt', 'picnic', 'rib', 'ham', 'belly'].map(function (k, j) { var a = pk[pi][j + 2], b = pk[pi - 1] && pk[pi - 1][j + 2]; return a == null ? null : [esc(x[k]), nf(a, 2), chg(pctChg(a, b))]; }).filter(Boolean);
    var cb = chart([{ name: x.beefC, color: '#7a2f2f', pts: pts(R.beef.rows, 1) }, { name: x.beefS, color: '#b58a5b', pts: pts(R.beef.rows, 2) }], x.cwt, x.chartBeef, false, 0),
      ch = chart([{ name: x.hogB, color: '#a35b8a', pts: pts(R.hogs.rows, 1) }, { name: x.pkC, color: '#3f6f9a', pts: pts(R.pork.rows, 1) }], x.cwt, x.chartHog, false, 0),
      cc = C['steer|live_fob'] ? chart([{ name: x.steerL, color: '#1d5178', pts: pts(C['steer|live_fob'], 1) }], x.cwt, x.chartCat, false, 0) : '';
    var last = R.beef.rows[R.beef.rows.length - 1][0];
    return card('usm-lmr', x.lmr, x.lmrSub, table([x.cwt, x.now, x.vsD, x.vsY, x.date], rows, 640) + '<h4 class="usm-h4">' + esc(x.chartBeef) + '</h4>' + cb + '<h4 class="usm-h4">' + esc(x.chartHog) + '</h4>' + ch + (cc ? '<h4 class="usm-h4">' + esc(x.chartCat) + '</h4>' + cc : '') +
      '<details class="usm-more"><summary>' + esc(x.prim) + ' · ' + esc(x.cwt) + '</summary>' + table([x.prim, x.now, x.vsD], pr, 360) + '</details>' + cite('usda_ams_lmr', day(last)));
  }
  /* ---------- montaje ---------- */
  function sectorOf(id) { return id === 'usm-tr' || id === 'usm-dem' ? 'agri' : id === 'usm-lmr' ? 'live' : 'common'; }
  function render(el, opts) {
    if (!el) return Promise.resolve(); opts = opts || {}; var x = t();
    el.innerHTML = '<p class="di-movers-hint" role="status">…</p>';
    return Promise.all([get('cot'), get('transport'), get('fuel'), get('ethanol'), get('inspections'), get('lmr')]).then(function (r) {
      if (!r[0] && !r[1] && !r[2]) { el.innerHTML = ''; return; }
      var parts = [['usm-cot', cotHtml(r[0])], ['usm-tr', trHtml(r[1])], ['usm-dem', demHtml(r[3], r[4])], ['usm-lmr', lmrHtml(r[5])], ['usm-fuel', fuelHtml(r[2])]].filter(function (p) { return p[1]; }), SEC = window.DehesaSector, shown = [], folded = [];
      parts.forEach(function (p) { (opts.sector && SEC && !SEC.visible(sectorOf(p[0])) ? folded : shown).push(p[1]); });
      el.innerHTML = '<section class="usm" style="margin-top:18px"><h2 class="cof-h2" style="margin:0 0 4px">' + esc(x.h) + '</h2><p class="di-movers-hint" style="margin:0">' + esc(x.sub) + '</p>' + shown.join('') + (folded.length ? SEC.foldHtml(folded.length, folded.join('')) : '') + '</section>';
      Array.prototype.forEach.call(el.querySelectorAll('[data-cot]'), function (b) { b.onclick = function () { SEL.cot = b.getAttribute('data-cot'); render(el, opts).then(function () { var c = document.getElementById('usm-cot'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' }); }); }; });
      if (window.DehesaUsDepth && window.DehesaUsDepth.fold) window.DehesaUsDepth.fold(el);
      var s = el.querySelector('#usm-loc'); if (s) s.onchange = function () { SEL.loc = s.value; render(el, opts); };
    });
  }
  /* para la ficha de estado: gasóleo de su región PADD (y del estado si la EIA lo publica) y propano del estado */
  function stateHtml(st) {
    return get('fuel').then(function (d) {
      if (!d || !d.diesel) return '';
      var x = t(), pd = PADD[st], sub = pd && pd.length === 3 && pd !== 'R20' && pd !== 'R30' && pd !== 'R40' && pd !== 'R50' ? pd : null, big = pd ? (sub ? 'R10' : pd) : null;
      var rows = [], keys = ['S' + st, sub, big, 'NUS'].filter(function (k, i, a) { return k && a.indexOf(k) === i; });
      if (st === 'CA') keys = ['SCA', 'R50', 'NUS']; else if (PADD[st] === 'R50') keys = ['R5XCA', 'R50', 'NUS'];
      keys.forEach(function (k) { var r = fuelRow(L(AREA[k]) || (d.diesel[k] && d.diesel[k].name) || k, d.diesel[k]); if (r) rows.push(r); });
      var R = (d.propane || {}).residential || {}, W = (d.propane || {}).wholesale || {}, a = lastOf(R['S' + st]), b = lastOf(W['S' + st]);
      var pr = a || b ? table([x.prop, x.now, x.date], [a ? [esc(x.res), nf(a[1], 3), esc(day(a[0]))] : null, b ? [esc(x.whs), nf(b[1], 3), esc(day(b[0]))] : null].filter(Boolean), 360) : '';
      if (!rows.length && !pr) return '';
      return { rows: rows, html: '<h4 class="usm-h4">' + esc(x.diesel) + ' · ' + esc(x.usd) + '</h4>' + table([x.area, x.now, x.vsW, x.vsY, x.date], rows, 520) + (pr ? '<h4 class="usm-h4">' + esc(x.prop) + ' · ' + esc(x.usd) + '</h4>' + pr : '') + cite('eia', d.diesel.NUS ? day(lastOf(d.diesel.NUS)[0]) : ''), title: x.fuel, sub: x.fuelSub };
    });
  }
  window.DehesaUsMarket = { render: render, stateHtml: stateHtml, PADD: PADD };
})();
