#!/usr/bin/env python3
"""Pesca y acuicultura de Eurostat por pais -> data/eurostat-fish-stats.json (countries.XX, extend; grupo 'fish')
  * Capturas (fish_ca_main, desde 2000): total en toneladas de peso vivo, por gran zona de pesca y las 8 especies con mas capturas el ultimo ano.
  * Desembarques (fish_ld_main): valor (EUR), cantidad (toneladas de peso del producto) y precio medio en primera venta (EUR/t) que publica Eurostat,
    del total y de las 8 especies con mas valor el ultimo ano. Todas las presentaciones, todos los destinos y todos los buques.
  * Acuicultura (fish_aq2a, desde 2008): produccion (t peso vivo), valor (EUR) y precio (EUR/t) del total y de las 6 especies con mas produccion.
  * Flota pesquera (fish_fleet_alt): numero de buques, arqueo bruto (GT), potencia (kW) y buques por edad.
Licencia: politica de reutilizacion de Eurostat (Decision 2011/833/UE), ya registrada (fuente 'eurostat').
Nada se estima ni se convierte: las cifras son las que publica Eurostat, con su unidad. Las 'especies principales' se eligen por la ultima cifra publicada
(es una seleccion de Dehesa Index, no una clasificacion de Eurostat). Series con <3 puntos o paradas (ultimo dato anterior a ano-3) se omiten (eurostat_country.put).
Uso: update-eurostat-fish.py [XX ...]"""
import datetime, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eurostat_country as E
C = {'ES': 'Spain', 'FR': 'France', 'DE': 'Germany', 'BE': 'Belgium', 'AT': 'Austria', 'PT': 'Portugal', 'IT': 'Italy', 'DK': 'Denmark', 'NL': 'Netherlands',
     'PL': 'Poland', 'EL': 'Greece', 'IE': 'Ireland', 'FI': 'Finland', 'BG': 'Bulgaria', 'HR': 'Croatia', 'LT': 'Lithuania', 'SK': 'Slovakia', 'CZ': 'Czechia',
     'EE': 'Estonia', 'HU': 'Hungary', 'LV': 'Latvia', 'RO': 'Romania', 'SE': 'Sweden', 'SI': 'Slovenia'}
# Sin agregado UE: en fish_ca_main, fish_ld_main y fish_fleet_alt Eurostat no publica el total EU27_2020 (solo algunas especies sueltas), y una suma propia no se hace.
# Paises sin costa (AT CZ HU SK): Eurostat no tiene capturas ni desembarques (la API responde 413); solo acuicultura.
GEO = {}
LANDLOCKED = ('AT', 'CZ', 'HU', 'SK')
SRC = {'name': 'Eurostat, fisheries statistics (catches, landings, aquaculture, fleet)', 'url': 'https://ec.europa.eu/eurostat/web/fisheries', 'license': 'Eurostat reuse policy (Decision 2011/833/EU); cite source'}
NOTE_TOP = 'Main species chosen by Dehesa Index from the latest published figure; the selection can change from one year to the next.'
AREA = {'21': 'Northwest Atlantic', '27': 'Northeast Atlantic', '34': 'Eastern Central Atlantic', '37': 'Mediterranean and Black Sea', '41': 'Southwest Atlantic',
        '47': 'Southeast Atlantic', '51': 'Western Indian Ocean', '57': 'Eastern Indian Ocean', '61': 'Northwest Pacific', '67': 'Northeast Pacific', '71': 'Western Central Pacific',
        '77': 'Eastern Central Pacific', '81': 'Southwest Pacific', '87': 'Southeast Pacific', '4': 'Inland waters'}
