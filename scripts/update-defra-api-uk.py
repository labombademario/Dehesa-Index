#!/usr/bin/env python3
"""Índices de precios agrarios del Reino Unido (Defra, Open Government Licence v3.0), base 2020=100, mensuales.
Fuente: https://www.gov.uk/government/statistics/agricultural-price-indices  (CSV: type,category,date,index)
Son ÍNDICES, no precios: no se convierten a £/t ni se enseñan como precio en las tarjetas; alimentan la capa de
datos (inteligencia, alertas) igual que los índices de Eurostat. La fecha de publicación es la de la página oficial.
No inventa nada: si falta una serie o el CSV no cuadra, termina con error sin tocar ningún archivo."""
import csv,io,json,re,urllib.request
from datetime import datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; SNAP=ROOT/'data'/'snapshots'
SERIES=[  # (producto, tipo, categoría del CSV, descripción)
 ('defra_wheat_output_index','output','wheat','trigo'),
 ('defra_barley_output_index','output','barley','cebada'),
 ('defra_oilseed_rape_output_index','output','oilseed_rape','colza'),
 ('defra_cattle_output_index','output','cattle_and_calves','ganado vacuno y terneros'),
 ('defra_pigs_output_index','output','pigs','cerdos'),
 ('defra_sheep_output_index','output','sheep_and_lambs','ovino y corderos'),
 ('defra_eggs_output_index','output','eggs','huevos'),
 ('defra_milk_output_index','output','milk','leche'),
 ('defra_fertiliser_input_index','input','fertilisers_and_soil_improvers','fertilizantes y enmiendas'),
 ('defra_feed_input_index','input','animal_feedingstuffs','piensos'),
 ('defra_energy_input_index','input','energy_and_lubricants','energía y lubricantes'),
]
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Dehesa-Index-data-bot/1.0'}),timeout=90).read()
api=json.loads(get('https://www.gov.uk/api/content/government/statistics/agricultural-price-indices'))
links=sorted(set(re.findall(r'https://assets\.publishing\.service\.gov\.uk/[^"\\ ]+\.csv',json.dumps(api))))
if not links: raise RuntimeError('Defra API: no se encontró el CSV')
pub=str(api.get('public_updated_at') or '')[:10]
if not re.match(r'^\d{4}-\d{2}-\d{2}$',pub): raise RuntimeError('Defra API: fecha de publicación no válida: '+pub)
rows=list(csv.DictReader(io.StringIO(get(links[-1]).decode('utf-8','replace'))))
now=datetime.utcnow(); obs=[]
for pid,typ,cat,label in SERIES:
    pts={}
    for r in rows:
        if r.get('type')!=typ or r.get('category')!=cat: continue
        m=re.match(r'^(\d{4})-(\d{2})-\d{2}$',r.get('date','')); 
        try: v=float(r['index'])
        except (TypeError,ValueError,KeyError): continue
        if m: pts[m.group(1)+'-'+m.group(2)]=round(v,2)
    pts=sorted(pts.items())
    if len(pts)<24: raise RuntimeError('Defra API: serie insuficiente para %s: %d'%(cat,len(pts)))
    (d,v)=pts[-1]
    obs.append({'id':'di_'+pid,'product':pid,'region':'uk','sourceId':'defra','observationDate':d,'publicationDate':pub,'value':v,'currency':'INDEX','unit':'index_2020_100','frequency':'monthly','status':'verified','verifiedAt':now.isoformat()+'Z','comparability':'directional',
     'methodology':'Defra (Open Government Licence v3.0): Agricultural Price Index del Reino Unido (%s, %s), base 2020=100. Es un índice de precios, no un precio en libras.'%(label,'precios percibidos' if typ=='output' else 'precios pagados'),
     'changePct':round((v/pts[-2][1]-1)*100,4),'history':[{'period':x[5:],'year':int(x[:4]),'value':y} for x,y in pts[-60:]]})
SNAP.mkdir(parents=True,exist_ok=True); f=SNAP/(now.date().isoformat()+'.json')
doc=json.loads(f.read_text()) if f.exists() else {'schemaVersion':'1.0','generatedAt':now.isoformat()+'Z','observations':[]}
ids={o['id'] for o in obs}
doc['observations']=[o for o in doc['observations'] if o.get('id') not in ids]+obs
f.write_text(json.dumps(doc,indent=2)+'\n')
print('Defra API UK: %d series, ultimo %s, publicado %s'%(len(obs),obs[0]['observationDate'],pub))
