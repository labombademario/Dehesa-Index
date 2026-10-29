/* Dehesa Index — Observatorio de datos. ES5.
   Lee data/observatory.json (scripts/build-observatory.py, derivado de ficheros ya validados). No calcula ni inventa nada en el navegador salvo filtrar y ordenar.
   Filtros por pais (region del mercado), producto, fuente y tipo de dato; estado en la URL: ?c=&p=&s=&t=&w= y ancla de seccion (#new, #moves, #revisions, #freshness, #upcoming, #coverage, #countries, #quality, #pipelines). */
(function () {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LANGS.indexOf(lang()); return i < 0 ? 0 : i; }
  var TX = {
    title: ['Observatorio de datos', 'Data observatory', 'Observatoire des données', 'Osservatorio dei dati'],
    sub: ['Qué se ha actualizado, qué es nuevo, los mayores movimientos, la frescura, las próximas observaciones esperadas, la cobertura y la salud de los pipelines. Todo sale de datos ya validados y cada cifra indica su fuente y su fecha.', 'What was updated, what is new, the biggest moves, freshness, the next expected observations, coverage and pipeline health. Everything comes from already-validated data and every figure states its source and date.', 'Ce qui a été mis à jour, ce qui est nouveau, les plus grands mouvements, la fraîcheur, les prochaines observations attendues, la couverture et la santé des pipelines. Tout provient de données déjà validées et chaque chiffre indique sa source et sa date.', 'Cosa è stato aggiornato, cosa è nuovo, i maggiori movimenti, la freschezza, le prossime osservazioni attese, la copertura e lo stato delle pipeline. Tutto proviene da dati già validati e ogni cifra indica fonte e data.'],
    updated: ['Actualizado', 'Updated', 'Mis à jour', 'Aggiornato'], series: ['series en el catálogo', 'series in the catalogue', 'séries au catalogue', 'serie nel catalogo'], priceLayer: ['series de precios', 'price series', 'séries de prix', 'serie di prezzi'],
    newObs: ['Nuevas observaciones oficiales', 'New official observations', 'Nouvelles observations officielles', 'Nuove osservazioni ufficiali'],
    newHint: ['publicadas (o recuperadas por primera vez) en los últimos {0} días', 'published (or first retrieved) in the last {0} days', 'publiées (ou récupérées pour la première fois) ces {0} derniers jours', 'pubblicate (o recuperate per la prima volta) negli ultimi {0} giorni'],
    moves: ['Mayores movimientos', 'Biggest moves', 'Plus grands mouvements', 'Maggiori movimenti'],
    movesHint: ['último dato frente al anterior dentro de la ventana, en moneda y unidad originales', 'latest value vs the previous one inside the window, in original currency and unit', 'dernière valeur par rapport à la précédente dans la fenêtre, en devise et unité d’origine', 'ultimo dato rispetto al precedente nella finestra, in valuta e unità originali'],
    w_d1: ['Diario (1–3 días)', 'Daily (1–3 days)', 'Quotidien (1–3 jours)', 'Giornaliero (1–3 giorni)'], w_d7: ['Semanal (5–10 días)', 'Weekly (5–10 days)', 'Hebdomadaire (5–10 jours)', 'Settimanale (5–10 giorni)'], w_d30: ['Mensual (25–40 días)', 'Monthly (25–40 days)', 'Mensuel (25–40 jours)', 'Mensile (25–40 giorni)'],
    noMoves: ['Ninguna serie de este filtro tiene un dato anterior dentro de esta ventana. Hoy ninguna serie de la capa de precios es diaria: la ventana diaria queda vacía en lugar de rellenarse.', 'No series in this filter has a previous value inside this window. Today no series in the price layer is daily: the daily window stays empty rather than being filled in.', 'Aucune série de ce filtre n’a de valeur précédente dans cette fenêtre. Aujourd’hui aucune série de la couche des prix n’est quotidienne : la fenêtre quotidienne reste vide au lieu d’être comblée.', 'Nessuna serie di questo filtro ha un dato precedente in questa finestra. Oggi nessuna serie del livello prezzi è giornaliera: la finestra giornaliera resta vuota invece di essere riempita.'],
    revisions: ['Cambios detectados en datos ya publicados', 'Changes detected in already-published data', 'Changements détectés dans des données déjà publiées', 'Cambi rilevati in dati già pubblicati'], revNote: ['Cambios detectados en periodos ya publicados: pueden ser revisiones de la fuente, correcciones o reajustes del histórico; la fuente no los confirma. Que no haya ninguno no significa que la fuente no revise, solo que no hemos detectado el cambio de un valor ya publicado.', 'Changes detected in periods already published: they may be source revisions, corrections or historical adjustments; the source does not confirm them. None recorded does not mean the source never revises, only that no change to an already-published value has been detected.', 'Changements détectés dans des périodes déjà publiées : il peut s’agir de révisions de la source, de corrections ou de réajustements de l’historique ; la source ne les confirme pas. L’absence de changement ne signifie pas que la source ne révise jamais, seulement qu’aucune modification d’une valeur déjà publiée n’a été détectée.', 'Cambiamenti rilevati in periodi già pubblicati: possono essere revisioni della fonte, correzioni o riallineamenti dello storico; la fonte non li conferma. Nessun cambiamento non significa che la fonte non riveda mai i dati, solo che non è stata rilevata la modifica di un valore già pubblicato.'], revCount: ['{0} cambios registrados', '{0} changes recorded', '{0} changements enregistrés', '{0} cambi registrati'],
    freshness: ['Frescura de los datos', 'Data freshness', 'Fraîcheur des données', 'Freschezza dei dati'], freshHint: ['Freshness Engine 2.0: el estado depende de la frecuencia y del retraso habitual de cada fuente', 'Freshness Engine 2.0: the state depends on each source’s frequency and usual lag', 'Freshness Engine 2.0 : l’état dépend de la fréquence et du retard habituel de chaque source', 'Freshness Engine 2.0: lo stato dipende da frequenza e ritardo abituale di ogni fonte'],
    priceLayerL: ['Capa de precios (según filtros)', 'Price layer (as filtered)', 'Couche des prix (selon filtres)', 'Livello prezzi (secondo i filtri)'], catalogL: ['Catálogo completo', 'Full catalogue', 'Catalogue complet', 'Catalogo completo'], catalogSrc: ['Catálogo de la fuente {0}', 'Catalogue for source {0}', 'Catalogue de la source {0}', 'Catalogo della fonte {0}'],
    notFresh: ['Series de precios que no están al día', 'Price series that are not up to date', 'Séries de prix qui ne sont pas à jour', 'Serie di prezzi non aggiornate'], allFresh: ['Todas las series de este filtro están EN DIRECTO o AL DÍA.', 'Every series in this filter is LIVE or FRESH.', 'Toutes les séries de ce filtre sont EN DIRECT ou À JOUR.', 'Tutte le serie di questo filtro sono LIVE o FRESCHE.'],
    upcoming: ['Próximas observaciones esperadas', 'Next expected observations', 'Prochaines observations attendues', 'Prossime osservazioni attese'], upHint: ['según la política de frescura; no es un calendario oficial de publicaciones', 'per the freshness policy; not an official release calendar', 'selon la politique de fraîcheur ; pas un calendrier officiel de publications', 'secondo la politica di freschezza; non è un calendario ufficiale di pubblicazioni'],
    pipeRuns: ['Próximas ejecuciones de pipelines', 'Next pipeline runs', 'Prochaines exécutions des pipelines', 'Prossime esecuzioni delle pipeline'],
    coverage: ['Cobertura', 'Coverage', 'Couverture', 'Copertura'], covHint: ['cambios frente a la instantánea anterior', 'changes vs the previous snapshot', 'changements par rapport à l’instantané précédent', 'variazioni rispetto all’istantanea precedente'],
    noCovChanges: ['Sin cambios de cobertura desde la instantánea anterior', 'No coverage changes since the previous snapshot', 'Aucun changement de couverture depuis l’instantané précédent', 'Nessuna variazione di copertura dall’istantanea precedente'], noSnap: ['Aún no hay una instantánea anterior con la que comparar.', 'There is no earlier snapshot to compare with yet.', 'Il n’y a pas encore d’instantané précédent à comparer.', 'Non c’è ancora un’istantanea precedente con cui confrontare.'],
    since: ['desde', 'since', 'depuis', 'da'],
    quality: ['Calidad de los datos', 'Data quality', 'Qualité des données', 'Qualità dei dati'], qHint: ['validación de contratos y anomalías conocidas', 'contract validation and known anomalies', 'validation des contrats et anomalies connues', 'validazione dei contratti e anomalie note'],
    qFiles: ['ficheros validados', 'files validated', 'fichiers validés', 'file validati'], qErr: ['errores', 'errors', 'erreurs', 'errori'], qWarn: ['avisos', 'warnings', 'avertissements', 'avvisi'], qUnexp: ['anomalías sin explicar', 'unexplained anomalies', 'anomalies non expliquées', 'anomalie non spiegate'], qVer: ['anomalías verificadas', 'verified anomalies', 'anomalies vérifiées', 'anomalie verificate'],
    why: ['Motivo', 'Reason', 'Motif', 'Motivo'],
    pipelines: ['Salud de los pipelines', 'Pipeline health', 'Santé des pipelines', 'Stato delle pipeline'], allOk: ['Todos los pipelines están en orden.', 'All pipelines are healthy.', 'Tous les pipelines sont en ordre.', 'Tutte le pipeline sono in ordine.'], attention: ['Requieren atención', 'Need attention', 'Demandent de l’attention', 'Richiedono attenzione'],
    ok: ['en orden', 'ok', 'ok', 'ok'], late: ['con retraso', 'late', 'en retard', 'in ritardo'], error: ['con error', 'error', 'en erreur', 'in errore'], not_run: ['sin ejecutar', 'not run', 'non exécutés', 'non eseguiti'], unknown: ['desconocido', 'unknown', 'inconnu', 'sconosciuto'],
    fC: ['País / mercado', 'Country / market', 'Pays / marché', 'Paese / mercato'], fT: ['Tipo de dato', 'Data type', 'Type de donnée', 'Tipo di dato'], fS: ['Fuente', 'Source', 'Source', 'Fonte'], fP: ['Producto', 'Product', 'Produit', 'Prodotto'],
    all: ['Todos', 'All', 'Tous', 'Tutti'], reset: ['Quitar filtros', 'Clear filters', 'Effacer les filtres', 'Rimuovi filtri'], shown: ['de', 'of', 'sur', 'su'],
    ty_PRICE: ['Precios', 'Prices', 'Prix', 'Prezzi'], ty_INPUT: ['Insumos y energía', 'Inputs and energy', 'Intrants et énergie', 'Input ed energia'],
    cProd: ['Producto', 'Product', 'Produit', 'Prodotto'], cMkt: ['Mercado', 'Market', 'Marché', 'Mercato'], cObs: ['Observación', 'Observation', 'Observation', 'Osservazione'], cPub: ['Publicada / detectada', 'Published / detected', 'Publiée / détectée', 'Pubblicata / rilevata'], cVal: ['Valor', 'Value', 'Valeur', 'Valore'], cChg: ['Cambio', 'Change', 'Variation', 'Variazione'], cFresh: ['Frescura', 'Freshness', 'Fraîcheur', 'Freschezza'], cSrc: ['Fuente', 'Source', 'Source', 'Fonte'],
    cFrom: ['Desde', 'From', 'De', 'Da'], cDays: ['Días', 'Days', 'Jours', 'Giorni'], cExp: ['Esperada', 'Expected', 'Attendue', 'Attesa'], cFreq: ['Frecuencia', 'Frequency', 'Fréquence', 'Frequenza'], cAge: ['Antigüedad', 'Age', 'Ancienneté', 'Età'],
    more: ['Mostrar 20 más', 'Show 20 more', 'Afficher 20 de plus', 'Mostra altri 20'], showing: ['Mostrando {0} de {1}', 'Showing {0} of {1}', 'Affichage de {0} sur {1}', 'Mostro {0} di {1}'],
    retrieved: ['recuperada', 'retrieved', 'récupérée', 'recuperata'], detected: ['detectada por Dehesa (la fuente no publica fecha)', 'detected by Dehesa (the source publishes no date)', 'détectée par Dehesa (la source ne publie pas de date)', 'rilevata da Dehesa (la fonte non pubblica la data)'], none: ['Ningún resultado con estos filtros.', 'No results with these filters.', 'Aucun résultat avec ces filtres.', 'Nessun risultato con questi filtri.'],
    err: ['No se pudo cargar data/observatory.json.', 'Could not load data/observatory.json.', 'Impossible de charger data/observatory.json.', 'Impossibile caricare data/observatory.json.'],
    freq_daily: ['diaria', 'daily', 'quotidienne', 'giornaliera'], freq_weekly: ['semanal', 'weekly', 'hebdomadaire', 'settimanale'], freq_monthly: ['mensual', 'monthly', 'mensuelle', 'mensile'], freq_quarterly: ['trimestral', 'quarterly', 'trimestrielle', 'trimestrale'], freq_annual: ['anual', 'annual', 'annuelle', 'annuale'],
    fs_LIVE: ['RECIÉN PUBLICADO', 'JUST RELEASED', 'TOUT JUSTE PUBLIÉ', 'APPENA PUBBLICATO'], fs_FRESH: ['AL DÍA', 'FRESH', 'À JOUR', 'AGGIORNATO'], fs_EXPECTED_DELAY: ['RETRASO HABITUAL', 'EXPECTED DELAY', 'RETARD HABITUEL', 'RITARDO ABITUALE'], fs_DELAYED: ['RETRASADO', 'DELAYED', 'EN RETARD', 'IN RITARDO'], fs_STALE: ['DESACTUALIZADO', 'STALE', 'OBSOLÈTE', 'OBSOLETO'], fs_HISTORICAL: ['HISTÓRICA', 'HISTORICAL', 'HISTORIQUE', 'STORICA'], fs_DISCONTINUED: ['DISCONTINUADA', 'DISCONTINUED', 'ARRÊTÉE', 'INTERROTTA'], fs_PENDING: ['PENDIENTE', 'PENDING', 'EN ATTENTE', 'IN SOSPESO'],
    an_UNEXPLAINED_ANOMALY: ['Sin explicar', 'Unexplained', 'Non expliquée', 'Non spiegata'], an_KNOWN_VERIFIED_ANOMALY: ['Verificada', 'Verified', 'Vérifiée', 'Verificata'],
    ctry: ['Países: qué falta por llegar', 'Countries: what is still to arrive', 'Pays : ce qui reste à arriver', 'Paesi: cosa deve ancora arrivare'],
    ctryTab: ['Países', 'Countries', 'Pays', 'Paesi'],
    ctryHint: ['la cobertura de hoy, hasta dónde subiría si llega lo que se espera y de qué fuente. Las fechas son estimaciones: casi ninguna fuente publica calendario', 'today’s coverage, how far it would rise if what is expected arrives, and from which source. Dates are estimates: almost no source publishes a calendar', 'la couverture actuelle, jusqu’où elle monterait si ce qui est attendu arrive, et de quelle source. Les dates sont des estimations : presque aucune source ne publie de calendrier', 'la copertura di oggi, fin dove salirebbe se arriva ciò che è atteso e da quale fonte. Le date sono stime: quasi nessuna fonte pubblica un calendario'],
    cCov: ['Cobertura', 'Coverage', 'Couverture', 'Copertura'], cMax: ['Hasta', 'Up to', 'Jusqu’à', 'Fino a'], cWait: ['Qué se espera', 'What is expected', 'Ce qui est attendu', 'Cosa è atteso'],
    cCountry: ['País', 'Country', 'Pays', 'Paese'],
    ctryWait: ['{0} series · {1} · último dato {2} · esperado desde {3} ({4} d de retraso)', '{0} series · {1} · latest {2} · expected since {3} ({4} d late)', '{0} séries · {1} · dernière donnée {2} · attendu depuis {3} ({4} j de retard)', '{0} serie · {1} · ultimo dato {2} · atteso dal {3} ({4} g di ritardo)'],
    ctryLong: ['más de 4 meses tarde: puede que la fecha estimada no encaje con esta fuente, o que ya no se publique', 'over 4 months late: the estimated date may not fit this source, or it may no longer be published', 'plus de 4 mois de retard : la date estimée ne convient peut-être pas à cette source, ou elle n’est plus publiée', 'oltre 4 mesi di ritardo: la data stimata potrebbe non adattarsi a questa fonte, o potrebbe non essere più pubblicata'],
    ctryNext: ['Siguiente dato, como tarde', 'Next figure due by', 'Prochaine donnée, au plus tard', 'Prossimo dato, al più tardi'], ctryNone: ['Nada pendiente: todo lo que debía llegar ha llegado.', 'Nothing pending: everything due has arrived.', 'Rien en attente : tout ce qui était dû est arrivé.', 'Niente in sospeso: è arrivato tutto ciò che era dovuto.'],
    ctryNote: ['«Hasta» = cobertura si pasaran a cubiertas las celdas hoy retrasadas (producto × métrica). Es un techo, no una promesa: lo muy retrasado puede no volver.', '“Up to” = coverage if today’s delayed cells (product × metric) became covered. It is a ceiling, not a promise: what is very late may not come back.', '« Jusqu’à » = couverture si les cellules aujourd’hui en retard (produit × métrique) devenaient couvertes. C’est un plafond, pas une promesse : ce qui est très en retard peut ne pas revenir.', '«Fino a» = copertura se le celle oggi in ritardo (prodotto × metrica) diventassero coperte. È un tetto, non una promessa: ciò che è molto in ritardo potrebbe non tornare.'],
    ctryErr: ['No se pudo cargar data/country-pending.json.', 'Could not load data/country-pending.json.', 'Impossible de charger data/country-pending.json.', 'Impossibile caricare data/country-pending.json.'],
    series_n: ['series', 'series', 'séries', 'serie'],
    err404: ['—', '—', '—', '—'], link: ['Ver ficha', 'Open page', 'Voir la fiche', 'Apri scheda']
  };
  // Lenguaje llano (17-oct): títulos que se entienden sin saber qué es un pipeline; los textos técnicos siguen dentro de cada bloque.
  var PLAIN = {
    sub: ['Aquí ves si los datos de Dehesa Index están al día: qué precios acaban de llegar, cuáles se han movido más y qué falta por llegar. Todo sale de fuentes oficiales, con su fecha.', 'See whether Dehesa Index data is up to date: which prices just arrived, which moved the most and what is still to come. Everything comes from official sources, with its date.', 'Voyez si les données de Dehesa Index sont à jour : quels prix viennent d’arriver, lesquels ont le plus bougé et ce qui reste à venir. Tout provient de sources officielles, avec sa date.', 'Qui vedi se i dati di Dehesa Index sono aggiornati: quali prezzi sono appena arrivati, quali si sono mossi di più e cosa deve ancora arrivare. Tutto proviene da fonti ufficiali, con la sua data.'],
    newObs: ['Datos nuevos', 'New data', 'Nouvelles données', 'Dati nuovi'],
    moves: ['Lo que más se ha movido', 'Biggest moves', 'Ce qui a le plus bougé', 'Cosa si è mosso di più'],
    revisions: ['Datos que la fuente ha corregido', 'Data corrected by the source', 'Données corrigées par la source', 'Dati corretti dalla fonte'],
    freshness: ['¿Están al día los precios?', 'Are prices up to date?', 'Les prix sont-ils à jour ?', 'I prezzi sono aggiornati?'],
    upcoming: ['Qué datos llegan pronto', 'Data coming soon', 'Données attendues bientôt', 'Dati in arrivo'],
    coverage: ['Cuántos datos tenemos', 'How much data we have', 'Combien de données nous avons', 'Quanti dati abbiamo'],
    ctry: ['Qué falta por llegar en cada país', 'What is still to arrive in each country', 'Ce qui reste à arriver dans chaque pays', 'Cosa deve ancora arrivare in ogni paese'],
    quality: ['Controles de calidad', 'Quality checks', 'Contrôles de qualité', 'Controlli di qualità'],
    pipelines: ['Descargas automáticas', 'Automatic downloads', 'Téléchargements automatiques', 'Download automatici'],
    d_new: ['Precios oficiales publicados en los últimos {0} días.', 'Official prices published in the last {0} days.', 'Prix officiels publiés ces {0} derniers jours.', 'Prezzi ufficiali pubblicati negli ultimi {0} giorni.'],
    d_moves: ['Las subidas y bajadas más grandes frente al dato anterior.', 'The largest rises and falls against the previous figure.', 'Les plus fortes hausses et baisses par rapport à la donnée précédente.', 'I maggiori rialzi e ribassi rispetto al dato precedente.'],
    d_upcoming: ['Cuándo debería salir el próximo dato de cada precio.', 'When the next figure for each price should come out.', 'Quand la prochaine donnée de chaque prix devrait sortir.', 'Quando dovrebbe uscire il prossimo dato di ogni prezzo.'],
    d_countries: ['Por país: qué tenemos hoy y qué datos esperamos todavía.', 'By country: what we have today and what is still expected.', 'Par pays : ce que nous avons aujourd’hui et ce qui est encore attendu.', 'Per paese: cosa abbiamo oggi e cosa è ancora atteso.'],
    d_freshness: ['Qué precios están al día y cuáles llegan tarde.', 'Which prices are up to date and which are late.', 'Quels prix sont à jour et lesquels sont en retard.', 'Quali prezzi sono aggiornati e quali in ritardo.'],
    d_revisions: ['Cuando una fuente cambia una cifra que ya había publicado, lo anotamos aquí.', 'When a source changes a figure it had already published, we note it here.', 'Quand une source modifie un chiffre déjà publié, nous le notons ici.', 'Quando una fonte cambia un dato già pubblicato, lo annotiamo qui.'],
    d_coverage: ['Cuántas series hay en el sitio y cómo ha cambiado.', 'How many series the site has and how that changed.', 'Combien de séries compte le site et comment cela a évolué.', 'Quante serie ha il sito e come è cambiato.'],
    d_quality: ['Las comprobaciones automáticas que pasan los datos antes de publicarse.', 'The automatic checks data passes before being published.', 'Les vérifications automatiques que passent les données avant publication.', 'I controlli automatici che i dati superano prima della pubblicazione.'],
    d_pipelines: ['Los procesos que descargan cada fuente oficial, y si alguno ha fallado.', 'The processes that download each official source, and whether any failed.', 'Les processus qui téléchargent chaque source officielle, et si l’un a échoué.', 'I processi che scaricano ogni fonte ufficiale, e se qualcuno è fallito.'],
    gUser: ['Lo principal', 'The essentials', 'L’essentiel', 'L’essenziale'],
    gTech: ['Para los curiosos: detalles técnicos', 'For the curious: technical details', 'Pour les curieux : détails techniques', 'Per i curiosi: dettagli tecnici'],
    sumT: ['Resumen', 'Summary', 'Résumé', 'Riepilogo'],
    kNew: ['Datos nuevos', 'New data', 'Nouvelles données', 'Dati nuovi'], kNewS: ['en los últimos {0} días', 'in the last {0} days', 'ces {0} derniers jours', 'negli ultimi {0} giorni'],
    kMove: ['Mayor movimiento', 'Biggest move', 'Plus grand mouvement', 'Maggior movimento'], kMoveS: ['en la última semana', 'over the last week', 'sur la dernière semaine', 'nell’ultima settimana'],
    kLate: ['Precios con retraso', 'Late prices', 'Prix en retard', 'Prezzi in ritardo'], kLateS: ['de {0} precios', 'of {0} prices', 'sur {0} prix', 'su {0} prezzi'],
    kPipe: ['Descargas automáticas', 'Automatic downloads', 'Téléchargements automatiques', 'Download automatici'], kPipeOk: ['todas en orden', 'all fine', 'toutes en ordre', 'tutti in ordine'], kPipeBad: ['{0} necesitan atención', '{0} need attention', '{0} demandent de l’attention', '{0} richiedono attenzione'],
    kPipeNR: ['{0} aún sin su primera ejecución', '{0} not yet run for the first time', '{0} pas encore exécutés', '{0} non ancora eseguiti'],
    see: ['Ver', 'View', 'Voir', 'Vedi'],
    filt: ['Filtrar por país, tipo, producto o fuente', 'Filter by country, type, product or source', 'Filtrer par pays, type, produit ou source', 'Filtra per paese, tipo, prodotto o fonte'],
    filtOn: ['filtros activos', 'filters on', 'filtres actifs', 'filtri attivi'],
    barT: ['En esta página', 'On this page', 'Sur cette page', 'In questa pagina']
  };
  Object.keys(PLAIN).forEach(function (k) { TX[k] = PLAIN[k]; });
  TX.ctryTab = TX.ctry;
  function t(k) { var a = TX[k]; if (!a) return k; var v = a[li()]; return v === undefined ? a[0] : v; }
  function tf(k, x) { return t(k).replace('{0}', x); }
  var STEP = 20, LIM = { new: STEP, moves: STEP, late: STEP, up: STEP, ctry: STEP };  // render perezoso: 20 iniciales + 'Mostrar 20 mas'; los filtros se aplican a TODO el conjunto antes de paginar
  function pager(key, total) { var n = LIM[key]; return total > n ? '<p class="pt-sub" aria-live="polite">' + esc(t('showing').replace('{0}', n).replace('{1}', total)) + ' <button type="button" class="pt-chip" data-more="' + key + '">' + esc(t('more')) + '</button></p>' : ''; }
  var RSR = [
    [/^un paso de actualizacion fallo \(se publico lo que estaba bien\)$/, ['an update step failed (what was fine was published)', 'une étape de mise à jour a échoué (ce qui était correct a été publié)', 'un passaggio di aggiornamento non è riuscito (è stato pubblicato ciò che era corretto)']],
    [/^hubo datos invalidos descartados$/, ['invalid data was discarded', 'des données invalides ont été écartées', 'sono stati scartati dati non validi']],
    [/^datos invalidos: se descarta el cambio de (.+)$/, ['invalid data: the change to $1 is discarded', 'données invalides : la modification de $1 est écartée', 'dati non validi: la modifica di $1 viene scartata']],
    [/^la pagina de la FSA no tiene enlaces reconocibles$/, ['the FSA page has no recognisable links', 'la page de la FSA ne contient aucun lien reconnaissable', 'la pagina della FSA non contiene collegamenti riconoscibili']],
    [/^tabla (\S+) (\d+) celdas actualizada (\S+)$/, ['table $1: $2 cells, updated $3', 'tableau $1 : $2 cellules, mis à jour le $3', 'tabella $1: $2 celle, aggiornata il $3']],
    [/^cosecha (\d+) valores$/, ['harvest: $1 values', 'récolte : $1 valeurs', 'raccolto: $1 valori']],
    [/^PAUSADO \(/, ['PAUSED (', 'EN PAUSE (', 'IN PAUSA (']]
  ];
  function rs(x) {
    var L = lang(), i = { en: 0, fr: 1, it: 2 }[L];
    if (i === undefined || !x) return x;
    return String(x).split(' · ').map(function (part) {
      for (var k = 0; k < RSR.length; k++) { var r = RSR[k]; if (r[0].test(part)) return part.replace(r[0], r[1][i]); }
      return part;
    }).join(' · ');
  }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dstr(iso) { if (!iso) return '—'; var p = String(iso).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }
  function L(o) { return o ? (o[lang()] || o.en || '') : ''; }
  var SRC = { eu_agrifood: 'Comisión Europea · Agri-food', usda_nass: 'USDA NASS', statcan: 'Statistics Canada', defra: 'DEFRA', eurostat: 'Eurostat', world_bank: 'World Bank', usda_ams_mars: 'USDA AMS', european_commission: 'Comisión Europea · Lácteo', eu_oil_bulletin: 'EU Oil Bulletin', eia: 'EIA', alberta_ag: 'Alberta Agriculture', ecb: 'BCE' };
  function srcName(id) { return SRC[id] || id || '—'; }
  var PAGE = { trigo: 'trigo', maiz: 'maiz', leche: 'leche', vaca: 'vacuno', urea: 'urea', diesel: 'diesel', harina_soja: 'soja', cerdo: 'cerdo', cebada: 'cebada', avena: 'avena', arroz: 'arroz', colza: 'colza', huevos: 'huevos', oliva: 'oliva' };
  var DOC = null, F = { c: '', p: '', s: '', t: '', w: 'd7' };
  function readUrl() { var q = new URLSearchParams(location.search); for (var k in F) F[k] = q.get(k) || (k === 'w' ? 'd7' : ''); if (!/^d(1|7|30)$/.test(F.w)) F.w = 'd7'; }
  function writeUrl() { var q = new URLSearchParams(); for (var k in F) if (F[k] && !(k === 'w' && F[k] === 'd7')) q.set(k, F[k]); var s = q.toString(); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {} }
  function lab(p) { return L(DOC.labels[p]) || p; }
  function rg(r) { return DOC.regions[r] ? L(DOC.regions[r]) : r.toUpperCase(); }
  function fsB(st) { return '<span class="pt-badge pt-fs-' + esc(st) + '">' + esc(t('fs_' + st)) + '</span>'; }
  function chg(c) { if (c === null || c === undefined) return '<span class="pt-flat">—</span>'; return '<span class="' + (c > 0 ? 'pt-up' : c < 0 ? 'pt-down' : 'pt-flat') + '">' + (c > 0 ? '+' : '') + nf(c, 2) + ' %</span>'; }
  function ok(o) { return (!F.c || o.region === F.c) && (!F.p || o.product === F.p) && (!F.s || o.sourceId === F.s) && (!F.t || o.type === F.t); }
  function uniq(a) { var m = {}, r = []; a.forEach(function (x) { if (!m[x]) { m[x] = 1; r.push(x); } }); return r; }
  function chip(g, v, label, on) { return '<button type="button" class="pt-chip" aria-pressed="' + (!!on) + '" data-f="' + g + '" data-v="' + esc(v) + '">' + esc(label) + '</button>'; }
  function identOf(o) { var I = window.DIIdentity, e = I && I.data() && o.id ? I.get(o.id) : null; return e ? '<div class="pt-ident">' + esc(I.line(e, lang())) + '</div>' : ''; }
  function prodLink(o) { var pg = PAGE[o.product], n = esc(lab(o.product)); return (pg ? '<a href="producto.html?p=' + pg + '">' + n + '</a>' : n) + identOf(o); }
  function filters() {
    var obs = DOC.observations, regs = uniq(obs.map(function (o) { return o.region; })).sort(), prods = uniq(obs.map(function (o) { return o.product; })).sort(function (a, b) { return lab(a) < lab(b) ? -1 : 1; }), srcs = uniq(obs.map(function (o) { return o.sourceId; })).sort(), tys = uniq(obs.map(function (o) { return o.type; })).sort();
    var h = '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('fC')) + '"><span class="pt-lbl">' + esc(t('fC')) + '</span>' + chip('c', '', t('all'), !F.c) + regs.map(function (r) { return chip('c', r, ({ us: '🇺🇸 ', eu: '🇪🇺 ', uk: '🇬🇧 ', ca: '🇨🇦 ', au: '🇦🇺 ' }[r] || '') + rg(r), F.c === r); }).join('') + '</div>';
    h += '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('fT')) + '"><span class="pt-lbl">' + esc(t('fT')) + '</span>' + chip('t', '', t('all'), !F.t) + tys.map(function (x) { return chip('t', x, t('ty_' + x), F.t === x); }).join('') + '</div>';
    function sel(id, label, list, cur, text) { return '<label class="ob-sel"><span class="pt-lbl">' + esc(label) + '</span><select id="' + id + '" data-f="' + id.slice(3) + '"><option value="">' + esc(t('all')) + '</option>' + list.map(function (x) { return '<option value="' + esc(x) + '"' + (cur === x ? ' selected' : '') + '>' + esc(text(x)) + '</option>'; }).join('') + '</select></label>'; }
    h += '<div class="ob-selrow">' + sel('ob-p', t('fP'), prods, F.p, lab) + sel('ob-s', t('fS'), srcs, F.s, srcName) + '</div>';
    return h;
  }
  var OPEN = { new: true };
  function sec(id, title, hint, body) {
    var d = TX['d_' + id] ? (id === 'new' ? tf('d_new', DOC ? DOC.newDays : 7) : t('d_' + id)) : '';
    return '<section class="pt-sec ob-sec" id="' + id + '" aria-labelledby="' + id + '-h"><details data-sec="' + id + '"' + (OPEN[id] ? ' open' : '') + '><summary class="ob-sum"><span class="ob-sum-t"><h2 id="' + id + '-h">' + esc(title) + '</h2>' + (d ? '<span class="ob-sum-d">' + esc(d) + '</span>' : '') + '</span><span class="ob-sum-i" aria-hidden="true">▾</span></summary><div class="ob-sec-b">' + (hint ? '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(hint) + '</p>' : '') + body + '</div></details></section>';
  }
  function tile(id, k, v, sub, cls) { return '<a class="di-card ob-tile" href="#' + id + '" data-open="' + id + '"><span class="ob-tile-k">' + esc(k) + '</span><span class="ob-tile-v' + (cls ? ' ' + cls : '') + '">' + v + '</span><span class="ob-tile-s">' + esc(sub) + '</span></a>'; }
  function summary(obs) {
    var nNew = obs.filter(function (o) { return o.isNew; }).length;
    var mv = obs.filter(function (o) { return o.moves.d7; }).sort(function (a, b) { return Math.abs(b.moves.d7.pct) - Math.abs(a.moves.d7.pct); })[0];
    var late = obs.filter(function (o) { return o.freshness !== 'LIVE' && o.freshness !== 'FRESH'; }).length;
    // Solo cuentan como «atención» los errores y retrasos; un workflow nuevo que aún no ha llegado a su primera fecha no es un fallo.
    var att = DOC.pipelines.attention.filter(function (x) { return x.status === 'error' || x.status === 'late'; }).length, nr = DOC.pipelines.attention.filter(function (x) { return x.status === 'not_run'; }).length;
    return '<h2 class="ob-h2">' + esc(t('sumT')) + '</h2><div class="ob-tiles">' +
      tile('new', t('kNew'), String(nNew), tf('kNewS', DOC.newDays)) +
      (mv ? tile('moves', t('kMove'), (mv.moves.d7.pct > 0 ? '+' : mv.moves.d7.pct < 0 ? '−' : '') + nf(Math.abs(mv.moves.d7.pct), 1) + ' %', lab(mv.product) + ' · ' + rg(mv.region) + ' · ' + t('kMoveS'), mv.moves.d7.pct > 0 ? 'pt-up' : 'pt-down') : '') +
      tile('freshness', t('kLate'), String(late), tf('kLateS', obs.length), late ? 'pt-down' : '') +
      tile('pipelines', t('kPipe'), att ? '⚠️ ' + att : '✓', (att ? tf('kPipeBad', att) : t('kPipeOk')) + (nr ? ' · ' + tf('kPipeNR', nr) : ''), att ? 'pt-down' : 'pt-up') + '</div>';
  }
  function table(head, rows, cls) { return '<div class="pt-tblwrap"><table class="pt-table rs"><thead><tr>' + head.map(function (h) { return '<th' + (h[1] ? ' class="r"' : '') + '>' + esc(h[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function td(label, html, right) { return '<td' + (right ? ' class="r"' : '') + ' data-l="' + esc(label) + '">' + html + '</td>'; }
  function oVal(o) { return nf(o.value, Math.abs(o.value) >= 100 ? 1 : 2) + ' <span class="pt-sub">' + esc(o.currency === 'INDEX' ? 'índice' : o.currency + '/' + o.unit) + '</span>'; }

  function secNew(obs) {
    var l = obs.filter(function (o) { return o.isNew; }).sort(function (a, b) { return (b.publicationDate || b.snapshotDate || '') < (a.publicationDate || a.snapshotDate || '') ? -1 : 1; });
    if (!l.length) return sec('new', t('newObs'), tf('newHint', DOC.newDays), '<p class="pt-note">' + esc(t('none')) + '</p>');
    var rows = l.slice(0, LIM.new).map(function (o) {
      return '<tr>' + td(t('cProd'), '<strong>' + prodLink(o) + '</strong>') + td(t('cMkt'), esc(rg(o.region))) + td(t('cObs'), esc(dstr(o.observationDate))) +
        td(t('cPub'), esc(dstr(o.publicationDate || o.snapshotDate)) + (/^(eu_agrifood|eu_oil_bulletin)$/.test(o.sourceId) ? ' <span class="pt-sub">(' + esc(t('detected')) + ')</span>' : (o.pubKnown ? '' : ' <span class="pt-sub">(' + esc(t('retrieved')) + ')</span>'))) + td(t('cVal'), oVal(o), true) + td(t('cChg'), chg(o.changePct), true) + td(t('cFresh'), fsB(o.freshness)) + td(t('cSrc'), esc(srcName(o.sourceId))) + '</tr>';
    });
    return sec('new', t('newObs') + ' (' + l.length + ')', tf('newHint', DOC.newDays), table([[t('cProd')], [t('cMkt')], [t('cObs')], [t('cPub')], [t('cVal'), 1], [t('cChg'), 1], [t('cFresh')], [t('cSrc')]], rows) + pager('new', l.length));
  }
  function secMoves(obs) {
    var w = F.w, l = obs.filter(function (o) { return o.moves[w]; }).sort(function (a, b) { return Math.abs(b.moves[w].pct) - Math.abs(a.moves[w].pct); });
    var ctl = '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('moves')) + '">' + ['d1', 'd7', 'd30'].map(function (k) { return chip('w', k, t('w_' + k), F.w === k); }).join('') + '</div>';
    if (!l.length) return sec('moves', t('moves'), t('movesHint'), ctl + '<p class="pt-note">' + esc(t('noMoves')) + '</p>');
    var rows = l.slice(0, LIM.moves).map(function (o) {
      var m = o.moves[w];
      return '<tr>' + td(t('cProd'), '<strong>' + prodLink(o) + '</strong>') + td(t('cMkt'), esc(rg(o.region))) + td(t('cFrom'), esc(dstr(m.from)) + ' → ' + esc(dstr(m.to))) + td(t('cDays'), m.days, true) + td(t('cChg'), chg(m.pct), true) + td(t('cVal'), oVal(o), true) + td(t('cFresh'), fsB(o.freshness)) + td(t('cSrc'), esc(srcName(o.sourceId))) + '</tr>';
    });
    return sec('moves', t('moves'), t('movesHint'), ctl + table([[t('cProd')], [t('cMkt')], [t('cFrom')], [t('cDays'), 1], [t('cChg'), 1], [t('cVal'), 1], [t('cFresh')], [t('cSrc')]], rows) + pager('moves', l.length) + '<p class="pt-sub">' + l.length + ' / ' + obs.length + '</p>');
  }
  // Una revisión en una línea legible (antes se veía el JSON crudo): serie, periodo, antes -> después y variación
  function revLine(x) {
    var lab = x.label || x.series || x.id || '', L0 = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es';
    if (x.label && window.DILabelTl && window.DILabelTl.ready(L0)) lab = window.DILabelTl.tl(x.label, L0);
    var per = x.period || '', a = x.old != null ? x.old : x.before, b = x.new != null ? x.new : x.after;
    var nf = function (v) { return typeof v === 'number' ? v.toLocaleString(LANGC(), { maximumFractionDigits: 2 }) : String(v == null ? '–' : v); };
    var pc = typeof a === 'number' && typeof b === 'number' && a ? ' (' + (b >= a ? '+' : '') + ((b / a - 1) * 100).toLocaleString(LANGC(), { maximumFractionDigits: 1 }) + ' %)' : '';
    return lab + (per ? ' · ' + per : '') + ': ' + nf(a) + ' → ' + nf(b) + pc;
  }
  function LANGC() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }[l] || 'es-ES'; }
  function secRev() {
    var r = DOC.revisions, b = '<p><strong>' + esc(tf('revCount', r.count)) + '</strong></p><p class="pt-sub">' + esc(tf('revNote')) + '</p>';
    if (r.items.length) b += '<ul class="pt-list">' + r.items.slice(0, 20).map(function (x) { return '<li>' + esc(typeof x === 'string' ? x : revLine(x)) + '</li>'; }).join('') + '</ul>';
    return sec('revisions', t('revisions'), '', b);
  }
  function bars(by, total) {
    var order = ['LIVE', 'FRESH', 'EXPECTED_DELAY', 'DELAYED', 'STALE', 'HISTORICAL', 'DISCONTINUED', 'PENDING'], h = '<div class="pt-bars">';
    order.forEach(function (s) { var n = by[s] || 0; if (!n) return; h += '<div class="pt-row"><span class="n" title="' + esc(t('fs_' + s)) + '">' + fsB(s) + '</span><span class="rl-barwrap"><i style="width:' + Math.max(1, Math.round(n / total * 100)) + '%"></i></span><span>' + n + ' <span class="pt-sub">(' + nf(n / total * 100, 0) + ' %)</span></span></div>'; });
    return h + '</div>';
  }
  function secFresh(obs) {
    var by = {}; obs.forEach(function (o) { by[o.freshness] = (by[o.freshness] || 0) + 1; });
    var cat = DOC.freshness.catalog, cb = F.s && cat.bySource[F.s] ? cat.bySource[F.s] : cat.byState, ct = Object.keys(cb).reduce(function (a, k) { return a + cb[k]; }, 0);
    var h = '<div class="pt-two"><div><h3 class="rl-h">' + esc(t('priceLayerL')) + ' · ' + obs.length + '</h3>' + (obs.length ? bars(by, obs.length) : '<p class="pt-sub">' + esc(t('none')) + '</p>') + '</div><div><h3 class="rl-h">' + esc(F.s && cat.bySource[F.s] ? tf('catalogSrc', srcName(F.s)) : t('catalogL')) + ' · ' + ct + '</h3>' + bars(cb, ct) + '</div></div>';
    var late = obs.filter(function (o) { return o.freshness !== 'LIVE' && o.freshness !== 'FRESH'; });
    h += '<h3 class="rl-h">' + esc(t('notFresh')) + '</h3>';
    if (!late.length) h += '<p class="pt-note">' + esc(t('allFresh')) + '</p>';
    else h += table([[t('cProd')], [t('cMkt')], [t('cObs')], [t('cAge'), 1], [t('cExp')], [t('cFresh')], [t('cSrc')]], late.slice(0, LIM.late).map(function (o) { return '<tr>' + td(t('cProd'), '<strong>' + prodLink(o) + '</strong>') + td(t('cMkt'), esc(rg(o.region))) + td(t('cObs'), esc(dstr(o.observationDate))) + td(t('cAge'), o.ageDays === null ? '—' : o.ageDays + ' d', true) + td(t('cExp'), esc(dstr(o.expectedNext))) + td(t('cFresh'), fsB(o.freshness)) + td(t('cSrc'), esc(srcName(o.sourceId))) + '</tr>'; })) + pager('late', late.length);
    return sec('freshness', t('freshness'), t('freshHint'), h);
  }
  function secUp(obs) {
    var keys = {}; obs.forEach(function (o) { keys[o.k] = o; });
    var all = DOC.upcoming.filter(function (u) { return keys[u.k]; }), l = all.slice(0, LIM.up), h = '';
    if (l.length) h += table([[t('cProd')], [t('cMkt')], [t('cExp')], [t('cFreq')], [t('cFresh')], [t('cSrc')]], l.map(function (u) { var o = keys[u.k]; return '<tr>' + td(t('cProd'), '<strong>' + prodLink(o) + '</strong>') + td(t('cMkt'), esc(rg(o.region))) + td(t('cExp'), esc(dstr(u.expectedNext))) + td(t('cFreq'), esc(t('freq_' + u.frequency))) + td(t('cFresh'), fsB(u.freshness)) + td(t('cSrc'), esc(srcName(u.sourceId))) + '</tr>'; }));
    if (l.length) h += pager('up', all.length);
    else h += '<p class="pt-note">' + esc(t('none')) + '</p>';
    h += '<h3 class="rl-h">' + esc(t('pipeRuns')) + '</h3><ul class="pt-list">' + DOC.pipelines.next.slice(0, 8).map(function (p) { return '<li>' + esc(p.name) + ' · ' + esc(p.nextRun.replace('T', ' ').replace('Z', ' UTC')) + '</li>'; }).join('') + '</ul>';
    return sec('upcoming', t('upcoming'), t('upHint'), h);
  }
  function secCov() {
    var c = DOC.coverage, h = '<p><strong>' + nf(c.series, 0) + '</strong> ' + esc(t('series')) + ' · <strong>' + c.priceLayer + '</strong> ' + esc(t('priceLayer')) + '</p>';
    if (!c.since) h += '<p class="pt-note">' + esc(t('noSnap')) + '</p>';
    else if (!c.changes.length) h += '<p class="pt-note">' + esc(t('noCovChanges')) + ' (' + esc(t('since')) + ' ' + esc(dstr(c.since)) + ').</p>';
    else h += '<p class="pt-sub">' + esc(t('since')) + ' ' + esc(dstr(c.since)) + '</p><ul class="pt-list">' + c.changes.map(function (x) { var d = x.to - x.from; return '<li>' + esc(x.scope === 'total' ? t('series') : x.key) + ': ' + nf(x.from, 0) + ' → ' + nf(x.to, 0) + ' (<span class="' + (d > 0 ? 'pt-up' : 'pt-down') + '">' + (d > 0 ? '+' : '') + d + '</span>)</li>'; }).join('') + '</ul>';
    return sec('coverage', t('coverage'), t('covHint'), h);
  }
  function secQ() {
    var q = DOC.quality, h = '<div class="pt-cards"><div class="di-card pt-card"><div class="pt-k">' + esc(t('qFiles')) + '</div><div class="pt-v">' + (q.files === null || q.files === undefined ? '—' : q.files) + '</div></div><div class="di-card pt-card"><div class="pt-k">' + esc(t('qErr')) + ' / ' + esc(t('qWarn')) + '</div><div class="pt-v">' + (q.errors === null || q.errors === undefined ? '—' : q.errors) + ' / ' + (q.warnings === null || q.warnings === undefined ? '—' : q.warnings) + '</div></div><div class="di-card pt-card"><div class="pt-k">' + esc(t('qUnexp')) + '</div><div class="pt-v">' + q.unexplained + ' <small>· ' + q.verified + ' ' + esc(t('qVer')) + '</small></div></div></div>';
    if (q.anomalies.length) h += '<ul class="pt-list">' + q.anomalies.map(function (a) { return '<li><span class="pt-badge ' + (a.status === 'UNEXPLAINED_ANOMALY' ? 'pt-fs-DELAYED' : 'pt-fs-LIVE') + '">' + esc(t('an_' + a.status)) + '</span> <strong>' + esc(a.series) + '</strong> — ' + (lang() !== 'es' && a.i18n && a.i18n[lang()] ? '<span title="' + esc(a.detected) + '">' + esc(a.i18n[lang()]) + '</span>' : lang() !== 'es' ? '<span lang="es">' + esc(a.detected) + '</span>' : esc(a.detected)) + '</li>'; }).join('') + '</ul>';
    return sec('quality', t('quality'), t('qHint'), h);
  }
  function secPipes() {
    var p = DOC.pipelines, s = p.summary, h = '<p>' + ['ok', 'late', 'error', 'not_run', 'unknown'].filter(function (k) { return s[k]; }).map(function (k) { return '<span class="pt-badge ' + (k === 'ok' ? 'pt-fs-LIVE' : k === 'error' ? 'pt-fs-STALE' : 'pt-fs-DELAYED') + '">' + s[k] + ' ' + esc(t(k)) + '</span>'; }).join(' ') + ' <span class="pt-sub">/ ' + p.total + ' · ' + esc(dstr(p.generatedAt)) + '</span></p>';
    if (!p.attention.length) h += '<p class="pt-note">' + esc(t('allOk')) + '</p>';
    else h += '<h3 class="rl-h">' + esc(t('attention')) + '</h3><ul class="pt-list">' + p.attention.map(function (x) { return '<li><span class="pt-badge ' + (x.status === 'error' ? 'pt-fs-STALE' : 'pt-fs-DELAYED') + '">' + esc(t(x.status)) + '</span> ' + (x.url ? '<a href="' + esc(x.url) + '" rel="noopener">' + esc(x.name) + '</a>' : esc(x.name)) + (x.lastAt ? ' <span class="pt-sub">· ' + esc(dstr(x.lastAt)) + '</span>' : '') + (x.reason ? '<br><span class="pt-sub">' + esc(t('why')) + ': ' + esc(rs(x.reason)) + '</span>' : '') + '</li>'; }).join('') + '</ul>';
    return sec('pipelines', t('pipelines'), '', h);
  }
  var PEND = null, PSRC = { eurostat_comext: 'Eurostat · Comext', sjv_se: 'Jordbruksverket', ble: 'BLE', statbel: 'Statbel', eurostat: 'Eurostat' };
  function psrc(id) { return PSRC[id] || SRC[id] || String(id || '—').replace(/_/g, ' '); }
  var CDN = {};
  function ctryName(c, d) {
    var L2 = lang();
    if (c === 'EU') return { es: 'Unión Europea', en: 'European Union', fr: 'Union européenne', it: 'Unione europea' }[L2];
    try { CDN[L2] = CDN[L2] || new Intl.DisplayNames([L2], { type: 'region' }); var iso = c === 'EL' ? 'GR' : c === 'UK' ? 'GB' : c, n = CDN[L2].of(iso); return n && n !== iso ? n : d; } catch (e) { return d; }
  }
  function secCtry() {
    if (!PEND) return sec('countries', t('ctry'), t('ctryHint'), '<p class="pt-sub">…</p>');
    if (PEND === 'err') return sec('countries', t('ctry'), '', '<p class="pt-err">' + esc(t('ctryErr')) + '</p>');
    var all = PEND.countries, l = all.slice(0, LIM.ctry);
    var h = '<p class="pt-sub">' + esc(t('ctryNote')) + '</p>' + table([[t('cCountry')], [t('cCov'), 1], [t('cMax'), 1], [t('cWait')]], l.map(function (c) {
      var w = c.waiting.map(function (x) {
        var long = x.daysLate > 120;
        return '<li>' + esc(psrc(x.sourceId)) + ' — ' + esc(t('ctryWait').replace('{0}', x.n).replace('{1}', t('freq_' + x.frequency)).replace('{2}', x.latestPeriod).replace('{3}', dstr(x.expectedSinceMedian)).replace('{4}', x.daysLate)) + (long ? ' <span class="pt-badge pt-fs-STALE">' + esc(t('ctryLong')) + '</span>' : '') + '</li>';
      }).join('');
      var up = c.upcoming.length ? '<p class="pt-sub">' + esc(t('ctryNext')) + ': ' + c.upcoming.slice(0, 3).map(function (u) { return esc(psrc(u.sourceId)) + ' ' + esc(dstr(u.expectedNext)); }).join(' · ') + '</p>' : '';
      return '<tr>' + td(t('cCountry'), '<strong>' + esc(ctryName(c.code, c.name)) + '</strong>') + td(t('cCov'), nf(c.pct, 0) + ' %', true) + td(t('cMax'), c.potentialPct > c.pct ? '<strong>' + nf(c.potentialPct, 0) + ' %</strong>' : '—', true) + td(t('cWait'), (w ? '<ul class="pt-list">' + w + '</ul>' : '<span class="pt-sub">' + esc(t('ctryNone')) + '</span>') + up) + '</tr>';
    }));
    h += pager('ctry', all.length);
    return sec('countries', t('ctry'), t('ctryHint'), h);
  }
  function render(keep) {
    var body = document.getElementById('ob-body'); if (!body) return;
    document.getElementById('ob-h1').textContent = t('title'); document.getElementById('ob-sub').textContent = t('sub'); document.title = t('title') + ' | Dehesa Index';
    if (!DOC) return;
    var obs = DOC.observations.filter(ok), any = F.c || F.p || F.s || F.t;
    var nAct = [F.c, F.p, F.s, F.t].filter(Boolean).length;
    var h = '<p class="pt-sub">' + esc(t('updated')) + ' ' + esc(DOC.generatedAt.replace('T', ' ').replace('Z', ' UTC')) + '</p>';
    h += summary(obs);
    h += '<details class="ob-filt"' + (nAct || OPEN._f ? ' open' : '') + ' data-sec="_f"><summary>🔎 ' + esc(t('filt')) + (nAct ? ' <span class="pt-badge pt-fs-FRESH">' + nAct + ' ' + esc(t('filtOn')) + '</span>' : '') + '</summary><div class="rl-filters">' + filters() + '</div><p class="pt-sub" aria-live="polite">' + obs.length + ' ' + esc(t('shown')) + ' ' + DOC.observations.length + ' ' + esc(t('priceLayer')) + (any ? ' · <button type="button" class="pt-chip" data-reset="1">' + esc(t('reset')) + '</button>' : '') + '</p></details>';
    h += '<h2 class="ob-h2">' + esc(t('gUser')) + '</h2>' + secNew(obs) + secMoves(obs) + secUp(obs) + secCtry() + secFresh(obs);
    h += '<h2 class="ob-h2 ob-h2-tech">' + esc(t('gTech')) + '</h2>' + secRev() + secCov() + secQ() + secPipes();
    body.innerHTML = h;
    var S0 = window.DehesaShared, bh = document.getElementById('ob-bar'); if (S0 && S0.frame && bh) S0.frame.bar(bh, t('barT'), [['new', t('newObs')], ['moves', t('moves')], ['upcoming', t('upcoming')], ['countries', t('ctryTab')], ['freshness', t('freshness')], ['revisions', t('revisions')], ['coverage', t('coverage')], ['quality', t('quality')], ['pipelines', t('pipelines')]]);
    if (!keep && location.hash && /^#[a-z]+$/.test(location.hash)) { var el = document.getElementById(location.hash.slice(1)), dd = el && el.querySelector('details[data-sec]'); if (dd) dd.open = true; if (el && el.scrollIntoView) el.scrollIntoView(); }
  }
  function resetLim() { LIM = { new: STEP, moves: STEP, late: STEP, up: STEP, ctry: STEP }; }
  function onClick(e) {
    var mb = e.target.closest ? e.target.closest('button[data-more]') : null;
    if (mb) { var key = mb.getAttribute('data-more'); LIM[key] += STEP; render(true); var nb = document.querySelector('button[data-more="' + key + '"]'); if (nb && nb.focus) nb.focus({ preventScroll: true }); return; }
    var b = e.target.closest ? e.target.closest('button[data-f],button[data-reset]') : null; if (!b) return;
    resetLim();
    if (b.getAttribute('data-reset')) { F = { c: '', p: '', s: '', t: '', w: F.w }; } else F[b.getAttribute('data-f')] = b.getAttribute('data-v');
    writeUrl(); render();
  }
  function onChange(e) { var el = e.target, f = el.getAttribute && el.getAttribute('data-f'); if (f && el.tagName === 'SELECT') { resetLim(); F[f] = el.value; writeUrl(); render(); } }
  var prevCb = window.DehesaShared.onLangChange;
  function loadTl() { var L0 = window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; if (window.DILabelTl) window.DILabelTl.load(L0).then(function (ok) { if (ok && DOC) render(); }); }
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); loadTl(); };
  loadTl();
  window.DehesaShared.init('informacion');
  readUrl();
  var body = document.getElementById('ob-body'); body.addEventListener('click', onClick); body.addEventListener('change', onChange);
  body.addEventListener('toggle', function (e) { var d = e.target; if (d && d.getAttribute && d.getAttribute('data-sec')) OPEN[d.getAttribute('data-sec')] = d.open; }, true);
  function openSec(id) { var el = document.getElementById(id), d = el && el.querySelector('details[data-sec]'); if (d && !d.open) { d.open = true; OPEN[id] = true; } }
  document.addEventListener('click', function (e) { var a = e.target.closest ? e.target.closest('a[data-open], .di-frame-bar a[data-fr]') : null; if (a) openSec(a.getAttribute('data-open') || a.getAttribute('data-fr')); }, true);
  window.addEventListener('hashchange', function () { if (/^#[a-z]+$/.test(location.hash)) openSec(location.hash.slice(1)); });
  render();
  window.DIObsDoc = fetch('data/observatory.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  window.DIObsDoc.then(function (d) { DOC = d; return window.DIIdentity ? window.DIIdentity.ready().catch(function () { return null; }) : null; }).then(function () { render(); })
    .catch(function () { body.innerHTML = '<p class="pt-err">' + esc(t('err')) + '</p>'; });
  fetch('data/country-pending.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { PEND = d; render(true); }).catch(function () { PEND = 'err'; render(true); });
  window.DIObservatory = { state: function () { return { F: F, doc: DOC }; } };
})();
