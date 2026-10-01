import os, io, urllib.request, zipfile
os.makedirs('data/probe', exist_ok=True)
out = []
req = urllib.request.Request('https://github.com/rousseauxy/taric-opendata/releases/download/eu-2026-09/eu-taric-2026-09.zip', headers={'User-Agent': 'Mozilla/5.0'})
b = urllib.request.urlopen(req, timeout=300).read()
zf = zipfile.ZipFile(io.BytesIO(b))
import openpyxl
for name in ['Duties Import 01-99.xlsx', 'Nomenclature EN.xlsx', 'Geographical areas description.xlsx']:
    wb = openpyxl.load_workbook(io.BytesIO(zf.read(name)), read_only=True)
    for ws in wb.worksheets[:3]:
        out.append('== %s / %s' % (name, ws.title))
        n = 0
        for row in ws.iter_rows(values_only=True):
            n += 1
            if n <= 6 or (row and any(str(c).startswith('10059000') or str(c).startswith('1005900000') for c in row[:3] if c)):
                out.append(str(row)[:600])
            if n > 40000 and 'Duties' not in name: break
        out.append('rows %d' % n)
open('data/probe/wits.txt', 'w').write('\n'.join(out))
