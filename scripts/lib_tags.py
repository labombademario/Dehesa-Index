"""Etiquetas de producto por texto (compartidas por el catalogo y el registro de series)."""
import re
TAGS = [('wheat', r'wheat|trigo|blé|\bble\b|frumento'), ('maize', r'maize|corn|ma[ií]z|mais'), ('barley', r'barley|cebada|orge'), ('oats', r'\boats?\b|avena'), ('rye', r'\brye\b|centeno'), ('rapeseed', r'rapeseed|canola|colza'),
        ('soy', r'soy|soja'), ('rice', r'\brice\b|arroz|riz'), ('milk', r'milk|leche|lait|dairy|l[aá]cte'), ('butter', r'butter|mantequilla|beurre'), ('cheese', r'cheese|queso|fromage'),
        ('cattle', r'cattle|beef|vacuno|bovin|calf|veal|cow|steer|heifer|bull'), ('pigs', r'\bpigs?\b|pork|porcin|cerdo|swine|hog'), ('sheep', r'sheep|lamb|ovin|cordero|goat|caprin'),
        ('poultry', r'poultry|chicken|broiler|pollo|volaille|turkey'), ('eggs', r'\beggs?\b|huevo|oeuf'), ('olive', r'olive|aceite|azeite|olio'), ('sugar', r'sugar|az[uú]car|beet|remolacha|sucre'),
        ('potato', r'potato|patata|pomme de terre'), ('fertilizer', r'fertili[sz]|urea|nitrogen|phosph|potash|abono'), ('energy', r'diesel|energy|fuel|electric|gas\b'), ('wine', r'\bwine\b|vino|vin\b'),
        ('fruit', r'fruit|apple|orange|tomato|vegetable|lettuce|hortaliza|fruta')]
TAGS = [(k, re.compile(v, re.I)) for k, v in TAGS]
def tags(label): return [k for k, rx in TAGS if rx.search(label)]
