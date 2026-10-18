#!/usr/bin/env python3
"""EE. UU.: tipos de interes de los prestamos agrarios de la USDA Farm Service Agency (FSA) -> data/us-fsa-rates-stats.json (countries.US, extend).
Tipos mensuales de los prestamos directos de la FSA: campana (operating), compra de tierra (ownership), financiacion conjunta, entrada (down payment),
microcreditos y prestamos de emergencia. Dominio publico (obra del Gobierno de EE. UU.); se cita "U.S. Department of Agriculture, Farm Service Agency".
Fuentes oficiales (no se inventa ningun valor ni se interpola ningun mes):
  - tipos vigentes: https://www.fsa.usda.gov/tools/informational/rates/current-fsa-loan-interest-rates ("Effective as of <mes> 1, <anio>")
  - historico: notas de prensa mensuales "USDA Announces <Month> <Year> Lending Rates for Agricultural Producers"
    (/news-events/news/MM-DD-YYYY/usda-announces-<month>-<year>-lending-rates-agricultural-producers, DD = primer dia habil).
El historico solo se rellena cuando faltan meses (primera ejecucion o huecos); cada mes basta con la pagina de tipos vigentes.
La web de la FSA tiene un cortafuegos (Akamai) que corta rafagas: una peticion cada pocos segundos y se para tras varios 403 seguidos.
Un fallo no borra lo anterior."""
import datetime, html, json, re, sys, time, urllib.error, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/us-fsa-rates-stats.json'; LOGF = ROOT / 'data/us-fsa-rates-log.txt'
BASE = 'https://www.fsa.usda.gov'
CURRENT = BASE + '/tools/informational/rates/current-fsa-loan-interest-rates'
START = (2019, 1)
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) dehesaindex.com-pipeline (+https://dehesaindex.com)', 'Accept': 'text/html,*/*'}
MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
NUM = r'([0-9]{1,2}\.[0-9]{1,3})\s*(?:%|percent)'
# (id, etiqueta, patron). El orden importa: "Direct, Joint Financing" no debe contar como "Direct".
SERIES = [
    ('us-fsa-rate-operating-direct', 'Farm operating loan, direct: interest rate (USDA FSA)', r'Farm Operating(?: Loans?)?\s*[-–(:]*\s*Direct\)?\s*[:\-–]?\s*' + NUM),
    ('us-fsa-rate-operating-microloan', 'Farm operating microloan: interest rate (USDA FSA)', r'Farm Operating(?: Loans?)?\s*[-–(:]*\s*Microloans?\)?\s*[:\-–]?\s*' + NUM),
    ('us-fsa-rate-ownership-direct', 'Farm ownership loan, direct: interest rate (USDA FSA)', r'Farm Ownership(?: Loans?)?\s*[-–(:]*\s*Direct\)?\s*[:\-–]?\s*' + NUM),
    ('us-fsa-rate-ownership-joint', 'Farm ownership loan, direct joint financing: interest rate (USDA FSA)', r'Joint Financing\)?\s*[:\-–]?\s*' + NUM),
    ('us-fsa-rate-ownership-down-payment', 'Farm ownership loan, down payment: interest rate (USDA FSA)', r'Down Payment\)?\s*[:\-–]?\s*' + NUM),
    ('us-fsa-rate-emergency', 'Emergency loan (amount of actual loss): interest rate (USDA FSA)', r'Emergency Loans?\s*[-–(:]*\s*(?:\(?Amount of Actual Loss\)?)?\s*[:\-–]?\s*' + NUM),
]
class Blocked(Exception): pass
def get(u):
    req = urllib.request.Request(u, headers=H)
    try:
        with urllib.request.urlopen(req, timeout=60) as r: return r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        if e.code == 404: return None
        if e.code in (403, 429): raise Blocked('%s %s' % (e.code, u))
        raise
def text(page):
    page = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', page)
    page = re.sub(r'(?i)<br\s*/?>|</(p|li|tr|td|th|div|h\d)>', '\n', page)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', page)).replace('\xa0', ' ')
    return re.sub(r'[ \t]+', ' ', t)
def parse(t):
    out = {}
    for sid, _, pat in SERIES:
        m = re.search(pat, t, re.I)
        if m:
            v = float(m.group(1))
            if 0 < v < 25: out[sid] = v
    return out
def parse_current():
    page = get(CURRENT)
    if page is None: raise SystemExit('pagina de tipos vigentes no encontrada (404): ' + CURRENT)
    t = text(page)
    m = re.search(r'Effective (?:as of )?([A-Z][a-z]+) (\d{1,2}), (\d{4})', t)
    if not m: raise SystemExit('sin fecha de vigencia en la pagina de tipos vigentes')
    mon = MONTHS.index(m.group(1).lower()) + 1
    period = '%s-%02d' % (m.group(3), mon)
    vals = parse(t)
    log('vigentes', period, vals)
    return period, vals
def release(y, mo):
    """Nota de prensa del mes: prueba los primeros dias habiles (1 a 6). Devuelve (url, valores) o (None, {})."""
    for d in range(1, 7):
        if datetime.date(y, mo, d).weekday() >= 5: continue
        u = '%s/news-events/news/%02d-%02d-%d/usda-announces-%s-%d-lending-rates-agricultural-producers' % (BASE, mo, d, y, MONTHS[mo - 1], y)
        time.sleep(3)
        page = get(u)
        if page is None: continue
        t = text(page)
        # Solo la parte de prestamos de explotacion; los tipos de commodity y almacenamiento (CCC) no se usan aqui.
        cut = re.search(r'Commodity and Storage|Commodity Loans', t, re.I)
        return u, parse(t[:cut.start()] if cut else t)
    return None, {}
def load():
    if not OUT.exists(): return {}
    try:
        d = json.loads(OUT.read_text())
        return {s['id']: {p: v for p, v in s['points']} for s in d['countries']['US']['series']}
    except Exception as e:
        log('fichero previo ilegible', e); return {}
def months(a, b):
    y, m = a
    while (y, m) <= b:
        yield y, m
        m += 1
        if m == 13: y, m = y + 1, 1
def main():
    pts = load()
    for sid, _, _ in SERIES: pts.setdefault(sid, {})
    period, vals = parse_current()
    if len(vals) < 4: raise SystemExit('la pagina de tipos vigentes no trae los tipos esperados: %s' % vals)
    for k, v in vals.items(): pts[k][period] = v
    cy, cm = int(period[:4]), int(period[5:])
    have = set(pts['us-fsa-rate-operating-direct'])
    todo = [(y, m) for y, m in months(START, (cy, cm)) if '%d-%02d' % (y, m) not in have]
    log('meses sin dato desde %d-%02d:' % START, len(todo))
    blocked = 0; got = 0; miss = []
    for y, m in reversed(todo):
        try:
            u, v = release(y, m)
        except Blocked as e:
            blocked += 1; log('bloqueado', e)
            if blocked >= 3: log('demasiados 403 seguidos: se para el relleno y se sigue en la proxima ejecucion'); break
            time.sleep(30); continue
        blocked = 0
        p = '%d-%02d' % (y, m)
        if not v: miss.append(p); continue
        for k, x in v.items(): pts[k][p] = x
        got += 1; log(p, u.rsplit('/', 2)[-2], v)
    log('relleno: %d meses nuevos; sin nota o sin tipos: %s' % (got, ', '.join(sorted(miss)) or '-'))
    series = []
    for sid, label, _ in SERIES:
        p = sorted(pts[sid].items())
        if len(p) < 2: log('pocos datos', sid, len(p)); continue
        series.append({'id': sid, 'group': 'rates', 'label': label, 'unit': '%', 'frequency': 'monthly', 'latestPeriod': p[-1][0], 'latest': p[-1][1],
                       'changePct': None, 'points': [[a, b] for a, b in p], 'sourceGroup': 'USDA FSA farm loan interest rates',
                       'periodNote': 'Tipo fijado por la FSA para los prestamos aprobados ese mes (vigente desde el dia 1). Meses sin nota oficial localizada quedan sin dato.'})
    if not series: raise SystemExit('sin series')
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'US': {'name': 'United States', 'extend': True,
                                'source': {'name': 'USDA Farm Service Agency - Farm loan interest rates', 'url': CURRENT,
                                           'license': 'US Government work (public domain); cite U.S. Department of Agriculture, Farm Service Agency'},
                                'series': series}}}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    log('escrito', OUT.name, len(series), 'series', [(s['id'], len(s['points'])) for s in series])
if __name__ == '__main__':
    try: main()
    finally: LOGF.write_text('\n'.join(LOG) + '\n')
