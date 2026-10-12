#!/usr/bin/env python3
"""Denominaciones de origen de vinos y quesos por pais (registro eAmbrosia de la Comision Europea) -> data/gi/<CC>.json y data/gi/index.json
Fuente: API publica https://webgate.ec.europa.eu/eambrosia-api/api/v1/geographical-indications (lista completa en una llamada, sin clave).
Licencia: aviso legal de los sitios de la Comision Europea, contenido de la UE bajo CC BY 4.0 salvo indicacion en contra (se cita «© Unión Europea, eAmbrosia»).
Se publican solo las indicaciones REGISTRADAS y vigentes (status=registered, removedFlag=false):
  vinos  = productType WINE
  quesos = productType FOOD con codigo de la Nomenclatura Combinada 0406 (quesos y requesón)
Campos: nombre(s) protegido(s), DOP/IGP, año de proteccion en la UE, expediente y enlace al texto legal. NO se publican los contactos
de los consejos reguladores (emails, telefonos, direcciones) aunque la API los traiga. La API no da la region: solo el pais.
Codigos de pais: los de Dehesa Index (GR -> EL, GB -> UK). Uso: python3 scripts/update-eambrosia.py [--from fichero.json]"""
import datetime, gzip, json, sys, urllib.request
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
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    src = {'name': 'Comisión Europea, eAmbrosia (registro de indicaciones geográficas de la UE)', 'url': WEB, 'api': API, 'license': 'CC BY 4.0 (aviso legal de los sitios de la Comisión Europea); © Unión Europea'}
    d = ROOT / 'data' / 'gi'; d.mkdir(parents=True, exist_ok=True)
    idx = {}
    for c, v in sorted(out.items()):
        for k in v: v[k].sort(key=lambda e: e['n'][0].lower())
        doc = {'schemaVersion': 1, 'generatedAt': now, 'country': c, 'source': src, 'wine': v['wine'], 'cheese': v['cheese']}
        (d / ('%s.json' % c)).write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        idx[c] = {'wine': len(v['wine']), 'cheese': len(v['cheese']),
                  'pdo': sum(1 for k in v for e in v[k] if e['t'] == 'PDO'), 'pgi': sum(1 for k in v for e in v[k] if e['t'] == 'PGI')}
    (d / 'index.json').write_text(json.dumps({'schemaVersion': 1, 'generatedAt': now, 'source': src, 'countries': idx}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    log('paises', len(idx), 'vinos', sum(v['wine'] for v in idx.values()), 'quesos', sum(v['cheese'] for v in idx.values()))
    (ROOT / 'data' / 'gi-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
    return 0
if __name__ == '__main__': sys.exit(main())
