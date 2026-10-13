#!/usr/bin/env python3
"""Letonia (CSP) y Estonia (Statistics Estonia): estadistica nacional oficial -> data/baltics-national-stats.json (countries.LV, countries.EE)
Fuentes (API PxWeb publicas): data.stat.gov.lv (OSP_PUB/NOZ/LA) y andmed.stat.ee (majandus/pellumajandus).
Letonia: precios de compra al agricultor de cereales y colza (trimestral) y de leche y carne (mensual), existencias de cierre de los balances de cereales y colza, superficie, produccion y rendimiento, entregas de leche.
Estonia: balances de cereales y patata (existencias finales), superficie/produccion/rendimiento, precio de la leche y de ganado comprado (mensual), produccion de lacteos y carne.
Cada valor es el publicado por la fuente: sin estimaciones, sin relleno y sin conversiones. Si una tabla o un valor ya no existe, el script falla con un mensaje claro y no escribe nada.
Uso: python3 scripts/update-np-baltic.py"""
import datetime, json, re, sys, time, urllib.request
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
from lib_breaks import clean as _clean_breaks   # rupturas de serie (cambios de unidad): ver scripts/lib_breaks.py
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; OUT = ROOT / 'data' / 'baltics-national-stats.json'; LOG = ROOT / 'data' / 'baltics-national-log.txt'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Content-Type': 'application/json'}
LVB = 'https://data.stat.gov.lv/api/v1/en/OSP_PUB/NOZ/LA/'
EEB = 'https://andmed.stat.ee/api/v1/en/stat/majandus/pellumajandus/pellumajandussaaduste-tootmine/'
log = []
def say(*a): s = ' '.join(str(x) for x in a); log.append(s); print(s, flush=True)
def call(u, data=None):
    err = None
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=UA), timeout=120) as r: return json.loads(r.read().decode('utf-8-sig'))
        except Exception as e: err = e; time.sleep(5 * (k + 1))
    raise RuntimeError('%s -> %s' % (u, err))
def clean(t): return re.sub(r'^\s*[\d.]+\s+', '', re.sub(r'[*]+', '', t.replace('..', ''))).strip()
def num(x):
    try:
        v = float(str(x).replace(',', '.').replace(' ', '')); return v if v == v else None
    except Exception: return None
def period(code, text):
    for s in (code, text):
        m = re.match(r'^(\d{4})Q([1-4])$', s)
        if m: return '%s-Q%s' % m.groups(), 'quarterly'
        m = re.match(r'^(\d{4})M(\d{2})$', s)
        if m: return '%s-%s' % m.groups(), 'monthly'
    m = re.match(r'^(\d{4})$', code)
    if m: return code, 'annual'
    m = re.search(r'(\d{4})\s*$', text)       # campañas de Estonia: «1 July 2023 - 30 June 2024» -> 2024 (año en que termina)
    if m: return m.group(1), 'annual'
    return None, None
class Table:
    def __init__(self, base, path):
        self.u = base + path; self.m = call(self.u); self.v = {x['code']: x for x in self.m['variables']}
    def find(self, var, texts, optional=False):
        """codigo -> texto original para los valores cuyo texto limpio coincide exactamente; si falta alguno obligatorio, error claro."""
        t2 = {clean(t): (c, t) for c, t in zip(self.v[var]['values'], self.v[var]['valueTexts'])}
        out = {}
        for w in texts:
            if w in t2: out[t2[w][0]] = w
            elif not optional: raise RuntimeError('%s: «%s» ya no existe en la fuente (variable %s)' % (self.u, w, var))
        return out
    def get(self, sel):
        q = []
        for code, v in self.v.items():
            vals = sel.get(code) or ([v['values'][0]] if v.get('elimination') else v['values'])
            q.append({'code': code, 'selection': {'filter': 'item', 'values': list(vals)}})
        r = call(self.u, json.dumps({'query': q, 'response': {'format': 'json'}}).encode())
        names = [c['code'] for c in r['columns'] if c['type'] != 'c']; self.cc = [c['code'] for c in r['columns'] if c['type'] == 'c']
        return names, r['data']
    def ptext(self, var): return dict(zip(self.v[var]['values'], self.v[var]['valueTexts']))
