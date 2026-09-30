#!/usr/bin/env python3
"""Dehesa Index automated news pipeline.

RSS/Atom (direct feeds + Google News queries) -> normalize -> classify (en/es/fr/it)
-> score -> data/news.json, js/news-index.js (per product, used by Precios),
js/news-feed.js (flat list, used by Noticias) and data/news-status.json (per-feed health).

Headlines are never translated or invented: each item keeps its original text and a
`lang` tag. Stdlib only.
"""
from __future__ import annotations
import hashlib, html, json, re, unicodedata, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]; DATA = ROOT / "data"; JS = ROOT / "js"
DATA.mkdir(exist_ok=True)
DAYS = 14            # ventana de antigüedad
MAX_ITEMS = 400      # tope en news.json
MAX_FEED = 300       # tope en js/news-feed.js (página Noticias)
MAX_PER_FEED = 40    # máximo por feed antes de deduplicar
MAX_PER_PUBLISHER = 18
INDEX_PER_KEY = 25
UA = "DehesaIndex-NewsBot/1.0 (+https://dehesaindex.com)"

_HL = {"en": ("en-US", "US", "US:en"), "es": ("es", "ES", "ES:es"), "fr": ("fr", "FR", "FR:fr"),
       "it": ("it", "IT", "IT:it"), "es419": ("es-419", "AR", "AR:es-419")}

def google(q, lang="en", gl=None):
    hl, g, ceid = _HL[lang]
    if gl:
        g = gl; ceid = f"{gl}:{hl.split('-')[0]}"
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": q + " when:14d", "hl": hl, "gl": g, "ceid": ceid})

def F(source, region, url, lang="en", general=False, pub=False):
    """source label, default region, url, language, general-interest feed (needs a product hit),
    pub = Google topical query whose real publisher is read from each item."""
    return dict(source=source, region=region, url=url, lang=lang, general=general, pub=pub)

