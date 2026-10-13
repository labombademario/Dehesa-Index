#!/usr/bin/env python3
"""Paquete por país para la app móvil -> data/app/v1/env/<CC>.json y data/app/v1/env/index.json (12-oct-2026).
Gasóleo agrícola, emisiones agrarias, sequía y nitratos de los 10 países que tienen el «paquete equivalente al MITECO» en la web
(ES FR DE IT PL BE AT HR IE NL). No descarga nada: lee los ficheros que ya publican sus pipelines y los pasa a un formato común
de bloques que la app pinta con una sola pantalla:
  block = {id, title{es,en,fr,it}, asOf, stats[{label, value, unit, dec, sub?}], charts[{label, unit, series[{label, points[[fecha, v]]}]}],
           bars[{title, unit, dec, items[{label, value, sub?}]}], note, source{name, url}, link?}
Las cifras son las de los ficheros (sin estimar nada); si un país no tiene un bloque se dice en la nota del bloque «missing».
Uso: python3 scripts/build-app-env.py"""
import datetime, hashlib, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
OUT = DATA / 'app' / 'v1' / 'env'
LG = ['es', 'en', 'fr', 'it']
def L(es, en, fr, it): return {'es': es, 'en': en, 'fr': fr, 'it': it}
def J(name):
    try: return json.loads((DATA / (name + '.json')).read_text(encoding='utf-8'))
    except Exception: return None
def r(v, d=4): return None if v is None else round(float(v), d)
def stat(label, value, unit='', dec=2, sub=None):
    s = {'label': label, 'value': r(value, 6), 'unit': unit, 'dec': dec}
    if sub: s['sub'] = sub
    return s
def chart(label, unit, series): return {'label': label, 'unit': unit, 'series': [{'label': sl, 'points': [[p[0], r(p[1])] for p in pts if p[1] is not None]} for sl, pts in series if pts]}
def bars(title, unit, dec, items): return {'title': title, 'unit': unit, 'dec': dec, 'items': [{'label': lb, 'value': r(v, 4), **({'sub': s} if s else {})} for lb, v, s in items if v is not None]}
def block(id_, title, asOf, stats=(), charts=(), bars_=(), note=None, source=None, link=None):
    b = {'id': id_, 'title': title, 'asOf': asOf, 'stats': [s for s in stats if s and s.get('value') is not None], 'charts': [c for c in charts if c and c['series']], 'bars': [x for x in bars_ if x and x['items']]}
    if note: b['note'] = note
    if source: b['source'] = source
    if link: b['link'] = link
    return b
def src(doc, name=None):
    s = (doc or {}).get('source') or {}
    return {'name': name or s.get('name', ''), 'url': s.get('url', '')}
def weekly(rows, i, years=10):
    if not rows: return []
    cut = str(int(rows[-1][0][:4]) - years)
    return [[x[0], x[i]] for x in rows if x[0] >= cut and len(x) > i and x[i] is not None]
# nombres de regiones (js/region-names.js: en|es|fr|it)
RN = {}
_s = (ROOT / 'js' / 'region-names.js').read_text(encoding='utf-8')
for cc in ['IT', 'DE', 'AT', 'BE', 'PL', 'ES', 'FR']:
    m = re.search(r"var %s = \{(.*?)\};" % cc, _s, re.S)
    if m: RN[cc] = {k: dict(zip(['en', 'es', 'fr', 'it'], v.split('|'))) for k, v in re.findall(r"(\w+): '([^']*)'", m.group(1))}
def rn(cc, code): return RN.get(cc, {}).get(code) or {l: code for l in LG}
def same(x): return {l: x for l in LG}
def fill(t, **kw): return {l: re.sub(r'\{(\w+)\}', lambda m: str(kw.get(m.group(1), m.group(0))), v) for l, v in t.items()}
EUR_L = '€/l'
T_DIESEL = L('Gasóleo agrícola', 'Farm diesel', 'Gazole agricole', 'Gasolio agricolo')
T_GHG = L('Emisiones de la agricultura', 'Farm emissions', 'Émissions de l’agriculture', 'Emissioni dell’agricoltura')
T_DRY = L('Sequía', 'Drought', 'Sécheresse', 'Siccità')
T_NIT = L('Nitratos en el agua', 'Nitrates in water', 'Nitrates dans l’eau', 'Nitrati nell’acqua')
WB = L('Gasóleo en surtidor (Boletín Petrolero UE)', 'Pump diesel (EU Weekly Oil Bulletin)', 'Gazole à la pompe (Bulletin pétrolier UE)', 'Gasolio alla pompa (Bollettino petrolifero UE)')
WT, WN = L('Con impuestos', 'With taxes', 'TTC', 'Con tasse'), L('Sin impuestos', 'Before taxes', 'Hors taxes', 'Senza tasse')
def wob_chart(d, it=1, inn=2):
    return chart(WB, EUR_L, [(WT, weekly(d.get('weekly'), it)), (WN, weekly(d.get('weekly'), inn))])
def wob_stats(d, it=1, inn=2):
    w = d.get('weekly') or []
    if not w: return []
    x = w[-1]; y = next((q for q in reversed(w) if q[0] <= str(int(x[0][:4]) - 1) + x[0][4:]), None)
    return [stat(L('Gasóleo en surtidor, semana del {d}', 'Pump diesel, week of {d}', 'Gazole à la pompe, semaine du {d}', 'Gasolio alla pompa, settimana del {d}'), x[it], EUR_L, 3, sub={'d': x[0]}),
            stat(L('Sin impuestos', 'Before taxes', 'Hors taxes', 'Senza tasse'), x[inn] if len(x) > inn else None, EUR_L, 3),
            stat(L('Hace un año', 'A year ago', 'Il y a un an', 'Un anno fa'), y[it] if y else None, EUR_L, 3)]

# ---------------- gasóleo ----------------
def diesel_ES():
    d = J('es-gasoleo-b');  P = (J('spain-crops/crops-hortalizas') or {}).get('provinces', {})
    if not d: return None
    lt = d['latest']; rows = d['history']['rows']
    items = sorted([(same(P.get(k, k)), v[0], None) for k, v in lt['provinces'].items() if v and v[0]], key=lambda z: z[1])
    return block('diesel', T_DIESEL, lt['date'],
        [stat(L('Gasóleo B (agrícola), mediana de España', 'Diesel B (farm), Spain median', 'Gazole B (agricole), médiane Espagne', 'Gasolio B (agricolo), mediana Spagna'), lt['b'], EUR_L, 3),
         stat(L('Gasóleo A (automoción)', 'Diesel A (road)', 'Gazole A (routier)', 'Gasolio A (autotrazione)'), lt['a'], EUR_L, 3),
         stat(L('Estaciones con gasóleo B', 'Stations selling diesel B', 'Stations avec gazole B', 'Stazioni con gasolio B'), lt['nb'], '', 0)],
        [chart(L('Mediana diaria en estaciones', 'Daily median at stations', 'Médiane quotidienne en station', 'Mediana giornaliera nelle stazioni'), EUR_L, [(L('Gasóleo B', 'Diesel B', 'Gazole B', 'Gasolio B'), [[x[0], x[1]] for x in rows]), (L('Gasóleo A', 'Diesel A', 'Gazole A', 'Gasolio A'), [[x[0], x[2]] for x in rows])])],
        [bars(L('Gasóleo B por provincia (mediana)', 'Diesel B by province (median)', 'Gazole B par province (médiane)', 'Gasolio B per provincia (mediana)'), EUR_L, 3, items)],
        L('El gasóleo B es el gasóleo agrícola, con impuesto especial reducido y coloreado. Precios de venta al público de cada estación (Ministerio para la Transición Ecológica, geoportal de gasolineras).', 'Diesel B is farm diesel, dyed and with a reduced excise duty. Retail prices at each station (Spanish Ministry for the Ecological Transition, fuel-station geoportal).', 'Le gazole B est le gazole agricole, coloré et à accise réduite. Prix de vente en station (ministère espagnol de la Transition écologique).', 'Il gasolio B è il gasolio agricolo, colorato e con accisa ridotta. Prezzi alla pompa di ogni stazione (Ministero spagnolo per la Transizione ecologica).'),
        src(d, 'MITECO, Geoportal de gasolineras'))