OUTS = {}
def put(cc, sid, group, label, unit, pts, freq, note, src, ds, sg, url):
    d = {}
    for p, v in pts:
        if v is not None: d[p] = v
    pp = sorted(d.items())
    if len(pp) < 3: say('omitida (menos de 3 puntos):', sid); return
    (lp, lv), (_, pv) = pp[-1], pp[-2]
    s = {'id': sid, 'group': group, 'label': label, 'unit': unit, 'frequency': freq, 'latestPeriod': lp, 'latest': lv, 'changePct': round((lv / pv - 1) * 100, 2) if pv else None,
         'points': [[k, v] for k, v in pp], 'sourceGroup': sg, 'reference': {'source': src, 'dataset': ds, 'original': url}}
    if note: s['periodNote'] = note
    OUTS.setdefault(cc, {})[sid] = s
def series_from(t, sel, key_var, time_var, items, mk):
    """items: {codigo: dato}; recorre la tabla y entrega puntos por (clave, otras dimensiones)."""
    names, data = t.get(sel); tt = t.ptext(time_var); by = {}; multi = len(t.cc) > 1
    for row in data:
        k = dict(zip(names, row['key'])); p, f = period(k[time_var], tt[k[time_var]])
        for i, raw in enumerate(row['values'] if multi else row['values'][:1]):
            v = num(raw)
            if p and v is not None: by.setdefault(tuple(k[n] for n in names if n != time_var) + ((t.cc[i],) if multi else ()), []).append((p, v, f))
    return names + (['ContentsCode'] if multi else []), by

# ---------- LETONIA ----------
LVS = 'CSP Latvia (Central Statistical Bureau of Latvia)'
def lv(sid, group, label, unit, pts, freq, note, ds): put('LV', 'lv-csp-' + sid, group, label, unit, pts, freq, note, LVS + ', statistical database', ds, 'CSP Latvia', 'https://data.stat.gov.lv/')
def lv_prices():
    t = Table(LVB, 'LAC/LAC020c'); want = {'Wheat': 'wheat', 'Rye': 'rye', 'Barley': 'barley', 'Oats': 'oats', 'Triticale': 'triticale', 'Rape seeds': 'rapeseed', 'Pulses': 'pulses'}
    pc = t.find('TYPE_PROD', list(want)); names, by = series_from(t, {'TYPE_PROD': list(pc), 'TIME': t.v['TIME']['values']}, 'TYPE_PROD', 'TIME', pc, None)
    for key, pts in by.items():
        c = key[names.index('TYPE_PROD')] if 'TYPE_PROD' in names else None
        k = dict(zip([n for n in names if n != 'TIME'], key)); nm = want[pc[k['TYPE_PROD']]]
        lv('price-' + nm, 'prices', 'Producer price: %s, Latvia (CSP)' % nm, 'EUR/t', [(p, v) for p, v, f in pts], 'quarterly', 'Precio medio de compra al agricultor (sin IVA), media trimestral publicada por la CSP.', 'LAC020c (Average purchase prices of grain, pulses and rape seeds)')
    say('LAC020c', len(by), 'series')
    t = Table(LVB, 'LAC/LAC020m'); want = {'Raw milk': ('milk', 'milk', 'prices'), 'Bovine meat': ('bovine-meat', 'bovine meat', 'prices_lv'), 'Pork': ('pork', 'pork', 'prices_lv')}
    pc = t.find('TYPE_PROD', list(want)); names, by = series_from(t, {'TYPE_PROD': list(pc), 'TIME': t.v['TIME']['values']}, 'TYPE_PROD', 'TIME', pc, None)
    for key, pts in by.items():
        k = dict(zip([n for n in names if n != 'TIME'], key)); sid, nm, grp = want[pc[k['TYPE_PROD']]]
        lv('price-' + sid, grp, 'Producer price: %s, Latvia (CSP)' % nm, 'EUR/t', [(p, v) for p, v, f in pts], 'monthly', 'Precio medio de compra al productor (sin IVA), media mensual publicada por la CSP.', 'LAC020m (Average purchase prices of milk and meat)')
    say('LAC020m', len(by), 'series')