FEEDS = [
    # ── Agencias y prensa económica (vía Google News, sus RSS bloquean bots) ──
    F("Reuters", "global", google("site:reuters.com agriculture commodities farmers fertilizer corn wheat soybean dairy")),
    F("Reuters", "global", google("site:reuters.com energy oil diesel agriculture fertilizer")),
    F("Reuters", "global", google("site:reuters.com cattle hogs poultry avian flu African swine fever beef pork")),
    F("Associated Press", "global", google("site:apnews.com agriculture commodities farmers fertilizer corn wheat soybean dairy")),
    F("AFP", "global", google("site:afp.com agriculture commodities food fertilizer grains dairy")),
    F("EFE", "global", google("site:efe.com agricultura cereales trigo maiz soja fertilizantes leche energia comercio"), "es"),
    F("EFEAgro", "eu", google("site:efeagro.com precios cereales vacuno porcino leche fertilizantes"), "es"),
    F("Bloomberg", "global", google("site:bloomberg.com agriculture commodities grains fertilizer soybean corn wheat dairy")),
    F("Financial Times", "global", google("site:ft.com agriculture commodities food grains fertilizer energy trade")),
    F("Wall Street Journal", "us", google("site:wsj.com agriculture commodities farmers grains fertilizer energy")),
    F("CNBC", "us", google("site:cnbc.com agriculture commodities grains fertilizer oil food")),
    F("POLITICO", "us", google("site:politico.com agriculture farm bill USDA tariffs agriculture")),
    F("POLITICO Europe", "eu", google("site:politico.eu agriculture farmers CAP Mercosur trade fertilizer")),
    F("Euractiv", "eu", google("site:euractiv.com agriculture CAP food trade fertilizer energy")),
    F("Xinhua", "global", google("site:english.news.cn agriculture grains food fertilizer trade soybean corn wheat")),
    F("Nikkei Asia", "global", google("site:asia.nikkei.com rice wheat soybean grain fertilizer food prices")),
    F("South China Morning Post", "global", google("site:scmp.com soybean grain pork corn China imports food")),
    F("Financial Post", "ca", google("site:financialpost.com wheat canola grain farmers Canada agriculture")),
    F("Globe and Mail", "ca", google("site:theglobeandmail.com grain canola wheat farmers Canada agriculture")),

    # ── Prensa especializada agro ──
    F("DTN", "us", google("site:dtnpf.com agriculture grains fertilizer energy livestock markets")),
    F("AgWeb", "us", google("site:agweb.com agriculture corn soybean wheat fertilizer dairy livestock")),
    F("Brownfield", "us", google("site:brownfieldagnews.com corn soybean wheat cattle hogs markets")),
    F("Agri-Pulse", "us", google("site:agri-pulse.com farm bill trade USDA agriculture policy")),
    F("Farm Progress", "us", google("site:farmprogress.com agriculture corn soybean wheat fertilizer dairy feed")),
    F("Successful Farming", "us", google("site:agriculture.com farming corn soybean wheat fertilizer markets")),
    F("World Grain", "global", google("site:world-grain.com grains wheat corn soybean rice trade supply")),
    F("Feed Strategy", "global", google("site:feedstrategy.com animal feed grains soybean meal corn wheat dairy")),
    F("Feedstuffs", "us", google("site:feedstuffs.com feed grain livestock poultry dairy markets")),
    F("Dairy Herd", "us", google("site:dairyherd.com dairy milk feed fertilizer energy markets")),
    F("Hoard's Dairyman", "us", google("site:hoards.com dairy milk prices butter cheese markets")),
    F("Pig Progress", "global", google("site:pigprogress.net pork pig prices African swine fever feed markets")),
    F("The Pig Site", "global", google("site:thepigsite.com pig pork prices disease markets")),
    F("WATTAgNet", "global", google("site:wattagnet.com poultry chicken eggs avian influenza markets")),
    F("Western Producer", "ca", google("site:producer.com wheat canola grain cattle markets Canada")),
    F("RealAgriculture", "ca", google("site:realagriculture.com wheat canola corn soybean markets Canada")),
    F("Fastmarkets", "global", google("site:fastmarkets.com agriculture grains oilseeds biofuels feedstocks sugar fertilizer")),
    F("S&P Global", "global", google("site:spglobal.com agriculture food commodities grains fertilizer soybean sugar biofuels")),
    F("Argus Media", "global", google("site:argusmedia.com agriculture fertilizer grains biofuels vegetable oils")),
    F("FoodNavigator", "global", google("site:foodnavigator.com food commodity prices agriculture dairy sugar grains supply")),
    F("Farmers Weekly", "uk", google("site:fwi.co.uk agriculture farmers crops wheat barley fertilizer dairy trade")),
    F("Farmers Guardian", "uk", google("site:fginsight.com agriculture crops wheat barley fertilizer dairy livestock")),
    F("Manitoba Co-operator", "ca", google("site:manitobacooperator.ca grain canola wheat cattle hogs prices Prairies")),
    F("Alberta Farmer Express", "ca", google("site:albertafarmexpress.ca grain canola wheat cattle prices Alberta")),
    F("Grainews", "ca", google("site:grainews.ca grain canola wheat markets Prairies")),
    F("Canadian Cattlemen", "ca", google("site:canadiancattlemen.ca cattle beef feeder prices markets")),
    F("Farmtario", "ca", google("site:farmtario.com corn soybean wheat hogs dairy Ontario prices")),
    F("Country Guide", "ca", google("site:country-guide.ca farm markets grain cattle canola prices")),
    F("Canadian Grain Commission", "ca", google("site:grainscanada.gc.ca grain exports canola wheat quality")),
    F("Agriculture and Agri-Food Canada", "ca", google("site:agriculture.canada.ca agriculture markets grains livestock prices outlook")),
    F("Statistics Canada", "ca", google("site:statcan.gc.ca farm product prices crops livestock")),
    F("Dairy Farmers of Canada", "ca", google("Canada dairy farmers milk price supply management"), "en"),
    F("", "ca", google("Canada farmers canola wheat prices Saskatchewan Alberta", gl="CA"), pub=True),
    F("", "ca", google("Canada cattle hogs prices beef Alberta Ontario", gl="CA"), pub=True),
    F("Agriland", "eu", google("site:agriland.ie agriculture dairy grain fertilizer trade")),
    F("Irish Farmers Journal", "eu", google("site:farmersjournal.ie beef dairy grain prices fertilizer")),
    F("AGRA", "eu", google("site:agra.fr agriculture PAC céréales lait engrais commerce", "fr"), "fr"),
    F("Agroeuropa", "eu", google("site:agroeuropa.es agroalimentario Unión Europea PAC cereales lácteos fertilizantes comercio", "es"), "es"),
    F("Agronotizie", "eu", google("site:agronotizie.imagelinenetwork.com cereali grano mais prezzi mercato", "it"), "it"),
    F("Agricolae", "eu", google("site:agricolae.eu cereali latte suini prezzi mercato", "it"), "it"),
    F("Interempresas", "eu", google("site:interempresas.net agricultura cereales precios fertilizantes", "es"), "es"),
    F("ABC Rural", "global", google("site:abc.net.au/news/rural agriculture grain wheat cattle dairy fertilizer")),
    F("The Land", "global", google("site:theland.com.au agriculture grain wheat cattle dairy fertilizer")),
    F("Farm Online", "global", google("site:farmonline.com.au grain wheat canola cattle markets Australia")),

    # ── Reino Unido ──
    F("AHDB", "uk", google("site:ahdb.org.uk agriculture wheat barley dairy livestock cereals market")),
    F("NFU", "uk", google("site:nfuonline.com farming agriculture food trade policy wheat dairy livestock")),

    # ── Instituciones y organismos oficiales (Google, sus RSS no están accesibles) ──
    F("USDA", "us", google("site:usda.gov/news agriculture corn wheat soybean dairy fertilizer livestock")),
    F("USDA FAS", "us", google("site:fas.usda.gov export sales grain oilseeds trade GAIN report")),
    F("USDA ERS", "us", google("site:ers.usda.gov agriculture commodity food prices farm costs trade")),
    F("USDA APHIS", "us", google("site:aphis.usda.gov avian influenza animal disease livestock import")),
    F("European Commission", "eu", google("site:agriculture.ec.europa.eu agriculture agri-food trade cereals dairy fertilizer", gl="BE")),
    F("FAO", "global", google("site:fao.org news agriculture food prices cereals fertilizer livestock")),
    F("OECD", "global", google("site:oecd.org agriculture trade commodity food fertilizer farm policy")),
    F("World Bank", "global", google("site:worldbank.org commodity prices food security fertilizer agriculture")),
    F("IEA", "global", google("site:iea.org oil gas energy agriculture fertilizer food")),
    F("International Grains Council", "global", google("site:igc.int grain wheat maize rice soybean market supply trade")),
    F("WOAH", "global", google("site:woah.org animal disease avian influenza African swine fever foot-and-mouth")),

    # ── RSS directos (comprobados con probe-news; el pipeline sigue funcionando si alguno cae) ──
    F("Defra", "uk", "https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs.atom", "en", general=True),
    F("WTO", "global", "https://www.wto.org/library/rss/latest_news_e.xml", "en", general=True),
    F("EIA", "us", "https://www.eia.gov/rss/todayinenergy.xml", "en", general=True),
    F("European Commission", "eu", "https://ec.europa.eu/commission/presscorner/api/rss?language=en", "en", general=True),
    F("Agriland", "eu", "https://www.agriland.ie/feed/", "en"),
    F("Farmdoc Daily", "us", "https://farmdocdaily.illinois.edu/feed", "en"),
    F("Farm Policy News", "us", "https://farmpolicynews.illinois.edu/feed/", "en"),
    F("Beef Central", "global", "https://www.beefcentral.com/feed/", "en"),
    F("Grain Central", "global", "https://www.graincentral.com/feed/", "en"),
    F("ABC Rural", "global", "https://www.abc.net.au/news/feed/2942460/rss.xml", "en", general=True),
    F("Hindu BusinessLine", "global", "https://www.thehindubusinessline.com/economy/agri-business/feeder/default.rss", "en", general=True),
    F("World Grain", "global", "https://www.world-grain.com/rss", "en"),
    F("Hoard's Dairyman", "us", "https://hoards.com/rss", "en"),
    F("Farmers Guardian", "uk", "https://www.fginsight.com/rss", "en"),
    F("UkrAgroConsult", "global", "https://ukragroconsult.com/en/news/feed/", "en"),
    F("Latifundist", "global", "https://latifundist.com/en/rss", "en"),
    F("Agroinformación", "eu", "https://agroinformacion.com/feed/", "es"),
    F("Efeagro", "eu", "https://efeagro.com/feed/", "es", general=True),
    F("Agropopular", "eu", "https://www.agropopular.com/feed/", "es"),
    F("Agrodigital", "eu", "https://www.agrodigital.com/feed/", "es"),
    F("Agronews Castilla y León", "eu", "https://www.agronewscastillayleon.com/feed", "es", general=True),
    F("Infocampo", "global", "https://www.infocampo.com.ar/feed/", "es", general=True),
    F("Terre-net", "eu", "https://www.terre-net.fr/rss", "fr"),
    F("Web-agri", "eu", "https://www.web-agri.fr/rss", "fr"),
    F("La France Agricole", "eu", "https://www.lafranceagricole.fr/rss", "fr"),
    F("Terra e Vita", "eu", "https://terraevita.edagricole.it/feed/", "it"),
    F("Agronotizie", "eu", "https://agronotizie.imagelinenetwork.com/rss", "it"),

    # ── Cobertura global por temas (el editor se lee de cada noticia) ──
    F("", "global", google("Black Sea wheat exports Ukraine Russia grain corridor"), pub=True),
    F("", "global", google("Brazil soybean corn crop exports CONAB harvest"), pub=True),
    F("", "global", google("Argentina wheat soybean corn exports farmers"), pub=True),
    F("", "global", google("China soybean corn wheat imports tariffs grain purchases"), pub=True),
    F("", "global", google("India wheat rice sugar export monsoon crop"), pub=True),
    F("", "global", google("Australia Canada wheat canola crop forecast harvest"), pub=True),
    F("", "global", google("avian influenza African swine fever foot-and-mouth bluetongue outbreak livestock"), pub=True),
    F("", "global", google("fertilizer prices urea potash phosphate supply"), pub=True),
    F("", "global", google("grain shipping freight Panama Canal Red Sea Mississippi River barge"), pub=True),
    F("", "global", google("El Nino La Nina drought crop weather harvest"), pub=True),
    F("", "global", google("sugar prices Brazil India cane crop"), pub=True),
    F("", "global", google("palm oil sunflower oil rapeseed vegetable oil prices"), pub=True),
    F("", "global", google("global dairy trade GDT milk powder butter prices"), pub=True),
    F("", "global", google("rice prices exports Thailand Vietnam India"), pub=True),
    F("", "us", google("USDA WASDE crop production report corn soybeans"), pub=True),
    F("", "us", google("farm bill farmer aid tariffs USDA agriculture"), pub=True),
    F("", "us", google("biofuel ethanol biodiesel soybean oil renewable fuel standard"), pub=True),
    F("", "us", google("cattle beef prices herd cattle futures"), pub=True),
    F("", "us", google("hog prices pork exports lean hogs"), pub=True),
    F("", "us", google("egg prices poultry bird flu chicken"), pub=True),
    F("", "us", google("corn soybean wheat futures CBOT prices"), pub=True),
    F("", "eu", google("EU Mercosur agriculture farmers trade deal"), pub=True),
    F("", "eu", google("EU CAP reform budget farmers Commission"), pub=True),
    F("", "eu", google("EU Ukraine agricultural imports quotas farmers"), pub=True),
    F("", "eu", google("Euronext wheat rapeseed maize prices MATIF"), pub=True),
    F("", "uk", google("UK farmers wheat harvest prices AHDB"), pub=True),
    F("", "uk", google("UK farming policy Defra food prices"), pub=True),
    F("", "eu", google("precios cereales trigo maíz cebada lonja", "es"), "es", pub=True),
    F("", "eu", google("precios vacuno porcino cordero lonja", "es"), "es", pub=True),
    F("", "eu", google("PAC ayudas agricultores ganaderos Ministerio de Agricultura", "es"), "es", pub=True),
    F("", "eu", google("gripe aviar peste porcina africana lengua azul dermatosis nodular", "es"), "es", pub=True),
    F("", "eu", google("precio fertilizantes abonos urea agricultores", "es"), "es", pub=True),
    F("", "eu", google("sequía cosecha cereal España campaña", "es"), "es", pub=True),
    F("", "eu", google("precio leche vaca ganaderos lácteos industria", "es"), "es", pub=True),
    F("", "global", google("precios soja maíz trigo Argentina Brasil exportaciones", "es419"), "es", pub=True),
    F("", "eu", google("prix blé maïs colza marché céréales", "fr"), "fr", pub=True),
    F("", "eu", google("prix lait viande bovine porc marché éleveurs", "fr"), "fr", pub=True),
    F("", "eu", google("grippe aviaire peste porcine fièvre catarrhale dermatose nodulaire", "fr"), "fr", pub=True),
    F("", "eu", google("prezzi grano mais mercato cereali", "it"), "it", pub=True),
    F("", "eu", google("prezzi latte suini bovini mercato allevatori", "it"), "it", pub=True),
    F("", "eu", google("influenza aviaria peste suina africana lingua blu dermatite nodulare", "it"), "it", pub=True),
]