def diesel_FR():
    d = J('fr-gnr'); N = (J('fr-nitrates') or {}).get('deptNames', {})
    if not d: return None
    x = d['weekly'][-1]; st = d.get('stations') or {}
    return block('diesel', T_DIESEL, d.get('asOf'),
        [stat(L('Gazole no de carretera (GNR), semana del {d}', 'Off-road diesel (GNR), week of {d}', 'Gazole non routier (GNR), semaine du {d}', 'Gasolio non stradale (GNR), settimana del {d}'), x[1], EUR_L, 3, sub={'d': x[0]}),
         stat(L('GNR sin impuestos', 'GNR before taxes', 'GNR hors taxes', 'GNR senza tasse'), x[2], EUR_L, 3), stat(L('Gasóleo de carretera', 'Road diesel', 'Gazole routier', 'Gasolio stradale'), x[3], EUR_L, 3),
         stat(L('GNR en estaciones, mediana de hoy', 'GNR at stations, today’s median', 'GNR en station, médiane du jour', 'GNR nelle stazioni, mediana di oggi'), st.get('median'), EUR_L, 3)],
        [chart(L('Precio medio semanal (Ministerio)', 'Weekly average (Ministry)', 'Prix moyen hebdomadaire (ministère)', 'Prezzo medio settimanale (ministero)'), EUR_L, [(L('GNR', 'GNR', 'GNR', 'GNR'), [[q[0], q[1]] for q in d['weekly']]), (L('Gasóleo de carretera', 'Road diesel', 'Gazole routier', 'Gasolio stradale'), [[q[0], q[3]] for q in d['weekly']])])],
        [bars(L('GNR por departamento (mediana en estaciones)', 'GNR by department (station median)', 'GNR par département (médiane)', 'GNR per dipartimento (mediana)'), EUR_L, 3, sorted([(same(N.get(k, k)), v[0], None) for k, v in (st.get('departments') or {}).items() if v and v[0]], key=lambda z: z[1]))],
        L('El GNR es el gasóleo que usan tractores y maquinaria agrícola, con un impuesto menor que el de carretera.', 'GNR is the diesel used by tractors and farm machinery, taxed less than road diesel.', 'Le GNR est le gazole des tracteurs et engins agricoles, moins taxé que le gazole routier.', 'Il GNR è il gasolio di trattori e macchine agricole, tassato meno di quello stradale.'), src(d))
def diesel_DE():
    d = J('de-diesel')
    if not d: return None
    a = d.get('agrardiesel') or {}
    return block('diesel', T_DIESEL, d.get('asOf'), wob_stats(d) + [
        stat(L('Devolución «Agrardiesel»', '“Agrardiesel” refund', 'Remboursement « Agrardiesel »', 'Rimborso «Agrardiesel»'), a.get('eurPerLitre'), EUR_L, 4),
        stat(L('Coste para el agricultor (sin IVA y con devolución)', 'Farmer’s cost (net of VAT and refund)', 'Coût pour l’agriculteur (hors TVA, après remboursement)', 'Costo per l’agricoltore (senza IVA, con rimborso)'), d.get('farmCost'), EUR_L, 3)],
        [wob_chart(d)], [], L('Alemania no publica un precio del gasóleo agrícola: se muestra el de surtidor y la devolución de impuestos que reciben los agricultores (§ 57 de la ley del impuesto sobre la energía).', 'Germany publishes no farm diesel price: pump diesel and the tax refund farmers receive (§ 57 Energy Tax Act) are shown.', 'L’Allemagne ne publie pas de prix du gazole agricole : prix à la pompe et remboursement fiscal aux agriculteurs (§ 57).', 'La Germania non pubblica un prezzo del gasolio agricolo: prezzo alla pompa e rimborso fiscale agli agricoltori (§ 57).'), src(d))
def diesel_IT():
    d = J('it-fuel')
    if not d: return None
    st = d.get('stations') or {}
    w = d['weekly']; x = w[-1]; y = next((q for q in reversed(w) if q[0] <= str(int(x[0][:4]) - 1) + x[0][4:]), None)
    return block('diesel', T_DIESEL, d.get('asOf'), [stat(L('Gasóleo, media semanal del Ministerio ({d})', 'Diesel, Ministry weekly average ({d})', 'Gazole, moyenne hebdomadaire du ministère ({d})', 'Gasolio, media settimanale del ministero ({d})'), x[1], EUR_L, 3, sub={'d': x[0]}),
        stat(L('Hace un año', 'A year ago', 'Il y a un an', 'Un anno fa'), y[1] if y else None, EUR_L, 3), stat(L('Gasóleo de calefacción', 'Heating oil', 'Fioul', 'Gasolio da riscaldamento'), x[2], EUR_L, 3)] + [stat(L('Gasóleo en estaciones, mediana de hoy', 'Diesel at stations, today’s median', 'Gazole en station, médiane du jour', 'Gasolio nelle stazioni, mediana di oggi'), st.get('median'), EUR_L, 3)],
        [chart(L('Precio medio semanal (MASE)', 'Weekly average (MASE)', 'Prix moyen hebdomadaire (MASE)', 'Prezzo medio settimanale (MASE)'), EUR_L, [(L('Gasóleo', 'Diesel', 'Gazole', 'Gasolio'), weekly(d['weekly'], 1)), (L('Gasóleo de calefacción', 'Heating oil', 'Fioul', 'Gasolio da riscaldamento'), weekly(d['weekly'], 2))])],
        [bars(L('Gasóleo por región (mediana en estaciones)', 'Diesel by region (station median)', 'Gazole par région (médiane)', 'Gasolio per regione (mediana)'), EUR_L, 3, sorted([(rn('IT', k), v[0], None) for k, v in (st.get('regions') or {}).items() if v and v[0]], key=lambda z: z[1]))],
        L('Italia no publica en abierto el precio del gasóleo agrícola: se muestra el de automoción del Ministerio y de las estaciones.', 'Italy publishes no open farm diesel price: road diesel from the Ministry and stations is shown.', 'L’Italie ne publie pas de prix ouvert du gazole agricole : gazole routier du ministère et des stations.', 'L’Italia non pubblica in formato aperto il prezzo del gasolio agricolo: si mostra quello per autotrazione.'), src(d))
