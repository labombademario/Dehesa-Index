#!/usr/bin/env python3
"""data/relationships.json — Cross-Market Intelligence 2.0: relaciones OBSERVADAS entre insumos y mercados (INSUMO -> CANAL -> MERCADO).
Cada relacion publica por separado la ASOCIACION ESTADISTICA (direccion, correlacion de cambios, rezago, n, periodo, cobertura, estabilidad de signo, confianza, ultimo movimiento de
entrada y de mercado) y la HIPOTESIS ECONOMICA (canal y texto). La primera describe los datos; la segunda es una explicacion plausible que esos datos NO prueban. No hay prediccion.
Catalogo: solo relaciones economicamente justificables (las de data/product-metadata.json 'related' y las familias de indices Eurostat/DEFRA); no se prueban pares al azar.
Series: data/prices/history/<region>/<producto>.json (+ tipos BCE de data/fx-history.json si las monedas difieren). Motor: scripts/relationships_engine.py."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
sys.path.insert(0, str(ROOT / 'scripts'))
import relationships_engine as RE
import freshness as FR

NOW = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
L4 = lambda es, en, fr, it: {'es': es, 'en': en, 'fr': fr, 'it': it}
META = json.loads((D / 'product-metadata.json').read_text())['products']
FX = RE.fx_table(json.loads((D / 'fx-history.json').read_text()))
LATEST = {}
for r in ('eu', 'us', 'ca', 'uk'):
    for o in json.loads((D / 'prices' / 'latest' / (r + '.json')).read_text())['observations']: LATEST[r + '/' + o['product']] = o

NAMES = {'defra_oilseed_rape_output_index': L4('Colza · índice de producción', 'Oilseed rape · output index', 'Colza · indice de production', 'Colza · indice di produzione'), 'cebada': META['cebada']['name'], 'colza': META['colza']['name'], 'avena': META['avena']['name'], 'urea': META['urea']['name'], 'diesel': META['diesel']['name'], 'trigo': META['trigo']['name'], 'maiz': META['maiz']['name'], 'leche': META['leche']['name'], 'vaca': META['vacuno']['name'],
         'petroleo_brent': L4('Petróleo Brent', 'Brent crude oil', 'Pétrole Brent', 'Petrolio Brent'), 'petroleo_wti': L4('Petróleo WTI', 'WTI crude oil', 'Pétrole WTI', 'Petrolio WTI'),
         'dap': L4('Fosfato diamónico (DAP)', 'Diammonium phosphate (DAP)', 'Phosphate diammonique (DAP)', 'Fosfato biammonico (DAP)'), 'potasa': L4('Potasa', 'Potash', 'Potasse', 'Potassa'),
         'cerdo': META['cerdo']['name'], 'pollo': META['pollo']['name'], 'huevos': META['huevos']['name'], 'sorgo': L4('Sorgo', 'Sorghum', 'Sorgho', 'Sorgo'),
         'mantequilla': L4('Mantequilla', 'Butter', 'Beurre', 'Burro'), 'leche_polvo': L4('Leche desnatada en polvo', 'Skimmed milk powder', 'Lait écrémé en poudre', 'Latte scremato in polvere'),
         'cordero': L4('Cordero', 'Lamb', 'Agneau', 'Agnello'),
         'harina_soja': L4('Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia'), 'gas_natural': L4('Gas natural', 'Natural gas', 'Gaz naturel', 'Gas naturale'),
         'eurostat_energy_input_index': L4('Energía · índice de compra', 'Energy · purchase index', 'Énergie · indice d’achat', 'Energia · indice di acquisto'),
         'eurostat_fertiliser_input_index': L4('Fertilizantes · índice de compra', 'Fertiliser · purchase index', 'Engrais · indice d’achat', 'Fertilizzanti · indice di acquisto'),
         'eurostat_cereals_output_index': L4('Cereales · índice de producción', 'Cereals · output index', 'Céréales · indice de production', 'Cereali · indice di produzione'),
         'defra_energy_input_index': L4('Energía · índice de compra', 'Energy · purchase index', 'Énergie · indice d’achat', 'Energia · indice di acquisto'),
         'defra_fertiliser_input_index': L4('Fertilizantes · índice de compra', 'Fertiliser · purchase index', 'Engrais · indice d’achat', 'Fertilizzanti · indice di acquisto'),
         'defra_feed_input_index': L4('Alimentación · índice de costes', 'Feed · cost index', 'Alimentation · indice de coûts', 'Mangimi · indice dei costi'),
         'defra_wheat_output_index': L4('Trigo · índice de producción', 'Wheat · output index', 'Blé · indice de production', 'Frumento · indice di produzione'),
         'defra_barley_output_index': L4('Cebada · índice de producción', 'Barley · output index', 'Orge · indice de production', 'Orzo · indice di produzione'),
         'defra_milk_output_index': L4('Leche · índice de producción', 'Milk · output index', 'Lait · indice de production', 'Latte · indice di produzione'),
         'defra_cattle_output_index': L4('Vacuno · índice de producción', 'Cattle · output index', 'Bovins · indice de production', 'Bovini · indice di produzione'),
         'defra_pigs_output_index': L4('Cerdo · índice de producción', 'Pigs · output index', 'Porcins · indice de production', 'Suini · indice di produzione')}
REGN = {'eu': L4('UE', 'EU', 'UE', 'UE'), 'us': L4('EE. UU.', 'US', 'É.-U.', 'USA'), 'ca': L4('Canadá', 'Canada', 'Canada', 'Canada'), 'uk': L4('Reino Unido', 'UK', 'R.-U.', 'Regno Unito')}

LOCN = {'uk-lincolnshire': L4('Lincolnshire', 'Lincolnshire', 'Lincolnshire', 'Lincolnshire'), 'uk-east-anglia': L4('East Anglia', 'East Anglia', 'East Anglia', 'East Anglia'), 'us-iowa': L4('Iowa', 'Iowa', 'Iowa', 'Iowa'),
        'us-illinois': L4('Illinois', 'Illinois', 'Illinois', 'Illinois'), 'us-kansas': L4('Kansas', 'Kansas', 'Kansas', 'Kansas'), 'eu-beauce': L4('Beauce (Francia)', 'Beauce (France)', 'Beauce (France)', 'Beauce (Francia)'),
        'eu-castilla-leon': L4('Castilla y León', 'Castilla y León', 'Castille-et-León', 'Castiglia e León'), 'eu-saxony-anhalt': L4('Sajonia-Anhalt', 'Saxony-Anhalt', 'Saxe-Anhalt', 'Sassonia-Anhalt'),
        'ca-saskatchewan-south': L4('sur de Saskatchewan', 'southern Saskatchewan', 'sud de la Saskatchewan', 'Saskatchewan meridionale')}
KIND = {'precip': (L4('Precipitación · anomalía', 'Precipitation · anomaly', 'Précipitations · anomalie', 'Precipitazioni · anomalia'), '% vs 2001-2020'),
        'temp': (L4('Temperatura · anomalía', 'Temperature · anomaly', 'Température · anomalie', 'Temperatura · anomalia'), '°C vs 2001-2020')}
STOCKN = {'ca-gb-canola-ending-stocks': L4('Existencias finales de colza (campaña ago-jul)', 'Canola ending stocks (Aug–Jul crop year)', 'Stocks finaux de colza (campagne août-juil.)', 'Scorte finali di colza (campagna ago-lug)'),
          'ca-gb-barley-ending-stocks': L4('Existencias finales de cebada (campaña ago-jul)', 'Barley ending stocks (Aug–Jul crop year)', 'Stocks finaux d’orge (campagne août-juil.)', 'Scorte finali di orzo (campagna ago-lug)'),
          'ca-gb-oats-ending-stocks': L4('Existencias finales de avena (campaña ago-jul)', 'Oats ending stocks (Aug–Jul crop year)', 'Stocks finaux d’avoine (campagne août-juil.)', 'Scorte finali di avena (campagna ago-lug)')}
CLIM = json.loads((D / 'climate-history.json').read_text())
STOCKS = {x['id']: x for f in sorted((D / 'series' / 'CA').glob('stocks*.json')) for x in json.loads(f.read_text())['series']}   # el grupo puede venir en varios trozos (stocks.json, stocks-2.json…)

CH = {'fertilizer': L4('coste del fertilizante', 'fertiliser cost', 'coût des engrais', 'costo dei fertilizzanti'), 'energy': L4('coste de la energía', 'energy cost', 'coût de l’énergie', 'costo dell’energia'),
      'feed': L4('coste del pienso', 'feed cost', 'coût de l’alimentation animale', 'costo dei mangimi'), 'weather': L4('clima del mes', 'monthly weather', 'météo du mois', 'meteo del mese'), 'stocks': L4('existencias finales de la campaña', 'end-of-crop-year stocks', 'stocks de fin de campagne', 'scorte di fine campagna'),
      'crude': L4('precio del crudo', 'crude oil price', 'prix du pétrole brut', 'prezzo del greggio'), 'substitute': L4('sustitución entre productos parecidos', 'substitution between similar products', 'substitution entre produits proches', 'sostituzione tra prodotti simili'),
      'trade': L4('comercio mundial entre mercados', 'world trade between markets', 'commerce mondial entre marchés', 'commercio mondiale tra mercati'), 'processing': L4('transformación (lácteos industriales)', 'processing (dairy commodities)', 'transformation (produits laitiers industriels)', 'trasformazione (prodotti lattiero-caseari industriali)'),
      'biofuel': L4('biocombustibles', 'biofuels', 'biocarburants', 'biocarburanti'),
      'feedstock': L4('materia prima de la fabricación de fertilizantes', 'feedstock for fertiliser manufacturing', 'matière première de la fabrication d’engrais', 'materia prima per la produzione di fertilizzanti')}
# familia -> canal, hipotesis (4 idiomas), rezagos probados (en periodos de la frecuencia de la serie) y pares (entrada, mercado)
FAMILIES = {
 'fertiliser_to_grain': {'channel': 'fertilizer', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 4, 6, 9, 12],
   'hypothesis': L4('Un fertilizante más caro encarece producir cereal y puede reducir su uso o la superficie sembrada; a su vez, un cereal caro puede sostener la demanda de fertilizante. Otros factores (clima, existencias, demanda global) mueven ambos precios.',
                    'A dearer fertiliser raises the cost of growing grain and may reduce its use or planted area; in turn, dear grain can sustain fertiliser demand. Other factors (weather, stocks, global demand) move both prices.',
                    'Un engrais plus cher renchérit la production de céréales et peut réduire son usage ou les surfaces semées ; à l’inverse, des céréales chères peuvent soutenir la demande d’engrais. D’autres facteurs (météo, stocks, demande mondiale) font bouger les deux prix.',
                    'Un fertilizzante più caro aumenta il costo di produrre cereali e può ridurne l’uso o la superficie seminata; a sua volta, cereali cari possono sostenere la domanda di fertilizzante. Altri fattori (clima, scorte, domanda globale) muovono entrambi i prezzi.'),
   'pairs': [(('eu', 'urea'), (r, p)) for p in ('trigo', 'maiz') for r in ('eu', 'us', 'ca')]},
 'gas_to_fertiliser': {'channel': 'feedstock', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 6],
   'hypothesis': L4('El gas natural es la principal materia prima y fuente de energía de la urea y otros fertilizantes nitrogenados, por lo que su coste se traslada al precio del fertilizante con mayor o menor retraso.',
                    'Natural gas is the main feedstock and energy source for urea and other nitrogen fertilisers, so its cost passes through to fertiliser prices with some delay.',
                    'Le gaz naturel est la principale matière première et source d’énergie de l’urée et des autres engrais azotés ; son coût se répercute donc sur le prix de l’engrais avec un délai.',
                    'Il gas naturale è la principale materia prima e fonte di energia dell’urea e degli altri fertilizzanti azotati, quindi il suo costo si trasferisce al prezzo del fertilizzante con un certo ritardo.'),
   'pairs': [(('eu', 'gas_natural'), ('eu', 'urea'))]},
 'energy_to_grain': {'channel': 'energy', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 6],
   'hypothesis': L4('El gasóleo es un coste directo de laboreo, secado y transporte del cereal; un gasóleo caro encarece producirlo, pero el cereal depende sobre todo de oferta y demanda global.',
                    'Diesel is a direct cost of tillage, drying and hauling grain; dear diesel raises production costs, but grain prices depend mostly on global supply and demand.',
                    'Le gazole est un coût direct du travail du sol, du séchage et du transport des céréales ; un gazole cher renchérit la production, mais le prix des céréales dépend surtout de l’offre et de la demande mondiales.',
                    'Il gasolio è un costo diretto di lavorazione, essiccazione e trasporto dei cereali; un gasolio caro aumenta i costi, ma il prezzo dei cereali dipende soprattutto da offerta e domanda globali.'),
   'pairs': [(('eu', 'diesel'), ('eu', 'trigo')), (('eu', 'diesel'), ('eu', 'maiz')), (('us', 'diesel'), ('us', 'trigo')), (('us', 'diesel'), ('us', 'maiz'))]},
 'feed_to_milk': {'channel': 'feed', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 4, 6],
   'hypothesis': L4('El pienso es el mayor coste variable de la leche: un pienso caro presiona los márgenes y, con el tiempo, puede reducir la oferta; el precio de la leche depende además de lácteos, demanda y política.',
                    'Feed is the largest variable cost of milk: dear feed squeezes margins and, over time, may reduce supply; milk prices also depend on dairy markets, demand and policy.',
                    'L’alimentation animale est le premier coût variable du lait : un aliment cher comprime les marges et, avec le temps, peut réduire l’offre ; le prix du lait dépend aussi des marchés laitiers, de la demande et des politiques.',
                    'Il mangime è il principale costo variabile del latte: un mangime caro comprime i margini e, col tempo, può ridurre l’offerta; il prezzo del latte dipende anche da mercati lattiero-caseari, domanda e politiche.'),
   'pairs': [(('eu', 'maiz'), ('eu', 'leche')), (('us', 'maiz'), ('us', 'leche')), (('ca', 'maiz'), ('ca', 'leche')), (('eu', 'harina_soja'), ('eu', 'leche')), (('us', 'harina_soja'), ('us', 'leche')), (('uk', 'defra_feed_input_index'), ('uk', 'leche'))]},
 'feed_to_beef': {'channel': 'feed', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 6, 9, 12],
   'hypothesis': L4('El pienso pesa mucho en el coste de cebo; un pienso caro puede reducir el número de animales cebados y, tras el ciclo de producción, la oferta de carne. El ciclo ganadero es largo y tiene muchos otros factores.',
                    'Feed weighs heavily in finishing costs; dear feed may reduce the number of animals fed and, after the production cycle, beef supply. The cattle cycle is long and has many other drivers.',
                    'L’alimentation pèse lourd dans le coût d’engraissement ; un aliment cher peut réduire le nombre d’animaux engraissés et, après le cycle de production, l’offre de viande. Le cycle bovin est long et dépend de nombreux autres facteurs.',
                    'Il mangime pesa molto sul costo dell’ingrasso; un mangime caro può ridurre il numero di capi ingrassati e, dopo il ciclo produttivo, l’offerta di carne. Il ciclo bovino è lungo e dipende da molti altri fattori.'),
   'pairs': [(('eu', 'maiz'), ('eu', 'vaca')), (('us', 'maiz'), ('us', 'vaca')), (('ca', 'maiz'), ('ca', 'vaca')), (('eu', 'harina_soja'), ('eu', 'vaca'))]},
 'energy_to_livestock': {'channel': 'energy', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 6],
   'hypothesis': L4('El gasóleo es coste directo de las explotaciones (forraje, ordeño, transporte); su efecto en el precio de la leche o de la carne es indirecto y pequeño frente a otros factores.',
                    'Diesel is a direct farm cost (forage, milking, transport); its effect on milk or beef prices is indirect and small compared with other factors.',
                    'Le gazole est un coût direct des exploitations (fourrage, traite, transport) ; son effet sur le prix du lait ou de la viande est indirect et faible face aux autres facteurs.',
                    'Il gasolio è un costo diretto delle aziende (foraggio, mungitura, trasporto); il suo effetto sul prezzo di latte o carne è indiretto e piccolo rispetto ad altri fattori.'),
   'pairs': [(('eu', 'diesel'), ('eu', 'leche')), (('us', 'diesel'), ('us', 'leche')), (('eu', 'diesel'), ('eu', 'vaca')), (('us', 'diesel'), ('us', 'vaca'))]},
 'weather_to_market': {'channel': 'weather', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 4, 6], 'xmode': 'level',
   'hypothesis': L4('Un mes más seco o más cálido que la media de 2001-2020 puede afectar al desarrollo del cultivo y a las expectativas de cosecha, y con ello al precio; pero el precio también depende de la oferta y la demanda mundiales, las existencias y la política, y el clima de una sola comarca no explica un mercado entero.',
                    'A month drier or warmer than the 2001-2020 average can affect crop development and harvest expectations, and through them prices; but prices also depend on world supply and demand, stocks and policy, and the weather of a single region does not explain a whole market.',
                    'Un mois plus sec ou plus chaud que la moyenne 2001-2020 peut affecter le développement de la culture et les attentes de récolte, donc les prix ; mais les prix dépendent aussi de l’offre et de la demande mondiales, des stocks et des politiques, et la météo d’une seule région n’explique pas tout un marché.',
                    'Un mese più secco o più caldo della media 2001-2020 può influire sullo sviluppo della coltura e sulle attese di raccolto, e quindi sul prezzo; ma il prezzo dipende anche da offerta e domanda mondiali, scorte e politica, e il meteo di una sola zona non spiega un intero mercato.'),
   'pairs': [(('uk', 'clim:uk-lincolnshire:precip'), ('uk', 'defra_wheat_output_index')), (('uk', 'clim:uk-lincolnshire:temp'), ('uk', 'defra_wheat_output_index')), (('uk', 'clim:uk-east-anglia:precip'), ('uk', 'defra_wheat_output_index')),
             (('uk', 'clim:uk-east-anglia:temp'), ('uk', 'defra_barley_output_index')), (('uk', 'clim:uk-east-anglia:precip'), ('uk', 'defra_oilseed_rape_output_index')), (('uk', 'clim:uk-lincolnshire:precip'), ('uk', 'defra_barley_output_index')),
             (('us', 'clim:us-iowa:precip'), ('us', 'maiz')), (('us', 'clim:us-iowa:temp'), ('us', 'maiz')), (('us', 'clim:us-illinois:precip'), ('us', 'maiz')), (('us', 'clim:us-kansas:precip'), ('us', 'trigo')), (('us', 'clim:us-kansas:temp'), ('us', 'trigo')),
             (('eu', 'clim:eu-beauce:precip'), ('eu', 'trigo')), (('eu', 'clim:eu-beauce:temp'), ('eu', 'trigo')), (('eu', 'clim:eu-saxony-anhalt:precip'), ('eu', 'trigo')), (('eu', 'clim:eu-castilla-leon:precip'), ('eu', 'cebada')),
             (('ca', 'clim:ca-saskatchewan-south:precip'), ('ca', 'colza')), (('ca', 'clim:ca-saskatchewan-south:temp'), ('ca', 'colza')), (('ca', 'clim:ca-saskatchewan-south:precip'), ('ca', 'trigo'))]},
 'stocks_to_price': {'channel': 'stocks', 'freq': 'annual', 'lags': [0, 1],
   'hypothesis': L4('Unas existencias finales altas suelen indicar oferta holgada y presionar el precio; unas existencias bajas, lo contrario. La relación puede ir también en sentido inverso (unos precios bajos frenan las ventas y acumulan existencias), y se mide sobre la misma campaña o la siguiente. Además el precio también refleja la demanda, el tipo de cambio, los mercados vecinos y la calidad de cada cosecha, y los balances recientes son estimaciones que se revisan.',
                    'High ending stocks usually signal ample supply and weigh on the price; low stocks, the opposite. The link can also run the other way (low prices slow sales and build stocks), and it is measured within the same crop year or the next. Also, prices also reflect demand, exchange rates, neighbouring markets and the quality of each crop, and recent balances are estimates that get revised.',
                    'Des stocks finaux élevés signalent généralement une offre abondante et pèsent sur le prix ; des stocks bas, l’inverse. Le lien peut aussi jouer en sens inverse (des prix bas freinent les ventes et accumulent des stocks) et se mesure sur la même campagne ou la suivante. De plus, le prix reflète aussi la demande, le change, les marchés voisins et la qualité de chaque récolte, et les bilans récents sont des estimations révisées.',
                    'Scorte finali elevate indicano di solito un’offerta abbondante e pesano sul prezzo; scorte basse, il contrario. Il legame può anche andare in senso inverso (prezzi bassi frenano le vendite e accumulano scorte) e si misura nella stessa campagna o nella successiva. Inoltre, il prezzo riflette anche domanda, cambio, mercati vicini e qualità di ogni raccolto, e i bilanci recenti sono stime che vengono riviste.'),
   'pairs': [(('ca', 'stock:ca-gb-canola-ending-stocks'), ('ca', 'colza')), (('ca', 'stock:ca-gb-barley-ending-stocks'), ('ca', 'cebada')), (('ca', 'stock:ca-gb-oats-ending-stocks'), ('ca', 'avena'))]},
 'oil_to_energy': {'channel': 'crude', 'freq': 'monthly', 'lags': [0, 1, 2, 3],
   'hypothesis': L4('El gasóleo se refina del crudo, así que su precio sigue al petróleo casi sin retraso; el gas natural se negocia en su propio mercado y en Europa, desde 2021, ha ido por libre.',
                    'Diesel is refined from crude, so its price tracks oil almost without delay; natural gas trades in its own market and in Europe, since 2021, has moved on its own.',
                    'Le gazole est raffiné à partir du brut : son prix suit le pétrole presque sans délai ; le gaz naturel a son propre marché et, en Europe depuis 2021, évolue à part.',
                    'Il gasolio si raffina dal greggio, quindi il suo prezzo segue il petrolio quasi senza ritardo; il gas naturale ha un mercato proprio e in Europa, dal 2021, è andato per conto suo.'),
   'pairs': [(('eu', 'petroleo_brent'), ('eu', 'diesel')), (('us', 'petroleo_wti'), ('us', 'diesel')), (('eu', 'petroleo_brent'), ('eu', 'gas_natural')), (('us', 'petroleo_wti'), ('us', 'gas_natural'))]},
 'crude_to_grain': {'channel': 'crude', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 6],
   'hypothesis': L4('El petróleo encarece el gasóleo, el transporte y, vía gas y energía, los fertilizantes; además tira de la demanda de grano para biocombustibles y suele moverse con el resto de materias primas cuando cambia el ciclo económico o hay un choque de energía. El efecto es indirecto y mezcla causas distintas: la relación es mucho más clara en los años de choque energético (2021-2022) que en los tranquilos, y un nivel de precios que sube junto no implica que los cambios de cada mes vayan juntos.',
                    'Oil raises the cost of diesel, transport and, through gas and energy, fertiliser; it also pulls on grain demand for biofuels and tends to move with other commodities when the economic cycle turns or there is an energy shock. The effect is indirect and mixes different causes: the link is much clearer in energy-shock years (2021-2022) than in calm ones, and price levels that rise together do not mean that each month’s changes move together.',
                    'Le pétrole renchérit le gazole, le transport et, via le gaz et l’énergie, les engrais ; il tire aussi la demande de grains pour les biocarburants et évolue souvent avec les autres matières premières quand le cycle économique tourne ou lors d’un choc énergétique. L’effet est indirect et mêle des causes différentes : le lien est bien plus net les années de choc énergétique (2021-2022) que les années calmes, et des niveaux de prix qui montent ensemble ne signifient pas que les variations de chaque mois vont de pair.',
                    'Il petrolio aumenta il costo di gasolio, trasporto e, tramite gas ed energia, fertilizzanti; inoltre spinge la domanda di cereali per i biocarburanti e tende a muoversi con le altre materie prime quando cambia il ciclo economico o c’è uno shock energetico. L’effetto è indiretto e mescola cause diverse: il legame è molto più netto negli anni di shock energetico (2021-2022) che in quelli tranquilli, e livelli di prezzo che salgono insieme non significano che le variazioni di ogni mese vadano insieme.'),
   'pairs': [(('eu', 'petroleo_brent'), ('eu', 'trigo')), (('eu', 'petroleo_brent'), ('eu', 'cebada')), (('us', 'petroleo_wti'), ('us', 'trigo'))]},
 'fertiliser_complex': {'channel': 'feedstock', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 4, 6],
   'hypothesis': L4('El DAP lleva amoniaco (hecho con gas) además de fósforo, por eso se mueve en parte con la urea y el gas; la potasa es un mineral de mina con otra oferta, y su relación con el gas es más indirecta (costes de energía y demanda común de abonos).',
                    'DAP contains ammonia (made from gas) as well as phosphorus, so it partly moves with urea and gas; potash is a mined mineral with a different supply, and its link to gas is more indirect (energy costs and shared fertiliser demand).',
                    'Le DAP contient de l’ammoniac (fabriqué à partir de gaz) en plus du phosphore : il évolue donc en partie avec l’urée et le gaz ; la potasse est un minerai extrait, à l’offre différente, et son lien avec le gaz est plus indirect (coûts de l’énergie et demande commune d’engrais).',
                    'Il DAP contiene ammoniaca (prodotta dal gas) oltre al fosforo, quindi si muove in parte con urea e gas; la potassa è un minerale di miniera con un’offerta diversa e il legame col gas è più indiretto (costi energetici e domanda comune di fertilizzanti).'),
   'pairs': [(('eu', 'urea'), ('eu', 'dap')), (('eu', 'gas_natural'), ('eu', 'dap')), (('eu', 'gas_natural'), ('eu', 'potasa')), (('eu', 'urea'), ('eu', 'potasa'))]},
 'feed_to_monogastric': {'channel': 'feed', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 4, 6],
   'hypothesis': L4('El pienso (cereal y soja) es el mayor coste del cerdo, el pollo y el huevo; un pienso caro aprieta márgenes y, con el tiempo, puede recortar la producción y sostener el precio. A corto plazo mandan otros factores: demanda, exportaciones, enfermedades y el ciclo de cada especie.',
                    'Feed (grain and soy) is the largest cost of pork, chicken and eggs; dear feed squeezes margins and, over time, can cut output and support prices. In the short run other factors dominate: demand, exports, disease and each species’ cycle.',
                    'L’aliment (céréales et soja) est le premier coût du porc, du poulet et des œufs ; un aliment cher comprime les marges et, avec le temps, peut réduire la production et soutenir les prix. À court terme, d’autres facteurs dominent : demande, exportations, maladies et cycle de chaque espèce.',
                    'Il mangime (cereali e soia) è il primo costo di suini, polli e uova; un mangime caro comprime i margini e, col tempo, può ridurre la produzione e sostenere i prezzi. Nel breve periodo contano altri fattori: domanda, export, malattie e ciclo di ogni specie.'),
   'pairs': [((r, f), (r, m)) for r, fs in (('eu', ('maiz', 'harina_soja', 'cebada')), ('us', ('maiz',)), ('ca', ('maiz', 'cebada'))) for f in fs for m in ('cerdo', 'pollo', 'huevos')]},
 'grain_substitution': {'channel': 'substitute', 'freq': 'monthly', 'lags': [0, 1, 2, 3],
   'hypothesis': L4('Trigo, maíz, cebada, avena y sorgo se sustituyen en parte en el pienso y compiten por la misma tierra, así que cuando uno se encarece los demás suelen acompañarle. El grado depende de cada mercado: en la UE van muy juntos; en EE. UU. la cebada y la avena tienen mercados más propios.',
                    'Wheat, maize, barley, oats and sorghum partly substitute for each other in feed and compete for the same land, so when one gets dearer the others tend to follow. How much depends on the market: in the EU they move closely together; in the US barley and oats have more separate markets.',
                    'Blé, maïs, orge, avoine et sorgho se substituent en partie dans l’alimentation animale et se disputent les mêmes terres : quand l’un renchérit, les autres suivent souvent. L’ampleur dépend du marché : dans l’UE ils vont très ensemble ; aux États-Unis l’orge et l’avoine ont des marchés plus distincts.',
                    'Frumento, mais, orzo, avena e sorgo si sostituiscono in parte nei mangimi e competono per la stessa terra, quindi quando uno rincara gli altri tendono a seguirlo. Quanto dipende dal mercato: nell’UE vanno molto insieme; negli USA orzo e avena hanno mercati più separati.'),
   'pairs': [(('eu', 'trigo'), ('eu', 'maiz')), (('eu', 'trigo'), ('eu', 'cebada')), (('eu', 'maiz'), ('eu', 'cebada')), (('us', 'trigo'), ('us', 'maiz')), (('us', 'maiz'), ('us', 'sorgo')), (('us', 'maiz'), ('us', 'avena')),
             (('us', 'trigo'), ('us', 'avena')), (('us', 'maiz'), ('us', 'cebada')), (('ca', 'trigo'), ('ca', 'maiz')), (('ca', 'trigo'), ('ca', 'cebada')), (('ca', 'trigo'), ('ca', 'avena')), (('ca', 'cebada'), ('ca', 'avena'))]},
 'world_transmission': {'channel': 'trade', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 4],
   'hypothesis': L4('Los grandes mercados exportadores están conectados por el comercio: un cambio de precio en EE. UU. (donde están los mercados de futuros de referencia) suele llegar a la UE y a Canadá, convertido a la misma moneda. Aranceles, transporte, calidad y políticas propias (cuotas lácteas en Canadá, por ejemplo) frenan esa transmisión.',
                    'The big exporting markets are linked by trade: a price change in the US (home of the benchmark futures markets) usually reaches the EU and Canada, once converted to the same currency. Tariffs, freight, quality and domestic policies (Canada’s dairy quotas, for instance) slow that transmission.',
                    'Les grands marchés exportateurs sont reliés par le commerce : une variation de prix aux États-Unis (siège des marchés à terme de référence) se transmet souvent à l’UE et au Canada, une fois convertie dans la même monnaie. Droits de douane, fret, qualité et politiques nationales (quotas laitiers au Canada, par exemple) freinent cette transmission.',
                    'I grandi mercati esportatori sono collegati dal commercio: una variazione di prezzo negli USA (sede dei mercati futures di riferimento) di solito arriva a UE e Canada, convertita nella stessa valuta. Dazi, noli, qualità e politiche interne (le quote del latte in Canada, per esempio) frenano questa trasmissione.'),
   'pairs': [(('us', p), (r, p)) for p in ('trigo', 'maiz', 'colza', 'cerdo', 'vaca', 'leche', 'pollo', 'cebada') for r in ('eu', 'ca')] + [(('eu', p), ('ca', p)) for p in ('trigo', 'maiz', 'colza', 'cerdo')]},
 'dairy_processing': {'channel': 'processing', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 4, 6],
   'hypothesis': L4('La mantequilla y la leche en polvo son los productos industriales donde se fija el valor de la leche; las industrias revisan lo que pagan al ganadero con unos meses de retraso, así que esos precios suelen ir por delante del precio de la leche en origen.',
                    'Butter and milk powder are the commodities where the value of milk is set; processors revise what they pay farmers a few months later, so those prices tend to lead the farm-gate milk price.',
                    'Le beurre et la poudre de lait sont les produits industriels où se fixe la valeur du lait ; les laiteries révisent le prix payé aux éleveurs avec quelques mois de retard, donc ces prix ont tendance à précéder le prix du lait à la ferme.',
                    'Burro e latte in polvere sono i prodotti industriali dove si fissa il valore del latte; le industrie rivedono quanto pagano agli allevatori con qualche mese di ritardo, quindi quei prezzi tendono ad anticipare il prezzo del latte alla stalla.'),
   'pairs': [(('eu', 'mantequilla'), ('eu', 'leche')), (('eu', 'leche_polvo'), ('eu', 'leche')), (('us', 'leche_polvo'), ('us', 'leche')), (('us', 'leche_polvo'), ('eu', 'leche_polvo'))]},
 'biofuel_link': {'channel': 'biofuel', 'freq': 'monthly', 'lags': [0, 1, 2, 3],
   'hypothesis': L4('Parte del maíz se convierte en etanol y parte de la colza en biodiésel, así que un petróleo caro puede tirar de su demanda. Es un vínculo parcial: la mayor parte del grano va a pienso y alimentación, y las cuotas obligatorias de mezcla amortiguan el efecto.',
                    'Part of the maize becomes ethanol and part of the rapeseed biodiesel, so dear oil can pull on their demand. It is a partial link: most grain goes to feed and food, and blending mandates dampen the effect.',
                    'Une partie du maïs devient de l’éthanol et une partie du colza du biodiesel : un pétrole cher peut donc tirer leur demande. C’est un lien partiel : l’essentiel des grains va à l’alimentation animale et humaine, et les obligations d’incorporation amortissent l’effet.',
                    'Parte del mais diventa etanolo e parte della colza biodiesel, quindi un petrolio caro può spingerne la domanda. È un legame parziale: la maggior parte dei cereali va a mangimi e alimentazione, e gli obblighi di miscelazione attenuano l’effetto.'),
   'pairs': [(('eu', 'petroleo_brent'), ('eu', 'colza')), (('eu', 'petroleo_brent'), ('eu', 'maiz')), (('us', 'petroleo_wti'), ('us', 'maiz')), (('us', 'petroleo_wti'), ('us', 'colza'))]},
 'meat_substitution': {'channel': 'substitute', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 4, 6],
   'hypothesis': L4('Las carnes compiten en el plato: si una se encarece, parte del consumo pasa a otra y su precio puede subir. Pero cada especie tiene su propio ciclo productivo y sus enfermedades, así que la relación suele ser débil.',
                    'Meats compete on the plate: if one gets dearer, some consumption shifts to another and its price may rise. But each species has its own production cycle and diseases, so the link is usually weak.',
                    'Les viandes se concurrencent dans l’assiette : si l’une renchérit, une partie de la consommation se reporte sur une autre et son prix peut monter. Mais chaque espèce a son propre cycle de production et ses maladies, donc le lien est souvent faible.',
                    'Le carni competono nel piatto: se una rincara, parte del consumo passa a un’altra e il suo prezzo può salire. Ma ogni specie ha il proprio ciclo produttivo e le proprie malattie, quindi il legame è di solito debole.'),
   'pairs': [(('eu', 'cerdo'), ('eu', 'pollo')), (('eu', 'vaca'), ('eu', 'cerdo')), (('eu', 'vaca'), ('eu', 'cordero')), (('us', 'cerdo'), ('us', 'pollo')), (('us', 'vaca'), ('us', 'cerdo'))]},
 'index_eu': {'channel': 'energy', 'freq': 'quarterly', 'lags': [0, 1, 2, 4],
   'hypothesis': L4('Los índices oficiales de precios de insumos (energía, fertilizantes) y de producción (cereales) de Eurostat recogen la misma cadena de costes y precios a escala de la UE; con pocos datos trimestrales la lectura es frágil.',
                    'Eurostat’s official input (energy, fertiliser) and output (cereals) price indices capture the same cost-and-price chain at EU level; with few quarterly observations the reading is fragile.',
                    'Les indices officiels d’Eurostat des prix des intrants (énergie, engrais) et de production (céréales) reflètent la même chaîne de coûts et de prix à l’échelle de l’UE ; avec peu de données trimestrielles, la lecture est fragile.',
                    'Gli indici ufficiali Eurostat dei prezzi degli input (energia, fertilizzanti) e della produzione (cereali) riflettono la stessa catena di costi e prezzi a livello UE; con pochi dati trimestrali la lettura è fragile.'),
   'pairs': [(('eu', 'eurostat_energy_input_index'), ('eu', 'eurostat_cereals_output_index')), (('eu', 'eurostat_fertiliser_input_index'), ('eu', 'eurostat_cereals_output_index')), (('eu', 'eurostat_energy_input_index'), ('eu', 'eurostat_fertiliser_input_index'))]},
 'index_uk': {'channel': 'feed', 'freq': 'monthly', 'lags': [0, 1, 2, 3, 6],
   'hypothesis': L4('Los índices de DEFRA de coste de insumos (fertilizantes, energía, alimentación) y de precios de producción agrícola del Reino Unido recogen la cadena de costes de las explotaciones británicas.',
                    'DEFRA’s UK input-cost (fertiliser, energy, feed) and agricultural output price indices capture the cost chain of British farms.',
                    'Les indices DEFRA de coûts des intrants (engrais, énergie, alimentation) et de prix de production agricole du Royaume-Uni reflètent la chaîne de coûts des exploitations britanniques.',
                    'Gli indici DEFRA dei costi degli input (fertilizzanti, energia, mangimi) e dei prezzi della produzione agricola del Regno Unito riflettono la catena dei costi delle aziende britanniche.'),
   'pairs': [(('uk', 'defra_fertiliser_input_index'), ('uk', 'defra_wheat_output_index')), (('uk', 'defra_fertiliser_input_index'), ('uk', 'defra_barley_output_index')), (('uk', 'defra_energy_input_index'), ('uk', 'defra_wheat_output_index')),
             (('uk', 'defra_feed_input_index'), ('uk', 'defra_milk_output_index')), (('uk', 'defra_feed_input_index'), ('uk', 'defra_cattle_output_index')), (('uk', 'defra_feed_input_index'), ('uk', 'defra_pigs_output_index')), (('uk', 'defra_energy_input_index'), ('uk', 'defra_milk_output_index'))]}}
# el canal de cada par puede diferir del de la familia (indices): se fija por producto de entrada
CHANNEL_OF = {'urea': 'fertilizer', 'gas_natural': 'feedstock', 'diesel': 'energy', 'maiz': 'feed', 'harina_soja': 'feed', 'eurostat_energy_input_index': 'energy', 'eurostat_fertiliser_input_index': 'fertilizer',
              'defra_fertiliser_input_index': 'fertilizer', 'defra_energy_input_index': 'energy', 'defra_feed_input_index': 'feed', 'weather': 'weather', 'stocks': 'stocks'}

UNITW = {'annual': L4('año', 'year', 'an', 'anno'), 'monthly': L4('mes', 'month', 'mois', 'mese'), 'quarterly': L4('trimestre', 'quarter', 'trimestre', 'trimestre')}
UNITP = {'annual': L4('años', 'years', 'ans', 'anni'), 'monthly': L4('meses', 'months', 'mois', 'mesi'), 'quarterly': L4('trimestres', 'quarters', 'trimestres', 'trimestri')}
STR = {'negligible': L4('insignificante', 'negligible', 'négligeable', 'trascurabile'), 'weak': L4('débil', 'weak', 'faible', 'debole'), 'moderate': L4('moderada', 'moderate', 'modérée', 'moderata'), 'strong': L4('fuerte', 'strong', 'forte', 'forte')}
STATUS_TXT = {'OBSERVED_RELATIONSHIP': L4('Relación observada.', 'Observed relationship.', 'Relation observée.', 'Relazione osservata.'),
              'WEAK_OR_UNSTABLE': L4('Asociación débil o inestable: no hay una relación estadística que merezca ese nombre.', 'Weak or unstable association: there is no statistical relationship worth the name.', 'Association faible ou instable : pas de relation statistique digne de ce nom.', 'Associazione debole o instabile: non c’è una relazione statistica degna di questo nome.'),
              'INSUFFICIENT_DATA': L4('Datos insuficientes: la muestra es demasiado corta para describir una relación.', 'Insufficient data: the sample is too short to describe a relationship.', 'Données insuffisantes : l’échantillon est trop court pour décrire une relation.', 'Dati insufficienti: il campione è troppo breve per descrivere una relazione.')}

def num(v, d, lang):
    s = ('%.' + str(d) + 'f') % v
    return s.replace('.', ',') if lang in ('es', 'fr', 'it') else s

def explain(rel):
    s = rel['stat']; fr = rel['frequency']; out = {}
    for lg in ('es', 'en', 'fr', 'it'):
        a = rel['input']['label'][lg] + ' (' + REGN[rel['input']['region']][lg] + ')'; b = rel['market']['label'][lg] + ' (' + REGN[rel['market']['region']][lg] + ')'
        r = s['correlation']; per = '%s–%s' % (s['periodStart'], s['periodEnd']); n = s['n']; lag = s['lag']; up = UNITP[fr][lg]; u1 = UNITW[fr][lg]; lu = (u1 if lag == 1 else up)
        if r is None or rel['status'] == 'INSUFFICIENT_DATA': out[lg] = STATUS_TXT[rel['status']][lg] + ' (n = %d, %s–%s).' % (n, s['periodStart'], s['periodEnd']); continue
        sd = {'positive': L4('tendieron a moverse en el mismo sentido', 'tended to move in the same direction', 'ont eu tendance à évoluer dans le même sens', 'tendevano a muoversi nella stessa direzione'),
              'negative': L4('tendieron a moverse en sentido contrario', 'tended to move in opposite directions', 'ont eu tendance à évoluer en sens inverse', 'tendevano a muoversi in direzioni opposte'),
              'none': L4('no mostraron una asociación lineal clara', 'showed no clear linear association', 'n’ont pas montré d’association linéaire claire', 'non hanno mostrato un’associazione lineare chiara')}[s['direction']][lg]
        lagtxt = {'es': 'en el mismo periodo' if lag == 0 else 'con %d %s de rezago' % (lag, lu), 'en': 'in the same period' if lag == 0 else 'with a %d-%s lag' % (lag, u1), 'fr': 'sur la même période' if lag == 0 else 'avec un décalage de %d %s' % (lag, lu), 'it': 'nello stesso periodo' if lag == 0 else 'con un ritardo di %d %s' % (lag, lu)}[lg]
        stab = '' if s['signStability'] is None else {'es': ' El signo se mantuvo en el %s %% de las ventanas de %d %s.', 'en': ' The sign held in %s %% of the %d-%s windows.', 'fr': ' Le signe s’est maintenu dans %s %% des fenêtres de %d %s.', 'it': ' Il segno si è mantenuto nel %s %% delle finestre di %d %s.'}[lg] % (num(s['signStability'] * 100, 0, lg), s['window'], up)
        if s.get('inputTransform') == 'anomaly':
            head = {'es': 'Entre %s (%d %s), la anomalía mensual de %s y los cambios de %s %s %s: correlación %s (%s).', 'en': 'Between %s (%d %s), the monthly anomaly of %s and changes in %s %s %s: correlation %s (%s).',
                    'fr': 'Entre %s (%d %s), l’anomalie mensuelle de %s et les variations de %s %s %s : corrélation %s (%s).', 'it': 'Tra %s (%d %s), l’anomalia mensile di %s e le variazioni di %s %s %s: correlazione %s (%s).'}[lg] % (per, n, up, a, b, sd, lagtxt, num(r, 2, lg), STR[s['strength']][lg])
        else: head = {'es': 'Entre %s (%d %s), los cambios de %s y los de %s %s %s: correlación %s (%s).', 'en': 'Between %s (%d %s), changes in %s and in %s %s %s: correlation %s (%s).',
                'fr': 'Entre %s (%d %s), les variations de %s et de %s %s %s : corrélation %s (%s).', 'it': 'Tra %s (%d %s), le variazioni di %s e di %s %s %s: correlazione %s (%s).'}[lg] % (per, n, up, a, b, sd, lagtxt, num(r, 2, lg), STR[s['strength']][lg])
        best = {'es': ' El rezago se eligió entre %d probados: la correlación es optimista.', 'en': ' The lag was chosen among %d tested: the correlation is optimistic.', 'fr': ' Le décalage a été choisi parmi %d testés : la corrélation est optimiste.', 'it': ' Il ritardo è stato scelto tra %d provati: la correlazione è ottimistica.'}[lg] % s['lagsTested']
        tail = {'es': ' Es una asociación estadística descriptiva, no una predicción; la hipótesis económica (%s) es una explicación plausible que estos datos no prueban.', 'en': ' This is a descriptive statistical association, not a forecast; the economic hypothesis (%s) is a plausible explanation that these data do not prove.',
                'fr': ' C’est une association statistique descriptive, pas une prévision ; l’hypothèse économique (%s) est une explication plausible que ces données ne prouvent pas.', 'it': ' È un’associazione statistica descrittiva, non una previsione; l’ipotesi economica (%s) è una spiegazione plausibile che questi dati non dimostrano.'}[lg] % CH[rel['channel']][lg]
        out[lg] = head + stab + best + ' ' + STATUS_TXT[rel['status']][lg] + tail
    return out

def hist(region, product):
    f = D / 'prices' / 'history' / region / (product + '.json')
    if not f.exists(): return None
    return json.loads(f.read_text())

def side(region, product):
    k = region + '/' + product; o = LATEST.get(k)
    return {'key': 'P/%s/%s' % (product, region), 'product': product, 'region': region, 'label': NAMES[product], 'sourceId': o['sourceId'] if o else None, 'unit': o['unit'] if o else None, 'currency': o['currency'] if o else None}

def last_move(series, freq, o):
    ks = sorted(series)
    if not ks: return None
    i = ks[-1]; prev = series.get(i - 1)
    return {'period': RE.ym_of(i, freq), 'value': round(series[i], 4), 'changePct': None if (o == 'level' or not prev) else round((series[i] / prev - 1) * 100, 2)}

def special(region, ref):
    """Series de entrada/mercado que no son un historico de precios. -> dict(series, cur, side, last, srcfreq) o None."""
    if ref.startswith('clim:'):
        _, loc, kind = ref.split(':'); ser = RE.climate_series(CLIM, loc, kind)
        if not ser: return None
        lab = {lg: KIND[kind][0][lg] + ' · ' + LOCN[loc][lg] for lg in ('es', 'en', 'fr', 'it')}
        last = max(ser); date = RE.ym_of(last, 'monthly')
        return {'series': ser, 'cur': 'INDEX', 'xmode': 'anomaly', 'freqsrc': 'monthly', 'date': date, 'src': 'nasa_power',
                'side': {'key': 'C/%s/%s' % (loc, kind), 'product': '%s-%s' % (kind, loc), 'region': region, 'label': lab, 'sourceId': 'nasa_power', 'unit': KIND[kind][1], 'currency': 'INDEX'}}
    if ref.startswith('stock:'):
        sid = ref.split(':', 1)[1]; st = STOCKS.get(sid)
        if not st: return None
        ser = {int(a): b for a, b in st['points'] if isinstance(b, (int, float))}
        return {'series': ser, 'cur': 'INDEX', 'xmode': 'change', 'freqsrc': 'annual', 'date': str(max(ser)), 'src': 'statcan',
                'side': {'key': 'S/%s' % sid, 'product': 'stocks-' + sid.split('-')[2], 'region': region, 'label': STOCKN[sid], 'sourceId': 'statcan', 'unit': st['unit'], 'currency': 'INDEX'}}
    return None


def main():
    now_day = FR.today_ord(); rels = []
    for fam, spec in FAMILIES.items():
        freq = spec['freq']
        for (ia, ib) in spec['pairs']:
            sp_a = special(*ia)
            ha, hb = (None if sp_a else hist(*ia)), hist(*ib)
            if (not ha and not sp_a) or not hb: print('SIN HISTORICO', ia, ib); continue
            if ha and ha['frequency'] != hb['frequency'] and freq == 'quarterly': continue
            xmode = 'level' if spec.get('xmode') == 'level' else 'change'
            if sp_a: sa = sp_a['series']; ca = sp_a['cur']
            else: sa = RE.aggregate(ha['history'], freq); ca = ha['currency']
            sb = RE.crop_year_average(hb['history']) if freq == 'annual' else RE.aggregate(hb['history'], freq)
            cb = hb['currency']; treat = 'original'
            if ca != cb and 'INDEX' not in (ca, cb):
                sa2, sb2 = RE.to_eur(sa, ca, FX, freq), RE.to_eur(sb, cb, FX, freq); treat = 'EUR'
            else: sa2, sb2 = sa, sb
            res = RE.analyse(sa2, sb2, freq, spec['lags'], xmode=xmode)
            if not res: print('SIN PARES', ia, ib); continue
            n = res['n']; r = res['r']; stab = res['stability']; st = RE.status_of(n, r, stab, freq)
            conf = RE.confidence(n, r, stab, res['coverage'], freq)
            rel = {'id': ('%s__%s-%s__%s-%s' % (fam, ia[1], ia[0], ib[1], ib[0])).replace(':', '-'), 'family': fam, 'status': st, 'channel': CHANNEL_OF[ia[1]] if (fam in ('index_eu', 'index_uk') and not sp_a) else spec['channel'], 'frequency': freq,
                   'input': sp_a['side'] if sp_a else side(*ia), 'market': side(*ib),
                   'stat': {'correlation': r, 'direction': 'none' if r is None or abs(r) < 0.1 else ('positive' if r > 0 else 'negative'), 'strength': RE.strength(r) if r is not None else 'negligible',
                            'lag': res['lag'], 'lagUnit': {'monthly': 'month', 'quarterly': 'quarter', 'annual': 'year'}[freq], 'inputTransform': 'anomaly' if xmode == 'level' else 'change', 'n': n, 'periodStart': RE.ym_of(res['first'], freq), 'periodEnd': RE.ym_of(res['last'], freq),
                            'coverage': res['coverage'], 'signStability': stab, 'window': RE.WINDOW[freq], 'windows': res['windows'], 'recentCorrelation': res['recentR'],
                            'lagsTested': res['lagsTested'], 'lagProfile': res['profile'], 'currencyTreatment': treat},
                   'confidence': conf,
                   'last': {'input': last_move(sa, freq, xmode), 'market': last_move(sb, freq, None)}}
            fs = {}
            for k, (rg, pr) in (('input', ia), ('market', ib)):
                if k == 'input' and sp_a: fs[k] = FR.evaluate(sp_a['date'], sp_a['freqsrc'], sp_a['src'], now_day)['state']; continue
                o = LATEST.get(rg + '/' + pr); fs[k] = FR.evaluate(o['observationDate'], o['frequency'], o['sourceId'], now_day)['state'] if o else 'PENDING'
            rel['freshness'] = fs
            rel['explanation'] = explain(rel)
            rels.append(rel)
    order = {'OBSERVED_RELATIONSHIP': 0, 'WEAK_OR_UNSTABLE': 1, 'INSUFFICIENT_DATA': 2}; crank = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    rels.sort(key=lambda x: (order[x['status']], crank[x['confidence']], -abs(x['stat']['correlation'] or 0), x['id']))
    # Cadenas (consecuencias de segundo paso): A -> B observada y B -> C observada, las dos con confianza alta o media. Cada eslabon se mide por separado;
    # NO se multiplican correlaciones ni se calcula un efecto total (seria inventar una cifra que los datos no dan).
    solid = [x for x in rels if x['status'] == 'OBSERVED_RELATIONSHIP' and x['confidence'] in ('HIGH', 'MEDIUM')]
    chains = []
    for a in solid:
        for b in solid:
            if a is b or b['input']['key'] != a['market']['key'] or b['market']['key'] == a['input']['key']: continue
            # solo cadenas que cambian de canal (p. ej. crudo -> gasoleo -> cereal; cereal -> pienso -> carne); dos eslabones de comercio/sustitucion repiten lo mismo
            if a['channel'] == b['channel'] or {a['channel'], b['channel']} <= {'trade', 'substitute'}: continue
            chains.append({'id': a['id'] + '>>' + b['id'], 'links': [a['id'], b['id']], 'nodes': [a['input'], a['market'], b['market']],
                           'confidence': 'HIGH' if a['confidence'] == b['confidence'] == 'HIGH' else 'MEDIUM'})
    chains.sort(key=lambda c: (c['confidence'] != 'HIGH', c['id']))
    fams = {k: {'channel': v['channel'], 'frequency': v['freq'], 'lagsTested': v['lags'], 'hypothesis': v['hypothesis']} for k, v in FAMILIES.items()}
    doc = {'schemaVersion': 1, 'generatedAt': NOW,
           'disclaimer': L4('Descriptivo, no predictivo: describe cómo se han movido juntos los precios en el pasado; no anticipa lo que harán ni demuestra causas.', 'Descriptive, not predictive: it describes how prices moved together in the past; it does not anticipate what they will do nor prove causes.',
                            'Descriptif, pas prédictif : il décrit comment les prix ont évolué ensemble par le passé ; il n’anticipe pas ce qu’ils feront ni ne prouve des causes.', 'Descrittivo, non predittivo: descrive come i prezzi si sono mossi insieme in passato; non anticipa cosa faranno né dimostra cause.'),
           'methodology': {'summary': 'Pearson correlation of period-over-period changes between an input series and a market series, testing only the lags listed per family and keeping the lag with the largest absolute correlation among those with enough observations.',
                           'selection': 'Best of K lags: the published correlation is optimistic by construction (lagsTested and lagProfile show every lag tried).', 'minimumPeriods': RE.MIN_N, 'signStabilityWindow': RE.WINDOW,
                           'confidence': 'HIGH: n>=60 (24 quarterly), |r|>=0.4, sign stability>=0.75, coverage>=0.8. MEDIUM: n>=36 (16), |r|>=0.25, stability>=0.6. Otherwise LOW. It rates how well the statistical association holds, not the economic hypothesis.',
                           'status': 'OBSERVED_RELATIONSHIP: enough data, |r|>=0.2 and sign stability>=0.5. WEAK_OR_UNSTABLE otherwise. INSUFFICIENT_DATA: fewer pairs than the minimum.',
                           'currency': 'If the two series have different currencies both are converted to EUR with the ECB monthly rate (exact month or previous, at most 2 months); otherwise original currency. Index series are unitless.',
                           'chains': 'A chain links two observed relationships (A->B and B->C, both HIGH or MEDIUM confidence) through the same series B. Each link keeps its own statistics; no total effect is computed and correlations are not multiplied.', 'causality': 'No causal inference. The economic hypothesis (families.*.hypothesis) is a plausible explanation written by hand; the data do not prove it.',
                           'catalogue': 'Only economically justifiable relationships (product-metadata related + Eurostat/DEFRA index families + monthly weather anomalies of the main growing regions + Canadian end-of-crop-year stocks); pairs are not mined at random.',
                           'anomalies': 'Weather input = monthly anomaly vs the 2001-2020 climatology of the same calendar month (NASA POWER): precipitation in % of the climatological value, temperature in degrees C. The anomaly is a level, not a change, so it is correlated as is with the market change. Stocks input = year-on-year change in AAFC/Statistics Canada ending stocks (crop year Aug-Jul) against the change in the crop-year average price (annual frequency, minimum 20 pairs); recent balances are estimates and get revised.'},
           'families': fams, 'channels': CH, 'regions': REGN, 'relationships': rels, 'chains': chains}
    path = D / 'relationships.json'
    new = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
    try:
        old = json.loads(path.read_text()); old['generatedAt'] = doc['generatedAt']
        if json.dumps(old, ensure_ascii=False, separators=(',', ':')) == new: print('sin cambios'); return
    except Exception: pass
    path.write_text(new + '\n')
    from collections import Counter
    print(len(rels), dict(Counter(r['status'] for r in rels)), dict(Counter(r['confidence'] for r in rels)), path.stat().st_size)
main()
