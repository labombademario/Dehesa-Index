# -*- coding: utf-8 -*-
"""Nombres en cuatro idiomas (es, en, fr, it) de las series de Paises Bajos (CBS) que publica scripts/update-nl-cbs-more.py.
Clave = codigo del CBS (o clave de tema). Si una clave no esta aqui, la serie se publica con el nombre neerlandes del CBS en los cuatro idiomas (nunca se inventa una traduccion)."""


def L(es, en, fr, it):
    return [es, en, fr, it]


PROVINCES = {
    "NL01": L("Países Bajos", "Netherlands", "Pays-Bas", "Paesi Bassi"),
    "PV20": L("Groninga", "Groningen", "Groningue", "Groninga"),
    "PV21": L("Frisia", "Friesland", "Frise", "Frisia"),
    "PV22": L("Drente", "Drenthe", "Drenthe", "Drenthe"),
    "PV23": L("Overijssel", "Overijssel", "Overijssel", "Overijssel"),
    "PV24": L("Flevoland", "Flevoland", "Flevoland", "Flevoland"),
    "PV25": L("Güeldres", "Gelderland", "Gueldre", "Gheldria"),
    "PV26": L("Utrecht", "Utrecht", "Utrecht", "Utrecht"),
    "PV27": L("Holanda Septentrional", "North Holland", "Hollande-Septentrionale", "Olanda Settentrionale"),
    "PV28": L("Holanda Meridional", "South Holland", "Hollande-Méridionale", "Olanda Meridionale"),
    "PV29": L("Zelanda", "Zeeland", "Zélande", "Zelanda"),
    "PV30": L("Brabante Septentrional", "North Brabant", "Brabant-Septentrional", "Brabante Settentrionale"),
    "PV31": L("Limburgo", "Limburg", "Limbourg", "Limburgo"),
}

FARM_TYPES = {
    "T001061": L("Todas las explotaciones", "All farm types", "Toutes les exploitations", "Tutte le aziende"),
    "A009481": L("Cultivos herbáceos", "Arable farms", "Grandes cultures", "Seminativi"),
    "A009482": L("Cereales, oleaginosas y proteaginosas", "Cereal, oilseed and protein-crop farms", "Céréales, oléagineux et protéagineux", "Cereali, oleaginose e proteaginose"),
    "A009483": L("Patata para almidón", "Starch-potato farms", "Pommes de terre féculières", "Patata da amido"),
    "A009484": L("Hortalizas en cultivo herbáceo", "Arable vegetable farms", "Légumes en grande culture", "Ortaggi in pieno campo da seminativo"),
    "A009485": L("Herbáceos con forrajeras", "Arable farms growing mainly fodder crops", "Grandes cultures surtout fourragères", "Seminativi con foraggere"),
    "A009486": L("Otros cultivos herbáceos", "Other arable farms", "Autres grandes cultures", "Altri seminativi"),
    "A009487": L("Horticultura", "Horticulture farms", "Horticulture", "Orticoltura"),
    "A009488": L("Hortalizas bajo cristal", "Glasshouse vegetable farms", "Légumes sous serre", "Ortaggi in serra"),
    "A009489": L("Flor cortada", "Cut-flower farms", "Fleurs coupées", "Fiori recisi"),
    "A009490": L("Plantas de maceta y de temporada", "Pot and bedding-plant farms", "Plantes en pot et à massif", "Piante in vaso e da aiuola"),
    "A009491": L("Otros invernaderos", "Other glasshouse farms", "Autres serres", "Altre serre"),
    "A009492": L("Hortalizas al aire libre", "Open-field vegetable farms", "Légumes de plein champ", "Ortaggi in pieno campo"),
    "A009493": L("Bulbos de flor", "Flower-bulb farms", "Bulbes à fleurs", "Bulbi da fiore"),
    "A009494": L("Setas y champiñones", "Mushroom farms", "Champignons", "Funghi"),
    "A009495": L("Viveros de árboles", "Tree nurseries", "Pépinières", "Vivai di alberi"),
    "A009496": L("Otra horticultura", "Other horticulture farms", "Autres exploitations horticoles", "Altra orticoltura"),
    "A009497": L("Cultivos permanentes", "Permanent-crop farms", "Cultures permanentes", "Colture permanenti"),
    "A009498": L("Viñedo", "Vineyards", "Vignobles", "Vigneti"),
    "A009499": L("Fruticultura", "Fruit farms", "Arboriculture fruitière", "Frutticoltura"),
    "A009500": L("Otros cultivos permanentes", "Other permanent-crop farms", "Autres cultures permanentes", "Altre colture permanenti"),
    "A009501": L("Ganado de pastoreo", "Grazing-livestock farms", "Herbivores", "Erbivori al pascolo"),
    "A009502": L("Vacuno de leche", "Dairy farms", "Exploitations laitières", "Aziende da latte"),
    "A009503": L("Terneros de carne blanca", "Veal-calf farms", "Veaux de boucherie", "Vitelli a carne bianca"),
    "A009504": L("Otro vacuno", "Other cattle farms", "Autres bovins", "Altri bovini"),
    "A009505": L("Ovino", "Sheep farms", "Ovins", "Ovini"),
    "A009506": L("Caprino", "Goat farms", "Caprins", "Caprini"),
    "A009507": L("Caballos y ponis", "Horse and pony farms", "Chevaux et poneys", "Cavalli e pony"),
    "A009508": L("Pastoreo con forrajeras", "Grazing livestock with mainly fodder crops", "Herbivores avec surtout des fourrages", "Erbivori con foraggere"),
    "A009509": L("Otro ganado de pastoreo", "Other grazing-livestock farms", "Autres herbivores", "Altri erbivori"),
    "A009510": L("Ganado intensivo (cerdos y aves)", "Intensive livestock (pigs and poultry)", "Élevages hors sol (porcs et volailles)", "Allevamenti intensivi (suini e avicoli)"),
    "A009511": L("Cría de cerdas", "Sow-breeding farms", "Élevage de truies", "Allevamento di scrofe"),
    "A009512": L("Cerdos de engorde", "Fattening-pig farms", "Porcs à l’engrais", "Suini da ingrasso"),
    "A009513": L("Otro porcino", "Other pig farms", "Autres élevages porcins", "Altri suini"),
    "A009514": L("Gallinas ponedoras (huevo de consumo)", "Laying-hen farms (table eggs)", "Poules pondeuses (œufs de consommation)", "Galline ovaiole (uova da consumo)"),
    "A009515": L("Pollos de carne", "Broiler farms", "Poulets de chair", "Polli da carne"),
    "A009516": L("Otras aves", "Other poultry farms", "Autres volailles", "Altri avicoli"),
    "A009517": L("Otro ganado intensivo", "Other intensive livestock farms", "Autres élevages hors sol", "Altri allevamenti intensivi"),
    "A009518": L("Combinación de cultivos", "Crop combinations", "Associations de cultures", "Combinazioni di colture"),
    "A009520": L("Combinación de ganaderías", "Livestock combinations", "Associations d’élevages", "Combinazioni di allevamenti"),
}
# grupos principales (para la tabla provincia x grupo)
FARM_GROUPS = ["T001061", "A009481", "A009487", "A009497", "A009501", "A009510"]

