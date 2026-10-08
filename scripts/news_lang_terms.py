"""Términos de clasificación para los idiomas de prensa añadidos el 8-oct-2026:
polaco (pl), sueco (sv), finés (fi), checo (cs), eslovaco (sk), húngaro (hu), rumano (ro), búlgaro (bg), griego (el),
croata (hr), esloveno (sl), lituano (lt), letón (lv) y estonio (et).

Cada término lleva el prefijo del idioma ("pl:"), así que solo cuenta en noticias de ese idioma.
  S(lang, ...) = fragmento que se busca como subcadena (cubre declinaciones y compuestos: "pszenic" -> pszenica, pszenicy)
  W(lang, ...) = palabra con hasta 3 letras de sufijo (para palabras cortas que, como fragmento, darían falsos positivos)
Todo se normaliza igual que el texto (minúsculas, sin acentos ni signos diacríticos).
Se mantienen los términos largos y poco ambiguos: es preferible perder una noticia a colar una que no es agraria.
"""
import unicodedata


def _n(s):
    s = unicodedata.normalize("NFKD", (s or "").lower())
    return "".join(c for c in s if not unicodedata.combining(c))


def S(lang, *stems):
    return [f"{lang}:*{_n(x)}" for x in stems]


def W(lang, *words):
    return [f"{lang}:{_n(x)}" for x in words]


PRODUCTS = {k: [] for k in ("maiz", "trigo", "soja", "arroz", "cebada", "colza", "azucar", "leche", "vaca", "cerdo", "cordero", "pollo",
                            "huevos", "ganado", "oliva", "fertilizantes", "diesel", "energia", "pienso", "costes", "pac")}
TOPICS = {k: [] for k in ("clima", "comercio", "oferta", "precios", "energia", "costes", "politica", "sanidad", "ayudas")}


def P(key, *terms):
    PRODUCTS[key].extend(terms)


def T(key, *terms):
    TOPICS[key].extend(terms)


# ───────────────────────────── polaco ─────────────────────────────
P("maiz", *S("pl", "kukurydz")); P("trigo", *S("pl", "pszeni")); P("soja", *W("pl", "soja", "soi", "sojowy"))
P("arroz", *W("pl", "ryz")); P("cebada", *S("pl", "jeczmie")); P("colza", *S("pl", "rzepak", "slonecznik"))
P("azucar", *S("pl", "cukr", "buraki cukrow", "buraków cukrow")); P("leche", *S("pl", "mlek", "mleczar", "nabial"))
P("vaca", *S("pl", "bydl", "wolowin", "krow", "cielec", "cieleta", "tuczu bydla")); P("cerdo", *S("pl", "wieprzow", "trzod", "tuczni", "swinie", "swini"))
P("cordero", *W("pl", "owca", "owce", "owiec", "owcy", "owcom"), *S("pl", "jagnie", "jagniec", "baranin")); P("pollo", *S("pl", "drobiu", "drobiar", "kurczak", "brojler"))
P("huevos", *W("pl", "jaja", "jaj", "jajka", "jajek")); P("ganado", *S("pl", "hodowl", "zwierzat gospodarsk", "inwentarz"))
P("fertilizantes", *S("pl", "nawoz", "mocznik", "saletr", "azotow")); P("diesel", *S("pl", "olej napedow", "oleju napedow"))
P("energia", *S("pl", "gaz ziemny", "gazu ziemnego", "ceny energii")); P("pienso", *S("pl", "pasz")); P("costes", *S("pl", "koszty produkcji", "kosztow produkcji"))
P("pac", *S("pl", "wspolna polityka rolna", "wspolnej polityki rolnej"), *W("pl", "wpr"))
T("clima", *S("pl", "susz", "przymrozk", "gradob", "powodz", "upal", "ulew", "klimat", "nawalnic"))
T("comercio", *S("pl", "eksport", "import", "embarg", "umowa handlow", "umowy handlow", "mercosur"), *W("pl", "clo", "cla", "cel"))
T("oferta", *S("pl", "zbior", "plon", "siew", "uprawy", "uprawa", "urodzaj"))
T("precios", *W("pl", "cena", "ceny", "cen", "cenie"), *S("pl", "skup", "notowan", "cenowy", "cenowe"))
T("energia", *S("pl", "paliw", "energii", "ropy naftowej", "gazu"))
T("costes", *S("pl", "koszt", "inflacj", "drozyzn"))
T("politica", *S("pl", "rzad", "minister", "ustawa", "ustawy", "rozporzadzen", "sejm"))
T("sanidad", *S("pl", "ptasia grypa", "ptasiej grypy", "grypa ptakow", "grypy ptakow", "afrykanski pomor", "pomor swin", "pryszczyc", "choroba niebiesk", "niebieski jezyk", "ognisk"))
T("ayudas", *S("pl", "doplat", "dotacj", "subsydi", "rekompensat", "wsparci", "pomoc dla rolnik", "odszkodowan"))

