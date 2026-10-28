#!/usr/bin/env python3
"""Denominaciones de origen de vinos y quesos por pais (registro eAmbrosia de la Comision Europea) -> data/gi/<CC>.json y data/gi/index.json
Fuente: API publica https://webgate.ec.europa.eu/eambrosia-api/api/v1/geographical-indications (lista completa en una llamada, sin clave).
Licencia: aviso legal de los sitios de la Comision Europea, contenido de la UE bajo CC BY 4.0 salvo indicacion en contra (se cita «© Unión Europea, eAmbrosia»).
Se publican solo las indicaciones REGISTRADAS y vigentes (status=registered, removedFlag=false):
  vinos  = productType WINE
  quesos = productType FOOD con codigo de la Nomenclatura Combinada 0406 (quesos y requesón)
Campos: nombre(s) protegido(s), DOP/IGP, año de proteccion en la UE, expediente y enlace al texto legal. NO se publican los contactos
de los consejos reguladores (emails, telefonos, direcciones) aunque la API los traiga. La API no da la region: solo el pais.
Codigos de pais: los de Dehesa Index (GR -> EL, GB -> UK).
Region (solo Francia): el INAO publica en data.gouv.fr (Licence Ouverte 2.0) las comunas de cada aire geographique de AOC/AOP y de IGP/IG.
  Comuna (codigo INSEE) -> departamento -> region (scripts/ref/fr-dep-region.json). Una denominacion lleva todas las regiones donde tiene comunas.
  Cruce por nombre normalizado: igual; o area «<nombre> ou ...»; o, si no, la union de sus subdenominaciones «<nombre> <algo>» (p. ej. Alsace).
  Lo que no cruza se queda sin region (nunca se asigna a mano). Ultramar no esta en el mapa.
Region (Italia): listados abiertos de Umbria, Puglia, Trento, Bolzano, Lombardia y Toscana (IT_SRC); cobertura parcial, el resto sin region.
Uso: python3 scripts/update-eambrosia.py [--from fichero.json] [--fr-ao fichero.csv] [--fr-ig fichero.csv] [--no-it]"""
import csv, datetime, gzip, io, json, re, sys, unicodedata, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = 'https://webgate.ec.europa.eu/eambrosia-api/api/v1/geographical-indications'
WEB = 'https://ec.europa.eu/agriculture/eambrosia/geographical-indications-register/'
CC = {'GR': 'EL', 'GB': 'UK'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def load(args):
    if '--from' in args:
        p = args[args.index('--from') + 1]
        return json.load(gzip.open(p) if p.endswith('.gz') else open(p, encoding='utf-8'))
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(API, headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': 'application/json'}), timeout=300) as r:
                return json.load(r)
        except Exception as e: last = e
    raise RuntimeError('eAmbrosia: %r' % last)
def cn(x): return {str(c.get('cnText') or '') for c in (x.get('cnClassification') or [])}
def legal_uri(x):
    li = x.get('legalInstrument') or {}
    if li.get('uri'): return li['uri']
    for p in (x.get('publications') or []):
        if p.get('uri'): return p['uri']
    return None

DG = 'https://www.data.gouv.fr/api/1/datasets/%s/'
def norm(t):
    t = unicodedata.normalize('NFD', str(t).lower()); t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', t).strip()
def fetch(u, t=300):
    with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}), timeout=t) as r: return r.read()
def text(b):
    for enc in ('utf-8-sig', 'cp1252'):
        try: return b.decode(enc)
        except UnicodeDecodeError: pass
    return b.decode('latin-1')
def inao_csv(slug, local):
    if local: return text(open(local, 'rb').read())
    d = json.loads(fetch(DG % slug))
    res = [r for r in d.get('resources', []) if (r.get('format') or '').lower() == 'csv']
    if not res: raise RuntimeError('INAO %s: sin CSV' % slug)
    return text(fetch(res[0]['url']))
