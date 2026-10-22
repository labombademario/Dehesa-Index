#!/usr/bin/env python3
"""Canada: precios mayoristas de fruta y hortaliza (AAFC, Weekly/Daily Wholesale Prices Report; Open Government Licence - Canada).
Descarga el CSV diario (55 semanas) de https://od-do.agr.gc.ca/ y deja, por ciudad, una fila por producto y variedad con el precio mas bajo y el mas alto del
ultimo dia cotizado, el anterior y el peso del envase. Son precios que piden los mayoristas (ranges, dolares canadienses por envase): no son precio del agricultor.
Salidas: data/ca/wholesale-<codigo>.json y data/ca/wholesale-index.json (pequeños, los lee precios.html). Si la descarga falla o trae pocas filas, no toca nada y sale en rojo."""
import csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'ca'
URLS = ['https://od-do.agr.gc.ca/DailyWholesalePrices_PrixDeGrossistesQuotidiens.csv', 'https://od-do.agr.gc.ca/WeeklyWholesalePrices_PrixDeGrossistesHebdomadaires55.csv']   # diario (Montreal, Toronto...) y semanal (ultimas 55 semanas)
SRC = {'name': 'Agriculture and Agri-Food Canada, Daily Wholesale Prices Report', 'url': 'https://open.canada.ca/data/en/dataset/920bc8e2-de26-4bf6-ac41-ed47962d0ff6',
       'license': 'Open Government Licence - Canada'}
CITY = {'Montreal': 'MO', 'Toronto': 'TO', 'Vancouver': 'VA', 'Calgary': 'CA', 'Edmonton': 'ED', 'Winnipeg': 'WI'}
FRUIT_NAMES = {'Apples', 'Apricots', 'Avocados', 'Bananas', 'Blackberries', 'Blueberries', 'Cherries', 'Coconuts', 'Cranberries', 'Currants Gooseberry', 'Dates', 'Figs', 'Granadilla', 'Grapefruit',
               'Grapes (Table)', 'Guava', 'Jackfruit', 'Kiwi Fruit', 'Kumquat', 'Lemons', 'Limes', 'Lychee', 'Mandarines', 'Mangoes', 'Mangosteen', 'Melons', 'Nectarines', 'Oranges', 'Papaya',
               'Passion Fruit', 'Peaches', 'Pears', 'Persimmons', 'Physalis', 'Pineapples', 'Pitahaya', 'Plums', 'Pomegranates', 'Pummelo', 'Rambutan', 'Raspberries', 'Strawberries', 'Sweet Sop', 'Tamarind'}
NUT_NAMES = {'Nuts'}
KG = {'lb': 0.45359237, 'lbs': 0.45359237, 'kg': 1.0, 'kgs': 1.0, 'gr': 0.001, 'g': 0.001, 'oz': 0.028349523}   # unidades de peso del envase; cualquier otra (litros, unidades) => sin $/kg


def now(): return datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
def num(s):
    try: return float(s) if s not in (None, '') else None
    except ValueError: return None
def fetch(url):
    last = None
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'})
            with urllib.request.urlopen(req, timeout=180) as r: return r.read().decode('utf-8-sig', 'replace')
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    print('descarga fallida %s: %s' % (url, last)); return ''


