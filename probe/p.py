import os, sys, io, re, zipfile, urllib.request
sys.path.insert(0, 'scripts')
from lib_ods import read_ods
OUT = []
def p(*a):
    s = ' '.join(str(x) for x in a); OUT.append(s); print(s, flush=True)
UA = {'User-Agent': 'Mozilla/5.0 DehesaIndex/1.0 (+https://dehesaindex.com)'}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: return r.read()
for u in ['https://assets.publishing.service.gov.uk/media/69e0b39f53469bbcdf408f75/structure-england-june-county-16apr26.ods', 'https://assets.publishing.service.gov.uk/media/69e0b1fb6c6ccf244be42e2e/structure-england-june-regions-16apr26.ods']:
    S = read_ods(get(u), max_cols=200); names = list(S); p('FILE', u, names)
    for name in names[-2:]:
        rows = S[name]; p('--- SHEET', name, len(rows))
        for i, r in enumerate(rows[:6]): p('  H%d' % i, [str(c)[:45] if c is not None else '' for c in r])
        for r in rows[6:]: p('  ', [str(c)[:30] if c is not None else '' for c in r][:6], len(r))
z = zipfile.ZipFile(io.BytesIO(get('https://assets.publishing.service.gov.uk/media/696a0d2fcbe2202b3842489f/fae_tables_csv_format_20260122.zip')))
for n in z.namelist():
    if re.search(r'table(1|2|5c)_', n):
        L = z.read(n).decode('utf-8-sig', 'ignore').splitlines(); p('==', n, len(L)); p('\n'.join(L[:4]))
        import csv
        R = list(csv.DictReader(io.StringIO('\n'.join(L))))
        for k in R[0]:
            if k not in ('value', 'lower_ci', 'upper_ci', 'sample_size'): p('  ', k, sorted(set(r[k] for r in R))[:40])
os.makedirs('probe/out', exist_ok=True); open('probe/out/uk5.txt', 'w').write('\n'.join(OUT))
