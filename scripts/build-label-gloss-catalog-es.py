#!/usr/bin/env python3
"""Añade a data/label-gloss/mapa-es.json las etiquetas en español del catalogo de Belgica, Paises Bajos, Portugal, Polonia, Francia (vino, uso del suelo), UE y Canada.
Regla de js/label-tl.js: nunca se traduce a ojo. Cada etiqueta se parte en segmentos; cada segmento tiene que estar en el glosario de abajo (o ser un codigo/fuente/nombre propio
o un segmento ya en francés) o el script falla y lista lo que falta. Solo anade claves que no existen. Uso: python3 scripts/build-label-gloss-catalog-es.py [--check]"""
import glob, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
G = '''Autoabastecimiento de aves|Poultry self-sufficiency|Autosuffisance en volaille|Autosufficienza di pollame
Autoabastecimiento de carne|Meat self-sufficiency|Autosuffisance en viande|Autosufficienza di carne
Autoabastecimiento de carne y despojos|Meat and offal self-sufficiency|Autosuffisance en viande et abats|Autosufficienza di carne e frattaglie
Autoabastecimiento de cerdo|Pigmeat self-sufficiency|Autosuffisance en viande porcine|Autosufficienza di carne suina
Autoabastecimiento de vacuno|Beef and veal self-sufficiency|Autosuffisance en viande bovine|Autosufficienza di carne bovina
Aves de corral|Poultry|Volailles|Pollame
Azúcar blanco envasado|Packaged white sugar|Sucre blanc conditionné|Zucchero bianco confezionato
Bovinos|Cattle|Bovins|Bovini
Bulbos de flor|Flower bulbs|Bulbes à fleurs|Bulbi da fiore
Bulbos y tubérculos de flor|Flower bulbs and tubers|Bulbes et tubercules à fleurs|Bulbi e tuberi da fiore
Bélgica|Belgium|Belgique|Belgio
Cebada forrajera|Feed barley|Orge fourragère|Orzo da foraggio
Centeno de consumo|Rye for human consumption|Seigle de consommation|Segale da consumo
Cerdo de engorde|Fattening pigs|Porcs charcutiers|Suini da ingrasso
Cerdos|Pigs|Porcins|Suini
Cereales para grano|Cereals for grain|Céréales pour le grain|Cereali da granella
Colza|Rapeseed|Colza|Colza
Consumo aparente de carne|Apparent meat consumption|Consommation apparente de viande|Consumo apparente di carne
Consumo aparente de fertilizantes minerales por ha de SAU|Apparent consumption of mineral fertilisers per ha of UAA|Consommation apparente d’engrais minéraux par ha de SAU|Consumo apparente di fertilizzanti minerali per ha di SAU
Consumo de aves por habitante|Poultry consumption per capita|Consommation de volaille par habitant|Consumo di pollame pro capite
Consumo de carne y despojos por habitante|Meat and offal consumption per capita|Consommation de viande et d’abats par habitant|Consumo di carne e frattaglie pro capite
Consumo de cerdo por habitante|Pigmeat consumption per capita|Consommation de viande porcine par habitant|Consumo di carne suina pro capite
Consumo de vacuno por habitante|Beef and veal consumption per capita|Consommation de viande bovine par habitant|Consumo di carne bovina pro capite
Cosecha de hortalizas|Vegetable harvest|Récolte de légumes|Raccolto di ortaggi
Cría de cerdas|Sow breeding|Élevage de truies|Allevamento di scrofe
Cultivos en invernadero|Greenhouse crops|Cultures sous serre|Colture in serra
Derechos de aves|Poultry rights|Droits de volaille|Diritti per il pollame
Derechos de cerdos|Pig rights|Droits de porcs|Diritti per i suini
Desembarques totales de pescado|Total fish landings|Débarquements totaux de poisson|Sbarchi totali di pesce
Días de pastoreo de las vacas de leche|Grazing days of dairy cows|Jours de pâturage des vaches laitières|Giorni di pascolo delle vacche da latte
Eficiencia de uso del nitrógeno|Nitrogen use efficiency|Efficacité d’utilisation de l’azote|Efficienza d’uso dell’azoto
Emisión de amoníaco de la ganadería|Ammonia emissions from livestock|Émissions d’ammoniac de l’élevage|Emissioni di ammoniaca dell’allevamento
Excedente de nitrógeno de la ganadería|Nitrogen surplus from livestock|Excédent d’azote de l’élevage|Eccedenza di azoto dell’allevamento
Excreción de nitrógeno de la ganadería|Nitrogen excretion by livestock|Excrétion d’azote de l’élevage|Escrezione di azoto dell’allevamento
Explotaciones con producción agraria|Farms with agricultural production|Exploitations avec production agricole|Aziende con produzione agricola
Facturación de las explotaciones|Farm turnover|Chiffre d’affaires des exploitations|Fatturato delle aziende agricole
Finanzas de las explotaciones|Farm finances|Finances des exploitations|Finanze delle aziende agricole
Flor cortada|Cut flowers|Fleurs coupées|Fiori recisi
Flor cortada bajo cristal|Cut flowers under glass|Fleurs coupées sous verre|Fiori recisi in serra
Francia|France|France|Francia
Francia metropolitana|Metropolitan France|France métropolitaine|Francia metropolitana
Frutales|Fruit trees|Arbres fruitiers|Alberi da frutto
Gallinas ponedoras|Laying hens|Poules pondeuses|Galline ovaiole
Hortalizas al aire libre|Open-field vegetables|Légumes de plein champ|Ortaggi in pieno campo
Hortalizas bajo cristal|Vegetables under glass|Légumes sous verre|Ortaggi in serra
Horticultura bajo cristal|Glasshouse horticulture|Horticulture sous verre|Orticoltura in serra
Huevos de consumo convencionales|Conventional table eggs|Œufs de consommation conventionnels|Uova da consumo convenzionali
Huevos de consumo ecológicos|Organic table eggs|Œufs de consommation biologiques|Uova da consumo biologiche
Huevos de consumo total|Table eggs, total|Œufs de consommation, total|Uova da consumo, totale
ICNF vía INE|ICNF via INE|ICNF via l’INE|ICNF tramite INE
IPC|CPI|IPC|IPC
IPCA|HICP|IPCH|IPCA
Leche cruda|Raw milk|Lait cru|Latte crudo
Leche recogida|Milk collected|Lait collecté|Latte raccolto
Maíz forrajero|Silage maize|Maïs fourrager|Mais da foraggio
Maíz grano|Grain maize|Maïs grain|Mais da granella
Maíz seco|Dry maize|Maïs sec|Mais secco
Pastos permanentes|Permanent grassland|Prairies permanentes|Prati permanenti
Patata|Potatoes|Pommes de terre|Patate
Países Bajos|Netherlands|Pays-Bas|Paesi Bassi
Pepino bajo cristal|Cucumber under glass|Concombre sous verre|Cetriolo in serra
Pienso cerdo ab|Pig feed (ab)|Aliment pour porcs (ab)|Mangime per suini (ab)
Pienso para aves|Poultry feed|Aliment pour volailles|Mangime per pollame
Pienso para bovino|Cattle feed|Aliment pour bovins|Mangime per bovini
Pienso para porcino|Pig feed|Aliment pour porcs|Mangime per suini
Pimiento bajo cristal|Peppers under glass|Poivron sous verre|Peperone in serra
Plantas de maceta|Pot plants|Plantes en pot|Piante in vaso
Plantas de maceta y de temporada|Pot and bedding plants|Plantes en pot et de saison|Piante in vaso e stagionali
Pollos de carne|Broilers|Poulets de chair|Polli da carne
Polonia|Poland|Pologne|Polonia
Portugal|Portugal|Portugal|Portogallo
Portugal total|Portugal, total|Portugal, total|Portogallo, totale
Precio medio de la pesca descargada|Average price of landed catch|Prix moyen de la pêche débarquée|Prezzo medio del pescato sbarcato
Precio medio de lonja de lenguado|Average auction price of sole|Prix moyen de criée de la sole|Prezzo medio d’asta della sogliola
Precio medio de lonja de rape|Average auction price of monkfish|Prix moyen de criée de la lotte|Prezzo medio d’asta della rana pescatrice
Precio medio de lonja de raya|Average auction price of ray|Prix moyen de criée de la raie|Prezzo medio d’asta della razza
Precio medio de lonja de rodaballo|Average auction price of turbot|Prix moyen de criée du turbot|Prezzo medio d’asta del rombo
Precio medio de lonja de solla|Average auction price of plaice|Prix moyen de criée du carrelet|Prezzo medio d’asta della passera di mare
Precios de productor de la industria|Industry producer prices|Prix à la production de l’industrie|Prezzi alla produzione dell’industria
Producción bruta de carne|Gross meat production|Production brute de viande|Produzione lorda di carne
Producción bruta de carne de porcino|Gross pigmeat production|Production brute de viande porcine|Produzione lorda di carne suina
Producción de cebada de invierno|Winter barley production|Production d’orge d’hiver|Produzione di orzo invernale
Producción de colza y nabina|Rapeseed and turnip rape production|Production de colza et de navette|Produzione di colza e ravizzone
Producción de estiércol|Manure production|Production de fumier|Produzione di letame
Producción de leche de consumo|Drinking milk production|Production de lait de consommation|Produzione di latte alimentare
Producción de leche desnatada en polvo|Skimmed milk powder production|Production de lait écrémé en poudre|Produzione di latte scremato in polvere
Producción de mantequilla tradicional|Traditional butter production|Production de beurre traditionnel|Produzione di burro tradizionale
Producción de maíz grano|Grain maize production|Production de maïs grain|Produzione di mais da granella
Producción de miel|Honey production|Production de miel|Produzione di miele
Producción de mozzarella|Mozzarella production|Production de mozzarella|Produzione di mozzarella
Producción de patata de conservación|Storage potato production|Production de pommes de terre de conservation|Produzione di patate da conservazione
Producción de queso gouda|Gouda cheese production|Production de fromage gouda|Produzione di formaggio gouda
Producción de remolacha azucarera|Sugar beet production|Production de betterave sucrière|Produzione di barbabietola da zucchero
Producción de trigo de invierno|Winter wheat production|Production de blé d’hiver|Produzione di frumento invernale
Producción de yogur|Yoghurt production|Production de yaourt|Produzione di yogurt
Produccion de vino|Wine production|Production de vin|Produzione di vino
Pérdida de nitrógeno al suelo y al agua|Nitrogen loss to soil and water|Perte d’azote vers le sol et l’eau|Perdita di azoto verso suolo e acqua
Pérdida total de nitrógeno de la agricultura|Total nitrogen loss from agriculture|Perte totale d’azote de l’agriculture|Perdita totale di azoto dell’agricoltura
Remolacha azucarera|Sugar beet|Betterave sucrière|Barbabietola da zucchero
Rendimiento de patata de conservación|Storage potato yield|Rendement des pommes de terre de conservation|Resa delle patate da conservazione
Rendimiento de remolacha azucarera|Sugar beet yield|Rendement de la betterave sucrière|Resa della barbabietola da zucchero
Rendimiento de trigo de invierno|Winter wheat yield|Rendement du blé d’hiver|Resa del frumento invernale
Superficie|Area|Superficie|Superficie
Superficie agrícola utilizada|Utilised agricultural area|Surface agricole utilisée|Superficie agricola utilizzata
Superficie de cultivo de champiñón|Mushroom growing area|Surface de culture de champignons|Superficie di coltivazione dei funghi
Superficie quemada|Burnt area|Surface brûlée|Superficie bruciata
Tierras de cultivo|Arable land|Terres arables|Seminativi
Todas las explotaciones|All farms|Toutes les exploitations|Tutte le aziende
Tomate bajo cristal|Tomatoes under glass|Tomate sous verre|Pomodoro in serra
Trigo de consumo|Bread wheat|Blé de consommation|Frumento da consumo
Trigo de invierno|Winter wheat|Blé d’hiver|Frumento invernale
Trigo forrajero|Feed wheat|Blé fourrager|Frumento da foraggio
Tulipanes|Tulips|Tulipes|Tulipani
Uso del suelo|Land use|Utilisation du sol|Uso del suolo
Vacuno de leche|Dairy cattle|Bovins laitiers|Bovini da latte
Valor de los desembarques totales de pescado|Value of total fish landings|Valeur des débarquements totaux de poisson|Valore degli sbarchi totali di pesce
Viveros y plantas vivaces|Nurseries and perennials|Pépinières et vivaces|Vivai e piante perenni
Volatilización de amoníaco|Ammonia volatilisation|Volatilisation de l’ammoniac|Volatilizzazione dell’ammoniaca
Aceite colza|Rapeseed oil|Huile de colza|Olio di colza
Colza de|Rapeseed from|Colza de|Colza da
aceites y grasas|oils and fats|huiles et graisses|oli e grassi
activo total|total assets|total de l’actif|totale attivo
alimentación|food|alimentation|alimentazione
alimentos|food|alimentation|alimentari
alimentos y bebidas|food and beverages|aliments et boissons|alimentari e bevande
alimentos y bebidas no alcohólicas|food and non-alcoholic beverages|produits alimentaires et boissons non alcoolisées|prodotti alimentari e bevande analcoliche
anual|annual|annuel|annuale
aves|poultry|volaille|pollame
azúcar|sugar|sucre|zucchero
azúcar de caña y de remolacha|cane and beet sugar|sucre de canne et de betterave|zucchero di canna e di barbabietola
balance|balance|bilan|bilancio
bebidas no alcohólicas|non-alcoholic beverages|boissons non alcoolisées|bevande analcoliche
bulbo|bulb|bulbe|bulbo
cabra|goat|chèvre|capra
café y sucedáneos|coffee and substitutes|café et succédanés|caffè e succedanei
carne|meat|viande|carne
carne de ave|poultry meat|viande de volaille|carne di pollame
carne de cerdo|pork|viande de porc|carne di maiale
carne de vacuno y ternera|beef and veal|viande bovine et veau|carne bovina e vitello
carne fresca|fresh meat|viande fraîche|carne fresca
carne transformada|processed meat|viande transformée|carne trasformata
carne y despojos|meat and offal|viande et abats|carne e frattaglie
carne y despojos de animales terrestres|meat and offal of land animals|viande et abats d’animaux terrestres|carne e frattaglie di animali terrestri
cebolla|onion|oignon|cipolla
cerdo|pig|porc|suino
cereales y derivados|cereals and cereal products|céréales et dérivés|cereali e derivati
champiñón|mushroom|champignon|fungo coltivato
confitería y postres|confectionery and desserts|confiserie et desserts|confetteria e dolci
crustáceos|crustaceans|crustacés|crostacei
deuda a largo plazo|long-term debt|dette à long terme|debito a lungo termine
estiércol|manure|fumier|letame
frescas|fresh|fraîches|fresche
fruta|fruit|fruits|frutta
fruta y frutos secos|fruit and nuts|fruits et fruits à coque|frutta e frutta secca
frutas de hueso y pepita|stone and pome fruit|fruits à noyau et à pépins|frutta a nocciolo e a granella
hortalizas|vegetables|légumes|ortaggi
hortalizas de fruto|fruit vegetables|légumes-fruits|ortaggi da frutto
hortalizas de hoja o tallo|leaf and stalk vegetables|légumes-feuilles et légumes-tiges|ortaggi da foglia e da stelo
huertos|orchards|vergers|frutteti
huevo de consumo|table eggs|œufs de consommation|uova da consumo
huevos|eggs|œufs|uova
ipca|HICP|IPCH|IPCA
leche|milk|lait|latte
leche cruda y entera|raw and whole milk|lait cru et entier|latte crudo e intero
leche desnatada|skimmed milk|lait écrémé|latte scremato
lácteos|dairy|produits laitiers|latticini
lácteos y huevos|dairy and eggs|produits laitiers et œufs|latticini e uova
mantequilla|butter|beurre|burro
mantequilla y grasas lácteas|butter and dairy fats|beurre et matières grasses laitières|burro e grassi lattiero-caseari
mantequilla y otras grasas lácteas|butter and other dairy fats|beurre et autres matières grasses laitières|burro e altri grassi lattiero-caseari
mensual|monthly|mensuel|mensile
moluscos|molluscs|mollusques|molluschi
oveja|sheep|brebis|pecora
pan|bread|pain|pane
pan y productos de panadería|bread and bakery products|pain et produits de boulangerie|pane e prodotti da forno
panadería y pastas|bakery and pasta|boulangerie et pâtes|panetteria e pasta
panificable|bread-making|panifiable|panificabile
patata|potatoes|pommes de terre|patate
patrimonio neto|net equity|capitaux propres|patrimonio netto
pepino|cucumber|concombre|cetriolo
pescado de mar|sea fish|poisson de mer|pesce di mare
pescado y marisco|fish and seafood|poissons et fruits de mer|pesce e frutti di mare
peso vivo|live weight|poids vif|peso vivo
piensos|feed|aliments pour animaux|mangimi
pimiento|peppers|poivron|peperone
platos preparados y otros alimentos|ready meals and other food|plats préparés et autres aliments|piatti pronti e altri alimenti
precio de compra|purchase price|prix d’achat|prezzo d’acquisto
precio de venta|selling price|prix de vente|prezzo di vendita
queso|cheese|fromage|formaggio
refrigerada o congelada|chilled or frozen|réfrigérée ou congelée|refrigerata o congelata
resultado ordinario|ordinary result|résultat courant|risultato ordinario
semilla|seed|graines|semi
todas las especies|all species|toutes espèces|tutte le specie
tomate|tomatoes|tomate|pomodoro
total|total|total|totale
total carnes|total meat|total viandes|totale carni
total hortalizas|total vegetables|total légumes|totale ortaggi
tubérculos|tubers|tubercules|tuberi
tubérculos frescos|fresh tubers|tubercules frais|tuberi freschi
tubérculos y legumbres|tubers and pulses|tubercules et légumineuses|tuberi e legumi
unidades|units|unités|unità
vaca|cow|vache|vacca
vacuno y ternera|beef and veal|bovins et veaux|bovini e vitelli
valor/cantidad|value/quantity|valeur/quantité|valore/quantità
venta interior|domestic sales|ventes intérieures|vendite interne
yogur y similares|yoghurt and similar products|yaourt et produits similaires|yogurt e prodotti simili
zanahoria de invierno|winter carrots|carotte d’hiver|carota invernale
índice general|general index|indice général|indice generale
índice general de precios al consumo|general consumer price index|indice général des prix à la consommation|indice generale dei prezzi al consumo
carne de ave|poultry meat|viande de volaille|carne di pollame'''
GL = {}
for ln in G.split('\n'):
    es, en, fr, it = ln.split('|'); GL[es] = {'en': en, 'fr': fr, 'it': it}
