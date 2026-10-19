#!/usr/bin/env python3
"""Cestas de precios (indices por categoria) -> data/indices/
Sale SOLO de la API publica (data/api/v1: fuentes con licencia comercial apta o con condiciones). Nada se estima ni se rellena.
Metodo (el mismo texto va en cada fichero):
  1. Cada serie miembro se pasa a media mensual (los datos semanales o diarios se promedian por mes; un mes semanal solo cuenta si tiene datos hasta el dia 22 o mas).
  2. Cada serie se divide por su media del ANO BASE y se multiplica por 100. El ano base es el primer ano natural completo (12 meses) en el que TODOS los miembros tienen dato.
  3. La cesta es la media simple de las series reexpresadas (pesos iguales: no hay una ponderacion oficial de consumo que justifique otra). Un mes donde falta algun miembro no se publica.
  4. Se publica solo si hay al menos 2 series y 24 meses con dato; si no, la cesta se lista como excluida con su motivo.
  Cada serie se reexpresa en su propia unidad y moneda: son numeros indice (evolucion), no precios.
La fecha del fichero es la del paquete de datos: sin datos nuevos no cambia nada.
Uso: python3 scripts/build-baskets.py [--check]"""
import json, sys, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'data' / 'api' / 'v1'
OUT = ROOT / 'data' / 'indices'
BASKETS = [
    ('eu', 'cereales', {'es': 'Cereales (UE)', 'en': 'Cereals (EU)', 'fr': 'Céréales (UE)', 'it': 'Cereali (UE)'}, ['trigo', 'cebada', 'maiz']),
    ('eu', 'pienso', {'es': 'Materias primas de pienso (UE)', 'en': 'Feed raw materials (EU)', 'fr': 'Matières premières pour aliments (UE)', 'it': 'Materie prime per mangimi (UE)'}, ['maiz', 'cebada', 'harina_soja']),
    ('eu', 'lacteos', {'es': 'Lácteos (UE)', 'en': 'Dairy (EU)', 'fr': 'Produits laitiers (UE)', 'it': 'Latticini (UE)'}, ['leche', 'mantequilla', 'leche_polvo']),
    ('us', 'cereales', {'es': 'Cereales (EE. UU.)', 'en': 'Cereals (US)', 'fr': 'Céréales (États-Unis)', 'it': 'Cereali (USA)'}, ['trigo', 'maiz', 'cebada', 'avena', 'sorgo']),
    ('us', 'pienso', {'es': 'Materias primas de pienso (EE. UU.)', 'en': 'Feed raw materials (US)', 'fr': 'Matières premières pour aliments (États-Unis)', 'it': 'Materie prime per mangimi (USA)'}, ['maiz', 'sorgo', 'avena', 'harina_soja']),
    ('us', 'lacteos', {'es': 'Lácteos (EE. UU.)', 'en': 'Dairy (US)', 'fr': 'Produits laitiers (États-Unis)', 'it': 'Latticini (USA)'}, ['leche', 'leche_polvo']),
    ('ca', 'cereales', {'es': 'Cereales (Canadá)', 'en': 'Cereals (Canada)', 'fr': 'Céréales (Canada)', 'it': 'Cereali (Canada)'}, ['trigo', 'cebada', 'maiz', 'avena']),
    ('ca', 'oleaginosas', {'es': 'Oleaginosas y cereales (Canadá)', 'en': 'Oilseeds and cereals (Canada)', 'fr': 'Oléagineux et céréales (Canada)', 'it': 'Semi oleosi e cereali (Canada)'}, ['colza', 'trigo', 'cebada']),
]
MIN_MEMBERS, MIN_MONTHS = 2, 24
METHOD = {
    'es': 'Cada serie se pasa a media mensual (un mes semanal solo cuenta con datos hasta el día 22 o después), se divide por su media del año base y se multiplica por 100. El año base es el primer año natural completo en el que todos los miembros tienen dato. La cesta es la media simple de las series (pesos iguales: no hay una ponderación oficial de consumo que justifique otra); un mes en el que falta algún miembro no se publica. Cada serie se reexpresa en su propia unidad y moneda, por lo que son números índice (evolución), no precios. Sin estimaciones ni relleno de huecos. Información, no asesoramiento financiero.',
    'en': 'Each series is converted to a monthly average (a weekly series’ month only counts with data up to day 22 or later), divided by its base-year average and multiplied by 100. The base year is the first full calendar year in which all members have data. The basket is the simple mean of the series (equal weights: there is no official consumption weighting that would justify another); a month in which any member is missing is not published. Each series is rebased in its own unit and currency, so these are index numbers (evolution), not prices. No estimates and no gap filling. Information, not financial advice.',
    'fr': 'Chaque série est convertie en moyenne mensuelle (un mois d’une série hebdomadaire ne compte qu’avec des données jusqu’au 22 ou plus tard), divisée par sa moyenne de l’année de base et multipliée par 100. L’année de base est la première année civile complète où tous les membres ont des données. Le panier est la moyenne simple des séries (poids égaux : aucune pondération officielle de consommation n’en justifie d’autres) ; un mois où un membre manque n’est pas publié. Chaque série est rebasée dans son unité et sa monnaie : ce sont des indices (évolution), pas des prix. Sans estimation ni comblement des trous. Information, pas un conseil financier.',
    'it': 'Ogni serie è convertita in media mensile (il mese di una serie settimanale conta solo con dati fino al giorno 22 o oltre), divisa per la sua media dell’anno base e moltiplicata per 100. L’anno base è il primo anno solare completo in cui tutti i membri hanno dati. Il paniere è la media semplice delle serie (pesi uguali: nessuna ponderazione ufficiale dei consumi ne giustifica altri); un mese in cui manca un membro non viene pubblicato. Ogni serie è ribasata nella propria unità e valuta: sono numeri indice (andamento), non prezzi. Nessuna stima né riempimento dei vuoti. Informazione, non consulenza finanziaria.',
}
def jdump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')) + '\n'
def monthly(points, freq):
    acc, last = {}, {}
    for d, v in points:
        k = d[:7]
        if len(d) == 7 + 3 and d[:4].isdigit() and d[4] == '-':   # YYYY-MM-DD
            last[k] = max(last.get(k, 0), int(d[8:10]))
        acc.setdefault(k, []).append(v)
    out = {}
    for k, vs in acc.items():
        if k in last and freq in ('weekly', 'daily') and last[k] < 22: continue   # mes incompleto
        out[k] = sum(vs) / len(vs)
    return out
