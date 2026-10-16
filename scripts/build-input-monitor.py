#!/usr/bin/env python3
"""Monitor de insumos para cooperativas -> data/views/input-monitor.json (lo lee monitor-insumos.html)

Espana, precios pagados por los agricultores (MAPA, mensual, EUR/100 kg sin IVA) y gasoleo (Weekly Oil Bulletin de la Comision, semanal):
  - ultimo dato, variacion interanual, minimo, maximo y media de los ultimos 10 años;
  - percentil del ultimo dato dentro de esos 10 años (% de observaciones iguales o mas baratas). Es una posicion historica, NO una prevision;
  - relacion grano/fertilizante: kg de fertilizante que se compran con 100 kg de grano (precio percibido / precio pagado, misma fuente,
    misma unidad, mismo mes) y su percentil a 10 años (cuanto mas alto, mas fertilizante compra el grano).
Si una serie tiene menos de 10 años, se usa lo disponible y se dice. Nada se estima. Uso: python3 scripts/build-input-monitor.py"""
import datetime, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/views/input-monitor.json'
YEARS = 10
GROUPS = [
    ('nitrogen', ['es-pag-urea-46', 'es-pag-nitrato-amonico-calcico-26', 'es-pag-nitrosulfato-amonico-26', 'es-pag-nitrato-amonico-33-5', 'es-pag-sulfato-amonico-21', 'es-pag-solucion-nitrogenada-32']),
    ('pk', ['es-pag-d-a-p-fosfato-diamonico', 'es-pag-superfosfato-de-cal-18-grano', 'es-pag-cloruro-potasico-60', 'es-pag-sulfato-potasico-50']),
    ('compound', ['es-pag-complejo-15-15-15', 'es-pag-complejo-8-15-15', 'es-pag-complejo-9-18-27', 'es-pag-complejo-8-24-16']),
    ('feed', ['es-pag-concentrado-vacuno-de-leche', 'es-pag-concentrado-vacuno-de-carne', 'es-pag-cerdos-crecimiento-y-cebo', 'es-pag-pollos-carne', 'es-pag-gallinas-ponedoras',
              'es-pag-ovejas-y-cabras-lactantes', 'es-pag-corderos-y-chivos-recria-engorde', 'es-pag-torta-de-girasol', 'es-pag-alfalfa-deshidratada', 'es-pag-paja-cereales']),
]
GRAINS = ['es-perc-trigo', 'es-perc-cebada', 'es-perc-maiz', 'es-perc-girasol']
RATIO_FERT = ['es-pag-urea-46', 'es-pag-nitrato-amonico-calcico-26', 'es-pag-d-a-p-fosfato-diamonico', 'es-pag-cloruro-potasico-60', 'es-pag-complejo-15-15-15']
NAMES = {  # nombres cortos en 4 idiomas (el catalogo solo trae la etiqueta del MAPA en español)
    'es-pag-urea-46': ('Urea 46 %', 'Urea 46%', 'Urée 46 %', 'Urea 46%'),
    'es-pag-nitrato-amonico-calcico-26': ('Nitrato amónico cálcico 26 %', 'Calcium ammonium nitrate 26%', 'Ammonitrate calcique 26 %', 'Nitrato ammonico calcico 26%'),
    'es-pag-nitrosulfato-amonico-26': ('Nitrosulfato amónico 26 %', 'Ammonium sulphate nitrate 26%', 'Sulfonitrate d’ammonium 26 %', 'Solfonitrato ammonico 26%'),
    'es-pag-nitrato-amonico-33-5': ('Nitrato amónico 33,5 %', 'Ammonium nitrate 33.5%', 'Ammonitrate 33,5 %', 'Nitrato ammonico 33,5%'),
    'es-pag-sulfato-amonico-21': ('Sulfato amónico 21 %', 'Ammonium sulphate 21%', 'Sulfate d’ammonium 21 %', 'Solfato ammonico 21%'),
    'es-pag-solucion-nitrogenada-32': ('Solución nitrogenada 32 %', 'Nitrogen solution 32%', 'Solution azotée 32 %', 'Soluzione azotata 32%'),
    'es-pag-d-a-p-fosfato-diamonico': ('Fosfato diamónico (DAP)', 'Diammonium phosphate (DAP)', 'Phosphate diammonique (DAP)', 'Fosfato biammonico (DAP)'),
    'es-pag-superfosfato-de-cal-18-grano': ('Superfosfato de cal 18 %', 'Single superphosphate 18%', 'Superphosphate 18 %', 'Perfosfato semplice 18%'),
    'es-pag-cloruro-potasico-60': ('Cloruro potásico 60 %', 'Potassium chloride 60%', 'Chlorure de potassium 60 %', 'Cloruro di potassio 60%'),
    'es-pag-sulfato-potasico-50': ('Sulfato potásico 50 %', 'Potassium sulphate 50%', 'Sulfate de potassium 50 %', 'Solfato di potassio 50%'),
    'es-pag-complejo-15-15-15': ('Complejo 15-15-15', 'Compound 15-15-15', 'Complexe 15-15-15', 'Complesso 15-15-15'),
    'es-pag-complejo-8-15-15': ('Complejo 8-15-15', 'Compound 8-15-15', 'Complexe 8-15-15', 'Complesso 8-15-15'),
    'es-pag-complejo-9-18-27': ('Complejo 9-18-27', 'Compound 9-18-27', 'Complexe 9-18-27', 'Complesso 9-18-27'),
    'es-pag-complejo-8-24-16': ('Complejo 8-24-16', 'Compound 8-24-16', 'Complexe 8-24-16', 'Complesso 8-24-16'),
    'es-pag-concentrado-vacuno-de-leche': ('Pienso vacuno de leche', 'Dairy cattle feed', 'Aliment vaches laitières', 'Mangime vacche da latte'),
    'es-pag-concentrado-vacuno-de-carne': ('Pienso vacuno de carne', 'Beef cattle feed', 'Aliment bovins viande', 'Mangime bovini da carne'),
    'es-pag-cerdos-crecimiento-y-cebo': ('Pienso cerdos de cebo', 'Fattening pig feed', 'Aliment porcs à l’engrais', 'Mangime suini da ingrasso'),
    'es-pag-pollos-carne': ('Pienso pollos de carne', 'Broiler feed', 'Aliment poulets de chair', 'Mangime polli da carne'),
    'es-pag-gallinas-ponedoras': ('Pienso gallinas ponedoras', 'Laying hen feed', 'Aliment poules pondeuses', 'Mangime galline ovaiole'),
    'es-pag-ovejas-y-cabras-lactantes': ('Pienso ovejas y cabras lactantes', 'Lactating ewe and goat feed', 'Aliment brebis et chèvres allaitantes', 'Mangime pecore e capre in lattazione'),
    'es-pag-corderos-y-chivos-recria-engorde': ('Pienso corderos de cebo', 'Lamb fattening feed', 'Aliment agneaux à l’engrais', 'Mangime agnelli da ingrasso'),
    'es-pag-torta-de-girasol': ('Torta de girasol', 'Sunflower meal', 'Tourteau de tournesol', 'Farina di girasole'),
    'es-pag-alfalfa-deshidratada': ('Alfalfa deshidratada', 'Dehydrated alfalfa', 'Luzerne déshydratée', 'Erba medica disidratata'),
    'es-pag-paja-cereales': ('Paja de cereales', 'Cereal straw', 'Paille de céréales', 'Paglia di cereali'),
    'es-perc-trigo': ('Trigo', 'Wheat', 'Blé', 'Grano'), 'es-perc-cebada': ('Cebada', 'Barley', 'Orge', 'Orzo'),
    'es-perc-maiz': ('Maíz', 'Maize', 'Maïs', 'Mais'), 'es-perc-girasol': ('Girasol', 'Sunflower', 'Tournesol', 'Girasole'),
    'diesel': ('Gasóleo de automoción (surtidor, con impuestos)', 'Road diesel (pump price, taxes included)', 'Gazole routier (prix à la pompe, taxes comprises)', 'Gasolio per autotrazione (alla pompa, tasse incluse)'),
}
L4 = lambda t: dict(zip(('es', 'en', 'fr', 'it'), t))