def fr_regions(args):
    dep = json.loads((ROOT / 'scripts' / 'ref' / 'fr-dep-region.json').read_text(encoding='utf-8'))['dep']
    aires = {}
    ao = inao_csv('aires-geographiques-des-aoc-aop', args[args.index('--fr-ao') + 1] if '--fr-ao' in args else None)
    for r in csv.DictReader(io.StringIO(ao), delimiter=';'):
        reg = dep.get(str(r.get('CI', ''))[:2])
        if reg: aires.setdefault(norm(r.get('Aire géographique', '')), set()).add(reg)
    n_ao = len(aires)
    try:
        ig = inao_csv('aire-geographique-des-igp', args[args.index('--fr-ig') + 1] if '--fr-ig' in args else None) if ('--fr-ig' in args or '--from' not in args) else ''
        for r in csv.DictReader(io.StringIO(ig), delimiter=';'):
            if str(r.get('Actual', '1')).strip() not in ('1', ''): continue
            reg = dep.get(str(r.get('CI', ''))[:2])
            if reg: aires.setdefault(norm(r.get('Aire géographique', '')), set()).add(reg)
    except Exception as e: log('INAO IGP no disponible:', repr(e)[:160])
    log('INAO areas', n_ao, 'AOC/AOP,', len(aires) - n_ao, 'IGP/IG')
    keys = sorted(aires)
    def find(names):
        out = set()
        for n in names:
            k = norm(n)
            if k in aires: out |= aires[k]; continue
            alt = [a for a in keys if a.startswith(k + ' ou ') or a.startswith(k + ' et ')]
            if alt:
                for a in alt: out |= aires[a]
                continue
            sub = [a for a in keys if a.startswith(k + ' ')]
            for a in sub: out |= aires[a]
        return sorted(out)
    return find

# Italia: no hay listado nacional abierto con region. Se usan los listados abiertos de las regiones que los publican; una denominacion
# que aparece en el listado de una region tiene zona de produccion en esa region. Las regiones sin listado quedan sin asignar.
IT_SRC = [
    ('UMB', 'csv;', 'https://dati.regione.umbria.it/dataset/aed77732-8c61-4c0c-9cde-0eecd465e211/resource/609b6986-4cf1-4833-bec2-31eefbb2bb44/download/vinidocgdocigtumbriatabellaumbria.csv', 'Vini DOCG/DOC/IGT', 'Regione Umbria (CC BY 4.0)'),
    ('UMB', 'csv;', 'https://dati.regione.umbria.it/dataset/772bd8e6-a1a2-4474-9214-4d3b49ba40eb/resource/636438e0-d59e-4374-ac4e-5f25381cebed/download/dopigpumbria.csv', 'Denominazione', 'Regione Umbria (CC BY 4.0)'),
    ('PUG', 'csv;', 'https://dati.puglia.it/ckan/dataset/44eef2dc-55f5-4b4d-92f0-bec6c59c4570/resource/90db6c2f-427e-4007-ae36-a6e916860c49/download/dataset-_2025_prodotti-vitivinicoli.csv', 'DENOMINAZIONE', 'Regione Puglia (CC BY 4.0)'),
    ('TAA', 'csv,', 'https://dati.trentino.it/dataset/22eea137-9fc3-4222-a716-bac22cc2039a/resource/fe507a10-4c49-4b18-8bf6-6705198cfd42/download/prodottiprotetti.csv', 'Nome', 'Provincia autonoma di Trento (CC0)'),
    ('TAA', 'wfs', 'https://geoservices6.civis.bz.it/geoserver/p_bz-Agriculture/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=p_bz-Agriculture:DOCAndIGTZones&outputFormat=application/json', 'NAME_IT,NAME_DE', 'Provincia autonoma di Bolzano (CC0)'),
    ('LOM', 'csv,', 'https://www.dati.lombardia.it/api/views/gp6s-ezv4/rows.csv?accessType=DOWNLOAD', 'DENOMINAZIONE', 'Regione Lombardia (CC0)'),
    ('TOS', 'dbfzip', 'https://www502.regione.toscana.it/geoscopio/download/tematici/zone_prod_vini/zone_prod_vini.zip', 'NOM_ZON,NOM_SZO', 'Regione Toscana (CC BY 4.0)'),
]
IT_PRE = re.compile(r'^(docg|doc|igt|igp|dop|stg)\s+')
def it_variants(name):
    n = IT_PRE.sub('', IT_PRE.sub('', norm(name))); out = {n}
    for sep in (' e ', ' o ', ' oder ', ' ed '):
        if sep in n:
            for q in n.split(sep):
                q = IT_PRE.sub('', q.strip())
                if len(q) > 3: out.add(q)
    return out
