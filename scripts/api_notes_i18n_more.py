# -*- coding: utf-8 -*-
"""Traducciones de notas de la API para las series de Alberta (insumos), Banco Mundial, DAERA, DESNZ, Defra, Statistics Canada (consumo),
USDA AMS/ERS y la Comision Europea (colza). Mismo contrato que api_notes_i18n.py: frase conocida -> (en, fr, it); frase desconocida -> None."""
import re

# ---- frases sueltas
G = {
 'Cambio de unidad hecho por Dehesa Index con aritmetica exacta (peniques a libras), sin estimar nada.': (
  'Unit conversion done by Dehesa Index with exact arithmetic (pence to pounds); nothing is estimated.',
  "Changement d'unité effectué par Dehesa Index en arithmétique exacte (pence en livres), sans rien estimer.",
  "Cambio di unità eseguito da Dehesa Index con aritmetica esatta (penny in sterline), senza stimare nulla."),
 'Cambio de unidad hecho por Dehesa Index con aritmetica exacta, sin estimar nada.': (
  'Unit conversion done by Dehesa Index with exact arithmetic; nothing is estimated.',
  "Changement d'unité effectué par Dehesa Index en arithmétique exacte, sans rien estimer.",
  "Cambio di unità eseguito da Dehesa Index con aritmetica esatta, senza stimare nulla."),
 'Es un precio fisico, no el futuro de Euronext (Matif).': (
  'It is a physical price, not the Euronext (Matif) future.',
  "C'est un prix physique, pas le contrat à terme d'Euronext (Matif).",
  "È un prezzo fisico, non il future di Euronext (Matif)."),
 'La API no publica fecha de publicacion: se registra el dia en que se recupero.': (
  'The source gives no publication date: the day the figure was retrieved is recorded.',
  "La source ne publie pas de date de publication : on enregistre le jour de la récupération.",
  "La fonte non pubblica la data di pubblicazione: si registra il giorno del recupero."),
 'No es el precio que cobra el agricultor.': (
  'It is not the price the farmer receives.',
  "Ce n'est pas le prix perçu par l'agriculteur.",
  "Non è il prezzo incassato dall'agricoltore."),
 'Serie diaria en dolares de EE. UU. por 100 libras (cwt); sin cambio de unidad.': (
  'Daily series in US dollars per 100 pounds (cwt); no unit conversion.',
  "Série quotidienne en dollars US par 100 livres (cwt) ; sans changement d'unité.",
  "Serie giornaliera in dollari USA per 100 libbre (cwt); nessun cambio di unità."),
 'Serie mensual en dolares canadienses.': (
  'Monthly series in Canadian dollars.', 'Série mensuelle en dollars canadiens.', 'Serie mensile in dollari canadesi.'),
 'Serie mensual en dolares de EE. UU.; sin cambio de unidad.': (
  'Monthly series in US dollars; no unit conversion.', "Série mensuelle en dollars US ; sans changement d'unité.", "Serie mensile in dollari USA; nessun cambio di unità."),
 'Serie mensual.': ('Monthly series.', 'Série mensuelle.', 'Serie mensile.'),
 'Serie semanal en dolares de EE. UU.; sin cambio de unidad.': (
  'Weekly series in US dollars; no unit conversion.', "Série hebdomadaire en dollars US ; sans changement d'unité.", "Serie settimanale in dollari USA; nessun cambio di unità."),
 'Serie semanal en libras esterlinas.': ('Weekly series in pounds sterling.', 'Série hebdomadaire en livres sterling.', 'Serie settimanale in sterline.'),
 'Serie trimestral (mes final del trimestre) en libras esterlinas.': (
  'Quarterly series (last month of the quarter) in pounds sterling.', 'Série trimestrielle (dernier mois du trimestre) en livres sterling.', 'Serie trimestrale (ultimo mese del trimestre) in sterline.'),
}