def lv_stocks():
    t = Table(LVB, 'LAB/LAB010'); ind = t.find('INDICATOR', ['Closing stock'])
    want = {'Cereals': 'cereals', 'Common wheat and spelt': 'common wheat', 'Barley': 'barley', 'Rye': 'rye', 'Oats': 'oats', 'Grain maize and corn-cob-mix': 'maize'}
    cc = t.find('CROP', list(want)); names, by = series_from(t, {'INDICATOR': list(ind), 'CROP': list(cc), 'TIME': t.v['TIME']['values']}, 'CROP', 'TIME', cc, None)
    for key, pts in by.items():
        k = dict(zip([n for n in names if n != 'TIME'], key)); nm = want[cc[k['CROP']]]
        lv('stocks-' + nm.replace(' ', '-'), 'stocks', 'Stocks: %s, Latvia (CSP)' % nm, 'thousand t', [(p, v) for p, v, f in pts], 'annual', 'Existencias de cierre del balance de producción y consumo de la CSP (campaña que termina en el año indicado).', 'LAB010 (Balance of production and consumption of cereal products)')
    say('LAB010', len(by), 'series')
    t = Table(LVB, 'LAB/LAB020'); ind = t.find('INDICATOR', ['Closing stock'])
    names, by = series_from(t, {'INDICATOR': list(ind), 'TIME': t.v['TIME']['values']}, 'INDICATOR', 'TIME', ind, None)
    for key, pts in by.items(): lv('stocks-rapeseed', 'stocks', 'Stocks: rapeseed, Latvia (CSP)', 'thousand t', [(p, v) for p, v, f in pts], 'annual', 'Existencias de cierre del balance de colza de la CSP.', 'LAB020 (Balance of production and consumption of rape and turnip rape)')
    say('LAB020', len(by), 'series')
def lv_crops():
    t = Table(LVB, 'LAG/LAG020'); want = {'Winter wheat': 'winter wheat', 'Spring wheat': 'spring wheat', 'Rye': 'rye', 'Winter barley': 'winter barley', 'Spring barely': 'spring barley', 'Oats': 'oats', 'Cereals': 'cereals',
                                      'Rape': 'rapeseed', 'Potatoes': 'potatoes', 'Sugar beets': 'sugar beet', 'Peas': 'peas'}
    cc = t.find('CROP', list(want)); cont = {c: x for c, x in zip(t.v['ContentsCode']['values'], t.v['ContentsCode']['valueTexts'])}
    names, by = series_from(t, {'CROP': list(cc), 'ContentsCode': t.v['ContentsCode']['values'], 'TIME': t.v['TIME']['values']}, 'CROP', 'TIME', cc, None)
    for key, pts in by.items():
        k = dict(zip([n for n in names if n != 'TIME'], key)); nm = want[cc[k['CROP']]]; ct = cont[k['ContentsCode']]
        kind, unit = ('area', 'thousand ha') if 'Sown area' in ct else (('production', 'thousand t') if 'Production' in ct else ('yield', 'q/ha'))
        lab = {'area': 'Sown area', 'production': 'Production', 'yield': 'Yield'}[kind]
        pts = sorted(pts)
        if kind == 'yield' and len(pts) > 3 and pts[-1][1] * 5 < pts[-2][1]:   # la CSP publica el rendimiento preliminar del año en curso en otra unidad (t/ha en vez de q/ha): no se mezcla con la serie
            say('rendimiento %s: se descarta %s (valor %s en otra unidad que los anteriores)' % (nm, pts[-1][0], pts[-1][1])); pts = pts[:-1]
        lv('%s-%s' % (kind, nm.replace(' ', '-')), 'crops' if kind != 'production' else 'production', '%s: %s, Latvia (CSP)' % (lab, nm), unit, [(p, v) for p, v, f in pts], 'annual', None, 'LAG020 (Sown area, total crop production, yield of agricultural crops)')
    say('LAG020', len(by), 'series')
def lv_milk():
    t = Table(LVB, 'LAL/LAL050m'); code = [c for c, x in zip(t.v['ContentsCode']['values'], t.v['ContentsCode']['valueTexts']) if x.startswith('Raw cows')]
    if not code: raise RuntimeError('LAL050m: ya no existe «Raw cows\' milk delivered to dairies»')
    names, by = series_from(t, {'ContentsCode': code, 'TIME': t.v['TIME']['values']}, 'ContentsCode', 'TIME', {}, None)
    for key, pts in by.items(): lv('milk-deliveries', 'milk', 'Milk deliveries to dairies, Latvia (CSP)', 't', [(p, v) for p, v, f in pts], 'monthly', 'Leche cruda de vaca entregada a las industrias, publicada por la CSP.', 'LAL050m (Milk purchase and purchased quality)')
    say('LAL050m', len(by), 'series')

