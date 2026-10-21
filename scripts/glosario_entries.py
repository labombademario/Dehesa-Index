# id, cat, terms{lang:[...]}, defs{lang}
E = []
def add(i, cat, es, en, fr, it, d_es, d_en, d_fr, d_it):
    E.append({"id": i, "c": cat, "t": {"es": es, "en": en, "fr": fr, "it": it}, "d": {"es": d_es, "en": d_en, "fr": d_fr, "it": d_it}})

# ---- fuentes e informes
add("wasde","inf",["WASDE"],["WASDE"],["WASDE"],["WASDE"],
 "Informe mensual del USDA (World Agricultural Supply and Demand Estimates) con las previsiones de oferta y demanda, mundiales y de EE. UU., de cereales, oleaginosas, algodón, carne, lácteos y azúcar.",
 "Monthly USDA report (World Agricultural Supply and Demand Estimates) with world and US supply and demand forecasts for grains, oilseeds, cotton, meat, dairy and sugar.",
 "Rapport mensuel de l’USDA (World Agricultural Supply and Demand Estimates) avec les prévisions d’offre et de demande, mondiales et américaines, des céréales, oléagineux, coton, viande, produits laitiers et sucre.",
 "Rapporto mensile dell’USDA (World Agricultural Supply and Demand Estimates) con le previsioni di offerta e domanda, mondiali e statunitensi, di cereali, semi oleosi, cotone, carne, latte e zucchero.")
add("psd","inf",["PSD"],["PSD"],["PSD"],["PSD"],
 "Production, Supply and Distribution: base de datos del USDA (FAS) con producción, consumo, comercio y existencias por país y campaña. Es la base del informe WASDE.",
 "Production, Supply and Distribution: USDA (FAS) database of production, use, trade and stocks by country and marketing year. It underlies the WASDE report.",
 "Production, Supply and Distribution : base de données de l’USDA (FAS) sur la production, l’utilisation, le commerce et les stocks par pays et campagne. Elle alimente le rapport WASDE.",
 "Production, Supply and Distribution: banca dati dell’USDA (FAS) su produzione, consumo, commercio e scorte per paese e campagna. Alimenta il rapporto WASDE.")
add("usda","org",["USDA"],["USDA"],["USDA"],["USDA"],
 "Departamento de Agricultura de EE. UU.: publica la mayoría de las estadísticas agrarias del país (precios, cosechas, comercio, costes).",
 "US Department of Agriculture: publishes most US farm statistics (prices, crops, trade, costs).",
 "Département de l’Agriculture des États-Unis : publie la plupart des statistiques agricoles du pays (prix, récoltes, commerce, coûts).",
 "Dipartimento dell’Agricoltura degli Stati Uniti: pubblica la maggior parte delle statistiche agricole del paese (prezzi, raccolti, commercio, costi).")
add("nass","org",["NASS"],["NASS"],["NASS"],["NASS"],
 "National Agricultural Statistics Service: el servicio estadístico del USDA. Hace las encuestas de precios pagados al agricultor, superficies, rendimientos y existencias.",
 "National Agricultural Statistics Service: the USDA statistics agency. It runs the surveys of prices received by farmers, area, yields and stocks.",
 "National Agricultural Statistics Service : le service statistique de l’USDA. Il réalise les enquêtes sur les prix reçus par les agriculteurs, les surfaces, les rendements et les stocks.",
 "National Agricultural Statistics Service: il servizio statistico dell’USDA. Realizza le indagini su prezzi percepiti dagli agricoltori, superfici, rese e scorte.")
add("quickstats","org",["Quick Stats"],["Quick Stats"],["Quick Stats"],["Quick Stats"],
 "Buscador público de datos de NASS, de donde Dehesa lee los precios, superficies, rendimientos y existencias de EE. UU.",
 "NASS public data search tool, where Dehesa reads US prices, area, yields and stocks.",
 "Outil public de recherche de données de NASS, où Dehesa lit les prix, surfaces, rendements et stocks américains.",
 "Strumento pubblico di ricerca dati di NASS, da cui Dehesa legge prezzi, superfici, rese e scorte degli Stati Uniti.")
