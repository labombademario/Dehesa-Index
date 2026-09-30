import json,re,urllib.request,time,csv,io
def get(u,n=60000000,t=120,retries=4):
    last=''
    for i in range(retries):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'})
            with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf-8-sig','replace')
        except Exception as e:
            last='ERR %s'%e; time.sleep(8)
    return last
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
for name,rid in [('PERC','23939af3-475f-4a4b-b18e-48fa9dbc4f3b'),('PAG','bb45def4-7841-4fa8-9a56-b7f959a9a951')]:
    s=get('https://servicio.mapa.gob.es/ckan/datastore/dump/'+rid)
    rows=list(csv.DictReader(io.StringIO(s)))
    P('##',name,len(rows))
    bases={}
    for r in rows: bases[r['anio_base']]=bases.get(r['anio_base'],0)+1
    P('ANIOBASE',bases)
    # duplicates
    by={}
    for r in rows: by.setdefault((r['producto'],r['anio'],r['mes']),[]).append((r['anio_base'],r['precio_mensual']))
    dup=[(k,v) for k,v in by.items() if len(v)>1]
    P('DUPKEYS',len(dup),'of',len(by))
    for k,v in dup[:12]: P('DUP',k,v)
    if name=='PERC':
        for p in ['TRIGO','CEBADA','MAIZ','LECHE VACA','CERDOS CEBADOS OTRAS RAZAS','TERNEROS/AS<12M ABASTO','CORDERO PASCUAL','POLLOS GRANJA','HUEVOS DE GALLINA','GIRASOL','VINO TINTO Y ROS-CLAR','ACEITE DE OLIVA TOTAL']:
            for y in ('2019','2024','2025','2026'):
                v=[(r['mes'],r['anio_base'],r['precio_mensual'],r['precio_anual']) for r in rows if r['producto']==p and r['anio']==y]
                P('SAMP',p,y,v[:14])
    else:
        prods={}
        for r in rows: prods.setdefault((r['categoria'],r['grupo'],r['producto']),[]).append((int(r['anio']),int(r['mes']),r['precio_mensual']))
        for k,v in sorted(prods.items()):
            v.sort(); P('PROD',k,'n=',len(v),v[0][:2],v[-1])
        for p in sorted(set(r['producto'] for r in rows))[:60]:
            v=[(r['anio'],r['mes'],r['anio_base'],r['precio_mensual']) for r in rows if r['producto']==p and r['anio'] in('2025',)]
            P('SAMP',p,v[:4])
# docs/resources listing
s=get('https://servicio.mapa.gob.es/ckan/api/3/action/package_show?id=esmapaindicespreciospreciopercibido')
try:
    d=json.loads(s)['result']
    P('RESALL',json.dumps([{k:r.get(k) for k in('name','format','url','description')} for r in d['resources']],ensure_ascii=False))
    P('TAGS',[t['name'] for t in d.get('tags',[])],'LIC',d.get('license_id'),d.get('license_title'))
except Exception as e: P('ERR',e)
# otros datasets MAPA
s=get('https://servicio.mapa.gob.es/ckan/api/3/action/package_list')
try:
    L=json.loads(s)['result']; P('PKGLIST',len(L)); P(' '.join(L))
except Exception as e: P('ERR',s[:200])
# SIAR aviso legal
for u in ['https://servicio.mapa.gob.es/websiar/AvisoLegal.aspx','https://www.mapa.gob.es/es/agricultura/temas/sistema-de-informacion-agroclimatica-para-el-regadio/aviso-legal.aspx']:
    s=get(u,500000); t=re.sub(r'<script.*?</script>|<style.*?</style>','',s,flags=re.S); t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t)
    P('SIAR',u,len(t)); P(t[:4000])
open('data/probe/es2.txt','w').write('\n'.join(out))
