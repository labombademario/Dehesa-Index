#!/usr/bin/env python3
"""Finlandia (Statistics Finland, StatFin) -> data/finland-statfin-stats.json (countries.FI, extend)
Fuente: base PxWeb de Statistics Finland, API publica: https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/
Tablas: mthi/14nv (indice de precios al productor agrario, 2020=100, mensual), ttohi/14nz (indice de precios de compra de medios de produccion agraria, 2020=100, mensual),
khi/15b5 (IPC, 2025=100, mensual, grupos de alimentos) y thi/13m8 (indice de precios de productor de la industria, 2021=100, mensual: productos agrarios y alimentos).
Licencia: Statistics Finland publica sus datos bajo CC BY 4.0 («Source: Statistics Finland»); excluye datos de terceros. Limites de la API: 40 consultas/60 s y 120.000 celdas.
Cada valor es el publicado por la fuente: sin estimaciones, sin relleno y sin conversiones. Los ultimos meses pueden ser provisionales (asterisco en la fuente). Series sin datos suficientes se omiten.
Uso: python3 scripts/update-fi-statfin.py"""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_pxweb import UA, make_say, make_call, num, clean, slug, var
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'finland-statfin-stats.json'; LOG = ROOT / 'data' / 'finland-statfin-log.txt'
BASE = 'https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/'
SG = 'Statistics Finland'
log = []
say = make_say(log)
call = make_call(pause=1.8, tries=4, backoff=8, base=BASE)   # 40 consultas por 60 s
def month(t):
    m = re.match(r'^(\d{4})M(\d{2})\*?$', t.strip()); return '%s-%s' % m.groups() if m else None

OUTS = {}
def put(sid, group, label, unit, pts, note, ref, lic_note=''):
    d = {p: v for p, v in pts if p and v is not None}
    pp = sorted(d.items())
    if len(pp) < 12: say('omitida (pocos puntos):', sid, len(pp)); return
    (lp, lv), (_, pv) = pp[-1], pp[-2]
    OUTS[sid] = {'id': sid, 'group': group, 'label': label, 'unit': unit, 'frequency': 'monthly', 'latestPeriod': lp, 'latest': lv, 'changePct': round((lv / pv - 1) * 100, 2) if pv else None,
                 'points': [[k, v] for k, v in pp], 'sourceGroup': SG, 'periodNote': note,
                 'reference': {'source': 'Statistics Finland (StatFin database)', 'dataset': ref, 'licence': 'CC BY 4.0', 'original': 'https://pxdata.stat.fi/'}}

def block(path, ccode, content, tcode, select, sid_prefix, group, ref, unit, label_fn, note, sel2=None):
    """select(valor, texto) -> bool elige las clasificaciones; sel2 = [(variable, [codigos])] para variables adicionales (p. ej. serie de indice)."""
    m = call(path); cv = var(m, ccode); tv = var(m, tcode)
    pick = [(c, clean(t)) for c, t in zip(cv['values'], cv['valueTexts']) if select(c, clean(t))]
    if not pick: raise RuntimeError('%s: ninguna clasificacion elegida' % path)
    q = [{'code': ccode, 'selection': {'filter': 'item', 'values': [c for c, _ in pick]}}, {'code': 'contentscode', 'selection': {'filter': 'item', 'values': [content]}}, {'code': tcode, 'selection': {'filter': 'all', 'values': ['*']}}]
    for c, vals in (sel2 or []): q.append({'code': c, 'selection': {'filter': 'item', 'values': vals}})
    r = call(path, json.dumps({'query': q, 'response': {'format': 'json'}}).encode())
    names = [c['code'] for c in r['columns'] if c['type'] != 'c']; tt = dict(zip(tv['values'], tv['valueTexts'])); lab = dict(pick); by = {}
    for row in r['data']:
        k = dict(zip(names, row['key'])); v = num(row['values'][0]); p = month(tt.get(k[tcode], k[tcode]))
        if p and v is not None: by.setdefault(k[ccode], []).append((p, v))
    seen = {}; dup = set()
    for c, pts in by.items():
        k = label_fn(re.sub(r'^[0-9A-Za-z.x]+ ', '', lab[c]) if re.match(r'^[0-9A-Za-z.x]+ \S', lab[c]) else lab[c])
        if k in seen:
            if sorted(seen[k]) == sorted(pts): say('omitida (duplicada de otro codigo):', sid_prefix, c); by[c] = None; continue
            say('etiqueta repetida con valores distintos, se añade el codigo:', sid_prefix, c); dup.add(k)
        seen.setdefault(k, pts)
    for c, pts in by.items():
        if pts is None: continue
        put('%s-%s' % (sid_prefix, slug(c)), group, label_fn(re.sub(r'^[0-9A-Za-z.x]+ ', '', lab[c]) if re.match(r'^[0-9A-Za-z.x]+ \S', lab[c]) else lab[c]) + ('' if label_fn(re.sub(r'^[0-9A-Za-z.x]+ ', '', lab[c]) if re.match(r'^[0-9A-Za-z.x]+ \S', lab[c]) else lab[c]) not in dup else ' [%s]' % c), unit, pts, note, ref)
    say(ref, len(by), 'series')

