#!/usr/bin/env python3
"""EE. UU.: series SEMANALES de mercado -> data/us-weekly-stats.json (formato country-stats, entra al catalogo del pais).

Hasta ahora estos datos se publicaban en sus paginas (Precios locales, Lacteos, Cordero, Fertilizantes, Exportaciones, Etanol) pero no estaban en el
catalogo de EE. UU., asi que «La semana en cada pais» no los veia. Este script NO descarga nada: lee los ficheros ya publicados por sus actualizadores y los
convierte en series (id, unidad, frecuencia, puntos). Cada valor es el publicado por la fuente: sin estimaciones, sin relleno y sin conversiones.

Historia: cada ejecucion conserva los puntos que ya estaban en data/us-weekly-stats.json y anade los nuevos (los informes de exportaciones solo traen la campana en curso;
asi la serie sigue al cambiar de campana). Los puntos ya publicados no se reescriben salvo que la fuente los corrija (el valor nuevo manda).

Fuentes (todas dominio publico de EE. UU., licencia VERIFIED en data/license-registry.json):
  USDA AMS Market News: lacteos (National Dairy Products Sales Report), cordero (LM_XL502), fertilizantes (Illinois Production Cost Report)
  USDA AMS / FGIS: inspecciones de exportacion de grano
  USDA FAS ESR: ventas netas semanales de exportacion
  EIA: etanol (produccion y existencias semanales)
Uso: python3 scripts/build-us-weekly.py"""
import datetime, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; DATA = ROOT / 'data'; OUT = DATA / 'us-weekly-stats.json'
def jl(p): return json.loads((DATA / p).read_text(encoding='utf-8'))
def now_iso(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
NEW = {}   # id -> serie

def add(sid, group, label, unit, freq, pts, sg, note):
    """pts: [[periodo, valor]]; descarta vacios, ordena y quita periodos repetidos (manda el ultimo)."""
    d = {}
    for p, v in pts:
        if v is None or not isinstance(v, (int, float)) or isinstance(v, bool) or v != v: continue
        d[str(p)] = round(float(v), 6) if isinstance(v, float) else v
    if len(d) < 8: return
    pp = sorted(d.items())
    NEW[sid] = {'id': sid, 'group': group, 'label': label, 'unit': unit, 'frequency': freq, 'points': [[k, v] for k, v in pp], 'sourceGroup': sg, 'note': note}

AMS = 'USDA AMS Market News'
# ---- lacteos: National Dairy Products Sales Report (semanal). La leche en polvo desnatada ya esta en el catalogo (product:lacteos_leche_polvo_us).
dairy = jl('us-dairy.json')
DNAME = {'mantequilla': 'Butter', 'cheddar': 'Cheddar cheese, 40-lb block', 'suero': 'Dry whey'}
for p in dairy['products']:
    if p['id'] not in DNAME: continue
    add('us-wk-dairy-' + p['id'], 'prices', '%s: weighted average price, United States (USDA AMS, weekly)' % DNAME[p['id']], 'USD/lb', 'weekly', [[r[0], r[1]] for r in p['series']], AMS,
        'Precio medio ponderado de las ventas semanales declaradas en el National Dairy Products Sales Report; semana terminada en sabado.')
# ---- cordero: despiece estimado nacional (LM_XL502), diario
lamb = jl('us-lamb.json')
add('us-wk-lamb-carcass-cutout', 'prices_lv', 'Lamb carcass cutout, gross, United States (USDA AMS, 5-day rolling average, FOB plant)', 'USD/cwt', 'daily', [[r[0], r[1]] for r in lamb['rows']], AMS,
    'National Estimated Lamb Carcass Cutout (LM_XL502): valor bruto, media ponderada movil de 5 dias, USD por 100 libras.')
# ---- fertilizantes: informe de costes de produccion de Illinois (cada dos semanas). Solo Illinois (el informe con mas historia y todos los productos).
fert = jl('us-fertilizers.json')
FNAME = {'Anhydrous Ammonia': 'Anhydrous ammonia', 'Urea (46-0-0)': 'Urea 46-0-0', 'DAP (Diammonium Phosphate 18-46-0)': 'DAP 18-46-0', 'MAP (Monoammonium Phosphate 11-52-0)': 'MAP 11-52-0',
         'Potash (White 0-0-62)': 'Potash 0-0-62', 'Liquid Nitrogen (28-0-0)': 'UAN 28-0-0', 'Liquid Nitrogen (32-0-0)': 'UAN 32-0-0'}   # nombres sin parentesis ni comas: asi el glosario los traduce enteros
FN = {'amoniaco', 'urea', 'dap', 'map', 'potasa', 'uan'}
seen = set()
for p in fert['products']:
    for st in p['states']:
        if st['state'] != 'Illinois' or p['id'] not in FN or st['spec'] not in FNAME: continue
        k = (p['id'], st['spec'])
        if k in seen: continue
        seen.add(k)
        pts = [list(h) for h in st['hist']]
        if st.get('date') and st.get('avg') is not None: pts.append([st['date'], st['avg']])
        slug = re.sub(r'[^a-z0-9]+', '-', ('%s-%s' % (p['id'], st['spec'])).lower()).strip('-')[:40]
        add('us-wk-fert-il-' + slug, 'inputs', '%s: retail price, Illinois (USDA AMS)' % FNAME[st['spec']], 'USD/short ton', 'weekly', pts, AMS,
            'Illinois Production Cost Report: media de los precios minoristas declarados; el informe sale cada dos semanas (no cada semana).')
# ---- inspecciones de exportacion de grano (FGIS)
FG = 'USDA AMS Grain Inspection (FGIS)'
insp = jl('us-markets/inspections.json')
for k, v in insp['series'].items():
    add('us-wk-inspections-' + k.lower(), 'trade', 'Export inspections: %s, United States (USDA AMS/FGIS, weekly)' % k.capitalize(), 't', 'weekly', v, FG,
        'Toneladas métricas inspeccionadas para exportación en la semana que termina el jueves.')
# ---- ventas netas de exportacion (FAS ESR): la fuente solo trae la campana en curso; el historial se conserva de ejecuciones anteriores
ESR = 'USDA FAS Export Sales Reporting'
es = jl('export-sales.json')
ESRN = {'Wheat - HRW': 'Wheat HRW', 'Wheat - SRW': 'Wheat SRW', 'Wheat - HRS': 'Wheat HRS', 'Wheat - White': 'Wheat White', 'Wheat - Durum': 'Durum wheat',
        'Fresh, Chilled, or Frozen Muscle Cuts of Beef': 'Beef muscle cuts', 'Fresh, Chilled, or Frozen Muscle Cuts of Pork': 'Pork muscle cuts'}
for c in es['commodities']:
    add('us-wk-esr-net-sales-%s' % c['code'], 'trade', 'Export net sales: %s, United States (USDA FAS, weekly)' % ESRN.get(c['name'], c['name']), 't', 'weekly', [[w['w'], w.get('net')] for w in c.get('weekly', [])], ESR,
        'Ventas netas de la semana (nuevas ventas menos cancelaciones), toneladas métricas, de la campana de comercializacion en curso en cada fecha.')
# ---- etanol (EIA, semanal)
EIA = 'EIA'
eth = jl('us-markets/ethanol.json')['series']
EN = {'prod_NUS': ('production', 'Fuel ethanol production, United States (EIA, weekly)', 'kb/d'), 'prod_R20': ('production', 'Fuel ethanol production, Midwest (EIA, weekly)', 'kb/d'),
      'stocks_NUS': ('stocks', 'Fuel ethanol stocks, United States (EIA, weekly)', 'kbbl'), 'stocks_R20': ('stocks', 'Fuel ethanol stocks, Midwest (EIA, weekly)', 'kbbl')}
for k, (g, lab, u) in EN.items():
    if k in eth: add('us-wk-ethanol-' + k.lower(), g, lab, u, 'weekly', eth[k]['points'], EIA, 'Cifras semanales de la EIA (miles de barriles por día / miles de barriles); revisables por la fuente.')

# ---- conservar historia previa y fusionar
old = {}
if OUT.exists():
    try:
        for s in json.loads(OUT.read_text(encoding='utf-8'))['countries']['US']['series']: old[s['id']] = s
    except Exception: pass
series = []
for sid, s in NEW.items():
    pts = {p: v for p, v in old.get(sid, {}).get('points', [])}
    pts.update({p: v for p, v in s['points']})
    pp = sorted(pts.items()); last, prev = pp[-1], pp[-2] if len(pp) > 1 else None
    s['points'] = [[k, v] for k, v in pp]; s['latestPeriod'] = last[0]; s['latest'] = last[1]
    # las ventas netas son flujos que cambian de signo: un % frente a la semana anterior no significa nada
    s['changePct'] = None if sid.startswith('us-wk-esr-') else (round((last[1] - prev[1]) / abs(prev[1]) * 100, 2) if prev and prev[1] else None)
    series.append(s)
for sid, s in old.items():   # una serie que la fuente ya no trae se conserva tal cual (no se borra historia)
    if sid not in NEW: series.append(s)
if len(series) < 20: sys.exit('demasiado pocas series (%d); no se escribe nada' % len(series))
series.sort(key=lambda s: s['id'])
doc = {'schemaVersion': 1, 'generatedAt': now_iso(), 'countries': {'US': {'name': 'United States', 'extend': True, 'source': {'name': 'USDA AMS Market News, USDA AMS/FGIS, USDA FAS Export Sales Reporting, EIA (series semanales de mercado reunidas por Dehesa Index)',
        'url': 'https://mymarketnews.ams.usda.gov/', 'license': 'US Government work (public domain); credit: USDA, EIA'}, 'series': series}}}
body = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
if OUT.exists():   # no reescribir si solo cambia la hora
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = json.loads(body); n.pop('generatedAt', None)
        if o == n: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
OUT.write_text(body, encoding='utf-8')
print('OK %d series, %d puntos' % (len(series), sum(len(s['points']) for s in series)))
