import json, urllib.request, urllib.parse, os, re, io, subprocess, sys, site, importlib
subprocess.run([sys.executable,'-m','pip','install','--break-system-packages','--user','-q','openpyxl'],check=False); sys.path.append(site.getusersitepackages()); importlib.invalidate_caches()
import openpyxl
os.makedirs('probe',exist_ok=True); S=open('probe/summary_ch3.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s); S.write(s+'\n'); S.flush()
UA={'User-Agent':'DehesaIndex-research/1.0 (+https://dehesaindex.com)'}
def get(u,t=150,data=None,hdr=None):
    try:
        h=dict(UA); h.update(hdr or {})
        with urllib.request.urlopen(urllib.request.Request(u,data=data,headers=h),timeout=t) as r: return r.status,r.read()
    except urllib.error.HTTPError as e: return e.code,e.read()[:2000]
    except Exception as e: return 0,repr(e).encode()[:300]
def xlsx_dump(name,b,maxrows=90):
    open('probe/'+name,'wb').write(b)
    try:
        wb=openpyxl.load_workbook(io.BytesIO(b),read_only=True,data_only=True)
        for ws in wb.worksheets[:4]:
            log('    SHEET',ws.title)
            for i,row in enumerate(ws.iter_rows(values_only=True)):
                if i>=maxrows: break
                r=[c for c in row if c is not None]
                if r: log('      ',str(r[:3])[:150],'... last',str(r[-2:])[:80])
    except Exception as e: log('    parse',repr(e)[:200])
ES='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'
st,b=get(ES+'apro_mk_pobta?lang=EN&geo=CH')
if st==200:
    j=json.loads(b); ids=j['id']; size=j['size']; cats={}; labs={}
    for d in ids:
        c=j['dimension'][d]['category']; idx=c['index']; o=[None]*len(idx)
        for k,v in (idx.items() if isinstance(idx,dict) else enumerate(idx)): o[v]=k
        cats[d]=o; labs[d]=c.get('label',{})
    last={}
    for k,v in j['value'].items():
        k=int(k); rec={}
        for d,n in reversed(list(zip(ids,size))): rec[d]=cats[d][k%n]; k//=n
        key=(rec['dairyprod'],rec['milkitem'])
        if rec['time']>last.get(key,('',0))[0]: last[key]=(rec['time'],v)
    for (dp,mi),(t,v) in sorted(last.items()): log('MKPOBTA',dp,labs['dairyprod'].get(dp),'|',mi,labs['milkitem'].get(mi),'|',t,v)
# BFS: buscar mas conjuntos
seen=set()
for q in ('Preisindizes Landwirtschaft','Produzentenpreisindex','Preisindex landwirtschaftlicher Produkte','Lagerbestand','Vorräte','Pflichtlager','Aussenhandel Landwirtschaft','Agrarhandel','Ein- und Ausfuhr','Tierbestand','Milchproduktion','Butter Käse'):
    st,b=get('https://opendata.swiss/api/3/action/package_search?rows=40&q='+urllib.parse.quote(q))
    if st!=200: continue
    for p in json.loads(b)['result']['results']:
        if p['name'] in seen: continue
        seen.add(p['name']); ti=p.get('title') or {}
        log('ODS',q,'|',(p.get('organization') or {}).get('name'),'|',p['name'],'|',(ti.get('de') or ti.get('en') or '')[:110],'|',sorted(set((r.get('rights') or '').split('#')[-1] for r in p.get('resources',[]))),'|',sorted(set(r.get('format') or '' for r in p.get('resources',[]))))
# PPI: tabla de la BFS (cc-d-05.03...) via asset search
for u in ('https://www.bfs.admin.ch/bfs/de/home/statistiken/preise/produzentenpreise-importpreise.assetdetail.html','https://www.bfs.admin.ch/bfs/de/home/statistiken/preise/produzentenpreise-importpreise/ppi.html','https://www.bfs.admin.ch/bfs/de/home/statistiken/preise/produzentenpreise-importpreise.html'):
    st,b=get(u); log('BFS page',u,st,len(b))
    for m in sorted(set(re.findall(rb'(?:/asset/de/[a-z0-9.\-]+|dam-api[^"]+master)',b)))[:40]: log('    ',m.decode())
    for m in sorted(set(re.findall(rb'title="([^"]{10,140})"',b)))[:40]:
        if re.search(rb'preis|index',m,re.I): log('    t',m.decode('utf-8','replace'))
NS='https://agriculture.ld.admin.ch/foag/'
def sparql(q):
    st,b=get('https://lindas.admin.ch/query',t=170,data=urllib.parse.urlencode({'query':q}).encode(),hdr={'Accept':'application/sparql-results+json'})
    return [{k:v['value'] for k,v in r.items()} for r in json.loads(b)['results']['bindings']] if st==200 else [{'err':str(st)}]
for pid in ('277','279','337','281','282'):
    for r in sparql('PREFIX schema: <http://schema.org/> SELECT ?n WHERE { GRAPH <https://lindas.admin.ch/foag/agricultural-market-data> { <%sproduct/%s> schema:name ?n } }'%(NS,pid)): log('FOAG label',pid,r)
for cube in ('MilkDairyProducts/Production_Index_Month','MilkDairyProducts/WholesaleProcessing_Index_Month'):
    rs=sparql('PREFIX cube: <https://cube.link/> SELECT ?d ?v ?p WHERE { GRAPH <https://lindas.admin.ch/foag/agricultural-market-data> { <%scube/%s> cube:observationSet/cube:observation ?o . ?o <%sdimension/date> ?d ; <%smeasure/index> ?v . OPTIONAL { ?o ?pp ?p . FILTER(CONTAINS(STR(?pp),"base")) } } } ORDER BY DESC(?d) LIMIT 4'%(NS,cube,NS,NS))
    log('FOAG idx',cube,rs)
    rs=sparql('SELECT DISTINCT ?pp WHERE { GRAPH <https://lindas.admin.ch/foag/agricultural-market-data> { <%scube/%s> <https://cube.link/observationSet>/<https://cube.link/observation> ?o . ?o ?pp ?x } } LIMIT 40'%(NS,cube)); log('   preds',[r.get('pp') for r in rs])
S.close()
