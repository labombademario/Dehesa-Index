"""Medios añadidos el 8-oct-2026 para los países que tenían pocas noticias o ninguna.

Todos se probaron antes (sonda del 8-oct: respondían con noticias de los 14 días anteriores). Cada fila:
  (medio, país ISO del medio, región por defecto, dominio, palabras de la consulta, idioma de la consulta, gl, idioma de clasificación, generalista)
- Se consulta Google News con `site:dominio (palabras)`: solo se guarda el titular y el enlace, nunca el texto.
- «generalista» = medio no agrario: la noticia solo entra si menciona un producto agrario concreto.
- El país es el del MEDIO (nunca se deduce por el idioma): lo usa news_country.py.
Formato de las palabras: «a OR b OR c» (con espacios, Google devolvía 0 resultados).
"""

# medio, país, región, dominio, palabras, clave de idioma de la consulta (ver _HL), gl, idioma de clasificación, generalista
ROWS = [
 # ── Polonia ──
 ("Farmer.pl", "PL", "eu", "farmer.pl", "pszenica OR kukurydza OR rzepak OR trzoda OR mleko OR ceny", "pl", "PL", "pl", False),
 ("Topagrar Polska", "PL", "eu", "topagrar.pl", "pszenica OR kukurydza OR rzepak OR trzoda OR mleko", "pl", "PL", "pl", False),
 ("Agropolska", "PL", "eu", "agropolska.pl", "pszenica OR kukurydza OR rzepak OR ceny OR mleko", "pl", "PL", "pl", False),
 ("Portal Spożywczy", "PL", "eu", "portalspozywczy.pl", "zboża OR mleko OR mięso OR ceny rolnicy", "pl", "PL", "pl", False),
 ("PAP", "PL", "eu", "pap.pl", "rolnictwo OR zboże OR pszenica OR ceny skupu", "pl", "PL", "pl", True),
 ("Rzeczpospolita", "PL", "eu", "rp.pl", "rolnictwo OR zboże OR rolnicy OR ceny pszenicy", "pl", "PL", "pl", True),
 ("Gazeta Prawna", "PL", "eu", "gazetaprawna.pl", "rolnicy OR zboże OR pszenica OR ceny", "pl", "PL", "pl", True),
 # ── Suecia ──
 ("ATL", "SE", "eu", "atl.nu", "vete OR korn OR mjölk OR gris OR priser", "sv", "SE", "sv", False),
 ("Land Lantbruk", "SE", "eu", "landlantbruk.se", "vete OR mjölk OR gris OR priser OR skörd", "sv", "SE", "sv", False),
 ("Jordbruksverket", "SE", "eu", "jordbruksverket.se", "spannmål OR mjölk OR skörd OR priser", "sv", "SE", "sv", False),
 ("LRF", "SE", "eu", "lrf.se", "lantbruk OR spannmål OR mjölk OR skörd", "sv", "SE", "sv", False),
 ("Dagens Industri", "SE", "eu", "di.se", "jordbruk OR spannmål OR bönder OR vete OR mjölk", "sv", "SE", "sv", True),
 # ── Finlandia ──
 ("Maaseudun Tulevaisuus", "FI", "eu", "maaseuduntulevaisuus.fi", "vehnä OR maito OR sika OR hinta OR sato", "fi", "FI", "fi", False),
 ("MTK", "FI", "eu", "mtk.fi", "vilja OR maito OR sato OR hinta", "fi", "FI", "fi", False),
 ("Ruokavirasto", "FI", "eu", "ruokavirasto.fi", "maatalous OR vilja OR maito OR linnuinfluenssa", "fi", "FI", "fi", False),
 ("Yle", "FI", "eu", "yle.fi", "maatalous OR viljelijät OR vilja OR maito", "fi", "FI", "fi", True),
 ("Kauppalehti", "FI", "eu", "kauppalehti.fi", "maatalous OR vilja OR maito OR viljelijät", "fi", "FI", "fi", True),
 # ── Chequia ──
 ("Zemědělec", "CZ", "eu", "zemedelec.cz", "pšenice OR řepka OR mléko OR ceny OR sklizeň", "cs", "CZ", "cs", False),
 ("Agrární komora", "CZ", "eu", "apic.cz", "zemědělství OR pšenice OR mléko OR ceny", "cs", "CZ", "cs", False),
 ("Hospodářské noviny", "CZ", "eu", "hn.cz", "zemědělci OR pšenice OR sklizeň OR ceny", "cs", "CZ", "cs", True),
 # ── Eslovaquia ──
 ("Agroporadenstvo", "SK", "eu", "agroporadenstvo.sk", "pšenica OR kukurica OR mlieko OR ceny OR žatva", "sk", "SK", "sk", False),
 ("Denník N", "SK", "eu", "dennikn.sk", "poľnohospodári OR pšenica OR úroda OR mlieko", "sk", "SK", "sk", True),
 ("Hospodárske noviny SK", "SK", "eu", "hnonline.sk", "poľnohospodári OR pšenica OR úroda", "sk", "SK", "sk", True),
 ("TASR", "SK", "eu", "tasr.sk", "poľnohospodári OR pšenica OR úroda OR ceny obilia", "sk", "SK", "sk", True),
 # ── Hungría ──
 ("Agrárszektor", "HU", "eu", "agrarszektor.hu", "búza OR kukorica OR tej OR sertés OR ár", "hu", "HU", "hu", False),
 ("Magyar Mezőgazdaság", "HU", "eu", "magyarmezogazdasag.hu", "búza OR kukorica OR tej OR termés OR ár", "hu", "HU", "hu", False),
 ("Agroinform", "HU", "eu", "agroinform.hu", "búza OR kukorica OR napraforgó OR ár", "hu", "HU", "hu", False),
 ("AgrárUnió", "HU", "eu", "agrarunio.hu", "búza OR kukorica OR tej OR sertés", "hu", "HU", "hu", False),
 ("Portfolio", "HU", "eu", "portfolio.hu", "gazdák OR búza OR kukorica OR mezőgazdaság", "hu", "HU", "hu", True),
 # ── Rumanía ──
 ("Agrimedia", "RO", "eu", "agrimedia.ro", "grâu OR porumb OR floarea-soarelui OR lapte OR prețuri", "ro", "RO", "ro", False),
 ("Agrointeligența", "RO", "eu", "agrointel.ro", "grâu OR porumb OR rapiță OR prețuri OR recoltă", "ro", "RO", "ro", False),
 ("Revista Fermierului", "RO", "eu", "revistafermierului.ro", "grâu OR porumb OR lapte OR prețuri OR recoltă", "ro", "RO", "ro", False),
 ("Ziarul Financiar", "RO", "eu", "zf.ro", "agricultură OR grâu OR porumb OR fermieri", "ro", "RO", "ro", True),
 ("Agerpres", "RO", "eu", "agerpres.ro", "agricultură OR grâu OR fermieri OR recoltă", "ro", "RO", "ro", True),
 ("Profit.ro", "RO", "eu", "profit.ro", "agricultură OR grâu OR fermieri", "ro", "RO", "ro", True),
 # ── Bulgaria ──
 ("Agri.bg", "BG", "eu", "agri.bg", "пшеница OR царевица OR слънчоглед OR мляко OR цени", "bg", "BG", "bg", False),
 ("Agro.bg", "BG", "eu", "agro.bg", "пшеница OR царевица OR слънчоглед OR мляко OR цени", "bg", "BG", "bg", False),
 ("БТА", "BG", "eu", "bta.bg", "земеделие OR пшеница OR фермери OR реколта", "bg", "BG", "bg", True),
 ("Дневник", "BG", "eu", "dnevnik.bg", "земеделие OR пшеница OR фермери OR реколта", "bg", "BG", "bg", True),
 ("Капитал", "BG", "eu", "capital.bg", "земеделие OR пшеница OR фермери", "bg", "BG", "bg", True),
 # ── Grecia ──
 ("Agronews", "GR", "eu", "agronews.gr", "σιτάρι OR καλαμπόκι OR ελαιόλαδο OR γάλα OR τιμές", "el", "GR", "el", False),
 ("Agrotypos", "GR", "eu", "agrotypos.gr", "σιτάρι OR ελαιόλαδο OR γάλα OR τιμές OR παραγωγοί", "el", "GR", "el", False),
 ("Agro24", "GR", "eu", "agro24.gr", "σιτάρι OR ελαιόλαδο OR γάλα OR τιμές", "el", "GR", "el", False),
 ("Kathimerini", "GR", "eu", "kathimerini.gr", "αγρότες OR σιτάρι OR ελαιόλαδο OR γεωργία", "el", "GR", "el", True),
 ("ΑΠΕ-ΜΠΕ", "GR", "eu", "amna.gr", "αγρότες OR σιτάρι OR ελαιόλαδο OR γεωργία", "el", "GR", "el", True),
 ("Naftemporiki", "GR", "eu", "naftemporiki.gr", "αγρότες OR σιτάρι OR ελαιόλαδο OR γεωργία", "el", "GR", "el", True),
 # ── Eslovenia ──
 ("STA", "SI", "eu", "sta.si", "kmetijstvo OR kmetje OR pšenica OR mleko", "sl", "SI", "sl", True),
 ("Delo", "SI", "eu", "delo.si", "kmetje OR pšenica OR mleko OR kmetijstvo", "sl", "SI", "sl", True),
 ("Finance.si", "SI", "eu", "finance.si", "kmetijstvo OR kmetje OR pšenica OR mleko", "sl", "SI", "sl", True),
 ("24ur", "SI", "eu", "24ur.com", "kmetje OR pšenica OR mleko OR kmetijstvo", "sl", "SI", "sl", True),
 # ── Lituania ──
 ("Ūkininko patarėjas", "LT", "eu", "ukininkopatarejas.lt", "kviečiai OR kukurūzai OR pienas OR kainos OR derlius", "lt", "LT", "lt", False),
 ("LRT", "LT", "eu", "lrt.lt", "ūkininkai OR kviečiai OR pienas OR derlius", "lt", "LT", "lt", True),
 ("BNS", "LT", "eu", "bns.lt", "žemės ūkis OR kviečiai OR ūkininkai OR pienas", "lt", "LT", "lt", True),
 ("Verslo žinios", "LT", "eu", "vz.lt", "žemės ūkis OR kviečiai OR ūkininkai OR pienas", "lt", "LT", "lt", True),
 ("15min", "LT", "eu", "15min.lt", "ūkininkai OR kviečiai OR pienas OR derlius", "lt", "LT", "lt", True),
 # ── Letonia ──
 ("Latvijas Avīze", "LV", "eu", "la.lv", "lauksaimnieki OR kvieši OR piens OR raža", "lv", "LV", "lv", True),
 ("LSM", "LV", "eu", "lsm.lv", "lauksaimnieki OR kvieši OR piens OR raža", "lv", "LV", "lv", True),
 ("Dienas Bizness", "LV", "eu", "db.lv", "lauksaimniecība OR kvieši OR lauksaimnieki OR piens", "lv", "LV", "lv", True),
 # ── Estonia ──
 ("Maaelu", "EE", "eu", "maaelu.postimees.ee", "nisu OR oder OR piim OR hinnad OR saak", "et", "EE", "et", False),
 ("Põllumajandus- ja Toiduamet", "EE", "eu", "agri.ee", "põllumajandus OR nisu OR piim OR toetus", "et", "EE", "et", False),
 ("ERR", "EE", "eu", "err.ee", "põllumajandus OR nisu OR piim OR põllumehed", "et", "EE", "et", True),
 ("Postimees", "EE", "eu", "postimees.ee", "põllumajandus OR nisu OR piim OR põllumehed", "et", "EE", "et", True),
 ("Äripäev", "EE", "eu", "aripaev.ee", "põllumajandus OR nisu OR piim OR põllumehed", "et", "EE", "et", True),
 # ── Luxemburgo ──
 ("Luxembourg Times", "LU", "eu", "luxtimes.lu", "farmers OR agriculture OR milk OR wheat OR dairy", "engb", "LU", "en", True),
 ("Luxemburger Wort", "LU", "eu", "wort.lu", "Landwirtschaft OR Bauern OR Milch OR Getreide", "de", "LU", "de", True),
 ("Paperjam", "LU", "eu", "paperjam.lu", "agriculture OR agriculteurs OR lait OR viticulteurs", "fr", "LU", "fr", True),
 # ── Malta ──
 ("Times of Malta", "MT", "eu", "timesofmalta.com", "farmers OR agriculture OR milk OR potatoes OR wheat", "engb", "MT", "en", True),
 ("The Malta Independent", "MT", "eu", "independent.com.mt", "farmers OR agriculture OR milk OR potatoes", "engb", "MT", "en", True),
 ("MaltaToday", "MT", "eu", "maltatoday.com.mt", "farmers OR agriculture OR milk OR potatoes", "engb", "MT", "en", True),
 ("TVMnews", "MT", "eu", "tvmnews.mt", "farmers OR agriculture OR milk OR potatoes", "engb", "MT", "en", True),
 ("Newsbook", "MT", "eu", "newsbook.com.mt", "farmers OR agriculture OR milk OR potatoes", "engb", "MT", "en", True),
 # ── Chipre ──
 ("Cyprus Mail", "CY", "eu", "cyprus-mail.com", "farmers OR agriculture OR halloumi OR milk OR potatoes", "engb", "CY", "en", True),
 ("In-Cyprus", "CY", "eu", "in-cyprus.philenews.com", "farmers OR agriculture OR halloumi OR milk", "engb", "CY", "en", True),
 ("Philenews", "CY", "eu", "philenews.com", "αγρότες OR χαλλούμι OR γάλα OR γεωργία", "el", "CY", "el", True),
 ("Stockwatch Cyprus", "CY", "eu", "stockwatch.com.cy", "αγρότες OR χαλλούμι OR γεωργία OR γάλα", "el", "CY", "el", True),
 ("CNA", "CY", "eu", "cna.org.cy", "farmers OR agriculture OR halloumi OR milk", "engb", "CY", "en", True),
 # ── Suiza ──
 ("BauernZeitung", "CH", "eu", "bauernzeitung.ch", "Weizen OR Milch OR Preise OR Ernte OR Landwirtschaft", "de", "CH", "de", False),
 ("Schweizer Bauer", "CH", "eu", "schweizerbauer.ch", "Weizen OR Milch OR Preise OR Ernte OR Schweine", "de", "CH", "de", False),
 ("Agroscope", "CH", "eu", "agroscope.admin.ch", "Landwirtschaft OR Weizen OR Milch OR Ernte", "de", "CH", "de", False),
 ("L'Agri Hebdo", "CH", "eu", "agrihebdo.ch", "blé OR lait OR prix OR récolte OR agriculteurs", "fr", "CH", "fr", False),
 ("Terre&Nature", "CH", "eu", "terrenature.ch", "blé OR lait OR prix OR agriculteurs", "fr", "CH", "fr", False),
 ("NZZ", "CH", "eu", "nzz.ch", "Landwirtschaft OR Bauern OR Weizen OR Milch", "de", "CH", "de", True),
 ("Blick", "CH", "eu", "blick.ch", "Landwirtschaft OR Bauern OR Milch OR Weizen", "de", "CH", "de", True),
 ("RSI", "CH", "eu", "rsi.ch", "agricoltura OR agricoltori OR latte OR grano", "it", "CH", "it", True),
 # ── Chile ──
 ("Redagrícola", "CL", "global", "redagricola.com", "trigo OR maíz OR leche OR carne OR precios OR fruta", "es419", "CL", "es", False),
 ("ODEPA", "CL", "global", "odepa.gob.cl", "precios OR trigo OR leche OR carne OR fruta", "es419", "CL", "es", False),
 ("Portal Frutícola", "CL", "global", "portalfruticola.com", "fruta OR cerezas OR exportaciones OR precios", "es419", "CL", "es", False),
 ("Chilealimentos", "CL", "global", "chilealimentos.com", "exportaciones OR carne OR fruta OR leche", "es419", "CL", "es", False),
 ("Diario Financiero", "CL", "global", "df.cl", "agricultura OR trigo OR leche OR fruta OR salmón", "es419", "CL", "es", True),
 ("La Tercera", "CL", "global", "latercera.com", "agricultura OR trigo OR leche OR fruta OR agricultores", "es419", "CL", "es", True),
 ("BioBioChile", "CL", "global", "biobiochile.cl", "agricultores OR trigo OR leche OR agricultura", "es419", "CL", "es", True),
 # ── Argentina ──
 ("Agrofy News", "AR", "global", "news.agrofy.com.ar", "soja OR maíz OR trigo OR hacienda OR precios", "es419", "AR", "es", False),
 ("Agrositio", "AR", "global", "agrositio.com.ar", "soja OR maíz OR trigo OR hacienda OR precios", "es419", "AR", "es", False),
 ("Bichos de Campo", "AR", "global", "bichosdecampo.com", "soja OR maíz OR trigo OR hacienda OR productores", "es419", "AR", "es", False),
 ("Clarín Rural", "AR", "global", "clarin.com/rural", "soja OR maíz OR trigo OR hacienda OR precios", "es419", "AR", "es", False),
 ("TodoAgro", "AR", "global", "todoagro.com.ar", "soja OR maíz OR trigo OR hacienda OR precios", "es419", "AR", "es", False),
 ("La Nación", "AR", "global", "lanacion.com.ar", "campo soja OR maíz OR trigo OR hacienda OR cosecha", "es419", "AR", "es", True),
 ("Infobae", "AR", "global", "infobae.com", "campo soja OR maíz OR trigo OR hacienda OR cosecha", "es419", "AR", "es", True),
 ("Ámbito", "AR", "global", "ambito.com", "campo soja OR maíz OR trigo OR hacienda OR cosecha", "es419", "AR", "es", True),
 # ── Reino Unido ──
 ("AHDB", "GB", "uk", "ahdb.org.uk", "wheat OR milk OR prices OR harvest OR cattle", "engb", "GB", "en", False),
 ("Farming UK", "GB", "uk", "farminguk.com", "wheat OR milk OR prices OR harvest OR farmers", "engb", "GB", "en", False),
 ("The Scottish Farmer", "GB", "uk", "thescottishfarmer.co.uk", "wheat OR milk OR prices OR harvest OR farmers", "engb", "GB", "en", False),
 ("Farmers Guide", "GB", "uk", "farmersguide.co.uk", "wheat OR milk OR prices OR harvest OR farmers", "engb", "GB", "en", False),
 ("Dairy Reporter", "GB", "uk", "dairyreporter.com", "milk OR dairy OR prices OR cheese", "engb", "GB", "en", False),
 ("The Poultry Site", "GB", "uk", "thepoultrysite.com", "poultry OR eggs OR bird flu OR UK", "engb", "GB", "en", False),
 ("BBC", "GB", "uk", "bbc.co.uk", "farmers OR agriculture OR wheat OR milk OR bird flu", "engb", "GB", "en", True),
 ("The Telegraph", "GB", "uk", "telegraph.co.uk", "farmers OR agriculture OR milk OR wheat", "engb", "GB", "en", True),
 ("The Grocer", "GB", "uk", "thegrocer.co.uk", "farmers OR milk OR dairy OR beef OR wheat", "engb", "GB", "en", True),
 ("Wales Online", "GB", "uk", "walesonline.co.uk", "farmers OR agriculture OR milk OR sheep", "engb", "GB", "en", True),
 # ── Irlanda ──
 ("Teagasc", "IE", "eu", "teagasc.ie", "beef OR milk OR grain OR prices OR farmers", "enie", "IE", "en", False),
 ("IFA", "IE", "eu", "ifa.ie", "beef OR milk OR grain OR prices OR farmers", "enie", "IE", "en", False),
 ("Bord Bia", "IE", "eu", "bordbia.ie", "beef OR dairy OR pigmeat OR exports", "enie", "IE", "en", False),
 ("Irish Farmers Monthly", "IE", "eu", "irishfarmersmonthly.com", "beef OR milk OR grain OR prices", "enie", "IE", "en", False),
 ("Irish Examiner", "IE", "eu", "irishexaminer.com", "farmers OR agriculture OR beef OR milk OR grain", "enie", "IE", "en", True),
 ("The Irish Times", "IE", "eu", "irishtimes.com", "farmers OR agriculture OR beef OR milk OR grain", "enie", "IE", "en", True),
 ("RTÉ", "IE", "eu", "rte.ie", "farmers OR agriculture OR beef OR milk OR grain", "enie", "IE", "en", True),
 # ── España ──
 ("Agroinformación", "ES", "eu", "agroinformacion.com", "cereales OR leche OR porcino OR vacuno OR precios", "es", "ES", "es", False),
 ("Agrodigital", "ES", "eu", "agrodigital.com", "cereales OR leche OR porcino OR vacuno OR precios", "es", "ES", "es", False),
 ("Eurocarne", "ES", "eu", "eurocarne.com", "porcino OR vacuno OR cordero OR precios", "es", "ES", "es", False),
 ("Interempresas", "ES", "eu", "interempresas.net", "cereales OR leche OR porcino OR precios agricultura", "es", "ES", "es", False),
 ("Mercacei", "ES", "eu", "mercacei.com", "aceite OR oliva OR precios OR campaña", "es", "ES", "es", False),
 ("Olimerca", "ES", "eu", "olimerca.com", "aceite OR oliva OR precios OR campaña", "es", "ES", "es", False),
 ("Agropopular", "ES", "eu", "agropopular.com", "cereales OR leche OR porcino OR vacuno OR precios", "es", "ES", "es", False),
 ("Agroclm", "ES", "eu", "agroclm.com", "cereales OR leche OR ovino OR precios", "es", "ES", "es", False),
 ("Valencia Fruits", "ES", "eu", "valenciafruits.com", "naranja OR cítricos OR precios OR exportaciones", "es", "ES", "es", False),
 ("FreshPlaza", "ES", "eu", "freshplaza.es", "precios OR hortalizas OR frutas OR exportaciones", "es", "ES", "es", False),
 ("COAG", "ES", "eu", "coag.org", "precios OR cereales OR leche OR agricultores", "es", "ES", "es", False),
 ("ASAJA", "ES", "eu", "asaja.com", "precios OR cereales OR leche OR agricultores", "es", "ES", "es", False),
 ("UPA", "ES", "eu", "upa.es", "precios OR cereales OR leche OR agricultores", "es", "ES", "es", False),
 ("Cooperativas Agro-alimentarias", "ES", "eu", "agro-alimentarias.coop", "cereales OR aceite OR leche OR cooperativas", "es", "ES", "es", False),
 ("Cinco Días", "ES", "eu", "cincodias.elpais.com", "agricultura OR cereales OR aceite OR leche OR agricultores", "es", "ES", "es", True),
 ("El Economista", "ES", "eu", "eleconomista.es", "agricultura OR cereales OR aceite OR agricultores", "es", "ES", "es", True),
 # ── Italia ──
 ("L'Informatore Agrario", "IT", "eu", "informatoreagrario.it", "grano OR mais OR latte OR suini OR prezzi", "it", "IT", "it", False),
 ("Coldiretti", "IT", "eu", "coldiretti.it", "grano OR latte OR olio OR prezzi OR agricoltori", "it", "IT", "it", False),
 ("Confagricoltura", "IT", "eu", "confagricoltura.it", "grano OR latte OR olio OR prezzi OR agricoltori", "it", "IT", "it", False),
 ("Ruminantia", "IT", "eu", "ruminantia.it", "latte OR bovini OR prezzi OR allevatori", "it", "IT", "it", False),
 ("Teatro Naturale", "IT", "eu", "teatronaturale.it", "olio OR prezzi OR campagna OR olive", "it", "IT", "it", False),
 ("Clal", "IT", "eu", "clal.it", "latte OR burro OR formaggio OR prezzi", "it", "IT", "it", False),
 ("Agrapress", "IT", "eu", "agrapress.it", "agricoltura OR grano OR latte OR prezzi", "it", "IT", "it", False),
 ("MASAF", "IT", "eu", "masaf.gov.it", "agricoltura OR grano OR latte OR prezzi", "it", "IT", "it", False),
 ("FreshPlaza Italia", "IT", "eu", "freshplaza.it", "prezzi OR frutta OR ortaggi OR mele", "it", "IT", "it", False),
 ("Fruitbook", "IT", "eu", "fruitbookmagazine.it", "prezzi OR frutta OR mele OR kiwi", "it", "IT", "it", False),
 ("Agricolae", "IT", "eu", "agricolae.eu", "grano OR latte OR suini OR prezzi", "it", "IT", "it", False),
 ("Il Sole 24 Ore", "IT", "eu", "ilsole24ore.com", "agricoltura OR grano OR olio OR agricoltori OR prezzi", "it", "IT", "it", True),
 ("ItaliaOggi", "IT", "eu", "italiaoggi.it", "agricoltura OR grano OR agricoltori OR prezzi", "it", "IT", "it", True),
 ("ANSA", "IT", "eu", "ansa.it", "agricoltura OR grano OR latte OR olio OR agricoltori", "it", "IT", "it", True),
 ("la Repubblica", "IT", "eu", "repubblica.it", "agricoltori OR grano OR olio OR siccità", "it", "IT", "it", True),
]