def base_year(ms):
    ys = sorted({k[:4] for m in ms for k in m})
    for y in ys:
        if all(all('%s-%02d' % (y, mo) in m for mo in range(1, 13)) for m in ms): return y
    return None
def make(region, bid, names, members, series, gen):
    ms, meta = [], []
    for p in members:
        s = series.get('%s/%s' % (region, p))
        if not s: return None, ('falta la serie %s/%s en la API' % (region, p), 'missing_series', p)
        ms.append(monthly(s['points'], s['frequency'])); meta.append(s)
    if len(ms) < MIN_MEMBERS: return None, ('menos de %d series' % MIN_MEMBERS, 'too_few_series', MIN_MEMBERS)
    by = base_year(ms)
    if not by: return None, ('ningun año natural completo con todos los miembros', 'no_base_year', None)
    bases = [sum(m['%s-%02d' % (by, mo)] for mo in range(1, 13)) / 12 for m in ms]
    months = sorted(set.intersection(*[set(m) for m in ms]))
    pts = [[k, round(sum(m[k] / b * 100 for m, b in zip(ms, bases)) / len(ms), 2)] for k in months if k >= by + '-01']
    if len(pts) < MIN_MONTHS: return None, ('solo %d meses con todos los miembros (minimo %d)' % (len(pts), MIN_MONTHS), 'too_few_months', len(pts))
    last = pts[-1]; yago = {k: v for k, v in pts}.get('%d-%s' % (int(last[0][:4]) - 1, last[0][5:]))
    verdict = 'condiciones' if any(s['verdict'] == 'condiciones' for s in meta) else 'apto'
    return {'schemaVersion': 1, 'generatedAt': gen, 'id': '%s/%s' % (region, bid), 'region': region, 'basket': bid, 'name': names, 'verdict': verdict, 'basePeriod': by, 'base': 100, 'weighting': 'equal',
            'first': pts[0][0], 'last': last[0], 'rows': len(pts), 'changeMoMPct': round((last[1] / pts[-2][1] - 1) * 100, 2), 'changeYoYPct': round((last[1] / yago - 1) * 100, 2) if yago else None,
            'members': [{'id': s['id'], 'product': s['product'], 'name': s['name'], 'weightPct': round(100 / len(meta), 2), 'unit': s['unit'], 'currency': s['currency'], 'frequency': s['frequency'], 'sourceName': s['sourceName'], 'license': s['license'], 'verdict': s['verdict'], 'attribution': s['attribution']} for s in meta],
            'attribution': ' · '.join(dict.fromkeys(s['attribution'] for s in meta)), 'methodology': METHOD, 'points': pts}, None
