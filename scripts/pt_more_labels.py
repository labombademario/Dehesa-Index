# -*- coding: utf-8 -*-
"""Nombres en cuatro idiomas (es, en, fr, it) de las series de Portugal (INE) que publica scripts/update-portugal-more.py.
Clave = nombre en ingles que da la API del INE (lang=EN) o codigo propio del INE (COICOP). Lo que no esta aqui no se publica:
nunca se inventa una traduccion ni se deja una serie sin nombre."""


def L(es, en, fr, it):
    return [es, en, fr, it]


# especies de la pesca descargada (indicador 0001066)
SPECIES = {
    "Total": L("Total", "Total", "Total", "Totale"),
    "Sea fish": L("Pescado de mar", "Sea fish", "Poissons de mer", "Pesci di mare"),
    "Diadromous and freshwater fish": L("Peces diádromos y de agua dulce", "Diadromous and freshwater fish", "Poissons diadromes et d'eau douce", "Pesci diadromi e d'acqua dolce"),
    "Crustaceans": L("Crustáceos", "Crustaceans", "Crustacés", "Crostacei"),
    "Molluscs": L("Moluscos", "Molluscs", "Mollusques", "Molluschi"),
    "Other aquatic species": L("Otras especies acuáticas", "Other aquatic species", "Autres espèces aquatiques", "Altre specie acquatiche"),
    "Other products": L("Otros productos", "Other products", "Autres produits", "Altri prodotti"),
}
# geografias de la pesca: codigo del INE -> (nombre propio, nivel). Los nombres de lonjas e islas son nombres propios y no se traducen.
FISH_AGG = {"PT": L("Portugal", "Portugal", "Portugal", "Portogallo"), "1": L("Continente", "Mainland", "Continent", "Continente"),
            "2": L("Azores", "Azores", "Açores", "Azzorre"), "3": L("Madeira", "Madeira", "Madère", "Madera")}

