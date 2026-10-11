"""Etiquetas de producto por texto (compartidas por el catalogo y el registro de series)."""
import re
TAGS = [('wheat', r'wheat|trigo|blé|\bble\b|frumento'), ('maize', r'maize|corn|ma[ií]z|mais'), ('barley', r'barley|cebada|orge'), ('oats', r'\boats?\b|avena'), ('rye', r'\brye\b|centeno'), ('rapeseed', r'rapeseed|canola|colza|\brape\b|rape and turnip'),
        ('soy', r'soy|soja'), ('rice', r'\brice\b|arroz|riz'), ('milk', r'milk|leche|lait|dairy|l[aá]cte|\bcream\b'), ('butter', r'butter|mantequilla|beurre'), ('cheese', r'cheese|queso|fromage|\bcheddar\b|\bedam\b|\bemmental\b|\bgouda\b'),
        ('cattle', r'cattle|beef|vacuno|bovin|calf|calves|veal|\bcows?\b|steer|heifer|\bbull|novillo|ternera|vaca\b'), ('pigs', r'\bpigs?\b|pork|pigmeat|porcin|cerd[oa]|swine|\bhogs?\b|\bsows?\b|piglet'), ('sheep', r'sheep|lamb|ovin|cordero|goat|caprin|\brams?\b|\bewes?\b'),
        ('poultry', r'poultry|chicken|broiler|pollo|volaille|turkey|\bducks?\b|\bgeese\b|\bhens?\b|gallina'), ('eggs', r'\beggs?\b|huevo|oeuf|laying hens?|ponedora'), ('olive', r'olive|aceite|azeite|olio'), ('sugar', r'sugar|az[uú]car|beet|remolacha|sucre'),
        ('potato', r'potato|patata|pomme de terre'), ('fertilizer', r'fertili[sz]|urea|nitrogen|phosph|potash|abono|ammoni|nitrate|\bnpk\b'), ('energy', r'diesel|energy|fuel|electric|gas\b|motor spirit|petrol|crude|gasoline|gasoil|propane'), ('wine', r'\bwines?\b|vino|vin\b'),
        ('fruit', r'fruit|apple|orange|tomato|vegetable|lettuce|hortaliza|fruta|almond|pecan|walnut|pistachio|grapefruit|lemon|strawberr|blueberr|cranberr|peach|onion|mushroom')]
TAGS = [(k, re.compile(v, re.I)) for k, v in TAGS]
# el grupo del catalogo tambien dice de que producto va la serie cuando la etiqueta solo nombra el articulo (limones, zanahorias...)
GROUP_TAGS = {'prices_fv': ['fruit']}
def tags(label, group=None):
    out = [k for k, rx in TAGS if rx.search(label)]
    for t in GROUP_TAGS.get(group, []):
        if t not in out: out.append(t)
    return out
