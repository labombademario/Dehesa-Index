#!/usr/bin/env python3
"""Produccion cosechada por cultivo y pais de la UE (Eurostat apro_cpsh1, humedad estandar UE) -> data/eu-crops-map.json
Alimenta «Quien produce que», vista Europa, para productos que USDA PSD no publica (avellana, hortalizas, frutales...).
Solo lo que Eurostat publica: ningun hueco se rellena. Se omiten agregados (codigos ...0000) y categorias residuales («n.e.c.», «Other»).
Un cultivo entra si en su ultimo ano con datos lo publican al menos 3 paises. Unidad: toneladas (Eurostat publica miles de t, x1000 exacto).
Si la descarga falla o sale vacia no se sobrescribe nada."""
import datetime, json, re, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/apro_cpsh1'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
SINCE = datetime.date.today().year - 10
def get(u):
    last = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=240) as r: return json.loads(r.read())
        except Exception as e: last = e
    raise RuntimeError('%s -> %s' % (u, last))
def clean(l): return re.sub(r'\s+', ' ', l).strip().replace(' - ', ', ')
NEC = re.compile(r'n\.e\.c|^other\b|, other\b', re.I)
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def main():
    j = get(API + '?lang=EN&strucpro=HPRD_HUMD_EU_THS_T&sinceTimePeriod=%d' % SINCE)
    ids, size = j['id'], j['size']; cats = {}; labs = {}
    for d in ids:
        c = j['dimension'][d]['category']; idx = c['index']; o = [None] * len(idx)
        if isinstance(idx, dict):
            for k, v in idx.items(): o[v] = k
        else: o = list(idx)
        cats[d] = o; labs[d] = c.get('label', {})
    data = {}
    for k, v in j.get('value', {}).items():
        k = int(k); rec = {}
        for d, n in reversed(list(zip(ids, size))): rec[d] = cats[d][k % n]; k //= n
        geo = rec['geo']
        if not re.fullmatch(r'[A-Z]{2}', geo) or v is None: continue
        data.setdefault(rec['crops'], {}).setdefault(geo, {})[rec['time']] = round(v * 1000, 1)
    out = []
    for code, ctry in sorted(data.items()):
        label = clean(labs['crops'].get(code, code))
        if code.endswith('0000') or NEC.search(label): continue
        years = sorted({y for c in ctry.values() for y in c})
        best = None
        for y in reversed(years):
            n = sum(1 for c in ctry.values() if y in c)
            if n >= 3: best = y; break
        if not best: continue
        out.append({'code': code, 'label': label, 'unit': 't', 'latestYear': best, 'countries': {c: {y: v for y, v in sorted(ys.items())} for c, ys in sorted(ctry.items())}})
    if len(out) < 10:
        log('ERROR: demasiados pocos cultivos (%d); no se escribe nada' % len(out)); sys.exit(1)
    doc = {'schemaVersion': '1.0', 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'source': {'name': 'Eurostat, Crop production in national humidity (apro_cpsh1), harvested production at EU standard humidity', 'url': 'https://ec.europa.eu/eurostat/databrowser/view/apro_cpsh1/', 'license': 'Eurostat reuse policy (Decision 2011/833/EU), citation required'},
           'note': 'Produccion cosechada por pais de la UE (codigos Eurostat: EL = Grecia). Solo paises que publican dato. Toneladas.', 'crops': out}
    (ROOT / 'data' / 'eu-crops-map.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    log('cultivos', len(out))
    (ROOT / 'data' / 'eu-crops-map-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
main()
