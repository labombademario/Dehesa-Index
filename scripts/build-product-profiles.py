#!/usr/bin/env python3
"""data/products/<producto>.json — bloques precalculados de la ficha de producto 3.0 que NO conviene calcular en el navegador con ficheros pesados:
  trade   : estructura del comercio mundial (exportadores/importadores principales, cuota sobre el total mundial de PSD y HHI) a partir de USDA PSD.
  tariffs : resumen del arancel por partida HS en EE. UU. (HTS), UE (TARIC), Canada (CBSA) y Mexico (LIGIE), con la licencia de cada fuente.
Nada se estima: si no hay dato (sin PSD, sin partida) el bloque es null y la pagina dice por que. Las cuotas se calculan sobre el total mundial que da PSD; los
paises publicados no cubren el 100 %, asi que el HHI es una COTA INFERIOR (se declara). Metadatos: data/product-metadata.json."""
import datetime, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'; OUT = D / 'products'
META = json.loads((D / 'product-metadata.json').read_text())
SD = json.loads((D / 'supply-demand.json').read_text())
TAR = {'US': ('us-tariffs.json', 'us_tariffs'), 'EU': ('tariffs-eu.json', 'eu_taric'), 'CA': ('tariffs-ca.json', 'cbsa_tariff'), 'MX': ('tariffs-mx.json', 'snice_mx')}
TD = {k: json.loads((D / f).read_text()) for k, (f, _) in TAR.items()}
NOW = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

def hhi(shares):  # shares en %, HHI 0-10000
    return round(sum(s * s for s in shares), 1)

def trade(psd):
    c = next((x for x in SD['commodities'] if x['id'] == psd), None)
    if not c: return None
    my = str(c['latestMarketYear']); w = c['world'].get(my) or {}
    out = {'psd': psd, 'marketYear': c['latestMarketYear'], 'unit': c['unit'], 'publishedMonth': c.get('publishedMonth'), 'sourceId': 'usda_fas_psd',
           'note': 'Cuotas sobre el total mundial de PSD (suma de los paises de la base, UE una sola vez; no es una cifra publicada por USDA). La campana mas reciente es una prevision.'}
    for flow in ('exports', 'imports'):
        rows = []
        for name, v in c['countries'].items():
            y = v['years'].get(my) or {}
            x = y.get(flow)
            if isinstance(x, (int, float)) and x > 0: rows.append((name, x))
        tot = w.get(flow)
        if not tot or not rows: out[flow] = None; continue
        rows.sort(key=lambda r: -r[1])
        shares = [r[1] / tot * 100 for r in rows]
        out[flow] = {'world': tot, 'top': [{'name': n, 'value': v, 'share': round(s, 2)} for (n, v), s in zip(rows[:8], shares[:8])],
                     'listedCountries': len(rows), 'coveredShare': round(sum(shares), 1), 'hhiLowerBound': hhi(shares), 'top3Share': round(sum(shares[:3]), 1)}
    return out if (out.get('exports') or out.get('imports')) else None

def tariffs(hs_list):
    if not hs_list: return None
    heads = []
    for h in hs_list:
        row = {'hs': h, 'markets': {}}
        for mk, (_, sid) in TAR.items():
            doc = TD[mk]; st = doc['headingStats'].get(h)
            if not st: continue
            lines = [l for l in doc['lines'] if l['hd'] == h and 'seed' not in l['d'].lower()][:4]
            row['desc'] = row.get('desc') or doc['headings'].get(h)
            row['markets'][mk] = {'n': st['n'], 'free': st['free'], 'adv': st['adv'], 'spec': st['spec'], 'trq': st['trq'], 'fta': st['fta'], 'avgAdv': st['avgadv'], 'maxAdv': st['maxadv'],
                                  'lines': [{'h': l['h'], 'd': l['d'], 'g': l['g'], 'u': l.get('u', '')} for l in lines]}
        if row['markets']: heads.append(row)
    if not heads: return None
    src = {mk: {'sourceId': sid, 'release': (TD[mk].get('release') or {}).get('name'), 'generatedAt': TD[mk].get('generatedAt'), 'url': (TD[mk].get('source') or {}).get('url')} for mk, (_, sid) in TAR.items()}
    return {'headings': heads, 'sources': src, 'note': 'Arancel NMF/general publicado por cada administracion; no incluye contingentes, medidas antidumping ni preferencias bilaterales salvo lo que figure en la linea.'}

def main():
    OUT.mkdir(exist_ok=True)
    for pid, m in META['products'].items():
        doc = {'schemaVersion': 1, 'generatedAt': NOW, 'product': pid, 'trade': trade(m['psd']) if m.get('psd') else None, 'tariffs': tariffs(m['hs'])}
        (OUT / (pid + '.json')).write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('productos:', len(META['products']))
main()