# 81302NED: clave de tema -> (id, nombre, unidad, bloque)
GLASS_AREA = [
    ("TuinbouwOnderGlasTotaal_328", "glass-total", L("Horticultura bajo cristal, total", "Glasshouse horticulture, total", "Horticulture sous serre, total", "Orticoltura in serra, totale")),
    ("GlasgroentenTotaal_361", "glass-veg", L("Hortalizas bajo cristal", "Glasshouse vegetables", "Légumes sous serre", "Ortaggi in serra")),
    ("TomatenTotaal_372", "tomato", L("Tomate bajo cristal", "Glasshouse tomatoes", "Tomates sous serre", "Pomodori in serra")),
    ("PaprikaSTotaal_367", "pepper", L("Pimiento bajo cristal", "Glasshouse peppers", "Poivrons sous serre", "Peperoni in serra")),
    ("Komkommers_366", "cucumber", L("Pepino bajo cristal", "Glasshouse cucumbers", "Concombres sous serre", "Cetrioli in serra")),
    ("AardbeienTotaal_363", "strawberry-glass", L("Fresa bajo cristal", "Glasshouse strawberries", "Fraises sous serre", "Fragole in serra")),
    ("OverigeGlasgroenten_376", "veg-other-glass", L("Otras hortalizas bajo cristal", "Other glasshouse vegetables", "Autres légumes sous serre", "Altri ortaggi in serra")),
    ("FruitOnderGlasTotaal_357", "fruit-glass", L("Fruta bajo cristal", "Glasshouse fruit", "Fruits sous serre", "Frutta in serra")),
    ("BloemkwekerijgewassenTotaal_329", "flowers-glass", L("Flor y planta ornamental bajo cristal", "Glasshouse flowers and ornamentals", "Floriculture sous serre", "Floricoltura in serra")),
    ("SnijbloemenTotaal_336", "cut-glass", L("Flor cortada bajo cristal", "Glasshouse cut flowers", "Fleurs coupées sous serre", "Fiori recisi in serra")),
    ("Rozen_346", "roses", L("Rosas bajo cristal", "Glasshouse roses", "Roses sous serre", "Rose in serra")),
    ("Chrysanten_340", "chrysanthemum", L("Crisantemos bajo cristal", "Glasshouse chrysanthemums", "Chrysanthèmes sous serre", "Crisantemi in serra")),
    ("Tulpen_347", "tulip-glass", L("Tulipanes bajo cristal", "Glasshouse tulips", "Tulipes sous serre", "Tulipani in serra")),
    ("PotplantenTotaal_333", "pot-plants", L("Plantas de maceta", "Pot plants", "Plantes en pot", "Piante in vaso")),
    ("BoomkwekerijEnVastePlantenTotaal_354", "nursery-glass", L("Vivero y plantas vivaces bajo cristal", "Glasshouse nursery stock and perennials", "Pépinière et vivaces sous serre", "Vivaio e perenni in serra")),
]
OPEN_AREA = [
    ("TuinbouwOpenGrondTotaal_162", "open-total", L("Horticultura al aire libre, total", "Open-field horticulture, total", "Horticulture de plein champ, total", "Orticoltura in pieno campo, totale")),
    ("BloembollenEnKnollenTotaal_163", "bulbs", L("Bulbos y tubérculos de flor", "Flower bulbs and tubers", "Bulbes et tubercules à fleurs", "Bulbi e tuberi da fiore")),
    ("Tulpen_171", "tulips", L("Tulipanes (bulbo)", "Tulips (bulbs)", "Tulipes (bulbes)", "Tulipani (bulbi)")),
    ("BloemkwekerijgewassenTotaal_174", "flowers-open", L("Flor y planta ornamental al aire libre", "Open-field flowers and ornamentals", "Floriculture de plein champ", "Floricoltura in pieno campo")),
    ("SnijbloemenTotaal_175", "cut-open", L("Flor cortada al aire libre", "Open-field cut flowers", "Fleurs coupées de plein champ", "Fiori recisi in pieno campo")),
    ("BoomkwekerijEnVastePlantenTotaal_187", "nursery-open", L("Viveros y plantas vivaces", "Tree nurseries and perennials", "Pépinières et vivaces", "Vivai e perenni")),
    ("FruitOpenGrondTotaal_197", "fruit-open", L("Fruta al aire libre", "Open-field fruit", "Fruits de plein champ", "Frutta in pieno campo")),
    ("PitEnSteenvruchtenTotaal_203", "pome-stone", L("Pepita y hueso (manzana, pera, cereza…)", "Pome and stone fruit (apple, pear, cherry…)", "Fruits à pépins et à noyau", "Frutta a seme e a nocciolo")),
    ("KleinfruitTotaal_198", "berries", L("Frutos rojos y bayas", "Soft fruit and berries", "Petits fruits", "Piccoli frutti")),
    ("TuinbouwgroentenTotaal_213", "veg-open", L("Hortalizas al aire libre", "Open-field vegetables", "Légumes de plein champ", "Ortaggi in pieno campo")),
    ("AardbeienTotaal_214", "strawberry-open", L("Fresa al aire libre", "Open-field strawberries", "Fraises de plein champ", "Fragole in pieno campo")),
    ("AspergesTotaal_219", "asparagus", L("Espárrago", "Asparagus", "Asperges", "Asparagi")),
    ("SluitkoolTotaal_235", "cabbage", L("Repollo (col cerrada)", "Headed cabbage", "Choux pommés", "Cavoli cappucci")),
]
# 80783NED (estructura por tipo de explotacion, solo total nacional): clave -> (id, nombre, unidad)
OTHER_HORT = [
    ("Champignons_60", "mushroom-area", L("Champiñón: superficie de cultivo", "Mushroom growing area", "Champignons : surface de culture", "Champignon: superficie coltivata"), "m2"),
    ("Champignons_69", "mushroom-farms", L("Productores de champiñón", "Mushroom growers", "Producteurs de champignons", "Produttori di champignon"), "aantal"),
    ("SubstraatverbruikPaddenstoelen_61", "mushroom-substrate", L("Sustrato usado en setas", "Substrate used for mushrooms", "Substrat utilisé pour les champignons", "Substrato usato per i funghi"), "ton"),
    ("Witloftrek_62", "witloof-area", L("Endibia forzada (witlof): superficie", "Forced chicory (witloof): area", "Endive forcée (witloof) : surface", "Cicoria forzata (witloof): superficie"), "are"),
    ("Witloftrek_71", "witloof-farms", L("Productores de endibia forzada", "Forced-chicory growers", "Producteurs d’endive forcée", "Produttori di cicoria forzata"), "aantal"),
    ("Tulpenbroei_58", "tulip-forcing", L("Forzado de tulipanes", "Tulip forcing", "Forçage de tulipes", "Forzatura di tulipani"), "1000 stuks"),
    ("Hyacintenbroei_56", "hyacinth-forcing", L("Forzado de jacintos", "Hyacinth forcing", "Forçage de jacinthes", "Forzatura di giacinti"), "1000 stuks"),
    ("Narcissenbroei_57", "narcissus-forcing", L("Forzado de narcisos", "Narcissus forcing", "Forçage de narcisses", "Forzatura di narcisi"), "1000 kg"),
    ("BollenbroeiTotaal_63", "bulb-forcing-farms", L("Explotaciones de forzado de bulbos", "Bulb-forcing farms", "Exploitations de forçage de bulbes", "Aziende di forzatura dei bulbi"), "aantal"),
]
LAND_USE = [
    ("CultuurgrondTotaal_3", "farmland", L("Suelo agrícola, total", "Farmland, total", "Terres agricoles, total", "Terreno agricolo, totale")),
    ("Akkerbouw_4", "arable", L("Cultivos herbáceos", "Arable crops", "Grandes cultures", "Seminativi")),
    ("TuinbouwOpenGrond_5", "hort-open", L("Horticultura al aire libre", "Open-field horticulture", "Horticulture de plein champ", "Orticoltura in pieno campo")),
    ("TuinbouwOnderGlas_6", "hort-glass", L("Horticultura bajo cristal", "Glasshouse horticulture", "Horticulture sous serre", "Orticoltura in serra")),
    ("GraslandEnGroenvoedergewassen_7", "grass", L("Pastos y forrajes verdes", "Grassland and green fodder", "Prairies et fourrages verts", "Prati e foraggi verdi")),
]

