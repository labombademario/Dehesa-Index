import os, re, io, json, urllib.request, zipfile, subprocess
os.makedirs('data/probe', exist_ok=True)
out = []
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/124 Safari/537.36'}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=300) as r:
        return r.read()
def sh(c):
    p = subprocess.run(c, shell=True, capture_output=True, text=True); return (p.stdout + p.stderr)
try:
    zf = zipfile.ZipFile(io.BytesIO(get('https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/01-99/01-99-2026-2-eng.zip')))
    zf.extract(zf.namelist()[0], '/tmp/ca'); f = '/tmp/ca/' + zf.namelist()[0]
    out.append(sh('mdb-tables -1 "%s"' % f))
    for t in sh('mdb-tables -1 "%s"' % f).split():
        out.append('== TABLE %s' % t)
        out.append(sh('mdb-export "%s" %s | head -4' % (f, t))[:900])
except Exception as e:
    out.append('CA ERR %s' % e)
try:
    b = get('https://github.com/rousseauxy/taric-opendata/releases/download/eu-2026-09/eu-taric-2026-09.zip')
    out.append('EU zip %d bytes' % len(b))
    zf = zipfile.ZipFile(io.BytesIO(b))
    out.append(str([(i.filename, i.file_size) for i in zf.infolist()][:40]))
    for i in zf.infolist():
        if re.search(r'measure|nomencl|goods', i.filename, re.I) and not i.filename.endswith('/'):
            d = zf.read(i.filename)[:1800]
            out.append('HEAD %s %r' % (i.filename, d))
            break
except Exception as e:
    out.append('EU ERR %s' % e)
open('data/probe/wits.txt', 'w').write('\n'.join(out))