def dbf_rows(b, enc='utf-8'):
    import struct
    n, hl, rl = struct.unpack('<xxxxIHH', b[:12]); fields = []; i = 32
    while b[i] != 0x0D:
        fields.append((b[i:i + 11].split(b'\0')[0].decode('ascii'), b[i + 16])); i += 32
    out = []
    for r in range(n):
        o = hl + r * rl + 1; row = {}
        for nm, ln in fields: row[nm] = b[o:o + ln].decode(enc, 'replace').strip(); o += ln
        out.append(row)
    return out
def it_regions():
    import zipfile
    idx = {}; used = []
    for reg, kind, url, cols, label in IT_SRC:
        try:
            b = fetch(url); names = []
            if kind.startswith('csv'):
                for r in csv.DictReader(io.StringIO(text(b)), delimiter=kind[3]):
                    v = (r.get(cols) or '').strip()
                    if v: names.append(v)
            elif kind == 'wfs':
                for f in json.loads(b).get('features', []):
                    for c in cols.split(','): names.append(str(f['properties'].get(c) or ''))
            elif kind == 'dbfzip':
                z = zipfile.ZipFile(io.BytesIO(b))
                for nm in z.namelist():
                    if nm.lower().endswith('.dbf') and ('nom_zon' in nm.lower() or nm.lower().startswith('sz_')):
                        for r in dbf_rows(z.read(nm)):
                            for c in cols.split(','):
                                if r.get(c): names.append(r[c])
            for n in names:
                for v in it_variants(n): idx.setdefault(v, set()).add(reg)
            used.append(label); log('Italia', reg, len(names), 'nombres de', label)
        except Exception as e: log('Italia: fuente no disponible', label, repr(e)[:160])
    return idx, sorted(set(used))
