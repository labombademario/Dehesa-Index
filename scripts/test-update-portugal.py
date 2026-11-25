#!/usr/bin/env python3
"""Portugal (INE): un bloque que falla no borra lo publicado (sin red).

Caso real, 24-nov-2026: 0000023 (rendimientos) dio 503 y 0000538 (porcino) respondio 200 con {"Sucesso": {"Falso": [...]}};
la ejecucion reescribio data/portugal-stats.json sin esas 104 series. Ahora sus series se mantienen tal cual y el log dice FALLO.
"""
import io, json, os, runpy, shutil, sys, tempfile, urllib.error, urllib.request

H = os.path.dirname(os.path.abspath(__file__))
fail = 0
def check(cond, msg):
    global fail
    if not cond: fail += 1; print('FALLA', msg)

class R(io.BytesIO):
    def __enter__(s): return s
    def __exit__(s, *a): pass

def fake(req, timeout=0):
    u = req.full_url; v = u.split('varcd=')[1]
    if v == '0000023': raise urllib.error.HTTPError(u, 503, 'Service Unavailable', {}, None)
    if v == '0000538': return R(json.dumps([{"Sucesso": {"Falso": [{"Msg": "jdbc/conexaoBDDDS", "Cod": "5"}]}}]).encode())
    d = {str(y): [{'geodsg': 'Portugal', 'dim_3_t': 'C%d' % i, 'valor': str(10 + y - 2015 + i)} for i in range(4)] for y in range(2015, 2027)}
    return R(json.dumps([{'Dados': d}]).encode())

def serie(sid):
    return {'id': sid, 'group': 'crops', 'label': sid, 'unit': 'kg/ha', 'frequency': 'annual', 'latestPeriod': '2025', 'latest': 5.0,
            'changePct': 0.0, 'points': [['2023', 5.0], ['2024', 5.0], ['2025', 5.0]]}

prev = {'schemaVersion': 1, 'countries': {'PT': {'name': 'Portugal', 'series': [serie('pt-crop-yield-wheat'), serie('pt-crop-yield-rye'),
        serie('pt-pigs-total'), serie('pt-olive-total'), serie('pt-cattle-old-category')]}}}
tmp = tempfile.mkdtemp(); cwd = os.getcwd(); real = urllib.request.urlopen
try:
    os.makedirs(os.path.join(tmp, 'data'))
    json.dump(prev, open(os.path.join(tmp, 'data', 'portugal-stats.json'), 'w'))
    os.chdir(tmp); urllib.request.urlopen = fake; sys.argv = ['update-portugal.py']
    out = io.StringIO(); so = sys.stdout; sys.stdout = out
    try: runpy.run_path(os.path.join(H, 'update-portugal.py'), run_name='__main__')
    finally: sys.stdout = so
    doc = json.load(open('data/portugal-stats.json')); ser = {s['id']: s for s in doc['countries']['PT']['series']}
    log = out.getvalue()
    for sid in ('pt-crop-yield-wheat', 'pt-crop-yield-rye', 'pt-pigs-total'):
        check(sid in ser, 'el bloque caido conserva %s' % sid)
        check(ser.get(sid) == serie(sid), '%s se mantiene tal cual (mismos puntos)' % sid)
    check('pt-cattle-old-category' not in ser, 'un bloque que responde bien no arrastra series viejas que ya no publica')
    check('pt-cattle-c0' in ser, 'los bloques que responden se escriben')
    check('INE devuelve error' in log, 'el 200 con Sucesso/Falso se trata como fallo')
    check(log.count('FALLO bloque') == 2, 'el log registra los dos bloques caidos')
finally:
    urllib.request.urlopen = real; os.chdir(cwd); shutil.rmtree(tmp, ignore_errors=True)
print('update-portugal: %d fallos' % fail); sys.exit(1 if fail else 0)