def diesel_PL():
    d = J('pl-diesel')
    if not d: return None
    f = d.get('refund') or {}
    return block('diesel', T_DIESEL, d.get('asOf'), wob_stats(d) + [
        stat(L('Devolución del impuesto especial', 'Excise refund', 'Remboursement d’accise', 'Rimborso dell’accisa'), f.get('zlPerLitre'), 'zł/l', 2, sub={'d': str(f.get('year', ''))}),
        stat(L('Litros con devolución por hectárea', 'Refunded litres per hectare', 'Litres remboursés par hectare', 'Litri rimborsati per ettaro'), f.get('litresPerHa'), 'l/ha', 0),
        stat(L('Coste para el agricultor', 'Farmer’s cost', 'Coût pour l’agriculteur', 'Costo per l’agricoltore'), d.get('farmCostPLN'), 'zł/l', 2)],
        [wob_chart(d)], [], L('En Polonia el agricultor paga el gasóleo de surtidor y recupera parte del impuesto especial hasta un límite de litros por hectárea y por animal.', 'In Poland farmers pay pump prices and recover part of the excise up to a number of litres per hectare and per animal.', 'En Pologne, l’agriculteur paie le prix à la pompe et récupère une partie de l’accise, plafonnée par hectare et par animal.', 'In Polonia l’agricoltore paga il prezzo alla pompa e recupera parte dell’accisa entro un limite di litri per ettaro e per capo.'), src(d))
def diesel_BE():
    d = J('be-diesel')
    if not d: return None
    x = d['daily'][-1]
    return block('diesel', T_DIESEL, d.get('asOf'),
        [stat(L('Gasóleo rojo, precio máximo oficial (≥2.000 l), {d}', 'Red diesel, official maximum price (≥2,000 l), {d}', 'Gazole rouge, prix maximum officiel (≥2 000 l), {d}', 'Gasolio rosso, prezzo massimo ufficiale (≥2.000 l), {d}'), x[1], EUR_L, 3, sub={'d': x[0]}),
         stat(L('Gasóleo rojo, menos de 2.000 l', 'Red diesel, under 2,000 l', 'Gazole rouge, moins de 2 000 l', 'Gasolio rosso, meno di 2.000 l'), x[2], EUR_L, 3),
         stat(L('Gasóleo de carretera (B7)', 'Road diesel (B7)', 'Gazole routier (B7)', 'Gasolio stradale (B7)'), x[3], EUR_L, 3),
         stat(L('Gasóleo rojo sin IVA', 'Red diesel before VAT', 'Gazole rouge hors TVA', 'Gasolio rosso senza IVA'), d.get('farmNoVat'), EUR_L, 3)],
        [chart(L('Precio máximo oficial diario', 'Daily official maximum price', 'Prix maximum officiel quotidien', 'Prezzo massimo ufficiale giornaliero'), EUR_L, [(L('Gasóleo rojo', 'Red diesel', 'Gazole rouge', 'Gasolio rosso'), [[q[0], q[1]] for q in d['daily']]), (L('Carretera', 'Road', 'Routier', 'Stradale'), [[q[0], q[3]] for q in d['daily']])]), wob_chart(d)], [],
        L('Bélgica fija cada día el precio máximo del gasóleo rojo (agrícola) y del de carretera.', 'Belgium sets a daily maximum price for red (farm) diesel and road diesel.', 'La Belgique fixe chaque jour le prix maximum du gazole rouge et du gazole routier.', 'Il Belgio fissa ogni giorno il prezzo massimo del gasolio rosso e di quello stradale.'), src(d))
def diesel_AT():
    d = J('at-diesel')
    if not d: return None
    f = d.get('refund') or {}
    return block('diesel', T_DIESEL, d.get('asOf'), wob_stats(d) + [
        stat(L('Devolución por litro (provisional)', 'Refund per litre (provisional)', 'Remboursement par litre (provisoire)', 'Rimborso per litro (provvisorio)'), f.get('eurPerLitre'), EUR_L, 3),
        stat(L('Litros por hectárea de cultivo con devolución', 'Refunded litres per hectare of arable land', 'Litres remboursés par hectare de terres arables', 'Litri rimborsati per ettaro di seminativo'), (f.get('litresPerHa') or {}).get('arable'), 'l/ha', 0),
        stat(L('Coste para el agricultor (sin IVA)', 'Farmer’s cost (net of VAT)', 'Coût pour l’agriculteur (hors TVA)', 'Costo per l’agricoltore (senza IVA)'), d.get('farmCostNet'), EUR_L, 3)],
        [wob_chart(d)], [], L('Austria devuelve a los agricultores parte del impuesto del gasóleo según la superficie y el cultivo.', 'Austria refunds farmers part of the diesel tax by area and crop.', 'L’Autriche rembourse une partie de la taxe sur le gazole selon la surface et la culture.', 'L’Austria rimborsa parte dell’imposta sul gasolio in base a superficie e coltura.'), src(d))
def diesel_HR():
    d = J('hr-diesel')
    if not d: return None
    x = d['official'][-1]
    return block('diesel', T_DIESEL, d.get('asOf'),
        [stat(L('Gasóleo azul (agrícola), precio máximo, desde el {d}', 'Blue diesel (farm), maximum price, from {d}', 'Gazole bleu (agricole), prix maximum, depuis le {d}', 'Gasolio blu (agricolo), prezzo massimo, dal {d}'), x[3], EUR_L, 2, sub={'d': x[0]}),
         stat(L('Gasóleo de carretera', 'Road diesel', 'Gazole routier', 'Gasolio stradale'), x[2], EUR_L, 2), stat(L('Gasolina', 'Petrol', 'Essence', 'Benzina'), x[1], EUR_L, 2),
         stat(L('Gasóleo azul sin las medidas del Gobierno', 'Blue diesel without government measures', 'Gazole bleu sans les mesures', 'Gasolio blu senza le misure'), x[5], EUR_L, 2)],
        [chart(L('Precios máximos oficiales', 'Official maximum prices', 'Prix maximum officiels', 'Prezzi massimi ufficiali'), EUR_L, [(L('Gasóleo azul', 'Blue diesel', 'Gazole bleu', 'Gasolio blu'), [[q[0], q[3]] for q in d['official']]), (L('Carretera', 'Road', 'Routier', 'Stradale'), [[q[0], q[2]] for q in d['official']])]), wob_chart(d)], [],
        L('El Gobierno de Croacia fija cada semana el precio máximo del gasóleo azul, que compran agricultores y pescadores sin impuesto especial.', 'Croatia’s government sets a weekly maximum price for blue diesel, bought by farmers and fishers without excise.', 'Le gouvernement croate fixe chaque semaine le prix maximum du gazole bleu, sans accise.', 'Il governo croato fissa ogni settimana il prezzo massimo del gasolio blu, senza accisa.'), src(d))
