#!/usr/bin/env python3
"""Monitor de insumos por país -> data/views/input-monitor-countries/{index,FR,<UE>,world}.json (los lee monitor-insumos.html; España sigue en input-monitor.json)

  - Francia: índices IPAMPA (precios pagados) e IPPAP (precios percibidos) del INSEE, mensuales, 10 años. Base 2020=100.
  - Resto de la UE: índices de precios de compra y de producción de Eurostat (apri_pi_inq / apri_pi_outq), trimestrales, base 2020=100,
    desde 2020 (unos 6 años). Gasóleo semanal (Weekly Oil Bulletin) donde lo tenemos.
  - Referencia internacional: precios mensuales del Banco Mundial (USD/t), 10 años.
Son índices, no precios en euros: miden dónde está el precio frente a su propia historia, no cuánto cuesta. Nada se estima; si falta una serie, se omite.
Posición = % de observaciones de la ventana iguales o más baratas que la última. No es una previsión. Uso: python3 scripts/build-input-monitor-countries.py"""
import datetime, glob, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/views/input-monitor-countries'
YEARS = 10
L4 = lambda t: dict(zip(('es', 'en', 'fr', 'it'), t))
J = lambda p: json.loads(Path(p).read_text(encoding='utf-8'))

NM = {  # códigos Eurostat AM y series INSEE -> nombre en 4 idiomas
    'am203000': ('Fertilizantes y enmiendas (total)', 'Fertilisers and soil improvers (total)', 'Engrais et amendements (total)', 'Concimi e ammendanti (totale)'),
    'am203110': ('Abonos nitrogenados', 'Nitrogen fertilisers', 'Engrais azotés', 'Concimi azotati'),
    'am203120': ('Abonos fosfatados', 'Phosphate fertilisers', 'Engrais phosphatés', 'Concimi fosfatici'),
    'am203130': ('Abonos potásicos', 'Potash fertilisers', 'Engrais potassiques', 'Concimi potassici'),
    'am203200': ('Abonos compuestos', 'Compound fertilisers', 'Engrais composés', 'Concimi composti'),
    'am206000': ('Piensos (total)', 'Animal feed (total)', 'Aliments du bétail (total)', 'Mangimi (totale)'),
    'am206100': ('Piensos simples', 'Straight feed', 'Aliments simples', 'Mangimi semplici'),
    'am206200': ('Piensos compuestos', 'Compound feed', 'Aliments composés', 'Mangimi composti'),
    'am206110': ('Piensos: cereales y subproductos de molienda', 'Feed: cereals and milling by-products', 'Aliments : céréales et sous-produits de meunerie', 'Mangimi: cereali e sottoprodotti della molitura'),
    'am206210': ('Pienso compuesto para terneros', 'Compound feed for calves', 'Aliment composé pour veaux', 'Mangime composto per vitelli'),
    'am206220': ('Pienso compuesto para vacuno (sin terneros)', 'Compound feed for cattle (excl. calves)', 'Aliment composé pour bovins (hors veaux)', 'Mangime composto per bovini (esclusi vitelli)'),
    'am206230': ('Pienso compuesto para cerdos', 'Compound feed for pigs', 'Aliment composé pour porcs', 'Mangime composto per suini'),
    'am206240': ('Pienso compuesto para aves', 'Compound feed for poultry', 'Aliment composé pour volailles', 'Mangime composto per pollame'),
    'am202000': ('Energía y lubricantes', 'Energy and lubricants', 'Énergie et lubrifiants', 'Energia e lubrificanti'),
    'am202100': ('Electricidad', 'Electricity', 'Électricité', 'Elettricità'),
    'am202200': ('Combustibles de calefacción', 'Heating fuels', 'Combustibles de chauffage', 'Combustibili da riscaldamento'),
    'am202300': ('Carburantes', 'Motor fuels', 'Carburants', 'Carburanti'),
    'am220000': ('Insumos (índice total)', 'All inputs (total index)', 'Intrants (indice global)', 'Mezzi tecnici (indice totale)'),
    'am204000': ('Fitosanitarios', 'Plant protection products', 'Produits phytosanitaires', 'Prodotti fitosanitari'),
    'am205000': ('Veterinario', 'Veterinary expenses', 'Frais vétérinaires', 'Spese veterinarie'),
    'am010000': ('Cereales', 'Cereals', 'Céréales', 'Cereali'), 'am011000': ('Trigo', 'Wheat', 'Blé', 'Grano'),
    'am013000': ('Cebada', 'Barley', 'Orge', 'Orzo'), 'am015000': ('Maíz', 'Maize', 'Maïs', 'Mais'),
    'fr-319': ('Fertilizantes y enmiendas (total)', 'Fertilisers and soil improvers (total)', 'Engrais et amendements (total)', 'Concimi e ammendanti (totale)'),
}
NM['fr-321'] = NM['am203110']; NM['fr-327'] = NM['am203120']; NM['fr-330'] = NM['am203130']; NM['fr-331'] = NM['am203200']
NM['fr-324'] = ('Urea', 'Urea', 'Urée', 'Urea'); NM['fr-322'] = ('Amonitratos', 'Ammonium nitrates', 'Ammonitrates', 'Nitrati ammonici'); NM['fr-323'] = ('Soluciones nitrogenadas', 'Nitrogen solutions', 'Solutions azotées', 'Soluzioni azotate')
NM['fr-427'] = ('Torta de soja', 'Soya cake', 'Tourteau de soja', 'Panello di soia'); NM['fr-445'] = ('Pienso vacas lecheras (TNM 20-35 %)', 'Dairy cow feed (TNM 20-35%)', 'Aliment vaches laitières (TNM 20-35 %)', 'Mangime vacche da latte (TNM 20-35%)')
NM['fr-453'] = ('Pienso cerdos de engorde (completo)', 'Fattening pig feed (complete)', 'Aliment porcs charcutiers (complet)', 'Mangime suini da ingrasso (completo)'); NM['fr-459'] = ('Pienso pollos de engorde', 'Broiler feed', 'Aliment poulets de chair', 'Mangime polli da carne'); NM['fr-463'] = ('Pienso gallinas ponedoras (suelo)', 'Laying hen feed (floor)', 'Aliment poules pondeuses (sol)', 'Mangime galline ovaiole (a terra)')
NM['fr-417'] = NM['am206000']; NM['fr-418'] = NM['am206100']; NM['fr-437'] = NM['am206200']
NM['fr-308'] = NM['am202000']; NM['fr-317'] = NM['am202100']; NM['fr-276'] = NM['am220000']; NM['fr-367'] = NM['am204000']; NM['fr-484'] = NM['am205000']
NM['fr-315'] = ('Gasóleo de automoción', 'Road diesel', 'Gazole routier', 'Gasolio per autotrazione')
NM['fr-316'] = ('Gasóleo no de carretera (agrícola)', 'Non-road diesel (farm)', 'Gazole non routier (GNR)', 'Gasolio non stradale (agricolo)')
NM['fr-596'] = NM['am010000']; NM['fr-600'] = ('Trigo blando', 'Soft wheat', 'Blé tendre', 'Grano tenero'); NM['fr-597'] = NM['am013000']; NM['fr-605'] = NM['am015000']
NM['diesel'] = ('Gasóleo de automoción (surtidor, con impuestos)', 'Road diesel (pump price, taxes included)', 'Gazole routier (prix à la pompe, taxes comprises)', 'Gasolio per autotrazione (alla pompa, tasse incluse)')

