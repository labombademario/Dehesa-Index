import os, sys, io, re, csv, urllib.request, html
sys.path.insert(0, 'scripts')
from lib_ods import read_ods
import openpyxl
OUT = []
def p(*a):
    s = ' '.join(str(x) for x in a); OUT.append(s); print(s, flush=True)
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) DehesaIndex/1.0 (+https://dehesaindex.com)'}
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: b = r.read(); p('GET', u, r.status, len(b)); return b
    except Exception as e: p('ERR', u, e); return b''
def links(u, rx):
    t = html.unescape(get(u).decode('utf8', 'ignore')); L = sorted(set(re.findall(r'href="([^"]+)"', t)))
    L = [x if x.startswith('http') else re.match(r'https?://[^/]+', u).group(0) + x for x in L if re.search(rx, x, re.I)]
    for x in L: p('  LINK', x)
    return L
def dump_xlsx(b, maxr=14, sheets=None):
    wb = openpyxl.load_workbook(io.BytesIO(b), read_only=True, data_only=True)
    p('SHEETS', wb.sheetnames)
    for n in (sheets or wb.sheetnames)[:12]:
        ws = wb[n]; p('--- SHEET', n, ws.max_row, ws.max_column)
        for i, r in enumerate(ws.iter_rows(values_only=True)):
            if i >= maxr: break
            p('  ', [str(c)[:28] if c is not None else '' for c in r][:16])
# 1 fruit veg csv
b = get('https://assets.publishing.service.gov.uk/media/6ac8b0a5f1ba855cc196a9c2/fruitvegprices-261012.csv')
L = b.decode('utf-8-sig', 'ignore').splitlines(); p('\n'.join(L[:6])); p('...'); p('\n'.join(L[-4:])); p('rows', len(L))
R = list(csv.DictReader(io.StringIO('\n'.join(L))))
for k in R[0]:
    if k not in ('price', 'date'): p('  ', k, len(set(r[k] for r in R)), sorted(set(r[k] for r in R))[:30])
# 2 TIFF regions collection
for u in links('https://www.gov.uk/government/statistics/total-income-from-farming-for-the-regions-of-england', r'\.(ods|csv|xlsx)$'):
    b = get(u)
    if u.endswith('.ods'):
        S = read_ods(b, max_cols=40)
        for n, rows in list(S.items())[:8]:
            p('--- ODS', n, len(rows))
            for r in rows[:10]: p('  ', [str(c)[:28] if c is not None else '' for c in r][:14])
    elif u.endswith('.csv'):
        L = b.decode('utf-8-sig', 'ignore').splitlines(); p('\n'.join(L[:8])); p('rows', len(L))
# 3 DAERA 2026
for u in ['https://www.daera-ni.gov.uk/publications/agricultural-market-reports-2026', 'https://www.daera-ni.gov.uk/articles/agricultural-market-reports']:
    links(u, r'\.(xlsx|xls|pdf)$|agricultural-market-reports-20')
b = get('https://www.daera-ni.gov.uk/sites/default/files/2026-01/Vol%2088%20Quarter%204%20Reports_1.xlsx')
if b: dump_xlsx(b, 40)
# 4 Scotland
ls = links('https://www.gov.scot/publications/results-from-the-scottish-agricultural-census-june-2026/documents/', r'\.(xlsx|ods|csv)')
for u in ls[:2]:
    b = get(u)
    if b and u.lower().endswith('.xlsx'): dump_xlsx(b, 12)
b = get('https://data.gov.scot/dataset/cereal_and_oilseed_rape_harvest__final_estimates/resource/a99ad07d-b71e-40f2-a7cf-2967b9351b1e/download')
p(b[:1500].decode('utf8', 'ignore'))
links('https://www.gov.scot/collections/cereal-and-oilseed-rape-harvest/', r'publications/')
os.makedirs('probe/out', exist_ok=True); open('probe/out/uk6.txt', 'w').write('\n'.join(OUT))