def diesel_IE():
    d = J('ie-diesel')
    if not d: return None
    c = d['clearance'][-1]; p = d['prices'][-1]
    return block('diesel', T_DIESEL, d.get('asOf'), wob_stats(d) + [
        stat(L('Gasóleo marcado despachado, {d}', 'Marked gas oil cleared, {d}', 'Gazole marqué livré, {d}', 'Gasolio marcato immesso, {d}'), c[3], L('millones de l', 'million l', 'millions de l', 'milioni di l'), 0, sub={'d': c[0]}),
        stat(L('Índice del combustible agrario (2020 = 100)', 'Farm fuel index (2020 = 100)', 'Indice du carburant agricole (2020 = 100)', 'Indice del carburante agricolo (2020 = 100)'), p[1], '', 1, sub={'d': p[0]})],
        [wob_chart(d), chart(L('Gasóleo marcado despachado cada mes', 'Marked gas oil cleared each month', 'Gazole marqué livré chaque mois', 'Gasolio marcato immesso ogni mese'), L('millones de l', 'million l', 'millions de l', 'milioni di l'), [(L('Gasóleo marcado', 'Marked gas oil', 'Gazole marqué', 'Gasolio marcato'), [[q[0], q[3]] for q in d['clearance']])])], [],
        L('Irlanda no publica el precio del gasóleo marcado («green diesel»); se muestran el de surtidor, los litros despachados y el índice de precios del CSO.', 'Ireland publishes no marked gas oil price; pump diesel, litres cleared and the CSO price index are shown.', 'L’Irlande ne publie pas le prix du gazole marqué ; prix à la pompe, volumes et indice du CSO.', 'L’Irlanda non pubblica il prezzo del gasolio marcato; prezzo alla pompa, volumi e indice del CSO.'), src(d))
def diesel_NL():
    d = J('nl-diesel')
    if not d: return None
    f = d['farm'][-1]; pp = d['pump'][-1]
    return block('diesel', T_DIESEL, d.get('asOf'), wob_stats(d) + [
        stat(L('Gasóleo en surtidor según el CBS, {d}', 'Pump diesel according to CBS, {d}', 'Gazole à la pompe selon le CBS, {d}', 'Gasolio alla pompa secondo il CBS, {d}'), pp[1], EUR_L, 3, sub={'d': pp[0]}),
        stat(L('Precio que pagan las explotaciones, {d} (sin IVA deducible)', 'Price farms pay, {d} (excl. deductible VAT)', 'Prix payé par les exploitations, {d} (hors TVA)', 'Prezzo pagato dalle aziende, {d} (senza IVA)'), f[1], EUR_L, 3, sub={'d': str(f[0])})],
        [wob_chart(d), chart(L('Precio de compra del gasóleo por las explotaciones (anual)', 'Price farms pay for diesel (annual)', 'Prix du gazole payé par les exploitations (annuel)', 'Prezzo del gasolio pagato dalle aziende (annuale)'), EUR_L, [(L('Explotaciones', 'Farms', 'Exploitations', 'Aziende'), [[str(q[0]), q[1]] for q in d['farm']])])], [],
        L('No hay precio abierto del gasóleo rojo agrícola en los Países Bajos: se muestran el de surtidor y el precio anual de compra de las explotaciones (Eurostat y CBS).', 'There is no open price for agricultural red diesel in the Netherlands: pump diesel and the annual price farms pay (Eurostat, CBS) are shown.', 'Pas de prix ouvert du gazole rouge aux Pays-Bas : prix à la pompe et prix annuel payé par les exploitations.', 'Nessun prezzo aperto del gasolio rosso nei Paesi Bassi: prezzo alla pompa e prezzo annuo pagato dalle aziende.'), src(d))

# ---------------- emisiones ----------------
CAT = {'enteric': L('Digestión del ganado', 'Livestock digestion', 'Digestion du bétail', 'Digestione del bestiame'), 'manure': L('Estiércol', 'Manure', 'Effluents', 'Letame'), 'soils': L('Suelos agrícolas (abonos)', 'Farm soils (fertilisers)', 'Sols agricoles (engrais)', 'Suoli agricoli (concimi)'),
       'rice': L('Arroz', 'Rice', 'Riz', 'Riso'), 'liming': L('Encalado', 'Liming', 'Chaulage', 'Calcitazione'), 'urea': L('Urea', 'Urea', 'Urée', 'Urea'), 'burning': L('Quema de rastrojos', 'Residue burning', 'Brûlage des résidus', 'Bruciatura dei residui'), 'otherC': L('Otros', 'Other', 'Autres', 'Altro')}
SPC = {'beef': L('Vacuno de carne', 'Beef cattle', 'Bovins viande', 'Bovini da carne'), 'dairy': L('Vacuno de leche', 'Dairy cattle', 'Vaches laitières', 'Bovini da latte'), 'cattle': L('Vacuno', 'Cattle', 'Bovins', 'Bovini'), 'pigs': L('Porcino', 'Pigs', 'Porcs', 'Suini'),
       'sheep': L('Ovino', 'Sheep', 'Ovins', 'Ovini'), 'goats': L('Caprino', 'Goats', 'Caprins', 'Caprini'), 'poultry': L('Aves', 'Poultry', 'Volailles', 'Pollame'), 'other': L('Otros animales', 'Other animals', 'Autres animaux', 'Altri animali'), 'indirect': L('Indirectas (estiércol)', 'Indirect (manure)', 'Indirectes (effluents)', 'Indirette (letame)')}
def ghg(cc):
    d = J(cc.lower() + '-ghg-agri')
    if not d: return None
    Y = d['years']; A = d['agriculture']; N = d['national']; i = len(Y) - 1
    i90 = Y.index(1990) if 1990 in Y else None; i05 = Y.index(2005) if 2005 in Y else None
    pc = lambda a, b: (a / b - 1) * 100 if a and b else None
    return block('ghg', T_GHG, str(Y[i]),
        [stat(L('Agricultura, {d}', 'Agriculture, {d}', 'Agriculture, {d}', 'Agricoltura, {d}'), A[i] / 1000, L('Mt CO₂-eq', 'Mt CO₂-eq', 'Mt CO₂-éq', 'Mt CO₂-eq'), 1, sub={'d': str(Y[i])}),
         stat(L('Parte de todas las emisiones del país', 'Share of the country’s total emissions', 'Part des émissions totales du pays', 'Quota delle emissioni totali del paese'), A[i] / N[i] * 100 if N[i] else None, '%', 1),
         stat(L('Cambio desde 1990', 'Change since 1990', 'Évolution depuis 1990', 'Variazione dal 1990'), pc(A[i], A[i90]) if i90 is not None else None, '%', 0),
         stat(L('Cambio desde 2005', 'Change since 2005', 'Évolution depuis 2005', 'Variazione dal 2005'), pc(A[i], A[i05]) if i05 is not None else None, '%', 0)],
        [chart(L('Emisiones de la agricultura por año', 'Farm emissions by year', 'Émissions agricoles par an', 'Emissioni agricole per anno'), 'Mt CO₂-eq', [(L('Agricultura', 'Agriculture', 'Agriculture', 'Agricoltura'), [[str(y), a / 1000] for y, a in zip(Y, A) if a is not None])])],
        [bars(fill(L('De dónde salen ({d})', 'Where they come from ({d})', 'D’où elles viennent ({d})', 'Da dove vengono ({d})'), d=Y[i]), 'Mt CO₂-eq', 2, sorted([(CAT.get(k, same(k)), v[i] / 1000 if v[i] else None, None) for k, v in d.get('byCategory', {}).items()], key=lambda z: -(z[1] or 0))),
         bars(L('Por tipo de ganado', 'By type of livestock', 'Par type d’élevage', 'Per tipo di bestiame'), 'Mt CO₂-eq', 2, sorted([(SPC.get(k, same(k)), v[i] / 1000 if v[i] else None, None) for k, v in d.get('bySpecies', {}).items()], key=lambda z: -(z[1] or 0)))],
        L('Inventario nacional de gases de efecto invernadero que cada país envía a la UE y a la ONU (Eurostat). No incluye el gasóleo de los tractores ni el uso de la tierra.', 'National greenhouse-gas inventory each country reports to the EU and the UN (Eurostat). Tractor fuel and land use are not included.', 'Inventaire national des gaz à effet de serre transmis à l’UE et à l’ONU (Eurostat). Hors carburant des tracteurs et usage des terres.', 'Inventario nazionale dei gas serra trasmesso a UE e ONU (Eurostat). Esclusi carburante dei trattori e uso del suolo.'),
        src(d, 'MITECO, inventario nacional de emisiones' if cc == 'ES' else 'Eurostat (env_air_gge)'))

