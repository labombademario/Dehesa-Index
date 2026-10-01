/* Dehesa Index — Precios locales de grano en EE. UU. (USDA AMS MyMarketNews / MARS). ES5.
   Lee solo JSON generado: data/us-cash-bids/manifest.json (+ reports.json) y, por seleccion, UN shard estado/producto (<ST>/<producto>.json).
   El historico completo (history/<ST>/<producto>.json) solo se descarga para los rangos que no caben en el shard.
   Reglas: nunca se presenta como "elevador local" lo que USDA publica como region/terminal/estado; un mercado = una serie (nunca se mezclan clases, grados,
   periodos de entrega ni tipos de comprador); el basis solo se muestra si USDA lo publica; no se inventan coordenadas (el mapa colorea estados, sin puntos). */
(function () {
  'use strict';
  var BASE = 'data/us-cash-bids/', SRC = 'usda_ams_mars', VIEW = 'https://mymarketnews.ams.usda.gov/viewReport/';
  var T = {
    es: { title: 'Precios locales de grano en EE. UU.', sub: 'Qué pagan los compradores por maíz, soja, trigo y otros granos en cada estado, según los informes diarios de USDA AMS (Market News). Precios al contado (cash bids), no futuros.',
      state: 'Estado', commodity: 'Producto', spec: 'Especificación', buyer: 'Tipo de comprador', market: 'Mercado', allMarkets: 'Todos los disponibles', allBuyers: 'Todos',
      cMarket: 'Mercado', cBid: 'Precio al contado', cBasis: 'Basis', cChange: 'Cambio', cDate: 'Fecha', cFresh: 'Frescura', cSource: 'Fuente',
      avg: 'promedio', exact: 'precio exacto', rangeOnly: 'rango (USDA no publica promedio)', range: 'rango', details: 'Ver detalle', close: 'Cerrar', follow: '☆ Seguir', following: '★ Siguiendo',
      followAll: 'Seguir estos mercados', followAllDone: 'Siguiendo', inactive: 'Mostrar mercados sin cotización reciente', hiddenN: 'ocultos por no tener cotización reciente',
      noData: 'Aún no hay datos para esta selección.', noManifest: 'Los precios locales todavía no se han generado. El pipeline está preparado, pero no se muestra ningún dato inventado.',
      errLoad: 'No se pudo cargar esta selección. Inténtalo de nuevo más tarde.', loading: 'Cargando…',
      runNO_KEY: 'El pipeline de USDA está preparado pero aún no tiene la clave de la API MARS: se muestran los últimos datos válidos disponibles.',
      runERROR: 'La última actualización falló: se conservan los últimos datos válidos (mira la frescura de cada fila).', runAUTH_FAILURE: 'USDA rechazó la clave de la API en la última ejecución: se conservan los últimos datos válidos.', runPARTIAL: 'La última actualización fue parcial: algunos informes conservan su último dato válido.',
      stateRange: 'Rango entre mercados', on: 'el', markets: 'mercados', notComparable: 'Los mercados de la tabla comparten la misma especificación y tipo de comprador. No se calcula una media del estado ni una variación combinada.',
      repr_REGION: 'USDA publica un resumen (promedio y rango mínimo–máximo) para la región «{loc}». No es la oferta de un elevador concreto.',
      repr_TERMINAL: 'Ofertas de terminales o cargaderos en «{loc}». Un precio de terminal no es un precio de elevador local.',
      repr_EXPORT_MARKET: 'Ofertas de elevadores o puertos de exportación en «{loc}». No es un precio local del agricultor.',
      repr_STATE: 'Cifra para todo el estado ({loc}); el informe no detalla ubicaciones más concretas.', repr_CITY: 'Cifra para la ciudad de «{loc}».', repr_ELEVATOR: 'Oferta de un elevador concreto: «{loc}».', repr_UNKNOWN: 'USDA no identifica la ubicación exacta en esta fila del informe.',
      buyerLine: 'Tipo de comprador en el informe', delivery: 'Entrega', basisNone: 'USDA no publica basis en este informe (o aún no se captura)', basisNoUnit: 'unidad no indicada por USDA', futures: 'contrato de referencia',
      peerOut: 'Se aparta mucho de los demás mercados del mismo grupo (mediana {0}): compárala con el informe original, puede ser un cambio de periodo de entrega o de definición.', peerMove: 'Movimiento compartido por el grupo (mediana {0}). Es un cambio de mercado, no de un solo punto.', peerMed: 'mediana del grupo',
      bigMove: 'Variación diaria muy grande: compárala con el informe original (puede reflejar un cambio de periodo de entrega o de cosecha).', noChange: 'Sin observación consecutiva para calcular el cambio', vs: 'vs',
      trust: 'De dónde sale este precio', tSource: 'Fuente', tReport: 'Informe', tPub: 'Publicación', tObs: 'Observación', tMarket: 'Mercado', tSpec: 'Producto y especificación', tUnit: 'Unidad', tMethod: 'Metodología', tFreq: 'Calendario', tOpen: 'Abrir el informe original en USDA AMS',
      tNotCaptured: 'no capturada todavía (carga inicial desde el resumen de USDA AMS; la API la rellenará)', daily: 'diario (días laborables)', weekly: 'semanal',
      tMethodText: 'Precio de oferta (bid) al contado publicado por USDA AMS Market News. Los significados exactos (promedio, rango, tipo de comprador) son los del informe original; Dehesa no los reinterpreta ni convierte unidades.',
      history: 'Histórico de este mercado', r30: '30 d', r3m: '3 m', r6m: '6 m', r1y: '1 a', r3y: '3 a', rmax: 'Máx.', onlyHas: 'Este mercado solo tiene datos desde', loadingHist: 'Cargando histórico…',
      break: 'USDA cambió la definición de este informe el {d} ({k}); los valores anteriores y posteriores pueden no ser comparables.', k_NEW_DIMENSION: 'nueva dimensión', k_TITLE_CHANGE: 'cambio de título',
      bench: 'Precio local frente a referencia nacional', benchText: 'No se calcula «prima/descuento local»: la referencia nacional de Dehesa es el precio mensual recibido por el agricultor (USDA NASS, todas las calidades), que no es comparable con una oferta diaria de un mercado concreto. Solo se mostrará cuando exista una referencia comparable (mismo producto, mismo día y mismo contrato) y nunca se llamará basis salvo que sea el basis oficial del informe.', benchLink: 'Ver la ficha de producto',
      mapTitle: 'Cobertura por estado', mapNote: 'Cada estado coloreado tiene informes de precios locales de USDA para este producto. Las regiones dentro de un estado no tienen coordenadas oficiales, así que no se dibujan puntos.', mapLegend: 'Con datos', mapNone: 'Sin datos', clickState: 'Haz clic en un estado para verlo.',
      nearMe: 'Próximamente: «cerca de mí» (código postal o condado) cuando la cobertura geográfica lo justifique. Por ahora: estado → mercado.', alerts: 'Avisos de este mercado', cls: 'Clase', grade: 'Grado', protein: 'Proteína',
      foot: 'Fuente: USDA AMS Market News (MARS). Datos de dominio público estadounidense; crédito: U.S. Department of Agriculture. Cada fila enlaza a su informe original.', method: 'Metodología', pending: 'Licencia del dataset concreto pendiente de revisión adicional: ver Metodología.', basisFooter: 'El basis solo aparece cuando el informe de USDA lo publica.', coverage: 'cobertura', openMap: 'Mapa de cobertura' },
    en: { title: 'Local grain prices in the United States', sub: 'What buyers are paying for corn, soybeans, wheat and other grains in each state, from USDA AMS Market News daily reports. Cash bids, not futures.',
      state: 'State', commodity: 'Commodity', spec: 'Specification', buyer: 'Buyer type', market: 'Market', allMarkets: 'All available', allBuyers: 'All',
      cMarket: 'Market', cBid: 'Cash bid', cBasis: 'Basis', cChange: 'Change', cDate: 'Date', cFresh: 'Freshness', cSource: 'Source',
      avg: 'average', exact: 'exact price', rangeOnly: 'range (USDA publishes no average)', range: 'range', details: 'Details', close: 'Close', follow: '☆ Follow', following: '★ Following',
      followAll: 'Follow these markets', followAllDone: 'Following', inactive: 'Show markets without a recent quote', hiddenN: 'hidden because they have no recent quote',
      noData: 'No data for this selection yet.', noManifest: 'Local prices have not been generated yet. The pipeline is ready, but no invented data is shown.',
      errLoad: 'This selection could not be loaded. Please try again later.', loading: 'Loading…',
      runNO_KEY: 'The USDA pipeline is ready but does not have the MARS API key yet: the latest valid data available is shown.',
      runERROR: 'The last update failed: the latest valid data is kept (check each row’s freshness).', runAUTH_FAILURE: 'USDA rejected the API key in the last run: the latest valid data is kept.', runPARTIAL: 'The last update was partial: some reports keep their latest valid data.',
      stateRange: 'Range across markets', on: 'on', markets: 'markets', notComparable: 'The markets in this table share the same specification and buyer type. No state average or combined change is computed.',
      repr_REGION: 'USDA publishes one summary (average and low–high range) for the “{loc}” region. It is not the bid of a named elevator.',
      repr_TERMINAL: 'Bids from terminals or river loading elevators in “{loc}”. A terminal price is not a local elevator price.',
      repr_EXPORT_MARKET: 'Bids from export elevators or ports in “{loc}”. It is not a local farmer price.',
      repr_STATE: 'A statewide figure ({loc}); the report does not break it down further.', repr_CITY: 'A figure for the city of “{loc}”.', repr_ELEVATOR: 'The bid of a specific elevator: “{loc}”.', repr_UNKNOWN: 'USDA does not identify the exact location in this report row.',
      buyerLine: 'Buyer type in the report', delivery: 'Delivery', basisNone: 'USDA does not publish basis in this report (or it is not captured yet)', basisNoUnit: 'unit not stated by USDA', futures: 'reference contract',
      peerOut: 'It differs a lot from the other markets in its group (median {0}): compare it with the original report; it may be a delivery-period or definition change.', peerMove: 'Move shared across the group (median {0}). It reflects the market, not a single point.', peerMed: 'group median',
      bigMove: 'Very large one-day move: compare it with the original report (it may reflect a delivery-period or crop-year change).', noChange: 'No consecutive observation to compute a change', vs: 'vs',
      trust: 'Where this price comes from', tSource: 'Source', tReport: 'Report', tPub: 'Publication', tObs: 'Observation', tMarket: 'Market', tSpec: 'Commodity and specification', tUnit: 'Unit', tMethod: 'Methodology', tFreq: 'Calendar', tOpen: 'Open the original report at USDA AMS',
      tNotCaptured: 'not captured yet (initial load from the USDA AMS summary; the API run will fill it in)', daily: 'daily (business days)', weekly: 'weekly',
      tMethodText: 'Cash bid published by USDA AMS Market News. The exact meaning (average, range, buyer type) is the original report’s; Dehesa does not reinterpret it or convert units.',
      history: 'History of this market', r30: '30d', r3m: '3m', r6m: '6m', r1y: '1y', r3y: '3y', rmax: 'Max', onlyHas: 'This market only has data since', loadingHist: 'Loading history…',
      break: 'USDA changed the definition of this report on {d} ({k}); values before and after may not be comparable.', k_NEW_DIMENSION: 'new dimension', k_TITLE_CHANGE: 'title change',
      bench: 'Local price vs national reference', benchText: 'No “local premium/discount” is computed: Dehesa’s national reference is the monthly price received by farmers (USDA NASS, all grades), which is not comparable with a daily bid in a specific market. It will only be shown when a comparable reference exists (same product, same day, same contract) and will never be called basis unless it is the report’s official basis.', benchLink: 'See the product page',
      mapTitle: 'Coverage by state', mapNote: 'Each coloured state has USDA local price reports for this commodity. Regions inside a state have no official coordinates, so no points are drawn.', mapLegend: 'Has data', mapNone: 'No data', clickState: 'Click a state to view it.',
      nearMe: 'Coming later: “near me” (ZIP or county) once geographic coverage justifies it. For now: state → market.', alerts: 'Alerts for this market', cls: 'Class', grade: 'Grade', protein: 'Protein',
      foot: 'Source: USDA AMS Market News (MARS). U.S. public-domain data; credit: U.S. Department of Agriculture. Every row links to its original report.', method: 'Methodology', pending: 'Licence of this specific dataset is pending further review: see Methodology.', basisFooter: 'Basis only appears when the USDA report publishes it.', coverage: 'coverage', openMap: 'Coverage map' },
    fr: { title: 'Prix locaux des grains aux États-Unis', sub: 'Ce que paient les acheteurs pour le maïs, le soja, le blé et d’autres grains dans chaque État, d’après les rapports quotidiens USDA AMS (Market News). Prix au comptant (cash bids), pas des contrats à terme.',
      state: 'État', commodity: 'Produit', spec: 'Spécification', buyer: 'Type d’acheteur', market: 'Marché', allMarkets: 'Tous les disponibles', allBuyers: 'Tous',
      cMarket: 'Marché', cBid: 'Prix comptant', cBasis: 'Base', cChange: 'Variation', cDate: 'Date', cFresh: 'Fraîcheur', cSource: 'Source',
      avg: 'moyenne', exact: 'prix exact', rangeOnly: 'fourchette (USDA ne publie pas de moyenne)', range: 'fourchette', details: 'Détails', close: 'Fermer', follow: '☆ Suivre', following: '★ Suivi',
      followAll: 'Suivre ces marchés', followAllDone: 'Suivi', inactive: 'Afficher les marchés sans cotation récente', hiddenN: 'masqués faute de cotation récente',
      noData: 'Pas encore de données pour cette sélection.', noManifest: 'Les prix locaux n’ont pas encore été générés. Le pipeline est prêt, mais aucune donnée inventée n’est affichée.',
      errLoad: 'Cette sélection n’a pas pu être chargée. Réessayez plus tard.', loading: 'Chargement…',
      runNO_KEY: 'Le pipeline USDA est prêt mais n’a pas encore la clé de l’API MARS : les dernières données valides disponibles sont affichées.',
      runERROR: 'La dernière mise à jour a échoué : les dernières données valides sont conservées (voir la fraîcheur de chaque ligne).', runAUTH_FAILURE: 'L’USDA a rejeté la clé de l’API lors de la dernière exécution : les dernières données valides sont conservées.', runPARTIAL: 'La dernière mise à jour était partielle : certains rapports conservent leur dernière donnée valide.',
      stateRange: 'Fourchette entre marchés', on: 'le', markets: 'marchés', notComparable: 'Les marchés du tableau partagent la même spécification et le même type d’acheteur. Aucune moyenne d’État ni variation combinée n’est calculée.',
      repr_REGION: 'L’USDA publie un résumé (moyenne et fourchette min–max) pour la région « {loc} ». Ce n’est pas l’offre d’un silo précis.',
      repr_TERMINAL: 'Offres de terminaux ou de quais de chargement à « {loc} ». Un prix de terminal n’est pas un prix de silo local.',
      repr_EXPORT_MARKET: 'Offres de silos ou ports d’exportation à « {loc} ». Ce n’est pas un prix local payé à l’agriculteur.',
      repr_STATE: 'Chiffre pour tout l’État ({loc}) ; le rapport ne le détaille pas davantage.', repr_CITY: 'Chiffre pour la ville de « {loc} ».', repr_ELEVATOR: 'Offre d’un silo précis : « {loc} ».', repr_UNKNOWN: 'L’USDA n’identifie pas l’emplacement exact dans cette ligne du rapport.',
      buyerLine: 'Type d’acheteur dans le rapport', delivery: 'Livraison', basisNone: 'L’USDA ne publie pas de base dans ce rapport (ou elle n’est pas encore captée)', basisNoUnit: 'unité non indiquée par l’USDA', futures: 'contrat de référence',
      peerOut: 'Elle s’écarte fortement des autres marchés du même groupe (médiane {0}) : comparez avec le rapport d’origine, il peut s’agir d’un changement de période de livraison ou de définition.', peerMove: 'Mouvement partagé par le groupe (médiane {0}). Il reflète le marché, pas un seul point.', peerMed: 'médiane du groupe',
      bigMove: 'Très forte variation quotidienne : comparez avec le rapport d’origine (elle peut refléter un changement de période de livraison ou de récolte).', noChange: 'Pas d’observation consécutive pour calculer la variation', vs: 'vs',
      trust: 'D’où vient ce prix', tSource: 'Source', tReport: 'Rapport', tPub: 'Publication', tObs: 'Observation', tMarket: 'Marché', tSpec: 'Produit et spécification', tUnit: 'Unité', tMethod: 'Méthodologie', tFreq: 'Calendrier', tOpen: 'Ouvrir le rapport original sur USDA AMS',
      tNotCaptured: 'pas encore captée (chargement initial depuis le résumé USDA AMS ; l’API la complétera)', daily: 'quotidien (jours ouvrés)', weekly: 'hebdomadaire',
      tMethodText: 'Offre au comptant publiée par USDA AMS Market News. Le sens exact (moyenne, fourchette, type d’acheteur) est celui du rapport d’origine ; Dehesa ne le réinterprète pas et ne convertit pas les unités.',
      history: 'Historique de ce marché', r30: '30 j', r3m: '3 m', r6m: '6 m', r1y: '1 an', r3y: '3 ans', rmax: 'Max', onlyHas: 'Ce marché n’a de données que depuis', loadingHist: 'Chargement de l’historique…',
      break: 'L’USDA a modifié la définition de ce rapport le {d} ({k}) ; les valeurs avant et après peuvent ne pas être comparables.', k_NEW_DIMENSION: 'nouvelle dimension', k_TITLE_CHANGE: 'changement de titre',
      bench: 'Prix local et référence nationale', benchText: 'Aucune « prime/décote locale » n’est calculée : la référence nationale de Dehesa est le prix mensuel perçu par les agriculteurs (USDA NASS, toutes qualités), non comparable à une offre quotidienne sur un marché précis. Elle ne sera affichée que lorsqu’une référence comparable existera (même produit, même jour, même contrat) et ne sera jamais appelée base sauf s’il s’agit de la base officielle du rapport.', benchLink: 'Voir la fiche produit',
      mapTitle: 'Couverture par État', mapNote: 'Chaque État coloré a des rapports de prix locaux de l’USDA pour ce produit. Les régions d’un État n’ont pas de coordonnées officielles : aucun point n’est dessiné.', mapLegend: 'Avec données', mapNone: 'Sans données', clickState: 'Cliquez sur un État pour l’afficher.',
      nearMe: 'Plus tard : « près de moi » (code postal ou comté) quand la couverture géographique le justifiera. Pour l’instant : État → marché.', alerts: 'Alertes de ce marché', cls: 'Classe', grade: 'Grade', protein: 'Protéines',
      foot: 'Source : USDA AMS Market News (MARS). Données publiques américaines ; crédit : U.S. Department of Agriculture. Chaque ligne renvoie à son rapport d’origine.', method: 'Méthodologie', pending: 'La licence de ce jeu de données précis reste à revoir : voir la Méthodologie.', basisFooter: 'La base n’apparaît que si le rapport USDA la publie.', coverage: 'couverture', openMap: 'Carte de couverture' },
    it: { title: 'Prezzi locali dei cereali negli Stati Uniti', sub: 'Quanto pagano gli acquirenti per mais, soia, frumento e altri cereali in ogni Stato, secondo i rapporti giornalieri USDA AMS (Market News). Prezzi a pronti (cash bids), non future.',
      state: 'Stato', commodity: 'Prodotto', spec: 'Specifica', buyer: 'Tipo di acquirente', market: 'Mercato', allMarkets: 'Tutti i disponibili', allBuyers: 'Tutti',
      cMarket: 'Mercato', cBid: 'Prezzo a pronti', cBasis: 'Basis', cChange: 'Variazione', cDate: 'Data', cFresh: 'Freschezza', cSource: 'Fonte',
      avg: 'media', exact: 'prezzo esatto', rangeOnly: 'intervallo (USDA non pubblica la media)', range: 'intervallo', details: 'Dettagli', close: 'Chiudi', follow: '☆ Segui', following: '★ Segui già',
      followAll: 'Segui questi mercati', followAllDone: 'Segui già', inactive: 'Mostra i mercati senza quotazione recente', hiddenN: 'nascosti perché senza quotazione recente',
      noData: 'Ancora nessun dato per questa selezione.', noManifest: 'I prezzi locali non sono ancora stati generati. La pipeline è pronta, ma non viene mostrato alcun dato inventato.',
      errLoad: 'Impossibile caricare questa selezione. Riprova più tardi.', loading: 'Caricamento…',
      runNO_KEY: 'La pipeline USDA è pronta ma non ha ancora la chiave dell’API MARS: vengono mostrati gli ultimi dati validi disponibili.',
      runERROR: 'L’ultimo aggiornamento è fallito: restano gli ultimi dati validi (vedi la freschezza di ogni riga).', runAUTH_FAILURE: 'L’USDA ha rifiutato la chiave API nell’ultima esecuzione: restano gli ultimi dati validi.', runPARTIAL: 'L’ultimo aggiornamento è stato parziale: alcuni rapporti mantengono l’ultimo dato valido.',
      stateRange: 'Intervallo tra mercati', on: 'il', markets: 'mercati', notComparable: 'I mercati della tabella condividono la stessa specifica e lo stesso tipo di acquirente. Non si calcola una media statale né una variazione combinata.',
      repr_REGION: 'L’USDA pubblica un riepilogo (media e intervallo min–max) per la regione «{loc}». Non è l’offerta di un singolo elevatore.',
      repr_TERMINAL: 'Offerte di terminal o punti di carico a «{loc}». Un prezzo di terminal non è un prezzo di elevatore locale.',
      repr_EXPORT_MARKET: 'Offerte di elevatori o porti di esportazione a «{loc}». Non è un prezzo locale pagato all’agricoltore.',
      repr_STATE: 'Un dato per tutto lo Stato ({loc}); il rapporto non lo dettaglia ulteriormente.', repr_CITY: 'Un dato per la città di «{loc}».', repr_ELEVATOR: 'Offerta di un elevatore specifico: «{loc}».', repr_UNKNOWN: 'L’USDA non identifica l’ubicazione esatta in questa riga del rapporto.',
      buyerLine: 'Tipo di acquirente nel rapporto', delivery: 'Consegna', basisNone: 'L’USDA non pubblica il basis in questo rapporto (o non è ancora acquisito)', basisNoUnit: 'unità non indicata dall’USDA', futures: 'contratto di riferimento',
      peerOut: 'Si discosta molto dagli altri mercati dello stesso gruppo (mediana {0}): confrontala con il rapporto originale, può essere un cambio di periodo di consegna o di definizione.', peerMove: 'Movimento condiviso dal gruppo (mediana {0}). Riflette il mercato, non un singolo punto.', peerMed: 'mediana del gruppo',
      bigMove: 'Variazione giornaliera molto ampia: confrontala con il rapporto originale (può riflettere un cambio di periodo di consegna o di raccolto).', noChange: 'Nessuna osservazione consecutiva per calcolare la variazione', vs: 'vs',
      trust: 'Da dove viene questo prezzo', tSource: 'Fonte', tReport: 'Rapporto', tPub: 'Pubblicazione', tObs: 'Osservazione', tMarket: 'Mercato', tSpec: 'Prodotto e specifica', tUnit: 'Unità', tMethod: 'Metodologia', tFreq: 'Calendario', tOpen: 'Apri il rapporto originale su USDA AMS',
      tNotCaptured: 'non ancora acquisita (caricamento iniziale dal riepilogo USDA AMS; l’API la completerà)', daily: 'giornaliero (giorni lavorativi)', weekly: 'settimanale',
      tMethodText: 'Offerta a pronti pubblicata da USDA AMS Market News. Il significato esatto (media, intervallo, tipo di acquirente) è quello del rapporto originale; Dehesa non lo reinterpreta né converte le unità.',
      history: 'Storico di questo mercato', r30: '30 g', r3m: '3 m', r6m: '6 m', r1y: '1 a', r3y: '3 a', rmax: 'Max', onlyHas: 'Questo mercato ha dati solo dal', loadingHist: 'Caricamento dello storico…',
      break: 'L’USDA ha cambiato la definizione di questo rapporto il {d} ({k}); i valori prima e dopo possono non essere confrontabili.', k_NEW_DIMENSION: 'nuova dimensione', k_TITLE_CHANGE: 'cambio di titolo',
      bench: 'Prezzo locale e riferimento nazionale', benchText: 'Non si calcola alcun «premio/sconto locale»: il riferimento nazionale di Dehesa è il prezzo mensile ricevuto dagli agricoltori (USDA NASS, tutte le qualità), non confrontabile con un’offerta giornaliera in un mercato specifico. Verrà mostrato solo quando esisterà un riferimento confrontabile (stesso prodotto, stesso giorno, stesso contratto) e non sarà mai chiamato basis se non è il basis ufficiale del rapporto.', benchLink: 'Vedi la scheda prodotto',
      mapTitle: 'Copertura per Stato', mapNote: 'Ogni Stato colorato ha rapporti USDA sui prezzi locali per questo prodotto. Le regioni all’interno di uno Stato non hanno coordinate ufficiali: non si disegnano punti.', mapLegend: 'Con dati', mapNone: 'Senza dati', clickState: 'Clicca su uno Stato per vederlo.',
      nearMe: 'In futuro: «vicino a me» (CAP o contea) quando la copertura geografica lo giustificherà. Per ora: Stato → mercato.', alerts: 'Avvisi di questo mercato', cls: 'Classe', grade: 'Grado', protein: 'Proteine',
      foot: 'Fonte: USDA AMS Market News (MARS). Dati pubblici statunitensi; credito: U.S. Department of Agriculture. Ogni riga rimanda al rapporto originale.', method: 'Metodologia', pending: 'La licenza di questo specifico dataset è in attesa di ulteriore verifica: vedi la Metodologia.', basisFooter: 'Il basis compare solo se il rapporto USDA lo pubblica.', coverage: 'copertura', openMap: 'Mappa di copertura' }
  };
  var CN = { corn: { es: 'Maíz', en: 'Corn', fr: 'Maïs', it: 'Mais' }, soybeans: { es: 'Soja', en: 'Soybeans', fr: 'Soja', it: 'Soia' }, wheat: { es: 'Trigo', en: 'Wheat', fr: 'Blé', it: 'Frumento' },
    sorghum: { es: 'Sorgo', en: 'Sorghum', fr: 'Sorgho', it: 'Sorgo' }, barley: { es: 'Cebada', en: 'Barley', fr: 'Orge', it: 'Orzo' }, oats: { es: 'Avena', en: 'Oats', fr: 'Avoine', it: 'Avena' } };
  var FCOL = { LIVE: ['#E3F0E5', '#276A43'], FRESH: ['#E3F0E5', '#276A43'], EXPECTED_DELAY: ['#FBF1D9', '#8a6410'], DELAYED: ['#FBE3D0', '#9a4a12'], STALE: ['#F5D9D6', '#a33'], HISTORICAL: ['#ECE9DF', '#6b6657'], DISCONTINUED: ['#ECE9DF', '#6b6657'], PENDING: ['#ECE9DF', '#6b6657'] };
  var ACTIVE = { LIVE: 1, FRESH: 1, EXPECTED_DELAY: 1, DELAYED: 1 };
  var M = null, REP = {}, SH = {}, HI = {}, ST = { s: null, c: null, spec: null, buyer: '', market: '', inactive: false, id: null, range: '3m' };
  var root = document.getElementById('pl-body');

  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function sp(p) { return window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath(p) : p; }
  function get(p) { return fetch(sp(BASE + p)).then(function (r) { if (!r.ok) throw new Error(p); return r.json(); }); }
  function cname(c) { var x = CN[c]; return x ? (x[lang()] || x.en) : (M && M.commodities[c] ? M.commodities[c].name : c); }
  function money(v) { return v == null ? '—' : '$' + nf(v, 2); }
  function per(s) { return s.unit === 'bu' ? '/bu' : s.unit ? '/' + s.unit : ''; }
  function dtxt(iso) { if (!iso) return '—'; try { return new Date(iso.slice(0, 10) + 'T00:00:00Z').toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function periodTxt(p) { if (!p) return ''; var a = p.split('/'); return a.length === 2 ? (a[0] ? dtxt(a[0]) : '…') + ' – ' + (a[1] ? dtxt(a[1]) : '…') : p; }
  function head(s) { return s.avg != null ? s.avg : (s.lo != null && s.lo === s.hi ? s.lo : null); }
  function fresh(s) {
    var st = s.freshness;
    if (window.DIFreshness && window.DIFreshness.evaluate) { try { st = window.DIFreshness.evaluate(s.date, s.frequency, SRC).state; } catch (e) {} }
    return st;
  }
  function badge(st) { var c = FCOL[st] || FCOL.PENDING, L = window.DIFreshness && window.DIFreshness.label && window.DIFreshness.label[st]; return '<span class="di-badge" style="background:' + c[0] + ';color:' + c[1] + ';padding:2px 8px;font-size:10.5px;white-space:nowrap">' + esc(L ? (L[lang()] || L.en) : st) + '</span>'; }
  function specKey(s) { return [s.commodityClass || '', s.grade || '', s.protein || '', s.description || '', s.application || '', s.deliveryPeriod || '', s.freight || '', s.saleType || '', s.transMode || '', s.unit].join('|'); }
  function specLabel(s) {
    var t = tt(), p = [];
    if (s.commodityClass) p.push(s.commodityClass); if (s.grade) p.push(s.grade); if (s.protein) p.push(t.protein + ' ' + s.protein); if (s.description) p.push(s.description); if (s.application) p.push(s.application);
    if (s.deliveryPeriod) p.push(t.delivery + ' ' + periodTxt(s.deliveryPeriod)); if (s.freight) p.push(s.freight); if (s.saleType && s.saleType !== 'Bid') p.push(s.saleType); if (s.transMode) p.push(s.transMode);
    return p.join(' · ') || cname(s.commodity);
  }
  function represents(s) {
    var t = tt(), k = 'repr_' + (s.locationType || 'UNKNOWN'), txt = (t[k] || t.repr_UNKNOWN).replace('{loc}', s.locationName || '—');
    return txt + (s.deliveryPoint ? ' ' + t.buyerLine + ': ' + s.deliveryPoint + '.' : '');
  }
  function bsign(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 2); }
  function basisHtml(s) {
    var t = tt(); if (s.bLo == null && s.bHi == null) return '<span title="' + esc(t.basisNone) + '" style="color:var(--text-faint)">—</span>';
    var v = s.bLo === s.bHi ? bsign(s.bLo) : bsign(s.bLo) + ' / ' + bsign(s.bHi);
    return v + ' <span class="di-movers-hint">' + esc(s.basisUnit || t.basisNoUnit) + '</span>' + (s.futuresContract ? '<div class="di-movers-hint">' + esc(t.futures) + ': ' + esc(s.futuresContract) + '</div>' : '');
  }
  function pctTxt(v) { return v == null ? '' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 1) + ' %'; }
  function changeHtml(s) {
    var t = tt(); if (s.changePct == null) return '<span title="' + esc(t.noChange) + '" style="color:var(--text-faint)">—</span>';
    var c = s.changePct >= 0 ? '#2f6b4a' : '#a33', med = s.peerMedianPct, big = s.changeFlag === 'PEER_OUTLIER' || (med == null && Math.abs(s.changePct) >= 8), msg = s.changeFlag === 'PEER_OUTLIER' ? t.peerOut.replace('{0}', pctTxt(med)) : t.bigMove;
    return '<span style="color:' + c + ';font-weight:600">' + (s.changePct > 0 ? '+' : s.changePct < 0 ? '−' : '') + nf(Math.abs(s.changePct), 1) + ' %</span>' + (big ? ' <span title="' + esc(msg) + '" aria-label="' + esc(msg) + '">⚠</span>' : '') + (!big && med != null && Math.abs(med) >= 3 && Math.abs(s.changePct - med) < 5 ? ' <span class="di-movers-hint" title="' + esc(t.peerMove.replace('{0}', pctTxt(med))) + '">≈ ' + esc(t.peerMed) + ' ' + esc(pctTxt(med)) + '</span>' : '') + '<div class="di-movers-hint">' + esc(t.vs) + ' ' + esc(dtxt(s.prevDate)) + '</div>';
  }
  function bidHtml(s) {
    var t = tt(), u = per(s);
    if (s.priceKind === 'AVERAGE') return '<strong>' + money(s.avg) + '</strong>' + u + '<div class="di-movers-hint">' + esc(t.avg) + (s.lo != null && s.hi != null && s.lo !== s.hi ? ' · ' + esc(t.range) + ' ' + money(s.lo) + '–' + money(s.hi) : '') + '</div>';
    if (s.priceKind === 'EXACT') return '<strong>' + money(s.lo) + '</strong>' + u + '<div class="di-movers-hint">' + esc(t.exact) + '</div>';
    return '<strong>' + money(s.lo) + '–' + money(s.hi) + '</strong>' + u + '<div class="di-movers-hint">' + esc(t.rangeOnly) + '</div>';
  }

  /* ---------- carga ---------- */
  function shard(st, c) {
    var k = st + '/' + c; if (SH[k]) return SH[k];
    var e = M.states[st] && M.states[st].commodities[c]; if (!e) return Promise.reject(new Error('nodata'));
    return SH[k] = get(e.shard).catch(function (x) { delete SH[k]; throw x; });
  }
  function hist(st, c) {
    var k = st + '/' + c; if (HI[k]) return HI[k];
    return HI[k] = get(M.states[st].commodities[c].history).catch(function (x) { delete HI[k]; throw x; });
  }

  /* ---------- seleccion ---------- */
  function defaults() {
    var q = new URLSearchParams(location.search), s = (q.get('s') || '').toUpperCase(), c = q.get('c');
    var states = Object.keys(M.states);
    if (!M.states[s]) s = M.states.IA ? 'IA' : states[0];
    if (!c || !M.states[s].commodities[c]) c = M.states[s].commodities.corn ? 'corn' : Object.keys(M.states[s].commodities)[0];
    ST.s = s; ST.c = c; ST.id = q.get('id') || null; ST.market = q.get('m') || ''; ST.spec = q.get('spec') || null;
  }
  function sync() { try { var q = []; q.push('s=' + ST.s, 'c=' + ST.c); if (ST.market) q.push('m=' + encodeURIComponent(ST.market)); if (ST.spec) q.push('spec=' + encodeURIComponent(ST.spec)); if (ST.id) q.push('id=' + encodeURIComponent(ST.id)); history.replaceState(null, '', '?' + q.join('&')); } catch (e) {} }
  function rowsOf(doc) {
    var list = doc.series.filter(function (s) { return true; });
    var specs = {}; list.forEach(function (s) { var k = specKey(s), x = specs[k] || (specs[k] = { key: k, s: s, n: 0, act: 0, mk: {} }); x.n++; if (ACTIVE[fresh(s)]) { x.act++; x.mk[s.locationName] = 1; } });
    var arr = Object.keys(specs).map(function (k) { return specs[k]; });
    arr.sort(function (a, b) { return Object.keys(b.mk).length - Object.keys(a.mk).length || (a.s.deliveryPeriod ? 1 : 0) - (b.s.deliveryPeriod ? 1 : 0) || a.key.localeCompare(b.key); });
    return { list: list, specs: arr };
  }

  /* ---------- pintado ---------- */
  function opt(v, label, sel) { return '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function controls(doc, R) {
    var t = tt(), st = Object.keys(M.states).sort(function (a, b) { return M.states[a].name.localeCompare(M.states[b].name); });
    var coms = Object.keys(M.states[ST.s].commodities).sort(function (a, b) { return cname(a).localeCompare(cname(b)); });
    var sp_ = R.specs.filter(function (x) { return x.act > 0 || x.key === ST.spec; });
    var cur = specFor(R), buyers = {}, markets = {};
    R.list.filter(function (s) { return specKey(s) === cur; }).forEach(function (s) { if (ACTIVE[fresh(s)] || ST.inactive) { buyers[s.deliveryPoint || ''] = 1; if (!ST.buyer || (s.deliveryPoint || '') === ST.buyer) markets[s.locationName || ''] = 1; } });
    var lab = function (id, txt, inner) { return '<label style="font-size:13px;flex:1;min-width:150px">' + esc(txt) + '<br><select id="' + id + '" class="di-compare-select">' + inner + '</select></label>'; };
    return '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 12px">' +
      lab('pl-s', t.state, st.map(function (k) { return opt(k, M.states[k].name, k === ST.s); }).join('')) +
      lab('pl-c', t.commodity, coms.map(function (k) { return opt(k, cname(k), k === ST.c); }).join('')) +
      (sp_.length > 1 ? lab('pl-spec', t.spec, sp_.map(function (x) { return opt(x.key, specLabel(x.s) + ' (' + Object.keys(x.mk).length + ')', x.key === cur); }).join('')) : '') +
      (Object.keys(buyers).length > 1 ? lab('pl-buyer', t.buyer, opt('', t.allBuyers, !ST.buyer) + Object.keys(buyers).sort().map(function (b) { return opt(b, b || '—', b === ST.buyer); }).join('')) : '') +
      lab('pl-m', t.market, opt('', t.allMarkets, !ST.market) + Object.keys(markets).sort().map(function (m) { return opt(m, m || '—', m === ST.market); }).join('')) + '</div>';
  }
  function specFor(R) { if (ST.spec && R.specs.some(function (x) { return x.key === ST.spec; })) return ST.spec; return R.specs.length ? R.specs[0].key : null; }
  function mapHtml() {
    var t = tt(); if (!window.DEHESA_US_STATES) return '<div class="di-movers-hint">' + esc(t.loading) + '</div>';
    var has = {}; Object.keys(M.states).forEach(function (k) { if (M.states[k].commodities[ST.c]) has[k] = 1; });
    var svg = '<svg viewBox="' + window.DEHESA_US_STATES.viewBox + '" style="width:100%;max-width:560px;height:auto;display:block" role="group" aria-label="' + esc(t.mapTitle) + '">' + window.DEHESA_US_STATES.states.map(function (s) {
      var on = has[s.id], sel = s.id === ST.s;
      return '<path data-st="' + s.id + '" d="' + s.d + '" fill="' + (on ? (sel ? '#1f5a30' : '#7fb48d') : '#e6e2d6') + '" stroke="' + (sel ? '#111' : '#fff') + '" stroke-width="' + (sel ? 1.8 : 0.8) + '" stroke-linejoin="round"' + (on ? ' style="cursor:pointer" tabindex="0" role="button" aria-label="' + esc(M.states[s.id].name) + '"' : '') + '></path>';
    }).join('') + '</svg>';
    return svg + '<div class="di-movers-hint" style="margin-top:6px"><span style="display:inline-block;width:10px;height:10px;background:#7fb48d;border-radius:2px"></span> ' + esc(t.mapLegend) + ' &nbsp; <span style="display:inline-block;width:10px;height:10px;background:#e6e2d6;border-radius:2px"></span> ' + esc(t.mapNone) + ' · ' + esc(t.clickState) + '</div><p class="di-movers-hint">' + esc(t.mapNote) + '</p>';
  }
  function groupHtml(name, rows, t) {
    var maxD = rows.reduce(function (m, s) { return s.date > m ? s.date : m; }, ''), same = rows.filter(function (s) { return s.date === maxD; }), rng = '';
    if (same.length > 1) {
      var lo = Math.min.apply(null, same.map(function (s) { return s.lo != null ? s.lo : head(s); }).filter(function (v) { return v != null; })), hi = Math.max.apply(null, same.map(function (s) { return s.hi != null ? s.hi : head(s); }).filter(function (v) { return v != null; }));
      if (isFinite(lo) && isFinite(hi)) rng = '<div style="font-size:13px;margin:2px 0 8px"><strong>' + esc(t.stateRange) + ':</strong> ' + money(lo) + ' — ' + money(hi) + per(same[0]) + ' <span class="di-movers-hint">(' + same.length + ' ' + esc(t.markets) + ' ' + esc(t.on) + ' ' + esc(dtxt(maxD)) + ')</span></div>';
    }
    var trs = rows.map(function (s) {
      var f = fresh(s), url = VIEW + s.reportId;
      return '<tr data-id="' + esc(s.id) + '" style="border-top:1px solid var(--border);' + (ST.id === s.id ? 'background:rgba(47,107,58,.08)' : '') + '"><td style="padding:9px 6px;vertical-align:top"><button type="button" class="di-link-btn" data-sel="' + esc(s.id) + '" style="text-align:left">' + esc(s.locationName || '—') + '</button><div class="di-movers-hint">' + esc(s.locationType) + (s.deliveryPoint ? ' · ' + esc(s.deliveryPoint) : '') + '</div></td>' +
        '<td style="padding:9px 6px;text-align:right;vertical-align:top;white-space:nowrap">' + bidHtml(s) + '</td><td style="padding:9px 6px;text-align:right;vertical-align:top">' + basisHtml(s) + '</td><td style="padding:9px 6px;text-align:right;vertical-align:top">' + changeHtml(s) + '</td>' +
        '<td style="padding:9px 6px;vertical-align:top;white-space:nowrap">' + esc(dtxt(s.date)) + '</td><td style="padding:9px 6px;vertical-align:top">' + badge(f) + '</td><td style="padding:9px 6px;vertical-align:top"><a href="' + url + '" target="_blank" rel="noopener">USDA AMS</a><div class="di-movers-hint">#' + s.reportId + '</div></td></tr>';
    }).join('');
    return '<div class="di-card" style="padding:12px 16px;margin-bottom:14px"><h3 style="font-size:15px;margin:0 0 4px">' + esc(name || '—') + '</h3>' + rng + '<div class="di-table-wrap"><table style="border-collapse:collapse;width:100%;min-width:640px;font-size:14px"><thead><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);text-align:left">' +
      ['cMarket', 'cBid', 'cBasis', 'cChange', 'cDate', 'cFresh', 'cSource'].map(function (k, i) { return '<th scope="col" style="padding:8px 6px;' + (i > 0 && i < 4 ? 'text-align:right' : '') + '">' + esc(t[k].toUpperCase()) + '</th>'; }).join('') + '</tr></thead><tbody>' + trs + '</tbody></table></div></div>';
  }
  function render(doc) {
    var t = tt(), R = rowsOf(doc), cur = specFor(R); ST.spec = cur;
    var rows = R.list.filter(function (s) { return specKey(s) === cur && (!ST.buyer || (s.deliveryPoint || '') === ST.buyer) && (!ST.market || s.locationName === ST.market); });
    var act = rows.filter(function (s) { return ACTIVE[fresh(s)]; }), hid = rows.length - act.length, shown = ST.inactive ? rows : act;
    var groups = {}; shown.forEach(function (s) { (groups[s.deliveryPoint || ''] = groups[s.deliveryPoint || ''] || []).push(s); });
    var ns = Object.keys(groups).sort(); ns.forEach(function (k) { groups[k].sort(function (a, b) { return (a.locationName || '').localeCompare(b.locationName || ''); }); });
    var c0 = shown[0], h = '';
    if (M.run && M.run.status !== 'OK') h += '<p class="di-info-api-notice" role="status">' + esc(t['run' + M.run.status] || '') + '</p>';
    h += controls(doc, R);
    h += '<h2 style="font-size:18px;margin:6px 0 2px">' + esc(M.states[ST.s].name) + ' · ' + esc(cname(ST.c)) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(specLabel(c0 || { commodity: ST.c, unit: '' })) + ' · USDA AMS</p>';
    if (shown.length) { var ls = {}; shown.forEach(function (s) { ls[s.locationType] = s; }); h += '<div class="di-card" style="padding:10px 14px;margin-bottom:12px;font-size:13px">' + Object.keys(ls).map(function (k) { return '<div>• ' + esc(represents(ls[k])) + '</div>'; }).join('') + '<div class="di-movers-hint" style="margin-top:4px">' + esc(t.notComparable) + '</div></div>'; }
    h += shown.length ? ns.map(function (k) { return groupHtml(k || '—', groups[k], t); }).join('') : '<p class="di-movers-hint">' + esc(t.noData) + '</p>';
    h += '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:4px 0 14px">' + (hid ? '<label style="font-size:13px"><input type="checkbox" id="pl-inact"' + (ST.inactive ? ' checked' : '') + '> ' + esc(t.inactive) + ' (' + hid + ' ' + esc(t.hiddenN) + ')</label>' : '') +
      (shown.length && window.DIWatch ? '<button type="button" class="di-link-btn" id="pl-follow-all">' + esc(t.followAll) + ' (' + Math.min(shown.length, 20) + ')</button>' : '') + '</div>';
    h += '<div id="pl-detail"></div>';
    h += '<details class="di-card" style="padding:12px 16px;margin:0 0 14px"' + (window.innerWidth > 760 ? ' open' : '') + '><summary style="cursor:pointer;font-weight:700">' + esc(t.mapTitle) + '</summary><div id="pl-map" style="margin-top:10px">' + mapHtml() + '</div></details>';
    h += '<p class="di-movers-hint">' + esc(t.nearMe) + '</p><p class="di-movers-hint">' + esc(t.foot) + ' <a href="metodologia.html#precios-locales">' + esc(t.method) + '</a>. ' + esc(t.basisFooter) + ' ' + esc(t.pending) + '</p>';
    root.innerHTML = h; bind(doc, shown); if (ST.id) detail(doc);
    if (!window.DEHESA_US_STATES) loadMap();
  }
  function loadMap() {
    if (document.getElementById('pl-us-states')) return;
    var sc = document.createElement('script'); sc.id = 'pl-us-states'; sc.src = sp('vendor/us-states.js'); sc.onload = function () { var m = document.getElementById('pl-map'); if (m) { m.innerHTML = mapHtml(); bindMap(); } }; document.head.appendChild(sc);
  }
  function bindMap() {
    Array.prototype.forEach.call(document.querySelectorAll('#pl-map [data-st]'), function (p) {
      var go = function () { var k = p.getAttribute('data-st'); if (M.states[k] && M.states[k].commodities[ST.c]) { ST.s = k; ST.market = ''; ST.buyer = ''; ST.spec = null; ST.id = null; load(); } };
      p.addEventListener('click', go); p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }
  function bind(doc, shown) {
    var on = function (id, fn) { var el = document.getElementById(id); if (el) el.onchange = fn; };
    on('pl-s', function (e) { ST.s = e.target.value; if (!M.states[ST.s].commodities[ST.c]) ST.c = M.states[ST.s].commodities.corn ? 'corn' : Object.keys(M.states[ST.s].commodities)[0]; ST.spec = null; ST.buyer = ''; ST.market = ''; ST.id = null; load(); });
    on('pl-c', function (e) { ST.c = e.target.value; ST.spec = null; ST.buyer = ''; ST.market = ''; ST.id = null; load(); });
    on('pl-spec', function (e) { ST.spec = e.target.value; ST.buyer = ''; ST.market = ''; render(doc); sync(); });
    on('pl-buyer', function (e) { ST.buyer = e.target.value; ST.market = ''; render(doc); sync(); });
    on('pl-m', function (e) { ST.market = e.target.value; render(doc); sync(); });
    on('pl-inact', function (e) { ST.inactive = e.target.checked; render(doc); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-sel]'), function (b) { b.onclick = function () { ST.id = b.getAttribute('data-sel'); render(doc); sync(); var d = document.getElementById('pl-detail'); if (d && d.scrollIntoView) d.scrollIntoView({ block: 'nearest' }); }; });
    var fa = document.getElementById('pl-follow-all');
    if (fa) fa.onclick = function () { window.DIWatch.withCashBids().then(function () { shown.slice(0, 20).forEach(function (s) { var k = ST.s + '/' + ST.c + '/' + s.id; if (!window.DIWatch.has('CB', k)) window.DIWatch.toggle('CB', k); }); fa.textContent = tt().followAllDone + ' ✓'; }); };
    bindMap();
  }

  /* ---------- detalle: confianza, grafica, avisos ---------- */
  var RANGES = [['30d', 30], ['3m', 92], ['6m', 183], ['1y', 366], ['3y', 1096], ['max', 0]];
  function detail(doc) {
    var t = tt(), s = null, el = document.getElementById('pl-detail'); if (!el) return;
    doc.series.forEach(function (x) { if (x.id === ST.id) s = x; });
    if (!s) { el.innerHTML = ''; return; }
    var rep = REP[s.reportId] || {}, f = fresh(s), key = ST.s + '/' + ST.c + '/' + s.id, W = window.DIWatch;
    var fol = W && W.has('CB', key);
    var dl = function (k, v) { return '<dt style="font-weight:700;font-size:12px;color:var(--text-faint)">' + esc(k) + '</dt><dd style="margin:0 0 6px;font-size:13.5px">' + v + '</dd>'; };
    var h = '<div class="di-card" style="padding:16px 18px;margin-bottom:14px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><h3 style="font-size:16px;margin:0">' + esc(s.locationName || '—') + ' · ' + esc(cname(s.commodity)) + '</h3><div class="di-movers-hint">' + esc(specLabel(s)) + '</div></div><div>' +
      (W ? '<button type="button" class="di-link-btn" id="pl-follow">' + esc(fol ? t.following : t.follow) + '</button> ' : '') + '<button type="button" class="di-link-btn" id="pl-close">' + esc(t.close) + '</button></div></div>';
    h += '<p style="font-size:13.5px;margin:10px 0">' + esc(represents(s)) + '</p>';
    h += '<div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start"><div style="flex:1;min-width:260px"><h4 style="font-size:13px;margin:0 0 6px">' + esc(t.trust) + '</h4><dl style="margin:0">' +
      dl(t.tSource, 'USDA AMS Market News (MARS)') + dl(t.tReport, esc(rep.reportName || '#' + s.reportId) + ' · <a href="' + VIEW + s.reportId + '" target="_blank" rel="noopener">' + esc(t.tOpen) + ' →</a>') +
      dl(t.tPub, s.pub ? esc(dtxt(s.pub)) : '<span style="color:var(--text-faint)">' + esc(t.tNotCaptured) + '</span>') + dl(t.tObs, esc(dtxt(s.date)) + ' ' + badge(f)) +
      dl(t.tMarket, esc(s.locationName || '—') + ' (' + esc(s.locationType) + ')') + dl(t.tSpec, esc(cname(s.commodity)) + ' · ' + esc(specLabel(s))) + dl(t.tUnit, esc(s.currency || '') + ' ' + esc(s.unit) + (s.currency ? ' ' + esc(s.currency === 'USD' ? '($)' : '') : '')) +
      dl(t.tFreq, esc(s.frequency === 'weekly' ? t.weekly : t.daily)) + dl(t.tMethod, esc(t.tMethodText)) + '</dl></div>' +
      '<div style="flex:1;min-width:260px"><h4 style="font-size:13px;margin:0 0 6px">' + esc(t.history) + '</h4><div class="di-range-btns" id="pl-ranges">' + RANGES.map(function (r) { return '<button type="button" class="di-range-btn' + (ST.range === r[0] ? ' active' : '') + '" data-r="' + r[0] + '">' + esc(t['r' + r[0]]) + '</button>'; }).join('') + '</div><div id="pl-chart" aria-live="polite"></div><div id="pl-breaks"></div></div></div>';
    if (W) h += '<div style="margin-top:12px"><h4 style="font-size:13px;margin:0 0 6px">' + esc(t.alerts) + '</h4><div id="pl-alerts">' + (fol ? W.editor('CB', key, lang(), { full: true }) : '') + '</div></div>';
    h += '<div style="margin-top:12px;font-size:13px"><strong>' + esc(t.bench) + '.</strong> ' + esc(t.benchText) + ' <a href="producto.html?p=' + (s.commodity === 'corn' ? 'maiz' : s.commodity === 'soybeans' ? 'soja' : s.commodity === 'wheat' ? 'trigo' : '') + '">' + esc(t.benchLink) + '</a></div></div>';
    el.innerHTML = h;
    document.getElementById('pl-close').onclick = function () { ST.id = null; render(doc); sync(); };
    Array.prototype.forEach.call(el.querySelectorAll('[data-r]'), function (b) { b.onclick = function () { ST.range = b.getAttribute('data-r'); detail(doc); }; });
    var fb = document.getElementById('pl-follow');
    if (fb) fb.onclick = function () { W.withCashBids().then(function () { W.toggle('CB', key); detail(doc); }); };
    if (W && fol) W.bindEditor(document.getElementById('pl-alerts'), function () { detail(doc); });
    chart(doc, s); breaks(doc, s);
  }
  function breaks(doc, s) {
    var t = tt(), b = (doc.breaks || []).filter(function (x) { return x.reportId === s.reportId; }), el = document.getElementById('pl-breaks'); if (!el) return;
    el.innerHTML = b.map(function (x) { return '<p class="di-info-api-notice" style="margin:8px 0 0">' + esc(t.break.replace('{d}', dtxt(x.date)).replace('{k}', t['k_' + x.kind] || x.kind)) + '</p>'; }).join('');
  }
  function chart(doc, s) {
    var t = tt(), el = document.getElementById('pl-chart'); if (!el) return;
    var days = 0; RANGES.forEach(function (r) { if (r[0] === ST.range) days = r[1]; });
    var needHist = s.n > s.pts.length && (days === 0 || days > 183);
    var go = function (pts) {
      var last = Date.parse(pts[pts.length - 1][0] + 'T00:00:00Z'), cut = days ? last - days * 864e5 : 0;
      var P = pts.filter(function (p) { return Date.parse(p[0] + 'T00:00:00Z') >= cut; });
      var mk = function (i, f) { return P.map(function (p) { var v = f(p); return { x: Date.parse(p[0] + 'T00:00:00Z'), y: v }; }); };
      var avg = mk(0, function (p) { return p[1] != null ? p[1] : (p[2] != null && p[2] === p[3] ? p[2] : null); });
      var lo = mk(0, function (p) { return p[2]; }), hi = mk(0, function (p) { return p[3]; });
      var ser = [{ name: t.cBid, color: '#2f6b3a', pts: avg }];
      if (P.some(function (p) { return p[2] != null && p[3] != null && p[2] !== p[3]; })) { ser.push({ name: 'min', color: '#9a9484', dash: true, pts: lo }); ser.push({ name: 'max', color: '#9a9484', dash: true, pts: hi }); }
      var span = Math.round((Date.parse(pts[pts.length - 1][0]) - Date.parse(pts[0][0])) / 864e5);
      var note = days && span < days * 0.9 ? '<div class="di-movers-hint">' + esc(t.onlyHas) + ' ' + esc(dtxt(pts[0][0])) + '</div>' : '';
      el.innerHTML = window.DehesaChart ? window.DehesaChart.render({ series: ser, xMode: 'time', height: 230, yTitle: (s.currency || '') + (per(s) ? ' ' + per(s) : ''), legend: ser.length > 1, aria: specLabel(s), vFmt: function (v) { return '$' + nf(v, 2); } }) + note : '';
    };
    if (needHist) {
      el.innerHTML = '<div class="di-movers-hint">' + esc(t.loadingHist) + '</div>';
      hist(ST.s, ST.c).then(function (h) { var x = h.series[s.id]; if (x) go(x.pts); else go(s.pts); }).catch(function () { go(s.pts); });
    } else go(s.pts);
  }

  /* ---------- arranque ---------- */
  function load() {
    var t = tt(); sync(); root.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>';
    shard(ST.s, ST.c).then(function (doc) { render(doc); }).catch(function () { root.innerHTML = '<p class="di-info-api-notice">' + esc(tt().errLoad) + '</p>'; });
  }
  function boot() {
    var t = tt(); document.getElementById('pl-h1').textContent = t.title; document.getElementById('pl-sub').textContent = t.sub; document.title = t.title + ' — Dehesa Index';
    if (!M) { root.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>'; return; }
    if (!Object.keys(M.states).length) { root.innerHTML = '<p class="di-info-api-notice" role="status">' + esc(t.noManifest) + '</p>'; return; }
    if (!ST.s) defaults(); load();
  }
  window.DehesaShared.init('tools');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); boot(); };
  boot();
  Promise.all([get('manifest.json'), get('reports.json').catch(function () { return { reports: [] }; }), window.DIFreshness && window.DIFreshness.ready ? window.DIFreshness.ready().catch(function () { return null; }) : null]).then(function (a) {
    M = a[0]; (a[1].reports || []).forEach(function (r) { REP[r.reportId] = r; }); boot();
  }).catch(function () { root.innerHTML = '<p class="di-info-api-notice">' + esc(tt().errLoad) + '</p>'; });
})();