# ---- Comision Europea: colza
_EC = 'Comision Europea, Agri-food Data Portal: '
_ECP = ('European Commission, Agri-food Data Portal: ', 'Commission européenne, portail de données agroalimentaires (Agri-food Data Portal) : ', 'Commissione europea, portale dei dati agroalimentari (Agri-food Data Portal): ')
_ECT = {
 'precio semanal de la colza en Alemania, media nacional, salida de silo del agricultor, EUR/tonelada.': (
  'weekly price of rapeseed in Germany, national average, ex-silo farmer, EUR/tonne.',
  "prix hebdomadaire du colza en Allemagne, moyenne nationale, départ silo de l'agriculteur, EUR/tonne.",
  "prezzo settimanale della colza in Germania, media nazionale, franco silo dell'agricoltore, EUR/tonnellata."),
 'precio semanal de la colza en Francia, entrega a la industria en Rouen, EUR/tonelada.': (
  'weekly price of rapeseed in France, delivered to industry at Rouen, EUR/tonne.',
  "prix hebdomadaire du colza en France, livré à l'industrie à Rouen, EUR/tonne.",
  "prezzo settimanale della colza in Francia, consegnata all'industria a Rouen, EUR/tonnellata."),
 'precio semanal de la colza en Hungria, media nacional (la Comision no define la fase de mercado), EUR/tonelada.': (
  'weekly price of rapeseed in Hungary, national average (the Commission does not define the market stage), EUR/tonne.',
  "prix hebdomadaire du colza en Hongrie, moyenne nationale (la Commission ne définit pas le stade de marché), EUR/tonne.",
  "prezzo settimanale della colza in Ungheria, media nazionale (la Commissione non definisce la fase di mercato), EUR/tonnellata."),
 'precio semanal de la colza en Polonia, media nacional (la Comision no define la fase de mercado), EUR/tonelada.': (
  'weekly price of rapeseed in Poland, national average (the Commission does not define the market stage), EUR/tonne.',
  "prix hebdomadaire du colza en Pologne, moyenne nationale (la Commission ne définit pas le stade de marché), EUR/tonne.",
  "prezzo settimanale della colza in Polonia, media nazionale (la Commissione non definisce la fase di mercato), EUR/tonnellata."),
}

# ---- Banco Mundial (plantilla)
_WB = re.compile(r'^Banco Mundial, Commodity Price Data \(Pink Sheet\): (.+), precio internacional de referencia en dolares de EE\. UU\. \(por (kg|tonelada metrica)\)\.$')
_WBU = {'kg': ('per kg', 'par kg', 'per kg'), 'tonelada metrica': ('per metric tonne', 'par tonne métrique', 'per tonnellata metrica')}
def _wb(s, i):
    m = _WB.match(s)
    if not m: return None
    n, u = m.group(1), _WBU[m.group(2)][i]
    return ('World Bank, Commodity Price Data (Pink Sheet): %s, international reference price in US dollars (%s).',
            'Banque mondiale, Commodity Price Data (Pink Sheet) : %s, prix international de référence en dollars US (%s).',
            'Banca Mondiale, Commodity Price Data (Pink Sheet): %s, prezzo internazionale di riferimento in dollari USA (%s).')[i] % (n, u)

# ---- DAERA (Irlanda del Norte, plantilla)
_DA = 'DAERA, Northern Ireland Agricultural Market Report (Open Government Licence v3.0): '
_DAR = re.compile(r'^(Corderos|Novillas|Novillos|Toros jovenes|Vacas) \((clasificacion R3|todas las clasificaciones)\), precio medio en canal; la fuente da peniques por kg\.$')
_DAA = {'Corderos': ('Lambs', 'Agneaux', 'Agnelli'), 'Novillas': ('Heifers', 'Génisses', 'Giovenche'), 'Novillos': ('Steers', 'Bouvillons', 'Manzi'),
        'Toros jovenes': ('Young bulls', 'Jeunes taureaux', 'Giovani tori'), 'Vacas': ('Cows', 'Vaches', 'Vacche')}
_DAC = {'clasificacion R3': ('R3 grade', 'classe R3', 'classe R3'), 'todas las clasificaciones': ('all grades', 'toutes classes', 'tutte le classi')}
def _da(s, i):
    if not s.startswith(_DA): return None
    m = _DAR.match(s[len(_DA):])
    if not m: return None
    a, c = _DAA[m.group(1)][i], _DAC[m.group(2)][i]
    return (_DA + '%s (%s), average carcase price; the source gives pence per kg.' % (a, c) if i == 0 else
            _DA + '%s (%s), prix moyen en carcasse ; la source donne des pence par kg.' % (a, c) if i == 1 else
            _DA + '%s (%s), prezzo medio in carcassa; la fonte indica penny per kg.' % (a, c))

# ---- prefijos con cola fija
def _tails(prefix, pref_t, table):
    return {prefix + k: tuple(pref_t[i] + v[i] for i in range(3)) for k, v in table.items()}

