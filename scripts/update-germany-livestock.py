#!/usr/bin/env python3
"""Alemania: ganadería, huevos y fruta de árbol de Destatis (GENESIS, Datenlizenz Deutschland - Namensnennung 2.0) -> data/germany-livestock.json
Necesita el secreto GENESIS_TOKEN. Sin token no toca nada (sale con 0 y lo anota en el log): nunca se inventa ni se arrastra un dato.
Tablas (API data/tablefile, ffcsv):
  41331-0001/-0002/-0003  sacrificios y peso de la canal (nacional anual, nacional mensual, por Land anual)  Rinder, Kälber, Schweine, Schafe
  41322-0001              sacrificio de aves (nacional anual)
  41323-0001/-0004        huevos y gallinas ponedoras (nacional, por Land; total de formas de cria y tamanos)
  41312-0001 / 41313-0001 / 41314-0001   censos de vacuno, porcino y ovino (nacional, mayo y noviembre)
  41243-0001              fruta de arbol: superficie y cosecha (nacional)
Todo se guarda tal cual lo publica Destatis (cabezas, toneladas, miles de huevos, ha); solo kg -> t y dt -> t, que son conversiones exactas."""
import csv, datetime, io, json, os, re, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
MONTHS = {m: i + 1 for i, m in enumerate(['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'])}
LAND = {'01': 'SH', '02': 'HH', '03': 'NI', '04': 'HB', '05': 'NW', '06': 'HE', '07': 'RP', '08': 'BW', '09': 'BY', '10': 'SL', '11': 'BE', '12': 'BB', '13': 'MV', '14': 'SN', '15': 'ST', '16': 'TH'}
SPECIES = {'TIERART20': 'cattle', 'TIERART05': 'calves', 'TIERART3': 'pigs', 'TIERART4': 'sheep'}
STYPE = {'SCHLACHT1': 'dom', 'SCHLACHT2': 'imp', 'SCHLACHT3': 'home'}
POULTRY = {'': 'total', 'TIERART515': 'broilers', 'TIERART513': 'turkeys', 'TIERART512': 'ducks', 'TIERART511': 'geese', 'TIERART514': 'hens'}
FRUIT = {'OBST02': 'apples', 'OBST03': 'pears', 'OBST051': 'sweetcherries', 'OBST052': 'sourcherries', 'OBST061': 'plums', 'OBST062': 'mirabelles'}
def num(s):
    s = (s or '').strip()
    if not s or s in ('.', '..', '...', '-', '/', 'x', '–'): return None
    try:
        if ',' in s: return float(s.replace('.', '').replace(',', '.'))
        if re.match(r'^\d{1,3}(\.\d{3})+$', s): return float(s.replace('.', ''))
        return float(s)
    except ValueError: return None
class TooBig(Exception): pass
def genesis_raw(table, token, startyear, later=()):
    """GENESIS devuelve Status 98 si la tabla es demasiado grande: se reintenta con un inicio mas reciente (menos anos, nunca menos detalle)."""
    for sy in (startyear,) + tuple(later):
        try: return genesis_raw1(table, token, sy)
        except TooBig: log('tabla demasiado grande', table, 'desde', sy)
    raise RuntimeError('GENESIS %s: demasiado grande incluso desde %s' % (table, (startyear,) + tuple(later))[-1:])
def genesis_raw1(table, token, startyear):
    h = {'Content-Type': 'application/x-www-form-urlencoded', 'username': token, 'password': '', 'Accept': '*/*', 'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)'}
    body = urllib.parse.urlencode({'name': table, 'startyear': str(startyear), 'format': 'ffcsv', 'compress': 'false', 'language': 'de'}).encode()
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request('https://genesis.destatis.de/genesisWS/rest/2020/data/tablefile', data=body, headers=h, method='POST'), timeout=240) as r: raw = r.read()
            if raw[:2] == b'PK': z = zipfile.ZipFile(io.BytesIO(raw)); raw = z.read(z.namelist()[0])
            txt = raw.decode('utf-8', 'replace')
            if txt.lstrip('\ufeff').startswith('{'):
                if '"Code":98' in txt: raise TooBig()
                raise ValueError('GENESIS respondio con estado: ' + re.sub(r'\s+', ' ', txt)[:200])
            return txt
        except TooBig: raise
        except Exception as e:
            last = e; time.sleep(5 * (i + 1))
    raise RuntimeError('GENESIS %s -> %s' % (table, str(last).replace(token, '<token>')[:160]))
