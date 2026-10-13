#!/usr/bin/env python3
"""Secciones de la web para la app, en bloques que la app pinta con una sola plantilla (13-oct-2026, a petición de Mario:
«no pares hasta que tengamos más cosas de la web en la app»). -> data/app/v1/sec/<id>.json y data/app/v1/sec/index.json.
Cada bloque es el mismo formato que data/app/v1/env (stats, charts, bars, note, source) y lleva `cc` (mercado: US, CA, ES, UE, código de
país…) para que la app enseñe primero lo del país del usuario y nunca mezcle países. Solo lee ficheros del repositorio; no calcula nada
que la web no calcule (sumas, medias y porcentajes simples sobre el dato publicado). Uso: python3 scripts/build-app-sections.py"""
import datetime, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'data'
OUT = D / 'app' / 'v1' / 'sec'
L4 = ('es', 'en', 'fr', 'it')
def t4(s): p = s.split('|'); return dict(zip(L4, p + [p[0]] * (4 - len(p))))
def j(rel):
    try: return json.loads((D / rel).read_text())
    except Exception as e: print('aviso: falta', rel, e); return None
def rnd(v, d=2): return None if v is None else round(v, d)
def block(bid, cc, title, **kw):
    b = {'id': bid, 'cc': cc, 'title': t4(title) if isinstance(title, str) else title}
    for k, v in kw.items():
        if v not in (None, [], {}): b[k] = v
    return b
def stat(label, value, unit='', dec=1, sub=None):
    s = {'label': t4(label) if isinstance(label, str) else label, 'value': rnd(value, 4) if isinstance(value, float) else value, 'unit': t4(unit) if '|' in unit else unit, 'dec': dec}
    if sub: s['sub'] = sub
    return s
def chart(label, unit, series): return {'label': t4(label), 'unit': t4(unit) if '|' in unit else unit, 'series': [{'label': t4(l) if isinstance(l, str) else l, 'points': p} for l, p in series if len(p) > 1]}
def bars(title, unit, items, dec=1): return {'title': t4(title), 'unit': t4(unit) if '|' in unit else unit, 'dec': dec, 'items': [{'label': t4(l) if isinstance(l, str) else l, 'value': rnd(v, 4)} for l, v in items if v is not None]}
def pct(a, b): return None if a is None or not b else (a / b - 1) * 100

US_STATES = {'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'}
CA_PROV = {'NL': 'Terranova y Labrador|Newfoundland and Labrador|Terre-Neuve-et-Labrador|Terranova e Labrador', 'PE': 'Isla del Príncipe Eduardo|Prince Edward Island|Île-du-Prince-Édouard|Isola del Principe Edoardo', 'NS': 'Nueva Escocia|Nova Scotia|Nouvelle-Écosse|Nuova Scozia', 'NB': 'Nuevo Brunswick|New Brunswick|Nouveau-Brunswick|Nuovo Brunswick', 'QC': 'Quebec|Quebec|Québec|Québec', 'ON': 'Ontario|Ontario|Ontario|Ontario', 'MB': 'Manitoba', 'SK': 'Saskatchewan', 'AB': 'Alberta', 'BC': 'Columbia Británica|British Columbia|Colombie-Britannique|Columbia Britannica'}
CAUSE = {'Drought': 'Sequía|Drought|Sécheresse|Siccità', 'Excess Moisture/Precipitation/Rain': 'Exceso de humedad o lluvia|Excess moisture or rain|Excès d’humidité ou de pluie|Eccesso di umidità o pioggia', 'Heat': 'Calor|Heat|Chaleur|Caldo', 'Hail': 'Granizo|Hail|Grêle|Grandine', 'Freeze': 'Helada|Freeze|Gel|Gelo', 'Frost': 'Escarcha|Frost|Gelée|Brina', 'Wind/Excess Wind': 'Viento|Wind|Vent|Vento', 'Hot Wind': 'Viento cálido|Hot wind|Vent chaud|Vento caldo', 'Decline in Price': 'Caída del precio|Decline in price|Baisse du prix|Calo del prezzo', 'Cold Wet Weather': 'Tiempo frío y húmedo|Cold wet weather|Temps froid et humide|Tempo freddo e umido', 'Failure of Irrigation Supply': 'Fallo del riego|Failure of irrigation supply|Défaut d’irrigation|Mancanza d’irrigazione', 'Hurricane/Tropical Depression': 'Huracán o depresión tropical|Hurricane or tropical depression|Ouragan ou dépression tropicale|Uragano o depressione tropicale', 'Hurricane': 'Huracán|Hurricane|Ouragan|Uragano', 'Flood': 'Inundación|Flood|Inondation|Alluvione', 'Plant Disease': 'Enfermedad de la planta|Plant disease|Maladie des plantes|Malattia delle piante', 'Insects': 'Insectos|Insects|Insectes|Insetti', 'Fire': 'Incendio|Fire|Incendie|Incendio', 'Cold Winter': 'Invierno frío|Cold winter|Hiver froid|Inverno freddo'}
AREA = 'Pólizas de área (rendimiento o ingreso del condado)|Area plans (county yield or revenue)|Contrats de zone (rendement ou revenu du comté)|Polizze d’area (resa o ricavo della contea)'
def cause(k): return t4(AREA) if k.startswith('ARPI/') else t4(CAUSE.get(k, k))

