#!/usr/bin/env python3
"""PAC Dinamarca: importes y umbrales de la campana 2026 leidos del texto vigente de los decretos en Retsinformation (retsinformation.dk, XML oficial)
 - BEK nr. 1363 de 25-nov-2025  Bekendtgorelse om grundbetaling m.v. til landbrugere for 2026  (pago basico, ayuda a islas, fecula de patata, umbrales)
 - BEK nr. 1381 de 27-nov-2025  Bekendtgorelse om tilskud til bio-ordninger for 2026          (eco-regimenes y ayuda a la superficie ecologica)
Escribe data/cap/dk/amounts.json (importes, umbrales, decretos modificadores) y data/cap/dk/watch.json (huellas del texto que sustenta cada cifra: si cambian, 'reviewNeeded').
Los importes se leen del texto, no se copian a mano: si la estructura cambia y no se encuentra una cifra esperada, sale con error y NO escribe nada (nunca se inventa un importe).
Uso: python3 scripts/update-cap-dk.py [--accept] [--xml1363 f --xml1381 f] [--out dir]"""
import argparse, datetime, hashlib, json, os, re, sys, time, urllib.request
import xml.etree.ElementTree as ET
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'data', 'cap', 'dk')
DOCS = [('BEK1363', 2025, 1363, 'https://www.retsinformation.dk/eli/lta/2025/1363'), ('BEK1381', 2025, 1381, 'https://www.retsinformation.dk/eli/lta/2025/1381')]
def fetch(url):
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url + '/xml', headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': 'application/xml'}), timeout=90) as r: return r.read().decode('utf-8-sig')
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError('Retsinformation %s: %s' % (url, str(last)[:160]))
def tx(e):
    return re.sub(r'\s+', ' ', ''.join(e.itertext())).strip() if e is not None else ''
def num(s):
    s = s.strip()
    if re.match(r'^\d{1,3}(\.\d{3})+(,\d+)?$', s): s = s.replace('.', '')
    return float(s.replace(',', '.'))
