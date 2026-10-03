#!/usr/bin/env python3
"""PAC España: importes del Real Decreto 1048/2022 (BOE-A-2022-23048, texto consolidado).

Lee el texto consolidado del BOE (PDF → pdftotext -layout) y extrae, SIN
estimar ni completar nada, las tablas numéricas de los anexos:

  VII   asignaciones financieras indicativas (ayuda básica, redistributiva, jóvenes)
  VIII  parámetros de la ayuda redistributiva (tramos de hectáreas por región)
  IX    importes unitarios planificado / mínimo / máximo por región
  X     importe planificado / mínimo / máximo de cada ecorrégimen (€/ha)
  XI    dotación anual indicativa de cada ecorrégimen
  XII   umbrales de degresividad (ha)
  XX    importes mínimos y máximos de las ayudas asociadas a agricultores
  XXII  importes mínimos y máximos de las ayudas asociadas a ganaderos

y calcula una huella (sha256) del texto de los artículos y anexos que las
reglas curadas a mano (data/cap/es/rules.json) citan, para avisar cuando el
BOE cambie algo que alguien tendría que revisar.

Estos importes son los PLANIFICADOS / MÍNIMOS / MÁXIMOS que fija el real
decreto. NO son los importes unitarios que el FEGA publica cada campaña
(provisionales antes del 15-sep, revisados antes del 15-nov, definitivos antes
del 30-jun siguiente): esos se distinguen siempre en la web.

Uso:
  python3 scripts/update-cap-es.py --text /ruta/rd1048.txt     # texto ya extraído
  python3 scripts/update-cap-es.py                              # descarga el PDF consolidado del BOE
  python3 scripts/update-cap-es.py --accept                     # da por revisadas las huellas (baseline)
Salida: data/cap/es/amounts.json, data/cap/es/watch.json
"""
import argparse, datetime, hashlib, json, os, re, subprocess, sys, tempfile, urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'data', 'cap', 'es')
BOE_ID = 'BOE-A-2022-23048'
PDF_URL = 'https://www.boe.es/buscar/pdf/2022/%s-consolidado.pdf' % BOE_ID
PAGE_URL = 'https://www.boe.es/buscar/act.php?id=%s' % BOE_ID
CAMPAIGNS = [2023, 2024, 2025, 2026, 2027]

NUM = r'\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?'
NUMRE = re.compile(NUM)


def num(tok):
    return float(tok.replace('.', '').replace(',', '.'))


def tail_numbers(line, n):
    """Los n últimos números de una línea (separados por espacios), o None."""
    toks = line.split()
    if len(toks) < n:
        return None
    last = toks[-n:]
    if not all(re.fullmatch(NUM, t) for t in last):
        return None
    return [num(t) for t in last]


# ---------------------------------------------------------------- texto
def read_text(args):
    if args.text:
        return open(args.text, encoding='utf-8').read()
    d = tempfile.mkdtemp()
    pdf = os.path.join(d, 'rd.pdf')
    req = urllib.request.Request(PDF_URL, headers={'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndexBot/1.0; +https://dehesaindex.com)'})
    last = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
            if data[:4] != b'%PDF':
                raise RuntimeError('la respuesta del BOE no es un PDF')
            open(pdf, 'wb').write(data)
            break
        except Exception as e:  # noqa: BLE001
            last = e
    else:
        sys.exit('No se pudo descargar el PDF consolidado del BOE: %r' % (last,))
    txt = os.path.join(d, 'rd.txt')
    subprocess.run(['pdftotext', '-layout', pdf, txt], check=True)
    return open(txt, encoding='utf-8').read()


NOISE = re.compile(r'^\s*(P[áa]gina\s+\d+|BOLET[ÍI]N OFICIAL DEL ESTADO|LEGISLACI[ÓO]N CONSOLIDADA)\s*$')


def clean_lines(text):
    return [l.rstrip() for l in text.split('\n') if not NOISE.match(l)]


def annex_blocks(lines):
    """{'I': [líneas], ...} a partir de las cabeceras 'ANEXO X' del cuerpo (no del índice)."""
    heads = []
    for i, l in enumerate(lines):
        m = re.fullmatch(r'\s*ANEXO\s+([IVX]+)\s*', l)
        if m:
            heads.append((m.group(1), i))
    out = {}
    for k, (name, i) in enumerate(heads):
        j = heads[k + 1][1] if k + 1 < len(heads) else len(lines)
        out[name] = lines[i + 1:j]
    return out


def article_blocks(lines):
    """{'13': texto, ...}: del 'Artículo N.' hasta el siguiente 'Artículo' o encabezado de capítulo."""
    heads = []
    for i, l in enumerate(lines):
        m = re.match(r'^\s{0,6}Art[ií]culo\s+(\d+)\.\s', l)
        if m:
            heads.append((m.group(1), i))
    out = {}
    for k, (n, i) in enumerate(heads):
        j = heads[k + 1][1] if k + 1 < len(heads) else len(lines)
        if n not in out:
            out[n] = lines[i:j]
    return out


def norm_hash(ls):
    s = re.sub(r'\s+', ' ', ' '.join(ls)).strip()
    s = s.replace('- ', '-')
    return hashlib.sha256(s.encode('utf-8')).hexdigest(), len(s)



