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

  DE  huella (sha256) del texto principal de tres paginas del BMLEH (Anpassungen der Direktzahlungen, Oeko-Regelungen, GAP) y paginas nuevas enlazadas desde
      la portada «EU-Agrarpolitik + Foerderung». gesetze-im-internet.de no responde desde GitHub, por eso no se vigila el texto de la GAPDZV.
  NL  busca en Officiele bekendmakingen (Staatscourant y Staatsblad) publicaciones recientes cuyo titulo habla del GLB.
  PT  RSS de pepacc.pt (PEPAC no Continente): entradas nuevas sobre portarias, despachos, pedido unico, pagamentos, ecorregimes.
  EL  RSS de agrotikianaptixi.gr (web oficial del Plan Estrategico de la PAC griego): entradas nuevas sobre ayudas directas y decisiones ministeriales.

  BG LV EE FI SK SI  huella (sha256) del texto principal de paginas oficiales (ministerio / organismo pagador / boletin consolidado) y, donde hay un listado de noticias,
      candidatos: enlaces nuevos cuyo titulo habla de pagos directos, ecoesquemas, campana, ordenanzas... (ver SIX en el codigo).
      Solo avisa: no interpreta importes ni normas. Si una pagina no responde queda UNREACHABLE (nunca un «sin cambios» inventado).
Uso: python3 scripts/update-cap-nat.py FR|IT|PL|DE|NL|PT|EL|BG|LV|EE|FI|SK|SI [--accept] [--fixture DIR]
  --accept   da por revisado todo lo actual (la lectura pasa a ser la linea base)
  --fixture  lee de ficheros locales en lugar de la red (pruebas)