def seguro():
    out = []
    ci = j('crop-insurance.json')
    if ci:
        y = str(ci['latestCompleteYear']); F = ci['fields']; nat = ci['national']; v = dict(zip(F, nat[y])); vp = dict(zip(F, nat[str(int(y) - 1)])) if str(int(y) - 1) in nat else {}
        M = 1e6
        stats = [stat('Capital asegurado ' + y + '|Liability ' + y + '|Capital assuré ' + y + '|Capitale assicurato ' + y, v['liability'] / M, 'M$', 0),
                 stat('Prima total|Total premium|Prime totale|Premio totale', v['totalPremium'] / M, 'M$', 0),
                 stat('Subvención de la prima|Premium subsidy|Subvention de la prime|Sussidio sul premio', v['subsidy'] / M, 'M$', 0),
                 stat('Indemnizaciones|Indemnities|Indemnités|Indennizzi', v['indemnity'] / M, 'M$', 0),
                 stat('Siniestralidad (indemnizaciones / prima)|Loss ratio (indemnities / premium)|Sinistralité (indemnités / prime)|Sinistralità (indennizzi / premio)', v['indemnity'] / v['totalPremium'], '', 2)]
        years = ci['cropYears']; pts = [[str(yy), round(nat[str(yy)][F.index('indemnity')] / M, 1)] for yy in years if int(yy) <= int(y)]
        prem = [[str(yy), round(nat[str(yy)][F.index('totalPremium')] / M, 1)] for yy in years if int(yy) <= int(y)]
        causes = sorted(((k, c.get(y)) for k, c in ci['causeIndemnity'].items() if c.get(y)), key=lambda x: -x[1])
        agg = {}
        for k, val in causes:
            lab = cause(k); key = lab['es']; agg.setdefault(key, [lab, 0]); agg[key][1] += val
        cb = sorted(agg.values(), key=lambda x: -x[1])[:8]
        st = sorted(((s, ci['states'][s][y][F.index('indemnity')]) for s in ci['states'] if y in ci['states'][s]), key=lambda x: -x[1])[:10]
        out.append(block('us', 'US', 'EE. UU.: seguro de cosechas (RMA)|US: crop insurance (RMA)|États-Unis : assurance récolte (RMA)|USA: assicurazione dei raccolti (RMA)', asOf=y, stats=stats,
            charts=[chart('Prima e indemnizaciones por campaña|Premium and indemnities by crop year|Prime et indemnités par campagne|Premio e indennizzi per campagna', 'M$', [('Indemnizaciones|Indemnities|Indemnités|Indennizzi', pts), ('Prima total|Total premium|Prime totale|Premio totale', prem)])],
            bars=[bars('Indemnizaciones por causa de pérdida ' + y + '|Indemnities by cause of loss ' + y + '|Indemnités par cause de perte ' + y + '|Indennizzi per causa di perdita ' + y, 'M$', [(l, val / M) for l, val in cb], 0),
                  bars('Estados con más indemnizaciones ' + y + '|States with the most indemnities ' + y + '|États avec le plus d’indemnités ' + y + '|Stati con più indennizzi ' + y, 'M$', [(US_STATES.get(s, s), val / M) for s, val in st], 0)],
            note=t4('Suma de Dehesa Index sobre los registros públicos de la RMA. Las campañas desde ' + str(ci['provisionalFrom']) + ' siguen abiertas.|Dehesa Index sum of the public RMA records. Crop years from ' + str(ci['provisionalFrom']) + ' are still open.|Somme de Dehesa Index sur les enregistrements publics de la RMA. Les campagnes depuis ' + str(ci['provisionalFrom']) + ' sont encore ouvertes.|Somma di Dehesa Index sui record pubblici della RMA. Le campagne dal ' + str(ci['provisionalFrom']) + ' sono ancora aperte.'),
            source={'name': 'USDA RMA, Summary of Business', 'url': ci['source']['url']}))
    ca = j('crop-insurance-ca.json')
    if ca:
        yrs = ca['years']; i = len(yrs) - 1; d = ca['data']['CA']
        while i > 0 and d['indemnities'][i] is None: i -= 1
        y = yrs[i]; K = 1e3
        out.append(block('ca', 'CA', 'Canadá: seguro de cosechas|Canada: crop insurance|Canada : assurance récolte|Canada: assicurazione dei raccolti', asOf=str(y),
            stats=[stat('Indemnizaciones del seguro de cosechas ' + str(y) + '|Crop insurance payments ' + str(y) + '|Indemnités d’assurance récolte ' + str(y) + '|Indennizzi assicurazione raccolti ' + str(y), (d['indemnities'][i] or 0) / K, 'M CAD', 0),
                   stat('Seguro privado de granizo|Private hail insurance|Assurance grêle privée|Assicurazione grandine privata', (d['hailIndemnities'][i] or 0) / K, 'M CAD', 0),
                   stat('Gasto de las explotaciones en seguros|Farm spending on crop and hail insurance|Dépenses des exploitations en assurance|Spesa delle aziende in assicurazioni', (d['farmPremiums'][i] or 0) / K if d['farmPremiums'][i] else None, 'M CAD', 0)],
            charts=[chart('Indemnizaciones por año|Payments by year|Indemnités par année|Indennizzi per anno', 'M CAD', [('Seguro de cosechas|Crop insurance|Assurance récolte|Assicurazione raccolti', [[str(yy), round(v / K, 1)] for yy, v in zip(yrs, d['indemnities']) if v is not None])])],
            bars=[bars('Por provincia, ' + str(y) + '|By province, ' + str(y) + '|Par province, ' + str(y) + '|Per provincia, ' + str(y), 'M CAD', sorted([(CA_PROV.get(p, p), (ca['data'][p]['indemnities'][i] or 0) / K) for p in ca['data'] if p != 'CA'], key=lambda x: -x[1]), 0)],
            source={'name': 'Statistics Canada', 'url': ca['source']['url']}))
    return {'id': 'seguro', 'title': t4('Seguro agrario|Crop insurance|Assurance agricole|Assicurazione agricola'), 'emoji': '🛡️', 'blocks': out}

CROPS_US = {'barley': 'Cebada|Barley|Orge|Orzo', 'corn': 'Maíz|Corn|Maïs|Mais', 'cotton': 'Algodón|Cotton|Coton|Cotone', 'oats': 'Avena|Oats|Avoine|Avena', 'peanuts': 'Cacahuete|Peanuts|Arachide|Arachidi', 'rice': 'Arroz|Rice|Riz|Riso', 'sorghum': 'Sorgo|Sorghum|Sorgho|Sorgo', 'soybeans': 'Soja|Soybeans|Soja|Soia', 'wheat_spring': 'Trigo de primavera|Spring wheat|Blé de printemps|Frumento primaverile', 'wheat_winter': 'Trigo de invierno|Winter wheat|Blé d’hiver|Frumento invernale'}
def cultivos():
    cp = j('crop-progress.json'); out = []
    if not cp: return None
    rows = []
    for c in cp['crops']:
        ss = sorted(c['seasons']); cur = c['seasons'][ss[-1]].get('condition') or []
        if not cur: continue
        last = cur[-1]; ge = last[4] + last[5]
        prev = c['seasons'].get(ss[-2], {}).get('condition') if len(ss) > 1 else None
        rows.append((c, ss, cur, prev, ge))
    if not rows: return None
    for c, ss, cur, prev, ge in rows:
        name = t4(CROPS_US.get(c['id'], c['id']))
        def series(cond, yr): return [[r[0], r[4] + r[5]] for r in cond]
        prevshift = [[str(int(r[0][:4]) + 1) + r[0][4:], r[4] + r[5]] for r in (prev or [])]
        st = sorted(((US_STATES.get(s, s), (v[-1]['g'] + v[-1]['e'])) for s, v in c['states'].items() if v), key=lambda x: -x[1])
        out.append(block(c['id'], 'US', {l: name[l] for l in L4}, asOf=cur[-1][0],
            stats=[stat('Bueno o excelente|Good or excellent|Bon ou excellent|Buono o eccellente', ge, '%', 0), stat('Malo o muy malo|Poor or very poor|Mauvais ou très mauvais|Scarso o molto scarso', cur[-1][1] + cur[-1][2], '%', 0)],
            charts=[chart('% bueno o excelente, semana a semana|% good or excellent, week by week|% bon ou excellent, semaine par semaine|% buono o eccellente, settimana per settimana', '%', [(ss[-1], series(cur, ss[-1])), (ss[-2] + ' (' + t4('misma semana|same week|même semaine|stessa settimana')['es'] + ')', prevshift)] if prev else [(ss[-1], series(cur, ss[-1]))])],
            bars=[bars('Por estado: % bueno o excelente|By state: % good or excellent|Par État : % bon ou excellent|Per stato: % buono o eccellente', '%', st, 0)] if st else None,
            source={'name': 'USDA NASS, Crop Progress', 'url': cp['source']['url']}))
    return {'id': 'cultivos', 'title': t4('Estado de los cultivos (EE. UU.)|Crop condition (US)|État des cultures (États-Unis)|Stato delle colture (USA)'), 'emoji': '🌾', 'blocks': out}