API = 'https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/%s' % BOE_ID
UA = {'User-Agent': 'Mozilla/5.0 (compatible; DehesaIndexBot/1.0; +https://dehesaindex.com)'}


def fetch_xml(url):
    last = None
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers=dict(UA, Accept='application/xml'))
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode('utf-8')
        except Exception as e:  # noqa: BLE001
            last = e
    sys.exit('No se pudo leer la API del BOE (%s): %r' % (url, last))


def parse_meta(xml):
    """Fecha de última actualización de la consolidación y estado de vigencia (API de legislación consolidada)."""
    root = ET.fromstring(xml)
    m = root.find('./data/metadatos')
    assert m is not None, 'API BOE: sin metadatos'
    g = lambda k: (m.findtext(k) or '').strip()  # noqa: E731
    upd = g('fecha_actualizacion')
    mm = re.fullmatch(r'(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z', upd)
    assert mm, 'API BOE: fecha_actualizacion con formato inesperado: %r' % upd
    assert g('identificador') == BOE_ID, 'API BOE: identificador inesperado'
    return {
        'updatedAt': '%s-%s-%sT%s:%s:%sZ' % mm.groups(),
        'inForce': g('estatus_derogacion') == 'N' and g('estatus_anulacion') == 'N' and g('vigencia_agotada') == 'N',
        'consolidationState': (m.find('estado_consolidacion').text or '').strip() if m.find('estado_consolidacion') is not None else None,
        'eli': g('url_eli'),
    }


def parse_analysis(xml):
    """Normas posteriores que modifican, derogan o corrigen el texto (lista de la API)."""
    root = ET.fromstring(xml)
    out = []
    for p in root.findall('./data/analisis/referencias/posteriores/posterior'):
        rel = p.find('relacion')
        out.append({'id': (p.findtext('id_norma') or '').strip(), 'relation': ((rel.text if rel is not None else '') or '').strip(), 'text': re.sub(r'\s+', ' ', (p.findtext('texto') or '')).strip()})
    assert out, 'API BOE: la lista de modificaciones está vacía (formato cambiado?)'
    out.sort(key=lambda x: x['id'])
    return out


# ---------------------------------------------------------------- anexos
def parse_vii(blk):
    """Tres tablas por región (20 filas + total) con 5 campañas + total."""
    tables, cur = [], []
    for l in blk:
        m = re.match(r'^\s*Reg[ií][oó]n\s+(\d+)\.\s+(.*)$', l)
        if m:
            toks = m.group(2).split()
            vals = [num(t) for t in toks[:5] if re.fullmatch(NUM, t)]
            if len(vals) == 5:
                cur.append((int(m.group(1)), vals))
            continue
        m = re.match(r'^\s*Importe total\.\s+(.*)$', l)
        if m and cur:
            toks = m.group(1).split()
            vals = [num(t) for t in toks[:5] if re.fullmatch(NUM, t)]
            tables.append((cur, vals))
            cur = []
    assert len(tables) == 3, 'Anexo VII: se esperaban 3 tablas, hay %d' % len(tables)
    young_women = None
    for l in blk:
        if 'mujeres jóvenes' in l or 'Importe específico para' in l:
            pass
    # fila 'Importe específico para mujeres jóvenes.' (valores en la línea siguiente a la etiqueta)
    for i, l in enumerate(blk):
        if re.search(r'Importe espec[ií]fico para', l):
            for k in range(i, min(i + 3, len(blk))):
                v = tail_numbers(blk[k], 6)
                if v:
                    young_women = v[:5]
                    break
    names = ['abrs', 'redistributive', 'young']
    res = {}
    for name, (rows, total) in zip(names, tables):
        assert [r for r, _ in rows] == list(range(1, 21)), 'Anexo VII %s: regiones' % name
        res[name] = {'regions': {str(r): v for r, v in rows}, 'total': total}
        for c in range(5):
            s = sum(v[c] for _, v in rows)
            assert abs(s - total[c]) < 2.0, 'Anexo VII %s campaña %d: la suma de regiones (%.2f) no cuadra con el total (%.2f)' % (name, CAMPAIGNS[c], s, total[c])
    assert young_women and len(young_women) == 5, 'Anexo VII: falta la fila de mujeres jóvenes'
    res['youngWomen'] = young_women
    return res


def parse_viii(blk):
    tr = re.compile(r'(\d+(?:,\d+)?)\s*ha\s+a\s+(\d+(?:,\d+)?)\s*ha\.\s+(\d+(?:,\d+)?)')
    found = []
    for l in blk:
        for m in tr.finditer(l):
            found.append({'fromHa': num(m.group(1)), 'toHa': num(m.group(2)), 'amount': num(m.group(3))})
    assert len(found) == 40, 'Anexo VIII: se esperaban 40 tramos, hay %d' % len(found)
    res = {}
    for r in range(20):
        t1, t2 = found[2 * r], found[2 * r + 1]
        assert t1['fromHa'] == 0.0 and t2['fromHa'] > t1['toHa'] and t2['fromHa'] - t1['toHa'] < 0.02, 'Anexo VIII región %d: tramos incoherentes' % (r + 1)
        res[str(r + 1)] = [t1, t2]
    return res


TRIPLET = re.compile(r'Importe unitario (planificado|m[ií]nimo|m[aá]ximo)\.\s+(.*)$')