# ─────────────────────────── clasificación multilingüe ───────────────────────────
# Prefijo "it:" / "fr:" / "es:" / "en:" = el término solo cuenta si la noticia está en ese idioma.
PRODUCTS = {
 "maiz": ["corn", "maize", "maiz", "maïs", "it:mais"],
 "trigo": ["wheat", "trigo", "ble", "blé", "frumento", "grano tenero", "grano duro", "durum"],
 "soja": ["soybean", "soy", "soja", "soia"],
 "arroz": ["rice", "arroz", "riz", "riso", "paddy"],
 "cebada": ["barley", "cebada", "orge", "orzo", "malt"],
 "colza": ["rapeseed", "canola", "colza", "sunflower", "girasol", "tournesol", "girasole"],
 "azucar": ["sugar", "sugarcane", "azucar", "sucre", "zucchero"],
 "leche": ["milk", "dairy", "butter", "cheese", "whey", "leche", "lacteo", "mantequilla", "queso", "lait", "laitier", "beurre", "fromage", "latte", "latticini", "burro", "formaggio"],
 "vaca": ["cattle", "beef", "cow", "calves", "vacuno", "bovin", "bovino", "ternera", "boeuf", "bœuf", "vache", "veau", "manzo", "vitello", "feeder cattle"],
 "cerdo": ["pork", "hog", "pig", "swine", "cerdo", "porcino", "porc", "suino", "suini", "maiale"],
 "cordero": ["lamb", "sheep", "ovino", "cordero", "ovejas", "mouton", "agneau", "ovin", "agnello", "ovini"],
 "pollo": ["poultry", "chicken", "broiler", "pollo", "avicola", "avicultura", "volaille", "poulet", "pollame", "turkey"],
 "huevos": ["egg", "eggs", "huevo", "huevos", "oeuf", "oeufs", "uovo", "uova"],
 "ganado": ["livestock", "ganado", "ganaderia", "ganadero", "betail", "elevage", "eleveur", "bestiame", "allevament", "allevator", "farmers' livestock"],
 "oliva": ["olive", "olives", "aceite de oliva", "olio", "huile d'olive", "aceituna"],
 "fertilizantes": ["fertilizer", "fertiliser", "urea", "potash", "ammonia", "ammonium", "phosphate", "fertilizante", "abono", "abonos", "engrais", "concime", "concimi", "fertilizzant", "nitrogen", "nitrato"],
 "diesel": ["diesel", "gasoil", "gasoleo", "gazole", "gasolio"],
 "energia": ["crude", "oil price", "natural gas", "brent", "petroleum", "energy prices", "petroleo", "petrole", "gas natural", "prezzo del petrolio", "energie", "energia", "energy"],
 "pienso": ["animal feed", "compound feed", "feed prices", "soybean meal", "pienso", "piensos", "aliment pour betail", "mangime", "mangimi", "feed"],
 "costes": ["input cost", "farm cost", "production cost", "costes de produccion", "costes", "cout de production", "couts", "costi di produzione"],
 "pac": ["common agricultural policy", "cap reform", "cap funding", "cap payments", "cap budget", "farm bill", "es:pac", "fr:pac", "it:pac", "politica agricola", "politique agricole"],
}
TOPICS = {
 "clima": ["weather", "rain", "drought", "flood", "heat wave", "heatwave", "frost", "el nino", "la nina", "climate", "wildfire", "sequia", "lluvia", "ola de calor", "helada", "granizo", "secheresse", "pluie", "canicule", "grele", "siccita", "maltempo", "gelo", "grandine", "ondata di caldo"],
 "comercio": ["tariff", "trade", "export", "import", "china", "customs", "embargo", "quota", "mercosur", "sanction", "arancel", "exportacion", "importacion", "comercio", "aranceles", "echanges", "exportation", "importation", "douane", "droits de douane", "dazi", "commercio", "esportazion", "importazion"],
 "oferta": ["harvest", "crop", "production", "yield", "supply", "stocks", "planting", "acreage", "output", "forecast", "cosecha", "produccion", "siembra", "cultivo", "rendimiento", "recolte", "rendement", "semis", "semina", "raccolto", "resa", "produzione", "campagna"],
 "precios": ["price", "prices", "futures", "rally", "slump", "precio", "precios", "cotizacion", "cotizaciones", "lonja", "prix", "cours", "cotation", "prezzi", "prezzo", "quotazion", "borsa", "cbot", "matif", "euronext"],
 "energia": ["oil", "diesel", "natural gas", "energy", "fuel", "crude", "gasoil", "gasoleo", "carburant", "gazole", "carburante", "gasolio", "energia", "energie"],
 "costes": ["input cost", "cost of", "costs", "inflation", "fertilizer", "coste", "costes", "inflacion", "cout", "couts", "inflation", "costo", "costi"],
 "politica": ["government", "policy", "minister", "commission", "regulation", "reform", "farm bill", "legislation", "gobierno", "ministerio", "ministro", "politica", "regulacion", "reforma", "ley", "gouvernement", "ministre", "reglement", "governo", "ministero", "regolamento", "legge"],
 "sanidad": ["avian flu", "avian influenza", "bird flu", "swine fever", "foot-and-mouth", "foot and mouth", "bluetongue", "lumpy skin", "disease", "outbreak", "quarantine", "gripe aviar", "peste porcina", "fiebre aftosa", "lengua azul", "dermatosis nodular", "brote", "sanitario", "grippe aviaire", "peste porcine", "fievre aphteuse", "fievre catarrhale", "dermatose nodulaire", "epizootie", "influenza aviaria", "peste suina", "afta epizootica", "lingua blu", "dermatite nodulare", "focolaio"],
 "ayudas": ["subsidy", "subsidies", "farm aid", "bailout", "compensation", "support package", "ayuda", "ayudas", "subvencion", "subvenciones", "indemnizacion", "aide", "aides", "subvention", "indemnisation", "aiuti", "sussidi", "contributi", "indennizz"],
}
# Temas que por sí solos justifican una noticia de un medio agrario
STRONG_TOPICS = {"sanidad", "oferta", "clima"}

