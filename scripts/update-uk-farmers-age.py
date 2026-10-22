#!/usr/bin/env python3
"""Edad y sexo de los titulares de explotacion de INGLATERRA -> data/uk-farmers-age.json
Fuente: Defra, "Agricultural workforce in England at 1 June" (hoja Age_and_sex_profiles; Open Government Licence v3.0). Solo Inglaterra: el Reino Unido en conjunto no publica este dato.
Defra publica PROPORCIONES (no recuentos) por tramo de edad para 1990-2026 (anos de censo o encuesta de estructura y los anuales recientes); aqui se guardan tal cual en %.
2021 se recogio de otra forma (tramos de tamano y edad media calculada) y la poblacion cambia con el tiempo (explotaciones principales -> todas las comerciales): se marca en 'notes'.
El fichero ODS cambia de direccion en cada publicacion: se localiza desde la pagina de gov.uk (o su API de contenido). Si falla algo, no se toca el fichero y sale en rojo."""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_ods import read_ods
ROOT = Path(__file__).resolve().parents[1]
PAGE = 'https://www.gov.uk/government/statistics/agricultural-workforce-in-england-at-1-june'
API = 'https://www.gov.uk/api/content/government/statistics/agricultural-workforce-in-england-at-1-june'
UA = {'User-Agent': 'Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)'}
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, tries=3):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: return r.read()
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise SystemExit('descarga fallida %s: %s' % (u, last))
def find_ods():
    for u in (PAGE, API):
        try: t = get(u).decode('utf-8', 'replace')
        except SystemExit: continue
        m = re.findall(r'https://assets\.publishing\.service\.gov\.uk/media/[^"\'\s\\<>]+?\.ods', t.replace('\\/', '/'))
        m = [x for x in m if re.search(r'(?i)workforce', x)]
        if m: return sorted(set(m))[-1]
    raise SystemExit('no se encontro el ODS en la pagina de gov.uk')
def year(c):
    m = re.match(r'(\d{4})', str(c if not isinstance(c, float) else int(c)))
    return int(m.group(1)) if m else None
def block(rows, title):
    """Devuelve (anos, {etiqueta: [valores]}) del bloque cuyo titulo empieza por 'title'."""
    for i, r in enumerate(rows):
        if r and isinstance(r[0], str) and r[0].strip().lower().startswith(title.lower()): break
    else: raise SystemExit('bloque no encontrado: ' + title)
    hdr = rows[i + 1]; cols = [(j, year(c)) for j, c in enumerate(hdr) if j > 0 and year(c)]
    ys = [y for _, y in cols]; out = {}
    for r in rows[i + 2:]:
        if not r or r[0] is None or not isinstance(r[0], str) or not r[0].strip(): break
        if len(r) < 2 or all(not isinstance(v, float) for v in r[1:]): break
        out[r[0].strip()] = [round(r[j] * 100, 2) if isinstance(r[j], float) and title.lower().startswith('proportion') else (r[j] if isinstance(r[j], float) else None) for j, _ in cols if j < len(r)]
    return ys, out
def main():
    url = find_ods(); log('ODS', url)
    S = read_ods(get(url)); sh = S.get('Age_and_sex_profiles')
    if not sh: raise SystemExit('hoja Age_and_sex_profiles no encontrada: ' + ', '.join(S))
    ys, sex = block(sh, 'Proportion of holders by sex')
    _, allh = block(sh, 'Proportion of all holders by age')
    _, mal = block(sh, 'Proportion of male holders by age')
    _, fem = block(sh, 'Proportion of female holders by age')
    _, med = block(sh, 'Average age of holders')
    K = {'under 35': 'u35', '35 to 44': 'a35', '45 to 54': 'a45', '55 to 64': 'a55', '65 and over': 'o65'}
    bands = lambda d: {K[k]: v for k, v in d.items() if k in K}
    if len(bands(allh)) != 5 or ys[-1] < 2025 or len(ys) < 10: raise SystemExit('estructura inesperada: %s %s' % (ys, list(allh)))
    for k, v in bands(allh).items():
        if len(v) != len(ys): raise SystemExit('longitud distinta en ' + k)
    mt = re.search(r'(\d{8})\.ods', url); mt = re.search(r'-(\d{8})', url)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'scope': 'England',
           'source': {'name': 'Defra, Agricultural workforce in England at 1 June (Age and sex profiles of farm holders)', 'url': PAGE, 'license': 'Open Government Licence v3.0',
                      'file': url, 'published': mt.group(1) if mt else None},
           'unit': '% of holders', 'years': ys,
           'all': bands(allh), 'male': bands(mal), 'female': bands(fem),
           'sex': {'male': sex.get('Male'), 'female': sex.get('Female')},
           'medianAge': {'all': med.get('All holders'), 'male': med.get('Male'), 'female': med.get('Female')},
           'notes': {'2021': 'Age was collected differently in 2021 (size bands, average age calculated): not strictly comparable.',
                     'population': 'Holders: main holdings only before 2010, all commercial holdings from 2010; proportions are shown for that reason. Responses are optional.'}}
    p = ROOT / 'data' / 'uk-farmers-age.json'
    try:
        o = json.loads(p.read_text(encoding='utf-8')); o.pop('generatedAt', None); n = dict(doc); n.pop('generatedAt')
        if o == n: log('sin cambios'); (ROOT / 'data' / 'uk-farmers-age-log.txt').write_text('\n'.join(LOG) + '\n'); return
    except Exception: pass
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (ROOT / 'data' / 'uk-farmers-age-log.txt').write_text('\n'.join(LOG) + '\n', encoding='utf-8')
    log('ok', ys[0], '-', ys[-1], 'mayores de 65 en', ys[-1], ':', allh['65 and over'][-1], '%')
if __name__ == '__main__': main()
