"""Alemania: produccion agricola por estado federado, precios de la tierra y alquileres (Destatis, GENESIS).
Modulo de funciones puras: update-germany.py lo importa, baja las tablas con el token y llama a build().
Tablas (todas Datenlizenz Deutschland - Namensnennung 2.0):
  41241-0010  cosecha por Bundesland desde 2010 (superficie, produccion, rendimiento)
  41241-0005  cosecha Alemania desde 2010;  41241-0001/0002/0003  superficie / produccion / rendimiento 1950-2009
  61521-0010  valor de compraventa de tierra agricola por Bundesland (desde 2021);  61521-0001 Alemania desde 2021
  61521-0100  Alemania 1991-2020 (otra serie: se muestra aparte, no se empalma)
  41141-0110  alquileres (Pachtentgelt EUR/ha) por Bundesland en los años de censo agrario;  41141-0010 Alemania
No se estima ni se interpola nada: las celdas vacias, '.', '-' o '...' se omiten.
"""
import csv, re

LAND = {'01': 'SH', '02': 'HH', '03': 'NI', '04': 'HB', '05': 'NW', '06': 'HE', '07': 'RP', '08': 'BW', '09': 'BY', '10': 'SL', '11': 'BE', '12': 'BB', '13': 'MV', '14': 'SN', '15': 'ST', '16': 'TH'}
# clave, nombre alemán, codigo desde 2010, codigo hasta 2009
CROPS = [('cereals', 'Getreide insgesamt (mit Körnermais)', 'FRUART01EKM1', 'FRUART01EKM'),
         ('wheat', 'Weizen', 'FRUART0111', 'FRUART0111'),
         ('rye', 'Roggen', 'FRUART01121', 'FRUART0112'),
         ('barley', 'Gerste', 'FRUART0121', 'FRUART0121'),
         ('oats', 'Hafer', 'FRUART0122', 'FRUART0122'),
         ('triticale', 'Triticale', 'FRUART0124', 'FRUART0124'),
         ('maize', 'Körnermais (mit CCM)', 'FRUART013CCM1', 'FRUART013CCM'),
         ('rapeseed', 'Raps und Rübsen', 'FRUART0511', 'FRUART0511'),
         ('sunflower', 'Sonnenblumen', 'FRUART0515', 'FRUART0513'),
         ('sugarbeet', 'Zuckerrüben', 'FRUART032', 'FRUART032'),
         ('potato', 'Kartoffeln', 'FRUART031', 'FRUART031'),
         ('silage', 'Silomais', 'FRUART064G1', 'FRUART064')]
VAR = {'FLC016': ('area', 'ha'), 'ERN001': ('prod', 't'), 'ERT001': ('yield', 'dt/ha')}
BOD = {'BOD-LF': 'lf', 'BOD-ACK': 'acker', 'BOD-GRL': 'gruen'}
RENT = {'BNZAT-2': 'lf', 'BNZAT-21': 'acker', 'BNZAT-23': 'gruen'}


def num(s):
    s = (s or '').strip()
    if not s or s in ('.', '..', '...', '-', '/', 'x', '–', 'X'): return None
    try:
        if ',' in s: return float(s.replace('.', '').replace(',', '.'))
        if re.match(r'^\d{1,3}(\.\d{3})+$', s): return float(s.replace('.', ''))
        return float(s)
    except ValueError:
        return None


def ff(txt):
    """ffcsv -> lista de dicts {t, d:{variable: codigo de atributo}, v, vc}. Exige las columnas del formato plano."""
    rows = list(csv.reader(txt.lstrip('﻿').splitlines(), delimiter=';'))
    if not rows or 'value' not in rows[0]: raise RuntimeError('ffcsv sin cabecera esperada')
    H = rows[0]; ix = {c: i for i, c in enumerate(H)}
    dims = sorted(int(c.split('_')[0]) for c in H if re.match(r'^\d+_variable_code$', c))
    out = []
    for r in rows[1:]:
        if len(r) < len(H): continue
        d = {r[ix['%d_variable_code' % n]]: r[ix['%d_variable_attribute_code' % n]] for n in dims}
        out.append({'t': r[ix['time']].strip(), 'd': d, 'v': num(r[ix['value']]), 'vc': r[ix['value_variable_code']]})
    return out


def _add(dst, key, year, val):
    if val is None: return
    dst.setdefault(key, {})[int(year)] = val


