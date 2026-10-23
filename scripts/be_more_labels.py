# -*- coding: utf-8 -*-
"""Nombres en cuatro idiomas (es, en, fr, it) de las series de Belgica (Statbel) que publica scripts/update-belgium-more.py.
Clave = codigo del propio Statbel (censo agrario, COICOP del IPC) o nombre de la fila en el fichero. Lo que no esta aqui no se publica:
nunca se inventa una traduccion ni se deja una fila sin nombre."""


def L(es, en, fr, it):
    return [es, en, fr, it]


# regiones y provincias: (clave corta, texto que identifica la columna en la cabecera del Excel, nombre)
GEOS = [
    ("be", "belgi", L("Bélgica", "Belgium", "Belgique", "Belgio")),
    ("vl", "vlaams gewest", L("Flandes", "Flanders", "Flandre", "Fiandre")),
    ("wa", "waals gewest", L("Valonia", "Wallonia", "Wallonie", "Vallonia")),
    ("an", "provincie antw", L("Amberes", "Antwerp", "Anvers", "Anversa")),
    ("vb", "provincie vlaa", L("Brabante Flamenco", "Flemish Brabant", "Brabant flamand", "Brabante Fiammingo")),
    ("wv", "provincie west", L("Flandes Occidental", "West Flanders", "Flandre occidentale", "Fiandre Occidentali")),
    ("ov", "provincie oost", L("Flandes Oriental", "East Flanders", "Flandre orientale", "Fiandre Orientali")),
    ("li", "provincie limb", L("Limburgo", "Limburg", "Limbourg", "Limburgo")),
    ("wb", "provincie waal", L("Brabante Valón", "Walloon Brabant", "Brabant wallon", "Brabante Vallone")),
    ("ha", "provincie hene", L("Henao", "Hainaut", "Hainaut", "Hainaut")),
    ("lg", "provincie luik", L("Lieja", "Liège", "Liège", "Liegi")),
    ("lx", "provincie luxe", L("Luxemburgo (provincia)", "Luxembourg (province)", "Luxembourg (province)", "Lussemburgo (provincia)")),
    ("na", "provincie name", L("Namur", "Namur", "Namur", "Namur")),
]

