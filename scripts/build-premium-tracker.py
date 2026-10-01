#!/usr/bin/env python3
"""data/premium-tracker.json — Premium Tracker: oferta organica (USDA AMS 3802) frente a oferta convencional (USDA AMS cash bids).

Solo compara PARES CON LA MISMA ESPECIFICACION: mismo producto, misma clase, mismo grado, mismo punto de entrega (elevador), misma unidad, ambos tipo
oferta ('Bid'), y la oferta convencional se toma EN LA FECHA del dato organico (o la anterior mas cercana, max. 5 dias). Mediana de series, no media.
Lo que no se puede garantizar queda dicho en `caveats`: cobertura regional distinta (3802 es nacional/regiones amplias; los cash bids son estatales) y el mes de entrega.
Minimos: >=3 series organicas y >=5 convencionales; si no, la celda es null con `reason`. No se inventa ni se interpola."""
import datetime, glob, json, statistics, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'
MIN_ORG, MIN_CONV, MAX_LAG_DAYS, ORG_WINDOW_DAYS = 3, 5, 5, 21
# (id, nombre, commodity AMS 3802, clase AMS 3802 o None, commodity cash bids, clase cash bids, grado 3802, grado cash bids)
SPECS = [
    ('corn-yellow', 'Corn', 'Yellow', 'corn', 'Yellow', 'US #2', 'US #2'),
    ('soybeans', 'Soybean', '', 'soybeans', None, 'US #1', 'US #1'),
    ('wheat-hrw', 'Wheat', 'Hard Red Winter', 'wheat', 'Hard Red Winter', 'US #1', 'US #1'),
    ('wheat-srw', 'Wheat', 'Soft Red Winter', 'wheat', 'Soft Red Winter', 'US #1', 'US #1'),
]
def dt(s): return datetime.date.fromisoformat(s)
def J(p, default=None):
    try: return json.loads((D / p).read_text())
    except Exception: return default

def organic_series(doc):
    ix = {k: i for i, k in enumerate(doc['dn'])}
    out = []
    for s in doc['series']:
        v = s['v']
        if s.get('u') != '$ Per Bushel' or not s['p']: continue
        if v[ix['saleType']] != 'Bid' or v[ix['delivery_Point']] != 'Country Elevators': continue
        out.append({'commodity': v[ix['commod']], 'class': v[ix['class']], 'grade': v[ix['grade']], 'region': v[ix['region']], 'seller': v[ix['seller']],
                    'obs': [(p[0], p[2]) for p in s['p'] if p[2] is not None]})
    return out

def conv_value_at(pts, day):
    """Valor de la serie en `day` o, si falta, el ultimo anterior dentro de MAX_LAG_DAYS. pts = [fecha, avg, lo, hi, bLo, bHi]."""
    best = None
    for p in pts:
        if p[1] is None or p[0] > day: continue
        if best is None or p[0] > best[0]: best = p
    if best and (dt(day) - dt(best[0])).days <= MAX_LAG_DAYS: return best[1]
    return None

def main():
    doc = J('ams/3802.json')
    if not doc: print('premium-tracker: sin data/ams/3802.json; no se genera'); return 1
    org = organic_series(doc)
    conv = []
    for f in glob.glob(str(D / 'us-cash-bids/??/*.json')):
        conv += json.loads(Path(f).read_text())['series']
    cells = []
    for cid, ocom, ocls, ccom, ccls, ogr, cgr in SPECS:
        cand = [s for s in org if s['commodity'] == ocom and s['class'] == ocls and s['grade'] == ogr and s['obs']]
        cell = {'id': cid, 'commodity': ccom, 'class': ocls or None, 'grade': ogr, 'deliveryPoint': 'Country Elevators', 'unit': 'bu', 'saleType': 'Bid',
                'organicReportId': 3802, 'organicSeries': len(cand), 'conventionalSeries': 0, 'date': None, 'organic': None, 'conventional': None, 'premium': None, 'premiumPct': None, 'reason': None}
        if not cand: cell['reason'] = 'sin series organicas con esa especificacion'; cells.append(cell); continue
        latest = max(o[0] for s in cand for o in s['obs'])
        # fecha de referencia: ultima fecha con >= MIN_ORG series organicas en una ventana de ORG_WINDOW_DAYS
        dates = sorted({o[0] for s in cand for o in s['obs'] if (dt(latest) - dt(o[0])).days <= ORG_WINDOW_DAYS}, reverse=True)
        ref = None
        for d_ in dates:
            vals = [x for s in cand for x in [dict(s['obs']).get(d_)] if x is not None]
            if len(vals) >= MIN_ORG: ref = (d_, vals); break
        if not ref: cell['reason'] = 'menos de %d series organicas en la ultima fecha' % MIN_ORG; cells.append(cell); continue
        day, ovals = ref
        cs = [s for s in conv if s['commodity'] == ccom and s['commodityClass'] == ccls and s['grade'] == cgr and s['deliveryPoint'] == 'Country Elevators' and s['unit'] == 'bu']
        cvals = [v for v in (conv_value_at(s['pts'], day) for s in cs) if v is not None]
        cell.update({'date': day, 'conventionalSeries': len(cvals)})
        if len(cvals) < MIN_CONV: cell['reason'] = 'menos de %d series convencionales comparables en esa fecha' % MIN_CONV; cells.append(cell); continue
        om, cm = statistics.median(ovals), statistics.median(cvals)
        cell['organic'] = {'median': round(om, 4), 'min': min(ovals), 'max': max(ovals), 'n': len(ovals)}
        cell['conventional'] = {'median': round(cm, 4), 'min': round(min(cvals), 4), 'max': round(max(cvals), 4), 'n': len(cvals)}
        cell['premium'] = round(om - cm, 4); cell['premiumPct'] = round((om / cm - 1) * 100, 1)
        cells.append(cell)
    out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'sourceIds': ['usda_ams_mars'],
           'method': 'Mediana de ofertas organicas (AMS 3802, tipo Bid, elevador) menos mediana de ofertas convencionales (AMS cash bids, mismo producto, clase, grado y punto de entrega) en la misma fecha.',
           'caveats': ['La cobertura geografica no es la misma: 3802 publica ofertas nacionales o de regiones amplias y los cash bids son estatales; el mes de entrega puede diferir.',
                       'Es una comparacion indicativa de dos informes distintos; no es un precio organico oficial ni un diferencial contractual.',
                       'No se calcula si no hay al menos %d series organicas y %d convencionales comparables en la misma fecha.' % (MIN_ORG, MIN_CONV)],
           'cells': cells}
    (D / 'premium-tracker.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    for c in cells: print(c['id'], c['date'], c['organic'] and c['organic']['median'], c['conventional'] and c['conventional']['median'], c['premiumPct'], c['reason'])
    return 0
if __name__ == '__main__': sys.exit(main())
