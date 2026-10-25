#!/usr/bin/env python3
"""Vigilancia de la PAC en DE, NL, PT y EL (scripts/update-cap-nat.py), con ficheros guardados (scripts/fixtures/cap-watch), sin red.
Comprueba: huella estable, cambio detectado, candidatos nuevos solo si son normas y posteriores a la fecha de arranque, y que una fuente rota
se nota (excepcion) en lugar de dar un «sin cambios» inventado."""
import copy, importlib.util, json, sys, tempfile, shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('capnat', ROOT / 'scripts' / 'update-cap-nat.py'); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
FX = str(ROOT / 'scripts' / 'fixtures' / 'cap-watch')
fails = []
def check(ok, msg):
    if not ok: fails.append(msg); print('FALLA', msg)

# DE: huella estable y cambia si cambia el texto
d1 = M.init_doc('DE'); M.de_scan(d1, FX); d2 = M.init_doc('DE'); M.de_scan(d2, FX)
check(set(d1['current']['fingerprints']) == {'anpassungen', 'oeko', 'gap'}, 'DE: deben leerse las tres paginas')
check(all(v['sha256'] == d2['current']['fingerprints'][k]['sha256'] for k, v in d1['current']['fingerprints'].items()), 'DE: la huella debe ser estable')
d1['baseline']['fingerprints'] = copy.deepcopy(d1['current']['fingerprints']); d1['baseline']['acknowledged'] = [x['id'] for x in d1['current']['candidates']]
check(M.diff(d1) == [], 'DE: sin cambios no debe haber nada que revisar')
d1['current']['fingerprints']['oeko']['sha256'] = 'x' * 64
check(len(M.diff(d1)) == 1 and 'cambia' in M.diff(d1)[0], 'DE: un cambio de texto debe aparecer')
check(all(x['id'].startswith('https://www.bmleh.de/') for x in d2['current']['candidates']), 'DE: candidatos solo del BMLEH')
tmp = Path(tempfile.mkdtemp())
for f in Path(FX).iterdir():
    shutil.copy(f, tmp / f.name)
for f in tmp.glob('*gap_gap_node*'): f.write_text('<html><body><main>corto</main></body></html>')
try: M.de_scan(M.init_doc('DE'), str(tmp)); check(False, 'DE: texto corto debe dar error')
except IOError: pass
shutil.rmtree(tmp)

# NL: huella del texto consolidado + candidatos opcionales
M.NL_SINCE = '2026-10-25'
n = M.init_doc('NL'); M.nl_scan(n, FX); n2 = M.init_doc('NL'); M.nl_scan(n2, FX)
check(set(n['current']['fingerprints']) == {'uitvoeringsregeling'}, 'NL: debe leerse la regeling')
check(n['current']['fingerprints']['uitvoeringsregeling']['sha256'] == n2['current']['fingerprints']['uitvoeringsregeling']['sha256'], 'NL: la huella debe ser estable')
ids = sorted(x['id'] for x in n['current']['candidates'])
check(ids == ['stb-2026-400', 'stcrt-2026-30001'], 'NL: candidatos %s' % ids)
M.nl_scan(n, FX); check(len(n['current']['candidates']) == 2, 'NL: una segunda lectura no debe duplicar')
n['baseline']['fingerprints'] = copy.deepcopy(n['current']['fingerprints'])
check(len(M.diff(n)) == 2 and all(x.startswith('texto nuevo') for x in M.diff(n)), 'NL: los candidatos nuevos deben pedir revision')
n['baseline']['acknowledged'] = ids
check(M.diff(n) == [], 'NL: lo aceptado no debe volver a salir')
n['current']['fingerprints']['uitvoeringsregeling']['sha256'] = 'x' * 64
check(len(M.diff(n)) == 1 and 'cambia' in M.diff(n)[0], 'NL: un cambio de la regeling debe aparecer')
# sin buscador: la huella basta, no es error
tmp = Path(tempfile.mkdtemp())
for f in Path(FX).iterdir():
    if 'officielebekendmakingen' not in f.name: shutil.copy(f, tmp / f.name)
q = M.init_doc('NL'); M.nl_scan(q, str(tmp)); check(len(q['current']['fingerprints']) == 1 and len(q['current']['searchErrors']) == 2, 'NL: sin buscador debe seguir con la huella')
(tmp / 'https_wetten.overheid.nl_BWBR0047444').write_text('<html><body>corto</body></html>')
try: M.nl_scan(M.init_doc('NL'), str(tmp)); check(False, 'NL: pagina rota debe dar error')
except IOError: pass
shutil.rmtree(tmp)


# PT / EL: RSS
M.PT_SINCE = '2026-10-01'; M.EL_SINCE = '2026-10-01'
p = M.init_doc('PT'); M.pt_scan(p, FX); check(len(p['current']['candidates']) >= 1 and all(x['date'] >= '2026-10-01' and x['url'].startswith('https://pepacc.pt/') for x in p['current']['candidates']), 'PT: candidatos %s' % [x['title'][:30] for x in p['current']['candidates']])
e = M.init_doc('EL'); M.el_scan(e, FX); check(all(x['date'] >= '2026-10-01' and x['url'].startswith('https://www.agrotikianaptixi.gr/') for x in e['current']['candidates']), 'EL: candidatos')
M.PT_SINCE = '2026-12-01'; p2 = M.init_doc('PT'); M.pt_scan(p2, FX); check(p2['current']['candidates'] == [], 'PT: nada anterior a la fecha de arranque')
# RSS roto
tmp = Path(tempfile.mkdtemp()); (tmp / 'https_pepacc.pt_feed_').write_text('<html>no es rss</html>')
try: M.pt_scan(M.init_doc('PT'), str(tmp)); check(False, 'PT: un RSS roto debe dar error')
except Exception: pass
shutil.rmtree(tmp)
print('vigilancia PAC DE/NL/PT/EL: %d fallos' % len(fails)); sys.exit(1 if fails else 0)