PSD = {'trigo': 'Trigo|Wheat|Blé|Frumento', 'maiz': 'Maíz|Corn|Maïs|Mais', 'soja': 'Soja|Soybeans|Soja|Soia', 'arroz': 'Arroz|Rice|Riz|Riso', 'cebada': 'Cebada|Barley|Orge|Orzo', 'azucar': 'Azúcar|Sugar|Sucre|Zucchero', 'algodon': 'Algodón|Cotton|Coton|Cotone', 'colza': 'Colza|Rapeseed|Colza|Colza', 'girasol': 'Girasol|Sunflower|Tournesol|Girasole', 'harina_soja': 'Harina de soja|Soybean meal|Tourteau de soja|Farina di soia', 'aceite_soja': 'Aceite de soja|Soybean oil|Huile de soja|Olio di soia', 'aceite_palma': 'Aceite de palma|Palm oil|Huile de palme|Olio di palma', 'avena': 'Avena|Oats|Avoine|Avena', 'sorgo': 'Sorgo|Sorghum|Sorgho|Sorgo', 'cafe': 'Café|Coffee|Café|Caffè', 'oliva': 'Aceite de oliva|Olive oil|Huile d’olive|Olio d’oliva', 'cerdo': 'Carne de cerdo|Pork|Viande porcine|Carne suina', 'vacuno': 'Carne de vacuno|Beef and veal|Viande bovine|Carne bovina', 'pollo': 'Carne de pollo|Chicken meat|Viande de poulet|Carne di pollo', 'leche': 'Leche|Milk|Lait|Latte'}
CNAME = {'CN': 'China|China|Chine|Cina', 'EU': 'Unión Europea|European Union|Union européenne|Unione europea', 'IN': 'India|India|Inde|India', 'RU': 'Rusia|Russia|Russie|Russia', 'US': 'EE. UU.|United States|États-Unis|Stati Uniti', 'CA': 'Canadá|Canada|Canada|Canada', 'AU': 'Australia|Australia|Australie|Australia', 'PK': 'Pakistán|Pakistan|Pakistan|Pakistan', 'UA': 'Ucrania|Ukraine|Ukraine|Ucraina', 'TR': 'Turquía|Turkey|Turquie|Turchia', 'AR': 'Argentina|Argentina|Argentine|Argentina', 'IR': 'Irán|Iran|Iran|Iran', 'BR': 'Brasil|Brazil|Brésil|Brasile', 'ID': 'Indonesia|Indonesia|Indonésie|Indonesia', 'MY': 'Malasia|Malaysia|Malaisie|Malesia', 'TH': 'Tailandia|Thailand|Thaïlande|Thailandia', 'VN': 'Vietnam|Vietnam|Viêt Nam|Vietnam', 'MX': 'México|Mexico|Mexique|Messico', 'EG': 'Egipto|Egypt|Égypte|Egitto', 'KZ': 'Kazajistán|Kazakhstan|Kazakhstan|Kazakistan', 'BD': 'Bangladés|Bangladesh|Bangladesh|Bangladesh', 'JP': 'Japón|Japan|Japon|Giappone', 'PH': 'Filipinas|Philippines|Philippines|Filippine', 'NG': 'Nigeria|Nigeria|Nigeria|Nigeria', 'GB': 'Reino Unido|United Kingdom|Royaume-Uni|Regno Unito', 'ZA': 'Sudáfrica|South Africa|Afrique du Sud|Sudafrica', 'PY': 'Paraguay', 'MA': 'Marruecos|Morocco|Maroc|Marocco', 'DZ': 'Argelia|Algeria|Algérie|Algeria', 'ET': 'Etiopía|Ethiopia|Éthiopie|Etiopia', 'KR': 'Corea del Sur|South Korea|Corée du Sud|Corea del Sud', 'SA': 'Arabia Saudí|Saudi Arabia|Arabie saoudite|Arabia Saudita', 'CO': 'Colombia', 'PE': 'Perú|Peru|Pérou|Perù', 'MM': 'Myanmar', 'UZ': 'Uzbekistán|Uzbekistan|Ouzbékistan|Uzbekistan', 'NZ': 'Nueva Zelanda|New Zealand|Nouvelle-Zélande|Nuova Zelanda'}
def oferta():
    sd = j('supply-demand.json')
    if not sd: return None
    out = []; K = 1000.0
    for c in sd['commodities']:
        ys = sorted(c['world'], key=int); y = ys[-1]; yp = ys[-2] if len(ys) > 1 else None; w = c['world'][y]; wp = c['world'].get(yp, {}) if yp else {}
        unit = 'Mt' if c['unit'].startswith('1000 MT') else c['unit']
        div = K if c['unit'].startswith('1000 MT') else 1
        su = (w.get('endingStocks') or 0) / w['consumption'] * 100 if w.get('consumption') else None
        sup = (wp.get('endingStocks') or 0) / wp['consumption'] * 100 if wp.get('consumption') else None
        def sv(k): return w.get(k) / div if w.get(k) is not None else None
        def sb(k): return {'d': '%+.1f %%' % pct(w.get(k), wp.get(k))} if w.get(k) and wp.get(k) else None
        prods = sorted(((CNAME.get(v.get('iso'), n), v['years'].get(y, {}).get('production')) for n, v in c['countries'].items()), key=lambda x: -(x[1] or 0))[:10]
        out.append(block(c['id'], 'WORLD', t4(PSD.get(c['id'], c['psdName'])), asOf=str(y) + '/' + str(int(y) + 1)[-2:],
            stats=[stat('Producción mundial|World production|Production mondiale|Produzione mondiale', sv('production'), unit, 1),
                   stat('Consumo|Consumption|Consommation|Consumo', sv('consumption'), unit, 1),
                   stat('Existencias finales|Ending stocks|Stocks de fin de campagne|Scorte finali', sv('endingStocks'), unit, 1),
                   stat('Existencias / consumo|Stocks-to-use|Stocks / consommation|Scorte / consumo', su, '%', 1, {'d': '%.1f %% %s' % (sup, yp)} if sup is not None else None)],
            charts=[chart('Producción, consumo y existencias por campaña|Production, consumption and stocks by marketing year|Production, consommation et stocks par campagne|Produzione, consumo e scorte per campagna', unit,
                          [('Producción|Production|Production|Produzione', [[yy, round(c['world'][yy]['production'] / div, 1)] for yy in ys if c['world'][yy].get('production')]),
                           ('Consumo|Consumption|Consommation|Consumo', [[yy, round(c['world'][yy]['consumption'] / div, 1)] for yy in ys if c['world'][yy].get('consumption')]),
                           ('Existencias finales|Ending stocks|Stocks finaux|Scorte finali', [[yy, round(c['world'][yy]['endingStocks'] / div, 1)] for yy in ys if c['world'][yy].get('endingStocks') is not None])])],
            bars=[bars('Mayores productores ' + str(y) + '/' + str(int(y) + 1)[-2:] + '|Largest producers|Principaux producteurs|Maggiori produttori', unit, [(l if isinstance(l, str) and '|' in l else (t4(l) if isinstance(l, str) else l), (v or 0) / div) for l, v in prods if v], 1)],
            note=t4('Campaña de comercialización según USDA (publicado en ' + c.get('publishedMonth', '') + ').|Marketing year as defined by USDA (published ' + c.get('publishedMonth', '') + ').|Campagne de commercialisation selon l’USDA (publié en ' + c.get('publishedMonth', '') + ').|Campagna di commercializzazione secondo l’USDA (pubblicato a ' + c.get('publishedMonth', '') + ').'),
            source={'name': 'USDA FAS, PSD Online', 'url': sd['source']['url']}))
    return {'id': 'oferta', 'title': t4('Oferta y demanda mundial|World supply and demand|Offre et demande mondiales|Domanda e offerta mondiale'), 'emoji': '🌍', 'blocks': out}

def clima():
    cl = j('climate.json')
    if not cl: return None
    by = {}
    for l in cl['locations']:
        if l.get('months'): by.setdefault(l['country'], []).append(l)
    out = []
    for cc, ls in sorted(by.items()):
        per = max(l['months'][-1]['period'] for l in ls)
        items_p = sorted(((l['name'], l['months'][-1].get('precipAnomalyPct')) for l in ls if l['months'][-1]['period'] == per), key=lambda x: (x[1] or 0))
        items_t = sorted(((l['name'], l['months'][-1].get('tempAnomalyC')) for l in ls if l['months'][-1]['period'] == per), key=lambda x: -(x[1] or 0))
        first = ls[0]
        out.append(block('clima-' + cc, cc, 'Clima de las zonas productoras|Weather in producing areas|Météo des zones de production|Clima delle zone produttive', asOf=per,
            charts=[chart(first['name'] + ': lluvia del mes|' + first['name'] + ': monthly rainfall|' + first['name'] + ' : pluie du mois|' + first['name'] + ': pioggia del mese', 'mm', [('Lluvia|Rainfall|Pluie|Pioggia', [[m['period'], m['precipMm']] for m in first['months']]), ('Normal 2001-2020|Normal 2001-2020|Normale 2001-2020|Normale 2001-2020', [[m['period'], m['precipBaselineMm']] for m in first['months']])])],
            bars=[bars('Lluvia frente a lo normal (%) · ' + per + '|Rainfall vs normal (%) · ' + per + '|Pluie par rapport à la normale (%) · ' + per + '|Pioggia rispetto al normale (%) · ' + per, '%', [({l: n for l in L4}, v) for n, v in items_p], 0),
                  bars('Temperatura frente a lo normal (°C) · ' + per + '|Temperature vs normal (°C) · ' + per + '|Température par rapport à la normale (°C) · ' + per + '|Temperatura rispetto al normale (°C) · ' + per, '°C', [({l: n for l in L4}, v) for n, v in items_t], 1)],
            note=t4('Normal = media 2001-2020 del mismo mes en el mismo punto.|Normal = 2001-2020 average for the same month at the same point.|Normale = moyenne 2001-2020 du même mois au même point.|Normale = media 2001-2020 dello stesso mese nello stesso punto.'),
            source={'name': 'NASA POWER', 'url': cl['source']['url']}))
    return {'id': 'clima', 'title': t4('Clima agrícola|Farm weather|Météo agricole|Clima agricolo'), 'emoji': '🌦️', 'blocks': out}