def triplets(blk):
    cur = {}
    out = []
    order = ['planificado', 'mínimo', 'máximo']
    for l in blk:
        m = TRIPLET.search(l)
        if not m:
            continue
        kind = m.group(1).replace('í', 'i').replace('á', 'a')
        toks = m.group(2).split()
        vals = [num(t) for t in toks[:5] if re.fullmatch(NUM, t)]
        assert len(vals) == 5, 'Anexo IX: fila con %d valores: %s' % (len(vals), l.strip())
        want = ['planificado', 'minimo', 'maximo'][len(cur)]
        assert kind == want, 'Anexo IX: orden inesperado (%s tras %s)' % (kind, list(cur))
        cur[kind] = vals
        if len(cur) == 3:
            out.append({'planned': cur['planificado'], 'min': cur['minimo'], 'max': cur['maximo']})
            cur = {}
    assert not cur, 'Anexo IX: fila incompleta al final'
    return out


def parse_ix(blk):
    i_red = next(i for i, l in enumerate(blk) if re.search(r'Ayuda Complementaria a la Renta Redistributiva', l))
    i_joven = next(i for i, l in enumerate(blk) if re.search(r'Ayuda Complementaria a la renta para los j', l))
    abrs = triplets(blk[:i_red])
    red = triplets(blk[i_red:i_joven])
    joven = triplets(blk[i_joven:])
    assert len(abrs) == 20, 'Anexo IX ayuda básica: %d filas' % len(abrs)
    assert len(red) == 40, 'Anexo IX redistributiva: %d filas' % len(red)
    assert len(joven) == 40, 'Anexo IX jóvenes: %d filas' % len(joven)
    young, women = joven[0::2], joven[1::2]
    for r in range(20):
        # En el Anexo IX el importe planificado de las mujeres jóvenes coincide con el máximo de la región.
        assert women[r]['planned'] == young[r]['max'], 'Anexo IX jóvenes: la fila de mujeres de la región %d no empareja' % (r + 1)
    return {'abrs': abrs, 'redistributive': [[red[2 * r], red[2 * r + 1]] for r in range(20)], 'young': young, 'youngWomen': women}