def b_mthi():
    block('mthi/14nv.px', 'mthi_luo_000510_2_20240101', 'mthi-pisteluku20', 'timeperiod_m', lambda c, t: True, 'fi-sf-mthi', 'idx_perc', 'mthi/14nv (Index of producer prices of agricultural products, 2020=100)', 'index 2020=100',
          lambda n: 'Agricultural producer price index: %s, Finland (Statistics Finland, 2020=100)' % n.lower().replace('(including seeds)', '(incl. seeds)').replace(': other', ' - residual subgroup'),
          'Índice de precios al productor agrario (2020=100) de Statistics Finland; los últimos meses son provisionales (asterisco en la fuente).')
def b_ttohi():
    block('ttohi/14nz.px', 'ttohi_luokitus_2_20240101', 'ttohi-pisteluku20', 'timeperiod_m', lambda c, t: True, 'fi-sf-ttohi', 'idx_pag', 'ttohi/14nz (Index of purchase prices of the means of agricultural production, 2020=100)', 'index 2020=100',
          lambda n: 'Farm input purchase price index: %s, Finland (Statistics Finland, 2020=100)' % n.lower(),
          'Índice de precios de compra de los medios de producción agraria (2020=100) de Statistics Finland; mensual (Eurostat solo lo da trimestral).')
def b_khi():
    block('khi/15b5.px', 'coicop_46_20231201', 'ip_khi', 'timeperiod_m', lambda c, t: c == 'SSS' or (c.startswith('01') and len(c) <= 5), 'fi-sf-cpi', 'idx_pag', 'khi/15b5 (Consumer Price Index, 2025=100)', 'index 2025=100',
          lambda n: 'Consumer price index (COICOP): %s, Finland (Statistics Finland, 2025=100)' % ('all items' if n.strip().lower() == 'total' else re.sub(r'\s*\(ND\)$', '', n).lower()),
          'Índice de precios al consumo por grupo COICOP (base 2025=100) de Statistics Finland; los últimos meses pueden ser provisionales.')
def b_thi():
    cpa = {'01', '0111', '0113', '0141', '0146', '0147', '10', '101', '1011', '1012', '1013', '104', '1041', '105', '1051', '106', '1061', '1071', '1081', '1091', '2015'}
    block('thi/13m8.px', 'cpa_6_20180101', 'thi-pisteluku21', 'timeperiod_m', lambda c, t: c in cpa, 'fi-sf-thi', 'idx_perc', 'thi/13m8 (Producer price indices, 2021=100)', 'index 2021=100',
          lambda n: 'Producer price index (manufactured products): %s, Finland (Statistics Finland, 2021=100)' % n.lower(),
          'Índice de precios de productor de productos manufacturados (2021=100) de Statistics Finland; serie «producer price index for manufactured products».', sel2=[('thi_hinkasind_1_20180101', ['1'])])

for fn in (b_mthi, b_ttohi, b_khi, b_thi):
    try: fn()
    except Exception as e: say('FALLO %s: %s' % (fn.__name__, str(e)[:240]))
def _mi(p): return int(p[:4]) * 12 + int(p[5:7]) - 1
if OUTS:
    top = max(_mi(v['latestPeriod']) for v in OUTS.values())
    for k in sorted(OUTS):   # series que la fuente dejo de publicar: mas de 6 meses por detras de la ultima de la tabla (la reclasificacion COICOP/producto de 2026 retiro varios indices)
        if _mi(OUTS[k]['latestPeriod']) < top - 6: say('omitida (descontinuada): %s hasta %s' % (k, OUTS[k]['latestPeriod'])); del OUTS[k]
series = [OUTS[k] for k in sorted(OUTS)]
if len(series) < 60: sys.exit('demasiado pocas series (%d); no se escribe nada' % len(series))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {'FI': {'name': 'Finland', 'extend': True, 'source': {'name': 'Statistics Finland (StatFin database)', 'url': 'https://pxdata.stat.fi/', 'license': 'CC BY 4.0; credit: Statistics Finland'}, 'series': series}}}
if OUT.exists():
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = json.loads(json.dumps(doc)); n.pop('generatedAt', None)
        if o == n: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
LOG.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('OK %d series, %d puntos' % (len(series), sum(len(s['points']) for s in series)))