EU_GROUPS = [('fert', ['am203000', 'am203110', 'am203120', 'am203130', 'am203200']), ('feed', ['am206000', 'am206100', 'am206110', 'am206200', 'am206210', 'am206220', 'am206230', 'am206240']),
             ('energy', ['am202000', 'am202100', 'am202200', 'am202300']), ('general', ['am220000', 'am204000', 'am205000'])]
EU_GRAINS = ['am010000', 'am011000', 'am013000', 'am015000']; EU_FERTS = ['am203110', 'am203120', 'am203130', 'am203200']
FR_GROUPS = [('fert', ['fr-319', 'fr-321', 'fr-327', 'fr-330', 'fr-331', 'fr-324', 'fr-322', 'fr-323']), ('feed', ['fr-417', 'fr-418', 'fr-437', 'fr-427', 'fr-445', 'fr-453', 'fr-459', 'fr-463']),
             ('energy', ['fr-308', 'fr-316', 'fr-315', 'fr-317']), ('general', ['fr-276', 'fr-367', 'fr-484'])]
FR_GRAINS = ['fr-596', 'fr-600', 'fr-597', 'fr-605']; FR_FERTS = ['fr-321', 'fr-327', 'fr-330', 'fr-331']
FR_IDS = {'fr-%s' % n: 'fr-insee-010777%s' % n for n in (322, 323, 324, 427, 445, 453, 459, 463, 319, 321, 327, 330, 331, 417, 418, 437, 308, 316, 315, 317, 276, 367, 484)}
FR_IDS.update({'fr-596': 'fr-insee-010776596', 'fr-600': 'fr-insee-010776600', 'fr-597': 'fr-insee-010776597', 'fr-605': 'fr-insee-010776605'})

