# -*- coding: utf-8 -*-
"""Traduccion de las notas de la API (que mide exactamente cada serie) al ingles, frances e italiano.

Las notas nacen en espanol en muchos scripts de actualizacion. Aqui se traducen por FRASES: cada frase espanola conocida tiene su
version en en/fr/it. Si una nota contiene una frase que no esta en la tabla (porque el texto de origen cambio), esa nota NO se
traduce: se queda solo en espanol y build-api.py avisa de la frase que falta. Asi nunca se publica una traduccion que no corresponde
a lo que dice la nota."""
import re
from api_notes_i18n_more import translate_more

LANGS = ('en', 'fr', 'it')
_EEUU = 'EE·UU·'

def split_sentences(t):
    t = t.replace('EE. UU.', _EEUU)
    return [s.replace(_EEUU, 'EE. UU.') for s in re.split(r'(?<=\.)\s+(?=[A-ZÀÁÈÉÊÍÎÓÚ«])', t.strip())]

# ---- frases repetidas
S = {
# ---- trigo duro de la UE (Sevilla)
 'Comisión Europea, Agri-food Data Portal: precio semanal del trigo duro en el mercado de Sevilla (España), salida de silo tras almacenamiento en camión, EUR/tonelada.': (
  'European Commission, Agri-food Data Portal: weekly durum wheat price at the Seville market (Spain), ex-silo after storage on truck, EUR/tonne.',
  "Commission européenne, Agri-food Data Portal : prix hebdomadaire du blé dur sur le marché de Séville (Espagne), départ silo après stockage sur camion, EUR/tonne.",
  "Commissione europea, Agri-food Data Portal: prezzo settimanale del grano duro sul mercato di Siviglia (Spagna), franco silo dopo stoccaggio su camion, EUR/tonnellata."),
 'Es un mercado regional, no la media nacional (la media nacional del portal está desactualizada) ni un futuro.': (
  'It is a regional market, not the national average (the portal’s national average is out of date) nor a futures price.',
  "Il s'agit d'un marché régional, pas de la moyenne nationale (celle du portail n'est plus à jour) ni d'un contrat à terme.",
  "È un mercato regionale, non la media nazionale (quella del portale non è aggiornata) né un future."),
 'Italia, el mayor productor de la UE, publica sus propios mercados (Bolonia, Roma, Foggia…): se ven al elegir Italia y en la página de Europa.': (
  'Italy, the EU’s largest producer, publishes its own markets (Bologna, Rome, Foggia…): they appear when you choose Italy and on the Europe page.',
  "L'Italie, premier producteur de l'UE, publie ses propres marchés (Bologne, Rome, Foggia…) : ils apparaissent en choisissant l'Italie et sur la page Europe.",
  "L'Italia, il maggior produttore dell'UE, pubblica i propri mercati (Bologna, Roma, Foggia…): si vedono scegliendo l'Italia e nella pagina Europa."),
 'USDA ERS, Sugar and Sweeteners Yearbook, table 5: wholesale refined beet sugar price, Midwest markets, bulk, monthly average; USD/lb (ERS publishes cents/lb).': (
  'USDA ERS, Sugar and Sweeteners Yearbook, table 5: wholesale refined beet sugar price, Midwest markets, bulk, monthly average; USD/lb (ERS publishes cents/lb).',
  "USDA ERS, Sugar and Sweeteners Yearbook, tableau 5 : prix de gros du sucre de betterave raffiné, marchés du Midwest, en vrac, moyenne mensuelle ; USD/lb (l'ERS publie en cents/lb).",
  "USDA ERS, Sugar and Sweeteners Yearbook, tabella 5: prezzo all'ingrosso dello zucchero di barbabietola raffinato, mercati del Midwest, sfuso, media mensile; USD/lb (l'ERS pubblica in centesimi/lb)."),
 'Wholesale, not retail; the EU figure is the average ex-factory white sugar price.': (
  'Wholesale, not retail; the EU figure is the average ex-factory white sugar price.',
  "Prix de gros, pas de détail ; le chiffre de l'UE est le prix moyen départ usine du sucre blanc.",
  "Prezzo all'ingrosso, non al dettaglio; il dato UE è il prezzo medio franco fabbrica dello zucchero bianco."),
 'La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.': (
  'The API does not publish a release date: the day the figure was first retrieved is recorded.',
  "L'API ne publie pas de date de publication : on enregistre le jour où la donnée a été récupérée pour la première fois.",
  "L'API non pubblica la data di pubblicazione: si registra il giorno in cui il dato è stato recuperato per la prima volta."),
 'Canadá no publica total nacional en esta tabla: se usa la provincia de referencia.': (
  'Canada does not publish a national total in this table: the reference province is used.',
  "Le Canada ne publie pas de total national dans ce tableau : on utilise la province de référence.",
  "Il Canada non pubblica un totale nazionale in questa tabella: si usa la provincia di riferimento."),
 'Cifra tomada del informe semanal en PDF de la fecha indicada; las ofertas de elevador y de compradores son precios ofrecidos, no operaciones cerradas.': (
  'Figure taken from the weekly PDF report of the date shown; elevator and buyer bids are offered prices, not completed trades.',
  "Chiffre tiré du rapport hebdomadaire en PDF à la date indiquée ; les offres des silos et des acheteurs sont des prix proposés, non des transactions conclues.",
  "Cifra tratta dal rapporto settimanale in PDF alla data indicata; le offerte dei silos e degli acquirenti sono prezzi offerti, non operazioni concluse."),
 'Es un mercado regional, no la media nacional ni un futuro de Euronext.': (
  'It is a regional market, not the national average nor a Euronext future.',
  "C'est un marché régional, pas la moyenne nationale ni un contrat à terme d'Euronext.",
  "È un mercato regionale, non la media nazionale né un future di Euronext."),
 'No es un futuro ni una media calculada por Dehesa Index.': (
  'It is not a future nor an average calculated by Dehesa Index.',
  "Ce n'est ni un contrat à terme ni une moyenne calculée par Dehesa Index.",
  "Non è un future né una media calcolata da Dehesa Index."),
 'La serie de España tiene huecos de varias semanas.': (
  'The Spanish series has gaps of several weeks.',
  "La série de l'Espagne comporte des trous de plusieurs semaines.",
  "La serie della Spagna presenta lacune di diverse settimane."),
 'No es la media de la UE.': (
  'It is not the EU average.', "Ce n'est pas la moyenne de l'UE.", "Non è la media dell'UE."),
 'Es el agregado de la Comisión, no una media calculada por Dehesa Index.': (
  "It is the Commission's aggregate, not an average calculated by Dehesa Index.",
  "C'est l'agrégat de la Commission, pas une moyenne calculée par Dehesa Index.",
  "È l'aggregato della Commissione, non una media calcolata da Dehesa Index."),
 'Es la referencia española; no es la media de la UE.': (
  'It is the Spanish reference; it is not the EU average.',
  "C'est la référence espagnole ; ce n'est pas la moyenne de l'UE.",
  "È il riferimento spagnolo; non è la media dell'UE."),
}

