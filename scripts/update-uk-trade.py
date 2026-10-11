#!/usr/bin/env python3
"""Comercio exterior del Reino Unido por producto (HMRC, UK Trade Info OData API, Open Government Licence v3.0) -> data/uk-trade-stats.json (countries.UK, extend)
Fuente: https://api.uktradeinfo.com (tabla OTS, comercio con el mundo). La licencia (OGL v3.0, uso comercial permitido citando la fuente) y el limite de 60 peticiones por minuto
estan en https://www.uktradeinfo.com/api-documentation/ (leido el 6 oct 2026).
Por cada producto (capitulo o partida del Sistema Armonizado) se piden las sumas mensuales de peso neto (kg) por flujo y se agregan por ano natural COMPLETO:
  importaciones = flujos 1 (UE) + 3 (no UE); exportaciones = flujos 2 (UE) + 4 (no UE). kg -> t (/1000 exacto).
El ano en curso se omite (incompleto). Sin estimaciones: si una consulta falla o un mes falta, ese ano no se publica. Se limitan las peticiones a ~1 por segundo."""
import datetime, json, sys, time, urllib.parse, urllib.request
from collections import defaultdict
BASE = 'https://api.uktradeinfo.com/'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': 'application/json'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, t=180):
    last = None
    for i in range(3):
        try:
            time.sleep(1.1)
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return json.loads(r.read())
        except Exception as e: last = e; time.sleep(5)
    raise RuntimeError('%s -> %s' % (u[:120], last))
# (clave, nombre, desde, hasta): CommodityId = codigo CN8 como entero, asi que una partida es un intervalo [desde, hasta)
HS = (('fertilizer', 'Fertilisers (HS 31)', 31000000, 32000000), ('maize', 'Maize (HS 1005)', 10050000, 10060000), ('oats', 'Oats (HS 1004)', 10040000, 10050000),
      ('potato', 'Potatoes, fresh or chilled (HS 0701)', 7010000, 7020000), ('rice', 'Rice (HS 1006)', 10060000, 10070000), ('rye', 'Rye (HS 1002)', 10020000, 10030000),
      ('soy', 'Soya beans (HS 1201)', 12010000, 12020000), ('wine', 'Wine of fresh grapes (HS 2204)', 22040000, 22050000))
OUT = {}
def monthly(lo, hi, y0, y1):
    """{(mes, flujo): kg} del intervalo de producto entre dos anos naturales; sigue @odata.nextLink si lo hay."""
    flt = 'CommodityId ge %d and CommodityId lt %d and MonthId ge %d01 and MonthId le %d12' % (lo, hi, y0, y1)
    q = 'OTS?$apply=filter(%s)/groupby((MonthId,FlowTypeId),aggregate(NetMass with sum as nm))' % flt
    u = BASE + urllib.parse.quote(q, safe="/?$=&',()"); out = {}
    while u:
        j = get(u)
        for r in j.get('value', []):
            if r.get('nm') is not None: out[(r['MonthId'], r['FlowTypeId'])] = r['nm']
        u = j.get('@odata.nextLink')
    return out
