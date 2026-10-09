#!/usr/bin/env python3
"""PAC Alemania: importes por unidad de los pagos directos y de las Öko-Regelungen -> data/cap/de/amounts.json
Fuentes oficiales (obras oficiales: § 5 Abs. 1 UrhG), transcritas a mano de los textos publicados porque ni gesetze-im-internet.de ni el Bundesanzeiger
son legibles desde los servidores de GitHub (el primero no responde; el segundo exige sesion). Por eso NO hay workflow: este script solo valida y escribe.
 - Importes REALES (tatsaechliche Einheitsbetraege): Bekanntmachung del ministerio federal en el Bundesanzeiger, una por campana
     2023: BAnz AT 08.12.2023 B5 (8-dic-2023)   2024: BAnz AT 29.11.2024 B3 (21-nov-2024)   2025: BAnz AT 01.12.2025 B6 (20-nov-2025)
 - Importes PLANIFICADOS (geplante Einheitsbetraege) de las Öko-Regelungen y de la ayuda asociada, 2023-2026: GAPDZV Anlagen 4, 6 y 7 (gesetze-im-internet.de)
 - Asignaciones indicativas de las Öko-Regelungen en euros, 2023-2026: GAPDZV Anlage 3
 - Condiciones de cada Öko-Regelung: GAPDZV Anlage 5 (resumen de Dehesa Index en 4 idiomas; el texto oficial manda)
Los importes planificados de la prima basica, la redistributiva y jovenes NO estan en la ley (los calcula el ministerio y los publica en el Bundesanzeiger): no se ponen.
El importe real de 2026 se publica en noviembre-diciembre de 2026: hasta entonces 2026 solo tiene lo planificado, y el contrato avisa si falta tras el 15-dic-2026.
Control de transcripcion: dentro de cada campana, importe real / importe planificado es la misma razon para todas las Öko-Regelungen (1,30 en 2023; 1,0852 en 2024; 1,00 en 2025).
Uso: python3 scripts/build-cap-de.py [--check]"""
import json, sys, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'cap' / 'de' / 'amounts.json'
YEARS = [2023, 2024, 2025, 2026]
DOCS = [
    {'id': 'BAnz-2023', 'year': 2023, 'kind': 'ACTUAL', 'ref': 'BAnz AT 08.12.2023 B5', 'date': '2023-12-08', 'title': 'Bekanntmachung der tatsächlichen Einheitsbeträge für die im Rahmen der Gemeinsamen Agrarpolitik finanzierten Direktzahlungen für das Antragsjahr 2023', 'issuer': 'Bundesministerium für Ernährung und Landwirtschaft', 'url': 'https://www.bundesanzeiger.de/'},
    {'id': 'BAnz-2024', 'year': 2024, 'kind': 'ACTUAL', 'ref': 'BAnz AT 29.11.2024 B3', 'date': '2024-11-21', 'title': 'Bekanntmachung der tatsächlichen Einheitsbeträge für die im Rahmen der Gemeinsamen Agrarpolitik finanzierten Direktzahlungen für das Antragsjahr 2024', 'issuer': 'Bundesministerium für Ernährung und Landwirtschaft', 'url': 'https://www.bundesanzeiger.de/'},
    {'id': 'BAnz-2025', 'year': 2025, 'kind': 'ACTUAL', 'ref': 'BAnz AT 01.12.2025 B6', 'date': '2025-11-20', 'title': 'Bekanntmachung der tatsächlichen Einheitsbeträge für die im Rahmen der Gemeinsamen Agrarpolitik finanzierten Direktzahlungen für das Antragsjahr 2025', 'issuer': 'Bundesministerium für Landwirtschaft, Ernährung und Heimat', 'url': 'https://www.bundesanzeiger.de/'},
    {'id': 'GAPDZV-A3', 'year': None, 'kind': 'ALLOCATION', 'ref': 'GAPDZV Anlage 3 (zu § 15 Absatz 2)', 'date': None, 'title': 'Indikative Mittelzuweisungen in Euro für die Öko-Regelungen', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_3.html'},
    {'id': 'GAPDZV-A4', 'year': None, 'kind': 'PLANNED', 'ref': 'GAPDZV Anlage 4 (zu § 16 Absatz 1)', 'date': None, 'title': 'Geplante Einheitsbeträge je Hektar für die Öko-Regelungen', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_4.html'},
    {'id': 'GAPDZV-A5', 'year': None, 'kind': 'CONDITIONS', 'ref': 'GAPDZV Anlage 5 (zu § 17 Absatz 1)', 'date': None, 'title': 'Verpflichtungen und begünstigungsfähige Fläche der Öko-Regelungen', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_5.html'},
    {'id': 'GAPDZV-A6', 'year': None, 'kind': 'PLANNED', 'ref': 'GAPDZV Anlage 6 (zu § 18 Absatz 1)', 'date': None, 'title': 'Geplante Einheitsbeträge für die Zahlung für Mutterschafe und -ziegen', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_6.html'},
    {'id': 'GAPDZV-A7', 'year': None, 'kind': 'PLANNED', 'ref': 'GAPDZV Anlage 7 (zu § 20 Absatz 1)', 'date': None, 'title': 'Geplante Einheitsbeträge für die Zahlung für Mutterkühe', 'issuer': 'Bundesrepublik Deutschland', 'url': 'https://www.gesetze-im-internet.de/gapdzv/anlage_7.html'},
]
# (id, grupo, codigo, etiqueta alemana oficial, unidad, [real 2023, 2024, 2025], [planificado 2023..2026] o None, documento del planificado)
A = lambda *v: dict(zip((2023, 2024, 2025), v))
P = lambda *v: dict(zip(YEARS, v))
ITEMS = [
    ('basic', 'direct', 'GAPDZG § 4', 'Einkommensgrundstützung (Basisprämie)', 'EUR/ha', A(170.93, 157.63, 152.44), None, None),
    ('redistributive-1', 'direct', 'GAPDZG § 8', 'Umverteilungseinkommensstützung, Gruppe 1', 'EUR/ha', A(76.28, 72.36, 68.05), None, None),
    ('redistributive-2', 'direct', 'GAPDZG § 8', 'Umverteilungseinkommensstützung, Gruppe 2', 'EUR/ha', A(45.76, 43.41, 40.83), None, None),
    ('young', 'direct', 'GAPDZG § 13', 'Junglandwirte-Einkommensstützung', 'EUR/ha', A(141.75, 126.58, 120.64), None, None),
    ('eco-1a-1', 'eco', 'ÖR 1a, Stufe 1', 'Nichtproduktive Flächen auf Ackerland (bis 1 % des Ackerlands)', 'EUR/ha', A(1690.00, 1410.83, 1300.00), P(1300, 1300, 1300, 1300), 'GAPDZV-A4'),
    ('eco-1a-2', 'eco', 'ÖR 1a, Stufe 2', 'Nichtproduktive Flächen auf Ackerland (über 1 % bis 2 %)', 'EUR/ha', A(650.00, 542.62, 500.00), P(500, 500, 500, 500), 'GAPDZV-A4'),
    ('eco-1a-3', 'eco', 'ÖR 1a, Stufe 3', 'Nichtproduktive Flächen auf Ackerland (über 2 %)', 'EUR/ha', A(390.00, 325.57, 300.00), P(300, 300, 300, 300), 'GAPDZV-A4'),
    ('eco-1b', 'eco', 'ÖR 1b', 'Blühstreifen oder -flächen auf Ackerland', 'EUR/ha', A(195.00, 217.05, 200.00), P(150, 200, 200, 200), 'GAPDZV-A4'),
    ('eco-1c', 'eco', 'ÖR 1c', 'Blühstreifen oder -flächen in Dauerkulturen', 'EUR/ha', A(195.00, 217.05, 200.00), P(150, 200, 200, 200), 'GAPDZV-A4'),
    ('eco-1d-1', 'eco', 'ÖR 1d, Stufe 1', 'Altgrasstreifen oder -flächen in Dauergrünland (bis 1 %)', 'EUR/ha', A(1170.00, 976.72, 900.00), P(900, 900, 900, 1000), 'GAPDZV-A4'),
    ('eco-1d-2', 'eco', 'ÖR 1d, Stufe 2', 'Altgrasstreifen oder -flächen in Dauergrünland (über 1 % bis 3 %)', 'EUR/ha', A(520.00, 434.10, 400.00), P(400, 400, 400, 450), 'GAPDZV-A4'),
    ('eco-1d-3', 'eco', 'ÖR 1d, Stufe 3', 'Altgrasstreifen oder -flächen in Dauergrünland (über 3 %)', 'EUR/ha', A(260.00, 217.05, 200.00), P(200, 200, 200, 200), 'GAPDZV-A4'),
    ('eco-2', 'eco', 'ÖR 2', 'Vielfältige Kulturen im Ackerbau (mindestens fünf Hauptfruchtarten, Leguminosen mindestens 10 %)', 'EUR/ha', A(58.50, 65.11, 60.00), P(45, 60, 60, 60), 'GAPDZV-A4'),
    ('eco-3', 'eco', 'ÖR 3', 'Beibehaltung einer agroforstlichen Bewirtschaftungsweise', 'EUR/ha', A(78.00, 217.05, 200.00), P(60, 200, 200, 600), 'GAPDZV-A4'),
    ('eco-4', 'eco', 'ÖR 4', 'Extensivierung des gesamten Dauergrünlands des Betriebs', 'EUR/ha', A(149.50, 108.52, 100.00), P(115, 100, 100, 100), 'GAPDZV-A4'),
    ('eco-5', 'eco', 'ÖR 5', 'Ergebnisorientierte extensive Bewirtschaftung von Dauergrünland (mindestens vier Kennarten)', 'EUR/ha', A(312.00, 260.46, 225.00), P(240, 240, 225, 210), 'GAPDZV-A4'),
    ('eco-6-1', 'eco', 'ÖR 6, Stufe 1', 'Verzicht auf chemisch-synthetische Pflanzenschutzmittel, Stufe 1 (Kulturen nach Anlage 5 Nr. 6.2 und 6.4)', 'EUR/ha', A(169.00, 162.78, 150.00), P(130, 150, 150, 150), 'GAPDZV-A4'),
    ('eco-6-2', 'eco', 'ÖR 6, Stufe 2', 'Verzicht auf chemisch-synthetische Pflanzenschutzmittel, Stufe 2 (Gras, Grünfutter und Ackerfutter, Nr. 6.3)', 'EUR/ha', A(65.00, 54.26, 50.00), P(50, 50, 50, 50), 'GAPDZV-A4'),
    ('eco-7', 'eco', 'ÖR 7', 'Landbewirtschaftungsmethoden in Natura-2000-Gebieten', 'EUR/ha', A(52.00, 43.41, 40.00), P(40, 40, 40, 40), 'GAPDZV-A4'),
    ('ewes-goats', 'coupled', 'GAPDZG § 22', 'Zahlung für Mutterschafe und -ziegen', 'EUR/head', A(38.31, 37.88, 36.14), P(34.83, 34.44, 39.00, 37.89), 'GAPDZV-A6'),
    ('suckler-cows', 'coupled', 'GAPDZG § 26', 'Zahlung für Mutterkühe', 'EUR/head', A(85.72, 84.76, 89.37), P(77.93, 77.06, 87.72, 85.22), 'GAPDZV-A7'),
]
# GAPDZV Anlage 3: indikative Mittelzuweisung je Öko-Regelung (EUR), Antragsjahre 2023-2026
ALLOC = {
    'ÖR 1': P(326273710, 336005670, 330500464, 268268869), 'ÖR 2': P(120315992, 161510657, 164333859, 155822273), 'ÖR 3': P(1500000, 1500000, 1900000, 2300000),
    'ÖR 4': P(227479352, 197808132, 197808132, 158246480), 'ÖR 5': P(153745143, 153745143, 144136071, 267432276), 'ÖR 6': P(135754299, 103192794, 98124721, 56468100), 'ÖR 7': P(52480464, 52480464, 52480464, 52480464),
}
# (clave, ref Anlage 5, es, en, fr, it) -- cada punto es una frase; se separan con " | "
COND = [
 ('1a', 'Nr. 1.1',
  'Tierra de cultivo subvencionable en barbecho por encima del porcentaje obligatorio de condicionalidad, hasta el 8 % de la tierra de cultivo de la explotación | Cada superficie, al menos 0,1 ha | Barbecho todo el año: autovegetación o siembra con una mezcla de al menos cinco especies herbáceas dicotiledóneas | Sin abonos (incluido el estiércol) ni fitosanitarios | Excepciones a partir del 1 de septiembre (preparar siembra, pastoreo de ovejas y cabras) y siembra de cebada de invierno o colza de invierno desde el 15 de agosto',
  'Eligible arable land left fallow beyond the mandatory conditionality share, up to 8 % of the holding’s arable land | Each plot at least 0.1 ha | Fallow all year: natural regrowth or sowing a mix of at least five herbaceous dicotyledonous species | No fertilisers (including manure) or plant protection products | Exceptions from 1 September (preparing a sowing, grazing by sheep and goats) and sowing winter barley or winter rape from 15 August',
  'Terres arables éligibles en jachère au-delà de la part obligatoire de la conditionnalité, jusqu’à 8 % des terres arables de l’exploitation | Chaque parcelle d’au moins 0,1 ha | Jachère toute l’année : végétation spontanée ou semis d’un mélange d’au moins cinq espèces herbacées dicotylédones | Ni engrais (y compris effluents d’élevage) ni produits phytosanitaires | Exceptions à partir du 1er septembre (préparer un semis, pâturage d’ovins et de caprins) et semis d’orge d’hiver ou de colza d’hiver dès le 15 août',
  'Seminativi ammissibili lasciati a riposo oltre la quota obbligatoria della condizionalità, fino all’8 % dei seminativi dell’azienda | Ogni superficie di almeno 0,1 ha | Riposo tutto l’anno: vegetazione spontanea o semina di una miscela di almeno cinque specie erbacee dicotiledoni | Niente concimi (compreso il letame) né prodotti fitosanitari | Eccezioni dal 1° settembre (preparare una semina, pascolo di ovini e caprini) e semina di orzo o colza invernali dal 15 agosto'),
 ('1b', 'Nr. 1.2',
  'Franjas o superficies de flores sobre las superficies de barbecho de la ÖR 1a, de hasta 3 ha cada una y al menos 0,1 ha | Si son franjas: al menos 5 m de ancho en la mayor parte de su longitud | Siembra antes del 15 de mayo con una mezcla del anexo 1: al menos 10 especies del grupo A, o al menos 5 del grupo A y 5 del grupo B | Con la mezcla A+B, se puede volver a solicitar al año siguiente sin resembrar | Sin abonos ni fitosanitarios',
  'Flower strips or areas on the fallow land of ÖR 1a, up to 3 ha each and at least 0.1 ha | If strips: at least 5 m wide over most of their length | Sown by 15 May with a mix from annex 1: at least 10 species from group A, or at least 5 from group A and 5 from group B | With the A+B mix, the area can be claimed again the next year without resowing | No fertilisers or plant protection products',
  'Bandes ou surfaces fleuries sur les jachères de l’ÖR 1a, de 3 ha maximum chacune et d’au moins 0,1 ha | En bande : au moins 5 m de large sur l’essentiel de la longueur | Semis avant le 15 mai avec un mélange de l’annexe 1 : au moins 10 espèces du groupe A, ou au moins 5 du groupe A et 5 du groupe B | Avec le mélange A+B, la surface peut être redemandée l’année suivante sans nouveau semis | Ni engrais ni produits phytosanitaires',
  'Strisce o superfici fiorite sui terreni a riposo dell’ÖR 1a, fino a 3 ha ciascuna e di almeno 0,1 ha | Se strisce: larghezza minima di 5 m per la maggior parte della lunghezza | Semina entro il 15 maggio con una miscela dell’allegato 1: almeno 10 specie del gruppo A, oppure almeno 5 del gruppo A e 5 del gruppo B | Con la miscela A+B si può richiedere di nuovo l’anno dopo senza risemina | Niente concimi né prodotti fitosanitari'),
 ('1c', 'Nr. 1.3',
  'Franjas o superficies de flores en cultivos permanentes subvencionables | Mismas condiciones que la ÖR 1b (tamaño, siembra, mezcla del anexo 1, sin abonos ni fitosanitarios)',
  'Flower strips or areas in eligible permanent crops | Same conditions as ÖR 1b (size, sowing, annex 1 mix, no fertilisers or plant protection products)',
  'Bandes ou surfaces fleuries dans des cultures permanentes éligibles | Mêmes conditions que l’ÖR 1b (taille, semis, mélange de l’annexe 1, ni engrais ni produits phytosanitaires)',
  'Strisce o superfici fiorite in colture permanenti ammissibili | Stesse condizioni dell’ÖR 1b (dimensione, semina, miscela dell’allegato 1, niente concimi né prodotti fitosanitari)'),
 ('1d', 'Nr. 1.4',
  'Franjas o superficies de hierba sin segar en pastizal permanente: al menos el 1 % y como máximo el 6 % del pastizal permanente subvencionable de la explotación (hasta 1 ha aunque supere el 6 %) | Como máximo el 20 % de cada parcela de pastizal y al menos 0,1 ha | Ni pastoreo ni siega antes del 1 de septiembre; alguna de las dos al menos cada dos años, no antes del 1 de septiembre | Prohibido triturar y esparcir el crecimiento durante todo el año',
  'Uncut-grass strips or areas on permanent grassland: at least 1 % and at most 6 % of the holding’s eligible permanent grassland (up to 1 ha even above 6 %) | At most 20 % of each grassland plot and at least 0.1 ha | No grazing or mowing before 1 September; one of them at least every second year, not before 1 September | Shredding and spreading the growth is not allowed at any time of year',
  'Bandes ou surfaces d’herbe non fauchée sur prairie permanente : au moins 1 % et au plus 6 % de la prairie permanente éligible de l’exploitation (jusqu’à 1 ha même au-delà de 6 %) | Au plus 20 % de chaque parcelle de prairie et au moins 0,1 ha | Ni pâturage ni fauche avant le 1er septembre ; l’un des deux au moins tous les deux ans, pas avant le 1er septembre | Broyage et épandage de la repousse interdits toute l’année',
  'Strisce o superfici di erba non sfalciata su prato permanente: almeno l’1 % e al massimo il 6 % del prato permanente ammissibile dell’azienda (fino a 1 ha anche oltre il 6 %) | Al massimo il 20 % di ogni parcella a prato e almeno 0,1 ha | Né pascolo né sfalcio prima del 1° settembre; almeno uno dei due ogni due anni, non prima del 1° settembre | Vietati trinciatura e spargimento della ricrescita in qualsiasi periodo dell’anno'),
 ('2', 'Nr. 2',
  'Al menos cinco cultivos principales distintos en la tierra de cultivo (sin contar el barbecho) | Cada cultivo principal, entre el 10 % y el 30 % de esa superficie | Al menos un 10 % de leguminosas (incluidas mezclas donde predominan) | Cereales, como máximo el 66 % | Alternativa: al menos el 40 % de la superficie en bancales con al menos cinco hortalizas, hierbas aromáticas, plantas medicinales, especias u ornamentales',
  'At least five different main crops on the arable land (fallow not counted) | Each main crop between 10 % and 30 % of that area | At least 10 % legumes (including mixtures where they predominate) | Cereals at most 66 % | Alternative: at least 40 % of the area in beds with at least five vegetables, culinary herbs, medicinal, spice or ornamental plants',
  'Au moins cinq cultures principales différentes sur les terres arables (jachère exclue) | Chaque culture principale entre 10 % et 30 % de cette surface | Au moins 10 % de légumineuses (y compris les mélanges où elles dominent) | Céréales : 66 % au plus | Alternative : au moins 40 % de la surface en planches avec au moins cinq légumes, aromates, plantes médicinales, épices ou ornementales',
  'Almeno cinque colture principali diverse sui seminativi (maggese escluso) | Ogni coltura principale tra il 10 % e il 30 % di quella superficie | Almeno il 10 % di leguminose (comprese le miscele in cui prevalgono) | Cereali al massimo il 66 % | Alternativa: almeno il 40 % della superficie in aiuole con almeno cinque ortaggi, aromatiche, piante medicinali, spezie o ornamentali'),
 ('3', 'Nr. 3',
  'Mantener un sistema agroforestal sobre tierra de cultivo o pastizal permanente; es subvencionable la superficie de las franjas leñosas | Franjas leñosas entre el 2 % y el 40 % de la parcela, con al menos dos franjas y casi siempre pobladas de árboles o arbustos | Ancho de cada franja de 25 m como máximo en la mayor parte de su longitud | Distancia máxima de 100 m entre franjas y hasta el borde; mínima de 20 m entre franjas y de 20 m hasta el bosque o elementos del paisaje | Cosecha de madera solo en enero, febrero y diciembre',
  'Keep an agroforestry system on arable land or permanent grassland; the area of the woody strips is eligible | Woody strips between 2 % and 40 % of the plot, at least two strips, mostly continuously planted with trees or shrubs | Each strip at most 25 m wide over most of its length | At most 100 m between strips and to the plot edge; at least 20 m between strips and 20 m from woodland or landscape features | Timber harvesting only in January, February and December',
  'Maintenir un système agroforestier sur terres arables ou prairie permanente ; la surface des bandes boisées est éligible | Bandes boisées entre 2 % et 40 % de la parcelle, au moins deux bandes, à peu près continûment plantées d’arbres ou d’arbustes | Largeur de chaque bande de 25 m au plus sur l’essentiel de sa longueur | Au plus 100 m entre bandes et jusqu’au bord ; au moins 20 m entre bandes et 20 m de la forêt ou des éléments du paysage | Récolte de bois seulement en janvier, février et décembre',
  'Mantenere un sistema agroforestale su seminativi o prato permanente; è ammissibile la superficie delle strisce legnose | Strisce legnose tra il 2 % e il 40 % della parcella, almeno due strisce, quasi continuamente piantate ad alberi o arbusti | Larghezza di ogni striscia al massimo 25 m per la maggior parte della lunghezza | Al massimo 100 m tra strisce e fino al bordo; almeno 20 m tra le strisce e 20 m dal bosco o dagli elementi del paesaggio | Raccolta del legname solo a gennaio, febbraio e dicembre'),
 ('4', 'Nr. 4',
  'Todo el pastizal permanente subvencionable de la explotación | Carga media de al menos 0,3 y como máximo 1,4 UGM de herbívoros (RGV) por ha de pastizal permanente | Abonado, incluido el estiércol, solo hasta el equivalente a 1,4 RGV por ha | Sin fitosanitarios (la autoridad del Land puede conceder excepciones puntuales) | Sin arar el pastizal en el año de solicitud',
  'All of the holding’s eligible permanent grassland | Average stocking of at least 0.3 and at most 1.4 roughage-consuming livestock units (RGV) per ha of permanent grassland | Fertilisers, including manure, only up to the equivalent of 1.4 RGV per ha | No plant protection products (the Land authority may grant case-by-case exceptions) | No ploughing of the grassland in the application year',
  'Toute la prairie permanente éligible de l’exploitation | Chargement moyen d’au moins 0,3 et d’au plus 1,4 UGB de ruminants et équidés (RGV) par ha de prairie permanente | Fertilisation, effluents compris, seulement jusqu’à l’équivalent de 1,4 RGV par ha | Aucun produit phytosanitaire (l’autorité du Land peut accorder des dérogations au cas par cas) | Pas de labour de la prairie l’année de la demande',
  'Tutto il prato permanente ammissibile dell’azienda | Carico medio di almeno 0,3 e al massimo 1,4 UBA di erbivori (RGV) per ha di prato permanente | Concimazione, letame compreso, solo fino all’equivalente di 1,4 RGV per ha | Nessun prodotto fitosanitario (l’autorità del Land può concedere deroghe caso per caso) | Nessuna aratura del prato nell’anno della domanda'),
 ('5', 'Nr. 5',
  'Pastizal permanente subvencionable donde se demuestra la presencia de al menos cuatro especies de la lista de especies indicadoras (Kennarten) del Land, con el método que éste fije',
  'Eligible permanent grassland where the presence of at least four species from the Land’s list of indicator species (Kennarten) is shown, using the method the Land sets',
  'Prairie permanente éligible où la présence d’au moins quatre espèces de la liste d’espèces indicatrices (Kennarten) du Land est démontrée, selon la méthode fixée par le Land',
  'Prato permanente ammissibile in cui è dimostrata la presenza di almeno quattro specie della lista di specie indicatrici (Kennarten) del Land, con il metodo fissato dal Land'),
 ('6', 'Nr. 6',
  'Sin fitosanitarios químicos de síntesis en las parcelas de tierra de cultivo y cultivos permanentes que designe el solicitante | Cereales de verano (incluido el maíz), leguminosas (salvo forraje), oleaginosas de verano, cultivos de escarda (Hackfrüchte) y hortalizas de campo: del 1 de enero hasta la cosecha y como mínimo hasta el 31 de agosto | Hierba y forrajes y leguminosas forrajeras: del 1 de enero al 15 de noviembre (con laboreo tras la última cosecha, termina entonces, no antes del 31 de agosto) | Cultivos permanentes: del 1 de enero al 15 de noviembre | Se permiten los de bajo riesgo y los autorizados en agricultura ecológica. Escalón 1: cultivos de las partes 6.2 y 6.4; escalón 2: los de la parte 6.3',
  'No chemical-synthetic plant protection products on the arable and permanent-crop plots the applicant designates | Summer cereals (including maize), legumes (except forage), summer oilseeds, hoed crops (Hackfrüchte) and field vegetables: from 1 January to harvest and at least to 31 August | Grass, forage crops and forage legumes: 1 January to 15 November (with tillage after the last harvest, it ends then, not before 31 August) | Permanent crops: 1 January to 15 November | Low-risk products and those approved for organic farming are allowed. Tier 1: crops under parts 6.2 and 6.4; tier 2: those under part 6.3',
  'Aucun produit phytosanitaire chimique de synthèse sur les parcelles de terres arables et de cultures permanentes désignées par le demandeur | Céréales d’été (maïs compris), légumineuses (hors fourrage), oléagineux d’été, plantes sarclées (Hackfrüchte) et légumes de plein champ : du 1er janvier à la récolte et au moins jusqu’au 31 août | Herbe, fourrages et légumineuses fourragères : du 1er janvier au 15 novembre (avec travail du sol après la dernière récolte, il s’achève alors, pas avant le 31 août) | Cultures permanentes : du 1er janvier au 15 novembre | Les produits à faible risque et ceux autorisés en agriculture biologique sont permis. Palier 1 : cultures des points 6.2 et 6.4 ; palier 2 : celles du point 6.3',
  'Nessun prodotto fitosanitario chimico di sintesi sulle parcelle di seminativi e colture permanenti indicate dal richiedente | Cereali estivi (mais compreso), leguminose (esclusi i foraggi), oleaginose estive, colture sarchiate (Hackfrüchte) e ortaggi in pieno campo: dal 1° gennaio alla raccolta e almeno fino al 31 agosto | Erba, foraggere e leguminose da foraggio: dal 1° gennaio al 15 novembre (con lavorazione dopo l’ultimo raccolto, termina allora, non prima del 31 agosto) | Colture permanenti: dal 1° gennaio al 15 novembre | Sono ammessi i prodotti a basso rischio e quelli autorizzati in agricoltura biologica. Scaglione 1: colture dei punti 6.2 e 6.4; scaglione 2: quelle del punto 6.3'),
 ('7', 'Nr. 7',
  'Superficies agrarias subvencionables dentro de zonas Natura 2000 (hábitats y zonas de protección de aves) | En el año de solicitud no se pueden hacer nuevos drenajes ni reparar los existentes | Tampoco rellenos, terraplenes ni excavaciones, salvo medidas autorizadas, ordenadas o ejecutadas por la autoridad de conservación de la naturaleza',
  'Eligible farmland inside Natura 2000 areas (habitat sites and bird protection areas) | In the application year no new drainage and no repair of existing drainage | No filling, banking or excavation either, except measures approved, ordered or carried out by the nature conservation authority',
  'Terres agricoles éligibles dans des zones Natura 2000 (habitats et zones de protection des oiseaux) | L’année de la demande, ni nouveau drainage ni remise en état du drainage existant | Ni remblais, ni exhaussements, ni excavations, sauf mesures autorisées, ordonnées ou exécutées par l’autorité de protection de la nature',
  'Superfici agricole ammissibili all’interno di zone Natura 2000 (siti di habitat e zone di protezione degli uccelli) | Nell’anno della domanda niente nuovi drenaggi né ripristino di quelli esistenti | Niente riempimenti, rilevati o scavi, salvo misure autorizzate, ordinate o eseguite dall’autorità per la tutela della natura'),
]

EXPECT_RATIO = {2023: 1.3, 2024: 1.0852, 2025: 1.0}
def build():
    errs = []
    for it in ITEMS:
        if it[1] != 'eco': continue
        for y, r in EXPECT_RATIO.items():
            ratio = it[5][y] / it[6][y]
            if abs(ratio - r) > 0.0006: errs.append('%s %d: razon real/planificado %.4f, se esperaba %.4f' % (it[0], y, ratio, r))
    if errs: raise SystemExit('Control de transcripcion fallido:\n  ' + '\n  '.join(errs))
    items = []
    for sid, grp, code, label, unit, act, plan, pdoc in ITEMS:
        items.append({'id': sid, 'group': grp, 'code': code, 'label': label, 'unit': unit,
                      'actual': {str(y): v for y, v in act.items()}, 'planned': ({str(y): v for y, v in plan.items()} if plan else None), 'plannedDoc': pdoc})
    return {'schemaVersion': 1, 'country': 'DE', 'kind': 'OFFICIAL_UNIT_AMOUNTS', 'years': YEARS, 'lastActualYear': 2025,
            'sources': [{'id': 'bundesanzeiger', 'name': 'Bundesanzeiger (amtlicher Teil) — Bekanntmachungen des BMEL/BMLEH', 'url': 'https://www.bundesanzeiger.de/'},
                        {'id': 'gesetze_im_internet', 'name': 'Gesetze im Internet (BMJ/BfJ) — GAPDZG und GAPDZV', 'url': 'https://www.gesetze-im-internet.de/gapdzv/'}],
            'documents': DOCS, 'items': items,
            'conditions': [{'code': 'ÖR ' + c[0], 'ref': 'GAPDZV Anlage 5 ' + c[1], 'text': {l: c[2 + i].split(' | ') for i, l in enumerate(('es', 'en', 'fr', 'it'))}} for c in COND],
            'ecoAllocations': {k: {str(y): v for y, v in d.items()} for k, d in ALLOC.items()},
            'notes': ['Importe reales: los fija cada año el ministerio en noviembre-diciembre; el de 2026 aún no se ha publicado.',
                      'Importes planificados de prima básica, redistributiva y jóvenes: no figuran en la ley (los calcula y publica el ministerio): no se muestran.',
                      'Condiciones de las Öko-Regelungen: resumen de Dehesa Index de la GAPDZV Anlage 5 (leída el 8-oct-2026 en gesetze-im-internet.de, versión no oficial del servicio); no sustituye al texto, y los Länder fijan listas y métodos propios (p. ej. especies indicadoras de la ÖR 5).',
                      'Transcritos de los textos oficiales; los importes reales de las Öko-Regelungen salen de multiplicar el planificado por un factor común de cada año (1,30 en 2023; 1,0852 en 2024; 1,00 en 2025).'],
            'verifiedAt': datetime.date.today().isoformat()}
if __name__ == '__main__':
    doc = build()
    if '--check' in sys.argv: print('ok', len(doc['items']), 'importes'); sys.exit(0)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'); print('escrito', OUT, len(doc['items']), 'importes')
