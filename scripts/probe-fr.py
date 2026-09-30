import json,time,urllib.request,urllib.parse
def get(u,n=3000000,raw=False):
    for i in range(4):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*'})
            with urllib.request.urlopen(r,timeout=120) as x: b=x.read(n)
            if raw: return b
            try: return b.decode('utf-8-sig')
            except: return b.decode('latin-1')
        except Exception as e: last='ERR %s'%e; time.sleep(6)
    return last
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
A='https://www.data.gouv.fr/api/1/datasets/'
slugs=['prix-des-cereales-francaises-mise-a-jour-quotidienne','historique-des-prix-moyens-mensuels-et-trimestriels-payes-aux-producteurs-depuis-2005-cereales-et-oleoproteagineux','cotations-nationales-et-synthese-gros-bovins-vifs','incorporations-et-stocks-par-les-fabricants-daliments-pour-betail','cotations-du-reseau-des-nouvelles-des-marches-1','recapitulatif-des-cotations-viandes-bovins-veaux-ovins-equides-porcs-caprins']
def show(d,full=True):
    P('##',d.get('slug'),'|',d.get('title'))
    P(' org:',(d.get('organization') or {}).get('name'),'| license:',d.get('license'),'| freq:',d.get('frequency'),'| temporal:',json.dumps(d.get('temporal_coverage')),'| modified:',d.get('last_modified'))
    if full:
        P(' desc:',(d.get('description') or '')[:500].replace('\n',' '))
        for r in d.get('resources',[])[:25]:
            P('  RES',r.get('title'),'|',r.get('format'),'|',r.get('filesize'),'|',r.get('last_modified'),'|',r.get('url'))
for s in slugs:
    j=get(A+s+'/')
    try: show(json.loads(j))
    except Exception as e: P('ERR',s,j[:200])
# busquedas
for q in ['cotations bovins','cotations porcs','cotations ovins','prix lait producteur','prix aliments betail','prix engrais','cotations marché du porc breton','prix payés aux producteurs','RICA','cotations oeufs','cotations volailles','prix des cereales francaises','Agreste prix','FranceAgriMer cotations','indice prix produits agricoles IPPAP','IPAMPA']:
    j=get('https://www.data.gouv.fr/api/1/datasets/?q='+urllib.parse.quote(q)+'&page_size=8')
    P('#### SEARCH',q)
    try:
        for d in json.loads(j)['data']: P(' -',d['slug'],'|',(d.get('organization') or {}).get('name'),'|',d.get('license'),'|',d.get('frequency'),'|',(d.get('title') or '')[:90])
    except Exception as e: P('ERR',j[:150])
open('data/probe/fr1.txt','w').write('\n'.join(out))
