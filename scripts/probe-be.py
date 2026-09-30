import urllib.request,re,os,json
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=3000000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en,nl'}),timeout=60) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:150],''
B='https://landbouwcijfers.vlaanderen.be'
s,c,h=get(B+'/marktinformatie/prijzen-van-varkens')
for m in re.finditer(r'Download data',h):
    P('CTX',h[max(0,m.start()-700):m.end()+100].replace('\n',' ')); P('---')
for m in re.finditer(r'<(?:canvas|div)[^>]+(?:data-chart|data-url|data-src|data-json|data-csv|chart)[^>]*>',h): P('CHART',m.group(0)[:400])
for m in re.finditer(r'https?://[^"\' ]+\.(?:csv|xlsx|json)',h): P('FILE',m.group(0))
open('data/probe/be7.txt','w').write('\n'.join(out))
