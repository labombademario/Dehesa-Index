#!/usr/bin/env python3
"""data/watch-index.json: indice compacto de todas las series (ultimo dato y cambio) para evaluar la lista de seguimiento en el navegador sin cargar los ficheros grandes.
Formato: {"schemaVersion":1,"generatedAt":..., "series":{"ES/id":[label,unit,freq,group,latestPeriod,latest,changePct], "P/trigo/eu":[...]}}"""
import datetime, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_index import ROOT, load_all
def main():
    series, present = load_all(lambda p: (ROOT / p).read_text() if (ROOT / p).exists() else None)
    out = {k: [v['l'][:90], v['u'], v['f'], v['g'], v['p'], v['v'], v['c']] for k, v in sorted(series.items()) if v['p'] is not None and v['v'] is not None}
    path = ROOT / 'data' / 'watch-index.json'
    new = json.dumps({'schemaVersion': 1, 'series': out}, ensure_ascii=False, separators=(',', ':'))
    try:
        old = json.loads(path.read_text()); old.pop('generatedAt', None)
        if json.dumps(old, ensure_ascii=False, separators=(',', ':')) == new:
            print('sin cambios'); return
    except Exception: pass
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'series': out}
    path.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
    print('series', len(out), 'ficheros', len(present))
main()