# ---------- ESTONIA ----------
EES = 'Statistics Estonia'
def ee(sid, group, label, unit, pts, freq, note, ds): put('EE', 'ee-stat-' + sid, group, label, unit, pts, freq, note, EES + ', statistical database', ds, 'Statistics Estonia', 'https://andmed.stat.ee/')
def vname(t, i): return t.m['variables'][i]['code']
def ee_crops():
    t = Table(EEB, 'taimekasvatussaaduste-tootmine/PM0281.px'); vs = t.m['variables']
    cty, crop, per, ind = vs[0]['code'], vs[1]['code'], vs[2]['code'], vs[3]['code']
    want = {'Cereals for the production of grain': 'cereals', 'Wheat': 'wheat', 'Rye': 'rye', 'Barley': 'barley', 'Oats': 'oats', 'Triticale': 'triticale', 'Field peas': 'peas', 'Potatoes': 'potatoes', 'Rape and turnip rape seeds': 'rapeseed'}
    cc = t.find(crop, list(want)); ii = {'AR_HA_PR': 'Harvested area', 'PR': 'Production', 'YI': 'Yield'}
    names, by = series_from(t, {cty: ['EE_T'], crop: list(cc), per: t.v[per]['values'], ind: list(ii)}, crop, per, cc, None)
    for key, pts in by.items():
        k = dict(zip([n for n in names if n != per], key)); nm = want[cc[k[crop]]]; i = k[ind]
        unit, grp = {'AR_HA_PR': ('ha', 'crops'), 'PR': ('t', 'production'), 'YI': ('kg/ha', 'crops')}[i]
        ee('%s-%s' % (ii[i].split()[-1].lower(), nm), grp, '%s: %s, Estonia (Statistics Estonia)' % (ii[i], nm), unit, [(p, v) for p, v, f in pts], 'annual', None, 'PM0281 (Agricultural land and crops by county)')
    say('PM0281', len(by), 'series')
def ee_balance(path, ds, want, label_fn, ind_text, grp, ptxt):
    t = Table(EEB, path); vs = t.m['variables']; kind, ind, per = vs[0]['code'], vs[1]['code'], vs[2]['code']
    cc = t.find(kind, list(want)) if want else {}; ic = t.find(ind, [ind_text])
    names, by = series_from(t, {kind: list(cc) or t.v[kind]['values'], ind: list(ic), per: t.v[per]['values']}, kind, per, cc, None)
    for key, pts in by.items():
        k = dict(zip([n for n in names if n != per], key)); nm = want[cc[k[kind]]]
        label_fn(nm, pts, ds, ptxt)
    say(ds.split()[0], len(by), 'series')
def ee_stock(nm, pts, ds, ptxt): ee('stocks-' + nm.replace(' ', '-'), 'stocks', 'Stocks: %s, Estonia (Statistics Estonia)' % nm, 't', [(p, v) for p, v, f in pts], 'annual', ptxt, ds)
def ee_monthly():
    t = Table(EEB, 'loomakasvatussaaduste-tootmine/PM18.PX'); vs = t.m['variables']; ind, per = vs[0]['code'], vs[1]['code']
    ic = t.find(ind, ['Average price of milk, euros/ton', 'Milk in natural weight, thousand tons'])
    names, by = series_from(t, {ind: list(ic), per: t.v[per]['values']}, ind, per, ic, None)
    for key, pts in by.items():
        k = dict(zip([n for n in names if n != per], key)); price = ic[k[ind]].startswith('Average')
        ee('price-milk' if price else 'milk-deliveries', 'prices' if price else 'milk', 'Producer price: milk, Estonia (Statistics Estonia)' if price else 'Milk deliveries to dairies, Estonia (Statistics Estonia)',
           'EUR/t' if price else 'thousand t', [(p, v) for p, v, f in pts], 'monthly', 'Precio medio de la leche comprada por las industrias, publicado por Statistics Estonia.' if price else 'Leche comprada por las industrias, publicada por Statistics Estonia.', 'PM18 (Purchase of milk, monthly)')
    say('PM18', len(by), 'series')
    t = Table(EEB, 'loomakasvatussaaduste-tootmine/PM192.PX'); vs = t.m['variables']; per, kind, ind = vs[0]['code'], vs[1]['code'], vs[2]['code']
    want = {'Bovine animals': 'bovine meat', 'Pigs': 'pork', 'Sheep and goats': 'sheep and goat meat'}; kc = t.find(kind, list(want)); ic = t.find(ind, ['Average price of meat from purchased animals, euros/ton'])
    names, by = series_from(t, {kind: list(kc), ind: list(ic), per: t.v[per]['values']}, kind, per, kc, None)
    for key, pts in by.items():
        k = dict(zip([n for n in names if n != per], key)); nm = want[kc[k[kind]]]
        ee('price-' + nm.replace(' ', '-'), 'prices_lv', 'Producer price: %s, Estonia (Statistics Estonia)' % nm, 'EUR/t', [(p, v) for p, v, f in pts], 'monthly', 'Precio medio de la carne (peso canal) de los animales comprados, publicado por Statistics Estonia.', 'PM192 (Purchase of cattle, pigs, sheep and goats, monthly)')
    say('PM192', len(by), 'series')
