#!/usr/bin/env python3
"""data/watch-index.json: indice compacto de todas las series (ultimo dato y cambio) para evaluar la lista de seguimiento en el navegador sin cargar los ficheros grandes.
Formato: {"schemaVersion":1,"generatedAt":..., "series":{"ES/id":[label,unit,freq,group,latestPeriod,latest,changePct,null,iSource]  (la posicion 7 la usan los precios locales para la base; la 8 es el indice en `sources`), "P/trigo/eu":[...]}}"""
import datetime, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_index import ROOT, load_all
def main():
    series, present = load_all(lambda p: (ROOT / p).read_text() if (ROOT / p).exists() else None, strict=True)
    srcs = sorted({v['s'] for v in series.values() if v.get('s')})
    # Dehesa Index propio (UE, EE. UU., Canada): se puede seguir y poner avisos igual que cualquier serie. Sin fuente externa: es un indice compuesto nuestro.
    DI = {'eu': ('dehesa-index.json', 'UE / EU'), 'us': ('dehesa-index-us.json', 'EE. UU. / US'), 'ca': ('dehesa-index-ca.json', 'Canadá / Canada')}
    own = {}
    for r, (fn, nm) in DI.items():
        f = ROOT / 'data' / fn
        if not f.exists(): continue
        d = json.loads(f.read_text())
        if isinstance(d.get('value'), (int, float)) and d.get('lastPeriod'): own['DI/' + r] = ['Dehesa Index · ' + nm, 'index, base 100 = ' + d['base']['period'], 'monthly', 'index', d['lastPeriod'], d['value'], d.get('changeMoMPct'), None, None]
    out = {k: [v['l'][:90], v['u'], v['f'], v['g'], v['p'], v['v'], v['c'], None, srcs.index(v['s']) if v.get('s') in srcs else None] for k, v in sorted(series.items()) if v['p'] is not None and v['v'] is not None}
    out.update(own); out = dict(sorted(out.items()))
    path = ROOT / 'data' / 'watch-index.json'
    new = json.dumps({'schemaVersion': 1, 'sources': srcs, 'series': out}, ensure_ascii=False, separators=(',', ':'))
    try:
        old = json.loads(path.read_text()); old.pop('generatedAt', None)
        if json.dumps(old, ensure_ascii=False, separators=(',', ':')) == new:
            print('sin cambios'); return
    except Exception: pass
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'sources': srcs, 'series': out}
    path.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
    print('series', len(out), 'ficheros', len(present))
main()