# carne (balances)
MEAT = {
    "Total meat and offal": L("Carne y despojos, total", "Total meat and offal", "Viande et abats, total", "Carne e frattaglie, totale"),
    "Meat of bovine animals": L("Carne de vacuno", "Bovine meat", "Viande bovine", "Carne bovina"),
    "Pig meat": L("Carne de cerdo", "Pig meat", "Viande de porc", "Carne suina"),
    "Meat of ovine and caprine animals": L("Carne de ovino y caprino", "Sheep and goat meat", "Viande ovine et caprine", "Carne ovina e caprina"),
    "Meat of equidae": L("Carne de équidos", "Equine meat", "Viande équine", "Carne equina"),
    "Poultrymeat": L("Carne de aves", "Poultry meat", "Viande de volaille", "Carne avicola"),
    "Other meats": L("Otras carnes", "Other meats", "Autres viandes", "Altre carni"),
    "Offal": L("Despojos", "Offal", "Abats", "Frattaglie"),
}
CEREALS = {
    "Cereals total": L("Cereales, total", "Cereals, total", "Céréales, total", "Cereali, totale"),
    "Wheat": L("Trigo", "Wheat", "Blé", "Frumento"),
    "Common wheat": L("Trigo blando", "Common wheat", "Blé tendre", "Frumento tenero"),
    "Durum wheat": L("Trigo duro", "Durum wheat", "Blé dur", "Frumento duro"),
    "Rye": L("Centeno", "Rye", "Seigle", "Segale"),
    "Oats": L("Avena", "Oats", "Avoine", "Avena"),
    "Barley": L("Cebada", "Barley", "Orge", "Orzo"),
    "Maize": L("Maíz", "Maize", "Maïs", "Mais"),
    "Other cereals": L("Otros cereales", "Other cereals", "Autres céréales", "Altri cereali"),
}
FRUITS = {
    "Total of the main species of traded fruits": L("Principales frutas comercializadas, total", "Main traded fruit species, total", "Principales fruits commercialisés, total", "Principali frutti commercializzati, totale"),
    "Apple": L("Manzana", "Apple", "Pomme", "Mela"),
    "Pear": L("Pera", "Pear", "Poire", "Pera"),
    "Fresh peach": L("Melocotón fresco", "Fresh peach", "Pêche fraîche", "Pesca fresca"),
    "Table grape": L("Uva de mesa", "Table grape", "Raisin de table", "Uva da tavola"),
    "Orange": L("Naranja", "Orange", "Orange", "Arancia"),
}
MILK = {
    "Cow's milk": L("Leche de vaca", "Cow's milk", "Lait de vache", "Latte vaccino"),
    "Sheep milk": L("Leche de oveja", "Sheep milk", "Lait de brebis", "Latte ovino"),
    "Goat milk": L("Leche de cabra", "Goat milk", "Lait de chèvre", "Latte caprino"),
    "Others milks": L("Otras leches", "Other milks", "Autres laits", "Altri latti"),
    "Total of milk": L("Leche, total", "Total milk", "Lait, total", "Latte, totale"),
}
BOVINE = {
    "Total": L("Bovino, total", "Bovine, total", "Bovins, total", "Bovini, totale"),
    "Calves": L("Terneros", "Calves", "Veaux", "Vitelli"),
    "Adultes": L("Bovino adulto", "Adult cattle", "Bovins adultes", "Bovini adulti"),
    "Steers and bullocks": L("Novillos y toros jóvenes", "Steers and bullocks", "Bouvillons et jeunes taureaux", "Manzi e torelli"),
    "Cows": L("Vacas", "Cows", "Vaches", "Vacche"),
    "Heifers": L("Novillas", "Heifers", "Génisses", "Giovenche"),
}
# incendios
FIRE_SIZE = {
    "Total": L("Todos los tamaños", "All sizes", "Toutes tailles", "Tutte le dimensioni"),
    "< 1 ha": L("Menos de 1 ha", "Under 1 ha", "Moins de 1 ha", "Meno di 1 ha"),
    "1 - < 10 ha": L("De 1 a menos de 10 ha", "1 to under 10 ha", "De 1 à moins de 10 ha", "Da 1 a meno di 10 ha"),
    "10 - < 20 ha": L("De 10 a menos de 20 ha", "10 to under 20 ha", "De 10 à moins de 20 ha", "Da 10 a meno di 20 ha"),
    "20 - < 50 ha": L("De 20 a menos de 50 ha", "20 to under 50 ha", "De 20 à moins de 50 ha", "Da 20 a meno di 50 ha"),
    "50 - < 100 ha": L("De 50 a menos de 100 ha", "50 to under 100 ha", "De 50 à moins de 100 ha", "Da 50 a meno di 100 ha"),
    "100 - < 500 ha": L("De 100 a menos de 500 ha", "100 to under 500 ha", "De 100 à moins de 500 ha", "Da 100 a meno di 500 ha"),
    "500 - < 1 000 ha": L("De 500 a menos de 1 000 ha", "500 to under 1 000 ha", "De 500 à moins de 1 000 ha", "Da 500 a meno di 1 000 ha"),
    ">= 1 000 ha": L("1 000 ha o más", "1 000 ha or more", "1 000 ha ou plus", "1 000 ha o più"),
}
BURNT = {
    "Total": L("Superficie quemada, total", "Burnt area, total", "Surface brûlée, total", "Superficie bruciata, totale"),
    "Forest": L("Bosque", "Forest", "Forêt", "Bosco"),
    "Shrubland and grassland": L("Matorral y pastizal", "Shrubland and grassland", "Maquis et prairies", "Macchia e pascolo"),
    "Agricultural": L("Terreno agrícola", "Agricultural land", "Terres agricoles", "Terreno agricolo"),
}
# regiones y comunidades intermunicipales (nombres propios)
REGIONS = {"PT": L("Portugal", "Portugal", "Portugal", "Portogallo"), "1": L("Continente", "Mainland", "Continent", "Continente"),
           "2": L("Azores", "Azores", "Açores", "Azzorre"), "3": L("Madeira", "Madeira", "Madère", "Madera")}