# ganado (cabezas) y superficies (are -> ha) del censo agrario: codigo Statbel -> nombres
LIVESTOCK = {
    "A100000": L("Bovinos (total)", "Cattle (total)", "Bovins (total)", "Bovini (totale)"),
    "A110000": L("Bovinos menores de 1 año", "Cattle under 1 year", "Bovins de moins d’un an", "Bovini sotto 1 anno"),
    "A120000": L("Bovinos de 1 a 2 años", "Cattle 1 to under 2 years", "Bovins de 1 à moins de 2 ans", "Bovini da 1 a 2 anni"),
    "A130000": L("Bovinos de 2 años y más", "Cattle 2 years and over", "Bovins de 2 ans et plus", "Bovini da 2 anni in su"),
    "A132100": L("Novillas de 2 años y más", "Heifers 2 years and over", "Génisses de 2 ans et plus", "Manze da 2 anni in su"),
    "A132210": L("Vacas lecheras", "Dairy cows", "Vaches laitières", "Vacche da latte"),
    "A132220": L("Vacas nodrizas", "Suckler cows", "Vaches allaitantes", "Vacche nutrici"),
    "A200000": L("Cerdos (total)", "Pigs (total)", "Porcs (total)", "Suini (totale)"),
    "A210000": L("Lechones de menos de 20 kg", "Piglets under 20 kg", "Porcelets de moins de 20 kg", "Suinetti sotto 20 kg"),
    "A250000": L("Cerdos de 20 kg y de cebo", "Pigs from 20 kg and fattening pigs", "Porcs de 20 kg et porcs à l’engrais", "Suini da 20 kg e da ingrasso"),
    "A242000": L("Cerdas reproductoras", "Breeding sows", "Truies", "Scrofe"),
    "A600000": L("Aves de corral (total)", "Poultry (total)", "Volailles (total)", "Pollame (totale)"),
    "A601100": L("Gallinas ponedoras", "Laying hens", "Poules pondeuses", "Galline ovaiole"),
    "A602000": L("Pollos de carne", "Broilers", "Poulets de chair", "Polli da carne"),
}
AREAS = {
    "C000001": L("Superficie agrícola utilizada", "Utilised agricultural area", "Superficie agricole utilisée", "Superficie agricola utilizzata"),
    "C100000": L("Tierras de cultivo", "Arable land", "Terres arables", "Seminativi"),
    "C110000": L("Cereales para grano", "Cereals for grain", "Céréales pour le grain", "Cereali da granella"),
    "C110110": L("Trigo de invierno", "Winter wheat", "Froment d’hiver", "Frumento invernale"),
    "C110200": L("Espelta", "Spelt", "Épeautre", "Farro"),
    "C110410": L("Cebada de invierno", "Winter barley", "Orge d’hiver", "Orzo invernale"),
    "C110600": L("Maíz grano", "Grain maize", "Maïs grain", "Mais da granella"),
    "C110700": L("Triticale", "Triticale", "Triticale", "Triticale"),
    "C120100": L("Remolacha azucarera", "Sugar beet", "Betteraves sucrières", "Barbabietola da zucchero"),
    "C120200": L("Achicoria", "Chicory", "Chicorée", "Cicoria"),
    "C120300": L("Lino", "Flax", "Lin", "Lino"),
    "C120450": L("Colza y nabina", "Rapeseed", "Colza et navette", "Colza e ravizzone"),
    "C130000": L("Patata", "Potatoes", "Pommes de terre", "Patate"),
    "C130100": L("Patata temprana", "Early potatoes", "Pommes de terre hâtives", "Patate precoci"),
    "C130200": L("Patata de conservación", "Main-crop potatoes", "Pommes de terre de conservation", "Patate da conservazione"),
    "C150300": L("Maíz forrajero", "Fodder maize", "Maïs fourrager", "Mais da foraggio"),
    "C150600": L("Praderas temporales", "Temporary grassland", "Prairies temporaires", "Prati temporanei"),
    "C170000": L("Hortalizas al aire libre", "Open-field vegetables", "Légumes de plein air", "Ortaggi in pieno campo"),
    "C171010": L("Guisantes", "Peas", "Pois", "Piselli"),
    "C171030": L("Zanahoria", "Carrots", "Carottes", "Carote"),
    "C171040": L("Cebolla", "Onions", "Oignons", "Cipolle"),
    "C171250": L("Puerro", "Leeks", "Poireaux", "Porri"),
    "C171260": L("Coles de Bruselas", "Brussels sprouts", "Choux de Bruxelles", "Cavoletti di Bruxelles"),
    "C171270": L("Coliflor", "Cauliflower", "Choux-fleurs", "Cavolfiore"),
    "C190000": L("Barbecho", "Fallow land", "Jachère", "Maggese"),
    "C220000": L("Frutales (huertos)", "Orchards", "Vergers", "Frutteti"),
    "C220100": L("Manzano", "Apple trees", "Pommiers", "Meli"),
    "C220200": L("Peral", "Pear trees", "Poiriers", "Peri"),
    "C230100": L("Viñedo", "Vines", "Vignes", "Vigneti"),
    "C300000": L("Pastos permanentes", "Permanent grassland", "Prairies permanentes", "Prati permanenti"),
    "C400000": L("Cultivos en invernadero", "Crops under glass", "Cultures sous serre", "Colture in serra"),
    "C420100": L("Tomate en invernadero", "Glasshouse tomatoes", "Tomates sous serre", "Pomodori in serra"),
    "C450500": L("Fresa en invernadero", "Glasshouse strawberries", "Fraises sous serre", "Fragole in serra"),
}
FARMS = {
    "H010000": L("Explotaciones con producción agraria", "Farms with agricultural production", "Exploitations avec production agricole", "Aziende con produzione agricola"),
}
FARM_SIZES = {
    "H013100": L("Explotaciones sin cultivo", "Farms without crops", "Exploitations sans culture", "Aziende senza colture"),
    "H013200": L("Explotaciones de 0,01 a menos de 5 ha", "Farms 0.01 to under 5 ha", "Exploitations de 0,01 à moins de 5 ha", "Aziende da 0,01 a meno di 5 ha"),
    "H013300": L("Explotaciones de 5 a menos de 10 ha", "Farms 5 to under 10 ha", "Exploitations de 5 à moins de 10 ha", "Aziende da 5 a meno di 10 ha"),
    "H013400": L("Explotaciones de 10 a menos de 15 ha", "Farms 10 to under 15 ha", "Exploitations de 10 à moins de 15 ha", "Aziende da 10 a meno di 15 ha"),
    "H013500": L("Explotaciones de 15 a menos de 20 ha", "Farms 15 to under 20 ha", "Exploitations de 15 à moins de 20 ha", "Aziende da 15 a meno di 20 ha"),
    "H013600": L("Explotaciones de 20 a menos de 30 ha", "Farms 20 to under 30 ha", "Exploitations de 20 à moins de 30 ha", "Aziende da 20 a meno di 30 ha"),
    "H013700": L("Explotaciones de 30 a menos de 50 ha", "Farms 30 to under 50 ha", "Exploitations de 30 à moins de 50 ha", "Aziende da 30 a meno di 50 ha"),
    "H013800": L("Explotaciones de 50 ha y más", "Farms 50 ha and over", "Exploitations de 50 ha et plus", "Aziende da 50 ha in su"),
}