# ───────────────────────────── sueco ─────────────────────────────
P("maiz", *S("sv", "majs")); P("trigo", *W("sv", "vete", "vetet")); P("soja", *S("sv", "sojabon", "sojamjol"), *W("sv", "soja"))
P("cebada", *W("sv", "korn", "kornet")); P("colza", *S("sv", "raps", "solros")); P("azucar", *S("sv", "socker"))
P("leche", *S("sv", "mjolk", "mejeri")); P("vaca", *S("sv", "notkott", "notkreatur", "kalvar", "nötkött")); P("cerdo", *S("sv", "griskott", "svinkott", "grisproduktion", "slaktgris", "grisar", "svinpest"))
P("cordero", *S("sv", "lammkott", "lamm")); P("pollo", *S("sv", "kyckling", "fjaderfa")); P("huevos", *W("sv", "agg", "aggen"))
P("ganado", *S("sv", "boskap", "djurhallning", "mjolkkor", "lantbruksdjur")); P("fertilizantes", *S("sv", "godsel", "kvave", "handelsgodsel"))
P("diesel", *S("sv", "dieselpris", "drivmedel")); P("energia", *S("sv", "naturgas", "elpris")); P("pienso", *S("sv", "foder", "kraftfoder"))
P("costes", *S("sv", "produktionskostnad")); P("pac", *S("sv", "jordbrukspolitik", "gemensamma jordbruk"), *W("sv", "gjp"))
T("clima", *S("sv", "torka", "nederbord", "oversvamning", "hetta", "frost", "regnet", "vaderlek"))
T("comercio", *S("sv", "tull", "export", "import", "handelsavtal", "handelskrig"))
T("oferta", *S("sv", "skord", "odling", "sadd", "grodan", "avkastning"))
T("precios", *S("sv", "pris", "priser", "notering", "prisfall", "prisuppgang"))
T("politica", *S("sv", "regering", "jordbruksminister", "landsbygdsminister", "riksdag", "lagforslag"))
T("sanidad", *S("sv", "fagelinfluensa", "svinpest", "klovsjuka", "blatunga", "utbrott", "smitta"))
T("ayudas", *S("sv", "stod", "bidrag", "ersattning", "subvention", "kompensation"))

