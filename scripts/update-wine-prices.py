#!/usr/bin/env python3
"""Precio del vino a granel -> data/wine-prices.json
- España: Boletín semanal de precios del vino (MAPA, PDF; precio medio semanal nacional del vino blanco y del vino tinto, €/hl).
  Se leen los boletines de las campañas 2022/23 en adelante; los ya leidos no se vuelven a bajar.
- Francia: precios medios de compra a granel comunicados a la Comisión Europea (FranceAgriMer / VISIONet, Licence Ouverte 2.0), €/hl, mensual desde 2009/10:
  rojos/rosados y blancos, AOP, IGP, sin IG con mencion de variedad y sin IG sin mencion.
No se estima nada: lo que la fuente marca como no disponible o no significativo queda como hueco.
Uso: python3 scripts/update-wine-prices.py"""
import datetime, io, json, re, sys, time, urllib.error, urllib.request, urllib.parse, http.cookiejar
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'wine-prices.json'
LOG = ROOT / 'data' / 'wine-prices-log.txt'
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) DehesaIndex/1.0 (+https://dehesaindex.com)'}
MAPA = 'https://www.mapa.gob.es'
MAPA_PAGE = MAPA + '/es/agricultura/temas/producciones-agricolas/vitivinicultura/boletines_semanales_precio_vino/boletines_semanales_precio_vino_%d_%d'
FIRST_CAMP = 2022
LOGS = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOGS.append(s); print(s, flush=True)
def get(url, tries=3, timeout=180):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404: raise
            last = e; time.sleep(4 * (i + 1))
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError('%s -> %s' % (url, str(last)[:160]))

# ---------------- España ----------------
def num(s): return float(s.replace('.', '').replace(',', '.')) if ',' in s and '.' in s else float(s.replace(',', '.'))
def parse_bulletin(b):
    import pdfplumber
    with pdfplumber.open(io.BytesIO(b)) as pdf:
        txt = '\n'.join((pg.extract_text() or '') for pg in pdf.pages[:4])
    t = re.sub(r'\s+', ' ', txt)
    m = re.search(r'SEMANA\s+(\d{1,2})\s*/\s*(\d{4})', t)
    if not m: return None
    wk, yr = int(m.group(1)), int(m.group(2))
    w = re.search(r'precio medio del vino blanco (?:esta semana )?es de ([\d.,]+) ?€/hl', t, re.I)
    r = re.search(r'precio medio del vino tinto (?:esta semana )?es de ([\d.,]+) ?€/hl', t, re.I)
    if not w or not r: return None
    mon = datetime.date.fromisocalendar(yr, wk, 1)
    return {'from': mon.isoformat(), 'to': (mon + datetime.timedelta(days=6)).isoformat(), 'week': '%d/%d' % (wk, yr), 'white': num(w.group(1)), 'red': num(r.group(1))}
def spain(old):
    import pdfplumber  # noqa
    pts = {p['to']: p for p in (old or {}).get('weeks', [])}
    done = set((old or {}).get('files', []))
    today = datetime.date.today(); camp_now = today.year if today.month >= 8 else today.year - 1
    new = 0; fails = []
    for camp in range(FIRST_CAMP, camp_now + 1):
        try: html = get(MAPA_PAGE % (camp, camp + 1)).decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            log('MAPA campaña %d/%d: sin pagina (%s)' % (camp, camp + 1, e.code)); continue
        links = sorted(set(re.findall(r'href="([^"]+\.pdf)"', html)))
        links = [l for l in links if 'boletin' in l.lower() and 'vino' in l.lower()]
        log('MAPA campaña %d/%d: %d boletines' % (camp, camp + 1, len(links)))
        for l in links:
            if l in done: continue
            try:
                p = parse_bulletin(get(MAPA + l if l.startswith('/') else l))
            except Exception as e: fails.append((l, str(e)[:80])); continue
            if not p: fails.append((l, 'sin cifras')); continue
            pts[p['to']] = p; done.add(l); new += 1
    for l, e in fails[:10]: log('AVISO boletin no leido:', l.split('/')[-1], e)
    weeks = [pts[k] for k in sorted(pts)]
    # solo se enseña el ultimo tramo continuo (huecos de mas de 2 semanas = boletines de otro formato sin leer): no se une con una linea lo que no esta
    cut = 0
    for i in range(len(weeks) - 1, 0, -1):
        if (datetime.date.fromisoformat(weeks[i]['to']) - datetime.date.fromisoformat(weeks[i - 1]['to'])).days > 14: cut = i; break
    if cut: log('España: se descartan %d semanas anteriores al hueco (%s)' % (cut, weeks[cut - 1]['to'])); weeks = weeks[cut:]
    log('España: %d semanas (%d nuevas), %d boletines sin leer' % (len(weeks), new, len(fails)))
    return {'weeks': weeks, 'files': sorted(done), 'failed': len(fails)}

# ---------------- Francia ----------------
FR_MONTH = {'janvier': 1, 'fevrier': 2, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6, 'juillet': 7, 'aout': 8, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'decembre': 12, 'décembre': 12}
FR_COLS = [('red', 'aop', 2), ('red', 'igp', 3), ('red', 'vsig_var', 4), ('red', 'vsig', 5), ('white', 'aop', 6), ('white', 'igp', 7), ('white', 'vsig_var', 8), ('white', 'vsig', 9)]
def fnum(v):
    if isinstance(v, (int, float)) and not isinstance(v, bool): return float(v)
    s = str(v).replace('\xa0', '').strip().replace(',', '.')
    try: return float(s)
    except Exception: return None
VB = 'https://visionet.franceagrimer.fr/Pages/'
_cj = http.cookiejar.CookieJar(); _op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_cj))
def vreq(u, data=None, raw=False):
    last = None
    for i in range(3):
        try:
            d = urllib.parse.urlencode(data).encode() if data else None
            with _op.open(urllib.request.Request(u, data=d, headers=dict(UA, **{'Accept': '*/*', 'Accept-Language': 'fr,en'})), timeout=120) as x: b = x.read()
            return b if raw else b.decode('utf-8', 'replace')
        except Exception as e: last = e; time.sleep(4)
    raise RuntimeError('%s -> %s' % (u, str(last)[:160]))
