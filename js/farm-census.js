/* Dehesa Index — Censo agrario de Eurostat en la ficha de país y en la de región (24 países de la UE).
   Datos: data/views/census/<PAIS>.json (scripts/build-views.py, desde data/eurostat-census-stats.json: Eurostat ef_mp_* (incl. voctraining, manorg, digilsk), ef_lf_main, ef_lf_fam, ef_lf_size, ef_lus_pegrass, ef_lus_allcrops, ef_fsi_nfm, ef_fsi_ecsz, ef_lsk_*, ef_lus_*).
   Las cifras son las de Eurostat; los porcentajes y las medias por explotación los calcula esta ficha y los rotula como cálculo de Dehesa Index. ES5.
   mount(el, lang, cc, regionKey): sin regionKey, el país; con regionKey, la región (suma de sus NUTS 2). */
(function (global) {
  'use strict';
  var LOC = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT' }, IX = { es: 0, en: 1, fr: 2, it: 3 };
  function L(es, en, fr, it) { return [es, en, fr, it]; }
  var T = {
    h: L('Censo agrario: jefes, tecnología, riego y estructura', 'Farm census: managers, technology, irrigation and structure', 'Recensement agricole : chefs, technologie, irrigation et structure', 'Censimento agricolo: capi azienda, tecnologia, irrigazione e struttura'),
    sub: L('Encuesta de estructura de las explotaciones de la UE (Eurostat): último censo o encuesta publicado, con las cifras del año indicado en cada bloque.', 'EU farm structure survey (Eurostat): latest published census or survey, with the figures of the year shown in each block.', 'Enquête sur la structure des exploitations de l’UE (Eurostat) : dernier recensement ou enquête publié, avec les chiffres de l’année indiquée dans chaque bloc.', 'Indagine UE sulla struttura delle aziende agricole (Eurostat): ultimo censimento o indagine pubblicati, con i dati dell’anno indicato in ogni blocco.'),
    s1: L('Jefes de explotación y mano de obra', 'Farm managers and labour', 'Chefs d’exploitation et main-d’œuvre', 'Capi azienda e manodopera'),
    s2: L('Tecnología, maquinaria y energía renovable', 'Technology, machinery and renewable energy', 'Technologie, machines et énergie renouvelable', 'Tecnologia, macchinari ed energia rinnovabile'),
    s3: L('Riego y prácticas del suelo', 'Irrigation and soil practices', 'Irrigation et pratiques du sol', 'Irrigazione e pratiche del suolo'),
    s4: L('Estructura: ganado, uso del suelo y frutales', 'Structure: livestock, land use and orchards', 'Structure : élevage, occupation du sol et vergers', 'Struttura: allevamento, uso del suolo e frutteti'),
    holdings: L('explotaciones', 'holdings', 'exploitations', 'aziende'), hold1: L('explotación', 'holding', 'exploitation', 'azienda'), persons: L('personas', 'persons', 'personnes', 'persone'), ha: L('ha', 'ha', 'ha', 'ha'), awu: L('UTA', 'AWU', 'UTA', 'ULA'),
    head: L('cabezas', 'head', 'têtes', 'capi'), hives: L('colmenas', 'hives', 'ruches', 'alveari'), lsu: L('UGM', 'LSU', 'UGB', 'UBA'), m3: L('m³', 'm³', 'm³', 'm³'),
    yr: L('Año', 'Year', 'Année', 'Anno'), age: L('Edad del jefe', 'Manager age', 'Âge du chef', 'Età del capo'), of: L('de', 'of', 'sur', 'su'),
    abvR: L('En esta región (o en parte de ella) Eurostat solo publica las explotaciones por encima del umbral estadístico, no el total: las cifras de esos bloques dejan fuera las explotaciones más pequeñas y no son comparables con las de otras regiones.',
            'For this region (or part of it) Eurostat only publishes holdings above the statistical threshold, not the total: figures in those blocks leave out the smallest holdings and are not comparable with other regions.',
            'Pour cette région (ou une partie), Eurostat ne publie que les exploitations au-dessus du seuil statistique, pas le total : les chiffres de ces blocs excluent les plus petites exploitations et ne sont pas comparables à ceux d’autres régions.',
            'Per questa regione (o parte di essa) Eurostat pubblica solo le aziende sopra la soglia statistica, non il totale: le cifre di questi blocchi escludono le aziende più piccole e non sono confrontabili con altre regioni.'),
    abvC: L('En este país Eurostat solo publica las explotaciones por encima del umbral estadístico en los bloques de tecnología, riego y frutales; dejan fuera las más pequeñas y no son comparables con países que publican el total.',
            'For this country Eurostat only publishes holdings above the statistical threshold in the technology, irrigation and orchard blocks; they leave out the smallest holdings and are not comparable with countries that publish the total.',
            'Pour ce pays, Eurostat ne publie que les exploitations au-dessus du seuil statistique dans les blocs technologie, irrigation et vergers ; ils excluent les plus petites et ne sont pas comparables aux pays qui publient le total.',
            'Per questo paese Eurostat pubblica solo le aziende sopra la soglia statistica nei blocchi tecnologia, irrigazione e frutteti; escludono le più piccole e non sono confrontabili con i paesi che pubblicano il totale.'),
    calc: L('Los porcentajes y medias por explotación los calcula Dehesa Index con las cifras de Eurostat. Si una cifra no se publica (secreto estadístico o sin datos) se deja sin mostrar.', 'Percentages and per-holding averages are calculated by Dehesa Index from Eurostat figures. If a figure is not published (statistical confidentiality or no data) it is left out.', 'Les pourcentages et moyennes par exploitation sont calculés par Dehesa Index à partir des chiffres d’Eurostat. Si un chiffre n’est pas publié (secret statistique ou absence de données), il n’est pas affiché.', 'Percentuali e medie per azienda sono calcolate da Dehesa Index sui dati Eurostat. Se un dato non è pubblicato (riservatezza statistica o assenza di dati) non viene mostrato.'),
    src: L('Fuente:', 'Source:', 'Source :', 'Fonte:'),
    srcA: L('Eurostat, censo agrario y encuestas de estructura (reutilización según la Decisión 2011/833/UE)', 'Eurostat, agricultural census and farm structure surveys (reuse under Decision 2011/833/EU)', 'Eurostat, recensement agricole et enquêtes sur la structure (réutilisation selon la décision 2011/833/UE)', 'Eurostat, censimento agricolo e indagini sulla struttura (riutilizzo ai sensi della decisione 2011/833/UE)'),
    natOnly: L('Solo se publica para el país entero.', 'Published for the whole country only.', 'Publié uniquement pour l’ensemble du pays.', 'Pubblicato solo per l’intero paese.'),
    // jefes
    newM: L('Nuevos jefes de explotación', 'New farm managers', 'Nouveaux chefs d’exploitation', 'Nuovi capi azienda'),
    newYoung: L('Nuevos jefes de 40 años o menos', 'New managers aged 40 or under', 'Nouveaux chefs de 40 ans ou moins', 'Nuovi capi di 40 anni o meno'),
    newOld: L('Nuevos jefes de más de 40 años', 'New managers over 40', 'Nouveaux chefs de plus de 40 ans', 'Nuovi capi di oltre 40 anni'),
    womenIn: L('mujeres entre ellos', 'women among them', 'femmes parmi eux', 'donne tra loro'),
    ofAll: L('de todas las explotaciones', 'of all holdings', 'de toutes les exploitations', 'di tutte le aziende'),
    train: L('Formación agraria del jefe, según su edad', 'Manager’s agricultural training, by age', 'Formation agricole du chef, selon l’âge', 'Formazione agricola del capo, per età'),
    basic: L('Formación básica', 'Basic training', 'Formation de base', 'Formazione di base'), pract: L('Solo experiencia práctica', 'Practical experience only', 'Expérience pratique seule', 'Solo esperienza pratica'), full: L('Formación agraria completa', 'Full agricultural training', 'Formation agricole complète', 'Formazione agricola completa'),
    tenure: L('Tenencia de la tierra', 'Land tenure', 'Mode de faire-valoir', 'Titolo di possesso della terra'),
    own: L('En propiedad', 'Owned', 'Propriété', 'Proprietà'), rent: L('En arrendamiento', 'Rented', 'Fermage', 'Affitto'), cml: L('Tierra comunal', 'Common land', 'Terres communes', 'Terre comuni'), shr: L('Aparcería y otras formas', 'Sharing and other modes', 'Métayage et autres modes', 'Mezzadria e altre forme'),
    tenureAge: L('Superficie en alquiler según la edad del jefe', 'Rented area by manager age', 'Surface en fermage selon l’âge du chef', 'Superficie in affitto per età del capo'),
    econ: L('Tamaño económico según la edad del jefe', 'Economic size by manager age', 'Dimension économique selon l’âge du chef', 'Dimensione economica per età del capo'),
    avgEcon: L('Producción estándar media por explotación (€)', 'Average standard output per holding (€)', 'Production standard moyenne par exploitation (€)', 'Produzione standard media per azienda (€)'),
    avgArea: L('Superficie media (ha)', 'Average area (ha)', 'Surface moyenne (ha)', 'Superficie media (ha)'),
    labour: L('Mano de obra agraria según la edad', 'Farm labour by age', 'Main-d’œuvre agricole selon l’âge', 'Manodopera agricola per età'),
    awuP: L('UTA por persona', 'AWU per person', 'UTA par personne', 'ULA per persona'),
    tot: L('Total', 'Total', 'Total', 'Totale'),
    // tecnologia
    dig: L('Tecnología en las explotaciones', 'Technology on holdings', 'Technologie dans les exploitations', 'Tecnologia nelle aziende'),
    inet: L('Acceso a internet', 'Internet access', 'Accès à internet', 'Accesso a internet'), pf: L('Agricultura de precisión', 'Precision farming', 'Agriculture de précision', 'Agricoltura di precisione'), rob: L('Robótica', 'Robotics', 'Robotique', 'Robotica'),
    lsm: L('Maquinaria de gestión del ganado', 'Livestock management machinery', 'Machines de gestion de l’élevage', 'Macchinari per la gestione del bestiame'), mis: L('Sistemas de información de gestión', 'Management information systems', 'Systèmes d’information de gestion', 'Sistemi informativi di gestione'),
    pfTech: L('Técnicas de precisión (explotaciones que las usan)', 'Precision techniques (holdings using them)', 'Techniques de précision (exploitations qui les utilisent)', 'Tecniche di precisione (aziende che le usano)'),
    vrt: L('Dosis variable', 'Variable rate techniques', 'Modulation de dose', 'Dose variabile'), pmon: L('Seguimiento de cultivos', 'Precision crop monitoring', 'Suivi de précision des cultures', 'Monitoraggio delle colture'), asoil: L('Análisis de suelo', 'Soil analysis', 'Analyse de sol', 'Analisi del suolo'),
    bds: L('Pulverización en bandas', 'Band spraying', 'Pulvérisation en bandes', 'Spruzzatura a bande'), robp: L('Robots de fitosanitarios', 'Plant-protection robots', 'Robots de protection des cultures', 'Robot per i fitosanitari'),
    pfAge: L('Agricultura de precisión según la edad del jefe', 'Precision farming by manager age', 'Agriculture de précision selon l’âge du chef', 'Agricoltura di precisione per età del capo'), share: L('% que la usa', '% using it', '% qui l’utilisent', '% che la usa'),
    mach: L('Maquinaria', 'Machinery', 'Machines', 'Macchinari'), trt: L('Tractores', 'Tractors', 'Tracteurs', 'Trattori'), chvt: L('Cosechadoras', 'Combine harvesters', 'Moissonneuses-batteuses', 'Mietitrebbie'), hvt: L('Otras cosechadoras mecanizadas', 'Other mechanised harvesters', 'Autres récolteuses mécanisées', 'Altre raccoglitrici meccanizzate'), tsp: L('Aperos de laboreo, siembra y abonado', 'Tillage, seeding and spreading equipment', 'Matériel de travail du sol, semis et épandage', 'Attrezzature per lavorazione, semina e concimazione'),
    ren: L('Energía renovable producida en la explotación', 'Renewable energy produced on the holding', 'Énergie renouvelable produite sur l’exploitation', 'Energia rinnovabile prodotta in azienda'),
    renAll: L('Alguna renovable', 'Any renewable', 'Une énergie renouvelable', 'Almeno una rinnovabile'), pv: L('Solar fotovoltaica', 'Solar photovoltaic', 'Solaire photovoltaïque', 'Solare fotovoltaico'), sth: L('Solar térmica', 'Solar thermal', 'Solaire thermique', 'Solare termico'), wnd: L('Eólica', 'Wind', 'Éolien', 'Eolico'), biom: L('Biomasa', 'Biomass', 'Biomasse', 'Biomassa'), biog: L('Biogás', 'Biogas', 'Biogaz', 'Biogas'), hyd: L('Hidroeléctrica', 'Hydro', 'Hydroélectrique', 'Idroelettrico'), oth: L('Otras', 'Other', 'Autres', 'Altre'),
    // riego
    irri: L('Superficie regada según el método', 'Irrigated area by method', 'Surface irriguée selon la méthode', 'Superficie irrigata per metodo'), surf: L('Superficie (a pie, surcos)', 'Surface', 'Gravitaire', 'Scorrimento'), splr: L('Aspersión', 'Sprinkler', 'Aspersion', 'Aspersione'), drip: L('Goteo', 'Drip', 'Goutte-à-goutte', 'Goccia'),
    irrArea: L('Superficie regada', 'Irrigated area', 'Surface irriguée', 'Superficie irrigata'), irrVol: L('Agua aplicada', 'Water applied', 'Eau appliquée', 'Acqua applicata'), irrHld: L('Explotaciones con riego', 'Holdings with irrigation', 'Exploitations irriguées', 'Aziende con irrigazione'),
    watSrc: L('Origen del agua de riego', 'Source of irrigation water', 'Origine de l’eau d’irrigation', 'Origine dell’acqua irrigua'), fsw: L('Agua superficial', 'Surface water', 'Eau de surface', 'Acqua superficiale'), fgw: L('Agua subterránea de la explotación', 'On-farm groundwater', 'Eaux souterraines de l’exploitation', 'Acque sotterranee aziendali'), wsn: L('Redes de suministro externas', 'Off-farm supply networks', 'Réseaux d’approvisionnement externes', 'Reti di approvvigionamento esterne'), ruww: L('Aguas residuales regeneradas', 'Reused treated wastewater', 'Eaux usées traitées réutilisées', 'Acque reflue trattate riutilizzate'),
    irrCrop: L('Superficie regada por cultivo', 'Irrigated area by crop', 'Surface irriguée par culture', 'Superficie irrigata per coltura'),
    til: L('Laboreo de la tierra de cultivo', 'Tillage on arable land', 'Travail du sol des terres arables', 'Lavorazione dei seminativi'), tilCv: L('Laboreo convencional', 'Conventional tillage', 'Labour conventionnel', 'Lavorazione convenzionale'), tilCs: L('Laboreo de conservación', 'Conservation tillage', 'Travail de conservation', 'Lavorazione conservativa'), tilZ: L('Siembra directa', 'Zero tillage', 'Semis direct', 'Semina diretta'),
    soil: L('Cobertura del suelo en la tierra de cultivo', 'Soil cover on arable land', 'Couverture du sol des terres arables', 'Copertura del suolo nei seminativi'), scW: L('Cultivo normal de invierno', 'Normal winter crop', 'Culture normale d’hiver', 'Coltura invernale normale'), scC: L('Cubierta o cultivo intermedio', 'Cover or intermediate crop', 'Culture de couverture ou intermédiaire', 'Coltura di copertura o intermedia'), scR: L('Residuos vegetales', 'Plant residues', 'Résidus végétaux', 'Residui vegetali'), scB: L('Suelo desnudo', 'Bare soil', 'Sol nu', 'Suolo nudo'), scM: L('Plantas plurianuales', 'Multi-annual plants', 'Plantes pluriannuelles', 'Piante poliennali'),
    efa: L('Elementos del paisaje en las explotaciones', 'Landscape features on holdings', 'Éléments du paysage dans les exploitations', 'Elementi del paesaggio nelle aziende'), efTer: L('Terrazas', 'Terraces', 'Terrasses', 'Terrazzamenti'), efAgf: L('Agroforestería', 'Agro-forestry', 'Agroforesterie', 'Agroforesteria'), efHg: L('Setos y hileras de árboles', 'Hedges and tree lines', 'Haies et alignements d’arbres', 'Siepi e filari'), efFm: L('Linderos y franjas de protección', 'Field margins and buffer strips', 'Bordures et bandes tampons', 'Margini e fasce tampone'), efSw: L('Muros de piedra', 'Stone walls', 'Murs en pierre', 'Muri a secco'),
    // estructura
    lsk: L('Explotaciones y ganado por especie', 'Holdings and livestock by species', 'Exploitations et élevage par espèce', 'Aziende e bestiame per specie'), sp: L('Especie', 'Species', 'Espèce', 'Specie'),
    bov: L('Bovino', 'Cattle', 'Bovins', 'Bovini'), pig: L('Porcino', 'Pigs', 'Porcins', 'Suini'), shp: L('Ovino', 'Sheep', 'Ovins', 'Ovini'), gt: L('Caprino', 'Goats', 'Caprins', 'Caprini'), pou: L('Aves de corral', 'Poultry', 'Volailles', 'Pollame'), rab: L('Conejas reproductoras', 'Breeding rabbits', 'Lapines reproductrices', 'Coniglie riproduttrici'), bee: L('Abejas', 'Bees', 'Abeilles', 'Api'),
    lus: L('Uso del suelo en las explotaciones', 'Land use on holdings', 'Occupation du sol dans les exploitations', 'Uso del suolo nelle aziende'), uaa: L('Superficie agraria útil', 'Utilised agricultural area', 'Surface agricole utilisée', 'Superficie agricola utilizzata'),
    ara: L('Tierra de cultivo', 'Arable land', 'Terres arables', 'Seminativi'), grass: L('Pastos permanentes', 'Permanent grassland', 'Prairies permanentes', 'Prati permanenti'), pecr: L('Cultivos permanentes', 'Permanent crops', 'Cultures permanentes', 'Colture permanenti'), kg: L('Huertos familiares', 'Kitchen gardens', 'Jardins familiaux', 'Orti familiari'), org: L('Superficie ecológica (certificada o en conversión)', 'Organic area (certified or in conversion)', 'Surface bio (certifiée ou en conversion)', 'Superficie biologica (certificata o in conversione)'),
    nuaa: L('Superficie agraria no utilizada', 'Unutilised agricultural area', 'Surface agricole non utilisée', 'Superficie agricola non utilizzata'), wa: L('Superficie boscosa', 'Wooded area', 'Surface boisée', 'Superficie boscata'),
    orch: L('Frutales por edad de la plantación (2023)', 'Orchards by age of plantation (2023)', 'Vergers selon l’âge de la plantation (2023)', 'Frutteti per età dell’impianto (2023)'),
    apples: L('Manzano y peral', 'Apples and pears', 'Pommiers et poiriers', 'Meli e peri'), stone: L('Melocotonero, nectarino y albaricoquero', 'Peaches, nectarines and apricots', 'Pêchers, nectariniers et abricotiers', 'Peschi, nettarine e albicocchi'), citrus: L('Naranjo, mandarino y limonero', 'Oranges, small citrus and lemons', 'Orangers, petits agrumes et citronniers', 'Aranci, piccoli agrumi e limoni'), olives: L('Olivo', 'Olives', 'Oliviers', 'Ulivi'), grapes: L('Uva de mesa y pasas', 'Table grapes and raisins', 'Raisins de table et secs', 'Uva da tavola e uva passa'),
    changeSince: L('desde', 'since', 'depuis', 'dal'),
    // tanda 2: formación profesional, ecológico, mano de obra familiar y por tamaño, ganadería, pastos y cultivos
    voc: L('Formación profesional del jefe en los últimos 12 meses', 'Manager’s vocational training in the last 12 months', 'Formation professionnelle du chef au cours des 12 derniers mois', 'Formazione professionale del capo negli ultimi 12 mesi'),
    vocYes: L('Con formación en los últimos 12 meses', 'Trained in the last 12 months', 'Formé au cours des 12 derniers mois', 'Formato negli ultimi 12 mesi'), vocNo: L('Sin formación en los últimos 12 meses', 'Not trained in the last 12 months', 'Non formé au cours des 12 derniers mois', 'Non formato negli ultimi 12 mesi'),
    orgM: L('Agricultura ecológica según la edad del jefe', 'Organic farming by manager age', 'Agriculture biologique selon l’âge du chef', 'Agricoltura biologica per età del capo'), orgShare: L('% ecológicas', '% organic', '% bio', '% biologiche'),
    orgTr: L('Explotaciones ecológicas según la formación del jefe', 'Organic holdings by manager training', 'Exploitations bio selon la formation du chef', 'Aziende biologiche per formazione del capo'),
    orgHld: L('Explotaciones ecológicas', 'Organic holdings', 'Exploitations bio', 'Aziende biologiche'), orgHa: L('Superficie en ecológico', 'Organic area', 'Surface en bio', 'Superficie biologica'),
    fam: L('Mano de obra familiar: explotaciones según su peso', 'Family labour: holdings by its share of the workforce', 'Main-d’œuvre familiale : exploitations selon son poids', 'Manodopera familiare: aziende per incidenza'),
    famAll: L('Solo mano de obra familiar (100 %)', 'Family labour only (100%)', 'Main-d’œuvre uniquement familiale (100 %)', 'Solo manodopera familiare (100%)'), famMost: L('Mayoría familiar (50 a 99 %)', 'Mostly family (50 to 99%)', 'Majoritairement familiale (50 à 99 %)', 'Prevalentemente familiare (50-99%)'), famSome: L('Minoría familiar (menos del 50 %)', 'Minority family (under 50%)', 'Minoritairement familiale (moins de 50 %)', 'Minoritaria (meno del 50%)'), famNone: L('Sin mano de obra familiar', 'No family labour', 'Aucune main-d’œuvre familiale', 'Nessuna manodopera familiare'),
    labSize: L('Mano de obra según el tamaño de la explotación', 'Labour by farm size', 'Main-d’œuvre selon la taille de l’exploitation', 'Manodopera per dimensione aziendale'), size: L('Superficie de la explotación', 'Farm area', 'Surface de l’exploitation', 'Superficie aziendale'),
    nonFam: L('% UTA asalariada fija no familiar', '% regular non-family AWU', '% UTA salariée régulière non familiale', '% ULA regolare non familiare'), nonReg: L('% UTA no regular', '% non-regular AWU', '% UTA non régulière', '% ULA non regolare'),
    sz0: L('Sin superficie', 'No area', 'Sans surface', 'Senza superficie'), sz1: L('Menos de 5 ha', 'Under 5 ha', 'Moins de 5 ha', 'Meno di 5 ha'), sz2: L('5 a 30 ha', '5 to 30 ha', '5 à 30 ha', '5-30 ha'), sz3: L('30 a 100 ha', '30 to 100 ha', '30 à 100 ha', '30-100 ha'), sz4: L('100 ha o más', '100 ha or more', '100 ha ou plus', '100 ha o più'),
    lskM: L('Maquinaria y sistemas para el ganado', 'Machinery and systems for livestock', 'Machines et systèmes pour l’élevage', 'Macchinari e sistemi per il bestiame'),
    mRob: L('Robots de ordeño', 'Milking robots', 'Robots de traite', 'Robot di mungitura'), mAf: L('Alimentación automática', 'Automatic feeding', 'Alimentation automatique', 'Alimentazione automatica'), mGm: L('Mezcladora-trituradora de pienso', 'Grinder-mixer for feed', 'Broyeur-mélangeur d’aliments', 'Mulino-miscelatore per mangimi'), mClim: L('Regulación automática del clima de la nave', 'Automatic barn climate regulation', 'Régulation automatique du climat du bâtiment', 'Regolazione automatica del clima'), mWh: L('Control del bienestar y la salud', 'Welfare and health monitoring', 'Suivi du bien-être et de la santé', 'Monitoraggio di benessere e salute'),
    lskUniv: L('de las explotaciones con ganado que respondieron', 'of the livestock holdings that answered', 'des exploitations d’élevage ayant répondu', 'delle aziende zootecniche rispondenti'),
    lsuSize: L('Maquinaria para el ganado según el tamaño del rebaño (UGM)', 'Livestock machinery by herd size (LSU)', 'Machines pour l’élevage selon la taille du troupeau (UGB)', 'Macchinari zootecnici per dimensione dell’allevamento (UBA)'), anyMach: L('% con maquinaria', '% with machinery', '% avec machines', '% con macchinari'), robShare: L('% con robot de ordeño', '% with milking robot', '% avec robot de traite', '% con robot di mungitura'),
    ls0: L('Menos de 5 UGM', 'Under 5 LSU', 'Moins de 5 UGB', 'Meno di 5 UBA'), ls1: L('5 a 20 UGM', '5 to 20 LSU', '5 à 20 UGB', '5-20 UBA'), ls2: L('20 a 100 UGM', '20 to 100 LSU', '20 à 100 UGB', '20-100 UBA'), ls3: L('100 a 500 UGM', '100 to 500 LSU', '100 à 500 UGB', '100-500 UBA'), ls4: L('500 UGM o más', '500 LSU or more', '500 UGB ou plus', '500 UBA o più'),
    pg: L('Pastos permanentes por tipo', 'Permanent grassland by type', 'Prairies permanentes par type', 'Prati permanenti per tipo'), pg1: L('Pastos y praderas (sin pastos pobres)', 'Pastures and meadows (excluding rough grazing)', 'Pâturages et prairies (hors parcours)', 'Pascoli e prati (esclusi i pascoli magri)'), pg2: L('Pastos pobres y rastrojeras', 'Rough grazings', 'Parcours extensifs', 'Pascoli magri'), pg3: L('Pastos no utilizados con derecho a ayudas', 'Unused grassland eligible for subsidies', 'Prairies non utilisées éligibles aux aides', 'Prati non utilizzati ammissibili ai contributi'),
    crp: L('Cultivos por superficie y explotaciones', 'Crops by area and holdings', 'Cultures par surface et exploitations', 'Colture per superficie e aziende'), crop: L('Cultivo', 'Crop', 'Culture', 'Coltura'), avgHa: L('ha por explotación', 'ha per holding', 'ha par exploitation', 'ha per azienda'),
    c11: L('Trigo blando y espelta', 'Common wheat and spelt', 'Blé tendre et épeautre', 'Frumento tenero e farro'), c12: L('Trigo duro', 'Durum wheat', 'Blé dur', 'Frumento duro'), c13: L('Cebada', 'Barley', 'Orge', 'Orzo'), c14: L('Avena y mezclas de cereales de primavera', 'Oats and spring cereal mixtures', 'Avoine et mélanges de céréales de printemps', 'Avena e miscugli di cereali primaverili'), c15: L('Maíz grano', 'Grain maize', 'Maïs grain', 'Mais da granella'), c16: L('Centeno y mezclas de invierno', 'Rye and winter cereal mixtures', 'Seigle et méteil', 'Segale e miscugli invernali'), c17: L('Otros cereales (triticale, sorgo…)', 'Other cereals (triticale, sorghum…)', 'Autres céréales (triticale, sorgho…)', 'Altri cereali (triticale, sorgo…)'), c20: L('Arroz', 'Rice', 'Riz', 'Riso'),
    pls: L('Leguminosas grano y proteaginosas', 'Dry pulses and protein crops', 'Légumineuses et protéagineux', 'Leguminose da granella e proteaginose'), pot: L('Patata', 'Potatoes', 'Pommes de terre', 'Patate'), sbt: L('Remolacha azucarera', 'Sugar beet', 'Betterave sucrière', 'Barbabietola da zucchero'), rps: L('Colza y nabina', 'Rape and turnip rape', 'Colza et navette', 'Colza e ravizzone'), sfl: L('Girasol', 'Sunflower', 'Tournesol', 'Girasole'), soy: L('Soja', 'Soya', 'Soja', 'Soia'), tgr: L('Praderas temporales', 'Temporary grasses and grazings', 'Prairies temporaires', 'Prati avvicendati'), gmz: L('Maíz forrajero', 'Green maize', 'Maïs fourrage', 'Mais verde'), veg: L('Hortalizas y fresa', 'Fresh vegetables and strawberries', 'Légumes frais et fraises', 'Ortaggi freschi e fragole'), fal: L('Barbecho', 'Fallow land', 'Jachère', 'Maggese')
  };
  /* franjas de edad: Eurostat publica 35-39 y 40-44 (2020, 2023) o 35-44 (2016); nunca se mezclan en la misma tabla */
  var AGE = [['Y_LT25', L('Menos de 25', 'Under 25', 'Moins de 25', 'Meno di 25')], ['Y25-34', L('25 a 34', '25 to 34', '25 à 34', '25-34')], ['Y35-39', L('35 a 39', '35 to 39', '35 à 39', '35-39')], ['Y40-44', L('40 a 44', '40 to 44', '40 à 44', '40-44')], ['Y35-44', L('35 a 44', '35 to 44', '35 à 44', '35-44')],
    ['Y45-54', L('45 a 54', '45 to 54', '45 à 54', '45-54')], ['Y55-64', L('55 a 64', '55 to 64', '55 à 64', '55-64')], ['Y_GE65', L('65 o más', '65 or over', '65 ou plus', '65 o più')]];
  var ORCH = { pome: ['ef_lus_orchpome', 'F1110_1120', [['Y_LT5', L('<5 años', '<5 years', '<5 ans', '<5 anni')], ['Y5-14', L('5-14', '5-14', '5-14', '5-14')], ['Y15-24', L('15-24', '15-24', '15-24', '15-24')], ['Y_GE25', L('25+', '25+', '25+', '25+')]], 'apples'],
    stone: ['ef_lus_orchstone', 'F1210-1230', [['Y_LT5', L('<5 años', '<5 years', '<5 ans', '<5 anni')], ['Y5-14', L('5-14', '5-14', '5-14', '5-14')], ['Y_GE15', L('15+', '15+', '15+', '15+')]], 'stone'],
    citrus: ['ef_lus_orchcitrus', 'T1000_2000_3000', [['Y_LT5', L('<5 años', '<5 years', '<5 ans', '<5 anni')], ['Y5-14', L('5-14', '5-14', '5-14', '5-14')], ['Y15-24', L('15-24', '15-24', '15-24', '15-24')], ['Y_GE25', L('25+', '25+', '25+', '25+')]], 'citrus'],
    olives: ['ef_lus_orcholives', 'O1100_1910', [['Y_LT5', L('<5 años', '<5 years', '<5 ans', '<5 anni')], ['Y5-11', L('5-11', '5-11', '5-11', '5-11')], ['Y12-49', L('12-49', '12-49', '12-49', '12-49')], ['Y_GE50', L('50+', '50+', '50+', '50+')]], 'olives'],
    grapes: ['ef_lus_orchgrapes', 'W1200_1300', [['Y_LT3', L('<3 años', '<3 years', '<3 ans', '<3 anni')], ['Y3-9', L('3-9', '3-9', '3-9', '3-9')], ['Y10-19', L('10-19', '10-19', '10-19', '10-19')], ['Y20-49', L('20-49', '20-49', '20-49', '20-49')], ['Y_GE50', L('50+', '50+', '50+', '50+')]], 'grapes'] };
  /* Precios de insumos pagados por los agricultores en 2025 (Eurostat apri_aip_ft, apri_aip_fs, apri_aip_en): continúan los índices hasta 2024; el año 2025 llega como precio absoluto */
  var PI = { ft: [['AM203116', L('Urea 46 % granulada', 'Urea 46% granular', 'Urée 46 % granulée', 'Urea 46% granulare')], ['AM203117', L('Urea 46 % en perlas', 'Urea 46% prilled', 'Urée 46 % perlée', 'Urea 46% prillata')], ['AM203113', L('Nitrato cálcico amónico (CAN)', 'Calcium ammonium nitrate (CAN)', 'Ammonitrate de calcium (CAN)', 'Nitrato di calcio e ammonio (CAN)')], ['AM203114', L('Nitrato amónico 28-38 % granulado', 'Ammonium nitrate 28-38% granular', 'Nitrate d’ammonium 28-38 % granulé', 'Nitrato ammonico 28-38% granulare')],
      ['AM203115', L('Nitrato amónico con azufre (AN-24S)', 'Ammonium nitrate with sulphur (AN-24S)', 'Nitrate d’ammonium soufré (AN-24S)', 'Nitrato ammonico con zolfo (AN-24S)')], ['AM203118', L('Solución nitrogenada UAN 27-37 %', 'Urea ammonium nitrate (UAN) 27-37%', 'Solution azotée UAN 27-37 %', 'Soluzione azotata UAN 27-37%')], ['AM203119', L('UAN con azufre (UAN-26S)', 'UAN with sulphur (UAN-26S)', 'UAN soufré (UAN-26S)', 'UAN con zolfo (UAN-26S)')],
      ['AM203111', L('Sulfato amónico granulado', 'Ammonium sulphate granular', 'Sulfate d’ammonium granulé', 'Solfato ammonico granulare')], ['AM203112', L('Sulfato amónico cristalizado', 'Ammonium sulphate crystallised', 'Sulfate d’ammonium cristallisé', 'Solfato ammonico cristallizzato')], ['AM203121', L('Superfosfato simple', 'Single superphosphate', 'Superphosphate simple', 'Perfosfato semplice')],
      ['AM203131', L('Cloruro potásico granulado', 'Potassium chloride granular', 'Chlorure de potassium granulé', 'Cloruro di potassio granulare')], ['AM203132', L('Cloruro potásico en perlas', 'Potassium chloride prilled', 'Chlorure de potassium perlé', 'Cloruro di potassio prillato')], ['AM203133', L('Sulfato potásico', 'Potassium sulphate', 'Sulfate de potassium', 'Solfato di potassio')]],
    fs: [['AM206111', L('Trigo forrajero', 'Fodder wheat', 'Blé fourrager', 'Frumento foraggero')], ['AM206112', L('Cebada forrajera', 'Fodder barley', 'Orge fourragère', 'Orzo foraggero')], ['AM206113', L('Avena', 'Oats', 'Avoine', 'Avena')], ['AM206114', L('Maíz grano', 'Grain maize', 'Maïs grain', 'Mais da granella')], ['AM206195', L('Triticale', 'Triticale', 'Triticale', 'Triticale')],
      ['AM206115', L('Salvado de trigo', 'Wheat bran', 'Son de blé', 'Crusca di frumento')], ['AM206116', L('Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia')], ['AM206196', L('Harina de girasol', 'Sunflower seed meal', 'Tourteau de tournesol', 'Farina di girasole')], ['AM206197', L('Harina de colza', 'Rapeseed meal', 'Tourteau de colza', 'Farina di colza')],
      ['AM206191', L('Pulpa seca de remolacha', 'Dried sugar beet pulp', 'Pulpe de betterave séchée', 'Polpa di barbabietola essiccata')], ['AM206198', L('Melaza de caña', 'Sugar cane molasses', 'Mélasse de canne', 'Melassa di canna')], ['AM206192', L('Heno de pradera', 'Meadow hay', 'Foin de prairie', 'Fieno di prato')], ['AM206193', L('Alfalfa deshidratada', 'Dried lucerne', 'Luzerne déshydratée', 'Erba medica disidratata')], ['AM206194', L('Paja de cereal', 'Cereal straw', 'Paille de céréales', 'Paglia di cereali')]],
    en: [['AM202320', L('Gasóleo', 'Diesel oil', 'Gazole', 'Gasolio'), 'hl'], ['AM202310', L('Gasolina', 'Motor spirit', 'Essence', 'Benzina'), 'hl'], ['AM202210', L('Gasóleo de calefacción', 'Heating gas oil', 'Fioul domestique', 'Gasolio da riscaldamento'), 'hl'], ['AM202220', L('Fueloil residual', 'Residual fuel oil', 'Fioul résiduel', 'Olio combustibile residuo'), 'hl'], ['AM202100', L('Electricidad', 'Electricity', 'Électricité', 'Elettricità'), 'kwh']] };
  var PT = { h: L('Precios de insumos pagados por los agricultores, 2025', 'Input prices paid by farmers, 2025', 'Prix des intrants payés par les agriculteurs, 2025', 'Prezzi dei mezzi di produzione pagati dagli agricoltori, 2025'),
    ft: L('Fertilizantes (€ por tonelada de producto)', 'Fertilisers (€ per tonne of product)', 'Engrais (€ par tonne de produit)', 'Fertilizzanti (€ per tonnellata di prodotto)'), fs: L('Piensos y forrajes (€ por tonelada)', 'Feed and fodder (€ per tonne)', 'Aliments et fourrages (€ par tonne)', 'Mangimi e foraggi (€ per tonnellata)'), en: L('Energía agraria', 'Farm energy', 'Énergie agricole', 'Energia agricola'),
    item: L('Producto', 'Item', 'Produit', 'Prodotto'), price: L('Precio 2025', '2025 price', 'Prix 2025', 'Prezzo 2025'), hl: L('€ por hectolitro', '€ per hectolitre', '€ par hectolitre', '€ per ettolitro'), kwh: L('€ por 1.000 kWh', '€ per 1,000 kWh', '€ pour 1 000 kWh', '€ per 1.000 kWh'),
    note: L('Precios absolutos de 2025 que publica Eurostat; continúan los índices de precios de insumos, que acaban en 2024. Eurostat solo publica 2025 en esta tabla, por eso no hay serie.', 'Absolute 2025 prices published by Eurostat; they continue the input price indices, which end in 2024. Eurostat only publishes 2025 in this table, so there is no series.', 'Prix absolus de 2025 publiés par Eurostat ; ils prolongent les indices de prix des intrants, qui s’arrêtent en 2024. Eurostat ne publie que 2025 dans ce tableau, il n’y a donc pas de série.', 'Prezzi assoluti del 2025 pubblicati da Eurostat; proseguono gli indici dei prezzi dei mezzi di produzione, che terminano nel 2024. Eurostat pubblica solo il 2025 in questa tabella, quindi non c’è una serie.') };
  var DOCS = {};
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ctx(d, o, abvList, lg) {
    var i = IX[lg], nf = function (v, dd) { return v == null ? '—' : (+v).toLocaleString(LOC[lg], { minimumFractionDigits: dd || 0, maximumFractionDigits: dd || 0 }); };
    var C = {
      i: i, nf: nf, pc: function (v, dd) { return v == null || !isFinite(v) ? '—' : nf(v, dd == null ? 1 : dd) + ' %'; },
      has: function (ds) { return !!(o[ds] && Object.keys(o[ds]).length); },
      /* último año con cifra para esa clave: [año, valor, índice] */
      last: function (ds, k) { var a = o[ds] && o[ds][k], ys = d.years[ds]; if (!a) return null; for (var j = a.length - 1; j >= 0; j--) if (a[j] != null) return [ys[j], a[j], j]; return null; },
      at: function (ds, k, y) { var a = o[ds] && o[ds][k], ys = d.years[ds]; if (!a) return null; var j = ys.indexOf(y); return j < 0 ? null : a[j]; },
      yearOf: function (ds, k) { var l = C.last(ds, k); return l ? l[0] : null; },
      abv: function (ds) { return abvList.indexOf(ds) >= 0; }
    };
    return C;
  }
  function ageSet(C, ds, suffix, y) { var fine = C.at(ds, 'Y35-39|' + suffix, y) != null; return AGE.filter(function (a) { return a[0] === 'Y35-44' ? !fine : true; }); }
  function kpi(lab, v, sub) { return '<div class="fsh-kpi"><div class="fsh-kl">' + esc(lab) + '</div><div class="fsh-kv">' + v + '</div><div class="fsh-kp">' + esc(sub || '') + '</div></div>'; }
  function barRows(C, rows, mx) {
    return rows.filter(function (r) { return r.p != null && isFinite(r.p); }).map(function (r) {
      return '<div class="fsh-age-r"><span>' + esc(r.n) + '</span><span class="fsh-bar wide"><i style="width:' + Math.max(0, Math.min(100, r.p / (mx || 100) * 100)).toFixed(1) + '%"></i></span><b>' + C.pc(r.p, 1) + '</b>' + (r.sub ? '<span class="fsh-m" style="min-width:90px;text-align:right">' + esc(r.sub) + '</span>' : '') + '</div>';
    }).join('');
  }
  function pieOf(C, items, unit, aria, center, centerLabel) {
    var DC = global.DehesaChart; if (!DC || !DC.pie) return '';
    var h = DC.pie({ items: items, unit: unit, aria: aria, center: center, centerLabel: centerLabel, maxN: 8 });
    return h ? '<div class="fsh-pie">' + h + '</div>' : '';
  }
  function two(bars, pie) { return '<div class="fsh-mgr-two"><div class="fsh-age">' + bars + '</div>' + (pie || '') + '</div>'; }
  function table(heads, rows) {
    return '<div class="di-table-wrap"><table class="di-table fsh-tbl"><thead><tr>' + heads.map(function (h, j) { return '<th' + (j ? ' class="num"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, j) { return '<td' + (j ? ' class="num"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function h3(t, y) { return '<h3 style="margin:16px 0 6px;font-size:14px">' + esc(t) + (y ? ' · ' + esc(y) : '') + '</h3>'; }
  /* 1. Jefes de explotación y mano de obra */
  function secManagers(C, lg, nat) {
    var i = C.i, out = '';
    if (nat && C.has('ef_fsi_nfm')) {
      var y = C.yearOf('ef_fsi_nfm', 'TOTAL|T|HLD'), y0 = null, ys = nat.years['ef_fsi_nfm'];
      if (y) { y0 = ys[0] !== y ? ys[0] : null;
        var kp = function (lab, k) { var v = C.at('ef_fsi_nfm', k + '|T|HLD', y), p = C.at('ef_fsi_nfm', k + '|T|PC', y), f = C.at('ef_fsi_nfm', k + '|F|HLD', y), v0 = y0 ? C.at('ef_fsi_nfm', k + '|T|HLD', y0) : null;
          if (v == null) return ''; return kpi(lab, C.nf(v, 0), (p != null ? C.pc(p, 1) + ' ' + T.ofAll[i] : '') + (f != null && v ? ' · ' + C.pc(f / v * 100, 0) + ' ' + T.womenIn[i] : '') + (v0 != null ? ' · ' + y0 + ': ' + C.nf(v0, 0) : '')); };
        out += h3(T.newM[i], y) + '<div class="fsh-kpis">' + kp(T.newYoung[i], 'NEW_FLF_LE40') + kp(T.newOld[i], 'NEW_FLF_GT40') + '</div>'; }
    }
    if (C.has('ef_mp_training')) {
      var yt = C.yearOf('ef_mp_training', 'TOTAL|TOTAL|HLD');
      if (yt) {
        var rows = ageSet(C, 'ef_mp_training', 'TOTAL|TOTAL|HLD', yt).concat([['TOTAL', T.tot]]).map(function (a) { var tot = C.at('ef_mp_training', a[0] + '|TOTAL|HLD', yt), b = C.at('ef_mp_training', a[0] + '|BASIC|HLD', yt), p = C.at('ef_mp_training', a[0] + '|PRACT|HLD', yt), f = C.at('ef_mp_training', a[0] + '|FULL|HLD', yt);
          if (!tot) return null; return [esc(a[1][i]), C.nf(tot, 0), C.pc(f / tot * 100, 1), C.pc(b / tot * 100, 1), C.pc(p / tot * 100, 1)]; }).filter(Boolean);
        var t0 = C.at('ef_mp_training', 'TOTAL|TOTAL|HLD', yt);
        var pie = pieOf(C, [{ name: T.full[i], v: C.at('ef_mp_training', 'TOTAL|FULL|HLD', yt) }, { name: T.basic[i], v: C.at('ef_mp_training', 'TOTAL|BASIC|HLD', yt) }, { name: T.pract[i], v: C.at('ef_mp_training', 'TOTAL|PRACT|HLD', yt) }], T.holdings[i], T.train[i] + ' ' + yt, C.nf(t0, 0), T.holdings[i] + ' ' + yt);
        out += h3(T.train[i], yt) + two(table([T.age[i], T.holdings[i], T.full[i], T.basic[i], T.pract[i]], rows), pie);
      }
    }
    if (C.has('ef_mp_tenure')) {
      var yn = C.yearOf('ef_mp_tenure', 'TOTAL|TOTAL|HA');
      if (yn) {
        var parts = [['OWN', T.own[i]], ['RENT', T.rent[i]], ['CML', T.cml[i]], ['SHR_OTH', T.shr[i]]], tot = C.at('ef_mp_tenure', 'TOTAL|TOTAL|HA', yn);
        var bars = barRows(C, parts.map(function (p) { var v = C.at('ef_mp_tenure', 'TOTAL|' + p[0] + '|HA', yn); return { n: p[1], p: v != null && tot ? v / tot * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.ha[i] : '' }; }));
        var pieT = pieOf(C, parts.map(function (p) { return { name: p[1], v: C.at('ef_mp_tenure', 'TOTAL|' + p[0] + '|HA', yn) }; }), T.ha[i], T.tenure[i] + ' ' + yn, C.nf(tot, 0), T.ha[i] + ' ' + yn);
        out += h3(T.tenure[i], yn) + two(bars, pieT);
        var ra = ageSet(C, 'ef_mp_tenure', 'TOTAL|TOTAL|HA', yn).map(function (a) { var t = C.at('ef_mp_tenure', a[0] + '|TOTAL|HA', yn), r = C.at('ef_mp_tenure', a[0] + '|RENT|HA', yn), w = C.at('ef_mp_tenure', a[0] + '|OWN|HA', yn); return t ? [esc(a[1][i]), C.nf(t, 0), C.pc(w / t * 100, 1), C.pc(r / t * 100, 1)] : null; }).filter(Boolean);
        if (ra.length) out += h3(T.tenureAge[i], yn) + table([T.age[i], T.ha[i], T.own[i], T.rent[i]], ra);
      }
    }
    if (nat && C.has('ef_fsi_ecsz')) {
      var ye = C.yearOf('ef_fsi_ecsz', 'TOTAL|HLD');
      if (ye) {
        var er = ageSet(C, 'ef_fsi_ecsz', 'HLD', ye).concat([['TOTAL', T.tot]]).map(function (a) { var h = C.at('ef_fsi_ecsz', a[0] + '|HLD', ye), av = C.at('ef_fsi_ecsz', a[0] + '|AVG', ye), eu = C.at('ef_fsi_ecsz', a[0] + '|EUR', ye), ha = C.at('ef_fsi_ecsz', a[0] + '|HA', ye);
          if (!h) return null; return [esc(a[1][i]), C.nf(h, 0), av != null ? C.nf(av, 0) : (eu != null ? C.nf(eu / h, 0) : '—'), ha != null ? C.nf(ha / h, 1) : '—']; }).filter(Boolean);
        if (er.length) out += h3(T.econ[i], ye) + table([T.age[i], T.holdings[i], T.avgEcon[i], T.avgArea[i]], er);
      }
    }
    if (C.has('ef_lf_main')) {
      var yl = C.yearOf('ef_lf_main', 'TOTAL|TOTAL|PER');
      if (yl) {
        var lt = C.at('ef_lf_main', 'TOTAL|TOTAL|PER', yl), la = C.at('ef_lf_main', 'TOTAL|TOTAL|AWU', yl);
        var AL = ageSet(C, 'ef_lf_main', 'TOTAL|PER', yl), lb = barRows(C, AL.map(function (a) { var v = C.at('ef_lf_main', a[0] + '|TOTAL|PER', yl), aw = C.at('ef_lf_main', a[0] + '|TOTAL|AWU', yl); return { n: a[1][i], p: v != null && lt ? v / lt * 100 : null, sub: v != null ? C.nf(v, 0) + (aw != null && v ? ' · ' + C.nf(aw / v, 2) + ' ' + T.awuP[i] : '') : '' }; }));
        var lp = pieOf(C, AL.map(function (a) { return { name: a[1][i], v: C.at('ef_lf_main', a[0] + '|TOTAL|PER', yl) }; }), T.persons[i], T.labour[i] + ' ' + yl, C.nf(lt, 0), T.persons[i] + ' ' + yl);
        out += h3(T.labour[i], yl) + '<div class="fsh-kpis">' + kpi(T.persons[i], C.nf(lt, 0), yl) + (la != null ? kpi(T.awu[i], C.nf(la, 0), la && lt ? C.nf(la / lt, 2) + ' ' + T.awuP[i] : '') : '') + '</div>' + two(lb, lp);
      }
    }
    if (C.has('ef_lf_fam')) {
      var yf = C.yearOf('ef_lf_fam', 'TOTAL|HLD'), ft = yf ? C.at('ef_lf_fam', 'TOTAL|HLD', yf) : null;
      if (ft) {
        var fm = [['PC100', T.famAll[i]], ['PC50-99', T.famMost[i]], ['PC_GT0-49', T.famSome[i]], ['PC0', T.famNone[i]]];
        out += h3(T.fam[i], yf) + two(barRows(C, fm.map(function (a) { var v = C.at('ef_lf_fam', a[0] + '|HLD', yf); return { n: a[1], p: v != null ? v / ft * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.holdings[i] : '' }; })),
          pieOf(C, fm.map(function (a) { return { name: a[1], v: C.at('ef_lf_fam', a[0] + '|HLD', yf) }; }), T.holdings[i], T.fam[i] + ' ' + yf, C.nf(ft, 0), T.holdings[i] + ' ' + yf));
      }
    }
    if (C.has('ef_lf_size')) {
      var yz = C.yearOf('ef_lf_size', 'TOTAL|TOTAL|PER');
      if (yz) {
        var zs = [['HA0', T.sz0[i]], ['HA_GT0_LT5', T.sz1[i]], ['HA5-29', T.sz2[i]], ['HA30-99', T.sz3[i]], ['HA_GE100', T.sz4[i]], ['TOTAL', T.tot[i]]];
        var zr = zs.map(function (a) { var pe = C.at('ef_lf_size', a[0] + '|TOTAL|PER', yz), aw = C.at('ef_lf_size', a[0] + '|TOTAL|AWU', yz), nf0 = C.at('ef_lf_size', a[0] + '|FLF_D_RNFAM|AWU', yz), nr = C.at('ef_lf_size', a[0] + '|FLF_D_NR|AWU', yz);
          if (!pe) return null; return [esc(a[1]), C.nf(pe, 0), aw != null ? C.nf(aw, 0) : '—', aw && nf0 != null ? C.pc(nf0 / aw * 100, 1) : '—', aw && nr != null ? C.pc(nr / aw * 100, 1) : '—']; }).filter(Boolean);
        if (zr.length) out += h3(T.labSize[i], yz) + table([T.size[i], T.persons[i], T.awu[i], T.nonFam[i], T.nonReg[i]], zr);
      }
    }
    if (C.has('ef_mp_voctraining')) {
      var yv = C.yearOf('ef_mp_voctraining', 'TOTAL|TOTAL|HLD');
      if (yv) {
        var vr = ageSet(C, 'ef_mp_voctraining', 'TOTAL|HLD', yv).concat([['TOTAL', T.tot]]).map(function (a) { var t = C.at('ef_mp_voctraining', a[0] + '|TOTAL|HLD', yv), m = C.at('ef_mp_voctraining', a[0] + '|M12|HLD', yv);
          return t && m != null ? [esc(a[1][i]), C.nf(t, 0), C.nf(m, 0), C.pc(m / t * 100, 1)] : null; }).filter(Boolean);
        var vt = C.at('ef_mp_voctraining', 'TOTAL|TOTAL|HLD', yv), vm = C.at('ef_mp_voctraining', 'TOTAL|M12|HLD', yv), vn = C.at('ef_mp_voctraining', 'TOTAL|NVR_NM12|HLD', yv);
        if (vr.length) out += h3(T.voc[i], yv) + two(table([T.age[i], T.holdings[i], T.vocYes[i], '%'], vr), pieOf(C, [{ name: T.vocYes[i], v: vm }, { name: T.vocNo[i], v: vn }], T.holdings[i], T.voc[i] + ' ' + yv, C.nf(vt, 0), T.holdings[i] + ' ' + yv));
      }
    }
    if (C.has('ef_mp_manorg')) {
      var yo = C.yearOf('ef_mp_manorg', 'TOTAL|TOTAL|ORG|HLD'), ot = yo ? C.at('ef_mp_manorg', 'TOTAL|TOTAL|TOTAL|HLD', yo) : null, oh = yo ? C.at('ef_mp_manorg', 'TOTAL|TOTAL|ORG|HLD', yo) : null, oa = yo ? C.at('ef_mp_manorg', 'TOTAL|TOTAL|ORG|HA', yo) : null, oat = yo ? C.at('ef_mp_manorg', 'TOTAL|TOTAL|TOTAL|HA', yo) : null;
      if (ot && oh != null) {
        var oar = ageSet(C, 'ef_mp_manorg', 'TOTAL|ORG|HLD', yo).map(function (a) { var t = C.at('ef_mp_manorg', a[0] + '|TOTAL|TOTAL|HLD', yo), g = C.at('ef_mp_manorg', a[0] + '|TOTAL|ORG|HLD', yo); return t && g != null ? { n: a[1][i], p: g / t * 100, sub: C.nf(g, 0) + ' ' + T.holdings[i] } : null; }).filter(Boolean);
        out += h3(T.orgM[i], yo) + '<div class="fsh-kpis">' + kpi(T.orgHld[i], C.nf(oh, 0), C.pc(oh / ot * 100, 1) + ' ' + T.ofAll[i]) + (oa != null && oat ? kpi(T.orgHa[i], C.nf(oa, 0) + ' ' + T.ha[i], C.pc(oa / oat * 100, 1) + ' ' + T.of[i] + ' ' + T.uaa[i]) : '') + '</div>' +
          (oar.length ? '<p class="di-field-hint" style="margin:4px 0">' + esc(T.orgShare[i]) + ' · ' + esc(T.age[i]) + '</p>' + barRows(C, oar, Math.max.apply(null, oar.map(function (r) { return r.p; })) || 1) : '');
        var otr = [['FULL', T.full[i]], ['BASIC', T.basic[i]], ['PRACT', T.pract[i]]];
        if (oh) out += h3(T.orgTr[i], yo) + two(barRows(C, otr.map(function (a) { var v = C.at('ef_mp_manorg', 'TOTAL|' + a[0] + '|ORG|HLD', yo); return { n: a[1], p: v != null ? v / oh * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.holdings[i] : '' }; })),
          pieOf(C, otr.map(function (a) { return { name: a[1], v: C.at('ef_mp_manorg', 'TOTAL|' + a[0] + '|ORG|HLD', yo) }; }), T.holdings[i], T.orgTr[i] + ' ' + yo, C.nf(oh, 0), T.holdings[i] + ' ' + yo));
      }
    }
    return out;
  }
  /* 2. Tecnología, maquinaria y renovables */
  function secTech(C, lg) {
    var i = C.i, out = '';
    if (C.has('ef_mp_digi')) {
      var y = C.yearOf('ef_mp_digi', 'TOTAL|HLD'), tot = y ? C.at('ef_mp_digi', 'TOTAL|HLD', y) : null;
      if (tot) {
        var items = [['ACS_INET', T.inet[i]], ['MIS_USE', T.mis[i]], ['MAC_PFRM', T.pf[i]], ['MAC_LSM', T.lsm[i]], ['MAC_ROB', T.rob[i]]];
        out += h3(T.dig[i], y) + barRows(C, items.map(function (a) { var v = C.at('ef_mp_digi', a[0] + '|HLD', y); return { n: a[1], p: v != null ? v / tot * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.holdings[i] : '' }; }));
      }
    }
    if (C.has('ef_mp_digicr')) {
      var yc = C.yearOf('ef_mp_digicr', 'TOTAL|MAC_PFRM|HLD'), pf = yc ? C.at('ef_mp_digicr', 'TOTAL|MAC_PFRM|HLD', yc) : null;
      if (pf) {
        var tech = [['MAC_VRT', T.vrt[i]], ['MAC_PMON_CR', T.pmon[i]], ['MAC_ASOIL', T.asoil[i]], ['MAC_BDS_PPP', T.bds[i]], ['MAC_ROB_PPP', T.robp[i]]];
        out += h3(T.pfTech[i], yc) + barRows(C, tech.map(function (a) { var v = C.at('ef_mp_digicr', 'TOTAL|' + a[0] + '|HLD', yc); return { n: a[1], p: v != null ? v / pf * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.holdings[i] : '' }; })) +
          '<p class="di-field-hint" style="margin:4px 0 0">' + esc(T.of[i]) + ' ' + C.nf(pf, 0) + ' ' + esc(T.holdings[i]) + ' · ' + esc(T.pf[i]) + '</p>';
        var ar = ageSet(C, 'ef_mp_digicr', 'MAC_PFRM|HLD', yc).map(function (a) { var m = C.at('ef_mp_digicr', a[0] + '|MAC_PFRM|HLD', yc), n = C.at('ef_mp_digicr', a[0] + '|NMAC_PFRM|HLD', yc); return m != null && n != null && m + n ? { n: a[1][i], p: m / (m + n) * 100, sub: C.nf(m + n, 0) + ' ' + T.holdings[i] } : null; }).filter(Boolean);
        if (ar.length) out += h3(T.pfAge[i], yc) + barRows(C, ar, Math.max.apply(null, ar.map(function (r) { return r.p; })) || 1);
      }
    }
    if (C.has('ef_mp_mach')) {
      var ym = C.yearOf('ef_mp_mach', 'TOTAL|HLD'), mt = ym ? C.at('ef_mp_mach', 'TOTAL|HLD', ym) : null;
      if (mt) {
        var mi = [['MAC_TSP_TRT', T.trt[i]], ['MAC_TSPSP', T.tsp[i]], ['MAC_CHVT', T.chvt[i]], ['MAC_FMHVT_OTH', T.hvt[i]]];
        out += h3(T.mach[i], ym) + barRows(C, mi.map(function (a) { var v = C.at('ef_mp_mach', a[0] + '|HLD', ym); return { n: a[1], p: v != null ? v / mt * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.holdings[i] : '' }; }));
      }
    }
    if (C.has('ef_mp_digilsk')) {
      var yk = C.yearOf('ef_mp_digilsk', 'TOTAL|MAC_LSM|HLD'), km = yk ? C.at('ef_mp_digilsk', 'TOTAL|MAC_LSM|HLD', yk) : null, kn = yk ? C.at('ef_mp_digilsk', 'TOTAL|NMAC_LSM|HLD', yk) : null, kt = km != null && kn != null ? km + kn : null;
      if (kt) {
        var kitems = [['MAC_LSM', T.lsm[i]], ['MAC_MLK_ROB', T.mRob[i]], ['MAC_AFDS', T.mAf[i]], ['MAC_GM_AFD', T.mGm[i]], ['MAC_AREG', T.mClim[i]], ['MAC_WHMON', T.mWh[i]]];
        out += h3(T.lskM[i], yk) + barRows(C, kitems.map(function (a) { var v = C.at('ef_mp_digilsk', 'TOTAL|' + a[0] + '|HLD', yk); return { n: a[1], p: v != null ? v / kt * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.holdings[i] : '' }; })) +
          '<p class="di-field-hint" style="margin:4px 0 0">' + esc(T.of[i]) + ' ' + C.nf(kt, 0) + ' ' + esc(T.holdings[i]) + ' · ' + esc(T.lskUniv[i]) + '</p>';
        var ksz = [['LSU_GE0_LT5', T.ls0[i]], ['LSU5-19', T.ls1[i]], ['LSU20-99', T.ls2[i]], ['LSU100-499', T.ls3[i]], ['LSU_GE500', T.ls4[i]]];
        var krows = ksz.map(function (a) { var m = C.at('ef_mp_digilsk', a[0] + '|MAC_LSM|HLD', yk), n = C.at('ef_mp_digilsk', a[0] + '|NMAC_LSM|HLD', yk), r = C.at('ef_mp_digilsk', a[0] + '|MAC_MLK_ROB|HLD', yk);
          return m != null && n != null && m + n ? [esc(a[1]), C.nf(m + n, 0), C.pc(m / (m + n) * 100, 1), r != null ? C.pc(r / (m + n) * 100, 1) : '—'] : null; }).filter(Boolean);
        if (krows.length) out += h3(T.lsuSize[i], yk) + table([T.lsu[i], T.holdings[i], T.anyMach[i], T.robShare[i]], krows);
      }
    }
    if (C.has('ef_mp_renerg')) {
      var yr = C.yearOf('ef_mp_renerg', 'REN|HLD'), rn = yr ? C.at('ef_mp_renerg', 'REN|HLD', yr) : null, nr = yr ? C.at('ef_mp_renerg', 'NREN|HLD', yr) : null, rt = rn != null && nr != null ? rn + nr : null;
      if (rt) {
        var ri = [['REN', T.renAll[i]], ['REN_SOL_PV', T.pv[i]], ['REN_SOL_TH', T.sth[i]], ['REN_WND', T.wnd[i]], ['REN_BIOM', T.biom[i]], ['REN_BIOG', T.biog[i]], ['REN_HYD', T.hyd[i]], ['REN_OTH', T.oth[i]]];
        out += h3(T.ren[i], yr) + barRows(C, ri.map(function (a) { var v = C.at('ef_mp_renerg', a[0] + '|HLD', yr); return { n: a[1], p: v != null ? v / rt * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.holdings[i] : '' }; }));
      }
    }
    return out;
  }
  /* 3. Riego y prácticas del suelo */
  function secIrri(C, lg) {
    var i = C.i, out = '';
    if (C.has('ef_mp_irri')) {
      var y = C.yearOf('ef_mp_irri', 'TOTAL|UAA_IT|HA'), tot = y ? C.at('ef_mp_irri', 'TOTAL|UAA_IT|HA', y) : null;
      if (tot) {
        var m3 = C.at('ef_mp_irri', 'TOTAL|UAA_IT|M3', y), hl = C.at('ef_mp_irri', 'TOTAL|UAA_IT|HLD', y);
        out += h3(T.irri[i], y) + '<div class="fsh-kpis">' + kpi(T.irrArea[i], C.nf(tot, 0) + ' ' + T.ha[i], y) + (hl != null ? kpi(T.irrHld[i], C.nf(hl, 0), y) : '') + (m3 != null ? kpi(T.irrVol[i], C.nf(m3 / 1000, 0) + ' ' + '10³ ' + T.m3[i], tot ? C.nf(m3 / tot, 0) + ' ' + T.m3[i] + '/' + T.ha[i] : '') : '') + '</div>';
        var meth = [['SURF', T.surf[i]], ['SPLR', T.splr[i]], ['DRIP', T.drip[i]]];
        out += two(barRows(C, meth.map(function (a) { var v = C.at('ef_mp_irri', a[0] + '|UAA_IT|HA', y); return { n: a[1], p: v != null ? v / tot * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.ha[i] : '' }; })),
          pieOf(C, meth.map(function (a) { return { name: a[1], v: C.at('ef_mp_irri', a[0] + '|UAA_IT|HA', y) }; }), T.ha[i], T.irri[i] + ' ' + y, C.nf(tot, 0), T.ha[i] + ' ' + y));
        var src = [['FSW_ON_OF_FRM', T.fsw[i]], ['FGW_ON_FRM', T.fgw[i]], ['WSN_OF_FRM', T.wsn[i]], ['RUWW_T', T.ruww[i]], ['OTH', T.oth[i]]], ws = src.map(function (a) { return { name: a[1], v: C.at('ef_mp_irri', a[0] + '|UAA_IT|HA', y) }; });
        var wsum = ws.reduce(function (a, b) { return a + (b.v || 0); }, 0);
        if (wsum > 0) out += h3(T.watSrc[i], y) + barRows(C, ws.map(function (w) { return { n: w.name, p: w.v != null ? w.v / wsum * 100 : null, sub: w.v != null ? C.nf(w.v, 0) + ' ' + T.ha[i] : '' }; })) + '<p class="di-field-hint" style="margin:4px 0 0">' + esc(T.calc[i].split('.')[0]) + '. ' + esc(T.of[i]) + ' ' + C.nf(wsum, 0) + ' ' + esc(T.ha[i]) + '</p>';
      }
    }
    if (C.has('ef_lus_irri')) {
      var yi = C.yearOf('ef_lus_irri', 'UAA|HA'), it = yi ? C.at('ef_lus_irri', 'UAA|HA', yi) : null;
      if (it) {
        var cr = [['C1000X1500T', L('Cereales (sin maíz ni arroz)', 'Cereals (excluding maize and rice)', 'Céréales (hors maïs et riz)', 'Cereali (senza mais e riso)')], ['C1500T', L('Maíz grano', 'Grain maize', 'Maïs grain', 'Mais da granella')], ['C2000T', L('Arroz', 'Rice', 'Riz', 'Riso')], ['R1000T', L('Patata', 'Potatoes', 'Pommes de terre', 'Patate')], ['R2000T', L('Remolacha azucarera', 'Sugar beet', 'Betterave sucrière', 'Barbabietola da zucchero')],
          ['I1120T', L('Girasol', 'Sunflower', 'Tournesol', 'Girasole')], ['G0000T', L('Forrajes verdes', 'Plants harvested green', 'Plantes récoltées en vert', 'Piante raccolte verdi')], ['V0000_S0000TO', L('Hortícolas y fresa al aire libre', 'Field vegetables and strawberries', 'Légumes et fraises de plein champ', 'Ortaggi e fragole in pieno campo')],
          ['J0000T', T.grass], ['F0000T', L('Frutales (sin cítricos ni uva)', 'Fruit and nuts (excluding citrus and grapes)', 'Fruits et fruits à coque (hors agrumes et raisin)', 'Frutta e frutta a guscio (senza agrumi e uva)')], ['T0000T', L('Cítricos', 'Citrus fruits', 'Agrumes', 'Agrumi')], ['W1000T', L('Uva', 'Grapes', 'Raisin', 'Uva')], ['O1000T', L('Olivar', 'Olives', 'Olives', 'Olive')]];
        var rows = cr.map(function (a) { var v = C.at('ef_lus_irri', a[0] + '|HA', yi); return { n: a[1][i], p: v != null ? v / it * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.ha[i] : '' }; }).filter(function (r) { return r.p != null && r.p > 0; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 8);
        if (rows.length) out += h3(T.irrCrop[i], yi) + barRows(C, rows, rows[0].p || 1) + '<p class="di-field-hint" style="margin:4px 0 0">' + esc(T.irrArea[i]) + ': ' + C.nf(it, 0) + ' ' + esc(T.ha[i]) + '</p>';
      }
    }
    if (C.has('ef_mp_prac')) {
      var yp = C.yearOf('ef_mp_prac', 'ARA|HA'), at = yp ? C.at('ef_mp_prac', 'ARA|HA', yp) : null;
      if (at) {
        var tl = [['TIL_CV', T.tilCv[i]], ['TIL_CSERV', T.tilCs[i]], ['TIL_ZERO', T.tilZ[i]]], ys0 = (C.dd.years.ef_mp_prac || [])[0];
        out += h3(T.til[i], yp) + two(barRows(C, tl.map(function (a) { var v = C.at('ef_mp_prac', a[0] + '|HA', yp), v0 = ys0 && ys0 !== yp ? C.at('ef_mp_prac', a[0] + '|HA', ys0) : null, t0 = ys0 && ys0 !== yp ? C.at('ef_mp_prac', 'ARA|HA', ys0) : null; return { n: a[1], p: v != null ? v / at * 100 : null, sub: v0 != null && t0 ? ys0 + ': ' + C.pc(v0 / t0 * 100, 1) : '' }; })),
          pieOf(C, tl.map(function (a) { return { name: a[1], v: C.at('ef_mp_prac', a[0] + '|HA', yp) }; }), T.ha[i], T.til[i] + ' ' + yp, C.nf(at, 0), T.ha[i] + ' ' + yp));
      }
    }
    if (C.has('ef_mp_soil')) {
      var ys = C.yearOf('ef_mp_soil', 'ARA|HA'), as = ys ? C.at('ef_mp_soil', 'ARA|HA', ys) : null;
      if (as) {
        var sc = [['SC_WNTCR', T.scW[i]], ['SC_COV_INTCR', T.scC[i]], ['SC_PLRES', T.scR[i]], ['SC_BARE', T.scB[i]], ['SC_MAPL', T.scM[i]]];
        out += h3(T.soil[i], ys) + two(barRows(C, sc.map(function (a) { var v = C.at('ef_mp_soil', a[0] + '|HA', ys); return { n: a[1], p: v != null ? v / as * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.ha[i] : '' }; })),
          pieOf(C, sc.map(function (a) { return { name: a[1], v: C.at('ef_mp_soil', a[0] + '|HA', ys) }; }), T.ha[i], T.soil[i] + ' ' + ys, C.nf(as, 0), T.ha[i] + ' ' + ys));
      }
    }
    if (C.has('ef_mp_efa')) {
      var ye = C.yearOf('ef_mp_efa', 'TOTAL|HLD'), et = ye ? C.at('ef_mp_efa', 'TOTAL|HLD', ye) : null;
      if (et) {
        var ef = [['LE_HG_TL', T.efHg[i]], ['LE_FM_BS', T.efFm[i]], ['LE_SW', T.efSw[i]], ['TER', T.efTer[i]], ['AGRFOR', T.efAgf[i]]];
        out += h3(T.efa[i], ye) + barRows(C, ef.map(function (a) { var v = C.at('ef_mp_efa', a[0] + '|HLD', ye); return { n: a[1], p: v != null ? v / et * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.holdings[i] : '' }; }));
      }
    }
    return out;
  }
  /* 4. Estructura: ganado, uso del suelo, frutales */
  function secStruct(C, lg) {
    var i = C.i, out = '';
    if (C.has('ef_lsk_main')) {
      var y = C.yearOf('ef_lsk_main', 'A2000|HD') || C.yearOf('ef_lsk_main', 'A3100|HD');
      if (y) {
        var sp = [['A2000', T.bov[i]], ['A3100', T.pig[i]], ['A4100', T.shp[i]], ['A4200', T.gt[i]], ['A5000', T.pou[i]], ['A6111', T.rab[i]]], ys0 = (C.dd.years.ef_lsk_main || [])[0];
        var rows = sp.map(function (a) { var h = C.at('ef_lsk_main', a[0] + '|HLD', y), hd = C.at('ef_lsk_main', a[0] + '|HD', y), lsu = C.at('ef_lsk_main', a[0] + '|LSU', y), h0 = ys0 && ys0 !== y ? C.at('ef_lsk_main', a[0] + '|HLD', ys0) : null;
          if (!h && !hd) return null; return [esc(a[1]), h != null ? C.nf(h, 0) : '—', hd != null ? C.nf(hd, 0) : '—', lsu != null ? C.nf(lsu, 0) : '—', h0 && h != null ? C.pc((h / h0 - 1) * 100, 0) : '—']; }).filter(Boolean);
        var bees = C.last('ef_lsk_bees', 'A6710R|HIVE'), bh = C.last('ef_lsk_bees', 'A6710R|HLD');
        if (bees && bh) rows.push([esc(T.bee[i]), C.nf(bh[1], 0), C.nf(bees[1], 0) + ' ' + esc(T.hives[i]), '—', '—']);
        var lsuItems = sp.map(function (a) { return { name: a[1], v: C.at('ef_lsk_main', a[0] + '|LSU', y) }; });
        if (rows.length) out += h3(T.lsk[i], y) + two(table([T.sp[i], T.holdings[i], T.head[i], T.lsu[i], T.holdings[i] + ' ' + T.changeSince[i] + ' ' + (ys0 || '')], rows), pieOf(C, lsuItems, T.lsu[i], T.lsk[i] + ' ' + y, '', T.lsu[i] + ' ' + y));
      }
    }
    if (C.has('ef_lus_main')) {
      var yl = C.yearOf('ef_lus_main', 'UAA|HA'), ut = yl ? C.at('ef_lus_main', 'UAA|HA', yl) : null, ys1 = (C.dd.years.ef_lus_main || [])[0];
      if (ut) {
        var lu = [['ARA', T.ara[i]], ['J0000T', T.grass[i]], ['PECR', T.pecr[i]], ['K0000T', T.kg[i]]];
        var rowsL = lu.map(function (a) { var v = C.at('ef_lus_main', a[0] + '|HA', yl), v0 = ys1 && ys1 !== yl ? C.at('ef_lus_main', a[0] + '|HA', ys1) : null; return { n: a[1], p: v != null ? v / ut * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.ha[i] + (v0 ? ' (' + C.pc((v / v0 - 1) * 100, 0) + ' ' + T.changeSince[i] + ' ' + ys1 + ')' : '') : '' }; });
        var org = C.at('ef_lus_main', 'UAAXK0000_ORG|HA', yl), hl = C.at('ef_lus_main', 'UAA|HLD', yl);
        out += h3(T.lus[i], yl) + '<div class="fsh-kpis">' + kpi(T.uaa[i], C.nf(ut, 0) + ' ' + T.ha[i], hl ? C.nf(hl, 0) + ' ' + T.holdings[i] + ' · ' + C.nf(ut / hl, 1) + ' ' + T.ha[i] + '/' + T.hold1[i] : yl) +
          (org != null ? kpi(T.org[i], C.nf(org, 0) + ' ' + T.ha[i], C.pc(org / ut * 100, 1) + ' ' + T.of[i] + ' ' + T.uaa[i]) : '') + '</div>' +
          two(barRows(C, rowsL, 100), pieOf(C, lu.map(function (a) { return { name: a[1], v: C.at('ef_lus_main', a[0] + '|HA', yl) }; }), T.ha[i], T.lus[i] + ' ' + yl, C.nf(ut, 0), T.ha[i] + ' ' + yl));
      }
    }
    if (C.has('ef_lus_pegrass')) {
      var yg = C.yearOf('ef_lus_pegrass', 'J0000|HA'), gt0 = yg ? C.at('ef_lus_pegrass', 'J0000|HA', yg) : null;
      if (gt0) {
        var gp = [['J1000', T.pg1[i]], ['J2000', T.pg2[i]], ['J3000TE', T.pg3[i]]], gh = C.at('ef_lus_pegrass', 'J0000|HLD', yg);
        out += h3(T.pg[i], yg) + '<div class="fsh-kpis">' + kpi(T.grass[i], C.nf(gt0, 0) + ' ' + T.ha[i], gh ? C.nf(gh, 0) + ' ' + T.holdings[i] + ' · ' + C.nf(gt0 / gh, 1) + ' ' + T.ha[i] + '/' + T.hold1[i] : yg) + '</div>' +
          two(barRows(C, gp.map(function (a) { var v = C.at('ef_lus_pegrass', a[0] + '|HA', yg); return { n: a[1], p: v != null ? v / gt0 * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.ha[i] : '' }; })),
            pieOf(C, gp.map(function (a) { return { name: a[1], v: C.at('ef_lus_pegrass', a[0] + '|HA', yg) }; }), T.ha[i], T.pg[i] + ' ' + yg, C.nf(gt0, 0), T.ha[i] + ' ' + yg));
      }
    }
    if (C.has('ef_lus_allcrops')) {
      var yc = C.yearOf('ef_lus_allcrops', 'UAA|HA');
      if (yc) {
        var cl = [['C1110', T.c11], ['C1120', T.c12], ['C1300', T.c13], ['C1400', T.c14], ['C1500', T.c15], ['C1200', T.c16], ['C1600_1700_1900', T.c17], ['C2000', T.c20], ['P0000', T.pls], ['R1000', T.pot], ['R2000', T.sbt], ['I1110', T.rps], ['I1120', T.sfl], ['I1130', T.soy], ['G1000', T.tgr], ['G3000', T.gmz], ['V0000_S0000', T.veg], ['Q0000', T.fal]];
        var cr2 = cl.map(function (a) { var ha = C.at('ef_lus_allcrops', a[0] + '|HA', yc), hd = C.at('ef_lus_allcrops', a[0] + '|HLD', yc); return ha ? { k: a[1][i], ha: ha, hd: hd } : null; }).filter(Boolean).sort(function (x, y) { return y.ha - x.ha; }).slice(0, 12);
        if (cr2.length) out += h3(T.crp[i], yc) + table([T.crop[i], T.ha[i], T.holdings[i], T.avgHa[i]], cr2.map(function (r) { return [esc(r.k), C.nf(r.ha, 0), r.hd != null ? C.nf(r.hd, 0) : '—', r.hd ? C.nf(r.ha / r.hd, 1) : '—']; }));
      }
    }
    var og = Object.keys(ORCH).map(function (k) {
      var spec = ORCH[k], ds = spec[0]; if (!C.has(ds)) return '';
      var y = C.yearOf(ds, spec[1] + '|TOTAL|HA'), tot = y ? C.at(ds, spec[1] + '|TOTAL|HA', y) : null; if (!tot) return '';
      var rows = spec[2].map(function (a) { var v = C.at(ds, spec[1] + '|' + a[0] + '|HA', y); return { n: a[1][i], p: v != null ? v / tot * 100 : null, sub: v != null ? C.nf(v, 0) + ' ' + T.ha[i] : '' }; });
      return '<div style="margin:8px 0"><b style="font-size:13px">' + esc(T[spec[3]][i]) + '</b> <span class="fsh-m">' + C.nf(tot, 0) + ' ' + esc(T.ha[i]) + '</span>' + barRows(C, rows) + '</div>';
    }).join('');
    if (og) out += h3(T.orch[i]) + og;
    return out;
  }
  function secPrices(P, cc, lg) {
    var i = IX[lg], o = P && P.countries && P.countries[cc]; if (!o) return '';
    var nf = function (v, dd) { return (+v).toLocaleString(LOC[lg], { minimumFractionDigits: dd, maximumFractionDigits: dd }); }, out = '';
    ['ft', 'fs', 'en'].forEach(function (g) {
      var rows = PI[g].map(function (a) { var y = o[a[0]]; if (!y || y['2025'] == null) return null; var v = y['2025']; return [esc(a[1][i]) + (a[2] ? ' <span class="fsh-m">(' + esc(T2(a[2])[i]) + ')</span>' : ''), nf(v, a[2] === 'kwh' || v < 100 ? 1 : 0)]; }).filter(Boolean);
      if (rows.length) out += h3(PT[g][i]) + table([PT.item[i], PT.price[i]], rows);
    });
    return out ? '<details class="sec-fold" id="fc-prices" style="margin:8px 0"><summary>' + esc(PT.h[i]) + '</summary>' + out + '<p class="di-movers-hint" style="margin:8px 0 0">' + esc(PT.note[i]) + '</p></details>' : '';
  }
  function T2(k) { return PT[k]; }
  function render(d, lg, region, P) {
    var o = region ? (d.regions && d.regions[region]) : d.nat; if (!o) return '';
    var abvList = region ? (o.abv || []) : (d.abvNat || []), C = ctx(d, o, abvList, lg), i = C.i; C.dd = d;
    var nat = region ? null : d, blocks = [[T.s1[i], secManagers(C, lg, nat), ['ef_mp_training', 'ef_mp_tenure', 'ef_lf_main', 'ef_lf_fam', 'ef_lf_size', 'ef_mp_voctraining', 'ef_mp_manorg'], 'managers'], [T.s2[i], secTech(C, lg), ['ef_mp_digi', 'ef_mp_digicr', 'ef_mp_mach', 'ef_mp_renerg', 'ef_mp_digilsk'], 'tech'],
      [T.s3[i], secIrri(C, lg), ['ef_mp_irri', 'ef_lus_irri', 'ef_mp_prac', 'ef_mp_soil', 'ef_mp_efa'], 'irri'], [T.s4[i], secStruct(C, lg), ['ef_lsk_main', 'ef_lus_main', 'ef_lus_pegrass', 'ef_lus_allcrops', 'ef_lus_orchpome', 'ef_lus_orchstone', 'ef_lus_orchcitrus', 'ef_lus_orcholives', 'ef_lus_orchgrapes'], 'struct']];
    if (!region) { var pb = secPrices(P, d.cc, lg); if (pb) blocks.push([PT.h[i], pb, [], 'prices', true]); }
    blocks = blocks.filter(function (b) { return b[1]; }); if (!blocks.length) return '';
    var anyAbv = blocks.some(function (b) { return b[2].some(function (ds) { return C.abv(ds); }); });
    var body = blocks.map(function (b, n) {
      var ab = b[2].some(function (ds) { return C.abv(ds); });
      if (b[4]) return b[1];
      return '<details class="sec-fold" id="fc-' + b[3] + '"' + (n === 0 ? ' open' : '') + ' style="margin:8px 0"><summary>' + esc(b[0]) + '</summary>' + (ab ? '<p class="di-movers-hint" style="margin:8px 0">' + esc(region ? T.abvR[i] : T.abvC[i]) + '</p>' : '') + b[1] + '</details>';
    }).join('');
    return '<section class="di-card ps-rm gb-card" id="ps-farm-census" style="max-width:none"><h2 class="ps-rm-h">' + esc(T.h[i]) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(T.sub[i]) + (region ? '' : '') + '</p>' + body +
      '<p class="di-movers-hint" style="margin:10px 0 0;max-width:860px">' + esc(T.calc[i]) + (anyAbv ? '' : '') + '</p><p class="di-field-hint" style="margin:8px 0 0">' + esc(T.src[i]) + ' <a href="https://ec.europa.eu/eurostat/web/agriculture/data/database" rel="noopener" target="_blank">' + esc(T.srcA[i]) + '</a></p></section>';
  }
  function load(cc) {
    var sp = global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath : function (u) { return u; };
    return DOCS[cc] || (DOCS[cc] = fetch(sp('data/views/census/' + cc + '.json')).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }));
  }
  var PDOC = null;
  function loadP() { var sp = global.DehesaShared && global.DehesaShared.sitePath ? global.DehesaShared.sitePath : function (u) { return u; }; return PDOC || (PDOC = fetch(sp('data/views/input-prices-2025.json')).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })); }
  function html(lg, cc, region) { lg = LOC[lg] ? lg : 'es'; return Promise.all([load(cc), region ? null : loadP()]).then(function (r) { return r[0] ? render(r[0], lg, region || null, r[1]) : ''; }); }
  function mount(el, lg, cc, region) {
    if (!el) return Promise.resolve(false);
    return html(lg, cc, region).then(function (h) { if (!h) return false; el.innerHTML = h; return true; });
  }
  global.DIFarmCensus = { mount: mount, html: html };
})(window);
