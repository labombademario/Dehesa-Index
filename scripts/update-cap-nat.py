#!/usr/bin/env python3
"""PAC Francia / Italia / Polonia: vigilancia de cambios -> data/cap/<cc>/watch.json

No reescribe reglas ni importes: avisa cuando la fuente oficial publica algo que alguien tiene que revisar.
  FR  recorre los boletines diarios del JORF (volcado abierto de la DILA) desde la ultima fecha leida y anota los textos
      cuyo titulo habla de la PAC (campana, ecorregimen, derechos de pago, ayudas acopladas, codigo rural D. 614...).
  PL  huella de los metadatos de la ley del Plan Estrategico (DU/2023/412, DU/2024/1741) y busqueda en el Dziennik Ustaw
      de reglamentos nuevos de tasas, anticipos o modificaciones.
  IT  huella (sha256) del texto del decreto ministerial 660087/2022 coordinado, tal como lo publica el MASAF.
'reviewNeeded' es EXACTAMENTE la diferencia entre la linea base (lo que revisaron las reglas) y la lectura actual.
Si la fuente no responde se conserva la lectura anterior y se marca status UNREACHABLE (nunca se inventa un 'sin cambios').
NEW_RULE no es detectable: lo que aparezca aqui son candidatos, no reglas nuevas confirmadas.

Uso: python3 scripts/update-cap-nat.py FR|IT|PL [--accept] [--fixture DIR]
  --accept   da por revisado todo lo actual (la lectura pasa a ser la linea base)
  --fixture  lee de ficheros locales en lugar de la red (pruebas)
"""
import datetime, hashlib, io, json, os, re, subprocess, sys, tarfile, tempfile, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = {'User-Agent': 'dehesaindex-cap-watch/1.0 (+https://dehesaindex.com)'}
TODAY = datetime.date.today().isoformat()
FR_INDEX = 'https://echanges.dila.gouv.fr/OPENDATA/JORF/'
FR_TITLE = re.compile(r'politique agricole commune|campagne 20\d\d|[ée]cor[ée]gime|droits? au paiement|aides? (?:ovine|caprine|bovine|aux bovins|aux veaux|couplée|à la production)|plan strat[ée]gique national|D\. ?614|jeunes agriculteurs|aide redistributive|aide de base au revenu', re.I)
PL_TITLE = re.compile(r'staw(?:k|ek)|zaliczk|zaliczek|Plan(?:u|em)? Strategiczn|schemat|płatności bezpośrednie|płatności w ramach|wspólnej polityki rolnej|WPR', re.I)
PL_BASE = ['DU/2023/412', 'DU/2024/1741']
PL_SINCE = '2026-09-01'
FR_SINCE = '2026-10-01'      # ultimo dia leido a mano (JORF del 1-oct-2026, arretes de la campana 2026)
FR_MAX_DAYS = 45             # tope de ficheros diarios por ejecucion


def get(url, fixture=None, binary=False, timeout=40):
    if fixture:
        p = Path(fixture) / re.sub(r'[^A-Za-z0-9._-]+', '_', url)
        if not p.exists(): raise IOError('fixture ausente ' + p.name)
        return p.read_bytes() if binary else p.read_text(encoding='utf-8')
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        b = r.read()
    return b if binary else b.decode('utf-8', 'replace')


def sha(x):
    return hashlib.sha256(x if isinstance(x, bytes) else x.encode('utf-8')).hexdigest()


def load(cc):
    p = ROOT / 'data' / 'cap' / cc.lower() / 'watch.json'
    return p, (json.loads(p.read_text(encoding='utf-8')) if p.exists() else None)


def base_doc(cc, source, note):
    return {'schemaVersion': 1, 'country': cc, 'source': source, 'status': 'NOT_YET_RUN', 'checkedAt': None,
            'baseline': {'fingerprints': {}, 'acknowledged': []},
            'current': {'fingerprints': {}, 'candidates': [], 'lastScanned': None},
            'reviewNeeded': [], 'note': note}