# 83475NED (balance de minerales de la agricultura): tema -> (id, nombre)
MIN_BALANCE = [
    ("TotaalAanvoerNaarSectorLandbouw_85", "in-total", L("Entradas a la agricultura, total", "Inputs to agriculture, total", "Apports à l’agriculture, total", "Apporti all’agricoltura, totale")),
    ("Krachtvoer_86", "in-feed", L("Entrada: piensos concentrados", "Input: concentrate feed", "Apport : aliments concentrés", "Apporto: mangimi concentrati")),
    ("Kunstmest_87", "in-fert", L("Entrada: abono mineral", "Input: chemical fertiliser", "Apport : engrais minéral", "Apporto: concime minerale")),
    ("LuchtdepositieHerkomstNietLandbouw_88", "in-dep", L("Entrada: deposición atmosférica de origen no agrario", "Input: atmospheric deposition (non-farm origin)", "Apport : dépôts atmosphériques (hors agriculture)", "Apporto: deposizione atmosferica (non agricola)")),
    ("TotaalAfvoerVanSectorLandbouw_90", "out-total", L("Salidas de la agricultura, total", "Outputs from agriculture, total", "Sorties de l’agriculture, total", "Uscite dall’agricoltura, totale")),
    ("MestafzetBuitenDeLandbouw_91", "out-manure", L("Salida: estiércol colocado fuera de la agricultura", "Output: manure placed outside agriculture", "Sortie : effluents placés hors agriculture", "Uscita: letame collocato fuori dall’agricoltura")),
    ("VastleggingInDierlijkeProductie_92", "out-animal", L("Salida: producción animal", "Output: animal products", "Sortie : productions animales", "Uscita: produzioni animali")),
    ("AfzetPlantaardigeProducten_93", "out-plant", L("Salida: productos vegetales", "Output: plant products", "Sortie : produits végétaux", "Uscita: prodotti vegetali")),
    ("TotaalVerlies_95", "loss-total", L("Pérdida total (excedente)", "Total loss (surplus)", "Perte totale (excédent)", "Perdita totale (eccedenza)")),
    ("VerliesNaarDeBodem_96", "loss-soil", L("Pérdida al suelo y al agua", "Loss to soil and water", "Perte vers le sol et l’eau", "Perdita verso suolo e acqua")),
    ("TotaalVerliesNaarLucht_97", "loss-air", L("Pérdida al aire", "Loss to air", "Perte vers l’air", "Perdita verso l’aria")),
    ("Ammoniakvervluchtiging_36", "nh3", L("Volatilización de amoníaco (ganadería)", "Ammonia volatilisation (livestock)", "Volatilisation d’ammoniac (élevage)", "Volatilizzazione di ammoniaca (allevamento)")),
    ("BenuttingMineralenLandbouw_102", "efficiency", L("Eficiencia de uso del mineral", "Mineral use efficiency", "Efficacité d’utilisation du minéral", "Efficienza d’uso del minerale")),
]
MINERALS = {"A028942": L("Nitrógeno (N)", "Nitrogen (N)", "Azote (N)", "Azoto (N)"), "A047709": L("Fósforo (P)", "Phosphorus (P)", "Phosphore (P)", "Fosforo (P)")}