# ───────────────────────────── finés ─────────────────────────────
P("maiz", *S("fi", "maissi", "maissin")); P("trigo", *S("fi", "vehna", "vehnan", "vehnä")); P("soja", *S("fi", "soija"))
P("arroz", *S("fi", "riisi", "riisin")); P("cebada", *S("fi", "ohra")); P("colza", *S("fi", "rypsi", "rapsi", "auringonkuk"))
P("azucar", *S("fi", "sokeri", "sokerijuurikas")); P("leche", *S("fi", "maito", "maidon", "meijeri", "juusto"))
P("vaca", *S("fi", "naudan", "nautatila", "lehm", "nautojen", "naudanliha")); P("cerdo", *S("fi", "sikatila", "sian", "sikojen", "porsa", "sianliha", "sikarutto"))
P("cordero", *S("fi", "lammas", "lampaa", "lampaiden")); P("pollo", *S("fi", "broileri", "kanan", "siipikarja"))
P("huevos", *S("fi", "kananmun", "munantuot")); P("ganado", *S("fi", "karjatila", "kotielain", "lihakarja", "maitotila"))
P("fertilizantes", *S("fi", "lannoite", "typpi")); P("diesel", *S("fi", "dieselin", "polttoaineen hinta")); P("energia", *S("fi", "maakaasu", "sahkon hinta"))
P("pienso", *S("fi", "rehu")); P("costes", *S("fi", "tuotantokustannus")); P("pac", *S("fi", "yhteinen maatalouspolitiikka", "maatalouspolitiik"))
T("clima", *S("fi", "kuivuus", "halla", "tulva", "helle", "sateet", "sadevesi", "myrsky"))
T("comercio", *S("fi", "tulli", "vienti", "tuonti", "kauppasopimus"))
T("oferta", *S("fi", "sato", "sadon", "kylvo", "puinti", "satoarvio"))
T("precios", *S("fi", "hinta", "hinnat", "hintojen", "hintaa"))
T("politica", *S("fi", "hallitus", "ministeri", "maatalousministeri", "eduskunta"))
T("sanidad", *S("fi", "lintuinfluenssa", "sikarutto", "suu- ja sorkkatauti", "sinikielitauti", "eläintauti", "elaintauti"))
T("ayudas", *S("fi", "tuki", "tuet", "korvaus", "avustus"))

# ───────────────────────────── checo ─────────────────────────────
P("maiz", *S("cs", "kukuric")); P("trigo", *S("cs", "psenic")); P("soja", *W("cs", "soja", "soje", "sojove"))
P("arroz", *W("cs", "ryze")); P("cebada", *S("cs", "jecmen")); P("colza", *S("cs", "repk", "slunecnic"))
P("azucar", *S("cs", "cukr")); P("leche", *S("cs", "mleko", "mleka", "mlecn", "mlyn")); P("vaca", *S("cs", "hovezi", "skot", "dojnic"))
P("cerdo", *S("cs", "veprov", "prasat", "prasec", "prasecich")); P("cordero", *S("cs", "jehn", "ovci", "ovce")); P("pollo", *S("cs", "drubez", "kurec", "kuřat"))
P("huevos", *S("cs", "vejce", "vajec")); P("ganado", *S("cs", "chov", "hospodarsk zvire")); P("fertilizantes", *S("cs", "hnojiv", "dusik"))
P("diesel", *S("cs", "nafta", "nafty")); P("pienso", *S("cs", "krmiv")); P("costes", *S("cs", "naklady na produkci"))
P("pac", *W("cs", "szp"), *S("cs", "spolecna zemedelska politika"))
T("clima", *S("cs", "sucho", "mraz", "povodn", "vedro", "kroupy", "pocasi"))
T("comercio", *S("cs", "export", "import", "dovoz", "vyvoz", "obchodni dohod"), *W("cs", "clo", "cla"))
T("oferta", *S("cs", "sklizen", "uroda", "vynos", "seti", ))
T("precios", *W("cs", "cena", "ceny", "cen", "cenu"), *S("cs", "vykup"))
T("politica", *S("cs", "vlada", "ministr", "ministerstv", "poslaneck"))
T("sanidad", *S("cs", "ptaci chripk", "mor prasat", "slintavk", "katar", "modry jazyk", "nakaz", "ohnisko"))
T("ayudas", *S("cs", "dotac", "podpor", "kompenzac", "pomoc"))