_AFI = 'Alberta Agriculture and Irrigation, Alberta Farm Input Prices (Open Government Licence - Alberta): '
_AFIP = ('Alberta Agriculture and Irrigation, Alberta Farm Input Prices (Open Government Licence - Alberta): ',) * 3
_AFIT = {
 'Amoniaco anhidro 82-0-0, con aplicador.': ('Anhydrous ammonia 82-0-0, applied.', "Ammoniac anhydre 82-0-0, appliqué.", "Ammoniaca anidra 82-0-0, con applicazione."),
 'Cloruro potasico 0-0-60 a granel.': ('Potassium chloride 0-0-60, bulk.', "Chlorure de potassium 0-0-60, en vrac.", "Cloruro di potassio 0-0-60, sfuso."),
 'Electricidad de uso agricola sin cargos de servicio ni reparto; precio por 100 kWh dividido entre 100.': (
  'Farm electricity excluding service and delivery charges; the price per 100 kWh is divided by 100.',
  "Électricité à usage agricole hors frais de service et de distribution ; le prix par 100 kWh est divisé par 100.",
  "Elettricità a uso agricolo senza oneri di servizio e distribuzione; il prezzo per 100 kWh è diviso per 100."),
 'Fosfato monoamonico 11-52-0 a granel.': ('Monoammonium phosphate 11-52-0, bulk.', "Phosphate monoammonique 11-52-0, en vrac.", "Fosfato monoammonico 11-52-0, sfuso."),
 'Gas natural sin cargos de servicio ni reparto, con la rebaja provincial descontada, CAD por gigajulio.': (
  'Natural gas excluding service and delivery charges, with the provincial rebate deducted, CAD per gigajoule.',
  "Gaz naturel hors frais de service et de distribution, remise provinciale déduite, CAD par gigajoule.",
  "Gas naturale senza oneri di servizio e distribuzione, con lo sconto provinciale detratto, CAD per gigajoule."),
 'Gasoleo agricola marcado (descontada la ayuda provincial); la fuente da el precio por 100 litros y aqui se divide entre 100.': (
  'Marked farm diesel (provincial relief deducted); the source gives the price per 100 litres and it is divided by 100 here.',
  "Gazole agricole marqué (aide provinciale déduite) ; la source donne le prix par 100 litres et il est divisé par 100 ici.",
  "Gasolio agricolo marcato (aiuto provinciale detratto); la fonte indica il prezzo per 100 litri e qui è diviso per 100."),
 'Gasolina marcada de uso agricola; precio por 100 litros dividido entre 100.': (
  'Marked farm gasoline; price per 100 litres divided by 100.',
  "Essence marquée à usage agricole ; prix par 100 litres divisé par 100.",
  "Benzina marcata a uso agricolo; prezzo per 100 litri diviso per 100."),
 'Heno de buena calidad (mas del 50 % de alfalfa), en la granja; CAD por tonelada corta.': (
  'Good-quality hay (more than 50 % alfalfa), on the farm; CAD per short ton.',
  "Foin de bonne qualité (plus de 50 % de luzerne), à la ferme ; CAD par tonne courte.",
  "Fieno di buona qualità (oltre il 50 % di erba medica), in azienda; CAD per tonnellata corta."),
 'Mineral para vacuno sin sal (16 % de fosforo y 16 % de calcio), envase de 20 kg; el precio por envase se pasa a tonelada (x50).': (
  'Salt-free mineral for cattle (16 % phosphorus and 16 % calcium), 20 kg bag; the price per bag is converted to a tonne (x50).',
  "Minéral sans sel pour bovins (16 % de phosphore et 16 % de calcium), sac de 20 kg ; le prix par sac est converti en tonne (x50).",
  "Minerale senza sale per bovini (16 % di fosforo e 16 % di calcio), sacco da 20 kg; il prezzo per sacco è convertito in tonnellata (x50)."),
 'Pienso completo de crecimiento de pollos (15-17 % de proteina), saco de 20 kg; el precio por saco se pasa a tonelada (x50).': (
  'Complete chicken grower feed (15-17 % protein), 20 kg bag; the price per bag is converted to a tonne (x50).',
  "Aliment complet de croissance pour poulets (15-17 % de protéines), sac de 20 kg ; le prix par sac est converti en tonne (x50).",
  "Mangime completo di accrescimento per polli (15-17 % di proteine), sacco da 20 kg; il prezzo per sacco è convertito in tonnellata (x50)."),
 'Propano para uso agricola a granel; precio por 100 litros dividido entre 100.': (
  'Farm propane, bulk; price per 100 litres divided by 100.',
  "Propane à usage agricole en vrac ; prix par 100 litres divisé par 100.",
  "Propano a uso agricolo sfuso; prezzo per 100 litri diviso per 100."),
 'Racion de arranque para terneros en pellet (13-20 % de proteina), saco de 25 kg; el precio por saco se pasa a tonelada (x40).': (
  'Pelleted calf starter ration (13-20 % protein), 25 kg bag; the price per bag is converted to a tonne (x40).',
  "Ration de démarrage pour veaux en granulés (13-20 % de protéines), sac de 25 kg ; le prix par sac est converti en tonne (x40).",
  "Razione di avviamento per vitelli in pellet (13-20 % di proteine), sacco da 25 kg; il prezzo per sacco è convertito in tonnellata (x40)."),
 'Racion de crecimiento de cerdos en pellet (15-17 % de proteina), saco de 25 kg; el precio por saco se pasa a tonelada (x40).': (
  'Pelleted pig grower ration (15-17 % protein), 25 kg bag; the price per bag is converted to a tonne (x40).',
  "Ration de croissance pour porcs en granulés (15-17 % de protéines), sac de 25 kg ; le prix par sac est converti en tonne (x40).",
  "Razione di accrescimento per suini in pellet (15-17 % di proteine), sacco da 25 kg; il prezzo per sacco è convertito in tonnellata (x40)."),
 'Sulfato amonico 21-0-0-24 a granel.': ('Ammonium sulphate 21-0-0-24, bulk.', "Sulfate d'ammonium 21-0-0-24, en vrac.", "Solfato ammonico 21-0-0-24, sfuso."),
 'Suplemento para cebadero en pellet (30-32 % de proteina), saco de 20 kg; el precio por saco se pasa a tonelada (x50).': (
  'Pelleted feedlot supplement (30-32 % protein), 20 kg bag; the price per bag is converted to a tonne (x50).',
  "Complément pour parc d'engraissement en granulés (30-32 % de protéines), sac de 20 kg ; le prix par sac est converti en tonne (x50).",
  "Integratore per feedlot in pellet (30-32 % di proteine), sacco da 20 kg; il prezzo per sacco è convertito in tonnellata (x50)."),
 'Suplemento porcino en pellet (35-40 % de proteina), saco de 25 kg; el precio por saco se pasa a tonelada (x40).': (
  'Pelleted pig supplement (35-40 % protein), 25 kg bag; the price per bag is converted to a tonne (x40).',
  "Complément pour porcs en granulés (35-40 % de protéines), sac de 25 kg ; le prix par sac est converti en tonne (x40).",
  "Integratore per suini in pellet (35-40 % di proteine), sacco da 25 kg; il prezzo per sacco è convertito in tonnellata (x40)."),
 'Sustituto de leche para terneros, saco de 20 kg; el precio por saco se pasa a tonelada (x50).': (
  'Calf milk replacer, 20 kg bag; the price per bag is converted to a tonne (x50).',
  "Lait de remplacement pour veaux, sac de 20 kg ; le prix par sac est converti en tonne (x50).",
  "Latte sostitutivo per vitelli, sacco da 20 kg; il prezzo per sacco è convertito in tonnellata (x50)."),
 'Urea 46-0-0 a granel.': ('Urea 46-0-0, bulk.', "Urée 46-0-0, en vrac.", "Urea 46-0-0, sfusa."),
}

