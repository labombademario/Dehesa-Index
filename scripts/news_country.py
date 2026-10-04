"""País del medio (no del tema de la noticia). Mapa explícito por nombre de fuente; lo que no está aquí queda SIN país
(organismos internacionales, agencias globales, medios no identificados). Nunca se deduce por el idioma."""
_G = {
 "US": "AgWeb;Agri-Pulse;Brownfield;CNBC;DTN;Dairy Herd;EIA;Farm Policy News;Farm Progress;Farmdoc Daily;Feedstuffs;Hoard's Dairyman;POLITICO;Successful Farming;USDA;USDA APHIS;USDA ERS;USDA FAS;Wall Street Journal",
 "CA": "Agriculture and Agri-Food Canada;Alberta Farmer Express;CBC;Canada Beef;Canadian Cattlemen;Canadian Federation of Agriculture;Canadian Grain Commission;Canadian Press;Canola Council of Canada;Country Guide;Dairy Farmers of Canada;Farmers Forum;Farmtario;Financial Post;Globe and Mail;Grainews;Manitoba Co-operator;Pulse Canada;RealAgriculture;Saskatchewan Agriculture;Statistics Canada;Top Crop Manager;Western Producer;La Presse;La Terre de chez nous;Le Bulletin des agriculteurs",
 "GB": "Defra;Farmers Guardian;Farmers Weekly;NFU",
 "ES": "Agrodigital;Agroeuropa;Agroinformación;Agronews Castilla y León;Agropopular;EFEAgro;Efeagro;Interempresas;EFE",
 "FR": "AGRA;Agra Presse;Agreste;Arvalis;FNSEA;FranceAgriMer;Interbev;L'Agriculteur Normand;La France Agricole;Le Monde;Les Echos;Ouest-France;Pleinchamp;Réussir;Terre-net;Web-agri",
 "DE": "Agrarheute;Agrarmarkt;Agrarzeitung;BLE;BauernZeitung;Bundesministerium für Landwirtschaft;Deutscher Bauernverband;Handelsblatt;Landwirtschaftsverlag;dpa;top agrar",
 "AT": "APA;Agrarmarkt Austria;Bauernzeitung Österreich;Der Standard;Landwirt.com;Landwirtschaftskammer Österreich",
 "IT": "Agricolae;Agronotizie;Terra e Vita",
 "PT": "APCOR;Agricultura e Mar;Agroportal;CAP Portugal;Confagri;Expresso;GPP;Jornal de Negócios;Lusa;Observador;Público;Vida Rural;Voz do Campo;Portugal Resident",
 "NL": "ANP;Agrarisch Dagblad;Boerderij;Foodagribusiness;NOS;NU.nl;Nieuwe Oogst;Wageningen University;DutchNews",
 "BE": "Agra Belgique;Belga;Boerenbond;De Standaard;De Tijd;Le Sillon Belge;Le Soir;Vilt;Landbouwleven;Brussels Times",
 "DK": "Bondebladet;Børsen;DR Penge;Danmarks Radio;Effektivt Landbrug;Food Supply DK;Landbrug & Fødevarer;Landbrugsavisen;Ritzau;SEGES;Danish Agriculture & Food Council",
 "IE": "Agriland;Irish Farmers Journal",
 "AU": "AAP;ABARES;ABC Rural;Australian Financial Review;Australian Wool Innovation;Beef Central;Dairy News Australia;Farm Online;Farm Weekly;GRDC;Grain Central;Grain Growers;Meat & Livestock Australia;Queensland Country Life;Sheep Central;Stock & Land;The Land;The Weekly Times",
 "UA": "Latifundist;UkrAgroConsult",
 "JP": "Nikkei Asia",
 "IN": "Hindu BusinessLine",
 "AR": "Infocampo",
}
SOURCE_COUNTRY = {s: c for c, v in _G.items() for s in v.split(";")}

for _c, _v in {
 'US': 'WSJ;agweb.com;brownfieldagnews.com;cnbc.com;The New York Times;Los Angeles Times;NPR;Grand Forks Herald;National Hog Farmer;Pro Farmer;The Cattle Site;farmersalmanac.com;theguardian.com',
 'CA': 'EnergyNow;CTV News;The Globe and Mail;thecanadianpressnews.ca',
 'DE': 'SZ.de;n-tv.de;NDR.de;Stadt Melle;Wallstreet Online;Antenne Mainz 106.6;Regio TV;Rhönkanal;HNA;www.agrarzeitung.de;Elite Magazin;ZDFheute;Onetz;Wochenblatt Reporter;Die Glocke;Radio Herford;Ostdeutsche Allgemeine;Hellweger Anzeiger;RTL.de;HL-live.de;Neue Westfälische;Sonntagsblatt;nachrichten.jetzt;Halterner Zeitung',
 'AT': 'austria.com;meinbezirk.at;ORF;science.ORF.at;News.at;VOL.AT;boersianer.at;DiePresse.com',
 'ES': 'agronewscastillayleon.com;ENCLM;Demócrata',
 'PT': 'Jornal Económico;dnoticias.pt;Diário de Notícias;Rádio Campanário;O Atual;SIC Notícias;eco.sapo.pt;RTP;Dinheiro Vivo;Executive Digest;24 Notícias;Agência ECCLESIA;LUSA;ODigital.pt;Rádio Nova Antena;CNN Portugal;ZAP Notícias;portugalresident.com;Alentejo Ilustrado',
 'FR': 'reussir.fr;Sud Ouest;ladepeche.fr;La Tribune',
 'NL': 'De Telegraaf;Metronieuws.nl;Veeteelt;AD.nl;Varkensbedrijf.nl;Nieuwsgrazer;NU;welingelichtekringen.nl;Boerenbusiness;BioJournaal',
 'BE': 'gocar.be;RTL Info',
 'DK': 'The Copenhagen Post',
 'AU': 'aapnews.aap.com.au;countrynews.com.au',
 'UA': 'електронна зернова біржа України;Новини аграрного бізнесу',
 'IN': 'The Economic Times;Livemint;AgroSpectrum India;ChiniMandi',
 'AR': 'bcr.com.ar',
}.items():
    for _s in _v.split(';'):
        SOURCE_COUNTRY[_s] = _c

def country_of(source):
    return SOURCE_COUNTRY.get(source)