# ───────────────────────────── eslovaco ─────────────────────────────
P("maiz", *S("sk", "kukuric")); P("trigo", *S("sk", "psenic")); P("soja", *W("sk", "soja", "soje")); P("cebada", *S("sk", "jacmen"))
P("colza", *S("sk", "repk", "slnecnic")); P("azucar", *S("sk", "cukr")); P("leche", *S("sk", "mlieko", "mlieka", "mliecn"))
P("vaca", *S("sk", "hovadz", "dobytok", "dojnic")); P("cerdo", *S("sk", "bravcov", "osipan", "prasat")); P("cordero", *S("sk", "jahn", "ovci", "ovce"))
P("pollo", *S("sk", "hydina", "hydiny", "kurac")); P("huevos", *S("sk", "vajec", "vajce")); P("fertilizantes", *S("sk", "hnojiv", "dusik"))
P("diesel", *S("sk", "nafta", "nafty")); P("pienso", *S("sk", "krmiv")); P("pac", *W("sk", "spp"), *S("sk", "spolocna polnohospodarska"))
T("clima", *S("sk", "sucho", "mraz", "povodn", "horucav", "pocasie"))
T("comercio", *S("sk", "export", "import", "dovoz", "vyvoz"), *W("sk", "clo", "cla"))
T("oferta", *S("sk", "zber", "urod", "vynos", ))
T("precios", *W("sk", "cena", "ceny", "cen"), *S("sk", "vykup"))
T("politica", *S("sk", "vlada", "minister", "ministerstv"))
T("sanidad", *S("sk", "vtacia chripk", "mor osipan", "katarala", "modry jazyk", "slintacka"))
T("ayudas", *S("sk", "dotaci", "podpor", "kompenzaci", "pomoc"))

# ───────────────────────────── húngaro ─────────────────────────────
P("maiz", *S("hu", "kukoric")); P("trigo", *S("hu", "buza", "buzat", "buzaar")); P("soja", *S("hu", "szoja")); P("arroz", *S("hu", "rizs"))
P("cebada", *S("hu", "arpa", "arpat")); P("colza", *S("hu", "repce", "napraforgo")); P("azucar", *S("hu", "cukor", "cukorrepa"))
P("leche", *S("hu", "tej", "tejtermek", "tejelo")); P("vaca", *S("hu", "marha", "szarvasmarha")); P("cerdo", *S("hu", "sertes", "serteshus", "sertespestis"))
P("cordero", *S("hu", "barany", "juh")); P("pollo", *S("hu", "baromfi", "csirke")); P("huevos", *S("hu", "tojas")); P("ganado", *S("hu", "allattart", "allatallomany"))
P("fertilizantes", *S("hu", "mutragya")); P("diesel", *S("hu", "gazolaj")); P("energia", *S("hu", "foldgaz", "energiaar")); P("pienso", *S("hu", "takarmany"))
P("costes", *S("hu", "termelesi koltseg")); P("pac", *W("hu", "kap"), *S("hu", "kozos agrarpolitika"))
T("clima", *S("hu", "aszaly", "fagy", "arviz", "hoseg", "kanikula", "jegeso", "belviz"))
T("comercio", *S("hu", "export", "import", "kereskedelmi", "vamok"), *W("hu", "vam"))
T("oferta", *S("hu", "termes", "aratas", "hozam", "vetes", ))
T("precios", *S("hu", "arak", "arvaltozas", "felvasarlasi", "termeloi ar", "aremelkedes"))
T("politica", *S("hu", "kormany", "miniszter", "agrarminiszter"))
T("sanidad", *S("hu", "madarinfluenz", "madarinfluenza", "afrikai sertespestis", "koromfajas", "keknyelv", "jarvany"))
T("ayudas", *S("hu", "tamogat", "kompenzaci", "kartalanit"))