# Filas del Anexo X en el orden en que aparecen (cada una = planificado, mínimo, máximo).
# kw: palabras que deben aparecer en el texto de la fila (comprobación de que la etiqueta casa).
ECO_ROWS = [
    ('a', 'pastoreo-extensivo', 'pastos-humedos', 'peninsula', ['PASTOREO EXTENSIVO', 'húmedos'], 'Pastos húmedos: pastoreo extensivo'),
    ('a', 'islas-biodiversidad', 'pastos-humedos', 'peninsula', ['ISLAS DE BIODIVERSIDAD', 'húmedos'], 'Pastos húmedos: islas de biodiversidad'),
    ('a', 'siega-sostenible', 'pastos-humedos', 'peninsula', ['SIEGA SOSTENIBLE', 'húmedos'], 'Pastos húmedos: siega sostenible'),
    ('b', 'pastoreo-extensivo', 'pastos-mediterraneos', 'peninsula', ['PASTOREO EXTENSIVO', 'mediterráneos'], 'Pastos mediterráneos: pastoreo extensivo'),
    ('b', 'islas-biodiversidad', 'pastos-mediterraneos', 'peninsula', ['ISLAS DE BIODIVERSIDAD', 'mediterráneos'], 'Pastos mediterráneos: islas de biodiversidad'),
    ('b', 'siega-sostenible', 'pastos-mediterraneos', 'peninsula', ['SIEGA SOSTENIBLE', 'mediterráneos'], 'Pastos mediterráneos: siega sostenible'),
    ('b', 'pastoreo-extensivo', 'pastos-mediterraneos', 'insular', ['PASTOREO EXTENSIVO', 'nsulares'], 'Pastos mediterráneos insulares: pastoreo extensivo'),
    ('b', 'islas-biodiversidad', 'pastos-mediterraneos', 'insular', ['ISLAS DE BIODIVERSIDAD', 'nsulares'], 'Pastos mediterráneos insulares: islas de biodiversidad'),
    ('b', 'siega-sostenible', 'pastos-mediterraneos', 'insular', ['SIEGA SOSTENIBLE', 'nsulares'], 'Pastos mediterráneos insulares: siega sostenible'),
    ('c', 'rotacion-especies-mejorantes', 'cultivo-secano', 'peninsula', ['ROTACIÓN CON ESPECIES MEJORANTES', 'secano.'], 'Tierras de cultivo de secano: rotación con especies mejorantes'),
    ('c', 'siembra-directa', 'cultivo-secano', 'peninsula', ['SIEMBRA DIRECTA', 'secano.'], 'Tierras de cultivo de secano: siembra directa'),
    ('d', 'rotacion-especies-mejorantes', 'cultivo-secano-humedo', 'peninsula', ['ROTACIÓN CON ESPECIES MEJORANTES', 'secano húmedo'], 'Tierras de cultivo de secano húmedo: rotación con especies mejorantes'),
    ('d', 'siembra-directa', 'cultivo-secano-humedo', 'peninsula', ['SIEMBRA DIRECTA', 'secano húmedo'], 'Tierras de cultivo de secano húmedo: siembra directa'),
    ('e', 'rotacion-especies-mejorantes', 'cultivo-regadio', 'peninsula', ['ROTACIÓN CON ESPECIES MEJORANTES', 'regadío.'], 'Tierras de cultivo de regadío: rotación con especies mejorantes'),
    ('e', 'siembra-directa', 'cultivo-regadio', 'peninsula', ['SIEMBRA DIRECTA', 'regadío.'], 'Tierras de cultivo de regadío: siembra directa'),
    ('c', 'rotacion-especies-mejorantes', 'cultivo-secano', 'baleares', ['ROTACIÓN CON ESPECIES MEJORANTES', 'Balears'], 'Tierras de cultivo de secano (Illes Balears): rotación con especies mejorantes'),
    ('c', 'siembra-directa', 'cultivo-secano', 'baleares', ['SIEMBRA DIRECTA', 'Balears'], 'Tierras de cultivo de secano (Illes Balears): siembra directa'),
    ('e', 'rotacion-especies-mejorantes', 'cultivo-regadio', 'baleares', ['ROTACIÓN CON ESPECIES MEJORANTES', 'Balears'], 'Tierras de cultivo de regadío (Illes Balears): rotación con especies mejorantes'),
    ('e', 'siembra-directa', 'cultivo-regadio', 'baleares', ['SIEMBRA DIRECTA', 'Balears'], 'Tierras de cultivo de regadío (Illes Balears): siembra directa'),
    ('f', 'cubiertas-vegetales', 'lenosos-llano', 'peninsula', ['llanos', 'Península', 'CUBIERTAS VEGETALES'], 'Leñosos en terreno llano (pendiente < 5 %): cubiertas vegetales'),
    ('f', 'cubiertas-inertes', 'lenosos-llano', 'peninsula', ['llanos', 'Península', 'CUBIERTAS INERTES'], 'Leñosos en terreno llano (pendiente < 5 %): cubiertas inertes'),
    ('g', 'cubiertas-vegetales', 'lenosos-pendiente-media', 'peninsula', ['pendiente media', 'Península', 'CUBIERTAS VEGETALES'], 'Leñosos en pendiente media (5–10 %): cubiertas vegetales'),
    ('g', 'cubiertas-inertes', 'lenosos-pendiente-media', 'peninsula', ['pendiente media', 'Península', 'CUBIERTAS INERTES'], 'Leñosos en pendiente media (5–10 %): cubiertas inertes'),
    ('h', 'cubiertas-vegetales', 'lenosos-pendiente-elevada', 'peninsula', ['elevada pendiente', 'Península', 'CUBIERTAS VEGETALES'], 'Leñosos en pendiente elevada (≥ 10 %) y bancales: cubiertas vegetales'),
    ('h', 'cubiertas-inertes', 'lenosos-pendiente-elevada', 'peninsula', ['elevada pendiente', 'Península', 'CUBIERTAS INERTES'], 'Leñosos en pendiente elevada (≥ 10 %) y bancales: cubiertas inertes'),
    ('f', 'cubiertas-vegetales', 'lenosos-llano', 'baleares', ['llanos', 'Balears', 'CUBIERTAS VEGETALES'], 'Leñosos en terreno llano (Illes Balears): cubiertas vegetales'),
    ('f', 'cubiertas-inertes', 'lenosos-llano', 'baleares', ['llanos', 'Balears', 'CUBIERTAS INERTES'], 'Leñosos en terreno llano (Illes Balears): cubiertas inertes'),
    ('g', 'cubiertas-vegetales', 'lenosos-pendiente-media', 'baleares', ['pendiente media', 'Balears', 'CUBIERTAS VEGETALES'], 'Leñosos en pendiente media (Illes Balears): cubiertas vegetales'),
    ('g', 'cubiertas-inertes', 'lenosos-pendiente-media', 'baleares', ['pendiente media', 'Balears', 'CUBIERTAS INERTES'], 'Leñosos en pendiente media (Illes Balears): cubiertas inertes'),
    ('h', 'cubiertas-vegetales', 'lenosos-pendiente-elevada', 'baleares', ['elevada pendiente', 'Balears', 'CUBIERTAS VEGETALES'], 'Leñosos en pendiente elevada y bancales (Illes Balears): cubiertas vegetales'),
    ('h', 'cubiertas-inertes', 'lenosos-pendiente-elevada', 'baleares', ['elevada pendiente', 'Balears', 'CUBIERTAS INERTES'], 'Leñosos en pendiente elevada y bancales (Illes Balears): cubiertas inertes'),
    ('i', 'espacios-biodiversidad', 'cultivo-y-permanentes', 'peninsula', ['espacios de biodiversidad en tierras de cultivo y cultivos permanentes'], 'Espacios de biodiversidad en tierras de cultivo y cultivos permanentes'),
    ('i', 'espacios-biodiversidad', 'cultivo-bajo-agua', 'peninsula', ['espacios de biodiversidad en tierras de cultivo bajo agua'], 'Espacios de biodiversidad en tierras de cultivo bajo agua'),
]


