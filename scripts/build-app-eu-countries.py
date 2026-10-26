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
NATIONAL_MARKET = ('average national price', 'national average')   # la Comisión rotula así la media nacional cuando el país publica además mercados concretos (aceite: Italia, Grecia, Portugal, Croacia)
def is_national(x): return not x.get('m') or x['m'].strip().lower() in NATIONAL_MARKET
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
 ('arroz', 'arroz', ['paddy-japonica-avg'], 'Arroz cáscara (japónica)|Paddy rice (japonica)|Riz paddy (japonica)|Riso risone (japonica)', '€/tonelada|€/tonne|€/tonne|€/tonnellata', 1),
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

# Cereales: desde 2026/27 la Comisión ya no publica la media nacional, solo mercados concretos (13-oct-2026, decisión de Mario: «todos los mercados dentro del país»).
# Si la media nacional está caducada, la lista del país enseña UN mercado real de ese país (el más reciente de la variedad que toca) y lo rotula con su nombre.
# Nunca se calcula una media ni se usa un mercado de otro país. Los demás mercados siguen en Lonjas.
CER = {'trigo': ('trigo', ('pan',)), 'trigo_duro': ('trigo_duro', None), 'maiz': ('maiz', ('pienso', '')), 'cebada': ('cebada', ('pienso', ''))}
STG_PREF = {'silo': 0, 'first': 0, 'farm': 0, 'gate': 0, 'unl': 1, 'port': 1, 'rport': 1, 'fob': 2, 'cif': 2}
def lj_label(kind, k):
    return LJ['labels'][kind].get(k) or ['', '', '', '']
MK_NOTE = ('Comisión Europea, portal de datos agroalimentarios: mercado de %s (%s), %s. Desde 2026/27 la Comisión ya no publica la media nacional; en Lonjas están todos los mercados del país.',
           'European Commission agri-food data portal: %s market (%s), %s. From 2026/27 the Commission no longer publishes a national average; every market in the country is in Lonjas.',
           'Portail de données agroalimentaires de la Commission européenne : marché de %s (%s), %s. Depuis 2026/27 la Commission ne publie plus de moyenne nationale ; tous les marchés du pays sont dans Lonjas.',
           'Portale dati agroalimentari della Commissione europea: mercato di %s (%s), %s. Dal 2026/27 la Commissione non pubblica più la media nazionale; tutti i mercati del paese sono in Lonjas.')
def mk_note(cc, mk):
    return {k: MK_NOTE[i] % (mk['m'], t4(NAMES[cc])[k], lj_label('st', mk.get('st', ''))[i]) for i, k in enumerate(L4)}
def best_market(cc, pid, today):
    key, var = CER[pid]
    c = (LJ['countries'].get(cc) or {}).get(key) or []
    cand = [m for m in c if m.get('p') and (var is None or m.get('var', '') in var)]
    cand = [m for m in cand if (today - datetime.date.fromisoformat(m['p'][-1][0])).days <= MAX_AGE]
    if not cand: return None
    two = (today - datetime.timedelta(days=2 * 366)).isoformat()
    def score(m):
        return (m['p'][-1][0], -STG_PREF.get(m.get('st', ''), 1), len([x for x in m['p'] if x[0] >= two]))
    return max(cand, key=score)

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

# ---- Huecos que la Comision no cubre, rellenados con la estadistica NACIONAL del propio pais (23-oct-2026, a peticion de Mario) ----
# Solo datos reales del pais; si la Comision ya tiene el producto al dia, no se toca. Si el de la Comision esta parado y el nacional es mas reciente, gana el nacional.
# Monedas: PLN y SEK se pasan a euros con la media mensual del BCE de cada mes (data/fx-history.json); el mes en curso, aun sin media publicada, usa la ultima media disponible y se avisa en la nota.
# (pais, producto, origen, fichero, serie, moneda, multiplicador a la unidad del panel, descripcion es, descripcion en)
NAT = [
 ('PL', 'trigo', 'zsrir', 'cereales', 'pl-cer-w-pszenica-kons', 'PLN', 1, 'precio semanal de compra de trigo de consumo (panificable) en empresas, sin IVA', 'weekly purchase price of food (bread) wheat at companies, excl. VAT'),
 ('PL', 'maiz', 'zsrir', 'cereales', 'pl-cer-w-kukurydza', 'PLN', 1, 'precio semanal de compra de maíz en empresas, sin IVA', 'weekly purchase price of maize at companies, excl. VAT'),
 ('PL', 'cebada', 'zsrir', 'cereales', 'pl-cer-m-jeczmien-pasz', 'PLN', 1, 'precio mensual de compra de cebada forrajera en empresas, sin IVA', 'monthly purchase price of feed barley at companies, excl. VAT'),
 ('SE', 'cebada', 'stats', 'sweden-sjv-stats', 'se-sjv-price-feed-barley', 'SEK', 10, 'precio mensual al productor de cebada forrajera (coronas por 100 kg)', 'monthly producer price of feed barley (SEK per 100 kg)'),
 ('FI', 'pollo', 'stats', 'finland-luke-stats', 'fi-luke-meat-broilers', 'EUR', 1, 'precio mensual al productor de pollos broiler (no es el precio de venta del pollo entero de la Comisión)', 'monthly producer price of broilers (not the whole-chicken selling price the Commission publishes)'),
 ('FI', 'huevos', 'stats', 'finland-luke-stats', 'fi-luke-wk-eggs-barn-hen-house', 'EUR', 1, 'precio semanal de venta de las empaquetadoras, huevos de gallinas en suelo, tallas M y L', 'weekly packing-plant selling price, barn-hen eggs, sizes M and L'),
]
NAT_SRC = {'PL': ('mrirw_zsrir', 'ZSRIR (Ministerio de Agricultura de Polonia)', 'ZSRIR (Polish Ministry of Agriculture)'), 'SE': ('sjv_se', 'Jordbruksverket', 'Jordbruksverket'), 'FI': ('luke_fi', 'Luke (Instituto de Recursos Naturales de Finlandia)', 'Luke (Natural Resources Institute Finland)')}
def fx_table(cur):
    d = json.loads((D / 'fx-history.json').read_text())['currencies'][cur]; return {m: r for m, r in d}
