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
first={}
for name,sid in [('varkens',310),('zuivel',306),('granen',295),('aardappelen',292),('rundvee',543),('pluimvee',316),('groenten',331),('fruit',334),('meststoffen',735)]:
    allp=[]
    for pg in range(0,6):
        s,c,h=get(B+'/marktinformatie?indicators_sector=%d&page=%d'%(sid,pg))
        L=[(m.group(1),re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',m.group(2))).strip()) for m in re.finditer(r'<a href="(/marktinformatie/[^"]+)"[^>]*>(.*?)</a>',h,flags=re.S)]
        L=[x for x in L if 'veldproeven' not in x[0]]
        new=[x for x in L if x not in allp]
        if not new: break
        allp+=new
    P('####',name,sid,len(allp))
    for u,t in allp: P('  ',u,'|',t[:90])
    if allp: first[name]=allp[0][0]
for name,u in list(first.items())[:3]:
    s,c,h=get(B+u); P('#### PAGE',u,s,len(h)); P('TEXT',text(h)[600:1800])
    P('DL',[x for x in re.findall(r'(?:href|src|data-[a-z-]*url)="([^"]+)"',h) if re.search(r'download|\.csv|\.xls|\.json|api|export|chart|data',x,re.I) and not re.search(r'\.(css|js|png|svg)',x)][:15])
    st=re.findall(r'drupalSettings">(.*?)</script>',h,flags=re.S)
    P('SETTINGS',(st[0][:1500] if st else 'none'))
open('data/probe/be5.txt','w').write('\n'.join(out))