BLOCK_HINTS = {
 "us": ["united states", "u.s.", "usa", "usda", "iowa", "illinois", "indiana", "kansas", "nebraska", "midwest", "corn belt", "washington", "estados unidos", "etats-unis", "stati uniti", "eeuu", "ee. uu.", "ee.uu."],
 "uk": ["united kingdom", "u.k.", "britain", "british", "england", "scotland", "wales", "northern ireland", "london", "defra", "ahdb", "nfu", "reino unido", "royaume-uni", "regno unito"],
 "ca": ["canada", "canadian", "saskatchewan", "alberta", "manitoba", "ontario farm", "quebec", "prairies", "canola council", "aafc", "statistics canada", "canadá", "canadien", "canadese"],
 "eu": ["european union", "eu ", "europe", "european", "brussels", "spain", "spanish", "france", "french", "germany", "german", "italy", "italian", "ireland", "poland", "netherlands", "espana", "espanol", "union europea", "bruselas", "francia", "alemania", "italia", "irlanda", "polonia", "union europeenne", "bruxelles", "allemagne", "unione europea", "bruxelles", "europa", "europe", "castilla", "andalucia", "cataluna", "aragon", "extremadura", "galicia", "lombardia", "veneto", "bretagne", "normandie"],
}
GLOBAL_HINTS = ["brazil", "brasil", "argentina", "china", "chinese", "india", "australia", "ukraine", "ukrainian", "russia", "russian", "black sea", "kazakhstan", "vietnam", "thailand", "indonesia", "malaysia", "egypt", "turkey", "africa", "japan", "mexico", "paraguay", "uruguay", "ucrania", "rusia", "mar negro", "mer noire", "ucraina", "cina", "giappone", "japon", "inde"]

