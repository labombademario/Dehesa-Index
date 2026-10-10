import json, urllib.request, urllib.parse, os, re, time
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ch.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s); S.write(s+'\n'); S.flush()
UA={'User-Agent':'DehesaIndex-research/1.0 (+https://dehesaindex.com)'}
def get(u,t=150,data=None,hdr=None):
    try:
        h=dict(UA); h.update(hdr or {})
        with urllib.request.urlopen(urllib.request.Request(u,data=data,headers=h),timeout=t) as r: return r.status,r.read()
    except urllib.error.HTTPError as e: return e.code,e.read()[:2000]
    except Exception as e: return 0,repr(e).encode()[:300]
def sparql(q):
    st,b=get('https://lindas.admin.ch/query',t=170,data=urllib.parse.urlencode({'query':q}).encode(),hdr={'Accept':'application/sparql-results+json'})
    if st!=200: raise RuntimeError('%s %s'%(st,b[:300]))
    return [{k:v['value'] for k,v in r.items()} for r in json.loads(b)['results']['bindings']]
G='https://lindas.admin.ch/foag/agricultural-market-data'; NS='https://agriculture.ld.admin.ch/foag/'; D=NS+'dimension/'
# 1 cubos FOAG
try:
    cubes=sorted(set(r['c'] for r in sparql('PREFIX cube: <https://cube.link/> SELECT DISTINCT ?c WHERE { GRAPH <%s> { ?c a cube:Cube } }'%G)))
except Exception as e: log('cubes ERR',e); cubes=[]
log('FOAG cubes',len(cubes))
lab={}
try:
    for r in sparql('PREFIX schema: <http://schema.org/> SELECT ?s ?n WHERE { GRAPH <%s> { ?s schema:name ?n . FILTER(lang(?n)="en") } }'%G): lab[r['s']]=r['n']
except Exception as e: log('labels ERR',e)
log('labels',len(lab))
for c in cubes:
    name=c.replace(NS+'cube/','')
    meas='price' if 'Price' in name else ('quantity' if 'Quantity' in name else None)
    q='PREFIX cube: <https://cube.link/> SELECT ?p (COUNT(?o) AS ?n) (MIN(?d) AS ?mn) (MAX(?d) AS ?mx) WHERE { GRAPH <%s> { <%s> cube:observationSet/cube:observation ?o . ?o <%sdate> ?d . OPTIONAL { ?o <%sproduct> ?p } } } GROUP BY ?p'%(G,c,D,D)
    try:
        rs=sparql(q)
        log('CUBE',name,'products',len(rs))
        for r in sorted(rs,key=lambda r:-int(r['n']))[:80]:
            p=r.get('p',''); log('    %s | %s | n=%s | %s..%s'%(p.replace(NS,''),lab.get(p,'?'),r['n'],r['mn'][:10],r['mx'][:10]))
    except Exception as e: log('CUBE',name,'ERR',str(e)[:200])
    time.sleep(1)
# dimensiones de mercado / origen en los cubos de carne y frutas
# 2 otros grafos LINDAS con agricultura
try:
    rs=sparql('PREFIX cube: <https://cube.link/> PREFIX schema: <http://schema.org/> SELECT ?g ?c ?n WHERE { GRAPH ?g { ?c a cube:Cube . OPTIONAL { ?c schema:name ?n . FILTER(lang(?n)="en") } } } LIMIT 3000')
    for r in rs:
        t=(r.get('n','')+' '+r['c']).lower()
        if re.search(r'agri|farm|crop|livestock|milk|cheese|butter|wine|vine|fruit|potato|sugar|cereal|grain|meat|slaughter|price index|producer price|fertil|land|bauern|landw',t): log('LINDAS',r['g'],'|',r['c'],'|',r.get('n'))