_EC = 'Comisión Europea, Agri-food Data Portal: '
def _ec(es_tail, en, fr, it):
    S[_EC + es_tail] = ('European Commission, Agri-food Data Portal: ' + en, 'Commission européenne, portail de données agroalimentaires (Agri-food Data Portal) : ' + fr, 'Commissione europea, portale dei dati agroalimentari (Agri-food Data Portal): ' + it)

_ec('precio semanal de la colza en España (media nacional, salida de silo del agricultor), EUR/tonelada. No es la media de la UE ni el futuro de Euronext.',
 'weekly price of rapeseed in Spain (national average, ex-silo farmer), EUR/tonne. It is not the EU average nor the Euronext future.',
 "prix hebdomadaire du colza en Espagne (moyenne nationale, départ silo de l'agriculteur), EUR/tonne. Ce n'est ni la moyenne de l'UE ni le contrat à terme d'Euronext.",
 "prezzo settimanale della colza in Spagna (media nazionale, franco silo dell'agricoltore), EUR/tonnellata. Non è la media dell'UE né il future di Euronext.")
_ec('precio semanal del trigo blando panificable (milling wheat) en el mercado de Zaragoza (España), salida de silo tras almacenamiento en camión, EUR/tonelada.',
 'weekly price of soft milling wheat on the Zaragoza market (Spain), ex-silo after storage on truck, EUR/tonne.',
 "prix hebdomadaire du blé tendre meunier (milling wheat) sur le marché de Saragosse (Espagne), départ silo après stockage sur camion, EUR/tonne.",
 "prezzo settimanale del frumento tenero panificabile (milling wheat) sul mercato di Saragozza (Spagna), franco silo dopo stoccaggio su camion, EUR/tonnellata.")
_ec('precio semanal de la leche desnatada en polvo (SMP), agregado de la UE calculado por la Comisión, EUR/100 kg.',
 'weekly price of skimmed milk powder (SMP), EU aggregate calculated by the Commission, EUR/100 kg.',
 "prix hebdomadaire du lait écrémé en poudre (SMP), agrégat de l'UE calculé par la Commission, EUR/100 kg.",
 "prezzo settimanale del latte scremato in polvere (SMP), aggregato dell'UE calcolato dalla Commissione, EUR/100 kg.")