# ───────────────────────────── rumano ─────────────────────────────
P("maiz", *S("ro", "porumb")); P("trigo", *S("ro", "grau", "graul")); P("soja", *W("ro", "soia")); P("arroz", *W("ro", "orez"))
P("cebada", *W("ro", "orz", "orzul")); P("colza", *S("ro", "rapita", "floarea soarelui", "floarea-soarelui")); P("azucar", *S("ro", "zahar"))
P("leche", *S("ro", "lapte", "laptelui", "lactat", "branza")); P("vaca", *S("ro", "bovin", "carne de vita", "vaci")); P("cerdo", *S("ro", "porcin", "carne de porc", "porci", "pesta porcina"))
P("cordero", *S("ro", "ovine", "miel")); P("pollo", *S("ro", "carne de pasare", "pasari", "avicol")); P("huevos", *W("ro", "oua", "ouale"))
P("ganado", *S("ro", "zootehnic", "cresterea animalelor", "crescatori de animale")); P("fertilizantes", *S("ro", "ingrasamint", "ingrasaminte"))
P("diesel", *S("ro", "motorina")); P("energia", *S("ro", "gaze naturale")); P("pienso", *S("ro", "furaj", "nutret")); P("costes", *S("ro", "costuri de productie"))
P("pac", *W("ro", "pac"), *S("ro", "politica agricola comuna"))
T("clima", *S("ro", "seceta", "inghet", "inundat", "canicul", "grindina", "furtun"))
T("comercio", *S("ro", "export", "import", "tarife vamale", "taxe vamale", "acord comercial"))
T("oferta", *S("ro", "recolt", "randament", "semanat", "campania agricol"))
T("precios", *S("ro", "pret", "preturi", "pretul", "cotatii"))
T("politica", *S("ro", "guvern", "ministrul agriculturii", "ministerul agriculturii", "parlament"))
T("sanidad", *S("ro", "gripa aviar", "pesta porcina", "febra aftoasa", "limba albastra", "focar", "epizooti"))
T("ayudas", *S("ro", "subventi", "ajutor", "compensa", "despagub"), *W("ro", "apia"))

# ───────────────────────────── búlgaro ─────────────────────────────
P("maiz", *S("bg", "царевиц")); P("trigo", *S("bg", "пшениц", "зърно", "зърнен")); P("soja", *W("bg", "соя", "соев")); P("arroz", *W("bg", "ориз"))
P("cebada", *S("bg", "ечемик")); P("colza", *S("bg", "рапица", "слънчоглед")); P("azucar", *S("bg", "захар"))
P("leche", *S("bg", "мляко", "млечн", "сирене", "кашкавал")); P("vaca", *S("bg", "говеда", "говежд", "крави", "кравите", "едър рогат")); P("cerdo", *S("bg", "свинс", "свине", "прасета"))
P("cordero", *S("bg", "агнеш", "овце", "овцевъд")); P("pollo", *S("bg", "пилешк", "птицевъд", "птиче")); P("huevos", *S("bg", "яйца", "яйцата"))
P("ganado", *S("bg", "животновъд", "добитък", "животни")); P("fertilizantes", *S("bg", "торове", "азотн")); P("diesel", *S("bg", "дизел", "газьол"))
P("energia", *S("bg", "природен газ", "енергия")); P("pienso", *S("bg", "фураж")); P("costes", *S("bg", "производствени разходи"))
P("pac", *S("bg", "обща селскостопанска политика"), *W("bg", "осп"))
T("clima", *S("bg", "суша", "слана", "наводнен", "градушк", "горещин", "жега"))
T("comercio", *S("bg", "износ", "внос", "мито", "търговск"))
T("oferta", *S("bg", "реколта", "добив", "сеитба", "жътва"))
T("precios", *S("bg", "цена", "цени", "цените", "борса", "изкупн"))
T("politica", *S("bg", "правителство", "министър", "земеделски министър", "парламент"))
T("sanidad", *S("bg", "птичи грип", "чума по свинете", "шап", "син език", "зараза", "огнище"))
T("ayudas", *S("bg", "субсид", "подпомагане", "компенсаци", "помощ"))

