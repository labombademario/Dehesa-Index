#!/usr/bin/env python3
"""RECAN (Red Contable Agraria Nacional, MAPA, CC BY 4.0) -> data/recan.json.
Sin agregar ni promediar: cada fila es tal cual la publica el MAPA (comunidad x tipo x dimensión económica x ejercicio).
Las celdas "Confidencial" quedan como null.
Historico acumulado: desde el 9-oct-2026 el recurso CKAN del MAPA solo trae el ultimo ejercicio publicado (2024); los ejercicios ya leidos
que el recurso deja de traer se CONSERVAN tal cual de data/recan.json (son cifras ya publicadas por el MAPA, no se recalculan).
Si el MAPA trae un ejercicio que ya teniamos, gana lo nuevo (revision)."""
import collections, csv, io, json, re, time, urllib.request, datetime, sys

RID = '687a7bb1-ddf2-4cdd-8525-05cec40c6734'
KEEP = ['SE010','SE025','SE080','SE131','SE135','SE136','SE206','SE207','SE270','SE275','SE281','SE282','SE283','SE336','SE345','SE360','SE370','SE375','SE380','SE410','SE415','SE420','SE425','SE436','SE485','SE600','SE630']

def get():
    last = None
    for i in range(5):
        try:
            r = urllib.request.Request('https://servicio.mapa.gob.es/ckan/datastore/dump/' + RID, headers={'User-Agent': 'Mozilla/5.0 DehesaIndex'})
            with urllib.request.urlopen(r, timeout=600) as x: b = x.read()
            try: return b.decode('utf-8-sig')
            except UnicodeDecodeError: return b.decode('cp1252')
        except Exception as e: last = e; time.sleep(15)
    raise last

def num(x):
    try: return float(str(x).strip())
    except ValueError: return None

def main():
    rows = csv.DictReader(io.StringIO(get()))
    years, ccaa, types, dims, vars_ = {}, {}, {}, {}, {}
    recs = {}
    for r in rows:
        vid = r['id_variable'].strip()
        y = int(r['ejercicio'])
        c = r['desc_ccaa'].strip()
        n1 = r['tipo_explotacion_n1'].strip(); n3 = r['tipo_explotacion_n3'].strip(); tid = r['id_tipo_explotacion_n3'].strip()
        d = r['dimension_economica'].strip()
        years.setdefault(y, 1); ccaa.setdefault(c, 1)
        types.setdefault((n1, n3), (n1, n3)); dims.setdefault(d, 1)
        if vid not in vars_:
            vars_[vid] = [re.sub(r'\s*\(SE\w+\)\s*$', '', r['variable'].strip()), r['unidades'].strip()]
        key = (y, c, (n1, n3), d)
        rec = recs.setdefault(key, {'m': num(r['num_explotaciones_muestra']), 'p': num(r['num_explotaciones_representadas']), 'v': {}})
        rec['v'][vid] = num(r['valor'])
    fresh = collections.Counter(k[0] for k in recs)
    for y, n in sorted(fresh.items()):
        if n < 150: sys.exit('pocas filas en el ejercicio %d: %d' % (y, n))
    try: old = json.load(open('data/recan.json', encoding='utf-8'))
    except Exception: old = None
    kept = []
    if old:
        oV = [v[0] for v in old['vars']]
        for v in old['vars']: vars_.setdefault(v[0], [v[1], v[2]])
        for yi, ci, ti, di, m, pp, vals in old['rows']:
            y = old['years'][yi]
            if y in fresh: continue                                   # ejercicio que el MAPA vuelve a publicar: manda lo nuevo
            c = old['ccaa'][ci]; t = tuple(old['types'][ti]); d = old['dims'][di]
            years.setdefault(y, 1); ccaa.setdefault(c, 1); types.setdefault(t, t); dims.setdefault(d, 1)
            recs[(y, c, t, d)] = {'m': m, 'p': pp, 'v': {oV[i]: x for i, x in enumerate(vals) if x is not None}}
            kept.append(y)
    Y = sorted(years); C = sorted(ccaa); T = sorted(types, key=lambda t: (types[t][0], types[t][1]))
    def dkey(s):
        m = re.search(r'(\d[\d.]*)', s); return int(m.group(1).replace('.', '')) if m else 0
    D = sorted(dims, key=dkey)
    OVR = {'SE610': 'Subvenciones corrientes: cultivos', 'SE615': 'Subvenciones corrientes: ganados', 'SE624': 'Subvenciones: desarrollo rural'}
    for k, v in OVR.items():
        if k in vars_: vars_[k][0] = v
    V = sorted(vars_)
    out = []
    for (y, c, t, d), rec in sorted(recs.items()):
        vals = [rec['v'].get(v) for v in V]
        if all(x is None for x in vals): continue
        out.append([Y.index(y), C.index(c), T.index(t), D.index(d), rec['m'], rec['p'], [None if x is None else round(x, 2) for x in vals]])
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'source': {'name': 'MAPA — RECAN, Red Contable Agraria Nacional', 'url': 'https://servicio.mapa.gob.es/ckan/dataset/esmaparecanredcontable', 'license': 'CC BY 4.0'},
           'years': Y, 'ccaa': C, 'types': [list(types[t]) for t in T], 'dims': D, 'vars': [[v] + vars_[v] for v in V], 'rows': out}
    if len(out) < 2000: sys.exit('pocas filas: %d' % len(out))
    json.dump(doc, open('data/recan.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    open('data/recan-log.txt', 'w').write('%d filas, %d variables, %d comunidades, %d tipos, años %s-%s (leidos ahora: %s; conservados del historico: %s)\n' % (len(out), len(V), len(C), len(T), Y[0], Y[-1], ','.join(map(str, sorted(fresh))), ','.join(map(str, sorted(set(kept)))) or '-'))
    print(len(out), 'filas')
if __name__ == "__main__": main()