# 83983NED (estiercol por tipo de explotacion): tipos y temas
MANURE_TYPES = {
    "T001061": L("Todas las explotaciones", "All farm types", "Toutes les exploitations", "Tutte le aziende"),
    "A009502": L("Vacuno de leche", "Dairy farms", "Exploitations laitières", "Aziende da latte"),
    "A009510": L("Ganado intensivo (hokdieren)", "Intensive livestock", "Élevages hors sol", "Allevamenti intensivi"),
    "B000079": L("Porcino", "Pig farms", "Élevages porcins", "Suini"),
    "B000080": L("Avicultura", "Poultry farms", "Élevages de volailles", "Avicoli"),
    "A009503": L("Terneros de carne blanca", "Veal-calf farms", "Veaux de boucherie", "Vitelli a carne bianca"),
}
MANURE_TOPICS = [
    ("TotaalMestproductie_1", "manure", L("Producción de estiércol", "Manure production", "Production d’effluents", "Produzione di letame"), "mln kg"),
    ("TotaalStikstofuitscheiding_5", "n-excr", L("Excreción de nitrógeno", "Nitrogen excretion", "Excrétion d’azote", "Escrezione di azoto"), "1 000 kg"),
    ("AmmoniakemissieN_7", "nh3", L("Emisión de amoníaco (N)", "Ammonia emission (N)", "Émission d’ammoniac (N)", "Emissione di ammoniaca (N)"), "1 000 kg"),
    ("TotaalFosfaatuitscheiding_11", "p-excr", L("Excreción de fosfato (P2O5)", "Phosphate excretion (P2O5)", "Excrétion de phosphate (P2O5)", "Escrezione di fosfato (P2O5)"), "1 000 kg"),
    ("StikstofoverschotN_18", "n-surplus", L("Excedente de nitrógeno", "Nitrogen surplus", "Excédent d’azote", "Eccedenza di azoto"), "1 000 kg"),
    ("FosfaatoverschotP205_19", "p-surplus", L("Excedente de fosfato", "Phosphate surplus", "Excédent de phosphate", "Eccedenza di fosfato"), "1 000 kg"),
]
# 83982NED (por categoria de animal, nacional)
ANIMALS = {
    "T001264": L("Total ganado", "All livestock", "Tout le cheptel", "Tutto il bestiame"),
    "A028973": L("Vacuno de leche", "Dairy cattle", "Bovins laitiers", "Bovini da latte"),
    "A028978": L("Vacuno de carne", "Beef and veal cattle", "Bovins à viande", "Bovini da carne"),
    "A028984": L("Ovino", "Sheep", "Ovins", "Ovini"),
    "A028985": L("Caprino", "Goats", "Caprins", "Caprini"),
    "A028991": L("Porcino", "Pigs", "Porcins", "Suini"),
    "A028995": L("Aves", "Poultry", "Volailles", "Avicoli"),
}
# 83655NED: estiercol fuera de la agricultura
MANURE_OUT = [
    ("TotaalAfzetBuitenDeLandbouw_1", "total", L("Total fuera de la agricultura", "Total outside agriculture", "Total hors agriculture", "Totale fuori dall’agricoltura")),
    ("MestexportNetto_2", "export", L("Exportación neta de estiércol", "Net manure export", "Exportation nette d’effluents", "Esportazione netta di letame")),
    ("Mestverwerking_5", "processing", L("Tratamiento industrial", "Manure processing", "Traitement industriel", "Trattamento industriale")),
    ("Natuurterreinen_4", "nature", L("Espacios naturales", "Nature areas", "Espaces naturels", "Aree naturali")),
    ("HobbybedrijvenEnParticulieren_3", "hobby", L("Aficionados y particulares", "Hobby farms and private users", "Amateurs et particuliers", "Hobbisti e privati")),
]
PESTICIDE_GROUPS = {
    "T001222": L("Total de materias activas", "All active substances", "Total des substances actives", "Totale sostanze attive"),
    "A028300": L("Fungicidas y bactericidas", "Fungicides and bactericides", "Fongicides et bactéricides", "Fungicidi e battericidi"),
    "A028299": L("Herbicidas y desecantes", "Herbicides and haulm killers", "Herbicides et défanants", "Erbicidi e disseccanti"),
    "A028298": L("Insecticidas y acaricidas", "Insecticides and acaricides", "Insecticides et acaricides", "Insetticidi e acaricidi"),
    "A028301": L("Molusquicidas", "Molluscicides", "Molluscicides", "Molluschicidi"),
    "A028297": L("Reguladores de crecimiento y antigerminantes", "Growth regulators and sprout suppressants", "Régulateurs de croissance et antigerminatifs", "Regolatori di crescita e antigermoglianti"),
}
RIGHTS_TOPICS = [
    ("VarkensrechtenInEenheden_1", "pig-units", L("Derechos de cerdos (unidades)", "Pig rights (units)", "Droits porcins (unités)", "Diritti suini (unità)"), "1 000 varkenseenheden"),
    ("VarkensrechtenInFosfaat_2", "pig-p", L("Derechos de cerdos (fosfato)", "Pig rights (phosphate)", "Droits porcins (phosphate)", "Diritti suini (fosfato)"), "1 000 kg fosfaat"),
    ("PluimveerechtenInEenheden_3", "poultry-units", L("Derechos de aves (unidades)", "Poultry rights (units)", "Droits avicoles (unités)", "Diritti avicoli (unità)"), "1 000 pluimvee-eenheden"),
    ("PluimveerechtenInFosfaat_4", "poultry-p", L("Derechos de aves (fosfato)", "Poultry rights (phosphate)", "Droits avicoles (phosphate)", "Diritti avicoli (fosfato)"), "1 000 kg fosfaat"),
]

