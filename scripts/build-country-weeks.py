#!/usr/bin/env python3
"""«La semana en...»: un resumen semanal por pais (España, Francia, Italia, Alemania y EE. UU.), aparte del blog general.
Sin LLM ni prosa inventada: el texto lo compone la web (js/semana.js, 4 idiomas) a partir de estas cifras.

1) REGISTRO (data/blog/countries/ledger/<CC>.json): ultimo periodo y valor de cada serie del catalogo del pais (data/catalog/<CC>.json y, en la UE,
   data/catalog/eu/<CC>.json) y el DIA en que Dehesa Index vio por primera vez ese periodo. Una serie «se publico» un dia si su ultimo periodo cambio
   respecto al registro. Un cambio de valor sin periodo nuevo es una revision (ya la cuenta revisiones.html) y aqui no se cuenta.
   Una serie que entra nueva en el catalogo se cuenta aparte (newSeries): suele ser una fuente recien conectada, no un dato publicado esa semana.
2) SEMANA (data/blog/countries/<CC>/<AAAA-Www>.json): datos publicados de lunes a domingo, por bloque (precios, produccion, comercio, costes, otros);
   los precios que mas se movieron frente a su dato anterior (cambio % del catalogo, el mismo que enseña la web); otras publicaciones destacadas;
   y los titulares de los medios de ese pais archivados esa semana (data/news-archive, campo country), con enlace y sin reescribirlos.
   Cobertura honesta: coverage.from = primer dia que el registro observo (antes no se sabe cuando llego cada dato).
3) INDICE (data/blog/countries/index.json): semanas disponibles por pais.
Uso: python3 scripts/build-country-weeks.py                  # actualiza el registro con el catalogo actual y reconstruye las semanas
     python3 scripts/build-country-weeks.py --backfill-git D  # una vez: reconstruye el registro dia a dia desde la fecha D con el historial de git"""
import datetime, json, re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'; OUT = DATA / 'blog' / 'countries'; LEDGER = OUT / 'ledger'; NEWS = DATA / 'news-archive'
COUNTRIES = ['ES', 'FR', 'IT', 'DE', 'US']
MOVERS = 8; RELEASES = 10; MAX_PER_GROUP = 2; NEWS_N = 8; MAX_PER_SOURCE = 2
BLOCK_ORDER = ['precios', 'produccion', 'comercio', 'costes', 'otros']
MARKETS = {'quotes', 'prices', 'prices_lv', 'prices_fv', 'milk', 'milk_regions', 'meat_regions', 'product', 'idx_perc'}
PRODUCTION = {'production', 'crops', 'crops_regions', 'livestock', 'stocks', 'organic'}
TRADE = {'trade', 'partners'}
COSTS = {'inputs', 'inputs_f', 'inputs_a', 'costs', 'prices_paid', 'idx_pag'}

def block(g):
    g = g or ''
    if g in MARKETS or g.startswith('eu_'): return 'precios'
    if g in PRODUCTION: return 'produccion'
    if g in TRADE: return 'comercio'
    if g in COSTS: return 'costes'
    return 'otros'
