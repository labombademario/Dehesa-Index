#!/usr/bin/env python3
"""data/ar-exports-province-destination.json desde el CSV oficial «Exportaciones por provincia y por pais de destino. Valores anuales»
(Ministerio de Economia de Argentina, datos.gob.ar, CC BY 4.0; millones de USD, todas las mercancias).
datos.gob.ar no responde desde los servidores de GitHub, asi que ESTA FUENTE SE ACTUALIZA A MANO: se descarga el CSV y se ejecuta
python3 scripts/import-ar-exports-csv.py ruta/al.csv
Cada provincia publica solo sus 10 destinos principales mas «resto»; el valor por pais es la SUMA de esos destinos (un minimo: un pais que sea el
11.o en todas las provincias queda dentro de «resto»). No hay total nacional por pais. Se guarda el total de las provincias para poder comprobarlo."""
import csv, json, sys, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {'resto', 'indet_continente'}
def main(path):
    rows = list(csv.DictReader(open(path, encoding='utf-8-sig')))
    cols = list(rows[0]); provs = sorted({c[:-len(c.split('_total_')[1]) - 7] for c in cols if '_total_' in c and not c.startswith('total_exportaciones')})
    years = [r['indice_tiempo'][:4] for r in rows]; agg = {}; tot = [0.0] * len(rows)
    for i, r in enumerate(rows):
        for p in provs:
            tot[i] += float(r.get(p + '_total_' + p) or 0)
            for c in cols:
                if c.startswith(p + '_') and '_total_' not in c:
                    k = c[len(p) + 1:]
                    if k in SKIP: continue
                    agg.setdefault(k, [0.0] * len(rows))[i] += float(r[c] or 0)
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'unit': 'USD million', 'years': years,
           'countries': {k: [round(x, 3) for x in v] for k, v in agg.items()}, 'provincesTotal': [round(x, 3) for x in tot],
           'source': {'name': 'Ministerio de Economia de Argentina, Exportaciones por provincia y por pais de destino (INDEC, datos.gob.ar)', 'url': 'https://datos.gob.ar/dataset/exportaciones-por-provincia-y-por-pais-de-destino',
                      'license': 'Creative Commons Attribution 4.0 (CC BY 4.0)', 'manual': True}}
    (ROOT / 'data' / 'ar-exports-province-destination.json').write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('ok', years[0], years[-1], len(agg), 'paises; total provincias', round(tot[-1]))
main(sys.argv[1])
