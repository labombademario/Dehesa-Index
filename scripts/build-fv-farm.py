#!/usr/bin/env python3
"""Lo que cobra el agricultor por fruta, hortaliza y fruto seco, FUERA de España -> data/fv-farm.json (12-oct-2026, a peticion de Mario:
«si queremos tener lo que cobra el agricultor, tenemos que buscar los datos del pais en concreto; pero no poner los datos de otro pais»).
España sigue con el MAPA (data/fv-products.json, campo perc). Aqui solo entran datos OFICIALES del propio pais, nunca de otro:
- Francia: INSEE, IPPAP (indice de precios percibidos por el agricultor, 2020=100, mensual) -> data/france-insee-stats.json.
- Resto de la UE: Eurostat apri_pi_outq (indice trimestral de precios de produccion, nominal, 2020=100; datos de cada instituto nacional)
  y apri_ap_crpouta (precio de venta del agricultor en EUR/100 kg, anual) -> data/*-stats.json que ya bajan los pipelines de Eurostat.
Un indice no es un precio: la ficha lo rotula como indice y no lo compara con el EUR/kg semanal. No descarga nada. Uso: python3 scripts/build-fv-farm.py"""
import datetime, glob, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'data'
OUT = D / 'fv-farm.json'
MIN_ABS_YEAR = datetime.date.today().year - 4   # precio anual: como mucho 4 años de retraso
MIN_IDX_YEAR = datetime.date.today().year - 2   # indices: el ultimo dato tiene que ser de los dos ultimos años
# producto -> idbank del INSEE (IPPAP, Francia). «Chicory» del INSEE es la chicorée (escarola y rizada); «Endives» es la endivia de Bruselas y no se usa.
INSEE = {'tomate': '010776759', 'pimiento': '010776747', 'pepino': '010776736', 'calabacin': '010776737', 'berenjena': '010776726', 'lechuga': '010776754',
         'escarola': '010776751', 'espinaca': '010776740', 'acelga': '010776727', 'col': ['010776732', '010776735'], 'coliflor': '010776734', 'brocoli': '010776733',
         'alcachofa': '010776724', 'esparrago': '010776725', 'cebolla': '010776744', 'ajo': '010776723', 'puerro': '010776746', 'zanahoria': '010776729',
         'champinon': '010776731', 'patata': ['010776611', '010776610'], 'melon': '010776742', 'fresa': '010776704', 'manzana': '010776716', 'pera': '010776713',
         'melocoton': '010776712', 'nectarina': '010776711', 'albaricoque': '010776700', 'cereza': '010776701', 'ciruela': '010776720', 'uva-mesa': '010776721',
         'kiwi': '010776708', 'platano': '010776767', 'clementina': '010776703'}
INSEE_NOTE = {'platano': 'Antillas francesas', 'clementina': 'Córcega'}
# producto -> codigo Eurostat del indice trimestral (apri_pi_outq, nominal)
PIDX = {'tomate': ['am041200'], 'coliflor': ['am041100'], 'col': ['am041910'], 'lechuga': ['am041920'], 'espinaca': ['am041930'], 'pepino': ['am041940'],
        'zanahoria': ['am041950'], 'cebolla': ['am041960'], 'judia-verde': ['am041970'], 'guisante-verde': ['am041990'], 'patata': ['am051000', 'am051200'],
        'manzana': ['am061100'], 'pera': ['am061200'], 'melocoton': ['am061300'], 'cereza': ['am061910'], 'ciruela': ['am061920'], 'fresa': ['am061930'],
        'naranja': ['am062100'], 'mandarina': ['am062200'], 'limon': ['am062300'], 'uva-mesa': ['am064100']}
# producto -> codigos Eurostat del precio anual (apri_ap_crpouta), por orden de preferencia
ABS = {'tomate': ['04121000', '04122000'], 'coliflor': ['04110000'], 'col': ['04191100'], 'lechuga': ['04192100', '04192200'], 'espinaca': ['04193000'],
       'pepino': ['04194100', '04194200'], 'zanahoria': ['04195000'], 'cebolla': ['04196000'], 'judia-verde': ['04197000'], 'guisante-verde': ['04199000'],
       'champinon': ['04199901'], 'puerro': ['04199903'], 'pimiento': ['04199904'], 'ajo': ['04199906'], 'esparrago': ['04199910'], 'calabacin': ['04199911'],
       'melon': ['04199913'], 'sandia': ['04199914'], 'patata': ['05120000'], 'manzana': ['06110000'], 'pera': ['06120000'], 'melocoton': ['06130000'],
       'cereza': ['06191100'], 'ciruela': ['06192000'], 'fresa': ['06193000', '06193100'], 'avellana': ['06194120'], 'almendra': ['06194130'],
       'albaricoque': ['06199100'], 'naranja': ['06210000'], 'mandarina': ['06220000'], 'limon': ['06230000'], 'higo': ['06310000'], 'uva-mesa': ['06410000']}
