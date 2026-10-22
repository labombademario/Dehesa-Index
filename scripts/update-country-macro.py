#!/usr/bin/env python3
"""Indicadores macro por país: Banco Mundial (PIB, PIB per cápita, población, paro, peso agrario) y FMI DataMapper (deuda/PIB)."""
import json, os, sys, time, datetime, urllib.request

WB = {'US': 'USA', 'ES': 'ESP', 'FR': 'FRA', 'DE': 'DEU', 'BE': 'BEL', 'AT': 'AUT', 'PT': 'PRT', 'IT': 'ITA', 'DK': 'DNK', 'NL': 'NLD', 'CA': 'CAN', 'AU': 'AUS', 'EU': 'EUU',
      'BG': 'BGR', 'CY': 'CYP', 'CZ': 'CZE', 'EE': 'EST', 'EL': 'GRC', 'FI': 'FIN', 'HR': 'HRV', 'HU': 'HUN', 'IE': 'IRL', 'LT': 'LTU', 'LU': 'LUX', 'LV': 'LVA', 'MT': 'MLT', 'PL': 'POL', 'RO': 'ROU', 'SE': 'SWE', 'SI': 'SVN', 'SK': 'SVK', 'UK': 'GBR', 'AR': 'ARG', 'CH': 'CHE', 'CL': 'CHL', 'UY': 'URY'}
IND = {'gdp': 'NY.GDP.MKTP.CD', 'gdppc': 'NY.GDP.PCAP.CD', 'pop': 'SP.POP.TOTL', 'unemp': 'SL.UEM.TOTL.ZS', 'agri': 'NV.AGR.TOTL.ZS', 'cons': 'NE.CON.PRVT.ZS',
       'gdpLc': 'NY.GDP.MKTP.CN', 'gdppcLc': 'NY.GDP.PCAP.CN'}   # *Lc: PIB y PIB per capita en moneda local corriente (zona euro: euros), el mismo dato del Banco Mundial sin pasar por dolares
CUR = {'US': 'USD'}
CUR.update({c: 'EUR' for c in ['ES', 'FR', 'DE', 'BE', 'AT', 'PT', 'IT', 'NL', 'EU', 'BG', 'CY', 'EE', 'EL', 'FI', 'HR', 'IE', 'LT', 'LU', 'LV', 'MT', 'SI', 'SK']})  # Bulgaria usa el euro desde 2026-01-01 (Croacia desde 2023)
CUR.update({'DK': 'DKK', 'CA': 'CAD', 'AU': 'AUD', 'CZ': 'CZK', 'HU': 'HUF', 'PL': 'PLN', 'RO': 'RON', 'SE': 'SEK', 'UK': 'GBP', 'AR': 'ARS', 'CH': 'CHF', 'CL': 'CLP', 'UY': 'UYU'})
LOG = []

def log(m):
    LOG.append(datetime.datetime.utcnow().strftime('%H:%M:%S ') + m); print(m)

def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'DehesaIndex/1.0'}), timeout=40) as r:
                return json.load(r)
        except Exception as e:
            log('  error %s: %s' % (url[:90], e)); time.sleep(2)
    return None

out = {c: {'currency': CUR[c]} for c in WB}
for k, code in IND.items():
    d = get('https://api.worldbank.org/v2/country/%s/indicator/%s?format=json&mrnev=1&per_page=200' % (';'.join(WB.values()), code))
    n = 0
    if d and len(d) > 1 and d[1]:
        inv = {v: c for c, v in WB.items()}
        for r in d[1]:
            c = inv.get(r['countryiso3code'])
            if c and r.get('value') is not None:
                if k.endswith('Lc'):
                    # Bulgaria: el Banco Mundial da 2025 en leva; entra en el euro en 2026, se toma de Eurostat (en euros). Dolares ya estan en gdp/gdppc.
                    if CUR[c] == 'USD' or c == 'BG': continue
                    out[c][k] = {'v': r['value'], 'y': int(r['date']), 'cur': CUR[c], 'src': 'world_bank_wdi'}; n += 1; continue
                out[c][k] = {'v': r['value'], 'y': int(r['date'])}; n += 1
    log('%s: %d paises' % (k, n))