# ---------------- sequía ----------------
def edo(cc):
    d = J(cc.lower() + '-drought')
    if not d: return None
    P = d['periods']; C = d['counties']
    def nat(i):
        w = sum(c['cells'] for c in C.values() if c['v'][i]); return sum((c['v'][i][1] + c['v'][i][2]) * c['cells'] for c in C.values() if c['v'][i]) / w if w else None
    n = len(P) - 1
    items = sorted([(same(c['name']), c['v'][n][1] + c['v'][n][2] if c['v'][n] else None, None) for c in C.values()], key=lambda z: -(z[1] or 0))
    stats = [stat(L('Superficie en aviso o alerta, {d}', 'Area under warning or alert, {d}', 'Surface en avertissement ou alerte, {d}', 'Superficie in allerta o allarme, {d}'), nat(n), '%', 1, sub={'d': P[n]})]
    charts = [chart(L('Superficie en aviso o alerta (cada 10 días)', 'Area under warning or alert (every 10 days)', 'Surface en avertissement ou alerte (tous les 10 jours)', 'Superficie in allerta o allarme (ogni 10 giorni)'), '%', [(same('%'), [[P[i], nat(i)] for i in range(len(P))])])]
    df = d.get('deficit')
    if df:
        import datetime as dt
        day = lambda k: (dt.date(df['curYear'], 4, 1) + dt.timedelta(days=k)).isoformat()
        stats.append(stat(L('Déficit de precipitación desde el 1 de abril ({d})', 'Precipitation deficit since 1 April ({d})', 'Déficit de précipitations depuis le 1er avril ({d})', 'Deficit di precipitazione dal 1° aprile ({d})'), df['cur'][-1], 'mm', 0, sub={'d': df['asOf']}))
        stats.append(stat(fill(L('Mediana {a}–{b} ese día', 'Median {a}–{b} on that day', 'Médiane {a}–{b} ce jour-là', 'Mediana {a}–{b} quel giorno'), a=df['since'], b=df['prevYear']), df['med'][len(df['cur']) - 1], 'mm', 0))
        charts.insert(0, chart(L('Déficit de precipitación acumulado (KNMI)', 'Cumulative precipitation deficit (KNMI)', 'Déficit de précipitations cumulé (KNMI)', 'Deficit di precipitazione cumulato (KNMI)'), 'mm', [(L('Este año', 'This year', 'Cette année', 'Quest’anno'), [[day(k), v] for k, v in enumerate(df['cur'])]), (L('Mediana', 'Median', 'Médiane', 'Mediana'), [[day(k), v] for k, v in enumerate(df['med'])])]))
    return block('drought', T_DRY, P[n], stats, charts, [bars(L('Superficie en aviso o alerta por región', 'Area under warning or alert by region', 'Surface en avertissement ou alerte par région', 'Superficie in allerta o allarme per regione'), '%', 0, items)],
        L('Indicador combinado de sequía del Observatorio Europeo de la Sequía: aviso = falta humedad en el suelo; alerta = además la vegetación sufre. Calculado por Dehesa Index para cada región.', 'European Drought Observatory combined drought indicator: warning = soil moisture deficit; alert = vegetation also stressed. Computed by Dehesa Index for each region.', 'Indicateur combiné de l’Observatoire européen de la sécheresse : avertissement = déficit d’humidité du sol ; alerte = végétation aussi touchée.', 'Indicatore combinato dell’Osservatorio europeo della siccità: allerta = deficit di umidità del suolo; allarme = anche la vegetazione soffre.'), src(d, 'European Drought Observatory (JRC, Copernicus)'))
def drought_ES():
    d = J('es-drought-ute')
    if not d: return None
    h = d['history'][-1]; u = h['ute']
    return block('drought', T_DRY, d['asOf'],
        [stat(L('Unidades de escasez en alerta o emergencia', 'Scarcity units on alert or emergency', 'Unités de pénurie en alerte ou urgence', 'Unità di scarsità in allerta o emergenza'), u.get('alert', 0) + u.get('emergency', 0), '', 0, sub={'d': str(sum(u.values()))}),
         stat(L('Unidades en prealerta', 'Units on pre-alert', 'Unités en pré-alerte', 'Unità in preallerta'), u.get('prealert', 0), '', 0),
         stat(L('Unidades en sequía prolongada', 'Units in prolonged drought', 'Unités en sécheresse prolongée', 'Unità in siccità prolungata'), h.get('utsDrought'), '', 0)], [],
        [bars(L('Índice de escasez por cuenca (0 = extrema, 1 = agua abundante)', 'Scarcity index by basin (0 = extreme, 1 = abundant water)', 'Indice de pénurie par bassin (0 = extrême, 1 = eau abondante)', 'Indice di scarsità per bacino (0 = estrema, 1 = acqua abbondante)'), '', 2, sorted([(same(k), v['global'].get('scarcity'), None) for k, v in d['demarcations'].items()], key=lambda z: (z[1] if z[1] is not None else 9)))],
        L('Índices del Observatorio Nacional de la Sequía por cuenca. En la pantalla de sequía de España está el mapa de cuencas y cada unidad.', 'National Drought Observatory indices by basin. The Spain drought screen has the basin map and each unit.', 'Indices de l’Observatoire national de la sécheresse par bassin. L’écran sécheresse Espagne montre la carte.', 'Indici dell’Osservatorio nazionale della siccità per bacino. La schermata siccità Spagna mostra la mappa.'), src(d, 'MITECO, Observatorio Nacional de la Sequía'), link='/sequia')