_DE = ('DESNZ, Weekly road fuel prices (Open Government Licence v3.0): ',) * 3
_DET = {
 'Gasoleo (ULSD) en surtidor, media del Reino Unido, con impuesto especial e IVA; la fuente da peniques por litro.': (
  'Diesel (ULSD) at the pump, UK average, including excise duty and VAT; the source gives pence per litre.',
  "Gazole (ULSD) à la pompe, moyenne du Royaume-Uni, taxe d'accise et TVA comprises ; la source donne des pence par litre.",
  "Gasolio (ULSD) alla pompa, media del Regno Unito, con accisa e IVA; la fonte indica penny per litro."),
 'Gasolina sin plomo (ULSP) en surtidor, media del Reino Unido, con impuesto especial e IVA; la fuente da peniques por litro.': (
  'Unleaded petrol (ULSP) at the pump, UK average, including excise duty and VAT; the source gives pence per litre.',
  "Essence sans plomb (ULSP) à la pompe, moyenne du Royaume-Uni, taxe d'accise et TVA comprises ; la source donne des pence par litre.",
  "Benzina senza piombo (ULSP) alla pompa, media del Regno Unito, con accisa e IVA; la fonte indica penny per litro."),
}

_DF = ('Defra, UK egg statistics (Open Government Licence v3.0): ',) * 3
_DFT = {
 'Huevos camperos, precio medio de la empaquetadora al productor; la fuente da peniques por docena.': (
  'Free-range eggs, average packer-to-producer price; the source gives pence per dozen.',
  "Œufs de plein air, prix moyen du centre d'emballage au producteur ; la source donne des pence par douzaine.",
  "Uova da allevamento all'aperto, prezzo medio dal centro di imballaggio al produttore; la fonte indica penny per dozzina."),
 'Huevos de gallinas en jaula enriquecida, precio medio de la empaquetadora al productor; la fuente da peniques por docena.': (
  'Eggs from enriched-cage hens, average packer-to-producer price; the source gives pence per dozen.',
  "Œufs de poules en cage aménagée, prix moyen du centre d'emballage au producteur ; la source donne des pence par douzaine.",
  "Uova di galline in gabbia arricchita, prezzo medio dal centro di imballaggio al produttore; la fonte indica penny per dozzina."),
 'Huevos, precio medio de la empaquetadora al productor (todos los tipos); la fuente da peniques por docena.': (
  'Eggs, average packer-to-producer price (all types); the source gives pence per dozen.',
  "Œufs, prix moyen du centre d'emballage au producteur (tous types) ; la source donne des pence par douzaine.",
  "Uova, prezzo medio dal centro di imballaggio al produttore (tutti i tipi); la fonte indica penny per dozzina."),
}

