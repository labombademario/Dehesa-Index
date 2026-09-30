import json,re,urllib.request,urllib.parse
def get(u,n=3000000,t=90,h=None):
    try:
        r=urllib.request.Request(u,headers=h or {'User-Agent':'Mozilla/5.0 DehesaIndex'})
        with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf8','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
# CBS catalog
rows=[];u='https://opendata.cbs.nl/ODataCatalog/Tables?$format=json&$select=Identifier,Title,Period,Frequency,Language,Modified,Summary&$filter=Language%20eq%20%27en%27'
for _ in range(20):
    s=get(u)
    try: d=json.loads(s)
    except Exception as e: P('CBS ERR',s[:200]); break
    rows+=d['value']; u=d.get('odata.nextLink')
    if not u: break
P('CBS tables',len(rows))
kw=re.compile(r'milk|dairy|crop|cereal|wheat|barley|potato|livestock|cattle|pigs|slaughter|agricultur|horticult|farm|fertili|manure|price|land use|arable|meat|egg|poultry|export',re.I)
for r in rows:
    if kw.search(r['Title']) and re.search(r'agri|farm|milk|dairy|crop|livestock|cattle|pig|slaught|potato|cereal|fertil|horticult|meat|egg|poultry',r['Title'],re.I):
        P('CBS',r['Identifier'],'|',r['Title'],'|',r.get('Period'),'|',r.get('Frequency'),'|',r.get('Modified','')[:10])
# ABS structures
for df in ['ITGS','MERCH_EXP','ITPI_EXP','CPI']:
    s=get('https://data.api.abs.gov.au/rest/datastructure/ABS/%s?references=codelist'%df,2000000,90,{'Accept':'application/vnd.sdmx.structure+json','User-Agent':'Mozilla/5.0'})
    try:
        d=json.loads(s); P('ABS',df,'dims',[x['id'] for x in d['data']['dataStructures'][0]['dataStructureComponents']['dimensionList']['dimensions']])
        for cl in d['data']['codelists']:
            if re.search(r'commod|sitc|index|measure|freq',cl['id'],re.I):
                its=[(c['id'],c['name']) for c in cl['codes'] if re.search(r'cereal|wheat|barley|meat|cattle|beef|sheep|lamb|dairy|milk|grain|oilseed|canola|rape|fertili|live animals|^0[0-9] |^04|^01|^02|^05',c['name'],re.I)]
                P('  codelist',cl['id'],len(cl['codes']),its[:40])
    except Exception as e: P('ABS',df,'ERR',s[:200])
# FAOSTAT
for u in ['https://bulks-faostat.fao.org/production/Prices_E_All_Data_(Normalized).zip','https://bulks-faostat.fao.org/production/Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip']:
    try:
        r=urllib.request.Request(u,method='HEAD',headers={'User-Agent':'Mozilla/5.0'}); x=urllib.request.urlopen(r,timeout=60); P('FAO',u,x.status,x.headers.get('Content-Length'))
    except Exception as e: P('FAO',u,'ERR',e)
# Eurostat apro for NL exists already in project. CBS sample: milk
open('data/probe/australia3.txt','w').write('\n'.join(out))