# 85770NED (PPI de la industria alimentaria): codigo -> nombre
PPI_PRODUCTS = [
    ("A012508", "food", L("Alimentación (total)", "Food products (total)", "Produits alimentaires (total)", "Prodotti alimentari (totale)")),
    ("A012509", "meat-all", L("Carne y productos cárnicos", "Meat and meat products", "Viande et produits carnés", "Carne e prodotti a base di carne")),
    ("A012510", "meat", L("Carne transformada y conservada", "Processed and preserved meat", "Viande transformée et conservée", "Carne lavorata e conservata")),
    ("A012541", "poultry", L("Carne de ave transformada", "Processed poultry meat", "Viande de volaille transformée", "Carne avicola lavorata")),
    ("A012580", "fish", L("Pescado y marisco", "Fish, crustaceans and molluscs", "Poissons, crustacés et mollusques", "Pesce, crostacei e molluschi")),
    ("A012616", "fruit-veg", L("Fruta y hortalizas transformadas", "Processed fruit and vegetables", "Fruits et légumes transformés", "Frutta e ortaggi lavorati")),
    ("A012617", "potato", L("Patata transformada", "Processed potatoes", "Pommes de terre transformées", "Patate lavorate")),
    ("A012624", "juice", L("Zumos de fruta y hortalizas", "Fruit and vegetable juices", "Jus de fruits et de légumes", "Succhi di frutta e ortaggi")),
    ("A012669", "oils", L("Aceites y grasas", "Oils and fats", "Huiles et graisses", "Oli e grassi")),
    ("A012707", "margarine", L("Margarina y grasas para untar", "Margarine and spreads", "Margarine et graisses tartinables", "Margarina e grassi da spalmare")),
    ("A012710", "dairy", L("Productos lácteos", "Dairy products", "Produits laitiers", "Prodotti lattiero-caseari")),
    ("A012711", "cheese", L("Queso y otros lácteos", "Cheese and other dairy", "Fromage et autres produits laitiers", "Formaggio e altri latticini")),
    ("A012748", "icecream", L("Helados", "Ice cream", "Glaces", "Gelati")),
    ("A012750", "milling", L("Molinería, almidón y derivados", "Grain mill products and starch", "Produits de la minoterie et amidon", "Prodotti della molitoria e amido")),
    ("A012775", "starch", L("Almidón y derivados", "Starches and starch products", "Amidon et produits amylacés", "Amido e derivati")),
    ("A012793", "bakery", L("Panadería y pastas", "Bakery and pasta products", "Boulangerie et pâtes", "Prodotti da forno e paste")),
    ("A012794", "bread", L("Pan y bollería fresca", "Bread and fresh pastry", "Pain et pâtisserie fraîche", "Pane e pasticceria fresca")),
    ("A012814", "other-food", L("Otros alimentos", "Other food products", "Autres produits alimentaires", "Altri prodotti alimentari")),
    ("A012815", "sugar", L("Azúcar", "Sugar", "Sucre", "Zucchero")),
    ("A012823", "cocoa", L("Cacao, chocolate y confitería", "Cocoa, chocolate and confectionery", "Cacao, chocolat et confiserie", "Cacao, cioccolato e confetteria")),
    ("A012859", "coffee-tea", L("Café y té", "Coffee and tea", "Café et thé", "Caffè e tè")),
    ("A012880", "ready-meals", L("Platos preparados", "Prepared meals", "Plats préparés", "Piatti pronti")),
    ("A012909", "feed", L("Piensos preparados", "Prepared animal feed", "Aliments pour animaux", "Mangimi preparati")),
    ("A012910", "farm-feed", L("Piensos para ganado", "Prepared feed for farm animals", "Aliments pour animaux de ferme", "Mangimi per animali da allevamento")),
    ("A012920", "beverages", L("Bebidas", "Beverages", "Boissons", "Bevande")),
    ("A012948", "beer", L("Cerveza", "Beer", "Bière", "Birra")),
]
PPI_AREAS = [("A044074", "all", L("Todos los mercados", "All markets", "Tous marchés", "Tutti i mercati")),
             ("A044075", "domestic", L("Mercado interior", "Domestic market", "Marché intérieur", "Mercato interno")),
             ("A044076", "export", L("Exportación", "Export", "Exportation", "Esportazione"))]