_ec('precio semanal medio nacional del aceite de oliva virgen extra (hasta 0,8 %) en España, EUR/100 kg.',
 'weekly national average price of extra virgin olive oil (up to 0.8 %) in Spain, EUR/100 kg.',
 "prix hebdomadaire moyen national de l'huile d'olive vierge extra (jusqu'à 0,8 %) en Espagne, EUR/100 kg.",
 "prezzo settimanale medio nazionale dell'olio extravergine di oliva (fino a 0,8 %) in Spagna, EUR/100 kg.")
_ec('precio mensual agregado de los fertilizantes fosfatados (P) en varios mercados de la UE, EUR/tonelada, a partir de servicios de inteligencia de mercado. NO es DAP: la Comisión no especifica el producto, así que no es comparable con DAP ni con el índice DTN.',
 'aggregated monthly price of phosphate (P) fertilisers in several EU markets, EUR/tonne, based on market intelligence services. It is NOT DAP: the Commission does not specify the product, so it is not comparable with DAP or with the DTN index.',
 "prix mensuel agrégé des engrais phosphatés (P) sur plusieurs marchés de l'UE, EUR/tonne, à partir de services d'information sur les marchés. Ce n'est PAS du DAP : la Commission ne précise pas le produit, donc il n'est comparable ni au DAP ni à l'indice DTN.",
 "prezzo mensile aggregato dei fertilizzanti fosfatici (P) in vari mercati dell'UE, EUR/tonnellata, da servizi di informazione di mercato. NON è DAP: la Commissione non specifica il prodotto, quindi non è confrontabile con il DAP né con l'indice DTN.")
_ec('precio semanal de la cebada pienso en el mercado de Lleida (España), salida de silo tras almacenamiento en camión, EUR/tonelada.',
 'weekly price of feed barley on the Lleida market (Spain), ex-silo after storage on truck, EUR/tonne.',
 "prix hebdomadaire de l'orge fourragère sur le marché de Lérida (Espagne), départ silo après stockage sur camion, EUR/tonne.",
 "prezzo settimanale dell'orzo da foraggio sul mercato di Lleida (Spagna), franco silo dopo stoccaggio su camion, EUR/tonnellata.")
S[_EC + 'precio de venta semanal del pollo broiler entero (65 % de rendimiento) en España; el portal lo da en moneda nacional (EUR) por 100 kg y se divide entre 100 para expresarlo en EUR/kg.'] = (
 'European Commission, Agri-food Data Portal: weekly selling price of whole broiler chicken (65 % yield) in Spain; the portal gives it in national currency (EUR) per 100 kg and it is divided by 100 to express it in EUR/kg.',
 "Commission européenne, portail de données agroalimentaires (Agri-food Data Portal) : prix de vente hebdomadaire du poulet de chair entier (rendement de 65 %) en Espagne ; le portail le donne en monnaie nationale (EUR) par 100 kg et il est divisé par 100 pour l'exprimer en EUR/kg.",
 "Commissione europea, portale dei dati agroalimentari (Agri-food Data Portal): prezzo di vendita settimanale del pollo da carne intero (resa del 65 %) in Spagna; il portale lo fornisce in valuta nazionale (EUR) per 100 kg e viene diviso per 100 per esprimerlo in EUR/kg.")
_ec('precio semanal del maíz pienso en el mercado de Zaragoza (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional (la media nacional del portal está desactualizada) ni un futuro de Euronext.',
 'weekly price of feed maize on the Zaragoza market (Spain), ex-silo after storage on truck, EUR/tonne. It is a regional market, not the national average (the portal\'s national average is out of date) nor a Euronext future.',
 "prix hebdomadaire du maïs fourrager sur le marché de Saragosse (Espagne), départ silo après stockage sur camion, EUR/tonne. C'est un marché régional, pas la moyenne nationale (la moyenne nationale du portail n'est plus à jour) ni un contrat à terme d'Euronext.",
 "prezzo settimanale del mais da foraggio sul mercato di Saragozza (Spagna), franco silo dopo stoccaggio su camion, EUR/tonnellata. È un mercato regionale, non la media nazionale (la media nazionale del portale non è aggiornata) né un future di Euronext.")
