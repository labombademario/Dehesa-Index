# -*- coding: utf-8 -*-
"""Frases de notas de la API sobre indices de precios (Defra, BLS, USDA NASS) y avisos de 'indice, no precio'.
Mismo contrato que api_notes_i18n.py: devuelve la frase en el idioma i (0 en, 1 fr, 2 it) o None si algun termino no esta en el glosario."""
import re

DEF_ITEMS = {  # termino -> (en, fr, it)
 'cebada': ('barley', 'orge', 'orzo'), 'cerdos': ('pigs', 'porcs', 'suini'), 'colza': ('rapeseed', 'colza', 'colza'),
 'energía y lubricantes': ('energy and lubricants', 'énergie et lubrifiants', 'energia e lubrificanti'),
 'fertilizantes y enmiendas': ('fertilisers and soil improvers', 'engrais et amendements', 'fertilizzanti e ammendanti'),
 'ganado vacuno y terneros': ('cattle and calves', 'bovins et veaux', 'bovini e vitelli'), 'huevos': ('eggs', 'œufs', 'uova'),
 'leche': ('milk', 'lait', 'latte'), 'ovino y corderos': ('sheep and lambs', 'ovins et agneaux', 'ovini e agnelli'),
 'piensos': ('feed', 'aliments pour animaux', 'mangimi'), 'trigo': ('wheat', 'blé', 'frumento')}
PRICE = {'precios percibidos': ('prices received', 'prix perçus', 'prezzi percepiti'), 'precios pagados': ('prices paid', 'prix payés', 'prezzi pagati')}
RX = [
 (re.compile(r'^Defra \(Open Government Licence v3\.0\): Agricultural Price Index del Reino Unido \((.+), (precios percibidos|precios pagados)\), base 2020=100\.$'),
  lambda m, i: ('Defra (Open Government Licence v3.0): UK Agricultural Price Index (%s, %s), base 2020=100.', 'Defra (Open Government Licence v3.0) : indice des prix agricoles du Royaume-Uni (%s, %s), base 2020=100.', 'Defra (Open Government Licence v3.0): indice dei prezzi agricoli del Regno Unito (%s, %s), base 2020=100.')[i] % (DEF_ITEMS[m.group(1)][i], PRICE[m.group(2)][i]) if m.group(1) in DEF_ITEMS else None),
 (re.compile(r'^BLS Producer Price Index \((.+), serie (WPU\d+)\), base 1982=100, sin ajuste estacional\.$'),
  lambda m, i: ('BLS Producer Price Index (%s, series %s), base 1982=100, not seasonally adjusted.', 'BLS Producer Price Index (%s, série %s), base 1982=100, non désaisonnalisé.', 'BLS Producer Price Index (%s, serie %s), base 1982=100, non destagionalizzato.')[i] % ({'cereales (grains)': ('grains', 'céréales (grains)', 'cereali (grains)'), 'leche cruda': ('raw milk', 'lait cru', 'latte crudo')}[m.group(1)][i], m.group(2)) if m.group(1) in ('cereales (grains)', 'leche cruda') else None),
 (re.compile(r'^USDA NASS \(Agricultural Prices\): indice de precios pagados por los agricultores de EE\. UU\. \((combustibles|fertilizantes \(totales, incluida cal y enmiendas\))\), base 2011=100\.$'),
  lambda m, i: ('USDA NASS (Agricultural Prices): index of prices paid by U.S. farmers (%s), base 2011=100.', 'USDA NASS (Agricultural Prices) : indice des prix payés par les agriculteurs américains (%s), base 2011=100.', 'USDA NASS (Agricultural Prices): indice dei prezzi pagati dagli agricoltori statunitensi (%s), base 2011=100.')[i] % ({'combustibles': ('fuels', 'carburants', 'carburanti'), 'fertilizantes (totales, incluida cal y enmiendas)': ('fertilisers (total, including lime and soil amendments)', 'engrais (total, chaux et amendements compris)', 'fertilizzanti (totale, inclusi calce e ammendanti)')}[m.group(1)][i])),
]
FIX = {
 'Es un índice de precios, no un precio en libras.': ('It is a price index, not a price in pounds.', 'Il s’agit d’un indice de prix, pas d’un prix en livres.', 'È un indice di prezzi, non un prezzo in sterline.'),
 'Es un indice de precios, no un precio en dolares.': ('It is a price index, not a price in dollars.', 'Il s’agit d’un indice de prix, pas d’un prix en dollars.', 'È un indice di prezzi, non un prezzo in dollari.'),
 'Es un indice de precios de productor, no un precio en dolares.': ('It is a producer price index, not a price in dollars.', 'Il s’agit d’un indice des prix à la production, pas d’un prix en dollars.', 'È un indice dei prezzi alla produzione, non un prezzo in dollari.'),
}

def translate_idx(s, i):
    if s in FIX: return FIX[s][i]
    if re.match(r'^apri_pi_\w+; EU27_2020; nominal agricultural price index, 2020=100\.$', s): return s
    for rx, fn in RX:
        m = rx.match(s)
        if m: return fn(m, i)
    return None
