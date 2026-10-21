"""Sondeo (no se fusiona): ¿publican MAPA o el Principado de Asturias series de varios años por comunidad para manzana de sidra y judia seca?
Solo lee paginas publicas y guarda enlaces y cabeceras, no contenidos."""
import re, json, sys, urllib.request, urllib.parse, os
OUT = 'probe-asturias-out'; os.makedirs(OUT, exist_ok=True)
SEEDS = [
 'https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/superficies-producciones-anuales-cultivos/',
 'https://www.mapa.gob.es/es/estadistica/temas/publicaciones/anuario-de-estadistica/',
 'https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/',
 'https://www.sadei.es/',
 'https://www.asturias.es/',
 'https://datos.gob.es/es/catalogo?q=manzana+sidra+asturias',
 'https://datos.gob.es/es/catalogo?q=superficie+producci%C3%B3n+cultivos+comunidades+aut%C3%B3nomas+serie',
]
KW = re.compile(r'sidra|manzan|jud[ií]a|fabes|faba|serie|hist[oó]ric|anuario|\.xlsx?|\.csv|cultivo|superficies', re.I)
def get(u, n=400000, head=False):
    rq = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex-probe)'})
    try:
        with urllib.request.urlopen(rq, timeout=40) as r:
            b = r.read(n); return r.status, r.geturl(), r.headers.get('content-type', ''), r.headers.get('content-length'), b
    except Exception as e:
        return 0, u, str(e)[:120], None, b''
rep = []
for u in SEEDS:
    st, fu, ct, cl, b = get(u)
    links = []
    if b and 'html' in ct:
        html = b.decode('utf-8', 'ignore')
        for m in re.finditer(r'<a [^>]*href="([^"#]+)"[^>]*>(.*?)</a>', html, re.S | re.I):
            h, t = m.group(1), re.sub(r'<[^>]+>|\s+', ' ', m.group(2)).strip()
            if KW.search(h) or KW.search(t): links.append((urllib.parse.urljoin(fu, h), t[:100]))
    seen = set(); L = [x for x in links if not (x[0] in seen or seen.add(x[0]))]
    rep.append({'seed': u, 'status': st, 'final': fu, 'type': ct, 'bytes': len(b), 'links': L[:60]})
    print(u, st, ct, len(b), len(L)); sys.stdout.flush()
# un nivel mas: los enlaces con sidra / judia / serie
fol = []
for r in rep:
    for h, t in r['links']:
        if re.search(r'sidra|manzan|jud[ií]a|fabes|hist[oó]ric|serie', h + ' ' + t, re.I) and len(fol) < 25: fol.append((h, t))
second = []
for h, t in fol:
    st, fu, ct, cl, b = get(h, 200000)
    sub = []
    if b and 'html' in ct:
        html = b.decode('utf-8', 'ignore')
        for m in re.finditer(r'<a [^>]*href="([^"#]+)"[^>]*>(.*?)</a>', html, re.S | re.I):
            hh, tt = m.group(1), re.sub(r'<[^>]+>|\s+', ' ', m.group(2)).strip()
            if re.search(r'sidra|manzan|jud[ií]a|fabes|\.xlsx?|\.csv', hh + ' ' + tt, re.I): sub.append((urllib.parse.urljoin(fu, hh), tt[:100]))
    second.append({'url': h, 'text': t, 'status': st, 'type': ct, 'bytes': len(b), 'sub': sub[:25]})
    print('  ->', h, st, ct, len(sub)); sys.stdout.flush()
json.dump({'seeds': rep, 'followed': second}, open(OUT + '/report.json', 'w'), ensure_ascii=False, indent=1)