# ───────────────────────────── griego ─────────────────────────────
P("maiz", *S("el", "καλαμποκ")); P("trigo", *S("el", "σιταρι", "σιτηρα", "σκληρο σιταρι", "μαλακο σιταρι")); P("soja", *S("el", "σογια", "σόγια"))
P("arroz", *S("el", "ρυζι")); P("cebada", *S("el", "κριθαρι")); P("colza", *S("el", "ελαιοκραμβ", "ηλιανθ")); P("azucar", *S("el", "ζαχαρη", "ζαχαροτευτλ"))
P("leche", *S("el", "γαλα", "γαλακτ", "τυρι", "φετα", "γαλακτοκομ")); P("vaca", *S("el", "βοειο", "βοοειδ", "αγελαδ", "μοσχαρ"))
P("cerdo", *S("el", "χοιριν", "χοιροτροφ", "χοιρων")); P("cordero", *S("el", "αρνι", "προβατ", "αιγοπροβατ", "κατσικ")); P("pollo", *S("el", "πουλερικ", "κοτοπουλ", "πτηνοτροφ"))
P("huevos", *S("el", "αυγα")); P("ganado", *S("el", "κτηνοτροφ", "ζωικο κεφαλαιο")); P("oliva", *S("el", "ελαιολαδ", "ελιες", "ελαιον"))
P("fertilizantes", *S("el", "λιπασμ")); P("diesel", *S("el", "πετρελαιο κινησης", "ντιζελ")); P("energia", *S("el", "φυσικο αεριο", "ενεργεια", "ρευμα"))
P("pienso", *S("el", "ζωοτροφ")); P("costes", *S("el", "κοστος παραγωγης")); P("pac", *S("el", "κοινη αγροτικη πολιτικη", " καπ "))
T("clima", *S("el", "ξηρασι", "παγετ", "πλημμυρ", "καυσωνα", "καυσων", "χαλαζι", "κακοκαιρι"))
T("comercio", *S("el", "εξαγωγ", "εισαγωγ", "δασμ", "εμπορικη συμφωνια"))
T("oferta", *S("el", "συγκομιδη", "σοδει", "καλλιεργ", "σποροσ"))
T("precios", *S("el", "τιμες", "τιμη", "τιμων", "τιμων παραγωγου", "χρηματιστηρι"))
T("politica", *S("el", "κυβερνηση", "υπουργ", "βουλη"))
T("sanidad", *S("el", "γριπη των πτην", "γριπη των πτηνων", "πανωλη", "αφθωδ", "ευλογι", "καταρροικ", "νοσος", "κρουσμα", "εστια"))
T("ayudas", *S("el", "επιδοτ", "αποζημιωσ", "ενισχυσ", "στηριξ"))

# ───────────────────────────── croata ─────────────────────────────
P("maiz", *S("hr", "kukuruz")); P("trigo", *S("hr", "psenic")); P("soja", *W("hr", "soja", "soje")); P("arroz", *W("hr", "riza"))
P("cebada", *S("hr", "jecam")); P("colza", *S("hr", "uljana repica", "uljane repice", "suncokret")); P("azucar", *S("hr", "secer"))
P("leche", *S("hr", "mlijek", "mlijecn")); P("vaca", *S("hr", "govedin", "goveda", "krava", "krave")); P("cerdo", *S("hr", "svinjetin", "svinj"))
P("cordero", *S("hr", "janjetin", "ovce", "ovaca")); P("pollo", *S("hr", "perad", "piletin")); P("huevos", *W("hr", "jaja", "jaje"))
P("ganado", *S("hr", "stocar", "stocarstv", "stoka")); P("fertilizantes", *S("hr", "gnojiv", "dusik")); P("diesel", *S("hr", "dizel", "plavi dizel"))
P("pienso", *S("hr", "krmiv", "krma")); P("pac", *W("hr", "zpp"), *S("hr", "zajednicka poljoprivredna"))
T("clima", *S("hr", "susa", "mraz", "poplav", "tuca", "toplinski val"))
T("comercio", *S("hr", "izvoz", "uvoz", "carin", "trgovinski"))
T("oferta", *S("hr", "zetva", "prinos", "berba", "sjetva", "urod"))
T("precios", *S("hr", "cijena", "cijene", "cijen", "otkupn"))
T("politica", *S("hr", "vlada", "ministar", "ministarstv", "sabor"))
T("sanidad", *S("hr", "pticja gripa", "pticje gripe", "africk svinjsk kug", "africka svinjska kuga", "slinavk", "bolest", "izbijanje"))
T("ayudas", *S("hr", "potpor", "subvencij", "naknad", "poticaj"))