_ec('precio semanal medio del arroz cáscara (paddy) tipo japónica en España, EUR/tonelada. No es la media de la UE ni arroz índica.',
 'weekly average price of japonica-type paddy rice in Spain, EUR/tonne. It is not the EU average nor indica rice.',
 "prix hebdomadaire moyen du riz paddy de type japonica en Espagne, EUR/tonne. Ce n'est ni la moyenne de l'UE ni du riz indica.",
 "prezzo settimanale medio del riso risone di tipo japonica in Spagna, EUR/tonnellata. Non è la media dell'UE né riso indica.")
_ec('precio semanal de la harina de soja de 40-50 % de proteína en España (media, salida de fábrica), EUR/tonelada. Sustituye a la referencia anterior de colza en Euronext.',
 'weekly price of soybean meal with 40-50 % protein in Spain (average, ex-works), EUR/tonne. It replaces the previous Euronext rapeseed reference.',
 "prix hebdomadaire du tourteau de soja à 40-50 % de protéines en Espagne (moyenne, départ usine), EUR/tonne. Il remplace l'ancienne référence du colza sur Euronext.",
 "prezzo settimanale della farina di soia con 40-50 % di proteine in Spagna (media, franco fabbrica), EUR/tonnellata. Sostituisce il precedente riferimento della colza su Euronext.")
_ec('precio semanal del agregado de la UE de centeno panificable en la fase «entrega al primer comprador» (silo o industria), EUR/tonelada. Desde agosto de 2026 la Comisión dejó de publicar la «media nacional» de los cereales; se usa esta fase, publicada desde 2023, sin empalmarla con la anterior. España no publica centeno en el portal.',
 'weekly price of the EU aggregate of bread-making rye at the "delivered to first buyer" stage (silo or industry), EUR/tonne. Since August 2026 the Commission stopped publishing the "national average" for cereals; this stage, published since 2023, is used without splicing it with the previous one. Spain does not publish rye in the portal.',
 "prix hebdomadaire de l'agrégat de l'UE du seigle panifiable au stade « livraison au premier acheteur » (silo ou industrie), EUR/tonne. Depuis août 2026, la Commission a cessé de publier la « moyenne nationale » des céréales ; on utilise ce stade, publié depuis 2023, sans le raccorder au précédent. L'Espagne ne publie pas de seigle dans le portail.",
 "prezzo settimanale dell'aggregato dell'UE della segale panificabile alla fase «consegna al primo acquirente» (silo o industria), EUR/tonnellata. Da agosto 2026 la Commissione ha smesso di pubblicare la «media nazionale» dei cereali; si usa questa fase, pubblicata dal 2023, senza raccordarla alla precedente. La Spagna non pubblica segale nel portale.")
_ec('precio semanal de la canal de macho joven (categoría A, conformación R3, la referencia UE) en España, EUR/100 kg de canal. No es vaca de desecho ni la media de la UE.',
 'weekly price of young bull carcase (category A, conformation R3, the EU reference) in Spain, EUR/100 kg of carcase. It is not cull cow nor the EU average.',
 "prix hebdomadaire de la carcasse de jeune bovin mâle (catégorie A, conformation R3, la référence de l'UE) en Espagne, EUR/100 kg de carcasse. Ce n'est ni la vache de réforme ni la moyenne de l'UE.",
 "prezzo settimanale della carcassa di giovane maschio (categoria A, conformazione R3, il riferimento UE) in Spagna, EUR/100 kg di carcassa. Non è vacca da riforma né la media dell'UE.")
_ec('precio semanal de la canal de cerdo clasificada S (≥60 % magro) en España, EUR/100 kg de canal.',
 'weekly price of pig carcase graded S (≥60 % lean) in Spain, EUR/100 kg of carcase.',
 "prix hebdomadaire de la carcasse de porc classée S (≥ 60 % de maigre) en Espagne, EUR/100 kg de carcasse.",
 "prezzo settimanale della carcassa di suino classificata S (≥60 % di carne magra) in Spagna, EUR/100 kg di carcassa.")
_ec('precio mensual agregado de los fertilizantes potásicos (K) en varios mercados de la UE, EUR/tonelada, a partir de servicios de inteligencia de mercado. NO es MOP: la Comisión no especifica el producto, así que no es comparable con MOP ni con el índice DTN.',
 'aggregated monthly price of potash (K) fertilisers in several EU markets, EUR/tonne, based on market intelligence services. It is NOT MOP: the Commission does not specify the product, so it is not comparable with MOP or with the DTN index.',
 "prix mensuel agrégé des engrais potassiques (K) sur plusieurs marchés de l'UE, EUR/tonne, à partir de services d'information sur les marchés. Ce n'est PAS du MOP : la Commission ne précise pas le produit, donc il n'est comparable ni au MOP ni à l'indice DTN.",
 "prezzo mensile aggregato dei fertilizzanti potassici (K) in vari mercati dell'UE, EUR/tonnellata, da servizi di informazione di mercato. NON è MOP: la Commissione non specifica il prodotto, quindi non è confrontabile con il MOP né con l'indice DTN.")
