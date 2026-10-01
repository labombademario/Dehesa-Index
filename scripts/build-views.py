#!/usr/bin/env python3
"""data/views/*.json — vistas pequenas para las paginas de entrada. Cada pagina descarga SOLO su vista (KB), nunca el dataset entero.
  eu-preview.json   tarjetas de la vista previa de la UE de perfiles.html (media UE publicada por la Comision; sin recalcular)
Se regenera junto con el catalogo (update-pipeline-status.yml) y es estricto: si una fuente falta, falla en lugar de publicar una vista incompleta."""
import datetime, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / 'data'; V = D / 'views'
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def write(name, doc, volatile=('generatedAt',)):
    """Solo reescribe si cambia algo distinto de la hora de generacion."""
    V.mkdir(parents=True, exist_ok=True); p = V / name
    new = json.dumps(doc, ensure_ascii=False, separators=(',', ':'))
    try:
        old = json.loads(p.read_text())
        a = {k: v for k, v in old.items() if k not in volatile}; b = {k: v for k, v in doc.items() if k not in volatile}
        if a == b: print(name, 'sin cambios'); return
    except Exception: pass
    p.write_text(new); print(name, len(new), 'bytes')
# (familia, serie, pais, clave de etiqueta en js/perfiles.js)
EUP = [('cerdo', 'e', 'EU', 'cerdo'), ('vacuno', 'young-bulls-ao2', 'EU', 'vacuno'), ('cereales', 'breadmaking-common-wheat-national-average-not-specified', 'EU', 'trigo'),
       ('cereales', 'feed-barley-national-average-not-specified', 'EU', 'cebada'), ('lacteos', 'butter', 'EU', 'mantequilla'), ('lacteos', 'smp', 'EU', 'leche_polvo'), ('huevos', 'cage', 'EU', 'huevos'),
       ('pollo', 'whole-broiler-65-selling-price', 'EU', 'pollo'), ('ovino', 'heavy-lamb', 'EU', 'cordero'), ('fertilizantes', 'n-nitrogen', 'EU', 'nitrogeno'), ('leche', 'raw-milk', 'DE', 'leche'),
       ('aceite', 'extra-virgin-olive-oil-up-to-0-8', 'ES', 'aceite')]
def eu_preview():
    cards = []; fams = {}
    for fam, sid, cc, k in EUP:
        fd = fams.get(fam) or fams.setdefault(fam, json.loads((D / 'eu' / (fam + '.json')).read_text()))  # estricto: la familia debe existir
        se = next((s for s in fd['series'] if s['id'] == sid), None)
        if not se: raise KeyError('eu/%s: serie %s no existe' % (fam, sid))
        r = next((x for x in se['regions'] if x['c'] == cc), None)
        if not r: raise KeyError('eu/%s/%s: region %s no existe' % (fam, sid, cc))
        cards.append({'k': k, 'family': fam, 'series': sid, 'c': cc, 'unit': se['unit'], 'freq': se.get('freq'), 'last': r['last'], 'prev': r.get('prev'), 'yoy': r.get('yoy')})
    return {'schemaVersion': 1, 'generatedAt': now(), 'cards': cards}
def main():
    write('eu-preview.json', eu_preview())
main()