# 86141NED (IPC, base 2025 = 100)
CPI_ITEMS = [
    ("CPI010000", "food-drink", L("Alimentos y bebidas sin alcohol", "Food and non-alcoholic beverages", "Alimentation et boissons non alcoolisées", "Alimentari e bevande analcoliche")),
    ("CPI011000", "food", L("Alimentos", "Food", "Produits alimentaires", "Prodotti alimentari")),
    ("CPI011100", "cereals", L("Cereales y derivados", "Cereals and cereal products", "Céréales et produits céréaliers", "Cereali e derivati")),
    ("CPI011130", "bread", L("Pan y bollería", "Bread and bakery products", "Pain et boulangerie", "Pane e prodotti da forno")),
    ("CPI011200", "meat-all", L("Carne (animales vivos y carne)", "Live animals and meat", "Viande", "Carne")),
    ("CPI011221", "beef", L("Carne de vacuno", "Beef", "Viande de bœuf", "Carne bovina")),
    ("CPI011222", "pork", L("Carne de cerdo", "Pork", "Viande de porc", "Carne suina")),
    ("CPI011224", "poultry", L("Carne de ave", "Poultry meat", "Viande de volaille", "Carne avicola")),
    ("CPI011300", "fish", L("Pescado y marisco", "Fish and seafood", "Poissons et fruits de mer", "Pesce e frutti di mare")),
    ("CPI011400", "dairy-eggs", L("Leche, lácteos y huevos", "Milk, dairy and eggs", "Lait, produits laitiers et œufs", "Latte, latticini e uova")),
    ("CPI011450", "cheese", L("Queso", "Cheese", "Fromage", "Formaggio")),
    ("CPI011480", "eggs", L("Huevos", "Eggs", "Œufs", "Uova")),
    ("CPI011500", "oils", L("Aceites y grasas", "Oils and fats", "Huiles et graisses", "Oli e grassi")),
    ("CPI011520", "butter", L("Mantequilla y grasas lácteas", "Butter and milk fats", "Beurre et matières grasses laitières", "Burro e grassi del latte")),
    ("CPI011600", "fruit", L("Fruta y frutos secos", "Fruit and nuts", "Fruits et noix", "Frutta e frutta secca")),
    ("CPI011700", "vegetables", L("Hortalizas y tubérculos", "Vegetables, tubers", "Légumes et tubercules", "Ortaggi e tuberi")),
    ("CPI011800", "sugar-sweets", L("Azúcar, confitería y postres", "Sugar, confectionery and desserts", "Sucre, confiserie et desserts", "Zucchero, dolciumi e dessert")),
    ("CPI011850", "chocolate", L("Chocolate y cacao", "Chocolate and cocoa", "Chocolat et cacao", "Cioccolato e cacao")),
    ("CPI012200", "coffee", L("Café", "Coffee", "Café", "Caffè")),
]
# 37738: hortalizas por especie
VEG = [
    ("A047746", "total", L("Hortalizas, total", "Vegetables, total", "Légumes, total", "Ortaggi, totale")),
    ("A047747", "glass", L("Hortalizas bajo cristal", "Glasshouse vegetables", "Légumes sous serre", "Ortaggi in serra")),
    ("A047748", "open", L("Hortalizas al aire libre", "Open-field vegetables", "Légumes de plein champ", "Ortaggi in pieno campo")),
    ("A042291", "tomato", L("Tomate", "Tomatoes", "Tomates", "Pomodori")),
    ("A042286", "pepper", L("Pimiento", "Peppers", "Poivrons", "Peperoni")),
    ("A042285", "cucumber", L("Pepino", "Cucumbers", "Concombres", "Cetrioli")),
    ("A042282", "aubergine", L("Berenjena", "Aubergines", "Aubergines", "Melanzane")),
    ("A042283", "courgette", L("Calabacín", "Courgettes", "Courgettes", "Zucchine")),
    ("A042340", "mushroom", L("Champiñón", "Mushrooms", "Champignons", "Champignon")),
    ("A048219", "strawberry", L("Fresa", "Strawberries", "Fraises", "Fragole")),
    ("A042319", "onion", L("Cebolla", "Onions", "Oignons", "Cipolle")),
    ("A042315", "carrot-winter", L("Zanahoria de invierno", "Winter carrots", "Carottes d’hiver", "Carote invernali")),
    ("A042312", "carrot-bunch", L("Zanahoria de manojo y de lavado", "Bunch and washed carrots", "Carottes en botte et lavées", "Carote a mazzo e lavate")),
    ("A042329", "cauliflower", L("Coliflor", "Cauliflower", "Chou-fleur", "Cavolfiore")),
    ("A042331", "broccoli", L("Brócoli", "Broccoli", "Brocoli", "Broccoli")),
    ("A042338", "white-cabbage", L("Repollo blanco", "White cabbage", "Chou blanc", "Cavolo bianco")),
    ("A042333", "sprouts", L("Col de Bruselas", "Brussels sprouts", "Choux de Bruxelles", "Cavoletti di Bruxelles")),
    ("A042307", "spinach", L("Espinaca", "Spinach", "Épinards", "Spinaci")),
    ("A042301", "leek", L("Puerro", "Leeks", "Poireaux", "Porri")),
    ("A042297", "asparagus", L("Espárrago", "Asparagus", "Asperges", "Asparagi")),
    ("A042308", "chicory", L("Endibia (witlof)", "Chicory (witloof)", "Endives (witloof)", "Cicoria (witloof)")),
    ("A042305", "iceberg", L("Lechuga iceberg", "Iceberg lettuce", "Laitue iceberg", "Lattuga iceberg")),
    ("A042317", "beetroot", L("Remolacha de mesa", "Beetroot", "Betteraves rouges", "Barbabietole rosse")),
]
# 85676NED: cultivos herbaceos, estimacion provisional frente a definitiva
CROPS = [
    ("A042170", "wheat", L("Trigo", "Wheat", "Blé", "Frumento")),
    ("A042160", "barley", L("Cebada", "Barley", "Orge", "Orzo")),
    ("A042169", "rye", L("Centeno", "Rye", "Seigle", "Segale")),
    ("A042164", "oats", L("Avena", "Oats", "Avoine", "Avena")),
    ("A042167", "grain-maize", L("Maíz grano", "Grain maize", "Maïs grain", "Mais da granella")),
    ("A042168", "silage-maize", L("Maíz forrajero", "Silage maize", "Maïs fourrager", "Mais da foraggio")),
    ("A042180", "rapeseed", L("Colza", "Rapeseed", "Colza", "Colza")),
    ("A042355", "potato", L("Patata (total)", "Potatoes (total)", "Pommes de terre (total)", "Patate (totale)")),
    ("A042356", "ware-potato", L("Patata de consumo", "Ware potatoes", "Pommes de terre de consommation", "Patate da consumo")),
    ("A042359", "seed-potato", L("Patata de siembra", "Seed potatoes", "Plants de pommes de terre", "Patate da seme")),
    ("A042362", "starch-potato", L("Patata para almidón", "Starch potatoes", "Pommes de terre féculières", "Patate da amido")),
    ("A042194", "sugar-beet", L("Remolacha azucarera", "Sugar beet", "Betterave sucrière", "Barbabietola da zucchero")),
    ("A042320", "onion", L("Cebolla de siembra", "Seed-sown onions", "Oignons de semis", "Cipolle da seme")),
]
# 83275NED / 84448NED: finanzas de las explotaciones
FIN_TOPICS = [
    ("Landbouwbedrijven_1", "farms", L("Número de explotaciones", "Number of farms", "Nombre d’exploitations", "Numero di aziende"), "aantal"),
    ("TotaalActiva_3", "assets", L("Activo total", "Total assets", "Total de l’actif", "Totale attivo"), "mln euro"),
    ("TotaalEigenVermogen_12", "equity", L("Patrimonio neto", "Equity", "Capitaux propres", "Patrimonio netto"), "mln euro"),
    ("LanglopendeSchulden_17", "debt-long", L("Deuda a largo plazo", "Long-term debt", "Dettes à long terme", "Debiti a lungo termine"), "mln euro"),
    ("KortlopendeSchulden_18", "debt-short", L("Deuda a corto plazo", "Short-term debt", "Dettes à court terme", "Debiti a breve termine"), "mln euro"),
    ("NettoOmzet_20", "turnover", L("Cifra de negocio neta", "Net turnover", "Chiffre d’affaires net", "Fatturato netto"), "mln euro"),
    ("TotaalBedrijfskosten_21", "costs", L("Costes de explotación", "Operating costs", "Charges d’exploitation", "Costi operativi"), "mln euro"),
    ("ResultaatUitGewoneBedrijfsuitoefening_31", "result", L("Resultado ordinario", "Result from ordinary activities", "Résultat courant", "Risultato ordinario"), "mln euro"),
]
FIN_TYPES = ["T001061", "A009481", "A009487", "A009497", "A009501", "A009510"]
METHODS = {"T001368": L("Agricultura (total)", "All farming", "Agriculture (total)", "Agricoltura (totale)"),
           "A043969": L("Ecológica", "Organic", "Biologique", "Biologica"),
           "A043968": L("Convencional", "Conventional", "Conventionnelle", "Convenzionale")}
