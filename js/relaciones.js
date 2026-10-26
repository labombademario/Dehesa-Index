/* Dehesa Index — Relaciones entre mercados (Cross-Market Intelligence 2.0). ES5.
   Lee data/relationships.json (scripts/build-relationships.py). SOLO descriptivo: cada relacion se muestra con su correlacion de cambios, rezago, n, periodo, cobertura,
   estabilidad del signo, confianza y ultimo movimiento de entrada y mercado. La correlacion (dato) y la hipotesis economica (texto escrito a mano, no demostrado) van SEPARADAS.
   Estado visible: OBSERVED RELATIONSHIP / WEAK OR UNSTABLE / INSUFFICIENT DATA. Estado de la URL: ?ch=&r=&st=&c=&p=&id= */
(function () {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];
  // Estado de frescura y unidad en el idioma de la página (antes salía «LIVE» y «EUR/tonelada» en todos)
  var FS = { LIVE: ['RECIÉN PUBLICADO', 'JUST RELEASED', 'TOUT JUSTE PUBLIÉ', 'APPENA PUBBLICATO'], FRESH: ['AL DÍA', 'FRESH', 'À JOUR', 'AGGIORNATO'], EXPECTED_DELAY: ['RETRASO HABITUAL', 'EXPECTED DELAY', 'RETARD HABITUEL', 'RITARDO ABITUALE'], DELAYED: ['RETRASADO', 'DELAYED', 'EN RETARD', 'IN RITARDO'], STALE: ['DESACTUALIZADO', 'STALE', 'OBSOLÈTE', 'OBSOLETO'], HISTORICAL: ['HISTÓRICA', 'HISTORICAL', 'HISTORIQUE', 'STORICA'], PENDING: ['PENDIENTE', 'PENDING', 'EN ATTENTE', 'IN SOSPESO'] };
  function unitTxt(s) {
    var UM = { tonelada: ['tonelada', 'tonne', 'tonne', 'tonnellata'], litro: ['litro', 'litre', 'litre', 'litro'], '100kg': ['100 kg', '100 kg', '100 kg', '100 kg'], gal: ['galón', 'gallon', 'gallon', 'gallone'], bushel: ['bushel', 'bushel', 'boisseau', 'bushel'], cwt: ['cwt', 'cwt', 'cwt', 'cwt'], kg: ['kg', 'kg', 'kg', 'kg'], docena: ['docena', 'dozen', 'douzaine', 'dozzina'], barril: ['barril', 'barrel', 'baril', 'barile'], mmbtu: ['MMBtu', 'MMBtu', 'MMBtu', 'MMBtu'] };
    var u = UM[s.unit] ? UM[s.unit][{ es: 0, en: 1, fr: 2, it: 3 }[lang()] || 0] : null;
    if (s.currency === 'INDEX') return ({ es: 'índice', en: 'index', fr: 'indice', it: 'indice' })[lang()] + (/2020/.test(s.unit) ? ' 2020=100' : '');
    return (s.currency || '') + '/' + (u || s.unit);
  }
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LANGS.indexOf(lang()); return i < 0 ? 0 : i; }
  var TX = {
    title: ['Relaciones entre insumos y precios agrarios', 'Cross-market relationships', 'Relations entre marchés', 'Relazioni tra mercati'],
    sub: ['Cómo se han movido juntos, en el pasado, los insumos (fertilizantes, energía, pienso), el clima, las existencias y los precios agrarios. Cada relación indica su correlación, rezago, muestra, periodo y estabilidad.', 'How inputs (fertiliser, energy, feed), weather, stocks and farm prices have moved together in the past. Each relationship shows its correlation, lag, sample, period and stability.', 'Comment les intrants (engrais, énergie, aliments), la météo, les stocks et les prix agricoles ont évolué ensemble par le passé. Chaque relation indique sa corrélation, son décalage, son échantillon, sa période et sa stabilité.', 'Come input (fertilizzanti, energia, mangimi), meteo, scorte e prezzi agricoli si sono mossi insieme in passato. Ogni relazione indica correlazione, ritardo, campione, periodo e stabilità.'],
    discl: ['Descriptivo, no predictivo.', 'Descriptive, not predictive.', 'Descriptif, pas prédictif.', 'Descrittivo, non predittivo.'],
    method: ['Cómo se calcula', 'How it is computed', 'Comment c’est calculé', 'Come si calcola'],
    mSummary: ['Correlación de Pearson entre los cambios periodo a periodo del insumo y del mercado (datos semanales promediados por mes). Se prueban unos pocos rezagos fijados por familia y se publica el de mayor |r|: es el mejor de varios, así que la correlación es optimista y se declara.', 'Pearson correlation between period-over-period changes of the input and the market (weekly data averaged by month). A few lags fixed per family are tested and the one with the largest |r| is published: it is the best of several, so the correlation is optimistic and says so.', 'Corrélation de Pearson entre les variations d’une période à l’autre de l’intrant et du marché (données hebdomadaires moyennées par mois). Quelques décalages fixés par famille sont testés et celui au |r| le plus grand est publié : c’est le meilleur de plusieurs, la corrélation est donc optimiste et le dit.', 'Correlazione di Pearson tra le variazioni da un periodo all’altro dell’input e del mercato (dati settimanali mediati per mese). Si provano pochi ritardi fissati per famiglia e si pubblica quello con |r| maggiore: è il migliore tra diversi, quindi la correlazione è ottimistica e lo dichiara.'],
    mRules: ['Estado: OBSERVED RELATIONSHIP si hay muestra suficiente, |r| ≥ 0,2 y el signo se mantiene en al menos la mitad de las ventanas; WEAK OR UNSTABLE si no; INSUFFICIENT DATA con menos de 24 meses (12 trimestres). Confianza: describe lo bien que se sostiene la asociación estadística, no la hipótesis económica ni una probabilidad.', 'Status: OBSERVED RELATIONSHIP with enough data, |r| ≥ 0.2 and the sign holding in at least half the windows; WEAK OR UNSTABLE otherwise; INSUFFICIENT DATA below 24 months (12 quarters). Confidence: describes how well the statistical association holds, not the economic hypothesis nor a probability.', 'Statut : OBSERVED RELATIONSHIP avec assez de données, |r| ≥ 0,2 et le signe tenant dans au moins la moitié des fenêtres ; WEAK OR UNSTABLE sinon ; INSUFFICIENT DATA sous 24 mois (12 trimestres). Confiance : décrit la solidité de l’association statistique, pas l’hypothèse économique ni une probabilité.', 'Stato: OBSERVED RELATIONSHIP con dati sufficienti, |r| ≥ 0,2 e segno stabile in almeno metà delle finestre; WEAK OR UNSTABLE altrimenti; INSUFFICIENT DATA sotto 24 mesi (12 trimestri). Confidenza: descrive quanto regge l’associazione statistica, non l’ipotesi economica né una probabilità.'],
    mCur: ['Si las dos series tienen moneda distinta, ambas se pasan a EUR con el tipo mensual del BCE (mes exacto o el anterior, máximo 2 meses). Sin causalidad: la hipótesis económica es una explicación plausible escrita a mano que estos datos no prueban.', 'If the two series have different currencies both are converted to EUR with the ECB monthly rate (exact month or previous, at most 2 months). No causality: the economic hypothesis is a plausible hand-written explanation that these data do not prove.', 'Si les deux séries ont des devises différentes, toutes deux sont converties en EUR au taux mensuel de la BCE (mois exact ou précédent, 2 mois maximum). Pas de causalité : l’hypothèse économique est une explication plausible rédigée à la main que ces données ne prouvent pas.', 'Se le due serie hanno valuta diversa, entrambe sono convertite in EUR con il cambio mensile della BCE (mese esatto o precedente, al massimo 2 mesi). Nessuna causalità: l’ipotesi economica è una spiegazione plausibile scritta a mano che questi dati non dimostrano.'],
    fCh: ['Canal', 'Channel', 'Canal', 'Canale'], fReg: ['Mercado', 'Market', 'Marché', 'Mercato'], fSt: ['Estado', 'Status', 'Statut', 'Stato'], fProd: ['Producto', 'Product', 'Produit', 'Prodotto'], fConf: ['Confianza', 'Confidence', 'Confiance', 'Confidenza'],
    all: ['Todos', 'All', 'Tous', 'Tutti'],
    ch_fertilizer: ['Fertilizante', 'Fertiliser', 'Engrais', 'Fertilizzante'], ch_energy: ['Energía', 'Energy', 'Énergie', 'Energia'], ch_feed: ['Pienso', 'Feed', 'Aliments', 'Mangimi'], ch_feedstock: ['Materia prima', 'Feedstock', 'Matière première', 'Materia prima'], ch_weather: ['Clima', 'Weather', 'Météo', 'Meteo'], ch_stocks: ['Existencias', 'Stocks', 'Stocks', 'Scorte'], ch_crude: ['Petróleo', 'Crude oil', 'Pétrole', 'Petrolio'], ch_substitute: ['Productos sustitutivos', 'Substitutes', 'Produits de substitution', 'Prodotti sostitutivi'], ch_trade: ['Comercio mundial', 'World trade', 'Commerce mondial', 'Commercio mondiale'], ch_processing: ['Industria láctea', 'Dairy processing', 'Industrie laitière', 'Industria lattiero-casearia'], ch_biofuel: ['Biocombustibles', 'Biofuels', 'Biocarburants', 'Biocarburanti'],
    chH: ['⛓️ Efectos en cadena', '⛓️ Knock-on effects', '⛓️ Effets en chaîne', '⛓️ Effetti a catena'],
    chN: ['Qué precios han seguido a otros, paso a paso: cuando se movió el primero, el segundo tendió a acompañarlo, y después el tercero. Cada paso es una relación medida por separado (pulsa para verla); no sumamos ni multiplicamos efectos.', 'Which prices have followed others, step by step: when the first moved, the second tended to go along, and then the third. Each step is a separately measured relationship (tap to see it); we do not add up or multiply effects.', 'Quels prix en ont suivi d’autres, étape par étape : quand le premier a bougé, le deuxième a eu tendance à suivre, puis le troisième. Chaque étape est une relation mesurée séparément (touchez pour la voir) ; nous n’additionnons ni ne multiplions les effets.', 'Quali prezzi ne hanno seguiti altri, passo dopo passo: quando il primo si è mosso, il secondo ha teso ad accompagnarlo, e poi il terzo. Ogni passo è una relazione misurata a parte (tocca per vederla); non sommiamo né moltiplichiamo gli effetti.'],
    chMore: ['Ver todas las cadenas', 'Show all chains', 'Voir toutes les chaînes', 'Vedi tutte le catene'],
    st_OBSERVED_RELATIONSHIP: ['OBSERVED RELATIONSHIP', 'OBSERVED RELATIONSHIP', 'OBSERVED RELATIONSHIP', 'OBSERVED RELATIONSHIP'],
    st_WEAK_OR_UNSTABLE: ['WEAK OR UNSTABLE', 'WEAK OR UNSTABLE', 'WEAK OR UNSTABLE', 'WEAK OR UNSTABLE'],
    st_INSUFFICIENT_DATA: ['INSUFFICIENT DATA', 'INSUFFICIENT DATA', 'INSUFFICIENT DATA', 'INSUFFICIENT DATA'],
    stl_OBSERVED_RELATIONSHIP: ['Relación observada', 'Observed relationship', 'Relation observée', 'Relazione osservata'], stl_WEAK_OR_UNSTABLE: ['Débil o inestable', 'Weak or unstable', 'Faible ou instable', 'Debole o instabile'], stl_INSUFFICIENT_DATA: ['Datos insuficientes', 'Insufficient data', 'Données insuffisantes', 'Dati insufficienti'],
    conf_HIGH: ['Confianza alta', 'High confidence', 'Confiance élevée', 'Confidenza alta'], conf_MEDIUM: ['Confianza media', 'Medium confidence', 'Confiance moyenne', 'Confidenza media'], conf_LOW: ['Confianza baja', 'Low confidence', 'Confiance faible', 'Confidenza bassa'],
    INPUT: ['INSUMO', 'INPUT', 'INTRANT', 'INPUT'], CHANNEL: ['CANAL', 'CHANNEL', 'CANAL', 'CANALE'], MARKET: ['MERCADO', 'MARKET', 'MARCHÉ', 'MERCATO'],
    corr: ['Correlación', 'Correlation', 'Corrélation', 'Correlazione'], dir: ['Dirección', 'Direction', 'Sens', 'Direzione'], lag: ['Rezago', 'Lag', 'Décalage', 'Ritardo'], n: ['Observaciones', 'Observations', 'Observations', 'Osservazioni'],
    period: ['Periodo', 'Period', 'Période', 'Periodo'], cov: ['Cobertura', 'Coverage', 'Couverture', 'Copertura'], stab: ['Estabilidad del signo', 'Sign stability', 'Stabilité du signe', 'Stabilità del segno'], recent: ['Correlación últimos 36 periodos', 'Correlation, last 36 periods', 'Corrélation, 36 dernières périodes', 'Correlazione, ultimi 36 periodi'],
    lastIn: ['Último movimiento del insumo', 'Last input move', 'Dernier mouvement de l’intrant', 'Ultimo movimento dell’input'], lastMk: ['Último movimiento del mercado', 'Last market move', 'Dernier mouvement du marché', 'Ultimo movimento del mercato'],
    d_positive: ['mismo sentido', 'same direction', 'même sens', 'stessa direzione'], d_negative: ['sentido contrario', 'opposite', 'sens inverse', 'direzione opposta'], d_none: ['sin asociación lineal clara', 'no clear linear association', 'pas d’association linéaire claire', 'nessuna associazione lineare chiara'],
    s_negligible: ['insignificante', 'negligible', 'négligeable', 'trascurabile'], s_weak: ['débil', 'weak', 'faible', 'debole'], s_moderate: ['moderada', 'moderate', 'modérée', 'moderata'], s_strong: ['fuerte', 'strong', 'forte', 'forte'],
    sameP: ['mismo periodo', 'same period', 'même période', 'stesso periodo'], mon: ['m', 'mo', 'm', 'm'], qtr: ['T', 'Q', 'T', 'T'], yr: ['a', 'y', 'a', 'a'],
    q: ['¿Qué precio quieres entender?', 'Which price do you want to understand?', 'Quel prix voulez-vous comprendre ?', 'Quale prezzo vuoi capire?'],
    qsub: ['Elige un producto y verás qué lo ha acompañado en el pasado: fertilizantes, energía, pienso, clima, existencias, comercio mundial o productos parecidos.', 'Pick a product to see what has moved with it in the past: fertiliser, energy, feed, weather or stocks.', 'Choisissez un produit pour voir ce qui a évolué avec lui par le passé : engrais, énergie, aliments, météo ou stocks.', 'Scegli un prodotto per vedere cosa si è mosso con lui in passato: fertilizzanti, energia, mangimi, meteo o scorte.'],
    ph: ['Prueba con «cebada», «diésel» o «Canadá»', 'Try “barley”, “diesel” or “Canada”', 'Essayez « orge », « diesel » ou « Canada »', 'Prova con «orzo», «gasolio» o «Canada»'],
    go: ['Buscar', 'Search', 'Rechercher', 'Cerca'], prods: ['O elige un producto', 'Or pick a product', 'Ou choisissez un produit', 'Oppure scegli un prodotto'],
    moreF: ['Más filtros', 'More filters', 'Plus de filtres', 'Altri filtri'],
    sumF: ['{n} de {tot} relaciones · {s} fiables · {w} poco fiables', '{n} of {tot} relationships · {s} reliable · {w} less reliable', '{n} relations sur {tot} · {s} fiables · {w} peu fiables', '{n} relazioni su {tot} · {s} affidabili · {w} poco affidabili'],
    solidH: ['Relaciones más sólidas', 'Strongest relationships', 'Relations les plus solides', 'Relazioni più solide'],
    weakH: ['Relaciones poco fiables', 'Less reliable relationships', 'Relations peu fiables', 'Relazioni poco affidabili'],
    weakN: ['Tienen confianza baja, son débiles o inestables, o tienen pocos datos. Se muestran por transparencia: conviene no apoyarse en ellas.', 'They have low confidence, are weak or unstable, or rest on little data. They are shown for transparency: better not to rely on them.', 'Elles ont une confiance faible, sont faibles ou instables, ou reposent sur peu de données. Elles sont affichées par transparence : mieux vaut ne pas s’y fier.', 'Hanno confidenza bassa, sono deboli o instabili o poggiano su pochi dati. Sono mostrate per trasparenza: meglio non fidarsi.'],
    detail: ['Ver detalle técnico', 'Show technical detail', 'Voir le détail technique', 'Vedi dettaglio tecnico'], chan: ['Canal', 'Channel', 'Canal', 'Canale'],
    nsol: ['Ninguna relación sólida con estos filtros.', 'No strong relationship with these filters.', 'Aucune relation solide avec ces filtres.', 'Nessuna relazione solida con questi filtri.'],
    obsN: ['observaciones', 'observations', 'observations', 'osservazioni'], corrAria: ['Correlación', 'Correlation', 'Corrélation', 'Correlazione'], fil: ['Filtros activos', 'Active filters', 'Filtres actifs', 'Filtri attivi'],
    obsH: ['Lo observado (estadística)', 'What was observed (statistics)', 'Ce qui a été observé (statistiques)', 'Ciò che si è osservato (statistica)'],
    hypH: ['Hipótesis económica (no demostrada)', 'Economic hypothesis (not proven)', 'Hypothèse économique (non démontrée)', 'Ipotesi economica (non dimostrata)'],
    lrH: ['Largo plazo: niveles y cambios a 12 meses', 'Long run: levels and 12-month changes', 'Long terme : niveaux et variations sur 12 mois', 'Lungo periodo: livelli e variazioni a 12 mesi'],
    lrN: ['Aquí se compara el mismo mes, sin rezago. Los niveles que suben juntos dan una correlación alta sin que una serie mueva a la otra, y los cambios a 12 meses se solapan (cada uno comparte 11 meses con el siguiente), así que las observaciones independientes son bastante menos que los meses: la última columna da el orden de magnitud. Con esto no se calcula estado ni confianza. Describe el pasado y no prueba causas.', 'The same month is compared, with no lag. Levels that rise together give a high correlation without one series moving the other, and 12-month changes overlap (each shares 11 months with the next), so independent observations are far fewer than the months: the last column gives the order of magnitude. No status or confidence is computed from this. It describes the past and does not prove causes.', 'On compare le même mois, sans décalage. Des niveaux qui montent ensemble donnent une corrélation élevée sans qu’une série entraîne l’autre, et les variations sur 12 mois se chevauchent (chacune partage 11 mois avec la suivante) : les observations indépendantes sont bien moins nombreuses que les mois ; la dernière colonne en donne l’ordre de grandeur. Aucun statut ni confiance n’en est tiré. Cela décrit le passé et ne prouve pas de causes.', 'Si confronta lo stesso mese, senza ritardo. Livelli che salgono insieme danno una correlazione alta senza che una serie muova l’altra, e le variazioni a 12 mesi si sovrappongono (ognuna condivide 11 mesi con la successiva), quindi le osservazioni indipendenti sono molte meno dei mesi: l’ultima colonna ne dà l’ordine di grandezza. Da questo non si ricava stato né confidenza. Descrive il passato e non prova cause.'],
    lrCols: [['Tramo', 'Nivel', 'Cambio 12 m', 'Meses', 'Indep. aprox.'], ['Span', 'Level', '12-month change', 'Months', 'Indep. approx.'], ['Tronçon', 'Niveau', 'Variation 12 mois', 'Mois', 'Indép. approx.'], ['Tratto', 'Livello', 'Variazione 12 mesi', 'Mesi', 'Indip. appross.']],
    lrAll: ['Todo el periodo', 'Whole period', 'Toute la période', 'Intero periodo'], lrBef: ['Antes de 2021', 'Before 2021', 'Avant 2021', 'Prima del 2021'], lrSin: ['Desde 2021', 'Since 2021', 'Depuis 2021', 'Dal 2021'],
    lagH: ['Correlación por rezago probado', 'Correlation by tested lag', 'Corrélation par décalage testé', 'Correlazione per ritardo provato'],
    pend: ['pendiente', 'pending', 'en attente', 'in sospeso'], none: ['Ninguna relación coincide con los filtros.', 'No relationship matches the filters.', 'Aucune relation ne correspond aux filtres.', 'Nessuna relazione corrisponde ai filtri.'],
    count: ['relaciones', 'relationships', 'relations', 'relazioni'], reset: ['Quitar filtros', 'Clear filters', 'Effacer les filtres', 'Rimuovi filtri'],
    err: ['No se pudo cargar data/relationships.json.', 'Could not load data/relationships.json.', 'Impossible de charger data/relationships.json.', 'Impossibile caricare data/relationships.json.'],
    gen: ['Calculado', 'Computed', 'Calculé', 'Calcolato'], fresh: ['Frescura', 'Freshness', 'Fraîcheur', 'Freschezza'], src: ['Fuente', 'Source', 'Source', 'Fonte'], open: ['Ver ficha', 'Open page', 'Voir la fiche', 'Apri scheda'], link: ['enlace', 'link', 'lien', 'link']
  };
  function t(k) { var v = TX[k]; return v ? v[li()] : k; }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function L(o) { return o ? (o[lang()] || o.en || '') : ''; }
  var PAGE = { trigo: 'trigo', maiz: 'maiz', leche: 'leche', vaca: 'vacuno', urea: 'urea', diesel: 'diesel', harina_soja: 'soja', cerdo: 'cerdo', cebada: 'cebada', avena: 'avena', colza: 'colza', pollo: 'pollo', huevos: 'huevos', azucar: 'azucar', dap: 'fertilizantes', potasa: 'fertilizantes' };
  var DOC = null, F = { ch: '', r: '', st: '', c: '', p: '', id: '', g: '', q: '' }, weakOpen = false;
  // temas del mercado (lado «precio» de cada relación): cada botón agrupa los productos equivalentes
  var GRP = [['wheat', '🌾', ['trigo', 'defra_wheat_output_index', 'eurostat_cereals_output_index']], ['maize', '🌽', ['maiz', 'sorgo']], ['milk', '🥛', ['leche', 'leche_polvo', 'defra_milk_output_index']], ['cattle', '🐄', ['vaca', 'cordero', 'defra_cattle_output_index']], ['barley', '🌱', ['cebada', 'defra_barley_output_index', 'avena']], ['oilseed', '🌼', ['colza', 'defra_oilseed_rape_output_index']], ['pigs', '🐖', ['cerdo', 'defra_pigs_output_index']], ['poultry', '🐔', ['pollo', 'huevos']], ['fert', '🧪', ['urea', 'dap', 'potasa', 'eurostat_fertiliser_input_index']], ['energy', '⛽', ['diesel', 'gas_natural']]];
  var GN = { wheat: ['Trigo y cereales', 'Wheat and cereals', 'Blé et céréales', 'Grano e cereali'], maize: ['Maíz y sorgo', 'Maize and sorghum', 'Maïs et sorgho', 'Mais e sorgo'], milk: ['Leche', 'Milk', 'Lait', 'Latte'], cattle: ['Vacuno y cordero', 'Cattle and lamb', 'Bovins et agneau', 'Bovini e agnello'], barley: ['Cebada y avena', 'Barley and oats', 'Orge et avoine', 'Orzo e avena'], oilseed: ['Colza', 'Rapeseed and canola', 'Colza', 'Colza'], pigs: ['Cerdo', 'Pigs', 'Porc', 'Suini'], poultry: ['Pollo y huevos', 'Chicken and eggs', 'Poulet et œufs', 'Pollo e uova'], energy: ['Gasóleo y gas', 'Diesel and gas', 'Gazole et gaz', 'Gasolio e gas'], fert: ['Fertilizantes', 'Fertiliser', 'Engrais', 'Fertilizzanti'] };
  var LU = { month: [['mes', 'meses'], ['month', 'months'], ['mois', 'mois'], ['mese', 'mesi']], quarter: [['trimestre', 'trimestres'], ['quarter', 'quarters'], ['trimestre', 'trimestres'], ['trimestre', 'trimestri']], year: [['año', 'años'], ['year', 'years'], ['an', 'ans'], ['anno', 'anni']] };
  var SN = {
    rel: ['{a} y {b} se han movido {d}{lag}: correlación {r} ({s}), de {p0} a {p1}.', '{a} and {b} have moved {d}{lag}: correlation {r} ({s}), {p0} to {p1}.', '{a} et {b} ont évolué {d}{lag} : corrélation {r} ({s}), de {p0} à {p1}.', '{a} e {b} si sono mossi {d}{lag}: correlazione {r} ({s}), da {p0} a {p1}.'],
    none: ['{a} y {b} no muestran una relación lineal clara entre {p0} y {p1} (correlación {r}).', '{a} and {b} show no clear linear relationship between {p0} and {p1} (correlation {r}).', '{a} et {b} ne montrent pas de relation linéaire claire entre {p0} et {p1} (corrélation {r}).', '{a} e {b} non mostrano una relazione lineare chiara tra {p0} e {p1} (correlazione {r}).'],
    lag: [', con {n} {u} de rezago', ', with a lag of {n} {u}', ', avec un décalage de {n} {u}', ', con un ritardo di {n} {u}'],
    dp: ['en el mismo sentido', 'in the same direction', 'dans le même sens', 'nella stessa direzione'], dn: ['en sentido contrario', 'in opposite directions', 'en sens inverse', 'in direzione opposta']
  };
  function fm(str, o) { return str.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function sentence(x) {
    var s = x.stat, i = li(), lag = '', un = LU[s.lagUnit] ? LU[s.lagUnit][i][s.lag === 1 ? 0 : 1] : '';
    if (s.lag > 0) lag = fm(SN.lag[i], { n: s.lag, u: un });
    var o = { a: L(x.input.label), b: L(x.market.label), r: s.correlation === null ? '—' : nf(s.correlation, 2), s: t('s_' + s.strength), p0: s.periodStart, p1: s.periodEnd, lag: lag, d: s.direction === 'negative' ? SN.dn[i] : SN.dp[i] };
    return fm(s.direction === 'none' || x.status === 'INSUFFICIENT_DATA' ? SN.none[i] : SN.rel[i], o);
  }
  function norm(v) { return String(v).normalize ? String(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() : String(v).toLowerCase(); }
  function hay(x) {
    if (x._h) return x._h;
    var a = []; [x.input, x.market].forEach(function (sd) { LANGS.forEach(function (lg) { a.push(sd.label[lg] || ''); if (DOC.regions[sd.region]) a.push(DOC.regions[sd.region][lg] || ''); }); a.push(sd.product); });
    var ch = DOC.channels[x.channel]; if (ch) LANGS.forEach(function (lg) { a.push(ch[lg] || ''); });
    return (x._h = norm(a.join(' ')));
  }
  var CONF_ICON = { HIGH: '●●●', MEDIUM: '●●○', LOW: '●○○' };

  function readUrl() { var q = new URLSearchParams(location.search); for (var k in F) F[k] = q.get(k) || ''; }
  function writeUrl() {
    var q = new URLSearchParams(); for (var k in F) if (F[k]) q.set(k, F[k]);
    var s = q.toString(); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) {}
  }
  var FLG = { us: '🇺🇸', eu: '🇪🇺', uk: '🇬🇧', ca: '🇨🇦', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', au: '🇦🇺' };
  function flagName(r) { return (FLG[r] ? FLG[r] + ' ' : '') + regionName(r); }
  function regionName(r) { return DOC.regions[r] ? L(DOC.regions[r]) : r.toUpperCase(); }
  function sidesOf(x) { return [x.input, x.market]; }
  function matches(x) {
    if (F.id) return x.id === F.id;
    if (F.ch && x.channel !== F.ch) return false;
    if (F.st && x.status !== F.st) return false;
    if (F.c && x.confidence !== F.c) return false;
    if (F.r && x.input.region !== F.r && x.market.region !== F.r) return false;
    if (F.g) { var gg = GRP.filter(function (q) { return q[0] === F.g; })[0]; if (gg && gg[2].indexOf(x.market.product) < 0) return false; }
    if (F.q) { var h = hay(x); if (norm(F.q).split(/\s+/).some(function (w) { return w && h.indexOf(w) < 0; })) return false; }
    if (F.p && x.input.product !== F.p && x.market.product !== F.p && PAGE[x.input.product] !== F.p && PAGE[x.market.product] !== F.p) return false;
    return true;
  }
  function chip(group, val, label, on) { return '<button type="button" class="pt-chip" aria-pressed="' + (!!on) + '" data-f="' + group + '" data-v="' + esc(val) + '">' + esc(label) + '</button>'; }
  function uniq(list) { var o = {}, r = []; list.forEach(function (x) { if (!o[x]) { o[x] = 1; r.push(x); } }); return r; }
  function filters() {
    var rels = DOC.relationships, chs = uniq(rels.map(function (x) { return x.channel; })), regs = uniq([].concat.apply([], rels.map(function (x) { return [x.input.region, x.market.region]; }))).sort();
    var grp = function (key, label, inner) { return '<div class="pt-bar-ctl" role="group" aria-label="' + esc(label) + '"><span class="pt-lbl">' + esc(label) + '</span>' + inner + '</div>'; };
    return grp('r', t('fReg'), chip('r', '', t('all'), !F.r) + regs.map(function (r) { return chip('r', r, flagName(r), F.r === r); }).join('')) +
      grp('ch', t('fCh'), chip('ch', '', t('all'), !F.ch) + chs.map(function (c) { return chip('ch', c, t('ch_' + c), F.ch === c); }).join('')) +
      grp('st', t('fSt'), chip('st', '', t('all'), !F.st) + ['OBSERVED_RELATIONSHIP', 'WEAK_OR_UNSTABLE', 'INSUFFICIENT_DATA'].map(function (s2) { return chip('st', s2, t('stl_' + s2), F.st === s2); }).join('')) +
      grp('c', t('fConf'), chip('c', '', t('all'), !F.c) + ['HIGH', 'MEDIUM', 'LOW'].map(function (s2) { return chip('c', s2, t('conf_' + s2), F.c === s2); }).join(''));
  }
  function nFilters() { return ['ch', 'r', 'st', 'c'].filter(function (k) { return F[k]; }).length; }
  function prodLabel(p) {
    for (var i = 0; i < DOC.relationships.length; i++) { var s = sidesOf(DOC.relationships[i]); for (var j = 0; j < 2; j++) if ((PAGE[s[j].product] || s[j].product) === p) return L(s[j].label); }
    return p;
  }
  function mv(m) {
    if (!m) return '—';
    var c = m.changePct, cls = c === null ? 'pt-flat' : c > 0 ? 'pt-up' : c < 0 ? 'pt-down' : 'pt-flat';
    return esc(m.period) + ' · ' + (c === null ? '—' : '<span class="' + cls + '">' + (c > 0 ? '+' : '') + nf(c, 1) + ' %</span>');
  }
  function side(kind, s, fresh) {
    var pg = PAGE[s.product], name = esc(L(s.label));
    var nm = pg ? '<a href="producto.html?p=' + pg + '">' + name + '</a>' : name;
    return '<div class="rl-node rl-' + kind + '"><span class="rl-ctry">' + esc(flagName(s.region)) + '</span><span class="pt-k">' + esc(t(kind.toUpperCase())) + '</span><strong>' + nm + '</strong><span class="pt-sub">' + (ci(s.sourceId) || esc(s.sourceId || '')) + (s.unit ? ' · ' + esc(unitTxt(s)) : '') + '</span><span class="pt-badge pt-fs-' + esc(fresh) + '">' + esc(FS[fresh] ? FS[fresh][{ es: 0, en: 1, fr: 2, it: 3 }[lang()] || 0] : fresh) + '</span></div>';
  }
  function lagUnit(x, n) { return n + ' ' + (x.frequency === 'monthly' ? t('mon') : x.frequency === 'annual' ? t('yr') : t('qtr')); }
  function profile(x) {
    var s = x.stat, mx = 0.05; s.lagProfile.forEach(function (p) { if (p[1] !== null && Math.abs(p[1]) > mx) mx = Math.abs(p[1]); });
    var h = '<div class="pt-bars rl-prof" role="img" aria-label="' + esc(t('lagH')) + '">';
    s.lagProfile.forEach(function (p) {
      var r = p[1], w = r === null ? 0 : Math.round(Math.abs(r) / mx * 100), cur = p[0] === s.lag;
      h += '<div class="pt-row"><span class="n">' + esc(p[0] === 0 ? t('sameP') : lagUnit(x, p[0])) + (cur ? ' ◀' : '') + '</span><span class="rl-barwrap"><i class="' + (r !== null && r < 0 ? 'neg' : '') + '" style="width:' + w + '%"></i></span><span>' + (r === null ? '—' : nf(r, 2)) + ' <span class="pt-sub">n=' + p[2] + '</span></span></div>';
    });
    return h + '</div>';
  }
  function detail(x) {
    var s = x.stat, fam = DOC.families[x.family], ok = x.status !== 'INSUFFICIENT_DATA';
    var h = '<div class="rl-flow">' + side('input', x.input, x.freshness.input) + '<span class="rl-arrow" aria-hidden="true">→</span><div class="rl-node rl-channel"><span class="pt-k">' + esc(t('CHANNEL')) + '</span><strong>' + esc(L(DOC.channels[x.channel])) + '</strong></div><span class="rl-arrow" aria-hidden="true">→</span>' + side('market', x.market, x.freshness.market) + '</div>';
    h += '<p class="rl-badges"><span class="pt-badge rl-st-' + x.status + '">' + esc(t('stl_' + x.status)) + '</span></p>';
    h += '<h3 class="rl-h">' + esc(t('obsH')) + '</h3><p class="rl-expl">' + esc(L(x.explanation)) + '</p><dl class="rl-stats">';
    function kv(k, v) { return '<div><dt>' + esc(t(k)) + '</dt><dd>' + v + '</dd></div>'; }
    h += kv('corr', s.correlation === null ? '—' : '<strong>' + nf(s.correlation, 2) + '</strong> <span class="pt-sub">' + esc(t('s_' + s.strength)) + '</span>');
    h += kv('dir', esc(t('d_' + s.direction)));
    h += kv('lag', ok ? esc(s.lag === 0 ? t('sameP') : lagUnit(x, s.lag)) : '—');
    h += kv('n', s.n + ' <span class="pt-sub">/ ' + s.lagsTested + ' ' + esc(t('lag').toLowerCase()) + '</span>');
    h += kv('period', esc(s.periodStart + ' – ' + s.periodEnd));
    h += kv('cov', nf(s.coverage * 100, 0) + ' %');
    h += kv('stab', s.signStability === null ? '—' : nf(s.signStability * 100, 0) + ' % <span class="pt-sub">(' + s.windows + ')</span>');
    h += kv('recent', s.recentCorrelation === null ? '—' : nf(s.recentCorrelation, 2));
    h += kv('lastIn', x.stat.inputTransform === 'anomaly' && x.last.input ? esc(x.last.input.period) + ' · ' + (x.last.input.value > 0 ? '+' : '') + nf(x.last.input.value, 1) + ' ' + (x.input.unit.charAt(0) === '%' ? '%' : '°C') : mv(x.last.input)); h += kv('lastMk', mv(x.last.market));
    h += '</dl><h3 class="rl-h">' + esc(t('hypH')) + '</h3><p class="rl-hyp">' + esc(L(fam.hypothesis)) + '</p>';
    h += '<details class="rl-det"><summary>' + esc(t('lagH')) + '</summary>' + profile(x) + '</details>';
    if (x.longRun) {
      var lc = TX.lrCols[li()], rows = [['lrAll', x.longRun.all], ['lrBef', x.longRun.before], ['lrSin', x.longRun.since]].filter(function (q) { return q[1]; });
      h += '<details class="rl-det"><summary>' + esc(t('lrH')) + '</summary><div style="overflow-x:auto"><table class="mi-t" data-no-rows><thead><tr>' + lc.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (q) { var o = q[1]; return '<tr><td>' + esc(t(q[0])) + '<div class="pt-sub">' + esc(o.periodStart + ' – ' + o.periodEnd) + '</div></td><td>' + (o.level === null ? '—' : nf(o.level, 2)) + '</td><td>' + (o.yoy === null ? '—' : nf(o.yoy, 2)) + '</td><td>' + o.n + '</td><td>≈ ' + nf(o.effN, 0) + '</td></tr>'; }).join('') +
        '</tbody></table></div><p class="pt-src">' + esc(t('lrN')) + '</p></details>';
    }
    return h + '<p class="pt-src">' + esc(t('discl')) + ' <a href="#r-' + esc(x.id) + '" data-copy="' + esc(x.id) + '">' + esc(t('link')) + '</a></p>';
  }
  function card(x) {
    var s = x.stat, r = s.correlation, pos = r === null ? 50 : Math.max(0, Math.min(100, (r + 1) / 2 * 100)), pg = PAGE[x.market.product];
    var mk = pg ? '<a href="producto.html?p=' + pg + '">' + esc(L(x.market.label)) + '</a>' : esc(L(x.market.label));
    var h = '<article class="di-card rl2" id="r-' + esc(x.id) + '" data-status="' + x.status + '">';
    h += '<div class="rl2-top"><h3 class="rl2-pair"><span>' + esc(flagName(x.input.region)) + ' · ' + esc(L(x.input.label)) + '</span><span class="rl2-arr" aria-hidden="true"> → </span><span><b>' + esc(flagName(x.market.region)) + ' · ' + mk + '</b></span></h3>' +
      '<span class="pt-badge rl2-conf rl-conf-' + x.confidence + '"><span aria-hidden="true">' + CONF_ICON[x.confidence] + '</span> ' + esc(t('conf_' + x.confidence)) + '</span></div>';
    h += '<p class="rl2-sent">' + esc(sentence(x)) + '</p>';
    h += '<div class="rl2-g" role="img" aria-label="' + esc(t('corrAria') + ' ' + (r === null ? '—' : nf(r, 2)) + ' (' + t('s_' + s.strength) + ', ' + t('d_' + s.direction) + ')') + '"><span class="rl2-ge">' + esc(t('d_negative')) + '</span><span class="rl2-gt"><i class="rl2-gz"></i><b style="left:' + pos.toFixed(1) + '%"></b></span><span class="rl2-ge">' + esc(t('d_positive')) + '</span></div>';
    h += '<p class="rl2-meta">' + esc(t('chan')) + ': ' + esc(L(DOC.channels[x.channel])) + ' · ' + esc(s.periodStart + '–' + s.periodEnd) + ' · ' + s.n + ' ' + esc(t('obsN')) + '</p>';
    h += '<details class="rl-det"' + (F.id === x.id ? ' open' : '') + '><summary>' + esc(t('detail')) + '</summary>' + detail(x) + '</details>';
    return h + '</article>';
  }
  function rank(x) { return ({ HIGH: 0, MEDIUM: 1, LOW: 2 })[x.confidence] * 10 - Math.abs(x.stat.correlation || 0); }
  function ci(id, o) { return window.DICite && id ? window.DICite.html(id, o || {}) : ''; }
  function tilesHtml() {
    var cnt = {}; DOC.relationships.forEach(function (x) { GRP.forEach(function (g2) { if (g2[2].indexOf(x.market.product) >= 0) cnt[g2[0]] = (cnt[g2[0]] || 0) + 1; }); });
    return GRP.filter(function (g2) { return cnt[g2[0]]; }).map(function (g2) { return '<button type="button" class="um-prod" data-g="' + g2[0] + '" data-rf="g:' + g2[0] + '" aria-pressed="' + (F.g === g2[0]) + '"><span class="um-emo" aria-hidden="true">' + g2[1] + '</span><span>' + esc(GN[g2[0]][li()]) + '</span><span class="um-cnt">' + cnt[g2[0]] + '</span></button>'; }).join('');
  }
  function shell() {
    var body = document.getElementById('rl-body');
    var h = '<div class="pt-note rl-disclaimer" role="note"><strong>' + esc(L(DOC.disclaimer)) + '</strong></div>';
    h += '<div class="um-hero"><h2 class="um-q" id="rl-q">' + esc(t('q')) + '</h2><p class="um-hint" style="margin:0 0 10px">' + esc(t('qsub')) + '</p><form class="um-form" id="rl-form" role="search" aria-labelledby="rl-q"><input class="um-input" id="rl-s" type="search" autocomplete="off" placeholder="' + esc(t('ph')) + '" aria-label="' + esc(t('q')) + '" value="' + esc(F.q) + '"><button class="di-btn um-go" type="submit">' + esc(t('go')) + '</button></form>' +
      '<h3 class="um-h2">' + esc(t('prods')) + '</h3><div class="um-prods" id="rl-tiles"></div></div>';
    h += '<details class="um-adv" id="rl-more"' + (nFilters() ? ' open' : '') + '><summary id="rl-mores"></summary><div class="rl-filters" id="rl-fl" style="padding:4px 14px 12px"></div></details>';
    h += '<div id="rl-res"></div>';
    h += '<details class="rl-det rl-method"><summary>' + esc(t('method')) + '</summary><p>' + esc(t('mSummary')) + '</p><p>' + esc(t('mRules')) + '</p><p>' + esc(t('mCur')) + '</p></details>';
    body.innerHTML = h; SHELL = lang();
  }
  var SHELL = '', chainsAll = false;
  // Efectos en cadena: A -> B -> C con los dos eslabones observados (confianza alta o media). Se muestran las cadenas que tocan lo filtrado.
  function chainsHtml(list) {
    var ids = {}; list.forEach(function (x) { ids[x.id] = 1; });
    var byId = {}; DOC.relationships.forEach(function (x) { byId[x.id] = x; });
    var any = F.g || F.q || nFilters() || F.p;
    var cs = (DOC.chains || []).filter(function (c) { return !F.id && (!any || ids[c.links[0]] || ids[c.links[1]]); });
    if (!cs.length) return '';
    var shown = chainsAll ? cs : cs.slice(0, 6);
    var node = function (n) { return '<span class="rl-cn"><span aria-hidden="true">' + esc(flagName(n.region).split(' ')[0]) + '</span> ' + esc(L(n.label)) + '</span>'; };
    var link = function (id) { var x = byId[id], s = x.stat; return '<a class="rl-cl" href="#r-' + esc(id) + '" data-copy="' + esc(id) + '" title="' + esc(L(x.explanation)) + '">→ <span class="pt-sub">r ' + nf(s.correlation, 2) + (s.lag ? ' · ' + esc(lagUnit(x, s.lag)) : '') + '</span></a>'; };
    var h = '<h3 class="um-h2">' + esc(t('chH')) + ' (' + cs.length + ')</h3><p class="um-hint">' + esc(t('chN')) + '</p><ul class="rl-chains">';
    shown.forEach(function (c) { h += '<li>' + node(c.nodes[0]) + ' ' + link(c.links[0]) + ' ' + node(c.nodes[1]) + ' ' + link(c.links[1]) + ' ' + node(c.nodes[2]) + '</li>'; });
    h += '</ul>';
    if (cs.length > shown.length) h += '<button type="button" class="pt-chip" data-chains="1">' + esc(t('chMore')) + ' (' + cs.length + ')</button>';
    return h;
  }
  function res() {
    var list = DOC.relationships.filter(matches).sort(function (a, b) { return rank(a) - rank(b); });
    var solid = list.filter(function (x) { return (x.confidence === 'HIGH' || x.confidence === 'MEDIUM') && x.status === 'OBSERVED_RELATIONSHIP'; }), weak = list.filter(function (x) { return solid.indexOf(x) < 0; });
    var any = F.g || F.q || nFilters() || F.id;
    var h = '<p class="um-sum" aria-live="polite" role="status">' + esc(fm(t('sumF'), { n: list.length, tot: DOC.relationships.length, s: solid.length, w: weak.length })) + ' · ' + esc(t('gen')) + ' ' + esc(DOC.generatedAt.slice(0, 10)) + (any ? ' <button type="button" class="pt-chip" data-reset="1">' + esc(t('reset')) + '</button>' : '') + '</p>';
    if (!list.length) return h + '<p class="pt-note">' + esc(t('none')) + '</p>';
    h += chainsHtml(list);
    h += '<h3 class="um-h2">' + esc(t('solidH')) + ' (' + solid.length + ')</h3>' + (solid.length ? '<div class="rl-list">' + solid.map(card).join('') + '</div>' : '<p class="um-hint">' + esc(t('nsol')) + '</p>');
    if (weak.length) h += '<details class="rl-det rl-weak" id="rl-weak"' + (weakOpen || !solid.length || F.id || F.st || F.c ? ' open' : '') + '><summary><b>' + esc(t('weakH')) + ' (' + weak.length + ')</b></summary><p class="um-hint">' + esc(t('weakN')) + '</p><div class="rl-list">' + weak.map(card).join('') + '</div></details>';
    return h;
  }
  function update(rf) {
    var body = document.getElementById('rl-body'); if (!body || !DOC) return;
    var ae = rf || (document.activeElement && document.activeElement.getAttribute ? document.activeElement.getAttribute('data-rf') : null);
    document.getElementById('rl-tiles').innerHTML = tilesHtml(); document.getElementById('rl-fl').innerHTML = filters();
    var n = nFilters(); document.getElementById('rl-mores').textContent = t('moreF') + (n ? ' (' + n + ')' : '');
    document.getElementById('rl-res').innerHTML = res();
    if (ae) { var el = body.querySelector('[data-rf="' + ae + '"]'); if (el) el.focus(); }
  }
  function render() {
    var body = document.getElementById('rl-body'); if (!body) return;
    document.getElementById('rl-h1').textContent = t('title'); document.getElementById('rl-sub').textContent = t('sub'); document.title = t('title') + ' | Dehesa Index';
    if (!DOC) return;
    if (SHELL !== lang() || !document.getElementById('rl-res')) shell();
    update();
    if (F.id) { var el = document.getElementById('r-' + F.id); if (el && el.scrollIntoView) el.scrollIntoView(); }
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('button[data-f],button[data-reset],button[data-g],a[data-copy],button[data-chains]') : null; if (!b) return;
    if (b.getAttribute('data-chains')) { chainsAll = true; document.getElementById('rl-res').innerHTML = res(); return; }
    if (b.getAttribute('data-reset')) { for (var k in F) F[k] = ''; var inp = document.getElementById('rl-s'); if (inp) inp.value = ''; }
    else if (b.getAttribute('data-copy')) { e.preventDefault(); F = { ch: '', r: '', st: '', c: '', p: '', id: b.getAttribute('data-copy'), g: '', q: '' }; }
    else if (b.getAttribute('data-g')) { var gv = b.getAttribute('data-g'); F.g = F.g === gv ? '' : gv; F.id = ''; }
    else { F[b.getAttribute('data-f')] = b.getAttribute('data-v'); F.id = ''; }
    writeUrl(); update(b.getAttribute('data-rf'));
  }
  function onChange(e) { }
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  window.DehesaShared.init('informacion');
  readUrl();
  var body = document.getElementById('rl-body'); body.addEventListener('click', onClick); body.addEventListener('change', onChange);
  body.addEventListener('input', function (e) { if (e.target && e.target.id === 'rl-s') { F.q = e.target.value; F.id = ''; writeUrl(); var r = document.getElementById('rl-res'); if (r) r.innerHTML = res(); } });
  body.addEventListener('submit', function (e) { e.preventDefault(); });
  body.addEventListener('toggle', function (e) { if (e.target && e.target.id === 'rl-weak') weakOpen = e.target.open; }, true);
  render();
  fetch('data/relationships.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { DOC = d; var go = function () { render(); }; (window.DICite ? window.DICite.load() : Promise.resolve()).then(go, go); })
    .catch(function () { body.innerHTML = '<p class="pt-err">' + esc(t('err')) + '</p>'; });
  window.DIRelations = { state: function () { return { F: F, doc: DOC }; } };
})();