def insumos():
    out = []
    g = j('es-gasoleo-b.json')
    prov = (j('spain-crops/crops-hortalizas.json') or {}).get('provinces', {})
    if g:
        lt = g['latest']; F = g['provFields']; h = g['history']; HF = h['fields']
        rows = sorted(((prov.get(k, k), v[F.index('medianB')]) for k, v in lt['provinces'].items() if v[F.index('medianB')]), key=lambda x: x[1])
        out.append(block('gasoleo-b', 'ES', 'España: gasóleo agrícola (B) en gasolinera|Spain: farm diesel (B) at the pump|Espagne : gazole agricole (B) à la pompe|Spagna: gasolio agricolo (B) al distributore', asOf=lt['date'],
            stats=[stat('Gasóleo B, mediana nacional|Diesel B, national median|Gazole B, médiane nationale|Gasolio B, mediana nazionale', lt['b'], '€/l', 3), stat('Gasóleo A (automoción), mediana|Diesel A (road), median|Gazole A (routier), médiane|Gasolio A (autotrazione), mediana', lt['a'], '€/l', 3), stat('Gasolineras con gasóleo B|Stations selling diesel B|Stations avec gazole B|Distributori con gasolio B', lt['nb'], '', 0)],
            charts=[chart('Mediana nacional diaria|Daily national median|Médiane nationale quotidienne|Mediana nazionale giornaliera', '€/l', [('Gasóleo B|Diesel B|Gazole B|Gasolio B', [[r[0], r[HF.index('medianB')]] for r in h['rows'] if r[HF.index('medianB')]]), ('Gasóleo A|Diesel A|Gazole A|Gasolio A', [[r[0], r[HF.index('medianA')]] for r in h['rows'] if r[HF.index('medianA')]])])],
            bars=[bars('Provincias más baratas|Cheapest provinces|Provinces les moins chères|Province più economiche', '€/l', [({l: n for l in L4}, v) for n, v in rows[:10]], 3), bars('Provincias más caras|Most expensive provinces|Provinces les plus chères|Province più care', '€/l', [({l: n for l in L4}, v) for n, v in rows[::-1][:10]], 3)],
            source={'name': 'MITECO, Geoportal de gasolineras', 'url': g['source']['url']}))
    f = j('us-fertilizers.json')
    FN = {'amoniaco': 'Amoníaco anhidro|Anhydrous ammonia|Ammoniac anhydre|Ammoniaca anidra', 'urea': 'Urea|Urea|Urée|Urea', 'dap': 'DAP (fosfato diamónico)|DAP|DAP|DAP', 'map': 'MAP (fosfato monoamónico)|MAP|MAP|MAP', 'potasa': 'Potasa|Potash|Potasse|Potassa', 'uan28': 'UAN 28 %|UAN 28%|UAN 28 %|UAN 28%', 'uan32': 'UAN 32 %|UAN 32%|UAN 32 %|UAN 32%'}
    if f:
        items, chs = [], []
        for p in f['products']:
            ss = [s for s in p['states'] if s.get('avg')]
            if not ss: continue
            avg = sum(s['avg'] for s in ss) / len(ss)
            items.append((t4(FN.get(p['id'], p['id'])), avg))
            s0 = max(ss, key=lambda s: len(s.get('hist') or []))
            if s0.get('hist'): chs.append((t4(FN.get(p['id'], p['id']))['es'] + ' · ' + s0['state'], s0['hist']))
        out.append(block('fertilizantes', 'US', 'EE. UU.: fertilizantes en el mercado minorista|US: retail fertiliser prices|États-Unis : prix de détail des engrais|USA: prezzi al dettaglio dei fertilizzanti', asOf=f['asOf'],
            bars=[bars('Precio medio de los estados que informan|Average of reporting states|Moyenne des États déclarants|Media degli stati che riportano', 'USD/short ton', items, 0)],
            charts=[{'label': t4('Evolución en el estado con más historia|History in the state with the longest record|Évolution dans l’État avec le plus d’historique|Andamento nello stato con più storico'), 'unit': 'USD/short ton', 'series': [{'label': t4(l), 'points': p} for l, p in chs[:6] if len(p) > 1]}],
            source={'name': 'USDA AMS Market News', 'url': f['source']['url']}))
    return {'id': 'insumos', 'title': t4('Gasóleo y fertilizantes|Diesel and fertiliser|Gazole et engrais|Gasolio e fertilizzanti'), 'emoji': '⛽', 'blocks': out}

EUK = {'output': 'Producción agraria|Agricultural output|Production agricole|Produzione agricola', 'ic': 'Consumos intermedios|Intermediate consumption|Consommations intermédiaires|Consumi intermedi', 'energy': 'Energía|Energy|Énergie|Energia', 'fert': 'Fertilizantes|Fertilisers|Engrais|Fertilizzanti', 'feed': 'Piensos|Feed|Aliments du bétail|Mangimi', 'ppp': 'Fitosanitarios|Plant protection|Phytosanitaires|Fitosanitari', 'vet': 'Veterinario|Veterinary|Vétérinaire|Veterinario', 'entrep': 'Renta empresarial|Entrepreneurial income|Revenu d’entreprise|Reddito imprenditoriale', 'gva': 'Valor añadido bruto|Gross value added|Valeur ajoutée brute|Valore aggiunto lordo', 'nva': 'Valor añadido neto|Net value added|Valeur ajoutée nette|Valore aggiunto netto', 'factor': 'Renta de los factores|Factor income|Revenu des facteurs|Reddito dei fattori'}
def cuentas():
    e = j('eu-farm-economics.json')
    if not e: return None
    out = []; ys = e['years']
    for cc, g in sorted(e['geos'].items()):
        if cc in ('EU27_2020',): code = 'EU'
        else: code = cc
        def last(k):
            arr = g.get(k) or []
            for i in range(len(arr) - 1, -1, -1):
                if arr[i] is not None: return ys[i], arr[i], (arr[i - 1] if i > 0 else None)
            return None, None, None
        y, out_v, out_p = last('output')
        if out_v is None: continue
        yi = ys.index(y)
        def at(k): arr = g.get(k) or []; return arr[yi] if yi < len(arr) else None
        def atp(k): arr = g.get(k) or []; return arr[yi - 1] if 0 < yi < len(arr) else None
        stats = []
        for k in ('output', 'ic', 'gva', 'entrep'):
            v = at(k)
            if v is not None: stats.append(stat(EUK[k] + ' ' + str(y) if k == 'output' else EUK[k], v, 'M€', 0, {'d': '%+.1f %%' % pct(v, atp(k))} if atp(k) else None))
        inp = [(EUK[k], at(k)) for k in ('feed', 'energy', 'fert', 'ppp', 'vet') if at(k) is not None]
        ch = [(EUK[k], [[str(yy), round(v, 1)] for yy, v in zip(ys, g.get(k) or []) if v is not None]) for k in ('output', 'ic', 'entrep')]
        out.append(block('eaa-' + code, code, 'Cuentas del sector agrario|Agricultural accounts|Comptes de l’agriculture|Conti del settore agricolo', asOf=str(y), stats=stats,
            charts=[chart('Producción, costes y renta|Output, costs and income|Production, coûts et revenu|Produzione, costi e reddito', 'M€', ch)],
            bars=[bars('En qué se gasta (consumos intermedios) ' + str(y) + '|What farms spend on ' + str(y) + '|Postes de dépenses ' + str(y) + '|Voci di spesa ' + str(y), 'M€', [(l, v) for l, v in sorted(inp, key=lambda x: -x[1])], 0)],
            note=t4('Millones de euros a precios corrientes. Los últimos años pueden ser estimaciones del país.|Million euro at current prices. Latest years may be country estimates.|Millions d’euros à prix courants. Les dernières années peuvent être des estimations du pays.|Milioni di euro a prezzi correnti. Gli ultimi anni possono essere stime del paese.'),
            source={'name': 'Eurostat, cuentas económicas de la agricultura', 'url': e['source']['url']}))
    return {'id': 'cuentas', 'title': t4('Cuentas del campo por país|Farm accounts by country|Comptes agricoles par pays|Conti agricoli per paese'), 'emoji': '📊', 'blocks': out}

