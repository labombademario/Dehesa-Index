import urllib.request,re,os,traceback
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=400000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en,nl'}),timeout=60) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:150],''
def links(h,pat=None):
    L=[]
    for m in re.finditer(r'href="([^"#]+)"',h):
        u=m.group(1)
        if pat is None or re.search(pat,u,re.I): L.append(u)
    return list(dict.fromkeys(L))
for u in ['https://landbouwcijfers.vlaanderen.be/','https://landbouwcijfers.vlaanderen.be/open-data','https://landbouwcijfers.vlaanderen.be/landbouw/prijzen','https://landbouwcijfers.vlaanderen.be/disclaimer','https://statbel.fgov.be/en/open-data','https://bestat.statbel.fgov.be/bestat/api/views','https://statbel.fgov.be/en/themes/agriculture-fisheries']:
    s,c,h=get(u); P('####',u,s,c,len(h))
    if s!='ERR':
        t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t); P('TEXT',t[:600])
        for l in links(h)[:70]: P('  L',l)
os.makedirs('data/probe',exist_ok=True); open('data/probe/be1.txt','w').write('\n'.join(out))