# ───────────────────────────── esloveno ─────────────────────────────
P("maiz", *S("sl", "koruz")); P("trigo", *S("sl", "psenic")); P("soja", *W("sl", "soja", "soje")); P("arroz", *W("sl", "riz"))
P("cebada", *S("sl", "jecmen")); P("colza", *S("sl", "ogrscic", "soncnic")); P("azucar", *S("sl", "sladkor"))
P("leche", *S("sl", "mleko", "mleka", "mlecn")); P("vaca", *S("sl", "govedin", "goveda", "krav")); P("cerdo", *S("sl", "prasic", "svinjin", "prasicereja"))
P("cordero", *S("sl", "jagnje", "jagnjet", "ovc")); P("pollo", *S("sl", "perutnin", "piscan")); P("huevos", *S("sl", "jajc", "jajca"))
P("ganado", *S("sl", "zivinorej", "zivin")); P("fertilizantes", *S("sl", "gnojil", "dusik")); P("diesel", *S("sl", "dizel", "gorivo"))
P("pienso", *S("sl", "krma", "krmil")); P("pac", *W("sl", "skp"), *S("sl", "skupna kmetijska"))
T("clima", *S("sl", "susa", "pozeb", "poplav", "toca", "vrocin"))
T("comercio", *S("sl", "izvoz", "uvoz", "carin", "trgovin"))
T("oferta", *S("sl", "zetev", "pridelek", "letina", "setev", "pridelav"))
T("precios", *S("sl", "cena", "cene", "odkupn"))
T("politica", *S("sl", "vlada", "minister", "ministrstv"))
T("sanidad", *S("sl", "ptici gripa", "ptice gripe", "ptičja gripa", "afriska prasicja kuga", "slinavk", "bolezen", "izbruh"))
T("ayudas", *S("sl", "subvenc", "pomoc", "nadomestil", "podpor"))

# ───────────────────────────── lituano ─────────────────────────────
P("maiz", *S("lt", "kukuruz")); P("trigo", *S("lt", "kviec", "kviet")); P("soja", *W("lt", "soja", "sojos", "sojų")); P("arroz", *W("lt", "ryziai", "ryziu", "ryzius"))
P("cebada", *S("lt", "miez")); P("colza", *S("lt", "rapsai", "rapsu", "rapso", "saulegraz")); P("azucar", *S("lt", "cukr"))
P("leche", *S("lt", "pienas", "pieno", "pienin", "suris", "sūrio")); P("vaca", *S("lt", "jautien", "galvij", "karv")); P("cerdo", *S("lt", "kiaulien", "kiauli", "kiaulių"))
P("cordero", *S("lt", "eriena", "avių", "avys")); P("pollo", *S("lt", "paukstien", "vistien", "broiler")); P("huevos", *S("lt", "kiausin"))
P("ganado", *S("lt", "gyvuliai", "gyvulinink", "gyvulių")); P("fertilizantes", *W("lt", "tras", "trasu", "trasos", "trasas", "trasomis")); P("diesel", *S("lt", "dyzelin"))
P("pienso", *S("lt", "pasar")); P("pac", *S("lt", "bendra zemes ukio politika"), *W("lt", "bzp"))
T("clima", *S("lt", "sausra", "salna", "potvyn", "karstis", "karšči"))
T("comercio", *S("lt", "eksport", "import", "muit", "prekyb"))
T("oferta", *S("lt", "derli", "seja", "sejos", ))
T("precios", *S("lt", "kain", "supirkim", "biržoje", "birzoje"))
T("politica", *S("lt", "vyriausyb", "ministr", "seim"))
T("sanidad", *S("lt", "pauksciu gripas", "pauksciu gripo", "kiauliu maras", "kiaulių maras", "pūlių", "ligos", "protrukis"))
T("ayudas", *S("lt", "parama", "paramos", "subsidij", "kompensac"))