# cultivos por region (indicador 0013080): codigo INE -> es, en, fr, it
CROPS = {
    "101": L("Cereales", "Cereals", "Céréales", "Cereali"),
    "10101": L("Trigo", "Wheat", "Blé", "Frumento"),
    "1010101": L("Trigo blando", "Common wheat", "Blé tendre", "Frumento tenero"),
    "1010102": L("Trigo duro", "Durum wheat", "Blé dur", "Frumento duro"),
    "10102": L("Centeno", "Rye", "Seigle", "Segale"),
    "10103": L("Avena", "Oat", "Avoine", "Avena"),
    "10104": L("Cebada", "Barley", "Orge", "Orzo"),
    "10105": L("Triticale", "Triticale", "Triticale", "Triticale"),
    "10106": L("Maíz", "Maize", "Maïs", "Mais"),
    "1010601": L("Maíz de regadío", "Irrigated maize", "Maïs irrigué", "Mais irriguo"),
    "1010602": L("Maíz de secano", "Dry maize", "Maïs pluvial", "Mais in asciutto"),
    "10107": L("Arroz", "Rice", "Riz", "Riso"),
    "102": L("Legumbres secas", "Dried pulses", "Légumes secs", "Legumi secchi"),
    "10201": L("Judías", "Beans", "Haricots", "Fagioli"),
    "10202": L("Garbanzos", "Chick peas", "Pois chiches", "Ceci"),
    "103": L("Patata", "Potato", "Pomme de terre", "Patata"),
    "10301": L("Patata de regadío", "Potato, irrigated", "Pomme de terre irriguée", "Patata irrigua"),
    "10302": L("Patata de secano", "Potato, non-irrigated", "Pomme de terre pluviale", "Patata in asciutto"),
    "104": L("Cultivos industriales", "Cultures for industry", "Cultures industrielles", "Colture industriali"),
    "10401": L("Tomate de industria", "Processing tomato", "Tomate d'industrie", "Pomodoro da industria"),
    "10402": L("Girasol", "Sunflower", "Tournesol", "Girasole"),
    "10403": L("Tabaco", "Tobacco", "Tabac", "Tabacco"),
    "10404": L("Remolacha azucarera", "Sugar beet", "Betterave sucrière", "Barbabietola da zucchero"),
    "10405": L("Lúpulo", "Hop", "Houblon", "Luppolo"),
    "105": L("Hortalizas", "Vegetables", "Légumes", "Ortaggi"),
    "10501": L("Tomate fresco", "Fresh tomato", "Tomate fraîche", "Pomodoro fresco"),
    "10502": L("Lechuga", "Lettuce", "Laitue", "Lattuga"),
    "10503": L("Judía verde", "Green beans", "Haricots verts", "Fagiolini"),
    "10504": L("Cebolla", "Onion", "Oignon", "Cipolla"),
    "10505": L("Zanahoria", "Carrot", "Carotte", "Carota"),
    "10506": L("Pimiento", "Green/red pepper", "Poivron", "Peperone"),
    "10507": L("Guisante", "Peas", "Pois", "Piselli"),
    "10508": L("Haba", "Broad beans", "Fèves", "Fave"),
    "10509": L("Melón", "Melon", "Melon", "Melone"),
    "10510": L("Sandía", "Water melon", "Pastèque", "Anguria"),
    "10511": L("Fresa", "Strawberries", "Fraises", "Fragole"),
    "10512": L("Coliflor", "Cauliflower", "Chou-fleur", "Cavolfiore"),
    "10513": L("Brócoli", "Broccoli", "Brocoli", "Broccoli"),
    "10514": L("Repollo de huerta", "Garden cabbage", "Chou pommé", "Cavolo cappuccio"),
    "10515": L("Berza de tallo grueso", "Thick-stalked cabbage", "Chou à grosses côtes", "Cavolo a costa larga"),
    "10516": L("Repollo de primavera", "Spring cabbage", "Chou de printemps", "Cavolo primaverile"),
    "10517": L("Coles de Bruselas", "Sprouts", "Choux de Bruxelles", "Cavoletti di Bruxelles"),
    "10518": L("Ajo", "Garlic", "Ail", "Aglio"),
    "10519": L("Puerro", "Leek", "Poireau", "Porro"),
    "10520": L("Calabacín", "Courgette", "Courgette", "Zucchina"),
    "10521": L("Espinaca", "Spinach", "Épinard", "Spinacio"),
    "10522": L("Nabo", "Turnip", "Navet", "Rapa"),
    "10523": L("Calabaza", "Pumpkins (includes butternut)", "Citrouilles (y compris butternut)", "Zucche (compresa butternut)"),
    "10599": L("Otras hortalizas", "Other vegetables", "Autres légumes", "Altri ortaggi"),
    "106": L("Cultivos forrajeros", "Fodder crops", "Cultures fourragères", "Colture foraggere"),
    "10601": L("Maíz forrajero", "Fodder maize", "Maïs fourrager", "Mais da foraggio"),
    "10602": L("Avena forrajera", "Fodder oat", "Avoine fourragère", "Avena da foraggio"),
    "110": L("Fruta fresca", "Fresh fruit", "Fruits frais", "Frutta fresca"),
    "11001": L("Pera", "Pear", "Poire", "Pera"),
    "11002": L("Manzana", "Apple", "Pomme", "Mela"),
    "11003": L("Melocotón", "Peach", "Pêche", "Pesca"),
    "11004": L("Cereza", "Cherry", "Cerise", "Ciliegia"),
    "11005": L("Ciruela", "Plum", "Prune", "Prugna"),
    "11006": L("Albaricoque", "Apricot", "Abricot", "Albicocca"),
    "11007": L("Caqui", "Persimmon", "Kaki", "Cachi"),
    "11008": L("Higo", "Fig", "Figue", "Fico"),
    "11009": L("Guinda", "Sour cherry", "Griotte", "Amarena"),
    "11010": L("Membrillo", "Quince", "Coing", "Mela cotogna"),
    "11011": L("Níspero", "Loquat", "Nèfle du Japon", "Nespola del Giappone"),
    "11012": L("Granada", "Pomegranate", "Grenade", "Melograna"),
    "111": L("Frutos del bosque", "Berry species", "Petits fruits", "Frutti di bosco"),
    "11101": L("Mora", "Blackberries", "Mûres", "More"),
    "11102": L("Frambuesa", "Raspberries", "Framboises", "Lamponi"),
    "11103": L("Grosella", "Currants", "Groseilles", "Ribes"),
    "11104": L("Arándano", "Bilberries", "Myrtilles", "Mirtilli"),
    "112": L("Frutas de clima subtropical", "Fruit of subtropical climate zones", "Fruits des zones climatiques subtropicales", "Frutta di zone climatiche subtropicali"),
    "11201": L("Kiwi", "Kiwi", "Kiwi", "Kiwi"),
    "11202": L("Piña", "Pineapple", "Ananas", "Ananas"),
    "11203": L("Plátano", "Banana", "Banane", "Banana"),
    "11204": L("Aguacate", "Avocado", "Avocat", "Avocado"),
    "113": L("Cítricos", "Citrus fruits", "Agrumes", "Agrumi"),
    "11301": L("Naranja", "Orange", "Orange", "Arancia"),
    "11302": L("Mandarina", "Tangerine", "Mandarine", "Mandarino"),
    "11303": L("Limón", "Lemon", "Citron", "Limone"),
    "11304": L("Tangor", "Tangor", "Tangor", "Tangor"),
    "11305": L("Pomelo", "Grapefruit", "Pamplemousse", "Pompelmo"),
    "114": L("Frutos secos", "Dried fruits", "Fruits secs", "Frutta secca"),
    "11401": L("Almendra", "Almond", "Amande", "Mandorla"),
    "11402": L("Castaña", "Chestnut", "Châtaigne", "Castagna"),
    "11403": L("Nuez", "Walnut", "Noix", "Noce"),
    "11404": L("Avellana", "Hazelnut", "Noisette", "Nocciola"),
    "115": L("Viñedo", "Vineyard", "Vignoble", "Vigneto"),
    "11501": L("Uva de vinificación", "Wine grape", "Raisin de cuve", "Uva da vino"),
    "1150101": L("Uva de vinificación (DOP)", "Wine grape (PDO)", "Raisin de cuve (AOP)", "Uva da vino (DOP)"),
    "1150102": L("Uva de vinificación (IGP)", "Wine grape (PGI)", "Raisin de cuve (IGP)", "Uva da vino (IGP)"),
    "1150103": L("Uva de vinificación (otros vinos)", "Wine grape (other wines)", "Raisin de cuve (autres vins)", "Uva da vino (altri vini)"),
    "11502": L("Uva de mesa", "Table grape", "Raisin de table", "Uva da tavola"),
    "116": L("Olivar", "Olive trees", "Oliveraie", "Oliveto"),
    "11601": L("Aceituna de mesa", "Table olive", "Olive de table", "Oliva da tavola"),
    "11602": L("Aceituna de almazara", "Olives for olive oil", "Olives à huile", "Olive da olio"),
}

