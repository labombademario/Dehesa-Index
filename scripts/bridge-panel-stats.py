#!/usr/bin/env python3
"""Lleva al panel de precios (js/data.js + data/snapshots/<hoy>.json) series oficiales que YA estan descargadas en ficheros *-stats.json,
sin volver a la red. Asi un precio que tenemos no se queda fuera del panel solo porque lo descarga otro pipeline.

Hoy: azucar de EE. UU. = USDA ERS, Sugar and Sweeteners Yearbook, tabla 5, azucar refinado de remolacha, Medio Oeste, a granel
(data/us-ers-stats.json, serie us-ers-sugar-px-5-...). El ERS lo publica en centavos/libra; el panel lo guarda en USD/libra (/100).
Solo escribe si el dato es nuevo; nunca rellena huecos. Uso: python3 scripts/bridge-panel-stats.py"""
import datetime, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA_JS = ROOT / 'js' / 'data.js'
SNAP = ROOT / 'data' / 'snapshots'

BRIDGES = [
    {'product': 'azucar', 'region': 'us', 'file': 'us-ers-stats.json', 'country': 'US', 'series': 'us-ers-sugar-px-5-us-refined-beet-sugar-spot-price-mid',
     'scale': 0.01, 'unit': 'lb', 'currency': 'USD', 'kg': '0\\.453592', 'trustKey': 'azucar-azucar-us', 'sourceId': 'usda_ers',
     'methodology': 'USDA ERS, Sugar and Sweeteners Yearbook, table 5: wholesale refined beet sugar price, Midwest markets, bulk, monthly average; USD/lb (ERS publishes cents/lb). Wholesale, not retail; the EU figure is the average ex-factory white sugar price.'},
]

def series_of(b):
    d = json.loads((ROOT / 'data' / b['file']).read_text(encoding='utf-8'))
    for s in d['countries'][b['country']]['series']:
        if s['id'] == b['series']: return [(p, v) for p, v in s['points'] if isinstance(v, (int, float))]
    return None

def main():
    src = DATA_JS.read_text(encoding='utf-8'); out = src; snaps = []
    now = datetime.datetime.now(datetime.timezone.utc); stamp = now.strftime('%Y-%m-%d'); vat = now.strftime('%Y-%m-%dT%H:%M:%S.000Z')
    for b in BRIDGES:
        pts = series_of(b)
        if not pts or len(pts) < 13: print('SIN SERIE', b['series']); continue
        pts = [(p, round(v * b['scale'], 4)) for p, v in pts if re.match(r'^\d{4}-\d{2}$', p)]
        (lp, lv), (pp, pv) = pts[-1], pts[-2]
        chg = round((lv / pv - 1) * 100, 2) if pv else 0
        hist7 = ', '.join(str(v) for _, v in pts[-7:])
        re_us = re.compile(r"(nameKey: '" + b['product'] + r"'[\s\S]*?us: \{ price: )[\d.]+(, changePct: )-?[\d.]+(, history: \[)[^\]]+(\], currency: 'USD', kgPerUnit: " + b['kg'] + r" \})")
        if not re_us.search(out): sys.exit('bloque us de %s no encontrado en js/data.js' % b['product'])
        out = re_us.sub(lambda m: m.group(1) + str(lv) + m.group(2) + str(chg) + m.group(3) + hist7 + m.group(4), out, count=1)
        y, mo = map(int, lp.split('-')); pub = None   # el ERS actualiza la tabla a mitad del mes siguiente; no publica fecha exacta: se deja null
        tb = re.search(r"('" + b['trustKey'] + r"': \{)([\s\S]*?)(\n    \})", out)
        if not tb: sys.exit('registro Data Trust %s no encontrado' % b['trustKey'])
        body = re.sub(r"observationDate: [^,]+,\s*publicationDate: [^,]+,\s*status: '[^']*',\s*verifiedAt: [^\n]+",
                      "observationDate: '%s', publicationDate: null, status: 'verified', verifiedAt: '%s'" % (lp, vat), tb.group(2))
        body = re.sub(r"methodology: '(?:[^'\\]|\\.)*'", lambda m: "methodology: '" + b['methodology'] + "'", body)
        out = out[:tb.start(2)] + body + out[tb.end(2):]
        snaps.append({'id': 'di_%s_%s' % (b['product'], b['region']), 'product': b['product'], 'region': b['region'], 'sourceId': b['sourceId'],
                      'observationDate': lp, 'publicationDate': pub, 'status': 'verified', 'verifiedAt': vat, 'comparability': 'directional',
                      'methodology': b['methodology'], 'value': lv, 'currency': b['currency'], 'unit': b['unit'], 'frequency': 'monthly', 'changePct': chg,
                      'history': [{'year': int(p[:4]), 'period': p[5:], 'value': v} for p, v in pts]})
        print('OK %s/%s %s = %s (%+.2f %%), %d puntos' % (b['product'], b['region'], lp, lv, chg, len(pts)))
    if out == src and not snaps: return
    # solo se escribe si cambia el ultimo dato: el bloque de data.js manda (si no cambia, no se toca ni el snapshot)
    old_last = re.findall(r"'azucar-azucar-us': \{[\s\S]*?observationDate: '([^']+)'", src)
    if out == src or (old_last and snaps and old_last[0] == snaps[0]['observationDate'] and re.sub(r"verifiedAt: '[^']+'", '', out) == re.sub(r"verifiedAt: '[^']+'", '', src)):
        print('sin cambios'); return
    DATA_JS.write_text(out, encoding='utf-8')
    SNAP.mkdir(parents=True, exist_ok=True); f = SNAP / (stamp + '.json')
    doc = json.loads(f.read_text()) if f.exists() else {'schemaVersion': '1.0', 'observations': []}
    keys = {(o['product'], o['region']) for o in snaps}
    doc['observations'] = sorted([o for o in doc.get('observations', []) if (o['product'], o['region']) not in keys] + snaps, key=lambda o: o['product'] + o['region'])
    doc['generatedAt'] = vat
    f.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    print('snapshot', f.name)

main()
