#!/usr/bin/env python3
"""Lluvia y temperatura media mensual del Reino Unido, sus cuatro naciones y regiones climaticas -> data/uk-climate.json
Fuente: Met Office, series areales de HadUK-Grid ("UK and regional series", ficheros .txt ordenados por fecha; Open Government Licence v3.0).
Se guardan los valores mensuales desde 1991 tal como los publica el Met Office y, aparte, la media 1991-2020 de cada mes (calculada aqui).
Los porcentajes sobre lo normal y las anomalias los calcula la pagina (sequia.html) y se rotulan como calculo de Dehesa Index."""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.metoffice.gov.uk/pub/data/weather/uk/climate/datasets/%s/date/%s.txt'
REG = [('UK', 'UK'), ('England', 'ENG'), ('Wales', 'WAL'), ('Scotland', 'SCO'), ('Northern_Ireland', 'NIR'),
       ('England_N', 'ENG_N'), ('England_S', 'ENG_S'), ('England_E_and_NE', 'ENG_ENE'), ('England_NW_and_N_Wales', 'ENG_NW'), ('England_SW_and_S_Wales', 'ENG_SW'),
       ('England_SE_and_Central_S', 'ENG_SE'), ('Midlands', 'MID'), ('East_Anglia', 'EAN'), ('Scotland_N', 'SCO_N'), ('Scotland_E', 'SCO_E'), ('Scotland_W', 'SCO_W')]
VARS = [('Rainfall', 'rain'), ('Tmean', 'tmean')]
FROM = 1991   # basta para la media 1991-2020 y mantiene el fichero ligero
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}), timeout=90) as r: return r.read().decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            last = e
        except Exception as e: last = e
        time.sleep(4 * (i + 1))
    raise RuntimeError('%s: %s' % (u, last))
def parse(t):
    """Columnas por posicion: en la fila del ano en curso los meses aun no publicados van en blanco y las columnas de estaciones si traen valor,
    asi que se casa cada valor con la columna de la cabecera que termina en la misma posicion (los numeros van alineados a la derecha)."""
    pts, upd, ends = [], None, None
    m = re.search(r'Last updated (\d{2}-[A-Za-z]{3}-\d{4})', t)
    if m: upd = datetime.datetime.strptime(m.group(1), '%d-%b-%Y').date().isoformat()
    MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    for line in t.splitlines():
        if re.match(r'^\s*year\s', line, re.I):
            ends = {mm.end(): mm.group(0).lower() for mm in re.finditer(r'\S+', line)}; continue
        if not ends or not re.match(r'^\s*\d{4}\s', line): continue
        y = int(line.split()[0])
        if y < FROM: continue
        for mm in re.finditer(r'\S+', line):
            col = ends.get(mm.end())
            if col not in MON or mm.group(0) == '---': continue
            try: pts.append(['%d-%02d' % (y, MON.index(col) + 1), float(mm.group(0))])
            except ValueError: pass
    pts.sort()
    return pts, upd
def normals(pts):
    acc = {}
    for p, v in pts:
        y, m = int(p[:4]), int(p[5:])
        if 1991 <= y <= 2020: acc.setdefault(m, []).append(v)
    return [round(sum(acc[m]) / len(acc[m]), 2) if len(acc.get(m, [])) == 30 else None for m in range(1, 13)]
def main():
    out, upd = {}, None
    for name, key in REG:
        r = {'file': name}
        for v, k in VARS:
            t = get(BASE % (v, name))
            if t is None: log('no existe', v, name); continue
            pts, u = parse(t); upd = max(upd or '', u or '')
            # la fila del ano en curso: los valores vacios son meses aun no publicados, no huecos intermedios
            r[k] = pts; r[k + 'Normal'] = normals(pts)
        if 'rain' in r: out[key] = r; log(key, len(r['rain']), r['rain'][-1], r.get('tmean', [[None]])[-1])
    if 'UK' not in out or len(out) < 5: raise SystemExit('muy pocas regiones (%d): no se toca el fichero' % len(out))
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'source': {'name': 'Met Office, HadUK-Grid UK and regional series (monthly rainfall and mean temperature)', 'url': 'https://www.metoffice.gov.uk/climate/uk/summaries/datasets',
                      'license': 'Open Government Licence v3.0', 'updated': upd},
           'units': {'rain': 'mm', 'tmean': 'degC'}, 'normalPeriod': '1991-2020', 'regions': out}
    p = ROOT / 'data' / 'uk-climate.json'
    try:
        o = json.loads(p.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = dict(doc); n.pop('generatedAt')
        if o == n: log('sin cambios')
        else: p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    except Exception: p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (ROOT / 'data' / 'uk-climate-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
if __name__ == '__main__': main()
