import os, sys, io, re, csv, zipfile, urllib.request
sys.path.insert(0, 'scripts')
from lib_ods import read_ods
OUT = []
def p(*a):
    s = ' '.join(str(x) for x in a); OUT.append(s); print(s, flush=True)
UA = {'User-Agent': 'Mozilla/5.0 DehesaIndex/1.0 (+https://dehesaindex.com)'}
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: b = r.read(); p('GET', u, r.status, r.headers.get('Content-Type'), len(b)); return b
    except Exception as e: p('ERR', u, e); return b''
# 1 BoE
for u in ['https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=01/Jan/1990&Dateto=now&SeriesCodes=IUDBEDR,IUMABEDR&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N',
          'https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=01/Jan/1990&Dateto=now&SeriesCodes=IUMABEDR&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N']:
    b = get(u); t = b.decode('utf8', 'ignore'); L = t.splitlines(); p('\n'.join(L[:6])); p('...'); p('\n'.join(L[-4:]))
# 2 DESNZ
for u in ['https://assets.publishing.service.gov.uk/media/6ad63e7d49ba86d6c953cc40/CSV__2018_-__.csv', 'https://assets.publishing.service.gov.uk/media/68a3326b32d2c63f869343a3/weekly_road_fuel_prices_2003_to_2017.csv']:
    b = get(u); L = b.decode('utf-8-sig', 'ignore').splitlines(); p('\n'.join(L[:8])); p('...'); p('\n'.join(L[-3:]))
b = get('https://www.gov.uk/api/content/government/statistics/weekly-road-fuel-prices'); t = b.decode('utf8', 'ignore')
p('API links', sorted(set(re.findall(r'https://assets\.publishing\.service\.gov\.uk/media/[^"\\]+', t)))[:8])
# 3 Farm accounts zip
b = get('https://assets.publishing.service.gov.uk/media/696a0d2fcbe2202b3842489f/fae_tables_csv_format_20260122.zip')
if b:
    z = zipfile.ZipFile(io.BytesIO(b)); names = z.namelist(); p('ZIP', len(names), names[:40])
    for n in names:
        if re.search(r'(?i)table_?5|t5', n):
            t = z.read(n).decode('utf-8-sig', 'ignore'); L = t.splitlines(); p('== ', n, len(L)); p('\n'.join(L[:15])); p('...'); p('\n'.join(L[-5:]))
    # also a generic peek at first 3 files
    for n in names[:3]:
        t = z.read(n).decode('utf-8-sig', 'ignore'); L = t.splitlines(); p('== ', n, len(L)); p('\n'.join(L[:6]))
b = get('https://assets.publishing.service.gov.uk/media/696a0d480c654a0ec44022d6/fae_table_lookup_20260122.csv'); p(b.decode('utf-8-sig', 'ignore')[:3000])
# 4 county structure ODS
b = get('https://assets.publishing.service.gov.uk/media/69e0b39f53469bbcdf408f75/structure-england-june-county-16apr26.ods')
if b:
    S = read_ods(b, max_cols=40)
    for name, rows in S.items():
        p('--- SHEET', name, len(rows))
        for r in rows[:14]: p('  ', [str(c)[:40] if c is not None else '' for c in r][:16])
b = get('https://assets.publishing.service.gov.uk/media/69e0b1fb6c6ccf244be42e2e/structure-england-june-regions-16apr26.ods')
if b:
    S = read_ods(b, max_cols=40)
    for name, rows in list(S.items())[:4]:
        p('--- RSHEET', name, len(rows))
        for r in rows[:10]: p('  ', [str(c)[:40] if c is not None else '' for c in r][:16])
os.makedirs('probe/out', exist_ok=True); open('probe/out/uk4.txt', 'w').write('\n'.join(OUT))
