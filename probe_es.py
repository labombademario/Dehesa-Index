import re, subprocess, json, urllib.request, urllib.parse, ssl, sys
from pathlib import Path
O = Path('probe_es'); O.mkdir(exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'}
def get(u, binary=False, t=90):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r:
            b = r.read(); return b if binary else b.decode('utf8', 'replace')
    except Exception as e:
        return None if binary else 'ERR %s' % e
def links(html, pat):
    return sorted({urllib.parse.unquote(m) for m in re.findall(r'href="([^"]+)"', html) if re.search(pat, m, re.I)})
S = 'https://www.mapa.gob.es'
pages = {
 'cereales': S + '/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/cereales/balances-de-gestion-de-cereales',
 'cultivos-herbaceos': S + '/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/',
 'oleaginosas': S + '/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/oleaginosas/',
 'arroz': S + '/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/arroz/informacion_general_sector-arroz',
 'arroz2': S + '/es/agricultura/temas/producciones-agricolas/cultivos-herbaceos/arroz/',
 'estadisticas-agrarias': S + '/es/estadistica/temas/estadisticas-agrarias/',
 'industrias-lacteas': S + '/es/estadistica/temas/estadisticas-agrarias/economia/industrias-lacteas/',
}
out = {}
for k, u in pages.items():
    h = get(u); (O / (k + '.html')).write_text(h or '', encoding='utf8')
    out[k] = {'url': u, 'len': len(h or ''), 'head': (h or '')[:120].replace('\n', ' '), 'pdf_links': links(h or '', r'\.pdf'), 'sub_links': links(h or '', r'(oleagin|arroz|balance|lacte|industri|existenc)')[:60]}
(O / 'pages.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
# PDF industrias lacteas mensual
for name, u in {'ind-lacteas': 'https://mapa.gob.es/ca/estadistica/temas/estadisticas-agrarias/industrias_lacteas_mensual_noviembre_2023-octubre_2024_tcm34-694259.pdf',
                'oleag-2425': 'https://servicio.mapama.gob.es/ca/agricultura/temas/producciones-agricolas/balancesoleaginosases_2024_25_tcm34-710037.pdf',
                'arroz-1519': 'https://servicio.mapa.gob.es/ca/ganaderia/estadisticas/balancearroz2015-2019actsept2019_tcm34-426840.pdf',
                'pizarra': 'https://servicio.mapa.gob.es/en/ganaderia/estadisticas/pizarrasectormarzo2025_tcm38-502265.pdf'}.items():
    b = get(u, True)
    if b:
        (O / (name + '.pdf')).write_bytes(b)
        subprocess.run(['pdftotext', '-layout', str(O / (name + '.pdf')), str(O / (name + '.txt'))])
    else:
        (O / (name + '.txt')).write_text('descarga fallida')
# Eurostat
E = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
def es(ds, q):
    r = get(E + ds + '?format=JSON&lang=EN&' + q); return r
res = {}
res['hicp_dims'] = (es('prc_hicp_midx', 'geo=ES&unit=I15&coicop=CP01147&coicop=CP01151&coicop=CP011&lastTimePeriod=2') or '')[:3000]
res['hicp_ES_butter_cheese'] = (es('prc_hicp_midx', 'geo=ES&unit=I15&coicop=CP01147&coicop=CP01151&lastTimePeriod=3') or '')[:3500]
(O / 'eurostat.json').write_text(json.dumps(res, ensure_ascii=False, indent=1))
# catalogo Eurostat: tablas de existencias lacteas
cat = get('https://ec.europa.eu/eurostat/api/dissemination/catalogue/toc/txt?lang=en') or ''
(O / 'toc_hits.txt').write_text('\n'.join(l for l in cat.split('\n') if re.search(r'stock|dairy|milk|butter|cheese|rice|oilseed|rape|soya', l, re.I))[:20000])
print('ok')
