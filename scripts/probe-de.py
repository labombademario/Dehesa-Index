import urllib.request,urllib.parse,json,io,re,time
import openpyxl
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,data=None,raw=False,hdr=None):
    try:
        d=urllib.parse.urlencode(data).encode() if data else None
        h={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*'}; h.update(hdr or {})
        with urllib.request.urlopen(urllib.request.Request(u,data=d,headers=h),timeout=90) as r: b=r.read(3000000)
        return b if raw else b.decode('utf-8','replace')
    except Exception as e: return b'ERR %s'%str(e).encode() if raw else 'ERR %s'%e
# --- Francia mensual
P('#### FR monthly')
try:
    g=json.loads(get('https://www.data.gouv.fr/api/1/datasets/historique-des-prix-mensuels-moyens-payes-aux-producteurs-depuis-juillet-2005-cereales/'))
    P(g.get('license'),g.get('temporal_coverage'))
    for r in g['resources']: P(' RES',r['title'][:80],r['format'],r['url'])
    for r in g['resources'][:2]:
        b=get(r['url'],raw=True); P('DL',len(b),b[:4])
        if b[:2]==b'PK':
            wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True,read_only=True)
            for ws in wb.worksheets:
                P(' SHEET',ws.title)
                for k,row in enumerate(ws.iter_rows(values_only=True)):
                    if k>=16: break
                    c=[x for x in row if x is not None]
                    if c: P('   ',[(round(x,1) if isinstance(x,float) else x) for x in c][:12])
except Exception as e: P('ERR',e)
# --- Alemania
P('#### DE genesis')
for u in ['https://www-genesis.destatis.de/genesisWS/rest/2020/helloworld/logincheck?username=GAST&password=GAST',
          'https://www-genesis.destatis.de/genesisWS/rest/2020/helloworld/whoami',
          'https://www-genesis.destatis.de/genesisWS/rest/2020/data/tablefile?username=GAST&password=GAST&name=61211-0003&area=all&format=ffcsv&language=en']:
    r=get(u); P(u[:110],'->',len(r),r[:700].replace('\n','|'))
r=get('https://www-genesis.destatis.de/genesisWS/rest/2020/data/tablefile',data=dict(username='GAST',password='GAST',name='61211-0003',area='all',format='ffcsv',language='en'))
P('POST tablefile',len(r),r[:1500].replace('\n','|'))
P('#### DE govdata')
for q in ['Kuhmilchpreise','Schlachtpreise','Erzeugerpreisindizes landwirtschaftlicher Produkte','Obst Gemüse Markt- und Preisbericht']:
    r=get('https://www.govdata.de/ckan/api/3/action/package_search?rows=6&q='+urllib.parse.quote(q))
    try:
        j=json.loads(r)
        for d in j['result']['results']:
            P(' DS',q,'|',d['name'],'|',d.get('license_id'),'|',d.get('organization',{}).get('title') if d.get('organization') else None)
            for x in d.get('resources',[])[:8]: P('    RES',x.get('format'),x.get('name','')[:60],x.get('url'))
    except Exception as e: P(' ERR',q,r[:200])
open('data/probe/de1.txt','w').write('\n'.join(out))