_SCC = ('Statistics Canada (Open Government Licence - Canada): ', 'Statistique Canada (Open Government Licence - Canada) : ', 'Statistics Canada (Open Government Licence - Canada): ')
_SCCT = {
 'Bacon, 500 g; el precio del envase se pasa a kg (precio al consumidor).': ('Bacon, 500 g; the pack price is converted to kg (consumer price).', "Bacon, 500 g ; le prix de l'emballage est converti en kg (prix à la consommation).", "Bacon, 500 g; il prezzo della confezione è convertito in kg (prezzo al consumo)."),
 'Carne picada de vacuno, por kg (precio al consumidor).': ('Ground beef, per kg (consumer price).', "Bœuf haché, par kg (prix à la consommation).", "Carne macinata di manzo, per kg (prezzo al consumo)."),
 'Gasolina normal en surtidor (autoservicio), media nacional; la fuente da centimos por litro.': ('Regular gasoline at the pump (self-serve), national average; the source gives cents per litre.', "Essence ordinaire à la pompe (libre-service), moyenne nationale ; la source donne des cents par litre.", "Benzina normale alla pompa (self-service), media nazionale; la fonte indica centesimi per litro."),
 'Huevos, 1 docena (precio al consumidor).': ('Eggs, 1 dozen (consumer price).', "Œufs, 1 douzaine (prix à la consommation).", "Uova, 1 dozzina (prezzo al consumo)."),
 'Leche, 1 litro (precio al consumidor).': ('Milk, 1 litre (consumer price).', "Lait, 1 litre (prix à la consommation).", "Latte, 1 litro (prezzo al consumo)."),
 'Leche, envase de 4 litros; el precio del envase se divide entre 4 (por litro) (precio al consumidor).': ('Milk, 4-litre container; the container price is divided by 4 (per litre) (consumer price).', "Lait, contenant de 4 litres ; le prix du contenant est divisé par 4 (par litre) (prix à la consommation).", "Latte, contenitore da 4 litri; il prezzo del contenitore è diviso per 4 (per litro) (prezzo al consumo)."),
 'Lomo alto de vacuno (striploin), por kg (precio al consumidor).': ('Beef striploin, per kg (consumer price).', "Faux-filet de bœuf (striploin), par kg (prix à la consommation).", "Controfiletto di manzo (striploin), per kg (prezzo al consumo)."),
 'Lomo de cerdo, por kg (precio al consumidor).': ('Pork loin, per kg (consumer price).', "Longe de porc, par kg (prix à la consommation).", "Lonza di maiale, per kg (prezzo al consumo)."),
 'Mantequilla, 454 g; el precio del envase se pasa a kg (precio al consumidor).': ('Butter, 454 g; the pack price is converted to kg (consumer price).', "Beurre, 454 g ; le prix de l'emballage est converti en kg (prix à la consommation).", "Burro, 454 g; il prezzo della confezione è convertito in kg (prezzo al consumo)."),
 'Paleta de cerdo, por kg (precio al consumidor).': ('Pork shoulder, per kg (consumer price).', "Épaule de porc, par kg (prix à la consommation).", "Spalla di maiale, per kg (prezzo al consumo)."),
 'Pechugas de pollo, por kg (precio al consumidor).': ('Chicken breasts, per kg (consumer price).', "Poitrines de poulet, par kg (prix à la consommation).", "Petti di pollo, per kg (prezzo al consumo)."),
 'Pollo entero, por kg (precio al consumidor).': ('Whole chicken, per kg (consumer price).', "Poulet entier, par kg (prix à la consommation).", "Pollo intero, per kg (prezzo al consumo)."),
 'Queso en bloque, 500 g; el precio del envase se pasa a kg (precio al consumidor).': ('Block cheese, 500 g; the pack price is converted to kg (consumer price).', "Fromage en bloc, 500 g ; le prix de l'emballage est converti en kg (prix à la consommation).", "Formaggio in blocco, 500 g; il prezzo della confezione è convertito in kg (prezzo al consumo)."),
 'Solomillo bajo de vacuno (top sirloin), por kg (precio al consumidor).': ('Beef top sirloin, per kg (consumer price).', "Aloyau de bœuf (top sirloin), par kg (prix à la consommation).", "Controfiletto basso di manzo (top sirloin), per kg (prezzo al consumo)."),
 'Vacuno para guisar, por kg (precio al consumidor).': ('Stewing beef, per kg (consumer price).', "Bœuf à ragoût, par kg (prix à la consommation).", "Manzo da spezzatino, per kg (prezzo al consumo)."),
 'Yogur, 500 g; el precio del envase se pasa a kg (precio al consumidor).': ('Yogurt, 500 g; the pack price is converted to kg (consumer price).', "Yaourt, 500 g ; le prix de l'emballage est converti en kg (prix à la consommation).", "Yogurt, 500 g; il prezzo della confezione è convertito in kg (prezzo al consumo)."),
}
_DIESEL = re.compile(r'^Statistics Canada \(Open Government Licence - Canada\): Diésel en surtidor \(autoservicio\) en (.+); la fuente da céntimos por litro\.$')