GRAZING = [
    ("WeidendeDieren_4", "days", L("Días de pastoreo al año (animales que pastan)", "Grazing days per year (grazing animals)", "Jours de pâturage par an (animaux au pâturage)", "Giorni di pascolo all’anno (animali al pascolo)"), "dagen per jaar"),
    ("BedrijvenMetWeidegang_7", "farms-graze", L("Explotaciones con pastoreo", "Farms with grazing", "Exploitations avec pâturage", "Aziende con pascolo"), "%"),
    ("DierenMetWeidegang_8", "animals-graze", L("Animales con pastoreo", "Animals with grazing", "Animaux avec pâturage", "Animali con pascolo"), "%"),
    ("DagEnNachtWeiden_11", "day-night", L("Pastoreo día y noche (% de días de pastoreo)", "Day-and-night grazing (% of grazing days)", "Pâturage jour et nuit (% des jours de pâturage)", "Pascolo giorno e notte (% dei giorni di pascolo)"), "% weidedagen"),
]
EGGS = [
    ("ConsumptieEierenTotaal_1", "total", L("Huevos de consumo, total", "Table eggs, total", "Œufs de consommation, total", "Uova da consumo, totale")),
    ("ConsumptieEierenGangbaar_2", "conventional", L("Huevos convencionales", "Conventional eggs", "Œufs conventionnels", "Uova convenzionali")),
    ("ConsumptieEierenBiologisch_3", "organic", L("Huevos ecológicos", "Organic eggs", "Œufs biologiques", "Uova biologiche")),
]