def rows_of(txt):
    """ffcsv -> lista de dicts {time, v1..v4 (codigo de atributo), l1..l4 (etiqueta), var (codigo de la magnitud), value}"""
    rs = list(csv.reader(txt.splitlines(), delimiter=';'))
    if not rs: raise ValueError('ffcsv vacio')
    H = [c.lstrip('﻿') for c in rs[0]]; ix = {c: i for i, c in enumerate(H)}
    if 'value' not in ix or 'time' not in ix or 'value_variable_code' not in ix: raise ValueError('ffcsv sin cabecera esperada: ' + ';'.join(H)[:120])
    out = []
    for r in rs[1:]:
        if len(r) < len(H): continue
        d = {'time': r[ix['time']].strip(), 'var': r[ix['value_variable_code']].strip(), 'value': num(r[ix['value']]), 'unit': r[ix['value_unit']].strip()}
        for k in (1, 2, 3, 4):
            c = '%d_variable_attribute_code' % k
            if c in ix: d['v%d' % k] = r[ix[c]].strip(); d['l%d' % k] = r[ix['%d_variable_attribute_label' % k]].strip(); d['k%d' % k] = r[ix['%d_variable_code' % k]].strip()
        out.append(d)
    return out
def period(d):
    t = d['time']
    if re.match(r'^\d{4}-\d{2}P1M$', t): return t[:7]
    if re.match(r'^\d{4}$', t):
        if d.get('k1') == 'MONAT': m = MONTHS.get(d.get('l1')); return '%s-%02d' % (t, m) if m else None
        return t
    return None
def series(pts):
    dd = {}
    for p, v in pts:
        if p and v is not None: dd[p] = v
    return [[p, dd[p]] for p in sorted(dd)]
def clean(v):
    return int(v) if v == int(v) else round(v, 3)
def slaughter(token):
    nat, land, month = {}, {}, {}
    def add(tgt, keys, p, v):
        node = tgt
        for k in keys[:-1]: node = node.setdefault(k, {})
        node.setdefault(keys[-1], []).append((p, v))
    for name, sy, kind in (('41331-0001', 1993, 'nat'), ('41331-0003', 2010, 'land'), ('41331-0002', 2015, 'month')):
        rs = rows_of(genesis_raw(name, token, sy)); n = 0
        for d in rs:
            if kind == 'nat': sp, st, geo = SPECIES.get(d['v2']), STYPE.get(d['v3']), 'DE'
            elif kind == 'land': sp, st, geo = SPECIES.get(d['v2']), STYPE.get(d['v3']), LAND.get(d['v1'])
            else: sp, st, geo = SPECIES.get(d['v3']), STYPE.get(d['v4']), 'DE'
            if not sp or not st or not geo or d['value'] is None: continue
            vname = {'GTR001': 'heads', 'GTR002': 'tonnes'}.get(d['var'])
            if not vname: continue
            p = period(d)
            if not p: continue
            n += 1
            if kind == 'nat': add(nat, [sp, vname, st], p, d['value'])
            elif kind == 'land': add(land, [sp, geo, vname, st], p, d['value'])
            else: add(month, [sp, vname, st], p, d['value'])
        log('sacrificios', name, kind, n, 'valores')
    def fin(node):
        if isinstance(node, dict): return {k: fin(v) for k, v in node.items()}
        return [[p, clean(v)] for p, v in series(node)]
    return fin(nat), fin(land), fin(month)
def poultry(token):
    out = {}
    rs = rows_of(genesis_raw('41322-0001', token, 2010)); n = 0
    for d in rs:
        sp = POULTRY.get(d['v2']); vname = {'GTR001': 'heads', 'GTR002': 'tonnes'}.get(d['var'])
        if sp is None or not vname or d['value'] is None or d['v1'] != 'DG': continue
        v = d['value'] / 1000 if vname == 'tonnes' else d['value']   # kg -> t (exacto)
        out.setdefault(sp, {}).setdefault(vname, []).append((d['time'], v)); n += 1
    log('aves', n, 'valores')
    return {sp: {vn: [[p, clean(v)] for p, v in series(a)] for vn, a in vs.items()} for sp, vs in out.items()}
def eggs(token):
    nat, land = {}, {}
    VN = {'EIE001': 'eggs', 'HEN004': 'hens', 'EIE002': 'perHen'}
    for name, tgt, geo in (('41323-0001', nat, None), ('41323-0004', land, 'land')):
        n = 0
        for d in rows_of(genesis_raw(name, token, 2015, (2018, 2021, 2023))):
            if d['v2'] != '' or d['v3'] != '' or d['var'] not in VN or d['value'] is None: continue   # total de formas de cria y de tamanos
            if not re.match(r'^\d{4}$', d['time']): continue
            if geo is None:
                if d['v1'] != 'DG': continue
                tgt.setdefault(VN[d['var']], []).append((d['time'], d['value']))
            else:
                lk = LAND.get(d['v1'])
                if not lk: continue
                tgt.setdefault(lk, {}).setdefault(VN[d['var']], []).append((d['time'], d['value']))
            n += 1
        log('huevos', name, n, 'valores')
    fin = lambda a: [[p, clean(v)] for p, v in series(a)]
    return {k: fin(v) for k, v in nat.items()}, {lk: {k: fin(v) for k, v in vs.items()} for lk, vs in land.items()}