def parse_x(blk):
    """Cada fila = PLANIFICADO/MÍNIMO/MÁXIMO con 5 valores; la etiqueta está en las líneas de alrededor."""
    idx = []  # (índice de la línea MÁXIMO, planned, min, max)
    cur = {}
    start = 0
    rows = []
    for i, l in enumerate(blk):
        m = re.search(r'\b(PLANIFICADO|M[ÍI]NIMO|M[ÁA]XIMO)\.\s+(.*)$', l)
        if not m:
            continue
        kind = m.group(1).replace('Í', 'I').replace('Á', 'A')
        toks = m.group(2).split()
        vals = [num(t) for t in toks[:5] if re.fullmatch(NUM, t)]
        assert len(vals) == 5, 'Anexo X: fila con %d valores: %s' % (len(vals), l.strip())
        want = ['PLANIFICADO', 'MINIMO', 'MAXIMO'][len(cur)]
        assert kind == want, 'Anexo X: orden inesperado (%s tras %s)' % (kind, list(cur))
        if not cur:
            first = i
        cur[kind] = vals
        if len(cur) == 3:
            rows.append((first, i, cur))
            cur = {}
    assert not cur
    assert len(rows) == len(ECO_ROWS), 'Anexo X: se esperaban %d filas y hay %d' % (len(ECO_ROWS), len(rows))
    out = []
    prev_end = 0
    for k, ((first, last, vals), spec) in enumerate(zip(rows, ECO_ROWS)):
        # texto de la etiqueta: desde el fin de la fila anterior hasta el final de ésta (quitando las columnas de cifras)
        nxt_first = rows[k + 1][0] if k + 1 < len(rows) else len(blk)
        window = blk[prev_end + (1 if k else 0):last + 1]
        txt = ' '.join(re.sub(r'(PLANIFICADO|M[ÍI]NIMO|M[ÁA]XIMO)\.\s+[\d.,\s]+', ' ', w) for w in window)
        txt = re.sub(r'\s+', ' ', txt)
        for kw in spec[4]:
            assert kw.lower() in txt.lower(), 'Anexo X fila %d (%s): no aparece «%s» en el texto de la fila: %s' % (k + 1, spec[5], kw, txt[:200])
        prev_end = last
        scheme, practice, surface, territory = spec[0], spec[1], spec[2], spec[3]
        out.append({
            'id': 'eco-%s-%s-%s%s' % (scheme, surface, practice, '' if territory == 'peninsula' else '-' + territory),
            'scheme': scheme, 'practice': practice, 'surfaceType': surface, 'territory': territory,
            'label': spec[5], 'planned': vals['PLANIFICADO'], 'min': vals['MINIMO'], 'max': vals['MAXIMO'],
        })
    assert len({o['id'] for o in out}) == len(out), 'Anexo X: identificadores repetidos'
    return out


ECO_BUDGET = [
    ('a', 'Pastos húmedos', ['húmedos']),
    ('b', 'Pastos mediterráneos', ['mediterráneos']),
    ('c', 'Tierras de cultivo de secano', ['en tierras de cultivo de', 'secano.']),
    ('d', 'Tierras de cultivo de secano húmedo', ['secano húmedo']),
    ('e', 'Tierras de cultivo de regadío', ['regadío.']),
    ('f', 'Leñosos en terrenos llanos', ['terrenos llanos']),
    ('g', 'Leñosos en pendiente media', ['pendiente media']),
    ('h', 'Leñosos en elevada pendiente y bancales', ['elevada', 'bancales']),
    ('i', 'Espacios de biodiversidad en tierras de cultivo y cultivos permanentes', ['cultivos permanentes']),
    ('i-agua', 'Espacios de biodiversidad en tierras de cultivo bajo agua', ['bajo agua']),
]


def parse_xi(blk):
    rows = []
    for i, l in enumerate(blk):
        v = tail_numbers(l, 5)
        if v and all(x > 1e6 for x in v):
            ctx = ' '.join(blk[max(0, i - 1):i + 2])
            rows.append((ctx, v))
    assert len(rows) == len(ECO_BUDGET), 'Anexo XI: %d filas (se esperaban %d)' % (len(rows), len(ECO_BUDGET))
    out = []
    for (ctx, v), (code, label, kws) in zip(rows, ECO_BUDGET):
        for kw in kws:
            assert kw.lower() in ctx.lower(), 'Anexo XI %s: falta «%s» en %s' % (code, kw, ctx[:160])
        out.append({'scheme': code, 'label': label, 'amount': v})
    return out


DEG = [
    ('pastos-humedos', 'Pastos húmedos', 'Pastos húmedos'),
    ('pastos-mediterraneos', 'Pastos mediterráneos', 'Pastos mediterráneos'),
    ('cultivo-secano', 'Tierras de cultivo de secano', 'Tierras de cultivo de secano.'),
    ('cultivo-secano-humedo', 'Tierras de cultivo de secano húmedo', 'Tierras de cultivo de secano húmedo.'),
    ('cultivo-regadio', 'Tierras de cultivo de regadío', 'Tierras de cultivo de regadío.'),
    ('lenosos-llano', 'Leñosos en terrenos llanos (pendiente < 5 %)', 'terrenos llanos'),
    ('lenosos-pendiente-media', 'Leñosos en pendiente media (5–10 %)', 'pendiente media'),
    ('lenosos-pendiente-elevada', 'Leñosos en elevada pendiente (≥ 10 %)', 'elevada pendiente'),
]