_ec('precio semanal del agregado de la UE de avena pienso en la fase «entrega al primer comprador» (silo o industria), EUR/tonelada. Desde agosto de 2026 la Comisión dejó de publicar la «media nacional» de los cereales; esta serie empieza el 9-8-2026 y no se empalma con la anterior. España no publica avena en el portal.',
 'weekly price of the EU aggregate of feed oats at the "delivered to first buyer" stage (silo or industry), EUR/tonne. Since August 2026 the Commission stopped publishing the "national average" for cereals; this series starts on 9-8-2026 and is not spliced with the previous one. Spain does not publish oats in the portal.',
 "prix hebdomadaire de l'agrégat de l'UE de l'avoine fourragère au stade « livraison au premier acheteur » (silo ou industrie), EUR/tonne. Depuis août 2026, la Commission a cessé de publier la « moyenne nationale » des céréales ; cette série commence le 9-8-2026 et n'est pas raccordée à la précédente. L'Espagne ne publie pas d'avoine dans le portail.",
 "prezzo settimanale dell'aggregato dell'UE dell'avena da foraggio alla fase «consegna al primo acquirente» (silo o industria), EUR/tonnellata. Da agosto 2026 la Commissione ha smesso di pubblicare la «media nazionale» dei cereali; questa serie inizia il 9-8-2026 e non è raccordata alla precedente. La Spagna non pubblica avena nel portale.")
_ec('precio mensual medio del azúcar en la UE (contratos mensuales), EUR/tonelada. Es la media de la UE, no un precio de España.',
 'average monthly price of sugar in the EU (monthly contracts), EUR/tonne. It is the EU average, not a Spanish price.',
 "prix mensuel moyen du sucre dans l'UE (contrats mensuels), EUR/tonne. C'est la moyenne de l'UE, pas un prix de l'Espagne.",
 "prezzo mensile medio dello zucchero nell'UE (contratti mensili), EUR/tonnellata. È la media dell'UE, non un prezzo della Spagna.")
_ec('precio semanal de los huevos de gallinas en jaula (Cage) en España, EUR/100 kg de huevos (el portal no lo da por docena). No es la media de la UE.',
 'weekly price of eggs from caged hens (Cage) in Spain, EUR/100 kg of eggs (the portal does not give it per dozen). It is not the EU average.',
 "prix hebdomadaire des œufs de poules en cage (Cage) en Espagne, EUR/100 kg d'œufs (le portail ne le donne pas à la douzaine). Ce n'est pas la moyenne de l'UE.",
 "prezzo settimanale delle uova di galline in gabbia (Cage) in Spagna, EUR/100 kg di uova (il portale non lo fornisce a dozzina). Non è la media dell'UE.")
S['Comisión Europea, Milk Market Observatory (Agri-food Data Portal): precio mensual de la leche cruda de vaca pagada al productor en España, EUR/100 kg, último mes completo.'] = (
 'European Commission, Milk Market Observatory (Agri-food Data Portal): monthly price of raw cow milk paid to the producer in Spain, EUR/100 kg, last complete month.',
 "Commission européenne, Observatoire du marché du lait (Milk Market Observatory, Agri-food Data Portal) : prix mensuel du lait cru de vache payé au producteur en Espagne, EUR/100 kg, dernier mois complet.",
 "Commissione europea, Osservatorio del mercato del latte (Milk Market Observatory, Agri-food Data Portal): prezzo mensile del latte vaccino crudo pagato al produttore in Spagna, EUR/100 kg, ultimo mese completo.")
S['Las cifras del último mes pueden ser provisionales.'] = (
 'Figures for the latest month may be provisional.', "Les chiffres du dernier mois peuvent être provisoires.", "Le cifre dell'ultimo mese possono essere provvisorie.")
_ec('precio semanal de la canal de cordero pesado en España, EUR/100 kg de canal. No es la media de la UE ni cordero ligero.',
 'weekly price of heavy lamb carcase in Spain, EUR/100 kg of carcase. It is not the EU average nor light lamb.',
 "prix hebdomadaire de la carcasse d'agneau lourd en Espagne, EUR/100 kg de carcasse. Ce n'est ni la moyenne de l'UE ni l'agneau léger.",
 "prezzo settimanale della carcassa di agnello pesante in Spagna, EUR/100 kg di carcassa. Non è la media dell'UE né agnello leggero.")