def granos_ca():
    cg = j('canada-grain.json')
    if not cg: return None
    W = cg['weeks']; out = []
    GN = {'wheat': 'Trigo (sin duro)|Wheat (excl. durum)|Blé (sauf dur)|Frumento (escluso duro)', 'durum': 'Trigo duro|Durum|Blé dur|Frumento duro', 'barley': 'Cebada|Barley|Orge|Orzo', 'canola': 'Canola (colza)|Canola|Canola|Canola', 'oats': 'Avena|Oats|Avoine|Avena', 'peas': 'Guisantes|Peas|Pois|Piselli', 'lentils': 'Lentejas|Lentils|Lentilles|Lenticchie', 'flaxseed': 'Lino|Flaxseed|Lin|Lino', 'soybeans': 'Soja|Soybeans|Soja|Soia', 'corn': 'Maíz|Corn|Maïs|Mais', 'rye': 'Centeno|Rye|Seigle|Segale', 'chickpeas': 'Garbanzos|Chickpeas|Pois chiches|Ceci'}
    items = []
    for g in cg['grains']:
        ce = g.get('cumExports') or []
        if ce and ce[-1] is not None: items.append((t4(GN.get(g['id'], g['name'])), ce[-1]))
    main = [g for g in cg['grains'] if g['id'] in ('wheat', 'canola', 'barley', 'durum')]
    out.append(block('cgc', 'CA', 'Canadá: exportaciones y existencias de grano|Canada: grain exports and stocks|Canada : exportations et stocks de grains|Canada: esportazioni e scorte di grano', asOf=cg['asOf'],
        bars=[bars('Exportaciones acumuladas de la campaña|Crop-year exports to date|Exportations cumulées de la campagne|Esportazioni cumulate della campagna', 'kt', sorted(items, key=lambda x: -x[1]), 0)],
        charts=[chart('Exportaciones semanales|Weekly exports|Exportations hebdomadaires|Esportazioni settimanali', 'kt', [(GN.get(g['id'], g['name']), [[w, v] for w, v in zip(W, g.get('exports') or []) if v is not None]) for g in main]),
                chart('Existencias comerciales|Commercial stocks|Stocks commerciaux|Scorte commerciali', 'kt', [(GN.get(g['id'], g['name']), [[w, v] for w, v in zip(W, g.get('stocks') or []) if v is not None]) for g in main])],
        note=t4('Envíos por terminales portuarias autorizadas (no incluye el tren directo a EE. UU.).|Shipments through licensed port terminals (excludes direct rail to the US).|Expéditions par terminaux portuaires agréés (hors rail direct vers les États-Unis).|Spedizioni tramite terminal portuali autorizzati (esclusa la ferrovia diretta verso gli USA).'),
        source={'name': 'Canadian Grain Commission', 'url': cg['source']['url']}))
    return {'id': 'granos-ca', 'title': t4('Grano de Canadá|Canadian grain|Grains du Canada|Grano del Canada'), 'emoji': '🚢', 'blocks': out}

def ganaderia_us():
    out = []
    cof = j('cattle-on-feed.json')
    if cof and cof['reports']:
        r = cof['reports'][-1]; n = r['national']; c = n['current']; ya = n['yearAgo']
        out.append(block('cof', 'US', 'EE. UU.: ganado en cebadero|US: cattle on feed|États-Unis : bovins à l’engraissement|USA: bovini all’ingrasso', asOf=r['inventoryDate'],
            stats=[stat('En cebadero a final de mes|On feed at month end|En engraissement en fin de mois|All’ingrasso a fine mese', c['onFeedEnd'], 'miles de cabezas|thousand head|milliers de têtes|migliaia di capi', 0, {'d': '%d %% vs año anterior' % n['pctYearAgo']['onFeedEnd']}),
                   stat('Entradas del mes|Placed in the month|Entrées du mois|Ingressi del mese', c['placed'], 'miles de cabezas|thousand head|milliers de têtes|migliaia di capi', 0),
                   stat('Salidas a matadero|Marketed|Sorties vers l’abattoir|Uscite al macello', c['marketed'], 'miles de cabezas|thousand head|milliers de têtes|migliaia di capi', 0)],
            charts=[chart('En cebadero (1 de cada mes)|On feed (1st of each month)|En engraissement (1er de chaque mois)|All’ingrasso (1° di ogni mese)', 'miles de cabezas|thousand head|milliers de têtes|migliaia di capi', [('Total|Total|Total|Totale', [[x['inventoryDate'], x['national']['current']['onFeedStart']] for x in cof['reports']])])],
            source={'name': 'USDA NASS, Cattle on Feed', 'url': cof['source']['url']}))
    ud = j('us-dairy.json')
    if ud:
        DN = {'mantequilla': 'Mantequilla|Butter|Beurre|Burro', 'cheddar': 'Queso cheddar|Cheddar cheese|Cheddar|Cheddar', 'suero': 'Suero en polvo|Dry whey|Lactosérum en poudre|Siero in polvere', 'leche_polvo': 'Leche desnatada en polvo|Nonfat dry milk|Lait écrémé en poudre|Latte scremato in polvere'}
        out.append(block('ndpsr', 'US', 'EE. UU.: precios de los lácteos (NDPSR)|US: dairy product prices (NDPSR)|États-Unis : prix des produits laitiers (NDPSR)|USA: prezzi dei prodotti lattiero-caseari (NDPSR)', asOf=ud['products'][0]['series'][-1][0],
            stats=[stat(DN.get(p['id'], p['id']), p['series'][-1][1], 'USD/lb', 4) for p in ud['products']],
            charts=[chart('Precio semanal|Weekly price|Prix hebdomadaire|Prezzo settimanale', 'USD/lb', [(DN.get(p['id'], p['id']), [[s[0], s[1]] for s in p['series'] if s[1] is not None]) for p in ud['products']])],
            source={'name': 'USDA AMS, NDPSR', 'url': ud['source']['url']}))
    return {'id': 'ganaderia-us', 'title': t4('Ganadería y lácteos (EE. UU.)|Livestock and dairy (US)|Élevage et lait (États-Unis)|Allevamento e latte (USA)'), 'emoji': '🐄', 'blocks': out}