def pkey(p):  # clave ordenable y número de periodo
    m = re.fullmatch(r'(\d{4})-Q([1-4])', p)
    return (int(m.group(1)), int(m.group(2))) if m else None

def prev_year(p):
    return '%04d%s' % (int(p[:4]) - 1, p[4:])

def stats(points, unit, freq):
    """points ordenados [periodo, valor]; freq m (mes), q (trimestre) o w (semana). Ventana = últimos YEARS años o lo disponible."""
    pts = [(p, v) for p, v in points if v is not None]
    per = {'m': 12, 'q': 4, 'w': 52}[freq]
    if len(pts) < 2 * per: return None
    last_p, last_v = pts[-1]
    if freq == 'w':
        y0 = int(last_p[:4]) - YEARS; win = [(p, v) for p, v in pts if p > '%04d%s' % (y0, last_p[4:])]
    else: win = pts[-(YEARS * per):]
    vals = [v for _, v in win]
    pct = round(100.0 * sum(1 for v in vals if v <= last_v) / len(vals))
    lo = min(win, key=lambda x: x[1]); hi = max(win, key=lambda x: x[1])
    yoy = None
    if freq == 'w':
        ya = [(p, v) for p, v in pts if p <= prev_year(last_p)]
        if ya and ya[-1][1] and (datetime.date.fromisoformat(prev_year(last_p)) - datetime.date.fromisoformat(ya[-1][0])).days <= 14: yoy = round((last_v / ya[-1][1] - 1) * 100, 1)
    else:
        d = dict(pts); b = d.get(prev_year(last_p))
        if b: yoy = round((last_v / b - 1) * 100, 1)
    years = round(len(win) / float(per), 1)
    spark = [v for _, v in win][-120:] if freq != 'w' else [v for _, v in win][::4][-130:]
    return {'last': last_p, 'value': last_v, 'unit': unit, 'freq': freq, 'yoy': yoy, 'pct': pct, 'min': list(lo), 'max': list(hi), 'avg': round(sum(vals) / len(vals), 2),
            'from': win[0][0], 'years': min(float(YEARS), years), 'n': len(vals), 'spark': [round(v, 2) for v in spark]}

def ratio(num, den, unit, freq):
    d = dict(den); pts = [(p, round(v / d[p] * 100, 2)) for p, v in num if p in d and d[p] and v]
    return pts, stats(pts, unit, freq)

