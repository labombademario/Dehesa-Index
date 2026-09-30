import urllib.request,re,os,json,collections
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=3000000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en,nl'}),timeout=60) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:150],''
B='https://landbouwcijfers.vlaanderen.be'
def links(h):
    return list(dict.fromkeys(m.group(1).replace('&amp;','&') for m in re.finditer(r'href="([^"#]+)"',h)))
def text(h):
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); return re.sub(r'\s+',' ',t)
s,c,h=get(B+'/disclaimer'); t=text(h); i=t.find('Modellicentie'); P('DISCLAIMER',t[max(0,i-900):i+1500])
seen={}; queue=['/data','/marktinformatie']
paths=set()
while queue and len(seen)<90:
    p=queue.pop(0)
    if p in seen: continue
    s,c,h=get(B+p); seen[p]=(s,len(h))
    if s=='ERR': continue
    for l in links(h):
        if l.startswith(B): l=l[len(B):]
        if not l.startswith('/') or l.startswith(('/sites','/themes','/core','/search','/node','/user')): continue
        if re.match(r'^/(marktinformatie|landbouw|keten|data)(/|$)',l) and l not in seen and l not in queue and l.count('/')<=3: queue.append(l)
P('CRAWLED',len(seen))
for p,(s,n) in seen.items():
    P(' PAGE',p,s,n)
# paginas con descarga
for p in list(seen)[:60]:
    s,c,h=get(B+p)
    dl=[l for l in links(h) if re.search(r'download|\.xlsx|\.csv|\.json|\.ods|/api|export|\.zip',l,re.I) and not re.search(r'\.(css|js|png|svg|ico)',l)]
    if dl: P('DL',p,dl[:8])
open('data/probe/be2.txt','w').write('\n'.join(out))
# be.STAT views
s,c,h=get('https://bestat.statbel.fgov.be/bestat/api/views',8000000)
try:
    V=json.loads(h); P('VIEWS',len(V))
    for v in V:
        n=v.get('name','')
        if v.get('locale')=='en' and re.search(r'agricult|milk|pig|cattle|cereal|potato|farm|crop|livestock|slaughter|dairy|fertili|feed',n,re.I): P('  V',v['id'],'|',n,'|',v.get('dataSourceId'))
except Exception as e: P('ERR',e,h[:200])
open('data/probe/be2.txt','w').write('\n'.join(out))
