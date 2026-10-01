import os, re, io, json, urllib.request, zipfile
os.makedirs('data/probe', exist_ok=True)
out = []
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/124 Safari/537.36'}
def get(u, binary=False, n=None):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=90) as r:
            b = r.read()
            out.append('OK %s %d bytes type=%s' % (u, len(b), r.headers.get('Content-Type')))
            return b
    except Exception as e:
        out.append('ERR %s %s' % (u, e)); return None
# Mexico
b = get('https://www.snice.gob.mx/~oracle/SNICE_DOCS/FRACCIONESARANCELARIAS-LIGIE_20260420-20260420.xlsx')
if b:
    open('/tmp/mx.xlsx', 'wb').write(b)
    import openpyxl
    wb = openpyxl.load_workbook('/tmp/mx.xlsx')
    for ws in wb.worksheets[:3]:
        out.append('sheet %s dims %s' % (ws.title, ws.dimensions))
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i < 10 or (row and row[0] and str(row[0]).replace(' ', '').startswith(('10059001', '04021001', '02011001', '15091001'))): out.append(str(row)[:400])
# EU mirror: todas las releases
n = 0
for page in range(1, 6):
    b = get('https://api.github.com/repos/rousseauxy/taric-opendata/releases?per_page=100&page=%d' % page)
    if not b: break
    for r in json.loads(b):
        n += 1
        if r['tag_name'].startswith('eu') or 'taric' in r['tag_name']:
            out.append('REL %s %s' % (r['tag_name'], [(a['name'], a['size']) for a in r['assets']][:15]))
out.append('releases total %d' % n)
# Canada
for z in ['01-99-2026-2-eng.zip', '01-99-2026-0-eng.zip']:
    b = get('https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/01-99/' + z)
    if b:
        zf = zipfile.ZipFile(io.BytesIO(b)); out.append('ZIP %s %s' % (z, [(i.filename, i.file_size) for i in zf.infolist()][:15]))
        for i in zf.infolist()[:1]:
            out.append('HEAD %r' % zf.read(i.filename)[:1500])
open('data/probe/wits.txt', 'w').write('\n'.join(out))