UNIT = {'TLW': ('t live weight', 'tonnes live weight'), 'TPW': ('t product weight', 'tonnes product weight'), 'EUR': ('EUR', 'EUR'), 'EUR_T': ('EUR/t', 'EUR per tonne')}
AGEB = {'Y_LT5': 'under 5 years', 'Y5-9': '5 to 9 years', 'Y10-14': '10 to 14 years', 'Y15-19': '15 to 19 years', 'Y20-24': '20 to 24 years', 'Y_GE25': '25 years or over'}
def put(sid, *a, **k): return E.put(E.CFG['pfx'] + '-fish-' + sid, *a, **k)
def agg(code): return bool(re.fullmatch(r'F\d{2,3}', code))
def name(labs, dim, code):
    """nombre comun de la especie: Eurostat da 'Nombre cientifico (Nombre comun(=sinonimo))'; se queda el comun sin el sinonimo"""
    s = re.sub(r'\s+', ' ', labs[dim].get(code, code)).strip()
    m = re.match(r'^[^()]*?\s\((.*)\)$', s)
    if m: s = m.group(1)
    s = re.sub(r'\s*\(=[^)]*\)', '', s).strip()
    return s[:1].upper() + s[1:].lower() if s.isupper() else s[:1].upper() + s[1:]
def series(recs, key):
    by = {}
    for r, v in recs:
        k = key(r)
        if k is not None: by.setdefault(k, []).append((r['time'], v))
    return by
def top(by, unit, n):
    """especies (no agregados) ordenadas por la cifra del ultimo ano publicado"""
    last = max((p for (sp, u), pts in by.items() for p, _ in pts), default=None)
    rank = [(v, sp) for (sp, u), pts in by.items() if u == unit and not agg(sp) for p, v in pts if p == last and v]
    return [sp for v, sp in sorted(rank, reverse=True)[:n]]
def catches():
    recs, labs = E.es('fish_ca_main', unit='TLW', sinceTimePeriod='2000'); n = 0
    by = series(recs, lambda r: (r['species'], r['fishreg']))
    p = by.get(('F00', '0'))
    if p: n += put('ca-total', 'fish', 'Fish catches: total (tonnes live weight, Eurostat)', 't live weight', 'annual', p, 'Eurostat fish_ca_main F00')
    for (sp, reg), pts in by.items():
        if sp == 'F00' and reg in AREA:
            n += put('ca-area-' + reg, 'fish', 'Fish catches: %s (tonnes live weight, Eurostat)' % AREA[reg], 't live weight', 'annual', pts, 'Eurostat fish_ca_main F00 area %s' % reg)
    sp_by = {(sp, 'TLW'): pts for (sp, reg), pts in by.items() if reg == '0'}
    for sp in top(sp_by, 'TLW', 8):
        n += put('ca-sp-' + sp.lower(), 'fish', 'Fish catches: %s (tonnes live weight, Eurostat)' % name(labs, 'species', sp), 't live weight', 'annual', sp_by[(sp, 'TLW')],
                 'Eurostat fish_ca_main %s' % sp, note=NOTE_TOP)
    E.log(E.CFG['geo'], 'capturas', n)
def landings():
    recs, labs = E.es('fish_ld_main', pres='TOTAL', natvessr='TOTAL', dest_use='TOTAL'); n = 0
    by = series(recs, lambda r: (r['species'], r['unit']) if r['unit'] in UNIT else None)
    for u in ('EUR', 'TPW', 'EUR_T'):
        p = by.get(('F00', u))
        if p: n += put('ld-total-' + u.lower(), 'fish', 'Fish landings: total, %s (Eurostat)' % ('value' if u == 'EUR' else 'quantity' if u == 'TPW' else 'average first-sale price'), UNIT[u][0], 'annual', p, 'Eurostat fish_ld_main F00 %s' % u,
                       note='Average price = value / quantity of all landings, as published by Eurostat.' if u == 'EUR_T' else None)
    for sp in top(by, 'EUR', 8):
        nm = name(labs, 'species', sp)
        for u in ('EUR', 'TPW', 'EUR_T'):
            p = by.get((sp, u))
            if p: n += put('ld-sp-%s-%s' % (sp.lower(), u.lower()), 'fish', 'Fish landings: %s, %s (Eurostat)' % (nm, 'value' if u == 'EUR' else 'quantity' if u == 'TPW' else 'first-sale price'), UNIT[u][0], 'annual', p,
                           'Eurostat fish_ld_main %s %s' % (sp, u), note=NOTE_TOP)
    E.log(E.CFG['geo'], 'desembarques', n)