_ec('precio semanal de la mantequilla, agregado de la UE calculado por la Comisión, EUR/100 kg.',
 'weekly price of butter, EU aggregate calculated by the Commission, EUR/100 kg.',
 "prix hebdomadaire du beurre, agrégat de l'UE calculé par la Commission, EUR/100 kg.",
 "prezzo settimanale del burro, aggregato dell'UE calcolato dalla Commissione, EUR/100 kg.")

S['Weighted EU average for automotive gas oil, consumer price with taxes. The source expresses it in EUR/1,000 litres; value retained at source precision after division by 1,000.'] = (
 'Weighted EU average for automotive gas oil, consumer price with taxes. The source expresses it in EUR/1,000 litres; value retained at source precision after division by 1,000.',
 "Moyenne pondérée de l'UE pour le gazole routier, prix à la consommation taxes comprises. La source l'exprime en EUR/1 000 litres ; valeur conservée à la précision de la source après division par 1 000.",
 "Media ponderata dell'UE per il gasolio per autotrazione, prezzo al consumo comprensivo di imposte. La fonte lo esprime in EUR/1.000 litri; valore mantenuto alla precisione della fonte dopo la divisione per 1.000.")

S['Defra (Open Government Licence v3.0): precio medio en granja de la leche en el Reino Unido, hoja Prices_Monthly, en peniques por litro; se expresa en GBP/100 kg con una densidad de 1,03 kg/l (estándar de la leche de vaca).'] = (
 'Defra (Open Government Licence v3.0): average farm-gate milk price in the United Kingdom, sheet Prices_Monthly, in pence per litre; expressed in GBP/100 kg using a density of 1.03 kg/l (standard for cow\'s milk).',
 "Defra (Open Government Licence v3.0) : prix moyen du lait à la ferme au Royaume-Uni, feuille Prices_Monthly, en pence par litre ; exprimé en GBP/100 kg avec une densité de 1,03 kg/l (standard du lait de vache).",
 "Defra (Open Government Licence v3.0): prezzo medio del latte in azienda nel Regno Unito, foglio Prices_Monthly, in penny al litro; espresso in GBP/100 kg con una densità di 1,03 kg/l (standard del latte vaccino).")
S['USDA AMS Market News (API MARS, informe 1049 «Nonfat Dry Milk - East and Central U.S.», semanal): leche desnatada en polvo de calor bajo y medio, en USD por libra.'] = (
 'USDA AMS Market News (MARS API, report 1049 "Nonfat Dry Milk - East and Central U.S.", weekly): low- and medium-heat skimmed milk powder, in USD per pound.',
 "USDA AMS Market News (API MARS, rapport 1049 « Nonfat Dry Milk - East and Central U.S. », hebdomadaire) : lait écrémé en poudre à basse et moyenne température, en USD par livre.",
 "USDA AMS Market News (API MARS, rapporto 1049 «Nonfat Dry Milk - East and Central U.S.», settimanale): latte scremato in polvere a basso e medio trattamento termico, in USD per libbra.")
S['El informe publica un rango semanal (mínimo y máximo) y el valor mostrado es el punto medio de ese rango, calculado por Dehesa Index.'] = (
 'The report publishes a weekly range (minimum and maximum) and the value shown is the midpoint of that range, calculated by Dehesa Index.',
 "Le rapport publie une fourchette hebdomadaire (minimum et maximum) et la valeur affichée est le milieu de cette fourchette, calculé par Dehesa Index.",
 "Il rapporto pubblica un intervallo settimanale (minimo e massimo) e il valore mostrato è il punto medio di tale intervallo, calcolato da Dehesa Index.")
S['Es un mercado regional (Este y Centro de EE. UU.), no un futuro; el producto es equivalente en tipo al SMP europeo, pero no es idéntico.'] = (
 'It is a regional market (eastern and central U.S.), not a future; the product is of the same type as European SMP, but not identical.',
 "C'est un marché régional (Est et centre des États-Unis), pas un contrat à terme ; le produit est de même type que le SMP européen, mais il n'est pas identique.",
 "È un mercato regionale (Stati Uniti orientali e centrali), non un future; il prodotto è dello stesso tipo dell'SMP europeo, ma non è identico.")
