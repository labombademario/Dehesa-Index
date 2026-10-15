#!/usr/bin/env python3
"""EE. UU.: divisas (H.10), indices del dolar (H.10) y tipos de mercado (H.15) de la Reserva Federal (Board of Governors), Programa de Descarga de Datos -> data/us-fed-stats.json (countries.US, extend).
Todo son series mensuales publicadas por el Board, salvo los rendimientos del Tesoro a 2-30 anos: el Board solo da el dato diario en ese paquete, y aqui se calcula la media aritmetica de los dias con dato de cada mes ya cerrado (se anota en periodNote). Sin estimaciones: un 'ND'/'NA' se omite. Un fallo no borra lo anterior."""
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
FX = [('RXI$US_N.M.EU', 'eur', 'Euro area', 'USD per EUR'), ('RXI$US_N.M.UK', 'gbp', 'United Kingdom', 'USD per GBP'), ('RXI$US_N.M.AL', 'aud', 'Australia', 'USD per AUD'),
      ('RXI$US_N.M.NZ', 'nzd', 'New Zealand', 'USD per NZD'), ('RXI_N.M.BZ', 'brl', 'Brazil', 'BRL per USD'), ('RXI_N.M.CA', 'cad', 'Canada', 'CAD per USD'),
      ('RXI_N.M.CH', 'cny', 'China', 'CNY per USD'), ('RXI_N.M.DN', 'dkk', 'Denmark', 'DKK per USD'), ('RXI_N.M.HK', 'hkd', 'Hong Kong', 'HKD per USD'),
      ('RXI_N.M.IN', 'inr', 'India', 'INR per USD'), ('RXI_N.M.JA', 'jpy', 'Japan', 'JPY per USD'), ('RXI_N.M.MA', 'myr', 'Malaysia', 'MYR per USD'),
      ('RXI_N.M.MX', 'mxn', 'Mexico', 'MXN per USD'), ('RXI_N.M.NO', 'nok', 'Norway', 'NOK per USD'), ('RXI_N.M.SF', 'zar', 'South Africa', 'ZAR per USD'),
      ('RXI_N.M.SI', 'sgd', 'Singapore', 'SGD per USD'), ('RXI_N.M.KO', 'krw', 'South Korea', 'KRW per USD'), ('RXI_N.M.SL', 'lkr', 'Sri Lanka', 'LKR per USD'),
      ('RXI_N.M.SD', 'sek', 'Sweden', 'SEK per USD'), ('RXI_N.M.SZ', 'chf', 'Switzerland', 'CHF per USD'), ('RXI_N.M.TA', 'twd', 'Taiwan', 'TWD per USD'),
      ('RXI_N.M.TH', 'thb', 'Thailand', 'THB per USD')]  # Venezuela (VEF) se omite: moneda redenominada, la serie no es comparable
IDX = [('JRXWTFB_N.M', 'broad', 'Nominal broad U.S. dollar index'), ('JRXWTFN_N.M', 'afe', 'Nominal U.S. dollar index vs advanced foreign economies'), ('JRXWTFO_N.M', 'eme', 'Nominal U.S. dollar index vs emerging market economies')]
RATES = [('RIFSPBLP_N.M', 'prime', 'Bank prime loan rate (monthly average)'), ('RIFSRP_F02_N.M', 'primary-credit', 'Federal Reserve primary credit (discount window) rate, monthly average'),
         ('RIFSGFSW04_N.M', 'bill-4w', 'U.S. Treasury bill, secondary market, 4-week (monthly average)'), ('RIFSGFSM03_N.M', 'bill-3m', 'U.S. Treasury bill, secondary market, 3-month (monthly average)'),
         ('RIFSGFSM06_N.M', 'bill-6m', 'U.S. Treasury bill, secondary market, 6-month (monthly average)'), ('RIFSGFSY01_N.M', 'bill-1y', 'U.S. Treasury bill, secondary market, 1-year (monthly average)'),
         ('RIFSPPNAAD30_N.M', 'cp-nonfin-30', 'AA nonfinancial commercial paper, 30-day (monthly average)'), ('RIFSPPNAAD60_N.M', 'cp-nonfin-60', 'AA nonfinancial commercial paper, 60-day (monthly average)'),
         ('RIFSPPNAAD90_N.M', 'cp-nonfin-90', 'AA nonfinancial commercial paper, 90-day (monthly average)'), ('RIFSPPFAAD30_N.M', 'cp-fin-30', 'AA financial commercial paper, 30-day (monthly average)'),
         ('RIFSPPFAAD60_N.M', 'cp-fin-60', 'AA financial commercial paper, 60-day (monthly average)'), ('RIFSPPFAAD90_N.M', 'cp-fin-90', 'AA financial commercial paper, 90-day (monthly average)')]
CMT = [('RIFLGFCY02_N.B', '2y', '2-year'), ('RIFLGFCY03_N.B', '3y', '3-year'), ('RIFLGFCY05_N.B', '5y', '5-year'), ('RIFLGFCY07_N.B', '7y', '7-year'), ('RIFLGFCY10_N.B', '10y', '10-year'),
       ('RIFLGFCY20_N.B', '20y', '20-year'), ('RIFLGFCY30_N.B', '30y', '30-year')]
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
    if len(out) < 40: log('demasiado pocas series; no se escribe'); sys.exit(1)
    src = {'name': 'Board of Governors of the Federal Reserve System (H.10 Foreign Exchange Rates, H.15 Selected Interest Rates)', 'url': 'https://www.federalreserve.gov/data.htm', 'license': 'Public domain (Federal Reserve Board; cite the Board as the source)'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'countries': {'US': {'name': 'United States', 'extend': True, 'source': src, 'series': out}}, 'log': LOG[-30:]}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
main()