def J(p): return json.loads(Path(p).read_text(encoding='utf-8'))

def load_es():
    cat = J(ROOT / 'data/catalog/ES.json')['series']
    files = {s['id']: s['file'] for s in cat}
    meta = {s['id']: s for s in cat}
    cache, out = {}, {}
    for sid, f in files.items():
        if not (sid.startswith('es-pag-') or sid.startswith('es-perc-')): continue
        if f not in cache: cache[f] = {x['id']: x for x in J(ROOT / 'data' / f)['series']}
        if sid in cache[f]: out[sid] = (cache[f][sid], meta[sid])
    return out

def stats(points, unit, fs):
    """points: lista [periodo, valor] ordenada. Devuelve estadisticos de los ultimos YEARS años (o lo disponible)."""
    pts = [(p, v) for p, v in points if v is not None]
    if len(pts) < 24: return None
    last_p, last_v = pts[-1]
    y0 = int(last_p[:4]) - YEARS
    win = [(p, v) for p, v in pts if p > '%04d%s' % (y0, last_p[4:])]
    vals = [v for _, v in win]
    pct = round(100.0 * sum(1 for v in vals if v <= last_v) / len(vals))
    lo = min(win, key=lambda x: x[1]); hi = max(win, key=lambda x: x[1])
    ya = [(p, v) for p, v in pts if p <= '%04d%s' % (int(last_p[:4]) - 1, last_p[4:])]
    yoy = None
    if ya and ya[-1][1]:
        if len(last_p) == 7: ok = ya[-1][0] == '%04d%s' % (int(last_p[:4]) - 1, last_p[4:])
        else: ok = (datetime.date.fromisoformat('%04d%s' % (int(last_p[:4]) - 1, last_p[4:])) - datetime.date.fromisoformat(ya[-1][0])).days <= 14
        if ok: yoy = round((last_v / ya[-1][1] - 1) * 100, 1)
    years = round((len(win) / (12.0 if len(last_p) == 7 else 52.0)), 1)
    spark = [v for _, v in win][-120:] if len(last_p) == 7 else [v for _, v in win][::4][-130:]
    return {'last': last_p, 'value': last_v, 'unit': unit, 'yoy': yoy, 'pct': pct, 'min': list(lo), 'max': list(hi), 'avg': round(sum(vals) / len(vals), 2),
            'from': win[0][0], 'years': min(YEARS, years), 'n': len(vals), 'state': fs, 'spark': [round(v, 2) for v in spark]}