# Socios comerciales: total agroalimentario (capitulos HS 01-24) por pais y flujo, valor en libras (OTS, Value), anual completo desde 2000.
AGRI = (1000000, 25000000)
FIX = {'Eire': 'Ireland', 'Irish Republic': 'Ireland', 'Republic of Ireland': 'Ireland', 'USA': 'United States', 'United States of America': 'United States'}
SKIP = ('unallocated', 'stores', 'provisions', 'confidential', 'not allocated', 'eu ', 'non-eu', 'non eu', 'extra', 'miscellaneous', 'unknown', 'undefined')
def partners(year):
    ctry = {}
    u = BASE + 'Country?$select=CountryId,CountryName,CountryCodeAlpha&$top=1000'
    while u:
        j = get(u)
        for r in j['value']: ctry[r['CountryId']] = (str(r.get('CountryCodeAlpha') or '').strip(), str(r.get('CountryName') or '').strip())
        u = j.get('@odata.nextLink')
    per = {'imp': defaultdict(dict), 'exp': defaultdict(dict)}
    for y in range(2000, year):
        q = 'OTS?$apply=filter(CommodityId ge %d and CommodityId lt %d and MonthId ge %d01 and MonthId le %d12)/groupby((CountryId,FlowTypeId),aggregate(Value with sum as v))' % (AGRI[0], AGRI[1], y, y)
        u = BASE + urllib.parse.quote(q, safe="/?$=&',()"); got = 0
        while u:
            j = get(u)
            for r in j.get('value', []):
                if r.get('v') is None: continue
                tag = 'imp' if r['FlowTypeId'] in (1, 3) else 'exp' if r['FlowTypeId'] in (2, 4) else None
                if not tag: continue
                d = per[tag][r['CountryId']]; d[y] = d.get(y, 0) + r['v'] / 1e6; got += 1
            u = j.get('@odata.nextLink')
        if not got: raise RuntimeError('sin datos de socios en %d' % y)
    n = 0
    for tag, word, wd in (('imp', 'Imports from', 'imports'), ('exp', 'Exports to', 'exports')):
        tot = defaultdict(float)
        for cid, d in per[tag].items():
            for y, v in d.items(): tot[y] += v
        pts = [[str(y), round(v, 3)] for y, v in sorted(tot.items())]
        if len(pts) >= 3 and int(pts[-1][0]) == year - 1:
            OUT['uk-hmrc-trade-agrifood-%s' % tag] = dict(id='uk-hmrc-trade-agrifood-%s' % tag, group='trade', label='Agri-food (HS 01-24): UK %s, world, value (HMRC)' % wd, unit='GBP million', frequency='annual', latestPeriod=pts[-1][0],
                latest=pts[-1][1], changePct=round((pts[-1][1] / pts[-2][1] - 1) * 100, 2) if pts[-2][1] else None, points=pts, sourceGroup='HMRC UK Trade Info OTS agrifood'); n += 1
        cand = []
        for cid, d in per[tag].items():
            code, name = ctry.get(cid, ('', ''))
            name = FIX.get(name, name)
            if not name or len(code) != 2 or any(k in name.lower() for k in SKIP) or not d.get(year - 1): continue
            cand.append((d[year - 1], code.lower(), name, d))
        for v, code, name, d in sorted(cand, reverse=True)[:10]:
            sid = 'uk-tp-%s-%s' % (tag, code)
            pts = [[str(y), round(x, 3)] for y, x in sorted(d.items())]
            if len(pts) < 3: continue
            OUT[sid] = dict(id=sid, group='partners', label='%s %s: agri-food, HS 01-24 (annual)' % (word, name), unit='GBP million (value)', frequency='annual', latestPeriod=pts[-1][0], latest=pts[-1][1],
                changePct=round((pts[-1][1] / pts[-2][1] - 1) * 100, 2) if pts[-2][1] else None, points=pts, sourceGroup='HMRC UK Trade Info OTS partners'); n += 1
    log('socios', n)
def main():
    year = datetime.date.today().year; n = 0
    for key, nm, lo, hi in HS:
        acc = {}
        try:
            for y0 in range(2000, year, 6):
                acc.update(monthly(lo, hi, y0, min(y0 + 5, year - 1)))
        except Exception as e: log('ERROR', key, repr(e)[:200]); continue
        for flows, tag, word in (((1, 3), 'imp', 'imports'), ((2, 4), 'exp', 'exports')):
            by = defaultdict(dict)
            for (m, f), v in acc.items():
                if f in flows: by[m // 100][m] = by[m // 100].get(m, 0) + v
            pts = []
            for y in sorted(by):
                if y >= year: continue
                if len(by[y]) == 12: pts.append([str(y), round(sum(by[y].values()) / 1000.0, 3)])   # solo anos con los 12 meses publicados
            if len(pts) < 3 or int(pts[-1][0]) < year - 3: log('descartada', key, tag, len(pts), 'puntos'); continue
            last, prev = pts[-1], pts[-2]
            OUT['uk-hmrc-trade-%s-%s' % (key, tag)] = dict(id='uk-hmrc-trade-%s-%s' % (key, tag), group='trade', label='%s: UK %s, world, net mass (HMRC)' % (nm, word), unit='t', frequency='annual', latestPeriod=last[0],
                latest=last[1], changePct=round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, points=pts, sourceGroup='HMRC UK Trade Info OTS %s' % key); n += 1
        log(key, 'ok')
    try: partners(year)
    except Exception as e: log('ERROR socios', repr(e)[:200])
    log('series', n)
    if n < 8:
        log('demasiado pocas series (%d); no se escribe nada' % n); open('data/uk-trade-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
    src = {'name': 'HM Revenue & Customs, UK Trade Info (OTS)', 'url': 'https://www.uktradeinfo.com/', 'license': 'Open Government Licence v3.0 (commercial use allowed; cite source)'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'UK': {'name': 'United Kingdom', 'extend': True, 'source': src, 'series': sorted(OUT.values(), key=lambda s: s['id'])}}, 'log': LOG[-30:]}
    json.dump(doc, open('data/uk-trade-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/uk-trade-log.txt', 'w').write('\n'.join(LOG) + '\n')
main()
