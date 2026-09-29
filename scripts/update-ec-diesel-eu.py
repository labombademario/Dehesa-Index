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
# Locate EU-27 diesel series and its date/value columns heuristically.
header=None
for i,row in enumerate(rows[:40]):
    txt=' | '.join(str(x or '') for x in row)
    if 'EU-27' in txt and 'Diesel' in txt:
        header=i; break
if header is None: raise RuntimeError('EC Oil Bulletin EU-27 diesel header not found')
hdr=[str(x or '').strip() for x in rows[header]]
date_col=next((i for i,x in enumerate(hdr) if re.search(r'date|week',x,re.I)),0)
diesel_col=next((i for i,x in enumerate(hdr) if re.search(r'diesel',x,re.I) and re.search(r'eu.?27',x,re.I)),None)
if diesel_col is None:
    # Search same column across first 12 rows for EU-27 Diesel
    for c in range(len(hdr)):
        coltxt=' '.join(str(rows[r][c] or '') for r in range(max(0,header-3),min(len(rows),header+2)))
        if 'Diesel' in coltxt and 'EU-27' in coltxt: diesel_col=c; break
if diesel_col is None: raise RuntimeError('EC Oil Bulletin diesel column not found')
points=[]
for row in rows[header+1:]:
    if date_col>=len(row) or diesel_col>=len(row): continue
    d=row[date_col]; v=row[diesel_col]
    if isinstance(d,datetime): ds=d.date().isoformat()
    else:
        m=re.search(r'(20\d{2})[-/](\d{2})[-/](\d{2})',str(d or '')); ds=f'{m.group(1)}-{m.group(2)}-{m.group(3)}' if m else None
    if ds:
        try: val=float(str(v).replace(',','.')); points.append((ds,val))
        except: pass
points=sorted({d:v for d,v in points}.items())
if len(points)<20: raise RuntimeError('EC Oil Bulletin returned insufficient EU-27 diesel history: '+str(len(points)))
latest=points[-1]; prev=points[-2]; change=round((latest[1]/prev[1]-1)*100,4) if prev[1] else None
obs={'id':'di_diesel_eu','product':'diesel','region':'eu','sourceId':'eu_oil_bulletin','observationDate':latest[0],'publicationDate':latest[0],'status':'verified','verifiedAt':datetime.utcnow().isoformat(timespec='seconds')+'Z','comparability':'directional','value':latest[1],'currency':'EUR','unit':'litro','frequency':'weekly','changePct':change,'history':[{'period':d[5:],'year':int(d[:4]),'value':v} for d,v in points[-104:]]}
SNAP.mkdir(parents=True,exist_ok=True); f=SNAP/(datetime.utcnow().date().isoformat()+'.json'); doc=json.loads(f.read_text()) if f.exists() else {'schemaVersion':'1.0','generatedAt':datetime.utcnow().isoformat()+'Z','observations':[]}; doc['observations']=[o for o in doc['observations'] if not(o.get('product')=='diesel' and o.get('region')=='eu')]+[obs]; f.write_text(json.dumps(doc,indent=2)+'\n'); tmp.unlink(missing_ok=True); print('EC diesel EU:',latest)