ABS_NOTE = {'04122000': 'invernadero', '04192200': 'invernadero', '04194200': 'invernadero', '04199904': 'invernadero', '06193100': 'aire libre', '04121000': 'aire libre',
            '04192100': 'aire libre', '04194100': 'aire libre'}

def load_stats():
    """(pais, codigo) -> serie, de todos los data/*-stats.json; si se repite, gana la que llega mas lejos."""
    idx, ab = {}, {}
    for f in sorted(glob.glob(str(D / '*-stats.json'))):
        try: doc = json.loads(Path(f).read_text())
        except Exception: continue
        for cc, c in (doc.get('countries') or {}).items():
            if not isinstance(c, dict): continue
            for s in c.get('series', []):
                i, pts = s.get('id', ''), s.get('points') or []
                if not pts: continue
                if '-pidx-' in i and i.endswith('-ni'): key, tgt = (cc, i.split('-pidx-')[1][:-3]), idx
                elif '-crop-' in i and 'producer price' in s.get('label', ''): key, tgt = (cc, i.split('-crop-')[1]), ab
                else: continue
                old = tgt.get(key)
                if not old or str(pts[-1][0]) > str(old['points'][-1][0]): tgt[key] = s
    # precios anuales de TODA la UE-27 (update-eu-fv-farm.py): los pipelines por pais solo guardan unos pocos productos
    try:
        eu = json.loads((D / 'eu-fv-farm.json').read_text())
        for cc, prods in eu.get('countries', {}).items():
            for code, pts in prods.items():
                old = ab.get((cc, code))
                if not old or str(pts[-1][0]) >= str(old['points'][-1][0]): ab[(cc, code)] = {'points': pts}
    except Exception: pass
    return idx, ab

def main():
    fr = {s['id'][len('fr-insee-'):]: s for s in json.loads((D / 'france-insee-stats.json').read_text())['countries']['FR']['series']}
    idx, ab = load_stats()
    ids = [p['id'] for p in json.loads((D / 'fv-products.json').read_text())['products']]
    out, cover = {}, {}
    for pid in ids:
        row = {}
        # Francia: INSEE mensual (el primero de la lista que tenga dato reciente)
        for b in ([INSEE[pid]] if isinstance(INSEE.get(pid), str) else INSEE.get(pid, [])):
            s = fr.get(b)
            if s and s['points'] and int(s['points'][-1][0][:4]) >= MIN_IDX_YEAR and len(s['points']) >= 24:
                row.setdefault('FR', {})['idx'] = {'src': 'insee', 'freq': 'M', 'code': b, 'note': INSEE_NOTE.get(pid), 'pts': [p for p in s['points'] if p[0] >= '2015']}
                break
        # Resto: Eurostat (nunca España: alli esta el MAPA; nunca Francia si ya hay INSEE)
        ccs = sorted({k[0] for k in list(idx) + list(ab)} - {'ES', 'EU', 'EU27_2020'})
        for cc in ccs:
            if cc != 'FR' or 'idx' not in row.get('FR', {}):
                for code in PIDX.get(pid, []):
                    s = idx.get((cc, code))
                    if s and int(str(s['points'][-1][0])[:4]) >= MIN_IDX_YEAR and len(s['points']) >= 6:
                        row.setdefault(cc, {})['idx'] = {'src': 'eurostat', 'freq': 'Q', 'code': code, 'pts': [p for p in s['points'] if str(p[0]) >= '2015']}
                        break
            for code in ABS.get(pid, []):
                s = ab.get((cc, code))
                if s and int(str(s['points'][-1][0])[:4]) >= MIN_ABS_YEAR and len(s['points']) >= 3:
                    row.setdefault(cc, {})['abs'] = {'src': 'eurostat', 'freq': 'A', 'code': code, 'note': ABS_NOTE.get(code), 'unit': 'EUR/100 kg', 'pts': [[str(p[0]), p[1]] for p in s['points'] if str(p[0]) >= '2010']}
                    break
        if row:
            out[pid] = row
            for cc in row: cover[cc] = cover.get(cc, 0) + 1
    doc = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
           'sources': {'insee': {'name': 'INSEE, indice des prix des produits agricoles à la production (IPPAP), base 2020', 'url': 'https://www.insee.fr/fr/statistiques/serie/liste-series/IPAGRI-BASE-2020', 'license': 'Licence Ouverte 2.0 (Etalab)'},
                       'eurostat': {'name': 'Eurostat, precios agrarios (apri_pi_outq y apri_ap_crpouta), datos de cada instituto nacional', 'url': 'https://ec.europa.eu/eurostat/databrowser/view/apri_ap_crpouta/default/table', 'license': 'CC BY 4.0'}},
           'coverage': dict(sorted(cover.items())), 'products': out}
    new = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
    try:
        old = json.loads(OUT.read_text())
        if old.get('products') == out: print('sin cambios'); return
    except Exception: pass
    OUT.write_text(new + '\n')
    print('fv-farm: %d productos; por pais %s; %d KB' % (len(out), doc['coverage'], len(new) // 1024))

if __name__ == '__main__':
    main()
