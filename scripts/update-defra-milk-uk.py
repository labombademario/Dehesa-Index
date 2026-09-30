#!/usr/bin/env python3
"""Leche del Reino Unido (precio medio en granja) desde Defra, Open Government Licence v3.0.
Fuente: https://www.gov.uk/government/statistics/uk-milk-prices-and-composition-of-milk
Hoja Prices_Monthly: peniques por litro. Se convierte a GBP por 100 kg con densidad 1,03 kg/l
(estándar de la leche de vaca) para que encaje con la unidad de la ficha (igual que la leche de la UE).
La fecha de publicación es la de la última actualización de la página oficial (public_updated_at).
No inventa nada: si algo no cuadra termina con error sin tocar ningún archivo."""
import json,re,urllib.request,sys
from datetime import datetime
from pathlib import Path
import pandas as pd
ROOT=Path(__file__).resolve().parents[1]; SNAP=ROOT/'data'/'snapshots'
DENSITY=1.03
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Dehesa-Index-data-bot/1.0'}),timeout=90).read()
api=json.loads(get('https://www.gov.uk/api/content/government/statistics/uk-milk-prices-and-composition-of-milk'))
links=sorted(set(re.findall(r'https://assets\.publishing\.service\.gov\.uk/[^"\\ ]+\.ods',json.dumps(api))))
if not links: raise RuntimeError('Defra: no se encontró el enlace .ods')
pub=str(api.get('public_updated_at') or '')[:10]
if not re.match(r'^\d{4}-\d{2}-\d{2}$',pub): raise RuntimeError('Defra: fecha de publicación no válida: '+pub)
tmp=ROOT/'.defra-milk.ods'; tmp.write_bytes(get(links[-1]))
df=pd.read_excel(tmp,engine='odf',sheet_name='Prices_Monthly',header=None); tmp.unlink(missing_ok=True)
pts=[]
for _,r in df.iterrows():
    d=r.iloc[0]
    if not isinstance(d,(datetime,pd.Timestamp)): continue
    try: p=float(r.iloc[1])
    except (TypeError,ValueError): continue
    if p!=p: continue
    pts.append((d.strftime('%Y-%m'),round(p/DENSITY,2)))  # p/litro -> GBP/100kg = (p/100)/1.03*100
pts=sorted(dict(pts).items())
if len(pts)<24: raise RuntimeError('Defra: serie insuficiente: %d'%len(pts))
latest=pts[-1]; prev=pts[-2]; change=round((latest[1]/prev[1]-1)*100,4)
now=datetime.utcnow()
obs={'id':'di_lacteos_leche_uk','product':'leche','region':'uk','sourceId':'defra','observationDate':latest[0],'publicationDate':pub,'status':'verified','verifiedAt':now.isoformat()+'Z',
 'methodology':'Defra (Open Government Licence v3.0): precio medio en granja de la leche en el Reino Unido, hoja Prices_Monthly, en peniques por litro; se expresa en GBP/100 kg con una densidad de 1,03 kg/l (estándar de la leche de vaca).',
 'comparability':'directional','value':latest[1],'currency':'GBP','unit':'100kg','frequency':'monthly','changePct':change,
 'history':[{'period':d[5:],'year':int(d[:4]),'value':v} for d,v in pts[-24:]]}
SNAP.mkdir(parents=True,exist_ok=True); f=SNAP/(now.date().isoformat()+'.json')
doc=json.loads(f.read_text()) if f.exists() else {'schemaVersion':'1.0','generatedAt':now.isoformat()+'Z','observations':[]}
doc['observations']=[o for o in doc['observations'] if not(o.get('product')=='leche' and o.get('region')=='uk')]+[obs]
f.write_text(json.dumps(doc,indent=2)+'\n')
print('Defra leche UK:',latest,'publicado',pub)
