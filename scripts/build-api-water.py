#!/usr/bin/env python3
"""API de agua (v1, estatica): rios y sequia -> data/api/v1/water/

  water/index.json                 catalogo: paises con rios, fuente, licencia, atribucion y enlaces
  water/rivers/<cc>.json           estaciones de un pais (DE NL FR BE CA US): ultimo nivel y caudal, estado, percentil frente al historico y 30 dias de puntos
  water/drought/eu.json            Indicador Combinado de Sequia del EDO por pais (ultimo periodo y los 12 anteriores)

Solo fuentes con uso comercial y redistribucion permitidos en data/license-registry.json (si una pasa a no apta, sus ficheros desaparecen).
Nada se estima ni se rellena. Los percentiles de NL, FR, CA y BE salen de scripts/update-rivers.py; los de EE. UU. de scripts/update-us-rivers (data/us-markets/rivers.json);
Alemania no lleva percentil: lleva el estado frente a las cotas oficiales del WSV (MW, MNW, GlW).
Uso: python3 scripts/build-api-water.py [--check]   (--check valida la forma y la licencia de lo publicado, no la fecha: los rios se actualizan varias veces al dia)"""
import json, sys
from datetime import date, timedelta
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'api' / 'v1' / 'water'
BASE = 'https://dehesaindex.com'
KEEP_DAYS = 30
COUNTRIES = {  # cc -> (fichero, id de fuente en license-registry)
    'DE': ('data/de-rivers.json', 'pegelonline'), 'NL': ('data/rivers-nl.json', 'rijkswaterstaat'), 'FR': ('data/rivers-fr.json', 'hubeau_hydrometrie'),
    'BE': ('data/rivers-be.json', 'vmm_waterinfo'), 'PL': ('data/rivers-pl.json', 'imgw_pib'), 'SE': ('data/rivers-se.json', 'smhi'), 'CA': ('data/rivers-ca.json', 'eccc_hydrometric'), 'US': ('data/us-markets/rivers.json', 'usgs_water')}
STATE = {'low': 'low', 'normal': 'normal', 'high': 'high'}


def jdump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')) + '\n'
def load(rel): return json.loads((ROOT / rel).read_text(encoding='utf-8'))


def licence(reg, sid):
    s = reg['sources'][sid]
    ok = s.get('commercialUse') == 'yes' and s.get('redistribution') == 'yes'
    return ok, {'id': sid, 'name': s['name'], 'url': s.get('url'), 'license': s.get('licenseName'), 'licenseUrl': s.get('licenseUrl'), 'attributionRequired': bool(s.get('attributionRequired')), 'attribution': s.get('attributionText')}


def change7(pts, col):
    """Variacion % del ultimo valor frente al de 7 dias antes (solo si hay dato justo ese dia)."""
    vals = {p[0]: p[col] for p in pts if len(p) > col and p[col] is not None}
    if not vals: return None
    d1 = max(vals); d0 = (date.fromisoformat(d1) - timedelta(days=7)).isoformat()
    if d0 not in vals or not vals[d0]: return None
    return round((vals[d1] / vals[d0] - 1) * 100, 1)


def tail(pts):
    if not pts: return []
    last = date.fromisoformat(max(p[0] for p in pts)); lo = (last - timedelta(days=KEEP_DAYS - 1)).isoformat()
    return [p for p in pts if p[0] >= lo]


def station(cc, s):
    if cc == 'US':
        pts = [[p[0], None, round(p[1] * 0.0283168, 2)] for p in s.get('points', [])]   # ft3/s -> m3/s
        q = {'value': round(s['lastValue'] * 0.0283168, 2), 'unit': 'm3/s', 'time': s.get('last')} if s.get('lastValue') is not None else None
        pct = s.get('pctMonth')
        ref = {'basis': 'Q', 'note': 'percentile of the 7-day mean against the same month, %s-%s' % tuple(s.get('histYears', ['', ''])), 'years': s.get('histYears'), 'n': s.get('nYears')}
        return {'id': s['id'], 'river': s['river'], 'name': s.get('reach'), 'level': None, 'discharge': q, 'state': None if pct is None else ('low' if pct < 25 else 'high' if pct > 75 else 'normal'),
                'percentile': pct, 'reference': ref, 'change7dPct': change7(pts, 2), 'points': tail(pts)}
    w, q = s.get('w'), s.get('q')
    ref = s.get('ref') or None
    pct = ref.get('pct') if isinstance(ref, dict) else None
    out = {'id': s['id'], 'river': s['river'], 'name': s['name'], 'lat': s.get('lat'), 'lon': s.get('lon'),
           'level': {'value': w['value'], 'unit': w.get('unit', 'cm'), 'time': w.get('time')} if w and w.get('value') is not None else None,
           'discharge': {'value': q['value'], 'unit': q.get('unit', 'm3/s'), 'time': q.get('time')} if q and q.get('value') is not None else None,
           'state': STATE.get((w or {}).get('state') or s.get('state')), 'percentile': pct, 'reference': ref}
    pts = s.get('points', [])
    out['change7dPct'] = change7(pts, 2) if any(len(p) > 2 and p[2] is not None for p in pts) else change7(pts, 1)
    out['points'] = tail(pts)
    return out