add("ers","org",["ERS"],["ERS"],["ERS"],["ERS"],
 "Economic Research Service del USDA: costes de producción, renta agraria, previsiones y análisis económicos.",
 "USDA Economic Research Service: production costs, farm income, forecasts and economic analysis.",
 "Economic Research Service de l’USDA : coûts de production, revenu agricole, prévisions et analyses économiques.",
 "Economic Research Service dell’USDA: costi di produzione, reddito agricolo, previsioni e analisi economiche.")
add("fas","org",["FAS"],["FAS"],["FAS"],["FAS"],
 "Foreign Agricultural Service del USDA: comercio exterior, mercados mundiales y la base PSD.",
 "USDA Foreign Agricultural Service: foreign trade, world markets and the PSD database.",
 "Foreign Agricultural Service de l’USDA : commerce extérieur, marchés mondiaux et base PSD.",
 "Foreign Agricultural Service dell’USDA: commercio estero, mercati mondiali e banca dati PSD.")
add("ams","org",["AMS"],["AMS"],["AMS"],["AMS"],
 "Agricultural Marketing Service del USDA: su servicio Market News publica precios diarios y semanales de mercado (ofertas de compra de grano, lácteos, carne).",
 "USDA Agricultural Marketing Service: its Market News service publishes daily and weekly market prices (grain bids, dairy, meat).",
 "Agricultural Marketing Service de l’USDA : son service Market News publie des prix de marché quotidiens et hebdomadaires (offres d’achat de grain, produits laitiers, viande).",
 "Agricultural Marketing Service dell’USDA: il servizio Market News pubblica prezzi di mercato giornalieri e settimanali (offerte di acquisto di cereali, latte, carne).")
add("ndpsr","inf",["NDPSR"],["NDPSR"],["NDPSR"],["NDPSR"],
 "National Dairy Products Sales Report (USDA AMS): precios semanales de mantequilla, queso cheddar, leche desnatada en polvo y suero realmente vendidos en EE. UU.",
 "National Dairy Products Sales Report (USDA AMS): weekly prices of butter, cheddar, nonfat dry milk and whey actually sold in the US.",
 "National Dairy Products Sales Report (USDA AMS) : prix hebdomadaires du beurre, du cheddar, du lait écrémé en poudre et du lactosérum réellement vendus aux États-Unis.",
 "National Dairy Products Sales Report (USDA AMS): prezzi settimanali di burro, cheddar, latte scremato in polvere e siero effettivamente venduti negli Stati Uniti.")
add("fsa","org",["FSA"],["FSA"],["FSA"],["FSA"],
 "Farm Service Agency del USDA: gestiona los pagos de los programas ARC y PLC y los préstamos agrarios.",
 "USDA Farm Service Agency: runs the ARC and PLC payment programmes and farm loans.",
 "Farm Service Agency de l’USDA : gère les paiements des programmes ARC et PLC et les prêts agricoles.",
 "Farm Service Agency dell’USDA: gestisce i pagamenti dei programmi ARC e PLC e i prestiti agricoli.")
add("arcplc","inf",["ARC-CO","PLC"],["ARC-CO","PLC"],["ARC-CO","PLC"],["ARC-CO","PLC"],
 "Programas de ayuda de EE. UU.: ARC-CO paga si el ingreso por acre del condado cae bajo su referencia; PLC paga si el precio de campaña baja del precio de referencia legal.",
 "US support programmes: ARC-CO pays when county revenue per acre falls below its benchmark; PLC pays when the marketing-year price falls below the statutory reference price.",
 "Programmes d’aide américains : ARC-CO paie si le revenu par acre du comté passe sous sa référence ; PLC paie si le prix de campagne tombe sous le prix de référence légal.",
 "Programmi di sostegno USA: ARC-CO paga se il ricavo per acro della contea scende sotto il riferimento; PLC paga se il prezzo di campagna scende sotto il prezzo di riferimento legale.")
add("eurostat","org",["Eurostat"],["Eurostat"],["Eurostat"],["Eurostat"],
 "Oficina estadística de la UE: reúne las cifras oficiales de los países miembros con definiciones comunes.",
 "The EU statistics office: gathers member countries’ official figures using common definitions.",
 "L’office statistique de l’UE : rassemble les chiffres officiels des pays membres avec des définitions communes.",
 "L’ufficio statistico dell’UE: raccoglie i dati ufficiali degli Stati membri con definizioni comuni.")