# cosecha (L06, nombres en frances tal como los publica Statbel) -> es, en, fr, it
CROPS = {
    "froment d'hiver": L("Trigo de invierno", "Winter wheat", "Froment d’hiver", "Frumento invernale"),
    "froment de printemps": L("Trigo de primavera", "Spring wheat", "Froment de printemps", "Frumento primaverile"),
    "epeautre": L("Espelta", "Spelt", "Épeautre", "Farro"),
    "seigle (y c. méteil)": L("Centeno", "Rye", "Seigle (y c. méteil)", "Segale"),
    "orge d'hiver": L("Cebada de invierno", "Winter barley", "Orge d’hiver", "Orzo invernale"),
    "orge de printemps": L("Cebada de primavera", "Spring barley", "Orge de printemps", "Orzo primaverile"),
    "orge de brasserie": L("Cebada cervecera", "Malting barley", "Orge de brasserie", "Orzo da birra"),
    "avoine (y c. mélanges de céréales d'été)": L("Avena", "Oats", "Avoine", "Avena"),
    "triticale": L("Triticale", "Triticale", "Triticale", "Triticale"),
    "maïs grain": L("Maíz grano", "Grain maize", "Maïs grain", "Mais da granella"),
    "autres céréales": L("Otros cereales", "Other cereals", "Autres céréales", "Altri cereali"),
    "betteraves sucrières": L("Remolacha azucarera", "Sugar beet", "Betteraves sucrières", "Barbabietola da zucchero"),
    "lin textile": L("Lino textil", "Fibre flax", "Lin textile", "Lino tessile"),
    "colza et navette": L("Colza y nabina", "Rapeseed", "Colza et navette", "Colza e ravizzone"),
    "pommes de terre hâtives": L("Patata temprana", "Early potatoes", "Pommes de terre hâtives", "Patate precoci"),
    "pommes de terre de conservation": L("Patata de conservación", "Main-crop potatoes", "Pommes de terre de conservation", "Patate da conservazione"),
    "plants de pommes de terre": L("Patata de siembra", "Seed potatoes", "Plants de pommes de terre", "Patate da semina"),
    "pois fourragers récoltées en secs": L("Guisante forrajero (seco)", "Field peas (dry)", "Pois fourragers récoltés secs", "Pisello proteico (secco)"),
    "fèves et féveroles récoltées en secs": L("Habas y haboncillos (secos)", "Field and broad beans (dry)", "Fèves et féveroles récoltées sèches", "Fave e favette (secche)"),
    "autres légumineuses récoltées en secs": L("Otras leguminosas (secas)", "Other pulses (dry)", "Autres légumineuses récoltées sèches", "Altre leguminose (secche)"),
    "betteraves fourragères": L("Remolacha forrajera", "Fodder beet", "Betteraves fourragères", "Barbabietola da foraggio"),
    "maïs fourrager": L("Maíz forrajero", "Fodder maize", "Maïs fourrager", "Mais da foraggio"),
}
CROP_GEO = {"flamande": L("Flandes", "Flanders", "Flandre", "Fiandre"), "wallonne": L("Valonia", "Wallonia", "Wallonie", "Vallonia"), "bruxelles": L("Bruselas-Capital", "Brussels-Capital", "Bruxelles-Capitale", "Bruxelles-Capitale")}

