#!/usr/bin/env python3
"""Catalogo de frutas, hortalizas y frutos secos -> data/fv-products.json (12-oct-2026, a peticion de Mario: «que todos los cultivos que tenemos esten,
y que esten en la pagina de precios tambien»).
Junta, por producto, lo que ya publican otros pipelines:
- precio semanal por pais y tipo de la Comision Europea (data/eu/fruta.json: ultimo dato, semana anterior y hace un año; €/100 kg -> €/kg);
- precio percibido por el agricultor en España, mensual (MAPA; data/series/ES/*.json, series es-perc-*);
- superficie y produccion por provincia en España (MAPA; data/spain-crops/crops-<grupo>.json, codigo del cultivo).
No descarga nada: solo lee ficheros del repositorio. Lo usan js/precios-fv.js (pestaña «Frutas y hortalizas» de precios.html),
js/producto-hortaliza.js (producto.html?p=<id>) y el buscador. Uso: python3 scripts/build-fv-products.py"""
import datetime, glob, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'fv-products.json'
# id, grupo, nombres (es|en|fr|it), familia de la Comision (parts[0] antes de « - »), variante por defecto, serie MAPA, (grupo de cultivos, codigo)
P = [
 ('tomate', 'veg', 'Tomate|Tomato|Tomate|Pomodoro', 'Tomatoes', 'Round', 'es-perc-tomate', ('hortalizas', 'HO2500')),
 ('pimiento', 'veg', 'Pimiento|Pepper|Poivron|Peperone', 'Peppers', None, 'es-perc-pimiento', ('hortalizas', 'HO2610')),
 ('pepino', 'veg', 'Pepino|Cucumber|Concombre|Cetriolo', 'Cucumbers', None, 'es-perc-pepino', ('hortalizas', 'HO2330')),
 ('calabacin', 'veg', 'Calabacín|Courgette|Courgette|Zucchina', 'Courgettes', None, 'es-perc-calabacin', ('hortalizas', 'HO2320')),
 ('berenjena', 'veg', 'Berenjena|Aubergine|Aubergine|Melanzana', 'Egg Plants', None, 'es-perc-berenjena', ('hortalizas', 'HO2400')),
 ('lechuga', 'veg', 'Lechuga|Lettuce|Laitue|Lattuga', 'Lettuces', None, 'es-perc-lechuga', ('hortalizas', 'HO1400')),
 ('escarola', 'veg', 'Escarola|Endive (escarole)|Scarole|Scarola', None, None, 'es-perc-escarola', ('hortalizas', 'HO1520')),
 ('espinaca', 'veg', 'Espinaca|Spinach|Épinard|Spinacio', None, None, 'es-perc-espinaca', ('hortalizas', 'HO1600')),
 ('acelga', 'veg', 'Acelga|Chard|Blette|Bietola', None, None, 'es-perc-acelga', ('hortalizas', 'HO1800')),
 ('col', 'veg', 'Col (repollo)|Cabbage|Chou|Cavolo', 'Cabbage', None, 'es-perc-col-repollo', ('hortalizas', 'HO1110')),
 ('coliflor', 'veg', 'Coliflor|Cauliflower|Chou-fleur|Cavolfiore', 'Cauliflowers', None, 'es-perc-coliflor', ('hortalizas', 'HO3220')),
 ('brocoli', 'veg', 'Brócoli|Broccoli|Brocoli|Broccolo', None, None, 'es-perc-col-broculi', ('hortalizas', 'HO3210')),
 ('alcachofa', 'veg', 'Alcachofa|Artichoke|Artichaut|Carciofo', None, None, 'es-perc-alcachofa', ('hortalizas', 'HO3100')),
 ('esparrago', 'veg', 'Espárrago|Asparagus|Asperge|Asparago', 'Asparagus', None, 'es-perc-esparrago', ('hortalizas', 'HO1200')),
 ('cebolla', 'veg', 'Cebolla|Onion|Oignon|Cipolla', 'Onions', None, 'es-perc-cebolla', ('hortalizas', 'HO4210')),
 ('ajo', 'veg', 'Ajo|Garlic|Ail|Aglio', 'Garlic', None, 'es-perc-ajo-seco', ('hortalizas', 'HO4100')),
 ('puerro', 'veg', 'Puerro|Leek|Poireau|Porro', 'Leeks', None, 'es-perc-puerro', ('hortalizas', 'HO4300')),
 ('zanahoria', 'veg', 'Zanahoria|Carrot|Carotte|Carota', 'Carrots', None, 'es-perc-zanahoria', ('hortalizas', 'HO4500')),
 ('judia-verde', 'veg', 'Judía verde|Green bean|Haricot vert|Fagiolino', 'Beans', None, 'es-perc-judia-verde', ('hortalizas', 'HO5200')),
 ('guisante-verde', 'veg', 'Guisante verde|Green pea|Petit pois|Pisello', None, None, 'es-perc-guisante', ('hortalizas', 'HO5100')),
 ('haba-verde', 'veg', 'Haba verde|Broad bean|Fève|Fava', None, None, 'es-perc-haba-verde', ('hortalizas', 'HO5300')),
 ('champinon', 'veg', 'Champiñón|Mushroom|Champignon|Champignon', 'Cultivated Mushrooms', None, 'es-perc-champinon', ('hortalizas', 'HO7100')),
 ('patata', 'veg', 'Patata|Potato|Pomme de terre|Patata', 'Ware potatoes', None, 'es-perc-patata', ('tuberculos', 'TH1100')),
 ('melon', 'fruit', 'Melón|Melon|Melon|Melone', 'Melons', None, 'es-perc-melon', ('hortalizas', 'HO2200')),
 ('sandia', 'fruit', 'Sandía|Watermelon|Pastèque|Anguria', 'Water Melons', None, 'es-perc-sandia', ('hortalizas', 'HO2100')),
 ('fresa', 'fruit', 'Fresa|Strawberry|Fraise|Fragola', 'Strawberries', None, 'es-perc-freson', ('hortalizas', 'HO6000')),
 ('manzana', 'fruit', 'Manzana|Apple|Pomme|Mela', 'Apples', None, 'es-perc-manzana-para-consumo-fresco', ('frutales', 'NC1100')),
 ('pera', 'fruit', 'Pera|Pear|Poire|Pera', 'Pears', None, 'es-perc-pera-para-consumo-fresco', ('frutales', 'NC1200')),
 ('melocoton', 'fruit', 'Melocotón|Peach|Pêche|Pesca', 'Peaches', None, 'es-perc-melocoton-total-para-consumo-fresco', ('frutales', 'NC2100')),
 ('nectarina', 'fruit', 'Nectarina|Nectarine|Nectarine|Nettarina', 'Nectarines', None, None, ('frutales', 'NC2200')),
 ('albaricoque', 'fruit', 'Albaricoque|Apricot|Abricot|Albicocca', 'Apricots', None, 'es-perc-albaricoque-para-consumo-fresco', ('frutales', 'NC2300')),
 ('cereza', 'fruit', 'Cereza|Cherry|Cerise|Ciliegia', 'Cherries', None, 'es-perc-cereza', ('frutales', 'NC2420')),
 ('ciruela', 'fruit', 'Ciruela|Plum|Prune|Susina', 'Plums', None, 'es-perc-ciruela', ('frutales', 'NC2500')),
 ('uva-mesa', 'fruit', 'Uva de mesa|Table grape|Raisin de table|Uva da tavola', 'Table Grapes', None, 'es-perc-uva-de-mesa', ('vinedo', 'VI1200')),
 ('kiwi', 'fruit', 'Kiwi|Kiwifruit|Kiwi|Kiwi', 'Kiwis Hayward', None, None, ('frutales', 'NC3200')),
 ('aguacate', 'fruit', 'Aguacate|Avocado|Avocat|Avocado', 'Avocados', None, 'es-perc-aguacate', ('frutales', 'NC3300')),
 ('platano', 'fruit', 'Plátano|Banana|Banane|Banana', 'Bananas', None, 'es-perc-platano', ('frutales', 'NC3400')),
 ('naranja', 'fruit', 'Naranja|Orange|Orange|Arancia', 'Oranges', None, 'es-perc-naranja-consumo-en-fresco', ('citricos', 'CI1000')),
 ('mandarina', 'fruit', 'Mandarina|Mandarin|Mandarine|Mandarino', 'Mandarins', None, 'es-perc-mandarina-total', ('citricos', 'CI3000')),
 ('clementina', 'fruit', 'Clementina|Clementine|Clémentine|Clementina', 'Clementines', None, None, ('citricos', 'CI3200')),
 ('satsuma', 'fruit', 'Satsuma|Satsuma|Satsuma|Satsuma', 'Satsumas', None, None, ('citricos', 'CI3100')),
 ('limon', 'fruit', 'Limón|Lemon|Citron|Limone', 'Lemons', None, 'es-perc-limon', ('citricos', 'CI4000')),
 ('nispero', 'fruit', 'Níspero|Loquat|Nèfle du Japon|Nespola', None, None, 'es-perc-nispero', ('frutales', 'NC1400')),
 ('higo', 'fruit', 'Higo y breva|Fig|Figue|Fico', None, None, 'es-perc-higos-y-brevas', ('frutales', 'NC3100')),
 ('chirimoya', 'fruit', 'Chirimoya|Cherimoya|Chérimole|Cherimoya', None, None, 'es-perc-chirimoya', ('frutales', 'NC3511')),
 ('mango', 'fruit', 'Mango|Mango|Mangue|Mango', None, None, 'es-perc-mango', ('frutales', 'NC3516')),
 ('caqui', 'fruit', 'Caqui|Persimmon|Kaki|Cachi', None, None, 'es-perc-caqui', ('frutales', 'NC3517')),
 ('granada', 'fruit', 'Granada|Pomegranate|Grenade|Melagrana', None, None, 'es-perc-granada', ('frutales', 'NC3513')),
 ('papaya', 'fruit', 'Papaya|Papaya|Papaye|Papaya', None, None, 'es-perc-papaya', ('frutales', 'NC3518')),
 ('pina', 'fruit', 'Piña|Pineapple|Ananas|Ananas', None, None, 'es-perc-pina-tropical', None),
 ('almendra', 'nut', 'Almendra|Almond|Amande|Mandorla', None, None, 'es-perc-almendra', ('frutales', 'NC5100')),
 ('avellana', 'nut', 'Avellana|Hazelnut|Noisette|Nocciola', None, None, 'es-perc-avellana-negretta', ('frutales', 'NC5300')),
]
# icono de cada producto (el más parecido que existe; si no hay, un círculo del color de la fruta)
EMOJI = {"tomate": "🍅", "pimiento": "🫑", "pepino": "🥒", "calabacin": "🥒", "berenjena": "🍆", "lechuga": "🥬", "escarola": "🥬", "espinaca": "🥬", "acelga": "🥬", "col": "🥬", "coliflor": "🥦", "brocoli": "🥦", "alcachofa": "🌿", "esparrago": "🌱", "cebolla": "🧅", "ajo": "🧄", "puerro": "🌱", "zanahoria": "🥕", "judia-verde": "🫛", "guisante-verde": "🫛", "haba-verde": "🫛", "champinon": "🍄", "patata": "🥔", "melon": "🍈", "sandia": "🍉", "fresa": "🍓", "manzana": "🍎", "pera": "🍐", "melocoton": "🍑", "nectarina": "🍑", "albaricoque": "🍑", "cereza": "🍒", "ciruela": "🟣", "uva-mesa": "🍇", "kiwi": "🥝", "aguacate": "🥑", "platano": "🍌", "naranja": "🍊", "mandarina": "🍊", "clementina": "🍊", "satsuma": "🍊", "limon": "🍋", "nispero": "🟠", "higo": "🟣", "chirimoya": "🍈", "mango": "🥭", "caqui": "🟠", "granada": "🔴", "papaya": "🥭", "pina": "🍍", "almendra": "🌰", "avellana": "🌰"}
# desglose extra del tomate en la ficha (fresco / industria / invernadero)
EXTRA = {'tomate': {'fresh': 'HO2510', 'ind': 'HO2520', 'glass': 'HO2512'}}
STAGE = {'Ex-packaging station price': 'pack', 'Farmgate price': 'farm', 'Retail buying price': 'retail'}
SORD = ['pack', 'farm', 'retail']
def fam_of(p0):
    f = p0.split(' - ')[0].split(' – ')[0].split(',')[0].strip()
    return f
