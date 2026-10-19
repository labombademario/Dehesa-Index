#!/usr/bin/env python3
"""Pruebas de los avisos de precio: umbral por frecuencia, ventana, determinismo, Atom valido y con & escapado, correo con HTML escapado y en los dos idiomas,
y que el envio NO ocurre sin --send ni sin clave."""
import importlib.util, json, os, subprocess, sys, tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def load(n):
    s = importlib.util.spec_from_file_location(n.replace('-', '_'), ROOT / 'scripts' / (n + '.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
bd, sd = load('build-digest'), load('send-digest')
ok = 0
def check(name, cond):
    global ok
    if not cond: sys.exit('FALLA: ' + name)
    ok += 1; print('OK    ', name)
tmp = Path(tempfile.mkdtemp()); (tmp / 'series' / 'eu').mkdir(parents=True)
def ser(pid, freq, pts, name='Trigo & <cebada>'):
    m = {'id': 'eu/' + pid, 'product': pid, 'region': 'eu', 'name': {'es': name, 'en': name}, 'place': {'es': 'UE', 'en': 'EU'}, 'unit': 't', 'currency': 'EUR', 'frequency': freq, 'sourceName': 'Fuente & Co', 'attribution': 'Source: X', 'rows': len(pts), 'first': pts[0][0], 'last': pts[-1][0]}
    (tmp / 'series' / 'eu' / (pid + '.json')).write_text(json.dumps(dict(m, points=pts)), encoding='utf-8'); return m
S = [ser('w4', 'weekly', [['2026-09-27', 100.0], ['2026-10-04', 104.0]]), ser('m4', 'monthly', [['2026-08', 100.0], ['2026-09', 104.0]]), ser('q9', 'quarterly', [['2026-Q1', 100.0], ['2026-Q2', 109.0]]),
     ser('old', 'weekly', [['2025-01-05', 100.0], ['2025-01-12', 150.0]]), ser('dn', 'weekly', [['2026-10-04', 100.0], ['2026-10-11', 90.0]])]
(tmp / 'index.json').write_text(json.dumps({'generatedAt': '2026-10-19', 'series': S}), encoding='utf-8')
bd.API = tmp; r = bd.build(); ev = json.loads(r['events.json'])['events']; ids = {e['series'] for e in ev}
check('semanal +4 % entra (umbral 3)', 'eu/w4' in ids)
check('mensual +4 % no entra (umbral 5)', 'eu/m4' not in ids)
check('trimestral +9 % entra (umbral 8)', 'eu/q9' in ids)
check('fuera de la ventana de 62 dias no entra', 'eu/old' not in ids)
check('una bajada del 10 % entra con direccion down', any(e['series'] == 'eu/dn' and e['direction'] == 'down' and e['changePct'] == -10.0 for e in ev))
check('eventos ordenados del mas reciente al mas antiguo', [bd.pt(e['date']) for e in ev] == sorted([bd.pt(e['date']) for e in ev], reverse=True))
check('determinista: misma entrada, mismos ficheros', bd.build() == r)
wk = json.loads(r['weekly.json'])
check('resumen: una subida y una bajada, mas el trimestral', wk['summary']['up'] == 2 and wk['summary']['down'] == 1 and wk['topUp'][0]['series'] == 'eu/q9')
for fn in ('feed.xml', 'feed-en.xml'):
    root = ET.fromstring(r[fn].encode('utf-8')); ns = '{http://www.w3.org/2005/Atom}'
    check(fn + ': Atom valido con %d entradas' % len(root.findall(ns + 'entry')), len(root.findall(ns + 'entry')) == 3 and 'Trigo & <cebada>' in ET.tostring(root, encoding='unicode', method='text'))
subj, h = sd.build(wk, 'es')
check('correo: HTML del nombre escapado', '<cebada>' not in h and '&lt;cebada&gt;' in h)
check('correo: coma decimal y atribucion en español', '+9' in h and 'Source: X' in h and 'antes' in h)
a_, b_ = sd.pick(ev, set()); check('envio: solo lo no enviado, un movimiento por serie', len(a_) + len(b_) == 3)
c_, d_ = sd.pick(ev, {e['id'] for e in a_ + b_}); check('envio: lo ya enviado no se repite', c_ == [] and d_ == [])
mk = lambda sid, d, c: {'id': '%s@%s' % (sid, d), 'series': sid, 'changePct': c}
two = [mk('eu/x', '2026-09', 20.0), mk('eu/x', '2026-08', 16.9), mk('eu/y', '2026-10-02', -6.8)]
u2, d2 = sd.pick(two, {'eu/x@2026-09'}); check('envio: si el ultimo movimiento de una serie ya se envio, no sale uno anterior de la misma serie', [e['id'] for e in u2] == [] and [e['id'] for e in d2] == ['eu/y@2026-10-02'])
check('envio: cada idioma recuerda lo suyo (claves de enviados separadas)', "'events-' + a.lang" in open(ROOT / 'scripts' / 'send-digest.py', encoding='utf-8').read())
mixed = bd.build(); fx = mixed['feed.xml']; check('Atom: autor declarado en el feed (RFC 4287)', '<author><name>' in fx)
dd = [bd.pt(d) for d in ('2026-Q2', '2026-10-16', '2026-09', '2026-09-30')]; check('orden por fecha real: trimestre < octubre y mes < fin de ese mes', dd[0] < dd[1] and dd[2] < dd[3])
subj_en, h_en = sd.build(wk, 'en')
check('correo: version en ingles', 'Biggest rises' in h_en and 'Biggest falls' in h_en and 'prices that moved' in subj_en)
check('correo vacio: dice que no hay movimientos', 'No moves' in sd.build({'generatedAt': '2026-10-19', 'topUp': [], 'topDown': []}, 'en')[1])
sent = ROOT / 'data' / 'digest' / 'sent.json'; before = sent.exists()
p = subprocess.run([sys.executable, str(ROOT / 'scripts' / 'send-digest.py')], capture_output=True, text=True)
check('ensayo por defecto: no envia ni guarda estado', p.returncode == 0 and 'ENSAYO' in p.stdout and sent.exists() == before)
env = {k: v for k, v in os.environ.items() if k != 'DIGEST_API_KEY'}
p = subprocess.run([sys.executable, str(ROOT / 'scripts' / 'send-digest.py'), '--send'], capture_output=True, text=True, env=env)
check('--send sin clave: falla y no envia', p.returncode != 0 and 'DIGEST_API_KEY' in (p.stdout + p.stderr) and sent.exists() == before)
import re as _re
raw = _re.compile(r'/(tonelada|ton_corta|barril|docena|litro|index_2020_100|gal)\b')
feeds = [(ROOT / 'data' / 'digest' / f).read_text(encoding='utf-8') for f in ('feed.xml', 'feed-en.xml')]
raw_es = _re.compile(r'/(tonelada|ton_corta|index_2020_100|mmbtu|100kg)\b')
check('feeds: ninguna unidad interna (tonelada, ton_corta, 100kg...) llega al lector', not raw_es.search(feeds[0]) and not raw.search(feeds[1]) and not raw_es.search(feeds[1]))
check('feed en ingles: unidades en ingles (short ton / barrel / dozen / litre)', 'tonelada' not in feeds[1] and ('/t ' in feeds[1] or '/100 kg' in feeds[1]))
from unit_labels import unit_label
check('etiquetas de unidad: ES/EN/FR/IT distintas para barril y docena; ids desconocidos tal cual', unit_label('barril', 'en') == 'barrel' and unit_label('docena', 'fr') == 'douzaine' and unit_label('barril', 'it') == 'barile' and unit_label('xyz', 'en') == 'xyz')
print('%d comprobaciones OK' % ok)