def _pts(m):
    return [[y, round(v, 3)] for y, v in sorted(m.items())]


def production(t10, t05, t01, t02, t03):
    cm = {c[2]: c[0] for c in CROPS}; pm = {c[3]: c[0] for c in CROPS}
    nat = {}; land = {}
    for r in ff(t10):
        c = cm.get(r['d'].get('FRUA04')); lk = LAND.get(r['d'].get('DLAND')); v = VAR.get(r['vc'])
        if c and lk and v and re.match(r'^\d{4}$', r['t']): _add(land, (c, lk, v[0]), r['t'], r['v'])
    for r in ff(t05):
        c = cm.get(r['d'].get('FRUA04')); v = VAR.get(r['vc'])
        if c and v and re.match(r'^\d{4}$', r['t']): _add(nat, (c, v[0]), r['t'], r['v'])
    for txt, vname in ((t01, 'area'), (t02, 'prod'), (t03, 'yield')):
        for r in ff(txt):
            k = [x for n, x in r['d'].items() if n.startswith('FRUA')]
            c = pm.get(k[0]) if k else None
            if c and re.match(r'^\d{4}$', r['t']) and int(r['t']) < 2010 and VAR.get(r['vc'], (None,))[0] == vname: _add(nat, (c, vname), r['t'], r['v'])
    res = {'nat': {}, 'land': {}}
    for (c, vn), m in nat.items(): res['nat'].setdefault(c, {})[vn] = _pts(m)
    for (c, lk, vn), m in land.items(): res['land'].setdefault(c, {}).setdefault(lk, {})[vn] = _pts(m)
    return res


def land_price(t10, t01, t100):
    res = {'nat': {}, 'natPre': [], 'land': {}}
    acc = {}
    for r in ff(t10):
        b = BOD.get(r['d'].get('BODAT1')); lk = LAND.get(r['d'].get('DLAND'))
        if b and lk and r['d'].get('FLNGK1', '') == '' and re.match(r'^\d{4}$', r['t']):
            n = {'KAU004': 'p', 'VKF002': 'n', 'FLC023': 'ha'}.get(r['vc'])
            if n: _add(acc, (lk, b, n), r['t'], r['v'])
    for (lk, b, n), m in acc.items(): res['land'].setdefault(lk, {}).setdefault(b, {})[n] = _pts(m)
    acc = {}
    for r in ff(t01):
        b = BOD.get(r['d'].get('BODAT1'))
        if b and r['d'].get('FLNGK1', '') == '' and re.match(r'^\d{4}$', r['t']):
            n = {'KAU004': 'p', 'VKF002': 'n', 'FLC023': 'ha'}.get(r['vc'])
            if n: _add(acc, (b, n), r['t'], r['v'])
    for (b, n), m in acc.items(): res['nat'].setdefault(b, {})[n] = _pts(m)
    m = {}
    for r in ff(t100):
        if r['vc'] == 'KAU004' and r['d'].get('EMZKL1', 'x') == '' and r['d'].get('FLNGK1', 'x') == '' and re.match(r'^\d{4}$', r['t']): _add(m, 'p', r['t'], r['v'])
    res['natPre'] = _pts(m.get('p', {}))
    return res


def rent(t10, by_land):
    """t10: 41141-0010 (Alemania). by_land: {codigo Land: texto 41141-0110 filtrado a ese Land}."""
    def pick(txt, land_dim):
        acc = {}
        for r in ff(txt):
            k = RENT.get(r['d'].get('BNZAT4'))
            if k and r['vc'] == 'ETG009' and r['d'].get('RECF01', 'x') == '' and r['d'].get('FLCG05', 'x') == '' and re.match(r'^\d{4}$', r['t']) and (not land_dim or LAND.get(r['d'].get('DLAND')) == land_dim):
                _add(acc, k, r['t'], r['v'])
        return {k: _pts(m) for k, m in acc.items()}
    res = {'nat': pick(t10, None), 'land': {}}
    for code, txt in by_land.items():
        p = pick(txt, LAND[code])
        if p: res['land'][LAND[code]] = p
    return res


def build(t, rent_by_land):
    return {'production': production(t['41241-0010'], t['41241-0005'], t['41241-0001'], t['41241-0002'], t['41241-0003']),
            'landPrice': land_price(t['61521-0010'], t['61521-0001'], t['61521-0100']),
            'rent': rent(t['41141-0010'], rent_by_land)}