def build():
    reg = load('data/license-registry.json'); files = {}; cat = []
    for cc, (rel, sid) in COUNTRIES.items():
        if not (ROOT / rel).exists(): continue
        ok, lic = licence(reg, sid)
        if not ok: continue
        d = load(rel); sts = []
        for s in d.get('stations', []):
            if cc == 'US' and 'points' not in s: continue
            if cc != 'US' and not (s.get('w') or s.get('q')): continue
            sts.append(station(cc, s))
        if not sts: continue
        fields = {'pointFields': ['date', 'levelCm', 'dischargeM3s'], 'units': {'level': 'cm', 'discharge': 'm3/s'}}
        gen = d.get('generatedAt')
        files['rivers/%s.json' % cc.lower()] = jdump({'schemaVersion': 1, 'generatedAt': gen, 'country': cc, 'source': lic, **fields, 'stations': sts})
        cat.append({'country': cc, 'stations': len(sts), 'generatedAt': gen, 'source': lic, 'url': '/data/api/v1/water/rivers/%s.json' % cc.lower(),
                    'percentile': any(x['percentile'] is not None for x in sts)})
    ok, lic = licence(reg, 'edo_cdi')
    if ok and (ROOT / 'data/eu-drought.json').exists():
        e = load('data/eu-drought.json'); per = e['periods']; n = 13
        cs = {k: {'name': v['name'], 'coveragePct': v.get('coverage'), 'v': v['v'][-n:]} for k, v in sorted(e['countries'].items()) if v.get('v')}
        files['drought/eu.json'] = jdump({'schemaVersion': 1, 'generatedAt': e.get('generatedAt'), 'source': lic, 'indicator': 'Combined Drought Indicator (CDI) v4.1', 'unit': e.get('unit'), 'classes': e['classes'],
                                          'periods': per[-n:], 'asOf': e.get('asOf'), 'countries': cs})
        cat.append({'dataset': 'drought-eu', 'countries': len(cs), 'generatedAt': e.get('generatedAt'), 'source': lic, 'url': '/data/api/v1/water/drought/eu.json'})
    gens = [c['generatedAt'] for c in cat if c.get('generatedAt')]
    files['index.json'] = jdump({'schemaVersion': 1, 'name': 'Dehesa Index Water API', 'version': 'v1', 'generatedAt': max(gens) if gens else None, 'base': BASE, 'terms': BASE + '/condiciones',
                                 'policy': 'Only sources whose licence allows commercial use and redistribution. Quote the attribution of each file when reusing. No estimates and no gap filling.', 'datasets': cat})
    return files


def check_files(files):
    bad = []
    for k, v in files.items():
        p = OUT / k
        if not p.exists(): bad.append('falta ' + k); continue
        try: cur = json.loads(p.read_text(encoding='utf-8'))
        except ValueError: bad.append('JSON roto ' + k); continue
        new = json.loads(v)
        if cur.get('schemaVersion') != 1 or not cur.get('source', cur.get('datasets')): bad.append('forma ' + k)
        if k.startswith('rivers/') and (not cur.get('stations') or any(not s.get('attribution') and not cur['source'].get('attribution') and cur['source']['attributionRequired'] for s in cur['stations'])): bad.append('estaciones/atribucion ' + k)
        if sorted(cur) != sorted(new): bad.append('campos distintos ' + k)
    extra = [str(p.relative_to(OUT)) for p in OUT.rglob('*.json') if str(p.relative_to(OUT)) not in files] if OUT.exists() else []
    return bad + ['sobra ' + x for x in extra]


def main():
    files = build()
    if '--check' in sys.argv:
        bad = check_files(files)
        if bad: print('API de agua desfasada o rota: ' + '; '.join(bad)); sys.exit(1)
        print('API de agua al dia: %d ficheros' % len(files)); return
    OUT.mkdir(parents=True, exist_ok=True)
    for k, v in files.items():
        p = OUT / k; p.parent.mkdir(parents=True, exist_ok=True)
        if not p.exists() or p.read_text(encoding='utf-8') != v: p.write_text(v, encoding='utf-8')
    for p in list(OUT.rglob('*.json')):
        if str(p.relative_to(OUT)) not in files: p.unlink()
    print('API de agua: %d ficheros (%s)' % (len(files), ', '.join(sorted(files))))


if __name__ == '__main__':
    main()
