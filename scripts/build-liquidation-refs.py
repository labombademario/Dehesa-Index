#!/usr/bin/env python3
"""Referencias para justificar la liquidacion de una cooperativa -> data/views/liq-refs/<PAIS>.json + data/views/liq-refs/index.json

Lista, por pais, las cotizaciones semanales del Agri-food Data Portal de la Comision Europea (data/eu/<familia>.json) con dato
desde 2024: producto, fase comercial, mercado o lonja, unidad, primer y ultimo dato, y el fichero data/eu/<familia>/<serie>.json
donde estan los puntos. Las etiquetas del portal (en ingles) se traducen con el diccionario de js/europa.js; lo que no esta en
el diccionario se muestra tal cual. No copia valores: la pagina liquidacion.html lee los puntos directamente. Uso: python3 scripts/build-liquidation-refs.py"""
import datetime, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/views/liq-refs'
FAMILIES = ['cereales', 'oleaginosas', 'aceite', 'arroz', 'leche', 'cerdo', 'vacuno', 'ovino', 'huevos', 'pollo']
MIN_LAST = '2024-01-01'
EPOCH = datetime.date(2000, 1, 1)

def J(p): return json.loads(Path(p).read_text(encoding='utf-8'))

def europa_dict():
    """Lee W y FAMILY_NAME de js/europa.js: 'English': ['es', 'en', 'fr', 'it']."""
    src = (ROOT / 'js/europa.js').read_text(encoding='utf-8')
    out = {}
    s = r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\""
    for m in re.finditer(r"(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")\s*:\s*\[([^\]]*)\]", src):
        key = m.group(1) if m.group(1) is not None else m.group(2)
        vals = [a if a is not None and a != '' or b is None else b for a, b in re.findall(s, m.group(3))]
        vals = [(a if a else b).replace("\\'", "'") for a, b in re.findall(s, m.group(3))]
        if len(vals) == 4: out[key] = vals
    return out

def main():
    W = europa_dict()
    tr = lambda txt: dict(zip(('es', 'en', 'fr', 'it'), W[txt])) if txt in W else {'es': txt, 'en': txt, 'fr': txt, 'it': txt}
    by_cc = {}
    for fam in FAMILIES:
        p = ROOT / ('data/eu/%s.json' % fam)
        if not p.exists(): continue
        d = J(p)
        fam_name = tr(fam) if fam in W else None
        for s in d['series']:
            parts = s.get('parts') or [s['id']]
            prod = tr(parts[0]); stage = tr(parts[1]) if len(parts) > 1 else None
            for r in s['regions']:
                last = (r.get('last') or [None])[0]
                if not last or last < MIN_LAST or r.get('n', 0) < 8: continue
                cc = r['c']
                if cc in ('EU',): continue
                m = r.get('m')
                by_cc.setdefault(cc, []).append({'fam': fam, 'famName': fam_name, 'id': s['id'], 'file': 'data/eu/%s/%s.json' % (fam, s['id']),
                                                 'product': prod, 'stage': stage, 'market': tr(m) if m else None, 'mRaw': m,
                                                 'unit': s.get('unit'), 'freq': s.get('freq'), 'first': r.get('first'), 'last': last, 'n': r.get('n')})
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob('*.json'): f.unlink()
    idx = []
    for cc, rows in sorted(by_cc.items()):
        rows.sort(key=lambda x: (FAMILIES.index(x['fam']), x['product']['es'], (x['stage'] or {}).get('es', ''), (x['market'] or {}).get('es', '')))
        (OUT / ('%s.json' % cc)).write_text(json.dumps({'schemaVersion': 1, 'country': cc, 'source': 'eu_agrifood', 'refs': rows}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
        idx.append({'c': cc, 'refs': len(rows), 'markets': len({x['mRaw'] for x in rows if x['mRaw']})})
    gen = J(ROOT / 'data/eu/index.json').get('generatedAt')
    (OUT / 'index.json').write_text(json.dumps({'schemaVersion': 1, 'generatedAt': gen, 'epoch': EPOCH.isoformat(), 'countries': idx}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    es = next((x for x in idx if x['c'] == 'ES'), None)
    print('Referencias de liquidacion: %d paises; ES %s' % (len(idx), es))

main()
