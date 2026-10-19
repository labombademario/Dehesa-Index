import re, os, sys, json, urllib.request, urllib.parse
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndexProbe/1.0)'}
OUT = 'probe/eu-out'; os.makedirs(OUT, exist_ok=True)
def get(u, n=400000, hdr=None):
    r = urllib.request.Request(u, headers={**UA, **(hdr or {})})
    try:
        with urllib.request.urlopen(r, timeout=40) as x:
            return x.status, x.headers.get('content-type'), x.read(n)
    except Exception as e:
        return 'ERR', str(e)[:150], b''
PAGES = ['https://agriculture.ec.europa.eu/data-and-analysis/markets/outlook/medium-term_en',
 'https://agriculture.ec.europa.eu/data-and-analysis/markets/outlook/short-term_en',
 'https://agriculture.ec.europa.eu/data-and-analysis/markets/outlook_en',
 'https://agridata.ec.europa.eu/extensions/DashboardMTO/MTO.html',
 'https://agridata.ec.europa.eu/extensions/DashboardSTO/STO.html',
 'https://agridata.ec.europa.eu/extensions/DashboardMTO/DashboardMTO.html',
 'https://agridata.ec.europa.eu/',
 'https://api.tech.ec.europa.eu/agrifood/api/',
 'https://api.tech.ec.europa.eu/agrifood/api/swagger.json',
 'https://api.tech.ec.europa.eu/agrifood/api/v3/api-docs',
 'https://agridata.ec.europa.eu/api/', 'https://agridata.ec.europa.eu/api/cereals/prices']
seen = set(); links = set()
for u in PAGES:
    s, ct, b = get(u)
    name = re.sub(r'\W+', '_', u)[:90]
    print('PAGE', s, ct, len(b), u)
    if b: open(f'{OUT}/{name}.html', 'wb').write(b[:150000])
    t = b.decode('utf8', 'ignore')
    for m in re.finditer(r'(?:href|src|url)\s*[=:]\s*["\']([^"\'<>\s]+)', t):
        h = urllib.parse.urljoin(u, m.group(1))
        if re.search(r'\.(xlsx?|csv|json|zip|ods|pdf)(\?|$)|/api/|download|outlook|dashboard|qlik|/sense/|ODP|filedownload', h, re.I): links.add(h)
print('LINKS', len(links))
for h in sorted(links)[:200]: print('  ', h)
# prueba de los enlaces de datos
for h in sorted(links):
    if h in seen: continue
    seen.add(h)
    if not re.search(r'\.(xlsx?|csv|json|zip|ods)(\?|$)|/api/|download', h, re.I): continue
    s, ct, b = get(h, 3000)
    print('DATA', s, ct, len(b), h, b[:120].replace(b'\n', b' ') if b else '')
    if len(seen) > 60: break
