/* Dehesa Index — Ficha de producto 3.0 (mini-terminal por producto). ES5, sin dependencias externas.
   Una pagina por producto con bloques que se cargan SOLO al acercarse a la vista (IntersectionObserver):
     cabecera (precio actual con mercado, valor/unidad originales, fecha, fuente, frescura y comparabilidad) -> que ha cambiado -> comparacion internacional
     (Unit Engine: Original | EUR/t | USD/t | Indice 100) -> historico (6m/1a/3a/5a/max) -> oferta y demanda -> comercio -> aranceles -> costes relacionados
     -> factores observados -> noticias -> detalle ampliado (cargado a peticion) -> fuentes y metodologia.
   Reglas: no se inventa nada. Si no hay conversion valida (sin tipo de cambio del mes, unidad no masica) la celda dice por que; lo no comparable no se presenta como comparable;
   los "factores" son hechos observados, no previsiones ni causas demostradas. Datos: data/product-metadata.json, data/products/<id>.json, DIPrices (latest/history), data/fx-history.json.
   API: DIProductTerminal.ready() -> Promise<meta>; .has(pid); .mount(pid, {legacy:{has,loaded,load,render}}); .state(). */
(function () {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LANGS.indexOf(lang()); return i < 0 ? 0 : i; }

  /* ---------- textos (es, en, fr, it) ---------- */
  var TX = {
    title: ['Ficha de producto', 'Product profile', 'Fiche produit', 'Scheda prodotto'],
    sub: ['Precio, comparación internacional, histórico, oferta y demanda, comercio, aranceles y costes de un producto; cada bloque indica fuente y fecha.', 'Price, international comparison, history, supply and demand, trade, tariffs and costs of one product; every block states its source and date.', 'Prix, comparaison internationale, historique, offre et demande, commerce, droits de douane et coûts d’un produit ; chaque bloc indique sa source et sa date.', 'Prezzo, confronto internazionale, storico, offerta e domanda, commercio, dazi e costi di un prodotto; ogni blocco indica fonte e data.'],
    nav: ['Productos', 'Products', 'Produits', 'Prodotti'],
    price: ['Precio actual', 'Current price', 'Prix actuel', 'Prezzo attuale'],
    asOf: ['Dato de', 'Data for', 'Donnée du', 'Dato del'],
    vsPrev: ['vs dato anterior', 'vs previous data point', 'vs donnée précédente', 'vs dato precedente'],
    source: ['Fuente', 'Source', 'Source', 'Fonte'],
    measures: ['Qué mide', 'What it measures', 'Ce que cela mesure', 'Cosa misura'],
    dueTxt: ['Próxima publicación esperada', 'Next publication expected', 'Prochaine publication attendue', 'Prossima pubblicazione attesa'],
    local: ['Mercados locales de grano (EE. UU.)', 'Local cash markets (US)', 'Marchés locaux des grains (É.-U.)', 'Mercati locali dei cereali (USA)'],
    localHint: ['Ofertas al contado USDA AMS por estado', 'USDA AMS cash bids by state', 'Offres au comptant USDA AMS par État', 'Offerte in contanti USDA AMS per stato'],
    localIntro: ['Qué pagan hoy los compradores en cada estado según USDA AMS. Cada precio es de una región, terminal o mercado concreto del informe, no un precio nacional.', 'What buyers are paying today in each state according to USDA AMS. Each price belongs to a region, terminal or market named in the report, not a national price.', 'Ce que les acheteurs paient aujourd’hui dans chaque État selon l’USDA AMS. Chaque prix correspond à une région, un terminal ou un marché du rapport, pas à un prix national.', 'Quanto pagano oggi gli acquirenti in ogni stato secondo USDA AMS. Ogni prezzo riguarda una regione, un terminale o un mercato del rapporto, non un prezzo nazionale.'],
    localMk: ['{0} mercados · último dato {1}', '{0} markets · latest {1}', '{0} marchés · dernière donnée {1}', '{0} mercati · ultimo dato {1}'],
    localCta: ['Explorar precios locales →', 'Explore local cash bids →', 'Explorer les prix locaux →', 'Esplora i prezzi locali →'],
    localNone: ['Sin informes locales disponibles todavía.', 'No local reports available yet.', 'Aucun rapport local disponible pour le moment.', 'Nessun rapporto locale disponibile al momento.'],
    prem: ['Premium orgánico frente a convencional (EE. UU.)', 'Organic premium vs conventional (US)', 'Prime bio par rapport au conventionnel (É.-U.)', 'Premio biologico rispetto al convenzionale (USA)'],
    premHint: ['USDA AMS, misma especificación', 'USDA AMS, same specification', 'USDA AMS, même spécification', 'USDA AMS, stessa specifica'],
    premIntro: ['Mediana de ofertas orgánicas (USDA AMS 3802) frente a mediana de ofertas convencionales con la misma especificación (producto, clase, grado y elevador) en la misma fecha. Es indicativo: son dos informes distintos y su cobertura regional no coincide.', 'Median organic bids (USDA AMS 3802) versus median conventional bids with the same specification (product, class, grade and elevator) on the same date. Indicative only: two different reports whose regional coverage does not match.', 'Médiane des offres bio (USDA AMS 3802) face à la médiane des offres conventionnelles de même spécification (produit, classe, qualité et silo) à la même date. Indicatif : deux rapports distincts dont la couverture régionale diffère.', 'Mediana delle offerte biologiche (USDA AMS 3802) rispetto alla mediana delle offerte convenzionali con la stessa specifica (prodotto, classe, grado ed elevatore) nella stessa data. Indicativo: due rapporti diversi con copertura regionale non coincidente.'],
    premOrg: ['Orgánico', 'Organic', 'Bio', 'Biologico'], premConv: ['Convencional', 'Conventional', 'Conventionnel', 'Convenzionale'], premDiff: ['Diferencial', 'Premium', 'Écart', 'Differenziale'],
    premN: ['{0} series orgánicas · {1} convencionales · dato de {2}', '{0} organic series · {1} conventional · data for {2}', '{0} séries bio · {1} conventionnelles · donnée du {2}', '{0} serie biologiche · {1} convenzionali · dato del {2}'],
    premNone: ['Sin comparación posible hoy: no hay series suficientes con la misma especificación.', 'No comparison possible today: not enough series with the same specification.', 'Comparaison impossible aujourd’hui : pas assez de séries de même spécification.', 'Nessun confronto possibile oggi: non ci sono abbastanza serie con la stessa specifica.'],
    follow: ['☆ Seguir producto', '☆ Follow product', '☆ Suivre le produit', '☆ Segui prodotto'],
    following: ['★ Siguiendo', '★ Following', '★ Suivi', '★ Segui già'],
    followHint: ['Crea avisos en este navegador (sin cuenta): dato nuevo y cambio ≥ 5 %. Puedes ajustarlos aquí o en Mi seguimiento.', 'Creates alerts in this browser (no account): new data point and change ≥ 5 %. Adjust them here or in My watchlist.', 'Crée des alertes dans ce navigateur (sans compte) : nouvelle donnée et variation ≥ 5 %. Ajustez-les ici ou dans Mon suivi.', 'Crea avvisi in questo browser (senza account): nuovo dato e variazione ≥ 5 %. Modificali qui o in Il mio seguito.'],
    unfollow: ['Dejar de seguir', 'Unfollow', 'Ne plus suivre', 'Smetti di seguire'],
    myWatch: ['Mi seguimiento', 'My watchlist', 'Mon suivi', 'Il mio seguito'],
    noPrice: ['Este producto no tiene todavía un precio publicado en Dehesa.', 'This product has no published price in Dehesa yet.', 'Ce produit n’a pas encore de prix publié sur Dehesa.', 'Questo prodotto non ha ancora un prezzo pubblicato su Dehesa.'],
    changed: ['¿Qué ha cambiado en {0}?', 'What changed for {0}?', 'Qu’est-ce qui a changé pour {0} ?', 'Cosa è cambiato per {0}?'],
    changedHint: ['Brief diario (24 h), revisiones oficiales y frescura de cada serie', 'Daily Brief (24 h), official revisions and freshness of each series', 'Brief quotidien (24 h), révisions officielles et fraîcheur de chaque série', 'Brief giornaliero (24 h), revisioni ufficiali e freschezza di ogni serie'],
    inBrief: ['Novedades de las últimas 24 h (Brief diario)', 'News in the last 24 h (Daily Brief)', 'Nouveautés des dernières 24 h (Brief quotidien)', 'Novità delle ultime 24 h (Brief giornaliero)'],
    noBrief: ['Ninguna serie de este producto ha publicado un dato nuevo en las últimas 24 h.', 'No series of this product published a new data point in the last 24 h.', 'Aucune série de ce produit n’a publié de nouvelle donnée ces dernières 24 h.', 'Nessuna serie di questo prodotto ha pubblicato un nuovo dato nelle ultime 24 h.'],
    lastObs: ['Última observación de cada serie', 'Latest observation of each series', 'Dernière observation de chaque série', 'Ultima osservazione di ogni serie'],
    revs: ['Revisiones oficiales detectadas (últimos 30 días)', 'Official revisions detected (last 30 days)', 'Révisions officielles détectées (30 derniers jours)', 'Revisioni ufficiali rilevate (ultimi 30 giorni)'],
    noRevs: ['No se han detectado revisiones oficiales de estas series.', 'No official revisions detected for these series.', 'Aucune révision officielle détectée pour ces séries.', 'Nessuna revisione ufficiale rilevata per queste serie.'],
    newPoint: ['dato nuevo', 'new data point', 'nouvelle donnée', 'nuovo dato'],
    revised: ['revisado', 'revised', 'révisé', 'rivisto'],
    compare: ['Comparación internacional', 'International comparison', 'Comparaison internationale', 'Confronto internazionale'],
    compareHint: ['Valor original y normalizado con el Unit Engine; cada fila lleva su fecha y su comparabilidad', 'Original and Unit-Engine-normalised values; every row carries its date and comparability', 'Valeur d’origine et normalisée par le Unit Engine ; chaque ligne porte sa date et sa comparabilité', 'Valore originale e normalizzato con lo Unit Engine; ogni riga ha data e comparabilità'],
    unit: ['Unidad', 'Unit', 'Unité', 'Unità'],
    orig: ['Original', 'Original', 'Original', 'Originale'],
    idx: ['Índice 100', 'Index 100', 'Indice 100', 'Indice 100'],
    cMarket: ['Mercado', 'Market', 'Marché', 'Mercato'],
    cOrig: ['Original', 'Original', 'Original', 'Originale'],
    cNorm: ['Normalizado', 'Normalised', 'Normalisé', 'Normalizzato'],
    cDate: ['Fecha', 'Date', 'Date', 'Data'],
    cFresh: ['Frescura', 'Freshness', 'Fraîcheur', 'Freschezza'],
    cSrc: ['Fuente', 'Source', 'Source', 'Fonte'],
    cComp: ['Comparabilidad', 'Comparability', 'Comparabilité', 'Comparabilità'],
    cp_exact: ['Exacta', 'Exact', 'Exacte', 'Esatta'],
    cp_directional: ['Orientativa', 'Directional', 'Indicative', 'Indicativa'],
    cp_not_comparable: ['No comparable', 'Not comparable', 'Non comparable', 'Non confrontabile'],
    cpNote: ['Orientativa = mismo concepto aproximado, no idéntico (calidad, punto de venta o definición distintos). No comparable = el concepto de precio es distinto: no se compara con los demás mercados.', 'Directional = similar but not identical concept (quality, point of sale or definition differ). Not comparable = the price concept differs: it is not compared with the other markets.', 'Indicative = concept proche mais non identique (qualité, point de vente ou définition différents). Non comparable = le concept de prix diffère : il n’est pas comparé aux autres marchés.', 'Indicativa = concetto simile ma non identico (qualità, punto vendita o definizione diversi). Non confrontabile = il concetto di prezzo è diverso: non viene confrontato con gli altri mercati.'],
    identity: ['Instrumento: producto, calidad, lugar y etapa de mercado', 'Instrument: product, grade, place and market stage', 'Instrument : produit, qualité, lieu et étape de marché', 'Strumento: prodotto, qualità, luogo e fase di mercato'],
    spreadQ: ['Diferencia orientativa entre instrumentos distintos: {0} está un {1} % por encima de {2}. No son el mismo instrumento (difieren en {3}); no es una comparación exacta.', 'Indicative gap between different instruments: {0} is {1} % above {2}. They are not the same instrument (they differ in {3}); not an exact comparison.', 'Écart indicatif entre instruments différents : {0} est {1} % au-dessus de {2}. Ce ne sont pas les mêmes instruments (ils diffèrent par {3}) ; comparaison non exacte.', 'Differenza indicativa tra strumenti diversi: {0} è il {1} % sopra {2}. Non sono lo stesso strumento (differiscono per {3}); non è un confronto esatto.'],
    noSpread: ['No se calcula diferencia de precio entre {0} y {1}: son productos o formas distintos ({2}), no el mismo instrumento.', 'No price gap is computed between {0} and {1}: they are different products or forms ({2}), not the same instrument.', 'Aucun écart de prix n’est calculé entre {0} et {1} : ce sont des produits ou des formes différents ({2}), pas le même instrument.', 'Nessuna differenza di prezzo tra {0} e {1}: sono prodotti o forme diversi ({2}), non lo stesso strumento.'],
    spread: ['Diferencia orientativa: {0} está un {1} % por encima de {2} (calidades, puntos de venta y fechas distintas; no es una comparación exacta).', 'Indicative gap: {0} is {1} % above {2} (different qualities, points of sale and dates; not an exact comparison).', 'Écart indicatif : {0} est {1} % au-dessus de {2} (qualités, points de vente et dates différents ; comparaison non exacte).', 'Differenza indicativa: {0} è il {1} % sopra {2} (qualità, punti vendita e date diversi; non è un confronto esatto).'],
    noConv: ['sin conversión', 'no conversion', 'pas de conversion', 'nessuna conversione'],
    r_no_fx: ['No hay tipo de cambio del BCE para ese mes (ni en los 2 meses anteriores).', 'No ECB exchange rate for that month (nor the 2 previous months).', 'Pas de taux de change BCE pour ce mois (ni les 2 mois précédents).', 'Nessun tasso BCE per quel mese (né nei 2 mesi precedenti).'],
    r_no_unit: ['La unidad de precio no se puede convertir a masa o volumen sin suponer algo (p. ej. docenas).', 'The price unit cannot be converted to mass or volume without assuming something (e.g. dozens).', 'L’unité de prix ne peut pas être convertie en masse ou volume sans hypothèse (p. ex. douzaines).', 'L’unità di prezzo non si può convertire in massa o volume senza ipotesi (es. dozzine).'],
    r_not_comp: ['Excluido del índice: su concepto de precio no es comparable con los demás mercados.', 'Left out of the index: its price concept is not comparable with the other markets.', 'Exclu de l’indice : son concept de prix n’est pas comparable aux autres marchés.', 'Escluso dall’indice: il suo concetto di prezzo non è confrontabile con gli altri mercati.'],
    r_no_hist: ['Sin histórico suficiente en el periodo.', 'Not enough history in the period.', 'Historique insuffisant sur la période.', 'Storico insufficiente nel periodo.'],
    fullCmp: ['Comparador completo (países, periodo, filtros)', 'Full comparator (countries, period, filters)', 'Comparateur complet (pays, période, filtres)', 'Confronto completo (paesi, periodo, filtri)'],
    idxNote: ['Índice 100 = valor de la última fecha respecto al inicio del periodo del histórico elegido (base común: {0}).', 'Index 100 = latest value relative to the start of the chosen history period (common base: {0}).', 'Indice 100 = dernière valeur par rapport au début de la période d’historique choisie (base commune : {0}).', 'Indice 100 = ultimo valore rispetto all’inizio del periodo di storico scelto (base comune: {0}).'],
    hist: ['Histórico', 'History', 'Historique', 'Storico'],
    histHint: ['Se descarga solo la serie de este producto; la unidad elegida arriba se aplica al gráfico', 'Only this product’s series is downloaded; the unit chosen above applies to the chart', 'Seule la série de ce produit est téléchargée ; l’unité choisie ci-dessus s’applique au graphique', 'Si scarica solo la serie di questo prodotto; l’unità scelta sopra si applica al grafico'],
    range: ['Periodo', 'Period', 'Période', 'Periodo'],
    m6: ['6 meses', '6 months', '6 mois', '6 mesi'], y1: ['1 año', '1 year', '1 an', '1 anno'], y3: ['3 años', '3 years', '3 ans', '3 anni'], y5: ['5 años', '5 years', '5 ans', '5 anni'], max: ['Máx.', 'Max', 'Max', 'Max'],
    series: ['Serie', 'Series', 'Série', 'Serie'],
    excluded: ['Excluidas del gráfico por no ser comparables o no convertibles: {0}.', 'Left out of the chart because they are not comparable or not convertible: {0}.', 'Exclues du graphique car non comparables ou non convertibles : {0}.', 'Escluse dal grafico perché non confrontabili o non convertibili: {0}.'],
    sd: ['Oferta y demanda', 'Supply and demand', 'Offre et demande', 'Offerta e domanda'],
    sdHint: ['Balance USDA PSD de las 3 últimas campañas; la última es una previsión del USDA', 'USDA PSD balance, last 3 marketing years; the latest is a USDA forecast', 'Bilan USDA PSD des 3 dernières campagnes ; la dernière est une prévision USDA', 'Bilancio USDA PSD delle ultime 3 campagne; l’ultima è una previsione USDA'],
    noSd: ['USDA PSD no publica un balance de oferta y demanda para este producto, así que no se muestra ninguno.', 'USDA PSD does not publish a supply-and-demand balance for this product, so none is shown.', 'USDA PSD ne publie pas de bilan offre-demande pour ce produit, aucun n’est donc affiché.', 'USDA PSD non pubblica un bilancio offerta-domanda per questo prodotto, quindi non se ne mostra alcuno.'],
    production: ['Producción', 'Production', 'Production', 'Produzione'], imports: ['Importaciones', 'Imports', 'Importations', 'Importazioni'], exports: ['Exportaciones', 'Exports', 'Exportations', 'Esportazioni'],
    consumption: ['Consumo', 'Consumption', 'Consommation', 'Consumo'], endingStocks: ['Existencias finales', 'Ending stocks', 'Stocks finaux', 'Scorte finali'], stockToUse: ['Existencias / consumo', 'Stocks-to-use', 'Stocks / consommation', 'Scorte / consumo'],
    entUS: ['EE. UU.', 'United States', 'États-Unis', 'Stati Uniti'], entEU: ['Unión Europea', 'European Union', 'Union européenne', 'Unione europea'], entWORLD: ['Mundo (suma de países PSD)', 'World (sum of PSD countries)', 'Monde (somme des pays PSD)', 'Mondo (somma dei paesi PSD)'],
    forecast: ['previsión', 'forecast', 'prévision', 'previsione'], vsPY: ['vs campaña anterior', 'vs previous year', 'vs campagne précédente', 'vs campagna precedente'],
    attr: ['Concepto', 'Item', 'Poste', 'Voce'],
    trade: ['Comercio mundial', 'World trade', 'Commerce mondial', 'Commercio mondiale'],
    tradeHint: ['Principales exportadores e importadores (USDA PSD) y concentración', 'Main exporters and importers (USDA PSD) and concentration', 'Principaux exportateurs et importateurs (USDA PSD) et concentration', 'Principali esportatori e importatori (USDA PSD) e concentrazione'],
    noTrade: ['USDA PSD no cubre el comercio de este producto; no se muestra estructura de comercio.', 'USDA PSD does not cover trade in this product; no trade structure is shown.', 'USDA PSD ne couvre pas le commerce de ce produit ; aucune structure n’est affichée.', 'USDA PSD non copre il commercio di questo prodotto; non si mostra la struttura.'],
    exporters: ['Exportadores', 'Exporters', 'Exportateurs', 'Esportatori'], importers: ['Importadores', 'Importers', 'Importateurs', 'Importatori'],
    coverage: ['Los países listados cubren el {0} % del total mundial; los 3 mayores suman {2} %.', 'Listed countries cover {0} % of the world total; the top 3 add up to {2} %.', 'Les pays listés couvrent {0} % du total mondial ; les 3 premiers font {2} %.', 'I paesi elencati coprono il {0} % del totale mondiale; i primi 3 sommano il {2} %.'],
    hhi: ['HHI (cota inferior): {0} → {1}', 'HHI (lower bound): {0} → {1}', 'HHI (borne inférieure) : {0} → {1}', 'HHI (limite inferiore): {0} → {1}'],
    hhiHigh: ['concentración al menos alta', 'at least highly concentrated', 'au moins fortement concentré', 'almeno molto concentrato'], hhiMod: ['concentración al menos moderada', 'at least moderately concentrated', 'au moins modérément concentré', 'almeno moderatamente concentrato'],
    hhiLow: ['concentración baja entre los países listados', 'low concentration among the listed countries', 'faible concentration parmi les pays listés', 'bassa concentrazione tra i paesi elencati'],
    tariffs: ['Aranceles', 'Tariffs', 'Droits de douane', 'Dazi'],
    tariffsHint: ['Resumen por partida HS en EE. UU., UE, Canadá y México (arancel general publicado por cada administración)', 'Summary by HS heading in the US, EU, Canada and Mexico (general tariff published by each authority)', 'Résumé par position SH aux États-Unis, UE, Canada et Mexique (droit général publié par chaque administration)', 'Riepilogo per voce SA in USA, UE, Canada e Messico (dazio generale pubblicato da ogni amministrazione)'],
    noTariffs: ['Este producto no tiene partida arancelaria asignada (p. ej. es un precio de energía), así que no hay aranceles que mostrar.', 'This product has no assigned tariff heading (e.g. it is an energy price), so there are no tariffs to show.', 'Ce produit n’a pas de position tarifaire (p. ex. un prix d’énergie) : aucun droit à afficher.', 'Questo prodotto non ha una voce tariffaria (es. è un prezzo energetico): nessun dazio da mostrare.'],
    heading: ['Partida', 'Heading', 'Position', 'Voce'], lines: ['Líneas', 'Lines', 'Lignes', 'Linee'], free: ['Libres', 'Free', 'Exemptes', 'Esenti'], advalorem: ['Ad valorem (media / máx.)', 'Ad valorem (avg / max)', 'Ad valorem (moy. / max.)', 'Ad valorem (media / max.)'],
    specific: ['Específicos', 'Specific', 'Spécifiques', 'Specifici'], trq: ['Con contingente', 'With quota', 'Avec contingent', 'Con contingente'], examples: ['Ejemplos de líneas', 'Example lines', 'Exemples de lignes', 'Esempi di linee'],
    noHeading: ['sin partida publicada', 'no published heading', 'pas de position publiée', 'nessuna voce pubblicata'],
    allTariffs: ['Todos los aranceles', 'All tariffs', 'Tous les droits', 'Tutti i dazi'],
    costs: ['Costes relacionados', 'Related costs', 'Coûts liés', 'Costi correlati'],
    costsHint: ['Solo relaciones económicas documentadas en los metadatos del producto', 'Only economic relationships documented in the product metadata', 'Seulement les relations économiques documentées dans les métadonnées du produit', 'Solo relazioni economiche documentate nei metadati del prodotto'],
    noCosts: ['No se muestran costes relacionados: Dehesa no tiene documentada una relación económica directa para este producto y no se improvisa.', 'No related costs shown: Dehesa has no documented direct economic relationship for this product and does not improvise one.', 'Aucun coût lié affiché : Dehesa n’a pas de relation économique directe documentée pour ce produit et n’en improvise pas.', 'Nessun costo correlato: Dehesa non ha una relazione economica diretta documentata per questo prodotto e non la improvvisa.'],
    why_fertilizer: ['Insumo: fertilizante', 'Input: fertiliser', 'Intrant : engrais', 'Input: fertilizzante'], why_energy: ['Insumo: energía', 'Input: energy', 'Intrant : énergie', 'Input: energia'], why_feed: ['Insumo: pienso', 'Input: feed', 'Intrant : aliment du bétail', 'Input: mangime'],
    usedBy: ['Se usa como insumo en', 'Used as an input in', 'Utilisé comme intrant pour', 'Usato come input per'],
    costsNote: ['Que un insumo y un producto aparezcan juntos no es una relación causal medida: la relación observada entre ambos mercados se describe (sin predecir) en Precios → relaciones agrícolas.', 'An input and a product appearing together is not a measured causal link: the observed relationship between both markets is described (without predicting) in Prices → agricultural relationships.', 'Qu’un intrant et un produit apparaissent ensemble n’est pas un lien causal mesuré : la relation observée entre les deux marchés est décrite (sans prédire) dans Prix → relations agricoles.', 'Il fatto che un input e un prodotto compaiano insieme non è un legame causale misurato: la relazione osservata tra i due mercati è descritta (senza prevedere) in Prezzi → relazioni agricole.'],
    rels: ['Relaciones observadas con otros mercados', 'Observed relationships with other markets', 'Relations observées avec d’autres marchés', 'Relazioni osservate con altri mercati'],
    relsHint: ['Cómo se han movido juntos insumos y precios; descriptivo, no predictivo', 'How inputs and prices moved together; descriptive, not predictive', 'Comment intrants et prix ont évolué ensemble ; descriptif, pas prédictif', 'Come input e prezzi si sono mossi insieme; descrittivo, non predittivo'],
    relsNone: ['Dehesa no tiene relaciones documentadas para este producto; no se buscan correlaciones al azar.', 'Dehesa has no documented relationships for this product; correlations are not mined at random.', 'Dehesa n’a pas de relations documentées pour ce produit ; les corrélations ne sont pas cherchées au hasard.', 'Dehesa non ha relazioni documentate per questo prodotto; le correlazioni non si cercano a caso.'],
    relsDisc: ['Descriptivo, no predictivo: la correlación no prueba causas y no anticipa precios.', 'Descriptive, not predictive: correlation does not prove causes and does not anticipate prices.', 'Descriptif, pas prédictif : la corrélation ne prouve pas de causes et n’anticipe pas les prix.', 'Descrittivo, non predittivo: la correlazione non prova cause e non anticipa i prezzi.'],
    relsAll: ['Ver todas las relaciones', 'See all relationships', 'Voir toutes les relations', 'Vedi tutte le relazioni'],
    relsDetail: ['detalle', 'details', 'détail', 'dettaglio'], relsCorr: ['r', 'r', 'r', 'r'], relsLag0: ['mismo periodo', 'same period', 'même période', 'stesso periodo'],
    relsLag: ['rezago {0}', 'lag {0}', 'décalage {0}', 'ritardo {0}'],
    relsLagH: ['Rezago', 'Lag', 'Décalage', 'Ritardo'], relsPair: ['Insumo → mercado', 'Input → market', 'Intrant → marché', 'Input → mercato'], relsSt: ['Estado', 'Status', 'Statut', 'Stato'],
    relsConf: ['confianza', 'confidence', 'confiance', 'confidenza'],
    calcLink: ['Calcula tu margen y tu precio de equilibrio', 'Calculate your margin and break-even price', 'Calculez votre marge et votre prix d’équilibre', 'Calcola il tuo margine e il prezzo di pareggio'],
    drivers: ['Factores observados', 'Observed factors', 'Facteurs observés', 'Fattori osservati'],
    driversHint: ['Hechos medidos en los datos de arriba. No son previsiones ni causas demostradas', 'Facts measured in the data above. They are not forecasts or proven causes', 'Faits mesurés dans les données ci-dessus. Ce ne sont ni des prévisions ni des causes démontrées', 'Fatti misurati nei dati sopra. Non sono previsioni né cause dimostrate'],
    noDrivers: ['No hay datos suficientes para listar factores observados.', 'Not enough data to list observed factors.', 'Pas assez de données pour lister des facteurs observés.', 'Dati insufficienti per elencare fattori osservati.'],
    d_price: ['Precio {0}: {1} en 12 meses ({2} → {3}).', 'Price {0}: {1} over 12 months ({2} → {3}).', 'Prix {0} : {1} sur 12 mois ({2} → {3}).', 'Prezzo {0}: {1} in 12 mesi ({2} → {3}).'],
    d_stu: ['Existencias/consumo {0}: {1} % → {2} % ({3} → {4}, USDA PSD).', 'Stocks-to-use {0}: {1} % → {2} % ({3} → {4}, USDA PSD).', 'Stocks/consommation {0} : {1} % → {2} % ({3} → {4}, USDA PSD).', 'Scorte/consumo {0}: {1} % → {2} % ({3} → {4}, USDA PSD).'],
    d_prod: ['Producción {0}: {1} ({2} → {3}, USDA PSD).', 'Production {0}: {1} ({2} → {3}, USDA PSD).', 'Production {0} : {1} ({2} → {3}, USDA PSD).', 'Produzione {0}: {1} ({2} → {3}, USDA PSD).'],
    d_input: ['{0} ({1}): {2} en el último dato ({3}).', '{0} ({1}): {2} on the latest data point ({3}).', '{0} ({1}) : {2} sur la dernière donnée ({3}).', '{0} ({1}): {2} nell’ultimo dato ({3}).'],
    d_conc: ['El mayor exportador ({0}) concentra el {1} % de las exportaciones mundiales de PSD.', 'The largest exporter ({0}) holds {1} % of world exports in PSD.', 'Le premier exportateur ({0}) concentre {1} % des exportations mondiales de PSD.', 'Il maggiore esportatore ({0}) concentra il {1} % delle esportazioni mondiali PSD.'],
    d_late: ['Serie {0}: {1} (último dato {2}); conviene leer el precio con cautela.', 'Series {0}: {1} (latest data {2}); read the price with caution.', 'Série {0} : {1} (dernière donnée {2}) ; lire le prix avec prudence.', 'Serie {0}: {1} (ultimo dato {2}); leggere il prezzo con cautela.'],
    news: ['Noticias', 'News', 'Actualités', 'Notizie'],
    newsHint: ['Titulares de las fuentes del sitio que mencionan este producto', 'Headlines from the site’s sources that mention this product', 'Titres des sources du site qui mentionnent ce produit', 'Titoli delle fonti del sito che citano questo prodotto'],
    noNews: ['Sin noticias recientes sobre este producto en las fuentes seguidas.', 'No recent news about this product in the tracked sources.', 'Pas d’actualité récente sur ce produit dans les sources suivies.', 'Nessuna notizia recente su questo prodotto nelle fonti seguite.'],
    legacy: ['Detalle ampliado (EE. UU.: USDA, ERS, NASS)', 'Extended detail (US: USDA, ERS, NASS)', 'Détail étendu (États-Unis : USDA, ERS, NASS)', 'Dettaglio esteso (USA: USDA, ERS, NASS)'],
    legacyHint: ['Ventas de exportación, cultivo, sequía y costes de producción. Se descarga solo si lo pides (varios MB)', 'Export sales, crop, drought and production costs. Downloaded only on request (several MB)', 'Ventes à l’exportation, culture, sécheresse et coûts de production. Téléchargé sur demande (plusieurs Mo)', 'Vendite all’esportazione, coltura, siccità e costi di produzione. Si scarica solo su richiesta (diversi MB)'],
    legacyBtn: ['Cargar detalle ampliado', 'Load extended detail', 'Charger le détail étendu', 'Carica il dettaglio esteso'],
    sources: ['Fuentes y metodología', 'Sources and methodology', 'Sources et méthodologie', 'Fonti e metodologia'],
    srcIntro: ['Cada dato conserva su fuente, fecha y licencia. Fuentes usadas en esta ficha:', 'Every data point keeps its source, date and licence. Sources used on this page:', 'Chaque donnée conserve sa source, sa date et sa licence. Sources utilisées sur cette fiche :', 'Ogni dato conserva fonte, data e licenza. Fonti usate in questa scheda:'],
    fxNote: ['Tipos de cambio: BCE, media mensual del mes del dato (si falta, el mes anterior, máximo 2 meses; si no, no se convierte).', 'Exchange rates: ECB monthly average of the data month (if missing, the previous month, at most 2 months; otherwise no conversion).', 'Taux de change : BCE, moyenne mensuelle du mois de la donnée (à défaut, le mois précédent, 2 mois max. ; sinon pas de conversion).', 'Tassi di cambio: BCE, media mensile del mese del dato (se manca, il mese precedente, al massimo 2 mesi; altrimenti nessuna conversione).'],
    methLink: ['Metodología completa', 'Full methodology', 'Méthodologie complète', 'Metodologia completa'],
    loading: ['Cargando…', 'Loading…', 'Chargement…', 'Caricamento…'],
    loadErr: ['No se pudo cargar este bloque.', 'This block could not be loaded.', 'Ce bloc n’a pas pu être chargé.', 'Impossibile caricare questo blocco.'],
    retry: ['Reintentar', 'Retry', 'Réessayer', 'Riprova'],
    unknown: ['Producto desconocido', 'Unknown product', 'Produit inconnu', 'Prodotto sconosciuto'],
    group: [{ cereales: 'Cereales', oleaginosas: 'Oleaginosas', lacteos: 'Lácteos', ganaderia: 'Ganadería', insumos: 'Insumos', energia: 'Energía', aceites: 'Aceites', azucar: 'Azúcar', otros: 'Otros' }, { cereales: 'Cereals', oleaginosas: 'Oilseeds', lacteos: 'Dairy', ganaderia: 'Livestock', insumos: 'Inputs', energia: 'Energy', aceites: 'Oils', azucar: 'Sugar', otros: 'Other' }, { cereales: 'Céréales', oleaginosas: 'Oléagineux', lacteos: 'Produits laitiers', ganaderia: 'Élevage', insumos: 'Intrants', energia: 'Énergie', aceites: 'Huiles', azucar: 'Sucre', otros: 'Autres' }, { cereales: 'Cereali', oleaginosas: 'Oleaginose', lacteos: 'Latticini', ganaderia: 'Allevamento', insumos: 'Input', energia: 'Energia', aceites: 'Oli', azucar: 'Zucchero', otros: 'Altro' }]
  };
  function t(k) { var a = TX[k]; if (!a) return k; var v = a[li()]; return v === undefined ? a[0] : v; }
  function tf(k) { var s = t(k), a = arguments; return s.replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1] === undefined ? m : a[+i + 1]; }); }
  var REG = { eu: ['Unión Europea', 'European Union', 'Union européenne', 'Unione europea'], us: ['EE. UU.', 'United States', 'États-Unis', 'Stati Uniti'], ca: ['Canadá', 'Canada', 'Canada', 'Canada'], uk: ['Reino Unido', 'United Kingdom', 'Royaume-Uni', 'Regno Unito'] };
  function reg(r) { var a = REG[r]; return a ? a[li()] : String(r).toUpperCase(); }
  var NAMEX = { gas_natural: ['Gas natural', 'Natural gas', 'Gaz naturel', 'Gas naturale'], harina_soja: ['Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia'], petroleo_brent: ['Petróleo Brent', 'Brent crude', 'Pétrole Brent', 'Petrolio Brent'] };
  var SRC = { eu_agrifood: 'Comisión Europea · Agri-food Data Portal', usda_nass: 'USDA NASS (Quick Stats)', statcan: 'Statistics Canada', defra: 'DEFRA (Reino Unido)', eurostat: 'Eurostat', world_bank: 'Banco Mundial (Pink Sheet)', usda_ams_mars: 'USDA AMS (MARS)', european_commission: 'Comisión Europea · Observatorio del mercado lácteo', eu_oil_bulletin: 'Boletín Petrolero de la UE', eia: 'U.S. EIA', usda_fas_psd: 'USDA FAS (PSD)', us_tariffs: 'USITC (HTS de EE. UU.)', eu_taric: 'Comisión Europea (TARIC)', cbsa_tariff: 'CBSA (Canadá)', snice_mx: 'SNICE (México)', ecb: 'Banco Central Europeo' };
  function srcName(id) { return SRC[id] || id || '—'; }
  var SRCURL = { eu_agrifood: 'https://agridata.ec.europa.eu/', usda_nass: 'https://quickstats.nass.usda.gov/', statcan: 'https://www.statcan.gc.ca/', defra: 'https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs', eurostat: 'https://ec.europa.eu/eurostat', world_bank: 'https://www.worldbank.org/en/research/commodity-markets', usda_ams_mars: 'https://mymarketnews.ams.usda.gov/', eu_oil_bulletin: 'https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en', eia: 'https://www.eia.gov/', usda_fas_psd: 'https://apps.fas.usda.gov/psdonline/', ecb: 'https://data.ecb.europa.eu/' };

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, mn, mx) { try { return v.toLocaleString(lang(), { minimumFractionDigits: mn, maximumFractionDigits: mx === undefined ? mn : mx }); } catch (e) { return v.toFixed(mx === undefined ? mn : mx); } }
  function sg(v, d) { return (v > 0.0001 ? '+' : v < -0.0001 ? '−' : '') + nf(Math.abs(v), d); }
  function chg(v) { if (typeof v !== 'number' || isNaN(v)) return '<span class="pt-flat">—</span>'; return '<span class="' + (v > 0.05 ? 'pt-up' : v < -0.05 ? 'pt-down' : 'pt-flat') + '">' + sg(v, 1) + ' %</span>'; }
  function chgTxt(v) { return sg(v, 1) + ' %'; }
  function dstr(iso) {
    var s = String(iso || ''), p = s.split('-');
    try {
      if (/^\d{4}-\d{2}$/.test(s)) return new Date(Date.UTC(+p[0], +p[1] - 1, 1)).toLocaleDateString(lang(), { month: 'short', year: 'numeric', timeZone: 'UTC' });
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2].slice(0, 2))).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { /* cae al texto */ }
    return s || '—';
  }
  function fmt(s, a) { var out = s; for (var i = 0; i < a.length; i++) out = out.replace('{' + i + '}', a[i]); return out; }
  function path(p) { return window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath(p) : p; }
  var JC = {};
  function J(file, opts) {
    if (JC[file]) return JC[file];
    return JC[file] = fetch(path('data/' + file), opts || {}).then(function (r) { if (!r.ok) throw new Error(file + ' ' + r.status); return r.json(); }).catch(function (e) { delete JC[file]; throw e; });
  }
  var ISO = { 'United States': 'US', 'European Union': 'EU', 'Russia': 'RU', 'Canada': 'CA', 'Australia': 'AU', 'Argentina': 'AR', 'Ukraine': 'UA', 'Kazakhstan': 'KZ', 'Brazil': 'BR', 'China': 'CN', 'India': 'IN', 'Indonesia': 'ID', 'Egypt': 'EG', 'Algeria': 'DZ', 'Philippines': 'PH', 'Bangladesh': 'BD', 'Nigeria': 'NG', 'Mexico': 'MX', 'Japan': 'JP', 'Turkey': 'TR', 'Vietnam': 'VN', 'Thailand': 'TH', 'Pakistan': 'PK', 'Saudi Arabia': 'SA', 'South Korea': 'KR', 'Korea, South': 'KR', 'Iran': 'IR', 'Iraq': 'IQ', 'Morocco': 'MA', 'Malaysia': 'MY', 'Burma': 'MM', 'Cambodia': 'KH', 'Uruguay': 'UY', 'Paraguay': 'PY', 'New Zealand': 'NZ', 'United Kingdom': 'GB', 'Tunisia': 'TN', 'Peru': 'PE', 'Colombia': 'CO', 'Chile': 'CL', 'Taiwan': 'TW', 'Israel': 'IL', 'Switzerland': 'CH', 'Serbia': 'RS', 'Moldova': 'MD', 'Belarus': 'BY', 'South Africa': 'ZA', 'Senegal': 'SN', 'Ghana': 'GH', 'Cuba': 'CU', 'Venezuela': 'VE', 'Zimbabwe': 'ZW', 'Jordan': 'JO', 'Yemen': 'YE', 'Kenya': 'KE', 'Sri Lanka': 'LK', 'Nepal': 'NP', 'Philippines ': 'PH' };
  function cname(n) { var P = window.DehesaPSD; return P && P.countryName ? P.countryName(ISO[n] || n, n) : n; }
  function nm(pid) { var m = META && META.products[pid]; if (m) return m.name[LANGS[li()]] || m.name.es; var x = NAMEX[pid]; return x ? x[li()] : pid; }

  /* ---------- unidades ---------- */
  var UL = { tonelada: 't', '100kg': '100 kg', bushel: 'bu', cwt: 'cwt', ton_corta: 'short ton', docena: 'dz', litro: 'l', gal: 'gal', index_2020_100: '2020=100' };
  var GAL_L = 3.785411784;
  function isIdx(o) { return o.currency === 'INDEX' || o.unit === 'index_2020_100'; }
  function perFor(pid) {
    var m = META.products[pid] || {};
    if (pid === 'diesel') return 1;
    if (m.compare && m.compare.per) return m.compare.per;
    return (m.kind === 'livestock' || m.kind === 'dairy') ? 100 : 1000;
  }
  function normLabel(mode, pid) {
    var p = perFor(pid), u = pid === 'diesel' ? 'l' : (p === 100 ? '100 kg' : 't');
    return mode === 'eur' ? '€/' + u : mode === 'usd' ? 'USD/' + u : mode === 'idx' ? t('idx') : t('orig');
  }
  // cantidad base (kg o litros) que representa una unidad de precio; null si no se puede convertir sin suponer algo
  function baseQty(o) {
    var u = o.unit;
    if (u === 'litro') return 1;
    if (u === 'gal') return GAL_L;
    if (u === 'docena') return null;
    var DU = window.DIUnits;
    if (u === 'tonelada') return DU.mass.kgPer('t');
    if (u === 'ton_corta') return DU.mass.kgPer('short_ton');
    if (u === 'bushel') return DU.mass.kgPer('bushel', o.product);
    return DU.mass.kgPer(u);
  }
  function convObs(o, mode, pid) {
    if (mode === 'orig') return { value: o.value };
    var kg = baseQty(o); if (!kg) return { value: null, reason: 'no_unit' };
    var ym = String(o.observationDate || '').slice(0, 7);
    return window.DIUnits.convert(o.value, { cur: o.currency, kg: kg }, ym, mode === 'idx' ? 'eur' : mode, perFor(pid));
  }
  function origTxt(o) {
    var v = o.value, d = Math.abs(v) < 10 ? (o.unit === 'litro' ? 3 : 2) : (Math.abs(v) < 100 ? 2 : 2);
    var s = nf(v, Math.abs(v) >= 100 ? 0 : d, d);
    return s + ' ' + (isIdx(o) ? '' : o.currency + '/') + (UL[o.unit] || o.unit);
  }
  function normTxt(v, mode, pid) { var d = (pid === 'diesel') ? 3 : (v < 10 ? 2 : 1); return nf(v, d) + ' ' + normLabel(mode, pid); }

  /* ---------- estado ---------- */
  var META = null, ST = { p: 'trigo', u: 'eur', r: '1y', i: null, sdEnt: null }, CTX = null, OPTS = null, BLK = {}, IO = null;

  function ready() {
    if (ready.p) return ready.p;
    return ready.p = J('product-metadata.json').then(function (m) { META = m; return m; }).then(function (m) {
      // la identidad del instrumento es un complemento: si no carga, la ficha sigue funcionando (sin las lineas de identidad)
      return (window.DIIdentity ? window.DIIdentity.ready().then(function () { return m; }, function () { return m; }) : m);
    }).catch(function (e) { ready.p = null; throw e; });
  }
  function ID(o) { return window.DIIdentity && o ? window.DIIdentity.get(o.id) : null; }
  function idLine(o) { var e = ID(o); return e ? window.DIIdentity.line(e, LANGS[li()]) : ''; }
  function idHtml(o) { var s = idLine(o); return s ? '<div class="pt-ident" title="' + esc(t('identity')) + '">' + esc(s) + '</div>' : ''; }
  function has(pid) { return !!(META && META.products[pid]); }

  /* ---------- carga de la cabecera ---------- */
  function regionsFor(pid) {
    var set = {}, m = META.products[pid];
    (m.instruments || []).concat(m.indices || []).forEach(function (i) { set[i.region] = 1; });
    (m.related || []).forEach(function (r) {
      var rid = r.product === 'harina_soja' ? 'soja' : r.product, rm = META.products[rid];
      if (rm) (rm.instruments || []).forEach(function (i) { set[i.region] = 1; }); else { set.eu = 1; set.us = 1; }
    });
    // productos que usan este como insumo no necesitan precio: solo enlace
    return Object.keys(set);
  }
  function load(pid) {
    var m = META.products[pid], regs = regionsFor(pid);
    return Promise.all([window.DIPrices.latest(regs), window.DIFreshness.ready(), J('fx-history.json').catch(function () { return null; }), J('products/' + pid + '.json').catch(function () { return null; }), (window.DICite ? window.DICite.load() : Promise.resolve(null))]).then(function (a) {
      window.DIUnits.setFx(a[2]);
      var by = {}; a[0].forEach(function (o) { by[o.region + '/' + o.product] = o; });
      var inst = [], idxs = [];
      (m.instruments || []).forEach(function (i) { var o = by[i.region + '/' + i.product]; if (o && typeof o.value === 'number' && o.status !== 'pending') inst.push(o); });
      (m.indices || []).forEach(function (i) { var o = by[i.region + '/' + i.product]; if (o && typeof o.value === 'number') idxs.push(o); });
      return { pid: pid, meta: m, by: by, inst: inst, idx: idxs, prof: a[3], fx: a[2], hist: {}, regions: regs };
    });
  }
  function fresh(o) {
    try { var r = window.DIFreshness.evaluate(o.observationDate, o.frequency, o.sourceId); return r; } catch (e) { return { state: 'PENDING' }; }
  }
  function badge(cls, txt, title) { return '<span class="pt-badge ' + cls + '"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + esc(txt) + '</span>'; }
  function freshBadge(o) { var f = fresh(o); return window.DIFreshness.dot(f, LANGS[li()], { obs: o.observationDate, freq: o.frequency, focus: true }); }
  function compBadge(o) { var c = o.comparability || 'directional'; return badge('pt-cp-' + c, t('cp_' + c)); }
  function spark(vals) {
    if (!vals || vals.length < 3) return '';
    var mn = Infinity, mx = -Infinity, i; for (i = 0; i < vals.length; i++) { if (vals[i] < mn) mn = vals[i]; if (vals[i] > mx) mx = vals[i]; }
    if (mx === mn) return '';
    var d = '', W = 200, H = 28;
    for (i = 0; i < vals.length; i++) d += (i ? 'L' : 'M') + (i / (vals.length - 1) * W).toFixed(1) + ' ' + (H - 2 - (vals[i] - mn) / (mx - mn) * (H - 4)).toFixed(1) + ' ';
    return '<svg class="pt-spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>';
  }
  function obsKey(o) { return o.product + '/' + o.region; }

  /* ---------- cabecera ---------- */
  function ci(id, o) { return window.DICite && id ? window.DICite.html(id, o || {}) : ''; }
  function cardHtml(o, isIndex) {
    var f = fresh(o), meas = o.methodology ? '<details style="margin-top:6px"><summary class="pt-sub" style="cursor:pointer">' + esc(t('measures')) + '</summary><div class="pt-sub">' + esc(o.methodology) + '</div></details>' : '';
    return '<div class="di-card pt-card"><div class="pt-k">' + esc(reg(o.region)) + (isIndex ? ' · ' + esc(UL.index_2020_100) : '') + '</div>' + idHtml(o) +
      '<div class="pt-v">' + (isIndex ? esc(nf(o.value, 1)) + ' <small>2020 = 100</small>' : esc(nf(o.value, Math.abs(o.value) >= 100 ? 0 : 2, o.unit === 'litro' ? 3 : 2)) + ' <small>' + esc(o.currency + '/' + (UL[o.unit] || o.unit)) + '</small>') + '</div>' +
      '<div class="pt-sub">' + esc(t('asOf')) + ' ' + esc(dstr(o.observationDate)) + (typeof o.changePct === 'number' ? ' · ' + chg(o.changePct) + ' ' + esc(t('vsPrev')) : '') + '</div>' +
      '<div>' + freshBadge(o) + (isIndex ? '' : compBadge(o)) + '</div>' +
      (ci(o.sourceId, { period: o.observationDate, pub: o.publicationDate }) || '<div class="pt-sub">' + esc(t('source')) + ': ' + esc(srcName(o.sourceId)) + '</div>') + (isIndex ? '' : spark(o.spark)) + meas + '</div>';
  }
  function followKeys() { return CTX.inst.map(obsKey); }
  function isFollowing() { var W = window.DIWatch; if (!W || !W.has) return false; return followKeys().some(function (k) { return W.has('P', k); }); }
  function followHtml() {
    var W = window.DIWatch; if (!W) return '';
    var on = isFollowing();
    var h = '<div class="pt-bar-ctl"><button type="button" class="pt-chip' + (on ? ' on' : '') + '" data-follow="1" aria-pressed="' + on + '">' + esc(on ? t('following') : t('follow')) + '</button></div>';
    if (on && W.editor) {
      h += '<div class="pt-follow">' + CTX.inst.map(function (o) { return '<div style="margin:0 0 10px"><strong style="font-size:13px">' + esc(reg(o.region)) + '</strong>' + W.editor('P', obsKey(o), LANGS[li()]) + '</div>'; }).join('') + '</div>';
    } else h += '<div class="pt-src" style="margin-top:0">' + esc(t('followHint')) + '</div>';
    if (on) h += '<p class="pt-src"><a href="mi-seguimiento.html">' + esc(t('myWatch')) + ' →</a></p>';
    return h;
  }
  function headHtml() {
    if (!CTX.inst.length && !CTX.idx.length) return '<div class="pt-note">' + esc(t('noPrice')) + '</div>';
    return '<div class="pt-cards">' + CTX.inst.map(function (o) { return cardHtml(o, false); }).join('') + CTX.idx.map(function (o) { return cardHtml(o, true); }).join('') + '</div>' +
      '<div id="pt-follow">' + followHtml() + '</div>' + srcLine(CTX.inst.concat(CTX.idx).map(function (o) { return o.sourceId; }));
  }
  function srcLine(ids, extra) {
    var seen = {}, out = [];
    ids.forEach(function (id) { if (id && !seen[id]) { seen[id] = 1; out.push(SRCURL[id] ? '<a href="' + SRCURL[id] + '" rel="noopener">' + esc(srcName(id)) + '</a>' : esc(srcName(id))); } });
    return '<p class="pt-src">' + (out.length ? esc(t('source')) + ': ' + out.join(' · ') + ' · ' : '') + (extra ? esc(extra) + ' · ' : '') + '<a href="metodologia.html">' + esc(t('methLink')) + '</a></p>';
  }

  /* ---------- historico (compartido por comparacion, grafico y factores) ---------- */
  function loadHist() {
    var need = CTX.inst.filter(function (o) { return !CTX.hist[obsKey(o)]; });
    return Promise.all(need.map(function (o) {
      return window.DIPrices.history(o.region, o.product).then(function (d) {
        CTX.hist[obsKey(o)] = (d.history || []).map(function (h) { var ts = window.DehesaChart.histTs(h); return { ts: ts, v: h.value }; }).filter(function (x) { return isFinite(x.ts) && typeof x.v === 'number'; }).sort(function (a, b) { return a.ts - b.ts; });
      }, function () { CTX.hist[obsKey(o)] = []; });
    }));
  }
  var RANGE_M = { '6m': 6, '1y': 12, '3y': 36, '5y': 60, max: 0 };
  function ymOf(ts) { return new Date(ts).toISOString().slice(0, 7); }
  function cutRange(rows, endTs) { var m = RANGE_M[ST.r]; if (!m) return rows; var from = endTs - m * 30.4375 * 86400000; return rows.filter(function (x) { return x.ts >= from; }); }
  // series del grafico segun la unidad elegida: [{o, name, pts:[{x,y}]}], base comun para el indice
  function chartSeries() {
    var mode = ST.u, list = CTX.inst.slice(), notes = [], out = [], endTs = 0;
    list.forEach(function (o) { var h = CTX.hist[obsKey(o)]; if (h && h.length && h[h.length - 1].ts > endTs) endTs = h[h.length - 1].ts; });
    if (mode === 'orig') {
      var sel = null; list.forEach(function (o) { if (o.region === ST.i) sel = o; }); sel = sel || list[0];
      list = sel ? [sel] : [];
    } else {
      var comp = list.filter(function (o) { return o.comparability !== 'not_comparable'; });
      if (comp.length >= 1 && comp.length < list.length) { list.forEach(function (o) { if (comp.indexOf(o) < 0) notes.push(reg(o.region)); }); list = comp; }
    }
    var baseTs = 0;
    list.forEach(function (o) {
      var rows = cutRange(CTX.hist[obsKey(o)] || [], endTs), pts = [], conv;
      if (!rows.length) { notes.push(reg(o.region)); return; }
      if (mode === 'idx') { out.push({ o: o, rows: rows }); if (rows[0].ts > baseTs) baseTs = rows[0].ts; return; }
      rows.forEach(function (r) {
        if (mode === 'orig') { pts.push({ x: r.ts, y: r.v }); return; }
        conv = window.DIUnits.convert(r.v, { cur: o.currency, kg: baseQty(o) || 0 }, ymOf(r.ts), mode, perFor(CTX.pid));
        if (conv.value !== null && conv.value !== undefined) pts.push({ x: r.ts, y: conv.value });
      });
      if (pts.length) out.push({ o: o, pts: pts }); else notes.push(reg(o.region));
    });
    if (mode === 'idx') {
      var fin = [];
      out.forEach(function (s) {
        var base = null, k; for (k = 0; k < s.rows.length; k++) { if (s.rows[k].ts <= baseTs) base = s.rows[k]; else break; }
        if (!base) base = s.rows[0];
        if (!base || !(base.v > 0)) { notes.push(reg(s.o.region)); return; }
        fin.push({ o: s.o, pts: s.rows.filter(function (r) { return r.ts >= base.ts; }).map(function (r) { return { x: r.ts, y: r.v / base.v * 100 }; }) });
      });
      out = fin;
    }
    return { series: out, excluded: notes, baseTs: baseTs, endTs: endTs };
  }
  var COLORS = ['#a9491f', '#2a6f97', '#4f7a2f', '#7a5aa6', '#8a6d00'];
  function chartHtml() {
    var cs = chartSeries(), mode = ST.u;
    if (!cs.series.length) return '<div class="pt-note">' + esc(t('r_no_hist')) + '</div>';
    var DC = window.DehesaChart, unitT = mode === 'orig' ? cs.series[0].o.currency + '/' + (UL[cs.series[0].o.unit] || cs.series[0].o.unit) : normLabel(mode, CTX.pid);
    var S = cs.series.map(function (s, i) {
      return { name: reg(s.o.region), color: COLORS[i % COLORS.length], pts: s.pts.map(function (p) { return { x: p.x, y: p.y, l: DC.fmtDateFull(p.x) }; }) };
    });
    var h = DC.render({ series: S, xMode: 'time', yTitle: unitT, xTitle: t('cDate'), aria: nm(CTX.pid) + ' · ' + unitT, legend: S.length > 1, vFmt: function (v) { return nf(v, mode === 'idx' ? 1 : (CTX.pid === 'diesel' ? 3 : 2)) + (mode === 'idx' ? '' : ' ' + unitT); }, zero: false });
    if (cs.excluded.length) h += '<p class="pt-src">' + esc(tf('excluded', cs.excluded.join(', '))) + '</p>';
    if (mode === 'idx' && cs.baseTs) h += '<p class="pt-src">' + esc(tf('idxNote', dstr(new Date(cs.baseTs).toISOString().slice(0, 10)))) + '</p>';
    return h;
  }
  function unitChips() {
    var modes = [['orig', t('orig')], ['eur', normLabel('eur', CTX.pid)], ['usd', normLabel('usd', CTX.pid)], ['idx', t('idx')]];
    return '<div class="pt-bar-ctl" role="radiogroup" aria-label="' + esc(t('unit')) + '"><span class="pt-lbl">' + esc(t('unit')) + '</span>' + modes.map(function (m) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (ST.u === m[0]) + '" data-u="' + m[0] + '">' + esc(m[1]) + '</button>'; }).join('') + '</div>';
  }
  function rangeChips() {
    return '<div class="pt-bar-ctl" role="radiogroup" aria-label="' + esc(t('range')) + '"><span class="pt-lbl">' + esc(t('range')) + '</span>' + ['6m', '1y', '3y', '5y', 'max'].map(function (r) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (ST.r === r) + '" data-r="' + r + '">' + esc(t(r === '6m' ? 'm6' : r === '1y' ? 'y1' : r === '3y' ? 'y3' : r === '5y' ? 'y5' : 'max')) + '</button>'; }).join('') + '</div>';
  }
  function instChips() {
    if (ST.u !== 'orig' || CTX.inst.length < 2) return '';
    var cur = ST.i; if (!cur || !CTX.inst.some(function (o) { return o.region === cur; })) cur = CTX.inst[0].region;
    return '<div class="pt-bar-ctl" role="radiogroup" aria-label="' + esc(t('series')) + '"><span class="pt-lbl">' + esc(t('series')) + '</span>' + CTX.inst.map(function (o) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (cur === o.region) + '" data-i="' + o.region + '" title="' + esc(idLine(o)) + '">' + esc(reg(o.region)) + '</button>'; }).join('') + '</div>';
  }

  /* ---------- bloques ---------- */
  function blkChanged() {
    return Promise.all([J('daily-brief.json', { cache: 'no-cache' }).catch(function () { return null; }), J('revisions.json', { cache: 'no-cache' }).catch(function () { return null; })]).then(function (a) { return { brief: a[0], revs: a[1] }; });
  }
  function htmlChanged(d) {
    var keys = {}, ids = {}; CTX.inst.concat(CTX.idx).forEach(function (o) { keys['P/' + obsKey(o)] = o; ids[o.id] = o; });
    var inB = [];
    if (d.brief) ['movers', 'newData'].forEach(function (L) { (d.brief[L] || []).forEach(function (x) { if (keys[x.k] && !inB.some(function (y) { return y.k === x.k; })) inB.push(x); }); });
    var h = '<h3 style="font-size:14px;margin:6px 0">' + esc(t('inBrief')) + (d.brief ? ' <span class="pt-src" style="margin:0">(' + esc(dstr(String(d.brief.generatedAt).slice(0, 10))) + ')</span>' : '') + '</h3>';
    h += inB.length ? '<ul class="pt-list">' + inB.map(function (x) { return '<li><strong>' + esc(reg(keys[x.k].region)) + '</strong> · ' + esc(t('newPoint')) + ' ' + esc(dstr(x.period)) + ': ' + esc(nf(x.value, 2)) + ' ' + esc(x.unit || '') + ' · ' + chg(x.changePct) + '</li>'; }).join('') + '</ul>' : '<p class="pt-sub">' + esc(t('noBrief')) + '</p>';
    h += '<h3 style="font-size:14px;margin:12px 0 6px">' + esc(t('lastObs')) + '</h3><div class="pt-tblwrap"><table class="pt-table rs"><thead><tr><th>' + esc(t('cMarket')) + '</th><th>' + esc(t('cDate')) + '</th><th class="r">' + esc(t('cOrig')) + '</th><th class="r">' + esc(t('vsPrev')) + '</th><th>' + esc(t('cFresh')) + '</th></tr></thead><tbody>' +
      CTX.inst.concat(CTX.idx).map(function (o) { return '<tr><td data-l="' + esc(t('cMarket')) + '">' + esc(reg(o.region)) + (isIdx(o) ? ' · ' + esc(UL.index_2020_100) : '') + '</td><td data-l="' + esc(t('cDate')) + '">' + esc(dstr(o.observationDate)) + '</td><td class="r" data-l="' + esc(t('cOrig')) + '">' + esc(isIdx(o) ? nf(o.value, 1) : origTxt(o)) + '</td><td class="r" data-l="' + esc(t('vsPrev')) + '">' + chg(o.changePct) + '</td><td data-l="' + esc(t('cFresh')) + '">' + freshBadge(o) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var revs = d.revs && d.revs.revisions ? d.revs.revisions.filter(function (r) { return ids[r.series] && String(r.detectedAt || '') >= new Date(Date.now() - 30 * 86400000).toISOString(); }) : [];
    h += '<h3 style="font-size:14px;margin:12px 0 6px">' + esc(t('revs')) + '</h3>' + (revs.length ? '<ul class="pt-list">' + revs.map(function (r) { return '<li>' + esc(r.label || r.series) + ' · ' + esc(dstr(r.period)) + ': ' + esc(nf(r.old, 2)) + ' → ' + esc(nf(r.new, 2)) + (typeof r.pct === 'number' ? ' (' + chgTxt(r.pct) + ')' : '') + '</li>'; }).join('') + '</ul>' : '<p class="pt-sub">' + esc(t('noRevs')) + '</p>');
    return h + srcLine(CTX.inst.concat(CTX.idx).map(function (o) { return o.sourceId; }), 'Daily Brief');
  }

  function loadCompare() { return loadHist(); }
  function indexNow() { // indice 100 por serie (ultimo valor vs inicio comun del periodo) desde el historico cargado
    var cs; var save = ST.u; ST.u = 'idx'; cs = chartSeries(); ST.u = save;
    var m = {}; cs.series.forEach(function (s) { if (s.pts.length) m[obsKey(s.o)] = s.pts[s.pts.length - 1].y; });
    return { vals: m, baseTs: cs.baseTs };
  }
  // Diferencias de precio SOLO entre instrumentos de la misma forma; nunca entre formas distintas (harina frente a grano). Si el instrumento no es identico, se enumera lo que difiere.
  function spreadNotes(comp) {
    var I = window.DIIdentity, L = LANGS[li()], by = {}, out = '', keys = [];
    comp.forEach(function (c) { var e = ID(c.o), k = e ? e.concept + '|' + e.form : '_'; if (!by[k]) { by[k] = []; keys.push(k); } by[k].push(c); });
    keys.forEach(function (k) {
      var g = by[k]; if (g.length < 2) return;
      g.sort(function (a, b) { return a.v - b.v; });
      var lo = g[0], hi = g[g.length - 1], cmp = I && ID(lo.o) && ID(hi.o) ? I.compare(ID(hi.o), ID(lo.o), L) : { level: 'qualified', diffs: [] }, pc = nf((hi.v / lo.v - 1) * 100, 1);
      if (cmp.level === 'same') out += '<div class="pt-note">' + esc(tf('spread', reg(hi.o.region), pc, reg(lo.o.region))) + '</div>';
      else out += '<div class="pt-note">' + esc(tf('spreadQ', idLine(hi.o) || reg(hi.o.region), pc, idLine(lo.o) || reg(lo.o.region), cmp.diffs.length ? cmp.diffs.map(function (d) { return d.label; }).join(', ') : t('identity').split(':')[0])) + '</div>';
    });
    if (keys.length > 1 && I) {
      // grupos de concepto/forma distintos: nunca se restan entre si
      var reps = keys.map(function (k) { return by[k][0]; }), nm = function (c) { var p = ID(c.o) ? I.parts(ID(c.o), L) : null; return p ? p.product + (p.grade ? ' ' + p.grade : '') : reg(c.o.region); }, dl = {};
      for (var a = 0; a < reps.length; a++) for (var b = a + 1; b < reps.length; b++) if (ID(reps[a].o) && ID(reps[b].o)) I.compare(ID(reps[a].o), ID(reps[b].o), L).diffs.forEach(function (d) { dl[d.label] = 1; });
      out += '<div class="pt-note">' + esc(tf('noSpread', reps.slice(0, -1).map(nm).join(', '), nm(reps[reps.length - 1]), Object.keys(dl).join(', '))) + '</div>';
    }
    return out;
  }
  function htmlCompare() {
    var mode = ST.u === 'orig' ? 'eur' : ST.u, ix = mode === 'idx' ? indexNow() : null, rows = [], comp = [];
    CTX.inst.forEach(function (o) {
      var r, txt, why = '';
      if (mode === 'idx') { var v = ix.vals[obsKey(o)]; if (typeof v === 'number') txt = nf(v, 1); else { txt = '—'; why = o.comparability === 'not_comparable' && CTX.inst.length > 1 ? t('r_not_comp') : t('r_no_hist'); } }
      else { r = convObs(o, mode, CTX.pid); if (r.value !== null && r.value !== undefined) { txt = normTxt(r.value, mode, CTX.pid); if (o.comparability !== 'not_comparable') comp.push({ o: o, v: r.value }); } else { txt = '—'; why = t('r_' + r.reason); } }
      rows.push('<tr><td data-l="' + esc(t('cMarket')) + '"><strong>' + esc(reg(o.region)) + '</strong>' + idHtml(o) + '</td><td class="r" data-l="' + esc(t('cOrig')) + '">' + esc(origTxt(o)) + '</td><td class="r" data-l="' + esc(t('cNorm')) + '">' + esc(txt) + (why ? '<div class="pt-sub">' + esc(why) + '</div>' : '') + '</td><td data-l="' + esc(t('cDate')) + '">' + esc(dstr(o.observationDate)) + '</td><td data-l="' + esc(t('cFresh')) + '">' + freshBadge(o) + '</td><td data-l="' + esc(t('cSrc')) + '">' + esc(srcName(o.sourceId)) + '</td><td data-l="' + esc(t('cComp')) + '">' + compBadge(o) + '</td></tr>');
    });
    var h = unitChips() + '<div class="pt-tblwrap"><table class="pt-table rs"><thead><tr><th>' + esc(t('cMarket')) + '</th><th class="r">' + esc(t('cOrig')) + '</th><th class="r">' + esc(t('cNorm')) + ' (' + esc(normLabel(mode, CTX.pid)) + ')</th><th>' + esc(t('cDate')) + '</th><th>' + esc(t('cFresh')) + '</th><th>' + esc(t('cSrc')) + '</th><th>' + esc(t('cComp')) + '</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
    if (mode === 'idx' && ix.baseTs) h += '<p class="pt-src">' + esc(tf('idxNote', dstr(new Date(ix.baseTs).toISOString().slice(0, 10)))) + '</p>';
    if ((mode === 'eur' || mode === 'usd') && comp.length >= 2) {
      h += spreadNotes(comp);
    }
    h += '<p class="pt-src">' + esc(t('cpNote')) + '</p>';
    var cm = META.products[CTX.pid].compare;
    if (cm) h += '<p class="pt-src"><a href="comparador.html?p=' + encodeURIComponent(CTX.pid) + '&u=' + (ST.u === 'orig' ? 'orig' : ST.u) + '">' + esc(t('fullCmp')) + ' →</a></p>';
    return h + srcLine(CTX.inst.map(function (o) { return o.sourceId; }), t('fxNote'));
  }
  function htmlHist() {
    return unitChips() + rangeChips() + instChips() + '<div id="pt-chart">' + chartHtml() + '</div>' + srcLine(CTX.inst.map(function (o) { return o.sourceId; }), t('fxNote'));
  }

  function blkSd() { return Promise.resolve(CTX.prof); }
  function mt(v, unit) {
    var u = String(unit || '').replace(/^1000 MT\s*/, '');
    if (/^1000 MT/.test(String(unit))) return nf(v / 1000, Math.abs(v) >= 10000 ? 0 : 1) + ' Mt' + (u ? ' ' + u : '');
    return nf(v, 0) + ' ' + unit;
  }
  function htmlSd() {
    var sd = CTX.prof && CTX.prof.supplyDemand;
    if (!sd) return '<div class="pt-note">' + esc(t('noSd')) + '</div>';
    var ents = Object.keys(sd.entities), cur = ST.sdEnt && sd.entities[ST.sdEnt] ? ST.sdEnt : ents[0], yrs = Object.keys(sd.entities[cur]).sort(), my = sd.marketYear;
    var chips = '<div class="pt-bar-ctl" role="radiogroup" aria-label="' + esc(t('cMarket')) + '">' + ents.map(function (e) { return '<button type="button" class="pt-chip" role="radio" aria-checked="' + (e === cur) + '" data-sd="' + e + '">' + esc(t('ent' + e)) + '</button>'; }).join('') + '</div>';
    var A = ['production', 'imports', 'exports', 'consumption', 'endingStocks', 'stockToUse'], psdAll = /CWE/.test(sd.unit);
    function my2(y) { return (/^(cerdo|vacuno|pollo|leche)$/.test(sd.psd) || psdAll) ? String(y) : y + '/' + String((+y + 1) % 100 + 100).slice(1); }
    var head = '<tr><th>' + esc(t('attr')) + '</th>' + yrs.map(function (y) { return '<th class="r">' + esc(my2(y)) + (+y === my ? ' <span class="pt-sub">(' + esc(t('forecast')) + ')</span>' : '') + '</th>'; }).join('') + '<th class="r">' + esc(t('vsPY')) + '</th></tr>';
    var body = A.map(function (a) {
      var vals = yrs.map(function (y) { return sd.entities[cur][y][a]; });
      if (vals.every(function (v) { return v === undefined; })) return '';
      var last = vals[vals.length - 1], prev = vals[vals.length - 2], d = '—';
      if (typeof last === 'number' && typeof prev === 'number') d = a === 'stockToUse' ? '<span class="' + (last > prev ? 'pt-up' : last < prev ? 'pt-down' : 'pt-flat') + '">' + sg(last - prev, 1) + ' pp</span>' : (prev ? chg((last - prev) / Math.abs(prev) * 100) : '—');
      return '<tr><td data-l="' + esc(t('attr')) + '">' + esc(t(a)) + '</td>' + vals.map(function (v, i) { return '<td class="r" data-l="' + esc(my2(yrs[i])) + '">' + (typeof v === 'number' ? esc(a === 'stockToUse' ? nf(v, 1) + ' %' : mt(v, sd.unit)) : '—') + '</td>'; }).join('') + '<td class="r" data-l="' + esc(t('vsPY')) + '">' + d + '</td></tr>';
    }).join('');
    return chips + '<div class="pt-tblwrap"><table class="pt-table rs"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div><p class="pt-src">' + esc(sd.note) + ' ' + esc(t('source')) + ': ' + esc(srcName(sd.sourceId)) + ' · ' + esc(sd.publishedMonth || '') + ' · <a href="oferta-demanda.html">' + esc(t('sd')) + ' →</a></p>' + ci(sd.sourceId, { period: sd.publishedMonth });
  }

  function bars(list, cls) {
    var mx = 0; list.forEach(function (x) { if (x.share > mx) mx = x.share; });
    return '<div class="pt-bars">' + list.map(function (x) { return '<div class="pt-row"><span class="n" title="' + esc(x.name) + '">' + esc(cname(x.name)) + '</span><span><i style="width:' + (mx ? x.share / mx * 100 : 0).toFixed(1) + '%"></i></span><span>' + esc(nf(x.share, 1)) + ' %</span></div>'; }).join('') + '</div>';
  }
  function concHtml(f) {
    var c = f.hhiLowerBound >= 2500 ? t('hhiHigh') : f.hhiLowerBound >= 1500 ? t('hhiMod') : t('hhiLow');
    return '<p class="pt-sub">' + esc(tf('coverage', nf(f.coveredShare, 1), '', nf(f.top3Share, 1))) + '<br>' + esc(tf('hhi', nf(f.hhiLowerBound, 0), c)) + '</p>';
  }
  function htmlTrade() {
    var tr = CTX.prof && CTX.prof.trade;
    if (!tr) return '<div class="pt-note">' + esc(t('noTrade')) + '</div>';
    var h = '<div class="pt-two">';
    [['exports', 'exporters'], ['imports', 'importers']].forEach(function (p) {
      var f = tr[p[0]]; if (!f) return;
      h += '<div class="di-card pt-card"><div class="pt-k">' + esc(t(p[1])) + ' · ' + esc(mt(f.world, tr.unit)) + '</div>' + bars(f.top) + concHtml(f) + '</div>';
    });
    return h + '</div><p class="pt-src">' + esc(tr.note) + ' ' + esc(t('source')) + ': ' + esc(srcName(tr.sourceId)) + ' · ' + esc(tr.publishedMonth || '') + '</p>' + ci(tr.sourceId, { period: tr.publishedMonth });
  }

  function htmlTariffs() {
    var tf0 = CTX.prof && CTX.prof.tariffs;
    if (!tf0) return '<div class="pt-note">' + esc(t('noTariffs')) + '</div>';
    var h = '';
    tf0.headings.forEach(function (hd) {
      h += '<h3 style="font-size:14px;margin:10px 0 6px">HS ' + esc(hd.hs) + (hd.desc ? ' · ' + esc(hd.desc) : '') + '</h3><div class="pt-tblwrap"><table class="pt-table rs"><thead><tr><th>' + esc(t('cMarket')) + '</th><th class="r">' + esc(t('lines')) + '</th><th class="r">' + esc(t('free')) + '</th><th class="r">' + esc(t('advalorem')) + '</th><th class="r">' + esc(t('specific')) + '</th><th class="r">' + esc(t('trq')) + '</th><th>' + esc(t('examples')) + '</th></tr></thead><tbody>';
      ['US', 'EU', 'CA', 'MX'].forEach(function (mk) {
        var m = hd.markets[mk];
        if (!m) { h += '<tr><td data-l="' + esc(t('cMarket')) + '"><strong>' + mk + '</strong></td><td colspan="6" class="pt-sub">' + esc(t('noHeading')) + '</td></tr>'; return; }
        h += '<tr><td data-l="' + esc(t('cMarket')) + '"><strong>' + mk + '</strong></td><td class="r" data-l="' + esc(t('lines')) + '">' + m.n + '</td><td class="r" data-l="' + esc(t('free')) + '">' + m.free + '</td><td class="r" data-l="' + esc(t('advalorem')) + '">' + (m.avgAdv === null || m.avgAdv === undefined ? '—' : nf(m.avgAdv, 1) + ' % / ' + nf(m.maxAdv, 1) + ' %') + '</td><td class="r" data-l="' + esc(t('specific')) + '">' + m.spec + '</td><td class="r" data-l="' + esc(t('trq')) + '">' + m.trq + '</td><td data-l="' + esc(t('examples')) + '">' + (m.lines || []).slice(0, 2).map(function (l) { return '<div class="pt-sub"><strong>' + esc(l.h) + '</strong> ' + esc(l.g) + '</div>'; }).join('') + '</td></tr>';
      });
      h += '</tbody></table></div>';
    });
    var srcs = tf0.sources || {}, rel = Object.keys(srcs).map(function (k) { return k + ': ' + srcName(srcs[k].sourceId) + (srcs[k].release ? ' (' + srcs[k].release + ')' : ''); });
    return h + '<p class="pt-src">' + esc(tf0.note) + '</p><p class="pt-src">' + esc(t('source')) + ': ' + esc(rel.join(' · ')) + ' · <a href="aranceles.html">' + esc(t('allTariffs')) + ' →</a></p>';
  }

  function relObs(pid) { // ultimos precios del producto relacionado en las regiones cargadas
    var rid = pid === 'harina_soja' ? 'soja' : pid, out = [];
    Object.keys(CTX.by).forEach(function (k) { var o = CTX.by[k]; if (o.product === pid && typeof o.value === 'number' && !isIdx(o)) out.push(o); });
    return { rid: rid, obs: out };
  }
  function htmlCosts() {
    var m = CTX.meta, rel = m.related || [], used = [];
    Object.keys(META.products).forEach(function (k) { (META.products[k].related || []).forEach(function (r) { if (r.product === CTX.pid && k !== CTX.pid) used.push(k); }); });
    if (!rel.length && !used.length) return '<div class="pt-note">' + esc(t('noCosts')) + '</div>';
    var h = '';
    if (rel.length) {
      h += '<div class="pt-tblwrap"><table class="pt-table rs"><thead><tr><th>' + esc(t('costs')) + '</th><th>' + esc(t('cMarket')) + '</th><th class="r">' + esc(t('cOrig')) + '</th><th>' + esc(t('cDate')) + '</th><th class="r">' + esc(t('vsPrev')) + '</th><th>' + esc(t('cFresh')) + '</th></tr></thead><tbody>';
      rel.forEach(function (r) {
        var ro = relObs(r.product), nameH = (has(ro.rid) ? '<a href="producto.html?p=' + ro.rid + '"><strong>' + esc(nm(ro.rid)) + '</strong></a>' : '<strong>' + esc(nm(r.product)) + '</strong>') + '<div class="pt-sub">' + esc(t('why_' + r.why)) + '</div>';
        if (!ro.obs.length) h += '<tr><td data-l="' + esc(t('costs')) + '">' + nameH + '</td><td colspan="5" class="pt-sub">' + esc(t('noPrice')) + '</td></tr>';
        ro.obs.forEach(function (o, i) { h += '<tr><td data-l="' + esc(t('costs')) + '">' + (i ? '' : nameH) + '</td><td data-l="' + esc(t('cMarket')) + '">' + esc(reg(o.region)) + '</td><td class="r" data-l="' + esc(t('cOrig')) + '">' + esc(origTxt(o)) + '</td><td data-l="' + esc(t('cDate')) + '">' + esc(dstr(o.observationDate)) + '</td><td class="r" data-l="' + esc(t('vsPrev')) + '">' + chg(o.changePct) + '</td><td data-l="' + esc(t('cFresh')) + '">' + freshBadge(o) + '</td></tr>'; });
      });
      h += '</tbody></table></div>';
    }
    if (used.length) h += '<p class="pt-sub">' + esc(t('usedBy')) + ': ' + used.map(function (k) { return '<a href="producto.html?p=' + k + '">' + esc(nm(k)) + '</a>'; }).join(' · ') + '</p>';
    if (/^(trigo|maiz|cebada|avena|arroz|soja|colza)$/.test(CTX.pid)) h += '<p class="pt-src"><a href="calculadora.html?crop=' + CTX.pid + '">' + esc(t('calcLink')) + ' →</a></p>';
    return h + '<p class="pt-src">' + esc(t('costsNote')) + ' <a href="precios.html">' + esc(t('drivers')) + ' →</a></p>' + srcLine(rel.reduce(function (a, r) { return a.concat(relObs(r.product).obs.map(function (o) { return o.sourceId; })); }, []));
  }

  /* Relaciones observadas (data/relationships.json): solo las que tocan a este producto (como insumo o como mercado). Descriptivo; se carga al llegar al bloque. */
  function loadRels() { return J('relationships.json'); }
  var RST = { OBSERVED_RELATIONSHIP: ['Relación observada', 'Observed relationship', 'Relation observée', 'Relazione osservata'], WEAK_OR_UNSTABLE: ['Débil o inestable', 'Weak or unstable', 'Faible ou instable', 'Debole o instabile'], INSUFFICIENT_DATA: ['Datos insuficientes', 'Insufficient data', 'Données insuffisantes', 'Dati insufficienti'] },
    RCF = { HIGH: ['alta', 'high', 'élevée', 'alta'], MEDIUM: ['media', 'medium', 'moyenne', 'media'], LOW: ['baja', 'low', 'faible', 'bassa'] };
  function htmlRels(doc) {
    var m = CTX.meta, ids = {}, lg = LANGS[li()];
    ids[CTX.pid] = 1; if (CTX.pid === 'soja') ids.harina_soja = 1; if (CTX.pid === 'vacuno') ids.vaca = 1;
    (m.instruments || []).concat(m.indices || []).forEach(function (x) { ids[x.product] = 1; });
    var list = (doc.relationships || []).filter(function (r) { return ids[r.input.product] || ids[r.market.product]; });
    if (!list.length) return '<div class="pt-note">' + esc(t('relsNone')) + '</div>';
    var h = '<div class="pt-note">' + esc(t('relsDisc')) + '</div><div class="pt-tblwrap"><table class="pt-table rs"><thead><tr><th>' + esc(t('relsPair')) + '</th><th>' + esc(t('relsSt')) + '</th><th class="r">r</th><th>' + esc(t('relsLagH')) + '</th><th class="r">n</th><th>' + esc(t('cDate')) + '</th><th>' + esc(t('relsConf')) + '</th><th></th></tr></thead><tbody>';
    list.slice(0, 8).forEach(function (r) {
      var s = r.stat, rg = function (x) { return reg(x.region); };
      h += '<tr><td data-l="' + esc(t('relsPair')) + '"><strong>' + esc(r.input.label[lg]) + '</strong> <span class="pt-sub">' + esc(rg(r.input)) + '</span><div class="pt-sub">→ ' + esc(r.market.label[lg]) + ' ' + esc(rg(r.market)) + '</div></td>' +
        '<td data-l="' + esc(t('relsSt')) + '"><span class="pt-badge">' + esc((RST[r.status] || [r.status.replace(/_/g, ' ')])[li()] || r.status) + '</span></td>' +
        '<td class="r" data-l="r">' + (s.correlation === null ? '—' : nf(s.correlation, 2)) + '</td><td data-l="lag">' + esc(s.lag === 0 ? t('relsLag0') : tf('relsLag', s.lag + (r.frequency === 'monthly' ? 'm' : 'T'))) + '</td><td class="r" data-l="n">' + s.n + '</td>' +
        '<td data-l="' + esc(t('cDate')) + '">' + esc(s.periodStart + '–' + s.periodEnd) + '</td><td data-l="' + esc(t('relsConf')) + '">' + esc((RCF[r.confidence] || [r.confidence])[li()] || r.confidence) + '</td><td><a href="relaciones.html?id=' + encodeURIComponent(r.id) + '">' + esc(t('relsDetail')) + ' →</a></td></tr>';
    });
    return h + '</tbody></table></div><p class="pt-src"><a href="relaciones.html?p=' + encodeURIComponent(CTX.pid) + '">' + esc(t('relsAll')) + ' →</a></p>';
  }

  function loadDrivers() { return loadHist(); }
  function htmlDrivers() {
    var items = [], prof = CTX.prof;
    CTX.inst.forEach(function (o) {
      if (o.comparability === 'not_comparable' && CTX.inst.length > 1) { /* sigue siendo un hecho propio de la serie */ }
      var h = CTX.hist[obsKey(o)] || []; if (h.length < 2) return;
      var last = h[h.length - 1], target = last.ts - 365.25 * 86400000, base = null, i;
      for (i = h.length - 1; i >= 0; i--) { if (h[i].ts <= target + 20 * 86400000) { base = h[i]; break; } }
      if (!base || !(base.v > 0) || last.ts - base.ts < 300 * 86400000) return;
      var dd = function (ts) { var iso = new Date(ts).toISOString().slice(0, 10); return /^(monthly|quarterly|annual)$/.test(o.frequency) ? dstr(iso.slice(0, 7)) : dstr(iso); };
      items.push(tf('d_price', reg(o.region), chgTxt((last.v / base.v - 1) * 100), dd(base.ts), dd(last.ts)));
    });
    var sd = prof && prof.supplyDemand;
    if (sd) ['US', 'EU'].forEach(function (e) {
      var ys = sd.entities[e] ? Object.keys(sd.entities[e]).sort() : []; if (ys.length < 2) return;
      var a = sd.entities[e][ys[ys.length - 2]], b = sd.entities[e][ys[ys.length - 1]];
      if (typeof a.stockToUse === 'number' && typeof b.stockToUse === 'number') items.push(tf('d_stu', t('ent' + e), nf(a.stockToUse, 1), nf(b.stockToUse, 1), ys[ys.length - 2], ys[ys.length - 1]));
      if (typeof a.production === 'number' && typeof b.production === 'number' && a.production > 0) items.push(tf('d_prod', t('ent' + e), chgTxt((b.production / a.production - 1) * 100), ys[ys.length - 2], ys[ys.length - 1]));
    });
    (CTX.meta.related || []).forEach(function (r) {
      relObs(r.product).obs.forEach(function (o) { if (typeof o.changePct === 'number') items.push(tf('d_input', nm(r.product), reg(o.region), chgTxt(o.changePct), dstr(o.observationDate))); });
    });
    var tr = prof && prof.trade && prof.trade.exports;
    if (tr && tr.top && tr.top.length) items.push(tf('d_conc', cname(tr.top[0].name), nf(tr.top[0].share, 1)));
    CTX.inst.concat(CTX.idx).forEach(function (o) { var f = fresh(o); if (f.state === 'DELAYED' || f.state === 'STALE' || f.state === 'EXPECTED_DELAY') items.push(tf('d_late', reg(o.region), (window.DIFreshness.label[f.state] || {})[LANGS[li()]] || f.state, dstr(o.observationDate))); });
    if (!items.length) return '<div class="pt-note">' + esc(t('noDrivers')) + '</div>';
    return '<ul class="pt-list">' + items.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
  }

  var NEWSKEY = { vacuno: ['vaca', 'ganado', 'vacuno'], soja: ['soja', 'harina_soja'], fertilizantes: ['urea', 'fertilizantes', 'dap', 'potasa', 'fertilizante'], urea: ['urea', 'fertilizantes', 'fertilizante'], diesel: ['diesel', 'petroleo', 'energia'], leche: ['leche', 'lacteos'], oliva: ['oliva'], huevos: ['huevos'], cerdo: ['cerdo'] };
  function blkNews() { return window.DINews ? window.DINews.items() : Promise.resolve([]); }
  function htmlNews(items) {
    var keys = NEWSKEY[CTX.pid] || [CTX.pid], out = (items || []).filter(function (x) { return (x.products || []).some(function (p) { return keys.indexOf(p) > -1; }); }).sort(function (a, b) { return (b.relevance || 0) - (a.relevance || 0) || (a.date < b.date ? 1 : -1); }).slice(0, 6);
    if (!out.length) return '<div class="pt-note">' + esc(t('noNews')) + '</div>';
    return '<ul class="pt-list">' + out.map(function (x) { return '<li><a href="' + esc(x.url) + '" rel="noopener">' + esc(x.headline[LANGS[li()]] || x.headline.es) + '</a> <span class="pt-sub">· ' + esc(x.source) + ' · ' + esc(dstr(x.date)) + '</span></li>'; }).join('') + '</ul><p class="pt-src"><a href="noticias.html">' + esc(t('news')) + ' →</a></p>';
  }

  function htmlSources() {
    var ids = CTX.inst.concat(CTX.idx).map(function (o) { return o.sourceId; });
    if (CTX.prof && CTX.prof.supplyDemand) ids.push('usda_fas_psd');
    if (CTX.prof && CTX.prof.tariffs) Object.keys(CTX.prof.tariffs.sources || {}).forEach(function (k) { ids.push(CTX.prof.tariffs.sources[k].sourceId); });
    ids.push('ecb');
    var seen = {}, li2 = [];
    ids.forEach(function (id) { if (id && !seen[id]) { seen[id] = 1; li2.push('<li>' + (ci(id) || (SRCURL[id] ? '<a href="' + SRCURL[id] + '" rel="noopener">' + esc(srcName(id)) + '</a>' : esc(srcName(id)))) + '</li>'); } });
    return '<p class="pt-sub">' + esc(t('srcIntro')) + '</p><ul class="pt-list">' + li2.join('') + '</ul><p class="pt-src">' + esc(t('fxNote')) + ' <a href="metodologia.html">' + esc(t('methLink')) + ' →</a></p>';
  }


  var CBMAP = { trigo: 'wheat', maiz: 'corn', soja: 'soybeans' };
  function blkLocal() { return J('us-cash-bids/manifest.json'); }
  function htmlLocal(m) {
    var c = CBMAP[CTX.pid], st = (m && m.states) || {}, rows = [];
    Object.keys(st).forEach(function (k) { var e = st[k].commodities && st[k].commodities[c]; if (e) rows.push({ k: k, n: st[k].name, e: e }); });
    rows.sort(function (a, b) { return b.e.markets - a.e.markets || (a.n < b.n ? -1 : 1); });
    if (!rows.length) return '<div class="pt-note">' + esc(t('localNone')) + '</div>';
    var top = rows.slice(0, 8);
    return '<p class="pt-sub">' + esc(t('localIntro')) + '</p><div class="pt-cards">' + top.map(function (r) {
      return '<a class="pt-card" href="precios-locales.html?s=' + r.k + '&amp;c=' + c + '" style="text-decoration:none;color:inherit"><div class="pt-card-h"><strong>' + esc(r.n) + '</strong></div><div class="pt-sub">' + esc(tf('localMk', r.e.markets, dstr(r.e.latest))) + '</div>' + (r.e.classes && r.e.classes.length ? '<div class="pt-sub">' + esc(r.e.classes.join(' · ')) + '</div>' : '') + '</a>';
    }).join('') + '</div><p style="margin:10px 0 0"><a class="pt-chip on" href="precios-locales.html?c=' + c + '">' + esc(t('localCta')) + '</a></p><p class="pt-src">USDA AMS Market News · <a href="metodologia.html#precios-locales">' + esc(t('methLink')) + ' →</a></p>';
  }

  var PRMAP = { trigo: ['wheat-hrw', 'wheat-srw'], maiz: ['corn-yellow'], soja: ['soybeans'] };
  function blkPrem() { return J('premium-tracker.json'); }
  function htmlPrem(d) {
    var ids = PRMAP[CTX.pid] || [], cells = ((d && d.cells) || []).filter(function (c) { return ids.indexOf(c.id) >= 0 && c.premium != null; });
    if (!cells.length) return '<div class="pt-note">' + esc(t('premNone')) + '</div>';
    function usd(v) { return '$' + Number(v).toFixed(2); }
    return '<p class="pt-sub">' + esc(t('premIntro')) + '</p><div class="pt-cards">' + cells.map(function (c) {
      var lab = [c.class, c.grade].filter(Boolean).join(' · ');
      return '<div class="pt-card"><div class="pt-card-h"><strong>' + esc(lab) + '</strong></div><div class="pt-sub">' + esc(t('premOrg')) + ' ' + usd(c.organic.median) + '/bu · ' + esc(t('premConv')) + ' ' + usd(c.conventional.median) + '/bu</div><div><strong>' + esc(t('premDiff')) + ' ' + (c.premium >= 0 ? '+' : '') + usd(c.premium) + '/bu (' + (c.premiumPct >= 0 ? '+' : '') + String(c.premiumPct).replace('.', ',') + ' %)</strong></div><div class="pt-sub">' + esc(tf('premN', c.organic.n, c.conventional.n, dstr(c.date))) + '</div></div>';
    }).join('') + '</div><p class="pt-src">USDA AMS Market News · <a href="metodologia.html#precios-locales">' + esc(t('methLink')) + ' →</a></p>';
  }

  /* ---------- armazon de bloques y carga diferida ---------- */
  function blocks() {
    var loc = CBMAP[CTX.pid] ? [{ id: 'local', title: t('local'), hint: t('localHint'), load: blkLocal, html: htmlLocal }] : [];
    var prm = PRMAP[CTX.pid] ? [{ id: 'prem', title: t('prem'), hint: t('premHint'), load: blkPrem, html: htmlPrem }] : [];
    var all = [
      { id: 'changed', title: tf('changed', nm(CTX.pid)), hint: t('changedHint'), load: blkChanged, html: htmlChanged },
      { id: 'compare', title: t('compare'), hint: t('compareHint'), load: loadCompare, html: htmlCompare },
      { id: 'hist', title: t('hist'), hint: t('histHint'), load: loadHist, html: htmlHist },
      { id: 'sd', title: t('sd'), hint: t('sdHint'), load: blkSd, html: htmlSd },
      { id: 'trade', title: t('trade'), hint: t('tradeHint'), load: blkSd, html: htmlTrade },
      { id: 'tariffs', title: t('tariffs'), hint: t('tariffsHint'), load: blkSd, html: htmlTariffs },
      { id: 'costs', title: t('costs'), hint: t('costsHint'), load: function () { return Promise.resolve(); }, html: htmlCosts },
      { id: 'rels', title: t('rels'), hint: t('relsHint'), load: loadRels, html: htmlRels },
      { id: 'drivers', title: t('drivers'), hint: t('driversHint'), load: loadDrivers, html: htmlDrivers },
      { id: 'news', title: t('news'), hint: t('newsHint'), load: blkNews, html: htmlNews }
    ];
    return all.slice(0, 1).concat(loc, prm, all.slice(1));
  }
  // Tres tipos de informacion que no deben parecer lo mismo: dato publicado, lectura de Dehesa (texto generado a partir de cifras) y relacion historica (descriptiva).
  var KIND = { drivers: 'insight', rels: 'rel' }, KT = { data: ['Dato publicado', 'Published data', 'Donnée publiée', 'Dato pubblicato'], insight: ['Lectura de Dehesa', 'Dehesa reading', 'Lecture de Dehesa', 'Lettura di Dehesa'], rel: ['Relación histórica', 'Historical relationship', 'Relation historique', 'Relazione storica'] };
  function secHtml(b) { var k = KIND[b.id] || 'data'; return '<section class="pt-sec pt-k-' + k + '" id="pt-' + b.id + '" data-blk="' + b.id + '" aria-labelledby="pt-' + b.id + '-h"><div class="di-movers-head-row"><h2 id="pt-' + b.id + '-h">' + esc(b.title) + '</h2>' + (k === 'data' ? '' : '<span class="pt-kind pt-kind-' + k + '">' + esc(KT[k][li()]) + '</span>') + '<span class="di-movers-hint">' + esc(b.hint) + '</span></div><div class="pt-body"><div class="pt-skel">' + esc(t('loading')) + '</div></div></section>'; }
  function paint(b) {
    var el = document.querySelector('#pt-' + b.id + ' .pt-body'); if (!el) return;
    var st = BLK[b.id];
    if (st && st.err) { el.innerHTML = '<div class="pt-err">' + esc(t('loadErr')) + ' <button type="button" class="pt-chip" data-retry="' + b.id + '">' + esc(t('retry')) + '</button></div>'; return; }
    if (!st || !st.done) return;
    try { el.innerHTML = b.html(st.data); } catch (e) { el.innerHTML = '<div class="pt-err">' + esc(t('loadErr')) + '</div>'; if (window.console) console.error('producto-terminal', b.id, e); }
  }
  function run(b) {
    var st = BLK[b.id]; if (st && (st.busy || st.done)) { paint(b); return; }
    st = BLK[b.id] = { busy: true };
    b.load().then(function (d) { st.busy = false; st.done = true; st.data = d; paint(b); }, function (e) { st.busy = false; st.err = true; if (window.console) console.warn('producto-terminal', b.id, e); paint(b); });
  }
  var CUR = [];
  function observe() {
    if (IO) { try { IO.disconnect(); } catch (e) { /* nada */ } IO = null; }
    var secs = document.querySelectorAll('.pt-sec[data-blk]');
    function go(el) { var id = el.getAttribute('data-blk'); CUR.forEach(function (b) { if (b.id === id) run(b); }); }
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(secs, go); return; }
    IO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { IO.unobserve(e.target); go(e.target); } }); }, { rootMargin: '600px 0px' });
    Array.prototype.forEach.call(secs, function (el) { IO.observe(el); });
  }
  function tabsHtml() {
    var groups = {}, order = [];
    Object.keys(META.products).forEach(function (k) { var g = META.products[k].group || 'otros'; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(k); });
    return '<nav class="pt-tabs" aria-label="' + esc(t('nav')) + '">' + Object.keys(META.products).map(function (k) { return '<a class="pt-chip' + (k === ST.p ? ' on' : '') + '" href="producto.html?p=' + k + '"' + (k === ST.p ? ' aria-current="page"' : '') + '>' + esc(nm(k)) + '</a>'; }).join('') + '</nav>';
  }
  // Barra contextual fija bajo el menu: salta a cada bloque de ESTA ficha (solo los que existen para el producto).
  var CTXL = { head: ['Precio', 'Price', 'Prix', 'Prezzo'], changed: ['Cambios', 'Changes', 'Changements', 'Cambiamenti'], local: ['Ofertas locales', 'Local bids', 'Offres locales', 'Offerte locali'], prem: ['Prima', 'Premium', 'Prime', 'Premio'], compare: ['Países', 'Countries', 'Pays', 'Paesi'], hist: ['Histórico', 'History', 'Historique', 'Storico'], sd: ['Oferta y demanda', 'Supply & demand', 'Offre et demande', 'Offerta e domanda'], trade: ['Comercio', 'Trade', 'Commerce', 'Commercio'], tariffs: ['Aranceles', 'Tariffs', 'Droits de douane', 'Dazi'], costs: ['Costes', 'Costs', 'Coûts', 'Costi'], rels: ['Relaciones', 'Relationships', 'Relations', 'Relazioni'], drivers: ['Factores', 'Factors', 'Facteurs', 'Fattori'], news: ['Noticias', 'News', 'Actualités', 'Notizie'] },
    CTXA = ['Alertas', 'Alerts', 'Alertes', 'Avvisi'];
  function ctxBar() {
    var ids = ['head'].concat(CUR.map(function (b) { return b.id; })).filter(function (id) { return CTXL[id]; });
    return '<nav class="pt-ctx" aria-label="' + esc(nm(CTX.pid)) + '"><strong class="pt-ctx-t">' + esc(nm(CTX.pid)) + '</strong>' + ids.map(function (id) { return '<a href="#pt-' + id + '" data-ctx="' + id + '">' + esc(CTXL[id][li()]) + '</a>'; }).join('') + '<a href="mi-seguimiento.html">' + esc(CTXA[li()]) + '</a></nav>';
  }
  function ctxSpy() {
    var links = document.querySelectorAll('.pt-ctx a[data-ctx]'); if (!links.length) return;
    function hdr() { var h = document.querySelector('.di-header'); var sticky = h && window.getComputedStyle(h).position === 'sticky'; document.documentElement.style.setProperty('--di-hdr', (sticky ? h.offsetHeight : 0) + 'px'); }
    hdr(); if (!CTX.hdr) { CTX.hdr = true; window.addEventListener('resize', hdr); }
    function upd() { var cur = null, i; for (i = 0; i < links.length; i++) { var el = document.getElementById('pt-' + links[i].getAttribute('data-ctx')); if (el && el.getBoundingClientRect().top <= (parseInt(document.documentElement.style.getPropertyValue('--di-hdr'), 10) || 0) + 100) cur = links[i]; } for (i = 0; i < links.length; i++) { if (links[i] === cur) links[i].setAttribute('aria-current', 'location'); else links[i].removeAttribute('aria-current'); } }
    if (!CTX.spy) { CTX.spy = true; var tk = false; window.addEventListener('scroll', function () { if (tk) return; tk = true; (window.requestAnimationFrame || setTimeout)(function () { tk = false; upd(); }); }, { passive: true }); }
    upd();
    if (!CTX.clk) { CTX.clk = true; document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.pt-ctx a[data-ctx]') : null; if (!a) return;
      var id = 'pt-' + a.getAttribute('data-ctx'), el = document.getElementById(id); if (!el) return;
      e.preventDefault(); el.scrollIntoView({ behavior: 'auto', block: 'start' });
      [500, 1400].forEach(function (ms) { setTimeout(function () { var h = parseInt(document.documentElement.style.getPropertyValue('--di-hdr'), 10) || 0, top = el.getBoundingClientRect().top; if (Math.abs(top - (h + 56)) > 40) el.scrollIntoView({ behavior: 'auto', block: 'start' }); }, ms); });
    }); }
  }
  function shell(el) {
    var gname = (TX.group[li()] || TX.group[0])[CTX.meta.group] || CTX.meta.group;
    document.getElementById('pg-h1').textContent = t('title') + ': ' + nm(CTX.pid);
    document.getElementById('pg-sub').textContent = gname + ' · ' + t('sub');
    document.title = t('title') + ': ' + nm(CTX.pid) + ' | Dehesa Index';
    CUR = blocks();
    var legacy = OPTS && OPTS.legacy && OPTS.legacy.has ? '<section class="pt-sec" id="pt-legacy"><div class="di-movers-head-row"><h2>' + esc(t('legacy')) + '</h2><span class="di-movers-hint">' + esc(t('legacyHint')) + '</span></div><div id="pr-legacy-body"><button type="button" class="pt-chip" id="pt-legacy-btn">' + esc(t('legacyBtn')) + '</button></div></section>' : '';
    el.innerHTML = '<div class="pt-wrap">' + tabsHtml() + ctxBar() + '<section class="pt-sec" id="pt-head" style="margin-top:6px"><div class="di-movers-head-row"><h2>' + esc(t('price')) + '</h2><span class="di-movers-hint">' + esc(nm(CTX.pid)) + '</span></div>' + headHtml() + '</section>' +
      CUR.map(secHtml).join('') + legacy + '<section class="pt-sec" id="pt-sources"><div class="di-movers-head-row"><h2>' + esc(t('sources')) + '</h2></div>' + htmlSources() + '</section></div>';
    CUR.forEach(function (b) { if (BLK[b.id] && BLK[b.id].done) paint(b); else if (BLK[b.id] && BLK[b.id].err) { BLK[b.id] = null; } });
    observe(); ctxSpy();
    var lb = document.getElementById('pt-legacy-btn');
    if (lb) {
      var go = function () { lb.disabled = true; lb.textContent = t('loading'); OPTS.legacy.load().then(function () { OPTS.legacy.render(document.getElementById('pr-legacy-body')); }); };
      lb.addEventListener('click', go);
      if (OPTS.legacy.loaded && OPTS.legacy.loaded()) OPTS.legacy.render(document.getElementById('pr-legacy-body'));
    }
  }
  function pushUrl() { try { var q = new URLSearchParams(location.search); q.set('p', ST.p); q.set('u', ST.u); q.set('r', ST.r); if (ST.u === 'orig' && ST.i) q.set('i', ST.i); else q.delete('i'); history.replaceState(null, '', '?' + q.toString()); } catch (e) { /* sin historial */ } }
  function redraw(ids) { CUR.forEach(function (b) { if (!ids || ids.indexOf(b.id) > -1) paint(b); }); }
  function onClick(e) {
    var el = e.target; while (el && el !== document && !(el.getAttribute && (el.getAttribute('data-u') || el.getAttribute('data-r') || el.getAttribute('data-i') || el.getAttribute('data-sd') || el.getAttribute('data-follow') || el.getAttribute('data-retry')))) el = el.parentNode;
    if (!el || el === document) return;
    var u = el.getAttribute('data-u'), r = el.getAttribute('data-r'), i = el.getAttribute('data-i'), s = el.getAttribute('data-sd'), rt = el.getAttribute('data-retry');
    if (u) { ST.u = u; pushUrl(); redraw(['compare', 'hist']); return; }
    if (r) { ST.r = r; pushUrl(); redraw(['compare', 'hist']); return; }
    if (i) { ST.i = i; pushUrl(); redraw(['hist']); return; }
    if (s) { ST.sdEnt = s; redraw(['sd']); return; }
    if (rt) { BLK[rt] = null; CUR.forEach(function (b) { if (b.id === rt) { var bd = document.querySelector('#pt-' + rt + ' .pt-body'); if (bd) bd.innerHTML = '<div class="pt-skel">' + esc(t('loading')) + '</div>'; run(b); } }); return; }
    if (el.getAttribute('data-follow')) toggleFollow();
  }
  function toggleFollow() {
    var W = window.DIWatch; if (!W) return;
    var on = isFollowing(), keys = followKeys();
    if (on) { keys.forEach(function (k) { W.remove('P', k); }); drawFollow(); return; }
    var chain = Promise.resolve();
    keys.forEach(function (k) {
      chain = chain.then(function () { if (!W.has('P', k)) W.toggle('P', k); return W.addRule('P', k, { t: 'new' }); }).then(function () { return W.addRule('P', k, { t: 'pct', v: 5 }); });
    });
    chain.then(drawFollow, drawFollow);
  }
  function drawFollow() { var el = document.getElementById('pt-follow'); if (!el) return; el.innerHTML = followHtml(); if (window.DIWatch && window.DIWatch.bindEditor) window.DIWatch.bindEditor(el, drawFollow); }

  function mount(pid, opts) {
    OPTS = opts || {}; ST.p = pid;
    var q = new URLSearchParams(location.search);
    if (/^(orig|eur|usd|idx)$/.test(q.get('u') || '')) ST.u = q.get('u');
    if (/^(6m|1y|3y|5y|max)$/.test(q.get('r') || '')) ST.r = q.get('r');
    if (q.get('i')) ST.i = q.get('i');
    var root = document.getElementById('pr-body');
    root.innerHTML = '<div class="pt-wrap"><div class="pt-skel">' + esc(t('loading')) + '</div></div>';
    if (!root.__ptBound) { root.__ptBound = 1; root.addEventListener('click', onClick); }
    return load(pid).then(function (c) {
      CTX = c; BLK = {}; shell(root); var f = document.getElementById('pt-follow'); if (f && window.DIWatch && window.DIWatch.bindEditor) window.DIWatch.bindEditor(f, drawFollow); return c;
    });
  }
  function relang() { if (!CTX) return; var root = document.getElementById('pr-body'); shell(root); var f = document.getElementById('pt-follow'); if (f && window.DIWatch && window.DIWatch.bindEditor) window.DIWatch.bindEditor(f, drawFollow); }

  window.DIProductTerminal = { ready: ready, has: has, mount: mount, relang: relang, state: function () { return { st: ST, ctx: CTX, blk: BLK }; }, _t: t };
})();