TRUSTED = {"Reuters", "Associated Press", "AFP", "EFE", "Bloomberg", "Financial Times", "Wall Street Journal", "USDA", "USDA FAS", "USDA ERS", "USDA APHIS",
           "European Commission", "FAO", "OECD", "WTO", "EIA", "IEA", "World Bank", "WOAH", "International Grains Council", "Defra", "AHDB"}

def norm(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    return "".join(c for c in s if not unicodedata.combining(c))

_rx_cache = {}
def term_rx(t):
    if t not in _rx_cache:
        core = re.escape(t)
        suf = "[a-z]{0,3}" if len(t) >= 6 else "[a-z]?"
        _rx_cache[t] = re.compile(r"(?<![a-z0-9])" + core + suf + r"(?![a-z0-9])")
    return _rx_cache[t]

def hit_count(text_n, text_raw, terms, lang):
    n = 0
    for t in terms:
        if ":" in t[:3]:
            lg, t = t.split(":", 1)
            if lg != lang: continue
        # los términos con acentos significativos (maïs, blé) se buscan en el texto original
        hay = text_raw if t != norm(t) else text_n
        if term_rx(t).search(hay): n += 1
    return n

def clean(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(s or ""))).strip()

def date_of(s):
    try: return parsedate_to_datetime(s).astimezone(timezone.utc).date().isoformat()
    except Exception:
        try: return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc).date().isoformat()
        except Exception: return None

