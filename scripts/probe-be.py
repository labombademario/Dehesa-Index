import urllib.request,re,os,json
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=8000000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en'}),timeout=90) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:200],''
s,c,h=get('https://statbel.fgov.be/en/open-data')
P('OPENDATA',s,len(h))
# entradas: enlaces /en/open-data/<slug>
ents=list(dict.fromkeys(re.findall(r'href="(/en/open-data/[^"]+)"',h)))
P('ENTRIES',len(ents))
for u in ents:
    if re.search(r'agri|farm|milk|dairy|slaughter|livestock|cattle|pig|crop|cereal|potato|vegetable|fruit|price|land|rent|holding|fertil|feed|poultry|egg',u,re.I): P('  E',u)
for v in ['e7c2b442-f7ae-45ed-bc55-aa1c17df520c','5624a6f6-69c7-481c-ad3b-b803522f5def','6abd3a15-93c7-4afc-97a4-18a90c0010c9']:
    s,c,h=get('https://bestat.statbel.fgov.be/bestat/api/views/%s/result/CSV'%v); L=h.splitlines(); P('CSV',v[:8],len(L)); 
    for l in L[:4]+['...']+L[-3:]: P('   ',l[:300])
s,c,h=get('https://statbel.fgov.be/en/themes/agriculture-fishery'); P('THEME',s,len(h))
for u in list(dict.fromkeys(re.findall(r'href="(/en/themes/agriculture[^"]+)"',h)))[:60]: P('  T',u)
open('data/probe/be9.txt','w').write('\n'.join(out))