def parse_xii(blk):
    rows = []
    for l in blk:
        m = re.match(r'^\s*([A-Za-zÁÉÍÓÚáéíóúñ]\S*(?:\s\S+)*?)\s+(\d{1,3})\s*$', l)
        if m:
            rows.append((m.group(1), int(m.group(2))))
    assert len(rows) == len(DEG), 'Anexo XII: %d filas' % len(rows)
    out = []
    for (txt, v), (sid, label, kw) in zip(rows, DEG):
        assert kw.lower() in txt.lower(), 'Anexo XII: «%s» no casa con «%s»' % (txt, kw)
        out.append({'surfaceType': sid, 'label': label, 'thresholdHa': v})
    return out


def pair_rows(blk, n_pairs, header_years=True):
    """Líneas del Anexo XX/XXII que terminan en 5 importes de campañas (se descarta la cabecera de años)."""
    rows = []
    for l in blk:
        v = tail_numbers(l, 5)
        if not v:
            continue
        if [int(x) for x in v] == CAMPAIGNS:
            continue
        rows.append(v)
    assert len(rows) == n_pairs * 2, 'filas de importes: %d (se esperaban %d)' % (len(rows), n_pairs * 2)
    out = []
    for k in range(n_pairs):
        mn, mx = rows[2 * k], rows[2 * k + 1]
        assert all(a <= b for a, b in zip(mn, mx)), 'mínimo > máximo en el par %d' % (k + 1)
        out.append((mn, mx))
    return out


AID_CROPS = [
    ('legumbres-peninsula', 'Legumbres (producción), Península'),
    ('legumbres-baleares', 'Legumbres (producción), Illes Balears'),
    ('resto-leguminosas-peninsula', 'Resto de leguminosas (producción), Península'),
    ('resto-leguminosas-baleares', 'Resto de leguminosas (producción), Illes Balears'),
    ('semillas-legumbres-peninsula', 'Semillas certificadas de legumbres, Península'),
    ('semillas-legumbres-baleares', 'Semillas certificadas de legumbres, Illes Balears'),
    ('semillas-resto-leguminosas-peninsula', 'Semillas certificadas del resto de leguminosas, Península'),
    ('semillas-resto-leguminosas-baleares', 'Semillas certificadas del resto de leguminosas, Illes Balears'),
    ('arroz-peninsula', 'Arroz, Península'),
    ('arroz-baleares', 'Arroz, Illes Balears'),
    ('remolacha-primaveral', 'Remolacha azucarera, siembra primaveral'),
    ('remolacha-otonal', 'Remolacha azucarera, siembra otoñal'),
    ('tomate-transformacion', 'Tomate para transformación'),
    ('frutos-secos-peninsula', 'Frutos secos en zonas con riesgo de desertificación, Península'),
    ('frutos-secos-insular', 'Frutos secos en zonas con riesgo de desertificación, insular'),
    ('uva-pasa', 'Uva pasa (producción tradicional)'),
    ('olivar-peninsula-tramo-1', 'Olivar con dificultades específicas y alto valor medioambiental, Península, tramo 1'),
    ('olivar-tramo-2', 'Olivar con dificultades específicas y alto valor medioambiental, tramo 2'),
    ('olivar-insular', 'Olivar con dificultades específicas y alto valor medioambiental, insular'),
]

AID_LIVESTOCK = [
    ('vacuno-carne-peninsula', 'Vacuno de carne extensivo, Península'),
    ('vacuno-carne-peninsula-raza-autoctona', 'Vacuno de carne extensivo, Península, raza autóctona'),
    ('vacuno-carne-insular', 'Vacuno de carne extensivo, insular'),
    ('vacuno-carne-insular-raza-autoctona', 'Vacuno de carne extensivo, insular, raza autóctona'),
    ('terneros-nacimiento-peninsula', 'Engorde de terneros en la explotación de nacimiento, Península'),
    ('terneros-nacimiento-insular', 'Engorde de terneros en la explotación de nacimiento, insular'),
    ('terneros-sostenible-peninsula-hasta-600', 'Engorde sostenible de terneros, Península, hasta 600 terneros'),
    ('terneros-sostenible-peninsula-601-1417', 'Engorde sostenible de terneros, Península, de 601 a 1.417 terneros'),
    ('terneros-sostenible-insular', 'Engorde sostenible de terneros, insular'),
    ('leche-vaca-peninsula-hasta-150', 'Leche de vaca, Península, hasta 150 vacas'),
    ('leche-vaca-peninsula-151-725', 'Leche de vaca, Península, de 151 a 725 vacas'),
    ('leche-vaca-montana-hasta-150', 'Leche de vaca, zonas de montaña, hasta 150 vacas'),
    ('leche-vaca-montana-151-725', 'Leche de vaca, zonas de montaña, de 151 a 725 vacas'),
    ('leche-vaca-insular-hasta-725', 'Leche de vaca, insular, hasta 725 vacas'),
    ('ovino-caprino-carne-peninsula', 'Ovino y caprino de carne, Península'),
    ('ovino-caprino-carne-insular', 'Ovino y caprino de carne, insular'),
    ('leche-ovino-caprino-peninsula', 'Leche de oveja y cabra, Península'),
    ('leche-ovino-caprino-insular', 'Leche de oveja y cabra, insular'),
    ('ovino-caprino-rastrojeras-peninsula', 'Ovino y caprino sin pastos (rastrojeras, barbechos y restos hortofrutícolas), Península'),
    ('ovino-caprino-rastrojeras-insular', 'Ovino y caprino sin pastos (rastrojeras, barbechos y restos hortofrutícolas), insular'),
]


