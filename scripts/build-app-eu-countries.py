#!/usr/bin/env python3
"""Precios de cada país de la UE para la app (12-oct-2026, a petición de Mario: «¿por qué solo 3 países? ¿y si soy de Italia?»).
-> data/app/v1/eu/<CC>.json (lista de precios con el mismo formato que data/app/v1/prices.json) y data/app/v1/eu/index.json.
Solo datos REALES de ese país del portal agroalimentario de la Comisión Europea (data/eu/<familia>.json y data/eu/<familia>/<serie>.json):
media nacional de cada país, nunca la de otro país ni un precio derivado. España sigue con los precios de data/app/v1/prices.json.
No descarga nada. Uso: python3 scripts/build-app-eu-countries.py"""
import datetime, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'data'
OUT = D / 'app' / 'v1' / 'eu'
EPOCH = datetime.date(2000, 1, 1)
# producto -> (familia, [series por orden de preferencia], nombre es|en|fr|it, unidad es|en|fr|it, divisor para la unidad mostrada)
P = [
 ('trigo', 'cereales', ['breadmaking-common-wheat-national-average-not-specified'], 'Trigo blando|Soft wheat|Blé tendre|Frumento tenero', '€/tonelada|€/tonne|€/tonne|€/tonnellata', 1),
 ('trigo_duro', 'cereales', ['durum-wheat-national-average-not-specified'], 'Trigo duro|Durum wheat|Blé dur|Frumento duro', '€/tonelada|€/tonne|€/tonne|€/tonnellata', 1),
 ('maiz', 'cereales', ['feed-maize-national-average-not-specified'], 'Maíz|Maize|Maïs|Mais', '€/tonelada|€/tonne|€/tonne|€/tonnellata', 1),
 ('cebada', 'cereales', ['feed-barley-national-average-not-specified'], 'Cebada|Barley|Orge|Orzo', '€/tonelada|€/tonne|€/tonne|€/tonnellata', 1),
 ('leche', 'leche', ['raw-milk'], 'Leche cruda|Raw milk|Lait cru|Latte crudo', '€/100 kg|€/100 kg|€/100 kg|€/100 kg', 1),
 ('mantequilla', 'lacteos', ['butter'], 'Mantequilla|Butter|Beurre|Burro', '€/100 kg|€/100 kg|€/100 kg|€/100 kg', 1),
 ('cerdo', 'cerdo', ['e', 'r'], 'Cerdo (canal)|Pig (carcass)|Porc (carcasse)|Suino (carcassa)', '€/100 kg|€/100 kg|€/100 kg|€/100 kg', 1),
 ('lechon', 'cerdo', ['piglet'], 'Lechón|Piglet|Porcelet|Suinetto', '€/animal|€/head|€/tête|€/capo', 1),
 ('vaca', 'vacuno', ['young-bulls-ar3', 'young-bulls-ao3', 'young-bulls-ar2'], 'Vacuno (añojo R3)|Beef (young bull R3)|Bovin (jeune bovin R3)|Bovino (vitellone R3)', '€/100 kg|€/100 kg|€/100 kg|€/100 kg', 1),
 ('cordero', 'ovino', ['heavy-lamb', 'light-lamb'], 'Cordero|Lamb|Agneau|Agnello', '€/100 kg|€/100 kg|€/100 kg|€/100 kg', 1),
 ('pollo', 'pollo', ['whole-broiler-65-selling-price'], 'Pollo|Chicken|Poulet|Pollo', '€/100 kg|€/100 kg|€/100 kg|€/100 kg', 1),
 ('huevos', 'huevos', ['cage', 'barn'], 'Huevos|Eggs|Œufs|Uova', '€/100 kg|€/100 kg|€/100 kg|€/100 kg', 1),
 ('oliva', 'aceite', ['extra-virgin-olive-oil-up-to-0-8'], 'Aceite de oliva virgen extra|Extra virgin olive oil|Huile d’olive vierge extra|Olio extravergine di oliva', '€/100 kg|€/100 kg|€/100 kg|€/100 kg', 1),
]
L4 = ('es', 'en', 'fr', 'it')
NAMES = {'AT': 'Austria|Austria|Autriche|Austria', 'BE': 'Bélgica|Belgium|Belgique|Belgio', 'BG': 'Bulgaria|Bulgaria|Bulgarie|Bulgaria', 'CY': 'Chipre|Cyprus|Chypre|Cipro',
         'CZ': 'Chequia|Czechia|Tchéquie|Cechia', 'DE': 'Alemania|Germany|Allemagne|Germania', 'DK': 'Dinamarca|Denmark|Danemark|Danimarca', 'EE': 'Estonia|Estonia|Estonie|Estonia',
         'EL': 'Grecia|Greece|Grèce|Grecia', 'FI': 'Finlandia|Finland|Finlande|Finlandia', 'FR': 'Francia|France|France|Francia', 'HR': 'Croacia|Croatia|Croatie|Croazia',
         'HU': 'Hungría|Hungary|Hongrie|Ungheria', 'IE': 'Irlanda|Ireland|Irlande|Irlanda', 'IT': 'Italia|Italy|Italie|Italia', 'LT': 'Lituania|Lithuania|Lituanie|Lituania',
         'LU': 'Luxemburgo|Luxembourg|Luxembourg|Lussemburgo', 'LV': 'Letonia|Latvia|Lettonie|Lettonia', 'MT': 'Malta|Malta|Malte|Malta', 'NL': 'Países Bajos|Netherlands|Pays-Bas|Paesi Bassi',
         'PL': 'Polonia|Poland|Pologne|Polonia', 'PT': 'Portugal|Portugal|Portugal|Portogallo', 'RO': 'Rumanía|Romania|Roumanie|Romania', 'SE': 'Suecia|Sweden|Suède|Svezia',
         'SI': 'Eslovenia|Slovenia|Slovénie|Slovenia', 'SK': 'Eslovaquia|Slovakia|Slovaquie|Slovacchia'}