def main():
    rows = load(sys.argv[1:])
    if not isinstance(rows, list) or len(rows) < 2000: log('respuesta inesperada', type(rows).__name__, len(rows) if hasattr(rows, '__len__') else ''); return 1
    out = {}
    for x in rows:
        if x.get('status') != 'registered' or x.get('removedFlag'): continue
        kind = 'wine' if x.get('productType') == 'WINE' else 'cheese' if x.get('productType') == 'FOOD' and '0406' in cn(x) else None
        if not kind: continue
        names = [n for n in (x.get('protectedNames') or []) if n]
        if not names: continue
        y = str(x.get('euProtectionDate') or '')[:4]
        e = {'n': names, 't': x.get('giType'), 'y': int(y) if y.isdigit() else None, 'f': x.get('fileNumber'), 'id': x.get('giIdentifier'), 'u': legal_uri(x)}
        if x.get('transcriptions'): e['tr'] = [t for t in x['transcriptions'] if t]
        for c in (x.get('countries') or []):
            c = CC.get(c, c)
            out.setdefault(c, {'wine': [], 'cheese': []})[kind].append(e)
    if sum(len(v['wine']) + len(v['cheese']) for v in out.values()) < 1500: log('demasiado pocas entradas; no se escribe'); return 1
    if 'FR' in out:
        try:
            find = fr_regions(sys.argv[1:]); hit = miss = 0; nomatch = []
            for k in ('wine', 'cheese'):
                for e in out['FR'][k]:
                    r = find(e['n'] + (e.get('tr') or []))
                    if r: e['r'] = r; hit += 1
                    else: miss += 1; nomatch.append(e['n'][0])
            log('Francia: region asignada a', hit, 'denominaciones; sin region', miss, '(%s)' % ', '.join(nomatch[:40]))
        except Exception as e: log('Francia sin regiones (INAO no disponible):', repr(e)[:200])
    # Dinamarca: la zona de cada vino sale del pliego de condiciones (Fodevarestyrelsen) y se asigna a unidades NUTS 3; los quesos no tienen zona
    DK_NUTS3 = {'Bornholm': ['DK014'], 'Dons': ['DK032'], 'Fyn': ['DK031'], 'Jylland': ['DK032', 'DK041', 'DK042', 'DK050'], 'Sjælland': ['DK011', 'DK012', 'DK013', 'DK021', 'DK022']}
    for e in (out.get('DK') or {}).get('wine', []):
        if e['n'][0] in DK_NUTS3: e['r'] = DK_NUTS3[e['n'][0]]
    it_used = []
    if 'IT' in out and '--no-it' not in sys.argv:
        idx, it_used = it_regions(); hit = 0
        for k in ('wine', 'cheese'):
            for e in out['IT'][k]:
                rs = set()
                for n in e['n'] + (e.get('tr') or []):
                    for v in it_variants(n): rs |= idx.get(v, set())
                if rs: e['r'] = sorted(rs); hit += 1
        log('Italia: region asignada a', hit, 'de', len(out['IT']['wine']) + len(out['IT']['cheese']), 'denominaciones')
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    src = {'name': 'Comisión Europea, eAmbrosia (registro de indicaciones geográficas de la UE)', 'url': WEB, 'api': API, 'license': 'CC BY 4.0 (aviso legal de los sitios de la Comisión Europea); © Unión Europea'}
    d = ROOT / 'data' / 'gi'; d.mkdir(parents=True, exist_ok=True)
    idx = {}
    for c, v in sorted(out.items()):
        for k in v: v[k].sort(key=lambda e: e['n'][0].lower())
        doc = {'schemaVersion': 1, 'generatedAt': now, 'country': c, 'source': src, 'wine': v['wine'], 'cheese': v['cheese']}
        if c == 'IT' and it_used: doc['regionSource'] = {'name': 'Listados abiertos de las regiones: ' + ', '.join(it_used), 'url': 'https://www.dati.gov.it/', 'license': 'CC BY 4.0 / CC0 según la región', 'partial': True}
        if c == 'DK': doc['regionSource'] = {'name': 'Pliegos de condiciones de cada denominación (Fødevarestyrelsen): zona leída en cada pliego y asignada por Dehesa Index a las unidades NUTS 3 (Eurostat/GISCO). Los quesos (Danablu, Danbo…) no tienen zona en el pliego', 'url': 'https://foedevarestyrelsen.dk/', 'license': 'Asignación propia a partir de textos de normas públicas', 'map': 'nuts3'}
        if c == 'FR': doc['regionSource'] = {'name': 'INAO, aires géographiques des AOC/AOP et des IGP/IG (data.gouv.fr)', 'url': 'https://www.data.gouv.fr/datasets/aires-geographiques-des-aoc-aop', 'license': 'Licence Ouverte / Open Licence 2.0 (Etalab)'}
        (d / ('%s.json' % c)).write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        idx[c] = {'wine': len(v['wine']), 'cheese': len(v['cheese']),
                  'pdo': sum(1 for k in v for e in v[k] if e['t'] == 'PDO'), 'pgi': sum(1 for k in v for e in v[k] if e['t'] == 'PGI')}
    (d / 'index.json').write_text(json.dumps({'schemaVersion': 1, 'generatedAt': now, 'source': src, 'countries': idx}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    log('paises', len(idx), 'vinos', sum(v['wine'] for v in idx.values()), 'quesos', sum(v['cheese'] for v in idx.values()))
    (ROOT / 'data' / 'gi-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
    return 0
if __name__ == '__main__': sys.exit(main())
