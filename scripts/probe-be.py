import urllib.request,re,os,json
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=3000000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en,nl'}),timeout=60) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:150],''
B='https://landbouwcijfers.vlaanderen.be'
def links(h): return list(dict.fromkeys(m.group(1).replace('&amp;','&') for m in re.finditer(r'href="([^"#]+)"',h)))
def text(h):
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); return re.sub(r'\s+',' ',t)
for p in ['/marktinformatie/varkens','/marktinformatie/zuivel','/marktinformatie/granen','/marktinformatie/aardappelen']:
    s,c,h=get(B+p); P('####',p,s,len(h)); P('TEXT',text(h)[700:2500])
    for l in links(h):
        if l.startswith(B): l=l[len(B):]
        if not l.startswith(('/sites','/themes','/core','/search')) and (l.startswith('/') or 'download' in l): P('  L',l)
open('data/probe/be3.txt','w').write('\n'.join(out))