# ─────────────────────────── parseo robusto ───────────────────────────
def _fix(raw):
    txt = raw.decode("utf-8", "ignore") if isinstance(raw, bytes) else raw
    txt = txt.lstrip("﻿ \t\r\n")
    txt = re.sub(r"&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)", "&amp;", txt)
    txt = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", txt)
    return txt

def _parse_et(txt):
    root = ET.fromstring(txt.encode("utf-8")); out = []
    for n in root.iter():
        if not n.tag.lower().endswith(("}item", "}entry")) and n.tag.lower() not in ("item", "entry"): continue
        v = {}
        for c in n:
            tag = c.tag.lower().split("}")[-1]; txt_ = clean(c.text or "")
            if tag == "title": v["title"] = txt_
            elif tag in ("pubdate", "published", "updated", "date"):
                d = date_of(txt_)
                if d and (tag != "updated" or "date" not in v): v["date"] = d
            elif tag in ("description", "summary", "content", "encoded"):
                if "desc" not in v: v["desc"] = txt_
            elif tag == "link":
                href = c.attrib.get("href")
                if href and c.attrib.get("rel", "alternate") == "alternate": v.setdefault("link", href)
                elif txt_: v.setdefault("link", txt_)
            elif tag == "source" and txt_: v["pub"] = txt_
        if v.get("title") and v.get("link"): out.append(v)
    return out

def _parse_rx(txt):
    out = []
    for m in re.finditer(r"<(item|entry)\b.*?</\1>", txt, re.S | re.I):
        blk = m.group(0)
        def g(tag):
            r = re.search(r"<(?:\w+:)?%s\b[^>]*>(.*?)</(?:\w+:)?%s>" % (tag, tag), blk, re.S | re.I)
            if not r: return ""
            s = r.group(1)
            s = re.sub(r"^\s*<!\[CDATA\[(.*?)\]\]>\s*$", r"\1", s, flags=re.S)
            return clean(s)
        link = g("link")
        if not link:
            r = re.search(r"<link\b[^>]*href=[\"']([^\"']+)[\"']", blk, re.I)
            link = r.group(1) if r else ""
        d = None
        for tag in ("pubDate", "published", "updated", "date"):
            d = date_of(g(tag)) if g(tag) else None
            if d: break
        v = {"title": g("title"), "link": link, "desc": g("description") or g("summary") or g("content")}
        if d: v["date"] = d
        if v["title"] and v["link"]: out.append(v)
    return out