ESN = {'All Wheat': 'Trigo|Wheat|Blé|Frumento', 'Corn': 'Maíz|Corn|Maïs|Mais', 'Soybeans': 'Soja|Soybeans|Soja|Soia', 'Soybean Cake & Meal': 'Harina de soja|Soybean meal|Tourteau de soja|Farina di soia', 'Soybean Oil': 'Aceite de soja|Soybean oil|Huile de soja|Olio di soia', 'Sorghum': 'Sorgo|Sorghum|Sorgho|Sorgo', 'Barley': 'Cebada|Barley|Orge|Orzo', 'All Upland Cotton': 'Algodón|Cotton|Coton|Cotone', 'Beef': 'Vacuno|Beef|Bœuf|Bovino', 'Pork': 'Porcino|Pork|Porc|Suino', 'Rice': 'Arroz|Rice|Riz|Riso', 'All Rice': 'Arroz|Rice|Riz|Riso', 'Wheat - HRW': 'Trigo duro rojo de invierno (HRW)|Hard red winter wheat|Blé roux d’hiver (HRW)|Frumento rosso invernale (HRW)', 'Wheat - SRW': 'Trigo blando rojo de invierno (SRW)|Soft red winter wheat|Blé tendre rouge d’hiver (SRW)|Frumento tenero rosso invernale (SRW)', 'Wheat - HRS': 'Trigo duro rojo de primavera (HRS)|Hard red spring wheat|Blé roux de printemps (HRS)|Frumento rosso primaverile (HRS)', 'Wheat - White': 'Trigo blanco|White wheat|Blé blanc|Frumento bianco', 'Wheat - Durum': 'Trigo duro (durum)|Durum wheat|Blé dur|Frumento duro', 'Soybean cake & meal': 'Harina de soja|Soybean meal|Tourteau de soja|Farina di soia', 'Fresh, Chilled, or Frozen Muscle Cuts of Beef': 'Carne de vacuno|Beef|Viande bovine|Carne bovina', 'Fresh, Chilled, or Frozen Muscle Cuts of Pork': 'Carne de cerdo|Pork|Viande porcine|Carne suina'}
def exportaciones_us():
    es = j('export-sales.json')
    if not es: return None
    out = []
    for c in es['commodities']:
        tt = c['totals']; pv = c.get('prevSameWeek') or {}
        name = t4(ESN.get(c['name'], c['name']))
        tops = sorted(((x['n'].title(), (x.get('acc') or 0) + (x.get('out') or 0)) for x in c.get('countries', []) if x.get('n') and 'UNKNOWN' not in x['n']), key=lambda x: -x[1])[:10]
        commit = (tt.get('acc') or 0) + (tt.get('out') or 0); commit_p = (pv.get('acc') or 0) + (pv.get('out') or 0)
        out.append(block('esr-' + str(c['code']), 'US', name, asOf=c['weekEnding'],
            stats=[stat('Ventas comprometidas en la campaña ' + c['my'] + '|Committed sales, marketing year ' + c['my'] + '|Ventes engagées, campagne ' + c['my'] + '|Vendite impegnate, campagna ' + c['my'], commit / 1000, 'kt', 0, {'d': '%+.0f %% vs año anterior' % pct(commit, commit_p)} if commit_p else None),
                   stat('Ya embarcado|Already shipped|Déjà expédié|Già spedito', (tt.get('acc') or 0) / 1000, 'kt', 0),
                   stat('Ventas netas de la semana|Net sales this week|Ventes nettes de la semaine|Vendite nette della settimana', (tt.get('net') or 0) / 1000, 'kt', 1)],
            charts=[chart('Embarques acumulados|Cumulative exports|Exportations cumulées|Esportazioni cumulate', 'kt', [(c['my'], [[w['w'], round((w.get('acc') or 0) / 1000, 1)] for w in c.get('weekly', [])])])],
            bars=[bars('Principales destinos (comprometido)|Top destinations (committed)|Principales destinations (engagé)|Principali destinazioni (impegnato)', 'kt', [({l: n for l in L4}, v / 1000) for n, v in tops], 0)] if tops else None,
            source={'name': 'USDA FAS, Export Sales', 'url': 'https://apps.fas.usda.gov/export-sales/esrd1.html'}))
    return {'id': 'exportaciones-us', 'title': t4('Exportaciones de EE. UU. (semanales)|US export sales (weekly)|Ventes à l’export des États-Unis|Vendite all’export degli USA'), 'emoji': '📦', 'blocks': out}

import re
def _rel(d):
    n = (d.get('release') or {}).get('name') or ''
    m = re.search(r'(\d{4})-(\d{2})', n)
    if m: return m.group(1) + '-' + m.group(2)
    m = re.search(r'(\d{4})HTSRev(\d+)', n)
    return ('HTS ' + m.group(1) + ' rev. ' + m.group(2)) if m else (d.get('generatedAt') or '')[:10]
def aranceles():
    out = []
    CH = {'01': 'Animales vivos|Live animals|Animaux vivants|Animali vivi', '02': 'Carne|Meat|Viande|Carne', '04': 'Lácteos, huevos y miel|Dairy, eggs and honey|Lait, œufs et miel|Latte, uova e miele', '07': 'Hortalizas|Vegetables|Légumes|Ortaggi', '08': 'Frutas y frutos secos|Fruit and nuts|Fruits|Frutta', '10': 'Cereales|Cereals|Céréales|Cereali', '11': 'Harinas y malta|Flours and malt|Farines et malt|Farine e malto', '12': 'Semillas oleaginosas|Oilseeds|Graines oléagineuses|Semi oleosi', '15': 'Grasas y aceites|Fats and oils|Graisses et huiles|Grassi e oli', '17': 'Azúcar|Sugar|Sucre|Zucchero', '22': 'Bebidas y vino|Beverages and wine|Boissons et vin|Bevande e vino', '23': 'Piensos y residuos|Feed and residues|Aliments et résidus|Mangimi e residui'}
    for f, cc, nm in [('tariffs-eu.json', 'EU', 'Unión Europea|European Union|Union européenne|Unione europea'), ('us-tariffs.json', 'US', 'EE. UU.|United States|États-Unis|Stati Uniti'), ('tariffs-ca.json', 'CA', 'Canadá|Canada|Canada|Canada')]:
        d = j(f)
        if not d or not d.get('chapters'): continue
        ch = d['chapters']
        items = [(CH[k], ch[k].get('avgadv')) for k in CH if k in ch and ch[k].get('avgadv') is not None]
        free = [(CH[k], ch[k]['free'] / ch[k]['n'] * 100) for k in CH if k in ch and ch[k].get('n')]
        out.append(block('tar-' + cc, 'EU' if cc == 'EU' else cc, 'Aranceles de importación: ' + nm.split('|')[0] + '|Import tariffs: ' + nm.split('|')[1] + '|Droits de douane : ' + nm.split('|')[2] + '|Dazi all’importazione: ' + nm.split('|')[3], asOf=_rel(d),
            bars=[bars('Arancel medio ad valorem por capítulo (%)|Average ad valorem duty by chapter (%)|Droit ad valorem moyen par chapitre (%)|Dazio ad valorem medio per capitolo (%)', '%', sorted(items, key=lambda x: -x[1]), 1),
                  bars('Partidas libres de arancel (%)|Duty-free lines (%)|Lignes en franchise (%)|Linee esenti da dazio (%)', '%', sorted(free, key=lambda x: -x[1]), 0)],
            note=t4('Arancel de nación más favorecida (terceros países). Muchos productos pagan además derechos específicos (€ por tonelada) que no entran en la media ad valorem.|Most-favoured-nation duty. Many products also pay specific duties (per tonne) not included in the ad valorem average.|Droit de la nation la plus favorisée. Beaucoup de produits paient aussi des droits spécifiques (par tonne) non inclus dans la moyenne.|Dazio della nazione più favorita. Molti prodotti pagano anche dazi specifici (per tonnellata) non inclusi nella media.'),
            source={'name': d['source']['name'], 'url': d['source']['url']}))
    return {'id': 'aranceles', 'title': t4('Aranceles agrarios|Farm tariffs|Droits de douane agricoles|Dazi agricoli'), 'emoji': '🛃', 'blocks': out}