def ee_products():
    t = Table(EEB, 'pellumajandussaaduste-ressurss-ja-kasutamine/PM47.PX'); vs = t.m['variables']; kind, ind, per = vs[0]['code'], vs[1]['code'], vs[2]['code']
    want = {'Butter': 'butter', 'Cheese (incl. fresh cheese)': 'cheese', 'Whole milk powder': 'whole milk powder', 'Skimmed milk and buttermilk powder': 'skimmed milk powder'}
    kc = t.find(kind, list(want)); ic = t.find(ind, ['Production, thousand tons'])
    names, by = series_from(t, {kind: list(kc), ind: list(ic), per: t.v[per]['values']}, kind, per, kc, None)
    for key, pts in by.items():
        k = dict(zip([n for n in names if n != per], key)); nm = want[kc[k[kind]]]
        ee('production-' + nm.replace(' ', '-'), 'milk', 'Production: %s, Estonia (Statistics Estonia)' % nm, 'thousand t', [(p, v) for p, v, f in pts], 'annual', None, 'PM47 (Supply balance of milk and milk products)')
    say('PM47', len(by), 'series')

steps = [lv_prices, lv_stocks, lv_crops, lv_milk, ee_crops, ee_monthly, ee_products,
         lambda: ee_balance('pellumajandussaaduste-ressurss-ja-kasutamine/PM20.PX', 'PM20 (Supply balance of cereals by type of cereal)', {'Cereals total': 'cereals', 'Wheat': 'wheat', 'Rye': 'rye', 'Barley': 'barley', 'Oats': 'oats', 'maize': 'maize'}, ee_stock, 'Final stocks, tons', 'grain', 'Existencias finales del balance de cereales de Statistics Estonia (el año indicado es aquel en que termina el periodo del balance).'),
         lambda: ee_balance('pellumajandussaaduste-ressurss-ja-kasutamine/PM31.PX', 'PM31 (Supply balance of potatoes)', None, None, 'Final stocks, tons', 'potato', '')]
def run_potato():
    t = Table(EEB, 'pellumajandussaaduste-ressurss-ja-kasutamine/PM31.PX'); vs = t.m['variables']; ind, per = vs[0]['code'], vs[1]['code']; ic = t.find(ind, ['Final stocks, tons'])
    names, by = series_from(t, {ind: list(ic), per: t.v[per]['values']}, ind, per, ic, None)
    for key, pts in by.items(): ee_stock('potatoes', pts, 'PM31 (Supply balance of potatoes)', 'Existencias finales del balance de patata de Statistics Estonia.')
    say('PM31', len(by), 'series')
steps[-1] = run_potato
for s in steps: s()
series = {cc: [v[k] for k in sorted(v)] for cc, v in OUTS.items()}
n = sum(len(v) for v in series.values())
if n < 60 or set(series) != {'LV', 'EE'}: sys.exit('resultado incompleto (%d series, paises %s); no se escribe nada' % (n, sorted(series)))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
doc = {'schemaVersion': 1, 'generatedAt': now, 'countries': {
    'LV': {'name': 'Latvia', 'extend': True, 'source': {'name': 'CSP Latvia (Central Statistical Bureau of Latvia), official statistics database', 'url': 'https://data.stat.gov.lv/', 'license': 'CSP Latvia open data; credit: CSP Latvia'}, 'series': series['LV']},
    'EE': {'name': 'Estonia', 'extend': True, 'source': {'name': 'Statistics Estonia, statistical database', 'url': 'https://andmed.stat.ee/', 'license': 'Statistics Estonia open data; credit: Statistics Estonia'}, 'series': series['EE']}}}
if OUT.exists():
    try:
        o = json.loads(OUT.read_text(encoding='utf-8')); o.pop('generatedAt', None); nn = json.loads(json.dumps(doc)); nn.pop('generatedAt', None)
        if o == nn: print('sin cambios'); sys.exit(0)
    except SystemExit: raise
    except Exception: pass
doc = _clean_breaks(doc)
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
LOG.write_text('\n'.join(log) + '\n', encoding='utf-8')
print('OK %d series, %d puntos' % (n, sum(len(s['points']) for v in series.values() for s in v)))