S['USDA AMS Market News (API MARS, informe 3511 «National Grain and Oilseed Processor Feedstuff Report», semanal): precio medio semanal de la harina de soja de 46,5-48 % de proteína en Iowa, FOB, cotización de venta (ask), en USD por tonelada.'] = (
 'USDA AMS Market News (MARS API, report 3511 "National Grain and Oilseed Processor Feedstuff Report", weekly): weekly average price of soybean meal with 46.5-48 % protein in Iowa, FOB, selling quote (ask), in USD per ton.',
 "USDA AMS Market News (API MARS, rapport 3511 « National Grain and Oilseed Processor Feedstuff Report », hebdomadaire) : prix moyen hebdomadaire du tourteau de soja à 46,5-48 % de protéines en Iowa, FOB, cotation de vente (ask), en USD par tonne.",
 "USDA AMS Market News (API MARS, rapporto 3511 «National Grain and Oilseed Processor Feedstuff Report», settimanale): prezzo medio settimanale della farina di soia con 46,5-48 % di proteine in Iowa, FOB, quotazione di vendita (ask), in USD per tonnellata.")
S['El informe solo indica «$ Per Ton»; se trata como tonelada corta (2.000 lb) porque el precio se expresa como base sobre el futuro de harina de soja de CBOT, que cotiza en toneladas cortas.'] = (
 'The report only says "$ Per Ton"; it is treated as a short ton (2,000 lb) because the price is expressed as a basis over the CBOT soybean meal future, which is quoted in short tons.',
 "Le rapport indique seulement « $ Per Ton » ; on le traite comme une tonne courte (2 000 lb) car le prix est exprimé en base par rapport au contrat à terme du tourteau de soja du CBOT, coté en tonnes courtes.",
 "Il rapporto indica solo «$ Per Ton»; lo si tratta come tonnellata corta (2.000 lb) perché il prezzo è espresso come base sul future della farina di soia del CBOT, quotato in tonnellate corte.")
S['Es un mercado regional, no un futuro ni la media nacional, y no es exactamente el mismo producto que la referencia europea (España, 40-50 % de proteína, salida de fábrica, EUR/t).'] = (
 'It is a regional market, not a future nor the national average, and it is not exactly the same product as the European reference (Spain, 40-50 % protein, ex-works, EUR/t).',
 "C'est un marché régional, ni un contrat à terme ni la moyenne nationale, et ce n'est pas exactement le même produit que la référence européenne (Espagne, 40-50 % de protéines, départ usine, EUR/t).",
 "È un mercato regionale, non un future né la media nazionale, e non è esattamente lo stesso prodotto del riferimento europeo (Spagna, 40-50 % di proteine, franco fabbrica, EUR/t).")


S['El portal no publica cebada pienso en Zaragoza.'] = (
 'The portal does not publish feed barley for Zaragoza.', "Le portail ne publie pas d'orge fourragère pour Saragosse.", "Il portale non pubblica orzo da foraggio per Saragozza.")
S['No es la media de la UE ni cordero ligero.'] = ('It is not the EU average nor light lamb.', "Ce n'est ni la moyenne de l'UE ni l'agneau léger.", "Non è la media dell'UE né agnello leggero.")

def _expand():
    """Las entradas de varias frases se descomponen en frases sueltas (misma cantidad de frases en los cuatro idiomas)."""
    for k, v in list(S.items()):
        ks = split_sentences(k)
        if len(ks) < 2: continue
        vs = [split_sentences(x) for x in v]
        assert all(len(x) == len(ks) for x in vs), ('frases desiguales', k[:60], len(ks), [len(x) for x in vs])
        for i, kk in enumerate(ks): S.setdefault(kk, tuple(x[i] for x in vs))
        del S[k]
_expand()

# ---- Statistics Canada (plantilla)
_SC = re.compile(r'^Statistics Canada, tabla 32-10-0077-01 \((.*?)\): precio mensual pagado al productor en (\w+), (.*?), publicado en (CAD per [\w ]+?)(; expresado en CAD/100 kg con una densidad de 1,03 kg/l \(estándar de la leche de vaca\))?\.$')
_PROV = {'en': {'Saskatchewan': 'in Saskatchewan', 'Alberta': 'in Alberta', 'Ontario': 'in Ontario', 'Quebec': 'in Quebec'},
         'fr': {'Saskatchewan': 'en Saskatchewan', 'Alberta': 'en Alberta', 'Ontario': 'en Ontario', 'Quebec': 'au Québec'},
         'it': {'Saskatchewan': 'in Saskatchewan', 'Alberta': 'in Alberta', 'Ontario': 'in Ontario', 'Quebec': 'in Quebec'}}
_SCX = {'en': '; expressed in CAD/100 kg using a density of 1.03 kg/l (standard for cow\'s milk)',
        'fr': ' ; exprimé en CAD/100 kg avec une densité de 1,03 kg/l (standard du lait de vache)',
        'it': '; espresso in CAD/100 kg con una densità di 1,03 kg/l (standard del latte vaccino)'}
