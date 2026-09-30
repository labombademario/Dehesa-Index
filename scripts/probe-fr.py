import json,time,urllib.request,urllib.parse,re
def get(u,n=2500000):
    last=''
    for i in range(3):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*'})
            with urllib.request.urlopen(r,timeout=90) as x:
                b=x.read(n); ct=x.headers.get('content-type'); 
            try: return b.decode('utf-8-sig'),ct
            except: return b.decode('latin-1'),ct
        except Exception as e: last='ERR %s'%e; time.sleep(5)
    return last,None
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def text(h):
    t=re.sub(r'<script.*?</script>|<style.*?</style>','',h,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); return re.sub(r'\s+',' ',t)
# robots y mentions légales
for u in ['https://visionet.franceagrimer.fr/robots.txt','https://www.franceagrimer.fr/mentions-legales','https://agreste.agriculture.gouv.fr/agreste-web/mentions/mentions/']:
    s,ct=get(u); P('####',u,ct,len(s)); P(text(s)[:2500] if 'robots' not in u else s[:800])
# paginas visionet
pages=['https://visionet.franceagrimer.fr/Pages/SeriesChronologiques.aspx?menuurl=SeriesChronologiques/productions%20vegetales/grandes%20cultures/cotations',
'http://visionet.franceagrimer.fr/Pages/Statistiques.aspx?menuurl=Statistiques%2Fproductions%20animales%2Fviandes%2Fcotations%20en%20format%20csv%2Fgros%20bovins%20vifs',
'https://visionet.franceagrimer.fr/Pages/Statistiques.aspx?menuurl=Statistiques%2Fproductions%20animales%2Fviandes%2Fcotations%20en%20format%20csv%2FZIP%20csv%20toutes%20esp%C3%A8ces']
for u in pages:
    s,ct=get(u); P('####PAGE',u[:110],ct,len(s))
    links=re.findall(r'href=["\']([^"\']+\.(?:xlsx|xls|csv|zip)[^"\']*)["\']',s,flags=re.I)+re.findall(r'(OpenDocument\.aspx\?fileurl=[^"\'&]+)',s)
    for l in list(dict.fromkeys(links))[:30]: P(' LINK',l[:260])
    P(' TEXT',text(s)[:600])
# detalles datasets extra
A='https://www.data.gouv.fr/api/1/datasets/'
for slug in ['series-chronologiques-cotations-viandes-bovins-veaux-ovins-equides-porcs-caprins','cotations-des-porcs-charcutiers-1','cotations-gros-bovins-entree-abattoir','cotations-nationales-gros-bovins-entree-abattoir','cotations-regionales-et-nationales-des-ovins-de-boucherie','historique-des-prix-mensuels-moyens-payes-aux-producteurs-depuis-juillet-2005-cereales']:
    j,_=get(A+slug+'/')
    try:
        d=json.loads(j); P('##',slug,'|',d.get('license'),'|',json.dumps(d.get('temporal_coverage')),'|',d.get('frequency'),'|',d.get('last_modified'))
        P(' desc',(d.get('description') or '')[:300].replace('\n',' '))
        for r in d.get('resources',[])[:12]: P('  RES',r.get('title'),'|',r.get('format'),'|',r.get('filesize'),'|',r.get('url')[:230])
    except Exception as e: P('ERR',slug,j[:150])
open('data/probe/fr2.txt','w').write('\n'.join(out))