PASS = {'Statbel', 'CBS', 'INE', 'ZSRIR', 'Agreste', 'TERUTI', 'World Bank', 'Alberta Agriculture', 'EU Agri-food Portal', 'AOP', 'VDN', 'TOTAL VINS', 'AOP/IGP/eaux-de-vie', 'Olive oil produced'}
FRSEG = re.compile(r'^(\d-\s)?(Récolte|Sols |TOTAL)|^Récolte')
SPLIT = re.compile(r'(, |: | - | · |\(|\))')


def conv(label, lg):
    out, miss = [], []
    for b in SPLIT.split(label):
        s = b.strip()
        if not s or SPLIT.fullmatch(b): out.append(b); continue
        lead = b[:len(b) - len(b.lstrip())]; trail = b[len(b.rstrip()):]
        if s in GL: out.append(lead + GL[s][lg] + trail)
        elif s in PASS or FRSEG.search(s) or re.fullmatch(r'[\d.,\s%/]+', s): out.append(b)
        else: miss.append(s); out.append(b)
    r = ''.join(out)
    return r[:1].upper() + r[1:], miss


def main():
    path = ROOT / 'data' / 'label-gloss' / 'mapa-es.json'
    doc = json.loads(path.read_text(encoding='utf-8')); T = doc['t']
    ES = re.compile(r'\b(precio|precios|de|del|para|leche|trigo|cebada|maíz|cerdo|vacuno|pienso|colza|centeno|azúcar|superficie|producción|produccion|ganado|cabezas|explotaciones|aceite|ovino|bovino|porcino|carne|huevos|compra|venta|media|medio|IPC|consumo|autoabastecimiento|índice|Bélgica|Países Bajos|Polonia|por|habitante|frutas|hortalizas|patata|cebolla|cereales|plantas|rendimiento)\b', re.I)
    EN = re.compile(r'\b(the|price|prices|area|production|of|and|for|annual|monthly|index|average|by|per|wine|milk|wheat|barley|harvest|forecast|cattle|pigs|farm|input|inputs)\b', re.I)
    labels = {}
    for f in sorted(glob.glob(str(ROOT / 'data' / 'catalog' / '*.json'))):
        cc = Path(f).stem
        if cc not in ('BE', 'NL', 'PT', 'PL', 'FR', 'EU', 'CA'): continue
        try: d = json.loads(Path(f).read_text(encoding='utf-8'))
        except Exception: continue
        for s in d.get('series', []) if isinstance(d, dict) else []:
            l = s.get('label', '')
            if cc == 'FR' and not l.startswith(('Produccion de vino', 'Uso del suelo')): continue
            if len(ES.findall(l)) >= 2 and len(ES.findall(l)) > len(EN.findall(l)) and l not in T: labels[l] = cc
    add, missing = {}, {}
    for l in labels:
        e = {}
        for lg in ('en', 'fr', 'it'):
            r, m = conv(l, lg)
            if m: missing[l] = m
            e[lg] = r
        add[l] = e
    if missing:
        print('FALTAN TERMINOS (no se escribe nada):')
        for l, m in missing.items(): print(' ', l, '->', m)
        sys.exit(1)
    print(len(add), 'etiquetas nuevas')
    if '--check' in sys.argv: sys.exit(1 if add else 0)
    T.update(add)
    doc['t'] = dict(sorted(T.items(), key=lambda kv: kv[0]))
    doc['note'] = doc['note'].split(' Ampliado')[0] + ' Ampliado el 29-oct-2026 con las etiquetas en español del catálogo de Bélgica, Países Bajos, Portugal, Polonia y vino/uso del suelo de Francia (scripts/build-label-gloss-catalog-es.py).'
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