def diff(doc):
    b, c = doc['baseline'], doc['current']
    out = []
    for k, v in sorted(c['fingerprints'].items()):
        if k not in b['fingerprints']: out.append('nuevo seguimiento: ' + v.get('label', k))
        elif b['fingerprints'][k]['sha256'] != v['sha256']: out.append('cambia: ' + v.get('label', k))
    for k, v in sorted(b['fingerprints'].items()):
        if k not in c['fingerprints']: out.append('desaparece: ' + v.get('label', k))
    ack = set(b['acknowledged'])
    for x in c['candidates']:
        if x['id'] not in ack: out.append('texto nuevo: %s (%s)' % (x['title'][:140], x['date']))
    return out


# ------------------------------------------------------------------ FR
def fr_scan(doc, fixture):
    c = doc['current']
    last = c.get('lastScanned') or FR_SINCE
    idx = get(FR_INDEX, fixture)
    files = sorted(set(re.findall(r'href="(JORF_(\d{8})-\d{6}\.tar\.gz)"', idx)), key=lambda t: t[0])
    todo = [(f, d) for f, d in files if '%s-%s-%s' % (d[:4], d[4:6], d[6:]) > last]
    known = {x['id'] for x in c['candidates']}
    done = last
    for f, d in todo[:FR_MAX_DAYS]:
        raw = get(FR_INDEX + f, fixture, binary=True, timeout=120)
        day = '%s-%s-%s' % (d[:4], d[4:6], d[6:])
        with tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz') as tf:
            for m in tf:
                if not (m.isfile() and re.search(r'JORFTEXT\d+\.xml$', m.name)): continue
                xml = tf.extractfile(m).read().decode('utf-8', 'replace')
                t = re.search(r'<TITREFULL>(.*?)</TITREFULL>', xml, re.S) or re.search(r'<TITRE>(.*?)</TITRE>', xml, re.S)
                if not t: continue
                title = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t.group(1))).strip()
                if not FR_TITLE.search(title): continue
                tid = re.search(r'(JORFTEXT\d+)', m.name).group(1)
                if tid in known: continue
                known.add(tid)
                c['candidates'].append({'id': tid, 'title': title, 'date': day, 'url': 'https://www.legifrance.gouv.fr/jorf/id/' + tid})
        done = max(done, day)
    c['lastScanned'] = done
    return len(todo) > FR_MAX_DAYS


# ------------------------------------------------------------------ PL
def pl_scan(doc, fixture):
    c = doc['current']
    for eli in PL_BASE:
        m = json.loads(get('https://api.sejm.gov.pl/eli/acts/' + eli, fixture))
        canon = json.dumps({k: m.get(k) for k in ('status', 'inForce', 'entryIntoForce', 'references')}, sort_keys=True, ensure_ascii=False)
        c['fingerprints'][eli] = {'sha256': sha(canon), 'label': 'ley del Plan Estratégico, metadatos y referencias (%s)' % eli}
    known = {x['id'] for x in c['candidates']}
    found = None
    for url in ('https://api.sejm.gov.pl/eli/acts/DU/%d' % datetime.date.today().year,):
        try:
            d = json.loads(get(url, fixture))
        except Exception:
            continue
        if isinstance(d, dict) and isinstance(d.get('items'), list): found = d['items']; break
    if found is None:
        c['search'] = 'UNAVAILABLE'
        return
    c['search'] = 'OK'
    for it in found:
        title, dt = it.get('title') or '', it.get('announcementDate') or ''
        if dt < PL_SINCE or not PL_TITLE.search(title): continue
        if not re.search(r'rolnictw|rolnik|WPR|rolnej', title, re.I): continue
        eli = 'DU/%s/%s' % (it.get('year'), it.get('pos'))
        if eli in known: continue
        known.add(eli)
        c['candidates'].append({'id': eli, 'title': title, 'date': dt, 'url': 'https://api.sejm.gov.pl/eli/acts/' + eli})


