#!/usr/bin/env python3
"""data/trade-sections.json: comercio exterior por producto (solo total mundial, sin socios) de Canada y Argentina, derivado de
data/canada-stats.json (Statistics Canada, tabla 12-10-0011/0171, CAD) y data/argentina-stats.json (INDEC, Intercambio Comercial Argentino, USD).
Mismo esquema que us-trade-products.json: periodos = 12 meses moviles al ultimo mes publicado y los 12 anteriores.
Canada: solo hojas del arbol de productos (sin los agregados 'total', 'farm and fishing products' ni 'food, beverage and tobacco', que contienen a otras filas,
ni maquinaria agricola). Argentina: solo exportaciones por rubro; INDEC no publica importaciones por producto en esta tabla.
No descarga nada. Uso: python3 scripts/build-trade-sections.py"""
import json, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
def L(es, en, fr, it): return {'es': es, 'en': en, 'fr': fr, 'it': it}
CA = [('live-animals', L('Animales vivos', 'Live animals', 'Animaux vivants', 'Animali vivi')), ('wheat', L('Trigo', 'Wheat', 'Blé', 'Grano')), ('canola', L('Colza (canola)', 'Canola', 'Canola', 'Colza (canola)')),
      ('fruit-nuts-vegetables-and-pulses', L('Fruta, frutos secos, hortalizas y legumbres', 'Fruit, nuts, vegetables and pulses', 'Fruits, fruits à coque, légumes et légumineuses', 'Frutta, frutta secca, ortaggi e legumi')),
      ('other-crop-products', L('Otros productos agrícolas', 'Other crop products', 'Autres produits végétaux', 'Altri prodotti vegetali')), ('other-animal-products', L('Otros productos animales', 'Other animal products', 'Autres produits animaux', 'Altri prodotti animali')),
      ('animal-feed', L('Piensos', 'Animal feed', 'Aliments pour animaux', 'Mangimi')), ('potash', L('Potasa', 'Potash', 'Potasse', 'Potassa')),
      ('fertilizers-pesticides-and-chemicals', L('Fertilizantes, plaguicidas y químicos', 'Fertilizers, pesticides and chemicals', 'Engrais, pesticides et produits chimiques', 'Fertilizzanti, pesticidi e prodotti chimici')),
      ('meat-products', L('Carne', 'Meat products', 'Viandes', 'Carni')), ('dairy-products', L('Lácteos', 'Dairy products', 'Produits laitiers', 'Latticini')), ('other-food-products', L('Otros alimentos (incl. pescado)', 'Other food products', 'Autres produits alimentaires', 'Altri prodotti alimentari'))]
AR = [('cereals', L('Cereales', 'Cereals', 'Céréales', 'Cereali')), ('oilseeds', L('Oleaginosas', 'Oilseeds', 'Oléagineux', 'Semi oleosi')), ('meat', L('Carne', 'Meat', 'Viandes', 'Carni')), ('dairy-eggs', L('Lácteos y huevos', 'Dairy and eggs', 'Produits laitiers et œufs', 'Latticini e uova')),
      ('fats-oils', L('Grasas y aceites', 'Fats and oils', 'Graisses et huiles', 'Grassi e oli')), ('milling', L('Productos de molinería', 'Milling products', 'Produits de la minoterie', 'Prodotti della molitura')), ('sugar', L('Azúcar y confitería', 'Sugar and confectionery', 'Sucre et confiserie', 'Zucchero e confetteria')),
      ('fresh-fruit', L('Fruta fresca', 'Fresh fruit', 'Fruits frais', 'Frutta fresca')), ('fresh-vegetables', L('Hortalizas frescas y legumbres', 'Fresh vegetables and pulses', 'Légumes frais et légumineuses', 'Ortaggi freschi e legumi')), ('beverages', L('Bebidas, líquidos alcohólicos y vinagre', 'Beverages, alcoholic liquids and vinegar', 'Boissons, liquides alcooliques et vinaigre', 'Bevande, liquidi alcolici e aceto'))]
def load(f, cc): return {s['id']: s for s in json.loads((ROOT / 'data' / f).read_text(encoding='utf-8'))['countries'][cc]['series']}
def sums(s):
    p = s['points']
    if len(p) < 24: return None
    return [round(sum(v for _, v in p[-24:-12]), 3), round(sum(v for _, v in p[-12:]), 3)], p[-1][0]
def build(cc, series, defs, idfn, names, unit, src, note):
    rep, last = {}, None
    for key, nm in defs:
        row = {'name': nm['en'], 'nm': nm}
        for fl in ('exp', 'imp'):
            s = series.get(idfn(fl, key)); r = sums(s) if s else None
            row[fl] = {'world': r[0], 'extra': None, 'intra': None, 'partners': []} if r else None
            if r: last = r[1] if last is None else min(last, r[1])
        if row['exp'] or row['imp']: rep[key] = row
    return rep, last, unit, src, note
def main():
    out = {'schemaVersion': 1, 'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'reporters': {}, 'meta': {}}
    ca = load('canada-stats.json', 'CA'); ar = load('argentina-stats.json', 'AR')
    parts = [
        ('CA', build('CA', ca, CA, lambda fl, k: 'ca-trade-%s-%s' % (fl, k), None, 'CAD million', {'name': 'Statistics Canada (international merchandise trade)', 'url': 'https://www150.statcan.gc.ca/', 'license': 'Open Government Licence - Canada; cite source'},
            L('Productos agrarios y alimentarios de Statistics Canada, sin los agregados que contienen a otros (sin maquinaria). Total mundial, sin desglose por socio.', 'Farm and food product groups from Statistics Canada, leaving out the aggregates that contain other rows (no machinery). World total, no partner breakdown.', 'Groupes de produits agricoles et alimentaires de Statistics Canada, sans les agrégats qui en contiennent d’autres (sans machines). Total mondial, sans partenaires.', 'Gruppi di prodotti agricoli e alimentari di Statistics Canada, senza gli aggregati che ne contengono altri (senza macchinari). Totale mondiale, senza partner.'))),
        ('AR', build('AR', ar, AR, lambda fl, k: 'ar-indec-%s-%s' % ('exports' if fl == 'exp' else 'imports', k), None, 'USD million', {'name': 'INDEC, Intercambio Comercial Argentino', 'url': 'https://www.indec.gob.ar/', 'license': 'INDEC: citar la fuente'},
            L('Solo exportaciones por rubro (valor FOB); no tenemos importaciones por producto. Total mundial, sin desglose por socio.', 'Exports only, by product group (FOB value); we do not have imports by product. World total, no partner breakdown.', 'Exportations seulement, par rubrique (valeur FOB) ; pas d’importations par produit. Total mondial, sans partenaires.', 'Solo esportazioni per voce (valore FOB); non abbiamo importazioni per prodotto. Totale mondiale, senza partner.')))]
    for cc, (rep, last, unit, src, note) in parts:
        if not rep or not last: continue
        y, m = last[:4], last[5:7]
        out['reporters'][cc] = rep
        out['meta'][cc] = {'years': ['LTM %s/%d' % (m, int(y) - 1), 'LTM %s/%s' % (m, y)], 'unit': unit, 'source': src, 'note': note}
    (ROOT / 'data' / 'trade-sections.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('ok', {k: len(v) for k, v in out['reporters'].items()}, {k: v['years'] for k, v in out['meta'].items()})
main()