"""
import datetime, hashlib, html as htmllib, io, json, os, re, subprocess, sys, tarfile, tempfile, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = {'User-Agent': 'dehesaindex-cap-watch/1.0 (+https://dehesaindex.com)'}
TODAY = datetime.date.today().isoformat()
FR_INDEX = 'https://echanges.dila.gouv.fr/OPENDATA/JORF/'
FR_TITLE = re.compile(r'politique agricole commune|campagne 20\d\d|[ée]cor[ée]gime|droits? au paiement|aides? (?:ovine|caprine|bovine|aux bovins|aux veaux|couplée|à la production)|plan strat[ée]gique national|D\. ?614|jeunes agriculteurs|aide redistributive|aide de base au revenu', re.I)
PL_TITLE = re.compile(r'staw(?:k|ek)|zaliczk|zaliczek|Plan(?:u|em)? Strategiczn|schemat|płatności bezpośrednie|płatności w ramach|wspólnej polityki rolnej|WPR', re.I)
PL_BASE = ['DU/2023/412', 'DU/2024/1741']
PL_SINCE = '2026-09-01'
DE_BASE = 'https://www.bmleh.de/DE/themen/landwirtschaft/eu-agrarpolitik-und-foerderung/'
DE_PAGES = [('direktzahlung/anpassungen-direktzahlungen.html', 'anpassungen', 'Anpassungen der Direktzahlungen'), ('direktzahlung/oeko-regelungen.html', 'oeko', 'Öko-Regelungen'), ('gap/gap_node.html', 'gap', 'Gemeinsame Agrarpolitik (GAP)')]
DE_HUB = DE_BASE + 'eu-agrarpolitik-und-foerderung_node.html'
NL_SINCE = '2026-10-25'      # fecha de puesta en marcha de la vigilancia: solo cuenta lo publicado desde entonces
NL_TITLE = re.compile(r'\bGLB\b|gemeenschappelijk landbouwbeleid|landbouwbeleid|nationaal strategisch plan|Uitvoeringsregeling GLB', re.I)
NL_URLS = ['https://zoek.officielebekendmakingen.nl/resultaten?q=(c.product-area==%22officielepublicaties%22)and(cql.textAndIndexes=%22GLB%22)&zv=GLB&pg=50&col=&svel=Publicatiedatum&svol=Aflopend',
           'https://zoek.officielebekendmakingen.nl/resultaten?q=(c.product-area==%22officielepublicaties%22)and(cql.textAndIndexes=%22gemeenschappelijk+landbouwbeleid%22)&zv=gemeenschappelijk+landbouwbeleid&pg=50&col=&svel=Publicatiedatum&svol=Aflopend']
NL_RULE_PREFIX = ('stcrt', 'stb', 'trb')    # Staatscourant, Staatsblad, Tractatenblad: normas. Los Kamerstukken (parlamento) no son normas.
PT_SINCE = '2026-10-25'
PT_FEED = 'https://pepacc.pt/feed/'
PT_TITLE = re.compile(r'portaria|despacho|decreto|regulamento|altera[cç]|pedido [uú]nico|pagamento|ecorregime|interven[cç]|ajuda|apoio|candidatura|aviso', re.I)
EL_SINCE = '2026-10-25'
EL_FEED = 'https://www.agrotikianaptixi.gr/feed/'
EL_TITLE = re.compile(r'Υ\.? ?Α\.?|ΚΥΑ|απόφαση|ενιαία ενίσχυση|ενίσχυση|ενισχύσε|άμεσες|οικολογικ|ΣΣΚΑΠ|ΚΑΠ|τροποποίηση|εκκαθάριση|πληρωμ', re.I)
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


# ------------------------------------------------------------------ DE
def _plain(h):
    h = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', h, flags=re.S)
    return re.sub(r'\s+', ' ', htmllib.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()


def _main_text(h):
    m = re.search(r'<main\b.*?</main>', h, re.S | re.I)
    b = re.sub(r'<nav\b.*?</nav>', ' ', m.group(0) if m else h, flags=re.S | re.I)
    return _plain(b)


def de_scan(doc, fixture):
    """BMLEH (Bundesministerium fuer Landwirtschaft): gesetze-im-internet.de no responde desde los servidores de GitHub (comprobado el 25-oct-2026).
    Huella del texto principal de tres paginas oficiales de la GAP y paginas nuevas enlazadas desde la portada de «EU-Agrarpolitik + Foerderung»."""
    c = doc['current']
    for path, key, label in DE_PAGES:
        txt = _main_text(get(DE_BASE + path, fixture))
        if len(txt) < 1500: raise IOError('texto demasiado corto de %s (%d)' % (path, len(txt)))
        c['fingerprints'][key] = {'sha256': sha(txt), 'chars': len(txt), 'label': 'BMLEH: ' + label}
    hub = get(DE_HUB, fixture)
    known = {x['id'] for x in c['candidates']}
    n = 0
    for href, inner in re.findall(r'<a[^>]+href="(https://www\.bmleh\.de/DE/themen/landwirtschaft/eu-agrarpolitik-und-foerderung/[^"#]+\.html)"[^>]*>(.*?)</a>', hub, re.S):
        title = _plain(inner)
        if href == DE_HUB or len(title) < 6 or href in known: continue
        known.add(href); n += 1
        c['candidates'].append({'id': href, 'title': title, 'date': TODAY, 'url': href})
    if not known: raise IOError('sin enlaces en la portada de EU-Agrarpolitik + Foerderung')


# ------------------------------------------------------------------ NL
NL_WETTEN = 'https://wetten.overheid.nl/BWBR0047444'    # Uitvoeringsregeling GLB 2023 (texto consolidado vigente)


def nl_scan(doc, fixture):
    """Fuente principal: huella del texto consolidado de la Uitvoeringsregeling GLB 2023 en wetten.overheid.nl (responde desde GitHub).
    Staatscourant/Staatsblad con GLB en el titulo: lectura opcional (zoek.officielebekendmakingen.nl da 403 desde GitHub); si falla no es un error."""
    c = doc['current']
    page = get(NL_WETTEN, fixture)
    i = page.find('<div id="regeling"')
    if i < 0: raise IOError('wetten.overheid.nl: no se encuentra el texto de la regeling')
    txt = re.sub(r'Geraadpleegd op \d{2}-\d{2}-\d{4}\.?', ' ', _plain(page[i:page.find('</form>', i) if '</form>' in page[i:] else len(page)]))
    if len(txt) < 5000: raise IOError('texto demasiado corto de la regeling (%d)' % len(txt))
    g = re.search(r'Geldend van (\d{2}-\d{2}-\d{4})', page)
    c['fingerprints']['uitvoeringsregeling'] = {'sha256': sha(txt), 'chars': len(txt), 'label': 'Uitvoeringsregeling GLB 2023 (BWBR0047444)' + (', vigente desde ' + g.group(1) if g else '')}
    known = {x['id'] for x in c['candidates']}
    errs = []
    for url in NL_URLS:
        try:
            page = get(url, fixture)
        except Exception as e:
            if fixture and 'fixture ausente' not in str(e): raise
            errs.append('%s: %s' % (type(e).__name__, str(e)[:80]))
            continue
        for li in re.findall(r'<li>\s*<h2 class="result--title[^"]*">(.*?)</li>', page, re.S):
            href = re.search(r'href="/?([a-z]+(?:-\d+)+)\.html"', li)
            title = re.search(r'result--subtitle[^>]*>(.*?)</a>', li, re.S)
            dt = re.search(r'Datum publicatie</dt>\s*<dd>(\d{2})-(\d{2})-(\d{4})</dd>', li, re.S)
            if not (href and title and dt): continue
            oid = href.group(1); day = '%s-%s-%s' % (dt.group(3), dt.group(2), dt.group(1))
            t = _plain(title.group(1))
            if not oid.startswith(NL_RULE_PREFIX) or day < NL_SINCE or not NL_TITLE.search(t) or oid in known: continue
            known.add(oid)
            c['candidates'].append({'id': oid, 'title': t, 'date': day, 'url': 'https://zoek.officielebekendmakingen.nl/' + oid + '.html'})
    c['searchErrors'] = errs


# ------------------------------------------------------------------ PT / EL (RSS de WordPress)
def _rss_scan(doc, fixture, url, since, title_rx, tag):
    c = doc['current']
    known = {x['id'] for x in c['candidates']}
    root = ET.fromstring(get(url, fixture, binary=True))
    items = root.findall('./channel/item')
    if not items: raise IOError('RSS sin entradas')
    for it in items:
        title = _plain(it.findtext('title') or ''); link = (it.findtext('link') or '').strip(); pub = it.findtext('pubDate') or ''
        try: day = datetime.datetime.strptime(pub[:25].strip(), '%a, %d %b %Y %H:%M:%S').date().isoformat()
        except ValueError: continue
        oid = (it.findtext('guid') or link).strip()
        if day < since or not title_rx.search(title) or oid in known or not link.startswith('http'): continue
        known.add(oid)
        c['candidates'].append({'id': oid, 'title': title, 'date': day, 'url': link})


def pt_scan(doc, fixture): _rss_scan(doc, fixture, PT_FEED, PT_SINCE, PT_TITLE, 'PT')
def el_scan(doc, fixture): _rss_scan(doc, fixture, EL_FEED, EL_SINCE, EL_TITLE, 'EL')


# ------------------------------------------------------------------ BG / LV / EE / FI / SK / SI (paginas oficiales)
# pages: (clave, etiqueta, url, tipo) tipo 'html' (texto de <main>/<article>), 'xml' (texto de las etiquetas) o 'pdf' (pdftotext). lists: (url, regex del titulo, prefijo que debe tener el enlace)
SIX = {
    'BG': {'source': 'mzh_bg', 'since': '2026-10-28',
           'pages': [('naredba3', 'Наредба № 3/2023 (pagos directos), PDF del MZH', 'https://www.mzh.government.bg/media/filer_public/2026/01/21/naredba_3_ot_10032023_g_za_usloviqta_i_reda_za_prilagane_na_intervenciite_pod_formata_na_direktni_pl.pdf', 'pdf')],
           'lists': [('https://www.mzh.government.bg/bg/press-center/novini/', r'директни плащания|еко ?схем|ИСАК|кампания 20\d\d|Стратегически план|наредба|ставк|преходно национално|обвързан', 'https://www.mzh.government.bg/bg/press-center/novini/')]},
    'LV': {'source': 'lad_lv', 'since': '2026-10-28',
           'pages': [('sia2026', 'LAD: ficha de ayudas a la renta ligadas a la superficie 2026', 'https://www.lad.gov.lv/lv/katalogs/saistitie-ienakumu-atbalsti-par-platibam-2026-gada', 'html'),
                     ('mls2026', 'LAD: ficha del pago a pequeños agricultores 2026', 'https://www.lad.gov.lv/lv/katalogs/maksajums-mazajiem-lauksaimniekiem-mls-2026-gada', 'html')],
           'lists': []},
    'EE': {'source': 'pria_ee', 'since': '2026-10-28',
           'pages': [('otsetoetused', 'PRIA: tasas de pagos directos 2026 (PDF)', 'https://pria.ee/sites/default/files/2026-06/otsetoetuste-at-2026.pdf', 'pdf'),
                     ('okokavad', 'PRIA: ecoesquemas 2026 (PDF)', 'https://www.pria.ee/sites/default/files/2026-06/okokavade-at-2026.pdf', 'pdf')],
           'lists': []},
    'FI': {'source': 'finlex_fi', 'since': '2026-10-28',
           'pages': [('l1332', 'Finlex 1332/2022 (ayudas a la superficie, PEPAC)', 'https://opendata.finlex.fi/finlex/avoindata/v1/akn/fi/act/statute-consolidated/2022/1332/fin@', 'xml'),
                     ('l1334', 'Finlex 1334/2022', 'https://opendata.finlex.fi/finlex/avoindata/v1/akn/fi/act/statute-consolidated/2022/1334/fin@', 'xml'),
                     ('l1384', 'Finlex 1384/2022', 'https://opendata.finlex.fi/finlex/avoindata/v1/akn/fi/act/statute-consolidated/2022/1384/fin@', 'xml')],
           'lists': []},
    'SK': {'source': 'apa_sk', 'since': '2026-10-28',
           'pages': [('sadzby', 'APA: tasas de ayudas directas', 'https://apa.sk/priame-podpory/sadzby', 'html'),
                     ('z435', 'Slov-Lex: lista de versiones de la ley 435/2022 (ayudas directas)', 'https://static.slov-lex.sk/static/SK/ZZ/2022/435/', 'html'),
                     ('z436', 'Slov-Lex: lista de versiones de la ley 436/2022', 'https://static.slov-lex.sk/static/SK/ZZ/2022/436/', 'html'),
                     ('z120', 'Slov-Lex: lista de versiones de 120/2023', 'https://static.slov-lex.sk/static/SK/ZZ/2023/120/', 'html')],
           'lists': []},
    'SI': {'source': 'gov_si', 'since': '2026-10-28',
           'pages': [('neposredna', 'gov.si: pagos directos a explotaciones', 'https://www.gov.si/podrocja/kmetijstvo-gozdarstvo-in-prehrana/kmetijstvo-in-razvoj-podezelja/neposredna-placila-za-kmetije/', 'html'),
                     ('np2026', 'ARSKTRP: pagos directos 2026 (PDF)', 'https://www.gov.si/assets/organi-v-sestavi/ARSKTRP/SNP/ZV-2026/NEPOSREDNA-PLACILA.pdf', 'pdf')],
           'lists': []},
}


def _page_text(raw, kind):
    if kind == 'pdf':
        if not raw.startswith(b'%PDF'): raise IOError('la respuesta no es un PDF')
        with tempfile.TemporaryDirectory() as td:
            f = Path(td) / 'x.pdf'; f.write_bytes(raw)
            t = subprocess.run(['pdftotext', '-layout', str(f), '-'], capture_output=True, text=True, check=True).stdout
        return re.sub(r'\s+', ' ', t).strip()
    h = raw.decode('utf-8', 'replace')
    if kind == 'xml': return re.sub(r'\s+', ' ', htmllib.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()
    m = re.search(r'<main\b.*?</main>', h, re.S | re.I) or re.search(r'<article\b.*?</article>', h, re.S | re.I)
    b = re.sub(r'<(?:nav|header|footer|form|aside)\b.*?</(?:nav|header|footer|form|aside)>', ' ', m.group(0) if m else h, flags=re.S | re.I)
    return _plain(b)


def six_scan(doc, fixture, cc):
    c = doc['current']; spec = SIX[cc]
    errs = []
    for key, label, url, kind in spec['pages']:
        try:
            txt = _page_text(get(url, fixture, binary=True, timeout=120), kind)
        except Exception as e:
            if fixture and 'fixture ausente' not in str(e): raise
            errs.append('%s: %s: %s' % (key, type(e).__name__, str(e)[:80])); continue
        if len(txt) < 300: errs.append('%s: texto demasiado corto (%d)' % (key, len(txt))); continue
        c['fingerprints'][key] = {'sha256': sha(txt), 'chars': len(txt), 'label': label, 'url': url}
    known = {x['id'] for x in c['candidates']}
    for url, rx, prefix in spec['lists']:
        try:
            page = get(url, fixture)
        except Exception as e:
            if fixture and 'fixture ausente' not in str(e): raise
            errs.append('lista %s: %s' % (type(e).__name__, str(e)[:80])); continue
        n = 0
        for href, inner in re.findall(r'<a[^>]+href="([^"#]+)"[^>]*>(.*?)</a>', page, re.S):
            href = urllib.request.urljoin(url, htmllib.unescape(href)); title = _plain(inner)
            if not href.startswith(prefix) or href.rstrip('/') == url.rstrip('/') or len(title) < 12 or not re.search(rx, title, re.I): continue
            n += 1
            if href in known: continue
            known.add(href)
            c['candidates'].append({'id': href, 'title': title, 'date': TODAY, 'url': href})
        if n == 0: errs.append('lista sin enlaces: ' + url)
    c['searchErrors'] = errs
    if not c['fingerprints']: raise IOError('ninguna pagina legible: ' + '; '.join(errs))


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
    elif cc == 'DE':
        doc = base_doc('DE', 'bmleh_de', 'Huella de tres páginas del Ministerio federal (BMLEH) sobre la GAP y vigilancia de páginas nuevas en su sección de política agraria europea. No vigila el texto de la GAPDZV (gesetze-im-internet.de no responde desde GitHub). Lo que aparece son candidatos: no se interpretan.')
    elif cc == 'NL':
        doc = base_doc('NL', 'wetten_nl', 'Huella del texto consolidado de la Uitvoeringsregeling GLB 2023 (wetten.overheid.nl) y, cuando responde, búsqueda de Staatscourant/Staatsblad con GLB en el título desde el 25 de octubre de 2026. Lo que aparece son candidatos: no se interpretan.')
        doc['current']['lastScanned'] = NL_SINCE
    elif cc == 'PT':
        doc = base_doc('PT', 'pepacc_pt', 'Vigilancia del RSS de pepacc.pt (PEPAC no Continente) desde el 25 de octubre de 2026. Los textos que aparecen son candidatos: no se interpretan.')
        doc['current']['lastScanned'] = PT_SINCE
    elif cc == 'EL':
        doc = base_doc('EL', 'agrotikianaptixi_gr', 'Vigilancia del RSS de la web oficial del Plan Estratégico de la PAC (agrotikianaptixi.gr) desde el 25 de octubre de 2026. Los textos que aparecen son candidatos: no se interpretan.')
        doc['current']['lastScanned'] = EL_SINCE
    elif cc in SIX:
        doc = base_doc(cc, SIX[cc]['source'], 'Huella del texto de páginas oficiales de la PAC (%s) desde el 28 de octubre de 2026 y, donde hay listado de noticias, enlaces nuevos sobre pagos directos o campaña. Solo avisa de que algo cambió: no se interpreta qué. Lo que aparece son candidatos.' % ', '.join(x[0] for x in SIX[cc]['pages']))
        doc['current']['lastScanned'] = SIX[cc]['since']
    else:
        doc = base_doc('IT', 'masaf_it', 'Huella del texto coordinado del DM 660087/2022. Si cambia hay que releer el decreto: no se sabe qué artículo cambió.')
    return doc


def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if not a or a[0] not in ('FR', 'IT', 'PL', 'DE', 'NL', 'PT', 'EL') + tuple(SIX): sys.exit(__doc__)
    cc = a[0]
    fixture = sys.argv[sys.argv.index('--fixture') + 1] if '--fixture' in sys.argv else None
    p, doc = load(cc)
    if doc is None or '--init' in sys.argv:
        doc = init_doc(cc)
    ok, partial = True, False
    try:
        if cc == 'FR': partial = fr_scan(doc, fixture)
        elif cc == 'PL': pl_scan(doc, fixture)
        elif cc == 'DE': de_scan(doc, fixture)
        elif cc == 'NL': nl_scan(doc, fixture)
        elif cc == 'PT': pt_scan(doc, fixture)
        elif cc == 'EL': el_scan(doc, fixture)
        elif cc in SIX: six_scan(doc, fixture, cc)
        else: it_scan(doc, fixture)
    except Exception as e:
        ok = False
        doc['lastError'] = ('%s: %s' % (type(e).__name__, e))[:200]
        print('%s: fuente no disponible (%s: %s); se conserva la lectura anterior' % (cc, type(e).__name__, e))
    if ok:
        doc.pop('lastError', None)
        doc['status'] = 'PARTIAL' if partial else 'OK'
        doc['checkedAt'] = TODAY
        # primera lectura automatica: lo que ya estaba publicado cuando se escribieron las reglas es la linea base
        if not doc['baseline']['fingerprints'] and doc['current']['fingerprints']:
            doc['baseline']['fingerprints'] = json.loads(json.dumps(doc['current']['fingerprints']))
            if cc == 'DE' or cc in SIX: doc['baseline']['acknowledged'] = sorted({x['id'] for x in doc['current']['candidates']})   # lo ya enlazado en la primera lectura es la linea base
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