def drought_FR():
    d = J('fr-onde')
    if not d: return None
    M = d['months']; x = M[-1]; N = d.get('deptNames', {})
    pct = lambda t: (t[1] + t[2]) / sum(t) * 100 if sum(t) else None
    return block('drought', T_DRY, x['month'],
        [stat(L('Ríos observados sin agua corriente, {d}', 'Streams observed without flowing water, {d}', 'Cours d’eau observés sans écoulement, {d}', 'Corsi d’acqua osservati senza deflusso, {d}'), pct(x['total']), '%', 0, sub={'d': x['month']}),
         stat(L('Puntos secos', 'Dry points', 'Points à sec', 'Punti in secca'), x['total'][2], '', 0), stat(L('Puntos observados', 'Points observed', 'Points observés', 'Punti osservati'), sum(x['total']), '', 0)],
        [chart(L('Puntos sin agua corriente (red ONDE)', 'Points without flowing water (ONDE network)', 'Points sans écoulement (réseau ONDE)', 'Punti senza deflusso (rete ONDE)'), '%', [(same('%'), [[m['month'], pct(m['total'])] for m in M if sum(m['total'])])])],
        [bars(L('Por departamento observado', 'By observed department', 'Par département observé', 'Per dipartimento osservato'), '%', 0, sorted([(same(N.get(k, k)), pct(v), None) for k, v in x['departments'].items()], key=lambda z: -(z[1] or 0)))],
        L('La red ONDE de la OFB observa cada mes de mayo a septiembre si los arroyos llevan agua; fuera de esa época solo se observan algunos departamentos.', 'OFB’s ONDE network checks every month from May to September whether streams are flowing; outside that season only some departments are observed.', 'Le réseau ONDE de l’OFB observe chaque mois de mai à septembre l’écoulement des cours d’eau ; hors saison, seuls quelques départements.', 'La rete ONDE dell’OFB osserva ogni mese da maggio a settembre il deflusso dei corsi d’acqua.'), src(d, 'OFB, réseau ONDE'))
def drought_DE():
    d = J('de-soil-moisture')
    if not d: return None
    M = d['months']; V = d['values']; n = len(M) - 1; m = int(M[n][5:7]) - 1
    return block('drought', T_DRY, M[n],
        [stat(L('Humedad del suelo en Alemania, {d}', 'Soil moisture in Germany, {d}', 'Humidité du sol en Allemagne, {d}', 'Umidità del suolo in Germania, {d}'), V['DE'][n], '% nFK', 0, sub={'d': M[n]}),
         stat(L('Media de ese mes, 1991–2020', 'Average for that month, 1991–2020', 'Moyenne de ce mois, 1991–2020', 'Media di quel mese, 1991–2020'), d['clim']['DE'][m][0], '% nFK', 0)],
        [chart(L('Humedad del suelo (mensual)', 'Soil moisture (monthly)', 'Humidité du sol (mensuel)', 'Umidità del suolo (mensile)'), '% nFK', [(L('Alemania', 'Germany', 'Allemagne', 'Germania'), [[M[i], V['DE'][i]] for i in range(max(0, n - 119), n + 1)])])],
        [bars(L('Por estado federado', 'By federal state', 'Par Land', 'Per Land'), '% nFK', 0, sorted([(rn('DE', k), V[k][n], None) for k in d['regions'] if k != 'DE'], key=lambda z: z[1] if z[1] is not None else 999))],
        L('Agua disponible para las plantas en los primeros 60 cm del suelo bajo hierba, en % de la capacidad de campo útil (DWD). Por debajo del 50 % las plantas empiezan a sufrir.', 'Plant-available water in the top 60 cm under grass, as % of usable field capacity (DWD). Below 50% plants start to suffer.', 'Eau disponible pour les plantes dans les 60 premiers cm, en % de la réserve utile (DWD). Sous 50 % les plantes souffrent.', 'Acqua disponibile per le piante nei primi 60 cm, in % della capacità utile (DWD). Sotto il 50 % le piante soffrono.'), src(d, 'Deutscher Wetterdienst (DWD)'))
def drought_IT():
    d = J('it-water-severity')
    if not d: return None
    LV = {'normal': 0, 'low': 1, 'medium': 2, 'high': 3}; LN = {0: L('normal', 'normal', 'normale', 'normale'), 1: L('baja', 'low', 'faible', 'bassa'), 2: L('media', 'medium', 'moyenne', 'media'), 3: L('alta', 'high', 'élevée', 'alta')}
    items = sorted([(same(v['name']), LV.get(v['level'], 0), LN[LV.get(v['level'], 0)]) for v in d['districts'].values()], key=lambda z: -z[1])
    return block('drought', T_DRY, d['asOf'], [stat(L('Distritos con severidad hídrica media o alta', 'Districts with medium or high water severity', 'Districts en sévérité moyenne ou élevée', 'Distretti con severità idrica media o alta'), sum(1 for v in d['districts'].values() if v['level'] in ('medium', 'high')), '', 0, sub={'d': str(len(d['districts']))})], [],
        [bars(L('Severidad hídrica por distrito (0 normal – 3 alta)', 'Water severity by district (0 normal – 3 high)', 'Sévérité hydrique par district (0 normale – 3 élevée)', 'Severità idrica per distretto (0 normale – 3 alta)'), '', 0, items)],
        L('Nivel de severidad hídrica que declara cada observatorio de distrito hidrográfico (ISPRA).', 'Water-severity level declared by each river-basin district observatory (ISPRA).', 'Niveau de sévérité hydrique déclaré par chaque observatoire de district (ISPRA).', 'Livello di severità idrica dichiarato da ogni osservatorio di distretto (ISPRA).'), src(d, 'ISPRA, osservatori distrettuali'))
def drought_PL():
    d = J('pl-hydro-drought')
    if not d: return None
    V = d['voivodeships']
    return block('drought', T_DRY, d['asOf'], [stat(L('Avisos de sequía hidrológica vigentes', 'Hydrological drought warnings in force', 'Alertes de sécheresse hydrologique en vigueur', 'Avvisi di siccità idrologica in vigore'), len(d['warnings']), '', 0), stat(L('Voivodatos con aviso', 'Voivodeships with a warning', 'Voïvodies avec alerte', 'Voivodati con avviso'), sum(1 for v in V.values() if v['warnings']), '', 0, sub={'d': '16'})], [],
        [bars(L('Avisos por voivodato', 'Warnings by voivodeship', 'Alertes par voïvodie', 'Avvisi per voivodato'), '', 0, sorted([(rn('PL', k), v['warnings'], None) for k, v in V.items()], key=lambda z: -z[1]))],
        L('Avisos de sequía hidrológica (caudales bajos en los ríos) del Instituto de Meteorología y Gestión del Agua (IMGW-PIB).', 'Hydrological drought (low river flow) warnings from the Institute of Meteorology and Water Management (IMGW-PIB).', 'Alertes de sécheresse hydrologique (débits bas) de l’IMGW-PIB.', 'Avvisi di siccità idrologica (portate basse) dell’IMGW-PIB.'), src(d, 'IMGW-PIB'))
