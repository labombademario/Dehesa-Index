#!/usr/bin/env python3
"""EE. UU.: divisas de los paises con ficha y indice amplio del dolar (H.10), tipo prime y bono a 10 anos (H.15) de la Reserva Federal (Board of Governors), Programa de Descarga de Datos -> data/us-fed-stats.json (countries.US, extend).
Todo son series mensuales publicadas por el Board, salvo los rendimiento del Tesoro a 10 anos: el Board solo da el dato diario en ese paquete, y aqui se calcula la media aritmetica de los dias con dato de cada mes ya cerrado (se anota en periodNote). Sin estimaciones: un 'ND'/'NA' se omite. Un fallo no borra lo anterior."""
import collections, csv, datetime, io, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/us-fed-stats.json'; LOGF = ROOT / 'data/us-fed-log.txt'
UA = 'Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)'
BASE = 'https://www.federalreserve.gov/datadownload/Output.aspx?rel=%s&series=%s&lastobs=&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package'
FROM = '1990-01'
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s)
def fetch(rel, h, tries=3):
    err = None
    for k in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(BASE % (rel, h), headers={'User-Agent': UA}), timeout=90).read().decode('utf-8-sig', 'replace')
        except Exception as e: err = e; time.sleep(4 * (k + 1))
    log('ERROR', rel, h[:6], repr(err)[:140]); return None
def table(t):
    """-> {id_unico: [(periodo, valor)]} (omite ND/NA/vacios)."""
    rows = list(csv.reader(io.StringIO(t)))
    ids = next(r for r in rows if r and r[0].startswith('Unique Identifier'))
    out = {i: [] for i in ids[1:]}
    for r in rows:
        if r and re.fullmatch(r'\d{4}-\d{2}(-\d{2})?', r[0].strip()):
            for i, v in zip(ids[1:], r[1:]):
                try: out[i].append((r[0].strip(), float(v)))
                except ValueError: pass
    return out
# H.10 mensual: id -> (codigo, nombre ES/EN en etiqueta, forma de cotizacion)
FX = [('RXI$US_N.M.EU', 'eur', 'Euro area', 'USD per EUR'),
      ('RXI$US_N.M.UK', 'gbp', 'United Kingdom', 'USD per GBP'),
      ('RXI$US_N.M.AL', 'aud', 'Australia', 'USD per AUD'),
      ('RXI_N.M.CA', 'cad', 'Canada', 'CAD per USD'),
      ('RXI_N.M.DN', 'dkk', 'Denmark', 'DKK per USD'),
      ('RXI_N.M.SD', 'sek', 'Sweden', 'SEK per USD'),
      ('RXI_N.M.SZ', 'chf', 'Switzerland', 'CHF per USD')]  # solo las monedas de paises con ficha en Dehesa Index (euro, Reino Unido, Australia, Canada, Suiza, Dinamarca, Suecia); las demas divisas del H.10 se descartaron a proposito
IDX = [('JRXWTFB_N.M', 'broad', 'Nominal broad U.S. dollar index')]  # los indices frente a economias avanzadas y emergentes se descartaron: no aportan a la ficha
RATES = [('RIFSPBLP_N.M', 'prime', 'Bank prime loan rate (monthly average)')]  # referencia de los prestamos agricolas; letras, papel comercial y tipo de descuento se descartaron por irrelevantes
CMT = [('RIFLGFCY10_N.B', '10y', '10-year')]  # referencia de largo plazo; el resto de plazos se descartaron
NOTE_CMT = 'The Board publishes this series daily; the monthly value is the arithmetic mean of the daily values available in each closed calendar month (calculated by Dehesa Index).'
def find(tab, suffix):
    for k, v in tab.items():
        if k.endswith('/' + suffix): return v
    return None
def mk(sid, label, unit, pts, note=None):
    pts = [[p[:7], v] for p, v in pts if p[:7] >= FROM]
    if len(pts) < 24: log('pocos datos', sid, len(pts)); return None
    s = {'id': sid, 'group': 'rates', 'label': label, 'unit': unit, 'frequency': 'monthly', 'latestPeriod': pts[-1][0], 'latest': pts[-1][1], 'changePct': None, 'points': pts, 'sourceGroup': 'Federal Reserve Board'}
    if note: s['periodNote'] = note
    return s
def main():
    out = []
    t = fetch('H10', 'c5d6e0edf324b2fb28d73bcacafaaa02')
    if t:
        tab = table(t)
        for suf, cc, name, q in FX:
            p = find(tab, suf)
            if p: s = mk('us-fed-fx-' + cc, 'Exchange rate: %s (%s, monthly average)' % (name, q), q, p); s and out.append(s)
            else: log('falta', suf)
    t = fetch('H10', '847be2166a425bda9b4d92465f797544')
    if t:
        tab = table(t)
        for suf, cc, lab in IDX:
            p = find(tab, suf)
            if p: s = mk('us-fed-usd-' + cc, '%s (monthly average, Jan 1997 = 100)' % lab, 'index', p); s and out.append(s)
            else: log('falta', suf)
    t = fetch('H15', 'd7e27b7b09a3a7feae95b9c61781fcd8')
    if t:
        tab = table(t)
        for suf, cc, lab in RATES:
            p = find(tab, suf)
            if p: s = mk('us-fed-' + cc, lab, '%', p); s and out.append(s)
            else: log('falta', suf)
    t = fetch('H15', 'bf17364827e38702b42a58cf8eaa3f78')
    if t:
        tab = table(t); cur = datetime.date.today().strftime('%Y-%m')
        for suf, cc, lab in CMT:
            p = find(tab, suf)
            if not p: log('falta', suf); continue
            m = collections.defaultdict(list)
            for d, v in p:
                if d[:7] < cur: m[d[:7]].append(v)
            pts = [[k, round(sum(x) / len(x), 2)] for k, x in sorted(m.items())]
            s = mk('us-fed-cmt-' + cc, 'U.S. Treasury yield, constant maturity, %s (monthly mean of daily values)' % lab, '%', pts, NOTE_CMT); s and out.append(s)
    log('series', len(out))
    LOGF.write_text('\n'.join(LOG[-60:]) + '\n', encoding='utf-8')
    if len(out) < 8: log('demasiado pocas series; no se escribe'); sys.exit(1)
    src = {'name': 'Board of Governors of the Federal Reserve System (H.10 Foreign Exchange Rates, H.15 Selected Interest Rates)', 'url': 'https://www.federalreserve.gov/data.htm', 'license': 'Public domain (Federal Reserve Board; cite the Board as the source)'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'countries': {'US': {'name': 'United States', 'extend': True, 'source': src, 'series': out}}, 'log': LOG[-30:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
main()