_LM = ('USDA AMS, Livestock Mandatory Reporting (LMR): ',) * 3
def _lm(es, en, fr, it): return (es, (en, fr, it))
_LMT = dict([
 _lm('Cerdos sacrificados el día anterior, precio base de la canal, compra directa (informe LM_HG201).', 'Hogs slaughtered the previous day, base carcase price, direct purchase (report LM_HG201).', "Porcs abattus la veille, prix de base de la carcasse, achat direct (rapport LM_HG201).", "Suini macellati il giorno precedente, prezzo base della carcassa, acquisto diretto (rapporto LM_HG201)."),
 _lm('Cerdos sacrificados el día anterior, precio neto de la canal, compra directa (informe LM_HG201).', 'Hogs slaughtered the previous day, net carcase price, direct purchase (report LM_HG201).', "Porcs abattus la veille, prix net de la carcasse, achat direct (rapport LM_HG201).", "Suini macellati il giorno precedente, prezzo netto della carcassa, acquisto diretto (rapporto LM_HG201)."),
 _lm('Costillar de cerdo, FOB planta (informe LM_PK602).', 'Pork ribs, FOB plant (report LM_PK602).', "Côtes de porc, FOB usine (rapport LM_PK602).", "Costine di maiale, FOB stabilimento (rapporto LM_PK602)."),
 _lm('Jamón de cerdo (pieza fresca), FOB planta (informe LM_PK602).', 'Pork ham (fresh cut), FOB plant (report LM_PK602).', "Jambon de porc (pièce fraîche), FOB usine (rapport LM_PK602).", "Prosciutto di maiale (taglio fresco), FOB stabilimento (rapporto LM_PK602)."),
 _lm('Lomo de cerdo, FOB planta (informe LM_PK602).', 'Pork loin, FOB plant (report LM_PK602).', "Longe de porc, FOB usine (rapport LM_PK602).", "Lonza di maiale, FOB stabilimento (rapporto LM_PK602)."),
 _lm('Novillas de sacrificio, precio en canal entregado, media de 5 zonas, negociado (informe LM_CT100).', 'Slaughter heifers, delivered carcase price, 5-area average, negotiated (report LM_CT100).', "Génisses d'abattage, prix en carcasse livrée, moyenne de 5 zones, négocié (rapport LM_CT100).", "Giovenche da macello, prezzo in carcassa consegnata, media di 5 zone, negoziato (rapporto LM_CT100)."),
 _lm('Novillas de sacrificio, precio vivo FOB, media de 5 zonas, negociado (informe LM_CT100).', 'Slaughter heifers, live FOB price, 5-area average, negotiated (report LM_CT100).', "Génisses d'abattage, prix sur pied FOB, moyenne de 5 zones, négocié (rapport LM_CT100).", "Giovenche da macello, prezzo vivo FOB, media di 5 zone, negoziato (rapporto LM_CT100)."),
 _lm('Novillos de sacrificio, precio en canal entregado, media de 5 zonas, negociado (informe LM_CT100).', 'Slaughter steers, delivered carcase price, 5-area average, negotiated (report LM_CT100).', "Bouvillons d'abattage, prix en carcasse livrée, moyenne de 5 zones, négocié (rapport LM_CT100).", "Manzi da macello, prezzo in carcassa consegnata, media di 5 zone, negoziato (rapporto LM_CT100)."),
 _lm('Novillos de sacrificio, precio vivo FOB, media de 5 zonas, negociado (informe LM_CT100).', 'Slaughter steers, live FOB price, 5-area average, negotiated (report LM_CT100).', "Bouvillons d'abattage, prix sur pied FOB, moyenne de 5 zones, négocié (rapport LM_CT100).", "Manzi da macello, prezzo vivo FOB, media di 5 zone, negoziato (rapporto LM_CT100)."),
 _lm('Paleta delantera (picnic) de cerdo, FOB planta (informe LM_PK602).', 'Pork picnic shoulder, FOB plant (report LM_PK602).', "Épaule picnic de porc, FOB usine (rapport LM_PK602).", "Spalla picnic di maiale, FOB stabilimento (rapporto LM_PK602)."),
 _lm('Paleta/aguja (butt) de cerdo, FOB planta (informe LM_PK602).', 'Pork butt (Boston shoulder), FOB plant (report LM_PK602).', "Palette/échine (butt) de porc, FOB usine (rapport LM_PK602).", "Spalla/coppa (butt) di maiale, FOB stabilimento (rapporto LM_PK602)."),
 _lm('Panceta (belly) de cerdo, FOB planta (informe LM_PK602).', 'Pork belly, FOB plant (report LM_PK602).', "Poitrine (belly) de porc, FOB usine (rapport LM_PK602).", "Pancetta (belly) di maiale, FOB stabilimento (rapporto LM_PK602)."),
 _lm('Vacuno de sacrificio (todos los tipos), precio en canal entregado, media de 5 zonas, negociado (informe LM_CT100).', 'Slaughter cattle (all types), delivered carcase price, 5-area average, negotiated (report LM_CT100).', "Bovins d'abattage (tous types), prix en carcasse livrée, moyenne de 5 zones, négocié (rapport LM_CT100).", "Bovini da macello (tutti i tipi), prezzo in carcassa consegnata, media di 5 zone, negoziato (rapporto LM_CT100)."),
 _lm('Vacuno de sacrificio (todos los tipos), precio vivo FOB, media de 5 zonas, negociado (informe LM_CT100).', 'Slaughter cattle (all types), live FOB price, 5-area average, negotiated (report LM_CT100).', "Bovins d'abattage (tous types), prix sur pied FOB, moyenne de 5 zones, négocié (rapport LM_CT100).", "Bovini da macello (tutti i tipi), prezzo vivo FOB, media di 5 zone, negoziato (rapporto LM_CT100)."),
 _lm('Valor del corte de cerdo FOB planta (informe LM_PK602).', 'Pork cutout value, FOB plant (report LM_PK602).', "Valeur de la découpe de porc FOB usine (rapport LM_PK602).", "Valore del taglio di maiale FOB stabilimento (rapporto LM_PK602)."),
 _lm('Valor del corte de vacuno en caja, Choice (informe LM_XB403).', 'Boxed beef cutout value, Choice (report LM_XB403).', "Valeur de la découpe de bœuf en caisse, Choice (rapport LM_XB403).", "Valore del taglio di manzo in cassa, Choice (rapporto LM_XB403)."),
 _lm('Valor del corte de vacuno en caja, Select (informe LM_XB403).', 'Boxed beef cutout value, Select (report LM_XB403).', "Valeur de la découpe de bœuf en caisse, Select (rapport LM_XB403).", "Valore del taglio di manzo in cassa, Select (rapporto LM_XB403)."),
])