# RSS directos comprobados el 8-oct-2026 (respondían con noticias de los últimos días). Son más fiables que Google News.
# medio, país, región, URL, idioma, generalista
DIRECT = [
 ("Agrofakt", "PL", "eu", "https://agrofakt.pl/feed/", "pl", False),
 ("Tygodnik Poradnik Rolniczy", "PL", "eu", "https://www.tygodnik-rolniczy.pl/rss/", "pl", False),
 ("ATL", "SE", "eu", "https://www.atl.nu/rss", "sv", False),
 ("LRF", "SE", "eu", "https://www.lrf.se/rss/", "sv", False),
 ("Maaseudun Tulevaisuus", "FI", "eu", "https://www.maaseuduntulevaisuus.fi/rss", "fi", False),
 ("Zemědělec", "CZ", "eu", "https://www.zemedelec.cz/feed/", "cs", False),
 ("Agroweb", "CZ", "eu", "https://www.agroweb.cz/rss/", "cs", False),
 ("Agrárszektor", "HU", "eu", "https://www.agrarszektor.hu/rss", "hu", False),
 ("Magyar Mezőgazdaság", "HU", "eu", "https://magyarmezogazdasag.hu/feed/", "hu", False),
 ("Agrimedia", "RO", "eu", "https://agrimedia.ro/feed/", "ro", False),
 ("Agrointeligența", "RO", "eu", "https://agrointel.ro/feed/", "ro", False),
 ("Ziarul Financiar", "RO", "eu", "https://www.zf.ro/rss", "ro", True),
 ("Pôda Slovenska", "SK", "eu", "https://www.profipress.sk/rss", "sk", False),
 ("Agronews", "GR", "eu", "https://www.agronews.gr/rss", "el", False),
 ("Luxemburger Wort", "LU", "eu", "https://www.wort.lu/rss", "de", True),
 ("Luxembourg Times", "LU", "eu", "https://www.luxtimes.lu/rss", "en", True),
 ("Maaelu", "EE", "eu", "https://maaelu.postimees.ee/rss", "et", False),
 ("ERR News", "EE", "eu", "https://news.err.ee/rss", "en", True),
 ("LSM", "LV", "eu", "https://eng.lsm.lv/rss/", "en", True),
 ("Cyprus Mail", "CY", "eu", "https://cyprus-mail.com/feed/", "en", True),
 ("In-Cyprus", "CY", "eu", "https://in-cyprus.philenews.com/feed/", "en", True),
 ("Terre&Nature", "CH", "eu", "https://www.terrenature.ch/feed/", "fr", True),
 ("Agroinformación", "ES", "eu", "https://www.agroinformacion.com/feed/", "es", False),
 ("Valencia Fruits", "ES", "eu", "https://valenciafruits.com/feed/", "es", False),
 ("Agroclm", "ES", "eu", "https://agroclm.com/feed/", "es", False),
 ("Coldiretti", "IT", "eu", "https://www.coldiretti.it/feed/", "it", False),
 ("Ruminantia", "IT", "eu", "https://www.ruminantia.it/feed/", "it", False),
 ("Fruitbook", "IT", "eu", "https://www.fruitbookmagazine.it/feed/", "it", True),
 ("ANSA", "IT", "eu", "https://www.ansa.it/sito/notizie/economia/economia_rss.xml", "it", True),
 ("Agroverdad", "AR", "global", "https://www.agroverdad.com.ar/feed/", "es", False),
 ("Bichos de Campo", "AR", "global", "https://bichosdecampo.com/feed/", "es", False),
 ("Clarín Rural", "AR", "global", "https://www.clarin.com/rss/rural/", "es", False),
 ("La Nación", "AR", "global", "https://www.lanacion.com.ar/arc/outboundfeeds/rss/category/economia/campo/?outputType=xml", "es", False),
 ("TodoAgro", "AR", "global", "https://www.todoagro.com.ar/feed/", "es", True),
 ("Valor Soja", "AR", "global", "https://www.valorsoja.com/feed/", "es", True),
 ("ODEPA", "CL", "global", "https://www.odepa.gob.cl/feed", "es", False),
 ("Farming UK", "GB", "uk", "https://www.farminguk.com/rss/news", "en", False),
 ("Pig World", "GB", "uk", "https://www.pig-world.co.uk/rss", "en", False),
 ("Dairy Reporter", "GB", "uk", "https://www.dairyreporter.com/arc/outboundfeeds/rss/", "en", False),
 ("Agriland UK", "GB", "uk", "https://www.agriland.co.uk/feed/", "en", False),
 ("BBC", "GB", "uk", "https://feeds.bbci.co.uk/news/business/rss.xml", "en", True),
 ("RTÉ", "IE", "eu", "https://www.rte.ie/feeds/rss/?index=/news/business/", "en", True),
 # Croacia: ninguna fuente agraria croata responde (Agroklub bloquea con 403, Gospodarski list no publica RSS y Google News
 # no tiene edición croata útil): se leen seis medios generalistas y solo entra lo que menciona un producto agrario.
 ("Poslovni dnevnik", "HR", "eu", "https://www.poslovni.hr/feed/", "hr", True),
 ("Večernji list", "HR", "eu", "https://www.vecernji.hr/feeds/latest", "hr", True),
 ("N1 Hrvatska", "HR", "eu", "https://n1info.hr/feed/", "hr", True),
 ("Index.hr", "HR", "eu", "https://www.index.hr/rss", "hr", True),
 ("Jutarnji list", "HR", "eu", "https://www.jutarnji.hr/feed", "hr", True),
 ("Slobodna Dalmacija", "HR", "eu", "https://slobodnadalmacija.hr/feed", "hr", True),
 # Dinamarca: la prensa agraria danesa casi no está en Google News
 ("Altinget", "DK", "eu", "https://www.altinget.dk/rss", "da", True),
 ("Børsen", "DK", "eu", "https://borsen.dk/rss", "da", True),
 ("DR Indland", "DK", "eu", "https://www.dr.dk/nyheder/service/feeds/indland", "da", True),
]

# Nombre del medio -> país (lo importa news_country.py)
COUNTRIES = {row[0]: row[1] for row in ROWS}
COUNTRIES.update({row[0]: row[1] for row in DIRECT})


def build(F, google):
    out = []
    for name, _cc, region, site, kw, qlang, gl, lang, general in ROWS:
        out.append(F(name, region, google(f"site:{site} ({kw})", qlang, gl), lang, general=general))
    for name, _cc, region, url, lang, general in DIRECT:
        out.append(F(name, region, url, lang, general=general))
    return out