def nat_points(kind, fname, sid, cc):
    """-> [(fecha ISO, valor en moneda original, freq)] """
    if kind == 'zsrir':
        doc = json.loads((D / 'poland-zsrir' / (fname + '.json')).read_text()); sr = next(x for t in doc['tables'] for x in t['series'] if x['id'] == sid)
    else:
        sr = next(x for x in json.loads((D / (fname + '.json')).read_text())['countries'][cc]['series'] if x['id'] == sid)
    out, fq = [], sr.get('frequency') or 'monthly'
    for p, v in sr['points']:
        if v is None: continue
        if 'W' in p:
            y, w = p.split('-W'); d = datetime.date.fromisocalendar(int(y), int(w), 7); fq = 'weekly'
        elif len(p) == 10:
            d = datetime.date.fromisoformat(p) + datetime.timedelta(days=6); fq = 'weekly'     # lunes ISO -> domingo, como la Comision
        else:
            y, m = int(p[:4]), int(p[5:7]); d = (datetime.date(y + (m == 12), m % 12 + 1, 1) - datetime.timedelta(days=1)); fq = 'monthly'
        out.append((d.isoformat(), v))
    return out, fq
def nat_fill(out, today):
    added = []
    for cc, pid, kind, fname, sid, cur, mult, des, den in NAT:
        P0 = next(x for x in P if x[0] == pid)
        try: pts0, fq = nat_points(kind, fname, sid, cc)
        except Exception as e: print('  NAT sin serie:', cc, pid, sid, str(e)[:80]); continue
        tab = fx_table(cur) if cur != 'EUR' else None; lastm = max(tab) if tab else None; carried = False; pts = []
        for d, v in pts0:
            if tab:
                m = d[:7]; r = tab.get(m)
                if r is None and m > lastm: r = tab[lastm]; carried = True
                if r is None: continue
                pts.append([d, round(v * mult / r, 2)])
            else: pts.append([d, round(v * mult, 2)])
        if len(pts) < 12: continue
        last = datetime.date.fromisoformat(pts[-1][0]); age = (today - last).days
        if age > MAX_AGE: print('  NAT demasiado viejo:', cc, pid, pts[-1][0]); continue
        cut = (last - datetime.timedelta(days=5 * 366)).isoformat(); pts = [p for p in pts if p[0] >= cut]; pts, _ = despike(pts)
        cur_e = next((x for x in out.get(cc, []) if x['product'] == pid), None)
        if cur_e and not (cur_e['stale'] and cur_e['date'] < pts[-1][0]): continue
        sidn, ses, sen = NAT_SRC[cc]; ch = round((pts[-1][1] / pts[-2][1] - 1) * 100, 2) if pts[-2][1] else None
        conv_es = '' if cur == 'EUR' else ' Serie original en %s, convertida a euros con la media mensual del BCE de cada mes%s.' % (cur, '; el mes en curso usa la última media mensual publicada' if carried else '')
        conv_en = '' if cur == 'EUR' else ' Original series in %s, converted to euros with the ECB monthly average of each month%s.' % (cur, '; the current month uses the latest published monthly average' if carried else '')
        ya = next((p for p in reversed(pts) if p[0] <= (last - datetime.timedelta(days=364)).isoformat()), None)
        e = {'id': 'eu_%s_%s' % (cc.lower(), pid), 'product': pid, 'region': 'eu', 'cc': cc, 'name': t4(P0[3]), 'place': t4(NAMES[cc]), 'unit': t4(P0[4]), 'currency': 'EUR', 'value': pts[-1][1], 'changePct': ch, 'date': pts[-1][0],
             'frequency': fq, 'stale': age > STALE.get(fq, 120), 'sourceId': sidn, 'sourceName': ses, 'comparability': 'directional',
             'note': {'es': '%s: %s (dato nacional de %s, no de la Comisión Europea).%s' % (ses, des, t4(NAMES[cc])['es'], conv_es), 'en': '%s: %s (national data for %s, not from the European Commission).%s' % (sen, den, t4(NAMES[cc])['en'], conv_en)},
             'points': pts, 'yearAgo': {'date': ya[0], 'value': ya[1]} if ya else None}
        out[cc] = [x for x in out.get(cc, []) if x['product'] != pid] + [e]; added.append('%s_%s' % (cc, pid))
    return added