# RIVM (nitrogeno en Natura 2000): grupos de sectores y paises de origen, como los nombra el RIVM
NATURA_NL = L("Países Bajos (media nacional)", "Netherlands (national average)", "Pays-Bas (moyenne nationale)", "Paesi Bassi (media nazionale)")

SECTORS = {
    "Landbouw": L("Agricultura", "Agriculture", "Agriculture", "Agricoltura"),
    "Mobiliteit": L("Movilidad y transporte", "Mobility and transport", "Mobilité et transports", "Mobilità e trasporti"),
    "Industrie": L("Industria", "Industry", "Industrie", "Industria"),
    "Huishoudens": L("Hogares", "Households", "Ménages", "Famiglie"),
    "Dienst en Bouw": L("Servicios y construcción", "Services and construction", "Services et construction", "Servizi ed edilizia"),
    "Energie": L("Energía", "Energy", "Énergie", "Energia"),
    "Overig": L("Otros", "Other", "Autres", "Altri"),
}

ORIGIN = {
    "Nederland": L("Países Bajos", "Netherlands", "Pays-Bas", "Paesi Bassi"),
    "België": L("Bélgica", "Belgium", "Belgique", "Belgio"),
    "Duitsland": L("Alemania", "Germany", "Allemagne", "Germania"),
    "Frankrijk": L("Francia", "France", "France", "Francia"),
    "Verenigd Koninkrijk": L("Reino Unido", "United Kingdom", "Royaume-Uni", "Regno Unito"),
    "Internationale zeeen": L("Mares internacionales (navegación)", "International seas (shipping)", "Mers internationales (navigation)", "Mari internazionali (navigazione)"),
    "Overige landen": L("Otros países", "Other countries", "Autres pays", "Altri paesi"),
    "-": L("Corrección de medida (ajuste del modelo)", "Measurement correction (model adjustment)", "Correction de mesure (ajustement du modèle)", "Correzione di misura (aggiustamento del modello)"),
}
