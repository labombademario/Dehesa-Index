"""Rupturas de serie en precios anuales/trimestrales de Eurostat y oficinas nacionales (13-oct-2026, auditoría).
Algunas series cambian de unidad o de definición sin avisar: huevos de Bélgica de 12,44 a 111,04 EUR/100 unidades (2023->2024),
ovino de Dinamarca de 16,8 a 55,2 EUR/100 kg (2013->2014). Mostrar esos saltos como variaciones de precio es un error.
Regla (solo series de PRECIO de producto, no índices ni insumos): un paso entre dos datos seguidos que multiplica o divide por más de 3 es una ruptura.
- Si la última ruptura cae en los tres últimos datos no se sabe qué tramo es el bueno: la serie se aparta (doc['quarantined']).
- Si es más antigua, se conserva solo el tramo posterior (la definición vigente) y la serie lleva 'breakCut' con el periodo del corte.
Uso: from lib_breaks import clean; doc = clean(doc) antes de escribir el fichero. Idempotente."""

def _is_price(s):
    u, i = str(s.get('unit', '')), str(s.get('id', '')).lower()
    if 'input' in i or 'fert' in i or 'index' in u.lower() or 'INDEX' in u: return False
    if any(w in i for w in ('profit', 'income', 'renta', 'margin', 'subsid', 'value')): return False   # magnitudes que pueden ser negativas o cambiar de escala de verdad
    return 'EUR per' in u or 'EUR/' in u or ' per ' in u.lower() and any(c in u for c in ('EUR', 'PLN', 'HUF', 'CZK', 'SEK', 'DKK', 'RON', 'BGN'))

def _recompute(s):
    pts = s['points']
    if not pts: return
    s['latest'], s['latestPeriod'] = pts[-1][1], pts[-1][0]
    if len(pts) > 1 and pts[-2][1]: s['changePct'] = round((pts[-1][1] / pts[-2][1] - 1) * 100, 2)
    else: s.pop('changePct', None)

def clean(doc):
    q = doc.setdefault('quarantined', [])
    seen = {x.get('id') for x in q}
    for cc, c in (doc.get('countries') or {}).items():
        if not isinstance(c, dict) or not isinstance(c.get('series'), list): continue
        keep = []
        for s in c['series']:
            pts = [p for p in (s.get('points') or []) if isinstance(p, (list, tuple)) and len(p) > 1]
            if not _is_price(s) or len(pts) < 3: keep.append(s); continue
            last = -1
            for i in range(1, len(pts)):
                a, b = pts[i - 1][1], pts[i][1]
                if isinstance(a, (int, float)) and isinstance(b, (int, float)) and a > 0 and b > 0 and (b / a > 3 or a / b > 3): last = i
            if last < 0: keep.append(s); continue
            if last >= len(pts) - 3:
                if s.get('id') not in seen:
                    q.append({'country': cc, 'id': s.get('id'), 'label': s.get('label'), 'reason': 'ruptura de serie entre %s (%s) y %s (%s)' % (pts[last - 1][0], pts[last - 1][1], pts[last][0], pts[last][1])})
                continue
            s['points'] = pts[last:]; s['breakCut'] = str(pts[last][0]); _recompute(s); keep.append(s)
        c['series'] = keep
    if not q: doc.pop('quarantined', None)
    return doc

if __name__ == '__main__':
    # Limpieza de los ficheros ya publicados: python3 scripts/lib_breaks.py data/x-stats.json ...
    import json, sys
    for f in sys.argv[1:]:
        raw = open(f).read(); d = json.loads(raw); before = json.dumps(d, sort_keys=True)
        d = clean(d)
        if json.dumps(d, sort_keys=True) != before:
            open(f, 'w').write(json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ('\n' if raw.endswith('\n') else ''))
            print(f, 'apartadas:', [x['id'] for x in d.get('quarantined', [])])