# ───────────────────────────── letón ─────────────────────────────
P("maiz", *S("lv", "kukuruz")); P("trigo", *S("lv", "kvies")); P("soja", *W("lv", "soja", "sojas")); P("cebada", *S("lv", "miez"))
P("colza", *S("lv", "rapsis", "rapša", "saulespuk")); P("azucar", *S("lv", "cukur")); P("leche", *S("lv", "piens", "piena", "piensaimniek", "sieru"))
P("vaca", *S("lv", "liellop", "govju"), *W("lv", "govs", "govis", "govim")); P("cerdo", *S("lv", "cuku", "cukgal", "cukkop")); P("cordero", *S("lv", "jeru", "aitu", "aitas"))
P("pollo", *S("lv", "putnkop", "vistu", "broileru")); P("huevos", *W("lv", "olas", "olu", "olam")); P("ganado", *S("lv", "lopkop", "dzivnieku"))
P("fertilizantes", *S("lv", "meslojum")); P("diesel", *S("lv", "dizel", "degviel")); P("pienso", *S("lv", "barib"))
P("pac", *W("lv", "klp"), *S("lv", "kopejas lauksaimniecibas politikas"))
T("clima", *S("lv", "sausum", "salna", "pludi", "karstum"))
T("comercio", *S("lv", "eksport", "import", "muit", "tirdzniec"))
T("oferta", *S("lv", "raza", "razu", "seja", "ražīb", "razib"))
T("precios", *S("lv", "cena", "cenas", "cenu", "iepirkum"))
T("politica", *S("lv", "valdib", "ministr", "saeim"))
T("sanidad", *S("lv", "putnu gripa", "putnu gripas", "afrikas cuku meris", "mutes un nagu", "slimib", "uzliesm"))
T("ayudas", *S("lv", "atbalst", "subsidij", "kompensacij"))

# ───────────────────────────── estonio ─────────────────────────────
P("maiz", *W("et", "mais", "maisi")); P("trigo", *S("et", "nisu", "teravili")); P("soja", *W("et", "soja", "sojaoa")); P("arroz", *W("et", "riis"))
P("cebada", *W("et", "oder", "odra")); P("colza", *S("et", "raps", "paevalill")); P("azucar", *S("et", "suhkur"))
P("leche", *S("et", "piim", "piima", "piimatoor", "juust")); P("vaca", *S("et", "veis", "veiseliha", "lehm")); P("cerdo", *S("et", "sealiha", "seakasvat", "seakatk", "sigade"))
P("cordero", *S("et", "lambaliha", "lambad")); P("pollo", *S("et", "linnuliha", "broiler", "kana")); P("huevos", *S("et", "munad", "munade"))
P("ganado", *S("et", "loomakasvat", "karjakasvat", "loomad")); P("fertilizantes", *S("et", "vaetis")); P("diesel", *S("et", "diislikutus", "diisel"))
P("pienso", *S("et", "soot", "sööt")); P("pac", *S("et", "uhine pollumajanduspolitika"), *W("et", "upp"))
T("clima", *S("et", "poud", "ookulm", "uleujutus", "kuumus", "vihm"))
T("comercio", *S("et", "eksport", "import", "toll", "kaubandus"))
T("oferta", *S("et", "saak", "loikus", "kulv", "tootlikkus"))
T("precios", *S("et", "hind", "hinnad", "hinna", "kokkuost"))
T("politica", *S("et", "valitsus", "minister", "riigikogu"))
T("sanidad", *S("et", "linnugripp", "seakatk", "suu- ja sorataud", "haigus", "puhang"))
T("ayudas", *S("et", "toetus", "toetust", "kompensatsioon"))