def parse_assoc(blk, spec, kind):
    pairs = pair_rows(blk, len(spec))
    out = []
    for (mn, mx), (sid, label) in zip(pairs, spec):
        out.append({'id': 'asoc-' + sid, 'label': label, 'kind': kind, 'unit': 'EUR/ha' if kind == 'crop' else 'EUR/animal', 'min': mn, 'max': mx})
    return out


# ---------------------------------------------------------------- huellas
WATCH_ARTICLES = ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '104', '108', '112', '113', '116', '118', '119', '122', '124', '125']
WATCH_ANNEXES = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XX', 'XXII']


def transitory_blocks(lines):
    heads = []
    for i, l in enumerate(lines):
        m = re.match(r'^Disposici[óo]n transitoria (\w+)\.', l)
        if m:
            heads.append((m.group(1), i))
        if re.match(r'^Disposici[óo]n derogatoria', l) and heads:
            heads.append(('_fin', i))
            break
    out = {}
    for k in range(len(heads) - 1):
        name, i = heads[k]
        out[name] = lines[i:heads[k + 1][1]]
    return out


def build(text):
    lines = clean_lines(text)
    ann = annex_blocks(lines)
    arts = article_blocks(lines)
    for a in ['VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XX', 'XXII']:
        assert a in ann and len(ann[a]) > 5, 'No se encuentra el Anexo %s' % a
    vii = parse_vii(ann['VII'])
    viii = parse_viii(ann['VIII'])
    ix = parse_ix(ann['IX'])
    eco = parse_x(ann['X'])
    xi = parse_xi(ann['XI'])
    xii = parse_xii(ann['XII'])
    crops = parse_assoc(ann['XX'], AID_CROPS, 'crop')
    live = parse_assoc(ann['XXII'], AID_LIVESTOCK, 'livestock')
    # Cada ecorrégimen debe tener su umbral de degresividad
    surf = {d['surfaceType'] for d in xii}
    for e in eco:
        if e['surfaceType'] in ('cultivo-y-permanentes', 'cultivo-bajo-agua'):
            continue
        assert e['surfaceType'] in surf, 'sin umbral de degresividad: ' + e['surfaceType']
    for e in eco:
        for c in range(5):
            assert 0 < e['min'][c] <= e['planned'][c] <= e['max'][c], 'Anexo X %s campaña %d: el planificado no está entre mínimo y máximo' % (e['id'], CAMPAIGNS[c])
    # Regiones
    regions = {}
    discrepancies = []
    for r in range(1, 21):
        key = str(r)
        tiers = []
        for t in range(2):
            p = viii[key][t]
            amt = ix['redistributive'][r - 1][t]
            tiers.append({'fromHa': p['fromHa'], 'toHa': p['toHa'], 'annexVIIIAmount': p['amount'], 'planned': amt['planned'], 'min': amt['min'], 'max': amt['max']})
            if abs(p['amount'] - amt['planned'][3]) > 0.005:
                discrepancies.append({'region': r, 'tier': t + 1, 'annexVIII': p['amount'], 'annexIX2026Planned': amt['planned'][3]})
        regions[key] = {
            'abrs': ix['abrs'][r - 1],
            'redistributiveTiers': tiers,
            'young': ix['young'][r - 1],
            'youngWomen': ix['youngWomen'][r - 1],
            'allocation': {'abrs': vii['abrs']['regions'][key], 'redistributive': vii['redistributive']['regions'][key], 'young': vii['young']['regions'][key]},
        }
    for r, reg in regions.items():
        for k in ('abrs', 'young', 'youngWomen'):
            x = reg[k]
            for c in range(5):
                assert 0 < x['min'][c] <= x['planned'][c], 'Anexo IX región %s %s campaña %d: mínimo > planificado' % (r, k, CAMPAIGNS[c])
    amounts = {
        'schemaVersion': 1,
        'country': 'ES',
        'scheme': 'PEPAC 2023-2027',
        'status': 'CURRENT',
        'kind': 'RD_PLANNED_MIN_MAX',
        'campaigns': CAMPAIGNS,
        'source': {'id': 'boe_es', 'instrument': 'Real Decreto 1048/2022, de 27 de diciembre', 'boeRef': BOE_ID, 'url': PAGE_URL, 'pdfUrl': PDF_URL, 'consolidated': True},
        'allocations': {'abrs': vii['abrs']['total'], 'redistributive': vii['redistributive']['total'], 'young': vii['young']['total'], 'youngWomen': vii['youngWomen']},
        'regions': regions,
        'ecoschemes': eco,
        'ecoschemeBudget': xi,
        'degressivity': xii,
        'associatedAid': crops + live,
        'discrepancies': discrepancies,
        'notes': [
            'Importes del real decreto: planificado, mínimo y máximo. No son los importes unitarios de cada campaña que publica el FEGA (provisionales, revisados y definitivos).',
            'Los importes de siembra directa y cubiertas vegetales suben 25 €/ha si la persona se compromete a repetir la práctica el año siguiente (nota del Anexo X).',
            'Anexo IX: los importes provisionales de la ayuda redistributiva y de jóvenes coinciden con los planificados; los de la ayuda básica con el valor nominal de los derechos (art. 124.2).',
            'Los números de región son los de la ayuda básica (RD 1045/2022); aquí no se reproduce su descripción.',
        ],
    }
    watch = {'articles': {}, 'annexes': {}, 'provisions': {}}
    for n in WATCH_ARTICLES:
        assert n in arts, 'No se encuentra el artículo %s' % n
        h, ln = norm_hash(arts[n])
        watch['articles'][n] = {'sha256': h, 'chars': ln}
    tr = transitory_blocks(lines)
    assert len(tr) >= 4 and 'cuarta' in tr, 'No se encuentran las disposiciones transitorias'
    for k, v in tr.items():
        h, ln = norm_hash(v)
        watch['provisions'][k] = {'sha256': h, 'chars': ln}
    for a in WATCH_ANNEXES:
        h, ln = norm_hash(ann[a])
        watch['annexes'][a] = {'sha256': h, 'chars': ln}
    return amounts, watch