def main():
    global LJ
    LJ = json.loads((D / 'views' / 'lonjas.json').read_text())
    today = datetime.date.today()
    fams, files, out, dropped = {}, {}, {}, []
    for pid, fam, sids, nm, un, _div in P:
        if fam not in fams: fams[fam] = json.loads((D / 'eu' / (fam + '.json')).read_text())
        idx = {s['id']: s for s in fams[fam]['series']}
        for cc in NAMES:
            for sid in sids:
                s = idx.get(sid)
                r = next((x for x in (s or {}).get('regions', []) if x['c'] == cc and is_national(x)), None) if s else None
                if not r: continue
                last = datetime.date.fromisoformat(r['last'][0])
                if (today - last).days > MAX_AGE: continue
                key = (fam, sid)
                if key not in files: files[key] = json.loads((D / 'eu' / fam / (sid + '.json')).read_text())
                fr = next((x for x in files[key]['regions'] if x['c'] == cc and is_national(x) and (x.get('m') or '') == (r.get('m') or '')), None)
                pts = [[(EPOCH + datetime.timedelta(days=dd)).isoformat(), v] for dd, v in zip(fr['d'], fr['v'])] if fr else []
                cut = (last - datetime.timedelta(days=5 * 366)).isoformat()   # 5 años: la web los usa en el histórico ampliado
                pts = [p for p in pts if p[0] >= cut]
                two = (last - datetime.timedelta(days=2 * 366)).isoformat()
                _, nsp = despike([p for p in pts if p[0] >= two])   # picos de los dos últimos años
                pts, _ = despike(pts)
                if erratic([p for p in pts if p[0] >= two], nsp): dropped.append('%s_%s/%s' % (cc, pid, sid)); continue
                if not pts: continue
                age = (today - last).days; fq = files[key].get('freq') or fams[fam].get('freq') or 'weekly'
                mk = None
                if fam == 'cereales' and pid in CER and age > STALE.get(fq, 120):
                    mk = best_market(cc, pid, today)
                    if mk and mk['p'][-1][0] > r['last'][0]:
                        pts = [list(x) for x in mk['p'] if x[0] >= cut]
                        _, nsp = despike([p for p in pts if p[0] >= two]); pts, _ = despike(pts)
                        if erratic([p for p in pts if p[0] >= two], nsp): dropped.append('%s_%s/%s' % (cc, pid, mk['m'])); mk = None
                        else:
                            pr = pts[-2] if len(pts) > 1 else None
                            r = dict(r, last=pts[-1], prev=pr, yoy=None); last = datetime.date.fromisoformat(pts[-1][0]); age = (today - last).days
                    else: mk = None
                ya = r.get('yoy')
                prev = r.get('prev')
                ch = round((r['last'][1] / prev[1] - 1) * 100, 2) if prev and prev[1] else None
                out.setdefault(cc, []).append({
                    'id': 'eu_%s_%s' % (cc.lower(), pid), 'product': pid, 'region': 'eu', 'cc': cc, 'name': t4(nm), 'place': ({k: '%s · %s' % (v, mk['m']) for k, v in t4(NAMES[cc]).items()} if mk else t4(NAMES[cc])), 'unit': t4(un),
                    'currency': 'EUR', 'value': r['last'][1], 'changePct': ch, 'date': r['last'][0], 'frequency': fq, 'stale': age > STALE.get(fq, 120),
                    'sourceId': 'eu_agrifood', 'sourceName': SRC, 'comparability': 'directional',
                    'note': (mk_note(cc, mk) if mk else {'es': 'Comisión Europea, portal de datos agroalimentarios: media nacional de %s (%s). Es el dato de este país, no el de otro.' % (t4(NAMES[cc])['es'], ' · '.join(files[key].get('parts') or [sid]))}),
                    'points': pts, 'yearAgo': {'date': ya[0], 'value': ya[1]} if ya else None})
                break
    nat = nat_fill(out, today)
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
    if nat: print('  desde estadística nacional: ' + ', '.join(nat))
    if dropped: print('  fuera por erráticas: ' + ', '.join(dropped))

if __name__ == '__main__':
    main()