add("ipca","ind",["IPCA"],["HICP"],["IPCH"],["IPCA"],
 "Índice de Precios de Consumo Armonizado: mide la inflación con el mismo método en todos los países de la UE, así que se pueden comparar.",
 "Harmonised Index of Consumer Prices: measures inflation with the same method across EU countries, so they can be compared.",
 "Indice des prix à la consommation harmonisé : mesure l’inflation avec la même méthode dans tous les pays de l’UE, donc comparable.",
 "Indice armonizzato dei prezzi al consumo: misura l’inflazione con lo stesso metodo in tutti i paesi UE, quindi è confrontabile.")
add("ipc","ind",["IPC"],["CPI"],["IPC"],["IPC"],
 "Índice de Precios de Consumo: cuánto suben de media los precios de lo que compran los hogares.",
 "Consumer Price Index: how much, on average, the prices of what households buy have risen.",
 "Indice des prix à la consommation : de combien augmentent en moyenne les prix de ce que les ménages achètent.",
 "Indice dei prezzi al consumo: di quanto salgono in media i prezzi di ciò che le famiglie acquistano.")
add("ppi","ind",["PPI"],["PPI"],["PPI","IPP"],["PPI","IPP"],
 "Producer Price Index (índice de precios de producción): mide los precios que cobran los productores o fabricantes antes de llegar al consumidor.",
 "Producer Price Index: measures the prices producers or manufacturers receive before goods reach consumers.",
 "Indice des prix à la production : mesure les prix reçus par les producteurs ou fabricants avant d’arriver au consommateur.",
 "Indice dei prezzi alla produzione: misura i prezzi incassati da produttori o fabbricanti prima di arrivare al consumatore.")
add("wdi","inf",["WDI"],["WDI"],["WDI"],["WDI"],
 "World Development Indicators: indicadores del Banco Mundial (PIB, población, empleo, uso de la tierra) comparables entre países.",
 "World Development Indicators: World Bank indicators (GDP, population, employment, land use) comparable across countries.",
 "World Development Indicators : indicateurs de la Banque mondiale (PIB, population, emploi, usage des terres) comparables entre pays.",
 "World Development Indicators: indicatori della Banca mondiale (PIL, popolazione, occupazione, uso del suolo) confrontabili tra paesi.")
add("mapa","org",["MAPA"],["MAPA"],["MAPA"],["MAPA"],
 "Ministerio de Agricultura, Pesca y Alimentación de España: censos ganaderos, balances de cereales y precios en origen.",
 "Spain’s Ministry of Agriculture, Fisheries and Food: livestock censuses, cereal balances and farm-gate prices.",
 "Ministère espagnol de l’Agriculture, de la Pêche et de l’Alimentation : recensements d’élevage, bilans céréaliers et prix à la production.",
 "Ministero spagnolo dell’Agricoltura, Pesca e Alimentazione: censimenti zootecnici, bilanci dei cereali e prezzi alla produzione.")
add("cgc","org",["CGC"],["CGC"],["CGC"],["CGC"],
 "Canadian Grain Commission: publica entregas, exportaciones y existencias de grano de Canadá, semana a semana.",
 "Canadian Grain Commission: publishes Canada’s grain deliveries, exports and stocks week by week.",
 "Commission canadienne des grains : publie les livraisons, exportations et stocks de grains du Canada, semaine par semaine.",
 "Canadian Grain Commission: pubblica consegne, esportazioni e scorte di cereali del Canada, settimana per settimana.")
add("pac","pol",["PAC"],["CAP"],["PAC"],["PAC"],
 "Política Agrícola Común de la UE: las ayudas directas y de desarrollo rural que reciben los agricultores europeos.",
 "The EU Common Agricultural Policy: the direct payments and rural development support farmers in Europe receive.",
 "Politique agricole commune de l’UE : les aides directes et de développement rural reçues par les agriculteurs européens.",
 "Politica agricola comune dell’UE: i pagamenti diretti e il sostegno allo sviluppo rurale per gli agricoltori europei.")