def stable(o):
    return json.dumps(o, ensure_ascii=False, sort_keys=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--text')
    ap.add_argument('--accept', action='store_true', help='da por revisadas las huellas actuales (la línea base pasa a ser la actual)')
    ap.add_argument('--meta-xml', help='XML de metadatos (modo sin red)')
    ap.add_argument('--analysis-xml', help='XML de análisis (modo sin red)')
    ap.add_argument('--out', default=OUT_DIR)
    ap.add_argument('--text-date', help='fecha (YYYY-MM-DD) del texto consolidado si se lee de un archivo')
    args = ap.parse_args()
    text = read_text(args)
    meta = parse_meta(open(args.meta_xml, encoding='utf-8').read() if args.meta_xml else fetch_xml(API + '/metadatos'))
    amend = parse_analysis(open(args.analysis_xml, encoding='utf-8').read() if args.analysis_xml else fetch_xml(API + '/analisis'))
    assert meta['inForce'], 'El BOE ya no da el RD 1048/2022 como vigente: revisar a mano'
    amounts, watch_now = build(text)
    amounts['source']['consolidatedAt'] = meta['updatedAt']
    watch_now['legal'] = {'consolidatedAt': meta['updatedAt'], 'amendments': amend}
    today = args.text_date or datetime.datetime.utcnow().strftime('%Y-%m-%d')
    os.makedirs(args.out, exist_ok=True)
    ap_path = os.path.join(args.out, 'amounts.json')
    wp_path = os.path.join(args.out, 'watch.json')
    prev_amounts = json.load(open(ap_path)) if os.path.exists(ap_path) else None
    prev_watch = json.load(open(wp_path)) if os.path.exists(wp_path) else None

    # Registro de cambios de importes
    changes = list((prev_amounts or {}).get('changes', []))
    core = {k: v for k, v in amounts.items()}
    if prev_amounts:
        old_core = {k: v for k, v in prev_amounts.items() if k not in ('verifiedAt', 'checkedAt', 'changes')}
        if stable(old_core) != stable(core):
            changes.append({'detectedAt': today, 'summary': 'Cambian importes o estructura de los anexos extraídos del BOE; revisar la diferencia en el historial de git.'})
    amounts['verifiedAt'] = today
    amounts['changes'] = changes
    amounts['verifiedAt'] = today

    # Huellas: línea base (lo que las reglas curadas verificaron) vs actual
    baseline = (prev_watch or {}).get('baseline') or watch_now
    if args.accept:
        baseline = watch_now
    review = []
    for group, lab in (('articles', 'Artículo '), ('annexes', 'Anexo '), ('provisions', 'Disposición transitoria ')):
        for k, v in watch_now[group].items():
            b = baseline.get(group, {}).get(k)
            if not b or b['sha256'] != v['sha256']:
                review.append(lab + k)
    b_ids = {a['id'] for a in (baseline.get('legal') or {}).get('amendments', [])}
    for a in amend:
        if (baseline.get('legal') or {}) and a['id'] not in b_ids:
            review.append('Nueva norma que lo modifica: %s (%s)' % (a['id'], a['text'][:80]))
    watch = {
        'schemaVersion': 1, 'country': 'ES', 'source': 'boe_es', 'boeRef': BOE_ID,
        'checkedAt': today,
        'baseline': baseline, 'current': watch_now,
        'reviewNeeded': review,
        'note': 'Huellas del texto consolidado de los artículos y anexos que citan las reglas de data/cap/es/rules.json. Si «reviewNeeded» no está vacío, el BOE ha cambiado ese texto desde que se revisaron las reglas: hay que releerlo y, si procede, actualizar rules.json y ejecutar --accept.',
    }
    json.dump(amounts, open(ap_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    open(ap_path, 'a').write('\n')
    json.dump(watch, open(wp_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    open(wp_path, 'a').write('\n')
    print('ecorregímenes:', len(amounts['ecoschemes']), '| ayudas asociadas:', len(amounts['associatedAid']), '| discrepancias VIII/IX:', len(amounts['discrepancies']), '| revisar:', review or 'nada')


if __name__ == '__main__':
    main()