def _statcan(s, lang):
    m = _SC.match(s)
    if not m or m.group(2) not in _PROV[lang]: return None
    lic, prov, prod, unit, extra = m.groups()
    ex = _SCX[lang] if extra else ''
    if lang == 'en': return 'Statistics Canada, table 32-10-0077-01 (%s): monthly price paid to producers %s, %s, published in %s%s.' % (lic, _PROV[lang][prov], prod, unit, ex)
    if lang == 'fr': return 'Statistique Canada, tableau 32-10-0077-01 (%s) : prix mensuel payé aux producteurs %s, %s, publié en %s%s.' % (lic, _PROV[lang][prov], prod, unit, ex)
    return 'Statistics Canada, tabella 32-10-0077-01 (%s): prezzo mensile pagato ai produttori %s, %s, pubblicato in %s%s.' % (lic, _PROV[lang][prov], prod, unit, ex)

# ---- Alberta (prefijo + producto)
_AB = 'Alberta Agriculture and Irrigation, Weekly Market Review (Open Government Licence - Alberta): '
_ABP = {
 'Cebada forrajera, oferta de elevador (Alberta centro, entregado).': ('Feed barley, elevator bid (central Alberta, delivered).', "Orge fourragère, offre des silos (centre de l'Alberta, rendu).", "Orzo da foraggio, offerta dei silos (Alberta centrale, reso)."),
 'Cerdo, precio al contado de Alberta, índice 100, por kg de canal.': ('Hogs, Alberta cash price, index 100, per kg of carcase.', "Porcs, prix au comptant de l'Alberta, indice 100, par kg de carcasse.", "Suini, prezzo per contanti dell'Alberta, indice 100, per kg di carcassa."),
 'Guisante verde n.º 2 o mejor, oferta al contado (Alberta).': ('Green peas No. 2 or better, cash bid (Alberta).', "Pois verts n° 2 ou mieux, offre au comptant (Alberta).", "Piselli verdi n. 2 o superiore, offerta per contanti (Alberta)."),
 'Avena forrajera, oferta de elevador (Alberta centro, entregado).': ('Feed oats, elevator bid (central Alberta, delivered).', "Avoine fourragère, offre des silos (centre de l'Alberta, rendu).", "Avena da foraggio, offerta dei silos (Alberta centrale, reso)."),
 'Trigo forrajero, oferta de elevador (Alberta centro, entregado).': ('Feed wheat, elevator bid (central Alberta, delivered).', "Blé fourrager, offre des silos (centre de l'Alberta, rendu).", "Frumento da foraggio, offerta dei silos (Alberta centrale, reso)."),
 'Lenteja Laird n.º 1, oferta al contado (Alberta).': ('Laird lentils No. 1, cash bid (Alberta).', "Lentille Laird n° 1, offre au comptant (Alberta).", "Lenticchia Laird n. 1, offerta per contanti (Alberta)."),
 'Novillos, ventas directas de Alberta, precio medio en vivo.': ('Steers, Alberta direct sales, average live price.', "Bouvillons, ventes directes de l'Alberta, prix moyen sur pied.", "Manzi, vendite dirette dell'Alberta, prezzo medio vivo."),
 'Canola, oferta de elevador (Alberta centro, entregado).': ('Canola, elevator bid (central Alberta, delivered).', "Canola, offre des silos (centre de l'Alberta, rendu).", "Canola, offerta dei silos (Alberta centrale, reso)."),
 'Trigo CWRS n.º 1/2, oferta media de elevador (Alberta).': ('CWRS wheat No. 1/2, average elevator bid (Alberta).', "Blé CWRS n° 1/2, offre moyenne des silos (Alberta).", "Frumento CWRS n. 1/2, offerta media dei silos (Alberta)."),
}

def translate_sentence(s, lang):
    i = LANGS.index(lang)
    if s in S: return S[s][i]
    r = _statcan(s, lang)
    if r: return r
    if s.startswith(_AB) and s[len(_AB):] in _ABP: return _AB + _ABP[s[len(_AB):]][i]
    r = translate_more(s, i)
    if r is not None: return r
    from api_notes_i18n_idx import translate_idx
    return translate_idx(s, i)

def translate_note(es):
    """-> ({'en':..,'fr':..,'it':..}, [frases que faltan]). Si falta alguna frase, no se devuelve traduccion alguna de esa nota."""
    sents = split_sentences(es); out, missing = {}, []
    for lang in LANGS:
        parts = [translate_sentence(s, lang) for s in sents]
        if all(p is not None for p in parts): out[lang] = ' '.join(parts)
        else: missing += [s for s, p in zip(sents, parts) if p is None]
    if missing: return {}, sorted(set(missing))
    return out, []