def eurostat_series():
    """cc -> {código AM: (puntos, 'in'|'out')} con la serie más larga cuando hay duplicados entre ficheros."""
    best = {}
    rx = re.compile(r'-(inpidx|pidx|q-in|q-out)-(am\d{6})(?:-(ni))?$')
    for f in sorted(glob.glob(str(ROOT / 'data/*stats.json'))):
        try: j = J(f)
        except Exception: continue
        cs = j.get('countries') if isinstance(j, dict) else None
        if not isinstance(cs, dict): continue
        for cc, c in cs.items():
            ser = c.get('series') if isinstance(c, dict) else None
            items = ser.items() if isinstance(ser, dict) else [(s.get('id'), s) for s in (ser or [])]
            for k, s in items:
                m = rx.search(k or '')
                if not m or not isinstance(s, dict): continue
                pts = [(p, v) for p, v in (s.get('points') or []) if pkey(p)]
                if len(pts) < 8: continue
                key = (cc, m.group(2), 'in' if m.group(1) in ('inpidx', 'q-in') else 'out')
                if key not in best or len(pts) > len(best[key]): best[key] = pts
    out = {}
    for (cc, code, kind), pts in best.items(): out.setdefault(cc, {})[(code, kind)] = sorted(pts, key=lambda x: pkey(x[0]))
    return out

def diesel_weekly():
    out = {}
    try:
        d = J(ROOT / 'data/diesel-eu-countries.json')
        for cc, c in (d.get('countries') or {}).items():
            if c.get('points'): out[cc] = [tuple(x) for x in c['points']]
    except Exception: pass
    for f in glob.glob(str(ROOT / 'data/views/diesel-eu/*.json')):
        try: d = J(f)
        except Exception: continue
        flds = d.get('fields') or []
        if 'dieselTax' in flds and d.get('weekly'):
            i = flds.index('dieselTax'); out[d['cc']] = [(r[0], r[i]) for r in d['weekly'] if r[i] is not None]
    return out

def build_groups(spec, getter, freq_of):
    groups = []
    for gid, ids in spec:
        items = []
        for i in ids:
            pts = getter(i)
            if not pts: continue
            st = stats(pts, 'índice 2020=100', freq_of)
            if st: items.append(dict(id=i, name=L4(NM[i]), **st))
        groups.append({'id': gid, 'items': items})
    return groups

def build_ratios(grains, ferts, getter, freq, total=None):
    out = []
    if total and sum(1 for f in ferts if getter(f)) < 2: ferts = [total]  # sin desglose por nutriente: se usa el total de fertilizantes
    for g in grains:
        gp = getter(g)
        if not gp: continue
        for f in ferts:
            fp = getter(f)
            if not fp: continue
            pts, st = ratio(gp, fp, 'índice 2020=100', freq)
            if st: out.append(dict(grain=g, fert=f, grainName=L4(NM[g]), fertName=L4(NM[f]), grainLast=gp[-1][0], fertLast=fp[-1][0], **st))
    return out

def write(name, doc):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

CROSS_MIN_MONTHS = 9   # meses con dato para dar por valido el valor unitario medio de un año


def annual_unit_values(points, min_months=CROSS_MIN_MONTHS):
    """[[AAAA-MM, euros/t, toneladas], ...] -> {año: euros/t ponderado por toneladas}; solo años con al menos min_months meses con dato y toneladas."""
    by = {}
    for pt in points:
        if len(pt) < 3 or pt[1] is None or not pt[2]: continue
        by.setdefault(int(pt[0][:4]), []).append((pt[1], pt[2]))
    return dict((y, sum(a * b for a, b in v) / sum(b for a, b in v)) for y, v in by.items() if len(v) >= min_months)


def fert_cross(fadn_countries, prices, first=2016):
    """Gasto en fertilizantes (FADN SE295, euros por explotacion media) por hectarea (SE025) frente al valor unitario de importacion de la urea (Comext 310210).
    cantidad implicita = gasto por ha / precio de la urea = kg de urea equivalente por ha. Un indicador, NO el consumo real: el gasto incluye todos los abonos y enmiendas.
    Un año solo entra si hay gasto, superficie y precio; lo que falta queda fuera, nunca se estima."""
    urea = (prices.get('imports') or {}).get('310210') or {}
    out = {}
    for cc, vs in fadn_countries.items():
        if cc not in urea or 'SE295' not in vs or 'SE025' not in vs: continue
        u = annual_unit_values(urea[cc].get('points', [])); sp = dict((y, v) for y, v in vs['SE295']); ha = dict((y, v) for y, v in vs['SE025'])
        rows = []
        for y in sorted(u):
            if y >= first and sp.get(y) and ha.get(y):
                e = sp[y] / ha[y]; rows.append([y, round(e, 1), round(u[y], 1), round(e / u[y] * 1000)])
        if len(rows) >= 4: out[cc] = rows
    return out