# ------------------------------------------------------------------ IT
def it_scan(doc, fixture):
    url = json.loads((ROOT / 'data' / 'cap' / 'it' / 'rules.json').read_text(encoding='utf-8'))['source']['url']
    raw = get(url, fixture, binary=True, timeout=120)
    if not raw.startswith(b'%PDF'): raise IOError('la respuesta no es un PDF')
    with tempfile.TemporaryDirectory() as td:
        pdf = Path(td) / 'dm.pdf'; pdf.write_bytes(raw)
        txt = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], capture_output=True, text=True, check=True).stdout
    norm = re.sub(r'\s+', ' ', txt).strip()
    if len(norm) < 20000: raise IOError('texto demasiado corto (%d)' % len(norm))
    m = re.search(r'aggiornat[oa]\s+al\s+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})', norm, re.I)
    doc['current']['fingerprints']['dm660087'] = {'sha256': sha(norm), 'chars': len(norm), 'label': 'decreto ministerial 660087/2022 (texto coordinado del MASAF)',
                                                  'updatedAt': m.group(1) if m else None}


def init_doc(cc):
    """Linea base inicial: los textos que ya recogen las reglas e importes curados a mano."""
    d = ROOT / 'data' / 'cap' / cc.lower()
    if cc == 'FR':
        doc = base_doc('FR', 'dila_jorf', 'Vigilancia de los boletines diarios del JORF desde el 1 de octubre de 2026 (último día leído a mano). Los textos que aparecen son candidatos: no se interpretan.')
        doc['baseline']['acknowledged'] = sorted(x['jorfText'] for x in json.loads((d / 'amounts.json').read_text(encoding='utf-8'))['documents'])
        doc['current']['lastScanned'] = FR_SINCE
    elif cc == 'PL':
        doc = base_doc('PL', 'sejm_eli', 'Vigilancia de la ley del Plan Estratégico y búsqueda de reglamentos nuevos en el Dziennik Ustaw desde el 1 de septiembre de 2026. Los textos que aparecen son candidatos: no se interpretan.')
        doc['baseline']['acknowledged'] = sorted(x['eli'] for x in json.loads((d / 'amounts.json').read_text(encoding='utf-8'))['documents'])
    else:
        doc = base_doc('IT', 'masaf_it', 'Huella del texto coordinado del DM 660087/2022. Si cambia hay que releer el decreto: no se sabe qué artículo cambió.')
    return doc


def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if not a or a[0] not in ('FR', 'IT', 'PL'): sys.exit(__doc__)
    cc = a[0]
    fixture = sys.argv[sys.argv.index('--fixture') + 1] if '--fixture' in sys.argv else None
    p, doc = load(cc)
    if doc is None or '--init' in sys.argv:
        doc = init_doc(cc)
    ok, partial = True, False
    try:
        if cc == 'FR': partial = fr_scan(doc, fixture)
        elif cc == 'PL': pl_scan(doc, fixture)
        else: it_scan(doc, fixture)
    except Exception as e:
        ok = False
        print('%s: fuente no disponible (%s: %s); se conserva la lectura anterior' % (cc, type(e).__name__, e))
    if ok:
        doc['status'] = 'PARTIAL' if partial else 'OK'
        doc['checkedAt'] = TODAY
        # primera lectura automatica: lo que ya estaba publicado cuando se escribieron las reglas es la linea base
        if not doc['baseline']['fingerprints'] and doc['current']['fingerprints']:
            doc['baseline']['fingerprints'] = json.loads(json.dumps(doc['current']['fingerprints']))
    else:
        if doc['status'] != 'NOT_YET_RUN': doc['status'] = 'UNREACHABLE'
    if '--accept' in sys.argv:
        doc['baseline']['fingerprints'] = json.loads(json.dumps(doc['current']['fingerprints']))
        doc['baseline']['acknowledged'] = sorted(set(doc['baseline']['acknowledged']) | {x['id'] for x in doc['current']['candidates']})
    doc['reviewNeeded'] = diff(doc)
    new = json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=False) + '\n'
    p.write_text(new, encoding='utf-8')
    print(cc, doc['status'], 'revisar:', len(doc['reviewNeeded']))


if __name__ == '__main__':
    main()