def drought_BE():
    d = J('be-drought')
    if not d: return None
    P = d['provinces']; s3 = (d.get('indices') or {}).get('spei3') or {}
    return block('drought', T_DRY, d['asOf'], [stat(L('Zonas de Flandes con prohibición de captar agua', 'Flemish zones with a water-abstraction ban', 'Zones flamandes avec interdiction de captage', 'Zone fiamminghe con divieto di prelievo'), (d.get('history') or [{}])[-1].get('banned'), '', 0, sub={'d': str(d.get('zonesTotal', ''))}),
        stat(L('Superficie seca o muy seca (SPEI-3)', 'Dry or very dry area (SPEI-3)', 'Surface sèche ou très sèche (SPEI-3)', 'Superficie secca o molto secca (SPEI-3)'), sum(v for k, v in (s3.get('shares') or {}).items() if k != 'normal') if s3 else None, '%', 0)], [],
        [bars(L('Superficie con prohibición de captar agua, por provincia', 'Area under abstraction ban, by province', 'Surface sous interdiction de captage, par province', 'Superficie con divieto di prelievo, per provincia'), '%', 0, sorted([(rn('BE', k), v.get('share'), None) for k, v in P.items()], key=lambda z: -(z[1] or 0)))],
        L('Solo Flandes publica estos datos (VMM, waterinfo). Las prohibiciones afectan a captar agua de ríos y arroyos para riego.', 'Only Flanders publishes these data (VMM, waterinfo). Bans cover drawing water from rivers and streams for irrigation.', 'Seule la Flandre publie ces données (VMM). Les interdictions visent le captage dans les cours d’eau.', 'Solo le Fiandre pubblicano questi dati (VMM). I divieti riguardano il prelievo dai corsi d’acqua.'), src(d, 'VMM, waterinfo.vlaanderen.be'))
def drought_AT():
    d = J('at-drought')
    if not d: return None
    a = d['austria']; g = d.get('groundwater') or {}; gc = g.get('classes') or {}
    return block('drought', T_DRY, d['asOf'], [stat(L('Superficie seca, últimos 90 días (SPEI-90 ≤ −1)', 'Dry area, last 90 days (SPEI-90 ≤ −1)', 'Surface sèche, 90 derniers jours (SPEI-90 ≤ −1)', 'Superficie secca, ultimi 90 giorni (SPEI-90 ≤ −1)'), a['spei90']['dry'], '%', 0),
        stat(L('Muy seca (≤ −1,5)', 'Very dry (≤ −1.5)', 'Très sèche (≤ −1,5)', 'Molto secca (≤ −1,5)'), a['spei90']['veryDry'], '%', 0), stat(L('SPEI-90 medio de Austria', 'Austria’s average SPEI-90', 'SPEI-90 moyen de l’Autriche', 'SPEI-90 medio dell’Austria'), a['spei90']['mean'], '', 2),
        stat(L('Pozos de agua subterránea bajos o muy bajos', 'Groundwater wells low or very low', 'Puits d’eau souterraine bas ou très bas', 'Pozzi di falda bassi o molto bassi'), (gc.get('low', 0) + gc.get('veryLow', 0)) / g['stations'] * 100 if g.get('stations') else None, '%', 0)],
        [chart(L('SPEI-90 medio (0 = normal; negativo = seco)', 'Average SPEI-90 (0 = normal; negative = dry)', 'SPEI-90 moyen (0 = normal ; négatif = sec)', 'SPEI-90 medio (0 = normale; negativo = secco)'), '', [(same('SPEI-90'), [[h['date'], h['spei90']] for h in d['history']])])],
        [bars(L('Superficie seca por estado (SPEI-90)', 'Dry area by state (SPEI-90)', 'Surface sèche par Land (SPEI-90)', 'Superficie secca per Land (SPEI-90)'), '%', 0, sorted([(rn('AT', k), v['spei90']['dry'], None) for k, v in d['lands'].items() if v.get('spei90')], key=lambda z: -z[1]))],
        L('Balance hídrico climático (lluvia menos evaporación) de GeoSphere Austria y nivel de los pozos del Ministerio de Agricultura.', 'Climatic water balance (rain minus evaporation) from GeoSphere Austria and well levels from the Agriculture Ministry.', 'Bilan hydrique climatique de GeoSphere Austria et niveau des puits du ministère.', 'Bilancio idrico climatico di GeoSphere Austria e livello dei pozzi del ministero.'), src(d, 'GeoSphere Austria; BMLUK'))

# ---------------- nitratos ----------------
def nit_FR():
    d = J('fr-nitrates')
    if not d: return None
    Y = d['years']; x = Y[-1]; N = d['deptNames']
    return block('nitrates', T_NIT, str(x['year']), [stat(L('Puntos de agua subterránea con 50 mg/l o más, {d}', 'Groundwater points at 50 mg/l or more, {d}', 'Points d’eau souterraine à 50 mg/l ou plus, {d}', 'Punti di falda a 50 mg/l o più, {d}'), x['over50'], '%', 1, sub={'d': str(x['year'])}),
        stat(L('Con 25 mg/l o más', 'At 25 mg/l or more', 'À 25 mg/l ou plus', 'A 25 mg/l o più'), x['over25'], '%', 1), stat(L('Mediana', 'Median', 'Médiane', 'Mediana'), x['median'], 'mg/l', 1)],
        [chart(L('Puntos con 50 mg/l o más', 'Points at 50 mg/l or more', 'Points à 50 mg/l ou plus', 'Punti a 50 mg/l o più'), '%', [(same('%'), [[str(q['year']), q['over50']] for q in Y])])],
        [bars(L('Departamentos con más puntos por encima de 50 mg/l', 'Departments with most points above 50 mg/l', 'Départements avec le plus de points au-dessus de 50 mg/l', 'Dipartimenti con più punti sopra 50 mg/l'), '%', 1, sorted([(same(N.get(k, k)), v[3], None) for k, v in x['departments'].items() if v[0] >= 20], key=lambda z: -z[1])[:20])],
        L('Análisis de nitrato en aguas subterráneas (ADES). 50 mg/l es el límite de la Directiva de Nitratos.', 'Nitrate analyses in groundwater (ADES). 50 mg/l is the Nitrates Directive limit.', 'Analyses de nitrates dans les eaux souterraines (ADES). 50 mg/l est la limite de la directive Nitrates.', 'Analisi dei nitrati nelle acque sotterranee (ADES). 50 mg/l è il limite della direttiva Nitrati.'), src(d, 'ADES (BRGM, OFB)'))
