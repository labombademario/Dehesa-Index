/* Dehesa Index — Metodología (4 idiomas). Todo lo que afirma esta página describe lo que hace el código y los datos de data/. */
(function () {
  'use strict';
  var STRINGS = {
    es: {
      title: 'Metodología',
      sub: 'Cómo se verifican, fechan y convierten los datos, y cómo se calcula el índice compuesto.',
      sections: [
        { h: 'Principio: solo datos verificables', p: ['Cada cifra del panel viene de una fuente oficial o abierta, con su fecha y un enlace para comprobarla. Si no hay una serie trazable, no se muestra ningún valor: no rellenamos huecos con estimaciones ni con datos de muestra.'] },
        { h: 'Qué significan las etiquetas', id: 'etiquetas', ul: [
          { b: 'REAL.', t: 'Dato verificado en su fuente oficial, con fecha de observación y de publicación.' },
          { b: 'NO COMPARABLE.', t: 'El dato es real, pero su definición no equivale a la del otro mercado. Ejemplos: el precio de EE. UU. de cerdo, vacuno y pollo es en peso vivo, frente a la canal de la UE; los fertilizantes de la UE son índices agregados de nutriente, no un producto concreto. Se muestra con la etiqueta y no entra en comparaciones directas.' },
          { b: 'PENDIENTE.', t: 'Aún no hay una fuente verificable y con licencia adecuada. La tarjeta no muestra cifra hasta que la haya.' }
        ] },
        { h: 'Fuentes y frecuencia', ul: [
          { b: 'EE. UU. — USDA NASS (Quick Stats).', t: 'Precio recibido por el productor, mensual y nacional: trigo, maíz, arroz, leche, huevos, cerdo, vacuno y pollo. NASS publica una vez al mes; consultamos cada semana para no perder ninguna publicación.' },
          { b: 'UE — Comisión Europea, Agri-food Data Portal.', t: 'Precios semanales de mercado con España como referencia (cerdo, vacuno, cordero, pollo, huevos, cereales, aceite de oliva, azúcar, leche, harina de soja, fertilizantes). Los coeficientes por país se calculan con datos reales de la misma semana.' },
          { b: 'Reino Unido — Defra (Open Government Licence v3.0).', t: 'Leche e índices de precios agrarios, mensuales. Los precios semanales de cereales y ganado del Reino Unido los publica AHDB con términos que impiden su uso automático; por eso esas tarjetas figuran como pendientes.' },
          { b: 'Eurostat.', t: 'Índices de precios agrarios de la UE, trimestrales.' },
          { b: 'Energía y fertilizantes.', t: 'Diésel de EE. UU. (EIA, semanal) y de la UE (Oil Bulletin, semanal); urea (Banco Mundial, mensual).' },
          { b: 'Clima — NASA POWER.', t: 'Lluvia y temperatura mensuales (reanálisis MERRA-2) en 12 puntos representativos de regiones productoras, comparadas con la media 2001-2020 del mismo mes, con histórico mensual desde 2000. Los meses más recientes los calcula NASA con otro flujo de procesamiento (GEOS-IT) que puede revisarse. Es contexto climático (una celda de unos 50 km, no una estación ni la región entera); no predice cosechas ni precios.' },
          { b: 'Oferta y demanda — USDA PSD.', t: 'Balances por país y campaña de cereales, oleaginosas, carne, leche y azúcar (licencia CC BY 4.0), mensuales con el WASDE.' },
          { b: 'Tipos de cambio.', t: 'Cotizaciones de referencia del Banco Central Europeo, cada día laborable.' }
        ] },
        { h: 'Fechas: observación y publicación', p: ['Cada dato lleva dos fechas: la de observación (el periodo al que se refiere) y la de publicación (cuándo lo publicó la fuente). Algunas fuentes no informan de su fecha de publicación; en ese caso registramos el día en que recogimos el dato por primera vez y lo anotamos en la ficha.'] },
        { h: 'Monedas y unidades', p: ['Los datos se guardan en la moneda y la unidad de la fuente. Para compararlos, el panel los convierte con el tipo de cambio de referencia del BCE del último día laborable y con factores de unidad fijos y visibles (por ejemplo, 1 docena de huevos = 0,6804 kg). Una conversión no vuelve comparable un dato que no lo es.'] },
        { h: 'Oferta y demanda', id: 'oferta-demanda', p: ['Los balances de producción, consumo, comercio y existencias vienen de USDA Foreign Agricultural Service (PSD Online, licencia CC BY 4.0) y se actualizan con el informe mensual WASDE. La campaña indicada (2025) es la que empieza ese año (2025/26); la más reciente es una previsión que USDA revisa cada mes. "Mundo" es la suma de los países de la base PSD, contando la UE una sola vez; no es una cifra publicada por USDA. Las campañas comerciales no coinciden entre países, y exportaciones e importaciones se declaran por separado, así que el comercio mundial no siempre cuadra. Las cifras van en miles de toneladas (carne en equivalente canal). Sin dato en PSD, no se pinta nada.'] },
        { h: 'Dehesa Index: el índice compuesto', id: 'indice', p: ['Es un índice mensual con base 100 en octubre de 2024, solo para el mercado de la UE. Cada serie verificada se convierte a media mensual y se reexpresa a base 100; cada grupo es la media simple de sus series; el índice es la media ponderada de los grupos: Cereales 25 %, Ganadería 25 %, Lácteos 15 %, Pienso 15 %, Fertilizantes 10 %, Energía 10 %.', 'Como cada serie se reexpresa en su propia unidad, el índice mide evolución, no es un precio y no mezcla monedas. Si una serie tiene un mes sin dato en el origen, se arrastra el mes anterior y queda declarado en el archivo de datos. EE. UU. y Reino Unido se añadirán cuando tengan al menos 24 meses de historia. El panel «Crea tu propio índice» permite cambiar los pesos y compararlos con el oficial.'] },
        { h: 'Limitaciones', ul: [
          { t: 'No son precios en tiempo real: la frecuencia la marca cada fuente (semanal, mensual o trimestral).' },
          { t: 'Los precios de EE. UU. (NASS) son al productor y los de la UE son de mercado; aunque se muestren en la misma moneda, no son siempre el mismo concepto.' },
          { t: 'Las fuentes pueden revisar sus datos o cambiar sus definiciones; reflejamos la última versión publicada.' },
          { t: 'Nada de esto es asesoramiento financiero ni de inversión.' }
        ] },
        { h: 'Datos abiertos y correcciones', p: ['Los archivos con los que se construye el panel están publicados en la carpeta de datos del sitio (JSON y CSV), con la fuente y la metodología de cada serie. Si ves un error o una definición mejorable, escríbenos a hola@dehesaindex.com.'] }
      ],
      links: [{ href: 'clima.html', t: 'Clima agrícola' }, { href: 'data/', t: 'Datos abiertos' }, { href: 'legal.html', t: 'Aviso legal y privacidad' }, { href: 'informacion.html', t: 'Información' }]
    },
    en: {
      title: 'Methodology',
      sub: 'How data is verified, dated and converted, and how the composite index is calculated.',
      sections: [
        { h: 'Principle: verifiable data only', p: ['Every figure on the dashboard comes from an official or open source, with its date and a link to check it. If there is no traceable series, no value is shown: we do not fill gaps with estimates or sample data.'] },
        { h: 'What the labels mean', id: 'etiquetas', ul: [
          { b: 'REAL.', t: 'Data verified at its official source, with observation and publication dates.' },
          { b: 'NOT COMPARABLE.', t: 'The data is real, but its definition is not equivalent to the other market’s. Examples: U.S. hog, cattle and chicken prices are live weight, versus EU carcass weight; EU fertiliser figures are aggregated nutrient indices, not a specific product. It is shown with the label and left out of direct comparisons.' },
          { b: 'PENDING.', t: 'There is no verifiable, properly licensed source yet. The card shows no figure until there is one.' }
        ] },
        { h: 'Sources and frequency', ul: [
          { b: 'U.S. — USDA NASS (Quick Stats).', t: 'Price received by farmers, monthly and national: wheat, corn, rice, milk, eggs, hogs, cattle and chicken. NASS publishes once a month; we check every week so no release is missed.' },
          { b: 'EU — European Commission, Agri-food Data Portal.', t: 'Weekly market prices with Spain as the reference (pork, beef, lamb, chicken, eggs, cereals, olive oil, sugar, milk, soya meal, fertilisers). Country coefficients are computed from real same-week data.' },
          { b: 'UK — Defra (Open Government Licence v3.0).', t: 'Milk and agricultural price indices, monthly. Weekly UK cereal and livestock prices are published by AHDB under terms that prevent automated use, so those cards are shown as pending.' },
          { b: 'Eurostat.', t: 'EU agricultural price indices, quarterly.' },
          { b: 'Energy and fertilisers.', t: 'U.S. diesel (EIA, weekly) and EU diesel (Oil Bulletin, weekly); urea (World Bank, monthly).' },
          { b: 'Climate — NASA POWER.', t: 'Monthly rainfall and temperature (MERRA-2 reanalysis) at 12 representative points in producing regions, compared with the 2001-2020 average for the same month, with monthly history since 2000. The most recent months are computed by NASA with a different processing stream (GEOS-IT) that may be revised. It is climate context (a ~50 km grid cell, not a station or the whole region); it does not forecast crops or prices.' },
          { b: 'Supply and demand — USDA PSD.', t: 'Country balances by marketing year for grains, oilseeds, meat, milk and sugar (CC BY 4.0 licence), monthly with the WASDE.' },
          { b: 'Exchange rates.', t: 'European Central Bank reference rates, every business day.' }
        ] },
        { h: 'Dates: observation and publication', p: ['Each data point carries two dates: observation (the period it refers to) and publication (when the source released it). Some sources do not report a publication date; in that case we record the day we first collected the data and note it on the card.'] },
        { h: 'Currencies and units', p: ['Data is stored in the source’s currency and unit. To compare, the dashboard converts it using the ECB reference rate of the latest business day and fixed, visible unit factors (for example, 1 dozen eggs = 0.6804 kg). A conversion does not make a non-comparable figure comparable.'] },
        { h: 'Supply and demand', id: 'oferta-demanda', p: ['Production, consumption, trade and stock balances come from the USDA Foreign Agricultural Service (PSD Online, CC BY 4.0 licence) and are updated with the monthly WASDE report. The year shown (2025) is the marketing year that starts that year (2025/26); the latest one is a forecast USDA revises every month. "World" is the sum of the countries in the PSD database, counting the EU once; it is not a figure published by USDA. Marketing years differ between countries, and exports and imports are reported separately, so world trade does not always balance. Figures are in thousand tonnes (meat in carcass-weight equivalent). Without PSD data, nothing is drawn.'] },
        { h: 'Dehesa Index: the composite index', id: 'indice', p: ['A monthly index with base 100 in October 2024, for the EU market only. Each verified series is converted to a monthly average and rebased to 100; each group is the simple mean of its series; the index is the weighted mean of the groups: Cereals 25%, Livestock 25%, Dairy 15%, Feed 15%, Fertilisers 10%, Energy 10%.', 'Because each series is rebased in its own unit, the index measures evolution, is not a price and does not mix currencies. If a series has a month missing at the source, the previous month is carried forward and declared in the data file. The U.S. and UK will be added once they have at least 24 months of history. The “Build your own index” panel lets you change the weights and compare them with the official index.'] },
        { h: 'Limitations', ul: [
          { t: 'These are not real-time prices: frequency is set by each source (weekly, monthly or quarterly).' },
          { t: 'U.S. prices (NASS) are farm-gate and EU prices are market prices; even shown in the same currency, they are not always the same concept.' },
          { t: 'Sources may revise their data or change definitions; we show the latest published version.' },
          { t: 'Nothing here is financial or investment advice.' }
        ] },
        { h: 'Open data and corrections', p: ['The files behind the dashboard are published in the site’s data folder (JSON and CSV), with the source and methodology of each series. If you spot an error or a definition that could be better, write to hola@dehesaindex.com.'] }
      ],
      links: [{ href: 'clima.html', t: 'Agricultural climate' }, { href: 'data/', t: 'Open data' }, { href: 'legal.html', t: 'Legal notice & privacy' }, { href: 'informacion.html', t: 'Information' }]
    },
    fr: {
      title: 'Méthodologie',
      sub: 'Comment les données sont vérifiées, datées et converties, et comment l’indice composite est calculé.',
      sections: [
        { h: 'Principe : uniquement des données vérifiables', p: ['Chaque chiffre du tableau de bord provient d’une source officielle ou ouverte, avec sa date et un lien pour le vérifier. Sans série traçable, aucune valeur n’est affichée : nous ne comblons pas les trous avec des estimations ni des données fictives.'] },
        { h: 'Signification des étiquettes', id: 'etiquettes', ul: [
          { b: 'RÉEL.', t: 'Donnée vérifiée à sa source officielle, avec date d’observation et de publication.' },
          { b: 'NON COMPARABLE.', t: 'La donnée est réelle, mais sa définition n’équivaut pas à celle de l’autre marché. Exemples : les prix américains du porc, du bovin et du poulet sont en poids vif, contre le poids carcasse dans l’UE ; les engrais de l’UE sont des indices agrégés d’éléments nutritifs. Elle est affichée avec l’étiquette et exclue des comparaisons directes.' },
          { b: 'EN ATTENTE.', t: 'Il n’existe pas encore de source vérifiable et correctement licenciée. La fiche n’affiche aucun chiffre tant qu’il n’y en a pas.' }
        ] },
        { h: 'Sources et fréquence', ul: [
          { b: 'États-Unis — USDA NASS (Quick Stats).', t: 'Prix reçu par l’agriculteur, mensuel et national : blé, maïs, riz, lait, œufs, porc, bovin et poulet. NASS publie une fois par mois ; nous consultons chaque semaine pour ne manquer aucune publication.' },
          { b: 'UE — Commission européenne, Agri-food Data Portal.', t: 'Prix de marché hebdomadaires avec l’Espagne comme référence (porc, bœuf, agneau, poulet, œufs, céréales, huile d’olive, sucre, lait, tourteau de soja, engrais). Les coefficients par pays sont calculés avec des données réelles de la même semaine.' },
          { b: 'Royaume-Uni — Defra (Open Government Licence v3.0).', t: 'Lait et indices des prix agricoles, mensuels. Les prix hebdomadaires britanniques des céréales et du bétail sont publiés par l’AHDB à des conditions qui interdisent l’usage automatisé ; ces fiches restent donc en attente.' },
          { b: 'Eurostat.', t: 'Indices des prix agricoles de l’UE, trimestriels.' },
          { b: 'Énergie et engrais.', t: 'Diesel américain (EIA, hebdomadaire) et de l’UE (Oil Bulletin, hebdomadaire) ; urée (Banque mondiale, mensuelle).' },
          { b: 'Climat — NASA POWER.', t: 'Pluie et température mensuelles (réanalyse MERRA-2) en 12 points représentatifs de régions productrices, comparées à la moyenne 2001-2020 du même mois, avec un historique mensuel depuis 2000. Les mois les plus récents sont calculés par la NASA avec un autre flux de traitement (GEOS-IT), susceptible d’être révisé. C’est un contexte climatique (une maille d’environ 50 km, pas une station ni la région entière) ; il ne prévoit ni récoltes ni prix.' },
          { b: 'Offre et demande — USDA PSD.', t: 'Bilans par pays et par campagne des céréales, oléagineux, viandes, lait et sucre (licence CC BY 4.0), mensuels avec le WASDE.' },
          { b: 'Taux de change.', t: 'Taux de référence de la Banque centrale européenne, chaque jour ouvré.' }
        ] },
        { h: 'Dates : observation et publication', p: ['Chaque donnée porte deux dates : l’observation (la période concernée) et la publication (quand la source l’a diffusée). Certaines sources n’indiquent pas de date de publication ; nous enregistrons alors le jour où nous avons collecté la donnée pour la première fois et l’indiquons sur la fiche.'] },
        { h: 'Devises et unités', p: ['Les données sont conservées dans la devise et l’unité de la source. Pour les comparer, le tableau de bord les convertit avec le taux de référence de la BCE du dernier jour ouvré et des facteurs d’unité fixes et visibles (par exemple, 1 douzaine d’œufs = 0,6804 kg). Une conversion ne rend pas comparable une donnée qui ne l’est pas.'] },
        { h: 'Offre et demande', id: 'oferta-demanda', p: ['Les bilans de production, consommation, commerce et stocks proviennent de l’USDA Foreign Agricultural Service (PSD Online, licence CC BY 4.0) et sont mis à jour avec le rapport mensuel WASDE. La campagne indiquée (2025) est celle qui commence cette année-là (2025/26) ; la plus récente est une prévision que l’USDA révise chaque mois. « Monde » est la somme des pays de la base PSD, l’UE comptant une fois ; ce n’est pas un chiffre publié par l’USDA. Les campagnes diffèrent selon les pays, et exportations et importations sont déclarées séparément : le commerce mondial ne s’équilibre donc pas toujours. Chiffres en milliers de tonnes (viande en équivalent carcasse). Sans donnée PSD, rien n’est tracé.'] },
        { h: 'Dehesa Index : l’indice composite', id: 'indice', p: ['Un indice mensuel en base 100 en octobre 2024, pour le seul marché de l’UE. Chaque série vérifiée est convertie en moyenne mensuelle et rebasée à 100 ; chaque groupe est la moyenne simple de ses séries ; l’indice est la moyenne pondérée des groupes : Céréales 25 %, Élevage 25 %, Produits laitiers 15 %, Aliments 15 %, Engrais 10 %, Énergie 10 %.', 'Chaque série étant rebasée dans sa propre unité, l’indice mesure une évolution, n’est pas un prix et ne mélange pas les devises. Si une série manque un mois à la source, le mois précédent est reporté et déclaré dans le fichier de données. Les États-Unis et le Royaume-Uni seront ajoutés avec au moins 24 mois d’historique. Le panneau « Créez votre indice » permet de modifier les poids et de les comparer à l’indice officiel.'] },
        { h: 'Limites', ul: [
          { t: 'Ce ne sont pas des prix en temps réel : la fréquence dépend de chaque source (hebdomadaire, mensuelle ou trimestrielle).' },
          { t: 'Les prix américains (NASS) sont départ ferme et ceux de l’UE sont des prix de marché ; même affichés dans la même devise, ce n’est pas toujours le même concept.' },
          { t: 'Les sources peuvent réviser leurs données ou changer leurs définitions ; nous affichons la dernière version publiée.' },
          { t: 'Rien ici ne constitue un conseil financier ou d’investissement.' }
        ] },
        { h: 'Données ouvertes et corrections', p: ['Les fichiers à partir desquels le tableau de bord est construit sont publiés dans le dossier de données du site (JSON et CSV), avec la source et la méthodologie de chaque série. Si vous repérez une erreur ou une définition perfectible, écrivez à hola@dehesaindex.com.'] }
      ],
      links: [{ href: 'clima.html', t: 'Climat agricole' }, { href: 'data/', t: 'Données ouvertes' }, { href: 'legal.html', t: 'Mentions légales et confidentialité' }, { href: 'informacion.html', t: 'Informations' }]
    },
    it: {
      title: 'Metodologia',
      sub: 'Come i dati vengono verificati, datati e convertiti, e come si calcola l’indice composito.',
      sections: [
        { h: 'Principio: solo dati verificabili', p: ['Ogni cifra del pannello proviene da una fonte ufficiale o aperta, con la sua data e un link per verificarla. Se non c’è una serie tracciabile, non viene mostrato alcun valore: non riempiamo i vuoti con stime né con dati campione.'] },
        { h: 'Cosa significano le etichette', id: 'etichette', ul: [
          { b: 'REALE.', t: 'Dato verificato alla fonte ufficiale, con data di osservazione e di pubblicazione.' },
          { b: 'NON COMPARABILE.', t: 'Il dato è reale, ma la sua definizione non equivale a quella dell’altro mercato. Esempi: i prezzi USA di suini, bovini e pollo sono a peso vivo, contro il peso della carcassa nell’UE; i fertilizzanti UE sono indici aggregati di nutrienti. Viene mostrato con l’etichetta ed escluso dai confronti diretti.' },
          { b: 'IN ATTESA.', t: 'Non esiste ancora una fonte verificabile e con licenza adeguata. La scheda non mostra alcuna cifra finché non c’è.' }
        ] },
        { h: 'Fonti e frequenza', ul: [
          { b: 'USA — USDA NASS (Quick Stats).', t: 'Prezzo ricevuto dall’agricoltore, mensile e nazionale: grano, mais, riso, latte, uova, suini, bovini e pollo. NASS pubblica una volta al mese; controlliamo ogni settimana per non perdere nessuna pubblicazione.' },
          { b: 'UE — Commissione europea, Agri-food Data Portal.', t: 'Prezzi di mercato settimanali con la Spagna come riferimento (maiale, manzo, agnello, pollo, uova, cereali, olio d’oliva, zucchero, latte, farina di soia, fertilizzanti). I coefficienti per paese sono calcolati con dati reali della stessa settimana.' },
          { b: 'Regno Unito — Defra (Open Government Licence v3.0).', t: 'Latte e indici dei prezzi agricoli, mensili. I prezzi settimanali britannici di cereali e bestiame sono pubblicati da AHDB con condizioni che vietano l’uso automatico; queste schede restano quindi in attesa.' },
          { b: 'Eurostat.', t: 'Indici dei prezzi agricoli dell’UE, trimestrali.' },
          { b: 'Energia e fertilizzanti.', t: 'Gasolio USA (EIA, settimanale) e UE (Oil Bulletin, settimanale); urea (Banca mondiale, mensile).' },
          { b: 'Clima — NASA POWER.', t: 'Pioggia e temperatura mensili (rianalisi MERRA-2) in 12 punti rappresentativi di regioni produttrici, confrontate con la media 2001-2020 dello stesso mese, con storico mensile dal 2000. I mesi più recenti sono calcolati dalla NASA con un diverso flusso di elaborazione (GEOS-IT) che potrebbe essere rivisto. È contesto climatico (una cella di circa 50 km, non una stazione né l’intera regione); non prevede raccolti né prezzi.' },
          { b: 'Offerta e domanda — USDA PSD.', t: 'Bilanci per paese e campagna di cereali, semi oleosi, carne, latte e zucchero (licenza CC BY 4.0), mensili con il WASDE.' },
          { b: 'Tassi di cambio.', t: 'Tassi di riferimento della Banca centrale europea, ogni giorno lavorativo.' }
        ] },
        { h: 'Date: osservazione e pubblicazione', p: ['Ogni dato ha due date: l’osservazione (il periodo a cui si riferisce) e la pubblicazione (quando la fonte l’ha diffuso). Alcune fonti non indicano la data di pubblicazione; in tal caso registriamo il giorno in cui abbiamo raccolto il dato la prima volta e lo annotiamo nella scheda.'] },
        { h: 'Valute e unità', p: ['I dati sono conservati nella valuta e nell’unità della fonte. Per confrontarli, il pannello li converte con il tasso di riferimento della BCE dell’ultimo giorno lavorativo e con fattori di unità fissi e visibili (ad esempio, 1 dozzina di uova = 0,6804 kg). Una conversione non rende comparabile un dato che non lo è.'] },
        { h: 'Offerta e domanda', id: 'oferta-demanda', p: ['I bilanci di produzione, consumo, commercio e scorte provengono dall’USDA Foreign Agricultural Service (PSD Online, licenza CC BY 4.0) e sono aggiornati con il rapporto mensile WASDE. La campagna indicata (2025) è quella che inizia quell’anno (2025/26); la più recente è una previsione che l’USDA rivede ogni mese. “Mondo” è la somma dei paesi della base PSD, con la UE contata una volta; non è una cifra pubblicata dall’USDA. Le campagne differiscono tra paesi, ed esportazioni e importazioni sono dichiarate separatamente: il commercio mondiale non sempre quadra. Cifre in migliaia di tonnellate (carne in equivalente carcassa). Senza dati PSD, non si disegna nulla.'] },
        { h: 'Dehesa Index: l’indice composito', id: 'indice', p: ['Un indice mensile con base 100 a ottobre 2024, solo per il mercato UE. Ogni serie verificata viene convertita in media mensile e ribasata a 100; ogni gruppo è la media semplice delle sue serie; l’indice è la media ponderata dei gruppi: Cereali 25 %, Zootecnia 25 %, Latticini 15 %, Mangimi 15 %, Fertilizzanti 10 %, Energia 10 %.', 'Poiché ogni serie è ribasata nella propria unità, l’indice misura un andamento, non è un prezzo e non mescola le valute. Se una serie ha un mese mancante alla fonte, si riporta il mese precedente e lo si dichiara nel file dei dati. USA e Regno Unito verranno aggiunti quando avranno almeno 24 mesi di storico. Il pannello «Crea il tuo indice» permette di cambiare i pesi e confrontarli con l’indice ufficiale.'] },
        { h: 'Limiti', ul: [
          { t: 'Non sono prezzi in tempo reale: la frequenza dipende da ciascuna fonte (settimanale, mensile o trimestrale).' },
          { t: 'I prezzi USA (NASS) sono alla produzione e quelli UE sono prezzi di mercato; anche se mostrati nella stessa valuta, non sono sempre lo stesso concetto.' },
          { t: 'Le fonti possono rivedere i dati o cambiare le definizioni; mostriamo l’ultima versione pubblicata.' },
          { t: 'Nulla qui costituisce consulenza finanziaria o di investimento.' }
        ] },
        { h: 'Dati aperti e correzioni', p: ['I file con cui è costruito il pannello sono pubblicati nella cartella dei dati del sito (JSON e CSV), con la fonte e la metodologia di ogni serie. Se noti un errore o una definizione migliorabile, scrivi a hola@dehesaindex.com.'] }
      ],
      links: [{ href: 'clima.html', t: 'Clima agricolo' }, { href: 'data/', t: 'Dati aperti' }, { href: 'legal.html', t: 'Note legali e privacy' }, { href: 'informacion.html', t: 'Informazioni' }]
    }
  };
  window.DehesaTextPage(STRINGS, 'informacion');
})();
