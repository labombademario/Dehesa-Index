import urllib.request,re,os,json
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=3000000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en,nl'}),timeout=60) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:150],''
B='https://landbouwcijfers.vlaanderen.be'
s,c,h=get(B+'/marktinformatie')
i=h.find('Actuele prijzen'); P('RAW',h[i:i+6000])
for m in re.finditer(r'<(a|div|li|tr)[^>]*(href|data-[a-z-]+)="[^"]*"[^>]*>',h[i:i+60000]): pass
P('DRUPALSETTINGS',re.findall(r'drupalSettings">(.*?)</script>',h,flags=re.S)[:1][0][:1500] if re.findall(r'drupalSettings">(.*?)</script>',h,flags=re.S) else 'none')
hrefs=[x for x in re.findall(r'href="([^"]+)"',h[i:]) if not x.startswith(('/sites','/themes','/core'))]
P('HREFS after',hrefs[:60])
for q in ['?sector=varkens','?search_api_fulltext=varken','?field_sector=varkens']:
    s2,c2,h2=get(B+'/marktinformatie'+q); P(q,s2,len(h2))
open('data/probe/be4.txt','w').write('\n'.join(out))