def vlisting(menu):
    vreq(VB + 'SeriesChronologiques.aspx?menuurl=' + urllib.parse.quote(menu))
    r = vreq(VB + 'SeriesChronologiquesDetail.aspx', dict(niveau='1', dossierRacine='SeriesChronologiques', menuId='', menuTitre=menu.split('/')[-1], menuUrl=menu, niveauMax='4'))
    return list(dict.fromkeys(urllib.parse.unquote(x) for x in re.findall(r'fileurl=([^"\'&<> ]+)', r)))
def vdownload(fileurl): return vreq(VB + 'OpenDocument.aspx?fileurl=' + urllib.parse.quote(fileurl) + '&telechargersanscomptage=oui', raw=True)
def france():
    import xlrd
    menu = 'SeriesChronologiques/productions vegetales/vin et cidriculture/prix moyens/prix moyens vrac communiqués à la Commission européenne'
    files = [f for f in vlisting(menu) if f.lower().endswith(('.xls', '.xlsx')) and 'COTATION_UE' in f.upper()]
    if not files: raise RuntimeError('FranceAgriMer: sin fichero de precios a granel')
    def camp_of(f):
        m = re.search(r'-C(\d\d)-(\d\d)', f); return int(m.group(1)) if m else 0
    files.sort(key=camp_of); f = files[-1]; log('Francia: ficheros', ', '.join(x.split('/')[-1] for x in files[-2:]), '(%d disponibles)' % len(files))
    series = {}; drop = 0
    # se leen el fichero de la campaña anterior y el actual; el más reciente manda (la cotización de julio se completa al mes siguiente y
    # los meses pueden revisarse). Antes del 27-oct-2026 solo se leía el último y la campaña se reconocía solo como «2020-2021»: las
    # campañas rotuladas «2020-21» se atribuían a la campaña anterior y sobrescribían sus meses.
    for fu in files[-2:]:
        sh = xlrd.open_workbook(file_contents=vdownload(fu)).sheet_by_index(0)
        camp = None
        for r in range(sh.nrows):
            row = sh.row_values(r)
            if len(row) < 10: continue
            c0 = str(row[0]).strip(); m = str(row[1]).strip().lower().replace('(*)', '').replace('*', '').strip()
            if re.match(r'^\d{4}-\d{2,4}$', c0): camp = int(c0[:4])
            mo = FR_MONTH.get(m)
            if not camp or not mo: continue
            y = camp if mo >= 8 else camp + 1
            ym = '%d-%02d' % (y, mo)
            for col, kind, i in FR_COLS:
                v = fnum(row[i])
                if v is None or not (15 <= v <= 400): continue
                series.setdefault(col + '.' + kind, {})[ym] = v
    # valores aislados incompatibles con su entorno (p. ej. un rojo AOP de 258 en un año de 105-135): se descartan y se anotan
    for k, d in series.items():
        ks = sorted(d); bad = []
        for j, ym in enumerate(ks):
            near = sorted(d[x] for x in ks[max(0, j - 5): j + 6] if x != ym)
            if len(near) >= 4:
                med = near[len(near) // 2]
                hi, lo = (2.0, 0.3) if k.endswith('.aop') else (1.7, 0.55)
                if d[ym] > hi * med or d[ym] < lo * med: log('Francia: descartado', k, ym, d[ym], 'frente a mediana', med); bad.append(ym)
        for ym in bad: d.pop(ym); drop += 1
    out = {k: [[ym, d[ym]] for ym in sorted(d)] for k, d in sorted(series.items())}
    log('Francia: %d series, %d valores descartados; ultimo mes %s' % (len(out), drop, max(x[-1][0] for x in out.values())))
    return {'series': out, 'file': f.split('/')[-1]}

def main():
    old = None
    if OUT.exists():
        try: old = json.loads(OUT.read_text(encoding='utf-8'))
        except Exception: old = None
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    res = {'schemaVersion': 1, 'generatedAt': now, 'unit': 'EUR/hl'}
    ok = True
    try: sp = spain((old or {}).get('es'))
    except Exception as e: log('ERROR España:', repr(e)[:200]); sp = (old or {}).get('es'); ok = False
    try: fr = france()
    except Exception as e: log('ERROR Francia:', repr(e)[:200]); fr = (old or {}).get('fr'); ok = False
    if not sp or not fr: LOG.write_text('\n'.join(LOGS) + '\n', encoding='utf-8'); return 1
    res['es'] = {'source': {'name': 'MAPA, Boletín semanal de precios del vino', 'url': MAPA + '/es/agricultura/temas/producciones-agricolas/vitivinicultura/boletines_semanales_precio_vino/', 'license': 'Reutilizable citando la fuente y la fecha (aviso legal del MAPA)'}, **sp}
    res['fr'] = {'source': {'name': 'FranceAgriMer (VISIONet), prix moyens vrac communiqués à la Commission européenne', 'url': 'https://visionet.franceagrimer.fr/', 'license': 'Licence Ouverte 2.0'}, **fr}
    OUT.write_text(json.dumps(res, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    LOG.write_text('\n'.join(LOGS) + '\n', encoding='utf-8')
    log('wine-prices.json', OUT.stat().st_size, 'bytes')
    try: sync_extras(fr)
    except Exception as e: log('AVISO: no se pudo actualizar france-extras-stats.json:', repr(e)[:200])
    return 0 if ok else 1
EXTRAS = ROOT / 'data' / 'france-extras-stats.json'
EXTRA_IDS = {'red.aop': 'red-aop', 'red.igp': 'red-igp', 'red.vsig_var': 'red-vsig-var', 'red.vsig': 'red-vsig', 'white.aop': 'white-aop', 'white.igp': 'white-igp', 'white.vsig_var': 'white-vsig-var', 'white.vsig': 'white-vsig'}
def sync_extras(fr):
    """Las series de vino de la ficha de Francia (fr-fam-wine-* en data/france-extras-stats.json) salen de este mismo fichero de FranceAgriMer:
    antes se cargaban a mano con build-france-extras.py y se quedaban atrás."""
    if not fr or not fr.get('series') or not EXTRAS.exists(): return
    doc = json.loads(EXTRAS.read_text(encoding='utf-8')); S = doc['countries']['FR']['series']; n = 0
    for s in S:
        k = next((a for a, b in EXTRA_IDS.items() if s['id'] == 'fr-fam-wine-' + b), None)
        pts = fr['series'].get(k) if k else None
        if not pts or len(pts) < 13: continue
        s['points'] = [[p, round(v, 4)] for p, v in pts]; s['latestPeriod'] = pts[-1][0]; s['latest'] = round(pts[-1][1], 4)
        s['changePct'] = round((pts[-1][1] - pts[-2][1]) / pts[-2][1] * 100, 2) if pts[-2][1] else None
        s['sourceGroup'] = 'FranceAgriMer – prix moyens vrac communiqués à la Commission européenne (VISIONet)'
        s['note'] = 'Último mes publicado por FranceAgriMer en %s: %s. Los meses que la fuente marca como no disponibles quedan como hueco.' % (fr.get('file', ''), pts[-1][0]); n += 1
    if n:
        doc['generatedAt'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        EXTRAS.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8'); log('france-extras-stats.json: %d series de vino actualizadas' % n)
if __name__ == '__main__': sys.exit(main())