def main():
    gen = J(ROOT / 'data/freshness.json').get('generatedAt')
    index = []
    # --- Francia (INSEE) ---
    fr = {}
    j = J(ROOT / 'data/france-insee-stats.json'); cs = j.get('countries', {}); fc = cs.get('FR') or {}
    ser = fc.get('series'); items = ser.items() if isinstance(ser, dict) else [(s.get('id'), s) for s in ser]
    byid = {k: s for k, s in items}
    def fr_get(i):
        s = byid.get(FR_IDS.get(i)); return [tuple(x) for x in s['points']] if s and s.get('points') else None
    groups = build_groups(FR_GROUPS, fr_get, 'm'); ratios = build_ratios(FR_GRAINS, FR_FERTS, fr_get, 'm')
    if any(g['items'] for g in groups):
        years = max([x['years'] for g in groups for x in g['items']] or [0])
        write('FR.json', {'schemaVersion': 1, 'generatedAt': gen, 'cc': 'FR', 'kind': 'index', 'years': min(YEARS, int(years)), 'freq': 'm',
                          'source': {'name': 'INSEE (IPAMPA e IPPAP)', 'url': 'https://www.insee.fr/', 'license': 'Licence Ouverte / Open Licence'}, 'groups': groups, 'ratios': ratios})
        index.append({'cc': 'FR', 'kind': 'index', 'last': max(x['last'] for g in groups for x in g['items']), 'years': min(YEARS, int(years))})
    # --- UE (Eurostat) + gasóleo semanal ---
    es_all = eurostat_series(); dz = diesel_weekly()
    for cc in sorted(es_all):
        if cc in ('FR', 'ES'): continue  # España con el MAPA; Francia con el INSEE (más historia)
        data = es_all[cc]
        gi = lambda i: data.get((i, 'in')); go = lambda i: data.get((i, 'out'))
        groups = build_groups(EU_GROUPS, gi, 'q')
        if cc in dz:
            st = stats(dz[cc], 'EUR/litro', 'w')
            if st:
                for g in groups:
                    if g['id'] == 'energy': g['items'].append(dict(id='diesel', name=L4(NM['diesel']), **st))
        def both(i): return gi(i) or go(i)
        ratios = build_ratios(EU_GRAINS, EU_FERTS, lambda i: go(i) if i in EU_GRAINS else gi(i), 'q', 'am203000')
        its = [x for g in groups for x in g['items']]
        if not its: continue
        qs = [x for x in its if x['freq'] == 'q']
        if not qs: continue
        years = max(x['years'] for x in qs)
        write(cc + '.json', {'schemaVersion': 1, 'generatedAt': gen, 'cc': cc, 'kind': 'index', 'years': round(years, 1), 'freq': 'q',
                             'source': {'name': 'Eurostat (apri_pi_inq, apri_pi_outq) y Boletín Petrolero de la UE', 'url': 'https://ec.europa.eu/eurostat/', 'license': 'CC BY 4.0 (Decisión 2011/833/UE)'},
                             'groups': groups, 'ratios': ratios})
        index.append({'cc': cc, 'kind': 'index', 'last': max(x['last'] for x in qs), 'years': round(years, 1)})
    # --- referencia internacional (Banco Mundial) ---
    wp = ROOT / 'data/worldbank-fertilizers.json'
    if wp.exists():
        w = J(wp); items = []
        for s in w['series']:
            st = stats([tuple(x) for x in s['points']], 'USD/t', 'm')
            if st: items.append(dict(id='wb-' + s['id'], name=s['name'], **st))
        if items:
            write('world.json', {'schemaVersion': 1, 'generatedAt': w.get('generatedAt') or gen, 'publication': w.get('publication'), 'years': YEARS,
                                 'source': w['source'], 'groups': [{'id': 'world', 'items': items}]})
    # --- azufre: valor unitario de importacion (Eurostat Comext, scripts/update-eu-sulphur.py) ---
    sp = ROOT / 'data/eu-sulphur.json'
    if sp.exists():
        sd = J(sp); items = {}
        for cc, c in sd['countries'].items():
            last = c['points'][-1][0]; y0 = '%04d%s' % (int(last[:4]) - YEARS, last[4:])
            pts = [(q[0], q[1]) for q in c['points'] if q[0] > y0]
            st = stats(pts, 'EUR/t', 'm')
            if not st: continue
            span = (int(last[:4]) - int(pts[0][0][:4])) * 12 + int(last[5:7]) - int(pts[0][0][5:7]) + 1
            if len(pts) < span: st['spark'] = []   # meses sin volumen suficiente: no se dibuja una linea que mienta sobre las fechas
            st['years'] = round(min(float(YEARS), span / 12.0), 1)
            st['tonnes'] = c['points'][-1][2]; st['gaps'] = span - len(pts)
            items[cc] = st
        up = ROOT / 'data/us-sulphur.json'
        if up.exists():   # EE. UU. (US Census Bureau): mismo calculo que la UE, en USD/t
            ud = J(up); last = ud['points'][-1][0]; y0 = '%04d%s' % (int(last[:4]) - YEARS, last[4:])
            pts = [(q[0], q[1]) for q in ud['points'] if q[0] > y0]; st = stats(pts, 'USD/t', 'm')
            if st:
                span = (int(last[:4]) - int(pts[0][0][:4])) * 12 + int(last[5:7]) - int(pts[0][0][5:7]) + 1
                if len(pts) < span: st['spark'] = []
                st['years'] = round(min(float(YEARS), span / 12.0), 1); st['tonnes'] = ud['points'][-1][2]; st['gaps'] = span - len(pts); items['US'] = st
        usgs = None
        gp = ROOT / 'data/usgs-sulfur.json'
        if gp.exists():
            gd = J(gp); sr = {x['id']: x for x in gd['series']}
            usgs = {'annual': sr['us-unit-value']['points'], 'estimateFrom': sr['us-unit-value'].get('estimateFrom'), 'tampa': sr['tampa-contract']['points'], 'source': gd['source']}
        if 'EU' in items:
            write('sulphur.json', {'schemaVersion': 1, 'generatedAt': sd.get('generatedAt') or gen, 'latestPeriod': sd.get('latestPeriod'), 'years': YEARS, 'source': sd['source'], 'minTonnes': sd['minTonnes'], 'items': items, 'usgs': usgs})
    # --- insumos: valores unitarios de comercio exterior de la UE y sus paises (Eurostat Comext, scripts/update-eu-input-prices.py) ---
    ip = ROOT / 'data/eu-input-prices.json'
    if ip.exists():
        pd = J(ip); items = {'imp': {}, 'exp': {}}
        for fl, key in (('imp', 'imports'), ('exp', 'exports')):
            for cn, bycc in pd[key].items():
                for cc, c in bycc.items():
                    last = c['points'][-1][0]; y0 = '%04d%s' % (int(last[:4]) - YEARS, last[4:])
                    pts = [(q[0], q[1]) for q in c['points'] if q[0] > y0]
                    st = stats(pts, 'EUR/t', 'm')
                    if not st: continue
                    span = (int(last[:4]) - int(pts[0][0][:4])) * 12 + int(last[5:7]) - int(pts[0][0][5:7]) + 1
                    if len(pts) < span or cc != 'EU': st['spark'] = []   # solo la UE-27 dibuja grafico; con meses sin volumen no se dibuja una linea que mienta sobre las fechas
                    st['years'] = round(min(float(YEARS), span / 12.0), 1); st['tonnes'] = c['points'][-1][2]; st['gaps'] = span - len(pts)
                    items[fl].setdefault(cn, {})[cc] = st
        # cruce: kg de fertilizante que compra una tonelada de grano a valor unitario de importacion (mismo mes, mismo declarante)
        AF_F = ['310210', '310520', '310530', '310420']; AF_G = ['1001', '1005']
        items['afford'] = {}
        for fcn in AF_F:
            for gcn in AF_G:
                for cc, fc in pd['imports'].get(fcn, {}).items():
                    gc = pd['imports'].get(gcn, {}).get(cc)
                    if not gc: continue
                    fd = dict((q[0], q[1]) for q in fc['points']); pts = [(q[0], round(q[1] / fd[q[0]] * 1000.0, 1)) for q in gc['points'] if fd.get(q[0])]
                    st = stats(pts, 'kg/t', 'm')
                    if not st: continue
                    last = pts[-1][0]; first = pts[max(0, len(pts) - YEARS * 12)][0]
                    span = (int(last[:4]) - int(first[:4])) * 12 + int(last[5:7]) - int(first[5:7]) + 1
                    if len(pts[-YEARS * 12:]) < span or cc != 'EU': st['spark'] = []
                    st['years'] = round(min(float(YEARS), span / 12.0), 1); st['gaps'] = span - len(pts[-YEARS * 12:])
                    items['afford'].setdefault(fcn, {}).setdefault(gcn, {})[cc] = st
        if items['imp']:
            write('prices.json', {'schemaVersion': 1, 'generatedAt': pd.get('generatedAt') or gen, 'latestPeriod': pd.get('latestPeriod'), 'years': YEARS, 'source': pd['source'],
                                  'originsYear': pd.get('originsYear'), 'products': pd['products'], 'items': items, 'origins': pd.get('origins', {}), 'originsByCountry': pd.get('originsByCountry', {})})
    # --- costes y renta de la explotacion media (FADN/FSDN, scripts/update-eu-fadn.py): anual, sin estadistica de ventana (hay pocos años) ---
    fp = ROOT / 'data/eu-fadn.json'
    if fp.exists():
        fd = J(fp); items = {}
        for cc, vs in fd['countries'].items():
            out_ = {}; outp = dict((y, v) for y, v in vs.get('SE131', []))
            for code, pts in vs.items():
                last_y, last_v = pts[-1]; d = dict((y, v) for y, v in pts); prev = d.get(last_y - 1)
                it = {'last': last_y, 'value': last_v, 'yoy': round((last_v / prev - 1) * 100, 1) if prev else None, 'n': len(pts)}
                if code not in ('SE131', 'SE025', 'SE425', 'SE420') and outp.get(last_y): it['share'] = round(last_v / outp[last_y] * 100, 1)
                ev = dict(fd['countries'].get('EU', {}).get(code, [])).get(last_y)    # UE-27 del MISMO año que el pais (Malta llega a 2021, la UE a 2024)
                if ev is not None and cc != 'EU':
                    it['eu'] = ev; eo = dict(fd['countries']['EU'].get('SE131', [])).get(last_y)
                    if 'share' in it and eo: it['euShare'] = round(ev / eo * 100, 1)
                run = [v for y, v in pts if y > last_y - 11]
                it['spark'] = [round(v, 1) for v in run] if len(run) == min(11, last_y - pts[0][0] + 1) and len(run) >= 4 else []
                out_[code] = it
            items[cc] = out_
        cross = fert_cross(fd['countries'], J(ROOT / 'data/eu-input-prices.json') if (ROOT / 'data/eu-input-prices.json').exists() else {})
        write('fadn.json', {'schemaVersion': 1, 'generatedAt': fd.get('generatedAt') or gen, 'latestYear': fd['latestYear'], 'source': fd['source'], 'variables': fd['variables'], 'items': items, 'cross': cross})
    index.sort(key=lambda x: x['cc'])
    write('index.json', {'schemaVersion': 1, 'generatedAt': gen, 'countries': index, 'world': (OUT / 'world.json').exists(), 'sulphur': (OUT / 'sulphur.json').exists(), 'prices': (OUT / 'prices.json').exists(), 'fadn': (OUT / 'fadn.json').exists()})
    print('Monitor de insumos por país: %s; referencia mundial %s' % (', '.join(x['cc'] for x in index), 'sí' if (OUT / 'world.json').exists() else 'no'))

if __name__ == '__main__':
    main()
