#!/usr/bin/env python3
"""Austria: existencias y produccion de huevos de las Versorgungsbilanzen de Statistik Austria (balances de abastecimiento) -> data/austria-balances-stats.json.

Fuente: las publicaciones PDF de la pagina oficial
  https://www.statistik.at/statistiken/land-und-forstwirtschaft/landwirtschaftliche-bilanzen/versorgungsbilanzen
  - «Versorgungsbilanzen für pflanzliche Produkte» (una por campaña, julio-junio): tablas de cereales y oleaginosas con Anfangs-/Endbestand.
  - «Versorgungsbilanzen für tierische Produkte» (una por año natural): tabla de productos lacteos (existencias de mantequilla y queso) y de huevos.
Licencia (impresum de cada publicacion, leido el 10 oct 2026): «Bei richtiger Wiedergabe und mit korrekter Quellenangabe „STATISTIK AUSTRIA“ ist es gestattet,
die Inhalte zu vervielfältigen, verbreiten, öffentlich zugänglich zu machen und sie zu bearbeiten»; si se usan extractos o se modifican, hay que indicarlo.
El script comprueba en cada PDF que esa clausula sigue ahi; si no, no usa ese PDF.

Lectura de los PDF (sin estimaciones):
  - Cada fila se lee por posiciones (pdfplumber); las cifras con separador de miles se unen solo si el hueco es de separador (< 6 pt).
  - Cada columna usada debe cuadrar la identidad del balance: Erzeugung + Anfangsbestand − Endbestand + Einfuhr − Ausfuhr = Inlandsverwendung (±2 t).
    Si no cuadra, esa tabla no se usa y se anota en el log.
  - Las columnas se identifican por los rotulos de la cabecera, no solo por su posicion.
  - Si una publicacion posterior trae otro Anfangsbestand para el mismo dia (revision oficial), manda la publicacion mas reciente.
  - Huevos: Statistik Austria cambio el metodo en 2024 («Konsumeier», revisando 2024). Solo se publica la serie con el metodo nuevo; no se mezcla con la antigua.
Uso: python3 scripts/update-austria-balances.py"""
import datetime, io, json, re, sys, time, unicodedata, urllib.parse, urllib.request
PAGE = 'https://www.statistik.at/statistiken/land-und-forstwirtschaft/landwirtschaftliche-bilanzen/versorgungsbilanzen'
UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': '*/*'}
LICENSE_RX = re.compile(r'Quellenangabe\s*„?\s*STATISTIK\s+AUSTRIA“?\s*ist\s+es\s+gestattet|Weiterverwendung\s+ist\s+bei\s+Quellenangabe\s+und\s+korrekter\s+Wiedergabe\s+gestattet', re.I)
ROWS = ('Erzeugung', 'Anfangsbestand', 'Endbestand', 'Einfuhr', 'Ausfuhr', 'Inlandsverwendung')
LOG, OUT = [], {}
def log(*a):
    s = ' '.join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def N(s): return unicodedata.normalize('NFC', s or '')
def fetch(u, t=120):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(6 * (i + 1))
    raise RuntimeError('%s -> %s' % (u[:120], last))

def lines_of(pg):
    """Palabras agrupadas en lineas: una palabra va a la linea abierta si su parte inferior esta a menos de 4 pt (los superindices como «Einfuhr¹» no rompen la fila)."""
    out = []
    for w in sorted(pg.extract_words(x_tolerance=1.5), key=lambda w: (w['bottom'], w['x0'])):
        if out and abs(w['bottom'] - out[-1][0]) < 4: out[-1][1].append(w)
        else: out.append([w['bottom'], [w]])
    return [sorted(ws, key=lambda w: w['x0']) for _, ws in out]
def nums(words):
    """Valores de una fila. «1 685 232» (miles con espacio fino) y «1.181.616» (miles con punto) son un solo numero; «-» es vacio."""
    vals, cur, last = [], None, None
    for w in words:
        t = N(w['text'])
        if cur is not None and re.fullmatch(r'\d{3}', t) and w['x0'] - last < 6:
            cur = cur * 1000 + int(t); last = w['x1']; continue
        if cur is not None: vals.append(cur); cur = None
        if re.fullmatch(r'\d{1,3}', t): cur = int(t); last = w['x1']
        elif re.fullmatch(r'\d{1,3}(\.\d{3})+', t): vals.append(int(t.replace('.', '')))
        elif t in ('-', '–'): vals.append(None)
        else: return None   # algo que no es una cifra: la fila no se entiende y no se usa
    if cur is not None: vals.append(cur)
    return vals
def table(pg, title):
    """{fila: [valores]} y el texto de la cabecera de la tabla cuyo titulo contiene `title` (puede haber otra tabla antes en la misma pagina)."""
    out, hdr, started, seen = {}, [], False, False
    for l in lines_of(pg):
        line = ' '.join(N(w['text']) for w in l)
        if not seen:
            seen = title in line
            if not seen: continue
        first = re.sub(r'\d+\)?$', '', N(l[0]['text']))
        lab = next((r for r in ROWS if first == r), None)
        if lab:
            started = True
            if lab not in out: out[lab] = nums(l[1:])
        elif started and first.startswith(('Q:', 'Tabelle')): break
        elif not started: hdr.append(' '.join(N(w['text']) for w in l))
    return ' '.join(hdr), out
def balanced(t, i):
    g = lambda r: (t.get(r) or [None] * (i + 1))[i] if t.get(r) and len(t[r]) > i else None
    e, a, z, im, ex, iv = (g(r) for r in ROWS)
    if None in (e, im, ex, iv): return False
    return abs(e + (a or 0) - (z or 0) + im - ex - iv) <= 2
def pages(pdf, rx):
    import pdfplumber
    doc = pdfplumber.open(io.BytesIO(pdf))
    txt = N(' '.join((p.extract_text() or '') for p in doc.pages[:3] + doc.pages[-2:]))
    if not LICENSE_RX.search(re.sub(r'\s+', ' ', txt)): raise RuntimeError('sin la clausula de reutilizacion de STATISTIK AUSTRIA en el impresum')
    for p in doc.pages:
        t = N(p.extract_text())
        m = rx.search(t)
        if m and 'Inlandsverwendung' in t: yield m, p

# columnas buscadas: (clave, rotulo de cabecera que debe aparecer, indice)
CEREALS = [('wheat', 'Weichweizen', 0, 'Wheat (common and durum)'), ('rye', 'Roggen', 1, 'Rye'), ('coarse-grains', 'Körnermais', 2, 'Barley, oats and grain maize (combined)'), ('cereals', 'insgesamt', 4, 'Cereals, total')]
OILSEEDS = [('rapeseed', 'Raps', 0, 'Rapeseed and turnip rape'), ('sunflower', 'Sonnen', 1, 'Sunflower seed'), ('soy', 'Sojabohnen', 2, 'Soybeans'), ('oilseeds', 'insgesamt', 4, 'Oilseeds, total')]
def plant(pdf, name, end, start):
    for m, p in pages(pdf, re.compile(r'Versorgungsbilanz(?:en)? für (Getreide|Ölsaaten) (\d{4})/(\d{2})')):
        kind, y2 = m.group(1), int(m.group(2)) + 1
        if y2 % 100 != int(m.group(3)): log('campaña rara', name, m.group(0)); continue
        hdr, t = table(p, m.group(0)); cols = CEREALS if kind == 'Getreide' else OILSEEDS
        if any(h not in hdr for _, h, _, _ in cols): log('cabecera inesperada', name, kind, hdr[:120]); continue
        for key, _, i, en in cols:
            if not balanced(t, i): log('no cuadra el balance', name, kind, key); continue
            z, a = t['Endbestand'][i], t['Anfangsbestand'][i]
            if z is not None: end.setdefault(key, {})[str(y2)] = (z, name, en)
            if a is not None: start.setdefault(key, {})[str(y2 - 1)] = (a, name, en)
        log('balance', kind, '%d/%02d' % (y2 - 1, y2 % 100), name)
def animal(pdf, name, end, start, eggs):
    for m, p in pages(pdf, re.compile(r'Versorgungsbilanz für (Milchprodukte|Konsumeier|Eier) (\d{4})(?: und (\d{4}))?')):
        hdr, t = table(p, m.group(0))
        if m.group(1) == 'Milchprodukte':
            y = int(m.group(2)); new = 'Sonstige' in hdr   # desde 2024: Konsummilch, sonstige flüssige, Obers/Rahm, Butter, Käse und Schmelzkäse
            cols = [('butter', 3 if new else 2, 'Butter'), ('cheese', 4 if new else 3, 'Cheese')]
            if 'Butter' not in hdr or 'Käse' not in hdr: log('cabecera inesperada', name, hdr[:120]); continue
            for key, i, en in cols:
                if not balanced(t, i): log('no cuadra el balance', name, key); continue
                z, a = t['Endbestand'][i], t['Anfangsbestand'][i]
                if z is not None: end.setdefault(key, {})[str(y)] = (z, name, en)
                if a is not None: start.setdefault(key, {})[str(y - 1)] = (a, name, en)
            log('balance lacteos', y, name)
        elif m.group(1) == 'Konsumeier' and m.group(3):   # metodo nuevo: [Y1 miles de unidades, Y1 t, Y2 miles de unidades, Y2 t]
            e = t.get('Erzeugung') or []
            if len(e) != 4 or 'Tonnen' not in hdr: log('tabla de huevos inesperada', name); continue
            eggs[m.group(2)] = (e[1], name); eggs[m.group(3)] = (e[3], name)
            log('huevos', m.group(2), m.group(3), name)

def mk(id_, group, label, unit, pts, note):
    pts = sorted(pts)
    if len(pts) < 2: log('descartada', id_, len(pts), 'puntos'); return
    last, prev = pts[-1], pts[-2]
    OUT[id_] = {'id': id_, 'group': group, 'label': label, 'unit': unit, 'frequency': 'annual', 'latestPeriod': last[0], 'latest': last[1],
                'changePct': round((last[1] / prev[1] - 1) * 100, 2) if prev[1] else None, 'points': [[p, v] for p, v in pts], 'sourceGroup': 'Statistik Austria Versorgungsbilanzen', 'note': note}

def main():
    html = N(fetch(PAGE, 60).decode('utf-8', 'replace'))
    links = sorted(set(urllib.parse.urljoin(PAGE, h) for h in re.findall(r'href="([^"]+\.pdf)"', html)))
    pfl = [u for u in links if '/announcement/' not in u and re.search(r'pflanzl', u, re.I)]
    tie = [u for u in links if '/announcement/' not in u and re.search(r'tier', u, re.I)]
    log('PDF: %d de productos vegetales, %d de productos animales' % (len(pfl), len(tie)))
    p_end, p_start, a_end, a_start, eggs = {}, {}, {}, {}, {}
    for u in pfl:
        try: plant(fetch(u), u.rsplit('/', 1)[-1], p_end, p_start)
        except Exception as e: log('ERROR', u.rsplit('/', 1)[-1], repr(e)[:160])
    for u in tie:
        try: animal(fetch(u), u.rsplit('/', 1)[-1], a_end, a_start, eggs)
        except Exception as e: log('ERROR', u.rsplit('/', 1)[-1], repr(e)[:160])
    def merge(end, start):
        """Existencias al final de cada periodo. El dato de un año es el Endbestand de su publicacion o, si la publicacion siguiente lo corrige como
        Anfangsbestand del mismo dia, el corregido (manda la mas reciente). Si la correccion es grande (> 0,5 %), Statistik Austria cambio la base
        de ese año: la serie empieza ahi y los años anteriores, con la base vieja, no se mezclan."""
        out = {}
        for key in set(end) | set(start):
            E = {y: v for y, (v, _, _) in end.get(key, {}).items()}; A = {y: (v, nm) for y, (v, nm, _) in start.get(key, {}).items()}
            pts = []
            for y in sorted(set(E) | set(A), reverse=True):
                if y in A:
                    v = A[y][0]
                    if y in E and E[y] != v and abs(E[y] - v) > 0.005 * max(abs(v), 1):
                        log('cambio de base', key, y, E[y], '->', v, A[y][1], ': la serie empieza en', y); pts.append((y, v)); break
                else: v = E[y]
                pts.append((y, v))
            en = next(iter((end.get(key) or start.get(key)).values()))[2]
            out[key] = (en, sorted(pts))
        return out
    for key, (en, pts) in merge(p_end, p_start).items():
        mk('at-vb-%s-stocks' % key, 'stocks', '%s: ending stocks at 30 June (end of the July-June marketing year), Austria (Statistik Austria supply balance)' % en, 't', pts,
           'Endbestand de la Versorgungsbilanz de la campaña que termina ese año (30 de junio). No incluye existencias en la industria transformadora.')
    for key, (en, pts) in merge(a_end, a_start).items():
        mk('at-vb-%s-stocks' % key, 'stocks', '%s: ending stocks at 31 December, Austria (Statistik Austria supply balance)' % en, 't', pts,
           'Endbestand de la Versorgungsbilanz de productos lacteos (año natural). El queso incluye el queso fundido desde 2024; antes Statistik Austria no tenia existencias de queso fundido. No incluye existencias en la industria transformadora.')
    if eggs:
        mk('at-vb-eggs-production', 'production', 'Consumption eggs: production, Austria (Statistik Austria supply balance, method from 2024)', 't', [(y, v) for y, (v, _) in eggs.items()],
           'Metodo de la estadistica avicola revisado por Statistik Austria en 2024 (Konsumeier); los años anteriores, con el metodo antiguo, no se mezclan en esta serie.')
    log('series', len(OUT))
    if len(OUT) < 6:
        log('demasiado pocas series (%d); no se escribe nada' % len(OUT)); open('data/austria-balances-log.txt', 'w').write('\n'.join(LOG) + '\n'); sys.exit(1)
    src = {'name': 'Statistik Austria, Versorgungsbilanzen (supply balances)', 'url': PAGE, 'license': 'Reproduction permitted with source «STATISTIK AUSTRIA» (imprint of each publication)'}
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'AT': {'name': 'Austria', 'source': src, 'series': sorted(OUT.values(), key=lambda s: s['id'])}}, 'log': LOG[-30:]}
    json.dump(doc, open('data/austria-balances-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/austria-balances-log.txt', 'w').write('\n'.join(LOG) + '\n')
main()
