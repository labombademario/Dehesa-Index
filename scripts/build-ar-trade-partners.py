#!/usr/bin/env python3
"""data/ar-trade-partners-stats.json: principales destinos de las exportaciones de Argentina (para el perfil de pais), derivado de
data/ar-exports-province-destination.json (datos.gob.ar, CC BY 4.0; fuente de actualizacion MANUAL). No descarga nada.
Honestidad: cifra = suma de los 10 destinos principales de cada provincia (un MINIMO; no hay total nacional por pais), todas las mercancias,
solo exportaciones (no hay importaciones). Solo se publican los 5 primeros. Anual, USD millones. Uso: python3 scripts/build-ar-trade-partners.py"""
import json, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
NAMES = {'brasil': ('br', 'Brazil'), 'estados_unidos': ('us', 'United States'), 'chile': ('cl', 'Chile'), 'china': ('cn', 'China'), 'india': ('in', 'India'),
         'paises_bajos': ('nl', 'Netherlands'), 'uruguay': ('uy', 'Uruguay'), 'espania': ('es', 'Spain'), 'paraguay': ('py', 'Paraguay'), 'mexico': ('mx', 'Mexico'),
         'bolivia': ('bo', 'Bolivia'), 'alemania': ('de', 'Germany'), 'italia': ('it', 'Italy'), 'peru': ('pe', 'Peru'), 'vietnam': ('vn', 'Vietnam')}
TOP, YEARS = 5, 10
def main():
    p = ROOT / 'data' / 'ar-exports-province-destination.json'
    if not p.exists(): print('sin fuente'); return
    d = json.loads(p.read_text(encoding='utf-8')); years = d['years'][-YEARS:]; series = []
    ranked = sorted(d['countries'], key=lambda k: -d['countries'][k][-1])[:TOP]
    for k in ranked:
        if k not in NAMES: raise SystemExit('pais sin nombre en NAMES: ' + k)
        v = [round(x, 3) for x in d['countries'][k][-YEARS:]]
        series.append({'id': 'ar-tp-exp-' + NAMES[k][0], 'group': 'partners', 'label': 'Exports to %s: all goods, at least (sum of provincial top-10 destinations, annual)' % NAMES[k][1],
                       'unit': 'USD million (value)', 'frequency': 'annual', 'latestPeriod': years[-1], 'latest': v[-1],
                       'changePct': round((v[-1] / v[-2] - 1) * 100, 2) if v[-2] else None, 'points': [[y, x] for y, x in zip(years, v)], 'sourceGroup': 'INDEC'})
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'AR': {'name': 'Argentina', 'extend': True, 'source': {k: d['source'][k] for k in ('name', 'url', 'license')}, 'series': series}}}
    out = ROOT / 'data' / 'ar-trade-partners-stats.json'
    if out.exists():
        try:
            o2 = json.loads(out.read_text(encoding='utf-8')); o2.pop('generatedAt', None); n2 = dict(doc); n2.pop('generatedAt')
            if o2 == n2: print('sin cambios'); return
        except Exception: pass
    out.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('AR: %d series de destinos, ultimo ano %s' % (len(series), years[-1]))
main()