# IPC (COICOP): codigo -> es, en, it (el frances sale del propio fichero)
CPI = {
    "CPI": L("Índice general de precios al consumo", "All-items consumer price index", "Indice des prix à la consommation", "Indice generale dei prezzi al consumo"),
    "01": L("Alimentos y bebidas no alcohólicas", "Food and non-alcoholic beverages", "Produits alimentaires et boissons non alcoolisées", "Alimentari e bevande analcoliche"),
    "01.1": L("Alimentos", "Food", "Produits alimentaires", "Prodotti alimentari"),
    "01.1.1": L("Cereales y derivados", "Cereals and cereal products", "Céréales et produits à base de céréales", "Cereali e derivati"),
    "01.1.1.3": L("Pan y productos de panadería", "Bread and bakery products", "Pain et produits de boulangerie", "Pane e prodotti da forno"),
    "01.1.2": L("Carne y despojos", "Meat and other parts of slaughtered animals", "Viandes et autres parties d’animaux abattus", "Carni e altre parti di animali macellati"),
    "01.1.2.2": L("Carne fresca, refrigerada o congelada", "Fresh, chilled or frozen meat", "Viande fraîche, congelée ou surgelée", "Carne fresca, refrigerata o congelata"),
    "01.1.2.2.1": L("Carne de vacuno y ternera", "Beef and veal", "Viande de bœuf et de veau", "Carne di manzo e vitello"),
    "01.1.2.2.2": L("Carne de cerdo", "Pork", "Viande de porc", "Carne di maiale"),
    "01.1.2.2.4": L("Carne de ave", "Poultry", "Volaille", "Pollame"),
    "01.1.3": L("Pescado y marisco", "Fish and seafood", "Poisson et autres fruits de mer", "Pesce e frutti di mare"),
    "01.1.4": L("Leche, lácteos y huevos", "Milk, dairy products and eggs", "Lait, produits laitiers et œufs", "Latte, latticini e uova"),
    "01.1.4.1": L("Leche cruda y entera", "Raw and whole milk", "Lait cru et entier", "Latte crudo e intero"),
    "01.1.4.5": L("Queso", "Cheese", "Fromage", "Formaggio"),
    "01.1.4.6": L("Yogur y similares", "Yoghurt and similar products", "Yaourt et produits similaires", "Yogurt e prodotti simili"),
    "01.1.4.8": L("Huevos", "Eggs", "Œufs", "Uova"),
    "01.1.5": L("Aceites y grasas", "Oils and fats", "Huiles et graisses", "Oli e grassi"),
    "01.1.5.2": L("Mantequilla y grasas lácteas", "Butter and other milk-derived fats", "Beurre et autres matières grasses du lait", "Burro e altri grassi del latte"),
    "01.1.6": L("Fruta y frutos secos", "Fruit and nuts", "Fruits et fruits à coque", "Frutta e frutta a guscio"),
    "01.1.7": L("Hortalizas, tubérculos y legumbres", "Vegetables, tubers and pulses", "Légumes, tubercules et légumes secs", "Ortaggi, tuberi e legumi"),
    "01.1.7.5": L("Tubérculos (patata)", "Tubers (potatoes)", "Tubercules (pomme de terre)", "Tuberi (patate)"),
    "01.1.8": L("Azúcar, confitería y postres", "Sugar, confectionery and desserts", "Sucre, confiserie et desserts", "Zucchero, dolciumi e dessert"),
    "01.2": L("Bebidas no alcohólicas", "Non-alcoholic beverages", "Boissons non alcoolisées", "Bevande analcoliche"),
}