# ---- términos de precio
add("silo","pre",["salida de silo","ex-silo"],["ex-silo","ex silo"],["départ silo"],["franco silo","ex silo"],
 "Precio de la mercancía en el silo o almacén del vendedor, cargada en camión. No incluye el transporte hasta el comprador.",
 "Price of the goods at the seller’s silo or store, loaded onto a truck. It does not include transport to the buyer.",
 "Prix de la marchandise au silo ou au magasin du vendeur, chargée sur camion. Ne comprend pas le transport jusqu’à l’acheteur.",
 "Prezzo della merce al silo o magazzino del venditore, caricata su camion. Non include il trasporto fino all’acquirente.")
add("fob","pre",["FOB"],["FOB"],["FOB"],["FOB"],
 "Free on Board: precio con la mercancía ya cargada en el barco, en el puerto de origen. Incluye los costes hasta el embarque; no incluye flete ni seguro.",
 "Free on Board: price with the goods already loaded on the ship at the port of origin. It includes costs up to loading; freight and insurance are not included.",
 "Free on Board : prix avec la marchandise déjà chargée sur le navire au port d’origine. Comprend les coûts jusqu’à l’embarquement ; ni fret ni assurance.",
 "Free on Board: prezzo con la merce già caricata sulla nave nel porto di origine. Include i costi fino all’imbarco; non include nolo né assicurazione.")
add("cif","pre",["CIF"],["CIF"],["CAF","CIF"],["CIF"],
 "Cost, Insurance and Freight: precio con el coste de la mercancía, el seguro y el flete hasta el puerto de destino.",
 "Cost, Insurance and Freight: price including the goods, insurance and freight to the destination port.",
 "Cost, Insurance and Freight : prix incluant la marchandise, l’assurance et le fret jusqu’au port de destination.",
 "Cost, Insurance and Freight: prezzo che include merce, assicurazione e nolo fino al porto di destinazione.")
add("lonja","pre",["lonja","lonjas"],["local market","market (lonja)"],["lonja","marché local"],["lonja","borsa merci"],
 "Mercado o junta local donde operadores y productores fijan cada semana un precio de referencia (Zaragoza, Lleida, Segovia…). Es una referencia de mercado, no el precio que cobrarás tú.",
 "Local market or board where traders and farmers set a weekly reference price (Zaragoza, Lleida, Segovia…). It is a market reference, not the price you will get.",
 "Marché ou bourse locale où négociants et agriculteurs fixent chaque semaine un prix de référence (Saragosse, Lleida, Ségovie…). C’est une référence de marché, pas le prix que vous toucherez.",
 "Mercato o borsa locale dove operatori e produttori fissano ogni settimana un prezzo di riferimento (Saragozza, Lleida, Segovia…). È un riferimento di mercato, non il prezzo che incasserai.")
add("farmgate","pre",["precio recibido por el productor","precio a pie de finca","pie de finca"],["price received by the producer","farm-gate price","farm-gate"],["prix reçu par le producteur","prix départ exploitation"],["prezzo percepito dal produttore","franco azienda"],
 "Lo que el agricultor cobra por su producto en la explotación. Suele ser menor que la cotización de mercado, porque no incluye transporte ni márgenes del comprador.",
 "What the farmer is paid for the product at the farm. It is usually lower than the market quote, because it excludes transport and the buyer’s margin.",
 "Ce que l’agriculteur reçoit pour son produit à l’exploitation. Il est en général inférieur à la cotation de marché, car il exclut transport et marges de l’acheteur.",
 "Ciò che l’agricoltore incassa per il prodotto in azienda. Di solito è inferiore alla quotazione di mercato, perché esclude trasporto e margini dell’acquirente.")
add("media-nacional","pre",["media nacional"],["national average"],["moyenne nationale"],["media nazionale"],
 "Media del país entera, calculada por la fuente oficial a partir de encuestas o de los mercados del país. No es el precio de una zona ni de un comprador concreto.",
 "Average for the whole country, computed by the official source from surveys or the country’s markets. It is not the price in one area or from one buyer.",
 "Moyenne de tout le pays, calculée par la source officielle à partir d’enquêtes ou des marchés du pays. Ce n’est pas le prix d’une zone ni d’un acheteur précis.",
 "Media dell’intero paese, calcolata dalla fonte ufficiale da indagini o dai mercati del paese. Non è il prezzo di una zona né di un acquirente preciso.")
