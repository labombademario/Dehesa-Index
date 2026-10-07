#!/usr/bin/env python3
import json,re,urllib.request
from datetime import datetime
from pathlib import Path
from openpyxl import load_workbook
ROOT=Path(__file__).resolve().parents[1]; SNAP=ROOT/'data'/'snapshots'
URL='https://energy.ec.europa.eu/document/download/906e60ca-8b6a-44e7-8589-652854d2fd3f_en?filename=Weekly_Oil_Bulletin_Prices_History_maticni_4web.xlsx'
req=urllib.request.Request(URL,headers={'User-Agent':'Dehesa-Index-data-bot/1.0'})
with urllib.request.urlopen(req,timeout=90) as r: raw=r.read()
tmp=ROOT/'.ec-oil.xlsx'; tmp.write_bytes(raw); wb=load_workbook(tmp,read_only=True,data_only=True)
ws=wb[wb.sheetnames[0]]; rows=list(ws.iter_rows(values_only=True))
# Hoja "Prices with taxes": fila 0 = nombres de columna (EU_price_with_tax_diesel...),
# columna 0 = fecha, columna 1 = código de país ('EU_' = media ponderada UE).
ws=wb['Prices with taxes'] if 'Prices with taxes' in wb.sheetnames else wb[wb.sheetnames[0]]
rows=list(ws.iter_rows(values_only=True))
hdr=[str(x or '').strip().lower() for x in rows[0]]
diesel_col=next((i for i,x in enumerate(hdr) if 'diesel' in x and 'with_tax' in x),None)
if diesel_col is None: raise RuntimeError('EC Oil Bulletin: columna de diesel con impuestos no encontrada: '+str(hdr[:8]))
points=[]
for row in rows[3:]:
    if len(row)<=diesel_col: continue
    d=row[0]; ctr=str(row[1] or '').strip()
    if not ctr.startswith('EU'): continue
    if not isinstance(d,datetime): continue
    try: v=float(row[diesel_col])/1000.0  # EUR/1000 l -> EUR/litro
    except (TypeError,ValueError): continue
    points.append((d.date().isoformat(),v))
points=sorted({d:v for d,v in points}.items())
if len(points)<20: raise RuntimeError('EC Oil Bulletin returned insufficient EU-27 diesel history: '+str(len(points)))
latest=points[-1]; prev=points[-2]; change=round((latest[1]/prev[1]-1)*100,4) if prev[1] else None
obs={'id':'di_diesel_eu','product':'diesel','region':'eu','sourceId':'eu_oil_bulletin','observationDate':latest[0],'publicationDate':None,'status':'verified','verifiedAt':datetime.utcnow().isoformat()+'Z','methodology':'Weighted EU average for automotive gas oil, consumer price with taxes. The source expresses it in EUR/1,000 litres; value retained at source precision after division by 1,000.','comparability':'directional','value':latest[1],'currency':'EUR','unit':'litro','frequency':'weekly','changePct':change,'history':[{'period':d[5:],'year':int(d[:4]),'value':v} for d,v in points[-1200:]]}
SNAP.mkdir(parents=True,exist_ok=True); f=SNAP/(datetime.utcnow().date().isoformat()+'.json'); doc=json.loads(f.read_text()) if f.exists() else {'schemaVersion':'1.0','generatedAt':datetime.utcnow().isoformat()+'Z','observations':[]}; prev_obs=next((o for o in doc['observations'] if o.get('product')=='diesel' and o.get('region')=='eu' and o.get('observationDate')==obs['observationDate']),None)
if prev_obs and prev_obs.get('publicationDate'): obs['publicationDate']=prev_obs['publicationDate']  # fecha de publicación ya verificada
if not obs['publicationDate']:
    # 1) reutiliza la fecha de publicación ya registrada para esta misma observación
    try:
        for o in json.loads((ROOT/'data'/'latest.json').read_text())['observations']:
            if o.get('id')==obs['id'] and o.get('observationDate')==obs['observationDate'] and o.get('publicationDate'): obs['publicationDate']=o['publicationDate']
    except Exception: pass
if not obs['publicationDate']:
    # 1b) cualquier snapshot anterior con la misma observación y fecha de publicación
    for sf in sorted(SNAP.glob('*.json')):
        try:
            for o in json.loads(sf.read_text())['observations']:
                if o.get('id')==obs['id'] and o.get('observationDate')==obs['observationDate'] and o.get('publicationDate'): obs['publicationDate']=o['publicationDate']
        except Exception: pass
if not obs['publicationDate']:
    # 2) el boletín no expone fecha de publicación: se registra el día en que se recuperó por primera vez
    obs['publicationDate']=datetime.utcnow().date().isoformat()
doc['observations']=[o for o in doc['observations'] if not(o.get('product')=='diesel' and o.get('region')=='eu')]+[obs]; f.write_text(json.dumps(doc,indent=2)+'\n'); tmp.unlink(missing_ok=True); print('EC diesel EU:',latest)

# --- Paises: gasoleo automocion con impuestos (EUR/litro) por pais miembro, misma hoja y misma fuente (Boletin Semanal del Petroleo de la CE). ---
# Las filas por pais se publican como columnas XX_price_with_tax_diesel; el valor oficial es EUR/1000 l. Sin interpolar ni estimar: si falta un pais, no se escribe.
CTRS = {'DE': 'euAlemania', 'FR': 'euFrancia', 'ES': 'euEspana', 'IT': 'euItalia'}
ccols = {c: next((i for i, x in enumerate(hdr) if x == c.lower() + '_price_with_tax_diesel'), None) for c in CTRS}
out = {}
for c, i in ccols.items():
    if i is None: print('EC diesel pais', c, 'columna no encontrada'); continue
    pts = {}
    for row in rows[3:]:
        if len(row) <= i or not isinstance(row[0], datetime) or not str(row[1] or '').startswith('EU'): continue
        try: v = float(row[i]) / 1000.0
        except (TypeError, ValueError): continue
        if v > 0: pts[row[0].date().isoformat()] = round(v, 5)
    pts = sorted(pts.items())
    if len(pts) < 100: print('EC diesel pais', c, 'pocos puntos', len(pts)); continue
    last, prv = pts[-1], pts[-2]
    out[c] = {'key': CTRS[c], 'observationDate': last[0], 'price': last[1], 'changePct': round((last[1] / prv[1] - 1) * 100, 4), 'points': [[d, v] for d, v in pts[-260:]]}
if out:
    (ROOT / 'data' / 'diesel-eu-countries.json').write_text(json.dumps({'schemaVersion': 1, 'generatedAt': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'sourceId': 'eu_oil_bulletin', 'unit': 'EUR/l',
        'note': 'Gasoleo automocion con impuestos, precio medio ponderado comunicado por cada Estado miembro (Boletin Semanal del Petroleo, Comision Europea). Las comparaciones entre paises tienen validez limitada por diferencias de calidad, comercializacion y estructura de mercado.',
        'countries': out}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print('EC diesel paises:', {c: (v['observationDate'], v['price']) for c, v in out.items()})