def aquaculture():
    recs, labs = E.es('fish_aq2a', aquameth='TOTAL', aquaenv='TOTAL', fishreg='0'); n = 0
    by = series(recs, lambda r: (r['species'], r['unit']) if r['unit'] in UNIT else None)
    for u in ('TLW', 'EUR', 'EUR_T'):
        p = by.get(('F00', u))
        if p: n += put('aq-total-' + u.lower(), 'fish', 'Aquaculture production: total, %s (Eurostat)' % ('quantity' if u == 'TLW' else 'value' if u == 'EUR' else 'average price'), UNIT[u][0], 'annual', p, 'Eurostat fish_aq2a F00 %s' % u)
    for sp in top(by, 'TLW', 6):
        nm = name(labs, 'species', sp)
        for u in ('TLW', 'EUR_T'):
            p = by.get((sp, u))
            if p: n += put('aq-sp-%s-%s' % (sp.lower(), u.lower()), 'fish', 'Aquaculture production: %s, %s (Eurostat)' % (nm, 'quantity' if u == 'TLW' else 'price'), UNIT[u][0], 'annual', p,
                           'Eurostat fish_aq2a %s %s' % (sp, u), note=NOTE_TOP)
    E.log(E.CFG['geo'], 'acuicultura', n)
def fleet():
    recs, labs = E.es('fish_fleet_alt', tonnage='TOTAL', length='TOTAL'); n = 0
    by = series(recs, lambda r: (r['age'], r['unit']))
    U = {'NR': ('vessels', 'number of vessels'), 'GT': ('GT', 'gross tonnage'), 'KW': ('kW', 'engine power')}
    for u, (un, txt) in U.items():
        p = by.get(('TOTAL', u))
        if p: n += put('fleet-' + u.lower(), 'fish', 'Fishing fleet: %s (Eurostat)' % txt, un, 'annual', p, 'Eurostat fish_fleet_alt TOTAL %s' % u)
    for a, txt in AGEB.items():
        p = by.get((a, 'NR'))
        if p: n += put('fleet-age-' + a.lower(), 'fish', 'Fishing fleet: vessels aged %s (number, Eurostat)' % txt, 'vessels', 'annual', p, 'Eurostat fish_fleet_alt %s NR' % a)
    E.log(E.CFG['geo'], 'flota', n)
only = [a for a in sys.argv[1:] if a in C]
out = {}
for cc in (only or C):
    E.CFG = {'geo': GEO.get(cc, cc), 'pfx': cc.lower()}; E.OUT.clear()
    for fn in ((aquaculture, fleet) if cc in LANDLOCKED else (catches, landings, aquaculture, fleet)):
        try: fn()
        except Exception as e: E.log('ERROR', cc, fn.__name__, repr(e)[:300])
    E.log(cc, 'series', len(E.OUT))
    if len(E.OUT) >= 3: out[cc] = {'name': C[cc], 'extend': True, 'source': dict(SRC), 'series': sorted(E.OUT.values(), key=lambda s: s['id'])}
    else: E.log('sin datos suficientes', cc)
open('data/eurostat-fish-log.txt', 'w').write('\n'.join(E.LOG) + '\n')
if len(out) < 20: sys.exit('FALLO: pocos paises con datos de pesca (%d)' % len(out))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
json.dump({'schemaVersion': 1, 'generatedAt': now, 'countries': out, 'log': E.LOG[-30:]}, open('data/eurostat-fish-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('paises', len(out), 'series', sum(len(v['series']) for v in out.values()))