def parse(raw):
    txt = _fix(raw)
    try: return _parse_et(txt)
    except ET.ParseError:
        return _parse_rx(txt)

# ─────────────────────────── enlaces con mercados ───────────────────────────
CHANNEL_PRIORITY = ["input_cost", "trade", "weather", "supply", "energy", "policy", "market_impact"]
NON_MARKET = ("costes", "pac", "energia", "diesel", "ganado", "pienso")

def build_market_links(products, topics, title, desc):
    text = norm(f"{title} {desc}")
    links = []
    def add(market, channel, relation=None):
        key = (market, channel, relation or "")
        if any((x["market"], x["channel"], x.get("relation") or "") == key for x in links): return
        links.append({"market": market, "channel": channel, "relation": relation, "direction": "uncertain"})
    market_products = [p for p in products if p not in NON_MARKET]
    if "clima" in topics:
        for p in market_products: add(p, "weather")
    if "oferta" in topics:
        for p in market_products: add(p, "supply")
    if "comercio" in topics:
        for p in market_products: add(p, "trade")
    if "sanidad" in topics:
        for p in market_products: add(p, "supply")
    fert = any(k in text for k in ("fertiliz", "urea", "nitrogen", "potash", "engrais", "abono", "concime"))
    energy = any(k in text for k in ("diesel", "energy", "oil", "crude", "fuel", "natural gas", "gasoleo", "gazole", "gasolio"))
    if fert or "fertilizantes" in products:
        for p in ("maiz", "trigo", "cebada", "arroz"): add(p, "input_cost", "fertilizer-cereals")
        if "leche" in products: add("leche", "input_cost", "fertilizer-milk")
    if energy or any(p in products for p in ("energia", "diesel")):
        for p in ("maiz", "trigo", "cebada", "arroz"): add(p, "input_cost", "energy-cereals")
        if "leche" in products: add("leche", "input_cost", "energy-milk")
    if "energia" in topics and not energy: add("energia", "energy")
    if "politica" in topics or "ayudas" in topics:
        for p in market_products: add(p, "policy")
    if not links:
        for p in market_products[:4]: add(p, "market_impact")
    return sorted(links, key=lambda x: (CHANNEL_PRIORITY.index(x["channel"]) if x["channel"] in CHANNEL_PRIORITY else 99, x["market"]))

def classify(title, desc, source_region, lang, general):
    raw = f"{title} {desc}".lower(); text = norm(raw)
    hits = {p: hit_count(text, raw, terms, lang) for p, terms in PRODUCTS.items()}
    # Los términos genéricos solo cuentan si no hay nada más específico
    products = [p for p, v in sorted(hits.items(), key=lambda x: x[1], reverse=True) if v]
    topics = [t for t, terms in TOPICS.items() if hit_count(text, raw, terms, lang)]
    specific = [p for p in products if p not in ("energia", "diesel", "costes", "pac", "ganado", "pienso")]
    # Puerta de relevancia
    if general:
        if not (specific or "ganado" in products or (set(products) & {"fertilizantes", "diesel", "energia"} and "costes" in topics or "fertilizantes" in products)):
            return None
    else:
        if not products and not (set(topics) & STRONG_TOPICS): return None
    # Región
    title_n = norm(title); region = source_region
    blk = None
    for r in ("us", "uk", "eu", "ca"):
        if any(term_rx(norm(x).strip()).search(text) for x in BLOCK_HINTS[r]): blk = r; break
    glob = any(term_rx(g).search(title_n) for g in GLOBAL_HINTS)
    if source_region == "global":
        region = "global" if glob or not blk else blk
    else:
        if blk: region = blk
        elif glob: region = "global"
    score = min(100, 30 + 10 * len(products[:4]) + 6 * len(topics) + (8 if specific else 0))
    return products[:4], topics[:4], region, score

