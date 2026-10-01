#!/usr/bin/env python3
"""data/instrument-identity.json — identidad visible de cada instrumento de precio (producto, forma, calidad, etapa de mercado, mercado/ubicacion).
Fichero CURADO: cada entrada se redacta a partir de lo que la propia fuente declara (campo `methodology` de la observacion, short_desc de NASS, titulo del indice) y
cita esa evidencia. Si la fuente NO declara un dato (p. ej. la etapa del precio de la canal en el portal agroalimentario de la UE) se escribe `unspecified`: no se
rellena con suposiciones. Este script es la fuente de verdad del fichero (se regenera con `python3 scripts/build-instrument-identity.py`); scripts/contract_tests.py
comprueba que TODO instrumento e indice de data/product-metadata.json tiene identidad.
Regla de comparacion (la aplican js/producto-terminal.js y js/comparador.js): dos instrumentos son *equivalentes* solo si coinciden producto+forma+calidad+etapa. Si la
forma difiere (grano frente a harina) NO se calcula diferencia; si solo difieren calidad/etapa/lugar, la diferencia se muestra como orientativa y enumerando lo que difiere."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def L(es, en, fr, it): return {'es': es, 'en': en, 'fr': fr, 'it': it}
STAGES = {
 'silo_exit': L('Salida de silo (carga en camión)', 'Ex-silo (loaded on truck)', 'Départ silo (chargé sur camion)', 'Franco silo (caricato su camion)'),
 'ex_works': L('Salida de fábrica', 'Ex-works', 'Départ usine', 'Franco fabbrica'),
 'fob': L('FOB', 'FOB', 'FOB', 'FOB'),
 'farm_gate': L('Precio en granja (pagado al productor)', 'Farm-gate (paid to the producer)', 'Prix à la ferme (payé au producteur)', 'Prezzo in azienda (pagato al produttore)'),
 'price_received': L('Precio percibido por el agricultor', 'Price received by farmers', 'Prix reçu par les agriculteurs', 'Prezzo ricevuto dagli agricoltori'),
 'selling_price': L('Precio de venta (nivel de la cadena no indicado)', 'Selling price (supply-chain level not stated)', 'Prix de vente (niveau de la filière non précisé)', 'Prezzo di vendita (livello della filiera non indicato)'),
 'retail_taxed': L('Consumidor, con impuestos', 'Consumer price, taxes included', 'Prix à la consommation, taxes comprises', 'Prezzo al consumo, tasse incluse'),
 'index': L('Índice de precios (base 2020 = 100)', 'Price index (2020 = 100)', 'Indice de prix (base 2020 = 100)', 'Indice dei prezzi (base 2020 = 100)'),
 'unspecified': L('Etapa no especificada por la fuente', 'Market stage not specified by the source', 'Étape non précisée par la source', 'Fase di mercato non specificata dalla fonte')}
FORMS = {k: v for k, v in {
 'grain': L('grano', 'grain', 'grain', 'granella'), 'meal': L('harina', 'meal', 'tourteau', 'farina'), 'carcass': L('canal', 'carcass', 'carcasse', 'carcassa'),
 'live': L('peso vivo', 'live weight', 'poids vif', 'peso vivo'), 'whole_bird': L('ave entera', 'whole bird', 'oiseau entier', 'animale intero'), 'milk': L('leche cruda', 'raw milk', 'lait cru', 'latte crudo'),
 'eggs': L('huevos en cáscara', 'eggs in shell', 'œufs en coquille', 'uova in guscio'), 'oil': L('aceite', 'oil', 'huile', 'olio'), 'sugar': L('azúcar', 'sugar', 'sucre', 'zucchero'),
 'fertilizer': L('fertilizante', 'fertiliser', 'engrais', 'fertilizzante'), 'fuel': L('combustible', 'fuel', 'carburant', 'carburante'), 'index': L('índice', 'index', 'indice', 'indice'),
 'livestock': L('ganado', 'livestock', 'bétail', 'bestiame')}.items()}
M = {'es': L('España', 'Spain', 'Espagne', 'Spagna'), 'ca': L('Canadá', 'Canada', 'Canada', 'Canada'), 'us': L('EE. UU. (media nacional)', 'United States (national average)', 'États-Unis (moyenne nationale)', 'Stati Uniti (media nazionale)'),
     'usx': L('EE. UU.', 'United States', 'États-Unis', 'Stati Uniti'), 'uk': L('Reino Unido', 'United Kingdom', 'Royaume-Uni', 'Regno Unito'), 'eu27': L('UE-27', 'EU-27', 'UE-27', 'UE-27'), 'eu': L('UE (agregado de la Comisión)', 'EU (Commission aggregate)', 'UE (agrégat de la Commission)', 'UE (aggregato della Commissione)'),
     'ee': L('Europa del Este', 'Eastern Europe', 'Europe de l’Est', 'Europa orientale'), 'eumk': L('Varios mercados de la UE', 'Several EU markets', 'Plusieurs marchés de l’UE', 'Diversi mercati UE'),
     'eucons': L('UE (media ponderada)', 'EU (weighted average)', 'UE (moyenne pondérée)', 'UE (media ponderata)')}
LOC = {k: L(*v) for k, v in {'zgz': ('Zaragoza', 'Zaragoza', 'Saragosse', 'Saragozza'), 'lleida': ('Lleida', 'Lleida', 'Lérida', 'Lleida'), 'iowa': ('Iowa', 'Iowa', 'Iowa', 'Iowa'),
       'sk': ('Saskatchewan', 'Saskatchewan', 'Saskatchewan', 'Saskatchewan'), 'on': ('Ontario', 'Ontario', 'Ontario', 'Ontario'), 'ab': ('Alberta', 'Alberta', 'Alberta', 'Alberta'), 'qc': ('Quebec', 'Quebec', 'Québec', 'Québec')}.items()}
# Concepto de producto (que mercancia es): dos instrumentos de CONCEPTO distinto (urea frente a fertilizante fosfatado agregado, harina frente a grano de soja) nunca se restan
CONCEPT = {'di_cereales_trigo_eu': 'wheat', 'di_trigo_us': 'wheat', 'di_cereales_trigo_ca': 'wheat', 'di_defra_wheat_output_index': 'wheat', 'di_eurostat_cereals_output_index': 'cereals',
 'di_cereales_maiz_eu': 'maize', 'di_maiz_us': 'maize', 'di_cereales_maiz_ca': 'maize', 'di_cereales_cebada_eu': 'barley', 'di_cebada_us': 'barley', 'di_cereales_cebada_ca': 'barley', 'di_defra_barley_output_index': 'barley',
 'di_cereales_avena_eu': 'oats', 'di_avena_us': 'oats', 'di_cereales_avena_ca': 'oats', 'di_cereales_arroz_eu': 'rice', 'di_arroz_us': 'rice',
 'di_pienso_harina_soja_eu': 'soy_meal', 'di_pienso_harina_soja_us': 'soy_meal', 'di_cereales_soja_grano_ca': 'soybeans', 'di_cereales_colza_eu': 'rapeseed', 'di_colza_us': 'rapeseed', 'di_cereales_colza_ca': 'rapeseed',
 'di_leche_eu': 'milk', 'di_leche_us': 'milk', 'di_lacteos_leche_ca': 'milk', 'di_lacteos_leche_uk': 'milk', 'di_defra_milk_output_index': 'milk', 'di_eurostat_milk_output_index': 'milk',
 'di_ganado_vaca_eu': 'cattle', 'di_vaca_us': 'cattle', 'di_ganado_vaca_ca': 'cattle', 'di_defra_cattle_output_index': 'cattle', 'di_porcino_cerdo_eu': 'pigs', 'di_cerdo_us': 'pigs', 'di_porcino_cerdo_ca': 'pigs', 'di_defra_pigs_output_index': 'pigs',
 'di_avicultura_huevos_eu': 'eggs', 'di_huevos_us': 'eggs', 'di_avicultura_huevos_ca': 'eggs', 'di_defra_eggs_output_index': 'eggs', 'di_avicultura_pollo_eu': 'chicken', 'di_pollo_us': 'chicken', 'di_avicultura_pollo_ca': 'chicken',
 'di_azucar_azucar_eu': 'sugar', 'di_fertilizantes_urea_eu': 'urea', 'di_fertilizantes_dap_eu': 'fert_p', 'di_fertilizantes_potasa_eu': 'fert_k', 'di_eurostat_fertiliser_input_index': 'fertilisers', 'di_defra_fertiliser_input_index': 'fertilisers',
 'di_diesel_eu': 'diesel', 'di_diesel_us': 'diesel', 'di_eurostat_energy_input_index': 'energy', 'di_defra_energy_input_index': 'energy', 'di_aceite_oliva_eu': 'olive_oil'}
def P(es, en, fr=None, it=None): return L(es, en, fr or en, it or en)
def inst(id, product, form, stage, market, grade=None, loc=None, kind='price', evidence=''):
    return id, {'kind': kind, 'concept': CONCEPT[id], 'product': product, 'form': form, 'grade': grade, 'stage': stage, 'market': market, 'location': loc, 'evidence': evidence}
NASS = 'USDA NASS Quick Stats, short_desc «… - PRICE RECEIVED» (precio medio nacional percibido por el agricultor), scripts/update-nass-us.mjs'
SC = 'Statistics Canada 32-10-0077-01: precio mensual pagado al productor en la provincia de referencia (observacion.methodology)'
EC = 'Comisión Europea, Agri-food Data Portal (observacion.methodology)'
DF = 'Defra Agricultural Price Index, base 2020=100 (observacion.methodology)'
EUI = 'Eurostat apri_pi_outq/apri_pi_inq, indice nominal de precios agrarios UE-27, base 2020=100 (observacion.methodology)'
def idx_def(id, prod, mk): return inst(id, prod, 'index', 'index', M[mk], kind='index', evidence=DF)
def idx_eu(id, prod): return inst(id, prod, 'index', 'index', M['eu27'], kind='index', evidence=EUI)
CER = P('Cereales', 'Cereals', 'Céréales', 'Cereali')
E = dict([
 inst('di_cereales_trigo_eu', P('Trigo blando panificable', 'Bread (milling) wheat', 'Blé tendre panifiable', 'Frumento tenero panificabile'), 'grain', 'silo_exit', M['es'], loc=LOC['zgz'], evidence=EC + ': mercado de Zaragoza, salida de silo tras almacenamiento en camion'),
 inst('di_trigo_us', P('Trigo', 'Wheat', 'Blé', 'Frumento'), 'grain', 'price_received', M['us'], evidence=NASS),
 inst('di_cereales_trigo_ca', P('Trigo (excepto duro)', 'Wheat (except durum)', 'Blé (sauf dur)', 'Frumento (escluso duro)'), 'grain', 'farm_gate', M['ca'], loc=LOC['sk'], evidence=SC),
 idx_def('di_defra_wheat_output_index', P('Trigo', 'Wheat', 'Blé', 'Frumento'), 'uk'), idx_eu('di_eurostat_cereals_output_index', CER),
 inst('di_cereales_maiz_eu', P('Maíz pienso', 'Feed maize', 'Maïs fourrager', 'Mais da foraggio'), 'grain', 'silo_exit', M['es'], loc=LOC['zgz'], evidence=EC + ': mercado de Zaragoza, salida de silo tras almacenamiento en camion'),
 inst('di_maiz_us', P('Maíz grano', 'Corn for grain', 'Maïs grain', 'Mais da granella'), 'grain', 'price_received', M['us'], evidence=NASS),
 inst('di_cereales_maiz_ca', P('Maíz grano', 'Corn for grain', 'Maïs grain', 'Mais da granella'), 'grain', 'farm_gate', M['ca'], loc=LOC['on'], evidence=SC),
 inst('di_cereales_cebada_eu', P('Cebada pienso', 'Feed barley', 'Orge fourragère', 'Orzo da foraggio'), 'grain', 'silo_exit', M['es'], loc=LOC['lleida'], evidence=EC + ': mercado de Lleida, salida de silo tras almacenamiento en camion'),
 inst('di_cebada_us', P('Cebada', 'Barley', 'Orge', 'Orzo'), 'grain', 'price_received', M['us'], evidence=NASS),
 inst('di_cereales_cebada_ca', P('Cebada', 'Barley', 'Orge', 'Orzo'), 'grain', 'farm_gate', M['ca'], loc=LOC['ab'], evidence=SC),
 idx_def('di_defra_barley_output_index', P('Cebada', 'Barley', 'Orge', 'Orzo'), 'uk'),
 inst('di_cereales_avena_eu', P('Avena pienso', 'Feed oats', 'Avoine fourragère', 'Avena da foraggio'), 'grain', 'unspecified', M['eu'], evidence=EC + ': agregado de la UE (media nacional de los Estados miembros que la publican); el portal no indica la etapa'),
 inst('di_avena_us', P('Avena', 'Oats', 'Avoine', 'Avena'), 'grain', 'price_received', M['us'], evidence=NASS),
 inst('di_cereales_avena_ca', P('Avena', 'Oats', 'Avoine', 'Avena'), 'grain', 'farm_gate', M['ca'], loc=LOC['sk'], evidence=SC),
 inst('di_cereales_arroz_eu', P('Arroz cáscara (paddy)', 'Paddy rice', 'Riz paddy', 'Riso risone'), 'grain', 'unspecified', M['es'], grade=L('Tipo japónica (no índica)', 'Japonica type (not indica)', 'Type japonica (pas indica)', 'Tipo japonica (non indica)'), evidence=EC + ': arroz cascara japonica en España; el portal no indica la etapa'),
 inst('di_arroz_us', P('Arroz', 'Rice', 'Riz', 'Riso'), 'grain', 'price_received', M['us'], evidence=NASS),
 inst('di_pienso_harina_soja_eu', P('Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia'), 'meal', 'ex_works', M['es'], grade=L('40–50 % de proteína', '40–50 % protein', '40–50 % de protéines', '40–50 % di proteine'), evidence=EC + ': harina de soja 40-50 % de proteina en España (media), salida de fabrica'),
 inst('di_pienso_harina_soja_us', P('Harina de soja', 'Soybean meal', 'Tourteau de soja', 'Farina di soia'), 'meal', 'fob', M['usx'], grade=L('46,5–48 % de proteína', '46.5–48 % protein', '46,5–48 % de protéines', '46,5–48 % di proteine'), loc=LOC['iowa'], evidence='USDA AMS MARS informe 3511: harina de soja 46,5-48 % de proteina, Iowa, FOB, cotizacion de venta (ask), USD/ton corta; mercado regional, no la media nacional'),
 inst('di_cereales_soja_grano_ca', P('Soja grano', 'Soybeans', 'Soja en grains', 'Soia in granella'), 'grain', 'farm_gate', M['ca'], loc=LOC['on'], evidence=SC),
 inst('di_cereales_colza_eu', P('Colza', 'Rapeseed', 'Colza', 'Colza'), 'grain', 'silo_exit', M['es'], grade=L('Media nacional', 'National average', 'Moyenne nationale', 'Media nazionale'), evidence=EC + ': colza en España (media nacional), salida de silo del agricultor'),
 inst('di_colza_us', P('Canola', 'Canola', 'Canola', 'Canola'), 'grain', 'price_received', M['us'], evidence=NASS),
 inst('di_cereales_colza_ca', P('Canola (incl. colza)', 'Canola (incl. rapeseed)', 'Canola (colza incluse)', 'Canola (colza inclusa)'), 'grain', 'farm_gate', M['ca'], loc=LOC['sk'], evidence=SC),
 inst('di_leche_eu', P('Leche cruda de vaca', 'Raw cow’s milk', 'Lait cru de vache', 'Latte crudo di vacca'), 'milk', 'farm_gate', M['es'], evidence=EC + ': Milk Market Observatory, leche cruda pagada al productor en España, EUR/100 kg'),
 inst('di_leche_us', P('Leche (vendida a plantas)', 'Milk (sold to plants)', 'Lait (vendu aux laiteries)', 'Latte (venduto agli stabilimenti)'), 'milk', 'price_received', M['us'], grade=L('Todo el volumen, no Clase III', 'All milk, not Class III', 'Tout le lait, pas Classe III', 'Tutto il latte, non Classe III'), evidence=NASS + ' (trustMethodology: all milk sold to plants, not Class III)'),
 inst('di_lacteos_leche_ca', P('Leche sin procesar de bovino', 'Unprocessed bovine milk', 'Lait bovin non transformé', 'Latte bovino non trasformato'), 'milk', 'farm_gate', M['ca'], loc=LOC['qc'], evidence=SC + '; kl convertido a 100 kg con densidad 1,03'),
 inst('di_lacteos_leche_uk', P('Leche', 'Milk', 'Lait', 'Latte'), 'milk', 'farm_gate', M['uk'], evidence='Defra, precio medio en granja, hoja Prices_Monthly (observacion.methodology); peniques/litro convertido con densidad 1,03'),
 idx_def('di_defra_milk_output_index', P('Leche', 'Milk', 'Lait', 'Latte'), 'uk'), idx_eu('di_eurostat_milk_output_index', P('Leche', 'Milk', 'Lait', 'Latte')),
 inst('di_ganado_vaca_eu', P('Macho joven', 'Young bull', 'Jeune bovin', 'Giovane toro'), 'carcass', 'unspecified', M['es'], grade=L('Categoría A, conformación R3', 'Category A, conformation R3', 'Catégorie A, conformation R3', 'Categoria A, conformazione R3'), evidence=EC + ': canal de macho joven categoria A R3, EUR/100 kg de canal; no es vaca de desecho; el portal no indica la etapa'),
 inst('di_vaca_us', P('Novillos y novillas', 'Steers and heifers', 'Bouvillons et génisses', 'Manzi e giovenche'), 'live', 'price_received', M['us'], grade=L('≥ 500 lb', '≥ 500 lb', '≥ 500 lb', '≥ 500 lb'), evidence=NASS + ' (CATTLE, STEERS & HEIFERS, GE 500 LBS, peso vivo)'),
 inst('di_ganado_vaca_ca', P('Novillos para sacrificio', 'Steers for slaughter', 'Bouvillons d’abattage', 'Manzi da macello'), 'live', 'farm_gate', M['ca'], loc=LOC['ab'], evidence=SC),
 idx_def('di_defra_cattle_output_index', P('Ganado vacuno y terneros', 'Cattle and calves', 'Bovins et veaux', 'Bovini e vitelli'), 'uk'),
 inst('di_porcino_cerdo_eu', P('Cerdo', 'Pig', 'Porc', 'Suino'), 'carcass', 'unspecified', M['es'], grade=L('Clase S (≥ 60 % magro)', 'Class S (≥ 60 % lean)', 'Classe S (≥ 60 % de maigre)', 'Classe S (≥ 60 % di magro)'), evidence=EC + ': canal de cerdo clasificada S, EUR/100 kg de canal; el portal no indica la etapa'),
 inst('di_cerdo_us', P('Cerdos', 'Hogs', 'Porcs', 'Suini'), 'live', 'price_received', M['us'], evidence=NASS + ' (HOGS, peso vivo)'),
 inst('di_porcino_cerdo_ca', P('Cerdos', 'Hogs', 'Porcs', 'Suini'), 'livestock', 'farm_gate', M['ca'], loc=LOC['on'], evidence=SC + '; la tabla no indica si es peso vivo o canal'),
 idx_def('di_defra_pigs_output_index', P('Cerdos', 'Pigs', 'Porcs', 'Suini'), 'uk'),
 inst('di_avicultura_huevos_eu', P('Huevos de gallinas en jaula', 'Eggs from caged hens', 'Œufs de poules en cage', 'Uova di galline in gabbia'), 'eggs', 'unspecified', M['es'], grade=L('Categoría «Cage»', '«Cage» category', 'Catégorie «Cage»', 'Categoria «Cage»'), evidence=EC + ': huevos de gallinas en jaula (Cage) en España, EUR/100 kg de huevos; el portal no indica la etapa'),
 inst('di_huevos_us', P('Huevos de mesa', 'Table eggs', 'Œufs de consommation', 'Uova da tavola'), 'eggs', 'price_received', M['us'], evidence=NASS + ' (trustMethodology: producer price, not retail), USD/docena'),
 inst('di_avicultura_huevos_ca', P('Huevos en cáscara', 'Eggs in shell', 'Œufs en coquille', 'Uova in guscio'), 'eggs', 'farm_gate', M['ca'], loc=LOC['on'], evidence=SC),
 idx_def('di_defra_eggs_output_index', P('Huevos', 'Eggs', 'Œufs', 'Uova'), 'uk'),
 inst('di_avicultura_pollo_eu', P('Pollo broiler entero', 'Whole broiler chicken', 'Poulet de chair entier', 'Pollo da carne intero'), 'whole_bird', 'selling_price', M['es'], grade=L('65 % de rendimiento', '65 % yield', 'Rendement 65 %', 'Resa 65 %'), evidence=EC + ': precio de venta semanal del pollo broiler entero (65 % de rendimiento) en España, EUR/100 kg dividido entre 100'),
 inst('di_pollo_us', P('Pollo broiler', 'Broilers', 'Poulets de chair', 'Polli da carne'), 'live', 'price_received', M['us'], evidence=NASS + ' (CHICKENS, BROILERS, peso vivo); no comparable con el precio UE de pollo entero'),
 inst('di_avicultura_pollo_ca', P('Pollo para carne', 'Chickens for meat', 'Poulets de chair', 'Polli da carne'), 'livestock', 'farm_gate', M['ca'], loc=LOC['on'], evidence=SC + ' (Chickens for meat); la tabla no indica la forma'),
 inst('di_azucar_azucar_eu', P('Azúcar', 'Sugar', 'Sucre', 'Zucchero'), 'sugar', 'unspecified', M['eu'], grade=L('Contratos mensuales', 'Monthly contracts', 'Contrats mensuels', 'Contratti mensili'), evidence=EC + ': precio mensual medio del azucar en la UE (contratos mensuales), EUR/t; la Comision no indica la etapa'),
 inst('di_fertilizantes_urea_eu', P('Urea', 'Urea', 'Urée', 'Urea'), 'fertilizer', 'unspecified', M['ee'], evidence='Banco Mundial, Commodity Price Data (Pink Sheet), serie «Urea, E. Europe» (scripts/update-worldbank-urea-eu.py); USD/t; el repositorio no documenta la etapa del Pink Sheet (no indica la etapa aqui)'),
 inst('di_fertilizantes_dap_eu', P('Fertilizantes fosfatados (P), agregado', 'Phosphate (P) fertilisers, aggregate', 'Engrais phosphatés (P), agrégat', 'Fertilizzanti fosfatici (P), aggregato'), 'fertilizer', 'unspecified', M['eumk'], evidence=EC + ': agregado de varios mercados UE; NO es DAP, la Comision no especifica el producto'),
 inst('di_fertilizantes_potasa_eu', P('Fertilizantes potásicos (K), agregado', 'Potash (K) fertilisers, aggregate', 'Engrais potassiques (K), agrégat', 'Fertilizzanti potassici (K), aggregato'), 'fertilizer', 'unspecified', M['eumk'], evidence=EC + ': agregado de varios mercados UE; NO es MOP, la Comision no especifica el producto'),
 idx_eu('di_eurostat_fertiliser_input_index', P('Fertilizantes y enmiendas (precios pagados)', 'Fertilisers and soil improvers (prices paid)', 'Engrais et amendements (prix payés)', 'Fertilizzanti e ammendanti (prezzi pagati)')),
 idx_def('di_defra_fertiliser_input_index', P('Fertilizantes y enmiendas (precios pagados)', 'Fertilisers and soil improvers (prices paid)', 'Engrais et amendements (prix payés)', 'Fertilizzanti e ammendanti (prezzi pagati)'), 'uk'),
 inst('di_diesel_eu', P('Gasóleo de automoción', 'Automotive gas oil', 'Gazole routier', 'Gasolio per autotrazione'), 'fuel', 'retail_taxed', M['eucons'], evidence='Boletin Semanal del Petroleo (CE): media UE ponderada, precio al consumidor con impuestos (observacion.methodology)'),
 inst('di_diesel_us', P('Gasóleo', 'Diesel', 'Gazole', 'Gasolio'), 'fuel', 'unspecified', M['us'], evidence='EIA, precio semanal en USD/galon (scripts/update-eia-diesel-us.mjs); el repositorio no documenta la etapa'),
 idx_eu('di_eurostat_energy_input_index', P('Energía y lubricantes (precios pagados)', 'Energy and lubricants (prices paid)', 'Énergie et lubrifiants (prix payés)', 'Energia e lubrificanti (prezzi pagati)')),
 idx_def('di_defra_energy_input_index', P('Energía y lubricantes (precios pagados)', 'Energy and lubricants (prices paid)', 'Énergie et lubrifiants (prix payés)', 'Energia e lubrificanti (prezzi pagati)'), 'uk'),
 inst('di_aceite_oliva_eu', P('Aceite de oliva virgen extra', 'Extra virgin olive oil', 'Huile d’olive vierge extra', 'Olio extravergine di oliva'), 'oil', 'unspecified', M['es'], grade=L('Acidez hasta 0,8 %', 'Acidity up to 0.8 %', 'Acidité jusqu’à 0,8 %', 'Acidità fino a 0,8 %'), evidence=EC + ': media nacional semanal en España, EUR/100 kg; el portal no indica la etapa'),
])
# Comparador: concepto UE comun a todos los paises de cada producto (el mercado es el pais de la serie)
CMP = {
 'trigo': dict(concept='wheat', product=P('Trigo blando panificable', 'Bread (milling) wheat', 'Blé tendre panifiable', 'Frumento tenero panificabile'), form='grain', grade=L('Media nacional', 'National average', 'Moyenne nationale', 'Media nazionale')),
 'maiz': dict(concept='maize', product=P('Maíz pienso', 'Feed maize', 'Maïs fourrager', 'Mais da foraggio'), form='grain', grade=L('Media nacional', 'National average', 'Moyenne nationale', 'Media nazionale')),
 'cebada': dict(concept='barley', product=P('Cebada pienso', 'Feed barley', 'Orge fourragère', 'Orzo da foraggio'), form='grain', grade=L('Media nacional', 'National average', 'Moyenne nationale', 'Media nazionale')),
 'avena': dict(concept='oats', product=P('Avena pienso', 'Feed oats', 'Avoine fourragère', 'Avena da foraggio'), form='grain', grade=L('Media nacional', 'National average', 'Moyenne nationale', 'Media nazionale')),
 'colza': dict(concept='rapeseed', product=P('Colza', 'Rapeseed', 'Colza', 'Colza'), form='grain', grade=None),
 'leche': dict(concept='milk', product=P('Leche cruda de vaca', 'Raw cow’s milk', 'Lait cru de vache', 'Latte crudo di vacca'), form='milk', grade=None)}
CMP_STAGE = {'trigo': 'unspecified', 'maiz': 'unspecified', 'cebada': 'unspecified', 'avena': 'unspecified', 'colza': 'unspecified', 'leche': 'farm_gate'}
for k, v in CMP.items(): v['stage'] = CMP_STAGE[k]; v['evidence'] = 'Agri-food Data Portal de la Comision, familia/serie de data/product-metadata.json (compare.eu); la serie por pais es la media del Estado miembro; ' + ('el portal no indica la etapa' if k != 'leche' else 'leche cruda pagada al productor')
doc = {'schemaVersion': 1, '_doc': 'Identidad visible de cada instrumento (ver scripts/build-instrument-identity.py). `unspecified` = la fuente no declara el dato; nunca se rellena. Dos instrumentos son equivalentes solo si coinciden producto, forma, calidad y etapa.',
       'stages': STAGES, 'forms': FORMS, 'instruments': E, 'comparator': CMP}
out = ROOT / 'data/instrument-identity.json'
out.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n')
print('instrumentos:', len(E), 'comparador:', len(CMP))