def build():
    idx = json.loads((API / 'index.json').read_text(encoding='utf-8')); gen = idx['generatedAt']
    series = {m['id']: json.loads((API / 'series' / (m['id'] + '.json')).read_text(encoding='utf-8')) for m in idx['series']}
    files, cat, excl = {}, [], []
    for region, bid, names, members in BASKETS:
        doc, why = make(region, bid, names, members, series, gen)
        if not doc: excl.append({'id': '%s/%s' % (region, bid), 'name': names, 'members': members, 'reason': why[0], 'code': why[1], 'n': why[2]}); continue
        files['%s/%s.json' % (region, bid)] = jdump(doc)
        cat.append({k: doc[k] for k in ('id', 'region', 'basket', 'name', 'verdict', 'basePeriod', 'first', 'last', 'rows', 'changeMoMPct', 'changeYoYPct')} | {'members': [m['product'] for m in doc['members']], 'url': '/data/indices/%s.json' % doc['id']})
    files['index.json'] = jdump({'schemaVersion': 1, 'generatedAt': gen, 'weighting': 'equal', 'minMembers': MIN_MEMBERS, 'minMonths': MIN_MONTHS, 'methodology': METHOD, 'baskets': cat, 'excluded': excl})
    return files
def main():
    files = build()
    if '--check' in sys.argv:
        bad = [k for k, v in files.items() if not (OUT / k).exists() or (OUT / k).read_text(encoding='utf-8') != v]
        extra = [str(p.relative_to(OUT)) for p in OUT.rglob('*.json') if str(p.relative_to(OUT)) not in files] if OUT.exists() else []
        if bad or extra: print('CESTAS DESFASADAS (%s; sobrantes %s): ejecuta scripts/build-baskets.py' % (bad, extra)); sys.exit(1)
        print('Cestas al dia: %d ficheros' % len(files)); return
    OUT.mkdir(parents=True, exist_ok=True)
    for k, v in files.items():
        p = OUT / k; p.parent.mkdir(parents=True, exist_ok=True)
        if not p.exists() or p.read_text(encoding='utf-8') != v: p.write_text(v, encoding='utf-8')
    for p in list(OUT.rglob('*.json')):
        if str(p.relative_to(OUT)) not in files: p.unlink()
    i = json.loads(files['index.json'])
    print('Cestas: %d publicadas, %d excluidas' % (len(i['baskets']), len(i['excluded'])))
    for b in i['baskets']: print('  %-16s %s..%s base %s  m/m %s%%  a/a %s%%' % (b['id'], b['first'], b['last'], b['basePeriod'], b['changeMoMPct'], b['changeYoYPct']))
    for e in i['excluded']: print('  EXCLUIDA %-14s %s' % (e['id'], e['reason']))
if __name__ == '__main__': main()