def var_of(p0):
    return p0.split(' - ', 1)[1].strip() if ' - ' in p0 else 'All types and varieties'
def var_rank(v, default):
    if default and v == default: return 0
    if v.startswith('All types and varieties'): return 1
    if v.startswith('National weighted average'): return 2
    return 3
def main():
    fr = json.loads((ROOT / 'data' / 'eu' / 'fruta.json').read_text(encoding='utf-8'))
    # series de la Comision por familia
    fams = {}
    for s in fr['series']:
        f = fam_of(s['parts'][0]); st = STAGE.get(s['parts'][1])
        if not st: continue
        fams.setdefault(f, []).append({'id': s['id'], 'variant': var_of(s['parts'][0]), 'stage': st, 'regions': s['regions']})
    # series del MAPA (precio percibido)
    perc = {}
    for f in sorted(glob.glob(str(ROOT / 'data' / 'series' / 'ES' / '*.json'))):
        try: d = json.loads(Path(f).read_text(encoding='utf-8'))
        except Exception: continue
        for s in d.get('series', []):
            if str(s.get('id', '')).startswith('es-perc-') and s.get('points'): perc[s['id']] = (Path(f).relative_to(ROOT).as_posix(), s)
    # cultivos del MAPA
    crops = {}
    for g in set(x[6][0] for x in P if x[6]):
        try: d = json.loads((ROOT / 'data' / 'spain-crops' / ('crops-%s.json' % g)).read_text(encoding='utf-8'))
        except Exception: continue
        camps = sorted(d.get('campaigns', {}))
        if camps: crops[g] = (camps[-1], {c['c']: c for c in d['campaigns'][camps[-1]]['crops']}, d['campaigns'][camps[-1]].get('status'))
    used = set(); out = []; ccs = set()
    for pid, grp, names, fam, dvar, pc, cr in P:
        nm = dict(zip(['es', 'en', 'fr', 'it'], names.split('|')))
        doc = {'id': pid, 'group': grp, 'name': nm, 'emoji': EMOJI.get(pid, '')}
        series = fams.get(fam, []) if fam else []
        if fam and not series: raise SystemExit('familia sin series: %s' % fam)
        if series:
            used.add(fam)
            doc['eu'] = {'family': fam, 'series': [{'id': s['id'], 'variant': s['variant'], 'stage': s['stage']} for s in series]}
            # por pais: la variante por defecto (o «todos los tipos») y la fase de venta mas cercana al origen con dato
            best = {}
            for s in series:
                for r in s['regions']:
                    if not r.get('last'): continue
                    key = (var_rank(s['variant'], dvar), SORD.index(s['stage']), -(r.get('n') or 0))
                    if r['c'] not in best or key < best[r['c']][0]: best[r['c']] = (key, s, r)
            lat = {}
            for c, (k, s, r) in best.items():
                ccs.add(c)
                lat[c] = {'d': r['last'][0], 'v': round(r['last'][1] / 100, 4), 'p': round(r['prev'][1] / 100, 4) if r.get('prev') else None, 'pd': r['prev'][0] if r.get('prev') else None,
                          'y': round(r['yoy'][1] / 100, 4) if r.get('yoy') else None, 'variant': s['variant'], 'stage': s['stage'], 'series': s['id']}
            doc['eu']['latest'] = lat
        if pc:
            if pc not in perc: raise SystemExit('serie del MAPA no encontrada: %s' % pc)
            f, s = perc[pc]; pts = s['points']; last = pts[-1]
            ly = [p for p in pts if p[0] == '%d%s' % (int(last[0][:4]) - 1, last[0][4:])]
            doc['perc'] = {'file': f, 'id': pc, 'm': last[0], 'v': round(last[1] / 100, 4), 'y': round(ly[0][1] / 100, 4) if ly else None, 'first': pts[0][0]}
        if cr and cr[0] in crops and cr[1] in crops[cr[0]][1]:
            camp, cc, status = crops[cr[0]]; c = cc[cr[1]]
            doc['crops'] = {'group': cr[0], 'code': cr[1], 'campaign': camp, 'status': status, 'area': c['t'][0], 'production': c['t'][4]}
            if pid in EXTRA: doc['crops']['extra'] = EXTRA[pid]
        out.append(doc)
    left = sorted(set(fams) - used)
    if left: print('AVISO familias de la Comision sin producto:', left)
    res = {'schemaVersion': 1, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'unit': '€/kg', 'epoch': fr.get('epoch', '2000-01-01'),
           'note': 'Precios de la Comision Europea (semanal, por pais) y del MAPA (precio percibido, mensual, España) convertidos de €/100 kg a €/kg. stage: pack = salida de almacen de confeccion, farm = en finca, retail = compra del minorista.',
           'countries': sorted(ccs), 'products': out}
    OUT.write_text(json.dumps(res, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('fv-products.json: %d productos (%d con precio de la Comision, %d con precio del MAPA, %d con cultivo), %d paises' % (
        len(out), sum(1 for x in out if 'eu' in x), sum(1 for x in out if 'perc' in x), sum(1 for x in out if 'crops' in x), len(ccs)))
if __name__ == '__main__': main()