def sha(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()
def meta_of(root, url):
    m = root.find('Meta'); g = lambda t: tx(m.find(t))
    refs = {}
    for el in m:
        rid = el.get('REFid')
        if rid: refs.setdefault(rid, {})[el.tag] = tx(el)
    changes = [{'accession': refs[k].get('Ref_Accn'), 'date': refs[k].get('Ref_Af'), 'title': refs[k].get('Ref_Text')} for k in sorted(refs) if k.startswith('change_')]
    return {'number': int(g('Number')), 'title': g('DocumentTitle'), 'signed': g('DiesSigni'), 'accession': g('AccessionNumber'), 'status': g('Status'), 'versionDate': g('EndDate') or None, 'url': url, 'amendments': changes}
def paragraphs(root):
    """-> lista de dicts {afsnit, kapitel, rubrica, par ('§ 38'), text, stk:[texto de cada Stk]} en el orden del documento"""
    out = []; cur = {'afsnit': ''}
    def walk(node, af, kap):
        for ch in node:
            if ch.tag == 'Afsnit':
                af2 = tx(ch.find('Rubrica')) or af; walk(ch, af2, kap)
            elif ch.tag == 'Kapitel':
                walk(ch, af, (tx(ch.find('Explicatus')), tx(ch.find('Rubrica'))))
            elif ch.tag == 'Paragraf':
                out.append({'afsnit': af, 'kapitel': kap[0] if kap else '', 'rubrica': kap[1] if kap else '', 'par': tx(ch.find('Explicatus')).rstrip('.'), 'text': tx(ch), 'stk': [tx(s) for s in ch.findall('Stk')]})
            else: walk(ch, af, kap)
    walk(root.find('DokumentIndhold') if root.find('DokumentIndhold') is not None else root, '', None)
    return out
def find(pars, par, must):
    c = [p for p in pars if p['par'] == par and must in p['text']]
    if len(c) != 1: raise ValueError('no se encuentra %s con "%s" (%d coincidencias): el decreto ha cambiado de estructura, revisar a mano' % (par, must, len(c)))
    return c[0]
def items(par_text):
    """'1) Basisstotte: 181,21 EUR pr. ha. 2) ...' -> [(etiqueta, importe)]"""
    return [(m.group(2).strip(), num(m.group(3))) for m in re.finditer(r'(\d+)\)\s*([^:]+?):\s*([\d.,]+)\s*EUR pr\. ha', par_text)]
def build(r63, r81, urls):
    m63, m81 = meta_of(r63, urls[0]), meta_of(r81, urls[1])
    p63, p81 = paragraphs(r63), paragraphs(r81)
    schemes, thresholds, sections = [], [], {}
    def sec(key, p):
        sections[key] = {'sha256': sha(p['text']), 'chars': len(p['text'])}
    # --- BEK 1363
    p = find(p63, '§ 38', 'grundbetalingen'); m = re.search(r'udg[øo]r\s+([\d.,]+)\s*EUR pr\. hektar', p['text'])
    if not m: raise ValueError('§ 38: no se lee el importe del pago basico')
    mods = [s for s in p['stk'][1:]]
    schemes.append({'id': 'basic', 'doc': 'BEK1363', 'par': '§ 38', 'group': 'direct', 'name': 'Grundbetaling', 'items': [{'id': 'basic', 'label': 'Grundbetaling', 'amount': num(m.group(1)), 'unit': 'EUR/ha'}], 'modifiers': mods}); sec('basic', p)
    p = find(p63, '§ 39', 'ø-støtte'); m = re.search(r'([\d.,]+)\s*kr\. pr\. hektar', p['text'])
    if not m: raise ValueError('§ 39: no se lee la ayuda a islas')
    schemes.append({'id': 'island', 'doc': 'BEK1363', 'par': '§ 39', 'group': 'direct', 'name': 'Ø-støtte', 'items': [{'id': 'island', 'label': 'Ø-støtte', 'amount': num(m.group(1)), 'unit': 'DKK/ha'}], 'modifiers': []}); sec('island', p)
    p = find(p63, '§ 40', 'stivelseskartofler'); m = re.search(r'maksimalt\s+([\d.,]+)\s*EUR pr\. hektar', p['text'])
    if not m: raise ValueError('§ 40: no se lee la fecula de patata')
    schemes.append({'id': 'starch_potato', 'doc': 'BEK1363', 'par': '§ 40', 'group': 'coupled', 'name': 'Stivelseskartofler', 'items': [{'id': 'starch_potato', 'label': 'Stivelseskartofler (maksimalt)', 'amount': num(m.group(1)), 'unit': 'EUR/ha', 'max': True}], 'modifiers': p['stk'][1:]}); sec('starch_potato', p)
    # --- umbrales BEK 1363
    p = find(p63, '§ 10', 'mindst 2,00 hektar'); m = re.search(r'mindst\s+([\d.,]+)\s*hektar.*?mindst\s+([\d.,]+)\s*EUR', p['text'])
    if not m: raise ValueError('§ 10: umbral de superficie')
    thresholds.append({'id': 'min_area', 'doc': 'BEK1363', 'par': '§ 10', 'value': num(m.group(1)), 'unit': 'ha', 'alt': {'value': num(m.group(2)), 'unit': 'EUR', 'what': 'ko- eller slagtepræmie'}}); sec('min_area', p)
    p = find(p63, '§ 11', 'sammenhængende areal'); m = re.search(r'mindst\s+([\d.,]+)\s*hektar', p['text'])
    if not m: raise ValueError('§ 11: umbral de parcela')
    thresholds.append({'id': 'min_parcel', 'doc': 'BEK1363', 'par': '§ 11', 'value': num(m.group(1)), 'unit': 'ha'}); sec('min_parcel', p)
    p = find(p63, '§ 9', 'aktiv landbruger'); m1 = re.search(r'mindst\s+([\d.,]+)\s*tilskudsberettigede hektar', p['text']); m2 = re.search(r'højst\s+([\d.,]+)\s*EUR', p['text'])
    if not (m1 and m2): raise ValueError('§ 9: criterios de agricultor activo')
    thresholds.append({'id': 'active_farmer', 'doc': 'BEK1363', 'par': '§ 9', 'value': num(m1.group(1)), 'unit': 'ha', 'alt': {'value': num(m2.group(1)), 'unit': 'EUR', 'what': 'direkte betalinger i 2025'}}); sec('active_farmer', p)
    # --- BEK 1381: cada Afsnit con su paragrafo de importes
    spec = (('bio_area', 'Økologisk arealstøtte', '§ 19', 'Støtten for 2026 udgør'), ('bio_extensive', 'Tilskud til midlertidig ekstensivering', '§ 32', 'Tilskuddet udgør følgende'),
            ('bio_grass', 'Tilskud til miljø- og klimavenligt græs', '§ 38', 'Tilskuddet udgør'), ('bio_varied', 'Tilskud til varieret planteproduktion', '§ 43', 'Tilskuddet udgør'))
    for sid, af, par, must in spec:
        c = [p for p in p81 if p['par'] == par and p['afsnit'] == af and must in p['text']]
        if len(c) != 1: raise ValueError('BEK 1381 %s (%s): %d coincidencias' % (par, af, len(c)))
        p = c[0]; its = items(p['text'])
        if its: its_o = [{'id': '%s_%d' % (sid, i + 1), 'label': l, 'amount': a, 'unit': 'EUR/ha'} for i, (l, a) in enumerate(its)]
        else:
            m = re.search(r'udgør\s+([\d.,]+)\s*EUR pr\. ha', p['text'])
            if not m: raise ValueError('BEK 1381 %s: no se leen importes' % par)
            its_o = [{'id': sid, 'label': p['afsnit'], 'amount': num(m.group(1)), 'unit': 'EUR/ha'}]
        schemes.append({'id': sid, 'doc': 'BEK1381', 'par': par, 'group': 'eco', 'name': p['afsnit'], 'items': its_o, 'modifiers': p['stk'][1:]}); sec(sid, p)
    if sum(len(s['items']) for s in schemes if s['group'] == 'eco') < 8: raise ValueError('BEK 1381: faltan importes')
    docs = [{'id': 'BEK1363', **m63}, {'id': 'BEK1381', **m81}]
    return {'schemaVersion': 1, 'country': 'DK', 'campaign': 2026, 'kind': 'DECREE_AMOUNTS', 'source': {'id': 'retsinformation', 'name': 'Retsinformation (Civilstyrelsen)', 'url': 'https://www.retsinformation.dk/'}, 'documents': docs, 'schemes': schemes, 'thresholds': thresholds}, sections
def stable(o):
    return json.dumps(o, ensure_ascii=False, sort_keys=True)
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--accept', action='store_true'); ap.add_argument('--xml1363'); ap.add_argument('--xml1381'); ap.add_argument('--out', '--outdir', dest='out', default=OUT_DIR); ap.add_argument('--date')
    a = ap.parse_args(); today = a.date or datetime.datetime.utcnow().strftime('%Y-%m-%d')
    try:
        x63 = open(a.xml1363, encoding='utf-8-sig').read() if a.xml1363 else fetch(DOCS[0][3]); x81 = open(a.xml1381, encoding='utf-8-sig').read() if a.xml1381 else fetch(DOCS[1][3])
        amounts, sections = build(ET.fromstring(x63.encode('utf-8')), ET.fromstring(x81.encode('utf-8')), (DOCS[0][3], DOCS[1][3]))
        for d in amounts['documents']:
            if d['status'] != 'Valid': raise ValueError('%s ya no figura como vigente (%s): revisar a mano' % (d['id'], d['status']))
    except Exception as e:
        msg = 'FALLO: %s %s' % (type(e).__name__, str(e)[:400]); print(msg)
        if os.environ.get('GITHUB_ACTIONS'): print('::error title=cap-dk::' + msg.replace('%', '%25').replace('\n', '%0A'))
        return 1
    os.makedirs(a.out, exist_ok=True); ap_path = os.path.join(a.out, 'amounts.json'); wp_path = os.path.join(a.out, 'watch.json')
    prev = json.load(open(ap_path)) if os.path.exists(ap_path) else None; pw = json.load(open(wp_path)) if os.path.exists(wp_path) else None
    changes = list((prev or {}).get('changes', []))
    core = {k: v for k, v in amounts.items()}
    if prev and stable({k: v for k, v in prev.items() if k not in ('verifiedAt', 'changes')}) != stable(core):
        changes.append({'detectedAt': today, 'summary': 'Cambian importes, umbrales o decretos modificadores extraídos de Retsinformation; revisar la diferencia en el historial de git.'})
    amounts['verifiedAt'] = today; amounts['changes'] = changes
    now = {'sections': sections, 'amendments': {d['id']: [c['accession'] for c in d['amendments']] for d in amounts['documents']}}
    baseline = (pw or {}).get('baseline') or now
    if a.accept: baseline = now
    review = []
    for k, v in sections.items():
        b = baseline['sections'].get(k)
        if not b or b['sha256'] != v['sha256']: review.append('Texto de %s (%s)' % (k, next(s['par'] for s in amounts['schemes'] + amounts['thresholds'] if s['id'] == k)))
    for did, accs in now['amendments'].items():
        for acc in accs:
            if acc not in baseline.get('amendments', {}).get(did, []): review.append('Nuevo decreto modificador de %s: %s' % (did, acc))
    watch = {'schemaVersion': 1, 'country': 'DK', 'source': 'retsinformation', 'checkedAt': today, 'baseline': baseline, 'current': now, 'reviewNeeded': review,
             'note': 'Huellas del texto de los paragrafos que sustentan cada importe y umbral. Si «reviewNeeded» no está vacío, el decreto ha cambiado desde la última revisión: hay que releerlo y, si procede, ejecutar --accept.'}
    for path, doc in ((ap_path, amounts), (wp_path, watch)):
        with open(path, 'w', encoding='utf-8') as f: json.dump(doc, f, ensure_ascii=False, separators=(',', ':')); f.write('\n')
    print('esquemas:', len(amounts['schemes']), '| umbrales:', len(amounts['thresholds']), '| revisar:', review or 'nada'); return 0
if __name__ == '__main__': sys.exit(main())