add("cashbid","pre",["ofertas de compra en efectivo","oferta de compra en efectivo"],["cash bids","cash bid"],["offres d’achat au comptant"],["offerte di acquisto in contanti"],
 "Precio que un elevador, fábrica o planta ofrece hoy por el grano entregado allí. Cambia de un punto de compra a otro.",
 "Price an elevator, mill or plant offers today for grain delivered there. It differs from one buying point to another.",
 "Prix qu’un élévateur, une usine ou un site propose aujourd’hui pour le grain livré sur place. Il varie d’un point d’achat à l’autre.",
 "Prezzo che un elevatore, mulino o impianto offre oggi per il cereale consegnato lì. Cambia da un punto di acquisto all’altro.")
add("pesovivo","pre",["peso vivo"],["live weight"],["poids vif"],["peso vivo"],
 "El animal pesado vivo. Un precio por peso vivo no es comparable con uno por canal (el animal sacrificado y limpio, que pesa menos).",
 "The animal weighed alive. A live-weight price is not comparable with a carcass price (the slaughtered, dressed animal, which weighs less).",
 "L’animal pesé vivant. Un prix au poids vif n’est pas comparable à un prix à la carcasse (l’animal abattu et préparé, plus léger).",
 "L’animale pesato vivo. Un prezzo a peso vivo non è confrontabile con uno a carcassa (l’animale macellato e preparato, più leggero).")
add("canal","pre",["canal"],["carcass weight","carcass"],["carcasse"],["carcassa"],
 "El animal sacrificado, sin piel, vísceras ni cabeza. Los precios «a canal» de la UE no se pueden comparar con los de peso vivo de EE. UU.",
 "The slaughtered animal without skin, offal or head. EU “carcass” prices cannot be compared with US live-weight prices.",
 "L’animal abattu, sans peau, abats ni tête. Les prix « carcasse » de l’UE ne sont pas comparables aux prix au poids vif américains.",
 "L’animale macellato, senza pelle, interiora né testa. I prezzi «a carcassa» dell’UE non sono confrontabili con quelli a peso vivo USA.")
add("ttf","pre",["TTF"],["TTF"],["TTF"],["TTF"],
 "Title Transfer Facility: el precio de referencia del gas natural en Europa. Influye en el coste de los fertilizantes nitrogenados.",
 "Title Transfer Facility: Europe’s benchmark natural gas price. It drives the cost of nitrogen fertiliser.",
 "Title Transfer Facility : le prix de référence du gaz naturel en Europe. Il pèse sur le coût des engrais azotés.",
 "Title Transfer Facility: il prezzo di riferimento del gas naturale in Europa. Incide sul costo dei fertilizzanti azotati.")
add("wti","pre",["WTI"],["WTI"],["WTI"],["WTI"],
 "West Texas Intermediate: el petróleo de referencia de EE. UU.; su precio marca el del gasóleo y los costes de energía de la explotación.",
 "West Texas Intermediate: the US benchmark crude oil; its price sets the cost of diesel and farm energy.",
 "West Texas Intermediate : le pétrole de référence américain ; son prix influence le gazole et les coûts d’énergie de l’exploitation.",
 "West Texas Intermediate: il petrolio di riferimento USA; il suo prezzo incide su gasolio e costi energetici dell’azienda.")
add("cwrs","pre",["CWRS"],["CWRS"],["CWRS"],["CWRS"],
 "Canada Western Red Spring: trigo de primavera de Canadá con mucha proteína, usado como referencia del trigo panificable canadiense.",
 "Canada Western Red Spring: high-protein Canadian spring wheat, used as the benchmark for Canadian bread wheat.",
 "Canada Western Red Spring : blé de printemps canadien riche en protéines, référence du blé panifiable canadien.",
 "Canada Western Red Spring: grano primaverile canadese ad alto contenuto proteico, riferimento per il grano panificabile canadese.")
