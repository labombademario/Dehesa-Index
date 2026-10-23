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