CCAA = {'andalucia': 'Andalucía', 'aragon': 'Aragón', 'asturias': 'Asturias', 'baleares': 'Illes Balears', 'canarias': 'Canarias', 'cantabria': 'Cantabria', 'castilla_la_mancha': 'Castilla-La Mancha', 'castilla_leon': 'Castilla y León', 'castilla_y_leon': 'Castilla y León', 'cataluna': 'Cataluña', 'extremadura': 'Extremadura', 'galicia': 'Galicia', 'madrid': 'Madrid', 'murcia': 'Región de Murcia', 'navarra': 'Navarra', 'pais_vasco': 'País Vasco', 'rioja': 'La Rioja', 'la_rioja': 'La Rioja', 'valencia': 'Comunitat Valenciana', 'comunidad_valenciana': 'Comunitat Valenciana', 'clm': 'Castilla-La Mancha', 'cyl': 'Castilla y León', 'larioja': 'La Rioja', 'paisvasco': 'País Vasco', 'valenciana': 'Comunitat Valenciana'}
def ccaa(k): n = CCAA.get(k, k.replace('_', ' ').title()); return {l: n for l in L4}
def lastidx(arr):
    for i in range(len(arr) - 1, -1, -1):
        if arr[i] is not None: return i
    return None
def ganaderia_es():
    out = []
    m = j('spain-milk/infolac.json')
    if m:
        P = m['periods']; n = m['national']; i = lastidx(n['price']); iy = i - 12 if i is not None and i >= 12 else None
        def v(k, ix): return n[k][ix] if ix is not None and n[k][ix] is not None else None
        prod = sorted(((ccaa(k), (c.get('production') or [None] * len(P))[i]) for k, c in m['ccaa'].items()), key=lambda x: -(x[1] or 0))
        out.append(block('leche-es', 'ES', 'España: leche de vaca (INFOLAC)|Spain: cow’s milk (INFOLAC)|Espagne : lait de vache (INFOLAC)|Spagna: latte vaccino (INFOLAC)', asOf=P[i],
            stats=[stat('Precio medio al ganadero|Average farm-gate price|Prix moyen payé à l’éleveur|Prezzo medio all’allevatore', v('price', i), '€/l', 3, {'d': '%+.1f %% vs año anterior' % pct(v('price', i), v('price', iy))} if v('price', iy) else None),
                   stat('Entregas del mes|Monthly deliveries|Livraisons du mois|Consegne del mese', (v('deliveries', i) or 0) / 1000 if v('deliveries', i) else None, 'miles de t|thousand t|milliers de t|migliaia di t', 1, {'d': '%+.1f %% vs año anterior' % pct(v('deliveries', i), v('deliveries', iy))} if v('deliveries', iy) else None),
                   stat('Ganaderos que entregan|Farmers delivering|Éleveurs livreurs|Allevatori che consegnano', v('farmers', i), '', 0, {'d': '%+.1f %% vs año anterior' % pct(v('farmers', i), v('farmers', iy))} if v('farmers', iy) else None),
                   stat('Grasa|Fat|Matière grasse|Grasso', v('fat', i), '%', 2), stat('Proteína|Protein|Protéine|Proteine', v('protein', i), '%', 2)],
            charts=[chart('Precio al ganadero|Farm-gate price|Prix à l’éleveur|Prezzo all’allevatore', '€/l', [('Precio|Price|Prix|Prezzo', [[p, x] for p, x in zip(P, n['price']) if x is not None])]),
                    chart('Entregas mensuales|Monthly deliveries|Livraisons mensuelles|Consegne mensili', 't', [('Entregas|Deliveries|Livraisons|Consegne', [[p, x] for p, x in zip(P, n['deliveries']) if x is not None])])],
            bars=[bars('Producción por comunidad, ' + P[i] + '|Production by region, ' + P[i] + '|Production par région, ' + P[i] + '|Produzione per regione, ' + P[i], 't', [(l, x) for l, x in prod if x], 0)],
            source={'name': 'MAPA / FEGA, INFOLAC', 'url': 'https://www.fega.gob.es/es/datos-abiertos/consulta-de-datos/infolac'}))
    s = j('spain-slaughter/slaughter.json')
    if s:
        P = s['periods']; N = s['national']
        SP = {'bovino': 'Vacuno|Cattle|Bovins|Bovini', 'ovino': 'Ovino|Sheep|Ovins|Ovini', 'caprino': 'Caprino|Goats|Caprins|Caprini', 'porcino': 'Porcino|Pigs|Porcins|Suini', 'equino': 'Equino|Horses|Équidés|Equini', 'aves': 'Aves|Poultry|Volailles|Pollame', 'conejos': 'Conejo|Rabbits|Lapins|Conigli'}
        i = lastidx(N['porcino']['carcass']); iy = i - 12 if i is not None and i >= 12 else None
        out.append(block('sacrificio-es', 'ES', 'España: sacrificio en matadero|Spain: slaughter|Espagne : abattages|Spagna: macellazione', asOf=P[i],
            stats=[stat(SP[k] + ' (t de canal)|' + SP[k].split('|')[1] + ' (t carcass)|' + SP[k].split('|')[2] + ' (t carcasse)|' + SP[k].split('|')[3] + ' (t carcassa)', N[k]['carcass'][i], 't', 0, {'d': '%+.1f %% vs año anterior' % pct(N[k]['carcass'][i], N[k]['carcass'][iy])} if iy is not None and N[k]['carcass'][iy] else None) for k in ('porcino', 'bovino', 'aves', 'ovino', 'caprino', 'conejos') if k in N and N[k]['carcass'][i] is not None],
            charts=[chart('Toneladas de canal al mes|Tonnes of carcass per month|Tonnes de carcasse par mois|Tonnellate di carcassa al mese', 't', [(SP[k], [[p, x] for p, x in zip(P, N[k]['carcass']) if x is not None]) for k in ('porcino', 'bovino', 'aves', 'ovino') if k in N])],
            source={'name': 'MAPA, encuesta de sacrificio de ganado', 'url': s['source']['url']}))
    return {'id': 'ganaderia-es', 'title': t4('Leche y sacrificio (España)|Milk and slaughter (Spain)|Lait et abattages (Espagne)|Latte e macellazione (Spagna)'), 'emoji': '🥛', 'blocks': out}