# deuda pública bruta / PIB: FMI; si falla, Eurostat (UE) y Banco Mundial (gobierno central, Canadá y Australia)
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
def get_ua(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'}), timeout=40) as r:
            return json.load(r)
    except Exception as e:
        log('  error %s: %s' % (url[:90], e)); return None
# PIB en euros de Eurostat (cuentas nacionales, precios corrientes) para los paises del euro que el Banco Mundial no trae en moneda local (agregado UE, Bulgaria)
def _eurostat_last(url, geo):
    d = get_ua(url % geo)
    try:
        tpos = d['dimension']['time']['category']['index']; inv_t = {v: k for k, v in tpos.items()}
        vals = {inv_t[int(i)]: v for i, v in d['value'].items() if v is not None}
        y = max(vals); return vals[y], int(y)
    except Exception: return None
_ne = 0
for c in WB:
    if CUR[c] != 'EUR': continue
    geo = 'EU27_2020' if c == 'EU' else c
    if 'gdpLc' not in out[c]:
        r = _eurostat_last('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_gdp?format=JSON&lang=EN&unit=CP_MEUR&na_item=B1GQ&sinceTimePeriod=2022&geo=%s', geo)
        if r: out[c]['gdpLc'] = {'v': r[0] * 1e6, 'y': r[1], 'cur': 'EUR', 'src': 'eurostat'}; _ne += 1
    if 'gdppcLc' not in out[c]:
        r = _eurostat_last('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_pc?format=JSON&lang=EN&unit=CP_EUR_HAB&na_item=B1GQ&sinceTimePeriod=2022&geo=%s', geo)
        if r: out[c]['gdppcLc'] = {'v': r[0], 'y': r[1], 'cur': 'EUR', 'src': 'eurostat'}; _ne += 1
log('PIB en euros desde Eurostat (huecos del Banco Mundial): %d valores' % _ne)
inv = {v: c for c, v in WB.items()}
n = 0
cy = datetime.date.today().year
for c, iso in WB.items():
    if c == 'EU': continue
    d = get_ua('https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP/' + iso)
    ser = (d or {}).get('values', {}).get('GGXWDG_NGDP', {}).get(iso, {})
    yrs = [int(y) for y in ser if int(y) <= cy - 1 and ser[y] is not None]
    if yrs:
        y = max(yrs); out[c]['debt'] = {'v': ser[str(y)], 'y': y, 'src': 'imf'}; n += 1
log('debt FMI: %d paises' % n)
for c in WB:
    if 'debt' in out[c]: continue
    if c in ('CA', 'AU', 'US', 'UK', 'AR', 'CH', 'CL', 'UY'):
        d = get('https://api.worldbank.org/v2/country/%s/indicator/GC.DOD.TOTL.GD.ZS?format=json&mrnev=1' % WB[c])
        r = d[1][0] if d and len(d) > 1 and d[1] else None
        if r and r.get('value') is not None:
            out[c]['debt'] = {'v': r['value'], 'y': int(r['date']), 'src': 'wb-central'}; log('debt %s WB central' % c)
    else:
        geo = 'EU27_2020' if c == 'EU' else c
        d = get('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10dd_edpt1?format=JSON&lang=EN&geo=%s&unit=PC_GDP&sector=S13&na_item=GD&sinceTimePeriod=2020' % geo)
        try:
            tpos = d['dimension']['time']['category']['index']; inv_t = {v: k for k, v in tpos.items()}
            vals = {inv_t[int(i)]: v for i, v in d['value'].items()}
            y = max(vals); out[c]['debt'] = {'v': vals[y], 'y': int(y), 'src': 'eurostat'}; log('debt %s Eurostat %s' % (c, y))
        except Exception as e:
            log('debt %s sin dato (%s)' % (c, e))

# salario mediano horario armonizado (Eurostat SES, cada 4 años)
geos = [c for c in WB if c not in ('US', 'CA', 'AU', 'UK', 'AR', 'CH', 'CL', 'UY')]
d = get('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/earn_ses_pub2s?format=JSON&lang=EN&sex=T&unit=EUR&sizeclas=GE10&sinceTimePeriod=2018&' + '&'.join('geo=' + ('EU27_2020' if g == 'EU' else g) for g in geos))
try:
    dim = d['dimension']; ids = d['id']; sizes = d['size']
    gi = dim['geo']['category']['index']; ti = dim['time']['category']['index']
    gpos = ids.index('geo'); tpos = ids.index('time')
    inv_t = {v: k for k, v in ti.items()}
    got = {}
    for key, val in d['value'].items():
        idx = int(key); coords = []
        for sz in reversed(sizes): coords.append(idx % sz); idx //= sz
        coords.reverse()
        g = [k for k, v in gi.items() if v == coords[gpos]][0]; y = inv_t[coords[tpos]]
        if g not in got or y > got[g][0]: got[g] = (y, val)
    for g, (y, v) in got.items():
        c = 'EU' if g == 'EU27_2020' else g
        if c in out: out[c]['wageh'] = {'v': v, 'y': int(y), 'cur': 'EUR'}
    log('wageh Eurostat: %d paises' % len(got))
except Exception as e:
    log('wageh sin dato: %s' % e)
# inflación interanual: de data/cpi.json (sin red); los países que solo tienen inflación se anaden tal cual
try:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
    import macro_infl
    _n = macro_infl.patch({'countries': out}, json.load(open('data/cpi.json')))
    log('infl: %d paises' % _n)
except Exception as e:
    log('infl sin dato: %s' % e)
# Argentina: sondeo (solo log) de las series de datos.gob.ar (INDEC y Ministerio de Economia) para inflacion y deuda publica; no se usa ningun valor hasta confirmar el identificador en el log
def _probe_ar():
    base = 'https://apis.datos.gob.ar/series/api/'
    try:
        d = get(base + 'series/?ids=148.3_INIVELNAL_DICI_M_26&limit=14&sort=desc&format=json')
        meta = ((d or {}).get('meta') or [{}])[1:2]
        log('sondeo AR IPC 148.3_INIVELNAL_DICI_M_26: %s | meta %s' % (((d or {}).get('data') or [])[:3], json.dumps(meta, ensure_ascii=False)[:300]))
    except Exception as e: log('sondeo AR IPC: fallo %s' % e)
    for q in ('deuda bruta administracion central', 'deuda publica porcentaje PIB', 'deuda administracion publica nacional'):
        try:
            d = get(base + 'search/?q=' + urllib.parse.quote(q) + '&limit=6')
            for r in (d or {}).get('data', [])[:6]:
                f = r.get('field', {}); ds = r.get('dataset', {})
                log('sondeo AR "%s": %s | %s | %s | %s..%s | %s' % (q, f.get('id'), (f.get('title') or '')[:70], f.get('units'), f.get('time_index_start'), f.get('time_index_end'), (ds.get('publisher') or {}).get('name') if isinstance(ds.get('publisher'), dict) else ds.get('source')))
        except Exception as e: log('sondeo AR "%s": fallo %s' % (q, e))
try:
    import urllib.parse
    _probe_ar()
except Exception as e: log('sondeo AR: %s' % e)
# autocomprobacion con el mismo contrato que valida la CI: deja en el log cada incoherencia para poder corregirla sin adivinar
try:
    import contract_tests as _ct
    _e, _w, _st = [], [], {}
    _ct.country_macro({'countries': out}, _e, _w, _st)
    for m in _e: log('contrato: ' + m)
    log('contrato: %d errores, completos %s' % (len(_e), _st.get('macro completos')))
except Exception as e:
    log('contrato: no se pudo comprobar (%s)' % e)
tot = sum(len(v) - 1 for v in out.values())
os.makedirs('data', exist_ok=True)
open('data/country-macro-log.txt', 'w').write('\n'.join(LOG) + '\n')
if tot < 40:
    log('muy pocos datos'); open('data/country-macro-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
json.dump({'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'sources': {'wb': {'name': 'World Bank Open Data', 'url': 'https://data.worldbank.org/', 'license': 'CC BY 4.0'},
                       'imf': {'name': 'IMF DataMapper (WEO)', 'url': 'https://www.imf.org/external/datamapper', 'license': 'IMF terms of use'}, 'eurostat': {'name': 'Eurostat (gov_10dd_edpt1)', 'url': 'https://ec.europa.eu/eurostat/', 'license': 'CC BY 4.0'}},
           'countries': out}, open('data/country-macro.json', 'w'), ensure_ascii=False, indent=1)