def main():
    es = load_es()
    groups = []
    for g, ids in GROUPS:
        items = []
        for sid in ids:
            if sid not in es: continue
            s, m = es[sid]
            st = stats(s['points'], s.get('unit'), m.get('fs'))
            if st: items.append(dict(id=sid, name=L4(NAMES.get(sid, (s['label'],) * 4)), source='mapa_es', **st))
        groups.append({'id': g, 'items': items})
    # gasoleo de automocion en España (Weekly Oil Bulletin de la Comision, precio al consumidor con impuestos, semanal; data/diesel-eu-countries.json)
    dp = ROOT / 'data/diesel-eu-countries.json'
    if dp.exists():
        dd = J(dp); es_d = (dd.get('countries') or {}).get('ES')
        if es_d and es_d.get('points'):
            st = stats([tuple(x) for x in es_d['points']], 'EUR/litro', None)
            if st: groups.append({'id': 'energy', 'items': [dict(id='diesel', name=L4(NAMES['diesel']), source=dd.get('sourceId') or 'eu_oil_bulletin', **st)]})
    # relacion grano / fertilizante (misma fuente MAPA, misma unidad, mismo mes)
    ratios = []
    for g in GRAINS:
        if g not in es: continue
        gp = dict(es[g][0]['points'])
        for f in RATIO_FERT:
            if f not in es: continue
            fp = dict(es[f][0]['points'])
            common = sorted(p for p in gp if p in fp and gp[p] and fp[p])
            if len(common) < 24: continue
            pts = [(p, round(gp[p] / fp[p] * 100, 1)) for p in common]
            st = stats(pts, 'kg/100 kg', es[g][1].get('fs'))
            if st: ratios.append(dict(grain=g, fert=f, grainName=L4(NAMES[g]), fertName=L4(NAMES[f]), grainLast=es[g][0]['points'][-1][0], fertLast=es[f][0]['points'][-1][0], **st))
    gen = J(ROOT / 'data/freshness.json').get('generatedAt')
    doc = {'schemaVersion': 1, 'generatedAt': gen, 'years': YEARS, 'groups': groups, 'ratios': ratios}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('Monitor de insumos: %s; %d relaciones grano/fertilizante' % (', '.join('%s %d' % (g['id'], len(g['items'])) for g in groups), len(ratios)))

main()