except Exception as e: log('LINDAS all ERR',str(e)[:200])
# 3 opendata.swiss
for org in ('bundesamt-fur-landwirtschaft-blw','bundesamt-fur-statistik-bfs','bundesamt-fur-zoll-und-grenzsicherheit-bazg','agroscope'):
    for start in (0,1000):
        st,b=get('https://opendata.swiss/api/3/action/package_search?fq=organization:%s&rows=1000&start=%d'%(org,start),t=200)
        if st!=200: log('ODS',org,st,b[:200]); break
        res=json.loads(b)['result']; log('ODS',org,'count',res['count'],'start',start)
        for p in res['results']:
            ti=p.get('title') or {}; t=ti.get('en') or ti.get('de') or ti.get('fr') or ''
            if org!='bundesamt-fur-statistik-bfs' or re.search(r'agri|farm|crop|livestock|milk|cheese|butter|wine|vine|fruit|potato|sugar|cereal|grain|meat|slaughter|producer price|fertil|landw|bauern|ernte|preisindex|price index',t.lower()+' '+(ti.get('de') or '').lower()):
                rights=sorted(set((r.get('rights') or '') for r in p.get('resources',[])))
                fm=sorted(set((r.get('format') or '') for r in p.get('resources',[])))
                log('   ',org[:20],'|',p.get('name'),'|',t[:110],'|',p.get('license_id') or p.get('license_title'),'|',rights,'|',fm,'|',(p.get('modified') or p.get('metadata_modified') or '')[:10])
        if res['count']<=start+1000: break
# 4 Eurostat geo=CH
ES='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
for ds,q in (('apri_pi_outq','unit=I20&p_adj=NI'),('apri_pi_outa','unit=I20&p_adj=NI'),('apro_cpsh1','strucpro=AR&strucpro=PR_HU_EU'),('aact_eaa01','unit=MIO_EUR&indic_ag=PROD_BP'),('apri_ap_crpouta','currency=EUR'),('apro_mk_pobta',''),('apro_mt_pann',''),('apro_cbs_cer','')):
    st,b=get(ES+ds+'?lang=EN&geo=CH&'+q)
    if st!=200: log('EUROSTAT',ds,st,b[:160]); continue
    j=json.loads(b); tm=list(j['dimension']['time']['category']['index']); log('EUROSTAT',ds,'values',len(j.get('value',{})),'time',tm[:1],tm[-2:],'dims',j['id'])
    if ds=='apro_cpsh1':
        cats=j['dimension']['crops']['category']; lb=cats['label']
        for code,l in lb.items():
            if re.match(r'(rice|olives|sugar beet|grapes|rape and turnip|soya)',l,re.I): log('    crop',code,l)
# 5 otras fuentes (licencias)
for u in ('https://www.agristat.ch/de/','https://www.sbv-usp.ch/de/publikationen/statistiken','https://www.tsm-gmbh.ch/de/milchstatistik','https://www.proviande.ch/de/marktinformationen','https://www.swissgranum.ch/','https://www.blw.admin.ch/de/marktbeobachtung','https://www.agrarbericht.ch/de','https://www.bfs.admin.ch/bfs/de/home/statistiken/land-forstwirtschaft.html','https://www.bfs.admin.ch/bfs/de/home/dienstleistungen/ogd/nutzungsbedingungen.html','https://opendata.swiss/en/terms-of-use'):
    st,b=get(u); txt=re.sub(rb'<[^>]+>',b' ',b); txt=re.sub(rb'\s+',b' ',txt)
    hits=[m.group(0)[:220].decode('utf-8','replace') for m in re.finditer(rb'.{0,100}(Nutzungsbedingungen|Lizenz|licen[cs]e|Copyright|kommerziell|commercial|Quellenangabe|terms_by|Open use|Opendata|Open Government).{0,100}',txt,re.I)][:6]
    xl=sorted(set(re.findall(rb'href="([^"]+\.(?:xlsx|csv|px|xls|ods))"',b)))[:15]
    log('WEB',u,st,len(b)); [log('    ',h) for h in hits]; [log('    file',x.decode()) for x in xl]
S.close()