def nit_BE():
    d = J('be-nitrates')
    if not d: return None
    S = d['series']; x = S[-1]
    return block('nitrates', T_NIT, x[0], [stat(L('Puntos de control con más de 50 mg/l en zonas agrarias, {d}', 'Monitoring points above 50 mg/l in farm areas, {d}', 'Points de contrôle au-dessus de 50 mg/l en zone agricole, {d}', 'Punti di controllo sopra 50 mg/l in zone agricole, {d}'), x[2], '%', 1, sub={'d': x[0]})],
        [chart(L('Puntos por encima de 50 mg/l (invierno)', 'Points above 50 mg/l (winter)', 'Points au-dessus de 50 mg/l (hiver)', 'Punti sopra 50 mg/l (inverno)'), '%', [(same('%'), [[q[0][:4], q[2]] for q in S if q[2] is not None])])], [],
        L('Red MAP de la VMM en Flandes: arroyos en zonas agrarias, temporada de invierno. 50 mg/l es el límite de la Directiva de Nitratos.', 'VMM MAP network in Flanders: streams in farm areas, winter season. 50 mg/l is the Nitrates Directive limit.', 'Réseau MAP de la VMM en Flandre : cours d’eau en zone agricole, hiver.', 'Rete MAP della VMM nelle Fiandre: corsi d’acqua in zone agricole, inverno.'), src(d, 'VMM'))
def nit_IE():
    d = J('ie-nitrates')
    if not d: return None
    G = d['groundwater']; R = d['rivers']; g = G[-1]; rv = R[-1]
    return block('nitrates', T_NIT, g[0], [stat(L('Aguas subterráneas con 50 mg/l o más, {d}', 'Groundwater at 50 mg/l or more, {d}', 'Eaux souterraines à 50 mg/l ou plus, {d}', 'Acque sotterranee a 50 mg/l o più, {d}'), g[6], '%', 1, sub={'d': g[0]}),
        stat(L('Con 37,5 mg/l o más', 'At 37.5 mg/l or more', 'À 37,5 mg/l ou plus', 'A 37,5 mg/l o più'), g[5] + g[6], '%', 1), stat(L('Ríos en estado bueno o alto, {d}', 'Rivers in good or high status, {d}', 'Rivières en bon ou très bon état, {d}', 'Fiumi in stato buono o elevato, {d}'), rv[1] + rv[2], '%', 0, sub={'d': rv[0]})],
        [chart(L('Puntos de agua subterránea con 37,5 mg/l o más', 'Groundwater points at 37.5 mg/l or more', 'Points à 37,5 mg/l ou plus', 'Punti a 37,5 mg/l o più'), '%', [(same('%'), [[q[0], q[5] + q[6]] for q in G])])], [],
        L('Resumen anual de la Agencia de Protección Ambiental (EPA), publicado por el CSO.', 'Annual summary from the Environmental Protection Agency (EPA), published by the CSO.', 'Résumé annuel de l’EPA, publié par le CSO.', 'Riepilogo annuale dell’EPA, pubblicato dal CSO.'), src(d, 'EPA, vía CSO'))
def nit_NL():
    d = J('nl-nitrates')
    if not d: return None
    Z = d['leaching']; nm = {'zand': L('Arena', 'Sand', 'Sable', 'Sabbia'), 'klei': L('Arcilla', 'Clay', 'Argile', 'Argilla'), 'veen': L('Turba', 'Peat', 'Tourbe', 'Torba'), 'loess': L('Loess', 'Loess', 'Loess', 'Loess')}
    z = Z['zand'][-1]
    return block('nitrates', T_NIT, str(z[0]), [stat(L('Agua bajo las explotaciones en arena, media {d}', 'Water below farms on sand, mean {d}', 'Eau sous les exploitations sur sable, moyenne {d}', 'Acqua sotto le aziende su sabbia, media {d}'), z[1], 'mg/l', 1, sub={'d': str(z[0])}),
        stat(L('Agua subterránea, media nacional', 'Groundwater, national mean', 'Eaux souterraines, moyenne nationale', 'Acque sotterranee, media nazionale'), d['groundwater'][-1][1] if d.get('groundwater') else None, 'mg/l', 1)],
        [chart(L('Nitrato en el agua bajo las explotaciones (media)', 'Nitrate in water below farms (mean)', 'Nitrate sous les exploitations (moyenne)', 'Nitrato sotto le aziende (media)'), 'mg/l', [(nm[k], [[str(q[0]), q[1]] for q in Z[k]]) for k in ('zand', 'klei', 'veen') if k in Z])],
        [bars(L('Por tipo de suelo, último año', 'By soil type, latest year', 'Par type de sol, dernière année', 'Per tipo di suolo, ultimo anno'), 'mg/l', 1, [(nm[k], Z[k][-1][1], None) for k in Z])],
        L('Red LMM del RIVM: muestra de explotaciones agrarias. 50 mg/l es el límite de la Directiva de Nitratos.', 'RIVM LMM network: a sample of farms. 50 mg/l is the Nitrates Directive limit.', 'Réseau LMM du RIVM : échantillon d’exploitations. 50 mg/l est la limite de la directive.', 'Rete LMM del RIVM: campione di aziende. 50 mg/l è il limite della direttiva.'), src(d, 'RIVM, LMM'))
def missing(id_, title):
    return {'id': id_, 'title': title, 'missing': True, 'note': L('No hay datos abiertos de este tema para este país en Dehesa Index.', 'Dehesa Index has no open data on this topic for this country.', 'Dehesa Index n’a pas de données ouvertes sur ce sujet pour ce pays.', 'Dehesa Index non ha dati aperti su questo tema per questo paese.')}

PLAN = {
    'ES': [diesel_ES, lambda: ghg('ES'), drought_ES, None], 'FR': [diesel_FR, lambda: ghg('FR'), drought_FR, nit_FR], 'DE': [diesel_DE, lambda: ghg('DE'), drought_DE, None],
    'IT': [diesel_IT, lambda: ghg('IT'), drought_IT, None], 'PL': [diesel_PL, lambda: ghg('PL'), drought_PL, None], 'BE': [diesel_BE, lambda: ghg('BE'), drought_BE, nit_BE],
    'AT': [diesel_AT, lambda: ghg('AT'), drought_AT, None], 'HR': [diesel_HR, lambda: ghg('HR'), lambda: edo('HR'), None], 'IE': [diesel_IE, lambda: ghg('IE'), lambda: edo('IE'), nit_IE],
    'NL': [diesel_NL, lambda: ghg('NL'), lambda: edo('NL'), nit_NL],
}
TITLES = [('diesel', T_DIESEL), ('ghg', T_GHG), ('drought', T_DRY), ('nitrates', T_NIT)]
def main():
    OUT.mkdir(parents=True, exist_ok=True); idx = {}
    for cc, fns in PLAN.items():
        blocks = []
        for (bid, tt), fn in zip(TITLES, fns):
            b = None
            if fn:
                try: b = fn()
                except Exception as e: print('AVISO', cc, bid, repr(e))
            blocks.append(b or missing(bid, tt))
        doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'country': cc, 'blocks': blocks}
        body = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
        (OUT / (cc + '.json')).write_text(body, encoding='utf-8')
        idx[cc] = {'hash': hashlib.sha1(json.dumps(blocks, sort_keys=True).encode()).hexdigest()[:12], 'blocks': [b['id'] for b in blocks if not b.get('missing')]}
        print(cc, len(body) // 1024, 'KB', [b['id'] + ('-' if b.get('missing') else '') for b in blocks])
    (OUT / 'index.json').write_text(json.dumps({'schemaVersion': 1, 'countries': idx}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
if __name__ == '__main__': main()