MAX_AGE = 120  # dias: un precio mas viejo no entra en la cesta del pais
SRC = 'Comisión Europea · Agri-food'

def t4(s): return dict(zip(L4, s.split('|')))

STALE = {'weekly': 21, 'monthly': 62}   # dias: mas viejo que esto, la app lo rotula como «último dato de …» (fin de campaña, retraso del país)

def despike(pts):
    """Quita picos aislados (un punto que se aleja más de un 35 % de dos vecinos que coinciden entre sí): son errores de carga del país.
    Devuelve (puntos limpios, nº de picos)."""
    out, n = [], 0
    for i, p in enumerate(pts):
        if 0 < i < len(pts) - 1:
            a, b, c = pts[i - 1][1], p[1], pts[i + 1][1]
            if a and c and abs(a / c - 1) < 0.15 and abs(b / ((a + c) / 2) - 1) > 0.35: n += 1; continue
        out.append(p)
    return out, n

def erratic(pts, spikes):
    """Serie de un mercado tan estrecho que el precio salta de una semana a otra sin sentido: mediana de los cambios del último medio año > 7 %
    o cinco picos o más en dos años. No se enseña: un precio así no informa al agricultor."""
    v = [x[1] for x in pts if x[1]]
    ch = [abs(b / a - 1) for a, b in zip(v, v[1:]) if a][-26:]
    if not ch: return False
    ch.sort(); med = ch[len(ch) // 2]
    return med > 0.07 or spikes >= 5

def main():
    today = datetime.date.today()
    fams, files, out, dropped = {}, {}, {}, []
    for pid, fam, sids, nm, un, _div in P:
        if fam not in fams: fams[fam] = json.loads((D / 'eu' / (fam + '.json')).read_text())
        idx = {s['id']: s for s in fams[fam]['series']}
        for cc in NAMES:
            for sid in sids:
                s = idx.get(sid)
                r = next((x for x in (s or {}).get('regions', []) if x['c'] == cc and not x.get('m')), None) if s else None
                if not r: continue
                last = datetime.date.fromisoformat(r['last'][0])
                if (today - last).days > MAX_AGE: continue
                key = (fam, sid)
                if key not in files: files[key] = json.loads((D / 'eu' / fam / (sid + '.json')).read_text())
                fr = next((x for x in files[key]['regions'] if x['c'] == cc and not x.get('m')), None)
                pts = [[(EPOCH + datetime.timedelta(days=dd)).isoformat(), v] for dd, v in zip(fr['d'], fr['v'])] if fr else []
                cut = (last - datetime.timedelta(days=5 * 366)).isoformat()   # 5 años: la web los usa en el histórico ampliado
                pts = [p for p in pts if p[0] >= cut]
                two = (last - datetime.timedelta(days=2 * 366)).isoformat()
                _, nsp = despike([p for p in pts if p[0] >= two])   # picos de los dos últimos años
                pts, _ = despike(pts)
                if erratic([p for p in pts if p[0] >= two], nsp): dropped.append('%s_%s/%s' % (cc, pid, sid)); continue
                if not pts: continue
                age = (today - last).days; fq = files[key].get('freq') or fams[fam].get('freq') or 'weekly'
                ya = r.get('yoy')
                prev = r.get('prev')
                ch = round((r['last'][1] / prev[1] - 1) * 100, 2) if prev and prev[1] else None
                out.setdefault(cc, []).append({
                    'id': 'eu_%s_%s' % (cc.lower(), pid), 'product': pid, 'region': 'eu', 'cc': cc, 'name': t4(nm), 'place': t4(NAMES[cc]), 'unit': t4(un),
                    'currency': 'EUR', 'value': r['last'][1], 'changePct': ch, 'date': r['last'][0], 'frequency': fq, 'stale': age > STALE.get(fq, 120),
                    'sourceId': 'eu_agrifood', 'sourceName': SRC, 'comparability': 'directional',
                    'note': {'es': 'Comisión Europea, portal de datos agroalimentarios: media nacional de %s (%s). Es el dato de este país, no el de otro.' % (t4(NAMES[cc])['es'], ' · '.join(files[key].get('parts') or [sid]))},
                    'points': pts, 'yearAgo': {'date': ya[0], 'value': ya[1]} if ya else None})
                break
    OUT.mkdir(parents=True, exist_ok=True)
    gen = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    keep = set()
    for cc, prices in sorted(out.items()):
        f = OUT / (cc + '.json'); keep.add(f.name)
        body = {'schemaVersion': 1, 'country': cc, 'name': t4(NAMES[cc]), 'prices': prices}
        old = None
        try: old = json.loads(f.read_text())
        except Exception: pass
        if not old or old.get('prices') != prices:
            f.write_text(json.dumps(dict(body, generatedAt=gen), ensure_ascii=False, separators=(',', ':')) + '\n')
    idx = {'schemaVersion': 1, 'source': 'eu_agrifood', 'countries': {cc: {'name': t4(NAMES[cc]), 'n': len(v), 'products': [p['product'] for p in v]} for cc, v in sorted(out.items())}}
    (OUT / 'index.json').write_text(json.dumps(idx, ensure_ascii=False, separators=(',', ':')) + '\n'); keep.add('index.json')
    for f in OUT.glob('*.json'):
        if f.name not in keep: f.unlink()
    print('app eu: %d países; %s' % (len(out), {k: len(v) for k, v in sorted(out.items())}))
    if dropped: print('  fuera por erráticas: ' + ', '.join(dropped))

if __name__ == '__main__':
    main()
