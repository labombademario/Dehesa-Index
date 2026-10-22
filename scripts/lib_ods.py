"""Lector minimo de hojas de calculo OpenDocument (.ods) sin dependencias: devuelve {nombre_hoja: [[celda,...],...]} con numeros como float y texto como str."""
import io, zipfile
import xml.etree.ElementTree as ET

NS = {'t': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0', 'o': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0', 'x': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'}
T = '{%s}' % NS['t']; O = '{%s}' % NS['o']; X = '{%s}' % NS['x']


def _cell(c):
    vt = c.get(O + 'value-type')
    if vt in ('float', 'percentage', 'currency'):
        try: return float(c.get(O + 'value'))
        except (TypeError, ValueError): return None
    if vt == 'date': return c.get(O + 'date-value')
    txt = ''.join(''.join(p.itertext()) + '\n' for p in c.findall(X + 'p')).strip()
    return txt or None


def read_ods(data, max_rows=20000, max_cols=80):
    z = zipfile.ZipFile(io.BytesIO(data))
    root = ET.fromstring(z.read('content.xml'))
    out = {}
    for tb in root.iter(T + 'table'):
        rows = []
        for r in tb.iter(T + 'table-row'):
            rep = int(r.get(T + 'number-rows-repeated', '1'))
            cells = []
            for c in r:
                if c.tag not in (T + 'table-cell', T + 'covered-table-cell'): continue
                v = _cell(c); n = int(c.get(T + 'number-columns-repeated', '1'))
                cells.extend([v] * min(n, max_cols - len(cells)))
                if len(cells) >= max_cols: break
            while cells and cells[-1] is None: cells.pop()
            if not cells and rep > 50: continue
            for _ in range(min(rep, 3 if not cells else rep)): rows.append(cells)
            if len(rows) >= max_rows: break
        while rows and not rows[-1]: rows.pop()
        out[tb.get(T + 'name')] = rows
    return out
