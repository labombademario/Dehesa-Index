import time,urllib.request,urllib.parse,re,http.cookiejar
cj=http.cookiejar.CookieJar()
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
def get(u,n=3000000,raw=False):
    last=''
    for i in range(3):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) DehesaIndex','Accept':'text/html,*/*','Accept-Language':'fr,en'})
            with op.open(r,timeout=90) as x:
                b=x.read(n); ct=x.headers.get('content-type')
            if raw: return b,ct,x.geturl()
            try: return b.decode('utf-8-sig'),ct,x.geturl()
            except: return b.decode('latin-1'),ct,x.geturl()
        except Exception as e: last='ERR %s'%e; time.sleep(5)
    return last,None,None
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def text(h):
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); return re.sub(r'\s+',' ',t)
s,ct,_=get('https://www.franceagrimer.fr/mentions-legales'); t=text(s)
for m in re.finditer(r'(Licence Ouverte|réutilis|Réutilis)',t): pass
i=t.find('éutilisation'); P('#### MENTIONS',len(t))
for m in list(re.finditer(r'(?i)licence ouverte|réutilisation des (données|contenus)',t))[:4]: P(' ...',t[max(0,m.start()-300):m.start()+900]); 
s,ct,_=get('https://agreste.agriculture.gouv.fr/agreste-web/mentions/mentions/'); P('#### AGRESTE',ct,len(s)); P(text(s)[:1500])
pages=['https://visionet.franceagrimer.fr/Pages/SeriesChronologiques.aspx?menuurl=SeriesChronologiques/productions%20vegetales/grandes%20cultures/cotations',
'https://visionet.franceagrimer.fr/Pages/SeriesChronologiques.aspx?menuurl=SeriesChronologiques/productions%20vegetales/grandes%20cultures/prix%20pay%C3%A9s%20aux%20producteurs',
'https://visionet.franceagrimer.fr/Pages/SeriesChronologiques.aspx?menuurl=SeriesChronologiques/productions%20animales/viandes/gros%20bovins%20entr%C3%A9e%20abattoir',
'https://visionet.franceagrimer.fr/Pages/SeriesChronologiques.aspx?menuurl=SeriesChronologiques%2Fproductions%20animales%2Fviandes%2Fs%C3%A9ries%20hebdomadaires%2Fsynth%C3%A8se%20toutes%20esp%C3%A8ces',
'https://visionet.franceagrimer.fr/Pages/Statistiques.aspx?menuurl=Statistiques%2Fproductions%20animales%2Fviandes%2Fcotations%20en%20format%20csv%2Fporcs%20charcutiers']
for u in pages:
    s,ct,fu=get(u); P('####PAGE',u[60:200],'|',ct,len(s),'|',(fu or '')[:120])
    if len(s)<300: P(s); continue
    links=re.findall(r'href=["\']([^"\']*(?:OpenDocument|\.xlsx|\.xls|\.csv|\.zip)[^"\']*)["\']',s,flags=re.I)
    for l in list(dict.fromkeys(links))[:40]: P(' LINK',urllib.parse.unquote(l)[:300])
    P(' TEXT',text(s)[:500])
open('data/probe/fr3.txt','w').write('\n'.join(out))
