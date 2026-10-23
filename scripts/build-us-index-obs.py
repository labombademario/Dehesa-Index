#!/usr/bin/env python3
"""Indices de EE. UU. para las relaciones insumos -> precios percibidos.
Fuentes: USDA NASS (indices de precios pagados) y BLS PPI (precios de productor agrario).
Lee data/us-stats.json y data/us-ppi.json (ya descargados por sus flujos) y escribe observaciones
INDEX en data/snapshots/<hoy>.json. No inventa nada: si falta una serie, no se escribe."""
import json, re, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SNAP = ROOT / 'data' / 'snapshots'
NASS = {
 'us_fertilizer_input_index': ('us-nass-fertilizer-totals-incl-lime-soil-conditioners-prices-paid-index-index-2011-100', 'fertilizantes (totales, incluida cal y enmiendas)'),
 'us_energy_input_index': ('us-nass-fuels-prices-paid-index-index-2011-100', 'combustibles'),
}
PPI = {
 'us_milk_output_index': ('WPU016', 'leche cruda'),
 'us_cereals_output_index': ('WPU012', 'cereales (grains)'),
}
def mk(pid, src, unit, pts, pub, meth):
    pts = sorted(pts)
    if len(pts) < 24: raise SystemExit('serie corta %s: %d' % (pid, len(pts)))
    d, v = pts[-1]
    return {'id': 'di_' + pid, 'product': pid, 'region': 'us', 'sourceId': src, 'observationDate': d, 'publicationDate': pub,
            'value': round(v, 3), 'currency': 'INDEX', 'unit': unit, 'frequency': 'monthly', 'status': 'verified',
            'verifiedAt': datetime.datetime.utcnow().isoformat() + 'Z', 'comparability': 'directional', 'methodology': meth,
            'changePct': round((v / pts[-2][1] - 1) * 100, 4),
            'history': [{'period': x[5:], 'year': int(x[:4]), 'value': round(y, 3)} for x, y in pts]}
def main():
    obs = []
    st = json.loads((ROOT / 'data' / 'us-stats.json').read_text())
    ser = {s['id']: s for s in st['countries']['US']['series']}
    gen = str(st.get('generatedAt') or '')[:10]
    for pid, (sid, label) in NASS.items():
        s = ser.get(sid)
        if not s: print('sin serie NASS', sid); continue
        pub = gen if re.match(r'^\d{4}-\d{2}-\d{2}$', gen) else datetime.date.today().isoformat()
        obs.append(mk(pid, 'usda_nass', 'index_2011_100', [(a, b) for a, b in s['points']], pub,
            'USDA NASS (Agricultural Prices): indice de precios pagados por los agricultores de EE. UU. (%s), base 2011=100. Es un indice de precios, no un precio en dolares.' % label))
    pp = json.loads((ROOT / 'data' / 'us-ppi.json').read_text())
    pub = str(pp.get('generatedAt') or '')[:10]
    for pid, (code, label) in PPI.items():
        hit = [v for k, v in pp['series'].items() if k.endswith('[%s]' % code)]
        if not hit: print('sin serie PPI', code); continue
        obs.append(mk(pid, 'bls', 'index_1982_100', [(a, b) for a, b in hit[0]['n']], pub,
            'BLS Producer Price Index (%s, serie %s), base 1982=100, sin ajuste estacional. Es un indice de precios de productor, no un precio en dolares.' % (label, code)))
    if len(obs) != 4: raise SystemExit('esperaba 4 indices, hay %d: no se escribe' % len(obs))
    SNAP.mkdir(parents=True, exist_ok=True)
    f = SNAP / (datetime.date.today().isoformat() + '.json')
    doc = json.loads(f.read_text()) if f.exists() else {'schemaVersion': '1.0', 'generatedAt': datetime.datetime.utcnow().isoformat() + 'Z', 'observations': []}
    ids = {o['id'] for o in obs}
    doc['observations'] = [o for o in doc['observations'] if o.get('id') not in ids] + obs
    f.write_text(json.dumps(doc, indent=2) + '\n')
    for o in obs: print(o['product'], o['observationDate'], o['value'], o['changePct'])
if __name__ == '__main__': main()
