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
pg = get('https://www.snice.gob.mx/cs/avi/snice/ligie.info22.html')
if pg:
    hs = re.findall(r'href="([^"]*FRACCIONESARANCELARIAS[^"]*)"', pg.decode('utf-8', 'replace'), re.I)
    out.append('MX hrefs %s' % hs)
    for h in hs[:1]:
        u = h if h.startswith('http') else 'https://www.snice.gob.mx' + (h if h.startswith('/') else '/cs/avi/snice/' + h)
        b = get(u)
        if b:
            open('/tmp/mx.xlsx', 'wb').write(b)
            try:
                import openpyxl
                wb = openpyxl.load_workbook('/tmp/mx.xlsx', read_only=True)
                for ws in wb.worksheets[:3]:
                    out.append('sheet %s dims %s' % (ws.title, ws.dimensions))
                    for i, row in enumerate(ws.iter_rows(values_only=True)):
                        if i < 12 or (row and row[0] and str(row[0]).startswith('10051')): out.append(str(row)[:300])
                        if i > 60: break
            except Exception as e:
                out.append('openpyxl err %s' % e)
# EU mirror
b = get('https://api.github.com/repos/rousseauxy/taric-opendata/releases?per_page=5')
if b:
    for r in json.loads(b)[:5]:
        out.append('REL %s %s' % (r['tag_name'], [(a['name'], a['size']) for a in r['assets']][:12]))
# Canada
for u in ['https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/tblmod-1-eng.xlsx',
          'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/tblmod-2-eng.xlsx',
          'https://laws-lois.justice.gc.ca/eng/XML/C-54.011.xml']:
    b = get(u)
    if b: out.append('HEAD %r' % b[:200])
pg = get('https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/menu-eng.html')
if pg: out.append('CA links %s' % re.findall(r'href="([^"]+\.(?:xlsx|csv|xml|zip))"', pg.decode('utf-8', 'replace'))[:20])
open('data/probe/wits.txt', 'w').write('\n'.join(out))