# pesca: nombre ingles de la fila -> es, en, fr, it
FISH = {
    "Overall total": L("Total desembarcado", "Total landings", "Total des débarquements", "Totale sbarcato"),
    "Demersal fishes": L("Peces demersales", "Demersal fish", "Poissons démersaux", "Pesci demersali"),
    "Pelagic fishes": L("Peces pelágicos", "Pelagic fish", "Poissons pélagiques", "Pesci pelagici"),
    "Crustaceans and molluscs": L("Crustáceos y moluscos", "Crustaceans and molluscs", "Crustacés et mollusques", "Crostacei e molluschi"),
    "Sole": L("Lenguado", "Sole", "Sole", "Sogliola"),
    "Plaice": L("Solla", "Plaice", "Plie", "Passera di mare"),
    "Turbot": L("Rodaballo", "Turbot", "Turbot", "Rombo chiodato"),
    "Brill": L("Rémol", "Brill", "Barbue", "Rombo liscio"),
    "Ray": L("Raya", "Ray", "Raie", "Razza"),
    "Anglerfish": L("Rape", "Anglerfish", "Lotte", "Rana pescatrice"),
    "Atlantic cod": L("Bacalao del Atlántico", "Atlantic cod", "Cabillaud", "Merluzzo bianco"),
    "Hake": L("Merluza", "Hake", "Merlu", "Nasello"),
    "Whiting": L("Merlán", "Whiting", "Merlan", "Merlano"),
    "Lemon sole": L("Mendo limón", "Lemon sole", "Limande-sole", "Sogliola limone"),
    "Megrim": L("Gallo", "Megrim", "Cardine", "Rombo giallo"),
    "Seabass": L("Lubina", "Sea bass", "Bar", "Branzino"),
    "Surmullet": L("Salmonete", "Red mullet", "Rouget barbet", "Triglia"),
    "Tub gurnard": L("Bejel", "Tub gurnard", "Grondin perlon", "Capone gallinella"),
    "Flounder": L("Platija", "Flounder", "Flet", "Passera pianuzza"),
    "Dab": L("Limanda", "Dab", "Limande", "Limanda"),
    "Mackerel": L("Caballa", "Mackerel", "Maquereau", "Sgombro"),
    "Herring": L("Arenque", "Herring", "Hareng", "Aringa"),
    "Shrimp": L("Camarón gris", "Brown shrimp", "Crevette grise", "Gamberetto grigio"),
    "Norway lobster": L("Cigala", "Norway lobster", "Langoustine", "Scampo"),
    "Edible crab": L("Buey de mar", "Edible crab", "Tourteau", "Granchio commestibile"),
    "Cuttlefish": L("Sepia", "Cuttlefish", "Seiche", "Seppia"),
    "Whelk": L("Buccino", "Whelk", "Buccin", "Buccino"),
    "Shellfish": L("Moluscos bivalvos", "Shellfish", "Coquillages", "Molluschi bivalvi"),
}
PORTS = {"total": L("todos los puertos", "all ports", "tous les ports", "tutti i porti")}

