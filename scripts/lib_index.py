"""Utilidades comunes de indice de series (watchlist y brief diario). Solo libreria estandar."""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
STATS = ['country-stats', 'spain-stats', 'france-stats', 'germany-stats', 'belgium-stats', 'austria-stats', 'portugal-stats', 'portugal-eurostat-stats',
         'canada-stats', 'eu-trade-stats', 'australia-trade-stats', 'interest-rates-stats']
def git_show(rev, path):
    try:
        return subprocess.run(['git', 'show', '%s:%s' % (rev, path)], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8')
    except Exception:
        return None
def rev_before(path, iso):
    """Ultimo commit anterior a `iso` que toco `path` (None si el fichero no existia)."""
    try:
        out = subprocess.run(['git', 'rev-list', '-1', '--before=' + iso, 'HEAD', '--', path], cwd=ROOT, capture_output=True, check=True).stdout.decode().strip()
        return out or None
    except Exception:
        return None
def stats_series(doc):
    """{'CC/id': dict(l,u,f,g,p,v,c,x)} de un fichero *-stats.json."""
    out = {}
    for cc, c in (doc.get('countries') or {}).items():
        for s in c.get('series', []):
            out['%s/%s' % (cc, s['id'])] = {'l': s.get('label', ''), 'u': s.get('unit', ''), 'f': s.get('frequency', ''), 'g': s.get('group', ''),
                                            'p': s.get('latestPeriod'), 'v': s.get('latest'), 'c': s.get('changePct')}
    return out
def products(doc):
    """{'P/producto/region': ...} de data/latest.json (solo observaciones verificadas)."""
    out = {}
    for o in (doc.get('observations') or []):
        if o.get('status') != 'verified' or o.get('value') is None: continue
        out['P/%s/%s' % (o['product'], o['region'])] = {'l': '%s (%s)' % (o['product'], o['region'].upper()), 'u': ((o.get('currency') or '') + '/' + (o.get('unit') or '')).strip('/'), 'f': o.get('frequency', ''),
                                                       'g': 'product', 'p': o.get('observationDate'), 'v': o.get('value'), 'c': o.get('changePct')}
    return out
def load_all(loader, strict=False):
    """loader(path) -> texto JSON o None. Devuelve (series, ficheros_presentes).
    strict=True (estado actual): un fichero ausente o ilegible es un error, no se ignora. En versiones antiguas (git) puede faltar legitimamente."""
    series, present = {}, set()
    for n in STATS:
        t = loader('data/%s.json' % n)
        if not t:
            if strict: raise FileNotFoundError('data/%s.json' % n)
            continue
        try: d = json.loads(t)
        except Exception:
            if strict: raise
            continue
        present.add(n); series.update(stats_series(d))
    t = loader('data/latest.json')
    if t:
        try: series.update(products(json.loads(t))); present.add('latest')
        except Exception:
            if strict: raise
    elif strict: raise FileNotFoundError('data/latest.json')
    return series, present
