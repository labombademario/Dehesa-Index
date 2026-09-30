import json,re,urllib.request,html,time,csv,io
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
s=get('https://servicio.mapa.gob.es/ckan/es/dataset/esmapaindicespreciospreciopercibido')
for m in re.finditer(r'(?i)(cc-by|creative commons|licencia|license)[^<]{0,200}',s): P('LIC',m.group(0)[:200].replace('\n',' '))
d=get('https://servicio.mapa.gob.es/ckan/datastore/dump/23939af3-475f-4a4b-b18e-48fa9dbc4f3b')
P('PERCIBIDO dump',len(d))
try:
    rows=list(csv.DictReader(io.StringIO(d)))
    P(' nrows',len(rows),'cols',list(rows[0].keys()))
    for c in rows[0].keys():
        v=sorted(set(r[c] for r in rows if r[c]))
        if c in('_id',) or re.search('precio',c): P('  col',c,len(v),v[:3]); continue
        P('  col',c,len(v),v[:120])
    for r in rows[:2]+rows[-2:]: P('  row',dict(r))
    last=[r for r in rows if r['anio']==max(x['anio'] for x in rows)]
    P(' last year rows',len(last), [ (r.get('producto'),r.get('mes'),r.get('precio_mensual')) for r in last[:8]])
except Exception as e: P(' ERR',e,d[:200])
rc=get('https://servicio.mapa.gob.es/ckan/datastore/dump/687a7bb1-ddf2-4cdd-8525-05cec40c6734')
try:
    rows=list(csv.DictReader(io.StringIO(rc)))
    vs={}
    for r in rows: vs[(r['id_variable'],r['variable'],r['unidades'])]=1
    P('RECAN variables',len(vs))
    for k in list(vs)[:140]: P('  var',k)
    P(' tipos',sorted(set((r['tipo_explotacion_n1']) for r in rows))[:30])
except Exception as e: P('RECAN ERR',e)
s=get('https://servicios.ine.es/wstempus/js/ES/OPERACIONES_DISPONIBLES',5000000)
try:
    for o in json.loads(s):
        if re.search(r'agr|gan|cultiv|pesca|precio|rural|sacrific|leche|cosecha',o.get('Nombre',''),re.I): P('INE',o.get('Id'),o.get('Codigo'),o.get('Nombre'))
except Exception as e: P('INE ERR',s[:200])
s=get('https://datos.gob.es/apidata/catalog/dataset/title/lonja?_sort=title&_pageSize=50&_page=0',3000000)
P('DATOSGOB',s[:1200])
open('data/probe/es.txt','w').write('\n'.join(out))
