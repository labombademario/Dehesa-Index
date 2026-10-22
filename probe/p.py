import sys, os, urllib.request
sys.path.insert(0, 'scripts')
from lib_ods import read_ods
OUT = []
def p(*a):
    s = ' '.join(str(x) for x in a); OUT.append(s); print(s, flush=True)
UA = {'User-Agent': 'Mozilla/5.0 DehesaIndex/1.0'}
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90) as r: return r.read()
    except Exception as e: p('ERR', u, e); return None
for u in ['https://assets.publishing.service.gov.uk/media/6ab2606dfceb6fb3a6500fa9/Agricultural_Workforce_in_England-20260924.ods',
          'https://assets.publishing.service.gov.uk/media/69381ad9e447374889cd8f6a/agricultural-workforce-in-the-uk-20251211.ods']:
    b = get(u)
    if not b: continue
    p('=== FILE', u, len(b))
    S = read_ods(b)
    for name, rows in S.items():
        p('--- SHEET', name, len(rows))
        for r in rows[:int(40 if len(rows) < 80 else 25)]: p('  ', [str(c)[:60] if c is not None else '' for c in r][:20])
os.makedirs('probe/out', exist_ok=True)
open('probe/out/ukage.txt', 'w').write('\n'.join(OUT))