_ND = ('USDA AMS, National Dairy Products Sales Report (NDPSR): ',) * 3
_NDT = {
 'Mantequilla: precio semanal medio ponderado de las ventas (EE. UU.).': ('Butter: weekly weighted average sales price (US).', "Beurre : prix hebdomadaire moyen pondéré des ventes (États-Unis).", "Burro: prezzo settimanale medio ponderato delle vendite (USA)."),
 'Queso cheddar de bloque de 40 lb: precio semanal medio ponderado de las ventas (EE. UU.).': ('40-lb block cheddar cheese: weekly weighted average sales price (US).', "Cheddar en bloc de 40 lb : prix hebdomadaire moyen pondéré des ventes (États-Unis).", "Cheddar in blocco da 40 lb: prezzo settimanale medio ponderato delle vendite (USA)."),
 'Suero seco: precio semanal medio ponderado de las ventas (EE. UU.).': ('Dry whey: weekly weighted average sales price (US).', "Lactosérum sec : prix hebdomadaire moyen pondéré des ventes (États-Unis).", "Siero di latte secco: prezzo settimanale medio ponderato delle vendite (USA)."),
}

_ER = ('USDA ERS, Bioenergy Statistics: ',) * 3
_ERT = {
 'Coste del maiz por galon de etanol producido (EE. UU.): mensual.': ('Corn cost per gallon of ethanol produced (US): monthly.', "Coût du maïs par gallon d'éthanol produit (États-Unis) : mensuel.", "Costo del mais per gallone di etanolo prodotto (USA): mensile."),
 'Gasolina base para mezcla con etanol (RBOB, Los Angeles): precio spot mensual.': ('Gasoline blendstock for ethanol blending (RBOB, Los Angeles): monthly spot price.', "Essence de base pour mélange avec l'éthanol (RBOB, Los Angeles) : prix spot mensuel.", "Benzina base per miscela con etanolo (RBOB, Los Angeles): prezzo spot mensile."),
 'Granos secos de destileria (DDGS), precio mayorista en Illinois central: mensual.': ('Dried distillers grains (DDGS), wholesale price in central Illinois: monthly.', "Drêches de distillerie séchées (DDGS), prix de gros dans le centre de l'Illinois : mensuel.", "Drêche secca di distilleria (DDGS), prezzo all'ingrosso nell'Illinois centrale: mensile."),
}