def now_iso(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def wk(d):
    y, w, _ = datetime.date.fromisoformat(d).isocalendar(); return '%04d-W%02d' % (y, w)
def wk_range(key):
    mon = datetime.date.fromisocalendar(int(key[:4]), int(key[6:]), 1); return mon, mon + datetime.timedelta(days=6)
def jload(p, default=None):
    try: return json.loads(Path(p).read_text(encoding='utf-8'))
    except Exception: return default
def jdump(p, doc):
    p = Path(p); p.parent.mkdir(parents=True, exist_ok=True); p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

def catalog_series(cc, reader):
    """Series del pais: {id: fila}. reader(ruta relativa) devuelve el JSON o None."""
    out = {}
    for rel, kind in (('data/catalog/%s.json' % cc, 0), ('data/catalog/eu/%s.json' % cc, 1)):
        d = reader(rel)
        for s in (d or {}).get('series', []):
            if s.get('id') and s.get('latestPeriod') and s.get('latest') is not None: out[s['id']] = dict(s, _k=kind)
    return out

def observe(cc, series, day):
    """Aplica el catalogo de un dia al registro del pais. Devuelve el registro actualizado."""
    path = LEDGER / ('%s.json' % cc)
    led = jload(path) or {'schemaVersion': 1, 'country': cc, 'since': day, 'updatedAt': None, 'series': {}}
    first = not led['series']
    S = led['series']
    for sid, s in series.items():
        p, v = str(s['latestPeriod']), s['latest']
        meta = {'g': s.get('group', ''), 'c': s.get('changePct')}   # el resto de metadatos (etiqueta, unidad...) se lee del catalogo al construir la semana
        o = S.get(sid)
        if o is None:
            S[sid] = dict(meta, p=p, v=v, seen=None if first else day, new=not first, pp=None, pv=None)
        elif p > o['p']:
            S[sid] = dict(meta, p=p, v=v, seen=day, new=False, pp=o['p'], pv=o['v'])
        else:
            o.update(meta); o['v'] = v if p == o['p'] else o['v']
    led['updatedAt'] = day
    if led['since'] > day: led['since'] = day
    return led

def save_ledger(led): jdump(LEDGER / ('%s.json' % led['country']), led)

def git(*a): return subprocess.run(['git'] + list(a), cwd=ROOT, capture_output=True, text=True, check=True).stdout
def backfill(since):
    """Reconstruye el registro dia a dia con la ultima version de cada catalogo al final de cada dia (historial de git)."""
    d0 = datetime.date.fromisoformat(since); today = datetime.datetime.now(datetime.timezone.utc).date()
    for cc in COUNTRIES:
        (LEDGER / ('%s.json' % cc)).unlink(missing_ok=True)
        for f in (OUT / cc).glob('20*.json'): f.unlink()
    day = d0
    while day <= today:
        until = (day + datetime.timedelta(days=1)).isoformat() + 'T00:00:00Z'
        build_all(day, quiet=True)   # igual que en produccion: la semana anterior se cierra con el registro del dia anterior
        for cc in COUNTRIES:
            def reader(rel, until=until):
                h = git('log', '-1', '--format=%H', '--until=' + until, '--', rel).strip()
                if not h: return None
                try: return json.loads(git('show', '%s:%s' % (h, rel)))
                except Exception: return None
            ser = catalog_series(cc, reader)
            if ser: save_ledger(observe(cc, ser, day.isoformat()))
        day += datetime.timedelta(days=1)

def news_for(cc, key, cov):
    a = jload(NEWS / ('%s.json' % key))
    if not a: return 0, []
    rows = [i for i in a.get('items', []) if i.get('country') == cc and i['date'] >= max(cov, a['coverage']['from'])]
    out, seen, cnt = [], set(), {}
    for i in sorted(rows, key=lambda i: (-i['rel'], i['date'], i['id'])):
        k = re.sub(r'[^a-z0-9]+', ' ', i['h'].lower())[:48].strip()
        if k in seen or cnt.get(i['source'], 0) >= MAX_PER_SOURCE: continue
        seen.add(k); cnt[i['source']] = cnt.get(i['source'], 0) + 1
        out.append({x: i[x] for x in ('date', 'source', 'lang', 'h', 'url', 'topic')})
        if len(out) >= NEWS_N: break
    return len(rows), out

def contiguous(o):
    """El cambio % solo se destaca si compara con el periodo inmediatamente anterior (o casi): una serie de temporada que vuelve tras meses
    (manzanas en julio y octubre) no es un movimiento de la semana."""
    p, q = o['p'], o['pp']
    if not q: return False
    try:
        if re.match(r'^\d{4}-\d\d-\d\d$', p) and re.match(r'^\d{4}-\d\d-\d\d$', q): return (datetime.date.fromisoformat(p) - datetime.date.fromisoformat(q)).days <= 21
        if re.match(r'^\d{4}-\d\d$', p) and re.match(r'^\d{4}-\d\d$', q): return (int(p[:4]) * 12 + int(p[5:])) - (int(q[:4]) * 12 + int(q[5:])) <= 3
    except ValueError: return False
    return True
def capped(rows, key, n):
    out, cnt = [], {}
    for sid, o in rows:
        k = key(o)
        if cnt.get(k, 0) >= n: continue
        cnt[k] = cnt.get(k, 0) + 1; out.append((sid, o))
    return out
def item(sid, o, m):
    return {'id': sid, 'label': m.get('label', sid), 'unit': m.get('unit', ''), 'freq': m.get('freq', ''), 'group': o['g'], 'block': block(o['g']), 'period': o['p'], 'value': o['v'],
            'prevPeriod': o['pp'], 'prevValue': o['pv'], 'changePct': o['c'], 'seen': o['seen'], 'sourceId': m.get('sourceId') or ('eu_agrifood' if m.get('_k') == 1 else None)}

def build_week(led, key, today, cat):
    mon, sun = wk_range(key); lo, hi = mon.isoformat(), sun.isoformat()
    cov = max(lo, (datetime.date.fromisoformat(led['since']) + datetime.timedelta(days=1)).isoformat())   # el dia del primer registro no cuenta: no se sabe que llego ese dia
    if cov > hi or cov > today.isoformat(): return None
    S = led['series']
    upd = [(sid, o) for sid, o in S.items() if o['seen'] and cov <= o['seen'] <= hi and not o['new'] and sid in cat]   # una serie que ya no esta en el catalogo no se destaca
    new = [sid for sid, o in S.items() if o['seen'] and cov <= o['seen'] <= hi and o['new']]
    by = {b: 0 for b in BLOCK_ORDER}
    for sid, o in upd: by[block(o['g'])] += 1
    mv = [(sid, o) for sid, o in upd if block(o['g']) == 'precios' and isinstance(o['c'], (int, float)) and contiguous(o)]
    mv.sort(key=lambda x: (-abs(x[1]['c']), x[0]))
    mv = capped(mv, lambda o: o['g'], MAX_PER_GROUP)
    rel = [(sid, o) for sid, o in upd if block(o['g']) != 'precios']
    rel.sort(key=lambda x: (BLOCK_ORDER.index(block(x[1]['g'])), 0 if cat[x[0]].get('tags') else 1, cat[x[0]].get('tier') if isinstance(cat[x[0]].get('tier'), int) else 9, -abs(x[1]['c'] or 0), x[0]))
    rel = capped(rel, lambda o: o['g'], 3)
    ntot, news = news_for(led['country'], key, cov)
    return {'schemaVersion': 1, 'country': led['country'], 'week': key, 'from': lo, 'to': hi, 'complete': today > sun, 'coverage': {'from': cov},
            'totals': {'updates': len(upd), 'byBlock': by, 'sources': len({cat[sid].get('sourceId') or ('eu_agrifood' if cat[sid]['_k'] == 1 else '') for sid, _ in upd} - {''}), 'newSeries': len(new), 'news': ntot},
            'movers': [item(sid, o, cat[sid]) for sid, o in mv[:MOVERS]], 'releases': [item(sid, o, cat[sid]) for sid, o in rel[:RELEASES]], 'news': news}

def build_all(today=None, quiet=False):
    today = today or datetime.datetime.now(datetime.timezone.utc).date(); idx = {}
    for cc in COUNTRIES:
        led = jload(LEDGER / ('%s.json' % cc))
        if not led: continue
        cat = catalog_series(cc, lambda rel: jload(ROOT / rel))
        start = datetime.date.fromisoformat(led['since']); keys = []
        k = wk(start.isoformat())
        while True:
            mon, sun = wk_range(k)
            if mon > today: break
            keys.append(k); k = wk((sun + datetime.timedelta(days=1)).isoformat())
        rows = []
        for key in keys:
            p = OUT / cc / ('%s.json' % key); old = jload(p)
            if old and old.get('complete'):   # semana cerrada: no se rehace (el registro ya guarda periodos posteriores de las mismas series)
                rows.append({'week': key, 'from': old['from'], 'to': old['to'], 'complete': True, 'updates': old['totals']['updates'], 'news': old['totals']['news']}); continue
            d = build_week(led, key, today, cat)
            if d is None or (d['totals']['updates'] == 0 and not d['news']):
                if p.exists(): p.unlink()
                continue
            if old is None or old != d: jdump(p, d)
            rows.append({'week': key, 'from': d['from'], 'to': d['to'], 'complete': d['complete'], 'updates': d['totals']['updates'], 'news': d['totals']['news']})
        idx[cc] = sorted(rows, key=lambda r: r['week'], reverse=True)
    doc = {'schemaVersion': 1, 'countries': idx}
    old = jload(OUT / 'index.json') or {}
    if {k: v for k, v in old.items() if k != 'generatedAt'} != doc: jdump(OUT / 'index.json', dict(doc, generatedAt=now_iso()))
    if quiet: return
    for cc, rows in idx.items(): print(cc, ', '.join('%s: %d datos, %d noticias' % (r['week'], r['updates'], r['news']) for r in rows) or 'sin semanas')

def main():
    a = sys.argv[1:]
    if '--backfill-git' in a: backfill(a[a.index('--backfill-git') + 1])
    else:
        build_all(quiet=True)   # primero se cierra la semana anterior con lo registrado hasta ayer; despues se registra el catalogo de hoy
        day = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
        for cc in COUNTRIES:
            ser = catalog_series(cc, lambda rel: jload(ROOT / rel))
            if ser: save_ledger(observe(cc, ser, day))
    build_all()
main()
