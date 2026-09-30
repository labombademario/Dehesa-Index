import urllib.request,re,os,json
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,n=8000000):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*','Accept-Language':'en'}),timeout=90) as r:
            return r.status,r.headers.get('content-type'),r.read(n).decode('utf-8','replace')
    except Exception as e: return 'ERR',str(e)[:200],''
def text(h):
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); return re.sub(r'\s+',' ',t)
for slug in ['agricultural-prices','milk-and-milk-product-statistics','animal-slaughtering','agricultural-land-renting-prices','supply-balance-sheets-meat','economic-accounts-agriculture']:
    u='https://statbel.fgov.be/en/themes/agriculture-fishery/'+slug
    s,c,h=get(u); P('####',slug,s,len(h))
    t=text(h); i=t.find('Key figures'); 
    P('TEXT',t[t.find('Agriculture')+0:][900:2400])
    fl=[x for x in dict.fromkeys(re.findall(r'href="([^"]+)"',h)) if re.search(r'\.(xlsx?|csv|zip|ods|txt|json)|bestat|/download|/file|open-data|/sites/default/files',x,re.I)]
    for x in fl[:30]: P('  F',x)
open('data/probe/be10.txt','w').write('\n'.join(out))
