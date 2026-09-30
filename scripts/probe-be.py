import urllib.request,re,os,json
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=8000000,data=None,hdr=None):
    try:
        h={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en,nl'}; h.update(hdr or {})
        with urllib.request.urlopen(urllib.request.Request(u,data=data,headers=h),timeout=90) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:200],''
B='https://landbouwcijfers.vlaanderen.be'
s,c,h=get(B+'/data')
t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t)
i=t.find('Data'); P('DATA PAGE',t[600:2600])
P('DATA LINKS',[x for x in re.findall(r'href="([^"]+)"',h) if not x.startswith(('/sites','/themes','/core'))][14:60])
s,c,h=get('https://bestat.statbel.fgov.be/bestat/api/views')
V=json.loads(h)
P('VIEWS en matching')
for v in V:
    n=v.get('name','')
    if v.get('locale')=='en' and re.search(r'agri|farm|price|output|input|rent|land|cattle|pig|milk|slaughter|potato|cereal|crop|livestock|dairy|vegetable|fruit|egg|poultry',n,re.I) and not re.search(r'consumer|house|real estate|building|energy price|wage|HICP',n,re.I): P('  V',v['id'],'|',n)
# probar una vista
vid='e7c2b442-f7ae-45ed-bc55-aa1c17df520c'
for u in ['https://bestat.statbel.fgov.be/bestat/api/views/%s'%vid,'https://bestat.statbel.fgov.be/bestat/api/views/%s/result/CSV'%vid,'https://bestat.statbel.fgov.be/bestat/api/views/%s/result/JSON'%vid]:
    s,c,h=get(u,300000); P('API',u[-70:],s,c,len(h)); P('   ',h[:700].replace('\n','|'))
open('data/probe/be8.txt','w').write('\n'.join(out))
