#!/usr/bin/env python3
"""data/watch/<PREFIJO>.json: indice compacto (troceado por pais / P / DI) de todas las series (ultimo dato y cambio) para evaluar la lista de seguimiento en el navegador sin cargar los ficheros grandes.
Formato: {"schemaVersion":1,"generatedAt":..., "series":{"ES/id":[label,unit,freq,group,latestPeriod,latest,changePct,null,iSource]  (la posicion 7 la usan los precios locales para la base; la 8 es el indice en `sources`), "P/trigo/eu":[...]}}"""
import datetime, json, re, sys
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
    # TROCEADO por prefijo de clave (pais, P = productos, DI = Dehesa Index): data/watch/<PREFIJO>.json. El navegador solo baja los trozos de las series que sigue.
    W = ROOT / 'data' / 'watch'; W.mkdir(parents=True, exist_ok=True); shards = {}
    for k, v in out.items(): shards.setdefault(k.split('/', 1)[0], {})[k] = v
    keep = set(); nchg = 0
    for pre, ser in sorted(shards.items()):
        if not re.fullmatch(r'[A-Z]{1,3}', pre): raise SystemExit('prefijo de clave no apto para nombre de fichero: %r' % pre)
        used = sorted({srcs[v[8]] for v in ser.values() if isinstance(v[8], int)})
        ser = {k: v[:8] + [used.index(srcs[v[8]]) if isinstance(v[8], int) else None] for k, v in ser.items()}   # indice de fuente local al trozo
        path = W / (pre + '.json'); keep.add(path.name)
        body = {'schemaVersion': 2, 'prefix': pre, 'sources': used, 'series': ser}
        try: old = json.loads(path.read_text()); og = old.pop('generatedAt', None); same = json.dumps(old, ensure_ascii=False, separators=(',', ':')) == json.dumps(body, ensure_ascii=False, separators=(',', ':'))
        except Exception: og = None; same = False
        if same and og: continue
        body = {'schemaVersion': 2, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'prefix': pre, 'sources': used, 'series': ser}
        path.write_text(json.dumps(body, ensure_ascii=False, separators=(',', ':'))); nchg += 1
    ix = W / 'index.json'; keep.add(ix.name); ibody = json.dumps({'schemaVersion': 1, 'doc': 'Trozos de data/watch/: un fichero por prefijo de clave (pais, P = productos, DI = Dehesa Index) con su numero de series.', 'prefixes': sorted(shards), 'n': {p: len(v) for p, v in sorted(shards.items())}}, ensure_ascii=False, separators=(',', ':'))
    if not ix.exists() or ix.read_text() != ibody: ix.write_text(ibody); nchg += 1
    for f in W.glob('*.json'):
        if f.name not in keep: f.unlink(); nchg += 1
    legacy = ROOT / 'data' / 'watch-index.json'   # el indice unico anterior: sustituido por los trozos
    if legacy.exists(): legacy.unlink(); nchg += 1
    print('series', len(out), 'trozos', len(shards), 'cambiados', nchg, 'ficheros', len(present))
main()