def _build():
    out = dict(G)
    # el texto original lleva tildes en algunos prefijos: se acepta con y sin ellas
    for k, v in _ECT.items(): out[_EC + k] = tuple(_ECP[i] + v[i] for i in range(3))
    out.update({k.replace('Comision', 'Comisión'): v for k, v in list(out.items()) if k.startswith(_EC)})
    for pref, tab in ((_AFIP, _AFIT), (_DE, _DET), (_DF, _DFT), (_SCC, _SCCT), (_ND, _NDT), (_ER, _ERT), (_LM, _LMT)):
        base = {'Alberta Agriculture and Irrigation, Alberta Farm Input Prices (Open Government Licence - Alberta): ': _AFI}
        es_pref = {id(_AFIP): _AFI, id(_DE): 'DESNZ, Weekly road fuel prices (Open Government Licence v3.0): ', id(_DF): 'Defra, UK egg statistics (Open Government Licence v3.0): ',
                   id(_SCC): _SCCT_ES, id(_ND): 'USDA AMS, National Dairy Products Sales Report (NDPSR): ', id(_ER): 'USDA ERS, Bioenergy Statistics: ', id(_LM): 'USDA AMS, Livestock Mandatory Reporting (LMR): '}[id(pref)]
        for k, v in tab.items(): out[es_pref + k] = tuple(pref[i] + v[i] for i in range(3))
    return out

_SCCT_ES = 'Statistics Canada (Open Government Licence - Canada): '
M = _build()

_CITY = {'en': {}, 'fr': {}, 'it': {}}
def _diesel(s, i):
    m = _DIESEL.match(s)
    if not m: return None
    c = m.group(1)
    return ('Statistics Canada (Open Government Licence - Canada): Diesel at the pump (self-serve) in %s; the source gives cents per litre.' % c,
            'Statistique Canada (Open Government Licence - Canada) : Gazole à la pompe (libre-service) à %s ; la source donne des cents par litre.' % c,
            'Statistics Canada (Open Government Licence - Canada): Gasolio alla pompa (self-service) a %s; la fonte indica centesimi per litro.' % c)[i]

def translate_more(s, i):
    """i = 0 en, 1 fr, 2 it. None si la frase no es de las conocidas aqui."""
    if s in M: return M[s][i]
    for f in (_wb, _da, _diesel):
        r = f(s, i)
        if r: return r
    return None