def balances_es():
    out = []
    c = j('spain-balances/cereals.json')
    CN = {'wheat_soft': 'Trigo blando|Soft wheat|Blé tendre|Frumento tenero', 'wheat_durum': 'Trigo duro|Durum wheat|Blé dur|Frumento duro', 'barley': 'Cebada|Barley|Orge|Orzo', 'maize': 'Maíz|Maize|Maïs|Mais', 'rye': 'Centeno|Rye|Seigle|Segale', 'oats': 'Avena|Oats|Avoine|Avena', 'sorghum': 'Sorgo|Sorghum|Sorgho|Sorgo', 'triticale': 'Triticale|Triticale|Triticale|Triticale', 'total': 'Total cereales|All cereals|Total céréales|Totale cereali'}
    if c:
        ks = sorted(c['campaigns']); y = ks[-1]; cp = c['campaigns'][y]; v = cp['v']['total']; vp = c['campaigns'][ks[-2]]['v']['total'] if len(ks) > 1 else {}
        st = cp.get('status') or ''
        def sb(k): return {'d': '%+.1f %% vs %s' % (pct(v.get(k), vp.get(k)), c['campaigns'][ks[-2]]['label'])} if v.get(k) and vp.get(k) else None
        out.append(block('cereales-es', 'ES', 'España: balance de cereales|Spain: cereal balance|Espagne : bilan céréalier|Spagna: bilancio dei cereali', asOf=cp['label'] + (' (' + st + ')' if st else ''),
            stats=[stat('Producción|Production|Production|Produzione', v.get('production'), 'miles de t|thousand t|milliers de t|migliaia di t', 0, sb('production')),
                   stat('Importaciones|Imports|Importations|Importazioni', v.get('imports'), 'miles de t|thousand t|milliers de t|migliaia di t', 0, sb('imports')),
                   stat('Consumo total|Total consumption|Consommation totale|Consumo totale', v.get('consumption'), 'miles de t|thousand t|milliers de t|migliaia di t', 0),
                   stat('De ello, piensos|Of which feed|Dont aliments du bétail|Di cui mangimi', v.get('feed'), 'miles de t|thousand t|milliers de t|migliaia di t', 0),
                   stat('Existencias finales|Ending stocks|Stocks finaux|Scorte finali', v.get('endingStocks'), 'miles de t|thousand t|milliers de t|migliaia di t', 0)],
            charts=[chart('Producción e importaciones por campaña|Production and imports by season|Production et importations par campagne|Produzione e importazioni per campagna', 'miles de t|thousand t|milliers de t|migliaia di t',
                          [('Producción|Production|Production|Produzione', [[k, c['campaigns'][k]['v']['total'].get('production')] for k in ks if c['campaigns'][k]['v']['total'].get('production') is not None]),
                           ('Importaciones|Imports|Importations|Importazioni', [[k, c['campaigns'][k]['v']['total'].get('imports')] for k in ks if c['campaigns'][k]['v']['total'].get('imports') is not None])])],
            bars=[bars('Producción por cereal, ' + cp['label'] + '|Production by cereal, ' + cp['label'] + '|Production par céréale, ' + cp['label'] + '|Produzione per cereale, ' + cp['label'], 'miles de t|thousand t|milliers de t|migliaia di t', sorted([(CN[k], cp['v'][k].get('production')) for k in c['cereals'] if k != 'total' and cp['v'].get(k, {}).get('production')], key=lambda x: -x[1]), 0)],
            note=t4('Campaña de comercialización del 1 de julio al 30 de junio. Las últimas campañas son estimaciones del MAPA.|Marketing year 1 July to 30 June. Latest seasons are MAPA estimates.|Campagne du 1er juillet au 30 juin. Les dernières campagnes sont des estimations du MAPA.|Campagna dal 1° luglio al 30 giugno. Le ultime campagne sono stime del MAPA.'),
            source={'name': 'MAPA, balances de cereales', 'url': c['source']['url']}))
    o = j('spain-balances/olive.json')
    if o:
        ks = sorted(o['campaigns']); y = ks[-1]; cp = o['campaigns'][y]; v = cp['v']['oil']
        out.append(block('aceite-es', 'ES', 'España: balance del aceite de oliva|Spain: olive oil balance|Espagne : bilan de l’huile d’olive|Spagna: bilancio dell’olio d’oliva', asOf=cp['label'] + ' (' + (cp.get('status') or '') + ')',
            stats=[stat('Producción|Production|Production|Produzione', v.get('production'), 'miles de t|thousand t|milliers de t|migliaia di t', 0), stat('Exportaciones|Exports|Exportations|Esportazioni', v.get('exports'), 'miles de t|thousand t|milliers de t|migliaia di t', 0),
                   stat('Consumo interior|Domestic use|Consommation intérieure|Consumo interno', v.get('domestic'), 'miles de t|thousand t|milliers de t|migliaia di t', 0), stat('Existencias finales|Ending stocks|Stocks finaux|Scorte finali', v.get('endingStocks'), 'miles de t|thousand t|milliers de t|migliaia di t', 0)],
            charts=[chart('Producción y exportaciones por campaña|Production and exports by season|Production et exportations par campagne|Produzione ed esportazioni per campagna', 'miles de t|thousand t|milliers de t|migliaia di t',
                          [('Producción|Production|Production|Produzione', [[k, o['campaigns'][k]['v']['oil'].get('production')] for k in ks if o['campaigns'][k]['v']['oil'].get('production') is not None]),
                           ('Exportaciones|Exports|Exportations|Esportazioni', [[k, o['campaigns'][k]['v']['oil'].get('exports')] for k in ks if o['campaigns'][k]['v']['oil'].get('exports') is not None])])],
            note=t4('Campaña del 1 de octubre al 30 de septiembre.|Season from 1 October to 30 September.|Campagne du 1er octobre au 30 septembre.|Campagna dal 1° ottobre al 30 settembre.'),
            source={'name': 'MAPA, balance del aceite de oliva', 'url': o['source']['url']}))
    w = j('spain-wine/monthly.json')
    if w:
        M = w['months']; N = w['national']; i = lastidx(N['stockEnd'])
        out.append(block('vino-es', 'ES', 'España: existencias y salidas de vino|Spain: wine stocks and shipments|Espagne : stocks et sorties de vin|Spagna: scorte e uscite di vino', asOf=M[i],
            stats=[stat('Existencias a final de mes|Stocks at month end|Stocks en fin de mois|Scorte a fine mese', N['stockEnd'][i] / 1e6, 'millones de hl|million hl|millions d’hl|milioni di hl', 2),
                   stat('Salidas al mercado interior|Domestic shipments|Sorties marché intérieur|Uscite mercato interno', (N['exitsDomestic'][i] or 0) / 1e6, 'millones de hl|million hl|millions d’hl|milioni di hl', 2),
                   stat('Salidas a la UE|Shipments to the EU|Sorties vers l’UE|Uscite verso l’UE', (N['exitsEU'][i] or 0) / 1e6, 'millones de hl|million hl|millions d’hl|milioni di hl', 2),
                   stat('Salidas fuera de la UE|Shipments outside the EU|Sorties hors UE|Uscite fuori UE', (N['exitsThird'][i] or 0) / 1e6, 'millones de hl|million hl|millions d’hl|milioni di hl', 2)],
            charts=[chart('Existencias de vino|Wine stocks|Stocks de vin|Scorte di vino', 'millones de hl|million hl|millions d’hl|milioni di hl', [('Existencias|Stocks|Stocks|Scorte', [[p, round(x / 1e6, 2)] for p, x in zip(M, N['stockEnd']) if x is not None])])],
            bars=[bars('Existencias por comunidad, ' + M[i] + '|Stocks by region, ' + M[i] + '|Stocks par région, ' + M[i] + '|Scorte per regione, ' + M[i], 'millones de hl|million hl|millions d’hl|milioni di hl', sorted([(ccaa(k), (cc_['stockEnd'][i] or 0) / 1e6) for k, cc_ in w['ccaa'].items() if cc_['stockEnd'][i]], key=lambda x: -x[1]), 2)],
            source={'name': 'MAPA, INFOVI', 'url': w['source']['url']}))
    return {'id': 'balances-es', 'title': t4('Cosecha, existencias y comercio (España)|Harvest, stocks and trade (Spain)|Récolte, stocks et commerce (Espagne)|Raccolto, scorte e commercio (Spagna)'), 'emoji': '🇪🇸', 'blocks': out}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    gen = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    idx = {}
    keep = {'index.json'}
    for fn in (ganaderia_es, balances_es, seguro, cultivos, oferta, clima, insumos, cuentas, granos_ca, ganaderia_us, exportaciones_us, aranceles):
        try: doc = fn()
        except Exception as e: print('ERROR en', fn.__name__, repr(e)); raise
        if not doc or not doc['blocks']: print('sin datos:', fn.__name__); continue
        doc['schemaVersion'] = 1
        p = OUT / (doc['id'] + '.json'); keep.add(p.name)
        old = None
        try: old = json.loads(p.read_text())
        except Exception: pass
        if not old or old.get('blocks') != doc['blocks']:
            p.write_text(json.dumps(dict(doc, generatedAt=gen), ensure_ascii=False, separators=(',', ':')) + '\n')
        idx[doc['id']] = {'title': doc['title'], 'emoji': doc.get('emoji', ''), 'markets': sorted({b['cc'] for b in doc['blocks']}), 'n': len(doc['blocks'])}
    (OUT / 'index.json').write_text(json.dumps({'schemaVersion': 1, 'sections': idx}, ensure_ascii=False, separators=(',', ':')) + '\n')
    for f in OUT.glob('*.json'):
        if f.name not in keep: f.unlink()
    print('app sec:', {k: (v['n'], v['markets'][:6]) for k, v in idx.items()})

if __name__ == '__main__':
    main()