def herd(token):
    out = {'cattle': {}, 'pigs': {}, 'sheep': {}}
    spec = (('41312-0001', 'cattle', 'RIN001', {'': 'total', 'RIN-41': 'dairy', 'RIN-42': 'suckler'}), ('41313-0001', 'pigs', 'SCW001', {'': 'total', 'SCW-42': 'sows'}), ('41314-0001', 'sheep', 'SCA001', {'': 'total'}))
    for name, key, var, cats in spec:
        n = 0
        for d in rows_of(genesis_raw(name, token, 2010)):
            if d['var'] != var or d['v1'] != 'DG' or d['v2'] not in cats or d['value'] is None: continue
            p = period(d)
            if not p: continue
            out[key].setdefault(cats[d['v2']], []).append((p, d['value'])); n += 1
        log('censo', name, n, 'valores')
    return {k: {c: [[p, clean(v)] for p, v in series(a)] for c, a in vs.items()} for k, vs in out.items()}
def fruit(token):
    out = {}; n = 0
    for d in rows_of(genesis_raw('41243-0001', token, 2005)):
        sp = FRUIT.get(d['v2']); vn = {'ERN001': 'prod', 'FLC016': 'area'}.get(d['var'])
        if not sp or not vn or d['v1'] != 'DG' or d['value'] is None or not re.match(r'^\d{4}$', d['time']): continue
        out.setdefault(sp, {}).setdefault(vn, []).append((d['time'], d['value'] / 10 if vn == 'prod' else d['value'])); n += 1   # dt -> t (exacto)
    log('fruta', n, 'valores')
    return {sp: {vn: [[p, clean(v)] for p, v in series(a)] for vn, a in vs.items()} for sp, vs in out.items()}
def build(token):
    sn, sl, sm = slaughter(token)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'source': {'id': 'destatis', 'name': 'Statistisches Bundesamt (Destatis), GENESIS-Online', 'url': 'https://www-genesis.destatis.de/', 'license': 'Datenlizenz Deutschland – Namensnennung 2.0',
                      'tables': ['41243-0001', '41312-0001', '41313-0001', '41314-0001', '41322-0001', '41323-0001', '41323-0004', '41331-0001', '41331-0002', '41331-0003']},
           'units': {'heads': 'animals', 'tonnes': 'tonnes (slaughter weight)', 'eggs': 'thousand eggs', 'hens': 'laying hens (annual average)', 'perHen': 'eggs per laying hen per year', 'area': 'ha', 'prod': 'tonnes'},
           'slaughter': {'nat': sn, 'land': sl, 'month': sm}, 'poultry': poultry(token)}
    en, el = eggs(token); doc['eggs'] = {'nat': en, 'land': el}
    doc['herd'] = herd(token); doc['fruit'] = fruit(token)
    return doc
def main():
    args = sys.argv[1:]; outdir = ROOT / 'data'
    if '--outdir' in args: outdir = Path(args[args.index('--outdir') + 1])
    token = os.environ.get('GENESIS_TOKEN', '').strip()
    if not token:
        log('SIN TOKEN: no se llama a GENESIS ni se modifica nada'); (outdir / 'germany-livestock-log.txt').write_text('\n'.join(LOG) + '\n'); return 0
    try: doc = build(token)
    except Exception as e:
        import traceback
        tb = traceback.format_exc().replace(token, '<token>')[-1500:]
        log('FALLO:', type(e).__name__, str(e).replace(token, '<token>')[:300])
        if os.environ.get('GITHUB_ACTIONS'): print('::error title=germany-livestock::' + (' | '.join(LOG[-6:]) + ' | ' + tb)[:3500].replace('%', '%25').replace('\r', '').replace('\n', '%0A'), flush=True)
        return 1
    n = sum(1 for _ in json.dumps(doc))
    if not doc['slaughter']['nat'].get('pigs') or not doc['eggs']['nat'].get('eggs') or not doc['herd']['cattle'].get('total') or not doc['fruit'].get('apples'):
        log('FALLO: faltan bloques esenciales'); return 1
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / 'germany-livestock.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (outdir / 'germany-livestock-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8'); log('escrito germany-livestock.json', n // 1024, 'KB'); return 0
if __name__ == '__main__': sys.exit(main())
