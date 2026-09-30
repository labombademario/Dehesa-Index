#!/usr/bin/env python3
"""España: precios percibidos y pagados por agricultores y ganaderos (MAPA, CKAN, CC BY 4.0).
Escribe data/spain-stats.json con el esquema de data/country-stats.json (countries.ES).
Reglas: solo series reales; el valor 0 o vacío significa "sin cotización" y se descarta; cuando un mes
existe en varias bases (anio_base) se toma la base más reciente (sin mezclar con otras para ese mes).
Unidades según las metodologías oficiales del MAPA (percibidos y pagados, base 2015)."""
import csv, io, json, re, sys, time, urllib.request, datetime

BASE = 'https://servicio.mapa.gob.es/ckan/datastore/dump/'
RES = {'perc': '23939af3-475f-4a4b-b18e-48fa9dbc4f3b', 'pag': 'bb45def4-7841-4fa8-9a56-b7f959a9a951'}
LOG = []

def get(u, tries=5):
    last = None
    for i in range(tries):
        try:
            r = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 DehesaIndex'})
            with urllib.request.urlopen(r, timeout=180) as x:
                b = x.read()
            try: return b.decode('utf-8-sig')
            except UnicodeDecodeError: return b.decode('cp1252')
        except Exception as e:
            last = e; time.sleep(10)
    raise last

# (grupo) -> (subgrupo de la web, unidad). None = no se publica (unidad no verificada).
GROUPS = {
    'CEREALES': ('prices', '€/100 kg'), 'LEGUMINOSAS': ('prices', '€/100 kg'), 'TUBERCULOS': ('prices', '€/100 kg'),
    'CULTIVOS FORRAJEROS': ('prices', '€/100 kg'), 'ACEITE DE OLIVA TOTAL': ('prices', '€/100 kg'),
    'VINO Y MOSTO': ('prices', '€/100 L'),
    'GANADO PARA ABASTO': ('prices_lv', '€/100 kg vivo'),
    'FRUTAS': ('prices_fv', '€/100 kg'), 'HORTALIZAS': ('prices_fv', '€/100 kg'),
}
IND_OK = {'GIRASOL', 'REMOLACHA AZUCARERA', 'ALGODON BRUTO', 'ALGODON BRUTO SIN SUBVENCION', 'TABACO (SECO NO FERMENTADO)',
          'TABACO SECO NO FERM. SIN SUBVENCION', 'ACEITUNA PARA ADEREZO'}
def classify(grupo, prod):
    if grupo == 'CULTIVOS INDUSTRIALES':
        if prod == 'AZAFRAN TOSTADO': return ('prices', '€/kg')
        if prod in IND_OK: return ('prices', '€/100 kg')
        return None
    if grupo == 'PRODUCTOS GANADEROS':
        if prod.startswith('LECHE'): return ('prices_lv', '€/100 L')
        if prod.startswith('HUEVOS'): return ('prices_lv', '€/100 docenas')
        if prod == 'LANA': return ('prices_lv', '€/100 kg')
        return None
    return GROUPS.get(grupo)

ACC = {'acido': 'ácido', 'potasico': 'potásico', 'amonico': 'amónico', 'diamonico': 'diamónico', 'calcico': 'cálcico', 'fosforico': 'fosfórico', 'iberica': 'ibérica', 'azafran': 'azafrán', 'melocoton': 'melocotón', 'limon': 'limón', 'platano': 'plátano', 'sandia': 'sandía', 'melon': 'melón', 'maiz': 'maíz', 'judia': 'judía', 'judias': 'judías', 'esparrago': 'espárrago', 'calabacin': 'calabacín', 'nispero': 'níspero', 'algodon': 'algodón', 'subvencion': 'subvención', 'gestacion': 'gestación', 'lactacion': 'lactación', 'recria': 'recría', 'cria': 'cría', 'proteina': 'proteína', 'champiñon': 'champiñón', 'ros-clar': 'rosado/clarete', 'brocoli': 'brócoli', 'freson': 'fresón'}

def title(s):
    s = s.replace('�', 'Ñ').strip().lower()
    s = re.sub(r'\s+', ' ', s)
    s = ' '.join(ACC.get(w, w) for w in s.split(' '))
    return s[:1].upper() + s[1:]

def series_from(rows, kind):
    by = {}
    for r in rows:
        try: y = int(r['anio']); m = int(r['mes']); b = int(r['anio_base'])
        except (ValueError, KeyError): continue
        if not (1 <= m <= 12): continue
        key = (r['grupo'].strip(), r['producto'].strip())
        d = by.setdefault(key, {})
        raw = (r['precio_mensual'] or '').strip()
        cur = d.get((y, m))
        if cur is None or b > cur[0]:
            d[(y, m)] = (b, raw)
    out = []
    for (g, p), d in by.items():
        if kind == 'perc':
            c = classify(g, p)
            if not c: continue
            grp, unit = c
        else:
            if g == 'FERTILIZANTES': grp, unit = 'inputs_f', '€/100 kg (sin IVA)'
            elif g == 'ALIMENTOS DE GANADO': grp, unit = 'inputs_a', '€/100 kg (sin IVA)'
            else: continue
        pts = []
        for (y, m) in sorted(d):
            raw = d[(y, m)][1]
            try: v = float(raw)
            except ValueError: continue
            if v <= 0: continue
            pts.append(['%04d-%02d' % (y, m), round(v, 2)])
        if len(pts) < 24: LOG.append('omitida %s/%s (%d puntos)' % (g, p, len(pts))); continue
        last = pts[-1][1]; prev = pts[-2][1]
        # solo series vivas (último dato en los últimos 18 meses) o con histórico largo
        lab = title(p) if kind == 'perc' else title(p)
        if kind == 'pag' and grp == 'inputs_a': lab = 'Pienso/alimento: ' + lab.lower()
        if kind == 'pag' and grp == 'inputs_f': lab = 'Fertilizante: ' + lab
        out.append({'id': 'es-%s-%s' % (kind, re.sub(r'[^a-z0-9]+', '-', p.lower().replace('�', 'n')).strip('-')),
                    'group': grp, 'label': lab, 'unit': unit, 'frequency': 'monthly',
                    'latestPeriod': pts[-1][0], 'latest': last,
                    'changePct': round((last - prev) / prev * 100, 2) if prev else None, 'points': pts,
                    'sourceGroup': g})
    return out

def main():
    series = []
    for kind in ('perc', 'pag'):
        txt = get(BASE + RES[kind])
        rows = list(csv.DictReader(io.StringIO(txt)))
        LOG.append('%s: %d filas' % (kind, len(rows)))
        series += series_from(rows, kind)
    order = {'prices': 0, 'prices_lv': 1, 'prices_fv': 2, 'inputs_f': 3, 'inputs_a': 4}
    series.sort(key=lambda s: (order[s['group']], s['label']))
    if len(series) < 50: sys.exit('demasiado pocas series: %d' % len(series))
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'countries': {'ES': {'name': 'Spain', 'source': {'name': 'MAPA — Precios percibidos y pagados por agricultores y ganaderos', 'url': 'https://servicio.mapa.gob.es/ckan/dataset/esmapaindicespreciospreciopercibido', 'license': 'CC BY 4.0'}, 'series': series}},
           'log': LOG}
    json.dump(doc, open('data/spain-stats.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/spain-log.txt', 'w').write('\n'.join(LOG) + '\n%d series\n' % len(series))
    print(len(series), 'series')
main()