def main():
    rows = []
    for u in URLS: rows += list(csv.DictReader(io.StringIO(fetch(u))))
    if len(rows) < 20000: raise SystemExit('CSV demasiado corto (%d filas): no se toca nada' % len(rows))
    lines = {}   # (ciudad, producto, variedad, origen, envase, categoria) -> [(fecha, lo, hi)]
    meta = {}; units = {}
    for r in rows:
        c = (r.get('CentreEn_CentreAn') or '').replace('Wholesale-', '').strip(); com = (r.get('CmdtyEn_PrdtAn') or '').strip()
        lo, hi = num(r.get('LowPrice_PrixMin')), num(r.get('HighPrice_PrixMax'))
        if c not in CITY or not com or (lo is None and hi is None): continue
        origin = ', '.join(z for z in ((r.get('ProvState_ProvEtat') or '').strip(), (r.get('Cntry_Pays') or '').strip()) if z)
        k = (c, com, (r.get('VrtyEn_VrteAn') or '').strip(), origin, (r.get('PkgTypeEn_EmpqtgAn') or '').strip(), (r.get('GradeEn_CtgryAn') or '').strip(), (r.get('PkgSizeEn_TaillePqtAn') or '').strip())
        lines.setdefault(k, []).append((r['Date'], lo, hi))
        if k not in meta:
            u = (r.get('UnitMsrEn_QteUnitAn') or '').strip().lower(); units[u] = units.get(u, 0) + 1
            q, w = num(r.get('PkgQty_QtePqt')), num(r.get('PkgWt_PdsPqt'))
            kg = round((q or 1) * w * KG[u], 3) if w and u in KG else None
            meta[k] = {'fr': (r.get('CmdtyEn_PrdtFr') or '').strip(), 'kg': kg}
    OUT.mkdir(parents=True, exist_ok=True); idx = []
    for city, code in CITY.items():
        mine = {k: sorted(set(v)) for k, v in lines.items() if k[0] == city}
        if not mine: continue
        latest = max(p[-1][0] for p in mine.values())
        cut = (datetime.date.fromisoformat(latest) - datetime.timedelta(days=7)).isoformat()
        best = {}
        for k, pts in mine.items():
            if pts[-1][0] < cut: continue
            kk = (k[1], k[2]); sc = (pts[-1][0], len(pts))
            if kk not in best or sc > best[kk][0]: best[kk] = (sc, k, pts)
        out = []
        for (com, var), (sc, k, pts) in sorted(best.items()):
            d, lo, hi = pts[-1]; pv = pts[-2] if len(pts) > 1 else None
            cat = 'nut' if com in NUT_NAMES else 'fruit' if com in FRUIT_NAMES else 'veg'
            grade = ' · '.join(z for z in (k[5] if k[5] != 'N/A' else '', ('n.º ' + k[6]) if k[6] and k[6] != 'N/A' else '') if z)
            out.append([cat, com, var if var not in ('Unspecified', 'N/A') else '', k[3], k[4], grade, lo, hi, pv[1] if pv else None, pv[2] if pv else None, d, meta[k]['kg'], meta[k]['fr']])
        doc = {'schemaVersion': 1, 'generatedAt': now(), 'code': code, 'city': city, 'date': latest, 'ccy': 'CAD',
               'cols': ['cat', 'commodity', 'variety', 'origin', 'package', 'grade', 'low', 'high', 'prevLow', 'prevHigh', 'date', 'kg', 'commodityFr'], 'source': SRC, 'rows': out}
        old = OUT / ('wholesale-%s.json' % code)
        if old.exists():
            try:
                o = json.loads(old.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = dict(doc); n.pop('generatedAt')
                if o == n: idx.append({'code': code, 'city': city, 'date': latest, 'n': len(out)}); continue
            except Exception: pass
        old.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        idx.append({'code': code, 'city': city, 'date': latest, 'n': len(out)})
    if len(idx) < 4: raise SystemExit('pocas ciudades (%d): no se publica el indice' % len(idx))
    idx.sort(key=lambda c: c['city'])
    ip = OUT / 'wholesale-index.json'
    new = {'schemaVersion': 1, 'cities': idx, 'source': SRC}
    try: same = {k: v for k, v in json.loads(ip.read_text(encoding='utf-8')).items() if k != 'generatedAt'} == new
    except Exception: same = False
    if not same: ip.write_text(json.dumps(dict(new, generatedAt=now()), ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('ciudades', [(c['city'], c['date'], c['n']) for c in idx]); print('unidades de peso vistas', units)


if __name__ == '__main__': main()
