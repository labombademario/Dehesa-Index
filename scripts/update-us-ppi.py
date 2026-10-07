#!/usr/bin/env python3
"""EE. UU.: indices de precios de produccion (PPI) de productos agrarios y alimentarios -> data/us-ppi.json
Fuente: U.S. Bureau of Labor Statistics, ficheros publicos de https://download.bls.gov/pub/time.series/wp/ (dominio publico; BLS pide citar la fuente).
Solo series con codigo WPU (sin ajuste estacional) y un producto claro: ganado y aves de sacrificio, leche cruda, huevos, patata, soja, colza (canola), arroz,
uva de vinificacion, mantequilla, queso, leche en polvo, azucar refinado y de cana, vino y carnes. Mensual, indice con la base propia de cada serie (se indica en la unidad).
No se estima ni se rellena nada: un valor no numerico o un mes sin dato se omite; una serie con menos de 24 meses o parada hace mas de 8 meses se descarta y queda en el log.
El ultimo mes suele ser provisional (nota P de BLS); se publica tal cual lo da BLS.
Uso: python3 scripts/update-us-ppi.py [--fixtures DIR]  (DIR con wp.series y wp.data.0.Current en vez de la red)"""
import datetime, json, re, sys, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data' / 'us-ppi.json'
UA = {'User-Agent': 'Dehesa-Index-data-bot/1.0 (https://dehesaindex.com)'}
B = 'https://download.bls.gov/pub/time.series/wp/'
WANT = ['WPU0131', 'WPU0132', 'WPU0133', 'WPU0134', 'WPU014', 'WPU0141', 'WPU016', 'WPU017', 'WPU011306', 'WPU01830131', 'WPU01830171', 'WPU0123', 'WPU011102283',
        'WPU0232', 'WPU0233', 'WPU023302', 'WPU0235', 'WPU0252', 'WPU0253', 'WPU026104', 'WPU0213', 'WPU022101', 'WPU022104', 'WPU022103', 'WPU022203', 'WPU0292']
LOG = []
def log(m): LOG.append(m); print(m)
def get(name, fx):
    if fx: return (Path(fx) / name).read_text(encoding='utf-8', errors='replace')
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(B + name, headers=UA), timeout=300) as r: return r.read().decode('utf-8', 'replace')
        except Exception as e: last = e
    raise RuntimeError('%s -> %s' % (name, last))
def title(t):
    t = re.sub(r'^PPI Commodity data for [^-]+-', '', t.strip()); t = re.sub(r',? not seasonally adjusted$', '', t).strip()
    return t[:1].upper() + t[1:]
def main():
    fx = sys.argv[sys.argv.index('--fixtures') + 1] if '--fixtures' in sys.argv else None
    ser = {}
    for l in get('wp.series', fx).splitlines()[1:]:
        p = [x.strip() for x in l.split('\t')]
        if len(p) > 10 and p[0] in WANT and p[3] == 'U': ser[p[0]] = (title(p[5]), p[4])
    pts = {k: {} for k in ser}
    for l in get('wp.data.0.Current', fx).splitlines()[1:]:
        p = l.split('\t')
        if len(p) < 4: continue
        k = p[0].strip()
        if k not in pts: continue
        per, v = p[2].strip(), p[3].strip()
        if not re.fullmatch(r'M(0[1-9]|1[0-2])', per): continue
        try: x = float(v)
        except ValueError: continue
        if x <= 0: continue
        pts[k]['%s-%s' % (p[1].strip(), per[1:])] = x
    today = datetime.date.today(); series = {}
    for k in WANT:
        if k not in ser: log('sin serie %s en wp.series' % k); continue
        n = [[a, round(b, 3)] for a, b in sorted(pts[k].items())]
        if len(n) < 24: log('descartada %s: %d meses' % (k, len(n))); continue
        y, m = int(n[-1][0][:4]), int(n[-1][0][5:7])
        if (today.year - y) * 12 + today.month - m > 8: log('descartada %s: parada en %s' % (k, n[-1][0])); continue
        t, base = ser[k]
        series['%s - PRODUCER PRICE INDEX, %s [%s]' % (t, base, k)] = {'u': 'INDEX %s' % base, 'n': n, 's': {}}
    if len(series) < 15: raise SystemExit('solo %d series: no se escribe' % len(series))
    gen = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try:
        old = json.loads(OUT.read_text(encoding='utf-8'))
        if old.get('series') == series: gen = old['generatedAt']
    except Exception: pass
    doc = {'schemaVersion': '1.0', 'source': 'U.S. Bureau of Labor Statistics, Producer Price Index (wp)', 'mode': 'ppi', 'generatedAt': gen, 'series': series, 'log': LOG[-50:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    (ROOT / 'data' / 'us-ppi-log.txt').write_text('\n'.join(['%d series PPI' % len(series)] + LOG) + '\n', encoding='utf-8')
    print(len(series), 'series')
if __name__ == '__main__': main()
