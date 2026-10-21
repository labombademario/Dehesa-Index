"""Sondeo 2 (no se fusiona): descarga excels del MAPA (reglamento 543/2009) y busca Asturias / sidra / judia."""
import re, ssl, os, json, urllib.request, urllib.parse
CTX = ssl._create_unverified_context()  # mapa.gob.es: cadena incompleta; solo lectura publica
OUT = 'probe-asturias-out'; os.makedirs(OUT + '/x', exist_ok=True)
B = 'https://www.mapa.gob.es'
def get(u):
    rq = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex-probe)'})
    with urllib.request.urlopen(rq, timeout=90, context=CTX) as r: return r.read()
page = get(B + '/es/estadistica/temas/estadisticas-agrarias/agricultura/superficies-producciones-anuales-cultivos/').decode('utf-8', 'ignore')
links = []
for m in re.finditer(r'<a [^>]*href="([^"#]+\.xlsx?)"[^>]*>(.*?)</a>', page, re.S | re.I):
    links.append((urllib.parse.urljoin(B, m.group(1)), re.sub(r'<[^>]+>|\s+', ' ', m.group(2)).strip()))
want = [(u, t) for u, t in links if re.search(r'frutales_no_citricos|leguminosas|otros_lenosos', u)]
print('candidatos', len(want))
try:
    import openpyxl
except ImportError:
    os.system('pip install -q openpyxl --break-system-packages'); import openpyxl
rep = []
for u, t in want:
    fn = OUT + '/x/' + os.path.basename(u)
    try:
        open(fn, 'wb').write(get(u))
        wb = openpyxl.load_workbook(fn, read_only=True, data_only=True)
    except Exception as e:
        print('ERR', u, e); rep.append({'url': u, 'err': str(e)[:150]}); continue
    info = {'url': u, 'title': t, 'sheets': {}}
    for ws in wb.worksheets:
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
        hits = [[c for c in r if c is not None][:14] for r in rows if any(isinstance(c, str) and re.search(r'asturias|sidra|jud[ií]a|fabes', c, re.I) for c in r)]
        info['sheets'][ws.title] = {'rows': len(rows), 'head': [[c for c in r if c is not None][:10] for r in rows[:7]], 'hits': hits[:25]}
    rep.append(info); print('OK', os.path.basename(u), {k: len(v['hits']) for k, v in info['sheets'].items()})
    os.remove(fn)
json.dump(rep, open(OUT + '/report2.json', 'w'), ensure_ascii=False, indent=1, default=str)