# ─────────────────────────── descarga ───────────────────────────
def fetch(feed):
    st = {"source": feed["source"] or "(temático)", "url": feed["url"][:140], "ok": False, "items": 0, "kept": 0, "error": ""}
    cutoff = (datetime.now(timezone.utc) - timedelta(days=DAYS)).date()
    rows = []
    for attempt in (1, 2):
        try:
            req = urllib.request.Request(feed["url"], headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, text/xml, */*"})
            with urllib.request.urlopen(req, timeout=25) as r: items = parse(r.read())
            st["ok"] = True; st["items"] = len(items); st["error"] = ""
            break
        except Exception as e:
            st["error"] = str(e)[:90]; items = []
    for x in items:
        d = x.get("date") or datetime.now(timezone.utc).date().isoformat()
        try:
            if datetime.fromisoformat(d).date() < cutoff: continue
        except Exception: continue
        title = x["title"]; desc = x.get("desc", "")
        pub = feed["source"]
        if "news.google.com" in feed["url"]:
            desc = ""
            if x.get("pub"):
                if feed["pub"]: pub = x["pub"]
                suffix = " - " + x["pub"]
                if title.endswith(suffix): title = title[: -len(suffix)].rstrip()
            elif feed["pub"]:
                m = re.search(r"\s-\s([^-]{2,60})$", title)
                if m: pub = m.group(1).strip(); title = title[: m.start()].rstrip()
        if not pub or len(title) < 28: continue   # páginas índice tipo "News - Dairy Herd"
        c = classify(title, desc, feed["region"], feed["lang"], feed["general"])
        if not c: continue
        products, topics, reg, score = c
        if pub in TRUSTED or feed["source"] in TRUSTED: score = min(100, score + 8)
        links = build_market_links(products, topics, title, desc)
        rows.append({
            "id": "auto-" + hashlib.sha1((pub + title + x["link"]).encode()).hexdigest()[:10],
            "date": d, "region": reg, "topic": topics[0] if topics else "", "topics": topics, "products": products,
            "source": pub, "lang": feed["lang"],
            "headline": {"en": title, "es": title, "fr": title, "it": title},
            "description": desc[:280], "url": x["link"], "relevance": score, "auto": True,
            "impactChannel": links[0]["channel"] if links else "market_impact", "marketLinks": links})
    rows.sort(key=lambda r: (r["date"], r["relevance"]), reverse=True)
    rows = rows[:MAX_PER_FEED]
    st["kept"] = len(rows)
    return rows, st

def main():
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(fetch, FEEDS))
    rows = []; status = []
    for r, st in results:
        rows.extend(r); status.append(st)
        if not st["ok"]: print(f"[WARN] {st['source']}: {st['error']}")
    # deduplicar por titular normalizado y por URL
    dedup = {}
    for x in rows:
        k = re.sub(r"[^a-z0-9]+", "", norm(x["headline"]["en"]))[:110]
        if k not in dedup or x["relevance"] > dedup[k]["relevance"]: dedup[k] = x
    ordered = sorted(dedup.values(), key=lambda x: (x["date"], x["relevance"]), reverse=True)
    # limitar cuántas noticias aporta un mismo medio para no saturar
    per = {}; rows = []
    for x in ordered:
        per[x["source"]] = per.get(x["source"], 0) + 1
        if per[x["source"]] <= MAX_PER_PUBLISHER: rows.append(x)
    rows = rows[:MAX_ITEMS]
    now = datetime.now(timezone.utc).isoformat()
    (DATA / "news.json").write_text(json.dumps({"generatedAt": now, "count": len(rows), "items": rows}, ensure_ascii=False, indent=1), encoding="utf-8")
    # índice por producto/mercado (lo usa Precios)
    idx = {}
    for x in rows:
        keys = set(x["products"]); keys.update(l["market"] for l in x.get("marketLinks", []))
        for p in sorted(keys): idx.setdefault(p, []).append(x)
    for p in idx: idx[p] = idx[p][:INDEX_PER_KEY]
    (JS / "news-index.js").write_text(
        "/* AUTO-GENERATED by scripts/update_news.py */\n(function(global){'use strict';global.DehesaNewsIndex="
        + json.dumps(idx, ensure_ascii=False, indent=1) + ";})(window);\n", encoding="utf-8")
    # lista plana compacta (la usa Noticias)
    feed = [{"id": x["id"], "d": x["date"], "r": x["region"], "l": x["lang"], "s": x["source"], "h": x["headline"]["en"],
             "x": x["description"][:220], "u": x["url"], "p": x["products"], "t": x["topics"], "v": x["relevance"]} for x in rows[:MAX_FEED]]
    (JS / "news-feed.js").write_text(
        "/* AUTO-GENERATED by scripts/update_news.py */\n(function(global){'use strict';global.DehesaNewsFeed={generatedAt:"
        + json.dumps(now) + ",items:" + json.dumps(feed, ensure_ascii=False, separators=(",", ":")) + "};})(window);\n", encoding="utf-8")
    ok = sum(1 for s in status if s["ok"]); srcs = sorted({x["source"] for x in rows})
    (DATA / "news-status.json").write_text(json.dumps({"generatedAt": now, "feedsOk": ok, "feedsTotal": len(status), "publishers": len(srcs), "feeds": status}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[OK] {len(rows)} stories · {len(srcs)} publishers · {ok}/{len(status)} feeds reachable")

if __name__ == "__main__":
    main()
