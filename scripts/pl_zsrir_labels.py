# -*- coding: utf-8 -*-
"""Nombres en cuatro idiomas (es, en, fr, it) de las series de los boletines del ZSRIR (Polonia) que publica scripts/update-pl-zsrir.py.
Clave = texto de la cabecera del boletin (sin espacios sobrantes). Lo que no esta aqui no se publica: nunca se inventa una traduccion."""


def L(es, en, fr, it):
    return [es, en, fr, it]


CEREALS = {
    "Pszenica konsumpcyjna": ("pszenica-kons", L("Trigo de consumo (panificable)", "Food wheat", "Blé de consommation", "Frumento di consumo")),
    "Pszenica paszowa": ("pszenica-pasz", L("Trigo forrajero", "Feed wheat", "Blé fourrager", "Frumento foraggero")),
    "Żyto konsumpcyjne": ("zyto-kons", L("Centeno de consumo", "Food rye", "Seigle de consommation", "Segale di consumo")),
    "Żyto paszowe": ("zyto-pasz", L("Centeno forrajero", "Feed rye", "Seigle fourrager", "Segale foraggera")),
    "Jęczmień konsumpcyjny": ("jeczmien-kons", L("Cebada de consumo", "Food barley", "Orge de consommation", "Orzo di consumo")),
    "Jęczmień paszowy": ("jeczmien-pasz", L("Cebada forrajera", "Feed barley", "Orge fourragère", "Orzo foraggero")),
    "Jęczmień browarny": ("jeczmien-brow", L("Cebada cervecera", "Malting barley", "Orge brassicole", "Orzo da birra")),
    "Kukurydza mokra": ("kukurydza-mokra", L("Maíz húmedo", "Wet maize", "Maïs humide", "Mais umido")),
    "Kukurydza sucha": ("kukurydza-sucha", L("Maíz seco", "Dry maize", "Maïs sec", "Mais secco")),
    "Owies konsumpcyjny": ("owies-kons", L("Avena de consumo", "Food oats", "Avoine de consommation", "Avena di consumo")),
    "Owies paszowy": ("owies-pasz", L("Avena forrajera", "Feed oats", "Avoine fourragère", "Avena foraggera")),
    "Pszenżyto paszowe": ("pszenzyto-pasz", L("Triticale forrajero", "Feed triticale", "Triticale fourrager", "Triticale foraggero")),
}
WHEAT_WEEK = L("Trigo de consumo, semanal", "Food wheat, weekly", "Blé de consommation, hebdomadaire", "Frumento di consumo, settimanale")
MAIZE_WEEK = L("Maíz, semanal", "Maize, weekly", "Maïs, hebdomadaire", "Mais, settimanale")
RAPE_MONTH = L("Colza (semilla), compra, mensual", "Rapeseed (seed), purchase, monthly", "Colza (graine), achat, mensuel", "Colza (semi), acquisto, mensile")
RAPE_WEEK = L("Colza (semilla), compra, semanal", "Rapeseed (seed), purchase, weekly", "Colza (graine), achat, hebdomadaire", "Colza (semi), acquisto, settimanale")
OIL_MONTH = None

# carne (dataset 777 porcino, 1214 vacuno, 601 aves)
PIG_LIVE_W = L("Cerdo de engorde (peso vivo), semanal", "Fattening pigs (live weight), weekly", "Porcs charcutiers (poids vif), hebdomadaire", "Suini da ingrasso (peso vivo), settimanale")
PIG_LIVE_M = L("Cerdo de engorde (peso vivo), mensual", "Fattening pigs (live weight), monthly", "Porcs charcutiers (poids vif), mensuel", "Suini da ingrasso (peso vivo), mensile")
PIG_E_W = L("Canal de cerdo clase E (EUROP), semanal", "Pig carcass class E (EUROP), weekly", "Carcasse de porc classe E (EUROP), hebdomadaire", "Carcassa suina classe E (EUROP), settimanale")
BEEF_W = {
    "total": L("Bovino en total, canal", "All cattle, carcass", "Bovins en total, carcasse", "Bovini in totale, carcassa"),
    "bulls": L("Toros de 12 a 24 meses (A), canal", "Young bulls 12-24 months (A), carcass", "Jeunes bovins de 12 à 24 mois (A), carcasse", "Giovani tori da 12 a 24 mesi (A), carcassa"),
    "heifers": L("Novillas de más de 12 meses (E), canal", "Heifers over 12 months (E), carcass", "Génisses de plus de 12 mois (E), carcasse", "Giovenche oltre 12 mesi (E), carcassa"),
    "cows": L("Vacas (D), canal", "Cows (D), carcass", "Vaches (D), carcasse", "Vacche (D), carcassa"),
}
CHICKEN_W = L("Pollo broiler, precio de compra, semanal", "Broiler chicken, purchase price, weekly", "Poulet de chair, prix d'achat, hebdomadaire", "Pollo da carne, prezzo d'acquisto, settimanale")

DAIRY = {
    "butter-block": L("Mantequilla Extra en bloques", "Extra butter in blocks", "Beurre Extra en blocs", "Burro Extra in blocchi"),
    "butter-pack": L("Mantequilla Extra envasada", "Extra butter, packed", "Beurre Extra conditionné", "Burro Extra confezionato"),
    "smp": L("Leche desnatada en polvo", "Skimmed milk powder", "Lait écrémé en poudre", "Latte scremato in polvere"),
    "wmp": L("Leche entera en polvo", "Whole milk powder", "Lait entier en poudre", "Latte intero in polvere"),
    "edam": L("Queso Edam", "Edam cheese", "Fromage Edam", "Formaggio Edam"),
    "gouda": L("Queso Gouda", "Gouda cheese", "Fromage Gouda", "Formaggio Gouda"),
}
MILK_RAW_M = L("Leche cruda, parámetros estándar, mensual", "Raw milk, standard parameters, monthly", "Lait cru, paramètres standard, mensuel", "Latte crudo, parametri standard, mensile")
EGGS_PROC_W = L("Huevos para transformación, compra, semanal", "Eggs for processing, purchase, weekly", "Œufs de transformation, achat, hebdomadaire", "Uova per la trasformazione, acquisto, settimanale")
FEED = {
    "cattle": L("Pienso complementario para bovino", "Complementary feed for cattle", "Aliment complémentaire pour bovins", "Mangime complementare per bovini"),
    "poultry": L("Pienso completo para aves", "Complete feed for poultry", "Aliment complet pour volailles", "Mangime completo per pollame"),
    "pig": L("Pienso completo para porcino", "Complete feed for pigs", "Aliment complet pour porcs", "Mangime completo per suini"),
}