# ---- unidades y conceptos
add("campana","con",["campaña de comercialización","campaña"],["marketing year"],["campagne de commercialisation","campagne"],["campagna di commercializzazione","campagna"],
 "Periodo de 12 meses con el que cada cultivo cuenta su cosecha y su comercio (p. ej. el trigo de la UE va del 1 de julio al 30 de junio). Por eso se escribe 2026/27.",
 "The 12-month period each crop uses to count its harvest and trade (e.g. EU wheat runs 1 July to 30 June). Hence the 2026/27 notation.",
 "Période de 12 mois utilisée par chaque culture pour compter sa récolte et son commerce (p. ex. le blé de l’UE va du 1er juillet au 30 juin). D’où la notation 2026/27.",
 "Periodo di 12 mesi con cui ogni coltura conta raccolto e commercio (es. il grano UE va dal 1° luglio al 30 giugno). Da qui la notazione 2026/27.")
add("existencias","con",["existencias finales"],["ending stocks"],["stocks de clôture"],["scorte finali"],
 "Lo que queda almacenado al terminar la campaña. Cuando son bajas respecto al consumo, el mercado está más ajustado y los precios suelen ser más sensibles.",
 "What is left in storage at the end of the marketing year. When low relative to use, the market is tighter and prices tend to be more sensitive.",
 "Ce qui reste en stock à la fin de la campagne. Quand il est faible par rapport à la consommation, le marché est plus tendu et les prix plus sensibles.",
 "Ciò che resta in magazzino a fine campagna. Se è poco rispetto ai consumi, il mercato è più teso e i prezzi più sensibili.")
add("mt","uni",["Mt","Mt."],["Mt"],["Mt"],["Mt"],
 "Millones de toneladas.","Million tonnes.","Millions de tonnes.","Milioni di tonnellate.")
add("bushel","uni",["bushel","bu/ac","bu/acre"],["bushel","bu/ac","bu/acre"],["boisseau","bu/ac"],["bushel","bu/ac"],
 "Medida de volumen de EE. UU. que se usa como peso: 1 bushel son 27,2 kg de trigo o soja y 25,4 kg de maíz.",
 "US volume measure used as a weight: 1 bushel is 27.2 kg of wheat or soybeans and 25.4 kg of corn.",
 "Mesure de volume américaine utilisée comme poids : 1 bushel = 27,2 kg de blé ou de soja et 25,4 kg de maïs.",
 "Misura di volume USA usata come peso: 1 bushel equivale a 27,2 kg di grano o soia e 25,4 kg di mais.")
add("acre","uni",["acre","acres"],["acre","acres"],["acre","acres"],["acro","acri"],
 "Medida de superficie de EE. UU.: 1 acre son 0,405 hectáreas. «bu/ac» son bushels por acre.",
 "US area measure: 1 acre is 0.405 hectares. “bu/ac” is bushels per acre.",
 "Mesure de surface américaine : 1 acre = 0,405 hectare. « bu/ac » = bushels par acre.",
 "Misura di superficie USA: 1 acro è 0,405 ettari. «bu/ac» sono bushel per acro.")
add("interanual","con",["interanual"],["year-on-year","year over year"],["sur un an","en glissement annuel"],["su base annua","tendenziale"],
 "Compara un dato con el mismo periodo del año anterior (p. ej. octubre de este año frente a octubre del pasado), para no confundirlo con la estacionalidad.",
 "Compares a value with the same period a year earlier (e.g. this October versus last October), to avoid mixing it up with seasonality.",
 "Compare une valeur avec la même période un an plus tôt (p. ex. cet octobre par rapport à octobre dernier), pour ne pas la confondre avec la saisonnalité.",
 "Confronta un dato con lo stesso periodo dell’anno prima (es. questo ottobre rispetto a quello scorso), per non confonderlo con la stagionalità.")