# IPCA (COICOP 2018): codigo -> es, en, fr, it
CPI = {
    "T": L("Índice general (IPCA)", "All-items HICP", "IPCH, ensemble", "IPCA, indice generale"),
    "01": L("Alimentos y bebidas no alcohólicas", "Food and non-alcoholic beverages", "Produits alimentaires et boissons non alcoolisées", "Alimentari e bevande analcoliche"),
    "011": L("Alimentos", "Food", "Produits alimentaires", "Prodotti alimentari"),
    "0111": L("Cereales y derivados", "Cereals and cereal products", "Céréales et produits à base de céréales", "Cereali e derivati"),
    "01113": L("Pan y productos de panadería", "Bread and bakery products", "Pain et produits de boulangerie", "Pane e prodotti da forno"),
    "0112": L("Carne y despojos de animales terrestres", "Live animals, and meat and other parts of slaughtered land animals", "Animaux vivants, viandes et autres parties d'animaux terrestres abattus", "Animali vivi, carni e altre parti di animali terrestri macellati"),
    "01122": L("Carne fresca, refrigerada o congelada", "Meat, fresh, chilled or frozen", "Viande fraîche, réfrigérée ou congelée", "Carne fresca, refrigerata o congelata"),
    "0113": L("Pescado y marisco", "Fish and other seafood", "Poissons et autres fruits de mer", "Pesce e altri frutti di mare"),
    "01131": L("Pescado vivo, fresco, refrigerado o congelado", "Fish, live, fresh, chilled or frozen", "Poisson vivant, frais, réfrigéré ou congelé", "Pesce vivo, fresco, refrigerato o congelato"),
    "0114": L("Leche, lácteos y huevos", "Milk, other dairy products and eggs", "Lait, produits laitiers et œufs", "Latte, latticini e uova"),
    "01141": L("Leche cruda y entera", "Raw and whole milk", "Lait cru et entier", "Latte crudo e intero"),
    "01142": L("Leche desnatada", "Skimmed milk", "Lait écrémé", "Latte scremato"),
    "01145": L("Queso", "Cheese", "Fromage", "Formaggio"),
    "01146": L("Yogur y similares", "Yoghurt and similar products", "Yaourt et produits similaires", "Yogurt e prodotti simili"),
    "01148": L("Huevos", "Eggs", "Œufs", "Uova"),
    "0115": L("Aceites y grasas", "Oils and fats", "Huiles et graisses", "Oli e grassi"),
    "01151": L("Aceites vegetales", "Vegetable oils", "Huiles végétales", "Oli vegetali"),
    "01152": L("Mantequilla y otras grasas lácteas", "Butter and other oils and fats derived from milk", "Beurre et autres matières grasses du lait", "Burro e altri grassi del latte"),
    "0116": L("Fruta y frutos secos", "Fruits and nuts", "Fruits et fruits à coque", "Frutta e frutta a guscio"),
    "01162": L("Cítricos frescos", "Citrus fruits, fresh", "Agrumes frais", "Agrumi freschi"),
    "01163": L("Frutas de hueso y pepita, frescas", "Stone fruits and pome fruits, fresh", "Fruits à noyau et à pépins, frais", "Frutta a nocciolo e a granella, fresca"),
    "0117": L("Hortalizas, tubérculos y legumbres", "Vegetables, tubers, plantains, cooking bananas and pulses", "Légumes, tubercules, plantains, bananes à cuire et légumes secs", "Ortaggi, tuberi, platani, banane da cucina e legumi"),
    "01171": L("Hortalizas de hoja o tallo, frescas", "Leafy or stem vegetables, fresh or chilled", "Légumes à feuilles ou à tiges, frais ou réfrigérés", "Ortaggi a foglia o a stelo, freschi o refrigerati"),
    "01172": L("Hortalizas de fruto, frescas", "Fruit-bearing vegetables, fresh or chilled", "Légumes-fruits, frais ou réfrigérés", "Ortaggi a frutto, freschi o refrigerati"),
    "01175": L("Tubérculos frescos (patata)", "Tubers, plantains and cooking bananas, fresh or chilled", "Tubercules, plantains et bananes à cuire, frais ou réfrigérés", "Tuberi, platani e banane da cucina, freschi o refrigerati"),
    "0118": L("Azúcar, confitería y postres", "Sugar, confectionery and desserts", "Sucre, confiserie et desserts", "Zucchero, dolciumi e dessert"),
    "01181": L("Azúcar de caña y de remolacha", "Cane sugar and beet sugar", "Sucre de canne et de betterave", "Zucchero di canna e di barbabietola"),
    "0119": L("Platos preparados y otros alimentos", "Ready-made food and other food products", "Plats préparés et autres produits alimentaires", "Piatti pronti e altri prodotti alimentari"),
    "012": L("Bebidas no alcohólicas", "Non-alcoholic beverages", "Boissons non alcoolisées", "Bevande analcoliche"),
    "0122": L("Café y sucedáneos", "Coffee and coffee substitutes", "Café et succédanés du café", "Caffè e succedanei del caffè"),
}

# balances sueltos (un solo indicador, una sola serie)
SINGLE = {
    "honey-selfsuff": ("0000203", L("Autoabastecimiento de miel", "Self-sufficiency in honey", "Autosuffisance en miel", "Autosufficienza di miele"), "%"),
    "wine-consumption": ("0000177", L("Consumo humano de vino", "Human consumption of wine", "Consommation humaine de vin", "Consumo umano di vino"), "hl"),
    "wine-consumption-pc": ("0000178", L("Consumo humano de vino por habitante", "Human consumption of wine per capita", "Consommation humaine de vin par habitant", "Consumo umano di vino pro capite"), "l/hab."),
}
