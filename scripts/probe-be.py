import urllib.request,re,os,json
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=3000000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en,nl'}),timeout=60) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:150],''
B='https://landbouwcijfers.vlaanderen.be'
def text(h):
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); return re.sub(r'\s+',' ',t)
s,c,h=get(B+'/marktinformatie?indicators_sector=310')
P('LEN',s,len(h),'views-row count',h.count('views-row'))
j=h.find('view-content'); P('RAW',h[j:j+3500] if j>0 else 'no view-content')
hrefs=[x for x in re.findall(r'href="([^"]+)"',h) if not x.startswith(('/sites','/themes','/core'))]
P('HREFS',hrefs[15:80])
open('data/probe/be5.txt','w').write('\n'.join(out))
