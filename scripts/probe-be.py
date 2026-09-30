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
allp={}
for name,sid in [('varkens',310),('zuivel',306),('granen',295),('aardappelen',292),('rundvee',543),('pluimvee',316),('groenten',331),('fruit',334),('meststoffen',735),('eieren',319),('kleine herkauwers',322),('suiker',289),('oliehoudende',740)]:
    for pg in range(0,6):
        s,c,h=get(B+'/marktinformatie?indicators_sector=%d&page=%d'%(sid,pg))
        L=re.findall(r'<a class="link-wrapper" href="(/marktinformatie/[^"]+)" aria-label="([^"]+)"',h)
        new=[x for x in L if x[0] not in allp]
        for u,t in new: allp[u]=(name,t)
        if not new: break
P('INDICATORS',len(allp))
for u,(n,t) in allp.items(): P('  ',n,'|',u,'|',t)
for u in ['/marktinformatie/prijzen-van-varkens','/marktinformatie/prijzen-van-biggen']:
    s,c,h=get(B+u); P('#### PAGE',u,s,len(h)); P('TEXT',text(h)[500:2500])
    P('ATTRS',[x for x in re.findall(r'(?:href|src|data-[a-z-]+)="([^"]+)"',h) if re.search(r'download|\.csv|\.xls|\.json|api|export|chart|media',x,re.I) and not re.search(r'\.(css|js|png|svg|ico|woff)',x)][:20])
    st=re.findall(r'drupalSettings">(.*?)</script>',h,flags=re.S); P('SETTINGS',(st[0][:2500] if st else 'none'))
    P('IFRAME',re.findall(r'<iframe[^>]+>',h)[:3]); P('TABLES',h.count('<table'))
open('data/probe/be6.txt','w').write('\n'.join(out))