# ---- términos del propio sitio
add("conjunto","dehesa",["conjunto de datos","conjuntos de datos"],["dataset","datasets"],["jeu de données","jeux de données"],["dataset","insieme di dati"],
 "Un fichero de datos de una fuente (por ejemplo «precios semanales de la leche en EE. UU.»). Puede contener muchas series.",
 "A data file from one source (for example “weekly US milk prices”). It can hold many series.",
 "Un fichier de données d’une source (par exemple « prix hebdomadaires du lait aux États-Unis »). Il peut contenir beaucoup de séries.",
 "Un file di dati di una fonte (per esempio «prezzi settimanali del latte negli Stati Uniti»). Può contenere molte serie.")
add("serie","dehesa",["serie","series"],["series"],["série","séries"],["serie"],
 "Una cifra seguida en el tiempo, por ejemplo «trigo en Francia, mensual». Cada punto es un periodo: una semana, un mes o un año.",
 "One figure followed over time, for example “wheat in France, monthly”. Each point is a period: a week, a month or a year.",
 "Un chiffre suivi dans le temps, par exemple « blé en France, mensuel ». Chaque point est une période : une semaine, un mois ou une année.",
 "Una cifra seguita nel tempo, per esempio «grano in Francia, mensile». Ogni punto è un periodo: una settimana, un mese o un anno.")
add("cambio-hist","dehesa",["cambios históricos"],["historical changes"],["changements d’historique"],["cambi nello storico"],
 "Valores de periodos ya publicados que ahora aparecen distintos en el fichero. Pueden ser correcciones de la fuente, una base de cálculo nueva o un reajuste; Dehesa no los da por revisiones oficiales.",
 "Values of periods already published that now show differently in the file. They may be source corrections, a new calculation base or a rebuild; Dehesa does not treat them as official revisions.",
 "Valeurs de périodes déjà publiées qui apparaissent maintenant différentes dans le fichier. Corrections de la source, nouvelle base de calcul ou reconstruction ; Dehesa ne les considère pas comme des révisions officielles.",
 "Valori di periodi già pubblicati che ora risultano diversi nel file. Possono essere correzioni della fonte, una nuova base di calcolo o una ricostruzione; Dehesa non le considera revisioni ufficiali.")
add("dato-oficial","dehesa",["DATO OFICIAL","Dato oficial"],["OFFICIAL DATA","Official data"],["DONNÉE OFFICIELLE","Donnée officielle"],["DATO UFFICIALE","Dato ufficiale"],
 "Verificado en su fuente oficial, con fecha de observación y de publicación. Es la etiqueta de más confianza.",
 "Verified at its official source, with observation and publication dates. It is the highest-confidence label.",
 "Vérifié à sa source officielle, avec date d’observation et de publication. C’est l’étiquette de plus grande confiance.",
 "Verificato alla fonte ufficiale, con data di osservazione e di pubblicazione. È l’etichetta di maggiore affidabilità.")
add("no-comparable","dehesa",["NO COMPARABLE","No comparable"],["NOT COMPARABLE","Not comparable"],["NON COMPARABLE","Non comparable"],["NON CONFRONTABILE","Non confrontabile"],
 "El dato es real, pero su definición no equivale a la de otro mercado (por ejemplo peso vivo frente a canal). Se muestra, pero no entra en comparaciones directas.",
 "The figure is real, but its definition differs from another market’s (for example live weight versus carcass). It is shown but not used in direct comparisons.",
 "La donnée est réelle, mais sa définition diffère de celle d’un autre marché (par exemple poids vif contre carcasse). Elle est affichée mais exclue des comparaisons directes.",
 "Il dato è reale, ma la sua definizione non equivale a quella di un altro mercato (per esempio peso vivo contro carcassa). Viene mostrato ma non entra nei confronti diretti.")
add("pendiente","dehesa",["PENDIENTE","Pendiente"],["PENDING","Pending"],["EN ATTENTE","En attente"],["IN SOSPESO","In sospeso"],
 "Todavía no hay una fuente verificable y con licencia adecuada. La tarjeta no muestra cifra hasta que la haya.",
 "There is not yet a verifiable, properly licensed source. The card shows no figure until there is one.",
 "Il n’existe pas encore de source vérifiable et correctement licenciée. La carte n’affiche aucun chiffre tant qu’il n’y en a pas.",
 "Non esiste ancora una fonte verificabile e con licenza adeguata. La scheda non mostra cifre finché non ce n’è una.")
