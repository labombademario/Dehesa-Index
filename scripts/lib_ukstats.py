"""Ayudas comunes de los pipelines del Reino Unido que publican series en formato de estadisticas por pais (countries.UK, extend=True)."""
import datetime, json, time, urllib.request
UA = {'User-Agent': 'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}
def get(u, tries=3, timeout=120):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=timeout) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise SystemExit('descarga fallida %s: %s' % (u, last))
def series(sid, group, label, unit, freq, pts, src):
    pts = sorted(pts)
    prev = pts[-2][1] if len(pts) > 1 else None
    return {'id': sid, 'group': group, 'label': label, 'unit': unit, 'frequency': freq, 'latestPeriod': pts[-1][0], 'latest': pts[-1][1],
            'changePct': round((pts[-1][1] / prev - 1) * 100, 2) if prev not in (None, 0) else None, 'points': pts, 'sourceGroup': src}
def write(path, source, ser, log):
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'UK': {'name': 'United Kingdom', 'extend': True, 'source': source, 'series': ser}}, 'log': log}
    try: same = json.loads(path.read_text(encoding='utf-8')).get('countries') == doc['countries']
    except Exception: same = False
    if not same: path.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    return not same