# lacteos: clave -> (es, en, fr, it)
DAIRY = {
    "milk": L("Leche de consumo (total)", "Drinking milk (total)", "Lait de consommation (total)", "Latte alimentare (totale)"),
    "whole": L("Leche entera (pasteurizada, esterilizada, UHT)", "Whole milk (pasteurised, sterilised, UHT)", "Lait entier (pasteurisé, stérilisé, UHT)", "Latte intero (pastorizzato, sterilizzato, UHT)"),
    "semi": L("Leche semidesnatada", "Semi-skimmed milk", "Lait demi-écrémé", "Latte parzialmente scremato"),
    "skim": L("Leche desnatada", "Skimmed milk", "Lait écrémé", "Latte scremato"),
    "cream-hi": L("Nata de más del 29 % de grasa", "Cream over 29 % fat", "Crème à plus de 29 % de matière grasse", "Panna oltre il 29 % di grassi"),
    "cream-lo": L("Nata de hasta el 29 % de grasa", "Cream up to 29 % fat", "Crème jusqu’à 29 % de matière grasse", "Panna fino al 29 % di grassi"),
    "yoghurt": L("Yogur", "Yoghurt", "Yaourt", "Yogurt"),
    "fermented": L("Leches fermentadas", "Fermented milk", "Laits fermentés", "Latti fermentati"),
    "butter": L("Mantequilla tradicional", "Traditional butter", "Beurre traditionnel", "Burro tradizionale"),
    "powder-whole": L("Leche en polvo (nata, entera y semidesnatada)", "Milk powder (cream, whole and part-skimmed)", "Poudres (crème, lait entier et demi-écrémé)", "Latte in polvere (panna, intero e parzialmente scremato)"),
    "powder-skim": L("Leche desnatada en polvo", "Skimmed-milk powder", "Poudre de lait écrémé", "Latte scremato in polvere"),
    "fresh-cheese": L("Queso fresco natural", "Natural fresh cheese", "Fromage frais nature", "Formaggio fresco naturale"),
    "gouda": L("Queso Gouda", "Gouda cheese", "Fromage Gouda", "Formaggio Gouda"),
    "mozzarella": L("Mozzarella", "Mozzarella", "Mozzarella", "Mozzarella"),
    "processed": L("Queso fundido", "Processed cheese", "Fromage fondu", "Formaggio fuso"),
}

# balances de carne
MEAT_BLOCKS = {
    "Beef and veal": ("beef", L("Vacuno y ternera", "Beef and veal", "Bœuf et veau", "Manzo e vitello")),
    "Pork": ("pork", L("Cerdo", "Pork", "Porc", "Maiale")),
    "Sheepmeat and goatmeat": ("sheep", L("Ovino y caprino", "Sheepmeat and goatmeat", "Mouton et chèvre", "Ovini e caprini")),
    "Horsemeat": ("horse", L("Caballo", "Horsemeat", "Cheval", "Cavallo")),
    "Poultry": ("poultry", L("Aves", "Poultry", "Volaille", "Pollame")),
    "Other animals (game, rabbit, pigeon, buffalo, …)": ("other", L("Otros animales (caza, conejo, paloma…)", "Other animals (game, rabbit, pigeon…)", "Autres animaux (gibier, lapin, pigeon…)", "Altri animali (selvaggina, coniglio, piccione…)")),
    "Edible meat offals": ("offal", L("Despojos comestibles", "Edible offals", "Abats comestibles", "Frattaglie commestibili")),
    "GRAND TOTAL": ("total", L("Total carnes", "All meat", "Total viandes", "Totale carni")),
}
MEAT_VARS = {
    "Gross indigenous production": ("production", L("Producción bruta", "Gross indigenous production", "Production indigène brute", "Produzione indigena lorda"), "t"),
    "Net production": ("net", L("Producción neta", "Net production", "Production nette", "Produzione netta"), "t"),
    "Exports of meat and meat-based products": ("exports", L("Exportaciones de carne y productos cárnicos", "Exports of meat and meat products", "Exportations de viande et produits à base de viande", "Esportazioni di carne e prodotti a base di carne"), "t"),
    "Imports of meat and meat-based products": ("imports", L("Importaciones de carne y productos cárnicos", "Imports of meat and meat products", "Importations de viande et produits à base de viande", "Importazioni di carne e prodotti a base di carne"), "t"),
    "Apparent consumption": ("consumption", L("Consumo aparente", "Apparent consumption", "Consommation apparente", "Consumo apparente"), "t"),
    "Apparent consumption kg per capita": ("percapita", L("Consumo aparente por habitante", "Apparent consumption per capita", "Consommation apparente par habitant", "Consumo apparente pro capite"), "kg/hab."),
    "% self-sufficiency": ("selfsuff", L("Grado de autoabastecimiento", "Self-sufficiency rate", "Taux d’autoapprovisionnement", "Grado di autoapprovvigionamento"), "%"),
}
